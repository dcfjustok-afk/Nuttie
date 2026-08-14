import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ProjectOpsLoadError,
  loadProjectOps,
  validateOperationalInvariants,
} from "./validate.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

function parseTime(value) {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

function maxTimestamp(records, field) {
  return records.reduce((latest, record) => {
    const value = record?.value?.[field];
    const time = parseTime(value);
    return time === null || (latest && latest.time >= time) ? latest : { value, time };
  }, null);
}

function latestD039Gate(model) {
  return model.events
    .filter((record) => record.value?.subject?.id === "D-039-PX-2")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD040Record(model) {
  return model.events
    .filter((record) => {
      const subjectId = record.value?.subject?.id;
      const correlationId = record.value?.correlationId;
      return subjectId === "D040-RESEARCH-002" || correlationId === "d040-macronutrient-governance-audit";
    })
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function addDiagnostic(diagnostics, severity, code, diagnosticPath, message, details = undefined) {
  diagnostics.push({
    severity,
    code,
    path: diagnosticPath,
    message,
    ...(details === undefined ? {} : { details }),
  });
}

export function reconcileProjectOps(model) {
  const validation = validateOperationalInvariants(model);
  const diagnostics = validation.diagnostics.map((diagnostic) => ({
    severity: "error",
    ...diagnostic,
  }));
  const decisions = Array.isArray(model.decisionRegister?.decisions)
    ? model.decisionRegister.decisions
    : [];
  const agents = Array.isArray(model.snapshot?.agents) ? model.snapshot.agents : [];
  const ownerIntake = model.ownerIntake ?? {};
  const ownerResponses = Array.isArray(ownerIntake.responses) ? ownerIntake.responses : [];
  const ownerFacts = Array.isArray(ownerIntake.facts) ? ownerIntake.facts : [];
  const oi02Fact = ownerFacts.find((fact) => fact?.inputId === "OI-02") ?? null;
  const oi03Fact = ownerFacts.find((fact) => fact?.inputId === "OI-03") ?? null;
  const latestEvent = maxTimestamp(model.events, "recordedAt");
  const latestMessage = maxTimestamp(model.messages, "sentAt");
  const latestSource = [latestEvent, latestMessage]
    .filter(Boolean)
    .sort((left, right) => left.time - right.time)
    .at(-1) ?? null;
  const snapshotGeneratedAt = model.snapshot?.generatedAt;
  const snapshotTime = parseTime(snapshotGeneratedAt);

  const counts = {
    decisions: decisions.length,
    acceptedDecisions: decisions.filter((decision) => decision?.status === "ACCEPTED").length,
    candidateDecisions: decisions.filter((decision) => decision?.status === "CANDIDATE").length,
    events: model.events.length,
    messages: model.messages.length,
    agents: agents.length,
    activeAgents: agents.filter((agent) => agent?.state === "active").length,
    evidenceItems: model.evidenceRows.length,
    confirmedEvidence: model.evidenceRows.filter((row) => row.status === "confirmed").length,
    crossSourceEvidence: model.evidenceRows.filter((row) => row.status === "cross-source").length,
    pendingEvidence: model.evidenceRows.filter((row) => row.status === "pending").length,
    gapThemes: model.gapThemeRows.length,
    ownerResponses: ownerResponses.length,
    ownerDecisionIds: new Set(ownerResponses.map((response) => response?.decisionId).filter(Boolean)).size,
  };

  const snapshotMetrics = model.snapshot?.metrics ?? {};
  const metricMap = {
    acceptedDecisions: "acceptedDecisions",
    candidateDecisions: "candidateDecisions",
    events: "projectEvents",
    messages: "agentMessages",
    agents: "agentRosterSize",
    activeAgents: "activeAgents",
    evidenceItems: "evidenceItems",
    confirmedEvidence: "confirmedIosItems",
    crossSourceEvidence: "crossSourceItems",
    pendingEvidence: "evidenceGaps",
    gapThemes: "gapThemeCount",
  };
  const metricMismatches = [];
  for (const [sourceMetric, snapshotMetric] of Object.entries(metricMap)) {
    if (snapshotMetrics[snapshotMetric] !== counts[sourceMetric]) {
      metricMismatches.push({
        sourceMetric,
        snapshotMetric,
        sourceValue: counts[sourceMetric],
        snapshotValue: snapshotMetrics[snapshotMetric],
      });
      addDiagnostic(
        diagnostics,
        "error",
        "OPS_RECONCILE_SNAPSHOT_METRIC_MISMATCH",
        `project-ops/snapshots/current.json.metrics.${snapshotMetric}`,
        "快照指标与权威源计数不一致",
        metricMismatches.at(-1),
      );
    }
  }

  let snapshotFreshness = "UNKNOWN";
  if (snapshotTime === null) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_INVALID_SNAPSHOT_TIME", "project-ops/snapshots/current.json.generatedAt", "快照 generatedAt 不是可解析时间");
  } else if (latestSource && snapshotTime < latestSource.time) {
    snapshotFreshness = "STALE";
    addDiagnostic(
      diagnostics,
      "warning",
      "OPS_RECONCILE_SNAPSHOT_STALE",
      "project-ops/snapshots/current.json.generatedAt",
      "快照早于最新事件或消息；未自动覆盖人工快照",
      { snapshotGeneratedAt, latestSource: latestSource.value },
    );
  } else if (latestSource && snapshotTime > latestSource.time) {
    snapshotFreshness = "AHEAD_OF_SOURCE";
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_SNAPSHOT_AHEAD",
      "project-ops/snapshots/current.json.generatedAt",
      "快照时间晚于最新事件或消息，需核对来源",
      { snapshotGeneratedAt, latestSource: latestSource.value },
    );
  } else if (latestSource) {
    snapshotFreshness = "CURRENT";
  }

  const ownerGate = {
    channel: ownerIntake.channel,
    status: ownerIntake.status,
    acceptanceStateChanged: ownerIntake.acceptanceStateChanged,
    responseCount: ownerResponses.length,
    uniqueDecisionCount: new Set(ownerResponses.map((response) => response?.decisionId).filter(Boolean)).size,
    nextQuestion: ownerIntake.nextQuestion ?? null,
    identifierStatus: {
      state: oi02Fact?.state ?? "MISSING",
      selectedOptionId: oi02Fact?.selectedOptionId ?? null,
      normalizedValue: oi02Fact?.normalizedValue ?? null,
      bundleId: oi02Fact?.bundleId ?? null,
      sku: oi02Fact?.sku ?? null,
      appIdStatus: oi02Fact?.appIdStatus ?? null,
      appStoreConnectRecordStatus: oi02Fact?.appStoreConnectRecordStatus ?? null,
    },
    deviceAvailability: {
      state: oi03Fact?.state ?? "MISSING",
      selectedOptionId: oi03Fact?.selectedOptionId ?? null,
      normalizedValue: oi03Fact?.normalizedValue ?? null,
      macAvailability: oi03Fact?.macAvailability ?? null,
      iphoneAvailability: oi03Fact?.iphoneAvailability ?? null,
      iphoneModel: oi03Fact?.iphoneModel ?? null,
      iosVersion: oi03Fact?.iosVersion ?? null,
      nativeIosWorkAuthorized: oi03Fact?.nativeIosWorkAuthorized ?? null,
    },
    nativeSelectionGate: {
      expectedTool: "request_user_input",
      expectedQuestionId: "phase0_owner_batch_readback_confirmation",
      passed:
        ownerIntake.channel === "CODEX_REQUEST_USER_INPUT" &&
        ownerIntake.nextQuestion?.id === "phase0_owner_batch_readback_confirmation" &&
        ownerIntake.nextQuestion?.tool === "request_user_input",
    },
  };
  if (!ownerGate.nativeSelectionGate.passed) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_OWNER_INPUT_GATE", "project-ops/owner-intake.json.nextQuestion", "Owner 下一题未保持宿主原生首批规范化回读门禁", ownerGate.nativeSelectionGate);
  }

  const d039Gate = latestD039Gate(model);
  const d039 = {
    eventId: d039Gate?.eventId ?? null,
    state: d039Gate?.data?.to ?? null,
    next: d039Gate?.data?.next ?? null,
    decisionState: d039Gate?.data?.decisionState ?? null,
    ownerChoiceRecorded: d039Gate?.data?.ownerChoiceRecorded ?? null,
    formalImplementationAuthorized: d039Gate?.data?.formalImplementationAuthorized ?? null,
  };
  if (!(d039.state === "PX-2_PASS" && d039.next === "READY_FOR_OWNER_REVIEW" && d039.decisionState === "CANDIDATE" && d039.ownerChoiceRecorded === false && d039.formalImplementationAuthorized === false)) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D039_GATE", "D-039", "D-039 未保持 PX-2 通过、等待 Owner 评审且未授权实现状态", d039);
  }

  const d040Record = latestD040Record(model);
  const d040 = {
    eventId: d040Record?.eventId ?? null,
    decisionState: d040Record?.data?.decisionState ?? null,
    authoritativeState: d040Record?.data?.authoritativeState ?? null,
    next: d040Record?.data?.next ?? null,
    oi03WasNextAtRecord: d040Record?.data?.oi03RemainsNext ?? null,
    authorization: {
      px1Authorized: d040Record?.data?.px1Authorized ?? null,
      px2Authorized: d040Record?.data?.px2Authorized ?? null,
      ownerReviewAuthorized: d040Record?.data?.ownerReviewAuthorized ?? null,
      ownerChoiceRecorded: d040Record?.data?.ownerChoiceRecorded ?? null,
      decisionAcceptedRecorded: d040Record?.data?.decisionAcceptedRecorded ?? null,
      formalImplementationAuthorized: d040Record?.data?.formalImplementationAuthorized ?? null,
    },
  };
  const d040AuthorizationClosed = Object.values(d040.authorization).every((value) => value === false);
  if (!(d040.decisionState === "CANDIDATE" && d040.authoritativeState === "PX-0_INPUT_GAP" && d040.next === "FORMULA_REVIEW_REQUIRED" && d040AuthorizationClosed)) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D040_GATE", "D-040", "D-040 未保持 PX-0 输入缺口和六项授权位关闭状态", d040);
  }

  return {
    ok: validation.ok && diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
    validation,
    counts,
    snapshot: {
      generatedAt: snapshotGeneratedAt ?? null,
      latestSourceAt: latestSource?.value ?? null,
      freshness: snapshotFreshness,
      metricMismatches,
    },
    ownerGate,
    d039,
    d040,
    diagnostics,
  };
}

export function reconcileWorkspace(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  return reconcileProjectOps(loadProjectOps(workspaceRoot));
}

function parseArguments(argv) {
  if (argv.length === 0) return { workspaceRoot: DEFAULT_WORKSPACE_ROOT, help: false };
  if (argv.length === 1 && ["-h", "--help"].includes(argv[0])) return { workspaceRoot: DEFAULT_WORKSPACE_ROOT, help: true };
  if (argv.length === 2 && argv[0] === "--workspace") return { workspaceRoot: path.resolve(argv[1]), help: false };
  throw new ProjectOpsLoadError("OPS_USAGE_ERROR", "command-line", "用法: node project-ops/reconcile.mjs [--workspace <repo-root>]");
}

function printJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function runCli() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write("用法: node project-ops/reconcile.mjs [--workspace <repo-root>]\n");
      return 0;
    }
    const report = reconcileWorkspace(options.workspaceRoot);
    printJson(report, report.ok ? process.stdout : process.stderr);
    return report.ok ? 0 : 1;
  } catch (error) {
    if (error instanceof ProjectOpsLoadError) {
      printJson({ ok: false, error: { code: error.code, path: error.sourcePath, message: error.message } }, process.stderr);
      return 2;
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  process.exitCode = runCli();
}
