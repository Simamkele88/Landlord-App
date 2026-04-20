import { StyleSheet, Platform } from "react-native";

// THEME COLORS
export const C = {
  bg:           "#0F172A",   
  surface:      "#1E293B",   
  surfaceAlt:   "#273449",   
  border:       "#334155",
  primary:      "#3B82F6",  
  primaryDark:  "#2563EB",
  success:      "#22C55E",
  successBg:    "#052E16",
  warning:      "#F59E0B",
  warningBg:    "#451A03",
  danger:       "#EF4444",
  dangerBg:     "#450A0A",
  purple:       "#A855F7",
  purpleBg:     "#2D1B4E",
  textPrimary:  "#F1F5F9",
  textSecondary:"#94A3B8",
  textMuted:    "#64748B",
  white:        "#FFFFFF",
};

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
  },

  // ── Header
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  scorePill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Rent card
  rentCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  rentCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  rentLabel: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 4,
  },
  rentAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: C.textPrimary,
    letterSpacing: -1,
  },
  dueBanner: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dueText: {
    fontSize: 13,
    fontWeight: "500",
  },
  pendingBanner: {
    backgroundColor: C.warningBg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pendingText: {
    fontSize: 13,
    color: C.warning,
    fontWeight: "500",
  },
  paidBanner: {
    backgroundColor: C.successBg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  paidText: {
    fontSize: 13,
    color: C.success,
    fontWeight: "500",
  },

  // ── Section label
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },

  // ── Action cards
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  actionCardPrimary: {
    backgroundColor: C.primary,
    borderColor: C.primaryDark,
  },
  actionCardSecondary: {
    backgroundColor: C.surface,
    borderColor: C.border,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.white,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },

  // resubmit
  resubmitBtn: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  resubmitText: {
    color: C.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── History card
  historyCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  historyLeft: {
    flex: 1,
  },
  historyPeriod: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textPrimary,
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: 12,
    color: C.textSecondary,
  },
  historyRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 4,
  },
  receiptLink: {
    fontSize: 12,
    color: C.primary,
    fontWeight: "600",
    marginTop: 4,
  },

  // ── Lease card
  leaseCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  leaseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  leaseLabel: {
    fontSize: 13,
    color: C.textSecondary,
  },
  leaseValue: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textPrimary,
  },

  // ── Status pill
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Divider
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },

  // ── Modal / bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    borderColor: C.border,
    maxHeight: "92%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 20,
  },

  // ── Inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
  },
  filePicker: {
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  filePickerSelected: {
    borderColor: C.success,
    borderStyle: "solid",
  },
  filePickerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filePickerIcon: {
    fontSize: 22,
  },
  filePickerText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textPrimary,
  },
  filePickerSub: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },

  // ── Info box
  infoBox: {
    backgroundColor: "#1e3a5f",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: "#93c5fd",
    lineHeight: 18,
  },

  // ── Buttons
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  btnSecondaryText: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.45,
  },

  // ── Payment method cards
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  methodCardActive: {
    borderColor: C.primary,
    backgroundColor: "#1e3a5f",
  },
  methodIcon: {
    fontSize: 24,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textPrimary,
  },
  methodSub: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: C.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },

  // ── Confirm card
  confirmCard: {
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  confirmLabel: {
    fontSize: 13,
    color: C.textSecondary,
  },
  confirmValue: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textPrimary,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  confirmTotal: {
    borderBottomWidth: 0,
  },
  confirmTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textPrimary,
  },
  confirmTotalValue: {
    fontSize: 17,
    fontWeight: "800",
    color: C.success,
  },

  // ── Success state
  successContent: {
    alignItems: "center",
    paddingVertical: 12,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.successBg,
    borderWidth: 2,
    borderColor: C.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    color: C.success,
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // ── Receipt modal
  receiptHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  receiptCheckCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
  },
  receiptNo: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: C.textSecondary,
  },
  receiptFootnote: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  // Method card icon
methodIconContainer: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: C.surface,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 12,
},

// Due banner content row
dueBannerContent: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},

// Action card icon
actionIconContainer: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: C.surfaceAlt,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
},

// Pending banner
pendingBanner: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  padding: 12,
  backgroundColor: C.warningBg,
  borderRadius: 10,
  marginTop: 12,
},

// Paid banner
paidBanner: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  padding: 12,
  backgroundColor: C.successBg,
  borderRadius: 10,
  marginTop: 12,
},

// Resubmit button
resubmitBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: 14,
  backgroundColor: C.warningBg,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: C.warning,
  marginBottom: 20,
},

resubmitText: {
  fontSize: 14,
  fontWeight: "600",
  color: C.warning,
},
});

