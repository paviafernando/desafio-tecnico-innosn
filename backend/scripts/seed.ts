/**
 * Carga de datos inicial: un admin de prueba, 3 tipos de trámite publicados
 * (el de referencia del enunciado + 2 secundarios que muestran la
 * genericidad del motor) y varios trámites de ejemplo de distintos vecinos
 * en distintos estados, para que la bandeja del admin no arranque vacía.
 * Idempotente: si el admin o un tipo de trámite ya existen (por nombre), no
 * los duplica. Los trámites de ejemplo sí se agregan de nuevo en cada
 * corrida si el tipo ya tenía trámites (son datos de demo, no un catálogo).
 */
import { obtenerPool, cerrarPool } from "../src/repositories/db";
import { env } from "../src/config/env";
import { AdminsPgRepositorio } from "../src/repositories/adminsPgRepositorio";
import { TiposTramitePgRepositorio } from "../src/repositories/tiposTramitePgRepositorio";
import { TramitesPgRepositorio } from "../src/repositories/tramitesPgRepositorio";
import { BcryptHashService } from "../src/adapters/seguridad/bcryptHashService";
import { TiposTramiteService, type DatosTipoTramite, type TipoTramite } from "../src/services/tiposTramite";
import { TramitesService, type EmisorEventos } from "../src/services/tramites";
import { IDENTIDADES_DE_PRUEBA } from "../src/services/selectorIdentidad";
import type { EsquemaFormulario } from "../src/domain/esquemaFormulario";
import type { FlujoEstados } from "../src/domain/flujoEstados";

const ADMIN_EMAIL = "admin@sannicolas.gob.ar";
const ADMIN_PASSWORD = "admin123";

const EMISOR_SILENCIOSO: EmisorEventos = { emitir: () => {} };

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

const esquemaCertificadoVivienda: EsquemaFormulario = {
  campos: [
    { id: "nombre_completo", etiqueta: "Nombre y apellido", tipo: "texto", requerido: true },
    {
      id: "dni",
      etiqueta: "DNI",
      tipo: "texto",
      requerido: true,
      validacion: { patron: "^[0-9]{7,8}$", mensaje: "El DNI debe tener 7 u 8 dígitos" },
    },
    { id: "email", etiqueta: "Email de contacto", tipo: "email", requerido: true },
    { id: "telefono", etiqueta: "Teléfono de contacto", tipo: "telefono", requerido: true },
    { id: "domicilio", etiqueta: "Domicilio actual", tipo: "texto", requerido: true },
    { id: "localidad", etiqueta: "Localidad", tipo: "texto", requerido: true },
    {
      id: "declaracion_jurada",
      etiqueta: "Declaro bajo juramento que no poseo otro inmueble",
      tipo: "checkbox",
      requerido: true,
    },
    {
      id: "dni_escaneado",
      etiqueta: "DNI escaneado (frente y dorso)",
      tipo: "archivo",
      requerido: true,
      validacion: { tiposPermitidos: ["application/pdf", "image/jpeg", "image/png"], tamanioMaximoMB: 10 },
    },
  ],
};

const flujoCertificadoVivienda: FlujoEstados = {
  inicial: "pendiente",
  estados: ["pendiente", "en_revision", "aprobado", "rechazado"],
  transiciones: {
    pendiente: ["en_revision"],
    en_revision: ["aprobado", "rechazado"],
    aprobado: [],
    rechazado: [],
  },
};

const esquemaPermisoEventos: EsquemaFormulario = {
  campos: [
    { id: "nombre_responsable", etiqueta: "Nombre y apellido del responsable", tipo: "texto", requerido: true },
    { id: "dni_responsable", etiqueta: "DNI del responsable", tipo: "texto", requerido: true },
    { id: "email_contacto", etiqueta: "Email de contacto", tipo: "email", requerido: true },
    { id: "telefono_contacto", etiqueta: "Teléfono de contacto", tipo: "telefono", requerido: true },
    { id: "nombre_evento", etiqueta: "Nombre del evento", tipo: "texto", requerido: true },
    { id: "fecha_evento", etiqueta: "Fecha del evento", tipo: "fecha", requerido: true },
    { id: "lugar_evento", etiqueta: "Lugar del evento", tipo: "texto", requerido: true },
    { id: "descripcion_evento", etiqueta: "Descripción del evento", tipo: "texto_largo", requerido: true },
    { id: "cantidad_asistentes", etiqueta: "Cantidad estimada de asistentes", tipo: "numero", requerido: true },
    {
      id: "tipo_evento",
      etiqueta: "Tipo de evento",
      tipo: "select",
      requerido: true,
      opciones: ["Cultural", "Musical", "Artístico", "Otro"],
    },
    {
      id: "documentacion_evento",
      etiqueta: "Plano o documentación del evento",
      tipo: "archivo",
      requerido: true,
      validacion: { tiposPermitidos: ["application/pdf", "image/jpeg", "image/png"], tamanioMaximoMB: 15 },
    },
  ],
};

