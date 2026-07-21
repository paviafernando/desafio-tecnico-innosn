export interface RecursoTramite {
  id: string;
  tramiteId: string;
  adminId: string;
  nombreOriginal: string;
  claveStorage: string;
  tipoMime: string;
  tamanioBytes: number;
  createdAt: Date;
}

export interface DatosCrearRecurso {
  tramiteId: string;
  adminId: string;
  nombreOriginal: string;
  claveStorage: string;
  tipoMime: string;
  tamanioBytes: number;
}

export interface RecursosTramiteRepositorio {
  crear(datos: DatosCrearRecurso): Promise<RecursoTramite>;
  listarPorTramite(tramiteId: string): Promise<RecursoTramite[]>;
}
