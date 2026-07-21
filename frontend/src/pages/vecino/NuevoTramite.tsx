import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import CampoFormularioDinamico from "../../components/CampoFormularioDinamico";
import { ApiError, apiFetch, apiSubirArchivo } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import type { TipoTramite } from "../../types/api";

export default function NuevoTramite() {
  const { sesion } = useAuth();
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoTramite[] | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoTramite | null>(null);
  const [valores, setValores] = useState<Record<string, unknown>>({});
  const [archivos, setArchivos] = useState<Record<string, File | undefined>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<TipoTramite[]>("/api/tipos-tramite", { token: sesion?.token })
      .then(setTipos)
      .catch(() => setError("No pudimos cargar los tipos de trámite disponibles."));
  }, [sesion?.token]);

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!tipoSeleccionado) return;

    const archivoFaltante = tipoSeleccionado.esquemaFormulario.campos.find(
      (campo) => campo.tipo === "archivo" && campo.requerido && !archivos[campo.id],
    );
    if (archivoFaltante) {
      setError(`Falta adjuntar "${archivoFaltante.etiqueta}"`);
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const datosFormulario: Record<string, unknown> = { ...valores };

      for (const campo of tipoSeleccionado.esquemaFormulario.campos) {
        if (campo.tipo !== "archivo") continue;
        const archivo = archivos[campo.id];
        if (!archivo) continue;
        const subida = await apiSubirArchivo("/api/archivos", archivo, sesion?.token ?? null);
        datosFormulario[campo.id] = subida.claveAlmacenamiento;
      }

      const tramite = await apiFetch<{ id: string }>("/api/tramites", {
        method: "POST",
        token: sesion?.token,
        body: { tipoTramiteId: tipoSeleccionado.id, datosFormulario },
      });

      navigate(`/mis-tramites/${tramite.id}`);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "No pudimos crear el trámite.");
    } finally {
      setEnviando(false);
    }
  }

  if (!tipoSeleccionado) {
    return (
      <PantallaAncha titulo="Nuevo trámite">
        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {tipos?.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              onClick={() => setTipoSeleccionado(tipo)}
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-100"
            >
              <p className="font-medium text-neutral-900 dark:text-neutral-50">{tipo.nombre}</p>
              {tipo.categoria && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{tipo.categoria}</p>
              )}
              {tipo.costo && (
                <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">{tipo.costo}</p>
              )}
            </button>
          ))}
        </div>
      </PantallaAncha>
    );
  }

  return (
    <PantallaAncha titulo={tipoSeleccionado.nombre}>
      <form onSubmit={manejarSubmit} className="max-w-xl space-y-5">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {tipoSeleccionado.esquemaFormulario.campos.map((campo) => (
          <CampoFormularioDinamico
            key={campo.id}
            campo={campo}
            valor={valores[campo.id]}
            onCambiar={(valor) => setValores((prev) => ({ ...prev, [campo.id]: valor }))}
            onArchivoSeleccionado={(archivo) =>
              setArchivos((prev) => ({ ...prev, [campo.id]: archivo }))
            }
          />
        ))}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 font-medium text-white transition-opacity disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {enviando ? "Enviando…" : "Enviar trámite"}
        </button>
      </form>
    </PantallaAncha>
  );
}
