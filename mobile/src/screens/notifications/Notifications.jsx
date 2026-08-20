// TENANT NOTIFICATIONS SCREEN
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, RefreshControl, ActivityIndicator, SafeAreaView
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

const TYPE_CONFIG = {
  payment_due:       { icon: "calendar-outline",       color: C.blue,       label: "Rent Due" },
  payment_received:  { icon: "checkmark-circle-outline", color: C.green,    label: "Payment" },
  payment_approved:  { icon: "checkmark-circle",       color: C.green,    label: "Approved" },
  payment_rejected:  { icon: "close-circle-outline",   color: C.red,      label: "Rejected" },
  maintenance_update:{ icon: "construct-outline",      color: C.primary,  label: "Maintenance" },
  complaint_update:  { icon: "flag-outline",           color: C.purple,   label: "Complaint" },
  lease_expiring:    { icon: "document-text-outline",  color: C.blue,     label: "Lease" },
  lease_expired:     { icon: "document-text-outline",  color: C.red,      label: "Lease" },
  message_received:  { icon: "chatbubble-outline",     color: C.blue,     label: "Message" },
  document_uploaded: { icon: "cloud-upload-outline",   color: C.blue,     label: "Document" },
  account_created:   { icon: "person-add-outline",     color: C.green,    label: "Account" },
  account_status:    { icon: "shield-outline",         color: C.purple,   label: "Account" },
  property_assigned: { icon: "home-outline",           color: C.primary,  label: "Property" },
  system:            { icon: "information-circle-outline", color: C.textMuted, label: "System" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.system;
}

function NotificationCard({ item, onPress, onMarkRead }) {
  const cfg = getTypeConfig(item.type);
  const isUnread = !item.is_read && !item.read;

  return (
    <TouchableOpacity
      style={[S.card, isUnread && S.cardUnread]}
      onPress={() => onPress(item)}
      onLongPress={() => isUnread && onMarkRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[S.cardAccent, { backgroundColor: isUnread ? cfg.color : "transparent" }]} />
      {isUnread && <View style={[S.unreadDot, { backgroundColor: cfg.color }]} />}
      <View style={[S.cardIcon, { backgroundColor: `${cfg.color}12`, borderColor: `${cfg.color}20` }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <View style={S.cardContent}>
        <View style={S.cardHeader}>
          <View style={[S.typeBadge, { backgroundColor: `${cfg.color}12`, borderColor: `${cfg.color}20` }]}>
            <Text style={[S.typeBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={S.cardTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={[S.cardTitle, isUnread && S.cardTitleUnread]} numberOfLines={2}>
          {item.title || "Notification"}
        </Text>
        {item.message_ && (
          <Text style={S.cardMessage} numberOfLines={2}>{item.message_}</Text>
        )}
      </View>
      <Feather name="chevron-right" size={14} color={C.textMuted} style={S.chevron} />
    </TouchableOpacity>
  );
}

function SectionHeader({ title, count, color }) {
  return (
    <View style={S.sectionHeader}>
      <Text style={S.sectionTitle}>{title}</Text>
      {count > 0 && (
        <View style={[S.sectionCount, { backgroundColor: `${color}15` }]}>
          <Text style={[S.sectionCountText, { color }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get("/notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Fetch notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  function onRefresh() { setRefreshing(true); fetchNotifications(); }

  function handlePress(item) {
    if (!item.is_read && !item.read) {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true, read: true } : n));
      try {
        api.put(`/notifications/${item.id}/read`);
      } catch {}
    }
    
    navigation.navigate("NotificationDetail", { notification: item });
  }

  async function handleMarkRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {}
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
    try {
      await api.put("/notifications/read-all");
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "payment", label: "Payments" },
    { key: "maintenance", label: "Maintenance" },
    { key: "complaint", label: "Complaints" },
  ];

  let displayNotifs = notifications;
  if (activeFilter === "unread") {
    displayNotifs = notifications.filter(n => !n.is_read && !n.read);
  } else if (activeFilter === "payment") {
    displayNotifs = notifications.filter(n => n.type?.includes("payment"));
  } else if (activeFilter === "maintenance") {
    displayNotifs = notifications.filter(n => n.type?.includes("maintenance"));
  } else if (activeFilter === "complaint") {
    displayNotifs = notifications.filter(n => n.type?.includes("complaint"));
  }

  const todayFiltered = displayNotifs.filter(n => (Date.now() - new Date(n.created_at).getTime()) < 24 * 3600000);
  const weekFiltered = displayNotifs.filter(n => {
    const diff = Date.now() - new Date(n.created_at).getTime();
    return diff >= 24 * 3600000 && diff < 7 * 86400000;
  });
  const olderFiltered = displayNotifs.filter(n => (Date.now() - new Date(n.created_at).getTime()) >= 7 * 86400000);

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Notifications</Text>
          <Text style={S.headerSub}>{unreadCount} unread · {notifications.length} total</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={S.markAllBtn} activeOpacity={0.7}>
            <Feather name="check" size={14} color={C.primary} />
            <Text style={S.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={S.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.key} style={[S.filterChip, activeFilter === f.key && S.filterChipActive]} onPress={() => setActiveFilter(f.key)} activeOpacity={0.7}>
              <Text style={[S.filterChipText, activeFilter === f.key && S.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={S.loader}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : displayNotifs.length === 0 ? (
        <View style={S.emptyState}>
          <View style={S.emptyIcon}><Ionicons name="notifications-off-outline" size={32} color={C.textMuted} /></View>
          <Text style={S.emptyTitle}>No notifications</Text>
          <Text style={S.emptySub}>{activeFilter !== "all" ? "Try a different filter" : "You're all caught up!"}</Text>
        </View>
      ) : (
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
          {todayFiltered.length > 0 && (
            <>
              <SectionHeader title="TODAY" count={todayFiltered.length} color={C.blue} />
              {todayFiltered.map(item => <NotificationCard key={item.id} item={item} onPress={handlePress} onMarkRead={handleMarkRead} />)}
            </>
          )}
          {weekFiltered.length > 0 && (
            <>
              <SectionHeader title="THIS WEEK" count={weekFiltered.length} color={C.primary} />
              {weekFiltered.map(item => <NotificationCard key={item.id} item={item} onPress={handlePress} onMarkRead={handleMarkRead} />)}
            </>
          )}
          {olderFiltered.length > 0 && (
            <>
              <SectionHeader title="OLDER" count={olderFiltered.length} color={C.textMuted} />
              {olderFiltered.map(item => <NotificationCard key={item.id} item={item} onPress={handlePress} onMarkRead={handleMarkRead} />)}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 22, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  headerSub: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 3, backgroundColor: "rgba(44,62,80,0.08)", borderWidth: 1, borderColor: "rgba(44,62,80,0.15)" },
  markAllText: { fontSize: 10, fontWeight: "600", color: C.primary, fontFamily: F.mono, letterSpacing: 0.5 },
  filterRow: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 8 },
  filterScroll: { paddingHorizontal: 14, gap: 6 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 3, backgroundColor: C.background, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: "rgba(44,62,80,0.08)", borderColor: C.primary },
  filterChipText: { fontSize: 11, fontWeight: "600", color: C.textMuted, fontFamily: F.mono, letterSpacing: 0.5 },
  filterChipTextActive: { color: C.primary },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.textSecondary, fontFamily: F.bebas, letterSpacing: 1 },
  emptySub: { fontSize: 12, color: C.textMuted, fontFamily: F.mono, textAlign: "center" },
  scroll: { flex: 1 },
  scrollPad: { padding: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 10 },
  sectionTitle: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 2 },
  sectionCount: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 3 },
  sectionCountText: { fontSize: 9, fontWeight: "700", fontFamily: F.mono },
  card: { flexDirection: "row", alignItems: "flex-start", backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border, marginBottom: 6, overflow: "hidden", position: "relative" },
  cardUnread: { backgroundColor: C.card, borderColor: C.border },
  cardAccent: { width: 3, position: "absolute", left: 0, top: 0, bottom: 0, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  cardIcon: { width: 38, height: 38, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1, margin: 10, marginRight: 0 },
  cardContent: { flex: 1, padding: 10, paddingLeft: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3, borderWidth: 1 },
  typeBadgeText: { fontSize: 8, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },
  cardTime: { fontSize: 9, color: C.textMuted, fontFamily: F.mono },
  cardTitle: { fontSize: 13, fontWeight: "600", color: C.textSecondary, fontFamily: F.dm, lineHeight: 18 },
  cardTitleUnread: { color: C.textPrimary },
  cardMessage: { fontSize: 11, color: C.textMuted, fontFamily: F.dm, lineHeight: 16, marginTop: 3 },
  unreadDot: { width: 7, height: 7, borderRadius: 4, position: "absolute", top: 12, right: 30 },
  chevron: { position: "absolute", right: 10, top: "50%", marginTop: -7 },
});