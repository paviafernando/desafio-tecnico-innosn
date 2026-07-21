export interface Notificacion {
  destinatario: string;
  asunto?: string;
  mensaje: string;
}

export interface CanalNotificacion {
  enviar(notificacion: Notificacion): Promise<void>;
}
