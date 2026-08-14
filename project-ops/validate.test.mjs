import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  PHASE0_2026_08_14_OWNER_IDENTIFIER_CONTRACT,
  ProjectOpsLoadError,
  loadProjectOps,
  validateOperationalInvariants,
} from "./validate.mjs";

const TEST_PATH = fileURLToPath(import.meta.url);
const VALIDATOR_PATH = fileURLToPath(new URL("./validate.mjs", import.meta.url));
const WORKSPACE_ROOT = path.resolve(path.dirname(TEST_PATH), "..");
const VALID_MODEL = loadProjectOps(WORKSPACE_ROOT);

function validateMutation(mutator) {
  const model = structuredClone(VALID_MODEL);
  mutator(model);
  return validateOperationalInvariants(model);
}

function assertDiagnostic(report, code, diagnosticPath = undefined) {
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === code &&
        (diagnosticPath === undefined || diagnostic.path === diagnosticPath),
    ),
    `缺少诊断 ${code}${diagnosticPath ? ` @ ${diagnosticPath}` : ""}: ${JSON.stringify(report.diagnostics, null, 2)}`,
  );
}

function findD039Gate(model) {
  return model.events.find(
    (record) =>
      record.value.type === "GATE_CHANGED" && record.value.subject?.id === "D-039-PX-2",
  );
}

function findD040InitialFeedback(model) {
  return model.events.find(
    (record) => record.value.eventId === "EVT-20260806-002",
  );
}

function findD040FinalFeedback(model) {
  return model.events.find(
    (record) => record.value.eventId === "EVT-20260806-005",
  );
}

function findEvent(model, eventId) {
  return model.events.find((record) => record.value.eventId === eventId);
}

function copyValidationFixture() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nuttie-project-ops-"));
  fs.cpSync(path.join(WORKSPACE_ROOT, "project-ops"), path.join(tempRoot, "project-ops"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(tempRoot, "docs", "01-research"), { recursive: true });
  fs.copyFileSync(
    path.join(WORKSPACE_ROOT, "docs", "01-research", "competitor-evidence-matrix.md"),
    path.join(tempRoot, "docs", "01-research", "competitor-evidence-matrix.md"),
  );
  fs.copyFileSync(
    path.join(WORKSPACE_ROOT, "docs", "01-research", "public-evidence-gaps.md"),
    path.join(tempRoot, "docs", "01-research", "public-evidence-gaps.md"),
  );
  return tempRoot;
}

