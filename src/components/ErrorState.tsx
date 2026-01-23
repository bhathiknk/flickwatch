
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MainColors } from "../utils/MainColors";

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the content. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle" size={24} color={MainColors.danger} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <Pressable
          onPress={onRetry}
          disabled={!onRetry}
          style={({ pressed }) => [
            styles.button,
            !onRetry && styles.buttonDisabled,
            pressed && onRetry && styles.buttonPressed,
          ]}
        >
          <Ionicons name="refresh" size={18} color={MainColors.white} />
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>

        <Text style={styles.smallHint}>
          Check your internet connection if this keeps happening.
        </Text>
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
    maxWidth: 380,
    borderRadius: 18,
    padding: 18,
    gap: 10,
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MainColors.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(255,92,108,0.35)",
    marginBottom: 4,
  },
  title: {
    color: MainColors.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    color: MainColors.textMuted,
    fontSize: 13.5,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  button: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: MainColors.primary,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: MainColors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  smallHint: {
    marginTop: 4,
    color: MainColors.textFaint,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
