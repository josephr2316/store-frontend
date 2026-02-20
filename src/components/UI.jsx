import { useEffect, useId } from "react";
import { STATE_COLORS, ORDER_STATE_LABELS } from "../constants/index";

export const Badge = ({ state }) => {
  const key = state?.toUpperCase?.() || state;
  const c = STATE_COLORS[state] || STATE_COLORS[key] || { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" };
  const label = ORDER_STATE_LABELS[key] || ORDER_STATE_LABELS[state] || state;
  return (
    <span style={{
      background: c.bg, color: c.text, display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
      border: "1px solid transparent", boxSizing: "border-box",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block", flexShrink: 0 }} />
      {label}
    </span>
  );
};

export const Modal = ({ open, onClose, title, children, width = 520 }) => {
  const titleId = useId();
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: width,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.2)", overflow: "hidden",
          animation: "slideUp 0.25s cubic-bezier(0.21, 0.47, 0.32, 0.98)", border: "1px solid #E2E8F0",
        }}
      >
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid #E2E8F0",
          display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC",
        }}>
          <h2 id={titleId} style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>{title}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            style={{
              border: "none", background: "none", width: 32, height: 32, borderRadius: 8,
              fontSize: 18, cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#E2E8F0"; e.currentTarget.style.color = "#0F172A"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#64748B"; }}
          >
            ×
          </button>
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
    <div role="status" aria-live="polite" style={{
      position: "fixed", bottom: 24, right: 24, padding: "12px 18px",
      background: isErr ? "#FEE2E2" : "#D1FAE5", color: isErr ? "#991B1B" : "#065F46",
      borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
      zIndex: 2000, animation: "slideUp 0.25s ease", maxWidth: 360, border: isErr ? "1px solid #FECACA" : "1px solid #A7F3D0",
    }}>
      {msg}
    </div>
  );
};

const inputBase = {
  width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px",
  fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s", background: "#fff",
};

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, letterSpacing: "0.02em" };

export const Input = ({ label, wrapperStyle, ...props }) => (
  <div style={{ marginBottom: 16, ...wrapperStyle }}>
    {label && (
      <label style={labelStyle}>
        {label}
      </label>
    )}
    <input
      {...props}
      style={{ ...inputBase, ...props.style }}
      onFocus={e => {
        e.target.style.borderColor = "#6366F1";
        e.target.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.15)";
      }}
      onBlur={e => {
        e.target.style.borderColor = "#E2E8F0";
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

export const Select = ({ label, children, wrapperStyle, ...props }) => (
  <div style={{ marginBottom: 16, ...wrapperStyle }}>
    {label && (
      <label style={labelStyle}>
        {label}
      </label>
    )}
    <select
      {...props}
      style={{ ...inputBase, cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: 18, paddingRight: 40, ...props.style }}
    >
      {children}
    </select>
  </div>
);

export const Btn = ({ children, variant = "primary", size = "md", ...props }) => {
  const styles = {
    primary:   { background: "#6366F1", color: "#fff", border: "none" },
    secondary: { background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" },
    danger:    { background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" },
    green:     { background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" },
    ghost:     { background: "transparent", color: "#6366F1", border: "1px solid #C7D2FE" },
  };
  const sizes = { sm: { padding: "6px 12px", fontSize: 12 }, md: { padding: "9px 16px", fontSize: 14 }, lg: { padding: "12px 20px", fontSize: 15 } };
  const hover = {
    primary:   { background: "#4F46E5" },
    secondary: { background: "#E2E8F0" },
    danger:    { background: "#FECACA" },
    green:     { background: "#A7F3D0" },
    ghost:     { background: "rgba(99, 102, 241, 0.08)" },
  };
  return (
    <button
      {...props}
      style={{
        ...styles[variant], ...sizes[size], borderRadius: 10, cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        transition: "all 0.15s", opacity: props.disabled ? 0.6 : 1, ...props.style,
      }}
      onMouseEnter={e => { if (!props.disabled && hover[variant]) e.currentTarget.style.background = hover[variant].background; }}
      onMouseLeave={e => { if (!props.disabled && styles[variant]) e.currentTarget.style.background = styles[variant].background; }}
    >
      {children}
    </button>
  );
};

export const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{children}</div>
);

export const AlertBox = ({ type = "warning", children }) => {
  const styles = {
    warning: { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
    danger:  { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
    info:    { bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE" },
    success: { bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, marginBottom: 16 }}>
      {children}
    </div>
  );
};
