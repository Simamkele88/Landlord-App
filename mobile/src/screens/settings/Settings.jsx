// TENANT SETTINGS SCREEN 
import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  Alert, Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
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
  purple:       "#8B5CF6",
};
const F = { bebas: "bebas-neue", dm: "dm-sans", mono: "space-mono" };

function ToggleRow({ icon, label, desc, value, onToggle }) {
  return (
    <View style={S.toggleRow}>
      <View style={S.toggleIcon}>
        <Ionicons name={icon} size={18} color={value ? C.gold : "rgba(245,240,232,0.3)"} />
      </View>
      <View style={S.toggleContent}>
        <Text style={S.toggleLabel}>{label}</Text>
        {desc && <Text style={S.toggleDesc}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: "rgba(232,160,18,0.3)" }}
        thumbColor={value ? C.gold : "rgba(245,240,232,0.4)"}
        ios_backgroundColor={C.border}
      />
    </View>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={S.sectionCard}>
      <View style={S.sectionHeader}>
        <Text style={S.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [rentReminders, setRentReminders] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [complaintAlerts, setComplaintAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [leaseAlerts, setLeaseAlerts] = useState(true);

  const [darkMode, setDarkMode] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);

  const $input = {
    backgroundColor: C.black, borderWidth: 1, borderColor: C.border,
    borderRadius: 3, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 13, color: C.white, fontFamily: F.dm,
  };

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Password changed successfully.");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        Alert.alert("Error", data.error || "Failed to change password.");
      }
    } catch (err) {
      Alert.alert("Error", "Unable to connect to server.");
    } finally { setChangingPassword(false); }
  }

  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out", style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      {/* HEADER */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.pad} showsVerticalScrollIndicator={false}>
        {/* CHANGE PASSWORD */}
        <SectionCard title="CHANGE PASSWORD">
          <View style={S.passwordForm}>
            <View style={S.inputGroup}>
              <Text style={S.inputLabel}>Current Password</Text>
              <TextInput
                style={$input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="rgba(245,240,232,0.15)"
                secureTextEntry={!showPassword}
              />
            </View>
            <View style={S.inputGroup}>
              <Text style={S.inputLabel}>New Password</Text>
              <TextInput
                style={$input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                placeholderTextColor="rgba(245,240,232,0.15)"
                secureTextEntry={!showPassword}
              />
            </View>
            <View style={S.inputGroup}>
              <Text style={S.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={$input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="rgba(245,240,232,0.15)"
                secureTextEntry={!showPassword}
              />
            </View>
            <View style={S.passwordActions}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={S.showPwBtn}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={16} color="rgba(245,240,232,0.4)" />
                <Text style={S.showPwText}>{showPassword ? "Hide" : "Show"} passwords</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.changePwBtn, changingPassword && { opacity: 0.5 }]}
                onPress={handleChangePassword}
                disabled={changingPassword}
                activeOpacity={0.7}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color={C.black} />
                ) : (
                  <Text style={S.changePwBtnText}>UPDATE PASSWORD</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SectionCard>

        {/* NOTIFICATIONS */}
        <SectionCard title="NOTIFICATIONS">
          <ToggleRow icon="notifications" label="Push Notifications" desc="Receive alerts on your device" value={pushEnabled} onToggle={setPushEnabled} />
          <View style={S.toggleDivider} />
          <ToggleRow icon="calendar" label="Rent Reminders" desc="Get notified before rent is due" value={rentReminders} onToggle={setRentReminders} />
          <View style={S.toggleDivider} />
          <ToggleRow icon="build" label="Maintenance Updates" desc="Status changes on your repair requests" value={maintenanceAlerts} onToggle={setMaintenanceAlerts} />
          <View style={S.toggleDivider} />
          <ToggleRow icon="flag" label="Complaint Updates" desc="Updates on filed complaints" value={complaintAlerts} onToggle={setComplaintAlerts} />
          <View style={S.toggleDivider} />
          <ToggleRow icon="chatbubble" label="Messages" desc="New message notifications" value={messageAlerts} onToggle={setMessageAlerts} />
          <View style={S.toggleDivider} />
          <ToggleRow icon="document-text" label="Lease Alerts" desc="Lease expiry and renewal notices" value={leaseAlerts} onToggle={setLeaseAlerts} />
        </SectionCard>

        {/* APP PREFERENCES */}
        <SectionCard title="APP PREFERENCES">
          <ToggleRow icon="moon" label="Dark Mode" desc="Use dark theme" value={darkMode} onToggle={setDarkMode} />
          <View style={S.toggleDivider} />
          <ToggleRow icon="finger-print" label="Biometric Lock" desc="Require fingerprint to open app" value={biometricLock} onToggle={setBiometricLock} />
        </SectionCard>

        {/* DATA & PRIVACY */}
        <SectionCard title="DATA & PRIVACY">
          <TouchableOpacity style={S.menuRow} onPress={() => Alert.alert("Coming Soon", "Data export will be available soon.")} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={18} color="rgba(245,240,232,0.4)" style={{ marginRight: 10 }} />
            <Text style={S.menuLabel}>Export My Data</Text>
            <Feather name="chevron-right" size={14} color="rgba(245,240,232,0.2)" style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
          <View style={S.toggleDivider} />
          <TouchableOpacity style={S.menuRow} onPress={() => Alert.alert("Coming Soon", "Privacy settings will be available soon.")} activeOpacity={0.7}>
            <Ionicons name="shield-checkmark-outline" size={18} color="rgba(245,240,232,0.4)" style={{ marginRight: 10 }} />
            <Text style={S.menuLabel}>Privacy Settings</Text>
            <Feather name="chevron-right" size={14} color="rgba(245,240,232,0.2)" style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        </SectionCard>

        {/* ABOUT */}
        <SectionCard title="ABOUT">
          <View style={S.aboutRow}>
            <Text style={S.aboutLabel}>Version</Text>
            <Text style={S.aboutValue}>1.0.0</Text>
          </View>
          <View style={S.toggleDivider} />
          <TouchableOpacity style={S.menuRow} onPress={() => Alert.alert("Help", "Contact your landlord or caretaker for assistance.")} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={18} color="rgba(245,240,232,0.4)" style={{ marginRight: 10 }} />
            <Text style={S.menuLabel}>Help & Support</Text>
            <Feather name="chevron-right" size={14} color="rgba(245,240,232,0.2)" style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        </SectionCard>

        {/* LOGOUT */}
        <TouchableOpacity style={S.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={18} color={C.redLight} style={{ marginRight: 8 }} />
          <Text style={S.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.black },

  header: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: C.white, fontFamily: F.bebas, letterSpacing: 1 },

  scroll: { flex: 1 },
  pad: { padding: 14, gap: 12 },

  // SECTION CARD
  sectionCard: {
    backgroundColor: C.muted2, borderRadius: 6, borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
  },
  sectionHeader: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sectionTitle: {
    fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.2)",
    fontFamily: F.mono, letterSpacing: 2,
  },

  // PASSWORD FORM
  passwordForm: { padding: 14 },
  inputGroup: { marginBottom: 10 },
  inputLabel: {
    fontSize: 10, fontWeight: "600", color: "rgba(245,240,232,0.3)",
    fontFamily: F.mono, letterSpacing: 1, marginBottom: 5, textTransform: "uppercase",
  },
  passwordActions: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 6,
  },
  showPwBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  showPwText: { fontSize: 11, color: "rgba(245,240,232,0.3)", fontFamily: F.mono },
  changePwBtn: {
    backgroundColor: C.gold, borderRadius: 3,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  changePwBtnText: { fontSize: 10, fontWeight: "700", color: C.black, fontFamily: F.dm, letterSpacing: 1 },

  // TOGGLE ROW
  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  toggleIcon: { width: 24, alignItems: "center" },
  toggleContent: { flex: 1 },
  toggleLabel: { fontSize: 13, fontWeight: "600", color: C.white, fontFamily: F.dm },
  toggleDesc: { fontSize: 10, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, marginTop: 2 },
  toggleDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 14 },

  // MENU ROW
  menuRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 13,
  },
  menuLabel: { fontSize: 13, fontWeight: "500", color: C.white, fontFamily: F.dm },

  // ABOUT
  aboutRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 13,
  },
  aboutLabel: { fontSize: 13, fontWeight: "500", color: C.white, fontFamily: F.dm },
  aboutValue: { fontSize: 12, color: "rgba(245,240,232,0.35)", fontFamily: F.mono },

  // LOGOUT
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 6,
    backgroundColor: "rgba(224,90,74,0.06)", borderWidth: 1, borderColor: "rgba(224,90,74,0.15)",
    marginTop: 4,
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: C.redLight, fontFamily: F.dm },
});