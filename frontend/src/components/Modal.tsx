import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  titulo: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, titulo, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        data-testid="modal-fondo"
        onClick={onClose}
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
