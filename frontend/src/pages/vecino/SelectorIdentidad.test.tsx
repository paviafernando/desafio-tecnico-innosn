import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SelectorIdentidad from "./SelectorIdentidad";
import { AuthProvider } from "../../hooks/useSesion";
import * as apiClient from "../../lib/apiClient";

vi.mock("../../lib/apiClient", async () => {
  const real = await vi.importActual<typeof import("../../lib/apiClient")>("../../lib/apiClient");
  return { ...real, apiFetch: vi.fn() };
});

const identidades = [
  { dni: "30123456", nombre: "Juana Pérez", email: "juana@example.com" },
  { dni: "28987654", nombre: "Martín Gómez", email: "martin@example.com" },
];

function renderPagina() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <SelectorIdentidad />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("SelectorIdentidad", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(apiClient.apiFetch).mockReset();
  });

  it("lista las identidades obtenidas de la API", async () => {
    vi.mocked(apiClient.apiFetch).mockResolvedValueOnce(identidades);

    renderPagina();

    expect(await screen.findByText("Juana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Martín Gómez")).toBeInTheDocument();
  });

  it("al elegir una identidad, pide la sesión y la guarda", async () => {
    vi.mocked(apiClient.apiFetch)
      .mockResolvedValueOnce(identidades)
      .mockResolvedValueOnce({ token: "token-juana", identidad: identidades[0] });

    const user = userEvent.setup();
    renderPagina();

    const boton = await screen.findByText("Juana Pérez");
    await user.click(boton);

    await waitFor(() => {
      expect(localStorage.getItem("tramites:sesion")).toContain("token-juana");
    });
    expect(apiClient.apiFetch).toHaveBeenCalledWith(
      "/api/ciudadano/auth/sesion",
      expect.objectContaining({ method: "POST", body: { dni: "30123456" } }),
    );
  });

  it("muestra un error si no se pueden cargar las identidades", async () => {
    vi.mocked(apiClient.apiFetch).mockRejectedValueOnce(new Error("falló"));

    renderPagina();

    expect(await screen.findByText(/no pudimos cargar/i)).toBeInTheDocument();
  });
});
