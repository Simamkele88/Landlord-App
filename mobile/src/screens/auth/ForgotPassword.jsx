// TENANT FORGOT PASSWORD SCREEN
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
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
};
const F = { bebas: "bebas-neue", dm: "dm-sans", mono: "space-mono" };

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSendCode() {
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err.data?.error || "Unable to connect. Please try again.");
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

  // SUCCESS STATE
  if (sent) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.container}>
          <View style={S.successIcon}>
            <Feather name="check" size={30} color={C.greenLight} />
          </View>
          <Text style={S.title}>Code Sent</Text>
          <Text style={S.subtitle}>
            If an account exists for <Text style={{ color: C.white, fontWeight: "600" }}>{email}</Text>, a 6-digit reset code has been sent.
          </Text>
          <Text style={S.hint}>The code expires in 15 minutes.</Text>

          <TouchableOpacity style={$btnGold} onPress={() => navigation.navigate("VerifyCode")} activeOpacity={0.85}>
            <Text style={S.btnText}>ENTER RESET CODE</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={S.link}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // FORM
  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={S.container}>
          <Text style={S.title}>Forgot Password</Text>
          <Text style={S.subtitle}>Enter your email and we'll send you a 6-digit reset code.</Text>

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
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[$btnGold, loading && { opacity: 0.6 }]}
            onPress={handleSendCode}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={C.black} size="small" />
            ) : (
              <Text style={S.btnText}>SEND RESET CODE</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={S.link}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  container: { flex: 1, justifyContent: "center", padding: 24 },

  title: { fontSize: 22, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 8 },
  subtitle: { fontSize: 13, color: "rgba(245,240,232,0.4)", fontFamily: F.dm, marginBottom: 24, lineHeight: 20 },
  hint: { fontSize: 11, color: "rgba(245,240,232,0.25)", fontFamily: F.mono, marginBottom: 20 },

  successIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(26,122,74,0.08)", borderWidth: 2, borderColor: "rgba(76,186,122,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 16, alignSelf: "center",
  },

  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)",
    fontFamily: F.mono, letterSpacing: 1.5, marginBottom: 6,
  },

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(224,90,74,0.06)", borderRadius: 3, borderWidth: 1,
    borderColor: "rgba(224,90,74,0.15)", padding: 10, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 12, color: C.redLight, fontFamily: F.dm },

  btnText: { color: C.black, fontSize: 13, fontWeight: "700", fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
  link: { color: C.gold, fontSize: 13, fontWeight: "600", fontFamily: F.mono, textAlign: "center" },
});