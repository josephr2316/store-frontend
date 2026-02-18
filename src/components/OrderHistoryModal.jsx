import { useState, useEffect } from "react";
import { Modal } from "./UI";
import { ordersApi } from "../api/client";

export default function OrderHistoryModal({ orderId, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setHistory([]);
    setLoading(true);
    ordersApi.history(orderId)
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Modal open={!!orderId} onClose={onClose} title="Historial del Pedido" width={480}>
      {loading ? (
        <div style={{ textAlign: "center", padding: 30, color: "#9CA3AF" }}>Cargando...</div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: "#9CA3AF" }}>Sin historial</div>
      ) : (
        <div>
          {history.map((h, i) => {
            const action = h.action || h.status || h.transition || h.event || h.type || "—";
            const date   = h.date   || h.createdAt || h.timestamp || h.at   || "";
            const note   = h.note   || h.comment   || h.description          || "";
            const by     = h.by     || h.user       || h.createdBy            || "Sistema";
            return (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < history.length - 1 ? 16 : 0 }}>
                <div
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#6366F1", marginTop: 5, flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0F0F19" }}>{action}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {date ? new Date(date).toLocaleString("es-DO") : ""} · {by}
                  </div>
                  {note && (
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, fontStyle: "italic" }}>
                      "{note}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
