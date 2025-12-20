import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import { useSelector } from "react-redux";
import axios from "axios";

const { width: screenWidth } = Dimensions.get("window");

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
  const [carouselItems, setCarouselItems] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  const carouselRef = useRef(null);
  const autoScrollTimer = useRef(null);

  const fetchConfiguration = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
      );
      if (data.success) {
        // Filter out items without valid images
        const validItems = (data.configuration.carouselItems || []).filter(
          (item) => item.image && item.image.trim() !== ""
        );
        if (validItems.length > 0) {
          setCarouselItems(validItems);
        } else if (data.configuration.heroImage) {
          // Fallback to legacy heroImage
          setHeroImage(data.configuration.heroImage);
        }
      }
    } catch (error) {
      console.error("Failed to fetch configuration:", error);
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

  // Carousel auto-scroll
  useEffect(() => {
    if (carouselItems.length > 1) {
      autoScrollTimer.current = setInterval(() => {
        setActiveSlide((prev) => {
          const nextSlide = (prev + 1) % carouselItems.length;
          carouselRef.current?.scrollTo({
            x: nextSlide * (screenWidth - 32),
            animated: true,
          });
          return nextSlide;
        });
      }, 4000);
    }
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [carouselItems.length]);

  const handleCarouselScroll = (event) => {
    const slideWidth = screenWidth - 32;
    const offset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offset / slideWidth);
    if (currentIndex !== activeSlide && currentIndex >= 0 && currentIndex < carouselItems.length) {
      setActiveSlide(currentIndex);
    }
  };

  const handleCarouselPress = (item) => {
    if (item.packId) {
      navigation.navigate("ProductDetail", { packId: item.packId });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1994E5" />
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
        {/* Promo Banner Carousel */}
        <View style={styles.carouselContainer}>
          {carouselItems.length > 0 ? (
            <>
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleCarouselScroll}
                scrollEventThrottle={16}
                style={styles.carousel}
              >
                {carouselItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={item.packId ? 0.8 : 1}
                    onPress={() => handleCarouselPress(item)}
                    style={styles.carouselSlide}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {carouselItems.length > 1 && (
                <View style={styles.dotsContainer}>
                  {carouselItems.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        activeSlide === index && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
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
          )}
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
                <View style={styles.productImageContainer}>
                  <Image
                    source={{ uri: product.images[0] }}
                    style={styles.productImage}
                  />
                  {product.strikeoutPrice && product.strikeoutPrice > product.price && (
                    <View style={styles.saveTag}>
                      <Text style={styles.saveTagText}>
                        Rs. {Math.round(product.strikeoutPrice - product.price)} OFF
                      </Text>
                    </View>
                  )}
                </View>
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
    backgroundColor: "#f7f7f7",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  carouselContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  carousel: {
    borderRadius: 15,
    overflow: "hidden",
  },
  carouselSlide: {
    width: screenWidth - 32,
    height: 170,
    borderRadius: 15,
    overflow: "hidden",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#1994E5",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  promoBanner: {
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
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    overflow: "hidden",
    width: "48%",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: "relative",
  },
  saveTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
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
