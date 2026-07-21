import {
  aplicarTransicion,
  TransicionInvalidaError,
  validarFlujoEstados,
  type FlujoEstados,
} from "./flujoEstados";

const flujoDeEjemplo: FlujoEstados = {
  inicial: "pendiente",
  estados: ["pendiente", "en_revision", "aprobado", "rechazado"],
  transiciones: {
    pendiente: ["en_revision"],
    en_revision: ["aprobado", "rechazado"],
    aprobado: [],
    rechazado: [],
  },
};

describe("aplicarTransicion", () => {
  it("permite una transición definida en el flujo", () => {
    const resultado = aplicarTransicion(flujoDeEjemplo, "pendiente", "en_revision");
    expect(resultado).toBe("en_revision");
  });

  it("rechaza una transición no definida entre dos estados válidos", () => {
    expect(() => aplicarTransicion(flujoDeEjemplo, "pendiente", "aprobado")).toThrow(
      TransicionInvalidaError,
    );
  });

  it("rechaza una transición hacia un estado final (sin transiciones salientes)", () => {
    expect(() => aplicarTransicion(flujoDeEjemplo, "aprobado", "en_revision")).toThrow(
      TransicionInvalidaError,
    );
  });

  it("rechaza un estado actual que no existe en el flujo", () => {
    expect(() => aplicarTransicion(flujoDeEjemplo, "inexistente", "en_revision")).toThrow(
      TransicionInvalidaError,
    );
  });

  it("rechaza un estado destino que no existe en el flujo", () => {
    expect(() => aplicarTransicion(flujoDeEjemplo, "pendiente", "inexistente")).toThrow(
      TransicionInvalidaError,
    );
  });

  it("el mensaje de error identifica los estados involucrados", () => {
    expect(() => aplicarTransicion(flujoDeEjemplo, "pendiente", "aprobado")).toThrow(
      "pendiente",
    );
  });
});

describe("validarFlujoEstados", () => {
  it("acepta un flujo consistente", () => {
    expect(validarFlujoEstados(flujoDeEjemplo)).toEqual([]);
  });

  it("rechaza un flujo sin estados", () => {
    const errores = validarFlujoEstados({ inicial: "pendiente", estados: [], transiciones: {} });
    expect(errores).toContain("El flujo debe tener al menos un estado");
  });

  it("rechaza un estado inicial que no está en la lista de estados", () => {
    const errores = validarFlujoEstados({
      ...flujoDeEjemplo,
      inicial: "no_existe",
    });
    expect(errores).toContain('El estado inicial "no_existe" no está en la lista de estados');
  });

  it("rechaza una transición que sale de un estado inexistente", () => {
    const errores = validarFlujoEstados({
      ...flujoDeEjemplo,
      transiciones: { ...flujoDeEjemplo.transiciones, fantasma: ["pendiente"] },
    });
    expect(errores).toContain('El estado "fantasma" en transiciones no está en la lista de estados');
  });

  it("rechaza una transición que apunta a un estado inexistente", () => {
    const errores = validarFlujoEstados({
      ...flujoDeEjemplo,
      transiciones: { ...flujoDeEjemplo.transiciones, pendiente: ["fantasma"] },
    });
    expect(errores).toContain(
      'La transición desde "pendiente" hacia "fantasma" apunta a un estado que no existe',
    );
  });
});
