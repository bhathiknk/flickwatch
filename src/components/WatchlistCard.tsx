import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { MainColors } from "../utils/MainColors";
import { getPosterUrl } from "../utils/image";

type Props = {
  title: string;
  mediaType: "movie" | "tv";
  posterPath: string | null;
  onPress: () => void;
  onRemove: () => void;
};

export default function WatchlistCard({
  title,
  mediaType,
  posterPath,
  onPress,
  onRemove,
}: Props) {
  // turn stored posterPath into a full tmdb url
  const poster = getPosterUrl(posterPath, "w185");

  return (
    <Pressable
      // whole card opens detail
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* poster */}
      <View style={styles.posterWrap}>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.poster} />
        ) : (
          <View style={styles.posterFallback}>
            <Ionicons name="image-outline" size={18} color={MainColors.textFaint} />
            <Text style={styles.posterFallbackText}>no poster</Text>
          </View>
        )}
      </View>

      {/* info */}
      <View style={styles.body}>
        {/* top row: type chip + remove */}
        <View style={styles.topRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{mediaType === "movie" ? "movie" : "tv"}</Text>
          </View>

          <Pressable
            // remove stays separate to avoid accidental open
            onPress={onRemove}
            hitSlop={10}
            style={({ pressed }) => [styles.removeBtn, pressed && styles.removePressed]}
          >
            <Ionicons name="trash-outline" size={16} color={MainColors.white} />
          </Pressable>
        </View>

        {/* title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* small hint line */}
        <View style={styles.bottomRow}>
          <Ionicons name="play-circle-outline" size={14} color={MainColors.textFaint} />
          <Text style={styles.bottomText}>tap to open details</Text>
        </View>
      </View>

      {/* subtle accent strip */}
      <View style={styles.accentStrip} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // main card container
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
    shadowColor: MainColors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    minHeight: 96,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },

  // poster block
  posterWrap: {
    width: 74,
    height: 102,
    backgroundColor: MainColors.surface2,
  },
  poster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  posterFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  posterFallbackText: {
    color: MainColors.textFaint,
    fontSize: 11,
    fontWeight: "800",
  },

  // content block
  body: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  // top row (chip + remove)
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: MainColors.sectionChipBg,
    borderWidth: 1,
    borderColor: MainColors.sectionChipBorder,
  },
  chipText: {
    color: MainColors.text,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  // remove button
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MainColors.danger,
  },
  removePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // title
  title: {
    color: MainColors.text,
    fontSize: 14.5,
    fontWeight: "900",
    lineHeight: 18,
  },

  // bottom hint row
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bottomText: {
    color: MainColors.textFaint,
    fontSize: 12,
    fontWeight: "700",
  },

  // small accent strip on the right edge
  accentStrip: {
    width: 4,
    height: "100%",
    backgroundColor: MainColors.primary,
    opacity: 0.9,
  },
});
