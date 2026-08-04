// REQUEST REPAYMENT PLAN SCREEN
import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import api from "../../utils/api";

const C = {
  black:      "#0a0a0a",
  muted:      "#141414",
  muted2:     "#1a1a1a",
  border:     "#2a2a2a",
  gold:       "#E8A012",
  white:      "#F5F0E8",
  blue:       "#3A8FD4",
  greenLight: "#1A7A4A",
  redLight:   "#E05A4A",
};
const F = { bebas: "bebas-neue", dm: "dm-sans", mono: "space-mono" };

function fmt(n) { return `R ${Number(n || 0).toLocaleString("en-ZA")}`; }

function InstalmentChip({ value, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[S.chip, selected && { backgroundColor: "rgba(232,160,18,0.1)", borderColor: C.gold }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[S.chipText, selected && { color: C.gold }]}>{value}</Text>
      <Text style={[S.chipSub, selected && { color: C.gold + "99" }]}>
        {value === 1 ? "month" : "months"}
      </Text>
    </TouchableOpacity>
  );
}

function PreviewRow({ label, value, accent }) {
  return (
    <View style={S.previewRow}>
      <Text style={S.previewLabel}>{label}</Text>
      <Text style={[S.previewVal, accent && { color: C.gold }]}>{value}</Text>
    </View>
  );
}

