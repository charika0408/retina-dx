import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useTheme, makeStyles } from "../src/theme";
import { useScreening } from "../src/context/ScreeningContext";
import { RiskBadge } from "../src/components/RiskBadge";
import { BiomarkerCard } from "../src/components/BiomarkerCard";
import { ReportExportCard } from "../src/components/ReportExportCard";
import { ScanHistoryModal } from "../src/components/ScanHistoryModal";

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();

  const { currentResult, clearSelection, setCurrentResult } = useScreening();
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Fallback if accessed without scan
  if (!currentResult) {
    return (
      <View testID="results-empty-state" style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔬</Text>
          <Text style={styles.emptyTitle}>No Active Screening Result</Text>
          <Text style={styles.emptySubtitle}>
            Please upload a retinal fundus photograph to perform an AI screening.
          </Text>
          <Pressable
            testID="go-to-upload-btn"
            onPress={() => router.replace("/upload")}
            style={styles.primaryCta}
          >
            <Text style={styles.primaryCtaText}>START NEW SCREENING</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isLowRisk = currentResult.risk_level === "low_risk";

  const handleScanAnother = () => {
    clearSelection();
    setCurrentResult(null);
    router.dismissTo("/upload");
  };

  return (
    <View testID="results-screen" style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <Pressable
          testID="results-home-btn"
          onPress={() => router.replace("/")}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>🏠 HOME</Text>
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Screening Results</Text>
          <Text style={styles.scanIdLabel}>SCAN {currentResult.scan_id}</Text>
        </View>

        <Pressable
          testID="results-history-btn"
          onPress={() => setHistoryModalOpen(true)}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>📜 LOGS</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Prominent Risk Badge */}
        <RiskBadge
          riskLevel={currentResult.risk_level}
          riskLabel={currentResult.risk_label}
          confidence={currentResult.confidence}
        />

        {/* Primary Medical Result Statement */}
        <View
          testID="result-statement-card"
          style={[
            styles.statementCard,
            isLowRisk ? styles.statementCardLowRisk : styles.statementCardHighRisk,
          ]}
        >
          <Text style={styles.statementText}>
            {isLowRisk
              ? "Your screening did not detect significant retinal features commonly associated with diabetic retinopathy."
              : "The AI screening identified retinal features that may be associated with diabetic retinopathy."}
          </Text>
        </View>

        {/* Image Preview & Optic Disc Mapping Thumbnail */}
        {currentResult.image_uri && (
          <View style={styles.scanThumbnailBox}>
            <Image
              source={{ uri: currentResult.image_uri }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
            <View style={styles.thumbnailOverlay}>
              <Text style={styles.thumbnailTag}>EVALUATED FUNDUS SCAN</Text>
              <Text style={styles.thumbnailStage}>{currentResult.dr_grade}</Text>
            </View>
          </View>
        )}

        {/* Detailed Retinal Biomarkers Card */}
        <BiomarkerCard
          biomarkers={currentResult.biomarkers}
          drGrade={currentResult.dr_grade}
        />

        {/* Clinical Recommendations Block */}
        <View testID="recommendations-card" style={styles.recommendationsCard}>
          <View style={styles.recHeaderRow}>
            <View style={styles.recIndicator} />
            <Text style={styles.recTitle}>RECOMMENDATION</Text>
          </View>

          <Text style={styles.primaryRecHighlight}>
            "Consider consulting a qualified ophthalmologist for professional evaluation."
          </Text>

          <View style={styles.recBulletList}>
            {currentResult.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recBulletRow}>
                <Text style={styles.recBulletDot}>•</Text>
                <Text style={styles.recBulletText}>{rec}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exportable Summary Card */}
        <ReportExportCard result={currentResult} />

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <Pressable
            testID="scan-another-btn"
            onPress={handleScanAnother}
            style={({ pressed }) => [
              styles.primaryCta,
              pressed && styles.primaryCtaPressed,
            ]}
          >
            <Text style={styles.primaryCtaText}>SCAN ANOTHER IMAGE</Text>
            <Text style={styles.ctaIcon}>📸</Text>
          </Pressable>
        </View>

        {/* Mandatory Research & Medical Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            {currentResult.disclaimer}
          </Text>
        </View>
      </ScrollView>

      {/* History Audit Modal */}
      <ScanHistoryModal
        visible={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onSelectScan={(scan) => {
          setCurrentResult(scan);
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
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
  },
  headerTitleGroup: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  scanIdLabel: {
    fontSize: 9,
    color: colors.brandPrimary,
    fontFamily: "monospace",
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  statementCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  statementCardLowRisk: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  statementCardHighRisk: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  statementText: {
    fontSize: 13,
    color: colors.onSurface,
    lineHeight: 20,
    fontWeight: "600",
  },
  scanThumbnailBox: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 10,
    backgroundColor: colors.surfaceSecondary,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 14, 23, 0.5)",
    justifyContent: "flex-end",
    padding: 10,
  },
  thumbnailTag: {
    fontSize: 8,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.8,
  },
  thumbnailStage: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurface,
    marginTop: 2,
  },
  recommendationsCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginVertical: 10,
  },
  recHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recIndicator: {
    width: 4,
    height: 14,
    backgroundColor: colors.brandPrimary,
    borderRadius: 2,
  },
  recTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: 1,
  },
  primaryRecHighlight: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandPrimary,
    lineHeight: 18,
    fontStyle: "italic",
    marginBottom: 12,
  },
  recBulletList: {
    gap: 8,
  },
  recBulletRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  recBulletDot: {
    color: colors.brandPrimary,
    fontSize: 14,
    lineHeight: 16,
  },
  recBulletText: {
    flex: 1,
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    lineHeight: 18,
  },
  actionButtonsRow: {
    marginTop: 12,
    marginBottom: 16,
  },
  primaryCta: {
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  primaryCtaPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  primaryCtaText: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.onBrandPrimary,
    letterSpacing: 1,
  },
  ctaIcon: {
    fontSize: 16,
  },
  disclaimerContainer: {
    backgroundColor: "rgba(10, 14, 23, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 12,
  },
  disclaimerText: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 15,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
}));
