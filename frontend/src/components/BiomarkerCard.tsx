import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Biomarkers } from "../types/screening";
import { useTheme, makeStyles } from "../theme";

interface BiomarkerCardProps {
  biomarkers: Biomarkers;
  drGrade?: string;
}

export function BiomarkerCard({ biomarkers, drGrade }: BiomarkerCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const items = [
    {
      name: "Microaneurysms",
      detected: biomarkers.microaneurysms.detected,
      status: biomarkers.microaneurysms.status,
      details: biomarkers.microaneurysms.details,
    },
    {
      name: "Hard / Soft Exudates",
      detected: biomarkers.exudates.detected,
      status: biomarkers.exudates.status,
      details: biomarkers.exudates.details,
    },
    {
      name: "Hemorrhages (Dot / Blot)",
      detected: biomarkers.hemorrhages.detected,
      status: biomarkers.hemorrhages.status,
      details: biomarkers.hemorrhages.details,
    },
    {
      name: "Macular Edema Risk",
      detected: biomarkers.macular_risk !== "Low",
      status: biomarkers.macular_risk,
      details: biomarkers.macular_risk === "Low" ? "Preserved foveal avascular zone" : "Potential perifoveal fluid accumulation",
    },
  ];

  return (
    <View testID="biomarkers-card" style={styles.container}>
      <View style={styles.cardHeader}>
        <Text style={styles.headerTitle}>RETINAL BIOMARKERS</Text>
        {drGrade && <Text style={styles.gradeSubtitle}>{drGrade}</Text>}
      </View>

      {/* Metrics Header bar */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>VASCULATURE DENSITY</Text>
          <Text style={styles.metricValue}>{biomarkers.vasculature_index.toFixed(1)}%</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>IMAGE QUALITY</Text>
          <Text style={styles.metricValue}>{biomarkers.quality_score}/100</Text>
        </View>
      </View>

      {/* Biomarker Items list */}
      <View style={styles.itemsList}>
        {items.map((item, idx) => {
          return (
            <View key={item.name} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleGroup}>
                  <View
                    style={[
                      styles.indicatorDot,
                      item.detected ? styles.dotDetected : styles.dotClear,
                    ]}
                  />
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    item.detected ? styles.badgeDetected : styles.badgeClear,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.detected ? styles.textDetected : styles.textClear,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.itemDetails}>{item.details}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginVertical: 10,
  },
  cardHeader: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandPrimary,
    letterSpacing: 1,
  },
  gradeSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.onSurface,
    marginTop: 3,
  },
  metricsRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    alignItems: "center",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  metricLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.onSurface,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    backgroundColor: "rgba(10, 14, 23, 0.4)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotClear: {
    backgroundColor: colors.success,
  },
  dotDetected: {
    backgroundColor: colors.warning,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeClear: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  badgeDetected: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  textClear: {
    color: colors.success,
  },
  textDetected: {
    color: colors.warning,
  },
  itemDetails: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
    lineHeight: 16,
  },
}));
