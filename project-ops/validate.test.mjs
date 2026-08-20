import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  PHASE0_2026_08_21_D071_CARD_SPEC,
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
  assert.equal(report.baseline, PHASE0_2026_08_21_D071_CARD_SPEC.id);
  assert.deepEqual(report.schemaValidation, {
    profile: "DRAFT_2020_12_PROJECT_SUBSET_V1",
    schemasChecked: 5,
    instancesValidated: 300,
  });
  assert.equal(report.counts.schemas, 5);
  assert.equal(report.counts.decisions, 32);
  assert.equal(report.counts.events, 181);
  assert.equal(report.counts.messages, 116);
  assert.equal(report.counts.resolvedResponses, 72);
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
  const barcodeLookupEvent = findEvent(VALID_MODEL, "EVT-20260813-004");
  assert.equal(barcodeLookupEvent.value.subject.id, "barcode-lookup-orchestrator-contract");
  assert.equal(barcodeLookupEvent.value.data.featureId, "F03");
  assert.deepEqual(barcodeLookupEvent.value.data.exactGtinLengths, [8, 12, 13, 14]);
  assert.equal(barcodeLookupEvent.value.data.leadingZeroPreserved, true);
  assert.equal(barcodeLookupEvent.value.data.localExactLookupOnly, true);
  assert.equal(barcodeLookupEvent.value.data.trustedCatalogEvidenceBound, true);
  assert.equal(barcodeLookupEvent.value.data.singleCandidateRequiresExplicitSelection, true);
  assert.equal(barcodeLookupEvent.value.data.multipleSourceCandidatesRemainSeparate, true);
  assert.equal(barcodeLookupEvent.value.data.callerOwnedFoodReview, true);
  assert.equal(barcodeLookupEvent.value.data.callerOwnedManualCreation, true);
  assert.equal(barcodeLookupEvent.value.data.cameraPermissionHandling, "EXTERNAL_F21_ORCHESTRATOR");
  assert.equal(barcodeLookupEvent.value.data.fuzzyBarcodeRecognitionAuthorized, false);
  assert.equal(barcodeLookupEvent.value.data.coveragePromiseAuthorized, false);
  assert.equal(barcodeLookupEvent.value.data.catalogMutationAuthorized, false);
  assert.equal(barcodeLookupEvent.value.data.diaryMutationAuthorized, false);
  assert.equal(barcodeLookupEvent.value.data.aiFallbackAuthorized, false);
  assert.equal(barcodeLookupEvent.value.data.nativeApiCalls, 0);
  assert.equal(barcodeLookupEvent.value.data.realNetworkRequests, 0);
  assert.equal(barcodeLookupEvent.value.data.formalImplementationAuthorized, false);
  const importSafetyEvent = findEvent(VALID_MODEL, "EVT-20260813-005");
  assert.equal(importSafetyEvent.value.subject.id, "import-safety-preflight-contract");
  assert.equal(importSafetyEvent.value.data.featureId, "F19");
  assert.equal(importSafetyEvent.value.data.topLevelTests, 19);
  assert.equal(importSafetyEvent.value.data.fullSuitePassed, 676);
  assert.equal(importSafetyEvent.value.data.customLimitsCanOnlyTighten, true);
  assert.equal(importSafetyEvent.value.data.strictPlainJsonBoundary, true);
  assert.equal(importSafetyEvent.value.data.nfcAndCaseCollisionRejected, true);
  assert.equal(importSafetyEvent.value.data.manifestEntrySetExact, true);
  assert.equal(importSafetyEvent.value.data.importSubjectFingerprintBound, true);
  assert.equal(importSafetyEvent.value.data.verificationEvidenceSubjectBound, true);
  assert.equal(importSafetyEvent.value.data.verificationTruth, "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS");
  assert.equal(importSafetyEvent.value.data.activeStateFingerprintBound, true);
  assert.equal(importSafetyEvent.value.data.activationStrategy, "PENDING_D026_D027_D030");
  assert.equal(importSafetyEvent.value.data.activationCommitted, false);
  assert.equal(importSafetyEvent.value.data.signatureAlgorithmSelected, false);
  assert.equal(importSafetyEvent.value.data.backupCryptoProfileSelected, false);
  assert.equal(importSafetyEvent.value.data.restoreModeSelected, false);
  assert.equal(importSafetyEvent.value.data.filesystemReads, 0);
  assert.equal(importSafetyEvent.value.data.filesystemWrites, 0);
  assert.equal(importSafetyEvent.value.data.nativeApiCalls, 0);
  assert.equal(importSafetyEvent.value.data.realNetworkRequests, 0);
  assert.equal(importSafetyEvent.value.data.formalImplementationAuthorized, false);
  const foodInsightEvent = findEvent(VALID_MODEL, "EVT-20260813-006");
  assert.equal(foodInsightEvent.value.subject.id, "food-insight-availability-contract");
  assert.equal(foodInsightEvent.value.data.featureId, "F09");
  assert.equal(foodInsightEvent.value.data.topLevelTests, 14);
  assert.equal(foodInsightEvent.value.data.fullSuitePassed, 691);
  assert.equal(foodInsightEvent.value.data.trustedLocalNutritionSnapshotOnly, true);
  assert.equal(foodInsightEvent.value.data.approvedNutrientFieldCount, 7);
  assert.equal(foodInsightEvent.value.data.nutritionFactsAvailable, true);
  assert.equal(foodInsightEvent.value.data.missingNotZero, true);
  assert.equal(foodInsightEvent.value.data.traceWithoutNumericValue, true);
  assert.equal(foodInsightEvent.value.data.estimatedSourceVisible, true);
  assert.equal(foodInsightEvent.value.data.packCatalogTrustRequired, true);
  assert.deepEqual(foodInsightEvent.value.data.advancedCapabilityIds, ["HEALTH_SCORE", "MICRONUTRIENT_LABELS", "HEALTH_RISKS", "HEALTH_BENEFITS"]);
  assert.deepEqual(foodInsightEvent.value.data.publicEvidenceIds, ["FOOD-04", "FOOD-05", "FOOD-06", "FOOD-07"]);
  assert.equal(foodInsightEvent.value.data.advancedCapabilityScopePreserved, true);
  assert.equal(foodInsightEvent.value.data.advancedContentExposure, "NONE");
  assert.equal(foodInsightEvent.value.data.healthScoreAlgorithmAuthorized, false);
  assert.equal(foodInsightEvent.value.data.micronutrientFieldSetAuthorized, false);
  assert.equal(foodInsightEvent.value.data.riskBenefitGenerationAuthorized, false);
  assert.equal(foodInsightEvent.value.data.medicalConclusionAuthorized, false);
  assert.equal(foodInsightEvent.value.data.personalizedClaimAuthorized, false);
  assert.equal(foodInsightEvent.value.data.aiGenerationAuthorized, false);
  assert.equal(foodInsightEvent.value.data.automaticProfileUseAuthorized, false);
  assert.equal(foodInsightEvent.value.data.observableEffects, 0);
  assert.equal(foodInsightEvent.value.data.nativeApiCalls, 0);
  assert.equal(foodInsightEvent.value.data.realNetworkRequests, 0);
  assert.equal(foodInsightEvent.value.data.formalImplementationAuthorized, false);
  const dataPackPreauthEvent = findEvent(VALID_MODEL, "EVT-20260813-007");
  assert.equal(dataPackPreauthEvent.value.subject.id, "data-pack-preauth-contract");
  assert.equal(dataPackPreauthEvent.value.data.featureId, "F03");
  assert.equal(dataPackPreauthEvent.value.data.topLevelTests, 20);
  assert.equal(dataPackPreauthEvent.value.data.fullSuitePassed, 704);
  assert.equal(dataPackPreauthEvent.value.data.approvedDefaultLimitsBound, true);
  assert.equal(dataPackPreauthEvent.value.data.customLimitsCanOnlyTighten, true);
  assert.equal(dataPackPreauthEvent.value.data.preAuthObjectKeysCounted, true);
  assert.equal(dataPackPreauthEvent.value.data.preAuthStringBudgetBound, true);
  assert.equal(dataPackPreauthEvent.value.data.strictPassiveJsonBoundary, true);
  assert.equal(dataPackPreauthEvent.value.data.regularFileOnly, true);
  assert.equal(dataPackPreauthEvent.value.data.nfcAndCaseCollisionRejected, true);
  assert.equal(dataPackPreauthEvent.value.data.manifestEntrySetExact, true);
  assert.equal(dataPackPreauthEvent.value.data.manifestBytesBound, true);
  assert.equal(dataPackPreauthEvent.value.data.totalBytesBound, true);
  assert.equal(dataPackPreauthEvent.value.data.provenanceManifestIdentityBound, true);
  assert.equal(dataPackPreauthEvent.value.data.provenanceIdentitiesUnique, true);
  assert.equal(dataPackPreauthEvent.value.data.transformVersionBound, true);
  assert.equal(dataPackPreauthEvent.value.data.transformStepIdsUnique, true);
  assert.equal(dataPackPreauthEvent.value.data.packSubjectFingerprintBound, true);
  assert.equal(dataPackPreauthEvent.value.data.verificationEvidenceSubjectBound, true);
  assert.equal(dataPackPreauthEvent.value.data.verificationTruth, "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS");
  assert.equal(dataPackPreauthEvent.value.data.signatureProfile, "PENDING_D026");
  assert.equal(dataPackPreauthEvent.value.data.activationStrategy, "PENDING_APPROVED_STRATEGY");
  assert.equal(dataPackPreauthEvent.value.data.activationCommitted, false);
  assert.equal(dataPackPreauthEvent.value.data.signatureAlgorithmSelected, false);
  assert.equal(dataPackPreauthEvent.value.data.trustRootSelected, false);
  assert.equal(dataPackPreauthEvent.value.data.licenseDistributionAuthorized, false);
  assert.equal(dataPackPreauthEvent.value.data.filesystemReads, 0);
  assert.equal(dataPackPreauthEvent.value.data.filesystemWrites, 0);
  assert.equal(dataPackPreauthEvent.value.data.nativeApiCalls, 0);
  assert.equal(dataPackPreauthEvent.value.data.realNetworkRequests, 0);
  assert.equal(dataPackPreauthEvent.value.data.formalImplementationAuthorized, false);
  const restoreReconcileEvent = findEvent(VALID_MODEL, "EVT-20260813-008");
  assert.equal(restoreReconcileEvent.value.subject.id, "restore-reconcile-observation-contract");
  assert.equal(restoreReconcileEvent.value.data.featureId, "F19");
  assert.equal(restoreReconcileEvent.value.data.topLevelTests, 21);
  assert.equal(restoreReconcileEvent.value.data.fullSuitePassed, 718);
  assert.equal(restoreReconcileEvent.value.data.structuredGenerationObservations, true);
  assert.equal(restoreReconcileEvent.value.data.generationObservationFingerprintBound, true);
  assert.equal(restoreReconcileEvent.value.data.restoreObservationFingerprintBound, true);
  assert.equal(restoreReconcileEvent.value.data.restoreIntentFingerprintBound, true);
  assert.equal(restoreReconcileEvent.value.data.strictPlainBoundary, true);
  assert.equal(restoreReconcileEvent.value.data.generationObservationBudgetBound, true);
  assert.equal(restoreReconcileEvent.value.data.keyUnavailableFailsClosed, true);
  assert.equal(restoreReconcileEvent.value.data.intentKeepsWritesClosed, true);
  assert.equal(restoreReconcileEvent.value.data.actionPlanObservationBound, true);
  assert.equal(restoreReconcileEvent.value.data.actionPlanEffectsCommitted, false);
  assert.equal(restoreReconcileEvent.value.data.reobservationRequiredBeforeWrites, true);
  assert.equal(restoreReconcileEvent.value.data.cleanupAuthorized, false);
  assert.equal(restoreReconcileEvent.value.data.assertionTruth, "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS");
  assert.equal(restoreReconcileEvent.value.data.cryptoProfile, "PENDING_D027");
  assert.equal(restoreReconcileEvent.value.data.restoreMode, "PENDING_D030");
  assert.equal(restoreReconcileEvent.value.data.plaintextExport, "PENDING_D035");
  assert.equal(restoreReconcileEvent.value.data.cryptographicVerificationPerformed, false);
  assert.equal(restoreReconcileEvent.value.data.filesystemReads, 0);
  assert.equal(restoreReconcileEvent.value.data.filesystemWrites, 0);
  assert.equal(restoreReconcileEvent.value.data.keychainReads, 0);
  assert.equal(restoreReconcileEvent.value.data.keychainWrites, 0);
  assert.equal(restoreReconcileEvent.value.data.nativeApiCalls, 0);
  assert.equal(restoreReconcileEvent.value.data.realNetworkRequests, 0);
  assert.equal(restoreReconcileEvent.value.data.formalImplementationAuthorized, false);
  const wipeOutcomeEvent = findEvent(VALID_MODEL, "EVT-20260813-009");
  assert.equal(wipeOutcomeEvent.value.subject.id, "wipe-outcome-evidence-contract");
  assert.equal(wipeOutcomeEvent.value.data.featureId, "F18");
  assert.equal(wipeOutcomeEvent.value.data.topLevelTests, 41);
  assert.equal(wipeOutcomeEvent.value.data.fullSuitePassed, 722);
  assert.equal(wipeOutcomeEvent.value.data.strictPassiveOutcomeBoundary, true);
  assert.equal(wipeOutcomeEvent.value.data.outcomeResourceBudgetBound, true);
  assert.equal(wipeOutcomeEvent.value.data.evidenceIdentityRequired, true);
  assert.equal(wipeOutcomeEvent.value.data.effectFingerprintBound, true);
  assert.equal(wipeOutcomeEvent.value.data.observationFingerprintBound, true);
  assert.equal(wipeOutcomeEvent.value.data.outcomeFingerprintBound, true);
  assert.equal(wipeOutcomeEvent.value.data.crossEffectReplayRejected, true);
  assert.equal(wipeOutcomeEvent.value.data.legacyNakedOutcomeRejected, true);
  assert.equal(wipeOutcomeEvent.value.data.statusErrorSemanticsBound, true);
  assert.equal(wipeOutcomeEvent.value.data.assertionTruth, "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS");
  assert.equal(wipeOutcomeEvent.value.data.externalFilesScope, "OUT_OF_SCOPE");
  assert.equal(wipeOutcomeEvent.value.data.realContainerEmptinessVerified, false);
  assert.equal(wipeOutcomeEvent.value.data.realSecretInvalidationVerified, false);
  assert.equal(wipeOutcomeEvent.value.data.realNotificationRemovalVerified, false);
  assert.equal(wipeOutcomeEvent.value.data.filesystemReads, 0);
  assert.equal(wipeOutcomeEvent.value.data.filesystemWrites, 0);
  assert.equal(wipeOutcomeEvent.value.data.keychainReads, 0);
  assert.equal(wipeOutcomeEvent.value.data.keychainWrites, 0);
  assert.equal(wipeOutcomeEvent.value.data.nativeApiCalls, 0);
  assert.equal(wipeOutcomeEvent.value.data.realNetworkRequests, 0);
  assert.equal(wipeOutcomeEvent.value.data.formalImplementationAuthorized, false);
  const aiPolicyEvent = findEvent(VALID_MODEL, "EVT-20260813-010");
  assert.equal(aiPolicyEvent.value.subject.id, "ai-provider-policy-authorization-contract");
  assert.deepEqual(aiPolicyEvent.value.data.featureIds, ["F01", "F02"]);
  assert.equal(aiPolicyEvent.value.data.topLevelTests, 22);
  assert.equal(aiPolicyEvent.value.data.fullSuitePassed, 739);
  assert.equal(aiPolicyEvent.value.data.strictProviderPolicyProfile, true);
  assert.equal(aiPolicyEvent.value.data.policyEvidenceReferencesBound, true);
  assert.equal(aiPolicyEvent.value.data.riskSemanticsBound, true);
  assert.equal(aiPolicyEvent.value.data.policyValidityWindowBound, true);
  assert.equal(aiPolicyEvent.value.data.exactRequestSubjectBound, true);
  assert.equal(aiPolicyEvent.value.data.providerOriginModelPayloadProfileRegionBound, true);
  assert.equal(aiPolicyEvent.value.data.subjectFingerprintBound, true);
  assert.equal(aiPolicyEvent.value.data.profileFingerprintBound, true);
  assert.equal(aiPolicyEvent.value.data.authorizationFingerprintBound, true);
  assert.equal(aiPolicyEvent.value.data.appleProhibitedUseBlocked, true);
  assert.equal(aiPolicyEvent.value.data.labelPreviewSubjectBound, true);
  assert.equal(aiPolicyEvent.value.data.legacyPlainAllowRejected, true);
  assert.equal(aiPolicyEvent.value.data.d053DecisionState, "CANDIDATE");
  assert.equal(aiPolicyEvent.value.data.d053Authorization, "NOT_AUTHORIZED");
  assert.equal(aiPolicyEvent.value.data.matchingAllowStillBlocked, true);
  assert.equal(aiPolicyEvent.value.data.policyTruth, "CALLER_POLICY_ASSERTION_NOT_PROVIDER_TRUTH");
  assert.equal(aiPolicyEvent.value.data.networkRequests, 0);
  assert.equal(aiPolicyEvent.value.data.authorizationReads, 0);
  assert.equal(aiPolicyEvent.value.data.sensitiveBodySerializations, 0);
  assert.equal(aiPolicyEvent.value.data.keychainReads, 0);
  assert.equal(aiPolicyEvent.value.data.businessWrites, 0);
  assert.equal(aiPolicyEvent.value.data.systemClockRead, false);
  assert.equal(aiPolicyEvent.value.data.nativeImplementationAuthorized, false);
  assert.equal(aiPolicyEvent.value.data.formalImplementationAuthorized, false);
  const aiResponseEvent = findEvent(VALID_MODEL, "EVT-20260814-014");
  assert.equal(aiResponseEvent.value.subject.id, "ai-response-contract");
  assert.deepEqual(aiResponseEvent.value.data.featureIds, ["F01", "F02"]);
  assert.equal(aiResponseEvent.value.data.topLevelTests, 16);
  assert.equal(aiResponseEvent.value.data.fullSuitePassed, 752);
  assert.equal(aiResponseEvent.value.data.untrustedResponseBoundary, true);
  assert.equal(aiResponseEvent.value.data.duplicateJsonKeysRejected, true);
  assert.equal(aiResponseEvent.value.data.trailingDataRejected, true);
  assert.equal(aiResponseEvent.value.data.nonEmptyCandidateSetRequired, true);
  assert.equal(aiResponseEvent.value.data.exactCandidateSchema, true);
  assert.equal(aiResponseEvent.value.data.normalizedSafeLabels, true);
  assert.equal(aiResponseEvent.value.data.resourceBudgetsBound, true);
  assert.equal(aiResponseEvent.value.data.unsafeNumbersRejected, true);
  assert.equal(aiResponseEvent.value.data.semanticResponseFingerprintBound, true);
  assert.equal(aiResponseEvent.value.data.passiveStateSnapshotBound, true);
  assert.equal(aiResponseEvent.value.data.errorContentNotReflected, true);
  assert.equal(aiResponseEvent.value.data.candidateAuthority, "UNCONFIRMED_EDITABLE_REFERENCE_ONLY");
  assert.equal(aiResponseEvent.value.data.schemaAuthority, "TEST_CONTRACT_NOT_FORMAL_PROVIDER_API");
  assert.equal(aiResponseEvent.value.data.persistenceAuthorized, false);
  assert.equal(aiResponseEvent.value.data.policyAuthorizationGranted, false);
  assert.equal(aiResponseEvent.value.data.keychainReads, 0);
  assert.equal(aiResponseEvent.value.data.sensitiveBodySerializations, 0);
  assert.equal(aiResponseEvent.value.data.realNetworkRequests, 0);
  assert.equal(aiResponseEvent.value.data.filesystemWrites, 0);
  assert.equal(aiResponseEvent.value.data.businessWrites, 0);
  assert.equal(aiResponseEvent.value.data.systemClockRead, false);
  assert.equal(aiResponseEvent.value.data.nativeImplementationAuthorized, false);
  assert.equal(aiResponseEvent.value.data.formalImplementationAuthorized, false);
  const aiCandidateResponseV2Event = findEvent(VALID_MODEL, "EVT-20260814-015");
  assert.equal(aiCandidateResponseV2Event.value.subject.id, "ai-candidate-response-evidence-v2-contract");
  assert.deepEqual(aiCandidateResponseV2Event.value.data.featureIds, ["F01", "F02"]);
  assert.equal(aiCandidateResponseV2Event.value.data.topLevelTests, 22);
  assert.equal(aiCandidateResponseV2Event.value.data.fullSuitePassed, 755);
  assert.equal(aiCandidateResponseV2Event.value.data.stateSchemaVersion, "AI_CANDIDATE_CONFIRMATION_STATE_V2");
  assert.equal(aiCandidateResponseV2Event.value.data.reviewEvidenceSchemaVersion, "AI_CANDIDATE_REVIEW_EVIDENCE_V2");
  assert.equal(aiCandidateResponseV2Event.value.data.confirmedRecordSchemaVersion, "AI_CONFIRMED_RECORD_V2");
  assert.equal(aiCandidateResponseV2Event.value.data.sourceEvidenceSchemaVersion, "AI_CONFIRMED_SOURCE_EVIDENCE_V2");
  assert.equal(aiCandidateResponseV2Event.value.data.commandSchemaVersion, "AI_CONFIRMED_RECORD_COMMAND_V2");
  assert.equal(aiCandidateResponseV2Event.value.data.receiptSchemaVersion, "AI_CONFIRMED_RECORD_RECEIPT_V2");
  assert.equal(aiCandidateResponseV2Event.value.data.completeResponseFingerprintBound, true);
  assert.equal(aiCandidateResponseV2Event.value.data.unselectedCandidateChangeDetected, true);
  assert.equal(aiCandidateResponseV2Event.value.data.responseFingerprintBoundToReview, true);
  assert.equal(aiCandidateResponseV2Event.value.data.responseFingerprintPersistedAsEvidence, true);
  assert.equal(aiCandidateResponseV2Event.value.data.candidateFingerprintStillBound, true);
  assert.equal(aiCandidateResponseV2Event.value.data.confirmedValueFingerprintStillBound, true);
  assert.equal(aiCandidateResponseV2Event.value.data.legacyV1EvidenceRejected, true);
  assert.equal(aiCandidateResponseV2Event.value.data.rawResponsePersisted, false);
  assert.equal(aiCandidateResponseV2Event.value.data.candidateContentPersisted, false);
  assert.equal(aiCandidateResponseV2Event.value.data.automaticDiaryOrTargetMutation, false);
  assert.equal(aiCandidateResponseV2Event.value.data.persistentRepositoryImplemented, false);
  assert.equal(aiCandidateResponseV2Event.value.data.systemClockRead, false);
  assert.equal(aiCandidateResponseV2Event.value.data.realNetworkRequests, 0);
  assert.equal(aiCandidateResponseV2Event.value.data.nativeImplementationAuthorized, false);
  assert.equal(aiCandidateResponseV2Event.value.data.formalImplementationAuthorized, false);
  const aiRequestEvidenceContextV2Event = findEvent(VALID_MODEL, "EVT-20260814-016");
  assert.equal(aiRequestEvidenceContextV2Event.value.subject.id, "ai-request-evidence-context-v2-contract");
  assert.deepEqual(aiRequestEvidenceContextV2Event.value.data.featureIds, ["F01", "F02", "F16"]);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.sharedContextTopLevelTests, 7);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.candidateTopLevelTests, 22);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.guidanceTopLevelTests, 12);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.fullSuitePassed, 763);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.contextSchemaVersion, "AI_REQUEST_EVIDENCE_CONTEXT_V2");
  assert.equal(aiRequestEvidenceContextV2Event.value.data.candidateStateSchemaVersion, "AI_CANDIDATE_CONFIRMATION_STATE_V3");
  assert.equal(aiRequestEvidenceContextV2Event.value.data.confirmedRecordSchemaVersion, "AI_CONFIRMED_RECORD_V3");
  assert.equal(aiRequestEvidenceContextV2Event.value.data.guidanceStateSchemaVersion, "AI_GUIDANCE_REFERENCE_STATE_V2");
  assert.equal(aiRequestEvidenceContextV2Event.value.data.exactPolicySubjectBound, true);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.completePolicyProfileBound, true);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.d053AuthorizationEvidenceBound, true);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.policyCheckEvidenceBound, true);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.onlyRemainingPolicyGate, "D053_NOT_AUTHORIZED");
  assert.equal(aiRequestEvidenceContextV2Event.value.data.transportOccurrence, "NOT_ESTABLISHED");
  assert.equal(aiRequestEvidenceContextV2Event.value.data.sendAuthorization, "NOT_GRANTED");
  assert.equal(aiRequestEvidenceContextV2Event.value.data.legacyRequestContextV1Rejected, true);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.legacyCandidateV1V2Rejected, true);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.legacyGuidanceV1Rejected, true);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.keychainReads, 0);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.sensitiveBodySerializations, 0);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.realNetworkRequests, 0);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.nativeImplementationAuthorized, false);
  assert.equal(aiRequestEvidenceContextV2Event.value.data.formalImplementationAuthorized, false);
  const aiConfigurationPolicyPreflightEvent = findEvent(VALID_MODEL, "EVT-20260814-017");
  assert.equal(aiConfigurationPolicyPreflightEvent.value.subject.id, "ai-configuration-policy-preflight-contract");
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.topLevelTests, 8);
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.fullSuitePassed, 777);
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.configurationEvidenceSchemaVersion, "AI_ACTIVE_CONFIGURATION_EVIDENCE_V1");
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.baseUrlOriginModelCompared, true);
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.exactConfigurationMatchAuthorizesSend, false);
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.providerIdentityBoundToConfiguration, false);
  assert.deepEqual(aiConfigurationPolicyPreflightEvent.value.data.requiredBlockers, [
    "PROVIDER_IDENTITY_NOT_BOUND_TO_CONFIGURATION",
    "D033_CONFIRMATION_SCOPE_NOT_EVALUATED",
    "D034_RESOURCE_PROFILE_NOT_AUTHORIZED",
    "D036_TRANSPORT_PROFILE_NOT_AUTHORIZED",
    "D053_NOT_AUTHORIZED",
  ]);
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.sendAuthorization, "NOT_GRANTED");
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.credentialMaterialReads, 0);
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.realNetworkRequests, 0);
  assert.equal(aiConfigurationPolicyPreflightEvent.value.data.formalImplementationAuthorized, false);
  const sdk57JsSpikeVerificationEvent = findEvent(VALID_MODEL, "EVT-20260814-018");
  assert.equal(sdk57JsSpikeVerificationEvent.value.subject.id, "sdk57-js-spike-verification");
  assert.equal(sdk57JsSpikeVerificationEvent.value.type, "TASK_COMPLETED");
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.decisionStatus, "CANDIDATE");
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.nodeVersion, "22.13.0");
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.pnpmVersion, "11.18.0");
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.lockfileFrozen, true);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.expoDoctorChecksPassed, 20);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.androidBundleModules, 1232);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.repositoryFullSuitePassed, 778);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.projectOpsValidationTestsPassed, 117);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.nativeDirectoriesGenerated, false);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.prebuildRun, false);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.nativeIosEvidence, false);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.formalRootProjectAuthorized, false);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.decisionAccepted, false);
  assert.equal(sdk57JsSpikeVerificationEvent.value.data.ownerSecondActionStillRequired, true);
  const sdk57JsDependencySurfaceEvent = findEvent(VALID_MODEL, "EVT-20260814-019");
  assert.equal(sdk57JsDependencySurfaceEvent.value.subject.id, "sdk57-js-dependency-surface-verification");
  assert.deepEqual(sdk57JsDependencySurfaceEvent.value.data.requiredPackages, [
    "expo-sqlite",
    "expo-secure-store",
    "expo-camera",
    "expo-notifications",
    "react-native-reanimated",
    "react-native-worklets",
  ]);
  assert.equal(sdk57JsDependencySurfaceEvent.value.data.typescriptResolutionPassed, true);
  assert.equal(sdk57JsDependencySurfaceEvent.value.data.metroResolutionPassed, true);
  assert.equal(sdk57JsDependencySurfaceEvent.value.data.androidBundleModules, 1652);
  assert.equal(sdk57JsDependencySurfaceEvent.value.data.repositoryFullSuitePassed, 779);
  assert.equal(sdk57JsDependencySurfaceEvent.value.data.projectOpsValidationTestsPassed, 118);
  assert.equal(sdk57JsDependencySurfaceEvent.value.data.nativeApiCalls, 0);
  assert.equal(sdk57JsDependencySurfaceEvent.value.data.nativeRuntimeEvidence, false);
  assert.equal(sdk57JsDependencySurfaceEvent.value.data.decisionAccepted, false);
  const sdk57IosJavaScriptExportEvent = findEvent(VALID_MODEL, "EVT-20260814-020");
  assert.equal(sdk57IosJavaScriptExportEvent.value.subject.id, "sdk57-ios-javascript-export-verification");
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.dependencySurfaceEventId, "EVT-20260814-019");
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.iosPlatformConditionResolutionPassed, true);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.iosJavaScriptBundleEvidence, true);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.iosBundleModules, 1565);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.iosBundleSha256Scope, "RECORDED_EXPORT_RUN_ONLY");
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.repeatedExportRuns, 3);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.repeatedExportShapeStable, true);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.repeatedExportByteIdentical, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.observedIosBundleSha256Count, 3);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.repositoryFullSuitePassed, 780);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.projectOpsValidationTestsPassed, 119);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.nativeDirectoriesGenerated, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.prebuildRun, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.xcodeUsed, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.cocoaPodsUsed, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.nativeCompilationRun, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.iosSimulatorRun, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.iosDeviceRun, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.signedArchiveProduced, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.nativeIosEvidence, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.decisionAccepted, false);
  assert.equal(sdk57IosJavaScriptExportEvent.value.data.ownerSecondActionStillRequired, true);
  const sdk57IosExportStructureVerifierEvent = findEvent(VALID_MODEL, "EVT-20260814-021");
  assert.equal(sdk57IosExportStructureVerifierEvent.value.subject.id, "sdk57-ios-javascript-export-structure-verifier");
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.previousExportEventId, "EVT-20260814-020");
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.exportCommandIntegrated, true);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.exportCommandPassed, true);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.verifierRanPostExport, true);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.verifierUnitTestsPassed, 5);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.iosOnlyMetadataRequired, true);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.hermesBundleFiles, 1);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.declaredAssetFiles, 23);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.totalFiles, 25);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.bundleBytesUsedAsGate, false);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.bundleSha256UsedAsGate, false);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.fingerprintPolicy, "RUN_SPECIFIC_NOT_REPRODUCIBILITY_GATE");
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.additionalPlatformsRejected, true);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.pathTraversalRejected, true);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.undeclaredFilesRejected, true);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.nativeDirectoriesRejected, true);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.subsequentRunShapeMatchedPrevious, false);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.subsequentRunTotalBytesDelta, 1);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.repositoryFullSuitePassed, 786);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.projectOpsValidationTestsPassed, 120);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.nativeDirectoriesGenerated, false);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.nativeRuntimeEvidence, false);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.nativeIosEvidence, false);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.reproducibleBuildEvidence, false);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.decisionAccepted, false);
  assert.equal(sdk57IosExportStructureVerifierEvent.value.data.ownerSecondActionStillRequired, true);
  const sdk57AndroidExportStructureVerifierEvent = findEvent(VALID_MODEL, "EVT-20260814-022");
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.subject.id, "sdk57-android-javascript-export-structure-verifier");
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.previousIosVerifierEventId, "EVT-20260814-021");
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.previousAndroidExportEventId, "EVT-20260814-019");
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.sharedPlatformVerifierCore, true);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.androidExportCommandIntegrated, true);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.androidExportCommandPassed, true);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.platformVerifierUnitTestsPassed, 10);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.androidVerifierUnitTestsPassed, 5);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.iosVerifierRegressionTestsPassed, 5);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.androidOnlyMetadataRequired, true);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.allowedAssetExtensions, "png,ttf,xml");
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.hermesBundleFiles, 1);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.declaredAssetFiles, 27);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.totalFiles, 29);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.bundleBytesUsedAsGate, false);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.bundleSha256UsedAsGate, false);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.assetPolicyViolationsRejected, true);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.pathTraversalSharedCore, true);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.recordedRunTotalBytesDelta, -2);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.repositoryFullSuitePassed, 792);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.projectOpsValidationTestsPassed, 121);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.nativeDirectoriesGenerated, false);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.nativeRuntimeEvidence, false);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.nativeAndroidEvidence, false);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.reproducibleBuildEvidence, false);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.decisionAccepted, false);
  assert.equal(sdk57AndroidExportStructureVerifierEvent.value.data.ownerSecondActionStillRequired, true);
  const d039AcceptanceEvent = findEvent(VALID_MODEL, "EVT-20260815-001");
  assert.equal(d039AcceptanceEvent.value.type, "DECISION_ACCEPTED");
  assert.equal(d039AcceptanceEvent.value.subject.id, "D-039");
  assert.equal(d039AcceptanceEvent.value.data.optionKey, "A");
  assert.equal(d039AcceptanceEvent.value.data.choiceKey, "local-search-recent-first");
  assert.equal(d039AcceptanceEvent.value.data.captureChannel, "CODEX_TEXT_REPLY");
  assert.equal(d039AcceptanceEvent.value.data.px3OwnerGatePassed, true);
  assert.equal(d039AcceptanceEvent.value.data.next, "PX-4_BASELINE_REQUIRED");
  assert.equal(d039AcceptanceEvent.value.data.formalImplementationAuthorized, false);
  assert.equal(d039AcceptanceEvent.value.data.px5ImplementationDorSatisfied, false);
  assert.equal(d039AcceptanceEvent.value.data.d032SecondOwnerActionSatisfied, false);
  assert.equal(d039AcceptanceEvent.value.data.d053AuthorizationChanged, false);
  const d039Px4Event = findEvent(VALID_MODEL, "EVT-20260815-002");
  assert.equal(d039Px4Event.value.type, "GATE_CHANGED");
  assert.equal(d039Px4Event.value.subject.id, "D-039-PX-4");
  assert.equal(d039Px4Event.value.data.to, "PX-4_BASELINE_FROZEN");
  assert.equal(d039Px4Event.value.data.next, "PX-5_DOR_REQUIRED");
  assert.deepEqual(d039Px4Event.value.data.firstLayerPrimary, ["LOCAL_SEARCH", "RECENT"]);
  assert.deepEqual(d039Px4Event.value.data.firstLayerAuxiliary, ["BARCODE_SCAN", "AI_ASSISTED"]);
  assert.equal(d039Px4Event.value.data.designBaselineFrozen, true);
  assert.equal(d039Px4Event.value.data.formalImplementationAuthorized, false);
  assert.equal(d039Px4Event.value.data.px5ImplementationDorSatisfied, false);
  const d039Px5AssessmentEvent = findEvent(VALID_MODEL, "EVT-20260815-005");
  assert.equal(d039Px5AssessmentEvent.value.type, "REVIEW_FEEDBACK");
  assert.equal(d039Px5AssessmentEvent.value.subject.id, "D-039-PX-5");
  assert.equal(d039Px5AssessmentEvent.value.data.disposition, "NOT_READY");
  assert.equal(d039Px5AssessmentEvent.value.data.next, "PX-5_BLOCKER_CLOSURE_REQUIRED");
  assert.deepEqual(
    [d039Px5AssessmentEvent.value.data.passedCount, d039Px5AssessmentEvent.value.data.partialCount, d039Px5AssessmentEvent.value.data.failedCount],
    [1, 3, 3],
  );
  assert.equal(d039Px5AssessmentEvent.value.data.openBlockerCount, 7);
  assert.deepEqual(d039Px5AssessmentEvent.value.data.locallyCloseableBlockerIds, ["D039-PX5-B01", "D039-PX5-B02"]);
  assert.equal(d039Px5AssessmentEvent.value.data.formalRootProjectAuthorized, false);
  assert.equal(d039Px5AssessmentEvent.value.data.nativeIosWorkAuthorized, false);
  assert.equal(d039Px5AssessmentEvent.value.data.px5ImplementationDorSatisfied, false);
  const d039AcceptanceMatrixEvent = findEvent(VALID_MODEL, "EVT-20260815-006");
  assert.equal(d039AcceptanceMatrixEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d039AcceptanceMatrixEvent.value.subject.id, "D039-FORMAL-ACCEPTANCE-MATRIX-001");
  assert.equal(d039AcceptanceMatrixEvent.value.data.to, "D039-PX5-B01_CLOSED");
  assert.equal(d039AcceptanceMatrixEvent.value.data.next, "D039-PX5-B02_REQUIRED");
  assert.equal(d039AcceptanceMatrixEvent.value.data.acceptanceCaseCount, 24);
  assert.equal(d039AcceptanceMatrixEvent.value.data.acceptanceCaseIds[0], "D039-AC-001");
  assert.equal(d039AcceptanceMatrixEvent.value.data.acceptanceCaseIds.at(-1), "D039-AC-024");
  assert.equal(d039AcceptanceMatrixEvent.value.data.formalAcceptanceMatrixComplete, true);
  assert.deepEqual(d039AcceptanceMatrixEvent.value.data.closedBlockerIds, ["D039-PX5-B01"]);
  assert.equal(d039AcceptanceMatrixEvent.value.data.remainingOpenBlockerCount, 6);
  assert.equal(d039AcceptanceMatrixEvent.value.data.stableRouteAndTestIdsMapped, false);
  assert.equal(d039AcceptanceMatrixEvent.value.data.formalImplementationAuthorized, false);
  const d039RouteContractEvent = findEvent(VALID_MODEL, "EVT-20260815-007");
  assert.equal(d039RouteContractEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d039RouteContractEvent.value.subject.id, "D039-ROUTE-OBSERVABILITY-CONTRACT-001");
  assert.equal(d039RouteContractEvent.value.data.to, "D039-PX5-B02_CLOSED");
  assert.equal(d039RouteContractEvent.value.data.next, "D039-PX5-OWNER_DEPENDENCIES_REQUIRED");
  assert.equal(d039RouteContractEvent.value.data.routeCount, 5);
  assert.equal(d039RouteContractEvent.value.data.staticTestIdCount, 43);
  assert.equal(d039RouteContractEvent.value.data.dynamicTestIdPatternCount, 2);
  assert.equal(d039RouteContractEvent.value.data.returnRecoveryCaseCount, 6);
  assert.equal(d039RouteContractEvent.value.data.externalDeepLinksSupported, false);
  assert.deepEqual(d039RouteContractEvent.value.data.closedBlockerIds, ["D039-PX5-B01", "D039-PX5-B02"]);
  assert.equal(d039RouteContractEvent.value.data.remainingOpenBlockerCount, 5);
  assert.equal(d039RouteContractEvent.value.data.stableRouteAndTestIdsMapped, true);
  assert.equal(d039RouteContractEvent.value.data.returnDeepLinkContractComplete, true);
  assert.equal(d039RouteContractEvent.value.data.formalImplementationAuthorized, false);
  const d045CardEvent = findEvent(VALID_MODEL, "EVT-20260815-008");
  assert.equal(d045CardEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d045CardEvent.value.subject.id, "D045-RECENT-FAVORITES-CARD-001");
  assert.equal(d045CardEvent.value.data.next, "D045_INDEPENDENT_REVIEW_REQUIRED");
  assert.deepEqual(d045CardEvent.value.data.optionIds, [
    "recent_only_derived",
    "recent_and_favorites_separate",
    "defer_both_reopen_d039",
  ]);
  assert.equal(d045CardEvent.value.data.recentCandidateLimit, 20);
  assert.equal(d045CardEvent.value.data.recentCopiesFoodOrNutritionPayload, false);
  assert.equal(d045CardEvent.value.data.independentReviewPassed, false);
  assert.equal(d045CardEvent.value.data.ownerCardScheduled, false);
  assert.equal(d045CardEvent.value.data.d039BlockerState, "OPEN");
  assert.equal(d045CardEvent.value.data.formalImplementationAuthorized, false);
  const d031CardEvent = findEvent(VALID_MODEL, "EVT-20260817-001");
  assert.equal(d031CardEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d031CardEvent.value.subject.id, "D031-MEDIA-AI-RETENTION-CARD-001");
  assert.equal(d031CardEvent.value.data.next, "D031_INDEPENDENT_REVIEW_REQUIRED");
  assert.deepEqual(d031CardEvent.value.data.optionIds, [
    "compressed_attachment_ephemeral_ai",
    "no_persistent_media_ephemeral_ai",
    "per_item_original_and_validated_history",
  ]);
  assert.equal(d031CardEvent.value.data.acquisitionDoesNotAuthorizeRetention, true);
  assert.equal(d031CardEvent.value.data.rawProviderResponsePersisted, false);
  assert.equal(d031CardEvent.value.data.persistentMediaIncludedInEncryptedBackup, true);
  assert.equal(d031CardEvent.value.data.independentReviewPassed, false);
  assert.equal(d031CardEvent.value.data.ownerCardScheduled, false);
  assert.equal(d031CardEvent.value.data.d039BlockerState, "OPEN");
  assert.equal(d031CardEvent.value.data.formalImplementationAuthorized, false);
  const d033CardEvent = findEvent(VALID_MODEL, "EVT-20260817-002");
  assert.equal(d033CardEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d033CardEvent.value.subject.id, "D033-NONLABEL-AI-CONFIRMATION-CARD-001");
  assert.equal(d033CardEvent.value.data.next, "D033_INDEPENDENT_REVIEW_REQUIRED");
  assert.deepEqual(d033CardEvent.value.data.optionIds, [
    "per_request_preview_all_nonlabel_payloads",
    "per_request_preview_images_explicit_text_send",
    "d014_label_only_explicit_send_others",
  ]);
  assert.equal(d033CardEvent.value.data.d014LabelPhotoPreviewScopePreserved, true);
  assert.equal(d033CardEvent.value.data.confirmationTokenReusable, false);
  assert.equal(d033CardEvent.value.data.blockedWhenD034D036OrD053Unresolved, true);
  assert.equal(d033CardEvent.value.data.independentReviewPassed, false);
  assert.equal(d033CardEvent.value.data.ownerCardScheduled, false);
  assert.equal(d033CardEvent.value.data.d039BlockerState, "OPEN");
  assert.equal(d033CardEvent.value.data.formalImplementationAuthorized, false);
  const d034CardEvent = findEvent(VALID_MODEL, "EVT-20260817-003");
  assert.equal(d034CardEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d034CardEvent.value.subject.id, "D034-AI-RESOURCE-BUDGET-CARD-001");
  assert.equal(d034CardEvent.value.data.next, "D034_DEVICE_BENCHMARK_AND_INDEPENDENT_REVIEW_REQUIRED");
  assert.deepEqual(d034CardEvent.value.data.optionIds, [
    "conservative_fixed_limits",
    "balanced_fixed_limits",
    "provider_profile_with_global_ceiling",
  ]);
  assert.equal(d034CardEvent.value.data.budgetDimensionCount, 19);
  assert.equal(d034CardEvent.value.data.providerCanOnlyTighten, true);
  assert.equal(d034CardEvent.value.data.deviceBenchmarkPassed, false);
  assert.equal(d034CardEvent.value.data.independentReviewPassed, false);
  assert.equal(d034CardEvent.value.data.ownerCardScheduled, false);
  assert.equal(d034CardEvent.value.data.d039BlockerState, "OPEN");
  assert.equal(d034CardEvent.value.data.formalImplementationAuthorized, false);
  const d036CardEvent = findEvent(VALID_MODEL, "EVT-20260820-001");
  assert.equal(d036CardEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d036CardEvent.value.subject.id, "D036-AI-TRANSPORT-PROFILE-CARD-001");
  assert.equal(d036CardEvent.value.data.next, "D036_PROVIDER_SPIKE_NATIVE_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED");
  assert.deepEqual(d036CardEvent.value.data.optionIds, [
    "strict_ephemeral_no_redirect",
    "confirmed_query_same_origin_redirect",
    "rn_fetch_after_native_boundary_proof",
  ]);
  assert.deepEqual(d036CardEvent.value.data.compatibleProfileRedirectStatuses, [307, 308]);
  assert.equal(d036CardEvent.value.data.ephemeralAloneConsideredSufficientIsolation, false);
  assert.equal(d036CardEvent.value.data.explicitUrlCacheDisabled, true);
  assert.equal(d036CardEvent.value.data.explicitCookieStorageDisabled, true);
  assert.equal(d036CardEvent.value.data.explicitCredentialStorageDisabled, true);
  assert.equal(d036CardEvent.value.data.providerCompatibilitySpikePassed, false);
  assert.equal(d036CardEvent.value.data.nativeBoundaryEvidencePassed, false);
  assert.equal(d036CardEvent.value.data.realNetworkRequests, 0);
  assert.equal(d036CardEvent.value.data.independentReviewPassed, false);
  assert.equal(d036CardEvent.value.data.ownerCardScheduled, false);
  assert.equal(d036CardEvent.value.data.d039BlockerState, "OPEN");
  assert.equal(d036CardEvent.value.data.formalImplementationAuthorized, false);
  const d053CardEvent = findEvent(VALID_MODEL, "EVT-20260820-002");
  assert.equal(d053CardEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d053CardEvent.value.subject.id, "D053-AI-PROVIDER-USE-ADMISSION-CARD-001");
  assert.equal(d053CardEvent.value.data.next, "D053_OI07_POLICY_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED");
  assert.deepEqual(d053CardEvent.value.data.optionIds, [
    "documented_compatible_use_only",
    "provider_specific_residual_risk_review",
    "user_consent_broad_admission",
  ]);
  assert.equal(d053CardEvent.value.data.evidenceDimensionCount, 10);
  assert.equal(d053CardEvent.value.data.payloadClassCount, 5);
  assert.equal(d053CardEvent.value.data.appleProhibitedUsesOwnerWaivable, false);
  assert.equal(d053CardEvent.value.data.unknownEvidenceCanAuthorize, false);
  assert.equal(d053CardEvent.value.data.localProfileAssertionCountsAsProviderTruth, false);
  assert.equal(d053CardEvent.value.data.appPrivacyMappingSigned, false);
  assert.equal(d053CardEvent.value.data.oi07Complete, false);
  assert.equal(d053CardEvent.value.data.providerAdmissionRecords, 0);
  assert.equal(d053CardEvent.value.data.allProviderPayloadProfiles, "UNKNOWN_BLOCKED");
  assert.equal(d053CardEvent.value.data.independentReviewPassed, false);
  assert.equal(d053CardEvent.value.data.ownerCardScheduled, false);
  assert.equal(d053CardEvent.value.data.d053RegisteredInDecisionLedger, true);
  assert.equal(d053CardEvent.value.data.formalImplementationAuthorized, false);
  const d040AllocationEvent = findEvent(VALID_MODEL, "EVT-20260815-003");
  assert.equal(d040AllocationEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d040AllocationEvent.value.subject.id, "D040-QUESTION-ALLOCATION-001");
  assert.equal(d040AllocationEvent.value.data.next, "DECISION_CARD_SPEC_REVIEW_REQUIRED");
  assert.equal(d040AllocationEvent.value.data.resolvedDecisionAxisCount, 20);
  assert.equal(d040AllocationEvent.value.data.newlyReservedIdCount, 19);
  assert.deepEqual(d040AllocationEvent.value.data.macroQuestion10ExpandedTo, ["D-063", "D-070", "D-071", "D-072"]);
  assert.equal(d040AllocationEvent.value.data.formulaEvidenceReviewComplete, true);
  assert.equal(d040AllocationEvent.value.data.formulaChoiceResolved, false);
  assert.equal(d040AllocationEvent.value.data.ownerCardScheduled, false);
  assert.equal(d040AllocationEvent.value.data.ownerReviewAuthorized, false);
  const d040FirstBatchEvent = findEvent(VALID_MODEL, "EVT-20260815-004");
  assert.equal(d040FirstBatchEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d040FirstBatchEvent.value.subject.id, "D040-FIRST-BATCH-CARD-SPEC-001");
  assert.equal(d040FirstBatchEvent.value.data.next, "FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED");
  assert.deepEqual(d040FirstBatchEvent.value.data.cardDecisionIds, ["D-054", "D-055", "D-056", "D-058"]);
  assert.equal(d040FirstBatchEvent.value.data.cardCount, 4);
  assert.equal(d040FirstBatchEvent.value.data.optionsPerCard["D-055"], 3);
  assert.deepEqual(d040FirstBatchEvent.value.data.stableOptionIds["D-058"], ["explicit_branch_with_skip", "disable_branch_dependent_formulas"]);
  assert.equal(d040FirstBatchEvent.value.data.undefinedEighteenYearModelRemoved, true);
  assert.equal(d040FirstBatchEvent.value.data.conditionalNotApplicableDefined, true);
  assert.equal(d040FirstBatchEvent.value.data.ownerCardScheduled, false);
  assert.equal(d040FirstBatchEvent.value.data.ownerReviewAuthorized, false);
  const d040EnergyBatchEvent = findEvent(VALID_MODEL, "EVT-20260820-003");
  assert.equal(d040EnergyBatchEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d040EnergyBatchEvent.value.subject.id, "D040-ENERGY-MODEL-BATCH-CARD-SPEC-001");
  assert.equal(d040EnergyBatchEvent.value.data.next, "FIRST_TWO_BATCHES_INDEPENDENT_REVIEW_REQUIRED");
  assert.deepEqual(d040EnergyBatchEvent.value.data.cardDecisionIds, ["D-057", "D-059", "D-060", "D-061", "D-062"]);
  assert.equal(d040EnergyBatchEvent.value.data.cardCount, 5);
  assert.equal(d040EnergyBatchEvent.value.data.draftedCardCount, 9);
  assert.deepEqual(d040EnergyBatchEvent.value.data.stableOptionIds["D-057"], [
    "nasem_2023_maintenance_eer",
    "mifflin_ree_only",
    "manual_or_no_goal",
  ]);
  assert.deepEqual(d040EnergyBatchEvent.value.data.stableOptionIds["D-062"], [
    "maintenance_only_manual_or_no_goal_for_change",
    "validated_dynamic_change_model",
  ]);
  assert.equal(d040EnergyBatchEvent.value.data.modelOutputNamesPreserved, true);
  assert.equal(d040EnergyBatchEvent.value.data.reeToDailyTargetStrategyAuthorized, false);
  assert.equal(d040EnergyBatchEvent.value.data.silentDefaultPalAllowed, false);
  assert.equal(d040EnergyBatchEvent.value.data.dynamicModelEvidencePassed, false);
  assert.equal(d040EnergyBatchEvent.value.data.dynamicModelOptionCurrentlyOwnerReady, false);
  assert.equal(d040EnergyBatchEvent.value.data.firstBatchIndependentReviewPassed, false);
  assert.equal(d040EnergyBatchEvent.value.data.ownerCardScheduled, false);
  assert.equal(d040EnergyBatchEvent.value.data.formulaImplementationAuthorized, false);
  assert.equal(d040EnergyBatchEvent.value.data.formalImplementationAuthorized, false);
  const d040DataLifecycleBatchEvent = findEvent(VALID_MODEL, "EVT-20260820-004");
  assert.equal(d040DataLifecycleBatchEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d040DataLifecycleBatchEvent.value.subject.id, "D040-DATA-LIFECYCLE-BATCH-CARD-SPEC-001");
  assert.equal(d040DataLifecycleBatchEvent.value.data.next, "FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_REQUIRED");
  assert.deepEqual(d040DataLifecycleBatchEvent.value.data.cardDecisionIds, ["D-064", "D-065", "D-066", "D-067"]);
  assert.equal(d040DataLifecycleBatchEvent.value.data.cardCount, 4);
  assert.equal(d040DataLifecycleBatchEvent.value.data.draftedCardCount, 13);
  assert.deepEqual(d040DataLifecycleBatchEvent.value.data.dataLayerIds, [
    "CalculationDraft",
    "CurrentProfile",
    "GoalVersion",
    "IndependentHistory",
  ]);
  assert.deepEqual(d040DataLifecycleBatchEvent.value.data.stableOptionIds["D-064"], [
    "goal_output_with_provenance_only",
    "complete_reproducible_input_snapshot",
    "current_profile_plus_goal_output",
  ]);
  assert.equal(d040DataLifecycleBatchEvent.value.data.formulaInputDoesNotImplyPersistence, true);
  assert.equal(d040DataLifecycleBatchEvent.value.data.rawAndDisplaySeparated, true);
  assert.equal(d040DataLifecycleBatchEvent.value.data.chainedRoundingAllowed, false);
  assert.equal(d040DataLifecycleBatchEvent.value.data.currentProfileDeletionCanSilentlyDeleteIndependentHistory, false);
  assert.equal(d040DataLifecycleBatchEvent.value.data.automaticCandidateCanBecomeEffectiveWithoutConfirmation, false);
  assert.equal(d040DataLifecycleBatchEvent.value.data.historicalDiaryRecalculationAllowed, false);
  assert.equal(d040DataLifecycleBatchEvent.value.data.firstTwoBatchesIndependentReviewPassed, false);
  assert.equal(d040DataLifecycleBatchEvent.value.data.ownerReviewAuthorized, false);
  assert.equal(d040DataLifecycleBatchEvent.value.data.persistenceImplementationAuthorized, false);
  assert.equal(d040DataLifecycleBatchEvent.value.data.formalImplementationAuthorized, false);
  const d040ChinaHealthInputEvent = findEvent(VALID_MODEL, "EVT-20260820-005");
  assert.equal(d040ChinaHealthInputEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d040ChinaHealthInputEvent.value.subject.id, "D040-CHINA-SUPPORT-HEALTH-REVIEW-INPUT-001");
  assert.equal(d040ChinaHealthInputEvent.value.data.next, "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(d040ChinaHealthInputEvent.value.data.locale, "zh-Hans-CN");
  assert.deepEqual(d040ChinaHealthInputEvent.value.data.supportTermIds, [
    "medical_health_professional",
    "health_weight_management_clinic_or_related_department",
    "psychological_assistance_hotline_12356",
    "medical_emergency_120",
  ]);
  assert.equal(d040ChinaHealthInputEvent.value.data.copyContextCount, 6);
  assert.equal(d040ChinaHealthInputEvent.value.data.psychologicalSupportNumber, "12356");
  assert.equal(d040ChinaHealthInputEvent.value.data.medicalEmergencyNumber, "120");
  assert.equal(d040ChinaHealthInputEvent.value.data.psychologicalHotlinePresentedAsMedicalEmergencyReplacement, false);
  assert.equal(d040ChinaHealthInputEvent.value.data.maximumRoutineReviewIntervalDays, 90);
  assert.equal(d040ChinaHealthInputEvent.value.data.immediateReviewTriggerCount, 5);
  assert.equal(d040ChinaHealthInputEvent.value.data.healthReviewerAssigned, false);
  assert.equal(d040ChinaHealthInputEvent.value.data.healthContentApproved, false);
  assert.equal(d040ChinaHealthInputEvent.value.data.contentQaPassed, false);
  assert.equal(d040ChinaHealthInputEvent.value.data.d068OwnerReady, false);
  assert.equal(d040ChinaHealthInputEvent.value.data.d069OwnerReady, false);
  assert.equal(d040ChinaHealthInputEvent.value.data.healthCopyImplementationAuthorized, false);
  assert.equal(d040ChinaHealthInputEvent.value.data.formalImplementationAuthorized, false);
  const d040ChinaMacroInputEvent = findEvent(VALID_MODEL, "EVT-20260820-006");
  assert.equal(d040ChinaMacroInputEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d040ChinaMacroInputEvent.value.subject.id, "D040-CHINA-MACRONUTRIENT-STANDARD-INPUT-001");
  assert.equal(d040ChinaMacroInputEvent.value.data.standardId, "WS/T 578.1-2017");
  assert.equal(d040ChinaMacroInputEvent.value.data.standardStatus, "CURRENT_RECOMMENDED_INDUSTRY_STANDARD");
  assert.deepEqual(d040ChinaMacroInputEvent.value.data.adultCarbohydrateEnergyPercentRange, [50, 65]);
  assert.deepEqual(d040ChinaMacroInputEvent.value.data.adultFatEnergyPercentRange, [20, 30]);
  assert.deepEqual(d040ChinaMacroInputEvent.value.data.adultProteinEnergyPercentRange, [10, 15]);
  assert.deepEqual(d040ChinaMacroInputEvent.value.data.energyConversionKcalPerGram, {
    protein: 4,
    carbohydrate: 4,
    fat: 9,
    dietaryFiber: 2,
  });
  assert.equal(d040ChinaMacroInputEvent.value.data.rangeEndpointsCanGenerateDefaultTriplet, false);
  assert.equal(d040ChinaMacroInputEvent.value.data.referenceBandCanBeIndividualPrescription, false);
  assert.equal(d040ChinaMacroInputEvent.value.data.outOfRangeCanTriggerDiagnosisScoringOrAutomaticCorrection, false);
  assert.equal(d040ChinaMacroInputEvent.value.data.consultationDraftTreatedAsCurrentStandard, false);
  assert.equal(d040ChinaMacroInputEvent.value.data.maximumStatusReviewIntervalDays, 90);
  assert.equal(d040ChinaMacroInputEvent.value.data.chinaMacroStandardEvidenceGapClosed, true);
  assert.equal(d040ChinaMacroInputEvent.value.data.d063ChinaReferenceBandEvidenceReady, true);
  assert.equal(d040ChinaMacroInputEvent.value.data.healthReviewerAssigned, false);
  assert.equal(d040ChinaMacroInputEvent.value.data.d063OwnerReady, false);
  assert.equal(d040ChinaMacroInputEvent.value.data.macroImplementationAuthorized, false);
  assert.equal(d040ChinaMacroInputEvent.value.data.formalImplementationAuthorized, false);
  const d040NiddkDynamicModelInputEvent = findEvent(VALID_MODEL, "EVT-20260820-007");
  assert.equal(d040NiddkDynamicModelInputEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d040NiddkDynamicModelInputEvent.value.subject.id, "D040-NIDDK-DYNAMIC-MODEL-FEASIBILITY-INPUT-001");
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.inputState, "RESEARCH_COMPLETE_ADOPTION_NOT_PASSED");
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.modelPaperDoi, "10.1016/S0140-6736(11)60812-X");
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.observedPublicCodeAssetCount, 7);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.publicCodeAssetHashesRecorded, true);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.dynamicModelSourceAssessmentComplete, true);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.modelIdentityAndEquationSourceLocated, true);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.explicitPerFileSoftwareLicenseFound, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.stableSemanticReleaseFound, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.officialVersionedOracleCorpusFound, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.regressionToleranceDefined, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.niddkUiDefaultsAdopted, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.productGuardrailsApproved, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.dynamicModelEvidencePassed, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.dynamicModelOptionOwnerReady, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.niddkSourceCodeVendored, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.niddkRemoteCodeExecuted, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.ownerReviewAuthorized, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.formulaImplementationAuthorized, false);
  assert.equal(d040NiddkDynamicModelInputEvent.value.data.formalImplementationAuthorized, false);
  const d040ChinaHealthReviewerPacketEvent = findEvent(VALID_MODEL, "EVT-20260820-008");
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.subject.id, "D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001");
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.inputState, "PACKET_READY_REVIEWER_UNASSIGNED");
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.reviewPacketReady, true);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.requiredArtifactCount, 9);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.requiredReviewItemCount, 13);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.copyReviewItemCount, 6);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.boundaryReviewItemCount, 7);
  assert.deepEqual(d040ChinaHealthReviewerPacketEvent.value.data.itemDispositionIds, [
    "APPROVE",
    "APPROVE_WITH_REQUIRED_CHANGE",
    "REJECT",
    "OUT_OF_SCOPE",
  ]);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.qualificationFieldCount, 9);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.formalReviewFieldCount, 21);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.maximumReviewIntervalDays, 90);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.immutableArtifactRefsRequired, true);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.contentQaIndependentGateRequired, true);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.sensitiveCredentialDocumentsStored, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.aiOrAgentCanBeHealthReviewer, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.externalMessageSent, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.reviewerNameRecorded, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.reviewerQualificationVerified, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.conflictOfInterestResolved, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.healthReviewStarted, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.healthContentApproved, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.contentQaPassed, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.d068OwnerReady, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.d069OwnerReady, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.d063OwnerReady, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.ownerReviewAuthorized, false);
  assert.equal(d040ChinaHealthReviewerPacketEvent.value.data.formalImplementationAuthorized, false);
  const d040IndependentReviewPacketEvent = findEvent(VALID_MODEL, "EVT-20260821-001");
  assert.equal(d040IndependentReviewPacketEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d040IndependentReviewPacketEvent.value.subject.id, "D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-PACKET-001");
  assert.equal(d040IndependentReviewPacketEvent.value.data.inputState, "PACKET_READY_REVIEWERS_UNASSIGNED");
  assert.equal(d040IndependentReviewPacketEvent.value.data.reviewPacketReady, true);
  assert.equal(d040IndependentReviewPacketEvent.value.data.requiredArtifactCount, 7);
  assert.equal(d040IndependentReviewPacketEvent.value.data.requiredCardCount, 13);
  assert.deepEqual(d040IndependentReviewPacketEvent.value.data.cardDecisionIds, [
    "D-054", "D-055", "D-056", "D-058", "D-057", "D-059", "D-060",
    "D-061", "D-062", "D-064", "D-065", "D-066", "D-067",
  ]);
  assert.equal(d040IndependentReviewPacketEvent.value.data.requiredReviewerDomainCount, 4);
  assert.deepEqual(d040IndependentReviewPacketEvent.value.data.reviewerDomainIds, [
    "PRODUCT_DECISION_QUALITY",
    "HEALTH_FORMULA_EVIDENCE",
    "PRIVACY_DATA_INTEGRITY",
    "QA_ACCESSIBILITY",
  ]);
  assert.equal(d040IndependentReviewPacketEvent.value.data.requiredCrossBatchInvariantCount, 12);
  assert.deepEqual(d040IndependentReviewPacketEvent.value.data.blockingSeverityIds, ["P0", "P1", "P2"]);
  assert.equal(d040IndependentReviewPacketEvent.value.data.nonBlockingSeverityId, "P3");
  assert.equal(d040IndependentReviewPacketEvent.value.data.namedReviewerRequired, true);
  assert.equal(d040IndependentReviewPacketEvent.value.data.authorOrPmCanSelfApprove, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.aiOrAgentCanBeIndependentReviewer, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.externalMessageSent, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.reviewersAssigned, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.reviewerIdentityVerified, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.reviewerIndependenceVerified, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.conflictOfInterestResolved, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.independentReviewStarted, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.independentReviewPassed, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.currentFindingCountsMeasured, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.dynamicModelOptionOwnerReady, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.healthReviewStillRequired, true);
  assert.equal(d040IndependentReviewPacketEvent.value.data.firstThreeBatchesIndependentReviewPassed, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.ownerReviewAuthorized, false);
  assert.equal(d040IndependentReviewPacketEvent.value.data.formalImplementationAuthorized, false);
  const d063CardEvent = findEvent(VALID_MODEL, "EVT-20260821-002");
  assert.equal(d063CardEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d063CardEvent.value.subject.id, "D040-MACRO-TARGET-SOURCE-CARD-SPEC-001");
  assert.equal(d063CardEvent.value.data.inputState, "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY");
  assert.equal(d063CardEvent.value.data.decisionId, "D-063");
  assert.equal(d063CardEvent.value.data.questionId, "d063_macro_target_source");
  assert.equal(d063CardEvent.value.data.optionCount, 3);
  assert.deepEqual(d063CardEvent.value.data.optionIds, [
    "no_macro_target",
    "china_adult_reference_band_information_only",
    "user_defined_macro_target",
  ]);
  assert.equal(d063CardEvent.value.data.recommendedOptionId, "no_macro_target");
  assert.equal(d063CardEvent.value.data.draftedCardCount, 14);
  assert.equal(d063CardEvent.value.data.referenceBandStandardId, "WS/T 578.1-2017");
  assert.deepEqual(d063CardEvent.value.data.referenceBandCarbohydrateEnergyPercentRange, [50, 65]);
  assert.deepEqual(d063CardEvent.value.data.referenceBandFatEnergyPercentRange, [20, 30]);
  assert.deepEqual(d063CardEvent.value.data.referenceBandProteinEnergyPercentRange, [10, 15]);
  assert.equal(d063CardEvent.value.data.referenceBandInformationOnly, true);
  assert.equal(d063CardEvent.value.data.rangeEndpointsCanGenerateDefaultTriplet, false);
  assert.equal(d063CardEvent.value.data.referenceBandCreatesGoalVersion, false);
  assert.equal(d063CardEvent.value.data.referenceBandCanTriggerScoringDiagnosisOrCorrection, false);
  assert.equal(d063CardEvent.value.data.userDefinedRequiresD070, true);
  assert.equal(d063CardEvent.value.data.displayAndRoundingRequiresD071, true);
  assert.equal(d063CardEvent.value.data.hardStopRecordAvailabilityRequiresD072, true);
  assert.equal(d063CardEvent.value.data.d068D069PrerequisitesPassed, false);
  assert.equal(d063CardEvent.value.data.healthReviewerAssigned, false);
  assert.equal(d063CardEvent.value.data.healthContentApproved, false);
  assert.equal(d063CardEvent.value.data.contentQaPassed, false);
  assert.equal(d063CardEvent.value.data.independentReviewPassed, false);
  assert.equal(d063CardEvent.value.data.d063OwnerReady, false);
  assert.equal(d063CardEvent.value.data.ownerReviewAuthorized, false);
  assert.equal(d063CardEvent.value.data.macroImplementationAuthorized, false);
  assert.equal(d063CardEvent.value.data.formalImplementationAuthorized, false);
  const d070CardEvent = findEvent(VALID_MODEL, "EVT-20260821-003");
  assert.equal(d070CardEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d070CardEvent.value.subject.id, "D040-CUSTOM-MACRO-INPUT-SHAPE-CARD-SPEC-001");
  assert.equal(d070CardEvent.value.data.inputState, "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY");
  assert.equal(d070CardEvent.value.data.decisionId, "D-070");
  assert.equal(d070CardEvent.value.data.questionId, "d070_custom_macro_input_shape");
  assert.equal(d070CardEvent.value.data.applicableWhen, "D-063 = user_defined_macro_target");
  assert.equal(d070CardEvent.value.data.optionCount, 3);
  assert.deepEqual(d070CardEvent.value.data.optionIds, [
    "complete_macro_grams",
    "fixed_100_percent_triplet",
    "partial_macro_grams_explicit_missing",
  ]);
  assert.equal(d070CardEvent.value.data.recommendedOptionId, "complete_macro_grams");
  assert.equal(d070CardEvent.value.data.draftedCardCount, 15);
  assert.equal(d070CardEvent.value.data.inputShapesMutuallyExclusive, true);
  assert.equal(d070CardEvent.value.data.percentAllThreeRequired, true);
  assert.equal(d070CardEvent.value.data.percentSumRequired, 100);
  assert.equal(d070CardEvent.value.data.completeGramsAllThreeRequired, true);
  assert.deepEqual(d070CardEvent.value.data.partialGramsSetCountRange, [1, 2]);
  assert.equal(d070CardEvent.value.data.missingMacroTreatedAsZero, false);
  assert.equal(d070CardEvent.value.data.residualAutoFilled, false);
  assert.equal(d070CardEvent.value.data.mixedInputShapesAllowed, false);
  assert.equal(d070CardEvent.value.data.percentToGramConversionRequiresExplicitEnergyTarget, true);
  assert.equal(d070CardEvent.value.data.conversionSelectsEnergyOrMacroTarget, false);
  assert.equal(d070CardEvent.value.data.actualEnergyMismatchIsDataError, false);
  assert.equal(d070CardEvent.value.data.numericHealthBoundsApproved, false);
  assert.equal(d070CardEvent.value.data.d063Accepted, false);
  assert.equal(d070CardEvent.value.data.d068D069PrerequisitesPassed, false);
  assert.equal(d070CardEvent.value.data.healthContentApproved, false);
  assert.equal(d070CardEvent.value.data.contentQaPassed, false);
  assert.equal(d070CardEvent.value.data.independentReviewPassed, false);
  assert.equal(d070CardEvent.value.data.cardRegisteredInDecisionLedger, false);
  assert.equal(d070CardEvent.value.data.d070OwnerReady, false);
  assert.equal(d070CardEvent.value.data.ownerReviewAuthorized, false);
  assert.equal(d070CardEvent.value.data.macroConversionImplementationAuthorized, false);
  assert.equal(d070CardEvent.value.data.persistenceImplementationAuthorized, false);
  assert.equal(d070CardEvent.value.data.formalImplementationAuthorized, false);
  const d071CardEvent = findEvent(VALID_MODEL, "EVT-20260821-004");
  assert.equal(d071CardEvent.value.type, "ARTIFACT_CREATED");
  assert.equal(d071CardEvent.value.subject.id, "D040-MACRO-DISPLAY-ROUNDING-CARD-SPEC-001");
  assert.equal(d071CardEvent.value.data.inputState, "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY");
  assert.equal(d071CardEvent.value.data.decisionId, "D-071");
  assert.equal(d071CardEvent.value.data.questionId, "d071_macro_display_rounding");
  assert.equal(d071CardEvent.value.data.optionCount, 3);
  assert.deepEqual(d071CardEvent.value.data.optionIds, [
    "source_primary_optional_derived_one_decimal",
    "source_unit_only_one_decimal",
    "source_primary_optional_derived_two_decimals",
  ]);
  assert.equal(d071CardEvent.value.data.recommendedOptionId, "source_primary_optional_derived_one_decimal");
  assert.equal(d071CardEvent.value.data.draftedCardCount, 16);
  assert.equal(d071CardEvent.value.data.referenceBandInformationOnly, true);
  assert.equal(d071CardEvent.value.data.referenceBandDerivedGramsAllowed, false);
  assert.equal(d071CardEvent.value.data.sourceUnitAlwaysPreserved, true);
  assert.equal(d071CardEvent.value.data.derivedUnitRequiresExplicitConversionInputs, true);
  assert.equal(d071CardEvent.value.data.displayDecimalRoundingMode, "ROUND_HALF_UP");
  assert.equal(d071CardEvent.value.data.recommendedDecimalPlaces, 1);
  assert.equal(d071CardEvent.value.data.highPrecisionOptionDecimalPlaces, 2);
  assert.equal(d071CardEvent.value.data.rawValuesAuthoritative, true);
  assert.equal(d071CardEvent.value.data.displayValuesPersistedAsGoal, false);
  assert.equal(d071CardEvent.value.data.conversionsUseDisplayRoundedValues, false);
  assert.equal(d071CardEvent.value.data.residualAllocatedToMacro, false);
  assert.equal(d071CardEvent.value.data.displayedPercentTripletForcedTo100, false);
  assert.equal(d071CardEvent.value.data.roundingDisclosureRequired, true);
  assert.equal(d071CardEvent.value.data.actualEnergyMismatchTreatedAsRoundingResidual, false);
  assert.equal(d071CardEvent.value.data.energyRoundingPolicyReused, false);
  assert.equal(d071CardEvent.value.data.d063Accepted, false);
  assert.equal(d071CardEvent.value.data.d070Accepted, false);
  assert.equal(d071CardEvent.value.data.numericHealthBoundsApproved, false);
  assert.equal(d071CardEvent.value.data.healthContentApproved, false);
  assert.equal(d071CardEvent.value.data.contentQaPassed, false);
  assert.equal(d071CardEvent.value.data.independentReviewPassed, false);
  assert.equal(d071CardEvent.value.data.cardRegisteredInDecisionLedger, false);
  assert.equal(d071CardEvent.value.data.d071OwnerReady, false);
  assert.equal(d071CardEvent.value.data.ownerReviewAuthorized, false);
  assert.equal(d071CardEvent.value.data.macroDisplayImplementationAuthorized, false);
  assert.equal(d071CardEvent.value.data.persistenceImplementationAuthorized, false);
  assert.equal(d071CardEvent.value.data.formalImplementationAuthorized, false);
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
    assert.equal(report.schemaValidation.instancesValidated, 299);
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

