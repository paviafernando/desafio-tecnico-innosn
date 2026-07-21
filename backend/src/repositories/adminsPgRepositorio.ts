import type { Pool } from "pg";
import type { Admin, AdminsRepositorio } from "../services/authAdmin";

interface FilaAdmin {
  id: string;
  email: string;
  nombre: string;
  password_hash: string;
}

function mapearAdmin(fila: FilaAdmin): Admin {
  return {
    id: fila.id,
    email: fila.email,
    nombre: fila.nombre,
    passwordHash: fila.password_hash,
  };
}

export class AdminsPgRepositorio implements AdminsRepositorio {
  constructor(private readonly pool: Pool) {}

  async obtenerPorEmail(email: string): Promise<Admin | null> {
    const { rows } = await this.pool.query<FilaAdmin>("SELECT * FROM admins WHERE email = $1", [email]);
    return rows[0] ? mapearAdmin(rows[0]) : null;
  }
}
