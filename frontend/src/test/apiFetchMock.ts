import { vi, type Mock } from "vitest";

export interface ApiFetchMockeado {
  (ruta: string, opciones?: unknown): Promise<unknown>;
  cola: Mock;
}

/**
 * NotificacionesProvider llama a /api/notificaciones apenas hay sesión, en
 * paralelo a las llamadas propias de cada página. Como los tests de página
 * mockean apiFetch con una cola de respuestas en el orden en que esperan que
 * se llame, esa llamada extra correría el orden. Se responde acá aparte, sin
 * consumir la cola que configura cada test.
 */
export function crearApiFetchMock(): ApiFetchMockeado {
  const cola = vi.fn();
  const apiFetch = ((ruta: string, opciones?: unknown) => {
    if (ruta === "/api/notificaciones") return Promise.resolve([]);
    if (ruta === "/api/notificaciones/marcar-leidas") return Promise.resolve(undefined);
    return cola(ruta, opciones);
  }) as ApiFetchMockeado;
  apiFetch.cola = cola;
  return apiFetch;
}
