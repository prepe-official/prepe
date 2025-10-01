import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MenuHeader from "../components/MenuHeader";
import BlueButton from "../components/BlueButton";
import { useSelector } from "react-redux";
import axios from "axios";

const TransactionHistoryScreen = () => {
  const navigation = useNavigation();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("Latest");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useSelector((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/payment/get-by-user?userId=${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      // Handle error UI if needed
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter((transaction) => {
    if (!transaction) return false;
    const name =
      (transaction.type === "subscription"
        ? transaction.subscriptionId?.packId?.name
        : transaction.description) || transaction.type;
    return (name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort transactions based on selected option
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortOption) {
      case "Latest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "Oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "A to Z": {
        const nameA =
          (a.type === "subscription"
            ? a.subscriptionId?.packId?.name
            : a.description) || a.type;
        const nameB =
          (b.type === "subscription"
            ? b.subscriptionId?.packId?.name
            : b.description) || b.type;
        return (nameA || "").localeCompare(nameB || "");
      }
      case "Z to A": {
        const nameA =
          (a.type === "subscription"
            ? a.subscriptionId?.packId?.name
            : a.description) || a.type;
        const nameB =
          (b.type === "subscription"
            ? b.subscriptionId?.packId?.name
            : b.description) || b.type;
        return (nameB || "").localeCompare(nameA || "");
      }
      default:
        return 0;
    }
  });

  const renderSubscriptionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() =>
        navigation.navigate("TransactionDetail", {
          transaction: {
            ...item,
            originalPrice: item.packId?.price || "N/A",
            time: new Date(item.createdAt).toLocaleTimeString(),
            category: item.packId?.category || "N/A",
            provider: item.vendorId?.ownerName || "Provider Name",
            shop: item.vendorId?.shopName || "Shop Name",
            address: item.vendorId?.address || "Shop Address",
            image: item.vendorId?.image || "N/A",
            contact: {
              mobile: item.vendorId?.phoneNumber || "Mobile no.",
              email: item.vendorId?.email || "email",
            },
          },
        })
      }
    >
      <View style={{ width: "55%" }}>
        <Text style={styles.transactionName}>
          {item.packId?.name || "Subscription"}
        </Text>
        <Text style={styles.transactionQuantity}>
          {item.packId?.quantity || ""} {item.packId?.unit || ""} /{" "}
          {item.packId?.duration || ""}
        </Text>
        <Text style={styles.transactionAmount}>Rs. {item.amount}</Text>
      </View>
      <View style={styles.transactionPacked}>
        <Text style={styles.transactionDate}>
          Subbed : {new Date(item.createdAt).toLocaleDateString("en-GB")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderOtherPaymentItem = ({ item }) => {
    const isCredit = ["cashback", "refund", "walletRecharge"].includes(
      item.type
    );
    const amountColor = isCredit ? "#28a745" : "#333333";
    const amountSign = isCredit ? "+ " : "- ";
    const title =
      item.description ||
      item.type.replace(/([A-Z])/g, " $1").replace(/^./, function (str) {
        return str.toUpperCase();
      });

    return (
      <View style={[styles.transactionCard, styles.otherTransactionCard]}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={styles.otherTransactionTitle}>{title}</Text>
          <Text style={styles.otherTransactionDate}>
            {new Date(item.createdAt).toLocaleString("en-GB")}
          </Text>
        </View>
        <View style={{ justifyContent: "center", alignItems: "flex-end" }}>
          <Text style={[styles.otherTransactionAmount, { color: amountColor }]}>
            {amountSign}Rs. {item.amount}
          </Text>
        </View>
      </View>
    );
  };

  // Render each transaction item
  const renderItem = ({ item }) => {
    if (item.type === "subscription") {
      return renderSubscriptionItem({ item });
    }
    return renderOtherPaymentItem({ item });
  };

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Transaction History" />
      {/* Floating Filter Button */}
      <View style={styles.floatingFilterButtonContainer}>
        <TouchableOpacity
          style={styles.floatingFilterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="funnel-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={sortedTransactions}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>No transactions found.</Text>
            </View>
          }
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
  floatingFilterButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginRight: 10,
    marginTop: 10,
  },
  floatingFilterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    maxHeight: 120,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "700",
  },
  transactionQuantity: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
    fontWeight: "600",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginTop: 8,
  },
  transactionDate: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  transactionPacked: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    height: "100%",
    paddingBottom: 12,
  },
  otherTransactionCard: {
    minHeight: 80,
    alignItems: "center",
    paddingVertical: 12,
  },
  otherTransactionTitle: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  otherTransactionDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  otherTransactionAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyListText: {
    fontSize: 16,
    color: "#888",
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
});

export default TransactionHistoryScreen;
