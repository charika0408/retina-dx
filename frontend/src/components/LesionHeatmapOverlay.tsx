import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { Lesion } from "../types/screening";
import { useTheme, makeStyles, ThemeColors } from "../theme";

interface LesionHeatmapOverlayProps {
  imageUri: string;
  lesions: Lesion[];
  drGrade: string;
}

const LESION_TYPE_META: Record<
  Lesion["type"],
  { label: string; colorKey: keyof ThemeColors }
> = {
  microaneurysm: { label: "Microaneurysms", colorKey: "lesionMicroaneurysm" },
  exudate: { label: "Exudates", colorKey: "lesionExudate" },
  hemorrhage: { label: "Hemorrhages", colorKey: "lesionHemorrhage" },
};

interface DrawnRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function GlowMarker({ lesion, color, rect }: { lesion: Lesion; color: string; rect: DrawnRect }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.45 - (pulse.value - 1) * 0.6,
  }));

  const core = Math.max(10, lesion.radius * 2 * rect.w);
  const mid = core * 1.8;
  const halo = core * 3;
  const cx = rect.x + lesion.x * rect.w;
  const cy = rect.y + lesion.y * rect.h;

  const circle = (size: number) => ({
    position: "absolute" as const,
    left: cx - size / 2,
    top: cy - size / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  });

  return (
    <>
      <Animated.View pointerEvents="none" style={[circle(halo), haloStyle]} />
      <View pointerEvents="none" style={[circle(mid), { opacity: 0.35 * lesion.intensity + 0.15 }]} />
      <View
        pointerEvents="none"
        style={[
          circle(core),
          {
            borderWidth: 1.5,
            borderColor: color,
            opacity: 0.55 + 0.4 * lesion.intensity,
            shadowColor: color,
            shadowOpacity: 0.9,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />
    </>
  );
}

export function LesionHeatmapOverlay({ imageUri, lesions, drGrade }: LesionHeatmapOverlayProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [heatmapOn, setHeatmapOn] = useState(true);
  const [boxSize, setBoxSize] = useState(0);
  const [imageAspect, setImageAspect] = useState(1);

  // Image is letterboxed ("contain") inside a square box; map normalized
  // image coordinates onto the actually drawn image rectangle.
  const rect: DrawnRect = useMemo(() => {
    if (boxSize === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const w = imageAspect >= 1 ? boxSize : boxSize * imageAspect;
    const h = imageAspect >= 1 ? boxSize / imageAspect : boxSize;
    return { x: (boxSize - w) / 2, y: (boxSize - h) / 2, w, h };
  }, [boxSize, imageAspect]);

  const counts = useMemo(() => {
    const c: Record<Lesion["type"], number> = { microaneurysm: 0, exudate: 0, hemorrhage: 0 };
    lesions.forEach((l) => {
      c[l.type] = (c[l.type] ?? 0) + 1;
    });
    return c;
  }, [lesions]);

  const hasLesions = lesions.length > 0;

  return (
    <View testID="lesion-heatmap-card" style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>AI ATTENTION HEATMAP</Text>
          <Text style={styles.subtitle}>
            {hasLesions
              ? `${lesions.length} suspicious region${lesions.length > 1 ? "s" : ""} localized`
              : "No suspicious regions localized"}
          </Text>
        </View>
        <Pressable
          testID="heatmap-toggle-btn"
          onPress={() => setHeatmapOn((v) => !v)}
          style={[styles.toggle, heatmapOn ? styles.toggleOn : styles.toggleOff]}
        >
          <View style={[styles.toggleDot, heatmapOn ? styles.toggleDotOn : styles.toggleDotOff]} />
          <Text style={[styles.toggleText, heatmapOn ? styles.toggleTextOn : styles.toggleTextOff]}>
            {heatmapOn ? "HEATMAP ON" : "HEATMAP OFF"}
          </Text>
        </Pressable>
      </View>

      <View
        testID="lesion-heatmap-image"
        style={styles.imageBox}
        onLayout={(e) => setBoxSize(e.nativeEvent.layout.width)}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="contain"
          onLoad={(e) => {
            const { width, height } = e.source;
            if (width > 0 && height > 0) setImageAspect(width / height);
          }}
        />

        {heatmapOn && boxSize > 0 && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={styles.tint} />
            {lesions.map((lesion, idx) => (
              <GlowMarker
                key={`${lesion.type}-${idx}`}
                lesion={lesion}
                rect={rect}
                color={colors[LESION_TYPE_META[lesion.type].colorKey] as string}
              />
            ))}
            {!hasLesions && (
              <View style={styles.clearBadgeWrap}>
                <View style={styles.clearBadge}>
                  <Text style={styles.clearBadgeText}>✓ FUNDUS CLEAR · NO LESIONS MAPPED</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.gradeTag}>
          <Text style={styles.gradeTagText} numberOfLines={1}>{drGrade}</Text>
        </View>
      </View>

      <View style={styles.legendRow}>
        {(Object.keys(LESION_TYPE_META) as Lesion["type"][]).map((type) => {
          const meta = LESION_TYPE_META[type];
          const color = colors[meta.colorKey] as string;
          const count = counts[type];
          return (
            <View
              key={type}
              testID={`legend-${type}`}
              style={[styles.legendChip, count === 0 && styles.legendChipMuted]}
            >
              <View style={[styles.legendDot, { backgroundColor: color, shadowColor: color }]} />
              <Text style={styles.legendLabel}>{meta.label}</Text>
              <Text style={[styles.legendCount, { color: count > 0 ? color : colors.muted }]}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 32,
  },
  toggleOn: {
    backgroundColor: colors.brandTertiary,
    borderColor: colors.brandPrimary,
  },
  toggleOff: {
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.border,
  },
  toggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toggleDotOn: { backgroundColor: colors.brandPrimary },
  toggleDotOff: { backgroundColor: colors.muted },
  toggleText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  toggleTextOn: { color: colors.brandPrimary },
  toggleTextOff: { color: colors.muted },
  imageBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#000000",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 14, 23, 0.28)",
  },
  clearBadgeWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBadge: {
    backgroundColor: "rgba(10, 14, 23, 0.82)",
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  clearBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.success,
    letterSpacing: 0.8,
  },
  gradeTag: {
    position: "absolute",
    left: 10,
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(10, 14, 23, 0.82)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  gradeTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurface,
  },
  legendRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  legendChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  legendChipMuted: {
    opacity: 0.55,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  legendLabel: {
    flex: 1,
    fontSize: 9,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  legendCount: {
    fontSize: 11,
    fontWeight: "900",
  },
}));
