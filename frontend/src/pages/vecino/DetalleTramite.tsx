import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import EstadoBadge from "../../components/EstadoBadge";
import LineaDeTiempo from "../../components/LineaDeTiempo";
import BarraProgreso from "../../components/BarraProgreso";
import ResumenDatosFormulario from "../../components/ResumenDatosFormulario";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import { useEventosTramite } from "../../hooks/useEventosTiempoReal";
import { calcularCaminoFeliz } from "../../lib/caminoFeliz";
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

  const volverA = { to: "/mis-tramites", texto: "Volver a mis trámites" };

  if (error) {
    return (
      <PantallaAncha titulo="Trámite" volverA={volverA}>
        <p className="text-sm text-red-600">{error}</p>
      </PantallaAncha>
    );
  }

  if (!tramite) {
    return (
      <PantallaAncha titulo="Trámite" volverA={volverA}>
        <p className="text-sm text-neutral-400">Cargando…</p>
      </PantallaAncha>
    );
  }

  const camino = tramite.tipoTramiteFlujoEstados ? calcularCaminoFeliz(tramite.tipoTramiteFlujoEstados) : null;

  return (
    <PantallaAncha
      titulo={tramite.tipoTramiteNombre ?? `Trámite #${tramite.id.slice(0, 8)}`}
      subtitulo={`#${tramite.id.slice(0, 8)} · Iniciado el ${new Date(tramite.createdAt).toLocaleDateString("es-AR")}`}
      volverA={volverA}
    >
      <div className="mb-6">
        <EstadoBadge estado={tramite.estadoActual} />
      </div>

      {camino && (
        <div className="mb-8">
          <BarraProgreso pasos={camino} estadoActual={tramite.estadoActual} />
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Lo que enviaste</h2>
      <div className="mb-8">
        <ResumenDatosFormulario esquema={tramite.tipoTramiteEsquemaFormulario} datos={tramite.datosFormulario} />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Historial</h2>
      <LineaDeTiempo eventos={tramite.historial} />

      {tramite.comentarios.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Comentarios del municipio
          </h2>
          <ul className="space-y-3">
            {tramite.comentarios.map((comentario) => (
              <li
                key={comentario.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700"
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
