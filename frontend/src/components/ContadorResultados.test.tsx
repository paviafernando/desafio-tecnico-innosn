import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ContadorResultados from "./ContadorResultados";

describe("ContadorResultados", () => {
  it("muestra cuántos se están mostrando de cuántos hay en total, sin búsqueda", () => {
    render(<ContadorResultados mostrados={20} total={355} totalSinFiltro={355} hayBusqueda={false} />);
    expect(screen.getByText("Mostrando 20 de 355 trámites")).toBeInTheDocument();
  });

  it("aclara el total general cuando hay una búsqueda activa que filtra resultados", () => {
    render(<ContadorResultados mostrados={2} total={2} totalSinFiltro={355} hayBusqueda={true} />);
    expect(screen.getByText("Mostrando 2 de 2 trámites (355 en total)")).toBeInTheDocument();
  });

  it("usa singular cuando el total es 1", () => {
    render(<ContadorResultados mostrados={1} total={1} totalSinFiltro={1} hayBusqueda={false} />);
    expect(screen.getByText("Mostrando 1 de 1 trámite")).toBeInTheDocument();
  });
});
