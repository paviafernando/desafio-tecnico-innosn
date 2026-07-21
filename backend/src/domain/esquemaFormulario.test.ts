import { validarEsquemaFormulario, type EsquemaFormulario } from "./esquemaFormulario";

function campo(id: string, tipo: EsquemaFormulario["campos"][number]["tipo"] = "texto") {
  return { id, etiqueta: id, tipo, requerido: true };
}

function esquemaConNCampos(n: number, incluirArchivo = true): EsquemaFormulario {
  const campos = Array.from({ length: n }, (_, i) => campo(`campo_${i}`));
  if (incluirArchivo && campos.length > 0) {
    campos[campos.length - 1] = campo(`campo_${n - 1}`, "archivo");
  }
  return { campos };
}

describe("validarEsquemaFormulario", () => {
  it("acepta un esquema con 8 campos y al menos uno de tipo archivo", () => {
    const errores = validarEsquemaFormulario(esquemaConNCampos(8));
    expect(errores).toEqual([]);
  });

  it("rechaza un esquema con menos de 8 campos", () => {
    const errores = validarEsquemaFormulario(esquemaConNCampos(7));
    expect(errores).toContain("El formulario debe tener al menos 8 campos");
  });

  it("rechaza un esquema sin ningún campo de tipo archivo", () => {
    const errores = validarEsquemaFormulario(esquemaConNCampos(8, false));
    expect(errores).toContain("El formulario debe tener al menos un campo de tipo archivo");
  });

  it("rechaza ids de campo duplicados", () => {
    const esquema: EsquemaFormulario = {
      campos: [...esquemaConNCampos(8).campos, campo("campo_0")],
    };
    const errores = validarEsquemaFormulario(esquema);
    expect(errores).toContain('El id de campo "campo_0" está duplicado');
  });

  it("rechaza un campo de tipo select sin opciones", () => {
    const esquema = esquemaConNCampos(8);
    esquema.campos[0] = { ...campo("club", "select") };
    const errores = validarEsquemaFormulario(esquema);
    expect(errores).toContain('El campo "club" es de tipo select y necesita al menos una opción');
  });

  it("rechaza un patrón de validación que no es una expresión regular válida", () => {
    const esquema = esquemaConNCampos(8);
    esquema.campos[0] = {
      ...campo("dni"),
      validacion: { patron: "([a-z", mensaje: "DNI inválido" },
    };
    const errores = validarEsquemaFormulario(esquema);
    expect(errores).toContain('El campo "dni" tiene un patrón de validación inválido');
  });

  it("acumula todos los errores encontrados, no solo el primero", () => {
    const errores = validarEsquemaFormulario(esquemaConNCampos(3, false));
    expect(errores.length).toBeGreaterThanOrEqual(2);
  });

  it("acepta un campo de tipo checkbox (declaración jurada)", () => {
    const esquema = esquemaConNCampos(8);
    esquema.campos[0] = campo("declaracion_jurada", "checkbox");
    const errores = validarEsquemaFormulario(esquema);
    expect(errores).toEqual([]);
  });
});