function MonthPicker({ value, onChange }) {
  const date = value ? new Date(value) : new Date();
  const label = date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

  function prev() {
    const d = new Date(date);
    d.setMonth(d.getMonth() - 1);
    if (d < new Date()) return; 
    onChange(d.toISOString().slice(0, 10));
  }
  function next() {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    onChange(d.toISOString().slice(0, 10));
  }

  return (
    <View style={S.monthPicker}>
      <TouchableOpacity onPress={prev} style={S.monthBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Feather name="chevron-left" size={18} color="rgba(245,240,232,0.5)" />
      </TouchableOpacity>
      <Text style={S.monthLabel}>{label}</Text>
      <TouchableOpacity onPress={next} style={S.monthBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Feather name="chevron-right" size={18} color="rgba(245,240,232,0.5)" />
      </TouchableOpacity>
    </View>
  );
}

export default function RequestRepaymentPlan() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { balance: suggestedBalance, collection } = route.params || {};

  const [instalments, setInstalments] = useState(3);
  const [startDate, setStartDate]     = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [note, setNote]               = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState({});

  const INSTALMENT_OPTIONS = [1, 2, 3, 4, 6, 9, 12];
  const outstanding = suggestedBalance || collection?.outstanding_balance || 0;

  const amountPerPeriod = instalments > 0 && outstanding > 0
    ? Math.ceil(outstanding / instalments)
    : 0;
  const lastInstalment = outstanding > 0 && instalments > 0
    ? outstanding - amountPerPeriod * (instalments - 1)
    : 0;

  function validate() {
    const e = {};
    if (!outstanding || outstanding <= 0) e.balance = "No outstanding balance found.";
    if (!startDate) e.startDate = "Please select a start month.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/repayment-plans/request", {
        total_amount: outstanding,
        instalments,
        frequency:    "monthly",
        start_date:   startDate,
        note:         note.trim() || undefined,
      });
      Alert.alert(
        "Plan Requested",
        "Your repayment plan proposal has been sent to your landlord. You'll receive a notification once it's reviewed.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Something went wrong.";
      Alert.alert("Could Not Submit", msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={20} color={C.white} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Request Repayment Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.pad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* BALANCE DISPLAY */}
        <View style={S.balanceBox}>
          <Text style={S.balanceLabel}>OUTSTANDING BALANCE</Text>
          <Text style={S.balanceAmount}>{fmt(outstanding)}</Text>
          <Text style={S.balanceSub}>This is the total amount your repayment plan will cover.</Text>
        </View>

        {/* HOW IT WORKS */}
        <View style={S.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={C.blue} />
          <Text style={S.infoText}>
            Your proposal will be sent to your landlord for review. Once approved, you'll pay each instalment on the 1st of each month. You'll be notified of their decision.
          </Text>
        </View>

        {/* STEP 1 - INSTALMENTS */}
        <View style={S.section}>
          <Text style={S.stepTitle}>
            <Text style={S.stepNum}>01 </Text>How many months?
          </Text>
          <Text style={S.stepHint}>Choose how many monthly payments you'd like to split the balance into.</Text>
          <View style={S.chipRow}>
            {INSTALMENT_OPTIONS.map(n => (
              <InstalmentChip key={n} value={n} selected={instalments === n} onPress={() => setInstalments(n)} />
            ))}
          </View>
        </View>

        {/* STEP 2 — START DATE */}
        <View style={S.section}>
          <Text style={S.stepTitle}>
            <Text style={S.stepNum}>02 </Text>When should payments start?
          </Text>
          <Text style={S.stepHint}>Select the month you'd like your first instalment to be due.</Text>
          {errors.startDate && <Text style={S.errText}>{errors.startDate}</Text>}
          <MonthPicker value={startDate} onChange={setStartDate} />
        </View>

        {/* STEP 3 — NOTE */}
        <View style={S.section}>
          <Text style={S.stepTitle}>
            <Text style={S.stepNum}>03 </Text>Add a note <Text style={{ color: "rgba(245,240,232,0.25)", fontSize: 11 }}>(optional)</Text>
          </Text>
          <Text style={S.stepHint}>Explain your circumstances to help your landlord understand your situation.</Text>
          <TextInput
            style={S.textarea}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. I lost my job last month and am looking for work. I can afford R2,000/month..."
            placeholderTextColor="rgba(245,240,232,0.18)"
            multiline
            maxLength={400}
            color={C.white}
            textAlignVertical="top"
            keyboardAppearance="dark"
          />
          <Text style={S.charCount}>{note.length}/400</Text>
        </View>

        {/* PREVIEW */}
        <View style={S.section}>
          <Text style={S.stepTitle}>
            <Text style={S.stepNum}>04 </Text>Your proposal summary
          </Text>
          <View style={S.previewCard}>
            <PreviewRow label="Total to repay"    value={fmt(outstanding)} />
            <PreviewRow label="No. of instalments" value={`${instalments} month${instalments !== 1 ? "s" : ""}`} />
            <PreviewRow label="Amount per month"  value={fmt(amountPerPeriod)} accent />
            {lastInstalment !== amountPerPeriod && (
              <PreviewRow label="Final instalment" value={fmt(lastInstalment)} />
            )}
            <PreviewRow label="First payment due"
              value={startDate
                ? new Date(startDate).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })
                : "—"}
            />
          </View>
          <Text style={S.disclaimer}>
            Your landlord must approve this proposal before it takes effect. Instalments are not binding until approval is received.
          </Text>
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[S.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={C.black} size="small" />
            : <>
                <Ionicons name="paper-plane-outline" size={16} color={C.black} />
                <Text style={S.submitText}>Submit Proposal</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity style={S.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={S.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.black },
  scroll: { flex: 1 },
  pad:    { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },

  balanceBox: { backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: "rgba(224,90,74,0.25)", padding: 20, alignItems: "center", marginBottom: 14, gap: 4 },
  balanceLabel: { fontSize: 9, fontFamily: F.mono, color: "rgba(245,240,232,0.3)", letterSpacing: 2, textTransform: "uppercase" },
  balanceAmount: { fontSize: 36, fontFamily: F.bebas, color: C.redLight, letterSpacing: 1 },
  balanceSub: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, textAlign: "center" },

  infoBox: { flexDirection: "row", gap: 10, backgroundColor: "rgba(58,143,212,0.06)", borderRadius: 4, borderWidth: 1, borderColor: "rgba(58,143,212,0.15)", padding: 12, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 12, color: "rgba(245,240,232,0.5)", fontFamily: F.dm, lineHeight: 18 },

  section: { marginBottom: 24 },
  stepNum: { color: C.gold, fontFamily: F.bebas, fontSize: 15, letterSpacing: 1 },
  stepTitle: { fontSize: 14, fontWeight: "600", color: C.white, fontFamily: F.dm, marginBottom: 4 },
  stepHint: { fontSize: 11, color: "rgba(245,240,232,0.35)", fontFamily: F.mono, lineHeight: 17, marginBottom: 12 },
  errText: { fontSize: 11, color: C.redLight, fontFamily: F.mono, marginBottom: 6 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 4, borderWidth: 1, borderColor: C.border, backgroundColor: C.muted2, alignItems: "center", minWidth: 52 },
  chipText: { fontSize: 15, fontFamily: F.bebas, color: "rgba(245,240,232,0.5)", letterSpacing: 0.5, lineHeight: 18 },
  chipSub: { fontSize: 8, fontFamily: F.mono, color: "rgba(245,240,232,0.25)", letterSpacing: 0.5, textTransform: "uppercase" },

  monthPicker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14 },
  monthBtn: { padding: 4 },
  monthLabel: { fontSize: 14, fontWeight: "600", color: C.white, fontFamily: F.dm },

  textarea: { backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, padding: 12, minHeight: 90, fontSize: 13, fontFamily: F.dm, lineHeight: 20 },
  charCount: { fontSize: 9, color: "rgba(245,240,232,0.2)", fontFamily: F.mono, textAlign: "right", marginTop: 4 },

  previewCard: { backgroundColor: C.muted2, borderRadius: 4, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 10 },
  previewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  previewLabel: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono },
  previewVal: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  disclaimer: { fontSize: 10, color: "rgba(245,240,232,0.2)", fontFamily: F.mono, lineHeight: 16, textAlign: "center" },

  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.gold, borderRadius: 4, paddingVertical: 14, marginBottom: 10 },
  submitText: { fontSize: 13, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 0.5, textTransform: "uppercase" },
  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelText: { fontSize: 12, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },
});
