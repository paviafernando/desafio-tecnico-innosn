import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import EstadoBadge from "../../components/EstadoBadge";
import LineaDeTiempo from "../../components/LineaDeTiempo";
import ResumenDatosFormulario from "../../components/ResumenDatosFormulario";
import { ApiError, apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import { useEventosTramite } from "../../hooks/useEventosTiempoReal";
import type { TipoTramite, TramiteConDetalle } from "../../types/api";

export default function DetalleTramiteAdmin() {
  const { id } = useParams();
  const { sesion } = useAuth();
  const [tramite, setTramite] = useState<TramiteConDetalle | null>(null);
  const [tipo, setTipo] = useState<TipoTramite | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    if (!id) return;
    try {
      const tramiteCargado = await apiFetch<TramiteConDetalle>(`/api/tramites/${id}`, { token: sesion?.token });
      setTramite(tramiteCargado);
      const tipos = await apiFetch<TipoTramite[]>("/api/admin/tipos-tramite", { token: sesion?.token });
      setTipo(tipos.find((t) => t.id === tramiteCargado.tipoTramiteId) ?? null);
    } catch {
      setError("No pudimos cargar el trámite.");
    }
  }, [id, sesion?.token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEventosTramite(id, cargar);

  const transicionesPosibles = tipo?.flujoEstados.transiciones[tramite?.estadoActual ?? ""] ?? [];
  const volverA = { to: "/admin/tramites", texto: "Volver a la bandeja de entrada" };

  async function manejarCambiarEstado(evento: FormEvent) {
    evento.preventDefault();
    if (!id || !nuevoEstado) return;

    setEnviando(true);
    setError(null);
    try {
      await apiFetch(`/api/tramites/${id}/estado`, {
        method: "PATCH",
        token: sesion?.token,
        body: { nuevoEstado },
      });
      setNuevoEstado("");
      await cargar();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "No pudimos cambiar el estado.");
    } finally {
      setEnviando(false);
    }
  }

  async function manejarComentar(evento: FormEvent) {
    evento.preventDefault();
    if (!id || !comentario.trim()) return;

    setEnviando(true);
    setError(null);
    try {
      await apiFetch(`/api/tramites/${id}/comentarios`, {
        method: "POST",
        token: sesion?.token,
        body: { texto: comentario },
      });
      setComentario("");
      await cargar();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "No pudimos agregar el comentario.");
    } finally {
      setEnviando(false);
    }
  }

  if (!tramite) {
    return (
      <PantallaAncha titulo="Trámite" volverA={volverA}>
        <p className="text-sm text-neutral-400">{error ?? "Cargando…"}</p>
      </PantallaAncha>
    );
  }

  return (
    <PantallaAncha
      titulo={tramite.tipoTramiteNombre ?? `Trámite #${tramite.id.slice(0, 8)}`}
      subtitulo={`#${tramite.id.slice(0, 8)} · Iniciado el ${new Date(tramite.createdAt).toLocaleDateString("es-AR")}`}
      volverA={volverA}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <EstadoBadge estado={tramite.estadoActual} />
            {tramite.tipoTramiteVersion != null && (
              <span
                title="Versión del tipo de trámite contra la que se inició (información solo para el admin)"
                className="text-xs font-medium text-neutral-400"
              >
                v{tramite.tipoTramiteVersion}
              </span>
            )}
            <span className="text-sm text-neutral-500">
              {tramite.ciudadanoNombre} · {tramite.ciudadanoEmail}
            </span>
          </div>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Datos del formulario
          </h2>
          <div className="mb-8">
            <ResumenDatosFormulario
              esquema={tipo?.esquemaFormulario ?? tramite.tipoTramiteEsquemaFormulario}
              datos={tramite.datosFormulario}
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <form onSubmit={manejarCambiarEstado} className="mb-8 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="nuevo-estado" className="mb-1 block text-sm font-medium text-neutral-700">
                Cambiar estado
              </label>
              <select
                id="nuevo-estado"
                value={nuevoEstado}
                onChange={(evento) => setNuevoEstado(evento.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">Elegir estado…</option>
                {transicionesPosibles.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={enviando || !nuevoEstado}
              className="rounded-xl bg-brand hover:bg-brand-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Aplicar
            </button>
          </form>

          <form onSubmit={manejarComentar} className="space-y-2">
            <label htmlFor="comentario" className="block text-sm font-medium text-neutral-700">
              Agregar comentario
            </label>
            <textarea
              id="comentario"
              rows={3}
              value={comentario}
              onChange={(evento) => setComentario(evento.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={enviando || !comentario.trim()}
              className="rounded-xl bg-brand hover:bg-brand-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Comentar
            </button>
          </form>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Historial</h2>
          <LineaDeTiempo eventos={tramite.historial} />
        </div>
      </div>
    </PantallaAncha>
  );
}
