import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResumenDatosFormulario from "./ResumenDatosFormulario";
import type { EsquemaFormulario } from "../types/api";

const esquema: EsquemaFormulario = {
  campos: [
    { id: "nombre_menor", etiqueta: "Nombre y apellido del menor", tipo: "texto", requerido: true },
    { id: "declaracion_jurada", etiqueta: "Declaración jurada", tipo: "checkbox", requerido: true },
    { id: "ficha_medica", etiqueta: "Ficha médica", tipo: "archivo", requerido: true },
  ],
};

describe("ResumenDatosFormulario", () => {
  it("muestra la etiqueta del campo, no la clave cruda", () => {
    render(
      <ResumenDatosFormulario
        esquema={esquema}
        datos={{ nombre_menor: "Tomás Pérez", declaracion_jurada: true, ficha_medica: "clave-storage" }}
      />,
    );

    expect(screen.getByText("Nombre y apellido del menor")).toBeInTheDocument();
    expect(screen.getByText("Tomás Pérez")).toBeInTheDocument();
    expect(screen.queryByText("nombre_menor")).not.toBeInTheDocument();
  });

  it("muestra Sí/No para campos checkbox", () => {
    render(<ResumenDatosFormulario esquema={esquema} datos={{ declaracion_jurada: true }} />);
    expect(screen.getByText("Sí")).toBeInTheDocument();
  });

  it("muestra un texto amigable para campos de archivo, no la clave de almacenamiento", () => {
    render(<ResumenDatosFormulario esquema={esquema} datos={{ ficha_medica: "seed/ficha-medica.pdf" }} />);
    expect(screen.getByText("Archivo adjunto")).toBeInTheDocument();
    expect(screen.queryByText("seed/ficha-medica.pdf")).not.toBeInTheDocument();
  });

  it("si no hay esquema disponible, usa las claves crudas como respaldo", () => {
    render(<ResumenDatosFormulario esquema={null} datos={{ campo_x: "valor" }} />);
    expect(screen.getByText("campo_x")).toBeInTheDocument();
    expect(screen.getByText("valor")).toBeInTheDocument();
  });

  it("si el esquema no tiene campos definidos, también usa las claves crudas como respaldo", () => {
    render(<ResumenDatosFormulario esquema={{ campos: [] }} datos={{ campo_x: "valor" }} />);
    expect(screen.getByText("campo_x")).toBeInTheDocument();
    expect(screen.getByText("valor")).toBeInTheDocument();
  });
});
