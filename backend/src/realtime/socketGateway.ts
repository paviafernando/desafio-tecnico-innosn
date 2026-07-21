import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import type { EmisorEventosDominio } from "./emisorEventosDominio";

interface PayloadConTramiteId {
  tramiteId: string;
  ciudadanoId?: string;
}

const SALA_ADMIN = "admin";
const salaTramite = (tramiteId: string) => `tramite:${tramiteId}`;
const salaCiudadano = (ciudadanoId: string) => `ciudadano:${ciudadanoId}`;

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

    socket.on("suscribirse-ciudadano", (ciudadanoId: string) => {
      socket.join(salaCiudadano(ciudadanoId));
    });
  });

  const reenviar = (nombreEvento: string) => (payload: unknown) => {
    const { tramiteId, ciudadanoId } = payload as PayloadConTramiteId;
    const salas = [SALA_ADMIN];
    if (tramiteId) salas.push(salaTramite(tramiteId));
    if (ciudadanoId) salas.push(salaCiudadano(ciudadanoId));

    io.to(salas).emit(nombreEvento, payload);
  };

  emisor.suscribir("tramite.creado", reenviar("tramite.creado"));
  emisor.suscribir("tramite.estado_cambiado", reenviar("tramite.estado_cambiado"));
  emisor.suscribir("tramite.comentario_agregado", reenviar("tramite.comentario_agregado"));

  return io;
}
