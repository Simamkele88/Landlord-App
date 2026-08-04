// TENANT PAYMENT METHOD PAGE
import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";
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

const F = { bebas: "bebas-neue", dm: "dm-sans", mono: "space-mono" };

const $input = {
  backgroundColor: C.muted2, borderWidth: 1, borderColor: C.border,
  borderRadius: 3, paddingHorizontal: 12, paddingVertical: 12,
  fontSize: 14, color: C.white, fontFamily: F.dm,
};

const BANKS = [
  { id: "fnb", name: "FNB", color: "#FF8C00" },
  { id: "standard", name: "Standard Bank", color: "#0066CC" },
  { id: "absa", name: "ABSA", color: "#CC0000" },
  { id: "nedbank", name: "Nedbank", color: "#00A650" },
  { id: "capitec", name: "Capitec", color: "#00A0DC" },
  { id: "tyme", name: "TymeBank", color: "#00BFA5" },
];

function fmt(n) { return `R ${Number(n || 0).toLocaleString("en-ZA")}`; }
function formatCardNumber(raw) { return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }
function formatExpiry(raw) { const d = raw.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }
function formatBillingPeriod(date) {
  if (!date) return "Current";
  const d = new Date(date);
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

export default function PaymentMethod() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice, tenant } = route.params || {};

  const [invoiceData, setInvoiceData] = useState(invoice);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [isPartial, setIsPartial] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    if (invoice) {
      const amountDue = Number(invoice.amount_due || invoice.amount || 0);
      const paidAmount = Number(invoice.paid_amount || 0);
      const remainingBalance = Number(invoice.remaining_balance || (amountDue - paidAmount));

      setRemaining(remainingBalance);
      setTotal(remainingBalance);
      setPaymentAmount(remainingBalance);
      setIsPartial(invoice.status === 'partial' || paidAmount > 0);
    }
  }, [invoice]);

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

  function goBack() { navigation.goBack(); }

  const submitPayment = async (paymentData) => {
    try {
      const response = await api.post('/tenants/me/payments', paymentData);
      let receiptNo = response.receipt_no || response.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`;
      let updatedInvoice;
      try {
        const invoiceResponse = await api.get(`/tenants/me/invoices/${invoice.id}`);
        updatedInvoice = invoiceResponse.invoice || invoiceResponse;
      } catch (err) {
        updatedInvoice = response.invoice || invoice;
      }
      const newStatus = updatedInvoice?.status || 'paid';
      const newRemaining = updatedInvoice?.remaining_balance || 0;
      return {
        success: true,
        receiptNo,
        invoice: updatedInvoice,
        status: newStatus,
        remaining: newRemaining,
        isPartial: newStatus === 'partial',
        isPending: response.status === 'pending' || response.isPending
      };
    } catch (error) {
      throw error;
    }
  };

  if (step === "method") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}>
          <TouchableOpacity onPress={goBack}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
          <Text style={S.headerTitle}>Payment Method</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <Text style={S.title}>Pay {fmt(paymentAmount)}</Text>
          <Text style={S.sub}>{formatBillingPeriod(invoice?.billing_period_start || null)} · {tenant?.unit}</Text>

          {invoice?.status === 'partial' && (
            <View style={S.partialBanner}>
              <Ionicons name="time-outline" size={16} color={C.gold} />
              <Text style={S.partialBannerText}>Partial payment. Remaining: {fmt(remaining)}</Text>
            </View>
          )}

          <View style={S.breakdown}>
            <View style={S.bRow}>
              <Text style={S.bLabel}>Original Amount</Text>
              <Text style={S.bValue}>{fmt(invoice?.amount_due || invoice?.amount || 0)}</Text>
            </View>
            {invoice?.paid_amount > 0 && (
              <View style={S.bRow}>
                <Text style={[S.bLabel, { color: C.greenLight }]}>Already Paid</Text>
                <Text style={[S.bValue, { color: C.greenLight }]}>- {fmt(invoice.paid_amount)}</Text>
              </View>
            )}
            {(invoice?.late_fees || 0) > 0 && (
              <View style={S.bRow}>
                <Text style={[S.bLabel, { color: C.redLight }]}>Late Fee</Text>
                <Text style={[S.bValue, { color: C.redLight }]}>+ {fmt(invoice.late_fees || 0)}</Text>
              </View>
            )}
            <View style={[S.bRow, S.bTotal]}>
              <Text style={S.bTotalLabel}>Total Due</Text>
              <Text style={S.bTotalValue}>{fmt(paymentAmount)}</Text>
            </View>
            {invoice?.status === 'partial' && (
              <View style={[S.bRow, { borderTopWidth: 0, paddingTop: 0 }]}>
                <Text style={[S.bLabel, { color: C.gold }]}>Status</Text>
                <Text style={[S.bValue, { color: C.gold }]}>Partially Paid</Text>
              </View>
            )}
          </View>

          <Text style={S.fieldLabel}>CHOOSE PAYMENT METHOD</Text>
          {[
            { id: "card", label: "Credit / Debit Card", icon: "credit-card", sub: "Visa, Mastercard" },
            { id: "eft", label: "Instant EFT via Ozow", icon: "university", sub: "Secure bank redirect" },
          ].map(m => {
            const active = method?.id === m.id;
            return (
              <TouchableOpacity key={m.id} onPress={() => setMethod(m)} activeOpacity={0.75}
                style={[S.optionRow, active && { borderColor: C.gold, backgroundColor: "rgba(232,160,18,0.04)" }]}>
                <View style={[S.optionIcon, active && { backgroundColor: "rgba(232,160,18,0.1)" }]}>
                  <FontAwesome5 name={m.icon} size={18} color={active ? C.gold : "rgba(245,240,232,0.35)"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.optionLabel, active && { color: C.gold }]}>{m.label}</Text>
                  <Text style={S.optionSub}>{m.sub}</Text>
                </View>
                <View style={[S.radio, active && { borderColor: C.gold }]}>{active && <View style={S.radioDot} />}</View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={goBack}><Text style={S.btnGhostText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={!method ? S.btnGoldDisabled : S.btnGold}
            onPress={() => method?.id === "card" ? setStep("card_form") : setStep("bank_select")}
            disabled={!method}>
            <Text style={S.btnGoldText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "card_form") {
    const validateCard = () => {
      const errors = {};
      if (!cardName.trim()) errors.cardName = "Name is required";
      if (cardNumber.replace(/\s/g, "").length < 16) errors.cardNumber = "Enter a valid 16-digit card number";
      if (expiry.length < 5) errors.expiry = "Enter MM/YY";
      if (cvv.length < 3) errors.cvv = "Enter 3-digit CVV";
      setCardErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
      if (!validateCard()) return;
      setStep("processing");

      try {
        const paymentData = {
          invoice_id: invoice.id,
          amount_paid: paymentAmount,
          payment_method: "card",
          bank_reference: `CARD-${Date.now()}`,
          auto_approve: true,
        };

        if (isPartial || paymentAmount < (invoice?.amount_due || 0)) {
          paymentData.allocated_rent = paymentAmount;
          paymentData.allocated_utilities = 0;
          paymentData.allocated_late_fees = 0;
        }

        const result = await submitPayment(paymentData);

        setRcpt({
          receiptNo: result.receiptNo,
          period: invoice?.billing_period_start,
          amount: paymentAmount,
          method: "Credit / Debit Card",
          paidOn: new Date().toISOString().slice(0, 10),
          tenant: tenant?.name,
          unit: tenant?.unit,
          property: tenant?.property,
          invoice_status: result.status,
          remaining_balance: result.remaining,
          is_partial: result.isPartial,
          is_pending: result.isPending,
        });
        setStep("success");
      } catch (err) {
        const errorMsg = err?.response?.data?.error || err?.message || "Payment submission failed. Please try again.";
        setPaymentError(errorMsg);
        setStep("failure");
      }
    };

    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep("method")}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
          <Text style={S.headerTitle}>Card Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <View style={S.paymentSummary}>
            <Text style={S.paymentSummaryLabel}>AMOUNT TO PAY</Text>
            <Text style={S.paymentSummaryValue}>{fmt(paymentAmount)}</Text>
            {isPartial && <Text style={S.paymentSummarySub}>Partial payment</Text>}
          </View>

          {[
            { label: "CARDHOLDER NAME", value: cardName, setter: setCardName, key: "cardName", placeholder: "Name as on card" },
            { label: "CARD NUMBER", value: cardNumber, setter: (v) => setCardNumber(formatCardNumber(v)), key: "cardNumber", placeholder: "0000 0000 0000 0000", keyboardType: "numeric", maxLength: 19 },
          ].map(f => (
            <View key={f.key} style={S.fieldGroup}>
              <Text style={S.fieldLabel}>{f.label}</Text>
              <TextInput style={[$input, cardErrors[f.key] && { borderColor: C.redLight }]} value={f.value}
                onChangeText={v => { f.setter(v); setCardErrors(e => ({ ...e, [f.key]: undefined })); }}
                placeholder={f.placeholder} placeholderTextColor="rgba(245,240,232,0.15)"
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
                <TextInput style={[$input, cardErrors[f.key] && { borderColor: C.redLight }]} value={f.value}
                  onChangeText={v => { f.setter(v); setCardErrors(e => ({ ...e, [f.key]: undefined })); }}
                  placeholder={f.placeholder} placeholderTextColor="rgba(245,240,232,0.15)"
                  keyboardType="numeric" maxLength={f.maxLength} secureTextEntry={f.secureTextEntry} />
                {cardErrors[f.key] && <Text style={S.fieldError}>{cardErrors[f.key]}</Text>}
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={() => setStep("method")}><Text style={S.btnGhostText}>Back</Text></TouchableOpacity>
          <TouchableOpacity style={S.btnGold} onPress={handleSubmit}>
            <Text style={S.btnGoldText}>Pay {fmt(paymentAmount)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "bank_select") {
    const handleOzowSubmit = async () => setStep("ozow_portal");

    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep("method")}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
          <Text style={S.headerTitle}>Select Bank</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <View style={S.paymentSummary}>
            <Text style={S.paymentSummaryLabel}>AMOUNT TO PAY</Text>
            <Text style={S.paymentSummaryValue}>{fmt(paymentAmount)}</Text>
            {isPartial && <Text style={S.paymentSummarySub}>Partial payment</Text>}
          </View>

          <Text style={S.sub}>You'll be redirected to your bank's secure page</Text>
          <View style={S.bankGrid}>
            {BANKS.map(b => {
              const active = bank?.id === b.id;
              return (
                <TouchableOpacity key={b.id} style={[S.bankCard, active && { borderColor: b.color, backgroundColor: b.color + "12" }]} onPress={() => setBank(b)} activeOpacity={0.75}>
                  <Text style={[S.bankName, active && { color: C.white }]}>{b.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={16} color={b.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={() => setStep("method")}><Text style={S.btnGhostText}>Back</Text></TouchableOpacity>
          <TouchableOpacity style={!bank ? S.btnGoldDisabled : S.btnGold} onPress={handleOzowSubmit} disabled={!bank}>
            <Text style={S.btnGoldText}>Pay {fmt(paymentAmount)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "ozow_portal") {
    const handleOzowSubmit = async () => {
      if (ozowPin.length < 5) { setOzowError("Enter your 5-digit PIN"); return; }
      setStep("processing");

      try {
        const paymentData = {
          invoice_id: invoice.id,
          amount_paid: paymentAmount,
          payment_method: "eft",
          bank_reference: `OZOW-${Date.now()}`,
          auto_approve: true,
        };

        if (isPartial || paymentAmount < (invoice?.amount_due || 0)) {
          paymentData.allocated_rent = paymentAmount;
          paymentData.allocated_utilities = 0;
          paymentData.allocated_late_fees = 0;
        }

        const result = await submitPayment(paymentData);

        setRcpt({
          receiptNo: result.receiptNo,
          period: invoice?.billing_period_start,
          amount: paymentAmount,
          method: "Instant EFT (Ozow)",
          paidOn: new Date().toISOString().slice(0, 10),
          tenant: tenant?.name,
          unit: tenant?.unit,
          property: tenant?.property,
          invoice_status: result.status,
          remaining_balance: result.remaining,
          is_partial: result.isPartial,
          is_pending: true,
        });
        setStep("success");
      } catch (err) {
        const errorMsg = err?.response?.data?.error || err?.message || "Payment submission failed. Please try again.";
        setPaymentError(errorMsg);
        setStep("failure");
      }
    };

    return (
      <SafeAreaView style={S.safe}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep("bank_select")}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
          <Text style={S.headerTitle}>{bank?.name} Banking</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <View style={S.amountBox}>
            <Text style={S.amountBoxLabel}>AMOUNT TO PAY</Text>
            <Text style={S.amountBoxValue}>{fmt(paymentAmount)}</Text>
            {isPartial && <Text style={[S.amountBoxSub, { color: C.gold }]}>Partial payment</Text>}
          </View>
          <View style={S.fieldGroup}>
            <Text style={S.fieldLabel}>Online Banking PIN</Text>
            <TextInput style={[$input, ozowError && { borderColor: C.redLight }]} value={ozowPin}
              onChangeText={v => { setOzowPin(v); setOzowError(""); }}
              placeholder="Enter your 5-digit PIN" placeholderTextColor="rgba(245,240,232,0.15)"
              keyboardType="numeric" secureTextEntry maxLength={5} />
            {ozowError ? <Text style={S.fieldError}>{ozowError}</Text> : null}
          </View>
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={() => setStep("bank_select")}><Text style={S.btnGhostText}>Back</Text></TouchableOpacity>
          <TouchableOpacity style={S.btnGold} onPress={handleOzowSubmit}><Text style={S.btnGoldText}>Authorize Payment</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "processing") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}><View style={{ width: 24 }} /><Text style={S.headerTitle}>Processing</Text><View style={{ width: 24 }} /></View>
        <View style={S.centerBlock}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={S.processingTitle}>Processing Payment</Text>
          <Text style={S.processingText}>Please don't close this screen</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "success" && generatedRcpt) {
    const isPartialPayment = generatedRcpt.is_partial || false;
    const isPending = generatedRcpt.is_pending || false;
    const remainingBalance = generatedRcpt.remaining_balance || 0;

    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}><View style={{ width: 24 }} /><Text style={S.headerTitle}>Payment Confirmed</Text><View style={{ width: 24 }} /></View>
        <ScrollView contentContainerStyle={S.pad}>
          <View style={S.successHeader}>
            <View style={isPending ? [S.successCircle, { backgroundColor: C.gold }] : S.successCircle}>
              <Ionicons name={isPending ? "time-outline" : "checkmark"} size={36} color={C.white} />
            </View>
            <Text style={S.successTitle}>{isPending ? "Payment Submitted!" : "Payment Successful!"}</Text>
            <Text style={S.successSub}>
              {isPending
                ? `Your payment of ${fmt(generatedRcpt.amount)} has been submitted and is pending landlord approval.`
                : `Your payment of ${fmt(generatedRcpt.amount)} has been processed.`}
            </Text>
            {isPartialPayment && remainingBalance > 0 && (
              <Text style={[S.successSub, { color: C.gold, marginTop: 4 }]}>Remaining balance: {fmt(remainingBalance)}</Text>
            )}
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
              ["Method", generatedRcpt.method],
              ["Date", generatedRcpt.paidOn],
              ["Status", isPending ? 'Pending Approval' : 'Confirmed'],
              ...(isPartialPayment && !isPending ? [["Balance Remaining", fmt(remainingBalance)]] : []),
            ].map(([l, v]) => (
              <View key={l} style={S.receiptRow}>
                <Text style={S.receiptLabel}>{l}</Text>
                <Text style={[S.receiptValue, l === 'Balance Remaining' && { color: C.gold }, l === 'Status' && { color: isPending ? C.gold : C.greenLight }]}>{v}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={[S.btnGhost, { borderColor: "rgba(232,160,18,0.18)" }]} onPress={() => Alert.alert("Download", "Receipt PDF coming soon.")}>
            <Feather name="download" size={14} color={C.gold} style={{ marginRight: 6 }} />
            <Text style={S.btnGhostTextGold}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.btnGold} onPress={() => navigation.goBack()}>
            <Text style={S.btnGoldText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "failure") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}><View style={{ width: 24 }} /><Text style={S.headerTitle}>Payment Failed</Text><View style={{ width: 24 }} /></View>
        <View style={S.centerBlock}>
          <Ionicons name="close-circle" size={56} color={C.redLight} style={{ marginBottom: 12 }} />
          <Text style={S.failureTitle}>Payment Failed</Text>
          <Text style={S.failureSub}>{paymentError || "Something went wrong. Please try again."}</Text>
        </View>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={goBack}><Text style={S.btnGhostText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={S.btnGold} onPress={() => { setPaymentError(null); setStep("method"); }}>
            <Text style={S.btnGoldText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  pad: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 2 },
  sub: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono, marginBottom: 18 },

  paymentSummary: { backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: "center", marginBottom: 16 },
  paymentSummaryLabel: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)", fontFamily: F.mono, letterSpacing: 1.5, textTransform: "uppercase" },
  paymentSummaryValue: { fontSize: 28, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginTop: 4 },
  paymentSummarySub: { fontSize: 11, color: C.gold, fontFamily: F.mono, marginTop: 4 },

  partialBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(232,160,18,0.06)", borderWidth: 1, borderColor: "rgba(232,160,18,0.15)", borderRadius: 4, padding: 12, marginBottom: 14 },
  partialBannerText: { flex: 1, fontSize: 12, color: C.gold, fontFamily: F.dm, marginLeft: 8 },

  breakdown: { backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 18 },
  bRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  bLabel: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono },
  bValue: { fontSize: 12, fontWeight: "600", color: C.white },
  bTotal: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 6, paddingTop: 8 },
  bTotalLabel: { fontSize: 13, fontWeight: "700", color: C.white, fontFamily: F.dm },
  bTotalValue: { fontSize: 16, fontWeight: "700", color: C.gold, fontFamily: F.bebas, letterSpacing: 1 },

  fieldLabel: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)", fontFamily: F.mono, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  fieldGroup: { marginBottom: 14 },
  fieldError: { fontSize: 10, color: C.redLight, fontFamily: F.mono, marginTop: 3 },

  optionRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8 },
  optionIcon: { width: 40, height: 40, borderRadius: 4, backgroundColor: C.muted, alignItems: "center", justifyContent: "center", marginRight: 10 },
  optionLabel: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  optionSub: { fontSize: 10, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.gold },

  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  bankCard: { width: "48%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12 },
  bankName: { fontSize: 12, fontWeight: "600", color: "rgba(245,240,232,0.5)", fontFamily: F.dm },

  amountBox: { backgroundColor: "rgba(232,160,18,0.04)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(232,160,18,0.15)", padding: 16, alignItems: "center", marginBottom: 18 },
  amountBoxLabel: { fontSize: 10, fontWeight: "600", color: "rgba(245,240,232,0.3)", fontFamily: F.mono, letterSpacing: 1.5, marginBottom: 4 },
  amountBoxValue: { fontSize: 26, fontWeight: "700", color: C.gold, fontFamily: F.bebas, letterSpacing: 1 },
  amountBoxSub: { fontSize: 11, color: "rgba(245,240,232,0.4)", fontFamily: F.mono, marginTop: 4 },

  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  processingTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginTop: 14 },
  processingText: { fontSize: 12, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, textAlign: "center", marginTop: 6 },

  successHeader: { alignItems: "center", marginBottom: 18 },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.greenLight, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },
  successSub: { fontSize: 13, color: "rgba(245,240,232,0.5)", textAlign: "center", lineHeight: 19, marginTop: 6, fontFamily: F.dm },
  receiptBadge: { backgroundColor: "rgba(26,122,74,0.08)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 3, borderWidth: 1, borderColor: "rgba(76,186,122,0.15)", marginTop: 10 },
  receiptBadgeText: { fontSize: 11, fontWeight: "600", color: C.greenLight, fontFamily: F.mono },

  receiptCard: { backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  receiptLabel: { fontSize: 11, color: "rgba(245,240,232,0.4)", fontFamily: F.mono },
  receiptValue: { fontSize: 11, fontWeight: "600", color: C.white, fontFamily: F.dm, textAlign: "right" },

  failureTitle: { fontSize: 20, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginTop: 12 },
  failureSub: { fontSize: 13, color: "rgba(245,240,232,0.5)", textAlign: "center", marginTop: 6, fontFamily: F.mono },

  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.muted2 },
  btnGhost: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12 },
  btnGhostText: { fontSize: 13, fontWeight: "600", color: "rgba(245,240,232,0.5)", fontFamily: F.dm, textAlign: "center" },
  btnGhostTextGold: { fontSize: 13, fontWeight: "600", color: C.gold, fontFamily: F.dm, textAlign: "center" },
  btnGold: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.gold, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12 },
  btnGoldDisabled: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.gold, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12, opacity: 0.4 },
  btnGoldText: { fontSize: 13, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" },
});