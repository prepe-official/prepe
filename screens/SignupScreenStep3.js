import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  StatusBar,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { login as loginAction } from "../store/slices/userSlice";
import { clearProgress } from "../store/slices/signupSlice";
import {
  registerForPushNotificationsAsync,
  sendFCMTokenToServer,
} from "../utils/notifications";
import * as ImagePicker from "expo-image-picker";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const SignupScreenStep3 = ({ route, navigation }) => {
  const { name, email, password, phone, address } = route.params;
  const selectedCity = useSelector((state) => state.city.selectedCity);
  const dispatch = useDispatch();

  const [image, setImage] = useState(null); // Will store the base64 image string
  const [isLoading, setIsLoading] = useState(false);

  // 1) Handle Image Picking
  const pickImage = async () => {
    // Request permission to access the media library
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to upload a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.5, // Compress image to reduce size
      base64: true, // Crucial for sending to the backend
    });

    if (!result.canceled) {
      // The backend expects a data URI format
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // 2) Final step: Create user, auto-login, and navigate
  const handleCompleteSignup = async () => {
    setIsLoading(true);
    try {
      // Construct the final payload for user creation
      const payload = {
        name,
        email,
        password,
        phoneNumber: phone,
        address,
        city: selectedCity,
      };

      // Only add the image to the payload if one was selected
      if (image) {
        payload.image = image;
      }

      // Create the user
      const resp = await fetch(`${API_BASE}/user/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || "Registration failed");

      // Auto-login immediately after successful signup
      const loginResp = await fetch(`${API_BASE}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginResp.json();

      if (loginResp.ok && loginData.success) {
        dispatch(loginAction({ user: loginData.user, token: loginData.token }));

        // Register for push notifications
        const expoPushToken = await registerForPushNotificationsAsync();
        if (expoPushToken) {
          await sendFCMTokenToServer({
            userId: loginData.user._id,
            authToken: loginData.token,
            expoPushToken,
          });
        }

        // Clear the persisted signup form data
        dispatch(clearProgress());

        // Navigate to the main app, replacing the signup stack
        navigation.replace("Main");
      } else {
        // Fallback: account created but auto-login failed
        Alert.alert(
          "Success",
          "Account created successfully. Please login to continue."
        );
        navigation.navigate("Login");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
      navigation.navigate("Signup");
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
          <Text style={styles.headerText}>Create Account (Step 3 of 3)</Text>
          <Text style={styles.infoText}>
            Add a profile photo to complete your account. This is optional.
          </Text>

          {/* Profile Picture Picker */}
          <View style={styles.profilePicContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.profilePic}>
              {image && (
                <Image source={{ uri: image }} style={styles.profilePicImage} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.editButton}>
                {image ? "Change Photo" : "Choose Photo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Complete Signup Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && { opacity: 0.6 }]}
            onPress={handleCompleteSignup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Creating Account…" : "Complete Sign Up"}
            </Text>
          </TouchableOpacity>

          {/* Go Back Link */}
          {/* <View style={styles.loginContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Go Back</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </ScrollView>
      <Text style={styles.version}>Version 1.0.0</Text>
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
    width: 150,
    height: 150,
    marginBottom: 30,
  },
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
    marginBottom: 10,
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  profilePic: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#e0e0e0",
    marginBottom: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1b94e4",
  },
  profilePicImage: {
    width: "100%",
    height: "100%",
  },
  editButton: {
    fontSize: 16,
    color: "#1b94e4",
    fontWeight: "600",
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
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
});

export default SignupScreenStep3;
