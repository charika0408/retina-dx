import React, { useEffect, useState } from "react";
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
const SCANNER_SIZE = Math.min(width * 0.74, 270);

interface NeuralScannerProps {
  imageUri?: string | null;
  onStepChange?: (stepIndex: number) => void;
}

export function NeuralScannerRing({ imageUri, onStepChange }: NeuralScannerProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const [activeStep, setActiveStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(12);

  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const scanBar = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
      false
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(0.96, { duration: 1200 })
      ),
      -1,
      true
    );

    scanBar.value = withRepeat(
      withSequence(
        withTiming(SCANNER_SIZE - 20, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Dynamic Step progression simulation
    const t1 = setTimeout(() => {
      setActiveStep(1);
      setProgressPercent(42);
      onStepChange?.(1);
    }, 900);

    const t2 = setTimeout(() => {
      setActiveStep(2);
      setProgressPercent(78);
      onStepChange?.(2);
    }, 2100);

    const t3 = setTimeout(() => {
      setActiveStep(3);
      setProgressPercent(98);
      onStepChange?.(3);
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const animatedScanBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanBar.value }],
  }));

  const steps = [
    { label: "Image received & calibrated", code: "INPUT_NORM_512" },
    { label: "Preparing optical segmentation", code: "CLAHE_ENHANCE" },
    { label: "AI screening in progress", code: "EFFICIENTNET_APTOS" },
    { label: "Synthesizing clinical report", code: "BIOMARKER_SYNTHESIS" },
  ];

  return (
    <View testID="neural-scanner-container" style={styles.container}>
      {/* Visual Scanning Aperture */}
      <View style={styles.scannerViewport}>
        <Animated.View style={[styles.glowRing, animatedPulseStyle]} />

        {/* Outer Rotating Radar Line */}
        <Animated.View style={[styles.radarRing, animatedRotateStyle]}>
          <View style={styles.radarNeedle} />
          <View style={styles.radarNeedleOpposite} />
        </Animated.View>

        {/* Retinal Fundus Image Scan Window */}
        <View style={styles.imageAperture}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.retinaImage}
              contentFit="cover"
            />
          ) : (
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1682663947127-ac9d59d7f312?q=80&w=800&auto=format&fit=crop" }}
              style={styles.retinaImage}
              contentFit="cover"
            />
          )}

          <View style={styles.apertureOverlay} />

          {/* Sweeping Laser Line */}
          <Animated.View style={[styles.laserScanLine, animatedScanBarStyle]} />

          {/* Center Crosshair & Telemetry Ring */}
          <View style={styles.targetReticle}>
            <View style={styles.reticleDot} />
          </View>
        </View>

        {/* Progress Percentage Badge */}
        <View style={styles.progressPill}>
          <Text style={styles.progressPercentText}>{progressPercent}%</Text>
          <Text style={styles.progressPercentSub}>NEURAL INFERENCE</Text>
        </View>
      </View>

      {/* Progress Steps Checklist */}
      <View style={styles.stepsCard}>
        <Text style={styles.pipelineHeader}>PIPELINE TELEMETRY</Text>

        {steps.map((step, idx) => {
          const isDone = activeStep > idx;
          const isCurrent = activeStep === idx;

          return (
            <View
              key={step.code}
              testID={`scan-step-${idx}`}
              style={[
                styles.stepRow,
                isCurrent && styles.stepRowCurrent,
              ]}
            >
              <View
                style={[
                  styles.stepStatusIcon,
                  isDone && styles.stepStatusDone,
                  isCurrent && styles.stepStatusCurrent,
                ]}
              >
                {isDone ? (
                  <Text style={styles.checkIcon}>✓</Text>
                ) : isCurrent ? (
                  <View style={styles.pulsingCurrentDot} />
                ) : (
                  <View style={styles.pendingDot} />
                )}
              </View>

              <View style={styles.stepTextContainer}>
                <Text
                  style={[
                    styles.stepLabel,
                    (isDone || isCurrent) && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.stepCode}>{step.code}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    alignItems: "center",
    width: "100%",
  },
  scannerViewport: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
  },
  glowRing: {
    position: "absolute",
    width: SCANNER_SIZE * 0.95,
    height: SCANNER_SIZE * 0.95,
    borderRadius: SCANNER_SIZE / 2,
    backgroundColor: "rgba(0, 229, 255, 0.12)",
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
  },
  radarRing: {
    position: "absolute",
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderRadius: SCANNER_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(0, 229, 255, 0.4)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  radarNeedle: {
    position: "absolute",
    top: -4,
    width: 10,
    height: 10,
    backgroundColor: colors.brandPrimary,
    borderRadius: 3,
  },
  radarNeedleOpposite: {
    position: "absolute",
    bottom: -4,
    width: 10,
    height: 10,
    backgroundColor: "#A855F7",
    borderRadius: 3,
  },
  imageAperture: {
    width: SCANNER_SIZE * 0.76,
    height: SCANNER_SIZE * 0.76,
    borderRadius: (SCANNER_SIZE * 0.76) / 2,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  retinaImage: {
    width: "100%",
    height: "100%",
    opacity: 0.85,
  },
  apertureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 14, 23, 0.4)",
  },
  laserScanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.brandPrimary,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  targetReticle: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.6)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  reticleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandPrimary,
  },
  progressPill: {
    position: "absolute",
    bottom: -10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  progressPercentText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.5,
  },
  progressPercentSub: {
    fontSize: 8,
    color: colors.muted,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  stepsCard: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 12,
  },
  pipelineHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brandPrimary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 12,
  },
  stepRowCurrent: {
    backgroundColor: "rgba(0, 229, 255, 0.05)",
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  stepStatusIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepStatusDone: {
    borderColor: colors.success,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  stepStatusCurrent: {
    borderColor: colors.brandPrimary,
    backgroundColor: "rgba(0, 229, 255, 0.15)",
  },
  checkIcon: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "800",
  },
  pulsingCurrentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandPrimary,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.muted,
  },
  stepTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
  },
  stepLabelActive: {
    color: colors.onSurface,
    fontWeight: "600",
  },
  stepCode: {
    fontSize: 9,
    color: colors.muted,
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
}));
