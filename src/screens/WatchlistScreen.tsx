import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/RootNavigator";
import { useWatchlistStore } from "../store/watchlistStore";
import { getPosterUrl } from "../utils/image";
import { MainColors } from "../utils/MainColors";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

export default function WatchlistScreen() {
  const navigation = useNavigation<NavProp>();

  // Pull only what this screen needs from the store to keep rerenders minimal
  const hydrate = useWatchlistStore((s) => s.hydrate);
  const hydrated = useWatchlistStore((s) => s.hydrated);
  const items = useWatchlistStore((s) => s.items);
  const remove = useWatchlistStore((s) => s.remove);

  useEffect(() => {
    // Hydrate once so watchlist persists after app restarts
    if (!hydrated) hydrate().catch(() => {});
  }, [hydrated, hydrate]);

  return (
    <View style={styles.container}>
      {/* Screen header */}
      <Text style={styles.heading}>Watchlist</Text>
      <Text style={styles.subheading}>Saved items from Detail screen.</Text>

      {/* Empty state keeps the screen informative even before the first save */}
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptyText}>
            Add movies or TV shows from the Detail screen.
          </Text>
        </View>
      ) : (
        <FlatList
          // List of saved items pulled from Zustand store
          data={items}
          keyExtractor={(item) => `${item.mediaType}-${item.id}`}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            // Convert stored posterPath into a TMDB image URL
            const poster = getPosterUrl(item.posterPath, "w185");

            return (
              <Pressable
                // Tap row opens the detail screen again
                onPress={() =>
                  navigation.navigate("Detail", {
                    id: item.id,
                    mediaType: item.mediaType,
                    title: item.title,
                  })
                }
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
              >
                {/* Poster thumbnail */}
                <View style={styles.posterWrap}>
                  {poster ? (
                    <Image source={{ uri: poster }} style={styles.poster} />
                  ) : (
                    <View style={styles.posterFallback}>
                      <Text style={styles.posterFallbackText}>No Image</Text>
                    </View>
                  )}
                </View>

                {/* Title + media type */}
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta}>{item.mediaType.toUpperCase()}</Text>
                </View>

                {/* Remove action (separate pressable to avoid accidental opens) */}
                <Pressable
                  onPress={() => remove(item.id, item.mediaType)}
                  style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: MainColors.background,
  },

  // Header typography
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: MainColors.text,
  },
  subheading: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: MainColors.textMuted,
  },

  // Empty state block
  emptyBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: MainColors.text },
  emptyText: { fontSize: 13, fontWeight: "600", color: MainColors.textMuted },

  // Row layout for each saved item
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
  },

  // Poster thumbnail container
  posterWrap: {
    width: 52,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: MainColors.surface2,
  },
  poster: { width: "100%", height: "100%", resizeMode: "cover" },
  posterFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  posterFallbackText: {
    fontSize: 11,
    fontWeight: "700",
    color: MainColors.textFaint,
  },

  // Text block
  info: { flex: 1, gap: 4 },
  title: { color: MainColors.text, fontSize: 14, fontWeight: "800" },
  meta: { color: MainColors.textFaint, fontSize: 12, fontWeight: "700" },

  // Remove button styling
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: MainColors.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(255,92,108,0.35)",
  },
  removeText: { color: MainColors.text, fontSize: 12, fontWeight: "800" },
});
