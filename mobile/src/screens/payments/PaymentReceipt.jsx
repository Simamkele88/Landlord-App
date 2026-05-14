// TENANT PAYMENT RECEIPT PAGE

import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";

const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

const TENANT = {
  name: "Simamkele Wekeza", unit: "Unit 213-B", property: "Hillbrow Heights",
};

function fmt(amount) { return `R ${Number(amount).toLocaleString("en-ZA")}`; }

export default function PaymentReceipt() {
  const navigation = useNavigation();
  const route = useRoute();
  const { payment } = route.params || {};

  if (!payment) {
    return (
      <SafeAreaView style={S.safe}>
        <Text style={{ color: C.textSecondary, textAlign: "center", marginTop: 40 }}>Receipt not found</Text>
      </SafeAreaView>
    );
  }

  const dateFormatted = payment.paidOn
    ? new Date(payment.paidOn).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* SUCCESS HEADER */}
        <View style={S.receiptHeader}>
          <View style={S.checkCircle}>
            <Ionicons name="checkmark" size={32} color={C.white} />
          </View>
          <Text style={S.receiptTitle}>Payment Receipt</Text>
          <Text style={S.receiptSub}>Verified and approved by landlord</Text>
          {payment.receiptNo && (
            <View style={S.receiptBadge}>
              <Text style={S.receiptBadgeText}>{payment.receiptNo}</Text>
            </View>
          )}
        </View>

        {/* DETAILS */}
        <View style={S.detailCard}>
          {[
            ["Tenant", TENANT.name],
            ["Unit", `${TENANT.unit} · ${TENANT.property}`],
            ["Period", payment.period || "—"],
            ["Payment Method", payment.method || "—"],
            ["Date Paid", dateFormatted],
            ["Reference", payment.reference || "—"],
          ].map(([label, val]) => (
            <View key={label} style={S.detailRow}>
              <Text style={S.detailLabel}>{label}</Text>
              <Text style={S.detailValue}>{val}</Text>
            </View>
          ))}
          <View style={[S.detailRow, { borderBottomWidth: 0, marginTop: 4 }]}>
            <Text style={S.totalLabel}>Amount Paid</Text>
            <Text style={S.totalValue}>{fmt(payment.amount)}</Text>
          </View>
        </View>

        <Text style={S.footnote}>This receipt serves as official proof of payment</Text>
      </ScrollView>

      {/* FOOTER */}
      <View style={S.footer}>
        <TouchableOpacity style={S.btnDownload} onPress={() => Alert.alert("Download", "PDF download coming soon.")} activeOpacity={0.8}>
          <Feather name="download" size={16} color={C.primary} />
          <Text style={S.btnDownloadText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.btnClose} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={S.btnCloseText}>Close</Text>
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
  scrollPad: { padding: 20 },
  receiptHeader: { alignItems: "center", paddingVertical: 20, marginBottom: 20 },
  checkCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.success,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  receiptTitle: { fontSize: 20, fontWeight: "800", color: C.textPrimary, marginBottom: 4 },
  receiptSub: { fontSize: 13, color: C.textSecondary },
  receiptBadge: {
    backgroundColor: C.success + "20", paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8, marginTop: 8,
  },
  receiptBadgeText: { fontSize: 12, fontWeight: "600", color: C.success },
  detailCard: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  detailLabel: { fontSize: 13, color: C.textSecondary },
  detailValue: { fontSize: 13, fontWeight: "600", color: C.textPrimary, textAlign: "right", flex: 1, marginLeft: 16 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: C.textPrimary },
  totalValue: { fontSize: 20, fontWeight: "800", color: C.success },
  footnote: { fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 16 },
  footer: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  btnDownload: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
  },
  btnDownloadText: { fontSize: 14, fontWeight: "600", color: C.primary },
  btnClose: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary,
  },
  btnCloseText: { fontSize: 14, fontWeight: "700", color: C.white },
});