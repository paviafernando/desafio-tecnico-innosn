import { JwtService, TokenInvalidoError } from "./jwtService";

describe("JwtService", () => {
  const service = new JwtService("secreto-de-test", "1h");

  it("firma y verifica un payload propio", () => {
    const token = service.firmar({ sub: "admin-1", rol: "admin" });
    const payload = service.verificar(token);

    expect(payload.sub).toBe("admin-1");
    expect(payload.rol).toBe("admin");
  });

  it("rechaza un token con firma inválida", () => {
    const otroService = new JwtService("otro-secreto", "1h");
    const token = otroService.firmar({ sub: "admin-1" });

    expect(() => service.verificar(token)).toThrow(TokenInvalidoError);
  });

  it("rechaza un token malformado", () => {
    expect(() => service.verificar("esto-no-es-un-jwt")).toThrow(TokenInvalidoError);
  });

  it("rechaza un token expirado", () => {
    const serviceDeVidaCorta = new JwtService("secreto-de-test", "-1s");
    const token = serviceDeVidaCorta.firmar({ sub: "admin-1" });

    expect(() => service.verificar(token)).toThrow(TokenInvalidoError);
  });
});
