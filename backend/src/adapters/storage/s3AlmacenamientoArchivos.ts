import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface DatosArchivoASubir {
  nombreOriginal: string;
  mimeType: string;
  contenido: Buffer;
  carpeta?: string;
}

export interface ArchivoAlmacenado {
  claveAlmacenamiento: string;
}

export interface AlmacenamientoArchivos {
  subir(datos: DatosArchivoASubir): Promise<ArchivoAlmacenado>;
  obtenerUrlDescarga(claveAlmacenamiento: string, expiracionSegundos?: number): Promise<string>;
  eliminar(claveAlmacenamiento: string): Promise<void>;
}

const CARPETA_POR_DEFECTO = "tramites";

/**
 * Usa el SDK de S3 contra el endpoint que indique la configuración: apuntado a
 * MinIO en desarrollo, o a un bucket real de AWS en producción, sin cambiar código.
 */
export class S3AlmacenamientoArchivos implements AlmacenamientoArchivos {
  constructor(
    private readonly cliente: S3Client,
    private readonly bucket: string,
  ) {}

  async subir(datos: DatosArchivoASubir): Promise<ArchivoAlmacenado> {
    const carpeta = datos.carpeta ?? CARPETA_POR_DEFECTO;
    const clave = `${carpeta}/${randomUUID()}-${datos.nombreOriginal}`;

    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: clave,
        Body: datos.contenido,
        ContentType: datos.mimeType,
      }),
    );

    return { claveAlmacenamiento: clave };
  }

  async obtenerUrlDescarga(claveAlmacenamiento: string, expiracionSegundos = 3600): Promise<string> {
    const comando = new GetObjectCommand({ Bucket: this.bucket, Key: claveAlmacenamiento });
    return getSignedUrl(this.cliente, comando, { expiresIn: expiracionSegundos });
  }

  async eliminar(claveAlmacenamiento: string): Promise<void> {
    await this.cliente.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: claveAlmacenamiento }));
  }
}

export interface ConfiguracionStorage {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle: boolean;
  accessKeyId: string;
  secretAccessKey: string;
}

export function crearClienteS3(config: ConfiguracionStorage): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}
