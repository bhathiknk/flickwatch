// src/components/MediaCard.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MainColors } from "../utils/MainColors";

type MediaCardProps = {
  title: string;
  posterUrl?: string | null;
  rating?: number | null;
  year?: string | null;

  // Optional extra label under title (media type, etc.)
  subtitle?: string;

  onPress?: () => void;

  // Useful if you want different sizes for Home vs Search
  variant?: "default" | "compact";

  style?: ViewStyle;
};

export default function MediaCard({
  title,
  posterUrl,
  rating,
  year,
  subtitle,
  onPress,
  variant = "default",
  style,
}: MediaCardProps) {
  const isCompact = variant === "compact";

  const safeRating =
    typeof rating === "number" && Number.isFinite(rating) ? rating : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isCompact && styles.cardCompact,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.posterWrap}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Ionicons name="image-outline" size={22} color={MainColors.textFaint} />
            <Text style={styles.posterPlaceholderText}>No poster</Text>
          </View>
        )}

        {/* Rating badge */}
        {safeRating !== null && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={MainColors.rating} />
            <Text style={styles.ratingText}>{safeRating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>

          {/* Year chip */}
          {!!year && <Text style={styles.yearChip}>{year}</Text>}
        </View>

        {!!subtitle && (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        )}

        <View style={styles.footerHint}>
          <Ionicons name="chevron-forward" size={14} color={MainColors.textFaint} />
          <Text style={styles.hintText}>Open details</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    borderRadius: 18,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,

    shadowColor: MainColors.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: "hidden",
  },
  cardCompact: {
    width: 150,
    borderRadius: 16,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },

  posterWrap: {
    width: "100%",
    height: 235,
    backgroundColor: MainColors.surface2,
  },
  poster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  posterPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  posterPlaceholderText: {
    color: MainColors.textFaint,
    fontSize: 12,
    fontWeight: "600",
  },

  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ratingText: {
    color: MainColors.text,
    fontWeight: "800",
    fontSize: 12,
  },

  body: {
    padding: 12,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    flex: 1,
    color: MainColors.text,
    fontSize: 14.5,
    fontWeight: "800",
    lineHeight: 18,
  },
  yearChip: {
    color: MainColors.text,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: MainColors.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(109,94,249,0.35)",
  },

  subtitle: {
    color: MainColors.textMuted,
    fontSize: 12.5,
    fontWeight: "600",
  },

  footerHint: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hintText: {
    color: MainColors.textFaint,
    fontSize: 12,
    fontWeight: "700",
  },
});
