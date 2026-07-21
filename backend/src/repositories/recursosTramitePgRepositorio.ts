import type { Pool } from "pg";
import type { DatosCrearRecurso, RecursoTramite, RecursosTramiteRepositorio } from "../services/recursosTramite";

interface FilaRecursoTramite {
  id: string;
  tramite_id: string;
  admin_id: string;
  nombre_original: string;
  clave_storage: string;
  tipo_mime: string;
  tamanio_bytes: string;
  creado_en: Date;
}

function mapear(fila: FilaRecursoTramite): RecursoTramite {
  return {
    id: fila.id,
    tramiteId: fila.tramite_id,
    adminId: fila.admin_id,
    nombreOriginal: fila.nombre_original,
    claveStorage: fila.clave_storage,
    tipoMime: fila.tipo_mime,
    tamanioBytes: Number(fila.tamanio_bytes),
    createdAt: fila.creado_en,
  };
}

export class RecursosTramitePgRepositorio implements RecursosTramiteRepositorio {
  constructor(private readonly pool: Pool) {}

  async crear(datos: DatosCrearRecurso): Promise<RecursoTramite> {
    const { rows } = await this.pool.query<FilaRecursoTramite>(
      `INSERT INTO recursos_tramite (tramite_id, admin_id, nombre_original, clave_storage, tipo_mime, tamanio_bytes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [datos.tramiteId, datos.adminId, datos.nombreOriginal, datos.claveStorage, datos.tipoMime, datos.tamanioBytes],
    );
    return mapear(rows[0]);
  }

  async listarPorTramite(tramiteId: string): Promise<RecursoTramite[]> {
    const { rows } = await this.pool.query<FilaRecursoTramite>(
      "SELECT * FROM recursos_tramite WHERE tramite_id = $1 ORDER BY creado_en DESC",
      [tramiteId],
    );
    return rows.map(mapear);
  }
}
