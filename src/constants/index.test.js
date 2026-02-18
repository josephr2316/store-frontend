import { describe, it, expect } from "vitest";
import {
  ORDER_STATES,
  ORDER_STATE_LABELS,
  STATE_TRANSITIONS,
  STATE_COLORS,
  CHANNELS,
  API_BASE,
} from "./index";

describe("ORDER_STATES", () => {
  it("has 6 states", () => {
    expect(ORDER_STATES).toHaveLength(6);
  });
  it("includes PENDING, CONFIRMED, DELIVERED, CANCELLED", () => {
    expect(ORDER_STATES).toContain("PENDING");
    expect(ORDER_STATES).toContain("CONFIRMED");
    expect(ORDER_STATES).toContain("DELIVERED");
    expect(ORDER_STATES).toContain("CANCELLED");
  });
});

describe("ORDER_STATE_LABELS", () => {
  it("has label for every ORDER_STATE", () => {
    ORDER_STATES.forEach(state => {
      expect(ORDER_STATE_LABELS[state]).toBeDefined();
      expect(typeof ORDER_STATE_LABELS[state]).toBe("string");
    });
  });
  it("PENDING is Pendiente", () => {
    expect(ORDER_STATE_LABELS.PENDING).toBe("Pendiente");
  });
  it("DELIVERED is Entregado", () => {
    expect(ORDER_STATE_LABELS.DELIVERED).toBe("Entregado");
  });
});

describe("STATE_TRANSITIONS", () => {
  it("PENDING can go to CONFIRMED or CANCELLED", () => {
    expect(STATE_TRANSITIONS.PENDING).toEqual(["CONFIRMED", "CANCELLED"]);
  });
  it("DELIVERED has no next states", () => {
    expect(STATE_TRANSITIONS.DELIVERED).toEqual([]);
  });
  it("CANCELLED has no next states", () => {
    expect(STATE_TRANSITIONS.CANCELLED).toEqual([]);
  });
});

describe("STATE_COLORS", () => {
  it("each state has bg, text, dot", () => {
    ORDER_STATES.forEach(state => {
      const c = STATE_COLORS[state];
      expect(c).toBeDefined();
      expect(c.bg).toBeDefined();
      expect(c.text).toBeDefined();
      expect(c.dot).toBeDefined();
    });
  });
  it("DELIVERED has teal dot (distinct from CONFIRMED)", () => {
    expect(STATE_COLORS.DELIVERED.dot).toBe("#14B8A6");
    expect(STATE_COLORS.CONFIRMED.dot).toBe("#10B981");
  });
});

describe("CHANNELS", () => {
  it("includes WHATSAPP and DIRECT", () => {
    expect(CHANNELS).toContain("WHATSAPP");
    expect(CHANNELS).toContain("DIRECT");
  });
});

describe("API_BASE", () => {
  it("is a valid URL string", () => {
    expect(typeof API_BASE).toBe("string");
    expect(API_BASE).toMatch(/^https?:\/\//);
  });
});
