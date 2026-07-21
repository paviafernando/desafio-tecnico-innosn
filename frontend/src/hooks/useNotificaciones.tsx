import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { obtenerSocket } from "../lib/socket";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "./useSesion";
import type { NotificacionApi } from "../types/api";

export interface Notificacion {
  id: string;
  mensaje: string;
  tramiteId: string;
  leida: boolean;
  creadaEn: Date;
}

interface NotificacionesContextValue {
  notificaciones: Notificacion[];
  noLeidas: number;
  marcarTodasLeidas: () => void;
}

const NotificacionesContext = createContext<NotificacionesContextValue | undefined>(undefined);

interface PayloadEstadoCambiado {
  tramiteId: string;
  tipoTramiteNombre?: string;
  estadoNuevo: string;
}

interface PayloadCreado {
  tramiteId: string;
  tipoTramiteNombre?: string;
}

interface PayloadComentario {
  tramiteId: string;
}

function desdeApi(notificacion: NotificacionApi): Notificacion {
  return {
    id: notificacion.id,
    mensaje: notificacion.mensaje,
    tramiteId: notificacion.tramiteId,
    leida: notificacion.leida,
    creadaEn: new Date(notificacion.createdAt),
  };
}

function nuevaNotificacionLocal(tramiteId: string, mensaje: string): Notificacion {
  return { id: `local-${tramiteId}-${Date.now()}-${Math.random()}`, mensaje, tramiteId, leida: false, creadaEn: new Date() };
}

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { sesion } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    setNotificaciones([]);
    if (!sesion) return;

    apiFetch<NotificacionApi[]>("/api/notificaciones", { token: sesion.token })
      .then((recibidas) => setNotificaciones(recibidas.map(desdeApi)))
      .catch(() => {
        // Si falla la hidratación inicial, la campanita sigue funcionando en tiempo real.
      });
  }, [sesion?.token]);

  const agregar = useCallback((notificacion: Notificacion) => {
    setNotificaciones((actuales) => [notificacion, ...actuales]);
  }, []);

  useEffect(() => {
    if (!sesion) return;

    const socket = obtenerSocket();

    if (sesion.rol === "ciudadano" && sesion.dni) {
      socket.emit("suscribirse-ciudadano", sesion.dni);

      const alCambiarEstado = (payload: PayloadEstadoCambiado) => {
        const tipo = payload.tipoTramiteNombre ?? "Tu trámite";
        agregar(nuevaNotificacionLocal(payload.tramiteId, `${tipo}: cambió a estado "${payload.estadoNuevo}"`));
      };
      const alComentar = (payload: PayloadComentario) => {
        agregar(nuevaNotificacionLocal(payload.tramiteId, "Nuevo comentario en tu trámite"));
      };

      socket.on("tramite.estado_cambiado", alCambiarEstado);
      socket.on("tramite.comentario_agregado", alComentar);

      return () => {
        socket.off("tramite.estado_cambiado", alCambiarEstado);
        socket.off("tramite.comentario_agregado", alComentar);
      };
    }

    if (sesion.rol === "admin") {
      socket.emit("suscribirse-admin");

      const alCrear = (payload: PayloadCreado) => {
        const tipo = payload.tipoTramiteNombre ?? "Trámite";
        agregar(nuevaNotificacionLocal(payload.tramiteId, `Nuevo trámite: ${tipo}`));
      };

      socket.on("tramite.creado", alCrear);

      return () => {
        socket.off("tramite.creado", alCrear);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion?.rol, sesion?.dni]);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones((actuales) => actuales.map((n) => ({ ...n, leida: true })));
    if (sesion) {
      apiFetch("/api/notificaciones/marcar-leidas", { method: "PATCH", token: sesion.token }).catch(() => {
        // Si falla, la próxima carga vuelve a traer el estado real desde el servidor.
      });
    }
  }, [sesion]);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <NotificacionesContext.Provider value={{ notificaciones, noLeidas, marcarTodasLeidas }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones(): NotificacionesContextValue {
  const contexto = useContext(NotificacionesContext);
  if (!contexto) {
    throw new Error("useNotificaciones debe usarse dentro de <NotificacionesProvider>");
  }
  return contexto;
}
