import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DetalleTramiteAdmin from "./DetalleTramiteAdmin";
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
  useEventosTramite: () => {},
}));

const tramiteDeEjemplo = {
  id: "tramite-1",
  tipoTramiteId: "tipo-1",
  tipoTramiteNombre: "Inscripción a becas deportivas",
  tipoTramiteVersion: 2,
  ciudadanoId: "1",
  ciudadanoNombre: "Juana Pérez",
  ciudadanoEmail: "juana@example.com",
  datosFormulario: { nombre: "Juana Pérez", club: "Fútbol" },
  estadoActual: "pendiente",
  createdAt: new Date().toISOString(),
  comentarios: [],
  historial: [],
};

const tiposDeEjemplo = [
  {
    id: "tipo-1",
    nombre: "Inscripción a becas deportivas",
    descripcion: "...",
    esquemaFormulario: {
      campos: [
        { id: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
        { id: "club", etiqueta: "Club o deporte", tipo: "select", requerido: true, opciones: ["Fútbol"] },
      ],
    },
    flujoEstados: {
      inicial: "pendiente",
      estados: ["pendiente", "en_revision", "aprobado", "rechazado"],
      transiciones: { pendiente: ["en_revision"], en_revision: ["aprobado", "rechazado"] },
    },
    version: 1,
    estado: "publicado",
    tipoTramiteOrigenId: null,
    publicadoEn: null,
    publicadoPor: null,
    categoria: null,
    requisitos: [],
    pasos: [],
    archivosReferencia: [],
    costo: null,
    modalidad: null,
    contacto: {},
  },
];

function renderPagina() {
  render(
    <AuthProvider>
      <NotificacionesProvider>
        <MemoryRouter initialEntries={["/admin/tramites/tramite-1"]}>
          <Routes>
            <Route path="/admin/tramites/:id" element={<DetalleTramiteAdmin />} />
          </Routes>
        </MemoryRouter>
      </NotificacionesProvider>
    </AuthProvider>,
  );
}

describe("DetalleTramiteAdmin", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t-admin", rol: "admin", nombre: "Admin", email: "a@b.com" });
    cola.mockReset();
  });

  it("muestra los datos del formulario y el vecino", async () => {
    cola
      .mockResolvedValueOnce(tramiteDeEjemplo)
      .mockResolvedValueOnce(tiposDeEjemplo);

    renderPagina();

    expect(await screen.findByText("juana@example.com", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Fútbol")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inscripción a becas deportivas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver a la bandeja/i })).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
  });

  it("solo ofrece las transiciones de estado válidas según el flujo del tipo", async () => {
    cola
      .mockResolvedValueOnce(tramiteDeEjemplo)
      .mockResolvedValueOnce(tiposDeEjemplo);

    renderPagina();
    await screen.findByText("juana@example.com", { exact: false });

    const select = screen.getByLabelText(/cambiar estado/i);
    expect(select).toHaveTextContent("en_revision");
    expect(select).not.toHaveTextContent("aprobado");
  });

  it("aplica el cambio de estado elegido", async () => {
    cola
      .mockResolvedValueOnce(tramiteDeEjemplo)
      .mockResolvedValueOnce(tiposDeEjemplo)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ ...tramiteDeEjemplo, estadoActual: "en_revision" })
      .mockResolvedValueOnce(tiposDeEjemplo);

    const user = userEvent.setup();
    renderPagina();
    await screen.findByText("juana@example.com", { exact: false });

    await user.selectOptions(screen.getByLabelText(/cambiar estado/i), "en_revision");
    await user.click(screen.getByRole("button", { name: /aplicar/i }));

    await waitFor(() => {
      expect(cola).toHaveBeenCalledWith(
        "/api/tramites/tramite-1/estado",
        expect.objectContaining({ method: "PATCH", body: { nuevoEstado: "en_revision" } }),
      );
    });
  });

  it("agrega un comentario", async () => {
    cola
      .mockResolvedValueOnce(tramiteDeEjemplo)
      .mockResolvedValueOnce(tiposDeEjemplo)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(tramiteDeEjemplo)
      .mockResolvedValueOnce(tiposDeEjemplo);

    const user = userEvent.setup();
    renderPagina();
    await screen.findByText("juana@example.com", { exact: false });

    await user.type(screen.getByLabelText(/agregar comentario/i), "Falta un dato");
    await user.click(screen.getByRole("button", { name: /comentar/i }));

    await waitFor(() => {
      expect(cola).toHaveBeenCalledWith(
        "/api/tramites/tramite-1/comentarios",
        expect.objectContaining({ method: "POST", body: { texto: "Falta un dato" } }),
      );
    });
  });
});
