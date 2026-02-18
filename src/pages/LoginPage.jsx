import { useState } from "react";
import { authApi, tokenManager } from "../api/client";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError("Completa usuario y contraseña"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await authApi.login(username, password);
      // Common JWT response shapes: { token }, { accessToken }, { jwt }, or plain string
      const token =
        data?.token       ||
        data?.accessToken ||
        data?.jwt         ||
        (typeof data === "string" ? data : null);
      if (!token) throw new Error("Respuesta inesperada del servidor");
      tokenManager.set(token);
      onLogin();
    } catch (e) {
      setError(e.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#0F0F19",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 380, background: "#1E1E2E", borderRadius: 20,
          padding: "40px 36px", boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
        }}
      >
        {/* Brand */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            Tienda
          </div>
          <div style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
            Sistema de Gestión
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#FEE2E2", color: "#991B1B",
              borderRadius: 10, padding: "10px 14px",
              fontSize: 13, marginBottom: 20, fontWeight: 500,
            }}
          >
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Usuario
            </label>
            <input
              type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              style={{
                width: "100%", background: "#0F0F19", border: "1.5px solid #374151",
                borderRadius: 8, padding: "10px 14px", fontSize: 14,
                color: "#fff", fontFamily: "inherit", boxSizing: "border-box",
                outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={e  => (e.target.style.borderColor = "#6366F1")}
              onBlur={e   => (e.target.style.borderColor = "#374151")}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Contraseña
            </label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", background: "#0F0F19", border: "1.5px solid #374151",
                borderRadius: 8, padding: "10px 14px", fontSize: 14,
                color: "#fff", fontFamily: "inherit", boxSizing: "border-box",
                outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={e  => (e.target.style.borderColor = "#6366F1")}
              onBlur={e   => (e.target.style.borderColor = "#374151")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", background: "#6366F1", color: "#fff",
              border: "none", borderRadius: 10, padding: "12px",
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "#4B5563" }}>
          store-production-3316.up.railway.app
        </div>
      </div>
    </div>
  );
}