test("拒绝把 F03 条码编排合同越级为模糊识别、覆盖承诺、自动选择、写库、AI 或原生实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-004");
    event.value.data.exactGtinLengths = [1, 8, 12, 13, 14];
    event.value.data.leadingZeroPreserved = false;
    event.value.data.localExactLookupOnly = false;
    event.value.data.trustedCatalogEvidenceBound = false;
    event.value.data.singleCandidateRequiresExplicitSelection = false;
    event.value.data.multipleSourceCandidatesRemainSeparate = false;
    event.value.data.callerOwnedFoodReview = false;
    event.value.data.callerOwnedManualCreation = false;
    event.value.data.cameraPermissionHandling = "APP_OWNED_PREWARM";
    event.value.data.fuzzyBarcodeRecognitionAuthorized = true;
    event.value.data.coveragePromiseAuthorized = true;
    event.value.data.catalogMutationAuthorized = true;
    event.value.data.diaryMutationAuthorized = true;
    event.value.data.aiFallbackAuthorized = true;
    event.value.data.persistentRepositoryImplemented = true;
    event.value.data.systemClockRead = true;
    event.value.data.nativeApiCalls = 1;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_BARCODE_LOOKUP_ORCHESTRATOR_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝把 F19 导入预检合同越级为真实验签、恢复激活、文件写入或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-005");
    event.value.data.approvedDefaultLimitsBound = false;
    event.value.data.customLimitsCanOnlyTighten = false;
    event.value.data.strictPlainJsonBoundary = false;
    event.value.data.nfcAndCaseCollisionRejected = false;
    event.value.data.manifestEntrySetExact = false;
    event.value.data.importSubjectFingerprintBound = false;
    event.value.data.verificationEvidenceSubjectBound = false;
    event.value.data.verificationTruth = "HARNESS_CRYPTOGRAPHICALLY_VERIFIED";
    event.value.data.activeStateFingerprintBound = false;
    event.value.data.activationStrategy = "REPLACE_ACTIVE";
    event.value.data.activationCommitted = true;
    event.value.data.signatureAlgorithmSelected = true;
    event.value.data.backupCryptoProfileSelected = true;
    event.value.data.restoreModeSelected = true;
    event.value.data.filesystemReads = 1;
    event.value.data.filesystemWrites = 1;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeApiCalls = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_IMPORT_SAFETY_PREFLIGHT_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝把 F09 能力保留合同越级为评分、微量、风险益处、资料使用或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-006");
    event.value.data.trustedLocalNutritionSnapshotOnly = false;
    event.value.data.approvedNutrientFieldCount = 8;
    event.value.data.nutritionFactsAvailable = false;
    event.value.data.missingNotZero = false;
    event.value.data.traceWithoutNumericValue = false;
    event.value.data.estimatedSourceVisible = false;
    event.value.data.packCatalogTrustRequired = false;
    event.value.data.advancedCapabilityIds.push("PERSONALIZED_PLAN");
    event.value.data.publicEvidenceIds.push("AI-06");
    event.value.data.advancedCapabilityScopePreserved = false;
    event.value.data.advancedContentExposure = "SYNTHETIC_PLACEHOLDERS";
    event.value.data.healthScoreAlgorithmAuthorized = true;
    event.value.data.micronutrientFieldSetAuthorized = true;
    event.value.data.riskBenefitGenerationAuthorized = true;
    event.value.data.medicalConclusionAuthorized = true;
    event.value.data.personalizedClaimAuthorized = true;
    event.value.data.aiGenerationAuthorized = true;
    event.value.data.automaticProfileUseAuthorized = true;
    event.value.data.observableEffects = 1;
    event.value.data.filesystemReads = 1;
    event.value.data.filesystemWrites = 1;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeApiCalls = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_FOOD_INSIGHT_AVAILABILITY_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝放宽数据包预算、伪造验证/激活或授权许可分发和正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-007");
    event.value.data.customLimitsCanOnlyTighten = false;
    event.value.data.preAuthObjectKeysCounted = false;
    event.value.data.strictPassiveJsonBoundary = false;
    event.value.data.regularFileOnly = false;
    event.value.data.totalBytesBound = false;
    event.value.data.provenanceManifestIdentityBound = false;
    event.value.data.transformVersionBound = false;
    event.value.data.packSubjectFingerprintBound = false;
    event.value.data.verificationTruth = "CRYPTOGRAPHICALLY_VERIFIED";
    event.value.data.signatureProfile = "ED25519_SELECTED";
    event.value.data.activationStrategy = "ATOMIC_SWITCH";
    event.value.data.activationCommitted = true;
    event.value.data.signatureAlgorithmSelected = true;
    event.value.data.trustRootSelected = true;
    event.value.data.licenseDistributionAuthorized = true;
    event.value.data.filesystemReads = 1;
    event.value.data.filesystemWrites = 1;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeApiCalls = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_DATA_PACK_PREAUTH_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝把恢复观察计划冒充密码学验证、已提交清理、已开放写入或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-008");
    event.value.data.structuredGenerationObservations = false;
    event.value.data.generationObservationFingerprintBound = false;
    event.value.data.restoreObservationFingerprintBound = false;
    event.value.data.restoreIntentFingerprintBound = false;
    event.value.data.strictPlainBoundary = false;
    event.value.data.generationObservationBudgetBound = false;
    event.value.data.keyUnavailableFailsClosed = false;
    event.value.data.intentKeepsWritesClosed = false;
    event.value.data.actionPlanObservationBound = false;
    event.value.data.actionPlanEffectsCommitted = true;
    event.value.data.reobservationRequiredBeforeWrites = false;
    event.value.data.cleanupAuthorized = true;
    event.value.data.assertionTruth = "CRYPTOGRAPHICALLY_VERIFIED";
    event.value.data.cryptoProfile = "ARGON2_AES_GCM_APPROVED";
    event.value.data.restoreMode = "REPLACE";
    event.value.data.plaintextExport = "APPROVED";
    event.value.data.cryptographicVerificationPerformed = true;
    event.value.data.filesystemReads = 1;
    event.value.data.filesystemWrites = 1;
    event.value.data.keychainReads = 1;
    event.value.data.keychainWrites = 1;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeApiCalls = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_RESTORE_RECONCILE_OBSERVATION_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝把删除回执合同冒充真实容器、密钥、通知或正式实现证据", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-009");
    event.value.data.strictPassiveOutcomeBoundary = false;
    event.value.data.outcomeResourceBudgetBound = false;
    event.value.data.evidenceIdentityRequired = false;
    event.value.data.effectFingerprintBound = false;
    event.value.data.observationFingerprintBound = false;
    event.value.data.outcomeFingerprintBound = false;
    event.value.data.crossEffectReplayRejected = false;
    event.value.data.legacyNakedOutcomeRejected = false;
    event.value.data.statusErrorSemanticsBound = false;
    event.value.data.assertionTruth = "NATIVE_VERIFIED";
    event.value.data.externalFilesScope = "DELETED";
    event.value.data.realContainerEmptinessVerified = true;
    event.value.data.realSecretInvalidationVerified = true;
    event.value.data.realNotificationRemovalVerified = true;
    event.value.data.filesystemReads = 1;
    event.value.data.filesystemWrites = 1;
    event.value.data.keychainReads = 1;
    event.value.data.keychainWrites = 1;
    event.value.data.systemClockRead = true;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeApiCalls = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_WIPE_OUTCOME_EVIDENCE_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝把本地 ALLOW profile 或伪造 D-053 接受证据越级为可发送和正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260813-010");
    event.value.data.strictProviderPolicyProfile = false;
    event.value.data.policyEvidenceReferencesBound = false;
    event.value.data.riskSemanticsBound = false;
    event.value.data.policyValidityWindowBound = false;
    event.value.data.exactRequestSubjectBound = false;
    event.value.data.providerOriginModelPayloadProfileRegionBound = false;
    event.value.data.subjectFingerprintBound = false;
    event.value.data.profileFingerprintBound = false;
    event.value.data.authorizationFingerprintBound = false;
    event.value.data.appleProhibitedUseBlocked = false;
    event.value.data.labelPreviewSubjectBound = false;
    event.value.data.legacyPlainAllowRejected = false;
    event.value.data.d053DecisionState = "ACCEPTED";
    event.value.data.d053Authorization = "AUTHORIZED";
    event.value.data.matchingAllowStillBlocked = false;
    event.value.data.policyTruth = "PROVIDER_TRUTH_VERIFIED";
    event.value.data.networkRequests = 1;
    event.value.data.authorizationReads = 1;
    event.value.data.sensitiveBodySerializations = 1;
    event.value.data.keychainReads = 1;
    event.value.data.businessWrites = 1;
    event.value.data.systemClockRead = true;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_AI_PROVIDER_POLICY_AUTHORIZATION_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-13.jsonl",
  );
});

