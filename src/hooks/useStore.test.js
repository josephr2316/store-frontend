import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStore } from "./useStore";
import * as api from "../api/client";

vi.mock("../api/client", () => ({
  productsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  variantsApi: { byProduct: vi.fn(() => Promise.resolve([])) },
  ordersApi: {
    list: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    transition: vi.fn(),
    updateAddress: vi.fn(),
    history: vi.fn(),
  },
  inventoryApi: { balances: vi.fn(() => Promise.resolve([])), adjust: vi.fn() },
}));

describe("useStore", () => {
  beforeEach(() => {
    vi.mocked(api.productsApi.list).mockResolvedValue([]);
    vi.mocked(api.variantsApi.byProduct).mockResolvedValue([]);
    vi.mocked(api.inventoryApi.balances).mockResolvedValue([]);
    vi.mocked(api.ordersApi.list).mockResolvedValue([]);
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useStore());
    expect(result.current.products).toEqual([]);
    expect(result.current.orders).toEqual([]);
    expect(result.current.balances).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.loading).toBe("object");
  });

  it("exposes all expected methods", () => {
    const { result } = renderHook(() => useStore());
    expect(typeof result.current.fetchProducts).toBe("function");
    expect(typeof result.current.fetchBalances).toBe("function");
    expect(typeof result.current.fetchOrders).toBe("function");
    expect(typeof result.current.getAvailable).toBe("function");
    expect(typeof result.current.getBalance).toBe("function");
    expect(typeof result.current.createOrder).toBe("function");
    expect(typeof result.current.adjustStock).toBe("function");
  });

  it("getAvailable returns 0 when no balance", () => {
    const { result } = renderHook(() => useStore());
    expect(result.current.getAvailable(999)).toBe(0);
  });

  it("fetchProducts loads and sets products", async () => {
    vi.mocked(api.productsApi.list).mockResolvedValue([{ id: 1, name: "P1" }]);
    vi.mocked(api.variantsApi.byProduct).mockResolvedValue([{ id: 10, name: "V1" }]);

    const { result } = renderHook(() => useStore());
    await act(async () => {
      await result.current.fetchProducts();
    });
    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].name).toBe("P1");
    expect(result.current.products[0].variants).toHaveLength(1);
  });
});
