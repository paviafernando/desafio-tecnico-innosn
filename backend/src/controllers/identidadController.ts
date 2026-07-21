import type { RequestHandler } from "express";
import type { Contenedor } from "../config/contenedor";

/** Simula, para este desafío, el resultado de un login ya resuelto por un proveedor de identidad externo. */
export function crearIdentidadController({ selectorIdentidad }: Contenedor) {
  const listar: RequestHandler = async (_req, res) => {
    res.json(selectorIdentidad.listar());
  };

  const emitirSesion: RequestHandler = async (req, res) => {
    const { dni } = req.body ?? {};
    const sesion = selectorIdentidad.emitirSesion(dni);
    res.json(sesion);
  };

  return { listar, emitirSesion };
}
