import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NuevoTramite from "./NuevoTramite";
import { AuthProvider } from "../../hooks/useSesion";
import { NotificacionesProvider } from "../../hooks/useNotificaciones";
import { guardarSesion } from "../../lib/sesion";
import * as apiClient from "../../lib/apiClient";
import type { TipoTramite } from "../../types/api";

vi.mock("../../lib/apiClient", async () => {
  const real = await vi.importActual<typeof import("../../lib/apiClient")>("../../lib/apiClient");
  return { ...real, apiFetch: vi.fn(), apiSubirArchivo: vi.fn() };
});

const tipoDePrueba: TipoTramite = {
  id: "tipo-1",
  nombre: "Inscripción a becas deportivas",
  descripcion: "...",
  esquemaFormulario: {
    campos: [
      { id: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
      { id: "club", etiqueta: "Club", tipo: "select", requerido: true, opciones: ["Fútbol", "Básquet"] },
      { id: "ficha_medica", etiqueta: "Ficha médica", tipo: "archivo", requerido: true },
    ],
  },
  flujoEstados: { inicial: "pendiente", estados: ["pendiente"], transiciones: {} },
  version: 1,
  estado: "publicado",
  tipoTramiteOrigenId: null,
  publicadoEn: null,
  publicadoPor: null,
  categoria: "Deportes",
  requisitos: [],
  pasos: [],
  archivosReferencia: [],
  costo: "Gratuito",
  modalidad: "online",
  contacto: {},
};

function renderPagina() {
  render(
    <AuthProvider>
      <NotificacionesProvider>
        <MemoryRouter>
          <NuevoTramite />
        </MemoryRouter>
      </NotificacionesProvider>
    </AuthProvider>,
  );
}

describe("NuevoTramite", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t1", rol: "ciudadano", nombre: "Juana", email: "j@x.com", dni: "1" });
    vi.mocked(apiClient.apiFetch).mockReset();
    vi.mocked(apiClient.apiSubirArchivo).mockReset();
  });

  it("lista los tipos de trámite disponibles para elegir", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce([tipoDePrueba]);
    renderPagina();

    expect(await screen.findByText("Inscripción a becas deportivas")).toBeInTheDocument();
  });

  it("al elegir un tipo, renderiza los campos de su esquema", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce([tipoDePrueba]);
    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByText("Inscripción a becas deportivas"));

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/club/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ficha médica/i)).toBeInTheDocument();
  });

  it("sube el archivo y crea el trámite con la clave devuelta", async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce([tipoDePrueba])
      .mockResolvedValueOnce({ id: "tramite-1" });
    vi.mocked(apiClient.apiSubirArchivo).mockResolvedValueOnce({ claveAlmacenamiento: "clave-abc" });

    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByText("Inscripción a becas deportivas"));
    await user.type(screen.getByLabelText(/nombre/i), "Juana Pérez");
    await user.selectOptions(screen.getByLabelText(/club/i), "Fútbol");

    const archivo = new File(["contenido"], "ficha.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/ficha médica/i), archivo);

    await user.click(screen.getByRole("button", { name: /enviar trámite/i }));

    await waitFor(() => {
      expect(apiClient.apiSubirArchivo).toHaveBeenCalledWith("/api/archivos", archivo, "t1");
    });

    expect(apiClient.apiFetch).toHaveBeenLastCalledWith(
      "/api/tramites",
      expect.objectContaining({
        method: "POST",
        body: {
          tipoTramiteId: "tipo-1",
          datosFormulario: { nombre: "Juana Pérez", club: "Fútbol", ficha_medica: "clave-abc" },
        },
      }),
    );
  });
});
