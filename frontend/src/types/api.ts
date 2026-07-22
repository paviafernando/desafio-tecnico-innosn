export type TipoCampoFormulario =
  | "texto"
  | "texto_largo"
  | "numero"
  | "fecha"
  | "email"
  | "telefono"
  | "select"
  | "checkbox"
  | "archivo";

export interface ValidacionCampo {
  patron?: string;
  mensaje?: string;
  tiposPermitidos?: string[];
  tamanioMaximoMB?: number;
}

export interface CampoFormulario {
  id: string;
  etiqueta: string;
  tipo: TipoCampoFormulario;
  requerido: boolean;
  opciones?: string[];
  validacion?: ValidacionCampo;
}

export interface EsquemaFormulario {
  campos: CampoFormulario[];
}

export interface FlujoEstados {
  inicial: string;
  estados: string[];
  transiciones: Record<string, string[]>;
}

export type EstadoTipoTramite = "borrador" | "publicado" | "archivado";

export interface ArchivoReferencia {
  nombre: string;
  url: string;
}

export interface ContactoTipoTramite {
  email?: string;
  whatsapp?: string;
  telefono?: string;
}

export interface TipoTramite {
  id: string;
  nombre: string;
  descripcion: string;
  esquemaFormulario: EsquemaFormulario;
  flujoEstados: FlujoEstados;
  version: number;
  estado: EstadoTipoTramite;
  tipoTramiteOrigenId: string | null;
  publicadoEn: string | null;
  publicadoPor: string | null;
  categoria: string | null;
  requisitos: string[];
  pasos: string[];
  archivosReferencia: ArchivoReferencia[];
  costo: string | null;
  modalidad: string | null;
  contacto: ContactoTipoTramite;
}

export interface Tramite {
  id: string;
  tipoTramiteId: string;
  tipoTramiteNombre?: string | null;
  tipoTramiteCategoria?: string | null;
  /** Solo la ve el admin: el vecino no necesita saber contra qué versión del tipo se creó su trámite. */
  tipoTramiteVersion?: number | null;
  ciudadanoId: string;
  ciudadanoNombre: string;
  ciudadanoEmail: string;
  datosFormulario: Record<string, unknown>;
  estadoActual: string;
  createdAt: string;
  /** Hay novedades de la otra parte (admin/vecino, según quién pregunta) que todavía no se vieron. */
  requiereAtencion?: boolean;
}

export type TipoEventoHistorial = "creacion" | "cambio_estado" | "comentario";

export interface EventoHistorial {
  id: string;
  tramiteId: string;
  tipoEvento: TipoEventoHistorial;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  autorTipo: "ciudadano" | "admin";
  autorIdentificador: string;
  detalle?: Record<string, unknown>;
  createdAt: string;
}

export interface Comentario {
  id: string;
  tramiteId: string;
  adminId: string;
  texto: string;
  visibleParaVecino: boolean;
  createdAt: string;
}

export interface RecursoTramite {
  id: string;
  nombreOriginal: string;
  tipoMime: string;
  tamanioBytes: number;
  createdAt: string;
  urlDescarga: string;
}

export interface TramiteConDetalle extends Tramite {
  tipoTramiteEsquemaFormulario?: EsquemaFormulario | null;
  tipoTramiteFlujoEstados?: FlujoEstados | null;
  tipoTramiteArchivosReferencia?: ArchivoReferencia[];
  comentarios: Comentario[];
  historial: EventoHistorial[];
  recursos: RecursoTramite[];
}

export interface IdentidadCiudadana {
  dni: string;
  nombre: string;
  email: string;
}

export interface NotificacionApi {
  id: string;
  tramiteId: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}
