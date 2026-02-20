import { useState, useCallback } from "react";
import {
  productsApi, variantsApi, ordersApi,
  inventoryApi,
} from "../api/client";

// ─── useStore ─────────────────────────────────────────────────────────────────
// All business logic now delegates to the real backend API.
// Local state is used as a display cache; refreshed after each mutation.

export function useStore() {
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [balances, setBalances] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading,  setLoading]  = useState({});
  const [error,    setError]    = useState(null);

  const startLoad = (key) => setLoading(l => ({ ...l, [key]: true  }));
  const endLoad   = (key) => setLoading(l => ({ ...l, [key]: false }));

  // ── Products ─────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setError(null);
    startLoad("products");
    try {
      const data = await productsApi.list();
      const withVariants = await Promise.all(
        (data || []).map(async (p) => {
          const variants = await variantsApi.byProduct(p.id).catch(() => []);
          return { ...p, variants: variants || [] };
        })
      );
      setProducts(withVariants);
      setError(null);
    } catch (e) {
      const msg = e?.message === "Failed to fetch"
        ? "No se pudo conectar con el servidor. Revisa tu conexión o intenta más tarde."
        : (e?.message || "Error de conexión");
      setError(msg);
    }
    finally { endLoad("products"); }
  }, []);

  const createProduct = useCallback(async (body) => {
    const p = await productsApi.create(body);
    await fetchProducts();
    return p;
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id, body) => {
    await productsApi.update(id, body);
    await fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id) => {
    await productsApi.remove(id);
    await fetchProducts();
  }, [fetchProducts]);

  const createVariant = useCallback(async (body) => {
    const v = await variantsApi.create(body);
    await fetchProducts();
    return v;
  }, [fetchProducts]);

  const updateVariant = useCallback(async (id, body) => {
    await variantsApi.update(id, body);
    await fetchProducts();
  }, [fetchProducts]);

  const deleteVariant = useCallback(async (id) => {
    await variantsApi.remove(id);
    await fetchProducts();
  }, [fetchProducts]);

  // ── Inventory ─────────────────────────────────────────────────────────────────

  const fetchBalances = useCallback(async () => {
    setError(null);
    startLoad("inventory");
    try {
      const data = await inventoryApi.balances();
      setBalances(data || []);
      setError(null);
    } catch (e) {
      const msg = e?.message === "Failed to fetch"
        ? "No se pudo conectar con el servidor. Revisa tu conexión o intenta más tarde."
        : (e?.message || "Error de conexión");
      setError(msg);
    }
    finally { endLoad("inventory"); }
  }, []);

  const VALID_ADJUSTMENT_REASONS = ["MANUAL_SALE", "RETURN", "DAMAGED", "COUNT_CORRECTION", "OTHER"];
  const adjustStock = useCallback(async (variantId, quantityDelta, reason, note) => {
    const reasonStr = String(reason ?? "").trim();
    const reasonUpper = reasonStr.toUpperCase().replace(/\s+/g, "_");
    const validReason = VALID_ADJUSTMENT_REASONS.includes(reasonUpper) ? reasonUpper : "OTHER";
    const body = { variantId, quantityDelta: Number(quantityDelta), reason: validReason };
    if (note) body.note = String(note).trim();
    else if (validReason === "OTHER" && reasonStr) body.note = reasonStr;
    await inventoryApi.adjust(body);
    await fetchBalances();
    await fetchProducts();
  }, [fetchBalances, fetchProducts]);

  const getBalance = useCallback((variantId) =>
    balances.find(b =>
      b.variantId === variantId ||
      b.variant?.id === variantId ||
      String(b.variantId) === String(variantId)
    ) || null,
  [balances]);

  const getAvailable = useCallback((variantId) => {
    const b = getBalance(variantId);
    if (!b) return 0;
    const stock    = b.stock    ?? b.quantity    ?? 0;
    const reserved = b.reserved ?? b.reservedQty ?? 0;
    return stock - reserved;
  }, [getBalance]);

  // ── Orders ─────────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (status, page = 0, size = 30) => {
    setError(null);
    startLoad("orders");
    try {
      const data = await ordersApi.list(status, page, size);
      // API now returns Page { content, totalElements, totalPages, number, size }
      const content = Array.isArray(data) ? data : (data?.content ?? []);
      if (page === 0) {
        setOrders(content);
      } else {
        setOrders(prev => [...prev, ...content]);
      }
      setError(null);
      return data; // return full page for caller to check totalPages
    } catch (e) {
      const msg = e?.message === "Failed to fetch"
        ? "No se pudo conectar con el servidor. Revisa tu conexión o intenta más tarde."
        : (e?.message || "Error de conexión");
      setError(msg);
      return null;
    }
    finally { endLoad("orders"); }
  }, []);

  const fetchOrderById = useCallback(async (id) => {
    try {
      return await ordersApi.get(id);
    } catch {
      return null;
    }
  }, []);

  /** Fetches total count of PENDING orders from API (for sidebar/header badge). */
  const fetchPendingCount = useCallback(async () => {
    try {
      const data = await ordersApi.list("PENDING", 0, 1);
      const total = data?.totalElements ?? 0;
      setPendingCount(Number(total));
    } catch {
      setPendingCount(0);
    }
  }, []);

  const createOrder = useCallback(async (body) => {
    const order = await ordersApi.create(body);
    await fetchOrders();
    await fetchPendingCount();
    return order;
  }, [fetchOrders, fetchPendingCount]);

  const transitionOrder = useCallback(async (orderId, newStatus, note) => {
    await ordersApi.transition(orderId, { toStatus: newStatus, reason: note || "" });
    await fetchOrders();
    await fetchPendingCount();
  }, [fetchOrders, fetchPendingCount]);

  const updateOrderAddress = useCallback(async (orderId, address, city) => {
    await ordersApi.updateAddress(orderId, {
      shippingAddress: address,
      ...(city ? { shippingCity: city } : {}),
    });
    await fetchOrders();
    await fetchPendingCount();
  }, [fetchOrders, fetchPendingCount]);

  return {
    products, orders, balances, pendingCount,
    loading, error, setError,
    // Products
    fetchProducts, createProduct, updateProduct, deleteProduct,
    // Variants
    createVariant, updateVariant, deleteVariant,
    // Inventory
    fetchBalances, adjustStock, getBalance, getAvailable,
    // Orders
    fetchOrders, fetchOrderById, fetchPendingCount, createOrder, transitionOrder, updateOrderAddress,
  };
}
