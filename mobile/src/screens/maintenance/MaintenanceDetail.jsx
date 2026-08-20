// MAINTENANCE DETAIL SCREEN
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, ActivityIndicator,
  Image, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { uploadImages } from "../../utils/upload";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

const STATUS = {
  needs_repair:     { label: "Needs Repair",     color: C.red,     bg: "rgba(158,58,58,0.08)", icon: "alert-circle" },
  assigned:         { label: "Assigned",          color: C.blue,   bg: "rgba(52,152,219,0.08)", icon: "person" },
  in_progress:      { label: "In Progress",       color: C.primary,bg: "rgba(44,62,80,0.06)", icon: "time" },
  completed:        { label: "Completed",         color: C.green,  bg: "rgba(43,122,75,0.08)", icon: "checkmark-circle" },
  closed:           { label: "Closed",            color: C.textMuted, bg: "rgba(0,0,0,0.04)", icon: "lock-closed" },
  cancelled:        { label: "Cancelled",         color: C.textMuted, bg: "rgba(0,0,0,0.04)", icon: "close-circle" },
  pending_approval: { label: "Pending Approval",  color: C.purple, bg: "rgba(111,66,193,0.06)", icon: "hourglass" },
};

const PRIORITY = {
  low:       { color: C.blue,    bg: "rgba(52,152,219,0.1)" },
  medium:    { color: C.primary, bg: "rgba(44,62,80,0.1)" },
  high:      { color: C.primary, bg: "rgba(44,62,80,0.1)" },
  urgent:    { color: C.red,     bg: "rgba(158,58,58,0.12)" },
  emergency: { color: "#ffffff", bg: "rgba(158,58,58,0.2)" },
};

const CATEGORIES = {
  plumbing:      { label: "Plumbing",     icon: "water",           color: C.blue },
  electrical:    { label: "Electrical",   icon: "flash",           color: C.primary },
  structural:    { label: "Structural",   icon: "business",        color: C.purple },
  appliance:     { label: "Appliance",    icon: "settings",        color: C.green },
  hvac:          { label: "HVAC",         icon: "thermometer",     color: C.blue },
  painting:      { label: "Painting",     icon: "color-palette",   color: C.primary },
  cleaning:      { label: "Cleaning",     icon: "sparkles",        color: C.green },
  pest_control:  { label: "Pest Control", icon: "bug",             color: C.red },
  other:         { label: "Other",        icon: "ellipsis-horizontal", color: C.textMuted },
};

function getCat(id) { return CATEGORIES[id] ?? CATEGORIES.other; }
function getFullUrl(url) { if (!url) return ""; if (url.startsWith("http")) return url; return `${api.getBaseUrl()}${url}`; }
function fmtDate(d) { if (!d) return ""; return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }); }
function fmtAmount(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }

