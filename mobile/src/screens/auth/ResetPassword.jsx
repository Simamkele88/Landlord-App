// TENANT RESET PASSWORD SCREEN
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
   StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import api from "../../utils/api";

const API_URL = api.getBaseUrl(); 

const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", successBg: "#052E16",
  danger: "#EF4444", dangerBg: "#450A0A",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#fbdada",
};

// MAIN COMPONENT
export default function ResetPassword() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, code } = route.params || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!newPassword) { setError("New password is required"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // SUCCESS
  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={styles.container}>
          <View style={styles.successIcon}>
            <Feather name="check" size={32} color={C.success} />
          </View>
          <Text style={styles.title}>Password Reset</Text>
          <Text style={styles.subtitle}>
            Your password has been updated successfully.
          </Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.btnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // RESET FORM
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <Text style={styles.step}>Step 2 of 2</Text>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>Choose a new password for {email}.</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setError(""); }}
                placeholder="At least 8 characters"
                placeholderTextColor={C.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
              placeholder="Re-enter your password"
              placeholderTextColor={C.textMuted}
              secureTextEntry
            />
            {confirmPassword && newPassword !== confirmPassword ? (
              <Text style={styles.fieldError}>Passwords do not match</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Text style={styles.btnText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  step: { fontSize: 12, fontWeight: "600", color: C.primary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "800", color: C.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24, lineHeight: 20 },
  successIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.successBg, borderWidth: 2, borderColor: C.success,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.textPrimary,
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  eyeBtn: { position: "absolute", right: 14 },
  fieldError: { fontSize: 11, color: C.danger, marginTop: 4 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.dangerBg, borderRadius: 10, borderWidth: 1,
    borderColor: C.danger, padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: C.danger },
  btn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginBottom: 16, marginTop: 8,
  },
  btnText: { color: C.white, fontSize: 16, fontWeight: "700" },
  link: { color: C.primary, fontSize: 14, fontWeight: "600", textAlign: "center" },
});