import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PlatformJavaScriptExportEvidenceError,
  verifyPlatformJavaScriptExport,
} from "./verify-platform-js-export.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const AndroidJavaScriptExportEvidenceError = PlatformJavaScriptExportEvidenceError;

export function verifyAndroidJavaScriptExport(options = {}) {
  const root = path.resolve(options.root ?? DEFAULT_ROOT);
  return verifyPlatformJavaScriptExport({
    root,
    exportRoot: path.resolve(options.exportRoot ?? path.join(root, "dist")),
    platform: "android",
    allowedAssetExtensions: ["png", "ttf", "xml"],
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SCRIPT_PATH)) {
  try {
    const report = await verifyAndroidJavaScriptExport();
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      code: error?.code ?? "ANDROID_EXPORT_VERIFICATION_FAILED",
      message: error instanceof Error ? error.message : String(error),
    }, null, 2));
    process.exitCode = 1;
  }
}
