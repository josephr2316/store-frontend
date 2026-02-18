import { describe, it, expect } from "vitest";
import { fmtCurrency, calcOrderTotal, stockStatus, generateOrderId } from "./index";

describe("fmtCurrency", () => {
  it("formats number as RD$ with 2 decimals", () => {
    expect(fmtCurrency(100)).toBe("RD$100.00");
    expect(fmtCurrency(0)).toBe("RD$0.00");
  });
  it("handles string numbers", () => {
    expect(fmtCurrency("200.5")).toMatch(/RD\$200\.50/);
  });
});

describe("calcOrderTotal", () => {
  it("sums price * quantity for items", () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];
    expect(calcOrderTotal(items)).toBe(35);
  });
  it("returns 0 for empty array", () => {
    expect(calcOrderTotal([])).toBe(0);
  });
});

describe("stockStatus", () => {
  it("returns Agotado when available is 0", () => {
    expect(stockStatus({ stock: 2, reserved: 2 })).toEqual({ label: "Agotado", color: "#DC2626" });
  });
  it("returns warning when available <= 3", () => {
    expect(stockStatus({ stock: 5, reserved: 2 }).label).toBe("3 un.");
  });
});

describe("generateOrderId", () => {
  it("pads count to 3 digits", () => {
    expect(generateOrderId(1)).toBe("ORD-001");
    expect(generateOrderId(99)).toBe("ORD-099");
  });
});
