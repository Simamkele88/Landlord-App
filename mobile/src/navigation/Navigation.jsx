// THIS FILE CONTAINS THE MAIN NAVIGATION STRUCTURE FOR THE APP
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU DO NOT UNDERSTAND THIS CODE, PLEASE ASK ME TO EXPLAIN AND DON'T ASSUME OTHERWISE.

import { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator, DrawerContentScrollView } from "@react-navigation/drawer";
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import TenantPayments from "../screens/Payments";
import TenantDashboard from "../screens/Dashboard";
import { C, tabStyles, headerStyles, drawerStyles } from "./NavStyles";

// PLACEHOLDER SCREENS
function PlaceholderScreen({ route }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#94A3B8", fontSize: 16 }}>{route.name} screen</Text>
    </View>
  );
}

// Use consistent naming 
const TenantMaintenance = PlaceholderScreen;
const TenantComplaints = PlaceholderScreen;
const TenantMessages = PlaceholderScreen;
const TenantNotifications = PlaceholderScreen; 

// MOCK TENANT DATA 
const TENANT = {
  name: "Simamkele Wekeza",
  unit: "Unit 213-B",
  property: "Hillbrow Heights",
  reliabilityScore: "Reliable",
};

function initials(name = "") {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// TAB ICONS CONFIG 
const TAB_ICONS = {
  Home: { active: "home", inactive: "home-outline", library: "Ionicons" },
  Payments: { active: "receipt", inactive: "receipt", library: "MaterialIcons" },
  Notifications: { active: "notifications", inactive: "notifications-outline", library: "Ionicons" }, 
  Maintenance: { active: "build", inactive: "build", library: "MaterialIcons" },
  Messages: { active: "chatbubbles", inactive: "chatbubbles-outline", library: "Ionicons" }
};

// CUSTOM TAB BAR 
function CustomTabBar({ state, descriptors, navigation }) {
  const BADGES = {
    Notifications: 3, 
    Messages: 2,
    Maintenance: 1,
  };

  const visibleRoutes = state.routes.slice(0, 5);

  return (
    <View style={tabStyles.container}>
      {visibleRoutes.map((route, index) => {
        const isFocused = state.index === index;
        const badge = BADGES[route.name] ?? 0;
        const iconConfig = TAB_ICONS[route.name] ?? { 
          active: "help", 
          inactive: "help-outline", 
          library: "MaterialIcons" 
        };

        function onPress() {
          const event = navigation.emit({ 
            type: "tabPress", 
            target: route.key, 
            canPreventDefault: true 
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        const renderIcon = () => {
          const iconName = isFocused ? iconConfig.active : iconConfig.inactive;
          const iconColor = isFocused ? C.primary : C.textMuted;
          const iconSize = 22;

          switch (iconConfig.library) {
            case "Ionicons":
              return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
            case "FontAwesome5":
              return <FontAwesome5 name={iconName} size={iconSize} color={iconColor} />;
            case "MaterialIcons":
            default:
              return <MaterialIcons name={iconName} size={iconSize} color={iconColor} />;
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            onPress={onPress}
            activeOpacity={0.75}
          >
            <View style={tabStyles.iconWrap}>
              {renderIcon()}
              {badge > 0 && (
                <View style={tabStyles.badge}>
                  <Text style={tabStyles.badgeText}>{badge}</Text>
                </View>
              )}
            </View>
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
              {route.name === "Notifications" ? "Alerts" : route.name}
            </Text>
            {isFocused && <View style={tabStyles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// CUSTOM HEADER
function CustomHeader({ navigation, title }) {
  return (
    <SafeAreaView style={headerStyles.safe}>
      <View style={headerStyles.container}>
        <TouchableOpacity
          style={headerStyles.iconBtn}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.8}
        >
          <View style={headerStyles.hamburger}>
            <View style={headerStyles.hamburgerLine} />
            <View style={[headerStyles.hamburgerLine, { width: 16 }]} />
            <View style={headerStyles.hamburgerLine} />
          </View>
        </TouchableOpacity>

        <Text style={headerStyles.title}>{title}</Text>

        <TouchableOpacity
          style={headerStyles.avatarBtn}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.8}
        >
          <View style={headerStyles.avatar}>
            <Text style={headerStyles.avatarText}>{initials(TENANT.name)}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// DRAWER CONTENT 
function DrawerContent({ navigation }) {

  const DRAWER_ITEMS = [
    { label: "Home", icon: "home-outline", iconActive: "home", library: "Ionicons", screen: "Home" },
    { label: "Payments", icon: "receipt", iconActive: "receipt", library: "MaterialIcons", screen: "Payments" },
    { label: "Notifications", icon: "notifications-outline", iconActive: "notifications", library: "Ionicons", screen: "Notifications", badge: 3 },
    { label: "Maintenance", icon: "build", iconActive: "build", library: "MaterialIcons", screen: "Maintenance", badge: 1 },
    { label: "Messages", icon: "chatbubble-outline", iconActive: "chatbubble", library: "Ionicons", screen: "Messages", badge: 2 },
    { label: "Complaints", icon: "flag-outline", iconActive: "flag", library: "Ionicons", screen: "Complaints" },
  ];

  const BOTTOM_ITEMS = [
    { label: "Profile & Lease", icon: "person-outline", iconActive: "person", library: "Ionicons" },
    { label: "Settings", icon: "settings-outline", iconActive: "settings", library: "Ionicons" },
    { label: "Help & Support", icon: "help-circle-outline", iconActive: "help-circle", library: "Ionicons" }
  ];

  function handleLogout() {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            Alert.alert("Logged out", "Token cleared — navigate to Login screen");
          },
        },
      ]
    );
  }

  const navigateToScreen = (screenName) => {
    navigation.closeDrawer();
    navigation.navigate("Tabs", {
      screen: screenName,
    });
  };

  const renderDrawerIcon = (iconName, library, isActive = false) => {
    const iconColor = isActive ? C.primary : C.textSecondary;
    const iconSize = 22;

    switch (library) {
      case "Ionicons":
        return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
      case "FontAwesome5":
        return <FontAwesome5 name={iconName} size={iconSize - 2} color={iconColor} />;
      case "MaterialIcons":
      default:
        return <MaterialIcons name={iconName} size={iconSize} color={iconColor} />;
    }
  };

  return (
    <View style={drawerStyles.root}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={drawerStyles.profileSection}>
        <View style={drawerStyles.profileAvatar}>
          <Text style={drawerStyles.profileAvatarText}>{initials(TENANT.name)}</Text>
        </View>
        <Text style={drawerStyles.profileName}>{TENANT.name}</Text>
        <Text style={drawerStyles.profileUnit}>{TENANT.unit} · {TENANT.property}</Text>    
      </SafeAreaView>

      <ScrollView style={drawerStyles.navScroll} showsVerticalScrollIndicator={false}>
        <Text style={drawerStyles.navGroupLabel}>Navigation</Text>

        {DRAWER_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={drawerStyles.navItem}
            onPress={() => navigateToScreen(item.screen)}
            activeOpacity={0.75}
          >
            <View style={drawerStyles.navIconContainer}>
              {renderDrawerIcon(item.icon, item.library)}
            </View>
            <Text style={drawerStyles.navLabel}>{item.label}</Text>
            {item.badge > 0 && (
              <View style={drawerStyles.navBadge}>
                <Text style={drawerStyles.navBadgeText}>{item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={drawerStyles.divider} />
        <Text style={drawerStyles.navGroupLabel}>Account</Text>

        {BOTTOM_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={drawerStyles.navItem}
            onPress={() => {
              navigation.closeDrawer();
              Alert.alert(item.label, "This screen is coming soon.");
            }}
            activeOpacity={0.75}
          >
            <View style={drawerStyles.navIconContainer}>
              {renderDrawerIcon(item.icon, item.library)}
            </View>
            <Text style={drawerStyles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SafeAreaView style={drawerStyles.logoutSection}>
        <TouchableOpacity style={drawerStyles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color={C.danger} />
          <Text style={drawerStyles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <Text style={drawerStyles.version}>Chihwa Rentals @ {new Date().getFullYear()}</Text>
      </SafeAreaView>
    </View>
  );
}

// TAB NAVIGATOR 
const Tab = createBottomTabNavigator();

function TenantTabs({ navigation }) {
  const SCREENS = [
    { name: "Home", component: TenantDashboard, title: "Dashboard" },
    { name: "Payments", component: TenantPayments, title: "Payments" },
    { name: "Notifications", component: TenantNotifications, title: "Notifications" }, 
    { name: "Maintenance", component: TenantMaintenance, title: "Maintenance" },
    { name: "Messages", component: TenantMessages, title: "Messages" },
  ];

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        header: ({ navigation, route }) => (
          <CustomHeader 
            navigation={navigation} 
            title={route.name === "Home" ? "Chihwa Rentals" : route.name} 
          />
        ),
      }}
    >
      {SCREENS.map(s => (
        <Tab.Screen key={s.name} name={s.name} component={s.component} />
      ))}
    </Tab.Navigator>
  );
}

// DRAWER NAVIGATOR 
const Drawer = createDrawerNavigator();

function TenantDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={props => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        drawerStyle: {
          backgroundColor: C.bg,
          width: 300,
        },
        overlayColor: "rgba(0,0,0,0.6)",
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="Tabs" component={TenantTabs} />
    </Drawer.Navigator>
  );
}

export default function TenantNavigation() {
  return <TenantDrawer />;
}