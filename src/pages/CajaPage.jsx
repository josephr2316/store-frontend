import { useState, useEffect } from "react";
import { Btn, Input, Modal, AlertBox } from "../components/UI";
import { inventoryApi } from "../api/client";
import { fmtCurrency } from "../utils/index";

// ─── INVENTORY TABLE ──────────────────────────────────────────────────────────

function InventoryTable({ products, balances, onAdjust }) {
  const [query, setQuery] = useState("");

  const getBalance = (variantId) =>
    balances.find(b =>
      String(b.variantId ?? b.variant?.id ?? b.id) === String(variantId)
    );

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    String(p.id).includes(query)
  );

  const stockColor = (avail) =>
    avail === 0 ? "#DC2626" : avail <= 3 ? "#D97706" : "#059669";

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800 }}>Inventario</h2>
      <Input placeholder="Buscar producto o ID..." value={query} onChange={e => setQuery(e.target.value)} />

      {filtered.map(p => (
        <div key={p.id} style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
              <span style={{ color: "#9CA3AF", fontSize: 12, marginLeft: 8 }}>{p.id} · {p.category || ""}</span>
            </div>
            <span style={{ fontSize: 12, color: "#6B7280" }}>{p.variants?.length || 0} variantes</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                {["ID","Talla","Color","Stock","Reservado","Disponible","Precio",""].map(h => (
                  <th key={h} style={{ padding: "7px 12px", fontSize: 11, fontWeight: 600, color: "#9CA3AF", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(p.variants || []).map(v => {
                const bal      = getBalance(v.id);
                const stock    = bal?.stock    ?? bal?.quantity    ?? v.stock    ?? 0;
                const reserved = bal?.reserved ?? bal?.reservedQty ?? v.reserved ?? 0;
                const avail    = stock - reserved;
                const price    = v.price ?? v.unitPrice ?? 0;
                const talla    = v.size  ?? v.talla ?? "—";
                return (
                  <tr key={v.id} style={{ borderTop: "1px solid #F0F0F0" }}>
                    <td style={{ padding: "9px 12px", fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{v.id}</td>
                    <td style={{ padding: "9px 12px", fontSize: 13 }}>{talla}</td>
                    <td style={{ padding: "9px 12px", fontSize: 13 }}>{v.color || "—"}</td>
                    <td style={{ padding: "9px 12px", fontSize: 14, fontWeight: 600 }}>{stock}</td>
                    <td style={{ padding: "9px 12px", fontSize: 13, color: "#F59E0B" }}>{reserved}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: stockColor(avail) }}>
                        {avail === 0 ? "Agotado" : avail}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", fontSize: 13 }}>{fmtCurrency(price)}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <Btn size="sm" variant="ghost"
                        onClick={() => onAdjust({ variantId: v.id, name: `${p.name} ${talla}/${v.color || ""}` })}>
                        Ajustar
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ─── ADJUST MODAL ─────────────────────────────────────────────────────────────

function AdjustModal({ target, onClose, onSave }) {
  const [quantity, setQuantity] = useState(0);
  const [reason,   setReason]   = useState("");
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    if (!quantity || !reason.trim()) return;
    setSaving(true);
    try { await onSave(target.variantId, quantity, reason); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={!!target} onClose={onClose} title={`Ajustar Stock: ${target?.name}`} width={400}>
      <AlertBox type="warning">
        ⚠️ Ajuste manual de inventario. Positivo = entrada, negativo = salida.
      </AlertBox>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5, textTransform: "uppercase" }}>
        Cantidad
      </label>
      <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))}
        placeholder="Ej: -3 o +10"
        style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 16 }} />
      <Input label="Razón" value={reason} onChange={e => setReason(e.target.value)}
        placeholder="Ej: conteo físico, rotura, devolución..." />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={!quantity || !reason.trim() || saving}>
          {saving ? "Guardando..." : "Aplicar Ajuste"}
        </Btn>
      </div>
    </Modal>
  );
}

// ─── DIRECT SALE PANEL ────────────────────────────────────────────────────────

function DirectSalePanel({ products, getAvailable, onSell }) {
  const [saleCode, setSaleCode] = useState("");
  const [saleQty,  setSaleQty]  = useState(1);
  const [saleList, setSaleList] = useState([]);
  const [selling,  setSelling]  = useState(false);

  const findVariant = () => {
    for (const p of products) {
      const v = (p.variants || []).find(v => String(v.id) === saleCode || v.sku === saleCode);
      if (v) return { p, v };
    }
    return null;
  };

  const found = findVariant();
  const avail  = found ? getAvailable(found.v.id) : 0;
  const total  = saleList.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToList = () => {
    if (!found) return;
    const { p, v } = found;
    if (avail < saleQty) return;
    const idx = saleList.findIndex(i => String(i.variantId) === String(v.id));
    if (idx >= 0) { const u = [...saleList]; u[idx].quantity += saleQty; setSaleList(u); }
    else setSaleList([...saleList, { variantId: v.id, productName: p.name,
      variant: [v.size ?? v.talla, v.color].filter(Boolean).join("/"),
      quantity: saleQty, price: v.price ?? v.unitPrice ?? 0 }]);
    setSaleCode(""); setSaleQty(1);
  };

  const handleSell = async () => {
    setSelling(true);
    try { await onSell(saleList); setSaleList([]); }
    finally { setSelling(false); }
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800 }}>Venta Directa (Caja)</h2>
      <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10, textTransform: "uppercase" }}>Formulario de Venta</div>
          <Input label="Código del Artículo (ID Variante)" value={saleCode} onChange={e => setSaleCode(e.target.value)} placeholder="Ej: 3" />
          {saleCode && found && (
            <div style={{ fontSize: 13, color: "#059669", marginTop: -10, marginBottom: 10, fontWeight: 600 }}>
              ✓ {found.p.name} — disp: {avail}
            </div>
          )}
          {saleCode && !found && (
            <div style={{ fontSize: 13, color: "#DC2626", marginTop: -10, marginBottom: 10 }}>Variante no encontrada</div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5, textTransform: "uppercase" }}>Cantidad</label>
              <input type="number" min={1} value={saleQty} onChange={e => setSaleQty(Number(e.target.value))}
                style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <Btn onClick={addToList} disabled={!found || avail < saleQty}>Agregar</Btn>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #F0F0F0", padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10, textTransform: "uppercase" }}>Lista de Compras</div>
          {saleList.length === 0 && <div style={{ color: "#C4C4C4", fontSize: 13, textAlign: "center", padding: "12px 0" }}>Sin artículos</div>}
          {saleList.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #F0F0F0" }}>
              <div style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{item.productName}</span>
                <span style={{ color: "#9CA3AF" }}> {item.variant} ×{item.quantity}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{fmtCurrency(item.price * item.quantity)}</span>
                <button onClick={() => setSaleList(saleList.filter((_, j) => j !== i))}
                  style={{ border: "none", background: "none", color: "#EF4444", cursor: "pointer" }}>×</button>
              </div>
            </div>
          ))}
          {saleList.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ textAlign: "right", fontWeight: 800, fontSize: 16, color: "#6366F1", marginBottom: 12 }}>
                Total: {fmtCurrency(total)}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setSaleList([])}>Cancelar</Btn>
                <Btn style={{ flex: 1 }} onClick={handleSell} disabled={selling}>
                  {selling ? "Registrando..." : "Vender"}
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function CajaPage({ store, toast }) {
  const { products, balances, loading, fetchProducts, fetchBalances, adjustStock, getAvailable } = store;
  const [adjustTarget, setAdjustTarget] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchBalances();
  }, []);

  const handleAdjust = async (variantId, quantity, reason) => {
    try {
      await adjustStock(variantId, quantity, reason);
      toast(`✅ Stock ajustado (${quantity > 0 ? "+" : ""}${quantity})`);
    } catch (e) { toast(`❌ ${e.message}`); throw e; }
  };

  const handleDirectSale = async (items) => {
    try {
      // Direct sale = negative adjustments for each item
      await Promise.all(
        items.map(i => inventoryApi.adjust({ variantId: i.variantId, quantity: -i.quantity, reason: "Venta directa caja" }))
      );
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
      toast(`✅ Venta registrada: ${fmtCurrency(total)}`);
      await fetchBalances();
    } catch (e) { toast(`❌ ${e.message}`); throw e; }
  };

  if (loading.products && products.length === 0) {
    return <div style={{ padding: 40, color: "#9CA3AF", textAlign: "center" }}>Cargando inventario...</div>;
  }

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, maxWidth: 1200 }}>
        <InventoryTable products={products} balances={balances} onAdjust={setAdjustTarget} />
        <DirectSalePanel products={products} getAvailable={getAvailable} onSell={handleDirectSale} />
      </div>
      <AdjustModal target={adjustTarget} onClose={() => setAdjustTarget(null)} onSave={handleAdjust} />
    </div>
  );
}
