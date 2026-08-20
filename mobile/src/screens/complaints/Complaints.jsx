// TENANT COMPLAINTS LIST SCREEN
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

const STATUS_CONFIG = {
  open: { label: "Open", color: C.red, bg: "rgba(158,58,58,0.08)" },
  under_review: { label: "Under Review", color: C.primary, bg: "rgba(44,62,80,0.06)" },
  awaiting_clarification: { label: "Needs Clarification", color: C.blue, bg: "rgba(52,152,219,0.08)" },
  approved: { label: "Approved", color: C.blue, bg: "rgba(52,152,219,0.08)" },
  resolved: { label: "Resolved", color: C.green, bg: "rgba(43,122,75,0.08)" },
  rejected: { label: "Rejected", color: C.textMuted, bg: "rgba(0,0,0,0.04)" },
  escalated: { label: "Escalated", color: C.purple, bg: "rgba(111,66,193,0.08)" },
  dismissed: { label: "Dismissed", color: C.textMuted, bg: "rgba(0,0,0,0.04)" },
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setComplaints(data.complaints || []);
      else setError(data.error || "Failed to load complaints");
    } catch (err) {
      setError("Unable to connect to server");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchComplaints(true); }, [fetchComplaints]));

  const filtered = complaints.filter(c => filter === "all" || c.status === filter);
  const needsAction = complaints.filter(c => c.status === "awaiting_clarification").length;

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* HEADER */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Complaints</Text>
          <Text style={S.headerSub}>{complaints.length} total · {needsAction} need your action</Text>
        </View>
        <TouchableOpacity style={S.newBtn} onPress={() => navigation.navigate("ComplaintNew")} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={S.newBtnText}>Log Complaint</Text>
        </TouchableOpacity>
      </View>

      {/* FILTERS */}
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
                  <Text style={{ color: C.blue, fontWeight: "800" }}> ({needsAction})</Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={S.loaderContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={S.emptyState}>
          <Feather name="wifi-off" size={30} color={C.textMuted} />
          <Text style={S.emptyTitle}>{error}</Text>
          <TouchableOpacity onPress={() => fetchComplaints()} style={S.retryBtn}>
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          {filtered.length === 0 ? (
            <View style={S.emptyState}>
              <Ionicons name="document-text-outline" size={36} color={C.textMuted} />
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
                {/* TOP ROW */}
                <View style={S.cardTop}>
                  <View style={S.cardIcon}>
                    <Ionicons name="document-text" size={16} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.cardTitle} numberOfLines={1}>{c.subject}</Text>
                    <Text style={S.cardMeta}>{timeAgo(c.created_at)}</Text>
                  </View>
                  <StatusPill status={c.status} />
                  {c.status === "awaiting_clarification" && (
                    <View style={[S.actionDot, { backgroundColor: C.blue }]} />
                  )}
                </View>

                {/* DESCRIPTION */}
                <Text style={S.cardDesc} numberOfLines={2}>{c.description}</Text>

                {/* AGAINST */}
                {c.against_name && (
                  <Text style={S.cardAgainst}>Against: {c.against_name}{c.against_unit_number ? ` (Unit ${c.against_unit_number})` : ""}</Text>
                )}
                {c.complaint_scope === "common_area" && c.common_area_location && (
                  <Text style={S.cardAgainst}>📍 {c.common_area_location}</Text>
                )}

                {/* VERDICT */}
                {c.status === "resolved" && c.resolution_notes && (
                  <View style={[S.verdictStrip, { backgroundColor: "rgba(43,122,75,0.06)", borderColor: "rgba(43,122,75,0.15)" }]}>
                    <Ionicons name="checkmark-circle" size={12} color={C.green} style={{ marginRight: 4 }} />
                    <Text style={[S.verdictText, { color: C.green }]} numberOfLines={1}>{c.resolution_notes}</Text>
                  </View>
                )}
                {c.status === "dismissed" && c.resolution_notes && (
                  <View style={[S.verdictStrip, { backgroundColor: "rgba(158,58,58,0.06)", borderColor: "rgba(158,58,58,0.15)" }]}>
                    <Ionicons name="close-circle" size={12} color={C.red} style={{ marginRight: 4 }} />
                    <Text style={[S.verdictText, { color: C.red }]} numberOfLines={1}>{c.resolution_notes}</Text>
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
  safe: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  headerSub: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 3,
  },
  newBtnText: { fontSize: 11, fontWeight: "700", color: "#ffffff", fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase" },

  filterRow: { borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  filterTab: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 3,
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: "rgba(44,62,80,0.08)", borderColor: C.primary },
  filterTabText: { fontSize: 11, fontWeight: "600", color: C.textMuted, fontFamily: F.mono, letterSpacing: 0.5 },
  filterTabTextActive: { color: C.primary },

  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.background },
  scroll: { flex: 1 },
  scrollPad: { padding: 14, gap: 10 },

  card: {
    backgroundColor: C.card, borderRadius: 6, borderWidth: 1,
    borderColor: C.border, padding: 12, gap: 6,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardIcon: {
    width: 32, height: 32, borderRadius: 6,
    backgroundColor: "rgba(44,62,80,0.1)", borderWidth: 1, borderColor: "rgba(44,62,80,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 13, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, flex: 1 },
  cardMeta: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  actionDot: { width: 7, height: 7, borderRadius: 4, position: "absolute", top: -3, right: -3 },

  cardDesc: { fontSize: 11, color: C.textSecondary, fontFamily: F.dm, lineHeight: 17 },
  cardAgainst: { fontSize: 10, color: C.primary, fontFamily: F.mono },

  verdictStrip: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 3, borderWidth: 1, padding: 6, marginTop: 2,
  },
  verdictText: { fontSize: 10, fontWeight: "600", flex: 1, fontFamily: F.mono },

  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, alignSelf: "flex-start" },
  pillText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: C.textSecondary, fontFamily: F.dm },
  emptySub: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 3,
    backgroundColor: "rgba(44,62,80,0.08)", borderWidth: 1, borderColor: "rgba(44,62,80,0.15)",
  },
  retryBtnText: { fontSize: 11, fontWeight: "600", color: C.primary, fontFamily: F.mono, letterSpacing: 0.5 },
});