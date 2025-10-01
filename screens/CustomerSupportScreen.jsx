import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  SafeAreaView,
  Linking, // Import Linking
  ActivityIndicator, // To show a loading state
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MenuHeader from "../components/MenuHeader";
import axios from "axios"; // Import axios for API calls

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    question: "What is Prepe?",
    answer:
      "Prepe is a subscription marketplace where you can explore, subscribe, and manage packs from providers around you. You also earn wallet cashbacks on your subscriptions.",
  },
  {
    question: "How do I pay for subscriptions?",
    answer:
      "You can recharge your Prepe Wallet with money and use it to subscribe. Cashback rewards will also be credited to your wallet. (Note: wallet money cannot be withdrawn, it can only be used on Prepe).",
  },
  {
    question: "What happens if a provider doesn’t deliver?",
    answer:
      "If a provider fails to deliver your first subscription benefit within 24 hours, your order will be marked as unfulfilled and you’ll receive a full refund.",
  },
  {
    question: "Can I cancel a subscription after payment?",
    answer:
      "You can cancel within 1 hour of subscribing for a full refund.\n\nIf the provider cancels, you’ll also get a refund.",
  },
  {
    question: "How does the “Skip” option work?",
    answer:
      "In flexible pack, you can skip future delivery by choosing dates from the calendar anytime without losing value. The pack expiry date will shift accordingly.",
  },
  {
    question: "What is AutoPay?",
    answer:
      "AutoPay automatically renews your subscription when your wallet has sufficient balance. You can disable this anytime from your subscription settings.",
  },
  {
    question: "Where does my cashback go?",
    answer:
      "Cashbacks are credited directly into your Prepe Wallet. You can use them for future subscriptions, but withdrawals are not allowed.",
  },
  {
    question: "How do I confirm delivery from the provider?",
    answer:
      "You’ll receive a notification from the provider to confirm the first delivery of benefit after subscription. You may not receive the notification at the moment of delivery but after some time. Only after confirming, the subscription cycle will start.",
  },
  {
    question: "What if I have issues with a provider?",
    answer: "You can contact us. Our team will step in to help.",
  },
];

const FAQItem = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.faqContainer}>
      <TouchableOpacity style={styles.faqHeader} onPress={toggleExpand}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#333"
        />
      </TouchableOpacity>
      {expanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
    </View>
  );
};

const CustomerSupportScreen = () => {
  const navigation = useNavigation();
  const [supportInfo, setSupportInfo] = useState({ phone: "", email: "" });
  const [loading, setLoading] = useState(true);

  // Fetch configuration data when the component mounts
  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
        );
        if (data.success && data.configuration.customerSupport) {
          setSupportInfo(data.configuration.customerSupport);
        }
      } catch (error) {
        console.error("Failed to fetch configuration:", error);
        // Optionally, show an alert to the user
      } finally {
        setLoading(false);
      }
    };

    fetchConfiguration();
  }, []);

  // Function to handle calling
  const handleCall = () => {
    if (supportInfo.phone) {
      Linking.openURL(`tel:${supportInfo.phone}`);
    }
  };

  // Function to handle emailing
  const handleEmail = () => {
    if (supportInfo.email) {
      Linking.openURL(`mailto:${supportInfo.email}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MenuHeader title="Customer Support" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Frequently Asked Questions */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ_DATA.map((item, index) => (
          <FAQItem key={index} item={item} />
        ))}

        {/* Contact Us */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#222" />
        ) : (
          <View style={styles.contactButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.contactButton,
                !supportInfo.phone && styles.disabledButton,
              ]}
              onPress={handleCall}
              disabled={!supportInfo.phone}
            >
              <Text style={styles.contactButtonText}>Call Us</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.contactButton,
                !supportInfo.email && styles.disabledButton,
              ]}
              onPress={handleEmail}
              disabled={!supportInfo.email}
            >
              <Text style={styles.contactButtonText}>Email Us</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 10,
  },
  faqContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  contactButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  contactButton: {
    flex: 1,
    backgroundColor: "#222",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  contactButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    backgroundColor: "#a0a0a0",
  },
});

export default CustomerSupportScreen;
