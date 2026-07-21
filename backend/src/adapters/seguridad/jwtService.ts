import jwt from "jsonwebtoken";
import type { EmisorJwt } from "../../services/authAdmin";

export class TokenInvalidoError extends Error {
  constructor() {
    super("El token es inválido o expiró");
    this.name = "TokenInvalidoError";
  }
}

export class JwtService implements EmisorJwt {
  constructor(
    private readonly secreto: string,
    private readonly expiracion: string,
  ) {}

  firmar(payload: Record<string, unknown>): string {
    return jwt.sign(payload, this.secreto, { expiresIn: this.expiracion } as jwt.SignOptions);
  }

  verificar(token: string): Record<string, unknown> {
    try {
      return jwt.verify(token, this.secreto) as Record<string, unknown>;
    } catch {
      throw new TokenInvalidoError();
    }
  }
}
