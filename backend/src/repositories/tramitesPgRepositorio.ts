import type { Pool } from "pg";
import type {
  Comentario,
  DatosCrearTramite,
  DatosEventoHistorial,
  EventoHistorial,
  Tramite,
  TramitesRepositorio,
} from "../services/tramites";

interface FilaTramite {
  id: string;
  tipo_tramite_id: string;
  ciudadano_id: string;
  ciudadano_nombre: string;
  ciudadano_email: string;
  datos_formulario: Record<string, unknown>;
  estado: string;
  creado_en: Date;
}

interface FilaComentario {
  id: string;
  tramite_id: string;
  admin_id: string;
  texto: string;
  creado_en: Date;
}

interface FilaEventoHistorial {
  id: string;
  tramite_id: string;
  tipo: EventoHistorial["tipoEvento"];
  estado_anterior: string | null;
  estado_nuevo: string | null;
  autor_tipo: EventoHistorial["autorTipo"];
  autor_id: string | null;
  detalle: Record<string, unknown> | null;
  creado_en: Date;
}

function mapearTramite(fila: FilaTramite): Tramite {
  return {
    id: fila.id,
    tipoTramiteId: fila.tipo_tramite_id,
    ciudadanoId: fila.ciudadano_id,
    ciudadanoNombre: fila.ciudadano_nombre,
    ciudadanoEmail: fila.ciudadano_email,
    datosFormulario: fila.datos_formulario,
    estadoActual: fila.estado,
    createdAt: fila.creado_en,
  };
}

function mapearComentario(fila: FilaComentario): Comentario {
  return {
    id: fila.id,
    tramiteId: fila.tramite_id,
    adminId: fila.admin_id,
    texto: fila.texto,
    createdAt: fila.creado_en,
  };
}

function mapearEvento(fila: FilaEventoHistorial): EventoHistorial {
  return {
    id: fila.id,
    tramiteId: fila.tramite_id,
    tipoEvento: fila.tipo,
    estadoAnterior: fila.estado_anterior,
    estadoNuevo: fila.estado_nuevo,
    autorTipo: fila.autor_tipo,
    autorIdentificador: fila.autor_id ?? "",
    detalle: fila.detalle ?? undefined,
    createdAt: fila.creado_en,
  };
}

export class TramitesPgRepositorio implements TramitesRepositorio {
  constructor(private readonly pool: Pool) {}

  async crear(datos: DatosCrearTramite & { estadoInicial: string }): Promise<Tramite> {
    const { rows } = await this.pool.query<FilaTramite>(
      `INSERT INTO tramites (tipo_tramite_id, ciudadano_id, ciudadano_nombre, ciudadano_email, datos_formulario, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        datos.tipoTramiteId,
        datos.ciudadanoId,
        datos.ciudadanoNombre,
        datos.ciudadanoEmail,
        JSON.stringify(datos.datosFormulario),
        datos.estadoInicial,
      ],
    );
    return mapearTramite(rows[0]);
  }

  async obtenerPorId(id: string): Promise<Tramite | null> {
    const { rows } = await this.pool.query<FilaTramite>("SELECT * FROM tramites WHERE id = $1", [id]);
    return rows[0] ? mapearTramite(rows[0]) : null;
  }

  /** Lecturas simples para bandeja/detalle, fuera del puerto que usa TramitesService. */
  async listar(filtros: { estado?: string; tipoTramiteId?: string; ciudadanoId?: string } = {}): Promise<Tramite[]> {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (filtros.estado) {
      valores.push(filtros.estado);
      condiciones.push(`estado = $${valores.length}`);
    }
    if (filtros.tipoTramiteId) {
      valores.push(filtros.tipoTramiteId);
      condiciones.push(`tipo_tramite_id = $${valores.length}`);
    }
    if (filtros.ciudadanoId) {
      valores.push(filtros.ciudadanoId);
      condiciones.push(`ciudadano_id = $${valores.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
    const { rows } = await this.pool.query<FilaTramite>(
      `SELECT * FROM tramites ${where} ORDER BY creado_en DESC`,
      valores,
    );
    return rows.map(mapearTramite);
  }

  async listarComentarios(tramiteId: string): Promise<Comentario[]> {
    const { rows } = await this.pool.query<FilaComentario>(
      "SELECT * FROM comentarios WHERE tramite_id = $1 ORDER BY creado_en ASC",
      [tramiteId],
    );
    return rows.map(mapearComentario);
  }

  async listarHistorial(tramiteId: string): Promise<EventoHistorial[]> {
    const { rows } = await this.pool.query<FilaEventoHistorial>(
      "SELECT * FROM eventos_historial WHERE tramite_id = $1 ORDER BY creado_en ASC",
      [tramiteId],
    );
    return rows.map(mapearEvento);
  }

  async cambiarEstado(id: string, nuevoEstado: string): Promise<Tramite> {
    const { rows } = await this.pool.query<FilaTramite>(
      "UPDATE tramites SET estado = $1, actualizado_en = now() WHERE id = $2 RETURNING *",
      [nuevoEstado, id],
    );
    return mapearTramite(rows[0]);
  }

  async agregarComentario(tramiteId: string, adminId: string, texto: string): Promise<Comentario> {
    const { rows } = await this.pool.query<FilaComentario>(
      "INSERT INTO comentarios (tramite_id, admin_id, texto) VALUES ($1, $2, $3) RETURNING *",
      [tramiteId, adminId, texto],
    );
    return mapearComentario(rows[0]);
  }

  async agregarEvento(datos: DatosEventoHistorial): Promise<EventoHistorial> {
    const { rows } = await this.pool.query<FilaEventoHistorial>(
      `INSERT INTO eventos_historial (tramite_id, tipo, estado_anterior, estado_nuevo, autor_tipo, autor_id, detalle)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        datos.tramiteId,
        datos.tipoEvento,
        datos.estadoAnterior,
        datos.estadoNuevo,
        datos.autorTipo,
        datos.autorIdentificador,
        datos.detalle ? JSON.stringify(datos.detalle) : null,
      ],
    );
    return mapearEvento(rows[0]);
  }
}
