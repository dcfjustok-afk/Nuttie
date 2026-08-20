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

function latestD031Record(model) {
  return model.events
    .filter((record) => record.value?.subject?.id === "D031-MEDIA-AI-RETENTION-CARD-001")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD033Record(model) {
  return model.events
    .filter((record) => record.value?.subject?.id === "D033-NONLABEL-AI-CONFIRMATION-CARD-001")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD034Record(model) {
  return model.events
    .filter((record) => record.value?.subject?.id === "D034-AI-RESOURCE-BUDGET-CARD-001")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD036Record(model) {
  return model.events
    .filter((record) => record.value?.subject?.id === "D036-AI-TRANSPORT-PROFILE-CARD-001")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD053Record(model) {
  return model.events
    .filter((record) => record.value?.subject?.id === "D053-AI-PROVIDER-USE-ADMISSION-CARD-001")
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
        subjectId === "D040-ENERGY-MODEL-BATCH-CARD-SPEC-001" ||
        subjectId === "D040-DATA-LIFECYCLE-BATCH-CARD-SPEC-001" ||
        subjectId === "D040-CHINA-SUPPORT-HEALTH-REVIEW-INPUT-001" ||
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

  const d031Record = latestD031Record(model);
  const d031 = {
    eventId: d031Record?.eventId ?? null,
    decisionState: d031Record?.data?.decisionState ?? null,
    blockerState: d031Record?.data?.d039BlockerState ?? null,
    cardState: d031Record?.data?.cardState ?? null,
    next: d031Record?.data?.next ?? null,
    optionCount: d031Record?.data?.optionCount ?? null,
    recommendedOptionId: d031Record?.data?.recommendedOptionId ?? null,
    acquisitionDoesNotAuthorizeRetention: d031Record?.data?.acquisitionDoesNotAuthorizeRetention ?? null,
    rawProviderResponsePersisted: d031Record?.data?.rawProviderResponsePersisted ?? null,
    backupBoundaryDefined: [
      d031Record?.data?.persistentMediaIncludedInEncryptedBackup,
      d031Record?.data?.backupSizeDisclosureRequired,
      d031Record?.data?.fullDataDeletionCoversRetainedMediaAndAiHistory,
      d031Record?.data?.externalFilesAndPhotoLibraryCopiesOutOfScope,
    ].every((value) => value === true),
    selfReviewPassed: [
      d031Record?.data?.productSelfReviewPassed,
      d031Record?.data?.privacySecuritySelfReviewPassed,
      d031Record?.data?.dataIntegritySelfReviewPassed,
      d031Record?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    independentReviewPassed: d031Record?.data?.independentReviewPassed ?? null,
    ownerCardScheduled: d031Record?.data?.ownerCardScheduled ?? null,
    ownerReviewAuthorized: d031Record?.data?.ownerReviewAuthorized ?? null,
    formalImplementationAuthorized: d031Record?.data?.formalImplementationAuthorized ?? null,
    registeredInDecisionLedger: model.decisionRegister.decisions.some((decision) => decision.id === "D-031"),
    ownerResponseCount: model.ownerIntake.responses.filter((response) => response.decisionId === "D-031").length,
  };
  if (!(
    d031.eventId === "EVT-20260817-001" &&
    d031.decisionState === "CANDIDATE" &&
    d031.blockerState === "OPEN" &&
    d031.cardState === "DRAFT_COMPLETE" &&
    d031.next === "D031_INDEPENDENT_REVIEW_REQUIRED" &&
    d031.optionCount === 3 &&
    d031.recommendedOptionId === "compressed_attachment_ephemeral_ai" &&
    d031.acquisitionDoesNotAuthorizeRetention === true &&
    d031.rawProviderResponsePersisted === false &&
    d031.backupBoundaryDefined === true &&
    d031.selfReviewPassed === true &&
    d031.independentReviewPassed === false &&
    d031.ownerCardScheduled === false &&
    d031.ownerReviewAuthorized === false &&
    d031.formalImplementationAuthorized === false &&
    d031.registeredInDecisionLedger === false &&
    d031.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D031_GATE", "D-031", "D-031 未保持三包媒体/AI 保留卡自审完成、原始响应不落盘、备份/删除边界、独立复核/Owner/B04/实现待办和未进入权威台账状态", d031);
  }

  const d033Record = latestD033Record(model);
  const d033 = {
    eventId: d033Record?.eventId ?? null,
    decisionState: d033Record?.data?.decisionState ?? null,
    blockerState: d033Record?.data?.d039BlockerState ?? null,
    cardState: d033Record?.data?.cardState ?? null,
    next: d033Record?.data?.next ?? null,
    optionCount: d033Record?.data?.optionCount ?? null,
    recommendedOptionId: d033Record?.data?.recommendedOptionId ?? null,
    d014LabelPhotoPreviewScopePreserved: d033Record?.data?.d014LabelPhotoPreviewScopePreserved ?? null,
    confirmationAuthorizesSingleAttemptOnly: d033Record?.data?.confirmationAuthorizesSingleAttemptOnly ?? null,
    confirmationTokenReusable: d033Record?.data?.confirmationTokenReusable ?? null,
    policyUnresolvedBlocksRequest: d033Record?.data?.blockedWhenD034D036OrD053Unresolved ?? null,
    selfReviewPassed: [
      d033Record?.data?.productSelfReviewPassed,
      d033Record?.data?.privacySecuritySelfReviewPassed,
      d033Record?.data?.dataIntegritySelfReviewPassed,
      d033Record?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    independentReviewPassed: d033Record?.data?.independentReviewPassed ?? null,
    ownerCardScheduled: d033Record?.data?.ownerCardScheduled ?? null,
    ownerReviewAuthorized: d033Record?.data?.ownerReviewAuthorized ?? null,
    formalImplementationAuthorized: d033Record?.data?.formalImplementationAuthorized ?? null,
    registeredInDecisionLedger: model.decisionRegister.decisions.some((decision) => decision.id === "D-033"),
    ownerResponseCount: model.ownerIntake.responses.filter((response) => response.decisionId === "D-033").length,
  };
  if (!(
    d033.eventId === "EVT-20260817-002" &&
    d033.decisionState === "CANDIDATE" &&
    d033.blockerState === "OPEN" &&
    d033.cardState === "DRAFT_COMPLETE" &&
    d033.next === "D033_INDEPENDENT_REVIEW_REQUIRED" &&
    d033.optionCount === 3 &&
    d033.recommendedOptionId === "per_request_preview_all_nonlabel_payloads" &&
    d033.d014LabelPhotoPreviewScopePreserved === true &&
    d033.confirmationAuthorizesSingleAttemptOnly === true &&
    d033.confirmationTokenReusable === false &&
    d033.policyUnresolvedBlocksRequest === true &&
    d033.selfReviewPassed === true &&
    d033.independentReviewPassed === false &&
    d033.ownerCardScheduled === false &&
    d033.ownerReviewAuthorized === false &&
    d033.formalImplementationAuthorized === false &&
    d033.registeredInDecisionLedger === false &&
    d033.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D033_GATE", "D-033", "D-033 未保持三包非标签 AI 确认卡自审完成、D-014 范围、单次绑定/失效、独立复核/Owner/B05/实现待办和未进入权威台账状态", d033);
  }

  const d034Record = latestD034Record(model);
  const d034 = {
    eventId: d034Record?.eventId ?? null,
    decisionState: d034Record?.data?.decisionState ?? null,
    blockerState: d034Record?.data?.d039BlockerState ?? null,
    cardState: d034Record?.data?.cardState ?? null,
    next: d034Record?.data?.next ?? null,
    optionCount: d034Record?.data?.optionCount ?? null,
    recommendedOptionId: d034Record?.data?.recommendedOptionId ?? null,
    budgetDimensionCount: d034Record?.data?.budgetDimensionCount ?? null,
    fixedGlobalCeilings: [
      d034Record?.data?.allProfilesHaveFixedGlobalCeilings,
      d034Record?.data?.providerCanOnlyTighten,
    ].every((value) => value === true),
    failureBoundaryDefined: [
      d034Record?.data?.inputBudgetCheckedBeforeDecode,
      d034Record?.data?.decompressedResponseCounted,
      d034Record?.data?.jsonBudgetEnforcedDuringParse,
      d034Record?.data?.overLimitAbortsAndCleans,
    ].every((value) => value === true),
    deviceBenchmarkRequired: d034Record?.data?.minimumSupportedIphoneBenchmarkRequired ?? null,
    deviceBenchmarkPassed: d034Record?.data?.deviceBenchmarkPassed ?? null,
    selfReviewPassed: [
      d034Record?.data?.productSelfReviewPassed,
      d034Record?.data?.privacySecuritySelfReviewPassed,
      d034Record?.data?.dataIntegritySelfReviewPassed,
      d034Record?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    independentReviewPassed: d034Record?.data?.independentReviewPassed ?? null,
    ownerCardScheduled: d034Record?.data?.ownerCardScheduled ?? null,
    ownerReviewAuthorized: d034Record?.data?.ownerReviewAuthorized ?? null,
    formalImplementationAuthorized: d034Record?.data?.formalImplementationAuthorized ?? null,
    registeredInDecisionLedger: model.decisionRegister.decisions.some((decision) => decision.id === "D-034"),
    ownerResponseCount: model.ownerIntake.responses.filter((response) => response.decisionId === "D-034").length,
  };
  if (!(
    d034.eventId === "EVT-20260817-003" &&
    d034.decisionState === "CANDIDATE" &&
    d034.blockerState === "OPEN" &&
    d034.cardState === "DRAFT_COMPLETE" &&
    d034.next === "D034_DEVICE_BENCHMARK_AND_INDEPENDENT_REVIEW_REQUIRED" &&
    d034.optionCount === 3 &&
    d034.recommendedOptionId === "balanced_fixed_limits" &&
    d034.budgetDimensionCount === 19 &&
    d034.fixedGlobalCeilings === true &&
    d034.failureBoundaryDefined === true &&
    d034.deviceBenchmarkRequired === true &&
    d034.deviceBenchmarkPassed === false &&
    d034.selfReviewPassed === true &&
    d034.independentReviewPassed === false &&
    d034.ownerCardScheduled === false &&
    d034.ownerReviewAuthorized === false &&
    d034.formalImplementationAuthorized === false &&
    d034.registeredInDecisionLedger === false &&
    d034.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D034_GATE", "D-034", "D-034 未保持三包 AI 资源预算卡、19 维硬上限、真机 benchmark 门禁、自审和独立复核/Owner/B05/实现待办状态", d034);
  }

  const d036Record = latestD036Record(model);
  const d036 = {
    eventId: d036Record?.eventId ?? null,
    decisionState: d036Record?.data?.decisionState ?? null,
    blockerState: d036Record?.data?.d039BlockerState ?? null,
    cardState: d036Record?.data?.cardState ?? null,
    next: d036Record?.data?.next ?? null,
    optionCount: d036Record?.data?.optionCount ?? null,
    recommendedOptionId: d036Record?.data?.recommendedOptionId ?? null,
    strictRedirectBoundary: [
      d036Record?.data?.strictProfileRejectsAllRedirects,
      d036Record?.data?.authorizationNeverSentToUnconfirmedOrigin,
    ].every((value) => value === true),
    explicitSessionIsolation: [
      d036Record?.data?.explicitUrlCacheDisabled,
      d036Record?.data?.explicitCookieStorageDisabled,
      d036Record?.data?.explicitCredentialStorageDisabled,
    ].every((value) => value === true) && d036Record?.data?.ephemeralAloneConsideredSufficientIsolation === false,
    providerCompatibilityTargetCount: d036Record?.data?.providerCompatibilityTargetCount ?? null,
    providerCompatibilitySpikePassed: d036Record?.data?.providerCompatibilitySpikePassed ?? null,
    nativeBoundaryEvidencePassed: d036Record?.data?.nativeBoundaryEvidencePassed ?? null,
    realNetworkRequests: d036Record?.data?.realNetworkRequests ?? null,
    selfReviewPassed: [
      d036Record?.data?.productSelfReviewPassed,
      d036Record?.data?.privacySecuritySelfReviewPassed,
      d036Record?.data?.dataIntegritySelfReviewPassed,
      d036Record?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    independentReviewPassed: d036Record?.data?.independentReviewPassed ?? null,
    ownerCardScheduled: d036Record?.data?.ownerCardScheduled ?? null,
    ownerReviewAuthorized: d036Record?.data?.ownerReviewAuthorized ?? null,
    formalImplementationAuthorized: d036Record?.data?.formalImplementationAuthorized ?? null,
    registeredInDecisionLedger: model.decisionRegister.decisions.some((decision) => decision.id === "D-036"),
    ownerResponseCount: model.ownerIntake.responses.filter((response) => response.decisionId === "D-036").length,
  };
  if (!(
    d036.eventId === "EVT-20260820-001" &&
    d036.decisionState === "CANDIDATE" &&
    d036.blockerState === "OPEN" &&
    d036.cardState === "DRAFT_COMPLETE" &&
    d036.next === "D036_PROVIDER_SPIKE_NATIVE_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED" &&
    d036.optionCount === 3 &&
    d036.recommendedOptionId === "strict_ephemeral_no_redirect" &&
    d036.strictRedirectBoundary === true &&
    d036.explicitSessionIsolation === true &&
    d036.providerCompatibilityTargetCount === 3 &&
    d036.providerCompatibilitySpikePassed === false &&
    d036.nativeBoundaryEvidencePassed === false &&
    d036.realNetworkRequests === 0 &&
    d036.selfReviewPassed === true &&
    d036.independentReviewPassed === false &&
    d036.ownerCardScheduled === false &&
    d036.ownerReviewAuthorized === false &&
    d036.formalImplementationAuthorized === false &&
    d036.registeredInDecisionLedger === false &&
    d036.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D036_GATE", "D-036", "D-036 未保持三包 AITransport 隔离卡、显式 session 隔离、三 Provider/原生证据待办、自审和独立复核/Owner/B05/实现未授权状态", d036);
  }

  const d053Record = latestD053Record(model);
  const d053LedgerDecision = model.decisionRegister.decisions.find((decision) => decision.id === "D-053") ?? null;
  const d053 = {
    eventId: d053Record?.eventId ?? null,
    decisionState: d053Record?.data?.decisionState ?? null,
    ledgerDecisionState: d053LedgerDecision?.status ?? null,
    ledgerChoiceKey: d053LedgerDecision?.choiceKey ?? null,
    blockerState: d053Record?.data?.d039BlockerState ?? null,
    cardState: d053Record?.data?.cardState ?? null,
    next: d053Record?.data?.next ?? null,
    optionCount: d053Record?.data?.optionCount ?? null,
    recommendedOptionId: d053Record?.data?.recommendedOptionId ?? null,
    evidenceDimensionCount: d053Record?.data?.evidenceDimensionCount ?? null,
    payloadClassCount: d053Record?.data?.payloadClassCount ?? null,
    nonWaivableBoundary: [
      d053Record?.data?.appleProhibitedUsesOwnerWaivable === false,
      d053Record?.data?.unknownEvidenceCanAuthorize === false,
      d053Record?.data?.localProfileAssertionCountsAsProviderTruth === false,
      d053Record?.data?.generalModelTrainingAllowed === false,
      d053Record?.data?.advertisingMarketingTrackingDataBrokerUseAllowed === false,
      d053Record?.data?.unrelatedHealthDataUseAllowed === false,
    ].every((value) => value === true),
    evidenceReady: [
      d053Record?.data?.oi07Complete,
      d053Record?.data?.providerEvidencePassed,
      d053Record?.data?.appPrivacyMappingSigned,
    ].every((value) => value === true),
    providerAdmissionRecords: d053Record?.data?.providerAdmissionRecords ?? null,
    allProviderPayloadProfiles: d053Record?.data?.allProviderPayloadProfiles ?? null,
    broadConsentOptionOwnerReady: d053Record?.data?.broadConsentOptionCurrentlyOwnerReady ?? null,
    realNetworkRequests: d053Record?.data?.realNetworkRequests ?? null,
    selfReviewPassed: [
      d053Record?.data?.productSelfReviewPassed,
      d053Record?.data?.privacySecuritySelfReviewPassed,
      d053Record?.data?.dataIntegritySelfReviewPassed,
      d053Record?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    independentReviewPassed: d053Record?.data?.independentReviewPassed ?? null,
    ownerCardScheduled: d053Record?.data?.ownerCardScheduled ?? null,
    ownerReviewAuthorized: d053Record?.data?.ownerReviewAuthorized ?? null,
    formalImplementationAuthorized: d053Record?.data?.formalImplementationAuthorized ?? null,
    registeredInDecisionLedger: d053LedgerDecision !== null,
    ownerResponseCount: model.ownerIntake.responses.filter((response) => response.decisionId === "D-053").length,
  };
  if (!(
    d053.eventId === "EVT-20260820-002" &&
    d053.decisionState === "CANDIDATE" &&
    d053.ledgerDecisionState === "CANDIDATE" &&
    d053.ledgerChoiceKey === "pending-owner-choice" &&
    d053.blockerState === "OPEN" &&
    d053.cardState === "DRAFT_COMPLETE" &&
    d053.next === "D053_OI07_POLICY_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED" &&
    d053.optionCount === 3 &&
    d053.recommendedOptionId === "documented_compatible_use_only" &&
    d053.evidenceDimensionCount === 10 &&
    d053.payloadClassCount === 5 &&
    d053.nonWaivableBoundary === true &&
    d053.evidenceReady === false &&
    d053.providerAdmissionRecords === 0 &&
    d053.allProviderPayloadProfiles === "UNKNOWN_BLOCKED" &&
    d053.broadConsentOptionOwnerReady === false &&
    d053.realNetworkRequests === 0 &&
    d053.selfReviewPassed === true &&
    d053.independentReviewPassed === false &&
    d053.ownerCardScheduled === false &&
    d053.ownerReviewAuthorized === false &&
    d053.formalImplementationAuthorized === false &&
    d053.registeredInDecisionLedger === true &&
    d053.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D053_GATE", "D-053", "D-053 未保持三包 Provider 用途准入卡、十维证据、Apple 不可豁免/UNKNOWN 阻断、OI-07/App Privacy/独立复核待办、台账 CANDIDATE 和 Owner/B05/实现未授权状态", d053);
  }

  const d040Record = latestD040Record(model);
  const d040AllocationRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260815-003",
  )?.value ?? null;
  const d040FirstBatchRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260815-004",
  )?.value ?? null;
  const d040EnergyBatchRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260820-003",
  )?.value ?? null;
  const d040DataLifecycleBatchRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260820-004",
  )?.value ?? null;
  const d040ChinaHealthInputRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260820-005",
  )?.value ?? null;
  const d040 = {
    eventId: d040Record?.eventId ?? null,
    decisionState: d040Record?.data?.decisionState ?? null,
    authoritativeState: d040Record?.data?.authoritativeState ?? null,
    next: d040Record?.data?.next ?? null,
    sourceDraftQuestionCount: d040AllocationRecord?.data?.sourceDraftQuestionCount ?? null,
    resolvedDecisionAxisCount: d040AllocationRecord?.data?.resolvedDecisionAxisCount ?? null,
    newlyReservedIdCount: d040AllocationRecord?.data?.newlyReservedIdCount ?? null,
    firstBatchCardCount: d040FirstBatchRecord?.data?.cardCount ?? null,
    energyBatchCardCount: d040EnergyBatchRecord?.data?.cardCount ?? null,
    dataLifecycleBatchCardCount: d040DataLifecycleBatchRecord?.data?.cardCount ?? null,
    draftedCardCount: d040DataLifecycleBatchRecord?.data?.draftedCardCount ?? null,
    firstBatchSelfReviewPassed: [
      d040FirstBatchRecord?.data?.productSelfReviewPassed,
      d040FirstBatchRecord?.data?.healthEvidenceSelfReviewPassed,
      d040FirstBatchRecord?.data?.privacySelfReviewPassed,
      d040FirstBatchRecord?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    energyBatchSelfReviewPassed: [
      d040EnergyBatchRecord?.data?.productSelfReviewPassed,
      d040EnergyBatchRecord?.data?.healthEvidenceSelfReviewPassed,
      d040EnergyBatchRecord?.data?.privacySelfReviewPassed,
      d040EnergyBatchRecord?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    dataLifecycleBatchSelfReviewPassed: [
      d040DataLifecycleBatchRecord?.data?.productSelfReviewPassed,
      d040DataLifecycleBatchRecord?.data?.privacySecuritySelfReviewPassed,
      d040DataLifecycleBatchRecord?.data?.dataIntegritySelfReviewPassed,
      d040DataLifecycleBatchRecord?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    modelOutputNamesPreserved: d040EnergyBatchRecord?.data?.modelOutputNamesPreserved ?? null,
    reeToDailyTargetStrategyAuthorized: d040EnergyBatchRecord?.data?.reeToDailyTargetStrategyAuthorized ?? null,
    silentDefaultPalAllowed: d040EnergyBatchRecord?.data?.silentDefaultPalAllowed ?? null,
    dynamicModelEvidencePassed: d040EnergyBatchRecord?.data?.dynamicModelEvidencePassed ?? null,
    dynamicModelOptionOwnerReady: d040EnergyBatchRecord?.data?.dynamicModelOptionCurrentlyOwnerReady ?? null,
    firstBatchIndependentReviewPassed: d040EnergyBatchRecord?.data?.firstBatchIndependentReviewPassed ?? null,
    dataLayerCount: d040DataLifecycleBatchRecord?.data?.dataLayerCount ?? null,
    formulaInputDoesNotImplyPersistence: d040DataLifecycleBatchRecord?.data?.formulaInputDoesNotImplyPersistence ?? null,
    rawAndDisplaySeparated: d040DataLifecycleBatchRecord?.data?.rawAndDisplaySeparated ?? null,
    chainedRoundingAllowed: d040DataLifecycleBatchRecord?.data?.chainedRoundingAllowed ?? null,
    deletionCanSilentlyDeleteIndependentHistory: d040DataLifecycleBatchRecord?.data?.currentProfileDeletionCanSilentlyDeleteIndependentHistory ?? null,
    automaticCandidateCanBecomeEffectiveWithoutConfirmation: d040DataLifecycleBatchRecord?.data?.automaticCandidateCanBecomeEffectiveWithoutConfirmation ?? null,
    historicalDiaryRecalculationAllowed: d040DataLifecycleBatchRecord?.data?.historicalDiaryRecalculationAllowed ?? null,
    firstTwoBatchesIndependentReviewPassed: d040DataLifecycleBatchRecord?.data?.firstTwoBatchesIndependentReviewPassed ?? null,
    chinaSupportInputState: d040ChinaHealthInputRecord?.data?.inputState ?? null,
    chinaOfficialSourceCheckComplete: d040ChinaHealthInputRecord?.data?.officialSourceCheckComplete ?? null,
    chinaSupportTermCount: d040ChinaHealthInputRecord?.data?.supportTermCount ?? null,
    chinaCopyContextCount: d040ChinaHealthInputRecord?.data?.copyContextCount ?? null,
    psychologicalHotlinePresentedAsMedicalEmergencyReplacement: d040ChinaHealthInputRecord?.data?.psychologicalHotlinePresentedAsMedicalEmergencyReplacement ?? null,
    maximumRoutineReviewIntervalDays: d040ChinaHealthInputRecord?.data?.maximumRoutineReviewIntervalDays ?? null,
    healthReviewerAssigned: d040ChinaHealthInputRecord?.data?.healthReviewerAssigned ?? null,
    healthContentApproved: d040ChinaHealthInputRecord?.data?.healthContentApproved ?? null,
    contentQaPassed: d040ChinaHealthInputRecord?.data?.contentQaPassed ?? null,
    d068OwnerReady: d040ChinaHealthInputRecord?.data?.d068OwnerReady ?? null,
    d069OwnerReady: d040ChinaHealthInputRecord?.data?.d069OwnerReady ?? null,
    firstThreeBatchesIndependentReviewPassed: d040ChinaHealthInputRecord?.data?.firstThreeBatchesIndependentReviewPassed ?? null,
    formulaEvidenceReviewComplete: d040FirstBatchRecord?.data?.formulaEvidenceReviewComplete ?? null,
    firstBatchOwnerReviewAuthorized: d040FirstBatchRecord?.data?.ownerReviewAuthorized ?? null,
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
    d040.eventId === "EVT-20260820-005" &&
    d040.next === "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED" &&
    d040.sourceDraftQuestionCount === 17 &&
    d040.resolvedDecisionAxisCount === 20 &&
    d040.newlyReservedIdCount === 19 &&
    d040.firstBatchCardCount === 4 &&
    d040.energyBatchCardCount === 5 &&
    d040.dataLifecycleBatchCardCount === 4 &&
    d040.draftedCardCount === 13 &&
    d040.firstBatchSelfReviewPassed === true &&
    d040.energyBatchSelfReviewPassed === true &&
    d040.dataLifecycleBatchSelfReviewPassed === true &&
    d040.modelOutputNamesPreserved === true &&
    d040.reeToDailyTargetStrategyAuthorized === false &&
    d040.silentDefaultPalAllowed === false &&
    d040.dynamicModelEvidencePassed === false &&
    d040.dynamicModelOptionOwnerReady === false &&
    d040.firstBatchIndependentReviewPassed === false &&
    d040.dataLayerCount === 4 &&
    d040.formulaInputDoesNotImplyPersistence === true &&
    d040.rawAndDisplaySeparated === true &&
    d040.chainedRoundingAllowed === false &&
    d040.deletionCanSilentlyDeleteIndependentHistory === false &&
    d040.automaticCandidateCanBecomeEffectiveWithoutConfirmation === false &&
    d040.historicalDiaryRecalculationAllowed === false &&
    d040.firstTwoBatchesIndependentReviewPassed === false &&
    d040.chinaSupportInputState === "DRAFT_COMPLETE" &&
    d040.chinaOfficialSourceCheckComplete === true &&
    d040.chinaSupportTermCount === 4 &&
    d040.chinaCopyContextCount === 6 &&
    d040.psychologicalHotlinePresentedAsMedicalEmergencyReplacement === false &&
    d040.maximumRoutineReviewIntervalDays === 90 &&
    d040.healthReviewerAssigned === false &&
    d040.healthContentApproved === false &&
    d040.contentQaPassed === false &&
    d040.d068OwnerReady === false &&
    d040.d069OwnerReady === false &&
    d040.firstThreeBatchesIndependentReviewPassed === false &&
    d040.formulaEvidenceReviewComplete === true &&
    d040.firstBatchOwnerReviewAuthorized === false &&
    d040.ownerCardScheduled === false &&
    d040AuthorizationClosed
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D040_GATE", "D-040", "D-040 未保持 20 轴分解、前三批十三卡自审、动态模型/生命周期边界、中国支持草案与具名健康评审缺口、独立复核待办、PX-0 输入缺口和六项授权位关闭状态", d040);
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
    d031,
    d033,
    d034,
    d036,
    d053,
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
