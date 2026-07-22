import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EsqueletoTarjetas from "./EsqueletoTarjetas";

describe("EsqueletoTarjetas", () => {
  it("renderiza el placeholder de carga", () => {
    render(<EsqueletoTarjetas />);
    expect(screen.getByTestId("esqueleto-tarjetas")).toBeInTheDocument();
  });
});
