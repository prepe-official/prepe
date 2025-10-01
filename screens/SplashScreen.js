import React, { useEffect } from "react";
import { Image, StyleSheet, View, StatusBar, Text } from "react-native";
import { useSelector } from "react-redux";

const SplashScreen = ({ navigation }) => {
  const { isLoggedIn } = useSelector((state) => state.user);

  useEffect(() => {
    // Check login status and navigate accordingly after splash screen
    setTimeout(() => {
      if (isLoggedIn) {
        navigation.navigate("Main");
      } else {
        navigation.navigate("Intro");
      }
    }, 2000); // 2 seconds splash screen
  }, [isLoggedIn, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1b94e4" />
      <Image
        source={require("../assets/splash-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1b94e4",
  },
  logo: {
    width: "80%",
    height: "80%",
  },
  version: {
    position: "absolute",
    bottom: 40,
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
