import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";

type DetailRoute = RouteProp<RootStackParamList, "Detail">;

export default function DetailScreen() {
  const route = useRoute<DetailRoute>();
  const { id, mediaType, title } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Detail Screen</Text>

      <View style={styles.card}>
        <View style={styles.posterMock}>
          <Text style={styles.posterText}>Poster</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{title ?? "Untitled"}</Text>
          <Text style={styles.meta}>
            Type: <Text style={styles.bold}>{mediaType}</Text>
          </Text>
          <Text style={styles.meta}>
            ID: <Text style={styles.bold}>{id}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Next step: fetch real TMDB details using (mediaType + id).
        </Text>
      </View>

      <Pressable style={styles.button} onPress={() => {}}>
        <Text style={styles.buttonText}>Add to Watchlist (later)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  heading: { fontSize: 22, fontWeight: "700" },

  card: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  posterMock: {
    width: 110,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },
  posterText: { fontSize: 12, opacity: 0.7 },

  info: { flex: 1, padding: 12, gap: 6 },
  title: { fontSize: 18, fontWeight: "800" },
  meta: { fontSize: 14, opacity: 0.8 },
  bold: { fontWeight: "700" },

  note: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
  },
  noteText: { fontSize: 14, opacity: 0.85 },

  button: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#111",
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
