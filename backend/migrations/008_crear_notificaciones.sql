-- Notificaciones persistentes de la campanita (ver docs/DECISIONES.md,
-- "Campanita de notificaciones"): antes vivían solo en memoria del cliente y
-- se perdían si el destinatario no estaba conectado en el momento del evento.
-- Un admin es un destinatario compartido (destinatario_id NULL): hoy todos los
-- admins ven la misma bandeja/campanita, igual que la sala "admin" de sockets.
CREATE TABLE notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_tipo text NOT NULL CHECK (destinatario_tipo IN ('ciudadano', 'admin')),
  destinatario_id text,
  tramite_id uuid NOT NULL REFERENCES tramites (id) ON DELETE CASCADE,
  mensaje text NOT NULL,
  leida boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notificaciones_destinatario ON notificaciones (destinatario_tipo, destinatario_id, creado_en DESC);
