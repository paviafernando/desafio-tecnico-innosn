import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3AlmacenamientoArchivos } from "./s3AlmacenamientoArchivos";

describe("S3AlmacenamientoArchivos", () => {
  describe("subir", () => {
    it("sube el archivo al bucket configurado con una clave única dentro de la carpeta indicada", async () => {
      const send = jest.fn().mockResolvedValue({});
      const cliente = { send } as unknown as S3Client;
      const almacenamiento = new S3AlmacenamientoArchivos(cliente, "tramites-archivos");

      const resultado = await almacenamiento.subir({
        nombreOriginal: "ficha-medica.pdf",
        mimeType: "application/pdf",
        contenido: Buffer.from("contenido"),
        carpeta: "becas-deportivas",
      });

      expect(resultado.claveAlmacenamiento).toMatch(/^becas-deportivas\/.+-ficha-medica\.pdf$/);
      expect(send).toHaveBeenCalledTimes(1);

      const comando = send.mock.calls[0][0] as PutObjectCommand;
      expect(comando.input.Bucket).toBe("tramites-archivos");
      expect(comando.input.Key).toBe(resultado.claveAlmacenamiento);
      expect(comando.input.ContentType).toBe("application/pdf");
    });

    it("usa la carpeta por defecto \"tramites\" si no se especifica una", async () => {
      const send = jest.fn().mockResolvedValue({});
      const cliente = { send } as unknown as S3Client;
      const almacenamiento = new S3AlmacenamientoArchivos(cliente, "tramites-archivos");

      const resultado = await almacenamiento.subir({
        nombreOriginal: "doc.pdf",
        mimeType: "application/pdf",
        contenido: Buffer.from("x"),
      });

      expect(resultado.claveAlmacenamiento).toMatch(/^tramites\//);
    });
  });

  describe("eliminar", () => {
    it("elimina el objeto correspondiente a la clave", async () => {
      const send = jest.fn().mockResolvedValue({});
      const cliente = { send } as unknown as S3Client;
      const almacenamiento = new S3AlmacenamientoArchivos(cliente, "tramites-archivos");

      await almacenamiento.eliminar("becas-deportivas/abc-doc.pdf");

      const comando = send.mock.calls[0][0] as DeleteObjectCommand;
      expect(comando.input.Bucket).toBe("tramites-archivos");
      expect(comando.input.Key).toBe("becas-deportivas/abc-doc.pdf");
    });
  });

  describe("obtenerUrlDescarga", () => {
    it("genera una URL firmada apuntando al bucket y la clave indicados", async () => {
      const clienteReal = new S3Client({
        region: "us-east-1",
        credentials: { accessKeyId: "test", secretAccessKey: "test" },
      });
      const almacenamiento = new S3AlmacenamientoArchivos(clienteReal, "tramites-archivos");

      const url = await almacenamiento.obtenerUrlDescarga("becas-deportivas/abc-doc.pdf", 60);

      expect(url).toContain("tramites-archivos");
      expect(url).toContain("becas-deportivas/abc-doc.pdf");
      expect(url).toContain("X-Amz-Expires=60");
    });
  });
});
