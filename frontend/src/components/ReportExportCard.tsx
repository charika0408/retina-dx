import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Share, Platform } from "react-native";
import { ScreeningResult } from "../types/screening";
import { useTheme, makeStyles } from "../theme";

interface ReportExportCardProps {
  result: ScreeningResult;
}

export function ReportExportCard({ result }: ReportExportCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const isLowRisk = result.risk_level === "low_risk";

  const handleShare = async () => {
    const summaryText = `
=== RETINA-DX SCREENING SUMMARY ===
Scan ID: ${result.scan_id}
Date: ${new Date(result.created_at).toLocaleString()}
Status: ${result.risk_label}
Screening Confidence: ${result.confidence.toFixed(1)}%
DR Classification: ${result.dr_grade}
Vasculature Index: ${result.biomarkers.vasculature_index.toFixed(1)}%

Recommendation:
${result.recommendations.join("\n")}

Disclaimer:
${result.disclaimer}
===================================
    `.trim();

    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(summaryText);
          } else {
            throw new Error("No clipboard API");
          }
        } catch (_) {
          // Fallback DOM copy for sandboxed browsers
          const textArea = document.createElement("textarea");
          textArea.value = summaryText;
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        await Share.share({
          title: `RETINA-DX Screening Report [${result.scan_id}]`,
          message: summaryText,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.warn("Share action error:", err);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <View testID="report-export-card" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>RETINA-DX CLINICAL TELEMETRY</Text>
          <Text style={styles.scanId}>ID: {result.scan_id}</Text>
        </View>

        <View
          style={[
            styles.riskPill,
            isLowRisk ? styles.pillLowRisk : styles.pillHighRisk,
          ]}
        >
          <Text
            style={[
              styles.riskPillText,
              isLowRisk ? styles.textLowRisk : styles.textHighRisk,
            ]}
          >
            {result.risk_label}
          </Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.gridCell}>
          <Text style={styles.cellLabel}>CONFIDENCE</Text>
          <Text style={styles.cellValue}>{result.confidence.toFixed(1)}%</Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.cellLabel}>DR STAGE</Text>
          <Text style={styles.cellValue} numberOfLines={1}>{result.dr_grade.split(":")[0]}</Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.cellLabel}>IMAGE QUALITY</Text>
          <Text style={styles.cellValue}>{result.biomarkers.quality_score}/100</Text>
        </View>
        <View style={styles.gridCell}>
          <Text style={styles.cellLabel}>MODE</Text>
          <Text style={styles.cellValue}>{result.model_meta.mode === "REAL_AI_VISION" ? "GPT-5.4 Vision" : "Aptos Ensemble"}</Text>
        </View>
      </View>

      <Pressable
        testID="export-report-btn"
        onPress={handleShare}
        style={styles.shareButton}
      >
        <Text style={styles.shareButtonText}>
          {copied ? "✓ SUMMARY COPIED TO CLIPBOARD" : "SHARE / EXPORT SUMMARY CARD"}
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginVertical: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  brandGroup: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.8,
  },
  scanId: {
    fontSize: 10,
    color: colors.muted,
    fontFamily: "monospace",
    marginTop: 2,
  },
  riskPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillLowRisk: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: colors.success,
  },
  pillHighRisk: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: colors.warning,
  },
  riskPillText: {
    fontSize: 10,
    fontWeight: "800",
  },
  textLowRisk: {
    color: colors.success,
  },
  textHighRisk: {
    color: colors.warning,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "rgba(10, 14, 23, 0.6)",
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 14,
  },
  gridCell: {
    width: "48%",
  },
  cellLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurface,
    marginTop: 1,
  },
  shareButton: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  shareButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.8,
  },
}));
