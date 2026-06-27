// CHANGE PASSWORD SCREEN 
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, Alert, ActivityIndicator, SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function ChangePassword({ navigation, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleChangePassword() {
    setError("");
    if (!currentPassword || !newPassword || !confirmPassword) { setError("All fields are required"); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("temp_token");
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Failed to change password"); return; }
      await AsyncStorage.removeItem("temp_token");
      await AsyncStorage.removeItem("temp_user");
      Alert.alert("Success", "Password changed successfully", [
        { text: "OK", onPress: () => onPasswordChanged?.() },
      ]);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally { setLoading(false); }
  }

  const $input = {
    backgroundColor: C.black, borderWidth: 1, borderColor: C.border,
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: 13,
    fontSize: 15, color: C.white, fontFamily: F.dm,
  };

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <View style={S.container}>
        <Text style={S.title}>Change Password</Text>
        <Text style={S.subtitle}>Enter your current password and choose a new one</Text>

        {error !== "" && (
          <View style={S.errorBanner}>
            <Text style={S.errorText}>{error}</Text>
          </View>
        )}

        <View style={S.inputGroup}>
          <Text style={S.label}>CURRENT PASSWORD</Text>
          <TextInput
            style={$input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor="rgba(245,240,232,0.15)"
          />
        </View>

        <View style={S.inputGroup}>
          <Text style={S.label}>NEW PASSWORD</Text>
          <TextInput
            style={$input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor="rgba(245,240,232,0.15)"
          />
        </View>

        <View style={S.inputGroup}>
          <Text style={S.label}>CONFIRM NEW PASSWORD</Text>
          <TextInput
            style={$input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Re-enter new password"
            placeholderTextColor="rgba(245,240,232,0.15)"
          />
        </View>

        <TouchableOpacity
          style={[S.btn, loading && { opacity: 0.6 }]}
          onPress={handleChangePassword}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={C.black} size="small" />
          ) : (
            <Text style={S.btnText}>CHANGE PASSWORD</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1, marginBottom: 6 },
  subtitle: { fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: F.mono, marginBottom: 24 },

  errorBanner: {
    backgroundColor: "rgba(224,90,74,0.06)", borderRadius: 3, borderWidth: 1,
    borderColor: "rgba(224,90,74,0.15)", padding: 10, marginBottom: 16,
  },
  errorText: { color: C.redLight, fontSize: 12, fontFamily: F.dm },

  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.25)",
    fontFamily: F.mono, letterSpacing: 1.5, marginBottom: 6,
  },

  btn: {
    backgroundColor: C.gold, borderRadius: 3, paddingVertical: 15,
    alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  btnText: { color: C.black, fontSize: 14, fontWeight: "700", fontFamily: F.dm, letterSpacing: 1, textTransform: "uppercase" },
});