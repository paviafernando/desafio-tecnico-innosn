import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import EstadoBadge from "../../components/EstadoBadge";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import type { Tramite } from "../../types/api";

export default function MisTramites() {
  const { sesion } = useAuth();
  const [tramites, setTramites] = useState<Tramite[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Tramite[]>("/api/tramites/mios", { token: sesion?.token })
      .then(setTramites)
      .catch(() => setError("No pudimos cargar tus trámites."));
  }, [sesion?.token]);

  return (
    <PantallaAncha
      titulo="Mis trámites"
      acciones={
        <Link
          to="/mis-tramites/nuevo"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Nuevo trámite
        </Link>
      }
    >
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {tramites && tramites.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Todavía no cargaste ningún trámite.
        </p>
      )}

      <ul className="space-y-3">
        {tramites?.map((tramite) => (
          <li key={tramite.id}>
            <Link
              to={`/mis-tramites/${tramite.id}`}
              className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-100"
            >
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">
                  Trámite #{tramite.id.slice(0, 8)}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {new Date(tramite.createdAt).toLocaleDateString("es-AR")}
                </p>
              </div>
              <EstadoBadge estado={tramite.estadoActual} />
            </Link>
          </li>
        ))}
      </ul>
    </PantallaAncha>
  );
}
