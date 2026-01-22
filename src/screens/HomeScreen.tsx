import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { RootStackParamList } from "../navigation/RootNavigator";
import MediaCard from "../components/MediaCard";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";
import { MainColors } from "../utils/MainColors";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

type DummyItem = {
  id: number;
  title: string;
  mediaType: "movie" | "tv";
  year: string;
  rating: number;
  posterUrl?: string | null;
};

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();

  // Simple toggles to test Loading and Error UI quickly
  const [mode, setMode] = useState<"content" | "loading" | "error">("content");

  const DUMMY: DummyItem[] = useMemo(
    () => [
      {
        id: 101,
        title: "Dummy Movie",
        mediaType: "movie",
        year: "2024",
        rating: 8.2,
        // Put any valid image URL here if you want to see real images while testing
        posterUrl: null,
      },
      {
        id: 202,
        title: "Dummy TV Show",
        mediaType: "tv",
        year: "2023",
        rating: 7.8,
        posterUrl: null,
      },
      {
        id: 303,
        title: "Another Dummy Title That Is A Bit Longer",
        mediaType: "movie",
        year: "2022",
        rating: 6.9,
        posterUrl: null,
      },
    ],
    []
  );

  if (mode === "loading") {
    return <Loading title="Loading Home" subtitle="Testing loading component..." />;
  }

  if (mode === "error") {
    return (
      <ErrorState
        title="Test error state"
        message="This is just a UI test. Tap retry to go back."
        onRetry={() => setMode("content")}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ gap: 4 }}>
          <Text style={styles.heading}>Home</Text>
          <Text style={styles.subheading}>
            Testing reusable components before real TMDB data.
          </Text>
        </View>

        {/* Quick test controls */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
            onPress={() => setMode("loading")}
          >
            <Text style={styles.pillText}>Loading</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
            onPress={() => setMode("error")}
          >
            <Text style={styles.pillText}>Error</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Popular (UI Test)</Text>

      <FlatList
        data={DUMMY}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => (
          <MediaCard
            title={item.title}
            posterUrl={item.posterUrl}
            rating={item.rating}
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
      />

      <Text style={styles.sectionTitle}>Trending (Compact Variant)</Text>

      <FlatList
        data={DUMMY}
        keyExtractor={(item) => `compact-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => (
          <MediaCard
            variant="compact"
            title={item.title}
            posterUrl={item.posterUrl}
            rating={item.rating}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MainColors.background,
    paddingTop: 16,
    gap: 14,
  },

  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heading: {
    color: MainColors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  subheading: {
    color: MainColors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
  },
  pillPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  pillText: {
    color: MainColors.text,
    fontSize: 12,
    fontWeight: "800",
  },

  sectionTitle: {
    paddingHorizontal: 16,
    color: MainColors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
});
