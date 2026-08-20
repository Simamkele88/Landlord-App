// TENANT PAYMENT METHOD PAGE
import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar,
  ActivityIndicator, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

const $input = {
  backgroundColor: C.card,
  borderWidth: 1,
  borderColor: C.border,
  borderRadius: 3,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 14,
  color: C.textPrimary,
  fontFamily: F.dm,
};

const BANKS = [
  { id: "fnb", name: "FNB", color: "#FF8C00" },
  { id: "standard", name: "Standard Bank", color: "#0066CC" },
  { id: "absa", name: "ABSA", color: "#CC0000" },
  { id: "nedbank", name: "Nedbank", color: "#00A650" },
  { id: "capitec", name: "Capitec", color: "#00A0DC" },
  { id: "tyme", name: "TymeBank", color: "#00BFA5" },
];

const INVOICE_TYPE_CONFIG = {
  rent:    { label: "Rent",    color: C.blue },
  deposit: { label: "Deposit", color: C.green },
  damage:  { label: "Damage",  color: C.red },
  utility: { label: "Utility", color: C.primary },
  other:   { label: "Other",   color: C.textMuted },
};

function invoiceTypeConfig(type) {
  return INVOICE_TYPE_CONFIG[type] || INVOICE_TYPE_CONFIG.other;
}

function fmt(n) { return `R ${Number(n || 0).toLocaleString("en-ZA")}`; }
function formatCardNumber(raw) { return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }
function formatExpiry(raw) { const d = raw.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }

