import type { Pool } from "pg";
import { env } from "./env";
import { AdminsPgRepositorio } from "../repositories/adminsPgRepositorio";
import { TiposTramitePgRepositorio } from "../repositories/tiposTramitePgRepositorio";
import { TramitesPgRepositorio } from "../repositories/tramitesPgRepositorio";
import { BcryptHashService } from "../adapters/seguridad/bcryptHashService";
import { JwtService } from "../adapters/seguridad/jwtService";
import { crearClienteS3, S3AlmacenamientoArchivos } from "../adapters/storage/s3AlmacenamientoArchivos";
import { EmailNotificacionAdapter } from "../adapters/notificaciones/emailNotificacionAdapter";
import { EmisorEventosDominio } from "../realtime/emisorEventosDominio";
import { AuthAdminService } from "../services/authAdmin";
import { IDENTIDADES_DE_PRUEBA, SelectorIdentidadService } from "../services/selectorIdentidad";
import { TiposTramiteService } from "../services/tiposTramite";
import { TramitesService } from "../services/tramites";
import { registrarNotificacionesTramites } from "../services/notificacionesTramites";

export function crearContenedor(pool: Pool) {
  const jwt = new JwtService(env.jwt.secreto, env.jwt.expiracion);
  const hasher = new BcryptHashService();
  const emisorEventos = new EmisorEventosDominio();

  const adminsRepositorio = new AdminsPgRepositorio(pool);
  const tiposTramiteRepositorio = new TiposTramitePgRepositorio(pool);
  const tramitesRepositorio = new TramitesPgRepositorio(pool);

  const authAdmin = new AuthAdminService(adminsRepositorio, hasher, jwt);
  const selectorIdentidad = new SelectorIdentidadService(IDENTIDADES_DE_PRUEBA, jwt);
  const tiposTramite = new TiposTramiteService(tiposTramiteRepositorio);
  const tramites = new TramitesService(tramitesRepositorio, tiposTramiteRepositorio, emisorEventos);

  const clienteS3 = crearClienteS3(env.storage);
  const storage = new S3AlmacenamientoArchivos(clienteS3, env.storage.bucket);

  const canalEmail = new EmailNotificacionAdapter();
  registrarNotificacionesTramites(emisorEventos, tramitesRepositorio, canalEmail);

  return {
    jwt,
    authAdmin,
    selectorIdentidad,
    tiposTramite,
    tramites,
    tiposTramiteRepositorio,
    tramitesRepositorio,
    storage,
    emisorEventos,
  };
}

export type Contenedor = ReturnType<typeof crearContenedor>;
