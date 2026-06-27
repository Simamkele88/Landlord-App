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
  orange:       "#F97316",
  purple:       "#8B5CF6",
};

const F = {
  bebas: "bebas-neue",
  dm:    "dm-sans",
  mono:  "space-mono",
};

const STATUS_CONFIG = {
  open:                   { label: "Open",               color: C.redLight,  bg: "rgba(224,90,74,0.08)" },
  under_review:           { label: "Under Review",       color: C.gold,      bg: "rgba(232,160,18,0.06)" },
  awaiting_clarification: { label: "Needs Clarification",color: C.orange,    bg: "rgba(249,115,22,0.08)" },
  approved:               { label: "Approved",           color: C.blue,      bg: "rgba(58,143,212,0.08)" },
  resolved:               { label: "Resolved",           color: C.greenLight,bg: "rgba(26,122,74,0.08)" },
  rejected:               { label: "Rejected",           color: "rgba(245,240,232,0.4)", bg: "rgba(245,240,232,0.04)" },
  escalated:              { label: "Escalated",          color: C.purple,    bg: "rgba(139,92,246,0.08)" },
  dismissed:              { label: "Dismissed",          color: "rgba(245,240,232,0.4)", bg: "rgba(245,240,232,0.04)" },
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
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      {/* HEADER */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Complaints</Text>
          <Text style={S.headerSub}>{complaints.length} total · {needsAction} need your action</Text>
        </View>
        <TouchableOpacity style={S.newBtn} onPress={() => navigation.navigate("ComplaintNew")} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color={C.black} />
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
                  <Text style={{ color: C.orange, fontWeight: "800" }}> ({needsAction})</Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={S.loaderContainer}>
          <ActivityIndicator size="large" color={C.gold} />
        </View>
      ) : error ? (
        <View style={S.emptyState}>
          <Feather name="wifi-off" size={30} color="rgba(245,240,232,0.2)" />
          <Text style={S.emptyTitle}>{error}</Text>
          <TouchableOpacity onPress={() => fetchComplaints()} style={S.retryBtn}>
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          {filtered.length === 0 ? (
            <View style={S.emptyState}>
              <Ionicons name="document-text-outline" size={36} color="rgba(245,240,232,0.15)" />
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
                    <Ionicons name="document-text" size={16} color={C.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.cardTitle} numberOfLines={1}>{c.subject}</Text>
                    <Text style={S.cardMeta}>{timeAgo(c.created_at)}</Text>
                  </View>
                  <StatusPill status={c.status} />
                  {c.status === "awaiting_clarification" && (
                    <View style={[S.actionDot, { backgroundColor: C.orange }]} />
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
                  <View style={[S.verdictStrip, { backgroundColor: "rgba(26,122,74,0.06)", borderColor: "rgba(76,186,122,0.15)" }]}>
                    <Ionicons name="checkmark-circle" size={12} color={C.greenLight} style={{ marginRight: 4 }} />
                    <Text style={[S.verdictText, { color: C.greenLight }]} numberOfLines={1}>{c.resolution_notes}</Text>
                  </View>
                )}
                {c.status === "dismissed" && c.resolution_notes && (
                  <View style={[S.verdictStrip, { backgroundColor: "rgba(224,90,74,0.06)", borderColor: "rgba(224,90,74,0.15)" }]}>
                    <Ionicons name="close-circle" size={12} color={C.redLight} style={{ marginRight: 4 }} />
                    <Text style={[S.verdictText, { color: C.redLight }]} numberOfLines={1}>{c.resolution_notes}</Text>
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
  safe: { flex: 1, backgroundColor: C.black },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  headerSub: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, marginTop: 2 },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 3,
  },
  newBtnText: { fontSize: 11, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase" },

  filterRow: { borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.muted2 },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  filterTab: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 3,
    backgroundColor: C.black, borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: "rgba(232,160,18,0.08)", borderColor: C.gold },
  filterTabText: { fontSize: 11, fontWeight: "600", color: "rgba(245,240,232,0.4)", fontFamily: F.mono, letterSpacing: 0.5 },
  filterTabTextActive: { color: C.gold },

  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.black },
  scroll: { flex: 1 },
  scrollPad: { padding: 14, gap: 10 },

  card: {
    backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1,
    borderColor: C.border, padding: 12, gap: 6,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardIcon: {
    width: 32, height: 32, borderRadius: 6,
    backgroundColor: "rgba(232,160,18,0.1)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm, flex: 1 },
  cardMeta: { fontSize: 10, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, marginTop: 2 },
  actionDot: { width: 7, height: 7, borderRadius: 4, position: "absolute", top: -3, right: -3 },

  cardDesc: { fontSize: 11, color: "rgba(245,240,232,0.4)", fontFamily: F.dm, lineHeight: 17 },
  cardAgainst: { fontSize: 10, color: C.gold, fontFamily: F.mono },

  verdictStrip: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 3, borderWidth: 1, padding: 6, marginTop: 2,
  },
  verdictText: { fontSize: 10, fontWeight: "600", flex: 1, fontFamily: F.mono },

  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, alignSelf: "flex-start" },
  pillText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "rgba(245,240,232,0.4)", fontFamily: F.dm },
  emptySub: { fontSize: 11, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 3,
    backgroundColor: "rgba(232,160,18,0.08)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)",
  },
  retryBtnText: { fontSize: 11, fontWeight: "600", color: C.gold, fontFamily: F.mono, letterSpacing: 0.5 },
});