import type { Pool } from "pg";
import type {
  DatosCreacionTipoTramite,
  TipoTramite,
  TiposTramiteRepositorio,
} from "../services/tiposTramite";

interface FilaTipoTramite {
  id: string;
  nombre: string;
  descripcion: string;
  esquema_formulario: TipoTramite["esquemaFormulario"];
  flujo_estados: TipoTramite["flujoEstados"];
  categoria: string | null;
  requisitos: string[];
  pasos: string[];
  archivos_referencia: TipoTramite["archivosReferencia"];
  costo: string | null;
  modalidad: string | null;
  contacto: TipoTramite["contacto"];
  version: number;
  estado: TipoTramite["estado"];
  tipo_tramite_origen_id: string | null;
  publicado_en: Date | null;
  publicado_por: string | null;
}

function mapearFila(fila: FilaTipoTramite): TipoTramite {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    esquemaFormulario: fila.esquema_formulario,
    flujoEstados: fila.flujo_estados,
    categoria: fila.categoria,
    requisitos: fila.requisitos,
    pasos: fila.pasos,
    archivosReferencia: fila.archivos_referencia,
    costo: fila.costo,
    modalidad: fila.modalidad,
    contacto: fila.contacto,
    version: fila.version,
    estado: fila.estado,
    tipoTramiteOrigenId: fila.tipo_tramite_origen_id,
    publicadoEn: fila.publicado_en,
    publicadoPor: fila.publicado_por,
  };
}

const COLUMNA_POR_CAMPO: Partial<Record<keyof TipoTramite, string>> = {
  nombre: "nombre",
  descripcion: "descripcion",
  esquemaFormulario: "esquema_formulario",
  flujoEstados: "flujo_estados",
  categoria: "categoria",
  requisitos: "requisitos",
  pasos: "pasos",
  archivosReferencia: "archivos_referencia",
  costo: "costo",
  modalidad: "modalidad",
  contacto: "contacto",
  version: "version",
  estado: "estado",
  tipoTramiteOrigenId: "tipo_tramite_origen_id",
  publicadoEn: "publicado_en",
  publicadoPor: "publicado_por",
};

const CAMPOS_JSON = new Set([
  "esquemaFormulario",
  "flujoEstados",
  "requisitos",
  "pasos",
  "archivosReferencia",
  "contacto",
]);

export class TiposTramitePgRepositorio implements TiposTramiteRepositorio {
  constructor(private readonly pool: Pool) {}

  async crear(datos: DatosCreacionTipoTramite): Promise<TipoTramite> {
    const { rows } = await this.pool.query<FilaTipoTramite>(
      `INSERT INTO tipos_tramite
        (nombre, descripcion, esquema_formulario, flujo_estados, categoria, requisitos, pasos,
         archivos_referencia, costo, modalidad, contacto, version, estado, tipo_tramite_origen_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        datos.nombre,
        datos.descripcion,
        JSON.stringify(datos.esquemaFormulario),
        JSON.stringify(datos.flujoEstados),
        datos.categoria,
        JSON.stringify(datos.requisitos),
        JSON.stringify(datos.pasos),
        JSON.stringify(datos.archivosReferencia),
        datos.costo,
        datos.modalidad,
        JSON.stringify(datos.contacto),
        datos.version,
        datos.estado,
        datos.tipoTramiteOrigenId,
      ],
    );
    return mapearFila(rows[0]);
  }

  async obtenerPorId(id: string): Promise<TipoTramite | null> {
    const { rows } = await this.pool.query<FilaTipoTramite>(
      "SELECT * FROM tipos_tramite WHERE id = $1",
      [id],
    );
    return rows[0] ? mapearFila(rows[0]) : null;
  }

  /** Lectura simple para listados (bandeja/selección), fuera del puerto que usan los services. */
  async listar(filtros: { estado?: string } = {}): Promise<TipoTramite[]> {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (filtros.estado) {
      valores.push(filtros.estado);
      condiciones.push(`estado = $${valores.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
    const { rows } = await this.pool.query<FilaTipoTramite>(
      `SELECT * FROM tipos_tramite ${where} ORDER BY creado_en DESC`,
      valores,
    );
    return rows.map(mapearFila);
  }

  async actualizar(id: string, cambios: Partial<TipoTramite>): Promise<TipoTramite> {
    const asignaciones: string[] = [];
    const valores: unknown[] = [];
    let indice = 1;

    for (const [campo, valor] of Object.entries(cambios)) {
      const columna = COLUMNA_POR_CAMPO[campo as keyof TipoTramite];
      if (!columna) continue;

      asignaciones.push(`${columna} = $${indice}`);
      valores.push(CAMPOS_JSON.has(campo) ? JSON.stringify(valor) : valor);
      indice++;
    }

    asignaciones.push("actualizado_en = now()");
    valores.push(id);

    const { rows } = await this.pool.query<FilaTipoTramite>(
      `UPDATE tipos_tramite SET ${asignaciones.join(", ")} WHERE id = $${indice} RETURNING *`,
      valores,
    );
    return mapearFila(rows[0]);
  }

  async contarInstancias(tipoTramiteId: string): Promise<number> {
    const { rows } = await this.pool.query<{ total: number }>(
      "SELECT count(*)::int AS total FROM tramites WHERE tipo_tramite_id = $1",
      [tipoTramiteId],
    );
    return rows[0].total;
  }
}
