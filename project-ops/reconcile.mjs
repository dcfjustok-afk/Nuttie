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

function latestD039B03B05ReviewPacket(model) {
  return model.events
    .filter((record) => [
      "D039-B03-B05-INDEPENDENT-REVIEW-PACKET-001",
      "D039-B03-B05-INPUT-MANIFEST-001",
    ].includes(record.value?.subject?.id))
    .sort((left, right) =>
      (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0),
    )
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

function latestD034BenchmarkProtocolRecord(model) {
  return model.events
    .filter(
      (record) => record.value?.subject?.id === "D034-MINIMUM-IPHONE-BENCHMARK-PROTOCOL-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD036Record(model) {
  return model.events
    .filter((record) => record.value?.subject?.id === "D036-AI-TRANSPORT-PROFILE-CARD-001")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD036CompatibilityProtocolRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D036-PROVIDER-NATIVE-COMPATIBILITY-SPIKE-PROTOCOL-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD036CompatibilityReportContractRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D036-PROVIDER-NATIVE-COMPATIBILITY-REPORT-CONTRACT-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD036CompatibilityReportHarnessRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D036-PROVIDER-NATIVE-COMPATIBILITY-REPORT-HARNESS-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD053Record(model) {
  return model.events
    .filter((record) => record.value?.subject?.id === "D053-AI-PROVIDER-USE-ADMISSION-CARD-001")
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD053EvidenceProtocolRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D053-PROVIDER-EVIDENCE-APP-PRIVACY-PROTOCOL-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD053EvidenceReportContractRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D053-PROVIDER-EVIDENCE-APP-PRIVACY-REPORT-CONTRACT-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD053EvidenceReportHarnessRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D053-PROVIDER-EVIDENCE-APP-PRIVACY-REPORT-HARNESS-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestOi07ProviderTargetTemplateRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "OI07-PROVIDER-TARGET-INTAKE-TEMPLATE-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestOi07ProviderTargetHarnessRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "OI07-PROVIDER-TARGET-INTAKE-HARNESS-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD034CorpusManifestHarnessRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D034-BENCHMARK-CORPUS-MANIFEST-HARNESS-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD034RunReportContractRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D034-BENCHMARK-RUN-REPORT-CONTRACT-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD034RunReportHarnessRecord(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D034-BENCHMARK-RUN-REPORT-HARNESS-001",
    )
    .sort((left, right) => (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0))
    .at(-1)?.value ?? null;
}

function latestD039IndependentReviewRecordHarness(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id ===
        "D039-B03-B05-INDEPENDENT-REVIEW-RECORD-HARNESS-001",
    )
    .sort((left, right) =>
      (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0),
    )
    .at(-1)?.value ?? null;
}

function latestD040ChinaHealthReviewRecordHarness(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D040-CHINA-HEALTH-REVIEW-RECORD-HARNESS-001",
    )
    .sort((left, right) =>
      (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0),
    )
    .at(-1)?.value ?? null;
}

function latestD040FirstThreeBatchesIndependentReviewRecordHarness(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id ===
        "D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-RECORD-HARNESS-001",
    )
    .sort((left, right) =>
      (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0),
    )
    .at(-1)?.value ?? null;
}

function latestD040MacroAxisIndependentReviewRecordHarness(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id ===
        "D040-MACRO-AXIS-INDEPENDENT-REVIEW-RECORD-HARNESS-001",
    )
    .sort((left, right) =>
      (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0),
    )
    .at(-1)?.value ?? null;
}

function latestD040NiddkLicenseRoutingEvidence(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D040-NIDDK-LICENSE-ROUTING-EVIDENCE-001",
    )
    .sort((left, right) =>
      (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0),
    )
    .at(-1)?.value ?? null;
}

function latestD040NiddkLicenseClarificationTemplate(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D040-NIDDK-LICENSE-CLARIFICATION-TEMPLATE-001",
    )
    .sort((left, right) =>
      (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0),
    )
    .at(-1)?.value ?? null;
}

