// TENANT PAYMENTS LIST SCREEN

import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";

const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", successBg: "#052E16",
  warning: "#F59E0B", warningBg: "#451A03",
  danger: "#EF4444", dangerBg: "#450A0A",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

const TENANT = {
  name: "Simamkele Wekeza", unit: "Unit 213-B",
  property: "Hillbrow Heights", rentAmount: 5800,
  dueDay: 1, leaseEnd: "2026-12-31", reliabilityScore: "Reliable",
};

const CURRENT_INVOICE = {
  id: "inv-004-2026", period: "April 2026", amount: 5800,
  dueDate: "2026-04-01", status: "unpaid", lateFee: 0, daysOverdue: 25,
};

const INITIAL_HISTORY = [
  { id: "p1", period: "April 2026", amount: 5800, status: "Unpaid", method: null, paidOn: null, receiptNo: null, reference: null },
  { id: "p2", period: "March 2026", amount: 5800, status: "Paid", method: "Bank Transfer", paidOn: "2026-03-01", receiptNo: "RCP-0003-260301", reference: "EFT-20260301-001" },
  { id: "p3", period: "February 2026", amount: 5800, status: "Paid", method: "In-App EFT", paidOn: "2026-02-01", receiptNo: "RCP-0003-260201", reference: "INAPP-20260201-001" },
  { id: "p4", period: "January 2026", amount: 5800, status: "Paid", method: "Bank Transfer", paidOn: "2026-01-03", receiptNo: "RCP-0003-260103", reference: "EFT-20260103-001" },
  { id: "p5", period: "December 2025", amount: 5500, status: "Paid", method: "In-App Card", paidOn: "2025-12-01", receiptNo: "RCP-0003-251201", reference: "CARD-20251201-001" },
  { id: "p6", period: "November 2025", amount: 5500, status: "Late", method: "Bank Transfer", paidOn: "2025-11-14", receiptNo: "RCP-0003-251114", reference: "EFT-20251114-001" },
  { id: "p7", period: "October 2025", amount: 5500, status: "Paid", method: "In-App EFT", paidOn: "2025-10-01", receiptNo: "RCP-0003-251001", reference: "INAPP-20251001-001" },
];

function fmt(amount) { return `R ${Number(amount).toLocaleString("en-ZA")}`; }
function statusConfig(status) {
  switch (status) {
    case "Paid": return { color: C.success, bg: C.successBg, label: "Paid" };
    case "Pending Approval": return { color: C.warning, bg: C.warningBg, label: "Pending" };
    case "Late": return { color: C.danger, bg: C.dangerBg, label: "Late" };
    case "Unpaid": return { color: C.danger, bg: C.dangerBg, label: "Unpaid" };
    default: return { color: C.textMuted, bg: C.surface, label: status };
  }
}

