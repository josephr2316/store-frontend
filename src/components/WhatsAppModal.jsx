import { useState, useEffect } from "react";
import { Modal, Btn } from "./UI";
import { whatsappApi } from "../api/client";

export default function WhatsAppModal({ orderId, onClose, toast }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setData(null);
    setLoading(true);
    whatsappApi.message(orderId)
      .then(setData)
      .catch(e => toast(`❌ ${e.message}`))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (!orderId) return null;

  const message = data?.message || data?.text || data?.body || "";
  const waLink  = data?.waLink  || data?.link  || data?.url  || null;

  return (
    <Modal open={!!orderId} onClose={onClose} title="Plantilla WhatsApp" width={540}>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          Cargando plantilla...
        </div>
      ) : message ? (
        <>
          <div style={{
            background: "#E7F8E7", borderRadius: 12, padding: 16,
            fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap",
            fontFamily: "'Segoe UI', sans-serif", color: "#1a1a1a", border: "1px solid #C3E6C3",
          }}>
            {message}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => { navigator.clipboard?.writeText(message); toast("✅ Copiado"); }}>
              📋 Copiar
            </Btn>
            {waLink && <Btn variant="green" onClick={() => window.open(waLink, "_blank")}>📱 Abrir WhatsApp</Btn>}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 30, color: "#9CA3AF" }}>
          No se pudo cargar la plantilla
        </div>
      )}
    </Modal>
  );
}
