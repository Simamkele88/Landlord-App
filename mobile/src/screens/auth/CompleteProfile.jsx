// TENANT PROFILE COMPLETION SCREEN
// THIS SCREEN APPEARS AFTER FIRST LOGIN IF profile_complete IS FALSE

import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, Platform,
  ActivityIndicator, Alert, KeyboardAvoidingView, SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import api from "../../utils/api";

const API_URL = api.getBaseUrl(); 

// THEME COLORS
const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6", primaryDark: "#2563EB",
  success: "#22C55E", successBg: "#052E16",
  warning: "#F59E0B", warningBg: "#451A03",
  danger: "#EF4444", dangerBg: "#450A0A",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

// FORM CONFIGURATION
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

export default function CompleteProfile({ route, navigation, onProfileComplete }) {
  // CURRENT STEP
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // FORM STATE
  const [form, setForm] = useState({
    // STEP 1: PERSONAL INFO
    date_of_birth: "",
    gender: "",
    nationality: "South African",
    marital_status: "",
    id_document_type: "sa_id",
    id_number: "",
    passport_number: "",
    
    // STEP 2: ADDRESS
    home_address_line1: "",
    home_address_line2: "",
    home_city: "",
    home_postal_code: "",
    home_province: "",
    
    // STEP 3: EMPLOYMENT
    employment_status: "",
    employer_company: "",
    employer_contact: "",
    employer_official_email: "",
    job_title: "",
    monthly_income: "",
    
    // STEP 4: EMERGENCY CONTACT & ADDITIONAL
    emergency_name: "",
    emergency_relationship: "",
    emergency_phone: "",
    emergency_email: "",
    emergency_address: "",
    number_of_occupants: "1",
    has_pets: false,
    pet_details: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const usePassport = form.nationality !== "South African";

  // UPDATE FORM FIELD
  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  // VALIDATE CURRENT STEP
  function validateStep(stepNum) {
    const e = {};
    
    if (stepNum === 1) {
      if (!form.date_of_birth) e.date_of_birth = "Required";
      if (!form.gender) e.gender = "Required";
      if (!form.nationality) e.nationality = "Required";
      if (!form.id_document_type) e.id_document_type = "Required";
      if (!usePassport && !form.id_number.trim()) e.id_number = "ID number required";
      if (usePassport && !form.passport_number.trim()) e.passport_number = "Passport number required";
    }
    
    if (stepNum === 2) {
      if (!form.home_address_line1.trim()) e.home_address_line1 = "Required";
      if (!form.home_city.trim()) e.home_city = "Required";
    }
    
    if (stepNum === 3) {
      if (!form.employment_status) e.employment_status = "Required";
      if ((form.employment_status === "Employed" || form.employment_status === "Self-Employed")) {
        if (!form.employer_company.trim()) e.employer_company = "Required";
        if (!form.monthly_income.trim()) e.monthly_income = "Required";
      }
    }
    
    if (stepNum === 4) {
      if (!form.emergency_name.trim()) e.emergency_name = "Required";
      if (!form.emergency_phone.trim()) e.emergency_phone = "Required";
    }
    
    return e;
  }

  // NEXT STEP
  function handleNext() {
    const e = validateStep(step);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  }

  // PREVIOUS STEP
  function handleBack() {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  }

  // SUBMIT PROFILE
  async function handleSubmit() {
    const e = validateStep(step);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const token = await AsyncStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/tenants/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
          number_of_occupants: Number(form.number_of_occupants),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw { response: { data } };
      }

      // UPDATE LOCAL USER DATA
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.profile_complete = true;
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }

      Alert.alert(
        "Profile Complete!",
        "Your profile has been successfully updated. You now have full access to all features.",
        [
          {
            text: "Continue",
            onPress: () => {
              if (onProfileComplete) {
                onProfileComplete();
              } else {
                navigation.replace("Main");
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error("Profile update error:", err);
      setApiError(err.response?.data?.error || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // SKIP FOR NOW 
  function handleSkip() {
    Alert.alert(
      "Complete Later",
      "You can complete your profile later, but some features may be limited.",
      [
        { text: "Complete Now", style: "cancel" },
        {
          text: "Skip",
          onPress: () => {
            if (onProfileComplete) {
              onProfileComplete();
            } else {
              navigation.replace("Main");
            }
          },
        },
      ]
    );
  }

  // INPUT STYLE HELPER
  const inputStyle = (key) => [
    styles.input,
    errors[key] && styles.inputError,
  ];

  // STEPS CONFIG
  const steps = [
    { num: 1, label: "Personal" },
    { num: 2, label: "Address" },
    { num: 3, label: "Employment" },
    { num: 4, label: "Emergency" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
          <Text style={styles.headerSub}>
            {step === 1 ? "Tell us about yourself" :
             step === 2 ? "Where do you live?" :
             step === 3 ? "Employment information" :
             "Emergency contact details"}
          </Text>
          
          {/* PROGRESS STEPS */}
          <View style={styles.progressContainer}>
            {steps.map((s, idx) => (
              <View key={s.num} style={styles.progressStep}>
                <View style={[
                  styles.progressDot,
                  step >= s.num && styles.progressDotActive,
                  step > s.num && styles.progressDotCompleted,
                ]}>
                  {step > s.num ? (
                    <Ionicons name="checkmark" size={12} color={C.white} />
                  ) : (
                    <Text style={[
                      styles.progressDotText,
                      step >= s.num && styles.progressDotTextActive,
                    ]}>{s.num}</Text>
                  )}
                </View>
                <Text style={[
                  styles.progressLabel,
                  step >= s.num && styles.progressLabelActive,
                ]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          
          {/* API ERROR */}
          {apiError !== "" && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error" size={16} color={C.danger} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          {/* STEP 1: PERSONAL INFO */}
          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Date of Birth *</Text>
                <TextInput
                  style={inputStyle("date_of_birth")}
                  value={form.date_of_birth}
                  onChangeText={v => setField("date_of_birth", v)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.textMuted}
                />
                {errors.date_of_birth && <Text style={styles.fieldError}>{errors.date_of_birth}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Gender *</Text>
                <View style={styles.chipRow}>
                  {GENDERS.map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, form.gender === g && styles.chipActive]}
                      onPress={() => setField("gender", g)}
                    >
                      <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.gender && <Text style={styles.fieldError}>{errors.gender}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nationality *</Text>
                <View style={styles.pickerContainer}>
                  {NATIONALITIES.map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.selectOption, form.nationality === n && styles.selectOptionActive]}
                      onPress={() => setField("nationality", n)}
                    >
                      <Text style={[styles.selectOptionText, form.nationality === n && styles.selectOptionTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Marital Status</Text>
                <View style={styles.chipRow}>
                  {MARITAL_STATUS.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, form.marital_status === m && styles.chipActive]}
                      onPress={() => setField("marital_status", m)}
                    >
                      <Text style={[styles.chipText, form.marital_status === m && styles.chipTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ID Document Type *</Text>
                <View style={styles.chipRow}>
                  {ID_TYPES.map(t => (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.chip, form.id_document_type === t.value && styles.chipActive]}
                      onPress={() => setField("id_document_type", t.value)}
                    >
                      <Text style={[styles.chipText, form.id_document_type === t.value && styles.chipTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {!usePassport ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>SA ID Number *</Text>
                  <TextInput
                    style={inputStyle("id_number")}
                    value={form.id_number}
                    onChangeText={v => setField("id_number", v)}
                    placeholder="e.g. 9506155009085"
                    placeholderTextColor={C.textMuted}
                    keyboardType="numeric"
                    maxLength={13}
                  />
                  {errors.id_number && <Text style={styles.fieldError}>{errors.id_number}</Text>}
                </View>
              ) : (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Passport Number *</Text>
                  <TextInput
                    style={inputStyle("passport_number")}
                    value={form.passport_number}
                    onChangeText={v => setField("passport_number", v)}
                    placeholder="e.g. A12345678"
                    placeholderTextColor={C.textMuted}
                  />
                  {errors.passport_number && <Text style={styles.fieldError}>{errors.passport_number}</Text>}
                </View>
              )}
            </>
          )}

          {/* STEP 2: ADDRESS */}
          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Residential Address</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Street Address *</Text>
                <TextInput
                  style={inputStyle("home_address_line1")}
                  value={form.home_address_line1}
                  onChangeText={v => setField("home_address_line1", v)}
                  placeholder="123 Main Street"
                  placeholderTextColor={C.textMuted}
                />
                {errors.home_address_line1 && <Text style={styles.fieldError}>{errors.home_address_line1}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Address Line 2 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.home_address_line2}
                  onChangeText={v => setField("home_address_line2", v)}
                  placeholder="Apartment, building, etc."
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>City *</Text>
                  <TextInput
                    style={inputStyle("home_city")}
                    value={form.home_city}
                    onChangeText={v => setField("home_city", v)}
                    placeholder="Johannesburg"
                    placeholderTextColor={C.textMuted}
                  />
                  {errors.home_city && <Text style={styles.fieldError}>{errors.home_city}</Text>}
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Postal Code</Text>
                  <TextInput
                    style={styles.input}
                    value={form.home_postal_code}
                    onChangeText={v => setField("home_postal_code", v)}
                    placeholder="2001"
                    placeholderTextColor={C.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Province</Text>
                <TextInput
                  style={styles.input}
                  value={form.home_province}
                  onChangeText={v => setField("home_province", v)}
                  placeholder="Gauteng"
                  placeholderTextColor={C.textMuted}
                />
              </View>
            </>
          )}

          {/* STEP 3: EMPLOYMENT */}
          {step === 3 && (
            <>
              <Text style={styles.sectionTitle}>Employment Information</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Employment Status *</Text>
                <View style={styles.chipRow}>
                  {EMPLOYMENT_STATUSES.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, form.employment_status === s && styles.chipActive]}
                      onPress={() => setField("employment_status", s)}
                    >
                      <Text style={[styles.chipText, form.employment_status === s && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.employment_status && <Text style={styles.fieldError}>{errors.employment_status}</Text>}
              </View>

              {(form.employment_status === "Employed" || form.employment_status === "Self-Employed") && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Employer / Business Name *</Text>
                    <TextInput
                      style={inputStyle("employer_company")}
                      value={form.employer_company}
                      onChangeText={v => setField("employer_company", v)}
                      placeholder="Company name"
                      placeholderTextColor={C.textMuted}
                    />
                    {errors.employer_company && <Text style={styles.fieldError}>{errors.employer_company}</Text>}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Job Title</Text>
                    <TextInput
                      style={styles.input}
                      value={form.job_title}
                      onChangeText={v => setField("job_title", v)}
                      placeholder="e.g. Software Developer"
                      placeholderTextColor={C.textMuted}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Monthly Income (R) *</Text>
                    <TextInput
                      style={inputStyle("monthly_income")}
                      value={form.monthly_income}
                      onChangeText={v => setField("monthly_income", v)}
                      placeholder="e.g. 25000"
                      placeholderTextColor={C.textMuted}
                      keyboardType="numeric"
                    />
                    {errors.monthly_income && <Text style={styles.fieldError}>{errors.monthly_income}</Text>}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Employer Contact (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={form.employer_contact}
                      onChangeText={v => setField("employer_contact", v)}
                      placeholder="HR phone number"
                      placeholderTextColor={C.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}
            </>
          )}

          {/* STEP 4: EMERGENCY CONTACT */}
          {step === 4 && (
            <>
              <Text style={styles.sectionTitle}>Emergency Contact</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  style={inputStyle("emergency_name")}
                  value={form.emergency_name}
                  onChangeText={v => setField("emergency_name", v)}
                  placeholder="Emergency contact name"
                  placeholderTextColor={C.textMuted}
                />
                {errors.emergency_name && <Text style={styles.fieldError}>{errors.emergency_name}</Text>}
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Relationship</Text>
                  <TextInput
                    style={styles.input}
                    value={form.emergency_relationship}
                    onChangeText={v => setField("emergency_relationship", v)}
                    placeholder="e.g. Spouse"
                    placeholderTextColor={C.textMuted}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Phone *</Text>
                  <TextInput
                    style={inputStyle("emergency_phone")}
                    value={form.emergency_phone}
                    onChangeText={v => setField("emergency_phone", v)}
                    placeholder="0821234567"
                    placeholderTextColor={C.textMuted}
                    keyboardType="phone-pad"
                  />
                  {errors.emergency_phone && <Text style={styles.fieldError}>{errors.emergency_phone}</Text>}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={form.emergency_email}
                  onChangeText={v => setField("emergency_email", v)}
                  placeholder="emergency@email.com"
                  placeholderTextColor={C.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Number of Occupants</Text>
                <View style={styles.chipRow}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.chip, form.number_of_occupants === String(n) && styles.chipActive]}
                      onPress={() => setField("number_of_occupants", String(n))}
                    >
                      <Text style={[styles.chipText, form.number_of_occupants === String(n) && styles.chipTextActive]}>
                        {n} {n === 1 ? "person" : "people"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* EXTRA SPACE */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* FOOTER BUTTONS */}
        <View style={styles.footer}>
          {step > 1 ? (
            <TouchableOpacity style={styles.btnSecondary} onPress={handleBack}>
              <Text style={styles.btnSecondaryText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnSecondary} onPress={handleSkip}>
              <Text style={styles.btnSecondaryText}>Skip for now</Text>
            </TouchableOpacity>
          )}

          {step < totalSteps ? (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
              <Text style={styles.btnPrimaryText}>Continue</Text>
              <Feather name="chevron-right" size={18} color={C.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.btnPrimary, loading && { opacity: 0.6 }]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Complete Profile</Text>
                  <Ionicons name="checkmark" size={18} color={C.white} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.textPrimary,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  progressStep: {
    alignItems: "center",
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.border,
  },
  progressDotActive: {
    borderColor: C.primary,
    backgroundColor: C.surfaceAlt,
  },
  progressDotCompleted: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
  },
  progressDotTextActive: {
    color: C.primary,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.textMuted,
    marginTop: 4,
  },
  progressLabelActive: {
    color: C.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldError: {
    fontSize: 11,
    color: C.danger,
    marginTop: 4,
  },
  input: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textPrimary,
  },
  inputError: {
    borderColor: C.danger,
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.primary + "20",
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSecondary,
  },
  chipTextActive: {
    color: C.primary,
    fontWeight: "600",
  },
  pickerContainer: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  selectOptionActive: {
    backgroundColor: C.primary + "20",
  },
  selectOptionText: {
    fontSize: 14,
    color: C.textSecondary,
  },
  selectOptionTextActive: {
    color: C.primary,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.dangerBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.danger,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: C.danger,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPrimaryText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: {
    color: C.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});