// TENANT DASHBOARD SCREEN 
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { styles } from "./DashboardStyles";
import { C, F } from "../styles/theme";

// MOCK DATA
const TENANT = {
  name: "Simamkele Wekeza",
  unit: "Unit 213-B",
  property: "Hillbrow Heights",
  rentAmount: 5800,
  dueDay: 1,
  leaseEnd: "2026-12-31",
  reliabilityScore: "Reliable",
  caretaker: "David Nkosi",
};

const CURRENT_PAYMENT = {
  period: "April 2026",
  amount: 5800,
  status: "Paid",
  dueDate: "2026-04-01",
};

const OPEN_MAINTENANCE = [
  { id: 1, title: "Burst pipe under kitchen sink", status: "In Progress", updatedOn: "2026-04-11" },
];

const UNREAD_NOTIFICATIONS = 3;
const UNREAD_MESSAGES = 2;

// HELPERS
function format(amount) {
  return `R ${Number(amount).toLocaleString("en-ZA")}`;
}
function firstName(fullName) {
  return fullName.split(" ")[0];
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function reliabilityColor(score) {
  if (score === "Reliable") return C.greenLight;
  if (score === "Moderate Risk") return C.gold;
  return C.redLight;
}
function maintenanceStatusColor(status) {
  if (status === "Completed") return C.greenLight;
  if (status === "In Progress") return C.gold;
  return C.redLight;
}
function rentStatusConfig(status) {
  switch (status) {
    case "Paid":
      return { color: C.greenLight, bg: "rgba(26,122,74,0.08)", border: "rgba(76,186,122,0.15)", label: "Paid" };
    case "Pending Approval":
      return { color: C.gold, bg: "rgba(232,160,18,0.06)", border: "rgba(232,160,18,0.12)", label: "Pending Review" };
    case "Late":
      return { color: C.redLight, bg: "rgba(224,90,74,0.08)", border: "rgba(224,90,74,0.15)", label: "Overdue" };
    default:
      return { color: "rgba(245,240,232,0.4)", bg: C.muted2, border: C.border, label: status };
  }
}

function SectionLabel({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function QuickAction({ icon, iconLibrary, label, color, bg, onPress, badge }) {
  const IconComponent =
    iconLibrary === "FontAwesome5" ? FontAwesome5 :
    iconLibrary === "Ionicons" ? Ionicons :
    iconLibrary === "Feather" ? Feather : MaterialIcons;

  return (
    <TouchableOpacity style={[styles.qaCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.qaIconWrap}>
        <IconComponent name={icon} size={20} color={color} />
        {badge > 0 && (
          <View style={styles.qaBadge}>
            <Text style={styles.qaBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.qaLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function TenantDashboard({ navigation }) {
  const days = (() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), TENANT.dueDay);
    if (next < now) next.setMonth(next.getMonth() + 1);
    return Math.ceil((next - now) / 86400000);
  })();

  const rentCfg = rentStatusConfig(CURRENT_PAYMENT.status);
  const isPaid = CURRENT_PAYMENT.status === "Paid";
  const isPending = CURRENT_PAYMENT.status === "Pending Approval";
  const isLate = CURRENT_PAYMENT.status === "Late";

  const renderRentBanner = () => {
    if (isPaid) {
      return (
        <View style={styles.rentBannerContent}>
          <Ionicons name="checkmark-circle" size={15} color={C.greenLight} />
          <Text style={[styles.rentBannerText, { color: C.greenLight }]}>Rent confirmed for this month</Text>
        </View>
      );
    }
    if (isPending) {
      return (
        <View style={styles.rentBannerContent}>
          <MaterialIcons name="pending-actions" size={15} color={C.gold} />
          <Text style={[styles.rentBannerText, { color: C.gold }]}>Awaiting landlord approval</Text>
        </View>
      );
    }
    if (isLate) {
      return (
        <View style={styles.rentBannerContent}>
          <MaterialIcons name="error" size={15} color={C.redLight} />
          <Text style={[styles.rentBannerText, { color: C.redLight }]}>Payment overdue — please pay now</Text>
        </View>
      );
    }
    if (days === 0) {
      return (
        <View style={styles.rentBannerContent}>
          <MaterialIcons name="warning-amber" size={15} color={C.redLight} />
          <Text style={[styles.rentBannerText, { color: C.redLight }]}>Due today!</Text>
        </View>
      );
    }
    if (days === 1) {
      return (
        <View style={styles.rentBannerContent}>
          <Ionicons name="time-outline" size={15} color={C.gold} />
          <Text style={[styles.rentBannerText, { color: C.gold }]}>Due tomorrow</Text>
        </View>
      );
    }
    return (
      <View style={styles.rentBannerContent}>
        <Ionicons name="time-outline" size={15} color="rgba(245,240,232,0.3)" />
        <Text style={[styles.rentBannerText, { color: "rgba(245,240,232,0.4)" }]}>Due in {days} days</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <View style={styles.nameRow}>
              <Text style={styles.tenantName}>{firstName(TENANT.name)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellWrap} onPress={() => navigation.navigate("Alerts")} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color={C.white} />
            {UNREAD_NOTIFICATIONS > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{UNREAD_NOTIFICATIONS}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* UNIT CARD */}
        <View style={styles.unitCard}>
          <View style={styles.unitCardLeft}>
            <Text style={styles.unitCardProperty}>{TENANT.property}</Text>
            <Text style={styles.unitCardUnit}>{TENANT.unit}</Text>
            <Text style={styles.unitCardLease}>Lease until {TENANT.leaseEnd}</Text>
          </View>
          <View style={[styles.scorePill, { borderColor: reliabilityColor(TENANT.reliabilityScore) }]}>
            <Text style={[styles.scoreText, { color: reliabilityColor(TENANT.reliabilityScore) }]}>{TENANT.reliabilityScore}</Text>
          </View>
        </View>

        {/* RENT STATUS CARD */}
        <TouchableOpacity style={styles.rentCard} onPress={() => navigation.navigate("Payments")} activeOpacity={0.85}>
          <View style={styles.rentTop}>
            <View>
              <Text style={styles.rentCardLabel}>{CURRENT_PAYMENT.period} Rent</Text>
              <Text style={styles.rentCardAmount}>{format(CURRENT_PAYMENT.amount)}</Text>
            </View>
            <View style={[styles.rentStatusPill, { backgroundColor: rentCfg.bg, borderColor: rentCfg.border }]}>
              <Text style={[styles.rentStatusText, { color: rentCfg.color }]}>{rentCfg.label}</Text>
            </View>
          </View>
          <View style={[styles.rentBanner, {
            backgroundColor: isPaid ? "rgba(26,122,74,0.06)" : isPending ? "rgba(232,160,18,0.04)" : isLate ? "rgba(224,90,74,0.06)" : days <= 3 ? "rgba(224,90,74,0.04)" : C.muted2,
          }]}>
            {renderRentBanner()}
            <MaterialIcons name="chevron-right" size={18} color="rgba(245,240,232,0.25)" />
          </View>
        </TouchableOpacity>

        {/* ALERT BANNER */}
        {isLate && (
          <View style={styles.alertBanner}>
            <MaterialIcons name="warning" size={15} color={C.redLight} />
            <Text style={styles.alertText}>Your account may be sent to collections if payment is not made urgently.</Text>
          </View>
        )}

        {/* QUICK ACTIONS */}
        <SectionLabel title="QUICK ACTIONS" />
        <View style={styles.qaGrid}>
          <QuickAction icon="credit-card" iconLibrary="FontAwesome5" label="Pay Rent" color={C.black} bg={C.gold} onPress={() => navigation.navigate("Payments")} />
          <QuickAction icon="build" iconLibrary="MaterialIcons" label="Maintenance" color={C.white} bg={C.muted2} onPress={() => navigation.navigate("Maintenance")} badge={OPEN_MAINTENANCE.length} />
          <QuickAction icon="chatbubbles" iconLibrary="Ionicons" label="Messages" color={C.white} bg={C.muted2} onPress={() => navigation.navigate("Messages")} badge={UNREAD_MESSAGES} />
          <QuickAction icon="flag" iconLibrary="MaterialIcons" label="Complaints" color={C.white} bg={C.muted2} onPress={() => navigation.navigate("Complaints")} />
        </View>

        {/* OPEN MAINTENANCE */}
        {OPEN_MAINTENANCE.length > 0 && (
          <>
            <SectionLabel title="OPEN MAINTENANCE" actionLabel="View all" onAction={() => navigation.navigate("Maintenance")} />
            {OPEN_MAINTENANCE.map(item => (
              <TouchableOpacity key={item.id} style={styles.maintenanceCard} onPress={() => navigation.navigate("Maintenance")} activeOpacity={0.8}>
                <View style={styles.maintenanceLeft}>
                  <MaterialIcons name="build" size={18} color={C.gold} />
                </View>
                <View style={styles.maintenanceBody}>
                  <Text style={styles.maintenanceTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.maintenanceMeta}>Updated {item.updatedOn}</Text>
                </View>
                <View style={[styles.maintenanceStatusDot, { backgroundColor: maintenanceStatusColor(item.status) }]} />
                <Text style={[styles.maintenanceStatus, { color: maintenanceStatusColor(item.status) }]}>{item.status}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* CONTACT CARD */}
        <SectionLabel title="NEED HELP?" />
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactAvatarText}>
                {TENANT.caretaker.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{TENANT.caretaker}</Text>
              <Text style={styles.contactRole}>Caretaker · {TENANT.property}</Text>
            </View>
            <TouchableOpacity style={styles.contactBtn} onPress={() => navigation.navigate("Messages")} activeOpacity={0.8}>
              <MaterialIcons name="message" size={14} color={C.black} />
              <Text style={styles.contactBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}