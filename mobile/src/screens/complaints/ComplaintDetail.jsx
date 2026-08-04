// TENANT COMPLAINT DETAIL SCREEN 
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, 
  StyleSheet, StatusBar, Image, Modal, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
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
  open:                   { label: "Open",               color: C.redLight,  bg: "rgba(224,90,74,0.08)", icon: "alert-circle" },
  under_review:           { label: "Under Review",       color: C.gold,      bg: "rgba(232,160,18,0.06)", icon: "search" },
  awaiting_clarification: { label: "Needs Clarification",color: C.orange,    bg: "rgba(249,115,22,0.08)", icon: "help-circle" },
  approved:               { label: "Approved",           color: C.blue,      bg: "rgba(58,143,212,0.08)", icon: "thumbs-up" },
  resolved:               { label: "Resolved",           color: C.greenLight,bg: "rgba(26,122,74,0.08)", icon: "checkmark-circle" },
  rejected:               { label: "Rejected",           color: "rgba(245,240,232,0.4)", bg: "rgba(245,240,232,0.04)", icon: "close-circle" },
  escalated:              { label: "Escalated",          color: C.purple,    bg: "rgba(139,92,246,0.08)", icon: "trending-up" },
  dismissed:              { label: "Dismissed",          color: "rgba(245,240,232,0.4)", bg: "rgba(245,240,232,0.04)", icon: "archive" },
};

