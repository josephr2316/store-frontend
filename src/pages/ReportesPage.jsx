import { useState, useEffect } from "react";
import { reportsApi } from "../api/client";
import { fmtCurrency } from "../utils/index";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: "20px 20px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ─── WEEKLY SALES CHART ───────────────────────────────────────────────────────

function WeeklyChart({ data }) {
  // data may be: [{ date, total }] or { [date]: total } or [{ day, sales }]
  const normalised = (() => {
    if (!data) return [];
    if (Array.isArray(data)) {
      return data.map(d => [
        d.date || d.day || d.week || Object.keys(d)[0],
        d.total ?? d.sales ?? d.amount ?? Object.values(d)[0] ?? 0,
      ]);
    }
    return Object.entries(data).sort();
  })();

  const max = Math.max(...normalised.map(d => d[1]), 1);

  return (
    <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Ventas Semanales</div>
      {normalised.length === 0 ? (
        <div style={{ color: "#C4C4C4", textAlign: "center", padding: 40 }}>Sin datos</div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>
          {normalised.map(([date, val], i) => {
            const h = Math.max(6, (val / max) * 160);
            return (
              <div key={date != null ? String(date) : `idx-${i}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6366F1" }}>
                  {fmtCurrency(val).replace("RD$", "")}
                </div>
                <div style={{ width: "100%", background: "#6366F1", borderRadius: "6px 6px 0 0", height: h, transition: "height 0.3s", minHeight: 6 }} />
                <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>
                  {String(date).slice(-5)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TOP PRODUCTS ─────────────────────────────────────────────────────────────

function TopProducts({ data }) {
  // data may be: [{ productName, quantity }] or [{ name, sold }] or [[name, qty]]
  const normalised = (() => {
    if (!data || !data.length) return [];
    if (Array.isArray(data[0])) return data; // already [name, qty]
    return data.map(d => [
      d.productName || d.name || d.product || "—",
      d.quantity    || d.sold || d.count   || 0,
    ]);
  })().slice(0, 5);

  const maxQty = normalised[0]?.[1] || 1;

  return (
    <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Top Productos</div>
      {normalised.length === 0 ? (
        <div style={{ color: "#C4C4C4", fontSize: 13 }}>Sin datos</div>
      ) : normalised.map(([name, qty], i) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%",
            background: i === 0 ? "#6366F1" : i === 1 ? "#8B5CF6" : "#A78BFA",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff" }}>
            {i + 1}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
            <div style={{ height: 4, background: "#F3F4F6", borderRadius: 4, marginTop: 3 }}>
              <div style={{ height: "100%", borderRadius: 4, background: "#6366F1", width: `${(qty / maxQty) * 100}%` }} />
            </div>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>{qty}</span>
        </div>
      ))}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ReportesPage({ store }) {
  const { orders, balances } = store;
  const [weeklySales, setWeeklySales] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [weekInput,   setWeekInput]   = useState(new Date().toISOString().slice(0, 10));
  const [loadingRep,  setLoadingRep]  = useState(false);

  const fetchReports = async (week) => {
    setLoadingRep(true);
    try {
      const [sales, tops] = await Promise.all([
        reportsApi.weeklySales(week),
        reportsApi.topProducts(),
      ]);
      setWeeklySales(sales);
      setTopProducts(tops);
    } catch (e) {
      console.error("Reports error:", e);
    } finally {
      setLoadingRep(false);
    }
  };

  useEffect(() => { fetchReports(weekInput); }, []);

  // Derive stats from cached orders
  const pendingCount  = orders.filter(o => (o.state || o.status) === "PENDING").length;
  const weekRevenue   = (() => {
    if (!weeklySales) return 0;
    if (typeof weeklySales === "number") return weeklySales;
    if (Array.isArray(weeklySales)) return weeklySales.reduce((s, d) => s + (d.total ?? d.sales ?? d.amount ?? (Array.isArray(d) ? d[1] : 0)), 0);
    if (typeof weeklySales === "object") return Object.values(weeklySales).reduce((s, v) => s + (Number(v) || 0), 0);
    return 0;
  })();

  const lowStockCount = balances.filter(b => {
    const stock    = b.stock    ?? b.quantity    ?? 0;
    const reserved = b.reserved ?? b.reservedQty ?? 0;
    return (stock - reserved) <= 3;
  }).length;

  const statCards = [
    { label: "Pedidos Pendientes",   value: pendingCount,       sub: "Requieren atención",     color: "#F59E0B" },
    { label: "Ventas Semana",        value: fmtCurrency(weekRevenue), sub: "Pedidos entregados", color: "#6366F1" },
    { label: "Variantes Bajo Stock", value: lowStockCount,      sub: "≤ 3 unidades disp.",     color: "#EF4444" },
    { label: "Pedidos en Sistema",   value: orders.length,      sub: "Total registrados",      color: "#10B981" },
  ];

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Reportes</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Semana:</label>
          <input type="date" value={weekInput} onChange={e => setWeekInput(e.target.value)}
            style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontFamily: "inherit" }} />
          <button onClick={() => fetchReports(weekInput)} disabled={loadingRep}
            style={{ background: "#6366F1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {loadingRep ? "..." : "Actualizar"}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {statCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        <WeeklyChart data={weeklySales} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TopProducts data={topProducts} />

          {/* Low stock */}
          <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>⚠️ Stock Bajo</div>
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
                  const avail = (b.stock ?? b.quantity ?? 0) - (b.reserved ?? b.reservedQty ?? 0);
                  const label = b.variantLabel || b.variant?.label || `Variante ${b.variantId ?? b.id}`;
                  return (
                    <div key={b.variantId ?? b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F0F0F0", fontSize: 13 }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 700, color: avail === 0 ? "#DC2626" : "#D97706" }}>
                        {avail === 0 ? "Agotado" : `${avail} un.`}
                      </span>
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
