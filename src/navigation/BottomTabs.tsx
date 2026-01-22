import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import SearchScreen from "../screens/SearchScreen";
import WatchlistScreen from "../screens/WatchlistScreen";

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Watchlist: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function BottomTabs() {
  const isIOS = Platform.OS === "ios";

  return (
    <Tab.Navigator
      // Centralized styling + icons
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",
        tabBarHideOnKeyboard: true,

        // Tab bar styling
        tabBarStyle: {
          height: isIOS ? 100 : 80,
          paddingTop: 6,
          paddingBottom: isIOS ? 16 : 10, // reduced so content moves up
          borderTopWidth: 0,
          elevation: 18,
          backgroundColor: "#ffffff",
        },

        // Important: Moves the icon + label upward inside each tab button
        tabBarItemStyle: {
          paddingTop: 2,
          paddingBottom: 20,
        },

        // Label styling
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: -2, // pulls label slightly up
        },

        tabBarActiveTintColor: "#111111",
        tabBarInactiveTintColor: "#9aa0a6",

        // Route-based icons
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = focused ? size + 2 : size;

          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else {
            iconName = focused ? "bookmark" : "bookmark-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={iconSize}
              color={color}
              style={{ marginTop: -2 }} // pulls icon up slightly
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{ title: "Watchlist" }}
      />
    </Tab.Navigator>
  );
}