function luhnCheck(num) {
  const arr = num.split('').reverse().map(Number);
  const sum = arr.reduce((acc, digit, idx) => {
    if (idx % 2 === 1) {
      let doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);
  return sum % 10 === 0;
}

function formatBillingPeriod(date) {
  if (!date) return "Current";
  const d = new Date(date);
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

export default function PaymentMethod() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice, tenant } = route.params || {};

  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [bank, setBank] = useState(null);
  const [generatedRcpt, setRcpt] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardErrors, setCardErrors] = useState({});
  const [ozowPin, setOzowPin] = useState("");
  const [ozowError, setOzowError] = useState("");
  const [paymentError, setPaymentError] = useState(null);
  const [loading, setLoading] = useState(false);

  const invoiceType = invoice?.invoice_type || "rent";
  const typeCfg = invoiceTypeConfig(invoiceType);

  const paymentAmount = Number(invoice?.remaining_balance || invoice?.amount_due || 0);

  function goBack() { navigation.goBack(); }

  async function initiatePayFast(paymentData) {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, payment_id: `PF-${Date.now()}`, status: 'paid' }), 1500));
  }

  const submitPayment = async (paymentData) => {
    const payResult = await initiatePayFast(paymentData);
    if (!payResult.success) {
      throw new Error(payResult.message || "Payment failed");
    }
    return {
      success: true,
      receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
      payment_id: payResult.payment_id,
      status: payResult.status,
      amount: paymentData.amount_paid,
      method: paymentData.payment_method,
    };
  };

  function validateCard() {
    const errors = {};
    if (!cardName.trim()) errors.cardName = "Name is required";
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length !== 16) errors.cardNumber = "Enter a valid 16-digit card number";
    else if (!luhnCheck(digits)) errors.cardNumber = "Invalid card number";
    const [month, year] = expiry.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (!month || !year || month.length !== 2 || year.length !== 2) errors.expiry = "Enter MM/YY";
    else if (Number(month) < 1 || Number(month) > 12) errors.expiry = "Invalid month";
    else if (Number(year) < currentYear || (Number(year) === currentYear && Number(month) < currentMonth)) errors.expiry = "Card expired";
    if (cvv.length < 3) errors.cvv = "Enter 3-digit CVV";
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCardPayment() {
    if (!validateCard()) return;
    setLoading(true);
    setStep("processing");
    try {
      const result = await submitPayment({
        invoice_id: invoice.id,
        amount_paid: paymentAmount,
        payment_method: "card",
        card_number: cardNumber.replace(/\s/g, ""),
        card_expiry: expiry,
        card_cvv: cvv,
      });
      setRcpt({
        ...result,
        period: invoice?.billing_period_start,
        tenant: tenant?.name || "Tenant",
        unit: tenant?.unit || "—",
        property: tenant?.property || "—",
      });
      setStep("success");
    } catch (err) {
      setPaymentError(err.message || "Payment failed. Please try again.");
      setStep("failure");
    } finally {
      setLoading(false);
    }
  }

  async function handleEftPayment() {
    setLoading(true);
    setStep("processing");
    try {
      const result = await submitPayment({
        invoice_id: invoice.id,
        amount_paid: paymentAmount,
        payment_method: "eft",
        bank: bank?.id,
      });
      setRcpt({
        ...result,
        period: invoice?.billing_period_start,
        tenant: tenant?.name || "Tenant",
        unit: tenant?.unit || "—",
        property: tenant?.property || "—",
      });
      setStep("success");
    } catch (err) {
      setPaymentError(err.message || "Payment failed. Please try again.");
      setStep("failure");
    } finally {
      setLoading(false);
    }
  }

  if (step === "method") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.header}>
          <TouchableOpacity onPress={goBack}><Feather name="arrow-left" size={20} color={C.textPrimary} /></TouchableOpacity>
          <Text style={S.headerTitle}>Payment Method</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <Text style={S.title}>Pay {fmt(paymentAmount)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <View style={[S.invoiceTypeBadge, { borderColor: typeCfg.color + "40", backgroundColor: typeCfg.color + "15" }]}>
              <Text style={[S.invoiceTypeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
            </View>
            <Text style={S.sub}>{invoice?.invoice_number || invoice?.id}</Text>
          </View>
          <Text style={S.sub}>{formatBillingPeriod(invoice?.billing_period_start || null)} · {tenant?.unit}</Text>

          {invoice?.status === 'partial' && (
            <View style={S.partialBanner}>
              <Ionicons name="time-outline" size={16} color={C.blue} />
              <Text style={S.partialBannerText}>Partial payment. Remaining: {fmt(paymentAmount)}</Text>
            </View>
          )}

          <View style={S.breakdown}>
            <View style={S.bRow}>
              <Text style={S.bLabel}>Invoice Amount</Text>
              <Text style={S.bValue}>{fmt(invoice?.amount_due || invoice?.amount || 0)}</Text>
            </View>
            {invoice?.paid_amount > 0 && (
              <View style={S.bRow}>
                <Text style={[S.bLabel, { color: C.green }]}>Already Paid</Text>
                <Text style={[S.bValue, { color: C.green }]}>- {fmt(invoice.paid_amount)}</Text>
              </View>
            )}
            {(invoice?.late_fees || 0) > 0 && (
              <View style={S.bRow}>
                <Text style={[S.bLabel, { color: C.red }]}>Late Fee</Text>
                <Text style={[S.bValue, { color: C.red }]}>+ {fmt(invoice.late_fees || 0)}</Text>
              </View>
            )}
            <View style={[S.bRow, S.bTotal]}>
              <Text style={S.bTotalLabel}>Total Due</Text>
              <Text style={S.bTotalValue}>{fmt(paymentAmount)}</Text>
            </View>
            {invoice?.status === 'partial' && (
              <View style={[S.bRow, { borderTopWidth: 0, paddingTop: 0 }]}>
                <Text style={[S.bLabel, { color: C.blue }]}>Status</Text>
                <Text style={[S.bValue, { color: C.blue }]}>Partially Paid</Text>
              </View>
            )}
          </View>

          <Text style={S.fieldLabel}>CHOOSE PAYMENT METHOD</Text>
          {[
            { id: "card", label: "Credit / Debit Card", icon: "credit-card", sub: "Visa, Mastercard" },
            { id: "eft", label: "Instant EFT via PayFast", icon: "university", sub: "Secure bank redirect" },
          ].map(m => {
            const active = method?.id === m.id;
            return (
              <TouchableOpacity key={m.id} onPress={() => setMethod(m)} activeOpacity={0.75}
                style={[S.optionRow, active && { borderColor: C.primary, backgroundColor: "rgba(44,62,80,0.04)" }]}>
                <View style={[S.optionIcon, active && { backgroundColor: "rgba(44,62,80,0.1)" }]}>
                  <FontAwesome5 name={m.icon} size={18} color={active ? C.primary : C.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.optionLabel, active && { color: C.primary }]}>{m.label}</Text>
                  <Text style={S.optionSub}>{m.sub}</Text>
                </View>
                <View style={[S.radio, active && { borderColor: C.primary }]}>{active && <View style={S.radioDot} />}</View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={goBack}><Text style={S.btnGhostText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={!method ? S.btnPrimaryDisabled : S.btnPrimary}
            onPress={() => method?.id === "card" ? setStep("card_form") : setStep("bank_select")}
            disabled={!method}>
            <Text style={S.btnPrimaryText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "card_form") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep("method")}><Feather name="arrow-left" size={20} color={C.textPrimary} /></TouchableOpacity>
          <Text style={S.headerTitle}>Card Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <View style={S.paymentSummary}>
            <Text style={S.paymentSummaryLabel}>AMOUNT TO PAY</Text>
            <Text style={S.paymentSummaryValue}>{fmt(paymentAmount)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <View style={[S.invoiceTypeBadge, { borderColor: typeCfg.color + "40", backgroundColor: typeCfg.color + "15" }]}>
                <Text style={[S.invoiceTypeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
              </View>
              <Text style={S.paymentSummarySub}>{invoice?.invoice_number || invoice?.id}</Text>
            </View>
            {invoice?.status === 'partial' && <Text style={S.paymentSummarySub}>Partial payment</Text>}
          </View>

          {[
            { label: "CARDHOLDER NAME", value: cardName, setter: setCardName, key: "cardName", placeholder: "Name as on card" },
            { label: "CARD NUMBER", value: cardNumber, setter: (v) => setCardNumber(formatCardNumber(v)), key: "cardNumber", placeholder: "0000 0000 0000 0000", keyboardType: "numeric", maxLength: 19 },
          ].map(f => (
            <View key={f.key} style={S.fieldGroup}>
              <Text style={S.fieldLabel}>{f.label}</Text>
              <TextInput style={[$input, cardErrors[f.key] && { borderColor: C.red }]} value={f.value}
                onChangeText={v => { f.setter(v); setCardErrors(e => ({ ...e, [f.key]: undefined })); }}
                placeholder={f.placeholder} placeholderTextColor={C.textMuted}
                keyboardType={f.keyboardType} maxLength={f.maxLength} />
              {cardErrors[f.key] && <Text style={S.fieldError}>{cardErrors[f.key]}</Text>}
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { label: "EXPIRY", value: expiry, setter: (v) => setExpiry(formatExpiry(v)), key: "expiry", placeholder: "MM/YY", maxLength: 5 },
              { label: "CVV", value: cvv, setter: (v) => setCvv(v.replace(/\D/g, "").slice(0, 3)), key: "cvv", placeholder: "···", maxLength: 3, secureTextEntry: true },
            ].map(f => (
              <View key={f.key} style={[S.fieldGroup, { flex: 1 }]}>
                <Text style={S.fieldLabel}>{f.label}</Text>
                <TextInput style={[$input, cardErrors[f.key] && { borderColor: C.red }]} value={f.value}
                  onChangeText={v => { f.setter(v); setCardErrors(e => ({ ...e, [f.key]: undefined })); }}
                  placeholder={f.placeholder} placeholderTextColor={C.textMuted}
                  keyboardType="numeric" maxLength={f.maxLength} secureTextEntry={f.secureTextEntry} />
                {cardErrors[f.key] && <Text style={S.fieldError}>{cardErrors[f.key]}</Text>}
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={() => setStep("method")}><Text style={S.btnGhostText}>Back</Text></TouchableOpacity>
          <TouchableOpacity style={S.btnPrimary} onPress={handleCardPayment}>
            <Text style={S.btnPrimaryText}>Pay {fmt(paymentAmount)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "bank_select") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep("method")}><Feather name="arrow-left" size={20} color={C.textPrimary} /></TouchableOpacity>
          <Text style={S.headerTitle}>Select Bank</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <View style={S.paymentSummary}>
            <Text style={S.paymentSummaryLabel}>AMOUNT TO PAY</Text>
            <Text style={S.paymentSummaryValue}>{fmt(paymentAmount)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <View style={[S.invoiceTypeBadge, { borderColor: typeCfg.color + "40", backgroundColor: typeCfg.color + "15" }]}>
                <Text style={[S.invoiceTypeText, { color: typeCfg.color }]}>{typeCfg.label}</Text>
              </View>
              <Text style={S.paymentSummarySub}>{invoice?.invoice_number || invoice?.id}</Text>
            </View>
            {invoice?.status === 'partial' && <Text style={S.paymentSummarySub}>Partial payment</Text>}
          </View>

          <Text style={S.sub}>You'll be redirected to your bank's secure page</Text>
          <View style={S.bankGrid}>
            {BANKS.map(b => {
              const active = bank?.id === b.id;
              return (
                <TouchableOpacity key={b.id} style={[S.bankCard, active && { borderColor: b.color, backgroundColor: b.color + "12" }]} onPress={() => setBank(b)} activeOpacity={0.75}>
                  <Text style={[S.bankName, active && { color: C.textPrimary }]}>{b.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={16} color={b.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={() => setStep("method")}><Text style={S.btnGhostText}>Back</Text></TouchableOpacity>
          <TouchableOpacity style={!bank ? S.btnPrimaryDisabled : S.btnPrimary} onPress={handleEftPayment} disabled={!bank}>
            <Text style={S.btnPrimaryText}>Pay {fmt(paymentAmount)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "processing") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.header}><View style={{ width: 24 }} /><Text style={S.headerTitle}>Processing</Text><View style={{ width: 24 }} /></View>
        <View style={S.centerBlock}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={S.processingTitle}>Processing Payment</Text>
          <Text style={S.processingText}>Please don't close this screen</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "success" && generatedRcpt) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.header}><View style={{ width: 24 }} /><Text style={S.headerTitle}>Payment Confirmed</Text><View style={{ width: 24 }} /></View>
        <ScrollView contentContainerStyle={S.pad}>
          <View style={S.successHeader}>
            <View style={S.successCircle}>
              <Ionicons name="checkmark" size={36} color="#ffffff" />
            </View>
            <Text style={S.successTitle}>Payment Successful!</Text>
            <Text style={S.successSub}>
              Your payment of {fmt(generatedRcpt.amount)} has been processed.
            </Text>
            <View style={S.receiptBadge}>
              <Text style={S.receiptBadgeText}>Receipt: {generatedRcpt.receiptNo}</Text>
            </View>
          </View>
          <View style={S.receiptCard}>
            <Text style={[S.fieldLabel, { marginBottom: 10 }]}>RECEIPT DETAILS</Text>
            {[
              ["Tenant", generatedRcpt.tenant],
              ["Unit", `${generatedRcpt.unit} · ${generatedRcpt.property}`],
              ["Period", formatBillingPeriod(generatedRcpt.period)],
              ["Amount", fmt(generatedRcpt.amount)],
              ["Method", generatedRcpt.method === "card" ? "Credit / Debit Card" : "Instant EFT (PayFast)"],
              ["Date", new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })],
            ].map(([l, v]) => (
              <View key={l} style={S.receiptRow}>
                <Text style={S.receiptLabel}>{l}</Text>
                <Text style={S.receiptValue}>{v}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnPrimary} onPress={() => navigation.goBack()}>
            <Text style={S.btnPrimaryText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "failure") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.header}><View style={{ width: 24 }} /><Text style={S.headerTitle}>Payment Failed</Text><View style={{ width: 24 }} /></View>
        <View style={S.centerBlock}>
          <Ionicons name="close-circle" size={56} color={C.red} style={{ marginBottom: 12 }} />
          <Text style={S.failureTitle}>Payment Failed</Text>
          <Text style={S.failureSub}>{paymentError || "Something went wrong. Please try again."}</Text>
        </View>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={goBack}><Text style={S.btnGhostText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={S.btnPrimary} onPress={() => { setPaymentError(null); setStep("method"); }}>
            <Text style={S.btnPrimaryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  pad: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 2 },
  sub: { fontSize: 12, color: C.textMuted, fontFamily: F.mono, marginBottom: 18 },

  invoiceTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3, borderWidth: 1, alignSelf: 'flex-start' },
  invoiceTypeText:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', fontFamily: F.mono, letterSpacing: 1 },

  paymentSummary: { backgroundColor: C.card, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: "center", marginBottom: 16 },
  paymentSummaryLabel: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 1.5, textTransform: "uppercase" },
  paymentSummaryValue: { fontSize: 28, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1, marginTop: 4 },
  paymentSummarySub: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginTop: 4 },

  partialBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(52,152,219,0.08)", borderWidth: 1, borderColor: "rgba(52,152,219,0.15)", borderRadius: 4, padding: 12, marginBottom: 14 },
  partialBannerText: { flex: 1, fontSize: 12, color: C.blue, fontFamily: F.dm, marginLeft: 8 },

  breakdown: { backgroundColor: C.card, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 18 },
  bRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  bLabel: { fontSize: 12, color: C.textMuted, fontFamily: F.mono },
  bValue: { fontSize: 12, fontWeight: "600", color: C.textPrimary },
  bTotal: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 6, paddingTop: 8 },
  bTotalLabel: { fontSize: 13, fontWeight: "700", color: C.textPrimary, fontFamily: F.dm },
  bTotalValue: { fontSize: 16, fontWeight: "700", color: C.primary, fontFamily: F.bebas, letterSpacing: 1 },

  fieldLabel: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  fieldGroup: { marginBottom: 14 },
  fieldError: { fontSize: 10, color: C.red, fontFamily: F.mono, marginTop: 3 },

  optionRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8 },
  optionIcon: { width: 40, height: 40, borderRadius: 4, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", marginRight: 10 },
  optionLabel: { fontSize: 13, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  optionSub: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.primary },

  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  bankCard: { width: "48%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.card, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12 },
  bankName: { fontSize: 12, fontWeight: "600", color: C.textSecondary, fontFamily: F.dm },

  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  processingTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1, marginTop: 14 },
  processingText: { fontSize: 12, color: C.textMuted, fontFamily: F.mono, textAlign: "center", marginTop: 6 },

  successHeader: { alignItems: "center", marginBottom: 18 },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.green, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  successSub: { fontSize: 13, color: C.textSecondary, textAlign: "center", lineHeight: 19, marginTop: 6, fontFamily: F.dm },
  receiptBadge: { backgroundColor: "rgba(43,122,75,0.08)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 3, borderWidth: 1, borderColor: "rgba(43,122,75,0.15)", marginTop: 10 },
  receiptBadgeText: { fontSize: 11, fontWeight: "600", color: C.green, fontFamily: F.mono },

  receiptCard: { backgroundColor: C.card, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  receiptLabel: { fontSize: 11, color: C.textMuted, fontFamily: F.mono },
  receiptValue: { fontSize: 11, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, textAlign: "right" },

  failureTitle: { fontSize: 20, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1, marginTop: 12 },
  failureSub: { fontSize: 13, color: C.textSecondary, textAlign: "center", marginTop: 6, fontFamily: F.mono },

  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  btnGhost: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12 },
  btnGhostText: { fontSize: 13, fontWeight: "600", color: C.textSecondary, fontFamily: F.dm, textAlign: "center" },
  btnPrimary: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.primary, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12 },
  btnPrimaryDisabled: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.primary, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12, opacity: 0.4 },
  btnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#ffffff", fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" },
});