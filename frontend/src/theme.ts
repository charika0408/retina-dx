import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

// Obsidian & Electric Cyan Command-Center Palette (Dark-First)
const dark = {
  // Surfaces: Deep obsidian to command-center navy
  surface: "#0A0E17",
  onSurface: "#F0F4F8",
  surfaceSecondary: "#131C2E",
  onSurfaceSecondary: "#C5D1E0",
  surfaceTertiary: "#1C2841",
  onSurfaceTertiary: "#94A9C9",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#0A0E17",
  muted: "#7A92B6",

  // Brand: Electric Cyan & Medical Teal
  brand: "#00E5FF",
  onBrand: "#0A0E17",
  brandPrimary: "#00E5FF",
  onBrandPrimary: "#0A0E17",
  brandSecondary: "#00A8B5",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "rgba(0, 229, 255, 0.12)",
  onBrandTertiary: "#00E5FF",

  // Clinical Status Indicators
  success: "#10B981",
  onSuccess: "#0A0E17",
  warning: "#F59E0B",
  onWarning: "#0A0E17",
  error: "#EF4444",
  onError: "#0A0E17",
  info: "#3B82F6",
  onInfo: "#0A0E17",

  // Structural lines & borders
  border: "#223254",
  borderStrong: "#00E5FF",
  divider: "#192842",
};

// Mirroring dark tokens to ensure high-tech dark UI consistency across all devices
const light = {
  ...dark,
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}

setColorScheme?.("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  return { scheme: "dark", colors: dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
