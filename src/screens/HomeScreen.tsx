import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { RootStackParamList } from "../navigation/RootNavigator";
import MediaCard from "../components/MediaCard";
import ErrorState from "../components/ErrorState";
import { MainColors } from "../utils/MainColors";

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

type NavProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

type HomeSectionState<T> = {
  loading: boolean;
  error: ApiError | null;
  items: T[];
};

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();

  // pull-to-refresh state for whole page
  const [refreshing, setRefreshing] = useState(false);

  // keep sections simple on home (no pagination here)
  const [popular, setPopular] = useState<HomeSectionState<TMDBMovie>>({
    loading: true,
    error: null,
    items: [],
  });

  const [trending, setTrending] = useState<HomeSectionState<TMDBSearchItem>>({
    loading: true,
    error: null,
    items: [],
  });

  const [topRatedTV, setTopRatedTV] = useState<HomeSectionState<TMDBTV>>({
    loading: true,
    error: null,
    items: [],
  });

  const openDetail = useCallback(
    (id: number, mediaType: MediaType, title?: string) => {
      navigation.navigate("Detail", { id, mediaType, title });
    },
    [navigation]
  );

  // load popular movies (single page for home)
  const loadPopular = useCallback(async () => {
    setPopular((p) => ({ ...p, loading: true, error: null }));

    try {
      const data: any = await getPopularMovies(1);
      setPopular({ loading: false, error: null, items: data.results ?? [] });
    } catch (err: any) {
      setPopular((p) => ({ ...p, loading: false, error: err }));
    }
  }, []);

  // load trending this week (single page for home)
  const loadTrending = useCallback(async () => {
    setTrending((t) => ({ ...t, loading: true, error: null }));

    try {
      const data: any = await getTrendingWeek(1);
      setTrending({ loading: false, error: null, items: data.results ?? [] });
    } catch (err: any) {
      setTrending((t) => ({ ...t, loading: false, error: err }));
    }
  }, []);

  // load top rated tv (single page for home)
  const loadTopRatedTV = useCallback(async () => {
    setTopRatedTV((s) => ({ ...s, loading: true, error: null }));

    try {
      const data: any = await getTopRatedTV(1);
      setTopRatedTV({ loading: false, error: null, items: data.results ?? [] });
    } catch (err: any) {
      setTopRatedTV((s) => ({ ...s, loading: false, error: err }));
    }
  }, []);

  // first load when screen mount
  useEffect(() => {
    loadPopular();
    loadTrending();
    loadTopRatedTV();
  }, [loadPopular, loadTrending, loadTopRatedTV]);

  // pull-to-refresh for whole page
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([loadPopular(), loadTrending(), loadTopRatedTV()]);
    setRefreshing(false);
  }, [loadPopular, loadTrending, loadTopRatedTV]);

  // small header ui for each section to keep it same style
  const SectionHeader = useCallback(
    ({
      title,
      iconName,
      hint,
      onRetry,
      showRetry,
      onOpen,
    }: {
      title: string;
      iconName: keyof typeof Ionicons.glyphMap;
      hint?: string;
      onRetry?: () => void;
      showRetry?: boolean;
      onOpen?: () => void;
    }) => (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Pressable
            // tap title area to open full list page
            onPress={onOpen}
            style={({ pressed }) => [styles.sectionChip, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name={iconName} size={16} color={MainColors.accent} />
            <Text style={styles.sectionTitle}>{title}</Text>
            <Ionicons name="chevron-forward" size={16} color={MainColors.textFaint} />
          </Pressable>

          {showRetry && onRetry && (
            <Pressable
              onPress={onRetry}
              style={({ pressed }) => [styles.retryBtn, pressed && styles.retryPressed]}
            >
              <Ionicons name="refresh" size={16} color={MainColors.text} />
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          )}
        </View>

        {!!hint && <Text style={styles.sectionHint}>{hint}</Text>}
      </View>
    ),
    []
  );

  // render popular movie card
  const renderPopularItem = useCallback(
    ({ item }: { item: TMDBMovie }) => {
      const posterUrl = getPosterUrl(item.poster_path);
      const year = getYear(item.release_date);

      return (
        <MediaCard
          title={item.title}
          posterUrl={posterUrl}
          rating={item.vote_average}
          year={year}
          subtitle="MOVIE"
          onPress={() => openDetail(item.id, "movie", item.title)}
        />
      );
    },
    [openDetail]
  );

  // render trending item (movie or tv)
  const renderTrendingItem = useCallback(
    ({ item }: { item: TMDBSearchItem }) => {
      const isMovie = item.media_type === "movie";
      const title = isMovie ? (item as any).title : (item as any).name;
      const date = isMovie ? (item as any).release_date : (item as any).first_air_date;

      return (
        <MediaCard
          variant="compact"
          title={title || "Untitled"}
          posterUrl={getPosterUrl(item.poster_path)}
          rating={item.vote_average}
          year={getYear(date)}
          subtitle={(item.media_type || "movie").toUpperCase()}
          onPress={() => openDetail(item.id, item.media_type, title)}
        />
      );
    },
    [openDetail]
  );

  // render top rated tv card
  const renderTopRatedTVItem = useCallback(
    ({ item }: { item: TMDBTV }) => {
      return (
        <MediaCard
          title={item.name}
          posterUrl={getPosterUrl(item.poster_path)}
          rating={item.vote_average}
          year={getYear(item.first_air_date)}
          subtitle="TV"
          onPress={() => openDetail(item.id, "tv", item.name)}
        />
      );
    },
    [openDetail]
  );

  const listSeparator = useMemo(() => <View style={{ width: 12 }} />, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          // pull to refresh for whole page
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={MainColors.textMuted}
        />
      }
    >
      {/* top header block */}
      <View style={styles.header}>
        <View style={{ gap: 6 }}>
          <Text style={styles.heading}>FlickWatch</Text>
          <Text style={styles.subheading}>
            Popular picks, weekly trends, and top rated TV in one place.
          </Text>
        </View>

        <View style={styles.headerBadge}>
          <Ionicons name="sparkles" size={16} color={MainColors.rating} />
          <Text style={styles.headerBadgeText}>Discover</Text>
        </View>
      </View>

      {/* popular movies section */}
      <SectionHeader
        title="Popular Movies"
        iconName="flame"
        hint="What people are watching right now"
        showRetry={!!popular.error}
        onRetry={loadPopular}
        onOpen={() => navigation.navigate("Category", { kind: "popular" })}
      />

      {popular.error ? (
        <View style={styles.sectionBody}>
          <ErrorState
            title="Couldn't load popular movies"
            message={popular.error.message}
            onRetry={loadPopular}
          />
        </View>
      ) : (
        <View style={styles.sectionBody}>
          <FlatList
            // keep home lightweight: only 1 page preview, no onEndReached
            data={popular.items}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            ItemSeparatorComponent={() => listSeparator}
            contentContainerStyle={styles.listContent}
            renderItem={renderPopularItem}
            initialNumToRender={6}
            windowSize={5}
            removeClippedSubviews
            ListEmptyComponent={
              popular.loading ? (
                <View style={styles.inlineLoading}>
                  <Ionicons name="reload" size={18} color={MainColors.textMuted} />
                  <Text style={styles.inlineLoadingText}>Loading...</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>No items available.</Text>
              )
            }
          />
        </View>
      )}

      <View style={styles.divider} />

      {/* trending this week section */}
      <SectionHeader
        title="Trending This Week"
        iconName="trending-up"
        hint="Movies and TV with momentum"
        showRetry={!!trending.error}
        onRetry={loadTrending}
        onOpen={() => navigation.navigate("Category", { kind: "trending" })}
      />

      {trending.error ? (
        <View style={styles.sectionBody}>
          <ErrorState
            title="Couldn't load trending"
            message={trending.error.message}
            onRetry={loadTrending}
          />
        </View>
      ) : (
        <View style={styles.sectionBody}>
          <FlatList
            // keep home lightweight: only 1 page preview, no onEndReached
            data={trending.items}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `${item.media_type}-${item.id}`}
            ItemSeparatorComponent={() => listSeparator}
            contentContainerStyle={styles.listContent}
            renderItem={renderTrendingItem}
            initialNumToRender={8}
            windowSize={6}
            removeClippedSubviews
            ListEmptyComponent={
              trending.loading ? (
                <View style={styles.inlineLoading}>
                  <Ionicons name="reload" size={18} color={MainColors.textMuted} />
                  <Text style={styles.inlineLoadingText}>Loading...</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>No items available.</Text>
              )
            }
          />
        </View>
      )}

      <View style={styles.divider} />

      {/* top rated tv section */}
      <SectionHeader
        title="Top Rated TV Shows"
        iconName="tv"
        hint="Fan favorites with top scores"
        showRetry={!!topRatedTV.error}
        onRetry={loadTopRatedTV}
        onOpen={() => navigation.navigate("Category", { kind: "tv" })}
      />

      {topRatedTV.error ? (
        <View style={styles.sectionBody}>
          <ErrorState
            title="Couldn't load top rated TV"
            message={topRatedTV.error.message}
            onRetry={loadTopRatedTV}
          />
        </View>
      ) : (
        <View style={styles.sectionBody}>
          <FlatList
            // keep home lightweight: only 1 page preview, no onEndReached
            data={topRatedTV.items}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            ItemSeparatorComponent={() => listSeparator}
            contentContainerStyle={styles.listContent}
            renderItem={renderTopRatedTVItem}
            initialNumToRender={6}
            windowSize={5}
            removeClippedSubviews
            ListEmptyComponent={
              topRatedTV.loading ? (
                <View style={styles.inlineLoading}>
                  <Ionicons name="reload" size={18} color={MainColors.textMuted} />
                  <Text style={styles.inlineLoadingText}>Loading...</Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>No items available.</Text>
              )
            }
          />
        </View>
      )}

      {/* bottom spacing for tab bar */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // screen wrapper
  container: { flex: 1, backgroundColor: MainColors.background },

  // scroll content spacing
  content: { paddingTop: 16, paddingBottom: 20, gap: 14 },

  // top header area
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heading: { color: MainColors.text, fontSize: 22, fontWeight: "900" },
  subheading: {
    color: MainColors.textMuted,
    fontSize: 13.5,
    fontWeight: "600",
    maxWidth: 260,
    lineHeight: 18,
  },

  // small badge on header right
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: MainColors.sectionChipBg,
    borderWidth: 1,
    borderColor: MainColors.sectionChipBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  headerBadgeText: { color: MainColors.text, fontSize: 12, fontWeight: "900" },

  // section header container
  sectionHeader: { paddingHorizontal: 16, gap: 6 },

  // section header row (title + retry)
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  // section title chip
  sectionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: MainColors.sectionChipBg,
    borderWidth: 1,
    borderColor: MainColors.sectionChipBorder,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  sectionTitle: {
    color: MainColors.text,
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  sectionHint: { color: MainColors.textMuted, fontSize: 12.5, fontWeight: "600" },

  // retry button on section header
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: MainColors.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(109,94,249,0.35)",
  },
  retryPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  retryText: { color: MainColors.text, fontSize: 12, fontWeight: "900" },

  // area where list or error block sits
  sectionBody: { minHeight: 260 },

  // flatlist padding
  listContent: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },

  // loading chip used inside list empty slot
  inlineLoading: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginLeft: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
  },
  inlineLoadingText: { color: MainColors.textMuted, fontSize: 13, fontWeight: "700" },

  // small empty text in list
  emptyText: {
    color: MainColors.textFaint,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 16,
    marginTop: 10,
  },

  // thin line between sections
  divider: {
    height: 1,
    backgroundColor: MainColors.divider,
    marginHorizontal: 16,
    marginTop: 6,
  },
});
