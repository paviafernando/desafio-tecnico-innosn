import "dotenv/config";
import { Pool } from "pg";
import { NotificacionesPgRepositorio } from "./notificacionesPgRepositorio";
import { TiposTramitePgRepositorio } from "./tiposTramitePgRepositorio";
import { TramitesPgRepositorio } from "./tramitesPgRepositorio";
import { TiposTramiteService, type DatosTipoTramite } from "../services/tiposTramite";
import { TramitesService, type EmisorEventos } from "../services/tramites";
import type { EsquemaFormulario } from "../domain/esquemaFormulario";
import type { FlujoEstados } from "../domain/flujoEstados";

const esquema: EsquemaFormulario = {
  campos: [{ id: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true }],
};

const flujo: FlujoEstados = {
  inicial: "pendiente",
  estados: ["pendiente", "en_revision"],
  transiciones: { pendiente: ["en_revision"], en_revision: [] },
};

class EmisorEventosFake implements EmisorEventos {
  emitir(): void {}
}

describe("NotificacionesPgRepositorio (integración contra PostgreSQL real)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tiposTramiteRepo = new TiposTramitePgRepositorio(pool);
  const tiposTramiteService = new TiposTramiteService(tiposTramiteRepo);
  const tramitesRepo = new TramitesPgRepositorio(pool);
  const tramitesService = new TramitesService(tramitesRepo, tiposTramiteRepo, new EmisorEventosFake());
  const repositorio = new NotificacionesPgRepositorio(pool);
  let tramiteId: string;

  beforeEach(async () => {
    await pool.query("TRUNCATE tramites, tipos_tramite, admins RESTART IDENTITY CASCADE");

    const tipo = await tiposTramiteService.crear({
      nombre: "Inscripción a becas deportivas",
      descripcion: "...",
      esquemaFormulario: esquema,
      flujoEstados: flujo,
    } satisfies DatosTipoTramite);

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO admins (email, password_hash, nombre)
       VALUES ('admin-test@sannicolas.gob.ar', 'hash', 'Admin de test')
       RETURNING id`,
    );
    await tiposTramiteService.publicar(tipo.id, rows[0].id);

    const tramite = await tramitesService.crear({
      tipoTramiteId: tipo.id,
      ciudadanoId: "30123456",
      ciudadanoNombre: "Juana Pérez",
      ciudadanoEmail: "juana@example.com",
      datosFormulario: { nombre: "Juana Pérez" },
    });
    tramiteId = tramite.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("crea una notificación y la lista para su destinatario", async () => {
    await repositorio.crear({
      destinatarioTipo: "ciudadano",
      destinatarioId: "30123456",
      tramiteId,
      mensaje: "Tu trámite cambió de estado",
    });

    const listado = await repositorio.listar("ciudadano", "30123456");

    expect(listado).toHaveLength(1);
    expect(listado[0]).toMatchObject({
      destinatarioTipo: "ciudadano",
      destinatarioId: "30123456",
      tramiteId,
      mensaje: "Tu trámite cambió de estado",
      leida: false,
    });
  });

  it("no incluye notificaciones de otro destinatario", async () => {
    await repositorio.crear({
      destinatarioTipo: "ciudadano",
      destinatarioId: "otro-vecino",
      tramiteId,
      mensaje: "Para otro vecino",
    });

    const listado = await repositorio.listar("ciudadano", "30123456");

    expect(listado).toHaveLength(0);
  });

  it("trata las notificaciones de admin como compartidas (destinatarioId null)", async () => {
    await repositorio.crear({
      destinatarioTipo: "admin",
      destinatarioId: null,
      tramiteId,
      mensaje: "Nuevo trámite: Inscripción a becas deportivas",
    });

    const listado = await repositorio.listar("admin", null);

    expect(listado).toHaveLength(1);
  });

  it("lista las más recientes primero", async () => {
    await repositorio.crear({
      destinatarioTipo: "ciudadano",
      destinatarioId: "30123456",
      tramiteId,
      mensaje: "Primera",
    });
    await repositorio.crear({
      destinatarioTipo: "ciudadano",
      destinatarioId: "30123456",
      tramiteId,
      mensaje: "Segunda",
    });

    const listado = await repositorio.listar("ciudadano", "30123456");

    expect(listado.map((notificacion) => notificacion.mensaje)).toEqual(["Segunda", "Primera"]);
  });

  it("marcarTodasLeidas solo afecta al destinatario indicado", async () => {
    await repositorio.crear({
      destinatarioTipo: "ciudadano",
      destinatarioId: "30123456",
      tramiteId,
      mensaje: "Para Juana",
    });
    await repositorio.crear({
      destinatarioTipo: "ciudadano",
      destinatarioId: "otro-vecino",
      tramiteId,
      mensaje: "Para otro",
    });

    await repositorio.marcarTodasLeidas("ciudadano", "30123456");

    const [deJuana] = await repositorio.listar("ciudadano", "30123456");
    const [deOtro] = await repositorio.listar("ciudadano", "otro-vecino");

    expect(deJuana.leida).toBe(true);
    expect(deOtro.leida).toBe(false);
  });
});
