import type { RequestHandler } from "express";
import type { Contenedor } from "../config/contenedor";

export function crearArchivosController({ storage }: Contenedor) {
  const subir: RequestHandler = async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Falta el archivo a subir" });
      return;
    }

    const archivo = await storage.subir({
      nombreOriginal: req.file.originalname,
      mimeType: req.file.mimetype,
      contenido: req.file.buffer,
    });

    res.status(201).json(archivo);
  };

  return { subir };
}
