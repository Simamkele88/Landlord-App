import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";

export default function LoginBriefingModal({ visible, onClose }) {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) loadDigest();
  }, [visible]);

  async function loadDigest() {
    try {
      const res = await api.get("/dashboard/login-digest");
      setDigest(res.digest);
    } catch {} finally { setLoading(false); }
  }

  async function handleClose() {
    await AsyncStorage.setItem("digest_shown", "true");
    onClose();
  }

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Here’s what’s happening</Text>

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 24 }} color="#2c3e50" />
        ) : digest ? (
          <View style={{ gap: 8, marginTop: 12 }}>
            {digest.current_invoice && (
              <Text style={styles.row}>• {digest.current_invoice.status === "overdue" ? "Rent overdue" : "Rent due"}: R {Number(digest.current_invoice.remaining_balance).toLocaleString("en-ZA")}</Text>
            )}
            {digest.open_maintenance > 0 && <Text style={styles.row}>• {digest.open_maintenance} open maintenance requests</Text>}
            {digest.open_complaints > 0 && <Text style={styles.row}>• {digest.open_complaints} open complaints</Text>}
            {digest.unread_messages > 0 && <Text style={styles.row}>• {digest.unread_messages} unread messages</Text>}
            {digest.pending_payments > 0 && <Text style={styles.row}>• {digest.pending_payments} pending payment submissions</Text>}
          </View>
        ) : (
          <Text style={{ textAlign: "center", marginVertical: 24, color: "#666" }}>Nothing urgent.</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleClose}>
          <Text style={styles.buttonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 400, backgroundColor: "#fff", borderRadius: 8, padding: 20 },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 12, color: "#666", marginTop: 4 },
  row: { fontSize: 14, color: "#000", paddingVertical: 4 },
  button: { marginTop: 16, backgroundColor: "#2c3e50", padding: 12, borderRadius: 4, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});