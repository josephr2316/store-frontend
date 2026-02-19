import { useState, useEffect } from "react";
import { reportsApi } from "../api/client";
import { fmtCurrency } from "../utils/index";
import { theme } from "../theme";

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
  background: theme.bgCard,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radiusLg,
  padding: `${theme.space(5)} ${theme.space(6)}`,
  minWidth: 0,
  boxShadow: theme.shadowMd,
};

function StatCard({ label, value, sub, color, delay = 0 }) {
  return (
    <div
      className="reportes-stat-card"
      style={{ ...CARD_STYLE, animation: "cardIn 0.35s ease-out forwards", animationDelay: `${delay}ms`, opacity: 0, transition: "box-shadow 0.2s ease" }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: theme.space(2) }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{safeDisplay(value)}</div>
      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: theme.space(2), lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

/** Generates weeks between two dates */
function weeksBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return [];
  const from = new Date(fromStr); const to = new Date(toStr);
  const out = []; const d = new Date(from);
  while (d <= to && out.length < 53) {
    out.push({ periodStart: d.toISOString().slice(0, 10), totalAmount: 0, orderCount: 0 });
    d.setDate(d.getDate() + 7);
  }
  return out;
}

/** Generates days between two dates */
function daysBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return [];
  const from = new Date(fromStr); const to = new Date(toStr);
  const out = []; const d = new Date(from);
  for (let n = 0; n < 366 && d <= to; n++) {
    out.push({ date: d.toISOString().slice(0, 10), totalAmount: 0, orderCount: 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * TradingView-style SVG area chart.
 * - Gradient fill below the line
 * - Sparse X labels (only when month changes, or every N points)
 * - Y-axis scale ticks
 * - Tooltip on hover
 */
function AreaChart({ points, color, gradientId, totalAmount, totalOrders, from, to, loading, title, emptyMsg, periodLabel = "Semana" }) {
  const [tooltip, setTooltip] = useState(null);
  const [chartVisible, setChartVisible] = useState(false);
  useEffect(() => {
    if (!loading && points.length > 0) {
      const t = setTimeout(() => setChartVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setChartVisible(false);
    }
  }, [loading, points.length]);

  const W = 700, H = 220, PAD_L = 58, PAD_R = 24, PAD_T = 20, PAD_B = 40;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const n = points.length;
  const maxVal = Math.max(...points.map(p => p.amount), 1);

  // Compute x,y for each point
  const pts = points.map((p, i) => ({
    ...p,
    x: PAD_L + (n <= 1 ? plotW / 2 : (i / Math.max(1, n - 1)) * plotW),
    y: PAD_T + plotH - (p.amount / maxVal) * plotH,
  }));

  // Build smooth SVG path using cubic bezier
  const linePath = pts.length < 2
    ? (pts.length === 1 ? `M${pts[0].x},${pts[0].y}` : "")
    : pts.reduce((acc, p, i) => {
        if (i === 0) return `M${p.x},${p.y}`;
        const prev = pts[i - 1];
        const cx1 = prev.x + (p.x - prev.x) * 0.4;
        const cx2 = p.x  - (p.x - prev.x) * 0.4;
        return `${acc} C${cx1},${prev.y} ${cx2},${p.y} ${p.x},${p.y}`;
      }, "");

  const areaPath = pts.length < 2 ? "" :
    `${linePath} L${pts[pts.length-1].x},${PAD_T+plotH} L${pts[0].x},${PAD_T+plotH} Z`;

  // Y ticks (0, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    y: PAD_T + plotH - t * plotH,
    val: t * maxVal,
  }));

  // X labels: max 8 evenly spaced to avoid overlap (especially for 1 year / 52 points)
  const MAX_X_LABELS = 8;
  const xLabelIndices = n <= MAX_X_LABELS
    ? [...Array(n)].map((_, i) => i)
    : [...Array(MAX_X_LABELS)].map((_, k) => (k === MAX_X_LABELS - 1 ? n - 1 : Math.round((k / (MAX_X_LABELS - 1)) * (n - 1))));
  const xLabels = [...new Set(xLabelIndices)]
    .sort((a, b) => a - b)
    .map(i => pts[i])
    .filter(Boolean);

  const fmtXLabel = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${MONTH_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  };

  const fmtYTick = (val) => {
    if (val >= 1_000_000) return `${(val/1_000_000).toFixed(1)}M`;
    if (val >= 1_000)     return `${(val/1_000).toFixed(0)}K`;
    return val === 0 ? "0" : val.toFixed(0);
  };

  return (
    <div style={{ ...CARD_STYLE, padding: "20px 24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: theme.text, letterSpacing: "-0.02em" }}>{title}</div>
          {from && to && (
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: theme.space(1) }}>
              {String(from).slice(0,10)} → {String(to).slice(0,10)} ·{" "}
              <strong style={{ color }}>{fmtCurrency(safeNum(totalAmount))}</strong> ·{" "}
              {safeNum(totalOrders)} entregado{safeNum(totalOrders) !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        {tooltip && (
          <div style={{ background: "#0F172A", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12, lineHeight: 1.5 }}>
            <div style={{ color: theme.textSubtle, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{periodLabel}{tooltip.date ? ` · ${fmtXLabel(tooltip.date)}` : ""}</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtCurrency(tooltip.amount)}</div>
          </div>
        )}
      </div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: H, gap: theme.space(3), color: theme.textMuted, fontSize: 14 }}>
          <span style={{ width: 24, height: 24, border: `2px solid ${theme.border}`, borderTopColor: color, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Cargando…
        </div>
      ) : pts.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: H, color: theme.textMuted, fontSize: 14, background: theme.bg, borderRadius: theme.radius }}>
          {emptyMsg || "Sin datos en este rango"}
        </div>
      ) : (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", overflow: "visible" }}
          onMouseLeave={() => setTooltip(null)}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {yTicks.map((t, i) => (
            <line key={i} x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y}
              stroke="#E2E8F0" strokeWidth={i === yTicks.length - 1 ? 1.5 : 0.8} strokeDasharray={i === yTicks.length - 1 ? "" : "4 3"} />
          ))}
          {/* Area + line with load-in effect */}
          <g style={{ opacity: chartVisible ? 1 : 0, transition: "opacity 0.4s ease-out" }}>
            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
            {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />}
          </g>
          {/* Y-axis labels — aligned and readable */}
          {yTicks.map((t, i) => (
            <text key={i} x={PAD_L - 10} y={t.y} textAnchor="end" dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#475569" fontFamily="inherit">
              {fmtYTick(t.val)}
            </text>
          ))}
          {/* X-axis labels — max 8, no overlap */}
          {xLabels.map((p, i) => (
            <text key={i} x={p.x} y={H - 12} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#475569" fontFamily="inherit">
              {fmtXLabel(p.date)}
            </text>
          ))}
          {/* Hover regions — invisible rects per point */}
          {pts.map((p, i) => {
            const halfStep = n <= 1 ? plotW / 2 : plotW / n / 2;
            return (
              <rect key={i}
                x={p.x - halfStep} y={PAD_T}
                width={halfStep * 2} height={plotH + PAD_B}
                fill="transparent"
                onMouseEnter={() => setTooltip({ amount: p.amount, date: p.date ? String(p.date).slice(0,10) : "" })}
              />
            );
          })}
          {/* Tooltip dot */}
          {tooltip && (() => {
            const tp = pts.find(p => String(p.date).slice(0,10) === tooltip.date);
            if (!tp) return null;
            return (
              <>
                <line x1={tp.x} y1={PAD_T} x2={tp.x} y2={PAD_T + plotH} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
                <circle cx={tp.x} cy={tp.y} r={5} fill="#fff" stroke={color} strokeWidth={2} />
              </>
            );
          })()}
        </svg>
      )}
    </div>
  );
}

