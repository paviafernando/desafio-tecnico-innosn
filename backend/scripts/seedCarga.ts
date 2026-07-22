/**
 * Carga masiva de trámites sintéticos, para probar el scroll infinito y la
 * búsqueda server-side de la bandeja del admin con volumen real. No forma
 * parte del seed normal (`npm run seed`): es un script aparte porque su
 * único propósito es generar volumen de prueba, no datos de demo curados.
 *
 * Requiere haber corrido `npm run seed` antes (usa el tipo de trámite
 * "Inscripción a becas deportivas" ya publicado). Es re-ejecutable sin
 * duplicar: si ya hay al menos CANTIDAD_A_CARGAR trámites con el prefijo de
 * ciudadano que usa este script, no agrega más.
 */
import { obtenerPool, cerrarPool } from "../src/repositories/db";
import { env } from "../src/config/env";
import { TiposTramitePgRepositorio } from "../src/repositories/tiposTramitePgRepositorio";
import { TramitesPgRepositorio } from "../src/repositories/tramitesPgRepositorio";
import { TramitesService, type EmisorEventos } from "../src/services/tramites";

const NOMBRE_TIPO = "Inscripción a becas deportivas";
const CANTIDAD_A_CARGAR = 250;
const PREFIJO_CIUDADANO_ID = "carga-";
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

  const { rows } = await pool.query<{ total: string }>(
    "SELECT count(*) AS total FROM tramites WHERE tipo_tramite_id = $1 AND ciudadano_id LIKE $2",
    [tipo.id, `${PREFIJO_CIUDADANO_ID}%`],
  );
  const yaCargados = Number(rows[0].total);
  if (yaCargados >= CANTIDAD_A_CARGAR) {
    console.log(`Ya hay ${yaCargados} trámites de carga para "${NOMBRE_TIPO}", no se agregan más.`);
    await cerrarPool();
    return;
  }

  const faltantes = CANTIDAD_A_CARGAR - yaCargados;
  console.log(`Cargando ${faltantes} trámites sintéticos contra "${NOMBRE_TIPO}"...`);

  for (let i = yaCargados; i < CANTIDAD_A_CARGAR; i++) {
    const ciudadanoNombre = nombreCompleto(i);
    const dni = String(30000000 + i);

    const tramite = await tramitesService.crear({
      tipoTramiteId: tipo.id,
      ciudadanoId: `${PREFIJO_CIUDADANO_ID}${dni}`,
      ciudadanoNombre,
      ciudadanoEmail: `vecino${i}@example.com`,
      datosFormulario: {
        nombre_menor: `Menor de ${ciudadanoNombre}`,
        dni_menor: String(45000000 + i),
        fecha_nacimiento: "2015-01-01",
        nombre_responsable: ciudadanoNombre,
        telefono_responsable: `336400${String(i).padStart(4, "0")}`,
        email_responsable: `vecino${i}@example.com`,
        club: CLUBES[i % CLUBES.length],
        declaracion_jurada: true,
        ficha_medica: `seed/carga/ficha-medica-${i}.pdf`,
      },
    });

    await llevarAEstadoFinal(tramitesService, tramite.id, ESTADOS_FINALES[i % ESTADOS_FINALES.length]);

    if ((i + 1) % 50 === 0) {
      console.log(`  ...${i + 1}/${CANTIDAD_A_CARGAR}`);
    }
  }

  console.log(`Listo: ${CANTIDAD_A_CARGAR} trámites de carga para "${NOMBRE_TIPO}".`);
  await cerrarPool();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
