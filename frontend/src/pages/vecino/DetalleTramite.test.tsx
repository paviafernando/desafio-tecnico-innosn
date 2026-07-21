import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DetalleTramite from "./DetalleTramite";
import { AuthProvider } from "../../hooks/useSesion";
import { guardarSesion } from "../../lib/sesion";
import * as apiClient from "../../lib/apiClient";

vi.mock("../../lib/apiClient", async () => {
  const real = await vi.importActual<typeof import("../../lib/apiClient")>("../../lib/apiClient");
  return { ...real, apiFetch: vi.fn() };
});

let listenerCapturado: ((nombre: string, payload: unknown) => void) | undefined;
vi.mock("../../hooks/useEventosTiempoReal", () => ({
  useEventosTramite: (_id: string | undefined, onEvento: (nombre: string, payload: unknown) => void) => {
    listenerCapturado = onEvento;
  },
}));

const tramiteDeEjemplo = {
  id: "tramite-1",
  tipoTramiteId: "tipo-1",
  ciudadanoId: "1",
  ciudadanoNombre: "Juana",
  ciudadanoEmail: "j@x.com",
  datosFormulario: {},
  estadoActual: "pendiente",
  createdAt: new Date().toISOString(),
  comentarios: [],
  historial: [
    {
      id: "e1",
      tramiteId: "tramite-1",
      tipoEvento: "creacion" as const,
      estadoAnterior: null,
      estadoNuevo: "pendiente",
      autorTipo: "ciudadano" as const,
      autorIdentificador: "1",
      createdAt: new Date().toISOString(),
    },
  ],
};

function renderPagina() {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/mis-tramites/tramite-1"]}>
        <Routes>
          <Route path="/mis-tramites/:id" element={<DetalleTramite />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("DetalleTramite (vecino)", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t1", rol: "ciudadano", nombre: "Juana", email: "j@x.com", dni: "1" });
    vi.mocked(apiClient.apiFetch).mockReset();
    listenerCapturado = undefined;
  });

  it("muestra el estado y el historial del trámite", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue(tramiteDeEjemplo);

    renderPagina();

    expect(await screen.findByText("Trámite creado")).toBeInTheDocument();
    expect(screen.getByText("pendiente")).toBeInTheDocument();
  });

  it("vuelve a cargar el trámite cuando llega un evento en tiempo real", async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce(tramiteDeEjemplo)
      .mockResolvedValueOnce({ ...tramiteDeEjemplo, estadoActual: "en_revision" });

    renderPagina();
    await screen.findByText("pendiente");

    listenerCapturado?.("tramite.estado_cambiado", { tramiteId: "tramite-1" });

    await waitFor(() => {
      expect(screen.getByText("en revision")).toBeInTheDocument();
    });
  });
});
