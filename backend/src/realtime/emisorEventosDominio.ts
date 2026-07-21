import { EventEmitter } from "node:events";
import type { EmisorEventos } from "../services/tramites";

/**
 * Event emitter interno al proceso. Implementa el mismo contrato que tendría
 * un broker externo (ej. Redis pub/sub), para poder reemplazarlo sin tocar
 * a los consumidores (notificaciones, WebSockets) si el alcance lo justifica.
 */
export class EmisorEventosDominio implements EmisorEventos {
  private readonly emitter = new EventEmitter();

  emitir(nombre: string, payload: unknown): void {
    this.emitter.emit(nombre, payload);
  }

  suscribir(nombre: string, listener: (payload: unknown) => void): void {
    this.emitter.on(nombre, listener);
  }
}
