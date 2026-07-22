interface Props {
  cantidad?: number;
}

export default function EsqueletoTarjetas({ cantidad = 6 }: Props) {
  return (
    <div data-testid="esqueleto-tarjetas" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cantidad }).map((_, indice) => (
        <div key={indice} className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
