import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { radii, spacing, typeScale } from "@nuttie/design-tokens";

import { Icon } from "./Icon";
import { useAppTheme } from "../theme";
import type { LocalRecord } from "../types";

export function RecordRow({ record }: { record: LocalRecord }) {
  const { colors } = useAppTheme();
  const icon = record.kind === "meal" ? "meal" : record.kind === "water" ? "water" : "weight";
  const tone = record.kind === "meal" ? colors.chestnut : record.kind === "water" ? colors.skyDark : colors.sprout;
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: record.kind === "meal" ? colors.amberSoft : record.kind === "water" ? colors.skySoft : colors.sproutSoft }]}><Icon name={icon} size={18} color={tone} /></View>
      <View style={styles.copy}><Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>{record.title}</Text><Text style={[styles.subtitle, { color: colors.inkMuted }]} numberOfLines={1}>{record.subtitle}</Text></View>
      <View style={styles.amount}>{record.amount !== undefined && <Text style={[styles.amountValue, { color: colors.ink }]}>{record.amount}<Text style={[styles.amountUnit, { color: colors.inkMuted }]}> {record.unit}</Text></Text>}{record.energyKcal !== undefined && <Text style={[styles.energy, { color: colors.inkMuted }]}>{record.energyKcal} kcal</Text>}{record.syncStatus === "pending" && <Text style={[styles.sync, { color: colors.amber }]}>待同步</Text>}{record.syncStatus === "conflict" && <Text style={[styles.sync, { color: colors.danger }]}>需处理</Text>}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 72, borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.compact, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...typeScale.body, fontWeight: "700" },
  subtitle: { ...typeScale.caption },
  amount: { alignItems: "flex-end", gap: 2 },
  amountValue: { ...typeScale.body, fontWeight: "700" },
  amountUnit: { ...typeScale.caption, fontWeight: "500" },
  energy: { ...typeScale.caption },
  sync: { ...typeScale.caption, fontWeight: "700" },
});
