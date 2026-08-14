import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { findCommand, inspectArtifacts, runPreflight } from "./rn-init-preflight.mjs";

test("findCommand only reports executables visible on PATH", () => {
  assert.ok(findCommand("node"), "node must be visible to the test runner");
  assert.equal(findCommand("definitely-not-a-real-nuttie-command"), null);
});

test("current workspace records OI-02/OI-03 but remains blocked before batch confirmation and native iOS initialization", () => {
  const report = runPreflight(process.cwd());
  assert.equal(report.ok, false);
  assert.equal(report.readyForInitialization, false);
  assert.equal(report.readyForJsSpike, false);
  assert.equal(report.readyForNativeIosSpike, false);
  assert.equal(report.reconcile.ok, true);
  assert.equal(report.owner.passed, false);
  assert.equal(report.owner.selectionMechanismConfigured, true, "the native batch readback mechanism must remain correctly configured");
  assert.equal(report.owner.batchConfirmed, false);
  assert.equal(report.owner.deviceFactRecorded, true);
  assert.equal(report.owner.macAvailable, false);
  assert.equal(report.owner.deviceAvailability.iphoneModel, "iPhone 16 Pro Max");
  assert.equal(report.owner.deviceAvailability.iosVersion, "26.5");
  assert.equal(report.owner.acceptanceStateChanged, false);
  assert.equal(report.artifacts["package.json"].present, false);
  assert.equal(report.artifacts["pnpm-lock.yaml"].present, false);
  assert.equal(report.artifacts.ios.present, false);
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.code === "XCODEBUILD_NOT_AVAILABLE"));
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.code === "COCOAPODS_NOT_AVAILABLE"));
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.code === "MAC_NOT_AVAILABLE"));
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.code === "OWNER_BATCH_NOT_CONFIRMED"));
});

test("preflight detects a formal artifact without writing or deleting it", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "nuttie-preflight-"));
  const artifact = path.join(workspace, "package.json");
  fs.writeFileSync(artifact, "{}", "utf8");
  const artifacts = inspectArtifacts(workspace);
  assert.equal(artifacts["package.json"].present, true);
  assert.equal(fs.readFileSync(artifact, "utf8"), "{}");
  fs.rmSync(workspace, { recursive: true, force: true });
});

test("preflight artifact inspection covers alternate package and Expo roots", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "nuttie-preflight-artifacts-"));
  fs.writeFileSync(path.join(workspace, "package-lock.json"), "{}", "utf8");
  fs.writeFileSync(path.join(workspace, "app.config.ts"), "export default {};", "utf8");
  fs.mkdirSync(path.join(workspace, "android"));
  const artifacts = inspectArtifacts(workspace);
  assert.equal(artifacts["package-lock.json"].present, true);
  assert.equal(artifacts["app.config.ts"].present, true);
  assert.equal(artifacts.android.present, true);
  assert.equal(artifacts["pnpm-lock.yaml"].present, false);
  fs.rmSync(workspace, { recursive: true, force: true });
});
