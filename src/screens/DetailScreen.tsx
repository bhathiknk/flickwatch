import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { RootStackParamList } from "../navigation/RootNavigator";
import { MainColors } from "../utils/MainColors";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";

import { getCredits, getDetails, MediaType, TMDBCreditsResponse } from "../api/tmdb";
import { getBackdropUrl, getPosterUrl, getProfileUrl, getYear } from "../utils/image";
import { useWatchlistStore } from "../store/watchlistStore";
import { useColorMode } from "../utils/useColorMode";
import { useNavigation } from "@react-navigation/native";


type DetailRoute = RouteProp<RootStackParamList, "Detail">;

type DetailUi = {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  rating: number | null;
  date: string | null;
  genres: string[];
  runtimeText: string | null;
  posterPath: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
};

export default function DetailScreen() {
  // route params from home/search/watchlist
  const route = useRoute<DetailRoute>();
  const { id, mediaType } = route.params;

  // subscribe so this screen re-renders when theme changes
    const mode = useColorMode();
  const navigation = useNavigation();
    const styles = useMemo(() => makeStyles(), [mode]);

  // watchlist selectors kept small for less rerenders
  const hydrate = useWatchlistStore((s) => s.hydrate);
  const hydrated = useWatchlistStore((s) => s.hydrated);
  const toggle = useWatchlistStore((s) => s.toggle);
  const isInWatchlist = useWatchlistStore((s) => s.isInWatchlist);

  // used for button text + style
  const saved = isInWatchlist(id, mediaType);

  // main details state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailUi | null>(null);

  // credits state, load after details
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [cast, setCast] = useState<TMDBCreditsResponse["cast"]>([]);

  // tiny toast feedback for watchlist action
  const [toastText, setToastText] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // quick toast helper, no blocking ui
  const showToast = useCallback(
    (text: string) => {
      setToastText(text);

      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      const t = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => setToastText(null));
      }, 1200);

      return () => clearTimeout(t);
    },
    [toastAnim]
  );

  // map tmdb raw into ui model
  const buildUi = useCallback(
    (raw: any): DetailUi => {
      const isMovie = mediaType === "movie";
      const title = isMovie ? raw.title : raw.name;
      const date = isMovie ? raw.release_date : raw.first_air_date;

      const genres = Array.isArray(raw.genres)
        ? raw.genres.map((g: any) => g.name).filter(Boolean)
        : [];

      // runtime is different for movie vs tv, normalize a bit
      const runtimeText = (() => {
        if (isMovie) {
          const mins = typeof raw.runtime === "number" ? raw.runtime : null;
          if (!mins) return null;
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return h > 0 ? `${h}h ${m}m` : `${m}m`;
        }

        const arr = Array.isArray(raw.episode_run_time) ? raw.episode_run_time : [];
        const mins = typeof arr[0] === "number" ? arr[0] : null;
        if (!mins) return null;
        return `${mins}m per ep`;
      })();

      const rating = typeof raw.vote_average === "number" ? raw.vote_average : null;
      const posterPath = raw.poster_path ?? null;

      return {
        id: raw.id,
        mediaType,
        title: title || "Untitled",
        overview: raw.overview || "No overview available.",
        rating,
        date: date || null,
        genres,
        runtimeText,
        posterPath,
        posterUrl: getPosterUrl(posterPath),
        backdropUrl: getBackdropUrl(raw.backdrop_path ?? null, "w780"),
      };
    },
    [mediaType]
  );

  // fetch details based on type + id
  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const raw = await getDetails(mediaType, id);
      setDetail(buildUi(raw));
    } catch (e: any) {
      setError(e?.message || "Failed to load details.");
    } finally {
      setLoading(false);
    }
  }, [buildUi, id, mediaType]);

  // fetch credits after details, keep it optional
  const loadCredits = useCallback(async () => {
    setCreditsLoading(true);
    try {
      const data = await getCredits(mediaType, id);
      const top = (data.cast || [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .slice(0, 6);
      setCast(top);
    } catch {
      // credits should never break screen
      setCast([]);
    } finally {
      setCreditsLoading(false);
    }
  }, [id, mediaType]);

  // hydrate watchlist once, so saved state is right
  useEffect(() => {
    if (!hydrated) hydrate().catch(() => {});
  }, [hydrate, hydrated]);

  // initial load
  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // load credits when details ready
  useEffect(() => {
    if (detail) loadCredits();
  }, [detail, loadCredits]);

  // minimal payload stored in watchlist
  const watchlistPayload = useMemo(() => {
    if (!detail) return null;
    return {
      id: detail.id,
      mediaType: detail.mediaType,
      title: detail.title,
      posterPath: detail.posterPath,
    };
  }, [detail]);

  // full screen loading
  if (loading) {
    return <Loading title="Loading details" subtitle="Pulling info from TMDB..." />;
  }

  // full screen error
  if (error || !detail) {
    return (
      <ErrorState
        title="Couldn't load details"
        message={error || "No data found."}
        onRetry={loadDetail}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* toast overlay */}
      {toastText && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastText}</Text>
        </Animated.View>
      )}
<View style={styles.headerBar}>
  <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={24} color={MainColors.text} />
  </Pressable>
</View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* hero section with backdrop + poster */}
        <View style={styles.hero}>
          {detail.backdropUrl ? (
            <Image source={{ uri: detail.backdropUrl }} style={styles.backdrop} />
          ) : (
            <View style={styles.backdropFallback} />
          )}

          {/* overlay for readability */}
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            {/* poster block */}
            <View style={styles.posterWrap}>
              {detail.posterUrl ? (
                <Image source={{ uri: detail.posterUrl }} style={styles.poster} />
              ) : (
                <View style={styles.posterFallback}>
                  <Ionicons name="image-outline" size={24} color={MainColors.textFaint} />
                  <Text style={styles.posterFallbackText}>No poster</Text>
                </View>
              )}
            </View>

            {/* title + meta */}
            <View style={styles.heroInfo}>
              <Text style={styles.title} numberOfLines={3}>
                {detail.title}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaChip}>{detail.mediaType.toUpperCase()}</Text>
                {!!detail.date && <Text style={styles.metaChip}>{getYear(detail.date)}</Text>}
                {!!detail.runtimeText && <Text style={styles.metaChip}>{detail.runtimeText}</Text>}
              </View>

              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={MainColors.rating} />
                <Text style={styles.ratingText}>
                  {detail.rating !== null ? detail.rating.toFixed(1) : "N/A"}
                </Text>
                <Text style={styles.ratingHint}>TMDB</Text>
              </View>

              {!!detail.genres.length && (
                <Text style={styles.genres} numberOfLines={2}>
                  {detail.genres.join(" • ")}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* overview section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{detail.overview}</Text>
        </View>

        {/* watchlist button section */}
        <View style={styles.section}>
          <Pressable
            onPress={() => {
              if (!watchlistPayload) return;

              // read before toggle to show right toast
              const wasSaved = isInWatchlist(watchlistPayload.id, watchlistPayload.mediaType);
              toggle(watchlistPayload);

              showToast(wasSaved ? "Removed from watchlist" : "Added to watchlist");
            }}
            style={({ pressed }) => [
              styles.watchBtn,
              saved ? styles.watchBtnSaved : styles.watchBtnAdd,
              pressed && styles.btnPressed,
            ]}
          >
            <Ionicons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={18}
              color={MainColors.white}
            />
            <Text style={styles.watchBtnText}>
              {saved ? "Remove from Watchlist" : "Add to Watchlist"}
            </Text>
          </Pressable>

          <Text style={styles.smallNote}>
            Your watchlist is saved on this device, even after closing the app.
          </Text>
        </View>

        {/* cast section, optional */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Top Cast</Text>
            {creditsLoading && <ActivityIndicator size="small" color={MainColors.textMuted} />}
          </View>

          {cast.length === 0 ? (
            <Text style={styles.castEmpty}>Cast data not available.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.castRow}>
                {cast.map((c) => {
                  const profile = getProfileUrl(c.profile_path, "w185");
                  return (
                    <View key={c.id} style={styles.castCard}>
                      <View style={styles.castAvatarWrap}>
                        {profile ? (
                          <Image source={{ uri: profile }} style={styles.castAvatar} />
                        ) : (
                          <View style={styles.castAvatarFallback}>
                            <Ionicons name="person" size={18} color={MainColors.textFaint} />
                          </View>
                        )}
                      </View>

                      <Text style={styles.castName} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={styles.castRole} numberOfLines={1}>
                        {c.character}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        {/* bottom spacing for tab bar */}
        <View style={{ height: 26 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
  // root container
  root: { flex: 1, backgroundColor: MainColors.background },

  // toast styles
  toast: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    zIndex: 99,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
  },
  toastText: {
    color: MainColors.text,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  headerBar: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  paddingTop: 50,
  paddingHorizontal: 16,
  paddingBottom: 12,
},
backButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: MainColors.surface,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: MainColors.border,
},

  // scroll container
  container: { flex: 1, backgroundColor: MainColors.background },
  content: { paddingBottom: 18 },

  // hero/backdrop area
  hero: {
    height: 360,
    position: "relative",
    overflow: "hidden",
    backgroundColor: MainColors.surface2,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, resizeMode: "cover" },
  backdropFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: MainColors.surface2 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: MainColors.overlay },

  // hero layout content
  heroContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-end",
  },

  // poster styles
  posterWrap: {
    width: 120,
    height: 170,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: MainColors.border,
    backgroundColor: MainColors.surface,
  },
  poster: { width: "100%", height: "100%", resizeMode: "cover" },
  posterFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: MainColors.surface,
  },
  posterFallbackText: { color: MainColors.textFaint, fontSize: 12, fontWeight: "700" },

  // hero info block
  heroInfo: { flex: 1, gap: 8 },

  // title styles
  title: {
    color: MainColors.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },

  // meta chips styles
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: {
    color: MainColors.text,
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: MainColors.chipBg,
    borderWidth: 1,
    borderColor: MainColors.chipBorder,
  },

  // rating row styles
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ratingText: { color: MainColors.text, fontSize: 14, fontWeight: "900" },
  ratingHint: { color: MainColors.textFaint, fontSize: 12, fontWeight: "800" },

  // genres label
  genres: { color: MainColors.textMuted, fontSize: 12.5, fontWeight: "700" },

  // shared section wrapper
  section: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: MainColors.text, fontSize: 14.5, fontWeight: "900" },

  // overview text
  overview: { color: MainColors.textMuted, fontSize: 13.5, fontWeight: "600", lineHeight: 19 },

  // watchlist button styles
  watchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  watchBtnAdd: { backgroundColor: MainColors.primary, borderColor: "rgba(109,94,249,0.45)" },
  watchBtnSaved: { backgroundColor: MainColors.buttonDark, borderColor: MainColors.border },
  watchBtnText: { color: MainColors.white, fontSize: 14, fontWeight: "900" },
  btnPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },

  // note under the watch button
  smallNote: {
    color: MainColors.textFaint,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },

  // cast list styles
  castRow: { flexDirection: "row", gap: 12, paddingRight: 16 },
  castCard: {
    width: 120,
    padding: 12,
    borderRadius: 16,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
    gap: 8,
  },
  castAvatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: MainColors.border,
    backgroundColor: MainColors.surface2,
  },
  castAvatar: { width: "100%", height: "100%", resizeMode: "cover" },
  castAvatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  castName: { color: MainColors.text, fontSize: 12.5, fontWeight: "900" },
  castRole: { color: MainColors.textMuted, fontSize: 12, fontWeight: "700" },
  castEmpty: { color: MainColors.textFaint, fontSize: 12.5, fontWeight: "700" },
  });
}
