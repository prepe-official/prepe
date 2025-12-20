import React, { useEffect, useState, useRef } from "react";
import {
  Image,
  StyleSheet,
  View,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { saveProgress } from "../store/slices/signupSlice";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const SignupScreenStep2 = ({ route, navigation }) => {
  const { name, email, phone, sessionId: initialSessionId } = route.params;
  const dispatch = useDispatch();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [resendTimer, setResendTimer] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const resp = await fetch(`${API_BASE}/utils/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await resp.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to resend OTP");
      }

      setSessionId(result.sessionId);
      setResendTimer(10);
      setOtp(["", "", "", "", "", ""]);
      Alert.alert("Success", "OTP sent successfully!");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      return Alert.alert("Error", "Please enter the complete OTP");
    }

    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/utils/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp: otpCode }),
      });
      const result = await resp.json();

      if (!result.success) {
        throw new Error(result.error || "OTP verification failed");
      }

      // Save progress
      dispatch(saveProgress({ step: 2, name, email, phone }));

      // Navigate to Step 3 (Address + Image)
      navigation.navigate("SignupStep3", {
        name,
        email,
        phone,
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1b94e4" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../assets/splash-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.formContainer}>
          <Text style={styles.headerText}>Create New Account</Text>
          <Text style={styles.subHeaderText}>Verify Phone Number</Text>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#1b94e4" />
            <Text style={styles.infoBannerText}>
              You'll Receive The OTP Through A Phone Call.{"\n"}
              Make Sure You're In Good Network Range{"\n"}
              And A Quite Place.
            </Text>
          </View>

          {/* OTP Code Label */}
          <Text style={styles.otpLabel}>OTP Code</Text>

          {/* OTP Input Boxes */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Resend Timer */}
          <Text style={styles.timerText}>
            Resend OTP in 00:{resendTimer.toString().padStart(2, "0")}
          </Text>

          {/* Resend OTP Button */}
          <TouchableOpacity
            style={[styles.resendButton, (resendTimer > 0 || isResending) && styles.resendButtonDisabled]}
            onPress={handleResendOtp}
            disabled={resendTimer > 0 || isResending}
          >
            {isResending ? (
              <ActivityIndicator color="#1b94e4" size="small" />
            ) : (
              <Text style={[styles.resendButtonText, resendTimer > 0 && styles.resendButtonTextDisabled]}>
                Resend OTP
              </Text>
            )}
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.goBackButtonText}>Go back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1b94e4",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  formContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#E8F4FD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#B8DAEF",
  },
  infoBannerText: {
    fontSize: 12,
    color: "#1b94e4",
    marginLeft: 10,
    lineHeight: 18,
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 15,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "#fafafa",
    color: "#333",
  },
  timerText: {
    textAlign: "center",
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  resendButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 20,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  resendButtonTextDisabled: {
    color: "#999",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  goBackButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  goBackButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  verifyButton: {
    flex: 1,
    backgroundColor: "#1b94e4",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SignupScreenStep2;