/** Daily sales chart — TradingView area style */
function DayChart({ rangeData, loading, from, to }) {
  const apiDays = rangeData?.byDay || [];
  const fallbackDays = from && to ? daysBetween(from, to) : [];
  const source = apiDays.length > 0 ? apiDays : fallbackDays;
  const all = source.map((d, i) => ({
    date: d.date ?? `d-${i}`,
    amount: safeNum(d.totalAmount),
    count: safeNum(d.orderCount),
  }));
  const capped = all.length > MAX_DAILY_BARS ? all.slice(-MAX_DAILY_BARS) : all;
  const totalAmount = safeNum(rangeData?.totalAmount) || all.reduce((s, b) => s + b.amount, 0);
  const totalOrders = safeNum(rangeData?.totalOrders) || all.reduce((s, b) => s + b.count, 0);

  return (
    <AreaChart
      points={capped}
      color={COLORS.primary}
      gradientId="dayGrad"
      totalAmount={totalAmount}
      totalOrders={totalOrders}
      from={from} to={to}
      loading={loading}
      title="Ventas por día"
      emptyMsg="Sin datos. Usa 7 días, 1 mes o Último año."
      periodLabel="Día"
    />
  );
}

/** Weekly sales chart — TradingView area style */
function RangeChart({ rangeData, loading, from, to }) {
  const apiWeeks = rangeData?.byWeek || [];
  const fallbackWeeks = from && to ? weeksBetween(from, to) : [];
  const source = apiWeeks.length > 0 ? apiWeeks : fallbackWeeks;
  const all = source.map((w, i) => ({
    date: w.periodStart ?? `w-${i}`,
    amount: safeNum(w.totalAmount),
    count: safeNum(w.orderCount),
  }));
  const capped = all.length > MAX_WEEKLY_BARS ? all.slice(-MAX_WEEKLY_BARS) : all;
  const totalAmount = safeNum(rangeData?.totalAmount) || all.reduce((s, b) => s + b.amount, 0);
  const totalOrders = safeNum(rangeData?.totalOrders) || all.reduce((s, b) => s + b.count, 0);

  return (
    <AreaChart
      points={capped}
      color={COLORS.accent}
      gradientId="weekGrad"
      totalAmount={totalAmount}
      totalOrders={totalOrders}
      from={from} to={to}
      loading={loading}
      title="Ventas por semana"
      emptyMsg="Sin datos. Usa 1 mes o Último año."
    />
  );
}

