interface Props {
  total: number;
  totalSinFiltro: number;
  hayBusqueda: boolean;
}

/**
 * Muestra solo el total (no "mostrando X de Y"): con scroll infinito, la
 * cantidad efectivamente renderizada crece de a poco (20, 40, 60...) y
 * mostrar ese número confunde más de lo que aclara. El total no cambia
 * mientras se hace scroll, así que es el único dato estable para mostrar acá.
 */
export default function ContadorResultados({ total, totalSinFiltro, hayBusqueda }: Props) {
  if (hayBusqueda) {
    const palabra = total === 1 ? "resultado" : "resultados";
    return (
      <p className="mb-3 text-xs text-neutral-500">
        {total} {palabra}
        {totalSinFiltro !== total && ` de ${totalSinFiltro} en total`}
      </p>
    );
  }

  const palabra = total === 1 ? "trámite" : "trámites";
  return (
    <p className="mb-3 text-xs text-neutral-500">
      {total} {palabra}
    </p>
  );
}
