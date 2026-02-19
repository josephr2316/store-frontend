import { useState, useEffect, useCallback } from "react";
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

  const toast = useCallback((msg) => setToastMsg(msg), []);

  // Listen for 401 logout events from the API client
  useEffect(() => {
    const handleLogout = () => {
      setAuthed(false);
      setToastMsg("⚠️ Sesión expirada. Por favor inicia sesión nuevamente.");
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
    store.fetchPendingCount();
  }, [authed]);

  const handleLogin = useCallback(() => setAuthed(true), []);
  const handleLogout = useCallback(() => {
    tokenManager.clear();
    setAuthed(false);
  }, []);

  if (!authed) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          @keyframes fadeInUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
        <LoginPage onLogin={handleLogin} />
        {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
      </>
    );
  }

  const pendingCount = store.pendingCount ?? 0;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F8FAFC", color: "#0F172A", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        @keyframes slideUp { from { transform: translateY(12px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pageIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes listItemIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes barGrow { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); transform-origin: bottom; } }
        @keyframes skeletonPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes contentIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-page { animation: pageIn 0.25s ease-out forwards; }
        .animate-list-item { animation: listItemIn 0.2s ease-out forwards; }
        .animate-card { animation: cardIn 0.3s ease-out forwards; }
        .animate-content-in { animation: contentIn 0.2s ease-out forwards; }
        select:focus, input:focus, button:focus-visible { outline: none; }
        button:focus-visible { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #6366F1; }
        input:focus, select:focus { box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
        button:active:not(:disabled) { transform: scale(0.98); }
      `}</style>

      <Sidebar activeTab={tab} onTabChange={setTab} pendingCount={pendingCount} onLogout={handleLogout} />

      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
        {/* Header */}
        <header style={{
          padding: "12px 24px", background: "#fff", borderBottom: "1px solid #E2E8F0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>{tab}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {pendingCount > 0 && (
              <span style={{
                fontSize: 13, color: "#92400E", fontWeight: 700, background: "#FEF3C7",
                padding: "6px 12px", borderRadius: 10, border: "1px solid #FCD34D",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}>
                {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
              </span>
            )}
            {store.error && (
              <span
                onClick={() => store.setError(null)}
                style={{ fontSize: 11, color: "#B91C1C", fontWeight: 600, cursor: "pointer",
                  background: "#FEE2E2", padding: "5px 10px", borderRadius: 8, maxWidth: 300,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
                ❌ {store.error} ×
              </span>
            )}
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.3)" }} title="Conectado" />
          </div>
        </header>

        {/* Page (animation on tab change) */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {tab === "Pedidos"  && <div className="animate-page" style={{ height: "100%" }}><PedidosPage  store={store} toast={toast} /></div>}
          {tab === "Caja"     && <div className="animate-page" style={{ height: "100%" }}><CajaPage     store={store} toast={toast} /></div>}
          {tab === "Reportes" && <div className="animate-page" style={{ height: "100%" }}><ReportesPage store={store} /></div>}
        </div>
      </main>

      {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
    </div>
  );
}
