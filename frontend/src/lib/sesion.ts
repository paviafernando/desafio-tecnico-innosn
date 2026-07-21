export interface Sesion {
  token: string;
  rol: "admin" | "ciudadano";
  nombre: string;
  email: string;
  dni?: string;
}

const CLAVE_STORAGE = "tramites:sesion";

export function guardarSesion(sesion: Sesion): void {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(sesion));
}

export function leerSesion(): Sesion | null {
  const guardada = localStorage.getItem(CLAVE_STORAGE);
  if (!guardada) return null;

  try {
    return JSON.parse(guardada) as Sesion;
  } catch {
    return null;
  }
}

export function borrarSesion(): void {
  localStorage.removeItem(CLAVE_STORAGE);
}
