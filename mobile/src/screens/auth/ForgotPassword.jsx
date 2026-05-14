// TENANT FORGOT PASSWORD SCREEN
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
   StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, SafeAreaView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import api from "../../utils/api";


const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  success: "#22C55E", successBg: "#052E16",
  danger: "#EF4444", dangerBg: "#450A0A",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF",
};

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSendCode() {
  if (!email.trim()) {
    setError("Please enter your email address");
    return;
  }

  setLoading(true);
  setError("");

  try {
    await api.post("/auth/forgot-password", {
      email: email.trim().toLowerCase()
    });

    
    setSent(true);
  } catch (err) {
    setError(err.data?.error || "Unable to connect. Please try again.");
  } finally {
    setLoading(false);
  }
}

  // SUCCESS
  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={styles.container}>
          <View style={styles.successIcon}>
            <Feather name="check" size={32} color={C.success} />
          </View>
          <Text style={styles.title}>Code Sent</Text>
          <Text style={styles.subtitle}>
            If an account exists for {email}, a 6-digit reset code has been sent.
          </Text>
          <Text style={styles.hint}>The code expires in 15 minutes.</Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("VerifyCode")}
          >
            <Text style={styles.btnText}>Enter Reset Code</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // FORGOT PASSWORD FORM
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a 6-digit reset code.
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(""); }}
              placeholder="you@example.com"
              placeholderTextColor={C.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Text style={styles.btnText}>Send Reset Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "800", color: C.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24, lineHeight: 20 },
  hint: { fontSize: 12, color: C.textMuted, marginBottom: 24 },
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