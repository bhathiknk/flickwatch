import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabs from "./BottomTabs";
import DetailScreen from "../screens/DetailScreen";

export type RootStackParamList = {
  Tabs: undefined;
  Detail: { id: number; mediaType: "movie" | "tv"; title?: string };
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
    </Stack.Navigator>
  );
}
