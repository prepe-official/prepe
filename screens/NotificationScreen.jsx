import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useSelector } from "react-redux";
import MenuHeader from "../components/MenuHeader";
import BlueButton from "../components/BlueButton";

const NotificationScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Mark notifications as read. Don't await, just fire and forget.
    fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/notification/mark-read-by-user?userId=${user._id}`,
      {
        method: "PUT",
      }
    ).catch((err) => {
      console.error("Failed to mark notifications as read:", err);
    });

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/notification/get-by-user?userId=${user._id}`
      );
      const data = await response.json();
      if (data.success) {
        const now = new Date();
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
        const validNotifications = [];

        for (const notification of data.data) {
          if (notification.orderId) {
            const createdAt = new Date(notification.orderId.deliveryDate);
            const isOldConfirmation =
              notification.type === "confirmation" &&
              !notification.isConfirmed &&
              now.getTime() - createdAt.getTime() > twentyFourHoursInMs;

            if (isOldConfirmation) {
              // Delete old, unconfirmed notifications and don't show them
              fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/notification/delete?id=${notification._id}`,
                {
                  method: "DELETE",
                }
              ).catch((err) =>
                console.error(
                  `Failed to delete notification ${notification._id}:`,
                  err
                )
              );
            } else {
              validNotifications.push(notification);
            }
          } else {
            validNotifications.push(notification);
          }
        }
        setNotifications(validNotifications);
      } else {
        setError(data.error || "Failed to fetch notifications");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [user, fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleConfirm = async (notificationId, orderId) => {
    if (!orderId) {
      setError("Order ID not found for this notification.");
      return;
    }
    setConfirmingId(notificationId);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/order/mark-confirmed`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationId, orderId }),
        }
      );
      const data = await response.json();
      if (data.success) {
        await fetchNotifications();
      } else {
        setError(data.error || "Failed to confirm delivery");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReject = async (notificationId, orderId) => {
    if (!orderId) {
      setError("Order ID not found for this notification.");
      return;
    }
    setRejectingId(notificationId);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/order/mark-rejected`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationId, orderId }),
        }
      );
      const data = await response.json();
      if (data.success) {
        await fetchNotifications();
      } else {
        setError(data.error || "Failed to reject delivery");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRejectingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderNotificationItem = (item) => {
    const dateText = formatDate(item.createdAt);
    if (item.type === "confirmation" && !item.isConfirmed) {
      const isConfirming = confirmingId === item._id;
      const isRejecting = rejectingId === item._id;
      return (
        <View key={item._id} style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.packId?.name}</Text>
            {item.packId?.category && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{item.packId.category}</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>{dateText}</Text>
          {item.packId && item.packId.packType !== "service" && (
            <Text style={styles.quantityText}>
              {item.packId.quantity} {item.packId.unit}/{item.packId.duration}
            </Text>
          )}
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.actionText}>Please Confirm Delivery</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.notReceivedButton}
              onPress={() => setSelectedNotification(item)}
              disabled={isConfirming || isRejecting}
            >
              {isRejecting ? (
                <ActivityIndicator size="small" color="#F25555" />
              ) : (
                <Text style={styles.notReceivedButtonText}>Not Received</Text>
              )}
            </TouchableOpacity>
            <BlueButton
              title={isConfirming ? "Confirming..." : "Confirm"}
              onPress={() => handleConfirm(item._id, item.orderId)}
              style={{ flex: 1, marginLeft: 8 }}
              disabled={isConfirming || isRejecting}
            />
          </View>
        </View>
      );
    } else if (item.type === "skipped") {
      return (
        <View key={item._id} style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <View style={[styles.typeBadge, styles.skippedBadge]}>
              <Text style={styles.skippedBadgeText}>Skipped</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{dateText}</Text>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      );
    } else {
      // General notification for other types
      return (
        <View key={item._id} style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <View style={[styles.typeBadge, styles.generalBadge]}>
              <Text style={styles.generalBadgeText}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{dateText}</Text>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      );
    }
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1b94e4" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      );
    }

    if (!user) {
      return (
        <View style={styles.centered}>
          <Text>Please log in to see your notifications.</Text>
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.centered}>
          <Text>You have no notifications.</Text>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {notifications.map(renderNotificationItem)}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Notification" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>
      <Modal
        visible={!!selectedNotification}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.notificationTitle}>
                {selectedNotification?.packId?.name}
              </Text>
              <TouchableOpacity onPress={() => setSelectedNotification(null)}>
                <Text style={{ fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedNotification?.packId && selectedNotification.packId.packType !== "service" && (
              <Text style={styles.quantityText}>
                {selectedNotification.packId.quantity}{" "}
                {selectedNotification.packId.unit}/
                {selectedNotification.packId.duration}
              </Text>
            )}

            <Text style={styles.messageText}>
              Your provider has marked your benefits as delivered. If you did
              not receive them, please confirm now so we can start an
              investigation. Our team will contact you within 24 hours.
            </Text>

            <Text style={{ fontWeight: "700", marginTop: 10 }}>
              Note: Providing false information may result in account
              suspension.
            </Text>

            <TouchableOpacity
              style={styles.confirmRejectButton}
              onPress={() => {
                handleReject(
                  selectedNotification._id,
                  selectedNotification.orderId
                );
                setSelectedNotification(null);
              }}
            >
              <Text style={styles.confirmRejectText}>Yes, Not Received!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b94e4",
    marginBottom: 20,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmRejectButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#F25555",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmRejectText: {
    color: "#F25555",
    fontWeight: "700",
    fontSize: 16,
  },

  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "left",
  },
  typeBadge: {
    backgroundColor: "#f8d56f",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#000",
  },
  typeBadgeText: {
    color: "#000",
    fontWeight: "600",
  },
  skippedBadge: {
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#000",
  },
  skippedBadgeText: {
    color: "#FFFFFF",
  },
  generalBadge: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  generalBadgeText: {
    color: "#333",
    fontWeight: "600",
  },
  quantityText: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "700",
    color: "#333",
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },

  messageText: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 10,
    lineHeight: 20,
  },
  actionText: {
    color: "#1b94e4",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  notReceivedButton: {
    borderWidth: 1,
    borderColor: "#F25555",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
    height: 52,
  },
  notReceivedButtonText: {
    color: "#F25555",
    fontWeight: "600",
  },
});

export default NotificationScreen;
