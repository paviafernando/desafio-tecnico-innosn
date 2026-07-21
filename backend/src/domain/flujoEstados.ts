export interface FlujoEstados {
  inicial: string;
  estados: string[];
  transiciones: Record<string, string[]>;
}

export class TransicionInvalidaError extends Error {
  constructor(estadoActual: string, estadoDestino: string) {
    super(`Transición inválida: no se puede pasar de "${estadoActual}" a "${estadoDestino}"`);
    this.name = "TransicionInvalidaError";
  }
}

export function esTransicionValida(
  flujo: FlujoEstados,
  estadoActual: string,
  estadoDestino: string,
): boolean {
  if (!flujo.estados.includes(estadoActual) || !flujo.estados.includes(estadoDestino)) {
    return false;
  }
  return flujo.transiciones[estadoActual]?.includes(estadoDestino) ?? false;
}

export function aplicarTransicion(
  flujo: FlujoEstados,
  estadoActual: string,
  estadoDestino: string,
): string {
  if (!esTransicionValida(flujo, estadoActual, estadoDestino)) {
    throw new TransicionInvalidaError(estadoActual, estadoDestino);
  }
  return estadoDestino;
}

export function validarFlujoEstados(flujo: FlujoEstados): string[] {
  const errores: string[] = [];

  if (flujo.estados.length === 0) {
    errores.push("El flujo debe tener al menos un estado");
  }

  if (!flujo.estados.includes(flujo.inicial)) {
    errores.push(`El estado inicial "${flujo.inicial}" no está en la lista de estados`);
  }

  for (const [origen, destinos] of Object.entries(flujo.transiciones)) {
    if (!flujo.estados.includes(origen)) {
      errores.push(`El estado "${origen}" en transiciones no está en la lista de estados`);
    }
    for (const destino of destinos) {
      if (!flujo.estados.includes(destino)) {
        errores.push(
          `La transición desde "${origen}" hacia "${destino}" apunta a un estado que no existe`,
        );
      }
    }
  }

  return errores;
}