test("当前 Phase 0 Project Ops 基线通过", () => {
  const report = validateOperationalInvariants(VALID_MODEL);

  assert.equal(report.ok, true);
  assert.deepEqual(report.diagnostics, []);
  assert.equal(report.baseline, PHASE0_2026_08_14_OWNER_IDENTIFIER_CONTRACT.id);
  assert.deepEqual(report.schemaValidation, {
    profile: "DRAFT_2020_12_PROJECT_SUBSET_V1",
    schemasChecked: 5,
    instancesValidated: 248,
  });
  assert.equal(report.counts.schemas, 5);
  assert.equal(report.counts.decisions, 31);
  assert.equal(report.counts.events, 130);
  assert.equal(report.counts.messages, 115);
  assert.equal(report.counts.resolvedResponses, 71);
  assert.equal(report.counts.evidenceItems, 66);
  assert.deepEqual(report.counts.activeAgentIds, ["root"]);
  assert.equal(report.counts.agents, 25);
  const aiCredentialEvent = findEvent(VALID_MODEL, "EVT-20260812-001");
  assert.equal(aiCredentialEvent.value.subject.id, "ai-credential-lifecycle-contract");
  assert.equal(aiCredentialEvent.value.data.formalImplementationAuthorized, false);
  assert.equal(aiCredentialEvent.value.data.ownerIntakeChanged, false);
  const bodyWeightEvent = findEvent(VALID_MODEL, "EVT-20260812-002");
  assert.equal(bodyWeightEvent.value.subject.id, "body-weight-record-contract");
  assert.equal(bodyWeightEvent.value.data.sameDayRecordsPreserved, true);
  assert.equal(bodyWeightEvent.value.data.formalImplementationAuthorized, false);
  const sevenDayEnergyEvent = findEvent(VALID_MODEL, "EVT-20260812-003");
  assert.equal(sevenDayEnergyEvent.value.subject.id, "seven-day-energy-trend-contract");
  assert.equal(sevenDayEnergyEvent.value.data.missingDistinctFromZero, true);
  assert.equal(sevenDayEnergyEvent.value.data.burnFormulaAuthorized, false);
  const manualBurnEvent = findEvent(VALID_MODEL, "EVT-20260812-004");
  assert.equal(manualBurnEvent.value.subject.id, "manual-burn-record-contract");
  assert.equal(manualBurnEvent.value.data.projectedQuality, "USER_ENTERED");
  assert.equal(manualBurnEvent.value.data.burnFormulaAuthorized, false);
  const waterRecordEvent = findEvent(VALID_MODEL, "EVT-20260812-005");
  assert.equal(waterRecordEvent.value.subject.id, "water-record-contract");
  assert.equal(waterRecordEvent.value.data.exactDailyAggregation, true);
  assert.equal(waterRecordEvent.value.data.goalAuthorized, false);
  assert.equal(waterRecordEvent.value.data.defaultOrDisplayUnitAuthorized, false);
  const localReminderEvent = findEvent(VALID_MODEL, "EVT-20260812-006");
  assert.equal(localReminderEvent.value.subject.id, "local-reminder-reconcile-contract");
  assert.equal(localReminderEvent.value.data.desiredStateGenerationProtected, true);
  assert.equal(localReminderEvent.value.data.systemPresentationGuaranteed, false);
  assert.equal(localReminderEvent.value.data.realNotificationApiCalls, 0);
  const dateNavigationEvent = findEvent(VALID_MODEL, "EVT-20260812-007");
  assert.equal(dateNavigationEvent.value.subject.id, "date-navigation-contract");
  assert.equal(dateNavigationEvent.value.data.externalPolicyEvidenceRequired, true);
  assert.equal(dateNavigationEvent.value.data.futureDateRuleAuthorized, false);
  assert.equal(dateNavigationEvent.value.data.systemClockRead, false);
  const mealSlotGroupingEvent = findEvent(VALID_MODEL, "EVT-20260812-008");
  assert.equal(mealSlotGroupingEvent.value.subject.id, "meal-slot-grouping-contract");
  assert.equal(mealSlotGroupingEvent.value.data.unassignedDistinctFromUnresolved, true);
  assert.equal(mealSlotGroupingEvent.value.data.builtInDefaultSlots, false);
  assert.equal(mealSlotGroupingEvent.value.data.moveOrCopyAuthorized, false);
  const macroTargetHistoryEvent = findEvent(VALID_MODEL, "EVT-20260812-009");
  assert.equal(macroTargetHistoryEvent.value.subject.id, "macro-target-history-contract");
  assert.equal(macroTargetHistoryEvent.value.data.historicalEffectiveDatePreserved, true);
  assert.equal(macroTargetHistoryEvent.value.data.actualTargetCompatibilityInferred, false);
  assert.equal(macroTargetHistoryEvent.value.data.targetAlgorithmAuthorized, false);
  assert.equal(macroTargetHistoryEvent.value.data.mutationAuthorized, false);
  const dailyEnergyLedgerEvent = findEvent(VALID_MODEL, "EVT-20260812-010");
  assert.equal(dailyEnergyLedgerEvent.value.subject.id, "daily-energy-ledger-contract");
  assert.equal(dailyEnergyLedgerEvent.value.data.exactIntakeAndBurnAggregation, true);
  assert.equal(dailyEnergyLedgerEvent.value.data.leftStatus, "POLICY_NOT_AUTHORIZED");
  assert.equal(dailyEnergyLedgerEvent.value.data.leftFormulaAuthorized, false);
  assert.equal(dailyEnergyLedgerEvent.value.data.missingBurnDefaultAuthorized, false);
  const localProfileRecordEvent = findEvent(VALID_MODEL, "EVT-20260812-011");
  assert.equal(localProfileRecordEvent.value.subject.id, "local-profile-record-contract");
  assert.deepEqual(localProfileRecordEvent.value.data.featureIds, ["F12", "F17"]);
  assert.equal(localProfileRecordEvent.value.data.explicitVersionedOpaqueSchema, true);
  assert.equal(localProfileRecordEvent.value.data.relatedDataMutation, "NOT_AUTHORIZED");
  assert.equal(localProfileRecordEvent.value.data.approvedProfileFields, false);
  assert.equal(localProfileRecordEvent.value.data.cascadeDeleteAuthorized, false);
  const localDataAccessEvent = findEvent(VALID_MODEL, "EVT-20260812-012");
  assert.equal(localDataAccessEvent.value.subject.id, "local-data-access-manifest-contract");
  assert.equal(localDataAccessEvent.value.data.deliveryMode, "IN_APP_READ_ONLY");
  assert.equal(localDataAccessEvent.value.data.emptyDomainsPreserved, true);
  assert.equal(localDataAccessEvent.value.data.completeReadVerification, true);
  assert.equal(localDataAccessEvent.value.data.keychainSecretValues, "EXCLUDED_NEVER_RETURNED");
  assert.equal(localDataAccessEvent.value.data.externalFilesCopies, "OUT_OF_SCOPE_USER_CONTROLLED");
  assert.equal(localDataAccessEvent.value.data.plaintextExportAuthorized, false);
  assert.equal(localDataAccessEvent.value.data.mutation, "NOT_AUTHORIZED");
  const localDataRegistryEvent = findEvent(VALID_MODEL, "EVT-20260813-001");
  assert.equal(localDataRegistryEvent.value.subject.id, "local-data-access-registry-contract");
  assert.equal(localDataRegistryEvent.value.data.singleVersionedDomainRegistry, true);
  assert.equal(localDataRegistryEvent.value.data.completeRegisteredDomainSetRequired, true);
  assert.equal(localDataRegistryEvent.value.data.consistentReadSnapshotPort, true);
  assert.equal(localDataRegistryEvent.value.data.repositoryGenerationBound, true);
  assert.equal(localDataRegistryEvent.value.data.registryFingerprintBound, true);
  assert.equal(localDataRegistryEvent.value.data.everyRegisteredDomainReadExactlyOnce, true);
  assert.equal(localDataRegistryEvent.value.data.abortedTransactionClosed, true);
  assert.equal(localDataRegistryEvent.value.data.closeReceiptRequiredBeforePublish, true);
  assert.equal(localDataRegistryEvent.value.data.mixedGenerationPrevented, true);
  assert.equal(localDataRegistryEvent.value.data.sqliteAccessLayerAuthorized, false);
  assert.equal(localDataRegistryEvent.value.data.sqlCipherSnapshotImplemented, false);
  assert.equal(localDataRegistryEvent.value.data.businessDomainFieldsApproved, false);
  assert.equal(localDataRegistryEvent.value.data.formalImplementationAuthorized, false);
  const aiCandidateConfirmationEvent = findEvent(VALID_MODEL, "EVT-20260813-002");
  assert.deepEqual(aiCandidateConfirmationEvent.value.data.featureIds, ["F01", "F02"]);
  assert.equal(aiCandidateConfirmationEvent.value.data.volatileLocalInputPreserved, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.strictResponseContractReused, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.explicitCandidateReviewRequired, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.requestContextFingerprintBound, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.policyEvidenceFingerprintBound, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.candidateFingerprintBound, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.confirmedValueCallerOwned, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.saveEffectExcludesRawInputAndCandidate, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.idempotentConfirmedValueSave, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.unknownCommitReplayRequired, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.volatileInputPurgedAfterCommit, true);
  assert.equal(aiCandidateConfirmationEvent.value.data.mediaRetentionAuthorized, false);
  assert.equal(aiCandidateConfirmationEvent.value.data.nonLabelConfirmationPolicyAuthorized, false);
  assert.equal(aiCandidateConfirmationEvent.value.data.transportProfileAuthorized, false);
  assert.equal(aiCandidateConfirmationEvent.value.data.providerUsePolicyAuthorized, false);
  assert.equal(aiCandidateConfirmationEvent.value.data.businessFieldMappingApproved, false);
  assert.equal(aiCandidateConfirmationEvent.value.data.automaticDiaryOrTargetMutation, false);
  assert.equal(aiCandidateConfirmationEvent.value.data.persistentRepositoryImplemented, false);
  assert.equal(aiCandidateConfirmationEvent.value.data.realNetworkRequests, 0);
  assert.equal(aiCandidateConfirmationEvent.value.data.formalImplementationAuthorized, false);
  const aiGuidanceReferenceEvent = findEvent(VALID_MODEL, "EVT-20260813-003");
  assert.equal(aiGuidanceReferenceEvent.value.subject.id, "ai-guidance-reference-contract");
  assert.equal(aiGuidanceReferenceEvent.value.data.featureId, "F16");
  assert.equal(aiGuidanceReferenceEvent.value.data.strictOpaqueResponseContract, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.duplicateJsonKeysRejected, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.referenceOnlyBoundary, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.nonMedicalBoundary, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.medicalSafetyEvaluation, "NOT_PERFORMED");
  assert.equal(aiGuidanceReferenceEvent.value.data.highRiskUseAuthorized, false);
  assert.equal(aiGuidanceReferenceEvent.value.data.callerOwnedContentDefinition, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.callerOwnedDisclaimerDefinition, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.requestAndPolicyEvidenceBound, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.sourceAndEditFingerprintsBound, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.revisionCasEditing, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.discardPurgesVolatileContent, true);
  assert.equal(aiGuidanceReferenceEvent.value.data.observableEffects, 0);
  assert.equal(aiGuidanceReferenceEvent.value.data.automaticDiaryOrTargetMutation, false);
  assert.equal(aiGuidanceReferenceEvent.value.data.persistenceStrategyAuthorized, false);
  assert.equal(aiGuidanceReferenceEvent.value.data.iaPlacementAuthorized, false);
  assert.equal(aiGuidanceReferenceEvent.value.data.nonLabelConfirmationPolicyAuthorized, false);
  assert.equal(aiGuidanceReferenceEvent.value.data.providerUsePolicyAuthorized, false);
  assert.equal(aiGuidanceReferenceEvent.value.data.businessPayloadApproved, false);
  assert.equal(aiGuidanceReferenceEvent.value.data.persistentRepositoryImplemented, false);
  assert.equal(aiGuidanceReferenceEvent.value.data.systemClockRead, false);
  assert.equal(aiGuidanceReferenceEvent.value.data.realNetworkRequests, 0);
  assert.equal(aiGuidanceReferenceEvent.value.data.formalImplementationAuthorized, false);
  const mediaPermissionEvent = findEvent(VALID_MODEL, "EVT-20260812-013");
  assert.equal(mediaPermissionEvent.value.subject.id, "media-permission-orchestrator-contract");
  assert.equal(mediaPermissionEvent.value.data.taskExplanationBeforeCameraEffect, true);
  assert.equal(mediaPermissionEvent.value.data.manualFallbackRequiredForCamera, true);
  assert.equal(mediaPermissionEvent.value.data.photoLibraryPermission, "NOT_REQUESTED_USE_SYSTEM_USER_SELECTION");
  assert.equal(mediaPermissionEvent.value.data.mediaRetention, "D031_NOT_AUTHORIZED");
  assert.equal(mediaPermissionEvent.value.data.videoCapture, "NOT_AUTHORIZED");
  assert.equal(mediaPermissionEvent.value.data.locationPermission, "NOT_AUTHORIZED");
  assert.equal(mediaPermissionEvent.value.data.nativeApiCalls, 0);
  const prohibitedCapabilityAuditEvent = findEvent(VALID_MODEL, "EVT-20260812-014");
  assert.equal(prohibitedCapabilityAuditEvent.value.subject.id, "prohibited-capability-audit-contract");
  assert.deepEqual(prohibitedCapabilityAuditEvent.value.data.featureIds, ["F20", "F23", "F24"]);
  assert.equal(prohibitedCapabilityAuditEvent.value.data.requiredEvidenceSurfaces, 27);
  assert.equal(prohibitedCapabilityAuditEvent.value.data.formalSignedReleaseTargetPresent, false);
  assert.equal(prohibitedCapabilityAuditEvent.value.data.currentAuditDisposition, "BLOCKED");
  assert.deepEqual(prohibitedCapabilityAuditEvent.value.data.currentBlockers, ["FORMAL_TARGET_ABSENT", "REQUIRED_SURFACE_MISSING"]);
  assert.equal(prohibitedCapabilityAuditEvent.value.data.productionArtifactScansExecuted, 0);
  assert.equal(prohibitedCapabilityAuditEvent.value.data.evidenceTruthVerified, false);
  assert.equal(prohibitedCapabilityAuditEvent.value.data.releaseGateClosed, false);
  const platformLanguageReleaseAuditEvent = findEvent(VALID_MODEL, "EVT-20260812-015");
  assert.equal(platformLanguageReleaseAuditEvent.value.subject.id, "platform-language-release-audit-contract");
  assert.equal(platformLanguageReleaseAuditEvent.value.data.acceptedMinimumOsVersion, "17.0");
  assert.equal(platformLanguageReleaseAuditEvent.value.data.acceptedPrimaryReleaseLanguage, "zh-Hans");
  assert.deepEqual(platformLanguageReleaseAuditEvent.value.data.acceptedBaselineDecisionIds, ["D-011", "D-016"]);
  assert.equal(platformLanguageReleaseAuditEvent.value.data.acceptedPlatformShapeDecisions, 0);
  assert.deepEqual(platformLanguageReleaseAuditEvent.value.data.platformShapeDecisionIds, []);
  assert.equal(platformLanguageReleaseAuditEvent.value.data.requiredEvidenceSurfaces, 25);
  assert.equal(platformLanguageReleaseAuditEvent.value.data.formalSignedReleaseTargetPresent, false);
  assert.equal(platformLanguageReleaseAuditEvent.value.data.currentAuditDisposition, "BLOCKED");
  assert.deepEqual(platformLanguageReleaseAuditEvent.value.data.currentBlockers, ["FORMAL_TARGET_ABSENT", "PLATFORM_SHAPE_DECISION_REQUIRED", "REQUIRED_SURFACE_MISSING"]);
  assert.equal(platformLanguageReleaseAuditEvent.value.data.releaseEvidenceExecuted, 0);
  assert.equal(platformLanguageReleaseAuditEvent.value.data.decisionTruthVerified, false);
  assert.equal(platformLanguageReleaseAuditEvent.value.data.releaseGateClosed, false);
});

