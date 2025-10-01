import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useSelector } from "react-redux";
import axios from "axios";

const HomeScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.user);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [heroImage, setHeroImage] = useState(null);

  const fetchConfiguration = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
      );
      if (data.success && data.configuration.heroImage) {
        setHeroImage(data.configuration.heroImage);
      }
    } catch (error) {
      console.error("Failed to fetch hero image configuration:", error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/category/get-all`
      );
      if (data.success) {
        const categoryNames = data.categories.map((c) => c.name);
        setCategories(["All", ...categoryNames]);
      } else {
        console.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchPacks = useCallback(async () => {
    try {
      const endpoint = user
        ? `${process.env.EXPO_PUBLIC_API_URL}/pack/get-by-user-active?userId=${user._id}`
        : `${process.env.EXPO_PUBLIC_API_URL}/pack/get-all-active`;

      const { data } = await axios.get(endpoint);

      if (data.success) {
        const activePacks = data.packs.filter((pack) => pack.isActive);
        setProducts(activePacks);
        setFilteredProducts(activePacks);
      } else {
        setError("Failed to fetch products");
      }
    } catch (err) {
      setError(err.message);
    } finally {
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchConfiguration(),
        fetchCategories(),
        fetchPacks(),
      ]);
    } catch (e) {
      // error state is set in individual fetchers; this is just a safety net
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchConfiguration, fetchCategories, fetchPacks]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((item) => item.category === selectedCategory)
      );
    }
  }, [selectedCategory, products]);

  const navigateToSearch = (initialQuery = "") => {
    navigation.navigate("Search", { initialQuery });
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.fullscreenLoader}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
      <Header title="Home" />

      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => navigateToSearch()}
      >
        <Ionicons
          name="search"
          size={22}
          color="#555"
          style={styles.searchIcon}
        />
        <Text style={styles.searchPlaceholder}>Search for items</Text>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryItem,
              selectedCategory === category && styles.selectedCategory,
              index === categories.length - 1 && styles.lastCategory,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.homeScrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <Image
            source={
              heroImage
                ? { uri: heroImage }
                : require("../assets/home-offer.png")
            }
            style={styles.promoBannerImage}
            resizeMode="contain"
          />
        </View>

        {/* Products Grid */}
        <View style={styles.productList}>
          <View style={styles.productRow}>
            {filteredProducts.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.productCard}
                onPress={() =>
                  navigation.navigate("ProductDetail", {
                    navigation,
                    packId: product._id,
                  })
                }
              >
                <Image
                  source={{ uri: product.images[0] }}
                  style={styles.productImage}
                />
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription}>
                  {product.quantity} {product.unit}/{product.duration}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 5,
    marginTop: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#555",
  },
  categoriesContainer: {
    paddingLeft: 16,
    paddingTop: 10,
    height: 70,
  },
  categoryItem: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    height: 40,
  },
  lastCategory: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 36,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    height: 40,
  },
  selectedCategory: {
    backgroundColor: "#e0e0e0",
  },
  categoryText: {
    fontSize: 16,
    color: "#333",
  },
  selectedCategoryText: {
    fontWeight: "700",
  },
  promoBanner: {
    marginHorizontal: 16,
    borderRadius: 15,
    overflow: "hidden",
  },
  promoBannerImage: {
    width: "100%",
    height: 170,
    borderRadius: 15,
    resizeMode: "contain",
  },
  productList: {
    paddingTop: 5,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  productCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    overflow: "hidden",
    width: "48%",
    marginBottom: 14,
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
    color: "#333",
    fontWeight: "600",
    marginBottom: 10,
    marginHorizontal: 10,
  },
  homeScrollView: {
    flexGrow: 1,
    height: "100%",
  },
  fullscreenLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HomeScreen;
