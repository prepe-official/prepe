import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
  Pressable,
  Switch,
  SectionList,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MenuHeader from "../components/MenuHeader";
import BlueButton from "../components/BlueButton";
import { useSelector } from "react-redux";
import axios from "axios";

const SubscriptionsScreen = () => {
  const navigation = useNavigation();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("Latest");

  const [subscriptions, setSubscriptions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useSelector((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingOrders = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/order/get-by-user?userId=${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        const filteredData = data.orders.filter(
          (p) => p.status === "delivered" || p.status === "pending"
        );
        const formattedOrders = filteredData.map((order) => ({
          id: order._id,
          packId: order.packId._id,
          name: order.packId.name,
          quantity: order.packId.packType !== "service"
            ? `${order.packId.quantity} ${order.packId.unit}`
            : "",
          deliveryDate: new Date(order.deliveryDate).toLocaleDateString(
            "en-GB"
          ),
          createdAt: order.createdAt,
        }));
        setPendingOrders(formattedOrders);
      }
    } catch (err) {
      console.error("Failed to fetch pending orders:", err);
    }
  }, [user, token]);

  const fetchSubscriptions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/get-by-user?userId=${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        const formattedSubscriptions = data.subscriptions.map((sub) => ({
          id: sub._id,
          packId: sub.packId._id,
          name: sub.packId.name,
          quantity: sub.packId.packType !== "service"
            ? `${sub.packId.quantity} ${sub.packId.unit} / Day`
            : "",
          subscriptionDate: new Date(sub.createdAt).toLocaleDateString("en-GB"),
          expiryDate: new Date(sub.expiryDate).toLocaleDateString("en-GB"),
          price: sub.packId.totalAmount,
          isAutopay: sub.isAutopay,
          createdAt: sub.createdAt,
        }));
        setSubscriptions(formattedSubscriptions);

        // 🔔 Check for today's subscription with autopay enabled
        const today = new Date().toLocaleDateString("en-GB");
        console.log(today);

        const newSub = formattedSubscriptions.find(
          (sub) =>
            new Date(sub.createdAt).toLocaleDateString("en-GB") === today &&
            sub.isAutopay
        );

        formattedSubscriptions.map((sub) => {
          console.log(new Date(sub.createdAt).toLocaleDateString("en-GB"));
        });

        console.log(newSub);

        if (newSub) {
          Alert.alert(
            "Autopay Enabled",
            `Autopay is enabled for the newly added pack ${newSub.name}. The autopay feature allows the pack to renew automatically by deducting money from your wallet. You'll be notified in case of insufficient wallet balance.`
          );
        }
      } else {
        setError(data.message || "Failed to fetch subscriptions.");
      }
    } catch (err) {
      setError(
        err.message || "An error occurred while fetching subscriptions."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchSubscriptions();
    fetchPendingOrders();
  }, [fetchSubscriptions, fetchPendingOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchSubscriptions(), fetchPendingOrders()]);
    setRefreshing(false);
  }, [fetchSubscriptions, fetchPendingOrders]);

  const handleToggleAutopay = async (subscriptionId) => {
    const originalSubscriptions = [...subscriptions];

    setSubscriptions((prevSubscriptions) =>
      prevSubscriptions.map((sub) =>
        sub.id === subscriptionId ? { ...sub, isAutopay: !sub.isAutopay } : sub
      )
    );

    try {
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/toggle-autopay?id=${subscriptionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      setSubscriptions(originalSubscriptions);
      setError(
        err.response?.data?.message ||
        "An error occurred while updating autopay."
      );
      console.error(err);
    }
  };

  // Filter subscriptions based on search query
  const filteredSubscriptions = subscriptions.filter((subscription) =>
    subscription.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort subscriptions based on selected option
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    switch (sortOption) {
      case "Latest":
        return (
          new Date(b.subscriptionDate.split("/").reverse().join("/")) -
          new Date(a.subscriptionDate.split("/").reverse().join("/"))
        );
      case "Oldest":
        return (
          new Date(a.subscriptionDate.split("/").reverse().join("/")) -
          new Date(b.subscriptionDate.split("/").reverse().join("/"))
        );
      case "A to Z":
        return a.name.localeCompare(b.name);
      case "Z to A":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const autopayEnabled = sortedSubscriptions.filter((sub) => sub.isAutopay);
  const autopayDisabled = sortedSubscriptions.filter((sub) => !sub.isAutopay);

  const subscriptionSections = [];
  if (autopayEnabled.length > 0) {
    subscriptionSections.push({
      title: "Autopay Enabled",
      data: autopayEnabled,
    });
  }
  if (autopayDisabled.length > 0) {
    subscriptionSections.push({
      title: "Autopay Not Enabled",
      data: autopayDisabled,
    });
  }

  // Render each subscription item
  const renderItem = ({ item }) => {
    return (
      <Pressable
        onPress={() => {
          navigation.navigate("ProductDetail", {
            packId: item.packId,
          });
        }}
        style={styles.subscriptionCard}
      >
        <View>
          <Text style={styles.subscriptionName}>{item.name}</Text>
          {/* <Text style={styles.subscriptionQuantity}>{item.quantity}</Text>
          <Text style={styles.subscriptionPrice}>Rs. {item.price} / Month</Text> */}
        </View>
        <View style={styles.subscriptionDates}>
          <Text style={styles.subscriptionDate}>
            Subbed : {item.subscriptionDate}
          </Text>
          <Text style={styles.subscriptionDate}>
            Expiring : {item.expiryDate}
          </Text>
        </View>
        <View style={styles.autoPayContainer}>
          <Text style={styles.autoPayLabel}>Autopay</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#1b94e4" }}
            thumbColor={item.isAutopay ? "#ffffff" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => handleToggleAutopay(item.id)}
            value={item.isAutopay}
          />
        </View>
      </Pressable>
    );
  };

  // Render pending order item
  const renderPendingOrderItem = ({ item }) => {
    return (
      <Pressable
        onPress={() => {
          navigation.navigate("ProductDetail", {
            packId: item.packId,
          });
        }}
        style={styles.pendingOrderCard}
      >
        <View>
          <Text style={styles.pendingOrderName}>{item.name}</Text>
          <Text style={styles.pendingOrderQuantity}>{item.quantity}</Text>
        </View>
        <View style={styles.pendingOrderDates}>
          <Text style={styles.pendingOrderDate}>
            Delivery: {item.deliveryDate}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Manage Subscriptions" />

      {/* Controls Container */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.floatingFilterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="funnel-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Pending Orders Section */}
      {pendingOrders.length > 0 && (
        <View style={styles.pendingOrdersSection}>
          <Text style={styles.sectionHeader}>Pending Orders</Text>
          <FlatList
            data={pendingOrders}
            renderItem={renderPendingOrderItem}
            keyExtractor={(item) => item.id}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.pendingOrdersList}
          />
        </View>
      )}

      {/* Subscriptions List */}
      {loading && <Text style={styles.loadingText}>Loading...</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!loading && !error && (
        <SectionList
          sections={subscriptionSections}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.listContainer}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#555"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Sort Options */}
            <Text style={styles.sortTitle}>Sort</Text>
            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === "Latest" && styles.selectedSort,
              ]}
              onPress={() => setSortOption("Latest")}
            >
              <Text style={styles.sortText}>Latest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === "Oldest" && styles.selectedSort,
              ]}
              onPress={() => setSortOption("Oldest")}
            >
              <Text style={styles.sortText}>Oldest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === "A to Z" && styles.selectedSort,
              ]}
              onPress={() => setSortOption("A to Z")}
            >
              <Text style={styles.sortText}>A to Z</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                sortOption === "Z to A" && styles.selectedSort,
              ]}
              onPress={() => setSortOption("Z to A")}
            >
              <Text style={styles.sortText}>Z to A</Text>
            </TouchableOpacity>

            {/* Filter Button */}
            <BlueButton
              title="Filter"
              onPress={() => setFilterModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 16,
  },
  floatingFilterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  subscriptionCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedSubscriptionCard: {
    backgroundColor: "#FEF7E5",
    borderColor: "#FDB813",
  },
  checkmarkIcon: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  subscriptionQuantity: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
    fontWeight: "700",
  },
  subscriptionPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },
  subscriptionDates: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  subscriptionDate: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  autoPayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  autoPayLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    paddingLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  sortTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  sortOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  selectedSort: {
    backgroundColor: "#f8f8f8",
  },
  sortText: {
    fontSize: 16,
    fontWeight: "500",
  },
  autoPayModalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    width: "90%",
    maxHeight: "80%",
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  autoPayModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  autoPayModalDescription: {
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
    fontWeight: "600",
  },
  packListHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 10,
  },
  packListHeaderText: {
    fontWeight: "700",
    fontSize: 16,
  },
  packItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  packItemName: {
    fontSize: 16,
  },
  packItemPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b94e4",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 18,
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    padding: 20,
    color: "red",
  },
  pendingOrdersSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  pendingOrdersList: {
    paddingBottom: 16,
  },
  pendingOrderCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pendingOrderName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  pendingOrderQuantity: {
    fontSize: 14,
    color: "#333",
  },
  pendingOrderDates: {
    marginTop: 8,
  },
  pendingOrderDate: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
});

export default SubscriptionsScreen;
