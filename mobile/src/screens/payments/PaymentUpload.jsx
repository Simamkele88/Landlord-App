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
};

const F = {
  bebas: "bebas-neue",
  dm:    "dm-sans",
  mono:  "space-mono",
};

function fmt(amount) { return `R ${Number(amount).toLocaleString("en-ZA")}`; }

function formatPeriod(dateStr) {
  if (!dateStr) return "Current";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  } catch {
    return "Current";
  }
}

export default function PaymentUpload() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice } = route.params || {};

  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(String(invoice?.amount_due || invoice?.amount || ""));
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const canSubmit = reference.trim() !== "" && amount.trim() !== "" && file;

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedFile = result.assets[0];
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
    try {
      let proofUrl = null;
      if (file) {
        const formData = new FormData();
        formData.append("image", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        });
        formData.append("fileName", file.name);
        formData.append("mimeType", file.mimeType);
        formData.append("fileSize", String(file.size));
        formData.append("uploadType", "payment");

        const uploadRes = await api.postFormData("/upload", formData);
        proofUrl = uploadRes.document_url;
      }

      await api.submitPayment({
        invoice_id: invoice.id,
        amount_paid: Number(amount),
        payment_method: "bank_transfer",
        bank_reference: reference.trim(),
        proof_of_payment_url: proofUrl,
      });

      Alert.alert(
        "Submitted", 
        "Your proof of payment has been submitted. The landlord will review it shortly.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error("Submit payment:", err);
      Alert.alert("Error", err?.data?.error || "Failed to submit payment. Please try again.");
    } finally {
      setLoading(false);
    }
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
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.white} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Upload Proof</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad} keyboardShouldPersistTaps="handled">
        {/* INVOICE AMOUNT */}
        {invoice && (
          <View style={S.amountCard}>
            <Text style={S.amountLabel}>INVOICE AMOUNT</Text>
            <Text style={S.amountValue}>{fmt(invoice.amount_due || invoice.amount)}</Text>
            <Text style={S.amountPeriod}>
              {invoice.billing_period_start 
                ? formatPeriod(invoice.billing_period_start)
                : invoice.period || "Current"}
            </Text>
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
          placeholderTextColor="rgba(245,240,232,0.2)"
        />
        {errors.amount && <Text style={S.error}>{errors.amount}</Text>}

        {/* REFERENCE */}
        <Text style={S.label}>Payment Reference</Text>
        <TextInput
          style={inputStyle("reference")}
          value={reference}
          onChangeText={v => { setReference(v); setErrors(e => ({ ...e, reference: undefined })); }}
          placeholder="e.g. EFT-20260403-001"
          placeholderTextColor="rgba(245,240,232,0.2)"
          autoCapitalize="characters"
        />
        {errors.reference && <Text style={S.error}>{errors.reference}</Text>}

        {/* PROOF OF PAYMENT */}
        <Text style={S.label}>Proof of Payment</Text>
        <Text style={S.labelHint}>Upload your EFT slip or bank confirmation</Text>

        <TouchableOpacity
          style={[S.filePicker, file && S.filePickerDone]}
          onPress={pickFile}
          activeOpacity={0.75}
        >
          {file ? (
            <View style={S.fileRow}>
              <MaterialIcons name={getFileIcon(file.mimeType)} size={26} color={C.greenLight} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[S.fileName, { color: C.greenLight }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={S.fileMeta}>
                  {formatFileSize(file.size)} · {file.mimeType?.includes("pdf") ? "PDF" : file.mimeType?.includes("image") ? "Image" : "Document"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFile(null)} style={S.removeBtn}>
                <Feather name="x" size={15} color="rgba(245,240,232,0.3)" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={S.fileEmpty}>
              <View style={S.fileIconWrap}>
                <Feather name="upload" size={26} color={C.gold} />
              </View>
              <Text style={S.filePrompt}>Tap to select file</Text>
              <Text style={S.fileHint}>PDF, JPG, PNG · Max 5 MB</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.file && <Text style={S.error}>{errors.file}</Text>}

        {/* INFO */}
        <View style={S.infoBox}>
          <Feather name="info" size={13} color={C.blue} />
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
            <ActivityIndicator color={C.black} size="small" />
          ) : (
            <Text style={S.btnSubmitText}>SUBMIT PROOF</Text>
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
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollPad: { padding: 16 },

  amountCard: {
    backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border,
    padding: 18, alignItems: "center", marginBottom: 20,
  },
  amountLabel: { fontSize: 10, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, letterSpacing: 2 },
  amountValue: { fontSize: 30, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginTop: 4 },
  amountPeriod: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, marginTop: 4 },

  label: {
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.3)",
    fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 1.5,
    marginBottom: 6, marginTop: 18,
  },
  labelHint: { fontSize: 10, color: "rgba(245,240,232,0.2)", fontFamily: F.mono, marginBottom: 8 },

  input: {
    backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border,
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 14, color: C.white, fontFamily: F.dm,
  },
  inputErr: { borderColor: C.redLight },

  filePicker: {
    borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed",
    borderRadius: 4, padding: 18, backgroundColor: C.muted2,
  },
  filePickerDone: { borderColor: C.greenLight, borderStyle: "solid", backgroundColor: "rgba(26,122,74,0.04)" },
  fileRow: { flexDirection: "row", alignItems: "center" },
  fileEmpty: { alignItems: "center", gap: 8 },
  fileIconWrap: { width: 48, height: 48, borderRadius: 6, backgroundColor: "rgba(232,160,18,0.1)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)", alignItems: "center", justifyContent: "center" },
  filePrompt: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  fileHint: { fontSize: 10, color: "rgba(245,240,232,0.25)", fontFamily: F.mono },
  fileName: { fontSize: 12, fontWeight: "600", fontFamily: F.dm },
  fileMeta: { fontSize: 10, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, marginTop: 2 },
  removeBtn: { padding: 4 },

  infoBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, backgroundColor: "rgba(58,143,212,0.06)", borderRadius: 3,
    borderWidth: 1, borderColor: "rgba(58,143,212,0.15)", marginTop: 22,
  },
  infoText: { flex: 1, fontSize: 11, color: "rgba(58,143,212,0.7)", lineHeight: 16, fontFamily: F.mono },

  error: { fontSize: 10, color: C.redLight, fontFamily: F.mono, marginTop: 3 },

  footer: {
    flexDirection: "row", gap: 10, padding: 14,
    borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.muted2,
  },
  btnCancel: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 13, borderRadius: 3, backgroundColor: "transparent",
    borderWidth: 1, borderColor: C.border,
  },
  btnCancelText: { fontSize: 13, fontWeight: "500", color: "rgba(245,240,232,0.5)", fontFamily: F.dm, letterSpacing: 0.5 },
  btnSubmit: {
    flex: 2, alignItems: "center", justifyContent: "center",
    paddingVertical: 13, borderRadius: 3, backgroundColor: C.gold,
  },
  btnSubmitText: { fontSize: 13, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
});