const flujoPermisoEventos: FlujoEstados = {
  inicial: "pendiente",
  estados: ["pendiente", "en_revision", "intervencion_seguridad", "aprobado", "rechazado"],
  transiciones: {
    pendiente: ["en_revision"],
    en_revision: ["intervencion_seguridad", "aprobado", "rechazado"],
    intervencion_seguridad: ["aprobado", "rechazado"],
    aprobado: [],
    rechazado: [],
  },
};

const TIPOS_A_SEMBRAR: DatosTipoTramite[] = [
  {
    nombre: "Inscripción a becas deportivas",
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
  },
  {
    nombre: "Certificado de vivienda única o de no poseer bienes",
    descripcion: "Certificado municipal que acredita no poseer otro inmueble a nombre propio.",
    esquemaFormulario: esquemaCertificadoVivienda,
    flujoEstados: flujoCertificadoVivienda,
    categoria: "Catastro",
    requisitos: ["DNI"],
    pasos: ["Completar el formulario", "Esperar la validación de Catastro"],
    costo: "Gratuito",
    modalidad: "online",
    contacto: { email: "catastro@sannicolas.gob.ar" },
  },
  {
    nombre: "Solicitud de permiso para eventos culturales",
    descripcion: "Permiso municipal para la realización de eventos culturales en espacios públicos o privados.",
    esquemaFormulario: esquemaPermisoEventos,
    flujoEstados: flujoPermisoEventos,
    categoria: "Permisos y Solicitudes",
    requisitos: ["Descripción del evento", "Plano o documentación del lugar"],
    pasos: [
      "Completar el formulario",
      "Revisión inicial",
      "Intervención del área de seguridad si corresponde",
      "Resolución final",
    ],
    costo: "Según ordenanza vigente",
    modalidad: "mixta",
    contacto: { email: "cultura@sannicolas.gob.ar" },
  },
];

interface TramiteEjemplo {
  identidadIndice: number;
  datosFormulario: Record<string, unknown>;
  estadoFinal?: string;
}

const TRAMITES_DE_EJEMPLO: Record<string, TramiteEjemplo[]> = {
  "Inscripción a becas deportivas": [
    {
      identidadIndice: 0,
      datosFormulario: {
        nombre_menor: "Tomás Pérez",
        dni_menor: "45123456",
        fecha_nacimiento: "2015-03-10",
        nombre_responsable: "Juana Pérez",
        telefono_responsable: "3364000001",
        email_responsable: "juana.perez@example.com",
        club: "Fútbol",
        declaracion_jurada: true,
        ficha_medica: "seed/ficha-medica-tomas.pdf",
      },
    },
    {
      identidadIndice: 1,
      estadoFinal: "en_revision",
      datosFormulario: {
        nombre_menor: "Sofía Gómez",
        dni_menor: "46234567",
        fecha_nacimiento: "2014-07-22",
        nombre_responsable: "Martín Gómez",
        telefono_responsable: "3364000002",
        email_responsable: "martin.gomez@example.com",
        club: "Natación",
        declaracion_jurada: true,
        ficha_medica: "seed/ficha-medica-sofia.pdf",
      },
    },
    {
      identidadIndice: 2,
      estadoFinal: "aprobado",
      datosFormulario: {
        nombre_menor: "Bruno Fernández",
        dni_menor: "47345678",
        fecha_nacimiento: "2013-11-05",
        nombre_responsable: "Lucía Fernández",
        telefono_responsable: "3364000003",
        email_responsable: "lucia.fernandez@example.com",
        club: "Básquet",
        declaracion_jurada: true,
        ficha_medica: "seed/ficha-medica-bruno.pdf",
      },
    },
  ],
  "Certificado de vivienda única o de no poseer bienes": [
    {
      identidadIndice: 1,
      datosFormulario: {
        nombre_completo: "Martín Gómez",
        dni: "28987654",
        email: "martin.gomez@example.com",
        telefono: "3364000002",
        domicilio: "Av. Illia 1450",
        localidad: "San Nicolás de los Arroyos",
        declaracion_jurada: true,
        dni_escaneado: "seed/dni-martin.pdf",
      },
    },
    {
      identidadIndice: 2,
      estadoFinal: "rechazado",
      datosFormulario: {
        nombre_completo: "Lucía Fernández",
        dni: "35555444",
        email: "lucia.fernandez@example.com",
        telefono: "3364000003",
        domicilio: "Calle Mitre 890",
        localidad: "San Nicolás de los Arroyos",
        declaracion_jurada: true,
        dni_escaneado: "seed/dni-lucia.pdf",
      },
    },
  ],
  "Solicitud de permiso para eventos culturales": [
    {
      identidadIndice: 0,
      estadoFinal: "en_revision",
      datosFormulario: {
        nombre_responsable: "Juana Pérez",
        dni_responsable: "30123456",
        email_contacto: "juana.perez@example.com",
        telefono_contacto: "3364000001",
        nombre_evento: "Feria de artesanos del río",
        fecha_evento: "2026-09-15",
        lugar_evento: "Costanera Illia",
        descripcion_evento: "Feria de artesanos locales con música en vivo durante todo el fin de semana.",
        cantidad_asistentes: 500,
        tipo_evento: "Cultural",
        documentacion_evento: "seed/plano-feria-artesanos.pdf",
      },
    },
    {
      identidadIndice: 2,
      estadoFinal: "aprobado",
      datosFormulario: {
        nombre_responsable: "Lucía Fernández",
        dni_responsable: "35555444",
        email_contacto: "lucia.fernandez@example.com",
        telefono_contacto: "3364000003",
        nombre_evento: "Festival de teatro callejero",
        fecha_evento: "2026-10-03",
        lugar_evento: "Plaza San Martín",
        descripcion_evento: "Muestra de teatro callejero con compañías locales e invitadas.",
        cantidad_asistentes: 800,
        tipo_evento: "Artístico",
        documentacion_evento: "seed/plano-festival-teatro.pdf",
      },
    },
  ],
};

