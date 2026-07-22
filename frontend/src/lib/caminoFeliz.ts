import type { FlujoEstados } from "../types/api";

const PALABRAS_NEGATIVAS = ["rechazado", "rechazada", "denegado", "denegada", "cancelado", "cancelada"];

function esNegativo(estado: string): boolean {
  const normalizado = estado.toLowerCase();
  return PALABRAS_NEGATIVAS.some((palabra) => normalizado.includes(palabra));
}

/**
 * Reconstruye el "camino feliz" (secuencia de estados del caso normal, sin
 * rechazos ni idas y vueltas de corrección) para mostrarlo como barra de
 * progreso. En cada paso, entre las transiciones no negativas disponibles,
 * prefiere la que no vuelve hacia un estado ya visitado (eso indica que es
 * un paso de corrección tipo "documentación requerida", no parte del
 * camino principal).
 */
export function calcularCaminoFeliz(flujo: FlujoEstados): string[] {
  const camino = [flujo.inicial];
  const visitados = new Set(camino);
  let actual = flujo.inicial;

  while (true) {
    const siguientes = flujo.transiciones[actual] ?? [];
    const candidatos = siguientes.filter((estado) => !esNegativo(estado));

    if (candidatos.length === 0) break;

    const sinVuelta = candidatos.filter(
      (candidato) => !(flujo.transiciones[candidato] ?? []).some((destino) => visitados.has(destino)),
    );

    const elegido = sinVuelta[0] ?? candidatos[0];
    if (visitados.has(elegido)) break;

    camino.push(elegido);
    visitados.add(elegido);
    actual = elegido;
  }

  return camino;
}

export interface PasoBarraProgreso {
  estado: string;
  negativo: boolean;
}

/**
 * Arma los pasos a resaltar en la barra de progreso. Si el estado actual
 * pertenece al camino feliz, se muestra tal cual. Si es un estado "hermano"
 * que se ramifica desde algún paso del camino (ej. un rechazo), mostrar solo
 * el camino feliz daría la falsa impresión de que el trámite sigue en curso
 * hacia la aprobación — en vez de eso, se corta el camino en el paso donde
 * se ramificó y se agrega el estado actual al final.
 */
export function calcularPasosMostrados(flujo: FlujoEstados, estadoActual: string): PasoBarraProgreso[] {
  const camino = calcularCaminoFeliz(flujo);

  if (camino.includes(estadoActual)) {
    return camino.map((estado) => ({ estado, negativo: false }));
  }

  const indiceOrigen = camino.findLastIndex((estado) => (flujo.transiciones[estado] ?? []).includes(estadoActual));

  return [
    ...camino.slice(0, indiceOrigen + 1).map((estado) => ({ estado, negativo: false })),
    { estado: estadoActual, negativo: esNegativo(estadoActual) },
  ];
}
