import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CampanitaNotificaciones from "./CampanitaNotificaciones";
import { useNotificaciones, type Notificacion } from "../hooks/useNotificaciones";
import { AuthProvider } from "../hooks/useSesion";
import { guardarSesion } from "../lib/sesion";

vi.mock("../hooks/useNotificaciones");

const useNotificacionesMock = vi.mocked(useNotificaciones);

function notificacion(overrides: Partial<Notificacion> = {}): Notificacion {
  return {
    id: "1",
    mensaje: "Tu trámite cambió de estado",
    tramiteId: "tramite-123",
    leida: false,
    creadaEn: new Date(),
    ...overrides,
  };
}

function renderConProviders() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/mis-tramites"]}>
        <Routes>
          <Route path="/mis-tramites" element={<CampanitaNotificaciones />} />
          <Route path="/mis-tramites/:id" element={<p>Detalle del trámite</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("CampanitaNotificaciones", () => {
  beforeEach(() => {
    localStorage.clear();
    guardarSesion({ token: "t1", rol: "ciudadano", nombre: "Juana", email: "j@x.com", dni: "1" });
  });

  it("no muestra badge si no hay notificaciones sin leer", () => {
    useNotificacionesMock.mockReturnValue({
      notificaciones: [],
      noLeidas: 0,
      marcarTodasLeidas: vi.fn(),
    });

    renderConProviders();
    expect(screen.queryByTestId("badge-no-leidas")).not.toBeInTheDocument();
  });

  it("muestra el número de notificaciones sin leer", () => {
    useNotificacionesMock.mockReturnValue({
      notificaciones: [notificacion()],
      noLeidas: 1,
      marcarTodasLeidas: vi.fn(),
    });

    renderConProviders();
    expect(screen.getByTestId("badge-no-leidas")).toHaveTextContent("1");
  });

  it("al abrir el listado muestra los mensajes, el código del trámite y marca todas como leídas", async () => {
    const marcarTodasLeidas = vi.fn();
    useNotificacionesMock.mockReturnValue({
      notificaciones: [notificacion({ mensaje: "Certificado de vivienda: cambió a estado en_revision" })],
      noLeidas: 1,
      marcarTodasLeidas,
    });

    const user = userEvent.setup();
    renderConProviders();

    await user.click(screen.getByRole("button", { name: /notificaciones/i }));

    expect(screen.getByText(/Certificado de vivienda/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Certificado de vivienda/ })).toHaveTextContent("#tramite-");
    expect(marcarTodasLeidas).toHaveBeenCalled();
  });

  it("al hacer click en una notificación, navega al trámite correspondiente", async () => {
    useNotificacionesMock.mockReturnValue({
      notificaciones: [notificacion({ mensaje: "Certificado de vivienda: cambió a estado en_revision" })],
      noLeidas: 1,
      marcarTodasLeidas: vi.fn(),
    });

    const user = userEvent.setup();
    renderConProviders();

    await user.click(screen.getByRole("button", { name: /notificaciones/i }));
    await user.click(screen.getByText(/Certificado de vivienda/));

    expect(await screen.findByText("Detalle del trámite")).toBeInTheDocument();
  });

  it("muestra un mensaje cuando no hay notificaciones", async () => {
    useNotificacionesMock.mockReturnValue({
      notificaciones: [],
      noLeidas: 0,
      marcarTodasLeidas: vi.fn(),
    });

    const user = userEvent.setup();
    renderConProviders();
    await user.click(screen.getByRole("button", { name: /notificaciones/i }));

    expect(screen.getByText(/no tenés notificaciones/i)).toBeInTheDocument();
  });
});
