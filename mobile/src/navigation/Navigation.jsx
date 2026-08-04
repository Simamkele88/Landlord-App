// TENANT NAVIGATION 
import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Alert, ScrollView, Platform, StatusBar, Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import TenantDashboard    from "../screens/Dashboard";
import TenantPayments     from "../screens/payments/Payments";
import TenantMaintenance  from "../screens/maintenance/Maintenance";
import Complaints         from "../screens/complaints/Complaints";
import Notifications      from "../screens/notifications/Notifications";
import MessagesScreen     from "../screens/messages/Messages";
import Profile            from "../screens/profile/Profile";
import Settings           from "../screens/settings/Settings";
import api                from "../utils/api";

export const C = {
  black: "#0a0a0a", muted: "#141414", muted2: "#1a1a1a",
  border: "#2a2a2a", gold: "#E8A012", white: "#F5F0E8",
  blue: "#3A8FD4", greenLight: "#1A7A4A", redLight: "#E05A4A",
  purple: "#8B5CF6",
};

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}


function DrawerModal({ visible, onClose, onLogout, tabNavigation, unreadMessages, unreadNotifications, inCollections }) {
  const [tenant, setTenant] = useState(null);

  useEffect(() => { fetchTenantData(); }, []);

  async function fetchTenantData() {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setTenant({ first_name: u.first_name, last_name: u.last_name, unit_number: u.unit_number });
      }
      const data = await api.getTenantProfile();
      setTenant(data);
    } catch (err) { console.error("Drawer fetch:", err); }
  }

  const mainItems = [
    { label: "Home",        icon: "home",          screen: "Home" },
    { label: "Payments",    icon: "payment",        screen: "Payments" },
    { label: "Alerts",      icon: "notifications",  screen: "Alerts",      badge: unreadNotifications },
    { label: "Maintenance", icon: "build",          screen: "Maintenance" },
    { label: "Complaints",  icon: "flag",           screen: "Complaints" },
    { label: "Messages",    icon: "chat",           screen: "Messages",    badge: unreadMessages },
  ];

  const paymentItems = [
    { label: "My Invoices",       icon: "receipt",           screen: "PaymentInvoice",        parent: true },
    { label: "Payment History",   icon: "history",           screen: "PaymentReceipt",         parent: true },
    { label: "Repayment Plan",    icon: "calendar-today",    screen: "RepaymentPlan",          parent: true },

    ...(inCollections ? [{ label: "Account Status", icon: "warning", screen: "CollectionsStatus", parent: true, alert: true }] : []),
  ];

  function nav(screen, parent = false) {
    onClose();
    if (!tabNavigation) return;
    if (parent) {
      tabNavigation.navigate(screen);
    } else {
      tabNavigation.navigate(screen);
    }
  }

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={D.overlay}>
        <TouchableOpacity style={D.overlayBg} onPress={onClose} activeOpacity={1} />
        <View style={D.drawer}>
          <SafeAreaView style={D.safe} edges={['top', 'bottom']}>

            {/* Profile block */}
            <View style={D.profile}>
              <View style={D.avatar}>
                <Text style={D.avatarText}>
                  {tenant ? initials(`${tenant.first_name} ${tenant.last_name}`) : "—"}
                </Text>
              </View>
              <Text style={D.profileName}>
                {tenant ? `${tenant.first_name} ${tenant.last_name}` : "Loading..."}
              </Text>
              <Text style={D.profileSub}>
                {tenant?.unit_number ? `Unit ${tenant.unit_number} · ${tenant.property_name || ""}` : "Tenant"}
              </Text>
              {/* Collections warning in profile block */}
              {inCollections && (
                <View style={D.collectionsBadge}>
                  <MaterialIcons name="warning" size={11} color={C.redLight} />
                  <Text style={D.collectionsText}>Account in collections</Text>
                </View>
              )}
            </View>

            <ScrollView style={D.menu} showsVerticalScrollIndicator={false}>

              {/* Main navigation */}
              <Text style={D.menuTitle}>Navigation</Text>
              {mainItems.map(item => (
                <TouchableOpacity key={item.label} style={D.item} onPress={() => nav(item.screen, false)} activeOpacity={0.7}>
                  <MaterialIcons name={item.icon} size={20} color="rgba(245,240,232,0.35)" style={D.icon} />
                  <Text style={D.itemLabel}>{item.label}</Text>
                  {item.badge > 0 && (
                    <View style={D.badge}>
                      <Text style={D.badgeText}>{item.badge > 99 ? "99+" : item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {/* Payments sub-section */}
              <View style={D.divider} />
              <Text style={D.menuTitle}>Payments</Text>
              {paymentItems.map(item => (
                <TouchableOpacity key={item.label} style={D.item} onPress={() => nav(item.screen, item.parent)} activeOpacity={0.7}>
                  <MaterialIcons
                    name={item.icon}
                    size={20}
                    color={item.alert ? C.redLight + "90" : "rgba(245,240,232,0.35)"}
                    style={D.icon}
                  />
                  <Text style={[D.itemLabel, item.alert && { color: C.redLight }]}>{item.label}</Text>
                  {item.alert && (
                    <View style={[D.badge, { backgroundColor: C.redLight }]}>
                      <Text style={[D.badgeText, { color: C.white }]}>!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {/* Account */}
              <View style={D.divider} />
              <Text style={D.menuTitle}>Account</Text>
              <TouchableOpacity style={D.item} onPress={() => { onClose(); tabNavigation?.navigate("Profile"); }} activeOpacity={0.7}>
                <MaterialIcons name="person-outline" size={20} color="rgba(245,240,232,0.35)" style={D.icon} />
                <Text style={D.itemLabel}>Profile & Lease</Text>
              </TouchableOpacity>
              <TouchableOpacity style={D.item} onPress={() => { onClose(); tabNavigation?.navigate("Settings"); }} activeOpacity={0.7}>
                <MaterialIcons name="settings" size={20} color="rgba(245,240,232,0.35)" style={D.icon} />
                <Text style={D.itemLabel}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={D.item} onPress={() => Alert.alert("Help & Support", "Coming soon")} activeOpacity={0.7}>
                <MaterialIcons name="help-outline" size={20} color="rgba(245,240,232,0.35)" style={D.icon} />
                <Text style={D.itemLabel}>Help & Support</Text>
              </TouchableOpacity>

            </ScrollView>

            <TouchableOpacity style={D.logout} onPress={() => { onClose(); if (onLogout) onLogout(); }} activeOpacity={0.8}>
              <MaterialIcons name="logout" size={18} color={C.redLight} style={D.icon} />
              <Text style={D.logoutText}>Log Out</Text>
            </TouchableOpacity>

          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

function CustomHeader({ onOpenDrawer, title }) {
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem("user").then(s => {
      if (s) setTenant(JSON.parse(s));
    });
    api.getTenantProfile().then(setTenant).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={H.safe} edges={['top']}>
      <View style={H.row}>
        <TouchableOpacity onPress={onOpenDrawer} activeOpacity={0.8}>
          <View style={H.hamburger}>
            <View style={H.line} />
            <View style={[H.line, { width: 16 }]} />
            <View style={H.line} />
          </View>
        </TouchableOpacity>
        <Text style={H.title}>{title}</Text>
        <TouchableOpacity onPress={onOpenDrawer} activeOpacity={0.8}>
          <View style={H.avatar}>
            <Text style={H.avatarText}>
              {tenant ? initials(`${tenant.first_name} ${tenant.last_name}`) : "—"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export default function TenantNavigation({ onLogout }) {
  const [drawerOpen, setDrawerOpen]             = useState(false);
  const [unreadMessages, setUnreadMessages]     = useState(0);
  const [unreadNotifications, setUnreadNotifs]  = useState(0);
  const [inCollections, setInCollections]       = useState(false);
  const tabNavRef = useRef(null);
  
  const screenHeight = Dimensions.get('window').height;
  const tabBarHeight = Platform.OS === 'ios' ? 85 : 60;
  const bottomInset = Platform.OS === 'android' ? 0 : 0;

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const [notifData, msgData, collData] = await Promise.all([
        api.get("/notifications/unread-count"),
        api.getConversations(),
        api.get("/collections/me").catch(() => ({ in_collections: false })),
      ]);

      setUnreadNotifs(notifData.count || 0);
      setUnreadMessages(
        (msgData.conversations || []).reduce((sum, c) => sum + (c.unread_count || 0), 0)
      );
      setInCollections(collData.in_collections || false);
    } catch {}
  }, []);

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchBadgeCounts]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <View style={{ flex: 1, backgroundColor: C.muted2 }}>
        <Tab.Navigator
          screenOptions={({ route, navigation }) => {
            if (!tabNavRef.current) tabNavRef.current = navigation;
            return {
              header: () => (
                <CustomHeader
                  title={route.name === "Home" ? "Chihwa Rentals" : route.name}
                  onOpenDrawer={() => { setDrawerOpen(true); fetchBadgeCounts(); }}
                />
              ),
              tabBarIcon: ({ color, size }) => {
                const icons = {
                  Home:        <Ionicons name="home" size={size} color={color} />,
                  Payments:    <MaterialIcons name="payment" size={size} color={color} />,
                  Alerts:      <Ionicons name="notifications" size={size} color={color} />,
                  Maintenance: <MaterialIcons name="build" size={size} color={color} />,
                  Complaints:  <MaterialIcons name="flag" size={size} color={color} />,
                  Messages:    <Ionicons name="chatbubbles" size={size} color={color} />,
                };
                return icons[route.name] || null;
              },
              tabBarBadge:
                route.name === "Alerts"   && unreadNotifications > 0 ? unreadNotifications :
                route.name === "Messages" && unreadMessages > 0      ? unreadMessages :
                null,
              tabBarBadgeStyle: {
                backgroundColor: route.name === "Alerts" ? C.redLight : C.gold,
                color:           route.name === "Alerts" ? C.white    : C.black,
                fontSize: 10, fontWeight: "700", minWidth: 18, height: 18,
                borderRadius: 9, paddingHorizontal: 4,
                marginTop: Platform.OS === 'ios' ? 0 : 4,
              },
              tabBarActiveTintColor:   C.gold,
              tabBarInactiveTintColor: "rgba(245,240,232,0.3)",
              tabBarStyle: {
                backgroundColor: C.muted2,
                borderTopColor:  C.border,
                borderTopWidth:  1,
                height: tabBarHeight,
                paddingBottom: Platform.OS === 'ios' ? 20 : 0,
                paddingTop: Platform.OS === 'ios' ? 8 : 4,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                elevation: 0,
                shadowOpacity: 0,
              },
              tabBarLabelStyle: {
                fontSize: 10, 
                fontWeight: "600",
                fontFamily: "space-mono", 
                letterSpacing: 0.5,
                paddingBottom: Platform.OS === 'ios' ? 0 : 4,
                marginBottom: Platform.OS === 'ios' ? 0 : 0,
              },
              contentStyle: {
                paddingBottom: tabBarHeight,
                backgroundColor: C.black,
              },
            };
          }}
        >
          <Tab.Screen name="Home"        component={TenantDashboard} />
          <Tab.Screen name="Payments"    component={TenantPayments} />
          <Tab.Screen name="Alerts"      component={Notifications} />
          <Tab.Screen name="Maintenance" component={TenantMaintenance} />
          <Tab.Screen name="Complaints"  component={Complaints} />
          <Tab.Screen name="Messages"    component={MessagesScreen} />
        </Tab.Navigator>
      </View>

      <DrawerModal
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={onLogout}
        tabNavigation={tabNavRef.current}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        inCollections={inCollections}
      />
    </>
  );
}

const H = StyleSheet.create({
  safe:     { backgroundColor: C.muted2, borderBottomWidth: 1, borderBottomColor: C.border },
  row:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, paddingTop: Platform.OS === "ios" ? 4 : 10 },
  hamburger:{ width: 22, height: 16, justifyContent: "space-between" },
  line:     { width: 20, height: 2, backgroundColor: C.white, borderRadius: 1 },
  title:    { fontSize: 16, fontWeight: "700", color: C.white, fontFamily: "bebas-neue", letterSpacing: 1.5 },
  avatar:   { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(232,160,18,0.12)", borderWidth: 1.5, borderColor: "rgba(232,160,18,0.25)", alignItems: "center", justifyContent: "center" },
  avatarText:{ color: C.gold, fontSize: 12, fontWeight: "700", fontFamily: "bebas-neue" },
});

const D = StyleSheet.create({
  overlay:   { flex: 1, flexDirection: "row" },
  overlayBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  drawer:    { width: 280, backgroundColor: C.black, position: "absolute", left: 0, top: 0, bottom: 0, borderRightWidth: 1, borderRightColor: C.border },
  safe:      { flex: 1 },
  profile:   { alignItems: "center", padding: 24, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.muted2 },
  avatar:    { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(232,160,18,0.12)", borderWidth: 2, borderColor: "rgba(232,160,18,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText:{ color: C.gold, fontSize: 20, fontWeight: "700", fontFamily: "bebas-neue" },
  profileName:{ fontSize: 17, fontWeight: "700", color: C.white, fontFamily: "bebas-neue", letterSpacing: 0.5 },
  profileSub: { fontSize: 12, color: "rgba(245,240,232,0.4)", marginTop: 4, fontFamily: "space-mono" },
  collectionsBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, backgroundColor: "rgba(224,90,74,0.08)", borderWidth: 1, borderColor: "rgba(224,90,74,0.2)", borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 },
  collectionsText:  { fontSize: 10, color: C.redLight, fontFamily: "space-mono", letterSpacing: 0.5 },
  menu:      { flex: 1, padding: 14 },
  menuTitle: { fontSize: 10, fontWeight: "700", color: "rgba(245,240,232,0.15)", letterSpacing: 2, fontFamily: "space-mono", marginBottom: 6, marginTop: 10, textTransform: "uppercase" },
  item:      { flexDirection: "row", alignItems: "center", paddingVertical: 11, paddingHorizontal: 10, borderRadius: 3, marginBottom: 1 },
  icon:      { marginRight: 12 },
  itemLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "rgba(245,240,232,0.6)", fontFamily: "dm-sans" },
  badge:     { backgroundColor: C.redLight, borderRadius: 8, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: C.white, fontSize: 10, fontWeight: "700", fontFamily: "space-mono" },
  divider:   { height: 1, backgroundColor: C.border, marginVertical: 6 },
  logout:    { flexDirection: "row", alignItems: "center", padding: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: "rgba(224,90,74,0.04)" },
  logoutText:{ fontSize: 14, fontWeight: "700", color: C.redLight, fontFamily: "dm-sans" },
});