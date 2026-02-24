import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useSelector } from "react-redux";
import axios from "axios";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CalendarScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state) => state.user);
  const [currentMonth, setCurrentMonth] = useState(
    months[new Date().getMonth()]
  );
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showDateSelectionModal, setShowDateSelectionModal] = useState(false);
  const [years, setYears] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Generate years dynamically on component mount
  useEffect(() => {
    const currentDate = new Date();
    const currentCalendarYear = currentDate.getFullYear();
    const yearsArray = [];

    // Include current year and next 3 years
    for (let i = 0; i < 2; i++) {
      yearsArray.push(currentCalendarYear + i - 1);
    }

    setYears(yearsArray);
  }, []);

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
        setSubscriptions(data.subscriptions);
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
  }, [fetchSubscriptions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  }, [fetchSubscriptions]);

  const selectedMonthIndex = months.indexOf(currentMonth);

  const activeSubscriptionsInMonth = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, selectedMonthIndex, 1);
    const lastDayOfMonth = new Date(currentYear, selectedMonthIndex + 1, 0);

    return subscriptions.filter((sub) => {
      if (!sub.createdAt || !sub.expiryDate) {
        return false;
      }
      const createdAt = new Date(sub.createdAt);
      const expiryDate = new Date(sub.expiryDate);
      return createdAt <= lastDayOfMonth && expiryDate >= firstDayOfMonth;
    });
  }, [subscriptions, currentYear, selectedMonthIndex]);

  const expiringSubscriptions = activeSubscriptionsInMonth.filter((sub) => {
    if (!sub.expiryDate) {
      return false;
    }
    const expiryDate = new Date(sub.expiryDate);
    const firstDayOfMonth = new Date(currentYear, selectedMonthIndex, 1);
    const lastDayOfMonth = new Date(currentYear, selectedMonthIndex + 1, 0);
    return expiryDate >= firstDayOfMonth && expiryDate <= lastDayOfMonth;
  });

  const subscribedPacks = activeSubscriptionsInMonth
    .filter((sub) => {
      const createdAt = new Date(sub.createdAt);
      const firstDayOfMonth = new Date(currentYear, selectedMonthIndex, 1);
      const lastDayOfMonth = new Date(currentYear, selectedMonthIndex + 1, 0);

      return createdAt >= firstDayOfMonth && createdAt <= lastDayOfMonth;
    })
    .map((sub) => ({
      packId: sub.packId._id,
      name: sub.packId.name,
      quantity: sub.packId.packType !== "service"
        ? `${sub.packId.quantity} ${sub.packId.unit} / ${sub.packId.duration}`
        : sub.packId.duration,
      price: `Rs.${sub.packId.totalAmount} / Month`,
      date: new Date(sub.createdAt)
        .toLocaleDateString("en-GB")
        .replace(/\//g, " / "),
    }));

  const expiringPacks = expiringSubscriptions.map((sub) => ({
    packId: sub.packId._id,
    name: sub.packId.name,
    quantity: sub.packId.packType !== "service"
      ? `${sub.packId.quantity} ${sub.packId.unit} / ${sub.packId.duration}`
      : sub.packId.duration,
    price: `Rs.${sub.totalAmount} / Month`,
    date: new Date(sub.expiryDate)
      .toLocaleDateString("en-GB")
      .replace(/\//g, " / "),
  }));

  const skippedPacks = activeSubscriptionsInMonth
    .filter(
      (sub) =>
        sub.skippedDates &&
        sub.skippedDates.some((dateStr) => {
          const skippedDate = new Date(dateStr);
          return (
            skippedDate.getFullYear() === currentYear &&
            skippedDate.getMonth() === selectedMonthIndex
          );
        })
    )
    .map((sub) => ({
      packId: sub.packId._id,
      name: sub.packId.name,
      quantity: sub.packId.packType !== "service"
        ? `${sub.packId.quantity} ${sub.packId.unit} / ${sub.packId.duration}`
        : sub.packId.duration,
      skippedDates: sub.skippedDates
        .map((dateStr) => new Date(dateStr))
        .filter(
          (date) =>
            date.getFullYear() === currentYear &&
            date.getMonth() === selectedMonthIndex
        )
        .map((date) => date.getDate())
        .sort((a, b) => a - b),
    }));

  const goToPreviousMonth = () => {
    const currentMonthIndex = months.indexOf(currentMonth);

    if (currentMonthIndex === 0) {
      // If January, go to December of previous year
      setCurrentMonth(months[11]);
      setCurrentYear((prevYear) => prevYear - 1);
    } else {
      // Go to previous month
      setCurrentMonth(months[currentMonthIndex - 1]);
    }
  };

  const goToNextMonth = () => {
    const currentMonthIndex = months.indexOf(currentMonth);

    if (currentMonthIndex === 11) {
      // If December, go to January of next year
      setCurrentMonth(months[0]);
      setCurrentYear((prevYear) => prevYear + 1);
    } else {
      // Go to next month
      setCurrentMonth(months[currentMonthIndex + 1]);
    }
  };

  const selectYear = (year) => {
    setCurrentYear(year);
  };

  const selectMonth = (month) => {
    setCurrentMonth(month);
    setShowDateSelectionModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Calendar" />

      <View style={styles.calendarHeader}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={styles.arrowButton}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setShowDateSelectionModal(true);
          }}
        >
          <Text style={styles.monthYearText}>
            {currentMonth} {currentYear}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextMonth} style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {loading && <Text style={styles.loadingText}>Loading...</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !error && (
        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Packs Subbed</Text>
            {subscribedPacks.map((pack, index) => (
              <TouchableOpacity
                key={`subbed-${index}`}
                style={styles.packCard}
                onPress={() =>
                  navigation.navigate("ProductDetail", { packId: pack.packId })
                }
              >
                <View style={styles.nameContainer}>
                  <Text style={styles.packName}>{pack.name}</Text>
                  <Text style={styles.packQuantity}>{pack.quantity}</Text>
                </View>
                <View style={styles.packed}>
                  <Text style={styles.packDate}>Subbed : {pack.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Packs Expiring</Text>
            {expiringPacks.map((pack, index) => (
              <TouchableOpacity
                key={`expiring-${index}`}
                style={styles.packCard}
                onPress={() =>
                  navigation.navigate("ProductDetail", { packId: pack.packId })
                }
              >
                <View style={styles.nameContainer}>
                  <Text style={styles.packName}>{pack.name}</Text>
                  <Text style={styles.packQuantity}>{pack.quantity}</Text>
                </View>
                <View style={styles.packed}>
                  <Text style={styles.packDate}>Expiring : {pack.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Skipped Dates</Text>
            {skippedPacks.map((pack, index) => (
              <TouchableOpacity
                key={`skipped-${index}`}
                style={styles.packCard}
                onPress={() =>
                  navigation.navigate("ProductDetail", { packId: pack.packId })
                }
              >
                <View style={styles.nameContainer}>
                  <Text style={styles.packName}>{pack.name}</Text>
                  <Text style={styles.packQuantity}>{pack.quantity}</Text>
                </View>
                <View style={styles.skippedDatesContainer}>
                  <Text style={styles.skippedDatesLabel}>Skipped Dates</Text>
                  <View style={styles.skippedDatesCircles}>
                    {pack.skippedDates.map((date, i) => (
                      <View key={i} style={styles.dateCircle}>
                        <Text style={styles.dateCircleText}>{date}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add padding at the bottom for better scrolling */}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* Combined Year and Month Selection Modal */}
      <Modal
        visible={showDateSelectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateSelectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateSelectionModalContent}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowDateSelectionModal(false)}
            >
              <Ionicons name="close-circle" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Select Year</Text>

            <ScrollView
              style={styles.yearScrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearItem,
                    year === currentYear && styles.selectedYearItem,
                  ]}
                  onPress={() => selectYear(year)}
                >
                  <Text
                    style={[
                      styles.yearText,
                      year === currentYear && styles.selectedYearText,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalTitle}>Select Month</Text>

            <View style={styles.monthGrid}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthItem,
                    month === currentMonth && styles.selectedMonthItem,
                  ]}
                  onPress={() => selectMonth(month)}
                >
                  <Text
                    style={[
                      styles.monthText,
                      month === currentMonth && styles.selectedMonthText,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
  },
  arrowButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  monthYearText: {
    fontSize: 22,
    fontWeight: "700",
  },
  contentContainer: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 16,
    marginBottom: 10,
  },
  packCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    height: 90,
  },
  packName: {
    fontSize: 16,
    fontWeight: "700",
  },
  nameContainer: {
    width: "53%",
  },
  packQuantity: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
    fontWeight: "600",
  },
  packPrice: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  packed: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    height: "100%",
    paddingBottom: 12,
  },
  packDate: {
    fontSize: 14,
    color: "#333",
    textAlign: "right",
    fontWeight: "600",
  },
  skippedDatesContainer: {
    alignItems: "flex-end",
  },
  skippedDatesLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "right",
    fontWeight: "500",
  },
  skippedDatesCircles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    maxWidth: 170,
  },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    margin: 3,
  },
  dateCircleText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  dateSelectionModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    margin: 20,
  },
  closeModalButton: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 15,
    marginTop: 10,
  },
  yearScrollContainer: {
    maxHeight: 200,
    marginBottom: 30,
  },
  yearItem: {
    padding: 15,
    alignItems: "center",
    width: "100%",
  },
  selectedYearItem: {
    borderBottomWidth: 0,
    backgroundColor: "#f8d56f",
    borderRadius: 8,
  },
  yearText: {
    fontSize: 24,
    textAlign: "center",
    color: "#555",
  },
  selectedYearText: {
    color: "#000",
    fontWeight: "700",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthItem: {
    width: "30%",
    alignItems: "center",
    padding: 15,
    margin: 5,
    borderRadius: 5,
  },
  selectedMonthItem: {
    backgroundColor: "#f8d56f",
    borderRadius: 8,
  },
  monthText: {
    fontSize: 18,
  },
  selectedMonthText: {
    fontWeight: "700",
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
});

export default CalendarScreen;
