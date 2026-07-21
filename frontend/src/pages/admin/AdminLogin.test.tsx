import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLogin from "./AdminLogin";
import { AuthProvider } from "../../hooks/useSesion";
import * as apiClient from "../../lib/apiClient";

vi.mock("../../lib/apiClient", async () => {
  const real = await vi.importActual<typeof import("../../lib/apiClient")>("../../lib/apiClient");
  return { ...real, apiFetch: vi.fn() };
});

function renderPagina() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("AdminLogin", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(apiClient.apiFetch).mockReset();
  });

  it("envía email y contraseña, y guarda la sesión si son correctos", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce({
      token: "token-admin",
      admin: { id: "1", email: "admin@sannicolas.gob.ar", nombre: "Admin" },
    });

    const user = userEvent.setup();
    renderPagina();

    await user.type(screen.getByLabelText(/email/i), "admin@sannicolas.gob.ar");
    await user.type(screen.getByLabelText(/contraseña/i), "admin123");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(localStorage.getItem("tramites:sesion")).toContain("token-admin");
    });
  });

  it("muestra un error si las credenciales son incorrectas", async () => {
    const { ApiError } = await vi.importActual<typeof import("../../lib/apiClient")>(
      "../../lib/apiClient",
    );
    vi.mocked(apiClient.apiFetch).mockRejectedValueOnce(
      new ApiError(401, "Email o contraseña incorrectos"),
    );

    const user = userEvent.setup();
    renderPagina();

    await user.type(screen.getByLabelText(/email/i), "admin@sannicolas.gob.ar");
    await user.type(screen.getByLabelText(/contraseña/i), "incorrecta");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(await screen.findByText("Email o contraseña incorrectos")).toBeInTheDocument();
  });
});
