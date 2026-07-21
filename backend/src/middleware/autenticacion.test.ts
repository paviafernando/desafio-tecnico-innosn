import { crearMiddlewareAutenticacion, type VerificadorJwt } from "./autenticacion";
import type { Request, Response } from "express";

function crearRequestFake(authorizationHeader?: string) {
  return { headers: { authorization: authorizationHeader } } as unknown as Request;
}

function crearResponseFake() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

class VerificadorJwtFake implements VerificadorJwt {
  constructor(private payloadsValidos: Record<string, Record<string, unknown>>) {}
  verificar(token: string): Record<string, unknown> {
    const payload = this.payloadsValidos[token];
    if (!payload) throw new Error("token inválido");
    return payload;
  }
}

describe("crearMiddlewareAutenticacion", () => {
  it("llama a next y adjunta el usuario cuando el token es válido", () => {
    const verificador = new VerificadorJwtFake({
      "token-valido": { sub: "vecino-1", rol: "ciudadano" },
    });
    const middleware = crearMiddlewareAutenticacion(verificador);
    const req = crearRequestFake("Bearer token-valido");
    const res = crearResponseFake();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.usuario).toEqual({ sub: "vecino-1", rol: "ciudadano" });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responde 401 si falta el header Authorization", () => {
    const verificador = new VerificadorJwtFake({});
    const middleware = crearMiddlewareAutenticacion(verificador);
    const req = crearRequestFake(undefined);
    const res = crearResponseFake();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 si el token es inválido", () => {
    const verificador = new VerificadorJwtFake({});
    const middleware = crearMiddlewareAutenticacion(verificador);
    const req = crearRequestFake("Bearer token-invalido");
    const res = crearResponseFake();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 si el rol del token no está en los roles permitidos", () => {
    const verificador = new VerificadorJwtFake({
      "token-vecino": { sub: "vecino-1", rol: "ciudadano" },
    });
    const middleware = crearMiddlewareAutenticacion(verificador, ["admin"]);
    const req = crearRequestFake("Bearer token-vecino");
    const res = crearResponseFake();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("permite pasar si el rol coincide con alguno de los roles permitidos", () => {
    const verificador = new VerificadorJwtFake({
      "token-admin": { sub: "admin-1", rol: "admin" },
    });
    const middleware = crearMiddlewareAutenticacion(verificador, ["admin"]);
    const req = crearRequestFake("Bearer token-admin");
    const res = crearResponseFake();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
