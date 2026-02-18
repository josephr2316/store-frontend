// ─── ORDER STATE MACHINE (matches backend enum values) ─────────────────────────

export const ORDER_STATES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const ORDER_STATE_LABELS = {
  PENDING:   "Pendiente",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  SHIPPED:   "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const STATE_TRANSITIONS = {
  PENDING:   ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED",   "CANCELLED"],
  SHIPPED:   ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const STATE_COLORS = {
  PENDING:   { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  CONFIRMED: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  PREPARING: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  SHIPPED:   { bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6" },
  DELIVERED: { bg: "#D1FAE5", text: "#064E3B", dot: "#059669" },
  CANCELLED: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  // lowercase fallbacks in case API returns lowercase
  Pendiente:  { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  Confirmado: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  Preparando: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  Enviado:    { bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6" },
  Entregado:  { bg: "#D1FAE5", text: "#064E3B", dot: "#059669" },
  Cancelado:  { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

export const CHANNELS = ["WHATSAPP", "INSTAGRAM", "SHOPIFY", "DIRECT"];

// ─── API BASE URL ──────────────────────────────────────────────────────────────
export const API_BASE = "https://store-production-3316.up.railway.app";
