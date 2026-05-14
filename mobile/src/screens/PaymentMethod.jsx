// TENANT PAYMENT METHOD PAGE — IN-APP PAYMENT FLOW
// AUTHOR: SIMAMKELE WEKEZA

import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";

const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", successBg: "#052E16",
  warning: "#F59E0B", warningBg: "#451A03",
  danger: "#EF4444", dangerBg: "#450A0A",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

const SIM = {
  cardDeclined: false,
  eftCancelled: false,
  eftFailed: false,
  receiptGenFails: false,
  processingDelayMs: 2400,
  ozowRedirectMs: 1800,
  ozowReturnMs: 2000,
};

function fmt(n) { return `R ${Number(n).toLocaleString("en-ZA")}`; }

function formatCardNumber(raw) {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(raw) {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

const METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "credit-card", sub: "Visa, Mastercard", badge: "Instant", lib: "FontAwesome5" },
  { id: "eft", label: "Instant EFT via Ozow", icon: "university", sub: "Secure bank redirect", badge: "1-2 min", lib: "FontAwesome5" },
];

const BANKS = [
  { id: "fnb", name: "FNB", color: "#FF8C00" },
  { id: "standard", name: "Standard Bank", color: "#0066CC" },
  { id: "absa", name: "ABSA", color: "#CC0000" },
  { id: "nedbank", name: "Nedbank", color: "#00A650" },
  { id: "capitec", name: "Capitec", color: "#00A0DC" },
  { id: "tyme", name: "TymeBank", color: "#00BFA5" },
];

const DECLINE_REASONS = [
  "Insufficient funds", "Card authentication failed",
  "Transaction declined by your bank", "Incorrect PIN entered", "Card limit exceeded",
];

function randomDeclineReason() {
  return DECLINE_REASONS[Math.floor(Math.random() * DECLINE_REASONS.length)];
}

