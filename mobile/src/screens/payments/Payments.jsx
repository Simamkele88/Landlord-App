// TENANT PAYMENTS SCREEN
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert,
  ActivityIndicator, RefreshControl, SafeAreaView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";
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
function formatDateFull(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return String(d).slice(0, 10);
    return dt.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return String(d).slice(0, 10); }
}
function formatPeriod(s) {
  if (!s) return "Current Period";
  try {
    const dt = new Date(s);
    if (isNaN(dt)) return String(s).slice(0, 7);
    return dt.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  } catch { return "Current Period"; }
}
function getOrdinal(n) {
  const s = ["th","st","nd","rd"], v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const INVOICE_TYPE_CONFIG = {
  rent:    { label: "Rent",      color: C.blue,   bg: "rgba(52,152,219,0.08)" },
  deposit: { label: "Deposit",   color: C.green,  bg: "rgba(43,122,75,0.08)" },
  damage:  { label: "Damage",    color: C.red,    bg: "rgba(158,58,58,0.08)" },
  utility: { label: "Utility",   color: C.primary,bg: "rgba(44,62,80,0.08)" },
  other:   { label: "Other",     color: C.textMuted, bg: "rgba(0,0,0,0.04)" },
};

function invoiceTypeConfig(type) {
  return INVOICE_TYPE_CONFIG[type] || INVOICE_TYPE_CONFIG.other;
}

function InvoiceTypeBadge({ type }) {
  const cfg = invoiceTypeConfig(type);
  return (
    <View style={[S.invoiceTypeBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + "40" }]}>
      <Text style={[S.invoiceTypeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function invoiceTitle(invoice) {
  const type = invoice?.invoice_type || "rent";
  const cfg = invoiceTypeConfig(type);
  if (type === "deposit") {
    const notes = (invoice?.notes || "").toLowerCase();
    if (notes.includes("replenish")) return "Deposit Replenishment";
    return "Deposit Invoice";
  }
  return `${cfg.label} Invoice`;
}

function statusConfig(status) {
  switch (status) {
    case "paid":             return { color: C.green,  bg: "rgba(43,122,75,0.08)",   label: "Paid" };
    case "pending":
    case "pending_approval": return { color: C.blue,   bg: "rgba(52,152,219,0.08)",  label: "Pending" };
    case "late":             return { color: C.red,    bg: "rgba(158,58,58,0.08)",   label: "Late" };
    case "overdue":          return { color: C.red,    bg: "rgba(158,58,58,0.08)",   label: "Overdue" };
    case "sent":
    case "unpaid":           return { color: C.red,    bg: "rgba(158,58,58,0.08)",   label: "Unpaid" };
    case "partial":          return { color: C.blue,   bg: "rgba(52,152,219,0.08)",  label: "Partial" };
    case "collections":      return { color: C.purple, bg: "rgba(111,66,193,0.08)",  label: "Collections" };
    case "rejected":         return { color: C.red,    bg: "rgba(158,58,58,0.08)",   label: "Rejected" };
    default:                 return { color: C.textMuted, bg: C.surface,             label: String(status) };
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

function PendingPaymentBanner({ pendingAmount }) {
  return (
    <View style={S.pendingBanner}>
      <MaterialIcons name="info-outline" size={18} color={C.blue} />
      <Text style={S.pendingBannerText}>
        You have a pending payment of {fmt(pendingAmount)} awaiting approval. Submitting a new payment will automatically cancel the previous one.
      </Text>
    </View>
  );
}

function CollectionsBanner({ balance, onPress }) {
  return (
    <TouchableOpacity style={S.collectionsBanner} onPress={onPress} activeOpacity={0.85}>
      <View style={S.collectionsIconWrap}>
        <MaterialIcons name="warning" size={20} color={C.red} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={S.collectionsTitle}>Account in Collections</Text>
        <Text style={S.collectionsSub}>
          {balance > 0 ? `${fmt(balance)} outstanding: ` : ""}tap to view options and request a repayment plan.
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={C.red} />
    </TouchableOpacity>
  );
}

function RepaymentBanner({ plan, onPress }) {
  return (
    <TouchableOpacity style={S.repaymentBanner} onPress={onPress} activeOpacity={0.85}>
      <View style={S.repaymentIconWrap}>
        <Ionicons name="calendar-outline" size={18} color={C.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={S.repaymentTitle}>Active Repayment Plan</Text>
        <Text style={S.repaymentSub}>
          {fmt(plan.paid_amount)} paid · {fmt(plan.remaining)} remaining · {plan.progress_pct}% complete
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={C.blue} />
    </TouchableOpacity>
  );
}

function InvoiceCard({ invoice, tenant, onViewInvoice }) {
  const status    = invoice?.status || "unpaid";
  const isOverdue = status === "overdue";
  const isPending = status === "pending" || status === "pending_approval";
  const isPaid    = status === "paid";
  const isUnpaid  = status === "sent" || status === "unpaid";
  const isPartial = status === "partial";
  const hasPendingPayment = Number(invoice?.pending_amount || 0) > 0;
  const type = invoice?.invoice_type || "rent";
  const showPendingBanner = hasPendingPayment && !isPaid;
  const isFullyPaid = isPaid || (invoice?.amount_due <= 0);
  
  if (isFullyPaid && !isPartial) {
    return null;
  }

  return (
    <View style={[S.invoiceCard, isOverdue && { borderColor: C.red + "40" }]}>
      <View style={S.invoiceTop}>
        <View style={S.invoiceIconWrap}>
          <Ionicons name="document-text" size={20} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={S.invoicePeriod}>{invoiceTitle(invoice)}</Text>
            <InvoiceTypeBadge type={type} />
          </View>
          <Text style={S.invoiceDue}>Due {formatDate(invoice?.due_date)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[S.invoiceAmount, isOverdue && { color: C.red }]}>
            {fmt(invoice?.remaining_balance || 0)}
          </Text>
          {isPartial && (
            <Text style={S.partialLabel}>
              {fmt(invoice?.paid_amount || 0)} paid
            </Text>
          )}
        </View>
      </View>
      {(invoice?.late_fees || 0) > 0 && (
        <View style={[S.invoiceBanner, { backgroundColor: "rgba(158,58,58,0.04)" }]}>
          <MaterialIcons name="warning-amber" size={13} color={C.red} />
          <Text style={[S.invoiceBannerText, { color: C.red, fontSize: 11 }]}>
            Late fee applied: {fmt(invoice.late_fees)}
          </Text>
        </View>
      )}
      <View style={S.invoiceDivider} />
      {showPendingBanner && (
        <View style={[S.invoiceBanner, { backgroundColor: "rgba(52,152,219,0.04)" }]}>
          <MaterialIcons name="pending-actions" size={15} color={C.blue} />
          <Text style={[S.invoiceBannerText, { color: C.blue }]}>
            Pending payment: {fmt(invoice.pending_amount)} awaiting approval
          </Text>
        </View>
      )}
      {isUnpaid  && <View style={[S.invoiceBanner, { backgroundColor: C.surface }]}><Ionicons name="time-outline" size={15} color={C.textMuted} /><Text style={[S.invoiceBannerText, { color: C.textMuted }]}>Amount is due. Please make payment to avoid late fees.</Text></View>}
      {isOverdue && <View style={[S.invoiceBanner, { backgroundColor: "rgba(158,58,58,0.06)" }]}><MaterialIcons name="error" size={15} color={C.red} /><Text style={[S.invoiceBannerText, { color: C.red }]}>Payment is overdue</Text></View>}
      {isPending && !hasPendingPayment && <View style={[S.invoiceBanner, { backgroundColor: "rgba(52,152,219,0.04)" }]}><MaterialIcons name="pending-actions" size={15} color={C.blue} /><Text style={[S.invoiceBannerText, { color: C.blue }]}>Awaiting landlord approval</Text></View>}
      {isPaid    && <View style={[S.invoiceBanner, { backgroundColor: "rgba(43,122,75,0.06)" }]}><Ionicons name="checkmark-circle" size={15} color={C.green} /><Text style={[S.invoiceBannerText, { color: C.green }]}>Payment confirmed</Text></View>}
      {isPartial && <View style={[S.invoiceBanner, { backgroundColor: "rgba(52,152,219,0.04)" }]}><MaterialIcons name="pending-actions" size={15} color={C.blue} /><Text style={[S.invoiceBannerText, { color: C.blue }]}>Partial payment received: {fmt(invoice?.remaining_balance || 0)} remaining</Text></View>}
      <View style={S.invoiceDivider} />
      <TouchableOpacity style={S.invoiceViewRow} onPress={onViewInvoice} activeOpacity={0.7}>
        <Feather name="file-text" size={14} color={C.primary} />
        <Text style={S.invoiceViewText}>View Invoice</Text>
        <Feather name="chevron-right" size={14} color={C.primary} />
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
        <Text style={S.historyPeriod}>{formatPeriod(item.billing_period_start) || item.period || "—"}</Text>
        <Text style={S.historyMeta}>
          {item.payment_date ? `Paid ${formatDate(item.payment_date)}` : "Not yet paid"}
          {item.payment_method ? `  ${item.payment_method}` : ""}
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
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [tenant, setTenant]           = useState(null);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [collectionData, setCollectionData] = useState(null);
  const [repaymentPlan, setRepaymentPlan]   = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [tenantData, invData, payData, collData, planData] = await Promise.all([
        api.getTenantProfile(),
        api.getInvoices(),
        api.getPayments(),
        api.get("/collections/me").catch(() => null),
        api.get("/repayment-plans/me").catch(() => null),
      ]);

      setTenant(tenantData);

      const invList = invData.invoices || [];
      const filteredInvoices = invList.filter(i => i.status !== "rejected");
      const activeInvoice = filteredInvoices.find(i => {
        const hasBalance = (i.amount_due || i.amount || 0) > 0;
        const isActive = ["sent", "unpaid", "overdue", "partial"].includes(i.status);
        return isActive && hasBalance;
      }) || filteredInvoices[0] || null;
      
      setCurrentInvoice(activeInvoice);
      setPaymentHistory(payData.payments || []);
      setCollectionData(collData || null);

      if (planData?.plan && planData.plan.status === "active") {
        const p = planData.plan;
        setRepaymentPlan({
          ...p,
          paid_amount:  Number(p.paid_amount  || 0),
          remaining:    Number(p.remaining    || 0),
          progress_pct: Number(p.progress_pct || 0),
        });
      } else {
        setRepaymentPlan(null);
      }
    } catch (err) {
      console.error("Payments fetch:", err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  function onRefresh() { setRefreshing(true); fetchData(); }

  function openReceipt(item) {
    navigation.getParent()?.navigate("PaymentReceipt", {
      payment: {
        ...item,
        receiptNo:     item.receipt_no || `RCP-${String(item.id || "").slice(0, 8)}`,
        period:        formatPeriod(item.billing_period_start) || item.period || "—",
        amount:        item.amount_paid || item.amount_due || item.amount,
        paidOn:        item.payment_date || item.paidOn,
        method:        item.payment_method || item.method,
        reference:     item.bank_reference || item.reference,
        tenant_name:   tenant ? `${tenant.first_name} ${tenant.last_name}` : "—",
        unit_number:   tenant?.unit_number,
        property_name: tenant?.property_name,
      },
    });
  }

  function handlePaymentNavigation(route, invoice) {
    const hasPending = Number(invoice?.pending_amount || 0) > 0;
    if (hasPending) {
      Alert.alert(
        "Pending Payment Exists",
        `You have a pending payment of ${fmt(invoice.pending_amount)} awaiting approval. Submitting a new payment will automatically cancel the previous one. Do you want to continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Continue", 
            style: "destructive",
            onPress: () => navigation.navigate(route, { invoice, tenant: tenantInfo })
          }
        ]
      );
    } else {
      navigation.navigate(route, { invoice, tenant: tenantInfo });
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const invoiceStatus = currentInvoice?.status || "unpaid";
  const isPending     = ["pending","pending_approval"].includes(invoiceStatus);
  const needsPay      = ["sent","unpaid","overdue","partial"].includes(invoiceStatus);
  const inCollections = collectionData?.in_collections || false;
  const hasPendingPayment = Number(currentInvoice?.pending_amount || 0) > 0;

  const tenantInfo = {
    firstName:        tenant?.first_name || "—",
    lastName:         tenant?.last_name || "—",
    name:             tenant ? `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim() : "Tenant",
    unit:             tenant?.unit_number ? `Unit ${tenant.unit_number}` : "—",
    property:         tenant?.property_name || "—",
    rentAmount:       currentInvoice?.rent_amount || tenant?.rent_amount || tenant?.monthly_rent || 0,
    dueDay:           currentInvoice?.due_date ? new Date(currentInvoice.due_date).getDate() : tenant?.payment_due_day || 1,
    leaseEnd:         tenant?.lease_end_date || "—",
    reliabilityScore: tenant?.reliability_score || "reliable",
  };

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.pad}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* HEADER */}
        <View style={S.pageHeader}>
          <View>
            <Text style={S.pageTitle}>Payments</Text>
            <Text style={S.pageSub}>{tenantInfo.property}  {tenantInfo.unit} </Text>
          </View>
        </View>

        {/* COLLECTIONS BANNER */}
        {inCollections && (
          <CollectionsBanner
            balance={collectionData?.total_outstanding || 0}
            onPress={() => navigation.getParent()?.navigate("CollectionsStatus")}
          />
        )}

        {/* REPAYMENT PLAN BANNER */}
        {!inCollections && repaymentPlan && (
          <RepaymentBanner
            plan={repaymentPlan}
            onPress={() => navigation.getParent()?.navigate("RepaymentPlan")}
          />
        )}

        {/* PENDING PAYMENT WARNING */}
        {needsPay && hasPendingPayment && (
          <PendingPaymentBanner pendingAmount={currentInvoice.pending_amount} />
        )}

        {/* CURRENT INVOICE */}
        {currentInvoice ? (
          <InvoiceCard
            invoice={currentInvoice}
            tenant={tenantInfo}
            onViewInvoice={() => navigation.navigate("InvoiceDetail", { invoice: currentInvoice })}
          />
        ) : (
          <View style={[S.invoiceCard, { padding: 24, alignItems: "center" }]}>
            <Ionicons name="document-text" size={32} color={C.textMuted} />
            <Text style={{ color: C.textMuted, fontFamily: F.mono, fontSize: 12, marginTop: 8 }}>
              No outstanding invoices
            </Text>
          </View>
        )}

        {/* PAY OPTIONS */}
        {needsPay && currentInvoice && (
          <>
            <SectionLabel 
              title="MAKE PAYMENT" 
              subtitle={hasPendingPayment ? "Submitting a new payment will auto-cancel the pending one" : "Choose how you'd like to pay this month"} 
            />
            <View style={S.payOptions}>
              <TouchableOpacity
                style={[S.payCard, { borderColor: C.primary + "40" }]}
                onPress={() => handlePaymentNavigation("PaymentMethod", currentInvoice)}
                activeOpacity={0.8}
              >
                <View style={S.payCardIcon}>
                  <FontAwesome5 name="credit-card" size={24} color={C.primary} />
                </View>
                <Text style={S.payCardTitle}>Pay In-App</Text>
                <Text style={S.payCardSub}>Card or EFT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.payCard, { borderColor: C.border }]}
                onPress={() => handlePaymentNavigation("PaymentUpload", currentInvoice)}
                activeOpacity={0.8}
              >
                <View style={[S.payCardIcon, { backgroundColor: C.surface }]}>
                  <Feather name="upload" size={24} color={C.textMuted} />
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
              onPress={() => handlePaymentNavigation("PaymentUpload", currentInvoice)}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={16} color={C.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.resubmitTitle}>Resubmit Proof of Payment</Text>
                <Text style={S.resubmitSub}>Update your submission if you made changes</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.primary} />
            </TouchableOpacity>
          </>
        )}

        {/* PAYMENT HISTORY */}
        <SectionLabel
          title="PAYMENT HISTORY"
          subtitle="Your payment record"
        />
        <View style={S.historyCard}>
          {paymentHistory.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: C.textMuted, fontFamily: F.mono, fontSize: 12 }}>
                No payment history yet
              </Text>
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
            ["Monthly Rent", fmt(tenant?.rent_amount || tenant?.monthly_rent || currentInvoice?.rent_amount || 0)], 
            ["Payment Due",  `${tenantInfo.dueDay}${getOrdinal(tenantInfo.dueDay)} of each month`],
            ["Lease Ends",   formatDateFull(tenantInfo.leaseEnd)],
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
  safe:      { flex: 1, backgroundColor: C.background },
  scroll:    { flex: 1 },
  pad:       { padding: 16 },
  pageHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 2 },
  pageSub:   { fontSize: 12, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  scorePill: { borderWidth: 1.5, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { fontSize: 10, fontWeight: "700", fontFamily: F.mono, letterSpacing: 1, textTransform: "uppercase" },

  pendingBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "rgba(52,152,219,0.08)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(52,152,219,0.18)", padding: 14, marginBottom: 14 },
  pendingBannerText: { flex: 1, fontSize: 12, color: C.blue, fontFamily: F.dm, lineHeight: 18 },

  collectionsBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(158,58,58,0.06)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(158,58,58,0.22)", padding: 14, marginBottom: 14 },
  collectionsIconWrap:{ width: 36, height: 36, borderRadius: 6, backgroundColor: "rgba(158,58,58,0.1)", alignItems: "center", justifyContent: "center" },
  collectionsTitle:  { fontSize: 13, fontWeight: "700", color: C.red, fontFamily: F.dm },
  collectionsSub:    { fontSize: 11, color: C.red, opacity: 0.7, fontFamily: F.dm, marginTop: 2, lineHeight: 16 },

  repaymentBanner:   { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(52,152,219,0.04)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(52,152,219,0.18)", padding: 14, marginBottom: 14 },
  repaymentIconWrap: { width: 36, height: 36, borderRadius: 6, backgroundColor: "rgba(52,152,219,0.08)", alignItems: "center", justifyContent: "center" },
  repaymentTitle:    { fontSize: 13, fontWeight: "700", color: C.blue, fontFamily: F.dm },
  repaymentSub:      { fontSize: 11, color: C.blue, opacity: 0.7, fontFamily: F.dm, marginTop: 2 },

  invoiceCard:    { backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 20 },
  invoiceTop:     { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  invoiceIconWrap:{ width: 38, height: 38, borderRadius: 6, backgroundColor: "rgba(44,62,80,0.08)", borderWidth: 1, borderColor: "rgba(44,62,80,0.15)", alignItems: "center", justifyContent: "center" },
  invoicePeriod:  { fontSize: 14, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  invoiceDue:     { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  invoiceAmount:  { fontSize: 20, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  partialLabel:   { fontSize: 10, color: C.blue, fontFamily: F.mono, marginTop: 2 },
  invoiceDivider: { height: 1, backgroundColor: C.border },
  invoiceBanner:  { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, paddingHorizontal: 16 },
  invoiceBannerText:{ fontSize: 12, fontWeight: "500", flex: 1, fontFamily: F.dm },
  invoiceViewRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 12, paddingHorizontal: 16 },
  invoiceViewText:{ flex: 1, fontSize: 12, fontWeight: "600", color: C.primary, fontFamily: F.mono, letterSpacing: 0.5 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10, marginTop: 4 },
  sectionLabel:  { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 2 },
  sectionSub:    { fontSize: 11, color: "#888888", fontFamily: F.mono, marginTop: 2 },
  sectionAction: { fontSize: 11, color: C.primary, fontWeight: "600", fontFamily: F.mono },

  payOptions:   { flexDirection: "row", gap: 10, marginBottom: 24 },
  payCard:      { flex: 1, backgroundColor: C.card, borderRadius: 6, borderWidth: 1, padding: 16 },
  payCardIcon:  { width: 46, height: 46, borderRadius: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  payCardTitle: { fontSize: 13, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, marginBottom: 3 },
  payCardSub:   { fontSize: 10, color: C.textMuted, fontFamily: F.mono, lineHeight: 15 },

  resubmit:      { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(44,62,80,0.04)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(44,62,80,0.12)", padding: 14, marginBottom: 24 },
  resubmitTitle: { fontSize: 13, fontWeight: "600", color: C.primary, fontFamily: F.dm },
  resubmitSub:   { fontSize: 10, color: C.primary, opacity: 0.6, fontFamily: F.mono, marginTop: 2 },

  historyCard:   { backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 24 },
  historyRow:    { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  historyDivider:{ height: 1, backgroundColor: C.border, marginHorizontal: 14 },
  historyDot:    { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  historyPeriod: { fontSize: 13, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  historyMeta:   { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  historyAmount: { fontSize: 13, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 0.5 },
  receiptLink:   { fontSize: 10, fontWeight: "600", color: C.primary, fontFamily: F.mono, marginTop: 3 },
  pill:          { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, alignSelf: "flex-start", marginTop: 2 },
  pillText:      { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },

  leaseCard:  { backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 12 },
  leaseRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  leaseLabel: { fontSize: 12, color: C.textMuted, fontFamily: F.mono },
  leaseValue: { fontSize: 12, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },

  invoiceTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1, alignSelf: 'flex-start' },
  invoiceTypeText:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', fontFamily: F.mono, letterSpacing: 1 },
});