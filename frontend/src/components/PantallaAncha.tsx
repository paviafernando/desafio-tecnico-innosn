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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to={sesion?.rol === "admin" ? "/admin/tramites" : "/mis-tramites"} className="shrink-0">
              <img src="/sn-logo.png" alt="Municipalidad de San Nicolás de los Arroyos" className="h-8 w-auto sm:h-10" />
            </Link>
            <div className="hidden h-9 w-px bg-neutral-200 sm:block" />
            <div>
              {volverA && (
                <Link
                  to={volverA.to}
                  className="mb-0.5 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-brand"
                >
                  ← {volverA.texto}
                </Link>
              )}
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900">{titulo}</h1>
              {subtitulo && <p className="mt-0.5 text-xs text-neutral-400">{subtitulo}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {sesion && <span className="hidden text-sm text-neutral-500 sm:inline">{sesion.nombre}</span>}
            <button
              type="button"
              onClick={manejarCerrarSesion}
              className="text-sm text-neutral-500 hover:text-brand"
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
