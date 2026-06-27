// TENANT COMPLAINT DETAIL SCREEN 
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Image, Modal, ActivityIndicator, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
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
const F = { bebas: "bebas-neue", dm: "dm-sans", mono: "space-mono" };

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

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit / Tenant",
  common_area: "Common Area",
  unknown: "Unknown / General",
  property_wide: "Property-Wide Issue",
};

// ── SHARED STYLE HELPERS ──────────────────────────────────────
const $input = {
  backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border,
  borderRadius: 3, paddingHorizontal: 12, paddingVertical: 12,
  fontSize: 14, color: C.white, fontFamily: F.dm,
};
const $btnGold = { backgroundColor: C.gold, borderRadius: 3, paddingVertical: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 };
const $btnGhost = { backgroundColor: "transparent", borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingVertical: 13, alignItems: "center", justifyContent: "center" };

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <View style={[S.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[S.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function fmtDate(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function getFullUrl(url) { if (!url) return ""; if (url.startsWith("http")) return url; return `${api.getBaseUrl()}${url}`; }

// ── IMAGE VIEWER ──────────────────────────────────────────────
function ImageViewer({ visible, imageUrl, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={S.viewerOverlay}>
        <TouchableOpacity style={S.viewerClose} onPress={onClose}><Feather name="x" size={26} color={C.white} /></TouchableOpacity>
        {imageUrl && <Image source={{ uri: imageUrl }} style={S.viewerImage} resizeMode="contain" />}
      </View>
    </Modal>
  );
}

// ── TEXT ACTION MODAL ─────────────────────────────────────────
function TextActionModal({ visible, title, subtitle, fieldLabel, placeholder, confirmLabel, confirmColor, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit() { if (!value.trim()) return; setLoading(true); onSubmit(value.trim()); setLoading(false); setValue(""); }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={S.overlay}><View style={S.sheet}>
        <View style={S.sheetHandle} />
        <Text style={S.sheetTitle}>{title}</Text><Text style={S.sheetSub}>{subtitle}</Text>
        <View style={S.inputGroup}><Text style={S.inputLabel}>{fieldLabel}</Text>
          <TextInput style={[$input, S.textarea]} value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor="rgba(245,240,232,0.15)" multiline numberOfLines={4} textAlignVertical="top" />
        </View>
        <View style={S.modalActions}>
          <TouchableOpacity style={$btnGhost} onPress={() => { onClose(); setValue(""); }}><Text style={S.btnGhostText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={[$btnGold, { backgroundColor: confirmColor || C.gold }, loading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={C.black} size="small" /> : <Text style={S.btnGoldText}>{confirmLabel}</Text>}
          </TouchableOpacity>
        </View>
      </View></View>
    </Modal>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function TenantComplaintDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const complaintId = route.params?.complaint?.id || route.params?.complaintId;

  const [complaint, setComplaint] = useState(route.params?.complaint || null);
  const [loading, setLoading] = useState(!route.params?.complaint);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");
  const [activeModal, setActiveModal] = useState(null);

  const fetchComplaint = useCallback(async () => {
    if (!complaintId) return;
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/complaints/${complaintId}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setComplaint(data.complaint);
      else setError(data.error || "Failed to load complaint");
    } catch (err) { setError("Unable to load complaint details"); }
    finally { setLoading(false); }
  }, [complaintId]);

  useEffect(() => { if (!complaint) fetchComplaint(); }, [fetchComplaint]);

  async function handleAction(method, body, successMsg) {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/complaints/${complaint.id}${method}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) { await fetchComplaint(); setActiveModal(null); if (successMsg) Alert.alert("Success", successMsg); }
      else Alert.alert("Error", data.error || "Failed");
    } catch (err) { Alert.alert("Error", "Unable to complete. Please try again."); }
    finally { setSaving(false); }
  }

  // ── LOADING / ERROR ─────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.center}><ActivityIndicator size="large" color={C.gold} /><Text style={S.loaderText}>Loading...</Text></View>
      </SafeAreaView>
    );
  }
  if (error || !complaint) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.center}>
          <Feather name="alert-circle" size={36} color="rgba(245,240,232,0.2)" />
          <Text style={S.emptyText}>{error || "Complaint not found"}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={S.backLink}>Go back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const evidence = complaint.evidence || [];
  const isSpecificTenant = complaint.complaint_scope === "specific_tenant";
  const isCommonArea = complaint.complaint_scope === "common_area";
  const hasAgainstParty = isSpecificTenant && complaint.against_name;
  const scopeLabel = SCOPE_LABELS[complaint.complaint_scope] || "Unknown";
  const isAwaitingClarification = complaint.status === "awaiting_clarification";
  const isResolved = complaint.status === "resolved";
  const isRejected = complaint.status === "rejected";
  const isDismissed = complaint.status === "dismissed";
  const isClosed = isResolved || isRejected || isDismissed;
  const canReopen = isRejected || isDismissed;

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      {saving && <View style={S.savingOverlay}><ActivityIndicator size="large" color={C.gold} /></View>}
      <ImageViewer visible={viewerOpen} imageUrl={viewerUrl} onClose={() => { setViewerOpen(false); setViewerUrl(""); }} />

      <TextActionModal visible={activeModal === "clarify"} title="Provide Clarification" subtitle={complaint.subject}
        fieldLabel="Your response" placeholder="Provide the details requested..." confirmLabel="Submit clarification" confirmColor={C.orange}
        onClose={() => setActiveModal(null)} onSubmit={(v) => handleAction("/clarify", { response: v })} />

      <TextActionModal visible={activeModal === "reopen"} title="Reopen Complaint" subtitle={complaint.subject}
        fieldLabel="Reason for reopening" placeholder="Explain why this should be reopened..." confirmLabel="Reopen Complaint" confirmColor={C.gold}
        onClose={() => setActiveModal(null)} onSubmit={(v) => handleAction("/reopen", { reason: v }, "Complaint reopened. The caretaker will be notified.")} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
        <Text style={S.headerTitle}>Complaint Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* STATUS ROW */}
        <View style={S.statusRow}>
          <StatusPill status={complaint.status} />
          <View style={[S.scopeBadge, { backgroundColor: C.muted, borderColor: C.border }]}>
            <Text style={S.scopeBadgeText}>{scopeLabel}</Text>
          </View>
          {isAwaitingClarification && (
            <View style={[S.actionBadge, { backgroundColor: "rgba(249,115,22,0.08)", borderColor: "rgba(249,115,22,0.2)" }]}>
              <Text style={{ color: C.orange, fontSize: 9, fontWeight: "700", fontFamily: F.mono, letterSpacing: 0.5 }}>Needs your action</Text>
            </View>
          )}
        </View>

        {/* TITLE */}
        <Text style={S.title}>{complaint.subject}</Text>

        {/* DESCRIPTION */}
        <Text style={S.sectionLabel}>DESCRIPTION</Text>
        <Text style={S.body}>{complaint.description}</Text>

        {/* LOCATION */}
        {isCommonArea && complaint.common_area_location && (
          <>
            <Text style={S.sectionLabel}>LOCATION</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(232,160,18,0.06)", borderColor: "rgba(232,160,18,0.15)" }]}>
              <Ionicons name="location" size={13} color={C.gold} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.gold, flex: 1 }]}>{complaint.common_area_location}</Text>
            </View>
          </>
        )}

        {/* PARTIES */}
        <Text style={S.sectionLabel}>PARTIES INVOLVED</Text>
        <View style={[S.partiesRow, !hasAgainstParty && { justifyContent: "center" }]}>
          <View style={[S.partyCard, { backgroundColor: "rgba(58,143,212,0.06)", borderColor: "rgba(58,143,212,0.15)" }, !hasAgainstParty && { flex: 1 }]}>
            <Text style={[S.partyLabel, { color: C.blue }]}>Filed By</Text>
            <Text style={S.partyName}>{complaint.filed_by_name}</Text>
          </View>
          {hasAgainstParty && (
            <View style={[S.partyCard, { backgroundColor: "rgba(224,90,74,0.06)", borderColor: "rgba(224,90,74,0.15)" }]}>
              <Text style={[S.partyLabel, { color: C.redLight }]}>Against</Text>
              <Text style={S.partyName}>{complaint.against_name}</Text>
              {complaint.against_unit_number && <Text style={S.partyUnit}>Unit {complaint.against_unit_number}</Text>}
            </View>
          )}
        </View>

        {/* EVIDENCE */}
        {evidence.length > 0 && (
          <>
            <Text style={S.sectionLabel}>EVIDENCE ({evidence.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.evidenceScroll}>
              {evidence.map((item, idx) => (
                <TouchableOpacity key={item.id || idx} onPress={() => { setViewerUrl(getFullUrl(item.document_url)); setViewerOpen(true); }} style={S.evidenceThumb}>
                  <Image source={{ uri: getFullUrl(item.document_url) }} style={S.evidenceImage} />
                  <View style={S.evidenceLabel}><Text style={S.evidenceLabelText} numberOfLines={1}>{item.label || `Evidence ${idx + 1}`}</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* RESOLUTION */}
        {isResolved && complaint.resolution_notes && (
          <>
            <Text style={S.sectionLabel}>RESOLUTION</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(26,122,74,0.06)", borderColor: "rgba(76,186,122,0.15)" }]}>
              <Ionicons name="checkmark-circle" size={15} color={C.greenLight} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.greenLight, flex: 1 }]}>{complaint.resolution_notes}</Text>
            </View>
          </>
        )}

        {/* APPROVED BANNER */}
        {complaint.status === "approved" && (
          <View style={[S.infoBox, { backgroundColor: "rgba(58,143,212,0.06)", borderColor: "rgba(58,143,212,0.15)", marginTop: 14 }]}>
            <Ionicons name="checkmark-circle" size={15} color={C.blue} style={{ marginRight: 8 }} />
            <Text style={[S.body, { color: C.blue, flex: 1 }]}>Your complaint has been approved. The landlord will issue a verdict shortly.</Text>
          </View>
        )}

        {/* DETAILS */}
        <View style={S.detailSection}>
          <Text style={S.detailSectionLabel}>DETAILS</Text>
          <View style={S.detailRow}><Text style={S.detailLabel}>Category</Text><Text style={S.detailValue}>{complaint.category?.replace(/_/g, " ")}</Text></View>
          <View style={S.detailRow}><Text style={S.detailLabel}>Scope</Text><Text style={S.detailValue}>{scopeLabel}</Text></View>
          <View style={S.detailRow}><Text style={S.detailLabel}>Severity</Text><Text style={S.detailValue}>{complaint.severity}/5</Text></View>
          <View style={S.detailRow}><Text style={S.detailLabel}>Submitted</Text><Text style={S.detailValue}>{fmtDate(complaint.created_at)}</Text></View>
        </View>

        {/* PROCESS INFO */}
        <View style={[S.infoBox, { backgroundColor: C.muted2, borderColor: C.border, marginTop: 20 }]}>
          <Ionicons name="information-circle" size={13} color="rgba(245,240,232,0.3)" style={{ marginRight: 8 }} />
          <Text style={[S.body, { color: "rgba(245,240,232,0.4)", flex: 1, fontSize: 12 }]}>Complaints are first reviewed by the caretaker. Serious or unresolved cases are escalated to the landlord.</Text>
        </View>

        {/* REJECTION REASON */}
        {isRejected && complaint.resolution_notes && (
          <View style={[S.infoBox, { backgroundColor: "rgba(224,90,74,0.06)", borderColor: "rgba(224,90,74,0.15)", marginTop: 12 }]}>
            <Ionicons name="close-circle" size={15} color={C.redLight} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[S.body, { color: C.redLight, fontWeight: "700", fontFamily: F.dm }]}>Rejection Reason</Text>
              <Text style={[S.body, { color: C.redLight, marginTop: 4 }]}>{complaint.resolution_notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={S.footer}>
        {isAwaitingClarification && (
          <TouchableOpacity style={[$btnGold, { backgroundColor: C.orange }]} onPress={() => setActiveModal("clarify")}>
            <Text style={S.btnGoldText}>Provide Clarification</Text>
          </TouchableOpacity>
        )}
        {canReopen && (
          <TouchableOpacity style={$btnGold} onPress={() => setActiveModal("reopen")}>
            <Text style={S.btnGoldText}>Reopen Complaint</Text>
          </TouchableOpacity>
        )}
        {isResolved && (
          <View style={[$btnGhost, { borderColor: "rgba(76,186,122,0.3)" }]}>
            <Ionicons name="checkmark-circle" size={14} color={C.greenLight} style={{ marginRight: 6 }} />
            <Text style={{ color: C.greenLight, fontFamily: F.dm, fontWeight: "700", fontSize: 12 }}>Complaint Closed</Text>
          </View>
        )}
        {!isAwaitingClarification && !isClosed && (
          <View style={$btnGhost}>
            <Text style={S.btnGhostText}>Under Review</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loaderText: { fontSize: 13, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },
  emptyText: { fontSize: 15, color: "rgba(245,240,232,0.4)", fontFamily: F.dm },
  backLink: { fontSize: 13, color: C.gold, fontWeight: "600", fontFamily: F.mono, marginTop: 6 },
  savingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", zIndex: 100 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollPad: { padding: 16, paddingBottom: 100 },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  scopeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, borderWidth: 1 },
  scopeBadgeText: { fontSize: 9, color: "rgba(245,240,232,0.4)", fontWeight: "600", fontFamily: F.mono },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, borderWidth: 1 },

  title: { fontSize: 17, fontWeight: "600", color: C.white, fontFamily: F.dm, marginBottom: 14 },

  sectionLabel: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)", fontFamily: F.mono, letterSpacing: 2, marginBottom: 8, marginTop: 20 },
  body: { fontSize: 13, color: "rgba(245,240,232,0.5)", lineHeight: 21, fontFamily: F.dm },

  partiesRow: { flexDirection: "row", gap: 8 },
  partyCard: { flex: 1, borderRadius: 4, borderWidth: 1, padding: 12 },
  partyLabel: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: F.mono },
  partyName: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  partyUnit: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, marginTop: 2 },

  evidenceScroll: { marginBottom: 8 },
  evidenceThumb: { width: 110, marginRight: 8, borderRadius: 4, overflow: "hidden", backgroundColor: C.muted },
  evidenceImage: { width: 110, height: 90 },
  evidenceLabel: { padding: 5 },
  evidenceLabelText: { fontSize: 9, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },

  infoBox: { flexDirection: "row", alignItems: "flex-start", borderRadius: 4, borderWidth: 1, padding: 12 },

  detailSection: { marginTop: 20, backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  detailSectionLabel: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)", fontFamily: F.mono, letterSpacing: 2, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono },
  detailValue: { fontSize: 12, fontWeight: "600", color: C.white, fontFamily: F.dm, textTransform: "capitalize" },

  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3 },
  pillText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },

  footer: { padding: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.muted2, flexDirection: "row", gap: 10 },
  btnGoldText: { fontSize: 12, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
  btnGhostText: { fontSize: 12, fontWeight: "500", color: "rgba(245,240,232,0.5)", fontFamily: F.dm, letterSpacing: 0.5 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.muted2, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 20, paddingBottom: 36, borderTopWidth: 1, borderColor: C.border },
  sheetHandle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 2 },
  sheetSub: { fontSize: 11, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)", fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  textarea: { minHeight: 90, paddingTop: 12 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14 },

  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
  viewerImage: { width: "100%", height: "80%" },
});