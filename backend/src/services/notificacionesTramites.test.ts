import { registrarNotificacionesTramites, type SuscriptorEventos, type TramitesConsulta } from "./notificacionesTramites";
import type { CanalNotificacion } from "../adapters/notificaciones/canalNotificacion";
import type { Tramite } from "./tramites";

class SuscriptorEventosFake implements SuscriptorEventos {
  listeners = new Map<string, (payload: unknown) => void>();
  suscribir(nombre: string, listener: (payload: unknown) => void): void {
    this.listeners.set(nombre, listener);
  }
}

function tramiteDeEjemplo(overrides: Partial<Tramite> = {}): Tramite {
  return {
    id: "tramite-1",
    tipoTramiteId: "tipo-1",
    ciudadanoId: "30123456",
    ciudadanoNombre: "Juana Pérez",
    ciudadanoEmail: "juana@example.com",
    datosFormulario: {},
    estadoActual: "pendiente",
    createdAt: new Date(),
    vistoPorAdminEn: null,
    vistoPorVecinoEn: null,
    ultimaActividadCiudadanoEn: new Date(),
    ultimaActividadAdminEn: null,
    ...overrides,
  };
}

describe("registrarNotificacionesTramites", () => {
  let eventos: SuscriptorEventosFake;
  let tramites: TramitesConsulta;
  let canalEmail: CanalNotificacion;

  beforeEach(() => {
    eventos = new SuscriptorEventosFake();
    canalEmail = { enviar: jest.fn().mockResolvedValue(undefined) };
  });

  it("al crearse un trámite, envía un email de confirmación al vecino", async () => {
    tramites = { obtenerPorId: jest.fn().mockResolvedValue(tramiteDeEjemplo()) };
    registrarNotificacionesTramites(eventos, tramites, canalEmail);

    await eventos.listeners.get("tramite.creado")?.({ tramiteId: "tramite-1" });

    expect(canalEmail.enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatario: "juana@example.com",
        mensaje: expect.stringContaining("Juana Pérez"),
      }),
    );
  });

  it("al cambiar el estado, envía un email notificando el nuevo estado", async () => {
    tramites = {
      obtenerPorId: jest.fn().mockResolvedValue(tramiteDeEjemplo({ estadoActual: "en_revision" })),
    };
    registrarNotificacionesTramites(eventos, tramites, canalEmail);

    await eventos.listeners.get("tramite.estado_cambiado")?.({
      tramiteId: "tramite-1",
      estadoAnterior: "pendiente",
      estadoNuevo: "en_revision",
    });

    expect(canalEmail.enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        destinatario: "juana@example.com",
        mensaje: expect.stringContaining("en_revision"),
      }),
    );
  });

  it("no falla si el trámite del evento ya no existe", async () => {
    tramites = { obtenerPorId: jest.fn().mockResolvedValue(null) };
    registrarNotificacionesTramites(eventos, tramites, canalEmail);

    await expect(
      eventos.listeners.get("tramite.creado")?.({ tramiteId: "no-existe" }),
    ).resolves.not.toThrow();
    expect(canalEmail.enviar).not.toHaveBeenCalled();
  });
});
