import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  componentTokens,
  dimensions,
  radii,
  spacing,
  typeScale,
} from "@nuttie/design-tokens";

import { Icon } from "../../src/components/Icon";
import { Screen } from "../../src/components/Screen";
import { useAppTheme } from "../../src/theme";

type Food = {
  name: string;
  source: string;
  sourceTone: "sprout" | "sky" | "amber";
  energy: number;
  unit: string;
  note: string;
};
const catalog: Food[] = [
  {
    name: "燕麦片",
    source: "示例食品包",
    sourceTone: "sprout",
    energy: 389,
    unit: "kcal / 100g",
    note: "蛋白质 16.9g · 碳水 66.3g",
  },
  {
    name: "无糖酸奶",
    source: "用户食品",
    sourceTone: "sky",
    energy: 62,
    unit: "kcal / 100g",
    note: "营养值可由你补充或更正",
  },
  {
    name: "番茄",
    source: "示例食品包",
    sourceTone: "amber",
    energy: 18,
    unit: "kcal / 100g",
    note: "来源和版本会随数据包显示",
  },
  {
    name: "鸡蛋",
    source: "示例食品包",
    sourceTone: "sprout",
    energy: 144,
    unit: "kcal / 100g",
    note: "示例数据，仅用于界面预览",
  },
];

export default function FoodScreen() {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"全部" | "示例食品包" | "用户食品">(
    "全部",
  );
  const results = useMemo(
    () =>
      catalog.filter(
        (food) =>
          (source === "全部" || food.source === source) &&
          (!query.trim() || food.name.includes(query.trim())),
      ),
    [query, source],
  );
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.inkMuted }]}>
          食品资料
        </Text>
        <Text style={[styles.title, { color: colors.ink }]}>
          找得到，也说得清来源
        </Text>
        <Text style={[styles.body, { color: colors.inkMuted }]}>
          首期展示本地目录。用户食品和自定义营养值将在食品编辑能力接入后开放。
        </Text>
      </View>
      <View
        style={[
          styles.searchBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Icon name="food" size={19} color={colors.inkMuted} />
        <TextInput
          accessibilityLabel="搜索食品"
          value={query}
          onChangeText={setQuery}
          placeholder="搜索名称"
          placeholderTextColor={colors.inkSubtle}
          style={[styles.searchInput, { color: colors.ink }]}
        />
      </View>
      <View style={styles.filters}>
        {(["全部", "示例食品包", "用户食品"] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ checked: source === item }}
            onPress={() => setSource(item)}
            style={[
              styles.filter,
              {
                borderColor: source === item ? colors.chestnut : colors.border,
                backgroundColor:
                  source === item ? colors.amberSoft : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: source === item ? colors.ink : colors.inkMuted },
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.resultsHeading}>
        <Text style={[styles.heading, { color: colors.ink }]}>本地结果</Text>
        <Text style={[styles.caption, { color: colors.inkMuted }]}>
          {results.length} 项
        </Text>
      </View>
      <View style={styles.results}>
        {results.map((food) => (
          <FoodRow key={`${food.name}-${food.source}`} food={food} />
        ))}
        {!results.length && (
          <View
            style={[
              styles.empty,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Icon name="search" size={24} color={colors.inkMuted} />
            <Text style={[styles.emptyTitle, { color: colors.ink }]}>
              没有找到“{query}”
            </Text>
            <Text style={[styles.emptyBody, { color: colors.inkMuted }]}>
              可以换个关键词；首期食品目录为只读数据。
            </Text>
            <View
              accessibilityRole="text"
              style={[styles.create, { borderColor: colors.border }]}
            >
              <Text style={[styles.createText, { color: colors.inkMuted }]}>
                用户食品：即将开放
              </Text>
            </View>
          </View>
        )}
      </View>
      <View
        style={[
          styles.pack,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        ]}
      >
        <View style={[styles.packIcon, { backgroundColor: colors.sproutSoft }]}>
          <Icon name="leaf" size={18} color={colors.sprout} />
        </View>
        <View style={styles.packCopy}>
          <Text style={[styles.packTitle, { color: colors.ink }]}>
            数据包状态
          </Text>
          <Text style={[styles.packBody, { color: colors.inkMuted }]}>
            示例目录 v0.1 · 本地只读 · 来源信息随记录保留
          </Text>
        </View>
        <Icon name="next" size={18} color={colors.inkMuted} />
      </View>
    </Screen>
  );
}

function FoodRow({ food }: { food: Food }) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.foodRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.foodIcon,
          {
            backgroundColor:
              colors[
                `${food.sourceTone}Soft` as
                  | "sproutSoft"
                  | "skySoft"
                  | "amberSoft"
              ],
          },
        ]}
      >
        <Icon
          name="food"
          size={18}
          color={
            colors[food.sourceTone === "sky" ? "skyDark" : food.sourceTone]
          }
        />
      </View>
      <View style={styles.foodCopy}>
        <Text style={[styles.foodName, { color: colors.ink }]}>
          {food.name}
        </Text>
        <Text style={[styles.foodNote, { color: colors.inkMuted }]}>
          {food.note}
        </Text>
        <Text style={[styles.foodSource, { color: colors.inkSubtle }]}>
          {food.source}
        </Text>
      </View>
      <View style={styles.foodValue}>
        <Text style={[styles.energy, { color: colors.ink }]}>
          {food.energy}
        </Text>
        <Text style={[styles.unit, { color: colors.inkMuted }]}>
          {food.unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  kicker: { ...typeScale.caption, fontWeight: "700" },
  title: { ...typeScale.title },
  body: { ...typeScale.body },
  searchBox: {
    minHeight: dimensions.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: dimensions.control,
    ...typeScale.body,
  },
  filters: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  filter: {
    minHeight: dimensions.minTouch,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: { ...typeScale.caption, fontWeight: "600" },
  resultsHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  heading: { ...typeScale.heading },
  caption: { ...typeScale.caption },
  results: { gap: spacing.sm },
  foodRow: {
    minHeight: componentTokens.food.rowMinHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  foodIcon: {
    width: componentTokens.food.iconSize,
    height: componentTokens.food.iconSize,
    borderRadius: componentTokens.food.iconRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  foodCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  foodName: { ...typeScale.body, fontWeight: "700" },
  foodNote: { ...typeScale.caption },
  foodSource: { ...typeScale.caption },
  foodValue: { alignItems: "flex-end" },
  energy: { ...typeScale.heading },
  unit: { ...typeScale.caption },
  empty: {
    minHeight: componentTokens.food.emptyMinHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { ...typeScale.heading },
  emptyBody: { ...typeScale.body, textAlign: "center" },
  create: {
    minHeight: dimensions.minTouch,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  createText: { ...typeScale.label },
  pack: {
    minHeight: componentTokens.food.packMinHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  packIcon: {
    width: componentTokens.food.packIconSize,
    height: componentTokens.food.packIconSize,
    borderRadius: radii.compact,
    alignItems: "center",
    justifyContent: "center",
  },
  packCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  packTitle: { ...typeScale.label, fontWeight: "700" },
  packBody: { ...typeScale.caption },
});
