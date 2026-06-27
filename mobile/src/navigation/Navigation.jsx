// THIS FILE CONTAINS THE MAIN NAVIGATION STRUCTURE FOR THE APP 
import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Alert, ScrollView, SafeAreaView, Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import TenantDashboard from "../screens/Dashboard";
import TenantPayments from "../screens/payments/Payments";
import TenantMaintenance from "../screens/maintenance/Maintenance";
import Complaints from "../screens/complaints/Complaints";
import Notifications from "../screens/notifications/Notifications";
import MessagesScreen from "../screens/messages/Messages";
import Profile from "../screens/profile/Profile";
import Settings from "../screens/settings/Settings";
import api from "../utils/api";

export const C = {
  black: "#0a0a0a", muted: "#141414", muted2: "#1a1a1a",
  border: "#2a2a2a", gold: "#E8A012", white: "#F5F0E8",
  blue: "#3A8FD4", greenLight: "#1A7A4A", redLight: "#E05A4A",
  red: "#C0392B", purple: "#8B5CF6",
};

function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }


function DrawerModal({ visible, onClose, onLogout, tabNavigation, unreadMessages, unreadNotifications }) {
  const [tenant, setTenant] = useState(null);

  useEffect(() => { fetchTenantData(); }, []);

  async function fetchTenantData() {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setTenant({ first_name: user.first_name, last_name: user.last_name, unit_number: user.unit_number });
      }
      const tenantData = await api.getTenantProfile();
      setTenant(tenantData);
    } catch (error) { console.error("Failed to fetch tenant:", error); }
  }

  const menuItems = [
    { label: "Home", icon: "home", screen: "Home" },
    { label: "Payments", icon: "payment", screen: "Payments" },
    { label: "Alerts", icon: "notifications", screen: "Alerts", badge: unreadNotifications },
    { label: "Maintenance", icon: "build", screen: "Maintenance" },
    { label: "Complaints", icon: "flag", screen: "Complaints" },
    { label: "Messages", icon: "chat", screen: "Messages", badge: unreadMessages },
  ];

  function handleLogout() { onClose(); if (onLogout) onLogout(); }
  function handleNavigate(screen) { onClose(); if (tabNavigation) tabNavigation.navigate(screen); }

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={drawerStyles.overlay}>
        <TouchableOpacity style={drawerStyles.overlayBg} onPress={onClose} activeOpacity={1} />
        <View style={drawerStyles.drawer}>
          <SafeAreaView style={drawerStyles.safe}>
            <View style={drawerStyles.profile}>
              <View style={drawerStyles.profileAvatar}><Text style={drawerStyles.profileAvatarText}>{tenant ? initials(`${tenant.first_name} ${tenant.last_name}`) : "SW"}</Text></View>
              <Text style={drawerStyles.profileName}>{tenant ? `${tenant.first_name} ${tenant.last_name}` : "Loading..."}</Text>
              <Text style={drawerStyles.profileUnit}>{tenant?.unit_number ? `Unit ${tenant.unit_number} · ${tenant.property_name || ''}` : "Tenant"}</Text>
            </View>
            <ScrollView style={drawerStyles.menu} showsVerticalScrollIndicator={false}>
              <Text style={drawerStyles.menuTitle}>NAVIGATION</Text>
              {menuItems.map((item) => (
                <TouchableOpacity key={item.label} style={drawerStyles.menuItem} onPress={() => handleNavigate(item.screen)}>
                  <MaterialIcons name={item.icon} size={22} color="rgba(245,240,232,0.35)" style={drawerStyles.menuIcon} />
                  <Text style={drawerStyles.menuLabel}>{item.label}</Text>
                  {item.badge > 0 && <View style={drawerStyles.badge}><Text style={drawerStyles.badgeText}>{item.badge > 99 ? "99+" : item.badge}</Text></View>}
                </TouchableOpacity>
              ))}
              <View style={drawerStyles.divider} /><Text style={drawerStyles.menuTitle}>ACCOUNT</Text>
              <TouchableOpacity style={drawerStyles.menuItem} onPress={() => { onClose(); tabNavigation.navigate("Profile"); }}><MaterialIcons name="person-outline" size={22} color="rgba(245,240,232,0.35)" style={drawerStyles.menuIcon} /><Text style={drawerStyles.menuLabel}>Profile & Lease</Text></TouchableOpacity>
              <TouchableOpacity style={drawerStyles.menuItem} onPress={() => { onClose(); tabNavigation.navigate("Settings"); }}><MaterialIcons name="settings" size={22} color="rgba(245,240,232,0.35)" style={drawerStyles.menuIcon} /><Text style={drawerStyles.menuLabel}>Settings</Text></TouchableOpacity>
              <TouchableOpacity style={drawerStyles.menuItem} onPress={() => { onClose(); Alert.alert("Help & Support", "Coming soon"); }}><MaterialIcons name="help-outline" size={22} color="rgba(245,240,232,0.35)" style={drawerStyles.menuIcon} /><Text style={drawerStyles.menuLabel}>Help & Support</Text></TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={drawerStyles.logout} onPress={handleLogout}><MaterialIcons name="logout" size={18} color={C.redLight} style={drawerStyles.menuIcon} /><Text style={drawerStyles.logoutText}>Log Out</Text></TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}


