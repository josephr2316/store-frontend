import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import CajaPage from "./CajaPage";

const mockStore = {
  products: [],
  balances: [],
  loading: { products: false, inventory: false },
  error: null,
  setError: () => {},
  fetchProducts: () => {},
  fetchBalances: () => {},
  adjustStock: () => Promise.resolve(),
  getAvailable: () => 0,
};

const mockStoreWithProducts = {
  ...mockStore,
  products: [
    {
      id: 100,
      name: "Camiseta Test",
      variants: [{ id: 200, size: "M", color: "Negro", price: 500 }],
    },
  ],
  balances: [{ variantId: 200, stock: 10, reserved: 0 }],
  getAvailable: () => 10,
};

describe("CajaPage", () => {
  it("renders Inventario and Venta Directa sections", () => {
    render(<CajaPage store={mockStore} toast={() => {}} />);
    expect(screen.getByText("Inventario")).toBeInTheDocument();
    expect(screen.getByText("Venta Directa (Caja)")).toBeInTheDocument();
  });
  it("renders Refrescar inventario button", () => {
    const { container } = render(<CajaPage store={mockStore} toast={() => {}} />);
    expect(within(container).getByRole("button", { name: /refrescar inventario/i })).toBeInTheDocument();
  });
  it("shows empty state when no products", () => {
    const { container } = render(<CajaPage store={mockStore} toast={() => {}} />);
    expect(within(container).getByText(/no hay productos en el inventario/i)).toBeInTheDocument();
  });
  it("Adjust modal has Razón dropdown and Notas field", () => {
    const { container } = render(<CajaPage store={mockStoreWithProducts} toast={() => {}} />);
    const ajustarBtn = within(container).getByRole("button", { name: /ajustar/i });
    fireEvent.click(ajustarBtn);
    expect(screen.getByText(/razón/i)).toBeInTheDocument();
    const select = container.querySelector("select");
    expect(select).toBeInTheDocument();
    expect(select.options.length).toBeGreaterThanOrEqual(5);
    expect(screen.getByPlaceholderText(/conteo físico|lote/i)).toBeInTheDocument();
  });
  it("Adjust modal has Aplicar Ajuste button that is enabled when quantity is set", () => {
    const { container } = render(<CajaPage store={mockStoreWithProducts} toast={() => {}} />);
    fireEvent.click(within(container).getByRole("button", { name: /ajustar/i }));
    const applyBtns = screen.getAllByRole("button", { name: /aplicar ajuste/i });
    expect(applyBtns.length).toBeGreaterThanOrEqual(1);
    const disabledCount = applyBtns.filter(b => b.disabled).length;
    expect(disabledCount).toBe(applyBtns.length);
    const quantityInputs = screen.getAllByPlaceholderText(/ej: -3 o \+10/i);
    quantityInputs.forEach(input => fireEvent.change(input, { target: { value: "2" } }));
    const applyBtnsAfter = screen.getAllByRole("button", { name: /aplicar ajuste/i });
    const enabledCount = applyBtnsAfter.filter(b => !b.disabled).length;
    expect(enabledCount).toBeGreaterThanOrEqual(1);
  });
});
