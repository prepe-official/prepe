import React, { useEffect, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Modal,
  View,
  Text,
  Pressable,
  BackHandler,
} from "react-native";
import * as Notifications from "expo-notifications";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { useNavigationContainerRef } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";

// Screens
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import SignupScreenStep2 from "./screens/SignupScreenStep2";
import IntroScreen from "./screens/IntroScreen";
import CitySelectionScreen from "./screens/CitySelectionScreen";
import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import CalendarScreen from "./screens/CalendarScreen";
import DashboardScreen from "./screens/DashboardScreen";
import NotificationScreen from "./screens/NotificationScreen";
import WalletScreen from "./screens/WalletScreen";
import RechargeScreen from "./screens/RechargeScreen";
import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";
import TransactionDetailScreen from "./screens/TransactionDetailScreen";
import BottomBar from "./components/BottomBar";
import SubscriptionsScreen from "./screens/SubscriptionsScreen";
import AccountSettingsScreen from "./screens/AccountSettingsScreen";
import CustomerSupportScreen from "./screens/CustomerSupportScreen";
import PaymentWebViewScreen from "./screens/PaymentWebViewScreen";
import ForgotPasswordScreen from "./screens/ForgetScreen";
import SignupScreenStep3 from "./screens/SignupScreenStep3";
import SignupScreenStep4 from "./screens/SignupScreenStep4";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const navigationRef = useNavigationContainerRef();

  const checkPermission = async () => {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      setShowPermissionModal(true);
    }
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Please enable notifications in Settings.");
    }
    setShowPermissionModal(false);
  };

  // Network connectivity check
  const checkNetworkStatus = () => {
    NetInfo.fetch().then((state) => {
      // treat "null" as "unknown" → don't show modal
      if (state.isInternetReachable === false) {
        setShowNetworkModal(true);
      } else {
        setShowNetworkModal(false);
      }
    });
  };


  useEffect(() => {
    checkPermission();

    // Check network immediately on mount
    checkNetworkStatus();

    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isInternetReachable === false) {
        setShowNetworkModal(true);
      } else if (state.isInternetReachable) {
        setShowNetworkModal(false);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Tapped notification:", response);
        if (navigationRef.isReady()) {
          navigationRef.navigate("Notification");
        }
      }
    );

    return () => {
      subscription.remove();
      unsubscribe();
    };
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontError) {
      console.error("Font load error:", fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <NavigationContainer>
            <SafeAreaView style={styles.container}>
              <StatusBar barStyle="dark-content" backgroundColor="#fff" />

              {/* 🔔 Notification Reminder Modal */}
              <Modal
                transparent
                visible={showPermissionModal}
                animationType="fade"
                onRequestClose={() => setShowPermissionModal(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Enable Notifications</Text>
                    <Text style={styles.modalText}>
                      Please allow notifications to get important updates on
                      your subscription packs.
                    </Text>

                    <View style={styles.modalActions}>
                      <Pressable
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setShowPermissionModal(false)}
                      >
                        <Text style={styles.cancelText}>Not Now</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={requestPermission}
                      >
                        <Text style={styles.confirmText}>Allow</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>

              {/* 🌐 Network Connectivity Modal */}
              <Modal
                transparent
                visible={showNetworkModal}
                animationType="fade"
                onRequestClose={() => setShowNetworkModal(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.networkIconContainer}>
                      <Ionicons name="wifi-outline" size={48} color="#ff6b6b" />
                    </View>
                    <Text style={styles.modalTitle}>
                      No Internet Connection
                    </Text>
                    <Text style={styles.modalText}>
                      Please check your internet connection and try again.
                    </Text>

                    <View style={styles.modalActions}>
                      {/* <Pressable
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={closeApp}
                      >
                        <Text style={styles.cancelText}>Close App</Text>
                      </Pressable> */}
                      <Pressable
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={checkNetworkStatus}
                      >
                        <Text style={styles.confirmText}>Retry</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>

              {/* Navigation Stack */}
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                }}
                initialRouteName="Splash"
              >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Intro" component={IntroScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen
                  name="SignupStep2"
                  component={SignupScreenStep2}
                />
                <Stack.Screen
                  name="SignupStep3"
                  component={SignupScreenStep3}
                />
                <Stack.Screen
                  name="SignupStep4"
                  component={SignupScreenStep4}
                />
                <Stack.Screen name="Forget" component={ForgotPasswordScreen} />
                <Stack.Screen
                  name="CitySelection"
                  component={CitySelectionScreen}
                />
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen
                  name="Search"
                  component={SearchScreen}
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen
                  name="ProductDetail"
                  component={ProductDetailScreen}
                />
                <Stack.Screen
                  name="Notification"
                  component={NotificationScreen}
                />
                <Stack.Screen name="Wallet" component={WalletScreen} />
                <Stack.Screen name="Recharge" component={RechargeScreen} />
                <Stack.Screen
                  name="TransactionHistory"
                  component={TransactionHistoryScreen}
                />
                <Stack.Screen
                  name="TransactionDetail"
                  component={TransactionDetailScreen}
                />
                <Stack.Screen
                  name="Subscriptions"
                  component={SubscriptionsScreen}
                />
                <Stack.Screen
                  name="AccountSettings"
                  component={AccountSettingsScreen}
                />
                <Stack.Screen
                  name="CustomerSupport"
                  component={CustomerSupportScreen}
                />
                <Stack.Screen
                  name="PaymentWebView"
                  component={PaymentWebViewScreen}
                />
              </Stack.Navigator>
            </SafeAreaView>
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  cancelButton: { backgroundColor: "#eee", flex: 2 },
  confirmButton: { backgroundColor: "#1b94e4", flex: 2 },
  cancelText: { color: "#333", fontWeight: "600", textAlign: "center" },
  confirmText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  networkIconContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
});
