import type { RecursoTramite } from "../types/api";

function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

interface Props {
  recursos: RecursoTramite[];
}

export default function ListaDocumentos({ recursos }: Props) {
  if (recursos.length === 0) {
    return <p className="text-sm text-neutral-500">No hay documentos disponibles todavía.</p>;
  }

  return (
    <ul className="space-y-2">
      {recursos.map((recurso) => (
        <li
          key={recurso.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">{recurso.nombreOriginal}</p>
            <p className="text-xs text-neutral-400">{formatearTamanio(recurso.tamanioBytes)}</p>
          </div>
          <a
            href={recurso.urlDescarga}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-medium text-brand hover:text-brand-dark"
          >
            Descargar
          </a>
        </li>
      ))}
    </ul>
  );
}
