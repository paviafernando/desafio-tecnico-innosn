interface Props {
  mostrados: number;
  total: number;
  totalSinFiltro: number;
  hayBusqueda: boolean;
}

export default function ContadorResultados({ mostrados, total, totalSinFiltro, hayBusqueda }: Props) {
  const palabra = total === 1 ? "trámite" : "trámites";

  return (
    <p className="mb-3 text-xs text-neutral-500">
      Mostrando {mostrados} de {total} {palabra}
      {hayBusqueda && totalSinFiltro !== total && ` (${totalSinFiltro} en total)`}
    </p>
  );
}
