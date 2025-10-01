import React from "react";
import { StyleSheet, View, Image, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import BlueButton from "../components/BlueButton";

const IntroScreen = ({ navigation }) => {
  const handleNext = () => {
    navigation.navigate("CitySelection");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Image
        source={require("../assets/intro.png")}
        style={styles.introImage}
        resizeMode="contain"
      />

      <View>
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.featureText}>
              Find Local Subscription Packs Easily
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.featureItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.featureText}>
              Get Discounts on Every Subscription
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.featureItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.featureText}>Easily Track Subscriptions</Text>
          </View>
        </View>

        <BlueButton
          title="Next"
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "flex-end",
    paddingBottom: 40,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  introImage: {
    width: "100%",
    height: "40%",
    alignSelf: "center",
    marginBottom: 100,
  },
  featuresContainer: {
    width: "100%",
    backgroundColor: "#1b94e4",
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  bulletPoint: {
    fontSize: 18,
    color: "#fff",
    marginRight: 8,
  },
  featureText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: "100%",
  },
  nextButton: {
    width: "100%",
    marginTop: 24,
  },
});

export default IntroScreen;
