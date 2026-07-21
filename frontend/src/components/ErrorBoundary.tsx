import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Sin esto, un error de render en cualquier pantalla deja la app en blanco
 * sin ningún indicio visible de qué pasó (React sigue logueando en consola,
 * pero eso no siempre alcanza para diagnosticar rápido). Con este límite, al
 * menos queda un mensaje visible con el error real.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Error de render atrapado por ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh items-center justify-center bg-neutral-50 p-6">
          <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-neutral-900">Algo salió mal</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Encontramos un error inesperado. Probá recargar la página; si el problema sigue, avisá al equipo
              técnico con este mensaje:
            </p>
            <p className="mt-3 rounded-lg bg-neutral-100 p-3 text-left text-xs text-neutral-700">
              {this.state.error.message}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