test("拒绝把严格 AI 响应合同越级为 Provider 真值、已确认候选、已授权网络或正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260814-014");
    event.value.data.untrustedResponseBoundary = false;
    event.value.data.duplicateJsonKeysRejected = false;
    event.value.data.trailingDataRejected = false;
    event.value.data.nonEmptyCandidateSetRequired = false;
    event.value.data.exactCandidateSchema = false;
    event.value.data.normalizedSafeLabels = false;
    event.value.data.resourceBudgetsBound = false;
    event.value.data.unsafeNumbersRejected = false;
    event.value.data.semanticResponseFingerprintBound = false;
    event.value.data.passiveStateSnapshotBound = false;
    event.value.data.errorContentNotReflected = false;
    event.value.data.candidateAuthority = "AUTO_CONFIRMED";
    event.value.data.schemaAuthority = "FORMAL_PROVIDER_API";
    event.value.data.persistenceAuthorized = true;
    event.value.data.policyAuthorizationGranted = true;
    event.value.data.keychainReads = 1;
    event.value.data.sensitiveBodySerializations = 1;
    event.value.data.realNetworkRequests = 1;
    event.value.data.filesystemWrites = 1;
    event.value.data.businessWrites = 1;
    event.value.data.systemClockRead = true;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(report, "OPS_AI_RESPONSE_CONTRACT_MISMATCH", "project-ops/events/2026-08-14.jsonl");
});

