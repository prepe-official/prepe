// ../components/CashbackModal.js

import React, { useEffect, useRef } from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import BlueButton from "./BlueButton";

const CashbackModal = ({ visible, amount, onClose }) => {
  const animation = useRef(null);

  useEffect(() => {
    // Play the animation when the modal becomes visible
    if (visible) {
      animation.current?.play();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        {/* Lottie Animation as background */}
        <LottieView
          ref={animation}
          source={require("../assets/confetti.json")} // Make sure this path is correct!
          autoPlay={false}
          loop={false}
          style={styles.lottie}
          resizeMode="cover"
        />
        <View style={styles.modalContent}>
          <Text style={styles.title}>Congratulations! 🎉</Text>
          <Text style={styles.subtitle}>You've won a cashback of</Text>
          <Text style={styles.amountText}>₹{amount}</Text>
          <Text style={styles.infoText}>
            The amount has been credited to your wallet.
          </Text>
          <BlueButton
            title="Awesome!"
            onPress={onClose}
            style={{ width: "100%", marginTop: 20 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 80, 150, 0.85)", // A deep blue semi-transparent overlay
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  lottie: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  modalContent: {
    zIndex: 2, // Ensure content is above the Lottie animation
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E3A8A", // A dark blue for contrast
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#4B5563", // A neutral gray
    marginBottom: 16,
  },
  amountText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#22C55E", // A vibrant green for the amount
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 1,
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
  },
});

export default CashbackModal;
