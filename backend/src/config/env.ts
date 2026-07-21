import "dotenv/config";

function requerido(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }
  return valor;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: requerido("DATABASE_URL"),
  jwt: {
    secreto: requerido("JWT_SECRET"),
    expiracion: process.env.JWT_EXPIRES_IN ?? "8h",
  },
  storage: {
    bucket: requerido("STORAGE_BUCKET"),
    region: process.env.STORAGE_REGION ?? "us-east-1",
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
    accessKeyId: requerido("STORAGE_ACCESS_KEY_ID"),
    secretAccessKey: requerido("STORAGE_SECRET_ACCESS_KEY"),
  },
};
