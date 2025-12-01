import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  SafeAreaView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "../store/slices/userSlice";
import MenuHeader from "../components/MenuHeader";
import BlueButton from "../components/BlueButton";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import DropDownPicker from "react-native-dropdown-picker";

const AccountSettingsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.user);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(false);
  const majorCities = ["Indore", "Khandwa", "Bhopal", "Gwalior", "Jabalpur"];
  const [items, setItems] = useState(
    majorCities.map((city, index) => ({
      label: city,
      value: city,
      disabled: index >= 2,
    }))
  );
  const [image, setImage] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(true); // existing number assumed verified
  const [otpStage, setOtpStage] = useState("idle");
  const [sessionId, setSessionId] = useState("");
  const [otp, setOtp] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Error", "All fields are required.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert(
        "Error",
        "New password and confirm password must match."
      );
    }

    try {
      setPasswordLoading(true);
      const { data } = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/user/set-password`,
        {
          email: user.email,
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        Alert.alert("Success", "Password updated successfully.");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Error", data.message || "Failed to update password.");
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message ||
        "An error occurred while updating password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAddress(user.address || "");
      setMobileNo(user.phoneNumber || "");
      setEmail(user.email || "");
      setCity(user.city || "");
      setImage(user.image || null);
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Logout",
          onPress: () => {
            dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: "Intro" }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const fileSizeInMB = asset.fileSize / (1024 * 1024);

      if (fileSizeInMB > 4.5) {
        return Alert.alert(
          "Error",
          "Image size exceeds 4.5MB. Please choose a smaller image."
        );
      }

      setNewImage(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!phoneVerified) {
      return Alert.alert("Error", "Please verify your new phone number first.");
    }
    setLoading(true);
    try {
      const payload = {
        name,
        address,
        phoneNumber: mobileNo,
        email,
        city,
      };

      if (newImage) {
        payload.image = newImage;
      }

      const { data } = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/user/update?id=${user._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        dispatch(updateUser(data.user));
        Alert.alert("Success", "Your profile has been updated.");
      } else {
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
        "An error occurred while updating your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!user) return;

    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data } = await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/user/delete?id=${user._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (data.success) {
                Alert.alert("Success", "Your account has been deleted.");
                dispatch(logout()); // Clear user data from state
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Intro" }], // Navigate to the initial screen
                });
              } else {
                Alert.alert(
                  "Error",
                  data.message || "Failed to delete account."
                );
              }
            } catch (error) {
              console.error("Failed to delete account", error);
              Alert.alert(
                "Error",
                error.response?.data?.message ||
                "An error occurred while deleting your account."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSendOtp = async () => {
    try {
      const resp = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/utils/send-otp`,
        { phone: mobileNo }
      );
      if (resp.data.success) {
        setSessionId(resp.data.sessionId);
        setOtpStage("verifying");
        setResendTimer(15);
      } else {
        Alert.alert("Error", resp.data.error || "Failed to send OTP");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleVerifyOtp = async () => {
    try {
      const resp = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/utils/verify-otp`,
        { sessionId, otp }
      );
      if (resp.data.success) {
        setPhoneVerified(true);
        setOtpStage("idle");
        Alert.alert("Success", "Phone verified successfully");
      } else {
        Alert.alert("Error", resp.data.error || "OTP failed");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Account Settings" />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Edit Personal Info</Text>

        {/* Profile Picture */}
        <View style={styles.profilePicContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.profilePic}>
            <Image
              source={{
                uri: newImage || image || "https://placehold.co/120x120",
              }}
              style={styles.profilePicImage}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.editButton}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name*"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#555"
          />
          <TextInput
            style={styles.input}
            placeholder="Address*"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#555"
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.inputWithButton]}
              placeholder="Mobile no*"
              value={mobileNo}
              onChangeText={(t) => {
                setMobileNo(t);
                setPhoneVerified(false); // mark unverified if changed
              }}
              keyboardType="phone-pad"
              placeholderTextColor="#555"
            />
            {phoneVerified ? (
              <Text style={styles.verifiedText}>✅</Text>
            ) : otpStage === "idle" ? (
              <TouchableOpacity
                style={styles.verifyButton1}
                onPress={handleSendOtp}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {otpStage === "verifying" && (
            <View style={styles.otpContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                onChangeText={(t) => setOtp(t)}
              />
              <View style={styles.otpButtons}>
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleVerifyOtp}
                >
                  <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    { backgroundColor: resendTimer > 0 ? "#ccc" : "#e0e0e0" },
                  ]}
                  onPress={handleSendOtp}
                  disabled={resendTimer > 0}
                >
                  <Text style={styles.verifyButtonText}>
                    {resendTimer > 0 ? `Resend (${resendTimer})` : "Resend"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.inputWithButton]}
              placeholder="Email*"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor="#555"
            />
          </View>
          <View style={[styles.dropdownContainer, { zIndex: 2000 }]}>
            <DropDownPicker
              open={open}
              value={city}
              items={items}
              setOpen={setOpen}
              setValue={setCity}
              setItems={setItems}
              placeholder="Select City"
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              dropDownContainerStyle={styles.dropdownList}
              listItemContainerStyle={styles.dropdownItem}
              placeholderStyle={styles.placeholderStyle}
              disabledStyle={styles.disabledItem}
              disabledItemLabelStyle={styles.disabledItemText}
              zIndex={3000}
              zIndexInverse={1000}
              listMode="SCROLLVIEW"
            />
          </View>
        </View>

        <BlueButton
          title={loading ? "Saving..." : "Save"}
          onPress={handleSave}
          disabled={loading}
        />
        <TouchableOpacity onPress={() => navigation.navigate("Forget")}>
          <Text style={styles.logoutText}>Forget Password</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowPasswordModal(true)}>
          <Text style={styles.logoutText}>Reset Password</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
      {showPasswordModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set New Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Old Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <BlueButton
              title={passwordLoading ? "Updating..." : "Update Password"}
              onPress={handleChangePassword}
              disabled={passwordLoading}
            />

            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
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
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  inputWithButton: {
    flex: 1,
    marginBottom: 0,
  },
  verifyButton: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 12,
    width: "45%",
  },
  verifyButton1: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 16,
    marginLeft: 8,
  },
  verifyButtonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
    margin: "auto",
  },
  dropdownContainer: {
    width: "100%",
    position: "relative",
    marginBottom: 20,
  },
  dropdown: {
    backgroundColor: "#f2f2f2",
    borderColor: "transparent",
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: "#000",
  },
  dropdownList: {
    backgroundColor: "#f2f2f2",
    borderColor: "#E0E0E0",
    borderRadius: 10,
  },
  dropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  placeholderStyle: {
    color: "#555",
    fontSize: 16,
  },
  verifiedText: {
    fontSize: 18,
    marginLeft: 10,
  },

  otpContainer: {
    marginBottom: 20,
  },

  otpButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  disabledItem: {
    backgroundColor: "#F5F5F5",
  },
  disabledItemText: {
    color: "#AAAAAA",
  },
  forgotPassword: {
    textAlign: "right",
    color: "#1b94e4",
    fontSize: 14,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "red",
    textAlign: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  cancelText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "600",
    color: "red",
    textAlign: "center",
  },

});

export default AccountSettingsScreen;
