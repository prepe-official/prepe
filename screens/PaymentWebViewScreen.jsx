import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Alert,
  BackHandler,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useDispatch } from "react-redux";
import { updateUser } from "../store/slices/userSlice";

const PaymentWebViewScreen = ({ route }) => {
  const { url, transactionId, user, token, amount } = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [verifiedPaymentIds, setVerifiedPaymentIds] = useState(new Set());

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Recharge Cancelled",
          "You’ll need balance in your wallet not just to subscribe a pack but also to receive cashback.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        return true; // ✅ block default back behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove(); // ✅ correct cleanup
    }, [navigation])
  );

  const verifyPayment = async (razorpay_payment_id) => {
    try {
      const verifyUrl = `${process.env.EXPO_PUBLIC_API_URL}/user/recharge/verify`;

      const response = await axios.post(
        verifyUrl,
        {
          razorpay_payment_id,
          transactionId,
          userId: user._id,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        try {
          const { data } = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/user/get?id=${user._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (data.success) {
            dispatch(updateUser(data.user));
          }
        } catch (fetchError) {
          console.error("Failed to fetch user data after payment", fetchError);
        }

        Alert.alert("Success", "Payment successful!");
        navigation.goBack();
      } else {
        // Alert.alert(
        //   "Failed",
        //   response.data.message ||
        //     "Payment verification failed. Please try again."
        // );
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error verifying payment:", error);

      let errorMessage = "Failed to verify payment. Please contact support.";
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      // Alert.alert("Error", errorMessage);
      navigation.goBack();
    }
  };

  const handleNavigationStateChange = (navState) => {
    const { url: navUrl } = navState;

    if (navUrl.includes("razorpay_payment_id")) {
      // Razorpay sometimes returns params with # instead of ?
      const cleanUrl = navUrl.replace("#", "?");
      const urlParams = new URLSearchParams(new URL(cleanUrl).search);
      const razorpay_payment_id = urlParams.get("razorpay_payment_id");

      if (razorpay_payment_id && !verifiedPaymentIds.has(razorpay_payment_id)) {
        setVerifiedPaymentIds((prev) => new Set(prev).add(razorpay_payment_id));
        verifyPayment(razorpay_payment_id);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1b94e4" />
            <Text>Loading Payment Gateway...</Text>
          </View>
        )}
        // 🚫 Prevent Razorpay exit URL from throwing error
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;

          if (
            nativeEvent.url.startsWith("razorpay://") ||
            nativeEvent.url.startsWith("upi://")
          ) {
            // Ignore Razorpay’s exit redirect
            return;
          }

          console.error("WebView error:", nativeEvent);
          //   Alert.alert(
          //     "Error",
          //     "Something went wrong while loading the payment."
          //    );
          navigation.goBack();
        }}
        // 🚫 Stop WebView from trying to open unsupported schemes
        onShouldStartLoadWithRequest={(request) => {
          if (
            request.url.startsWith("razorpay://") ||
            request.url.startsWith("upi://")
          ) {
            return false;
          }
          return true;
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});

export default PaymentWebViewScreen;
