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
    events: 181,
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
  assert.equal(report.d039.next, "D039-PX5-OWNER_DEPENDENCIES_REQUIRED");
  assert.deepEqual(report.d039.closedBlockerIds, ["D039-PX5-B01", "D039-PX5-B02"]);
  assert.equal(report.d039.openBlockerCount, 5);
  assert.equal(report.d039.formalAcceptanceMatrixComplete, true);
  assert.equal(report.d039.stableRouteAndTestIdsMapped, true);
  assert.equal(report.d039.returnDeepLinkContractComplete, true);
  assert.equal(report.d039.decisionState, "ACCEPTED");
  assert.equal(report.d039.choiceKey, "local-search-recent-first");
  assert.equal(report.d039.selectedOption, "A");
  assert.equal(report.d039.designBaselineFrozen, true);
  assert.equal(report.d045.eventId, "EVT-20260815-008");
  assert.equal(report.d045.decisionState, "CANDIDATE");
  assert.equal(report.d045.blockerState, "OPEN");
  assert.equal(report.d045.next, "D045_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(report.d045.optionCount, 3);
  assert.equal(report.d045.selfReviewPassed, true);
  assert.equal(report.d045.independentReviewPassed, false);
  assert.equal(report.d045.ownerCardScheduled, false);
  assert.equal(report.d045.registeredInDecisionLedger, false);
  assert.equal(report.d045.ownerResponseCount, 0);
  assert.equal(report.d031.eventId, "EVT-20260817-001");
  assert.equal(report.d031.decisionState, "CANDIDATE");
  assert.equal(report.d031.blockerState, "OPEN");
  assert.equal(report.d031.next, "D031_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(report.d031.optionCount, 3);
  assert.equal(report.d031.acquisitionDoesNotAuthorizeRetention, true);
  assert.equal(report.d031.rawProviderResponsePersisted, false);
  assert.equal(report.d031.backupBoundaryDefined, true);
  assert.equal(report.d031.selfReviewPassed, true);
  assert.equal(report.d031.independentReviewPassed, false);
  assert.equal(report.d031.ownerCardScheduled, false);
  assert.equal(report.d031.registeredInDecisionLedger, false);
  assert.equal(report.d031.ownerResponseCount, 0);
  assert.equal(report.d033.eventId, "EVT-20260817-002");
  assert.equal(report.d033.decisionState, "CANDIDATE");
  assert.equal(report.d033.blockerState, "OPEN");
  assert.equal(report.d033.next, "D033_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(report.d033.optionCount, 3);
  assert.equal(report.d033.d014LabelPhotoPreviewScopePreserved, true);
  assert.equal(report.d033.confirmationAuthorizesSingleAttemptOnly, true);
  assert.equal(report.d033.confirmationTokenReusable, false);
  assert.equal(report.d033.policyUnresolvedBlocksRequest, true);
  assert.equal(report.d033.selfReviewPassed, true);
  assert.equal(report.d033.independentReviewPassed, false);
  assert.equal(report.d033.ownerCardScheduled, false);
  assert.equal(report.d033.registeredInDecisionLedger, false);
  assert.equal(report.d033.ownerResponseCount, 0);
  assert.equal(report.d034.eventId, "EVT-20260817-003");
  assert.equal(report.d034.decisionState, "CANDIDATE");
  assert.equal(report.d034.blockerState, "OPEN");
  assert.equal(report.d034.next, "D034_DEVICE_BENCHMARK_AND_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(report.d034.optionCount, 3);
  assert.equal(report.d034.budgetDimensionCount, 19);
  assert.equal(report.d034.fixedGlobalCeilings, true);
  assert.equal(report.d034.failureBoundaryDefined, true);
  assert.equal(report.d034.deviceBenchmarkRequired, true);
  assert.equal(report.d034.deviceBenchmarkPassed, false);
  assert.equal(report.d034.selfReviewPassed, true);
  assert.equal(report.d034.independentReviewPassed, false);
  assert.equal(report.d034.ownerCardScheduled, false);
  assert.equal(report.d034.registeredInDecisionLedger, false);
  assert.equal(report.d034.ownerResponseCount, 0);
  assert.equal(report.d036.eventId, "EVT-20260820-001");
  assert.equal(report.d036.decisionState, "CANDIDATE");
  assert.equal(report.d036.blockerState, "OPEN");
  assert.equal(report.d036.next, "D036_PROVIDER_SPIKE_NATIVE_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(report.d036.optionCount, 3);
  assert.equal(report.d036.strictRedirectBoundary, true);
  assert.equal(report.d036.explicitSessionIsolation, true);
  assert.equal(report.d036.providerCompatibilityTargetCount, 3);
  assert.equal(report.d036.providerCompatibilitySpikePassed, false);
  assert.equal(report.d036.nativeBoundaryEvidencePassed, false);
  assert.equal(report.d036.realNetworkRequests, 0);
  assert.equal(report.d036.selfReviewPassed, true);
  assert.equal(report.d036.independentReviewPassed, false);
  assert.equal(report.d036.ownerCardScheduled, false);
  assert.equal(report.d036.registeredInDecisionLedger, false);
  assert.equal(report.d036.ownerResponseCount, 0);
  assert.equal(report.d053.eventId, "EVT-20260820-002");
  assert.equal(report.d053.decisionState, "CANDIDATE");
  assert.equal(report.d053.ledgerDecisionState, "CANDIDATE");
  assert.equal(report.d053.blockerState, "OPEN");
  assert.equal(report.d053.next, "D053_OI07_POLICY_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(report.d053.optionCount, 3);
  assert.equal(report.d053.evidenceDimensionCount, 10);
  assert.equal(report.d053.payloadClassCount, 5);
  assert.equal(report.d053.nonWaivableBoundary, true);
  assert.equal(report.d053.evidenceReady, false);
  assert.equal(report.d053.providerAdmissionRecords, 0);
  assert.equal(report.d053.allProviderPayloadProfiles, "UNKNOWN_BLOCKED");
  assert.equal(report.d053.broadConsentOptionOwnerReady, false);
  assert.equal(report.d053.realNetworkRequests, 0);
  assert.equal(report.d053.selfReviewPassed, true);
  assert.equal(report.d053.independentReviewPassed, false);
  assert.equal(report.d053.ownerCardScheduled, false);
  assert.equal(report.d053.registeredInDecisionLedger, true);
  assert.equal(report.d053.ownerResponseCount, 0);
  assert.equal(report.d040.authoritativeState, "PX-0_INPUT_GAP");
  assert.equal(report.d040.eventId, "EVT-20260821-004");
  assert.equal(report.d040.next, "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(report.d040.resolvedDecisionAxisCount, 20);
  assert.equal(report.d040.firstBatchCardCount, 4);
  assert.equal(report.d040.energyBatchCardCount, 5);
  assert.equal(report.d040.dataLifecycleBatchCardCount, 4);
  assert.equal(report.d040.draftedCardCount, 16);
  assert.equal(report.d040.firstBatchSelfReviewPassed, true);
  assert.equal(report.d040.energyBatchSelfReviewPassed, true);
  assert.equal(report.d040.dataLifecycleBatchSelfReviewPassed, true);
  assert.equal(report.d040.modelOutputNamesPreserved, true);
  assert.equal(report.d040.reeToDailyTargetStrategyAuthorized, false);
  assert.equal(report.d040.silentDefaultPalAllowed, false);
  assert.equal(report.d040.dynamicModelSourceAssessmentComplete, true);
  assert.equal(report.d040.dynamicModelIdentityAndEquationSourceLocated, true);
  assert.equal(report.d040.dynamicModelObservedPublicCodeAssetCount, 7);
  assert.equal(report.d040.dynamicModelPublicCodeAssetHashesRecorded, true);
  assert.equal(report.d040.dynamicModelExplicitPerFileLicenseFound, false);
  assert.equal(report.d040.dynamicModelStableSemanticReleaseFound, false);
  assert.equal(report.d040.dynamicModelOfficialVersionedOracleCorpusFound, false);
  assert.equal(report.d040.dynamicModelRegressionToleranceDefined, false);
  assert.equal(report.d040.dynamicModelProductGuardrailsApproved, false);
  assert.equal(report.d040.dynamicModelSourceCodeVendored, false);
  assert.equal(report.d040.dynamicModelRemoteCodeExecuted, false);
  assert.equal(report.d040.dynamicModelEvidencePassed, false);
  assert.equal(report.d040.dynamicModelOptionOwnerReady, false);
  assert.equal(report.d040.firstBatchIndependentReviewPassed, false);
  assert.equal(report.d040.dataLayerCount, 4);
  assert.equal(report.d040.formulaInputDoesNotImplyPersistence, true);
  assert.equal(report.d040.rawAndDisplaySeparated, true);
  assert.equal(report.d040.chainedRoundingAllowed, false);
  assert.equal(report.d040.deletionCanSilentlyDeleteIndependentHistory, false);
  assert.equal(report.d040.automaticCandidateCanBecomeEffectiveWithoutConfirmation, false);
  assert.equal(report.d040.historicalDiaryRecalculationAllowed, false);
  assert.equal(report.d040.firstTwoBatchesIndependentReviewPassed, false);
  assert.equal(report.d040.chinaSupportInputState, "DRAFT_COMPLETE");
  assert.equal(report.d040.chinaOfficialSourceCheckComplete, true);
  assert.equal(report.d040.chinaSupportTermCount, 4);
  assert.equal(report.d040.chinaCopyContextCount, 6);
  assert.equal(report.d040.psychologicalHotlinePresentedAsMedicalEmergencyReplacement, false);
  assert.equal(report.d040.maximumRoutineReviewIntervalDays, 90);
  assert.equal(report.d040.healthReviewerAssigned, false);
  assert.equal(report.d040.healthContentApproved, false);
  assert.equal(report.d040.contentQaPassed, false);
  assert.equal(report.d040.d068OwnerReady, false);
  assert.equal(report.d040.d069OwnerReady, false);
  assert.equal(report.d040.firstThreeBatchesIndependentReviewPassed, false);
  assert.equal(report.d040.chinaMacroInputState, "EVIDENCE_COMPLETE");
  assert.equal(report.d040.chinaMacroStandardId, "WS/T 578.1-2017");
  assert.equal(report.d040.chinaMacroStandardStatus, "CURRENT_RECOMMENDED_INDUSTRY_STANDARD");
  assert.equal(report.d040.chinaMacroOfficialStatusVerified, true);
  assert.deepEqual(report.d040.chinaMacroCarbohydrateRange, [50, 65]);
  assert.deepEqual(report.d040.chinaMacroFatRange, [20, 30]);
  assert.deepEqual(report.d040.chinaMacroProteinRange, [10, 15]);
  assert.equal(report.d040.chinaMacroRangeCanGenerateDefaultTriplet, false);
  assert.equal(report.d040.chinaMacroCanTriggerDiagnosisScoringOrCorrection, false);
  assert.equal(report.d040.chinaMacroConsultationDraftTreatedAsCurrent, false);
  assert.equal(report.d040.chinaMacroStandardEvidenceGapClosed, true);
  assert.equal(report.d040.d063ChinaReferenceBandEvidenceReady, true);
  assert.equal(report.d040.d063CardState, "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY");
  assert.equal(report.d040.d063DecisionId, "D-063");
  assert.equal(report.d040.d063QuestionId, "d063_macro_target_source");
  assert.equal(report.d040.d063CardCount, 1);
  assert.equal(report.d040.d063OptionCount, 3);
  assert.deepEqual(report.d040.d063OptionIds, [
    "no_macro_target",
    "china_adult_reference_band_information_only",
    "user_defined_macro_target",
  ]);
  assert.equal(report.d040.d063RecommendedOptionId, "no_macro_target");
  assert.equal(report.d040.d063ReferenceBandStandardId, "WS/T 578.1-2017");
  assert.deepEqual(report.d040.d063ReferenceBandCarbohydrateRange, [50, 65]);
  assert.deepEqual(report.d040.d063ReferenceBandFatRange, [20, 30]);
  assert.deepEqual(report.d040.d063ReferenceBandProteinRange, [10, 15]);
  assert.equal(report.d040.d063ReferenceBandInformationOnly, true);
  assert.equal(report.d040.d063ReferenceBandCanGenerateDefaultTriplet, false);
  assert.equal(report.d040.d063ReferenceBandCreatesGoalVersion, false);
  assert.equal(report.d040.d063ReferenceBandCanTriggerScoringDiagnosisOrCorrection, false);
  assert.equal(report.d040.d063UserDefinedRequiresD070, true);
  assert.equal(report.d040.d063DisplayAndRoundingRequiresD071, true);
  assert.equal(report.d040.d063HardStopRecordAvailabilityRequiresD072, true);
  assert.equal(report.d040.d063D068D069PrerequisitesPassed, false);
  assert.equal(report.d040.d063SelfReviewPassed, true);
  assert.equal(report.d040.d063HealthReviewerAssigned, false);
  assert.equal(report.d040.d063HealthContentApproved, false);
  assert.equal(report.d040.d063ContentQaPassed, false);
  assert.equal(report.d040.d063CardRegisteredInDecisionLedger, false);
  assert.equal(report.d040.d063OwnerReady, false);
  assert.equal(report.d040.macroCardIndependentReviewPassed, false);
  assert.equal(report.d040.d063OwnerReviewAuthorized, false);
  assert.equal(report.d040.d063MacroImplementationAuthorized, false);
  assert.equal(report.d040.d070CardState, "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY");
  assert.equal(report.d040.d070DecisionId, "D-070");
  assert.equal(report.d040.d070QuestionId, "d070_custom_macro_input_shape");
  assert.equal(report.d040.d070ApplicableWhen, "D-063 = user_defined_macro_target");
  assert.equal(report.d040.d070CardCount, 1);
  assert.equal(report.d040.d070OptionCount, 3);
  assert.deepEqual(report.d040.d070OptionIds, [
    "complete_macro_grams",
    "fixed_100_percent_triplet",
    "partial_macro_grams_explicit_missing",
  ]);
  assert.equal(report.d040.d070RecommendedOptionId, "complete_macro_grams");
  assert.equal(report.d040.d070InputShapesMutuallyExclusive, true);
  assert.equal(report.d040.d070PercentAllThreeRequired, true);
  assert.equal(report.d040.d070PercentSumRequired, 100);
  assert.equal(report.d040.d070CompleteGramsAllThreeRequired, true);
  assert.deepEqual(report.d040.d070PartialGramsSetCountRange, [1, 2]);
  assert.equal(report.d040.d070MissingMacroTreatedAsZero, false);
  assert.equal(report.d040.d070ResidualAutoFilled, false);
  assert.equal(report.d040.d070MixedInputShapesAllowed, false);
  assert.equal(report.d040.d070PercentToGramRequiresEnergyTarget, true);
  assert.equal(report.d040.d070ConversionSelectsTarget, false);
  assert.equal(report.d040.d070ActualEnergyMismatchIsDataError, false);
  assert.equal(report.d040.d070NumericHealthBoundsApproved, false);
  assert.equal(report.d040.d070D063Accepted, false);
  assert.equal(report.d040.d070D068D069PrerequisitesPassed, false);
  assert.equal(report.d040.d070SelfReviewPassed, true);
  assert.equal(report.d040.d070HealthContentApproved, false);
  assert.equal(report.d040.d070ContentQaPassed, false);
  assert.equal(report.d040.d070IndependentReviewPassed, false);
  assert.equal(report.d040.d070CardRegisteredInDecisionLedger, false);
  assert.equal(report.d040.d070OwnerReady, false);
  assert.equal(report.d040.d070OwnerReviewAuthorized, false);
  assert.equal(report.d040.d070MacroConversionImplementationAuthorized, false);
  assert.equal(report.d040.d070PersistenceImplementationAuthorized, false);
  assert.equal(report.d040.d071CardState, "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY");
  assert.equal(report.d040.d071DecisionId, "D-071");
  assert.equal(report.d040.d071QuestionId, "d071_macro_display_rounding");
  assert.equal(report.d040.d071CardCount, 1);
  assert.equal(report.d040.d071OptionCount, 3);
  assert.deepEqual(report.d040.d071OptionIds, [
    "source_primary_optional_derived_one_decimal",
    "source_unit_only_one_decimal",
    "source_primary_optional_derived_two_decimals",
  ]);
  assert.equal(report.d040.d071RecommendedOptionId, "source_primary_optional_derived_one_decimal");
  assert.equal(report.d040.d071ReferenceBandInformationOnly, true);
  assert.equal(report.d040.d071ReferenceBandDerivedGramsAllowed, false);
  assert.equal(report.d040.d071SourceUnitAlwaysPreserved, true);
  assert.equal(report.d040.d071DerivedUnitRequiresExplicitInputs, true);
  assert.equal(report.d040.d071DisplayDecimalRoundingMode, "ROUND_HALF_UP");
  assert.equal(report.d040.d071RecommendedDecimalPlaces, 1);
  assert.equal(report.d040.d071HighPrecisionDecimalPlaces, 2);
  assert.equal(report.d040.d071RawValuesAuthoritative, true);
  assert.equal(report.d040.d071DisplayValuesPersistedAsGoal, false);
  assert.equal(report.d040.d071ConversionsUseDisplayRoundedValues, false);
  assert.equal(report.d040.d071ResidualAllocatedToMacro, false);
  assert.equal(report.d040.d071DisplayedPercentTripletForcedTo100, false);
  assert.equal(report.d040.d071RoundingDisclosureRequired, true);
  assert.equal(report.d040.d071ActualEnergyMismatchTreatedAsRoundingResidual, false);
  assert.equal(report.d040.d071EnergyRoundingPolicyReused, false);
  assert.equal(report.d040.d071NumericHealthBoundsApproved, false);
  assert.equal(report.d040.d071D063Accepted, false);
  assert.equal(report.d040.d071D070Accepted, false);
  assert.equal(report.d040.d071D068D069PrerequisitesPassed, false);
  assert.equal(report.d040.d071SelfReviewPassed, true);
  assert.equal(report.d040.d071HealthContentApproved, false);
  assert.equal(report.d040.d071ContentQaPassed, false);
  assert.equal(report.d040.d071IndependentReviewPassed, false);
  assert.equal(report.d040.d071CardRegisteredInDecisionLedger, false);
  assert.equal(report.d040.d071OwnerReady, false);
  assert.equal(report.d040.d071OwnerReviewAuthorized, false);
  assert.equal(report.d040.d071MacroDisplayImplementationAuthorized, false);
  assert.equal(report.d040.d071PersistenceImplementationAuthorized, false);
  assert.equal(report.d040.healthReviewPacketReady, true);
  assert.equal(report.d040.healthReviewRequiredArtifactCount, 9);
  assert.equal(report.d040.healthReviewRequiredItemCount, 13);
  assert.equal(report.d040.healthReviewCopyItemCount, 6);
  assert.equal(report.d040.healthReviewBoundaryItemCount, 7);
  assert.equal(report.d040.healthReviewDispositionCount, 4);
  assert.equal(report.d040.healthReviewQualificationFieldCount, 9);
  assert.equal(report.d040.healthReviewFormalReviewFieldCount, 21);
  assert.equal(report.d040.healthReviewImmutableArtifactRefsRequired, true);
  assert.equal(report.d040.healthReviewContentQaIndependentGateRequired, true);
  assert.equal(report.d040.healthReviewSensitiveCredentialDocumentsStored, false);
  assert.equal(report.d040.healthReviewAiOrAgentCanBeReviewer, false);
  assert.equal(report.d040.healthReviewExternalMessageSent, false);
  assert.equal(report.d040.healthReviewerNameRecorded, false);
  assert.equal(report.d040.healthReviewerQualificationVerified, false);
  assert.equal(report.d040.healthReviewerConflictOfInterestResolved, false);
  assert.equal(report.d040.healthReviewStarted, false);
  assert.equal(report.d040.healthReviewPacketHealthContentApproved, false);
  assert.equal(report.d040.healthReviewPacketContentQaPassed, false);
  assert.equal(report.d040.healthReviewPacketD068OwnerReady, false);
  assert.equal(report.d040.healthReviewPacketD069OwnerReady, false);
  assert.equal(report.d040.healthReviewPacketD063OwnerReady, false);
  assert.equal(report.d040.healthReviewPacketFirstThreeBatchesIndependentReviewPassed, false);
  assert.equal(report.d040.healthReviewPacketHealthCopyImplementationAuthorized, false);
  assert.equal(report.d040.healthReviewPacketFormulaImplementationAuthorized, false);
  assert.equal(report.d040.independentReviewPacketReady, true);
  assert.equal(report.d040.independentReviewRequiredArtifactCount, 7);
  assert.equal(report.d040.independentReviewRequiredCardCount, 13);
  assert.equal(report.d040.independentReviewCardDecisionCount, 13);
  assert.equal(report.d040.independentReviewRequiredDomainCount, 4);
  assert.equal(report.d040.independentReviewDomainCount, 4);
  assert.equal(report.d040.independentReviewRequiredInvariantCount, 12);
  assert.equal(report.d040.independentReviewDispositionCount, 4);
  assert.equal(report.d040.independentReviewBlockingSeverityCount, 3);
  assert.equal(report.d040.independentReviewNamedReviewerRequired, true);
  assert.equal(report.d040.independentReviewAuthorOrPmCanSelfApprove, false);
  assert.equal(report.d040.independentReviewAiOrAgentCanBeReviewer, false);
  assert.equal(report.d040.independentReviewExternalMessageSent, false);
  assert.equal(report.d040.independentReviewReviewersAssigned, false);
  assert.equal(report.d040.independentReviewIdentityVerified, false);
  assert.equal(report.d040.independentReviewIndependenceVerified, false);
  assert.equal(report.d040.independentReviewConflictResolved, false);
  assert.equal(report.d040.independentReviewStarted, false);
  assert.equal(report.d040.independentReviewPassed, false);
  assert.equal(report.d040.independentReviewFindingCountsMeasured, false);
  assert.equal(report.d040.independentReviewDynamicModelOptionOwnerReady, false);
  assert.equal(report.d040.independentReviewHealthReviewStillRequired, true);
  assert.equal(report.d040.independentReviewHealthContentApproved, false);
  assert.equal(report.d040.independentReviewFirstThreeBatchesPassed, false);
  assert.equal(report.d040.independentReviewPersistenceImplementationAuthorized, false);
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

  const d031Model = validModel();
  d031Model.events.find((record) => record.value.eventId === "EVT-20260817-001").value.data.rawProviderResponsePersisted = true;
  const d031Report = reconcileProjectOps(d031Model);
  assert.equal(d031Report.ok, false);
  assert.ok(d031Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D031_GATE"));

  const d033Model = validModel();
  d033Model.events.find((record) => record.value.eventId === "EVT-20260817-002").value.data.confirmationTokenReusable = true;
  const d033Report = reconcileProjectOps(d033Model);
  assert.equal(d033Report.ok, false);
  assert.ok(d033Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D033_GATE"));

  const d034Model = validModel();
  d034Model.events.find((record) => record.value.eventId === "EVT-20260817-003").value.data.providerCanOnlyTighten = false;
  const d034Report = reconcileProjectOps(d034Model);
  assert.equal(d034Report.ok, false);
  assert.ok(d034Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D034_GATE"));

  const d036Model = validModel();
  d036Model.events.find((record) => record.value.eventId === "EVT-20260820-001").value.data.ephemeralAloneConsideredSufficientIsolation = true;
  const d036Report = reconcileProjectOps(d036Model);
  assert.equal(d036Report.ok, false);
  assert.ok(d036Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D036_GATE"));

  const d053Model = validModel();
  d053Model.events.find((record) => record.value.eventId === "EVT-20260820-002").value.data.appleProhibitedUsesOwnerWaivable = true;
  const d053Report = reconcileProjectOps(d053Model);
  assert.equal(d053Report.ok, false);
  assert.ok(d053Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D053_GATE"));

  const d040EnergyModel = validModel();
  d040EnergyModel.events.find((record) => record.value.eventId === "EVT-20260820-003").value.data.silentDefaultPalAllowed = true;
  const d040EnergyReport = reconcileProjectOps(d040EnergyModel);
  assert.equal(d040EnergyReport.ok, false);
  assert.ok(d040EnergyReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const d040LifecycleModel = validModel();
  d040LifecycleModel.events.find((record) => record.value.eventId === "EVT-20260820-004").value.data.historicalDiaryRecalculationAllowed = true;
  const d040LifecycleReport = reconcileProjectOps(d040LifecycleModel);
  assert.equal(d040LifecycleReport.ok, false);
  assert.ok(d040LifecycleReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const d040ChinaHealthModel = validModel();
  d040ChinaHealthModel.events.find((record) => record.value.eventId === "EVT-20260820-005").value.data.healthReviewerAssigned = true;
  const d040ChinaHealthReport = reconcileProjectOps(d040ChinaHealthModel);
  assert.equal(d040ChinaHealthReport.ok, false);
  assert.ok(d040ChinaHealthReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const d040ChinaMacroModel = validModel();
  d040ChinaMacroModel.events.find((record) => record.value.eventId === "EVT-20260820-006").value.data.rangeEndpointsCanGenerateDefaultTriplet = true;
  const d040ChinaMacroReport = reconcileProjectOps(d040ChinaMacroModel);
  assert.equal(d040ChinaMacroReport.ok, false);
  assert.ok(d040ChinaMacroReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const d040NiddkDynamicModel = validModel();
  d040NiddkDynamicModel.events.find((record) => record.value.eventId === "EVT-20260820-007").value.data.dynamicModelOptionOwnerReady = true;
  const d040NiddkDynamicModelReport = reconcileProjectOps(d040NiddkDynamicModel);
  assert.equal(d040NiddkDynamicModelReport.ok, false);
  assert.ok(d040NiddkDynamicModelReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const d040HealthReviewerPacketModel = validModel();
  d040HealthReviewerPacketModel.events.find((record) => record.value.eventId === "EVT-20260820-008").value.data.healthContentApproved = true;
  const d040HealthReviewerPacketReport = reconcileProjectOps(d040HealthReviewerPacketModel);
  assert.equal(d040HealthReviewerPacketReport.ok, false);
  assert.ok(d040HealthReviewerPacketReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const d040IndependentReviewPacketModel = validModel();
  d040IndependentReviewPacketModel.events.find((record) => record.value.eventId === "EVT-20260821-001").value.data.independentReviewPassed = true;
  const d040IndependentReviewPacketReport = reconcileProjectOps(d040IndependentReviewPacketModel);
  assert.equal(d040IndependentReviewPacketReport.ok, false);
  assert.ok(d040IndependentReviewPacketReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const d063CardModel = validModel();
  d063CardModel.events.find((record) => record.value.eventId === "EVT-20260821-002").value.data.referenceBandCreatesGoalVersion = true;
  const d063CardReport = reconcileProjectOps(d063CardModel);
  assert.equal(d063CardReport.ok, false);
  assert.ok(d063CardReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const d070CardModel = validModel();
  d070CardModel.events.find((record) => record.value.eventId === "EVT-20260821-003").value.data.missingMacroTreatedAsZero = true;
  const d070CardReport = reconcileProjectOps(d070CardModel);
  assert.equal(d070CardReport.ok, false);
  assert.ok(d070CardReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const d071CardModel = validModel();
  d071CardModel.events.find((record) => record.value.eventId === "EVT-20260821-004").value.data.residualAllocatedToMacro = true;
  const d071CardReport = reconcileProjectOps(d071CardModel);
  assert.equal(d071CardReport.ok, false);
  assert.ok(d071CardReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));
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
