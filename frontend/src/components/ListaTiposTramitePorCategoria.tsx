import { useState, type ReactNode } from "react";
import type { TipoTramite } from "../types/api";

const SIN_CATEGORIA = "Otros";

interface Props {
  tipos: TipoTramite[];
  renderItem: (tipo: TipoTramite) => ReactNode;
  placeholderBusqueda?: string;
}

export default function ListaTiposTramitePorCategoria({
  tipos,
  renderItem,
  placeholderBusqueda = "Buscar por nombre o categoría…",
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  const terminoNormalizado = busqueda.trim().toLowerCase();
  const filtrados = tipos.filter((tipo) => {
    const texto = `${tipo.nombre} ${tipo.categoria ?? ""}`.toLowerCase();
    return texto.includes(terminoNormalizado);
  });

  const grupos = new Map<string, TipoTramite[]>();
  for (const tipo of filtrados) {
    const categoria = tipo.categoria?.trim() || SIN_CATEGORIA;
    if (!grupos.has(categoria)) grupos.set(categoria, []);
    grupos.get(categoria)!.push(tipo);
  }

  const categoriasOrdenadas = [...grupos.keys()].sort((a, b) => a.localeCompare(b, "es"));

  return (
    <div>
      <input
        type="search"
        placeholder={placeholderBusqueda}
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        className="mb-6 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-brand"
      />

      {filtrados.length === 0 && (
        <p className="text-sm text-neutral-500">No encontramos trámites que coincidan con la búsqueda.</p>
      )}

      <div className="space-y-8">
        {categoriasOrdenadas.map((categoria) => (
          <section key={categoria}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">{categoria}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {grupos.get(categoria)!.map((tipo) => (
                <div key={tipo.id}>{renderItem(tipo)}</div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
