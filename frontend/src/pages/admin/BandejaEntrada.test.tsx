import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BandejaEntrada from "./BandejaEntrada";
import { AuthProvider } from "../../hooks/useSesion";
import { NotificacionesProvider } from "../../hooks/useNotificaciones";
import { guardarSesion } from "../../lib/sesion";
import * as apiClient from "../../lib/apiClient";
import type { ApiFetchMockeado } from "../../test/apiFetchMock";

vi.mock("../../lib/apiClient", async () => {
  const real = await vi.importActual<typeof import("../../lib/apiClient")>("../../lib/apiClient");
  const { crearApiFetchMock } = await import("../../test/apiFetchMock");
  return { ...real, apiFetch: crearApiFetchMock() };
});

const cola = (apiClient.apiFetch as unknown as ApiFetchMockeado).cola;

vi.mock("../../hooks/useEventosTiempoReal", () => ({
  useEventosAdmin: () => {},
}));

// jsdom no implementa IntersectionObserver; se mockea para poder disparar la
// intersección manualmente y simular que el usuario llegó al final del scroll.
let observadoresCreados: Array<(entradas: Partial<IntersectionObserverEntry>[]) => void> = [];

class IntersectionObserverFake {
  callback: (entradas: Partial<IntersectionObserverEntry>[]) => void;
  constructor(callback: (entradas: Partial<IntersectionObserverEntry>[]) => void) {
    this.callback = callback;
    observadoresCreados.push(callback);
  }
  observe() {}
  disconnect() {}
}

function dispararInterseccion() {
  observadoresCreados.forEach((callback) => callback([{ isIntersecting: true }]));
}

function tramite(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "tramite-1111",
    tipoTramiteId: "tipo-1",
    tipoTramiteNombre: "Inscripción a becas deportivas",
    tipoTramiteCategoria: "Deportes",
    tipoTramiteVersion: 1,
    ciudadanoId: "1",
    ciudadanoNombre: "Juana Pérez",
    ciudadanoEmail: "j@x.com",
    datosFormulario: {},
    estadoActual: "pendiente",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPagina() {
  render(
    <AuthProvider>
      <NotificacionesProvider>
        <MemoryRouter>
          <BandejaEntrada />
        </MemoryRouter>
      </NotificacionesProvider>
    </AuthProvider>,
  );
}

describe("BandejaEntrada", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t-admin", rol: "admin", nombre: "Admin", email: "a@b.com" });
    cola.mockReset();
    observadoresCreados = [];
    vi.stubGlobal("IntersectionObserver", IntersectionObserverFake);
  });

  it("pide la primera página al backend (offset 0) al montar", async () => {
    cola.mockResolvedValueOnce({ items: [tramite()], hayMas: false });
    renderPagina();

    await screen.findByText("Juana Pérez");

    expect(cola).toHaveBeenCalledWith(
      "/api/admin/tramites?offset=0",
      expect.objectContaining({ token: "t-admin" }),
    );
  });

  it("muestra el tipo, el vecino y el estado de cada trámite", async () => {
    cola.mockResolvedValueOnce({ items: [tramite()], hayMas: false });
    renderPagina();

    expect(await screen.findByText("Juana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Inscripción a becas deportivas")).toBeInTheDocument();
    expect(screen.getByText("pendiente")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
  });

  it("al escribir en el buscador, espera la pausa y pide la búsqueda al backend desde offset 0", async () => {
    cola.mockResolvedValueOnce({ items: [tramite()], hayMas: false });
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText("Juana Pérez");

    cola.mockResolvedValueOnce({ items: [tramite({ ciudadanoNombre: "Martín Gómez" })], hayMas: false });
    await user.type(screen.getByLabelText(/buscar/i), "gómez");

    await waitFor(
      () => {
        expect(cola).toHaveBeenCalledWith(
          "/api/admin/tramites?offset=0&busqueda=g%C3%B3mez",
          expect.objectContaining({ token: "t-admin" }),
        );
      },
      { timeout: 1000 },
    );
    expect(await screen.findByText("Martín Gómez")).toBeInTheDocument();
  });

  it("al llegar al final del scroll, pide la siguiente página y agrega los resultados", async () => {
    cola.mockResolvedValueOnce({ items: [tramite()], hayMas: true });
    renderPagina();
    await screen.findByText("Juana Pérez");

    cola.mockResolvedValueOnce({
      items: [tramite({ id: "tramite-2222", ciudadanoNombre: "Martín Gómez" })],
      hayMas: false,
    });
    dispararInterseccion();

    expect(await screen.findByText("Martín Gómez")).toBeInTheDocument();
    // La página anterior sigue en pantalla: se agrega, no se reemplaza.
    expect(screen.getByText("Juana Pérez")).toBeInTheDocument();
    expect(cola).toHaveBeenCalledWith(
      "/api/admin/tramites?offset=1",
      expect.objectContaining({ token: "t-admin" }),
    );
  });

  it("no pide más páginas cuando ya no hay más resultados", async () => {
    cola.mockResolvedValueOnce({ items: [tramite()], hayMas: false });
    renderPagina();
    await screen.findByText("Juana Pérez");

    cola.mockClear();
    dispararInterseccion();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(cola).not.toHaveBeenCalled();
  });

  it("muestra un mensaje cuando no hay trámites que coincidan", async () => {
    cola.mockResolvedValueOnce({ items: [], hayMas: false });
    renderPagina();

    expect(await screen.findByText(/no hay trámites que coincidan/i)).toBeInTheDocument();
  });
});
