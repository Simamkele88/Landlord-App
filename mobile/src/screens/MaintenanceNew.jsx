// TENANT MAINTENANCE NEW REQUEST PAGE — WITH REAL API & PHOTO UPLOAD
import { useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Alert, Animated,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uploadImages } from "../utils/upload";
import api from "../utils/api";

// THEME COLORS
const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

// CATEGORIES AND PRIORITIES
const CATEGORIES = [
  { id: "plumbing",     label: "Plumbing",     icon: "water",           color: "#3B82F6", desc: "Leaks, pipes, drains, taps" },
  { id: "electrical",  label: "Electrical",   icon: "flash",           color: "#F59E0B", desc: "Wiring, power, lights, outlets" },
  { id: "structural",  label: "Structural",   icon: "business",        color: "#5c7df6", desc: "Walls, floors, ceilings, doors" },
  { id: "appliance",   label: "Appliance",    icon: "settings",        color: "#48ecb5", desc: "Stove, fridge, washing machine" },
  { id: "hvac",        label: "HVAC",         icon: "thermometer",     color: "#062fd4", desc: "Heating, cooling, ventilation" },
  { id: "painting",    label: "Painting",     icon: "color-palette",   color: "#84CC16", desc: "Paint, damp, mould, stains" },
  { id: "cleaning",    label: "Cleaning",     icon: "sparkles",        color: "#22C55E", desc: "Deep clean, pest, fumigation" },
  { id: "pest_control",label: "Pest Control", icon: "bug",             color: "#EF4444", desc: "Insects, rodents, infestations" },
  { id: "other",       label: "Other",        icon: "ellipsis-horizontal", color: C.textMuted, desc: "Anything not listed above" },
];

const PRIORITIES = [
  { id: "low",    label: "Low",    color: C.success },
  { id: "medium", label: "Medium", color: C.warning },
  { id: "high",   label: "High",   color: C.danger  },
  { id: "urgent", label: "Urgent", color: "#FF2D55" },
];

