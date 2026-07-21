import type { NotificacionesRepositorio } from "./notificaciones";

export interface SuscriptorEventos {
  suscribir(nombre: string, listener: (payload: unknown) => void): void;
}

interface PayloadTramiteCreado {
  tramiteId: string;
  tipoTramiteNombre?: string;
}

interface PayloadEstadoCambiado {
  tramiteId: string;
  ciudadanoId: string;
  tipoTramiteNombre?: string;
  estadoNuevo: string;
}

interface PayloadComentarioAgregado {
  tramiteId: string;
  ciudadanoId: string;
  tipoTramiteNombre?: string;
}

interface PayloadRecursoAgregado {
  tramiteId: string;
  ciudadanoId: string;
  nombreOriginal: string;
}

/**
 * Persiste en la base la misma información que ya se difunde por WebSocket
 * (ver socketGateway.ts), para que la campanita pueda hidratarse al cargar la
 * página en vez de depender de que el destinatario estuviera conectado en el
 * momento exacto del evento.
 */
export function registrarNotificacionesPersistentes(
  eventos: SuscriptorEventos,
  notificaciones: NotificacionesRepositorio,
): void {
  eventos.suscribir("tramite.creado", async (payload) => {
    const { tramiteId, tipoTramiteNombre } = payload as PayloadTramiteCreado;
    await notificaciones.crear({
      destinatarioTipo: "admin",
      destinatarioId: null,
      tramiteId,
      mensaje: `Nuevo trámite: ${tipoTramiteNombre ?? "sin nombre"}`,
    });
  });

  eventos.suscribir("tramite.estado_cambiado", async (payload) => {
    const { tramiteId, ciudadanoId, tipoTramiteNombre, estadoNuevo } = payload as PayloadEstadoCambiado;
    const tipo = tipoTramiteNombre ?? "Tu trámite";
    await notificaciones.crear({
      destinatarioTipo: "ciudadano",
      destinatarioId: ciudadanoId,
      tramiteId,
      mensaje: `${tipo}: cambió a estado "${estadoNuevo}"`,
    });
  });

  eventos.suscribir("tramite.comentario_agregado", async (payload) => {
    const { tramiteId, ciudadanoId, tipoTramiteNombre } = payload as PayloadComentarioAgregado;
    const tipo = tipoTramiteNombre ?? "tu trámite";
    await notificaciones.crear({
      destinatarioTipo: "ciudadano",
      destinatarioId: ciudadanoId,
      tramiteId,
      mensaje: `Nuevo comentario en ${tipo}`,
    });
  });

  eventos.suscribir("tramite.recurso_agregado", async (payload) => {
    const { tramiteId, ciudadanoId, nombreOriginal } = payload as PayloadRecursoAgregado;
    await notificaciones.crear({
      destinatarioTipo: "ciudadano",
      destinatarioId: ciudadanoId,
      tramiteId,
      mensaje: `Nuevo documento disponible: ${nombreOriginal}`,
    });
  });
}
