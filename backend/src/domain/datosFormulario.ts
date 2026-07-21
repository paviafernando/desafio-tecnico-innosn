import type { EsquemaFormulario } from "./esquemaFormulario";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function estaVacio(valor: unknown): boolean {
  return valor === undefined || valor === null || valor === "";
}

export function validarDatosFormulario(
  esquema: EsquemaFormulario,
  datos: Record<string, unknown>,
): string[] {
  const errores: string[] = [];

  for (const campo of esquema.campos) {
    const valor = datos[campo.id];
    const faltante = campo.tipo === "checkbox" ? valor !== true : estaVacio(valor);

    if (campo.requerido && faltante) {
      errores.push(`El campo "${campo.id}" es obligatorio`);
      continue;
    }

    if (estaVacio(valor)) {
      continue;
    }

    if (campo.tipo === "select" && campo.opciones && !campo.opciones.includes(String(valor))) {
      errores.push(`El campo "${campo.id}" debe ser uno de: ${campo.opciones.join(", ")}`);
    }

    if (campo.tipo === "email" && typeof valor === "string" && !REGEX_EMAIL.test(valor)) {
      errores.push(`El campo "${campo.id}" debe ser un email válido`);
    }

    if (campo.validacion?.patron && typeof valor === "string") {
      if (!new RegExp(campo.validacion.patron).test(valor)) {
        errores.push(campo.validacion.mensaje ?? `El campo "${campo.id}" no cumple el formato esperado`);
      }
    }
  }

  return errores;
}
