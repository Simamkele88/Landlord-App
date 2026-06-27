// TENANT COMPLAINT NEW SCREEN 
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

const $input = {
  backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border,
  borderRadius: 3, paddingHorizontal: 12, paddingVertical: 12,
  fontSize: 14, color: C.white, fontFamily: F.dm,
};
const $btnGold = { backgroundColor: C.gold, borderRadius: 3, paddingVertical: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 };
const $btnGhost = { backgroundColor: "transparent", borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingVertical: 13, alignItems: "center", justifyContent: "center" };

const COMPLAINT_CATEGORIES = [
  { id: "noise", label: "Noise", icon: "volume-high", color: C.gold, desc: "Loud music, shouting, parties" },
  { id: "cleanliness", label: "Cleanliness", icon: "trash", color: C.greenLight, desc: "Trash, mess, hygiene issues" },
  { id: "neighbor_dispute", label: "Neighbor Dispute", icon: "people", color: C.blue, desc: "Arguments, harassment, intimidation" },
  { id: "parking", label: "Parking", icon: "car", color: C.purple, desc: "Blocked spots, unauthorized vehicles" },
  { id: "security", label: "Security", icon: "shield", color: C.redLight, desc: "Suspicious activity, break-ins, theft" },
  { id: "pets", label: "Pets", icon: "paw", color: "#48ecb5", desc: "Barking, mess, aggressive animals" },
  { id: "smoking", label: "Smoking", icon: "flame", color: "#FF2D55", desc: "Smoking in non-smoking areas" },
  { id: "property_damage", label: "Property Damage", icon: "hammer", color: C.orange, desc: "Damage to property, fixtures, common areas" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal", color: "rgba(245,240,232,0.4)", desc: "Anything not listed above" },
];

const COMPLAINT_SCOPES = [
  { id: "specific_tenant", label: "Specific Unit / Tenant", icon: "home", color: C.blue, desc: "You know which unit or tenant is responsible" },
  { id: "common_area", label: "Common Area", icon: "business", color: C.gold, desc: "Issue in hallway, parking, stairwell, garden, etc." },
  { id: "unknown", label: "Unknown / General", icon: "help-circle", color: "rgba(245,240,232,0.4)", desc: "Not sure who is responsible" },
  { id: "property_wide", label: "Property-Wide Issue", icon: "globe", color: C.redLight, desc: "Issue affecting the entire property" },
];

const COMMON_AREAS = ["Hallway / Corridor", "Stairwell", "Parking Area", "Garden / Yard", "Laundry Room", "Entrance / Lobby", "Elevator", "Bin Room / Refuse Area", "Roof / Balcony (shared)", "Other Common Area"];

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

  useEffect(() => { fetchAvailableUnits(); }, []);

  async function fetchAvailableUnits() {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/units/available`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) setAvailableUnits(data.units || []);
    } catch (err) {}
  }

  async function pickImage() {
    if (images.length >= 3) { Alert.alert("Limit Reached", "You can attach up to 3 photos."); return; }
    Alert.alert("Add Evidence", "Choose source", [
      { text: "Camera", onPress: async () => {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) { Alert.alert("Permission Required", "Camera permission needed."); return; }
        const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
        if (!r.canceled && r.assets?.length > 0) setImages(prev => [...prev, r.assets[0]]);
      }},
      { text: "Gallery", onPress: async () => {
        const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!p.granted) { Alert.alert("Permission Required", "Gallery permission needed."); return; }
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: 3 - images.length });
        if (!r.canceled && r.assets?.length > 0) setImages(prev => [...prev, ...r.assets].slice(0, 3));
      }},
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function removeImage(index) { setImages(prev => prev.filter((_, i) => i !== index)); }
  function chooseCategory(cat) { setCategory(cat); setStep(2); }
  function chooseScope(s) { setScope(s); setSelectedUnit(null); setCommonArea(""); setErrors({}); setStep(3); }

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
      if (images.length > 0) { setUploading(true); uploadedPhotos = await uploadComplaintEvidence(images); setUploading(false); }
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/complaints`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim(), category: category.id, complaint_scope: scope.id, against_unit_number: scope.id === "specific_tenant" ? String(selectedUnit.unit_number) : null, common_area_location: scope.id === "common_area" ? commonArea : null, evidence: uploadedPhotos }),
      });
      const data = await response.json();
      if (response.ok) Alert.alert("Complaint Submitted", "Your complaint has been logged and is under review.", [{ text: "OK", onPress: () => navigation.goBack() }]);
      else throw new Error(data.error || "Failed to submit");
    } catch (err) { Alert.alert("Error", err.message || "Unable to submit."); }
    finally { setLoading(false); setUploading(false); }
  }

  
  function PickerModal({ visible, onClose, title, children }) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={S.modalOverlay}>
          <View style={S.modalSheet}>
            <View style={S.modalHandle} />
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose}><Feather name="x" size={18} color="rgba(245,240,232,0.3)" /></TouchableOpacity>
            </View>
            {children}
          </View>
        </View>
      </Modal>
    );
  }

  
  if (step === 1) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
          <Text style={S.headerTitle}>Log Complaint</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <Text style={S.stepTitle}>What type of complaint?</Text>
          <View style={S.catGrid}>
            {COMPLAINT_CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.id} style={[S.catTile, { borderColor: cat.color + "25" }]} onPress={() => chooseCategory(cat)} activeOpacity={0.75}>
                <View style={[S.catIcon, { backgroundColor: cat.color + "15", borderColor: cat.color + "25" }]}>
                  <Ionicons name={cat.icon} size={22} color={cat.color} />
                </View>
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
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep(1)}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <View style={[S.catIconSmall, { backgroundColor: category.color + "15", borderColor: category.color + "25" }]}>
              <Ionicons name={category.icon} size={15} color={category.color} />
            </View>
            <Text style={S.headerTitle}>{category.label}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.closeBtn}><Feather name="x" size={16} color="rgba(245,240,232,0.3)" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <Text style={S.stepTitle}>Who or what is this about?</Text>
          <Text style={S.stepSub}>This helps us route your complaint correctly</Text>
          <View style={{ gap: 8 }}>
            {COMPLAINT_SCOPES.map(s => (
              <TouchableOpacity key={s.id} style={S.scopeTile} onPress={() => chooseScope(s)} activeOpacity={0.75}>
                <View style={[S.scopeIcon, { backgroundColor: s.color + "15", borderColor: s.color + "25" }]}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                </View>
                <View style={{ flex: 1 }}><Text style={S.scopeLabel}>{s.label}</Text><Text style={S.scopeDesc}>{s.desc}</Text></View>
                <Ionicons name="chevron-forward" size={16} color="rgba(245,240,232,0.25)" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  
  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      <PickerModal visible={showUnitPicker} onClose={() => setShowUnitPicker(false)} title="Select Unit">
        <ScrollView style={{ maxHeight: 280 }}>
          {availableUnits.map((unit, idx) => (
            <TouchableOpacity key={idx} style={[S.unitOption, selectedUnit?.unit_number === unit.unit_number && S.unitOptionActive]}
              onPress={() => { setSelectedUnit(unit); setShowUnitPicker(false); setErrors(e => ({ ...e, unit: undefined })); }}>
              <View style={S.unitOptionLeft}><Ionicons name="home" size={15} color={C.gold} /><Text style={S.unitOptionTitle}>Unit {unit.unit_number}</Text></View>
              {unit.tenant_name && <Text style={S.unitOptionTenant}>{unit.tenant_name}</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </PickerModal>

      <PickerModal visible={showAreaPicker} onClose={() => setShowAreaPicker(false)} title="Select Area">
        <ScrollView style={{ maxHeight: 280 }}>
          {COMMON_AREAS.map((area, idx) => (
            <TouchableOpacity key={idx} style={[S.unitOption, commonArea === area && S.unitOptionActive]}
              onPress={() => { setCommonArea(area); setShowAreaPicker(false); setErrors(e => ({ ...e, area: undefined })); }}>
              <View style={S.unitOptionLeft}><Ionicons name="business" size={15} color={C.gold} /><Text style={S.unitOptionTitle}>{area}</Text></View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </PickerModal>

      <View style={S.header}>
        <TouchableOpacity onPress={() => setStep(2)}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={[S.catIconSmall, { backgroundColor: category.color + "15", borderColor: category.color + "25" }]}>
            <Ionicons name={category.icon} size={15} color={category.color} />
          </View>
          <Text style={S.headerTitle} numberOfLines={1}>{category.label} · {scope?.label}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.closeBtn}><Feather name="x" size={16} color="rgba(245,240,232,0.3)" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={S.pad}>
        {uploading && (
          <View style={S.uploadingBanner}>
            <ActivityIndicator size="small" color={C.gold} />
            <Text style={S.uploadingText}>Uploading evidence...</Text>
          </View>
        )}

        {/* SCOPE BADGE */}
        <View style={S.scopeSummary}>
          <View style={[S.scopeBadge, { backgroundColor: scope?.color + "15", borderColor: scope?.color + "25" }]}>
            <Ionicons name={scope?.icon} size={13} color={scope?.color} />
            <Text style={[S.scopeBadgeText, { color: scope?.color }]}>{scope?.label}</Text>
          </View>
          <TouchableOpacity onPress={() => setStep(2)}><Text style={S.changeLink}>Change</Text></TouchableOpacity>
        </View>

        {/* UNIT / AREA SELECTOR */}
        {scope?.id === "specific_tenant" && (
          <>
            <Text style={S.label}>WHICH UNIT? *</Text>
            <TouchableOpacity style={[S.selectBtn, errors.unit && { borderColor: C.redLight }]} onPress={() => setShowUnitPicker(true)}>
              <Ionicons name="home" size={16} color={selectedUnit ? C.gold : "rgba(245,240,232,0.2)"} />
              <Text style={[S.selectBtnText, selectedUnit && { color: C.white }]}>
                {selectedUnit ? `Unit ${selectedUnit.unit_number} — ${selectedUnit.tenant_name || "Unknown"}` : "Tap to select a unit"}
              </Text>
              <Ionicons name="chevron-down" size={13} color="rgba(245,240,232,0.2)" />
            </TouchableOpacity>
            {errors.unit && <Text style={S.error}>{errors.unit}</Text>}
          </>
        )}
        {scope?.id === "common_area" && (
          <>
            <Text style={S.label}>WHICH AREA? *</Text>
            <TouchableOpacity style={[S.selectBtn, errors.area && { borderColor: C.redLight }]} onPress={() => setShowAreaPicker(true)}>
              <Ionicons name="business" size={16} color={commonArea ? C.gold : "rgba(245,240,232,0.2)"} />
              <Text style={[S.selectBtnText, commonArea && { color: C.white }]}>{commonArea || "Tap to select common area"}</Text>
              <Ionicons name="chevron-down" size={13} color="rgba(245,240,232,0.2)" />
            </TouchableOpacity>
            {errors.area && <Text style={S.error}>{errors.area}</Text>}
          </>
        )}

        {/* INFO BOXES */}
        {scope?.id === "unknown" && (
          <View style={S.infoBox}><Ionicons name="information-circle" size={13} color={C.gold} /><Text style={[S.infoText, { color: C.gold }]}>Please provide as much detail as possible since this is a general issue.</Text></View>
        )}
        {scope?.id === "property_wide" && (
          <View style={[S.infoBox, { backgroundColor: "rgba(224,90,74,0.06)", borderColor: "rgba(224,90,74,0.15)" }]}>
            <Ionicons name="information-circle" size={13} color={C.redLight} /><Text style={[S.infoText, { color: C.redLight }]}>This affects the entire property. The landlord will be notified immediately.</Text>
          </View>
        )}

        {/* SUBJECT */}
        <Text style={S.label}>SUBJECT *</Text>
        <TextInput style={[$input, errors.subject && { borderColor: C.redLight }]} value={subject}
          onChangeText={v => { setSubject(v); setErrors(e => ({ ...e, subject: undefined })); }}
          placeholder="Brief summary of the complaint" placeholderTextColor="rgba(245,240,232,0.15)" maxLength={100} />
        {errors.subject && <Text style={S.error}>{errors.subject}</Text>}

        {/* DESCRIPTION */}
        <Text style={S.label}>DESCRIPTION *</Text>
        <TextInput style={[$input, S.textarea, errors.description && { borderColor: C.redLight }]} value={description}
          onChangeText={v => { setDesc(v); setErrors(e => ({ ...e, description: undefined })); }}
          placeholder="Describe the issue in detail..." placeholderTextColor="rgba(245,240,232,0.15)" multiline numberOfLines={6} textAlignVertical="top" />
        {errors.description && <Text style={S.error}>{errors.description}</Text>}

        {/* EVIDENCE */}
        <Text style={S.label}>ATTACH EVIDENCE (OPTIONAL)</Text>
        <Text style={S.labelHint}>Add up to 3 photos</Text>
        {images.length > 0 && (
          <View style={S.imageGrid}>
            {images.map((img, idx) => (
              <View key={idx} style={S.imageWrap}>
                <Image source={{ uri: img.uri }} style={S.image} />
                <TouchableOpacity style={S.removeBtn} onPress={() => removeImage(idx)}><Feather name="x" size={11} color={C.white} /></TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {images.length < 3 && (
          <TouchableOpacity style={S.addPhotoBtn} onPress={pickImage} activeOpacity={0.75}>
            <View style={S.addPhotoIcon}><Feather name="camera" size={18} color={C.gold} /></View>
            <View><Text style={S.addPhotoText}>Tap to add evidence</Text><Text style={S.addPhotoSub}>{3 - images.length} remaining</Text></View>
          </TouchableOpacity>
        )}

        {/* DISCLAIMER */}
        <View style={S.infoBox}>
          <Ionicons name="information-circle" size={13} color={C.blue} />
          <Text style={S.infoText}>Your complaint will be reviewed by the caretaker and landlord. False or malicious complaints may result in disciplinary action.</Text>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={S.footer}>
        <TouchableOpacity style={$btnGhost} onPress={() => navigation.goBack()}><Text style={S.btnGhostText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={[$btnGold, (loading || uploading) && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading || uploading}>
          {loading ? <ActivityIndicator color={C.black} size="small" /> : <Text style={S.btnGoldText}>SUBMIT COMPLAINT</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  closeBtn: { width: 30, height: 30, borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: C.muted, borderWidth: 1, borderColor: C.border },
  catIconSmall: { width: 30, height: 30, borderRadius: 4, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  pad: { padding: 16 },

  stepTitle: { fontSize: 20, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 4 },
  stepSub: { fontSize: 12, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginBottom: 20 },

  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catTile: { width: "47%", backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, padding: 14, gap: 8 },
  catIcon: { width: 42, height: 42, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  catLabel: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  catDesc: { fontSize: 10, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, lineHeight: 14 },

  scopeTile: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border, padding: 14 },
  scopeIcon: { width: 40, height: 40, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  scopeLabel: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  scopeDesc: { fontSize: 10, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginTop: 2 },

  scopeSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  scopeBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3, borderWidth: 1 },
  scopeBadgeText: { fontSize: 11, fontWeight: "600", fontFamily: F.mono },
  changeLink: { fontSize: 12, color: C.gold, fontWeight: "600", fontFamily: F.mono },

  uploadingBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(232,160,18,0.06)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(232,160,18,0.12)", padding: 10, marginBottom: 14 },
  uploadingText: { fontSize: 12, color: C.gold, fontWeight: "600", fontFamily: F.mono },

  selectBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 13 },
  selectBtnText: { flex: 1, fontSize: 13, color: "rgba(245,240,232,0.3)", fontFamily: F.dm },

  label: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)", fontFamily: F.mono, letterSpacing: 1.5, marginBottom: 6, marginTop: 18 },
  labelHint: { fontSize: 10, color: "rgba(245,240,232,0.2)", fontFamily: F.mono, marginBottom: 8 },
  textarea: { minHeight: 110, paddingTop: 12 },
  error: { fontSize: 10, color: C.redLight, fontFamily: F.mono, marginTop: 3 },

  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  imageWrap: { position: "relative" },
  image: { width: 84, height: 84, borderRadius: 4, backgroundColor: C.muted },
  removeBtn: { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: C.redLight, alignItems: "center", justifyContent: "center" },
  addPhotoBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border, borderStyle: "dashed", borderRadius: 4, padding: 14 },
  addPhotoIcon: { width: 40, height: 40, borderRadius: 4, backgroundColor: "rgba(232,160,18,0.1)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)", alignItems: "center", justifyContent: "center" },
  addPhotoText: { fontSize: 12, fontWeight: "600", color: C.gold, fontFamily: F.mono },
  addPhotoSub: { fontSize: 10, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, marginTop: 2 },

  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, backgroundColor: "rgba(58,143,212,0.06)", borderRadius: 3, borderWidth: 1, borderColor: "rgba(58,143,212,0.15)", marginTop: 20 },
  infoText: { flex: 1, fontSize: 11, color: "rgba(58,143,212,0.7)", lineHeight: 16, fontFamily: F.mono },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.muted2, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 20, paddingBottom: 36, borderTopWidth: 1, borderColor: C.border, maxHeight: "70%" },
  modalHandle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  unitOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 10, borderRadius: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  unitOptionActive: { backgroundColor: "rgba(232,160,18,0.06)", borderColor: "rgba(232,160,18,0.15)" },
  unitOptionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  unitOptionTitle: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  unitOptionTenant: { fontSize: 11, color: "rgba(245,240,232,0.35)", fontFamily: F.mono },

  footer: { flexDirection: "row", gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.muted2 },
  btnGhostText: { fontSize: 12, fontWeight: "500", color: "rgba(245,240,232,0.5)", fontFamily: F.dm, letterSpacing: 0.5 },
  btnGoldText: { fontSize: 12, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
});