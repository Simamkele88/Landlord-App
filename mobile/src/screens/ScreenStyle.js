import { StyleSheet, Platform } from "react-native";

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
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, paddingTop: 20 },
  pageHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 20,
  },
  pageTitle: { fontSize: 24, fontWeight: "800", color: C.textPrimary },
  pageSub: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  scorePill: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  scoreText: { fontSize: 12, fontWeight: "600" },
});

export const S = StyleSheet.create({
  // INVOICE CARD
  invoiceCard: {
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 24,
  },
  invoiceTop: {
    flexDirection: "row", alignItems: "center", padding: 20,
  },
  invoiceIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: C.primary + "15",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  invoicePeriod: { fontSize: 15, fontWeight: "700", color: C.textPrimary },
  invoiceDue: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  invoiceAmount: {
    fontSize: 22, fontWeight: "800", color: C.textPrimary, marginLeft: "auto",
  },
  invoiceDivider: { height: 1, backgroundColor: C.border },
  invoiceBanner: {
    flexDirection: "row", alignItems: "flex-start",
    padding: 14, paddingHorizontal: 16,
  },
  invoiceBannerText: {
    fontSize: 13, fontWeight: "600", flex: 1, lineHeight: 18, marginLeft: 10,
  },
  invoiceViewRow: {
    flexDirection: "row", alignItems: "center",
    padding: 14, paddingHorizontal: 16,
  },
  invoiceViewText: {
    flex: 1, fontSize: 13, fontWeight: "600", color: C.primary, marginLeft: 8,
  },

  // PAYMENT OPTIONS
  payOptions: { flexDirection: "row", marginBottom: 28 },
  payCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.primary + "40", padding: 18,
    position: "relative", marginRight: 12,
  },
  payCardIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.primary + "15",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  payCardTitle: { fontSize: 14, fontWeight: "700", color: C.textPrimary, marginBottom: 4 },
  payCardSub: { fontSize: 11, color: C.textSecondary, lineHeight: 16 },
  recommendedBadge: {
    position: "absolute", top: 14, right: 14,
    backgroundColor: C.success + "20",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  recommendedText: { fontSize: 10, fontWeight: "600", color: C.success },

  // RESUBMIT
  resubmit: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.warningBg, borderRadius: 14,
    borderWidth: 1, borderColor: C.warning + "30",
    padding: 16, marginBottom: 28,
  },
  resubmitTitle: { fontSize: 14, fontWeight: "600", color: C.warning },
  resubmitSub: { fontSize: 11, color: C.warning, opacity: 0.75, marginTop: 2 },

  // HISTORY
  historyCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    marginBottom: 28,
  },
  historyRow: {
    flexDirection: "row", alignItems: "center", padding: 16,
  },
  historyDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  historyDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 12,
  },
  historyPeriod: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  historyMeta: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  receiptLink: { fontSize: 12, fontWeight: "600", color: C.primary },

  // LEASE
  leaseCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  leaseRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 14,
  },
  leaseLabel: { fontSize: 13, color: C.textSecondary },
  leaseValue: { fontSize: 13, fontWeight: "600", color: C.textPrimary },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-end", marginBottom: 12, marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: C.textMuted,
    textTransform: "uppercase", letterSpacing: 1,
  },
  sectionSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  sectionAction: { fontSize: 13, color: C.primary, fontWeight: "600" },

  // STATUS PILL
  pill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    alignSelf: "flex-start",
  },
  pillText: {
    fontSize: 10, fontWeight: "700", textTransform: "uppercase",
  },

  // MODAL SHELL
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1, borderColor: C.border, maxHeight: "90%",
  },
  handle: {
    width: 40, height: 4, backgroundColor: C.border,
    borderRadius: 2, alignSelf: "center", marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: C.textPrimary, marginBottom: 4 },
  sheetSub: { fontSize: 13, color: C.textSecondary, marginBottom: 20, lineHeight: 18 },

  // AMOUNT BREAKDOWN
  breakdown: {
    backgroundColor: C.surfaceAlt, borderRadius: 12,
    padding: 14, marginBottom: 20,
  },
  breakdownRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 5,
  },
  breakdownLabel: { fontSize: 13, color: C.textSecondary },
  breakdownValue: { fontSize: 13, fontWeight: "600", color: C.textPrimary },

  // INPUTS
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 11, fontWeight: "600", color: C.textSecondary,
    marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5,
  },
  input: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.textPrimary,
  },
  infoBanner: {
    flexDirection: "row", alignItems: "flex-start",
    padding: 12, backgroundColor: C.primary + "10",
    borderRadius: 10, marginTop: 4,
  },
  infoBannerText: {
    fontSize: 12, color: C.primary, flex: 1, lineHeight: 18, marginLeft: 10,
  },

  // BUTTONS
  footer: {
    flexDirection: "row", paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  btnPri: {
    flex: 1, flexDirection: "row", backgroundColor: C.primary,
    borderRadius: 14, paddingVertical: 14,
    alignItems: "center", justifyContent: "center", marginLeft: 5,
  },
  btnPriText: { color: C.white, fontSize: 15, fontWeight: "700", marginLeft: 6 },
  btnSec: {
    flex: 1, flexDirection: "row", backgroundColor: C.surfaceAlt,
    borderRadius: 14, paddingVertical: 14,
    alignItems: "center", justifyContent: "center", marginRight: 5,
  },
  btnSecText: { color: C.textSecondary, fontSize: 15, fontWeight: "600" },
  btnOff: { opacity: 0.4 },

  // INVOICE MODAL SPECIFICS
  invHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 20,
  },
  invHeaderLeft: {
    flexDirection: "row", alignItems: "center",
  },
  invIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: C.primary + "15",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  invTitle: { fontSize: 17, fontWeight: "700", color: C.textPrimary },
  invNo: {
    fontSize: 12, color: C.textSecondary, marginTop: 2,
  },
  invUnpaidBadge: {
    backgroundColor: C.dangerBg, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: C.danger + "30",
  },
  invUnpaidText: {
    fontSize: 11, fontWeight: "700", color: C.danger,
    textTransform: "uppercase", letterSpacing: 0.5,
  },

  // PARTIES
  invParties: {
    flexDirection: "row", backgroundColor: C.surfaceAlt,
    borderRadius: 12, padding: 14, marginBottom: 12,
  },
  invPartyLabel: {
    fontSize: 10, fontWeight: "700", color: C.textMuted,
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 5,
  },
  invPartyName: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  invPartyDetail: { fontSize: 12, color: C.textSecondary, marginTop: 2 },

  // DATES
  invDates: {
    flexDirection: "row", backgroundColor: C.surfaceAlt,
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  invDateBlock: { flex: 1, marginRight: 4 },
  invDateLabel: {
    fontSize: 10, fontWeight: "700", color: C.textMuted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
  },
  invDateValue: { fontSize: 12, fontWeight: "600", color: C.textPrimary },

  // TABLE
  invTable: {
    backgroundColor: C.surfaceAlt, borderRadius: 12,
    overflow: "hidden", marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
  },
  invTableHeader: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.bg,
  },
  invTableHeading: {
    fontSize: 10, fontWeight: "700", color: C.textMuted,
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  invTableRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  invTableCell: { fontSize: 14, color: C.textPrimary },
  invTableTotal: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
  },
  invTotalLabel: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  invTotalValue: { fontSize: 18, fontWeight: "800", color: C.primary },

  // NOTE
  invNote: {
    flexDirection: "row", alignItems: "flex-start",
    padding: 12, backgroundColor: C.primary + "10",
    borderRadius: 10, marginTop: 4,
  },
  invNoteText: { fontSize: 12, color: C.primary, flex: 1, lineHeight: 18, marginLeft: 10 },

  // RECEIPT MODAL
  receiptHeader: {
    backgroundColor: C.success, padding: 24, alignItems: "center",
    borderRadius: 16, marginBottom: 16,
  },
  receiptCheck: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  receiptTitle: { fontSize: 20, fontWeight: "800", color: C.white, marginBottom: 4 },
  receiptSub: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  receiptBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8, marginTop: 8,
  },
  receiptBadgeText: {
    fontSize: 12, fontWeight: "600", color: C.white,
  },
  receiptRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  receiptLabel: { fontSize: 13, color: C.textSecondary },
  receiptValue: {
    fontSize: 13, fontWeight: "600", color: C.textPrimary,
    textAlign: "right", flex: 1, marginLeft: 16,
  },
  receiptFootnote: {
    fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 16,
  },

  // FILE PICKER (for UploadProofModal)
  filePicker: {
    borderWidth: 2, borderColor: C.border, borderStyle: "dashed",
    borderRadius: 14, padding: 20,
  },
  filePickerDone: {
    borderColor: C.success, borderStyle: "solid",
    backgroundColor: C.success + "05",
  },
  fileRow: {
    flexDirection: "row", alignItems: "center",
  },
  fileEmpty: {
    alignItems: "center",
  },
  fileIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary + "10",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  filePrompt: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  fileHint: { fontSize: 11, color: C.textMuted },
  fileName: { fontSize: 14, fontWeight: "600" },
  fileMeta: { fontSize: 11, color: C.textMuted, marginTop: 2 },
});