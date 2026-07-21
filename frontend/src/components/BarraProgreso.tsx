function formatearEstado(estado: string): string {
  return estado.replaceAll("_", " ");
}

interface Props {
  pasos: string[];
  estadoActual: string;
}

export default function BarraProgreso({ pasos, estadoActual }: Props) {
  const indiceActual = pasos.indexOf(estadoActual);

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {pasos.map((paso, indice) => {
        const completado = indiceActual >= 0 && indice < indiceActual;
        const esActual = indice === indiceActual;

        const clase = esActual
          ? "bg-brand text-white"
          : completado
            ? "bg-green-100 text-green-800"
            : "bg-neutral-100 text-neutral-500";

        return (
          <li key={paso} className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${clase}`}>
              {formatearEstado(paso)}
            </span>
            {indice < pasos.length - 1 && <span className="text-neutral-300">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
