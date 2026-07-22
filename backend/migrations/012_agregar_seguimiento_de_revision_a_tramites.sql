-- Soporte para el highlight de "necesita atención": el admin tiene que poder
-- distinguir un trámite que nunca abrió (o que el vecino modificó después de
-- que el admin ya lo revisó) del resto; el vecino tiene que poder distinguir
-- un trámite con una novedad del admin (cambio de estado, comentario visible,
-- documento nuevo) que todavía no vio.
--
-- Se guardan timestamps en vez de un booleano "leído/no leído": comparar
-- "última actividad de la otra parte" contra "última vez que lo vi" permite
-- que el highlight vuelva a aparecer solo con actividad nueva, sin necesitar
-- un reset explícito cada vez que alguien lo revisa.
ALTER TABLE tramites
  ADD COLUMN visto_por_admin_en timestamptz,
  ADD COLUMN visto_por_vecino_en timestamptz,
  ADD COLUMN ultima_actividad_ciudadano_en timestamptz,
  ADD COLUMN ultima_actividad_admin_en timestamptz;

-- Backfill de los trámites existentes: la única actividad del ciudadano hoy
-- es la creación; la única actividad del admin que ya se registraba antes de
-- esta migración es un cambio de estado (bumpea actualizado_en).
UPDATE tramites SET ultima_actividad_ciudadano_en = creado_en;
UPDATE tramites SET ultima_actividad_admin_en = actualizado_en WHERE actualizado_en > creado_en;

ALTER TABLE tramites
  ALTER COLUMN ultima_actividad_ciudadano_en SET NOT NULL,
  ALTER COLUMN ultima_actividad_ciudadano_en SET DEFAULT now();
