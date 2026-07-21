import { validarEsquemaFormulario, type EsquemaFormulario } from "../domain/esquemaFormulario";
import { validarFlujoEstados, type FlujoEstados } from "../domain/flujoEstados";

export type EstadoTipoTramite = "borrador" | "publicado" | "archivado";

export interface ContactoTipoTramite {
  email?: string;
  whatsapp?: string;
  telefono?: string;
}

export interface ArchivoReferencia {
  nombre: string;
  url: string;
}

/** Metadata informativa relevada del patrón real de trámites municipales (docs/ANALISIS_TRAMITES.md). No son inputs del vecino. */
export interface MetadataTipoTramite {
  categoria: string | null;
  requisitos: string[];
  pasos: string[];
  archivosReferencia: ArchivoReferencia[];
  costo: string | null;
  modalidad: string | null;
  contacto: ContactoTipoTramite;
}

const METADATA_POR_DEFECTO: MetadataTipoTramite = {
  categoria: null,
  requisitos: [],
  pasos: [],
  archivosReferencia: [],
  costo: null,
  modalidad: null,
  contacto: {},
};

export interface TipoTramite extends MetadataTipoTramite {
  id: string;
  nombre: string;
  descripcion: string;
  esquemaFormulario: EsquemaFormulario;
  flujoEstados: FlujoEstados;
  version: number;
  estado: EstadoTipoTramite;
  tipoTramiteOrigenId: string | null;
  publicadoEn: Date | null;
  publicadoPor: string | null;
}

export interface DatosTipoTramite extends Partial<MetadataTipoTramite> {
  nombre: string;
  descripcion: string;
  esquemaFormulario: EsquemaFormulario;
  flujoEstados: FlujoEstados;
}

export interface DatosCreacionTipoTramite extends MetadataTipoTramite {
  nombre: string;
  descripcion: string;
  esquemaFormulario: EsquemaFormulario;
  flujoEstados: FlujoEstados;
  version: number;
  estado: EstadoTipoTramite;
  tipoTramiteOrigenId: string | null;
}

export interface TiposTramiteRepositorio {
  crear(datos: DatosCreacionTipoTramite): Promise<TipoTramite>;
  obtenerPorId(id: string): Promise<TipoTramite | null>;
  actualizar(id: string, cambios: Partial<TipoTramite>): Promise<TipoTramite>;
  contarInstancias(tipoTramiteId: string): Promise<number>;
}

export class TipoTramiteInvalidoError extends Error {
  constructor(public readonly errores: string[]) {
    super(`Tipo de trámite inválido: ${errores.join("; ")}`);
    this.name = "TipoTramiteInvalidoError";
  }
}

export class TipoTramiteNoEncontradoError extends Error {
  constructor(id: string) {
    super(`No existe un tipo de trámite con id "${id}"`);
    this.name = "TipoTramiteNoEncontradoError";
  }
}

export class TipoTramiteArchivadoError extends Error {
  constructor(id: string) {
    super(`El tipo de trámite "${id}" está archivado y no se puede editar`);
    this.name = "TipoTramiteArchivadoError";
  }
}

export class EstadoTipoTramiteInvalidoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "EstadoTipoTramiteInvalidoError";
  }
}

export class TiposTramiteService {
  constructor(private readonly repositorio: TiposTramiteRepositorio) {}

  async crear(datos: DatosTipoTramite): Promise<TipoTramite> {
    this.validarOFallar(datos.esquemaFormulario, datos.flujoEstados);
    return this.repositorio.crear({
      ...METADATA_POR_DEFECTO,
      ...datos,
      version: 1,
      estado: "borrador",
      tipoTramiteOrigenId: null,
    });
  }

  async publicar(id: string, adminId: string): Promise<TipoTramite> {
    const existente = await this.obtenerOFallar(id);

    if (existente.estado !== "borrador") {
      throw new EstadoTipoTramiteInvalidoError(
        `Solo se puede publicar un tipo de trámite en estado "borrador" (estado actual: "${existente.estado}")`,
      );
    }

    return this.repositorio.actualizar(id, {
      estado: "publicado",
      publicadoEn: new Date(),
      publicadoPor: adminId,
    });
  }

  async editar(id: string, cambios: Partial<DatosTipoTramite>): Promise<TipoTramite> {
    const existente = await this.obtenerOFallar(id);

    if (existente.estado === "archivado") {
      throw new TipoTramiteArchivadoError(id);
    }

    const esquemaFormulario = cambios.esquemaFormulario ?? existente.esquemaFormulario;
    const flujoEstados = cambios.flujoEstados ?? existente.flujoEstados;
    this.validarOFallar(esquemaFormulario, flujoEstados);

    const tieneInstancias =
      existente.estado === "publicado" && (await this.repositorio.contarInstancias(id)) > 0;

    if (tieneInstancias) {
      return this.repositorio.crear({
        categoria: cambios.categoria ?? existente.categoria,
        requisitos: cambios.requisitos ?? existente.requisitos,
        pasos: cambios.pasos ?? existente.pasos,
        archivosReferencia: cambios.archivosReferencia ?? existente.archivosReferencia,
        costo: cambios.costo ?? existente.costo,
        modalidad: cambios.modalidad ?? existente.modalidad,
        contacto: cambios.contacto ?? existente.contacto,
        nombre: cambios.nombre ?? existente.nombre,
        descripcion: cambios.descripcion ?? existente.descripcion,
        esquemaFormulario,
        flujoEstados,
        version: existente.version + 1,
        estado: "borrador",
        tipoTramiteOrigenId: existente.id,
      });
    }

    return this.repositorio.actualizar(id, cambios);
  }

  private async obtenerOFallar(id: string): Promise<TipoTramite> {
    const existente = await this.repositorio.obtenerPorId(id);
    if (!existente) {
      throw new TipoTramiteNoEncontradoError(id);
    }
    return existente;
  }

  private validarOFallar(esquemaFormulario: EsquemaFormulario, flujoEstados: FlujoEstados) {
    const errores = [
      ...validarEsquemaFormulario(esquemaFormulario),
      ...validarFlujoEstados(flujoEstados),
    ];
    if (errores.length > 0) {
      throw new TipoTramiteInvalidoError(errores);
    }
  }
}
