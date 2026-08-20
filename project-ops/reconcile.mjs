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
    d036.registeredInDecisionLedger === false &&
    d036.ownerResponseCount === 0
  )) {
    addDiagnostic(diagnostics, "error", "OPS_RECONCILE_D036_GATE", "D-036", "D-036 未保持三包 AITransport 卡、36 单元/13 原生面 Spike 协议，以及 OI-07/Provider/工具链/联网/执行/复核/Owner/B05/实现待办状态", d036);
  }

  const d053Record = latestD053Record(model);
  const d053EvidenceProtocolRecord = latestD053EvidenceProtocolRecord(model);
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
    d040.eventId === "EVT-20260821-007" &&
    d040.next === "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED" &&
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
