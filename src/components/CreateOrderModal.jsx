import { useState } from "react";
import { Modal, Input, Select, Btn } from "./UI";
import { fmtCurrency } from "../utils/index";

function variantPrice(v) {
  const n = v.price ?? v.unitPrice ?? v.attributes?.price ?? v.attributes?.unitPrice;
  return n != null ? Number(n) : 0;
}

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
  const variantsCount   = selectedProduct?.variants?.length ?? 0;

  const variantLabel = (v) =>
    [v.size ?? v.talla ?? v.attributes?.size ?? v.attributes?.talla, v.color ?? v.attributes?.color].filter(Boolean).join(" / ") || v.sku || `ID ${v.id}`;

  const addItem = () => {
    if (!pid || !vid || qty < 1) return;
    if (!selectedProduct || !selectedVariant) return;
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
        price:       variantPrice(selectedVariant),
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
      onCreated(order?.id ?? order?.orderId ?? order);
    } catch (e) {
      toast(`❌ ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nuevo Pedido" width={640}>
      <div style={{ animation: "contentIn 0.28s ease-out 0.06s forwards", opacity: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
        Datos del cliente
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input label="Nombre"   value={clientName}    onChange={e => setClientName(e.target.value)}    placeholder="María González" />
        <Input label="Teléfono" value={clientPhone}   onChange={e => setClientPhone(e.target.value)}   placeholder="8091234567" />
      </div>
      <div style={{ marginTop: 14 }}>
        <Input label="Dirección (opcional)" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Calle 1, Ciudad" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <Select label="Canal" value={channel} onChange={e => setChannel(e.target.value)}>
          {["WHATSAPP","INSTAGRAM","SHOPIFY","DIRECT"].map(c => <option key={c}>{c}</option>)}
        </Select>
        <Input label="Notas" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instrucciones especiales..." />
      </div>

      {/* Add item */}
      <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 18, marginTop: 20, marginBottom: 18, border: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
          Agregar artículo
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 90px 1fr", gap: 12, alignItems: "start" }}>
          <Select label="Producto" value={pid} onChange={e => { setPid(e.target.value); setVid(""); }} wrapperStyle={{ marginBottom: 0 }}>
            <option value="">Seleccionar producto...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({(p.variants || []).length} variantes)</option>
            ))}
          </Select>
          <Select label="Variante" value={vid} onChange={e => setVid(e.target.value)} disabled={!pid} wrapperStyle={{ marginBottom: 0 }}>
            <option value="">{!pid ? "Selecciona primero un producto" : variantsCount === 0 ? "Sin variantes" : "Seleccionar variante..."}</option>
            {(selectedProduct?.variants || []).map(v => {
              const av = getAvailable(v.id);
              return (
                <option key={v.id} value={v.id} disabled={av === 0}>
                  {variantLabel(v)} — disp: {av}
                </option>
              );
            })}
          </Select>
          <div style={{ minWidth: 0 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, letterSpacing: "0.02em" }}>Cant.</label>
            <input type="number" min={1} max={avail || 999} value={qty} onChange={e => setQty(Number(e.target.value))}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit" }} />
          </div>
          <div style={{ paddingTop: 22 }}>
            <Btn onClick={addItem} disabled={!vid || avail === 0} style={{ width: "100%", minWidth: 80, height: 44, fontSize: 15 }}>
              + Agregar
            </Btn>
          </div>
        </div>
        {pid && variantsCount === 0 && (
          <div style={{ fontSize: 12, color: "#B45309", marginTop: 10, background: "#FFFBEB", padding: "8px 10px", borderRadius: 8 }}>
            Este producto no tiene variantes cargadas. Revisa el inventario en Caja o refresca la página.
          </div>
        )}
        {vid && selectedVariant && (
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 10 }}>
            Disponible: <strong>{avail}</strong> · Precio: <strong>{fmtCurrency(variantPrice(selectedVariant))}</strong>
          </div>
        )}
      </div>

        {items.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Resumen del pedido</div>
          {items.map((item, i) => (
            <div key={item.variantId ?? i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, marginBottom: 8 }}>
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
      </div>
    </Modal>
  );
}