// MAIN COMPONENT
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

  // IMAGE PICKER
  async function pickImage() {
    if (images.length >= 3) {
      Alert.alert("Limit Reached", "You can attach up to 3 photos.");
      return;
    }
    Alert.alert("Add Photo", "Choose source", [
      {
        text: "Camera App",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission Required", "Camera permission is needed to take photos.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets?.length > 0) {
            setImages(prev => [...prev, result.assets[0]]);
          }
        },
      },
      {
        text: "Upload from photos",
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission Required", "Gallery permission is needed to select photos.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: 3 - images.length,
          });
          if (!result.canceled && result.assets?.length > 0) {
            setImages(prev => [...prev, ...result.assets].slice(0, 3));
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function removeImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  function chooseCategory(cat) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setCategory(cat);
    setStep(2);
  }

  function backToCategory() {
    setStep(1);
    setErrors({});
  }

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "Please enter a title";
    else if (title.trim().length < 5) e.title = "Title must be at least 5 characters";
    
    if (!description.trim()) e.description = "Please describe the problem";
    else if (description.trim().length < 10) e.description = "Please provide more detail (minimum 10 characters)";
    
    return e;
  }

  // SUBMIT TO API
  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { 
      setErrors(e); 
      return; 
    }

    setLoading(true);
    
    try {
      // Step 1: Upload images first (if any)
      let uploadedPhotos = [];
      if (images.length > 0) {
        setUploading(true);
        uploadedPhotos = await uploadImages(images);
        setUploading(false);
      }

      // Step 2: Submit the maintenance request with photo URLs
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category.id,
          priority: priority,
          photos: uploadedPhotos,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      // Success
      Alert.alert(
        "Request Submitted",
        `Your maintenance request (${data.request.request_number}) has been sent.${uploadedPhotos.length > 0 ? ` ${uploadedPhotos.length} photo(s) attached.` : ""}\n\nThe caretaker will be notified.`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
      
    } catch (err) {
      console.error("Submit maintenance request failed:", err);
      Alert.alert(
        "Submission Failed",
        err.message || "Unable to submit request. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  const inputStyle = (key) => [S.input, errors[key] && S.inputErr];

  if (step === 1) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Feather name="arrow-left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>New Request</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          <Text style={S.stepTitle}>What needs fixing?</Text>
          <Text style={S.stepSub}>Select a category to get started</Text>
          <View style={S.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[S.catTile, { borderColor: cat.color + "25" }]}
                onPress={() => chooseCategory(cat)}
                activeOpacity={0.75}
              >
                <View style={[S.catIcon, { backgroundColor: cat.color + "18" }]}>
                  <Ionicons name={cat.icon} size={26} color={cat.color} />
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
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={S.header}>
        <TouchableOpacity onPress={backToCategory} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={[S.catIconSmall, { backgroundColor: category.color + "18" }]}>
            <Ionicons name={category.icon} size={16} color={category.color} />
          </View>
          <Text style={S.headerTitle}>{category.label}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.closeBtn}>
          <Feather name="x" size={18} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          {/* UPLOAD PROGRESS */}
          {uploading && (
            <View style={S.uploadingBanner}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={S.uploadingText}>Uploading photos{images.length > 1 ? ` (${images.length})` : ""}...</Text>
            </View>
          )}

          {/* TITLE */}
          <Text style={S.label}>Issue Title *</Text>
          <TextInput
            style={inputStyle("title")}
            value={title}
            onChangeText={v => { setTitle(v); setErrors(e => ({ ...e, title: undefined })); }}
            placeholder="e.g. Burst pipe under kitchen sink"
            placeholderTextColor={C.textMuted}
            maxLength={100}
          />
          <View style={S.inputFooter}>
            {errors.title && <Text style={S.error}>{errors.title}</Text>}
            <Text style={S.charCount}>{title.length}/100</Text>
          </View>

          {/* DESCRIPTION */}
          <Text style={S.label}>Description *</Text>
          <TextInput
            style={[inputStyle("description"), S.textarea]}
            value={description}
            onChangeText={v => { setDesc(v); setErrors(e => ({ ...e, description: undefined })); }}
            placeholder="Describe the issue in detail — what's happening, when it started, and any other relevant information..."
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          {errors.description && <Text style={S.error}>{errors.description}</Text>}

          {/* PHOTOS */}
          <Text style={S.label}>Attach Photos (Optional)</Text>
          <Text style={S.labelHint}>Add up to 3 photos to help describe the issue</Text>

          {images.length > 0 && (
            <View style={S.imageGrid}>
              {images.map((img, idx) => (
                <View key={idx} style={S.imageWrap}>
                  <Image source={{ uri: img.uri }} style={S.image} />
                  <TouchableOpacity style={S.removeBtn} onPress={() => removeImage(idx)}>
                    <Feather name="x" size={12} color={C.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {images.length < 3 && (
            <TouchableOpacity style={S.addPhotoBtn} onPress={pickImage} activeOpacity={0.75}>
              <View style={S.addPhotoIcon}>
                <Feather name="camera" size={20} color={C.primary} />
              </View>
              <View>
                <Text style={S.addPhotoText}>Tap to add photo</Text>
                <Text style={S.addPhotoSub}>{3 - images.length} remaining</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* PRIORITY */}
          <Text style={S.label}>Priority Level</Text>
          <View style={S.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[S.priorityBtn, priority === p.id && { borderColor: p.color, backgroundColor: p.color + "15" }]}
                onPress={() => setPriority(p.id)}
                activeOpacity={0.75}
              >
                {priority === p.id && <View style={[S.priorityDot, { backgroundColor: p.color }]} />}
                <Text style={[S.priorityText, priority === p.id && { color: p.color, fontWeight: "700" }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* INFO */}
          <View style={S.infoBox}>
            <Feather name="info" size={14} color={C.primary} />
            <Text style={S.infoText}>
              Your caretaker will be notified immediately. Urgent requests are escalated to the landlord.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* FOOTER */}
      <View style={S.footer}>
        <TouchableOpacity 
          style={S.btnCancel} 
          onPress={() => navigation.goBack()} 
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={S.btnCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[S.btnSubmit, (loading || uploading) && { opacity: 0.6 }]} 
          onPress={handleSubmit} 
          disabled={loading || uploading}
        >
          {loading ? (
            <>
              <ActivityIndicator color={C.white} size="small" />
              <Text style={S.btnSubmitText}>
                {uploading ? "Uploading..." : "Submitting..."}
              </Text>
            </>
          ) : (
            <Text style={S.btnSubmitText}>
              Submit Request{images.length > 0 ? ` (${images.length} photos)` : ""}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// STYLES
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center",
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
  },
  catIconSmall: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  stepTitle: { fontSize: 22, fontWeight: "800", color: C.textPrimary, marginBottom: 4 },
  stepSub: { fontSize: 13, color: C.textMuted, marginBottom: 24 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catTile: {
    width: "47%", backgroundColor: C.surfaceAlt, borderRadius: 14,
    borderWidth: 1, padding: 16, gap: 10,
  },
  catIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catLabel: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  catDesc: { fontSize: 11, color: C.textMuted, lineHeight: 15 },

  scroll: { flex: 1 },
  scrollPad: { padding: 20, paddingBottom: 20 },
  uploadingBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primary + "15", borderRadius: 10, padding: 12, marginBottom: 16,
  },
  uploadingText: { fontSize: 13, color: C.primary, fontWeight: "600" },
  label: {
    fontSize: 12, fontWeight: "700", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 20,
  },
  labelHint: { fontSize: 11, color: C.textMuted, marginBottom: 10 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.textPrimary,
  },
  inputErr: { borderColor: C.danger },
  textarea: { minHeight: 120, paddingTop: 12 },
  inputFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4,
  },
  charCount: { fontSize: 10, color: C.textMuted },
  error: { fontSize: 11, color: C.danger, flex: 1 },

  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  imageWrap: { position: "relative" },
  image: { width: 90, height: 90, borderRadius: 10, backgroundColor: C.surfaceAlt },
  removeBtn: {
    position: "absolute", top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.danger, alignItems: "center", justifyContent: "center",
  },
  addPhotoBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
    borderStyle: "dashed", borderRadius: 12, padding: 16,
  },
  addPhotoIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: C.primary + "15", alignItems: "center", justifyContent: "center",
  },
  addPhotoText: { fontSize: 13, fontWeight: "600", color: C.primary },
  addPhotoSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  priorityRow: { flexDirection: "row", gap: 8 },
  priorityBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    paddingVertical: 10, borderRadius: 8, backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.border,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 11, fontWeight: "600", color: C.textSecondary },

  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, backgroundColor: C.primary + "10", borderRadius: 10,
    borderWidth: 1, borderColor: C.primary + "20", marginTop: 24,
  },
  infoText: { flex: 1, fontSize: 12, color: C.primary, lineHeight: 17 },

  footer: {
    flexDirection: "row", gap: 10, padding: 16,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface,
  },
  btnCancel: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 12, backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.border,
  },
  btnCancelText: { fontSize: 14, fontWeight: "600", color: C.textSecondary },
  btnSubmit: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: C.primary,
  },
  btnSubmitText: { fontSize: 14, fontWeight: "700", color: C.white },
});