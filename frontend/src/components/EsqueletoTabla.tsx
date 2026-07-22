interface Props {
  filas?: number;
  columnas?: number;
}

export default function EsqueletoTabla({ filas = 8, columnas = 5 }: Props) {
  return (
    <div data-testid="esqueleto-tabla" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <tbody>
          {Array.from({ length: filas }).map((_, fila) => (
            <tr key={fila} className="border-b border-neutral-100 last:border-0">
              {Array.from({ length: columnas }).map((_, columna) => (
                <td key={columna} className="px-4 py-3.5">
                  <div className="h-3.5 animate-pulse rounded bg-neutral-200" style={{ width: `${60 + ((fila + columna) % 3) * 15}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
