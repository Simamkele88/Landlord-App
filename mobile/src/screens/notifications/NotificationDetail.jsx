// TENANT NOTIFICATION DETAIL SCREEN 
import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";

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
const F = { bebas: "bebas-neue", dm: "dm-sans", mono: "space-mono" };

function formatDateTime(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return String(d); }
}

function timeAgo(d) {
  if (!d) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

const TYPE_CONFIG = {
  payment_due:       { icon: "calendar-outline",       color: C.blue,       label: "Rent Due" },
  payment_received:  { icon: "checkmark-circle-outline", color: C.greenLight, label: "Payment" },
  payment_approved:  { icon: "checkmark-circle",       color: C.greenLight, label: "Approved" },
  payment_rejected:  { icon: "close-circle-outline",   color: C.redLight,   label: "Rejected" },
  maintenance_update:{ icon: "construct-outline",      color: C.gold,       label: "Maintenance" },
  complaint_update:  { icon: "flag-outline",           color: C.purple,     label: "Complaint" },
  lease_expiring:    { icon: "document-text-outline",  color: C.orange,     label: "Lease" },
  lease_expired:     { icon: "document-text-outline",  color: C.redLight,   label: "Lease" },
  message_received:  { icon: "chatbubble-outline",     color: C.blue,       label: "Message" },
  document_uploaded: { icon: "cloud-upload-outline",   color: C.blue,       label: "Document" },
  account_created:   { icon: "person-add-outline",     color: C.greenLight, label: "Account" },
  account_status:    { icon: "shield-outline",         color: C.purple,     label: "Account" },
  system:            { icon: "information-circle-outline", color: "rgba(245,240,232,0.4)", label: "System" },
};

export default function NotificationDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const notification = route.params?.notification;

  if (!notification) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
          <Text style={S.headerTitle}>Notification</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={S.center}>
          <Ionicons name="notifications-off-outline" size={40} color="rgba(245,240,232,0.15)" />
          <Text style={S.emptyText}>Notification not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[S.headerIcon, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}25` }]}>
            <Ionicons name={cfg.icon} size={16} color={cfg.color} />
          </View>
          <Text style={S.headerTitle}>{cfg.label}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* TYPE BADGE */}
        <View style={[S.typeBanner, { backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}15` }]}>
          <View style={[S.typeIcon, { backgroundColor: cfg.color }]}>
            <Ionicons name={cfg.icon} size={28} color={C.white} />
          </View>
          <Text style={[S.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={S.typeTime}>{timeAgo(notification.created_at)}</Text>
        </View>

        {/* TITLE */}
        <View style={S.titleCard}>
          <Text style={S.titleText}>{notification.title || "Notification"}</Text>
        </View>

        {/* MESSAGE */}
        {notification.message_ ? (
          <View style={S.messageCard}>
            <Text style={S.messageLabel}>MESSAGE</Text>
            <Text style={S.messageText}>{notification.message_}</Text>
          </View>
        ) : null}

        {/* METADATA */}
        <View style={S.metaCard}>
          <Text style={S.metaTitle}>DETAILS</Text>
          {[
            ["Type", cfg.label],
            ["Status", notification.is_read || notification.read ? "Read" : "Unread"],
            ["Received", formatDateTime(notification.created_at)],
            ["Read At", notification.read_at ? formatDateTime(notification.read_at) : "Not yet read"],
            ["Reference", notification.related_entity_id ? String(notification.related_entity_id).slice(0, 8) + "..." : "—"],
            ["Category", (notification.type || "system").replace(/_/g, " ")],
          ].map(([label, val]) => (
            <View key={label} style={S.metaRow}>
              <Text style={S.metaLabel}>{label}</Text>
              <Text style={S.metaValue}>{val}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={S.footer}>
        <TouchableOpacity style={S.btnGhost} onPress={() => navigation.goBack()}>
          <Text style={S.btnGhostText}>Close</Text>
        </TouchableOpacity>
        {!notification.is_read && !notification.read && (
          <TouchableOpacity style={S.btnGold} onPress={() => Alert.alert("Read", "Notification marked as read.")}>
            <Ionicons name="checkmark" size={14} color={C.black} />
            <Text style={S.btnGoldText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: "rgba(245,240,232,0.3)", fontSize: 14, fontFamily: F.mono },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border },
  headerIcon: { width: 30, height: 30, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollPad: { padding: 16, gap: 12 },

  typeBanner: { borderRadius: 8, borderWidth: 1, padding: 24, alignItems: "center", marginBottom: 4 },
  typeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  typeLabel: { fontSize: 16, fontWeight: "700", fontFamily: F.bebas, letterSpacing: 1, marginBottom: 4 },
  typeTime: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },

  titleCard: { backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border, padding: 14 },
  titleText: { fontSize: 15, fontWeight: "600", color: C.white, fontFamily: F.dm, lineHeight: 22 },

  messageCard: { backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  messageLabel: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)", fontFamily: F.mono, letterSpacing: 2, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  messageText: { fontSize: 14, color: "rgba(245,240,232,0.6)", fontFamily: F.dm, lineHeight: 22, paddingHorizontal: 14, paddingBottom: 14 },

  metaCard: { backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  metaTitle: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)", fontFamily: F.mono, letterSpacing: 2, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  metaRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  metaLabel: { fontSize: 11, color: "rgba(245,240,232,0.4)", fontFamily: F.mono },
  metaValue: { fontSize: 11, fontWeight: "600", color: C.white, fontFamily: F.dm },

  footer: { flexDirection: "row", gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.muted2 },
  btnGhost: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 3, borderWidth: 1, borderColor: C.border },
  btnGhostText: { fontSize: 13, fontWeight: "600", color: "rgba(245,240,232,0.5)", fontFamily: F.dm },
  btnGold: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.gold, borderRadius: 3, paddingVertical: 13 },
  btnGoldText: { fontSize: 13, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
});