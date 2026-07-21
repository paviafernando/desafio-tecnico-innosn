-- Los comentarios del admin son internos por defecto (uso interno de gestión,
-- ej. coordinación entre agentes municipales); el admin puede marcar uno como
-- visible para el vecino cuando corresponde comunicarle algo directamente
-- (ej. "falta un dato en la ficha médica").
ALTER TABLE comentarios ADD COLUMN visible_para_vecino boolean NOT NULL DEFAULT false;
