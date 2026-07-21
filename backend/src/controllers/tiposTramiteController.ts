import type { RequestHandler } from "express";
import type { Contenedor } from "../config/contenedor";
import { resolverArchivosReferencia } from "../services/archivosReferencia";
import type { TipoTramite } from "../services/tiposTramite";

export function crearTiposTramiteController({ tiposTramite, tiposTramiteRepositorio, storage }: Contenedor) {
  async function conArchivosResueltos(tipo: TipoTramite): Promise<TipoTramite> {
    return { ...tipo, archivosReferencia: await resolverArchivosReferencia(tipo.archivosReferencia, storage) };
  }

  async function listaConArchivosResueltos(tipos: TipoTramite[]): Promise<TipoTramite[]> {
    return Promise.all(tipos.map(conArchivosResueltos));
  }

  const crear: RequestHandler = async (req, res) => {
    const tipo = await tiposTramite.crear(req.body);
    res.status(201).json(await conArchivosResueltos(tipo));
  };

  const editar: RequestHandler = async (req, res) => {
    const tipo = await tiposTramite.editar(req.params.id, req.body);
    res.json(await conArchivosResueltos(tipo));
  };

  const publicar: RequestHandler = async (req, res) => {
    const adminId = req.usuario!.sub;
    const tipo = await tiposTramite.publicar(req.params.id, adminId);
    res.json(await conArchivosResueltos(tipo));
  };

  const listarPublicados: RequestHandler = async (_req, res) => {
    const tipos = await tiposTramiteRepositorio.listar({ estado: "publicado" });
    res.json(await listaConArchivosResueltos(tipos));
  };

  const listarTodos: RequestHandler = async (_req, res) => {
    const tipos = await tiposTramiteRepositorio.listar();
    res.json(await listaConArchivosResueltos(tipos));
  };

  return { crear, editar, publicar, listarPublicados, listarTodos };
}