async function obtenerOCrearAdmin(
  adminsRepositorio: AdminsPgRepositorio,
  hasher: BcryptHashService,
  pool: ReturnType<typeof obtenerPool>,
) {
  let admin = await adminsRepositorio.obtenerPorEmail(ADMIN_EMAIL);
  if (!admin) {
    const passwordHash = await hasher.hashear(ADMIN_PASSWORD);
    await pool.query(`INSERT INTO admins (email, password_hash, nombre) VALUES ($1, $2, $3)`, [
      ADMIN_EMAIL,
      passwordHash,
      "Administrador de San Nicolás",
    ]);
    console.log(`Admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    admin = await adminsRepositorio.obtenerPorEmail(ADMIN_EMAIL);
  } else {
    console.log(`Admin ya existía: ${ADMIN_EMAIL}`);
  }
  return admin!;
}

async function obtenerOCrearTipo(
  tiposTramiteService: TiposTramiteService,
  tiposTramiteRepositorio: TiposTramitePgRepositorio,
  datos: DatosTipoTramite,
  adminId: string,
): Promise<TipoTramite> {
  const existentes = await tiposTramiteRepositorio.listar();
  const yaExiste = existentes.find((tipo) => tipo.nombre === datos.nombre);

  if (yaExiste) {
    console.log(`El tipo de trámite "${datos.nombre}" ya existía (id: ${yaExiste.id})`);
    return yaExiste;
  }

  const tipo = await tiposTramiteService.crear(datos);
  await tiposTramiteService.publicar(tipo.id, adminId);
  console.log(`Tipo de trámite creado y publicado: "${datos.nombre}" (id: ${tipo.id})`);
  return (await tiposTramiteRepositorio.obtenerPorId(tipo.id))!;
}

async function main() {
  const pool = obtenerPool(env.databaseUrl);
  const adminsRepositorio = new AdminsPgRepositorio(pool);
  const tiposTramiteRepositorio = new TiposTramitePgRepositorio(pool);
  const tiposTramiteService = new TiposTramiteService(tiposTramiteRepositorio);
  const tramitesRepositorio = new TramitesPgRepositorio(pool);
  const tramitesService = new TramitesService(tramitesRepositorio, tiposTramiteRepositorio, EMISOR_SILENCIOSO);
  const hasher = new BcryptHashService();

  const admin = await obtenerOCrearAdmin(adminsRepositorio, hasher, pool);

  const tiposCreados: TipoTramite[] = [];
  for (const datos of TIPOS_A_SEMBRAR) {
    tiposCreados.push(await obtenerOCrearTipo(tiposTramiteService, tiposTramiteRepositorio, datos, admin.id));
  }

  for (const tipo of tiposCreados) {
    const ejemplos = TRAMITES_DE_EJEMPLO[tipo.nombre] ?? [];
    const instanciasExistentes = await tramitesRepositorio.listar({ tipoTramiteId: tipo.id });
    if (instanciasExistentes.length > 0) {
      console.log(`"${tipo.nombre}" ya tiene ${instanciasExistentes.length} trámite(s) de ejemplo cargado(s).`);
      continue;
    }

    for (const ejemplo of ejemplos) {
      const identidad = IDENTIDADES_DE_PRUEBA[ejemplo.identidadIndice];
      const tramite = await tramitesService.crear({
        tipoTramiteId: tipo.id,
        ciudadanoId: identidad.dni,
        ciudadanoNombre: identidad.nombre,
        ciudadanoEmail: identidad.email,
        datosFormulario: ejemplo.datosFormulario,
      });

      if (ejemplo.estadoFinal && ejemplo.estadoFinal !== "en_revision") {
        await tramitesService.cambiarEstado(tramite.id, "en_revision", admin.id);
        await tramitesService.cambiarEstado(tramite.id, ejemplo.estadoFinal, admin.id);
      } else if (ejemplo.estadoFinal === "en_revision") {
        await tramitesService.cambiarEstado(tramite.id, "en_revision", admin.id);
      }

      console.log(
        `Trámite de ejemplo creado para "${tipo.nombre}" — ${identidad.nombre} (estado final: ${ejemplo.estadoFinal ?? "pendiente"})`,
      );
    }
  }

  await cerrarPool();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
