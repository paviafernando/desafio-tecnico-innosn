import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import EstadoBadge from "../../components/EstadoBadge";
import LineaDeTiempo from "../../components/LineaDeTiempo";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import { useEventosTramite } from "../../hooks/useEventosTiempoReal";
import type { TramiteConDetalle } from "../../types/api";

export default function DetalleTramite() {
  const { id } = useParams();
  const { sesion } = useAuth();
  const [tramite, setTramite] = useState<TramiteConDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!id) return;
    apiFetch<TramiteConDetalle>(`/api/tramites/${id}`, { token: sesion?.token })
      .then(setTramite)
      .catch(() => setError("No pudimos cargar el trámite."));
  }, [id, sesion?.token]);

  useEffect(cargar, [cargar]);
  useEventosTramite(id, cargar);

  if (error) {
    return (
      <PantallaAncha titulo="Trámite">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </PantallaAncha>
    );
  }

  if (!tramite) {
    return (
      <PantallaAncha titulo="Trámite">
        <p className="text-sm text-neutral-400">Cargando…</p>
      </PantallaAncha>
    );
  }

  return (
    <PantallaAncha titulo={`Trámite #${tramite.id.slice(0, 8)}`}>
      <div className="mb-8 flex items-center gap-3">
        <EstadoBadge estado={tramite.estadoActual} />
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Creado el {new Date(tramite.createdAt).toLocaleDateString("es-AR")}
        </span>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Historial
      </h2>
      <LineaDeTiempo eventos={tramite.historial} />

      {tramite.comentarios.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Comentarios del municipio
          </h2>
          <ul className="space-y-3">
            {tramite.comentarios.map((comentario) => (
              <li
                key={comentario.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                {comentario.texto}
              </li>
            ))}
          </ul>
        </>
      )}
    </PantallaAncha>
  );
}
