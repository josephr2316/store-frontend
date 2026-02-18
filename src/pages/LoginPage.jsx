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
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24,
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.03)",
          borderRadius: 20, padding: "40px 36px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          animation: "fadeInUp 0.4s cubic-bezier(0.21, 0.47, 0.32, 0.98) forwards",
        }}
      >
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            Tienda
          </div>
          <div style={{ color: "#94A3B8", fontSize: 13, marginTop: 4 }}>
            Sistema de Gestión
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(254, 226, 226, 0.15)", color: "#FCA5A5",
              borderRadius: 12, padding: "12px 14px", fontSize: 13, marginBottom: 20,
              border: "1px solid rgba(248, 113, 113, 0.3)",
            }}
          >
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 8 }}>
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              autoFocus
              style={{
                width: "100%", background: "rgba(15, 23, 42, 0.6)", border: "1px solid #334155",
                borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#F8FAFC",
                fontFamily: "inherit", boxSizing: "border-box", outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={e => {
                e.target.style.borderColor = "#6366F1";
                e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.2)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "#334155";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94A3B8", marginBottom: 8 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", background: "rgba(15, 23, 42, 0.6)", border: "1px solid #334155",
                borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#F8FAFC",
                fontFamily: "inherit", boxSizing: "border-box", outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={e => {
                e.target.style.borderColor = "#6366F1";
                e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.2)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "#334155";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", background: loading ? "#4F46E5" : "#6366F1", color: "#fff",
              border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              opacity: loading ? 0.85 : 1, transition: "background 0.2s, opacity 0.2s",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
            }}
          >
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#64748B" }}>
          Conectado al servidor
        </div>
      </div>
    </div>
  );
}
