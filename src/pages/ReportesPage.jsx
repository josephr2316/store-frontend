import { useState, useEffect } from "react";
import { reportsApi } from "../api/client";
import { fmtCurrency } from "../utils/index";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Evita NaN o valores no numéricos en la UI */
function safeNum(x) {
  if (x == null) return 0;
  const n = Number(x);
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

/** Valor seguro para mostrar en tarjetas (nunca "NaN") */
function safeDisplay(value) {
  if (value == null) return "0";
  if (typeof value === "number" && Number.isNaN(value)) return "0";
  const s = String(value);
  return s === "NaN" || s === "undefined" || s === "null" ? "0" : s;
}

function StatCard({ label, value, sub, color, delay = 0 }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 18px", minWidth: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", animation: "cardIn 0.35s ease-out forwards", animationDelay: `${delay}ms`, opacity: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.2 }}>{safeDisplay(value)}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Genera semanas entre dos fechas (para mostrar barras en cero si el API no devuelve datos) */
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

/** Genera días entre dos fechas (máx 366) para gráfica por día */
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

/** Gráfica ventas por día en el rango. Nunca muestra NaN. */
function DayChart({ rangeData, loading, from, to }) {
  const apiDays = rangeData?.byDay || [];
  const fallbackDays = from && to ? daysBetween(from, to) : [];
  const bars = (apiDays.length > 0 ? apiDays : fallbackDays).map((d, i) => ({
    label: d.date ? String(d.date).slice(5) : "",
    amount: safeNum(d.totalAmount),
    count: safeNum(d.orderCount),
    date: d.date,
    key: d.date ?? `d-${i}`,
  }));
  const totalAmount = bars.reduce((s, b) => s + b.amount, 0);
  const totalOrders = bars.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...bars.map(b => b.amount), 1);
  const hasBars = bars.length > 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, minHeight: 260, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#0F172A" }}>Ventas por día</div>
      {from && to && (
        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>
          Desde {String(from).slice(0, 10)} hasta {String(to).slice(0, 10)} · Total: {fmtCurrency(totalAmount)} · {safeDisplay(totalOrders)} pedido{safeNum(totalOrders) !== 1 ? "s" : ""} entregado{safeNum(totalOrders) !== 1 ? "s" : ""}
        </div>
      )}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 8, color: "#64748B", fontSize: 14 }}>Cargando...</div>
      ) : !hasBars ? (
        <div style={{ color: "#9CA3AF", textAlign: "center", padding: 40, fontSize: 14 }}>Sin datos en este rango.</div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 160, minWidth: Math.max(bars.length * 12, 400) }}>
            {bars.map((bar, i) => {
              const amt = safeNum(bar.amount);
              const count = safeNum(bar.count);
              const h = Math.max(2, (amt / max) * 140);
              const displayVal = amt > 0 ? fmtCurrency(amt).replace("RD$", "").trim() : "0";
              return (
                <div key={bar.key ?? i} style={{ flex: "0 0 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: amt > 0 ? "#6366F1" : "#94A3B8" }}>{amt > 0 ? displayVal : ""}</div>
                  <div style={{ width: 8, background: amt > 0 ? "#6366F1" : "#E2E8F0", borderRadius: "2px 2px 0 0", height: h, minHeight: 2 }} />
                  {count > 0 && <div style={{ fontSize: 8, color: "#64748B" }}>{count} ped.</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Gráfica por rango: muchas semanas (desde/hasta = 1 año). Nunca muestra NaN. */
function RangeChart({ rangeData, loading, from, to }) {
  const apiWeeks = rangeData?.byWeek || [];
  const fallbackWeeks = from && to ? weeksBetween(from, to) : [];
  const bars = (apiWeeks.length > 0 ? apiWeeks : fallbackWeeks).map((w, i) => ({
    label: w.periodStart ? String(w.periodStart).slice(5) : "",
    amount: safeNum(w.totalAmount),
    count: safeNum(w.orderCount),
    date: w.periodStart,
    key: w.periodStart ?? `w-${i}`,
  }));
  const totalAmount = safeNum(rangeData?.totalAmount) || bars.reduce((s, b) => s + b.amount, 0);
  const totalOrders = safeNum(rangeData?.totalOrders) || bars.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...bars.map(b => b.amount), 1);
  const hasBars = bars.length > 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, minHeight: 280, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#0F172A" }}>Ventas por semana (en el rango)</div>
      {from && to && (
        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>
          Desde {String(from).slice(0, 10)} hasta {String(to).slice(0, 10)} · Total: {fmtCurrency(totalAmount)} · {totalOrders} pedido{totalOrders !== 1 ? "s" : ""} entregado{totalOrders !== 1 ? "s" : ""}
        </div>
      )}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 8, color: "#64748B", fontSize: 14 }}>
          <span style={{ width: 20, height: 20, border: "2px solid #E5E7EB", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Cargando...
        </div>
      ) : !hasBars ? (
        <div style={{ color: "#9CA3AF", textAlign: "center", padding: 40, fontSize: 14 }}>Sin datos en este rango. Comprueba la conexión con el servidor.</div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180, minWidth: Math.max(bars.length * 24, 400) }}>
            {bars.map((bar, i) => {
              const amt = safeNum(bar.amount);
              const count = safeNum(bar.count);
              const h = Math.max(4, (amt / max) * 160);
              const displayVal = amt > 0 ? fmtCurrency(amt).replace("RD$", "").trim() : "0";
              return (
                <div key={bar.key ?? i} style={{ flex: "0 0 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: amt > 0 ? "#6366F1" : "#94A3B8" }}>
                    {displayVal}
                  </div>
                  <div style={{ width: 16, background: amt > 0 ? "#6366F1" : "#E2E8F0", borderRadius: "4px 4px 0 0", height: h, minHeight: 4 }} />
                  {count > 0 && <div style={{ fontSize: 8, color: "#64748B" }}>{count} ped.</div>}
                  <div style={{ fontSize: 9, color: "#64748B", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{bar.label || "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Gráfica una semana (7 días). Nunca muestra NaN. */
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
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, minHeight: 220, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Top Productos</div>
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
        <div style={{ color: "#64748B", fontSize: 13 }}>No hay productos vendidos en el rango de fechas seleccionado. Prueba un rango que incluya los últimos días (pedidos entregados).</div>
      ) : (
        <>
          {items.map(([name, qty], i) => (
            <div key={`${name}-${start + i}`} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "#6366F1" : i === 1 ? "#8B5CF6" : "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>{start + i}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ height: 4, background: "#F3F4F6", borderRadius: 4, marginTop: 3 }}>
                  <div style={{ height: "100%", borderRadius: 4, background: "#6366F1", width: `${(qty / maxQty) * 100}%` }} />
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
    { label: "Pedidos Pendientes", value: safeDisplay(pendingCount), sub: "Requieren atención", color: "#F59E0B" },
    { label: "Ventas en período", value: fmtCurrency(periodRevenue), sub: `Desde ${desdeDisplay} hasta ${hastaDisplay} · ${safeDisplay(periodOrders)} entregados`, color: "#6366F1" },
    { label: "Variantes Bajo Stock", value: safeDisplay(lowStockCount), sub: "≤ 3 unidades disp.", color: "#EF4444" },
    { label: "Pedidos en Sistema", value: safeDisplay(totalOrdersInSystem), sub: "Total registrados", color: "#10B981" },
  ];

  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", height: "100%", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F0F19" }}>Reportes</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#64748B", marginRight: 4 }}>Atajos:</span>
          <button type="button" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 1); const y = d.toISOString().slice(0, 10); setDateDesde(y); setDateHasta(y); }} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Ayer</button>
          <button type="button" onClick={() => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 6); setDateDesde(start.toISOString().slice(0, 10)); setDateHasta(end.toISOString().slice(0, 10)); }} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Últimos 7 días</button>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Desde:</label>
          <input type="date" value={dateDesde || defaultDesde} onChange={e => setDateDesde(e.target.value)}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontFamily: "inherit" }} />
          <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Hasta:</label>
          <input type="date" value={dateHasta || today} onChange={e => setDateHasta(e.target.value)}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontFamily: "inherit" }} />
          <span style={{ fontSize: 11, color: "#94A3B8" }}>Rango: {desdeDisplay} → {hastaDisplay}</span>
          <button onClick={fetchReports} disabled={loadingRep}
            style={{ background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: loadingRep ? "wait" : "pointer", fontFamily: "inherit", minWidth: 90 }}>
            {loadingRep ? "Cargando…" : "Actualizar"}
          </button>
        </div>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748B" }}>Elige un rango de fechas (Desde / Hasta). Se muestran ventas por día, por semana, top productos y totales en ese rango. Pedidos pendientes, en sistema y stock bajo: estado actual.</p>

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
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", animation: "cardIn 0.35s ease-out 0.2s forwards", opacity: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#0F172A" }}>⚠️ Stock Bajo</div>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>Variantes con ≤ 3 unidades disponibles (stock − reservado)</div>
            {balances.filter(b => {
              const stock    = b.stock    ?? b.quantity    ?? 0;
              const reserved = b.reserved ?? b.reservedQty ?? 0;
              return (stock - reserved) <= 3;
            }).length === 0 ? (
              <div style={{ color: "#10B981", fontSize: 13, fontWeight: 600 }}>✓ Todo en orden</div>
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
