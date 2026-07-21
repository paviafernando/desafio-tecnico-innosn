import { BcryptHashService } from "./bcryptHashService";

describe("BcryptHashService", () => {
  const service = new BcryptHashService(4); // costo bajo para que el test sea rápido

  it("genera un hash distinto del texto plano", async () => {
    const hash = await service.hashear("secreta123");
    expect(hash).not.toBe("secreta123");
  });

  it("compara correctamente una contraseña válida contra su hash", async () => {
    const hash = await service.hashear("secreta123");
    await expect(service.comparar("secreta123", hash)).resolves.toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await service.hashear("secreta123");
    await expect(service.comparar("otra-cosa", hash)).resolves.toBe(false);
  });
});
