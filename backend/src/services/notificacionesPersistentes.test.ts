import {
  registrarNotificacionesPersistentes,
  type SuscriptorEventos,
} from "./notificacionesPersistentes";
import type { DatosCrearNotificacion, Notificacion, NotificacionesRepositorio } from "./notificaciones";

class SuscriptorEventosFake implements SuscriptorEventos {
  listeners = new Map<string, (payload: unknown) => void>();
  suscribir(nombre: string, listener: (payload: unknown) => void): void {
    this.listeners.set(nombre, listener);
  }
}

class NotificacionesRepositorioFake implements NotificacionesRepositorio {
  creadas: DatosCrearNotificacion[] = [];

  async crear(datos: DatosCrearNotificacion): Promise<Notificacion> {
    this.creadas.push(datos);
    return { id: "notif-1", leida: false, createdAt: new Date(), ...datos };
  }

  async listar(): Promise<Notificacion[]> {
    return [];
  }

  async marcarTodasLeidas(): Promise<void> {}
}

describe("registrarNotificacionesPersistentes", () => {
  let eventos: SuscriptorEventosFake;
  let repositorio: NotificacionesRepositorioFake;

  beforeEach(() => {
    eventos = new SuscriptorEventosFake();
    repositorio = new NotificacionesRepositorioFake();
    registrarNotificacionesPersistentes(eventos, repositorio);
  });

  it("al crearse un trámite, persiste una notificación compartida para los admins", async () => {
    await eventos.listeners.get("tramite.creado")?.({
      tramiteId: "tramite-1",
      ciudadanoId: "30123456",
      tipoTramiteNombre: "Inscripción a becas deportivas",
    });

    expect(repositorio.creadas).toEqual([
      {
        destinatarioTipo: "admin",
        destinatarioId: null,
        tramiteId: "tramite-1",
        mensaje: expect.stringContaining("Inscripción a becas deportivas"),
      },
    ]);
  });

  it("al cambiar el estado, persiste una notificación para el vecino dueño del trámite", async () => {
    await eventos.listeners.get("tramite.estado_cambiado")?.({
      tramiteId: "tramite-1",
      ciudadanoId: "30123456",
      tipoTramiteNombre: "Inscripción a becas deportivas",
      estadoAnterior: "pendiente",
      estadoNuevo: "en_revision",
    });

    expect(repositorio.creadas).toEqual([
      {
        destinatarioTipo: "ciudadano",
        destinatarioId: "30123456",
        tramiteId: "tramite-1",
        mensaje: expect.stringContaining("en_revision"),
      },
    ]);
  });

  it("al agregar un comentario, persiste una notificación para el vecino dueño del trámite", async () => {
    await eventos.listeners.get("tramite.comentario_agregado")?.({
      tramiteId: "tramite-1",
      ciudadanoId: "30123456",
      comentarioId: "comentario-1",
    });

    expect(repositorio.creadas).toEqual([
      {
        destinatarioTipo: "ciudadano",
        destinatarioId: "30123456",
        tramiteId: "tramite-1",
        mensaje: expect.stringContaining("comentario"),
      },
    ]);
  });
});
