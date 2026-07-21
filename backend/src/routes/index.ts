import { Router } from "express";
import multer from "multer";
import type { Contenedor } from "../config/contenedor";
import { asyncHandler } from "../middleware/asyncHandler";
import { crearMiddlewareAutenticacion } from "../middleware/autenticacion";
import { validarBody } from "../middleware/validarBody";
import { crearAdminAuthController } from "../controllers/adminAuthController";
import { crearIdentidadController } from "../controllers/identidadController";
import { crearTiposTramiteController } from "../controllers/tiposTramiteController";
import { crearTramitesController } from "../controllers/tramitesController";
import { crearArchivosController } from "../controllers/archivosController";
import { crearNotificacionesController } from "../controllers/notificacionesController";
import { crearRecursosTramiteController } from "../controllers/recursosTramiteController";
import {
  cambiarEstadoSchema,
  comentarioSchema,
  crearRecursoSchema,
  crearTipoTramiteSchema,
  crearTramiteSchema,
  editarTipoTramiteSchema,
  emitirSesionSchema,
  loginAdminSchema,
} from "./esquemasValidacion";

const TAMANIO_MAXIMO_ARCHIVO_BYTES = 15 * 1024 * 1024; // 15 MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: TAMANIO_MAXIMO_ARCHIVO_BYTES } });

export function crearRouter(contenedor: Contenedor): Router {
  const router = Router();

  const autenticado = crearMiddlewareAutenticacion(contenedor.jwt);
  const soloAdmin = crearMiddlewareAutenticacion(contenedor.jwt, ["admin"]);
  const soloCiudadano = crearMiddlewareAutenticacion(contenedor.jwt, ["ciudadano"]);

  const adminAuth = crearAdminAuthController(contenedor);
  router.post("/admin/auth/login", validarBody(loginAdminSchema), asyncHandler(adminAuth.login));

  const identidad = crearIdentidadController(contenedor);
  router.get("/ciudadano/identidades", asyncHandler(identidad.listar));
  router.post(
    "/ciudadano/auth/sesion",
    validarBody(emitirSesionSchema),
    asyncHandler(identidad.emitirSesion),
  );

  const tiposTramite = crearTiposTramiteController(contenedor);
  router.get("/tipos-tramite", autenticado, asyncHandler(tiposTramite.listarPublicados));
  router.get("/admin/tipos-tramite", soloAdmin, asyncHandler(tiposTramite.listarTodos));
  router.post(
    "/admin/tipos-tramite",
    soloAdmin,
    validarBody(crearTipoTramiteSchema),
    asyncHandler(tiposTramite.crear),
  );
  router.patch(
    "/admin/tipos-tramite/:id",
    soloAdmin,
    validarBody(editarTipoTramiteSchema),
    asyncHandler(tiposTramite.editar),
  );
  router.post("/admin/tipos-tramite/:id/publicar", soloAdmin, asyncHandler(tiposTramite.publicar));

  const archivos = crearArchivosController(contenedor);
  router.post("/archivos", autenticado, upload.single("archivo"), asyncHandler(archivos.subir));

  const tramites = crearTramitesController(contenedor);
  router.post(
    "/tramites",
    soloCiudadano,
    validarBody(crearTramiteSchema),
    asyncHandler(tramites.crear),
  );
  router.get("/tramites/mios", soloCiudadano, asyncHandler(tramites.listarPropios));
  router.get("/tramites/:id", autenticado, asyncHandler(tramites.obtener));
  router.patch(
    "/tramites/:id/estado",
    soloAdmin,
    validarBody(cambiarEstadoSchema),
    asyncHandler(tramites.cambiarEstado),
  );
  router.post(
    "/tramites/:id/comentarios",
    soloAdmin,
    validarBody(comentarioSchema),
    asyncHandler(tramites.agregarComentario),
  );
  router.get("/admin/tramites", soloAdmin, asyncHandler(tramites.listarBandeja));

  const recursosTramite = crearRecursosTramiteController(contenedor);
  router.post(
    "/tramites/:id/recursos",
    soloAdmin,
    validarBody(crearRecursoSchema),
    asyncHandler(recursosTramite.subir),
  );

  const notificaciones = crearNotificacionesController(contenedor);
  router.get("/notificaciones", autenticado, asyncHandler(notificaciones.listar));
  router.patch("/notificaciones/marcar-leidas", autenticado, asyncHandler(notificaciones.marcarLeidas));

  return router;
}
