import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";

import { RootStackParamList } from "../navigation/RootNavigator";
import { useWatchlistStore } from "../store/watchlistStore";
import { MainColors } from "../utils/MainColors";
import WatchlistCard from "../components/WatchlistCard";
import { useColorMode } from "../utils/useColorMode";


type NavProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

type PendingRemove = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
} | null;

export default function WatchlistScreen() {
  const navigation = useNavigation<NavProp>();

  // take only what we need from store
  const hydrate = useWatchlistStore((s) => s.hydrate);
  const hydrated = useWatchlistStore((s) => s.hydrated);
  const items = useWatchlistStore((s) => s.items);
  const remove = useWatchlistStore((s) => s.remove);


  const mode = useColorMode();
  const styles = useMemo(() => makeStyles(), [mode]);


  // confirmation modal state
  const [pendingRemove, setPendingRemove] = useState<PendingRemove>(null);

  // top toast state
  const [toastText, setToastText] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    // hydrate once so it survives app restart
    if (!hydrated) hydrate().catch(() => {});
  }, [hydrated, hydrate]);

  const requestRemove = useCallback((id: number, mediaType: "movie" | "tv", title: string) => {
    setPendingRemove({ id, mediaType, title });
  }, []);

  const cancelRemove = useCallback(() => {
    setPendingRemove(null);
  }, []);

  const confirmRemove = useCallback(() => {
    if (!pendingRemove) return;

    remove(pendingRemove.id, pendingRemove.mediaType);
    setPendingRemove(null);

    showToast("Removed from watchlist");
  }, [pendingRemove, remove, showToast]);

  return (
    <View style={styles.container}>
      {/* top toast */}
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
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={16} color={MainColors.accent} />
          <Text style={styles.toastText}>{toastText}</Text>
        </Animated.View>
      )}

      {/* page title */}
      <Text style={styles.heading}>Watchlist</Text>
      <Text style={styles.subheading}>Saved items from Detail screen.</Text>

      {/* show empty view when nothing saved */}
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptyText}>
            Add movies or TV shows from the Detail screen.
          </Text>
        </View>
      ) : (
        <FlatList
          // list of saved items from zustand
          data={items}
          keyExtractor={(item) => `${item.mediaType}-${item.id}`}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <WatchlistCard
              title={item.title}
              mediaType={item.mediaType}
              posterPath={item.posterPath}
              onPress={() =>
                navigation.navigate("Detail", {
                  id: item.id,
                  mediaType: item.mediaType,
                  title: item.title,
                })
              }
              onRemove={() => requestRemove(item.id, item.mediaType, item.title)}
            />
          )}
        />
      )}

      {/* remove confirm modal */}
      <Modal
        visible={!!pendingRemove}
        transparent
        animationType="fade"
        onRequestClose={cancelRemove}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="trash-outline" size={18} color={MainColors.white} />
            </View>

            <Text style={styles.modalTitle}>Remove item?</Text>

            <Text style={styles.modalText} numberOfLines={2}>
              {pendingRemove?.title || ""}
            </Text>

            <Text style={styles.modalSub}>
              This will remove it from your watchlist on this device
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={cancelRemove}
                style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmRemove}
                style={({ pressed }) => [styles.btn, styles.btnDanger, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnDangerText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
  // screen container styles
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: MainColors.background,
  },

  // header text styles
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: MainColors.text,
    marginTop: 6,
  },
  subheading: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: MainColors.textMuted,
  },

  // empty box styles
  emptyBox: {
    marginTop: 50,
    padding: 16,
    borderRadius: 14,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: MainColors.text },
  emptyText: { fontSize: 13, fontWeight: "600", color: MainColors.textMuted },

  // top toast styles
  toast: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
  },
  toastText: {
    color: MainColors.text,
    fontSize: 13,
    fontWeight: "800",
  },

  // modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: MainColors.surface,
    borderWidth: 1,
    borderColor: MainColors.border,
    padding: 16,
    gap: 10,
  },
  modalIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: MainColors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: MainColors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  modalText: {
    color: MainColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  modalSub: {
    color: MainColors.textMuted,
    fontSize: 12.5,
    fontWeight: "600",
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },

  btnGhost: {
    backgroundColor: MainColors.buttonDark,
    borderColor: MainColors.border,
  },
  btnGhostText: { color: MainColors.text, fontSize: 13, fontWeight: "900" },

  btnDanger: {
    backgroundColor: MainColors.danger,
    borderColor: "rgba(255,92,108,0.40)",
  },
  btnDangerText: { color: MainColors.white, fontSize: 13, fontWeight: "900" },
})
}
