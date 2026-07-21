import { io, type Socket } from "socket.io-client";

const URL_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function obtenerSocket(): Socket {
  if (!socket) {
    socket = io(URL_BASE, { transports: ["websocket"] });
  }
  return socket;
}
