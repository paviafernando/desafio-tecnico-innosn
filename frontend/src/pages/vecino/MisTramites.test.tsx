import { render, screen } from "@testing-library/react";
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
  });

  it("muestra un mensaje si el vecino todavía no tiene trámites", async () => {
    cola.mockResolvedValueOnce([]);
    renderPagina();

    expect(await screen.findByText(/todavía no cargaste/i)).toBeInTheDocument();
  });

  it("lista los trámites del vecino con su tipo y estado", async () => {
    cola.mockResolvedValueOnce([
      {
        id: "tramite-1",
        tipoTramiteId: "tipo-1",
        tipoTramiteNombre: "Inscripción a becas deportivas",
        ciudadanoId: "1",
        ciudadanoNombre: "Juana",
        ciudadanoEmail: "j@x.com",
        datosFormulario: {},
        estadoActual: "en_revision",
        createdAt: new Date().toISOString(),
      },
    ]);

    renderPagina();

    expect(await screen.findByText("Inscripción a becas deportivas")).toBeInTheDocument();
    expect(screen.getByText("en revision")).toBeInTheDocument();
  });
});
