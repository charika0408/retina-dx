import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, makeStyles } from "../src/theme";
import { useScreening } from "../src/context/ScreeningContext";
import { NeuralScannerRing } from "../src/components/NeuralScannerRing";

export default function AnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { selectedImageUri, selectedSample, runScreening, demoMode } = useScreening();
  const [hasError, setHasError] = useState<string | null>(null);
  const [analyzingStatus, setAnalyzingStatus] = useState("Loading APTOS EfficientNet-B0...");
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    const execute = async () => {
      try {
        setHasError(null);
        const [result] = await Promise.all([
          runScreening(),
          new Promise((resolve) => setTimeout(resolve, 2800)),
        ]);
        if (result) router.replace("/results");
      } catch (err: any) {
        console.error("Screening execution failed:", err);
        setHasError(err.message || "Analysis could not be completed. Please try again.");
      }
    };
    execute();
  }, []);

  const handleStepChange = (step: number) => {
    if (step === 1) setAnalyzingStatus("Preprocessing retinal fundus image...");
    if (step === 2) setAnalyzingStatus("Running APTOS EfficientNet-B0 classification...");
    if (step === 3) setAnalyzingStatus("Calculating diabetic-retinopathy grade...");
  };

  return (
    <View testID="analysis-screen" style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>
            {demoMode ? "DEMO MODE ACTIVE" : "APTOS AI MODEL ACTIVE"}
          </Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Analyzing retinal image</Text>
        <Text style={styles.subtitle}>
          EfficientNet-B0 trained on the APTOS 2019 retinal dataset is screening the image for diabetic retinopathy severity.
        </Text>
        {hasError ? (
          <View testID="analysis-error-card" style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Analysis Interrupted</Text>
            <Text style={styles.errorText}>{hasError}</Text>
            <View style={styles.errorActions}>
              <Pressable testID="retry-analysis-btn" onPress={() => { hasTriggeredRef.current = false; setHasError(null); router.replace("/upload"); }} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>← RETURN TO UPLOAD</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.scannerWrapper}>
            <NeuralScannerRing imageUri={selectedImageUri || selectedSample?.image_url} onStepChange={handleStepChange} />
            <Text style={styles.liveTelemetryNote}>{analyzingStatus}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 20, paddingVertical: 12, alignItems: "center" },
  modeBadge: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  modeBadgeText: { fontSize: 10, fontWeight: "800", color: colors.brandPrimary, letterSpacing: 0.8 },
  content: { flex: 1, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: colors.onSurface, textAlign: "center", letterSpacing: 0.5 },
  subtitle: { fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 18, marginTop: 6, maxWidth: 320, marginBottom: 12 },
  scannerWrapper: { width: "100%", alignItems: "center" },
  liveTelemetryNote: { fontSize: 11, color: colors.brandPrimary, fontWeight: "600", marginTop: 8, letterSpacing: 0.5 },
  errorCard: { width: "100%", backgroundColor: "rgba(239, 68, 68, 0.1)", borderWidth: 1, borderColor: colors.error, borderRadius: 16, padding: 20, alignItems: "center", marginTop: 24 },
  errorIcon: { fontSize: 32, marginBottom: 8 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#FCA5A5", marginBottom: 6 },
  errorText: { fontSize: 12, color: colors.onSurfaceSecondary, textAlign: "center", lineHeight: 18, marginBottom: 16 },
  errorActions: { width: "100%" },
  retryBtn: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.borderStrong, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  retryBtnText: { fontSize: 12, fontWeight: "800", color: colors.brandPrimary, letterSpacing: 0.5 },
}));
