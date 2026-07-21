import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useSesion";

interface Props {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  volverA?: { to: string; texto: string };
  acciones?: ReactNode;
  children: ReactNode;
}

export default function PantallaAncha({ titulo, subtitulo, volverA, acciones, children }: Props) {
  const { sesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  function manejarCerrarSesion() {
    cerrarSesion();
    navigate(sesion?.rol === "admin" ? "/admin" : "/");
  }

  return (
    <div className="min-h-svh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            {volverA && (
              <Link
                to={volverA.to}
                className="mb-1 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
              >
                ← {volverA.texto}
              </Link>
            )}
            <h1 className="text-lg font-semibold tracking-tight text-neutral-900">{titulo}</h1>
            {subtitulo && <p className="mt-0.5 text-xs text-neutral-400">{subtitulo}</p>}
          </div>
          <div className="flex items-center gap-4">
            {sesion && <span className="hidden text-sm text-neutral-500 sm:inline">{sesion.nombre}</span>}
            <button
              type="button"
              onClick={manejarCerrarSesion}
              className="text-sm text-neutral-500 hover:text-neutral-900"
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
