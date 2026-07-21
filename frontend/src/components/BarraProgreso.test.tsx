import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BarraProgreso from "./BarraProgreso";

describe("BarraProgreso", () => {
  it("muestra todos los pasos del camino", () => {
    render(<BarraProgreso pasos={["pendiente", "en_revision", "aprobado"]} estadoActual="en_revision" />);

    expect(screen.getByText("pendiente")).toBeInTheDocument();
    expect(screen.getByText("en revision")).toBeInTheDocument();
    expect(screen.getByText("aprobado")).toBeInTheDocument();
  });

  it("marca como completados los pasos anteriores al actual", () => {
    render(<BarraProgreso pasos={["pendiente", "en_revision", "aprobado"]} estadoActual="en_revision" />);

    expect(screen.getByText("pendiente").className).toContain("bg-green");
  });

  it("resalta el paso actual", () => {
    render(<BarraProgreso pasos={["pendiente", "en_revision", "aprobado"]} estadoActual="en_revision" />);

    expect(screen.getByText("en revision").className).toContain("bg-brand");
  });

  it("deja en gris los pasos futuros", () => {
    render(<BarraProgreso pasos={["pendiente", "en_revision", "aprobado"]} estadoActual="en_revision" />);

    expect(screen.getByText("aprobado").className).toContain("bg-neutral-100");
  });

  it("si el estado actual no está en el camino, no resalta ningún paso como actual", () => {
    render(<BarraProgreso pasos={["pendiente", "en_revision", "aprobado"]} estadoActual="rechazado" />);

    expect(screen.getByText("pendiente").className).not.toContain("bg-brand");
    expect(screen.getByText("en revision").className).not.toContain("bg-brand");
    expect(screen.getByText("aprobado").className).not.toContain("bg-brand");
  });
});
