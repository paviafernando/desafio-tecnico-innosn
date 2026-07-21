import type { NextFunction, Request, Response } from "express";

const STATUS_POR_ERROR: Record<string, number> = {
  CredencialesInvalidasError: 401,
  TokenInvalidoError: 401,
  IdentidadDesconocidaError: 404,
  TipoTramiteNoEncontradoError: 404,
  TramiteNoEncontradoError: 404,
  TipoTramiteInvalidoError: 400,
  DatosFormularioInvalidosError: 400,
  ComentarioInvalidoError: 400,
  TipoTramiteArchivadoError: 409,
  EstadoTipoTramiteInvalidoError: 409,
  TipoTramiteNoDisponibleError: 409,
  TransicionInvalidaError: 409,
};

/**
 * Traduce los errores de dominio/servicios (lanzados por nombre de clase) a
 * respuestas HTTP, sin acoplar los services a Express. Cualquier error sin
 * mapear se trata como interno y no expone su mensaje original al cliente.
 */
export function manejoErrores(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const nombre = error instanceof Error ? error.constructor.name : undefined;
  const status = (nombre && STATUS_POR_ERROR[nombre]) || 500;

  if (status === 500) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
    return;
  }

  res.status(status).json({ error: (error as Error).message });
}
