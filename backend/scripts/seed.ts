/**
 * Carga de datos inicial: un admin de prueba y el tipo de trámite de
 * referencia ("Inscripción a becas deportivas") ya publicado, para no
 * depender de cargarlo a mano antes de poder probar la aplicación.
 * Idempotente: si el admin o el tipo de trámite ya existen, no los duplica.
 */
import { obtenerPool, cerrarPool } from "../src/repositories/db";
import { env } from "../src/config/env";
import { AdminsPgRepositorio } from "../src/repositories/adminsPgRepositorio";
import { TiposTramitePgRepositorio } from "../src/repositories/tiposTramitePgRepositorio";
import { BcryptHashService } from "../src/adapters/seguridad/bcryptHashService";
import { TiposTramiteService, type DatosTipoTramite } from "../src/services/tiposTramite";
import type { EsquemaFormulario } from "../src/domain/esquemaFormulario";
import type { FlujoEstados } from "../src/domain/flujoEstados";

const ADMIN_EMAIL = "admin@sannicolas.gob.ar";
const ADMIN_PASSWORD = "admin123";
const NOMBRE_TIPO_TRAMITE = "Inscripción a becas deportivas";

const esquemaBecasDeportivas: EsquemaFormulario = {
  campos: [
    { id: "nombre_menor", etiqueta: "Nombre y apellido del menor", tipo: "texto", requerido: true },
    {
      id: "dni_menor",
      etiqueta: "DNI del menor",
      tipo: "texto",
      requerido: true,
      validacion: { patron: "^[0-9]{7,8}$", mensaje: "El DNI debe tener 7 u 8 dígitos" },
    },
    { id: "fecha_nacimiento", etiqueta: "Fecha de nacimiento", tipo: "fecha", requerido: true },
    { id: "nombre_responsable", etiqueta: "Nombre y apellido del adulto responsable", tipo: "texto", requerido: true },
    { id: "telefono_responsable", etiqueta: "Teléfono de contacto", tipo: "telefono", requerido: true },
    { id: "email_responsable", etiqueta: "Email de contacto", tipo: "email", requerido: true },
    {
      id: "club",
      etiqueta: "Club o deporte de interés",
      tipo: "select",
      requerido: true,
      opciones: ["Fútbol", "Básquet", "Natación", "Atletismo", "Otro"],
    },
    {
      id: "declaracion_jurada",
      etiqueta: "Declaro que los datos proporcionados son correctos",
      tipo: "checkbox",
      requerido: true,
    },
    {
      id: "ficha_medica",
      etiqueta: "Ficha médica",
      tipo: "archivo",
      requerido: true,
      validacion: { tiposPermitidos: ["application/pdf", "image/jpeg", "image/png"], tamanioMaximoMB: 15 },
    },
  ],
};

const flujoBecasDeportivas: FlujoEstados = {
  inicial: "pendiente",
  estados: ["pendiente", "en_revision", "documentacion_requerida", "aprobado", "rechazado"],
  transiciones: {
    pendiente: ["en_revision"],
    en_revision: ["documentacion_requerida", "aprobado", "rechazado"],
    documentacion_requerida: ["en_revision"],
    aprobado: [],
    rechazado: [],
  },
};

async function main() {
  const pool = obtenerPool(env.databaseUrl);
  const adminsRepositorio = new AdminsPgRepositorio(pool);
  const tiposTramiteRepositorio = new TiposTramitePgRepositorio(pool);
  const tiposTramiteService = new TiposTramiteService(tiposTramiteRepositorio);
  const hasher = new BcryptHashService();

  let admin = await adminsRepositorio.obtenerPorEmail(ADMIN_EMAIL);
  if (!admin) {
    const passwordHash = await hasher.hashear(ADMIN_PASSWORD);
    const { rows } = await pool.query(
      `INSERT INTO admins (email, password_hash, nombre) VALUES ($1, $2, $3) RETURNING id`,
      [ADMIN_EMAIL, passwordHash, "Administrador de San Nicolás"],
    );
    console.log(`Admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    admin = await adminsRepositorio.obtenerPorEmail(ADMIN_EMAIL);
    void rows;
  } else {
    console.log(`Admin ya existía: ${ADMIN_EMAIL}`);
  }

  const existentes = await tiposTramiteRepositorio.listar();
  const yaExiste = existentes.find((tipo) => tipo.nombre === NOMBRE_TIPO_TRAMITE);

  if (!yaExiste) {
    const datos: DatosTipoTramite = {
      nombre: NOMBRE_TIPO_TRAMITE,
      descripcion:
        "Inscripción de niños, niñas y adolescentes a las becas deportivas municipales, para acceder a disciplinas deportivas de forma gratuita.",
      esquemaFormulario: esquemaBecasDeportivas,
      flujoEstados: flujoBecasDeportivas,
      categoria: "Deportes",
      requisitos: ["DNI del menor", "Ficha médica vigente", "Datos de contacto de un adulto responsable"],
      pasos: [
        "Completar el formulario de inscripción",
        "Adjuntar la ficha médica",
        "Esperar la validación de la Secretaría de Deportes",
      ],
      costo: "Gratuito",
      modalidad: "online",
      contacto: { email: "deportes@sannicolas.gob.ar" },
    };

    const tipo = await tiposTramiteService.crear(datos);
    await tiposTramiteService.publicar(tipo.id, admin!.id);
    console.log(`Tipo de trámite creado y publicado: "${NOMBRE_TIPO_TRAMITE}" (id: ${tipo.id})`);
  } else {
    console.log(`El tipo de trámite "${NOMBRE_TIPO_TRAMITE}" ya existía (id: ${yaExiste.id})`);
  }

  await cerrarPool();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