test("拒绝把候选确认 V2 完整响应证据降级、改回 V1 或越级持久化候选正文和正式实现", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260814-015");
    event.value.data.stateSchemaVersion = "AI_CANDIDATE_CONFIRMATION_STATE_V1";
    event.value.data.reviewEvidenceSchemaVersion = "AI_CANDIDATE_REVIEW_EVIDENCE_V1";
    event.value.data.confirmedRecordSchemaVersion = "AI_CONFIRMED_RECORD_V1";
    event.value.data.sourceEvidenceSchemaVersion = "AI_CONFIRMED_SOURCE_EVIDENCE_V1";
    event.value.data.commandSchemaVersion = "AI_CONFIRMED_RECORD_COMMAND_V1";
    event.value.data.receiptSchemaVersion = "AI_CONFIRMED_RECORD_RECEIPT_V1";
    event.value.data.completeResponseFingerprintBound = false;
    event.value.data.unselectedCandidateChangeDetected = false;
    event.value.data.responseFingerprintBoundToReview = false;
    event.value.data.responseFingerprintPersistedAsEvidence = false;
    event.value.data.candidateFingerprintStillBound = false;
    event.value.data.confirmedValueFingerprintStillBound = false;
    event.value.data.legacyV1EvidenceRejected = false;
    event.value.data.rawResponsePersisted = true;
    event.value.data.candidateContentPersisted = true;
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
    "OPS_AI_CANDIDATE_RESPONSE_EVIDENCE_V2_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-14.jsonl",
  );
  const contextReport = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260814-016");
    event.value.data.contextSchemaVersion = "AI_REQUEST_CONTEXT_V1";
    event.value.data.candidateStateSchemaVersion = "AI_CANDIDATE_CONFIRMATION_STATE_V2";
    event.value.data.guidanceStateSchemaVersion = "AI_GUIDANCE_REFERENCE_STATE_V1";
    event.value.data.exactPolicySubjectBound = false;
    event.value.data.completePolicyProfileBound = false;
    event.value.data.d053AuthorizationEvidenceBound = false;
    event.value.data.policyCheckEvidenceBound = false;
    event.value.data.onlyRemainingPolicyGate = "PROVIDER_ELIGIBLE";
    event.value.data.transportOccurrence = "ESTABLISHED";
    event.value.data.sendAuthorization = "GRANTED";
    event.value.data.keychainReads = 1;
    event.value.data.sensitiveBodySerializations = 1;
    event.value.data.realNetworkRequests = 1;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
  });
  assertDiagnostic(
    contextReport,
    "OPS_AI_REQUEST_EVIDENCE_CONTEXT_V2_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-14.jsonl",
  );
  const preflightReport = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260814-017");
    event.value.data.stableConfiguredStateRequired = false;
    event.value.data.nonSensitiveConfigurationEvidenceOnly = false;
    event.value.data.baseUrlOriginModelCompared = false;
    event.value.data.exactConfigurationMatchAuthorizesSend = true;
    event.value.data.providerIdentityBoundToConfiguration = true;
    event.value.data.disposition = "ALLOWED";
    event.value.data.requiredBlockers = [];
    event.value.data.sendAuthorization = "GRANTED";
    event.value.data.credentialMaterialReads = 1;
    event.value.data.authorizationHeadersBuilt = 1;
    event.value.data.sensitiveBodySerializations = 1;
    event.value.data.transportsCreated = 1;
    event.value.data.realNetworkRequests = 1;
    event.value.data.businessWrites = 1;
    event.value.data.systemClockRead = true;
    event.value.data.nativeImplementationAuthorized = true;
    event.value.data.formalImplementationAuthorized = true;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    preflightReport,
    "OPS_AI_CONFIGURATION_POLICY_PREFLIGHT_CONTRACT_MISMATCH",
    "project-ops/events/2026-08-14.jsonl",
  );
});

