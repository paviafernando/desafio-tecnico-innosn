-- Tipos de trámite configurables: definen el formulario y la máquina de estados
-- de cada trámite del motor genérico. Ver docs/ANALISIS_TRAMITES.md y
-- docs/DECISIONES.md para el detalle y la justificación de cada columna.
CREATE TABLE tipos_tramite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos propios del tipo de trámite.
  nombre text NOT NULL,
  descripcion text NOT NULL,
  esquema_formulario jsonb NOT NULL,
  flujo_estados jsonb NOT NULL,

  -- Metadata informativa relevada del patrón real de trámites municipales
  -- (requisitos, pasos, archivos de referencia, costo, modalidad, contacto).
  -- No son campos que completa el vecino: documentan el trámite en sí.
  categoria text,
  requisitos jsonb NOT NULL DEFAULT '[]'::jsonb,
  pasos jsonb NOT NULL DEFAULT '[]'::jsonb,
  archivos_referencia jsonb NOT NULL DEFAULT '[]'::jsonb,
  costo text,
  modalidad text,
  contacto jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Versionado, copia y aprobación (ver TiposTramiteService).
  version integer NOT NULL DEFAULT 1,
  estado text NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  tipo_tramite_origen_id uuid REFERENCES tipos_tramite (id),
  publicado_en timestamptz,
  publicado_por uuid REFERENCES admins (id),

  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tipos_tramite_estado ON tipos_tramite (estado);
CREATE INDEX idx_tipos_tramite_origen ON tipos_tramite (tipo_tramite_origen_id);
