import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { useDispatch } from "react-redux";
import { setCity } from "../store/slices/citySlice";
import axios from "axios";

const { width, height } = Dimensions.get("window");

export default function CitySelectionScreen({ navigation }) {
  const dispatch = useDispatch();
  const [selectedCity, setSelectedCity] = useState(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/configuration/get`
      );

      if (data.success && data.configuration.supportedCities) {
        const cityItems = data.configuration.supportedCities.map((city) => ({
          label: city.isActive === false ? `${city.name} (Coming Soon)` : city.name,
          value: city.name,
          disabled: city.isActive === false,
        }));

        setItems(cityItems);
      } else {
        setError("No cities available");
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      setError("Failed to load cities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedCity) {
      dispatch(setCity(selectedCity));
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Blue curved background */}
      <View style={styles.blueBackground} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Which city are you{"\n"}based of?</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading cities...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchCities}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dropdownContainer}>
              <DropDownPicker
                open={open}
                value={selectedCity}
                items={items}
                setOpen={setOpen}
                setValue={setSelectedCity}
                setItems={setItems}
                placeholder="Select a city"
                style={styles.dropdown}
                textStyle={styles.dropdownText}
                dropDownContainerStyle={styles.dropdownList}
                listItemContainerStyle={styles.dropdownItem}
                listItemLabelStyle={styles.dropdownItemLabel}
                selectedItemLabelStyle={styles.selectedItemLabel}
                placeholderStyle={styles.placeholderStyle}
                disabledStyle={styles.disabledItem}
                disabledItemContainerStyle={styles.disabledItemContainer}
                disabledItemLabelStyle={styles.disabledItemText}
                zIndex={5000}
                zIndexInverse={1000}
                listMode="SCROLLVIEW"
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                maxHeight={250}
                ArrowDownIconComponent={() => (
                  <Ionicons name="chevron-down" size={22} color="#333" />
                )}
                ArrowUpIconComponent={() => (
                  <Ionicons name="chevron-up" size={22} color="#333" />
                )}
              />
            </View>
          )}

          {/* Info text */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={22} color="#fff" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Couldn't Able To Select Or Find Your City?{"\n"}
              Its Because We're Growing And May Not Be{"\n"}
              Available In Your City.
            </Text>
          </View>
        </View>
      </View>

      {/* Next Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedCity || loading) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedCity || loading}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  blueBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width * 1.5,
    height: height * 0.75,
    backgroundColor: "#1b94e4",
    borderBottomRightRadius: width * 1.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -height * 0.08,
    overflow: "visible",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 36,
  },
  dropdownContainer: {
    width: "100%",
    zIndex: 5000,
    elevation: 5000,
    marginBottom: 35,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderColor: "#E5E5E5",
    borderRadius: 8,
    borderWidth: 1,
    elevation: 5000,
  },
  dropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 15,
    paddingHorizontal: 16,
    justifyContent: "center",
    height: 50,
  },
  dropdownItemLabel: {
    fontSize: 16,
    color: "#333",
    lineHeight: 20,
  },
  placeholderStyle: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
  },
  selectedItemLabel: {
    fontWeight: "600",
    color: "#1b94e4",
  },
  disabledItem: {
    backgroundColor: "#F8F8F8",
    opacity: 1,
  },
  disabledItemContainer: {
    backgroundColor: "#F8F8F8",
  },
  disabledItemText: {
    color: "#999",
    textDecorationLine: "none",
  },
  infoContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  infoIcon: {
    marginBottom: 10,
    opacity: 0.9,
  },
  infoText: {
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.95,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  errorText: {
    fontSize: 15,
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#1b94e4",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 35,
    paddingTop: 15,
    backgroundColor: "#fff",
  },
  nextButton: {
    backgroundColor: "#1b94e4",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
