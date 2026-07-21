-- Instancias de trámite cargadas por un vecino contra un tipo de trámite.
-- No hay tabla propia de ciudadanos: la identidad viaja en el JWT emitido por
-- el selector de identidad simulado (ver docs/DECISIONES.md).
CREATE TABLE tramites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_tramite_id uuid NOT NULL REFERENCES tipos_tramite (id),
  ciudadano_id text NOT NULL,
  datos_formulario jsonb NOT NULL,
  estado text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tramites_tipo_tramite ON tramites (tipo_tramite_id);
CREATE INDEX idx_tramites_ciudadano ON tramites (ciudadano_id);
CREATE INDEX idx_tramites_estado ON tramites (estado);
