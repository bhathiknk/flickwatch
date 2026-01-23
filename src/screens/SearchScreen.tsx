import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";

import { RootStackParamList } from "../navigation/RootNavigator";
import { MainColors } from "../utils/MainColors";

import MediaCard from "../components/MediaCard";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";

import { searchMulti, TMDBSearchItem, MediaType } from "../api/tmdb";
import { getPosterUrl, getYear } from "../utils/image";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

type UiItem = {
  id: number;
  mediaType: MediaType;
  title: string;
  posterUrl: string | null;
  year: string;
  rating: number | null;
};

export default function SearchScreen() {
  const navigation = useNavigation<NavProp>();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<UiItem[]>([]);

  // Prevent state updates after unmount / fast typing
  const requestSeq = useRef(0);

  // Debounce: 500ms (fits assignment requirement 400–600ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);

    return () => clearTimeout(t);
  }, [query]);

  const mapToUi = useCallback((raw: TMDBSearchItem[]): UiItem[] => {
    return raw.map((x: any) => {
      const isMovie = x.media_type === "movie";
      const title = isMovie ? x.title : x.name;
      const date = isMovie ? x.release_date : x.first_air_date;

      return {
        id: x.id,
        mediaType: x.media_type,
        title: title || "Untitled",
        posterUrl: getPosterUrl(x.poster_path),
        year: getYear(date),
        rating: typeof x.vote_average === "number" ? x.vote_average : null,
      };
    });
  }, []);

  const runSearch = useCallback(
    async (q: string) => {
      const current = ++requestSeq.current;

      setLoading(true);
      setError(null);

      try {
        const res = await searchMulti(q, 1);

        // Ignore older responses if user typed again quickly
        if (current !== requestSeq.current) return;

        setItems(mapToUi(res.results || []));
      } catch (e: any) {
        if (current !== requestSeq.current) return;
        setError(e?.message || "Search failed. Try again.");
        setItems([]);
      } finally {
        if (current === requestSeq.current) setLoading(false);
      }
    },
    [mapToUi]
  );

  // Fire search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      // Clear results when input is empty
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  const onRetry = useCallback(() => {
    if (!debouncedQuery) return;
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  const clearQuery = useCallback(() => {
    requestSeq.current += 1; // cancels any in-flight response
    setQuery("");
    setDebouncedQuery("");
    setItems([]);
    setError(null);
    setLoading(false);
  }, []);

  const headerHint = useMemo(() => {
    if (!debouncedQuery) return "Search movies or TV shows from TMDB.";
    if (loading) return `Searching for "${debouncedQuery}"...`;
    if (error) return "Search failed. Try again.";
    return items.length === 0 ? "No results found." : `${items.length} results`;
  }, [debouncedQuery, loading, error, items.length]);

  // Full-screen error only if we have a query and request failed
  if (error && !loading && debouncedQuery) {
    return (
      <ErrorState
        title="Search error"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Search</Text>
        <Text style={styles.subheading}>{headerHint}</Text>
      </View>

      {/* Search input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={MainColors.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search movies or TV..."
          placeholderTextColor={MainColors.textFaint}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => {
            // Allow manual search even before debounce finishes
            const q = query.trim();
            setDebouncedQuery(q);
          }}
        />

        {!!query && (
          <Pressable
            onPress={clearQuery}
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.85 }]}
            hitSlop={10}
          >
            <Ionicons name="close" size={16} color={MainColors.text} />
          </Pressable>
        )}
      </View>

      {/* Loading indicator - keep UI responsive */}
      {loading && items.length === 0 ? (
        <View style={{ flex: 1 }}>
          <Loading title="Searching" subtitle="Looking for matches..." />
        </View>
      ) : (
        <>
          {/* Empty state */}
          {!loading && debouncedQuery && items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={22} color={MainColors.textFaint} />
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptyText}>
                Try a different keyword, or check spelling.
              </Text>

              <Pressable
                onPress={clearQuery}
                style={({ pressed }) => [styles.emptyBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.emptyBtnText}>Clear search</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => `${item.mediaType}-${item.id}`}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <MediaCard
                  style={{ width: "48%" }}
                  title={item.title}
                  posterUrl={item.posterUrl}
                  rating={item.rating ?? undefined}
                  year={item.year}
                  subtitle={item.mediaType.toUpperCase()}
                  onPress={() =>
                    navigation.navigate("Detail", {
                      id: item.id,
                      mediaType: item.mediaType,
                      title: item.title,
                    })
                  }
                />
              )}
              ListHeaderComponent={
                // Helpful guidance when the screen first opens
                !debouncedQuery ? (
                  <View style={styles.initialHint}>
                    <Ionicons name="information-circle-outline" size={18} color={MainColors.accent} />
                    <Text style={styles.initialHintText}>
                      Start typing to search movies and TV shows.
                    </Text>
                  </View>
                ) : null
              }
              ListFooterComponent={
                loading && items.length > 0 ? (
                  <View style={styles.inlineLoading}>
                    <Text style={styles.inlineLoadingText}>Loading more...</Text>
                  </View>
                ) : (
                  <View style={{ height: 14 }} />
                )
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MainColors.background },

  header: { paddingHorizontal: 16, paddingTop: 16, gap: 6 },
  heading: { color: MainColors.text, fontSize: 22, fontWeight: "900" },
  subheading: { color: MainColors.textMuted, fontSize: 13, fontWeight: "600" },

  searchBar: {
    marginTop: 14,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
  },
  input: {
    flex: 1,
    color: MainColors.text,
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 0,
  },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MainColors.sectionChipBg,
    borderWidth: 1,
    borderColor: MainColors.sectionChipBorder,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },

  initialHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
    marginBottom: 14,
  },
  initialHintText: {
    flex: 1,
    color: MainColors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  emptyTitle: { color: MainColors.text, fontSize: 16, fontWeight: "900" },
  emptyText: {
    color: MainColors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: MainColors.primary,
  },
  emptyBtnText: { color: MainColors.white, fontSize: 13, fontWeight: "900" },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  inlineLoading: {
    paddingVertical: 10,
    alignItems: "center",
  },
  inlineLoadingText: {
    color: MainColors.textFaint,
    fontSize: 12,
    fontWeight: "700",
  },
});
