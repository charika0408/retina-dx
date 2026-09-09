import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useTheme, makeStyles } from "../src/theme";
import { useScreening } from "../src/context/ScreeningContext";
import { SampleFundus } from "../src/types/screening";

export default function UploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = usePathname() === "/upload";
  const styles = useStyles();
  const { colors } = useTheme();

  const {
    selectedImageUri,
    selectedSample,
    samples,
    demoMode,
    setDemoMode,
    setSelectedImage,
    selectSample,
    clearSelection,
  } = useScreening();

  const [picking, setPicking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePickFromGallery = async () => {
    setErrorMessage(null);
    try {
      setPicking(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;
        setSelectedImage(asset.uri, base64Data);
      }
    } catch (err: any) {
      console.error("Gallery picker error:", err);
      setErrorMessage("Could not load selected image. Please try again.");
    } finally {
      setPicking(false);
    }
  };

  const handleCaptureCamera = async () => {
    setErrorMessage(null);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Camera permission is required to capture retinal images.");
        return;
      }

      setPicking(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;
        setSelectedImage(asset.uri, base64Data);
      }
    } catch (err: any) {
      console.error("Camera capture error:", err);
      setErrorMessage("Could not capture image from camera.");
    } finally {
      setPicking(false);
    }
  };

  const handleProceedToAnalysis = () => {
    if (!selectedImageUri && !selectedSample) {
      setErrorMessage("Please select a retinal image first.");
      return;
    }
    setErrorMessage(null);
    router.push("/analysis");
  };

  return (
    <View
      testID={isFocused ? "upload-screen" : undefined}
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          testID="upload-back-btn"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← BACK</Text>
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Retinal Screening</Text>
        </View>

        {/* Mode Toggle */}
        <Pressable
          testID="upload-mode-toggle"
          onPress={() => setDemoMode(!demoMode)}
          style={[
            styles.modePill,
            demoMode ? styles.modePillDemo : styles.modePillLive,
          ]}
        >
          <Text
            style={[
              styles.modeText,
              demoMode ? styles.modeTextDemo : styles.modeTextLive,
            ]}
          >
            {demoMode ? "DEMO" : "REAL AI"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Upload a retinal fundus image for AI-powered screening.
        </Text>

        {/* Error Alert */}
        {errorMessage && (
          <View testID="upload-error-banner" style={styles.errorBanner}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Curated Hackathon Demo Samples Shelf */}
        <View style={styles.samplesSection}>
          <View style={styles.samplesHeaderRow}>
            <Text style={styles.samplesSectionTitle}>QUICK HACKATHON SAMPLES</Text>
            <Text style={styles.samplesSubtitle}>One-tap fundus presets</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.samplesRow}
          >
            {samples.map((sample: SampleFundus) => {
              const isSelected = selectedSample?.id === sample.id;
              const isLowRisk = sample.expected_risk === "low_risk";

              return (
                <Pressable
                  key={sample.id}
                  testID={`sample-card-${sample.id}`}
                  onPress={() => {
                    selectSample(sample);
                    setErrorMessage(null);
                  }}
                  style={[
                    styles.sampleCard,
                    isSelected && styles.sampleCardSelected,
                  ]}
                >
                  <Image
                    source={{ uri: sample.image_url }}
                    style={styles.sampleThumb}
                    contentFit="cover"
                  />
                  <View style={styles.sampleMeta}>
                    <Text style={styles.sampleTitle} numberOfLines={1}>
                      {sample.title}
                    </Text>
                    <View
                      style={[
                        styles.sampleRiskTag,
                        isLowRisk ? styles.tagLowRisk : styles.tagHighRisk,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sampleRiskText,
                          isLowRisk ? styles.textLowRisk : styles.textHighRisk,
                        ]}
                      >
                        {isLowRisk ? "GRADE 0" : "GRADE 2 NPDR"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Primary Retinal Image Dropzone / Preview Area */}
        <View style={styles.dropzoneContainer}>
          {selectedImageUri ? (
            /* Selected Image Preview */
            <View testID="selected-image-preview-box" style={styles.previewBox}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.previewImage}
                contentFit="contain"
              />

              {/* Retinal Alignment Overlay Reticle */}
              <View style={styles.reticleOverlay}>
                <View style={styles.opticReticleCircle} />
                <View style={styles.foveaAimBox}>
                  <View style={styles.foveaAimDot} />
                </View>
                <Text style={styles.reticleStatus}>OPTICAL AXIS LOCKED</Text>
              </View>

              {/* Change Image Button */}
              <Pressable
                testID="change-image-btn"
                onPress={clearSelection}
                style={styles.changeImageBtn}
              >
                <Text style={styles.changeImageText}>↺ CHANGE IMAGE</Text>
              </Pressable>
            </View>
          ) : (
            /* Blank Upload Area */
            <View testID="empty-upload-area" style={styles.uploadBox}>
              {picking ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={colors.brandPrimary} />
                  <Text style={styles.loadingText}>Loading fundus image...</Text>
                </View>
              ) : (
                <View style={styles.uploadInner}>
                  <View style={styles.uploadIconCircle}>
                    <Text style={styles.uploadIcon}>🔬</Text>
                  </View>
                  <Text style={styles.uploadTitle}>Select Retinal Image</Text>
                  <Text style={styles.uploadSubtitle}>
                    Select a high-resolution retinal fundus photograph (.jpg, .png)
                  </Text>

                  {/* Dual Picker Buttons */}
                  <View style={styles.pickerButtonsRow}>
                    <Pressable
                      testID="gallery-picker-btn"
                      onPress={handlePickFromGallery}
                      style={styles.pickerBtn}
                    >
                      <Text style={styles.pickerBtnText}>📂 Open Gallery</Text>
                    </Pressable>

                    <Pressable
                      testID="camera-picker-btn"
                      onPress={handleCaptureCamera}
                      style={styles.pickerBtn}
                    >
                      <Text style={styles.pickerBtnText}>📷 Camera</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Clinical Guidance Helper Note */}
        <View style={styles.helperNoteBox}>
          <Text style={styles.helperIcon}>ℹ️</Text>
          <Text style={styles.helperText}>
            For best results, use a clear retinal fundus photograph. Standard selfies or external eye photos cannot be analyzed.
          </Text>
        </View>

        {/* Primary Action Button: ANALYZE IMAGE */}
        <Pressable
          testID="analyze-image-btn"
          onPress={handleProceedToAnalysis}
          disabled={!selectedImageUri && !selectedSample}
          style={({ pressed }) => [
            styles.analyzeButton,
            (!selectedImageUri && !selectedSample) && styles.analyzeButtonDisabled,
            pressed && styles.analyzeButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.analyzeButtonText,
              (!selectedImageUri && !selectedSample) && styles.analyzeButtonTextDisabled,
            ]}
          >
            ANALYZE IMAGE WITH AI
          </Text>
          <Text style={styles.analyzeArrow}>⚡</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: "rgba(10, 14, 23, 0.95)",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandPrimary,
    letterSpacing: 0.5,
  },
  headerTitleGroup: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  modePillLive: {
    backgroundColor: "rgba(0, 229, 255, 0.12)",
    borderColor: colors.brandPrimary,
  },
  modePillDemo: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: colors.warning,
  },
  modeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  modeTextLive: {
    color: colors.brandPrimary,
  },
  modeTextDemo: {
    color: colors.warning,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#FCA5A5",
  },
  samplesSection: {
    marginBottom: 20,
  },
  samplesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  samplesSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.8,
  },
  samplesSubtitle: {
    fontSize: 10,
    color: colors.muted,
  },
  samplesRow: {
    gap: 12,
    paddingBottom: 4,
  },
  sampleCard: {
    width: 140,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sampleCardSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: "rgba(0, 229, 255, 0.08)",
  },
  sampleThumb: {
    width: "100%",
    height: 90,
    backgroundColor: colors.surfaceTertiary,
  },
  sampleMeta: {
    padding: 8,
  },
  sampleTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: 4,
  },
  sampleRiskTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagLowRisk: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: colors.success,
  },
  tagHighRisk: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: colors.warning,
  },
  sampleRiskText: {
    fontSize: 8,
    fontWeight: "800",
  },
  textLowRisk: {
    color: colors.success,
  },
  textHighRisk: {
    color: colors.warning,
  },
  dropzoneContainer: {
    marginVertical: 12,
  },
  uploadBox: {
    width: "100%",
    height: 240,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: "rgba(19, 28, 46, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingBox: {
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: colors.muted,
  },
  uploadInner: {
    alignItems: "center",
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadIcon: {
    fontSize: 24,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 240,
    marginBottom: 16,
  },
  pickerButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  pickerBtn: {
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pickerBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  previewBox: {
    width: "100%",
    height: 260,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 14, 23, 0.25)",
  },
  opticReticleCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.4)",
    borderStyle: "dashed",
  },
  foveaAimBox: {
    position: "absolute",
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  foveaAimDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brandPrimary,
  },
  reticleStatus: {
    position: "absolute",
    bottom: 12,
    fontSize: 8,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.8,
    backgroundColor: "rgba(10, 14, 23, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  changeImageBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(19, 28, 46, 0.9)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  changeImageText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.5,
  },
  helperNoteBox: {
    flexDirection: "row",
    backgroundColor: "rgba(19, 28, 46, 0.4)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 12,
    marginVertical: 14,
    gap: 8,
    alignItems: "center",
  },
  helperIcon: {
    fontSize: 14,
  },
  helperText: {
    flex: 1,
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
  },
  analyzeButton: {
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  analyzeButtonDisabled: {
    backgroundColor: colors.surfaceTertiary,
    opacity: 0.6,
    shadowOpacity: 0,
  },
  analyzeButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.onBrandPrimary,
    letterSpacing: 1,
  },
  analyzeButtonTextDisabled: {
    color: colors.muted,
  },
  analyzeArrow: {
    fontSize: 16,
  },
}));