test("拒绝把 Windows SDK 57 JS Spike 越级为原生证据、正式根工程或 D-032 接受", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260814-018");
    event.value.data.nodeVersion = "24.14.0";
    event.value.data.pnpmVersion = "10.32.1";
    event.value.data.lockfileFrozen = false;
    event.value.data.contractCheckPassed = false;
    event.value.data.expoDoctorChecksPassed = 19;
    event.value.data.androidExportPassed = false;
    event.value.data.nativeDirectoriesGenerated = true;
    event.value.data.prebuildRun = true;
    event.value.data.nativeIosEvidence = true;
    event.value.data.formalRootProjectAuthorized = true;
    event.value.data.decisionAccepted = true;
    event.value.data.ownerSecondActionStillRequired = false;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
    event.value.data.nativeBuildPassed = true;
  });
  assertDiagnostic(
    report,
    "OPS_SDK57_JS_SPIKE_VERIFICATION_MISMATCH",
    "project-ops/events/2026-08-14.jsonl",
  );
});

test("拒绝把 SDK 57 JS 依赖表面解析越级为原生调用、运行证据或 D-032 接受", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260814-019");
    event.value.data.requiredPackages = ["expo-sqlite"];
    event.value.data.requiredPlugins = [];
    event.value.data.runtimeSymbols = [];
    event.value.data.typescriptResolutionPassed = false;
    event.value.data.metroResolutionPassed = false;
    event.value.data.nativeApiCalls = 6;
    event.value.data.permissionRequests = 2;
    event.value.data.databaseOpens = 1;
    event.value.data.keychainReads = 1;
    event.value.data.notificationCalls = 1;
    event.value.data.workletExecutions = 1;
    event.value.data.networkRequests = 1;
    event.value.data.nativeRuntimeEvidence = true;
    event.value.data.nativeDirectoriesGenerated = true;
    event.value.data.prebuildRun = true;
    event.value.data.formalRootProjectAuthorized = true;
    event.value.data.decisionAccepted = true;
    event.value.data.ownerSecondActionStillRequired = false;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_SDK57_JS_DEPENDENCY_SURFACE_MISMATCH",
    "project-ops/events/2026-08-14.jsonl",
  );
});