function StatusPill({ status }) {
  const cfg = STATUS[status] ?? STATUS.needs_repair;
  return (
    <View style={[S.pill, { backgroundColor: cfg.bg, borderColor: cfg.color + "30", borderWidth: 1 }]}>
      <Ionicons name={cfg.icon} size={10} color={cfg.color} />
      <Text style={[S.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY[priority] || PRIORITY.medium;
  return (
    <View style={[S.priorityBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + "30" }]}>
      <Text style={[S.priorityText, { color: cfg.color }]}>{priority}</Text>
    </View>
  );
}

function ImageViewer({ visible, imageUrl, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={S.viewerOverlay}>
        <TouchableOpacity style={S.viewerClose} onPress={onClose}>
          <Feather name="x" size={26} color="#ffffff" />
        </TouchableOpacity>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={S.viewerImage} resizeMode="contain" /> : null}
      </View>
    </Modal>
  );
}

export default function MaintenanceDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const requestId = route.params?.request?.id || route.params?.requestId;

  const [request, setRequest] = useState(route.params?.request || null);
  const [loading, setLoading] = useState(!request);
  const [confirming, setConfirming] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [confirmPhotos, setConfirmPhotos] = useState([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");

  const fetchRequest = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/maintenance/${requestId}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setRequest(data.request || data);
      else Alert.alert("Error", data.error || "Failed to load request");
    } catch (err) { Alert.alert("Error", "Unable to load request details"); }
    finally { setLoading(false); }
  }, [requestId]);

  useEffect(() => { if (!request) fetchRequest(); }, [fetchRequest]);

  async function pickConfirmPhoto() {
    if (confirmPhotos.length >= 3) { Alert.alert("Limit", "Maximum 3 photos"); return; }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission Required", "Gallery permission is needed."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.8,
      allowsMultipleSelection: true, selectionLimit: 3 - confirmPhotos.length,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setConfirmPhotos(prev => [...prev, ...result.assets].slice(0, 3));
    }
  }

  function removeConfirmPhoto(index) { setConfirmPhotos(prev => prev.filter((_, i) => i !== index)); }

  async function handleConfirm() {
    setConfirming(true);
    try {
      let uploadedPhotos = [];
      if (confirmPhotos.length > 0) uploadedPhotos = await uploadImages(confirmPhotos);
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/maintenance/${request.id}/confirm`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ photos: uploadedPhotos.map(p => ({ ...p, photo_type: "after" })) }),
      });
      const data = await response.json();
      if (response.ok) Alert.alert("Request Closed", "Thank you for confirming. The request has been closed.", [{ text: "OK", onPress: () => navigation.goBack() }]);
      else throw new Error(data.error || "Confirmation failed");
    } catch (err) { Alert.alert("Error", err.message || "Failed to confirm"); }
    finally { setConfirming(false); }
  }

  function handleReopen() {
    Alert.alert(
      "Reopen Request?",
      "This will notify the caretaker that the issue needs attention again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reopen",
          style: "destructive",
          onPress: async () => {
            setReopening(true);
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${api.getBaseUrl()}/maintenance/${request.id}/reopen`, {
                method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason: "Tenant reopened — issue not resolved or has returned" }),
              });
              const data = await response.json();
              if (response.ok) Alert.alert("Reopened", "The caretaker has been notified.", [{ text: "OK", onPress: () => fetchRequest() }]);
              else throw new Error(data.error || "Failed");
            } catch (err) { Alert.alert("Error", err.message || "Failed"); }
            finally { setReopening(false); }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={S.loaderText}>Loading request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.center}>
          <Feather name="alert-circle" size={40} color={C.textMuted} />
          <Text style={S.emptyText}>Request not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={S.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cat = getCat(request.category);
  const isCompleted = request.status === "completed";
  const isClosed = request.status === "closed";
  const isCancelled = request.status === "cancelled";
  const isPendingApproval = request.status === "pending_approval";
  const isResolved = isClosed || isCancelled;
  const photos = request.photos || [];
  const beforePhotos = photos.filter(p => p.photo_type === 'before' || !p.photo_type);
  const afterPhotos = photos.filter(p => p.photo_type === 'after');

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <ImageViewer visible={viewerVisible} imageUrl={viewerUrl} onClose={() => { setViewerVisible(false); setViewerUrl(""); }} />

      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Request Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>

        {isPendingApproval && (
          <View style={[S.infoBox, { backgroundColor: "rgba(111,66,193,0.06)", borderColor: "rgba(111,66,193,0.15)", marginBottom: 16 }]}>
            <Ionicons name="hourglass" size={16} color={C.purple} style={{ marginRight: 8 }} />
            <Text style={[S.body, { color: C.purple, flex: 1, fontSize: 12 }]}>Awaiting landlord approval. You'll be notified when a decision is made.</Text>
          </View>
        )}

        <View style={S.statusRow}>
          <View style={[S.catIcon, { backgroundColor: cat.color + "15", borderColor: cat.color + "25" }]}>
            <Ionicons name={cat.icon} size={16} color={cat.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.title}>{request.title}</Text>
            <View style={S.metaRow}>
              <Text style={S.meta}>{cat.label}</Text>
              <Text style={S.metaDot}>·</Text>
              <Text style={S.meta}>{request.request_number}</Text>
              <Text style={S.metaDot}>·</Text>
              <Text style={S.meta}>{fmtDate(request.created_at)}</Text>
            </View>
          </View>
          <StatusPill status={request.status} />
        </View>

        <PriorityBadge priority={request.priority} />

        <Text style={S.sectionLabel}>DESCRIPTION</Text>
        <View style={S.descriptionBox}>
          <Text style={S.body}>{request.description}</Text>
        </View>

        {beforePhotos.length > 0 && (
          <>
            <Text style={S.sectionLabel}>BEFORE PHOTOS ({beforePhotos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.photoScroll}>
              {beforePhotos.map((photo, idx) => (
                <TouchableOpacity key={photo.id || idx} onPress={() => { setViewerUrl(getFullUrl(photo.document_url)); setViewerVisible(true); }} style={S.photoThumb} activeOpacity={0.9}>
                  <Image source={{ uri: getFullUrl(photo.document_url) }} style={S.photoImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {afterPhotos.length > 0 && (
          <>
            <Text style={[S.sectionLabel, { color: C.green }]}>AFTER PHOTOS ({afterPhotos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.photoScroll}>
              {afterPhotos.map((photo, idx) => (
                <TouchableOpacity key={photo.id || idx} onPress={() => { setViewerUrl(getFullUrl(photo.document_url)); setViewerVisible(true); }} style={[S.photoThumb, { borderColor: "rgba(43,122,75,0.3)", borderWidth: 1 }]} activeOpacity={0.9}>
                  <Image source={{ uri: getFullUrl(photo.document_url) }} style={S.photoImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {photos.length === 0 && (
          <View style={[S.infoBox, { backgroundColor: C.card, borderColor: C.border, marginTop: 8 }]}>
            <Feather name="camera-off" size={15} color={C.textMuted} style={{ marginRight: 8 }} />
            <Text style={[S.body, { color: C.textMuted, flex: 1 }]}>No photos attached to this request.</Text>
          </View>
        )}

        {request.completion_notes && (
          <>
            <Text style={S.sectionLabel}>COMPLETION NOTES</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(43,122,75,0.06)", borderColor: "rgba(43,122,75,0.15)" }]}>
              <Ionicons name="checkmark-circle" size={15} color={C.green} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.green, flex: 1 }]}>{request.completion_notes}</Text>
            </View>
          </>
        )}

        {isResolved && (
          <>
            <Text style={S.sectionLabel}>STATUS</Text>
            <View style={[S.infoBox, { 
              backgroundColor: isCancelled ? "rgba(158,58,58,0.04)" : "rgba(0,0,0,0.03)", 
              borderColor: isCancelled ? "rgba(158,58,58,0.12)" : C.border 
            }]}>
              <Ionicons 
                name={isCancelled ? "close-circle" : "checkmark-circle"} 
                size={15} 
                color={isCancelled ? C.red : C.textMuted} 
                style={{ marginRight: 8 }} 
              />
              <Text style={[S.body, { color: isCancelled ? C.red : C.textMuted, flex: 1 }]}>
                {isCancelled 
                  ? "This request has been cancelled. You can reopen it if the issue persists."
                  : "This request has been closed. You can reopen it if the issue returns."}
              </Text>
            </View>
          </>
        )}

        {request.contractor_name && (
          <>
            <Text style={S.sectionLabel}>CONTRACTOR</Text>
            <View style={S.contractorCard}>
              <View style={S.contractorAvatar}>
                <Ionicons name="person" size={18} color={C.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.contractorName}>{request.contractor_name}</Text>
                {request.contractor_phone && <Text style={S.contractorPhone}>{request.contractor_phone}</Text>}
              </View>
              {request.scheduled_date && (
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={S.scheduledLabel}>Scheduled</Text>
                  <Text style={S.scheduledDate}>{fmtDate(request.scheduled_date)}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {(request.estimated_cost || request.actual_cost) && (
          <>
            <Text style={S.sectionLabel}>COST</Text>
            <View style={S.costRow}>
              {request.estimated_cost ? (
                <View style={S.costBox}>
                  <Text style={S.costLabel}>Estimated</Text>
                  <Text style={S.costAmount}>{fmtAmount(request.estimated_cost)}</Text>
                </View>
              ) : null}
              {request.actual_cost ? (
                <View style={[S.costBox, { borderColor: "rgba(43,122,75,0.2)" }]}>
                  <Text style={S.costLabel}>Actual</Text>
                  <Text style={[S.costAmount, { color: C.green }]}>{fmtAmount(request.actual_cost)}</Text>
                </View>
              ) : null}
            </View>
          </>
        )}

        {request.updates && request.updates.length > 0 && (
          <>
            <Text style={S.sectionLabel}>TIMELINE</Text>
            {request.updates.map((u, idx) => {
              const toCfg = STATUS[u.status_to] ?? STATUS.needs_repair;
              const fromCfg = u.status_from ? STATUS[u.status_from] : null;
              const isLast = idx === request.updates.length - 1;
              return (
                <View key={idx} style={S.tlRow}>
                  <View style={S.tlLeft}>
                    <View style={[S.tlDot, { backgroundColor: toCfg.bg, borderColor: toCfg.color }]}>
                      <Ionicons name={toCfg.icon} size={8} color={toCfg.color} />
                    </View>
                    {!isLast && <View style={S.tlLine} />}
                  </View>
                  <View style={S.tlBody}>
                    <View style={S.tlHeader}>
                      <Text style={[S.tlStatus, { color: toCfg.color }]}>{toCfg.label}</Text>
                      {fromCfg && (
                        <Text style={S.tlFrom}>from {fromCfg.label}</Text>
                      )}
                      <Text style={S.tlTime}>{fmtDate(u.created_at)}</Text>
                    </View>
                    {u.notes && <Text style={S.tlNote}>{u.notes}</Text>}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {isCompleted && (
          <>
            <Text style={S.sectionLabel}>CONFIRM COMPLETION</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(52,152,219,0.06)", borderColor: "rgba(52,152,219,0.15)" }]}>
              <Ionicons name="information-circle" size={15} color={C.blue} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.blue, flex: 1, fontSize: 12 }]}>
                Is the issue resolved? Confirm to close this request, or reopen if you're not satisfied.
              </Text>
            </View>

            {confirmPhotos.length > 0 && (
              <View style={S.confirmPhotoRow}>
                {confirmPhotos.map((img, idx) => (
                  <View key={idx} style={S.confirmPhotoWrap}>
                    <Image source={{ uri: img.uri }} style={S.confirmPhoto} />
                    <TouchableOpacity style={S.removePhotoBtn} onPress={() => removeConfirmPhoto(idx)}>
                      <Feather name="x" size={10} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {confirmPhotos.length < 3 && (
              <TouchableOpacity style={S.addPhotoBtn} onPress={pickConfirmPhoto} activeOpacity={0.8}>
                <Feather name="camera" size={15} color={C.primary} />
                <Text style={S.addPhotoText}>Add photo (optional)</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {(isCompleted || isResolved) && (
        <View style={S.footer}>
          {isResolved && (
            <TouchableOpacity style={S.btnReopen} onPress={handleReopen} disabled={reopening} activeOpacity={0.85}>
              {reopening ? <ActivityIndicator color="#ffffff" size="small" /> : (
                <><Ionicons name="refresh" size={16} color="#ffffff" /><Text style={S.btnReopenText}>Reopen</Text></>
              )}
            </TouchableOpacity>
          )}
          {isCompleted && (
            <TouchableOpacity style={S.btnConfirm} onPress={handleConfirm} disabled={confirming} activeOpacity={0.85}>
              {confirming ? <ActivityIndicator color="#ffffff" size="small" /> : (
                <><Ionicons name="checkmark-circle" size={16} color="#ffffff" /><Text style={S.btnConfirmText}>Confirm & Close</Text></>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loaderText: { fontSize: 13, color: C.textMuted, fontFamily: F.mono },
  emptyText: { fontSize: 15, color: C.textSecondary, fontFamily: F.dm },
  backLink: { fontSize: 13, color: C.primary, fontWeight: "600", fontFamily: F.mono, marginTop: 6 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollPad: { padding: 16, paddingBottom: 100 },

  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  catIcon: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 15, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, marginBottom: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3, flexWrap: "wrap" },
  meta: { fontSize: 10, color: C.textMuted, fontFamily: F.mono },
  metaDot: { fontSize: 10, color: C.textMuted, marginHorizontal: 2 },

  priorityBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1, marginBottom: 18 },
  priorityText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 0.5 },

  sectionLabel: {
    fontSize: 10, fontWeight: "700", color: "#888888",
    fontFamily: F.mono, letterSpacing: 2, marginBottom: 8, marginTop: 22, textTransform: "uppercase",
  },
  descriptionBox: { backgroundColor: C.card, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12 },
  body: { fontSize: 13, color: C.textSecondary, lineHeight: 21, fontFamily: F.dm },
  infoBox: { flexDirection: "row", alignItems: "flex-start", borderRadius: 4, borderWidth: 1, padding: 12 },

  photoScroll: { marginBottom: 4 },
  photoThumb: { width: 100, height: 100, borderRadius: 6, backgroundColor: C.surface, marginRight: 8, overflow: "hidden" },
  photoImage: { width: "100%", height: "100%" },

  contractorCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12 },
  contractorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(52,152,219,0.1)", borderWidth: 1, borderColor: "rgba(52,152,219,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  contractorName: { fontSize: 14, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  contractorPhone: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  scheduledLabel: { fontSize: 9, color: C.textMuted, fontFamily: F.mono, textTransform: "uppercase" },
  scheduledDate: { fontSize: 12, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },

  costRow: { flexDirection: "row", gap: 8 },
  costBox: {
    flex: 1, padding: 12, borderRadius: 4,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  costLabel: { fontSize: 9, color: C.textMuted, fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  costAmount: { fontSize: 16, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 0.5 },

  tlRow: { flexDirection: "row", gap: 8 },
  tlLeft: { alignItems: "center" },
  tlDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  tlLine: { width: 1.5, flex: 1, backgroundColor: C.border, minHeight: 16, marginVertical: 2 },
  tlBody: { flex: 1, paddingBottom: 14, paddingTop: 2 },
  tlHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" },
  tlStatus: { fontSize: 11, fontWeight: "700", fontFamily: F.mono },
  tlFrom: { fontSize: 9, color: C.textMuted, fontFamily: F.mono },
  tlTime: { fontSize: 9, color: C.textMuted, fontFamily: F.mono, marginLeft: "auto" },
  tlNote: { fontSize: 11, color: C.textSecondary, fontFamily: F.dm, lineHeight: 16 },

  confirmPhotoRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  confirmPhotoWrap: { position: "relative" },
  confirmPhoto: { width: 76, height: 76, borderRadius: 4, backgroundColor: C.surface },
  removePhotoBtn: {
    position: "absolute", top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10, backgroundColor: C.red,
    alignItems: "center", justifyContent: "center",
  },
  addPhotoBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderStyle: "dashed", borderRadius: 4, padding: 12, marginTop: 8,
  },
  addPhotoText: { fontSize: 12, color: C.primary, fontWeight: "600", fontFamily: F.mono },

  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
  viewerImage: { width: "100%", height: "80%" },

  footer: {
    flexDirection: "row", gap: 8, padding: 14,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface,
    flexWrap: "wrap",
  },
  btnReopen: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 13, borderRadius: 3, backgroundColor: C.red,
    minWidth: 90,
  },
  btnReopenText: { color: "#ffffff", fontSize: 11, fontWeight: "700", fontFamily: F.dm, letterSpacing: 0.5 },
  btnConfirm: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 13, borderRadius: 3, backgroundColor: C.primary,
    minWidth: 110,
  },
  btnConfirmText: { color: "#ffffff", fontSize: 11, fontWeight: "700", fontFamily: F.dm, letterSpacing: 0.5 },

  pill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, alignSelf: "flex-start" },
  pillText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },
});