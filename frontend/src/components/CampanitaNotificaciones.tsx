import { useRef, useState } from "react";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { useClickAfuera } from "../hooks/useClickAfuera";

export default function CampanitaNotificaciones() {
  const { notificaciones, noLeidas, marcarTodasLeidas } = useNotificaciones();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useClickAfuera(contenedorRef, () => setAbierto(false));

  function alternar() {
    setAbierto((actual) => {
      const siguiente = !actual;
      if (siguiente) marcarTodasLeidas();
      return siguiente;
    });
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={alternar}
        aria-label="Notificaciones"
        className="relative rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-brand"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
          />
        </svg>
        {noLeidas > 0 && (
          <span
            data-testid="badge-no-leidas"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white"
          >
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[90vw] rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Notificaciones
          </p>
          {notificaciones.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-neutral-500">No tenés notificaciones.</p>
          )}
          <ul className="max-h-80 overflow-y-auto">
            {notificaciones.map((notificacion) => (
              <li key={notificacion.id} className="rounded-xl px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                <p>{notificacion.mensaje}</p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {notificacion.creadaEn.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
