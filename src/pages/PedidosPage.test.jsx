import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import PedidosPage from "./PedidosPage";

const mockStore = {
  orders: [],
  loading: { orders: false },
  error: null,
  setError: () => {},
  fetchOrders: () => Promise.resolve({ content: [], totalPages: 0, number: 0 }),
  fetchOrderById: () => Promise.resolve(null),
  fetchPendingCount: () => Promise.resolve(),
  createOrder: () => Promise.resolve({}),
  transitionOrder: () => Promise.resolve(),
  updateOrderAddress: () => Promise.resolve(),
};

describe("PedidosPage", () => {
  it("renders Pedidos and Nuevo button", () => {
    render(
      <PedidosPage
        store={mockStore}
        toast={() => {}}
        fetchOrders={() => {}}
      />
    );
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nuevo/i })).toBeInTheDocument();
  });
  it("shows empty state when no order selected", () => {
    const { container } = render(
      <PedidosPage
        store={mockStore}
        toast={() => {}}
        fetchOrders={() => {}}
      />
    );
    expect(within(container).getByText("Selecciona un pedido de la lista para ver el detalle")).toBeInTheDocument();
  });
});
