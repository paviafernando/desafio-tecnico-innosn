import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import EstadoBadge from "../../components/EstadoBadge";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import { useEventosAdmin } from "../../hooks/useEventosTiempoReal";
import type { Tramite } from "../../types/api";

function coincide(tramite: Tramite, busqueda: string): boolean {
  const texto = [
    tramite.id,
    tramite.estadoActual,
    tramite.tipoTramiteNombre,
    tramite.tipoTramiteCategoria,
    tramite.ciudadanoNombre,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return texto.includes(busqueda.trim().toLowerCase());
}

export default function BandejaEntrada() {
  const { sesion } = useAuth();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [tramites, setTramites] = useState<Tramite[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    apiFetch<Tramite[]>("/api/admin/tramites", { token: sesion?.token })
      .then(setTramites)
      .catch(() => setError("No pudimos cargar la bandeja de entrada."));
  }, [sesion?.token]);

  useEffect(cargar, [cargar]);
  useEventosAdmin(cargar);

  const tramitesFiltrados = tramites?.filter((tramite) => coincide(tramite, busqueda)) ?? null;

  return (
    <PantallaAncha
      titulo="Bandeja de entrada"
      acciones={
        <Link to="/admin/tipos-tramite" className="text-sm font-medium text-neutral-600 hover:text-brand">
          Tipos de trámite →
        </Link>
      }
    >
      <div className="mb-4 max-w-md">
        <label htmlFor="buscador-bandeja" className="mb-1 block text-sm font-medium text-neutral-700">
          Buscar
        </label>
        <input
          id="buscador-bandeja"
          type="search"
          placeholder="Estado, tipo de trámite, categoría, vecino o número…"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {tramitesFiltrados && tramitesFiltrados.length === 0 && (
        <p className="text-sm text-neutral-500">No hay trámites que coincidan con la búsqueda.</p>
      )}

      {tramitesFiltrados && tramitesFiltrados.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Trámite</th>
                <th className="px-4 py-3 font-medium">Tipo de trámite</th>
                <th className="px-4 py-3 font-medium">Vecino</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {tramitesFiltrados.map((tramite) => (
                <tr
                  key={tramite.id}
                  onClick={() => navigate(`/admin/tramites/${tramite.id}`)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3 font-medium text-neutral-900">#{tramite.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {tramite.tipoTramiteNombre ?? "—"}
                    {tramite.tipoTramiteVersion != null && (
                      <span
                        title="Versión del tipo de trámite contra la que se inició"
                        className="ml-1.5 text-xs font-medium text-neutral-400"
                      >
                        v{tramite.tipoTramiteVersion}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{tramite.ciudadanoNombre}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={tramite.estadoActual} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(tramite.createdAt).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PantallaAncha>
  );
}
