import type { EventoHistorial } from "../types/api";

function describirEvento(evento: EventoHistorial): string {
  if (evento.tipoEvento === "creacion") return "Trámite creado";
  if (evento.tipoEvento === "cambio_estado") {
    return `Estado cambiado de "${evento.estadoAnterior}" a "${evento.estadoNuevo}"`;
  }
  return "Comentario agregado";
}

export default function LineaDeTiempo({ eventos }: { eventos: EventoHistorial[] }) {
  return (
    <ol className="space-y-4">
      {eventos.map((evento) => (
        <li key={evento.id} className="border-l-2 border-neutral-200 pl-4">
          <p className="text-sm font-medium text-neutral-900">
            {describirEvento(evento)}
          </p>
          <p className="text-xs text-neutral-500">
            {new Date(evento.createdAt).toLocaleString("es-AR")} ·{" "}
            {evento.autorTipo === "admin" ? "Administrador" : "Vecino"}
          </p>
        </li>
      ))}
    </ol>
  );
}
