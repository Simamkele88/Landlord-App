// TENANT DEPOSIT STATUS PAGE
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, SafeAreaView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

function fmt(n) { return `R ${Number(n || 0).toLocaleString("en-ZA")}`; }
function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return String(d).slice(0, 10);
    return dt.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return String(d).slice(0, 10); }
}

const DEPOSIT_STATUS_CONFIG = {
  unpaid:            { color: C.red,     label: "Unpaid",             icon: "alert-circle" },
  paid:              { color: C.green,   label: "Held",               icon: "checkmark-circle" },
  partially_refunded:{ color: C.blue,    label: "Partially Refunded", icon: "time" },
  fully_refunded:    { color: C.primary, label: "Refunded",           icon: "arrow-undo" },
  forfeited:         { color: C.purple,  label: "Forfeited",          icon: "warning" },
};

function depositStatusConfig(status) {
  return DEPOSIT_STATUS_CONFIG[status] || DEPOSIT_STATUS_CONFIG.unpaid;
}

function DepositStatusBadge({ status }) {
  const cfg = depositStatusConfig(status);
  return (
    <View style={[S.statusBadge, { backgroundColor: cfg.color + "15", borderColor: cfg.color + "30" }]}>
      <Ionicons name={cfg.icon} size={10} color={cfg.color} />
      <Text style={[S.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function SummaryBox({ label, value, color, icon }) {
  return (
    <View style={[S.summaryBox, { borderColor: color + "30" }]}>
      <View style={[S.summaryIcon, { backgroundColor: color + "10" }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[S.summaryLabel, { color: C.textMuted }]}>{label}</Text>
      <Text style={[S.summaryValue, { color }]}>{fmt(value)}</Text>
    </View>
  );
}

function DepositInvoiceRow({ invoice, onPress }) {
  const remaining = Number(invoice.remaining_balance);
  return (
    <TouchableOpacity style={S.invoiceRow} onPress={onPress} activeOpacity={0.8}>
      <View style={S.invoiceIconWrap}>
        <Ionicons name="document-text" size={16} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={S.invoiceTitle}>
          {invoice.notes?.toLowerCase().includes("replenish") ? "Deposit Replenishment" : "Deposit Invoice"}
        </Text>
        <Text style={S.invoiceMeta}>Due {formatDate(invoice.due_date)}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[S.invoiceAmount, remaining > 0 ? { color: C.red } : { color: C.green }]}>
          {fmt(invoice.amount_due)}
        </Text>
        {remaining > 0 ? (
          <Text style={S.invoiceOutstanding}>{fmt(remaining)} left</Text>
        ) : (
          <Text style={[S.invoiceOutstanding, { color: C.green }]}>Paid</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function DepositStatus() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deposit, setDeposit] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [depositData, invoicesData] = await Promise.all([
        api.get('/tenants/me/deposit').catch(() => null),
        api.getInvoices(),
      ]);

      setDeposit(depositData?.deposit || null);

      const allInvoices = invoicesData?.invoices || [];
      const depositInvoices = allInvoices.filter(i => i.invoice_type === 'deposit');
      setInvoices(depositInvoices);
    } catch (err) {
      console.error("Deposit fetch:", err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  function onRefresh() { setRefreshing(true); fetchData(); }

  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.centerBlock}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const depositAmount = Number(deposit?.deposit_amount || 0);
  const usedAmount = Number(deposit?.used_amount || 0);
  const refundedAmount = Number(deposit?.refund_amount || 0);
  const available = depositAmount - usedAmount - refundedAmount;
  const status = deposit?.status || "unpaid";

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Deposit Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.pad}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {deposit ? (
          <>
            {/* STATUS BADGE */}
            <View style={S.heroCard}>
              <DepositStatusBadge status={status} />
              <Text style={S.heroAmount}>{fmt(depositAmount)}</Text>
              <Text style={S.heroLabel}>Original Deposit</Text>
            </View>

            {/* SUMMARY BOXES */}
            <View style={S.summaryRow}>
              <SummaryBox label="Used" value={usedAmount} color={C.red} icon="arrow-up-circle" />
              <SummaryBox label="Refunded" value={refundedAmount} color={C.primary} icon="arrow-down-circle" />
            </View>
            <View style={S.availableBox}>
              <Text style={S.availableLabel}>AVAILABLE BALANCE</Text>
              <Text style={[S.availableValue, { color: available > 0 ? C.green : C.blue }]}>
                {fmt(Math.max(available, 0))}
              </Text>
              {available <= 0 && (
                <Text style={S.availableSub}>The deposit has been fully used or refunded.</Text>
              )}
            </View>

            {/* DEPOSIT INVOICES */}
            <View style={S.secHead}>
              <Text style={S.secLabel}>DEPOSIT INVOICES</Text>
            </View>
            <View style={S.card}>
              {invoices.length === 0 ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Ionicons name="document-text-outline" size={28} color={C.textMuted} />
                  <Text style={S.emptyText}>No deposit invoices</Text>
                </View>
              ) : (
                invoices.map((inv, idx) => (
                  <View key={inv.id || idx}>
                    <DepositInvoiceRow invoice={inv} onPress={() => navigation.navigate("InvoiceDetail", { invoice: inv })} />
                    {idx < invoices.length - 1 && <View style={S.divider} />}
                  </View>
                ))
              )}
            </View>

            {/* NOTE */}
            <View style={S.infoBox}>
              <MaterialIcons name="info" size={13} color={C.blue} />
              <Text style={S.infoText}>
                If your deposit has been used to cover payments, a replenishment invoice will be issued. Please pay it to restore your deposit.
              </Text>
            </View>
          </>
        ) : (
          <View style={S.card}>
            <View style={{ padding: 30, alignItems: "center" }}>
              <Ionicons name="shield-checkmark-outline" size={40} color={C.textMuted} />
              <Text style={S.emptyText}>No deposit record found</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  scroll: { flex: 1 },
  pad: { padding: 16 },

  heroCard: {
    backgroundColor: C.card, borderRadius: 6, borderWidth: 1,
    borderColor: C.border, padding: 18, alignItems: "center", marginBottom: 14,
  },
  heroAmount: { fontSize: 34, fontFamily: F.bebas, color: C.textPrimary, letterSpacing: 1, marginTop: 8 },
  heroLabel: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },

  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  summaryBox: {
    flex: 1, backgroundColor: C.card, borderRadius: 6, borderWidth: 1,
    padding: 14, alignItems: "center",
  },
  summaryIcon: {
    width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  summaryLabel: { fontSize: 10, fontFamily: F.mono, letterSpacing: 1, textTransform: "uppercase" },
  summaryValue: { fontSize: 18, fontFamily: F.bebas, letterSpacing: 0.5, marginTop: 2 },

  availableBox: {
    backgroundColor: "rgba(43,122,75,0.04)", borderRadius: 6, borderWidth: 1,
    borderColor: "rgba(43,122,75,0.15)", padding: 16, alignItems: "center", marginBottom: 20,
  },
  availableLabel: { fontSize: 10, fontFamily: F.mono, color: C.textMuted, letterSpacing: 2, textTransform: "uppercase" },
  availableValue: { fontSize: 28, fontFamily: F.bebas, letterSpacing: 1, marginTop: 4 },
  availableSub: { fontSize: 10, color: C.textMuted, fontFamily: F.dm, marginTop: 4 },

  secHead: { marginBottom: 8, marginTop: 4 },
  secLabel: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 2, textTransform: "uppercase" },

  card: {
    backgroundColor: C.card, borderRadius: 6, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 16,
  },
  invoiceRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  invoiceIconWrap: {
    width: 36, height: 36, borderRadius: 6, backgroundColor: "rgba(44,62,80,0.1)",
    borderWidth: 1, borderColor: "rgba(44,62,80,0.15)", alignItems: "center", justifyContent: "center",
  },
  invoiceTitle: { fontSize: 14, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  invoiceMeta: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  invoiceAmount: { fontSize: 15, fontFamily: F.bebas, letterSpacing: 0.5 },
  invoiceOutstanding: { fontSize: 10, color: C.red, fontFamily: F.mono, marginTop: 2 },

  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, backgroundColor: "rgba(52,152,219,0.04)", borderRadius: 4,
    borderWidth: 1, borderColor: "rgba(52,152,219,0.12)", marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 11, color: C.blue, lineHeight: 16, fontFamily: F.dm },

  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1 },
  statusBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', fontFamily: F.mono, letterSpacing: 1 },

  emptyText: { fontSize: 14, color: C.textMuted, fontFamily: F.mono, marginTop: 12 },
});