import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BarraProgreso from "./BarraProgreso";

function pasos(estados: string[]) {
  return estados.map((estado) => ({ estado, negativo: false }));
}

describe("BarraProgreso", () => {
  it("muestra todos los pasos del camino", () => {
    render(<BarraProgreso pasos={pasos(["pendiente", "en_revision", "aprobado"])} estadoActual="en_revision" />);

    expect(screen.getByText("pendiente")).toBeInTheDocument();
    expect(screen.getByText("en revision")).toBeInTheDocument();
    expect(screen.getByText("aprobado")).toBeInTheDocument();
  });

  it("marca como completados los pasos anteriores al actual", () => {
    render(<BarraProgreso pasos={pasos(["pendiente", "en_revision", "aprobado"])} estadoActual="en_revision" />);

    expect(screen.getByText("pendiente").className).toContain("bg-green");
  });

  it("resalta el paso actual", () => {
    render(<BarraProgreso pasos={pasos(["pendiente", "en_revision", "aprobado"])} estadoActual="en_revision" />);

    expect(screen.getByText("en revision").className).toContain("bg-brand");
  });

  it("deja en gris los pasos futuros", () => {
    render(<BarraProgreso pasos={pasos(["pendiente", "en_revision", "aprobado"])} estadoActual="en_revision" />);

    expect(screen.getByText("aprobado").className).toContain("bg-neutral-100");
  });

  it("resalta en rojo el paso actual cuando es un estado negativo (ej. un rechazo)", () => {
    render(
      <BarraProgreso
        pasos={[
          { estado: "pendiente", negativo: false },
          { estado: "en_revision", negativo: false },
          { estado: "rechazado", negativo: true },
        ]}
        estadoActual="rechazado"
      />,
    );

    expect(screen.getByText("pendiente").className).toContain("bg-green");
    expect(screen.getByText("en revision").className).toContain("bg-green");
    expect(screen.getByText("rechazado").className).toContain("bg-red");
  });
});
