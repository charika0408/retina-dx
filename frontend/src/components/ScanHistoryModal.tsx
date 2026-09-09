import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { ScreeningResult } from "../types/screening";
import { retinaApi } from "../api/retinaApi";
import { useTheme, makeStyles } from "../theme";

interface ScanHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectScan?: (scan: ScreeningResult) => void;
}

export function ScanHistoryModal({ visible, onClose, onSelectScan }: ScanHistoryModalProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  const [scans, setScans] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      retinaApi.getScreenings()
        .then(setScans)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View testID="scan-history-modal" style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>SCREENING AUDIT LOGS</Text>
              <Text style={styles.subtitle}>Recent AI Retinal Evaluations</Text>
            </View>

            <Pressable
              testID="close-history-modal-btn"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
              <Text style={styles.loadingText}>Fetching screening telemetry...</Text>
            </View>
          ) : scans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👁️</Text>
              <Text style={styles.emptyTitle}>No Scans Recorded Yet</Text>
              <Text style={styles.emptySubtitle}>
                Run your first diabetic retinopathy screening to store audit telemetry.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {scans.map((scan) => {
                const isLow = scan.risk_level === "low_risk";
                return (
                  <Pressable
                    key={scan.scan_id}
                    testID={`history-item-${scan.scan_id}`}
                    onPress={() => {
                      onSelectScan?.(scan);
                      onClose();
                    }}
                    style={styles.scanCard}
                  >
                    <View style={styles.scanCardHeader}>
                      <View>
                        <Text style={styles.scanIdText}>{scan.scan_id}</Text>
                        <Text style={styles.scanDate}>
                          {new Date(scan.created_at).toLocaleDateString()} • {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.riskChip,
                          isLow ? styles.chipLow : styles.chipHigh,
                        ]}
                      >
                        <Text
                          style={[
                            styles.riskChipText,
                            isLow ? styles.textLow : styles.textHigh,
                          ]}
                        >
                          {scan.risk_label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.scanGrade} numberOfLines={1}>
                      {scan.dr_grade}
                    </Text>

                    <View style={styles.scanFooter}>
                      <Text style={styles.confidenceMeta}>
                        Confidence: <Text style={styles.confidenceBold}>{scan.confidence.toFixed(1)}%</Text>
                      </Text>
                      <Text style={styles.modeMeta}>
                        {scan.model_meta?.mode === "REAL_AI_VISION" ? "GPT-5.4 Vision" : "Aptos Ensemble"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.borderStrong,
    maxHeight: "80%",
    minHeight: "45%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "700",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  list: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 12,
    gap: 10,
  },
  scanCard: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  scanCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  scanIdText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurface,
    fontFamily: "monospace",
  },
  scanDate: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  riskChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipLow: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: colors.success,
  },
  chipHigh: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: colors.warning,
  },
  riskChipText: {
    fontSize: 9,
    fontWeight: "800",
  },
  textLow: {
    color: colors.success,
  },
  textHigh: {
    color: colors.warning,
  },
  scanGrade: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    fontWeight: "600",
    marginBottom: 8,
  },
  scanFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 6,
  },
  confidenceMeta: {
    fontSize: 10,
    color: colors.muted,
  },
  confidenceBold: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  modeMeta: {
    fontSize: 9,
    color: colors.brandPrimary,
    fontWeight: "700",
  },
}));
