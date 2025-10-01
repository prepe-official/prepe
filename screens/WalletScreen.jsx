import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MenuHeader from "../components/MenuHeader";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../store/slices/userSlice";
import axios from "axios";

const WalletScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: userData } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/user/get?id=${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (userData.success) {
        dispatch(updateUser(userData.user));
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user, token, dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Wallet" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <Image
            source={{ uri: user?.image || "https://placehold.co/60x60" }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.name || "User"}</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹{user?.walletBalance.toFixed(2) || "0"}
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Recharge")}
        >
          <Ionicons name="refresh-circle-outline" size={24} color="#333" />
          <Text style={styles.actionText}>Recharge Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("TransactionHistory")}
        >
          <Ionicons name="time-outline" size={24} color="#333" />
          <Text style={styles.actionText}>Transaction History</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Note Section */}
      <View style={styles.noteCard}>
        <Ionicons name="alert-circle-outline" size={20} color="#e63946" />
        <Text style={styles.noteText}>
          Once added, you will not be able to withdraw the amount.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  userCard: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: "#1b94e4",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 16,
  },
  userName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  balanceCard: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#999",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: "700",
    color: "#000",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 8,
  },
  actionText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    marginBottom: 32,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: "#fff5f5",
    borderLeftWidth: 4,
    borderLeftColor: "#e63946",
    borderRadius: 8,
  },
  noteText: {
    marginLeft: 10,
    color: "#e63946",
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
});

export default WalletScreen;
