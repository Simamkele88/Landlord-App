// TENANT PAYMENT METHOD PAGE 
import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Alert,
} from "react-native";
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

const SIM = { processingDelayMs: 2000, ozowRedirectMs: 1500, ozowReturnMs: 1800 };
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

function fmt(n) { return `R ${Number(n).toLocaleString("en-ZA")}`; }
function formatCardNumber(raw) { return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }
function formatExpiry(raw) { const d = raw.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }

export default function PaymentMethod() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice, tenant } = route.params || {};
  const total = (invoice?.amount_due || invoice?.amount || tenant?.rentAmount || 0) + (invoice?.lateFee || 0);

  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [bank, setBank] = useState(null);
  const [cardSimMode, setCardSimMode] = useState("success");
  const [ozowSimMode, setOzowSimMode] = useState("success");
  const [declineReason, setDecline] = useState("");
  const [generatedRcpt, setRcpt] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardErrors, setCardErrors] = useState({});
  const [ozowPin, setOzowPin] = useState("");
  const [ozowError, setOzowError] = useState("");

  function goBack() { navigation.goBack(); }

  // METHOD SELECTION
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
          <Text style={S.title}>Pay {fmt(total)}</Text>
          <Text style={S.sub}>{invoice?.billing_period_start || invoice?.period || "Current"} · {tenant?.unit}</Text>

          <View style={S.breakdown}>
            <View style={S.bRow}><Text style={S.bLabel}>Rent</Text><Text style={S.bValue}>{fmt(invoice?.amount_due || invoice?.amount || 0)}</Text></View>
            {(invoice?.lateFee || 0) > 0 && <View style={S.bRow}><Text style={[S.bLabel, { color: C.redLight }]}>Late fee</Text><Text style={[S.bValue, { color: C.redLight }]}>+ {fmt(invoice.lateFee)}</Text></View>}
            <View style={[S.bRow, S.bTotal]}><Text style={S.bTotalLabel}>Total Due</Text><Text style={S.bTotalValue}>{fmt(total)}</Text></View>
          </View>

          <Text style={S.fieldLabel}>CHOOSE PAYMENT METHOD</Text>
          {[
            { id: "card", label: "Credit / Debit Card", icon: "credit-card", sub: "Visa, Mastercard — Instant approval", badge: "Instant" },
            { id: "eft", label: "Instant EFT via Ozow", icon: "university", sub: "Secure bank redirect — Needs review", badge: "1-2 min" },
          ].map(m => {
            const active = method?.id === m.id;
            return (
              <TouchableOpacity key={m.id} onPress={() => setMethod(m)} activeOpacity={0.75}
                style={[S.optionRow, active && { borderColor: C.gold, backgroundColor: "rgba(232,160,18,0.04)" }]}>
                <View style={[S.optionIcon, active && { backgroundColor: "rgba(232,160,18,0.1)" }]}>
                  <FontAwesome5 name={m.icon} size={18} color={active ? C.gold : "rgba(245,240,232,0.35)"} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={[S.optionLabel, active && { color: C.gold }]}>{m.label}</Text>
                    <View style={[S.badge, { marginLeft: 8 }]}><Text style={S.badgeText}>{m.badge}</Text></View>
                  </View>
                  <Text style={S.optionSub}>{m.sub}</Text>
                </View>
                <View style={[S.radio, active && { borderColor: C.gold }]}>{active && <View style={S.radioDot} />}</View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={goBack}><Text style={S.btnGhostText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={!method ? S.btnGoldDisabled : S.btnGold} onPress={() => method?.id === "card" ? setStep("card_form") : setStep("bank_select")} disabled={!method}>
            <Text style={S.btnGoldText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // CARD FORM
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
        if (cardSimMode === "success") {
          await api.submitPayment({
            invoice_id: invoice.id,
            amount_paid: total,
            payment_method: "card",
            bank_reference: `CARD-${Date.now()}`,
            auto_approve: true, 
          });
          
          setRcpt({
            receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
            period: invoice?.billing_period_start || invoice?.period,
            amount: total,
            method: "Credit / Debit Card",
            paidOn: new Date().toISOString().slice(0, 10),
            tenant: tenant?.name,
            unit: tenant?.unit,
            property: tenant?.property,
          });
          setStep("success");
        } else {
          setDecline(DECLINE_REASONS[Math.floor(Math.random() * DECLINE_REASONS.length)]);
          setStep("failure");
        }
      } catch (err) {
        setDecline("Payment submission failed. Please try again.");
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
          <View style={S.simToggle}>
            <MaterialIcons name="settings" size={16} color={C.blue} style={{ marginRight: 8 }} />
            <Text style={S.simLabel}>Simulate outcome:</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity style={[S.simBtn, cardSimMode === "success" && S.simBtnActive]} onPress={() => setCardSimMode("success")}>
                <Text style={[S.simBtnText, cardSimMode === "success" && S.simBtnTextActive]}>Success</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.simBtn, cardSimMode === "fail" && S.simBtnActive]} onPress={() => setCardSimMode("fail")}>
                <Text style={[S.simBtnText, cardSimMode === "fail" && S.simBtnTextActive]}>Decline</Text>
              </TouchableOpacity>
            </View>
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
            <Text style={S.btnGoldText}>Pay {fmt(total)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // BANK SELECTION 
  if (step === "bank_select") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}>
          <TouchableOpacity onPress={() => setStep("method")}><Feather name="arrow-left" size={20} color={C.white} /></TouchableOpacity>
          <Text style={S.headerTitle}>Select Bank</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={S.pad}>
          <Text style={S.sub}>You'll be redirected to your bank's secure page</Text>
          <View style={S.simToggle}>
            <MaterialIcons name="settings" size={16} color={C.blue} style={{ marginRight: 8 }} />
            <Text style={S.simLabel}>Simulate outcome:</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity style={[S.simBtn, ozowSimMode === "success" && S.simBtnActive]} onPress={() => setOzowSimMode("success")}>
                <Text style={[S.simBtnText, ozowSimMode === "success" && S.simBtnTextActive]}>Success</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.simBtn, ozowSimMode === "fail" && S.simBtnActive]} onPress={() => setOzowSimMode("fail")}>
                <Text style={[S.simBtnText, ozowSimMode === "fail" && S.simBtnTextActive]}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
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
          <TouchableOpacity style={!bank ? S.btnGoldDisabled : S.btnGold} onPress={() => { setStep("ozow_redirect"); setTimeout(() => setStep("ozow_portal"), SIM.ozowRedirectMs); }} disabled={!bank}>
            <Text style={S.btnGoldText}>Pay {fmt(total)}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // OZOW PORTAL 
  if (step === "ozow_portal") {
    const handleOzowSubmit = async () => {
      if (ozowPin.length < 5) { setOzowError("Enter your 5-digit PIN"); return; }
      setStep("ozow_return");
      
      setTimeout(async () => {
        setStep("processing");
        try {
          if (ozowSimMode === "success") {
            // EFT payment — goes to pending for landlord review
            await api.submitPayment({
              invoice_id: invoice.id,
              amount_paid: total,
              payment_method: "eft",
              bank_reference: `OZOW-${Date.now()}`,
            });
            
            setRcpt({
              receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
              period: invoice?.billing_period_start || invoice?.period,
              amount: total,
              method: "Instant EFT (Ozow)",
              paidOn: new Date().toISOString().slice(0, 10),
              tenant: tenant?.name,
              unit: tenant?.unit,
              property: tenant?.property,
            });
            setStep("success");
          } else {
            setDecline(DECLINE_REASONS[Math.floor(Math.random() * DECLINE_REASONS.length)]);
            setStep("failure");
          }
        } catch (err) {
          setDecline("Payment submission failed. Please try again.");
          setStep("failure");
        }
      }, SIM.ozowReturnMs);
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
            <Text style={S.amountBoxValue}>{fmt(total)}</Text>
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

  // LOADING
  if (["ozow_redirect", "ozow_return", "processing"].includes(step)) {
    const labels = {
      ozow_redirect: ["Redirecting to Ozow...", "You'll be taken to your bank's secure page."],
      ozow_return: ["Returning...", "Please wait while we confirm your payment."],
      processing: ["Processing Payment...", "Please don't close this screen."],
    };
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}><View style={{ width: 24 }} /><Text style={S.headerTitle}>Processing</Text><View style={{ width: 24 }} /></View>
        <View style={S.centerBlock}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={S.processingTitle}>{labels[step][0]}</Text>
          <Text style={S.processingText}>{labels[step][1]}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // SUCCESS
  if (step === "success" && generatedRcpt) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}><View style={{ width: 24 }} /><Text style={S.headerTitle}>Payment Confirmed</Text><View style={{ width: 24 }} /></View>
        <ScrollView contentContainerStyle={S.pad}>
          <View style={S.successHeader}>
            <View style={S.successCircle}><Ionicons name="checkmark" size={36} color={C.white} /></View>
            <Text style={S.successTitle}>Payment Successful!</Text>
            <Text style={S.successSub}>Your payment of {fmt(generatedRcpt.amount)} has been processed.</Text>
            <View style={S.receiptBadge}><Text style={S.receiptBadgeText}>Receipt: {generatedRcpt.receiptNo}</Text></View>
          </View>
          <View style={S.receiptCard}>
            <Text style={[S.fieldLabel, { marginBottom: 10 }]}>RECEIPT DETAILS</Text>
            {[["Tenant", generatedRcpt.tenant], ["Unit", `${generatedRcpt.unit} · ${generatedRcpt.property}`], ["Period", generatedRcpt.period], ["Amount", fmt(generatedRcpt.amount)], ["Method", generatedRcpt.method], ["Date", generatedRcpt.paidOn]].map(([l, v]) => (
              <View key={l} style={S.receiptRow}><Text style={S.receiptLabel}>{l}</Text><Text style={S.receiptValue}>{v}</Text></View>
            ))}
          </View>
        </ScrollView>
        <View style={S.footer}>
          <TouchableOpacity style={[S.btnGhost, { borderColor: "rgba(232,160,18,0.18)" }]} onPress={() => Alert.alert("Download", "Receipt PDF coming soon.")}>
            <Feather name="download" size={14} color={C.gold} style={{ marginRight: 6 }} />
            <Text style={S.btnGhostTextGold}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={S.btnGoldGreen} 
            onPress={() => {
              navigation.goBack();
              setTimeout(() => {
                navigation.getParent()?.navigate("PaymentReceipt", { 
                  payment: {
                    ...generatedRcpt,
                    amount: generatedRcpt.amount,
                    paidOn: generatedRcpt.paidOn,
                    method: generatedRcpt.method,
                    period: generatedRcpt.period,
                    tenant_name: tenant?.name || generatedRcpt.tenant,
                    unit_number: tenant?.unit || generatedRcpt.unit,
                    property_name: tenant?.property || generatedRcpt.property,
                    receiptNo: generatedRcpt.receiptNo,
                    reference: "In-App Payment",
                  }
                });
              }, 300);
            }}
          >
            <Text style={S.btnGoldTextWhite}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // FAILURE
  if (step === "failure") {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.header}><View style={{ width: 24 }} /><Text style={S.headerTitle}>Payment Failed</Text><View style={{ width: 24 }} /></View>
        <View style={S.centerBlock}>
          <Ionicons name="close-circle" size={56} color={C.redLight} style={{ marginBottom: 12 }} />
          <Text style={S.failureTitle}>Payment Failed</Text>
          <Text style={S.failureSub}>{declineReason}</Text>
        </View>
        <View style={S.footer}>
          <TouchableOpacity style={S.btnGhost} onPress={goBack}><Text style={S.btnGhostText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={S.btnGold} onPress={() => setStep("method")}><Text style={S.btnGoldText}>Try Again</Text></TouchableOpacity>
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
  simToggle: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(58,143,212,0.08)", borderWidth: 1, borderColor: "rgba(58,143,212,0.2)", borderRadius: 4, padding: 10, marginBottom: 16 },
  simLabel: { fontSize: 11, color: C.blue, fontFamily: F.mono, flex: 1 },
  simBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, borderWidth: 1, borderColor: "rgba(58,143,212,0.3)" },
  simBtnActive: { backgroundColor: "rgba(58,143,212,0.15)" },
  simBtnText: { fontSize: 10, color: C.blue, fontFamily: F.mono },
  simBtnTextActive: { color: C.blue },
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
  badge: { backgroundColor: "rgba(232,160,18,0.1)", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3, borderWidth: 1, borderColor: "rgba(232,160,18,0.15)" },
  badgeText: { fontSize: 9, fontWeight: "600", color: C.gold, fontFamily: F.mono, textTransform: "uppercase" },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.gold },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  bankCard: { width: "48%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12 },
  bankName: { fontSize: 12, fontWeight: "600", color: "rgba(245,240,232,0.5)", fontFamily: F.dm },
  amountBox: { backgroundColor: "rgba(232,160,18,0.04)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(232,160,18,0.15)", padding: 16, alignItems: "center", marginBottom: 18 },
  amountBoxLabel: { fontSize: 10, fontWeight: "600", color: "rgba(245,240,232,0.3)", fontFamily: F.mono, letterSpacing: 1.5, marginBottom: 4 },
  amountBoxValue: { fontSize: 26, fontWeight: "700", color: C.gold, fontFamily: F.bebas, letterSpacing: 1 },
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
  btnGoldGreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.greenLight, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12 },
  btnGoldText: { fontSize: 13, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" },
  btnGoldTextWhite: { fontSize: 13, fontWeight: "700", color: C.white, fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" },
});