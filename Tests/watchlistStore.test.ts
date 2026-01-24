import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWatchlistStore, WatchlistItem } from "../src/store/watchlistStore";

describe("watchlistStore", () => {
  beforeEach(() => {
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockClear();

    useWatchlistStore.setState({ items: [], hydrated: false });
  });

  test("add/remove/toggle updates items and persists", () => {
    const item: WatchlistItem = {
      id: 1,
      mediaType: "movie",
      title: "Test Movie",
      posterPath: null,
    };

    const store = useWatchlistStore.getState();

    store.add(item);
    expect(useWatchlistStore.getState().items).toHaveLength(1);
    expect(AsyncStorage.setItem).toHaveBeenCalled();

    store.add(item);
    expect(useWatchlistStore.getState().items).toHaveLength(1);

    store.toggle(item);
    expect(useWatchlistStore.getState().items).toHaveLength(0);

    store.toggle(item);
    expect(useWatchlistStore.getState().items).toHaveLength(1);

    store.remove(item.id, item.mediaType);
    expect(useWatchlistStore.getState().items).toHaveLength(0);
  });

  test("hydrate loads from AsyncStorage and sets hydrated=true", async () => {
    const saved: WatchlistItem[] = [
      { id: 7, mediaType: "tv", title: "Saved Show", posterPath: "abc" },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(saved));

    await useWatchlistStore.getState().hydrate();

    const state = useWatchlistStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe(7);
  });
});
