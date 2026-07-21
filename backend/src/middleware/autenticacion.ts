import type { NextFunction, Request, Response } from "express";

export interface UsuarioAutenticado {
  sub: string;
  rol: string;
  [key: string]: unknown;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

export interface VerificadorJwt {
  verificar(token: string): Record<string, unknown>;
}

const PREFIJO_BEARER = "Bearer ";

export function crearMiddlewareAutenticacion(verificador: VerificadorJwt, rolesPermitidos?: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (!header?.startsWith(PREFIJO_BEARER)) {
      res.status(401).json({ error: "Falta el token de autenticación" });
      return;
    }

    const token = header.slice(PREFIJO_BEARER.length);
    let payload: Record<string, unknown>;
    try {
      payload = verificador.verificar(token);
    } catch {
      res.status(401).json({ error: "Token inválido o expirado" });
      return;
    }

    if (rolesPermitidos && !rolesPermitidos.includes(String(payload.rol))) {
      res.status(403).json({ error: "No tenés permisos para acceder a este recurso" });
      return;
    }

    req.usuario = payload as UsuarioAutenticado;
    next();
  };
}
