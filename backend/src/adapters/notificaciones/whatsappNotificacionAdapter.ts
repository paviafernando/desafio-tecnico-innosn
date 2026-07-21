import type { CanalNotificacion, Notificacion } from "./canalNotificacion";

/**
 * Prototipo del canal WhatsApp: misma interfaz que el resto de los canales,
 * sin proveedor ni credenciales reales conectadas en el MVP.
 */
export class WhatsAppNotificacionAdapter implements CanalNotificacion {
  constructor(private readonly registrar: (mensaje: string) => void = console.log) {}

  async enviar(notificacion: Notificacion): Promise<void> {
    // Integración real pendiente, ej. con la API de WhatsApp Business de Twilio:
    // await twilioClient.messages.create({
    //   from: "whatsapp:+14155238886",
    //   to: `whatsapp:${notificacion.destinatario}`,
    //   body: notificacion.mensaje,
    // });

    this.registrar(`[whatsapp] Para: ${notificacion.destinatario}: ${notificacion.mensaje}`);
  }
}
