// TENANT PROFILE COMPLETION SCREEN 
import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Platform,
  ActivityIndicator, Alert, KeyboardAvoidingView, SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

const API_URL = api.getBaseUrl();

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const NATIONALITIES = ["South African", "Zimbabwean", "Mozambican", "Botswanan", "Namibian", "Zambian", "Malawian", "Other"];
const MARITAL_STATUS = ["Single", "Married", "Divorced", "Widowed", "Separated"];
const EMPLOYMENT_STATUSES = ["Employed", "Self-Employed", "Student", "Retired", "Unemployed", "Other"];
const ID_TYPES = [
  { value: "sa_id", label: "South African ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "asylum_seeker", label: "Asylum Seeker Permit" },
  { value: "work_permit", label: "Work Permit" },
];

function formatDateInput(text) {
  // Auto-insert slashes: YYYY-MM-DD
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function formatPhoneInput(text) {
  const digits = text.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

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
const $chip = (active) => ({
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 3,
  backgroundColor: active ? "rgba(44,62,80,0.08)" : C.card,
  borderWidth: 1,
  borderColor: active ? C.primary : C.border,
});
const $btnPrimary = {
  backgroundColor: C.primary,
  borderRadius: 3,
  paddingVertical: 14,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: 6,
};
const $btnGhost = {
  backgroundColor: "transparent",
  borderWidth: 1,
  borderColor: C.border,
  borderRadius: 3,
  paddingVertical: 14,
  alignItems: "center",
  justifyContent: "center",
};

export default function CompleteProfile({ route, navigation, onProfileComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5; // Added review step as final
  const [form, setForm] = useState({
    date_of_birth: "", gender: "", nationality: "South African", marital_status: "",
    id_document_type: "sa_id", id_number: "", passport_number: "",
    home_address_line1: "", home_address_line2: "", home_city: "", home_postal_code: "", home_province: "",
    employment_status: "", employer_company: "", employer_contact: "", employer_official_email: "",
    job_title: "", monthly_income: "",
    emergency_name: "", emergency_relationship: "", emergency_phone: "", emergency_email: "", emergency_address: "",
    number_of_occupants: "1", has_pets: false, pet_details: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);
  const usePassport = form.nationality !== "South African";

  useEffect(() => {
    async function loadDraft() {
      try {
        const draft = await AsyncStorage.getItem("profile_draft");
        if (draft) {
          setForm(JSON.parse(draft));
          setAutoSaved(true);
        }
      } catch {}
    }
    loadDraft();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        await AsyncStorage.setItem("profile_draft", JSON.stringify(form));
        setAutoSaved(true);
      } catch {}
    }, 2000);
    return () => clearTimeout(timeout);
  }, [form]);

  function setField(key, value) { setForm(prev => ({ ...prev, [key]: value })); setErrors(prev => ({ ...prev, [key]: undefined })); }

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.date_of_birth || form.date_of_birth.length !== 10) e.date_of_birth = "Enter YYYY-MM-DD";
      if (!form.gender) e.gender = "Required";
      if (!form.nationality) e.nationality = "Required";
      if (!usePassport && !form.id_number.trim()) e.id_number = "ID number required";
      if (usePassport && !form.passport_number.trim()) e.passport_number = "Passport number required";
    } else if (s === 2) {
      if (!form.home_address_line1.trim()) e.home_address_line1 = "Required";
      if (!form.home_city.trim()) e.home_city = "Required";
    } else if (s === 3) {
      if (!form.employment_status) e.employment_status = "Required";
      if ((form.employment_status === "Employed" || form.employment_status === "Self-Employed")) {
        if (!form.employer_company.trim()) e.employer_company = "Required";
        if (!form.monthly_income.trim()) e.monthly_income = "Required";
      }
    } else if (s === 4) {
      if (!form.emergency_name.trim()) e.emergency_name = "Required";
      if (!form.emergency_phone.trim()) e.emergency_phone = "Required";
    }
    return e;
  }

  function handleNext() {
    const e = validateStep(step);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  }

  function handleBack() { if (step > 1) setStep(prev => prev - 1); }

  function handleSkip() {
    Alert.alert("Complete Later", "You can complete your profile later, but some features may be limited.", [
      { text: "Complete Now", style: "cancel" },
      { text: "Skip", onPress: () => onProfileComplete ? onProfileComplete() : navigation.replace("Main") },
    ]);
  }

  async function handleSubmit() {
    setLoading(true); setApiError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/tenants/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, monthly_income: form.monthly_income ? Number(form.monthly_income) : null, number_of_occupants: Number(form.number_of_occupants) }),
      });
      const data = await response.json();
      if (!response.ok) throw { response: { data } };
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) { const user = JSON.parse(storedUser); user.profile_complete = true; await AsyncStorage.setItem("user", JSON.stringify(user)); }
      await AsyncStorage.removeItem("profile_draft");
      Alert.alert("Profile Complete!", "You now have full access to all features.", [
        { text: "Continue", onPress: () => onProfileComplete ? onProfileComplete() : navigation.replace("Main") },
      ]);
    } catch (err) {
      setApiError(err.response?.data?.error || "Failed to update profile.");
    } finally { setLoading(false); }
  }

  const inputStyle = (key) => [$input, errors[key] && { borderColor: C.red }];
  const stepsLabels = [
    { num: 1, label: "Personal" },
    { num: 2, label: "Address" },
    { num: 3, label: "Employment" },
    { num: 4, label: "Emergency" },
    { num: 5, label: "Review" },
  ];

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        
        {/* HEADER */}
        <View style={S.header}>
          <Text style={S.headerTitle}>Complete Your Profile</Text>
          <Text style={S.headerSub}>
            {step === 1 ? "Tell us about yourself" : step === 2 ? "Where do you live?" : step === 3 ? "Employment information" : step === 4 ? "Emergency contact details" : "Review your details"}
          </Text>
          {autoSaved && <Text style={S.autoSavedText}>✓ Draft saved</Text>}
          <View style={S.progressRow}>
            {stepsLabels.map((s, idx) => (
              <View key={s.num} style={S.progressStep}>
                <View style={[S.progressDot, step >= s.num && { borderColor: C.primary }, step > s.num && { backgroundColor: C.primary, borderColor: C.primary }]}>
                  {step > s.num ? <Ionicons name="checkmark" size={11} color="#ffffff" /> : (
                    <Text style={[S.progressDotText, step >= s.num && { color: C.primary }]}>{s.num}</Text>
                  )}
                </View>
                <Text style={[S.progressLabel, step >= s.num && { color: C.primary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          
          {apiError !== "" && (
            <View style={S.errorBanner}>
              <MaterialIcons name="error" size={15} color={C.red} />
              <Text style={S.errorText}>{apiError}</Text>
            </View>
          )}

          {/* STEP 1: PERSONAL */}
          {step === 1 && (
            <>
              <Text style={S.sectionTitle}>PERSONAL INFORMATION</Text>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Date of Birth *</Text>
                <TextInput style={inputStyle("date_of_birth")} value={form.date_of_birth}
                  onChangeText={v => setField("date_of_birth", formatDateInput(v))}
                  placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} maxLength={10} keyboardType="numeric" />
                {errors.date_of_birth && <Text style={S.fieldError}>{errors.date_of_birth}</Text>}
              </View>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Gender *</Text>
                <View style={S.chipRow}>{GENDERS.map(g => <TouchableOpacity key={g} style={$chip(form.gender === g)} onPress={() => setField("gender", g)}><Text style={[S.chipText, form.gender === g && S.chipTextActive]}>{g}</Text></TouchableOpacity>)}</View>
                {errors.gender && <Text style={S.fieldError}>{errors.gender}</Text>}
              </View>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Nationality *</Text>
                <View style={S.pickerWrap}>{NATIONALITIES.map(n => <TouchableOpacity key={n} style={[S.pickerOption, form.nationality === n && S.pickerOptionActive]} onPress={() => setField("nationality", n)}><Text style={[S.pickerText, form.nationality === n && S.pickerTextActive]}>{n}</Text></TouchableOpacity>)}</View>
              </View>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Marital Status</Text>
                <View style={S.chipRow}>{MARITAL_STATUS.map(m => <TouchableOpacity key={m} style={$chip(form.marital_status === m)} onPress={() => setField("marital_status", m)}><Text style={[S.chipText, form.marital_status === m && S.chipTextActive]}>{m}</Text></TouchableOpacity>)}</View>
              </View>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>ID Document Type *</Text>
                <View style={S.chipRow}>{ID_TYPES.map(t => <TouchableOpacity key={t.value} style={$chip(form.id_document_type === t.value)} onPress={() => setField("id_document_type", t.value)}><Text style={[S.chipText, form.id_document_type === t.value && S.chipTextActive]}>{t.label}</Text></TouchableOpacity>)}</View>
              </View>
              {!usePassport ? (
                <View style={S.fieldGroup}>
                  <Text style={S.fieldLabel}>SA ID Number *</Text>
                  <TextInput style={inputStyle("id_number")} value={form.id_number}
                    onChangeText={v => setField("id_number", v.replace(/\D/g, "").slice(0, 13))}
                    placeholder="e.g. 9506155009085" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={13} />
                  {errors.id_number && <Text style={S.fieldError}>{errors.id_number}</Text>}
                </View>
              ) : (
                <View style={S.fieldGroup}>
                  <Text style={S.fieldLabel}>Passport Number *</Text>
                  <TextInput style={inputStyle("passport_number")} value={form.passport_number}
                    onChangeText={v => setField("passport_number", v)}
                    placeholder="e.g. A12345678" placeholderTextColor={C.textMuted} />
                  {errors.passport_number && <Text style={S.fieldError}>{errors.passport_number}</Text>}
                </View>
              )}
            </>
          )}

          {/* STEP 2: ADDRESS */}
          {step === 2 && (
            <>
              <Text style={S.sectionTitle}>RESIDENTIAL ADDRESS</Text>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Street Address *</Text>
                <TextInput style={inputStyle("home_address_line1")} value={form.home_address_line1}
                  onChangeText={v => setField("home_address_line1", v)}
                  placeholder="123 Main Street" placeholderTextColor={C.textMuted} />
                {errors.home_address_line1 && <Text style={S.fieldError}>{errors.home_address_line1}</Text>}
              </View>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Address Line 2 (Optional)</Text>
                <TextInput style={$input} value={form.home_address_line2} onChangeText={v => setField("home_address_line2", v)} placeholder="Apartment, building, etc." placeholderTextColor={C.textMuted} />
              </View>
              <View style={S.rowFields}>
                <View style={[S.fieldGroup, { flex: 1 }]}>
                  <Text style={S.fieldLabel}>City *</Text>
                  <TextInput style={inputStyle("home_city")} value={form.home_city} onChangeText={v => setField("home_city", v)} placeholder="Johannesburg" placeholderTextColor={C.textMuted} />
                  {errors.home_city && <Text style={S.fieldError}>{errors.home_city}</Text>}
                </View>
                <View style={[S.fieldGroup, { flex: 1 }]}>
                  <Text style={S.fieldLabel}>Postal Code</Text>
                  <TextInput style={$input} value={form.home_postal_code} onChangeText={v => setField("home_postal_code", v)} placeholder="2001" placeholderTextColor={C.textMuted} keyboardType="numeric" maxLength={4} />
                </View>
              </View>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Province</Text>
                <TextInput style={$input} value={form.home_province} onChangeText={v => setField("home_province", v)} placeholder="Gauteng" placeholderTextColor={C.textMuted} />
              </View>
            </>
          )}

          {/* STEP 3: EMPLOYMENT */}
          {step === 3 && (
            <>
              <Text style={S.sectionTitle}>EMPLOYMENT INFORMATION</Text>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Employment Status *</Text>
                <View style={S.chipRow}>{EMPLOYMENT_STATUSES.map(s => <TouchableOpacity key={s} style={$chip(form.employment_status === s)} onPress={() => setField("employment_status", s)}><Text style={[S.chipText, form.employment_status === s && S.chipTextActive]}>{s}</Text></TouchableOpacity>)}</View>
                {errors.employment_status && <Text style={S.fieldError}>{errors.employment_status}</Text>}
              </View>
              {(form.employment_status === "Employed" || form.employment_status === "Self-Employed") && (
                <>
                  <View style={S.fieldGroup}>
                    <Text style={S.fieldLabel}>Employer / Business Name *</Text>
                    <TextInput style={inputStyle("employer_company")} value={form.employer_company} onChangeText={v => setField("employer_company", v)} placeholder="Company name" placeholderTextColor={C.textMuted} />
                    {errors.employer_company && <Text style={S.fieldError}>{errors.employer_company}</Text>}
                  </View>
                  <View style={S.fieldGroup}>
                    <Text style={S.fieldLabel}>Job Title</Text>
                    <TextInput style={$input} value={form.job_title} onChangeText={v => setField("job_title", v)} placeholder="e.g. Software Developer" placeholderTextColor={C.textMuted} />
                  </View>
                  <View style={S.fieldGroup}>
                    <Text style={S.fieldLabel}>Monthly Income (R) *</Text>
                    <TextInput style={inputStyle("monthly_income")} value={form.monthly_income} onChangeText={v => setField("monthly_income", v)} placeholder="e.g. 25000" placeholderTextColor={C.textMuted} keyboardType="numeric" />
                    {errors.monthly_income && <Text style={S.fieldError}>{errors.monthly_income}</Text>}
                  </View>
                  <View style={S.fieldGroup}>
                    <Text style={S.fieldLabel}>Employer Contact (Optional)</Text>
                    <TextInput style={$input} value={form.employer_contact} onChangeText={v => setField("employer_contact", formatPhoneInput(v))} placeholder="HR phone number" placeholderTextColor={C.textMuted} keyboardType="phone-pad" />
                  </View>
                </>
              )}
            </>
          )}

          {/* STEP 4: EMERGENCY */}
          {step === 4 && (
            <>
              <Text style={S.sectionTitle}>EMERGENCY CONTACT</Text>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Full Name *</Text>
                <TextInput style={inputStyle("emergency_name")} value={form.emergency_name} onChangeText={v => setField("emergency_name", v)} placeholder="Emergency contact name" placeholderTextColor={C.textMuted} />
                {errors.emergency_name && <Text style={S.fieldError}>{errors.emergency_name}</Text>}
              </View>
              <View style={S.rowFields}>
                <View style={[S.fieldGroup, { flex: 1 }]}>
                  <Text style={S.fieldLabel}>Relationship</Text>
                  <TextInput style={$input} value={form.emergency_relationship} onChangeText={v => setField("emergency_relationship", v)} placeholder="e.g. Spouse" placeholderTextColor={C.textMuted} />
                </View>
                <View style={[S.fieldGroup, { flex: 1 }]}>
                  <Text style={S.fieldLabel}>Phone *</Text>
                  <TextInput style={inputStyle("emergency_phone")} value={form.emergency_phone} onChangeText={v => setField("emergency_phone", formatPhoneInput(v))} placeholder="0821234567" placeholderTextColor={C.textMuted} keyboardType="phone-pad" />
                  {errors.emergency_phone && <Text style={S.fieldError}>{errors.emergency_phone}</Text>}
                </View>
              </View>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Email (Optional)</Text>
                <TextInput style={$input} value={form.emergency_email} onChangeText={v => setField("emergency_email", v)} placeholder="emergency@email.com" placeholderTextColor={C.textMuted} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={S.fieldGroup}>
                <Text style={S.fieldLabel}>Number of Occupants</Text>
                <View style={S.chipRow}>{[1, 2, 3, 4, 5, 6].map(n => <TouchableOpacity key={n} style={$chip(form.number_of_occupants === String(n))} onPress={() => setField("number_of_occupants", String(n))}><Text style={[S.chipText, form.number_of_occupants === String(n) && S.chipTextActive]}>{n} {n === 1 ? "person" : "people"}</Text></TouchableOpacity>)}</View>
              </View>
            </>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <>
              <Text style={S.sectionTitle}>REVIEW YOUR DETAILS</Text>
              {[
                ["Date of Birth", form.date_of_birth],
                ["Gender", form.gender],
                ["Nationality", form.nationality],
                ["ID Number", usePassport ? form.passport_number : form.id_number],
                ["Address", `${form.home_address_line1}${form.home_address_line2 ? ", " + form.home_address_line2 : ""}, ${form.home_city}, ${form.home_postal_code}, ${form.home_province}`],
                ["Employment", form.employment_status],
                ["Monthly Income", form.monthly_income ? `R ${Number(form.monthly_income).toLocaleString()}` : "—"],
                ["Emergency Contact", `${form.emergency_name} (${form.emergency_relationship || "Relationship"}) ${form.emergency_phone}`],
                ["Occupants", form.number_of_occupants],
              ].map(([label, val]) => (
                <View key={label} style={S.reviewRow}>
                  <Text style={S.reviewLabel}>{label}</Text>
                  <Text style={S.reviewValue}>{val || "—"}</Text>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* FOOTER */}
        <View style={S.footer}>
          {step > 1 ? (
            <TouchableOpacity style={$btnGhost} onPress={handleBack}><Text style={S.btnGhostText}>Back</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity style={$btnGhost} onPress={handleSkip}><Text style={S.btnGhostText}>Skip for now</Text></TouchableOpacity>
          )}
          {step < totalSteps ? (
            <TouchableOpacity style={[$btnPrimary, { flex: 1 }]} onPress={handleNext}>
              <Text style={S.btnPrimaryText}>CONTINUE</Text>
              <Feather name="chevron-right" size={16} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[$btnPrimary, { flex: 1 }, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#ffffff" size="small" /> : (
                <><Text style={S.btnPrimaryText}>SUBMIT</Text><Ionicons name="checkmark" size={16} color="#ffffff" /></>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: { padding: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  headerTitle: { fontSize: 20, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 2 },
  headerSub: { fontSize: 11, color: C.textMuted, fontFamily: F.mono, marginBottom: 14 },
  autoSavedText: { fontSize: 10, color: C.green, fontFamily: F.mono, position: "absolute", right: 16, top: 16 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 },
  progressStep: { alignItems: "center" },
  progressDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.border },
  progressDotText: { fontSize: 11, fontWeight: "700", color: C.textMuted, fontFamily: F.mono },
  progressLabel: { fontSize: 9, fontWeight: "600", color: C.textMuted, fontFamily: F.mono, marginTop: 3 },

  scroll: { flex: 1 },
  scrollPad: { padding: 14 },

  sectionTitle: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 2, marginBottom: 14 },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 10, fontWeight: "600", color: C.textMuted, fontFamily: F.mono, letterSpacing: 1, marginBottom: 5, textTransform: "uppercase" },
  fieldError: { fontSize: 10, color: C.red, fontFamily: F.mono, marginTop: 3 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chipText: { fontSize: 12, fontWeight: "500", color: C.textMuted, fontFamily: F.dm },
  chipTextActive: { color: C.primary, fontWeight: "600" },

  pickerWrap: { backgroundColor: C.card, borderRadius: 3, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerOptionActive: { backgroundColor: "rgba(44,62,80,0.06)" },
  pickerText: { fontSize: 13, color: C.textMuted, fontFamily: F.dm },
  pickerTextActive: { color: C.primary, fontWeight: "600" },

  rowFields: { flexDirection: "row", gap: 10 },

  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(158,58,58,0.06)", borderRadius: 3, borderWidth: 1, borderColor: "rgba(158,58,58,0.15)", padding: 10, marginBottom: 14 },
  errorText: { flex: 1, fontSize: 12, color: C.red, fontFamily: F.dm },

  reviewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  reviewLabel: { fontSize: 12, color: C.textMuted, fontFamily: F.mono },
  reviewValue: { fontSize: 12, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, textAlign: "right", flex: 1, marginLeft: 12 },

  footer: { flexDirection: "row", gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  btnPrimaryText: { fontSize: 12, fontWeight: "700", color: "#ffffff", fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
  btnGhostText: { fontSize: 12, fontWeight: "500", color: C.textSecondary, fontFamily: F.dm, letterSpacing: 0.5 },
});