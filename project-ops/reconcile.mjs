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

function latestD039DecisionEvent(model) {
  return model.events
    .filter((record) => record.value?.type === "DECISION_ACCEPTED" && record.value?.subject?.id === "D-039")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD039BaselineEvent(model) {
  return model.events
    .filter((record) => record.value?.type === "GATE_CHANGED" && record.value?.subject?.id === "D-039-PX-4")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD039DorAssessment(model) {
  return model.events
    .filter((record) => record.value?.type === "REVIEW_FEEDBACK" && record.value?.subject?.id === "D-039-PX-5")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD039DorProgress(model) {
  return model.events
    .filter((record) => [
      "D039-FORMAL-ACCEPTANCE-MATRIX-001",
      "D039-ROUTE-OBSERVABILITY-CONTRACT-001",
    ].includes(record.value?.subject?.id))
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD045Record(model) {
  return model.events
    .filter((record) => record.value?.subject?.id === "D045-RECENT-FAVORITES-CARD-001")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD040Record(model) {
  return model.events
    .filter((record) => {
      const subjectId = record.value?.subject?.id;
      const correlationId = record.value?.correlationId;
      return subjectId === "D040-RESEARCH-002" ||
        subjectId === "D040-QUESTION-ALLOCATION-001" ||
        subjectId === "D040-FIRST-BATCH-CARD-SPEC-001" ||
        correlationId === "d040-macronutrient-governance-audit";
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
  const d032Decision = decisions.find((decision) => decision?.id === "D-032") ?? null;
  const d039Decision = decisions.find((decision) => decision?.id === "D-039") ?? null;
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
    jsSpikeAuthorization: {
      decisionId: "D-032",
      decisionState: d032Decision?.status ?? null,
      choiceKey: d032Decision?.choiceKey ?? null,
      authorized:
        d032Decision?.status === "CANDIDATE" &&
        d032Decision?.choiceKey === "sdk-57-spike-authorized",
    },
    nativeSelectionGate: {
      expectedTool: "request_user_input",
      expectedQuestionId: "d040_onboarding_goals",
      passed:
        ownerIntake.channel === "CODEX_REQUEST_USER_INPUT" &&
        ownerIntake.nextQuestion?.id === "d040_onboarding_goals" &&
        ownerIntake.nextQuestion?.tool === "request_user_input",
    },
  };
  if (!ownerGate.nativeSelectionGate.passed) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_OWNER_INPUT_GATE", "project-ops/owner-intake.json.nextQuestion", "D-039 PX-3 通过后，计划中的下一张 Owner 卡必须转为 D-040 并保留原生 request_user_input", ownerGate.nativeSelectionGate);
  }
  if (!ownerGate.jsSpikeAuthorization.authorized) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_JS_SPIKE_AUTHORIZATION", "D-032", "D-032 未保持 SDK 57 隔离 JS Spike 授权边界", ownerGate.jsSpikeAuthorization);
  }

  const d039Gate = latestD039Gate(model);
  const d039DecisionEvent = latestD039DecisionEvent(model);
  const d039BaselineEvent = latestD039BaselineEvent(model);
  const d039DorAssessment = latestD039DorAssessment(model);
  const d039DorProgress = latestD039DorProgress(model);
  const d039 = {
    px2EventId: d039Gate?.eventId ?? null,
    px2State: d039Gate?.data?.to ?? null,
    decisionEventId: d039DecisionEvent?.eventId ?? null,
    px3State: d039DecisionEvent?.data?.px3OwnerGatePassed === true ? "PX-3_PASS" : null,
    baselineEventId: d039BaselineEvent?.eventId ?? null,
    state: d039BaselineEvent?.data?.to ?? null,
    px4Next: d039BaselineEvent?.data?.next ?? null,
    dorAssessmentEventId: d039DorAssessment?.eventId ?? null,
    dorDisposition: d039DorAssessment?.data?.disposition ?? null,
    dorState: d039DorAssessment?.data?.to ?? null,
    next: d039DorProgress?.data?.next ?? d039DorAssessment?.data?.next ?? d039BaselineEvent?.data?.next ?? null,
    closedBlockerIds: d039DorProgress?.data?.closedBlockerIds ?? [],
    openBlockerCount: d039DorProgress?.data?.remainingOpenBlockerCount ?? d039DorAssessment?.data?.openBlockerCount ?? null,
    formalAcceptanceMatrixComplete: d039DorProgress?.data?.formalAcceptanceMatrixComplete ?? false,
    stableRouteAndTestIdsMapped: d039DorProgress?.data?.stableRouteAndTestIdsMapped ?? false,
    returnDeepLinkContractComplete: d039DorProgress?.data?.returnDeepLinkContractComplete ?? false,
    decisionState: d039Decision?.status ?? null,
    choiceKey: d039Decision?.choiceKey ?? null,
    ownerChoiceRecorded: d039DecisionEvent?.data?.ownerChoiceRecorded ?? null,
    selectedOption: d039BaselineEvent?.data?.selectedOption ?? null,
    designBaselineFrozen: d039BaselineEvent?.data?.designBaselineFrozen ?? null,
    px3FormalImplementationAuthorized: d039DecisionEvent?.data?.formalImplementationAuthorized ?? null,
    formalImplementationAuthorized: d039BaselineEvent?.data?.formalImplementationAuthorized ?? null,
  };
  if (!(
    d039.px2State === "PX-2_PASS" &&
    d039.px3State === "PX-3_PASS" &&
    d039.state === "PX-4_BASELINE_FROZEN" &&
    d039.px4Next === "PX-5_DOR_REQUIRED" &&
    d039.dorDisposition === "NOT_READY" &&
    d039.dorState === "PX-5_DOR_NOT_READY" &&
    d039.next === "D039-PX5-OWNER_DEPENDENCIES_REQUIRED" &&
    JSON.stringify(d039.closedBlockerIds) === JSON.stringify(["D039-PX5-B01", "D039-PX5-B02"]) &&
    d039.openBlockerCount === 5 &&
    d039.formalAcceptanceMatrixComplete === true &&
    d039.stableRouteAndTestIdsMapped === true &&
    d039.returnDeepLinkContractComplete === true &&
    d039.decisionState === "ACCEPTED" &&
    d039.choiceKey === "local-search-recent-first" &&
    d039.ownerChoiceRecorded === true &&
    d039.selectedOption === "A" &&
    d039.designBaselineFrozen === true &&
    d039.px3FormalImplementationAuthorized === false &&
    d039.formalImplementationAuthorized === false
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D039_GATE", "D-039", "D-039 未保持 PX-4、PX-5 NOT_READY、B01/B02 关闭、Owner 依赖待办和正式实现未授权状态", d039);
  }

  const d045Record = latestD045Record(model);
  const d045 = {
    eventId: d045Record?.eventId ?? null,
    decisionState: d045Record?.data?.decisionState ?? null,
    blockerState: d045Record?.data?.d039BlockerState ?? null,
    cardState: d045Record?.data?.cardState ?? null,
    next: d045Record?.data?.next ?? null,
    optionCount: d045Record?.data?.optionCount ?? null,
    recommendedOptionId: d045Record?.data?.recommendedOptionId ?? null,
    selfReviewPassed: [
      d045Record?.data?.productSelfReviewPassed,
      d045Record?.data?.privacySelfReviewPassed,
      d045Record?.data?.dataIntegritySelfReviewPassed,
      d045Record?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    independentReviewPassed: d045Record?.data?.independentReviewPassed ?? null,
    ownerCardScheduled: d045Record?.data?.ownerCardScheduled ?? null,
    ownerReviewAuthorized: d045Record?.data?.ownerReviewAuthorized ?? null,
    formalImplementationAuthorized: d045Record?.data?.formalImplementationAuthorized ?? null,
    registeredInDecisionLedger: model.decisionRegister.decisions.some((decision) => decision.id === "D-045"),
    ownerResponseCount: model.ownerIntake.responses.filter((response) => response.decisionId === "D-045").length,
  };
  if (!(
    d045.eventId === "EVT-20260815-008" &&
    d045.decisionState === "CANDIDATE" &&
    d045.blockerState === "OPEN" &&
    d045.cardState === "DRAFT_COMPLETE" &&
    d045.next === "D045_INDEPENDENT_REVIEW_REQUIRED" &&
    d045.optionCount === 3 &&
    d045.recommendedOptionId === "recent_only_derived" &&
    d045.selfReviewPassed === true &&
    d045.independentReviewPassed === false &&
    d045.ownerCardScheduled === false &&
    d045.ownerReviewAuthorized === false &&
    d045.formalImplementationAuthorized === false &&
    d045.registeredInDecisionLedger === false &&
    d045.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D045_GATE", "D-045", "D-045 未保持三包内部卡自审完成、独立复核/Owner/B03/实现待办和未进入权威台账状态", d045);
  }

  const d040Record = latestD040Record(model);
  const d040AllocationRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260815-003",
  )?.value ?? null;
  const d040 = {
    eventId: d040Record?.eventId ?? null,
    decisionState: d040Record?.data?.decisionState ?? null,
    authoritativeState: d040Record?.data?.authoritativeState ?? null,
    next: d040Record?.data?.next ?? null,
    sourceDraftQuestionCount: d040AllocationRecord?.data?.sourceDraftQuestionCount ?? null,
    resolvedDecisionAxisCount: d040AllocationRecord?.data?.resolvedDecisionAxisCount ?? null,
    newlyReservedIdCount: d040AllocationRecord?.data?.newlyReservedIdCount ?? null,
    firstBatchCardCount: d040Record?.data?.cardCount ?? null,
    firstBatchSelfReviewPassed: [
      d040Record?.data?.productSelfReviewPassed,
      d040Record?.data?.healthEvidenceSelfReviewPassed,
      d040Record?.data?.privacySelfReviewPassed,
      d040Record?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    formulaEvidenceReviewComplete: d040Record?.data?.formulaEvidenceReviewComplete ?? null,
    ownerCardScheduled: d040Record?.data?.ownerCardScheduled ?? null,
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
  if (!(
    d040.decisionState === "CANDIDATE" &&
    d040.authoritativeState === "PX-0_INPUT_GAP" &&
    d040.next === "FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED" &&
    d040.sourceDraftQuestionCount === 17 &&
    d040.resolvedDecisionAxisCount === 20 &&
    d040.newlyReservedIdCount === 19 &&
    d040.firstBatchCardCount === 4 &&
    d040.firstBatchSelfReviewPassed === true &&
    d040.formulaEvidenceReviewComplete === true &&
    d040.ownerCardScheduled === false &&
    d040AuthorizationClosed
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D040_GATE", "D-040", "D-040 未保持 20 轴分解、第一批四卡自审完成/独立复核待办、PX-0 输入缺口和六项授权位关闭状态", d040);
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
    d045,
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
