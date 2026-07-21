import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as clienteSocketIO, type Socket } from "socket.io-client";
import type { Server as SocketIOServer } from "socket.io";
import { crearSocketGateway } from "./socketGateway";
import { EmisorEventosDominio } from "./emisorEventosDominio";

function crearCliente(puerto: number): Socket {
  return clienteSocketIO(`http://localhost:${puerto}`, { transports: ["websocket"], forceNew: true });
}

describe("crearSocketGateway", () => {
  let httpServer: ReturnType<typeof createServer>;
  let io: SocketIOServer;
  let emisor: EmisorEventosDominio;
  let puerto: number;
  let clientesAbiertos: Socket[];

  beforeEach((done) => {
    httpServer = createServer();
    emisor = new EmisorEventosDominio();
    io = crearSocketGateway(httpServer, emisor);
    clientesAbiertos = [];
    httpServer.listen(0, () => {
      puerto = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterEach((done) => {
    clientesAbiertos.forEach((socket) => socket.close());
    io.close(() => httpServer.close(() => done()));
  });

  it("difunde tramite.estado_cambiado a un cliente suscripto a ese trámite", (done) => {
    const cliente = crearCliente(puerto);
    clientesAbiertos.push(cliente);

    cliente.on("connect", () => {
      cliente.emit("suscribirse-tramite", "tramite-1");
      setTimeout(() => {
        emisor.emitir("tramite.estado_cambiado", {
          tramiteId: "tramite-1",
          estadoAnterior: "pendiente",
          estadoNuevo: "en_revision",
        });
      }, 50);
    });

    cliente.on("tramite.estado_cambiado", (payload) => {
      expect(payload).toEqual({
        tramiteId: "tramite-1",
        estadoAnterior: "pendiente",
        estadoNuevo: "en_revision",
      });
      done();
    });
  });

  it("no difunde a un cliente suscripto a otro trámite", (done) => {
    const cliente = crearCliente(puerto);
    clientesAbiertos.push(cliente);
    const recibido = jest.fn();

    cliente.on("connect", () => {
      cliente.emit("suscribirse-tramite", "otro-tramite");
      cliente.on("tramite.estado_cambiado", recibido);

      setTimeout(() => {
        emisor.emitir("tramite.estado_cambiado", { tramiteId: "tramite-1" });
      }, 50);

      setTimeout(() => {
        expect(recibido).not.toHaveBeenCalled();
        done();
      }, 150);
    });
  });

  it("difunde a un cliente suscripto a la sala admin sin importar el trámite", (done) => {
    const cliente = crearCliente(puerto);
    clientesAbiertos.push(cliente);

    cliente.on("connect", () => {
      cliente.emit("suscribirse-admin");
      setTimeout(() => {
        emisor.emitir("tramite.creado", { tramiteId: "tramite-2" });
      }, 50);
    });

    cliente.on("tramite.creado", (payload) => {
      expect(payload).toEqual({ tramiteId: "tramite-2" });
      done();
    });
  });
});
