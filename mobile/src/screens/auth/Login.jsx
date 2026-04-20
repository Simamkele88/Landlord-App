// THIS IS A LOGIN SCREEN FOR TENANTS
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU DO NOT UNDERSTAND THIS CODE, PLEASE ASK ME TO EXPLAIN AND DON'T ASSUME OTHERWISE.
import { useState } from "react";
import { Image } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// MOCK TENANTS
const MOCK_TENANTS = [
{id:"1",email:"nsindisosimamkele88@gmail.com",phone:"0679007079",password:"Wekeza2004@",fullName:"Sipho Dlamini",unit:"Unit 4A",property:"Hillbrow Heights",leaseStart:"2026-01-01",leaseEnd:"2026-12-31",rentAmount:6500},
{id:"2",email:"lerato.mokoena@example.com",phone:"0839876543",password:"Tenant@2024",fullName:"Lerato Mokoena",unit:"Unit 2B",property:"Hillbrow Heights",leaseStart:"2026-02-01",leaseEnd:"2027-01-31",rentAmount:5800},
{id:"3",email:"tenant@test.com",phone:"0712345678",password:"password123",fullName:"Test Tenant",unit:"Unit 1A",property:"Berea Flats",leaseStart:"2026-01-01",leaseEnd:"2026-12-31",rentAmount:7200}
];

// GENERATE A MOCK JWT TOKEN 
function generateMockToken(userId) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ 
    userId, 
    role: "tenant",
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  }));
  return `${header}.${payload}.mock-signature`;
}

// MAIN SCREEN 
export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // VALIDATE THE INPUTS BEFORE SUBMITTING
  function validate() {
    if (!email.trim())    return "Please enter your email or phone number.";
    if (!password.trim()) return "Please enter your password.";
    return null;
  }

  // HANDLES THE LOGIN LOGIC
  async function handleLogin() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    // SIMULATED NETWORK REQUEST
    setTimeout(async () => {
      try {
        // FIND TENANT BY EMAIL OR PHONE
        const tenant = MOCK_TENANTS.find(t => 
          t.email.toLowerCase() === email.trim().toLowerCase() ||
          t.phone === email.trim()
        );

        // CHECK IF TENANT EXISTS
        if (!tenant) {
          setError("No account found with this email or phone number.");
          setLoading(false);
          return;
        }

        // CHECK PASSWORD
        if (tenant.password !== password) {
          setError("Incorrect password. Please try again.");
          setLoading(false);
          return;
        }

        // CREATE USER OBJECT WITHOUT PASSWORD
        const { password: _, ...userWithoutPassword } = tenant;
        
        const user = {
          ...userWithoutPassword,
          role: "tenant",
        };

        // GENERATE A MOCK TOKEN
        const token = generateMockToken(tenant.id);

        // PERSIST TOKEN AND USER DATA LOCALLY
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        // SWITCH TO MAIN APP
        onLogin(token, user);

      } catch (err) {
        setError("Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 800); 
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

          {/* LOGO AND BRANDING*/}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Image 
                source={require("../../../assets/logo.png")} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Chihwa Rentals</Text>
            <Text style={styles.appTagline}>Tenant Portal</Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>

            {/* ── Error banner ── */}
            {error !== "" && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Email / Phone ── */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email or Phone Number</Text>
              <View style={[styles.inputWrap, error && email === "" && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(""); }}
                  placeholder="you@example.com or 0821234567"
                  placeholderTextColor={C.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={C.primary}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* ── Password ── */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity  activeOpacity={0.7}>
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

            {/* ── Login button ── */}
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

          {/* ── Footer ── */}
          <Text style={styles.footer}>Chihwa Rentals · Tenant App</Text>

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
  
  // Fallback emoji style
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

  // ── Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 6,
    justifyContent: "center",
    display: "flex",
  },
  cardSub: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 19,
    marginBottom: 24,
  },

  // ── Error
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

  // ── Inputs
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

  // ── Login button
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

  // ── Demo button
  demoBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.warning,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  demoBtnText: {
    color: C.warning,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Info box
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

  // ── Mock mode badge
  mockBadge: {
    backgroundColor: C.warning + "20",
    borderWidth: 1,
    borderColor: C.warning,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  mockBadgeText: {
    fontSize: 11,
    color: C.warning,
    fontWeight: "600",
  },

  // ── Footer
  footer: {
    textAlign: "center",
    color: C.textMuted,
    fontSize: 11,
    marginTop: 32,
  },
});