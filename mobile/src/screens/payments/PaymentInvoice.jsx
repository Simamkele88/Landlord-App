// TENANT PAYMENT INVOICE DETAIL PAGE 
import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";

const C = {
  black:        "#0a0a0a",
  muted:        "#141414",
  muted2:       "#1a1a1a",
  border:       "#2a2a2a",
  gold:         "#E8A012",
  white:        "#F5F0E8",
  blue:         "#3A8FD4",
  greenLight:   "#1A7A4A",
  redLight:     "#E05A4A",
};

const F = {
  bebas: "bebas-neue",
  dm:    "dm-sans",
  mono:  "space-mono",
};

function fmt(amount) { return `R ${Number(amount || 0).toLocaleString("en-ZA")}`; }

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr).slice(0, 10);
    return date.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

function formatPeriod(startStr, endStr) {
  if (startStr && endStr) {
    return `${formatDate(startStr)} — ${formatDate(endStr)}`;
  }
  if (startStr) {
    try {
      const date = new Date(startStr);
      return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
    } catch {
      return String(startStr).slice(0, 7);
    }
  }
  return "Current";
}

function statusConfig(status) {
  switch (status) {
    case "paid": return { color: C.greenLight, bg: "rgba(26,122,74,0.08)", label: "Paid" };
    case "pending":
    case "pending_approval": return { color: C.gold, bg: "rgba(232,160,18,0.06)", label: "Pending" };
    case "overdue": return { color: C.redLight, bg: "rgba(224,90,74,0.08)", label: "Overdue" };
    case "sent":
    case "unpaid": return { color: C.redLight, bg: "rgba(224,90,74,0.08)", label: "Unpaid" };
    default: return { color: "rgba(245,240,232,0.4)", bg: C.muted2, label: String(status) };
  }
}

