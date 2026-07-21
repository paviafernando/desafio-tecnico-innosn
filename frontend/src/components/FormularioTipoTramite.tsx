import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../lib/apiClient";
import { useAuth } from "../hooks/useSesion";
import type { EsquemaFormulario, FlujoEstados, TipoCampoFormulario, TipoTramite } from "../types/api";

interface CampoBorrador {
  id: string;
  etiqueta: string;
  tipo: TipoCampoFormulario;
  requerido: boolean;
  opciones: string;
}

const CAMPO_VACIO: CampoBorrador = { id: "", etiqueta: "", tipo: "texto", requerido: true, opciones: "" };

const TIPOS_CAMPO: TipoCampoFormulario[] = [
  "texto",
  "texto_largo",
  "numero",
  "fecha",
  "email",
  "telefono",
  "select",
  "checkbox",
  "archivo",
];

const CLASE_INPUT =
  "w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

function camposDesdeTipo(tipo?: TipoTramite): CampoBorrador[] {
  if (!tipo || tipo.esquemaFormulario.campos.length === 0) return [{ ...CAMPO_VACIO }];
  return tipo.esquemaFormulario.campos.map((campo) => ({
    id: campo.id,
    etiqueta: campo.etiqueta,
    tipo: campo.tipo,
    requerido: campo.requerido,
    opciones: campo.opciones?.join(", ") ?? "",
  }));
}

interface Props {
  tipoExistente?: TipoTramite;
  onGuardado: () => void;
}

