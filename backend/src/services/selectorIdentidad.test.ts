import {
  SelectorIdentidadService,
  IdentidadDesconocidaError,
  type IdentidadCiudadana,
} from "./selectorIdentidad";
import type { EmisorJwt } from "./authAdmin";

class EmisorJwtFake implements EmisorJwt {
  ultimoPayload: Record<string, unknown> | null = null;
  firmar(payload: Record<string, unknown>): string {
    this.ultimoPayload = payload;
    return "token-fake";
  }
}

const identidades: IdentidadCiudadana[] = [
  { dni: "30123456", nombre: "Juana Pérez", email: "juana@example.com" },
  { dni: "28987654", nombre: "Martín Gómez", email: "martin@example.com" },
];

describe("SelectorIdentidadService", () => {
  let jwt: EmisorJwtFake;
  let service: SelectorIdentidadService;

  beforeEach(() => {
    jwt = new EmisorJwtFake();
    service = new SelectorIdentidadService(identidades, jwt);
  });

  it("lista las identidades de prueba disponibles", () => {
    expect(service.listar()).toEqual(identidades);
  });

  it("emite un token para una identidad conocida", () => {
    const sesion = service.emitirSesion("30123456");

    expect(sesion.token).toBe("token-fake");
    expect(sesion.identidad).toEqual(identidades[0]);
  });

  it("firma el JWT con el dni como sub, los datos de la identidad y rol ciudadano", () => {
    service.emitirSesion("30123456");

    expect(jwt.ultimoPayload).toEqual({
      sub: "30123456",
      nombre: "Juana Pérez",
      email: "juana@example.com",
      rol: "ciudadano",
    });
  });

  it("rechaza un dni que no está en la lista de identidades de prueba", () => {
    expect(() => service.emitirSesion("00000000")).toThrow(IdentidadDesconocidaError);
  });
});
