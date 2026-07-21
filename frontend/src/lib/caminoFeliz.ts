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
