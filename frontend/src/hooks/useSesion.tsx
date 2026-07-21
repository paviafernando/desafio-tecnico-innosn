import { createContext, useContext, useState, type ReactNode } from "react";
import { borrarSesion, guardarSesion, leerSesion, type Sesion } from "../lib/sesion";

interface AuthContextValue {
  sesion: Sesion | null;
  iniciarSesion: (sesion: Sesion) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesion());

  const iniciarSesion = (nuevaSesion: Sesion) => {
    guardarSesion(nuevaSesion);
    setSesion(nuevaSesion);
  };

  const cerrarSesion = () => {
    borrarSesion();
    setSesion(null);
  };

  return (
    <AuthContext.Provider value={{ sesion, iniciarSesion, cerrarSesion }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return contexto;
}
