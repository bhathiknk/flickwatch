import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import WatchlistScreen from "../src/screens/WatchlistScreen";
import { useWatchlistStore } from "../src/store/watchlistStore";

jest.mock("react-native", () => {
  const React = require("react");

  const createHost =
    (name: string) =>
    ({ children, ...props }: any) =>
      React.createElement(name, props, children);

  const StyleSheet = {
    create: (s: any) => s,
    flatten: (s: any) => (Array.isArray(s) ? Object.assign({}, ...s) : s),
  };

  const Pressable = ({ children, ...props }: any) =>
    React.createElement(
      "Pressable",
      props,
      typeof children === "function" ? children({ pressed: false }) : children
    );

  const FlatList = ({
    data = [],
    renderItem,
    ListHeaderComponent,
    ListFooterComponent,
    ItemSeparatorComponent,
    keyExtractor,
    contentContainerStyle,
    ...rest
  }: any) => {
    const header =
      typeof ListHeaderComponent === "function"
        ? ListHeaderComponent()
        : ListHeaderComponent || null;

    const footer =
      typeof ListFooterComponent === "function"
        ? ListFooterComponent()
        : ListFooterComponent || null;

    const children = [];

    if (header) children.push(React.createElement("Header", { key: "header" }, header));

    (data || []).forEach((item: any, index: number) => {
      const key = keyExtractor ? keyExtractor(item, index) : String(index);
      children.push(
        React.createElement("Row", { key: `row-${key}` }, renderItem({ item, index }))
      );
      if (ItemSeparatorComponent && index < data.length - 1) {
        children.push(
          React.createElement(
            "Sep",
            { key: `sep-${key}` },
            React.createElement(ItemSeparatorComponent, null)
          )
        );
      }
    });

    if (footer) children.push(React.createElement("Footer", { key: "footer" }, footer));

    return React.createElement("FlatList", { contentContainerStyle, ...rest }, children);
  };

  class AnimatedValue {
    _value: number;
    constructor(initial: number) {
      this._value = initial;
    }
    interpolate() {
      return 0;
    }
  }

  const Animated = {
    View: createHost("AnimatedView"),
    Value: AnimatedValue,
    timing: () => ({
      start: (cb?: any) => {
        if (cb) cb();
      },
    }),
  };

  const Modal = ({ visible, children }: any) =>
    visible ? React.createElement("Modal", null, children) : null;

  return {
    View: createHost("View"),
    Text: createHost("Text"),
    Image: createHost("Image"),
    StyleSheet,
    FlatList,
    Modal,
    Pressable,
    Animated,
  };
});

jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  return function IoniconsMock() {
    return React.createElement("Icon", null);
  };
});

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock("@react-navigation/native-stack", () => ({}));

jest.mock("../src/utils/useColorMode", () => ({
  useColorMode: () => "dark",
}));

jest.mock("../src/components/WatchlistCard", () => {
  const React = require("react");
  const { Text, Pressable, View } = require("react-native");

  return function MockWatchlistCard(props: any) {
    return (
      <View>
        <Text>{props.title}</Text>

        <Pressable onPress={props.onPress} testID={`open-${props.title}`}>
          <Text>Open</Text>
        </Pressable>

        <Pressable onPress={props.onRemove} testID={`remove-${props.title}`}>
          <Text>Trash</Text>
        </Pressable>
      </View>
    );
  };
});

describe("WatchlistScreen", () => {
  beforeEach(() => {
    useWatchlistStore.setState({
      hydrated: true,
      items: [{ id: 10, mediaType: "movie", title: "Baby", posterPath: null }],
    });
  });

  test("removes an item via modal confirm", async () => {
    const { getByText, getByTestId, queryByText } = render(<WatchlistScreen />);

    expect(getByText("Baby")).toBeTruthy();

    fireEvent.press(getByTestId("remove-Baby"));
    expect(getByText("Remove item?")).toBeTruthy();

    fireEvent.press(getByText("Remove"));

    await waitFor(() => {
      expect(queryByText("Baby")).toBeNull();
    });

    expect(getByText("Your watchlist is empty")).toBeTruthy();
  });
});
