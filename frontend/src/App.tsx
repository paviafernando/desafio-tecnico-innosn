import { Navigate, Route, Routes } from "react-router-dom";
import SelectorIdentidad from "./pages/vecino/SelectorIdentidad";
import MisTramites from "./pages/vecino/MisTramites";
import NuevoTramite from "./pages/vecino/NuevoTramite";
import DetalleTramite from "./pages/vecino/DetalleTramite";
import AdminLogin from "./pages/admin/AdminLogin";
import BandejaEntrada from "./pages/admin/BandejaEntrada";
import DetalleTramiteAdmin from "./pages/admin/DetalleTramiteAdmin";
import TiposTramite from "./pages/admin/TiposTramite";
import { RequireAuth } from "./components/RequireAuth";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SelectorIdentidad />} />
      <Route
        path="/mis-tramites"
        element={
          <RequireAuth rol="ciudadano">
            <MisTramites />
          </RequireAuth>
        }
      />
      <Route
        path="/mis-tramites/nuevo"
        element={
          <RequireAuth rol="ciudadano">
            <NuevoTramite />
          </RequireAuth>
        }
      />
      <Route
        path="/mis-tramites/:id"
        element={
          <RequireAuth rol="ciudadano">
            <DetalleTramite />
          </RequireAuth>
        }
      />

      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/tramites"
        element={
          <RequireAuth rol="admin">
            <BandejaEntrada />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/tramites/:id"
        element={
          <RequireAuth rol="admin">
            <DetalleTramiteAdmin />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/tipos-tramite"
        element={
          <RequireAuth rol="admin">
            <TiposTramite />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
