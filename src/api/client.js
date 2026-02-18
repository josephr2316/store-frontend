// ─── API CLIENT ───────────────────────────────────────────────────────────────
// Central HTTP layer. All calls go through here.
// Automatically attaches JWT Bearer token and handles 401 logout.
// Backend URL: VITE_API_URL (on Vercel set to the public Railway URL).

import { API_BASE } from "../constants/index.js";

const BASE_URL = API_BASE;

// Token storage (in-memory + sessionStorage for page refresh survival)
let _token = sessionStorage.getItem("jwt_token") || null;

export const tokenManager = {
  get: ()         => _token,
  set: (t)        => { _token = t; sessionStorage.setItem("jwt_token", t); },
  clear: ()       => { _token = null; sessionStorage.removeItem("jwt_token"); },
  isSet: ()       => !!_token,
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(tokenManager.isSet() ? { Authorization: `Bearer ${tokenManager.get()}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Session expired
  if (res.status === 401) {
    tokenManager.clear();
    window.dispatchEvent(new Event("auth:logout"));
    throw new ApiError(401, "Sesión expirada. Por favor inicia sesión nuevamente.");
  }

  // No content responses
  if (res.status === 204) return null;

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg =
      (typeof data === "object" && data?.message) ||
      (typeof data === "object" && data?.error) ||
      (typeof data === "string" && data) ||
      `Error ${res.status}`;
    throw new ApiError(res.status, msg, data);
  }

  return data;
}

export class ApiError extends Error {
  constructor(status, message, raw) {
    super(message);
    this.status = status;
    this.raw    = raw;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /auth/login
   * @returns {{ token: string }}
   */
  login: (username, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
  /** GET /products */
  list: () => apiFetch("/products"),

  /** GET /products/{id} */
  get: (id) => apiFetch(`/products/${id}`),

  /** POST /products */
  create: (body) =>
    apiFetch("/products", { method: "POST", body: JSON.stringify(body) }),

  /** PUT /products/{id} */
  update: (id, body) =>
    apiFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  /** DELETE /products/{id} */
  remove: (id) => apiFetch(`/products/${id}`, { method: "DELETE" }),
};

// ─── Variants ─────────────────────────────────────────────────────────────────

export const variantsApi = {
  /** GET /variants/by-product/{productId} */
  byProduct: (productId) => apiFetch(`/variants/by-product/${productId}`),

  /** GET /variants/{id} */
  get: (id) => apiFetch(`/variants/${id}`),

  /** POST /variants */
  create: (body) =>
    apiFetch("/variants", { method: "POST", body: JSON.stringify(body) }),

  /** PUT /variants/{id} */
  update: (id, body) =>
    apiFetch(`/variants/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  /** DELETE /variants/{id} */
  remove: (id) => apiFetch(`/variants/${id}`, { method: "DELETE" }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  /** GET /orders paginated. Returns Spring Page { content, totalElements, totalPages, number, size }. */
  list: (status, page = 0, size = 30) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    return apiFetch(`/orders?${params.toString()}`);
  },

  /** GET /orders/{id} */
  get: (id) => apiFetch(`/orders/${id}`),

  /** POST /orders */
  create: (body) =>
    apiFetch("/orders", { method: "POST", body: JSON.stringify(body) }),

  /** POST /orders/{orderId}/transition */
  transition: (orderId, body) =>
    apiFetch(`/orders/${orderId}/transition`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PATCH /orders/{orderId}/address */
  updateAddress: (orderId, body) =>
    apiFetch(`/orders/${orderId}/address`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  /** GET /orders/{orderId}/history */
  history: (orderId) => apiFetch(`/orders/${orderId}/history`),
};

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventoryApi = {
  /** GET /inventory/balance */
  balances: () => apiFetch("/inventory/balance"),

  /** GET /inventory/balance/variant/{variantId} */
  balanceByVariant: (variantId) =>
    apiFetch(`/inventory/balance/variant/${variantId}`),

  /** GET /inventory/available/{variantId} */
  available: (variantId) => apiFetch(`/inventory/available/${variantId}`),

  /** POST /inventory/adjustments */
  adjust: (body) =>
    apiFetch("/inventory/adjustments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export const whatsappApi = {
  /** GET /whatsapp/order/{orderId}/message */
  message: (orderId) => apiFetch(`/whatsapp/order/${orderId}/message`),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportsApi = {
  /**
   * GET /reports/weekly-sales?week=2025-02-10
   * week = ISO date of any day in the desired week
   */
  weeklySales: (week) =>
    apiFetch(`/reports/weekly-sales${week ? `?week=${encodeURIComponent(week)}` : ""}`),

  /**
   * GET /reports/sales-in-range?from=date&to=date
   * Returns { from, to, totalAmount, totalOrders, byWeek: [{ periodStart, totalAmount, orderCount }] }
   */
  salesInRange: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return apiFetch(`/reports/sales-in-range?${params.toString()}`);
  },

  /**
   * GET /reports/top-products?page=0&size=10&from=isoInstant&to=isoInstant
   * Returns { content, totalElements, totalPages, number, size }
   */
  topProducts: (page = 0, size = 10, from, to) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (from != null) params.set("from", typeof from === "string" ? from : from.toISOString?.() ?? String(from));
    if (to != null) params.set("to", typeof to === "string" ? to : to.toISOString?.() ?? String(to));
    return apiFetch(`/reports/top-products?${params.toString()}`);
  },
};
