import { useCallback, useEffect, useState } from "react";
import PantallaAncha from "../../components/PantallaAncha";
import FormularioTipoTramite from "../../components/FormularioTipoTramite";
import { ApiError, apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import type { TipoTramite } from "../../types/api";

export default function TiposTramitePagina() {
  const { sesion } = useAuth();
  const [tipos, setTipos] = useState<TipoTramite[] | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    apiFetch<TipoTramite[]>("/api/admin/tipos-tramite", { token: sesion?.token })
      .then(setTipos)
      .catch(() => setError("No pudimos cargar los tipos de trámite."));
  }, [sesion?.token]);

  useEffect(cargar, [cargar]);

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
      acciones={
        <button
          type="button"
          onClick={() => setMostrarFormulario((valor) => !valor)}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          {mostrarFormulario ? "Cancelar" : "Nuevo tipo de trámite"}
        </button>
      }
    >
      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {mostrarFormulario && (
        <FormularioTipoTramite
          onCreado={() => {
            setMostrarFormulario(false);
            cargar();
          }}
        />
      )}

      <ul className="space-y-3">
        {tipos?.map((tipo) => (
          <li
            key={tipo.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-50">
                {tipo.nombre} <span className="text-xs text-neutral-400">v{tipo.version}</span>
              </p>
              {tipo.categoria && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{tipo.categoria}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm capitalize text-neutral-600 dark:text-neutral-400">{tipo.estado}</span>
              {tipo.estado === "borrador" && (
                <button
                  type="button"
                  onClick={() => publicar(tipo.id)}
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
                >
                  Publicar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </PantallaAncha>
  );
}
