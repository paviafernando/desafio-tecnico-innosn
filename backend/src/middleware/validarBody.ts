import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/**
 * Valida la forma del body contra un esquema de zod antes de que llegue al
 * controller/service — rechaza tipos de dato incorrectos o campos faltantes
 * con un 400 explícito, en vez de dejar que el error aparezca más adentro.
 */
export function validarBody(esquema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const resultado = esquema.safeParse(req.body);

    if (!resultado.success) {
      res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.flatten() });
      return;
    }

    req.body = resultado.data;
    next();
  };
}
