import { Pool } from "pg";

let pool: Pool | undefined;

export function obtenerPool(connectionString: string): Pool {
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function cerrarPool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