test("ProjectOps Schema 定义和全部受控实例必须通过校验", async (t) => {
  await t.test("拒绝未支持的 Schema 关键字", () => {
    const report = validateMutation((model) => {
      const ownerSchema = model.schemas.find(
        (record) => record.value.$id === "https://nuttie.local/schemas/owner-intake.schema.json",
      );
      ownerSchema.value.properties.batchId.minimum = 1;
    });
    assertDiagnostic(report, "OPS_SCHEMA_DEFINITION_INVALID");
    assert.equal(report.schemaValidation.schemasChecked, 5);
    assert.equal(report.schemaValidation.instancesValidated, 247);
  });

  await t.test("拒绝 Event 缺少 Schema 必需字段", () => {
    const report = validateMutation((model) => {
      delete model.events[0].value.summary;
    });
    assertDiagnostic(
      report,
      "OPS_SCHEMA_INSTANCE_INVALID",
      `${VALID_MODEL.events[0].sourceFile}:${VALID_MODEL.events[0].lineNumber}.summary`,
    );
  });

  await t.test("拒绝 Message 空接收方", () => {
    const report = validateMutation((model) => {
      model.messages[0].value.to = [];
    });
    assertDiagnostic(
      report,
      "OPS_SCHEMA_INSTANCE_INVALID",
      `${VALID_MODEL.messages[0].sourceFile}:${VALID_MODEL.messages[0].lineNumber}.to`,
    );
  });

  await t.test("拒绝 Owner intake 未声明字段", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.unreviewedOwnerChoice = true;
    });
    assertDiagnostic(
      report,
      "OPS_SCHEMA_INSTANCE_INVALID",
      "project-ops/owner-intake.json.unreviewedOwnerChoice",
    );
  });

  await t.test("拒绝 Snapshot 未声明字段", () => {
    const report = validateMutation((model) => {
      model.snapshot.project.untrackedStatus = "UNKNOWN";
    });
    assertDiagnostic(
      report,
      "OPS_SCHEMA_INSTANCE_INVALID",
      "project-ops/snapshots/current.json.project.untrackedStatus",
    );
  });

  await t.test("拒绝缺失或未映射的 Schema", () => {
    const missing = validateMutation((model) => {
      model.schemas = model.schemas.filter(
        (record) => record.value.$id !== "https://nuttie.local/schemas/project-message.schema.json",
      );
    });
    assertDiagnostic(missing, "OPS_SCHEMA_REQUIRED_MISSING", "project-ops/schemas");

    const unmapped = validateMutation((model) => {
      const schema = structuredClone(model.schemas[0]);
      schema.sourceFile = "project-ops/schemas/unmapped.schema.json";
      schema.value.$id = "https://nuttie.local/schemas/unmapped.schema.json";
      model.schemas.push(schema);
    });
    assertDiagnostic(
      unmapped,
      "OPS_SCHEMA_UNMAPPED",
      "project-ops/schemas/unmapped.schema.json.$id",
    );
  });
});

