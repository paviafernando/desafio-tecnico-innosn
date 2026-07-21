import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useSesion";

interface Props {
  rol: "admin" | "ciudadano";
  children: ReactNode;
}

export function RequireAuth({ rol, children }: Props) {
  const { sesion } = useAuth();

  if (!sesion || sesion.rol !== rol) {
    const destino = rol === "admin" ? "/admin" : "/";
    return <Navigate to={destino} replace />;
  }

  return <>{children}</>;
}
