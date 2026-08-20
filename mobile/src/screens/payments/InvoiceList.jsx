// TENANT INVOICES LIST PAGE
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, SafeAreaView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
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

const INVOICE_TYPE_CONFIG = {
  rent:    { label: "Rent",      color: C.blue },
  deposit: { label: "Deposit",   color: C.green },
  damage:  { label: "Damage",    color: C.red },
  utility: { label: "Utility",   color: C.primary },
  other:   { label: "Other",     color: C.textMuted },
};

function invoiceTypeConfig(type) {
  return INVOICE_TYPE_CONFIG[type] || INVOICE_TYPE_CONFIG.other;
}

function InvoiceTypeBadge({ type }) {
  const cfg = invoiceTypeConfig(type);
  return (
    <View style={[S.invoiceTypeBadge, { borderColor: cfg.color + "40", backgroundColor: cfg.color + "15" }]}>
      <Text style={[S.invoiceTypeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function statusConfig(status) {
  switch (status) {
    case "paid":             return { color: C.green, label: "Paid" };
    case "pending":
    case "pending_approval": return { color: C.blue,  label: "Pending" };
    case "late":             return { color: C.red,   label: "Late" };
    case "overdue":          return { color: C.red,   label: "Overdue" };
    case "sent":
    case "unpaid":           return { color: C.red,   label: "Unpaid" };
    case "partial":          return { color: C.blue,  label: "Partial" };
    case "collections":      return { color: C.purple,label: "Collections" };
    case "rejected":         return { color: C.red,   label: "Rejected" };
    default:                 return { color: C.textMuted, label: String(status) };
  }
}

function StatusBadge({ status }) {
  const cfg = statusConfig(status);
  return (
    <View style={[S.statusBadge, { backgroundColor: cfg.color + "15", borderColor: cfg.color + "30" }]}>
      <Text style={[S.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export default function PaymentInvoice() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState([]);

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await api.getInvoices();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error("Invoices fetch:", err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  function onRefresh() { setRefreshing(true); fetchInvoices(); }

  function openInvoice(invoice) {
    navigation.navigate("InvoiceDetail", { invoice });
  }

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

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Invoices</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.pad}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {invoices.length === 0 ? (
          <View style={[S.card, { padding: 30, alignItems: "center" }]}>
            <Ionicons name="document-text-outline" size={40} color={C.textMuted} />
            <Text style={S.emptyText}>No invoices found</Text>
          </View>
        ) : (
          invoices.map((invoice, index) => {
            const type = invoice.invoice_type || "rent";
            const typeCfg = invoiceTypeConfig(type);
            const remaining = Number(invoice.remaining_balance);
            const isPaid = invoice.status === "paid";
            return (
              <TouchableOpacity
                key={invoice.id || index}
                style={S.invoiceCard}
                onPress={() => openInvoice(invoice)}
                activeOpacity={0.8}
              >
                <View style={S.invoiceTop}>
                  <View style={[S.invoiceIconWrap, { backgroundColor: typeCfg.color + "10", borderColor: typeCfg.color + "20" }]}>
                    <Ionicons name="document-text" size={18} color={typeCfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={S.invoicePeriod}>
                        {invoice.billing_period_start
                          ? new Date(invoice.billing_period_start).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })
                          : "Invoice"}
                      </Text>
                      <InvoiceTypeBadge type={type} />
                    </View>
                    <Text style={S.invoiceDue}>Due {formatDate(invoice.due_date)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[S.invoiceAmount, isPaid && { color: C.green }]}>
                      {fmt(invoice.amount_due)}
                    </Text>
                    {remaining > 0 && (
                      <Text style={S.remainingText}>{fmt(remaining)} left</Text>
                    )}
                    <StatusBadge status={invoice.status} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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

  card: {
    backgroundColor: C.card, borderRadius: 6, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 12,
  },
  invoiceCard: {
    backgroundColor: C.card, borderRadius: 6, borderWidth: 1,
    borderColor: C.border, overflow: "hidden", marginBottom: 12,
  },
  invoiceTop: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 14,
  },
  invoiceIconWrap: {
    width: 38, height: 38, borderRadius: 6,
    borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  invoicePeriod: { fontSize: 14, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  invoiceDue: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  invoiceAmount: { fontSize: 18, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  remainingText: { fontSize: 10, color: C.red, fontFamily: F.mono, marginTop: 2 },

  invoiceTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1, alignSelf: 'flex-start' },
  invoiceTypeText:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', fontFamily: F.mono, letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1, alignSelf: 'flex-start', marginTop: 4 },
  statusBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', fontFamily: F.mono, letterSpacing: 1 },

  emptyText: { fontSize: 14, color: C.textMuted, fontFamily: F.mono, marginTop: 12 },
});