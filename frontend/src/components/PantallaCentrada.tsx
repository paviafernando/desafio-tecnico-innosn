import type { ReactNode } from "react";

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}

export default function PantallaCentrada({ titulo, subtitulo, children }: Props) {
  return (
    <main className="min-h-svh bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md rounded-3xl bg-white dark:bg-neutral-900 shadow-xl shadow-neutral-200/60 dark:shadow-black/40 p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{subtitulo}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
