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
  ciudadanoId: string;
  ciudadanoNombre: string;
  ciudadanoEmail: string;
  datosFormulario: Record<string, unknown>;
  estadoActual: string;
  createdAt: string;
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
  createdAt: string;
}

export interface TramiteConDetalle extends Tramite {
  comentarios: Comentario[];
  historial: EventoHistorial[];
}

export interface IdentidadCiudadana {
  dni: string;
  nombre: string;
  email: string;
}
