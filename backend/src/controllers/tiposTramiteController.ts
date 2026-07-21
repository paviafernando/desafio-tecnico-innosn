import type { RequestHandler } from "express";
import type { Contenedor } from "../config/contenedor";

export function crearTiposTramiteController({ tiposTramite, tiposTramiteRepositorio }: Contenedor) {
  const crear: RequestHandler = async (req, res) => {
    const tipo = await tiposTramite.crear(req.body);
    res.status(201).json(tipo);
  };

  const editar: RequestHandler = async (req, res) => {
    const tipo = await tiposTramite.editar(req.params.id, req.body);
    res.json(tipo);
  };

  const publicar: RequestHandler = async (req, res) => {
    const adminId = req.usuario!.sub;
    const tipo = await tiposTramite.publicar(req.params.id, adminId);
    res.json(tipo);
  };

  const listarPublicados: RequestHandler = async (_req, res) => {
    const tipos = await tiposTramiteRepositorio.listar({ estado: "publicado" });
    res.json(tipos);
  };

  const listarTodos: RequestHandler = async (_req, res) => {
    const tipos = await tiposTramiteRepositorio.listar();
    res.json(tipos);
  };

  return { crear, editar, publicar, listarPublicados, listarTodos };
}
