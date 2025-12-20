import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import Sidebar from "./Sidebar";
import { logout } from "../store/slices/userSlice";

const Header = ({ title }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { isLoggedIn, user } = useSelector((state) => state.user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigation.reset({
      index: 0,
      routes: [{ name: "Intro" }],
    });
  };

  const checkUserStatus = useCallback(async () => {
    if (!user?._id || !isLoggedIn) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/user/get?id=${user._id}`
      );
      const data = await response.json();

      if (data.success) {
        const userStatus = data.user?.status || data.status;

        if (userStatus === "suspended") {
          // Show warning and log out user
          Alert.alert(
            "Account Suspended",
            "Your account has been suspended. You will be logged out automatically.",
            [
              {
                text: "OK",
                onPress: () => handleLogout(),
              },
            ],
            { cancelable: false }
          );
        }
      }
    } catch (err) {
      console.error("Failed to check user status:", err.message);
    }
  }, [user, isLoggedIn, dispatch, navigation]);

  const toggleSidebar = () => {
    if (isLoggedIn) {
      setSidebarVisible(!sidebarVisible);
    } else {
      navigation.navigate("Login");
    }
  };

  const goToNotifications = () => {
    if (isLoggedIn) {
      navigation.navigate("Notification");
      setUnreadCount(0);
    } else {
      navigation.navigate("Login");
    }
  };

  const fetchUnreadNotifications = useCallback(async () => {
    if (!user?._id) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/notification/get-by-user?userId=${user._id}`
      );
      const data = await response.json();
      if (data.success) {
        const unread = data.data.filter((n) => !n.isRead);
        setUnreadCount(unread.length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err.message);
    }
  }, [user]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadNotifications();
      checkUserStatus(); // Check user status when component mounts or login state changes
    }
  }, [isLoggedIn, fetchUnreadNotifications, checkUserStatus]);

  // Optional: Periodic status check (every 5 minutes)
  useEffect(() => {
    if (!isLoggedIn) return;

    const statusCheckInterval = setInterval(() => {
      checkUserStatus();
    }, 300000); // 5 minutes

    return () => clearInterval(statusCheckInterval);
  }, [isLoggedIn, checkUserStatus]);

  const signupProgress = useSelector((state) => state.signup);

  useEffect(() => {
    if (signupProgress.step > 0 && !isLoggedIn) {
      setShowSignupModal(true);
    }
  }, [isLoggedIn]);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={goToNotifications}
          >
            <Ionicons name="notifications-outline" size={26} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleSidebar}>
            <Ionicons name="options-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      {/* Modal for profile completion */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSignupModal}
        onRequestClose={() => setShowSignupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Your Profile</Text>
            <Text style={styles.modalText}>
              You haven't finished signing up yet. Do you want to complete your
              profile now?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSignupModal(false)}
              >
                <Text style={styles.cancelText}>Not Now</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowSignupModal(false);
                  navigation.navigate("SignupStep2", signupProgress);
                }}
              >
                <Text style={styles.confirmText}>Complete Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#1994E5",
    position: "relative",
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  headerIcons: {
    flexDirection: "row",
    position: "absolute",
    right: 16,
  },
  iconButton: {
    marginLeft: 20,
  },
  badge: {
    position: "absolute",
    right: 10,
    top: -2,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    color: "#1b94e4",
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
    flex: 2,
  },
  cancelButton: {
    backgroundColor: "#eee",
  },
  confirmButton: {
    backgroundColor: "#1b94e4",
  },
  cancelText: {
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
});

export default Header;
