// ─── FORMATTING ───────────────────────────────────────────────────────────────

export const fmtCurrency = (n) =>
  `RD$${Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

export const nowString = () =>
  new Date().toLocaleString("es-DO", { hour12: false });

// ─── STOCK ────────────────────────────────────────────────────────────────────

export const availableStock = (variant) => variant.stock - variant.reserved;

export const stockStatus = (variant) => {
  const avail = availableStock(variant);
  if (avail === 0) return { label: "Agotado", color: "#DC2626" };
  if (avail <= 3)  return { label: `${avail} un.`, color: "#D97706" };
  return              { label: `${avail} un.`, color: "#059669" };
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export const calcOrderTotal = (items) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const generateOrderId = (count) =>
  `ORD-${String(count).padStart(3, "0")}`;
