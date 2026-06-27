// TENANT PAYMENT RECEIPT PAGE 
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Alert,
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

function formatPeriod(startStr) {
  if (!startStr) return "—";
  try {
    const date = new Date(startStr);
    if (isNaN(date.getTime())) return String(startStr).slice(0, 7);
    return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  } catch {
    return String(startStr).slice(0, 7);
  }
}

export default function PaymentReceipt() {
  const navigation = useNavigation();
  const route = useRoute();
  const { payment } = route.params || {};

  if (!payment) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Feather name="arrow-left" size={20} color={C.white} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Receipt</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={S.centerBlock}>
          <Feather name="file-text" size={40} color="rgba(245,240,232,0.15)" />
          <Text style={S.emptyText}>Receipt not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.goBackBtn}>
            <Text style={S.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dateFormatted = payment.payment_date || payment.paidOn
    ? formatDate(payment.payment_date || payment.paidOn)
    : "—";

  const period = payment.period || payment.billing_period_start
    ? (payment.period || formatPeriod(payment.billing_period_start))
    : "—";

  const method = payment.payment_method || payment.method || "—";
  const reference = payment.bank_reference || payment.reference || "—";
  const receiptNo = payment.receipt_no || payment.receiptNo || `RCP-${String(payment.id || "").slice(0, 8)}`;
  const tenantName = payment.tenant_name || "Tenant";
  const unitInfo = payment.unit_number ? `Unit ${payment.unit_number}` : "—";
  const propertyName = payment.property_name || "—";
  const amount = payment.amount_paid || payment.amount || 0;

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.white} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* SUCCESS HEADER */}
        <View style={S.receiptHeader}>
          <View style={S.checkCircle}>
            <Ionicons name="checkmark" size={30} color={C.white} />
          </View>
          <Text style={S.receiptTitle}>Payment Receipt</Text>
          <Text style={S.receiptSub}>Verified and approved by landlord</Text>
          <View style={S.receiptBadge}>
            <Text style={S.receiptBadgeText}>{receiptNo}</Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={S.detailCard}>
          <Text style={S.detailCardTitle}>RECEIPT DETAILS</Text>
          {[
            ["Tenant", tenantName],
            ["Unit", `${unitInfo} · ${propertyName}`],
            ["Period", period],
            ["Payment Method", method],
            ["Date Paid", dateFormatted],
            ["Reference", reference],
          ].map(([label, val]) => (
            <View key={label} style={S.detailRow}>
              <Text style={S.detailLabel}>{label}</Text>
              <Text style={S.detailValue} numberOfLines={1}>{val}</Text>
            </View>
          ))}
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>Amount Paid</Text>
            <Text style={S.totalValue}>{fmt(amount)}</Text>
          </View>
        </View>

        <Text style={S.footnote}>
          This receipt serves as official proof of payment. Keep this for your records.
        </Text>
      </ScrollView>

      {/* FOOTER */}
      <View style={S.footer}>
        <TouchableOpacity
          style={S.btnDownload}
          onPress={() => Alert.alert("Download", "PDF download coming soon.")}
          activeOpacity={0.8}
        >
          <Feather name="download" size={14} color={C.gold} />
          <Text style={S.btnDownloadText}>DOWNLOAD PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.btnClose} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={S.btnCloseText}>CLOSE</Text>
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

  receiptHeader: { alignItems: "center", paddingVertical: 24, marginBottom: 20 },
  checkCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.greenLight,
    borderWidth: 3, borderColor: "rgba(76,186,122,0.3)",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  receiptTitle: { fontSize: 20, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 4 },
  receiptSub: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono },
  receiptBadge: {
    backgroundColor: "rgba(26,122,74,0.08)", paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 3, borderWidth: 1, borderColor: "rgba(76,186,122,0.15)", marginTop: 10,
  },
  receiptBadgeText: { fontSize: 11, fontWeight: "600", color: C.greenLight, fontFamily: F.mono, letterSpacing: 0.5 },

  detailCard: {
    backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 16,
  },
  detailCardTitle: {
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)",
    fontFamily: F.mono, letterSpacing: 2, textTransform: "uppercase",
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  detailLabel: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono },
  detailValue: {
    fontSize: 12, fontWeight: "600", color: C.white,
    fontFamily: F.dm, textAlign: "right", flex: 1, marginLeft: 16,
  },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: "rgba(232,160,18,0.03)",
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 0.5 },
  totalValue: { fontSize: 20, fontWeight: "700", color: C.gold, fontFamily: F.bebas, letterSpacing: 1 },

  footnote: {
    fontSize: 10, color: "rgba(245,240,232,0.15)", fontFamily: F.mono,
    textAlign: "center", marginTop: 8, lineHeight: 16,
  },

  footer: {
    flexDirection: "row", gap: 10, padding: 14,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.muted2,
  },
  btnDownload: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 13, borderRadius: 3,
    backgroundColor: "transparent", borderWidth: 1, borderColor: C.border,
  },
  btnDownloadText: {
    fontSize: 12, fontWeight: "600", color: C.gold,
    fontFamily: F.dm, letterSpacing: 1,
  },
  btnClose: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 13, borderRadius: 3, backgroundColor: C.gold,
  },
  btnCloseText: {
    fontSize: 12, fontWeight: "700", color: C.black,
    fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase",
  },
});