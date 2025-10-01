import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import axios from "axios";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (!Device.isDevice) {
      Alert.alert("Push notifications require a physical device");
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    const projectId = "9d9a3b64-7f39-49ab-9996-d2a4a39523bc";

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoToken = tokenData?.data;
    console.log("[Push] Expo token:", expoToken);
    if (!expoToken) {
      Alert.alert("Push setup error", "Got empty Expo token");
      return;
    }
    return expoToken;
  } catch (e) {
    console.error("Failed to get Expo push token:", e?.message || e);
    Alert.alert("Push setup error", String(e?.message || e));
    return;
  }
}

export async function sendFCMTokenToServer({
  userId,
  authToken,
  expoPushToken,
}) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    const msg = "EXPO_PUBLIC_API_URL is missing. Set it in eas.json build.env.";
    console.error(msg);
    Alert.alert("Config error", msg);
    return;
  }

  try {
    console.log("[Push] Sending token ->", `${baseUrl}/user/fcm?id=${userId}`);
    const res = await axios.put(
      `${baseUrl}/user/fcm?id=${userId}`,
      { fcmToken: expoPushToken },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
        validateStatus: () => true, // let us read non-2xx bodies
      }
    );

    if (res.status >= 200 && res.status < 300) {
      console.log("[Push] Token saved OK");
      return true;
    } else {
      console.error("[Push] Save failed", res.status, res.data);
      Alert.alert(
        "Token save failed",
        `HTTP ${res.status}: ${JSON.stringify(res.data)}`
      );
      return false;
    }
  } catch (error) {
    const details = error?.response?.data || error?.message || "unknown";
    console.error("Error sending FCM token to server:", details);
    Alert.alert("Network error", String(details));
    return false;
  }
}
