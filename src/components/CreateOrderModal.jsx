import { useState } from "react";
import { Modal, Input, Select, Btn } from "./UI";
import { fmtCurrency } from "../utils/index";

export default function CreateOrderModal({ store, onClose, toast, onCreated }) {
  const { products, getAvailable, createOrder } = store;

  const [clientName,    setClientName]    = useState("");
  const [clientPhone,   setClientPhone]   = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [channel,       setChannel]       = useState("WHATSAPP");
  const [notes,         setNotes]         = useState("");
  const [items,         setItems]         = useState([]);
  const [submitting,    setSubmitting]    = useState(false);

  // Item picker
  const [pid, setPid] = useState("");
  const [vid, setVid] = useState("");
  const [qty, setQty] = useState(1);

  const selectedProduct = products.find(p => String(p.id) === String(pid));
  const selectedVariant = selectedProduct?.variants?.find(v => String(v.id) === String(vid));
  const avail           = selectedVariant ? getAvailable(selectedVariant.id) : 0;

  const variantLabel = (v) =>
    [v.size ?? v.talla, v.color].filter(Boolean).join(" / ") || v.sku || String(v.id);

  const addItem = () => {
    if (!pid || !vid || qty < 1) return;
    if (qty > avail) { toast(`❌ Stock insuficiente. Disponible: ${avail}`); return; }
    const idx = items.findIndex(i => String(i.variantId) === String(vid));
    if (idx >= 0) {
      const u = [...items]; u[idx].quantity += qty; setItems(u);
    } else {
      setItems([...items, {
        variantId:   selectedVariant.id,
        productName: selectedProduct.name,
        variant:     variantLabel(selectedVariant),
        quantity:    qty,
        price:       selectedVariant.price ?? selectedVariant.unitPrice ?? 0,
      }]);
    }
    setPid(""); setVid(""); setQty(1);
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!clientName)   { toast("❌ Nombre del cliente requerido");  return; }
    if (!clientPhone)  { toast("❌ Teléfono del cliente requerido"); return; }
    if (!items.length) { toast("❌ Agrega al menos un artículo");   return; }
    setSubmitting(true);
    try {
      const body = {
        client:  { name: clientName, phone: clientPhone, address: clientAddress },
        channel, notes,
        items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
      };
      const order = await createOrder(body);
      toast("✅ Pedido creado");
      onCreated(order?.id ?? order);
    } catch (e) {
      toast(`❌ ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nuevo Pedido" width={600}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 10 }}>
        Datos del cliente
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Nombre"   value={clientName}    onChange={e => setClientName(e.target.value)}    placeholder="María González" />
        <Input label="Teléfono" value={clientPhone}   onChange={e => setClientPhone(e.target.value)}   placeholder="8091234567" />
      </div>
      <Input label="Dirección (opcional)" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Calle 1, Ciudad" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="Canal" value={channel} onChange={e => setChannel(e.target.value)}>
          {["WHATSAPP","INSTAGRAM","SHOPIFY","DIRECT"].map(c => <option key={c}>{c}</option>)}
        </Select>
        <Input label="Notas" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instrucciones especiales..." />
      </div>

      {/* Add item */}
      <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10, textTransform: "uppercase" }}>
          Agregar artículo
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: 8, alignItems: "flex-end" }}>
          <Select label="Producto" value={pid} onChange={e => { setPid(e.target.value); setVid(""); }}>
            <option value="">Seleccionar...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Variante" value={vid} onChange={e => setVid(e.target.value)} disabled={!pid}>
            <option value="">Seleccionar...</option>
            {selectedProduct?.variants?.map(v => {
              const av = getAvailable(v.id);
              return (
                <option key={v.id} value={v.id} disabled={av === 0}>
                  {variantLabel(v)} (disp: {av})
                </option>
              );
            })}
          </Select>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5, textTransform: "uppercase" }}>Cant.</label>
            <input type="number" min={1} max={avail || 1} value={qty} onChange={e => setQty(Number(e.target.value))}
              style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 8px", fontSize: 14, fontFamily: "inherit" }} />
          </div>
          <Btn onClick={addItem} disabled={!vid || avail === 0}>＋</Btn>
        </div>
        {vid && selectedVariant && (
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            Disponible: {avail} | Precio: {fmtCurrency(selectedVariant.price ?? selectedVariant.unitPrice ?? 0)}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, marginBottom: 6 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</span>
                <span style={{ color: "#9CA3AF", fontSize: 12 }}> · {item.variant} × {item.quantity}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{fmtCurrency(item.price * item.quantity)}</span>
                <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ border: "none", background: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            </div>
          ))}
          <div style={{ textAlign: "right", fontWeight: 800, fontSize: 16, color: "#6366F1", marginTop: 8 }}>
            Total: {fmtCurrency(total)}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Btn>
        <Btn onClick={handleSubmit} disabled={submitting}>{submitting ? "Creando..." : "Crear Pedido"}</Btn>
      </div>
    </Modal>
  );
}
