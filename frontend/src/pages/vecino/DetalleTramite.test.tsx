import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DetalleTramite from "./DetalleTramite";
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
  recursos: [],
};

function renderPagina() {
  render(
    <AuthProvider>
      <NotificacionesProvider>
        <MemoryRouter initialEntries={["/mis-tramites/tramite-1"]}>
          <Routes>
            <Route path="/mis-tramites/:id" element={<DetalleTramite />} />
          </Routes>
        </MemoryRouter>
      </NotificacionesProvider>
    </AuthProvider>,
  );
}

describe("DetalleTramite (vecino)", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t1", rol: "ciudadano", nombre: "Juana", email: "j@x.com", dni: "1" });
    cola.mockReset();
    listenerCapturado = undefined;
  });

  it("muestra el nombre del tipo de trámite, el estado y el historial", async () => {
    cola.mockResolvedValue(tramiteDeEjemplo);

    renderPagina();

    expect(await screen.findByText("Trámite creado")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inscripción a becas deportivas" })).toBeInTheDocument();
    expect(screen.getAllByText("pendiente").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /volver a mis trámites/i })).toBeInTheDocument();
  });

  it("muestra los documentos que subió el admin, con link de descarga", async () => {
    cola.mockResolvedValue({
      ...tramiteDeEjemplo,
      recursos: [
        {
          id: "r-1",
          nombreOriginal: "instructivo.pdf",
          tipoMime: "application/pdf",
          tamanioBytes: 2048,
          createdAt: new Date().toISOString(),
          urlDescarga: "https://storage.example.com/instructivo.pdf",
        },
      ],
    });

    renderPagina();

    expect(await screen.findByText("instructivo.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /descargar/i })).toHaveAttribute(
      "href",
      "https://storage.example.com/instructivo.pdf",
    );
  });

  it("no muestra la sección de documentos si no hay ninguno", async () => {
    cola.mockResolvedValue(tramiteDeEjemplo);

    renderPagina();
    await screen.findByText("Trámite creado");

    expect(screen.queryByText("Documentos")).not.toBeInTheDocument();
  });

  it("no repite el badge de estado por separado: solo aparece en el header y en la barra de progreso", async () => {
    cola.mockResolvedValue(tramiteDeEjemplo);

    renderPagina();
    await screen.findByText("Trámite creado");

    expect(screen.getAllByText("pendiente")).toHaveLength(2);
  });

  it("muestra el resumen de lo que cargó el vecino, con etiquetas legibles", async () => {
    cola.mockResolvedValue(tramiteDeEjemplo);

    renderPagina();

    expect(await screen.findByText("Nombre y apellido del menor")).toBeInTheDocument();
    expect(screen.getByText("Tomás Pérez")).toBeInTheDocument();
  });

  it("muestra la barra de progreso con el paso actual resaltado", async () => {
    cola.mockResolvedValue(tramiteDeEjemplo);

    renderPagina();
    await screen.findByText("Trámite creado");

    const pasoActual = screen.getAllByText("pendiente").find((el) => el.className.includes("bg-brand"));
    expect(pasoActual).toBeDefined();
    expect(screen.getByText("aprobado")).toBeInTheDocument();
  });

  it("vuelve a cargar el trámite cuando llega un evento en tiempo real", async () => {
    cola
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
