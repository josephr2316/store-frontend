import { useState, useEffect, useCallback } from "react";
import { useStore }    from "./hooks/useStore";
import { tokenManager } from "./api/client";
import LoginPage       from "./pages/LoginPage";
import Sidebar         from "./components/Sidebar";
import { Toast }       from "./components/UI";
import PedidosPage     from "./pages/PedidosPage";
import CajaPage        from "./pages/CajaPage";
import ReportesPage    from "./pages/ReportesPage";

const MOBILE_BREAKPOINT = 768;

export default function App() {
  const [authed,   setAuthed]   = useState(tokenManager.isSet());
  const [tab,      setTab]      = useState("Pedidos");
  const [toastMsg, setToastMsg] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const store = useStore();

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => {
      setIsMobile(mql.matches);
      if (!mql.matches) setSidebarOpen(false);
    };
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

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
  const handleTabChange = useCallback((newTab) => {
    setTab(newTab);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

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
        html, body { -webkit-text-size-adjust: 100%; touch-action: manipulation; }
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
        @media (max-width: 768px) {
          .sidebar-drawer { position: fixed; left: 0; top: 0; bottom: 0; z-index: 1000; width: 280px; max-width: 85vw; transform: translateX(-100%); transition: transform 0.25s ease, box-shadow 0.25s ease; padding-top: env(safe-area-inset-top); padding-left: env(safe-area-inset-left); }
          .sidebar-drawer.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.2); }
          .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
          .sidebar-overlay.open { opacity: 1; pointer-events: auto; }
          .app-header { padding: 12px 16px; padding-left: max(16px, env(safe-area-inset-left)); padding-right: max(16px, env(safe-area-inset-right)); padding-top: max(12px, env(safe-area-inset-top)); flex-wrap: wrap; gap: 8; }
          .app-header h1 { font-size: 16; }
          .pedidos-layout { flex-direction: column; min-height: 0; }
          .pedidos-list { width: 100% !important; min-width: 0 !important; max-height: 40vh; border-right: none !important; border-bottom: 1px solid #E2E8F0 !important; flex-shrink: 0; }
          .caja-grid { grid-template-columns: 1fr !important; }
          .reportes-main-grid { grid-template-columns: 1fr !important; }
          .reportes-filter-row { flex-wrap: wrap; }
          .create-order-grid-2 { grid-template-columns: 1fr !important; }
          .create-order-add-row { grid-template-columns: 1fr 1fr !important; }
          .modal-overlay { padding: 12px; align-items: flex-start; overflow-y: auto; }
          .modal-content { max-height: calc(100vh - 24px); overflow-y: auto; }
        }
        @media (max-width: 480px) {
          .create-order-add-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {isMobile && (
        <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}
      <div style={{ display: isMobile ? "block" : "flex", height: "100%" }}>
        <div className={isMobile ? `sidebar-drawer ${sidebarOpen ? "open" : ""}` : undefined} style={!isMobile ? { flexShrink: 0 } : undefined}>
          <Sidebar activeTab={tab} onTabChange={handleTabChange} pendingCount={pendingCount} onLogout={handleLogout} />
        </div>

      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "#F8FAFC", minWidth: 0 }} className="app-main">
        <header className="app-header" style={{
          padding: "12px 24px", background: "#fff", borderBottom: "1px solid #E2E8F0",
          paddingLeft: "max(24px, env(safe-area-inset-left))", paddingRight: "max(24px, env(safe-area-inset-right))", paddingTop: "max(12px, env(safe-area-inset-top))",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {isMobile && (
              <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"
                style={{ flexShrink: 0, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 10, cursor: "pointer", fontSize: 20 }}>
                ☰
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tab}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
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
      </div>

      {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
    </div>
  );
}
