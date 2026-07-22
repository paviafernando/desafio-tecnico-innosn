import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PantallaAncha from "../../components/PantallaAncha";
import EstadoBadge from "../../components/EstadoBadge";
import ContadorResultados from "../../components/ContadorResultados";
import EsqueletoTarjetas from "../../components/EsqueletoTarjetas";
import { apiFetch } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";
import type { Tramite } from "../../types/api";

const DEMORA_DEBOUNCE_MS = 300;

interface RespuestaMisTramites {
  items: Tramite[];
  hayMas: boolean;
  total: number;
  totalSinFiltro: number;
}

export default function MisTramites() {
  const { sesion } = useAuth();
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalSinFiltro, setTotalSinFiltro] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [cargadoAlMenosUnaVez, setCargadoAlMenosUnaVez] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelaRef = useRef<HTMLDivElement>(null);
  const cargandoRef = useRef(false);

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

        const respuesta = await apiFetch<RespuestaMisTramites>(`/api/tramites/mios?${params}`, {
          token: sesion?.token,
        });

        setTramites((actuales) => (reemplazar ? respuesta.items : [...actuales, ...respuesta.items]));
        setHayMas(respuesta.hayMas);
        setTotal(respuesta.total);
        setTotalSinFiltro(respuesta.totalSinFiltro);
        setCargadoAlMenosUnaVez(true);
      } catch {
        setError("No pudimos cargar tus trámites.");
      } finally {
        cargandoRef.current = false;
        setCargando(false);
      }
    },
    [busqueda, sesion?.token],
  );

  useEffect(() => {
    cargarPagina(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, sesion?.token]);

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
      titulo="Mis trámites"
      acciones={
        <Link
          to="/mis-tramites/nuevo"
          className="rounded-xl bg-brand hover:bg-brand-dark px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo trámite
        </Link>
      }
    >
      <div className="mb-4 max-w-md">
        <label htmlFor="buscador-mis-tramites" className="mb-1 block text-sm font-medium text-neutral-700">
          Buscar
        </label>
        <input
          id="buscador-mis-tramites"
          type="search"
          placeholder="Estado, tipo de trámite, categoría o número…"
          value={busquedaInput}
          onChange={(evento) => setBusquedaInput(evento.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!cargadoAlMenosUnaVez && <EsqueletoTarjetas />}

      {cargadoAlMenosUnaVez && tramites.length === 0 && !cargando && (
        <p className="text-sm text-neutral-500">
          {busqueda.trim() ? "No hay trámites que coincidan con la búsqueda." : "Todavía no cargaste ningún trámite."}
        </p>
      )}

      {cargadoAlMenosUnaVez && tramites.length > 0 && (
        <ContadorResultados
          mostrados={tramites.length}
          total={total}
          totalSinFiltro={totalSinFiltro}
          hayBusqueda={busqueda.trim().length > 0}
        />
      )}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tramites.map((tramite) => (
          <li key={tramite.id}>
            <Link
              to={`/mis-tramites/${tramite.id}`}
              className="flex h-full items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-brand"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium text-neutral-900">
                  {tramite.tipoTramiteNombre ?? `Trámite #${tramite.id.slice(0, 8)}`}
                </p>
                <p className="text-xs text-neutral-400">
                  #{tramite.id.slice(0, 8)} · {new Date(tramite.createdAt).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div className="shrink-0">
                <EstadoBadge estado={tramite.estadoActual} />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div ref={sentinelaRef} className="h-1" />
      {cargadoAlMenosUnaVez && cargando && (
        <p className="py-4 text-center text-sm text-neutral-400">Cargando…</p>
      )}
    </PantallaAncha>
  );
}
