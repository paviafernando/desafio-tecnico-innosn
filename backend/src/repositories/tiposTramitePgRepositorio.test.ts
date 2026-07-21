import "dotenv/config";
import { Pool } from "pg";
import { TiposTramitePgRepositorio } from "./tiposTramitePgRepositorio";
import { TiposTramiteService, type DatosTipoTramite } from "../services/tiposTramite";
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

function datosValidos(): DatosTipoTramite {
  return {
    nombre: "Inscripción a becas deportivas",
    descripcion: "Inscripción de menores a becas deportivas municipales",
    esquemaFormulario: esquema,
    flujoEstados: flujo,
    categoria: "Deportes",
    costo: "Gratuito",
  };
}

describe("TiposTramitePgRepositorio (integración contra PostgreSQL real)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const repositorio = new TiposTramitePgRepositorio(pool);
  const service = new TiposTramiteService(repositorio);
  let adminId: string;

  beforeEach(async () => {
    await pool.query("TRUNCATE tramites, tipos_tramite, admins RESTART IDENTITY CASCADE");
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO admins (email, password_hash, nombre)
       VALUES ('admin-test@sannicolas.gob.ar', 'hash', 'Admin de test')
       RETURNING id`,
    );
    adminId = rows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it("persiste y recupera un tipo de trámite con su metadata y jsonb intactos", async () => {
    const creado = await service.crear(datosValidos());

    const recuperado = await repositorio.obtenerPorId(creado.id);

    expect(recuperado).not.toBeNull();
    expect(recuperado?.nombre).toBe("Inscripción a becas deportivas");
    expect(recuperado?.esquemaFormulario).toEqual(esquema);
    expect(recuperado?.flujoEstados).toEqual(flujo);
    expect(recuperado?.categoria).toBe("Deportes");
    expect(recuperado?.estado).toBe("borrador");
    expect(recuperado?.version).toBe(1);
  });

  it("publica un tipo de trámite y persiste publicadoEn/publicadoPor", async () => {
    const creado = await service.crear(datosValidos());

    const publicado = await service.publicar(creado.id, adminId);

    expect(publicado.estado).toBe("publicado");
    const recuperado = await repositorio.obtenerPorId(creado.id);
    expect(recuperado?.estado).toBe("publicado");
    expect(recuperado?.publicadoEn).toBeInstanceOf(Date);
  });

  it("contarInstancias refleja los trámites reales cargados contra ese tipo", async () => {
    const creado = await service.crear(datosValidos());
    expect(await repositorio.contarInstancias(creado.id)).toBe(0);

    await pool.query(
      `INSERT INTO tramites (tipo_tramite_id, ciudadano_id, ciudadano_nombre, ciudadano_email, datos_formulario, estado)
       VALUES ($1, 'dni-test', 'Test', 'test@example.com', '{}'::jsonb, 'pendiente')`,
      [creado.id],
    );

    expect(await repositorio.contarInstancias(creado.id)).toBe(1);
  });

  it("crea una nueva versión en borrador al editar un tipo publicado con instancias, sin tocar el original", async () => {
    const creado = await service.crear(datosValidos());
    await service.publicar(creado.id, adminId);
    await pool.query(
      `INSERT INTO tramites (tipo_tramite_id, ciudadano_id, ciudadano_nombre, ciudadano_email, datos_formulario, estado)
       VALUES ($1, 'dni-test', 'Test', 'test@example.com', '{}'::jsonb, 'pendiente')`,
      [creado.id],
    );

    const nuevaVersion = await service.editar(creado.id, { nombre: "Nuevo nombre" });

    expect(nuevaVersion.id).not.toBe(creado.id);
    expect(nuevaVersion.version).toBe(2);
    expect(nuevaVersion.tipoTramiteOrigenId).toBe(creado.id);

    const original = await repositorio.obtenerPorId(creado.id);
    expect(original?.nombre).toBe("Inscripción a becas deportivas");
    expect(original?.estado).toBe("publicado");
  });
});
