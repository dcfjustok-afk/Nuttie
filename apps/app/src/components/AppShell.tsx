import { Slot, usePathname, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  componentTokens,
  dimensions,
  radii,
  spacing,
  typeScale,
} from "@nuttie/design-tokens";

import { Icon, type IconName } from "./Icon";
import { useAppTheme } from "../theme";
import { useAppStore } from "../state/useAppStore";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

type Destination = {
  href: "/diary" | "/trends" | "/food" | "/settings";
  label: string;
  icon: IconName;
};
const destinations: Destination[] = [
  { href: "/diary", label: "日记", icon: "diary" },
  { href: "/trends", label: "趋势", icon: "trends" },
  { href: "/food", label: "食品资料", icon: "food" },
  { href: "/settings", label: "设置", icon: "settings" },
];

function NavItem({
  destination,
  active,
  desktop,
}: {
  destination: Destination;
  active: boolean;
  desktop: boolean;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
      accessibilityLabel={destination.label}
      onPress={() => router.push(destination.href)}
      style={({ pressed }) => [
        desktop ? styles.railItem : styles.bottomItem,
        active && { backgroundColor: colors.sproutSoft },
        pressed && { opacity: 0.72 },
      ]}
    >
      <Icon
        name={destination.icon}
        size={20}
        color={active ? colors.sprout : colors.inkMuted}
        strokeWidth={active ? 2.5 : 1.8}
      />
      <Text
        style={[
          desktop ? styles.railLabel : styles.bottomLabel,
          { color: active ? colors.sprout : colors.inkMuted },
        ]}
      >
        {destination.label}
      </Text>
    </Pressable>
  );
}

function Navigation({ desktop }: { desktop: boolean }) {
  const pathname = usePathname();
  const { colors } = useAppTheme();
  return (
    <View
      role="navigation"
      accessibilityLabel="主要导航"
      style={
        desktop
          ? [styles.rail, { backgroundColor: colors.surface }]
          : [
              styles.bottomNav,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]
      }
    >
      {desktop && (
        <View style={styles.brandBlock}>
          <View
            style={[styles.brandMark, { backgroundColor: colors.chestnut }]}
          >
            <Icon
              name="leaf"
              size={19}
              color={colors.inverse}
              strokeWidth={2.4}
            />
          </View>
          <View>
            <Text style={[styles.brandName, { color: colors.ink }]}>
              Nuttie
            </Text>
            <Text style={[styles.brandCaption, { color: colors.inkMuted }]}>
              栗子自律
            </Text>
          </View>
        </View>
      )}
      <View style={desktop ? styles.railList : styles.bottomList}>
        {destinations.map((destination) => (
          <NavItem
            key={destination.href}
            destination={destination}
            active={pathname === destination.href}
            desktop={desktop}
          />
        ))}
      </View>
      {desktop && (
        <Text style={[styles.railFooter, { color: colors.inkSubtle }]}>
          Small steps, solid growth.
        </Text>
      )}
    </View>
  );
}

export function AppShell() {
  const { sizeClass } = useResponsiveLayout();
  const desktop = sizeClass === "expanded" || sizeClass === "wide";
  const { colors } = useAppTheme();
  const session = useAppStore((state) => state.session);
  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.canvas }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.shell}>
        {desktop && <Navigation desktop />}
        <View style={[styles.content, desktop && styles.contentDesktop]}>
          <View style={styles.contentInner}>
            {session?.mode !== "authenticated" && (
              <View
                style={[
                  styles.sessionHint,
                  {
                    backgroundColor: colors.amberSoft,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Icon name="cloudOff" size={15} color={colors.ink} />
                <Text style={[styles.sessionHintText, { color: colors.ink }]}>
                  当前以本地模式浏览，登录后可跨设备同步
                </Text>
              </View>
            )}
            <Slot />
          </View>
        </View>
        {!desktop && <Navigation desktop={false} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shell: { flex: 1, flexDirection: "row" },
  rail: {
    width: dimensions.desktopRail,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "transparent",
    justifyContent: "space-between",
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.section,
  },
  brandMark: {
    width: componentTokens.brandMark.size,
    height: componentTokens.brandMark.size,
    borderRadius: componentTokens.brandMark.radius,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { ...typeScale.heading },
  brandCaption: { ...typeScale.caption, marginTop: spacing.xs },
  railList: { gap: spacing.xs, flex: 1 },
  railItem: {
    minHeight: dimensions.minTouch,
    borderRadius: radii.compact,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  railLabel: { ...typeScale.body, fontWeight: "600" },
  railFooter: {
    ...typeScale.caption,
    maxWidth: componentTokens.navigation.footerMaxWidth,
  },
  content: { flex: 1, minWidth: 0 },
  contentDesktop: { paddingLeft: spacing.xxl, paddingRight: spacing.xxl },
  contentInner: {
    width: "100%",
    maxWidth: dimensions.maxShell,
    alignSelf: "center",
    flex: 1,
  },
  sessionHint: {
    minHeight: componentTokens.sessionHint.minHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sessionHintText: { ...typeScale.caption, flexShrink: 1 },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: componentTokens.navigation.bottomHeight,
    paddingBottom: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomList: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    minHeight: componentTokens.navigation.bottomHeight,
  },
  bottomItem: {
    minWidth: dimensions.minTouch,
    minHeight: dimensions.minTouch,
    flex: 1,
    maxWidth: componentTokens.navigation.itemMaxWidth,
    borderRadius: radii.compact,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginHorizontal: componentTokens.navigation.itemInset,
  },
  bottomLabel: { ...typeScale.caption, fontWeight: "600" },
});
