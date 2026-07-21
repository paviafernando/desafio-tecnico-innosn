import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CampanitaNotificaciones from "./CampanitaNotificaciones";
import { useNotificaciones, type Notificacion } from "../hooks/useNotificaciones";

vi.mock("../hooks/useNotificaciones");

const useNotificacionesMock = vi.mocked(useNotificaciones);

function notificacion(overrides: Partial<Notificacion> = {}): Notificacion {
  return {
    id: "1",
    mensaje: "Tu trámite cambió de estado",
    tramiteId: "t-1",
    leida: false,
    creadaEn: new Date(),
    ...overrides,
  };
}

describe("CampanitaNotificaciones", () => {
  it("no muestra badge si no hay notificaciones sin leer", () => {
    useNotificacionesMock.mockReturnValue({
      notificaciones: [],
      noLeidas: 0,
      marcarTodasLeidas: vi.fn(),
    });

    render(<CampanitaNotificaciones />);
    expect(screen.queryByTestId("badge-no-leidas")).not.toBeInTheDocument();
  });

  it("muestra el número de notificaciones sin leer", () => {
    useNotificacionesMock.mockReturnValue({
      notificaciones: [notificacion()],
      noLeidas: 1,
      marcarTodasLeidas: vi.fn(),
    });

    render(<CampanitaNotificaciones />);
    expect(screen.getByTestId("badge-no-leidas")).toHaveTextContent("1");
  });

  it("al abrir el listado muestra los mensajes y marca todas como leídas", async () => {
    const marcarTodasLeidas = vi.fn();
    useNotificacionesMock.mockReturnValue({
      notificaciones: [notificacion({ mensaje: "Certificado de vivienda: cambió a estado en_revision" })],
      noLeidas: 1,
      marcarTodasLeidas,
    });

    const user = userEvent.setup();
    render(<CampanitaNotificaciones />);

    await user.click(screen.getByRole("button", { name: /notificaciones/i }));

    expect(screen.getByText(/Certificado de vivienda/)).toBeInTheDocument();
    expect(marcarTodasLeidas).toHaveBeenCalled();
  });

  it("muestra un mensaje cuando no hay notificaciones", async () => {
    useNotificacionesMock.mockReturnValue({
      notificaciones: [],
      noLeidas: 0,
      marcarTodasLeidas: vi.fn(),
    });

    const user = userEvent.setup();
    render(<CampanitaNotificaciones />);
    await user.click(screen.getByRole("button", { name: /notificaciones/i }));

    expect(screen.getByText(/no tenés notificaciones/i)).toBeInTheDocument();
  });
});