export default function PaymentInvoice() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice } = route.params || {};

  const [downloading, setDownloading] = useState(false);

  if (!invoice) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Feather name="arrow-left" size={20} color={C.white} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Invoice</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={S.centerBlock}>
          <Feather name="file-text" size={40} color="rgba(245,240,232,0.15)" />
          <Text style={S.emptyText}>Invoice not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.goBackBtn}>
            <Text style={S.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = invoice.status || "unpaid";
  const statusCfg = statusConfig(status);
  const invoiceNo = invoice.invoice_number || `INV-${String(invoice.id || "").slice(0, 8)}`;
  const total = (invoice.amount_due || invoice.amount || 0) + (invoice.late_fees || invoice.lateFee || 0);
  const period = invoice.billing_period_start 
    ? formatPeriod(invoice.billing_period_start, invoice.billing_period_end)
    : invoice.period || "—";
  const dueDate = formatDate(invoice.due_date || invoice.dueDate);

  const lineItems = [
    { description: "Monthly Rent", amount: invoice.amount_due || invoice.amount || 0 },
    ...((invoice.late_fees || invoice.lateFee || 0) > 0 
      ? [{ description: "Late Payment Fee", amount: invoice.late_fees || invoice.lateFee }] 
      : []),
  ];

  async function handleDownload() {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      Alert.alert("Download", "PDF download will be available soon.");
    }, 1000);
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.white} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Invoice</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* INVOICE HEADER */}
        <View style={S.invHeader}>
          <View style={S.invHeaderLeft}>
            <View style={S.invIcon}>
              <Ionicons name="document-text" size={20} color={C.gold} />
            </View>
            <View>
              <Text style={S.invTitle}>{period}</Text>
              <Text style={S.invNo}>{invoiceNo}</Text>
            </View>
          </View>
          <View style={[S.invBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.color + "30" }]}>
            <Text style={[S.invBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>BILLED TO</Text>
          <Text style={S.sectionName}>{invoice.tenant_name || "Tenant"}</Text>
          <Text style={S.sectionDetail}>
            {invoice.unit_number ? `Unit ${invoice.unit_number}` : "—"} · {invoice.property_name || "—"}
          </Text>
        </View>

        <View style={S.section}>
          <Text style={S.sectionLabel}>FROM</Text>
          <Text style={S.sectionName}>Chihwa Rentals</Text>
          <Text style={S.sectionDetail}>Property Owner</Text>
        </View>

        {/* DATES */}
        <View style={S.dateRow}>
          <View style={S.dateBlock}>
            <Text style={S.dateLabel}>Due Date</Text>
            <Text style={S.dateValue}>{dueDate}</Text>
          </View>
          <View style={S.dateBlock}>
            <Text style={S.dateLabel}>Period</Text>
            <Text style={S.dateValue}>{period}</Text>
          </View>
        </View>

        {/* LINE ITEMS */}
        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.tableHeading, { flex: 1 }]}>Description</Text>
            <Text style={[S.tableHeading, { textAlign: "right" }]}>Amount</Text>
          </View>
          {lineItems.map((item, idx) => (
            <View key={idx} style={S.tableRow}>
              <Text style={[S.tableCell, { flex: 1 }]}>{item.description}</Text>
              <Text style={[S.tableCell, { textAlign: "right" }]}>{fmt(item.amount)}</Text>
            </View>
          ))}
          <View style={S.tableTotal}>
            <Text style={S.totalLabel}>Total Due</Text>
            <Text style={S.totalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* NOTE */}
        <View style={S.note}>
          <Feather name="info" size={13} color={C.blue} />
          <Text style={S.noteText}>
            Use your unit number <Text style={{ fontWeight: "700", color: C.white }}>{invoice.unit_number || "—"}</Text> as payment reference.
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={S.footer}>
        <TouchableOpacity style={S.btnCancel} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={S.btnCancelText}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.btnDownload} onPress={handleDownload} disabled={downloading} activeOpacity={0.8}>
          {downloading ? (
            <ActivityIndicator color={C.black} size="small" />
          ) : (
            <>
              <Feather name="download" size={14} color={C.black} />
              <Text style={S.btnDownloadText}>DOWNLOAD PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: "rgba(245,240,232,0.3)", fontSize: 14, fontFamily: F.mono },
  goBackBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 3, borderWidth: 1, borderColor: C.border },
  goBackText: { color: C.gold, fontSize: 12, fontFamily: F.mono },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollPad: { padding: 16 },

  invHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 22,
  },
  invHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  invIcon: {
    width: 40, height: 40, borderRadius: 6,
    backgroundColor: "rgba(232,160,18,0.1)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  invTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 0.5 },
  invNo: { fontSize: 11, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginTop: 2 },
  invBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 3, borderWidth: 1,
  },
  invBadgeText: {
    fontSize: 10, fontWeight: "700",
    fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 1,
  },

  section: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 9, fontWeight: "700", color: "rgba(245,240,232,0.2)",
    fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4,
  },
  sectionName: { fontSize: 14, fontWeight: "600", color: C.white, fontFamily: F.dm },
  sectionDetail: { fontSize: 11, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginTop: 2 },

  dateRow: { flexDirection: "row", gap: 16, marginBottom: 22 },
  dateBlock: { flex: 1 },
  dateLabel: {
    fontSize: 9, fontWeight: "700", color: "rgba(245,240,232,0.2)",
    fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4,
  },
  dateValue: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },

  table: {
    backgroundColor: C.muted2, borderRadius: 6, overflow: "hidden",
    marginBottom: 14, borderWidth: 1, borderColor: C.border,
  },
  tableHeader: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.muted, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tableHeading: {
    fontSize: 9, fontWeight: "700", color: "rgba(245,240,232,0.25)",
    fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 1.5,
  },
  tableRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tableCell: { fontSize: 13, color: C.white, fontFamily: F.dm },
  tableTotal: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: "rgba(232,160,18,0.03)", borderTopWidth: 1, borderTopColor: C.border,
  },
  totalLabel: { fontSize: 13, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 0.5 },
  totalValue: { fontSize: 18, fontWeight: "700", color: C.gold, fontFamily: F.bebas, letterSpacing: 1 },

  note: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, backgroundColor: "rgba(58,143,212,0.06)", borderRadius: 3,
    borderWidth: 1, borderColor: "rgba(58,143,212,0.15)",
  },
  noteText: { flex: 1, fontSize: 11, color: "rgba(58,143,212,0.7)", lineHeight: 16, fontFamily: F.mono },

  footer: {
    flexDirection: "row", gap: 10, padding: 14,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.muted2,
  },
  btnCancel: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 13, borderRadius: 3,
    backgroundColor: "transparent", borderWidth: 1, borderColor: C.border,
  },
  btnCancelText: { fontSize: 12, fontWeight: "500", color: "rgba(245,240,232,0.5)", fontFamily: F.dm, letterSpacing: 0.5 },
  btnDownload: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: 3, backgroundColor: C.gold,
  },
  btnDownloadText: {
    fontSize: 12, fontWeight: "700", color: C.black,
    fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase",
  },
});