import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ContadorResultados from "./ContadorResultados";

describe("ContadorResultados", () => {
  it("muestra solo el total cuando no hay búsqueda activa", () => {
    render(<ContadorResultados total={355} totalSinFiltro={355} hayBusqueda={false} />);
    expect(screen.getByText("355 trámites")).toBeInTheDocument();
  });

  it("usa singular cuando el total es 1, sin búsqueda", () => {
    render(<ContadorResultados total={1} totalSinFiltro={1} hayBusqueda={false} />);
    expect(screen.getByText("1 trámite")).toBeInTheDocument();
  });

  it("aclara el total general cuando hay una búsqueda activa que filtra resultados", () => {
    render(<ContadorResultados total={2} totalSinFiltro={355} hayBusqueda={true} />);
    expect(screen.getByText("2 resultados de 355 en total")).toBeInTheDocument();
  });

  it("usa singular para \"resultado\" cuando la búsqueda deja un solo trámite", () => {
    render(<ContadorResultados total={1} totalSinFiltro={355} hayBusqueda={true} />);
    expect(screen.getByText("1 resultado de 355 en total")).toBeInTheDocument();
  });

  it("no repite el total si la búsqueda no filtra nada (coincide con todo)", () => {
    render(<ContadorResultados total={355} totalSinFiltro={355} hayBusqueda={true} />);
    expect(screen.getByText("355 resultados")).toBeInTheDocument();
  });
});
