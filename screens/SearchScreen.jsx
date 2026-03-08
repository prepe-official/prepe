import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

const SearchScreen = ({ navigation, route }) => {
  const { user } = useSelector((state) => state.user);
  const [searchQuery, setSearchQuery] = useState(
    route.params?.initialQuery || ""
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const durationMap = {
    day: "Daily",
    week: "Weekly",
    "2weeks": "Every 2 Weeks",
    "3weeks": "Every 3 Weeks",
    month: "Monthly",
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchResults(null);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    try {
      let response;
      if (user) {
        response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/pack/get-by-user-active?userId=${user._id}`
        );
      } else {
        response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/pack/get-all-active`
        );
      }
      const data = await response.json();
      if (data.success) {
        const activePacks = data.packs.filter((pack) => pack.isActive);
        const lowercasedQuery = searchQuery.toLowerCase();
        const filteredResults = activePacks.filter((pack) => {
          const { name, category, description, products } = pack;

          if (name && name.toLowerCase().includes(lowercasedQuery)) {
            return true;
          }

          if (category && category.toLowerCase().includes(lowercasedQuery)) {
            return true;
          }

          if (
            description &&
            description.toLowerCase().includes(lowercasedQuery)
          ) {
            return true;
          }

          if (
            products &&
            Array.isArray(products) &&
            products.some(
              (productName) =>
                typeof productName === "string" &&
                productName.toLowerCase().includes(lowercasedQuery)
            )
          ) {
            return true;
          }

          return false;
        });
        setSearchResults(filteredResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const onRefresh = useCallback(async () => {
    if (searchQuery.trim()) {
      setRefreshing(true);
      await handleSearch();
      setRefreshing(false);
    }
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const goBack = () => {
    navigation.goBack();
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() =>
        navigation.navigate("ProductDetail", { navigation, packId: item._id })
      }
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{
            uri:
              item.images && item.images.length > 0
                ? item.images[0]
                : "https://via.placeholder.com/150",
          }}
          style={styles.productImage}
        />
        {item.strikeoutPrice && item.strikeoutPrice > item.price && (
          <View style={styles.saveTag}>
            <Text style={styles.saveTagText}>
              Rs. {Math.round(item.strikeoutPrice - item.price)} OFF
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productDescription}>
        {item.packType !== "service"
          ? `${item.quantity} ${item.unit}/${durationMap[item.duration] || item.duration}`
          : durationMap[item.duration] || item.duration}
      </Text>
      <View style={styles.priceRowContainer}>
        {item.strikeoutPrice && item.strikeoutPrice > item.price && (
          <Text style={styles.strikeoutPrice}>
            Rs. {Math.round(item.strikeoutPrice)}
          </Text>
        )}
        <Text style={styles.currentPrice}>
          Rs. {Math.round(item.price)} / month
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Search automatically when the screen mounts
  React.useEffect(() => {
    if (searchQuery) {
      handleSearch();
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#555"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for items"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          autoFocus={true}
          placeholderTextColor="#555"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {isSearching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
        </View>
      ) : searchResults && searchResults.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#333" />
          <Text style={styles.noResultsText}>Pack Not Found!</Text>
          <TouchableOpacity onPress={goBack}>
            <Text style={styles.goBackButton}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : searchResults ? (
        <FlatList
          data={searchResults}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productList}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      ) : (
        <View style={styles.initialSearchContainer}>
          <Ionicons name="search-outline" size={80} color="#E0E0E0" />
          <Text style={styles.initialSearchText}>Search for products</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  noResultsText: {
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 20,
  },
  goBackButton: {
    color: "#000",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  initialSearchContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 80,
  },
  initialSearchText: {
    fontSize: 18,
    color: "#555",
    marginTop: 20,
  },
  productList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    overflow: "hidden",
    width: "48%",
  },
  productImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#e0e0e0",
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginHorizontal: 10,
  },
  productDescription: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
    marginHorizontal: 10,
  },
  productImageContainer: {
    position: "relative",
  },
  saveTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B8DAEF",
  },
  saveTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1994E5",
  },
  priceRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  strikeoutPrice: {
    fontSize: 12,
    color: "#888",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
});

export default SearchScreen;
