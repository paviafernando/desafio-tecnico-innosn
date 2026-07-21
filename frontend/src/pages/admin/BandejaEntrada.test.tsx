import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BandejaEntrada from "./BandejaEntrada";
import { AuthProvider } from "../../hooks/useSesion";
import { guardarSesion } from "../../lib/sesion";
import * as apiClient from "../../lib/apiClient";

vi.mock("../../lib/apiClient", async () => {
  const real = await vi.importActual<typeof import("../../lib/apiClient")>("../../lib/apiClient");
  return { ...real, apiFetch: vi.fn() };
});

vi.mock("../../hooks/useEventosTiempoReal", () => ({
  useEventosAdmin: () => {},
}));

const tramites = [
  {
    id: "tramite-1111",
    tipoTramiteId: "tipo-1",
    tipoTramiteNombre: "Inscripción a becas deportivas",
    tipoTramiteCategoria: "Deportes",
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
      <MemoryRouter>
        <BandejaEntrada />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("BandejaEntrada", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t-admin", rol: "admin", nombre: "Admin", email: "a@b.com" });
    vi.mocked(apiClient.apiFetch).mockReset();
  });

  it("lista los trámites con su tipo, vecino y estado", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce(tramites);
    renderPagina();

    expect(await screen.findByText("Juana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Inscripción a becas deportivas")).toBeInTheDocument();
    expect(screen.getByText("pendiente")).toBeInTheDocument();
  });

  it("pide la lista completa una sola vez, sin filtro en el servidor", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce(tramites);
    renderPagina();

    await screen.findByText("Juana Pérez");

    expect(apiClient.apiFetch).toHaveBeenCalledWith(
      "/api/admin/tramites",
      expect.objectContaining({ token: "t-admin" }),
    );
  });

  it("filtra por estado (coincidencia parcial)", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "revi");

    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
  });

  it("filtra por tipo de trámite", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "vivienda");

    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
  });

  it("filtra por categoría", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "catastro");

    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
  });

  it("filtra por nombre del vecino", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "gómez");

    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
  });

  it("filtra por número (código) de trámite", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/buscar/i), "2222");

    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
    expect(screen.queryByText("Juana Pérez")).not.toBeInTheDocument();
  });
});
