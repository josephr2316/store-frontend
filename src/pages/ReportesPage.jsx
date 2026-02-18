import { useState, useEffect } from "react";
import { reportsApi } from "../api/client";
import { fmtCurrency } from "../utils/index";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Prevents NaN or non-numeric values in the UI */
function safeNum(x) {
  if (x == null) return 0;
  const n = Number(x);
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

/** Safe value for display in cards (never "NaN") */
function safeDisplay(value) {
  if (value == null) return "0";
  if (typeof value === "number" && Number.isNaN(value)) return "0";
  const s = String(value);
  return s === "NaN" || s === "undefined" || s === "null" ? "0" : s;
}

// Fixed chart size: same container regardless of range; cap bars so axis stays readable
const MAX_DAILY_BARS = 31;
const MAX_WEEKLY_BARS = 52;
const CHART_VIEWPORT_WIDTH = 720;
const CHART_HEIGHT = 220;

// Vibrant palette (works with light background)
const COLORS = {
  primary: "#0EA5E9",      // sky
  primaryDark: "#0284C7",
  success: "#10B981",      // emerald
  warning: "#F59E0B",      // amber
  danger: "#EF4444",       // red
  accent: "#8B5CF6",       // violet
  accentPink: "#EC4899",
};

const CARD_STYLE = {
  background: "#fff",
  border: "1px solid #E2E8F0",
  borderRadius: 14,
  padding: "18px 20px",
  minWidth: 0,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
};

function StatCard({ label, value, sub, color, delay = 0 }) {
  return (
    <div style={{ ...CARD_STYLE, animation: "cardIn 0.35s ease-out forwards", animationDelay: `${delay}ms`, opacity: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{safeDisplay(value)}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Generates weeks between two dates (for zero bars when API returns no data) */
function weeksBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return [];
  const from = new Date(fromStr);
  const to = new Date(toStr);
  const out = [];
  const d = new Date(from);
  while (d <= to && out.length < 53) {
    out.push({ periodStart: d.toISOString().slice(0, 10), totalAmount: 0, orderCount: 0 });
    d.setDate(d.getDate() + 7);
  }
  return out;
}

/** Generates days between two dates (max 366) for daily chart */
function daysBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return [];
  const from = new Date(fromStr);
  const to = new Date(toStr);
  const out = [];
  const d = new Date(from);
  for (let n = 0; n < 366 && d <= to; n++) {
    out.push({ date: d.toISOString().slice(0, 10), totalAmount: 0, orderCount: 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Daily sales chart. Fixed size; shows at most MAX_DAILY_BARS (last N days). */
function DayChart({ rangeData, loading, from, to }) {
  const apiDays = rangeData?.byDay || [];
  const fallbackDays = from && to ? daysBetween(from, to) : [];
  const allBars = (apiDays.length > 0 ? apiDays : fallbackDays).map((d, i) => ({
    label: d.date ? String(d.date).slice(5) : "",
    amount: safeNum(d.totalAmount),
    count: safeNum(d.orderCount),
    date: d.date,
    key: d.date ?? `d-${i}`,
  }));
  const bars = allBars.length > MAX_DAILY_BARS ? allBars.slice(-MAX_DAILY_BARS) : allBars;
  const totalAmount = (rangeData != null && (safeNum(rangeData.totalAmount) > 0 || allBars.length === 0)) ? safeNum(rangeData.totalAmount) : allBars.reduce((s, b) => s + b.amount, 0);
  const totalOrders = (rangeData != null && (safeNum(rangeData.totalOrders) > 0 || allBars.length === 0)) ? safeNum(rangeData.totalOrders) : allBars.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...bars.map(b => b.amount), 1);
  const hasBars = bars.length > 0;
  const barWidth = hasBars ? Math.max(14, CHART_VIEWPORT_WIDTH / bars.length - 4) : 20;

  return (
    <div style={{ ...CARD_STYLE, padding: 24, minHeight: 320, maxWidth: CHART_VIEWPORT_WIDTH + 48 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#0F172A" }}>Ventas por día</div>
      {from && to && (
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
          {String(from).slice(0, 10)} → {String(to).slice(0, 10)} · Total: <strong style={{ color: COLORS.primaryDark }}>{fmtCurrency(totalAmount)}</strong> · {safeDisplay(totalOrders)} pedido{safeNum(totalOrders) !== 1 ? "s" : ""} entregado{safeNum(totalOrders) !== 1 ? "s" : ""}
          {allBars.length > MAX_DAILY_BARS && <span style={{ marginLeft: 8, color: "#94A3B8" }}>(gráfica: últimos {MAX_DAILY_BARS} días)</span>}
        </div>
      )}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: CHART_HEIGHT, gap: 12, color: "#64748B", fontSize: 14 }}>
          <span style={{ width: 24, height: 24, border: "2px solid #E5E7EB", borderTopColor: COLORS.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Cargando…
        </div>
      ) : !hasBars ? (
        <div style={{ color: "#94A3B8", textAlign: "center", padding: 48, fontSize: 14, background: "#F0F9FF", borderRadius: 10, height: CHART_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>Sin datos en este rango. Usa 7 días, 1 mes o Último año.</div>
      ) : (
        <div style={{ width: "100%", maxWidth: CHART_VIEWPORT_WIDTH, height: CHART_HEIGHT }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: CHART_HEIGHT - 32 }}>
            {bars.map((bar, i) => {
              const amt = safeNum(bar.amount);
              const count = safeNum(bar.count);
              const h = Math.max(4, (amt / max) * (CHART_HEIGHT - 56));
              const displayVal = amt > 0 ? fmtCurrency(amt).replace("RD$", "").trim() : "";
              return (
                <div key={bar.key ?? i} style={{ flex: `0 0 ${barWidth}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: amt > 0 ? COLORS.primaryDark : "#94A3B8" }}>{displayVal}</div>
                  <div style={{ width: Math.max(8, barWidth - 4), background: amt > 0 ? `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)` : "#E2E8F0", borderRadius: "3px 3px 0 0", height: h, minHeight: 4 }} />
                  {count > 0 && <div style={{ fontSize: 8, color: "#64748B" }}>{count} ped.</div>}
                  <div style={{ fontSize: 8, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{bar.label || ""}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Weekly sales chart. Fixed size; shows at most MAX_WEEKLY_BARS (last N weeks). */
function RangeChart({ rangeData, loading, from, to }) {
  const apiWeeks = rangeData?.byWeek || [];
  const fallbackWeeks = from && to ? weeksBetween(from, to) : [];
  const allBars = (apiWeeks.length > 0 ? apiWeeks : fallbackWeeks).map((w, i) => ({
    label: w.periodStart ? String(w.periodStart).slice(5) : "",
    amount: safeNum(w.totalAmount),
    count: safeNum(w.orderCount),
    date: w.periodStart,
    key: w.periodStart ?? `w-${i}`,
  }));
  const bars = allBars.length > MAX_WEEKLY_BARS ? allBars.slice(-MAX_WEEKLY_BARS) : allBars;
  const totalAmount = safeNum(rangeData?.totalAmount) || allBars.reduce((s, b) => s + b.amount, 0);
  const totalOrders = safeNum(rangeData?.totalOrders) || allBars.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...bars.map(b => b.amount), 1);
  const hasBars = bars.length > 0;
  const barWidth = hasBars ? Math.max(12, CHART_VIEWPORT_WIDTH / bars.length - 2) : 16;

  return (
    <div style={{ ...CARD_STYLE, padding: 24, minHeight: 320, maxWidth: CHART_VIEWPORT_WIDTH + 48 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#0F172A" }}>Ventas por semana</div>
      {from && to && (
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
          {String(from).slice(0, 10)} → {String(to).slice(0, 10)} · Total: <strong style={{ color: COLORS.accent }}>{fmtCurrency(totalAmount)}</strong> · {totalOrders} pedido{totalOrders !== 1 ? "s" : ""} entregado{totalOrders !== 1 ? "s" : ""}
          {allBars.length > MAX_WEEKLY_BARS && <span style={{ marginLeft: 8, color: "#94A3B8" }}>(gráfica: últimas {MAX_WEEKLY_BARS} semanas)</span>}
        </div>
      )}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: CHART_HEIGHT, gap: 12, color: "#64748B", fontSize: 14 }}>
          <span style={{ width: 24, height: 24, border: "2px solid #E5E7EB", borderTopColor: COLORS.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Cargando…
        </div>
      ) : !hasBars ? (
        <div style={{ color: "#94A3B8", textAlign: "center", padding: 48, fontSize: 14, background: "#FAF5FF", borderRadius: 10, height: CHART_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>Sin datos en este rango. Usa 1 mes o Último año.</div>
      ) : (
        <div style={{ width: "100%", maxWidth: CHART_VIEWPORT_WIDTH, height: CHART_HEIGHT }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: CHART_HEIGHT - 32 }}>
            {bars.map((bar, i) => {
              const amt = safeNum(bar.amount);
              const count = safeNum(bar.count);
              const h = Math.max(6, (amt / max) * (CHART_HEIGHT - 56));
              const displayVal = amt > 0 ? fmtCurrency(amt).replace("RD$", "").trim() : "";
              return (
                <div key={bar.key ?? i} style={{ flex: `0 0 ${barWidth}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: amt > 0 ? COLORS.accent : "#94A3B8" }}>{displayVal}</div>
                  <div style={{ width: Math.max(10, barWidth - 2), background: amt > 0 ? `linear-gradient(180deg, ${COLORS.accent} 0%, #6D28D9 100%)` : "#E2E8F0", borderRadius: "4px 4px 0 0", height: h, minHeight: 6 }} />
                  {count > 0 && <div style={{ fontSize: 8, color: "#64748B" }}>{count} ped.</div>}
                  <div style={{ fontSize: 8, color: "#64748B", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{bar.label || "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Single week chart (7 days). Never shows NaN. */
function WeeklyChart({ data, loading }) {
  const { bars, totalAmount, totalOrders, weekStart } = (() => {
    if (!data) return { bars: [], totalAmount: 0, totalOrders: 0, weekStart: null };
    if (data.dailyBreakdown && Array.isArray(data.dailyBreakdown) && data.dailyBreakdown.length > 0) {
      const bars = data.dailyBreakdown.map(d => ({
        label: d.date ? (DAY_LABELS[(new Date(d.date).getDay() + 6) % 7] || String(d.date).slice(5)) : "",
        amount: safeNum(d.totalAmount),
        count: safeNum(d.orderCount),
        date: d.date,
      }));
      return { bars, totalAmount: bars.reduce((s, b) => s + b.amount, 0), totalOrders: bars.reduce((s, b) => s + b.count, 0), weekStart: data.weekStart };
    }
    if (Array.isArray(data)) {
      const bars = data.map((d, i) => {
        const date = d.date || d.day || d.week || Object.keys(d)[0];
        const val = d.total ?? d.sales ?? d.amount ?? Object.values(d)[0] ?? 0;
        return { label: String(date).slice(-5), amount: safeNum(val), count: 0, date: date ?? `idx-${i}` };
      });
      return { bars, totalAmount: bars.reduce((s, b) => s + b.amount, 0), totalOrders: 0, weekStart: data.weekStart ?? null };
    }
    if (typeof data.totalAmount === "number" || data.totalAmount != null) {
      const amt = safeNum(data.totalAmount);
      return { bars: [{ label: "Total", amount: amt, count: safeNum(data.orderCount), date: data.weekStart }], totalAmount: amt, totalOrders: safeNum(data.orderCount), weekStart: data.weekStart };
    }
    if (data && typeof data === "object" && !Array.isArray(data) && ("weekStart" in data || "orderCount" in data || "totalAmount" in data)) {
      const amt = safeNum(data.totalAmount);
      const count = safeNum(data.orderCount);
      return { bars: [{ label: "Total", amount: amt, count, date: data.weekStart }], totalAmount: amt, totalOrders: count, weekStart: data.weekStart };
    }
    return { bars: [], totalAmount: 0, totalOrders: 0, weekStart: null };
  })();

  const max = Math.max(...bars.map(b => b.amount), 1);
  const hasData = bars.length > 0 && (totalAmount > 0 || totalOrders > 0);

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, minHeight: 260, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#0F172A" }}>Ventas Semanales</div>
      {weekStart && (
        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>
          Semana del {typeof weekStart === "string" ? weekStart.slice(0, 10) : weekStart} · Total: {fmtCurrency(totalAmount)} · {totalOrders} pedido{totalOrders !== 1 ? "s" : ""} entregado{totalOrders !== 1 ? "s" : ""}
        </div>
      )}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 8, color: "#64748B", fontSize: 14 }}>Cargando...</div>
      ) : !hasData ? (
        <div style={{ color: "#9CA3AF", textAlign: "center", padding: 40, fontSize: 14 }}>Sin datos para esta semana</div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 180 }}>
          {bars.map((bar, i) => {
            const h = Math.max(6, (bar.amount / max) * 160);
            return (
              <div key={bar.date != null ? String(bar.date) : `idx-${i}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1" }}>{bar.amount > 0 ? fmtCurrency(bar.amount).replace("RD$", "").trim() : "—"}</div>
                <div style={{ width: "100%", background: bar.amount > 0 ? "#6366F1" : "#E2E8F0", borderRadius: "6px 6px 0 0", height: h, minHeight: 6 }} />
                <div style={{ fontSize: 10, color: "#64748B" }}>{bar.label}</div>
                {bar.count > 0 && <div style={{ fontSize: 9, color: "#94A3B8" }}>{bar.count} ped.</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TOP PRODUCTS (paginado) ──────────────────────────────────────────────────

function TopProducts({ paged, loading, page, totalPages, totalElements, pageSize, onPageChange, onSizeChange }) {
  const content = paged?.content ?? [];
  const items = content.map(d => {
    const name = (d.variantSku ?? d.productName ?? d.name ?? d.product ?? "—") || "—";
    return [safeDisplay(name), safeNum(d.quantitySold ?? d.quantity ?? d.sold ?? d.count)];
  });
  const maxQty = Math.max(...items.map(([, q]) => q), 1);
  const pageIndex = safeNum(page);
  const start = pageIndex * (safeNum(pageSize) || 10) + 1;

  return (
    <div style={{ ...CARD_STYLE, padding: 24, minHeight: 260 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Top Productos</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <label style={{ color: "#64748B" }}>Mostrar:</label>
          <select value={pageSize} onChange={e => onSizeChange?.(Number(e.target.value))} style={{ border: "1px solid #E5E7EB", borderRadius: 6, padding: "4px 8px", fontSize: 12 }}>
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24, gap: 8, color: "#64748B", fontSize: 13 }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ color: "#64748B", fontSize: 13, padding: 16, background: "#F8FAFC", borderRadius: 10 }}>No hay productos vendidos en el rango. Usa el atajo <strong>Último año</strong> para ver datos del año anterior.</div>
      ) : (
        <>
          {items.map(([name, qty], i) => (
            <div key={`${name}-${start + i}`} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? COLORS.primary : i === 1 ? COLORS.accent : COLORS.success, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>{start + i}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ height: 4, background: "#F3F4F6", borderRadius: 4, marginTop: 3 }}>
                  <div style={{ height: "100%", borderRadius: 4, background: COLORS.primary, width: `${(qty / maxQty) * 100}%` }} />
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>{qty}</span>
            </div>
          ))}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #E2E8F0", fontSize: 12, color: "#64748B" }}>
              <span>{safeDisplay(totalElements)} producto{safeNum(totalElements) !== 1 ? "s" : ""} en total</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button type="button" onClick={() => onPageChange?.(pageIndex - 1)} disabled={pageIndex <= 0} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 6, padding: "4px 10px", cursor: pageIndex <= 0 ? "not-allowed" : "pointer", opacity: pageIndex <= 0 ? 0.6 : 1 }}>Anterior</button>
                <span>Pág. {pageIndex + 1} de {totalPages}</span>
                <button type="button" onClick={() => onPageChange?.(pageIndex + 1)} disabled={pageIndex >= totalPages - 1} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 6, padding: "4px 10px", cursor: pageIndex >= totalPages - 1 ? "not-allowed" : "pointer", opacity: pageIndex >= totalPages - 1 ? 0.6 : 1 }}>Siguiente</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function lastYearFrom(dateStr) {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

function toInstantStart(dateStr) {
  return new Date(dateStr + "T00:00:00").toISOString();
}
function toInstantEnd(dateStr) {
  return new Date(dateStr + "T23:59:59.999").toISOString();
}

export default function ReportesPage({ store }) {
  const orders = store.orders ?? [];
  const balances = store.balances ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const defaultDesde = lastYearFrom(today);
  const [dateDesde, setDateDesde] = useState(defaultDesde);
  const [dateHasta, setDateHasta] = useState(today);
  const [salesInRange, setSalesInRange] = useState(null);
  const [topProductsPaged, setTopProductsPaged] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loadingRep, setLoadingRep] = useState(true);

  const desde = dateDesde || defaultDesde;
  const hasta = dateHasta || today;
  const hastaDisplay = String(hasta).slice(0, 10);
  const desdeDisplay = String(desde).slice(0, 10);

  const fetchRangeAndTops = async (desdeVal, hastaVal, p, size) => {
    setLoadingRep(true);
    store.setError(null);
    const fromInst = toInstantStart(desdeVal || desde);
    const toInst = toInstantEnd(hastaVal || hasta);
    try {
      const [range, tops] = await Promise.all([
        reportsApi.salesInRange(desdeVal || desde, hastaVal || hasta),
        reportsApi.topProducts(p, size, fromInst, toInst),
      ]);
      setSalesInRange(range ?? { from: desde, to: hasta, totalAmount: 0, totalOrders: 0, byWeek: [], byDay: [] });
      setTopProductsPaged(tops ?? { content: [], totalElements: 0, totalPages: 0, number: 0, size: size || 10 });
    } catch (e) {
      const msg = e?.message === "Failed to fetch" ? "No se pudo conectar con el servidor." : (e?.message || "Error al cargar reportes.");
      store.setError(msg);
      setSalesInRange({ from: desde, to: hasta, totalAmount: 0, totalOrders: 0, byWeek: [], byDay: [] });
      setTopProductsPaged({ content: [], totalElements: 0, totalPages: 0, number: 0, size: size || 10 });
    } finally {
      setLoadingRep(false);
    }
  };

  const fetchReports = () => {
    setPage(0);
    fetchRangeAndTops(desde, hasta, 0, pageSize);
  };

  useEffect(() => {
    fetchRangeAndTops(desde, hasta, 0, pageSize);
  }, [dateDesde, dateHasta]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setLoadingRep(true);
    store.setError(null);
    reportsApi.topProducts(newPage, pageSize, toInstantStart(desde), toInstantEnd(hasta))
      .then(setTopProductsPaged)
      .catch(e => store.setError(e?.message || "Error"))
      .finally(() => setLoadingRep(false));
  };

  const handleSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(0);
    setLoadingRep(true);
    store.setError(null);
    reportsApi.topProducts(0, newSize, toInstantStart(desde), toInstantEnd(hasta))
      .then(setTopProductsPaged)
      .finally(() => setLoadingRep(false));
  };

  const pendingCount = orders.filter(o => (o.state || o.status) === "PENDING").length;
  const periodRevenue = safeNum(salesInRange?.totalAmount);
  const periodOrders = safeNum(salesInRange?.totalOrders);
  const lowStockCount = balances.filter(b => {
    const stock = safeNum(b.stock ?? b.quantity);
    const reserved = safeNum(b.reserved ?? b.reservedQty);
    return (stock - reserved) <= 3;
  }).length;
  const totalOrdersInSystem = orders.length;

  const statCards = [
    { label: "Pedidos Pendientes", value: safeDisplay(pendingCount), sub: "Requieren atención", color: COLORS.warning },
    { label: "Ventas en período", value: fmtCurrency(periodRevenue), sub: `Desde ${desdeDisplay} hasta ${hastaDisplay} · ${safeDisplay(periodOrders)} entregados`, color: COLORS.primary },
    { label: "Variantes Bajo Stock", value: safeDisplay(lowStockCount), sub: "≤ 3 unidades disp.", color: COLORS.danger },
    { label: "Pedidos en Sistema", value: safeDisplay(totalOrdersInSystem), sub: "Total registrados", color: COLORS.success },
  ];

  const setRangePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateDesde(start.toISOString().slice(0, 10));
    setDateHasta(end.toISOString().slice(0, 10));
  };

  const exportToExcel = () => {
    const rows = [];
    rows.push("Reporte de ventas");
    rows.push(`Desde,${desdeDisplay},Hasta,${hastaDisplay}`);
    rows.push("");
    rows.push("Resumen");
    rows.push(`Total ventas,${safeNum(salesInRange?.totalAmount)}`);
    rows.push(`Pedidos entregados,${safeNum(salesInRange?.totalOrders)}`);
    rows.push("");
    rows.push("Ventas por día (fecha,monto,pedidos)");
    (salesInRange?.byDay || []).slice(-MAX_DAILY_BARS).forEach(d => {
      rows.push(`${d.date || ""},${safeNum(d.totalAmount)},${safeNum(d.orderCount)}`);
    });
    rows.push("");
    rows.push("Ventas por semana (inicio_semana,monto,pedidos)");
    (salesInRange?.byWeek || []).slice(-MAX_WEEKLY_BARS).forEach(w => {
      rows.push(`${w.periodStart || ""},${safeNum(w.totalAmount)},${safeNum(w.orderCount)}`);
    });
    rows.push("");
    rows.push("Top productos (SKU,cantidad vendida)");
    (topProductsPaged?.content || []).forEach(p => {
      rows.push(`${p.variantSku || ""},${safeNum(p.quantitySold)}`);
    });
    const csv = "\uFEFF" + rows.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${desdeDisplay}_${hastaDisplay}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%", maxWidth: 1440, margin: "0 auto", background: "#EFF6FF" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #E2E8F0" }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Reportes</h2>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748B", maxWidth: 720 }}>
          Ventas por semana y productos top según el rango elegido. Datos desde hace un año hasta hoy. Pedidos pendientes, en sistema y stock bajo reflejan el estado actual.
        </p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "20px 24px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Escala:</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <button type="button" onClick={() => { setDateDesde(defaultDesde); setDateHasta(today); }} style={{ border: "1px solid " + COLORS.primary, background: "#F0F9FF", color: COLORS.primaryDark, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>1 año</button>
            <button type="button" onClick={() => setRangePreset(365)} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#475569" }}>Ver todo</button>
            <button type="button" onClick={() => setRangePreset(90)} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#475569" }}>3M</button>
            <button type="button" onClick={() => setRangePreset(30)} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#475569" }}>1M</button>
            <button type="button" onClick={() => setRangePreset(15)} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#475569" }}>15d</button>
            <button type="button" onClick={() => setRangePreset(6)} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#475569" }}>7d</button>
            <button type="button" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 1); const y = d.toISOString().slice(0, 10); setDateDesde(y); setDateHasta(y); }} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "#475569" }}>Ayer</button>
          </div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginLeft: 4 }}>Desde</label>
          <input type="date" value={dateDesde || defaultDesde} onChange={e => setDateDesde(e.target.value)}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "inherit" }} />
          <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Hasta</label>
          <input type="date" value={dateHasta || today} onChange={e => setDateHasta(e.target.value)}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "inherit" }} />
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{desdeDisplay} → {hastaDisplay}</span>
          <button onClick={fetchReports} disabled={loadingRep}
            style={{ marginLeft: "auto", background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: loadingRep ? "wait" : "pointer", fontFamily: "inherit", minWidth: 100, boxShadow: "0 2px 4px rgba(14,165,233,0.4)" }}>
            {loadingRep ? "Cargando…" : "Actualizar"}
          </button>
          <button type="button" onClick={exportToExcel} disabled={loadingRep}
            style={{ background: COLORS.success, color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            📥 Exportar Excel
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {statCards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 60} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <DayChart rangeData={salesInRange} loading={loadingRep} from={desde} to={hasta} />
          <RangeChart rangeData={salesInRange} loading={loadingRep} from={desde} to={hasta} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TopProducts
            paged={topProductsPaged}
            loading={loadingRep}
            page={topProductsPaged?.number ?? 0}
            totalPages={topProductsPaged?.totalPages ?? 0}
            totalElements={topProductsPaged?.totalElements ?? 0}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onSizeChange={handleSizeChange}
          />

          {/* Low stock */}
          <div style={{ ...CARD_STYLE, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "#0F172A" }}>⚠️ Stock Bajo</div>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>Variantes con ≤ 3 unidades disponibles (stock − reservado)</div>
            {balances.filter(b => {
              const stock    = b.stock    ?? b.quantity    ?? 0;
              const reserved = b.reserved ?? b.reservedQty ?? 0;
              return (stock - reserved) <= 3;
            }).length === 0 ? (
              <div style={{ color: COLORS.success, fontSize: 13, fontWeight: 600 }}>✓ Todo en orden</div>
            ) : (
              balances
                .filter(b => { const s = safeNum(b.stock ?? b.quantity) - safeNum(b.reserved ?? b.reservedQty); return s <= 3; })
                .map((b, idx) => {
                  const stock = safeNum(b.stock ?? b.quantity);
                  const reserved = safeNum(b.reserved ?? b.reservedQty);
                  const avail = Math.max(0, stock - reserved);
                  const label = (b.variantSku || b.variantLabel || b.variant?.label || `Variante ${b.variantId ?? b.id ?? ""}`) || "Variante";
                  const status = avail === 0 ? "Agotado" : "Bajo stock";
                  const statusColor = avail === 0 ? "#DC2626" : "#D97706";
                  return (
                    <div key={b.variantId ?? b.id ?? `low-${idx}`} style={{ padding: "10px 0", borderBottom: "1px solid #F0F0F0", fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                        <span style={{ fontWeight: 600, color: "#0F172A" }}>{safeDisplay(label)}</span>
                        <span style={{ fontWeight: 700, color: statusColor, fontSize: 12 }}>{status}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: "#64748B" }}>
                        <span>Stock: <strong>{safeDisplay(stock)}</strong></span>
                        <span>Reservado: <strong>{safeDisplay(reserved)}</strong></span>
                        <span>Disponible: <strong style={{ color: avail === 0 ? "#DC2626" : "#0F172A" }}>{safeDisplay(avail)}</strong></span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
