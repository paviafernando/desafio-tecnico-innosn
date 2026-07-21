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
  tipoTramiteNombre: "Inscripción a becas deportivas",
  tipoTramiteEsquemaFormulario: {
    campos: [{ id: "nombre_menor", etiqueta: "Nombre y apellido del menor", tipo: "texto", requerido: true }],
  },
  tipoTramiteFlujoEstados: {
    inicial: "pendiente",
    estados: ["pendiente", "en_revision", "aprobado", "rechazado"],
    transiciones: {
      pendiente: ["en_revision"],
      en_revision: ["aprobado", "rechazado"],
      aprobado: [],
      rechazado: [],
    },
  },
  ciudadanoId: "1",
  ciudadanoNombre: "Juana",
  ciudadanoEmail: "j@x.com",
  datosFormulario: { nombre_menor: "Tomás Pérez" },
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

  it("muestra el nombre del tipo de trámite, el estado y el historial", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue(tramiteDeEjemplo);

    renderPagina();

    expect(await screen.findByText("Trámite creado")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inscripción a becas deportivas" })).toBeInTheDocument();
    expect(screen.getAllByText("pendiente").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /volver a mis trámites/i })).toBeInTheDocument();
  });

  it("muestra el resumen de lo que cargó el vecino, con etiquetas legibles", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue(tramiteDeEjemplo);

    renderPagina();

    expect(await screen.findByText("Nombre y apellido del menor")).toBeInTheDocument();
    expect(screen.getByText("Tomás Pérez")).toBeInTheDocument();
  });

  it("muestra la barra de progreso con el paso actual resaltado", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue(tramiteDeEjemplo);

    renderPagina();
    await screen.findByText("Trámite creado");

    const pasoActual = screen.getAllByText("pendiente").find((el) => el.className.includes("bg-brand"));
    expect(pasoActual).toBeDefined();
    expect(screen.getByText("aprobado")).toBeInTheDocument();
  });

  it("vuelve a cargar el trámite cuando llega un evento en tiempo real", async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce(tramiteDeEjemplo)
      .mockResolvedValueOnce({ ...tramiteDeEjemplo, estadoActual: "en_revision" });

    renderPagina();
    await screen.findByText("Trámite creado");

    listenerCapturado?.("tramite.estado_cambiado", { tramiteId: "tramite-1" });

    await waitFor(() => {
      expect(screen.getByText("en revision")).toBeInTheDocument();
    });
  });
});
