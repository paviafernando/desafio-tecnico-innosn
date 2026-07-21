import {
  AuthAdminService,
  CredencialesInvalidasError,
  type Admin,
  type AdminsRepositorio,
  type EmisorJwt,
  type HashService,
} from "./authAdmin";

class AdminsRepositorioFake implements AdminsRepositorio {
  constructor(private admin: Admin | null) {}
  async obtenerPorEmail(email: string): Promise<Admin | null> {
    return this.admin && this.admin.email === email ? this.admin : null;
  }
}

class HashServiceFake implements HashService {
  async comparar(password: string, hash: string): Promise<boolean> {
    return `hash(${password})` === hash;
  }
}

class EmisorJwtFake implements EmisorJwt {
  ultimoPayload: Record<string, unknown> | null = null;
  firmar(payload: Record<string, unknown>): string {
    this.ultimoPayload = payload;
    return "token-fake";
  }
}

const adminDeEjemplo: Admin = {
  id: "admin-1",
  email: "admin@sannicolas.gob.ar",
  nombre: "Admin de prueba",
  passwordHash: "hash(secreta123)",
};

describe("AuthAdminService", () => {
  let repositorio: AdminsRepositorioFake;
  let hasher: HashServiceFake;
  let jwt: EmisorJwtFake;
  let service: AuthAdminService;

  beforeEach(() => {
    repositorio = new AdminsRepositorioFake(adminDeEjemplo);
    hasher = new HashServiceFake();
    jwt = new EmisorJwtFake();
    service = new AuthAdminService(repositorio, hasher, jwt);
  });

  it("devuelve un token y los datos del admin con credenciales correctas", async () => {
    const resultado = await service.login("admin@sannicolas.gob.ar", "secreta123");

    expect(resultado.token).toBe("token-fake");
    expect(resultado.admin).toEqual({
      id: "admin-1",
      email: "admin@sannicolas.gob.ar",
      nombre: "Admin de prueba",
    });
  });

  it("firma el JWT con el id, email y rol admin", async () => {
    await service.login("admin@sannicolas.gob.ar", "secreta123");

    expect(jwt.ultimoPayload).toEqual({
      sub: "admin-1",
      email: "admin@sannicolas.gob.ar",
      rol: "admin",
    });
  });

  it("rechaza un email que no existe", async () => {
    await expect(service.login("no-existe@x.com", "secreta123")).rejects.toThrow(
      CredencialesInvalidasError,
    );
  });

  it("rechaza una contraseña incorrecta", async () => {
    await expect(service.login("admin@sannicolas.gob.ar", "incorrecta")).rejects.toThrow(
      CredencialesInvalidasError,
    );
  });
});
