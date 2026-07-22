import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EsqueletoTabla from "./EsqueletoTabla";

describe("EsqueletoTabla", () => {
  it("renderiza el placeholder de carga", () => {
    render(<EsqueletoTabla />);
    expect(screen.getByTestId("esqueleto-tabla")).toBeInTheDocument();
  });
});
