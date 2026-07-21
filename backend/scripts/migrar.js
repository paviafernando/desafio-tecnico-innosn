// Runner mínimo de migraciones SQL: aplica en orden los archivos de
// migrations/ que todavía no figuren en la tabla de control
// esquema_migraciones. No usa un framework aparte (node-pg-migrate, etc.)
// porque el volumen de migraciones de este proyecto no lo justifica.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const DIRECTORIO_MIGRACIONES = path.join(__dirname, "..", "migrations");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS esquema_migraciones (
        nombre text PRIMARY KEY,
        aplicada_en timestamptz NOT NULL DEFAULT now()
      );
    `);

    const { rows } = await client.query("SELECT nombre FROM esquema_migraciones");
    const aplicadas = new Set(rows.map((fila) => fila.nombre));

    const archivos = fs
      .readdirSync(DIRECTORIO_MIGRACIONES)
      .filter((archivo) => archivo.endsWith(".sql"))
      .sort();

    for (const archivo of archivos) {
      if (aplicadas.has(archivo)) continue;

      const sql = fs.readFileSync(path.join(DIRECTORIO_MIGRACIONES, archivo), "utf8");
      console.log(`Aplicando migración: ${archivo}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO esquema_migraciones (nombre) VALUES ($1)", [archivo]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Falló la migración "${archivo}": ${error.message}`);
      }
    }

    console.log("Migraciones al día.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
