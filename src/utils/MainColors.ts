// src/theme/MainColors.ts
// Central place for app colors so UI stays consistent across screens/components.

export const MainColors = {
  background: "#0B0F19",     // deep navy (premium feel)
  surface: "#121A2B",        // card surface
  surface2: "#16213A",       // elevated surface (headers/blocks)
  border: "rgba(255,255,255,0.08)",

  text: "#F4F7FF",
  textMuted: "rgba(244,247,255,0.72)",
  textFaint: "rgba(244,247,255,0.55)",

  primary: "#6D5EF9",        // vibrant purple
  primarySoft: "rgba(109,94,249,0.18)",
  accent: "#24D2C1",         // teal accent
  accentSoft: "rgba(36,210,193,0.18)",

  rating: "#FFC857",         // warm gold for rating
  danger: "#FF5C6C",
  dangerSoft: "rgba(255,92,108,0.18)",

  white: "#FFFFFF",
  shadow: "#000000",
} as const;
