/**
 * Carga masiva de trámites sintéticos, para probar el scroll infinito y la
 * búsqueda server-side con volumen real, tanto en la bandeja del admin como
 * en "mis trámites" del vecino. No forma parte del seed normal (`npm run
 * seed`): es un script aparte porque su único propósito es generar volumen
 * de prueba, no datos de demo curados.
 *
 * Requiere haber corrido `npm run seed` antes (usa el tipo de trámite
 * "Inscripción a becas deportivas" ya publicado). Genera dos tandas,
 * cada una re-ejecutable sin duplicar:
 * - 250 trámites de vecinos sintéticos distintos, para la bandeja del admin.
 * - 100 trámites propios de Juana Pérez (una identidad real del seed), para
 *   poder probar el scroll/búsqueda de "mis trámites" desde ese lado.
 */
import { obtenerPool, cerrarPool } from "../src/repositories/db";
import { env } from "../src/config/env";
import { TiposTramitePgRepositorio } from "../src/repositories/tiposTramitePgRepositorio";
import { TramitesPgRepositorio } from "../src/repositories/tramitesPgRepositorio";
import { TramitesService, type EmisorEventos } from "../src/services/tramites";
import type { TipoTramite } from "../src/services/tiposTramite";

const NOMBRE_TIPO = "Inscripción a becas deportivas";
const ADMIN_ID_HISTORIAL = "seed-carga";

const EMISOR_SILENCIOSO: EmisorEventos = { emitir: () => {} };

const NOMBRES = [
  "Juan", "María", "Carlos", "Ana", "Luis", "Laura", "Diego", "Valentina", "Pedro", "Camila",
  "Jorge", "Sofía", "Marcos", "Julieta", "Fernando", "Rocío", "Gabriel", "Milagros", "Ricardo", "Agustina",
];
const APELLIDOS = [
  "González", "Rodríguez", "Fernández", "López", "Martínez", "Díaz", "Pérez", "Sánchez", "Romero", "Álvarez",
  "Torres", "Ruiz", "Flores", "Acosta", "Benítez", "Medina", "Herrera", "Suárez", "Rojas", "Molina",
];
const CLUBES = ["Fútbol", "Básquet", "Natación", "Atletismo", "Otro"];

// Ciclo de estados finales para que la búsqueda/paginación tenga variedad real.
const ESTADOS_FINALES = ["pendiente", "en_revision", "aprobado", "rechazado", "documentacion_requerida"];

function nombreCompleto(indice: number): string {
  const nombre = NOMBRES[indice % NOMBRES.length];
  const apellido = APELLIDOS[Math.floor(indice / NOMBRES.length) % APELLIDOS.length];
  return `${nombre} ${apellido}`;
}

async function llevarAEstadoFinal(
  tramitesService: TramitesService,
  tramiteId: string,
  estadoFinal: string,
): Promise<void> {
  if (estadoFinal === "pendiente") return;

  await tramitesService.cambiarEstado(tramiteId, "en_revision", ADMIN_ID_HISTORIAL);
  if (estadoFinal !== "en_revision") {
    await tramitesService.cambiarEstado(tramiteId, estadoFinal, ADMIN_ID_HISTORIAL);
  }
}

interface OpcionesCarga {
  descripcion: string;
  cantidad: number;
  tipo: TipoTramite;
  tramitesRepositorio: TramitesPgRepositorio;
  tramitesService: TramitesService;
  /** Si se fija, todos los trámites se cargan contra este mismo vecino (para probar "mis trámites"). Si no, cada uno usa un vecino sintético distinto. */
  identidadFija?: { ciudadanoId: string; ciudadanoNombre: string; ciudadanoEmail: string };
  prefijoCiudadanoId?: string;
}

async function cargarTramitesSinteticos({
  descripcion,
  cantidad,
  tipo,
  tramitesRepositorio,
  tramitesService,
  identidadFija,
  prefijoCiudadanoId,
}: OpcionesCarga): Promise<void> {
  const yaCargados = identidadFija
    ? await tramitesRepositorio.contar({ ciudadanoId: identidadFija.ciudadanoId })
    : await tramitesRepositorio
        .listar({ tipoTramiteId: tipo.id })
        .then((lista) => lista.filter((t) => t.ciudadanoId.startsWith(prefijoCiudadanoId!)).length);

  if (yaCargados >= cantidad) {
    console.log(`Ya hay ${yaCargados} trámites de "${descripcion}", no se agregan más.`);
    return;
  }

  const faltantes = cantidad - yaCargados;
  console.log(`Cargando ${faltantes} trámites de "${descripcion}"...`);

  for (let i = yaCargados; i < cantidad; i++) {
    const identidad = identidadFija ?? {
      ciudadanoId: `${prefijoCiudadanoId}${30000000 + i}`,
      ciudadanoNombre: nombreCompleto(i),
      ciudadanoEmail: `vecino${i}@example.com`,
    };

    const tramite = await tramitesService.crear({
      tipoTramiteId: tipo.id,
      ciudadanoId: identidad.ciudadanoId,
      ciudadanoNombre: identidad.ciudadanoNombre,
      ciudadanoEmail: identidad.ciudadanoEmail,
      datosFormulario: {
        nombre_menor: `Menor de ${identidad.ciudadanoNombre} (${i})`,
        dni_menor: String(45000000 + i),
        fecha_nacimiento: "2015-01-01",
        nombre_responsable: identidad.ciudadanoNombre,
        telefono_responsable: `336400${String(i).padStart(4, "0")}`,
        email_responsable: identidad.ciudadanoEmail,
        club: CLUBES[i % CLUBES.length],
        declaracion_jurada: true,
        ficha_medica: `seed/carga/ficha-medica-${i}.pdf`,
      },
    });

    await llevarAEstadoFinal(tramitesService, tramite.id, ESTADOS_FINALES[i % ESTADOS_FINALES.length]);

    if ((i + 1) % 50 === 0) {
      console.log(`  ...${i + 1}/${cantidad}`);
    }
  }

  console.log(`Listo: ${cantidad} trámites de "${descripcion}".`);
}

async function main() {
  const pool = obtenerPool(env.databaseUrl);
  const tiposTramiteRepositorio = new TiposTramitePgRepositorio(pool);
  const tramitesRepositorio = new TramitesPgRepositorio(pool);
  const tramitesService = new TramitesService(tramitesRepositorio, tiposTramiteRepositorio, EMISOR_SILENCIOSO);

  const tipos = await tiposTramiteRepositorio.listar();
  const tipo = tipos.find((t) => t.nombre === NOMBRE_TIPO && t.estado === "publicado");
  if (!tipo) {
    throw new Error(
      `No se encontró el tipo de trámite "${NOMBRE_TIPO}" publicado. Corré "npm run seed" primero.`,
    );
  }

  await cargarTramitesSinteticos({
    descripcion: "vecinos sintéticos (bandeja del admin)",
    cantidad: 250,
    tipo,
    tramitesRepositorio,
    tramitesService,
    prefijoCiudadanoId: "carga-",
  });

  await cargarTramitesSinteticos({
    descripcion: "Juana Pérez (mis trámites)",
    cantidad: 100,
    tipo,
    tramitesRepositorio,
    tramitesService,
    identidadFija: {
      ciudadanoId: "30123456",
      ciudadanoNombre: "Juana Pérez",
      ciudadanoEmail: "juana.perez@example.com",
    },
  });

  await cerrarPool();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
