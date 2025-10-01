import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import MenuHeader from "../components/MenuHeader";
import BlueButton from "../components/BlueButton";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { updateUser } from "../store/slices/userSlice";

const RechargeScreen = () => {
  const [amount, setAmount] = useState("");
  const { user, token } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const fetchUser = useCallback(async () => {
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
    }
  }, [user, token, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  }, [fetchUser]);

  const handleRecharge = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to recharge.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/user/recharge/createPaymentLink`,
        {
          amount: parseFloat(amount),
          userId: user._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (data && data.short_url) {
        navigation.navigate("PaymentWebView", {
          url: data.short_url,
          transactionId: data.transactionId,
          user,
          token,
          amount,
        });
        setAmount("");
      } else {
        Alert.alert("Error", "Could not initiate payment. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error creating payment link:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to create payment link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Recharge Wallet" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹{(user?.walletBalance) || "0"}
          </Text>
        </View>

        {/* Amount Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recharge Amount</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="Enter Amount"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

      </ScrollView>

      {/* Recharge Button */}
      <BlueButton
        title={loading ? "Processing..." : "Recharge Wallet"}
        onPress={handleRecharge}
        style={styles.rechargeButton}
        disabled={loading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111",
  },
  amountInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#000",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedPayment: {
    borderColor: "#1b94e4",
    borderWidth: 1,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  rupeeIcon: {
    fontSize: 20,
    fontWeight: "700",
  },
  paymentText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveCardOption: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  saveCardText: {
    fontSize: 14,
    color: "#333",
  },
  rechargeButton: {
    margin: 16,
    marginBottom: 40,
  },
});

export default RechargeScreen;
