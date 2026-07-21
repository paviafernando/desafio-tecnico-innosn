import type { CampoFormulario } from "../types/api";

interface Props {
  campo: CampoFormulario;
  valor: unknown;
  onCambiar: (valor: unknown) => void;
  onArchivoSeleccionado: (archivo: File | undefined) => void;
}

const CLASE_INPUT =
  "w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand";

const TIPO_INPUT_HTML: Partial<Record<CampoFormulario["tipo"], string>> = {
  numero: "number",
  fecha: "date",
  email: "email",
  telefono: "tel",
};

export default function CampoFormularioDinamico({ campo, valor, onCambiar, onArchivoSeleccionado }: Props) {
  const etiqueta = (
    <label htmlFor={campo.id} className="mb-1 block text-sm font-medium text-neutral-700">
      {campo.etiqueta}
      {campo.requerido && <span className="text-red-500"> *</span>}
    </label>
  );

  if (campo.tipo === "texto_largo") {
    return (
      <div>
        {etiqueta}
        <textarea
          id={campo.id}
          required={campo.requerido}
          rows={3}
          value={String(valor ?? "")}
          onChange={(evento) => onCambiar(evento.target.value)}
          className={CLASE_INPUT}
        />
      </div>
    );
  }

  if (campo.tipo === "select") {
    return (
      <div>
        {etiqueta}
        <select
          id={campo.id}
          required={campo.requerido}
          value={String(valor ?? "")}
          onChange={(evento) => onCambiar(evento.target.value)}
          className={CLASE_INPUT}
        >
          <option value="" disabled>
            Elegir…
          </option>
          {campo.opciones?.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (campo.tipo === "checkbox") {
    return (
      <label htmlFor={campo.id} className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          id={campo.id}
          type="checkbox"
          required={campo.requerido}
          checked={Boolean(valor)}
          onChange={(evento) => onCambiar(evento.target.checked)}
          className="h-4 w-4 rounded border-neutral-300"
        />
        {campo.etiqueta}
        {campo.requerido && <span className="text-red-500"> *</span>}
      </label>
    );
  }

  if (campo.tipo === "archivo") {
    const tiposPermitidos = campo.validacion?.tiposPermitidos;
    const aceptaImagen = !tiposPermitidos || tiposPermitidos.some((tipo) => tipo.startsWith("image/"));
    const archivoSeleccionado = valor instanceof File ? valor : undefined;

    return (
      <div>
        {etiqueta}
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={campo.id}
            className="cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Elegir archivo
          </label>
          <input
            id={campo.id}
            type="file"
            accept={tiposPermitidos?.join(",")}
            onChange={(evento) => onArchivoSeleccionado(evento.target.files?.[0])}
            className="sr-only"
          />

          {aceptaImagen && (
            <>
              <label
                htmlFor={`${campo.id}-camara`}
                className="cursor-pointer rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:border-brand"
              >
                Tomar foto
              </label>
              <input
                id={`${campo.id}-camara`}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(evento) => onArchivoSeleccionado(evento.target.files?.[0])}
                className="sr-only"
              />
            </>
          )}
        </div>
        {archivoSeleccionado && (
          <p className="mt-1.5 text-xs text-neutral-500">{archivoSeleccionado.name}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {etiqueta}
      <input
        id={campo.id}
        type={TIPO_INPUT_HTML[campo.tipo] ?? "text"}
        required={campo.requerido}
        value={String(valor ?? "")}
        onChange={(evento) => onCambiar(evento.target.value)}
        className={CLASE_INPUT}
      />
    </div>
  );
}
