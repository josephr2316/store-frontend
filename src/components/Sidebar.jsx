import { ORDER_STATES, ORDER_STATE_LABELS, STATE_COLORS } from "../constants/index";

const TABS = [
  { id: "Pedidos",  icon: "📦", label: "Pedidos"  },
  { id: "Caja",     icon: "🛒", label: "Caja"     },
  { id: "Reportes", icon: "📊", label: "Reportes" },
];

export default function Sidebar({ activeTab, onTabChange, pendingCount, onLogout }) {
  return (
    <nav style={{
      width: 240, background: "#0F172A", flexShrink: 0, display: "flex", flexDirection: "column",
      padding: "20px 12px", gap: 2, borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ marginBottom: 24, paddingLeft: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2 }}>Tienda</div>
        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Sistema de Gestión</div>
      </div>

      {TABS.map(t => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onTabChange(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10,
              border: "none", cursor: "pointer", width: "100%", textAlign: "left",
              background: active ? "rgba(99, 102, 241, 0.14)" : "transparent",
              color: active ? "#C7D2FE" : "#94A3B8",
              fontFamily: "inherit", fontSize: 14, fontWeight: active ? 600 : 500,
              transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
              borderLeft: active ? "3px solid #6366F1" : "3px solid transparent",
            }}
            onMouseEnter={e => {
              if (active) return;
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "#E2E8F0";
            }}
            onMouseLeave={e => {
              if (active) return;
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94A3B8";
            }}
          >
            <span style={{ fontSize: 18, opacity: active ? 1 : 0.9 }}>{t.icon}</span>
            {t.label}
            {t.id === "Pedidos" && pendingCount > 0 && (
              <span style={{
                marginLeft: "auto", background: "#FEF3C7", color: "#92400E", borderRadius: 10,
                fontSize: 12, fontWeight: 700, padding: "4px 10px", minWidth: 24, textAlign: "center",
                border: "1px solid #FCD34D", boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}

      <div style={{ marginTop: "auto", padding: "18px 10px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Estados de pedido
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ORDER_STATES.map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATE_COLORS[s]?.dot ?? "#64748B", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 500 }}>{ORDER_STATE_LABELS[s]}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onLogout}
          style={{
            marginTop: 16, width: "100%", background: "transparent",
            border: "1px solid #334155", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#94A3B8",
            cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "#E2E8F0";
            e.currentTarget.style.borderColor = "#475569";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#94A3B8";
            e.currentTarget.style.borderColor = "#334155";
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
