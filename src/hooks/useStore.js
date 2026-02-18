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
  const [loading,  setLoading]  = useState({});
  const [error,    setError]    = useState(null);

  const startLoad = (key) => setLoading(l => ({ ...l, [key]: true  }));
  const endLoad   = (key) => setLoading(l => ({ ...l, [key]: false }));

  // ── Products ─────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
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
    startLoad("inventory");
    try {
      const data = await inventoryApi.balances();
      setBalances(data || []);
    } catch (e) {
      const msg = e?.message === "Failed to fetch"
        ? "No se pudo conectar con el servidor. Revisa tu conexión o intenta más tarde."
        : (e?.message || "Error de conexión");
      setError(msg);
    }
    finally { endLoad("inventory"); }
  }, []);

  const adjustStock = useCallback(async (variantId, quantity, reason) => {
    await inventoryApi.adjust({ variantId, quantity, reason });
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

  const fetchOrders = useCallback(async (status) => {
    startLoad("orders");
    try {
      const data = await ordersApi.list(status);
      setOrders(data || []);
    } catch (e) {
      const msg = e?.message === "Failed to fetch"
        ? "No se pudo conectar con el servidor. Revisa tu conexión o intenta más tarde."
        : (e?.message || "Error de conexión");
      setError(msg);
    }
    finally { endLoad("orders"); }
  }, []);

  const createOrder = useCallback(async (body) => {
    const order = await ordersApi.create(body);
    await fetchOrders();
    return order;
  }, [fetchOrders]);

  const transitionOrder = useCallback(async (orderId, newStatus, note) => {
    await ordersApi.transition(orderId, { status: newStatus, note: note || "" });
    await fetchOrders();
  }, [fetchOrders]);

  const updateOrderAddress = useCallback(async (orderId, address) => {
    await ordersApi.updateAddress(orderId, { address });
    await fetchOrders();
  }, [fetchOrders]);

  return {
    products, orders, balances,
    loading, error, setError,
    // Products
    fetchProducts, createProduct, updateProduct, deleteProduct,
    // Variants
    createVariant, updateVariant, deleteVariant,
    // Inventory
    fetchBalances, adjustStock, getBalance, getAvailable,
    // Orders
    fetchOrders, createOrder, transitionOrder, updateOrderAddress,
  };
}
