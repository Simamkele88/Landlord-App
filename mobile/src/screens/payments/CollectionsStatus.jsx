// TENANT COLLECTIONS STATUS SCREEN
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, Linking, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

function fmt(n) { return `R ${Number(n || 0).toLocaleString("en-ZA")}`; }
function formatDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d).slice(0, 10); }
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

function collectionStatusConfig(status) {
  switch (status) {
    case "flagged":           return { color: C.red,    label: "Flagged",           icon: "alert-circle" };
    case "active":            return { color: C.red,    label: "In Collections",    icon: "alert-circle" };
    case "repayment_agreed":  return { color: C.blue,   label: "Repayment Agreed",  icon: "time" };
    case "recovered":         return { color: C.green,  label: "Recovered",         icon: "checkmark-circle" };
    default:                  return { color: C.textMuted, label: status,           icon: "information-circle" };
  }
}

function TimelineStep({ label, desc, done, active, last }) {
  const dotColor = done ? C.green : active ? C.primary : "#cccccc";
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <View style={{ alignItems: "center" }}>
        <View style={[S.stepDot, { backgroundColor: dotColor, borderColor: done ? C.green : active ? C.primary : C.border }]}>
          {done && <Ionicons name="checkmark" size={10} color="#fff" />}
          {active && !done && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary }} />}
        </View>
        {!last && <View style={[S.stepLine, { backgroundColor: done ? C.green : C.border }]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 20 }}>
        <Text style={[S.stepLabel, { color: done || active ? C.textPrimary : C.textMuted }]}>{label}</Text>
        <Text style={[S.stepDesc, { color: done || active ? C.textSecondary : "#888888" }]}>{desc}</Text>
      </View>
    </View>
  );
}

function OverdueRow({ invoice, last }) {
  const type = invoice.invoice_type || "rent";
  return (
    <View style={[S.overdueRow, !last && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={S.overdueMonth}>
            {invoice.billing_period_start
              ? new Date(invoice.billing_period_start).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })
              : "Invoice"}
          </Text>
          <InvoiceTypeBadge type={type} />
        </View>
        <Text style={S.overdueMeta}>Due {formatDate(invoice.due_date)}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={S.overdueAmt}>{fmt(invoice.remaining_balance || invoice.amount_due)}</Text>
        <Text style={S.overdueLabel}>outstanding</Text>
      </View>
    </View>
  );
}

