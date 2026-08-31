import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { dimensions, getGrowthState, radii, spacing, typeScale } from "@nuttie/design-tokens";
import { GrowthMark } from "@nuttie/ui";

import { AddRecordSheet } from "../../src/components/AddRecordSheet";
import { Icon } from "../../src/components/Icon";
import { MetricBand } from "../../src/components/MetricBand";
import { RecordRow } from "../../src/components/RecordRow";
import { Screen } from "../../src/components/Screen";
import { SyncBadge } from "../../src/components/SyncBadge";
import { useAppStore } from "../../src/state/useAppStore";
import { useAppTheme } from "../../src/theme";

export default function DiaryScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const { colors } = useAppTheme();
  const records = useAppStore((state) => state.records);
  const session = useAppStore((state) => state.session);
  const [sheetOpen, setSheetOpen] = useState(false);
  const meals = records.filter((record) => record.kind === "meal");
  const water = records.filter((record) => record.kind === "water");
  const weight = records.find((record) => record.kind === "weight");
  const energy = meals.reduce((sum, record) => sum + (record.energyKcal ?? 0), 0);
  const protein = meals.reduce((sum, record) => sum + (record.proteinG ?? 0), 0);
  const carbs = meals.reduce((sum, record) => sum + (record.carbsG ?? 0), 0);
  const fat = meals.reduce((sum, record) => sum + (record.fatG ?? 0), 0);
  const progress = useMemo(() => Math.min(1, (meals.length + (water.length ? 1 : 0) + (weight ? 1 : 0)) / 5), [meals.length, water.length, weight]);
  const growthState = getGrowthState(progress, records.some((record) => record.syncStatus === "pending"));
  const dateLabel = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date());

  return (
    <Screen>
      <View style={styles.topLine}><View style={styles.dateBlock}><Text style={[styles.kicker, { color: colors.inkMuted }]}>今天</Text><Text style={[styles.date, { color: colors.ink }]}>{dateLabel}</Text></View><SyncBadge /></View>
      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }, wide && styles.heroWide]}>
        <View style={styles.markWrap}><GrowthMark progress={progress} state={growthState} size={wide ? 206 : 178} colors={colors} /></View>
          <View style={styles.heroCopy}><Text style={[styles.heroTitle, { color: colors.ink }]}>给今天留一页</Text><Text style={[styles.heroBody, { color: colors.inkMuted }]}>记录是事实，不是评分。目标还没设置也没关系，先从一件小事开始。</Text><View style={styles.heroMeta}><View style={[styles.metaDot, { backgroundColor: colors.sprout }]} /><Text style={[styles.metaText, { color: colors.inkMuted }]}>{session?.mode === "authenticated" ? "已登录，可跨设备同步" : "本地演示数据"}</Text></View></View>
      </View>
      <View style={styles.sectionHeading}><View><Text style={[styles.heading, { color: colors.ink }]}>今日账本</Text><Text style={[styles.caption, { color: colors.inkMuted }]}>已记录的事实会保留来源和缺失状态</Text></View><Pressable accessibilityRole="button" accessibilityLabel="新增记录" onPress={() => setSheetOpen(true)} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.chestnut }, pressed && { opacity: 0.8 }]}><Icon name="add" size={18} color={colors.inverse} /><Text style={[styles.addText, { color: colors.inverse }]}>新增</Text></Pressable></View>
      <View style={[styles.metricGrid, wide && styles.metricGridWide]}><View style={wide && styles.metricCellWide}><MetricBand label="今日摄入" value={energy ? String(Math.round(energy)) : "未记录"} unit={energy ? "kcal" : undefined} hint={energy ? "来自已保存餐食" : "添加餐食后显示"} tone="chestnut" /></View><View style={wide && styles.metricCellWide}><MetricBand label="蛋白质" value={protein ? String(Math.round(protein)) : "未提供"} unit={protein ? "g" : undefined} hint="缺失值不会按 0 处理" tone="sprout" /></View><View style={wide && styles.metricCellWide}><MetricBand label="饮水" value={water.reduce((sum, record) => sum + (record.amount ?? 0), 0) ? String(Math.round(water.reduce((sum, record) => sum + (record.amount ?? 0), 0))) : "未记录"} unit={water.length ? "ml" : undefined} hint="手工记录" tone="sky" /></View><View style={wide && styles.metricCellWide}><MetricBand label="体重" value={weight?.amount !== undefined ? String(weight.amount) : "未记录"} unit={weight?.unit} hint="仅作个人记录" tone="amber" /></View></View>
      <View style={[styles.macroLine, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}><View style={styles.macroHeader}><Text style={[styles.macroTitle, { color: colors.ink }]}>宏量快照</Text><Text style={[styles.macroHint, { color: colors.inkMuted }]}>今日已有数据</Text></View><View style={styles.macroValues}><Macro label="碳水" value={carbs} color={colors.chestnut} /><Macro label="蛋白质" value={protein} color={colors.sprout} /><Macro label="脂肪" value={fat} color={colors.skyDark} /></View></View>
      <View style={styles.sectionHeading}><View><Text style={[styles.heading, { color: colors.ink }]}>最近记录</Text><Text style={[styles.caption, { color: colors.inkMuted }]}>{records.length ? `${records.length} 条记录 · 新记录会排在最前` : "还没有记录"}</Text></View></View>
      <View style={styles.recordList}>{records.slice(0, 6).map((record) => <RecordRow key={record.id} record={record} />)}{!records.length && <EmptyRecords onAdd={() => setSheetOpen(true)} />}</View>
      <AddRecordSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Screen>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) { const { colors } = useAppTheme(); return <View style={styles.macro}><View style={[styles.macroMarker, { backgroundColor: color }]} /><Text style={[styles.macroLabel, { color: colors.inkMuted }]}>{label}</Text><Text style={[styles.macroValue, { color: colors.ink }]}>{value ? `${Math.round(value)} g` : "未提供"}</Text></View>; }
