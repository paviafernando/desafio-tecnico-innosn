import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

function ComponenteQueFalla(): never {
  throw new Error("Falla de prueba");
}

describe("ErrorBoundary", () => {
  it("renderiza a los hijos normalmente cuando no hay error", () => {
    render(
      <ErrorBoundary>
        <p>Todo bien</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Todo bien")).toBeInTheDocument();
  });

  it("muestra un mensaje de error en vez de dejar la pantalla en blanco", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ComponenteQueFalla />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/algo salió mal/i)).toBeInTheDocument();
    expect(screen.getByText(/falla de prueba/i)).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
