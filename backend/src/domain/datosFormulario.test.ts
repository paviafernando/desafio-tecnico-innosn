import { validarDatosFormulario } from "./datosFormulario";
import type { EsquemaFormulario } from "./esquemaFormulario";

const esquema: EsquemaFormulario = {
  campos: [
    { id: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
    {
      id: "dni",
      etiqueta: "DNI",
      tipo: "texto",
      requerido: true,
      validacion: { patron: "^[0-9]{7,8}$", mensaje: "DNI inválido" },
    },
    { id: "email", etiqueta: "Email", tipo: "email", requerido: true },
    { id: "telefono", etiqueta: "Teléfono", tipo: "telefono", requerido: false },
    {
      id: "club",
      etiqueta: "Club",
      tipo: "select",
      requerido: true,
      opciones: ["Fútbol", "Básquet"],
    },
    { id: "declaracion", etiqueta: "Declaración jurada", tipo: "checkbox", requerido: true },
    { id: "comentario", etiqueta: "Comentario", tipo: "texto_largo", requerido: false },
    { id: "comprobante", etiqueta: "Comprobante", tipo: "archivo", requerido: true },
  ],
};

function datosValidos(): Record<string, unknown> {
  return {
    nombre: "Juana Pérez",
    dni: "30123456",
    email: "juana@example.com",
    club: "Fútbol",
    declaracion: true,
    comprobante: "storage-key-123",
  };
}

describe("validarDatosFormulario", () => {
  it("acepta datos completos y válidos", () => {
    expect(validarDatosFormulario(esquema, datosValidos())).toEqual([]);
  });

  it("acepta que un campo no requerido venga vacío", () => {
    const datos = { ...datosValidos() };
    delete datos.comentario;
    expect(validarDatosFormulario(esquema, datos)).toEqual([]);
  });

  it("rechaza un campo requerido ausente", () => {
    const datos = { ...datosValidos() };
    delete (datos as Record<string, unknown>).nombre;
    expect(validarDatosFormulario(esquema, datos)).toContain('El campo "nombre" es obligatorio');
  });

  it("rechaza un checkbox requerido en false", () => {
    const datos = { ...datosValidos(), declaracion: false };
    expect(validarDatosFormulario(esquema, datos)).toContain(
      'El campo "declaracion" es obligatorio',
    );
  });

  it("rechaza un valor de select que no está entre las opciones", () => {
    const datos = { ...datosValidos(), club: "Rugby" };
    expect(validarDatosFormulario(esquema, datos)).toContain(
      "El campo \"club\" debe ser uno de: Fútbol, Básquet",
    );
  });

  it("rechaza un email con formato inválido", () => {
    const datos = { ...datosValidos(), email: "no-es-un-email" };
    expect(validarDatosFormulario(esquema, datos)).toContain(
      'El campo "email" debe ser un email válido',
    );
  });

  it("acepta un teléfono con números, espacios, guiones y paréntesis", () => {
    const datos = { ...datosValidos(), telefono: "+54 (336) 400-0000" };
    expect(validarDatosFormulario(esquema, datos)).toEqual([]);
  });

  it("rechaza un teléfono con texto en vez de un número", () => {
    const datos = { ...datosValidos(), telefono: "no tengo telefono" };
    expect(validarDatosFormulario(esquema, datos)).toContain(
      'El campo "telefono" debe ser un teléfono válido',
    );
  });

  it("rechaza un teléfono demasiado corto para ser real", () => {
    const datos = { ...datosValidos(), telefono: "123" };
    expect(validarDatosFormulario(esquema, datos)).toContain(
      'El campo "telefono" debe ser un teléfono válido',
    );
  });

  it("rechaza un valor que no cumple el patrón de validación del campo", () => {
    const datos = { ...datosValidos(), dni: "abc" };
    expect(validarDatosFormulario(esquema, datos)).toContain("DNI inválido");
  });

  it("acumula todos los errores encontrados", () => {
    const errores = validarDatosFormulario(esquema, { dni: "abc" });
    expect(errores.length).toBeGreaterThan(1);
  });
});
