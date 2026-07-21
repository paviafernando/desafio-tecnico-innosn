import { validarDatosFormulario } from "../domain/datosFormulario";
import { aplicarTransicion } from "../domain/flujoEstados";
import type { TipoTramite } from "./tiposTramite";

export interface Tramite {
  id: string;
  tipoTramiteId: string;
  ciudadanoId: string;
  ciudadanoNombre: string;
  ciudadanoEmail: string;
  datosFormulario: Record<string, unknown>;
  estadoActual: string;
  createdAt: Date;
}

export interface DatosCrearTramite {
  tipoTramiteId: string;
  ciudadanoId: string;
  ciudadanoNombre: string;
  ciudadanoEmail: string;
  datosFormulario: Record<string, unknown>;
}

export interface Comentario {
  id: string;
  tramiteId: string;
  adminId: string;
  texto: string;
  createdAt: Date;
}

export type TipoEventoHistorial = "creacion" | "cambio_estado" | "comentario";
export type AutorTipo = "ciudadano" | "admin";

export interface DatosEventoHistorial {
  tramiteId: string;
  tipoEvento: TipoEventoHistorial;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  autorTipo: AutorTipo;
  autorIdentificador: string;
  detalle?: Record<string, unknown>;
}

export interface EventoHistorial extends DatosEventoHistorial {
  id: string;
  createdAt: Date;
}

export interface TramitesRepositorio {
  crear(datos: DatosCrearTramite & { estadoInicial: string }): Promise<Tramite>;
  obtenerPorId(id: string): Promise<Tramite | null>;
  cambiarEstado(id: string, nuevoEstado: string): Promise<Tramite>;
  agregarComentario(tramiteId: string, adminId: string, texto: string): Promise<Comentario>;
  agregarEvento(datos: DatosEventoHistorial): Promise<EventoHistorial>;
}

export interface TiposTramiteConsulta {
  obtenerPorId(id: string): Promise<TipoTramite | null>;
}

export interface EmisorEventos {
  emitir(nombre: string, payload: unknown): void;
}

export class TipoTramiteNoDisponibleError extends Error {
  constructor(tipoTramiteId: string) {
    super(
      `El tipo de trámite "${tipoTramiteId}" no existe o no está publicado, por lo tanto no admite nuevas instancias`,
    );
    this.name = "TipoTramiteNoDisponibleError";
  }
}

export class DatosFormularioInvalidosError extends Error {
  constructor(public readonly errores: string[]) {
    super(`Datos de formulario inválidos: ${errores.join("; ")}`);
    this.name = "DatosFormularioInvalidosError";
  }
}

export class TramiteNoEncontradoError extends Error {
  constructor(id: string) {
    super(`No existe un trámite con id "${id}"`);
    this.name = "TramiteNoEncontradoError";
  }
}

export class ComentarioInvalidoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ComentarioInvalidoError";
  }
}

export class TramitesService {
  constructor(
    private readonly repositorio: TramitesRepositorio,
    private readonly tiposTramite: TiposTramiteConsulta,
    private readonly emisor: EmisorEventos,
  ) {}

  async crear(datos: DatosCrearTramite): Promise<Tramite> {
    const tipo = await this.tiposTramite.obtenerPorId(datos.tipoTramiteId);
    if (!tipo || tipo.estado !== "publicado") {
      throw new TipoTramiteNoDisponibleError(datos.tipoTramiteId);
    }

    const errores = validarDatosFormulario(tipo.esquemaFormulario, datos.datosFormulario);
    if (errores.length > 0) {
      throw new DatosFormularioInvalidosError(errores);
    }

    const tramite = await this.repositorio.crear({
      ...datos,
      estadoInicial: tipo.flujoEstados.inicial,
    });

    await this.repositorio.agregarEvento({
      tramiteId: tramite.id,
      tipoEvento: "creacion",
      estadoAnterior: null,
      estadoNuevo: tramite.estadoActual,
      autorTipo: "ciudadano",
      autorIdentificador: tramite.ciudadanoId,
    });

    this.emisor.emitir("tramite.creado", {
      tramiteId: tramite.id,
      ciudadanoId: tramite.ciudadanoId,
      tipoTramiteNombre: tipo.nombre,
    });

    return tramite;
  }

  async cambiarEstado(tramiteId: string, nuevoEstado: string, adminId: string): Promise<Tramite> {
    const tramite = await this.obtenerTramiteOFallar(tramiteId);
    const tipo = await this.tiposTramite.obtenerPorId(tramite.tipoTramiteId);
    if (!tipo) {
      throw new TipoTramiteNoDisponibleError(tramite.tipoTramiteId);
    }

    const estadoAnterior = tramite.estadoActual;
    aplicarTransicion(tipo.flujoEstados, estadoAnterior, nuevoEstado);

    const actualizado = await this.repositorio.cambiarEstado(tramiteId, nuevoEstado);

    await this.repositorio.agregarEvento({
      tramiteId,
      tipoEvento: "cambio_estado",
      estadoAnterior,
      estadoNuevo: nuevoEstado,
      autorTipo: "admin",
      autorIdentificador: adminId,
    });

    this.emisor.emitir("tramite.estado_cambiado", {
      tramiteId,
      ciudadanoId: tramite.ciudadanoId,
      tipoTramiteNombre: tipo.nombre,
      estadoAnterior,
      estadoNuevo: nuevoEstado,
    });

    return actualizado;
  }

  async agregarComentario(tramiteId: string, adminId: string, texto: string): Promise<Comentario> {
    const tramite = await this.obtenerTramiteOFallar(tramiteId);
    const tipo = await this.tiposTramite.obtenerPorId(tramite.tipoTramiteId);

    if (!texto.trim()) {
      throw new ComentarioInvalidoError("El comentario no puede estar vacío");
    }

    const comentario = await this.repositorio.agregarComentario(tramiteId, adminId, texto);

    await this.repositorio.agregarEvento({
      tramiteId,
      tipoEvento: "comentario",
      estadoAnterior: null,
      estadoNuevo: null,
      autorTipo: "admin",
      autorIdentificador: adminId,
      detalle: { texto },
    });

    this.emisor.emitir("tramite.comentario_agregado", {
      tramiteId,
      ciudadanoId: tramite.ciudadanoId,
      tipoTramiteNombre: tipo?.nombre,
      comentarioId: comentario.id,
    });

    return comentario;
  }

  private async obtenerTramiteOFallar(id: string): Promise<Tramite> {
    const tramite = await this.repositorio.obtenerPorId(id);
    if (!tramite) {
      throw new TramiteNoEncontradoError(id);
    }
    return tramite;
  }
}
