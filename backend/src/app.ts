import cors from "cors";
import express, { type Express } from "express";
import type { Pool } from "pg";
import { crearContenedor, type Contenedor } from "./config/contenedor";
import { manejoErrores } from "./middleware/manejoErrores";
import { crearRouter } from "./routes";

export function crearAppDesdeContenedor(contenedor: Contenedor): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", crearRouter(contenedor));

  app.use(manejoErrores);

  return app;
}

export function crearApp(pool: Pool): Express {
  return crearAppDesdeContenedor(crearContenedor(pool));
}
