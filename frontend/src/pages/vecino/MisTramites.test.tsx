import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MisTramites from "./MisTramites";
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
    id: "tramite-1",
    tipoTramiteId: "tipo-1",
    tipoTramiteNombre: "Inscripción a becas deportivas",
    ciudadanoId: "1",
    ciudadanoNombre: "Juana",
    ciudadanoEmail: "j@x.com",
    datosFormulario: {},
    estadoActual: "en_revision",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPagina() {
  render(
    <AuthProvider>
      <NotificacionesProvider>
        <MemoryRouter>
          <MisTramites />
        </MemoryRouter>
      </NotificacionesProvider>
    </AuthProvider>,
  );
}

describe("MisTramites", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t1", rol: "ciudadano", nombre: "Juana", email: "j@x.com", dni: "1" });
    cola.mockReset();
    observadoresCreados = [];
    vi.stubGlobal("IntersectionObserver", IntersectionObserverFake);
  });

  it("muestra un mensaje si el vecino todavía no tiene trámites", async () => {
    cola.mockResolvedValueOnce({ items: [], hayMas: false });
    renderPagina();

    expect(await screen.findByText(/todavía no cargaste/i)).toBeInTheDocument();
  });

  it("lista los trámites del vecino con su tipo y estado", async () => {
    cola.mockResolvedValueOnce({ items: [tramite()], hayMas: false });

    renderPagina();

    expect(await screen.findByText("Inscripción a becas deportivas")).toBeInTheDocument();
    expect(screen.getByText("en revision")).toBeInTheDocument();
  });

  it("pide la primera página al backend (offset 0) al montar", async () => {
    cola.mockResolvedValueOnce({ items: [tramite()], hayMas: false });
    renderPagina();

    await screen.findByText("Inscripción a becas deportivas");

    expect(cola).toHaveBeenCalledWith("/api/tramites/mios?offset=0", expect.objectContaining({ token: "t1" }));
  });

  it("al escribir en el buscador, espera la pausa y pide la búsqueda al backend desde offset 0", async () => {
    cola.mockResolvedValueOnce({ items: [tramite()], hayMas: false });
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText("Inscripción a becas deportivas");

    cola.mockResolvedValueOnce({
      items: [tramite({ id: "tramite-2", tipoTramiteNombre: "Certificado de vivienda única" })],
      hayMas: false,
    });
    await user.type(screen.getByLabelText(/buscar/i), "vivienda");

    await waitFor(
      () => {
        expect(cola).toHaveBeenCalledWith(
          "/api/tramites/mios?offset=0&busqueda=vivienda",
          expect.objectContaining({ token: "t1" }),
        );
      },
      { timeout: 1000 },
    );
    expect(await screen.findByText("Certificado de vivienda única")).toBeInTheDocument();
  });

  it("al llegar al final del scroll, pide la siguiente página y agrega los resultados", async () => {
    cola.mockResolvedValueOnce({ items: [tramite()], hayMas: true });
    renderPagina();
    await screen.findByText("Inscripción a becas deportivas");

    cola.mockResolvedValueOnce({
      items: [tramite({ id: "tramite-2", tipoTramiteNombre: "Certificado de vivienda única" })],
      hayMas: false,
    });
    dispararInterseccion();

    expect(await screen.findByText("Certificado de vivienda única")).toBeInTheDocument();
    expect(screen.getByText("Inscripción a becas deportivas")).toBeInTheDocument();
    expect(cola).toHaveBeenCalledWith("/api/tramites/mios?offset=1", expect.objectContaining({ token: "t1" }));
  });
});
