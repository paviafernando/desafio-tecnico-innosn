-- Línea de tiempo de un trámite: creación, cambios de estado y comentarios.
-- Es la fuente de la que se arma el historial visible para vecino y admin, y
-- el punto que dispara notificaciones y difusión en tiempo real (ver
-- docs/DECISIONES.md, "Evaluación de broker de mensajería").
CREATE TABLE eventos_historial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_id uuid NOT NULL REFERENCES tramites (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('creacion', 'cambio_estado', 'comentario')),
  estado_anterior text,
  estado_nuevo text,
  autor_tipo text NOT NULL CHECK (autor_tipo IN ('ciudadano', 'admin')),
  autor_id text,
  detalle jsonb,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_eventos_historial_tramite ON eventos_historial (tramite_id);
