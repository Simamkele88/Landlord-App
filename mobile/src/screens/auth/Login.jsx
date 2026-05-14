// THIS IS A LOGIN SCREEN FOR TENANTS - CONNECTS TO BACKEND API
import { useState } from "react";
import { Image } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import api from "../../utils/api";


// THEME COLORS
const C = {
  bg:           "#0F172A",
  surface:      "#1E293B",
  surfaceAlt:   "#273449",
  border:       "#334155",
  primary:      "#3B82F6",
  primaryDark:  "#2563EB",
  danger:       "#EF4444",
  dangerBg:     "#450A0A",
  textPrimary:  "#F1F5F9",
  textSecondary:"#94A3B8",
  textMuted:    "#64748B",
  white:        "#FFFFFF",
  success:      "#10B981",
  warning:      "#F59E0B",
};

// MAIN SCREEN
export default function Login({ onLogin }) {
  const navigation = useNavigation();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // VALIDATE THE INPUTS BEFORE SUBMITTING
  function validate() {
    if (!email.trim())    return "Please enter your email.";
    if (!password.trim()) return "Please enter your password.";
    return null;
  }

  // LOGIN HANDLER
async function handleLogin() {
  const validationError = validate();
  if (validationError) {
    setError(validationError);
    return;
  }

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

    
    if (user.must_change_password) {
      navigation.navigate("ChangePassword", { token });
      return;
    }

    if (user.role === "tenant" && !user.profile_completed) {
      navigation.navigate("CompleteProfile");
      return;
    }

    onLogin(token, user);

  } catch (err) {
    console.error("Login error:", err);
    
    if (err.status === 401) {
      setError("Invalid email or password. Please try again.");
    } else if (err.status === 403) {
      setError("Your account has been deactivated. Please contact your landlord.");
    } else if (err.data?.error) {
      setError(err.data.error);
    } else {
      setError("Unable to connect to server. Please check your internet connection.");
    }
  } finally {
    setLoading(false);
  }
}
  
  // FORGOT PASSWORD HANDLER
  function handleForgotPassword() {
    navigation.navigate("ForgotPassword");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* LOGO AND BRANDING */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Image 
                source={require("../../../assets/logo.png")} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Chihwa Rentals</Text>
          </View>

          {/* LOGIN CARD */}
          <View style={styles.card}>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Welcome back</Text>
            </View>

            {/* ERROR BANNER */}
            {error !== "" && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* EMAIL / PHONE */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email </Text>
              <View style={[styles.inputWrap, error && email === "" && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(""); }}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={C.primary}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrap, error && password === "" && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(""); }}
                  placeholder="Enter your password"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={C.primary}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} activeOpacity={0.7}>
                  <Text style={styles.showPassText}>{showPass ? "Hide" : "Show"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* LOGIN BUTTON */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// PAGE STYLES
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 40,
  },

  brandSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden", 
    padding: 5, 
  },
  
  logoImage: {
    width: 70, 
    height: 70, 
    resizeMode: "contain",
  },
  
  logoIcon: {
    fontSize: 45,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 4,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitleWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  cardTitle: {
   
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 19,
    marginBottom: 24,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.dangerBg,
    borderWidth: 1,
    borderColor: C.danger,
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  errorIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: C.danger,
    lineHeight: 18,
    fontWeight: "500",
  },

  inputGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    gap: 10,
  },
  inputError: {
    borderColor: C.danger,
  },
  inputIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.textPrimary,
    padding: 0,
  },
  showPassText: {
    fontSize: 13,
    color: C.primary,
    fontWeight: "600",
  },
  forgotText: {
    fontSize: 12,
    color: C.primary,
    fontWeight: "600",
  },

  loginBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  infoBox: {
    backgroundColor: "#1e3a5f",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: "#93c5fd",
    lineHeight: 18,
  },

  footer: {
    textAlign: "center",
    color: C.textMuted,
    fontSize: 11,
    marginTop: 32,
  },
});