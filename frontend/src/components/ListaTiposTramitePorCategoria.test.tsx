import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ListaTiposTramitePorCategoria from "./ListaTiposTramitePorCategoria";
import type { TipoTramite } from "../types/api";

function tipo(sobrescribir: Partial<TipoTramite>): TipoTramite {
  return {
    id: "id",
    nombre: "Nombre",
    descripcion: "...",
    esquemaFormulario: { campos: [] },
    flujoEstados: { inicial: "pendiente", estados: ["pendiente"], transiciones: {} },
    version: 1,
    estado: "publicado",
    tipoTramiteOrigenId: null,
    publicadoEn: null,
    publicadoPor: null,
    categoria: null,
    requisitos: [],
    pasos: [],
    archivosReferencia: [],
    costo: null,
    modalidad: null,
    contacto: {},
    ...sobrescribir,
  };
}

const tipos: TipoTramite[] = [
  tipo({ id: "1", nombre: "Inscripción a becas deportivas", categoria: "Deportes" }),
  tipo({ id: "2", nombre: "Certificado de vivienda única", categoria: "Catastro" }),
  tipo({ id: "3", nombre: "Permiso para eventos culturales", categoria: "Permisos y Solicitudes" }),
  tipo({ id: "4", nombre: "Trámite sin categoría", categoria: null }),
];

describe("ListaTiposTramitePorCategoria", () => {
  it("agrupa los tipos por categoría, con encabezado por grupo", () => {
    render(<ListaTiposTramitePorCategoria tipos={tipos} renderItem={(t) => <span>{t.nombre}</span>} />);

    expect(screen.getByText("Deportes")).toBeInTheDocument();
    expect(screen.getByText("Catastro")).toBeInTheDocument();
    expect(screen.getByText("Inscripción a becas deportivas")).toBeInTheDocument();
  });

  it("agrupa los tipos sin categoría bajo 'Otros'", () => {
    render(<ListaTiposTramitePorCategoria tipos={tipos} renderItem={(t) => <span>{t.nombre}</span>} />);
    expect(screen.getByText("Otros")).toBeInTheDocument();
    expect(screen.getByText("Trámite sin categoría")).toBeInTheDocument();
  });

  it("filtra por nombre a medida que se escribe en el buscador", async () => {
    const user = userEvent.setup();
    render(<ListaTiposTramitePorCategoria tipos={tipos} renderItem={(t) => <span>{t.nombre}</span>} />);

    await user.type(screen.getByPlaceholderText(/buscar/i), "becas");

    expect(screen.getByText("Inscripción a becas deportivas")).toBeInTheDocument();
    expect(screen.queryByText("Certificado de vivienda única")).not.toBeInTheDocument();
    expect(screen.queryByText("Catastro")).not.toBeInTheDocument();
  });

  it("filtra por categoría", async () => {
    const user = userEvent.setup();
    render(<ListaTiposTramitePorCategoria tipos={tipos} renderItem={(t) => <span>{t.nombre}</span>} />);

    await user.type(screen.getByPlaceholderText(/buscar/i), "deportes");

    expect(screen.getByText("Inscripción a becas deportivas")).toBeInTheDocument();
    expect(screen.queryByText("Certificado de vivienda única")).not.toBeInTheDocument();
  });

  it("muestra un mensaje si la búsqueda no encuentra resultados", async () => {
    const user = userEvent.setup();
    render(<ListaTiposTramitePorCategoria tipos={tipos} renderItem={(t) => <span>{t.nombre}</span>} />);

    await user.type(screen.getByPlaceholderText(/buscar/i), "no existe ningún trámite así");

    expect(screen.getByText(/no encontramos/i)).toBeInTheDocument();
  });
});
