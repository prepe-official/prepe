import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BlueButton from "./BlueButton";

const CashbackModal = ({ visible, amount, onClose, packName }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={28} color="#333" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Subscribed</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            You've successfully Subscribed to {packName || "this pack"}
          </Text>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle"
              size={24}
              color="#333"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              The first cycle of subscription will be a trial period. You'll be
              notified at the expiring date of the pack. At that time you can
              choose to continue or unsubscribe the pack.{"\n"}Note: You'll not
              be notified of the expiring date of pack from 2nd cycle of the
              pack
            </Text>
          </View>

          {/* Okay Button */}
          <BlueButton
            title="Okay"
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginTop: 10,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  infoBox: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  infoIcon: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default CashbackModal;
