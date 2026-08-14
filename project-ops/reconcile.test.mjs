import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadProjectOps } from "./validate.mjs";
import { reconcileProjectOps } from "./reconcile.mjs";

const TEST_PATH = fileURLToPath(import.meta.url);
const WORKSPACE_ROOT = path.resolve(path.dirname(TEST_PATH), "..");

function validModel() {
  return loadProjectOps(WORKSPACE_ROOT);
}

test("当前 ProjectOps 源、D-039 Owner 选择与下一门禁一致", () => {
  const report = reconcileProjectOps(validModel());
  assert.equal(report.ok, true);
  assert.deepEqual(report.counts, {
    decisions: 32,
    acceptedDecisions: 29,
    candidateDecisions: 3,
    events: 164,
    messages: 116,
    agents: 25,
    activeAgents: 1,
    evidenceItems: 66,
    confirmedEvidence: 37,
    crossSourceEvidence: 24,
    pendingEvidence: 5,
    gapThemes: 9,
    ownerResponses: 14,
    ownerDecisionIds: 13,
  });
  assert.equal(report.snapshot.freshness, "CURRENT");
  assert.equal(report.ownerGate.nativeSelectionGate.passed, true);
  assert.equal(report.ownerGate.status, "CONFIRMED");
  assert.equal(report.ownerGate.acceptanceStateChanged, true);
  assert.equal(report.ownerGate.jsSpikeAuthorization.authorized, true);
  assert.equal(report.ownerGate.jsSpikeAuthorization.choiceKey, "sdk-57-spike-authorized");
  assert.equal(report.ownerGate.identifierStatus.selectedOptionId, "not_created");
  assert.equal(report.ownerGate.identifierStatus.normalizedValue, "NOT_CREATED");
  assert.equal(report.ownerGate.identifierStatus.bundleId, null);
  assert.equal(report.ownerGate.identifierStatus.sku, "N/A");
  assert.equal(report.ownerGate.deviceAvailability.selectedOptionId, "iphone_only");
  assert.equal(report.ownerGate.deviceAvailability.iphoneModel, "iPhone 16 Pro Max");
  assert.equal(report.ownerGate.deviceAvailability.iosVersion, "26.5");
  assert.equal(report.ownerGate.deviceAvailability.nativeIosWorkAuthorized, false);
  assert.equal(report.d039.px2State, "PX-2_PASS");
  assert.equal(report.d039.px3State, "PX-3_PASS");
  assert.equal(report.d039.state, "PX-4_BASELINE_FROZEN");
  assert.equal(report.d039.px4Next, "PX-5_DOR_REQUIRED");
  assert.equal(report.d039.dorDisposition, "NOT_READY");
  assert.equal(report.d039.dorState, "PX-5_DOR_NOT_READY");
  assert.equal(report.d039.next, "D039-PX5-B02_REQUIRED");
  assert.deepEqual(report.d039.closedBlockerIds, ["D039-PX5-B01"]);
  assert.equal(report.d039.openBlockerCount, 6);
  assert.equal(report.d039.formalAcceptanceMatrixComplete, true);
  assert.equal(report.d039.decisionState, "ACCEPTED");
  assert.equal(report.d039.choiceKey, "local-search-recent-first");
  assert.equal(report.d039.selectedOption, "A");
  assert.equal(report.d039.designBaselineFrozen, true);
  assert.equal(report.d040.authoritativeState, "PX-0_INPUT_GAP");
  assert.equal(report.d040.next, "FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(report.d040.resolvedDecisionAxisCount, 20);
  assert.equal(report.d040.newlyReservedIdCount, 19);
  assert.equal(report.d040.formulaEvidenceReviewComplete, true);
  assert.equal(report.d040.firstBatchCardCount, 4);
  assert.equal(report.d040.firstBatchSelfReviewPassed, true);
  assert.equal(report.d040.ownerCardScheduled, false);
});

test("快照计数漂移是错误，且不写回任何文件", () => {
  const model = validModel();
  const before = JSON.stringify(model.snapshot);
  model.snapshot.metrics.projectEvents -= 1;
  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_SNAPSHOT_METRIC_MISMATCH"));
  assert.equal(JSON.stringify(model.snapshot), JSON.stringify({ ...JSON.parse(before), metrics: { ...JSON.parse(before).metrics, projectEvents: JSON.parse(before).metrics.projectEvents - 1 } }));
});

test("D-039 接受后计划中的 D-040 Owner 卡偏离原生渠道时失败关闭", () => {
  const model = validModel();
  model.ownerIntake.nextQuestion.tool = "static-workbench";
  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_OWNER_INPUT_GATE"));
});

test("D-039 正式实现或 D-040 未授权门禁越级时失败关闭", () => {
  const d039Model = validModel();
  d039Model.events.find((record) => record.value.eventId === "EVT-20260815-001").value.data.formalImplementationAuthorized = true;
  const d039Report = reconcileProjectOps(d039Model);
  assert.equal(d039Report.ok, false);
  assert.ok(d039Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D039_GATE"));

  const d040Model = validModel();
  d040Model.events.find((record) => record.value.eventId === "EVT-20260815-004").value.data.ownerReviewAuthorized = true;
  const d040Report = reconcileProjectOps(d040Model);
  assert.equal(d040Report.ok, false);
  assert.ok(d040Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));
});

test("命令行诊断器不创建或覆盖快照", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "nuttie-reconcile-"));
  fs.cpSync(path.join(WORKSPACE_ROOT, "project-ops"), path.join(fixture, "project-ops"), { recursive: true });
  fs.mkdirSync(path.join(fixture, "docs", "01-research"), { recursive: true });
  for (const name of ["competitor-evidence-matrix.md", "public-evidence-gaps.md"]) {
    fs.copyFileSync(
      path.join(WORKSPACE_ROOT, "docs", "01-research", name),
      path.join(fixture, "docs", "01-research", name),
    );
  }
  const snapshotPath = path.join(fixture, "project-ops", "snapshots", "current.json");
  const before = fs.readFileSync(snapshotPath, "utf8");
  const report = reconcileProjectOps(loadProjectOps(fixture));
  assert.equal(report.ok, true);
  assert.equal(fs.readFileSync(snapshotPath, "utf8"), before);
});
