const COLORES_POR_ESTADO: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  en_revision: "bg-blue-100 text-blue-800",
  documentacion_requerida: "bg-orange-100 text-orange-800",
  aprobado: "bg-green-100 text-green-800",
  rechazado: "bg-red-100 text-red-800",
};

const COLOR_POR_DEFECTO = "bg-neutral-100 text-neutral-800";

function formatearEstado(estado: string): string {
  return estado.replaceAll("_", " ");
}

export default function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        COLORES_POR_ESTADO[estado] ?? COLOR_POR_DEFECTO
      }`}
    >
      {formatearEstado(estado)}
    </span>
  );
}
