import "dotenv/config";
import { Pool } from "pg";
import { RecursosTramitePgRepositorio } from "./recursosTramitePgRepositorio";
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

describe("RecursosTramitePgRepositorio (integración contra PostgreSQL real)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tiposTramiteRepo = new TiposTramitePgRepositorio(pool);
  const tiposTramiteService = new TiposTramiteService(tiposTramiteRepo);
  const tramitesRepo = new TramitesPgRepositorio(pool);
  const tramitesService = new TramitesService(tramitesRepo, tiposTramiteRepo, new EmisorEventosFake());
  const repositorio = new RecursosTramitePgRepositorio(pool);
  let tramiteId: string;
  let adminId: string;

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
    adminId = rows[0].id;
    await tiposTramiteService.publicar(tipo.id, adminId);

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

  it("crea un recurso y lo lista para el trámite", async () => {
    await repositorio.crear({
      tramiteId,
      adminId,
      nombreOriginal: "instructivo.pdf",
      claveStorage: "recursos/abc-instructivo.pdf",
      tipoMime: "application/pdf",
      tamanioBytes: 1024,
    });

    const listado = await repositorio.listarPorTramite(tramiteId);

    expect(listado).toHaveLength(1);
    expect(listado[0]).toMatchObject({
      tramiteId,
      adminId,
      nombreOriginal: "instructivo.pdf",
      claveStorage: "recursos/abc-instructivo.pdf",
      tipoMime: "application/pdf",
      tamanioBytes: 1024,
    });
  });

  it("no incluye recursos de otro trámite", async () => {
    const otroTramite = await tramitesService.crear({
      tipoTramiteId: (await tiposTramiteRepo.listar())[0].id,
      ciudadanoId: "30999999",
      ciudadanoNombre: "Otro Vecino",
      ciudadanoEmail: "otro@example.com",
      datosFormulario: { nombre: "Otro Vecino" },
    });

    await repositorio.crear({
      tramiteId: otroTramite.id,
      adminId,
      nombreOriginal: "otro.pdf",
      claveStorage: "recursos/otro.pdf",
      tipoMime: "application/pdf",
      tamanioBytes: 512,
    });

    const listado = await repositorio.listarPorTramite(tramiteId);

    expect(listado).toHaveLength(0);
  });
});
