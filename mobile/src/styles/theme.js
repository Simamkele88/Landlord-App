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

export const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: C.muted2,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    position: "relative",
  },
  iconWrap: {
    position: "relative",
  },
  icon: {
    fontSize: 22,
    opacity: 0.4,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    color: "rgba(245,240,232,0.35)",
    fontWeight: "500",
  },
  labelActive: {
    color: C.gold,
    fontWeight: "700",
  },
  activeDot: {
    position: "absolute",
    bottom: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.gold,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.redLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.muted2,
  },
  badgeText: {
    color: C.white,
    fontSize: 9,
    fontWeight: "800",
  },
});

export const headerStyles = StyleSheet.create({
  safe: {
    backgroundColor: C.muted2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hamburger: {
    gap: 5,
    alignItems: "flex-start",
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: C.white,
    borderRadius: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: C.white,
    fontFamily: F.bebas,
    letterSpacing: 1,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(232,160,18,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(232,160,18,0.3)",
  },
  avatarText: {
    color: C.gold,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: F.bebas,
  },
});

export const drawerStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.black },
  profileSection: {
    backgroundColor: C.muted2,
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(232,160,18,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(232,160,18,0.25)",
  },
  profileAvatarText: {
    color: C.gold,
    fontSize: 24,
    fontWeight: "800",
    fontFamily: F.bebas,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: C.white,
  },
  profileUnit: {
    fontSize: 13,
    color: "rgba(245,240,232,0.4)",
    marginBottom: 12,
    fontFamily: F.mono,
  },
  scoreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  scoreDot: { width: 7, height: 7, borderRadius: 4 },
  scoreChipText: { fontSize: 12, fontWeight: "700" },
  navScroll: { flex: 1, paddingHorizontal: 12, paddingTop: 16 },
  navGroupLabel: {
    fontSize: 11, fontWeight: "700", color: "rgba(245,240,232,0.18)",
    textTransform: "uppercase", letterSpacing: 1.5,
    paddingHorizontal: 8, marginBottom: 6, marginTop: 4,
    fontFamily: F.mono,
  },
  navItem: {
    flexDirection: "row", alignItems: "center",
    gap: 14, paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: 4, marginBottom: 2,
  },
  navIconContainer: { width: 26, alignItems: "center", justifyContent: "center" },
  navLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: C.white },
  navBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.redLight,
    alignItems: "center", justifyContent: "center",
  },
  navBadgeText: { color: C.white, fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  logoutSection: {
    borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: C.muted2,
  },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: "rgba(224,90,74,0.08)",
    borderRadius: 4, borderWidth: 1, borderColor: "rgba(224,90,74,0.2)",
    marginBottom: 12,
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontWeight: "700", color: C.redLight },
  version: { fontSize: 11, color: "rgba(245,240,232,0.2)", textAlign: "center" },
});

// ── SHARED STYLES ─────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.black },
  container: { padding: 16 },
  card: {
    backgroundColor: C.muted2, borderRadius: 6,
    padding: 16, borderWidth: 1, borderColor: C.border,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: "700", color: C.white,
    fontFamily: F.bebas, letterSpacing: 1, marginBottom: 12,
  },
  input: {
    backgroundColor: C.black, borderWidth: 1, borderColor: C.border,
    borderRadius: 3, padding: 14, fontSize: 15,
    color: C.white, fontFamily: F.dm,
  },
  btnPrimary: {
    backgroundColor: C.gold, borderRadius: 3,
    paddingVertical: 14, paddingHorizontal: 24,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
  },
  btnPrimaryText: {
    color: C.black, fontSize: 15, fontWeight: "700",
    fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase",
  },
  btnGhost: {
    backgroundColor: "transparent", borderWidth: 1, borderColor: C.border,
    borderRadius: 3, paddingVertical: 14, paddingHorizontal: 24,
    alignItems: "center", justifyContent: "center",
  },
  btnGhostText: {
    color: "rgba(245,240,232,0.5)", fontSize: 15, fontWeight: "500",
    fontFamily: F.dm, letterSpacing: 0.5,
  },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 3, borderWidth: 1,
  },
  pillText: {
    fontSize: 10, fontWeight: "700", textTransform: "uppercase",
    fontFamily: F.mono, letterSpacing: 1,
  },
  emptyText: {
    fontSize: 14, color: "rgba(245,240,232,0.25)",
    textAlign: "center", paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1, backgroundColor: C.black,
    alignItems: "center", justifyContent: "center",
  },
  loadingText: {
    color: "rgba(245,240,232,0.3)", marginTop: 12,
    fontSize: 14, fontFamily: F.mono,
  },
});