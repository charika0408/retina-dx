import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, makeStyles } from "../theme";

interface RiskBadgeProps {
  riskLevel: "low_risk" | "possible_signs_detected";
  riskLabel?: string;
  confidence?: number;
}

export function RiskBadge({ riskLevel, riskLabel, confidence }: RiskBadgeProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const isLowRisk = riskLevel === "low_risk";
  const label = riskLabel || (isLowRisk ? "LOW RISK" : "POSSIBLE SIGNS DETECTED");

  return (
    <View
      testID="risk-assessment-badge"
      style={[
        styles.container,
        isLowRisk ? styles.containerLowRisk : styles.containerHighRisk,
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.statusDot,
            isLowRisk ? styles.statusDotLowRisk : styles.statusDotHighRisk,
          ]}
        />
        <Text
          style={[
            styles.badgeTitle,
            isLowRisk ? styles.textLowRisk : styles.textHighRisk,
          ]}
        >
          {label}
        </Text>
      </View>

      {confidence !== undefined && (
        <View style={styles.confidencePill}>
          <Text style={styles.confidenceLabel}>SCREENING CONFIDENCE</Text>
          <Text
            style={[
              styles.confidenceValue,
              isLowRisk ? styles.textLowRisk : styles.textHighRisk,
            ]}
          >
            {confidence.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginVertical: 10,
  },
  containerLowRisk: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: colors.success,
  },
  containerHighRisk: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderColor: colors.warning,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusDotLowRisk: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  statusDotHighRisk: {
    backgroundColor: colors.warning,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  textLowRisk: {
    color: colors.success,
  },
  textHighRisk: {
    color: colors.warning,
  },
  confidencePill: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(10, 14, 23, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
    letterSpacing: 0.6,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: "800",
  },
}));
