// THIS FILE CONTAINS THE MAIN NAVIGATION STRUCTURE FOR THE APP
import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Alert, ScrollView,SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import TenantDashboard from "../screens/Dashboard";
import TenantPayments from "../screens/Payments";
import TenantMaintenance from "../screens/Maintenance";
import api from "../utils/api";

// PLACEHOLDER SCREENS
function PaymentsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.placeholderTitle}>Payments</Text>
      <Text style={styles.placeholderSub}>Payment features coming soon</Text>
    </View>
  );
}

function NotificationsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.placeholderTitle}>Alerts</Text>
      <Text style={styles.placeholderSub}>No new notifications</Text>
    </View>
  );
}

function MaintenanceScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.placeholderTitle}>Maintenance</Text>
      <Text style={styles.placeholderSub}>No open requests</Text>
    </View>
  );
}

function MessagesScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.placeholderTitle}>Messages</Text>
      <Text style={styles.placeholderSub}>No new messages</Text>
    </View>
  );
}


function ComplaintsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.placeholderTitle}>Complaints</Text>
      <Text style={styles.placeholderSub}>No complaints filed</Text>
    </View>
  );
}

function initials(name = "") {
    return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  }

// DRAWER MODAL 
function DrawerModal({ visible, onClose, onLogout, tabNavigation }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantData();
  }, []);

  async function fetchTenantData() {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setTenant({
          first_name: user.first_name,
          last_name: user.last_name,
          unit_number: user.unit_number,
        });
      }else{
        navigation.navigate("Login");
      }

      
      const tenantData = await api.getTenantProfile();
      setTenant(tenantData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch tenant:", error);
      setLoading(false);
    }
  }


  const menuItems = [
    { label: "Home", icon: "home", screen: "Home" },
    { label: "Payments", icon: "payment", screen: "Payments" },
    { label: "Alerts", icon: "notifications", screen: "Alerts", badge: 3 },
    { label: "Maintenance", icon: "build", screen: "Maintenance", badge: 1 },
    { label: "Complaints", icon: "flag", screen: "Complaints" },
    { label: "Messages", icon: "chat", screen: "Messages", badge: 2 },
  ];

  function handleLogout() {
    onClose();
    if (onLogout) {
      onLogout();
    }
  }

  function handleNavigate(screen) {
    onClose();
    if (tabNavigation) {
      tabNavigation.navigate(screen);
    }
  }

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={drawerStyles.overlay}>
        <TouchableOpacity style={drawerStyles.overlayBg} onPress={onClose} activeOpacity={1} />
        <View style={drawerStyles.drawer}>
          <SafeAreaView style={drawerStyles.safe}>
            <View style={drawerStyles.profile}>
              <View style={drawerStyles.profileAvatar}>
                <Text style={drawerStyles.profileAvatarText}>
                  {tenant ? initials(`${tenant.first_name} ${tenant.last_name}`) : "SW"}
                </Text>
              </View>
              <Text style={drawerStyles.profileName}>
                {tenant ? `${tenant.first_name} ${tenant.last_name}` : "Loading..."}
              </Text>
              <Text style={drawerStyles.profileUnit}>
                {tenant?.unit_number 
                  ? `Unit ${tenant.unit_number} · ${tenant.property_name || ''}` 
                  : "Tenant"}
              </Text>
            </View>

            {/* MENU */}
            <ScrollView style={drawerStyles.menu} showsVerticalScrollIndicator={false}>
              <Text style={drawerStyles.menuTitle}>NAVIGATION</Text>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={drawerStyles.menuItem}
                  onPress={() => handleNavigate(item.screen)}
                >
                  <MaterialIcons name={item.icon} size={22} color="#94A3B8" style={drawerStyles.menuIcon} />
                  <Text style={drawerStyles.menuLabel}>{item.label}</Text>
                  {item.badge && (
                    <View style={drawerStyles.badge}>
                      <Text style={drawerStyles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              <View style={drawerStyles.divider} />
              <Text style={drawerStyles.menuTitle}>ACCOUNT</Text>

              <TouchableOpacity
                style={drawerStyles.menuItem}
                onPress={() => { onClose(); Alert.alert("Profile & Lease", "Coming soon"); }}
              >
                <MaterialIcons name="person-outline" size={22} color="#94A3B8" style={drawerStyles.menuIcon} />
                <Text style={drawerStyles.menuLabel}>Profile & Lease</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={drawerStyles.menuItem}
                onPress={() => { onClose(); Alert.alert("Settings", "Coming soon"); }}
              >
                <MaterialIcons name="settings" size={22} color="#94A3B8" style={drawerStyles.menuIcon} />
                <Text style={drawerStyles.menuLabel}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={drawerStyles.menuItem}
                onPress={() => { onClose(); Alert.alert("Help & Support", "Coming soon"); }}
              >
                <MaterialIcons name="help-outline" size={22} color="#94A3B8" style={drawerStyles.menuIcon} />
                <Text style={drawerStyles.menuLabel}>Help & Support</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* LOGOUT BUTTON */}
            <TouchableOpacity style={drawerStyles.logout} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="#EF4444" style={drawerStyles.menuIcon} />
              <Text style={drawerStyles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

// CUSTOM HEADER 
function CustomHeader({ onOpenDrawer, title }) {
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    fetchTenantData();
  }, []);

  async function fetchTenantData() {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setTenant({
          first_name: user.first_name,
          last_name: user.last_name,
        });
      }

      const tenantData = await api.getTenantProfile();
      setTenant(tenantData);
    } catch (error) {
      console.error("Failed to fetch tenant:", error);
    }
  }

  return (
    <View style={headerStyles.safe}>
      <View style={headerStyles.container}>
        <TouchableOpacity onPress={onOpenDrawer} activeOpacity={0.8}>
          <View style={headerStyles.hamburger}>
            <View style={headerStyles.hamburgerLine} />
            <View style={[headerStyles.hamburgerLine, { width: 16 }]} />
            <View style={headerStyles.hamburgerLine} />
          </View>
        </TouchableOpacity>
        <Text style={headerStyles.title}>{title}</Text>
        <TouchableOpacity onPress={onOpenDrawer} activeOpacity={0.8}>
          <View style={headerStyles.avatar}>
            <Text style={headerStyles.avatarText}>
              {tenant ? initials(`${tenant.first_name} ${tenant.last_name}`) : "SW"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}


// TAB NAVIGATOR SETUP
const Tab = createBottomTabNavigator();

function TenantNavigation({ onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tabNavRef = useRef(null);

  function handleNavigate(screen) {
    const screenMap = {
      "Home": "Home",
      "Payments": "Payments",
      "Alerts": "Alerts",
      "Maintenance": "Maintenance",
      "Complaints": "Complaints",
      "Messages": "Messages",
    };

  }

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => {
          
          if (!tabNavRef.current) {
            tabNavRef.current = navigation;
          }
          
          return {
            header: () => (
              <CustomHeader
                onOpenDrawer={() => setDrawerOpen(true)}
                title={route.name === "Home" ? "Chihwa Rentals" : route.name}
              />
            ),
            tabBarIcon: ({ color, size }) => {
              if (route.name === "Home") return <Ionicons name="home" size={size} color={color} />;
              if (route.name === "Payments") return <MaterialIcons name="payment" size={size} color={color} />;
              if (route.name === "Alerts") return <Ionicons name="notifications" size={size} color={color} />;
              if (route.name === "Maintenance") return <MaterialIcons name="build" size={size} color={color} />;
              if (route.name === "Complaints") return <MaterialIcons name="flag" size={size} color={color} />;
              if (route.name === "Messages") return <Ionicons name="chatbubbles" size={size} color={color} />;
            },
            tabBarActiveTintColor: "#3B82F6",
            tabBarInactiveTintColor: "#64748B",
            tabBarStyle: {
              backgroundColor: "#1E293B",
              borderTopColor: "#334155",
              paddingBottom: 8,
              paddingTop: 8,
              height: 60,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          };
        }}
      >
        <Tab.Screen name="Home" component={TenantDashboard} />
        <Tab.Screen name="Payments" component={TenantPayments} />
        <Tab.Screen name="Alerts" component={NotificationsScreen} />
        <Tab.Screen name="Complaints" component={ComplaintsScreen} />
        <Tab.Screen name="Maintenance" component={TenantMaintenance} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
      </Tab.Navigator>

      <DrawerModal
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={onLogout}
        tabNavigation={tabNavRef.current} 
      />
    </>
  );
}


// STYLES
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderTitle: { fontSize: 24, fontWeight: "700", color: "#F1F5F9" },
  placeholderSub: { fontSize: 14, color: "#94A3B8", marginTop: 8 },
});

const headerStyles = StyleSheet.create({
  safe: {
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingTop: 50,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  hamburger: {
    width: 24,
    height: 18,
    justifyContent: "space-between",
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: "#F1F5F9",
    borderRadius: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

const drawerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  overlayBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  drawer: {
    width: 280,
    backgroundColor: "#0F172A",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  safe: {
    flex: 1,
  },
  profile: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#3B82F6",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  profileAvatarText: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  profileName: { fontSize: 18, fontWeight: "700", color: "#F1F5F9" },
  profileUnit: { fontSize: 13, color: "#94A3B8", marginTop: 4 },
  menu: { flex: 1, padding: 16 },
  menuTitle: {
    fontSize: 11, fontWeight: "700", color: "#64748B",
    letterSpacing: 1, marginBottom: 8, marginTop: 8,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 2,
  },
  menuIcon: { marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#F1F5F9" },
  badge: {
    backgroundColor: "#EF4444", borderRadius: 10,
    minWidth: 20, height: 20,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: 8 },
  logout: {
    flexDirection: "row", alignItems: "center",
    padding: 16, borderTopWidth: 1, borderTopColor: "#334155",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#EF4444" },
});

export default TenantNavigation;