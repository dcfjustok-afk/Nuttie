import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  componentTokens,
  dimensions,
  radii,
  spacing,
  typeScale,
} from "@nuttie/design-tokens";

import { deliverAccountExport } from "../../src/data/account-export";
import { Icon, type IconName } from "../../src/components/Icon";
import { Screen } from "../../src/components/Screen";
import { useAppStore } from "../../src/state/useAppStore";
import { useAppTheme } from "../../src/theme";

type Feedback = { kind: "success" | "error"; message: string };

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const session = useAppStore((state) => state.session);
  const queue = useAppStore((state) => state.queue);
  const lastSyncError = useAppStore((state) => state.lastSyncError);
  const signOut = useAppStore((state) => state.signOut);
  const sync = useAppStore((state) => state.sync);
  const exportAccount = useAppStore((state) => state.exportAccount);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const authenticated = session?.mode === "authenticated";
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<Feedback | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleExport() {
    if (!authenticated || exporting) return;
    setExporting(true);
    setExportFeedback(null);
    try {
      const account = await exportAccount();
      const delivery = await deliverAccountExport(account);
      setExportFeedback({
        kind: "success",
        message:
          delivery === "downloaded"
            ? "导出文件已下载到浏览器默认位置。"
            : "已打开系统分享，请选择保存位置或发送方式。",
      });
    } catch (error) {
      setExportFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "导出失败，请稍后重试。",
      });
    } finally {
      setExporting(false);
    }
  }

  function openDeleteConfirmation() {
    setDeleteConfirmation("");
    setDeleteError(null);
    setDeleteVisible(true);
  }

  async function handleDelete() {
    if (!authenticated || deleteConfirmation !== "DELETE" || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      setDeleteVisible(false);
      router.replace("/sign-in");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "删除失败，本地数据仍然保留。",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.inkMuted }]}>设置</Text>
        <Text style={[styles.title, { color: colors.ink }]}>
          让边界也清清楚楚
        </Text>
        <Text style={[styles.body, { color: colors.inkMuted }]}>
          账号与同步是可选的产品能力；记录、来源和删除权利始终由你掌握。
        </Text>
      </View>

      <View
        style={[
          styles.account,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.chestnut }]}>
          <Icon name="user" size={21} color={colors.inverse} />
        </View>
        <View style={styles.accountCopy}>
          <Text style={[styles.accountName, { color: colors.ink }]}>
            {authenticated ? session.user.displayName : "本地演示用户"}
          </Text>
          <Text style={[styles.accountEmail, { color: colors.inkMuted }]}>
            {authenticated ? session.user.email : "尚未登录 · 数据仅保存在本机"}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={authenticated ? "已登录" : "本地模式，尚未登录"}
          style={[
            styles.statusDot,
            { backgroundColor: authenticated ? colors.sprout : colors.amber },
          ]}
        />
      </View>

      <View style={styles.group}>
        <Text style={[styles.groupTitle, { color: colors.inkMuted }]}>
          同步
        </Text>
        <SettingRow
          icon="cloud"
          title="云端同步"
          detail={
            authenticated
              ? queue.length
                ? `${queue.length} 条记录等待上传`
                : "已连接，最近一次同步正常"
              : "登录后开启，多设备共享同一份历史"
          }
          tone={authenticated ? "sprout" : "amber"}
          onPress={() => void sync()}
        />
        <SettingRow
          icon="refresh"
          title="立即同步"
          detail={lastSyncError ?? "手动触发一次拉取与队列重放"}
          tone={lastSyncError ? "danger" : "sky"}
          onPress={() => void sync()}
        />
      </View>

      <View style={styles.group}>
        <Text style={[styles.groupTitle, { color: colors.inkMuted }]}>
          个人数据
        </Text>
        <SettingRow
          icon="user"
          title="档案与目标"
          detail="个人目标将在档案能力接入后开放"
          tone="chestnut"
        />
        <SettingRow
          icon="download"
          title="导出账号数据"
          detail={
            authenticated
              ? exporting
                ? "正在生成不含密钥和令牌的 JSON 文件"
                : "下载或分享你的记录、来源和公开资料"
              : "登录后可以导出你的云端记录"
          }
          tone="sky"
          onPress={() => void handleExport()}
          disabled={!authenticated || exporting}
          trailing={
            exporting ? <ActivityIndicator color={colors.skyDark} /> : undefined
          }
        />
        {exportFeedback && (
          <View
            accessibilityRole="alert"
            style={[
              styles.feedback,
              {
                backgroundColor:
                  exportFeedback.kind === "error"
                    ? colors.dangerSoft
                    : colors.sproutSoft,
                borderColor: colors.border,
              },
            ]}
          >
            <Icon
              name={exportFeedback.kind === "error" ? "cloudOff" : "leaf"}
              size={17}
              color={
                exportFeedback.kind === "error" ? colors.danger : colors.sprout
              }
            />
            <Text style={[styles.feedbackText, { color: colors.ink }]}>
              {exportFeedback.message}
            </Text>
          </View>
        )}
        {authenticated && (
          <SettingRow
            icon="trash"
            title="删除账号与云端数据"
            detail="需要再次确认；成功后本机缓存和同步队列也会清除"
            tone="danger"
            onPress={openDeleteConfirmation}
          />
        )}
      </View>

      <View style={styles.group}>
        <Text style={[styles.groupTitle, { color: colors.inkMuted }]}>
          隐私边界
        </Text>
        <View
          style={[
            styles.notice,
            { backgroundColor: colors.sproutSoft, borderColor: colors.border },
          ]}
        >
          <Icon name="leaf" size={19} color={colors.sprout} />
          <Text style={[styles.noticeText, { color: colors.ink }]}>
            不使用广告、行为分析或远程推送。AI 只在你主动确认后发送，API key
            不会进入云同步。
          </Text>
        </View>
      </View>

      {authenticated && (
        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut().then(() => router.replace("/sign-in"))}
          style={({ pressed }) => [
            styles.logout,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Icon name="logout" size={18} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>
            退出登录
          </Text>
        </Pressable>
      )}

      <DeleteAccountModal
        visible={deleteVisible}
        confirmation={deleteConfirmation}
        error={deleteError}
        deleting={deleting}
        colors={colors}
        onChangeConfirmation={setDeleteConfirmation}
        onCancel={() => {
          if (!deleting) setDeleteVisible(false);
        }}
        onConfirm={() => void handleDelete()}
      />
    </Screen>
  );
}

