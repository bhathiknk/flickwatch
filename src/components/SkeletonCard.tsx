import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MainColors } from "../utils/MainColors";
import type { ColorValue } from "react-native";

type Props = {
  variant?: "default" | "compact";
  style?: any;
};

export default function SkeletonCard({ variant = "default", style }: Props) {
  const isCompact = variant === "compact";

  // shimmer animation value
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  // move shimmer from left -> right
  const shimmerTranslateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 220],
  });

  const shimmerColors = useMemo(
  () =>
    [
      "rgba(255,255,255,0.02)",
      "rgba(255,255,255,0.12)",
      "rgba(255,255,255,0.02)",
    ] as readonly [ColorValue, ColorValue, ...ColorValue[]],
  []
);

  const Shimmer = ({ radius }: { radius: number }) => (
    <View style={[styles.shimmerWrap, { borderRadius: radius }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.shimmer, { transform: [{ translateX: shimmerTranslateX }] }]}
      >
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={shimmerColors}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );

  return (
    <View style={[styles.card, isCompact && styles.cardCompact, style]}>
      {/* poster block */}
      <View style={styles.posterWrap}>
        <View style={styles.poster} />
        <Shimmer radius={0} />

        {/* rating badge placeholder */}
        <View style={styles.ratingBadge}>
          <View style={styles.badgeDot} />
          <View style={styles.badgeText} />
          <Shimmer radius={999} />
        </View>
      </View>

      {/* body block */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleLine}>
            <Shimmer radius={999} />
          </View>

          <View style={styles.yearChip}>
            <Shimmer radius={999} />
          </View>
        </View>

        <View style={styles.subtitleLine}>
          <Shimmer radius={999} />
        </View>

        <View style={styles.footerHint}>
          <View style={styles.chev}>
            <Shimmer radius={4} />
          </View>
          <View style={styles.hintLine}>
            <Shimmer radius={999} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // match MediaCard wrapper
  card: {
    width: 170,
    borderRadius: 18,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
    overflow: "hidden",
  },
  cardCompact: {
    width: 150,
    borderRadius: 16,
  },

  // match MediaCard posterWrap
  posterWrap: {
    width: "100%",
    height: 235,
    backgroundColor: MainColors.surface2,
  },
  poster: {
    width: "100%",
    height: "100%",
    backgroundColor: MainColors.surface2,
  },

  // match rating badge placement/shape
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
    overflow: "hidden",
  },
  badgeDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  badgeText: {
    width: 28,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  // match MediaCard body
  body: {
    padding: 12,
    gap: 6,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  // these are containers so shimmer can clip inside
  titleLine: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    backgroundColor: MainColors.surface2,
    marginTop: 2,
    overflow: "hidden",
  },
  yearChip: {
    width: 44,
    height: 22,
    borderRadius: 999,
    backgroundColor: MainColors.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(109,94,249,0.35)",
    overflow: "hidden",
  },

  subtitleLine: {
    width: "55%",
    height: 12,
    borderRadius: 999,
    backgroundColor: MainColors.surface2,
    marginTop: 2,
    overflow: "hidden",
  },

  footerHint: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chev: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: MainColors.surface2,
    overflow: "hidden",
  },
  hintLine: {
    width: 80,
    height: 12,
    borderRadius: 999,
    backgroundColor: MainColors.surface2,
    overflow: "hidden",
  },

  // shimmer overlay bits
  shimmerWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 180,
  },
  shimmerGradient: {
    flex: 1,
  },
});
