import {
  TramitesService,
  DatosFormularioInvalidosError,
  TipoTramiteNoDisponibleError,
  TramiteNoEncontradoError,
  ComentarioInvalidoError,
  type DatosCrearTramite,
  type Tramite,
  type Comentario,
  type EventoHistorial,
  type DatosEventoHistorial,
  type TramitesRepositorio,
  type EmisorEventos,
} from "./tramites";
import { TransicionInvalidaError, type FlujoEstados } from "../domain/flujoEstados";
import type { EsquemaFormulario } from "../domain/esquemaFormulario";
import type { TipoTramite } from "./tiposTramite";

const flujo: FlujoEstados = {
  inicial: "pendiente",
  estados: ["pendiente", "en_revision", "aprobado", "rechazado"],
  transiciones: {
    pendiente: ["en_revision"],
    en_revision: ["aprobado", "rechazado"],
    aprobado: [],
    rechazado: [],
  },
};

const esquema: EsquemaFormulario = {
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

function tipoTramitePublicado(overrides: Partial<TipoTramite> = {}): TipoTramite {
  return {
    id: "tipo-1",
    nombre: "Inscripción a becas deportivas",
    descripcion: "...",
    esquemaFormulario: esquema,
    flujoEstados: flujo,
    version: 1,
    estado: "publicado",
    tipoTramiteOrigenId: null,
    publicadoEn: new Date(),
    publicadoPor: "admin-1",
    categoria: null,
    requisitos: [],
    pasos: [],
    archivosReferencia: [],
    costo: null,
    modalidad: null,
    contacto: {},
    ...overrides,
  };
}

function datosFormularioValidos(): Record<string, unknown> {
  return {
    nombre: "Juana Pérez",
    dni: "30123456",
    email: "juana@example.com",
    telefono: "3364000000",
    domicilio: "Calle Falsa 123",
    motivo: "Quiero anotarme",
    fecha_nacimiento: "2015-01-01",
    comprobante: "storage-key-abc",
  };
}

function datosCrearValidos(): DatosCrearTramite {
  return {
    tipoTramiteId: "tipo-1",
    ciudadanoId: "30123456",
    ciudadanoNombre: "Juana Pérez",
    ciudadanoEmail: "juana@example.com",
    datosFormulario: datosFormularioValidos(),
  };
}

class TiposTramiteRepositorioFake {
  constructor(private tipo: TipoTramite | null) {}
  async obtenerPorId(id: string): Promise<TipoTramite | null> {
    return this.tipo && this.tipo.id === id ? this.tipo : null;
  }
}

class TramitesRepositorioFake implements TramitesRepositorio {
  tramites = new Map<string, Tramite>();
  comentarios: Comentario[] = [];
  eventos: EventoHistorial[] = [];
  private siguienteId = 1;

  async crear(datos: DatosCrearTramite & { estadoInicial: string }): Promise<Tramite> {
    const id = String(this.siguienteId++);
    const tramite: Tramite = {
      id,
      tipoTramiteId: datos.tipoTramiteId,
      ciudadanoId: datos.ciudadanoId,
      ciudadanoNombre: datos.ciudadanoNombre,
      ciudadanoEmail: datos.ciudadanoEmail,
      datosFormulario: datos.datosFormulario,
      estadoActual: datos.estadoInicial,
      createdAt: new Date(),
    };
    this.tramites.set(id, tramite);
    return tramite;
  }

  async obtenerPorId(id: string): Promise<Tramite | null> {
    return this.tramites.get(id) ?? null;
  }

  async cambiarEstado(id: string, nuevoEstado: string): Promise<Tramite> {
    const existente = this.tramites.get(id);
    if (!existente) throw new Error("no existe");
    const actualizado = { ...existente, estadoActual: nuevoEstado };
    this.tramites.set(id, actualizado);
    return actualizado;
  }

  async agregarComentario(tramiteId: string, adminId: string, texto: string): Promise<Comentario> {
    const comentario: Comentario = {
      id: String(this.siguienteId++),
      tramiteId,
      adminId,
      texto,
      createdAt: new Date(),
    };
    this.comentarios.push(comentario);
    return comentario;
  }

  async agregarEvento(datos: DatosEventoHistorial): Promise<EventoHistorial> {
    const evento: EventoHistorial = { id: String(this.siguienteId++), createdAt: new Date(), ...datos };
    this.eventos.push(evento);
    return evento;
  }
}

class EmisorEventosFake implements EmisorEventos {
  emitidos: Array<{ nombre: string; payload: unknown }> = [];
  emitir(nombre: string, payload: unknown): void {
    this.emitidos.push({ nombre, payload });
  }
}

describe("TramitesService", () => {
  let tiposTramite: TiposTramiteRepositorioFake;
  let repositorio: TramitesRepositorioFake;
  let emisor: EmisorEventosFake;
  let service: TramitesService;

  beforeEach(() => {
    tiposTramite = new TiposTramiteRepositorioFake(tipoTramitePublicado());
    repositorio = new TramitesRepositorioFake();
    emisor = new EmisorEventosFake();
    service = new TramitesService(repositorio, tiposTramite, emisor);
  });

  describe("crear", () => {
    it("crea el trámite en el estado inicial del flujo del tipo", async () => {
      const tramite = await service.crear(datosCrearValidos());

      expect(tramite.estadoActual).toBe("pendiente");
      expect(tramite.tipoTramiteId).toBe("tipo-1");
    });

    it("registra un evento de historial de tipo creación", async () => {
      const tramite = await service.crear(datosCrearValidos());

      expect(repositorio.eventos).toHaveLength(1);
      expect(repositorio.eventos[0]).toMatchObject({
        tramiteId: tramite.id,
        tipoEvento: "creacion",
        autorTipo: "ciudadano",
      });
    });

    it("emite un evento de dominio tramite.creado", async () => {
      const tramite = await service.crear(datosCrearValidos());

      expect(emisor.emitidos).toContainEqual({
        nombre: "tramite.creado",
        payload: { tramiteId: tramite.id },
      });
    });

    it("rechaza crear un trámite contra un tipo inexistente", async () => {
      tiposTramite = new TiposTramiteRepositorioFake(null);
      service = new TramitesService(repositorio, tiposTramite, emisor);

      await expect(service.crear(datosCrearValidos())).rejects.toThrow(
        TipoTramiteNoDisponibleError,
      );
    });

    it("rechaza crear un trámite contra un tipo en borrador", async () => {
      tiposTramite = new TiposTramiteRepositorioFake(
        tipoTramitePublicado({ estado: "borrador" }),
      );
      service = new TramitesService(repositorio, tiposTramite, emisor);

      await expect(service.crear(datosCrearValidos())).rejects.toThrow(
        TipoTramiteNoDisponibleError,
      );
    });

    it("rechaza datos de formulario incompletos sin crear el trámite", async () => {
      const datos = { ...datosCrearValidos(), datosFormulario: { nombre: "Juana" } };

      await expect(service.crear(datos)).rejects.toThrow(DatosFormularioInvalidosError);
      expect(repositorio.tramites.size).toBe(0);
    });
  });

  describe("cambiarEstado", () => {
    it("aplica una transición válida y registra el historial", async () => {
      const tramite = await service.crear(datosCrearValidos());

      const actualizado = await service.cambiarEstado(tramite.id, "en_revision", "admin-1");

      expect(actualizado.estadoActual).toBe("en_revision");
      expect(repositorio.eventos.at(-1)).toMatchObject({
        tipoEvento: "cambio_estado",
        estadoAnterior: "pendiente",
        estadoNuevo: "en_revision",
        autorTipo: "admin",
        autorIdentificador: "admin-1",
      });
    });

    it("emite un evento de dominio tramite.estado_cambiado", async () => {
      const tramite = await service.crear(datosCrearValidos());

      await service.cambiarEstado(tramite.id, "en_revision", "admin-1");

      expect(emisor.emitidos).toContainEqual({
        nombre: "tramite.estado_cambiado",
        payload: { tramiteId: tramite.id, estadoAnterior: "pendiente", estadoNuevo: "en_revision" },
      });
    });

    it("rechaza una transición inválida y no modifica el trámite", async () => {
      const tramite = await service.crear(datosCrearValidos());

      await expect(service.cambiarEstado(tramite.id, "aprobado", "admin-1")).rejects.toThrow(
        TransicionInvalidaError,
      );

      const sinCambios = await repositorio.obtenerPorId(tramite.id);
      expect(sinCambios?.estadoActual).toBe("pendiente");
    });

    it("lanza TramiteNoEncontradoError si el trámite no existe", async () => {
      await expect(service.cambiarEstado("no-existe", "en_revision", "admin-1")).rejects.toThrow(
        TramiteNoEncontradoError,
      );
    });
  });

  describe("agregarComentario", () => {
    it("agrega el comentario y registra el historial", async () => {
      const tramite = await service.crear(datosCrearValidos());

      const comentario = await service.agregarComentario(tramite.id, "admin-1", "Falta un dato");

      expect(comentario.texto).toBe("Falta un dato");
      expect(repositorio.eventos.at(-1)).toMatchObject({
        tipoEvento: "comentario",
        autorTipo: "admin",
        autorIdentificador: "admin-1",
      });
    });

    it("rechaza un comentario vacío", async () => {
      const tramite = await service.crear(datosCrearValidos());

      await expect(service.agregarComentario(tramite.id, "admin-1", "   ")).rejects.toThrow(
        ComentarioInvalidoError,
      );
    });

    it("lanza TramiteNoEncontradoError si el trámite no existe", async () => {
      await expect(
        service.agregarComentario("no-existe", "admin-1", "hola"),
      ).rejects.toThrow(TramiteNoEncontradoError);
    });
  });
});
