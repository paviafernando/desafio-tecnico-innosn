import type { CampoFormulario, EsquemaFormulario } from "../types/api";

interface Props {
  esquema: EsquemaFormulario | null | undefined;
  datos: Record<string, unknown>;
}

function formatearValor(campo: CampoFormulario | undefined, valor: unknown): string {
  if (valor === undefined || valor === null || valor === "") return "—";
  if (campo?.tipo === "checkbox") return valor ? "Sí" : "No";
  if (campo?.tipo === "archivo") return "Archivo adjunto";
  return String(valor);
}

export default function ResumenDatosFormulario({ esquema, datos }: Props) {
  const campos: CampoFormulario[] = esquema?.campos.length
    ? esquema.campos
    : Object.keys(datos).map((clave) => ({ id: clave, etiqueta: clave, tipo: "texto", requerido: false }));

  return (
    <dl className="space-y-2 text-sm">
      {campos.map((campo) => (
        <div key={campo.id} className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
          <dt className="text-neutral-500">{campo.etiqueta}</dt>
          <dd className="text-right text-neutral-900">{formatearValor(campo, datos[campo.id])}</dd>
        </div>
      ))}
    </dl>
  );
}
