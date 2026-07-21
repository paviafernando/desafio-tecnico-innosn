-- Documentos que el admin sube para que el vecino los tenga a mano (ej. un
-- comprobante generado, un instructivo en PDF). A diferencia de
-- archivos_tramite (metadata de lo que el vecino adjunta en el formulario,
-- hoy sin uso: la clave de storage se guarda directo en datos_formulario),
-- acá el flujo es al revés: lo sube el admin y lo descarga el vecino.
CREATE TABLE recursos_tramite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_id uuid NOT NULL REFERENCES tramites (id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES admins (id),
  nombre_original text NOT NULL,
  clave_storage text NOT NULL,
  tipo_mime text NOT NULL,
  tamanio_bytes bigint NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recursos_tramite_tramite ON recursos_tramite (tramite_id);