function SettingRow({
  icon,
  title,
  detail,
  tone,
  onPress,
  disabled = false,
  trailing,
}: {
  icon: IconName;
  title: string;
  detail: string;
  tone: "sprout" | "amber" | "chestnut" | "sky" | "danger";
  onPress?: () => void;
  disabled?: boolean;
  trailing?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  const iconColor = tone === "sky" ? colors.skyDark : colors[tone];
  const iconBackground =
    tone === "sprout"
      ? colors.sproutSoft
      : tone === "amber"
        ? colors.amberSoft
        : tone === "sky"
          ? colors.skySoft
          : tone === "danger"
            ? colors.dangerSoft
            : colors.amberSoft;
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.rowDetail, { color: colors.inkMuted }]}>
          {detail}
        </Text>
      </View>
      {trailing ??
        (onPress && <Icon name="next" size={18} color={colors.inkMuted} />)}
    </>
  );
  if (!onPress) {
    return (
      <View
        accessibilityRole="text"
        style={[
          styles.row,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: 0.82,
          },
        ]}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        disabled && { opacity: 0.58 },
        pressed && !disabled && { opacity: 0.75 },
      ]}
    >
      {content}
    </Pressable>
  );
}

function DeleteAccountModal({
  visible,
  confirmation,
  error,
  deleting,
  colors,
  onChangeConfirmation,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  confirmation: string;
  error: string | null;
  deleting: boolean;
  colors: ReturnType<typeof import("@nuttie/design-tokens").getSemanticColors>;
  onChangeConfirmation: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const valid = confirmation === "DELETE";
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.modalRoot, { backgroundColor: colors.scrim }]}>
        <Pressable
          accessibilityLabel="关闭删除确认"
          accessibilityRole="button"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.dialog,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.dialogHeader}>
            <View
              style={[
                styles.dialogIcon,
                { backgroundColor: colors.dangerSoft },
              ]}
            >
              <Icon name="trash" size={19} color={colors.danger} />
            </View>
            <View style={styles.dialogCopy}>
              <Text style={[styles.dialogTitle, { color: colors.ink }]}>
                删除账号与云端数据
              </Text>
              <Text style={[styles.dialogBody, { color: colors.inkMuted }]}>
                这会删除云端账号、历史记录、同步队列和本机缓存，成功后无法撤销。
              </Text>
            </View>
          </View>
          <Text style={[styles.confirmLabel, { color: colors.ink }]}>
            请输入 DELETE 以确认
          </Text>
          <TextInput
            accessibilityLabel="删除确认文本"
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!deleting}
            onChangeText={onChangeConfirmation}
            placeholder="DELETE"
            placeholderTextColor={colors.inkSubtle}
            value={confirmation}
            style={[
              styles.confirmInput,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: valid ? colors.danger : colors.border,
                color: colors.ink,
              },
            ]}
          />
          {error && (
            <Text
              accessibilityRole="alert"
              style={[styles.dialogError, { color: colors.danger }]}
            >
              {error}
            </Text>
          )}
          <View style={styles.dialogActions}>
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                { borderColor: colors.border },
                deleting && { opacity: 0.55 },
                pressed && !deleting && { opacity: 0.72 },
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.inkMuted }]}>
                取消
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !valid || deleting }}
              disabled={!valid || deleting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: colors.danger },
                (!valid || deleting) && { opacity: 0.45 },
                pressed && valid && !deleting && { opacity: 0.8 },
              ]}
            >
              {deleting ? (
                <ActivityIndicator color={colors.inverse} />
              ) : (
                <Text style={[styles.deleteText, { color: colors.inverse }]}>
                  确认删除
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  kicker: { ...typeScale.caption, fontWeight: "700" },
  title: { ...typeScale.title },
  body: { ...typeScale.body },
  account: {
    minHeight: componentTokens.account.minHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.card,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: componentTokens.account.avatarSize,
    height: componentTokens.account.avatarSize,
    borderRadius: componentTokens.account.avatarRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  accountCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  accountName: { ...typeScale.body, fontWeight: "700" },
  accountEmail: { ...typeScale.caption },
  statusDot: {
    width: componentTokens.account.statusSize,
    height: componentTokens.account.statusSize,
    borderRadius: componentTokens.account.statusSize / 2,
  },
  group: { gap: spacing.sm },
  groupTitle: { ...typeScale.caption, fontWeight: "700" },
  row: {
    minHeight: componentTokens.recordRow.minHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowIcon: {
    width: componentTokens.recordRow.iconSize,
    height: componentTokens.recordRow.iconSize,
    borderRadius: componentTokens.recordRow.iconRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: componentTokens.recordRow.copyGap,
  },
  rowTitle: { ...typeScale.body, fontWeight: "700" },
  rowDetail: { ...typeScale.caption },
  feedback: {
    minHeight: componentTokens.feedback.minHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  feedbackText: { ...typeScale.caption, flex: 1 },
  notice: {
    minHeight: componentTokens.notice.minHeight,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  noticeText: { ...typeScale.body, flex: 1 },
  logout: {
    minHeight: dimensions.control,
    borderWidth: 1,
    borderRadius: radii.compact,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  logoutText: { ...typeScale.label },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  dialog: {
    width: "100%",
    maxWidth: componentTokens.modal.maxWidth,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.feature,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  dialogHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  dialogIcon: {
    width: componentTokens.modal.iconSize,
    height: componentTokens.modal.iconSize,
    borderRadius: radii.compact,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  dialogTitle: { ...typeScale.heading },
  dialogBody: { ...typeScale.body },
  confirmLabel: { ...typeScale.label },
  confirmInput: {
    minHeight: dimensions.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    paddingHorizontal: spacing.md,
    ...typeScale.body,
  },
  dialogError: { ...typeScale.caption },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  cancelButton: {
    minHeight: dimensions.minTouch,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.compact,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { ...typeScale.label },
  deleteButton: {
    minHeight: dimensions.minTouch,
    minWidth: componentTokens.modal.actionMinWidth,
    borderRadius: radii.compact,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { ...typeScale.label },
});
