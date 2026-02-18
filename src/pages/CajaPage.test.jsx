import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
});
