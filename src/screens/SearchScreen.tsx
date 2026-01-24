import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ScrollView } from "react-native";
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
import { useColorMode } from "../utils/useColorMode";

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

  const mode = useColorMode();
  const styles = useMemo(() => makeStyles(), [mode]);

  // this one actually triggers api call after delay
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // request states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // paging
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState<number | null>(null);

  // ui friendly items for list
  const [items, setItems] = useState<UiItem[]>([]);

  // used to ignore old responses when typing fast
  const requestSeq = useRef(0);

  const listRef = useRef<FlatList<UiItem>>(null);

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

  const effectiveTotalPages = useMemo(() => {
    if (!debouncedQuery) return 1;

    const pageSize = 20;

    const computedByResults =
      typeof totalResults === "number" && totalResults > 0
        ? Math.ceil(totalResults / pageSize)
        : 1;

    return Math.max(totalPages, computedByResults, 1);
  }, [debouncedQuery, totalResults, totalPages]);

  // one place to do search (reset or load more)
  const runSearch = useCallback(
    async (q: string, mode: "reset" | "more" = "reset", targetPage?: number) => {
      const current = ++requestSeq.current;

      if (mode === "more") {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setItems([]);
        setPage(1);
        setTotalPages(1);
        setTotalResults(null);
      }

      setError(null);

      try {
        const nextPage = typeof targetPage === "number" ? targetPage : 1;

        const res: any = await searchMulti(q, nextPage);

        // if user typed again, ignore old result
        if (current !== requestSeq.current) return;

        const ui = mapToUi(res.results || []);
        const newPage = res.page ?? nextPage;
        const newTotal = res.total_pages ?? 1;
        const newTotalResults = typeof res.total_results === "number" ? res.total_results : null;

        setTotalResults(newTotalResults);
        setPage(newPage);
        setTotalPages(newTotal);

        setItems(() => ui);
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
    [mapToUi, mergeUnique]
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
      setTotalResults(null);
      return;
    }

    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    runSearch(debouncedQuery, "reset");
  }, [debouncedQuery, runSearch]);

  // retry with same query
  const onRetry = useCallback(() => {
    if (!debouncedQuery) return;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
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
    setTotalResults(null);
  }, []);

  // load next page when user reaches bottom
  const loadMore = useCallback(() => {}, []);

  const goToPage = useCallback(
    (p: number) => {
      if (!debouncedQuery) return;
      if (loading || loadingMore) return;
      if (p < 1 || p > effectiveTotalPages) return;
      if (p === page) return;

      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      runSearch(debouncedQuery, "more", p);
    },
    [debouncedQuery, loading, loadingMore, effectiveTotalPages, page, runSearch]
  );

  // small text under title depending on state
  const headerHint = useMemo(() => {
    if (!debouncedQuery) return "Search movies or TV shows from TMDB.";
    if (loading || loadingMore) return `Searching for "${debouncedQuery}"...`;
    if (error) return "Search failed. Try again.";
    const shownTotal = typeof totalResults === "number" ? totalResults : items.length;
    return items.length === 0 ? "No results found." : `${shownTotal} results • Page ${page}`;
  }, [debouncedQuery, loading, loadingMore, error, items.length, page, totalResults]);

  const pager = useMemo(() => {
    if (!debouncedQuery) return null;
    if (effectiveTotalPages <= 1) return null;

    const maxButtons = 5;
    const start = Math.max(1, page - Math.floor(maxButtons / 2));
    const end = Math.min(effectiveTotalPages, start + maxButtons - 1);
    const realStart = Math.max(1, end - maxButtons + 1);

    const pages = [];
    for (let p = realStart; p <= end; p++) pages.push(p);

    return (
      <View style={styles.pagerWrap}>
        <Pressable
          onPress={() => goToPage(page - 1)}
          disabled={page <= 1 || loadingMore || loading}
          style={({ pressed }) => [
            styles.pagerBtn,
            styles.pagerBtnNav,
            (page <= 1 || loadingMore || loading) && styles.pagerBtnDisabled,
            pressed && styles.btnPressed,
          ]}
        >
          <Ionicons name="chevron-back" size={16} color={MainColors.text} />
          <Text style={styles.pagerBtnText}>Prev</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pagerNumbersScroll}
          contentContainerStyle={styles.pagerNumbers}
        >
          {realStart > 1 && (
            <>
              <Pressable
                onPress={() => goToPage(1)}
                style={({ pressed }) => [styles.pageBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.pageText}>1</Text>
              </Pressable>
              <Text style={styles.dots}>…</Text>
            </>
          )}

          {pages.map((p) => {
            const active = p === page;
            return (
              <Pressable
                key={`p-${p}`}
                onPress={() => goToPage(p)}
                style={({ pressed }) => [
                  styles.pageBtn,
                  active && styles.pageBtnActive,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={[styles.pageText, active && styles.pageTextActive]}>{p}</Text>
              </Pressable>
            );
          })}

          {end < effectiveTotalPages && (
            <>
              <Text style={styles.dots}>…</Text>
              <Pressable
                onPress={() => goToPage(effectiveTotalPages)}
                style={({ pressed }) => [styles.pageBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.pageText}>{effectiveTotalPages}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>

        <Pressable
          onPress={() => goToPage(page + 1)}
          disabled={page >= effectiveTotalPages || loadingMore || loading}
          style={({ pressed }) => [
            styles.pagerBtn,
            styles.pagerBtnNav,
            (page >= effectiveTotalPages || loadingMore || loading) && styles.pagerBtnDisabled,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.pagerBtnText}>Next</Text>
          <Ionicons name="chevron-forward" size={16} color={MainColors.text} />
        </Pressable>
      </View>
    );
  }, [debouncedQuery, effectiveTotalPages, page, loadingMore, loading, styles, goToPage]);

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
              ref={listRef}
              // grid result list
              data={items}
              key={`${debouncedQuery}-${page}`}
              extraData={page}
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
                <>
                  {loadingMore ? (
                    <View style={styles.inlineLoading}>
                      <Text style={styles.inlineLoadingText}>Loading...</Text>
                    </View>
                  ) : null}
                  {pager}
                  <View style={{ height: 14 }} />
                </>
              }
            />
          )}
        </>
      )}
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: MainColors.background },

    // header
    header: { paddingHorizontal: 16, paddingTop: 16, gap: 6 },
    heading: { color: MainColors.text, fontSize: 22, fontWeight: "900" },
    subheading: { color: MainColors.textMuted, fontSize: 13, fontWeight: "600" },

    // search bar
    searchBar: {
      marginTop: 50,
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

    pagerWrap: {
      marginTop: 8,
      marginHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
      borderRadius: 14,
      backgroundColor: MainColors.surface,
      borderWidth: 1,
      borderColor: MainColors.border,
    },
    pagerNumbersScroll: { flex: 1 },
    pagerBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: MainColors.border,
      backgroundColor: MainColors.sectionChipBg,
      flexShrink: 0,
    },
    pagerBtnNav: {},
    pagerBtnDisabled: { opacity: 0.5 },
    pagerBtnText: { color: MainColors.text, fontSize: 12.5, fontWeight: "900" },

    pagerNumbers: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
    pageBtn: {
      minWidth: 34,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: MainColors.border,
      backgroundColor: MainColors.sectionChipBg,
      alignItems: "center",
      justifyContent: "center",
    },
    pageBtnActive: { backgroundColor: MainColors.primary, borderColor: "rgba(109,94,249,0.45)" },
    pageText: { color: MainColors.text, fontSize: 12.5, fontWeight: "900" },
    pageTextActive: { color: MainColors.white },
    dots: { color: MainColors.textFaint, fontSize: 14, fontWeight: "900", paddingHorizontal: 2 },
  });
}
