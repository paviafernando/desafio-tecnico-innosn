import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { RequireAuth } from "./RequireAuth";
import { guardarSesion } from "../lib/sesion";
import { AuthProvider } from "../hooks/useSesion";

function renderConRuta(rutaInicial: string) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[rutaInicial]}>
        <Routes>
          <Route path="/" element={<p>Selector de identidad</p>} />
          <Route path="/admin" element={<p>Login admin</p>} />
          <Route
            path="/mis-tramites"
            element={
              <RequireAuth rol="ciudadano">
                <p>Mis trámites</p>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/tramites"
            element={
              <RequireAuth rol="admin">
                <p>Bandeja de entrada</p>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirige al selector de identidad si no hay sesión de vecino", () => {
    renderConRuta("/mis-tramites");
    expect(screen.getByText("Selector de identidad")).toBeInTheDocument();
  });

  it("redirige al login admin si no hay sesión de admin", () => {
    renderConRuta("/admin/tramites");
    expect(screen.getByText("Login admin")).toBeInTheDocument();
  });

  it("muestra el contenido si hay sesión con el rol correcto", () => {
    guardarSesion({ token: "t", rol: "ciudadano", nombre: "Juana", email: "j@x.com" });
    renderConRuta("/mis-tramites");
    expect(screen.getByText("Mis trámites")).toBeInTheDocument();
  });

  it("redirige si la sesión existe pero tiene el rol equivocado", () => {
    guardarSesion({ token: "t", rol: "ciudadano", nombre: "Juana", email: "j@x.com" });
    renderConRuta("/admin/tramites");
    expect(screen.getByText("Login admin")).toBeInTheDocument();
  });
});
