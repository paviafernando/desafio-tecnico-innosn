import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import Modal from "../../components/Modal";
import CampoFormularioDinamico from "../../components/CampoFormularioDinamico";
import ListaTiposTramitePorCategoria from "../../components/ListaTiposTramitePorCategoria";
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

  function elegirTipo(tipo: TipoTramite) {
    setTipoSeleccionado(tipo);
    setValores({});
    setArchivos({});
    setError(null);
  }

  function cerrarModal() {
    setTipoSeleccionado(null);
  }

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

  return (
    <PantallaAncha titulo="Nuevo trámite" volverA={{ to: "/mis-tramites", texto: "Volver a mis trámites" }}>
      {error && !tipoSeleccionado && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <p className="mb-4 text-sm text-neutral-500">Elegí el trámite que querés iniciar:</p>
      <ListaTiposTramitePorCategoria
        tipos={tipos ?? []}
        placeholderBusqueda="Buscar trámite por nombre o categoría…"
        renderItem={(tipo) => (
          <button
            type="button"
            onClick={() => elegirTipo(tipo)}
            className="h-full w-full rounded-2xl border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-brand"
          >
            <p className="font-medium text-neutral-900">{tipo.nombre}</p>
            {tipo.costo && <p className="mt-2 text-sm font-medium text-neutral-700">{tipo.costo}</p>}
          </button>
        )}
      />

      <Modal open={tipoSeleccionado !== null} onClose={cerrarModal} titulo={tipoSeleccionado?.nombre ?? ""}>
        {tipoSeleccionado && (
          <form onSubmit={manejarSubmit} className="space-y-5">
            {error && <p className="text-sm text-red-600">{error}</p>}

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
              className="w-full rounded-xl bg-brand hover:bg-brand-dark px-4 py-2.5 font-medium text-white transition-opacity disabled:opacity-50"
            >
              {enviando ? "Enviando…" : "Enviar trámite"}
            </button>
          </form>
        )}
      </Modal>
    </PantallaAncha>
  );
}