function EmptyRecords({ onAdd }: { onAdd: () => void }) { const { colors } = useAppTheme(); return <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><Icon name="leaf" size={24} color={colors.sprout} /><Text style={[styles.emptyTitle, { color: colors.ink }]}>从一件小事开始</Text><Text style={[styles.emptyBody, { color: colors.inkMuted }]}>餐食、饮水或体重都可以。保存后你随时能补充细节。</Text><Pressable accessibilityRole="button" onPress={onAdd} style={[styles.emptyAction, { borderColor: colors.chestnut }]}><Text style={[styles.emptyActionText, { color: colors.chestnut }]}>新增第一条</Text></Pressable></View>; }

const styles = StyleSheet.create({
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  dateBlock: { flex: 1, minWidth: 0 },
  kicker: { ...typeScale.caption, fontWeight: "700" },
  date: { ...typeScale.title, marginTop: 2 },
  hero: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.feature, padding: spacing.lg, gap: spacing.lg },
  heroWide: { flexDirection: "row", alignItems: "center", padding: spacing.xxl, minHeight: 260 },
  markWrap: { alignItems: "center", justifyContent: "center" },
  heroCopy: { flex: 1, gap: spacing.sm, minWidth: 0 },
  heroTitle: { ...typeScale.display, fontSize: 28 },
  heroBody: { ...typeScale.body, lineHeight: 23, maxWidth: 520 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  metaDot: { width: 8, height: 8, borderRadius: 4 }, metaText: { ...typeScale.caption },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  heading: { ...typeScale.heading }, caption: { ...typeScale.caption, marginTop: 3 },
  addButton: { minHeight: dimensions.minTouch, borderRadius: radii.compact, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.xs }, addText: { ...typeScale.label },
  metricGrid: { gap: spacing.md }, metricGridWide: { flexDirection: "row", flexWrap: "wrap" }, metricCellWide: { flexGrow: 1, flexShrink: 1, flexBasis: 180, minWidth: 160 },
  macroLine: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md }, macroHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, macroTitle: { ...typeScale.label, fontWeight: "700" }, macroHint: { ...typeScale.caption }, macroValues: { flexDirection: "row", gap: spacing.lg, flexWrap: "wrap" }, macro: { flex: 1, minWidth: 90, gap: 3 }, macroMarker: { width: 20, height: 4, borderRadius: 2 }, macroLabel: { ...typeScale.caption }, macroValue: { ...typeScale.body, fontWeight: "700" },
  recordList: { gap: spacing.sm }, empty: { minHeight: 190, borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.card, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm }, emptyTitle: { ...typeScale.heading }, emptyBody: { ...typeScale.body, textAlign: "center", maxWidth: 340 }, emptyAction: { minHeight: dimensions.minTouch, borderWidth: 1, borderRadius: radii.compact, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center", marginTop: spacing.sm }, emptyActionText: { ...typeScale.label },
});
