import { manejoErrores } from "./manejoErrores";
import type { Request, Response } from "express";

function crearResponseFake() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

class CredencialesInvalidasError extends Error {
  constructor() {
    super("Email o contraseña incorrectos");
    this.name = "CredencialesInvalidasError";
  }
}

class ErrorSinMapear extends Error {
  constructor() {
    super("Algo inesperado");
    this.name = "ErrorSinMapear";
  }
}

describe("manejoErrores", () => {
  const req = {} as Request;
  const next = jest.fn();

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("mapea un error conocido a su status HTTP y expone el mensaje", () => {
    const res = crearResponseFake();

    manejoErrores(new CredencialesInvalidasError(), req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Email o contraseña incorrectos" });
  });

  it("devuelve 500 y no filtra el mensaje interno para un error no mapeado", () => {
    const res = crearResponseFake();

    manejoErrores(new ErrorSinMapear(), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error interno del servidor" });
  });
});
