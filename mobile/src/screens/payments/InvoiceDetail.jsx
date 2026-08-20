// TENANT INVOICE DETAIL SCREEN
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, Share, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

function fmt(n)     { return `R ${Number(n || 0).toLocaleString("en-ZA")}`; }
function formatDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return String(d).slice(0, 10); }
}
function formatPeriod(s, e) {
  if (!s) return "Current Period";
  try { return new Date(s).toLocaleDateString("en-ZA", { month: "long", year: "numeric" }); }
  catch { return String(s).slice(0, 7); }
}

function formatRentalPeriod(startDateStr) {
  if (startDateStr) {
    try {
      const date = new Date(startDateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
      }
    } catch {}
  }
  return "—";
}

function formatTime(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

function statusConfig(status) {
  switch (status) {
    case "paid":     
      return { color: C.green, bg: "rgba(43,122,75,0.08)", label: "Fully Paid", icon: "checkmark-circle" };
    case "partial":  
      return { color: C.blue, bg: "rgba(52,152,219,0.08)", label: "Partially Paid", icon: "time" };
    case "overdue":  
      return { color: C.red, bg: "rgba(158,58,58,0.08)", label: "Overdue", icon: "alert-circle" };
    case "sent":
    case "unpaid":   
      return { color: C.blue, bg: "rgba(52,152,219,0.06)", label: "Payment Due", icon: "time" };
    case "pending_approval":
    case "pending":  
      return { color: C.blue, bg: "rgba(52,152,219,0.06)", label: "Pending Approval", icon: "hourglass" };
    case "collections":
      return { color: C.purple, bg: "rgba(111,66,193,0.08)", label: "In Collections", icon: "warning" };
    case "void":
    case "cancelled":     
      return { color: C.textMuted, bg: C.surface, label: "Cancelled", icon: "close-circle" };
    default:         
      return { color: C.textMuted, bg: C.surface, label: status || "Unknown", icon: "document" };
  }
}

function LineItem({ label, amount, sub, accent, bold, dimmed, topBorder }) {
  return (
    <View style={[S.lineItem, topBorder && { borderTopWidth: 1, borderTopColor: C.border, marginTop: 4, paddingTop: 12 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[S.lineLabel, dimmed && { color: C.textMuted }, bold && { color: C.textPrimary, fontWeight: "600" }]}>
          {label}
        </Text>
        {sub && <Text style={S.lineSub}>{sub}</Text>}
      </View>
      <Text style={[S.lineAmt, accent && { color: accent }, bold && { fontSize: 16, fontFamily: F.bebas, letterSpacing: 0.5 }]}>
        {amount != null ? fmt(amount) : "—"}
      </Text>
    </View>
  );
}

function PaymentRow({ payment, index }) {
  return (
    <View style={[S.paymentRow, index > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
      <View style={S.paymentLeft}>
        <View style={[S.paymentDot, { backgroundColor: payment.status === 'approved' ? C.green : C.blue }]} />
        <View>
          <Text style={S.paymentDate}>
            {formatDate(payment.paid_date || payment.created_at)}
            {payment.paid_date && ` at ${formatTime(payment.paid_date)}`}
          </Text>
          <Text style={S.paymentMethod}>
            {payment.method || payment.payment_method || 'Unknown method'}
            {payment.reference ? ` · Ref: ${payment.reference}` : ''}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={S.paymentAmount}>{fmt(payment.amount)}</Text>
        {payment.status === 'pending' && (
          <Text style={S.paymentStatusPending}>Pending</Text>
        )}
        {payment.status === 'approved' && (
          <Text style={S.paymentStatusApproved}>Confirmed</Text>
        )}
      </View>
    </View>
  );
}

export default function InvoiceDetail() {
  const navigation              = useNavigation();
  const route                   = useRoute();
  const { invoice: passedInv, invoiceId } = route.params || {};

  const [loading, setLoading]   = useState(!passedInv);
  const [refreshing, setRefreshing] = useState(false);
  const [invoice, setInvoice]   = useState(passedInv || null);
  const [tenant, setTenant]     = useState(null);
  const [payments, setPayments] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const id = invoiceId || passedInv?.id;
      const [invData, tenantData, paymentsData] = await Promise.all([
        id ? api.get(`/tenants/me/invoices/${id}`) : Promise.resolve({ invoice: passedInv }),
        api.getTenantProfile(),
        id ? api.get(`/tenants/me/invoices/${id}/payments`).catch(() => ({ payments: [] })) : Promise.resolve({ payments: [] }),
      ]);
      setInvoice(invData.invoice || passedInv);
      setTenant(tenantData);
      setPayments(paymentsData.payments || []);
    } catch (err) {
      console.error("Invoice fetch:", err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [invoiceId, passedInv]);

  useEffect(() => { fetchData(); }, [fetchData]);
  function onRefresh() { setRefreshing(true); fetchData(); }

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

  if (!invoice) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="arrow-left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Invoice</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: C.textMuted, fontFamily: F.mono, fontSize: 12 }}>Invoice not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg         = statusConfig(invoice.status);
  const isPaid      = invoice.status === "paid";
  const isPartial   = invoice.status === "partial";
  const isActionable= ["sent","unpaid","overdue", "partial"].includes(invoice.status);
  const isPending   = ["pending","pending_approval"].includes(invoice.status);
  const inCollections = invoice.status === "collections";

  const rent      = Number(invoice.rent_amount      || 0);
  const utilities = Number(invoice.utilities_amount || 0);
  const lateFees  = Number(invoice.late_fees        || 0);
  const other     = Number(invoice.other_charges    || 0);
  const discounts = Number(invoice.discounts        || 0);
  const total     = Number(invoice.amount_due || rent + utilities + lateFees + other - discounts);
  const paid      = Number(invoice.paid_amount      || 0);
  const remaining = Number(invoice.remaining_balance ?? (total - paid));
  const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;

  const tenantInfo = {
    name:             tenant ? `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim() : "Tenant",
    unit:             tenant?.unit_number ? `Unit ${tenant.unit_number}` : "—",
    property:         tenant?.property_name || "—",
    rentAmount:       invoice?.amount_due || tenant?.rent_amount || tenant?.monthly_rent || 0,
    dueDay:           invoice?.due_date ? new Date(invoice.due_date).getDate() : tenant?.payment_due_day || 1,
    leaseEnd:         tenant?.lease_end_date || "—",
    reliabilityScore: tenant?.reliability_score || "reliable",
  };

  function handlePay() {
    navigation.navigate("PaymentMethod", { 
      invoice: invoice, 
      tenant: tenantInfo 
    });
  }

  function handleUpload() {
    navigation.navigate("PaymentUpload", { invoice: invoice });
  }

  function handleViewReceipt() {
    navigation.navigate("PaymentReceipt", { 
      invoiceId: invoice.id,
      payment: {
        ...invoice,
        receiptNo: invoice.invoice_number,
        period: formatRentalPeriod(invoice.billing_period_start),
        amount: total,
        paidOn: invoice.paid_date,
        method: 'Payment',
        tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : "—",
        unit_number: tenant?.unit_number,
        property_name: tenant?.property_name,
      }
    });
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `Invoice ${invoice.invoice_number} — ${formatPeriod(invoice.billing_period_start)} — ${fmt(total)} due ${formatDate(invoice.due_date)}`,
      });
    } catch {}
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Invoice</Text>
        <TouchableOpacity onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="share" size={18} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.pad}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* INVOICE HERO */}
        <View style={S.hero}>
          {/* Invoice number + status */}
          <View style={S.heroTop}>
            <View>
              <Text style={S.invoiceNum}>{invoice.invoice_number || "INV-—"}</Text>
              <Text style={S.invoicePeriod}>{formatPeriod(invoice.billing_period_start, invoice.billing_period_end)}</Text>
            </View>
            <View style={[S.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + "30" }]}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={[S.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Total amount */}
          <View style={S.amountBlock}>
            <Text style={S.amountLabel}>TOTAL DUE</Text>
            <Text style={[S.amountVal, (isPaid || isPartial) && { color: isPaid ? C.green : C.textPrimary }]}>
              {isPaid ? fmt(paid) : fmt(total)}
            </Text>
            {isPartial && (
              <Text style={S.remainingText}>{fmt(remaining)} remaining</Text>
            )}
          </View>

          {/* Due date */}
          <View style={[S.dueBadge, { borderColor: isActionable ? C.blue + "30" : C.border }]}>
            <Ionicons name="calendar-outline" size={13} color={isActionable ? C.blue : C.textMuted} />
            <Text style={[S.dueText, { color: isActionable ? C.blue : C.textMuted }]}>
              {isPaid ? `Paid on ${formatDate(invoice.paid_date)}` : `Due ${formatDate(invoice.due_date)}`}
            </Text>
          </View>
        </View>

        {/* LATE FEE WARNING */}
        {lateFees > 0 && !isPaid && (
          <View style={S.warningBox}>
            <MaterialIcons name="error" size={15} color={C.red} />
            <Text style={S.warningText}>A late fee of {fmt(lateFees)} has been applied to this invoice.</Text>
          </View>
        )}

        {/* COLLECTIONS NOTICE */}
        {inCollections && (
          <View style={[S.warningBox, { borderColor: C.purple + "30", backgroundColor: "rgba(111,66,193,0.06)" }]}>
            <MaterialIcons name="warning" size={15} color={C.purple} />
            <Text style={[S.warningText, { color: C.purple }]}>
              This account has been sent to collections. Please contact your landlord or property manager.
            </Text>
          </View>
        )}

        {/* PENDING NOTICE */}
        {isPending && (
          <View style={S.infoBox}>
            <Ionicons name="hourglass-outline" size={15} color={C.blue} />
            <Text style={S.infoText}>Your payment is awaiting confirmation from your landlord. You'll be notified once it's approved.</Text>
          </View>
        )}

        {/* PAYMENT HISTORY ON INVOICE */}
        {payments.length > 0 && (
          <>
            <View style={S.secHead}>
              <Text style={S.secLabel}>PAYMENT HISTORY</Text>
            </View>
            <View style={S.card}>
              {payments.map((payment, idx) => (
                <PaymentRow key={payment.id || idx} payment={payment} index={idx} />
              ))}
              <View style={[S.paymentTotal, { borderTopWidth: 1, borderTopColor: C.border }]}>
                <Text style={S.paymentTotalLabel}>Total Paid</Text>
                <Text style={S.paymentTotalAmount}>{fmt(paid)}</Text>
              </View>
            </View>
          </>
        )}

        {/* BILLING BREAKDOWN */}
        <View style={S.secHead}>
          <Text style={S.secLabel}>BILLING BREAKDOWN</Text>
        </View>
        <View style={S.card}>
          <LineItem label="Monthly Rent"       amount={rent}      sub={formatPeriod(invoice.billing_period_start)} />
          {utilities > 0 && <LineItem label="Utilities"    amount={utilities} />}
          {lateFees  > 0 && <LineItem label="Late Fee"     amount={lateFees}  accent={C.red} />}
          {other     > 0 && <LineItem label="Other Charges" amount={other}   />}
          {discounts > 0 && <LineItem label="Discount"     amount={-discounts} accent={C.green} />}
          <LineItem label="Total Due" amount={total} bold topBorder />
          {paid > 0 && <LineItem label="Amount Paid"    amount={paid}      accent={C.green} />}
          {paid > 0 && remaining > 0 && (
            <LineItem label="Balance Remaining" amount={remaining} accent={C.red} bold />
          )}
        </View>

        {/* BILLING PERIOD */}
        <View style={S.secHead}>
          <Text style={S.secLabel}>BILLING PERIOD</Text>
        </View>
        <View style={S.card}>
          {[
            ["Period",   `${formatDate(invoice.billing_period_start)} – ${formatDate(invoice.billing_period_end)}`],
            ["Due Date", formatDate(invoice.due_date)],
            ["Issued",   formatDate(invoice.created_at)],
          ].map(([label, val], i, arr) => (
            <View key={label} style={[S.detailRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <Text style={S.detailLabel}>{label}</Text>
              <Text style={S.detailVal}>{val}</Text>
            </View>
          ))}
        </View>

        {/* TENANT / PROPERTY */}
        <View style={S.secHead}>
          <Text style={S.secLabel}>ADDRESSED TO</Text>
        </View>
        <View style={S.card}>
          {[
            ["Tenant",   tenant ? `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim() : "—"],
            ["Unit",     tenant?.unit_number ? `Unit ${tenant.unit_number}` : "—"],
            ["Property", tenant?.property_name || "—"],
          ].map(([label, val], i, arr) => (
            <View key={label} style={[S.detailRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <Text style={S.detailLabel}>{label}</Text>
              <Text style={S.detailVal}>{val}</Text>
            </View>
          ))}
        </View>

        {/* NOTES */}
        {invoice.notes && (
          <>
            <View style={S.secHead}><Text style={S.secLabel}>NOTES</Text></View>
            <View style={[S.card, { padding: 14 }]}>
              <Text style={{ fontSize: 12, color: C.textSecondary, fontFamily: F.dm, lineHeight: 19 }}>{invoice.notes}</Text>
            </View>
          </>
        )}

        {/* ACTIONS */}
        {isActionable && !inCollections && (
          <>
            <View style={S.secHead}>
              <Text style={S.secLabel}>
                {isPartial ? `COMPLETE PAYMENT (${fmt(remaining)} remaining)` : 'PAY THIS INVOICE'}
              </Text>
            </View>
            <TouchableOpacity style={S.btnPrimary} onPress={handlePay} activeOpacity={0.85}>
              <Ionicons name="card-outline" size={16} color="#ffffff" />
              <Text style={S.btnPrimaryText}>
                {isPartial ? `Pay Remaining ${fmt(remaining)}` : `Pay ${fmt(total)} In-App`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.btnGhost} onPress={handleUpload} activeOpacity={0.8}>
              <Feather name="upload" size={15} color={C.textSecondary} />
              <Text style={S.btnGhostText}>
                {isPartial ? 'Upload Additional Proof of Payment' : 'Upload Proof of Payment'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {isActionable && inCollections && (
          <>
            <View style={S.secHead}>
              <Text style={S.secLabel}>ACCOUNT IN COLLECTIONS</Text>
            </View>
            <TouchableOpacity 
              style={[S.btnPrimary, { backgroundColor: C.purple }]} 
              onPress={() => navigation.getParent()?.navigate("CollectionsStatus")}
              activeOpacity={0.85}
            >
              <Ionicons name="warning" size={16} color="#ffffff" />
              <Text style={[S.btnPrimaryText, { color: "#ffffff" }]}>View Collections Status</Text>
            </TouchableOpacity>
          </>
        )}

        {isPaid && (
          <TouchableOpacity
            style={[S.btnPrimary, { backgroundColor: C.green }]}
            onPress={handleViewReceipt}
            activeOpacity={0.85}
          >
            <Ionicons name="receipt-outline" size={16} color="#ffffff" />
            <Text style={[S.btnPrimaryText, { color: "#ffffff" }]}>View Receipt</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  pad:    { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },

  hero: { backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 16, gap: 14 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  invoiceNum: { fontSize: 11, fontFamily: F.mono, color: C.primary, letterSpacing: 1.5, fontWeight: "700" },
  invoicePeriod: { fontSize: 15, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, marginTop: 3 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: "700", fontFamily: F.mono, letterSpacing: 0.8, textTransform: "uppercase" },
  amountBlock: { alignItems: "center", paddingVertical: 8 },
  amountLabel: { fontSize: 9, fontFamily: F.mono, color: C.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  amountVal: { fontSize: 42, fontFamily: F.bebas, color: C.textPrimary, letterSpacing: 1, lineHeight: 46 },
  remainingText: { fontSize: 13, color: C.red, fontFamily: F.bebas, letterSpacing: 0.5, marginTop: 4 },
  dueBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", borderWidth: 1, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 5 },
  dueText: { fontSize: 11, fontFamily: F.mono, fontWeight: "600" },

  warningBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(158,58,58,0.06)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(158,58,58,0.18)", padding: 12, marginBottom: 16 },
  warningText: { flex: 1, fontSize: 12, color: C.red, fontFamily: F.dm, lineHeight: 18 },
  infoBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(52,152,219,0.06)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(52,152,219,0.15)", padding: 12, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 12, color: C.textSecondary, fontFamily: F.dm, lineHeight: 18 },

  secHead: { marginBottom: 8, marginTop: 4 },
  secLabel: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 2, textTransform: "uppercase" },

  card: { backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 16 },
  lineItem: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 11 },
  lineLabel: { fontSize: 13, color: C.textSecondary, fontFamily: F.dm },
  lineSub: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  lineAmt: { fontSize: 13, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },

  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  detailLabel: { fontSize: 12, color: C.textMuted, fontFamily: F.mono },
  detailVal: { fontSize: 12, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, textAlign: "right", flex: 1, marginLeft: 12 },

  paymentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  paymentLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  paymentDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  paymentDate: { fontSize: 12, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  paymentMethod: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  paymentAmount: { fontSize: 13, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 0.5 },
  paymentStatusPending: { fontSize: 8, fontWeight: "700", color: C.blue, fontFamily: F.mono, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 },
  paymentStatusApproved: { fontSize: 8, fontWeight: "700", color: C.green, fontFamily: F.mono, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 },
  paymentTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#f9fafb" },
  paymentTotalLabel: { fontSize: 12, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  paymentTotalAmount: { fontSize: 14, fontWeight: "700", color: C.primary, fontFamily: F.bebas, letterSpacing: 0.5 },

  btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.primary, borderRadius: 4, paddingVertical: 14, marginBottom: 10 },
  btnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#ffffff", fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase" },
  btnGhost: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "transparent", borderRadius: 4, borderWidth: 1, borderColor: C.border, paddingVertical: 13, marginBottom: 16 },
  btnGhostText: { fontSize: 12, color: C.textSecondary, fontFamily: F.dm, letterSpacing: 0.3 },
});