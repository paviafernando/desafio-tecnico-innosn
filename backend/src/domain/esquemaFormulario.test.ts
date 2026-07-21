import { validarEsquemaFormulario, type EsquemaFormulario } from "./esquemaFormulario";

function campo(id: string, tipo: EsquemaFormulario["campos"][number]["tipo"] = "texto") {
  return { id, etiqueta: id, tipo, requerido: true };
}

describe("validarEsquemaFormulario", () => {
  it("acepta un esquema con un solo campo (no hay un mínimo de campos ni de tipo archivo por regla general)", () => {
    const errores = validarEsquemaFormulario({ campos: [campo("nombre")] });
    expect(errores).toEqual([]);
  });

  it("rechaza un esquema sin ningún campo", () => {
    const errores = validarEsquemaFormulario({ campos: [] });
    expect(errores).toContain("El formulario debe tener al menos un campo");
  });

  it("rechaza ids de campo duplicados", () => {
    const esquema: EsquemaFormulario = {
      campos: [campo("dni"), campo("dni")],
    };
    const errores = validarEsquemaFormulario(esquema);
    expect(errores).toContain('El id de campo "dni" está duplicado');
  });

  it("rechaza un campo de tipo select sin opciones", () => {
    const esquema: EsquemaFormulario = { campos: [campo("club", "select")] };
    const errores = validarEsquemaFormulario(esquema);
    expect(errores).toContain('El campo "club" es de tipo select y necesita al menos una opción');
  });

  it("rechaza un patrón de validación que no es una expresión regular válida", () => {
    const esquema: EsquemaFormulario = {
      campos: [{ ...campo("dni"), validacion: { patron: "([a-z", mensaje: "DNI inválido" } }],
    };
    const errores = validarEsquemaFormulario(esquema);
    expect(errores).toContain('El campo "dni" tiene un patrón de validación inválido');
  });

  it("acumula todos los errores encontrados, no solo el primero", () => {
    const esquema: EsquemaFormulario = {
      campos: [campo("dni"), campo("dni"), campo("club", "select")],
    };
    const errores = validarEsquemaFormulario(esquema);
    expect(errores.length).toBeGreaterThanOrEqual(2);
  });

  it("acepta un campo de tipo checkbox (declaración jurada)", () => {
    const errores = validarEsquemaFormulario({ campos: [campo("declaracion_jurada", "checkbox")] });
    expect(errores).toEqual([]);
  });

  it("acepta un campo de tipo archivo sin exigir que haya otros campos", () => {
    const errores = validarEsquemaFormulario({ campos: [campo("comprobante", "archivo")] });
    expect(errores).toEqual([]);
  });
});
