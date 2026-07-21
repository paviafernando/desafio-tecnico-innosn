import type { EmisorJwt } from "./authAdmin";

export interface IdentidadCiudadana {
  dni: string;
  nombre: string;
  email: string;
}

export class IdentidadDesconocidaError extends Error {
  constructor(dni: string) {
    super(`No existe una identidad de prueba con DNI "${dni}"`);
    this.name = "IdentidadDesconocidaError";
  }
}

export interface SesionCiudadana {
  token: string;
  identidad: IdentidadCiudadana;
}

/**
 * Representa, para este desafío, la emisión de sesión que en producción
 * resolvería un proveedor de identidad externo al proyecto.
 */
export class SelectorIdentidadService {
  constructor(
    private readonly identidades: IdentidadCiudadana[],
    private readonly jwt: EmisorJwt,
  ) {}

  listar(): IdentidadCiudadana[] {
    return this.identidades;
  }

  emitirSesion(dni: string): SesionCiudadana {
    const identidad = this.identidades.find((i) => i.dni === dni);
    if (!identidad) {
      throw new IdentidadDesconocidaError(dni);
    }

    const token = this.jwt.firmar({
      sub: identidad.dni,
      nombre: identidad.nombre,
      email: identidad.email,
      rol: "ciudadano",
    });

    return { token, identidad };
  }
}

export const IDENTIDADES_DE_PRUEBA: IdentidadCiudadana[] = [
  { dni: "30123456", nombre: "Juana Pérez", email: "juana.perez@example.com" },
  { dni: "28987654", nombre: "Martín Gómez", email: "martin.gomez@example.com" },
  { dni: "35555444", nombre: "Lucía Fernández", email: "lucia.fernandez@example.com" },
];
