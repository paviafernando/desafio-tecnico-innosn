import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import type { EmisorEventosDominio } from "./emisorEventosDominio";

interface PayloadConTramiteId {
  tramiteId: string;
}

const SALA_ADMIN = "admin";
const salaTramite = (tramiteId: string) => `tramite:${tramiteId}`;

/**
 * Difunde en tiempo real los eventos que ya dispara TramitesService (mismo
 * EmisorEventosDominio que usan las notificaciones), sin acoplar el gateway
 * a la lógica de negocio: solo escucha y reenvía por WebSocket.
 */
export function crearSocketGateway(httpServer: HttpServer, emisor: EmisorEventosDominio): SocketIOServer {
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    socket.on("suscribirse-tramite", (tramiteId: string) => {
      socket.join(salaTramite(tramiteId));
    });

    socket.on("suscribirse-admin", () => {
      socket.join(SALA_ADMIN);
    });
  });

  const reenviar = (nombreEvento: string) => (payload: unknown) => {
    io.to(SALA_ADMIN).emit(nombreEvento, payload);
    const { tramiteId } = payload as PayloadConTramiteId;
    if (tramiteId) {
      io.to(salaTramite(tramiteId)).emit(nombreEvento, payload);
    }
  };

  emisor.suscribir("tramite.creado", reenviar("tramite.creado"));
  emisor.suscribir("tramite.estado_cambiado", reenviar("tramite.estado_cambiado"));
  emisor.suscribir("tramite.comentario_agregado", reenviar("tramite.comentario_agregado"));

  return io;
}