/** Single week chart (7 days) — bar style kept for daily granularity */
function WeeklyChart({ data, loading }) {
  const { points, totalAmount, totalOrders, weekStart } = (() => {
    if (!data) return { points: [], totalAmount: 0, totalOrders: 0, weekStart: null };
    if (data.dailyBreakdown && Array.isArray(data.dailyBreakdown) && data.dailyBreakdown.length > 0) {
      const pts = data.dailyBreakdown.map(d => ({
        date: d.date ?? "",
        label: d.date ? (DAY_LABELS[(new Date(d.date).getDay() + 6) % 7] ?? String(d.date).slice(5)) : "",
        amount: safeNum(d.totalAmount),
        count: safeNum(d.orderCount),
      }));
      return { points: pts, totalAmount: pts.reduce((s, b) => s + b.amount, 0), totalOrders: pts.reduce((s, b) => s + b.count, 0), weekStart: data.weekStart };
    }
    return { points: [], totalAmount: 0, totalOrders: 0, weekStart: null };
  })();

  const max = Math.max(...points.map(p => p.amount), 1);

  return (
    <div style={{ ...CARD_STYLE, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: "#0F172A" }}>Ventas Semanales</div>
      {weekStart && (
        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>
          Semana del {typeof weekStart === "string" ? weekStart.slice(0,10) : weekStart} ·{" "}
          <strong style={{ color: COLORS.success }}>{fmtCurrency(totalAmount)}</strong> ·{" "}
          {totalOrders} entregado{totalOrders !== 1 ? "s" : ""}
        </div>
      )}
      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40, gap:8, color:"#64748B", fontSize:14 }}>Cargando...</div>
      ) : points.length === 0 ? (
        <div style={{ color:"#9CA3AF", textAlign:"center", padding:40, fontSize:14 }}>Sin datos para esta semana</div>
      ) : (
        <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:160, padding:"0 4px" }}>
          {points.map((p) => {
            const h = Math.max(6, (p.amount / max) * 140);
            return (
              <div key={p.date || p.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                {p.amount > 0 && <div style={{ fontSize:9, fontWeight:700, color:COLORS.success }}>{fmtCurrency(p.amount).replace("RD$","").trim()}</div>}
                <div style={{ width:"80%", background: p.amount > 0 ? `linear-gradient(180deg,${COLORS.success} 0%,#059669 100%)` : "#E2E8F0", borderRadius:"4px 4px 0 0", height:h, minHeight:6 }} />
                <div style={{ fontSize:10, color:"#64748B", fontWeight:600 }}>{p.label}</div>
                {p.count > 0 && <div style={{ fontSize:9, color:"#94A3B8" }}>{p.count}p</div>}
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
    <div style={{ ...CARD_STYLE, padding: theme.space(6), minHeight: 260 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: theme.space(2), marginBottom: theme.space(4) }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.text, letterSpacing: "-0.02em" }}>Top Productos</div>
        <div style={{ display: "flex", alignItems: "center", gap: theme.space(2), fontSize: 12 }}>
          <label style={{ color: theme.textMuted, fontWeight: 600 }}>Mostrar:</label>
          <select className="reportes-select" value={pageSize} onChange={e => onSizeChange?.(Number(e.target.value))} style={{ border: `1px solid ${theme.border}`, borderRadius: theme.radiusSm, padding: "6px 10px", fontSize: 12, fontFamily: theme.fontFamily }}>{[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}</select>
        </div>
      </div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: theme.space(6), gap: theme.space(2), color: theme.textMuted, fontSize: 14 }}>Cargando…</div>
      ) : items.length === 0 ? (
        <div style={{ color: theme.textMuted, fontSize: 14, padding: theme.space(4), background: theme.bg, borderRadius: theme.radius }}>No hay productos vendidos en el rango. Usa el atajo <strong>Último año</strong> para ver datos del año anterior.</div>
      ) : (
        <>
          {items.map(([name, qty], i) => (
            <div key={`${name}-${start + i}`} className="top-products-row" style={{ display: "flex", alignItems: "center", gap: theme.space(2), marginBottom: theme.space(2), padding: theme.space(1), borderRadius: theme.radius, transition: "background 0.15s ease" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? COLORS.primary : i === 1 ? COLORS.accent : theme.success, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{start + i}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{name}</div>
                <div style={{ height: 5, background: theme.borderLight, borderRadius: theme.radiusSm, marginTop: 4 }}>
                  <div style={{ height: "100%", borderRadius: theme.radiusSm, background: theme.primary, width: `${(qty / maxQty) * 100}%`, transition: "width 0.3s ease" }} />
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: theme.text, flexShrink: 0 }}>{qty}</span>
            </div>
          ))}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: theme.space(3), paddingTop: theme.space(3), borderTop: `1px solid ${theme.border}`, fontSize: 12, color: theme.textMuted }}>
              <span>{safeDisplay(totalElements)} producto{safeNum(totalElements) !== 1 ? "s" : ""} en total</span>
              <div style={{ display: "flex", alignItems: "center", gap: theme.space(2) }}>
                <button type="button" className="reportes-pagination-btn" onClick={() => onPageChange?.(pageIndex - 1)} disabled={pageIndex <= 0} style={{ border: `1px solid ${theme.border}`, background: theme.bgCard, borderRadius: theme.radiusSm, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: pageIndex <= 0 ? "not-allowed" : "pointer", opacity: pageIndex <= 0 ? 0.6 : 1, transition: "background 0.15s, color 0.15s" }}>Anterior</button>
                <span>Pág. {pageIndex + 1} de {totalPages}</span>
                <button type="button" className="reportes-pagination-btn" onClick={() => onPageChange?.(pageIndex + 1)} disabled={pageIndex >= totalPages - 1} style={{ border: `1px solid ${theme.border}`, background: theme.bgCard, borderRadius: theme.radiusSm, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: pageIndex >= totalPages - 1 ? "not-allowed" : "pointer", opacity: pageIndex >= totalPages - 1 ? 0.6 : 1, transition: "background 0.15s, color 0.15s" }}>Siguiente</button>
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
  const [activePreset, setActivePreset] = useState("1 año");
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
    { label: "Pedidos Pendientes", value: safeDisplay(pendingCount), sub: "Requieren atención", color: theme.warning },
    { label: "Ventas en período", value: fmtCurrency(periodRevenue), sub: `Desde ${desdeDisplay} hasta ${hastaDisplay} · ${safeDisplay(periodOrders)} entregados`, color: theme.primary },
    { label: "Variantes Bajo Stock", value: safeDisplay(lowStockCount), sub: "≤ 3 unidades disp.", color: theme.error },
    { label: "Pedidos en Sistema", value: safeDisplay(totalOrdersInSystem), sub: "Total registrados", color: theme.success },
  ];

  const setRangePreset = (days, label) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateDesde(start.toISOString().slice(0, 10));
    setDateHasta(end.toISOString().slice(0, 10));
    if (label) setActivePreset(label);
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
    <div style={{ padding: `${theme.space(7)} ${theme.space(8)}`, overflowY: "auto", height: "100%", maxWidth: 1440, margin: "0 auto", background: theme.bg, fontFamily: theme.fontFamily }}>
      <style>{`
        .reportes-stat-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
        .top-products-row:hover { background: ${theme.bg}; }
        .low-stock-row:hover { background: ${theme.bg}; }
        .reportes-pagination-btn:hover:not(:disabled) { background: ${theme.borderLight}; color: ${theme.text}; }
        .reportes-export-btn:hover:not(:disabled) { background: #059669; box-shadow: 0 2px 8px rgba(16,185,129,0.35); }
        .reportes-filter-btn:not(.reportes-filter-active):hover { background: ${theme.borderLight}; color: ${theme.text}; }
      `}</style>
      <div style={{ marginBottom: theme.space(6), paddingBottom: theme.space(5), borderBottom: `1px solid ${theme.border}` }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.text, letterSpacing: "-0.02em" }}>Reportes</h2>
        <p style={{ margin: `${theme.space(2)} 0 0`, fontSize: 14, color: theme.textMuted, maxWidth: 720, lineHeight: 1.5 }}>
          Ventas por semana y productos top según el rango elegido. Datos desde hace un año hasta hoy. Pedidos pendientes, en sistema y stock bajo reflejan el estado actual.
        </p>
      </div>

      <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: theme.radiusMd, padding: `${theme.space(5)} ${theme.space(6)}`, marginBottom: theme.space(6), boxShadow: theme.shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: theme.space(3), flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted }}>Escala:</span>
          {(() => {
            const btnBase = { borderRadius: theme.radius, padding: `${theme.space(2)} ${theme.space(3)}`, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", outline: "none" };
            const presets = [
              { label: "1 día",   onClick: () => { setDateDesde(today); setDateHasta(today); setActivePreset("1 día"); } },
              { label: "7 días",  onClick: () => setRangePreset(7,  "7 días")  },
              { label: "15 días", onClick: () => setRangePreset(15, "15 días") },
              { label: "1 mes",   onClick: () => setRangePreset(30, "1 mes")   },
              { label: "3 meses", onClick: () => setRangePreset(90, "3 meses") },
              { label: "6 meses", onClick: () => setRangePreset(180,"6 meses") },
              { label: "9 meses", onClick: () => setRangePreset(270,"9 meses") },
              { label: "1 año",   onClick: () => { setDateDesde(defaultDesde); setDateHasta(today); setActivePreset("1 año"); } },
            ];
            return (
              <div style={{ display: "flex", alignItems: "center", gap: theme.space(1), flexWrap: "wrap" }}>
                {presets.map(p => {
                  const isActive = activePreset === p.label;
                  return (
                    <button key={p.label} type="button" className={`reportes-filter-btn${isActive ? " reportes-filter-active" : ""}`} onClick={p.onClick}
                      style={isActive
                        ? { ...btnBase, border: `2px solid ${theme.primary}`, background: theme.primaryLight, color: theme.primaryHover, boxShadow: `0 0 0 3px ${theme.primaryMuted}40` }
                        : { ...btnBase, border: `1px solid ${theme.border}`, background: theme.bgCard, color: theme.textMuted }}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            );
          })()}
          <label style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginLeft: theme.space(1) }}>Desde</label>
          <input type="date" className="reportes-date" value={dateDesde || defaultDesde} onChange={e => { setDateDesde(e.target.value); setActivePreset(null); }}
            style={{ border: `1.5px solid ${theme.border}`, borderRadius: theme.radius, padding: `${theme.space(2)} ${theme.space(3)}`, fontSize: 13, fontFamily: "inherit" }} />
          <label style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted }}>Hasta</label>
          <input type="date" className="reportes-date" value={dateHasta || today} onChange={e => { setDateHasta(e.target.value); setActivePreset(null); }}
            style={{ border: `1.5px solid ${theme.border}`, borderRadius: theme.radius, padding: `${theme.space(2)} ${theme.space(3)}`, fontSize: 13, fontFamily: "inherit" }} />
          <span style={{ fontSize: 12, color: theme.textSubtle }}>{desdeDisplay} → {hastaDisplay}</span>
          <button onClick={fetchReports} disabled={loadingRep}
            style={{ marginLeft: "auto", background: theme.primary, color: "#fff", border: "none", borderRadius: theme.radius, padding: `${theme.space(2)} ${theme.space(5)}`, fontSize: 13, fontWeight: 600, cursor: loadingRep ? "wait" : "pointer", fontFamily: "inherit", minWidth: 100, boxShadow: theme.shadow, transition: "box-shadow 0.2s" }}>
            {loadingRep ? "Cargando…" : "Actualizar"}
          </button>
          <button type="button" className="reportes-export-btn" onClick={exportToExcel} disabled={loadingRep}
            style={{ background: theme.success, color: "#fff", border: "none", borderRadius: theme.radius, padding: `${theme.space(2)} ${theme.space(4)}`, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s, box-shadow 0.2s" }}>
            Exportar Excel
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: theme.space(4), marginBottom: theme.space(6) }}>
        {statCards.map((c, i) => <StatCard key={c.label} {...c} delay={i * 60} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: theme.space(6), alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <DayChart rangeData={salesInRange} loading={loadingRep} from={desde} to={hasta} />
          <RangeChart rangeData={salesInRange} loading={loadingRep} from={desde} to={hasta} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: theme.space(4) }}>
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
          <div style={{ ...CARD_STYLE, padding: theme.space(6) }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: theme.space(1), color: theme.text, letterSpacing: "-0.02em" }}>Stock Bajo</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: theme.space(3) }}>Variantes con ≤ 3 unidades disponibles (stock − reservado)</div>
            {balances.filter(b => {
              const stock    = b.stock    ?? b.quantity    ?? 0;
              const reserved = b.reserved ?? b.reservedQty ?? 0;
              return (stock - reserved) <= 3;
            }).length === 0 ? (
              <div style={{ color: theme.success, fontSize: 14, fontWeight: 600 }}>Todo en orden</div>
            ) : (
              balances
                .filter(b => { const s = safeNum(b.stock ?? b.quantity) - safeNum(b.reserved ?? b.reservedQty); return s <= 3; })
                .map((b, idx) => {
                  const stock = safeNum(b.stock ?? b.quantity);
                  const reserved = safeNum(b.reserved ?? b.reservedQty);
                  const avail = Math.max(0, stock - reserved);
                  const label = (b.variantSku || b.variantLabel || b.variant?.label || `Variante ${b.variantId ?? b.id ?? ""}`) || "Variante";
                  const status = avail === 0 ? "Agotado" : "Bajo stock";
                  const statusColor = avail === 0 ? theme.error : theme.warning;
                  return (
                    <div key={b.variantId ?? b.id ?? `low-${idx}`} className="low-stock-row" style={{ padding: theme.space(2), borderBottom: `1px solid ${theme.border}`, fontSize: 13, transition: "background 0.15s ease" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: theme.space(1) }}>
                        <span style={{ fontWeight: 600, color: theme.text }}>{safeDisplay(label)}</span>
                        <span style={{ fontWeight: 700, color: statusColor, fontSize: 12 }}>{status}</span>
                      </div>
                      <div style={{ display: "flex", gap: theme.space(3), marginTop: theme.space(1), fontSize: 12, color: theme.textMuted }}>
                        <span>Stock: <strong>{safeDisplay(stock)}</strong></span>
                        <span>Reservado: <strong>{safeDisplay(reserved)}</strong></span>
                        <span>Disponible: <strong style={{ color: avail === 0 ? theme.error : theme.text }}>{safeDisplay(avail)}</strong></span>
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
