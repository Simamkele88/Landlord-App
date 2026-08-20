import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Alert, ScrollView, Platform, StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import TenantDashboard    from "../screens/Dashboard";
import TenantPayments     from "../screens/payments/Payments";
import TenantMaintenance  from "../screens/maintenance/Maintenance";
import Complaints         from "../screens/complaints/Complaints";
import Notifications      from "../screens/notifications/Notifications";
import MessagesScreen     from "../screens/messages/Messages";
import Profile            from "../screens/profile/Profile";
import Settings           from "../screens/settings/Settings";
import PaymentInvoice     from "../screens/payments/InvoiceList";
import PaymentReceipt     from "../screens/payments/PaymentReceipt";
import RepaymentPlan      from "../screens/payments/RepaymentPlan";
import RequestRepaymentPlan from "../screens/payments/RequestRepaymentPlan";
import CollectionsStatus  from "../screens/payments/CollectionsStatus";
import DepositStatus from "../screens/payments/DepositStatus";
import api                from "../utils/api";
import { C, F, tabStyles, headerStyles, drawerStyles, sharedStyles } from "../styles/theme"; 

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const PaymentsStackNav = createStackNavigator();
function PaymentsStack() {
  return (
    <PaymentsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <PaymentsStackNav.Screen name="PaymentsHome" component={TenantPayments} />
      <PaymentsStackNav.Screen name="PaymentInvoice" component={PaymentInvoice} />
      <PaymentsStackNav.Screen name="PaymentReceipt" component={PaymentReceipt} />
      <PaymentsStackNav.Screen name="DepositStatus" component={DepositStatus} />
      <PaymentsStackNav.Screen name="RepaymentPlan" component={RepaymentPlan} />
      <PaymentsStackNav.Screen name="RequestRepaymentPlan" component={RequestRepaymentPlan} />
      <PaymentsStackNav.Screen name="CollectionsStatus" component={CollectionsStatus} />
    </PaymentsStackNav.Navigator>
  );
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
    { label: "My Invoices",       icon: "receipt",        screen: "PaymentInvoice" },
    { label: "Deposit Status",    icon: "lock",            screen: "DepositStatus" },
    { label: "Payment History",   icon: "history",         screen: "PaymentReceipt" },
    { label: "Repayment Plan",    icon: "calendar-today",  screen: "RepaymentPlan" },
    ...(inCollections ? [{ label: "Account Status", icon: "warning", screen: "CollectionsStatus", alert: true }] : []),
  ];

  function nav(screen) {
    onClose();
    if (!tabNavigation) return;
    tabNavigation.navigate(screen);
  }

  function navPaymentSub(screen) {
    onClose();
    if (!tabNavigation) return;
    tabNavigation.navigate("Payments", { screen });
  }

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={local.overlay}>
        <TouchableOpacity style={local.overlayBg} onPress={onClose} activeOpacity={1} />
        <View style={local.drawer}>
          <SafeAreaView style={drawerStyles.root} edges={['top', 'bottom']}>

            <View style={drawerStyles.profileSection}>
              <View style={drawerStyles.profileAvatar}>
                <Text style={drawerStyles.profileAvatarText}>
                  {tenant ? initials(`${tenant.first_name} ${tenant.last_name}`) : "—"}
                </Text>
              </View>
              <Text style={drawerStyles.profileName}>
                {tenant ? `${tenant.first_name} ${tenant.last_name}` : "Loading..."}
              </Text>
              <Text style={drawerStyles.profileUnit}>
                {tenant?.unit_number ? `Unit ${tenant.unit_number} · ${tenant.property_name || ""}` : "Tenant"}
              </Text>
              {inCollections && (
                <View style={[sharedStyles.pill, local.collectionsPill]}>
                  <MaterialIcons name="warning" size={11} color={C.red} />
                  <Text style={[sharedStyles.pillText, { color: C.red }]}>Account in collections</Text>
                </View>
              )}
            </View>

            <ScrollView style={drawerStyles.navScroll} showsVerticalScrollIndicator={false}>

              <Text style={drawerStyles.navGroupLabel}>Navigation</Text>
              {mainItems.map(item => (
                <TouchableOpacity key={item.label} style={drawerStyles.navItem} onPress={() => nav(item.screen)} activeOpacity={0.7}>
                  <View style={drawerStyles.navIconContainer}>
                    <MaterialIcons name={item.icon} size={20} color={C.textMuted} />
                  </View>
                  <Text style={drawerStyles.navLabel}>{item.label}</Text>
                  {item.badge > 0 && (
                    <View style={drawerStyles.navBadge}>
                      <Text style={drawerStyles.navBadgeText}>{item.badge > 99 ? "99+" : item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              <View style={drawerStyles.divider} />
              <Text style={drawerStyles.navGroupLabel}>Payments</Text>
              {paymentItems.map(item => (
                <TouchableOpacity key={item.label} style={drawerStyles.navItem} onPress={() => navPaymentSub(item.screen)} activeOpacity={0.7}>
                  <View style={drawerStyles.navIconContainer}>
                    <MaterialIcons
                      name={item.icon}
                      size={20}
                      color={item.alert ? C.red : C.textMuted}
                    />
                  </View>
                  <Text style={[drawerStyles.navLabel, item.alert && { color: C.red }]}>{item.label}</Text>
                  {item.alert && (
                    <View style={[drawerStyles.navBadge, { backgroundColor: C.red }]}>
                      <Text style={[drawerStyles.navBadgeText, { color: "#fff" }]}>!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              <View style={drawerStyles.divider} />
              <Text style={drawerStyles.navGroupLabel}>Account</Text>
              <TouchableOpacity style={drawerStyles.navItem} onPress={() => { onClose(); tabNavigation?.navigate("Profile"); }} activeOpacity={0.7}>
                <View style={drawerStyles.navIconContainer}>
                  <MaterialIcons name="person-outline" size={20} color={C.textMuted} />
                </View>
                <Text style={drawerStyles.navLabel}>Profile & Lease</Text>
              </TouchableOpacity>
              <TouchableOpacity style={drawerStyles.navItem} onPress={() => { onClose(); tabNavigation?.navigate("Settings"); }} activeOpacity={0.7}>
                <View style={drawerStyles.navIconContainer}>
                  <MaterialIcons name="settings" size={20} color={C.textMuted} />
                </View>
                <Text style={drawerStyles.navLabel}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={drawerStyles.navItem} onPress={() => Alert.alert("Help & Support", "Coming soon")} activeOpacity={0.7}>
                <View style={drawerStyles.navIconContainer}>
                  <MaterialIcons name="help-outline" size={20} color={C.textMuted} />
                </View>
                <Text style={drawerStyles.navLabel}>Help & Support</Text>
              </TouchableOpacity>

            </ScrollView>

            <View style={drawerStyles.logoutSection}>
              <TouchableOpacity style={drawerStyles.logoutBtn} onPress={() => { onClose(); if (onLogout) onLogout(); }} activeOpacity={0.8}>
                <MaterialIcons name="logout" size={18} color={C.red} style={local.logoutIcon} />
                <Text style={drawerStyles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>

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
    <SafeAreaView style={headerStyles.safe} edges={['top']}>
      <View style={headerStyles.container}>
        <TouchableOpacity onPress={onOpenDrawer} activeOpacity={0.8}>
          <View style={headerStyles.hamburger}>
            <View style={headerStyles.hamburgerLine} />
            <View style={[headerStyles.hamburgerLine, { width: 16 }]} />
            <View style={headerStyles.hamburgerLine} />
          </View>
        </TouchableOpacity>
        <Text style={headerStyles.title}>{title}</Text>
        <TouchableOpacity onPress={onOpenDrawer} activeOpacity={0.8} style={headerStyles.avatarBtn}>
          <View style={headerStyles.avatar}>
            <Text style={headerStyles.avatarText}>
              {tenant ? initials(`${tenant.first_name} ${tenant.last_name}`) : "—"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const TAB_ICONS = {
  Home:        { lib: Ionicons, name: "home" },
  Payments:    { lib: MaterialIcons, name: "payment" },
  Alerts:      { lib: Ionicons, name: "notifications" },
  Maintenance: { lib: MaterialIcons, name: "build" },
  Complaints:  { lib: MaterialIcons, name: "flag" },
  Messages:    { lib: Ionicons, name: "chatbubbles" },
};

function CustomTabBar({ state, descriptors, navigation, unreadMessages, unreadNotifications }) {
  return (
    <View style={tabStyles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconDef = TAB_ICONS[route.name];
        if (!iconDef) return null; 
        const IconComp = iconDef.lib;

        const badgeCount =
          route.name === "Alerts"   ? unreadNotifications :
          route.name === "Messages" ? unreadMessages :
          0;

        function onPress() {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={tabStyles.iconWrap}>
              <IconComp
                name={iconDef.name}
                style={[tabStyles.icon, isFocused && tabStyles.iconActive]}
              />
              {badgeCount > 0 && (
                <View style={tabStyles.badge}>
                  <Text style={tabStyles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text>
                </View>
              )}
            </View>
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>{route.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function TenantNavigation({ onLogout }) {
  const [drawerOpen, setDrawerOpen]             = useState(false);
  const [unreadMessages, setUnreadMessages]     = useState(0);
  const [unreadNotifications, setUnreadNotifs]  = useState(0);
  const [inCollections, setInCollections]       = useState(false);
  const tabNavRef = useRef(null);

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
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <Tab.Navigator
          tabBar={(props) => {
            if (!tabNavRef.current) tabNavRef.current = props.navigation;
            return (
              <CustomTabBar
                {...props}
                unreadMessages={unreadMessages}
                unreadNotifications={unreadNotifications}
              />
            );
          }}
          screenOptions={({ route }) => ({
            header: () => (
              <CustomHeader
                title={route.name === "Home" ? "Chihwa Rentals" : route.name}
                onOpenDrawer={() => { setDrawerOpen(true); fetchBadgeCounts(); }}
              />
            ),
          })}
        >
          <Tab.Screen name="Home"        component={TenantDashboard} />
          <Tab.Screen name="Payments"    component={PaymentsStack} />
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

const local = StyleSheet.create({
  overlay:   { flex: 1, flexDirection: "row" },
  overlayBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  drawer:    { width: 280, backgroundColor: C.card, position: "absolute", left: 0, top: 0, bottom: 0, borderRightWidth: 1, borderRightColor: C.border },
  collectionsPill: { marginTop: 8, backgroundColor: "#fbeaea", borderColor: "#e5bdbd" },
  logoutIcon: { marginRight: 12 },
});