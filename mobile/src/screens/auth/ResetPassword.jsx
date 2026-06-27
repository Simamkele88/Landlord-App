// TENANT RESET PASSWORD SCREEN 
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
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
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Failed to reset password"); }
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to connect. Please try again.");
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

  // SUCCESS
  if (success) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.black} />
        <View style={S.container}>
          <View style={S.successIcon}>
            <Feather name="check" size={30} color={C.greenLight} />
          </View>
          <Text style={S.title}>Password Reset</Text>
          <Text style={S.subtitle}>Your password has been updated successfully.</Text>
          <TouchableOpacity style={$btnGold} onPress={() => navigation.navigate("Login")} activeOpacity={0.85}>
            <Text style={S.btnText}>GO TO LOGIN</Text>
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
          <Text style={S.step}>STEP 2 OF 2</Text>
          <Text style={S.title}>Set New Password</Text>
          <Text style={S.subtitle}>Choose a new password for <Text style={{ color: C.white, fontWeight: "600" }}>{email}</Text>.</Text>

          {error ? (
            <View style={S.errorBanner}>
              <Feather name="alert-circle" size={14} color={C.redLight} />
              <Text style={S.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={S.inputGroup}>
            <Text style={S.label}>NEW PASSWORD</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                style={[$input, { paddingRight: 40 }]}
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setError(""); }}
                placeholder="At least 8 characters"
                placeholderTextColor="rgba(245,240,232,0.15)"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={S.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="rgba(245,240,232,0.3)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={S.inputGroup}>
            <Text style={S.label}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={$input}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setError(""); }}
              placeholder="Re-enter your password"
              placeholderTextColor="rgba(245,240,232,0.15)"
              secureTextEntry
            />
            {confirmPassword && newPassword !== confirmPassword ? (
              <Text style={S.fieldError}>Passwords do not match</Text>
            ) : null}
          </View>

          <TouchableOpacity style={[$btnGold, loading && { opacity: 0.6 }]} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={C.black} size="small" /> : <Text style={S.btnText}>RESET PASSWORD</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={S.link}>Back</Text>
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
  successIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(26,122,74,0.08)", borderWidth: 2, borderColor: "rgba(76,186,122,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 16, alignSelf: "center",
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)", fontFamily: F.mono, letterSpacing: 1.5, marginBottom: 6 },
  eyeBtn: { position: "absolute", right: 12, top: "50%", transform: [{ translateY: -9 }] },
  fieldError: { fontSize: 10, color: C.redLight, fontFamily: F.mono, marginTop: 3 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(224,90,74,0.06)", borderRadius: 3, borderWidth: 1,
    borderColor: "rgba(224,90,74,0.15)", padding: 10, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 12, color: C.redLight, fontFamily: F.dm },
  btnText: { color: C.black, fontSize: 13, fontWeight: "700", fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
  link: { color: C.gold, fontSize: 13, fontWeight: "600", fontFamily: F.mono, textAlign: "center" },
});