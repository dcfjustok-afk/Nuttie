import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAppTheme } from "../src/theme";
import { useAppStore } from "../src/state/useAppStore";

export default function Index() {
  const hydrated = useAppStore((state) => state.hydrated);
  const session = useAppStore((state) => state.session);
  const { colors } = useAppTheme();
  if (!hydrated) return <View style={[styles.loading, { backgroundColor: colors.canvas }]}><ActivityIndicator color={colors.chestnut} /></View>;
  return <Redirect href={session ? "/diary" : "/sign-in"} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center" } });
