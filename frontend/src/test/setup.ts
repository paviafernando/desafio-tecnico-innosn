import "@testing-library/jest-dom/vitest";

// jsdom no implementa IntersectionObserver; los tests que necesiten simular
// una intersección real la mockean puntualmente con vi.stubGlobal.
class IntersectionObserverPorDefecto {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
// @ts-expect-error - stub mínimo, no implementa la interfaz completa del navegador
globalThis.IntersectionObserver ??= IntersectionObserverPorDefecto;
