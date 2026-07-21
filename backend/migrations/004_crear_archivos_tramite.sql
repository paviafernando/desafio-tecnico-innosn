-- Metadata de los archivos subidos por el vecino para un campo de tipo
-- "archivo" del esquema de formulario. El binario vive en el storage S3/MinIO;
-- acá solo se guarda la referencia.
CREATE TABLE archivos_tramite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_id uuid NOT NULL REFERENCES tramites (id) ON DELETE CASCADE,
  campo_id text NOT NULL,
  nombre_original text NOT NULL,
  ruta_storage text NOT NULL,
  tipo_mime text NOT NULL,
  tamanio_bytes bigint NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_archivos_tramite_tramite ON archivos_tramite (tramite_id);
