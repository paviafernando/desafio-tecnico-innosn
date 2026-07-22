import type { RequestHandler } from "express";
import type { Contenedor } from "../config/contenedor";
import type { DestinatarioTipo } from "../services/notificaciones";

function resolverDestinatario(usuario: { rol: string; sub: string }): {
  destinatarioTipo: DestinatarioTipo;
  destinatarioId: string | null;
} {
  return usuario.rol === "admin"
    ? { destinatarioTipo: "admin", destinatarioId: null }
    : { destinatarioTipo: "ciudadano", destinatarioId: usuario.sub };
}

export function crearNotificacionesController({ notificacionesRepositorio }: Contenedor) {
  const listar: RequestHandler = async (req, res) => {
    const { destinatarioTipo, destinatarioId } = resolverDestinatario(req.usuario!);
    const notificaciones = await notificacionesRepositorio.listar(destinatarioTipo, destinatarioId);
    res.json(notificaciones);
  };

  const marcarLeidas: RequestHandler = async (req, res) => {
    const { destinatarioTipo, destinatarioId } = resolverDestinatario(req.usuario!);
    await notificacionesRepositorio.marcarTodasLeidas(destinatarioTipo, destinatarioId);
    res.status(204).send();
  };

  const archivar: RequestHandler = async (req, res) => {
    const { destinatarioTipo, destinatarioId } = resolverDestinatario(req.usuario!);
    await notificacionesRepositorio.archivar(req.params.id, destinatarioTipo, destinatarioId);
    res.status(204).send();
  };

  return { listar, marcarLeidas, archivar };
}
