import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
  Image, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uploadComplaintEvidence } from "../../utils/upload";
import api from "../../utils/api";

const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

const COMPLAINT_CATEGORIES = [
  { id: "noise", label: "Noise", icon: "volume-high", color: "#F59E0B", desc: "Loud music, shouting, parties" },
  { id: "cleanliness", label: "Cleanliness", icon: "trash", color: "#22C55E", desc: "Trash, mess, hygiene issues" },
  { id: "neighbor_dispute", label: "Neighbor Dispute", icon: "people", color: "#3B82F6", desc: "Arguments, harassment, intimidation" },
  { id: "parking", label: "Parking", icon: "car", color: "#5c7df6", desc: "Blocked spots, unauthorized vehicles" },
  { id: "security", label: "Security", icon: "shield", color: "#EF4444", desc: "Suspicious activity, break-ins, theft" },
  { id: "pets", label: "Pets", icon: "paw", color: "#48ecb5", desc: "Barking, mess, aggressive animals" },
  { id: "smoking", label: "Smoking", icon: "flame", color: "#FF2D55", desc: "Smoking in non-smoking areas" },
  { id: "property_damage", label: "Property Damage", icon: "hammer", color: "#F97316", desc: "Damage to property, fixtures, common areas" },
  { id: "maintenance_issue", label: "Maintenance Issue", icon: "construct", color: "#06b6d4", desc: "Unresolved maintenance affecting others" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal", color: C.textMuted, desc: "Anything not listed above" },
];

const COMPLAINT_SCOPES = [
  { id: "specific_tenant", label: "Specific Unit / Tenant", icon: "home", color: C.primary, desc: "You know which unit or tenant is responsible" },
  { id: "common_area", label: "Common Area", icon: "business", color: C.warning, desc: "Issue in hallway, parking, stairwell, garden, etc." },
  { id: "unknown", label: "Unknown / General", icon: "help-circle", color: C.textMuted, desc: "Not sure who is responsible or general concern" },
  { id: "property_wide", label: "Property-Wide Issue", icon: "globe", color: C.danger, desc: "Issue affecting the entire property" },
];

const COMMON_AREAS = [
  "Hallway / Corridor", "Stairwell", "Parking Area", "Garden / Yard",
  "Laundry Room", "Entrance / Lobby", "Elevator", "Bin Room / Refuse Area",
  "Roof / Balcony (shared)", "Other Common Area",
];

export default function ComplaintNew() {
  const navigation = useNavigation();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [scope, setScope] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [commonArea, setCommonArea] = useState("");
  const [availableUnits, setAvailableUnits] = useState([]);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDesc] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAvailableUnits();
  }, []);

  async function fetchAvailableUnits() {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/units/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setAvailableUnits(data.units || []);
    } catch (err) {
      console.error("Fetch available units error:", err);
    }
  }

  async function pickImage() {
    if (images.length >= 3) { Alert.alert("Limit Reached", "You can attach up to 3 photos."); return; }
    Alert.alert("Add Evidence", "Choose source", [
      {
        text: "Camera",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) { Alert.alert("Permission Required", "Camera permission is needed."); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
          if (!result.canceled && result.assets?.length > 0) setImages(prev => [...prev, result.assets[0]]);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) { Alert.alert("Permission Required", "Gallery permission is needed."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: 3 - images.length });
          if (!result.canceled && result.assets?.length > 0) setImages(prev => [...prev, ...result.assets].slice(0, 3));
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function removeImage(index) { setImages(prev => prev.filter((_, i) => i !== index)); }
  function chooseCategory(cat) { setCategory(cat); setStep(2); }
  function chooseScope(scopeItem) { setScope(scopeItem); setSelectedUnit(null); setCommonArea(""); setErrors({}); setStep(3); }

  function validate() {
    const e = {};
    if (!subject.trim()) e.subject = "Subject is required";
    if (!description.trim()) e.description = "Please describe the complaint";
    if (scope?.id === "specific_tenant" && !selectedUnit) e.unit = "Please select a unit";
    if (scope?.id === "common_area" && !commonArea) e.area = "Please select an area";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      let uploadedPhotos = [];
      if (images.length > 0) {
        setUploading(true);
        uploadedPhotos = await uploadComplaintEvidence(images);
        setUploading(false);
      }

      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category: category.id,
          complaint_scope: scope.id,
          against_unit_number: scope.id === "specific_tenant" ? String(selectedUnit.unit_number) : null,
          common_area_location: scope.id === "common_area" ? commonArea : null,
          evidence: uploadedPhotos,  // ← ADD THIS LINE
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Complaint Submitted", "Your complaint has been logged and is under review.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        throw new Error(data.error || "Failed to submit complaint");
      }
    } catch (err) {
      console.error("Submit complaint error:", err);
      Alert.alert("Error", err.message || "Unable to submit complaint. Please try again.");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  if (step === 1) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}><Feather name="arrow-left" size={20} color={C.textPrimary} /></TouchableOpacity>
          <Text style={S.headerTitle}>Log Complaint</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          <Text style={S.stepTitle}>What type of complaint?</Text>
          <View style={S.catGrid}>
            {COMPLAINT_CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.id} style={[S.catTile, { borderColor: cat.color + "25" }]} onPress={() => chooseCategory(cat)} activeOpacity={0.75}>
                <View style={[S.catIcon, { backgroundColor: cat.color + "18" }]}><Ionicons name={cat.icon} size={26} color={cat.color} /></View>
                <Text style={S.catLabel}>{cat.label}</Text>
                <Text style={S.catDesc}>{cat.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep(1)} style={S.backBtn}><Feather name="arrow-left" size={20} color={C.textPrimary} /></TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <View style={[S.catIconSmall, { backgroundColor: category.color + "18" }]}><Ionicons name={category.icon} size={16} color={category.color} /></View>
            <Text style={S.headerTitle}>{category.label}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.closeBtn}><Feather name="x" size={18} color={C.textMuted} /></TouchableOpacity>
        </View>
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          <Text style={S.stepTitle}>Who or what is this about?</Text>
          <Text style={S.stepSub}>This helps us route your complaint correctly</Text>
          <View style={{ gap: 10 }}>
            {COMPLAINT_SCOPES.map(scopeItem => (
              <TouchableOpacity key={scopeItem.id} style={[S.scopeTile, { borderColor: C.border }]} onPress={() => chooseScope(scopeItem)} activeOpacity={0.75}>
                <View style={[S.scopeIcon, { backgroundColor: scopeItem.color + "18" }]}><Ionicons name={scopeItem.icon} size={22} color={scopeItem.color} /></View>
                <View style={{ flex: 1 }}><Text style={S.scopeLabel}>{scopeItem.label}</Text><Text style={S.scopeDesc}>{scopeItem.desc}</Text></View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <Modal visible={showUnitPicker} animationType="slide" transparent>
        <View style={S.modalOverlay}><View style={S.modalSheet}>
          <View style={S.modalHandle} />
          <View style={S.modalHeader}><Text style={S.modalTitle}>Select Unit</Text><TouchableOpacity onPress={() => setShowUnitPicker(false)}><Feather name="x" size={20} color={C.textMuted} /></TouchableOpacity></View>
          <ScrollView style={{ maxHeight: 300 }}>
            {availableUnits.map((unit, idx) => (
              <TouchableOpacity key={idx} style={[S.unitOption, selectedUnit?.unit_number === unit.unit_number && S.unitOptionActive]} onPress={() => { setSelectedUnit(unit); setShowUnitPicker(false); setErrors(e => ({ ...e, unit: undefined })); }}>
                <View style={S.unitOptionLeft}><Ionicons name="home" size={16} color={C.primary} /><View><Text style={S.unitOptionTitle}>Unit {unit.unit_number}</Text></View></View>
                {unit.tenant_name && <Text style={S.unitOptionTenant}>{unit.tenant_name}</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View></View>
      </Modal>

      <Modal visible={showAreaPicker} animationType="slide" transparent>
        <View style={S.modalOverlay}><View style={S.modalSheet}>
          <View style={S.modalHandle} />
          <View style={S.modalHeader}><Text style={S.modalTitle}>Select Area</Text><TouchableOpacity onPress={() => setShowAreaPicker(false)}><Feather name="x" size={20} color={C.textMuted} /></TouchableOpacity></View>
          <ScrollView style={{ maxHeight: 300 }}>
            {COMMON_AREAS.map((area, idx) => (
              <TouchableOpacity key={idx} style={[S.unitOption, commonArea === area && S.unitOptionActive]} onPress={() => { setCommonArea(area); setShowAreaPicker(false); setErrors(e => ({ ...e, area: undefined })); }}>
                <View style={S.unitOptionLeft}><Ionicons name="business" size={16} color={C.primary} /><Text style={S.unitOptionTitle}>{area}</Text></View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View></View>
      </Modal>

      <View style={S.header}>
        <TouchableOpacity onPress={() => setStep(2)} style={S.backBtn}><Feather name="arrow-left" size={20} color={C.textPrimary} /></TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={[S.catIconSmall, { backgroundColor: category.color + "18" }]}><Ionicons name={category.icon} size={16} color={category.color} /></View>
          <Text style={S.headerTitle} numberOfLines={1}>{category.label} · {scope?.label}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.closeBtn}><Feather name="x" size={18} color={C.textMuted} /></TouchableOpacity>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {uploading && (
          <View style={S.uploadingBanner}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={S.uploadingText}>Uploading evidence...</Text>
          </View>
        )}

        <View style={S.scopeSummary}>
          <View style={[S.scopeBadge, { backgroundColor: scope?.color + "18" }]}><Ionicons name={scope?.icon} size={14} color={scope?.color} /><Text style={[S.scopeBadgeText, { color: scope?.color }]}>{scope?.label}</Text></View>
          <TouchableOpacity onPress={() => setStep(2)}><Text style={S.changeLink}>Change</Text></TouchableOpacity>
        </View>

        {scope?.id === "specific_tenant" && (
          <>
            <Text style={S.label}>Which Unit? *</Text>
            <TouchableOpacity style={[S.selectBtn, errors.unit && S.selectBtnErr]} onPress={() => setShowUnitPicker(true)}>
              <Ionicons name="home" size={18} color={selectedUnit ? C.primary : C.textMuted} />
              <Text style={[S.selectBtnText, selectedUnit && { color: C.textPrimary }]}>{selectedUnit ? `Unit ${selectedUnit.unit_number} — ${selectedUnit.tenant_name || "Unknown"}` : "Tap to select a unit"}</Text>
              <Ionicons name="chevron-down" size={14} color={C.textMuted} />
            </TouchableOpacity>
            {errors.unit && <Text style={S.error}>{errors.unit}</Text>}
          </>
        )}

        {scope?.id === "common_area" && (
          <>
            <Text style={S.label}>Which Area? *</Text>
            <TouchableOpacity style={[S.selectBtn, errors.area && S.selectBtnErr]} onPress={() => setShowAreaPicker(true)}>
              <Ionicons name="business" size={18} color={commonArea ? C.primary : C.textMuted} />
              <Text style={[S.selectBtnText, commonArea && { color: C.textPrimary }]}>{commonArea || "Tap to select common area"}</Text>
              <Ionicons name="chevron-down" size={14} color={C.textMuted} />
            </TouchableOpacity>
            {errors.area && <Text style={S.error}>{errors.area}</Text>}
          </>
        )}

        {scope?.id === "unknown" && (
          <View style={S.infoBox}><Ionicons name="information-circle" size={14} color={C.warning} /><Text style={[S.infoText, { color: C.warning }]}>You've indicated this is a general or unknown issue. Please provide as much detail as possible.</Text></View>
        )}

        {scope?.id === "property_wide" && (
          <View style={S.infoBox}><Ionicons name="information-circle" size={14} color={C.danger} /><Text style={[S.infoText, { color: C.danger }]}>This affects the entire property. The landlord will be notified immediately.</Text></View>
        )}

        <Text style={S.label}>Subject *</Text>
        <TextInput style={[S.input, errors.subject && S.inputErr]} value={subject} onChangeText={v => { setSubject(v); setErrors(e => ({ ...e, subject: undefined })); }} placeholder="Brief summary of the complaint" placeholderTextColor={C.textMuted} maxLength={100} />
        {errors.subject && <Text style={S.error}>{errors.subject}</Text>}

        <Text style={S.label}>Description *</Text>
        <TextInput style={[S.input, S.textarea, errors.description && S.inputErr]} value={description} onChangeText={v => { setDesc(v); setErrors(e => ({ ...e, description: undefined })); }} placeholder="Describe the issue in detail..." placeholderTextColor={C.textMuted} multiline numberOfLines={6} textAlignVertical="top" />
        {errors.description && <Text style={S.error}>{errors.description}</Text>}

        <Text style={S.label}>Attach Evidence (Optional)</Text>
        <Text style={S.labelHint}>Add up to 3 photos as evidence</Text>
        {images.length > 0 && (
          <View style={S.imageGrid}>{images.map((img, idx) => (<View key={idx} style={S.imageWrap}><Image source={{ uri: img.uri }} style={S.image} /><TouchableOpacity style={S.removeBtn} onPress={() => removeImage(idx)}><Feather name="x" size={12} color={C.white} /></TouchableOpacity></View>))}</View>
        )}
        {images.length < 3 && (
          <TouchableOpacity style={S.addPhotoBtn} onPress={pickImage} activeOpacity={0.75}><View style={S.addPhotoIcon}><Feather name="camera" size={20} color={C.primary} /></View><View><Text style={S.addPhotoText}>Tap to add evidence</Text><Text style={S.addPhotoSub}>{3 - images.length} remaining</Text></View></TouchableOpacity>
        )}

        <View style={S.infoBox}><Ionicons name="information-circle" size={14} color={C.primary} /><Text style={S.infoText}>Your complaint will be reviewed by the caretaker and landlord. False or malicious complaints may result in disciplinary action.</Text></View>
      </ScrollView>

      <View style={S.footer}>
        <TouchableOpacity style={S.btnCancel} onPress={() => navigation.goBack()}><Text style={S.btnCancelText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={[S.btnSubmit, (loading || uploading) && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading || uploading}>
          {loading ? <ActivityIndicator color={C.white} size="small" /> : <Text style={S.btnSubmitText}>Submit Complaint</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
  closeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  catIconSmall: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollPad: { padding: 20 },
  stepTitle: { fontSize: 22, fontWeight: "800", color: C.textPrimary, marginBottom: 4 },
  stepSub: { fontSize: 13, color: C.textMuted, marginBottom: 24 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catTile: { width: "47%", backgroundColor: C.surfaceAlt, borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  catIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catLabel: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  catDesc: { fontSize: 11, color: C.textMuted, lineHeight: 15 },
  scopeTile: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, padding: 16 },
  scopeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  scopeLabel: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  scopeDesc: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  scopeSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  scopeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  scopeBadgeText: { fontSize: 12, fontWeight: "600" },
  changeLink: { fontSize: 13, color: C.primary, fontWeight: "600" },
  uploadingBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.primary + "15", borderRadius: 10, padding: 12, marginBottom: 16 },
  uploadingText: { fontSize: 13, color: C.primary, fontWeight: "600" },
  selectBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14 },
  selectBtnErr: { borderColor: C.danger },
  selectBtnText: { flex: 1, fontSize: 14, color: C.textMuted },
  label: { fontSize: 12, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 20 },
  labelHint: { fontSize: 11, color: C.textMuted, marginBottom: 10 },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.textPrimary },
  inputErr: { borderColor: C.danger },
  textarea: { minHeight: 120, paddingTop: 12 },
  error: { fontSize: 11, color: C.danger, marginTop: 4 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  imageWrap: { position: "relative" },
  image: { width: 90, height: 90, borderRadius: 10, backgroundColor: C.surfaceAlt },
  removeBtn: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.danger, alignItems: "center", justifyContent: "center" },
  addPhotoBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed", borderRadius: 12, padding: 16 },
  addPhotoIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center" },
  addPhotoText: { fontSize: 13, fontWeight: "600", color: C.primary },
  addPhotoSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, backgroundColor: C.primary + "10", borderRadius: 10, borderWidth: 1, borderColor: C.primary + "20", marginTop: 24 },
  infoText: { flex: 1, fontSize: 12, color: C.primary, lineHeight: 17 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border, maxHeight: "70%" },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  unitOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  unitOptionActive: { backgroundColor: C.primary + "15", borderColor: C.primary + "30" },
  unitOptionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  unitOptionTitle: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  unitOptionSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  unitOptionTenant: { fontSize: 12, color: C.textSecondary },
  footer: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  btnCancel: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  btnCancelText: { fontSize: 14, fontWeight: "600", color: C.textSecondary },
  btnSubmit: { flex: 2, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary },
  btnSubmitText: { fontSize: 14, fontWeight: "700", color: C.white },
});