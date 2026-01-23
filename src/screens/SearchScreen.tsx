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

  // input text user types
  const [query, setQuery] = useState("");

  // this one actually triggers api call after delay
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // request states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // paging
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ui friendly items for list
  const [items, setItems] = useState<UiItem[]>([]);

  // used to ignore old responses when typing fast
  const requestSeq = useRef(0);

  // 500ms debounce (req says 400-600)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);

    return () => clearTimeout(t);
  }, [query]);

  // tmdb response -> ui model
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

  // merge results so pagination doesnt duplicate rows
  const mergeUnique = useCallback((prev: UiItem[], next: UiItem[]) => {
    const map = new Map<string, UiItem>();
    for (const p of prev) map.set(`${p.mediaType}-${p.id}`, p);
    for (const n of next) map.set(`${n.mediaType}-${n.id}`, n);
    return Array.from(map.values());
  }, []);

  // one place to do search (reset or load more)
  const runSearch = useCallback(
    async (q: string, mode: "reset" | "more" = "reset") => {
      const current = ++requestSeq.current;

      if (mode === "more") {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setItems([]);
        setPage(1);
        setTotalPages(1);
      }

      setError(null);

      try {
        const nextPage = mode === "more" ? page + 1 : 1;
        const res: any = await searchMulti(q, nextPage);

        // if user typed again, ignore old result
        if (current !== requestSeq.current) return;

        const ui = mapToUi(res.results || []);
        const newPage = res.page ?? nextPage;
        const newTotal = res.total_pages ?? 1;

        setPage(newPage);
        setTotalPages(newTotal);

        setItems((prev) => (mode === "more" ? mergeUnique(prev, ui) : ui));
      } catch (e: any) {
        if (current !== requestSeq.current) return;
        setError(e?.message || "Search failed. Try again.");
        if (mode !== "more") setItems([]);
      } finally {
        if (current === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [mapToUi, mergeUnique, page]
  );

  // run when debounce query changes
  useEffect(() => {
    if (!debouncedQuery) {
      // clean view when empty
      requestSeq.current += 1;
      setItems([]);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
      setPage(1);
      setTotalPages(1);
      return;
    }

    runSearch(debouncedQuery, "reset");
  }, [debouncedQuery, runSearch]);

  // retry with same query
  const onRetry = useCallback(() => {
    if (!debouncedQuery) return;
    runSearch(debouncedQuery, "reset");
  }, [debouncedQuery, runSearch]);

  // clear everything and cancel inflight response
  const clearQuery = useCallback(() => {
    requestSeq.current += 1;
    setQuery("");
    setDebouncedQuery("");
    setItems([]);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    setPage(1);
    setTotalPages(1);
  }, []);

  // load next page when user reaches bottom
  const loadMore = useCallback(() => {
    if (!debouncedQuery) return;
    if (loading || loadingMore) return;
    if (page >= totalPages) return;

    runSearch(debouncedQuery, "more");
  }, [debouncedQuery, loading, loadingMore, page, totalPages, runSearch]);

  // small text under title depending on state
  const headerHint = useMemo(() => {
    if (!debouncedQuery) return "Search movies or TV shows from TMDB.";
    if (loading) return `Searching for "${debouncedQuery}"...`;
    if (error) return "Search failed. Try again.";
    return items.length === 0 ? "No results found." : `${items.length} results`;
  }, [debouncedQuery, loading, error, items.length]);

  // show full error page if request failed
  if (error && !loading && debouncedQuery) {
    return <ErrorState title="Search error" message={error} onRetry={onRetry} />;
  }

  return (
    <View style={styles.container}>
      {/* top header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Search</Text>
        <Text style={styles.subheading}>{headerHint}</Text>
      </View>

      {/* search input area */}
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
            // allow instant search on enter
            const q = query.trim();
            setDebouncedQuery(q);
          }}
        />

        {/* show clear only when have text */}
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

      {/* loading screen before any results */}
      {loading && items.length === 0 ? (
        <View style={{ flex: 1 }}>
          <Loading title="Searching" subtitle="Looking for matches..." />
        </View>
      ) : (
        <>
          {/* empty result view */}
          {!loading && debouncedQuery && items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={22} color={MainColors.textFaint} />
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptyText}>Try a different keyword, or check spelling.</Text>

              <Pressable
                onPress={clearQuery}
                style={({ pressed }) => [styles.emptyBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.emptyBtnText}>Clear search</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              // grid result list
              data={items}
              keyExtractor={(item) => `${item.mediaType}-${item.id}`}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onEndReachedThreshold={0.6}
              onEndReached={loadMore}
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
                // little hint when app opens and no search yet
                !debouncedQuery ? (
                  <View style={styles.initialHint}>
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={MainColors.accent}
                    />
                    <Text style={styles.initialHintText}>
                      Start typing to search movies and TV shows.
                    </Text>
                  </View>
                ) : null
              }
              ListFooterComponent={
                // show loader only when we really loading next page
                loadingMore ? (
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

  // header
  header: { paddingHorizontal: 16, paddingTop: 16, gap: 6 },
  heading: { color: MainColors.text, fontSize: 22, fontWeight: "900" },
  subheading: { color: MainColors.textMuted, fontSize: 13, fontWeight: "600" },

  // search bar
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

  // grid list
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 },
  gridRow: { justifyContent: "space-between", marginBottom: 12 },

  // first hint card
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

  // empty state
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

  // footer loading slot
  inlineLoading: { paddingVertical: 10, alignItems: "center" },
  inlineLoadingText: { color: MainColors.textFaint, fontSize: 12, fontWeight: "700" },
});
