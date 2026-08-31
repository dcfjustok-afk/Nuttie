import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  componentTokens,
  dimensions,
  radii,
  spacing,
  typeScale,
} from "@nuttie/design-tokens";

import { Icon } from "./Icon";
import { useAppTheme } from "../theme";
import { useAppStore } from "../state/useAppStore";
import type { RecordKind } from "../types";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

const kinds: Array<{
  kind: RecordKind;
  label: string;
  icon: "meal" | "water" | "weight";
}> = [
  { kind: "meal", label: "餐食", icon: "meal" },
  { kind: "water", label: "饮水", icon: "water" },
  { kind: "weight", label: "体重", icon: "weight" },
];

export function AddRecordSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { sizeClass } = useResponsiveLayout();
  const compact = sizeClass === "compact";
  const large = sizeClass === "expanded" || sizeClass === "wide";
  const addRecord = useAppStore((state) => state.addRecord);
  const [kind, setKind] = useState<RecordKind>("meal");
  const [title, setTitle] = useState("午餐");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("份");
  const [energy, setEnergy] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function selectKind(next: RecordKind) {
    setKind(next);
    if (next === "meal") {
      setTitle("午餐");
      setUnit("份");
    }
    if (next === "water") {
      setTitle("饮水");
      setUnit("ml");
    }
    if (next === "weight") {
      setTitle("体重记录");
      setUnit("kg");
    }
  }

  async function submit() {
    const numericValues = [amount, energy, protein, carbs, fat]
      .filter(Boolean)
      .map(Number);
    if (numericValues.some((value) => !Number.isFinite(value) || value < 0)) {
      setError("请输入不小于 0 的有效数字，或留空待后补充。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addRecord({
        kind,
        title:
          title.trim() ||
          (kind === "meal" ? "餐食" : kind === "water" ? "饮水" : "体重记录"),
        subtitle: "手工记录 · 刚刚",
        amount: amount ? Number(amount) : undefined,
        unit,
        energyKcal: kind === "meal" && energy ? Number(energy) : undefined,
        proteinG: kind === "meal" && protein ? Number(protein) : undefined,
        carbsG: kind === "meal" && carbs ? Number(carbs) : undefined,
        fatG: kind === "meal" && fat ? Number(fat) : undefined,
      });
      setAmount("");
      setEnergy("");
      setProtein("");
      setCarbs("");
      setFat("");
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "保存失败，请稍后再试。",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.backdrop,
          { backgroundColor: colors.scrim },
          large && styles.backdropLarge,
        ]}
      >
        <Pressable
          accessibilityLabel="关闭新增记录"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboard}
        >
          <View
            style={[
              styles.sheet,
              large && styles.sheetLarge,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.lg),
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: colors.ink }]}>
                  新增记录
                </Text>
                <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
                  先记下来，之后仍可补充细节
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="关闭"
                onPress={onClose}
                style={styles.close}
              >
                <Icon name="close" size={20} color={colors.inkMuted} />
              </Pressable>
            </View>
            <View
              style={[
                styles.segmented,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              {kinds.map((item) => (
                <Pressable
                  key={item.kind}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: kind === item.kind }}
                  onPress={() => selectKind(item.kind)}
                  style={[
                    styles.segment,
                    kind === item.kind && {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    size={17}
                    color={
                      kind === item.kind ? colors.chestnut : colors.inkMuted
                    }
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          kind === item.kind ? colors.ink : colors.inkMuted,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Field
                label={kind === "meal" ? "名称" : "记录名称"}
                value={title}
                onChangeText={setTitle}
                placeholder="例如：番茄鸡蛋面"
                colors={colors}
              />
              <View style={compact ? styles.singleCol : styles.twoCol}>
                <Field
                  label="数量"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder={
                    kind === "water" ? "350" : kind === "weight" ? "63.4" : "1"
                  }
                  keyboardType="decimal-pad"
                  colors={colors}
                />
                <Field
                  label="单位"
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="份"
                  colors={colors}
                />
              </View>
              {kind === "meal" && (
                <View style={compact ? styles.singleCol : styles.macroGrid}>
                  <Field
                    label="能量（kcal）"
                    value={energy}
                    onChangeText={setEnergy}
                    placeholder="可稍后补充"
                    keyboardType="decimal-pad"
                    colors={colors}
                  />
                  <Field
                    label="蛋白质（g）"
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="未提供"
                    keyboardType="decimal-pad"
                    colors={colors}
                  />
                  <Field
                    label="碳水（g）"
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="未提供"
                    keyboardType="decimal-pad"
                    colors={colors}
                  />
                  <Field
                    label="脂肪（g）"
                    value={fat}
                    onChangeText={setFat}
                    placeholder="未提供"
                    keyboardType="decimal-pad"
                    colors={colors}
                  />
                </View>
              )}
              {error && (
                <Text
                  accessibilityRole="alert"
                  style={[styles.error, { color: colors.danger }]}
                >
                  {error}
                </Text>
              )}
              <Text style={[styles.note, { color: colors.inkMuted }]}>
                保存后会先写入本机队列；登录且网络可用时自动同步。未填写的营养值保持“未提供”，不会按
                0 处理。
              </Text>
            </ScrollView>
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="保存记录"
                disabled={saving}
                onPress={() => void submit()}
                style={({ pressed }) => [
                  styles.save,
                  { backgroundColor: colors.chestnut },
                  saving && { opacity: 0.55 },
                  pressed && { opacity: 0.82 },
                ]}
              >
                <Text style={[styles.saveText, { color: colors.inverse }]}>
                  {saving ? "保存中…" : "保存记录"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "decimal-pad";
  colors: ReturnType<typeof import("@nuttie/design-tokens").getSemanticColors>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.ink }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSubtle}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            color: colors.ink,
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  backdropLarge: { justifyContent: "center", paddingHorizontal: spacing.xl },
  keyboard: {
    width: "100%",
    maxHeight: componentTokens.addRecordSheet.keyboardMaxHeight,
    flexShrink: 1,
  },
  sheet: {
    borderTopLeftRadius: radii.feature,
    borderTopRightRadius: radii.feature,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    flexShrink: 1,
    overflow: "hidden",
  },
  sheetLarge: {
    width: "100%",
    maxWidth: componentTokens.addRecordSheet.maxWidth,
    maxHeight: "88%",
    alignSelf: "center",
    borderRadius: radii.feature,
  },
  handle: {
    alignSelf: "center",
    width: dimensions.minTouch,
    height: spacing.xs,
    borderRadius: spacing.xs / 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  title: { ...typeScale.title },
  subtitle: { ...typeScale.caption, marginTop: spacing.xs },
  close: {
    width: dimensions.minTouch,
    height: dimensions.minTouch,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -8,
    marginRight: -8,
  },
  segmented: {
    minHeight: dimensions.control,
    borderRadius: radii.compact,
    padding: spacing.xs,
    flexDirection: "row",
    gap: spacing.xs,
  },
  segment: {
    minHeight: dimensions.minTouch,
    flex: 1,
    borderRadius: radii.segment,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  segmentText: { ...typeScale.label },
  formScroll: { flexShrink: 1 },
  form: { gap: spacing.md },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
  field: { gap: spacing.xs, flex: 1, minWidth: 0 },
  fieldLabel: { ...typeScale.label },
  input: {
    minHeight: dimensions.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    paddingHorizontal: spacing.md,
    ...typeScale.body,
  },
  twoCol: { flexDirection: "row", gap: spacing.md },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  singleCol: { gap: spacing.md },
  error: { ...typeScale.caption },
  note: { ...typeScale.caption },
  save: {
    minHeight: dimensions.control,
    borderRadius: radii.compact,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  saveText: { ...typeScale.body, fontWeight: "700" },
});