test("快照 Gate 集合与状态必须匹配版本化基线", async (t) => {
  await t.test("拒绝缺少 G8", () => {
    const report = validateMutation((model) => {
      model.snapshot.gates = model.snapshot.gates.filter((gate) => gate.id !== "G8");
    });
    assertDiagnostic(
      report,
      "OPS_SNAPSHOT_GATE_SET_MISMATCH",
      "project-ops/snapshots/current.json.gates",
    );
  });

  await t.test("拒绝重复 G0", () => {
    const report = validateMutation((model) => {
      model.snapshot.gates.push(structuredClone(model.snapshot.gates[0]));
    });
    assertDiagnostic(
      report,
      "OPS_DUP_SNAPSHOT_GATE_ID",
      "project-ops/snapshots/current.json.gates",
    );
  });

  await t.test("拒绝将 G4 提前标记为 PASS", () => {
    const report = validateMutation((model) => {
      model.snapshot.gates.find((gate) => gate.id === "G4").state = "PASS";
    });
    assertDiagnostic(report, "OPS_SNAPSHOT_GATE_STATE_MISMATCH");
  });

  await t.test("拒绝将 G2 错误回退为 FAIL", () => {
    const report = validateMutation((model) => {
      model.snapshot.gates.find((gate) => gate.id === "G2").state = "FAIL";
    });
    assertDiagnostic(report, "OPS_SNAPSHOT_GATE_STATE_MISMATCH");
  });
});

test("拒绝重复 ID、事件断号、日期错配和悬空回复", async (t) => {
  await t.test("重复 eventId", () => {
    const report = validateMutation((model) => {
      model.events[1].value.eventId = model.events[0].value.eventId;
    });
    assertDiagnostic(report, "OPS_DUP_EVENT_ID", "project-ops/events");
  });

  await t.test("重复 messageId", () => {
    const report = validateMutation((model) => {
      model.messages[1].value.messageId = model.messages[0].value.messageId;
    });
    assertDiagnostic(report, "OPS_DUP_MESSAGE_ID", "project-ops/messages");
  });

  await t.test("事件断号", () => {
    const report = validateMutation((model) => {
      const index = model.events.findIndex(
        (record) => record.value.eventId === "EVT-20260805-003",
      );
      model.events.splice(index, 1);
    });
    assertDiagnostic(report, "OPS_EVENT_SEQUENCE_GAP");
  });

  await t.test("文件日期前缀错配", () => {
    const report = validateMutation((model) => {
      const record = model.events.find(
        (candidate) => candidate.value.eventId === "EVT-20260805-001",
      );
      record.value.eventId = "EVT-20260803-001";
    });
    assertDiagnostic(report, "OPS_EVENT_FILE_PREFIX_MISMATCH");
  });

  await t.test("recordedAt 日期错配", () => {
    const report = validateMutation((model) => {
      const record = model.events.find(
        (candidate) => candidate.value.eventId === "EVT-20260805-001",
      );
      record.value.recordedAt = "2026-08-04T20:08:13+08:00";
    });
    assertDiagnostic(report, "OPS_EVENT_RECORDED_DATE_MISMATCH");
  });

  await t.test("保持总数但把历史事件迁到新日期", () => {
    const report = validateMutation((model) => {
      const record = model.events.find(
        (candidate) => candidate.value.eventId === "EVT-20260731-059",
      );
      record.fileName = "2026-08-07.jsonl";
      record.sourceFile = "project-ops/events/2026-08-07.jsonl";
      record.lineNumber = 1;
      record.value.eventId = "EVT-20260807-001";
      record.value.recordedAt = "2026-08-07T09:00:00+08:00";
    });
    assertDiagnostic(report, "OPS_EVENT_DAY_SET_MISMATCH", "project-ops/events");
    assertDiagnostic(
      report,
      "OPS_EVENT_DAY_COUNT_MISMATCH",
      "project-ops/events/2026-07-31.jsonl",
    );
  });

  await t.test("悬空 responseTo", () => {
    const report = validateMutation((model) => {
      const record = model.messages.find((candidate) => candidate.value.responseTo);
      record.value.responseTo = "MSG-20990101-999";
    });
    assertDiagnostic(report, "OPS_DANGLING_RESPONSE_TO");
  });
});

