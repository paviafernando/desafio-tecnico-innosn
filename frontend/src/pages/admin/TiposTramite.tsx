import { useCallback, useEffect, useState } from "react";
import PantallaAncha from "../../components/PantallaAncha";
import Modal from "../../components/Modal";
import FormularioTipoTramite from "../../components/FormularioTipoTramite";
import ListaTiposTramitePorCategoria from "../../components/ListaTiposTramitePorCategoria";
import { ApiError, apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import type { TipoTramite } from "../../types/api";

export default function TiposTramitePagina() {
  const { sesion } = useAuth();
  const [tipos, setTipos] = useState<TipoTramite[] | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoEnEdicion, setTipoEnEdicion] = useState<TipoTramite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(() => {
    apiFetch<TipoTramite[]>("/api/admin/tipos-tramite", { token: sesion?.token })
      .then(setTipos)
      .catch(() => setError("No pudimos cargar los tipos de trámite."));
  }, [sesion?.token]);

  useEffect(cargar, [cargar]);

  function abrirCreacion() {
    setTipoEnEdicion(null);
    setMensaje(null);
    setModalAbierto(true);
  }

  function abrirEdicion(tipo: TipoTramite) {
    setTipoEnEdicion(tipo);
    setMensaje(null);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setTipoEnEdicion(null);
  }

  function manejarGuardado(tipoGuardado: TipoTramite) {
    const creoNuevaVersion = tipoEnEdicion && tipoGuardado.id !== tipoEnEdicion.id;
    cerrarModal();
    cargar();

    setMensaje(
      creoNuevaVersion
        ? `Se creó la versión v${tipoGuardado.version} en borrador: el tipo publicado ya tenía trámites en curso, así que no se editó in place. Publicala cuando quieras que reemplace a la anterior.`
        : null,
    );
  }

  async function publicar(tipoId: string) {
    setError(null);
    try {
      await apiFetch(`/api/admin/tipos-tramite/${tipoId}/publicar`, {
        method: "POST",
        token: sesion?.token,
      });
      cargar();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "No pudimos publicar el tipo de trámite.");
    }
  }

  return (
    <PantallaAncha
      titulo="Tipos de trámite"
      volverA={{ to: "/admin/tramites", texto: "Volver a la bandeja de entrada" }}
      acciones={
        <button
          type="button"
          onClick={abrirCreacion}
          className="rounded-xl bg-brand hover:bg-brand-dark px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo tipo de trámite
        </button>
      }
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {mensaje && (
        <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">{mensaje}</p>
      )}

      <ListaTiposTramitePorCategoria
        tipos={tipos ?? []}
        placeholderBusqueda="Buscar tipo de trámite por nombre o categoría…"
        renderItem={(tipo) => (
          <div className="flex h-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
            <div>
              <p className="font-medium text-neutral-900">
                {tipo.nombre} <span className="text-xs text-neutral-400">v{tipo.version}</span>
              </p>
              <p className="text-sm capitalize text-neutral-500">{tipo.estado}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => abrirEdicion(tipo)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:border-brand"
              >
                Editar
              </button>
              {tipo.estado === "borrador" && (
                <button
                  type="button"
                  onClick={() => publicar(tipo.id)}
                  className="rounded-lg bg-brand hover:bg-brand-dark px-3 py-1.5 text-sm font-medium text-white"
                >
                  Publicar
                </button>
              )}
            </div>
          </div>
        )}
      />

      <Modal
        open={modalAbierto}
        onClose={cerrarModal}
        titulo={tipoEnEdicion ? "Editar tipo de trámite" : "Nuevo tipo de trámite"}
      >
        <FormularioTipoTramite tipoExistente={tipoEnEdicion ?? undefined} onGuardado={manejarGuardado} />
      </Modal>
    </PantallaAncha>
  );
}
