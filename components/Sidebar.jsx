import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/userSlice";
import axios from "axios";

const Sidebar = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [config, setConfig] = useState({
    termsLink: "",
    privacyLink: "",
  });

  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
        );
        if (data.success && data.configuration) {
          setConfig(data.configuration);
        }
      } catch (error) {
        console.error("Failed to fetch configuration:", error);
      }
    };

    if (visible) {
      fetchConfiguration();
    }
  }, [visible]);

  if (!visible) return null;

  const handleLogout = () => {
    dispatch(logout());
    onClose();
    navigation.reset({
      index: 0,
      routes: [{ name: "Intro" }],
    });
  };

  const navigateTo = (screen) => {
    navigation.navigate(screen);
    onClose();
  };

  const handleLinkPress = async (url) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(`Don't know how to open this URL: ${url}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.sidebar}>
          {/* Header with back button and blue background */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            {/* User info */}
            <View style={styles.userInfo}>
              <Image
                source={{ uri: user?.image || "https://placehold.co/80x80" }}
                style={styles.avatar}
              />
              <Text style={styles.username}>{user?.name || "Username"}</Text>

              {/* Wallet info */}
              <View style={styles.walletContainer}>
                <Text style={styles.walletAmount}>
                  ₹{(user?.walletBalance) || "0"}
                </Text>
                <Text style={styles.walletLabel}>In wallet</Text>
              </View>
            </View>
          </View>

          {/* Scrollable Menu Items */}
          <ScrollView style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Main")}
            >
              <Ionicons name="home-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Wallet")}
            >
              <Ionicons name="wallet-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("TransactionHistory")}
            >
              <Ionicons name="time-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Transaction History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Subscriptions")}
            >
              <Ionicons name="card-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Manage Subscriptions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("AccountSettings")}
            >
              <Ionicons name="settings-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Account Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("CustomerSupport")}
            >
              <Ionicons name="help-circle-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Customer Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Log Out</Text>
            </TouchableOpacity>

            {/* Add padding at the bottom to ensure content isn't hidden by footer */}
            <View style={styles.menuFooterSpace} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => handleLinkPress(config.privacyLink)}>
              <Text style={styles.footerText}>Privacy Policies</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>/</Text>
            {/* <Text style={[styles.footerText, styles.disabledFooterText]}>Cancellations & Refund Policies</Text> */}
            {/* <Text style={styles.footerSeparator}>/</Text> */}
            <TouchableOpacity onPress={() => handleLinkPress(config.termsLink)}>
              <Text style={styles.footerText}>Terms & Conditions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  sidebar: {
    width: "75%",
    height: "100%",
    backgroundColor: "white",
  },
  header: {
    backgroundColor: "#1b94e4",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    paddingVertical: 10,
  },
  userInfo: {
    alignItems: "center",
    marginTop: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(200, 200, 200, 0.8)",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "white",
  },
  username: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  walletContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    width: "100%",
    alignItems: "center",
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  walletLabel: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  menuContainer: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: "600",
    color: "#333",
  },
  menuFooterSpace: {
    height: 60,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 12,
    color: "#1b94e4",
    textAlign: "center",
  },
  disabledFooterText: {
      color: '#a0a0a0'
  },
  footerSeparator: {
      fontSize: 12,
      color: '#a0a0a0',
      marginHorizontal: 4,
  }
});

export default Sidebar;
