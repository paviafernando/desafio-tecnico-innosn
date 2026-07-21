import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PantallaCentrada from "../../components/PantallaCentrada";
import { apiFetch, ApiError } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useSesion";

interface RespuestaLogin {
  token: string;
  admin: { id: string; email: string; nombre: string };
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const respuesta = await apiFetch<RespuestaLogin>("/api/admin/auth/login", {
        method: "POST",
        body: { email, password },
      });
      iniciarSesion({
        token: respuesta.token,
        rol: "admin",
        nombre: respuesta.admin.nombre,
        email: respuesta.admin.email,
      });
      navigate("/admin/tramites");
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "No pudimos iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <PantallaCentrada titulo="Acceso administrador" subtitulo="Usuario y contraseña">
      <form onSubmit={manejarSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 font-medium text-white transition-opacity disabled:opacity-50"
        >
          {enviando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </PantallaCentrada>
  );
}
