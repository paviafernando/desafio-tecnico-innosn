import { describe, expect, it } from "vitest";
import { calcularCaminoFeliz } from "./caminoFeliz";
import type { FlujoEstados } from "../types/api";

describe("calcularCaminoFeliz", () => {
  it("arma el camino simple pendiente → en_revision → aprobado, evitando el rechazo", () => {
    const flujo: FlujoEstados = {
      inicial: "pendiente",
      estados: ["pendiente", "en_revision", "aprobado", "rechazado"],
      transiciones: {
        pendiente: ["en_revision"],
        en_revision: ["aprobado", "rechazado"],
        aprobado: [],
        rechazado: [],
      },
    };

    expect(calcularCaminoFeliz(flujo)).toEqual(["pendiente", "en_revision", "aprobado"]);
  });

  it("evita un estado de corrección que vuelve hacia atrás (loop)", () => {
    const flujo: FlujoEstados = {
      inicial: "pendiente",
      estados: ["pendiente", "en_revision", "documentacion_requerida", "aprobado", "rechazado"],
      transiciones: {
        pendiente: ["en_revision"],
        en_revision: ["documentacion_requerida", "aprobado", "rechazado"],
        documentacion_requerida: ["en_revision"],
        aprobado: [],
        rechazado: [],
      },
    };

    expect(calcularCaminoFeliz(flujo)).toEqual(["pendiente", "en_revision", "aprobado"]);
  });

  it("incluye un paso intermedio que no vuelve atrás (no es un loop de corrección)", () => {
    const flujo: FlujoEstados = {
      inicial: "pendiente",
      estados: ["pendiente", "en_revision", "intervencion_seguridad", "aprobado", "rechazado"],
      transiciones: {
        pendiente: ["en_revision"],
        en_revision: ["intervencion_seguridad", "aprobado", "rechazado"],
        intervencion_seguridad: ["aprobado", "rechazado"],
        aprobado: [],
        rechazado: [],
      },
    };

    expect(calcularCaminoFeliz(flujo)).toEqual(["pendiente", "en_revision", "intervencion_seguridad", "aprobado"]);
  });

  it("devuelve solo el estado inicial si no hay transiciones", () => {
    const flujo: FlujoEstados = { inicial: "pendiente", estados: ["pendiente"], transiciones: {} };
    expect(calcularCaminoFeliz(flujo)).toEqual(["pendiente"]);
  });
});
