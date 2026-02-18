import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

// Mock useStore to avoid API and auth
vi.mock("./hooks/useStore", () => ({
  useStore: () => ({
    products: [],
    orders: [],
    balances: [],
    loading: {},
    error: null,
    setError: () => {},
    fetchProducts: () => {},
    fetchBalances: () => {},
    fetchOrders: () => {},
    getAvailable: () => 0,
    createOrder: () => Promise.resolve({}),
    transitionOrder: () => Promise.resolve(),
    updateOrderAddress: () => Promise.resolve(),
    adjustStock: () => Promise.resolve(),
  }),
}));

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
  it("shows login when not authenticated", () => {
    render(<App />);
    const inputs = screen.getAllByPlaceholderText(/nombre de usuario/i);
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });
});