test("拒绝把 Windows iOS JavaScript export 越级为原生编译、模拟器、真机或签名证据", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260814-020");
    event.value.data.iosPlatformConditionResolutionPassed = false;
    event.value.data.iosJavaScriptBundleEvidence = false;
    event.value.data.iosBundleSha256Scope = "REPRODUCIBLE_BUILD_FINGERPRINT";
    event.value.data.repeatedExportByteIdentical = true;
    event.value.data.nativeDirectoriesGenerated = true;
    event.value.data.prebuildRun = true;
    event.value.data.xcodeUsed = true;
    event.value.data.cocoaPodsUsed = true;
    event.value.data.podInstallRun = true;
    event.value.data.nativeCompilationRun = true;
    event.value.data.iosSimulatorRun = true;
    event.value.data.iosDeviceRun = true;
    event.value.data.signedArchiveProduced = true;
    event.value.data.nativeRuntimeEvidence = true;
    event.value.data.nativeIosEvidence = true;
    event.value.data.formalRootProjectAuthorized = true;
    event.value.data.decisionAccepted = true;
    event.value.data.ownerSecondActionStillRequired = false;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_SDK57_IOS_JAVASCRIPT_EXPORT_MISMATCH",
    "project-ops/events/2026-08-14.jsonl",
  );
});

test("拒绝弱化 iOS JavaScript export 结构校验或把漂移指纹冒充可复现构建证据", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260814-021");
    event.value.data.iosOnlyMetadataRequired = false;
    event.value.data.exactMetadataFileSetRequired = false;
    event.value.data.additionalPlatformsRejected = false;
    event.value.data.pathTraversalRejected = false;
    event.value.data.undeclaredFilesRejected = false;
    event.value.data.nativeDirectoriesRejected = false;
    event.value.data.bundleBytesUsedAsGate = true;
    event.value.data.bundleSha256UsedAsGate = true;
    event.value.data.fingerprintPolicy = "REPRODUCIBLE_BUILD_GATE";
    event.value.data.reproducibleBuildEvidence = true;
    event.value.data.nativeDirectoriesGenerated = true;
    event.value.data.nativeRuntimeEvidence = true;
    event.value.data.nativeIosEvidence = true;
    event.value.data.formalRootProjectAuthorized = true;
    event.value.data.decisionAccepted = true;
    event.value.data.ownerSecondActionStillRequired = false;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_SDK57_IOS_EXPORT_STRUCTURE_VERIFIER_MISMATCH",
    "project-ops/events/2026-08-14.jsonl",
  );
});

