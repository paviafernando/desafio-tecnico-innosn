import { useEffect } from "react";
import { obtenerSocket } from "../lib/socket";

const EVENTOS_TRAMITE = [
  "tramite.creado",
  "tramite.estado_cambiado",
  "tramite.comentario_agregado",
  "tramite.recurso_agregado",
];

type ManejadorEvento = (nombreEvento: string, payload: unknown) => void;

function suscribirATodos(onEvento: ManejadorEvento): () => void {
  const socket = obtenerSocket();
  const listeners = EVENTOS_TRAMITE.map((nombreEvento) => {
    const listener = (payload: unknown) => onEvento(nombreEvento, payload);
    socket.on(nombreEvento, listener);
    return { nombreEvento, listener };
  });

  return () => {
    listeners.forEach(({ nombreEvento, listener }) => socket.off(nombreEvento, listener));
  };
}

/** Se suscribe a los eventos en tiempo real de un trámite puntual (para el vecino). */
export function useEventosTramite(tramiteId: string | undefined, onEvento: ManejadorEvento): void {
  useEffect(() => {
    if (!tramiteId) return;

    const socket = obtenerSocket();
    socket.emit("suscribirse-tramite", tramiteId);

    return suscribirATodos(onEvento);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tramiteId]);
}

/** Se suscribe a los eventos en tiempo real de todos los trámites (para la bandeja del admin). */
export function useEventosAdmin(onEvento: ManejadorEvento): void {
  useEffect(() => {
    const socket = obtenerSocket();
    socket.emit("suscribirse-admin");

    return suscribirATodos(onEvento);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
