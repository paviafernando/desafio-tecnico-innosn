import { render, screen, waitFor } from "@testing-library/react";
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
    id: "tramite-1",
    tipoTramiteId: "tipo-1",
    ciudadanoId: "1",
    ciudadanoNombre: "Juana Pérez",
    ciudadanoEmail: "j@x.com",
    datosFormulario: {},
    estadoActual: "pendiente",
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

  it("lista los trámites con vecino y estado", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce(tramites);
    renderPagina();

    expect(await screen.findByText("Juana Pérez")).toBeInTheDocument();
    expect(screen.getByText("pendiente")).toBeInTheDocument();
  });

  it("vuelve a pedir la lista al cambiar el filtro de estado", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue(tramites);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Juana Pérez");
    await user.type(screen.getByLabelText(/filtrar por estado/i), "en_revision");

    await waitFor(() => {
      expect(apiClient.apiFetch).toHaveBeenLastCalledWith(
        "/api/admin/tramites?estado=en_revision",
        expect.objectContaining({ token: "t-admin" }),
      );
    });
  });
});
