import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ListaDocumentos from "./ListaDocumentos";
import type { RecursoTramite } from "../types/api";

function recurso(overrides: Partial<RecursoTramite> = {}): RecursoTramite {
  return {
    id: "r-1",
    nombreOriginal: "instructivo.pdf",
    tipoMime: "application/pdf",
    tamanioBytes: 204_800,
    createdAt: new Date().toISOString(),
    urlDescarga: "https://storage.example.com/instructivo.pdf?firma=abc",
    ...overrides,
  };
}

describe("ListaDocumentos", () => {
  it("muestra un mensaje cuando no hay documentos", () => {
    render(<ListaDocumentos recursos={[]} />);
    expect(screen.getByText(/no hay documentos/i)).toBeInTheDocument();
  });

  it("lista los documentos con nombre, tamaño y link de descarga", () => {
    render(<ListaDocumentos recursos={[recurso()]} />);

    expect(screen.getByText("instructivo.pdf")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /descargar/i });
    expect(link).toHaveAttribute("href", "https://storage.example.com/instructivo.pdf?firma=abc");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByText(/200 KB/i)).toBeInTheDocument();
  });
});
