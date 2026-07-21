import { EmailNotificacionAdapter } from "./emailNotificacionAdapter";
import { WhatsAppNotificacionAdapter } from "./whatsappNotificacionAdapter";
import { SmsNotificacionAdapter } from "./smsNotificacionAdapter";

describe("EmailNotificacionAdapter", () => {
  it("registra el envío del email (mock, sin proveedor real conectado)", async () => {
    const registrar = jest.fn();
    const adapter = new EmailNotificacionAdapter(registrar);

    await adapter.enviar({
      destinatario: "juana@example.com",
      asunto: "Tu trámite cambió de estado",
      mensaje: "Tu trámite ahora está en revisión",
    });

    expect(registrar).toHaveBeenCalledTimes(1);
    const [mensajeRegistrado] = registrar.mock.calls[0];
    expect(mensajeRegistrado).toContain("juana@example.com");
    expect(mensajeRegistrado).toContain("Tu trámite ahora está en revisión");
  });
});

describe("WhatsAppNotificacionAdapter", () => {
  it("registra el intento de envío (prototipo, sin proveedor real conectado)", async () => {
    const registrar = jest.fn();
    const adapter = new WhatsAppNotificacionAdapter(registrar);

    await adapter.enviar({ destinatario: "+543364000000", mensaje: "Tu trámite fue aprobado" });

    expect(registrar).toHaveBeenCalledTimes(1);
    const [mensajeRegistrado] = registrar.mock.calls[0];
    expect(mensajeRegistrado).toContain("+543364000000");
    expect(mensajeRegistrado).toContain("Tu trámite fue aprobado");
  });
});

describe("SmsNotificacionAdapter", () => {
  it("registra el intento de envío (prototipo, sin proveedor real conectado)", async () => {
    const registrar = jest.fn();
    const adapter = new SmsNotificacionAdapter(registrar);

    await adapter.enviar({ destinatario: "+543364000000", mensaje: "Tu trámite fue rechazado" });

    expect(registrar).toHaveBeenCalledTimes(1);
    const [mensajeRegistrado] = registrar.mock.calls[0];
    expect(mensajeRegistrado).toContain("+543364000000");
  });
});
