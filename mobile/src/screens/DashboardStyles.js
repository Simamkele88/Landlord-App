import { StyleSheet } from "react-native";

// THEME COLORS
export const C = {
  bg: "#0F172A",
  surface: "#1E293B",
  surfaceAlt: "#273449",
  border: "#334155",
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  success: "#22C55E",
  successBg: "#052E16",
  warning: "#F59E0B",
  warningBg: "#451A03",
  danger: "#EF4444",
  dangerBg: "#450A0A",
  purple: "#A855F7",
  purpleBg: "#2D1B4E",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  white: "#FFFFFF",
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingTop: 16 },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: { fontSize: 14, color: C.textSecondary },
  tenantName: {
    fontSize: 26, fontWeight: "800", color: C.textPrimary, letterSpacing: -0.5,
  },
  nameRow: { flexDirection: "row", alignItems: "center" },
  bellWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  bellBadge: {
    position: "absolute", top: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.danger,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.bg,
  },
  bellBadgeText: { color: C.white, fontSize: 10, fontWeight: "700" },

  // Unit card
  unitCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border,
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 14,
  },
  unitCardLeft: { flex: 1 },
  unitCardProperty: {
    fontSize: 12, color: C.textMuted, marginBottom: 2,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  unitCardUnit: { fontSize: 18, fontWeight: "700", color: C.textPrimary, marginBottom: 4 },
  unitCardLease: { fontSize: 12, color: C.textSecondary },
  scorePill: {
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  scoreText: { fontSize: 12, fontWeight: "600" },

  // Rent card
  rentCard: {
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 14,
  },
  rentTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", padding: 20, paddingBottom: 14,
  },
  rentCardLabel: { fontSize: 13, color: C.textSecondary, marginBottom: 4 },
  rentCardAmount: {
    fontSize: 30, fontWeight: "800", color: C.textPrimary, letterSpacing: -1,
  },
  rentStatusPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  rentStatusText: {
    fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5,
  },
  rentBanner: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
  },
  rentBannerContent: {
    flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8,
  },
  rentBannerText: { fontSize: 13, fontWeight: "500", flex: 1, marginLeft: 8 },

  // Alert banner
  alertBanner: {
    backgroundColor: C.dangerBg, borderRadius: 12, borderWidth: 1,
    borderColor: C.danger, padding: 14, marginBottom: 14,
    flexDirection: "row", alignItems: "flex-start",
  },
  alertText: {
    fontSize: 13, color: C.danger, lineHeight: 19,
    fontWeight: "500", flex: 1, marginLeft: 10,
  },

  // Section labels
  sectionRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10, marginTop: 6,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: C.textMuted,
    textTransform: "uppercase", letterSpacing: 1,
  },
  sectionAction: { fontSize: 13, color: C.primary, fontWeight: "600" },

  // Quick actions
  qaGrid: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "space-between", marginBottom: 24,
  },
  qaCard: {
    width: "47.5%", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border,
    alignItems: "flex-start", marginBottom: 10,
  },
  qaIconWrap: { position: "relative", marginBottom: 10 },
  qaBadge: {
    position: "absolute", top: -4, right: -8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.danger,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.bg,
  },
  qaBadgeText: { color: C.white, fontSize: 10, fontWeight: "700" },
  qaLabel: { fontSize: 14, fontWeight: "700" },

  // Maintenance cards
  maintenanceCard: {
    backgroundColor: C.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border,
    flexDirection: "row", alignItems: "center", marginBottom: 10,
  },
  maintenanceLeft: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surfaceAlt,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  maintenanceBody: { flex: 1 },
  maintenanceTitle: {
    fontSize: 14, fontWeight: "600", color: C.textPrimary, marginBottom: 2,
  },
  maintenanceMeta: { fontSize: 12, color: C.textSecondary },
  maintenanceStatusDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 6,
  },
  maintenanceStatus: { fontSize: 12, fontWeight: "600" },

  // Contact card
  contactCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  contactRow: {
    flexDirection: "row", alignItems: "center",
  },
  contactAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  contactAvatarText: { color: C.white, fontSize: 15, fontWeight: "700" },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: "700", color: C.textPrimary },
  contactRole: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  contactBtn: {
    backgroundColor: C.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    flexDirection: "row", alignItems: "center",
  },
  contactBtnText: { color: C.white, fontSize: 13, fontWeight: "700", marginLeft: 6 },
});