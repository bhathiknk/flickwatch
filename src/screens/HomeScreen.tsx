import React from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

type DummyItem = {
  id: number;
  title: string;
  mediaType: "movie" | "tv";
  year: string;
  rating: number;
};

const DUMMY: DummyItem[] = [
  { id: 101, title: "Dummy Movie", mediaType: "movie", year: "2024", rating: 8.2 },
  { id: 202, title: "Dummy TV Show", mediaType: "tv", year: "2023", rating: 7.8 },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();

  const renderItem = ({ item }: { item: DummyItem }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
      onPress={() =>
        navigation.navigate("Detail", {
          id: item.id,
          mediaType: item.mediaType,
          title: item.title,
        })
      }
    >
      <View style={styles.posterMock}>
        <Text style={styles.posterText}>Poster </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.meta}>
          {item.mediaType.toUpperCase()} • {item.year} • ⭐ {item.rating}
        </Text>

        <View style={styles.ctaRow}>
          <Text style={styles.cta}>Tap to view details →</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Home Screen</Text>
      <Text style={styles.subheading}>
        Dummy list now. Later we’ll replace with TMDB API data.
      </Text>

      <FlatList
        data={DUMMY}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  heading: { fontSize: 22, fontWeight: "700" },
  subheading: { fontSize: 14, opacity: 0.7, marginBottom: 8 },

  card: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  posterMock: {
    width: 90,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },
  posterText: { fontSize: 12, opacity: 0.7 },

  cardBody: { flex: 1, padding: 12, gap: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 13, opacity: 0.75 },

  ctaRow: { marginTop: 6 },
  cta: { fontSize: 13, fontWeight: "600" },
});
