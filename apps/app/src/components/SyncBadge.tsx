import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { radii, spacing, typeScale } from "@nuttie/design-tokens";

import { Icon } from "./Icon";
import { useAppTheme } from "../theme";
import { useAppStore } from "../state/useAppStore";

export function SyncBadge() {
  const { colors } = useAppTheme();
  const session = useAppStore((state) => state.session);
  const queue = useAppStore((state) => state.queue);
  const isSyncing = useAppStore((state) => state.isSyncing);
  const lastSyncError = useAppStore((state) => state.lastSyncError);
  const sync = useAppStore((state) => state.sync);
  const hasError = Boolean(lastSyncError);
  const authenticated = session?.mode === "authenticated";
  const label = isSyncing ? "正在同步" : hasError ? "同步待处理" : queue.length ? `${queue.length} 条待同步` : authenticated ? "已同步" : "本地模式";
  const icon = isSyncing ? "refresh" : hasError ? "cloudOff" : queue.length ? "cloud" : authenticated ? "cloud" : "cloudOff";
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="同步状态" onPress={() => void sync()} style={({ pressed }) => [styles.badge, { backgroundColor: hasError ? colors.dangerSoft : colors.surfaceMuted }, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={15} color={hasError ? colors.danger : colors.inkMuted} />
      <Text style={[styles.label, { color: hasError ? colors.danger : colors.inkMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { minHeight: 34, borderRadius: radii.round, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  label: { ...typeScale.caption, fontWeight: "600", flexShrink: 1 },
});
