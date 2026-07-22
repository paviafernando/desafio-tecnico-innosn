-- Permite archivar una notificación para que deje de aparecer en la
-- campanita, sin borrarla (se conserva el registro por si hiciera falta
-- auditar más adelante).
ALTER TABLE notificaciones ADD COLUMN archivada boolean NOT NULL DEFAULT false;
