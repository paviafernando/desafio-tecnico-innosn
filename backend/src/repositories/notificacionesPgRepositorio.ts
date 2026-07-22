import type { Pool } from "pg";
import type {
  DatosCrearNotificacion,
  DestinatarioTipo,
  Notificacion,
  NotificacionesRepositorio,
} from "../services/notificaciones";

interface FilaNotificacion {
  id: string;
  destinatario_tipo: DestinatarioTipo;
  destinatario_id: string | null;
  tramite_id: string;
  mensaje: string;
  leida: boolean;
  archivada: boolean;
  creado_en: Date;
}

function mapear(fila: FilaNotificacion): Notificacion {
  return {
    id: fila.id,
    destinatarioTipo: fila.destinatario_tipo,
    destinatarioId: fila.destinatario_id,
    tramiteId: fila.tramite_id,
    mensaje: fila.mensaje,
    leida: fila.leida,
    archivada: fila.archivada,
    createdAt: fila.creado_en,
  };
}

export class NotificacionesPgRepositorio implements NotificacionesRepositorio {
  constructor(private readonly pool: Pool) {}

  async crear(datos: DatosCrearNotificacion): Promise<Notificacion> {
    const { rows } = await this.pool.query<FilaNotificacion>(
      `INSERT INTO notificaciones (destinatario_tipo, destinatario_id, tramite_id, mensaje)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [datos.destinatarioTipo, datos.destinatarioId, datos.tramiteId, datos.mensaje],
    );
    return mapear(rows[0]);
  }

  async listar(destinatarioTipo: DestinatarioTipo, destinatarioId: string | null): Promise<Notificacion[]> {
    const { rows } = await this.pool.query<FilaNotificacion>(
      `SELECT * FROM notificaciones
       WHERE destinatario_tipo = $1 AND destinatario_id IS NOT DISTINCT FROM $2 AND archivada = false
       ORDER BY creado_en DESC`,
      [destinatarioTipo, destinatarioId],
    );
    return rows.map(mapear);
  }

  async marcarTodasLeidas(destinatarioTipo: DestinatarioTipo, destinatarioId: string | null): Promise<void> {
    await this.pool.query(
      `UPDATE notificaciones SET leida = true
       WHERE destinatario_tipo = $1 AND destinatario_id IS NOT DISTINCT FROM $2`,
      [destinatarioTipo, destinatarioId],
    );
  }

  /** Scoping por destinatario en el propio WHERE: si el id no le pertenece, no hace nada. */
  async archivar(id: string, destinatarioTipo: DestinatarioTipo, destinatarioId: string | null): Promise<void> {
    await this.pool.query(
      `UPDATE notificaciones SET archivada = true
       WHERE id = $1 AND destinatario_tipo = $2 AND destinatario_id IS NOT DISTINCT FROM $3`,
      [id, destinatarioTipo, destinatarioId],
    );
  }
}
