// TENANT PAYMENT UPLOAD PROOF PAGE
import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

const INVOICE_TYPE_CONFIG = {
  rent: { label: "Rent", color: C.blue },
  deposit: { label: "Deposit", color: C.green },
  damage: { label: "Damage", color: C.red },
  utility: { label: "Utility", color: C.primary },
  other: { label: "Other", color: C.textMuted },
};

function invoiceTypeConfig(type) {
  return INVOICE_TYPE_CONFIG[type] || INVOICE_TYPE_CONFIG.other;
}

function fmt(amount) { return `R ${Number(amount || 0).toLocaleString("en-ZA")}`; }

function formatPeriod(dateStr) {
  if (!dateStr) return "Current";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  } catch {
    return "Current";
  }
}

function generatePaymentReference(invoice, tenant) {
  let period = "CURRENT";
  if (invoice?.billing_period_start) {
    try {
      const date = new Date(invoice.billing_period_start);
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      period = `${month}${year}`;
    } catch { /* fallback */ }
  }

  let initials = 'XX';
  const fullName = tenant?.name || tenant?.full_name || '';
  if (fullName) {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
      initials = parts[0].slice(0, 2).toUpperCase();
    }
  }
  return `EFT-${initials}-${period}`;
}

export default function PaymentUpload() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    invoice,
    tenant,
    paymentPolicy,
    fullPaymentOnly,
    repayment_instalment_id,
  } = route.params || {};

  const [invoiceData, setInvoiceData] = useState(invoice);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [isPartial, setIsPartial] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);

  const invoiceType = invoice?.invoice_type || "rent";
  const typeCfg = invoiceTypeConfig(invoiceType);

  useEffect(() => {
    if (invoice) {
      const amountDue = Number(invoice.amount_due || invoice.amount || 0);
      const paid = Number(invoice.paid_amount || 0);
      const remaining = Number(invoice.remaining_balance || (amountDue - paid));
      const lateFee = Number(invoice.late_fees || invoice.lateFee || 0);

      setRemainingBalance(remaining);
      setTotalDue(remaining + lateFee);
      setPaidAmount(paid);
      setIsPartial(invoice.status === 'partial' || paid > 0);
    }
  }, [invoice]);

  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [useFullAmount, setUseFullAmount] = useState(true);

  const canPayDirect = paymentPolicy?.canPayDirect !== false;
  const fullPaymentRequired =
    fullPaymentOnly === true || paymentPolicy?.fullPaymentOnly === true;

  useEffect(() => {
    const generatedRef = generatePaymentReference(invoice, tenant);
    setReference(generatedRef);
  }, [invoice, tenant]);

  useEffect(() => {
    if (remainingBalance > 0) {
      if (fullPaymentRequired) {
        setAmount(String(remainingBalance));
      } else if (!amount) {
        setAmount(String(remainingBalance));
      }
    }
  }, [remainingBalance, fullPaymentRequired]);

  const canSubmit = reference.trim() !== "" && amount.trim() !== "" && file;

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedFile = result.assets[0];

        if (!selectedFile.mimeType?.includes('pdf') && !selectedFile.name?.toLowerCase().endsWith('.pdf')) {
          Alert.alert("Invalid File", "Please select a PDF file only.");
          return;
        }

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
    const amountNum = parseFloat(amount);
    if (!amount.trim()) e.amount = "Required";
    else if (isNaN(amountNum) || amountNum <= 0) e.amount = "Must be a valid amount";
    else if (amountNum > remainingBalance) e.amount = `Amount exceeds remaining balance of ${fmt(remainingBalance)}`;
    if (!reference.trim()) e.reference = "Required";
    if (!file) e.file = "Please attach a PDF proof of payment";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    if (!canPayDirect) {
      Alert.alert("Payment Blocked", "Your account is in collections. Please use a repayment plan.");
      setLoading(false);
      return;
    }

    if (fullPaymentRequired && parseFloat(amount) < remainingBalance) {
      Alert.alert("Full Payment Required", `You must pay the full outstanding balance of ${fmt(remainingBalance)}.`);
      setLoading(false);
      return;
    }
    try {
      let proofUrl = null;
      if (file) {
        const base64Data = await FileSystem.readAsStringAsync(file.uri, {
          encoding: 'base64',
        });

        const mimeType = file.mimeType || "application/pdf";
        const dataUri = `data:${mimeType};base64,${base64Data}`;

        const uploadRes = await api.post("/upload", {
          image: dataUri,
          fileName: file.name,
          mimeType,
          fileSize: file.size,
          uploadType: "payment",
        });
        proofUrl = uploadRes.document_url;
      }

      const amountNum = parseFloat(amount);
      const isPartialPayment = amountNum < totalDue;

      const paymentData = {
        invoice_id: invoice.id,
        amount_paid: amountNum,
        payment_method: "bank_transfer",
        bank_reference: reference.trim(),
        proof_of_payment_url: proofUrl,
      };

      if (isPartialPayment || invoice?.status === 'partial') {
        const rentAmount = Number(invoice.rent_amount || 0);
        const remainingRent = Math.max(0, rentAmount - paidAmount);
        const allocatedRent = Math.min(amountNum, remainingRent);
        const remainingAmount = amountNum - allocatedRent;

        const lateFees = Number(invoice.late_fees || invoice.lateFee || 0);
        const paidLateFees = Number(invoice.paid_late_fees || 0);
        const remainingLateFees = Math.max(0, lateFees - paidLateFees);
        const allocatedLateFees = Math.min(remainingAmount, remainingLateFees);

        paymentData.allocated_rent = allocatedRent;
        paymentData.allocated_late_fees = allocatedLateFees;
        paymentData.allocated_utilities = remainingAmount - allocatedLateFees;
      }

      let response;

      if (repayment_instalment_id) {
        response = await api.post(
          `/repayment-plans/me/instalments/${repayment_instalment_id}/pay`,
          paymentData,
        );
      } else {
        response = await api.submitPayment(paymentData);
      }

      const message = isPartialPayment
        ? `Your partial payment of ${fmt(amountNum)} has been submitted. ${fmt(remainingBalance - amountNum)} remains outstanding.`
        : `Your proof of payment for ${fmt(amountNum)} has been submitted. The landlord will review it shortly.`;

      Alert.alert(
        repayment_instalment_id
          ? "Instalment Payment Submitted"
          : isPartialPayment
            ? "Partial Payment Submitted"
            : "Payment Submitted",
        repayment_instalment_id
          ? `Your proof of payment for instalment ${invoice?.invoice_number || ""} has been submitted for review.`
          : message,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error("Submit payment:", err);
      Alert.alert("Error", err?.data?.error || err?.response?.data?.error || "Failed to submit payment. Please try again.");
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

  const inputStyle = (key) => [S.input, errors[key] && S.inputErr];

  const isPartialScenario = invoice?.status === 'partial' || paidAmount > 0;

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>
          {typeCfg.label} · {isPartialScenario ? "Partial Payment" : "Upload Proof"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad} keyboardShouldPersistTaps="handled">
        {/* INVOICE AMOUNT */}
        {invoice && (
          <View style={S.amountCard}>
            <Text style={S.amountLabel}>
              {isPartialScenario ? "REMAINING BALANCE" : "INVOICE AMOUNT"}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={[S.amountValue, isPartialScenario && { color: C.blue }]}>
                {isPartialScenario ? fmt(remainingBalance) : fmt(invoice.amount_due || invoice.amount)}
              </Text>
              <View style={[S.invoiceTypeBadge, { borderColor: typeCfg.color + "40", backgroundColor: typeCfg.color + "15" }]}>
                <Text style={[S.invoiceTypeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
              </View>
            </View>
            <Text style={S.amountPeriod}>
              {invoice.billing_period_start
                ? formatPeriod(invoice.billing_period_start)
                : invoice.period || "Current"}
            </Text>
            {isPartialScenario && paidAmount > 0 && (
              <View style={S.paidInfo}>
                <Text style={S.paidText}>
                  Already paid: {fmt(paidAmount)}
                </Text>
                <View style={S.statusBadge}>
                  <Text style={S.statusBadgeText}>Partial</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {fullPaymentRequired && !canPayDirect === false && (
          <View style={S.lockBanner}>
            <MaterialIcons name="lock" size={16} color={C.red} />
            <Text style={S.lockText}>
              Your account requires full payment of {fmt(remainingBalance)}.
            </Text>
          </View>
        )}

        {!canPayDirect && (
          <View style={[S.lockBanner, { backgroundColor: "rgba(111,66,193,0.06)", borderColor: "rgba(111,66,193,0.18)" }]}>
            <MaterialIcons name="block" size={16} color={C.purple} />
            <Text style={[S.lockText, { color: C.purple }]}>
              Account in collections — direct payments are blocked. Please use the repayment plan option.
            </Text>
          </View>
        )}

        {/* AMOUNT PAID */}
        <Text style={S.label}>Amount You're Paying (R)</Text>
        {isPartialScenario && (
          <Text style={S.labelHint}>
            Remaining balance: {fmt(remainingBalance)}
          </Text>
        )}
        <TextInput
          style={inputStyle("amount")}
          value={amount}
          onChangeText={v => {
            setAmount(v);
            setErrors(e => ({ ...e, amount: undefined }));
            if (v && parseFloat(v) < remainingBalance) {
              setUseFullAmount(false);
            }
          }}
          keyboardType="numeric"
          placeholder={isPartialScenario ? `Enter amount (max ${fmt(remainingBalance)})` : "e.g. 5800"}
          placeholderTextColor={C.textMuted}
          editable={!fullPaymentRequired && canPayDirect}
        />
        {errors.amount && <Text style={S.error}>{errors.amount}</Text>}

        {/* Quick Amount Buttons */}
        {isPartialScenario && remainingBalance > 0 && !fullPaymentRequired && (
          <View style={S.quickAmounts}>
            <TouchableOpacity
              style={[S.quickAmountBtn, parseFloat(amount) === remainingBalance && S.quickAmountBtnActive]}
              onPress={() => {
                setAmount(String(remainingBalance));
                setUseFullAmount(true);
                setErrors(e => ({ ...e, amount: undefined }));
              }}
            >
              <Text style={[S.quickAmountText, parseFloat(amount) === remainingBalance && S.quickAmountTextActive]}>
                Full Amount
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.quickAmountBtn, parseFloat(amount) === remainingBalance / 2 && S.quickAmountBtnActive]}
              onPress={() => {
                const half = Math.round(remainingBalance / 2);
                setAmount(String(half));
                setUseFullAmount(false);
                setErrors(e => ({ ...e, amount: undefined }));
              }}
            >
              <Text style={[S.quickAmountText, parseFloat(amount) === remainingBalance / 2 && S.quickAmountTextActive]}>
                50%
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.quickAmountBtn, parseFloat(amount) === remainingBalance / 4 && S.quickAmountBtnActive]}
              onPress={() => {
                const quarter = Math.round(remainingBalance / 4);
                setAmount(String(quarter));
                setUseFullAmount(false);
                setErrors(e => ({ ...e, amount: undefined }));
              }}
            >
              <Text style={[S.quickAmountText, parseFloat(amount) === remainingBalance / 4 && S.quickAmountTextActive]}>
                25%
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* REFERENCE */}
        <Text style={S.label}>Payment Reference</Text>
        <TextInput
          style={[inputStyle("reference"), S.referenceInput]}
          value={reference}
          onChangeText={v => {
            setReference(v.toUpperCase());
            setErrors(e => ({ ...e, reference: undefined }));
          }}
          placeholder="e.g. EFT-SW-JAN26"
          placeholderTextColor={C.textMuted}
          autoCapitalize="characters"
          editable={true}
        />
        {errors.reference && <Text style={S.error}>{errors.reference}</Text>}
        

        {/* PROOF OF PAYMENT */}
        <Text style={S.label}>Proof of Payment</Text>
        <Text style={S.labelHint}>Upload your EFT confirmation or bank statement as PDF</Text>

        <TouchableOpacity
          style={[S.filePicker, file && S.filePickerDone]}
          onPress={pickFile}
          activeOpacity={0.75}
        >
          {file ? (
            <View style={S.fileRow}>
              <MaterialIcons name="picture-as-pdf" size={26} color={C.green} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[S.fileName, { color: C.green }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={S.fileMeta}>
                  {formatFileSize(file.size)} · PDF Document
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFile(null)} style={S.removeBtn}>
                <Feather name="x" size={15} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={S.fileEmpty}>
              <View style={S.fileIconWrap}>
                <Feather name="file" size={26} color={C.primary} />
              </View>
              <Text style={S.filePrompt}>Tap to select PDF file</Text>
              <Text style={S.fileHint}>PDF only · Max 5 MB</Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.file && <Text style={S.error}>{errors.file}</Text>}

        {/* PARTIAL PAYMENT INFO */}
        {isPartialScenario && remainingBalance > 0 && parseFloat(amount) < remainingBalance && parseFloat(amount) > 0 && (
          <View style={S.partialInfoBox}>
            <Ionicons name="information-circle" size={16} color={C.blue} />
            <Text style={S.partialInfoText}>
              You're making a partial payment. {fmt(remainingBalance - parseFloat(amount))} will remain outstanding.
            </Text>
          </View>
        )}

        {/* FULL PAYMENT INFO */}
        {isPartialScenario && parseFloat(amount) === remainingBalance && remainingBalance > 0 && (
          <View style={[S.partialInfoBox, { borderColor: C.green + "30", backgroundColor: "rgba(43,122,75,0.06)" }]}>
            <Ionicons name="checkmark-circle" size={16} color={C.green} />
            <Text style={[S.partialInfoText, { color: C.green }]}>
              You're paying the full remaining balance. This will clear the invoice.
            </Text>
          </View>
        )}

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
          disabled={!canSubmit || loading || !canPayDirect}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : !canPayDirect ? (
            <Text style={S.btnSubmitText}>PAYMENTS BLOCKED</Text>
          ) : (
            <Text style={S.btnSubmitText}>
              {isPartialScenario && parseFloat(amount) < remainingBalance
                ? 'SUBMIT PARTIAL PAYMENT'
                : 'SUBMIT PROOF'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },

  scroll: { flex: 1 },
  scrollPad: { padding: 16 },

  amountCard: {
    backgroundColor: C.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 10,
    color: "#888888",
    fontFamily: F.mono,
    letterSpacing: 2
  },
  amountValue: {
    fontSize: 30,
    fontWeight: "700",
    color: C.textPrimary,
    fontFamily: F.bebas,
    letterSpacing: 1,
    marginTop: 4
  },
  amountPeriod: {
    fontSize: 11,
    color: C.textMuted,
    fontFamily: F.mono,
    marginTop: 4
  },
  paidInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8
  },
  paidText: {
    fontSize: 11,
    color: C.textMuted,
    fontFamily: F.mono
  },
  statusBadge: {
    backgroundColor: "rgba(52,152,219,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(52,152,219,0.15)"
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: C.blue,
    fontFamily: F.mono,
    textTransform: "uppercase"
  },

  invoiceTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1, alignSelf: 'center' },
  invoiceTypeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', fontFamily: F.mono, letterSpacing: 1 },

  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#888888",
    fontFamily: F.mono,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
    marginTop: 18,
  },
  labelHint: {
    fontSize: 10,
    color: C.textMuted,
    fontFamily: F.mono,
    marginBottom: 8
  },

  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: C.textPrimary,
    fontFamily: F.dm,
  },
  inputErr: { borderColor: C.red },

  referenceInput: {
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },
  refHint: {
    fontSize: 10,
    color: C.textMuted,
    fontFamily: F.mono,
    marginTop: 4,
  },

  quickAmounts: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 4
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickAmountBtnActive: {
    borderColor: C.primary,
    backgroundColor: "rgba(44,62,80,0.06)"
  },
  quickAmountText: {
    fontSize: 11,
    color: C.textMuted,
    fontFamily: F.mono
  },
  quickAmountTextActive: {
    color: C.primary
  },

  filePicker: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: "dashed",
    borderRadius: 4,
    padding: 18,
    backgroundColor: C.card,
  },
  filePickerDone: {
    borderColor: C.green,
    borderStyle: "solid",
    backgroundColor: "rgba(43,122,75,0.04)"
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  fileEmpty: {
    alignItems: "center",
    gap: 8
  },
  fileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: "rgba(44,62,80,0.1)",
    borderWidth: 1,
    borderColor: "rgba(44,62,80,0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  filePrompt: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textPrimary,
    fontFamily: F.dm
  },
  fileHint: {
    fontSize: 10,
    color: C.textMuted,
    fontFamily: F.mono
  },
  fileName: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: F.dm
  },
  fileMeta: {
    fontSize: 10,
    color: C.textMuted,
    fontFamily: F.mono,
    marginTop: 2
  },
  removeBtn: {
    padding: 4
  },

  partialInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(52,152,219,0.04)",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(52,152,219,0.15)",
    marginTop: 14,
  },
  partialInfoText: {
    flex: 1,
    fontSize: 11,
    color: C.blue,
    lineHeight: 16,
    fontFamily: F.mono
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(52,152,219,0.06)",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(52,152,219,0.15)",
    marginTop: 22,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: C.blue,
    lineHeight: 16,
    fontFamily: F.mono
  },

  error: {
    fontSize: 10,
    color: C.red,
    fontFamily: F.mono,
    marginTop: 3
  },

  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  btnCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 3,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: C.border,
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSecondary,
    fontFamily: F.dm,
    letterSpacing: 0.5
  },
  btnSubmit: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  btnSubmitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: F.dm,
    letterSpacing: 1,
    textTransform: "uppercase"
  },

  lockBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(158,58,58,0.06)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(158,58,58,0.18)",
    padding: 12,
    marginBottom: 14,
  },
  lockText: {
    flex: 1,
    fontSize: 12,
    color: C.red,
    fontFamily: F.dm,
    lineHeight: 18,
  },
});