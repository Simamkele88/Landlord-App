import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../utils/api";

const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", successBg: "#052E16",
  warning: "#F59E0B", warningBg: "#451A03",
  danger: "#EF4444", dangerBg: "#450A0A",
  orange: "#F97316", orangeBg: "#431407",
  purple: "#A855F7", purpleBg: "#2D1B4E",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

const STATUS_CONFIG = {
  open: { label: "Open", color: C.danger, bg: C.dangerBg },
  under_review: { label: "Under Review", color: C.warning, bg: C.warningBg },
  awaiting_clarification: { label: "Needs Clarification", color: C.orange, bg: C.orangeBg },
  approved: { label: "Approved", color: C.primary, bg: "#1e3a5f" },
  resolved: { label: "Resolved", color: C.success, bg: C.successBg },
  rejected: { label: "Rejected", color: C.textMuted, bg: C.surfaceAlt },
  escalated: { label: "Escalated", color: C.purple, bg: C.purpleBg },
  dismissed: { label: "Dismissed", color: C.textMuted, bg: C.surfaceAlt },
};

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Under Review", value: "under_review" },
  { label: "Needs You", value: "awaiting_clarification" },
  { label: "Escalated", value: "escalated" },
  { label: "Resolved", value: "resolved" },
  { label: "Dismissed", value: "dismissed" },
];

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <View style={[S.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[S.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const seconds = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function TenantComplaints() {
  const navigation = useNavigation();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchComplaints = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/complaints/my`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setComplaints(data.complaints || []);
      } else {
        setError(data.error || "Failed to load complaints");
      }
    } catch (err) {
      console.error("Fetch complaints error:", err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints(true);
    }, [fetchComplaints])
  );

  const filtered = complaints.filter(c => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const needsAction = complaints.filter(c => c.status === "awaiting_clarification").length;

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Complaints</Text>
          <Text style={S.headerSub}>
            {complaints.length} total · {needsAction} need your action
          </Text>
        </View>
        <TouchableOpacity
          style={S.newBtn}
          onPress={() => navigation.navigate("ComplaintNew")}
          activeOpacity={0.8}
        >
          <Text style={S.newBtnText}>New Complaint</Text>
        </TouchableOpacity>
      </View>

      <View style={S.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[S.filterTab, filter === f.value && S.filterTabActive]}
              onPress={() => setFilter(f.value)}
              activeOpacity={0.75}
            >
              <Text style={[S.filterTabText, filter === f.value && S.filterTabTextActive]}>
                {f.label}
                {f.value === "awaiting_clarification" && needsAction > 0 && (
                  <Text style={{ color: C.orange, fontWeight: "800" }}> ({needsAction})</Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={S.loaderContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={S.emptyState}>
          <Feather name="wifi-off" size={32} color={C.textMuted} />
          <Text style={S.emptyTitle}>{error}</Text>
          <TouchableOpacity onPress={() => fetchComplaints()} style={S.retryBtn}>
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          {filtered.length === 0 ? (
            <View style={S.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={C.textMuted} />
              <Text style={S.emptyTitle}>No complaints</Text>
              <Text style={S.emptySub}>
                {filter === "all" ? "Tap 'Log Complaint' to submit a complaint" : `No ${filter.replace(/_/g, " ")} complaints`}
              </Text>
            </View>
          ) : (
            filtered.map(c => (
              <TouchableOpacity
                key={c.id}
                style={S.card}
                onPress={() => navigation.navigate("ComplaintDetail", { complaintId: c.id, complaint: c })}
                activeOpacity={0.8}
              >
                <View style={S.cardTop}>
                  <View style={S.cardIcon}>
                    <Ionicons name="document-text" size={18} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.cardTitle} numberOfLines={1}>{c.subject}</Text>
                    <Text style={S.cardMeta}>{timeAgo(c.created_at)} </Text>
                  </View>
                  <StatusPill status={c.status} />
                  {c.status === "awaiting_clarification" && (
                    <View style={[S.actionDot, { backgroundColor: C.orange }]} />
                  )}
                </View>
                <Text style={S.cardDesc} numberOfLines={2}>{c.description}</Text>
                {c.against_name && (
                  <Text style={S.cardAgainst}>Against: {c.against_name}{c.against_unit_number ? ` (Unit ${c.against_unit_number})` : ""}</Text>
                )}
                {c.complaint_scope === "common_area" && c.common_area_location && (
                  <Text style={S.cardAgainst}>📍 {c.common_area_location}</Text>
                )}
                {c.status === "resolved" && c.resolution_notes && (
                  <View style={[S.verdictStrip, { backgroundColor: C.successBg }]}>
                    <Ionicons name="checkmark-circle" size={12} color={C.success} style={{ marginRight: 4 }} />
                    <Text style={[S.verdictText, { color: C.success }]} numberOfLines={1}>
                      {c.resolution_notes}
                    </Text>
                  </View>
                )}
                {c.status === "dismissed" && c.resolution_notes && (
                  <View style={[S.verdictStrip, { backgroundColor: C.dangerBg }]}>
                    <Ionicons name="close-circle" size={12} color={C.danger} style={{ marginRight: 4 }} />
                    <Text style={[S.verdictText, { color: C.danger }]} numberOfLines={1}>
                      {c.resolution_notes}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 22, fontWeight: "800", color: C.textPrimary },
  headerSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  newBtnText: { fontSize: 13, fontWeight: "700", color: C.white },
  filterRow: { borderBottomWidth: 1, borderBottomColor: C.border },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  filterTabActive: { backgroundColor: C.primary + "20", borderColor: C.primary },
  filterTabText: { fontSize: 12, fontWeight: "600", color: C.textSecondary },
  filterTabTextActive: { color: C.primary },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollPad: { padding: 16, gap: 12 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: C.textPrimary, flex: 1 },
  cardMeta: { fontSize: 11, color: C.textMuted, marginTop: 3 },
  actionDot: { width: 8, height: 8, borderRadius: 4, position: "absolute", top: -4, right: -4 },
  cardDesc: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  cardAgainst: { fontSize: 11, color: C.warning },
  verdictStrip: { flexDirection: "row", alignItems: "center", borderRadius: 6, padding: 8, marginTop: 4 },
  verdictText: { fontSize: 11, fontWeight: "600", flex: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.textSecondary },
  emptySub: { fontSize: 12, color: C.textMuted, textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: C.primary + "20", borderWidth: 1, borderColor: C.primary },
  retryBtnText: { fontSize: 13, fontWeight: "600", color: C.primary },
});