test("拒绝绕过 Android JavaScript export 共用校验核心或把字节漂移冒充可复现构建", () => {
  const report = validateMutation((model) => {
    const event = findEvent(model, "EVT-20260814-022");
    event.value.data.sharedPlatformVerifierCore = false;
    event.value.data.androidOnlyMetadataRequired = false;
    event.value.data.exactMetadataFileSetRequired = false;
    event.value.data.additionalPlatformsRejected = false;
    event.value.data.assetPolicyViolationsRejected = false;
    event.value.data.pathTraversalSharedCore = false;
    event.value.data.undeclaredFilesRejected = false;
    event.value.data.nativeDirectoriesRejected = false;
    event.value.data.bundleBytesUsedAsGate = true;
    event.value.data.bundleSha256UsedAsGate = true;
    event.value.data.fingerprintPolicy = "REPRODUCIBLE_BUILD_GATE";
    event.value.data.reproducibleBuildEvidence = true;
    event.value.data.nativeDirectoriesGenerated = true;
    event.value.data.nativeRuntimeEvidence = true;
    event.value.data.nativeAndroidEvidence = true;
    event.value.data.formalRootProjectAuthorized = true;
    event.value.data.decisionAccepted = true;
    event.value.data.ownerSecondActionStillRequired = false;
    event.value.data.gateStatesChanged = true;
    event.value.data.ownerIntakeChanged = true;
  });
  assertDiagnostic(
    report,
    "OPS_SDK57_ANDROID_EXPORT_STRUCTURE_VERIFIER_MISMATCH",
    "project-ops/events/2026-08-14.jsonl",
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

test("拒绝 Owner 整批确认被回退、篡改或扩大授权", async (t) => {
  await t.test("批次回退为待确认", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.status = "AWAITING_BATCH_READBACK";
    });
    assertDiagnostic(report, "OPS_OWNER_BATCH_STATUS_CHANGED");
  });

  await t.test("accepted 状态变化标记被回退", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.acceptanceStateChanged = false;
    });
    assertDiagnostic(report, "OPS_OWNER_ACCEPTANCE_STATE_CHANGED");
  });

  await t.test("单项 response 回退为待确认", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.responses[0].state = "PENDING_BATCH_READBACK";
    });
    assertDiagnostic(report, "OPS_OWNER_RESPONSE_STATE_MISMATCH");
  });

  await t.test("D-039 接受后下一题偏离计划中的 D-040", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.nextQuestion.id = "oi04_other";
    });
    assertDiagnostic(report, "OPS_OWNER_NEXT_QUESTION_CHANGED");
  });

  await t.test("计划中的 D-040 不再使用宿主原生 request_user_input", () => {
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
  });

  await t.test("D-032 被越级转为 ACCEPTED", () => {
    const report = validateMutation((model) => {
      const decision = model.decisionRegister.decisions.find((candidate) => candidate.id === "D-032");
      decision.status = "ACCEPTED";
      decision.acceptedOn = "2026-08-14";
    });
    assertDiagnostic(report, "OPS_OWNER_D032_SPIKE_AUTHORIZATION_MISMATCH");
  });

  await t.test("整批确认事件扩大为正式根工程授权", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260814-013").value.data.formalRootProjectAuthorized = true;
    });
    assertDiagnostic(report, "OPS_OWNER_BATCH_CONFIRMATION_EVENT_MISMATCH");
  });

  await t.test("D-038 接受事件的 choiceKey 被改写", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260814-010").value.data.choiceKey = "other";
    });
    assertDiagnostic(report, "OPS_OWNER_ACCEPTED_EVENTS_MISMATCH");
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

