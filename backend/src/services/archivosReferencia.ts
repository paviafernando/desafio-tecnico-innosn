import type { ArchivoReferencia } from "./tiposTramite";

export interface AlmacenamientoConsulta {
  obtenerUrlDescarga(claveAlmacenamiento: string, expiracionSegundos?: number): Promise<string>;
}

/**
 * `ArchivoReferencia.url` guarda la clave de storage (S3/MinIO), no una URL
 * pública: el bucket es privado. Esta función la resuelve a una URL de
 * descarga firmada recién al momento de responder, para que nunca quede
 * vencida (igual que los recursos que sube el admin sobre un trámite puntual).
 */
export async function resolverArchivosReferencia(
  archivos: ArchivoReferencia[],
  storage: AlmacenamientoConsulta,
): Promise<ArchivoReferencia[]> {
  return Promise.all(
    archivos.map(async (archivo) => ({
      ...archivo,
      url: await storage.obtenerUrlDescarga(archivo.url),
    })),
  );
}
