// CHANGE PASSWORD SCREEN
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
   StatusBar, Alert, ActivityIndicator, SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api";

const API_URL = api.getBaseUrl(); 


const C = {
  bg: "#0F172A", surface: "#1E293B", border: "#334155",
  primary: "#3B82F6", danger: "#EF4444", dangerBg: "#450A0A",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#64748B",
  white: "#FFFFFF", success: "#22C55E",
};

// MAIN APP COMPONENT
export default function ChangePassword({ navigation, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleChangePassword() {
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token") || 
                    await AsyncStorage.getItem("temp_token");

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to change password");
        return;
      }

      // CLEAR TEMP TOKEN IF IT WAS USED
      await AsyncStorage.removeItem("temp_token");
      await AsyncStorage.removeItem("temp_user");

      Alert.alert("Success", "Password changed successfully", [
        { text: "OK", onPress: () => onPasswordChanged?.() },
      ]);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.container}>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>Enter your current password and choose a new one</Text>

        {error !== "" && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor={C.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor={C.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Re-enter new password"
            placeholderTextColor={C.textMuted}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={styles.btnText}>Change Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", color: C.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24 },
  errorBanner: {
    backgroundColor: C.dangerBg, borderRadius: 10, borderWidth: 1,
    borderColor: C.danger, padding: 12, marginBottom: 16,
  },
  errorText: { color: C.danger, fontSize: 13 },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 12, fontWeight: "600", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
  },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.textPrimary,
  },
  btn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
  },
  btnText: { color: C.white, fontSize: 16, fontWeight: "700" },
});