export default function CollectionsStatus() {
  const navigation = useNavigation();
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collection, setCollection] = useState(null);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [plan, setPlan]             = useState(null);
  const [tenant, setTenant]         = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [tenantData, collData, planData] = await Promise.all([
        api.getTenantProfile(),
        api.get("/collections/me"),
        api.get("/repayment-plans/me"),
      ]);
      setTenant(tenantData);
      setCollection(collData.collection || null);
      setOverdueInvoices(collData.overdue_invoices || []);
      setPlan(planData.plan || null);
    } catch (err) {
      console.error("Collections status fetch:", err?.message || err);
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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const status     = collection?.status || "active";
  const cfg        = collectionStatusConfig(status);
  const balance    = collection?.outstanding_balance || overdueInvoices.reduce((s, i) => s + Number(i.remaining_balance || i.amount_due || 0), 0);
  const daysOver   = collection?.days_overdue || 0;
  const hasPlan    = !!plan && plan.status === "active";
  const pendingReq = !!plan && plan.status === "pending";
  const isResolved = status === "recovered";

  const step1done = true;
  const step2done = status !== "flagged";
  const step3done = hasPlan || isResolved;
  const step4done = isResolved;

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Account Status</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.pad}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* STATUS HERO */}
        <View style={[S.hero, { borderColor: cfg.color + "40" }]}>
          <View style={[S.heroIcon, { backgroundColor: cfg.color + "14" }]}>
            <Ionicons name={cfg.icon} size={32} color={cfg.color} />
          </View>
          <Text style={[S.heroStatus, { color: cfg.color }]}>{cfg.label}</Text>
          {!isResolved && (
            <>
              <Text style={S.heroBalance}>{fmt(balance)}</Text>
              <Text style={S.heroSub}>outstanding balance</Text>
              {daysOver > 0 && (
                <View style={[S.daysBadge, { borderColor: cfg.color + "30" }]}>
                  <Text style={[S.daysBadgeText, { color: cfg.color }]}>{daysOver} days overdue</Text>
                </View>
              )}
            </>
          )}
          {isResolved && (
            <>
              <Text style={S.heroBalance}>R 0</Text>
              <Text style={S.heroSub}>all balances cleared</Text>
            </>
          )}
        </View>

        {/* LANDLORD NOTE */}
        {collection?.notes && (
          <View style={S.noteBox}>
            <Feather name="message-square" size={14} color={C.primary} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={S.noteLabel}>Note from landlord</Text>
              <Text style={S.noteText}>{collection.notes}</Text>
            </View>
          </View>
        )}

        {/* OVERDUE INVOICES */}
        {overdueInvoices.length > 0 && !isResolved && (
          <>
            <View style={S.secHead}>
              <Text style={S.secLabel}>OVERDUE INVOICES</Text>
            </View>
            <View style={S.card}>
              {overdueInvoices.map((inv, i) => (
                <OverdueRow key={inv.id || i} invoice={inv} last={i === overdueInvoices.length - 1} />
              ))}
            </View>
          </>
        )}

        {/* ACTIVE PLAN SUMMARY */}
        {hasPlan && (
          <>
            <View style={S.secHead}>
              <Text style={S.secLabel}>REPAYMENT PLAN</Text>
              <TouchableOpacity onPress={() => navigation.navigate("RepaymentPlan")} activeOpacity={0.7}>
                <Text style={S.secAction}>View Plan →</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[S.card, S.planCard]} onPress={() => navigation.navigate("RepaymentPlan")} activeOpacity={0.85}>
              <View style={S.planRow}>
                <Text style={S.planLabel}>Total agreed</Text>
                <Text style={S.planVal}>{fmt(plan.total_amount)}</Text>
              </View>
              <View style={[S.planRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
                <Text style={S.planLabel}>Paid so far</Text>
                <Text style={[S.planVal, { color: C.green }]}>{fmt(plan.paid_amount)}</Text>
              </View>
              <View style={[S.planRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
                <Text style={S.planLabel}>Remaining</Text>
                <Text style={[S.planVal, { color: C.red }]}>{fmt(plan.remaining)}</Text>
              </View>
              <View style={S.progressWrap}>
                <View style={S.progressTrack}>
                  <View style={[S.progressFill, { width: `${plan.progress_pct || 0}%` }]} />
                </View>
                <Text style={S.progressPct}>{plan.progress_pct || 0}% paid</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* PENDING REQUEST */}
        {pendingReq && (
          <View style={[S.card, S.pendingBox]}>
            <MaterialIcons name="pending-actions" size={18} color={C.blue} />
            <View style={{ flex: 1 }}>
              <Text style={S.pendingTitle}>Plan request submitted</Text>
              <Text style={S.pendingSub}>Your landlord is reviewing your proposal for {fmt(plan.total_amount)} over {plan.instalments} instalments. You'll be notified when it's reviewed.</Text>
            </View>
          </View>
        )}

        {/* OPTIONS */}
        {!isResolved && !hasPlan && !pendingReq && (
          <>
            <View style={S.secHead}>
              <Text style={S.secLabel}>YOUR OPTIONS</Text>
            </View>

            <TouchableOpacity
              style={[S.optionCard, { borderColor: C.primary + "35" }]}
              onPress={() => navigation.navigate("RequestRepaymentPlan", { balance, collection })}
              activeOpacity={0.85}
            >
              <View style={[S.optionIcon, { backgroundColor: "rgba(44,62,80,0.08)" }]}>
                <Ionicons name="calendar-outline" size={20} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.optionTitle, { color: C.primary }]}>Request a Repayment Plan</Text>
                <Text style={S.optionSub}>Propose a payment schedule your landlord can approve. Breaks your balance into manageable instalments.</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={S.optionCard}
              onPress={() => navigation.getParent()?.navigate("PaymentMethod", { amount: balance })}
              activeOpacity={0.85}
            >
              <View style={[S.optionIcon, { backgroundColor: "rgba(0,0,0,0.04)" }]}>
                <Ionicons name="card-outline" size={20} color={C.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.optionTitle}>Pay in Full</Text>
                <Text style={S.optionSub}>Clear the outstanding balance immediately using card or EFT.</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={S.optionCard}
              onPress={() => navigation.getParent()?.navigate("Messages")}
              activeOpacity={0.85}
            >
              <View style={[S.optionIcon, { backgroundColor: "rgba(0,0,0,0.04)" }]}>
                <Ionicons name="chatbubble-outline" size={20} color={C.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.optionTitle}>Contact Landlord</Text>
                <Text style={S.optionSub}>Discuss your situation directly before a formal arrangement is made.</Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textMuted} />
            </TouchableOpacity>
          </>
        )}

        {/* TIMELINE */}
        <View style={S.secHead}>
          <Text style={S.secLabel}>RESOLUTION STEPS</Text>
        </View>
        <View style={S.card}>
          <TimelineStep label="Account flagged" desc="Your account was flagged for outstanding rent." done={step1done} active={false} last={false} />
          <TimelineStep label="Under review" desc="Landlord is reviewing your account and payment history." done={step2done} active={!step2done} last={false} />
          <TimelineStep label="Arrangement made" desc="A repayment plan is agreed or full payment is received." done={step3done} active={step2done && !step3done} last={false} />
          <TimelineStep label="Account cleared" desc="Your balance is settled and account returns to good standing." done={step4done} active={step3done && !step4done} last />
        </View>

        {/* RESOLVED */}
        {isResolved && (
          <View style={[S.card, { padding: 20, alignItems: "center", gap: 8, borderColor: C.green + "30" }]}>
            <Ionicons name="checkmark-circle" size={36} color={C.green} />
            <Text style={{ fontSize: 16, fontFamily: F.bebas, color: C.textPrimary, letterSpacing: 1 }}>Account Cleared</Text>
            <Text style={{ fontSize: 12, color: C.textMuted, fontFamily: F.mono, textAlign: "center" }}>
              Your collections case is resolved. Your reliability score will update shortly.
            </Text>
          </View>
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

  hero: { backgroundColor: C.card, borderRadius: 6, borderWidth: 1, padding: 24, alignItems: "center", gap: 6, marginBottom: 20 },
  heroIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroStatus: { fontSize: 11, fontFamily: F.mono, letterSpacing: 2, textTransform: "uppercase", fontWeight: "700" },
  heroBalance: { fontSize: 36, fontFamily: F.bebas, color: C.textPrimary, letterSpacing: 1, lineHeight: 40 },
  heroSub: { fontSize: 11, color: C.textMuted, fontFamily: F.mono },
  daysBadge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  daysBadgeText: { fontSize: 10, fontFamily: F.mono, letterSpacing: 1, fontWeight: "700" },

  noteBox: { flexDirection: "row", gap: 10, backgroundColor: "rgba(44,62,80,0.04)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(44,62,80,0.12)", padding: 12, marginBottom: 20 },
  noteLabel: { fontSize: 9, fontFamily: F.mono, color: C.primary, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 },
  noteText: { fontSize: 12, color: C.textSecondary, fontFamily: F.dm, lineHeight: 18 },

  secHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 4 },
  secLabel: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 2, textTransform: "uppercase" },
  secAction: { fontSize: 11, color: C.primary, fontFamily: F.mono, fontWeight: "600" },

  card: { backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 16 },

  overdueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  overdueMonth: { fontSize: 13, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  overdueMeta: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  overdueAmt: { fontSize: 15, fontFamily: F.bebas, color: C.red, letterSpacing: 0.5 },
  overdueLabel: { fontSize: 9, color: C.red, fontFamily: F.mono, letterSpacing: 1, opacity: 0.7 },

  invoiceTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1, alignSelf: 'flex-start' },
  invoiceTypeText:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', fontFamily: F.mono, letterSpacing: 1 },

  planCard: { padding: 0 },
  planRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, paddingHorizontal: 14 },
  planLabel: { fontSize: 12, color: C.textMuted, fontFamily: F.mono },
  planVal: { fontSize: 14, fontFamily: F.bebas, color: C.textPrimary, letterSpacing: 0.5 },
  progressWrap: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: C.border },
  progressTrack: { flex: 1, height: 4, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: C.green, borderRadius: 2 },
  progressPct: { fontSize: 10, fontFamily: F.mono, color: C.green, letterSpacing: 0.5 },

  pendingBox: { flexDirection: "row", gap: 12, padding: 14 },
  pendingTitle: { fontSize: 13, fontWeight: "600", color: C.blue, fontFamily: F.dm, marginBottom: 3 },
  pendingSub: { fontSize: 11, color: C.textSecondary, fontFamily: F.dm, lineHeight: 17 },

  optionCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  optionIcon: { width: 40, height: 40, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  optionTitle: { fontSize: 13, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, marginBottom: 3 },
  optionSub: { fontSize: 11, color: C.textMuted, fontFamily: F.dm, lineHeight: 16 },

  stepDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stepLine: { width: 1.5, flex: 1, marginTop: 3 },
  stepLabel: { fontSize: 13, fontWeight: "600", fontFamily: F.dm, marginBottom: 2 },
  stepDesc: { fontSize: 11, fontFamily: F.dm, lineHeight: 16 },
});