export default function FormularioTipoTramite({ tipoExistente, onGuardado }: Props) {
  const { sesion } = useAuth();
  const [nombre, setNombre] = useState(tipoExistente?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(tipoExistente?.descripcion ?? "");
  const [categoria, setCategoria] = useState(tipoExistente?.categoria ?? "");
  const [costo, setCosto] = useState(tipoExistente?.costo ?? "");
  const [modalidad, setModalidad] = useState(tipoExistente?.modalidad ?? "");
  const [campos, setCampos] = useState<CampoBorrador[]>(camposDesdeTipo(tipoExistente));
  const [estadosTexto, setEstadosTexto] = useState(tipoExistente?.flujoEstados.estados.join(", ") ?? "");
  const [estadoInicial, setEstadoInicial] = useState(tipoExistente?.flujoEstados.inicial ?? "");
  const [transiciones, setTransiciones] = useState<Record<string, string[]>>(
    tipoExistente?.flujoEstados.transiciones ?? {},
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const estados = estadosTexto
    .split(",")
    .map((estado) => estado.trim())
    .filter(Boolean);

  function actualizarCampo(indice: number, cambios: Partial<CampoBorrador>) {
    setCampos((prev) => prev.map((campo, i) => (i === indice ? { ...campo, ...cambios } : campo)));
  }

  function agregarCampo() {
    setCampos((prev) => [...prev, { ...CAMPO_VACIO }]);
  }

  function quitarCampo(indice: number) {
    setCampos((prev) => prev.filter((_, i) => i !== indice));
  }

  function alternarTransicion(origen: string, destino: string) {
    setTransiciones((prev) => {
      const actuales = prev[origen] ?? [];
      const nuevas = actuales.includes(destino)
        ? actuales.filter((estado) => estado !== destino)
        : [...actuales, destino];
      return { ...prev, [origen]: nuevas };
    });
  }

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const esquemaFormulario: EsquemaFormulario = {
        campos: campos
          .filter((campo) => campo.id.trim())
          .map((campo) => ({
            id: campo.id.trim(),
            etiqueta: campo.etiqueta.trim() || campo.id.trim(),
            tipo: campo.tipo,
            requerido: campo.requerido,
            ...(campo.tipo === "select"
              ? {
                  opciones: campo.opciones
                    .split(",")
                    .map((opcion) => opcion.trim())
                    .filter(Boolean),
                }
              : {}),
          })),
      };

      const flujoEstados: FlujoEstados = {
        inicial: estadoInicial || estados[0] || "",
        estados,
        transiciones,
      };

      const body = {
        nombre,
        descripcion,
        esquemaFormulario,
        flujoEstados,
        ...(categoria ? { categoria } : {}),
        ...(costo ? { costo } : {}),
        ...(modalidad ? { modalidad } : {}),
      };

      if (tipoExistente) {
        await apiFetch(`/api/admin/tipos-tramite/${tipoExistente.id}`, {
          method: "PATCH",
          token: sesion?.token,
          body,
        });
      } else {
        await apiFetch("/api/admin/tipos-tramite", {
          method: "POST",
          token: sesion?.token,
          body,
        });
      }

      onGuardado();
    } catch (error) {
      setError(error instanceof ApiError ? error.message : "No pudimos guardar el tipo de trámite.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-neutral-700">
            Nombre
          </label>
          <input
            id="nombre"
            required
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            className={CLASE_INPUT}
          />
        </div>
        <div>
          <label htmlFor="categoria" className="mb-1 block text-sm font-medium text-neutral-700">
            Categoría
          </label>
          <input
            id="categoria"
            value={categoria}
            onChange={(evento) => setCategoria(evento.target.value)}
            className={CLASE_INPUT}
          />
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-neutral-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          required
          rows={2}
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
          className={CLASE_INPUT}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="costo" className="mb-1 block text-sm font-medium text-neutral-700">
            Costo
          </label>
          <input
            id="costo"
            placeholder="Gratuito, $35.745, según ordenanza…"
            value={costo}
            onChange={(evento) => setCosto(evento.target.value)}
            className={CLASE_INPUT}
          />
        </div>
        <div>
          <label htmlFor="modalidad" className="mb-1 block text-sm font-medium text-neutral-700">
            Modalidad
          </label>
          <select
            id="modalidad"
            value={modalidad}
            onChange={(evento) => setModalidad(evento.target.value)}
            className={CLASE_INPUT}
          >
            <option value="">Elegir…</option>
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="mixta">Mixta</option>
          </select>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-700">Campos del formulario</h3>
          <button
            type="button"
            onClick={agregarCampo}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            + Agregar campo
          </button>
        </div>

        <div className="space-y-3">
          {campos.map((campo, indice) => (
            <div key={indice} className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-200 p-3 sm:grid-cols-6">
              <input
                placeholder="id del campo"
                value={campo.id}
                onChange={(evento) => actualizarCampo(indice, { id: evento.target.value })}
                className={`${CLASE_INPUT} sm:col-span-1`}
              />
              <input
                placeholder="Etiqueta visible"
                value={campo.etiqueta}
                onChange={(evento) => actualizarCampo(indice, { etiqueta: evento.target.value })}
                className={`${CLASE_INPUT} sm:col-span-2`}
              />
              <select
                value={campo.tipo}
                onChange={(evento) => actualizarCampo(indice, { tipo: evento.target.value as TipoCampoFormulario })}
                className={`${CLASE_INPUT} sm:col-span-1`}
              >
                {TIPOS_CAMPO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {campo.tipo === "select" ? (
                <input
                  placeholder="Opciones separadas por coma"
                  value={campo.opciones}
                  onChange={(evento) => actualizarCampo(indice, { opciones: evento.target.value })}
                  className={`${CLASE_INPUT} sm:col-span-1`}
                />
              ) : (
                <div className="sm:col-span-1" />
              )}
              <label className="flex items-center gap-1.5 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={campo.requerido}
                  onChange={(evento) => actualizarCampo(indice, { requerido: evento.target.checked })}
                />
                Requerido
              </label>
              <button type="button" onClick={() => quitarCampo(indice)} className="text-sm text-red-600 hover:underline">
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="estados" className="mb-1 block text-sm font-medium text-neutral-700">
          Estados (separados por coma)
        </label>
        <input
          id="estados"
          placeholder="pendiente, en_revision, aprobado, rechazado"
          value={estadosTexto}
          onChange={(evento) => setEstadosTexto(evento.target.value)}
          className={CLASE_INPUT}
        />
      </div>

      {estados.length > 0 && (
        <>
          <div>
            <label htmlFor="estado-inicial" className="mb-1 block text-sm font-medium text-neutral-700">
              Estado inicial
            </label>
            <select
              id="estado-inicial"
              value={estadoInicial}
              onChange={(evento) => setEstadoInicial(evento.target.value)}
              className={CLASE_INPUT}
            >
              <option value="">{estados[0]} (por defecto)</option>
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">Transiciones válidas</h3>
            <div className="space-y-2">
              {estados.map((origen) => (
                <div key={origen} className="text-sm">
                  <span className="font-medium text-neutral-700">{origen} →</span>{" "}
                  {estados
                    .filter((destino) => destino !== origen)
                    .map((destino) => (
                      <label key={destino} className="ml-2 inline-flex items-center gap-1 text-neutral-600">
                        <input
                          type="checkbox"
                          checked={(transiciones[origen] ?? []).includes(destino)}
                          onChange={() => alternarTransicion(origen, destino)}
                        />
                        {destino}
                      </label>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Guardando…" : tipoExistente ? "Guardar cambios" : "Crear tipo de trámite"}
      </button>
    </form>
  );
}
