import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "./useSesion";

function ComponenteDePrueba() {
  const { sesion, iniciarSesion, cerrarSesion } = useAuth();

  return (
    <div>
      <p>{sesion ? `Hola ${sesion.nombre} (${sesion.rol})` : "Sin sesión"}</p>
      <button
        onClick={() =>
          iniciarSesion({ token: "t1", rol: "ciudadano", nombre: "Juana", email: "juana@example.com" })
        }
      >
        Iniciar
      </button>
      <button onClick={cerrarSesion}>Cerrar</button>
    </div>
  );
}

describe("AuthProvider / useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("arranca sin sesión si no hay nada guardado", () => {
    render(
      <AuthProvider>
        <ComponenteDePrueba />
      </AuthProvider>,
    );
    expect(screen.getByText("Sin sesión")).toBeInTheDocument();
  });

  it("guarda la sesión al iniciar y la persiste en localStorage", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <ComponenteDePrueba />
      </AuthProvider>,
    );

    await user.click(screen.getByText("Iniciar"));

    expect(screen.getByText("Hola Juana (ciudadano)")).toBeInTheDocument();
    expect(localStorage.getItem("tramites:sesion")).toContain("Juana");
  });

  it("limpia la sesión al cerrar", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <ComponenteDePrueba />
      </AuthProvider>,
    );

    await user.click(screen.getByText("Iniciar"));
    await user.click(screen.getByText("Cerrar"));

    expect(screen.getByText("Sin sesión")).toBeInTheDocument();
    expect(localStorage.getItem("tramites:sesion")).toBeNull();
  });
});
