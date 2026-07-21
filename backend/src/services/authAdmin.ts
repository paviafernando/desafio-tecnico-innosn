export interface Admin {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
}

export interface AdminsRepositorio {
  obtenerPorEmail(email: string): Promise<Admin | null>;
}

export interface HashService {
  comparar(password: string, hash: string): Promise<boolean>;
}

export interface EmisorJwt {
  firmar(payload: Record<string, unknown>): string;
}

export interface SesionAdmin {
  token: string;
  admin: {
    id: string;
    email: string;
    nombre: string;
  };
}

export class CredencialesInvalidasError extends Error {
  constructor() {
    super("Email o contraseña incorrectos");
    this.name = "CredencialesInvalidasError";
  }
}

export class AuthAdminService {
  constructor(
    private readonly repositorio: AdminsRepositorio,
    private readonly hasher: HashService,
    private readonly jwt: EmisorJwt,
  ) {}

  async login(email: string, password: string): Promise<SesionAdmin> {
    const admin = await this.repositorio.obtenerPorEmail(email);
    if (!admin) {
      throw new CredencialesInvalidasError();
    }

    const passwordCorrecta = await this.hasher.comparar(password, admin.passwordHash);
    if (!passwordCorrecta) {
      throw new CredencialesInvalidasError();
    }

    const token = this.jwt.firmar({ sub: admin.id, email: admin.email, rol: "admin" });

    return {
      token,
      admin: { id: admin.id, email: admin.email, nombre: admin.nombre },
    };
  }
}
