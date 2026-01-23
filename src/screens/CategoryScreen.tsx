import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";

import { RootStackParamList, CategoryKind } from "../navigation/RootNavigator";
import { MainColors } from "../utils/MainColors";
import MediaCard from "../components/MediaCard";
import ErrorState from "../components/ErrorState";
import SkeletonCard from "../components/SkeletonCard";

import {
  getPopularMovies,
  getTrendingWeek,
  getTopRatedTV,
  MediaType,
  TMDBMovie,
  TMDBSearchItem,
  TMDBTV,
  ApiError,
} from "../api/tmdb";
import { getPosterUrl, getYear } from "../utils/image";

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type CategoryRoute = RouteProp<RootStackParamList, "Category">;

type UiItem = {
  id: number;
  mediaType: MediaType;
  title: string;
  posterUrl: string | null;
  year: string;
  rating: number | null;
};

type State = {
  loading: boolean;
  loadingMore: boolean;
  error: ApiError | null;
  items: UiItem[];
  page: number;
  totalPages: number;
};

const TITLE_BY_KIND: Record<CategoryKind, string> = {
  popular: "Popular Movies",
  trending: "Trending This Week",
  tv: "Top Rated TV Shows",
};

export default function CategoryScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<CategoryRoute>();
  const { kind } = route.params;

  // keep list ref so we can jump to top when changing pages
  const listRef = useRef<FlatList<UiItem>>(null!);

  // page state lives here, same logic for all 3 categories
  const [state, setState] = useState<State>({
    loading: true,
    loadingMore: false,
    error: null,
    items: [],
    page: 1,
    totalPages: 1,
  });

  // set header title based on what user opened
  useEffect(() => {
    navigation.setOptions({ title: TITLE_BY_KIND[kind] });
  }, [kind, navigation]);

  // map tmdb responses into one clean ui model
  const mapResults = useCallback(
    (raw: any[]): UiItem[] => {
      return raw.map((x: any) => {
        if (kind === "popular") {
          const m = x as TMDBMovie;
          return {
            id: m.id,
            mediaType: "movie",
            title: m.title || "Untitled",
            posterUrl: getPosterUrl(m.poster_path),
            year: getYear(m.release_date),
            rating: typeof m.vote_average === "number" ? m.vote_average : null,
          };
        }

        if (kind === "tv") {
          const t = x as TMDBTV;
          return {
            id: t.id,
            mediaType: "tv",
            title: t.name || "Untitled",
            posterUrl: getPosterUrl(t.poster_path),
            year: getYear(t.first_air_date),
            rating: typeof t.vote_average === "number" ? t.vote_average : null,
          };
        }

        // trending is mixed (movie + tv), so mediaType comes from response
        const s = x as TMDBSearchItem;
        const isMovie = s.media_type === "movie";
        const title = isMovie ? (s as any).title : (s as any).name;
        const date = isMovie ? (s as any).release_date : (s as any).first_air_date;

        return {
          id: s.id,
          mediaType: s.media_type,
          title: title || "Untitled",
          posterUrl: getPosterUrl(s.poster_path),
          year: getYear(date),
          rating: typeof s.vote_average === "number" ? s.vote_average : null,
        };
      });
    },
    [kind]
  );

  // fetcher changes by kind, but state handling stays same
  const fetchPage = useCallback(
    async (page: number) => {
      if (kind === "popular") return getPopularMovies(page);
      if (kind === "tv") return getTopRatedTV(page);
      return getTrendingWeek(page);
    },
    [kind]
  );

  // load a given page and replace list (this screen is page-based, not infinite scroll)
  const loadPage = useCallback(
    async (page: number, mode: "initial" | "nav" = "initial") => {
      setState((s) => ({
        ...s,
        loading: mode === "initial",
        loadingMore: mode === "nav",
        error: null,
      }));

      try {
        const data: any = await fetchPage(page);

        setState((s) => ({
          ...s,
          loading: false,
          loadingMore: false,
          error: null,
          items: mapResults(data.results ?? []),
          page: data.page ?? page,
          totalPages: data.total_pages ?? 1,
        }));

        // after page change, jump to top so it feels like a fresh page
        requestAnimationFrame(() => {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
        });
      } catch (err: any) {
        setState((s) => ({
          ...s,
          loading: false,
          loadingMore: false,
          error: err,
        }));
      }
    },
    [fetchPage, mapResults]
  );

  // first load when screen opens / kind changes
  useEffect(() => {
    loadPage(1, "initial");
  }, [loadPage]);

  const openDetail = useCallback(
    (item: UiItem) => {
      navigation.navigate("Detail", {
        id: item.id,
        mediaType: item.mediaType,
        title: item.title,
      });
    },
    [navigation]
  );

  // prev page button only
  const goPrev = useCallback(() => {
    if (state.loadingMore) return;
    if (state.page <= 1) return;
    loadPage(state.page - 1, "nav");
  }, [loadPage, state.loadingMore, state.page]);

  // next page button only
  const goNext = useCallback(() => {
    if (state.loadingMore) return;
    if (state.page >= state.totalPages) return;
    loadPage(state.page + 1, "nav");
  }, [loadPage, state.loadingMore, state.page, state.totalPages]);

  const pageLabel = useMemo(() => {
    return `page ${state.page} / ${state.totalPages}`;
  }, [state.page, state.totalPages]);

  const skeletonGrid = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  if (state.error && !state.loading && state.items.length === 0) {
    return (
      <ErrorState
        title="Couldn't load list"
        message={state.error.message}
        onRetry={() => loadPage(1, "initial")}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* small top hint so user knows this is page based */}
      <View style={styles.header}>
        <Text style={styles.hintText}>use arrows to change pages</Text>
      </View>

      {/* main grid list */}
      <FlatList
        ref={listRef}
        data={state.items}
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
            onPress={() => openDetail(item)}
          />
        )}
        ListEmptyComponent={
          // keep it simple while loading first page
          state.loading ? (
            <View style={styles.skeletonWrap}>
              {skeletonGrid.map((i) => (
                <SkeletonCard key={`g-skel-${i}`} style={{ width: "48%" }} />
              ))}
            </View>
          ) : (
            <View style={{ height: 90 }} />
          )
        }
        ListFooterComponent={<View style={{ height: 110 }} />}
      />

      {/* sticky page bar, manual only */}
      <View style={styles.pageBar}>
        <Pressable
          // prev page
          onPress={goPrev}
          disabled={state.loadingMore || state.page <= 1}
          style={({ pressed }) => [
            styles.iconBtn,
            (state.loadingMore || state.page <= 1) && styles.pageBtnDisabled,
            pressed && styles.btnPressed,
          ]}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={MainColors.text} />
        </Pressable>

        <View style={styles.pagePill}>
          <Text style={styles.pagePillText}>{pageLabel}</Text>
        </View>

        <Pressable
          // next page
          onPress={goNext}
          disabled={state.loadingMore || state.page >= state.totalPages}
          style={({ pressed }) => [
            styles.iconBtn,
            (state.loadingMore || state.page >= state.totalPages) && styles.pageBtnDisabled,
            pressed && styles.btnPressed,
          ]}
          hitSlop={10}
        >
          {state.loadingMore ? (
            <ActivityIndicator size="small" color={MainColors.text} />
          ) : (
            <Ionicons name="chevron-forward" size={22} color={MainColors.text} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // screen wrapper
  container: { flex: 1, backgroundColor: MainColors.background },

  // small top hint area
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  hintText: { color: MainColors.textMuted, fontSize: 12.5, fontWeight: "700" },

  // list spacing
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 },
  gridRow: { justifyContent: "space-between", marginBottom: 12 },

  // simple loader block
  footerLoading: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  footerLoadingText: { color: MainColors.textMuted, fontSize: 12.5, fontWeight: "700" },

  // sticky page bar
  pageBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
  },

  // icon-only buttons
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MainColors.sectionChipBg,
    borderWidth: 1,
    borderColor: MainColors.sectionChipBorder,
  },
  pageBtnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  // page label pill
  pagePill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: MainColors.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(109,94,249,0.25)",
    marginHorizontal: 10,
  },
  pagePillText: { color: MainColors.text, fontSize: 12.5, fontWeight: "900" },

  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
});