test("拒绝把 AI 凭据生命周期合同越级为生产或 Owner 授权", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-001");
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_AI_CREDENTIAL_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把体重事务合同越级为正式规则、HealthKit 或按日合并授权", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-002");
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.healthKitUsed = true;
    event.value.data.dailyMergeAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_BODY_WEIGHT_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把七日能量事实读模型越级为公式、目标、平均、AI 或 HealthKit 授权", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-003");
    event.value.data.burnFormulaAuthorized = true;
    event.value.data.targetOrNetAuthorized = true;
    event.value.data.averageOrLongerWindowAuthorized = true;
    event.value.data.aiUsed = true;
    event.value.data.healthKitUsed = true;
  });
  assertDiagnostic(
    report,
    "OPS_SEVEN_DAY_ENERGY_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把手工消耗事实冒充测量、公式、步数、HealthKit 或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-004");
    event.value.data.projectedQuality = "MEASURED";
    event.value.data.burnFormulaAuthorized = true;
    event.value.data.stepsUsed = true;
    event.value.data.healthKitUsed = true;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_MANUAL_BURN_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把饮水事实合同越级为目标、快捷量、默认单位、撤销、趋势或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-005");
    event.value.data.goalAuthorized = true;
    event.value.data.quickAmountAuthorized = true;
    event.value.data.defaultOrDisplayUnitAuthorized = true;
    event.value.data.undoAuthorized = true;
    event.value.data.trendAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_WATER_RECORD_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把提醒对账合同越级为类型、重复规则、通知内容、Push、后台定时器或原生实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-006");
    event.value.data.systemPresentationGuaranteed = true;
    event.value.data.reminderTypeAuthorized = true;
    event.value.data.recurrenceRulesAuthorized = true;
    event.value.data.notificationContentAuthorized = true;
    event.value.data.pushOrApnsUsed = true;
    event.value.data.backgroundTimerUsed = true;
    event.value.data.realNotificationApiCalls = 1;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_LOCAL_REMINDER_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把日期事实合同越级为未来日、补记、跨时区重基、默认今天、UI、持久化或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-007");
    event.value.data.externalPolicyEvidenceRequired = false;
    event.value.data.futureDateRuleAuthorized = true;
    event.value.data.backfillRuleAuthorized = true;
    event.value.data.crossTimeZoneRebaseAuthorized = true;
    event.value.data.defaultTodayBehaviorAuthorized = true;
    event.value.data.uiBehaviorAuthorized = true;
    event.value.data.persistenceUsed = true;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_DATE_NAVIGATION_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把餐次分组合同越级为默认/自定义餐次、移动复制、目标、UI、持久化或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-008");
    event.value.data.unassignedDistinctFromUnresolved = false;
    event.value.data.historicalDefinitionPreserved = false;
    event.value.data.builtInDefaultSlots = true;
    event.value.data.defaultOrCustomRulesAuthorized = true;
    event.value.data.moveOrCopyAuthorized = true;
    event.value.data.targetRulesAuthorized = true;
    event.value.data.uiBehaviorAuthorized = true;
    event.value.data.persistenceUsed = true;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_MEAL_SLOT_GROUPING_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把宏量目标历史合同越级为算法、百分比换算、比较、舍入、写入或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-009");
    event.value.data.historicalEffectiveDatePreserved = false;
    event.value.data.futureVersionDoesNotRewritePast = false;
    event.value.data.sourceAndUserEditTraceability = false;
    event.value.data.actualTargetCompatibilityInferred = true;
    event.value.data.targetAlgorithmAuthorized = true;
    event.value.data.percentConversionAuthorized = true;
    event.value.data.comparisonPolicyAuthorized = true;
    event.value.data.roundingPolicyAuthorized = true;
    event.value.data.mutationAuthorized = true;
    event.value.data.persistenceUsed = true;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_MACRO_TARGET_HISTORY_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把日能量账本合同越级为 Left 公式、缺失默认值、负值、舍入、AI 或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-010");
    event.value.data.exactIntakeAndBurnAggregation = false;
    event.value.data.historicalTargetEffectiveDatePreserved = false;
    event.value.data.leftStatus = "CALCULATED";
    event.value.data.leftFormulaAuthorized = true;
    event.value.data.targetAlgorithmAuthorized = true;
    event.value.data.missingBurnDefaultAuthorized = true;
    event.value.data.negativeLeftPolicyAuthorized = true;
    event.value.data.roundingPolicyAuthorized = true;
    event.value.data.mutationAuthorized = true;
    event.value.data.persistenceUsed = true;
    event.value.data.systemClockRead = true;
    event.value.data.aiUsed = true;
    event.value.data.healthKitUsed = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_DAILY_ENERGY_LEDGER_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把本地档案合同越级为已批字段、当前/多档案策略、级联删除、公式、账号或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-011");
    event.value.data.relatedDataEvidenceUnchanged = false;
    event.value.data.relatedDataMutation = "CASCADE_DELETE";
    event.value.data.approvedProfileFields = true;
    event.value.data.activeProfilePolicyAuthorized = true;
    event.value.data.multiProfileUxAuthorized = true;
    event.value.data.cascadeDeleteAuthorized = true;
    event.value.data.formulaAuthorized = true;
    event.value.data.accountOrServerUsed = true;
    event.value.data.persistenceUsed = true;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_LOCAL_PROFILE_RECORD_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把本地数据访问合同越级为明文导出、备份恢复、秘密值、容器完成、外部 Files 控制或写入", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-012");
    event.value.data.deliveryMode = "JSON_FILE";
    event.value.data.keychainSecretValues = "INCLUDED";
    event.value.data.nativeContainerInventory = "COMPLETE";
    event.value.data.externalFilesCopies = "APP_CONTROLLED";
    event.value.data.artifactCreation = "AUTHORIZED";
    event.value.data.mutation = "AUTHORIZED";
    event.value.data.plaintextExportAuthorized = true;
    event.value.data.backupOrRestoreAuthorized = true;
    event.value.data.persistenceUsed = true;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_LOCAL_DATA_ACCESS_MANIFEST_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把 F18 注册表端口冒充 SQLCipher、业务字段、导出备份或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-001");
    event.value.data.singleVersionedDomainRegistry = false;
    event.value.data.completeRegisteredDomainSetRequired = false;
    event.value.data.consistentReadSnapshotPort = false;
    event.value.data.repositoryGenerationBound = false;
    event.value.data.registryFingerprintBound = false;
    event.value.data.everyRegisteredDomainReadExactlyOnce = false;
    event.value.data.abortedTransactionClosed = false;
    event.value.data.closeReceiptRequiredBeforePublish = false;
    event.value.data.mixedGenerationPrevented = false;
    event.value.data.sqliteAccessLayerAuthorized = true;
    event.value.data.sqlCipherSnapshotImplemented = true;
    event.value.data.businessDomainFieldsApproved = true;
    event.value.data.plaintextExportAuthorized = true;
    event.value.data.backupOrRestoreAuthorized = true;
    event.value.data.persistenceUsed = true;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_LOCAL_DATA_ACCESS_REGISTRY_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝把 AI 候选确认合同越级为真实 transport、字段映射、自动写库或 Owner 授权", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-002");
    event.value.data.volatileLocalInputPreserved = false;
    event.value.data.strictResponseContractReused = false;
    event.value.data.explicitCandidateReviewRequired = false;
    event.value.data.requestContextFingerprintBound = false;
    event.value.data.policyEvidenceFingerprintBound = false;
    event.value.data.candidateFingerprintBound = false;
    event.value.data.confirmedValueCallerOwned = false;
    event.value.data.saveEffectExcludesRawInputAndCandidate = false;
    event.value.data.idempotentConfirmedValueSave = false;
    event.value.data.unknownCommitReplayRequired = false;
    event.value.data.volatileInputPurgedAfterCommit = false;
    event.value.data.manualFallbackBeforeCommit = false;
    event.value.data.mediaRetentionAuthorized = true;
    event.value.data.nonLabelConfirmationPolicyAuthorized = true;
    event.value.data.productionResourceBudgetAuthorized = true;
    event.value.data.transportProfileAuthorized = true;
    event.value.data.providerUsePolicyAuthorized = true;
    event.value.data.businessFieldMappingApproved = true;
    event.value.data.automaticDiaryOrTargetMutation = true;
    event.value.data.persistentRepositoryImplemented = true;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_AI_CANDIDATE_CONFIRMATION_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝把 F16 参考草稿合同越级为自动写事实、医疗安全、已批保存或 Owner 授权", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-003");
    event.value.data.strictOpaqueResponseContract = false;
    event.value.data.duplicateJsonKeysRejected = false;
    event.value.data.referenceOnlyBoundary = false;
    event.value.data.nonMedicalBoundary = false;
    event.value.data.medicalSafetyEvaluation = "PASSED";
    event.value.data.highRiskUseAuthorized = true;
    event.value.data.callerOwnedContentDefinition = false;
    event.value.data.callerOwnedDisclaimerDefinition = false;
    event.value.data.generatedAtCallerSupplied = false;
    event.value.data.requestAndPolicyEvidenceBound = false;
    event.value.data.sourceAndEditFingerprintsBound = false;
    event.value.data.revisionCasEditing = false;
    event.value.data.discardPurgesVolatileContent = false;
    event.value.data.observableEffects = 1;
    event.value.data.automaticDiaryOrTargetMutation = true;
    event.value.data.persistenceStrategyAuthorized = true;
    event.value.data.iaPlacementAuthorized = true;
    event.value.data.nonLabelConfirmationPolicyAuthorized = true;
    event.value.data.providerUsePolicyAuthorized = true;
    event.value.data.businessPayloadApproved = true;
    event.value.data.persistentRepositoryImplemented = true;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_AI_GUIDANCE_REFERENCE_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝把媒体权限合同越级为全库照片、视频、定位、D-031 保留、原生调用或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-013");
    event.value.data.manualFallbackRequiredForCamera = false;
    event.value.data.taskExplanationBeforeCameraEffect = false;
    event.value.data.lateOutcomeRejected = false;
    event.value.data.cameraPermissionScope = "APP_WIDE_PREWARM";
    event.value.data.photoLibraryPermission = "FULL_LIBRARY";
    event.value.data.videoCapture = "AUTHORIZED";
    event.value.data.locationPermission = "AUTHORIZED";
    event.value.data.mediaRetention = "PERSIST_ORIGINAL";
    event.value.data.mediaPersistence = "AUTHORIZED";
    event.value.data.permissionCopyAuthorized = true;
    event.value.data.nativeApiCalls = 1;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_MEDIA_PERMISSION_ORCHESTRATOR_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把缺少正式 Release 目标和生产报告的禁止能力审计越级为通过", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-014");
    event.value.data.formalSignedReleaseTargetPresent = true;
    event.value.data.currentAuditDisposition = "PASS";
    event.value.data.currentBlockers = [];
    event.value.data.workingTreeAbsenceIsPass = true;
    event.value.data.everyRequiredSurfaceExecuted = true;
    event.value.data.productionArtifactScansExecuted = 27;
    event.value.data.releaseNetworkCapturesExecuted = 3;
    event.value.data.runtimePermissionCapturesExecuted = 1;
    event.value.data.prohibitedCapabilityFindings = "ZERO";
    event.value.data.evidenceTruthVerified = true;
    event.value.data.releaseGateClosed = true;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_PROHIBITED_CAPABILITY_AUDIT_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝把 iOS 17/简中基线扩张成平台形态决定或 F22 Release 通过", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260812-015");
    event.value.data.acceptedMinimumOsVersion = "16.0";
    event.value.data.acceptedPrimaryReleaseLanguage = "en";
    event.value.data.appAuthoredUiLanguageScope = "BILINGUAL";
    event.value.data.acceptedPlatformShapeDecisions = 4;
    event.value.data.platformShapeDecisionIds = ["D-011", "D-016", "D-038", "D-999"];
    event.value.data.platformShapeInferredFromD038OrCurrentDevice = true;
    event.value.data.formalSignedReleaseTargetPresent = true;
    event.value.data.releaseEvidenceExecuted = 25;
    event.value.data.currentAuditDisposition = "PASS";
    event.value.data.currentBlockers = [];
    event.value.data.decisionTruthVerified = true;
    event.value.data.evidenceTruthVerified = true;
    event.value.data.releaseGateClosed = true;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    report,
    "OPS_PLATFORM_LANGUAGE_RELEASE_AUDIT_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-12.jsonl",
  );
});

