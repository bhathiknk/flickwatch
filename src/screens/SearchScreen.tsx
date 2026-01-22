import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Search Screen</Text>
      <Text style={styles.subheading}>
        We’ll add debounce + TMDB /search/multi later.
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search movies or TV..."
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.resultBox}>
        <Text style={styles.resultText}>
          Typing: <Text style={styles.bold}>{query || "..."}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  heading: { fontSize: 22, fontWeight: "700" },
  subheading: { fontSize: 14, opacity: 0.7 },

  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  resultBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
  },
  resultText: { fontSize: 14 },
  bold: { fontWeight: "700" },
});
