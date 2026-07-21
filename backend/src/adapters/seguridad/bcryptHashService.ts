import bcrypt from "bcryptjs";
import type { HashService } from "../../services/authAdmin";

export class BcryptHashService implements HashService {
  constructor(private readonly rondas: number = 10) {}

  async hashear(password: string): Promise<string> {
    return bcrypt.hash(password, this.rondas);
  }

  async comparar(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
