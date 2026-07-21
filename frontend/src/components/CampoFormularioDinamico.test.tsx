import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CampoFormularioDinamico from "./CampoFormularioDinamico";
import type { CampoFormulario } from "../types/api";

function campo(sobrescribir: Partial<CampoFormulario>): CampoFormulario {
  return { id: "campo1", etiqueta: "Campo de prueba", tipo: "texto", requerido: true, ...sobrescribir };
}

describe("CampoFormularioDinamico", () => {
  it("renderiza un input de texto y notifica los cambios", async () => {
    const onCambiar = vi.fn();
    const user = userEvent.setup();
    render(<CampoFormularioDinamico campo={campo({})} valor="" onCambiar={onCambiar} onArchivoSeleccionado={vi.fn()} />);

    await user.type(screen.getByLabelText(/campo de prueba/i), "hola");

    expect(onCambiar).toHaveBeenCalled();
  });

  it("renderiza un select con las opciones del campo", () => {
    render(
      <CampoFormularioDinamico
        campo={campo({ tipo: "select", opciones: ["Fútbol", "Básquet"] })}
        valor=""
        onCambiar={vi.fn()}
        onArchivoSeleccionado={vi.fn()}
      />,
    );

    expect(screen.getByRole("option", { name: "Fútbol" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Básquet" })).toBeInTheDocument();
  });

  it("renderiza un checkbox", async () => {
    const onCambiar = vi.fn();
    const user = userEvent.setup();
    render(
      <CampoFormularioDinamico
        campo={campo({ tipo: "checkbox" })}
        valor={false}
        onCambiar={onCambiar}
        onArchivoSeleccionado={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("checkbox"));
    expect(onCambiar).toHaveBeenCalledWith(true);
  });

  it("renderiza un input de archivo y notifica la selección", async () => {
    const onArchivoSeleccionado = vi.fn();
    const user = userEvent.setup();
    render(
      <CampoFormularioDinamico
        campo={campo({ tipo: "archivo", etiqueta: "Comprobante" })}
        valor={undefined}
        onCambiar={vi.fn()}
        onArchivoSeleccionado={onArchivoSeleccionado}
      />,
    );

    const archivo = new File(["contenido"], "doc.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText(/comprobante/i);
    await user.upload(input, archivo);

    expect(onArchivoSeleccionado).toHaveBeenCalledWith(archivo);
  });
});
