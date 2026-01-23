import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type WatchlistItem = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
};

type WatchlistState = {
  items: WatchlistItem[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  isInWatchlist: (id: number, mediaType: WatchlistItem["mediaType"]) => boolean;

  add: (item: WatchlistItem) => void;
  remove: (id: number, mediaType: WatchlistItem["mediaType"]) => void;
  toggle: (item: WatchlistItem) => void;
};

const STORAGE_KEY = "@flickwatch_watchlist_v1";

/**
 * Persistence is done manually to keep control and avoid extra dependencies.
 * Hydration happens once when Detail/Watchlist screens mount.
 */
async function persist(items: WatchlistItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: WatchlistItem[] = raw ? JSON.parse(raw) : [];
      set({ items: Array.isArray(parsed) ? parsed : [], hydrated: true });
    } catch {
      set({ items: [], hydrated: true });
    }
  },

  isInWatchlist: (id, mediaType) => {
    return get().items.some((x) => x.id === id && x.mediaType === mediaType);
  },

  add: (item) => {
    const exists = get().items.some((x) => x.id === item.id && x.mediaType === item.mediaType);
    if (exists) return;

    const next = [item, ...get().items];
    set({ items: next });
    persist(next).catch(() => {});
  },

  remove: (id, mediaType) => {
    const next = get().items.filter((x) => !(x.id === id && x.mediaType === mediaType));
    set({ items: next });
    persist(next).catch(() => {});
  },

  toggle: (item) => {
    const exists = get().isInWatchlist(item.id, item.mediaType);
    if (exists) {
      get().remove(item.id, item.mediaType);
    } else {
      get().add(item);
    }
  },
}));
