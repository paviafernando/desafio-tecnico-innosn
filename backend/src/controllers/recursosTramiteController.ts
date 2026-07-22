import type { RequestHandler } from "express";
import type { Contenedor } from "../config/contenedor";
import { tipoMimePermitido } from "../domain/recursoTramite";

export function crearRecursosTramiteController({
  recursosTramiteRepositorio,
  tramitesRepositorio,
  tiposTramiteRepositorio,
  emisorEventos,
}: Contenedor) {
  const subir: RequestHandler = async (req, res) => {
    const { nombreOriginal, claveStorage, tipoMime, tamanioBytes } = req.body;

    if (!tipoMimePermitido(tipoMime)) {
      res.status(400).json({ error: "Solo se admiten PDF o imágenes (PNG, JPEG, WEBP)" });
      return;
    }

    const tramite = await tramitesRepositorio.obtenerPorId(req.params.id);
    if (!tramite) {
      res.status(404).json({ error: "No existe el trámite" });
      return;
    }

    const adminId = req.usuario!.sub;
    const recurso = await recursosTramiteRepositorio.crear({
      tramiteId: tramite.id,
      adminId,
      nombreOriginal,
      claveStorage,
      tipoMime,
      tamanioBytes,
    });

    await tramitesRepositorio.marcarActividadAdmin(tramite.id);

    const tipo = await tiposTramiteRepositorio.obtenerPorId(tramite.tipoTramiteId);
    emisorEventos.emitir("tramite.recurso_agregado", {
      tramiteId: tramite.id,
      ciudadanoId: tramite.ciudadanoId,
      tipoTramiteNombre: tipo?.nombre,
      nombreOriginal,
    });

    res.status(201).json(recurso);
  };

  return { subir };
}
