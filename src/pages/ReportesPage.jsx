import { useState, useEffect } from "react";
import { reportsApi } from "../api/client";
import { fmtCurrency } from "../utils/index";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, delay = 0 }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 18px", minWidth: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", animation: "cardIn 0.35s ease-out forwards", animationDelay: `${delay}ms`, opacity: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Gráfica por rango: muchas semanas (desde/hasta = 1 año) */
function RangeChart({ rangeData, loading, from, to }) {
  const bars = (rangeData?.byWeek || []).map((w, i) => ({
    label: w.periodStart ? String(w.periodStart).slice(5) : "",
    amount: Number(w.totalAmount ?? 0),
    count: Number(w.orderCount ?? 0),
    date: w.periodStart,
    key: w.periodStart ?? i,
  }));
  const totalAmount = Number(rangeData?.totalAmount ?? 0) || bars.reduce((s, b) => s + b.amount, 0);
  const totalOrders = Number(rangeData?.totalOrders ?? 0) || bars.reduce((s, b) => s + b.count, 0);
  const max = Math.max(...bars.map(b => b.amount), 1);
  const hasData = bars.length > 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, minHeight: 280, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#0F172A" }}>Ventas por semana (último año)</div>
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
      ) : !hasData ? (
        <div style={{ color: "#9CA3AF", textAlign: "center", padding: 40, fontSize: 14 }}>Sin datos en este rango</div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180, minWidth: Math.max(bars.length * 24, 400) }}>
            {bars.map((bar, i) => {
              const h = Math.max(4, (bar.amount / max) * 160);
              return (
                <div key={bar.key ?? i} style={{ flex: "0 0 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "#6366F1" }}>
                    {bar.amount > 0 ? fmtCurrency(bar.amount).replace("RD$", "").trim() : "—"}
                  </div>
                  <div style={{ width: 16, background: bar.amount > 0 ? "#6366F1" : "#E2E8F0", borderRadius: "4px 4px 0 0", height: h, minHeight: 4 }} />
                  <div style={{ fontSize: 9, color: "#64748B", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{bar.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Gráfica una semana (7 días) */
function WeeklyChart({ data, loading }) {
  const { bars, totalAmount, totalOrders, weekStart } = (() => {
    if (!data) return { bars: [], totalAmount: 0, totalOrders: 0, weekStart: null };
    if (data.dailyBreakdown && Array.isArray(data.dailyBreakdown) && data.dailyBreakdown.length > 0) {
      const bars = data.dailyBreakdown.map(d => ({
        label: d.date ? (DAY_LABELS[(new Date(d.date).getDay() + 6) % 7] || String(d.date).slice(5)) : "",
        amount: Number(d.totalAmount ?? 0),
        count: Number(d.orderCount ?? 0),
        date: d.date,
      }));
      return { bars, totalAmount: bars.reduce((s, b) => s + b.amount, 0), totalOrders: bars.reduce((s, b) => s + b.count, 0), weekStart: data.weekStart };
    }
    if (Array.isArray(data)) {
      const bars = data.map((d, i) => {
        const date = d.date || d.day || d.week || Object.keys(d)[0];
        const val = d.total ?? d.sales ?? d.amount ?? Object.values(d)[0] ?? 0;
        return { label: String(date).slice(-5), amount: Number(val) || 0, count: 0, date: date ?? `idx-${i}` };
      });
      return { bars, totalAmount: bars.reduce((s, b) => s + b.amount, 0), totalOrders: 0, weekStart: data.weekStart ?? null };
    }
    if (typeof data.totalAmount === "number" || data.totalAmount != null) {
      const amt = Number(data.totalAmount) || 0;
      return { bars: [{ label: "Total", amount: amt, count: Number(data.orderCount) || 0, date: data.weekStart }], totalAmount: amt, totalOrders: Number(data.orderCount) || 0, weekStart: data.weekStart };
    }
    const entries = Object.entries(data).filter(([, v]) => typeof v === "number" && !Number.isNaN(v));
    const bars = entries.map(([k, v]) => ({ label: String(k).slice(-5), amount: v, count: 0, date: k }));
    return { bars, totalAmount: bars.reduce((s, b) => s + b.amount, 0), totalOrders: 0, weekStart: null };
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
  const items = content.map(d => [
    d.variantSku ?? d.productName ?? d.name ?? d.product ?? "—",
    d.quantitySold ?? d.quantity ?? d.sold ?? d.count ?? 0,
  ]);
  const maxQty = Math.max(...items.map(([, q]) => q), 1);
  const pageIndex = page ?? 0;
  const start = pageIndex * (pageSize || 10) + 1;

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
        <div style={{ color: "#9CA3AF", fontSize: 13 }}>Sin datos en este período</div>
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
              <span>{totalElements} producto{totalElements !== 1 ? "s" : ""} en total</span>
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
  const { orders, balances } = store;
  const today = new Date().toISOString().slice(0, 10);
  const [dateHasta, setDateHasta] = useState(today);
  const [salesInRange, setSalesInRange] = useState(null);
  const [topProductsPaged, setTopProductsPaged] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loadingRep, setLoadingRep] = useState(true);

  const desde = lastYearFrom(dateHasta);

  const fetchRangeAndTops = async (hasta, p, size) => {
    setLoadingRep(true);
    store.setError(null);
    const fromInst = toInstantStart(desde);
    const toInst = toInstantEnd(hasta);
    try {
      const [range, tops] = await Promise.all([
        reportsApi.salesInRange(desde, hasta),
        reportsApi.topProducts(p, size, fromInst, toInst),
      ]);
      setSalesInRange(range);
      setTopProductsPaged(tops);
    } catch (e) {
      const msg = e?.message === "Failed to fetch" ? "No se pudo conectar con el servidor." : (e?.message || "Error al cargar reportes.");
      store.setError(msg);
    } finally {
      setLoadingRep(false);
    }
  };

  const fetchReports = () => {
    setPage(0);
    fetchRangeAndTops(dateHasta, 0, pageSize);
  };

  useEffect(() => {
    fetchRangeAndTops(dateHasta, 0, pageSize);
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setLoadingRep(true);
    store.setError(null);
    reportsApi.topProducts(newPage, pageSize, toInstantStart(desde), toInstantEnd(dateHasta))
      .then(setTopProductsPaged)
      .catch(e => store.setError(e?.message || "Error"))
      .finally(() => setLoadingRep(false));
  };

  const handleSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(0);
    setLoadingRep(true);
    store.setError(null);
    reportsApi.topProducts(0, newSize, toInstantStart(desde), toInstantEnd(dateHasta))
      .then(setTopProductsPaged)
      .finally(() => setLoadingRep(false));
  };

  const pendingCount = orders.filter(o => (o.state || o.status) === "PENDING").length;
  const periodRevenue = Number(salesInRange?.totalAmount ?? 0) || 0;
  const periodOrders = Number(salesInRange?.totalOrders ?? 0) || 0;
  const lowStockCount = balances.filter(b => {
    const stock = b.stock ?? b.quantity ?? 0;
    const reserved = b.reserved ?? b.reservedQty ?? 0;
    return (stock - reserved) <= 3;
  }).length;

  const statCards = [
    { label: "Pedidos Pendientes", value: pendingCount, sub: "Requieren atención", color: "#F59E0B" },
    { label: "Ventas en período", value: fmtCurrency(periodRevenue), sub: `Último año hasta ${dateHasta} · ${periodOrders} entregados`, color: "#6366F1" },
    { label: "Variantes Bajo Stock", value: lowStockCount, sub: "≤ 3 unidades disp.", color: "#EF4444" },
    { label: "Pedidos en Sistema", value: orders.length, sub: "Total registrados", color: "#10B981" },
  ];

  return (
    <div style={{ padding: "24px 28px", overflowY: "auto", height: "100%", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0F0F19" }}>Reportes</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto", flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Hasta (fecha):</label>
          <input type="date" value={dateHasta} onChange={e => setDateHasta(e.target.value)}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontFamily: "inherit" }} />
          <span style={{ fontSize: 11, color: "#94A3B8" }}>Desde {desde} (1 año atrás)</span>
          <button onClick={fetchReports} disabled={loadingRep}
            style={{ background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: loadingRep ? "wait" : "pointer", fontFamily: "inherit", minWidth: 90 }}>
            {loadingRep ? "Cargando…" : "Actualizar"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {statCards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 60} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        <RangeChart rangeData={salesInRange} loading={loadingRep} from={desde} to={dateHasta} />
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
                .filter(b => { const s = (b.stock ?? b.quantity ?? 0) - (b.reserved ?? b.reservedQty ?? 0); return s <= 3; })
                .map(b => {
                  const stock = b.stock ?? b.quantity ?? 0;
                  const reserved = b.reserved ?? b.reservedQty ?? 0;
                  const avail = Math.max(0, stock - reserved);
                  const label = b.variantSku || b.variantLabel || b.variant?.label || `Variante ${b.variantId ?? b.id}`;
                  const status = avail === 0 ? "Agotado" : "Bajo stock";
                  const statusColor = avail === 0 ? "#DC2626" : "#D97706";
                  return (
                    <div key={b.variantId ?? b.id} style={{ padding: "10px 0", borderBottom: "1px solid #F0F0F0", fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                        <span style={{ fontWeight: 600, color: "#0F172A" }}>{label}</span>
                        <span style={{ fontWeight: 700, color: statusColor, fontSize: 12 }}>{status}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: "#64748B" }}>
                        <span>Stock: <strong>{stock}</strong></span>
                        <span>Reservado: <strong>{reserved}</strong></span>
                        <span>Disponible: <strong style={{ color: avail === 0 ? "#DC2626" : "#0F172A" }}>{avail}</strong></span>
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
