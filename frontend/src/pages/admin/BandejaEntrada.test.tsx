import { render, screen } from "@testing-library/react";
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

const tramites = [
  {
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
  },
  {
    id: "tramite-2222",
    tipoTramiteId: "tipo-2",
    tipoTramiteNombre: "Certificado de vivienda única",
    tipoTramiteCategoria: "Catastro",
    ciudadanoId: "2",
    ciudadanoNombre: "Martín Gómez",
    ciudadanoEmail: "m@x.com",
    datosFormulario: {},
    estadoActual: "en_revision",
    createdAt: new Date().toISOString(),
  },
];

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
  });

  it("lista los trámites con su tipo, vecino y estado", async () => {
    cola.mockResolvedValueOnce(tramites);
    renderPagina();

    expect(await screen.findByText("Juana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Inscripción a becas deportivas")).toBeInTheDocument();
    expect(screen.getByText("pendiente")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
  });

  it("pide la lista completa una sola vez, sin filtro en el servidor", async () => {
    cola.mockResolvedValueOnce(tramites);
    renderPagina();

    await screen.findByText("Juana Pérez");

    expect(cola).toHaveBeenCalledWith(
      "/api/admin/tramites",
      expect.objectContaining({ token: "t-admin" }),
    );
  });

  it("filtra por estado (coincidencia parcial)", async () => {
    cola.mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "revi");

    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
  });

  it("filtra por tipo de trámite", async () => {
    cola.mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "vivienda");

    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
  });

  it("filtra por categoría", async () => {
    cola.mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "catastro");

    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
  });

  it("filtra por nombre del vecino", async () => {
    cola.mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "gómez");

    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
  });

  it("filtra por número (código) de trámite", async () => {
    cola.mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "2222");

    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
  });
});