const CATEGORY_CONFIG = {
  noise:              { label: "Noise",              icon: "volume-high",    color: C.orange },
  cleanliness:        { label: "Cleanliness",        icon: "sparkles",       color: C.greenLight },
  neighbor_dispute:   { label: "Neighbor Dispute",   icon: "people",         color: C.purple },
  parking:            { label: "Parking",            icon: "car",            color: C.blue },
  security:           { label: "Security",           icon: "shield",         color: C.redLight },
  pets:               { label: "Pets",               icon: "paw",            color: "#84CC16" },
  smoking:            { label: "Smoking",            icon: "flame",          color: "#F97316" },
  property_damage:    { label: "Property Damage",    icon: "hammer",         color: C.redLight },
  maintenance_issue:  { label: "Maintenance",        icon: "build",          color: C.gold },
  other:              { label: "Other",              icon: "ellipsis-horizontal", color: "rgba(245,240,232,0.4)" },
};

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit / Tenant",
  common_area: "Common Area",
  unknown: "Unknown / General",
  property_wide: "Property-Wide Issue",
};

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
      <Ionicons name={cfg.icon} size={10} color={cfg.color} style={{ marginRight: 3 }} />
      <Text style={[S.pillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function CategoryBadge({ category }) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;
  return (
    <View style={[S.catBadge, { borderColor: cfg.color + "30" }]}>
      <Ionicons name={cfg.icon} size={12} color={cfg.color} />
      <Text style={[S.catBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function SeverityBar({ severity }) {
  const max = 5;
  const color = severity >= 4 ? C.redLight : severity >= 3 ? C.orange : C.gold;
  return (
    <View style={S.severityRow}>
      {Array.from({ length: max }, (_, i) => (
        <View 
          key={i} 
          style={[
            S.severityDot, 
            { backgroundColor: i < severity ? color : C.border }
          ]} 
        />
      ))}
      <Text style={[S.severityLabel, { color }]}>
        {severity === 1 ? "Minor" : severity === 2 ? "Low" : severity === 3 ? "Moderate" : severity === 4 ? "High" : "Critical"}
      </Text>
    </View>
  );
}

function fmtDate(dateValue) {
  if (!dateValue) return "—";
  return new Date(dateValue).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(dateValue) {
  if (!dateValue) return "—";
  return new Date(dateValue).toLocaleDateString("en-ZA", { 
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function getFullUrl(url) { 
  if (!url) return ""; 
  if (url.startsWith("http")) return url; 
  return `${api.getBaseUrl()}${url}`; 
}

function ImageViewer({ visible, imageUrl, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={S.viewerOverlay}>
        <TouchableOpacity style={S.viewerClose} onPress={onClose}>
          <Feather name="x" size={26} color={C.white} />
        </TouchableOpacity>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={S.viewerImage} resizeMode="contain" />
        ) : null}
      </View>
    </Modal>
  );
}

function TextActionModal({ visible, title, subtitle, fieldLabel, placeholder, confirmLabel, confirmColor, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() { 
    if (!value.trim()) return; 
    setLoading(true); 
    await onSubmit(value.trim()); 
    setLoading(false); 
    setValue(""); 
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={S.overlay}><View style={S.sheet}>
        <View style={S.sheetHandle} />
        <Text style={S.sheetTitle}>{title}</Text>
        <Text style={S.sheetSub}>{subtitle}</Text>
        <View style={S.inputGroup}>
          <Text style={S.inputLabel}>{fieldLabel}</Text>
          <TextInput 
            style={[$input, S.textarea]} 
            value={value} 
            onChangeText={setValue} 
            placeholder={placeholder} 
            placeholderTextColor="rgba(245,240,232,0.15)" 
            multiline 
            numberOfLines={4} 
            textAlignVertical="top" 
          />
        </View>
        <View style={S.modalActions}>
          <TouchableOpacity style={[$btnGhost, { flex: 1 }]} onPress={() => { onClose(); setValue(""); }}>
            <Text style={S.btnGhostText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[$btnGold, { flex: 1, backgroundColor: confirmColor || C.gold }, loading && { opacity: 0.5 }]} 
            onPress={handleSubmit} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={C.black} size="small" /> : <Text style={S.btnGoldText}>{confirmLabel}</Text>}
          </TouchableOpacity>
        </View>
      </View></View>
    </Modal>
  );
}

function ConfirmModal({ visible, title, message, confirmLabel, confirmColor, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  
  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }
  
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={S.overlayCenter}>
        <View style={S.confirmSheet}>
          <Ionicons name="warning" size={32} color={confirmColor || C.gold} style={{ marginBottom: 12 }} />
          <Text style={S.confirmTitle}>{title}</Text>
          <Text style={S.confirmMessage}>{message}</Text>
          <View style={S.modalActions}>
            <TouchableOpacity style={[$btnGhost, { flex: 1 }]} onPress={onClose}>
              <Text style={S.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[$btnGold, { flex: 1, backgroundColor: confirmColor || C.gold }, loading && { opacity: 0.5 }]} 
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={C.black} size="small" /> : <Text style={S.btnGoldText}>{confirmLabel}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
        method: "PUT", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) { 
        await fetchComplaint(); 
        setActiveModal(null); 
        if (successMsg) Alert.alert("Success", successMsg); 
      }
      else Alert.alert("Error", data.error || "Failed");
    } catch (err) { 
      Alert.alert("Error", "Unable to complete. Please try again."); 
    }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.center}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={S.loaderText}>Loading complaint...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error || !complaint) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.center}>
          <Feather name="alert-circle" size={40} color="rgba(245,240,232,0.15)" />
          <Text style={S.emptyText}>{error || "Complaint not found"}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={S.backLink}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const evidence = complaint.evidence || [];
  const catCfg = CATEGORY_CONFIG[complaint.category] ?? CATEGORY_CONFIG.other;
  const statusCfg = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG.open;
  const isSpecificTenant = complaint.complaint_scope === "specific_tenant";
  const isCommonArea = complaint.complaint_scope === "common_area";
  const hasAgainstParty = isSpecificTenant && complaint.against_name;
  const scopeLabel = SCOPE_LABELS[complaint.complaint_scope] || "Unknown";
  const isAwaitingClarification = complaint.status === "awaiting_clarification";
  const isResolved = complaint.status === "resolved";
  const isRejected = complaint.status === "rejected";
  const isDismissed = complaint.status === "dismissed";
  const isEscalated = complaint.status === "escalated";
  const isClosed = isResolved || isRejected || isDismissed;
  const canReopen = isRejected || isDismissed || isResolved;
  const hasVerdict = complaint.verdict && complaint.verdict.verdict_type;
  const hasClarificationRequest = isAwaitingClarification && complaint.clarification_notes;

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      {saving && <View style={S.savingOverlay}><ActivityIndicator size="large" color={C.gold} /></View>}
      <ImageViewer visible={viewerOpen} imageUrl={viewerUrl} onClose={() => { setViewerOpen(false); setViewerUrl(""); }} />

      <TextActionModal 
        visible={activeModal === "clarify"} 
        title="Provide Clarification" 
        subtitle={complaint.subject}
        fieldLabel="Your response" 
        placeholder="Provide the details requested by the caretaker..." 
        confirmLabel="Submit" 
        confirmColor={C.orange}
        onClose={() => setActiveModal(null)} 
        onSubmit={(v) => handleAction("/clarify", { response: v }, "Clarification submitted successfully")} 
      />

      <TextActionModal 
        visible={activeModal === "reopen"} 
        title="Reopen Complaint" 
        subtitle={complaint.subject}
        fieldLabel="Reason for reopening" 
        placeholder="Explain why this complaint should be reopened..." 
        confirmLabel="Reopen" 
        confirmColor={C.gold}
        onClose={() => setActiveModal(null)} 
        onSubmit={(v) => handleAction("/reopen", { reason: v }, "Complaint reopened. The caretaker has been notified.")} 
      />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={C.white} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Complaint Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        {/* ACTION BANNER */}
        {isAwaitingClarification && (
          <View style={[S.actionBanner, { backgroundColor: "rgba(249,115,22,0.08)", borderColor: "rgba(249,115,22,0.2)" }]}>
            <Ionicons name="warning" size={18} color={C.orange} />
            <View style={{ flex: 1 }}>
              <Text style={[S.actionBannerTitle, { color: C.orange }]}>Action Required</Text>
              <Text style={[S.actionBannerText, { color: C.orange }]}>
                The caretaker needs more information from you.
              </Text>
            </View>
          </View>
        )}

        {/* STATUS ROW */}
        <View style={S.statusRow}>
          <View style={[S.catIcon, { backgroundColor: catCfg.color + "15", borderColor: catCfg.color + "25" }]}>
            <Ionicons name={catCfg.icon} size={16} color={catCfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.title}>{complaint.subject}</Text>
            <View style={S.metaRow}>
              <Text style={S.metaText}>{catCfg.label}</Text>
              <Text style={S.metaDot}>·</Text>
              <Text style={S.metaText}>{scopeLabel}</Text>
              <Text style={S.metaDot}>·</Text>
              <Text style={S.metaText}>{fmtDate(complaint.created_at)}</Text>
            </View>
          </View>
          <StatusPill status={complaint.status} />
        </View>

        {/* SEVERITY */}
        <SeverityBar severity={complaint.severity || 3} />

        {/* DESCRIPTION */}
        <Text style={S.sectionLabel}>DESCRIPTION</Text>
        <View style={S.descriptionBox}>
          <Text style={S.body}>{complaint.description}</Text>
        </View>

        {/* LOCATION - Common Area */}
        {isCommonArea && complaint.common_area_location && (
          <>
            <Text style={S.sectionLabel}>LOCATION</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(232,160,18,0.06)", borderColor: "rgba(232,160,18,0.15)" }]}>
              <Ionicons name="location" size={15} color={C.gold} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.gold, flex: 1 }]}>{complaint.common_area_location}</Text>
            </View>
          </>
        )}

        {/* CLARIFICATION NOTES - What caretaker asked */}
        {hasClarificationRequest && (
          <>
            <Text style={[S.sectionLabel, { color: C.orange }]}>CLARIFICATION REQUESTED</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(249,115,22,0.06)", borderColor: "rgba(249,115,22,0.15)" }]}>
              <Ionicons name="help-circle" size={15} color={C.orange} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.orange, flex: 1 }]}>{complaint.clarification_notes}</Text>
            </View>
          </>
        )}

        {/* PARTIES */}
        <Text style={S.sectionLabel}>PARTIES INVOLVED</Text>
        <View style={[S.partiesRow, !hasAgainstParty && { justifyContent: "center" }]}>
          <View style={[S.partyCard, { backgroundColor: "rgba(58,143,212,0.06)", borderColor: "rgba(58,143,212,0.15)" }, !hasAgainstParty && { flex: 1 }]}>
            <Text style={[S.partyLabel, { color: C.blue }]}>Filed By</Text>
            <Text style={S.partyName}>{complaint.filed_by_name || "You"}</Text>
            <Text style={S.partySub}>Tenant</Text>
          </View>
          {hasAgainstParty && (
            <View style={[S.partyCard, { backgroundColor: "rgba(224,90,74,0.06)", borderColor: "rgba(224,90,74,0.15)" }]}>
              <Text style={[S.partyLabel, { color: C.redLight }]}>Against</Text>
              <Text style={S.partyName}>{complaint.against_name}</Text>
              {complaint.against_unit_number && (
                <Text style={S.partySub}>Unit {complaint.against_unit_number}</Text>
              )}
            </View>
          )}
        </View>

        {/* PROPERTY */}
        {complaint.property_name && (
          <>
            <Text style={S.sectionLabel}>PROPERTY</Text>
            <View style={[S.infoBox, { backgroundColor: C.muted2, borderColor: C.border }]}>
              <Ionicons name="business" size={15} color="rgba(245,240,232,0.3)" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[S.body, { color: C.white, fontWeight: "600" }]}>{complaint.property_name}</Text>
                {complaint.property_address && (
                  <Text style={[S.body, { fontSize: 11, marginTop: 2 }]}>{complaint.property_address}</Text>
                )}
              </View>
            </View>
          </>
        )}

        {/* EVIDENCE */}
        {evidence.length > 0 && (
          <>
            <Text style={S.sectionLabel}>EVIDENCE ({evidence.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.evidenceScroll}>
              {evidence.map((item, idx) => (
                <TouchableOpacity 
                  key={item.id || idx} 
                  onPress={() => { setViewerUrl(getFullUrl(item.document_url)); setViewerOpen(true); }} 
                  style={S.evidenceThumb}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: getFullUrl(item.document_url) }} style={S.evidenceImage} />
                  <View style={S.evidenceLabel}>
                    <Text style={S.evidenceLabelText} numberOfLines={1}>
                      {item.label || `Evidence ${idx + 1}`}
                    </Text>
                  </View>
                  <View style={S.evidenceBadge}>
                    <Text style={S.evidenceBadgeText}>{idx + 1}/{evidence.length}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* VERDICT*/}
        {hasVerdict && (
          <>
            <Text style={S.sectionLabel}>VERDICT</Text>
            <View style={[
              S.verdictCard,
              complaint.verdict.verdict_type === "dismissed" 
                ? { backgroundColor: "rgba(245,240,232,0.03)", borderColor: "rgba(245,240,232,0.12)" }
                : complaint.verdict.verdict_type === "warning"
                ? { backgroundColor: "rgba(232,160,18,0.06)", borderColor: "rgba(232,160,18,0.15)" }
                : { backgroundColor: "rgba(224,90,74,0.06)", borderColor: "rgba(224,90,74,0.15)" }
            ]}>
              <View style={S.verdictHeader}>
                <MaterialIcons 
                  name={complaint.verdict.verdict_type === "dismissed" ? "gavel" : "warning"} 
                  size={18} 
                  color={
                    complaint.verdict.verdict_type === "dismissed" ? "rgba(245,240,232,0.5)" 
                    : complaint.verdict.verdict_type === "warning" ? C.gold 
                    : C.redLight
                  } 
                />
                <View style={{ flex: 1 }}>
                  <Text style={[
                    S.verdictTitle,
                    { color: complaint.verdict.verdict_type === "dismissed" ? "rgba(245,240,232,0.5)" : C.gold }
                  ]}>
                    {complaint.verdict.verdict_type === "warning" && "Warning Issued"}
                    {complaint.verdict.verdict_type === "fine" && "Fine Issued"}
                    {complaint.verdict.verdict_type === "dismissed" && "Complaint Dismissed"}
                  </Text>
                </View>
                {complaint.verdict.verdict_type === "fine" && (
                  <Text style={S.verdictAmount}>
                    R {Number(complaint.verdict.fine_amount).toLocaleString('en-ZA')}
                  </Text>
                )}
              </View>
              {complaint.verdict.notes && (
                <Text style={[S.body, { color: "rgba(245,240,232,0.5)", marginTop: 8, fontSize: 12 }]}>
                  {complaint.verdict.notes}
                </Text>
              )}
              {complaint.verdict.issued_at && (
                <Text style={[S.metaText, { marginTop: 8, fontSize: 10 }]}>
                  Issued {fmtDateTime(complaint.verdict.issued_at)}
                </Text>
              )}
            </View>
          </>
        )}

        {/* RESOLUTION NOTES */}
        {isResolved && complaint.resolution_notes && (
          <>
            <Text style={S.sectionLabel}>RESOLUTION</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(26,122,74,0.06)", borderColor: "rgba(76,186,122,0.15)" }]}>
              <Ionicons name="checkmark-circle" size={15} color={C.greenLight} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.greenLight, flex: 1 }]}>{complaint.resolution_notes}</Text>
            </View>
          </>
        )}

        {/* ESCALATION INFO */}
        {isEscalated && (
          <>
            <Text style={[S.sectionLabel, { color: C.purple }]}>ESCALATED</Text>
            <View style={[S.infoBox, { backgroundColor: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.15)" }]}>
              <Ionicons name="trending-up" size={15} color={C.purple} style={{ marginRight: 8 }} />
              <Text style={[S.body, { color: C.purple, flex: 1 }]}>
                This complaint has been escalated to the landlord for review. You will be notified when a decision is made.
              </Text>
            </View>
          </>
        )}

        {/* APPROVED BANNER */}
        {complaint.status === "approved" && (
          <View style={[S.infoBox, { backgroundColor: "rgba(58,143,212,0.06)", borderColor: "rgba(58,143,212,0.15)", marginTop: 14 }]}>
            <Ionicons name="checkmark-circle" size={15} color={C.blue} style={{ marginRight: 8 }} />
            <Text style={[S.body, { color: C.blue, flex: 1 }]}>
              Your complaint has been approved. The landlord will issue a verdict shortly.
            </Text>
          </View>
        )}

        {/* DETAILS TABLE */}
        <View style={S.detailSection}>
          <Text style={S.detailSectionLabel}>DETAILS</Text>
          <View style={S.detailRow}>
            <Text style={S.detailLabel}>Category</Text>
            <CategoryBadge category={complaint.category} />
          </View>
          <View style={S.detailRow}>
            <Text style={S.detailLabel}>Scope</Text>
            <Text style={S.detailValue}>{scopeLabel}</Text>
          </View>
          <View style={S.detailRow}>
            <Text style={S.detailLabel}>Severity</Text>
            <Text style={S.detailValue}>{complaint.severity || 3}/5</Text>
          </View>
          <View style={S.detailRow}>
            <Text style={S.detailLabel}>Submitted</Text>
            <Text style={S.detailValue}>{fmtDate(complaint.created_at)}</Text>
          </View>
          {complaint.resolved_at && (
            <View style={S.detailRow}>
              <Text style={S.detailLabel}>Resolved</Text>
              <Text style={S.detailValue}>{fmtDate(complaint.resolved_at)}</Text>
            </View>
          )}
        </View>

        {/* REJECTION REASON */}
        {isRejected && complaint.resolution_notes && (
          <View style={[S.infoBox, { backgroundColor: "rgba(224,90,74,0.06)", borderColor: "rgba(224,90,74,0.15)", marginTop: 12 }]}>
            <Ionicons name="close-circle" size={15} color={C.redLight} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[S.body, { color: C.redLight, fontWeight: "700", fontFamily: F.dm, fontSize: 12 }]}>
                Rejection Reason
              </Text>
              <Text style={[S.body, { color: C.redLight, marginTop: 4, fontSize: 12 }]}>
                {complaint.resolution_notes}
              </Text>
            </View>
          </View>
        )}

        {/* PROCESS INFO */}
        {!isClosed && (
          <View style={[S.infoBox, { backgroundColor: C.muted2, borderColor: C.border, marginTop: 20 }]}>
            <Ionicons name="information-circle" size={13} color="rgba(245,240,232,0.3)" style={{ marginRight: 8 }} />
            <Text style={[S.body, { color: "rgba(245,240,232,0.4)", flex: 1, fontSize: 11 }]}>
              Complaints are first reviewed by the caretaker. Serious or unresolved cases are escalated to the landlord for final decision.
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={S.footer}>
        {isAwaitingClarification && (
          <TouchableOpacity 
            style={[$btnGold, { flex: 1, backgroundColor: C.orange }]} 
            onPress={() => setActiveModal("clarify")}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={14} color={C.black} />
            <Text style={S.btnGoldText}>Provide Clarification</Text>
          </TouchableOpacity>
        )}
        {canReopen && (
          <TouchableOpacity 
            style={[$btnGold, { flex: 1 }]} 
            onPress={() => setActiveModal("reopen")}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={14} color={C.black} />
            <Text style={S.btnGoldText}>Reopen Complaint</Text>
          </TouchableOpacity>
        )}
        {isResolved && !canReopen && (
          <View style={[$btnGhost, { flex: 1, borderColor: "rgba(76,186,122,0.3)" }]}>
            <Ionicons name="checkmark-circle" size={14} color={C.greenLight} style={{ marginRight: 6 }} />
            <Text style={{ color: C.greenLight, fontFamily: F.dm, fontWeight: "700", fontSize: 12 }}>
              Resolved
            </Text>
          </View>
        )}
        {!isAwaitingClarification && !isClosed && (
          <View style={[$btnGhost, { flex: 1 }]}>
            <Ionicons name="time" size={14} color="rgba(245,240,232,0.3)" style={{ marginRight: 6 }} />
            <Text style={S.btnGhostText}>Under Review</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loaderText: { fontSize: 13, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },
  emptyText: { fontSize: 15, color: "rgba(245,240,232,0.4)", fontFamily: F.dm, textAlign: "center", paddingHorizontal: 40 },
  backLink: { fontSize: 13, color: C.gold, fontWeight: "600", fontFamily: F.mono, marginTop: 6 },
  savingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", zIndex: 100 },

  header: { 
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", 
    paddingHorizontal: 14, paddingVertical: 12, 
    backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border 
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollPad: { padding: 16, paddingBottom: 120 },

  // Action banner
  actionBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 6, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  actionBannerTitle: { fontSize: 13, fontWeight: "700", fontFamily: F.dm, marginBottom: 2 },
  actionBannerText: { fontSize: 11, fontFamily: F.dm, opacity: 0.8 },

  // Status row
  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  catIcon: { 
    width: 38, height: 38, borderRadius: 8, 
    alignItems: "center", justifyContent: "center", borderWidth: 1 
  },
  title: { fontSize: 16, fontWeight: "600", color: C.white, fontFamily: F.dm, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  metaText: { fontSize: 10, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },
  metaDot: { fontSize: 10, color: "rgba(245,240,232,0.15)", marginHorizontal: 2 },

  // Severity
  severityRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 18 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  severityLabel: { fontSize: 10, fontWeight: "600", fontFamily: F.mono, marginLeft: 6, textTransform: "uppercase", letterSpacing: 0.5 },

  sectionLabel: { 
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)", 
    fontFamily: F.mono, letterSpacing: 2, marginBottom: 8, marginTop: 20, textTransform: "uppercase" 
  },
  descriptionBox: { 
    backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12 
  },
  body: { fontSize: 13, color: "rgba(245,240,232,0.55)", lineHeight: 21, fontFamily: F.dm },

  // Parties
  partiesRow: { flexDirection: "row", gap: 8 },
  partyCard: { flex: 1, borderRadius: 4, borderWidth: 1, padding: 12 },
  partyLabel: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: F.mono },
  partyName: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  partySub: { fontSize: 10, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, marginTop: 2 },

  // Evidence
  evidenceScroll: { marginBottom: 4 },
  evidenceThumb: { 
    width: 120, marginRight: 8, borderRadius: 4, 
    overflow: "hidden", backgroundColor: C.muted, position: "relative" 
  },
  evidenceImage: { width: 120, height: 95 },
  evidenceLabel: { padding: 6 },
  evidenceLabelText: { fontSize: 9, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },
  evidenceBadge: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3,
  },
  evidenceBadgeText: { fontSize: 8, color: C.white, fontFamily: F.mono },

  // Verdict
  verdictCard: { borderRadius: 6, borderWidth: 1, padding: 14 },
  verdictHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  verdictTitle: { fontSize: 14, fontWeight: "700", fontFamily: F.dm },
  verdictAmount: { fontSize: 16, fontWeight: "700", color: C.redLight, fontFamily: F.bebas, letterSpacing: 0.5 },

  // Info box
  infoBox: { flexDirection: "row", alignItems: "flex-start", borderRadius: 4, borderWidth: 1, padding: 12 },

  // Details
  detailSection: { 
    marginTop: 20, backgroundColor: C.muted2, borderRadius: 6, 
    borderWidth: 1, borderColor: C.border, overflow: "hidden" 
  },
  detailSectionLabel: { 
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)", 
    fontFamily: F.mono, letterSpacing: 2, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 
  },
  detailRow: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10, 
    borderBottomWidth: 1, borderBottomColor: C.border 
  },
  detailLabel: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono },
  detailValue: { fontSize: 12, fontWeight: "600", color: C.white, fontFamily: F.dm, textTransform: "capitalize" },

  // Category badge
  catBadge: { 
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, borderWidth: 1 
  },
  catBadgeText: { fontSize: 10, fontWeight: "600", fontFamily: F.mono, textTransform: "uppercase" },

  // Pills
  pill: { 
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 
  },
  pillText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", fontFamily: F.mono, letterSpacing: 1 },

  // Footer
  footer: { 
    padding: 14, borderTopWidth: 1, borderTopColor: C.border, 
    backgroundColor: C.muted2, flexDirection: "row", gap: 10 
  },
  btnGoldText: { fontSize: 12, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
  btnGhostText: { fontSize: 12, fontWeight: "500", color: "rgba(245,240,232,0.5)", fontFamily: F.dm, letterSpacing: 0.5 },

  // Modals
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  overlayCenter: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 24 },
  sheet: { 
    backgroundColor: C.muted2, borderTopLeftRadius: 12, borderTopRightRadius: 12, 
    padding: 20, paddingBottom: 36, borderTopWidth: 1, borderColor: C.border 
  },
  confirmSheet: {
    backgroundColor: C.muted2, borderRadius: 8, padding: 24,
    borderWidth: 1, borderColor: C.border, width: "100%", maxWidth: 340,
    alignItems: "center",
  },
  confirmTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 6 },
  confirmMessage: { fontSize: 13, color: "rgba(245,240,232,0.5)", fontFamily: F.dm, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  sheetHandle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 2 },
  sheetSub: { fontSize: 11, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)", fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  textarea: { minHeight: 90, paddingTop: 12 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14 },

  // Viewer
  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  viewerClose: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
  viewerImage: { width: "100%", height: "80%" },
});