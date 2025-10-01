import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Share,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BlueButton from "../components/BlueButton";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { updateUser } from "../store/slices/userSlice";
import Calendar from "../components/Calendar";
import { addDays, addWeeks, addMonths, isBefore, isEqual } from "date-fns";
import CashbackModal from "../components/CashbackModal";

const ProductDetailScreen = ({ navigation, route }) => {
  const { packId } = route.params || {};
  const dispatch = useDispatch();
  const [showCashbackModal, setShowCashbackModal] = useState(false); // <-- Add this state
  const [cashbackWon, setCashbackWon] = useState(0); // <-- Add this state
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] =
    useState(false);
  // Image dots indicator state
  const [activeDot, setActiveDot] = useState(0);
  // Modal visibility state
  const [modalVisible, setModalVisible] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const [isSkipModalVisible, setSkipModalVisible] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showSkipNotAvailableModal, setShowSkipNotAvailableModal] =
    useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [product, setProduct] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Get isLoggedIn state from redux
  const { isLoggedIn, user, token } = useSelector((state) => state.user);
  const [subscription, setSubscription] = useState(null);
  const [allowedDates, setAllowedDates] = useState([]);

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);

  const [ratingInput, setRatingInput] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [ratingsData, setRatingsData] = useState([]);

  const [showSkipConfirmationModal, setShowSkipConfirmationModal] =
    useState(false);
  const [showSkipSuccessModal, setShowSkipSuccessModal] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState("");

  const [config, setConfig] = useState({
    refundLink: "",
  });

  // Fetch configuration when component mounts
  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
        );
        if (data.success && data.configuration) {
          setConfig(data.configuration);
        }
      } catch (error) {
        console.error("Failed to fetch configuration:", error);
      }
    };

    fetchConfiguration();
  }, []);

  // Handle link press for refund policy
  const handleRefundPolicyPress = async () => {
    if (!config.refundLink) return;
    const supported = await Linking.canOpenURL(config.refundLink);
    if (supported) {
      await Linking.openURL(config.refundLink);
    } else {
      Alert.alert(`Don't know how to open this URL: ${config.refundLink}`);
    }
  };

  const confirmSkipDay = async () => {
    setLoading(true);
    setShowSkipConfirmationModal(false); // Close confirmation modal
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const payload = { date: `${year}-${month}-${day}` };

      const { data } = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/skip-day?subscriptionId=${product.subscription._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        const expiry = new Date(data.subscription.expiryDate);
        // Format date to DD/MM/YYYY
        const formattedDate = `${String(expiry.getDate()).padStart(
          2,
          "0"
        )}/${String(expiry.getMonth() + 1).padStart(
          2,
          "0"
        )}/${expiry.getFullYear()}`;
        setNewExpiryDate(formattedDate);

        setSkipModalVisible(false); // Close calendar modal
        setShowSkipSuccessModal(true); // Show success modal
        setSelectedDate(null);
      } else {
        alert(data.message || "Failed to skip day.");
      }
    } catch (error) {
      console.error("Skip day error:", error);
      alert(
        "An error occurred while skipping the day. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const urlToOpenApp = "https://prepe-new.vercel.app";
      const result = await Share.share({
        message: `Check out this great pack: ${product?.name}! You can find it on our app here: ${urlToOpenApp}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log(`Shared via ${result.activityType}`);
        } else {
          // shared
          console.log("Content shared successfully!");
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log("Share dialog dismissed");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const fetchReviews = useCallback(async () => {
    try {
      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/review/get-by-pack`,
        { packId: product._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setReviews(data.data.reviews);
        setAverageRating(data.data.averageRating);
        setTotalReviewsCount(data.data.totalReviews);
      }
      const breakdown = [5, 4, 3, 2, 1].map((star) => {
        const count = data.data.reviews.filter((r) => r.rating === star).length;
        const pct = data.data.totalReviews
          ? Math.round((count / data.data.totalReviews) * 100)
          : 0;
        return { stars: star, percentage: pct };
      });

      setRatingsData(breakdown);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  }, [product?._id, token]);

  useEffect(() => {
    if (product?._id) fetchReviews();
  }, [product, fetchReviews]);

  const calculateDeliveryDates = () => {
    // only proceed if we have the two dates
    if (
      !subscription?.createdAt ||
      !subscription?.expiryDate ||
      !product?.duration
    ) {
      return;
    }

    let start = new Date(subscription.createdAt);
    switch (product.duration) {
      case "day":
        start = addDays(start, 1);
        break;
      case "week":
        start = addWeeks(start, 1);
        break;
      case "2weeks":
        start = addWeeks(start, 2);
        break;
      case "3weeks":
        start = addWeeks(start, 3);
        break;
      case "month":
        start = addDays(start, 30);
        break;
      default:
        return;
    }
    const end = new Date(subscription.expiryDate);
    const dates = [];
    let cursor = start;

    while (isBefore(cursor, end)) {
      dates.push(new Date(cursor));
      switch (product.duration) {
        case "day":
          cursor = addDays(cursor, 1);
          break;
        case "week":
          cursor = addWeeks(cursor, 1);
          break;
        case "2weeks":
          cursor = addWeeks(cursor, 2);
          break;
        case "3weeks":
          cursor = addWeeks(cursor, 3);
          break;
        case "month":
          cursor = addMonths(cursor, 1);
          break;
        default:
          return;
      }
    }

    setAllowedDates(dates);
  };

  useEffect(() => {
    if (subscription) calculateDeliveryDates();
  }, [subscription]);

  const onOpenSkipModal = () => {
    calculateDeliveryDates();
    setSkipModalVisible(true);
  };

  const fetchPack = async () => {
    setScreenLoading(true);
    if (!user) {
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/pack/get?id=${packId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        setProduct(data.pack);
      } else {
        alert(data.message || "Failed to fetch pack.");
      }
    } else {
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/pack/get?id=${packId}&userId=${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        setProduct(data.pack);
        setSubscription(data.pack.subscription);
      } else {
        alert(data.message || "Failed to fetch pack.");
      }
    }

    setScreenLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPack();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPack();
  }, [packId]);

  const skippedDays =
    product?.isSubscribed && product?.subscription?.skippedDates
      ? (() => {
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          return product.subscription.skippedDates
            .map((d) => d.substring(0, 10)) // "YYYY-MM-DD"
            .filter((dateStr) => {
              const [year, month] = dateStr.split("-").map(Number);
              return year === currentYear && month === currentMonth;
            })
            .map((dateStr) => Number(dateStr.substring(8, 10)))
            .sort((a, b) => a - b);
        })()
      : [];

  const images =
    product?.images?.length > 0
      ? [...product.images, ...(product.vendorId?.shopImages || [])]
      : ["https://images.unsplash.com/photo-1563636619-e9143da7973b"];

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveDot(viewableItems[0].index || 0);
    }
  }).current;

  const handleCashbackModalClose = () => {
    setShowCashbackModal(false);
    navigation.navigate("Main"); // Navigate away after closing
  };

  const handleSubscription = async () => {
    if (user.walletBalance < product.totalAmount) {
      setShowInsufficientBalanceModal(true);
      setShowConfirmationModal(false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: user._id,
        vendorId: product.vendorId._id,
        packId: product._id,
        cashbackAmount: product.cashback,
        totalAmount: product.totalAmount,
      };

      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/create`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        // fetch user data again
        const { data: userData } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/user/get?id=${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (userData.success) {
          dispatch(updateUser(userData.user));
        }
        fetchPack();

        setShowConfirmationModal(false);
        setCashbackWon(product.cashback); // Store cashback amount
        setShowCashbackModal(true); // Show the modal
        // alert("Subscription created successfully!");
        // navigation.navigate("Subscriptions");
      } else {
        alert(data.message || "Failed to create subscription.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
      setShowConfirmationModal(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/unsubscribe?subscriptionId=${product.subscription._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setProduct((p) => ({ ...p, isSubscribed: false }));
        fetchPack();
        setShowUnsubscribeModal(false);
        alert("Unsubscribed successfully!");
        navigation.navigate("Main");
      } else {
        alert(data.message || "Failed to unsubscribe.");
      }
    } catch (error) {
      console.error("Unsubscription error:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
      setShowUnsubscribeModal(false);
    }
  };

  const handleRenew = async () => {
    if (user.walletBalance < product.totalAmount) {
      alert("Insufficient wallet balance. Please add funds to your wallet.");
      setShowRenewModal(false);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: user._id,
        vendorId: product.vendorId._id,
        packId: product._id,
        totalAmount: product.totalAmount,
      };

      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/renew`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        // fetch user data again
        const { data: userData } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/user/get?id=${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (userData.success) {
          dispatch(updateUser(userData.user));
        }
        fetchPack();

        setShowRenewModal(false);
        alert("Subscription renewed successfully!");
        navigation.navigate("Subscriptions");
      } else {
        alert(data.message || "Failed to renew subscription.");
      }
    } catch (error) {
      console.error("Subscription renewal error:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
      setShowRenewModal(false);
    }
  };

  const handleCancelOrder = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/subscription/cancel-order?orderId=${product.orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        // fetch user data again
        const { data: userData } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/user/get?id=${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (userData.success) {
          dispatch(updateUser(userData.user));
        }
        fetchPack();
        alert("Order cancelled successfully!");
        navigation.navigate("Main");
      } else {
        alert(data.message || "Failed to cancel order.");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
      setShowCancelOrderModal(false);
    }
  };

  const handleSkipDay = () => {
    if (!selectedDate) {
      alert("Please select a date to skip.");
      return;
    }

    // Additional validation: Ensure selected date is not beyond subscription expiry
    if (subscription?.expiryDate) {
      const expiryDate = new Date(subscription.expiryDate);
      expiryDate.setHours(23, 59, 59, 999); // Set to end of day for comparison

      if (selectedDate > expiryDate) {
        alert("Cannot skip a date beyond the subscription expiry date.");
        return;
      }
    }

    setSkipModalVisible(false);
    setShowSkipConfirmationModal(true);
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color="#FFD700"
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  let nextDeliveryDate = null;
  if (product?.isSubscribed && allowedDates?.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the beginning of today for comparison

    // Create a set of skipped date strings in 'YYYY-MM-DD' format for efficient lookup
    const skippedDateStrings = new Set(
      subscription?.skippedDates?.map((d) => d.substring(0, 10)) || []
    );

    // Find the first date in allowedDates that is upcoming and not skipped
    nextDeliveryDate = allowedDates.find((date) => {
      const isUpcoming = !isBefore(date, today);
      const dateString = date.toISOString().substring(0, 10);
      const isSkipped = skippedDateStrings.has(dateString);
      return isUpcoming && !isSkipped;
    });
  }

  if (screenLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pack Detail</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
              if (isLoggedIn) {
                navigation.navigate("Notification");
              } else {
                navigation.navigate("Login");
              }
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
              if (isLoggedIn) {
                handleShare();
              } else {
                navigation.navigate("Login");
              }
            }}
          >
            <Ionicons name="share-social-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.imageContainer}>
          <FlatList
            data={images}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.productImage}
                resizeMode="cover"
              />
            )}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            decelerationRate="fast"
          />
          <View style={styles.dotsContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeDot === index ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.productInfoContainer}>
          <View style={styles.categoryContainer}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {product?.category || "Dairy"}
              </Text>
            </View>
            {averageRating > 0 && (
              <View style={styles.ratingsTag}>
                <Text style={styles.ratingsText}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  {averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.mainInfoContainer}>
            <View style={styles.leftInfo}>
              <Text style={styles.productName}>{product?.name}</Text>
              <Text style={styles.productDescription}>
                {product?.quantity} {product?.unit}/{product?.duration}
              </Text>
            </View>
            <View style={styles.rightInfo}>
              <Text style={styles.deliveryTimeLabel}>Availability</Text>
              <Text style={styles.deliveryTime}>
                {product?.deliveryTimeStart} - {product?.deliveryTimeEnd}
              </Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            {/* <Text style={styles.originalPrice}>
              Rs. {product?.strikeoutPrice}
            </Text> */}
            <Text style={styles.discountedPrice}>
              Rs. {product?.price}/Month
            </Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descText}>{product?.description}</Text>
          </View>

          <View style={styles.includeContainer}>
            <Text style={styles.includeText}>
              Pack Include -{" "}
              {product?.products.map((product) => product).join(", ")}
            </Text>
          </View>

          {product?.isSubscribed && product?.isConfirmed ? (
            <View style={styles.subscriptionInfoContainer}>
              <View style={styles.subscriptionDateRow}>
                <View>
                  <Text style={styles.subscriptionLabel}>Started :</Text>
                  <Text style={styles.subscriptionDateValue}>
                    {new Date(
                      product?.subscription?.createdAt
                    ).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.subscriptionLabel}>Expiring :</Text>
                  <Text style={styles.subscriptionDateValue}>
                    {new Date(
                      product?.subscription?.expiryDate
                    ).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              {nextDeliveryDate && (
                <View style={styles.nextDeliveryRow}>
                  <Text style={styles.subscriptionLabel}>Next Delivery :</Text>
                  <Text style={styles.subscriptionDateValue}>
                    {new Date(nextDeliveryDate).toDateString()}
                  </Text>
                </View>
              )}
              {skippedDays.length > 0 && (
                <>
                  <Text style={styles.skippedThisMonth}>
                    Skipped This Month
                  </Text>
                  <View style={styles.skippedNumbersRow}>
                    {skippedDays.map((day) => (
                      <View key={day} style={styles.skippedDayCircle}>
                        <Text style={styles.skippedDayNumber}>{day}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : (
            <Text style={styles.benefitsText}>
              You'll get your benefits deliver within 24 hours. After that it'll
              be delivered at the time mentioned by the provider.
            </Text>
          )}

          <View style={styles.ownerInfoContainer}>
            <View style={styles.ownerLeftSection}>
              <View style={styles.ownerInfo}>
                <View style={styles.ownerImageContainer}>
                  <Image
                    source={{ uri: product?.vendorId?.image }}
                    style={styles.ownerImage}
                  />
                </View>
                <Text style={styles.infoLabel}>
                  {product?.vendorId?.ownerName}
                </Text>
                <Text style={styles.infoValue}>
                  {product?.vendorId?.shopName}
                </Text>
              </View>
            </View>
            <View style={styles.ownerRightSection}>
              <Text style={styles.contactLabel}>
                {product?.vendorId?.phoneNumber}
              </Text>
              <Text style={styles.contactLabel}>
                {product?.vendorId?.email}
              </Text>
              <Text style={styles.addressText}>
                {product?.vendorId?.address}
              </Text>
            </View>
          </View>

          {product?.isSkipBenefits && (
            <TouchableOpacity
              style={styles.flexiblePackButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.flexiblePackText}>Flexible Pack</Text>
              <View style={styles.infoIcon}>
                <Ionicons name="information-circle" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <View style={styles.ratingsContainer}>
            <Text style={styles.sectionTitle}>Ratings</Text>

            <View style={styles.ratingsSummary}>
              <View style={styles.ratingScore}>
                {averageRating > 0 && (
                  <>
                    <Text style={styles.ratingNumber}>
                      {averageRating.toFixed(1)}
                    </Text>
                    {renderRatingStars(Math.round(averageRating))}
                  </>
                )}
                <Text style={styles.reviewCount}>
                  {totalReviewsCount} review
                  {totalReviewsCount !== 1 ? "s" : ""}
                </Text>
                {product?.isSubscribed && (
                  <TouchableOpacity
                    style={{ marginTop: 8 }}
                    onPress={() => setShowReviewModal(true)}
                  >
                    <Text style={styles.writeReviewText}>
                      ✏️ Write a review
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.ratingBreakdown}>
                {ratingsData.map((item, index) => (
                  <View key={index} style={styles.ratingBarContainer}>
                    <Text style={styles.ratingBarLabel}>{item.stars}</Text>
                    <View style={styles.ratingBar}>
                      <View
                        style={[
                          styles.ratingFill,
                          { width: `${item.percentage}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.ratingPercentage}>
                      {item.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerImage}>
                    <Text style={styles.reviewerInitial}>
                      {review?.userId?.name?.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>
                      {review?.userId?.name}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toDateString()}
                    </Text>
                  </View>
                </View>
                {renderRatingStars(review.rating)}
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      {product?.isExpired ? (
        <View style={styles.footer}>
          <BlueButton
            title="Renew"
            onPress={() => {
              if (isLoggedIn) {
                setShowRenewModal(true);
              } else {
                navigation.navigate("Login");
              }
            }}
            style={styles.subscribeButton}
          />
        </View>
      ) : product?.isSubscribed ? (
        product.isConfirmed === false ? (
          product.canCancel ? (
            <View style={styles.subscribedFooter}>
              <TouchableOpacity
                style={styles.cancelOrderButton}
                onPress={() => setShowCancelOrderModal(true)}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.cancelOrderButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          ) : product.isDelivered ? (
            <View style={styles.subscribedFooter}>
              <Text style={styles.waitingMessage}>
                Please Confirm the Order from the Notifications
              </Text>
            </View>
          ) : (
            <View style={styles.subscribedFooter}>
              <Text style={styles.waitingMessage}>
                Waiting for provider to provide the benefits
              </Text>
            </View>
          )
        ) : (
          <View style={styles.subscribedFooter}>
            {product?.isSkipBenefits && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  onOpenSkipModal();
                }}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.unsubscribeButton,
                !product?.isSkipBenefits && { flex: 1 }, // take full width if skip not visible
              ]}
              onPress={() => setShowUnsubscribeModal(true)}
            >
              <Text style={styles.unsubscribeButtonText}>Unsubscribe</Text>
              <View style={styles.unsubscribeIconContainer}>
                <Ionicons name="alert" size={16} color="#FF4D4D" />
              </View>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <View style={styles.footer}>
          <View style={styles.footerTopRow}>
            <Text style={styles.cashbackText}>
              Get Rs. {product?.cashback} Cashback
            </Text>
            <View style={styles.priceContainerFooter}>
              {/* <Text style={styles.footerOriginalPrice}>
                Rs. {product?.strikeoutPrice}
              </Text> */}
              <Text style={styles.footerDiscountedPrice}>
                Rs. {product?.price}/Month
              </Text>
            </View>
          </View>
          <BlueButton
            title="Subscribe & Pay"
            onPress={() => {
              if (isLoggedIn) {
                setShowConfirmationModal(true);
              } else {
                navigation.navigate("Login");
              }
            }}
            style={styles.subscribeButton}
          />
        </View>
      )}

      {/* Skip Day Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSkipModalVisible}
        onRequestClose={() => setSkipModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSkipModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.skipModalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSkipModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.skipModalTitle}>Select Date to Skip</Text>
              <Calendar
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
                skippedDates={product?.subscription?.skippedDates || []}
                allowedDates={allowedDates}
              />
              <BlueButton
                title="Confirm"
                onPress={handleSkipDay}
                disabled={!selectedDate}
                style={styles.confirmSkipButton}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Skip Not Available Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSkipNotAvailableModal}
        onRequestClose={() => setShowSkipNotAvailableModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSkipNotAvailableModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSkipNotAvailableModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <View style={styles.modalIconContainer}>
                <Ionicons name="information-circle" size={24} color="#fff" />
              </View>
              <Text style={styles.modalText}>
                This functionality is not available for this pack.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Flexible Pack Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="information-circle" size={24} color="#fff" />
              </View>
              <Text style={styles.modalText}>
                This is a flexible pack where you are allowed to skip benefits
                at the time of your convenience without any loss of total
                benefits promised by the pack. *The pack expire date will
                extend.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        animationType="slide"
        transparent
        visible={showReviewModal}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModalContainer}>
            <Text style={styles.modalTitle}>Rate this pack</Text>

            {/* Star input */}
            <View style={styles.starInputContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRatingInput(i)}>
                  <Ionicons
                    name={i <= ratingInput ? "star" : "star-outline"}
                    size={32}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment input */}
            <TextInput
              style={styles.commentInput}
              placeholder="Leave a comment (optional)"
              value={commentInput}
              onChangeText={setCommentInput}
              multiline
            />

            {/* Submit button */}
            <BlueButton
              title={submittingReview ? "Submitting..." : "Submit"}
              onPress={async () => {
                if (ratingInput < 1) {
                  alert("Please pick 1–5 stars.");
                  return;
                }
                setSubmittingReview(true);
                try {
                  const { data } = await axios.post(
                    `${process.env.EXPO_PUBLIC_API_URL}/review/create`,
                    {
                      userId: user._id,
                      vendorId: product.vendorId._id,
                      packId: product._id,
                      rating: ratingInput,
                      comment: commentInput,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  if (data.success) {
                    // refresh list & reset
                    await fetchReviews();
                    setRatingInput(0);
                    setCommentInput("");
                    setShowReviewModal(false);
                  } else {
                    alert(data.message);
                  }
                } catch (err) {
                  console.error(err);
                  alert("Failed to submit review.");
                } finally {
                  setSubmittingReview(false);
                }
              }}
              disabled={submittingReview}
            />

            <TouchableOpacity
              onPress={() => setShowReviewModal(false)}
              style={{ marginTop: 12 }}
            >
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Unsubscribe Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showUnsubscribeModal}
        onRequestClose={() => setShowUnsubscribeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnsubscribeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.confirmationModalContent}>
              <Text style={styles.confirmationTitle}>
                Confirm Unsubscription
              </Text>
              <Text style={styles.confirmationText}>
                Are you sure you want to unsubscribe from{" "}
                <Text style={{ fontWeight: "bold" }}>{product?.name}</Text>? You
                will not be able to get any Refund of this subscription.
              </Text>
              <View style={styles.confirmationButtonContainer}>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.cancelButton]}
                  onPress={() => setShowUnsubscribeModal(false)}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmButton]}
                  onPress={handleUnsubscribe}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      "Confirm"
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 1. Skip Confirmation Modal ("Are you sure?") */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSkipConfirmationModal}
        onRequestClose={() => setShowSkipConfirmationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSkipConfirmationModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.confirmationModalContent}>
              <Text style={styles.confirmationTitle}>Confirm Skip</Text>
              <Text style={styles.confirmationText}>
                You’ve chosen{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {selectedDate?.toLocaleDateString("en-GB")}
                </Text>{" "}
                to skip for the{" "}
                <Text style={{ fontWeight: "bold" }}>{product?.name}</Text>{" "}
                pack. You can’t undo this action. Are you sure you want to skip
                benefits?
              </Text>
              <View style={styles.confirmationButtonContainer}>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.cancelButton]}
                  onPress={() => setShowSkipConfirmationModal(false)}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmButton]}
                  onPress={confirmSkipDay}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      "Confirm"
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Skip Success Modal ("Successfully skipped...") */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSkipSuccessModal}
        onRequestClose={() => setShowSkipSuccessModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSkipSuccessModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.confirmationModalContent}>
              <View
                style={{
                  ...styles.modalIconContainer,
                  backgroundColor: "#1b94e4",
                  marginBottom: 20,
                }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={32}
                  color="#fff"
                />
              </View>
              <Text style={styles.confirmationTitle}>Success!</Text>
              <Text style={styles.confirmationText}>
                Benefits have been successfully skipped to the chosen dates. The
                subscription has been extended to{" "}
                <Text style={{ fontWeight: "bold" }}>{newExpiryDate}</Text>.
              </Text>
              <TouchableOpacity
                style={{
                  ...styles.confirmButton,
                  width: "100%",
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
                onPress={() => {
                  setShowSkipSuccessModal(false);
                  fetchPack(); // Refresh data after closing
                }}
              >
                <Text style={styles.confirmationButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCancelOrderModal}
        onRequestClose={() => setShowCancelOrderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCancelOrderModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.confirmationModalContent}>
              <Text style={styles.confirmationTitle}>
                Confirm Order Cancellation
              </Text>
              <Text style={styles.confirmationText}>
                Are you sure you want to cancel your order for{" "}
                <Text style={{ fontWeight: "bold" }}>{product?.name}</Text>?
              </Text>
              <View style={styles.confirmationButtonContainer}>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.cancelButton]}
                  onPress={() => setShowCancelOrderModal(false)}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>Keep Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmButton]}
                  onPress={handleCancelOrder}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>
                    {loading ? "Cancelling..." : "Yes, Cancel"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Renew Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRenewModal}
        onRequestClose={() => setShowRenewModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRenewModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.confirmationModalContent}>
              <Text style={styles.confirmationTitle}>Confirm Renewal</Text>
              <Text style={styles.confirmationText}>
                Are you sure you want to renew your subscription to{" "}
                <Text style={{ fontWeight: "bold" }}>{product?.name}</Text> for{" "}
                <Text style={{ fontWeight: "bold" }}>
                  Rs. {product?.totalAmount}/Month
                </Text>
                ?
              </Text>
              <View style={styles.confirmationButtonContainer}>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.cancelButton]}
                  onPress={() => setShowRenewModal(false)}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmButton]}
                  onPress={handleRenew}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      "Confirm"
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirmation Modal */}
      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmationModal}
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirmationModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.confirmationModalContent}>
              <Text style={styles.confirmationTitle}>Confirm Subscription</Text>
              <Text style={styles.confirmationText}>
                Are you sure you want to subscribe to{" "}
                <Text style={{ fontWeight: "bold" }}>{product?.name}</Text>?
              </Text>

              <Text style={styles.confirmationDetailsText}>
                You'll get full refund if you cancel the pack before provider
                delivers to you (from Manage Subscription Screen) or in case
                provider will not be able to provide the benefits within 24
                hours.
              </Text>
              <Text style={styles.confirmationDetailsText}>
                Learn More about{" "}
                <Text style={styles.linkText} onPress={handleRefundPolicyPress}>
                  Refund Policy
                </Text>
              </Text>

              {/* Price Breakdown */}
              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Pack Price:</Text>
                  <Text style={styles.priceValue}>₹{product?.price}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Platform Fees:</Text>
                  <Text style={styles.priceValue}>
                    ₹{(product?.totalAmount - product?.price).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { fontWeight: "bold" }]}>
                    Total Price:
                  </Text>
                  <Text style={[styles.priceValue, { fontWeight: "bold" }]}>
                    ₹{product?.totalAmount} / month
                  </Text>
                </View>
              </View>

              <Text style={styles.cashback}>
                Get 3% Instant Cashback in Your Wallet
              </Text>

              <View style={styles.confirmationButtonContainer}>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.cancelButton]}
                  onPress={() => setShowConfirmationModal(false)}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.confirmButton]}
                  onPress={handleSubscription}
                  disabled={loading}
                >
                  <Text style={styles.confirmationButtonText}>
                    {loading ? "Subscribing..." : "Confirm"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Insufficient Balance Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showInsufficientBalanceModal}
        onRequestClose={() => setShowInsufficientBalanceModal(false)}
      >
        <View style={styles.insufficientBalanceModalOverlay}>
          <View style={styles.insufficientBalanceModalContainer}>
            <View style={styles.insufficientBalanceModalContent}>
              {/* Icon */}
              <View style={styles.insufficientBalanceIconContainer}>
                <Ionicons name="wallet-outline" size={48} color="#FF6B6B" />
              </View>

              {/* Title */}
              <Text style={styles.insufficientBalanceTitle}>
                Insufficient Balance
              </Text>

              {/* Message */}
              <Text style={styles.insufficientBalanceMessage}>
                Your wallet balance is insufficient to complete this purchase.
                Please add funds to continue.
              </Text>

              {/* Current Balance Display */}
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Current Balance:</Text>
                <Text style={styles.balanceAmount}>
                  ₹{user?.walletBalance || 0}
                </Text>
              </View>

              {/* Required Amount Display */}
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Required Amount:</Text>
                <Text style={styles.requiredAmount}>
                  ₹{product?.totalAmount || 0}
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.insufficientBalanceButtonContainer}>
                <TouchableOpacity
                  style={styles.cancelButtonStyle}
                  onPress={() => setShowInsufficientBalanceModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.walletButtonStyle}
                  onPress={() => {
                    setShowInsufficientBalanceModal(false);
                    navigation.navigate("Recharge");
                  }}
                >
                  <Text style={styles.walletButtonText}>Go to Wallet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <CashbackModal
        visible={showCashbackModal}
        amount={cashbackWon}
        onClose={handleCashbackModalClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  backButton: {
    padding: 5,
    zIndex: 1,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 4,
    zIndex: 1,
  },
  headerIcon: {
    marginLeft: 15,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#CCCCCC",
    position: "relative",
  },
  productImage: {
    width: Dimensions.get("window").width,
    height: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 15,
    width: "100%",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#333",
  },
  inactiveDot: {
    backgroundColor: "#E0E0E0",
  },
  productInfoContainer: {
    padding: 16,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingsTag: {
    alignSelf: "flex-end",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginBottom: 10,
  },
  ratingsText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#fff",
  },
  priceBreakdown: {
    marginVertical: 12,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    width: "100%",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: "#555",
  },
  priceValue: {
    fontSize: 14,
    color: "#000",
  },

  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: "#f8d56f",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  categoryText: {
    fontWeight: "700",
    fontSize: 12,
  },
  mainInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  waitingMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 10,
    marginHorizontal: "auto",
  },

  leftInfo: {
    flex: 1,
  },
  rightInfo: {
    alignItems: "flex-end",
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
  },
  productDescription: {
    fontSize: 14,
    color: "#333",
    fontWeight: "700",
  },
  deliveryTimeLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  nextDeliveryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  deliveryTime: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  originalPrice: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    textDecorationLine: "line-through",
    marginRight: 10,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  descriptionContainer: {
    marginVertical: 10,
  },
  descText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#000",
    fontWeight: "500",
  },
  includeContainer: {
    marginVertical: 10,
  },
  includeText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#000",
    fontWeight: "500",
  },
  benefitsText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#000",
    fontWeight: "500",
    marginVertical: 15,
  },
  subscriptionInfoContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 15,
    marginVertical: 15,
  },
  subscriptionDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  subscriptionLabel: {
    fontSize: 16,
    color: "#333",
  },
  subscriptionDateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  skippedThisMonth: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 10,
  },
  skippedNumbersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  skippedDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  skippedDayNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  ownerInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#F5F5F5",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  ownerLeftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  ownerRightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  ownerInfo: {
    flex: 1,
    alignItems: "center",
  },
  ownerImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D9D9D9",
    justifyContent: "center",
  },
  // inside your StyleSheet.create({ … })
  writeReviewText: {
    color: "#007BFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // modal backdrop
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewModalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  starInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    height: 80,
    padding: 8,
    marginBottom: 12,
    textAlignVertical: "top",
  },

  ownerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  contactLabel: {
    fontSize: 14,
    color: "#333",
    textAlign: "right",
  },
  addressText: {
    fontSize: 14,
    textAlign: "right",
    marginTop: 5,
  },
  flexiblePackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 10,
    marginVertical: 10,
  },
  flexiblePackText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoIcon: {
    marginLeft: 8,
    backgroundColor: "#333",
    borderRadius: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 15,
  },
  ratingsContainer: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },
  ratingsSummary: {
    flexDirection: "row",
    marginBottom: 20,
  },
  ratingScore: {
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 20,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: "700",
  },
  starsContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  reviewCount: {
    fontSize: 12,
    color: "#333",
    marginTop: 5,
  },
  ratingBreakdown: {
    flex: 1,
    justifyContent: "center",
  },
  ratingBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  ratingBarLabel: {
    fontSize: 12,
    width: 20,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginHorizontal: 5,
  },
  ratingFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 4,
  },
  ratingPercentage: {
    fontSize: 12,
    width: 30,
    textAlign: "right",
  },
  reviewItem: {
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 15,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  reviewerInitial: {
    fontSize: 18,
    fontWeight: "700",
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontWeight: "700",
  },
  reviewDate: {
    fontSize: 12,
    color: "#333",
  },
  reviewComment: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 10,
  },
  loadMoreText: {
    fontSize: 16,
    marginRight: 5,
    color: "#333",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  subscribedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#fff",
  },
  skipButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  unsubscribeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: "#FF4D4D",
  },
  unsubscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  unsubscribeIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  footerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cashbackText: {
    color: "#1b94e4",
    fontSize: 16,
    fontWeight: "600",
  },
  cashback: {
    color: "#1b94e4",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    backgroundColor: "#1b94e437",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: "95%",
    textAlign: "center",
  },
  priceContainerFooter: {
    alignItems: "flex-end",
  },
  footerOriginalPrice: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    textDecorationLine: "line-through",
    marginRight: 10,
  },
  footerDiscountedPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  subscribeButton: {
    marginBottom: 20,
    // No specific styles needed if BlueButton handles its own styling for width
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalIconContainer: {
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 50,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  confirmationModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  confirmationText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmationDetailsText: {
    fontSize: 14,
    textAlign: "left",
    marginBottom: 10,
    color: "black",
    lineHeight: 18,
    width: "100%",
  },
  confirmationButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#a9a9a9",
  },
  confirmButton: {
    backgroundColor: "#1b94e4",
  },
  confirmationButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  linkText: {
    color: "#007BFF",
  },
  skipModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  skipModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  confirmSkipButton: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelOrderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#FF4D4D",
  },
  cancelOrderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Insufficient Balance Modal Styles
  insufficientBalanceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  insufficientBalanceModalContainer: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  insufficientBalanceModalContent: {
    padding: 25,
    alignItems: "center",
  },
  insufficientBalanceIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FFE4E4",
  },
  insufficientBalanceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  insufficientBalanceMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "bold",
  },
  requiredAmount: {
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "bold",
  },
  insufficientBalanceButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 25,
    gap: 12,
  },
  cancelButtonStyle: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  walletButtonStyle: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1b94e4",
    alignItems: "center",
    shadowColor: "#1b94e4",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  walletButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProductDetailScreen;
