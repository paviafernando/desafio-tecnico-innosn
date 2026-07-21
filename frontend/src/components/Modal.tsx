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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8 sm:items-center">
      <div
        data-testid="modal-fondo"
        onClick={onClose}
        className="fixed inset-0 bg-neutral-900/40"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
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
        {children}
      </div>
    </div>
  );
}
