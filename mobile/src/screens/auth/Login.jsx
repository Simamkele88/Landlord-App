// TENANT LOGIN SCREEN 
import { useState } from "react";
import { Image } from "react-native";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, ScrollView, Platform,
  ActivityIndicator, Alert, SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

export default function Login({ onLogin }) {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate() {
    if (!email.trim()) return "Please enter your email.";
    if (!password.trim()) return "Please enter your password.";
    return null;
  }

  async function handleLogin() {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError("");
    setLoading(true);
    try {
      const data = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password,
      });
      const { token, user } = data;
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      if (user.must_change_password) { navigation.navigate("ChangePassword", { token }); return; }
      if (user.role === "tenant" && !user.profile_completed) { navigation.navigate("CompleteProfile"); return; }
      onLogin(token, user);
    } catch (err) {
      if (err.status === 401) setError("Invalid email or password.");
      else if (err.status === 403) setError("Your account has been deactivated.");
      else if (err.data?.error) setError(err.data.error);
      else setError("Unable to connect to server.");
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* LOGO */}
          <View style={S.brandSection}>
            <View style={S.logoCircle}>
              <Image source={require("../../../assets/logo.png")} style={S.logoImage} resizeMode="contain" />
            </View>
            <Text style={S.appName}>Chihwa<Text style={{ color: C.primary }}>Rentals</Text></Text>
            <Text style={S.appTagline}>Tenant Portal</Text>
          </View>

          {/* LOGIN CARD */}
          <View style={S.card}>
            <Text style={S.cardTitle}>Welcome back</Text>

            {/* ERROR */}
            {error !== "" && (
              <View style={S.errorBanner}>
                <Text style={S.errorText}>{error}</Text>
              </View>
            )}

            {/* EMAIL */}
            <View style={S.inputGroup}>
              <Text style={S.inputLabel}>EMAIL</Text>
              <TextInput
                style={[S.input, error && !email && S.inputError]}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(""); }}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* PASSWORD */}
            <View style={S.inputGroup}>
              <View style={S.labelRow}>
                <Text style={S.inputLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} activeOpacity={0.7}>
                  <Text style={S.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={[S.inputWrap, error && !password && S.inputError]}>
                <TextInput
                  style={{ flex: 1, fontSize: 15, color: C.textPrimary, fontFamily: F.dm, padding: 0 }}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(""); }}
                  placeholder="Enter your password"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} activeOpacity={0.7}>
                  <Text style={S.showPassText}>{showPass ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              style={[S.loginBtn, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={S.loginBtnText}>SIGN IN</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={S.footer}>Chihwa Rentals · Tenant Portal</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 40 },

  // BRAND
  brandSection: { alignItems: "center", marginBottom: 36 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: C.card,
    alignItems: "center", justifyContent: "center",
    marginBottom: 14, overflow: "hidden", padding: 8,
  },
  logoImage: { width: 60, height: 60, resizeMode: "contain" },
  appName: { fontSize: 28, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  appTagline: { fontSize: 12, color: C.textMuted, fontFamily: F.mono, marginTop: 4 },

  // CARD
  card: {
    backgroundColor: C.card, borderRadius: 6,
    padding: 22, borderWidth: 1, borderColor: C.border,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 18, textAlign: "center" },

  // ERROR
  errorBanner: {
    backgroundColor: "rgba(158,58,58,0.06)", borderWidth: 1, borderColor: "rgba(158,58,58,0.15)",
    borderRadius: 3, padding: 10, marginBottom: 16,
  },
  errorText: { fontSize: 12, color: C.red, fontFamily: F.dm, lineHeight: 17 },

  // INPUTS
  inputGroup: { marginBottom: 16 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  inputLabel: { fontSize: 10, fontWeight: "700", color: "#888888", fontFamily: F.mono, letterSpacing: 1.5 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border,
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 13 : 10,
    gap: 8,
  },
  input: {
    backgroundColor: C.background, borderWidth: 1, borderColor: C.border,
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 13 : 10,
    fontSize: 15, color: C.textPrimary, fontFamily: F.dm,
  },
  inputError: { borderColor: C.red },
  showPassText: { fontSize: 12, color: C.primary, fontWeight: "600", fontFamily: F.mono },
  forgotText: { fontSize: 11, color: C.primary, fontWeight: "600", fontFamily: F.mono },

  // BUTTON
  loginBtn: {
    backgroundColor: C.primary, borderRadius: 3,
    paddingVertical: 15, alignItems: "center", justifyContent: "center",
    marginTop: 6, marginBottom: 8,
  },
  loginBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700", fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },

  // FOOTER
  footer: { textAlign: "center", color: C.textMuted, fontSize: 10, fontFamily: F.mono, marginTop: 28 },
});