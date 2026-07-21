import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FormularioTipoTramite from "./FormularioTipoTramite";
import { AuthProvider } from "../hooks/useSesion";
import { guardarSesion } from "../lib/sesion";
import * as apiClient from "../lib/apiClient";

vi.mock("../lib/apiClient", async () => {
  const real = await vi.importActual<typeof import("../lib/apiClient")>("../lib/apiClient");
  return { ...real, apiFetch: vi.fn() };
});

function renderFormulario(onCreado = vi.fn()) {
  render(
    <AuthProvider>
      <FormularioTipoTramite onCreado={onCreado} />
    </AuthProvider>,
  );
  return { onCreado };
}

describe("FormularioTipoTramite", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t-admin", rol: "admin", nombre: "Admin", email: "a@b.com" });
    vi.mocked(apiClient.apiFetch).mockReset();
  });

  it("arranca con un campo por defecto y permite agregar más", async () => {
    const user = userEvent.setup();
    renderFormulario();

    const antes = screen.getAllByPlaceholderText("id del campo").length;
    await user.click(screen.getByRole("button", { name: /agregar campo/i }));
    const despues = screen.getAllByPlaceholderText("id del campo").length;

    expect(despues).toBe(antes + 1);
  });

  it("permite quitar un campo agregado", async () => {
    const user = userEvent.setup();
    renderFormulario();

    await user.click(screen.getByRole("button", { name: /agregar campo/i }));
    const antes = screen.getAllByPlaceholderText("id del campo").length;

    await user.click(screen.getAllByRole("button", { name: /quitar/i })[0]);

    expect(screen.getAllByPlaceholderText("id del campo").length).toBe(antes - 1);
  });

  it("envía el tipo de trámite armado y llama a onCreado", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce({ id: "nuevo-tipo" });
    const { onCreado } = renderFormulario();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^nombre$/i), "Certificado de vivienda única");
    await user.type(screen.getByLabelText(/descripción/i), "Certificado municipal");

    const idsCampo = screen.getAllByPlaceholderText("id del campo");
    await user.type(idsCampo[0], "dni");
    const etiquetas = screen.getAllByPlaceholderText("Etiqueta visible");
    await user.type(etiquetas[0], "DNI");

    await user.type(screen.getByLabelText(/estados \(separados por coma\)/i), "pendiente, aprobado");
    await user.click(screen.getByRole("button", { name: /crear tipo de trámite/i }));

    await waitFor(() => expect(onCreado).toHaveBeenCalled());

    expect(apiClient.apiFetch).toHaveBeenCalledWith(
      "/api/admin/tipos-tramite",
      expect.objectContaining({
        method: "POST",
        token: "t-admin",
        body: expect.objectContaining({
          nombre: "Certificado de vivienda única",
          descripcion: "Certificado municipal",
          esquemaFormulario: {
            campos: [{ id: "dni", etiqueta: "DNI", tipo: "texto", requerido: true }],
          },
          flujoEstados: expect.objectContaining({
            inicial: "pendiente",
            estados: ["pendiente", "aprobado"],
          }),
        }),
      }),
    );
  });
});
