import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Alert } from "react-native";
import api from "./api";

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldVibrate: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("Permission Required", "Enable notifications in Settings.");
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    console.log("Push Token:", token);

    // Send token to backend
    try {
      await api.post("/auth/push-token", {
        token: token,
        platform: Platform.OS,
      });
      console.log("Token registered with backend");
    } catch (err) {
      console.log("Could not register token with backend:", err.message);
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E8A012",
      });
    }

    return token;
  } catch (error) {
    console.log("Push token error:", error.message);
    return null;
  }
}

export function addNotificationListeners(navigationRef) {
  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    console.log("Notification tapped:", data);

    if (navigationRef?.current) {
      if (data?.type?.includes("payment")) {
        navigationRef.current.navigate("Payments");
      } else if (data?.type?.includes("maintenance")) {
        navigationRef.current.navigate("Maintenance");
      } else if (data?.type?.includes("message")) {
        navigationRef.current.navigate("Messages");
      } else if (data?.type?.includes("complaint")) {
        navigationRef.current.navigate("Complaints");
      }
    }
  });

  return () => responseSub.remove();
}