import { createServer } from "node:http";
import { crearAppDesdeContenedor } from "./app";
import { crearContenedor } from "./config/contenedor";
import { env } from "./config/env";
import { obtenerPool } from "./repositories/db";
import { crearSocketGateway } from "./realtime/socketGateway";

const pool = obtenerPool(env.databaseUrl);
const contenedor = crearContenedor(pool);
const app = crearAppDesdeContenedor(contenedor);

const httpServer = createServer(app);
crearSocketGateway(httpServer, contenedor.emisorEventos);

httpServer.listen(env.port, () => {
  console.log(`API escuchando en el puerto ${env.port}`);
});
