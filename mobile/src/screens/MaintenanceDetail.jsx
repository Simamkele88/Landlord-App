// TENANT MAINTENANCE DETAIL PAGE — WITH REAL API & PHOTO CONFIRMATION
// "Cancelled" status displays as "Closed" to tenants
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ActivityIndicator,
  Image, Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { uploadImages } from "../utils/upload";
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

// STATUS CONFIG — "cancelled" key in DB, but displays as "Closed"
const STATUS = {
  needs_repair:     { label: "Needs Repair",     color: C.danger,  bg: C.dangerBg },
  assigned:         { label: "Assigned",          color: C.primary, bg: "#1a2a3a" },
  in_progress:      { label: "In Progress",       color: C.warning, bg: C.warningBg },
  completed:        { label: "Completed",         color: C.success, bg: C.successBg },
  cancelled:        { label: "Closed",            color: C.textMuted, bg: C.surfaceAlt }, // ← Changed label
  pending_approval: { label: "Pending Approval",  color: C.warning, bg: C.warningBg },
};

// CATEGORIES CONFIG
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

// HELPERS
function getCat(id) { return CATEGORIES[id] ?? CATEGORIES.other; }

function StatusPill({ status }) {
  const cfg = STATUS[status] ?? STATUS.needs_repair;
  return (
    <View style={[S.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[S.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// IMAGE VIEWER MODAL
function ImageViewer({ visible, imageUrl, onClose }) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={S.viewerOverlay}>
        <TouchableOpacity style={S.viewerClose} onPress={onClose}>
          <Feather name="x" size={28} color={C.white} />
        </TouchableOpacity>
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={S.viewerImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );
}

// MAIN COMPONENT
export default function MaintenanceDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const requestId = route.params?.request?.id || route.params?.requestId;

  const [request, setRequest] = useState(route.params?.request || null);
  const [loading, setLoading] = useState(!request);
  const [confirming, setConfirming] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [confirmPhotos, setConfirmPhotos] = useState([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");

  // Fetch request details if not passed via navigation
  const fetchRequest = useCallback(async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/maintenance/${requestId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setRequest(data.request || data);
      } else {
        Alert.alert("Error", data.error || "Failed to load request");
      }
    } catch (err) {
      console.error("Fetch request error:", err);
      Alert.alert("Error", "Unable to load request details");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (!request) {
      fetchRequest();
    }
  }, [fetchRequest]);

  // Pick photo for confirmation
  async function pickConfirmPhoto() {
    if (confirmPhotos.length >= 3) {
      Alert.alert("Limit", "Maximum 3 photos");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery permission is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 3 - confirmPhotos.length,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setConfirmPhotos(prev => [...prev, ...result.assets].slice(0, 3));
    }
  }

  function removeConfirmPhoto(index) {
    setConfirmPhotos(prev => prev.filter((_, i) => i !== index));
  }

  // Get full URL for photos
  function getFullUrl(url) {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${api.getBaseUrl()}${url}`;
  }

  // Handle confirm completion
  async function handleConfirm() {
    setConfirming(true);
    
    try {
      let uploadedPhotos = [];
      if (confirmPhotos.length > 0) {
        uploadedPhotos = await uploadImages(confirmPhotos);
      }

      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/maintenance/${request.id}/confirm`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          photos: uploadedPhotos.map(p => ({
            ...p,
            photo_type: "after",
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Request Closed", "Thank you for confirming. The request has been closed.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        throw new Error(data.error || "Confirmation failed");
      }
    } catch (err) {
      console.error("Confirm error:", err);
      Alert.alert("Error", err.message || "Failed to confirm completion");
    } finally {
      setConfirming(false);
    }
  }

  // Handle escalate request - available for all non-closed/completed requests
  async function handleEscalate() {
    Alert.alert(
      "Escalate Request",
      "Are you sure you want to escalate this request? The landlord will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Escalate",
          style: "destructive",
          onPress: async () => {
            setEscalating(true);
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${api.getBaseUrl()}/maintenance/${request.id}/escalate`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert("Escalated", "Your request has been escalated to the landlord.", [
                  { text: "OK", onPress: () => fetchRequest() }, // Refresh the page
                ]);
              } else {
                throw new Error(data.error || "Escalation failed");
              }
            } catch (err) {
              console.error("Escalate error:", err);
              Alert.alert("Error", err.message || "Failed to escalate request");
            } finally {
              setEscalating(false);
            }
          },
        },
      ]
    );
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.loaderContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={S.loaderText}>Loading request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Not found state
  if (!request) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.emptyContainer}>
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
  const canConfirm = request.status === "completed";
  const canEscalate = !["completed", "cancelled", "pending_approval"].includes(request.status); // ← Escalate available for needs_repair, assigned, in_progress
  const photos = request.photos || [];

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* IMAGE VIEWER */}
      <ImageViewer
        visible={viewerVisible}
        imageUrl={viewerUrl}
        onClose={() => { setViewerVisible(false); setViewerUrl(""); }}
      />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Request Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* STATUS ROW */}
        <View style={S.statusRow}>
          <View style={[S.catIcon, { backgroundColor: cat.color + "18" }]}>
            <Ionicons name={cat.icon} size={18} color={cat.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.title}>{request.title}</Text>
            <Text style={S.meta}>{cat.label} · {request.request_number}</Text>
          </View>
          <StatusPill status={request.status} />
        </View>

        {/* DESCRIPTION */}
        <Text style={S.sectionLabel}>Description</Text>
        <Text style={S.body}>{request.description}</Text>

        {/* PHOTOS */}
        {photos.length > 0 && (
          <>
            <Text style={S.sectionLabel}>Photos ({photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.photoScroll}>
              {photos.map((photo, idx) => (
                <TouchableOpacity
                  key={photo.id || idx}
                  onPress={() => {
                    setViewerUrl(getFullUrl(photo.document_url));
                    setViewerVisible(true);
                  }}
                  style={S.photoThumb}
                >
                  <Image
                    source={{ uri: getFullUrl(photo.document_url) }}
                    style={S.photoImage}
                  />
                  {photo.photo_type && (
                    <View style={S.photoTypeBadge}>
                      <Text style={S.photoTypeText}>{photo.photo_type}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* COMPLETION NOTES */}
        {request.completion_notes && (
          <>
            <Text style={S.sectionLabel}>Completion Notes</Text>
            <View style={[S.infoBox, { backgroundColor: C.successBg, borderColor: C.success + "30" }]}>
              <Ionicons name="checkmark-circle" size={16} color={C.success} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.success, flex: 1 }]}>{request.completion_notes}</Text>
            </View>
          </>
        )}

        {/* CONTRACTOR */}
        {request.contractor_name && (
          <>
            <Text style={S.sectionLabel}>Assigned Contractor</Text>
            <View style={S.contractorRow}>
              <View style={S.contractorAvatar}>
                <Ionicons name="person" size={18} color={C.primary} />
              </View>
              <View>
                <Text style={S.contractorName}>{request.contractor_name}</Text>
                {request.contractor_phone && (
                  <Text style={S.contractorPhone}>{request.contractor_phone}</Text>
                )}
              </View>
            </View>
          </>
        )}

        {/* COST */}
        {(request.estimated_cost || request.actual_cost) && (
          <>
            <Text style={S.sectionLabel}>Cost</Text>
            <View style={S.costRow}>
              {request.estimated_cost && (
                <View style={S.costBox}>
                  <Text style={S.costLabel}>Estimated</Text>
                  <Text style={S.costAmount}>R {Number(request.estimated_cost).toLocaleString()}</Text>
                </View>
              )}
              {request.actual_cost && (
                <View style={[S.costBox, { borderColor: C.success + "30" }]}>
                  <Text style={S.costLabel}>Actual</Text>
                  <Text style={[S.costAmount, { color: C.success }]}>R {Number(request.actual_cost).toLocaleString()}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* TIMELINE */}
        {request.updates && request.updates.length > 0 && (
          <>
            <Text style={S.sectionLabel}>Activity Timeline</Text>
            {request.updates.map((u, idx) => {
              const cfg = STATUS[u.status_to] ?? STATUS.needs_repair;
              const isLast = idx === request.updates.length - 1;
              return (
                <View key={idx} style={S.tlRow}>
                  <View style={S.tlLeft}>
                    <View style={[S.tlDot, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                      <Ionicons name="ellipse" size={6} color={cfg.color} />
                    </View>
                    {!isLast && <View style={S.tlLine} />}
                  </View>
                  <View style={S.tlBody}>
                    <View style={S.tlHeader}>
                      <Text style={[S.tlStatus, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={S.tlTime}>{new Date(u.created_at).toLocaleDateString()}</Text>
                    </View>
                    {u.notes && <Text style={S.tlNote}>{u.notes}</Text>}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* CONFIRMATION SECTION */}
        {canConfirm && (
          <>
            <Text style={S.sectionLabel}>Confirm Completion</Text>
            <View style={[S.infoBox, { backgroundColor: C.primary + "10", borderColor: C.primary + "20" }]}>
              <Ionicons name="information-circle" size={16} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.primary, flex: 1 }]}>
                The repair has been marked as complete. Please confirm if the issue is resolved. You can optionally attach photos of the completed work.
              </Text>
            </View>

            {/* CONFIRMATION PHOTOS */}
            {confirmPhotos.length > 0 && (
              <View style={S.confirmPhotoRow}>
                {confirmPhotos.map((img, idx) => (
                  <View key={idx} style={S.confirmPhotoWrap}>
                    <Image source={{ uri: img.uri }} style={S.confirmPhoto} />
                    <TouchableOpacity
                      style={S.removePhotoBtn}
                      onPress={() => removeConfirmPhoto(idx)}
                    >
                      <Feather name="x" size={10} color={C.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ADD PHOTO BUTTON */}
            {confirmPhotos.length < 3 && (
              <TouchableOpacity style={S.addPhotoBtn} onPress={pickConfirmPhoto}>
                <Feather name="camera" size={16} color={C.primary} />
                <Text style={S.addPhotoText}>Add photo (optional)</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* FOOTER ACTIONS */}
      {(canConfirm || canEscalate) && (
        <View style={S.footer}>
          {/* ESCALATE BUTTON */}
          {canEscalate && (
            <TouchableOpacity
              style={[S.btnEscalate, escalating && { opacity: 0.6 }]}
              onPress={handleEscalate}
              disabled={escalating}
            >
              {escalating ? (
                <ActivityIndicator color={C.warning} size="small" />
              ) : (
                <>
                  <Ionicons name="arrow-up-circle-outline" size={18} color={C.warning} />
                  <Text style={S.btnEscalateText}>Escalate</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* CONFIRM BUTTON */}
          {canConfirm && (
            <TouchableOpacity
              style={[S.btnConfirm, confirming && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={confirming}
            >
              {confirming ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={C.white} />
                  <Text style={S.btnConfirmText}>Confirm & Close</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loaderText: { fontSize: 14, color: C.textMuted },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, color: C.textSecondary },
  backLink: { fontSize: 14, color: C.primary, fontWeight: "600" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary },

  scroll: { flex: 1 },
  scrollPad: { padding: 20, paddingBottom: 100 },

  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 24 },
  catIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "700", color: C.textPrimary, marginBottom: 3 },
  meta: { fontSize: 11, color: C.textMuted },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 24,
  },
  body: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },
  infoBox: {
    flexDirection: "row", alignItems: "flex-start",
    borderRadius: 10, borderWidth: 1, padding: 14,
  },

  // Photos
  photoScroll: { marginBottom: 8 },
  photoThumb: {
    width: 100, height: 100, borderRadius: 10,
    backgroundColor: C.surfaceAlt, marginRight: 8, overflow: "hidden",
  },
  photoImage: { width: "100%", height: "100%", borderRadius: 10 },
  photoTypeBadge: {
    position: "absolute", bottom: 4, left: 4,
    backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  photoTypeText: { fontSize: 8, color: C.white, textTransform: "capitalize" },

  // Contractor
  contractorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  contractorAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center",
  },
  contractorName: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  contractorPhone: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Cost
  costRow: { flexDirection: "row", gap: 10 },
  costBox: {
    flex: 1, padding: 12, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  costLabel: { fontSize: 10, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 },
  costAmount: { fontSize: 16, fontWeight: "700", color: C.textPrimary },

  // Timeline
  tlRow: { flexDirection: "row", gap: 10 },
  tlLeft: { alignItems: "center" },
  tlDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  tlLine: { width: 1.5, flex: 1, backgroundColor: C.border, minHeight: 20, marginVertical: 2 },
  tlBody: { flex: 1, paddingBottom: 16, paddingTop: 2 },
  tlHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  tlStatus: { fontSize: 12, fontWeight: "700" },
  tlTime: { fontSize: 10, color: C.textMuted },
  tlNote: { fontSize: 12, color: C.textSecondary, lineHeight: 17 },

  // Confirmation photos
  confirmPhotoRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  confirmPhotoWrap: { position: "relative" },
  confirmPhoto: { width: 80, height: 80, borderRadius: 8, backgroundColor: C.surfaceAlt },
  removePhotoBtn: {
    position: "absolute", top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.danger, alignItems: "center", justifyContent: "center",
  },
  addPhotoBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderStyle: "dashed", borderRadius: 10, padding: 14, marginTop: 8,
  },
  addPhotoText: { fontSize: 13, color: C.primary, fontWeight: "600" },

  // Viewer
  viewerOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center", justifyContent: "center",
  },
  viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
  viewerImage: { width: "100%", height: "80%" },

  // Footer
  footer: {
    flexDirection: "row", gap: 10, padding: 16,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface,
  },
  btnEscalate: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.warning,
  },
  btnEscalateText: { fontSize: 14, fontWeight: "600", color: C.warning },
  btnConfirm: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: C.success,
  },
  btnConfirmText: { color: C.white, fontSize: 14, fontWeight: "700" },

  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
});