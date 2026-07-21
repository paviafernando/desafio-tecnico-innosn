-- Administradores del sistema (auth propia, con tabla dedicada).
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  nombre text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
