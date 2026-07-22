import type { EsquemaFormulario } from "./esquemaFormulario";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Números, espacios, +, guiones y paréntesis; al menos 6 dígitos reales (evita
// que "no tengo telefono" o un texto cualquiera pase como número de contacto).
const REGEX_TELEFONO = /^(?=(?:.*\d){6,})[\d\s()+-]{6,20}$/;

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

    if (campo.tipo === "telefono" && typeof valor === "string" && !REGEX_TELEFONO.test(valor)) {
      errores.push(`El campo "${campo.id}" debe ser un teléfono válido`);
    }

    if (campo.validacion?.patron && typeof valor === "string") {
      if (!new RegExp(campo.validacion.patron).test(valor)) {
        errores.push(campo.validacion.mensaje ?? `El campo "${campo.id}" no cumple el formato esperado`);
      }
    }
  }

  return errores;
}
