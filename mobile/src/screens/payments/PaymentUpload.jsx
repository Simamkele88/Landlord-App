// TENANT PAYMENT UPLOAD PROOF PAGE 

import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

function fmt(amount) { return `R ${Number(amount).toLocaleString("en-ZA")}`; }

export default function PaymentUpload() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice } = route.params || {};

  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(String(invoice?.amount || ""));
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const canSubmit = reference.trim() !== "" && amount.trim() !== "" && file;

  // ✅ PICK ANY FILE (PDF, Image, Document)
  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"], // PDF and all image types
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedFile = result.assets[0];
        
        // Check file size (max 5MB)
        if (selectedFile.size && selectedFile.size > 5 * 1024 * 1024) {
          Alert.alert("File Too Large", "Please select a file under 5MB.");
          return;
        }

        setFile(selectedFile);
        setErrors(e => ({ ...e, file: undefined }));
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select file. Please try again.");
    }
  }

  function validate() {
    const e = {};
    if (!amount.trim()) e.amount = "Required";
    if (!reference.trim()) e.reference = "Required";
    if (!file) e.file = "Please attach proof of payment";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    // Simulate upload
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Submitted", "Your proof of payment has been submitted. The landlord will review it shortly.");
      navigation.goBack();
    }, 1500);
  }

  function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(mimeType) {
    if (mimeType?.includes("pdf")) return "picture-as-pdf";
    if (mimeType?.includes("image")) return "image";
    return "insert-drive-file";
  }

  const inputStyle = (key) => [S.input, errors[key] && S.inputErr];

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Upload Proof</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* INVOICE AMOUNT */}
        {invoice && (
          <View style={S.amountCard}>
            <Text style={S.amountLabel}>Invoice Amount</Text>
            <Text style={S.amountValue}>{fmt(invoice.amount)}</Text>
            <Text style={S.amountPeriod}>{invoice.period}</Text>
          </View>
        )}

        {/* AMOUNT PAID */}
        <Text style={S.label}>Amount Paid (R)</Text>
        <TextInput
          style={inputStyle("amount")}
          value={amount}
          onChangeText={v => { setAmount(v); setErrors(e => ({ ...e, amount: undefined })); }}
          keyboardType="numeric"
          placeholder="e.g. 5800"
          placeholderTextColor={C.textMuted}
        />
        {errors.amount && <Text style={S.error}>{errors.amount}</Text>}

        {/* REFERENCE */}
        <Text style={S.label}>Payment Reference</Text>
        <TextInput
          style={inputStyle("reference")}
          value={reference}
          onChangeText={v => { setReference(v); setErrors(e => ({ ...e, reference: undefined })); }}
          placeholder="e.g. EFT-20260403-001"
          placeholderTextColor={C.textMuted}
          autoCapitalize="characters"
        />
        {errors.reference && <Text style={S.error}>{errors.reference}</Text>}

        
        <Text style={S.label}>Proof of Payment</Text>
        <Text style={S.labelHint}>Upload your EFT slip or bank confirmation in a PDF format</Text>
        
        <TouchableOpacity
          style={[S.filePicker, file && S.filePickerDone]}
          onPress={pickFile}
          activeOpacity={0.75}
        >
          {file ? (
            <View style={S.fileRow}>
              <MaterialIcons name={getFileIcon(file.mimeType)} size={28} color={C.success} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[S.fileName, { color: C.success }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={S.fileMeta}>
                  {formatFileSize(file.size)} · {file.mimeType?.includes("pdf") ? "PDF" : file.mimeType?.includes("image") ? "Image" : "Document"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFile(null)} style={S.removeBtn}>
                <Feather name="x" size={16} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={S.fileEmpty}>
              <View style={S.fileIconWrap}>
                <Feather name="upload" size={28} color={C.primary} />
              </View>
              <Text style={S.filePrompt}>Tap to select file</Text>
              <Text style={S.fileHint}>PDF, JPG, PNG · Max 5 MB</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.file && <Text style={S.error}>{errors.file}</Text>}

        {/* INFO */}
        <View style={S.infoBox}>
          <Feather name="info" size={14} color={C.primary} />
          <Text style={S.infoText}>
            Your proof will be reviewed by the landlord. You'll be notified once approved or if any issues are found.
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={S.footer}>
        <TouchableOpacity style={S.btnCancel} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={S.btnCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.btnSubmit, (!canSubmit || loading) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <>
              <Text style={S.btnSubmitText}>Submit Proof</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  scroll: { flex: 1 },
  scrollPad: { padding: 20, paddingBottom: 20 },
  amountCard: {
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 20, alignItems: "center", marginBottom: 24,
  },
  amountLabel: { fontSize: 12, color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  amountValue: { fontSize: 32, fontWeight: "800", color: C.textPrimary, marginTop: 4 },
  amountPeriod: { fontSize: 13, color: C.textMuted, marginTop: 4 },
  label: {
    fontSize: 11, fontWeight: "700", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 20,
  },
  labelHint: { fontSize: 11, color: C.textMuted, marginBottom: 10 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.textPrimary,
  },
  inputErr: { borderColor: C.danger },
  filePicker: {
    borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed",
    borderRadius: 12, padding: 20, backgroundColor: C.surface,
  },
  filePickerDone: { borderColor: C.success, borderStyle: "solid", backgroundColor: C.success + "08" },
  fileRow: { flexDirection: "row", alignItems: "center" },
  fileEmpty: { alignItems: "center", gap: 8 },
  fileIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary + "10", alignItems: "center", justifyContent: "center" },
  filePrompt: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  fileHint: { fontSize: 11, color: C.textMuted },
  fileName: { fontSize: 13, fontWeight: "600" },
  fileMeta: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  removeBtn: { padding: 4 },
  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, backgroundColor: C.primary + "10", borderRadius: 10,
    borderWidth: 1, borderColor: C.primary + "20", marginTop: 24,
  },
  infoText: { flex: 1, fontSize: 12, color: C.primary, lineHeight: 17 },
  error: { fontSize: 11, color: C.danger, marginTop: 4 },
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