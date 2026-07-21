import type { CanalNotificacion, Notificacion } from "./canalNotificacion";

/**
 * Prototipo del canal SMS: misma interfaz que el resto de los canales,
 * sin proveedor ni credenciales reales conectadas en el MVP.
 */
export class SmsNotificacionAdapter implements CanalNotificacion {
  constructor(private readonly registrar: (mensaje: string) => void = console.log) {}

  async enviar(notificacion: Notificacion): Promise<void> {
    // Integración real pendiente, ej. con Twilio SMS:
    // await twilioClient.messages.create({
    //   from: "+15017122661",
    //   to: notificacion.destinatario,
    //   body: notificacion.mensaje,
    // });

    this.registrar(`[sms] Para: ${notificacion.destinatario}: ${notificacion.mensaje}`);
  }
}