test("锁定 D-039 历史 PX-2、Owner A 接受与实现未授权边界", async (t) => {
  await t.test("事后改写历史 PX-2 为已记录选择", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.ownerChoiceRecorded = true;
    });
    assertDiagnostic(report, "OPS_D039_OWNER_CHOICE_PREMATURE");
  });

  await t.test("事后改写历史 PX-2 为正式实现已授权", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D039_IMPLEMENTATION_PREMATURE");
  });

  await t.test("改写历史 PX-2 门禁状态", () => {
    const report = validateMutation((model) => {
      findD039Gate(model).value.data.next = "IMPLEMENTATION_READY";
    });
    assertDiagnostic(report, "OPS_D039_GATE_ESCALATED");
  });

  await t.test("D-039 接受 choiceKey 漂移", () => {
    const report = validateMutation((model) => {
      model.decisionRegister.decisions.find((decision) => decision.id === "D-039").choiceKey = "remember-last-method";
    });
    assertDiagnostic(report, "OPS_D039_ACCEPTED_DECISION_MISMATCH");
  });

  await t.test("Owner A 响应漂移", () => {
    const report = validateMutation((model) => {
      model.ownerIntake.responses.find((response) => response.decisionId === "D-039").optionKey = "B";
    });
    assertDiagnostic(report, "OPS_D039_OWNER_RESPONSE_MISMATCH");
  });

  await t.test("接受事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260815-001");
    });
    assertDiagnostic(report, "OPS_D039_ACCEPTANCE_EVENT_MISMATCH");
  });

  await t.test("接受事件越级授权正式实现", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-001").value.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D039_ACCEPTANCE_EVENT_MISMATCH");
  });

  await t.test("缺少 PX-4 设计基线事件时失败关闭", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260815-002");
    });
    assertDiagnostic(report, "OPS_D039_PX4_BASELINE_MISMATCH");
  });

  await t.test("PX-4 首层辅助入口漂移时失败关闭", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-002").value.data.firstLayerAuxiliary.reverse();
    });
    assertDiagnostic(report, "OPS_D039_PX4_BASELINE_MISMATCH");
  });

  await t.test("PX-4 越级授权正式实现时失败关闭", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-002").value.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D039_PX4_BASELINE_MISMATCH");
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

  await t.test("PX-5 首次 DoR 评估事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260815-005");
    });
    assertDiagnostic(report, "OPS_D039_PX5_DOR_ASSESSMENT_MISMATCH");
  });

  await t.test("PX-5 阻断集合被静默缩小", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-005").value.data.openBlockerIds.pop();
    });
    assertDiagnostic(report, "OPS_D039_PX5_DOR_ASSESSMENT_MISMATCH");
  });

  await t.test("PX-5 未就绪评估越级授权正式根工程", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-005").value.data.formalRootProjectAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D039_PX5_DOR_ASSESSMENT_MISMATCH");
  });

  await t.test("PX-5 未就绪评估被改写为已满足", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-005").value.data.px5ImplementationDorSatisfied = true;
    });
    assertDiagnostic(report, "OPS_D039_PX5_DOR_ASSESSMENT_MISMATCH");
  });

  await t.test("PX-5 B01 验收矩阵事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260815-006");
    });
    assertDiagnostic(report, "OPS_D039_PX5_B01_ACCEPTANCE_MATRIX_MISMATCH");
  });

  await t.test("PX-5 B01 验收用例集合不完整", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-006").value.data.acceptanceCaseIds.pop();
    });
    assertDiagnostic(report, "OPS_D039_PX5_B01_ACCEPTANCE_MATRIX_MISMATCH");
  });

  await t.test("PX-5 B01 错误同时关闭 B02", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-006").value.data.stableRouteAndTestIdsMapped = true;
    });
    assertDiagnostic(report, "OPS_D039_PX5_B01_ACCEPTANCE_MATRIX_MISMATCH");
  });

  await t.test("PX-5 B01 越级授权正式实现", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-006").value.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D039_PX5_B01_ACCEPTANCE_MATRIX_MISMATCH");
  });

  await t.test("PX-5 B02 路由契约事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260815-007");
    });
    assertDiagnostic(report, "OPS_D039_PX5_B02_ROUTE_CONTRACT_MISMATCH");
  });

  await t.test("PX-5 B02 route/path 集合漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-007").value.data.routePaths[0] = "/add-meal";
    });
    assertDiagnostic(report, "OPS_D039_PX5_B02_ROUTE_CONTRACT_MISMATCH");
  });

  await t.test("PX-5 B02 错误支持外部 deep link", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-007").value.data.externalDeepLinksSupported = true;
    });
    assertDiagnostic(report, "OPS_D039_PX5_B02_ROUTE_CONTRACT_MISMATCH");
  });

  await t.test("PX-5 B02 越级授权正式实现", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-007").value.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D039_PX5_B02_ROUTE_CONTRACT_MISMATCH");
  });

  await t.test("D-045 选择卡工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260815-008");
    });
    assertDiagnostic(report, "OPS_D045_CARD_SPEC_MISMATCH");
  });

  await t.test("D-045 选择卡稳定选项漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-008").value.data.optionIds[0] = "recent_cached_copy";
    });
    assertDiagnostic(report, "OPS_D045_CARD_SPEC_MISMATCH");
  });

  await t.test("D-045 选择卡伪造独立复核通过", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-008").value.data.independentReviewPassed = true;
    });
    assertDiagnostic(report, "OPS_D045_CARD_SPEC_MISMATCH");
  });

  await t.test("D-045 在独立复核前进入决定台账", () => {
    const report = validateMutation((model) => {
      const candidate = structuredClone(
        model.decisionRegister.decisions.find((decision) => decision.id === "D-052"),
      );
      candidate.id = "D-045";
      candidate.title = "最近使用与收藏";
      model.decisionRegister.decisions.push(candidate);
    });
    assertDiagnostic(report, "OPS_D045_CARD_SPEC_MISMATCH");
  });

  await t.test("D-031 选择卡工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260817-001");
    });
    assertDiagnostic(report, "OPS_D031_CARD_SPEC_MISMATCH");
  });

  await t.test("D-031 选择卡稳定选项漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260817-001").value.data.optionIds[0] = "keep_original_by_default";
    });
    assertDiagnostic(report, "OPS_D031_CARD_SPEC_MISMATCH");
  });

  await t.test("D-031 错误持久化 Provider 原始响应", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260817-001").value.data.rawProviderResponsePersisted = true;
    });
    assertDiagnostic(report, "OPS_D031_CARD_SPEC_MISMATCH");
  });

  await t.test("D-031 在独立复核前进入决定台账", () => {
    const report = validateMutation((model) => {
      const candidate = structuredClone(
        model.decisionRegister.decisions.find((decision) => decision.id === "D-052"),
      );
      candidate.id = "D-031";
      candidate.title = "照片与 AI 内容保留";
      model.decisionRegister.decisions.push(candidate);
    });
    assertDiagnostic(report, "OPS_D031_CARD_SPEC_MISMATCH");
  });

  await t.test("D-033 选择卡工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260817-002");
    });
    assertDiagnostic(report, "OPS_D033_CARD_SPEC_MISMATCH");
  });

  await t.test("D-033 选择卡稳定选项漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260817-002").value.data.optionIds[0] = "preview_once_per_session";
    });
    assertDiagnostic(report, "OPS_D033_CARD_SPEC_MISMATCH");
  });

  await t.test("D-033 错误复用上传确认", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260817-002").value.data.confirmationTokenReusable = true;
    });
    assertDiagnostic(report, "OPS_D033_CARD_SPEC_MISMATCH");
  });

  await t.test("D-033 在独立复核前进入决定台账", () => {
    const report = validateMutation((model) => {
      const candidate = structuredClone(
        model.decisionRegister.decisions.find((decision) => decision.id === "D-052"),
      );
      candidate.id = "D-033";
      candidate.title = "非标签 AI 上传确认";
      model.decisionRegister.decisions.push(candidate);
    });
    assertDiagnostic(report, "OPS_D033_CARD_SPEC_MISMATCH");
  });

  await t.test("D-034 选择卡工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260817-003");
    });
    assertDiagnostic(report, "OPS_D034_CARD_SPEC_MISMATCH");
  });

  await t.test("D-034 选择卡稳定选项漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260817-003").value.data.optionIds[0] = "unbounded_provider_limits";
    });
    assertDiagnostic(report, "OPS_D034_CARD_SPEC_MISMATCH");
  });

  await t.test("D-034 错误放宽 Provider 上限", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260817-003").value.data.providerCanOnlyTighten = false;
    });
    assertDiagnostic(report, "OPS_D034_CARD_SPEC_MISMATCH");
  });

  await t.test("D-034 在 benchmark 前进入决定台账", () => {
    const report = validateMutation((model) => {
      const candidate = structuredClone(
        model.decisionRegister.decisions.find((decision) => decision.id === "D-052"),
      );
      candidate.id = "D-034";
      candidate.title = "AI 资源预算";
      model.decisionRegister.decisions.push(candidate);
    });
    assertDiagnostic(report, "OPS_D034_CARD_SPEC_MISMATCH");
  });

  await t.test("D-036 选择卡工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260820-001");
    });
    assertDiagnostic(report, "OPS_D036_CARD_SPEC_MISMATCH");
  });

  await t.test("D-036 选择卡稳定选项漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-001").value.data.optionIds[0] = "allow_all_redirects";
    });
    assertDiagnostic(report, "OPS_D036_CARD_SPEC_MISMATCH");
  });

  await t.test("D-036 错误把 ephemeral 当作完整隔离证据", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-001").value.data.ephemeralAloneConsideredSufficientIsolation = true;
    });
    assertDiagnostic(report, "OPS_D036_CARD_SPEC_MISMATCH");
  });

  await t.test("D-036 在三 Provider/原生证据前进入决定台账", () => {
    const report = validateMutation((model) => {
      const candidate = structuredClone(
        model.decisionRegister.decisions.find((decision) => decision.id === "D-052"),
      );
      candidate.id = "D-036";
      candidate.title = "AITransport URL、重定向与会话隔离 profile";
      model.decisionRegister.decisions.push(candidate);
    });
    assertDiagnostic(report, "OPS_D036_CARD_SPEC_MISMATCH");
  });

  await t.test("D-053 选择卡工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter((record) => record.value.eventId !== "EVT-20260820-002");
    });
    assertDiagnostic(report, "OPS_D053_CARD_SPEC_MISMATCH");
  });

  await t.test("D-053 选择卡稳定选项漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-002").value.data.optionIds[0] = "any_https_provider";
    });
    assertDiagnostic(report, "OPS_D053_CARD_SPEC_MISMATCH");
  });

  await t.test("D-053 错误允许 Owner 豁免 Apple 禁项", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-002").value.data.appleProhibitedUsesOwnerWaivable = true;
    });
    assertDiagnostic(report, "OPS_D053_CARD_SPEC_MISMATCH");
  });

  await t.test("D-053 卡片自审被越级改成 Owner 接受", () => {
    const report = validateMutation((model) => {
      const decision = model.decisionRegister.decisions.find((candidate) => candidate.id === "D-053");
      decision.status = "ACCEPTED";
      decision.acceptedOn = "2026-08-20";
      decision.choiceKey = "documented-compatible-use-only";
    });
    assertDiagnostic(report, "OPS_D053_CARD_SPEC_MISMATCH");
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

  await t.test("问题分解事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260815-003",
      );
    });
    assertDiagnostic(report, "OPS_D040_QUESTION_ALLOCATION_MISMATCH");
  });

  await t.test("预留 ID 集合漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-003").value.data.newlyReservedDecisionIds[0] = "D-099";
    });
    assertDiagnostic(report, "OPS_D040_QUESTION_ALLOCATION_MISMATCH");
  });

  await t.test("问题分解越级授权 Owner 评审", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-003").value.data.ownerReviewAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_QUESTION_ALLOCATION_MISMATCH");
  });

  await t.test("预留 ID 提前进入决定台账", () => {
    const report = validateMutation((model) => {
      const candidate = structuredClone(
        model.decisionRegister.decisions.find((decision) => decision.id === "D-052"),
      );
      candidate.id = "D-054";
      candidate.title = "自动公式适用年龄";
      model.decisionRegister.decisions.push(candidate);
    });
    assertDiagnostic(report, "OPS_D040_ALLOCATED_DECISION_REGISTERED_PREMATURELY");
  });

  await t.test("预留 ID 提前写入 Owner 响应", () => {
    const report = validateMutation((model) => {
      const response = structuredClone(
        model.ownerIntake.responses.find((item) => item.decisionId === "D-039"),
      );
      response.questionId = "d054_formula_age";
      response.decisionId = "D-054";
      model.ownerIntake.responses.push(response);
    });
    assertDiagnostic(report, "OPS_D040_ALLOCATED_OWNER_RESPONSE_PREMATURELY_RECORDED");
  });

  await t.test("第一批选择卡工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260815-004",
      );
    });
    assertDiagnostic(report, "OPS_D040_FIRST_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第一批选择卡稳定选项 ID 漂移", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-004").value.data.stableOptionIds["D-054"][0] = "adult_18_plus";
    });
    assertDiagnostic(report, "OPS_D040_FIRST_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第一批选择卡恢复未定义的 18 岁模型", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-004").value.data.undefinedEighteenYearModelRemoved = false;
    });
    assertDiagnostic(report, "OPS_D040_FIRST_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第一批选择卡越级授权 Owner 评审", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260815-004").value.data.ownerReviewAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_FIRST_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第二批能量模型卡工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260820-003",
      );
    });
    assertDiagnostic(report, "OPS_D040_ENERGY_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第二批把 Mifflin REE 越级为每日目标", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-003").value.data.reeToDailyTargetStrategyAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_ENERGY_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第二批静默采用默认 PAL", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-003").value.data.silentDefaultPalAllowed = true;
    });
    assertDiagnostic(report, "OPS_D040_ENERGY_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第二批未补动态模型证据就进入 Owner 评审", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-003").value;
      event.data.dynamicModelOptionCurrentlyOwnerReady = true;
      event.data.ownerReviewAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_ENERGY_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第三批资料生命周期卡工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260820-004",
      );
    });
    assertDiagnostic(report, "OPS_D040_DATA_LIFECYCLE_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第三批把显示舍入值冒充审计 raw", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-004").value.data.displayValueCanReplaceAuditRaw = true;
    });
    assertDiagnostic(report, "OPS_D040_DATA_LIFECYCLE_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第三批删除资料时静默级联独立历史", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-004").value.data.currentProfileDeletionCanSilentlyDeleteIndependentHistory = true;
    });
    assertDiagnostic(report, "OPS_D040_DATA_LIFECYCLE_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("第三批把待确认重算候选自动生效", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-004").value;
      event.data.automaticCandidateCanBecomeEffectiveWithoutConfirmation = true;
      event.data.persistenceImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_DATA_LIFECYCLE_BATCH_CARD_SPEC_MISMATCH");
  });

  await t.test("中国支持与健康评审输入工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260820-005",
      );
    });
    assertDiagnostic(report, "OPS_D040_CHINA_HEALTH_INPUT_MISMATCH");
  });

  await t.test("把 12356 冒充医疗急救替代", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-005").value.data.psychologicalHotlinePresentedAsMedicalEmergencyReplacement = true;
    });
    assertDiagnostic(report, "OPS_D040_CHINA_HEALTH_INPUT_MISMATCH");
  });

  await t.test("没有健康批准就把 D-068 提交 Owner", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-005").value;
      event.data.d068OwnerReady = true;
      event.data.ownerReviewAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_CHINA_HEALTH_INPUT_MISMATCH");
  });

  await t.test("把过期复核周期放宽并授权健康文案实现", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-005").value;
      event.data.maximumRoutineReviewIntervalDays = 365;
      event.data.healthCopyImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_CHINA_HEALTH_INPUT_MISMATCH");
  });

  await t.test("中国宏量标准输入工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260820-006",
      );
    });
    assertDiagnostic(report, "OPS_D040_CHINA_MACRO_STANDARD_INPUT_MISMATCH");
  });

  await t.test("从独立范围静默生成默认宏量三元组", () => {
    const report = validateMutation((model) => {
      findEvent(model, "EVT-20260820-006").value.data.rangeEndpointsCanGenerateDefaultTriplet = true;
    });
    assertDiagnostic(report, "OPS_D040_CHINA_MACRO_STANDARD_INPUT_MISMATCH");
  });

  await t.test("把征求意见稿冒充现行标准并授权评分", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-006").value;
      event.data.consultationDraftTreatedAsCurrentStandard = true;
      event.data.outOfRangeCanTriggerDiagnosisScoringOrAutomaticCorrection = true;
    });
    assertDiagnostic(report, "OPS_D040_CHINA_MACRO_STANDARD_INPUT_MISMATCH");
  });

  await t.test("没有健康评审就把 D-063 提交 Owner 并授权实现", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-006").value;
      event.data.d063OwnerReady = true;
      event.data.ownerReviewAuthorized = true;
      event.data.macroImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_CHINA_MACRO_STANDARD_INPUT_MISMATCH");
  });

  await t.test("NIDDK 动态模型可行性输入工件事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260820-007",
      );
    });
    assertDiagnostic(report, "OPS_D040_NIDDK_DYNAMIC_MODEL_FEASIBILITY_MISMATCH");
  });

  await t.test("把通用版权页冒充逐文件许可并宣称稳定版本和官方 corpus", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-007").value;
      event.data.explicitPerFileSoftwareLicenseFound = true;
      event.data.stableSemanticReleaseFound = true;
      event.data.officialVersionedOracleCorpusFound = true;
      event.data.regressionToleranceDefined = true;
      event.data.dynamicModelEvidencePassed = true;
      event.data.dynamicModelOptionOwnerReady = true;
    });
    assertDiagnostic(report, "OPS_D040_NIDDK_DYNAMIC_MODEL_FEASIBILITY_MISMATCH");
  });

  await t.test("静默采用 NIDDK UI 默认值和最低能量线", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-007").value;
      event.data.niddkUiDefaultsAdopted = true;
      event.data.niddk1000KcalGuardrailAdopted = true;
      event.data.niddkAdultMinimumAgeAdopted = true;
      event.data.stricterExistingEligibilityPreserved = false;
    });
    assertDiagnostic(report, "OPS_D040_NIDDK_DYNAMIC_MODEL_FEASIBILITY_MISMATCH");
  });

  await t.test("采用门禁未通过就 vendoring 或执行远端代码并授权公式", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-007").value;
      event.data.niddkSourceCodeVendored = true;
      event.data.niddkRemoteCodeExecuted = true;
      event.data.ownerReviewAuthorized = true;
      event.data.formulaImplementationAuthorized = true;
      event.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_NIDDK_DYNAMIC_MODEL_FEASIBILITY_MISMATCH");
  });

  await t.test("中国健康评审人交接包事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260820-008",
      );
    });
    assertDiagnostic(report, "OPS_D040_HEALTH_REVIEWER_INTAKE_PACKET_MISMATCH");
  });

  await t.test("把 AI 或 Agent 冒充具名合格健康评审人", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-008").value;
      event.data.aiOrAgentCanBeHealthReviewer = true;
      event.data.reviewerNameRecorded = true;
      event.data.reviewerQualificationVerified = true;
      event.data.conflictOfInterestResolved = true;
    });
    assertDiagnostic(report, "OPS_D040_HEALTH_REVIEWER_INTAKE_PACKET_MISMATCH");
  });

  await t.test("交接包跳过逐条签署或存储敏感证件", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-008").value;
      event.data.requiredReviewItemCount = 1;
      event.data.immutableArtifactRefsRequired = false;
      event.data.contentQaIndependentGateRequired = false;
      event.data.sensitiveCredentialDocumentsStored = true;
    });
    assertDiagnostic(report, "OPS_D040_HEALTH_REVIEWER_INTAKE_PACKET_MISMATCH");
  });

  await t.test("交接包准备完成就冒充健康批准并授权 Owner 或实现", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260820-008").value;
      event.data.externalMessageSent = true;
      event.data.healthReviewStarted = true;
      event.data.healthContentApproved = true;
      event.data.contentQaPassed = true;
      event.data.d068OwnerReady = true;
      event.data.ownerReviewAuthorized = true;
      event.data.healthCopyImplementationAuthorized = true;
      event.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_HEALTH_REVIEWER_INTAKE_PACKET_MISMATCH");
  });

  await t.test("前三批独立复核包事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260821-001",
      );
    });
    assertDiagnostic(report, "OPS_D040_INDEPENDENT_REVIEW_PACKET_MISMATCH");
  });

  await t.test("独立复核包静默减少卡片、复核域或跨批不变量", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-001").value;
      event.data.requiredCardCount = 12;
      event.data.cardDecisionIds.pop();
      event.data.requiredReviewerDomainCount = 1;
      event.data.requiredCrossBatchInvariantCount = 1;
    });
    assertDiagnostic(report, "OPS_D040_INDEPENDENT_REVIEW_PACKET_MISMATCH");
  });

  await t.test("让作者、PM、AI 或 Agent 冒充独立复核人并宣称通过", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-001").value;
      event.data.authorOrPmCanSelfApprove = true;
      event.data.aiOrAgentCanBeIndependentReviewer = true;
      event.data.reviewersAssigned = true;
      event.data.reviewerIdentityVerified = true;
      event.data.reviewerIndependenceVerified = true;
      event.data.independentReviewPassed = true;
    });
    assertDiagnostic(report, "OPS_D040_INDEPENDENT_REVIEW_PACKET_MISMATCH");
  });

  await t.test("复核未开始就开放动态模型、健康、Owner 或实现门禁", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-001").value;
      event.data.currentFindingCountsMeasured = true;
      event.data.dynamicModelOptionOwnerReady = true;
      event.data.healthReviewStillRequired = false;
      event.data.healthContentApproved = true;
      event.data.firstThreeBatchesIndependentReviewPassed = true;
      event.data.ownerReviewAuthorized = true;
      event.data.persistenceImplementationAuthorized = true;
      event.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_INDEPENDENT_REVIEW_PACKET_MISMATCH");
  });

  await t.test("D-063 宏量目标来源卡事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260821-002",
      );
    });
    assertDiagnostic(report, "OPS_D040_D063_CARD_SPEC_MISMATCH");
  });

  await t.test("D-063 静默改变选项集合、推荐项或依赖轴", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-002").value;
      event.data.optionCount = 2;
      event.data.optionIds.pop();
      event.data.recommendedOptionId = "china_adult_reference_band_information_only";
      event.data.userDefinedRequiresD070 = false;
      event.data.displayAndRoundingRequiresD071 = false;
      event.data.hardStopRecordAvailabilityRequiresD072 = false;
    });
    assertDiagnostic(report, "OPS_D040_D063_CARD_SPEC_MISMATCH");
  });

  await t.test("D-063 把中国参考带冒充默认目标、评分或自动纠正规则", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-002").value;
      event.data.referenceBandInformationOnly = false;
      event.data.rangeEndpointsCanGenerateDefaultTriplet = true;
      event.data.referenceBandCreatesGoalVersion = true;
      event.data.referenceBandCanTriggerScoringDiagnosisOrCorrection = true;
    });
    assertDiagnostic(report, "OPS_D040_D063_CARD_SPEC_MISMATCH");
  });

  await t.test("D-063 在健康和独立复核前进入台账、Owner 或实现", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-002").value;
      event.data.d068D069PrerequisitesPassed = true;
      event.data.healthReviewerAssigned = true;
      event.data.healthContentApproved = true;
      event.data.contentQaPassed = true;
      event.data.independentReviewPassed = true;
      event.data.cardRegisteredInDecisionLedger = true;
      event.data.d063OwnerReady = true;
      event.data.ownerReviewAuthorized = true;
      event.data.macroImplementationAuthorized = true;
      event.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_D063_CARD_SPEC_MISMATCH");
  });

  await t.test("D-070 自定义宏量输入形态卡事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260821-003",
      );
    });
    assertDiagnostic(report, "OPS_D040_D070_CARD_SPEC_MISMATCH");
  });

  await t.test("D-070 静默改变输入形态集合或制造形态重叠", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-003").value;
      event.data.optionCount = 2;
      event.data.optionIds.pop();
      event.data.inputShapesMutuallyExclusive = false;
      event.data.partialGramsSetCountRange = [1, 3];
      event.data.mixedInputShapesAllowed = true;
    });
    assertDiagnostic(report, "OPS_D040_D070_CARD_SPEC_MISMATCH");
  });

  await t.test("D-070 把缺失补零、自动补残差或让换算选择目标", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-003").value;
      event.data.percentAllThreeRequired = false;
      event.data.percentSumRequired = 99;
      event.data.missingMacroTreatedAsZero = true;
      event.data.residualAutoFilled = true;
      event.data.percentToGramConversionRequiresExplicitEnergyTarget = false;
      event.data.conversionSelectsEnergyOrMacroTarget = true;
      event.data.actualEnergyMismatchIsDataError = true;
    });
    assertDiagnostic(report, "OPS_D040_D070_CARD_SPEC_MISMATCH");
  });

  await t.test("D-070 在 D-063、健康和独立复核前进入 Owner 或实现", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-003").value;
      event.data.numericHealthBoundsApproved = true;
      event.data.d063Accepted = true;
      event.data.d068D069PrerequisitesPassed = true;
      event.data.healthContentApproved = true;
      event.data.contentQaPassed = true;
      event.data.independentReviewPassed = true;
      event.data.cardRegisteredInDecisionLedger = true;
      event.data.d070OwnerReady = true;
      event.data.ownerReviewAuthorized = true;
      event.data.macroConversionImplementationAuthorized = true;
      event.data.persistenceImplementationAuthorized = true;
      event.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_D070_CARD_SPEC_MISMATCH");
  });

  await t.test("D-071 宏量展示与舍入卡事件缺失", () => {
    const report = validateMutation((model) => {
      model.events = model.events.filter(
        (record) => record.value.eventId !== "EVT-20260821-004",
      );
    });
    assertDiagnostic(report, "OPS_D040_D071_CARD_SPEC_MISMATCH");
  });

  await t.test("D-071 静默改变显示策略、精度或来源单位保留", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-004").value;
      event.data.optionCount = 2;
      event.data.optionIds.pop();
      event.data.sourceUnitAlwaysPreserved = false;
      event.data.displayDecimalRoundingMode = "BINARY_FLOAT_DEFAULT";
      event.data.recommendedDecimalPlaces = 0;
      event.data.highPrecisionOptionDecimalPlaces = 4;
    });
    assertDiagnostic(report, "OPS_D040_D071_CARD_SPEC_MISMATCH");
  });

  await t.test("D-071 用显示值链式换算、分配残差或复用能量舍入", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-004").value;
      event.data.rawValuesAuthoritative = false;
      event.data.displayValuesPersistedAsGoal = true;
      event.data.conversionsUseDisplayRoundedValues = true;
      event.data.residualAllocatedToMacro = true;
      event.data.displayedPercentTripletForcedTo100 = true;
      event.data.roundingDisclosureRequired = false;
      event.data.actualEnergyMismatchTreatedAsRoundingResidual = true;
      event.data.energyRoundingPolicyReused = true;
    });
    assertDiagnostic(report, "OPS_D040_D071_CARD_SPEC_MISMATCH");
  });

  await t.test("D-071 在 D-063/D-070、健康和独立复核前进入 Owner 或实现", () => {
    const report = validateMutation((model) => {
      const event = findEvent(model, "EVT-20260821-004").value;
      event.data.d063Accepted = true;
      event.data.d070Accepted = true;
      event.data.numericHealthBoundsApproved = true;
      event.data.healthContentApproved = true;
      event.data.contentQaPassed = true;
      event.data.independentReviewPassed = true;
      event.data.cardRegisteredInDecisionLedger = true;
      event.data.d071OwnerReady = true;
      event.data.ownerReviewAuthorized = true;
      event.data.macroDisplayImplementationAuthorized = true;
      event.data.persistenceImplementationAuthorized = true;
      event.data.formalImplementationAuthorized = true;
    });
    assertDiagnostic(report, "OPS_D040_D071_CARD_SPEC_MISMATCH");
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
