import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CreateOrderModal from "./CreateOrderModal";

const mockStore = {
  products: [{ id: 1, name: "P1", variants: [{ id: 10, sku: "V1" }] }],
  getAvailable: () => 5,
  createOrder: vi.fn(() => Promise.resolve({ id: 1 })),
};

describe("CreateOrderModal", () => {
  it("renders modal with title and form sections", () => {
    render(<CreateOrderModal store={mockStore} onClose={() => {}} toast={() => {}} onCreated={() => {}} />);
    expect(screen.getByText("Nuevo Pedido")).toBeInTheDocument();
    expect(screen.getByText("Datos del cliente")).toBeInTheDocument();
    expect(screen.getByText("Agregar artículo")).toBeInTheDocument();
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Teléfono")).toBeInTheDocument();
  });
  it("renders Producto and Variante selects", () => {
    render(<CreateOrderModal store={mockStore} onClose={() => {}} toast={() => {}} onCreated={() => {}} />);
    expect(screen.getAllByText("Producto")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Variante")[0]).toBeInTheDocument();
  });
  it("has Crear Pedido button", () => {
    render(<CreateOrderModal store={mockStore} onClose={() => {}} toast={() => {}} onCreated={() => {}} />);
    expect(screen.getAllByRole("button", { name: /crear pedido/i })[0]).toBeInTheDocument();
  });
});
