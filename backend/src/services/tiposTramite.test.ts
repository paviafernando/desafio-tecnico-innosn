import {
  TiposTramiteService,
  TipoTramiteArchivadoError,
  TipoTramiteInvalidoError,
  TipoTramiteNoEncontradoError,
  EstadoTipoTramiteInvalidoError,
  type DatosCreacionTipoTramite,
  type DatosTipoTramite,
  type TipoTramite,
  type TiposTramiteRepositorio,
} from "./tiposTramite";
import type { EsquemaFormulario } from "../domain/esquemaFormulario";
import type { FlujoEstados } from "../domain/flujoEstados";

function esquemaValido(): EsquemaFormulario {
  return {
    campos: [
      { id: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
      { id: "dni", etiqueta: "DNI", tipo: "texto", requerido: true },
      { id: "email", etiqueta: "Email", tipo: "email", requerido: true },
      { id: "telefono", etiqueta: "Teléfono", tipo: "telefono", requerido: true },
      { id: "domicilio", etiqueta: "Domicilio", tipo: "texto", requerido: true },
      { id: "motivo", etiqueta: "Motivo", tipo: "texto_largo", requerido: true },
      { id: "fecha_nacimiento", etiqueta: "Fecha de nacimiento", tipo: "fecha", requerido: true },
      { id: "comprobante", etiqueta: "Comprobante", tipo: "archivo", requerido: true },
    ],
  };
}

function flujoValido(): FlujoEstados {
  return {
    inicial: "pendiente",
    estados: ["pendiente", "en_revision", "aprobado", "rechazado"],
    transiciones: {
      pendiente: ["en_revision"],
      en_revision: ["aprobado", "rechazado"],
      aprobado: [],
      rechazado: [],
    },
  };
}

function datosValidos(): DatosTipoTramite {
  return {
    nombre: "Habilitación comercial",
    descripcion: "Solicitud de habilitación para un local comercial",
    esquemaFormulario: esquemaValido(),
    flujoEstados: flujoValido(),
  };
}

class RepositorioFake implements TiposTramiteRepositorio {
  private tipos = new Map<string, TipoTramite>();
  private instancias = new Map<string, number>();
  private siguienteId = 1;

  async crear(datos: DatosCreacionTipoTramite): Promise<TipoTramite> {
    const id = String(this.siguienteId++);
    const tipo: TipoTramite = {
      id,
      ...datos,
      publicadoEn: null,
      publicadoPor: null,
    };
    this.tipos.set(id, tipo);
    return tipo;
  }

  async obtenerPorId(id: string): Promise<TipoTramite | null> {
    return this.tipos.get(id) ?? null;
  }

  async actualizar(id: string, cambios: Partial<TipoTramite>): Promise<TipoTramite> {
    const existente = this.tipos.get(id);
    if (!existente) throw new Error("no existe");
    const actualizado = { ...existente, ...cambios };
    this.tipos.set(id, actualizado);
    return actualizado;
  }

  async contarInstancias(tipoTramiteId: string): Promise<number> {
    return this.instancias.get(tipoTramiteId) ?? 0;
  }

  // Helper de test: simula que ya se cargaron trámites contra ese tipo.
  simularInstancias(tipoTramiteId: string, cantidad: number) {
    this.instancias.set(tipoTramiteId, cantidad);
  }
}

describe("TiposTramiteService", () => {
  let repositorio: RepositorioFake;
  let service: TiposTramiteService;

  beforeEach(() => {
    repositorio = new RepositorioFake();
    service = new TiposTramiteService(repositorio);
  });

  describe("crear", () => {
    it("crea el tipo de trámite en estado borrador, versión 1", async () => {
      const tipo = await service.crear(datosValidos());

      expect(tipo.id).toBeDefined();
      expect(tipo.nombre).toBe("Habilitación comercial");
      expect(tipo.estado).toBe("borrador");
      expect(tipo.version).toBe(1);
      expect(tipo.tipoTramiteOrigenId).toBeNull();
    });

    it("completa la metadata informativa con valores por defecto si no se especifica", async () => {
      const tipo = await service.crear(datosValidos());

      expect(tipo.categoria).toBeNull();
      expect(tipo.requisitos).toEqual([]);
      expect(tipo.pasos).toEqual([]);
      expect(tipo.archivosReferencia).toEqual([]);
      expect(tipo.costo).toBeNull();
      expect(tipo.modalidad).toBeNull();
      expect(tipo.contacto).toEqual({});
    });

    it("conserva la metadata informativa provista", async () => {
      const tipo = await service.crear({
        ...datosValidos(),
        categoria: "Deportes",
        requisitos: ["DNI original", "Ficha médica completa"],
        pasos: ["Completar formulario", "Esperar validación"],
        costo: "Gratuito",
        modalidad: "online",
        contacto: { email: "deportes@sannicolas.gob.ar" },
      });

      expect(tipo.categoria).toBe("Deportes");
      expect(tipo.requisitos).toEqual(["DNI original", "Ficha médica completa"]);
      expect(tipo.costo).toBe("Gratuito");
      expect(tipo.contacto).toEqual({ email: "deportes@sannicolas.gob.ar" });
    });

    it("rechaza un esquema de formulario inválido sin llegar al repositorio", async () => {
      const datos = { ...datosValidos(), esquemaFormulario: { campos: [] } };

      await expect(service.crear(datos)).rejects.toThrow(TipoTramiteInvalidoError);
      expect(await repositorio.obtenerPorId("1")).toBeNull();
    });

    it("rechaza un flujo de estados inválido", async () => {
      const datos = {
        ...datosValidos(),
        flujoEstados: { ...flujoValido(), inicial: "no_existe" },
      };

      await expect(service.crear(datos)).rejects.toThrow(TipoTramiteInvalidoError);
    });
  });

  describe("publicar", () => {
    it("publica un tipo en borrador y registra quién y cuándo", async () => {
      const creado = await service.crear(datosValidos());

      const publicado = await service.publicar(creado.id, "admin-1");

      expect(publicado.estado).toBe("publicado");
      expect(publicado.publicadoPor).toBe("admin-1");
      expect(publicado.publicadoEn).toBeInstanceOf(Date);
    });

    it("rechaza publicar un tipo que no está en borrador", async () => {
      const creado = await service.crear(datosValidos());
      await service.publicar(creado.id, "admin-1");

      await expect(service.publicar(creado.id, "admin-1")).rejects.toThrow(
        EstadoTipoTramiteInvalidoError,
      );
    });

    it("al publicar una nueva versión, archiva la versión anterior que estaba publicada", async () => {
      const v1 = await service.crear(datosValidos());
      await service.publicar(v1.id, "admin-1");
      repositorio.simularInstancias(v1.id, 1);

      const v2 = await service.editar(v1.id, { nombre: "Nuevo nombre" });
      await service.publicar(v2.id, "admin-1");

      const v1Actualizado = await repositorio.obtenerPorId(v1.id);
      expect(v1Actualizado?.estado).toBe("archivado");
    });
  });

  describe("editar", () => {
    it("edita in place un tipo en borrador", async () => {
      const creado = await service.crear(datosValidos());

      const editado = await service.editar(creado.id, { nombre: "Nuevo nombre" });

      expect(editado.id).toBe(creado.id);
      expect(editado.nombre).toBe("Nuevo nombre");
      expect(editado.version).toBe(1);
    });

    it("edita in place un tipo publicado sin trámites instanciados", async () => {
      const creado = await service.crear(datosValidos());
      await service.publicar(creado.id, "admin-1");

      const editado = await service.editar(creado.id, { nombre: "Nuevo nombre" });

      expect(editado.id).toBe(creado.id);
      expect(editado.version).toBe(1);
    });

    it("crea una nueva versión en borrador al editar un tipo publicado con trámites instanciados, sin tocar el original", async () => {
      const creado = await service.crear(datosValidos());
      await service.publicar(creado.id, "admin-1");
      repositorio.simularInstancias(creado.id, 3);

      const nuevaVersion = await service.editar(creado.id, { nombre: "Nuevo nombre" });

      expect(nuevaVersion.id).not.toBe(creado.id);
      expect(nuevaVersion.nombre).toBe("Nuevo nombre");
      expect(nuevaVersion.version).toBe(2);
      expect(nuevaVersion.estado).toBe("borrador");
      expect(nuevaVersion.tipoTramiteOrigenId).toBe(creado.id);

      const original = await repositorio.obtenerPorId(creado.id);
      expect(original?.nombre).toBe("Habilitación comercial");
      expect(original?.estado).toBe("publicado");
    });

    it("revalida el esquema si se edita el formulario", async () => {
      const creado = await service.crear(datosValidos());

      await expect(
        service.editar(creado.id, { esquemaFormulario: { campos: [] } }),
      ).rejects.toThrow(TipoTramiteInvalidoError);
    });

    it("rechaza editar un tipo archivado", async () => {
      const creado = await service.crear(datosValidos());
      await repositorio.actualizar(creado.id, { estado: "archivado" });

      await expect(service.editar(creado.id, { nombre: "x" })).rejects.toThrow(
        TipoTramiteArchivadoError,
      );
    });

    it("lanza TipoTramiteNoEncontradoError si el id no existe", async () => {
      await expect(service.editar("no-existe", { nombre: "x" })).rejects.toThrow(
        TipoTramiteNoEncontradoError,
      );
    });
  });
});
