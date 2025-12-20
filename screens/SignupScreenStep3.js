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
import { useDispatch } from "react-redux";
import { saveProgress } from "../store/slices/signupSlice";
import * as ImagePicker from "expo-image-picker";

const SignupScreenStep3 = ({ route, navigation }) => {
  const { name, email, phone } = route.params;
  const dispatch = useDispatch();

  const [image, setImage] = useState(null);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

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
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleNext = () => {
    if (!address.trim()) {
      return Alert.alert("Error", "Please enter your delivery address");
    }

    // Save progress
    dispatch(saveProgress({ step: 3, name, email, phone, address, image }));

    // Navigate to Step 4 (Set Password)
    navigation.navigate("SignupStep4", {
      name,
      email,
      phone,
      address,
      image,
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
          <Text style={styles.headerText}>Create New Account</Text>
          <Text style={styles.subHeaderText}>What Is The Delivery Address?</Text>

          {/* Profile Image Upload */}
          <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#999" />
              </View>
            )}
            <Text style={styles.uploadText}>Upload Image</Text>
          </TouchableOpacity>

          {/* Address Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              placeholder="Enter your delivery address"
              placeholderTextColor="#a0a0a0"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.goBackButtonText}>Go back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextButton, isLoading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.nextButtonText}>Next</Text>
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
    marginBottom: 25,
  },
  imageUploadContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 13,
    color: "#666",
  },
  inputContainer: {
    marginBottom: 20,
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
  addressInput: {
    height: 100,
    paddingTop: 14,
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
  nextButton: {
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
  nextButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SignupScreenStep3;
