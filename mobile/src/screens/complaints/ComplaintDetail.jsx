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
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", successBg: "#052E16",
  warning: "#F59E0B", warningBg: "#451A03",
  danger: "#EF4444", dangerBg: "#450A0A",
  orange: "#F97316", orangeBg: "#431407",
  purple: "#A855F7", purpleBg: "#2D1B4E",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

const STATUS_CONFIG = {
  open: { label: "Open", color: C.danger, bg: C.dangerBg },
  under_review: { label: "Under Review", color: C.warning, bg: C.warningBg },
  awaiting_clarification: { label: "Needs Clarification", color: C.orange, bg: C.orangeBg },
  approved: { label: "Approved", color: C.primary, bg: "#1e3a5f" },
  resolved: { label: "Resolved", color: C.success, bg: C.successBg },
  rejected: { label: "Rejected", color: C.textMuted, bg: C.surfaceAlt },
  escalated: { label: "Escalated", color: C.purple, bg: C.purpleBg },
  dismissed: { label: "Dismissed", color: C.textMuted, bg: C.surfaceAlt },
};

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit / Tenant",
  common_area: "Common Area",
  unknown: "Unknown / General",
  property_wide: "Property-Wide Issue",
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <View style={[S.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[S.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function actorLabel(role) {
  const labels = { landlord: "Landlord", caretaker: "Caretaker", tenant: "You" };
  return labels[role] || "System";
}

function fmtDate(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(dateValue) {
  if (!dateValue) return "";
  const seconds = (Date.now() - new Date(dateValue).getTime()) / 1000;
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function ImageViewer({ visible, imageUrl, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={S.viewerOverlay}>
        <TouchableOpacity style={S.viewerClose} onPress={onClose}><Feather name="x" size={28} color={C.white} /></TouchableOpacity>
        {imageUrl && <Image source={{ uri: imageUrl }} style={S.viewerImage} resizeMode="contain" />}
      </View>
    </Modal>
  );
}

function TextActionModal({ visible, title, subtitle, fieldLabel, placeholder, confirmLabel, confirmColor, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    if (!value.trim()) return;
    setLoading(true);
    onSubmit(value.trim());
    setLoading(false);
    setValue("");
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={S.overlay}><View style={S.sheet}>
        <View style={S.sheetHandle} />
        <Text style={S.sheetTitle}>{title}</Text><Text style={S.sheetSub}>{subtitle}</Text>
        <View style={S.inputGroup}><Text style={S.inputLabel}>{fieldLabel}</Text>
          <TextInput style={[S.input, S.textarea]} value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor={C.textMuted} multiline numberOfLines={4} textAlignVertical="top" />
        </View>
        <View style={S.modalActions}>
          <TouchableOpacity style={S.btnSecondary} onPress={() => { onClose(); setValue(""); }}><Text style={S.btnSecondaryText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={[S.btnPrimary, { backgroundColor: confirmColor || C.primary }, loading && S.btnDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={C.white} size="small" /> : <Text style={S.btnPrimaryText}>{confirmLabel}</Text>}
          </TouchableOpacity>
        </View>
      </View></View>
    </Modal>
  );
}

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
      if (response.ok) {
        setComplaint(data.complaint);
      } else {
        setError(data.error || "Failed to load complaint");
      }
    } catch (err) {
      console.error("Fetch complaint error:", err);
      setError("Unable to load complaint details");
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    if (!complaint) fetchComplaint();
  }, [fetchComplaint]);

  async function handleClarify(value) {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/complaints/${complaint.id}/clarify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ response: value }),
      });
      const data = await response.json();
      if (response.ok) {
        await fetchComplaint();
        setActiveModal(null);
      } else {
        Alert.alert("Error", data.error || "Failed to submit clarification");
      }
    } catch (err) {
      Alert.alert("Error", "Unable to submit. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReopen(value) {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/complaints/${complaint.id}/reopen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: value }),
      });
      const data = await response.json();
      if (response.ok) {
        await fetchComplaint();
        setActiveModal(null);
        Alert.alert("Reopened", "Your complaint has been reopened. The caretaker will be notified.");
      } else {
        Alert.alert("Error", data.error || "Failed to reopen complaint");
      }
    } catch (err) {
      Alert.alert("Error", "Unable to reopen. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.loaderContainer}><ActivityIndicator size="large" color={C.primary} /><Text style={S.loaderText}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  if (error || !complaint) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.emptyContainer}>
          <Feather name="alert-circle" size={40} color={C.textMuted} />
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
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {saving && <View style={S.savingOverlay}><ActivityIndicator size="large" color={C.primary} /></View>}
      <ImageViewer visible={viewerOpen} imageUrl={viewerUrl} onClose={() => { setViewerOpen(false); setViewerUrl(""); }} />

      <TextActionModal visible={activeModal === "clarify"} title="Provide Clarification" subtitle={complaint.subject}
        fieldLabel="Your response" placeholder="Provide the details requested..." confirmLabel="Submit clarification" confirmColor={C.orange}
        onClose={() => setActiveModal(null)} onSubmit={handleClarify} />

      <TextActionModal visible={activeModal === "reopen"} title="Reopen Complaint" subtitle={complaint.subject}
        fieldLabel="Reason for reopening" placeholder="Explain why this complaint should be reopened..." confirmLabel="Reopen Complaint" confirmColor={C.warning}
        onClose={() => setActiveModal(null)} onSubmit={handleReopen} />

      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}><Feather name="arrow-left" size={20} color={C.textPrimary} /></TouchableOpacity>
        <Text style={S.headerTitle}>Complaint Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        <View style={S.statusRow}>
          <StatusPill status={complaint.status} />
          <View style={[S.scopeBadge, { backgroundColor: C.surfaceAlt }]}><Text style={S.scopeBadgeText}>{scopeLabel}</Text></View>
          {isAwaitingClarification && (
            <View style={[S.actionBadge, { backgroundColor: C.orangeBg }]}><Text style={{ color: C.orange, fontSize: 10, fontWeight: "700" }}>Needs your action</Text></View>
          )}
        </View>

        <Text style={S.title}>{complaint.subject}</Text>

        <Text style={S.sectionLabel}>Description</Text>
        <Text style={S.body}>{complaint.description}</Text>

        {isCommonArea && complaint.common_area_location && (
          <>
            <Text style={S.sectionLabel}>Location</Text>
            <View style={[S.infoBox, { backgroundColor: C.warningBg, borderColor: C.warning + "30" }]}>
              <Ionicons name="location" size={14} color={C.warning} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.warning, flex: 1 }]}>{complaint.common_area_location}</Text>
            </View>
          </>
        )}

        <Text style={S.sectionLabel}>Parties Involved</Text>
        <View style={[S.partiesRow, !hasAgainstParty && { justifyContent: "center" }]}>
          <View style={[S.partyCard, { backgroundColor: C.primary + "15", borderColor: C.primary + "30" }, !hasAgainstParty && { flex: 1 }]}>
            <Text style={[S.partyLabel, { color: C.primary }]}>Filed By</Text>
            <Text style={S.partyName}>{complaint.filed_by_name}</Text>
          </View>
          {hasAgainstParty && (
            <View style={[S.partyCard, { backgroundColor: C.dangerBg, borderColor: C.danger + "30" }]}>
              <Text style={[S.partyLabel, { color: C.danger }]}>Against</Text>
              <Text style={S.partyName}>{complaint.against_name}</Text>
              {complaint.against_unit_number && <Text style={S.partyUnit}>Unit {complaint.against_unit_number}</Text>}
            </View>
          )}
        </View>

        {evidence.length > 0 && (
          <>
            <Text style={S.sectionLabel}>Evidence ({evidence.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.evidenceScroll}>
              {evidence.map((item, idx) => (
                <TouchableOpacity key={item.id || idx} onPress={() => { setViewerUrl(item.document_url); setViewerOpen(true); }} style={S.evidenceThumb}>
                  <Image source={{ uri: item.document_url }} style={S.evidenceImage} />
                  <View style={S.evidenceLabel}><Text style={S.evidenceLabelText} numberOfLines={1}>{item.label || `Evidence ${idx + 1}`}</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {complaint.status === "resolved" && complaint.resolution_notes && (
          <>
            <Text style={S.sectionLabel}>Resolution</Text>
            <View style={[S.infoBox, { backgroundColor: C.successBg, borderColor: C.success + "30" }]}>
              <Ionicons name="checkmark-circle" size={16} color={C.success} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.success, flex: 1 }]}>{complaint.resolution_notes}</Text>
            </View>
          </>
        )}

        {complaint.status === "approved" && (
          <View style={[S.approvedBox, { backgroundColor: "#1e3a5f", borderColor: C.primary + "30" }]}>
            <Ionicons name="checkmark-circle" size={16} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={[S.body, { color: C.primary, flex: 1 }]}>Your complaint has been approved. The landlord will issue a verdict shortly.</Text>
          </View>
        )}

        <View style={S.detailSection}>
          <Text style={S.detailsLabel}>Details</Text>
          <View style={S.detailRow}><Text style={S.detailLabel}>Category</Text><Text style={S.detailValue}>{complaint.category?.replace(/_/g, " ")}</Text></View>
          <View style={S.detailRow}><Text style={S.detailLabel}>Scope</Text><Text style={S.detailValue}>{scopeLabel}</Text></View>
          <View style={S.detailRow}><Text style={S.detailLabel}>Severity</Text><Text style={S.detailValue}>{complaint.severity}/5</Text></View>
          <View style={S.detailRow}><Text style={S.detailLabel}>Submitted</Text><Text style={S.detailValue}>{fmtDate(complaint.created_at)}</Text></View>
        </View>

        <View style={[S.infoBox, { backgroundColor: C.surfaceAlt, borderColor: C.border, marginTop: 24 }]}>
          <Ionicons name="information-circle" size={14} color={C.textMuted} style={{ marginRight: 8 }} />
          <Text style={[S.body, { color: C.textMuted, flex: 1 }]}>Complaints are first reviewed by the caretaker. Serious or unresolved cases are escalated to the landlord.</Text>
        </View>

        {isRejected && complaint.resolution_notes && (
          <View style={[S.infoBox, { backgroundColor: C.dangerBg, borderColor: C.danger + "30", marginTop: 12 }]}>
            <Ionicons name="close-circle" size={16} color={C.danger} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}><Text style={[S.body, { color: C.danger, fontWeight: "700" }]}>Rejection Reason</Text><Text style={[S.body, { color: C.danger, marginTop: 4 }]}>{complaint.resolution_notes}</Text></View>
          </View>
        )}
      </ScrollView>

      <View style={S.footer}>
        {isAwaitingClarification && (
          <TouchableOpacity style={[S.btnAction, { backgroundColor: C.orange }]} onPress={() => setActiveModal("clarify")}>
            <Text style={S.btnActionText}>Provide Clarification</Text>
          </TouchableOpacity>
        )}

        {canReopen && (
          <TouchableOpacity style={[S.btnAction, { backgroundColor: C.warning }]} onPress={() => setActiveModal("reopen")}>
            <Ionicons name="refresh-circle" size={18} color={C.white} style={{ marginRight: 6 }} />
            <Text style={S.btnActionText}>Reopen Complaint</Text>
          </TouchableOpacity>
        )}

        {isResolved && (
          <View style={[S.btnAction, { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border }]}>
            <Text style={[S.btnActionText, { color: C.textMuted }]}>Complaint Closed</Text>
          </View>
        )}

        {!isAwaitingClarification && !isClosed && (
          <View style={[S.btnAction, { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border }]}>
            <Text style={[S.btnActionText, { color: C.textMuted }]}>Under Review</Text>
          </View>
        )}
      </View>
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
  savingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", zIndex: 100 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  scroll: { flex: 1 },
  scrollPad: { padding: 20, paddingBottom: 100 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  scopeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  scopeBadgeText: { fontSize: 10, color: C.textSecondary, fontWeight: "600" },
  refNo: { fontSize: 11, color: C.textMuted, marginLeft: "auto", fontFamily: "monospace" },
  title: { fontSize: 18, fontWeight: "800", color: C.textPrimary, marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 20 },
  detailsLabel: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 20, marginLeft: 14 },
  body: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },
  partiesRow: { flexDirection: "row", gap: 10 },
  partyCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 12 },
  partyLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  partyName: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  partyUnit: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  evidenceScroll: { marginBottom: 8 },
  evidenceThumb: { width: 120, marginRight: 8, borderRadius: 10, overflow: "hidden", backgroundColor: C.surfaceAlt },
  evidenceImage: { width: 120, height: 100, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  evidenceLabel: { padding: 6 },
  evidenceLabelText: { fontSize: 10, color: C.textSecondary },
  infoBox: { flexDirection: "row", alignItems: "flex-start", borderRadius: 10, borderWidth: 1, padding: 14 },
   approvedBox: { flexDirection: "row", alignItems: "flex-start", borderRadius: 10, borderWidth: 1, padding: 14 , marginTop: 15},
  detailSection: { marginTop: 24, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel: { fontSize: 13, color: C.textSecondary },
  detailValue: { fontSize: 13, fontWeight: "600", color: C.textPrimary, textTransform: "capitalize" },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  btnAction: { paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  btnActionText: { color: C.white, fontSize: 14, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border },
  sheetHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary, marginBottom: 4 },
  sheetSub: { fontSize: 12, color: C.textSecondary, marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", marginBottom: 6 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.textPrimary },
  textarea: { minHeight: 100, paddingTop: 11 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14 },
  btnPrimary: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  btnPrimaryText: { color: C.white, fontSize: 14, fontWeight: "700" },
  btnSecondary: { flex: 1, backgroundColor: C.surfaceAlt, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  btnSecondaryText: { color: C.textPrimary, fontSize: 14, fontWeight: "600" },
  btnDisabled: { opacity: 0.5 },
  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
  viewerImage: { width: "100%", height: "80%" },
});