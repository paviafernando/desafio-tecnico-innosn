export type TipoCampoFormulario =
  | "texto"
  | "texto_largo"
  | "numero"
  | "fecha"
  | "email"
  | "telefono"
  | "select"
  | "checkbox"
  | "archivo";

export interface ValidacionCampo {
  patron?: string;
  mensaje?: string;
  tiposPermitidos?: string[];
  tamanioMaximoMB?: number;
}

export interface CampoFormulario {
  id: string;
  etiqueta: string;
  tipo: TipoCampoFormulario;
  requerido: boolean;
  opciones?: string[];
  validacion?: ValidacionCampo;
}

export interface EsquemaFormulario {
  campos: CampoFormulario[];
}

function patronValido(patron: string): boolean {
  try {
    new RegExp(patron);
    return true;
  } catch {
    return false;
  }
}

export function validarEsquemaFormulario(esquema: EsquemaFormulario): string[] {
  const errores: string[] = [];

  if (esquema.campos.length === 0) {
    errores.push("El formulario debe tener al menos un campo");
  }

  const idsVistos = new Set<string>();
  for (const campo of esquema.campos) {
    if (idsVistos.has(campo.id)) {
      errores.push(`El id de campo "${campo.id}" está duplicado`);
    }
    idsVistos.add(campo.id);

    if (campo.tipo === "select" && (!campo.opciones || campo.opciones.length === 0)) {
      errores.push(`El campo "${campo.id}" es de tipo select y necesita al menos una opción`);
    }

    if (campo.validacion?.patron && !patronValido(campo.validacion.patron)) {
      errores.push(`El campo "${campo.id}" tiene un patrón de validación inválido`);
    }
  }

  return errores;
}
