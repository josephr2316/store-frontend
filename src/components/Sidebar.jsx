import { ORDER_STATES, ORDER_STATE_LABELS, STATE_COLORS } from "../constants/index";

const TABS = [
  { id: "Pedidos",  icon: "📦", label: "Pedidos"  },
  { id: "Caja",     icon: "🛒", label: "Caja"     },
  { id: "Reportes", icon: "📊", label: "Reportes" },
];

export default function Sidebar({ activeTab, onTabChange, pendingCount, onLogout }) {
  return (
    <nav style={{ width: 220, background: "#0F0F19", flexShrink: 0, display: "flex", flexDirection: "column", padding: "24px 16px", gap: 4 }}>
      <div style={{ marginBottom: 28, paddingLeft: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Tienda</div>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Sistema de Gestión</div>
      </div>

      {TABS.map(t => {
        const active = activeTab === t.id;
        return (
          <button key={t.id} onClick={() => onTabChange(t.id)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
            border: "none", cursor: "pointer", width: "100%", textAlign: "left",
            background: active ? "#1E1E2E" : "transparent",
            color: active ? "#A5B4FC" : "#6B7280",
            fontFamily: "inherit", fontSize: 14, fontWeight: active ? 700 : 500,
            transition: "all 0.15s",
            borderLeft: active ? "2px solid #6366F1" : "2px solid transparent",
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
            {t.id === "Pedidos" && pendingCount > 0 && (
              <span style={{ marginLeft: "auto", background: "#6366F1", color: "#fff", borderRadius: 10,
                fontSize: 11, fontWeight: 700, padding: "1px 7px", minWidth: 20, textAlign: "center" }}>
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}

      <div style={{ marginTop: "auto", padding: "16px 8px 0", borderTop: "1px solid #1E1E2E" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#4B5563", textTransform: "uppercase", marginBottom: 10 }}>
          Estados de Pedido
        </div>
        {ORDER_STATES.map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATE_COLORS[s]?.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#6B7280" }}>{ORDER_STATE_LABELS[s]}</span>
          </div>
        ))}
        <button onClick={onLogout} style={{ marginTop: 14, width: "100%", background: "transparent",
          border: "1px solid #374151", borderRadius: 8, padding: "7px", fontSize: 12, color: "#6B7280",
          cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
