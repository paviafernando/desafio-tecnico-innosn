export type DestinatarioTipo = "ciudadano" | "admin";

export interface Notificacion {
  id: string;
  destinatarioTipo: DestinatarioTipo;
  destinatarioId: string | null;
  tramiteId: string;
  mensaje: string;
  leida: boolean;
  archivada: boolean;
  createdAt: Date;
}

export interface DatosCrearNotificacion {
  destinatarioTipo: DestinatarioTipo;
  destinatarioId: string | null;
  tramiteId: string;
  mensaje: string;
}

export interface NotificacionesRepositorio {
  crear(datos: DatosCrearNotificacion): Promise<Notificacion>;
  listar(destinatarioTipo: DestinatarioTipo, destinatarioId: string | null): Promise<Notificacion[]>;
  marcarTodasLeidas(destinatarioTipo: DestinatarioTipo, destinatarioId: string | null): Promise<void>;
  archivar(id: string, destinatarioTipo: DestinatarioTipo, destinatarioId: string | null): Promise<void>;
}