function CustomHeader({ onOpenDrawer, title }) {
  const [tenant, setTenant] = useState(null);
  useEffect(() => { fetchTenantData(); }, []);
  async function fetchTenantData() {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) { const user = JSON.parse(storedUser); setTenant({ first_name: user.first_name, last_name: user.last_name }); }
      const tenantData = await api.getTenantProfile(); setTenant(tenantData);
    } catch (error) { console.error("Failed to fetch tenant:", error); }
  }
  return (
    <View style={headerStyles.safe}>
      <View style={headerStyles.container}>
        <TouchableOpacity onPress={onOpenDrawer} activeOpacity={0.8}><View style={headerStyles.hamburger}><View style={headerStyles.hamburgerLine} /><View style={[headerStyles.hamburgerLine, { width: 16 }]} /><View style={headerStyles.hamburgerLine} /></View></TouchableOpacity>
        <Text style={headerStyles.title}>{title}</Text>
        <TouchableOpacity onPress={onOpenDrawer} activeOpacity={0.8}><View style={headerStyles.avatar}><Text style={headerStyles.avatarText}>{tenant ? initials(`${tenant.first_name} ${tenant.last_name}`) : "SW"}</Text></View></TouchableOpacity>
      </View>
    </View>
  );
}


const Tab = createBottomTabNavigator();

