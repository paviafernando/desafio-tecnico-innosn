import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PantallaCentrada from "../../components/PantallaCentrada";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import type { IdentidadCiudadana } from "../../types/api";

/**
 * Simula el login del vecino: en producción esta pantalla sería reemplazada
 * por la redirección a un proveedor de identidad externo. Acá se elige una
 * identidad de prueba y el backend emite un JWT como si viniera de ese proveedor.
 */
export default function SelectorIdentidad() {
  const [identidades, setIdentidades] = useState<IdentidadCiudadana[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<IdentidadCiudadana[]>("/api/ciudadano/identidades")
      .then(setIdentidades)
      .catch(() => setError("No pudimos cargar las identidades de prueba."));
  }, []);

  async function elegirIdentidad(identidad: IdentidadCiudadana) {
    setEnviando(true);
    setError(null);
    try {
      const sesion = await apiFetch<{ token: string }>("/api/ciudadano/auth/sesion", {
        method: "POST",
        body: { dni: identidad.dni },
      });
      iniciarSesion({
        token: sesion.token,
        rol: "ciudadano",
        nombre: identidad.nombre,
        email: identidad.email,
        dni: identidad.dni,
      });
      navigate("/mis-tramites");
    } catch {
      setError("No pudimos iniciar sesión con esa identidad.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PantallaCentrada
      titulo="Trámites municipales"
      subtitulo="Elegí con qué identidad querés continuar"
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!identidades && !error && <p className="text-sm text-neutral-400">Cargando…</p>}

      <div className="space-y-2">
        {identidades?.map((identidad) => (
          <button
            key={identidad.dni}
            type="button"
            disabled={enviando}
            onClick={() => elegirIdentidad(identidad)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-left transition-colors hover:border-neutral-900 disabled:opacity-50"
          >
            <p className="font-medium text-neutral-900">{identidad.nombre}</p>
            <p className="text-sm text-neutral-500">DNI {identidad.dni}</p>
          </button>
        ))}
      </div>

      <Link
        to="/admin"
        className="mt-6 block text-center text-sm text-neutral-400 hover:text-neutral-600"
      >
        Acceso administrador
      </Link>
    </PantallaCentrada>
  );
}
