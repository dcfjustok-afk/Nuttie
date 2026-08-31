import React, { type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@nuttie/design-tokens";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const { width } = useResponsiveLayout();
  const content = <View style={[styles.inner, { paddingBottom: Math.max(insets.bottom + (width < 768 ? 84 : spacing.lg), spacing.page) }]}>{children}</View>;
  if (!scroll) return <View style={styles.scroll}>{content}</View>;
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={Platform.OS === "web"}>{content}</ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.section },
});
