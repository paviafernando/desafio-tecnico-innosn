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

function respuesta(
  items: ReturnType<typeof tramite>[],
  opciones: { hayMas?: boolean; total?: number; totalSinFiltro?: number } = {},
) {
  return {
    items,
    hayMas: opciones.hayMas ?? false,
    total: opciones.total ?? items.length,
    totalSinFiltro: opciones.totalSinFiltro ?? opciones.total ?? items.length,
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
    cola.mockResolvedValueOnce(respuesta([tramite()]));
    renderPagina();

    await screen.findByText("Juana Pérez");

    expect(cola).toHaveBeenCalledWith(
      "/api/admin/tramites?offset=0",
      expect.objectContaining({ token: "t-admin" }),
    );
  });

  it("muestra el tipo, el vecino y el estado de cada trámite", async () => {
    cola.mockResolvedValueOnce(respuesta([tramite()]));
    renderPagina();

    expect(await screen.findByText("Juana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Inscripción a becas deportivas")).toBeInTheDocument();
    expect(screen.getByText("pendiente")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
  });

  it("al escribir en el buscador, espera la pausa y pide la búsqueda al backend desde offset 0", async () => {
    cola.mockResolvedValueOnce(respuesta([tramite()]));
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText("Juana Pérez");

    cola.mockResolvedValueOnce(respuesta([tramite({ ciudadanoNombre: "Martín Gómez" })]));
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
    cola.mockResolvedValueOnce(respuesta([tramite()], { hayMas: true, total: 2, totalSinFiltro: 2 }));
    renderPagina();
    await screen.findByText("Juana Pérez");

    cola.mockResolvedValueOnce(
      respuesta([tramite({ id: "tramite-2222", ciudadanoNombre: "Martín Gómez" })], { total: 2, totalSinFiltro: 2 }),
    );
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
    cola.mockResolvedValueOnce(respuesta([tramite()]));
    renderPagina();
    await screen.findByText("Juana Pérez");

    cola.mockClear();
    dispararInterseccion();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(cola).not.toHaveBeenCalled();
  });

  it("muestra un mensaje cuando no hay trámites que coincidan", async () => {
    cola.mockResolvedValueOnce(respuesta([]));
    renderPagina();

    expect(await screen.findByText(/no hay trámites que coincidan/i)).toBeInTheDocument();
  });

  it("muestra un esqueleto de carga antes de que llegue la primera respuesta", () => {
    cola.mockImplementationOnce(() => new Promise(() => {})); // nunca resuelve
    renderPagina();

    expect(screen.getByTestId("esqueleto-tabla")).toBeInTheDocument();
  });

  it("muestra el contador de resultados mostrados y el total", async () => {
    cola.mockResolvedValueOnce(respuesta([tramite()], { hayMas: true, total: 355, totalSinFiltro: 355 }));
    renderPagina();

    expect(await screen.findByText("355 trámites")).toBeInTheDocument();
  });

  it("el contador aclara el total general cuando la búsqueda filtra resultados", async () => {
    cola.mockResolvedValueOnce(respuesta([tramite()], { total: 355, totalSinFiltro: 355 }));
    const user = userEvent.setup();
    renderPagina();
    await screen.findByText("Juana Pérez");

    cola.mockResolvedValueOnce(
      respuesta([tramite({ ciudadanoNombre: "Martín Gómez" })], { total: 2, totalSinFiltro: 355 }),
    );
    await user.type(screen.getByLabelText(/buscar/i), "gómez");

    expect(await screen.findByText("2 resultados de 355 en total")).toBeInTheDocument();
  });

  it("destaca los trámites que necesitan atención del admin y no los que ya fueron revisados", async () => {
    cola.mockResolvedValueOnce(
      respuesta([
        tramite({ id: "tramite-1111", ciudadanoNombre: "Juana Pérez", requiereAtencion: true }),
        tramite({ id: "tramite-2222", ciudadanoNombre: "Martín Gómez", requiereAtencion: false }),
      ]),
    );
    renderPagina();
    await screen.findByText("Juana Pérez");

    expect(screen.getByTitle("Tiene novedades sin revisar")).toBeInTheDocument();
    expect(screen.getAllByTitle("Tiene novedades sin revisar")).toHaveLength(1);
  });
});
