import { EmisorEventosDominio } from "./emisorEventosDominio";

describe("EmisorEventosDominio", () => {
  it("notifica a los suscriptores de un evento con su payload", () => {
    const emisor = new EmisorEventosDominio();
    const listener = jest.fn();

    emisor.suscribir("tramite.creado", listener);
    emisor.emitir("tramite.creado", { tramiteId: "1" });

    expect(listener).toHaveBeenCalledWith({ tramiteId: "1" });
  });

  it("no notifica a suscriptores de otro evento", () => {
    const emisor = new EmisorEventosDominio();
    const listener = jest.fn();

    emisor.suscribir("tramite.estado_cambiado", listener);
    emisor.emitir("tramite.creado", { tramiteId: "1" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("permite múltiples suscriptores para el mismo evento", () => {
    const emisor = new EmisorEventosDominio();
    const listenerA = jest.fn();
    const listenerB = jest.fn();

    emisor.suscribir("tramite.creado", listenerA);
    emisor.suscribir("tramite.creado", listenerB);
    emisor.emitir("tramite.creado", { tramiteId: "1" });

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
  });
});