export default function PaymentMethod() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice, tenant } = route.params || {};

  const total = (invoice?.amount || 0) + (invoice?.lateFee || 0);

  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [bank, setBank] = useState(null);
  const [declineReason, setDecline] = useState("");
  const [retryCount, setRetry] = useState(0);
  const [generatedRcpt, setRcpt] = useState(null);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardErrors, setCardErrors] = useState({});
  const [ozowPin, setOzowPin] = useState("");
  const [ozowError, setOzowError] = useState("");

  function goBack() { navigation.goBack(); }

  function proceedFromMethod() {
    if (!method) return;
    if (method.id === "card") setStep("card_form");
    if (method.id === "eft") setStep("bank_select");
  }

  function validateCard() {
    const e = {};
    if (cardName.trim().length < 2) e.cardName = "Enter cardholder name";
    if (cardNumber.replace(/\s/g, "").length < 16) e.cardNumber = "Enter valid 16-digit card number";
    if (expiry.length < 5) e.expiry = "Enter expiry MM/YY";
    if (cvv.length < 3) e.cvv = "Enter 3-digit CVV";
    return e;
  }

  function submitCard() {
    const e = validateCard();
    if (Object.keys(e).length) { setCardErrors(e); return; }
    setStep("processing");
    setTimeout(() => processPaymentResult(), SIM.processingDelayMs);
  }

  function proceedToOzow() {
    if (!bank) return;
    setStep("ozow_redirect");
    setTimeout(() => setStep("ozow_portal"), SIM.ozowRedirectMs);
  }

  function submitOzowPayment() {
    if (ozowPin.length < 5) { setOzowError("Enter your online banking PIN"); return; }
    setOzowError("");
    setStep("ozow_return");
    setTimeout(() => {
      if (SIM.eftCancelled || SIM.eftFailed) {
        setStep("processing");
        setTimeout(() => {
          setDecline(SIM.eftCancelled ? "Payment cancelled by user" : "EFT transaction rejected by bank");
          setStep("failure");
        }, 800);
      } else {
        setStep("processing");
        setTimeout(() => processPaymentResult(), SIM.processingDelayMs);
      }
    }, SIM.ozowReturnMs);
  }

  function processPaymentResult() {
    if (SIM.cardDeclined && method?.id === "card") {
      setDecline(randomDeclineReason());
      setStep("failure");
      return;
    }

    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;

    if (SIM.receiptGenFails) {
      setStep("receipt_error");
      return;
    }

    const receipt = {
      receiptNo, period: invoice?.period, amount: total,
      method: method?.label ?? "-", paidOn: new Date().toISOString().slice(0, 10),
      tenant: tenant?.name, unit: tenant?.unit, property: tenant?.property,
      reference: `TXN-${receiptNo}`,
    };
    setRcpt(receipt);
    setStep("success");
  }

  function retry() {
    setRetry(c => c + 1);
    setDecline("");
    setStep("method");
  }

  // STEP 1: METHOD SELECTION
  if (step === "method") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={S.header}>
          <TouchableOpacity onPress={goBack} style={S.backBtn}>
            <Feather name="arrow-left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Payment Method</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          <Text style={S.title}>Pay {fmt(total)}</Text>
          <Text style={S.sub}>{invoice?.period} · {tenant?.unit}</Text>

          {retryCount > 0 && (
            <View style={S.retryBanner}>
              <Feather name="alert-circle" size={15} color={C.warning} />
              <Text style={S.retryBannerText}>Previous attempt failed. Try a different method.</Text>
            </View>
          )}

          {/* Amount breakdown */}
          <View style={S.breakdown}>
            <View style={S.bRow}>
              <Text style={S.bLabel}>Rent - {invoice?.period}</Text>
              <Text style={S.bValue}>{fmt(invoice?.amount || 0)}</Text>
            </View>
            {(invoice?.lateFee || 0) > 0 && (
              <View style={S.bRow}>
                <Text style={[S.bLabel, { color: C.danger }]}>Late fee</Text>
                <Text style={[S.bValue, { color: C.danger }]}>+{fmt(invoice.lateFee)}</Text>
              </View>
            )}
            <View style={[S.bRow, S.bTotal]}>
              <Text style={S.bTotalLabel}>Total Due</Text>
              <Text style={S.bTotalValue}>{fmt(total)}</Text>
            </View>
          </View>

          <Text style={S.fieldLabel}>Choose payment method</Text>
          {METHODS.map(m => {
            const active = method?.id === m.id;
            const Lib = { FontAwesome5, Ionicons, Feather }[m.lib] ?? Feather;
            return (
              <TouchableOpacity key={m.id} onPress={() => setMethod(m)} activeOpacity={0.75}
                style={[S.methodRow, active && S.methodRowActive]}>
                <View style={[S.methodIcon, active && { backgroundColor: C.primary + "20" }]}>
                  <Lib name={m.icon} size={20} color={active ? C.primary : C.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={[S.methodLabel, active && { color: C.primary }]}>{m.label}</Text>
                    <View style={[S.badge, { marginLeft: 8 }]}><Text style={S.badgeText}>{m.badge}</Text></View>
                  </View>
                  <Text style={S.methodSub}>{m.sub}</Text>
                </View>
                <View style={[S.radio, active && { borderColor: C.primary }]}>
                  {active && <View style={S.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={S.footer}>
          <TouchableOpacity style={S.btnSec} onPress={goBack}><Text style={S.btnSecText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={[S.btnPri, !method && S.btnOff]} onPress={proceedFromMethod} disabled={!method}>
            <Text style={S.btnPriText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 2: CARD FORM
  if (step === "card_form") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep("method")} style={S.backBtn}>
            <Feather name="arrow-left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Card Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          <View style={S.fieldGroup}>
            <Text style={S.fieldLabel}>Cardholder Name</Text>
            <TextInput style={[S.input, cardErrors.cardName && S.inputErr]} value={cardName}
              onChangeText={v => { setCardName(v); setCardErrors(e => ({ ...e, cardName: undefined })); }}
              placeholder="Name as on card" placeholderTextColor={C.textMuted} autoCapitalize="words" />
            {cardErrors.cardName && <Text style={S.fieldError}>{cardErrors.cardName}</Text>}
          </View>

          <View style={S.fieldGroup}>
            <Text style={S.fieldLabel}>Card Number</Text>
            <TextInput style={[S.input, cardErrors.cardNumber && S.inputErr]} value={cardNumber}
              onChangeText={v => { setCardNumber(formatCardNumber(v)); setCardErrors(e => ({ ...e, cardNumber: undefined })); }}
              placeholder="0000 0000 0000 0000" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={19} />
            {cardErrors.cardNumber && <Text style={S.fieldError}>{cardErrors.cardNumber}</Text>}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={[S.fieldGroup, { flex: 1 }]}>
              <Text style={S.fieldLabel}>Expiry</Text>
              <TextInput style={[S.input, cardErrors.expiry && S.inputErr]} value={expiry}
                onChangeText={v => { setExpiry(formatExpiry(v)); setCardErrors(e => ({ ...e, expiry: undefined })); }}
                placeholder="MM/YY" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={5} />
              {cardErrors.expiry && <Text style={S.fieldError}>{cardErrors.expiry}</Text>}
            </View>
            <View style={[S.fieldGroup, { flex: 1 }]}>
              <Text style={S.fieldLabel}>CVV</Text>
              <TextInput style={[S.input, cardErrors.cvv && S.inputErr]} value={cvv}
                onChangeText={v => { setCvv(v.replace(/\D/g, "").slice(0, 3)); setCardErrors(e => ({ ...e, cvv: undefined })); }}
                placeholder="···" placeholderTextColor={C.textMuted} keyboardType="numeric" secureTextEntry maxLength={3} />
              {cardErrors.cvv && <Text style={S.fieldError}>{cardErrors.cvv}</Text>}
            </View>
          </View>
        </ScrollView>

        <View style={S.footer}>
          <TouchableOpacity style={S.btnSec} onPress={() => setStep("method")}><Text style={S.btnSecText}>Back</Text></TouchableOpacity>
          <TouchableOpacity style={S.btnPri} onPress={submitCard}><Text style={S.btnPriText}>Pay {fmt(total)}</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 3: BANK SELECTION (EFT)
  if (step === "bank_select") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep("method")} style={S.backBtn}>
            <Feather name="arrow-left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Select Bank</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          <Text style={S.sub}>You'll be redirected to your bank's secure payment page</Text>

          <View style={S.bankGrid}>
            {BANKS.map(b => {
              const active = bank?.id === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[S.bankCard, active && { borderColor: b.color, backgroundColor: b.color + "12" }]}
                  onPress={() => setBank(b)}
                  activeOpacity={0.75}
                >
                  <Text style={[S.bankName, active && { color: C.textPrimary }]}>{b.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={b.color} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {bank && (
            <View style={S.secureNote}>
              <Feather name="shield" size={14} color={C.success} />
              <Text style={S.secureNoteText}>Secure connection via {bank.name}'s encrypted payment gateway.</Text>
            </View>
          )}
        </ScrollView>

        <View style={S.footer}>
          <TouchableOpacity style={S.btnSec} onPress={() => setStep("method")}>
            <Text style={S.btnSecText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.btnPri, !bank && S.btnOff]} onPress={proceedToOzow} disabled={!bank}>
            <Feather name="lock" size={15} color={C.white} style={{ marginRight: 8 }} />
            <Text style={S.btnPriText}>Pay {fmt(total)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 4: OZOW REDIRECT
  if (step === "ozow_redirect") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={S.centerBlock}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={S.processingTitle}>Redirecting to Ozow...</Text>
          <Text style={S.processingText}>You'll be taken to your bank's secure page.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 5: OZOW PORTAL
  if (step === "ozow_portal") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep("bank_select")} style={S.backBtn}>
            <Feather name="arrow-left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>{bank?.name} Banking</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
          <View style={S.bankInfo}>
            <Text style={S.bankInfoName}>{bank?.name}</Text>
          </View>

          <View style={S.amountBox}>
            <Text style={S.amountBoxLabel}>Amount to Pay</Text>
            <Text style={S.amountBoxValue}>{fmt(total)}</Text>
            <Text style={S.amountBoxRef}>Reference: {tenant?.unit} Rent</Text>
          </View>

          <View style={S.fieldGroup}>
            <Text style={S.fieldLabel}>Online Banking PIN</Text>
            <TextInput
              style={[S.input, ozowError ? S.inputErr : null]}
              value={ozowPin}
              onChangeText={v => { setOzowPin(v); setOzowError(""); }}
              placeholder="Enter your 5-digit PIN"
              placeholderTextColor={C.textMuted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={5}
            />
            {ozowError ? <Text style={S.fieldError}>{ozowError}</Text> : null}
          </View>
        </ScrollView>

        <View style={S.footer}>
          <TouchableOpacity style={S.btnSec} onPress={() => setStep("bank_select")}>
            <Text style={S.btnSecText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.btnPri} onPress={submitOzowPayment}>
            <Text style={S.btnPriText}>Authorize Payment</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 6: OZOW RETURN
  if (step === "ozow_return") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={S.centerBlock}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={S.processingTitle}>Returning...</Text>
          <Text style={S.processingText}>Please wait while we confirm your payment.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 7: PROCESSING
  if (step === "processing") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={S.centerBlock}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={S.processingTitle}>Processing Payment...</Text>
          <Text style={S.processingText}>Please don't close this screen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 8: SUCCESS 
if (step === "success" && generatedRcpt) {
  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* HEADER */}
      <View style={S.header}>
        <View style={{ width: 40 }} />
        <Text style={S.headerTitle}>Payment Confirmed</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={S.scrollPad}>
        {/* SUCCESS HEADER */}
        <View style={S.successHeader}>
          <View style={S.successCircle}>
            <Ionicons name="checkmark" size={40} color={C.white} />
          </View>
          <Text style={S.successTitle}>Payment Successful!</Text>
          <Text style={S.successSub}>
            Your payment of {fmt(generatedRcpt.amount)} for {generatedRcpt.period} has been processed.
          </Text>
          <View style={S.receiptBadge}>
            <Text style={S.receiptBadgeText}>Receipt: {generatedRcpt.receiptNo}</Text>
          </View>
        </View>

        {/* RECEIPT DETAILS */}
        <View style={S.receiptCard}>
          <Text style={S.receiptCardTitle}>Receipt Details</Text>
          <View style={S.receiptBody}>
            {[
              ["Tenant", generatedRcpt.tenant],
              ["Unit", `${generatedRcpt.unit} · ${generatedRcpt.property}`],
              ["Period", generatedRcpt.period],
              ["Amount", fmt(generatedRcpt.amount)],
              ["Method", generatedRcpt.method],
              ["Date", generatedRcpt.paidOn],
              ["Reference", generatedRcpt.reference],
            ].map(([label, val]) => (
              <View key={label} style={S.receiptRow}>
                <Text style={S.receiptLabel}>{label}</Text>
                <Text style={S.receiptValue}>{val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* INFO NOTE */}
        <View style={S.infoBox}>
          <Feather name="info" size={14} color={C.primary} />
          <Text style={S.infoText}>
            The landlord has been notified of your payment. Thank you for your payment.
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER WITH DOWNLOAD & DONE */}
      <View style={S.footer}>
        <TouchableOpacity
          style={S.btnDownload}
          onPress={() => Alert.alert("Download", "Receipt PDF download will be available soon.")}
          activeOpacity={0.8}
        >
          <Feather name="download" size={16} color={C.primary} />
          <Text style={S.btnDownloadText}>Download Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.btnDone} onPress={goBack} activeOpacity={0.8}>
          <Text style={S.btnDoneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

  // STEP 9: FAILURE
  if (step === "failure") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView contentContainerStyle={S.scrollPad}>
          <View style={S.centerBlock}>
            <Ionicons name="close-circle" size={60} color={C.danger} />
            <Text style={S.failureTitle}>Payment Failed</Text>
            <Text style={S.failureSub}>{declineReason}</Text>
          </View>
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnSec} onPress={goBack}><Text style={S.btnSecText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={S.btnPri} onPress={retry}><Text style={S.btnPriText}>Try Again</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
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
  scroll: { flex: 1 },
  scrollPad: { padding: 20, paddingBottom: 20 },
  title: { fontSize: 20, fontWeight: "700", color: C.textPrimary, marginBottom: 4 },
  sub: { fontSize: 13, color: C.textSecondary, marginBottom: 20 },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  processingTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary, marginTop: 16 },
  processingText: { fontSize: 13, color: C.textSecondary, textAlign: "center", marginTop: 8 },

  breakdown: { backgroundColor: C.surfaceAlt, borderRadius: 12, padding: 14, marginBottom: 20 },
  bRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  bLabel: { fontSize: 13, color: C.textSecondary },
  bValue: { fontSize: 13, fontWeight: "600", color: C.textPrimary },
  bTotal: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 6, paddingTop: 10 },
  bTotalLabel: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  bTotalValue: { fontSize: 18, fontWeight: "800", color: C.primary },

  retryBanner: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.warningBg,
    borderRadius: 10, borderWidth: 1, borderColor: C.warning + "30", padding: 12, marginBottom: 16,
  },
  retryBannerText: { fontSize: 12, color: C.warning, flex: 1, marginLeft: 8, lineHeight: 17 },

  fieldLabel: { fontSize: 11, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 },
  fieldGroup: { marginBottom: 14 },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.textPrimary },
  inputErr: { borderColor: C.danger },
  fieldError: { fontSize: 11, color: C.danger, marginTop: 4 },

  methodRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.surface,
    borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10,
  },
  methodRowActive: { borderColor: C.primary, backgroundColor: C.primary + "08" },
  methodIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.surfaceAlt, alignItems: "center", justifyContent: "center", marginRight: 12 },
  methodLabel: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  methodSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  badge: { backgroundColor: C.primary + "20", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "600", color: C.primary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },

  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  bankCard: {
    width: "48%", flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12,
  },
  bankDot: { width: 10, height: 10, borderRadius: 5 },
  bankName: { flex: 1, fontSize: 13, fontWeight: "600", color: C.textSecondary },
  secureNote: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: C.success + "10", borderRadius: 10 },
  secureNoteText: { fontSize: 12, color: C.success, flex: 1 },
  bankInfo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 },
  bankInfoName: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
  amountBox: {
    backgroundColor: C.primary + "10", borderRadius: 12, borderWidth: 1,
    borderColor: C.primary + "30", padding: 16, alignItems: "center", marginBottom: 20,
  },
  amountBoxLabel: { fontSize: 12, fontWeight: "600", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  amountBoxValue: { fontSize: 28, fontWeight: "800", color: C.primary, marginBottom: 4 },
  amountBoxRef: { fontSize: 12, color: C.textSecondary },

  successHeader: { alignItems: "center", marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: "800", color: C.textPrimary, marginTop: 12 },
  receiptNo: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  receiptBody: { backgroundColor: C.surfaceAlt, borderRadius: 12, padding: 16, marginBottom: 12 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  receiptLabel: { fontSize: 13, color: C.textSecondary },
  receiptValue: { fontSize: 13, fontWeight: "600", color: C.textPrimary, textAlign: "right" },
  failureTitle: { fontSize: 22, fontWeight: "800", color: C.textPrimary, marginTop: 12 },
  failureSub: { fontSize: 13, color: C.textSecondary, textAlign: "center", marginTop: 8 },

  footer: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  btnPri: { flex: 1, flexDirection: "row", backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center", gap: 6 },
  btnPriText: { color: C.white, fontSize: 15, fontWeight: "700" },
  btnSec: { flex: 1, backgroundColor: C.surfaceAlt, borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  btnSecText: { color: C.textSecondary, fontSize: 15, fontWeight: "600" },
  btnOff: { opacity: 0.4 },
  successCircle: {
  width: 80, height: 80, borderRadius: 40,
  backgroundColor: C.success, alignItems: "center", justifyContent: "center", marginBottom: 16,
},
successSub: { fontSize: 14, color: C.textSecondary, textAlign: "center", lineHeight: 20, marginTop: 8 },
receiptBadge: {
  backgroundColor: C.successBg, paddingHorizontal: 14, paddingVertical: 6,
  borderRadius: 8, borderWidth: 1, borderColor: C.success + "30", marginTop: 12,
},
receiptBadgeText: { fontSize: 12, fontWeight: "600", color: C.success },
receiptCard: { marginBottom: 16 },
receiptCardTitle: { fontSize: 13, fontWeight: "700", color: C.textPrimary, marginBottom: 12 },

infoBox: {
  flexDirection: "row", alignItems: "flex-start", gap: 8,
  padding: 12, backgroundColor: C.primary + "10", borderRadius: 10,
  borderWidth: 1, borderColor: C.primary + "20", marginBottom: 16,
},
infoText: { flex: 1, fontSize: 12, color: C.primary, lineHeight: 17 },

// UPDATED FOOTER BUTTONS
btnDownload: {
  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  paddingVertical: 14, borderRadius: 12, backgroundColor: C.surfaceAlt,
  borderWidth: 1, borderColor: C.border,
},
btnDownloadText: { fontSize: 14, fontWeight: "600", color: C.primary },
btnDone: {
  flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  paddingVertical: 14, borderRadius: 12, backgroundColor: C.success,
},
btnDoneText: { fontSize: 14, fontWeight: "700", color: C.white },
});