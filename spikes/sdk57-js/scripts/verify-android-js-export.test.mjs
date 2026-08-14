import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AndroidJavaScriptExportEvidenceError,
  verifyAndroidJavaScriptExport,
} from "./verify-android-js-export.mjs";

const BUNDLE_PATH = "_expo/static/js/android/entry-0123456789abcdef0123456789abcdef.hbc";
const ASSETS = [
  { path: "assets/0123456789abcdef0123456789abcdef", ext: "png" },
  { path: "assets/1123456789abcdef0123456789abcdef", ext: "ttf" },
  { path: "assets/2123456789abcdef0123456789abcdef", ext: "xml" },
];

function createFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nuttie-android-js-export-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const exportRoot = path.join(root, "dist");
  fs.mkdirSync(path.join(exportRoot, path.dirname(BUNDLE_PATH)), { recursive: true });
  fs.mkdirSync(path.join(exportRoot, "assets"), { recursive: true });
  fs.writeFileSync(path.join(exportRoot, BUNDLE_PATH), "android-hermes-bytecode-fixture");
  for (const asset of ASSETS) {
    fs.writeFileSync(path.join(exportRoot, asset.path), `${asset.ext}-fixture`);
  }
  const metadata = {
    version: 0,
    bundler: "metro",
    fileMetadata: {
      android: {
        bundle: BUNDLE_PATH,
        assets: structuredClone(ASSETS),
      },
    },
  };
  fs.writeFileSync(path.join(exportRoot, "metadata.json"), JSON.stringify(metadata));
  return { root, exportRoot, metadata };
}

async function assertEvidenceError(promise, code) {
  await assert.rejects(
    promise,
    (error) => error instanceof AndroidJavaScriptExportEvidenceError && error.code === code,
  );
}

test("accepts an exact Android-only Metro export with the explicit asset policy", async (t) => {
  const fixture = createFixture(t);
  const report = await verifyAndroidJavaScriptExport(fixture);
  assert.equal(report.ok, true);
  assert.equal(report.scope, "SDK57_ANDROID_JAVASCRIPT_EXPORT_STRUCTURE");
  assert.equal(report.platform, "android");
  assert.equal(report.bundleFiles, 1);
  assert.equal(report.assetFiles, 3);
  assert.equal(report.totalFiles, 5);
  assert.equal(report.bundleSha256UsedAsGate, false);
  assert.equal(report.nativeDirectories, false);
  assert.equal(Object.hasOwn(report, "bundleSha256"), false);
});

test("rejects additional platform metadata", async (t) => {
  const fixture = createFixture(t);
  fixture.metadata.fileMetadata.ios = structuredClone(fixture.metadata.fileMetadata.android);
  fs.writeFileSync(path.join(fixture.exportRoot, "metadata.json"), JSON.stringify(fixture.metadata));
  await assertEvidenceError(verifyAndroidJavaScriptExport(fixture), "ANDROID_EXPORT_PLATFORM_SCOPE");
});

test("rejects asset extensions outside the Android export policy", async (t) => {
  const fixture = createFixture(t);
  fixture.metadata.fileMetadata.android.assets[0].ext = "js";
  fs.writeFileSync(path.join(fixture.exportRoot, "metadata.json"), JSON.stringify(fixture.metadata));
  await assertEvidenceError(verifyAndroidJavaScriptExport(fixture), "ANDROID_EXPORT_ASSET_EXTENSION");
});

test("rejects undeclared Android export files", async (t) => {
  const fixture = createFixture(t);
  fs.writeFileSync(path.join(fixture.exportRoot, "unexpected.txt"), "unexpected");
  await assertEvidenceError(verifyAndroidJavaScriptExport(fixture), "ANDROID_EXPORT_FILE_SET_MISMATCH");
});

test("rejects generated native directories", async (t) => {
  const fixture = createFixture(t);
  fs.mkdirSync(path.join(fixture.root, "android"));
  await assertEvidenceError(verifyAndroidJavaScriptExport(fixture), "ANDROID_EXPORT_NATIVE_DIRECTORY_PRESENT");
});