function TenantNavigation({ onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const tabNavRef = useRef(null);

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const notifData = await api.get("/notifications");
      setUnreadNotifications((notifData.notifications || []).filter(n => !n.is_read && !n.read).length);
      const msgData = await api.getConversations();
      setUnreadMessages((msgData.conversations || []).reduce((sum, c) => sum + (c.unread_count || 0), 0));
    } catch (err) {}
  }, []);

  useEffect(() => { fetchBadgeCounts(); const interval = setInterval(fetchBadgeCounts, 30000); return () => clearInterval(interval); }, [fetchBadgeCounts]);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => {
          if (!tabNavRef.current) tabNavRef.current = navigation;
          return {
            header: () => <CustomHeader onOpenDrawer={() => { setDrawerOpen(true); fetchBadgeCounts(); }} title={route.name === "Home" ? "Chihwa Rentals" : route.name} />,
            tabBarIcon: ({ color, size }) => {
              if (route.name === "Home") return <Ionicons name="home" size={size} color={color} />;
              if (route.name === "Payments") return <MaterialIcons name="payment" size={size} color={color} />;
              if (route.name === "Alerts") return <Ionicons name="notifications" size={size} color={color} />;
              if (route.name === "Maintenance") return <MaterialIcons name="build" size={size} color={color} />;
              if (route.name === "Complaints") return <MaterialIcons name="flag" size={size} color={color} />;
              if (route.name === "Messages") return <Ionicons name="chatbubbles" size={size} color={color} />;
            },
            tabBarBadge: route.name === "Alerts" && unreadNotifications > 0 ? unreadNotifications : route.name === "Messages" && unreadMessages > 0 ? unreadMessages : null,
            tabBarBadgeStyle: { backgroundColor: route.name === "Alerts" ? C.redLight : C.gold, color: route.name === "Alerts" ? C.white : C.black, fontSize: 10, fontWeight: "700", fontFamily: "space-mono", minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4 },
            tabBarActiveTintColor: C.gold,
            tabBarInactiveTintColor: "rgba(245,240,232,0.3)",
            tabBarStyle: { backgroundColor: C.muted2, borderTopColor: C.border, borderTopWidth: 1, paddingBottom: Platform.OS === "ios" ? 20 : 10, paddingTop: 8, height: Platform.OS === "ios" ? 80 : 60 },
            tabBarLabelStyle: { fontSize: 10, fontWeight: "600", fontFamily: "space-mono", letterSpacing: 0.5 },
          };
        }}
      >
        <Tab.Screen name="Home" component={TenantDashboard} />
        <Tab.Screen name="Payments" component={TenantPayments} />
        <Tab.Screen name="Alerts" component={Notifications} />
        <Tab.Screen name="Maintenance" component={TenantMaintenance} />
        <Tab.Screen name="Complaints" component={Complaints} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
      </Tab.Navigator>

      <DrawerModal visible={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={onLogout} tabNavigation={tabNavRef.current} unreadMessages={unreadMessages} unreadNotifications={unreadNotifications} />
    </>
  );
}

const headerStyles = StyleSheet.create({
  safe: { backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border, paddingTop: 50 },
  container: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  hamburger: { width: 22, height: 16, justifyContent: "space-between" },
  hamburgerLine: { width: 20, height: 2, backgroundColor: C.white, borderRadius: 1, marginBottom: 3 },
  title: { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: "bebas-neue", letterSpacing: 1.5 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(232,160,18,0.12)", borderWidth: 1.5, borderColor: "rgba(232,160,18,0.25)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: C.gold, fontSize: 12, fontWeight: "700", fontFamily: "bebas-neue" },
});

const drawerStyles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  overlayBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  drawer: { width: 280, backgroundColor: C.black, position: "absolute", left: 0, top: 0, bottom: 0, borderRightWidth: 1, borderRightColor: C.border },
  safe: { flex: 1 },
  profile: { alignItems: "center", padding: 24, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.muted2 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(232,160,18,0.12)", borderWidth: 2, borderColor: "rgba(232,160,18,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  profileAvatarText: { color: C.gold, fontSize: 20, fontWeight: "700", fontFamily: "bebas-neue" },
  profileName: { fontSize: 17, fontWeight: "700", color: C.white, fontFamily: "bebas-neue", letterSpacing: 0.5 },
  profileUnit: { fontSize: 12, color: "rgba(245,240,232,0.4)", marginTop: 4, fontFamily: "space-mono" },
  menu: { flex: 1, padding: 14 },
  menuTitle: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.15)", letterSpacing: 2, fontFamily: "space-mono", marginBottom: 8, marginTop: 8, textTransform: "uppercase" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10, borderRadius: 3, marginBottom: 1 },
  menuIcon: { marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "rgba(245,240,232,0.6)", fontFamily: "dm-sans" },
  badge: { backgroundColor: C.redLight, borderRadius: 8, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: C.white, fontSize: 10, fontWeight: "700", fontFamily: "space-mono" },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 6 },
  logout: { flexDirection: "row", alignItems: "center", padding: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: "rgba(224,90,74,0.04)" },
  logoutText: { fontSize: 14, fontWeight: "700", color: C.redLight, fontFamily: "dm-sans" },
});

export default TenantNavigation;