test("拒绝快照计数漂移与活跃角色集合漂移", async (t) => {
  await t.test("事件计数漂移", () => {
    const report = validateMutation((model) => {
      model.snapshot.metrics.projectEvents += 1;
    });
    assertDiagnostic(
      report,
      "OPS_SNAPSHOT_METRIC_MISMATCH",
      "project-ops/snapshots/current.json.metrics.projectEvents",
    );
  });

  await t.test("唯一 active 不再是 root", () => {
    const report = validateMutation((model) => {
      model.snapshot.agents.find((agent) => agent.id === "root").state = "completed";
      model.snapshot.agents.find((agent) => agent.id !== "root").state = "active";
    });
    assertDiagnostic(
      report,
      "OPS_ACTIVE_AGENT_SET_MISMATCH",
      "project-ops/snapshots/current.json.agents",
    );
  });

  await t.test("出现多个 active", () => {
    const report = validateMutation((model) => {
      model.snapshot.agents.find((agent) => agent.id !== "root").state = "active";
    });
    assertDiagnostic(report, "OPS_ACTIVE_AGENT_SET_MISMATCH");
  });

  await t.test("inactive Agent ID 重复", () => {
    const report = validateMutation((model) => {
      const inactive = model.snapshot.agents.filter((agent) => agent.id !== "root");
      inactive[1].id = inactive[0].id;
    });
    assertDiagnostic(
      report,
      "OPS_DUP_AGENT_ID",
      "project-ops/snapshots/current.json.agents",
    );
  });

  await t.test("inactive Agent ID 为空", () => {
    const report = validateMutation((model) => {
      model.snapshot.agents.find((agent) => agent.id !== "root").id = "";
    });
    assertDiagnostic(report, "OPS_INVALID_AGENT_ID");
  });
});

