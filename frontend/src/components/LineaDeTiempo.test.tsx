import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LineaDeTiempo from "./LineaDeTiempo";
import type { EventoHistorial } from "../types/api";

const eventos: EventoHistorial[] = [
  {
    id: "1",
    tramiteId: "t1",
    tipoEvento: "creacion",
    estadoAnterior: null,
    estadoNuevo: "pendiente",
    autorTipo: "ciudadano",
    autorIdentificador: "30123456",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    tramiteId: "t1",
    tipoEvento: "cambio_estado",
    estadoAnterior: "pendiente",
    estadoNuevo: "en_revision",
    autorTipo: "admin",
    autorIdentificador: "admin-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    tramiteId: "t1",
    tipoEvento: "comentario",
    estadoAnterior: null,
    estadoNuevo: null,
    autorTipo: "admin",
    autorIdentificador: "admin-1",
    detalle: { texto: "Falta un dato" },
    createdAt: new Date().toISOString(),
  },
];

describe("LineaDeTiempo", () => {
  it("describe cada tipo de evento", () => {
    render(<LineaDeTiempo eventos={eventos} />);

    expect(screen.getByText("Trámite creado")).toBeInTheDocument();
    expect(screen.getByText('Estado cambiado de "pendiente" a "en_revision"')).toBeInTheDocument();
    expect(screen.getByText("Comentario agregado")).toBeInTheDocument();
  });

  it("identifica el autor de cada evento", () => {
    render(<LineaDeTiempo eventos={eventos} />);
    expect(screen.getByText(/vecino/i)).toBeInTheDocument();
    expect(screen.getAllByText(/administrador/i)).toHaveLength(2);
  });
});
