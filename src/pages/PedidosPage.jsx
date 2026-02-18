import { useState, useEffect } from "react";
import { Badge, Modal, Btn, Input, AlertBox } from "../components/UI";
import CreateOrderModal   from "../components/CreateOrderModal";
import WhatsAppModal      from "../components/WhatsAppModal";
import OrderHistoryModal  from "../components/OrderHistoryModal";
import { ORDER_STATES, STATE_TRANSITIONS } from "../constants/index";
import { fmtCurrency } from "../utils/index";

// ─── Normalise order from API ─────────────────────────────────────────────────
// Backend may use different casing/field names; we normalise here once.

function normaliseOrder(o) {
  if (!o) return o;
  // Build address from API fields (backend: shippingAddress, shippingCity, shippingRegion)
  const addressParts = [o.shippingAddress, o.shippingCity, o.shippingRegion].filter(Boolean);
  const clientAddress = o.clientAddress || o.client?.address || o.address
    || (addressParts.length ? addressParts.join(", ") : null)
    || o.shippingAddress
    || "";
  return {
    ...o,
    // status field variations
    state:     o.state    || o.status    || "PENDING",
    // nested client or flat fields
    clientName:    o.clientName    || o.client?.name    || o.customerName || "—",
    clientPhone:   o.clientPhone   || o.client?.phone   || o.phone        || (o.customerPhone ?? ""),
    clientAddress,
    // channel
    channel: o.channel || o.source || "—",
    // items
    items: (o.items || o.orderItems || []).map(i => ({
      ...i,
      productName: i.productName || i.product?.name  || i.name || "Producto",
      variant:     i.variant     || i.variantLabel   || [i.size ?? i.talla, i.color].filter(Boolean).join("/") || "—",
      quantity:    i.quantity    || i.qty            || 0,
      price:       i.price       || i.unitPrice      || i.unit_price || 0,
    })),
    total: o.total || o.totalAmount || o.amount || 0,
    createdAt: o.createdAt || o.createdDate || o.date || "",
  };
}

// ─── State transition map (uppercase API values) ──────────────────────────────
const API_TRANSITIONS = {
  PENDING:    ["CONFIRMED", "CANCELLED"],
  CONFIRMED:  ["PREPARING", "CANCELLED"],
  PREPARING:  ["SHIPPED",   "CANCELLED"],
  SHIPPED:    ["DELIVERED"],
  DELIVERED:  [],
  CANCELLED:  [],
};

const TRANSITION_LABELS = {
  CONFIRMED: "Confirmado", PREPARING: "Preparando",
  SHIPPED:   "Enviado",    DELIVERED: "Entregado", CANCELLED: "Cancelado",
};

// ─── ORDER LIST ───────────────────────────────────────────────────────────────

