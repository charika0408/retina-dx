import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useTheme, makeStyles } from "../theme";

const { width } = Dimensions.get("window");
const HERO_SIZE = Math.min(width * 0.72, 280);

export function RetinaHeroVisual() {
  const styles = useStyles();
  const { colors } = useTheme();

  // Animation values
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const scanLine = useSharedValue(0);
  const opacityGlow = useSharedValue(0.4);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 18000, easing: Easing.linear }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.96, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    scanLine.value = withRepeat(
      withSequence(
        withTiming(HERO_SIZE - 20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    opacityGlow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 2000 }),
        withTiming(0.35, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: opacityGlow.value,
  }));

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value }],
  }));

  return (
    <View testID="retina-hero-visual" style={styles.container}>
      {/* Background ambient glow */}
      <Animated.View style={[styles.ambientGlow, animatedPulseStyle]} />

      {/* Outer rotating telemetry ring */}
      <Animated.View style={[styles.outerRing, animatedRingStyle]}>
        <View style={styles.reticleMarkTop} />
        <View style={styles.reticleMarkBottom} />
        <View style={styles.reticleMarkLeft} />
        <View style={styles.reticleMarkRight} />
        <View style={styles.orbitalNode1} />
        <View style={styles.orbitalNode2} />
      </Animated.View>

      {/* Middle static grid ring */}
      <View style={styles.middleRing}>
        <View style={styles.crosshairVertical} />
        <View style={styles.crosshairHorizontal} />
      </View>

      {/* Center Retinal Fundus preview aperture */}
      <View style={styles.centerAperture}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1682663947127-ac9d59d7f312?q=80&w=800&auto=format&fit=crop" }}
          style={styles.fundusImage}
          contentFit="cover"
        />
        <View style={styles.opticFilter} />

        {/* Dynamic laser scan bar */}
        <Animated.View style={[styles.laserBar, animatedScanLineStyle]} />

        {/* Center Target Box */}
        <View style={styles.foveaTargetBox}>
          <View style={styles.foveaDot} />
          <Text style={styles.targetLabel}>MACULAR POLE</Text>
        </View>
      </View>

      {/* Telemetry pill badges */}
      <View style={styles.telemetryBadgeTop}>
        <View style={styles.statusLiveDot} />
        <Text style={styles.telemetryText}>APTOS-2019 NEURAL v2.4</Text>
      </View>
      <View style={styles.telemetryBadgeBottom}>
        <Text style={styles.telemetryText}>FOVEA ALIGN: OPTIMAL</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    width: HERO_SIZE + 40,
    height: HERO_SIZE + 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 12,
  },
  ambientGlow: {
    position: "absolute",
    width: HERO_SIZE * 0.9,
    height: HERO_SIZE * 0.9,
    borderRadius: HERO_SIZE,
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  outerRing: {
    position: "absolute",
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(0, 229, 255, 0.35)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  reticleMarkTop: {
    position: "absolute",
    top: -4,
    width: 8,
    height: 8,
    backgroundColor: colors.brandPrimary,
    borderRadius: 2,
  },
  reticleMarkBottom: {
    position: "absolute",
    bottom: -4,
    width: 8,
    height: 8,
    backgroundColor: colors.brandPrimary,
    borderRadius: 2,
  },
  reticleMarkLeft: {
    position: "absolute",
    left: -4,
    width: 8,
    height: 8,
    backgroundColor: colors.brandPrimary,
    borderRadius: 2,
  },
  reticleMarkRight: {
    position: "absolute",
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: colors.brandPrimary,
    borderRadius: 2,
  },
  orbitalNode1: {
    position: "absolute",
    top: "20%",
    right: "10%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A855F7",
  },
  orbitalNode2: {
    position: "absolute",
    bottom: "20%",
    left: "10%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandPrimary,
  },
  middleRing: {
    position: "absolute",
    width: HERO_SIZE * 0.84,
    height: HERO_SIZE * 0.84,
    borderRadius: (HERO_SIZE * 0.84) / 2,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairVertical: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0, 229, 255, 0.15)",
  },
  crosshairHorizontal: {
    position: "absolute",
    height: 1,
    width: "100%",
    backgroundColor: "rgba(0, 229, 255, 0.15)",
  },
  centerAperture: {
    width: HERO_SIZE * 0.7,
    height: HERO_SIZE * 0.7,
    borderRadius: (HERO_SIZE * 0.7) / 2,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  fundusImage: {
    width: "100%",
    height: "100%",
    opacity: 0.85,
  },
  opticFilter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 14, 23, 0.35)",
  },
  laserBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: colors.brandPrimary,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  foveaTargetBox: {
    position: "absolute",
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.6)",
    borderStyle: "dashed",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  foveaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandPrimary,
  },
  targetLabel: {
    position: "absolute",
    bottom: -14,
    fontSize: 7,
    color: colors.brandPrimary,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  telemetryBadgeTop: {
    position: "absolute",
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(19, 28, 46, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandPrimary,
  },
  telemetryBadgeBottom: {
    position: "absolute",
    bottom: 0,
    backgroundColor: "rgba(19, 28, 46, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  telemetryText: {
    fontSize: 9,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
}));
