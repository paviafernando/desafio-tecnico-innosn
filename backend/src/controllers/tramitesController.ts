import type { RequestHandler } from "express";
import type { Contenedor } from "../config/contenedor";
import type { Tramite } from "../services/tramites";

export function crearTramitesController({ tramites, tramitesRepositorio, tiposTramiteRepositorio }: Contenedor) {
  async function enriquecerConNombreTipo<T extends Tramite>(
    lista: T[],
  ): Promise<Array<T & { tipoTramiteNombre: string | null; tipoTramiteCategoria: string | null }>> {
    const tipos = await tiposTramiteRepositorio.listar();
    const infoPorTipo = new Map(tipos.map((tipo) => [tipo.id, { nombre: tipo.nombre, categoria: tipo.categoria }]));
    return lista.map((tramite) => ({
      ...tramite,
      tipoTramiteNombre: infoPorTipo.get(tramite.tipoTramiteId)?.nombre ?? null,
      tipoTramiteCategoria: infoPorTipo.get(tramite.tipoTramiteId)?.categoria ?? null,
    }));
  }

  const crear: RequestHandler = async (req, res) => {
    const usuario = req.usuario!;
    const tramite = await tramites.crear({
      tipoTramiteId: req.body.tipoTramiteId,
      ciudadanoId: usuario.sub,
      ciudadanoNombre: String(usuario.nombre ?? ""),
      ciudadanoEmail: String(usuario.email ?? ""),
      datosFormulario: req.body.datosFormulario ?? {},
    });
    res.status(201).json(tramite);
  };

  const obtener: RequestHandler = async (req, res) => {
    const usuario = req.usuario!;
    const tramite = await tramitesRepositorio.obtenerPorId(req.params.id);

    if (!tramite) {
      res.status(404).json({ error: "No existe el trámite" });
      return;
    }

    if (usuario.rol === "ciudadano" && tramite.ciudadanoId !== usuario.sub) {
      res.status(403).json({ error: "No tenés acceso a este trámite" });
      return;
    }

    const [tipo, comentarios, historial] = await Promise.all([
      tiposTramiteRepositorio.obtenerPorId(tramite.tipoTramiteId),
      tramitesRepositorio.listarComentarios(tramite.id),
      tramitesRepositorio.listarHistorial(tramite.id),
    ]);

    res.json({
      ...tramite,
      tipoTramiteNombre: tipo?.nombre ?? null,
      tipoTramiteCategoria: tipo?.categoria ?? null,
      comentarios,
      historial,
    });
  };

  const cambiarEstado: RequestHandler = async (req, res) => {
    const adminId = req.usuario!.sub;
    const tramite = await tramites.cambiarEstado(req.params.id, req.body.nuevoEstado, adminId);
    res.json(tramite);
  };

  const agregarComentario: RequestHandler = async (req, res) => {
    const adminId = req.usuario!.sub;
    const comentario = await tramites.agregarComentario(req.params.id, adminId, req.body.texto);
    res.status(201).json(comentario);
  };

  const listarPropios: RequestHandler = async (req, res) => {
    const usuario = req.usuario!;
    const listado = await tramitesRepositorio.listar({ ciudadanoId: usuario.sub });
    res.json(await enriquecerConNombreTipo(listado));
  };

  const listarBandeja: RequestHandler = async (req, res) => {
    const { estado, tipoTramiteId } = req.query;
    const listado = await tramitesRepositorio.listar({
      estado: typeof estado === "string" ? estado : undefined,
      tipoTramiteId: typeof tipoTramiteId === "string" ? tipoTramiteId : undefined,
    });
    res.json(await enriquecerConNombreTipo(listado));
  };

  return { crear, obtener, cambiarEstado, agregarComentario, listarPropios, listarBandeja };
}
