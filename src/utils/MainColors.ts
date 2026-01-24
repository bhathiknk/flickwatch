// src/utils/MainColors.ts
// Premium cinematic color system - Netflix/HBO inspired

export type ColorMode = "light" | "dark";

export const LightColors = {
  // Backgrounds - Soft Premium White
  background: "#FFFFFF",
  surface: "#FAFAFA",
  surface2: "#aca6a6",
  border: "rgba(0,0,0,0.08)",

  // Text - Rich Black
  text: "#1A1A1A",
  textMuted: "rgba(26,26,26,0.60)",
  textFaint: "rgba(26,26,26,0.40)",

  // Primary - Netflix Red
  primary: "#E50914",
  primarySoft: "rgba(229,9,20,0.10)",
  
  // Accent - Gold Premium
  accent: "#D4AF37",
  accentSoft: "rgba(212,175,55,0.10)",

  // Status Colors
  rating: "#FFB800",
  danger: "#E50914",
  dangerSoft: "rgba(229,9,20,0.10)",

  // UI Elements
  sectionChipBg: "rgba(229,9,20,0.06)",
  sectionChipBorder: "rgba(229,9,20,0.15)",
  divider: "rgba(0,0,0,0.06)",

  overlay: "rgba(131, 127, 127, 0.85)",
  chipBg: "rgba(0,0,0,0.04)",
  chipBorder: "rgba(0,0,0,0.08)",
  buttonDark: "#F0F0F0",

  white: "#FFFFFF",
  shadow: "#000000",
} as const;

export const DarkColors = {
  // Backgrounds - Pure Black Premium
  background: "#000000",
  surface: "#141414",
  surface2: "#1F1F1F",
  border: "rgba(255,255,255,0.10)",

  // Text - Pure White
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.70)",
  textFaint: "rgba(255,255,255,0.50)",

  // Primary - Crimson Red
  primary: "#E50914",
  primarySoft: "rgba(229,9,20,0.15)",
  
  // Accent - Luxe Gold
  accent: "#FFD700",
  accentSoft: "rgba(255,215,0,0.15)",

  // Status Colors
  rating: "#FFD700",
  danger: "#FF4444",
  dangerSoft: "rgba(255,68,68,0.15)",

  // UI Elements
  sectionChipBg: "rgba(229,9,20,0.12)",
  sectionChipBorder: "rgba(229,9,20,0.30)",
  divider: "rgba(255,255,255,0.08)",

  overlay: "rgba(131, 127, 127, 0.85)",
  chipBg: "rgba(255,255,255,0.08)",
  chipBorder: "rgba(255,255,255,0.12)",
  buttonDark: "#1F1F1F",

  white: "#FFFFFF",
  shadow: "#000000",
} as const;

// MainColors is what your app imports everywhere
export const MainColors: Record<keyof typeof DarkColors, string> = {
  ...DarkColors, // Default to dark mode for premium feel
};

// --- tiny global color-mode store (no library needed) ---
let currentMode: ColorMode = "dark";
const listeners = new Set<(mode: ColorMode) => void>();

export function getColorMode(): ColorMode {
  return currentMode;
}

export function setColorMode(mode: ColorMode) {
  currentMode = mode;
  const next = mode === "dark" ? DarkColors : LightColors;

  // IMPORTANT: mutate existing object so all imports see updated values
  (Object.keys(next) as Array<keyof typeof next>).forEach((k) => {
    MainColors[k] = next[k];
  });

  listeners.forEach((fn) => fn(currentMode));
}

export function subscribeColorMode(fn: (mode: ColorMode) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}