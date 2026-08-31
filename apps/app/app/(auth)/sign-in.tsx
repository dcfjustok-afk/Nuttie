import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  componentTokens,
  dimensions,
  radii,
  spacing,
  typeScale,
} from "@nuttie/design-tokens";
import { GrowthMark } from "@nuttie/ui";

import * as api from "../../src/data/api";
import { Icon } from "../../src/components/Icon";
import { useAppTheme } from "../../src/theme";
import { useAppStore } from "../../src/state/useAppStore";

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const signIn = useAppStore((state) => state.signIn);
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 8) {
      setError("请输入邮箱，并使用至少 8 位密码。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session =
        mode === "signin"
          ? await api.login(email.trim(), password)
          : await api.register(
              email.trim(),
              password,
              displayName.trim() || "Nuttie 用户",
            );
      await signIn(session);
      router.replace("/diary");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "暂时无法连接，请稍后再试。",
      );
    } finally {
      setBusy(false);
    }
  }

  async function enterDemo() {
    await signIn({
      mode: "demo",
      accessToken: "demo",
      user: {
        id: "demo-user",
        email: "demo@nuttie.local",
        displayName: "演示用户",
      },
    });
    router.replace("/diary");
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <View style={[styles.logo, { backgroundColor: colors.chestnut }]}>
              <Icon name="leaf" size={22} color={colors.inverse} />
            </View>
            <Text style={[styles.brand, { color: colors.ink }]}>Nuttie</Text>
            <Text style={[styles.tagline, { color: colors.inkMuted }]}>
              积“栗”前行，“立”见更好的自己。
            </Text>
          </View>
          <View style={styles.mark}>
            <GrowthMark
              progress={0.42}
              state="growing"
              size={componentTokens.signIn.growthMarkSize}
              colors={colors}
            />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.ink }]}>
              把今天记下来
            </Text>
            <Text style={[styles.body, { color: colors.inkMuted }]}>
              在手机上快速记录，在更大的屏幕上看见连续的自己。登录后，记录会在设备之间同步。
            </Text>
          </View>
          <View
            style={[
              styles.form,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {mode === "register" && (
              <Field
                label="称呼"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="例如：小栗"
                colors={colors}
              />
            )}
            <Field
              label="邮箱"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              colors={colors}
            />
            <Field
              label="密码"
              value={password}
              onChangeText={setPassword}
              placeholder="至少 8 位"
              secureTextEntry
              colors={colors}
            />
            {error && (
              <Text
                accessibilityRole="alert"
                style={[styles.error, { color: colors.danger }]}
              >
                {error}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => void submit()}
              disabled={busy}
              style={({ pressed }) => [
                styles.primary,
                { backgroundColor: colors.chestnut },
                busy && { opacity: 0.55 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.primaryText, { color: colors.inverse }]}>
                {busy
                  ? "处理中…"
                  : mode === "signin"
                    ? "登录并同步"
                    : "创建账号"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMode(mode === "signin" ? "register" : "signin");
                setError(null);
              }}
              style={styles.secondary}
            >
              <Text style={[styles.secondaryText, { color: colors.chestnut }]}>
                {mode === "signin"
                  ? "还没有账号？创建一个"
                  : "已有账号？返回登录"}
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void enterDemo()}
            style={[styles.demo, { borderColor: colors.border }]}
          >
            <Icon name="leaf" size={15} color={colors.sprout} />
            <Text style={[styles.demoText, { color: colors.ink }]}>
              先进入本地演示
            </Text>
          </Pressable>
          <Text style={[styles.privacy, { color: colors.inkSubtle }]}>
            核心记录会先保存在本机。云同步只在你登录后开启，AI
            凭证不会进入同步。
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: ReturnType<typeof import("@nuttie/design-tokens").getSemanticColors>;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences";
  keyboardType?: "email-address";
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSubtle}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            color: colors.ink,
            borderColor: colors.border,
            backgroundColor: colors.surfaceMuted,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: {
    width: "100%",
    maxWidth: componentTokens.signIn.maxWidth,
    alignSelf: "center",
    padding: spacing.xl,
    paddingBottom: spacing.page,
    gap: spacing.lg,
  },
  intro: { alignItems: "center", gap: spacing.xs, paddingTop: spacing.lg },
  logo: {
    width: componentTokens.signIn.logoSize,
    height: componentTokens.signIn.logoSize,
    borderRadius: componentTokens.signIn.logoRadius,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  brand: { ...typeScale.title },
  tagline: { ...typeScale.caption },
  mark: { alignItems: "center", paddingVertical: spacing.sm },
  copy: { gap: spacing.sm },
  title: { ...typeScale.display },
  body: { ...typeScale.body },
  form: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  field: { gap: spacing.xs },
  label: { ...typeScale.label },
  input: {
    minHeight: dimensions.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    paddingHorizontal: spacing.md,
    ...typeScale.body,
  },
  error: { ...typeScale.caption },
  primary: {
    minHeight: dimensions.control,
    borderRadius: radii.compact,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { ...typeScale.body, fontWeight: "700" },
  secondary: {
    minHeight: dimensions.minTouch,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { ...typeScale.label },
  demo: {
    minHeight: dimensions.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    alignItems: "center",
    justifyContent: "center",
  },
  demoText: { ...typeScale.label },
  privacy: { ...typeScale.caption, textAlign: "center" },
});
