// TENANT VERIFY RESET CODE SCREEN
import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import api from "../../utils/api";

const API_URL = api.getBaseUrl();

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
};
const F = { bebas: "bebas-neue", dm: "dm-sans", mono: "space-mono" };

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
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const fullCode = code.join("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (fullCode.length < 6) { setError("Please enter the full 6-digit code"); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: fullCode }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Invalid or expired code"); }
      navigation.navigate("ResetPassword", { email: email.trim().toLowerCase(), code: fullCode });
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally { setLoading(false); }
  }

  const $input = {
    backgroundColor: C.black, borderWidth: 1, borderColor: C.border,
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: 13,
    fontSize: 15, color: C.white, fontFamily: F.dm,
  };
  const $btnGold = {
    backgroundColor: C.gold, borderRadius: 3, paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
  };

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={S.container}>
          <Text style={S.step}>STEP 1 OF 2</Text>
          <Text style={S.title}>Verify Reset Code</Text>
          <Text style={S.subtitle}>Enter the 6-digit code sent to your email.</Text>

          {error ? (
            <View style={S.errorBanner}>
              <Feather name="alert-circle" size={14} color={C.redLight} />
              <Text style={S.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={S.inputGroup}>
            <Text style={S.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={$input}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(""); }}
              placeholder="you@example.com"
              placeholderTextColor="rgba(245,240,232,0.15)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={S.inputGroup}>
            <Text style={S.label}>RESET CODE</Text>
            <View style={S.codeRow}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[S.codeInput, digit && { borderColor: C.gold }]}
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

          <TouchableOpacity style={[$btnGold, loading && { opacity: 0.6 }]} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={C.black} size="small" /> : <Text style={S.btnText}>VERIFY CODE</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{ marginTop: 16 }}>
            <Text style={S.link}>Didn't receive a code? Send again</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  step: { fontSize: 10, fontWeight: "700", color: C.gold, fontFamily: F.mono, letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 8 },
  subtitle: { fontSize: 13, color: "rgba(245,240,232,0.4)", fontFamily: F.dm, marginBottom: 24, lineHeight: 20 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)", fontFamily: F.mono, letterSpacing: 1.5, marginBottom: 6 },

  codeRow: { flexDirection: "row", justifyContent: "space-between" },
  codeInput: {
    width: 46, height: 54,
    backgroundColor: C.black, borderWidth: 1, borderColor: C.border,
    borderRadius: 3, textAlign: "center",
    fontSize: 22, fontWeight: "700", color: C.white, fontFamily: F.mono,
  },

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(224,90,74,0.06)", borderRadius: 3, borderWidth: 1,
    borderColor: "rgba(224,90,74,0.15)", padding: 10, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 12, color: C.redLight, fontFamily: F.dm },

  btnText: { color: C.black, fontSize: 13, fontWeight: "700", fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
  link: { color: C.gold, fontSize: 12, fontWeight: "600", fontFamily: F.mono, textAlign: "center" },
});