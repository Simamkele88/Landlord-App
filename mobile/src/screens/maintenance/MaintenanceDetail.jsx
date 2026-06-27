// MAINTENANCE DETAIL SCREEN
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
import { uploadImages } from "../../utils/upload";
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

const STATUS = {
  needs_repair:     { label: "Needs Repair",     color: C.redLight,  bg: "rgba(224,90,74,0.08)" },
  assigned:         { label: "Assigned",          color: C.blue,      bg: "rgba(58,143,212,0.08)" },
  in_progress:      { label: "In Progress",       color: C.gold,      bg: "rgba(232,160,18,0.06)" },
  completed:        { label: "Completed",         color: C.greenLight,bg: "rgba(26,122,74,0.08)" },
  cancelled:        { label: "Closed",            color: "rgba(245,240,232,0.4)", bg: "rgba(245,240,232,0.04)" },
  pending_approval: { label: "Pending Approval",  color: C.gold,      bg: "rgba(232,160,18,0.06)" },
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

function getCat(id) { return CATEGORIES[id] ?? CATEGORIES.other; }
function getFullUrl(url) { if (!url) return ""; if (url.startsWith("http")) return url; return `${api.getBaseUrl()}${url}`; }

function StatusPill({ status }) {
  const cfg = STATUS[status] ?? STATUS.needs_repair;
  return (
    <View style={[S.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[S.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function ImageViewer({ visible, imageUrl, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={S.viewerOverlay}>
        <TouchableOpacity style={S.viewerClose} onPress={onClose}>
          <Feather name="x" size={26} color={C.white} />
        </TouchableOpacity>
        {imageUrl && <Image source={{ uri: imageUrl }} style={S.viewerImage} resizeMode="contain" />}
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
  const [escalating, setEscalating] = useState(false);
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
      if (response.ok) Alert.alert("Request Closed", "Thank you for confirming.", [{ text: "OK", onPress: () => navigation.goBack() }]);
      else throw new Error(data.error || "Confirmation failed");
    } catch (err) { Alert.alert("Error", err.message || "Failed to confirm"); }
    finally { setConfirming(false); }
  }

  function handleReopen(action) {
    Alert.alert(
      action === "reopen" ? "Not Satisfied?" : "Issue Returned?",
      action === "reopen" ? "Notify the caretaker that the repair was not satisfactory." : "Notify the caretaker that the issue has returned.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "reopen" ? "Reopen" : "Report Again",
          style: "destructive",
          onPress: async () => {
            const setter = action === "reopen" ? setReopening : setEscalating;
            setter(true);
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${api.getBaseUrl()}/maintenance/${request.id}/reopen`, {
                method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason: action === "reopen" ? "Tenant reopened — repair not satisfactory" : "Tenant reported issue has returned" }),
              });
              const data = await response.json();
              if (response.ok) Alert.alert("Reopened", "The caretaker has been notified.", [{ text: "OK", onPress: () => fetchRequest() }]);
              else throw new Error(data.error || "Failed");
            } catch (err) { Alert.alert("Error", err.message || "Failed"); }
            finally { setter(false); }
          },
        },
      ]
    );
  }

  
  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.center}><ActivityIndicator size="large" color={C.gold} /><Text style={S.loaderText}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.center}>
          <Feather name="alert-circle" size={36} color="rgba(245,240,232,0.2)" />
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
  const isClosed = request.status === "cancelled";
  const photos = request.photos || [];

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      <ImageViewer visible={viewerVisible} imageUrl={viewerUrl} onClose={() => { setViewerVisible(false); setViewerUrl(""); }} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
        <Text style={S.headerTitle}>Request Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* STATUS ROW */}
        <View style={S.statusRow}>
          <View style={[S.catIcon, { backgroundColor: cat.color + "15", borderColor: cat.color + "25" }]}>
            <Ionicons name={cat.icon} size={16} color={cat.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.title}>{request.title}</Text>
            <Text style={S.meta}>{cat.label} · {request.request_number}</Text>
          </View>
          <StatusPill status={request.status} />
        </View>

        {/* DESCRIPTION */}
        <Text style={S.sectionLabel}>DESCRIPTION</Text>
        <Text style={S.body}>{request.description}</Text>

        {/* PHOTOS */}
        {photos.length > 0 && (
          <>
            <Text style={S.sectionLabel}>PHOTOS ({photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.photoScroll}>
              {photos.map((photo, idx) => (
                <TouchableOpacity key={photo.id || idx} onPress={() => { setViewerUrl(getFullUrl(photo.document_url)); setViewerVisible(true); }} style={S.photoThumb}>
                  <Image source={{ uri: getFullUrl(photo.document_url) }} style={S.photoImage} />
                  {photo.photo_type && (
                    <View style={S.photoTypeBadge}><Text style={S.photoTypeText}>{photo.photo_type}</Text></View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* COMPLETION NOTES */}
        {request.completion_notes && (
          <>
            <Text style={S.sectionLabel}>COMPLETION NOTES</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(26,122,74,0.06)", borderColor: "rgba(76,186,122,0.15)" }]}>
              <Ionicons name="checkmark-circle" size={15} color={C.greenLight} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.greenLight, flex: 1 }]}>{request.completion_notes}</Text>
            </View>
          </>
        )}

        {/* CONTRACTOR */}
        {request.contractor_name && (
          <>
            <Text style={S.sectionLabel}>CONTRACTOR</Text>
            <View style={S.contractorRow}>
              <View style={S.contractorAvatar}><Ionicons name="person" size={16} color={C.gold} /></View>
              <View>
                <Text style={S.contractorName}>{request.contractor_name}</Text>
                {request.contractor_phone && <Text style={S.contractorPhone}>{request.contractor_phone}</Text>}
              </View>
            </View>
          </>
        )}

        {/* COST */}
        {(request.estimated_cost || request.actual_cost) && (
          <>
            <Text style={S.sectionLabel}>COST</Text>
            <View style={S.costRow}>
              {request.estimated_cost && (
                <View style={S.costBox}>
                  <Text style={S.costLabel}>Estimated</Text>
                  <Text style={S.costAmount}>R {Number(request.estimated_cost).toLocaleString()}</Text>
                </View>
              )}
              {request.actual_cost && (
                <View style={[S.costBox, { borderColor: "rgba(76,186,122,0.2)" }]}>
                  <Text style={S.costLabel}>Actual</Text>
                  <Text style={[S.costAmount, { color: C.greenLight }]}>R {Number(request.actual_cost).toLocaleString()}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* TIMELINE */}
        {request.updates && request.updates.length > 0 && (
          <>
            <Text style={S.sectionLabel}>TIMELINE</Text>
            {request.updates.map((u, idx) => {
              const cfg = STATUS[u.status_to] ?? STATUS.needs_repair;
              const isLast = idx === request.updates.length - 1;
              return (
                <View key={idx} style={S.tlRow}>
                  <View style={S.tlLeft}>
                    <View style={[S.tlDot, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                      <Ionicons name="ellipse" size={5} color={cfg.color} />
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

        {/* CONFIRM SECTION */}
        {isCompleted && (
          <>
            <Text style={S.sectionLabel}>CONFIRM COMPLETION</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(58,143,212,0.06)", borderColor: "rgba(58,143,212,0.15)" }]}>
              <Ionicons name="information-circle" size={15} color={C.blue} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.blue, flex: 1 }]}>
                Confirm if resolved, or reopen if not satisfied.
              </Text>
            </View>

            {confirmPhotos.length > 0 && (
              <View style={S.confirmPhotoRow}>
                {confirmPhotos.map((img, idx) => (
                  <View key={idx} style={S.confirmPhotoWrap}>
                    <Image source={{ uri: img.uri }} style={S.confirmPhoto} />
                    <TouchableOpacity style={S.removePhotoBtn} onPress={() => removeConfirmPhoto(idx)}>
                      <Feather name="x" size={10} color={C.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {confirmPhotos.length < 3 && (
              <TouchableOpacity style={S.addPhotoBtn} onPress={pickConfirmPhoto}>
                <Feather name="camera" size={15} color={C.gold} />
                <Text style={S.addPhotoText}>Add photo (optional)</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* FOOTER */}
      {(isCompleted || isClosed) && (
        <View style={S.footer}>
          {isClosed && (
            <TouchableOpacity style={S.btnEscalate} onPress={() => handleReopen("escalate")} disabled={escalating}>
              {escalating ? <ActivityIndicator color={C.gold} size="small" /> : (
                <><Ionicons name="warning-outline" size={16} color={C.gold} /><Text style={S.btnEscalateText}>Escalate</Text></>
              )}
            </TouchableOpacity>
          )}
          {isCompleted && (
            <TouchableOpacity style={S.btnReopen} onPress={() => handleReopen("reopen")} disabled={reopening}>
              {reopening ? <ActivityIndicator color={C.white} size="small" /> : (
                <><Ionicons name="close-circle" size={16} color={C.white} /><Text style={S.btnReopenText}>Reopen</Text></>
              )}
            </TouchableOpacity>
          )}
          {isCompleted && (
            <TouchableOpacity style={S.btnConfirm} onPress={handleConfirm} disabled={confirming}>
              {confirming ? <ActivityIndicator color={C.black} size="small" /> : (
                <><Ionicons name="checkmark-circle" size={16} color={C.black} /><Text style={S.btnConfirmText}>Confirm & Close</Text></>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loaderText: { fontSize: 13, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },
  emptyText: { fontSize: 15, color: "rgba(245,240,232,0.4)", fontFamily: F.dm },
  backLink: { fontSize: 13, color: C.gold, fontWeight: "600", fontFamily: F.mono, marginTop: 6 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollPad: { padding: 16, paddingBottom: 100 },

  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 22 },
  catIcon: { width: 36, height: 36, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 15, fontWeight: "600", color: C.white, fontFamily: F.dm, marginBottom: 2 },
  meta: { fontSize: 10, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },

  sectionLabel: {
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)",
    fontFamily: F.mono, letterSpacing: 2, marginBottom: 8, marginTop: 22,
  },
  body: { fontSize: 13, color: "rgba(245,240,232,0.5)", lineHeight: 21, fontFamily: F.dm },
  infoBox: {
    flexDirection: "row", alignItems: "flex-start",
    borderRadius: 4, borderWidth: 1, padding: 12,
  },

  photoScroll: { marginBottom: 8 },
  photoThumb: { width: 96, height: 96, borderRadius: 6, backgroundColor: C.muted, marginRight: 8, overflow: "hidden" },
  photoImage: { width: "100%", height: "100%" },
  photoTypeBadge: {
    position: "absolute", bottom: 4, left: 4,
    backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3,
  },
  photoTypeText: { fontSize: 8, color: C.white, textTransform: "capitalize", fontFamily: F.mono },

  contractorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  contractorAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(232,160,18,0.1)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  contractorName: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  contractorPhone: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, marginTop: 2 },

  costRow: { flexDirection: "row", gap: 8 },
  costBox: {
    flex: 1, padding: 12, borderRadius: 4,
    backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border,
  },
  costLabel: { fontSize: 9, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  costAmount: { fontSize: 15, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 0.5 },

  tlRow: { flexDirection: "row", gap: 8 },
  tlLeft: { alignItems: "center" },
  tlDot: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  tlLine: { width: 1.5, flex: 1, backgroundColor: C.border, minHeight: 16, marginVertical: 2 },
  tlBody: { flex: 1, paddingBottom: 14, paddingTop: 1 },
  tlHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  tlStatus: { fontSize: 11, fontWeight: "700", fontFamily: F.mono },
  tlTime: { fontSize: 9, color: "rgba(245,240,232,0.25)", fontFamily: F.mono },
  tlNote: { fontSize: 11, color: "rgba(245,240,232,0.4)", fontFamily: F.dm, lineHeight: 16 },

  confirmPhotoRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  confirmPhotoWrap: { position: "relative" },
  confirmPhoto: { width: 76, height: 76, borderRadius: 4, backgroundColor: C.muted },
  removePhotoBtn: {
    position: "absolute", top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9, backgroundColor: C.redLight,
    alignItems: "center", justifyContent: "center",
  },
  addPhotoBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border,
    borderStyle: "dashed", borderRadius: 4, padding: 12, marginTop: 8,
  },
  addPhotoText: { fontSize: 12, color: C.gold, fontWeight: "600", fontFamily: F.mono },

  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
  viewerImage: { width: "100%", height: "80%" },

  footer: {
    flexDirection: "row", gap: 8, padding: 14,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.muted2,
    flexWrap: "wrap",
  },
  btnEscalate: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 12, borderRadius: 3,
    backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(232,160,18,0.3)",
    minWidth: 90,
  },
  btnEscalateText: { fontSize: 11, fontWeight: "600", color: C.gold, fontFamily: F.dm, letterSpacing: 0.5 },
  btnReopen: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 12, borderRadius: 3, backgroundColor: C.redLight,
    minWidth: 90,
  },
  btnReopenText: { color: C.white, fontSize: 11, fontWeight: "700", fontFamily: F.dm, letterSpacing: 0.5 },
  btnConfirm: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 12, borderRadius: 3, backgroundColor: C.gold,
    minWidth: 110,
  },
  btnConfirmText: { color: C.black, fontSize: 11, fontWeight: "700", fontFamily: F.dm, letterSpacing: 0.5 },

  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, alignSelf: "flex-start" },
  pillText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },
});