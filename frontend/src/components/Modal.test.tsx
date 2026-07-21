import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Modal from "./Modal";

describe("Modal", () => {
  it("no renderiza nada si open es false", () => {
    render(
      <Modal open={false} onClose={vi.fn()} titulo="Título">
        <p>Contenido</p>
      </Modal>,
    );
    expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
  });

  it("renderiza el título y el contenido si open es true", () => {
    render(
      <Modal open onClose={vi.fn()} titulo="Nuevo tipo de trámite">
        <p>Contenido</p>
      </Modal>,
    );
    expect(screen.getByText("Nuevo tipo de trámite")).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("llama a onClose al hacer click en el botón de cerrar", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open onClose={onClose} titulo="Título">
        <p>Contenido</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("llama a onClose al hacer click en el fondo", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open onClose={onClose} titulo="Título">
        <p>Contenido</p>
      </Modal>,
    );

    await user.click(screen.getByTestId("modal-fondo"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
