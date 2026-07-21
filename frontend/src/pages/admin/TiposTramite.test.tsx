import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TiposTramite from "./TiposTramite";
import { AuthProvider } from "../../hooks/useSesion";
import { guardarSesion } from "../../lib/sesion";
import * as apiClient from "../../lib/apiClient";

vi.mock("../../lib/apiClient", async () => {
  const real = await vi.importActual<typeof import("../../lib/apiClient")>("../../lib/apiClient");
  return { ...real, apiFetch: vi.fn() };
});

const tipoBorrador = {
  id: "tipo-1",
  nombre: "Certificado de vivienda única",
  descripcion: "...",
  esquemaFormulario: { campos: [] },
  flujoEstados: { inicial: "pendiente", estados: ["pendiente"], transiciones: {} },
  version: 1,
  estado: "borrador",
  tipoTramiteOrigenId: null,
  publicadoEn: null,
  publicadoPor: null,
  categoria: "Catastro",
  requisitos: [],
  pasos: [],
  archivosReferencia: [],
  costo: null,
  modalidad: null,
  contacto: {},
};

function renderPagina() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <TiposTramite />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("TiposTramite", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t-admin", rol: "admin", nombre: "Admin", email: "a@b.com" });
    vi.mocked(apiClient.apiFetch).mockReset();
  });

  it("lista los tipos de trámite con su estado y versión", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce([tipoBorrador]);
    renderPagina();

    expect(await screen.findByText("Certificado de vivienda única")).toBeInTheDocument();
    expect(screen.getByText("borrador")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver a la bandeja/i })).toBeInTheDocument();
  });

  it("publica un tipo en borrador", async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce([tipoBorrador])
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([{ ...tipoBorrador, estado: "publicado" }]);

    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Certificado de vivienda única");
    await user.click(screen.getByRole("button", { name: /publicar/i }));

    await waitFor(() => {
      expect(apiClient.apiFetch).toHaveBeenCalledWith(
        "/api/admin/tipos-tramite/tipo-1/publicar",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("abre y cierra el modal de creación", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValue([]);
    const user = userEvent.setup();
    renderPagina();

    await user.click(screen.getByRole("button", { name: /nuevo tipo de trámite/i }));
    expect(screen.getByRole("button", { name: /crear tipo de trámite/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^cerrar$/i }));
    expect(screen.queryByRole("button", { name: /crear tipo de trámite/i })).not.toBeInTheDocument();
  });

  it("abre el modal de edición precargado con los datos del tipo elegido", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce([tipoBorrador]);
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Certificado de vivienda única");
    await user.click(screen.getByRole("button", { name: /^editar$/i }));

    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue("Certificado de vivienda única");
  });

  it("avisa cuando editar un tipo publicado con instancias crea una nueva versión", async () => {
    const tipoPublicado = { ...tipoBorrador, estado: "publicado" as const };
    const nuevaVersion = { ...tipoBorrador, id: "tipo-1-v2", version: 2, tipoTramiteOrigenId: "tipo-1" };

    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce([tipoPublicado])
      .mockResolvedValueOnce(nuevaVersion)
      .mockResolvedValueOnce([tipoPublicado, nuevaVersion]);

    const user = userEvent.setup();
    renderPagina();

    await screen.findByText("Certificado de vivienda única");
    await user.click(screen.getByRole("button", { name: /^editar$/i }));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(await screen.findByText(/se creó la versión v2/i)).toBeInTheDocument();
  });
});
