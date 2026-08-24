// TENANT DASHBOARD SCREEN
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";
import { C, F } from "../styles/theme";
import LoginBriefingModal from "../components/LoginBriefingModal";

function formatAmount(amount) {
  return `R ${Number(amount || 0).toLocaleString("en-ZA")}`;
}

function firstName(fullName) {
  if (!fullName) return "Tenant";
  return fullName.split(" ")[0];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function reliabilityColor(score) {
  if (!score) return C.green;
  if (score === "reliable" || score === "Reliable") return C.green;
  if (score === "moderate_risk" || score === "Moderate Risk") return C.primary;
  return C.red;
}

function scoreLabel(score) {
  if (!score) return "Reliable";
  if (score === "reliable") return "Reliable";
  if (score === "moderate_risk") return "Moderate Risk";
  return "High Risk";
}

function scoreColor(score) {
  if (!score || score === "reliable") return C.green;
  if (score === "moderate_risk") return C.primary;
  return C.red;
}

function maintenanceStatusColor(status) {
  switch (status) {
    case "completed": case "closed": return C.green;
    case "in_progress": case "assigned": return C.blue;
    case "pending_approval": return C.purple;
    default: return C.red;
  }
}

function maintenanceStatusLabel(status) {
  switch (status) {
    case "needs_repair": return "Needs Repair";
    case "assigned": return "Assigned";
    case "in_progress": return "In Progress";
    case "completed": return "Completed";
    case "pending_approval": return "Pending Approval";
    default: return status?.replace(/_/g, " ") || "Unknown";
  }
}

function rentStatusConfig(status) {
  switch (status) {
    case "paid": return { color: C.green, bg: "rgba(43,122,75,0.08)", border: "rgba(43,122,75,0.15)", label: "Paid", icon: "checkmark-circle" };
    case "partial": return { color: C.blue, bg: "rgba(52,152,219,0.08)", border: "rgba(52,152,219,0.15)", label: "Partial", icon: "time" };
    case "pending": case "pending_approval": return { color: C.blue, bg: "rgba(52,152,219,0.08)", border: "rgba(52,152,219,0.15)", label: "Pending", icon: "hourglass" };
    case "overdue": return { color: C.red, bg: "rgba(158,58,58,0.08)", border: "rgba(158,58,58,0.15)", label: "Overdue", icon: "alert-circle" };
    case "sent": case "unpaid": return { color: C.red, bg: "rgba(158,58,58,0.08)", border: "rgba(158,58,58,0.15)", label: "Unpaid", icon: "close-circle" };
    default: return { color: C.textMuted, bg: C.surface, border: C.border, label: status || "Unknown", icon: "help-circle" };
  }
}

function SectionLabel({ title, actionLabel, onAction }) {
  return (
    <View style={S.sectionRow}>
      <Text style={S.sectionLabel}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={S.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function QuickAction({ icon, iconLibrary, label, color, bg, onPress, badge }) {
  const IconComponent =
    iconLibrary === "FontAwesome5" ? FontAwesome5 :
      iconLibrary === "Ionicons" ? Ionicons :
        iconLibrary === "Feather" ? Feather : MaterialIcons;

  return (
    <TouchableOpacity style={[S.qaCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
      <View style={S.qaIconWrap}>
        <IconComponent name={icon} size={20} color={color} />
        {badge > 0 && (
          <View style={S.qaBadge}>
            <Text style={S.qaBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[S.qaLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function TenantDashboard() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [showBriefing, setShowBriefing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("digest_shown").then(val => {
      if (val !== "true") setShowBriefing(true);
    });
  }, []);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/tenants/me/dashboard`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDashboard(data);
      } else {
        setError(data.error || "Failed to load dashboard");
      }
    } catch (err) {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchDashboard(true); }, [fetchDashboard]));

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={{ marginTop: 12, fontSize: 13, color: C.textMuted, fontFamily: F.mono }}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !dashboard) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Feather name="wifi-off" size={36} color="#cccccc" />
          <Text style={{ marginTop: 12, fontSize: 14, color: C.textSecondary, fontFamily: F.dm, textAlign: "center" }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchDashboard()} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 3, backgroundColor: "rgba(44,62,80,0.08)", borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.primary, fontFamily: F.mono }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const lease = dashboard?.lease || {};
  const currentInvoice = dashboard?.current_invoice || null;
  const paymentStats = dashboard?.payment_stats || {};
  const openMaintenance = dashboard?.open_maintenance || 0;
  const openComplaints = dashboard?.open_complaints || 0;
  const unreadMessages = dashboard?.unread_messages || 0;
  const tenantInfo = dashboard?.tenant || {};

  const scoreValue = tenantInfo?.reliability_score_value != null
    ? Number(tenantInfo.reliability_score_value)
    : null;
  const paymentHistory = {
    onTime: tenantInfo?.on_time_payments || 0,
    late: tenantInfo?.late_payments || 0,
    missed: tenantInfo?.missed_payments || 0,
    partial: tenantInfo?.partial_payments || 0,
  };
  const standing = tenantInfo?.standing || "good_standing";

  const tenantName = `${tenantInfo.first_name || ""} ${tenantInfo.last_name || ""}`.trim() || "Tenant";
  const unitNumber = lease?.unit_number || "—";
  const propertyName = lease?.property_name || "—";
  const rentAmount = lease?.rent_amount || 0;
  const dueDay = lease?.payment_due_day || 1;
  const leaseEnd = lease?.lease_end_date || null;
  const reliabilityScore = tenantInfo?.reliability_score || "reliable";

  const invoiceStatus = currentInvoice?.status || "unpaid";
  const invoiceAmount = currentInvoice?.amount_due || rentAmount;
  const remainingBalance = currentInvoice?.remaining_balance || 0;
  const billingPeriod = currentInvoice?.billing_period_start || null;
  const periodLabel = billingPeriod
    ? new Date(billingPeriod).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })
    : "Current Period";

  const rentCfg = rentStatusConfig(invoiceStatus);
  const isPaid = invoiceStatus === "paid";
  const isPartial = invoiceStatus === "partial";
  const isPending = invoiceStatus === "pending" || invoiceStatus === "pending_approval";
  const isOverdue = invoiceStatus === "overdue";
  const isUnpaid = invoiceStatus === "sent" || invoiceStatus === "unpaid";
  const needsPayment = isUnpaid || isOverdue || isPartial;

  const days = (() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (next < now) next.setMonth(next.getMonth() + 1);
    return Math.max(0, Math.ceil((next - now) / 86400000));
  })();

  const renderRentBanner = () => {
    if (isPaid) {
      return (
        <View style={S.rentBannerContent}>
          <Ionicons name="checkmark-circle" size={15} color={C.green} />
          <Text style={[S.rentBannerText, { color: C.green }]}>Rent confirmed for this month</Text>
        </View>
      );
    }
    if (isPartial) {
      return (
        <View style={S.rentBannerContent}>
          <Ionicons name="time" size={15} color={C.blue} />
          <Text style={[S.rentBannerText, { color: C.blue }]}>Partial payment. {formatAmount(remainingBalance)} remaining</Text>
        </View>
      );
    }
    if (isPending) {
      return (
        <View style={S.rentBannerContent}>
          <MaterialIcons name="pending-actions" size={15} color={C.blue} />
          <Text style={[S.rentBannerText, { color: C.blue }]}>Awaiting landlord approval</Text>
        </View>
      );
    }
    if (isOverdue) {
      return (
        <View style={S.rentBannerContent}>
          <MaterialIcons name="error" size={15} color={C.red} />
          <Text style={[S.rentBannerText, { color: C.red }]}>Payment overdue. Please pay now</Text>
        </View>
      );
    }
    if (days === 0) {
      return (
        <View style={S.rentBannerContent}>
          <MaterialIcons name="warning-amber" size={15} color={C.red} />
          <Text style={[S.rentBannerText, { color: C.red }]}>Due today</Text>
        </View>
      );
    }
    if (days === 1) {
      return (
        <View style={S.rentBannerContent}>
          <Ionicons name="time-outline" size={15} color={C.blue} />
          <Text style={[S.rentBannerText, { color: C.blue }]}>Due tomorrow</Text>
        </View>
      );
    }
    return (
      <View style={S.rentBannerContent}>
        <Ionicons name="time-outline" size={15} color={C.textMuted} />
        <Text style={[S.rentBannerText, { color: C.textMuted }]}>Due in {days} days</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(true); }} tintColor={C.primary} colors={[C.primary]} />}
      >
        <View style={S.topBar}>
          <View>
            <Text style={S.greeting}>{getGreeting()},</Text>
            <Text style={S.tenantName}>{firstName(tenantName)}</Text>
          </View>
          <TouchableOpacity style={S.bellWrap} onPress={() => navigation.navigate("Alerts")} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color={C.textPrimary} />
            {unreadMessages > 0 && (
              <View style={S.bellBadge}>
                <Text style={S.bellBadgeText}>{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={S.unitCard}>
          <View style={S.unitCardLeft}>
            <Text style={S.unitCardProperty}>{propertyName}</Text>
            <Text style={S.unitCardUnit}>Unit {unitNumber}</Text>
            {leaseEnd && <Text style={S.unitCardLease}>Lease until {new Date(leaseEnd).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</Text>}
          </View>
          <View style={[S.scorePill, { borderColor: scoreColor(reliabilityScore) }]}>
            <Text style={[S.scoreText, { color: scoreColor(reliabilityScore) }]}>
              {scoreLabel(reliabilityScore)}
              {scoreValue !== null ? ` · ${scoreValue.toFixed(1)}` : ""}
            </Text>
          </View>
        </View>

        {standing !== "good_standing" && (
          <View style={[S.alertBanner, { marginTop: 8 }]}>
            <MaterialIcons name="gavel" size={15} color={C.red} />
            <Text style={S.alertText}>
              Account standing: {standing.replace(/_/g, " ")}
              {tenantInfo?.standing_reason ? ` • ${tenantInfo.standing_reason}` : ""}
            </Text>
          </View>
        )}

        <TouchableOpacity style={S.rentCard} onPress={() => navigation.navigate("Payments")} activeOpacity={0.85}>
          <View style={S.rentTop}>
            <View>
              <Text style={S.rentCardLabel}>{periodLabel} Rent</Text>
              <Text style={S.rentCardAmount}>{formatAmount(invoiceAmount)}</Text>
              {isPartial && <Text style={{ fontSize: 10, color: C.blue, fontFamily: F.mono, marginTop: 2 }}>{formatAmount(currentInvoice?.paid_amount || 0)} paid</Text>}
            </View>
            <View style={[S.rentStatusPill, { backgroundColor: rentCfg.bg, borderColor: rentCfg.border }]}>
              <Ionicons name={rentCfg.icon} size={10} color={rentCfg.color} style={{ marginRight: 3 }} />
              <Text style={[S.rentStatusText, { color: rentCfg.color }]}>{rentCfg.label}</Text>
            </View>
          </View>
          <View style={[S.rentBanner, {
            backgroundColor: isPaid ? "rgba(43,122,75,0.06)" : isPending ? "rgba(52,152,219,0.04)" : isOverdue || isUnpaid ? "rgba(158,58,58,0.06)" : days <= 3 ? "rgba(158,58,58,0.04)" : C.surface,
          }]}>
            {renderRentBanner()}
            <MaterialIcons name="chevron-right" size={18} color="#cccccc" />
          </View>
        </TouchableOpacity>

        <View style={S.paymentHistoryCard}>
          <Text style={S.paymentHistoryTitle}>Payment History</Text>
          <View style={S.paymentHistoryRow}>
            <View style={S.paymentHistoryItem}>
              <Text style={[S.paymentHistoryValue, { color: C.green }]}>{paymentHistory.onTime}</Text>
              <Text style={S.paymentHistoryLabel}>On-time</Text>
            </View>
            <View style={S.paymentHistoryItem}>
              <Text style={[S.paymentHistoryValue, { color: C.blue }]}>{paymentHistory.late}</Text>
              <Text style={S.paymentHistoryLabel}>Late</Text>
            </View>
            <View style={S.paymentHistoryItem}>
              <Text style={[S.paymentHistoryValue, { color: C.red }]}>{paymentHistory.missed}</Text>
              <Text style={S.paymentHistoryLabel}>Missed</Text>
            </View>
            <View style={S.paymentHistoryItem}>
              <Text style={[S.paymentHistoryValue, { color: C.gold || C.primary }]}>{paymentHistory.partial}</Text>
              <Text style={S.paymentHistoryLabel}>Partial</Text>
            </View>
          </View>
        </View>

        {isOverdue && (
          <View style={S.alertBanner}>
            <MaterialIcons name="warning" size={15} color={C.red} />
            <Text style={S.alertText}>Your account may be sent to collections if payment is not made urgently.</Text>
          </View>
        )}

        <SectionLabel title="QUICK ACTIONS" />
        <View style={S.qaGrid}>
          <QuickAction icon="credit-card" iconLibrary="FontAwesome5" label="Pay Rent" color="#ffffff" bg={C.primary} onPress={() => navigation.navigate("Payments")} />
          <QuickAction icon="build" iconLibrary="MaterialIcons" label="Maintenance" color={C.textPrimary} bg={C.surface} onPress={() => navigation.navigate("Maintenance")} badge={openMaintenance} />
          <QuickAction icon="chatbubbles" iconLibrary="Ionicons" label="Messages" color={C.textPrimary} bg={C.surface} onPress={() => navigation.navigate("Messages")} badge={unreadMessages} />
          <QuickAction icon="flag" iconLibrary="MaterialIcons" label="Complaints" color={C.textPrimary} bg={C.surface} onPress={() => navigation.navigate("Complaints")} badge={openComplaints} />
        </View>

        {openMaintenance > 0 && (
          <>
            <SectionLabel title={`MAINTENANCE (${openMaintenance})`} actionLabel="View all" onAction={() => navigation.navigate("Maintenance")} />
            <View style={S.infoCard}>
              <MaterialIcons name="build" size={16} color={C.blue} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: C.textSecondary, fontFamily: F.dm, flex: 1 }}>
                You have {openMaintenance} open maintenance request{openMaintenance !== 1 ? "s" : ""}. Tap to view details.
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#cccccc" />
            </View>
          </>
        )}

        {openComplaints > 0 && (
          <View style={[S.infoCard, { marginTop: 8 }]}>
            <MaterialIcons name="flag" size={16} color={C.purple} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: C.textSecondary, fontFamily: F.dm, flex: 1 }}>
              You have {openComplaints} open complaint{openComplaints !== 1 ? "s" : ""}.
            </Text>
            <MaterialIcons name="chevron-right" size={16} color="#cccccc" />
          </View>
        )}

        <LoginBriefingModal visible={showBriefing} onClose={() => setShowBriefing(false)} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = {
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 13, color: C.textMuted, fontFamily: F.mono, marginBottom: 2 },
  tenantName: { fontSize: 22, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  bellWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  bellBadge: { position: "absolute", top: -3, right: -3, width: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  bellBadgeText: { fontSize: 10, fontWeight: "700", color: "#ffffff" },

  unitCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 16 },
  unitCardLeft: { flex: 1 },
  unitCardProperty: { fontSize: 14, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, marginBottom: 2 },
  unitCardUnit: { fontSize: 11, color: C.textMuted, fontFamily: F.mono },
  unitCardLease: { fontSize: 10, color: "#888888", fontFamily: F.mono, marginTop: 4 },
  scorePill: { borderWidth: 1.5, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { fontSize: 10, fontWeight: "700", fontFamily: F.mono, letterSpacing: 1, textTransform: "uppercase" },

  rentCard: { backgroundColor: C.surface, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 12 },
  rentTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 14 },
  rentCardLabel: { fontSize: 12, color: C.textMuted, fontFamily: F.mono, marginBottom: 4 },
  rentCardAmount: { fontSize: 24, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  rentStatusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, borderWidth: 1 },
  rentStatusText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 0.5 },
  rentBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, paddingHorizontal: 14 },
  rentBannerContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  rentBannerText: { fontSize: 11, fontWeight: "500", fontFamily: F.dm },

  paymentHistoryCard: {
    backgroundColor: C.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 12,
  },
  paymentHistoryTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#888888",
    fontFamily: F.mono,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  paymentHistoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentHistoryItem: {
    alignItems: "center",
    flex: 1,
  },
  paymentHistoryValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: F.bebas,
    letterSpacing: 1,
  },
  paymentHistoryLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontFamily: F.mono,
    marginTop: 2,
  },

  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(158,58,58,0.06)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(158,58,58,0.15)", padding: 10, marginBottom: 16 },
  alertText: { fontSize: 11, color: C.red, fontFamily: F.dm, flex: 1, lineHeight: 16 },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 8 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 2, textTransform: "uppercase" },
  sectionAction: { fontSize: 11, color: C.primary, fontWeight: "600", fontFamily: F.mono },

  qaGrid: { flexDirection: "row", gap: 8, marginBottom: 20 },
  qaCard: { flex: 1, borderRadius: 6, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: "center", gap: 8 },
  qaIconWrap: { position: "relative" },
  qaBadge: { position: "absolute", top: -6, right: -10, width: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: "center", justifyContent: "center" },
  qaBadgeText: { fontSize: 10, fontWeight: "700", color: "#ffffff" },
  qaLabel: { fontSize: 11, fontWeight: "600", fontFamily: F.dm, textAlign: "center" },

  infoCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12 },
};