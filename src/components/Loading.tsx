// src/components/Loading.tsx
import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MainColors } from "../utils/MainColors";

type LoadingProps = {
  title?: string;
  subtitle?: string;
};

export default function Loading({
  title = "Loading",
  subtitle = "Fetching content...",
}: LoadingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={MainColors.accent} />
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    alignItems: "center",
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,

    shadowColor: MainColors.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  textBlock: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    color: MainColors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    color: MainColors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
