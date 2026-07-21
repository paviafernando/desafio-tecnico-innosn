import { z } from "zod";
import { validarBody } from "./validarBody";
import type { Request, Response } from "express";

function crearRequestFake(body: unknown): Request {
  return { body } as unknown as Request;
}

function crearResponseFake() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

const esquema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

describe("validarBody", () => {
  it("llama a next y reemplaza req.body por los datos parseados cuando son válidos", () => {
    const middleware = validarBody(esquema);
    const req = crearRequestFake({ email: "a@b.com", password: "123", extra: "se descarta" });
    const res = crearResponseFake();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ email: "a@b.com", password: "123" });
  });

  it("responde 400 con el detalle de los errores si el body no cumple el esquema", () => {
    const middleware = validarBody(esquema);
    const req = crearRequestFake({ email: "no-es-un-email" });
    const res = crearResponseFake();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Datos inválidos" }),
    );
  });
});
