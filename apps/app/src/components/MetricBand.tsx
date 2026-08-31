import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  componentTokens,
  radii,
  spacing,
  typeScale,
} from "@nuttie/design-tokens";

import { useAppTheme } from "../theme";

export function MetricBand({
  label,
  value,
  unit,
  hint,
  tone = "chestnut",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "chestnut" | "sprout" | "sky" | "amber";
}) {
  const { colors } = useAppTheme();
  const accent = colors[tone];
  return (
    <View
      style={[
        styles.band,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.marker, { backgroundColor: accent }]} />
      <Text style={[styles.label, { color: colors.inkMuted }]}>{label}</Text>
      <View style={styles.valueLine}>
        <Text style={[styles.value, { color: colors.ink }]}>{value}</Text>
        {unit && (
          <Text style={[styles.unit, { color: colors.inkMuted }]}>{unit}</Text>
        )}
      </View>
      {hint && (
        <Text style={[styles.hint, { color: colors.inkSubtle }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    minHeight: componentTokens.metricBand.minHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: "hidden",
  },
  marker: {
    width: componentTokens.metricBand.markerWidth,
    height: componentTokens.metricBand.markerHeight,
    borderRadius: componentTokens.metricBand.markerRadius,
    marginBottom: spacing.xs,
  },
  label: { ...typeScale.caption, fontWeight: "600" },
  valueLine: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs },
  value: { ...typeScale.title },
  unit: { ...typeScale.caption },
  hint: { ...typeScale.caption, marginTop: "auto" },
});
