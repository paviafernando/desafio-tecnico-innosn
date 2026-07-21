import { beforeEach, describe, expect, it } from "vitest";
import { borrarSesion, guardarSesion, leerSesion, type Sesion } from "./sesion";

const sesionAdmin: Sesion = { token: "token-admin", rol: "admin", nombre: "Admin", email: "a@b.com" };

describe("sesion (persistencia en localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("devuelve null si no hay sesión guardada", () => {
    expect(leerSesion()).toBeNull();
  });

  it("guarda y recupera la sesión", () => {
    guardarSesion(sesionAdmin);
    expect(leerSesion()).toEqual(sesionAdmin);
  });

  it("borra la sesión", () => {
    guardarSesion(sesionAdmin);
    borrarSesion();
    expect(leerSesion()).toBeNull();
  });

  it("devuelve null si el contenido guardado no es JSON válido", () => {
    localStorage.setItem("tramites:sesion", "esto-no-es-json");
    expect(leerSesion()).toBeNull();
  });
});
