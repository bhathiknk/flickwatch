import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import BottomTabs from "./BottomTabs";
import DetailScreen from "../screens/DetailScreen";
import CategoryScreen from "../screens/CategoryScreen";
import { MainColors } from "../utils/MainColors";

export type CategoryKind = "popular" | "trending" | "tv";

export type RootStackParamList = {
  Tabs: undefined;
  Detail: { id: number; mediaType: "movie" | "tv"; title?: string };
  Category: { kind: CategoryKind };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: MainColors.surface }} edges={["top"]}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: MainColors.surface },
            headerTitleStyle: { color: MainColors.text, fontWeight: "900" },
            headerTintColor: MainColors.text,
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="Tabs"
            component={BottomTabs}
            options={{ headerShown: false }}
          />

         <Stack.Screen
  name="Detail"
  component={DetailScreen}
  options={{ headerShown: false }}
/>

          <Stack.Screen
            name="Category"
            component={CategoryScreen}
            options={{ title: "Browse" }}
          />
        </Stack.Navigator>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}