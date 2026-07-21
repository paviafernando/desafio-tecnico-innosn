const URL_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface OpcionesApiFetch {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

export async function apiFetch<T = unknown>(ruta: string, opciones: OpcionesApiFetch = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (opciones.token) {
    headers.Authorization = `Bearer ${opciones.token}`;
  }

  let body: string | undefined;
  if (opciones.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opciones.body);
  }

  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    method: opciones.method ?? "GET",
    headers,
    body,
  });

  if (respuesta.status === 204) {
    return null as T;
  }

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, datos.error ?? "Error inesperado");
  }

  return datos as T;
}

export async function apiSubirArchivo(ruta: string, archivo: File, token: string | null): Promise<{ claveAlmacenamiento: string }> {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, datos.error ?? "Error al subir el archivo");
  }

  return datos;
}
