import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { AuthProvider } from "./hooks/useSesion";
import { guardarSesion } from "./lib/sesion";

function renderApp(rutaInicial: string) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[rutaInicial]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("muestra el selector de identidad en la ruta raíz", () => {
    renderApp("/");
    expect(screen.getByText("Trámites municipales")).toBeInTheDocument();
  });

  it("redirige al login admin si se intenta ver la bandeja sin sesión", () => {
    renderApp("/admin/tramites");
    expect(screen.getByText("Acceso administrador")).toBeInTheDocument();
  });

  it("muestra la bandeja de entrada del administrador con sesión activa", () => {
    guardarSesion({ token: "t", rol: "admin", nombre: "Admin", email: "a@b.com" });
    renderApp("/admin/tramites");
    expect(screen.getByText("Bandeja de entrada")).toBeInTheDocument();
  });
});
