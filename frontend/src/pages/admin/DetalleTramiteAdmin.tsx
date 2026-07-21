import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import EstadoBadge from "../../components/EstadoBadge";
import LineaDeTiempo from "../../components/LineaDeTiempo";
import ResumenDatosFormulario from "../../components/ResumenDatosFormulario";
import ListaDocumentos from "../../components/ListaDocumentos";
import { ApiError, apiFetch, apiSubirArchivo } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import { useEventosTramite } from "../../hooks/useEventosTiempoReal";
import type { TipoTramite, TramiteConDetalle } from "../../types/api";

const TIPOS_MIME_ACEPTADOS = "application/pdf,image/png,image/jpeg,image/webp";

export default function DetalleTramiteAdmin() {
  const { id } = useParams();
  const { sesion } = useAuth();
  const [tramite, setTramite] = useState<TramiteConDetalle | null>(null);
  const [tipo, setTipo] = useState<TipoTramite | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [comentario, setComentario] = useState("");
  const [comentarioVisibleParaVecino, setComentarioVisibleParaVecino] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [subiendoDocumento, setSubiendoDocumento] = useState(false);

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

  async function manejarSubirDocumento(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!id || !archivo) return;

    setSubiendoDocumento(true);
    setError(null);
    try {
      const { claveAlmacenamiento } = await apiSubirArchivo("/api/archivos", archivo, sesion?.token ?? null);
      await apiFetch(`/api/tramites/${id}/recursos`, {
        method: "POST",
        token: sesion?.token,
        body: {
          nombreOriginal: archivo.name,
          claveStorage: claveAlmacenamiento,
          tipoMime: archivo.type,
          tamanioBytes: archivo.size,
        },
      });
      await cargar();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "No pudimos subir el documento.");
    } finally {
      setSubiendoDocumento(false);
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
        body: { texto: comentario, visibleParaVecino: comentarioVisibleParaVecino },
      });
      setComentario("");
      setComentarioVisibleParaVecino(false);
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

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Documentos para el vecino
          </h2>
          <div className="mb-3">
            <ListaDocumentos recursos={tramite.recursos} />
          </div>
          <label
            htmlFor="subir-documento"
            className="inline-block cursor-pointer rounded-xl border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:border-brand"
          >
            {subiendoDocumento ? "Subiendo…" : "Subir documento"}
          </label>
          <input
            id="subir-documento"
            type="file"
            accept={TIPOS_MIME_ACEPTADOS}
            onChange={manejarSubirDocumento}
            disabled={subiendoDocumento}
            className="sr-only"
          />

          <form onSubmit={manejarComentar} className="mt-8 space-y-2">
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
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={comentarioVisibleParaVecino}
                onChange={(evento) => setComentarioVisibleParaVecino(evento.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              Visible para el vecino
            </label>
            <button
              type="submit"
              disabled={enviando || !comentario.trim()}
              className="rounded-xl bg-brand hover:bg-brand-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Comentar
            </button>
          </form>

          {tramite.comentarios.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Comentarios
              </h2>
              <ul className="space-y-3">
                {tramite.comentarios.map((c) => (
                  <li key={c.id} className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
                    <p className="text-neutral-700">{c.texto}</p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.visibleParaVecino ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {c.visibleParaVecino ? "Visible para el vecino" : "Interno"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Historial</h2>
          <LineaDeTiempo eventos={tramite.historial} />

          {tramite.tipoTramiteArchivosReferencia && tramite.tipoTramiteArchivosReferencia.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Documentos de referencia
              </h2>
              <ul className="mb-3 space-y-1">
                {tramite.tipoTramiteArchivosReferencia.map((archivo) => (
                  <li key={archivo.nombre}>
                    <a
                      href={archivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand hover:text-brand-dark"
                    >
                      {archivo.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </PantallaAncha>
  );
}
