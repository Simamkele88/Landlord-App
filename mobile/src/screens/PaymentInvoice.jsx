// TENANT PAYMENT INVOICE DETAIL PAGE
// AUTHOR: SIMAMKELE WEKEZA

import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";

const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", danger: "#EF4444",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

const TENANT = {
  name: "Simamkele Wekeza", unit: "Unit 213-B", property: "Hillbrow Heights",
};

function fmt(amount) { return `R ${Number(amount).toLocaleString("en-ZA")}`; }

export default function PaymentInvoice() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice } = route.params || {};

  const [downloading, setDownloading] = useState(false);

  if (!invoice) {
    return (
      <SafeAreaView style={S.safe}>
        <Text style={{ color: C.textSecondary, textAlign: "center", marginTop: 40 }}>Invoice not found</Text>
      </SafeAreaView>
    );
  }

  const invoiceNo = `INV-${(invoice.id || "001").toUpperCase()}`;
  const total = invoice.amount + (invoice.lateFee || 0);
  const lineItems = [
    { description: `Monthly Rent`, amount: invoice.amount },
    ...(invoice.lateFee > 0 ? [{ description: "Late Payment Fee", amount: invoice.lateFee }] : []),
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
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Invoice</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* INVOICE HEADER */}
        <View style={S.invHeader}>
          <View style={S.invHeaderLeft}>
            <View style={S.invIcon}>
              <Ionicons name="document-text" size={22} color={C.primary} />
            </View>
            <View>
              <Text style={S.invTitle}>{invoice.period} Invoice</Text>
              <Text style={S.invNo}>{invoiceNo}</Text>
            </View>
          </View>
          <View style={S.invBadge}>
            <Text style={S.invBadgeText}>Unpaid</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>Billed To</Text>
          <Text style={S.sectionName}>{TENANT.name}</Text>
          <Text style={S.sectionDetail}>{TENANT.unit} · {TENANT.property}</Text>
        </View>

        <View style={S.section}>
          <Text style={S.sectionLabel}>From</Text>
          <Text style={S.sectionName}>Chihwa Rentals</Text>
          <Text style={S.sectionDetail}>Property Owner</Text>
        </View>

        {/* DATES */}
        <View style={S.dateRow}>
          <View style={S.dateBlock}>
            <Text style={S.dateLabel}>Due Date</Text>
            <Text style={S.dateValue}>{invoice.dueDate || "—"}</Text>
          </View>
          <View style={S.dateBlock}>
            <Text style={S.dateLabel}>Period</Text>
            <Text style={S.dateValue}>{invoice.period || "—"}</Text>
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
          <Feather name="info" size={14} color={C.primary} />
          <Text style={S.noteText}>
            Use your unit number <Text style={{ fontWeight: "700" }}>{TENANT.unit}</Text> as payment reference.
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
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <>
              <Feather name="download" size={16} color={C.white} />
              <Text style={S.btnDownloadText}>Download PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  scroll: { flex: 1 },
  scrollPad: { padding: 20, paddingBottom: 20 },
  invHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 24,
  },
  invHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  invIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center" },
  invTitle: { fontSize: 17, fontWeight: "700", color: C.textPrimary },
  invNo: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  invBadge: { backgroundColor: C.danger + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: C.danger + "30" },
  invBadgeText: { fontSize: 11, fontWeight: "700", color: C.danger, textTransform: "uppercase" },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  sectionName: { fontSize: 15, fontWeight: "700", color: C.textPrimary },
  sectionDetail: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  dateRow: { flexDirection: "row", gap: 20, marginBottom: 24 },
  dateBlock: { flex: 1 },
  dateLabel: { fontSize: 10, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  table: { backgroundColor: C.surfaceAlt, borderRadius: 12, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: C.border },
  tableHeader: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.surface },
  tableHeading: { fontSize: 10, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  tableCell: { fontSize: 14, color: C.textPrimary },
  tableTotal: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  totalLabel: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  totalValue: { fontSize: 18, fontWeight: "800", color: C.primary },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, backgroundColor: C.primary + "10", borderRadius: 10, borderWidth: 1, borderColor: C.primary + "20" },
  noteText: { flex: 1, fontSize: 12, color: C.primary, lineHeight: 17 },
  footer: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  btnCancel: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  btnCancelText: { fontSize: 14, fontWeight: "600", color: C.textSecondary },
  btnDownload: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary },
  btnDownloadText: { fontSize: 14, fontWeight: "700", color: C.white },
});