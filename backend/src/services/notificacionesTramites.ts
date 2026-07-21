import type { CanalNotificacion } from "../adapters/notificaciones/canalNotificacion";
import type { Tramite } from "./tramites";

export interface SuscriptorEventos {
  suscribir(nombre: string, listener: (payload: unknown) => void): void;
}

export interface TramitesConsulta {
  obtenerPorId(id: string): Promise<Tramite | null>;
}

interface PayloadTramiteCreado {
  tramiteId: string;
}

interface PayloadEstadoCambiado {
  tramiteId: string;
  estadoAnterior: string;
  estadoNuevo: string;
}

/**
 * Conecta los eventos de dominio emitidos por TramitesService con los canales
 * de notificación. Hoy solo dispara el canal email (el único con envío real
 * habilitado); sumar WhatsApp/SMS acá es agregar una llamada más por canal,
 * sin tocar el resto del diseño.
 */
export function registrarNotificacionesTramites(
  eventos: SuscriptorEventos,
  tramites: TramitesConsulta,
  canalEmail: CanalNotificacion,
): void {
  eventos.suscribir("tramite.creado", async (payload) => {
    const { tramiteId } = payload as PayloadTramiteCreado;
    const tramite = await tramites.obtenerPorId(tramiteId);
    if (!tramite) return;

    await canalEmail.enviar({
      destinatario: tramite.ciudadanoEmail,
      asunto: "Recibimos tu trámite",
      mensaje: `Hola ${tramite.ciudadanoNombre}, recibimos tu trámite y quedó en estado "${tramite.estadoActual}".`,
    });
  });

  eventos.suscribir("tramite.estado_cambiado", async (payload) => {
    const { tramiteId, estadoNuevo } = payload as PayloadEstadoCambiado;
    const tramite = await tramites.obtenerPorId(tramiteId);
    if (!tramite) return;

    await canalEmail.enviar({
      destinatario: tramite.ciudadanoEmail,
      asunto: "Tu trámite cambió de estado",
      mensaje: `Hola ${tramite.ciudadanoNombre}, tu trámite ahora está en estado "${estadoNuevo}".`,
    });
  });
}
