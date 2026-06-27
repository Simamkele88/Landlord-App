import { StyleSheet, Platform } from "react-native";

export const C = {
  black:        "#0a0a0a",
  muted:        "#141414",
  muted2:       "#1a1a1a",
  border:       "#2a2a2a",
  borderFocus:  "#3a3a3a",
  gold:         "#E8A012",
  white:        "#F5F0E8",
  blue:         "#3A8FD4",
  greenLight:   "#1A7A4A",
  green:        "#4CBA7A",
  redLight:     "#E05A4A",
  red:          "#C0392B",
  purple:       "#8B5CF6",
};

export const F = {
  bebas:   Platform.OS === "ios" ? "Bebas Neue" : "bebas-neue",
  dm:      Platform.OS === "ios" ? "DM Sans" : "dm-sans",
  mono:    Platform.OS === "ios" ? "Space Mono" : "space-mono",
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  scroll: { flex: 1, backgroundColor: C.black },
  content: { padding: 16, paddingTop: 8 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13, color: "rgba(245,240,232,0.4)",
    fontFamily: F.mono, letterSpacing: 0.5,
  },
  tenantName: {
    fontSize: 24, fontWeight: "700", color: C.white,
    fontFamily: F.bebas, letterSpacing: 1,
  },
  nameRow: { flexDirection: "row", alignItems: "center" },
  bellWrap: {
    width: 40, height: 40, borderRadius: 6,
    backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  bellBadge: {
    position: "absolute", top: -3, right: -3,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.redLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.black, paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: C.white, fontSize: 10, fontWeight: "700",
    fontFamily: F.mono,
  },

  unitCard: {
    backgroundColor: C.muted2, borderRadius: 6, padding: 14,
    borderWidth: 1, borderColor: C.border,
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 12,
  },
  unitCardLeft: { flex: 1 },
  unitCardProperty: {
    fontSize: 10, color: "rgba(245,240,232,0.25)",
    fontFamily: F.mono, textTransform: "uppercase",
    letterSpacing: 1.5, marginBottom: 4,
  },
  unitCardUnit: {
    fontSize: 17, fontWeight: "600", color: C.white,
    fontFamily: F.dm, marginBottom: 3,
  },
  unitCardLease: {
    fontSize: 11, color: "rgba(245,240,232,0.35)",
    fontFamily: F.mono,
  },
  scorePill: {
    borderWidth: 1.5, borderRadius: 3,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  scoreText: {
    fontSize: 10, fontWeight: "700",
    fontFamily: F.mono, letterSpacing: 1,
    textTransform: "uppercase",
  },

  rentCard: {
    backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 12,
  },
  rentTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", padding: 16, paddingBottom: 12,
  },
  rentCardLabel: {
    fontSize: 11, color: "rgba(245,240,232,0.35)",
    fontFamily: F.mono, letterSpacing: 1, textTransform: "uppercase",
    marginBottom: 4,
  },
  rentCardAmount: {
    fontSize: 28, fontWeight: "700", color: C.white,
    fontFamily: F.bebas, letterSpacing: 1,
  },
  rentStatusPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 3, borderWidth: 1,
  },
  rentStatusText: {
    fontSize: 10, fontWeight: "700", textTransform: "uppercase",
    fontFamily: F.mono, letterSpacing: 1,
  },
  rentBanner: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  rentBannerContent: {
    flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8,
  },
  rentBannerText: {
    fontSize: 12, fontWeight: "500", flex: 1, marginLeft: 8,
    fontFamily: F.dm,
  },

  alertBanner: {
    backgroundColor: "rgba(224,90,74,0.06)",
    borderRadius: 4, borderWidth: 1,
    borderColor: "rgba(224,90,74,0.15)",
    padding: 12, marginBottom: 14,
    flexDirection: "row", alignItems: "flex-start",
  },
  alertText: {
    fontSize: 12, color: C.redLight, lineHeight: 18,
    fontWeight: "500", flex: 1, marginLeft: 8,
    fontFamily: F.dm,
  },

  sectionRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10, marginTop: 4,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)",
    fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 2,
  },
  sectionAction: {
    fontSize: 11, color: C.gold, fontWeight: "600",
    fontFamily: F.mono, letterSpacing: 0.5,
  },

  qaGrid: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "space-between", marginBottom: 20,
  },
  qaCard: {
    width: "47.5%", borderRadius: 6, padding: 14,
    borderWidth: 1, borderColor: C.border,
    alignItems: "flex-start", marginBottom: 8,
  },
  qaIconWrap: { position: "relative", marginBottom: 10 },
  qaBadge: {
    position: "absolute", top: -4, right: -8,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.redLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.black, paddingHorizontal: 4,
  },
  qaBadgeText: {
    color: C.white, fontSize: 9, fontWeight: "700",
    fontFamily: F.mono,
  },
  qaLabel: {
    fontSize: 13, fontWeight: "600",
    fontFamily: F.dm, letterSpacing: 0.3,
  },

  maintenanceCard: {
    backgroundColor: C.muted2, borderRadius: 4, padding: 12,
    borderWidth: 1, borderColor: C.border,
    flexDirection: "row", alignItems: "center", marginBottom: 8,
  },
  maintenanceLeft: {
    width: 32, height: 32, borderRadius: 6,
    backgroundColor: C.black,
    borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
    marginRight: 10,
  },
  maintenanceBody: { flex: 1 },
  maintenanceTitle: {
    fontSize: 13, fontWeight: "600", color: C.white,
    fontFamily: F.dm, marginBottom: 2,
  },
  maintenanceMeta: {
    fontSize: 10, color: "rgba(245,240,232,0.3)",
    fontFamily: F.mono,
  },
  maintenanceStatusDot: {
    width: 6, height: 6, borderRadius: 3, marginRight: 6,
  },
  maintenanceStatus: {
    fontSize: 10, fontWeight: "600",
    fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 0.5,
  },

  contactCard: {
    backgroundColor: C.muted2, borderRadius: 6, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  contactRow: {
    flexDirection: "row", alignItems: "center",
  },
  contactAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(232,160,18,0.12)",
    borderWidth: 1.5, borderColor: "rgba(232,160,18,0.2)",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  contactAvatarText: {
    color: C.gold, fontSize: 14, fontWeight: "700",
    fontFamily: F.bebas,
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: 14, fontWeight: "600", color: C.white,
    fontFamily: F.dm,
  },
  contactRole: {
    fontSize: 11, color: "rgba(245,240,232,0.35)",
    fontFamily: F.mono, marginTop: 2,
  },
  contactBtn: {
    backgroundColor: C.gold, borderRadius: 3,
    paddingHorizontal: 12, paddingVertical: 7,
    flexDirection: "row", alignItems: "center",
  },
  contactBtnText: {
    color: C.black, fontSize: 11, fontWeight: "700",
    fontFamily: F.dm, marginLeft: 5, letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});