import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, makeStyles } from "../theme";

interface ComingSoonCardProps {
  title: string;
  description: string;
  targetAilment: string;
}

export function ComingSoonCard({ title, description, targetAilment }: ComingSoonCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View testID={`coming-soon-card-${title.toLowerCase().replace(/\s+/g, "-")}`} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.ailmentTag}>{targetAilment}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>COMING SOON</Text>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>

      <View style={styles.footerRow}>
        <View style={styles.lockIconBox}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
        <Text style={styles.researchNote}>In Clinical Research Pipeline</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: "rgba(19, 28, 46, 0.6)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginVertical: 6,
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleGroup: {
    flex: 1,
    paddingRight: 10,
  },
  ailmentTag: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
  },
  badge: {
    backgroundColor: "rgba(122, 146, 182, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(122, 146, 182, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.8,
  },
  description: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lockIconBox: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: {
    fontSize: 10,
  },
  researchNote: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "600",
  },
}));
