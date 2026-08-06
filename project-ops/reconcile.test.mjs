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

test("当前 ProjectOps 源与快照计数一致，陈旧快照只产生 warning", () => {
  const report = reconcileProjectOps(validModel());
  assert.equal(report.ok, true);
  assert.deepEqual(report.counts, {
    decisions: 31,
    acceptedDecisions: 17,
    candidateDecisions: 14,
    events: 106,
    messages: 110,
    agents: 23,
    activeAgents: 1,
    evidenceItems: 66,
    confirmedEvidence: 37,
    crossSourceEvidence: 24,
    pendingEvidence: 5,
    gapThemes: 9,
    ownerResponses: 13,
    ownerDecisionIds: 12,
  });
  assert.equal(report.snapshot.freshness, "STALE");
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_SNAPSHOT_STALE" && diagnostic.severity === "warning"));
  assert.equal(report.ownerGate.nativeSelectionGate.passed, true);
  assert.equal(report.d039.state, "PX-2_PASS");
  assert.equal(report.d040.authoritativeState, "PX-0_INPUT_GAP");
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

test("Owner 下一题偏离原生 OI-03 选择卡时失败关闭", () => {
  const model = validModel();
  model.ownerIntake.nextQuestion.tool = "static-workbench";
  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_OWNER_INPUT_GATE"));
});

test("D-039 或 D-040 越过未授权门禁时失败关闭", () => {
  const d039Model = validModel();
  d039Model.events.find((record) => record.value.eventId === "EVT-20260805-005").value.data.formalImplementationAuthorized = true;
  const d039Report = reconcileProjectOps(d039Model);
  assert.equal(d039Report.ok, false);
  assert.ok(d039Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D039_GATE"));

  const d040Model = validModel();
  d040Model.events.find((record) => record.value.eventId === "EVT-20260806-029").value.data.ownerReviewAuthorized = true;
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
