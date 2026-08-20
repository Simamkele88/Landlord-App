// TENANT REPAYMENT PLAN SCREEN 
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

function fmt(n) { return `R ${Number(n || 0).toLocaleString("en-ZA")}`; }
function formatDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d).slice(0, 10); }
}

function instalmentStatus(inst) {
  const today = new Date();
  const due   = new Date(inst.due_date);
  if (inst.status === "paid")    return { color: C.green, label: "Paid",    icon: "checkmark-circle" };
  if (due < today)               return { color: C.red,   label: "Overdue", icon: "alert-circle" };
  return                                { color: C.blue,   label: "Due",     icon: "time" };
}

function InstalmentRow({ inst, number, last }) {
  const cfg      = instalmentStatus(inst);
  const isPaid   = inst.status === "paid";
  const isOverdue= !isPaid && new Date(inst.due_date) < new Date();

  return (
    <View style={[S.instRow, !last && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
      {/* Number */}
      <View style={[S.instNum, { borderColor: cfg.color + "40", backgroundColor: cfg.color + "0D" }]}>
        <Text style={[S.instNumText, { color: cfg.color }]}>{String(number).padStart(2, "0")}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={S.instDue}>Due {formatDate(inst.due_date)}</Text>
        {isPaid && inst.paid_date && (
          <Text style={S.instMeta}>Paid {formatDate(inst.paid_date)}</Text>
        )}
        {isOverdue && (
          <Text style={[S.instMeta, { color: C.red }]}>Payment overdue</Text>
        )}
      </View>

      {/* Amount + status */}
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={[S.instAmt, isPaid && { color: C.green }]}>{fmt(inst.amount)}</Text>
        <View style={[S.statusPill, { backgroundColor: cfg.color + "14" }]}>
          <Ionicons name={cfg.icon} size={10} color={cfg.color} />
          <Text style={[S.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function RepaymentPlan() {
  const navigation              = useNavigation();
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plan, setPlan]         = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.get("/repayment-plans/me");
      setPlan(data.plan || null);
    } catch (err) {
      console.error("Fetch repayment plan:", err?.message || err);
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

  const pct        = plan?.progress_pct || 0;
  const paidCount  = (plan?.instalments || []).filter(i => i.status === "paid").length;
  const totalCount = (plan?.instalments || []).length;
  const nextDue    = (plan?.instalments || []).find(i => i.status !== "paid");
  const isComplete = plan?.status === "completed";
  const isPending  = plan?.status === "pending";

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Repayment Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      {!plan ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
          <Ionicons name="document-outline" size={40} color={C.textMuted} />
          <Text style={{ color: C.textMuted, fontFamily: F.mono, fontSize: 12, marginTop: 12, textAlign: "center" }}>
            No active repayment plan found.
          </Text>
          <TouchableOpacity style={S.requestBtn} onPress={() => navigation.navigate("CollectionsStatus")} activeOpacity={0.8}>
            <Text style={S.requestBtnText}>Go to Account Status</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={S.scroll}
          contentContainerStyle={S.pad}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        >
          {/* STATUS BANNER */}
          {isPending && (
            <View style={S.pendingBanner}>
              <Ionicons name="time-outline" size={16} color={C.blue} />
              <Text style={S.pendingBannerText}>Awaiting landlord approval — instalments are not yet binding.</Text>
            </View>
          )}
          {isComplete && (
            <View style={[S.pendingBanner, { backgroundColor: "rgba(43,122,75,0.08)", borderColor: "rgba(43,122,75,0.2)" }]}>
              <Ionicons name="checkmark-circle" size={16} color={C.green} />
              <Text style={[S.pendingBannerText, { color: C.green }]}>Plan complete — your account has been cleared.</Text>
            </View>
          )}

          {/* SUMMARY CARD */}
          <View style={S.summaryCard}>
            {/* Progress ring visual */}
            <View style={S.ringWrap}>
              <View style={S.ringOuter}>
                <View style={S.ringInner}>
                  <Text style={S.ringPct}>{pct}%</Text>
                  <Text style={S.ringLabel}>paid</Text>
                </View>
              </View>
              <View style={[S.ringArc, { borderColor: pct >= 100 ? C.green : C.primary }]} />
            </View>

            <View style={S.summaryRight}>
              <View style={S.sumRow}>
                <Text style={S.sumLabel}>Total</Text>
                <Text style={S.sumVal}>{fmt(plan.total_amount)}</Text>
              </View>
              <View style={[S.sumRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
                <Text style={S.sumLabel}>Paid</Text>
                <Text style={[S.sumVal, { color: C.green }]}>{fmt(plan.paid_amount)}</Text>
              </View>
              <View style={[S.sumRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
                <Text style={S.sumLabel}>Remaining</Text>
                <Text style={[S.sumVal, { color: C.red }]}>{fmt(plan.remaining)}</Text>
              </View>
              <View style={[S.sumRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
                <Text style={S.sumLabel}>Instalments</Text>
                <Text style={S.sumVal}>{paidCount}/{totalCount}</Text>
              </View>
            </View>
          </View>

          {/* PROGRESS BAR */}
          <View style={S.progressRow}>
            <View style={S.progressTrack}>
              <View style={[S.progressFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? C.green : C.primary }]} />
            </View>
            <Text style={S.progressLabel}>{pct}%</Text>
          </View>

          {/* NEXT PAYMENT */}
          {nextDue && !isComplete && (
            <>
              <View style={S.secHead}>
                <Text style={S.secLabel}>NEXT PAYMENT</Text>
              </View>
              <View style={[S.nextCard, { borderColor: C.primary + "35" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={S.nextDue}>Due {formatDate(nextDue.due_date)}</Text>
                  <Text style={S.nextSub}>Instalment {nextDue.instalment_number} of {totalCount}</Text>
                </View>
                <Text style={S.nextAmt}>{fmt(nextDue.amount)}</Text>
              </View>
            </>
          )}

          {/* INSTALMENT SCHEDULE */}
          <View style={S.secHead}>
            <Text style={S.secLabel}>PAYMENT SCHEDULE</Text>
            <Text style={S.secSub}>{paidCount} of {totalCount} paid</Text>
          </View>
          <View style={S.card}>
            {(plan.instalments || []).map((inst, i) => (
              <InstalmentRow
                key={inst.id || i}
                inst={inst}
                number={inst.instalment_number || i + 1}
                last={i === (plan.instalments.length - 1)}
              />
            ))}
          </View>

          {/* PLAN DETAILS */}
          <View style={S.secHead}>
            <Text style={S.secLabel}>PLAN DETAILS</Text>
          </View>
          <View style={S.card}>
            {[
              ["Frequency",   plan.frequency ? plan.frequency.charAt(0).toUpperCase() + plan.frequency.slice(1) : "Monthly"],
              ["Start date",  formatDate(plan.start_date)],
              ["Status",      plan.status ? plan.status.charAt(0).toUpperCase() + plan.status.replace(/_/g, " ").slice(1) : "Active"],
            ].map(([label, val], i, arr) => (
              <View key={label} style={[S.detailRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                <Text style={S.detailLabel}>{label}</Text>
                <Text style={S.detailVal}>{val}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  pad:    { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },

  pendingBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(52,152,219,0.06)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(52,152,219,0.18)", padding: 12, marginBottom: 16 },
  pendingBannerText: { flex: 1, fontSize: 12, color: C.blue, fontFamily: F.dm, lineHeight: 18 },

  summaryCard: { flexDirection: "row", gap: 14, backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 10 },
  ringWrap: { width: 80, height: 80, position: "relative", alignItems: "center", justifyContent: "center" },
  ringOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 5, borderColor: "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" },
  ringInner: { alignItems: "center" },
  ringArc: { position: "absolute", width: 76, height: 76, borderRadius: 38, borderWidth: 5, borderTopColor: "transparent", borderRightColor: "transparent", borderBottomColor: "transparent" },
  ringPct: { fontSize: 18, fontFamily: F.bebas, color: C.primary, letterSpacing: 0.5, lineHeight: 22 },
  ringLabel: { fontSize: 8, fontFamily: F.mono, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase" },
  summaryRight: { flex: 1 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5 },
  sumLabel: { fontSize: 11, color: C.textMuted, fontFamily: F.mono },
  sumVal: { fontSize: 12, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },

  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  progressTrack: { flex: 1, height: 3, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  progressLabel: { fontSize: 10, fontFamily: F.mono, color: C.textMuted, minWidth: 28 },

  secHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  secLabel: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 2, textTransform: "uppercase" },
  secSub: { fontSize: 10, color: C.textMuted, fontFamily: F.mono },

  nextCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(44,62,80,0.04)", borderRadius: 4, borderWidth: 1, padding: 14, marginBottom: 20 },
  nextDue: { fontSize: 14, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  nextSub: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  nextAmt: { fontSize: 22, fontFamily: F.bebas, color: C.primary, letterSpacing: 0.5 },

  card: { backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 20 },
  instRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  instNum: { width: 34, height: 34, borderRadius: 4, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  instNumText: { fontSize: 11, fontFamily: F.bebas, letterSpacing: 0.5 },
  instDue: { fontSize: 13, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  instMeta: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  instAmt: { fontSize: 13, fontWeight: "700", color: C.textPrimary, fontFamily: F.dm },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: "700", fontFamily: F.mono, letterSpacing: 0.5, textTransform: "uppercase" },

  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  detailLabel: { fontSize: 12, color: C.textMuted, fontFamily: F.mono },
  detailVal: { fontSize: 12, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },

  requestBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4, borderWidth: 1, borderColor: C.primary },
  requestBtnText: { fontSize: 12, color: C.primary, fontFamily: F.mono, letterSpacing: 0.5 },
});