import { describe, it, expect, vi, beforeEach } from "vitest";
import { tokenManager, ApiError, authApi, productsApi, variantsApi, ordersApi, inventoryApi, whatsappApi, reportsApi } from "./client";

describe("tokenManager", () => {
  beforeEach(() => {
    tokenManager.clear();
  });

  it("isSet returns false when clear", () => {
    tokenManager.clear();
    expect(tokenManager.isSet()).toBe(false);
  });
  it("set and get roundtrip", () => {
    tokenManager.set("test-token");
    expect(tokenManager.get()).toBe("test-token");
    expect(tokenManager.isSet()).toBe(true);
  });
  it("clear removes token", () => {
    tokenManager.set("x");
    tokenManager.clear();
    expect(tokenManager.get()).toBeNull();
    expect(tokenManager.isSet()).toBe(false);
  });
});

describe("ApiError", () => {
  it("extends Error with status and message", () => {
    const err = new ApiError(404, "Not found", { detail: "x" });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.raw).toEqual({ detail: "x" });
  });
});

describe("authApi", () => {
  it("has login method", () => {
    expect(typeof authApi.login).toBe("function");
  });
});

describe("variantsApi", () => {
  it("has byProduct, get, create, update, remove", () => {
    expect(typeof variantsApi.byProduct).toBe("function");
    expect(typeof variantsApi.get).toBe("function");
  });
});

describe("productsApi", () => {
  it("has list, get, create, update, remove", () => {
    expect(typeof productsApi.list).toBe("function");
    expect(typeof productsApi.get).toBe("function");
    expect(typeof productsApi.create).toBe("function");
    expect(typeof productsApi.update).toBe("function");
    expect(typeof productsApi.remove).toBe("function");
  });
});

describe("ordersApi", () => {
  it("has list, get, create, transition, updateAddress, history", () => {
    expect(typeof ordersApi.list).toBe("function");
    expect(typeof ordersApi.get).toBe("function");
    expect(typeof ordersApi.create).toBe("function");
    expect(typeof ordersApi.transition).toBe("function");
    expect(typeof ordersApi.updateAddress).toBe("function");
    expect(typeof ordersApi.history).toBe("function");
  });
});

describe("inventoryApi", () => {
  it("has balances, balanceByVariant, available, adjust", () => {
    expect(typeof inventoryApi.balances).toBe("function");
    expect(typeof inventoryApi.balanceByVariant).toBe("function");
    expect(typeof inventoryApi.available).toBe("function");
    expect(typeof inventoryApi.adjust).toBe("function");
  });
  it("adjust sends POST with body containing variantId, quantityDelta, reason", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: () => Promise.resolve(JSON.stringify({ id: 1, variantId: 200, quantityDelta: -2, reason: "MANUAL_SALE" })),
    });
    await inventoryApi.adjust({
      variantId: 200,
      quantityDelta: -2,
      reason: "MANUAL_SALE",
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/inventory/adjustments"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ variantId: 200, quantityDelta: -2, reason: "MANUAL_SALE" }),
      })
    );
    fetchSpy.mockRestore();
  });
});

describe("whatsappApi", () => {
  it("has message", () => {
    expect(typeof whatsappApi.message).toBe("function");
  });
});

describe("reportsApi", () => {
  it("has weeklySales, salesInRange and topProducts", () => {
    expect(typeof reportsApi.weeklySales).toBe("function");
    expect(typeof reportsApi.salesInRange).toBe("function");
    expect(typeof reportsApi.topProducts).toBe("function");
  });
});
