import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function WatchlistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Watchlist Screen</Text>
      <Text style={styles.subheading}>
        Later we’ll show saved items here (AsyncStorage / Zustand).
      </Text>

      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
        <Text style={styles.emptyText}>
          Start adding movies and TV shows from the Detail screen.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  heading: { fontSize: 22, fontWeight: "700" },
  subheading: { fontSize: 14, opacity: 0.7 },

  emptyBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 14, opacity: 0.8 },
});
