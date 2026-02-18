import { useEffect } from "react";
import { STATE_COLORS, ORDER_STATE_LABELS } from "../constants/index";

export const Badge = ({ state }) => {
  const key = state?.toUpperCase?.() || state;
  const c = STATE_COLORS[state] || STATE_COLORS[key] || { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
  const label = ORDER_STATE_LABELS[key] || ORDER_STATE_LABELS[state] || state;
  return (
    <span style={{ background: c.bg, color: c.text, display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {label}
    </span>
  );
};

export const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,15,25,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: width,
        boxShadow: "0 25px 80px rgba(0,0,0,0.25)", overflow: "hidden", animation: "slideUp 0.2s ease" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0F0F0",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F0F19" }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: "#666", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px 24px", maxHeight: "75vh", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
};

export const Toast = ({ msg, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  const isErr = msg?.startsWith("❌");
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, padding: "12px 20px",
      background: isErr ? "#FEE2E2" : "#D1FAE5", color: isErr ? "#991B1B" : "#065F46",
      borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
      zIndex: 2000, animation: "slideUp 0.25s ease", maxWidth: 340 }}>
      {msg}
    </div>
  );
};

export const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
    <input {...props} style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px",
      fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.15s", ...props.style }}
      onFocus={e => (e.target.style.borderColor = "#6366F1")} onBlur={e => (e.target.style.borderColor = "#E5E7EB")} />
  </div>
);

export const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
    <select {...props} style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 12px",
      fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fff", cursor: "pointer", ...props.style }}>
      {children}
    </select>
  </div>
);

export const Btn = ({ children, variant = "primary", size = "md", ...props }) => {
  const styles = {
    primary:   { background: "#6366F1", color: "#fff",    border: "none" },
    secondary: { background: "#F3F4F6", color: "#374151", border: "1.5px solid #E5E7EB" },
    danger:    { background: "#FEE2E2", color: "#DC2626", border: "1.5px solid #FCA5A5" },
    green:     { background: "#D1FAE5", color: "#065F46", border: "1.5px solid #6EE7B7" },
    ghost:     { background: "transparent", color: "#6366F1", border: "1.5px solid #C7D2FE" },
  };
  const sizes = { sm: { padding: "5px 12px", fontSize: 12 }, md: { padding: "9px 18px", fontSize: 14 }, lg: { padding: "12px 24px", fontSize: 15 } };
  return (
    <button {...props} style={{ ...styles[variant], ...sizes[size], borderRadius: 8, cursor: "pointer", fontWeight: 600,
      fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s",
      opacity: props.disabled ? 0.5 : 1, ...props.style }}>
      {children}
    </button>
  );
};

export const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{children}</div>
);

export const AlertBox = ({ type = "warning", children }) => {
  const styles = { warning: { bg: "#FEF3C7", color: "#92400E" }, danger: { bg: "#FEE2E2", color: "#991B1B" }, info: { bg: "#DBEAFE", color: "#1E40AF" }, success: { bg: "#D1FAE5", color: "#065F46" } };
  const s = styles[type];
  return <div style={{ background: s.bg, color: s.color, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{children}</div>;
};
