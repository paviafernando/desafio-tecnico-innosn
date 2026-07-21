import { resolverArchivosReferencia, type AlmacenamientoConsulta } from "./archivosReferencia";
import type { ArchivoReferencia } from "./tiposTramite";

class AlmacenamientoFake implements AlmacenamientoConsulta {
  async obtenerUrlDescarga(clave: string): Promise<string> {
    return `https://storage.example.com/${clave}?firma=abc`;
  }
}

describe("resolverArchivosReferencia", () => {
  it("convierte la clave de storage de cada archivo en una URL de descarga firmada", async () => {
    const archivos: ArchivoReferencia[] = [
      { nombre: "ordenanza.pdf", url: "referencias/ordenanza.pdf" },
      { nombre: "instructivo.pdf", url: "referencias/instructivo.pdf" },
    ];

    const resueltos = await resolverArchivosReferencia(archivos, new AlmacenamientoFake());

    expect(resueltos).toEqual([
      { nombre: "ordenanza.pdf", url: "https://storage.example.com/referencias/ordenanza.pdf?firma=abc" },
      { nombre: "instructivo.pdf", url: "https://storage.example.com/referencias/instructivo.pdf?firma=abc" },
    ]);
  });

  it("devuelve una lista vacía si no hay archivos", async () => {
    const resueltos = await resolverArchivosReferencia([], new AlmacenamientoFake());
    expect(resueltos).toEqual([]);
  });
});
