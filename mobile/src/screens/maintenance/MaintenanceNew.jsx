// TENANT MAINTENANCE NEW REQUEST PAGE 
import { useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Alert, Animated, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const CATEGORIES = [
  { id: "plumbing",     label: "Plumbing",     icon: "water",           color: C.blue,       desc: "Leaks, pipes, drains, taps" },
  { id: "electrical",  label: "Electrical",   icon: "flash",           color: C.gold,       desc: "Wiring, power, lights, outlets" },
  { id: "structural",  label: "Structural",   icon: "business",        color: C.purple,     desc: "Walls, floors, ceilings, doors" },
  { id: "appliance",   label: "Appliance",    icon: "settings",        color: "#48ecb5",    desc: "Stove, fridge, washing machine" },
  { id: "hvac",        label: "HVAC",         icon: "thermometer",     color: "#062fd4",    desc: "Heating, cooling, ventilation" },
  { id: "painting",    label: "Painting",     icon: "color-palette",   color: "#84CC16",    desc: "Paint, damp, mould, stains" },
  { id: "cleaning",    label: "Cleaning",     icon: "sparkles",        color: C.greenLight, desc: "Deep clean, pest, fumigation" },
  { id: "pest_control",label: "Pest Control", icon: "bug",             color: C.redLight,   desc: "Insects, rodents, infestations" },
  { id: "other",       label: "Other",        icon: "ellipsis-horizontal", color: "rgba(245,240,232,0.4)", desc: "Anything not listed above" },
];

const PRIORITIES = [
  { id: "low",    label: "Low",    color: C.greenLight },
  { id: "medium", label: "Medium", color: C.gold },
  { id: "high",   label: "High",   color: C.redLight },
  { id: "urgent", label: "Urgent", color: "#FF2D55" },
];

const $input = {
  backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border,
  borderRadius: 3, paddingHorizontal: 12, paddingVertical: 12,
  fontSize: 14, color: C.white, fontFamily: F.dm,
};
const $btnGold = {
  backgroundColor: C.gold, borderRadius: 3, paddingVertical: 13,
  alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
};
const $btnGhost = {
  backgroundColor: "transparent", borderWidth: 1, borderColor: C.border,
  borderRadius: 3, paddingVertical: 13,
  alignItems: "center", justifyContent: "center",
};

export default function MaintenanceNew() {
  const navigation = useNavigation();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [priority, setPriority] = useState("medium");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const fadeAnim = useRef(new Animated.Value(1)).current;

  async function pickImage() {
    if (images.length >= 3) { Alert.alert("Limit Reached", "You can attach up to 3 photos."); return; }
    Alert.alert("Add Photo", "Choose source", [
      {
        text: "Camera",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) { Alert.alert("Permission Required", "Camera permission needed."); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
          if (!result.canceled && result.assets?.length > 0) setImages(prev => [...prev, result.assets[0]]);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) { Alert.alert("Permission Required", "Gallery permission needed."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: 3 - images.length });
          if (!result.canceled && result.assets?.length > 0) setImages(prev => [...prev, ...result.assets].slice(0, 3));
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function removeImage(index) { setImages(prev => prev.filter((_, i) => i !== index)); }

  function chooseCategory(cat) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setCategory(cat);
    setStep(2);
  }

  function backToCategory() { setStep(1); setErrors({}); }

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "Please enter a title";
    else if (title.trim().length < 5) e.title = "Title must be at least 5 characters";
    if (!description.trim()) e.description = "Please describe the problem";
    else if (description.trim().length < 10) e.description = "Please provide more detail (minimum 10 characters)";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      let uploadedPhotos = [];
      if (images.length > 0) { setUploading(true); uploadedPhotos = await uploadImages(images); setUploading(false); }
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/maintenance`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), category: category.id, priority, photos: uploadedPhotos }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit");
      Alert.alert("Request Submitted", `Your request (${data.request.request_number}) has been sent.`, [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Submission Failed", err.message || "Unable to submit. Please try again.");
    } finally { setLoading(false); setUploading(false); }
  }

  const inputStyle = (key) => [$input, errors[key] && { borderColor: C.redLight }];

  if (step === 1) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
          <Text style={S.headerTitle}>New Request</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <Text style={S.stepTitle}>What needs fixing?</Text>
          <Text style={S.stepSub}>Select a category to get started</Text>
          <View style={S.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.id} style={[S.catTile, { borderColor: cat.color + "25" }]} onPress={() => chooseCategory(cat)} activeOpacity={0.75}>
                <View style={[S.catIcon, { backgroundColor: cat.color + "15", borderColor: cat.color + "25" }]}>
                  <Ionicons name={cat.icon} size={24} color={cat.color} />
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

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <View style={S.header}>
        <TouchableOpacity onPress={backToCategory}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={[S.catIconSmall, { backgroundColor: category.color + "15", borderColor: category.color + "25" }]}>
            <Ionicons name={category.icon} size={15} color={category.color} />
          </View>
          <Text style={S.headerTitle}>{category.label}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.closeBtn}>
          <Feather name="x" size={16} color="rgba(245,240,232,0.3)" />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={S.pad}>
          {uploading && (
            <View style={S.uploadingBanner}>
              <ActivityIndicator size="small" color={C.gold} />
              <Text style={S.uploadingText}>Uploading photos...</Text>
            </View>
          )}

          <Text style={S.label}>ISSUE TITLE *</Text>
          <TextInput style={inputStyle("title")} value={title}
            onChangeText={v => { setTitle(v); setErrors(e => ({ ...e, title: undefined })); }}
            placeholder="e.g. Burst pipe under kitchen sink" placeholderTextColor="rgba(245,240,232,0.15)" maxLength={100} />
          <View style={S.inputFooter}>
            {errors.title && <Text style={S.error}>{errors.title}</Text>}
            <Text style={S.charCount}>{title.length}/100</Text>
          </View>

          <Text style={S.label}>DESCRIPTION *</Text>
          <TextInput style={[inputStyle("description"), S.textarea]} value={description}
            onChangeText={v => { setDesc(v); setErrors(e => ({ ...e, description: undefined })); }}
            placeholder="Describe the issue in detail..." placeholderTextColor="rgba(245,240,232,0.15)"
            multiline numberOfLines={6} textAlignVertical="top" />
          {errors.description && <Text style={S.error}>{errors.description}</Text>}

          <Text style={S.label}>ATTACH PHOTOS (OPTIONAL)</Text>
          <Text style={S.labelHint}>Add up to 3 photos to help describe the issue</Text>
          {images.length > 0 && (
            <View style={S.imageGrid}>
              {images.map((img, idx) => (
                <View key={idx} style={S.imageWrap}>
                  <Image source={{ uri: img.uri }} style={S.image} />
                  <TouchableOpacity style={S.removeBtn} onPress={() => removeImage(idx)}>
                    <Feather name="x" size={11} color={C.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {images.length < 3 && (
            <TouchableOpacity style={S.addPhotoBtn} onPress={pickImage} activeOpacity={0.75}>
              <View style={S.addPhotoIcon}><Feather name="camera" size={18} color={C.gold} /></View>
              <View>
                <Text style={S.addPhotoText}>Tap to add photo</Text>
                <Text style={S.addPhotoSub}>{3 - images.length} remaining</Text>
              </View>
            </TouchableOpacity>
          )}

          <Text style={S.label}>PRIORITY LEVEL</Text>
          <View style={S.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p.id} style={[S.priorityBtn, priority === p.id && { borderColor: p.color, backgroundColor: p.color + "12" }]}
                onPress={() => setPriority(p.id)} activeOpacity={0.75}>
                {priority === p.id && <View style={[S.priorityDot, { backgroundColor: p.color }]} />}
                <Text style={[S.priorityText, priority === p.id && { color: p.color, fontWeight: "700" }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={S.infoBox}>
            <Feather name="info" size={13} color={C.blue} />
            <Text style={S.infoText}>Your caretaker will be notified. Urgent requests are escalated to the landlord.</Text>
          </View>
        </ScrollView>
      </Animated.View>

      <View style={S.footer}>
        <TouchableOpacity style={$btnGhost} onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={S.btnGhostText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[$btnGold, (loading || uploading) && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading || uploading}>
          {loading ? (
            <><ActivityIndicator color={C.black} size="small" /><Text style={S.btnGoldText}>{uploading ? "Uploading..." : "Submitting..."}</Text></>
          ) : (
            <Text style={S.btnGoldText}>SUBMIT REQUEST</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 4, alignItems: "center", justifyContent: "center",
    backgroundColor: C.muted, borderWidth: 1, borderColor: C.border,
  },
  catIconSmall: { width: 30, height: 30, borderRadius: 4, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  pad: { padding: 16 },

  stepTitle: { fontSize: 20, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 4 },
  stepSub: { fontSize: 12, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginBottom: 22 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catTile: {
    width: "47%", backgroundColor: C.muted2, borderRadius: 6,
    borderWidth: 1, padding: 14, gap: 8,
  },
  catIcon: { width: 44, height: 44, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  catLabel: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  catDesc: { fontSize: 10, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, lineHeight: 14 },

  uploadingBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(232,160,18,0.06)", borderRadius: 4, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(232,160,18,0.12)",
  },
  uploadingText: { fontSize: 12, color: C.gold, fontWeight: "600", fontFamily: F.mono },

  label: {
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)",
    fontFamily: F.mono, letterSpacing: 1.5, marginBottom: 6, marginTop: 18,
  },
  labelHint: { fontSize: 10, color: "rgba(245,240,232,0.2)", fontFamily: F.mono, marginBottom: 8 },

  inputFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  charCount: { fontSize: 9, color: "rgba(245,240,232,0.2)", fontFamily: F.mono },
  error: { fontSize: 10, color: C.redLight, fontFamily: F.mono, flex: 1 },
  textarea: { minHeight: 110, paddingTop: 12 },

  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  imageWrap: { position: "relative" },
  image: { width: 84, height: 84, borderRadius: 4, backgroundColor: C.muted },
  removeBtn: {
    position: "absolute", top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10, backgroundColor: C.redLight,
    alignItems: "center", justifyContent: "center",
  },
  addPhotoBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border,
    borderStyle: "dashed", borderRadius: 4, padding: 14,
  },
  addPhotoIcon: { width: 40, height: 40, borderRadius: 4, backgroundColor: "rgba(232,160,18,0.1)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)", alignItems: "center", justifyContent: "center" },
  addPhotoText: { fontSize: 12, fontWeight: "600", color: C.gold, fontFamily: F.mono },
  addPhotoSub: { fontSize: 10, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, marginTop: 2 },

  priorityRow: { flexDirection: "row", gap: 6 },
  priorityBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    paddingVertical: 9, borderRadius: 3, backgroundColor: C.muted2,
    borderWidth: 1, borderColor: C.border,
  },
  priorityDot: { width: 5, height: 5, borderRadius: 3 },
  priorityText: { fontSize: 10, fontWeight: "600", color: "rgba(245,240,232,0.4)", fontFamily: F.mono, letterSpacing: 0.5 },

  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, backgroundColor: "rgba(58,143,212,0.06)", borderRadius: 3,
    borderWidth: 1, borderColor: "rgba(58,143,212,0.15)", marginTop: 22,
  },
  infoText: { flex: 1, fontSize: 11, color: "rgba(58,143,212,0.7)", lineHeight: 16, fontFamily: F.mono },

  footer: {
    flexDirection: "row", gap: 10, padding: 14,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.muted2,
  },
  btnGhostText: { fontSize: 12, fontWeight: "500", color: "rgba(245,240,232,0.5)", fontFamily: F.dm, letterSpacing: 0.5 },
  btnGoldText: { fontSize: 12, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
});