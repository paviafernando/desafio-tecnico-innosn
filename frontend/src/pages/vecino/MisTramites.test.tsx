import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MisTramites from "./MisTramites";
import { AuthProvider } from "../../hooks/useSesion";
import { guardarSesion } from "../../lib/sesion";
import * as apiClient from "../../lib/apiClient";

vi.mock("../../lib/apiClient", async () => {
  const real = await vi.importActual<typeof import("../../lib/apiClient")>("../../lib/apiClient");
  return { ...real, apiFetch: vi.fn() };
});

function renderPagina() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <MisTramites />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("MisTramites", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t1", rol: "ciudadano", nombre: "Juana", email: "j@x.com", dni: "1" });
    vi.mocked(apiClient.apiFetch).mockReset();
  });

  it("muestra un mensaje si el vecino todavía no tiene trámites", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce([]);
    renderPagina();

    expect(await screen.findByText(/todavía no cargaste/i)).toBeInTheDocument();
  });

  it("lista los trámites del vecino con su estado", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce([
      {
        id: "tramite-1",
        tipoTramiteId: "tipo-1",
        ciudadanoId: "1",
        ciudadanoNombre: "Juana",
        ciudadanoEmail: "j@x.com",
        datosFormulario: {},
        estadoActual: "en_revision",
        createdAt: new Date().toISOString(),
      },
    ]);

    renderPagina();

    expect(await screen.findByText("en revision")).toBeInTheDocument();
  });
});
