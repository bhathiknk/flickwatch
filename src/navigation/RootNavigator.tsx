import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BottomTabs from "./BottomTabs";
import DetailScreen from "../screens/DetailScreen";
import CategoryScreen from "../screens/CategoryScreen";

export type CategoryKind = "popular" | "trending" | "tv";

export type RootStackParamList = {
  Tabs: undefined;
  Detail: { id: number; mediaType: "movie" | "tv"; title?: string };
  Category: { kind: CategoryKind };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={BottomTabs}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ title: "Details" }}
      />

      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        // title is set inside screen based on kind
        options={{ title: "Browse" }}
      />
    </Stack.Navigator>
  );
}
