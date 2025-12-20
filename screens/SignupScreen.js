import React, { useState } from "react";
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
import { saveProgress } from "../store/slices/signupSlice";
import { useDispatch, useSelector } from "react-redux";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const SignupScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const signupProgress = useSelector((state) => state.signup);

  const [name, setName] = useState(signupProgress?.name || "");
  const [email, setEmail] = useState(signupProgress?.email || "");
  const [phone, setPhone] = useState(signupProgress?.phone || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyPhone = async () => {
    if (!name.trim()) {
      return Alert.alert("Error", "Please enter your username");
    }
    if (!email.trim()) {
      return Alert.alert("Error", "Please enter your email");
    }
    if (!phone.trim() || phone.length < 10) {
      return Alert.alert("Error", "Please enter a valid phone number");
    }

    setIsLoading(true);
    try {
      // Send OTP
      const resp = await fetch(`${API_BASE}/utils/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await resp.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send OTP");
      }

      // Save progress
      dispatch(saveProgress({ step: 1, name, email, phone }));

      // Navigate to OTP screen
      navigation.navigate("SignupStep2", {
        name,
        email,
        phone,
        sessionId: result.sessionId,
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
          <Text style={styles.subHeaderText}>Provide Personal Detail</Text>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#1b94e4" />
            <Text style={styles.infoBannerText}>
              Please Provide Correct Details As This{"\n"}
              Information Will Be Used By The Subscription{"\n"}
              Provider To Reach You.
            </Text>
          </View>

          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#a0a0a0"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#a0a0a0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Contact Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#a0a0a0"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* Verify Phone Number Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerifyPhone}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Phone Number</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Log In</Text>
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
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 15,
    fontSize: 15,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  button: {
    backgroundColor: "#1b94e4",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#1b94e4",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default SignupScreen;