test("拒绝 Owner intake 被提前关闭或改换选择渠道", async (t) => {
  await t.test("批次误关闭", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.status = "CONFIRMED";
    });
    assertDiagnostic(report, "OPS_OWNER_BATCH_PREMATURELY_CLOSED");
  });

  await t.test("accepted 状态提前改变", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.acceptanceStateChanged = true;
    });
    assertDiagnostic(report, "OPS_OWNER_ACCEPTANCE_STATE_CHANGED");
  });

  await t.test("单项 response 提前终态", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.responses[0].state = "ACCEPTED";
    });
    assertDiagnostic(report, "OPS_OWNER_RESPONSE_FINALIZED");
  });

  await t.test("OI-02 完成后下一题偏离整批回读", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.nextQuestion.id = "oi04_other";
    });
    assertDiagnostic(report, "OPS_OWNER_NEXT_QUESTION_CHANGED");
  });

  await t.test("整批回读不再使用宿主原生 request_user_input", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.nextQuestion.tool = "static_web_form";
    });
    assertDiagnostic(report, "OPS_OWNER_NEXT_QUESTION_CHANNEL_CHANGED");
  });

  await t.test("顶层 Owner intake 渠道不再是原生选择卡", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.channel = "STATIC_WEB_FORM";
    });
    assertDiagnostic(report, "OPS_OWNER_CHANNEL_CHANGED");
  });

  await t.test("OI-03 事实缺失", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.facts = model.ownerIntake.facts.filter(
        (fact) => fact.inputId !== "OI-03",
      );
    });
    assertDiagnostic(report, "OPS_OWNER_OI03_FACT_MISSING");
  });

  await t.test("OI-03 事实重复", () => {
    const report = validateMutation((model) => {
      const fact = model.ownerIntake.facts.find((candidate) => candidate.inputId === "OI-03");
      model.ownerIntake.facts.push(structuredClone(fact));
    });
    assertDiagnostic(report, "OPS_OWNER_OI03_FACT_DUPLICATE");
  });

  await t.test("OI-03 事实伪造 Mac 可用", () => {
    const report = validateMutation((model) => {
      const fact = model.ownerIntake.facts.find((candidate) => candidate.inputId === "OI-03");
      fact.macAvailability = "AVAILABLE";
      fact.nativeIosWorkAuthorized = true;
    });
    assertDiagnostic(report, "OPS_OWNER_OI03_FACT_MISMATCH");
  });

  await t.test("OI-03 被错误写入决定 responses", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.responses.push({
        questionId: "oi03_device_availability",
        decisionId: "D-048",
        optionKey: "iphone_only",
        optionLabel: "只有 iPhone",
        state: "PENDING_BATCH_READBACK",
      });
    });
    assertDiagnostic(report, "OPS_OWNER_OI03_RECORDED_AS_DECISION");
  });

  await t.test("OI-02 事实缺失", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.facts = model.ownerIntake.facts.filter(
        (fact) => fact.inputId !== "OI-02",
      );
    });
    assertDiagnostic(report, "OPS_OWNER_OI02_FACT_MISSING");
  });

  await t.test("OI-02 被伪造为已有 Bundle ID", () => {
    const report = validateMutation((model) => {
      const fact = model.ownerIntake.facts.find((candidate) => candidate.inputId === "OI-02");
      fact.normalizedValue = "EXISTS";
      fact.bundleId = "com.example.nuttie";
    });
    assertDiagnostic(report, "OPS_OWNER_OI02_FACT_MISMATCH");
  });

  await t.test("OI-02 权威事件提前授权正式实现", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260814-001").value.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_OWNER_OI02_EVENT_MISMATCH");
  });

  await t.test("12 项候选中的 D-038 被 D-999 替换", () => {
    const report = validateMutation((model) => {
      const response = model.ownerIntake.responses.find(
        (candidate) => candidate.decisionId === "D-038",
      );
      response.decisionId = "D-999";
    });
    assertDiagnostic(report, "OPS_OWNER_DECISION_SET_MISMATCH");
    assertDiagnostic(report, "OPS_OWNER_DECISION_NOT_CANDIDATE");
  });

  await t.test("D-047 A 到 C 的审计顺序被改写", () => {
    const report = validateMutation((model) => {
      const responses = model.ownerIntake.responses.filter(
        (response) => response.decisionId === "D-047",
      );
      responses[1].optionKey = "A";
    });
    assertDiagnostic(report, "OPS_OWNER_D047_AUDIT_TRAIL_CHANGED");
  });
});

test("拒绝 D-039 在 PX-3 Owner 选择前越级", async (t) => {
  await t.test("提前记录 Owner 选择", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.ownerChoiceRecorded = true;
    });
    assertDiagnostic(report, "OPS_D039_OWNER_CHOICE_PREMATURE");
  });

  await t.test("提前授权正式实现", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D039_IMPLEMENTATION_PREMATURE");
  });

  await t.test("门禁状态越级", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.next = "IMPLEMENTATION_READY";
    });
    assertDiagnostic(report, "OPS_D039_GATE_ESCALATED");
  });

  await t.test("提前进入决定台账", () => {
    const report = validateMutation((model) => {
      model.decisionRegister.decisions.push({
        id: "D-039",
        status: "CANDIDATE",
      });
    });
    assertDiagnostic(report, "OPS_D039_DECISION_REGISTERED_PREMATURELY");
  });

  await t.test("权威门禁事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.subject?.id !== "D-039-PX-2",
      );
    });
    assertDiagnostic(report, "OPS_D039_GATE_SENTINEL_MISSING");
  });

  await t.test("权威门禁事件重复", () => {
    const report = validateMutation((model) => {
      const duplicate = structuredClone(findD039Gate(model));
      duplicate.value.eventId = "EVT-20260805-006";
      duplicate.lineNumber = 6;
      model.events.push(duplicate);
    });
    assertDiagnostic(report, "OPS_D039_GATE_SENTINEL_DUPLICATE");
  });

  await t.test("QA 关闭集合不完整", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.findingsClosed.pop();
    });
    assertDiagnostic(report, "OPS_D039_FINDINGS_SET_MISMATCH");
  });
});

test("拒绝 D-040 在 PX-0 输入关闭前越级或改写审计事实", async (t) => {
  await t.test("首轮 reviewer 临时 PX-1 被误记为 PM 接受", () => {
    const report = validateMutation((model) => {
      findD040InitialFeedback(model).value.data.provisionalStateAcceptedByPm = true;
    });
    assertDiagnostic(report, "OPS_D040_PROVISIONAL_STATE_NOT_NORMALIZED");
  });

  await t.test("首轮权威状态被误升为 PX-1", () => {
    const report = validateMutation((model) => {
      findD040InitialFeedback(model).value.data.authoritativeState = "PX-1_COMPLETE";
    });
    assertDiagnostic(report, "OPS_D040_PROVISIONAL_STATE_NOT_NORMALIZED");
  });

  await t.test("首轮审查回执缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260806-002",
      );
    });
    assertDiagnostic(report, "OPS_D040_INITIAL_FEEDBACK_MISSING");
  });

  await t.test("delta 最终回执缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260806-005",
      );
    });
    assertDiagnostic(report, "OPS_D040_FINAL_SENTINEL_MISSING");
  });

  await t.test("delta 最终回执重复", () => {
    const report = validateMutation((model) => {
      const duplicate = structuredClone(findD040FinalFeedback(model));
      duplicate.value.eventId = "EVT-20260806-006";
      duplicate.lineNumber = 6;
      model.events.push(duplicate);
    });
    assertDiagnostic(report, "OPS_D040_FINAL_SENTINEL_DUPLICATE");
  });

  await t.test("状态越级到 PX-1", () => {
    const report = validateMutation((model) => {
      findD040FinalFeedback(model).value.data.recommendedState = "PX-1_COMPLETE";
    });
    assertDiagnostic(report, "OPS_D040_STATE_ESCALATED");
  });

  for (const field of [
    "px1Authorized",
    "px2Authorized",
    "ownerReviewAuthorized",
    "ownerChoiceRecorded",
    "decisionAcceptedRecorded",
    "formalImplementationAuthorized",
  ]) {
    await t.test(`${field} 被提前设为 true`, () => {
      const report = validateMutation((model) => {
        findD040FinalFeedback(model).value.data[field] = true;
      });
      assertDiagnostic(
        report,
        "OPS_D040_AUTHORIZATION_PREMATURE",
        `project-ops/events/2026-08-06.jsonl:5.data.${field}`,
      );
    });
  }

  await t.test("D-040 抢占 OI-03 顺序", () => {
    const report = validateMutation((model) => {
      findD040FinalFeedback(model).value.data.oi03RemainsNext = false;
    });
    assertDiagnostic(report, "OPS_D040_OI03_ORDER_CHANGED");
  });

  await t.test("首轮问题关闭集合不完整", () => {
    const report = validateMutation((model) => {
      findD040FinalFeedback(model).value.data.closedFindings.P2 = 3;
    });
    assertDiagnostic(report, "OPS_D040_FINDINGS_MISMATCH");
  });

  await t.test("提前进入决定台账", () => {
    const report = validateMutation((model) => {
      model.decisionRegister.decisions.push({ id: "D-040", status: "CANDIDATE" });
    });
    assertDiagnostic(report, "OPS_D040_DECISION_REGISTERED_PREMATURELY");
  });

  await t.test("提前写入 Owner intake", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.responses.push({ decisionId: "D-040" });
    });
    assertDiagnostic(report, "OPS_D040_OWNER_RESPONSE_PREMATURELY_RECORDED");
  });
});

