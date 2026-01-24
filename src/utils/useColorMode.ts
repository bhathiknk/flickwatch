import { useEffect, useState } from "react";
import { ColorMode, getColorMode, subscribeColorMode } from "./MainColors";

export function useColorMode() {
  const [mode, setMode] = useState<ColorMode>(getColorMode());

  useEffect(() => {
    return subscribeColorMode(setMode);
  }, []);

  return mode;
}
