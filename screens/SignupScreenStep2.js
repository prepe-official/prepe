import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { login as loginAction } from "../store/slices/userSlice";
import {
  registerForPushNotificationsAsync,
  sendFCMTokenToServer,
} from "../utils/notifications";
import { clearProgress, saveProgress } from "../store/slices/signupSlice";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const SignupScreenStep2 = ({ route, navigation }) => {
  const { name, email, password } = route.params;
  const selectedCity = useSelector((state) => state.city.selectedCity);
  const dispatch = useDispatch();
  const signupProgress = useSelector((state) => state.signup);
  // stages: "form" -> "otp" -> "create"
  const [stage, setStage] = useState("form");
  const [resendTimer, setResendTimer] = useState(15);

  // form fields
  const [phone, setPhone] = useState(signupProgress.phone || "");
  const [address, setAddress] = useState(signupProgress.address || "");

  // otp fields
  const [sessionId, setSessionId] = useState("");
  const [otp, setOtp] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // 1) Send OTP
  const handleSendOtp = async () => {
    if (!phone || !address) {
      return Alert.alert("Error", "Please fill in all fields");
    }
    if (!selectedCity) {
      return Alert.alert("Error", "Please select a city first");
    }
    dispatch(saveProgress({ step: 2, phone, address }));
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/utils/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await resp.json();
      if (!result.success)
        throw new Error(result.error || "Failed to send OTP");
      setSessionId(result.sessionId);
      setStage("otp");
      setResendTimer(15);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2) Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert("Error", "Please enter the OTP");
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/utils/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp }),
      });
      const result = await resp.json();
      if (!result.success)
        throw new Error(result.error || "OTP verification failed");
      setStage("create");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (stage === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage, resendTimer]);

  // 3) Navigate user

  const handleNavigateToStep3 = () => {
  navigation.navigate("SignupStep3", {
    name,
    email,
    password,
    phone,
    address,
  });
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
          {stage === "form" && (
            <>
              <Text style={styles.headerText}>
                Create Account (Step 2 of 3)
              </Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#a0a0a0"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your address"
                  placeholderTextColor="#a0a0a0"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, isLoading && { opacity: 0.6 }]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Sending OTP…" : "Send OTP"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {stage === "otp" && (
            <>
              <Text style={styles.headerText}>Verify Phone</Text>
              <Text style={styles.infoText}>
                To verify your mobile number we will provide otp with a phone
                call. Make sure the number is correct.
              </Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter the OTP"
                  placeholderTextColor="#a0a0a0"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
              </View>
              <TouchableOpacity
                style={[styles.button, isLoading && { opacity: 0.6 }]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Verifying…" : "Verify OTP"}
                </Text>
              </TouchableOpacity>
              {resendTimer > 0 ? (
                <Text style={styles.timerText}>
                  Resend available in {resendTimer}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleSendOtp}
                  style={[styles.resendButton, isLoading && { opacity: 0.6 }]}
                  disabled={isLoading}
                >
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {stage === "create" && (
            <>
              <Text style={styles.headerText}>Almost Done!</Text>
              <Text style={styles.infoText}>
                Phone verified. Let's add a profile photo.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleNavigateToStep3}
              >
                <Text style={styles.buttonText}>Next: Add Photo</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={styles.loginContainer}>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.loginLink}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Text style={styles.version}>Version 1.0.0</Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1b94e4" },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  logo: { width: 150, height: 150, marginBottom: 30 },
  formContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b94e4",
    marginBottom: 20,
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: { marginBottom: 15 },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  button: {
    backgroundColor: "#1b94e4",
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: { flexDirection: "row", justifyContent: "center" },
  loginLink: {
    color: "#1b94e4",
    fontSize: 14,
    fontWeight: "700",
  },
  version: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  timerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  resendButton: {
    alignSelf: "center",
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    color: "#1b94e4",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SignupScreenStep2;