function StatusPill({ status }) {
  const { color, bg, label } = statusConfig(status);
  return (
    <View style={[S.pill, { backgroundColor: bg }]}>
      <Text style={[S.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function SectionLabel({ title, subtitle, actionLabel, onAction }) {
  return (
    <View style={S.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={S.sectionLabel}>{title}</Text>
        {subtitle ? <Text style={S.sectionSub}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={S.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// INVOICE CARD
function InvoiceCard({ invoice, status, onViewInvoice }) {
  const isOverdue = status === "overdue";
  const isPending = status === "pending_approval";
  const isPaid = status === "paid";
  const isUnpaid = status === "unpaid";

  return (
    <View style={[S.invoiceCard, isOverdue && { borderColor: C.danger + "60" }]}>
      <View style={S.invoiceTop}>
        <View style={S.invoiceIconWrap}>
          <Ionicons name="document-text" size={22} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.invoicePeriod}>{invoice.period} Invoice</Text>
          <Text style={S.invoiceDue}>Due {invoice.dueDate}</Text>
        </View>
        <Text style={[S.invoiceAmount, isOverdue && { color: C.danger }]}>
          {fmt(invoice.amount + (isOverdue ? invoice.lateFee : 0))}
        </Text>
      </View>
      <View style={S.invoiceDivider} />
      {isUnpaid && (
        <View style={[S.invoiceBanner, { backgroundColor: C.surfaceAlt }]}>
          <Ionicons name="time-outline" size={16} color={C.textSecondary} />
          <Text style={[S.invoiceBannerText, { color: C.textSecondary }]}>Rent is due — please make payment to avoid late fees.</Text>
        </View>
      )}
      {isOverdue && (
        <View style={[S.invoiceBanner, { backgroundColor: C.dangerBg }]}>
          <MaterialIcons name="error" size={16} color={C.danger} />
          <Text style={[S.invoiceBannerText, { color: C.danger }]}>{invoice.daysOverdue} days overdue</Text>
        </View>
      )}
      {isPending && (
        <View style={[S.invoiceBanner, { backgroundColor: C.warningBg }]}>
          <MaterialIcons name="pending-actions" size={16} color={C.warning} />
          <Text style={[S.invoiceBannerText, { color: C.warning }]}>Awaiting landlord approval</Text>
        </View>
      )}
      {isPaid && (
        <View style={[S.invoiceBanner, { backgroundColor: C.successBg }]}>
          <Ionicons name="checkmark-circle" size={16} color={C.success} />
          <Text style={[S.invoiceBannerText, { color: C.success }]}>Payment confirmed</Text>
        </View>
      )}
      <View style={S.invoiceDivider} />
      <TouchableOpacity style={S.invoiceViewRow} onPress={onViewInvoice} activeOpacity={0.7}>
        <Feather name="file-text" size={15} color={C.primary} />
        <Text style={S.invoiceViewText}>View Invoice</Text>
        <Feather name="chevron-right" size={15} color={C.primary} />
      </TouchableOpacity>
    </View>
  );
}

// HISTORY ROW
function HistoryRow({ item, onViewReceipt }) {
  const { color } = statusConfig(item.status);
  return (
    <View style={S.historyRow}>
      <View style={[S.historyDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={S.historyPeriod}>{item.period}</Text>
        <Text style={S.historyMeta}>
          {item.paidOn ? `Paid ${item.paidOn}` : "Not yet paid"}
          {item.method ? ` · ${item.method}` : ""}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={S.historyAmount}>{fmt(item.amount)}</Text>
        <StatusPill status={item.status} />
        {item.status === "Paid" && item.receiptNo && (
          <TouchableOpacity onPress={() => onViewReceipt(item)} activeOpacity={0.7}>
            <Text style={S.receiptLink}>View Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// MAIN SCREEN
export default function TenantPayments() {
  const navigation = useNavigation();
  const [history] = useState(INITIAL_HISTORY);
  const [invoiceStatus] = useState(CURRENT_INVOICE.status);

  const isPending = invoiceStatus === "pending_approval";
  const needsPay = invoiceStatus === "unpaid" || invoiceStatus === "overdue";

  function openReceipt(item) {
    navigation.getParent()?.navigate("PaymentReceipt", { payment: item });
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={S.pageHeader}>
          <View>
            <Text style={S.pageTitle}>Payments</Text>
            <Text style={S.pageSub}>{TENANT.unit} · {TENANT.property}</Text>
          </View>
          <View style={[S.scorePill, { borderColor: C.success }]}>
            <Text style={[S.scoreText, { color: C.success }]}>{TENANT.reliabilityScore}</Text>
          </View>
        </View>

        {/* INVOICE CARD */}
        <InvoiceCard
          invoice={CURRENT_INVOICE}
          status={invoiceStatus}
          onViewInvoice={() => navigation.getParent()?.navigate("PaymentInvoice", { invoice: CURRENT_INVOICE })}
        />

        {/* PAYMENT OPTIONS */}
        {needsPay && (
          <>
            <SectionLabel title="Make Payment" subtitle="Choose how you'd like to pay this month" />
            <View style={S.payOptions}>
              <TouchableOpacity
                style={S.payCard}
                onPress={() => navigation.getParent()?.navigate("PaymentMethod", { invoice: CURRENT_INVOICE, tenant: TENANT })}
                activeOpacity={0.8}
              >
                <View style={S.payCardIcon}>
                  <FontAwesome5 name="credit-card" size={26} color={C.primary} />
                </View>
                <Text style={S.payCardTitle}>Pay In-App</Text>
                <Text style={S.payCardSub}>Card, EFT, or mobile wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.payCard, { borderColor: C.border }]}
                onPress={() => navigation.getParent()?.navigate("PaymentUpload", { invoice: CURRENT_INVOICE })}
                activeOpacity={0.8}
              >
                <View style={[S.payCardIcon, { backgroundColor: C.surfaceAlt }]}>
                  <Feather name="upload" size={26} color={C.textSecondary} />
                </View>
                <Text style={S.payCardTitle}>Upload Proof</Text>
                <Text style={S.payCardSub}>EFT slip or bank confirmation</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* RESUBMIT */}
        {isPending && (
          <>
            <SectionLabel title="Actions" />
            <TouchableOpacity
              style={S.resubmit}
              onPress={() => navigation.getParent()?.navigate("PaymentUpload", { invoice: CURRENT_INVOICE })}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={18} color={C.warning} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.resubmitTitle}>Resubmit Proof of Payment</Text>
                <Text style={S.resubmitSub}>Update your submission if you made changes</Text>
              </View>
              <Feather name="chevron-right" size={18} color={C.warning} />
            </TouchableOpacity>
          </>
        )}

        {/* PAYMENT HISTORY */}
        <SectionLabel title="Payment History" subtitle="Your rent payment record" />
        <View style={S.historyCard}>
          {history.map((item, idx) => (
            <View key={item.id}>
              <HistoryRow item={item} onViewReceipt={openReceipt} />
              {idx < history.length - 1 && <View style={S.historyDivider} />}
            </View>
          ))}
        </View>

        {/* LEASE SUMMARY */}
        <SectionLabel title="Lease Summary" />
        <View style={S.leaseCard}>
          {[
            ["Monthly Rent", fmt(TENANT.rentAmount)],
            ["Payment Due", "1st of each month"],
            ["Lease Ends", TENANT.leaseEnd],
          ].map(([label, val], idx, arr) => (
            <View key={label} style={[S.leaseRow, idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <Text style={S.leaseLabel}>{label}</Text>
              <Text style={S.leaseValue}>{val}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// STYLES
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollPad: { padding: 20 },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: C.textPrimary, marginBottom: 4 },
  pageSub: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  scorePill: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  scoreText: { fontSize: 12, fontWeight: "600" },

  // INVOICE CARD
  invoiceCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 24 },
  invoiceTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20 },
  invoiceIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center" },
  invoicePeriod: { fontSize: 15, fontWeight: "700", color: C.textPrimary },
  invoiceDue: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  invoiceAmount: { fontSize: 22, fontWeight: "800", color: C.textPrimary, marginLeft: "auto" },
  invoiceDivider: { height: 1, backgroundColor: C.border },
  invoiceBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, paddingHorizontal: 16 },
  invoiceBannerText: { fontSize: 13, fontWeight: "600", flex: 1 },
  invoiceViewRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, paddingHorizontal: 16 },
  invoiceViewText: { flex: 1, fontSize: 13, fontWeight: "600", color: C.primary },

  // SECTION
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  sectionSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  sectionAction: { fontSize: 13, color: C.primary, fontWeight: "600" },

  // PAYMENT OPTIONS
  payOptions: { flexDirection: "row", gap: 12, marginBottom: 28 },
  payCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.primary + "40", padding: 18, position: "relative",
  },
  payCardIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  payCardTitle: { fontSize: 14, fontWeight: "700", color: C.textPrimary, marginBottom: 4 },
  payCardSub: { fontSize: 11, color: C.textSecondary, lineHeight: 16 },

  // RESUBMIT
  resubmit: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.warningBg, borderRadius: 14, borderWidth: 1,
    borderColor: C.warning + "30", padding: 16, marginBottom: 28,
  },
  resubmitTitle: { fontSize: 14, fontWeight: "600", color: C.warning },
  resubmitSub: { fontSize: 11, color: C.warning, opacity: 0.75, marginTop: 2 },

  // HISTORY
  historyCard: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 28 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  historyDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  historyDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  historyPeriod: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  historyMeta: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  receiptLink: { fontSize: 12, fontWeight: "600", color: C.primary },

  // PILL
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },

  // LEASE
  leaseCard: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 16 },
  leaseRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  leaseLabel: { fontSize: 13, color: C.textSecondary },
  leaseValue: { fontSize: 13, fontWeight: "600", color: C.textPrimary },
});