test("拒绝改写 D-040 输入研究、独立审查与 Owner 门禁归档", async (t) => {
  await t.test("公式首轮 0/2/1 findings 漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-015").value.data.findings.P2 = 1;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_FORMULA_AUDIT_MISMATCH");
  });

  await t.test("公式审查回执接收方被改写", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-015").value.subject.id = "owner";
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_FORMULA_AUDIT_MISMATCH");
  });

  await t.test("公式最终 remaining 不再为 0/0/0", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-019").value.data.remainingFindings.P3 = 1;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_FORMULA_AUDIT_MISMATCH");
  });

  await t.test("治理首轮 0/4/1 findings 漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-017").value.data.findings.P3 = 0;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_GOVERNANCE_AUDIT_MISMATCH");
  });

  await t.test("治理中间轮 remaining 不再为 0/4/0", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-021").value.data.remainingFindings.P2 = 3;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_GOVERNANCE_AUDIT_MISMATCH");
  });

  await t.test("治理最终 remaining 不再为 0/0/0", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-023").value.data.remainingFindings.P2 = 1;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_GOVERNANCE_AUDIT_MISMATCH");
  });

  await t.test("17 个草案问题被提前分配权威 ID", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.draftQuestionIdsAllocated = true;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_DRAFT_QUESTIONS_CHANGED");
  });

  await t.test("研究工件状态越级", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.authoritativeState = "PX-1_COMPLETE";
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_STATE_ESCALATED");
  });

  await t.test("研究工件创建者被改写", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.actor.id = "ops_verifier";
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_ARTIFACT_ENVELOPE_MISMATCH");
  });

  await t.test("研究工件提前授权 Owner 评审", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.ownerReviewAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_AUTHORIZATION_PREMATURE");
  });

  await t.test("研究工件抢占 OI-03", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.oi03RemainsNext = false;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_OI03_ORDER_CHANGED");
  });

  await t.test("研究工件提交证据漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260806-024").value.data.lineCount = 390;
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_ARTIFACT_EVIDENCE_MISMATCH");
  });

  await t.test("研究工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260806-024",
      );
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_ARTIFACT_MISSING");
  });

  await t.test("研究工件事件重复", () => {
    const report = validateMutation((model) => {
      const duplicate = structuredClone(findEvent(model, "EVT-20260806-024"));
      duplicate.value.eventId = "EVT-20260806-025";
      duplicate.lineNumber = 25;
      model.events.push(duplicate);
    });
    assertDiagnostic(report, "OPS_D040_RESEARCH_ARTIFACT_DUPLICATE");
  });
});

test("CLI 对通过、一致性失败和 JSONL 解析失败使用稳定退出码", () => {
  const valid = spawnSync(process.execPath, [VALIDATOR_PATH, "--workspace", WORKSPACE_ROOT], {
    encoding: "utf8",
  });
  assert.equal(valid.status, 0, valid.stderr);
  assert.equal(JSON.parse(valid.stdout).ok, true);

  const inconsistentRoot = copyValidationFixture();
  const schemaInvalidRoot = copyValidationFixture();
  const malformedRoot = copyValidationFixture();
  try {
    const snapshotPath = path.join(inconsistentRoot, "project-ops", "snapshots", "current.json");
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    snapshot.metrics.projectEvents += 1;
    fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    const inconsistent = spawnSync(
      process.execPath,
      [VALIDATOR_PATH, "--workspace", inconsistentRoot],
      { encoding: "utf8" },
    );
    assert.equal(inconsistent.status, 1, inconsistent.stdout);
    assert.equal(JSON.parse(inconsistent.stderr).ok, false);

    const ownerIntakePath = path.join(schemaInvalidRoot, "project-ops", "owner-intake.json");
    const ownerIntake = JSON.parse(fs.readFileSync(ownerIntakePath, "utf8"));
    ownerIntake.unknown = true;
    fs.writeFileSync(ownerIntakePath, `${JSON.stringify(ownerIntake, null, 2)}\n`, "utf8");
    const schemaInvalid = spawnSync(
      process.execPath,
      [VALIDATOR_PATH, "--workspace", schemaInvalidRoot],
      { encoding: "utf8" },
    );
    assert.equal(schemaInvalid.status, 1, schemaInvalid.stdout);
    assert.ok(
      JSON.parse(schemaInvalid.stderr).diagnostics.some(
        (diagnostic) => diagnostic.code === "OPS_SCHEMA_INSTANCE_INVALID",
      ),
    );

    const messagePath = path.join(
      malformedRoot,
      "project-ops",
      "messages",
      "project-manager.jsonl",
    );
    fs.appendFileSync(messagePath, "{not-json}\n", "utf8");
    const malformed = spawnSync(
      process.execPath,
      [VALIDATOR_PATH, "--workspace", malformedRoot],
      { encoding: "utf8" },
    );
    assert.equal(malformed.status, 2, malformed.stdout);
    assert.equal(JSON.parse(malformed.stderr).error.code, "OPS_JSONL_PARSE_ERROR");
  } finally {
    fs.rmSync(inconsistentRoot, { recursive: true, force: true });
    fs.rmSync(schemaInvalidRoot, { recursive: true, force: true });
    fs.rmSync(malformedRoot, { recursive: true, force: true });
  }
});

test("loader 将 JSON 解析错误标记为读取失败而非一致性失败", () => {
  const tempRoot = copyValidationFixture();
  try {
    fs.writeFileSync(path.join(tempRoot, "project-ops", "owner-intake.json"), "{bad-json}\n");
    assert.throws(
      () => loadProjectOps(tempRoot),
      (error) =>
        error instanceof ProjectOpsLoadError && error.code === "OPS_JSON_PARSE_ERROR",
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("loader 拒绝 JSONL 中间空行", () => {
  const tempRoot = copyValidationFixture();
  try {
    const messagePath = path.join(
      tempRoot,
      "project-ops",
      "messages",
      "project-manager.jsonl",
    );
    fs.appendFileSync(messagePath, "\n{}\n", "utf8");
    assert.throws(
      () => loadProjectOps(tempRoot),
      (error) =>
        error instanceof ProjectOpsLoadError && error.code === "OPS_JSONL_EMPTY_LINE",
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
