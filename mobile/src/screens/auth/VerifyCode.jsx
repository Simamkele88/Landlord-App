// TENANT VERIFY RESET CODE SCREEN
import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
   StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import api from "../../utils/api";

const API_URL = api.getBaseUrl(); 

const C = {
  bg: "#0F172A", surface: "#1E293B", surfaceAlt: "#273449",
  border: "#334155", primary: "#3B82F6",
  danger: "#EF4444", dangerBg: "#450A0A",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#fbdada",
};

export default function VerifyCode() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef([]);

  function handleCodeChange(text, index) {
    const digit = text.replace(/\D/g, "").slice(0, 1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e, index) {
    // Move back on backspace if empty
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const fullCode = code.join("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (fullCode.length < 6) { setError("Please enter the full 6-digit code"); return; }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: fullCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid or expired code");
      }

      // Navigate to reset password
      navigation.navigate("ResetPassword", {
        email: email.trim().toLowerCase(),
        code: fullCode,
      });
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <Text style={styles.step}>Step 1 of 2</Text>
          <Text style={styles.title}>Verify Reset Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to your email.
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={14} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
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
            />
          </View>

          {/* 6-Digit Code Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reset Code</Text>
            <View style={styles.codeRow}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.codeInput}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Text style={styles.btnText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.link}>Didn't receive a code? Send again</Text>
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
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.textPrimary,
  },
  codeRow: { flexDirection: "row", justifyContent: "space-between" },
  codeInput: {
    width: 48, height: 56,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, textAlign: "center",
    fontSize: 22, fontWeight: "700", color: C.textPrimary,
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