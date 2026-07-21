import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import EstadoBadge from "../../components/EstadoBadge";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import { useEventosAdmin } from "../../hooks/useEventosTiempoReal";
import type { Tramite } from "../../types/api";

const DEMORA_DEBOUNCE_MS = 300;

interface RespuestaBandeja {
  items: Tramite[];
  hayMas: boolean;
}

export default function BandejaEntrada() {
  const { sesion } = useAuth();
  const navigate = useNavigate();
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargadoAlMenosUnaVez, setCargadoAlMenosUnaVez] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelaRef = useRef<HTMLDivElement>(null);
  const cargandoRef = useRef(false);

  // Debounce: esperamos una pausa al tipear antes de pegarle al backend.
  useEffect(() => {
    const id = setTimeout(() => setBusqueda(busquedaInput), DEMORA_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [busquedaInput]);

  const cargarPagina = useCallback(
    async (offset: number, reemplazar: boolean) => {
      if (cargandoRef.current) return;
      cargandoRef.current = true;
      setCargando(true);
      setError(null);
      try {
        const params = new URLSearchParams({ offset: String(offset) });
        if (busqueda.trim()) params.set("busqueda", busqueda.trim());

        const respuesta = await apiFetch<RespuestaBandeja>(`/api/admin/tramites?${params}`, {
          token: sesion?.token,
        });

        setTramites((actuales) => (reemplazar ? respuesta.items : [...actuales, ...respuesta.items]));
        setHayMas(respuesta.hayMas);
        setCargadoAlMenosUnaVez(true);
      } catch {
        setError("No pudimos cargar la bandeja de entrada.");
      } finally {
        cargandoRef.current = false;
        setCargando(false);
      }
    },
    [busqueda, sesion?.token],
  );

  // Cada vez que cambia la búsqueda (ya con el debounce aplicado), se arranca de cero.
  useEffect(() => {
    cargarPagina(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, sesion?.token]);

  useEventosAdmin(useCallback(() => cargarPagina(0, true), [cargarPagina]));

  useEffect(() => {
    const nodo = sentinelaRef.current;
    if (!nodo) return;

    const observer = new IntersectionObserver((entradas) => {
      if (entradas[0]?.isIntersecting && hayMas && !cargandoRef.current) {
        cargarPagina(tramites.length, false);
      }
    });
    observer.observe(nodo);
    return () => observer.disconnect();
  }, [cargarPagina, hayMas, tramites.length]);

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
          value={busquedaInput}
          onChange={(evento) => setBusquedaInput(evento.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargadoAlMenosUnaVez && tramites.length === 0 && !cargando && (
        <p className="text-sm text-neutral-500">No hay trámites que coincidan con la búsqueda.</p>
      )}

      {tramites.length > 0 && (
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
              {tramites.map((tramite) => (
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

      <div ref={sentinelaRef} className="h-1" />
      {cargando && <p className="py-4 text-center text-sm text-neutral-400">Cargando…</p>}
    </PantallaAncha>
  );
}
