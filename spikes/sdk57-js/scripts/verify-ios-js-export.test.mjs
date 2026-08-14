import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  IosJavaScriptExportEvidenceError,
  verifyIosJavaScriptExport,
} from "./verify-ios-js-export.mjs";

const BUNDLE_PATH = "_expo/static/js/ios/entry-0123456789abcdef0123456789abcdef.hbc";
const ASSET_PATH = "assets/0123456789abcdef0123456789abcdef";

function createFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nuttie-ios-js-export-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const exportRoot = path.join(root, "dist-ios");
  fs.mkdirSync(path.join(exportRoot, path.dirname(BUNDLE_PATH)), { recursive: true });
  fs.mkdirSync(path.join(exportRoot, "assets"), { recursive: true });
  fs.writeFileSync(path.join(exportRoot, BUNDLE_PATH), "hermes-bytecode-fixture");
  fs.writeFileSync(path.join(exportRoot, ASSET_PATH), "png-fixture");
  const metadata = {
    version: 0,
    bundler: "metro",
    fileMetadata: {
      ios: {
        bundle: BUNDLE_PATH,
        assets: [{ path: ASSET_PATH, ext: "png" }],
      },
    },
  };
  fs.writeFileSync(path.join(exportRoot, "metadata.json"), JSON.stringify(metadata));
  return { root, exportRoot, metadata };
}

async function assertEvidenceError(promise, code) {
  await assert.rejects(
    promise,
    (error) => error instanceof IosJavaScriptExportEvidenceError && error.code === code,
  );
}

test("accepts an exact iOS-only Metro export without using a byte hash as a gate", async (t) => {
  const fixture = createFixture(t);
  const report = await verifyIosJavaScriptExport(fixture);
  assert.deepEqual(report, {
    ok: true,
    scope: "SDK57_IOS_JAVASCRIPT_EXPORT_STRUCTURE",
    platform: "ios",
    bundler: "metro",
    metadataVersion: 0,
    bundleFormat: "HERMES_BYTECODE",
    bundleFiles: 1,
    assetFiles: 1,
    totalFiles: 3,
    bundleBytes: 23,
    totalBytes: Buffer.byteLength(JSON.stringify(fixture.metadata)) + 23 + 11,
    bundleSha256UsedAsGate: false,
    fingerprintPolicy: "RUN_SPECIFIC_NOT_REPRODUCIBILITY_GATE",
    nativeDirectories: false,
    nativeRuntimeEvidence: false,
  });
  assert.equal(Object.hasOwn(report, "bundleSha256"), false);
});

test("rejects additional platform metadata", async (t) => {
  const fixture = createFixture(t);
  fixture.metadata.fileMetadata.android = structuredClone(fixture.metadata.fileMetadata.ios);
  fs.writeFileSync(path.join(fixture.exportRoot, "metadata.json"), JSON.stringify(fixture.metadata));
  await assertEvidenceError(verifyIosJavaScriptExport(fixture), "IOS_EXPORT_PLATFORM_SCOPE");
});

test("rejects metadata path traversal", async (t) => {
  const fixture = createFixture(t);
  fixture.metadata.fileMetadata.ios.bundle = "../outside.hbc";
  fs.writeFileSync(path.join(fixture.exportRoot, "metadata.json"), JSON.stringify(fixture.metadata));
  await assertEvidenceError(verifyIosJavaScriptExport(fixture), "IOS_EXPORT_BUNDLE_PATH");
});

test("rejects undeclared export files", async (t) => {
  const fixture = createFixture(t);
  fs.writeFileSync(path.join(fixture.exportRoot, "unexpected.txt"), "unexpected");
  await assertEvidenceError(verifyIosJavaScriptExport(fixture), "IOS_EXPORT_FILE_SET_MISMATCH");
});

test("rejects generated native directories", async (t) => {
  const fixture = createFixture(t);
  fs.mkdirSync(path.join(fixture.root, "ios"));
  await assertEvidenceError(verifyIosJavaScriptExport(fixture), "IOS_EXPORT_NATIVE_DIRECTORY_PRESENT");
});
