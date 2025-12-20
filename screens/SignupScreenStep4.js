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
import { useSelector, useDispatch } from "react-redux";
import { login as loginAction } from "../store/slices/userSlice";
import { clearProgress } from "../store/slices/signupSlice";
import { setCity } from "../store/slices/citySlice";
import {
    registerForPushNotificationsAsync,
    sendFCMTokenToServer,
} from "../utils/notifications";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const SignupScreenStep4 = ({ route, navigation }) => {
    const { name, email, phone, address, image } = route.params;
    const selectedCity = useSelector((state) => state.city.selectedCity);
    const dispatch = useDispatch();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleComplete = async () => {
        if (!password) {
            return Alert.alert("Error", "Please enter a password");
        }
        if (password.length < 6) {
            return Alert.alert("Error", "Password must be at least 6 characters");
        }
        if (password !== confirmPassword) {
            return Alert.alert("Error", "Passwords don't match");
        }

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
                try {
                    const expoPushToken = await registerForPushNotificationsAsync();
                    if (expoPushToken) {
                        await sendFCMTokenToServer({
                            userId: loginData.user._id,
                            authToken: loginData.token,
                            expoPushToken,
                        });
                    }
                } catch (notifError) {
                    console.log("Notification setup failed:", notifError);
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
                    <Text style={styles.subHeaderText}>Set Password</Text>

                    {/* Username (readonly) */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={[styles.input, styles.readonlyInput]}
                            value={name}
                            editable={false}
                        />
                    </View>

                    {/* Email (readonly) */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.readonlyInput]}
                            value={email}
                            editable={false}
                        />
                    </View>

                    {/* Set Password */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Set Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="#a0a0a0"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm your password"
                            placeholderTextColor="#a0a0a0"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
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
                            style={[styles.completeButton, isLoading && styles.buttonDisabled]}
                            onPress={handleComplete}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.completeButtonText}>Complete</Text>
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
        marginBottom: 20,
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
    readonlyInput: {
        backgroundColor: "#f0f0f0",
        color: "#666",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 10,
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
    completeButton: {
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
    completeButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
});

export default SignupScreenStep4;
