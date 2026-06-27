// TENANT PAYMENTS LIST SCREEN
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";
import api from "../../utils/api";

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
  purple:       "#8B5CF6",
};

const F = {
  bebas: "bebas-neue",
  dm:    "dm-sans",
  mono:  "space-mono",
};

function fmt(amount) { 
  return `R ${Number(amount || 0).toLocaleString("en-ZA")}`; 
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr).slice(0, 10);
    return date.toLocaleDateString("en-ZA", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    });
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

function formatDateFull(dateStr) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr).slice(0, 10);
    return date.toLocaleDateString("en-ZA", { 
      day: "2-digit", 
      month: "long", 
      year: "numeric" 
    });
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

function formatPeriod(startStr, endStr) {
  if (!startStr && !endStr) return "Current Period";
  try {
    if (startStr) {
      const date = new Date(startStr);
      if (isNaN(date.getTime())) return String(startStr).slice(0, 7);
      return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
    }
    return "Current Period";
  } catch {
    return "Current Period";
  }
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function statusConfig(status) {
  switch (status) {
    case "paid": return { color: C.greenLight, bg: "rgba(26,122,74,0.08)", label: "Paid" };
    case "pending":
    case "pending_approval": return { color: C.gold, bg: "rgba(232,160,18,0.06)", label: "Pending" };
    case "late": return { color: C.redLight, bg: "rgba(224,90,74,0.08)", label: "Late" };
    case "overdue": return { color: C.redLight, bg: "rgba(224,90,74,0.08)", label: "Overdue" };
    case "sent":
    case "unpaid": return { color: C.redLight, bg: "rgba(224,90,74,0.08)", label: "Unpaid" };
    case "rejected": return { color: C.redLight, bg: "rgba(224,90,74,0.08)", label: "Rejected" };
    case "collections": return { color: C.purple, bg: "rgba(139,92,246,0.08)", label: "Collections" };
    default: return { color: "rgba(245,240,232,0.4)", bg: C.muted2, label: String(status) };
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

function InvoiceCard({ invoice, tenant, onViewInvoice }) {
  const status = invoice?.status || "unpaid";
  const isOverdue = status === "overdue";
  const isPending = status === "pending" || status === "pending_approval";
  const isPaid = status === "paid";
  const isUnpaid = status === "sent" || status === "unpaid";

  return (
    <View style={[S.invoiceCard, isOverdue && { borderColor: C.redLight + "40" }]}>
      <View style={S.invoiceTop}>
        <View style={S.invoiceIconWrap}>
          <Ionicons name="document-text" size={20} color={C.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.invoicePeriod}>
            {invoice?.billing_period_start 
              ? formatPeriod(invoice.billing_period_start, invoice.billing_period_end)
              : "Current"} Invoice
          </Text>
          <Text style={S.invoiceDue}>Due {formatDate(invoice?.due_date)}</Text>
        </View>
        <Text style={[S.invoiceAmount, isOverdue && { color: C.redLight }]}>
          {fmt(invoice?.amount_due || invoice?.amount || tenant?.rentAmount)}
        </Text>
      </View>
      <View style={S.invoiceDivider} />
      {isUnpaid && (
        <View style={[S.invoiceBanner, { backgroundColor: C.muted }]}>
          <Ionicons name="time-outline" size={15} color="rgba(245,240,232,0.3)" />
          <Text style={[S.invoiceBannerText, { color: "rgba(245,240,232,0.5)" }]}>Rent is due — please make payment to avoid late fees.</Text>
        </View>
      )}
      {isOverdue && (
        <View style={[S.invoiceBanner, { backgroundColor: "rgba(224,90,74,0.06)" }]}>
          <MaterialIcons name="error" size={15} color={C.redLight} />
          <Text style={[S.invoiceBannerText, { color: C.redLight }]}>Payment is overdue</Text>
        </View>
      )}
      {isPending && (
        <View style={[S.invoiceBanner, { backgroundColor: "rgba(232,160,18,0.04)" }]}>
          <MaterialIcons name="pending-actions" size={15} color={C.gold} />
          <Text style={[S.invoiceBannerText, { color: C.gold }]}>Awaiting landlord approval</Text>
        </View>
      )}
      {isPaid && (
        <View style={[S.invoiceBanner, { backgroundColor: "rgba(26,122,74,0.06)" }]}>
          <Ionicons name="checkmark-circle" size={15} color={C.greenLight} />
          <Text style={[S.invoiceBannerText, { color: C.greenLight }]}>Payment confirmed</Text>
        </View>
      )}
      <View style={S.invoiceDivider} />
      <TouchableOpacity style={S.invoiceViewRow} onPress={onViewInvoice} activeOpacity={0.7}>
        <Feather name="file-text" size={14} color={C.gold} />
        <Text style={S.invoiceViewText}>View Invoice</Text>
        <Feather name="chevron-right" size={14} color={C.gold} />
      </TouchableOpacity>
    </View>
  );
}

function HistoryRow({ item, onViewReceipt }) {
  const { color } = statusConfig(item.status);
  return (
    <View style={S.historyRow}>
      <View style={[S.historyDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={S.historyPeriod}>
          {item.billing_period_start 
            ? formatPeriod(item.billing_period_start, item.billing_period_end)
            : item.period || "—"}
        </Text>
        <Text style={S.historyMeta}>
          {item.payment_date 
            ? `Paid ${formatDate(item.payment_date)}` 
            : "Not yet paid"}
          {item.payment_method ? ` · ${item.payment_method}` : ""}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={S.historyAmount}>{fmt(item.amount_paid || item.amount_due || item.amount)}</Text>
        <StatusPill status={item.status} />
        {item.status === "paid" && (
          <TouchableOpacity onPress={() => onViewReceipt(item)} activeOpacity={0.7}>
            <Text style={S.receiptLink}>View Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function TenantPayments() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const tenantData = await api.getTenantProfile();
      setTenant(tenantData);

      const invData = await api.getInvoices();
      const invList = invData.invoices || [];
      
      const current = invList.find(i => 
        i.status === "sent" || i.status === "unpaid" || i.status === "overdue"
      ) || invList[0] || null;
      setCurrentInvoice(current);

      const payData = await api.getPayments();
      setPaymentHistory(payData.payments || []);

    } catch (err) {
      console.error("Fetch tenant data:", err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function onRefresh() {
    setRefreshing(true);
    fetchData();
  }

  function openReceipt(item) {
    navigation.getParent()?.navigate("PaymentReceipt", { 
      payment: {
        ...item,
        id: item.id,
        receiptNo: item.receipt_no || `RCP-${String(item.id || "").slice(0, 8)}`,
        period: item.billing_period_start 
          ? new Date(item.billing_period_start).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })
          : item.period || "—",
        amount: item.amount_paid || item.amount_due || item.amount,
        paidOn: item.payment_date || item.paidOn,
        method: item.payment_method || item.method,
        reference: item.bank_reference || item.reference,
        tenant_name: tenant?.first_name + " " + tenant?.last_name,
        unit_number: tenant?.unit_number,
        property_name: tenant?.property_name,
      }
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.gold} />
        </View>
      </SafeAreaView>
    );
  }

  const invoiceStatus = currentInvoice?.status || "unpaid";
  const isPending = invoiceStatus === "pending" || invoiceStatus === "pending_approval";
  const needsPay = invoiceStatus === "sent" || invoiceStatus === "unpaid" || invoiceStatus === "overdue";

  const tenantInfo = {
    name: tenant ? `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim() || "Tenant" : "Tenant",
    unit: tenant?.unit_number ? `Unit ${tenant.unit_number}` : "—",
    property: tenant?.property_name || "—",
    rentAmount: currentInvoice?.amount_due || tenant?.rent_amount || tenant?.monthly_rent || 0,
    dueDay: currentInvoice?.due_date 
      ? new Date(currentInvoice.due_date).getDate() 
      : tenant?.payment_due_day || 1,
    leaseEnd: tenant?.lease_end_date || "—",
    reliabilityScore: tenant?.reliability_score || "Reliable",
  };

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      <ScrollView 
        style={S.scroll} 
        contentContainerStyle={S.scrollPad} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
      >
        {/* HEADER */}
        <View style={S.pageHeader}>
          <View>
            <Text style={S.pageTitle}>Payments</Text>
            <Text style={S.pageSub}>{tenantInfo.unit} · {tenantInfo.property}</Text>
          </View>
          <View style={[S.scorePill, { borderColor: tenantInfo.reliabilityScore === "Reliable" || tenantInfo.reliabilityScore === "reliable" ? C.greenLight : C.gold }]}>
            <Text style={[S.scoreText, { color: tenantInfo.reliabilityScore === "Reliable" || tenantInfo.reliabilityScore === "reliable" ? C.greenLight : C.gold }]}>
              {tenantInfo.reliabilityScore}
            </Text>
          </View>
        </View>

        {/* INVOICE CARD */}
        {currentInvoice ? (
          <InvoiceCard
            invoice={currentInvoice}
            tenant={tenantInfo}
            onViewInvoice={() => navigation.getParent()?.navigate("PaymentInvoice", { invoice: currentInvoice })}
          />
        ) : (
          <View style={[S.invoiceCard, { padding: 24, alignItems: "center" }]}>
            <Ionicons name="document-text" size={32} color="rgba(245,240,232,0.2)" />
            <Text style={{ color: "rgba(245,240,232,0.3)", fontFamily: F.mono, fontSize: 12, marginTop: 8 }}>No invoices available</Text>
          </View>
        )}

        {/* PAYMENT OPTIONS */}
        {needsPay && (
          <>
            <SectionLabel title="MAKE PAYMENT" subtitle="Choose how you'd like to pay this month" />
            <View style={S.payOptions}>
              <TouchableOpacity
                style={[S.payCard, { borderColor: C.gold + "40" }]}
                onPress={() => navigation.getParent()?.navigate("PaymentMethod", { invoice: currentInvoice, tenant: tenantInfo })}
                activeOpacity={0.8}
              >
                <View style={S.payCardIcon}>
                  <FontAwesome5 name="credit-card" size={24} color={C.gold} />
                </View>
                <Text style={S.payCardTitle}>Pay In-App</Text>
                <Text style={S.payCardSub}>Card, EFT, or mobile wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.payCard, { borderColor: C.border }]}
                onPress={() => navigation.getParent()?.navigate("PaymentUpload", { invoice: currentInvoice })}
                activeOpacity={0.8}
              >
                <View style={[S.payCardIcon, { backgroundColor: C.muted }]}>
                  <Feather name="upload" size={24} color="rgba(245,240,232,0.4)" />
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
            <SectionLabel title="ACTIONS" />
            <TouchableOpacity
              style={S.resubmit}
              onPress={() => navigation.getParent()?.navigate("PaymentUpload", { invoice: currentInvoice })}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={16} color={C.gold} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.resubmitTitle}>Resubmit Proof of Payment</Text>
                <Text style={S.resubmitSub}>Update your submission if you made changes</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.gold} />
            </TouchableOpacity>
          </>
        )}

        {/* PAYMENT HISTORY */}
        <SectionLabel title="PAYMENT HISTORY" subtitle="Your rent payment record" />
        <View style={S.historyCard}>
          {paymentHistory.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: "rgba(245,240,232,0.3)", fontFamily: F.mono, fontSize: 12 }}>No payment history yet</Text>
            </View>
          ) : (
            paymentHistory.map((item, idx) => (
              <View key={item.id || idx}>
                <HistoryRow item={item} onViewReceipt={openReceipt} />
                {idx < paymentHistory.length - 1 && <View style={S.historyDivider} />}
              </View>
            ))
          )}
        </View>

        {/* LEASE SUMMARY */}
        <SectionLabel title="LEASE SUMMARY" />
        <View style={S.leaseCard}>
          {[
            ["Monthly Rent", fmt(tenantInfo.rentAmount)],
            ["Payment Due", `${tenantInfo.dueDay}${getOrdinal(tenantInfo.dueDay)} of each month`],
            ["Lease Ends", formatDateFull(tenantInfo.leaseEnd)],
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

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  scroll: { flex: 1 },
  scrollPad: { padding: 16 },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 2 },
  pageSub: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono, marginTop: 2 },
  scorePill: { borderWidth: 1.5, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { fontSize: 10, fontWeight: "700", fontFamily: F.mono, letterSpacing: 1, textTransform: "uppercase" },
  invoiceCard: { backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 20 },
  invoiceTop: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  invoiceIconWrap: { width: 38, height: 38, borderRadius: 6, backgroundColor: "rgba(232,160,18,0.1)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)", alignItems: "center", justifyContent: "center" },
  invoicePeriod: { fontSize: 14, fontWeight: "600", color: C.white, fontFamily: F.dm },
  invoiceDue: { fontSize: 11, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginTop: 2 },
  invoiceAmount: { fontSize: 20, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  invoiceDivider: { height: 1, backgroundColor: C.border },
  invoiceBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, paddingHorizontal: 16 },
  invoiceBannerText: { fontSize: 12, fontWeight: "500", flex: 1, fontFamily: F.dm },
  invoiceViewRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 12, paddingHorizontal: 16 },
  invoiceViewText: { flex: 1, fontSize: 12, fontWeight: "600", color: C.gold, fontFamily: F.mono, letterSpacing: 0.5 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10, marginTop: 4 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)", fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 2 },
  sectionSub: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, marginTop: 2 },
  sectionAction: { fontSize: 11, color: C.gold, fontWeight: "600", fontFamily: F.mono },
  payOptions: { flexDirection: "row", gap: 10, marginBottom: 24 },
  payCard: { flex: 1, backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, padding: 16 },
  payCardIcon: { width: 46, height: 46, borderRadius: 6, backgroundColor: C.muted, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  payCardTitle: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm, marginBottom: 3 },
  payCardSub: { fontSize: 10, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, lineHeight: 15 },
  resubmit: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(232,160,18,0.04)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(232,160,18,0.12)", padding: 14, marginBottom: 24 },
  resubmitTitle: { fontSize: 13, fontWeight: "600", color: C.gold, fontFamily: F.dm },
  resubmitSub: { fontSize: 10, color: C.gold, opacity: 0.6, fontFamily: F.mono, marginTop: 2 },
  historyCard: { backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 24 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  historyDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  historyDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  historyPeriod: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  historyMeta: { fontSize: 10, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, marginTop: 2 },
  historyAmount: { fontSize: 13, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 0.5 },
  receiptLink: { fontSize: 10, fontWeight: "600", color: C.gold, fontFamily: F.mono, marginTop: 3 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, alignSelf: "flex-start", marginTop: 2 },
  pillText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },
  leaseCard: { backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 12 },
  leaseRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  leaseLabel: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono },
  leaseValue: { fontSize: 12, fontWeight: "600", color: C.white, fontFamily: F.dm },
});