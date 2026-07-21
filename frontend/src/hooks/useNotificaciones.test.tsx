import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificacionesProvider, useNotificaciones } from "./useNotificaciones";
import { AuthProvider, useAuth } from "./useSesion";

const listeners = new Map<string, (payload: unknown) => void>();

const socketFake = {
  emit: vi.fn(),
  on: vi.fn((evento: string, listener: (payload: unknown) => void) => {
    listeners.set(evento, listener);
  }),
  off: vi.fn(),
};

vi.mock("../lib/socket", () => ({
  obtenerSocket: () => socketFake,
}));

function disparar(evento: string, payload: unknown) {
  listeners.get(evento)?.(payload);
}

function ComponenteDePrueba() {
  const { iniciarSesion } = useAuth();
  const { noLeidas, notificaciones, marcarTodasLeidas } = useNotificaciones();

  return (
    <div>
      <button
        onClick={() =>
          iniciarSesion({
            token: "t1",
            rol: "ciudadano",
            nombre: "Juana",
            email: "juana@example.com",
            dni: "30123456",
          })
        }
      >
        Iniciar como vecino
      </button>
      <button
        onClick={() =>
          iniciarSesion({ token: "t2", rol: "admin", nombre: "Admin", email: "admin@example.com" })
        }
      >
        Iniciar como admin
      </button>
      <p>No leídas: {noLeidas}</p>
      <ul>
        {notificaciones.map((n) => (
          <li key={n.id}>{n.mensaje}</li>
        ))}
      </ul>
      <button onClick={marcarTodasLeidas}>Marcar leídas</button>
    </div>
  );
}

function renderConProviders() {
  return render(
    <AuthProvider>
      <NotificacionesProvider>
        <ComponenteDePrueba />
      </NotificacionesProvider>
    </AuthProvider>,
  );
}

describe("NotificacionesProvider / useNotificaciones", () => {
  beforeEach(() => {
    localStorage.clear();
    listeners.clear();
    socketFake.emit.mockClear();
    socketFake.on.mockClear();
  });

  it("arranca sin notificaciones", () => {
    renderConProviders();
    expect(screen.getByText("No leídas: 0")).toBeInTheDocument();
  });

  it("el vecino se suscribe a su sala y suma una notificación cuando su trámite cambia de estado", async () => {
    const user = userEvent.setup();
    renderConProviders();

    await user.click(screen.getByText("Iniciar como vecino"));

    expect(socketFake.emit).toHaveBeenCalledWith("suscribirse-ciudadano", "30123456");

    disparar("tramite.estado_cambiado", {
      tramiteId: "t-1",
      ciudadanoId: "30123456",
      tipoTramiteNombre: "Inscripción a becas deportivas",
      estadoAnterior: "pendiente",
      estadoNuevo: "en_revision",
    });

    expect(await screen.findByText("No leídas: 1")).toBeInTheDocument();
    expect(screen.getByText(/Inscripción a becas deportivas/)).toBeInTheDocument();
  });

  it("el admin se suscribe a la sala admin y suma una notificación con cada trámite nuevo", async () => {
    const user = userEvent.setup();
    renderConProviders();

    await user.click(screen.getByText("Iniciar como admin"));

    expect(socketFake.emit).toHaveBeenCalledWith("suscribirse-admin");

    disparar("tramite.creado", {
      tramiteId: "t-2",
      ciudadanoId: "30999999",
      tipoTramiteNombre: "Certificado de vivienda única",
    });

    expect(await screen.findByText("No leídas: 1")).toBeInTheDocument();
    expect(screen.getByText(/Certificado de vivienda única/)).toBeInTheDocument();
  });

  it("marcarTodasLeidas pone el contador en cero", async () => {
    const user = userEvent.setup();
    renderConProviders();

    await user.click(screen.getByText("Iniciar como vecino"));
    disparar("tramite.estado_cambiado", {
      tramiteId: "t-1",
      ciudadanoId: "30123456",
      tipoTramiteNombre: "Inscripción a becas deportivas",
      estadoAnterior: "pendiente",
      estadoNuevo: "en_revision",
    });
    await screen.findByText("No leídas: 1");

    await user.click(screen.getByText("Marcar leídas"));

    expect(screen.getByText("No leídas: 0")).toBeInTheDocument();
  });
});
