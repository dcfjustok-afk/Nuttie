import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { AccountExport } from "@nuttie/contracts";

export const ACCOUNT_EXPORT_FILENAME = "nuttie-account-export.json";

export type AccountExportDelivery = "downloaded" | "shared";

function serializeAccountExport(account: AccountExport): string {
  return `${JSON.stringify(account, null, 2)}\n`;
}

function downloadOnWeb(account: AccountExport): void {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("当前环境不支持下载文件，请稍后重试。");
  }
  const blob = new Blob([serializeAccountExport(account)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = ACCOUNT_EXPORT_FILENAME;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function shareOnNative(account: AccountExport): Promise<void> {
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) throw new Error("设备未提供可写文件目录，导出未完成。");
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("当前设备不支持系统分享，导出未完成。");
  }

  const uri = `${directory}${ACCOUNT_EXPORT_FILENAME}`;
  await FileSystem.writeAsStringAsync(uri, serializeAccountExport(account), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  try {
    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      UTI: "public.json",
      dialogTitle: "导出 Nuttie 数据",
    });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(
      () => undefined,
    );
  }
}

/** Deliver an account export through the platform's native file affordance. */
export async function deliverAccountExport(
  account: AccountExport,
): Promise<AccountExportDelivery> {
  if (Platform.OS === "web") {
    downloadOnWeb(account);
    return "downloaded";
  }
  await shareOnNative(account);
  return "shared";
}
