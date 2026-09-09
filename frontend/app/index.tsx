import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, makeStyles } from "../src/theme";
import { useScreening } from "../src/context/ScreeningContext";
import { RetinaHeroVisual } from "../src/components/RetinaHeroVisual";
import { ComingSoonCard } from "../src/components/ComingSoonCard";
import { ScanHistoryModal } from "../src/components/ScanHistoryModal";

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { demoMode, setDemoMode, setCurrentResult } = useScreening();

  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  return (
    <View testID="landing-screen" style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top Command Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandPulseDot} />
          <Text style={styles.brandName}>RETINA-DX</Text>
          <View style={styles.badgeVersion}>
            <Text style={styles.badgeVersionText}>AI v2.4</Text>
          </View>
        </View>

        <View style={styles.topActionsRow}>
          {/* Demo Mode Toggle */}
          <Pressable
            testID="demo-mode-toggle"
            onPress={() => setDemoMode(!demoMode)}
            style={[
              styles.modePill,
              demoMode ? styles.modePillDemo : styles.modePillLive,
            ]}
          >
            <View
              style={[
                styles.modeDot,
                demoMode ? styles.modeDotDemo : styles.modeDotLive,
              ]}
            />
            <Text
              style={[
                styles.modeText,
                demoMode ? styles.modeTextDemo : styles.modeTextLive,
              ]}
            >
              {demoMode ? "DEMO MODE" : "REAL AI"}
            </Text>
          </Pressable>

          {/* Audit History Button */}
          <Pressable
            testID="open-history-btn"
            onPress={() => setHistoryModalOpen(true)}
            style={styles.historyBtn}
          >
            <Text style={styles.historyBtnText}>📜 AUDIT</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Branding Section */}
        <View style={styles.heroSection}>
          <Text style={styles.tagline}>AI-powered retinal screening</Text>
          <Text style={styles.description}>
            Advanced retinal image analysis for intelligent health screening.
          </Text>

          {/* Eye-inspired Hero Element */}
          <RetinaHeroVisual />

          {/* Primary CTA */}
          <Pressable
            testID="start-screening-btn"
            onPress={() => router.push("/upload")}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
          >
            <View style={styles.ctaGlow} />
            <Text style={styles.ctaButtonText}>START SCREENING</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </Pressable>
        </View>

        {/* Clinical Specs Banner */}
        <View style={styles.specsBanner}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>DATASET</Text>
            <Text style={styles.specValue}>APTOS 2019</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>MODEL</Text>
            <Text style={styles.specValue}>EfficientNet-B0</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>FOCUS</Text>
            <Text style={styles.specValue}>Diabetic Retinopathy</Text>
          </View>
        </View>

        {/* Section: Expanding The Vision */}
        <View style={styles.pipelineSection}>
          <View style={styles.pipelineHeaderRow}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.pipelineTitle}>EXPANDING THE VISION</Text>
          </View>
          <Text style={styles.pipelineSubtitle}>
            Next-generation ophthalmic diagnostic pipelines currently under clinical development.
          </Text>

          <ComingSoonCard
            title="Glaucoma Screening"
            targetAilment="OPTIC NERVE"
            description="Deep cup-to-disc ratio (CDR) segmentation with neuroretinal rim loss prediction."
          />

          <ComingSoonCard
            title="AMD Screening"
            targetAilment="MACULAR DEGENERATION"
            description="Automated drusen classification and geographic atrophy biomarker mapping."
          />

          <ComingSoonCard
            title="Hypertensive Retinopathy"
            targetAilment="VASCULAR MORPHOLOGY"
            description="Arteriolar-to-venular ratio (AVR) calculation and vascular caliber index tracking."
          />
        </View>

        {/* Medical & Research Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>RESEARCH PROTOTYPE NOTICE</Text>
          <Text style={styles.disclaimerText}>
            RETINA-DX is an AI-powered research prototype and does not provide a medical diagnosis. Professional medical evaluation is recommended.
          </Text>
        </View>
      </ScrollView>

      {/* History Audit Modal */}
      <ScanHistoryModal
        visible={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onSelectScan={(scan) => {
          setCurrentResult(scan);
          router.push("/results");
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: "rgba(10, 14, 23, 0.95)",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandPrimary,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.onSurface,
    letterSpacing: 1.2,
  },
  badgeVersion: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeVersionText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  modePillLive: {
    backgroundColor: "rgba(0, 229, 255, 0.12)",
    borderColor: colors.brandPrimary,
  },
  modePillDemo: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: colors.warning,
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modeDotLive: {
    backgroundColor: colors.brandPrimary,
  },
  modeDotDemo: {
    backgroundColor: colors.warning,
  },
  modeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modeTextLive: {
    color: colors.brandPrimary,
  },
  modeTextDemo: {
    color: colors.warning,
  },
  historyBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  tagline: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 320,
  },
  ctaButton: {
    width: "100%",
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 18,
    gap: 10,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  ctaButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  ctaGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.onBrandPrimary,
    letterSpacing: 1,
  },
  ctaArrow: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.onBrandPrimary,
  },
  specsBanner: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 28,
    alignItems: "center",
  },
  specItem: {
    flex: 1,
    alignItems: "center",
  },
  specDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
  },
  specLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  specValue: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  pipelineSection: {
    marginBottom: 24,
  },
  pipelineHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionIndicator: {
    width: 4,
    height: 14,
    backgroundColor: colors.brandPrimary,
    borderRadius: 2,
  },
  pipelineTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 1,
  },
  pipelineSubtitle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  disclaimerBox: {
    backgroundColor: "rgba(10, 14, 23, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
    marginTop: 4,
  },
  disclaimerTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
  },
}));
