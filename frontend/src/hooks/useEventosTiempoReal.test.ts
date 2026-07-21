import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEventosTramite, useEventosAdmin } from "./useEventosTiempoReal";

const socketFake = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock("../lib/socket", () => ({
  obtenerSocket: () => socketFake,
}));

describe("useEventosTramite", () => {
  it("se suscribe a la sala del trámite y a los eventos relevantes", () => {
    const onEvento = vi.fn();
    renderHook(() => useEventosTramite("tramite-1", onEvento));

    expect(socketFake.emit).toHaveBeenCalledWith("suscribirse-tramite", "tramite-1");
    expect(socketFake.on).toHaveBeenCalledWith("tramite.estado_cambiado", expect.any(Function));
    expect(socketFake.on).toHaveBeenCalledWith("tramite.comentario_agregado", expect.any(Function));
  });

  it("no se suscribe si no hay id de trámite", () => {
    socketFake.emit.mockClear();
    renderHook(() => useEventosTramite(undefined, vi.fn()));
    expect(socketFake.emit).not.toHaveBeenCalled();
  });

  it("se desuscribe al desmontar", () => {
    const { unmount } = renderHook(() => useEventosTramite("tramite-1", vi.fn()));
    unmount();
    expect(socketFake.off).toHaveBeenCalledWith("tramite.estado_cambiado", expect.any(Function));
    expect(socketFake.off).toHaveBeenCalledWith("tramite.comentario_agregado", expect.any(Function));
  });
});

describe("useEventosAdmin", () => {
  it("se suscribe a la sala admin y a los eventos de trámites", () => {
    socketFake.emit.mockClear();
    renderHook(() => useEventosAdmin(vi.fn()));
    expect(socketFake.emit).toHaveBeenCalledWith("suscribirse-admin");
  });
});
