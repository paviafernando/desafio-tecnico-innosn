-- Comentarios que un administrador agrega sobre un trámite.
CREATE TABLE comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_id uuid NOT NULL REFERENCES tramites (id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES admins (id),
  texto text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comentarios_tramite ON comentarios (tramite_id);
