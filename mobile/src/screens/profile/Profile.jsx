// TENANT PROFILE & LEASE SCREEN
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Alert, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from "@expo/vector-icons";
import api from "../../utils/api";
import { C, F } from "../../styles/theme";

function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" }) : "—"; }
function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }
function daysUntil(d) { if (!d) return null; return Math.ceil((new Date(d) - Date.now()) / 86400000); }

const SCORE_CONFIG = {
  "reliable":      { color: C.green,  bg: "rgba(43,122,75,0.08)",  border: "rgba(43,122,75,0.15)", label: "Reliable" },
  "moderate_risk": { color: C.blue,   bg: "rgba(52,152,219,0.08)", border: "rgba(52,152,219,0.15)", label: "Moderate Risk" },
  "high_risk":     { color: C.red,    bg: "rgba(158,58,58,0.08)",  border: "rgba(158,58,58,0.15)", label: "High Risk" },
};

function getScoreConfig(score) {
  const key = (score || "reliable").toLowerCase().replace(/\s+/g, "_");
  return SCORE_CONFIG[key] || SCORE_CONFIG.reliable;
}

function SectionCard({ title, icon, children }) {
  return (
    <View style={S.sectionCard}>
      <View style={S.sectionHeader}>
        <Ionicons name={icon} size={14} color={C.primary} />
        <Text style={S.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value, icon, mono }) {
  return (
    <View style={S.infoRow}>
      <View style={S.infoLabelWrap}>
        {icon && <Ionicons name={icon} size={13} color={C.textMuted} style={{ marginRight: 6 }} />}
        <Text style={S.infoLabel}>{label}</Text>
      </View>
      <Text style={[S.infoValue, mono && { fontFamily: F.mono }]}>{value}</Text>
    </View>
  );
}

function ScoreBreakdown({ tenant }) {
  const cfg = getScoreConfig(tenant?.reliability_score);
  const onTime = Number(tenant?.on_time_payments) || 0;
  const late = Number(tenant?.late_payments) || 0;
  const missed = Number(tenant?.missed_payments) || 0;
  const total = onTime + late + missed;

  return (
    <View style={S.scoreCard}>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View style={[S.scoreCircle, { borderColor: cfg.color }]}>
          <Text style={[S.scoreValue, { color: cfg.color }]}>
            {total > 0 ? Math.round((onTime / total) * 100) : 100}%
          </Text>
        </View>
        <Text style={[S.scoreLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {/* Bars */}
      {[
        { label: "On-time", value: onTime, color: C.green },
        { label: "Late", value: late, color: C.blue },
        { label: "Missed", value: missed, color: C.red },
      ].map(bar => (
        <View key={bar.label} style={S.barRow}>
          <Text style={S.barLabel}>{bar.label}</Text>
          <View style={S.barTrack}>
            <View style={[S.barFill, { backgroundColor: bar.color, width: `${total > 0 ? (bar.value / total) * 100 : 0}%` }]} />
          </View>
          <Text style={S.barValue}>{bar.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${api.getBaseUrl()}/tenants/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTenant(data.tenant || data);
        setForm(data.tenant || data);
      }
    } catch (err) {
      const mock = {
        first_name: "Simamkele", last_name: "Wekeza",
        email: "simamkele@email.com", phone: "+27 82 123 4567",
        unit_number: "213-B", property_name: "Hillbrow Heights",
        rent_amount: 5800, payment_frequency: "monthly",
        lease_start_date: "2025-06-01", lease_end_date: "2026-12-31",
        deposit_amount: 5800, payment_due_day: 1,
        reliability_score: "reliable",
        on_time_payments: 10, late_payments: 1, missed_payments: 0,
        employment_status: "employed", monthly_income: 25000,
        id_number: "8302155391083", date_of_birth: "1983-02-15",
        emergency_name: "Thandi Wekeza", emergency_phone: "+27 83 987 6543",
        emergency_relationship: "Sister",
        number_of_occupants: 2, has_pets: false,
        special_note: null,
      };
      setTenant(mock);
      setForm(mock);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${api.getBaseUrl()}/tenants/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setTenant(form);
      setEditing(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (err) {
      Alert.alert("Error", "Failed to save changes.");
    } finally { setSaving(false); }
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const daysLeft = daysUntil(tenant?.lease_end_date);
  const leaseExpiring = daysLeft !== null && daysLeft <= 60 && daysLeft >= 0;
  const leaseExpired = daysLeft !== null && daysLeft < 0;

  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.loader}><ActivityIndicator size="large" color={C.primary} /></View>
      </SafeAreaView>
    );
  }

  const $input = {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.textPrimary,
    fontFamily: F.dm,
    flex: 1,
  };

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* HEADER */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Profile & Lease</Text>
        <TouchableOpacity
          style={[S.editBtn, editing && S.editBtnActive]}
          onPress={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color={editing ? "#ffffff" : C.primary} />
          ) : (
            <Text style={[S.editBtnText, editing && S.editBtnTextActive]}>
              {editing ? "Save" : "Edit"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.pad} showsVerticalScrollIndicator={false}>
        {/* PROFILE HEADER */}
        <View style={S.profileHeader}>
          <View style={S.profileAvatar}>
            <Text style={S.profileAvatarText}>
              {initials(`${tenant?.first_name} ${tenant?.last_name}`)}
            </Text>
          </View>
          <View style={S.profileInfo}>
            {editing ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput style={$input} value={form.first_name} onChangeText={v => updateField("first_name", v)} placeholder="First name" placeholderTextColor={C.textMuted} />
                <TextInput style={$input} value={form.last_name} onChangeText={v => updateField("last_name", v)} placeholder="Last name" placeholderTextColor={C.textMuted} />
              </View>
            ) : (
              <Text style={S.profileName}>{tenant?.first_name} {tenant?.last_name}</Text>
            )}
            <Text style={S.profileUnit}>Unit {tenant?.unit_number} · {tenant?.property_name}</Text>
          </View>
        </View>

        {/* LEASE STATUS BANNER */}
        {(leaseExpired || leaseExpiring) && (
          <View style={[S.leaseBanner, {
            backgroundColor: leaseExpired ? "rgba(158,58,58,0.06)" : "rgba(52,152,219,0.04)",
            borderColor: leaseExpired ? "rgba(158,58,58,0.15)" : "rgba(52,152,219,0.12)"
          }]}>
            <Ionicons name={leaseExpired ? "warning" : "time"} size={16} color={leaseExpired ? C.red : C.blue} />
            <Text style={[S.leaseBannerText, { color: leaseExpired ? C.red : C.blue }]}>
              {leaseExpired ? "Your lease has expired. Contact your landlord to renew." : `Lease expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
            </Text>
          </View>
        )}

        {/* RELIABILITY SCORE */}
        <SectionCard title="RELIABILITY SCORE" icon="star">
          <ScoreBreakdown tenant={tenant} />
        </SectionCard>

        {/* PERSONAL INFO */}
        <SectionCard title="PERSONAL INFORMATION" icon="person">
          <InfoRow label="Email" value={tenant?.email} icon="mail" />
          <InfoRow label="Phone" value={tenant?.phone} icon="call" />
          <InfoRow label="ID Number" value={tenant?.id_number || "—"} mono />
          <InfoRow label="Date of Birth" value={tenant?.date_of_birth ? formatDate(tenant?.date_of_birth) : "—"} />
          <InfoRow label="Employment" value={tenant?.employment_status?.replace(/_/g, " ") || "—"} />
          <InfoRow label="Monthly Income" value={tenant?.monthly_income ? format(tenant?.monthly_income) : "—"} />
        </SectionCard>

        {/* LEASE DETAILS */}
        <SectionCard title="LEASE DETAILS" icon="document-text">
          <InfoRow label="Property" value={tenant?.property_name} icon="home" />
          <InfoRow label="Unit" value={`Unit ${tenant?.unit_number}`} icon="cube" />
          <InfoRow label="Monthly Rent" value={format(tenant?.rent_amount)} />
          <InfoRow label="Frequency" value={tenant?.payment_frequency || "Monthly"} />
          <InfoRow label="Deposit" value={format(tenant?.deposit_amount)} />
          <InfoRow label="Due Day" value={`Day ${tenant?.payment_due_day || 1}`} />
          <InfoRow label="Lease Start" value={formatDate(tenant?.lease_start_date)} />
          <InfoRow label="Lease End" value={formatDate(tenant?.lease_end_date)} />
        </SectionCard>

        {/* OCCUPANTS */}
        <SectionCard title="OCCUPANTS & PETS" icon="people">
          <InfoRow label="Number of Occupants" value={String(tenant?.number_of_occupants || 1)} />
          <InfoRow label="Has Pets" value={tenant?.has_pets ? "Yes" : "No"} />
          {tenant?.has_pets && tenant?.pet_details && (
            <InfoRow label="Pet Details" value={tenant?.pet_details} />
          )}
        </SectionCard>

        {/* EMERGENCY CONTACT */}
        <SectionCard title="EMERGENCY CONTACT" icon="shield-checkmark">
          <InfoRow label="Name" value={tenant?.emergency_name || "—"} />
          <InfoRow label="Phone" value={tenant?.emergency_phone || "—"} />
          <InfoRow label="Relationship" value={tenant?.emergency_relationship || "—"} />
        </SectionCard>

        {/* NOTES */}
        {tenant?.special_note && (
          <SectionCard title="LANDLORD NOTES" icon="information-circle">
            <Text style={S.noteText}>{tenant.special_note}</Text>
          </SectionCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 1 },
  editBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 3,
    backgroundColor: "transparent", borderWidth: 1, borderColor: C.primary,
  },
  editBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  editBtnText: { fontSize: 11, fontWeight: "600", color: C.primary, fontFamily: F.mono, letterSpacing: 0.5 },
  editBtnTextActive: { color: "#ffffff" },

  scroll: { flex: 1 },
  pad: { padding: 14, gap: 12 },

  // PROFILE HEADER
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(44,62,80,0.1)", borderWidth: 2, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  profileAvatarText: { color: C.primary, fontSize: 22, fontWeight: "700", fontFamily: F.bebas },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", color: C.textPrimary, fontFamily: F.bebas, letterSpacing: 0.5 },
  profileUnit: { fontSize: 12, color: C.textMuted, fontFamily: F.mono, marginTop: 3 },

  // LEASE BANNER
  leaseBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 4, borderWidth: 1,
  },
  leaseBannerText: { flex: 1, fontSize: 12, fontWeight: "500", fontFamily: F.dm },

  // SECTION CARD
  sectionCard: {
    backgroundColor: C.card, borderRadius: 6, borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sectionTitle: {
    fontSize: 10, fontWeight: "700", color: "#888888",
    fontFamily: F.mono, letterSpacing: 2,
  },

  // INFO ROW
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoLabelWrap: { flexDirection: "row", alignItems: "center" },
  infoLabel: { fontSize: 12, color: C.textMuted, fontFamily: F.mono },
  infoValue: { fontSize: 12, fontWeight: "600", color: C.textPrimary, fontFamily: F.dm, textAlign: "right", flex: 1, marginLeft: 12 },

  // SCORE CARD
  scoreCard: { padding: 14 },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3,
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  scoreValue: { fontSize: 20, fontWeight: "700", fontFamily: F.bebas, letterSpacing: 1 },
  scoreLabel: { fontSize: 11, fontWeight: "600", fontFamily: F.mono, textTransform: "uppercase", letterSpacing: 1 },

  barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  barLabel: { width: 55, fontSize: 10, color: C.textMuted, fontFamily: F.mono, textAlign: "right" },
  barTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.06)", overflow: "hidden" },
  barFill: { height: 4, borderRadius: 2 },
  barValue: { width: 24, fontSize: 10, fontWeight: "600", color: C.textPrimary, fontFamily: F.mono, textAlign: "center" },

  // NOTE
  noteText: { fontSize: 12, color: C.textSecondary, fontFamily: F.dm, lineHeight: 19, padding: 12 },
});