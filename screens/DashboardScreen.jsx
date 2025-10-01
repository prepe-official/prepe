import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useSelector } from "react-redux";

const DashboardScreen = ({ navigation }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOption, setSelectedOption] = useState("This Year");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  const dropdownOptions = [
    "This Month",
    "Last 3 Month",
    "Last 6 Month",
    "This Year",
  ];

  const statsMapping = {
    "This Month": "thisMonth",
    "Last 3 Month": "last3Months",
    "Last 6 Month": "last6Months",
    "This Year": "thisYear",
  };

  const selectedKey = statsMapping[selectedOption];

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setShowDropdown(false);
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?._id) {
      setLoading(false);
      setError("User not found. Please log in.");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/user/dashboard?id=${user._id}`
      );
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Dashboard" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#1b94e4" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Dashboard" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Dashboard" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>No data available to display.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Dashboard" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            {dashboardData.image ? (
              <Image
                source={{ uri: dashboardData.image }}
                style={styles.profileAvatarImage}
              />
            ) : (
              <Ionicons name="person-outline" size={40} color="#1b94e4" />
            )}
          </View>
          <Text style={styles.greeting}>Hi, {dashboardData.name}</Text>
          {dashboardData.unreadNotifications > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate("Notification")}
            >
              <Text style={styles.notification}>
                {dashboardData.unreadNotifications}{" "}
                {dashboardData.unreadNotifications === 1
                  ? "Notification"
                  : "Notifications"}{" "}
                Need Your Attention
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Financial Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>

          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Total Expense</Text>
              <Text style={styles.cardAmount}>
                ₹{dashboardData.totalExpensePerMonth}
              </Text>
              <Text style={styles.cardSubtext}>Per Month</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Total Subbed Pack</Text>
              <Text style={styles.cardAmount}>
                {dashboardData.totalSubscriptions}
              </Text>
            </View>
          </View>

          <View style={styles.wideCard}>
            <View style={styles.wideCardHeader}>
              <View></View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text style={styles.dropdownText}>{selectedOption}</Text>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>

              {/* Dropdown Menu */}
              {showDropdown && (
                <View style={styles.dropdownMenu}>
                  {dropdownOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => handleOptionSelect(option)}
                    >
                      <Text style={styles.dropdownItemText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.wideCardContent}>
              <View style={styles.wideCardColumnLeft}>
                <Text style={styles.cardAmount}>
                  ₹{dashboardData.stats[selectedKey]?.totalSaved}
                </Text>
                <Text style={styles.cardSubtext}>Total Saved</Text>
              </View>
              <View style={styles.wideCardColumnRight}>
                <Text style={styles.cardAmount}>
                  ₹{dashboardData.stats[selectedKey]?.totalSpent}
                </Text>
                <Text style={styles.cardSubtext}>Total Spent</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Cashback Earned</Text>
            <Text style={styles.cardAmount}>
              ₹{dashboardData.totalCashback}
            </Text>
          </View>
        </View>

        {/* Favorite Subscription */}
        {dashboardData.favouritePack && (
          <View style={styles.section1}>
            <Text style={styles.sectionTitle}>Favorite Subscription Pack</Text>

            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionPlan}>
                  <Text style={styles.planText}>
                    {dashboardData.favouritePack.name} @ Rs.{" "}
                    {dashboardData.favouritePack.price} Per Month
                  </Text>
                </View>
              </View>

              <View style={styles.wideCardContent}>
                <View style={styles.wideCardColumnLeft}>
                  <Text style={styles.cardAmount}>
                    {dashboardData.favouritePack.renews}
                  </Text>
                  <Text style={styles.cardSubtext}>Renewal Amt.</Text>
                </View>
                <View style={styles.wideCardColumnRight}>
                  <Text style={styles.cardAmount}>
                    ₹{dashboardData.favouritePack.totalSpent}
                  </Text>
                  <Text style={styles.cardSubtext}>Total Spent</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 16,
  },
  profileSection: {
    backgroundColor: "#1b94e4",
    alignItems: "center",
    paddingVertical: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  greeting: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  notification: {
    color: "#fff",
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  section1: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    height: 130,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  cardSubtext: {
    fontSize: 12,
    color: "#333",
    marginTop: 4,
    fontWeight: "600",
  },
  wideCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 16,
    height: 130,
    marginHorizontal: 4,
  },
  wideCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dropdownText: {
    marginRight: 4,
  },
  wideCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  wideCardColumnLeft: {
    alignItems: "flex-start",
    flex: 1,
  },
  wideCardColumnRight: {
    alignItems: "flex-end",
    flex: 1,
  },
  subscriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  subscriptionHeader: {
    marginBottom: 16,
  },
  subscriptionPlan: {
    backgroundColor: "#f8d56f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  planText: {
    fontWeight: "600",
  },
  dropdownMenu: {
    position: "absolute",
    top: 30,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
    minWidth: 140,
  },
  dropdownItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  dropdownItemText: {
    fontSize: 14,
  },
});

export default DashboardScreen;
