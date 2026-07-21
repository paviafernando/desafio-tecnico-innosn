import type { CanalNotificacion, Notificacion } from "./canalNotificacion";

/**
 * Adapter de email. El envío real queda comentado a propósito: alcanza con
 * conectar un proveedor (ej. AWS SES, SendGrid) en el punto marcado abajo.
 */
export class EmailNotificacionAdapter implements CanalNotificacion {
  constructor(private readonly registrar: (mensaje: string) => void = console.log) {}

  async enviar(notificacion: Notificacion): Promise<void> {
    const asunto = notificacion.asunto ?? "Actualización de tu trámite";

    // Integración real pendiente, ej. con AWS SES:
    // await sesClient.send(new SendEmailCommand({
    //   Destination: { ToAddresses: [notificacion.destinatario] },
    //   Message: { Subject: { Data: asunto }, Body: { Text: { Data: notificacion.mensaje } } },
    //   Source: "notificaciones@sannicolas.gob.ar",
    // }));

    this.registrar(`[email] Para: ${notificacion.destinatario} — ${asunto}: ${notificacion.mensaje}`);
  }
}
