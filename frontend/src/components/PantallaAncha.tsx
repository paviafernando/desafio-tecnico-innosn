import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useSesion";

interface Props {
  titulo: string;
  acciones?: ReactNode;
  children: ReactNode;
}

export default function PantallaAncha({ titulo, acciones, children }: Props) {
  const { sesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  function manejarCerrarSesion() {
    cerrarSesion();
    navigate(sesion?.rol === "admin" ? "/admin" : "/");
  }

  return (
    <div className="min-h-svh bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {titulo}
          </h1>
          <div className="flex items-center gap-4">
            {sesion && (
              <span className="hidden text-sm text-neutral-500 sm:inline dark:text-neutral-400">
                {sesion.nombre}
              </span>
            )}
            <button
              type="button"
              onClick={manejarCerrarSesion}
              className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {acciones && <div className="mb-6 flex flex-wrap items-center justify-between gap-3">{acciones}</div>}
        {children}
      </main>
    </div>
  );
}
