import { useState, useEffect } from "react";
import { Btn, Input, Modal, AlertBox } from "../components/UI";
import { inventoryApi } from "../api/client";
import { fmtCurrency } from "../utils/index";

// ─── Helpers: variant display from API (may be at root or in attributes) ───
function variantPrice(v) {
  const n = v.price ?? v.unitPrice ?? v.attributes?.price ?? v.attributes?.unitPrice;
  return n != null ? Number(n) : 0;
}
function variantTalla(v) {
  return v.size ?? v.talla ?? v.attributes?.size ?? v.attributes?.talla ?? "—";
}
function variantColor(v) {
  return v.color ?? v.attributes?.color ?? "—";
}

// ─── INVENTORY TABLE ──────────────────────────────────────────────────────────

const TABLE_HEADERS = [
  { key: "ID", align: "right", width: "70px" },
  { key: "Talla", align: "center", width: "80px" },
  { key: "Color", align: "center", width: "80px" },
  { key: "Stock", align: "right", width: "70px" },
  { key: "Reservado", align: "right", width: "85px" },
  { key: "Disponible", align: "right", width: "85px" },
  { key: "Precio", align: "right", width: "90px" },
  { key: "", align: "left", width: "auto" },
];

function InventoryTable({ products, balances, onAdjust, onRefresh, refreshing }) {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Inventario</h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              color: "#6366F1", background: "#EEF2FF", border: "1px solid #C7D2FE",
              borderRadius: 10, cursor: refreshing ? "wait" : "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            aria-label="Refrescar inventario"
          >
            <span style={{
              display: "inline-block", width: 14, height: 14,
              animation: refreshing ? "spin 0.8s linear infinite" : "none",
            }}>↻</span>
            {refreshing ? "Actualizando…" : "Refrescar inventario"}
          </button>
        )}
      </div>
      <Input placeholder="Buscar producto o ID..." value={query} onChange={e => setQuery(e.target.value)} />

      {products.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 32, textAlign: "center", color: "#64748B", fontSize: 14 }}>
          No hay productos en el inventario. Usa <strong>Refrescar inventario</strong> para cargar los datos.
        </div>
      )}
      {products.length > 0 && filtered.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, textAlign: "center", color: "#64748B", fontSize: 14 }}>
          Ningún producto coincide con la búsqueda.
        </div>
      )}
      {filtered.map((p, idx) => (
        <div
          key={p.id}
          style={{
            background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, marginBottom: 16, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            animation: "cardIn 0.35s ease-out forwards",
            animationDelay: `${Math.min(idx * 45, 200)}ms`,
            opacity: 0,
          }}
        >
          <div style={{ padding: "14px 18px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{p.name}</span>
              <span style={{ color: "#64748B", fontSize: 12 }}>ID producto: {p.id}</span>
              {p.category && <span style={{ color: "#94A3B8", fontSize: 12 }}>· {p.category}</span>}
            </div>
            <span style={{ fontSize: 12, color: "#6B7280" }}>{p.variants?.length || 0} variantes</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {TABLE_HEADERS.map(({ key, align, width }) => (
                  <th key={key || "action"} style={{ padding: "8px 14px", fontSize: 11, fontWeight: 600, color: "#64748B", textAlign: align, width: width === "auto" ? undefined : width }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(p.variants || []).map(v => {
                const bal      = getBalance(v.id);
                const stock    = bal?.stock ?? bal?.quantity ?? v.stock ?? 0;
                const reserved = bal?.reserved ?? bal?.reservedQty ?? v.reserved ?? 0;
                const avail   = stock - reserved;
                const price   = variantPrice(v);
                const talla   = variantTalla(v);
                const color   = variantColor(v);
                return (
                  <tr key={v.id} style={{ borderTop: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "9px 14px", fontSize: 12, color: "#64748B", fontFamily: "monospace", textAlign: "right" }}>{v.id}</td>
                    <td style={{ padding: "9px 14px", fontSize: 13, textAlign: "center" }}>{talla}</td>
                    <td style={{ padding: "9px 14px", fontSize: 13, textAlign: "center" }}>{color}</td>
                    <td style={{ padding: "9px 14px", fontSize: 14, fontWeight: 600, textAlign: "right" }}>{stock}</td>
                    <td style={{ padding: "9px 14px", fontSize: 13, color: "#F59E0B", textAlign: "right" }}>{reserved}</td>
                    <td style={{ padding: "9px 14px", textAlign: "right" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: stockColor(avail) }}>
                        {avail === 0 ? "Agotado" : avail}
                      </span>
                    </td>
                    <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600, color: "#0F172A", textAlign: "right" }}>{fmtCurrency(price)}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <Btn size="sm" variant="ghost"
                        onClick={() => onAdjust({ variantId: v.id, name: `${p.name} ${talla}/${color}` })}>
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

function DirectSalePanel({ products, getAvailable, onSell, loadingProducts }) {
  const [saleCode, setSaleCode] = useState("");
  const [saleQty,  setSaleQty]  = useState(1);
  const [saleList, setSaleList] = useState([]);
  const [selling,  setSelling]  = useState(false);

  const code = String(saleCode).trim();
  const findVariant = () => {
    if (!code) return null;
    for (const p of products) {
      const v = (p.variants || []).find(v =>
        String(v.id) === code || (v.sku && String(v.sku).toLowerCase() === code.toLowerCase())
      );
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
    const price = variantPrice(v);
    const variantLabel = [variantTalla(v), variantColor(v)].filter(x => x !== "—").join(" / ") || v.sku || String(v.id);
    const idx = saleList.findIndex(i => String(i.variantId) === String(v.id));
    if (idx >= 0) { const u = [...saleList]; u[idx].quantity += saleQty; setSaleList(u); }
    else setSaleList([...saleList, { variantId: v.id, productName: p.name, variant: variantLabel || "—", quantity: saleQty, price }]);
    setSaleCode(""); setSaleQty(1);
  };

  const handleSell = async () => {
    setSelling(true);
    try { await onSell(saleList); setSaleList([]); }
    finally { setSelling(false); }
  };

  return (
    <div style={{ animation: "contentIn 0.3s ease-out forwards" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Venta Directa (Caja)</h2>
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", animation: "cardIn 0.35s ease-out 0.05s forwards", opacity: 0 }}>
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10, textTransform: "uppercase" }}>Formulario de Venta</div>
          <div style={{ marginBottom: 4 }}>
            <Input label="Código del Artículo (ID Variante)" value={saleCode} onChange={e => setSaleCode(e.target.value)} placeholder="Ej: 200, 201" />
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
              Usa el número de la columna <strong>ID</strong> de la tabla Inventario.
            </div>
          </div>
          {code && found && (
            <div style={{ fontSize: 13, color: "#059669", marginTop: 4, marginBottom: 10, fontWeight: 600 }}>
              ✓ {found.p.name} — disp: {avail}
            </div>
          )}
          {code && !found && !loadingProducts && (
            <div style={{ fontSize: 13, color: "#475569", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", marginTop: 4, marginBottom: 10 }}>
              Ese código no coincide con ninguna variante. Revisa la columna <strong>ID</strong> en la tabla (ej. 200, 201).
            </div>
          )}
          {code && !found && loadingProducts && (
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, marginBottom: 10 }}>Cargando inventario…</div>
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
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #F0F0F0", animation: "listItemIn 0.2s ease-out forwards", animationDelay: `${i * 40}ms`, opacity: 0 }}>
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
  const { products, balances, loading, error, setError, fetchProducts, fetchBalances, adjustStock, getAvailable } = store;
  const [adjustTarget, setAdjustTarget] = useState(null);

  const refreshInventory = () => {
    setError?.(null);
    fetchProducts();
    fetchBalances();
  };

  useEffect(() => {
    refreshInventory();
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
    return (
      <div style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <span style={{ width: 32, height: 32, border: "3px solid #E2E8F0", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <span style={{ color: "#64748B", fontSize: 14 }}>Cargando inventario…</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, overflowY: "auto", height: "100%", background: "#F8FAFC" }}>
      {error && (
        <div style={{ marginBottom: 16 }}>
          <AlertBox type="danger">
            {error}
            <div style={{ marginTop: 10 }}>
              <Btn size="sm" onClick={refreshInventory}>Reintentar</Btn>
            </div>
          </AlertBox>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, maxWidth: 1200 }}>
        <InventoryTable
          products={products}
          balances={balances}
          onAdjust={setAdjustTarget}
          onRefresh={refreshInventory}
          refreshing={loading.products || loading.inventory}
        />
        <DirectSalePanel products={products} getAvailable={getAvailable} onSell={handleDirectSale} loadingProducts={loading.products} />
      </div>
      <AdjustModal target={adjustTarget} onClose={() => setAdjustTarget(null)} onSave={handleAdjust} />
    </div>
  );
}
