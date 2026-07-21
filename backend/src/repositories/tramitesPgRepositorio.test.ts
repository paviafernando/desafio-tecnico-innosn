import "dotenv/config";
import { Pool } from "pg";
import { TramitesPgRepositorio } from "./tramitesPgRepositorio";
import { TiposTramitePgRepositorio } from "./tiposTramitePgRepositorio";
import { TiposTramiteService, type DatosTipoTramite } from "../services/tiposTramite";
import { TramitesService, type EmisorEventos } from "../services/tramites";
import type { EsquemaFormulario } from "../domain/esquemaFormulario";
import type { FlujoEstados } from "../domain/flujoEstados";

const esquema: EsquemaFormulario = {
  campos: [
    { id: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
    { id: "dni", etiqueta: "DNI", tipo: "texto", requerido: true },
    { id: "email", etiqueta: "Email", tipo: "email", requerido: true },
    { id: "telefono", etiqueta: "Teléfono", tipo: "telefono", requerido: true },
    { id: "domicilio", etiqueta: "Domicilio", tipo: "texto", requerido: true },
    { id: "motivo", etiqueta: "Motivo", tipo: "texto_largo", requerido: true },
    { id: "fecha_nacimiento", etiqueta: "Fecha de nacimiento", tipo: "fecha", requerido: true },
    { id: "comprobante", etiqueta: "Comprobante", tipo: "archivo", requerido: true },
  ],
};

const flujo: FlujoEstados = {
  inicial: "pendiente",
  estados: ["pendiente", "en_revision", "aprobado", "rechazado"],
  transiciones: {
    pendiente: ["en_revision"],
    en_revision: ["aprobado", "rechazado"],
    aprobado: [],
    rechazado: [],
  },
};

function datosFormularioValidos(): Record<string, unknown> {
  return {
    nombre: "Juana Pérez",
    dni: "30123456",
    email: "juana@example.com",
    telefono: "3364000000",
    domicilio: "Calle Falsa 123",
    motivo: "Quiero anotarme",
    fecha_nacimiento: "2015-01-01",
    comprobante: "storage-key-abc",
  };
}

class EmisorEventosFake implements EmisorEventos {
  emitidos: Array<{ nombre: string; payload: unknown }> = [];
  emitir(nombre: string, payload: unknown): void {
    this.emitidos.push({ nombre, payload });
  }
}

describe("TramitesPgRepositorio (integración contra PostgreSQL real)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tiposTramiteRepo = new TiposTramitePgRepositorio(pool);
  const tiposTramiteService = new TiposTramiteService(tiposTramiteRepo);
  const tramitesRepo = new TramitesPgRepositorio(pool);
  let emisor: EmisorEventosFake;
  let tramitesService: TramitesService;
  let tipoTramiteId: string;

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
    tipoTramiteId = tipo.id;

    emisor = new EmisorEventosFake();
    tramitesService = new TramitesService(tramitesRepo, tiposTramiteRepo, emisor);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("crea un trámite real, lo recupera y registra el evento de creación", async () => {
    const tramite = await tramitesService.crear({
      tipoTramiteId,
      ciudadanoId: "30123456",
      ciudadanoNombre: "Juana Pérez",
      ciudadanoEmail: "juana@example.com",
      datosFormulario: datosFormularioValidos(),
    });

    expect(tramite.estadoActual).toBe("pendiente");

    const recuperado = await tramitesRepo.obtenerPorId(tramite.id);
    expect(recuperado?.datosFormulario).toEqual(datosFormularioValidos());

    const { rows } = await pool.query(
      "SELECT * FROM eventos_historial WHERE tramite_id = $1",
      [tramite.id],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].tipo).toBe("creacion");
  });

  it("cambia el estado aplicando la máquina de estados y registra el evento", async () => {
    const tramite = await tramitesService.crear({
      tipoTramiteId,
      ciudadanoId: "30123456",
      ciudadanoNombre: "Juana Pérez",
      ciudadanoEmail: "juana@example.com",
      datosFormulario: datosFormularioValidos(),
    });

    const { rows: adminRows } = await pool.query<{ id: string }>(
      `INSERT INTO admins (email, password_hash, nombre)
       VALUES ('admin2@sannicolas.gob.ar', 'hash', 'Admin 2') RETURNING id`,
    );

    const actualizado = await tramitesService.cambiarEstado(tramite.id, "en_revision", adminRows[0].id);

    expect(actualizado.estadoActual).toBe("en_revision");
    expect(emisor.emitidos.map((e) => e.nombre)).toContain("tramite.estado_cambiado");
  });

  it("agrega un comentario asociado a un admin real", async () => {
    const tramite = await tramitesService.crear({
      tipoTramiteId,
      ciudadanoId: "30123456",
      ciudadanoNombre: "Juana Pérez",
      ciudadanoEmail: "juana@example.com",
      datosFormulario: datosFormularioValidos(),
    });

    const { rows: adminRows } = await pool.query<{ id: string }>(
      `INSERT INTO admins (email, password_hash, nombre)
       VALUES ('admin3@sannicolas.gob.ar', 'hash', 'Admin 3') RETURNING id`,
    );

    const comentario = await tramitesService.agregarComentario(tramite.id, adminRows[0].id, "Falta un dato");

    expect(comentario.texto).toBe("Falta un dato");
  });
});
