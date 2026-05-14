import { StyleSheet, Platform } from "react-native";

export const C = {
  bg:           "#0F172A",
  surface:      "#1E293B",
  surfaceAlt:   "#273449",
  border:       "#334155",
  primary:      "#3B82F6",
  primaryDark:  "#2563EB",
  success:      "#22C55E",
  danger:       "#EF4444",
  warning:      "#F59E0B",
  textPrimary:  "#F1F5F9",
  textSecondary:"#94A3B8",
  textMuted:    "#64748B",
  white:        "#FFFFFF",
};

export const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: C.surface,
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
    color: C.textMuted,
    fontWeight: "500",
  },
  labelActive: {
    color: C.primary,
    fontWeight: "700",
  },
  activeDot: {
    position: "absolute",
    bottom: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.surface,
  },
  badgeText: {
    color: C.white,
    fontSize: 9,
    fontWeight: "800",
  },
});

export const headerStyles = StyleSheet.create({
  safe: {
    backgroundColor: C.surface,
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
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  hamburger: {
    gap: 5,
    alignItems: "flex-start",
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: C.textPrimary,
    borderRadius: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.3,
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
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "700",
  },
});

export const drawerStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  profileSection: {
    backgroundColor: C.surface,
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
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: C.primaryDark,
  },
  profileAvatarText: {
    color: C.white,
    fontSize: 24,
    fontWeight: "800",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 4,
  },
  profileUnit: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 12,
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
  scoreDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  scoreChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  navScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  navGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 8,
    marginBottom: 6,
    marginTop: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  navIconContainer: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.textPrimary,
  },
  navBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  navBadgeText: {
    color: C.white,
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },

  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.surface,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#450A0A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.danger,
    marginBottom: 12,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.danger,
  },
  version: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
  },
});