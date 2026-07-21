-- El nombre/email del vecino que crea el trámite se desnormaliza acá porque
-- viene del JWT de la sesión (identidad externa, sin tabla propia) y no del
-- esquema_formulario del tipo de trámite: el formulario puede referirse a otra
-- persona (ej. "Inscripción a becas deportivas" pide datos del menor, no del
-- adulto que lo carga). Sin estas columnas, notificar al vecino tras un
-- cambio de estado requeriría asumir qué campo del formulario es su email,
-- lo que rompería la genericidad del motor.
ALTER TABLE tramites
  ADD COLUMN ciudadano_nombre text NOT NULL,
  ADD COLUMN ciudadano_email text NOT NULL;
