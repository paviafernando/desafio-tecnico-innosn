import type { RequestHandler } from "express";
import type { Contenedor } from "../config/contenedor";

export function crearAdminAuthController({ authAdmin }: Contenedor) {
  const login: RequestHandler = async (req, res) => {
    const { email, password } = req.body ?? {};
    const sesion = await authAdmin.login(email, password);
    res.json(sesion);
  };

  return { login };
}
