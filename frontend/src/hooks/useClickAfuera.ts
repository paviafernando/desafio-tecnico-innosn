import { useEffect, type RefObject } from "react";

export function useClickAfuera(ref: RefObject<HTMLElement | null>, onClickAfuera: () => void): void {
  useEffect(() => {
    function manejar(evento: MouseEvent) {
      if (ref.current && !ref.current.contains(evento.target as Node)) {
        onClickAfuera();
      }
    }

    document.addEventListener("mousedown", manejar);
    return () => document.removeEventListener("mousedown", manejar);
  }, [ref, onClickAfuera]);
}
