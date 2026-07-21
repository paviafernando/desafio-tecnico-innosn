import "dotenv/config";
import { Pool } from "pg";
import { AdminsPgRepositorio } from "./adminsPgRepositorio";
import { AuthAdminService, CredencialesInvalidasError } from "../services/authAdmin";
import { BcryptHashService } from "../adapters/seguridad/bcryptHashService";
import { JwtService } from "../adapters/seguridad/jwtService";

describe("AdminsPgRepositorio (integración contra PostgreSQL real)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const repositorio = new AdminsPgRepositorio(pool);
  const hasher = new BcryptHashService(4);
  const jwt = new JwtService("secreto-de-test", "1h");
  const service = new AuthAdminService(repositorio, hasher, jwt);

  beforeEach(async () => {
    await pool.query("TRUNCATE admins RESTART IDENTITY CASCADE");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("permite loguearse con un admin real, con la contraseña hasheada en la base", async () => {
    const passwordHash = await hasher.hashear("secreta123");
    await pool.query(
      `INSERT INTO admins (email, password_hash, nombre) VALUES ($1, $2, $3)`,
      ["admin-test@sannicolas.gob.ar", passwordHash, "Admin de San Nicolás"],
    );

    const sesion = await service.login("admin-test@sannicolas.gob.ar", "secreta123");

    expect(sesion.admin.email).toBe("admin-test@sannicolas.gob.ar");
    expect(sesion.token).toEqual(expect.any(String));

    const payload = jwt.verificar(sesion.token);
    expect(payload.rol).toBe("admin");
  });

  it("rechaza una contraseña incorrecta contra el hash real", async () => {
    const passwordHash = await hasher.hashear("secreta123");
    await pool.query(
      `INSERT INTO admins (email, password_hash, nombre) VALUES ($1, $2, $3)`,
      ["admin-test@sannicolas.gob.ar", passwordHash, "Admin de San Nicolás"],
    );

    await expect(service.login("admin-test@sannicolas.gob.ar", "incorrecta")).rejects.toThrow(
      CredencialesInvalidasError,
    );
  });
});
