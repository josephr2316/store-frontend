/**
 * Design system – paleta y tokens para una app moderna y consistente.
 * Uso: import { theme } from './theme';
 */
export const theme = {
  // Colores principales
  primary: "#6366F1",
  primaryHover: "#4F46E5",
  primaryLight: "#EEF2FF",
  primaryMuted: "#A5B4FC",

  // Neutros (slate)
  bg: "#F8FAFC",
  bgCard: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  text: "#0F172A",
  textMuted: "#64748B",
  textSubtle: "#94A3B8",

  // Sidebar
  sidebarBg: "#0F172A",
  sidebarBgHover: "#1E293B",
  sidebarText: "#F8FAFC",
  sidebarTextMuted: "#94A3B8",
  sidebarActive: "#6366F1",
  sidebarActiveBg: "rgba(99, 102, 241, 0.12)",

  // Estados
  success: "#10B981",
  successBg: "#D1FAE5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  error: "#EF4444",
  errorBg: "#FEE2E2",
  info: "#3B82F6",
  infoBg: "#DBEAFE",

  // Shadows (subtle, modern style)
  shadowSm: "0 1px 2px rgba(0, 0, 0, 0.04)",
  shadow: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
  shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
  shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
  shadowXl: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",

  // Radios
  radiusSm: 6,
  radius: 10,
  radiusMd: 12,
  radiusLg: 16,

  // Spacing (multiples of 4)
  space: (n) => n * 4,
  fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
};
