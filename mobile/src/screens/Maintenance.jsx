// TENANT MAINTENANCE LIST SCREEN — FETCHES FROM DATABASE

import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView, RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";

// THEME COLORS
const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", successBg: "#052E16",
  warning: "#F59E0B", warningBg: "#451A03",
  danger: "#EF4444", dangerBg: "#450A0A",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

// CATEGORY CONFIG
const CATEGORIES = {
  plumbing:      { label: "Plumbing",     icon: "water",           color: "#3B82F6" },
  electrical:    { label: "Electrical",   icon: "flash",           color: "#F59E0B" },
  structural:    { label: "Structural",   icon: "business",        color: "#5c7df6" },
  appliance:     { label: "Appliance",    icon: "settings",        color: "#48ecb5" },
  hvac:          { label: "HVAC",         icon: "thermometer",     color: "#062fd4" },
  painting:      { label: "Painting",     icon: "color-palette",   color: "#84CC16" },
  cleaning:      { label: "Cleaning",     icon: "sparkles",        color: "#22C55E" },
  pest_control:  { label: "Pest Control", icon: "bug",             color: "#EF4444" },
  other:         { label: "Other",        icon: "ellipsis-horizontal", color: C.textMuted },
};

// STATUS CONFIG
const STATUS = {
  needs_repair:     { label: "Needs Repair",     color: C.danger,  bg: C.dangerBg },
  assigned:         { label: "Assigned",          color: C.primary, bg: "#1a2a3a" },
  in_progress:      { label: "In Progress",       color: C.warning, bg: C.warningBg },
  completed:        { label: "Completed",         color: C.success, bg: C.successBg },
  cancelled:        { label: "Cancelled",         color: C.textMuted, bg: C.surfaceAlt },
  pending_approval: { label: "Pending Approval",  color: C.warning, bg: C.warningBg },
};

// HELPERS
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getCat(id) {
  return CATEGORIES[id] ?? CATEGORIES.other;
}

function getStatusCfg(status) {
  return STATUS[status] ?? STATUS.needs_repair;
}

// STATUS PILL
function StatusPill({ status }) {
  const cfg = getStatusCfg(status);
  return (
    <View style={[S.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[S.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// REQUEST CARD
function RequestCard({ request, onPress }) {
  const cat = getCat(request.category);
  const latestUpdate = request.updates?.[request.updates?.length - 1];

  return (
    <TouchableOpacity style={S.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[S.cardBar, { backgroundColor: cat.color }]} />
      <View style={S.cardInner}>
        <View style={S.cardTop}>
          <View style={[S.catIcon, { backgroundColor: cat.color + "18" }]}>
            <Ionicons name={cat.icon} size={16} color={cat.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.cardTitle} numberOfLines={1}>{request.title}</Text>
            <Text style={S.cardMeta}>{timeAgo(request.created_at)}</Text>
          </View>
          <StatusPill status={request.status} />
        </View>
        <Text style={S.cardDesc} numberOfLines={2}>{request.description}</Text>
        {latestUpdate && (
          <View style={S.cardUpdate}>
            <View style={[S.updateDot, { backgroundColor: getStatusCfg(latestUpdate.status_to).color }]} />
            <Text style={S.cardUpdateText} numberOfLines={1}>{latestUpdate.notes}</Text>
            <Feather name="chevron-right" size={12} color={C.textMuted} />
          </View>
        )}
        {/* COMPLETION BANNER */}
        {request.status === "completed" && (
          <View style={[S.banner, { backgroundColor: C.successBg, borderColor: C.success + "30" }]}>
            <Ionicons name="checkmark-circle" size={13} color={C.success} />
            <Text style={[S.bannerText, { color: C.success }]}>
              Repair complete tap to confirm
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// MAIN SCREEN
const FILTERS = ["All", "Active", "Completed"];

export default function TenantMaintenance() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // FETCH FROM API
  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/maintenance`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        setError(data.error || "Failed to load requests");
      }
    } catch (err) {
      console.error("Failed to fetch maintenance requests:", err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchRequests(true);
    }, [fetchRequests])
  );

  // FILTER LOGIC
  const filtered = requests.filter(r => {
    if (filter === "All") return true;
    if (filter === "Active") return ["needs_repair", "assigned", "in_progress", "pending_approval"].includes(r.status);
    if (filter === "Completed") return ["completed", "cancelled"].includes(r.status);
    return true;
  });

  // NAVIGATE TO DETAIL
  function openDetail(request) {
    navigation.getParent()?.navigate("MaintenanceDetail", { request });
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* HEADER */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Maintenance</Text>
          <Text style={S.headerSub}>Report issues and track repairs</Text>
        </View>
        <TouchableOpacity
          style={S.newBtn}
          onPress={() => navigation.getParent()?.navigate("MaintenanceNew")}
          activeOpacity={0.8}
        >
          <Text style={S.newBtnText}>New Maintenance</Text>
        </TouchableOpacity>
      </View>

      {/* FILTERS */}
      <View style={S.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[S.filterTab, filter === f && S.filterTabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[S.filterTabText, filter === f && S.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={S.loader}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={S.emptyState}>
          <Feather name="wifi-off" size={32} color={C.textMuted} />
          <Text style={S.emptyTitle}>{error}</Text>
          <TouchableOpacity onPress={() => fetchRequests()} style={S.retryBtn}>
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={S.scroll}
          contentContainerStyle={S.scrollPad}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchRequests(); }}
              tintColor={C.primary}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={S.emptyState}>
              <View style={S.emptyIcon}>
                <Ionicons name="construct-outline" size={30} color={C.textMuted} />
              </View>
              <Text style={S.emptyTitle}>No requests</Text>
              <Text style={S.emptySub}>
                {filter === "All" 
                  ? "Tap 'New Maintenance' to report an issue" 
                  : `No ${filter.toLowerCase()} requests found`}
              </Text>
            </View>
          ) : (
            filtered.map(r => (
              <RequestCard key={r.id} request={r} onPress={() => openDetail(r)} />
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// STYLES
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: C.textPrimary },
  headerSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
  },
  newBtnText: { fontSize: 13, fontWeight: "700", color: C.white },
  filterRow: { borderBottomWidth: 1, borderBottomColor: C.border },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.primary + "20", borderColor: C.primary },
  filterTabText: { fontSize: 12, fontWeight: "600", color: C.textSecondary },
  filterTabTextActive: { color: C.primary },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollPad: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row", backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  cardBar: { width: 3 },
  cardInner: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: C.textPrimary, flex: 1 },
  cardMeta: { fontSize: 11, color: C.textMuted, marginTop: 3 },
  cardDesc: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  cardUpdate: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.surfaceAlt, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5,
  },
  updateDot: { width: 5, height: 5, borderRadius: 3 },
  cardUpdateText: { flex: 1, fontSize: 11, color: C.textSecondary },
  banner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 6, padding: 8, borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: 11, fontWeight: "600" },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 18, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.textSecondary },
  emptySub: { fontSize: 12, color: C.textMuted, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8,
    backgroundColor: C.primary + "20", borderWidth: 1, borderColor: C.primary,
  },
  retryBtnText: { fontSize: 13, fontWeight: "600", color: C.primary },
});