function latestD040NiddkLegacyReferenceAudit(model) {
  return model.events
    .filter(
      (record) =>
        record.value?.subject?.id === "D040-NIDDK-LEGACY-REFERENCE-AUDIT-001",
    )
    .sort((left, right) =>
      (parseTime(left.value.recordedAt) ?? 0) - (parseTime(right.value.recordedAt) ?? 0),
    )
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
        subjectId === "D040-CHINA-MACRONUTRIENT-STANDARD-INPUT-001" ||
        subjectId === "D040-NIDDK-DYNAMIC-MODEL-FEASIBILITY-INPUT-001" ||
        subjectId === "D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001" ||
        subjectId === "D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-PACKET-001" ||
        subjectId === "D040-MACRO-TARGET-SOURCE-CARD-SPEC-001" ||
        subjectId === "D040-CUSTOM-MACRO-INPUT-SHAPE-CARD-SPEC-001" ||
        subjectId === "D040-MACRO-DISPLAY-ROUNDING-CARD-SPEC-001" ||
        subjectId === "D040-HARD-STOP-RECORD-AVAILABILITY-CARD-SPEC-001" ||
        subjectId === "D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001" ||
        subjectId === "D040-MACRO-AXIS-INPUT-MANIFEST-001" ||
        subjectId === "D040-D068-D069-NON-DIAGNOSTIC-BOUNDARY-CARD-SPEC-001" ||
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
  const d039B03B05ReviewPacket = latestD039B03B05ReviewPacket(model);
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
    b03B05ReviewPacketEventId: d039B03B05ReviewPacket?.eventId ?? null,
    b03B05ReviewPacketReady: d039B03B05ReviewPacket?.data?.reviewPacketReady ?? null,
    b03B05ReviewPacketVersion: d039B03B05ReviewPacket?.data?.reviewPacketVersion ?? null,
    b03B05InputManifestFrozen: d039B03B05ReviewPacket?.data?.inputManifestFrozen ?? null,
    b03B05InputManifestEntryCount: d039B03B05ReviewPacket?.data?.manifestEntryCount ?? null,
    b03B05InputManifestCommit: d039B03B05ReviewPacket?.data?.manifestCommit ?? null,
    b03B05InputManifestRecordCommit:
      d039B03B05ReviewPacket?.data?.manifestRecordCommit ?? null,
    b03B05InputManifestGitBlobOidAlgorithm:
      d039B03B05ReviewPacket?.data?.gitBlobOidAlgorithm ?? null,
    b03B05InputManifestCanonicalDigestAlgorithm:
      d039B03B05ReviewPacket?.data?.canonicalDigestAlgorithm ?? null,
    b03B05InputManifestUsesRawGitBlobBytes:
      d039B03B05ReviewPacket?.data?.rawGitBlobBytesUsed ?? null,
    b03B05InputManifestFrozenArtifactRefs:
      d039B03B05ReviewPacket?.data?.frozenArtifactRefs ?? [],
    b03B05InputManifestSourcePacketEventId:
      d039B03B05ReviewPacket?.data?.sourcePacketCreationEventId ?? null,
    b03B05RequiredArtifactCount: d039B03B05ReviewPacket?.data?.requiredArtifactCount ?? null,
    b03B05RequiredCardCount: d039B03B05ReviewPacket?.data?.requiredCardCount ?? null,
    b03B05RequiredBlockerCount: d039B03B05ReviewPacket?.data?.requiredBlockerCount ?? null,
    b03B05BlockerIds: d039B03B05ReviewPacket?.data?.blockerIds ?? [],
    b03B05CardDecisionIds: d039B03B05ReviewPacket?.data?.cardDecisionIds ?? [],
    b03B05RequiredReviewerDomainCount:
      d039B03B05ReviewPacket?.data?.requiredReviewerDomainCount ?? null,
    b03B05ReviewerDomainIds: d039B03B05ReviewPacket?.data?.reviewerDomainIds ?? [],
    b03B05RequiredCrossCardInvariantCount:
      d039B03B05ReviewPacket?.data?.requiredCrossCardInvariantCount ?? null,
    b03B05AllowedCardDispositionCount:
      d039B03B05ReviewPacket?.data?.allowedCardDispositionCount ?? null,
    b03B05BlockingSeverityIds: d039B03B05ReviewPacket?.data?.blockingSeverityIds ?? [],
    b03B05NonBlockingSeverityId: d039B03B05ReviewPacket?.data?.nonBlockingSeverityId ?? null,
    b03B05NamedReviewerRequired: d039B03B05ReviewPacket?.data?.namedReviewerRequired ?? null,
    b03B05AuthorOrPmCanSelfApprove:
      d039B03B05ReviewPacket?.data?.authorOrPmCanSelfApprove ?? null,
    b03B05AiOrAgentCanBeIndependentReviewer:
      d039B03B05ReviewPacket?.data?.aiOrAgentCanBeIndependentReviewer ?? null,
    b03B05ExternalMessageSent: d039B03B05ReviewPacket?.data?.externalMessageSent ?? null,
    b03B05ReviewersAssigned: d039B03B05ReviewPacket?.data?.reviewersAssigned ?? null,
    b03B05ReviewerIdentityVerified:
      d039B03B05ReviewPacket?.data?.reviewerIdentityVerified ?? null,
    b03B05ReviewerIndependenceVerified:
      d039B03B05ReviewPacket?.data?.reviewerIndependenceVerified ?? null,
    b03B05ConflictOfInterestResolved:
      d039B03B05ReviewPacket?.data?.conflictOfInterestResolved ?? null,
    b03B05IndependentReviewStarted:
      d039B03B05ReviewPacket?.data?.independentReviewStarted ?? null,
    b03B05IndependentReviewPassed:
      d039B03B05ReviewPacket?.data?.independentReviewPassed ?? null,
    b03B05CurrentFindingCountsMeasured:
      d039B03B05ReviewPacket?.data?.currentFindingCountsMeasured ?? null,
    d034DeviceBenchmarkPassed: d039B03B05ReviewPacket?.data?.d034DeviceBenchmarkPassed ?? null,
    d036Oi07InputComplete: d039B03B05ReviewPacket?.data?.d036Oi07InputComplete ?? null,
    d036ProviderCompatibilitySpikePassed:
      d039B03B05ReviewPacket?.data?.d036ProviderCompatibilitySpikePassed ?? null,
    d036NativeBoundaryEvidencePassed:
      d039B03B05ReviewPacket?.data?.d036NativeBoundaryEvidencePassed ?? null,
    d053Oi07EvidenceComplete: d039B03B05ReviewPacket?.data?.d053Oi07EvidenceComplete ?? null,
    d053ProviderEvidenceReady: d039B03B05ReviewPacket?.data?.d053ProviderEvidenceReady ?? null,
    d053AppPrivacyMappingApproved:
      d039B03B05ReviewPacket?.data?.d053AppPrivacyMappingApproved ?? null,
    b03Closed: d039B03B05ReviewPacket?.data?.b03Closed ?? null,
    b04Closed: d039B03B05ReviewPacket?.data?.b04Closed ?? null,
    b05Closed: d039B03B05ReviewPacket?.data?.b05Closed ?? null,
    b03B05OwnerIntakeChanged: d039B03B05ReviewPacket?.data?.ownerIntakeChanged ?? null,
    b03B05OwnerCardsScheduled: d039B03B05ReviewPacket?.data?.ownerCardsScheduled ?? null,
    b03B05OwnerReviewAuthorized: d039B03B05ReviewPacket?.data?.ownerReviewAuthorized ?? null,
    b03B05OwnerChoiceRecorded: d039B03B05ReviewPacket?.data?.ownerChoiceRecorded ?? null,
    b03B05DecisionAcceptedRecorded:
      d039B03B05ReviewPacket?.data?.decisionAcceptedRecorded ?? null,
    d032SecondOwnerActionSatisfied:
      d039B03B05ReviewPacket?.data?.d032SecondOwnerActionSatisfied ?? null,
    b03B05FormalRootProjectAuthorized:
      d039B03B05ReviewPacket?.data?.formalRootProjectAuthorized ?? null,
    b03B05NativeIosWorkAuthorized:
      d039B03B05ReviewPacket?.data?.nativeIosWorkAuthorized ?? null,
    b03B05FormalImplementationAuthorized:
      d039B03B05ReviewPacket?.data?.formalImplementationAuthorized ?? null,
    b03B05Px5ImplementationDorSatisfied:
      d039B03B05ReviewPacket?.data?.px5ImplementationDorSatisfied ?? null,
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
    d039.formalImplementationAuthorized === false &&
    d039.b03B05ReviewPacketEventId === "EVT-20260821-009" &&
    d039.b03B05ReviewPacketReady === true &&
    d039.b03B05ReviewPacketVersion === "PACKET-001-R1" &&
    d039.b03B05InputManifestFrozen === true &&
    d039.b03B05InputManifestEntryCount === 10 &&
    d039.b03B05InputManifestCommit === "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117" &&
    d039.b03B05InputManifestRecordCommit === "19f2119abcd8ca25bf59b177910a5af1f34e9abb" &&
    d039.b03B05InputManifestGitBlobOidAlgorithm === "SHA-1" &&
    d039.b03B05InputManifestCanonicalDigestAlgorithm === "SHA-256" &&
    d039.b03B05InputManifestUsesRawGitBlobBytes === true &&
    d039.b03B05InputManifestFrozenArtifactRefs.length === 10 &&
    d039.b03B05InputManifestSourcePacketEventId === "EVT-20260821-008" &&
    d039.b03B05RequiredArtifactCount === 10 &&
    d039.b03B05RequiredCardCount === 6 &&
    d039.b03B05RequiredBlockerCount === 3 &&
    JSON.stringify(d039.b03B05BlockerIds) ===
      JSON.stringify(["D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05"]) &&
    JSON.stringify(d039.b03B05CardDecisionIds) ===
      JSON.stringify(["D-045", "D-031", "D-033", "D-034", "D-036", "D-053"]) &&
    d039.b03B05RequiredReviewerDomainCount === 4 &&
    JSON.stringify(d039.b03B05ReviewerDomainIds) === JSON.stringify([
      "PRODUCT_DECISION_QUALITY",
      "PRIVACY_DATA_INTEGRITY",
      "SECURITY_TRANSPORT_RESOURCE_EVIDENCE",
      "QA_ACCESSIBILITY",
    ]) &&
    d039.b03B05RequiredCrossCardInvariantCount === 16 &&
    d039.b03B05AllowedCardDispositionCount === 4 &&
    JSON.stringify(d039.b03B05BlockingSeverityIds) === JSON.stringify(["P0", "P1", "P2"]) &&
    d039.b03B05NonBlockingSeverityId === "P3" &&
    d039.b03B05NamedReviewerRequired === true &&
    d039.b03B05AuthorOrPmCanSelfApprove === false &&
    d039.b03B05AiOrAgentCanBeIndependentReviewer === false &&
    d039.b03B05ExternalMessageSent === false &&
    d039.b03B05ReviewersAssigned === false &&
    d039.b03B05ReviewerIdentityVerified === false &&
    d039.b03B05ReviewerIndependenceVerified === false &&
    d039.b03B05ConflictOfInterestResolved === false &&
    d039.b03B05IndependentReviewStarted === false &&
    d039.b03B05IndependentReviewPassed === false &&
    d039.b03B05CurrentFindingCountsMeasured === false &&
    d039.d034DeviceBenchmarkPassed === false &&
    d039.d036Oi07InputComplete === false &&
    d039.d036ProviderCompatibilitySpikePassed === false &&
    d039.d036NativeBoundaryEvidencePassed === false &&
    d039.d053Oi07EvidenceComplete === false &&
    d039.d053ProviderEvidenceReady === false &&
    d039.d053AppPrivacyMappingApproved === false &&
    d039.b03Closed === false &&
    d039.b04Closed === false &&
    d039.b05Closed === false &&
    d039.b03B05OwnerIntakeChanged === false &&
    d039.b03B05OwnerCardsScheduled === false &&
    d039.b03B05OwnerReviewAuthorized === false &&
    d039.b03B05OwnerChoiceRecorded === false &&
    d039.b03B05DecisionAcceptedRecorded === false &&
    d039.d032SecondOwnerActionSatisfied === false &&
    d039.b03B05FormalRootProjectAuthorized === false &&
    d039.b03B05NativeIosWorkAuthorized === false &&
    d039.b03B05FormalImplementationAuthorized === false &&
    d039.b03B05Px5ImplementationDorSatisfied === false
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D039_GATE", "D-039", "D-039 未保持 PX-4、PX-5 NOT_READY、B01/B02 关闭、B03~B05 六卡复核包及 10 项输入冻结就绪且复核/证据/Owner/实现门禁关闭状态", d039);
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
  const d034BenchmarkProtocolRecord = latestD034BenchmarkProtocolRecord(model);
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
    benchmarkProtocolEventId: d034BenchmarkProtocolRecord?.eventId ?? null,
    benchmarkProtocolState: d034BenchmarkProtocolRecord?.data?.protocolState ?? null,
    benchmarkProtocolNext: d034BenchmarkProtocolRecord?.data?.next ?? null,
    benchmarkSourcePacketVersion: d034BenchmarkProtocolRecord?.data?.sourcePacketVersion ?? null,
    benchmarkSourceCardInputFrozen:
      d034BenchmarkProtocolRecord?.data?.sourceCardInputFrozen ?? null,
    benchmarkSourceCardCommit: d034BenchmarkProtocolRecord?.data?.sourceCardCommit ?? null,
    benchmarkProtocolArtifactCommit:
      d034BenchmarkProtocolRecord?.data?.protocolArtifactCommit ?? null,
    benchmarkProfileCount: d034BenchmarkProtocolRecord?.data?.profileCount ?? null,
    benchmarkProfileMatrixRowCount:
      d034BenchmarkProtocolRecord?.data?.profileMatrixRowCount ?? null,
    benchmarkDirectHardLimitCount:
      d034BenchmarkProtocolRecord?.data?.directHardLimitCount ?? null,
    benchmarkCompanionControlCount:
      d034BenchmarkProtocolRecord?.data?.companionControlCount ?? null,
    benchmarkDirectLimitScenarioMinimum:
      d034BenchmarkProtocolRecord?.data?.directLimitScenarioMinimum ?? null,
    benchmarkMeasuredRepetitionMinimum:
      d034BenchmarkProtocolRecord?.data?.measuredRepetitionMinimum ?? null,
    benchmarkSameCorpusAcrossProfilesRequired:
      d034BenchmarkProtocolRecord?.data?.sameCorpusAcrossProfilesRequired ?? null,
    benchmarkRawRunValuesRequired:
      d034BenchmarkProtocolRecord?.data?.rawRunValuesRequired ?? null,
    minimumPhysicalDeviceResolved:
      d034BenchmarkProtocolRecord?.data?.minimumPhysicalDeviceResolved ?? null,
    macAndSupportedXcodeAvailable:
      d034BenchmarkProtocolRecord?.data?.macAndSupportedXcodeAvailable ?? null,
    isolatedNativeHarnessAuthorized:
      d034BenchmarkProtocolRecord?.data?.isolatedNativeHarnessAuthorized ?? null,
    benchmarkCorpusMaterialized:
      d034BenchmarkProtocolRecord?.data?.corpusMaterialized ?? null,
    benchmarkExecutionStarted:
      d034BenchmarkProtocolRecord?.data?.benchmarkExecutionStarted ?? null,
    benchmarkResultRecorded:
      d034BenchmarkProtocolRecord?.data?.benchmarkResultRecorded ?? null,
    benchmarkProtocolDevicePassed:
      d034BenchmarkProtocolRecord?.data?.deviceBenchmarkPassed ?? null,
    benchmarkNamedSecurityReviewerAssigned:
      d034BenchmarkProtocolRecord?.data?.namedSecurityReviewerAssigned ?? null,
    benchmarkNamedQaReviewerAssigned:
      d034BenchmarkProtocolRecord?.data?.namedQaReviewerAssigned ?? null,
    benchmarkProtocolIndependentReviewPassed:
      d034BenchmarkProtocolRecord?.data?.independentReviewPassed ?? null,
    benchmarkExternalMessageSent:
      d034BenchmarkProtocolRecord?.data?.externalMessageSent ?? null,
    benchmarkProtocolOwnerReviewAuthorized:
      d034BenchmarkProtocolRecord?.data?.ownerReviewAuthorized ?? null,
    benchmarkB05Closed: d034BenchmarkProtocolRecord?.data?.b05Closed ?? null,
    benchmarkProtocolFormalImplementationAuthorized:
      d034BenchmarkProtocolRecord?.data?.formalImplementationAuthorized ?? null,
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
    d034.benchmarkProtocolEventId === "EVT-20260821-010" &&
    d034.benchmarkProtocolState === "PROTOCOL_READY" &&
    d034.benchmarkProtocolNext === "D034_BENCHMARK_AUTHORIZATION_DEVICE_AND_TOOLCHAIN_REQUIRED" &&
    d034.benchmarkSourcePacketVersion === "PACKET-001-R1" &&
    d034.benchmarkSourceCardInputFrozen === true &&
    d034.benchmarkSourceCardCommit === "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117" &&
    d034.benchmarkProtocolArtifactCommit === "f2084a106d7a8e4c4a612278fb13372c747fa622" &&
    d034.benchmarkProfileCount === 3 &&
    d034.benchmarkProfileMatrixRowCount === 21 &&
    d034.benchmarkDirectHardLimitCount === 19 &&
    d034.benchmarkCompanionControlCount === 2 &&
    d034.benchmarkDirectLimitScenarioMinimum === 38 &&
    d034.benchmarkMeasuredRepetitionMinimum === 10 &&
    d034.benchmarkSameCorpusAcrossProfilesRequired === true &&
    d034.benchmarkRawRunValuesRequired === true &&
    d034.minimumPhysicalDeviceResolved === false &&
    d034.macAndSupportedXcodeAvailable === false &&
    d034.isolatedNativeHarnessAuthorized === false &&
    d034.benchmarkCorpusMaterialized === false &&
    d034.benchmarkExecutionStarted === false &&
    d034.benchmarkResultRecorded === false &&
    d034.benchmarkProtocolDevicePassed === false &&
    d034.benchmarkNamedSecurityReviewerAssigned === false &&
    d034.benchmarkNamedQaReviewerAssigned === false &&
    d034.benchmarkProtocolIndependentReviewPassed === false &&
    d034.benchmarkExternalMessageSent === false &&
    d034.benchmarkProtocolOwnerReviewAuthorized === false &&
    d034.benchmarkB05Closed === false &&
    d034.benchmarkProtocolFormalImplementationAuthorized === false &&
    d034.registeredInDecisionLedger === false &&
    d034.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D034_GATE", "D-034", "D-034 未保持三包资源预算卡、21 行/19 项直接上限 benchmark 协议，以及设备/工具链/harness/执行/复核/Owner/B05/实现待办状态", d034);
  }

  const d036Record = latestD036Record(model);
  const d036ProtocolRecord = latestD036CompatibilityProtocolRecord(model);
  const d036ReportContractRecord = latestD036CompatibilityReportContractRecord(model);
  const d036ReportHarnessRecord = latestD036CompatibilityReportHarnessRecord(model);
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
    protocolEventId: d036ProtocolRecord?.eventId ?? null,
    protocolState: d036ProtocolRecord?.data?.protocolState ?? null,
    protocolNext: d036ProtocolRecord?.data?.next ?? null,
    protocolSourcePacketVersion: d036ProtocolRecord?.data?.sourcePacketVersion ?? null,
    protocolSourceCardInputFrozen: d036ProtocolRecord?.data?.sourceCardInputFrozen ?? null,
    protocolArtifactCommit: d036ProtocolRecord?.data?.protocolArtifactCommit ?? null,
    protocolProviderTargetCount: d036ProtocolRecord?.data?.providerTargetCount ?? null,
    protocolCandidateProfileCount: d036ProtocolRecord?.data?.candidateProfileCount ?? null,
    protocolRequiredCompatibilityCellCount:
      d036ProtocolRecord?.data?.requiredCompatibilityCellCount ?? null,
    protocolNativeBoundarySurfaceCount:
      d036ProtocolRecord?.data?.nativeBoundarySurfaceCount ?? null,
    protocolOfflineRepetitionMinimum:
      d036ProtocolRecord?.data?.offlineMeasuredRepetitionMinimum ?? null,
    protocolProviderPathRepetitionMinimum:
      d036ProtocolRecord?.data?.providerCellPathRepetitionMinimum ?? null,
    protocolOi07Complete: d036ProtocolRecord?.data?.oi07Complete ?? null,
    protocolProviderTargetsResolved: d036ProtocolRecord?.data?.providerTargetsResolved ?? null,
    protocolMacAvailable: d036ProtocolRecord?.data?.macAndSupportedXcodeAvailable ?? null,
    protocolHarnessAuthorized: d036ProtocolRecord?.data?.isolatedNativeHarnessAuthorized ?? null,
    protocolNetworkSpikeAuthorized: d036ProtocolRecord?.data?.realNetworkSpikeAuthorized ?? null,
    protocolExecutionStarted: d036ProtocolRecord?.data?.spikeExecutionStarted ?? null,
    protocolCompatibilityPassed:
      d036ProtocolRecord?.data?.providerCompatibilitySpikePassed ?? null,
    protocolNativeEvidencePassed: d036ProtocolRecord?.data?.nativeBoundaryEvidencePassed ?? null,
    protocolIndependentReviewPassed: d036ProtocolRecord?.data?.independentReviewPassed ?? null,
    protocolOwnerReviewAuthorized: d036ProtocolRecord?.data?.ownerReviewAuthorized ?? null,
    protocolB05Closed: d036ProtocolRecord?.data?.b05Closed ?? null,
    protocolRealNetworkAuthorized: d036ProtocolRecord?.data?.realNetworkAuthorized ?? null,
    protocolFormalImplementationAuthorized:
      d036ProtocolRecord?.data?.formalImplementationAuthorized ?? null,
    reportContractEventId: d036ReportContractRecord?.eventId ?? null,
    reportContractStatus: d036ReportContractRecord?.data?.contractStatus ?? null,
    reportContractArtifactCommit:
      d036ReportContractRecord?.data?.contractArtifactCommit ?? null,
    reportContractRequiredCompatibilityCellCount:
      d036ReportContractRecord?.data?.requiredCompatibilityCellCount ?? null,
    reportContractRequiredFormalAttemptMinimum:
      d036ReportContractRecord?.data?.requiredFormalAttemptMinimum ?? null,
    reportContractRequiredFormalOfflineResultCount:
      d036ReportContractRecord?.data?.requiredFormalOfflineResultCount ?? null,
    reportContractRequiredFormalNativeBoundaryResultCount:
      d036ReportContractRecord?.data?.requiredFormalNativeBoundaryResultCount ?? null,
    reportContractValidatorImplemented:
      d036ReportContractRecord?.data?.reportValidatorImplemented ?? null,
    reportContractAttemptRecordCount:
      d036ReportContractRecord?.data?.attemptRecordCount ?? null,
    reportContractCompatibilityReportRecorded:
      d036ReportContractRecord?.data?.compatibilityReportRecorded ?? null,
    reportContractNativeBoundaryEvidenceRecorded:
      d036ReportContractRecord?.data?.nativeBoundaryEvidenceRecorded ?? null,
    reportHarnessEventId: d036ReportHarnessRecord?.eventId ?? null,
    reportHarnessStatus: d036ReportHarnessRecord?.data?.contractStatus ?? null,
    reportHarnessArtifactState: d036ReportHarnessRecord?.data?.artifactState ?? null,
    reportHarnessArtifactCommitRecorded:
      d036ReportHarnessRecord?.data?.artifactCommitRecorded ?? null,
    reportHarnessTopLevelTests: d036ReportHarnessRecord?.data?.topLevelTests ?? null,
    reportHarnessToolSuitePassed: d036ReportHarnessRecord?.data?.toolSuitePassed ?? null,
    reportHarnessRequiredCompatibilityCellCount:
      d036ReportHarnessRecord?.data?.requiredCompatibilityCellCount ?? null,
    reportHarnessRequiredFormalAttemptMinimum:
      d036ReportHarnessRecord?.data?.requiredFormalAttemptMinimum ?? null,
    reportHarnessRequiredFormalOfflineResultCount:
      d036ReportHarnessRecord?.data?.requiredFormalOfflineResultCount ?? null,
    reportHarnessRequiredFormalNativeBoundaryResultCount:
      d036ReportHarnessRecord?.data?.requiredFormalNativeBoundaryResultCount ?? null,
    reportHarnessContractValidatorImplemented:
      d036ReportHarnessRecord?.data?.contractValidatorImplemented ?? null,
    reportHarnessOi07Reads: d036ReportHarnessRecord?.data?.oi07Reads ?? null,
    reportHarnessProviderDocumentReads:
      d036ReportHarnessRecord?.data?.providerDocumentReads ?? null,
    reportHarnessAttemptRecordReads:
      d036ReportHarnessRecord?.data?.attemptRecordReads ?? null,
    reportHarnessAttemptRecordWrites:
      d036ReportHarnessRecord?.data?.attemptRecordWrites ?? null,
    reportHarnessNetworkRequests: d036ReportHarnessRecord?.data?.networkRequests ?? null,
    reportHarnessProviderRequests: d036ReportHarnessRecord?.data?.providerRequests ?? null,
    reportHarnessAttemptRecordCount:
      d036ReportHarnessRecord?.data?.attemptRecordCount ?? null,
    reportHarnessCompatibilityReportRecorded:
      d036ReportHarnessRecord?.data?.compatibilityReportRecorded ?? null,
    reportHarnessNativeBoundaryEvidenceRecorded:
      d036ReportHarnessRecord?.data?.nativeBoundaryEvidenceRecorded ?? null,
    reportHarnessExecutionStarted:
      d036ReportHarnessRecord?.data?.spikeExecutionStarted ?? null,
    reportHarnessCompatibilityPassed:
      d036ReportHarnessRecord?.data?.providerCompatibilitySpikePassed ?? null,
    reportHarnessNativeEvidencePassed:
      d036ReportHarnessRecord?.data?.nativeBoundaryEvidencePassed ?? null,
    reportHarnessIndependentReviewPassed:
      d036ReportHarnessRecord?.data?.independentReviewPassed ?? null,
    reportHarnessOwnerReviewAuthorized:
      d036ReportHarnessRecord?.data?.ownerReviewAuthorized ?? null,
    reportHarnessB05Closed: d036ReportHarnessRecord?.data?.b05Closed ?? null,
    reportHarnessFormalImplementationAuthorized:
      d036ReportHarnessRecord?.data?.formalImplementationAuthorized ?? null,
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
    d036.protocolEventId === "EVT-20260821-011" &&
    d036.protocolState === "PROTOCOL_READY" &&
    d036.protocolNext === "D036_OI07_SPIKE_AUTHORIZATION_AND_MAC_TOOLCHAIN_REQUIRED" &&
    d036.protocolSourcePacketVersion === "PACKET-001-R1" &&
    d036.protocolSourceCardInputFrozen === true &&
    d036.protocolArtifactCommit === "a21110dc651cad83b0c77e4fee5f2e96ac51ef88" &&
    d036.protocolProviderTargetCount === 3 &&
    d036.protocolCandidateProfileCount === 3 &&
    d036.protocolRequiredCompatibilityCellCount === 36 &&
    d036.protocolNativeBoundarySurfaceCount === 13 &&
    d036.protocolOfflineRepetitionMinimum === 10 &&
    d036.protocolProviderPathRepetitionMinimum === 3 &&
    d036.protocolOi07Complete === false &&
    d036.protocolProviderTargetsResolved === false &&
    d036.protocolMacAvailable === false &&
    d036.protocolHarnessAuthorized === false &&
    d036.protocolNetworkSpikeAuthorized === false &&
    d036.protocolExecutionStarted === false &&
    d036.protocolCompatibilityPassed === false &&
    d036.protocolNativeEvidencePassed === false &&
    d036.protocolIndependentReviewPassed === false &&
    d036.protocolOwnerReviewAuthorized === false &&
    d036.protocolB05Closed === false &&
    d036.protocolRealNetworkAuthorized === false &&
    d036.protocolFormalImplementationAuthorized === false &&
    d036.reportContractEventId === "EVT-20260827-001" &&
    d036.reportContractStatus ===
      "CONTRACT_READY / OI07_REQUIRED / NO_RUNS / NO_REPORT / EXECUTION_NOT_AUTHORIZED" &&
    d036.reportContractArtifactCommit === "458d81e5feec32fee9ebc887dc3f4d65e5724f40" &&
    d036.reportContractRequiredCompatibilityCellCount === 36 &&
    d036.reportContractRequiredFormalAttemptMinimum === 324 &&
    d036.reportContractRequiredFormalOfflineResultCount === 108 &&
    d036.reportContractRequiredFormalNativeBoundaryResultCount === 39 &&
    d036.reportContractValidatorImplemented === false &&
    d036.reportContractAttemptRecordCount === 0 &&
    d036.reportContractCompatibilityReportRecorded === false &&
    d036.reportContractNativeBoundaryEvidenceRecorded === false &&
    d036.reportHarnessEventId === "EVT-20260827-002" &&
    d036.reportHarnessStatus === "SPIKE / LOCAL_ONLY / NON_PRODUCTION" &&
    d036.reportHarnessArtifactState === "WORKTREE_UNCOMMITTED" &&
    d036.reportHarnessArtifactCommitRecorded === false &&
    d036.reportHarnessTopLevelTests === 20 &&
    d036.reportHarnessToolSuitePassed === 909 &&
    d036.reportHarnessRequiredCompatibilityCellCount === 36 &&
    d036.reportHarnessRequiredFormalAttemptMinimum === 324 &&
    d036.reportHarnessRequiredFormalOfflineResultCount === 108 &&
    d036.reportHarnessRequiredFormalNativeBoundaryResultCount === 39 &&
    d036.reportHarnessContractValidatorImplemented === true &&
    d036.reportHarnessOi07Reads === 0 &&
    d036.reportHarnessProviderDocumentReads === 0 &&
    d036.reportHarnessAttemptRecordReads === 0 &&
    d036.reportHarnessAttemptRecordWrites === 0 &&
    d036.reportHarnessNetworkRequests === 0 &&
    d036.reportHarnessProviderRequests === 0 &&
    d036.reportHarnessAttemptRecordCount === 0 &&
    d036.reportHarnessCompatibilityReportRecorded === false &&
    d036.reportHarnessNativeBoundaryEvidenceRecorded === false &&
    d036.reportHarnessExecutionStarted === false &&
    d036.reportHarnessCompatibilityPassed === false &&
    d036.reportHarnessNativeEvidencePassed === false &&
    d036.reportHarnessIndependentReviewPassed === false &&
    d036.reportHarnessOwnerReviewAuthorized === false &&
    d036.reportHarnessB05Closed === false &&
    d036.reportHarnessFormalImplementationAuthorized === false &&
    d036.registeredInDecisionLedger === false &&
    d036.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D036_GATE", "D-036", "D-036 未保持三包 AITransport 卡、36 单元/13 原生面 Spike 协议，以及 OI-07/Provider/工具链/联网/执行/复核/Owner/B05/实现待办状态", d036);
  }

  const d053Record = latestD053Record(model);
  const d053EvidenceProtocolRecord = latestD053EvidenceProtocolRecord(model);
  const d053ReportContractRecord = latestD053EvidenceReportContractRecord(model);
  const d053ReportHarnessRecord = latestD053EvidenceReportHarnessRecord(model);
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
    protocolEventId: d053EvidenceProtocolRecord?.eventId ?? null,
    protocolState: d053EvidenceProtocolRecord?.data?.protocolState ?? null,
    protocolNext: d053EvidenceProtocolRecord?.data?.next ?? null,
    protocolSourcePacketVersion:
      d053EvidenceProtocolRecord?.data?.sourcePacketVersion ?? null,
    protocolSourceCardInputFrozen:
      d053EvidenceProtocolRecord?.data?.sourceCardInputFrozen ?? null,
    protocolSourceCardCommit:
      d053EvidenceProtocolRecord?.data?.sourceCardCommit ?? null,
    protocolArtifactCommit:
      d053EvidenceProtocolRecord?.data?.protocolArtifactCommit ?? null,
    protocolProviderTargetCount:
      d053EvidenceProtocolRecord?.data?.providerTargetCount ?? null,
    protocolPayloadClassCount:
      d053EvidenceProtocolRecord?.data?.payloadClassCount ?? null,
    protocolMinimumAdmissionProfileCount:
      d053EvidenceProtocolRecord?.data?.minimumAdmissionProfileCount ?? null,
    protocolEvidenceDimensionCount:
      d053EvidenceProtocolRecord?.data?.evidenceDimensionCount ?? null,
    protocolRequiredDimensionAssessmentCount:
      d053EvidenceProtocolRecord?.data?.requiredDimensionAssessmentCount ?? null,
    protocolAppPrivacyMappingRowMinimum:
      d053EvidenceProtocolRecord?.data?.appPrivacyMappingRowMinimum ?? null,
    protocolApplePolicySourceCount:
      d053EvidenceProtocolRecord?.data?.applePolicySourceCount ?? null,
    protocolOi07Complete: d053EvidenceProtocolRecord?.data?.oi07Complete ?? null,
    protocolProviderTargetsResolved:
      d053EvidenceProtocolRecord?.data?.providerTargetsResolved ?? null,
    protocolEvidenceCollectionAuthorized:
      d053EvidenceProtocolRecord?.data?.providerEvidenceCollectionAuthorized ?? null,
    protocolEvidenceCollectionStarted:
      d053EvidenceProtocolRecord?.data?.providerEvidenceCollectionStarted ?? null,
    protocolSourceSnapshotsRecorded:
      d053EvidenceProtocolRecord?.data?.sourceSnapshotsRecorded ?? null,
    protocolAdmissionProfilesRecorded:
      d053EvidenceProtocolRecord?.data?.admissionProfilesRecorded ?? null,
    protocolDimensionAssessmentsRecorded:
      d053EvidenceProtocolRecord?.data?.dimensionAssessmentsRecorded ?? null,
    protocolAppPrivacyMappingStarted:
      d053EvidenceProtocolRecord?.data?.appPrivacyMappingStarted ?? null,
    protocolAppPrivacyMappingRowCount:
      d053EvidenceProtocolRecord?.data?.appPrivacyMappingRowCount ?? null,
    protocolAppPrivacyMappingSigned:
      d053EvidenceProtocolRecord?.data?.appPrivacyMappingSigned ?? null,
    protocolPrivacyPolicyPublicUrlAvailable:
      d053EvidenceProtocolRecord?.data?.privacyPolicyPublicUrlAvailable ?? null,
    protocolAppStoreConnectRecordAvailable:
      d053EvidenceProtocolRecord?.data?.appStoreConnectRecordAvailable ?? null,
    protocolNamedSignersAssigned: [
      d053EvidenceProtocolRecord?.data?.namedProductSignerAssigned,
      d053EvidenceProtocolRecord?.data?.namedPrivacySecuritySignerAssigned,
      d053EvidenceProtocolRecord?.data?.namedReleaseSignerAssigned,
    ].some((value) => value === true),
    protocolIndependentReviewPassed:
      d053EvidenceProtocolRecord?.data?.independentReviewPassed ?? null,
    protocolProviderEvidencePassed:
      d053EvidenceProtocolRecord?.data?.providerEvidencePassed ?? null,
    protocolOwnerReviewAuthorized:
      d053EvidenceProtocolRecord?.data?.ownerReviewAuthorized ?? null,
    protocolProviderAdmissionRecords:
      d053EvidenceProtocolRecord?.data?.providerAdmissionRecords ?? null,
    protocolAllProviderPayloadProfiles:
      d053EvidenceProtocolRecord?.data?.allProviderPayloadProfiles ?? null,
    protocolLedgerCandidatePreserved: [
      d053EvidenceProtocolRecord?.data?.d053RegisteredInDecisionLedger === true,
      d053EvidenceProtocolRecord?.data?.d053RecordedInOwnerIntake === false,
      d053EvidenceProtocolRecord?.data?.d053CandidateStatusPreserved === true,
    ].every((value) => value === true),
    protocolB05Closed: d053EvidenceProtocolRecord?.data?.b05Closed ?? null,
    protocolRealNetworkAuthorized:
      d053EvidenceProtocolRecord?.data?.realNetworkAuthorized ?? null,
    protocolFormalImplementationAuthorized:
      d053EvidenceProtocolRecord?.data?.formalImplementationAuthorized ?? null,
    reportContractEventId: d053ReportContractRecord?.eventId ?? null,
    reportContractStatus: d053ReportContractRecord?.data?.contractStatus ?? null,
    reportContractArtifactState: d053ReportContractRecord?.data?.artifactState ?? null,
    reportContractArtifactCommitRecorded:
      d053ReportContractRecord?.data?.artifactCommitRecorded ?? null,
    reportContractProviderTargetCount:
      d053ReportContractRecord?.data?.providerTargetCount ?? null,
    reportContractPayloadClassCount:
      d053ReportContractRecord?.data?.payloadClassCount ?? null,
    reportContractAdmissionProfileCount:
      d053ReportContractRecord?.data?.admissionProfileCount ?? null,
    reportContractRequiredDimensionAssessmentCount:
      d053ReportContractRecord?.data?.requiredDimensionAssessmentCount ?? null,
    reportContractRequiredPolicyPackageComparisonCount:
      d053ReportContractRecord?.data?.requiredPolicyPackageComparisonCount ?? null,
    reportContractFormalCompleteStillRequiresEvidenceReview:
      d053ReportContractRecord?.data?.formalCompleteStillRequiresEvidenceReview ?? null,
    reportContractProviderEvidenceCollectionStarted:
      d053ReportContractRecord?.data?.providerEvidenceCollectionStarted ?? null,
    reportContractAppPrivacyMappingSigned:
      d053ReportContractRecord?.data?.appPrivacyMappingSigned ?? null,
    reportContractIndependentReviewPassed:
      d053ReportContractRecord?.data?.independentReviewPassed ?? null,
    reportContractD053Accepted: d053ReportContractRecord?.data?.d053Accepted ?? null,
    reportContractProviderAdmissionGranted:
      d053ReportContractRecord?.data?.providerAdmissionGranted ?? null,
    reportContractSendAuthorization:
      d053ReportContractRecord?.data?.sendAuthorization ?? null,
    reportContractB05Closed: d053ReportContractRecord?.data?.b05Closed ?? null,
    reportContractFormalImplementationAuthorized:
      d053ReportContractRecord?.data?.formalImplementationAuthorized ?? null,
    reportHarnessEventId: d053ReportHarnessRecord?.eventId ?? null,
    reportHarnessStatus: d053ReportHarnessRecord?.data?.contractStatus ?? null,
    reportHarnessArtifactState: d053ReportHarnessRecord?.data?.artifactState ?? null,
    reportHarnessArtifactCommitRecorded:
      d053ReportHarnessRecord?.data?.artifactCommitRecorded ?? null,
    reportHarnessTopLevelTests: d053ReportHarnessRecord?.data?.topLevelTests ?? null,
    reportHarnessProviderTargetCount: d053ReportHarnessRecord?.data?.providerTargetCount ?? null,
    reportHarnessPayloadClassCount: d053ReportHarnessRecord?.data?.payloadClassCount ?? null,
    reportHarnessAdmissionProfileCount:
      d053ReportHarnessRecord?.data?.admissionProfileCount ?? null,
    reportHarnessRequiredDimensionAssessmentCount:
      d053ReportHarnessRecord?.data?.requiredDimensionAssessmentCount ?? null,
    reportHarnessRequiredPolicyPackageComparisonCount:
      d053ReportHarnessRecord?.data?.requiredPolicyPackageComparisonCount ?? null,
    reportHarnessSupportedIncompatibleDerivationEnforced:
      d053ReportHarnessRecord?.data?.supportedIncompatibleDerivationEnforced ?? null,
    reportHarnessOpenConflictKeepsUnknown:
      d053ReportHarnessRecord?.data?.openConflictKeepsUnknown ?? null,
    reportHarnessAExpiryWindowDays:
      d053ReportHarnessRecord?.data?.aExpiryWindowDays ?? null,
    reportHarnessBExpiryWindowDays:
      d053ReportHarnessRecord?.data?.bExpiryWindowDays ?? null,
    reportHarnessCNotOwnerReadyAndNotAssessed:
      d053ReportHarnessRecord?.data?.cNotOwnerReadyAndNotAssessed ?? null,
    reportHarnessProviderValuesReturned:
      d053ReportHarnessRecord?.data?.providerUrlSignerAndBodyValuesReturned ?? null,
    reportHarnessOi07Reads: d053ReportHarnessRecord?.data?.oi07Reads ?? null,
    reportHarnessProviderDocumentReads:
      d053ReportHarnessRecord?.data?.providerDocumentReads ?? null,
    reportHarnessSourceSnapshotReads:
      d053ReportHarnessRecord?.data?.sourceSnapshotReads ?? null,
    reportHarnessSignatureReads:
      d053ReportHarnessRecord?.data?.signatureReads ?? null,
    reportHarnessIndependentReviewReads:
      d053ReportHarnessRecord?.data?.independentReviewReads ?? null,
    reportHarnessReportWrites: d053ReportHarnessRecord?.data?.reportWrites ?? null,
    reportHarnessNetworkRequests: d053ReportHarnessRecord?.data?.networkRequests ?? null,
    reportHarnessProviderRequests: d053ReportHarnessRecord?.data?.providerRequests ?? null,
    reportHarnessProviderEvidenceCollectionStarted:
      d053ReportHarnessRecord?.data?.providerEvidenceCollectionStarted ?? null,
    reportHarnessAppPrivacyMappingSigned:
      d053ReportHarnessRecord?.data?.appPrivacyMappingSigned ?? null,
    reportHarnessNamedSignersVerified:
      d053ReportHarnessRecord?.data?.namedSignersVerified ?? null,
    reportHarnessIndependentReviewPassed:
      d053ReportHarnessRecord?.data?.independentReviewPassed ?? null,
    reportHarnessD053Accepted: d053ReportHarnessRecord?.data?.d053Accepted ?? null,
    reportHarnessD053PassCandidate:
      d053ReportHarnessRecord?.data?.d053PassCandidate ?? null,
    reportHarnessProviderAdmissionGranted:
      d053ReportHarnessRecord?.data?.providerAdmissionGranted ?? null,
    reportHarnessSendAuthorization:
      d053ReportHarnessRecord?.data?.sendAuthorization ?? null,
    reportHarnessB05Closed: d053ReportHarnessRecord?.data?.b05Closed ?? null,
    reportHarnessFormalImplementationAuthorized:
      d053ReportHarnessRecord?.data?.formalImplementationAuthorized ?? null,
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
    d053.protocolEventId === "EVT-20260821-012" &&
    d053.protocolState === "PROTOCOL_READY" &&
    d053.protocolNext === "D053_OI07_PROVIDER_EVIDENCE_AND_APP_PRIVACY_MAPPING_REQUIRED" &&
    d053.protocolSourcePacketVersion === "PACKET-001-R1" &&
    d053.protocolSourceCardInputFrozen === true &&
    d053.protocolSourceCardCommit === "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117" &&
    d053.protocolArtifactCommit === "d6e72dd449c8de8b385b6f9e6427cb0fd99f7ce7" &&
    d053.protocolProviderTargetCount === 3 &&
    d053.protocolPayloadClassCount === 5 &&
    d053.protocolMinimumAdmissionProfileCount === 15 &&
    d053.protocolEvidenceDimensionCount === 10 &&
    d053.protocolRequiredDimensionAssessmentCount === 150 &&
    d053.protocolAppPrivacyMappingRowMinimum === 5 &&
    d053.protocolApplePolicySourceCount === 3 &&
    d053.protocolOi07Complete === false &&
    d053.protocolProviderTargetsResolved === false &&
    d053.protocolEvidenceCollectionAuthorized === false &&
    d053.protocolEvidenceCollectionStarted === false &&
    d053.protocolSourceSnapshotsRecorded === false &&
    d053.protocolAdmissionProfilesRecorded === 0 &&
    d053.protocolDimensionAssessmentsRecorded === 0 &&
    d053.protocolAppPrivacyMappingStarted === false &&
    d053.protocolAppPrivacyMappingRowCount === 0 &&
    d053.protocolAppPrivacyMappingSigned === false &&
    d053.protocolPrivacyPolicyPublicUrlAvailable === false &&
    d053.protocolAppStoreConnectRecordAvailable === false &&
    d053.protocolNamedSignersAssigned === false &&
    d053.protocolIndependentReviewPassed === false &&
    d053.protocolProviderEvidencePassed === false &&
    d053.protocolOwnerReviewAuthorized === false &&
    d053.protocolProviderAdmissionRecords === 0 &&
    d053.protocolAllProviderPayloadProfiles === "UNKNOWN_BLOCKED" &&
    d053.protocolLedgerCandidatePreserved === true &&
    d053.protocolB05Closed === false &&
    d053.protocolRealNetworkAuthorized === false &&
    d053.protocolFormalImplementationAuthorized === false &&
    d053.reportContractEventId === "EVT-20260827-003" &&
    d053.reportContractStatus ===
      "CONTRACT_READY / OI07_REQUIRED / NO_PROVIDER_EVIDENCE / NO_MAPPING / NO_ADMISSION" &&
    d053.reportContractArtifactState === "WORKTREE_UNCOMMITTED" &&
    d053.reportContractArtifactCommitRecorded === false &&
    d053.reportContractProviderTargetCount === 3 &&
    d053.reportContractPayloadClassCount === 5 &&
    d053.reportContractAdmissionProfileCount === 15 &&
    d053.reportContractRequiredDimensionAssessmentCount === 150 &&
    d053.reportContractRequiredPolicyPackageComparisonCount === 45 &&
    d053.reportContractFormalCompleteStillRequiresEvidenceReview === true &&
    d053.reportContractProviderEvidenceCollectionStarted === false &&
    d053.reportContractAppPrivacyMappingSigned === false &&
    d053.reportContractIndependentReviewPassed === false &&
    d053.reportContractD053Accepted === false &&
    d053.reportContractProviderAdmissionGranted === false &&
    d053.reportContractSendAuthorization === "NOT_GRANTED" &&
    d053.reportContractB05Closed === false &&
    d053.reportContractFormalImplementationAuthorized === false &&
    d053.reportHarnessEventId === "EVT-20260827-004" &&
    d053.reportHarnessStatus === "SPIKE / LOCAL_ONLY / NON_PRODUCTION / NO_ADMISSION" &&
    d053.reportHarnessArtifactState === "WORKTREE_UNCOMMITTED" &&
    d053.reportHarnessArtifactCommitRecorded === false &&
    d053.reportHarnessTopLevelTests === 19 &&
    d053.reportHarnessProviderTargetCount === 3 &&
    d053.reportHarnessPayloadClassCount === 5 &&
    d053.reportHarnessAdmissionProfileCount === 15 &&
    d053.reportHarnessRequiredDimensionAssessmentCount === 150 &&
    d053.reportHarnessRequiredPolicyPackageComparisonCount === 45 &&
    d053.reportHarnessSupportedIncompatibleDerivationEnforced === true &&
    d053.reportHarnessOpenConflictKeepsUnknown === true &&
    d053.reportHarnessAExpiryWindowDays === 90 &&
    d053.reportHarnessBExpiryWindowDays === 30 &&
    d053.reportHarnessCNotOwnerReadyAndNotAssessed === true &&
    d053.reportHarnessProviderValuesReturned === false &&
    d053.reportHarnessOi07Reads === 0 &&
    d053.reportHarnessProviderDocumentReads === 0 &&
    d053.reportHarnessSourceSnapshotReads === 0 &&
    d053.reportHarnessSignatureReads === 0 &&
    d053.reportHarnessIndependentReviewReads === 0 &&
    d053.reportHarnessReportWrites === 0 &&
    d053.reportHarnessNetworkRequests === 0 &&
    d053.reportHarnessProviderRequests === 0 &&
    d053.reportHarnessProviderEvidenceCollectionStarted === false &&
    d053.reportHarnessAppPrivacyMappingSigned === false &&
    d053.reportHarnessNamedSignersVerified === false &&
    d053.reportHarnessIndependentReviewPassed === false &&
    d053.reportHarnessD053Accepted === false &&
    d053.reportHarnessD053PassCandidate === false &&
    d053.reportHarnessProviderAdmissionGranted === false &&
    d053.reportHarnessSendAuthorization === "NOT_GRANTED" &&
    d053.reportHarnessB05Closed === false &&
    d053.reportHarnessFormalImplementationAuthorized === false &&
    d053.registeredInDecisionLedger === true &&
    d053.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D053_GATE", "D-053", "D-053 未保持三包 Provider 用途准入卡、3 Provider/5 payload/15 profile/150 十维评估/App Privacy 映射协议、Apple 不可豁免/UNKNOWN 阻断、OI-07/采集/签署/独立复核待办、台账 CANDIDATE 和 Owner/准入/B05/联网/实现未授权状态", d053);
  }

  const oi07TemplateRecord = latestOi07ProviderTargetTemplateRecord(model);
  const oi07 = {
    eventId: oi07TemplateRecord?.eventId ?? null,
    state: oi07TemplateRecord?.data?.state ?? null,
    templateState: oi07TemplateRecord?.data?.templateState ?? null,
    next: oi07TemplateRecord?.data?.next ?? null,
    decisionIds: oi07TemplateRecord?.data?.decisionIds ?? null,
    templateArtifactCommit: oi07TemplateRecord?.data?.templateArtifactCommit ?? null,
    templateArtifactBlobOid: oi07TemplateRecord?.data?.templateArtifactBlobOid ?? null,
    sharedRevisionFieldCount: oi07TemplateRecord?.data?.sharedRevisionFieldCount ?? null,
    providerTargetCount: oi07TemplateRecord?.data?.providerTargetCount ?? null,
    perTargetFieldCount: oi07TemplateRecord?.data?.perTargetFieldCount ?? null,
    sharedPerTargetFieldCount: oi07TemplateRecord?.data?.sharedPerTargetFieldCount ?? null,
    d036OnlyPerTargetFieldCount: oi07TemplateRecord?.data?.d036OnlyPerTargetFieldCount ?? null,
    d053OnlyPerTargetFieldCount: oi07TemplateRecord?.data?.d053OnlyPerTargetFieldCount ?? null,
    unionInputFieldCount: oi07TemplateRecord?.data?.unionInputFieldCount ?? null,
    sameRevisionRequiredForD036AndD053:
      oi07TemplateRecord?.data?.sameRevisionRequiredForD036AndD053 ?? null,
    unknownAllowedButBlocks: oi07TemplateRecord?.data?.unknownAllowedButBlocks ?? null,
    naRequiresReasonAndSource: oi07TemplateRecord?.data?.naRequiresReasonAndSource ?? null,
    secretFreeInputRequired: oi07TemplateRecord?.data?.secretFreeInputRequired ?? null,
    ownerOrAuthorizedContactRequired:
      oi07TemplateRecord?.data?.ownerOrAuthorizedContactRequired ?? null,
    oi07RevisionAssigned: oi07TemplateRecord?.data?.oi07RevisionAssigned ?? null,
    ownerInputReceived: oi07TemplateRecord?.data?.ownerInputReceived ?? null,
    inputAuthorityVerified: oi07TemplateRecord?.data?.inputAuthorityVerified ?? null,
    providerTargetsResolved: oi07TemplateRecord?.data?.providerTargetsResolved ?? null,
    allProviderTargets: oi07TemplateRecord?.data?.allProviderTargets ?? null,
    credentialsReceived: oi07TemplateRecord?.data?.credentialsReceived ?? null,
    credentialInjectionAuthorized:
      oi07TemplateRecord?.data?.credentialInjectionAuthorized ?? null,
    testCostAuthorized: oi07TemplateRecord?.data?.testCostAuthorized ?? null,
    realNetworkAuthorized: oi07TemplateRecord?.data?.realNetworkAuthorized ?? null,
    providerEvidenceCollectionAuthorized:
      oi07TemplateRecord?.data?.providerEvidenceCollectionAuthorized ?? null,
    externalMessageSent: oi07TemplateRecord?.data?.externalMessageSent ?? null,
    ownerIntakeChanged: oi07TemplateRecord?.data?.ownerIntakeChanged ?? null,
    d036ExecutionAuthorized: oi07TemplateRecord?.data?.d036ExecutionAuthorized ?? null,
    d053EvidenceCollectionStarted:
      oi07TemplateRecord?.data?.d053EvidenceCollectionStarted ?? null,
    d053AdmissionRecords: oi07TemplateRecord?.data?.d053AdmissionRecords ?? null,
    ownerReviewAuthorized: oi07TemplateRecord?.data?.ownerReviewAuthorized ?? null,
    b05Closed: oi07TemplateRecord?.data?.b05Closed ?? null,
    formalImplementationAuthorized:
      oi07TemplateRecord?.data?.formalImplementationAuthorized ?? null,
  };
  if (!(
    oi07.eventId === "EVT-20260821-013" &&
    oi07.state === "completed" &&
    oi07.templateState === "TEMPLATE_READY" &&
    oi07.next === "OI07_OWNER_OR_AUTHORIZED_CONTACT_INPUT_REQUIRED" &&
    JSON.stringify(oi07.decisionIds) === JSON.stringify(["D-036", "D-053"]) &&
    oi07.templateArtifactCommit === "46e22ced7be0c5940fe5f5e4860f73817c6b0d52" &&
    oi07.templateArtifactBlobOid === "875167cdc6aba15f9a2589bcc76ac889e7b40e0a" &&
    oi07.sharedRevisionFieldCount === 1 &&
    oi07.providerTargetCount === 3 &&
    oi07.perTargetFieldCount === 29 &&
    oi07.sharedPerTargetFieldCount === 12 &&
    oi07.d036OnlyPerTargetFieldCount === 8 &&
    oi07.d053OnlyPerTargetFieldCount === 9 &&
    oi07.unionInputFieldCount === 30 &&
    oi07.sameRevisionRequiredForD036AndD053 === true &&
    oi07.unknownAllowedButBlocks === true &&
    oi07.naRequiresReasonAndSource === true &&
    oi07.secretFreeInputRequired === true &&
    oi07.ownerOrAuthorizedContactRequired === true &&
    oi07.oi07RevisionAssigned === false &&
    oi07.ownerInputReceived === false &&
    oi07.inputAuthorityVerified === false &&
    oi07.providerTargetsResolved === false &&
    oi07.allProviderTargets === "UNKNOWN_BLOCKED" &&
    oi07.credentialsReceived === false &&
    oi07.credentialInjectionAuthorized === false &&
    oi07.testCostAuthorized === false &&
    oi07.realNetworkAuthorized === false &&
    oi07.providerEvidenceCollectionAuthorized === false &&
    oi07.externalMessageSent === false &&
    oi07.ownerIntakeChanged === false &&
    oi07.d036ExecutionAuthorized === false &&
    oi07.d053EvidenceCollectionStarted === false &&
    oi07.d053AdmissionRecords === 0 &&
    oi07.ownerReviewAuthorized === false &&
    oi07.b05Closed === false &&
    oi07.formalImplementationAuthorized === false
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_OI07_TEMPLATE_GATE", "OI-07", "OI-07 未保持 D-036/D-053 共用 revision、3 target/29 字段/30 联合字段、UNKNOWN 阻断和输入/凭证/费用/联网/证据/Owner/B05/实现全关闭边界", oi07);
  }

  const oi07HarnessRecord = latestOi07ProviderTargetHarnessRecord(model);
  const oi07Harness = {
    eventId: oi07HarnessRecord?.eventId ?? null,
    state: oi07HarnessRecord?.data?.state ?? null,
    contractStatus: oi07HarnessRecord?.data?.contractStatus ?? null,
    templateEventId: oi07HarnessRecord?.data?.templateEventId ?? null,
    artifactCommit: oi07HarnessRecord?.data?.artifactCommit ?? null,
    inputSchemaVersion: oi07HarnessRecord?.data?.inputSchemaVersion ?? null,
    resultSchemaVersion: oi07HarnessRecord?.data?.resultSchemaVersion ?? null,
    boundarySchemaVersion: oi07HarnessRecord?.data?.boundarySchemaVersion ?? null,
    topLevelTests: oi07HarnessRecord?.data?.topLevelTests ?? null,
    fullSuitePassed: oi07HarnessRecord?.data?.fullSuitePassed ?? null,
    providerTargetCount: oi07HarnessRecord?.data?.providerTargetCount ?? null,
    perTargetFieldCount: oi07HarnessRecord?.data?.perTargetFieldCount ?? null,
    sharedPerTargetFieldCount: oi07HarnessRecord?.data?.sharedPerTargetFieldCount ?? null,
    d036OnlyPerTargetFieldCount: oi07HarnessRecord?.data?.d036OnlyPerTargetFieldCount ?? null,
    d053OnlyPerTargetFieldCount: oi07HarnessRecord?.data?.d053OnlyPerTargetFieldCount ?? null,
    unionInputFieldCount: oi07HarnessRecord?.data?.unionInputFieldCount ?? null,
    dispositions: oi07HarnessRecord?.data?.dispositions ?? null,
    d036AndD053CompletenessEvaluatedSeparately:
      oi07HarnessRecord?.data?.d036AndD053CompletenessEvaluatedSeparately ?? null,
    sharedUnknownBlocksBothConsumers:
      oi07HarnessRecord?.data?.sharedUnknownBlocksBothConsumers ?? null,
    sourcedNaRequired: oi07HarnessRecord?.data?.sourcedNaRequired ?? null,
    concreteTargetIdentityAllowsNa:
      oi07HarnessRecord?.data?.concreteTargetIdentityAllowsNa ?? null,
    sensitiveLookingMaterialRejectedWithoutEcho:
      oi07HarnessRecord?.data?.sensitiveLookingMaterialRejectedWithoutEcho ?? null,
    onlyCountsStatesAndFingerprintsReturned:
      oi07HarnessRecord?.data?.onlyCountsStatesAndFingerprintsReturned ?? null,
    providerInputValuesReturned:
      oi07HarnessRecord?.data?.providerInputValuesReturned ?? null,
    syntheticFixtureOnly: oi07HarnessRecord?.data?.syntheticFixtureOnly ?? null,
    inputAuthorityCallerAssertedNotVerified:
      oi07HarnessRecord?.data?.inputAuthorityCallerAssertedNotVerified ?? null,
    providerFactsVerified: oi07HarnessRecord?.data?.providerFactsVerified ?? null,
    sourceUrlsFetched: oi07HarnessRecord?.data?.sourceUrlsFetched ?? null,
    oi07RevisionAssigned: oi07HarnessRecord?.data?.oi07RevisionAssigned ?? null,
    ownerInputReceived: oi07HarnessRecord?.data?.ownerInputReceived ?? null,
    providerTargetsResolved: oi07HarnessRecord?.data?.providerTargetsResolved ?? null,
    allProviderTargets: oi07HarnessRecord?.data?.allProviderTargets ?? null,
    credentialMaterialReads: oi07HarnessRecord?.data?.credentialMaterialReads ?? null,
    testCostAuthorized: oi07HarnessRecord?.data?.testCostAuthorized ?? null,
    transportsCreated: oi07HarnessRecord?.data?.transportsCreated ?? null,
    realNetworkRequests: oi07HarnessRecord?.data?.realNetworkRequests ?? null,
    providerEvidenceCollectionAuthorized:
      oi07HarnessRecord?.data?.providerEvidenceCollectionAuthorized ?? null,
    ownerIntakeChanged: oi07HarnessRecord?.data?.ownerIntakeChanged ?? null,
    d036ExecutionAuthorized: oi07HarnessRecord?.data?.d036ExecutionAuthorized ?? null,
    d053EvidenceCollectionStarted:
      oi07HarnessRecord?.data?.d053EvidenceCollectionStarted ?? null,
    d053AdmissionRecords: oi07HarnessRecord?.data?.d053AdmissionRecords ?? null,
    ownerReviewAuthorized: oi07HarnessRecord?.data?.ownerReviewAuthorized ?? null,
    b05Closed: oi07HarnessRecord?.data?.b05Closed ?? null,
    formalImplementationAuthorized:
      oi07HarnessRecord?.data?.formalImplementationAuthorized ?? null,
    sendAuthorization: oi07HarnessRecord?.data?.sendAuthorization ?? null,
  };
  if (!(
    oi07Harness.eventId === "EVT-20260821-014" &&
    oi07Harness.state === "completed" &&
    oi07Harness.contractStatus === "SPIKE / LOCAL_ONLY / NON_PRODUCTION" &&
    oi07Harness.templateEventId === "EVT-20260821-013" &&
    oi07Harness.artifactCommit === "20f228586617d03449d840897cf223a9d87dfdc8" &&
    oi07Harness.inputSchemaVersion === "OI07_PROVIDER_TARGET_INTAKE_INPUT_V1" &&
    oi07Harness.resultSchemaVersion === "OI07_PROVIDER_TARGET_INTAKE_RESULT_V1" &&
    oi07Harness.boundarySchemaVersion === "OI07_PROVIDER_TARGET_INTAKE_BOUNDARY_V1" &&
    oi07Harness.topLevelTests === 11 &&
    oi07Harness.fullSuitePassed === 930 &&
    oi07Harness.providerTargetCount === 3 &&
    oi07Harness.perTargetFieldCount === 29 &&
    oi07Harness.sharedPerTargetFieldCount === 12 &&
    oi07Harness.d036OnlyPerTargetFieldCount === 8 &&
    oi07Harness.d053OnlyPerTargetFieldCount === 9 &&
    oi07Harness.unionInputFieldCount === 30 &&
    JSON.stringify(oi07Harness.dispositions) === JSON.stringify([
      "STRUCTURALLY_COMPLETE_INTAKE_ONLY",
      "PARTIAL_UNKNOWN_BLOCKED",
    ]) &&
    oi07Harness.d036AndD053CompletenessEvaluatedSeparately === true &&
    oi07Harness.sharedUnknownBlocksBothConsumers === true &&
    oi07Harness.sourcedNaRequired === true &&
    oi07Harness.concreteTargetIdentityAllowsNa === false &&
    oi07Harness.sensitiveLookingMaterialRejectedWithoutEcho === true &&
    oi07Harness.onlyCountsStatesAndFingerprintsReturned === true &&
    oi07Harness.providerInputValuesReturned === false &&
    oi07Harness.syntheticFixtureOnly === true &&
    oi07Harness.inputAuthorityCallerAssertedNotVerified === true &&
    oi07Harness.providerFactsVerified === false &&
    oi07Harness.sourceUrlsFetched === false &&
    oi07Harness.oi07RevisionAssigned === false &&
    oi07Harness.ownerInputReceived === false &&
    oi07Harness.providerTargetsResolved === false &&
    oi07Harness.allProviderTargets === "UNKNOWN_BLOCKED" &&
    oi07Harness.credentialMaterialReads === 0 &&
    oi07Harness.testCostAuthorized === false &&
    oi07Harness.transportsCreated === 0 &&
    oi07Harness.realNetworkRequests === 0 &&
    oi07Harness.providerEvidenceCollectionAuthorized === false &&
    oi07Harness.ownerIntakeChanged === false &&
    oi07Harness.d036ExecutionAuthorized === false &&
    oi07Harness.d053EvidenceCollectionStarted === false &&
    oi07Harness.d053AdmissionRecords === 0 &&
    oi07Harness.ownerReviewAuthorized === false &&
    oi07Harness.b05Closed === false &&
    oi07Harness.formalImplementationAuthorized === false &&
    oi07Harness.sendAuthorization === "NOT_GRANTED"
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_OI07_HARNESS_GATE", "OI-07", "OI-07 本地校验未保持 11 测试/3 target/29 字段/30 联合字段、UNKNOWN/N/A/脱敏/合成 fixture 边界及输入/Provider/凭证/费用/联网/证据/Owner/B05/发送/实现全关闭状态", oi07Harness);
  }

  const d034CorpusManifestHarnessRecord = latestD034CorpusManifestHarnessRecord(model);
  const d034CorpusManifestHarness = {
    eventId: d034CorpusManifestHarnessRecord?.eventId ?? null,
    state: d034CorpusManifestHarnessRecord?.data?.state ?? null,
    contractStatus: d034CorpusManifestHarnessRecord?.data?.contractStatus ?? null,
    decisionId: d034CorpusManifestHarnessRecord?.data?.decisionId ?? null,
    decisionState: d034CorpusManifestHarnessRecord?.data?.decisionState ?? null,
    d039BlockerId: d034CorpusManifestHarnessRecord?.data?.d039BlockerId ?? null,
    d039BlockerState: d034CorpusManifestHarnessRecord?.data?.d039BlockerState ?? null,
    protocolEventId: d034CorpusManifestHarnessRecord?.data?.protocolEventId ?? null,
    artifactCommit: d034CorpusManifestHarnessRecord?.data?.artifactCommit ?? null,
    inputSchemaVersion: d034CorpusManifestHarnessRecord?.data?.inputSchemaVersion ?? null,
    resultSchemaVersion: d034CorpusManifestHarnessRecord?.data?.resultSchemaVersion ?? null,
    boundarySchemaVersion: d034CorpusManifestHarnessRecord?.data?.boundarySchemaVersion ?? null,
    topLevelTests: d034CorpusManifestHarnessRecord?.data?.topLevelTests ?? null,
    fullSuitePassed: d034CorpusManifestHarnessRecord?.data?.fullSuitePassed ?? null,
    profileCount: d034CorpusManifestHarnessRecord?.data?.profileCount ?? null,
    profileMatrixRowCount: d034CorpusManifestHarnessRecord?.data?.profileMatrixRowCount ?? null,
    directHardLimitCount: d034CorpusManifestHarnessRecord?.data?.directHardLimitCount ?? null,
    companionControlCount: d034CorpusManifestHarnessRecord?.data?.companionControlCount ?? null,
    requiredFixtureSlotCount: d034CorpusManifestHarnessRecord?.data?.requiredFixtureSlotCount ?? null,
    directLimitFixtureCount: d034CorpusManifestHarnessRecord?.data?.directLimitFixtureCount ?? null,
    familyCounts: d034CorpusManifestHarnessRecord?.data?.familyCounts ?? null,
    structuralDisposition: d034CorpusManifestHarnessRecord?.data?.structuralDisposition ?? null,
    extensionsAllowed: d034CorpusManifestHarnessRecord?.data?.extensionsAllowed ?? null,
    extensionCanReplaceRequired: d034CorpusManifestHarnessRecord?.data?.extensionCanReplaceRequired ?? null,
    binaryUnitsAndMachineValuesExact:
      d034CorpusManifestHarnessRecord?.data?.binaryUnitsAndMachineValuesExact ?? null,
    imageJpegQualityBoundForAllImageFixtures:
      d034CorpusManifestHarnessRecord?.data?.imageJpegQualityBoundForAllImageFixtures ?? null,
    fixtureArtifactSha256SyntaxRequired:
      d034CorpusManifestHarnessRecord?.data?.fixtureArtifactSha256SyntaxRequired ?? null,
    containsRealUserDataAllowed:
      d034CorpusManifestHarnessRecord?.data?.containsRealUserDataAllowed ?? null,
    containsCredentialAllowed:
      d034CorpusManifestHarnessRecord?.data?.containsCredentialAllowed ?? null,
    sensitiveLookingMaterialRejectedWithoutEcho:
      d034CorpusManifestHarnessRecord?.data?.sensitiveLookingMaterialRejectedWithoutEcho ?? null,
    specialObjectAndResourceAbuseRejected:
      d034CorpusManifestHarnessRecord?.data?.specialObjectAndResourceAbuseRejected ?? null,
    immutableNormalizationAndResultFingerprintBound:
      d034CorpusManifestHarnessRecord?.data?.immutableNormalizationAndResultFingerprintBound ?? null,
    fixtureOrderCanonicalized:
      d034CorpusManifestHarnessRecord?.data?.fixtureOrderCanonicalized ?? null,
    onlyCountsSummariesBlockersAndFingerprintsReturned:
      d034CorpusManifestHarnessRecord?.data?.onlyCountsSummariesBlockersAndFingerprintsReturned ?? null,
    fixtureManifestValuesReturned:
      d034CorpusManifestHarnessRecord?.data?.fixtureManifestValuesReturned ?? null,
    syntheticManifestOnly: d034CorpusManifestHarnessRecord?.data?.syntheticManifestOnly ?? null,
    fixtureArtifactsCallerAssertedNotVerified:
      d034CorpusManifestHarnessRecord?.data?.fixtureArtifactsCallerAssertedNotVerified ?? null,
    corpusRevisionAssigned: d034CorpusManifestHarnessRecord?.data?.corpusRevisionAssigned ?? null,
    corpusMaterialized: d034CorpusManifestHarnessRecord?.data?.corpusMaterialized ?? null,
    fixtureArtifactReads: d034CorpusManifestHarnessRecord?.data?.fixtureArtifactReads ?? null,
    fixtureArtifactWrites: d034CorpusManifestHarnessRecord?.data?.fixtureArtifactWrites ?? null,
    minimumPhysicalDeviceResolved:
      d034CorpusManifestHarnessRecord?.data?.minimumPhysicalDeviceResolved ?? null,
    macAndSupportedXcodeAvailable:
      d034CorpusManifestHarnessRecord?.data?.macAndSupportedXcodeAvailable ?? null,
    isolatedNativeHarnessAuthorized:
      d034CorpusManifestHarnessRecord?.data?.isolatedNativeHarnessAuthorized ?? null,
    benchmarkExecutionAuthorized:
      d034CorpusManifestHarnessRecord?.data?.benchmarkExecutionAuthorized ?? null,
    benchmarkExecutionStarted:
      d034CorpusManifestHarnessRecord?.data?.benchmarkExecutionStarted ?? null,
    benchmarkResultRecorded:
      d034CorpusManifestHarnessRecord?.data?.benchmarkResultRecorded ?? null,
    deviceBenchmarkPassed: d034CorpusManifestHarnessRecord?.data?.deviceBenchmarkPassed ?? null,
    namedSecurityReviewerAssigned:
      d034CorpusManifestHarnessRecord?.data?.namedSecurityReviewerAssigned ?? null,
    namedQaReviewerAssigned:
      d034CorpusManifestHarnessRecord?.data?.namedQaReviewerAssigned ?? null,
    independentReviewPassed:
      d034CorpusManifestHarnessRecord?.data?.independentReviewPassed ?? null,
    ownerIntakeChanged: d034CorpusManifestHarnessRecord?.data?.ownerIntakeChanged ?? null,
    externalMessageSent: d034CorpusManifestHarnessRecord?.data?.externalMessageSent ?? null,
    ownerCardScheduled: d034CorpusManifestHarnessRecord?.data?.ownerCardScheduled ?? null,
    ownerReviewAuthorized: d034CorpusManifestHarnessRecord?.data?.ownerReviewAuthorized ?? null,
    ownerChoiceRecorded: d034CorpusManifestHarnessRecord?.data?.ownerChoiceRecorded ?? null,
    decisionAcceptedRecorded:
      d034CorpusManifestHarnessRecord?.data?.decisionAcceptedRecorded ?? null,
    b05Closed: d034CorpusManifestHarnessRecord?.data?.b05Closed ?? null,
    formalRootProjectAuthorized:
      d034CorpusManifestHarnessRecord?.data?.formalRootProjectAuthorized ?? null,
    nativeIosWorkAuthorized:
      d034CorpusManifestHarnessRecord?.data?.nativeIosWorkAuthorized ?? null,
    formalImplementationAuthorized:
      d034CorpusManifestHarnessRecord?.data?.formalImplementationAuthorized ?? null,
    gateStatesChanged: d034CorpusManifestHarnessRecord?.data?.gateStatesChanged ?? null,
  };
  if (!(
    d034CorpusManifestHarness.eventId === "EVT-20260821-015" &&
    d034CorpusManifestHarness.state === "completed" &&
    d034CorpusManifestHarness.contractStatus === "SPIKE / LOCAL_ONLY / NON_PRODUCTION" &&
    d034CorpusManifestHarness.decisionId === "D-034" &&
    d034CorpusManifestHarness.decisionState === "CANDIDATE" &&
    d034CorpusManifestHarness.d039BlockerId === "D039-PX5-B05" &&
    d034CorpusManifestHarness.d039BlockerState === "OPEN" &&
    d034CorpusManifestHarness.protocolEventId === "EVT-20260821-010" &&
    d034CorpusManifestHarness.artifactCommit === "217a632236a12b885f2d6177f10f03f099c45e3c" &&
    d034CorpusManifestHarness.inputSchemaVersion === "D034_BENCHMARK_CORPUS_MANIFEST_INPUT_V1" &&
    d034CorpusManifestHarness.resultSchemaVersion === "D034_BENCHMARK_CORPUS_MANIFEST_RESULT_V1" &&
    d034CorpusManifestHarness.boundarySchemaVersion === "D034_BENCHMARK_CORPUS_MANIFEST_BOUNDARY_V1" &&
    d034CorpusManifestHarness.topLevelTests === 13 &&
    d034CorpusManifestHarness.fullSuitePassed === 947 &&
    d034CorpusManifestHarness.profileCount === 3 &&
    d034CorpusManifestHarness.profileMatrixRowCount === 21 &&
    d034CorpusManifestHarness.directHardLimitCount === 19 &&
    d034CorpusManifestHarness.companionControlCount === 2 &&
    d034CorpusManifestHarness.requiredFixtureSlotCount === 85 &&
    d034CorpusManifestHarness.directLimitFixtureCount === 38 &&
    JSON.stringify(d034CorpusManifestHarness.familyCounts) === JSON.stringify({
      NORMAL: 8,
      DIRECT_LIMIT: 38,
      IMAGE_ADVERSARIAL: 7,
      STREAM_ADVERSARIAL: 6,
      JSON_ADVERSARIAL: 9,
      LIFECYCLE: 11,
      QUALITY_ACCESSIBILITY: 6,
    }) &&
    d034CorpusManifestHarness.structuralDisposition === "STRUCTURALLY_COMPLETE_MANIFEST_ONLY" &&
    d034CorpusManifestHarness.extensionsAllowed === true &&
    d034CorpusManifestHarness.extensionCanReplaceRequired === false &&
    d034CorpusManifestHarness.binaryUnitsAndMachineValuesExact === true &&
    d034CorpusManifestHarness.imageJpegQualityBoundForAllImageFixtures === true &&
    d034CorpusManifestHarness.fixtureArtifactSha256SyntaxRequired === true &&
    d034CorpusManifestHarness.containsRealUserDataAllowed === false &&
    d034CorpusManifestHarness.containsCredentialAllowed === false &&
    d034CorpusManifestHarness.sensitiveLookingMaterialRejectedWithoutEcho === true &&
    d034CorpusManifestHarness.specialObjectAndResourceAbuseRejected === true &&
    d034CorpusManifestHarness.immutableNormalizationAndResultFingerprintBound === true &&
    d034CorpusManifestHarness.fixtureOrderCanonicalized === true &&
    d034CorpusManifestHarness.onlyCountsSummariesBlockersAndFingerprintsReturned === true &&
    d034CorpusManifestHarness.fixtureManifestValuesReturned === false &&
    d034CorpusManifestHarness.syntheticManifestOnly === true &&
    d034CorpusManifestHarness.fixtureArtifactsCallerAssertedNotVerified === true &&
    d034CorpusManifestHarness.corpusRevisionAssigned === false &&
    d034CorpusManifestHarness.corpusMaterialized === false &&
    d034CorpusManifestHarness.fixtureArtifactReads === 0 &&
    d034CorpusManifestHarness.fixtureArtifactWrites === 0 &&
    d034CorpusManifestHarness.minimumPhysicalDeviceResolved === false &&
    d034CorpusManifestHarness.macAndSupportedXcodeAvailable === false &&
    d034CorpusManifestHarness.isolatedNativeHarnessAuthorized === false &&
    d034CorpusManifestHarness.benchmarkExecutionAuthorized === false &&
    d034CorpusManifestHarness.benchmarkExecutionStarted === false &&
    d034CorpusManifestHarness.benchmarkResultRecorded === false &&
    d034CorpusManifestHarness.deviceBenchmarkPassed === false &&
    d034CorpusManifestHarness.namedSecurityReviewerAssigned === false &&
    d034CorpusManifestHarness.namedQaReviewerAssigned === false &&
    d034CorpusManifestHarness.independentReviewPassed === false &&
    d034CorpusManifestHarness.ownerIntakeChanged === false &&
    d034CorpusManifestHarness.externalMessageSent === false &&
    d034CorpusManifestHarness.ownerCardScheduled === false &&
    d034CorpusManifestHarness.ownerReviewAuthorized === false &&
    d034CorpusManifestHarness.ownerChoiceRecorded === false &&
    d034CorpusManifestHarness.decisionAcceptedRecorded === false &&
    d034CorpusManifestHarness.b05Closed === false &&
    d034CorpusManifestHarness.formalRootProjectAuthorized === false &&
    d034CorpusManifestHarness.nativeIosWorkAuthorized === false &&
    d034CorpusManifestHarness.formalImplementationAuthorized === false &&
    d034CorpusManifestHarness.gateStatesChanged === false
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D034_CORPUS_MANIFEST_GATE", "D-034", "D-034 corpus manifest 本地合同未保持 13 测试/3 档/21 行/19+2/85 槽位/38 边界与 +1、JPEG/摘要/无真实数据凭据/脱敏/不可变边界及 corpus/设备/原生执行/结果/复核/Owner/B05/实现全关闭状态", d034CorpusManifestHarness);
  }

  const d034RunReportContractRecord = latestD034RunReportContractRecord(model);
  const d034RunReportContract = {
    eventId: d034RunReportContractRecord?.eventId ?? null,
    state: d034RunReportContractRecord?.data?.state ?? null,
    contractStatus: d034RunReportContractRecord?.data?.contractStatus ?? null,
    decisionId: d034RunReportContractRecord?.data?.decisionId ?? null,
    decisionState: d034RunReportContractRecord?.data?.decisionState ?? null,
    d039BlockerId: d034RunReportContractRecord?.data?.d039BlockerId ?? null,
    d039BlockerState: d034RunReportContractRecord?.data?.d039BlockerState ?? null,
    protocolEventId: d034RunReportContractRecord?.data?.protocolEventId ?? null,
    corpusManifestHarnessEventId:
      d034RunReportContractRecord?.data?.corpusManifestHarnessEventId ?? null,
    contractArtifactCommit: d034RunReportContractRecord?.data?.contractArtifactCommit ?? null,
    bundleInputSchemaVersion:
      d034RunReportContractRecord?.data?.bundleInputSchemaVersion ?? null,
    runRecordSchemaVersion:
      d034RunReportContractRecord?.data?.runRecordSchemaVersion ?? null,
    profileCount: d034RunReportContractRecord?.data?.profileCount ?? null,
    requiredFixtureSlotMinimum:
      d034RunReportContractRecord?.data?.requiredFixtureSlotMinimum ?? null,
    fixedStageCount: d034RunReportContractRecord?.data?.fixedStageCount ?? null,
    fixedStageOrder: d034RunReportContractRecord?.data?.fixedStageOrder ?? null,
    metricCount: d034RunReportContractRecord?.data?.metricCount ?? null,
    warmupPerFixtureProfileMinimum:
      d034RunReportContractRecord?.data?.warmupPerFixtureProfileMinimum ?? null,
    measuredPerFixtureProfileMinimum:
      d034RunReportContractRecord?.data?.measuredPerFixtureProfileMinimum ?? null,
    minimumCountedWarmupRunCount:
      d034RunReportContractRecord?.data?.minimumCountedWarmupRunCount ?? null,
    minimumCountedMeasuredRunCount:
      d034RunReportContractRecord?.data?.minimumCountedMeasuredRunCount ?? null,
    profileOrderRotationCount:
      d034RunReportContractRecord?.data?.profileOrderRotationCount ?? null,
    wholeGroupThermalDiscardRequired:
      d034RunReportContractRecord?.data?.wholeGroupThermalDiscardRequired ?? null,
    discardedRecordsRetained:
      d034RunReportContractRecord?.data?.discardedRecordsRetained ?? null,
    retryUsesNewRunId: d034RunReportContractRecord?.data?.retryUsesNewRunId ?? null,
    failedRecordsRetained:
      d034RunReportContractRecord?.data?.failedRecordsRetained ?? null,
    rawRunValuesRequired: d034RunReportContractRecord?.data?.rawRunValuesRequired ?? null,
    aggregatesRecomputedFromCountedMeasuredRuns:
      d034RunReportContractRecord?.data?.aggregatesRecomputedFromCountedMeasuredRuns ?? null,
    summaryStatistics: d034RunReportContractRecord?.data?.summaryStatistics ?? null,
    p95Algorithm: d034RunReportContractRecord?.data?.p95Algorithm ?? null,
    benchmarkPassDispositionAllowed:
      d034RunReportContractRecord?.data?.benchmarkPassDispositionAllowed ?? null,
    independentReviewCallerAssertedNotVerified:
      d034RunReportContractRecord?.data?.independentReviewCallerAssertedNotVerified ?? null,
    containsRealUserDataAllowed:
      d034RunReportContractRecord?.data?.containsRealUserDataAllowed ?? null,
    containsCredentialAllowed:
      d034RunReportContractRecord?.data?.containsCredentialAllowed ?? null,
    sensitivePayloadOrSecretAllowed:
      d034RunReportContractRecord?.data?.sensitivePayloadOrSecretAllowed ?? null,
    contractValidatorImplemented:
      d034RunReportContractRecord?.data?.contractValidatorImplemented ?? null,
    syntheticContractFixtureIsBenchmarkEvidence:
      d034RunReportContractRecord?.data?.syntheticContractFixtureIsBenchmarkEvidence ?? null,
    rawRunRecordCount: d034RunReportContractRecord?.data?.rawRunRecordCount ?? null,
    benchmarkReportRecorded:
      d034RunReportContractRecord?.data?.benchmarkReportRecorded ?? null,
    minimumPhysicalDeviceResolved:
      d034RunReportContractRecord?.data?.minimumPhysicalDeviceResolved ?? null,
    macAndSupportedXcodeAvailable:
      d034RunReportContractRecord?.data?.macAndSupportedXcodeAvailable ?? null,
    isolatedNativeHarnessAuthorized:
      d034RunReportContractRecord?.data?.isolatedNativeHarnessAuthorized ?? null,
    corpusMaterialized: d034RunReportContractRecord?.data?.corpusMaterialized ?? null,
    benchmarkExecutionAuthorized:
      d034RunReportContractRecord?.data?.benchmarkExecutionAuthorized ?? null,
    benchmarkExecutionStarted:
      d034RunReportContractRecord?.data?.benchmarkExecutionStarted ?? null,
    benchmarkResultRecorded:
      d034RunReportContractRecord?.data?.benchmarkResultRecorded ?? null,
    deviceBenchmarkPassed: d034RunReportContractRecord?.data?.deviceBenchmarkPassed ?? null,
    independentReviewPassed:
      d034RunReportContractRecord?.data?.independentReviewPassed ?? null,
    ownerReviewAuthorized:
      d034RunReportContractRecord?.data?.ownerReviewAuthorized ?? null,
    b05Closed: d034RunReportContractRecord?.data?.b05Closed ?? null,
    formalImplementationAuthorized:
      d034RunReportContractRecord?.data?.formalImplementationAuthorized ?? null,
    gateStatesChanged: d034RunReportContractRecord?.data?.gateStatesChanged ?? null,
  };
  if (!(
    d034RunReportContract.eventId === "EVT-20260821-016" &&
    d034RunReportContract.state === "completed" &&
    d034RunReportContract.contractStatus === "CONTRACT_READY / NO_RUNS / NO_REPORT / EXECUTION_NOT_AUTHORIZED" &&
    d034RunReportContract.decisionId === "D-034" &&
    d034RunReportContract.decisionState === "CANDIDATE" &&
    d034RunReportContract.d039BlockerId === "D039-PX5-B05" &&
    d034RunReportContract.d039BlockerState === "OPEN" &&
    d034RunReportContract.protocolEventId === "EVT-20260821-010" &&
    d034RunReportContract.corpusManifestHarnessEventId === "EVT-20260821-015" &&
    d034RunReportContract.contractArtifactCommit === "27bfcf74b9739ee4a51e79bf2731845de7ca0cc7" &&
    d034RunReportContract.bundleInputSchemaVersion === "D034_BENCHMARK_RUN_REPORT_BUNDLE_INPUT_V1" &&
    d034RunReportContract.runRecordSchemaVersion === "D034_BENCHMARK_RUN_RECORD_V1" &&
    d034RunReportContract.profileCount === 3 &&
    d034RunReportContract.requiredFixtureSlotMinimum === 85 &&
    d034RunReportContract.fixedStageCount === 8 &&
    d034RunReportContract.fixedStageOrder === true &&
    d034RunReportContract.metricCount === 14 &&
    d034RunReportContract.warmupPerFixtureProfileMinimum === 3 &&
    d034RunReportContract.measuredPerFixtureProfileMinimum === 10 &&
    d034RunReportContract.minimumCountedWarmupRunCount === 765 &&
    d034RunReportContract.minimumCountedMeasuredRunCount === 2550 &&
    d034RunReportContract.profileOrderRotationCount === 3 &&
    d034RunReportContract.wholeGroupThermalDiscardRequired === true &&
    d034RunReportContract.discardedRecordsRetained === true &&
    d034RunReportContract.retryUsesNewRunId === true &&
    d034RunReportContract.failedRecordsRetained === true &&
    d034RunReportContract.rawRunValuesRequired === true &&
    d034RunReportContract.aggregatesRecomputedFromCountedMeasuredRuns === true &&
    JSON.stringify(d034RunReportContract.summaryStatistics) === JSON.stringify(["minimum", "median", "p95", "maximum"]) &&
    d034RunReportContract.p95Algorithm === "NEAREST_RANK_CEIL_0_95_N_MINUS_1" &&
    d034RunReportContract.benchmarkPassDispositionAllowed === false &&
    d034RunReportContract.independentReviewCallerAssertedNotVerified === true &&
    d034RunReportContract.containsRealUserDataAllowed === false &&
    d034RunReportContract.containsCredentialAllowed === false &&
    d034RunReportContract.sensitivePayloadOrSecretAllowed === false &&
    d034RunReportContract.contractValidatorImplemented === false &&
    d034RunReportContract.syntheticContractFixtureIsBenchmarkEvidence === false &&
    d034RunReportContract.rawRunRecordCount === 0 &&
    d034RunReportContract.benchmarkReportRecorded === false &&
    d034RunReportContract.minimumPhysicalDeviceResolved === false &&
    d034RunReportContract.macAndSupportedXcodeAvailable === false &&
    d034RunReportContract.isolatedNativeHarnessAuthorized === false &&
    d034RunReportContract.corpusMaterialized === false &&
    d034RunReportContract.benchmarkExecutionAuthorized === false &&
    d034RunReportContract.benchmarkExecutionStarted === false &&
    d034RunReportContract.benchmarkResultRecorded === false &&
    d034RunReportContract.deviceBenchmarkPassed === false &&
    d034RunReportContract.independentReviewPassed === false &&
    d034RunReportContract.ownerReviewAuthorized === false &&
    d034RunReportContract.b05Closed === false &&
    d034RunReportContract.formalImplementationAuthorized === false &&
    d034RunReportContract.gateStatesChanged === false
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D034_RUN_REPORT_CONTRACT_GATE", "D-034", "D-034 raw run/report 合同未保持 3 档/8 阶段/14 指标、765 warm-up/2550 measured、整组丢弃/重试保留、raw 聚合/p95/pass 边界及 validator/run/report/corpus/设备/执行/复核/Owner/B05/实现全关闭状态", d034RunReportContract);
  }

  const d034RunReportHarnessRecord = latestD034RunReportHarnessRecord(model);
  const d034RunReportHarness = {
    eventId: d034RunReportHarnessRecord?.eventId ?? null,
    state: d034RunReportHarnessRecord?.data?.state ?? null,
    contractStatus: d034RunReportHarnessRecord?.data?.contractStatus ?? null,
    decisionId: d034RunReportHarnessRecord?.data?.decisionId ?? null,
    decisionState: d034RunReportHarnessRecord?.data?.decisionState ?? null,
    d039BlockerId: d034RunReportHarnessRecord?.data?.d039BlockerId ?? null,
    d039BlockerState: d034RunReportHarnessRecord?.data?.d039BlockerState ?? null,
    contractEventId: d034RunReportHarnessRecord?.data?.contractEventId ?? null,
    artifactCommit: d034RunReportHarnessRecord?.data?.artifactCommit ?? null,
    topLevelTests: d034RunReportHarnessRecord?.data?.topLevelTests ?? null,
    fullSuitePassed: d034RunReportHarnessRecord?.data?.fullSuitePassed ?? null,
    profileCount: d034RunReportHarnessRecord?.data?.profileCount ?? null,
    fixedStageCount: d034RunReportHarnessRecord?.data?.fixedStageCount ?? null,
    metricCount: d034RunReportHarnessRecord?.data?.metricCount ?? null,
    minimumRequiredFixtureSlotCount:
      d034RunReportHarnessRecord?.data?.minimumRequiredFixtureSlotCount ?? null,
    minimumCountedWarmupRunCount:
      d034RunReportHarnessRecord?.data?.minimumCountedWarmupRunCount ?? null,
    minimumCountedMeasuredRunCount:
      d034RunReportHarnessRecord?.data?.minimumCountedMeasuredRunCount ?? null,
    profileOrderRotationCount:
      d034RunReportHarnessRecord?.data?.profileOrderRotationCount ?? null,
    syntheticFixtureCount: d034RunReportHarnessRecord?.data?.syntheticFixtureCount ?? null,
    syntheticRawRunRecordCount:
      d034RunReportHarnessRecord?.data?.syntheticRawRunRecordCount ?? null,
    syntheticCountedWarmupRunCount:
      d034RunReportHarnessRecord?.data?.syntheticCountedWarmupRunCount ?? null,
    syntheticCountedMeasuredRunCount:
      d034RunReportHarnessRecord?.data?.syntheticCountedMeasuredRunCount ?? null,
    syntheticContractFixtureOnly:
      d034RunReportHarnessRecord?.data?.syntheticContractFixtureOnly ?? null,
    syntheticContractFixtureIsBenchmarkEvidence:
      d034RunReportHarnessRecord?.data?.syntheticContractFixtureIsBenchmarkEvidence ?? null,
    wholeGroupThermalDiscardRequired:
      d034RunReportHarnessRecord?.data?.wholeGroupThermalDiscardRequired ?? null,
    discardedRecordsRetained:
      d034RunReportHarnessRecord?.data?.discardedRecordsRetained ?? null,
    retryUsesNewRunAndGroupIds:
      d034RunReportHarnessRecord?.data?.retryUsesNewRunAndGroupIds ?? null,
    rawRunValuesRequired: d034RunReportHarnessRecord?.data?.rawRunValuesRequired ?? null,
    aggregatesRecomputedFromCountedMeasuredRuns:
      d034RunReportHarnessRecord?.data?.aggregatesRecomputedFromCountedMeasuredRuns ?? null,
    p95Algorithm: d034RunReportHarnessRecord?.data?.p95Algorithm ?? null,
    structuralDisposition: d034RunReportHarnessRecord?.data?.structuralDisposition ?? null,
    benchmarkPassDispositionAllowed:
      d034RunReportHarnessRecord?.data?.benchmarkPassDispositionAllowed ?? null,
    benchmarkPassReturned: d034RunReportHarnessRecord?.data?.benchmarkPassReturned ?? null,
    sensitiveLookingMaterialRejectedWithoutEcho:
      d034RunReportHarnessRecord?.data?.sensitiveLookingMaterialRejectedWithoutEcho ?? null,
    immutableNormalizationAndResultFingerprintBound:
      d034RunReportHarnessRecord?.data?.immutableNormalizationAndResultFingerprintBound ?? null,
    contractValidatorImplemented:
      d034RunReportHarnessRecord?.data?.contractValidatorImplemented ?? null,
    rawRunRecordReads: d034RunReportHarnessRecord?.data?.rawRunRecordReads ?? null,
    rawRunRecordWrites: d034RunReportHarnessRecord?.data?.rawRunRecordWrites ?? null,
    rawRunRecordCount: d034RunReportHarnessRecord?.data?.rawRunRecordCount ?? null,
    benchmarkReportRecorded:
      d034RunReportHarnessRecord?.data?.benchmarkReportRecorded ?? null,
    minimumPhysicalDeviceResolved:
      d034RunReportHarnessRecord?.data?.minimumPhysicalDeviceResolved ?? null,
    macAndSupportedXcodeAvailable:
      d034RunReportHarnessRecord?.data?.macAndSupportedXcodeAvailable ?? null,
    isolatedNativeHarnessAuthorized:
      d034RunReportHarnessRecord?.data?.isolatedNativeHarnessAuthorized ?? null,
    corpusMaterialized: d034RunReportHarnessRecord?.data?.corpusMaterialized ?? null,
    benchmarkExecutionAuthorized:
      d034RunReportHarnessRecord?.data?.benchmarkExecutionAuthorized ?? null,
    benchmarkExecutionStarted:
      d034RunReportHarnessRecord?.data?.benchmarkExecutionStarted ?? null,
    benchmarkResultRecorded:
      d034RunReportHarnessRecord?.data?.benchmarkResultRecorded ?? null,
    deviceBenchmarkPassed: d034RunReportHarnessRecord?.data?.deviceBenchmarkPassed ?? null,
    independentReviewPassed:
      d034RunReportHarnessRecord?.data?.independentReviewPassed ?? null,
    ownerReviewAuthorized:
      d034RunReportHarnessRecord?.data?.ownerReviewAuthorized ?? null,
    b05Closed: d034RunReportHarnessRecord?.data?.b05Closed ?? null,
    formalImplementationAuthorized:
      d034RunReportHarnessRecord?.data?.formalImplementationAuthorized ?? null,
    networkRequests: d034RunReportHarnessRecord?.data?.networkRequests ?? null,
    providerRequests: d034RunReportHarnessRecord?.data?.providerRequests ?? null,
    businessWrites: d034RunReportHarnessRecord?.data?.businessWrites ?? null,
    gateStatesChanged: d034RunReportHarnessRecord?.data?.gateStatesChanged ?? null,
  };
  if (!(
    d034RunReportHarness.eventId === "EVT-20260821-017" &&
    d034RunReportHarness.state === "completed" &&
    d034RunReportHarness.contractStatus === "SPIKE / LOCAL_ONLY / NON_PRODUCTION" &&
    d034RunReportHarness.decisionId === "D-034" &&
    d034RunReportHarness.decisionState === "CANDIDATE" &&
    d034RunReportHarness.d039BlockerId === "D039-PX5-B05" &&
    d034RunReportHarness.d039BlockerState === "OPEN" &&
    d034RunReportHarness.contractEventId === "EVT-20260821-016" &&
    d034RunReportHarness.artifactCommit === "b56f4d33d9de0e045dbdab4aa14a4cd588fbaaa4" &&
    d034RunReportHarness.topLevelTests === 17 &&
    d034RunReportHarness.fullSuitePassed === 972 &&
    d034RunReportHarness.profileCount === 3 &&
    d034RunReportHarness.fixedStageCount === 8 &&
    d034RunReportHarness.metricCount === 14 &&
    d034RunReportHarness.minimumRequiredFixtureSlotCount === 85 &&
    d034RunReportHarness.minimumCountedWarmupRunCount === 765 &&
    d034RunReportHarness.minimumCountedMeasuredRunCount === 2550 &&
    d034RunReportHarness.profileOrderRotationCount === 3 &&
    d034RunReportHarness.syntheticFixtureCount === 1 &&
    d034RunReportHarness.syntheticRawRunRecordCount === 39 &&
    d034RunReportHarness.syntheticCountedWarmupRunCount === 9 &&
    d034RunReportHarness.syntheticCountedMeasuredRunCount === 30 &&
    d034RunReportHarness.syntheticContractFixtureOnly === true &&
    d034RunReportHarness.syntheticContractFixtureIsBenchmarkEvidence === false &&
    d034RunReportHarness.wholeGroupThermalDiscardRequired === true &&
    d034RunReportHarness.discardedRecordsRetained === true &&
    d034RunReportHarness.retryUsesNewRunAndGroupIds === true &&
    d034RunReportHarness.rawRunValuesRequired === true &&
    d034RunReportHarness.aggregatesRecomputedFromCountedMeasuredRuns === true &&
    d034RunReportHarness.p95Algorithm === "NEAREST_RANK_CEIL_0_95_N_MINUS_1" &&
    d034RunReportHarness.structuralDisposition === "STRUCTURALLY_COMPLETE_REPORT_ONLY" &&
    d034RunReportHarness.benchmarkPassDispositionAllowed === false &&
    d034RunReportHarness.benchmarkPassReturned === false &&
    d034RunReportHarness.sensitiveLookingMaterialRejectedWithoutEcho === true &&
    d034RunReportHarness.immutableNormalizationAndResultFingerprintBound === true &&
    d034RunReportHarness.contractValidatorImplemented === true &&
    d034RunReportHarness.rawRunRecordReads === 0 &&
    d034RunReportHarness.rawRunRecordWrites === 0 &&
    d034RunReportHarness.rawRunRecordCount === 0 &&
    d034RunReportHarness.benchmarkReportRecorded === false &&
    d034RunReportHarness.minimumPhysicalDeviceResolved === false &&
    d034RunReportHarness.macAndSupportedXcodeAvailable === false &&
    d034RunReportHarness.isolatedNativeHarnessAuthorized === false &&
    d034RunReportHarness.corpusMaterialized === false &&
    d034RunReportHarness.benchmarkExecutionAuthorized === false &&
    d034RunReportHarness.benchmarkExecutionStarted === false &&
    d034RunReportHarness.benchmarkResultRecorded === false &&
    d034RunReportHarness.deviceBenchmarkPassed === false &&
    d034RunReportHarness.independentReviewPassed === false &&
    d034RunReportHarness.ownerReviewAuthorized === false &&
    d034RunReportHarness.b05Closed === false &&
    d034RunReportHarness.formalImplementationAuthorized === false &&
    d034RunReportHarness.networkRequests === 0 &&
    d034RunReportHarness.providerRequests === 0 &&
    d034RunReportHarness.businessWrites === 0 &&
    d034RunReportHarness.gateStatesChanged === false
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D034_RUN_REPORT_HARNESS_GATE", "D-034", "D-034 raw run/report 本地 validator 未保持 17 测试、3/8/14、765/2550、39 条合成记录非证据、整组丢弃/新 ID 重试、raw 聚合/p95/pass/脱敏边界及实际 run/report/corpus/设备/执行/复核/Owner/B05/实现全关闭状态", d034RunReportHarness);
  }

  const d039IndependentReviewRecordHarnessRecord =
    latestD039IndependentReviewRecordHarness(model);
  const d039IndependentReviewRecordHarness = {
    ...(d039IndependentReviewRecordHarnessRecord?.data ?? {}),
    eventId: d039IndependentReviewRecordHarnessRecord?.eventId ?? null,
  };
  const expectedD039IndependentReviewRecordHarness = {
    eventId: "EVT-20260822-001",
    state: "completed",
    contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    decisionId: "D-039",
    decisionState: "ACCEPTED",
    selectedOption: "A",
    designBaselineState: "PX-4_BASELINE_FROZEN",
    px5Disposition: "NOT_READY",
    d039BlockerIds: ["D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05"],
    d039BlockerStates: ["OPEN", "OPEN", "OPEN"],
    packetId: "D039-B03-B05-INDEPENDENT-REVIEW-PACKET-001",
    packetVersion: "PACKET-001-R1",
    inputManifestEventId: "EVT-20260821-009",
    manifestCommit: "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117",
    manifestRecordCommit: "19f2119abcd8ca25bf59b177910a5af1f34e9abb",
    packetArtifactBlobOid: "d96a28560fa20399260ee3522a0fc2c21465220b",
    packetArtifactSha256: "580c1a4849e99580127afb47faa0c96407ff8913e6c2dda177c2147135a88ad1",
    contractArtifactCommit: "8f2d0e00af3284851387b01bd275bf08afffc9ad",
    contractClarificationCommit: "fbbc1ad0fd8c0ec4a6ba4206238bb02a9591c1c0",
    artifactCommit: "e590235104d13dcad34521be4b41ea740f801519",
    implementationBlobOid: "fbb07d4772949c1c783a336700ab81c94747b7f1",
    testBlobOid: "b066292db53060fda5ef6b72e176f736a6a98e23",
    documentationBlobOid: "6f30c89bc3630c21077e801a4f48b4cc992c4183",
    inputSchemaVersion: "D039_B03_B05_INDEPENDENT_REVIEW_BUNDLE_INPUT_V1",
    resultSchemaVersion: "D039_B03_B05_INDEPENDENT_REVIEW_RESULT_V1",
    boundarySchemaVersion: "D039_B03_B05_INDEPENDENT_REVIEW_BOUNDARY_V1",
    topLevelTests: 20,
    fullSuitePassed: 996,
    requiredArtifactCount: 10,
    requiredReviewerDomainCount: 4,
    requiredCardCount: 6,
    requiredCrossCardInvariantCount: 16,
    allowedCardDispositionCount: 4,
    severityCount: 4,
    recordKinds: ["FORMAL_REVIEW_RECORD", "SYNTHETIC_CONTRACT_FIXTURE"],
    overallDispositions: [
      "INDEPENDENT_REVIEW_PASS_CANDIDATE",
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
    ],
    dispositionPriority: [
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
      "INDEPENDENT_REVIEW_PASS_CANDIDATE",
    ],
    formalStructuralDisposition: "STRUCTURALLY_COMPLETE_REVIEW_ONLY",
    syntheticStructuralDisposition: "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY",
    syntheticWouldBePassCandidateCovered: true,
    syntheticIndependentReviewPassCandidateReturned: false,
    formalIndependentReviewPassCandidateCanBeReturned: true,
    independentReviewPassedReturned: false,
    strictDataTreeAndExactFields: true,
    frozenArtifactIdentityExact: true,
    reviewerDomainCoverageRecomputed: true,
    cardAndFindingBidirectionalReferencesRequired: true,
    openP0P1P2Block: true,
    openP3RequiresOwnerDueAtAndRationale: true,
    reviewContentSha256Required: true,
    attestationsBindReviewContentSha256: true,
    bundleSha256Required: true,
    sensitiveLookingMaterialRejectedWithoutEcho: true,
    immutableNormalizationAndResultFingerprintBound: true,
    reviewerIdentityClaimsCallerAssertedNotVerified: true,
    reviewerIndependenceClaimsCallerAssertedNotVerified: true,
    signatureReferencesCallerAssertedNotVerified: true,
    contractValidatorImplemented: true,
    harnessReadsCallerSuppliedDataOnly: true,
    formalReviewRecordCount: 0,
    reviewerAttestationRecordCount: 0,
    syntheticFixturePersistedCount: 0,
    gitReads: 0,
    fileReads: 0,
    fileWrites: 0,
    signatureArtifactReads: 0,
    identityDocumentReads: 0,
    networkRequests: 0,
    providerRequests: 0,
    externalMessagesSent: 0,
    businessWrites: 0,
    reviewersAssigned: false,
    reviewerIdentityVerified: false,
    reviewerIndependenceVerified: false,
    reviewerSignatureVerified: false,
    independentReviewStarted: false,
    independentReviewPassed: false,
    ownerIntakeChanged: false,
    ownerCardsScheduled: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    decisionAcceptedRecorded: false,
    b03Closed: false,
    b04Closed: false,
    b05Closed: false,
    px5ImplementationDorSatisfied: false,
    formalRootProjectAuthorized: false,
    nativeIosWorkAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
  };
  if (
    Object.entries(expectedD039IndependentReviewRecordHarness).some(
      ([key, value]) =>
        JSON.stringify(d039IndependentReviewRecordHarness[key]) !== JSON.stringify(value),
    )
  ) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D039_INDEPENDENT_REVIEW_RECORD_HARNESS_GATE",
      "D-039",
      "D-039 B03~B05 独立复核回执 validator 未保持 frozen packet/四域/六卡/16 不变量/P0~P3/disposition/双 SHA-256 合同、合成 fixture 非证据，以及正式回执/复核人/签署/PASS/Owner/B03~B05/PX-5/实现全关闭状态",
      d039IndependentReviewRecordHarness,
    );
  }

  const d040ChinaHealthReviewRecordHarnessRecord =
    latestD040ChinaHealthReviewRecordHarness(model);
  const d040ChinaHealthReviewRecordHarness = {
    ...(d040ChinaHealthReviewRecordHarnessRecord?.data ?? {}),
    eventId: d040ChinaHealthReviewRecordHarnessRecord?.eventId ?? null,
  };
  const expectedD040ChinaHealthReviewRecordHarness = {
    eventId: "EVT-20260822-002",
    state: "completed",
    contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    decisionId: "D-040",
    decisionState: "CANDIDATE",
    authoritativeState: "PX-0_INPUT_GAP",
    next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
    packetId: "D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001",
    packetVersion: "PACKET-001-R1",
    packetEventId: "EVT-20260820-008",
    inputCommit: "5c32cfb2083bbe904c458b68d92a97e1f8479ce5",
    packetArtifactCommit: "0fd261ebf886a6d4c71042655ec1e28c9ba85bb0",
    packetArtifactBlobOid: "89f66cb38da0cd2865a343ac471e1cbe63de92c8",
    packetArtifactSha256: "7e48fa29be626429b63c31492d37b710f8f873d5f079aeb5c70dee918bf5f110",
    contractArtifactCommit: "d12568d666afde6c92898e87eff6b9e31afc7737",
    partialQualificationClarificationCommit: "f2fce28553e0a95fb24e1ea8af2cea29c79db185",
    outOfScopeClarificationCommit: "8be3081fd351724711dfa6d80732155ff2b0ca7e",
    contractBlobOid: "af1cf592e00311e00565d8c064ba46dcf0c67cc8",
    artifactCommit: "37a50eb2b2fec448ee205707f204dfca16ae1c6c",
    implementationBlobOid: "800576171f2173afdd897f39763a8cc9d3d44f8c",
    testBlobOid: "b260d59823bba23101b90284b05c0fe6118bfec1",
    documentationBlobOid: "fb388df4149b02b86fa582d6adcebfc9e990ab5f",
    inputSchemaVersion: "D040_CHINA_HEALTH_REVIEW_BUNDLE_INPUT_V1",
    resultSchemaVersion: "D040_CHINA_HEALTH_REVIEW_RESULT_V1",
    boundarySchemaVersion: "D040_CHINA_HEALTH_REVIEW_BOUNDARY_V1",
    topLevelTests: 20,
    fullSuitePassed: 1020,
    requiredArtifactCount: 9,
    requiredReviewItemCount: 13,
    copyReviewItemCount: 6,
    boundaryReviewItemCount: 7,
    allowedItemDispositionCount: 4,
    severityCount: 4,
    maximumReviewIntervalDays: 90,
    recordKinds: ["FORMAL_HEALTH_REVIEW_RECORD", "SYNTHETIC_CONTRACT_FIXTURE"],
    overallDispositions: [
      "HEALTH_REVIEW_APPROVAL_CANDIDATE",
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
    ],
    dispositionPriority: [
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
      "HEALTH_REVIEW_APPROVAL_CANDIDATE",
    ],
    formalStructuralDisposition: "STRUCTURALLY_COMPLETE_HEALTH_REVIEW_ONLY",
    syntheticStructuralDisposition: "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY",
    syntheticWouldBeApprovalCandidateCovered: true,
    syntheticHealthReviewApprovalCandidateReturned: false,
    formalHealthReviewApprovalCandidateCanBeReturned: true,
    healthContentApprovedReturned: false,
    contentQaPassedReturned: false,
    strictDataTreeAndExactFields: true,
    frozenArtifactIdentityExact: true,
    qualificationObservationNullSemanticsExact: true,
    reviewerScopeAndOutOfScopeBoundaryExact: true,
    itemAndFindingBidirectionalReferencesRequired: true,
    openP0P1P2Block: true,
    openP3RequiresOwnerDueAtAndRationale: true,
    reviewIntervalMaximumHours: 2160,
    reviewContentSha256Required: true,
    attestationBindsReviewContentSha256: true,
    bundleSha256Required: true,
    sensitiveLookingMaterialRejectedWithoutEcho: true,
    immutableNormalizationAndResultFingerprintBound: true,
    reviewerIdentityClaimsCallerAssertedNotVerified: true,
    reviewerQualificationClaimsCallerAssertedNotVerified: true,
    reviewerCompetenceClaimsCallerAssertedNotVerified: true,
    reviewerLocaleFitClaimsCallerAssertedNotVerified: true,
    signatureReferencesCallerAssertedNotVerified: true,
    contractValidatorImplemented: true,
    harnessReadsCallerSuppliedDataOnly: true,
    formalHealthReviewRecordCount: 0,
    reviewerAttestationRecordCount: 0,
    syntheticFixturePersistedCount: 0,
    gitReads: 0,
    fileReads: 0,
    fileWrites: 0,
    identityDocumentReads: 0,
    qualificationRegistryReads: 0,
    signatureArtifactReads: 0,
    networkRequests: 0,
    providerRequests: 0,
    externalMessagesSent: 0,
    businessWrites: 0,
    reviewerAssigned: false,
    reviewerIdentityVerified: false,
    reviewerQualificationVerified: false,
    reviewerCompetenceVerified: false,
    reviewerLocaleFitVerified: false,
    reviewerSignatureVerified: false,
    healthReviewStarted: false,
    healthContentApproved: false,
    contentQaPassed: false,
    d068OwnerReady: false,
    d069OwnerReady: false,
    d063OwnerReady: false,
    firstThreeBatchesIndependentReviewPassed: false,
    ownerIntakeChanged: false,
    ownerCardScheduled: false,
    px1Authorized: false,
    px2Authorized: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    decisionAcceptedRecorded: false,
    healthCopyImplementationAuthorized: false,
    formulaImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
  };
  if (
    Object.entries(expectedD040ChinaHealthReviewRecordHarness).some(
      ([key, value]) =>
        JSON.stringify(d040ChinaHealthReviewRecordHarness[key]) !== JSON.stringify(value),
    )
  ) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D040_CHINA_HEALTH_REVIEW_RECORD_HARNESS_GATE",
      "D-040",
      "D-040 中国健康评审回执 validator 未保持 frozen packet/九输入/具名资质/胜任范围/地域/冲突/签署声明/十三项/P0~P3/90 天/disposition/双 SHA-256 合同、合成 fixture 非证据，以及正式回执/评审人/健康批准/Content QA/Owner/PX/实现全关闭状态",
      d040ChinaHealthReviewRecordHarness,
    );
  }

  const d040FirstThreeBatchesIndependentReviewRecordHarnessRecord =
    latestD040FirstThreeBatchesIndependentReviewRecordHarness(model);
  const d040FirstThreeBatchesIndependentReviewRecordHarness = {
    ...(d040FirstThreeBatchesIndependentReviewRecordHarnessRecord?.data ?? {}),
    eventId: d040FirstThreeBatchesIndependentReviewRecordHarnessRecord?.eventId ?? null,
  };
  const expectedD040FirstThreeBatchesIndependentReviewRecordHarness = {
    "eventId": "EVT-20260822-003",
    "state": "completed",
    "contractStatus": "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    "decisionId": "D-040",
    "decisionState": "CANDIDATE",
    "authoritativeState": "PX-0_INPUT_GAP",
    "next": "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
    "packetId": "D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-PACKET-001",
    "packetVersion": "PACKET-001-R1",
    "packetEventId": "EVT-20260821-001",
    "inputCommit": "b39a8f09ae544d7c3276f532b536c67ade75b446",
    "packetArtifactCommit": "3d63bafdcf82b588a3d344c9a4185bd8edabadec",
    "packetArtifactBlobOid": "8ed92648876431cdd30ffc047d83fd6e8a05dd88",
    "packetArtifactSha256": "1f632603de373ef10af07d1da9513d0822a7b01f4890fcff12d907aaf57e7a06",
    "contractArtifactCommit": "1dd3a631175fb9abb5813a22e19fee1339cf9517",
    "contractBlobOid": "c722c789c6300a3934de822c6057d79e7349bf52",
    "artifactCommit": "f6ac70b7b313fdbffd95061d177013bd28ca34ca",
    "implementationBlobOid": "e633d7b9646384e50276d4d24e9406f12bca3e60",
    "testBlobOid": "e14eb86c206658e8c1b362891c77d5beab56d324",
    "documentationBlobOid": "379e99c825f357303e58744462e810e7001ff17f",
    "inputSchemaVersion": "D040_FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_BUNDLE_INPUT_V1",
    "resultSchemaVersion": "D040_FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_RESULT_V1",
    "boundarySchemaVersion": "D040_FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_BOUNDARY_V1",
    "topLevelTests": 20,
    "fullSuitePassed": 1044,
    "requiredArtifactCount": 7,
    "requiredReviewerDomainCount": 4,
    "requiredCardCount": 13,
    "requiredCrossBatchInvariantCount": 12,
    "allowedCardDispositionCount": 4,
    "severityCount": 4,
    "recordKinds": [
      "FORMAL_REVIEW_RECORD",
      "SYNTHETIC_CONTRACT_FIXTURE"
    ],
    "overallDispositions": [
      "INDEPENDENT_REVIEW_PASS_CANDIDATE",
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE"
    ],
    "dispositionPriority": [
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
      "INDEPENDENT_REVIEW_PASS_CANDIDATE"
    ],
    "formalStructuralDisposition": "STRUCTURALLY_COMPLETE_REVIEW_ONLY",
    "syntheticStructuralDisposition": "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY",
    "syntheticWouldBePassCandidateCovered": true,
    "syntheticIndependentReviewPassCandidateReturned": false,
    "formalIndependentReviewPassCandidateCanBeReturned": true,
    "firstThreeBatchesIndependentReviewPassedReturned": false,
    "strictDataTreeAndExactFields": true,
    "frozenArtifactIdentityExact": true,
    "reviewerDomainCoverageRecomputed": true,
    "cardAndFindingBidirectionalReferencesRequired": true,
    "openP0P1P2Block": true,
    "openP3RequiresOwnerDueAtAndRationale": true,
    "reviewContentSha256Required": true,
    "attestationsBindReviewContentSha256": true,
    "bundleSha256Required": true,
    "sensitiveLookingMaterialRejectedWithoutEcho": true,
    "immutableNormalizationAndResultFingerprintBound": true,
    "reviewerIdentityClaimsCallerAssertedNotVerified": true,
    "reviewerIndependenceClaimsCallerAssertedNotVerified": true,
    "reviewerCompetenceClaimsCallerAssertedNotVerified": true,
    "signatureReferencesCallerAssertedNotVerified": true,
    "contractValidatorImplemented": true,
    "harnessReadsCallerSuppliedDataOnly": true,
    "formalReviewRecordCount": 0,
    "reviewerAttestationRecordCount": 0,
    "syntheticFixturePersistedCount": 0,
    "gitReads": 0,
    "fileReads": 0,
    "fileWrites": 0,
    "identityDocumentReads": 0,
    "competenceEvidenceReads": 0,
    "signatureArtifactReads": 0,
    "networkRequests": 0,
    "providerRequests": 0,
    "externalMessagesSent": 0,
    "businessWrites": 0,
    "reviewersAssigned": false,
    "reviewerIdentityVerified": false,
    "reviewerIndependenceVerified": false,
    "reviewerCompetenceVerified": false,
    "reviewerSignatureVerified": false,
    "independentReviewStarted": false,
    "firstThreeBatchesIndependentReviewPassed": false,
    "dynamicModelOptionOwnerReady": false,
    "modelNativeNumericPalOptionOwnerReady": false,
    "healthReviewStillRequired": true,
    "healthContentApproved": false,
    "contentQaPassed": false,
    "ownerIntakeChanged": false,
    "ownerCardScheduled": false,
    "px1Authorized": false,
    "px2Authorized": false,
    "ownerReviewAuthorized": false,
    "ownerChoiceRecorded": false,
    "decisionAcceptedRecorded": false,
    "formulaImplementationAuthorized": false,
    "persistenceImplementationAuthorized": false,
    "formalRootProjectAuthorized": false,
    "nativeIosWorkAuthorized": false,
    "formalImplementationAuthorized": false,
    "gateStatesChanged": false
  };
  if (
    Object.entries(expectedD040FirstThreeBatchesIndependentReviewRecordHarness).some(
      ([key, value]) =>
        JSON.stringify(d040FirstThreeBatchesIndependentReviewRecordHarness[key]) !==
        JSON.stringify(value),
    )
  ) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D040_FIRST_THREE_BATCHES_REVIEW_RECORD_HARNESS_GATE",
      "D-040",
      "D-040 前三批十三卡独立复核回执 validator 未保持 frozen packet/七输入/四域/十三卡/十二不变量/P0~P3/disposition/双 SHA-256 合同、合成 fixture 非证据，以及正式回执/复核人/独立胜任签署/PASS/动态模型/健康 Content QA/Owner/PX/实现全关闭状态",
      d040FirstThreeBatchesIndependentReviewRecordHarness,
    );
  }

  const d040MacroAxisIndependentReviewRecordHarnessRecord =
    latestD040MacroAxisIndependentReviewRecordHarness(model);
  const d040MacroAxisIndependentReviewRecordHarness = {
    ...(d040MacroAxisIndependentReviewRecordHarnessRecord?.data ?? {}),
    eventId: d040MacroAxisIndependentReviewRecordHarnessRecord?.eventId ?? null,
  };
  const expectedD040MacroAxisIndependentReviewRecordHarness = {
    "eventId": "EVT-20260822-004",
    "state": "completed",
    "contractStatus": "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    "decisionId": "D-040",
    "decisionState": "CANDIDATE",
    "authoritativeState": "PX-0_INPUT_GAP",
    "next": "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
    "packetId": "D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001",
    "packetVersion": "PACKET-001-R1",
    "packetEventId": "EVT-20260821-006",
    "inputManifestEventId": "EVT-20260821-007",
    "inputCommit": "47ba4895dac2535682e8d1a8cb985176d6ad45f7",
    "manifestRecordCommit": "d8e812f1324590d735f809ea994e8aaa2f6805d8",
    "packetArtifactCommit": "d8e812f1324590d735f809ea994e8aaa2f6805d8",
    "packetArtifactBlobOid": "ffa60df7e2204607780cd6ac4044a9da659bef90",
    "packetArtifactSha256": "b94af865ab611bc01e4cb75063d45fb65fcc877b207ea9996b4bacb8849bb060",
    "contractArtifactCommit": "bbb38808d43c4d427759ec3b25d22b11fd5f5e75",
    "contractBlobOid": "f36b6834d747c032b06230a76dc4ec2a689a0e8b",
    "artifactCommit": "eddf66b371e0d037f6781e7d6871c25d88f906f6",
    "implementationBlobOid": "137813c3d628764888da18a89eba57deafdd0ccf",
    "testBlobOid": "afedb6411da53653c580951d5790794a73994c89",
    "documentationBlobOid": "cd9d89188325544a7431153f58689d252f65be87",
    "inputSchemaVersion": "D040_MACRO_AXIS_INDEPENDENT_REVIEW_BUNDLE_INPUT_V1",
    "resultSchemaVersion": "D040_MACRO_AXIS_INDEPENDENT_REVIEW_RESULT_V1",
    "boundarySchemaVersion": "D040_MACRO_AXIS_INDEPENDENT_REVIEW_BOUNDARY_V1",
    "topLevelTests": 20,
    "combinedReviewValidatorTests": 80,
    "fullSuitePassed": 1058,
    "requiredArtifactCount": 10,
    "requiredReviewerDomainCount": 4,
    "requiredCardCount": 4,
    "requiredCrossAxisInvariantCount": 14,
    "allowedCardDispositionCount": 4,
    "severityCount": 4,
    "recordKinds": [
      "FORMAL_REVIEW_RECORD",
      "SYNTHETIC_CONTRACT_FIXTURE"
    ],
    "overallDispositions": [
      "INDEPENDENT_REVIEW_PASS_CANDIDATE",
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE"
    ],
    "dispositionPriority": [
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
      "INDEPENDENT_REVIEW_PASS_CANDIDATE"
    ],
    "formalStructuralDisposition": "STRUCTURALLY_COMPLETE_REVIEW_ONLY",
    "syntheticStructuralDisposition": "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY",
    "syntheticWouldBePassCandidateCovered": true,
    "syntheticIndependentReviewPassCandidateReturned": false,
    "formalIndependentReviewPassCandidateCanBeReturned": true,
    "macroAxisIndependentReviewPassedReturned": false,
    "strictDataTreeAndExactFields": true,
    "frozenArtifactIdentityExact": true,
    "reviewerDomainCoverageRecomputed": true,
    "cardAndFindingBidirectionalReferencesRequired": true,
    "openP0P1P2Block": true,
    "openP3RequiresOwnerDueAtAndRationale": true,
    "reviewContentSha256Required": true,
    "attestationsBindReviewContentSha256": true,
    "bundleSha256Required": true,
    "sensitiveLookingMaterialRejectedWithoutEcho": true,
    "immutableNormalizationAndResultFingerprintBound": true,
    "reviewerIdentityClaimsCallerAssertedNotVerified": true,
    "reviewerIndependenceClaimsCallerAssertedNotVerified": true,
    "reviewerCompetenceClaimsCallerAssertedNotVerified": true,
    "signatureReferencesCallerAssertedNotVerified": true,
    "contractValidatorImplemented": true,
    "harnessReadsCallerSuppliedDataOnly": true,
    "formalReviewRecordCount": 0,
    "reviewerAttestationRecordCount": 0,
    "syntheticFixturePersistedCount": 0,
    "gitReads": 0,
    "fileReads": 0,
    "fileWrites": 0,
    "identityDocumentReads": 0,
    "competenceEvidenceReads": 0,
    "signatureArtifactReads": 0,
    "networkRequests": 0,
    "providerRequests": 0,
    "externalMessagesSent": 0,
    "businessWrites": 0,
    "reviewersAssigned": false,
    "reviewerIdentityVerified": false,
    "reviewerIndependenceVerified": false,
    "reviewerCompetenceVerified": false,
    "reviewerSignatureVerified": false,
    "independentReviewStarted": false,
    "macroAxisIndependentReviewPassed": false,
    "healthReviewStillRequired": true,
    "healthReviewerAssigned": false,
    "healthContentApproved": false,
    "contentQaPassed": false,
    "d063Accepted": false,
    "d070Accepted": false,
    "d063OwnerReady": false,
    "d070OwnerReady": false,
    "d071OwnerReady": false,
    "d072OwnerReady": false,
    "ownerIntakeChanged": false,
    "ownerCardScheduled": false,
    "px1Authorized": false,
    "px2Authorized": false,
    "ownerReviewAuthorized": false,
    "ownerChoiceRecorded": false,
    "decisionAcceptedRecorded": false,
    "goalImplementationAuthorized": false,
    "recordingImplementationAuthorized": false,
    "persistenceImplementationAuthorized": false,
    "formalRootProjectAuthorized": false,
    "nativeIosWorkAuthorized": false,
    "formalImplementationAuthorized": false,
    "gateStatesChanged": false
  };
  if (
    Object.entries(expectedD040MacroAxisIndependentReviewRecordHarness).some(
      ([key, value]) =>
        JSON.stringify(d040MacroAxisIndependentReviewRecordHarness[key]) !==
        JSON.stringify(value),
    )
  ) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D040_MACRO_AXIS_REVIEW_RECORD_HARNESS_GATE",
      "D-040",
      "D-040 四张宏量轴卡独立复核回执 validator 未保持 frozen packet/十输入/四域/四卡/十四不变量/P0~P3/disposition/双 SHA-256 合同、合成 fixture 非证据，以及正式回执/复核人/独立胜任签署/PASS/健康 Content QA/D-063/D-070/四卡 Owner-ready/Owner/PX/实现全关闭状态",
      d040MacroAxisIndependentReviewRecordHarness,
    );
  }
  const d040NiddkLicenseRoutingEvidenceRecord = latestD040NiddkLicenseRoutingEvidence(model);
  const d040NiddkLicenseRoutingEvidence = {
    ...(d040NiddkLicenseRoutingEvidenceRecord?.data ?? {}),
    eventId: d040NiddkLicenseRoutingEvidenceRecord?.eventId ?? null,
  };
  const expectedD040NiddkLicenseRoutingEvidence = {
    eventId: "EVT-20260822-005",
    state: "completed",
    decisionId: "D-040",
    decisionState: "CANDIDATE",
    authoritativeState: "PX-0_INPUT_GAP",
    from: "NIDDK_LICENSE_ROUTING_EVIDENCE_GAP",
    next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
    inputState: "LICENSE_ROUTE_LOCATED_ASSET_COVERAGE_UNCONFIRMED",
    modelFamily: "NIDDK_BODY_WEIGHT_PLANNER_ADULT_DYNAMIC_MODEL",
    artifactCommit: "b5c16332ac42437b019383bff4b93733d0a729fe",
    artifactBlobOid: "15b1a664e1db490697eaa85d8fd56b0f5e7af174",
    officialSourceCount: 3,
    technologyTransferRecordFound: true,
    technologyTransferId: "TAB-2436",
    technologyEId: "E-160-2012-0",
    leadIc: "NIDDK",
    leadInventor: "Kevin Hall",
    developmentStatus: "PROTOTYPE",
    collaborationRoute: "LICENSING",
    officialLicensingContactRoutePresent: true,
    currentSevenAssetCount: 7,
    technologyRecordMapsCurrentSevenAssets: false,
    currentSevenAssetsCoverageConfirmed: false,
    explicitPerFileSoftwareLicenseFound: false,
    stableSemanticReleaseFound: false,
    officialVersionedOracleCorpusFound: false,
    regressionToleranceDefined: false,
    productGuardrailsApproved: false,
    healthReviewerAssigned: false,
    licensingClarificationRequested: false,
    externalMessagesSent: 0,
    formsSubmitted: 0,
    commercialTermsAccepted: false,
    niddkSourceCodeVendored: false,
    niddkRemoteCodeExecuted: false,
    dynamicModelEvidencePassed: false,
    dynamicModelOptionOwnerReady: false,
    modelNativeNumericPalOptionOwnerReady: false,
    ownerIntakeChanged: false,
    ownerCardScheduled: false,
    px1Authorized: false,
    px2Authorized: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    decisionAcceptedRecorded: false,
    formulaImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
  };
  if (
    Object.entries(expectedD040NiddkLicenseRoutingEvidence).some(
      ([key, value]) =>
        JSON.stringify(d040NiddkLicenseRoutingEvidence[key]) !== JSON.stringify(value),
    )
  ) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D040_NIDDK_LICENSE_ROUTING_GATE",
      "D-040",
      "D-040 NIDDK 许可路径证据未保持 TAB-2436/E-160-2012-0、Prototype/Licensing、七资产未映射、未外联及采用/Owner/实现全关闭边界",
      d040NiddkLicenseRoutingEvidence,
    );
  }
  const d040NiddkLicenseClarificationTemplateRecord =
    latestD040NiddkLicenseClarificationTemplate(model);
  const d040NiddkLicenseClarificationTemplate = {
    ...(d040NiddkLicenseClarificationTemplateRecord?.data ?? {}),
    eventId: d040NiddkLicenseClarificationTemplateRecord?.eventId ?? null,
  };
  const expectedD040NiddkLicenseClarificationTemplate = {
    eventId: "EVT-20260822-006",
    state: "completed",
    decisionId: "D-040",
    decisionState: "CANDIDATE",
    authoritativeState: "PX-0_INPUT_GAP",
    from: "NIDDK_LICENSE_ROUTE_LOCATED_ASSET_COVERAGE_UNCONFIRMED",
    next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
    templateNext: "EXTERNAL_CONTACT_AUTHORIZATION_OR_ALTERNATIVE_MODEL_RESEARCH_REQUIRED",
    inputState: "CLARIFICATION_TEMPLATE_READY_NOT_SENT",
    templateState: "DRAFT_READY_NOT_SENT_RESPONSE_NOT_RECEIVED",
    technologyTransferId: "TAB-2436",
    technologyEId: "E-160-2012-0",
    developmentStatus: "PROTOTYPE",
    collaborationRoute: "LICENSING",
    artifactCommit: "ff8c23a5fbacca6ae77ab5303b792c84f1c1db5d",
    artifactBlobOid: "ae363f388b50bf0eeb979dc4b4b4e35b72338568",
    sourceEvidenceCommit: "b5c16332ac42437b019383bff4b93733d0a729fe",
    sourceEvidenceBlobOid: "15b1a664e1db490697eaa85d8fd56b0f5e7af174",
    targetAssetCount: 7,
    requiredQuestionSectionCount: 3,
    requiredActionCount: 6,
    authorizationFieldCount: 12,
    responseRecordRequiredFieldCount: 30,
    dispositionCount: 5,
    dispositions: [
      "CLARIFICATION_NOT_AUTHORIZED",
      "CLARIFICATION_INCOMPLETE",
      "USE_NOT_PERMITTED",
      "LICENSE_EVIDENCE_CANDIDATE",
      "INDEPENDENT_REIMPLEMENTATION_EVIDENCE_CANDIDATE",
    ],
    templateBindsObservedHashes: true,
    assetSpecificAnswersRequired: true,
    generalPermissionInsufficient: true,
    separateContactAndCommercialAuthorization: true,
    responseOriginalOrVerifiableReferenceRequired: true,
    namedAuthorityVerificationRequired: true,
    aiOrAgentCanAuthorizeOrVerify: false,
    templateCanSend: false,
    licenseClarificationAuthorized: false,
    licensingClarificationRequested: false,
    responseReceived: false,
    currentSevenAssetsCoverageConfirmed: false,
    explicitPerFileSoftwareLicenseFound: false,
    stableSemanticReleaseFound: false,
    officialVersionedOracleCorpusFound: false,
    regressionToleranceDefined: false,
    productGuardrailsApproved: false,
    healthReviewerAssigned: false,
    externalMessagesSent: 0,
    formsSubmitted: 0,
    commercialTermsAccepted: false,
    fileDownloads: 0,
    niddkSourceCodeVendored: false,
    niddkRemoteCodeExecuted: false,
    dynamicModelEvidencePassed: false,
    dynamicModelOptionOwnerReady: false,
    modelNativeNumericPalOptionOwnerReady: false,
    ownerIntakeChanged: false,
    ownerCardScheduled: false,
    px1Authorized: false,
    px2Authorized: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    decisionAcceptedRecorded: false,
    formulaImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
  };
  if (
    Object.entries(expectedD040NiddkLicenseClarificationTemplate).some(
      ([key, value]) =>
        JSON.stringify(d040NiddkLicenseClarificationTemplate[key]) !== JSON.stringify(value),
    )
  ) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D040_NIDDK_LICENSE_CLARIFICATION_TEMPLATE_GATE",
      "D-040",
      "D-040 NIDDK 许可澄清模板未保持七资产、授权与答复 schema、失败关闭处置、不可发送及许可/采用/Owner/实现全关闭边界",
      d040NiddkLicenseClarificationTemplate,
    );
  }
  const d040NiddkLegacyReferenceAuditRecord =
    latestD040NiddkLegacyReferenceAudit(model);
  const d040NiddkLegacyReferenceAudit = {
    ...(d040NiddkLegacyReferenceAuditRecord?.data ?? {}),
    eventId: d040NiddkLegacyReferenceAuditRecord?.eventId ?? null,
  };
  const expectedD040NiddkLegacyReferenceAudit = {
    eventId: "EVT-20260822-007",
    state: "completed",
    decisionId: "D-040",
    decisionState: "CANDIDATE",
    authoritativeState: "PX-0_INPUT_GAP",
    from: "NIDDK_STABLE_RELEASE_AND_ORACLE_EVIDENCE_GAP",
    next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
    researchNext: "EXTERNAL_CONTACT_AUTHORIZATION_OR_ALTERNATIVE_MODEL_RESEARCH_REQUIRED",
    inputState: "LEGACY_REFERENCE_SURFACE_LOCATED_NOT_CURRENT_RELEASE_OR_ORACLE",
    artifactCommit: "6c76dac5f8ad0b723bd24d7ce4b85e1299ca580b",
    artifactBlobOid: "abb4a70f8627c97176412e3b5df809ad0a6657fd",
    officialSourceCount: 3,
    officialResearchDirectoryLocated: true,
    bodyWeightPlannerSupersedesLegacyTools: true,
    legacyToolGroupCount: 2,
    detailedComputationalModelCodeZipListed: true,
    detailedComputationalModelPublicationYear: 2010,
    detailedComputationalModelRequiresBerkeleyMadonna: true,
    weightMaintenanceSpreadsheetLogicalToolCount: 4,
    weightMaintenanceModelPublicationYear: 2008,
    weightMaintenanceSpreadsheetRequiresExcelMacro: true,
    weightMaintenanceSpreadsheetRequiresSolver: true,
    legacyArtifactsCurrentBwpSourceRelease: false,
    legacyArtifactsMapCurrentSevenWebAssets: false,
    legacyArtifactsOfficialVersionedOracle: false,
    technologyRecordMentionsValidationWithPublishedHumanData: true,
    machineReadableVersionedValidationCorpusFound: false,
    currentSevenAssetsCoverageConfirmed: false,
    explicitPerFileSoftwareLicenseFound: false,
    stableSemanticReleaseFound: false,
    officialVersionedOracleCorpusFound: false,
    regressionToleranceDefined: false,
    productGuardrailsApproved: false,
    healthReviewerAssigned: false,
    legacyArtifactFilesDownloaded: 0,
    legacyArtifactsExecuted: false,
    legacyArtifactsVendored: false,
    niddkSourceCodeVendored: false,
    niddkRemoteCodeExecuted: false,
    licensingClarificationRequested: false,
    externalMessagesSent: 0,
    formsSubmitted: 0,
    commercialTermsAccepted: false,
    dynamicModelEvidencePassed: false,
    dynamicModelOptionOwnerReady: false,
    modelNativeNumericPalOptionOwnerReady: false,
    ownerIntakeChanged: false,
    ownerCardScheduled: false,
    px1Authorized: false,
    px2Authorized: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    decisionAcceptedRecorded: false,
    formulaImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
  };
  if (
    Object.entries(expectedD040NiddkLegacyReferenceAudit).some(
      ([key, value]) =>
        JSON.stringify(d040NiddkLegacyReferenceAudit[key]) !== JSON.stringify(value),
    )
  ) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D040_NIDDK_LEGACY_REFERENCE_AUDIT_GATE",
      "D-040",
      "D-040 NIDDK 旧研究工具审计未保持旧工具已被 BWP 取代、非当前发行/oracle、未下载/执行/入库及许可/采用/Owner/实现全关闭边界",
      d040NiddkLegacyReferenceAudit,
    );
  }
  const mvpIncrementScopeRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260822-008",
  )?.value ?? null;
  const mvpIncrementScope = {
    ...(mvpIncrementScopeRecord?.data ?? {}),
    eventId: mvpIncrementScopeRecord?.eventId ?? null,
  };
  const expectedMvpIncrementScope = {
    state: "completed",
    artifactStatus: "INTERNAL_CANDIDATE",
    gateId: "G2",
    gateState: "IN_PROGRESS",
    from: "FIRST_MVP_INCREMENT_AND_LATER_SCOPE_BOUNDARY_MISSING",
    next: "OWNER_SCOPE_REVIEW_REQUIRED",
    artifactCommit: "b79d3eb30d43865a02c977f52238f927b307ef33",
    artifactBlobOid: "117b2babffb85fcf91cd8cde5532ce7a37b8d4b2",
    optionCount: 3,
    optionIds: [
      "MVP-I1-LOCAL-MEAL",
      "MVP-I1-FULL-MANUAL",
      "MVP-I1-LOCAL-MEAL-BARCODE",
    ],
    recommendedOptionId: "A",
    recommendationIsSelection: false,
    otherOptionAllowed: true,
    sharedInvariantCount: 7,
    totalFeatureScopeRetained: true,
    featureCount: 24,
    laterScopeRetained: true,
    ownerReviewRequired: true,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    selectedIncrementId: null,
    mvpIncrementScopeFrozen: false,
    decisionIdAllocated: false,
    decisionRegistered: false,
    decisionAcceptedRecorded: false,
    d039OptionABlockerIds: ["D039-PX5-B03", "D039-PX5-B06"],
    d039OptionABlockersClosed: false,
    d052BlocksLocalSelfUseNoUsdaRedistributionPath: false,
    d053BlocksLocalNoThirdPartyAiPath: false,
    ownerIntakeChanged: false,
    ownerCardScheduled: false,
    g2Passed: false,
    formalRootProjectAuthorized: false,
    nativeIosWorkAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    eventId: "EVT-20260822-008",
  };
  const mvpIncrementScopeMatches =
    JSON.stringify(Object.keys(mvpIncrementScope).sort()) ===
      JSON.stringify(Object.keys(expectedMvpIncrementScope).sort()) &&
    Object.keys(expectedMvpIncrementScope).every(
      (field) => JSON.stringify(mvpIncrementScope[field]) ===
        JSON.stringify(expectedMvpIncrementScope[field]),
    );
  if (!mvpIncrementScopeMatches) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_MVP_INCREMENT_SCOPE_GATE",
      "G2",
      "G2 MVP 增量范围卡未保持三项互斥选择、F01~F24 与后续范围完整、推荐非选择及 Owner/决定/范围冻结/G2/正式工程/原生/实现授权全关闭边界",
      mvpIncrementScope,
    );
  }
  const mvpIncrementScopeReviewPacketRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260822-009",
  )?.value ?? null;
  const mvpIncrementScopeReviewPacket = {
    ...(mvpIncrementScopeReviewPacketRecord?.data ?? {}),
    eventId: mvpIncrementScopeReviewPacketRecord?.eventId ?? null,
  };
  const expectedMvpIncrementScopeReviewPacket = {
    state: "completed",
    artifactStatus: "INTERNAL_REVIEW_PACKET",
    gateId: "G2",
    gateState: "IN_PROGRESS",
    from: "OWNER_SCOPE_REVIEW_REQUIRED",
    next: "CROSS_ROLE_REVIEWER_ASSIGNMENT_AND_REVIEW_REQUIRED",
    artifactCommit: "b4f1a8bf231cff8b5c5e7cc6b33c4498179eb1d8",
    artifactBlobOid: "1cac524ec2997749cbde9bf714ec1684f5533d20",
    sourceScopeCardEventId: "EVT-20260822-008",
    reviewPacketReady: true,
    reviewPacketVersion: "PACKET-001-R1",
    requiredArtifactCount: 11,
    requiredOptionCount: 3,
    optionKeys: ["A", "B", "C"],
    optionIds: [
      "MVP-I1-LOCAL-MEAL",
      "MVP-I1-FULL-MANUAL",
      "MVP-I1-LOCAL-MEAL-BARCODE",
    ],
    requiredReviewerDomainCount: 5,
    reviewerDomainIds: [
      "PRODUCT_SCOPE",
      "DESIGN_EXPERIENCE",
      "ARCHITECTURE_DATA",
      "SECURITY_PRIVACY",
      "QA_TRACEABILITY",
    ],
    requiredCrossOptionInvariantCount: 12,
    allowedOptionDispositionCount: 4,
    allowedOptionDispositionIds: [
      "APPROVE_SCOPE_OPTION",
      "APPROVE_WITH_REQUIRED_CHANGE",
      "REJECT_SCOPE_OPTION",
      "OUT_OF_SCOPE",
    ],
    blockingSeverityIds: ["P0", "P1", "P2"],
    nonBlockingSeverityId: "P3",
    namedReviewerRequired: true,
    authorOrPmCanSelfApprove: false,
    aiOrAgentCanBeIndependentReviewer: false,
    reviewersAssigned: false,
    reviewerIdentityVerified: false,
    reviewerCompetenceVerified: false,
    reviewerIndependenceVerified: false,
    conflictOfInterestResolved: false,
    crossRoleReviewStarted: false,
    crossRoleReviewPassed: false,
    currentFindingCountsMeasured: false,
    externalMessageSent: false,
    ownerIntakeChanged: false,
    ownerCardScheduled: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    selectedIncrementId: null,
    decisionIdAllocated: false,
    decisionRegistered: false,
    decisionAcceptedRecorded: false,
    mvpIncrementScopeFrozen: false,
    g2Passed: false,
    formalRootProjectAuthorized: false,
    nativeIosWorkAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    eventId: "EVT-20260822-009",
  };
  const mvpIncrementScopeReviewPacketMatches =
    JSON.stringify(Object.keys(mvpIncrementScopeReviewPacket).sort()) ===
      JSON.stringify(Object.keys(expectedMvpIncrementScopeReviewPacket).sort()) &&
    Object.keys(expectedMvpIncrementScopeReviewPacket).every(
      (field) => JSON.stringify(mvpIncrementScopeReviewPacket[field]) ===
        JSON.stringify(expectedMvpIncrementScopeReviewPacket[field]),
    );
  if (!mvpIncrementScopeReviewPacketMatches) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_MVP_INCREMENT_SCOPE_REVIEW_PACKET_GATE",
      "G2",
      "G2 MVP 增量范围复核包未保持 11 输入、3 选项、5 域、12 条不变量与复核/Owner/决定/范围冻结/G2/实现全关闭边界",
      mvpIncrementScopeReviewPacket,
    );
  }
  const mvpIncrementScopeInputManifestRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260822-010",
  )?.value ?? null;
  const mvpIncrementScopeInputManifest = {
    ...(mvpIncrementScopeInputManifestRecord?.data ?? {}),
    eventId: mvpIncrementScopeInputManifestRecord?.eventId ?? null,
  };
  const expectedMvpIncrementScopeInputManifest = {
    state: "completed",
    artifactStatus: "INTERNAL_REVIEW_INPUT_MANIFEST",
    gateId: "G2",
    gateState: "IN_PROGRESS",
    from: "MVP_INCREMENT_SCOPE_INPUT_FREEZE_REQUIRED",
    to: "MVP_INCREMENT_SCOPE_INPUT_MANIFEST_FROZEN",
    next: "CROSS_ROLE_REVIEWER_ASSIGNMENT_AND_REVIEW_REQUIRED",
    packetNext: "CROSS_ROLE_REVIEWER_ASSIGNMENT_AND_REVIEW_REQUIRED",
    reviewPacketReady: true,
    reviewPacketVersion: "PACKET-001-R1",
    inputManifestFrozen: true,
    manifestEntryCount: 11,
    manifestCommit: "9891e6ac75d02df3d85a6b13cb094cd80e7fe808",
    manifestRecordCommit: "6be59e5df3c1d06416f87950308bcb9a5df2aab0",
    manifestRecordBlobOid: "3b232045cdf791454ef269d0f7a1e632e72ef1c0",
    gitBlobOidAlgorithm: "SHA-1",
    canonicalDigestAlgorithm: "SHA-256",
    rawGitBlobBytesUsed: true,
    frozenArtifactRefs: [
      "docs/00-governance/project-charter.md",
      "docs/02-product/scope-baseline.md",
      "docs/02-product/requirements-and-phasing.md",
      "docs/02-product/acceptance-traceability.md",
      "docs/02-product/mvp-increment-scope-card.md",
      "docs/03-design/key-user-journeys.md",
      "docs/03-design/states-content-accessibility.md",
      "docs/04-engineering/architecture/feature-boundary-map.md",
      "docs/04-engineering/testing/feature-contract-coverage.md",
      "docs/05-quality/d039-px5-dor-assessment.md",
      "docs/05-quality/security-review.md",
    ],
    sourcePacketCreationEventId: "EVT-20260822-009",
    requiredArtifactCount: 11,
    requiredOptionCount: 3,
    optionKeys: ["A", "B", "C"],
    optionIds: [
      "MVP-I1-LOCAL-MEAL",
      "MVP-I1-FULL-MANUAL",
      "MVP-I1-LOCAL-MEAL-BARCODE",
    ],
    requiredReviewerDomainCount: 5,
    reviewerDomainIds: [
      "PRODUCT_SCOPE",
      "DESIGN_EXPERIENCE",
      "ARCHITECTURE_DATA",
      "SECURITY_PRIVACY",
      "QA_TRACEABILITY",
    ],
    requiredCrossOptionInvariantCount: 12,
    allowedOptionDispositionCount: 4,
    allowedOptionDispositionIds: [
      "APPROVE_SCOPE_OPTION",
      "APPROVE_WITH_REQUIRED_CHANGE",
      "REJECT_SCOPE_OPTION",
      "OUT_OF_SCOPE",
    ],
    blockingSeverityIds: ["P0", "P1", "P2"],
    nonBlockingSeverityId: "P3",
    namedReviewerRequired: true,
    authorOrPmCanSelfApprove: false,
    aiOrAgentCanBeIndependentReviewer: false,
    externalMessageSent: false,
    reviewersAssigned: false,
    reviewerIdentityVerified: false,
    reviewerCompetenceVerified: false,
    reviewerIndependenceVerified: false,
    conflictOfInterestResolved: false,
    crossRoleReviewStarted: false,
    crossRoleReviewPassed: false,
    currentFindingCountsMeasured: false,
    ownerIntakeChanged: false,
    ownerCardScheduled: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    selectedIncrementId: null,
    decisionIdAllocated: false,
    decisionRegistered: false,
    decisionAcceptedRecorded: false,
    mvpIncrementScopeFrozen: false,
    g2Passed: false,
    formalRootProjectAuthorized: false,
    nativeIosWorkAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    eventId: "EVT-20260822-010",
  };
  const mvpIncrementScopeInputManifestMatches =
    JSON.stringify(Object.keys(mvpIncrementScopeInputManifest).sort()) ===
      JSON.stringify(Object.keys(expectedMvpIncrementScopeInputManifest).sort()) &&
    Object.keys(expectedMvpIncrementScopeInputManifest).every(
      (field) => JSON.stringify(mvpIncrementScopeInputManifest[field]) ===
        JSON.stringify(expectedMvpIncrementScopeInputManifest[field]),
    );
  if (!mvpIncrementScopeInputManifestMatches) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_MVP_INCREMENT_SCOPE_INPUT_MANIFEST_GATE",
      "G2",
      "G2 MVP 增量范围复核输入未保持 11 项同提交原始 Git blob/SHA-256 冻结及复核/Owner/决定/范围冻结/G2/实现全关闭边界",
      mvpIncrementScopeInputManifest,
    );
  }
  const mvpIncrementScopeReviewHarnessRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260822-011",
  )?.value ?? null;
  const mvpIncrementScopeCrossRoleReviewRecordHarness = {
    ...(mvpIncrementScopeReviewHarnessRecord?.data ?? {}),
    eventId: mvpIncrementScopeReviewHarnessRecord?.eventId ?? null,
  };
  const expectedMvpIncrementScopeReviewHarness = {
    state: "completed",
    contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    gateId: "G2",
    gateState: "IN_PROGRESS",
    next: "CROSS_ROLE_REVIEWER_ASSIGNMENT_AND_REVIEW_REQUIRED",
    packetId: "MVP-INCREMENT-SCOPE-REVIEW-PACKET-001",
    packetVersion: "PACKET-001-R1",
    inputManifestEventId: "EVT-20260822-010",
    manifestCommit: "9891e6ac75d02df3d85a6b13cb094cd80e7fe808",
    manifestRecordCommit: "6be59e5df3c1d06416f87950308bcb9a5df2aab0",
    packetArtifactCommit: "6be59e5df3c1d06416f87950308bcb9a5df2aab0",
    packetArtifactBlobOid: "3b232045cdf791454ef269d0f7a1e632e72ef1c0",
    packetArtifactSha256: "d17ae5fa7567486e14741a3fecf252abf0b13414bb50c935403cc206b5b59a0e",
    contractArtifactCommit: "afbf079eae9ad88c9bf0bb21b25327fea0eb8147",
    contractBlobOid: "c262805138145eeebebe16293c57e1d2b5f19fab",
    artifactCommit: "2fe1b4b06db10d58a184bb717105f2e687911e83",
    implementationBlobOid: "b2b8bf13074c2021ce77189246f0259a5cd73612",
    testBlobOid: "e34111cb22a451a3d06c74313940620453eeb1eb",
    documentationBlobOid: "ca6c331307179398f09768dec0446fd0bb412ceb",
    inputSchemaVersion: "MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_BUNDLE_INPUT_V1",
    resultSchemaVersion: "MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RESULT_V1",
    boundarySchemaVersion: "MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_BOUNDARY_V1",
    topLevelTests: 20,
    fullSuitePassed: 1109,
    isolatedSpikeTestsPassed: 10,
    requiredArtifactCount: 11,
    requiredReviewerDomainCount: 5,
    requiredOptionCount: 3,
    requiredCrossOptionInvariantCount: 12,
    allowedOptionDispositionCount: 4,
    severityCount: 4,
    recordKinds: ["FORMAL_REVIEW_RECORD", "SYNTHETIC_CONTRACT_FIXTURE"],
    overallDispositions: [
      "CROSS_ROLE_REVIEW_PASS_CANDIDATE",
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
    ],
    dispositionPriority: [
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
      "CROSS_ROLE_REVIEW_PASS_CANDIDATE",
    ],
    formalStructuralDisposition: "STRUCTURALLY_COMPLETE_REVIEW_ONLY",
    syntheticStructuralDisposition: "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY",
    syntheticWouldBePassCandidateCovered: true,
    syntheticCrossRoleReviewPassCandidateReturned: false,
    formalCrossRoleReviewPassCandidateCanBeReturned: true,
    crossRoleReviewPassedReturned: false,
    strictDataTreeAndExactFields: true,
    frozenArtifactIdentityExact: true,
    reviewerDomainCoverageRecomputed: true,
    optionAndFindingBidirectionalReferencesRequired: true,
    openP0P1P2Block: true,
    openP3RequiresOwnerDueAtAndRationale: true,
    reviewContentSha256Required: true,
    attestationsBindReviewContentSha256: true,
    bundleSha256Required: true,
    sensitiveLookingFieldNamesAndValuesRejectedWithoutEcho: true,
    immutableNormalizationAndResultFingerprintBound: true,
    reviewerIdentityClaimsCallerAssertedNotVerified: true,
    reviewerCompetenceClaimsCallerAssertedNotVerified: true,
    reviewerIndependenceClaimsCallerAssertedNotVerified: true,
    signatureReferencesCallerAssertedNotVerified: true,
    contractValidatorImplemented: true,
    harnessReadsCallerSuppliedDataOnly: true,
    reviewPacketReady: true,
    inputManifestFrozen: true,
    formalReviewRecordCount: 0,
    reviewerAttestationRecordCount: 0,
    syntheticFixturePersistedCount: 0,
    gitReads: 0,
    fileReads: 0,
    fileWrites: 0,
    identityDocumentReads: 0,
    competenceEvidenceReads: 0,
    signatureArtifactReads: 0,
    networkRequests: 0,
    providerRequests: 0,
    externalMessagesSent: 0,
    businessWrites: 0,
    reviewersAssigned: false,
    reviewerIdentityVerified: false,
    reviewerCompetenceVerified: false,
    reviewerIndependenceVerified: false,
    reviewerSignatureVerified: false,
    conflictOfInterestResolved: false,
    crossRoleReviewStarted: false,
    crossRoleReviewPassed: false,
    currentFindingCountsMeasured: false,
    ownerIntakeChanged: false,
    ownerCardScheduled: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    selectedIncrementId: null,
    decisionIdAllocated: false,
    decisionRegistered: false,
    decisionAcceptedRecorded: false,
    mvpIncrementScopeFrozen: false,
    g2Passed: false,
    formalRootProjectAuthorized: false,
    nativeIosWorkAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    eventId: "EVT-20260822-011",
  };
  const mvpIncrementScopeReviewHarnessMatches =
    JSON.stringify(Object.keys(mvpIncrementScopeCrossRoleReviewRecordHarness).sort()) ===
      JSON.stringify(Object.keys(expectedMvpIncrementScopeReviewHarness).sort()) &&
    Object.keys(expectedMvpIncrementScopeReviewHarness).every(
      (field) => JSON.stringify(mvpIncrementScopeCrossRoleReviewRecordHarness[field]) ===
        JSON.stringify(expectedMvpIncrementScopeReviewHarness[field]),
    );
  if (!mvpIncrementScopeReviewHarnessMatches) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_MVP_INCREMENT_SCOPE_REVIEW_RECORD_HARNESS_GATE",
      "G2",
      "G2 MVP 增量范围跨角色复核回执 validator 未保持 11 输入/5 域/A-B-C/12 不变量/P0~P3/disposition/双 SHA-256/20 测试/合成隔离及正式回执/attestation/复核人/PASS/Owner/范围冻结/G2/实现全关闭边界",
      mvpIncrementScopeCrossRoleReviewRecordHarness,
    );
  }
  const mvpIncrementScopeReviewerAssignmentRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260822-012",
  )?.value ?? null;
  const mvpIncrementScopeReviewerAssignmentHarness = {
    ...(mvpIncrementScopeReviewerAssignmentRecord?.data ?? {}),
    eventId: mvpIncrementScopeReviewerAssignmentRecord?.eventId ?? null,
  };
  const expectedMvpIncrementScopeReviewerAssignmentHarness = {
    state: "completed",
    contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    gateId: "G2",
    gateState: "IN_PROGRESS",
    from: "CROSS_ROLE_REVIEWER_ASSIGNMENT_AND_REVIEW_REQUIRED",
    to: "REVIEWER_ASSIGNMENT_INTAKE_AND_VALIDATOR_READY",
    next: "NAMED_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED",
    intakePacketId: "MVP-INCREMENT-SCOPE-REVIEWER-INTAKE-PACKET-001",
    intakePacketArtifactCommit: "490bae42e7c07c14c1cddc6072b8bc63a54a04e3",
    intakePacketBlobOid: "76e2c366aaee4db99f29c66390eed31172aa78fd",
    reviewPacketId: "MVP-INCREMENT-SCOPE-REVIEW-PACKET-001",
    reviewPacketVersion: "PACKET-001-R1",
    inputManifestEventId: "EVT-20260822-010",
    packetArtifactCommit: "6be59e5df3c1d06416f87950308bcb9a5df2aab0",
    packetArtifactBlobOid: "3b232045cdf791454ef269d0f7a1e632e72ef1c0",
    packetArtifactSha256: "d17ae5fa7567486e14741a3fecf252abf0b13414bb50c935403cc206b5b59a0e",
    contractArtifactCommit: "22203401a8e28a402ae708a523eb9b70b293ebfc",
    contractBlobOid: "d15660d53e2154bcd81125adefd26efa8a333020",
    artifactCommit: "b9b19022e757ca432566330298a608141426552b",
    implementationBlobOid: "952ebcd0006f249bd1148010c9123eaa96811d5e",
    testBlobOid: "88284fe03a353950e85d88f5d5edda1811aa9310",
    documentationBlobOid: "b67510a07e203bcfae401ca7e3dd970cbae0e447",
    inputSchemaVersion: "MVP_INCREMENT_SCOPE_REVIEWER_ASSIGNMENT_INPUT_V1",
    resultSchemaVersion: "MVP_INCREMENT_SCOPE_REVIEWER_ASSIGNMENT_RESULT_V1",
    boundarySchemaVersion: "MVP_INCREMENT_SCOPE_REVIEWER_ASSIGNMENT_BOUNDARY_V1",
    topLevelTests: 20,
    fullSuitePassed: 1135,
    isolatedSpikeTestsPassed: 10,
    requiredReviewerDomainCount: 5,
    maximumReviewerCount: 20,
    maximumDomainsPerReviewer: 5,
    recordKinds: ["FORMAL_ASSIGNMENT_RECORD","SYNTHETIC_CONTRACT_FIXTURE"],
    resultDispositions: [
      "STRUCTURALLY_COMPLETE_ASSIGNMENT_CANDIDATE",
      "SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY",
      "ASSIGNMENT_INCOMPLETE",
    ],
    verificationStates: ["VERIFIED","REJECTED","PENDING"],
    conflictStates: ["NONE_DECLARED","RESOLVED","OPEN"],
    signatureMethods: ["SIGNED_DOCUMENT_REFERENCE","VERIFIED_WORKFLOW_REFERENCE","WET_SIGNATURE_REFERENCE"],
    strictDataTreeAndExactFields: true,
    formalSyntheticIdentityAndReferenceIsolation: true,
    reviewPacketIdentityExact: true,
    reviewerDomainOrderExact: true,
    competenceEvidenceByDomainRequired: true,
    identitySelfVerificationRejected: true,
    draftParticipantFailsClosed: true,
    conflictResolutionRequired: true,
    domainCoverageBidirectional: true,
    reviewCanStartRecomputed: true,
    assignmentContentSha256Required: true,
    rfc3339ActualCalendarDateRequired: true,
    sensitiveLookingFieldNamesAndValuesRejectedWithoutEcho: true,
    immutableNormalizationAndResultFingerprintBound: true,
    inputAuthorityClaimsCallerAssertedNotVerified: true,
    identityClaimsCallerAssertedNotVerified: true,
    competenceClaimsCallerAssertedNotVerified: true,
    independenceClaimsCallerAssertedNotVerified: true,
    contactAuthorizationClaimsCallerAssertedNotVerified: true,
    formalAssignmentCandidateCanBeReturned: true,
    syntheticWouldBeAssignmentReadyCandidateCovered: true,
    syntheticAssignmentReadyCandidateReturned: false,
    reviewersAssignedReturned: false,
    reviewCanStartReturned: false,
    contractValidatorImplemented: true,
    harnessReadsCallerSuppliedDataOnly: true,
    intakePacketReady: true,
    reviewPacketReady: true,
    inputManifestFrozen: true,
    reviewerCandidateCount: 0,
    reviewerAssignmentRecordCount: 0,
    controlledContactRecordCount: 0,
    formalReviewRecordCount: 0,
    reviewerAttestationRecordCount: 0,
    syntheticFixturePersistedCount: 0,
    gitReads: 0,
    fileReads: 0,
    fileWrites: 0,
    identityDocumentReads: 0,
    competenceEvidenceReads: 0,
    contactRecordReads: 0,
    signatureArtifactReads: 0,
    networkRequests: 0,
    providerRequests: 0,
    externalContactAuthorized: false,
    externalMessagesSent: 0,
    businessWrites: 0,
    reviewersAssigned: false,
    reviewerIdentityVerified: false,
    reviewerCompetenceVerified: false,
    reviewerIndependenceVerified: false,
    reviewerSignatureVerified: false,
    conflictOfInterestResolved: false,
    crossRoleReviewStarted: false,
    crossRoleReviewPassed: false,
    ownerIntakeChanged: false,
    ownerCardScheduled: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    selectedIncrementId: null,
    decisionIdAllocated: false,
    decisionRegistered: false,
    decisionAcceptedRecorded: false,
    mvpIncrementScopeFrozen: false,
    g2Passed: false,
    formalRootProjectAuthorized: false,
    nativeIosWorkAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    eventId: "EVT-20260822-012",
  };
  const mvpIncrementScopeReviewerAssignmentMatches =
    JSON.stringify(Object.keys(mvpIncrementScopeReviewerAssignmentHarness).sort()) ===
      JSON.stringify(Object.keys(expectedMvpIncrementScopeReviewerAssignmentHarness).sort()) &&
    Object.keys(expectedMvpIncrementScopeReviewerAssignmentHarness).every(
      (field) => JSON.stringify(mvpIncrementScopeReviewerAssignmentHarness[field]) ===
        JSON.stringify(expectedMvpIncrementScopeReviewerAssignmentHarness[field]),
    );
  if (!mvpIncrementScopeReviewerAssignmentMatches) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_MVP_INCREMENT_SCOPE_REVIEWER_ASSIGNMENT_HARNESS_GATE",
      "G2",
      "G2 MVP 增量复核人指派 validator 未保持 PACKET-001-R1、五域逐域胜任/身份/起草/冲突/覆盖、联络/时序/签署、assignment SHA-256、20 测试/合成隔离及候选人/联系人/外联/正式指派/复核/PASS/Owner/范围冻结/G2/实现全关闭边界",
      mvpIncrementScopeReviewerAssignmentHarness,
    );
  }
  const d039ReviewerAssignmentRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260822-013",
  )?.value ?? null;
  const d039ReviewerAssignmentHarness = {
    ...(d039ReviewerAssignmentRecord?.data ?? {}),
    eventId: d039ReviewerAssignmentRecord?.eventId ?? null,
  };
  const expectedD039ReviewerAssignmentHarness = {
    "state": "completed",
    "contractStatus": "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    "decisionId": "D-039",
    "decisionState": "ACCEPTED",
    "selectedOption": "A",
    "designBaselineState": "PX-4_BASELINE_FROZEN",
    "px5Disposition": "NOT_READY",
    "from": "B03_B05_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
    "to": "B03_B05_REVIEWER_ASSIGNMENT_INTAKE_AND_VALIDATOR_READY",
    "next": "NAMED_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED",
    "intakePacketId": "D039-B03-B05-REVIEWER-INTAKE-PACKET-001",
    "intakePacketArtifactCommit": "464c40e6aed5a7bf1b9e1e6f1ab9c6c9a8326cad",
    "intakePacketBlobOid": "d675fdf03509645dc66fd157674a57ea0be7f751",
    "reviewPacketId": "D039-B03-B05-INDEPENDENT-REVIEW-PACKET-001",
    "reviewPacketVersion": "PACKET-001-R1",
    "inputManifestEventId": "EVT-20260821-009",
    "manifestCommit": "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117",
    "manifestRecordCommit": "19f2119abcd8ca25bf59b177910a5af1f34e9abb",
    "packetArtifactBlobOid": "d96a28560fa20399260ee3522a0fc2c21465220b",
    "packetArtifactSha256": "580c1a4849e99580127afb47faa0c96407ff8913e6c2dda177c2147135a88ad1",
    "contractArtifactCommit": "11ea99ab454ef303e4cfb4d0f6331c960f53b2c6",
    "contractBlobOid": "05cb23e97c4927f3ea901e7587359e7d98102b32",
    "artifactCommit": "50cabef069dd4e6f2cc285e99e056361fa2b51ce",
    "implementationBlobOid": "bffc9ee339f2374c474a503ebacdd349fe3bfaed",
    "testBlobOid": "bca1e06952409867c6cea193890f7b30139b1b2a",
    "documentationBlobOid": "61247be5307fed59823d0d2cbdb1b0c666a48d3d",
    "inputSchemaVersion": "D039_B03_B05_REVIEWER_ASSIGNMENT_INPUT_V1",
    "resultSchemaVersion": "D039_B03_B05_REVIEWER_ASSIGNMENT_RESULT_V1",
    "boundarySchemaVersion": "D039_B03_B05_REVIEWER_ASSIGNMENT_BOUNDARY_V1",
    "topLevelTests": 21,
    "fullSuitePassed": 1162,
    "isolatedSpikeTestsPassed": 10,
    "requiredReviewerDomainCount": 4,
    "maximumReviewerCount": 20,
    "maximumDomainsPerReviewer": 4,
    "recordKinds": [
      "FORMAL_ASSIGNMENT_RECORD",
      "SYNTHETIC_CONTRACT_FIXTURE"
    ],
    "resultDispositions": [
      "STRUCTURALLY_COMPLETE_ASSIGNMENT_CANDIDATE",
      "SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY",
      "ASSIGNMENT_INCOMPLETE"
    ],
    "verificationStates": [
      "VERIFIED",
      "REJECTED",
      "PENDING"
    ],
    "conflictStates": [
      "NONE_DECLARED",
      "RESOLVED",
      "OPEN"
    ],
    "signatureMethods": [
      "SIGNED_DOCUMENT_REFERENCE",
      "VERIFIED_WORKFLOW_REFERENCE",
      "WET_SIGNATURE_REFERENCE"
    ],
    "strictDataTreeAndExactFields": true,
    "formalSyntheticIdentityAndReferenceIsolation": true,
    "reviewPacketIdentityExact": true,
    "reviewerDomainOrderExact": true,
    "competenceEvidenceByDomainRequired": true,
    "identitySelfVerificationRejected": true,
    "draftParticipantFailsClosed": true,
    "conflictResolutionRequired": true,
    "domainCoverageBidirectional": true,
    "reviewCanStartRecomputed": true,
    "assignmentContentSha256Required": true,
    "rfc3339ActualCalendarDateRequired": true,
    "sensitiveLookingFieldNamesAndValuesRejectedWithoutEcho": true,
    "immutableNormalizationAndResultFingerprintBound": true,
    "inputAuthorityClaimsCallerAssertedNotVerified": true,
    "identityClaimsCallerAssertedNotVerified": true,
    "competenceClaimsCallerAssertedNotVerified": true,
    "independenceClaimsCallerAssertedNotVerified": true,
    "contactAuthorizationClaimsCallerAssertedNotVerified": true,
    "formalAssignmentCandidateCanBeReturned": true,
    "formalAssignmentReadyCandidateCovered": true,
    "syntheticWouldBeAssignmentReadyCandidateCovered": true,
    "syntheticAssignmentReadyCandidateReturned": false,
    "reviewersAssignedReturned": false,
    "reviewCanStartReturned": false,
    "contractValidatorImplemented": true,
    "harnessReadsCallerSuppliedDataOnly": true,
    "intakePacketReady": true,
    "reviewPacketReady": true,
    "inputManifestFrozen": true,
    "reviewerCandidateCount": 0,
    "reviewerAssignmentRecordCount": 0,
    "controlledContactRecordCount": 0,
    "formalReviewRecordCount": 0,
    "reviewerAttestationRecordCount": 0,
    "syntheticFixturePersistedCount": 0,
    "gitReads": 0,
    "fileReads": 0,
    "fileWrites": 0,
    "identityDocumentReads": 0,
    "competenceEvidenceReads": 0,
    "contactRecordReads": 0,
    "signatureArtifactReads": 0,
    "networkRequests": 0,
    "providerRequests": 0,
    "externalContactAuthorized": false,
    "externalMessagesSent": 0,
    "businessWrites": 0,
    "reviewersAssigned": false,
    "reviewerIdentityVerified": false,
    "reviewerCompetenceVerified": false,
    "reviewerIndependenceVerified": false,
    "reviewerSignatureVerified": false,
    "conflictOfInterestResolved": false,
    "independentReviewStarted": false,
    "independentReviewPassed": false,
    "currentFindingCountsMeasured": false,
    "d034DeviceBenchmarkPassed": false,
    "d036Oi07InputComplete": false,
    "d036ProviderCompatibilitySpikePassed": false,
    "d036NativeBoundaryEvidencePassed": false,
    "d053Oi07EvidenceComplete": false,
    "d053ProviderEvidenceReady": false,
    "d053AppPrivacyMappingApproved": false,
    "d045Accepted": false,
    "d031Accepted": false,
    "d033Accepted": false,
    "d034Accepted": false,
    "d036Accepted": false,
    "d053Accepted": false,
    "b03Closed": false,
    "b04Closed": false,
    "b05Closed": false,
    "ownerIntakeChanged": false,
    "ownerCardsScheduled": false,
    "ownerReviewAuthorized": false,
    "ownerChoiceRecorded": false,
    "decisionAcceptedRecorded": false,
    "d032SecondOwnerActionSatisfied": false,
    "px5ImplementationDorSatisfied": false,
    "formalRootProjectAuthorized": false,
    "nativeIosWorkAuthorized": false,
    "formalImplementationAuthorized": false,
    "gateStatesChanged": false,
    "eventId": "EVT-20260822-013"
  };
  const d039ReviewerAssignmentMatches =
    JSON.stringify(Object.keys(d039ReviewerAssignmentHarness).sort()) ===
      JSON.stringify(Object.keys(expectedD039ReviewerAssignmentHarness).sort()) &&
    Object.keys(expectedD039ReviewerAssignmentHarness).every(
      (field) => JSON.stringify(d039ReviewerAssignmentHarness[field]) ===
        JSON.stringify(expectedD039ReviewerAssignmentHarness[field]),
    );
  if (!d039ReviewerAssignmentMatches) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D039_REVIEWER_ASSIGNMENT_HARNESS_GATE",
      "D-039",
      "D-039 B03~B05 六卡复核人指派 validator 未保持 PACKET-001-R1、四域逐域胜任、身份/起草/冲突/覆盖、联络/时序/签署、assignment SHA-256、21 测试、正式/合成隔离及候选人/联系人/外联/正式指派/复核/PASS/B03~B05/Owner/PX-5/实现全关闭边界",
      d039ReviewerAssignmentHarness,
    );
  }
  const d040FirstThreeBatchesReviewerAssignmentRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260822-014",
  )?.value ?? null;
  const d040FirstThreeBatchesReviewerAssignmentHarness = {
    ...(d040FirstThreeBatchesReviewerAssignmentRecord?.data ?? {}),
    eventId: d040FirstThreeBatchesReviewerAssignmentRecord?.eventId ?? null,
  };
  const expectedD040FirstThreeBatchesReviewerAssignmentHarness = {
    "state": "completed",
    "contractStatus": "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    "decisionId": "D-040",
    "decisionState": "CANDIDATE",
    "authoritativeState": "PX-0_INPUT_GAP",
    "from": "FIRST_THREE_BATCHES_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
    "to": "FIRST_THREE_BATCHES_REVIEWER_ASSIGNMENT_INTAKE_AND_VALIDATOR_READY",
    "next": "NAMED_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED",
    "intakePacketId": "D040-FIRST-THREE-BATCHES-REVIEWER-INTAKE-PACKET-001",
    "intakePacketArtifactCommit": "2c5323ffd6183bae6aea4563f4cbb584a3d702d9",
    "intakePacketBlobOid": "2751d09da70765a1c1a6f89eca76cac13a7a76d6",
    "reviewPacketId": "D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-PACKET-001",
    "reviewPacketVersion": "PACKET-001-R1",
    "packetEventId": "EVT-20260821-001",
    "inputCommit": "b39a8f09ae544d7c3276f532b536c67ade75b446",
    "packetArtifactCommit": "3d63bafdcf82b588a3d344c9a4185bd8edabadec",
    "packetArtifactBlobOid": "8ed92648876431cdd30ffc047d83fd6e8a05dd88",
    "packetArtifactSha256": "1f632603de373ef10af07d1da9513d0822a7b01f4890fcff12d907aaf57e7a06",
    "contractArtifactCommit": "1c8a5bba001fca639f8e4fcb7847ccceacc36c30",
    "contractBlobOid": "3ec3626025f343bf34b70f6d1ef5bc4dd3416290",
    "artifactCommit": "9dabbac55283cfe9ff0fe4eb478b1a024b552b37",
    "implementationBlobOid": "468303cb7a600cd270f58f0a8678720dfb186711",
    "testBlobOid": "cbc21f8d534e7791a14a219802a4433cdf20f998",
    "documentationBlobOid": "54adb960585f825054484d0185f99bf0bf8f1ad1",
    "inputSchemaVersion": "D040_FIRST_THREE_BATCHES_REVIEWER_ASSIGNMENT_INPUT_V1",
    "resultSchemaVersion": "D040_FIRST_THREE_BATCHES_REVIEWER_ASSIGNMENT_RESULT_V1",
    "boundarySchemaVersion": "D040_FIRST_THREE_BATCHES_REVIEWER_ASSIGNMENT_BOUNDARY_V1",
    "topLevelTests": 21,
    "fullSuitePassed": 1189,
    "isolatedSpikeTestsPassed": 10,
    "markdownFileCount": 157,
    "localMarkdownLinkCount": 573,
    "brokenLocalMarkdownLinkCount": 0,
    "requiredReviewerDomainCount": 4,
    "maximumReviewerCount": 20,
    "maximumDomainsPerReviewer": 4,
    "recordKinds": [
        "FORMAL_ASSIGNMENT_RECORD",
        "SYNTHETIC_CONTRACT_FIXTURE"
    ],
    "resultDispositions": [
        "STRUCTURALLY_COMPLETE_ASSIGNMENT_CANDIDATE",
        "SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY",
        "ASSIGNMENT_INCOMPLETE"
    ],
    "verificationStates": [
        "VERIFIED",
        "REJECTED",
        "PENDING"
    ],
    "conflictStates": [
        "NONE_DECLARED",
        "RESOLVED",
        "OPEN"
    ],
    "signatureMethods": [
        "SIGNED_DOCUMENT_REFERENCE",
        "VERIFIED_WORKFLOW_REFERENCE",
        "WET_SIGNATURE_REFERENCE"
    ],
    "strictDataTreeAndExactFields": true,
    "formalSyntheticIdentityAndReferenceIsolation": true,
    "reviewPacketIdentityExact": true,
    "reviewerDomainOrderExact": true,
    "competenceEvidenceByDomainRequired": true,
    "identitySelfVerificationRejected": true,
    "draftParticipantFailsClosed": true,
    "conflictResolutionRequired": true,
    "domainCoverageBidirectional": true,
    "reviewCanStartRecomputed": true,
    "assignmentContentSha256Required": true,
    "rfc3339ActualCalendarDateRequired": true,
    "sensitiveLookingFieldNamesAndValuesRejectedWithoutEcho": true,
    "immutableNormalizationAndResultFingerprintBound": true,
    "inputAuthorityClaimsCallerAssertedNotVerified": true,
    "identityClaimsCallerAssertedNotVerified": true,
    "competenceClaimsCallerAssertedNotVerified": true,
    "independenceClaimsCallerAssertedNotVerified": true,
    "contactAuthorizationClaimsCallerAssertedNotVerified": true,
    "formalAssignmentCandidateCanBeReturned": true,
    "formalAssignmentReadyCandidateCovered": true,
    "syntheticWouldBeAssignmentReadyCandidateCovered": true,
    "syntheticAssignmentReadyCandidateReturned": false,
    "reviewersAssignedReturned": false,
    "reviewCanStartReturned": false,
    "contractValidatorImplemented": true,
    "harnessReadsCallerSuppliedDataOnly": true,
    "intakePacketReady": true,
    "reviewPacketReady": true,
    "inputCommitFrozen": true,
    "reviewerCandidateCount": 0,
    "reviewerAssignmentRecordCount": 0,
    "controlledContactRecordCount": 0,
    "formalReviewRecordCount": 0,
    "reviewerAttestationRecordCount": 0,
    "syntheticFixturePersistedCount": 0,
    "gitReads": 0,
    "fileReads": 0,
    "fileWrites": 0,
    "identityDocumentReads": 0,
    "competenceEvidenceReads": 0,
    "contactRecordReads": 0,
    "signatureArtifactReads": 0,
    "networkRequests": 0,
    "providerRequests": 0,
    "externalContactAuthorized": false,
    "externalMessagesSent": 0,
    "businessWrites": 0,
    "reviewersAssigned": false,
    "reviewerIdentityVerified": false,
    "reviewerCompetenceVerified": false,
    "reviewerIndependenceVerified": false,
    "reviewerSignatureVerified": false,
    "conflictOfInterestResolved": false,
    "independentReviewStarted": false,
    "firstThreeBatchesIndependentReviewPassed": false,
    "dynamicModelOptionOwnerReady": false,
    "modelNativeNumericPalOptionOwnerReady": false,
    "healthReviewStillRequired": true,
    "healthReviewerAssigned": false,
    "healthContentApproved": false,
    "contentQaPassed": false,
    "ownerIntakeChanged": false,
    "ownerCardsScheduled": false,
    "px1Authorized": false,
    "px2Authorized": false,
    "ownerReviewAuthorized": false,
    "ownerChoiceRecorded": false,
    "decisionAcceptedRecorded": false,
    "formulaImplementationAuthorized": false,
    "persistenceImplementationAuthorized": false,
    "formalRootProjectAuthorized": false,
    "nativeIosWorkAuthorized": false,
    "formalImplementationAuthorized": false,
    "gateStatesChanged": false,
    "eventId": "EVT-20260822-014"
  };
  const d040FirstThreeBatchesReviewerAssignmentMatches =
    JSON.stringify(Object.keys(d040FirstThreeBatchesReviewerAssignmentHarness).sort()) ===
      JSON.stringify(Object.keys(expectedD040FirstThreeBatchesReviewerAssignmentHarness).sort()) &&
    Object.keys(expectedD040FirstThreeBatchesReviewerAssignmentHarness).every(
      (field) => JSON.stringify(d040FirstThreeBatchesReviewerAssignmentHarness[field]) ===
        JSON.stringify(expectedD040FirstThreeBatchesReviewerAssignmentHarness[field]),
    );
  if (!d040FirstThreeBatchesReviewerAssignmentMatches) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D040_FIRST_THREE_BATCHES_REVIEWER_ASSIGNMENT_HARNESS_GATE",
      "D-040",
      "D-040 前三批十三卡复核人指派 validator 未保持 PACKET-001-R1、四域逐域胜任、身份/起草/冲突/覆盖、联络/时序/签署、assignment SHA-256、21 测试、正式/合成隔离及候选人/联系人/外联/正式指派/复核/PASS/健康批准/Content QA/Owner/PX/实现全关闭边界",
      d040FirstThreeBatchesReviewerAssignmentHarness,
    );
  }
  const d040MacroAxisReviewerAssignmentRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260822-015",
  )?.value ?? null;
  const d040MacroAxisReviewerAssignmentHarness = {
    ...(d040MacroAxisReviewerAssignmentRecord?.data ?? {}),
    eventId: d040MacroAxisReviewerAssignmentRecord?.eventId ?? null,
  };
  const expectedD040MacroAxisReviewerAssignmentHarness = {
      "state": "completed",
      "contractStatus": "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
      "decisionId": "D-040",
      "decisionState": "CANDIDATE",
      "authoritativeState": "PX-0_INPUT_GAP",
      "from": "MACRO_AXIS_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      "to": "MACRO_AXIS_REVIEWER_ASSIGNMENT_INTAKE_AND_VALIDATOR_READY",
      "next": "NAMED_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED",
      "intakePacketId": "D040-MACRO-AXIS-REVIEWER-INTAKE-PACKET-001",
      "intakePacketArtifactCommit": "0410bb73f68650a021ce37e15f8756d02b5b4a57",
      "intakePacketBlobOid": "5679945dbbd29777a9ce59964587d98caa5af128",
      "reviewPacketId": "D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001",
      "reviewPacketVersion": "PACKET-001-R1",
      "packetEventId": "EVT-20260821-006",
      "inputManifestEventId": "EVT-20260821-007",
      "inputCommit": "47ba4895dac2535682e8d1a8cb985176d6ad45f7",
      "manifestRecordCommit": "d8e812f1324590d735f809ea994e8aaa2f6805d8",
      "packetArtifactCommit": "d8e812f1324590d735f809ea994e8aaa2f6805d8",
      "packetArtifactBlobOid": "ffa60df7e2204607780cd6ac4044a9da659bef90",
      "packetArtifactSha256": "b94af865ab611bc01e4cb75063d45fb65fcc877b207ea9996b4bacb8849bb060",
      "contractArtifactCommit": "9ada49a6e0dde108945b5cc3d9dc50e657dd24c9",
      "contractBlobOid": "1763adc4778e8cded0c1c9913556298d92a303ef",
      "artifactCommit": "3b94ca9210090569261c9f223baeb5f9a03de258",
      "implementationBlobOid": "3cc051bfccdb022e6d576ebf02fba6995c2560e5",
      "testBlobOid": "0ba1b19ef27681c9535bb5339f9967ba42db8eae",
      "documentationBlobOid": "a8b2b9e7345c31534244a973a8f715a13c92f5ac",
      "inputSchemaVersion": "D040_MACRO_AXIS_REVIEWER_ASSIGNMENT_INPUT_V1",
      "resultSchemaVersion": "D040_MACRO_AXIS_REVIEWER_ASSIGNMENT_RESULT_V1",
      "boundarySchemaVersion": "D040_MACRO_AXIS_REVIEWER_ASSIGNMENT_BOUNDARY_V1",
      "topLevelTests": 21,
      "fullSuitePassed": 1216,
      "isolatedSpikeTestsPassed": 10,
      "markdownFileCount": 160,
      "localMarkdownLinkCount": 584,
      "brokenLocalMarkdownLinkCount": 0,
      "requiredReviewerDomainCount": 4,
      "maximumReviewerCount": 20,
      "maximumDomainsPerReviewer": 4,
      "recordKinds": [
          "FORMAL_ASSIGNMENT_RECORD",
          "SYNTHETIC_CONTRACT_FIXTURE"
      ],
      "resultDispositions": [
          "STRUCTURALLY_COMPLETE_ASSIGNMENT_CANDIDATE",
          "SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY",
          "ASSIGNMENT_INCOMPLETE"
      ],
      "verificationStates": [
          "VERIFIED",
          "REJECTED",
          "PENDING"
      ],
      "conflictStates": [
          "NONE_DECLARED",
          "RESOLVED",
          "OPEN"
      ],
      "signatureMethods": [
          "SIGNED_DOCUMENT_REFERENCE",
          "VERIFIED_WORKFLOW_REFERENCE",
          "WET_SIGNATURE_REFERENCE"
      ],
      "strictDataTreeAndExactFields": true,
      "formalSyntheticIdentityAndReferenceIsolation": true,
      "reviewPacketIdentityExact": true,
      "reviewerDomainOrderExact": true,
      "competenceEvidenceByDomainRequired": true,
      "identitySelfVerificationRejected": true,
      "draftParticipantFailsClosed": true,
      "conflictResolutionRequired": true,
      "domainCoverageBidirectional": true,
      "reviewCanStartRecomputed": true,
      "assignmentContentSha256Required": true,
      "rfc3339ActualCalendarDateRequired": true,
      "sensitiveLookingFieldNamesAndValuesRejectedWithoutEcho": true,
      "immutableNormalizationAndResultFingerprintBound": true,
      "inputAuthorityClaimsCallerAssertedNotVerified": true,
      "identityClaimsCallerAssertedNotVerified": true,
      "competenceClaimsCallerAssertedNotVerified": true,
      "independenceClaimsCallerAssertedNotVerified": true,
      "contactAuthorizationClaimsCallerAssertedNotVerified": true,
      "formalAssignmentCandidateCanBeReturned": true,
      "formalAssignmentReadyCandidateCovered": true,
      "syntheticWouldBeAssignmentReadyCandidateCovered": true,
      "syntheticAssignmentReadyCandidateReturned": false,
      "reviewersAssignedReturned": false,
      "reviewCanStartReturned": false,
      "contractValidatorImplemented": true,
      "harnessReadsCallerSuppliedDataOnly": true,
      "intakePacketReady": true,
      "reviewPacketReady": true,
      "inputManifestFrozen": true,
      "reviewerCandidateCount": 0,
      "reviewerAssignmentRecordCount": 0,
      "controlledContactRecordCount": 0,
      "formalReviewRecordCount": 0,
      "reviewerAttestationRecordCount": 0,
      "syntheticFixturePersistedCount": 0,
      "gitReads": 0,
      "fileReads": 0,
      "fileWrites": 0,
      "identityDocumentReads": 0,
      "competenceEvidenceReads": 0,
      "contactRecordReads": 0,
      "signatureArtifactReads": 0,
      "networkRequests": 0,
      "providerRequests": 0,
      "externalContactAuthorized": false,
      "externalMessagesSent": 0,
      "businessWrites": 0,
      "reviewersAssigned": false,
      "reviewerIdentityVerified": false,
      "reviewerCompetenceVerified": false,
      "reviewerIndependenceVerified": false,
      "reviewerSignatureVerified": false,
      "conflictOfInterestResolved": false,
      "independentReviewStarted": false,
      "macroAxisIndependentReviewPassed": false,
      "currentFindingCountsMeasured": false,
      "healthReviewStillRequired": true,
      "healthReviewerAssigned": false,
      "healthContentApproved": false,
      "contentQaPassed": false,
      "d063Accepted": false,
      "d070Accepted": false,
      "d063OwnerReady": false,
      "d070OwnerReady": false,
      "d071OwnerReady": false,
      "d072OwnerReady": false,
      "ownerIntakeChanged": false,
      "ownerCardsScheduled": false,
      "px1Authorized": false,
      "px2Authorized": false,
      "ownerReviewAuthorized": false,
      "ownerChoiceRecorded": false,
      "decisionAcceptedRecorded": false,
      "goalImplementationAuthorized": false,
      "recordingImplementationAuthorized": false,
      "persistenceImplementationAuthorized": false,
      "formalRootProjectAuthorized": false,
      "nativeIosWorkAuthorized": false,
      "formalImplementationAuthorized": false,
      "gateStatesChanged": false,
      "eventId": "EVT-20260822-015"
  };
  const d040MacroAxisReviewerAssignmentMatches =
    JSON.stringify(Object.keys(d040MacroAxisReviewerAssignmentHarness).sort()) ===
      JSON.stringify(Object.keys(expectedD040MacroAxisReviewerAssignmentHarness).sort()) &&
    Object.keys(expectedD040MacroAxisReviewerAssignmentHarness).every(
      (field) => JSON.stringify(d040MacroAxisReviewerAssignmentHarness[field]) ===
        JSON.stringify(expectedD040MacroAxisReviewerAssignmentHarness[field]),
    );
  if (!d040MacroAxisReviewerAssignmentMatches) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D040_MACRO_AXIS_REVIEWER_ASSIGNMENT_HARNESS_GATE",
      "D-040",
      "D-040 四张宏量轴卡复核人指派 validator 未保持 PACKET-001-R1、输入清单事件、四域逐域胜任、身份/起草/冲突/覆盖、联络/时序/签署、assignment SHA-256、21 测试、正式/合成隔离及候选人/联系人/外联/正式指派/复核/PASS/健康批准/Content QA/D-063/D-070 接受/四卡 Owner-ready/Owner/PX/实现全关闭边界",
      d040MacroAxisReviewerAssignmentHarness,
    );
  }
  const d040ChinaHealthReviewerAssignmentRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260822-016",
  )?.value ?? null;
  const d040ChinaHealthReviewerAssignmentHarness = {
    ...(d040ChinaHealthReviewerAssignmentRecord?.data ?? {}),
    eventId: d040ChinaHealthReviewerAssignmentRecord?.eventId ?? null,
  };
  const expectedD040ChinaHealthReviewerAssignmentHarness = {
    "state": "completed",
    "contractStatus": "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    "decisionId": "D-040",
    "decisionState": "CANDIDATE",
    "authoritativeState": "PX-0_INPUT_GAP",
    "from": "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
    "to": "CHINA_HEALTH_REVIEWER_ASSIGNMENT_INTAKE_AND_VALIDATOR_READY",
    "next": "NAMED_CHINA_HEALTH_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED",
    "intakePacketId": "D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001",
    "intakePacketArtifactCommit": "0fd261ebf886a6d4c71042655ec1e28c9ba85bb0",
    "intakePacketBlobOid": "89f66cb38da0cd2865a343ac471e1cbe63de92c8",
    "reviewPacketId": "D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001",
    "reviewPacketVersion": "PACKET-001-R1",
    "packetEventId": "EVT-20260820-008",
    "inputCommit": "5c32cfb2083bbe904c458b68d92a97e1f8479ce5",
    "packetArtifactCommit": "0fd261ebf886a6d4c71042655ec1e28c9ba85bb0",
    "packetArtifactBlobOid": "89f66cb38da0cd2865a343ac471e1cbe63de92c8",
    "packetArtifactSha256": "7e48fa29be626429b63c31492d37b710f8f873d5f079aeb5c70dee918bf5f110",
    "contractInitialCommit": "1fcdaefb3194d1f540b490d47d8af53c021bae9d",
    "contractArtifactCommit": "53e4a27232fc6b74856612b0f252fe961437b56b",
    "contractBlobOid": "6fdf6f3ff308e67b06f5f1a111851189e46c1298",
    "artifactCommit": "53e4a27232fc6b74856612b0f252fe961437b56b",
    "implementationBlobOid": "9cf76acfce401770fdf10598e8a0457bd6dba776",
    "testBlobOid": "84ef9db13e1c7662f5aadcb2613ef7002a0df5f6",
    "documentationBlobOid": "b8384da11ef2f908e70bfc18ca514db81f5a7847",
    "inputSchemaVersion": "D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_INPUT_V1",
    "resultSchemaVersion": "D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_RESULT_V1",
    "boundarySchemaVersion": "D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_BOUNDARY_V1",
    "topLevelTests": 23,
    "fullSuitePassed": 1245,
    "isolatedSpikeTestsPassed": 10,
    "markdownFileCount": 162,
    "localMarkdownLinkCount": 591,
    "brokenLocalMarkdownLinkCount": 0,
    "requiredCompetenceScopeCount": 5,
    "maximumReviewerCount": 20,
    "maximumScopesPerReviewer": 5,
    "maximumReviewWindowDays": 90,
    "recordKinds": [
      "FORMAL_ASSIGNMENT_RECORD",
      "SYNTHETIC_CONTRACT_FIXTURE"
    ],
    "resultDispositions": [
      "STRUCTURALLY_COMPLETE_HEALTH_REVIEWER_ASSIGNMENT_CANDIDATE",
      "SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY",
      "ASSIGNMENT_INCOMPLETE"
    ],
    "verificationStates": [
      "VERIFIED",
      "REJECTED",
      "PENDING"
    ],
    "qualificationVerificationStates": [
      "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF",
      "REJECTED",
      "NOT_VERIFIED"
    ],
    "localeFitStates": [
      "PASS",
      "FAIL",
      "NOT_VERIFIED"
    ],
    "conflictStates": [
      "NONE_DECLARED",
      "RESOLVED",
      "OPEN"
    ],
    "signatureMethods": [
      "SIGNED_DOCUMENT_REFERENCE",
      "VERIFIED_WORKFLOW_REFERENCE",
      "WET_SIGNATURE_REFERENCE"
    ],
    "strictDataTreeAndExactFields": true,
    "formalSyntheticIdentityAndReferenceIsolation": true,
    "reviewPacketIdentityExact": true,
    "singleSelectedReviewerRequired": true,
    "selectedReviewerMustCoverAllScopes": true,
    "selectedReviewerMustNotSelfAssign": true,
    "personNamesCanonicalizedForIdentityComparison": true,
    "competenceScopeOrderExact": true,
    "competenceEvidenceByScopeRequired": true,
    "identitySelfVerificationRejected": true,
    "qualificationSelfVerificationRejected": true,
    "qualificationObservationCallerAssertedNotVerified": true,
    "localeAndRegionFitRequired": true,
    "localeAndRegionFitCallerAssertedNotVerified": true,
    "draftParticipantFailsClosed": true,
    "conflictResolutionRequired": true,
    "scopeCoverageBidirectional": true,
    "reviewCanStartRecomputed": true,
    "assignmentContentSha256Required": true,
    "rfc3339ActualCalendarDateRequired": true,
    "sensitiveLookingFieldNamesAndValuesRejectedWithoutEcho": true,
    "immutableNormalizationAndResultFingerprintBound": true,
    "inputAuthorityClaimsCallerAssertedNotVerified": true,
    "identityClaimsCallerAssertedNotVerified": true,
    "qualificationClaimsCallerAssertedNotVerified": true,
    "competenceClaimsCallerAssertedNotVerified": true,
    "independenceClaimsCallerAssertedNotVerified": true,
    "contactAuthorizationClaimsCallerAssertedNotVerified": true,
    "formalAssignmentCandidateCanBeReturned": true,
    "formalAssignmentReadyCandidateCovered": true,
    "syntheticWouldBeAssignmentReadyCandidateCovered": true,
    "syntheticAssignmentReadyCandidateReturned": false,
    "reviewerAssignedReturned": false,
    "reviewCanStartReturned": false,
    "contractValidatorImplemented": true,
    "harnessReadsCallerSuppliedDataOnly": true,
    "intakePacketReady": true,
    "reviewPacketReady": true,
    "inputCommitFrozen": true,
    "reviewerCandidateCount": 0,
    "reviewerAssignmentRecordCount": 0,
    "controlledContactRecordCount": 0,
    "formalHealthReviewRecordCount": 0,
    "reviewerAttestationRecordCount": 0,
    "syntheticFixturePersistedCount": 0,
    "gitReads": 0,
    "fileReads": 0,
    "fileWrites": 0,
    "identityDocumentReads": 0,
    "qualificationRegistryReads": 0,
    "competenceEvidenceReads": 0,
    "contactRecordReads": 0,
    "signatureArtifactReads": 0,
    "networkRequests": 0,
    "providerRequests": 0,
    "externalContactAuthorized": false,
    "externalMessagesSent": 0,
    "businessWrites": 0,
    "reviewerAssigned": false,
    "healthReviewerAssigned": false,
    "reviewerIdentityVerified": false,
    "reviewerQualificationVerified": false,
    "reviewerCompetenceVerified": false,
    "reviewerLocaleFitVerified": false,
    "reviewerIndependenceVerified": false,
    "reviewerSignatureVerified": false,
    "conflictOfInterestResolved": false,
    "healthReviewStarted": false,
    "healthReviewStillRequired": true,
    "healthContentApproved": false,
    "contentQaPassed": false,
    "currentFindingCountsMeasured": false,
    "d068OwnerReady": false,
    "d069OwnerReady": false,
    "d063OwnerReady": false,
    "firstThreeBatchesIndependentReviewPassed": false,
    "ownerIntakeChanged": false,
    "ownerCardsScheduled": false,
    "px1Authorized": false,
    "px2Authorized": false,
    "ownerReviewAuthorized": false,
    "ownerChoiceRecorded": false,
    "decisionAcceptedRecorded": false,
    "healthCopyImplementationAuthorized": false,
    "formulaImplementationAuthorized": false,
    "formalRootProjectAuthorized": false,
    "nativeIosWorkAuthorized": false,
    "formalImplementationAuthorized": false,
    "gateStatesChanged": false,
    "eventId": "EVT-20260822-016"
  };
  const d040ChinaHealthReviewerAssignmentMatches =
    JSON.stringify(Object.keys(d040ChinaHealthReviewerAssignmentHarness).sort()) ===
      JSON.stringify(Object.keys(expectedD040ChinaHealthReviewerAssignmentHarness).sort()) &&
    Object.keys(expectedD040ChinaHealthReviewerAssignmentHarness).every(
      (field) => JSON.stringify(d040ChinaHealthReviewerAssignmentHarness[field]) ===
        JSON.stringify(expectedD040ChinaHealthReviewerAssignmentHarness[field]),
    );
  if (!d040ChinaHealthReviewerAssignmentMatches) {
    addDiagnostic(
      diagnostics,
      "error",
      "OPS_RECONCILE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_HARNESS_GATE",
      "D-040",
      "D-040 中国健康评审人指派 validator 未保持 PACKET-001-R1、唯一入选候选人、五项胜任、身份/资质/地域/起草/冲突/覆盖、联络/90 天时序/签署、assignment SHA-256、23 测试、正式/合成隔离及候选人/联系人/注册表读取/外联/正式指派/健康评审/批准/Content QA/D-068/D-069/D-063 Owner-ready/前三批 PASS/Owner/PX/实现全关闭边界",
      d040ChinaHealthReviewerAssignmentHarness,
    );
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
  const d040ChinaMacroInputRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260820-006",
  )?.value ?? null;
  const d040NiddkDynamicModelInputRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260820-007",
  )?.value ?? null;
  const d040ChinaHealthReviewerPacketRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260820-008",
  )?.value ?? null;
  const d040IndependentReviewPacketRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260821-001",
  )?.value ?? null;
  const d040D063CardRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260821-002",
  )?.value ?? null;
  const d040D070CardRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260821-003",
  )?.value ?? null;
  const d040D071CardRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260821-004",
  )?.value ?? null;
  const d040D072CardRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260821-005",
  )?.value ?? null;
  const d040MacroAxisReviewPacketRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260821-006",
  )?.value ?? null;
  const d040MacroAxisInputManifestFreezeRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260821-007",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryCardSpecRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-005",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryCardHarnessRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-006",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryReviewPacketRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-007",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryReviewRecordHarnessRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-008",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-009",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryReviewerIntakePacketRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-010",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryReviewHandoffChecklistRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-011",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryReviewStartGapRegisterRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-012",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-013",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-014",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-015",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-016",
  )?.value ?? null;
  const d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord = model.events.find(
    (record) => record.value?.eventId === "EVT-20260827-017",
  )?.value ?? null;
  const d040 = {
    eventId: d040Record?.eventId ?? null,
    decisionState: d040Record?.data?.decisionState ?? null,
    authoritativeState: d040Record?.data?.authoritativeState ?? null,
    next: d040Record?.data?.next ?? null,
    nonDiagnosticBoundaryEventId: d040NonDiagnosticBoundaryCardSpecRecord?.eventId ?? null,
    nonDiagnosticBoundaryStatus:
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.contractStatus ?? null,
    nonDiagnosticBoundaryCardDecisionIds:
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.cardDecisionIds ?? null,
    nonDiagnosticBoundaryCardCount:
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.cardCount ?? null,
    d068QuestionId: d040NonDiagnosticBoundaryCardSpecRecord?.data?.d068QuestionId ?? null,
    d069QuestionId: d040NonDiagnosticBoundaryCardSpecRecord?.data?.d069QuestionId ?? null,
    d068OptionCount: d040NonDiagnosticBoundaryCardSpecRecord?.data?.d068OptionCount ?? null,
    d069OptionCount: d040NonDiagnosticBoundaryCardSpecRecord?.data?.d069OptionCount ?? null,
    d068RecommendedOptionId:
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.d068RecommendedOptionId ?? null,
    d069RecommendedOptionId:
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.d069RecommendedOptionId ?? null,
    nonDiagnosticYesOrUnsurePausesAutomaticEstimates:
      d040NonDiagnosticBoundaryCardSpecRecord?.data
        ?.chronicConditionOrMedicationYesPausesAutomaticEstimates ?? null,
    nonDiagnosticUnsureCannotBecomeNoRisk:
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.unsureCannotBecomeNoRisk ?? null,
    nonDiagnosticEatingDisorderRiskPausesTargets:
      d040NonDiagnosticBoundaryCardSpecRecord?.data
        ?.eatingDisorderRiskPausesWeightLossAndMacroTargets ?? null,
    nonDiagnosticPlainLanguageUncertaintyRecommended:
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.plainLanguageUncertaintyRecommended ?? null,
    nonDiagnosticNumericUncertaintyRequiresEvidence:
      d040NonDiagnosticBoundaryCardSpecRecord?.data
        ?.numericUncertaintyRequiresValidatedEvidence ?? null,
    nonDiagnosticPopulationErrorNotPersonalBounds:
      d040NonDiagnosticBoundaryCardSpecRecord?.data
        ?.populationErrorCannotBecomePersonalBounds ?? null,
    nonDiagnosticNoSideEffects: [
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.healthKitWriteAuthorized === false,
    ].every((value) => value === true),
    nonDiagnosticReviewAndOwnerClosed: [
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.ownerChoiceRecorded === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.decisionAcceptedRecorded === false,
    ].every((value) => value === true),
    nonDiagnosticPxAndImplementationClosed: [
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryCardSpecRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticHarnessEventId: d040NonDiagnosticBoundaryCardHarnessRecord?.eventId ?? null,
    nonDiagnosticHarnessStatus:
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.contractStatus ?? null,
    nonDiagnosticHarnessTopLevelTests:
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.topLevelTests ?? null,
    nonDiagnosticHarnessCardSpecEventId:
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticHarnessRecommendationsNotOwnerChoices:
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.optionRecommendationsAreNotOwnerChoices ?? null,
    nonDiagnosticHarnessSyntheticIsNotEvidence:
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.syntheticFixtureIsNotEvidence ?? null,
    nonDiagnosticHarnessCallerHealthContextIsNotDiagnosis:
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.callerHealthContextIsNotDiagnosis ?? null,
    nonDiagnosticHarnessNumericEvidenceCallerAsserted:
      d040NonDiagnosticBoundaryCardHarnessRecord?.data
        ?.numericUncertaintyEvidenceCallerAssertedNotVerified ?? null,
    nonDiagnosticHarnessFailClosedSemantics: [
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.yesOrUnsurePausesAutomaticEstimates === true,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.unsureCannotBecomeNoRisk === true,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.eatingDisorderRiskPausesWeightLossAndMacroTargets === true,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.plainLanguageUncertaintyNoNumericBounds === true,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.validatedNumericUncertaintyStructuralOnly === true,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.populationErrorCannotBecomePersonalBounds === true,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.notApplicableIsConditionalSkipNotOwnerChoice === true,
    ].every((value) => value === true),
    nonDiagnosticHarnessNoSideEffects: [
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.harnessReadsCallerSuppliedDataOnly === true,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.gitReads === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.fileReads === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.fileWrites === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.networkRequests === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.providerRequests === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.credentialReads === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.businessWrites === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.healthDataWrites === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.ownerIntakeWrites === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.automaticDialEffects === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.locationReads === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.contactsReads === 0,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.healthKitWrites === 0,
    ].every((value) => value === true),
    nonDiagnosticHarnessReviewOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryCardHarnessRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticReviewPacketEventId: d040NonDiagnosticBoundaryReviewPacketRecord?.eventId ?? null,
    nonDiagnosticReviewPacketStatus:
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.packetStatus ?? null,
    nonDiagnosticReviewPacketVersion:
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.packetVersion ?? null,
    nonDiagnosticReviewPacketCardSpecEventId:
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticReviewPacketCardHarnessEventId:
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticReviewPacketRequiredInputCount:
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.requiredInputCount ?? null,
    nonDiagnosticReviewPacketRequiredDomainCount:
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.requiredReviewDomainCount ?? null,
    nonDiagnosticReviewPacketRequiredCardDispositionCount:
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.requiredCardDispositionCount ?? null,
    nonDiagnosticReviewPacketRequiredInvariantCount:
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.requiredCrossCardInvariantCount ?? null,
    nonDiagnosticReviewPacketNamedReviewerRequired:
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.namedReviewerRequired ?? null,
    nonDiagnosticReviewPacketCannotSelfApprove: [
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.authorOrPmCanSelfApprove === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.aiOrAgentCanBeIndependentReviewer === false,
    ].every((value) => value === true),
    nonDiagnosticReviewPacketFailClosedSemantics: [
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.recommendationsAreNotOwnerChoices === true,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.notApplicableIsConditionalSkipNotOwnerChoice === true,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.yesOrUnsureFailClosedRequired === true,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.eatingDisorderRiskPausesTargetsRequired === true,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.numericUncertaintyRequiresValidatedEvidence === true,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.populationErrorCannotBecomePersonalBounds === true,
    ].every((value) => value === true),
    nonDiagnosticReviewPacketNoSideEffects: [
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.externalMessageSent === false,
    ].every((value) => value === true),
    nonDiagnosticReviewPacketReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewPacketRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.eventId ?? null,
    nonDiagnosticReviewRecordHarnessStatus:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.contractStatus ?? null,
    nonDiagnosticReviewRecordHarnessReviewPacketEventId:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticReviewRecordHarnessCardSpecEventId:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticReviewRecordHarnessCardHarnessEventId:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticReviewRecordHarnessTopLevelTests:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.topLevelTests ?? null,
    nonDiagnosticReviewRecordHarnessRequiredInputCount:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.requiredInputCount ?? null,
    nonDiagnosticReviewRecordHarnessRequiredDomainCount:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.requiredReviewDomainCount ?? null,
    nonDiagnosticReviewRecordHarnessRequiredCardDispositionCount:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.requiredCardDispositionCount ?? null,
    nonDiagnosticReviewRecordHarnessRequiredInvariantCount:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.requiredCrossCardInvariantCount ?? null,
    nonDiagnosticReviewRecordHarnessDoubleSha256:
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.reviewContentSha256Required === true &&
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.bundleSha256Required === true,
    nonDiagnosticReviewRecordHarnessStrictAndFailClosed: [
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.strictDataTreeAndExactFields === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.formalSyntheticIdentityAndReferenceIsolation === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.reviewPacketIdentityExact === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.reviewerDomainOrderExact === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.competenceEvidenceByDomainRequired === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.identitySelfVerificationRejected === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.draftParticipantFailsClosed === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.conflictResolutionRequired === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.domainCoverageBidirectional === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.findingBidirectionalLinksRequired === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.blockingFindingPriorityEnforced === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.openP3RequiresOwnerDueDateAndRationale === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data
        ?.sensitiveLookingFieldNamesAndValuesRejectedWithoutEcho === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data
        ?.immutableNormalizationAndResultFingerprintBound === true,
    ].every((value) => value === true),
    nonDiagnosticReviewRecordHarnessSyntheticIsNotEvidence: [
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.syntheticContractFixtureOnly === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.syntheticWouldBeReviewPassCandidateCovered === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.syntheticReviewPassCandidateReturned === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.formalCompleteStillRequiresAuthoritativeReviewEvent === true,
    ].every((value) => value === true),
    nonDiagnosticReviewRecordHarnessNoSideEffects: [
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.harnessReadsCallerSuppliedDataOnly === true,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.gitReads === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.fileReads === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.fileWrites === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.identityDocumentReads === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.competenceEvidenceReads === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.signatureArtifactReads === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.networkRequests === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.providerRequests === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.credentialReads === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.businessWrites === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.healthDataWrites === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.ownerIntakeWrites === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.automaticDialEffects === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.locationReads === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.contactsReads === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.healthKitWrites === 0,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.externalMessagesSent === 0,
    ].every((value) => value === true),
    nonDiagnosticReviewRecordHarnessReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.d063Accepted === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.d070Accepted === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewRecordHarnessRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticReviewerAssignmentHarnessEventId:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.eventId ?? null,
    nonDiagnosticReviewerAssignmentHarnessStatus:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.contractStatus ?? null,
    nonDiagnosticReviewerAssignmentHarnessReviewPacketEventId:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticReviewerAssignmentHarnessReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewRecordHarnessEventId ?? null,
    nonDiagnosticReviewerAssignmentHarnessCardSpecEventId:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticReviewerAssignmentHarnessCardHarnessEventId:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticReviewerAssignmentHarnessTopLevelTests:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.topLevelTests ?? null,
    nonDiagnosticReviewerAssignmentHarnessRequiredDomainCount:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.requiredReviewDomainCount ?? null,
    nonDiagnosticReviewerAssignmentHarnessCandidateMinCount:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.candidateReviewerMinCount ?? null,
    nonDiagnosticReviewerAssignmentHarnessCandidateMaxCount:
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.candidateReviewerMaxCount ?? null,
    nonDiagnosticReviewerAssignmentHarnessStrictAndFailClosed: [
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewPacketIdentityExact === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.domainCoverageBidirectional === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.competenceEvidenceByDomainRequired === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.identitySelfVerificationRejected === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.roleNameReviewerRejected === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.draftParticipantFailsClosed === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.conflictResolutionRequired === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.externalContactAuthorizationRequired === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.assignmentEvidenceRequired === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.signaturePlanRequired === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.calendarDueAfterAssignmentRequired === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data
        ?.sensitiveLookingFieldNamesAndValuesRejectedWithoutEcho === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data
        ?.immutableNormalizationAndResultFingerprintBound === true,
    ].every((value) => value === true),
    nonDiagnosticReviewerAssignmentHarnessSyntheticIsNotEvidence: [
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewerAssignmentReadyCandidateReturned === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.syntheticAssignmentReadyCandidateReturned === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewCanStartReturned === false,
    ].every((value) => value === true),
    nonDiagnosticReviewerAssignmentHarnessNoSideEffects: [
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.harnessReadsCallerSuppliedDataOnly === true,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.gitReads === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.fileReads === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.fileWrites === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.identityDocumentReads === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.competenceEvidenceReads === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.contactRecordReads === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.signatureArtifactReads === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.networkRequests === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.providerRequests === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.credentialReads === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.businessWrites === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.healthDataWrites === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.ownerIntakeWrites === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.automaticDialEffects === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.locationReads === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.contactsReads === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.healthKitWrites === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.externalMessagesSent === 0,
    ].every((value) => value === true),
    nonDiagnosticReviewerAssignmentHarnessReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.formalAssignmentRecords === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.controlledContactRecords === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.realReviewerCandidatesRecorded === 0,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.externalContactAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.conflictOfInterestResolved === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewerAssignmentHarnessRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticReviewerIntakePacketEventId:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.eventId ?? null,
    nonDiagnosticReviewerIntakePacketStatus:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.contractStatus ?? null,
    nonDiagnosticReviewerIntakePacketReviewPacketEventId:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticReviewerIntakePacketReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.reviewRecordHarnessEventId ?? null,
    nonDiagnosticReviewerIntakePacketReviewerAssignmentHarnessEventId:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.reviewerAssignmentHarnessEventId ?? null,
    nonDiagnosticReviewerIntakePacketCardSpecEventId:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticReviewerIntakePacketCardHarnessEventId:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticReviewerIntakePacketRequiredInputCount:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.requiredInputCount ?? null,
    nonDiagnosticReviewerIntakePacketRequiredDomainCount:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.requiredReviewDomainCount ?? null,
    nonDiagnosticReviewerIntakePacketCandidateMinCount:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.candidateReviewerMinCount ?? null,
    nonDiagnosticReviewerIntakePacketCandidateMaxCount:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.candidateReviewerMaxCount ?? null,
    nonDiagnosticReviewerIntakePacketContractCorrected:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.contractPacketIdentityCorrected ?? null,
    nonDiagnosticReviewerIntakePacketTemplateResidueRemoved:
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.contractMacroAxisTemplateResidueRemoved ?? null,
    nonDiagnosticReviewerIntakePacketHandoffReady: [
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.unsentRequestTemplateIncluded === true,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.sensitiveStorageBoundaryDocumented === true,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.assignmentRecordMinimumFieldsDocumented === true,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.reviewHandoffRulesDocumented === true,
    ].every((value) => value === true),
    nonDiagnosticReviewerIntakePacketReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.realReviewerCandidatesRecorded === 0,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.controlledContactRecords === 0,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.formalAssignmentRecords === 0,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.externalContactAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.externalMessagesSent === 0,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.conflictOfInterestResolved === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewerIntakePacketRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticReviewHandoffChecklistEventId:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.eventId ?? null,
    nonDiagnosticReviewHandoffChecklistStatus:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.checklistStatus ?? null,
    nonDiagnosticReviewHandoffChecklistReviewPacketEventId:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticReviewHandoffChecklistReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewRecordHarnessEventId ?? null,
    nonDiagnosticReviewHandoffChecklistReviewerAssignmentHarnessEventId:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewerAssignmentHarnessEventId ?? null,
    nonDiagnosticReviewHandoffChecklistReviewerIntakePacketEventId:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewerIntakePacketEventId ?? null,
    nonDiagnosticReviewHandoffChecklistCardSpecEventId:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticReviewHandoffChecklistCardHarnessEventId:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticReviewHandoffChecklistRequiredInputCount:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.requiredInputCount ?? null,
    nonDiagnosticReviewHandoffChecklistRequiredDomainCount:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.requiredReviewDomainCount ?? null,
    nonDiagnosticReviewHandoffChecklistRequiredPrerequisiteCount:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.requiredPrerequisiteCount ?? null,
    nonDiagnosticReviewHandoffChecklistStartGateConditionCount:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.startGateConditionCount ?? null,
    nonDiagnosticReviewHandoffChecklistFailClosedConditionCount:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.failClosedConditionCount ?? null,
    nonDiagnosticReviewHandoffChecklistSensitiveClassCount:
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.forbiddenStoredSensitiveClassCount ?? null,
    nonDiagnosticReviewHandoffChecklistBindingsReady: [
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewPacketReady === true,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewerIntakePacketReady === true,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.assignmentContractReady === true,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewRecordContractReady === true,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.handoffChecklistReady === true,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.startGateRulesDocumented === true,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.forbiddenHandoffCasesDocumented === true,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.minimumStateVectorDocumented === true,
    ].every((value) => value === true),
    nonDiagnosticReviewHandoffChecklistReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewerCandidateCount === 0,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.controlledContactRecordCount === 0,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.formalAssignmentRecordCount === 0,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.formalReviewRecordCount === 0,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewerAttestationRecordCount === 0,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.externalContactAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.externalMessagesSent === 0,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewCanStart === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.conflictOfInterestResolved === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewHandoffChecklistRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticReviewStartGapRegisterEventId:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.eventId ?? null,
    nonDiagnosticReviewStartGapRegisterStatus:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.gapRegisterStatus ?? null,
    nonDiagnosticReviewStartGapRegisterReviewPacketEventId:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticReviewStartGapRegisterReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewRecordHarnessEventId ?? null,
    nonDiagnosticReviewStartGapRegisterReviewerAssignmentHarnessEventId:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewerAssignmentHarnessEventId ?? null,
    nonDiagnosticReviewStartGapRegisterReviewerIntakePacketEventId:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewerIntakePacketEventId ?? null,
    nonDiagnosticReviewStartGapRegisterHandoffChecklistEventId:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewHandoffChecklistEventId ?? null,
    nonDiagnosticReviewStartGapRegisterCardSpecEventId:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticReviewStartGapRegisterCardHarnessEventId:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticReviewStartGapRegisterGapCount:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.gapCount ?? null,
    nonDiagnosticReviewStartGapRegisterOpenGapCount:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.openGapCount ?? null,
    nonDiagnosticReviewStartGapRegisterClosedGapCount:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.closedGapCount ?? null,
    nonDiagnosticReviewStartGapRegisterStartBlockerCount:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.startBlockerCount ?? null,
    nonDiagnosticReviewStartGapRegisterRequiredPrerequisiteCount:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.requiredPrerequisiteCount ?? null,
    nonDiagnosticReviewStartGapRegisterRequiredDomainCount:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.requiredReviewDomainCount ?? null,
    nonDiagnosticReviewStartGapRegisterRequiredInputCount:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.requiredInputCount ?? null,
    nonDiagnosticReviewStartGapRegisterFailClosedConditionCount:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.failClosedConditionCount ?? null,
    nonDiagnosticReviewStartGapRegisterSensitiveClassCount:
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.forbiddenStoredSensitiveClassCount ?? null,
    nonDiagnosticReviewStartGapRegisterBindingsReady: [
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.gapRegisterReady === true,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.handoffChecklistReady === true,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.allGapsOpen === true,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.closureRequiresSeparateAuthorizedRecords === true,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.syntheticContractFixtureOnly === true,
    ].every((value) => value === true),
    nonDiagnosticReviewStartGapRegisterReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewerCandidateCount === 0,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.controlledContactRecordCount === 0,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.formalAssignmentRecordCount === 0,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.formalReviewRecordCount === 0,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewerAttestationRecordCount === 0,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.externalContactAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.externalMessagesSent === 0,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewCanStart === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.conflictOfInterestResolved === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.ownerChoiceRecorded === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.decisionAcceptedRecorded === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewStartGapRegisterRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticFormalAssignmentTemplateEventId:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.eventId ?? null,
    nonDiagnosticFormalAssignmentTemplateStatus:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.templateStatus ?? null,
    nonDiagnosticFormalAssignmentTemplateReviewPacketEventId:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticFormalAssignmentTemplateReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewRecordHarnessEventId ?? null,
    nonDiagnosticFormalAssignmentTemplateReviewerAssignmentHarnessEventId:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewerAssignmentHarnessEventId ?? null,
    nonDiagnosticFormalAssignmentTemplateReviewerIntakePacketEventId:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewerIntakePacketEventId ?? null,
    nonDiagnosticFormalAssignmentTemplateHandoffChecklistEventId:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewHandoffChecklistEventId ?? null,
    nonDiagnosticFormalAssignmentTemplateStartGapRegisterEventId:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewStartGapRegisterEventId ?? null,
    nonDiagnosticFormalAssignmentTemplateCardSpecEventId:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticFormalAssignmentTemplateCardHarnessEventId:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticFormalAssignmentTemplateSectionCount:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.templateSectionCount ?? null,
    nonDiagnosticFormalAssignmentTemplateRequiredBindingCount:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.requiredBindingCount ?? null,
    nonDiagnosticFormalAssignmentTemplateRequiredFutureRecordSectionCount:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.requiredFutureRecordSectionCount ?? null,
    nonDiagnosticFormalAssignmentTemplateSensitiveClassCount:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.sensitiveStorageForbiddenClassCount ?? null,
    nonDiagnosticFormalAssignmentTemplateStartGateConditionCount:
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.startGateConditionCount ?? null,
    nonDiagnosticFormalAssignmentTemplateBindingsReady: [
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.assignmentTemplateReady === true,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.emptyRecordOnly === true,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.gapRegisterReady === true,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.closureRequiresSeparateAuthorizedRecords === true,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.syntheticContractFixtureOnly === true,
    ].every((value) => value === true),
    nonDiagnosticFormalAssignmentTemplateReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewerCandidateCount === 0,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.controlledContactRecordCount === 0,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.formalAssignmentRecordCount === 0,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.formalReviewRecordCount === 0,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewerAttestationRecordCount === 0,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.externalContactAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.externalMessagesSent === 0,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewCanStart === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.conflictOfInterestResolved === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.ownerChoiceRecorded === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.decisionAcceptedRecorded === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryFormalAssignmentRecordTemplateRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticAssignmentAuthorizationPreflightEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.eventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightStatus:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.preflightStatus ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightReviewPacketEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewRecordHarnessEventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightReviewerAssignmentHarnessEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewerAssignmentHarnessEventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightReviewerIntakePacketEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewerIntakePacketEventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightHandoffChecklistEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewHandoffChecklistEventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightStartGapRegisterEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewStartGapRegisterEventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightFormalTemplateEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.formalAssignmentRecordTemplateEventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightCardSpecEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightCardHarnessEventId:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightItemCount:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.preflightItemCount ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightMissingItemCount:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.missingPreflightItemCount ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightClosedItemCount:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.closedPreflightItemCount ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightScopeBindingCount:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.authorizationScopeBindingCount ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightStartGateConditionCount:
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.startGateConditionCount ?? null,
    nonDiagnosticAssignmentAuthorizationPreflightBindingsReady: [
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.authorizationPreflightChecklistReady === true,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.authorizationNotGranted === true,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.contactAuthorizationCanBeInferred === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.assignmentTemplateReady === true,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.emptyRecordOnly === true,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.closureRequiresSeparateAuthorizedRecords === true,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.syntheticContractFixtureOnly === true,
    ].every((value) => value === true),
    nonDiagnosticAssignmentAuthorizationPreflightReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewerCandidateCount === 0,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.controlledContactRecordCount === 0,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.formalAssignmentRecordCount === 0,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.formalReviewRecordCount === 0,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewerAttestationRecordCount === 0,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.externalContactAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.externalMessagesSent === 0,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.materialPacketSent === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewCanStart === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.conflictOfInterestResolved === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.ownerChoiceRecorded === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.decisionAcceptedRecorded === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryAssignmentAuthorizationPreflightChecklistRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticContactAuthorizationRecordContractEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.eventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractStatus:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.contractStatus ?? null,
    nonDiagnosticContactAuthorizationRecordContractReviewPacketEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewRecordHarnessEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractReviewerAssignmentHarnessEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewerAssignmentHarnessEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractReviewerIntakePacketEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewerIntakePacketEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractHandoffChecklistEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewHandoffChecklistEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractStartGapRegisterEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewStartGapRegisterEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractFormalTemplateEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.formalAssignmentRecordTemplateEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractPreflightChecklistEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.assignmentAuthorizationPreflightChecklistEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractCardSpecEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractCardHarnessEventId:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticContactAuthorizationRecordContractSchemaFieldCount:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.authorizationRecordSchemaFieldCount ?? null,
    nonDiagnosticContactAuthorizationRecordContractRequiredBoundPriorEventCount:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.requiredBoundPriorEventCount ?? null,
    nonDiagnosticContactAuthorizationRecordContractSensitiveClassCount:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.sensitiveStorageForbiddenClassCount ?? null,
    nonDiagnosticContactAuthorizationRecordContractAcceptanceRuleCount:
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.acceptanceRuleCount ?? null,
    nonDiagnosticContactAuthorizationRecordContractBindingsReady: [
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.authorizationRecordContractReady === true,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.authorizationRecordCount === 0,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.authorizationPreflightChecklistReady === true,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.authorizationNotGranted === true,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.contactAuthorizationCanBeInferred === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.authorizationRecordCanBeInferred === false,
    ].every((value) => value === true),
    nonDiagnosticContactAuthorizationRecordContractReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewerCandidateCount === 0,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.controlledContactRecordCount === 0,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.formalAssignmentRecordCount === 0,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.formalReviewRecordCount === 0,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewerAttestationRecordCount === 0,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.externalContactAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.externalMessagesSent === 0,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.materialPacketSent === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewCanStart === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.conflictOfInterestResolved === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.ownerChoiceRecorded === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.decisionAcceptedRecorded === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryContactAuthorizationRecordContractRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticReviewerCandidateRosterContractEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.eventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractStatus:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.contractStatus ?? null,
    nonDiagnosticReviewerCandidateRosterContractReviewPacketEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewRecordHarnessEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractReviewerAssignmentHarnessEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerAssignmentHarnessEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractReviewerIntakePacketEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerIntakePacketEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractHandoffChecklistEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewHandoffChecklistEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractStartGapRegisterEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewStartGapRegisterEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractFormalTemplateEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.formalAssignmentRecordTemplateEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractPreflightChecklistEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.assignmentAuthorizationPreflightChecklistEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractContactAuthorizationRecordContractEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.contactAuthorizationRecordContractEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractCardSpecEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractCardHarnessEventId:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticReviewerCandidateRosterContractSchemaFieldCount:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerCandidateRosterSchemaFieldCount ?? null,
    nonDiagnosticReviewerCandidateRosterContractRequiredBoundPriorEventCount:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.requiredBoundPriorEventCount ?? null,
    nonDiagnosticReviewerCandidateRosterContractSensitiveClassCount:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.sensitiveStorageForbiddenClassCount ?? null,
    nonDiagnosticReviewerCandidateRosterContractAcceptanceRuleCount:
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.acceptanceRuleCount ?? null,
    nonDiagnosticReviewerCandidateRosterContractBindingsReady: [
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerCandidateRosterContractReady === true,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerCandidateRosterCount === 0,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.authorizationRecordContractReady === true,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.authorizationRecordCount === 0,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.authorizationNotGranted === true,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.contactAuthorizationCanBeInferred === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.authorizationRecordCanBeInferred === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerCandidateCanBeInferred === false,
    ].every((value) => value === true),
    nonDiagnosticReviewerCandidateRosterContractReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerCandidateCount === 0,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.controlledContactRecordCount === 0,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.formalAssignmentRecordCount === 0,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.formalReviewRecordCount === 0,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerAttestationRecordCount === 0,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.externalContactAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.externalMessagesSent === 0,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.materialPacketSent === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewCanStart === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.conflictOfInterestResolved === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.ownerChoiceRecorded === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.decisionAcceptedRecorded === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewerCandidateRosterContractRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    nonDiagnosticReviewMaterialPacketRecordContractEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.eventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractStatus:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.contractStatus ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractReviewPacketEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewPacketEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractReviewRecordHarnessEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewRecordHarnessEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractReviewerAssignmentHarnessEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerAssignmentHarnessEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractReviewerIntakePacketEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerIntakePacketEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractHandoffChecklistEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewHandoffChecklistEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractStartGapRegisterEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewStartGapRegisterEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractFormalTemplateEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.formalAssignmentRecordTemplateEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractPreflightChecklistEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.assignmentAuthorizationPreflightChecklistEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractContactAuthorizationRecordContractEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.contactAuthorizationRecordContractEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractReviewerCandidateRosterContractEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerCandidateRosterContractEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractCardSpecEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.cardSpecEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractCardHarnessEventId:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.cardHarnessEventId ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractSchemaFieldCount:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewMaterialPacketRecordSchemaFieldCount ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractRequiredBoundPriorEventCount:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.requiredBoundPriorEventCount ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractSensitiveClassCount:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.sensitiveStorageForbiddenClassCount ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractAcceptanceRuleCount:
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.acceptanceRuleCount ?? null,
    nonDiagnosticReviewMaterialPacketRecordContractBindingsReady: [
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewMaterialPacketRecordContractReady === true,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewMaterialPacketRecordCount === 0,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerCandidateRosterContractReady === true,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerCandidateRosterCount === 0,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.authorizationRecordContractReady === true,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.authorizationRecordCount === 0,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.authorizationNotGranted === true,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.materialPacketSent === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.materialPacketRecordCanBeInferred === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerCandidateCanBeInferred === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.contactAuthorizationCanBeInferred === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.authorizationRecordCanBeInferred === false,
    ].every((value) => value === true),
    nonDiagnosticReviewMaterialPacketRecordContractReviewHealthOwnerPxImplementationClosed: [
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerCandidateCount === 0,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.controlledContactRecordCount === 0,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.formalAssignmentRecordCount === 0,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.formalReviewRecordCount === 0,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerAttestationRecordCount === 0,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.externalContactAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.externalMessagesSent === 0,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.materialPacketSent === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewCanStart === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewersAssigned === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerIdentityVerified === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerCompetenceVerified === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerIndependenceVerified === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.reviewerSignatureVerified === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.conflictOfInterestResolved === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.independentReviewStarted === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.independentReviewPassed === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.healthReviewerAssigned === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.healthContentApproved === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.contentQaPassed === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.d068OwnerReady === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.d069OwnerReady === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.ownerIntakeChanged === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.ownerCardScheduled === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.ownerReviewAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.ownerChoiceRecorded === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.decisionAcceptedRecorded === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.px1Authorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.px2Authorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.diagnosisOrTreatmentAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.medicationDetailCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.healthFreeTextCollectionAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.healthDataPersistenceAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.automaticDialAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.networkResourceRefreshAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.locationReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.contactsReadAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.healthKitWriteAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.formulaImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.healthCopyImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.formalRootProjectAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.nativeIosWorkAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.formalImplementationAuthorized === false,
      d040NonDiagnosticBoundaryReviewMaterialPacketRecordContractRecord?.data?.gateStatesChanged === false,
    ].every((value) => value === true),
    sourceDraftQuestionCount: d040AllocationRecord?.data?.sourceDraftQuestionCount ?? null,
    resolvedDecisionAxisCount: d040AllocationRecord?.data?.resolvedDecisionAxisCount ?? null,
    newlyReservedIdCount: d040AllocationRecord?.data?.newlyReservedIdCount ?? null,
    firstBatchCardCount: d040FirstBatchRecord?.data?.cardCount ?? null,
    energyBatchCardCount: d040EnergyBatchRecord?.data?.cardCount ?? null,
    dataLifecycleBatchCardCount: d040DataLifecycleBatchRecord?.data?.cardCount ?? null,
    draftedCardCount: d040D072CardRecord?.data?.draftedCardCount ?? null,
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
    dynamicModelSourceAssessmentComplete: d040NiddkDynamicModelInputRecord?.data?.dynamicModelSourceAssessmentComplete ?? null,
    dynamicModelIdentityAndEquationSourceLocated: d040NiddkDynamicModelInputRecord?.data?.modelIdentityAndEquationSourceLocated ?? null,
    dynamicModelObservedPublicCodeAssetCount: d040NiddkDynamicModelInputRecord?.data?.observedPublicCodeAssetCount ?? null,
    dynamicModelPublicCodeAssetHashesRecorded: d040NiddkDynamicModelInputRecord?.data?.publicCodeAssetHashesRecorded ?? null,
    dynamicModelExplicitPerFileLicenseFound: d040NiddkDynamicModelInputRecord?.data?.explicitPerFileSoftwareLicenseFound ?? null,
    dynamicModelStableSemanticReleaseFound: d040NiddkDynamicModelInputRecord?.data?.stableSemanticReleaseFound ?? null,
    dynamicModelOfficialVersionedOracleCorpusFound: d040NiddkDynamicModelInputRecord?.data?.officialVersionedOracleCorpusFound ?? null,
    dynamicModelRegressionToleranceDefined: d040NiddkDynamicModelInputRecord?.data?.regressionToleranceDefined ?? null,
    dynamicModelProductGuardrailsApproved: d040NiddkDynamicModelInputRecord?.data?.productGuardrailsApproved ?? null,
    dynamicModelSourceCodeVendored: d040NiddkDynamicModelInputRecord?.data?.niddkSourceCodeVendored ?? null,
    dynamicModelRemoteCodeExecuted: d040NiddkDynamicModelInputRecord?.data?.niddkRemoteCodeExecuted ?? null,
    dynamicModelEvidencePassed: d040NiddkDynamicModelInputRecord?.data?.dynamicModelEvidencePassed ?? null,
    dynamicModelOptionOwnerReady: d040NiddkDynamicModelInputRecord?.data?.dynamicModelOptionOwnerReady ?? null,
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
    chinaMacroInputState: d040ChinaMacroInputRecord?.data?.inputState ?? null,
    chinaMacroStandardId: d040ChinaMacroInputRecord?.data?.standardId ?? null,
    chinaMacroStandardStatus: d040ChinaMacroInputRecord?.data?.standardStatus ?? null,
    chinaMacroOfficialStatusVerified: d040ChinaMacroInputRecord?.data?.officialRegistryCurrentStatusVerified ?? null,
    chinaMacroCarbohydrateRange: d040ChinaMacroInputRecord?.data?.adultCarbohydrateEnergyPercentRange ?? null,
    chinaMacroFatRange: d040ChinaMacroInputRecord?.data?.adultFatEnergyPercentRange ?? null,
    chinaMacroProteinRange: d040ChinaMacroInputRecord?.data?.adultProteinEnergyPercentRange ?? null,
    chinaMacroRangeCanGenerateDefaultTriplet: d040ChinaMacroInputRecord?.data?.rangeEndpointsCanGenerateDefaultTriplet ?? null,
    chinaMacroCanTriggerDiagnosisScoringOrCorrection: d040ChinaMacroInputRecord?.data?.outOfRangeCanTriggerDiagnosisScoringOrAutomaticCorrection ?? null,
    chinaMacroConsultationDraftTreatedAsCurrent: d040ChinaMacroInputRecord?.data?.consultationDraftTreatedAsCurrentStandard ?? null,
    chinaMacroStandardEvidenceGapClosed: d040ChinaMacroInputRecord?.data?.chinaMacroStandardEvidenceGapClosed ?? null,
    d063ChinaReferenceBandEvidenceReady: d040ChinaMacroInputRecord?.data?.d063ChinaReferenceBandEvidenceReady ?? null,
    d063CardState: d040D063CardRecord?.data?.inputState ?? null,
    d063DecisionId: d040D063CardRecord?.data?.decisionId ?? null,
    d063QuestionId: d040D063CardRecord?.data?.questionId ?? null,
    d063CardCount: d040D063CardRecord?.data?.cardCount ?? null,
    d063OptionCount: d040D063CardRecord?.data?.optionCount ?? null,
    d063OptionIds: d040D063CardRecord?.data?.optionIds ?? null,
    d063RecommendedOptionId: d040D063CardRecord?.data?.recommendedOptionId ?? null,
    d063ReferenceBandStandardId: d040D063CardRecord?.data?.referenceBandStandardId ?? null,
    d063ReferenceBandCarbohydrateRange: d040D063CardRecord?.data?.referenceBandCarbohydrateEnergyPercentRange ?? null,
    d063ReferenceBandFatRange: d040D063CardRecord?.data?.referenceBandFatEnergyPercentRange ?? null,
    d063ReferenceBandProteinRange: d040D063CardRecord?.data?.referenceBandProteinEnergyPercentRange ?? null,
    d063ReferenceBandInformationOnly: d040D063CardRecord?.data?.referenceBandInformationOnly ?? null,
    d063ReferenceBandCanGenerateDefaultTriplet: d040D063CardRecord?.data?.rangeEndpointsCanGenerateDefaultTriplet ?? null,
    d063ReferenceBandCreatesGoalVersion: d040D063CardRecord?.data?.referenceBandCreatesGoalVersion ?? null,
    d063ReferenceBandCanTriggerScoringDiagnosisOrCorrection: d040D063CardRecord?.data?.referenceBandCanTriggerScoringDiagnosisOrCorrection ?? null,
    d063UserDefinedRequiresD070: d040D063CardRecord?.data?.userDefinedRequiresD070 ?? null,
    d063DisplayAndRoundingRequiresD071: d040D063CardRecord?.data?.displayAndRoundingRequiresD071 ?? null,
    d063HardStopRecordAvailabilityRequiresD072: d040D063CardRecord?.data?.hardStopRecordAvailabilityRequiresD072 ?? null,
    d063D068D069PrerequisitesPassed: d040D063CardRecord?.data?.d068D069PrerequisitesPassed ?? null,
    d063SelfReviewPassed: [
      d040D063CardRecord?.data?.productSelfReviewPassed,
      d040D063CardRecord?.data?.healthEvidenceSelfReviewPassed,
      d040D063CardRecord?.data?.privacySelfReviewPassed,
      d040D063CardRecord?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    d063HealthReviewerAssigned: d040D063CardRecord?.data?.healthReviewerAssigned ?? null,
    d063HealthContentApproved: d040D063CardRecord?.data?.healthContentApproved ?? null,
    d063ContentQaPassed: d040D063CardRecord?.data?.contentQaPassed ?? null,
    d063CardRegisteredInDecisionLedger: d040D063CardRecord?.data?.cardRegisteredInDecisionLedger ?? null,
    d063OwnerReady: d040D063CardRecord?.data?.d063OwnerReady ?? null,
    macroCardIndependentReviewPassed: d040D063CardRecord?.data?.independentReviewPassed ?? null,
    d063OwnerReviewAuthorized: d040D063CardRecord?.data?.ownerReviewAuthorized ?? null,
    d063MacroImplementationAuthorized: d040D063CardRecord?.data?.macroImplementationAuthorized ?? null,
    d070CardState: d040D070CardRecord?.data?.inputState ?? null,
    d070DecisionId: d040D070CardRecord?.data?.decisionId ?? null,
    d070QuestionId: d040D070CardRecord?.data?.questionId ?? null,
    d070ApplicableWhen: d040D070CardRecord?.data?.applicableWhen ?? null,
    d070CardCount: d040D070CardRecord?.data?.cardCount ?? null,
    d070OptionCount: d040D070CardRecord?.data?.optionCount ?? null,
    d070OptionIds: d040D070CardRecord?.data?.optionIds ?? null,
    d070RecommendedOptionId: d040D070CardRecord?.data?.recommendedOptionId ?? null,
    d070InputShapesMutuallyExclusive: d040D070CardRecord?.data?.inputShapesMutuallyExclusive ?? null,
    d070PercentAllThreeRequired: d040D070CardRecord?.data?.percentAllThreeRequired ?? null,
    d070PercentSumRequired: d040D070CardRecord?.data?.percentSumRequired ?? null,
    d070CompleteGramsAllThreeRequired: d040D070CardRecord?.data?.completeGramsAllThreeRequired ?? null,
    d070PartialGramsSetCountRange: d040D070CardRecord?.data?.partialGramsSetCountRange ?? null,
    d070MissingMacroTreatedAsZero: d040D070CardRecord?.data?.missingMacroTreatedAsZero ?? null,
    d070ResidualAutoFilled: d040D070CardRecord?.data?.residualAutoFilled ?? null,
    d070MixedInputShapesAllowed: d040D070CardRecord?.data?.mixedInputShapesAllowed ?? null,
    d070PercentToGramRequiresEnergyTarget: d040D070CardRecord?.data?.percentToGramConversionRequiresExplicitEnergyTarget ?? null,
    d070ConversionSelectsTarget: d040D070CardRecord?.data?.conversionSelectsEnergyOrMacroTarget ?? null,
    d070ActualEnergyMismatchIsDataError: d040D070CardRecord?.data?.actualEnergyMismatchIsDataError ?? null,
    d070NumericHealthBoundsApproved: d040D070CardRecord?.data?.numericHealthBoundsApproved ?? null,
    d070D063Accepted: d040D070CardRecord?.data?.d063Accepted ?? null,
    d070D068D069PrerequisitesPassed: d040D070CardRecord?.data?.d068D069PrerequisitesPassed ?? null,
    d070SelfReviewPassed: [
      d040D070CardRecord?.data?.productSelfReviewPassed,
      d040D070CardRecord?.data?.healthEvidenceSelfReviewPassed,
      d040D070CardRecord?.data?.privacySelfReviewPassed,
      d040D070CardRecord?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    d070HealthContentApproved: d040D070CardRecord?.data?.healthContentApproved ?? null,
    d070ContentQaPassed: d040D070CardRecord?.data?.contentQaPassed ?? null,
    d070IndependentReviewPassed: d040D070CardRecord?.data?.independentReviewPassed ?? null,
    d070CardRegisteredInDecisionLedger: d040D070CardRecord?.data?.cardRegisteredInDecisionLedger ?? null,
    d070OwnerReady: d040D070CardRecord?.data?.d070OwnerReady ?? null,
    d070OwnerReviewAuthorized: d040D070CardRecord?.data?.ownerReviewAuthorized ?? null,
    d070MacroConversionImplementationAuthorized: d040D070CardRecord?.data?.macroConversionImplementationAuthorized ?? null,
    d070PersistenceImplementationAuthorized: d040D070CardRecord?.data?.persistenceImplementationAuthorized ?? null,
    d071CardState: d040D071CardRecord?.data?.inputState ?? null,
    d071DecisionId: d040D071CardRecord?.data?.decisionId ?? null,
    d071QuestionId: d040D071CardRecord?.data?.questionId ?? null,
    d071ApplicableWhen: d040D071CardRecord?.data?.applicableWhen ?? null,
    d071CardCount: d040D071CardRecord?.data?.cardCount ?? null,
    d071OptionCount: d040D071CardRecord?.data?.optionCount ?? null,
    d071OptionIds: d040D071CardRecord?.data?.optionIds ?? null,
    d071RecommendedOptionId: d040D071CardRecord?.data?.recommendedOptionId ?? null,
    d071ReferenceBandInformationOnly: d040D071CardRecord?.data?.referenceBandInformationOnly ?? null,
    d071ReferenceBandDerivedGramsAllowed: d040D071CardRecord?.data?.referenceBandDerivedGramsAllowed ?? null,
    d071SourceUnitAlwaysPreserved: d040D071CardRecord?.data?.sourceUnitAlwaysPreserved ?? null,
    d071DerivedUnitRequiresExplicitInputs: d040D071CardRecord?.data?.derivedUnitRequiresExplicitConversionInputs ?? null,
    d071DisplayDecimalRoundingMode: d040D071CardRecord?.data?.displayDecimalRoundingMode ?? null,
    d071RecommendedDecimalPlaces: d040D071CardRecord?.data?.recommendedDecimalPlaces ?? null,
    d071HighPrecisionDecimalPlaces: d040D071CardRecord?.data?.highPrecisionOptionDecimalPlaces ?? null,
    d071RawValuesAuthoritative: d040D071CardRecord?.data?.rawValuesAuthoritative ?? null,
    d071DisplayValuesPersistedAsGoal: d040D071CardRecord?.data?.displayValuesPersistedAsGoal ?? null,
    d071ConversionsUseDisplayRoundedValues: d040D071CardRecord?.data?.conversionsUseDisplayRoundedValues ?? null,
    d071ResidualAllocatedToMacro: d040D071CardRecord?.data?.residualAllocatedToMacro ?? null,
    d071DisplayedPercentTripletForcedTo100: d040D071CardRecord?.data?.displayedPercentTripletForcedTo100 ?? null,
    d071RoundingDisclosureRequired: d040D071CardRecord?.data?.roundingDisclosureRequired ?? null,
    d071ActualEnergyMismatchTreatedAsRoundingResidual: d040D071CardRecord?.data?.actualEnergyMismatchTreatedAsRoundingResidual ?? null,
    d071EnergyRoundingPolicyReused: d040D071CardRecord?.data?.energyRoundingPolicyReused ?? null,
    d071NumericHealthBoundsApproved: d040D071CardRecord?.data?.numericHealthBoundsApproved ?? null,
    d071D063Accepted: d040D071CardRecord?.data?.d063Accepted ?? null,
    d071D070Accepted: d040D071CardRecord?.data?.d070Accepted ?? null,
    d071D068D069PrerequisitesPassed: d040D071CardRecord?.data?.d068D069PrerequisitesPassed ?? null,
    d071SelfReviewPassed: [
      d040D071CardRecord?.data?.productSelfReviewPassed,
      d040D071CardRecord?.data?.healthEvidenceSelfReviewPassed,
      d040D071CardRecord?.data?.privacySelfReviewPassed,
      d040D071CardRecord?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    d071HealthContentApproved: d040D071CardRecord?.data?.healthContentApproved ?? null,
    d071ContentQaPassed: d040D071CardRecord?.data?.contentQaPassed ?? null,
    d071IndependentReviewPassed: d040D071CardRecord?.data?.independentReviewPassed ?? null,
    d071CardRegisteredInDecisionLedger: d040D071CardRecord?.data?.cardRegisteredInDecisionLedger ?? null,
    d071OwnerReady: d040D071CardRecord?.data?.d071OwnerReady ?? null,
    d071OwnerReviewAuthorized: d040D071CardRecord?.data?.ownerReviewAuthorized ?? null,
    d071MacroDisplayImplementationAuthorized: d040D071CardRecord?.data?.macroDisplayImplementationAuthorized ?? null,
    d071PersistenceImplementationAuthorized: d040D071CardRecord?.data?.persistenceImplementationAuthorized ?? null,
    d072CardState: d040D072CardRecord?.data?.inputState ?? null,
    d072DecisionId: d040D072CardRecord?.data?.decisionId ?? null,
    d072QuestionId: d040D072CardRecord?.data?.questionId ?? null,
    d072ApplicableWhen: d040D072CardRecord?.data?.applicableWhen ?? null,
    d072CardCount: d040D072CardRecord?.data?.cardCount ?? null,
    d072OptionCount: d040D072CardRecord?.data?.optionCount ?? null,
    d072OptionIds: d040D072CardRecord?.data?.optionIds ?? null,
    d072RecommendedOptionId: d040D072CardRecord?.data?.recommendedOptionId ?? null,
    d072HardStopCannotBeWaived: d040D072CardRecord?.data?.hardStopCannotBeWaived ?? null,
    d072NoGoalRecordingCannotCreateGoal: d040D072CardRecord?.data?.noGoalRecordingCannotCreateGoal ?? null,
    d072AutomaticTargetOrFormulaShown: d040D072CardRecord?.data?.automaticTargetOrFormulaShown ?? null,
    d072TargetComparisonOrScoringShown: d040D072CardRecord?.data?.targetComparisonOrScoringShown ?? null,
    d072ExistingHistoryRecalculated: d040D072CardRecord?.data?.existingHistoryRecalculated ?? null,
    d072ExistingHistoryDeleted: d040D072CardRecord?.data?.existingHistoryDeleted ?? null,
    d072DataAccessAndDeletionRemainAvailable: d040D072CardRecord?.data?.dataAccessAndDeletionRemainAvailable ?? null,
    d072RecordingChoiceChangesHealthClassification: d040D072CardRecord?.data?.recordingChoiceChangesHealthClassification ?? null,
    d072ConditionInferredByApp: d040D072CardRecord?.data?.conditionInferredByApp ?? null,
    d072UnknownEligibilityEnablesAutomaticTarget: d040D072CardRecord?.data?.unknownEligibilityEnablesAutomaticTarget ?? null,
    d072SupportCopyRequiresHealthApproval: d040D072CardRecord?.data?.supportCopyRequiresHealthApproval ?? null,
    d072D068D069PrerequisitesPassed: d040D072CardRecord?.data?.d068D069PrerequisitesPassed ?? null,
    d072SelfReviewPassed: [
      d040D072CardRecord?.data?.productSelfReviewPassed,
      d040D072CardRecord?.data?.healthEvidenceSelfReviewPassed,
      d040D072CardRecord?.data?.privacySelfReviewPassed,
      d040D072CardRecord?.data?.qaSelfReviewPassed,
    ].every((value) => value === true),
    d072HealthContentApproved: d040D072CardRecord?.data?.healthContentApproved ?? null,
    d072ContentQaPassed: d040D072CardRecord?.data?.contentQaPassed ?? null,
    d072IndependentReviewPassed: d040D072CardRecord?.data?.independentReviewPassed ?? null,
    d072CardRegisteredInDecisionLedger: d040D072CardRecord?.data?.cardRegisteredInDecisionLedger ?? null,
    d072OwnerReady: d040D072CardRecord?.data?.d072OwnerReady ?? null,
    d072OwnerReviewAuthorized: d040D072CardRecord?.data?.ownerReviewAuthorized ?? null,
    d072RecordingImplementationAuthorized: d040D072CardRecord?.data?.recordingImplementationAuthorized ?? null,
    d072PersistenceImplementationAuthorized: d040D072CardRecord?.data?.persistenceImplementationAuthorized ?? null,
    macroAxisReviewPacketReady: d040MacroAxisReviewPacketRecord?.data?.reviewPacketReady ?? null,
    macroAxisReviewPacketVersion: d040MacroAxisReviewPacketRecord?.data?.reviewPacketVersion ?? null,
    macroAxisReviewRequiredArtifactCount: d040MacroAxisReviewPacketRecord?.data?.requiredArtifactCount ?? null,
    macroAxisReviewRequiredCardCount: d040MacroAxisReviewPacketRecord?.data?.requiredCardCount ?? null,
    macroAxisReviewCardDecisionCount: d040MacroAxisReviewPacketRecord?.data?.cardDecisionIds?.length ?? null,
    macroAxisReviewRequiredDomainCount: d040MacroAxisReviewPacketRecord?.data?.requiredReviewerDomainCount ?? null,
    macroAxisReviewDomainCount: d040MacroAxisReviewPacketRecord?.data?.reviewerDomainIds?.length ?? null,
    macroAxisReviewRequiredInvariantCount: d040MacroAxisReviewPacketRecord?.data?.requiredCrossAxisInvariantCount ?? null,
    macroAxisReviewDispositionCount: d040MacroAxisReviewPacketRecord?.data?.allowedCardDispositionIds?.length ?? null,
    macroAxisReviewBlockingSeverityCount: d040MacroAxisReviewPacketRecord?.data?.blockingSeverityIds?.length ?? null,
    macroAxisReviewNamedReviewerRequired: d040MacroAxisReviewPacketRecord?.data?.namedReviewerRequired ?? null,
    macroAxisReviewAuthorOrPmCanSelfApprove: d040MacroAxisReviewPacketRecord?.data?.authorOrPmCanSelfApprove ?? null,
    macroAxisReviewAiOrAgentCanBeReviewer: d040MacroAxisReviewPacketRecord?.data?.aiOrAgentCanBeIndependentReviewer ?? null,
    macroAxisReviewExternalMessageSent: d040MacroAxisReviewPacketRecord?.data?.externalMessageSent ?? null,
    macroAxisReviewReviewersAssigned: d040MacroAxisReviewPacketRecord?.data?.reviewersAssigned ?? null,
    macroAxisReviewIdentityVerified: d040MacroAxisReviewPacketRecord?.data?.reviewerIdentityVerified ?? null,
    macroAxisReviewIndependenceVerified: d040MacroAxisReviewPacketRecord?.data?.reviewerIndependenceVerified ?? null,
    macroAxisReviewConflictResolved: d040MacroAxisReviewPacketRecord?.data?.conflictOfInterestResolved ?? null,
    macroAxisReviewStarted: d040MacroAxisReviewPacketRecord?.data?.independentReviewStarted ?? null,
    macroAxisReviewPassed: d040MacroAxisReviewPacketRecord?.data?.independentReviewPassed ?? null,
    macroAxisReviewFindingCountsMeasured: d040MacroAxisReviewPacketRecord?.data?.currentFindingCountsMeasured ?? null,
    macroAxisReviewHealthStillRequired: d040MacroAxisReviewPacketRecord?.data?.healthReviewStillRequired ?? null,
    macroAxisReviewHealthContentApproved: d040MacroAxisReviewPacketRecord?.data?.healthContentApproved ?? null,
    macroAxisReviewContentQaPassed: d040MacroAxisReviewPacketRecord?.data?.contentQaPassed ?? null,
    macroAxisReviewD063Accepted: d040MacroAxisReviewPacketRecord?.data?.d063Accepted ?? null,
    macroAxisReviewD070Accepted: d040MacroAxisReviewPacketRecord?.data?.d070Accepted ?? null,
    macroAxisReviewD063OwnerReady: d040MacroAxisReviewPacketRecord?.data?.d063OwnerReady ?? null,
    macroAxisReviewD070OwnerReady: d040MacroAxisReviewPacketRecord?.data?.d070OwnerReady ?? null,
    macroAxisReviewD071OwnerReady: d040MacroAxisReviewPacketRecord?.data?.d071OwnerReady ?? null,
    macroAxisReviewD072OwnerReady: d040MacroAxisReviewPacketRecord?.data?.d072OwnerReady ?? null,
    macroAxisIndependentReviewPassed: d040MacroAxisReviewPacketRecord?.data?.macroAxisIndependentReviewPassed ?? null,
    macroAxisReviewOwnerIntakeChanged: d040MacroAxisReviewPacketRecord?.data?.ownerIntakeChanged ?? null,
    macroAxisReviewOwnerCardScheduled: d040MacroAxisReviewPacketRecord?.data?.ownerCardScheduled ?? null,
    macroAxisReviewOwnerReviewAuthorized: d040MacroAxisReviewPacketRecord?.data?.ownerReviewAuthorized ?? null,
    macroAxisReviewGoalImplementationAuthorized: d040MacroAxisReviewPacketRecord?.data?.goalImplementationAuthorized ?? null,
    macroAxisReviewRecordingImplementationAuthorized: d040MacroAxisReviewPacketRecord?.data?.recordingImplementationAuthorized ?? null,
    macroAxisReviewPersistenceImplementationAuthorized: d040MacroAxisReviewPacketRecord?.data?.persistenceImplementationAuthorized ?? null,
    macroAxisReviewFormalImplementationAuthorized: d040MacroAxisReviewPacketRecord?.data?.formalImplementationAuthorized ?? null,
    macroAxisInputManifestFrozen: d040MacroAxisInputManifestFreezeRecord?.data?.inputManifestFrozen ?? null,
    macroAxisInputManifestEntryCount: d040MacroAxisInputManifestFreezeRecord?.data?.manifestEntryCount ?? null,
    macroAxisInputManifestCommit: d040MacroAxisInputManifestFreezeRecord?.data?.manifestCommit ?? null,
    macroAxisInputManifestRecordCommit: d040MacroAxisInputManifestFreezeRecord?.data?.manifestRecordCommit ?? null,
    macroAxisInputManifestGitBlobOidAlgorithm: d040MacroAxisInputManifestFreezeRecord?.data?.gitBlobOidAlgorithm ?? null,
    macroAxisInputManifestCanonicalDigestAlgorithm: d040MacroAxisInputManifestFreezeRecord?.data?.canonicalDigestAlgorithm ?? null,
    macroAxisInputManifestUsesRawGitBlobBytes: d040MacroAxisInputManifestFreezeRecord?.data?.rawGitBlobBytesUsed ?? null,
    macroAxisInputManifestFrozenArtifactCount: d040MacroAxisInputManifestFreezeRecord?.data?.frozenArtifactRefs?.length ?? null,
    macroAxisInputManifestSourcePacketEventId: d040MacroAxisInputManifestFreezeRecord?.data?.sourcePacketCreationEventId ?? null,
    macroAxisInputManifestPacketNext: d040MacroAxisInputManifestFreezeRecord?.data?.packetNext ?? null,
    macroAxisInputManifestReviewersAssigned: d040MacroAxisInputManifestFreezeRecord?.data?.reviewersAssigned ?? null,
    macroAxisInputManifestReviewStarted: d040MacroAxisInputManifestFreezeRecord?.data?.independentReviewStarted ?? null,
    macroAxisInputManifestReviewPassed: d040MacroAxisInputManifestFreezeRecord?.data?.independentReviewPassed ?? null,
    macroAxisInputManifestHealthContentApproved: d040MacroAxisInputManifestFreezeRecord?.data?.healthContentApproved ?? null,
    macroAxisInputManifestContentQaPassed: d040MacroAxisInputManifestFreezeRecord?.data?.contentQaPassed ?? null,
    macroAxisInputManifestOwnerReviewAuthorized: d040MacroAxisInputManifestFreezeRecord?.data?.ownerReviewAuthorized ?? null,
    macroAxisInputManifestFormalImplementationAuthorized: d040MacroAxisInputManifestFreezeRecord?.data?.formalImplementationAuthorized ?? null,
    healthReviewPacketReady: d040ChinaHealthReviewerPacketRecord?.data?.reviewPacketReady ?? null,
    healthReviewRequiredArtifactCount: d040ChinaHealthReviewerPacketRecord?.data?.requiredArtifactCount ?? null,
    healthReviewRequiredItemCount: d040ChinaHealthReviewerPacketRecord?.data?.requiredReviewItemCount ?? null,
    healthReviewCopyItemCount: d040ChinaHealthReviewerPacketRecord?.data?.copyReviewItemCount ?? null,
    healthReviewBoundaryItemCount: d040ChinaHealthReviewerPacketRecord?.data?.boundaryReviewItemCount ?? null,
    healthReviewDispositionCount: d040ChinaHealthReviewerPacketRecord?.data?.itemDispositionIds?.length ?? null,
    healthReviewQualificationFieldCount: d040ChinaHealthReviewerPacketRecord?.data?.qualificationFieldCount ?? null,
    healthReviewFormalReviewFieldCount: d040ChinaHealthReviewerPacketRecord?.data?.formalReviewFieldCount ?? null,
    healthReviewImmutableArtifactRefsRequired: d040ChinaHealthReviewerPacketRecord?.data?.immutableArtifactRefsRequired ?? null,
    healthReviewContentQaIndependentGateRequired: d040ChinaHealthReviewerPacketRecord?.data?.contentQaIndependentGateRequired ?? null,
    healthReviewSensitiveCredentialDocumentsStored: d040ChinaHealthReviewerPacketRecord?.data?.sensitiveCredentialDocumentsStored ?? null,
    healthReviewAiOrAgentCanBeReviewer: d040ChinaHealthReviewerPacketRecord?.data?.aiOrAgentCanBeHealthReviewer ?? null,
    healthReviewExternalMessageSent: d040ChinaHealthReviewerPacketRecord?.data?.externalMessageSent ?? null,
    healthReviewerNameRecorded: d040ChinaHealthReviewerPacketRecord?.data?.reviewerNameRecorded ?? null,
    healthReviewerQualificationVerified: d040ChinaHealthReviewerPacketRecord?.data?.reviewerQualificationVerified ?? null,
    healthReviewerConflictOfInterestResolved: d040ChinaHealthReviewerPacketRecord?.data?.conflictOfInterestResolved ?? null,
    healthReviewStarted: d040ChinaHealthReviewerPacketRecord?.data?.healthReviewStarted ?? null,
    healthReviewPacketHealthContentApproved: d040ChinaHealthReviewerPacketRecord?.data?.healthContentApproved ?? null,
    healthReviewPacketContentQaPassed: d040ChinaHealthReviewerPacketRecord?.data?.contentQaPassed ?? null,
    healthReviewPacketD068OwnerReady: d040ChinaHealthReviewerPacketRecord?.data?.d068OwnerReady ?? null,
    healthReviewPacketD069OwnerReady: d040ChinaHealthReviewerPacketRecord?.data?.d069OwnerReady ?? null,
    healthReviewPacketD063OwnerReady: d040ChinaHealthReviewerPacketRecord?.data?.d063OwnerReady ?? null,
    healthReviewPacketFirstThreeBatchesIndependentReviewPassed: d040ChinaHealthReviewerPacketRecord?.data?.firstThreeBatchesIndependentReviewPassed ?? null,
    healthReviewPacketHealthCopyImplementationAuthorized: d040ChinaHealthReviewerPacketRecord?.data?.healthCopyImplementationAuthorized ?? null,
    healthReviewPacketFormulaImplementationAuthorized: d040ChinaHealthReviewerPacketRecord?.data?.formulaImplementationAuthorized ?? null,
    independentReviewPacketReady: d040IndependentReviewPacketRecord?.data?.reviewPacketReady ?? null,
    independentReviewRequiredArtifactCount: d040IndependentReviewPacketRecord?.data?.requiredArtifactCount ?? null,
    independentReviewRequiredCardCount: d040IndependentReviewPacketRecord?.data?.requiredCardCount ?? null,
    independentReviewCardDecisionCount: d040IndependentReviewPacketRecord?.data?.cardDecisionIds?.length ?? null,
    independentReviewRequiredDomainCount: d040IndependentReviewPacketRecord?.data?.requiredReviewerDomainCount ?? null,
    independentReviewDomainCount: d040IndependentReviewPacketRecord?.data?.reviewerDomainIds?.length ?? null,
    independentReviewRequiredInvariantCount: d040IndependentReviewPacketRecord?.data?.requiredCrossBatchInvariantCount ?? null,
    independentReviewDispositionCount: d040IndependentReviewPacketRecord?.data?.allowedCardDispositionIds?.length ?? null,
    independentReviewBlockingSeverityCount: d040IndependentReviewPacketRecord?.data?.blockingSeverityIds?.length ?? null,
    independentReviewNamedReviewerRequired: d040IndependentReviewPacketRecord?.data?.namedReviewerRequired ?? null,
    independentReviewAuthorOrPmCanSelfApprove: d040IndependentReviewPacketRecord?.data?.authorOrPmCanSelfApprove ?? null,
    independentReviewAiOrAgentCanBeReviewer: d040IndependentReviewPacketRecord?.data?.aiOrAgentCanBeIndependentReviewer ?? null,
    independentReviewExternalMessageSent: d040IndependentReviewPacketRecord?.data?.externalMessageSent ?? null,
    independentReviewReviewersAssigned: d040IndependentReviewPacketRecord?.data?.reviewersAssigned ?? null,
    independentReviewIdentityVerified: d040IndependentReviewPacketRecord?.data?.reviewerIdentityVerified ?? null,
    independentReviewIndependenceVerified: d040IndependentReviewPacketRecord?.data?.reviewerIndependenceVerified ?? null,
    independentReviewConflictResolved: d040IndependentReviewPacketRecord?.data?.conflictOfInterestResolved ?? null,
    independentReviewStarted: d040IndependentReviewPacketRecord?.data?.independentReviewStarted ?? null,
    independentReviewPassed: d040IndependentReviewPacketRecord?.data?.independentReviewPassed ?? null,
    independentReviewFindingCountsMeasured: d040IndependentReviewPacketRecord?.data?.currentFindingCountsMeasured ?? null,
    independentReviewDynamicModelOptionOwnerReady: d040IndependentReviewPacketRecord?.data?.dynamicModelOptionOwnerReady ?? null,
    independentReviewHealthReviewStillRequired: d040IndependentReviewPacketRecord?.data?.healthReviewStillRequired ?? null,
    independentReviewHealthContentApproved: d040IndependentReviewPacketRecord?.data?.healthContentApproved ?? null,
    independentReviewFirstThreeBatchesPassed: d040IndependentReviewPacketRecord?.data?.firstThreeBatchesIndependentReviewPassed ?? null,
    independentReviewPersistenceImplementationAuthorized: d040IndependentReviewPacketRecord?.data?.persistenceImplementationAuthorized ?? null,
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
    d040.eventId === "EVT-20260827-005" &&
    d040.next === "D068_D069_HEALTH_REVIEW_CONTENT_QA_AND_INDEPENDENT_REVIEW_REQUIRED" &&
    d040.nonDiagnosticBoundaryEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticBoundaryStatus ===
      "DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / HEALTH_REVIEW_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY" &&
    JSON.stringify(d040.nonDiagnosticBoundaryCardDecisionIds) === JSON.stringify(["D-068", "D-069"]) &&
    d040.nonDiagnosticBoundaryCardCount === 2 &&
    d040.d068QuestionId === "d068_non_diagnostic_health_context" &&
    d040.d069QuestionId === "d069_estimate_uncertainty_copy" &&
    d040.d068OptionCount === 3 &&
    d040.d069OptionCount === 3 &&
    d040.d068RecommendedOptionId === "pause_automatic_estimates_on_yes_or_unsure" &&
    d040.d069RecommendedOptionId === "plain_language_no_numeric_error_bounds" &&
    d040.nonDiagnosticYesOrUnsurePausesAutomaticEstimates === true &&
    d040.nonDiagnosticUnsureCannotBecomeNoRisk === true &&
    d040.nonDiagnosticEatingDisorderRiskPausesTargets === true &&
    d040.nonDiagnosticPlainLanguageUncertaintyRecommended === true &&
    d040.nonDiagnosticNumericUncertaintyRequiresEvidence === true &&
    d040.nonDiagnosticPopulationErrorNotPersonalBounds === true &&
    d040.nonDiagnosticNoSideEffects === true &&
    d040.nonDiagnosticReviewAndOwnerClosed === true &&
    d040.nonDiagnosticPxAndImplementationClosed === true &&
    d040.nonDiagnosticHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticHarnessStatus === "SPIKE / LOCAL_ONLY / NON_PRODUCTION / NOT_OWNER_READY" &&
    d040.nonDiagnosticHarnessTopLevelTests === 17 &&
    d040.nonDiagnosticHarnessCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticHarnessRecommendationsNotOwnerChoices === true &&
    d040.nonDiagnosticHarnessSyntheticIsNotEvidence === true &&
    d040.nonDiagnosticHarnessCallerHealthContextIsNotDiagnosis === true &&
    d040.nonDiagnosticHarnessNumericEvidenceCallerAsserted === true &&
    d040.nonDiagnosticHarnessFailClosedSemantics === true &&
    d040.nonDiagnosticHarnessNoSideEffects === true &&
    d040.nonDiagnosticHarnessReviewOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticReviewPacketStatus ===
      "PACKET_READY / REVIEWER_ASSIGNMENT_REQUIRED / REVIEW_NOT_STARTED / NOT_OWNER_READY" &&
    d040.nonDiagnosticReviewPacketVersion === "PACKET-001-R1" &&
    d040.nonDiagnosticReviewPacketCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticReviewPacketCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticReviewPacketRequiredInputCount === 8 &&
    d040.nonDiagnosticReviewPacketRequiredDomainCount === 4 &&
    d040.nonDiagnosticReviewPacketRequiredCardDispositionCount === 2 &&
    d040.nonDiagnosticReviewPacketRequiredInvariantCount === 10 &&
    d040.nonDiagnosticReviewPacketNamedReviewerRequired === true &&
    d040.nonDiagnosticReviewPacketCannotSelfApprove === true &&
    d040.nonDiagnosticReviewPacketFailClosedSemantics === true &&
    d040.nonDiagnosticReviewPacketNoSideEffects === true &&
    d040.nonDiagnosticReviewPacketReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticReviewRecordHarnessStatus === "SPIKE / LOCAL_ONLY / NON_PRODUCTION" &&
    d040.nonDiagnosticReviewRecordHarnessReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticReviewRecordHarnessCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticReviewRecordHarnessCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticReviewRecordHarnessTopLevelTests === 20 &&
    d040.nonDiagnosticReviewRecordHarnessRequiredInputCount === 8 &&
    d040.nonDiagnosticReviewRecordHarnessRequiredDomainCount === 4 &&
    d040.nonDiagnosticReviewRecordHarnessRequiredCardDispositionCount === 2 &&
    d040.nonDiagnosticReviewRecordHarnessRequiredInvariantCount === 10 &&
    d040.nonDiagnosticReviewRecordHarnessDoubleSha256 === true &&
    d040.nonDiagnosticReviewRecordHarnessStrictAndFailClosed === true &&
    d040.nonDiagnosticReviewRecordHarnessSyntheticIsNotEvidence === true &&
    d040.nonDiagnosticReviewRecordHarnessNoSideEffects === true &&
    d040.nonDiagnosticReviewRecordHarnessReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticReviewerAssignmentHarnessEventId === "EVT-20260827-009" &&
    d040.nonDiagnosticReviewerAssignmentHarnessStatus === "SPIKE / LOCAL_ONLY / NON_PRODUCTION" &&
    d040.nonDiagnosticReviewerAssignmentHarnessReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticReviewerAssignmentHarnessReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticReviewerAssignmentHarnessCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticReviewerAssignmentHarnessCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticReviewerAssignmentHarnessTopLevelTests === 21 &&
    d040.nonDiagnosticReviewerAssignmentHarnessRequiredDomainCount === 4 &&
    d040.nonDiagnosticReviewerAssignmentHarnessCandidateMinCount === 1 &&
    d040.nonDiagnosticReviewerAssignmentHarnessCandidateMaxCount === 20 &&
    d040.nonDiagnosticReviewerAssignmentHarnessStrictAndFailClosed === true &&
    d040.nonDiagnosticReviewerAssignmentHarnessSyntheticIsNotEvidence === true &&
    d040.nonDiagnosticReviewerAssignmentHarnessNoSideEffects === true &&
    d040.nonDiagnosticReviewerAssignmentHarnessReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticReviewerIntakePacketEventId === "EVT-20260827-010" &&
    d040.nonDiagnosticReviewerIntakePacketStatus === "INTAKE_PACKET_READY / LOCAL_ONLY / NON_PRODUCTION" &&
    d040.nonDiagnosticReviewerIntakePacketReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticReviewerIntakePacketReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticReviewerIntakePacketReviewerAssignmentHarnessEventId === "EVT-20260827-009" &&
    d040.nonDiagnosticReviewerIntakePacketCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticReviewerIntakePacketCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticReviewerIntakePacketRequiredInputCount === 8 &&
    d040.nonDiagnosticReviewerIntakePacketRequiredDomainCount === 4 &&
    d040.nonDiagnosticReviewerIntakePacketCandidateMinCount === 1 &&
    d040.nonDiagnosticReviewerIntakePacketCandidateMaxCount === 20 &&
    d040.nonDiagnosticReviewerIntakePacketContractCorrected === true &&
    d040.nonDiagnosticReviewerIntakePacketTemplateResidueRemoved === true &&
    d040.nonDiagnosticReviewerIntakePacketHandoffReady === true &&
    d040.nonDiagnosticReviewerIntakePacketReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticReviewHandoffChecklistEventId === "EVT-20260827-011" &&
    d040.nonDiagnosticReviewHandoffChecklistStatus === "HANDOFF_CHECKLIST_READY / LOCAL_ONLY / NON_PRODUCTION" &&
    d040.nonDiagnosticReviewHandoffChecklistReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticReviewHandoffChecklistReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticReviewHandoffChecklistReviewerAssignmentHarnessEventId === "EVT-20260827-009" &&
    d040.nonDiagnosticReviewHandoffChecklistReviewerIntakePacketEventId === "EVT-20260827-010" &&
    d040.nonDiagnosticReviewHandoffChecklistCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticReviewHandoffChecklistCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticReviewHandoffChecklistRequiredInputCount === 8 &&
    d040.nonDiagnosticReviewHandoffChecklistRequiredDomainCount === 4 &&
    d040.nonDiagnosticReviewHandoffChecklistRequiredPrerequisiteCount === 6 &&
    d040.nonDiagnosticReviewHandoffChecklistStartGateConditionCount === 8 &&
    d040.nonDiagnosticReviewHandoffChecklistFailClosedConditionCount === 8 &&
    d040.nonDiagnosticReviewHandoffChecklistSensitiveClassCount === 8 &&
    d040.nonDiagnosticReviewHandoffChecklistBindingsReady === true &&
    d040.nonDiagnosticReviewHandoffChecklistReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticReviewStartGapRegisterEventId === "EVT-20260827-012" &&
    d040.nonDiagnosticReviewStartGapRegisterStatus ===
      "GAP_REGISTER_READY / LOCAL_ONLY / NON_PRODUCTION / REVIEW_NOT_STARTED / NOT_OWNER_READY" &&
    d040.nonDiagnosticReviewStartGapRegisterReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticReviewStartGapRegisterReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticReviewStartGapRegisterReviewerAssignmentHarnessEventId === "EVT-20260827-009" &&
    d040.nonDiagnosticReviewStartGapRegisterReviewerIntakePacketEventId === "EVT-20260827-010" &&
    d040.nonDiagnosticReviewStartGapRegisterHandoffChecklistEventId === "EVT-20260827-011" &&
    d040.nonDiagnosticReviewStartGapRegisterCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticReviewStartGapRegisterCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticReviewStartGapRegisterGapCount === 10 &&
    d040.nonDiagnosticReviewStartGapRegisterOpenGapCount === 10 &&
    d040.nonDiagnosticReviewStartGapRegisterClosedGapCount === 0 &&
    d040.nonDiagnosticReviewStartGapRegisterStartBlockerCount === 10 &&
    d040.nonDiagnosticReviewStartGapRegisterRequiredPrerequisiteCount === 7 &&
    d040.nonDiagnosticReviewStartGapRegisterRequiredDomainCount === 4 &&
    d040.nonDiagnosticReviewStartGapRegisterRequiredInputCount === 8 &&
    d040.nonDiagnosticReviewStartGapRegisterFailClosedConditionCount === 8 &&
    d040.nonDiagnosticReviewStartGapRegisterSensitiveClassCount === 8 &&
    d040.nonDiagnosticReviewStartGapRegisterBindingsReady === true &&
    d040.nonDiagnosticReviewStartGapRegisterReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticFormalAssignmentTemplateEventId === "EVT-20260827-013" &&
    d040.nonDiagnosticFormalAssignmentTemplateStatus ===
      "TEMPLATE_READY / LOCAL_ONLY / NON_PRODUCTION / EMPTY_RECORD_ONLY / REVIEW_NOT_STARTED / NOT_OWNER_READY" &&
    d040.nonDiagnosticFormalAssignmentTemplateReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticFormalAssignmentTemplateReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticFormalAssignmentTemplateReviewerAssignmentHarnessEventId === "EVT-20260827-009" &&
    d040.nonDiagnosticFormalAssignmentTemplateReviewerIntakePacketEventId === "EVT-20260827-010" &&
    d040.nonDiagnosticFormalAssignmentTemplateHandoffChecklistEventId === "EVT-20260827-011" &&
    d040.nonDiagnosticFormalAssignmentTemplateStartGapRegisterEventId === "EVT-20260827-012" &&
    d040.nonDiagnosticFormalAssignmentTemplateCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticFormalAssignmentTemplateCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticFormalAssignmentTemplateSectionCount === 10 &&
    d040.nonDiagnosticFormalAssignmentTemplateRequiredBindingCount === 8 &&
    d040.nonDiagnosticFormalAssignmentTemplateRequiredFutureRecordSectionCount === 10 &&
    d040.nonDiagnosticFormalAssignmentTemplateSensitiveClassCount === 9 &&
    d040.nonDiagnosticFormalAssignmentTemplateStartGateConditionCount === 8 &&
    d040.nonDiagnosticFormalAssignmentTemplateBindingsReady === true &&
    d040.nonDiagnosticFormalAssignmentTemplateReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightEventId === "EVT-20260827-014" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightStatus ===
      "PREFLIGHT_CHECKLIST_READY / LOCAL_ONLY / NON_PRODUCTION / AUTHORIZATION_NOT_GRANTED / REVIEW_NOT_STARTED / NOT_OWNER_READY" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightReviewerAssignmentHarnessEventId === "EVT-20260827-009" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightReviewerIntakePacketEventId === "EVT-20260827-010" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightHandoffChecklistEventId === "EVT-20260827-011" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightStartGapRegisterEventId === "EVT-20260827-012" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightFormalTemplateEventId === "EVT-20260827-013" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightItemCount === 8 &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightMissingItemCount === 8 &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightClosedItemCount === 0 &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightScopeBindingCount === 9 &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightStartGateConditionCount === 8 &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightBindingsReady === true &&
    d040.nonDiagnosticAssignmentAuthorizationPreflightReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticContactAuthorizationRecordContractEventId === "EVT-20260827-015" &&
    d040.nonDiagnosticContactAuthorizationRecordContractStatus ===
      "CONTRACT_READY / LOCAL_ONLY / NON_PRODUCTION / NO_AUTHORIZATION_RECORD / AUTHORIZATION_NOT_GRANTED / REVIEW_NOT_STARTED / NOT_OWNER_READY" &&
    d040.nonDiagnosticContactAuthorizationRecordContractReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticContactAuthorizationRecordContractReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticContactAuthorizationRecordContractReviewerAssignmentHarnessEventId === "EVT-20260827-009" &&
    d040.nonDiagnosticContactAuthorizationRecordContractReviewerIntakePacketEventId === "EVT-20260827-010" &&
    d040.nonDiagnosticContactAuthorizationRecordContractHandoffChecklistEventId === "EVT-20260827-011" &&
    d040.nonDiagnosticContactAuthorizationRecordContractStartGapRegisterEventId === "EVT-20260827-012" &&
    d040.nonDiagnosticContactAuthorizationRecordContractFormalTemplateEventId === "EVT-20260827-013" &&
    d040.nonDiagnosticContactAuthorizationRecordContractPreflightChecklistEventId === "EVT-20260827-014" &&
    d040.nonDiagnosticContactAuthorizationRecordContractCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticContactAuthorizationRecordContractCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticContactAuthorizationRecordContractSchemaFieldCount === 12 &&
    d040.nonDiagnosticContactAuthorizationRecordContractRequiredBoundPriorEventCount === 10 &&
    d040.nonDiagnosticContactAuthorizationRecordContractSensitiveClassCount === 8 &&
    d040.nonDiagnosticContactAuthorizationRecordContractAcceptanceRuleCount === 8 &&
    d040.nonDiagnosticContactAuthorizationRecordContractBindingsReady === true &&
    d040.nonDiagnosticContactAuthorizationRecordContractReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticReviewerCandidateRosterContractEventId === "EVT-20260827-016" &&
    d040.nonDiagnosticReviewerCandidateRosterContractStatus ===
      "CONTRACT_READY / LOCAL_ONLY / NON_PRODUCTION / NO_REAL_CANDIDATES / NO_AUTHORIZATION_RECORD / AUTHORIZATION_NOT_GRANTED / REVIEW_NOT_STARTED / NOT_OWNER_READY" &&
    d040.nonDiagnosticReviewerCandidateRosterContractReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticReviewerCandidateRosterContractReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticReviewerCandidateRosterContractReviewerAssignmentHarnessEventId === "EVT-20260827-009" &&
    d040.nonDiagnosticReviewerCandidateRosterContractReviewerIntakePacketEventId === "EVT-20260827-010" &&
    d040.nonDiagnosticReviewerCandidateRosterContractHandoffChecklistEventId === "EVT-20260827-011" &&
    d040.nonDiagnosticReviewerCandidateRosterContractStartGapRegisterEventId === "EVT-20260827-012" &&
    d040.nonDiagnosticReviewerCandidateRosterContractFormalTemplateEventId === "EVT-20260827-013" &&
    d040.nonDiagnosticReviewerCandidateRosterContractPreflightChecklistEventId === "EVT-20260827-014" &&
    d040.nonDiagnosticReviewerCandidateRosterContractContactAuthorizationRecordContractEventId === "EVT-20260827-015" &&
    d040.nonDiagnosticReviewerCandidateRosterContractCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticReviewerCandidateRosterContractCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticReviewerCandidateRosterContractSchemaFieldCount === 14 &&
    d040.nonDiagnosticReviewerCandidateRosterContractRequiredBoundPriorEventCount === 11 &&
    d040.nonDiagnosticReviewerCandidateRosterContractSensitiveClassCount === 9 &&
    d040.nonDiagnosticReviewerCandidateRosterContractAcceptanceRuleCount === 9 &&
    d040.nonDiagnosticReviewerCandidateRosterContractBindingsReady === true &&
    d040.nonDiagnosticReviewerCandidateRosterContractReviewHealthOwnerPxImplementationClosed === true &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractEventId === "EVT-20260827-017" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractStatus ===
      "CONTRACT_READY / LOCAL_ONLY / NON_PRODUCTION / MATERIAL_NOT_SENT / NO_REAL_CANDIDATES / NO_AUTHORIZATION_RECORD / AUTHORIZATION_NOT_GRANTED / REVIEW_NOT_STARTED / NOT_OWNER_READY" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractReviewPacketEventId === "EVT-20260827-007" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractReviewRecordHarnessEventId === "EVT-20260827-008" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractReviewerAssignmentHarnessEventId === "EVT-20260827-009" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractReviewerIntakePacketEventId === "EVT-20260827-010" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractHandoffChecklistEventId === "EVT-20260827-011" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractStartGapRegisterEventId === "EVT-20260827-012" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractFormalTemplateEventId === "EVT-20260827-013" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractPreflightChecklistEventId === "EVT-20260827-014" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractContactAuthorizationRecordContractEventId === "EVT-20260827-015" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractReviewerCandidateRosterContractEventId === "EVT-20260827-016" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractCardSpecEventId === "EVT-20260827-005" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractCardHarnessEventId === "EVT-20260827-006" &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractSchemaFieldCount === 13 &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractRequiredBoundPriorEventCount === 12 &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractSensitiveClassCount === 9 &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractAcceptanceRuleCount === 9 &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractBindingsReady === true &&
    d040.nonDiagnosticReviewMaterialPacketRecordContractReviewHealthOwnerPxImplementationClosed === true &&
    d040.sourceDraftQuestionCount === 17 &&
    d040.resolvedDecisionAxisCount === 20 &&
    d040.newlyReservedIdCount === 19 &&
    d040.firstBatchCardCount === 4 &&
    d040.energyBatchCardCount === 5 &&
    d040.dataLifecycleBatchCardCount === 4 &&
    d040.draftedCardCount === 17 &&
    d040.firstBatchSelfReviewPassed === true &&
    d040.energyBatchSelfReviewPassed === true &&
    d040.dataLifecycleBatchSelfReviewPassed === true &&
    d040.modelOutputNamesPreserved === true &&
    d040.reeToDailyTargetStrategyAuthorized === false &&
    d040.silentDefaultPalAllowed === false &&
    d040.dynamicModelSourceAssessmentComplete === true &&
    d040.dynamicModelIdentityAndEquationSourceLocated === true &&
    d040.dynamicModelObservedPublicCodeAssetCount === 7 &&
    d040.dynamicModelPublicCodeAssetHashesRecorded === true &&
    d040.dynamicModelExplicitPerFileLicenseFound === false &&
    d040.dynamicModelStableSemanticReleaseFound === false &&
    d040.dynamicModelOfficialVersionedOracleCorpusFound === false &&
    d040.dynamicModelRegressionToleranceDefined === false &&
    d040.dynamicModelProductGuardrailsApproved === false &&
    d040.dynamicModelSourceCodeVendored === false &&
    d040.dynamicModelRemoteCodeExecuted === false &&
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
    d040.chinaMacroInputState === "EVIDENCE_COMPLETE" &&
    d040.chinaMacroStandardId === "WS/T 578.1-2017" &&
    d040.chinaMacroStandardStatus === "CURRENT_RECOMMENDED_INDUSTRY_STANDARD" &&
    d040.chinaMacroOfficialStatusVerified === true &&
    JSON.stringify(d040.chinaMacroCarbohydrateRange) === JSON.stringify([50, 65]) &&
    JSON.stringify(d040.chinaMacroFatRange) === JSON.stringify([20, 30]) &&
    JSON.stringify(d040.chinaMacroProteinRange) === JSON.stringify([10, 15]) &&
    d040.chinaMacroRangeCanGenerateDefaultTriplet === false &&
    d040.chinaMacroCanTriggerDiagnosisScoringOrCorrection === false &&
    d040.chinaMacroConsultationDraftTreatedAsCurrent === false &&
    d040.chinaMacroStandardEvidenceGapClosed === true &&
    d040.d063ChinaReferenceBandEvidenceReady === true &&
    d040.d063CardState === "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY" &&
    d040.d063DecisionId === "D-063" &&
    d040.d063QuestionId === "d063_macro_target_source" &&
    d040.d063CardCount === 1 &&
    d040.d063OptionCount === 3 &&
    JSON.stringify(d040.d063OptionIds) === JSON.stringify([
      "no_macro_target",
      "china_adult_reference_band_information_only",
      "user_defined_macro_target",
    ]) &&
    d040.d063RecommendedOptionId === "no_macro_target" &&
    d040.d063ReferenceBandStandardId === "WS/T 578.1-2017" &&
    JSON.stringify(d040.d063ReferenceBandCarbohydrateRange) === JSON.stringify([50, 65]) &&
    JSON.stringify(d040.d063ReferenceBandFatRange) === JSON.stringify([20, 30]) &&
    JSON.stringify(d040.d063ReferenceBandProteinRange) === JSON.stringify([10, 15]) &&
    d040.d063ReferenceBandInformationOnly === true &&
    d040.d063ReferenceBandCanGenerateDefaultTriplet === false &&
    d040.d063ReferenceBandCreatesGoalVersion === false &&
    d040.d063ReferenceBandCanTriggerScoringDiagnosisOrCorrection === false &&
    d040.d063UserDefinedRequiresD070 === true &&
    d040.d063DisplayAndRoundingRequiresD071 === true &&
    d040.d063HardStopRecordAvailabilityRequiresD072 === true &&
    d040.d063D068D069PrerequisitesPassed === false &&
    d040.d063SelfReviewPassed === true &&
    d040.d063HealthReviewerAssigned === false &&
    d040.d063HealthContentApproved === false &&
    d040.d063ContentQaPassed === false &&
    d040.d063CardRegisteredInDecisionLedger === false &&
    d040.d063OwnerReady === false &&
    d040.macroCardIndependentReviewPassed === false &&
    d040.d063OwnerReviewAuthorized === false &&
    d040.d063MacroImplementationAuthorized === false &&
    d040.d070CardState === "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY" &&
    d040.d070DecisionId === "D-070" &&
    d040.d070QuestionId === "d070_custom_macro_input_shape" &&
    d040.d070ApplicableWhen === "D-063 = user_defined_macro_target" &&
    d040.d070CardCount === 1 &&
    d040.d070OptionCount === 3 &&
    JSON.stringify(d040.d070OptionIds) === JSON.stringify([
      "complete_macro_grams",
      "fixed_100_percent_triplet",
      "partial_macro_grams_explicit_missing",
    ]) &&
    d040.d070RecommendedOptionId === "complete_macro_grams" &&
    d040.d070InputShapesMutuallyExclusive === true &&
    d040.d070PercentAllThreeRequired === true &&
    d040.d070PercentSumRequired === 100 &&
    d040.d070CompleteGramsAllThreeRequired === true &&
    JSON.stringify(d040.d070PartialGramsSetCountRange) === JSON.stringify([1, 2]) &&
    d040.d070MissingMacroTreatedAsZero === false &&
    d040.d070ResidualAutoFilled === false &&
    d040.d070MixedInputShapesAllowed === false &&
    d040.d070PercentToGramRequiresEnergyTarget === true &&
    d040.d070ConversionSelectsTarget === false &&
    d040.d070ActualEnergyMismatchIsDataError === false &&
    d040.d070NumericHealthBoundsApproved === false &&
    d040.d070D063Accepted === false &&
    d040.d070D068D069PrerequisitesPassed === false &&
    d040.d070SelfReviewPassed === true &&
    d040.d070HealthContentApproved === false &&
    d040.d070ContentQaPassed === false &&
    d040.d070IndependentReviewPassed === false &&
    d040.d070CardRegisteredInDecisionLedger === false &&
    d040.d070OwnerReady === false &&
    d040.d070OwnerReviewAuthorized === false &&
    d040.d070MacroConversionImplementationAuthorized === false &&
    d040.d070PersistenceImplementationAuthorized === false &&
    d040.d071CardState === "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY" &&
    d040.d071DecisionId === "D-071" &&
    d040.d071QuestionId === "d071_macro_display_rounding" &&
    d040.d071ApplicableWhen === "D-063 = user_defined_macro_target; reference-band branch uses fixed information-only display" &&
    d040.d071CardCount === 1 &&
    d040.d071OptionCount === 3 &&
    JSON.stringify(d040.d071OptionIds) === JSON.stringify([
      "source_primary_optional_derived_one_decimal",
      "source_unit_only_one_decimal",
      "source_primary_optional_derived_two_decimals",
    ]) &&
    d040.d071RecommendedOptionId === "source_primary_optional_derived_one_decimal" &&
    d040.d071ReferenceBandInformationOnly === true &&
    d040.d071ReferenceBandDerivedGramsAllowed === false &&
    d040.d071SourceUnitAlwaysPreserved === true &&
    d040.d071DerivedUnitRequiresExplicitInputs === true &&
    d040.d071DisplayDecimalRoundingMode === "ROUND_HALF_UP" &&
    d040.d071RecommendedDecimalPlaces === 1 &&
    d040.d071HighPrecisionDecimalPlaces === 2 &&
    d040.d071RawValuesAuthoritative === true &&
    d040.d071DisplayValuesPersistedAsGoal === false &&
    d040.d071ConversionsUseDisplayRoundedValues === false &&
    d040.d071ResidualAllocatedToMacro === false &&
    d040.d071DisplayedPercentTripletForcedTo100 === false &&
    d040.d071RoundingDisclosureRequired === true &&
    d040.d071ActualEnergyMismatchTreatedAsRoundingResidual === false &&
    d040.d071EnergyRoundingPolicyReused === false &&
    d040.d071NumericHealthBoundsApproved === false &&
    d040.d071D063Accepted === false &&
    d040.d071D070Accepted === false &&
    d040.d071D068D069PrerequisitesPassed === false &&
    d040.d071SelfReviewPassed === true &&
    d040.d071HealthContentApproved === false &&
    d040.d071ContentQaPassed === false &&
    d040.d071IndependentReviewPassed === false &&
    d040.d071CardRegisteredInDecisionLedger === false &&
    d040.d071OwnerReady === false &&
    d040.d071OwnerReviewAuthorized === false &&
    d040.d071MacroDisplayImplementationAuthorized === false &&
    d040.d071PersistenceImplementationAuthorized === false &&
    d040.d072CardState === "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY" &&
    d040.d072DecisionId === "D-072" &&
    d040.d072QuestionId === "d072_hard_stop_record_availability" &&
    d040.d072ApplicableWhen === "automatic energy/weight-loss/macro target hard stop or conditional stop is active" &&
    d040.d072CardCount === 1 &&
    d040.d072OptionCount === 2 &&
    JSON.stringify(d040.d072OptionIds) === JSON.stringify([
      "allow_no_goal_fact_recording",
      "pause_new_fact_creation_keep_data_controls",
    ]) &&
    d040.d072RecommendedOptionId === "allow_no_goal_fact_recording" &&
    d040.d072HardStopCannotBeWaived === true &&
    d040.d072NoGoalRecordingCannotCreateGoal === true &&
    d040.d072AutomaticTargetOrFormulaShown === false &&
    d040.d072TargetComparisonOrScoringShown === false &&
    d040.d072ExistingHistoryRecalculated === false &&
    d040.d072ExistingHistoryDeleted === false &&
    d040.d072DataAccessAndDeletionRemainAvailable === true &&
    d040.d072RecordingChoiceChangesHealthClassification === false &&
    d040.d072ConditionInferredByApp === false &&
    d040.d072UnknownEligibilityEnablesAutomaticTarget === false &&
    d040.d072SupportCopyRequiresHealthApproval === true &&
    d040.d072D068D069PrerequisitesPassed === false &&
    d040.d072SelfReviewPassed === true &&
    d040.d072HealthContentApproved === false &&
    d040.d072ContentQaPassed === false &&
    d040.d072IndependentReviewPassed === false &&
    d040.d072CardRegisteredInDecisionLedger === false &&
    d040.d072OwnerReady === false &&
    d040.d072OwnerReviewAuthorized === false &&
    d040.d072RecordingImplementationAuthorized === false &&
    d040.d072PersistenceImplementationAuthorized === false &&
    d040.macroAxisReviewPacketReady === true &&
    d040.macroAxisReviewPacketVersion === "PACKET-001-R1" &&
    d040.macroAxisReviewRequiredArtifactCount === 10 &&
    d040.macroAxisReviewRequiredCardCount === 4 &&
    d040.macroAxisReviewCardDecisionCount === 4 &&
    d040.macroAxisReviewRequiredDomainCount === 4 &&
    d040.macroAxisReviewDomainCount === 4 &&
    d040.macroAxisReviewRequiredInvariantCount === 14 &&
    d040.macroAxisReviewDispositionCount === 4 &&
    d040.macroAxisReviewBlockingSeverityCount === 3 &&
    d040.macroAxisReviewNamedReviewerRequired === true &&
    d040.macroAxisReviewAuthorOrPmCanSelfApprove === false &&
    d040.macroAxisReviewAiOrAgentCanBeReviewer === false &&
    d040.macroAxisReviewExternalMessageSent === false &&
    d040.macroAxisReviewReviewersAssigned === false &&
    d040.macroAxisReviewIdentityVerified === false &&
    d040.macroAxisReviewIndependenceVerified === false &&
    d040.macroAxisReviewConflictResolved === false &&
    d040.macroAxisReviewStarted === false &&
    d040.macroAxisReviewPassed === false &&
    d040.macroAxisReviewFindingCountsMeasured === false &&
    d040.macroAxisReviewHealthStillRequired === true &&
    d040.macroAxisReviewHealthContentApproved === false &&
    d040.macroAxisReviewContentQaPassed === false &&
    d040.macroAxisReviewD063Accepted === false &&
    d040.macroAxisReviewD070Accepted === false &&
    d040.macroAxisReviewD063OwnerReady === false &&
    d040.macroAxisReviewD070OwnerReady === false &&
    d040.macroAxisReviewD071OwnerReady === false &&
    d040.macroAxisReviewD072OwnerReady === false &&
    d040.macroAxisIndependentReviewPassed === false &&
    d040.macroAxisReviewOwnerIntakeChanged === false &&
    d040.macroAxisReviewOwnerCardScheduled === false &&
    d040.macroAxisReviewOwnerReviewAuthorized === false &&
    d040.macroAxisReviewGoalImplementationAuthorized === false &&
    d040.macroAxisReviewRecordingImplementationAuthorized === false &&
    d040.macroAxisReviewPersistenceImplementationAuthorized === false &&
    d040.macroAxisReviewFormalImplementationAuthorized === false &&
    d040.macroAxisInputManifestFrozen === true &&
    d040.macroAxisInputManifestEntryCount === 10 &&
    d040.macroAxisInputManifestCommit === "47ba4895dac2535682e8d1a8cb985176d6ad45f7" &&
    d040.macroAxisInputManifestRecordCommit === "d8e812f1324590d735f809ea994e8aaa2f6805d8" &&
    d040.macroAxisInputManifestGitBlobOidAlgorithm === "SHA-1" &&
    d040.macroAxisInputManifestCanonicalDigestAlgorithm === "SHA-256" &&
    d040.macroAxisInputManifestUsesRawGitBlobBytes === true &&
    d040.macroAxisInputManifestFrozenArtifactCount === 10 &&
    d040.macroAxisInputManifestSourcePacketEventId === "EVT-20260821-006" &&
    d040.macroAxisInputManifestPacketNext === "MACRO_AXIS_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED" &&
    d040.macroAxisInputManifestReviewersAssigned === false &&
    d040.macroAxisInputManifestReviewStarted === false &&
    d040.macroAxisInputManifestReviewPassed === false &&
    d040.macroAxisInputManifestHealthContentApproved === false &&
    d040.macroAxisInputManifestContentQaPassed === false &&
    d040.macroAxisInputManifestOwnerReviewAuthorized === false &&
    d040.macroAxisInputManifestFormalImplementationAuthorized === false &&
    d040.healthReviewPacketReady === true &&
    d040.healthReviewRequiredArtifactCount === 9 &&
    d040.healthReviewRequiredItemCount === 13 &&
    d040.healthReviewCopyItemCount === 6 &&
    d040.healthReviewBoundaryItemCount === 7 &&
    d040.healthReviewDispositionCount === 4 &&
    d040.healthReviewQualificationFieldCount === 9 &&
    d040.healthReviewFormalReviewFieldCount === 21 &&
    d040.healthReviewImmutableArtifactRefsRequired === true &&
    d040.healthReviewContentQaIndependentGateRequired === true &&
    d040.healthReviewSensitiveCredentialDocumentsStored === false &&
    d040.healthReviewAiOrAgentCanBeReviewer === false &&
    d040.healthReviewExternalMessageSent === false &&
    d040.healthReviewerNameRecorded === false &&
    d040.healthReviewerQualificationVerified === false &&
    d040.healthReviewerConflictOfInterestResolved === false &&
    d040.healthReviewStarted === false &&
    d040.healthReviewPacketHealthContentApproved === false &&
    d040.healthReviewPacketContentQaPassed === false &&
    d040.healthReviewPacketD068OwnerReady === false &&
    d040.healthReviewPacketD069OwnerReady === false &&
    d040.healthReviewPacketD063OwnerReady === false &&
    d040.healthReviewPacketFirstThreeBatchesIndependentReviewPassed === false &&
    d040.healthReviewPacketHealthCopyImplementationAuthorized === false &&
    d040.healthReviewPacketFormulaImplementationAuthorized === false &&
    d040.independentReviewPacketReady === true &&
    d040.independentReviewRequiredArtifactCount === 7 &&
    d040.independentReviewRequiredCardCount === 13 &&
    d040.independentReviewCardDecisionCount === 13 &&
    d040.independentReviewRequiredDomainCount === 4 &&
    d040.independentReviewDomainCount === 4 &&
    d040.independentReviewRequiredInvariantCount === 12 &&
    d040.independentReviewDispositionCount === 4 &&
    d040.independentReviewBlockingSeverityCount === 3 &&
    d040.independentReviewNamedReviewerRequired === true &&
    d040.independentReviewAuthorOrPmCanSelfApprove === false &&
    d040.independentReviewAiOrAgentCanBeReviewer === false &&
    d040.independentReviewExternalMessageSent === false &&
    d040.independentReviewReviewersAssigned === false &&
    d040.independentReviewIdentityVerified === false &&
    d040.independentReviewIndependenceVerified === false &&
    d040.independentReviewConflictResolved === false &&
    d040.independentReviewStarted === false &&
    d040.independentReviewPassed === false &&
    d040.independentReviewFindingCountsMeasured === false &&
    d040.independentReviewDynamicModelOptionOwnerReady === false &&
    d040.independentReviewHealthReviewStillRequired === true &&
    d040.independentReviewHealthContentApproved === false &&
    d040.independentReviewFirstThreeBatchesPassed === false &&
    d040.independentReviewPersistenceImplementationAuthorized === false &&
    d040.formulaEvidenceReviewComplete === true &&
    d040.firstBatchOwnerReviewAuthorized === false &&
    d040.ownerCardScheduled === false &&
    d040AuthorizationClosed
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D040_GATE", "D-040", "D-040 未保持 20 轴分解、前三批十三卡自审及独立复核包、D-063/D-070/D-071/D-072 四张宏量轴卡、四卡独立复核包及其 10 项输入冻结、NIDDK 动态模型采用门禁、生命周期边界、中国支持与宏量现行标准输入、健康评审交接包、具名评审缺口、独立 Content QA/复核待办、PX-0 输入缺口和授权位关闭状态", d040);
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
    oi07,
    oi07Harness,
    d034CorpusManifestHarness,
    d034RunReportContract,
    d034RunReportHarness,
    d039IndependentReviewRecordHarness,
    d040ChinaHealthReviewRecordHarness,
    d040FirstThreeBatchesIndependentReviewRecordHarness,
    d040MacroAxisIndependentReviewRecordHarness,
    d040NiddkLicenseRoutingEvidence,
    d040NiddkLicenseClarificationTemplate,
    d040NiddkLegacyReferenceAudit,
    mvpIncrementScope,
    mvpIncrementScopeReviewPacket,
    mvpIncrementScopeInputManifest,
    mvpIncrementScopeCrossRoleReviewRecordHarness,
    mvpIncrementScopeReviewerAssignmentHarness,
    d039ReviewerAssignmentHarness,
    d040FirstThreeBatchesReviewerAssignmentHarness,
    d040MacroAxisReviewerAssignmentHarness,
    d040ChinaHealthReviewerAssignmentHarness,
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
