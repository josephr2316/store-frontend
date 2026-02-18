import { useState, useEffect } from "react";
import { useStore }    from "./hooks/useStore";
import { tokenManager } from "./api/client";
import LoginPage       from "./pages/LoginPage";
import Sidebar         from "./components/Sidebar";
import { Toast }       from "./components/UI";
import PedidosPage     from "./pages/PedidosPage";
import CajaPage        from "./pages/CajaPage";
import ReportesPage    from "./pages/ReportesPage";

export default function App() {
  const [authed,   setAuthed]   = useState(tokenManager.isSet());
  const [tab,      setTab]      = useState("Pedidos");
  const [toastMsg, setToastMsg] = useState(null);
  const store = useStore();

  const toast = (msg) => setToastMsg(msg);

  // Listen for 401 logout events from the API client
  useEffect(() => {
    const handleLogout = () => {
      setAuthed(false);
      toast("⚠️ Sesión expirada. Por favor inicia sesión nuevamente.");
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // Bootstrap data after login
  useEffect(() => {
    if (!authed) return;
    store.fetchOrders();
    store.fetchBalances();
    store.fetchProducts();
  }, [authed]);

  const handleLogin = () => setAuthed(true);

  const handleLogout = () => {
    tokenManager.clear();
    setAuthed(false);
  };

  if (!authed) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>
        <LoginPage onLogin={handleLogin} />
        {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
      </>
    );
  }

  const pendingCount = store.orders.filter(o => (o.state || o.status) === "PENDING").length;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F8F9FB", color: "#0F0F19", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        @keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        select:focus, input:focus { outline: none !important; }
        button:active { transform: scale(0.97); }
      `}</style>

      <Sidebar activeTab={tab} onTabChange={setTab} pendingCount={pendingCount} onLogout={handleLogout} />

      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header style={{ padding: "14px 28px", background: "#fff", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{tab}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {pendingCount > 0 && (
              <span style={{ fontSize: 12, color: "#D97706", fontWeight: 600 }}>
                {pendingCount} pedido(s) pendiente(s)
              </span>
            )}
            {store.error && (
              <span
                onClick={() => store.setError(null)}
                style={{ fontSize: 12, color: "#DC2626", fontWeight: 600, cursor: "pointer",
                  background: "#FEE2E2", padding: "3px 10px", borderRadius: 20 }}>
                ❌ {store.error} ×
              </span>
            )}
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
          </div>
        </header>

        {/* Page */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {tab === "Pedidos"  && <PedidosPage  store={store} toast={toast} />}
          {tab === "Caja"     && <CajaPage     store={store} toast={toast} />}
          {tab === "Reportes" && <ReportesPage store={store} />}
        </div>
      </main>

      {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
    </div>
  );
}