function OrderList({ orders, selected, onSelect, filter, onFilterChange, onNew, loading }) {
  const FILTERS = ["ALL","PENDING","CONFIRMED","PREPARING","SHIPPED","DELIVERED","CANCELLED"];
  return (
    <div style={{ width: 360, minWidth: 320, background: "#fff", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Pedidos</span>
          <Btn size="sm" onClick={onNew}>+ Nuevo</Btn>
        </div>
        <select value={filter} onChange={e => onFilterChange(e.target.value)}
          style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", background: "#F8FAFC" }}>
          {FILTERS.map(f => <option key={f} value={f}>{f === "ALL" ? "Todos" : f}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <span style={{ width: 28, height: 28, border: "2px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <span style={{ color: "#64748B", fontSize: 13 }}>Cargando pedidos…</span>
          </div>
        )}
        {!loading && orders.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Sin pedidos</div>
        )}
        {orders.map((o, index) => {
          const norm = normaliseOrder(o);
          const isActive = selected === o.id;
          const missingAddr = !norm.clientAddress && norm.state !== "CANCELLED";
          return (
            <div
              key={o.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(o.id)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(o.id); } }}
              style={{
                padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid #F1F5F9",
                background: isActive ? "#EEF2FF" : "#fff",
                borderLeft: isActive ? "3px solid #6366F1" : "3px solid transparent",
                transition: "background 0.15s ease",
                animation: "listItemIn 0.2s ease-out forwards",
                animationDelay: `${Math.min(index * 30, 180)}ms`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F0F19" }}>{o.id}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{norm.clientName}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Badge state={norm.state} />
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{fmtCurrency(norm.total)}</div>
                </div>
              </div>
              {missingAddr && (
                <div style={{ marginTop: 6, fontSize: 11, color: "#B91C1C", background: "#FEE2E2", borderRadius: 6, padding: "3px 8px", display: "inline-block" }}>
                  ⚠️ Sin dirección
                </div>
              )}
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{norm.channel} · {norm.createdAt?.slice(0,10) || ""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ORDER DETAIL ─────────────────────────────────────────────────────────────

function OrderDetail({ order, onTransition, onUpdateAddress, onWhatsApp, onHistory, loading }) {
  if (!order) return null;
  const norm = normaliseOrder(order);
  const [noteInput,    setNoteInput]    = useState("");
  const [editingAddr,  setEditingAddr]  = useState(false);
  const [newAddr,      setNewAddr]      = useState("");
  const [newCity,      setNewCity]      = useState("");
  const [confirmTrans, setConfirmTrans] = useState(null);
  const [transNote,    setTransNote]    = useState("");
  const [saving,       setSaving]       = useState(false);

  const nextStates = API_TRANSITIONS[norm.state] || [];

  const doTransition = async () => {
    setSaving(true);
    try {
      await onTransition(order.id, confirmTrans.newState, transNote);
      setConfirmTrans(null); setTransNote("");
    } catch (e) {
      /* toast handled by parent */
    } finally { setSaving(false); }
  };

  const saveAddr = async () => {
    setSaving(true);
    try { await onUpdateAddress(order.id, newAddr, newCity); setEditingAddr(false); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#F8FAFC", animation: "contentIn 0.3s ease-out forwards", opacity: 0 }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>{order.id}</h2>
        <Badge state={norm.state} />
        <span style={{ fontSize: 13, color: "#9CA3AF", marginLeft: "auto" }}>Canal: {norm.channel}</span>
        <Btn size="sm" variant="ghost" onClick={() => onHistory(order.id)}>📋 Historial</Btn>
        <Btn size="sm" variant="green" onClick={() => onWhatsApp(order.id)}>📱 WhatsApp</Btn>
      </div>

      {/* Transitions */}
      {nextStates.length > 0 && (
        <div style={{ marginBottom: 20, background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #E2E8F0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cambiar estado</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {nextStates.map(s => (
              <Btn key={s} size="sm"
                variant={s === "CANCELLED" ? "danger" : s === "DELIVERED" ? "green" : "ghost"}
                onClick={() => setConfirmTrans({ newState: s })}>
                → {TRANSITION_LABELS[s] || s}
              </Btn>
            ))}
          </div>
        </div>
      )}

      {/* Client + Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Cliente</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{norm.clientName}</div>
          <div style={{ color: "#6B7280", fontSize: 13 }}>📱 {norm.clientPhone}</div>
          {editingAddr ? (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <input value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="Dirección (calle, número)"
                style={{ width: "100%", border: "1.5px solid #C7D2FE", borderRadius: 6, padding: "6px 10px", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" }} />
              <input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Ciudad / Municipio"
                style={{ width: "100%", border: "1.5px solid #C7D2FE", borderRadius: 6, padding: "6px 10px", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <Btn size="sm" onClick={saveAddr} disabled={saving || !newAddr.trim()}>Guardar</Btn>
                <Btn size="sm" variant="secondary" onClick={() => setEditingAddr(false)}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: norm.clientAddress ? "#374151" : "#DC2626" }}>
                  📍 {norm.clientAddress || "Sin dirección ⚠️"}
                </span>
                {norm.state !== "SHIPPED" && norm.state !== "DELIVERED" && (
                  <button onClick={() => { setNewAddr(order.shippingAddress || ""); setNewCity(order.shippingCity || ""); setEditingAddr(true); }}
                    style={{ border: "none", background: "none", color: "#6366F1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                    Editar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Resumen</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#6366F1" }}>{fmtCurrency(norm.total)}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{norm.items.length} artículo(s)</div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>Creado: {norm.createdAt?.slice(0,10) || "—"}</div>
        </div>
      </div>

      {/* Items table */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, marginBottom: 20, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0", fontWeight: 600, fontSize: 13, color: "#475569", background: "#F8FAFC" }}>Artículos</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              {["Producto","Variante","Cant.","Precio","Subtotal"].map(h => (
                <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {norm.items.map((item, i) => (
              <tr key={item.id ?? item.variantId ?? i} style={{ borderTop: "1px solid #F0F0F0" }}>
                <td style={{ padding: "10px 16px", fontSize: 14, fontWeight: 600 }}>{item.productName}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "#6B7280" }}>{item.variant}</td>
                <td style={{ padding: "10px 16px", fontSize: 14 }}>{item.quantity}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "#6B7280" }}>{fmtCurrency(item.price)}</td>
                <td style={{ padding: "10px 16px", fontSize: 14, fontWeight: 700 }}>{fmtCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid #E2E8F0", background: "#F8FAFC" }}>
              <td colSpan={4} style={{ padding: "10px 16px", fontWeight: 700, textAlign: "right" }}>Total</td>
              <td style={{ padding: "10px 16px", fontWeight: 800, color: "#6366F1", fontSize: 16 }}>{fmtCurrency(norm.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Transition confirm modal */}
      <Modal open={!!confirmTrans} onClose={() => { setConfirmTrans(null); setTransNote(""); }}
        title={`Cambiar a "${TRANSITION_LABELS[confirmTrans?.newState] || confirmTrans?.newState}"`} width={420}>
        {confirmTrans?.newState === "CANCELLED" && (
          <AlertBox type="danger">⚠️ Esta acción liberará el stock reservado y no se puede deshacer.</AlertBox>
        )}
        {confirmTrans?.newState === "SHIPPED" && !norm.clientAddress && (
          <AlertBox type="warning">⚠️ El cliente no tiene dirección registrada.</AlertBox>
        )}
        <Input label="Nota (opcional)" value={transNote} onChange={e => setTransNote(e.target.value)}
          placeholder="Ej: Comprobante recibido, en camino..." />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => { setConfirmTrans(null); setTransNote(""); }}>Cancelar</Btn>
          <Btn variant={confirmTrans?.newState === "CANCELLED" ? "danger" : "primary"}
            onClick={doTransition} disabled={saving || (confirmTrans?.newState === "SHIPPED" && !norm.clientAddress)}>
            {saving ? "Guardando..." : "Confirmar"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PedidosPage({ store, toast }) {
  const { orders, loading, fetchOrders, transitionOrder, updateOrderAddress } = store;
  const [selectedId,  setSelectedId]  = useState(null);
  const [filter,      setFilter]      = useState("ALL");
  const [showCreate,  setShowCreate]  = useState(false);
  const [whatsAppId,  setWhatsAppId]  = useState(null);
  const [historyId,   setHistoryId]   = useState(null);

  // Load orders on mount and when filter changes
  useEffect(() => {
    fetchOrders(filter === "ALL" ? undefined : filter);
  }, [filter, fetchOrders]);

  const selectedOrder = orders.find(o => o.id === selectedId);

  const handleTransition = async (orderId, newState, note) => {
    try {
      await transitionOrder(orderId, newState, note);
      toast(`✅ Estado actualizado: ${TRANSITION_LABELS[newState] || newState}`);
    } catch (e) {
      toast(`❌ ${e.message}`);
      throw e;
    }
  };

  const handleUpdateAddress = async (orderId, address, city) => {
    try {
      await updateOrderAddress(orderId, address, city);
      toast("✅ Dirección actualizada");
    } catch (e) {
      toast(`❌ ${e?.message || "Error al actualizar dirección"}`);
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>
      <OrderList
        orders={orders}
        selected={selectedId}
        onSelect={setSelectedId}
        filter={filter}
        onFilterChange={setFilter}
        onNew={() => setShowCreate(true)}
        loading={loading.orders}
      />

      {selectedOrder ? (
        <OrderDetail
          order={selectedOrder}
          onTransition={handleTransition}
          onUpdateAddress={handleUpdateAddress}
          onWhatsApp={setWhatsAppId}
          onHistory={setHistoryId}
          loading={loading.orders}
        />
      ) : (
        <div style={{ flex: 1, minWidth: 280, display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", color: "#94A3B8", fontSize: 15 }}>
          Selecciona un pedido de la lista para ver el detalle
        </div>
      )}

      {showCreate && (
        <CreateOrderModal
          store={store}
          onClose={() => setShowCreate(false)}
          toast={toast}
          onCreated={id => { setSelectedId(id); setShowCreate(false); fetchOrders(); }}
        />
      )}

      <WhatsAppModal orderId={whatsAppId} onClose={() => setWhatsAppId(null)} toast={toast} />
      <OrderHistoryModal orderId={historyId} onClose={() => setHistoryId(null)} />
    </div>
  );
}
