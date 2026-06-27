// TENANT MAINTENANCE LIST SCREEN 
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView, RefreshControl,
  ActivityIndicator,
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
  purple:       "#8B5CF6",
};

const F = {
  bebas: "bebas-neue",
  dm:    "dm-sans",
  mono:  "space-mono",
};


const CATEGORIES = {
  plumbing:      { label: "Plumbing",     icon: "water",           color: C.blue },
  electrical:    { label: "Electrical",   icon: "flash",           color: C.gold },
  structural:    { label: "Structural",   icon: "business",        color: C.purple },
  appliance:     { label: "Appliance",    icon: "settings",        color: "#48ecb5" },
  hvac:          { label: "HVAC",         icon: "thermometer",     color: "#062fd4" },
  painting:      { label: "Painting",     icon: "color-palette",   color: "#84CC16" },
  cleaning:      { label: "Cleaning",     icon: "sparkles",        color: C.greenLight },
  pest_control:  { label: "Pest Control", icon: "bug",             color: C.redLight },
  other:         { label: "Other",        icon: "ellipsis-horizontal", color: "rgba(245,240,232,0.4)" },
};

const STATUS = {
  needs_repair:     { label: "Needs Repair",     color: C.redLight,  bg: "rgba(224,90,74,0.08)" },
  assigned:         { label: "Assigned",          color: C.blue,      bg: "rgba(58,143,212,0.08)" },
  in_progress:      { label: "In Progress",       color: C.gold,      bg: "rgba(232,160,18,0.06)" },
  completed:        { label: "Completed",         color: C.greenLight,bg: "rgba(26,122,74,0.08)" },
  cancelled:        { label: "Closed",            color: "rgba(245,240,232,0.4)", bg: "rgba(245,240,232,0.04)" },
  pending_approval: { label: "Pending Approval",  color: C.gold,      bg: "rgba(232,160,18,0.06)" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getCat(id) { return CATEGORIES[id] ?? CATEGORIES.other; }
function getStatusCfg(status) { return STATUS[status] ?? STATUS.needs_repair; }

function StatusPill({ status }) {
  const cfg = getStatusCfg(status);
  return (
    <View style={[S.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[S.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function RequestCard({ request, onPress }) {
  const cat = getCat(request.category);
  const latestUpdate = request.updates?.[request.updates?.length - 1];

  return (
    <TouchableOpacity style={S.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[S.cardBar, { backgroundColor: cat.color }]} />
      <View style={S.cardInner}>
        <View style={S.cardTop}>
          <View style={[S.catIcon, { backgroundColor: cat.color + "15", borderColor: cat.color + "25" }]}>
            <Ionicons name={cat.icon} size={15} color={cat.color} />
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
            <Feather name="chevron-right" size={11} color="rgba(245,240,232,0.25)" />
          </View>
        )}
        {request.status === "completed" && (
          <View style={[S.banner, { backgroundColor: "rgba(26,122,74,0.06)", borderColor: "rgba(76,186,122,0.15)" }]}>
            <Ionicons name="checkmark-circle" size={13} color={C.greenLight} />
            <Text style={[S.bannerText, { color: C.greenLight }]}>Repair complete — tap to confirm</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const FILTERS = ["All", "Active", "Completed"];

export default function TenantMaintenance() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/maintenance`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setRequests(data.requests || []);
      else setError(data.error || "Failed to load requests");
    } catch (err) {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchRequests(true); }, [fetchRequests]));

  const filtered = requests.filter(r => {
    if (filter === "All") return true;
    if (filter === "Active") return ["needs_repair", "assigned", "in_progress", "pending_approval"].includes(r.status);
    if (filter === "Completed") return ["completed", "cancelled"].includes(r.status);
    return true;
  });

  function openDetail(request) {
    navigation.getParent()?.navigate("MaintenanceDetail", { request });
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

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
          <Ionicons name="add" size={16} color={C.black} />
          <Text style={S.newBtnText}>New Request</Text>
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
          <ActivityIndicator size="large" color={C.gold} />
        </View>
      ) : error ? (
        <View style={S.emptyState}>
          <Feather name="wifi-off" size={30} color="rgba(245,240,232,0.2)" />
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
              tintColor={C.gold}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={S.emptyState}>
              <View style={S.emptyIcon}>
                <Ionicons name="construct-outline" size={28} color="rgba(245,240,232,0.2)" />
              </View>
              <Text style={S.emptyTitle}>No requests</Text>
              <Text style={S.emptySub}>
                {filter === "All" ? "Tap 'New Request' to report an issue" : `No ${filter.toLowerCase()} requests found`}
              </Text>
            </View>
          ) : (
            filtered.map(r => <RequestCard key={r.id} request={r} onPress={() => openDetail(r)} />)
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
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.muted2,
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

  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.black },
  scroll: { flex: 1 },
  scrollPad: { padding: 14, gap: 10 },

  card: {
    flexDirection: "row", backgroundColor: C.muted2,
    borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  cardBar: { width: 3 },
  cardInner: { flex: 1, padding: 12, gap: 6 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  catIcon: {
    width: 32, height: 32, borderRadius: 6,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  cardTitle: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm, flex: 1 },
  cardMeta: { fontSize: 10, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, marginTop: 2 },
  cardDesc: { fontSize: 11, color: "rgba(245,240,232,0.4)", fontFamily: F.dm, lineHeight: 17 },
  cardUpdate: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.black, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  updateDot: { width: 5, height: 5, borderRadius: 3 },
  cardUpdateText: { flex: 1, fontSize: 10, color: "rgba(245,240,232,0.35)", fontFamily: F.mono },
  banner: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 3, padding: 6, borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: 10, fontWeight: "600", fontFamily: F.dm },

  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, alignSelf: "flex-start" },
  pillText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 8, backgroundColor: C.muted2,
    borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "rgba(245,240,232,0.4)", fontFamily: F.dm },
  emptySub: { fontSize: 11, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 3,
    backgroundColor: "rgba(232,160,18,0.08)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)",
  },
  retryBtnText: { fontSize: 11, fontWeight: "600", color: C.gold, fontFamily: F.mono, letterSpacing: 0.5 },
});