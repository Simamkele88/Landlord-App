import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar,
  ActivityIndicator, Linking, AppState,
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

function fmt(n) { return `R ${Number(n || 0).toLocaleString("en-ZA")}`; }

function formatBillingPeriod(date) {
  if (!date) return "Current";
  const d = new Date(date);
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

export default function PaymentMethod() {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice, tenant, paymentPolicy, repayment_instalment_id } = route.params || {};

  const [step, setStep] = useState("method");
  const [method, setMethod] = useState(null);
  const [generatedRcpt, setRcpt] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [loading, setLoading] = useState(false);

  const invoiceType = invoice?.invoice_type || "rent";
  const typeCfg = invoiceTypeConfig(invoiceType);

  const remaining = Number(invoice?.remaining_balance || invoice?.amount_due || 0);
  const canPartial = paymentPolicy?.canPartial ?? false;
  const minPartial = Math.round(remaining * 0.5 * 100) / 100;

  const [amountInput, setAmountInput] = useState(String(remaining));
  const numericAmount = Number(amountInput);
  const amountValid = !isNaN(numericAmount) && numericAmount > 0 && numericAmount <= remaining;
  const meetsMinimum = canPartial ? numericAmount >= minPartial : true;
  const payAmount = !canPartial ? remaining : (amountValid ? numericAmount : 0);

  function goBack() { navigation.goBack(); }

  useEffect(() => {
    if (step !== "processing") return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 4000);

    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPaymentStatus();
      }
    });

    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      if (url?.includes("payment-cancel")) {
        setPaymentError("Payment was cancelled.");
        setStep("failure");
      } else if (url?.includes("payment-return")) {
        checkPaymentStatus();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
      linkingSubscription.remove();
    };
  }, [step]);

  async function checkPaymentStatus() {
    try {
      const result = repayment_instalment_id
        ? await api.get(`/repayment-plans/me/instalments/${repayment_instalment_id}`)
        : await api.getInvoice(invoice.id);
      const updated = repayment_instalment_id
        ? result?.instalment
        : (result?.invoice || result);
      const status = updated?.status;

      if (status === "paid" || status === "late" || status === "partial") {
        setRcpt({
          amount: payAmount,
          receiptNo: updated?.last_payment_reference || `${invoice.id}-${Date.now()}`,
          tenant: [tenant?.first_name, tenant?.last_name].filter(Boolean).join(" ") || tenant?.name,
          unit: tenant?.unit,
          property: tenant?.property,
          period: invoice?.billing_period_start,
          method: method?.id,
        });
        setStep("success");
      } else if (status === "failed" || status === "cancelled") {
        setPaymentError("Payment was not completed.");
        setStep("failure");
      }
    } catch (err) {
      setPaymentError(err?.data?.error || "Could not confirm payment status.");
      setStep("failure");
    }
  }

  async function startPayFastPayment() {
    try {
      const payload = {
        amount: payAmount,
        item_name: repayment_instalment_id
          ? `Repayment instalment ${invoice.invoice_number}`
          : `Invoice ${invoice.invoice_number || invoice.id}`,
        ...(repayment_instalment_id
          ? { repayment_instalment_id }
          : { invoice_id: invoice.id }),
      };

      const response = await api.post("/payments/payfast/initiate", payload);

      const { url, data } = response;
      const params = Object.keys(data)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join("&");

      await Linking.openURL(`${url}?${params}`);
      setStep("processing");
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Failed to start payment";
      setPaymentError(msg);
      setStep("failure");
    }
  }

  async function handleCardPayment() {
    setLoading(true);
    setPaymentError(null);
    await startPayFastPayment();
    setLoading(false);
  }

  async function handleEftPayment() {
    setLoading(true);
    setPaymentError(null);
    await startPayFastPayment();
    setLoading(false);
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
          <Text style={S.title}>Pay {fmt(payAmount)}</Text>
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
              <Text style={S.partialBannerText}>Partial payment. Remaining: {fmt(payAmount)}</Text>
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
              <Text style={S.bTotalValue}>{fmt(remaining)}</Text>
            </View>
            {invoice?.status === 'partial' && (
              <View style={[S.bRow, { borderTopWidth: 0, paddingTop: 0 }]}>
                <Text style={[S.bLabel, { color: C.blue }]}>Status</Text>
                <Text style={[S.bValue, { color: C.blue }]}>Partially Paid</Text>
              </View>
            )}
          </View>

          {canPartial ? (
            <View style={S.fieldGroup}>
              <Text style={S.fieldLabel}>AMOUNT TO PAY</Text>
              <TextInput
                style={[
                  $input,
                  (!amountValid && amountInput !== "") && { borderColor: C.red },
                  (!meetsMinimum && amountValid) && { borderColor: C.gold },
                ]}
                value={amountInput}
                onChangeText={(v) => {
                  setAmountInput(v.replace(/[^0-9.]/g, ""));
                }}
                placeholder={`Minimum ${fmt(minPartial)}`}
                placeholderTextColor={C.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={[S.fieldHint, { color: amountValid ? C.textMuted : C.red }]}>
                You may pay any amount between {fmt(minPartial)} and {fmt(remaining)}.
              </Text>
              {numericAmount > remaining && (
                <Text style={S.fieldError}>Amount cannot exceed {fmt(remaining)}</Text>
              )}
              {numericAmount <= 0 && amountInput !== "" && (
                <Text style={S.fieldError}>Enter an amount greater than 0</Text>
              )}
              {numericAmount > 0 && numericAmount < minPartial && (
                <Text style={S.fieldError}>Minimum partial payment is {fmt(minPartial)}</Text>
              )}
            </View>
          ) : (
            <View style={S.lockBanner}>
              <MaterialIcons name="lock" size={16} color={C.red} />
              <Text style={S.lockText}>
                Your account requires full payment of {fmt(remaining)}.
              </Text>
            </View>
          )}

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
          <TouchableOpacity
            style={
              !method ||
              (canPartial && (!amountValid || !meetsMinimum)) ||
              loading
                ? S.btnPrimaryDisabled
                : S.btnPrimary
            }
            onPress={() => {
              if (!method) return;
              if (method.id === "card") handleCardPayment();
              else handleEftPayment();
            }}
            disabled={
              !method ||
              (canPartial && (!amountValid || !meetsMinimum)) ||
              loading
            }
          >
            <Text style={S.btnPrimaryText}>
              {loading ? "Opening PayFast..." : "Pay Now"}
            </Text>
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
  invoiceTypeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', fontFamily: F.mono, letterSpacing: 1 },

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
  fieldHint: { fontSize: 11, fontFamily: F.mono, marginTop: 4 },

  optionRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8 },
  optionIcon: { width: 40, height: 40, borderRadius: 4, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", marginRight: 10 },
  optionLabel: { fontSize: 13, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm },
  optionSub: { fontSize: 10, color: C.textMuted, fontFamily: F.mono, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.primary },

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

  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  btnGhost: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "transparent", borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12 },
  btnGhostText: { fontSize: 13, fontWeight: "600", color: C.textSecondary, fontFamily: F.dm, textAlign: "center" },
  btnPrimary: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.primary, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12 },
  btnPrimaryDisabled: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.primary, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 12, opacity: 0.4 },
  btnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#ffffff", fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center" },
});