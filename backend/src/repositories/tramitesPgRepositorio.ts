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
  visto_por_admin_en: Date | null;
  visto_por_vecino_en: Date | null;
  ultima_actividad_ciudadano_en: Date;
  ultima_actividad_admin_en: Date | null;
}

interface FilaComentario {
  id: string;
  tramite_id: string;
  admin_id: string;
  texto: string;
  visible_para_vecino: boolean;
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
    vistoPorAdminEn: fila.visto_por_admin_en,
    vistoPorVecinoEn: fila.visto_por_vecino_en,
    ultimaActividadCiudadanoEn: fila.ultima_actividad_ciudadano_en,
    ultimaActividadAdminEn: fila.ultima_actividad_admin_en,
  };
}

function mapearComentario(fila: FilaComentario): Comentario {
  return {
    id: fila.id,
    tramiteId: fila.tramite_id,
    adminId: fila.admin_id,
    texto: fila.texto,
    visibleParaVecino: fila.visible_para_vecino,
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

  private construirWhere(filtros: {
    estado?: string;
    tipoTramiteId?: string;
    ciudadanoId?: string;
    busqueda?: string;
  }): { where: string; valores: unknown[] } {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (filtros.estado) {
      valores.push(filtros.estado);
      condiciones.push(`t.estado = $${valores.length}`);
    }
    if (filtros.tipoTramiteId) {
      valores.push(filtros.tipoTramiteId);
      condiciones.push(`t.tipo_tramite_id = $${valores.length}`);
    }
    if (filtros.ciudadanoId) {
      valores.push(filtros.ciudadanoId);
      condiciones.push(`t.ciudadano_id = $${valores.length}`);
    }
    if (filtros.busqueda?.trim()) {
      valores.push(`%${filtros.busqueda.trim()}%`);
      const n = valores.length;
      // Sin acento y en minúscula de los dos lados: "al" tiene que encontrar
      // "Álvarez" igual que encuentra "alvarez". `translate` no requiere
      // instalar la extensión `unaccent` (que puede no estar disponible en
      // todos los entornos de Postgres administrado).
      const normalizar = (expr: string) => `translate(lower(${expr}), 'áéíóúüñ', 'aeiouun')`;
      condiciones.push(
        `(${normalizar("t.estado")} LIKE ${normalizar(`$${n}`)} OR ${normalizar("t.ciudadano_nombre")} LIKE ${normalizar(`$${n}`)} OR ${normalizar("tt.nombre")} LIKE ${normalizar(`$${n}`)} OR ${normalizar("tt.categoria")} LIKE ${normalizar(`$${n}`)} OR t.id::text ILIKE $${n})`,
      );
    }

    return { where: condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "", valores };
  }

  /**
   * Lecturas simples para bandeja/detalle, fuera del puerto que usa TramitesService.
   * `busqueda` filtra en la base (no trae todo para filtrar en el cliente) contra
   * el mismo criterio unificado que ya usaba la bandeja del admin: estado, nombre
   * y categoría del tipo de trámite, nombre del vecino y número de trámite. Para
   * eso hace falta el JOIN con tipos_tramite, aunque el resultado siga siendo
   * únicamente columnas de `tramites` (el enriquecido con datos del tipo lo arma
   * el controller aparte).
   */
  async listar(
    filtros: {
      estado?: string;
      tipoTramiteId?: string;
      ciudadanoId?: string;
      busqueda?: string;
      limite?: number;
      offset?: number;
    } = {},
  ): Promise<Tramite[]> {
    const { where, valores } = this.construirWhere(filtros);

    let limitOffset = "";
    if (filtros.limite != null) {
      valores.push(filtros.limite);
      limitOffset += ` LIMIT $${valores.length}`;
    }
    if (filtros.offset != null) {
      valores.push(filtros.offset);
      limitOffset += ` OFFSET $${valores.length}`;
    }

    const { rows } = await this.pool.query<FilaTramite>(
      `SELECT t.* FROM tramites t
       LEFT JOIN tipos_tramite tt ON tt.id = t.tipo_tramite_id
       ${where}
       ORDER BY t.creado_en DESC${limitOffset}`,
      valores,
    );
    return rows.map(mapearTramite);
  }

  /** Mismo criterio de filtro que `listar`, sin paginar: para el contador de resultados de la bandeja/mis trámites. */
  async contar(
    filtros: { estado?: string; tipoTramiteId?: string; ciudadanoId?: string; busqueda?: string } = {},
  ): Promise<number> {
    const { where, valores } = this.construirWhere(filtros);
    const { rows } = await this.pool.query<{ total: string }>(
      `SELECT count(*) AS total FROM tramites t
       LEFT JOIN tipos_tramite tt ON tt.id = t.tipo_tramite_id
       ${where}`,
      valores,
    );
    return Number(rows[0].total);
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
      `UPDATE tramites
       SET estado = $1, actualizado_en = now(), ultima_actividad_admin_en = now()
       WHERE id = $2
       RETURNING *`,
      [nuevoEstado, id],
    );
    return mapearTramite(rows[0]);
  }

  async marcarActividadAdmin(id: string): Promise<void> {
    await this.pool.query("UPDATE tramites SET ultima_actividad_admin_en = now() WHERE id = $1", [id]);
  }

  async marcarVistoPorAdmin(id: string): Promise<void> {
    await this.pool.query("UPDATE tramites SET visto_por_admin_en = now() WHERE id = $1", [id]);
  }

  async marcarVistoPorVecino(id: string): Promise<void> {
    await this.pool.query("UPDATE tramites SET visto_por_vecino_en = now() WHERE id = $1", [id]);
  }

  async agregarComentario(
    tramiteId: string,
    adminId: string,
    texto: string,
    visibleParaVecino: boolean,
  ): Promise<Comentario> {
    const { rows } = await this.pool.query<FilaComentario>(
      "INSERT INTO comentarios (tramite_id, admin_id, texto, visible_para_vecino) VALUES ($1, $2, $3, $4) RETURNING *",
      [tramiteId, adminId, texto, visibleParaVecino],
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
