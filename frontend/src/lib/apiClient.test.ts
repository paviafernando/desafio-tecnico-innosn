import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./apiClient";

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("arma la URL completa y devuelve el JSON parseado", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hola: "mundo" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await apiFetch("/api/algo");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/algo"),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(resultado).toEqual({ hola: "mundo" });
  });

  it("agrega el header Authorization cuando se pasa un token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/algo", { token: "abc123" });

    const [, opciones] = fetchMock.mock.calls[0];
    expect((opciones.headers as Record<string, string>).Authorization).toBe("Bearer abc123");
  });

  it("serializa el body como JSON y setea el content-type", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/algo", { method: "POST", body: { nombre: "test" } });

    const [, opciones] = fetchMock.mock.calls[0];
    expect(opciones.body).toBe(JSON.stringify({ nombre: "test" }));
    expect((opciones.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("lanza ApiError con el status y el mensaje del backend si la respuesta no es ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Token inválido o expirado" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/api/algo")).rejects.toMatchObject({
      status: 401,
      message: "Token inválido o expirado",
    });
    await expect(apiFetch("/api/algo")).rejects.toBeInstanceOf(ApiError);
  });

  it("devuelve null si la respuesta no tiene contenido (204)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await apiFetch("/api/algo");
    expect(resultado).toBeNull();
  });
});
