// MAIN APP ENTRY POINT
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useState, useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotifications, addNotificationListeners } from "./src/utils/notifications.js";

import Login from "./src/screens/auth/Login";
import ChangePassword from "./src/screens/auth/ChangePassword";
import CompleteProfile from "./src/screens/auth/CompleteProfile";
import Navigation from "./src/navigation/Navigation";
import ForgotPassword from "./src/screens/auth/ForgotPassword";
import VerifyCode from "./src/screens/auth/VerifyCode";
import ResetPassword from "./src/screens/auth/ResetPassword";
import MaintenanceNew from "./src/screens/maintenance/MaintenanceNew";
import MaintenanceDetail from "./src/screens/maintenance/MaintenanceDetail";
import PaymentMethod from "./src/screens/payments/PaymentMethod";
import PaymentUpload from "./src/screens/payments/PaymentUpload";
import PaymentInvoice from "./src/screens/payments/PaymentInvoice";
import PaymentReceipt from "./src/screens/payments/PaymentReceipt"
import Complaints from "./src/screens/complaints/Complaints";
import ComplaintDetail from "./src/screens/complaints/ComplaintDetail";
import ComplaintNew from "./src/screens/complaints/ComplaintNew";
import Notifications from "./src/screens/notifications/Notifications";
import NotificationDetail from "./src/screens/notifications/NotificationDetail";
import Profile from "./src/screens/profile/Profile";
import Settings from "./src/screens/settings/Settings";


const Stack = createStackNavigator();

export default function App() {``
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const navigationRef = useRef(null);

  useEffect(() => {
    registerForPushNotifications();
    const unsubscribe = addNotificationListeners(navigationRef);

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  async function checkLoginStatus() {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");
      
      if (token && user) {
        setUserData(JSON.parse(user));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogin(token, user) {
    setUserData(user);
    setIsLoggedIn(true);
  }

  async function handleLogout() {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("temp_token");
      await AsyncStorage.removeItem("temp_user");
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
    setUserData(null);
    setIsLoggedIn(false);
  }

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: "#0F172A", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <>
              {/* MAIN APP */}
            <Stack.Screen name="Main">
              {(props) => (
                <Navigation 
                  {...props} 
                  userData={userData}
                  onLogout={handleLogout} 
                />
              )}
            </Stack.Screen>

            {/* CHANGE PASSWORD  */}
            <Stack.Screen name="ChangePassword">
              {(props) => (
                <ChangePassword 
                  {...props} 
                  onPasswordChanged={() => {
                    props.navigation.goBack();
                  }} 
                />
              )}
            </Stack.Screen>

            {/* COMPLETE PROFILE */}
            <Stack.Screen name="CompleteProfile">
              {(props) => (
                <CompleteProfile 
                  {...props} 
                  onProfileComplete={async () => {
                    const storedUser = await AsyncStorage.getItem("user");
                    if (storedUser) {
                      const user = JSON.parse(storedUser);
                      user.profile_complete = true;
                      await AsyncStorage.setItem("user", JSON.stringify(user));
                      setUserData(user);
                    }
                    setIsLoggedIn(true);
                  }} 
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="MaintenanceNew" component={MaintenanceNew} />
            <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetail} />
            <Stack.Screen name="PaymentMethod" component={PaymentMethod} />
            <Stack.Screen name="PaymentUpload" component={PaymentUpload} />
            <Stack.Screen name="PaymentInvoice" component={PaymentInvoice} />
            <Stack.Screen name="PaymentReceipt" component={PaymentReceipt} />
            <Stack.Screen name="Complaints" component={Complaints} />
            <Stack.Screen name="ComplaintDetail" component={ComplaintDetail} />
            <Stack.Screen name="ComplaintNew" component={ComplaintNew} />
            <Stack.Screen name="Notifications" component={Notifications} />
            <Stack.Screen name="NotificationDetail" component={NotificationDetail} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Settings" component={Settings} />
          </>
        ) : (
          <>
            {/* LOGIN SCREEN */}
            <Stack.Screen name="Login">
              {(props) => (
                <Login 
                  {...props} 
                  onLogin={handleLogin} 
                />
              )}
            </Stack.Screen>

            {/* CHANGE PASSWORD  */}
            <Stack.Screen name="ChangePassword">
              {(props) => (
                <ChangePassword 
                  {...props} 
                  onPasswordChanged={async () => {
                    
                    const storedUser = await AsyncStorage.getItem("user");
                    if (storedUser) {
                      const user = JSON.parse(storedUser);
                      if (user.role === "tenant" && !user.profile_complete) {
                        
                        props.navigation.replace("CompleteProfile");
                        return;
                      }
                    }
                    
                    setIsLoggedIn(true);
                  }} 
                />
              )}
            </Stack.Screen>

            {/* COMPLETE PROFILE*/}
            <Stack.Screen name="CompleteProfile">
              {(props) => (
                <CompleteProfile 
                  {...props} 
                  onProfileComplete={async () => {
                    const storedUser = await AsyncStorage.getItem("user");
                    if (storedUser) {
                      const user = JSON.parse(storedUser);
                      user.profile_complete = true;
                      await AsyncStorage.setItem("user", JSON.stringify(user));
                      setUserData(user);
                    }
                    setIsLoggedIn(true);
                  }} 
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="VerifyCode" component={VerifyCode} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  </SafeAreaProvider>
  );
}