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
    events: 227,
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
  assert.equal(report.d039.b03B05ReviewPacketEventId, "EVT-20260821-009");
  assert.equal(report.d039.b03B05ReviewPacketReady, true);
  assert.equal(report.d039.b03B05ReviewPacketVersion, "PACKET-001-R1");
  assert.equal(report.d039.b03B05InputManifestFrozen, true);
  assert.equal(report.d039.b03B05InputManifestEntryCount, 10);
  assert.equal(
    report.d039.b03B05InputManifestCommit,
    "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117",
  );
  assert.equal(
    report.d039.b03B05InputManifestRecordCommit,
    "19f2119abcd8ca25bf59b177910a5af1f34e9abb",
  );
  assert.equal(report.d039.b03B05InputManifestGitBlobOidAlgorithm, "SHA-1");
  assert.equal(report.d039.b03B05InputManifestCanonicalDigestAlgorithm, "SHA-256");
  assert.equal(report.d039.b03B05InputManifestUsesRawGitBlobBytes, true);
  assert.equal(report.d039.b03B05InputManifestFrozenArtifactRefs.length, 10);
  assert.equal(report.d039.b03B05InputManifestSourcePacketEventId, "EVT-20260821-008");
  assert.equal(report.d039.b03B05RequiredArtifactCount, 10);
  assert.equal(report.d039.b03B05RequiredCardCount, 6);
  assert.equal(report.d039.b03B05RequiredBlockerCount, 3);
  assert.deepEqual(report.d039.b03B05BlockerIds, [
    "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05",
  ]);
  assert.deepEqual(report.d039.b03B05CardDecisionIds, [
    "D-045", "D-031", "D-033", "D-034", "D-036", "D-053",
  ]);
  assert.equal(report.d039.b03B05RequiredReviewerDomainCount, 4);
  assert.equal(report.d039.b03B05RequiredCrossCardInvariantCount, 16);
  assert.equal(report.d039.b03B05AllowedCardDispositionCount, 4);
  assert.deepEqual(report.d039.b03B05BlockingSeverityIds, ["P0", "P1", "P2"]);
  assert.equal(report.d039.b03B05NonBlockingSeverityId, "P3");
  assert.equal(report.d039.b03B05NamedReviewerRequired, true);
  assert.equal(report.d039.b03B05AuthorOrPmCanSelfApprove, false);
  assert.equal(report.d039.b03B05AiOrAgentCanBeIndependentReviewer, false);
  assert.equal(report.d039.b03B05ExternalMessageSent, false);
  assert.equal(report.d039.b03B05ReviewersAssigned, false);
  assert.equal(report.d039.b03B05IndependentReviewStarted, false);
  assert.equal(report.d039.b03B05IndependentReviewPassed, false);
  assert.equal(report.d039.d034DeviceBenchmarkPassed, false);
  assert.equal(report.d039.d036ProviderCompatibilitySpikePassed, false);
  assert.equal(report.d039.d036NativeBoundaryEvidencePassed, false);
  assert.equal(report.d039.d053ProviderEvidenceReady, false);
  assert.equal(report.d039.d053AppPrivacyMappingApproved, false);
  assert.equal(report.d039.b03Closed, false);
  assert.equal(report.d039.b04Closed, false);
  assert.equal(report.d039.b05Closed, false);
  assert.equal(report.d039.b03B05OwnerCardsScheduled, false);
  assert.equal(report.d039.b03B05FormalImplementationAuthorized, false);
  assert.equal(report.d039.b03B05Px5ImplementationDorSatisfied, false);
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
  assert.equal(report.d034.benchmarkProtocolEventId, "EVT-20260821-010");
  assert.equal(report.d034.benchmarkProtocolState, "PROTOCOL_READY");
  assert.equal(
    report.d034.benchmarkProtocolNext,
    "D034_BENCHMARK_AUTHORIZATION_DEVICE_AND_TOOLCHAIN_REQUIRED",
  );
  assert.equal(report.d034.benchmarkSourcePacketVersion, "PACKET-001-R1");
  assert.equal(report.d034.benchmarkSourceCardInputFrozen, true);
  assert.equal(
    report.d034.benchmarkSourceCardCommit,
    "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117",
  );
  assert.equal(
    report.d034.benchmarkProtocolArtifactCommit,
    "f2084a106d7a8e4c4a612278fb13372c747fa622",
  );
  assert.equal(report.d034.benchmarkProfileCount, 3);
  assert.equal(report.d034.benchmarkProfileMatrixRowCount, 21);
  assert.equal(report.d034.benchmarkDirectHardLimitCount, 19);
  assert.equal(report.d034.benchmarkCompanionControlCount, 2);
  assert.equal(report.d034.benchmarkDirectLimitScenarioMinimum, 38);
  assert.equal(report.d034.benchmarkMeasuredRepetitionMinimum, 10);
  assert.equal(report.d034.benchmarkSameCorpusAcrossProfilesRequired, true);
  assert.equal(report.d034.benchmarkRawRunValuesRequired, true);
  assert.equal(report.d034.minimumPhysicalDeviceResolved, false);
  assert.equal(report.d034.macAndSupportedXcodeAvailable, false);
  assert.equal(report.d034.isolatedNativeHarnessAuthorized, false);
  assert.equal(report.d034.benchmarkCorpusMaterialized, false);
  assert.equal(report.d034.benchmarkExecutionStarted, false);
  assert.equal(report.d034.benchmarkResultRecorded, false);
  assert.equal(report.d034.benchmarkProtocolDevicePassed, false);
  assert.equal(report.d034.benchmarkNamedSecurityReviewerAssigned, false);
  assert.equal(report.d034.benchmarkNamedQaReviewerAssigned, false);
  assert.equal(report.d034.benchmarkProtocolIndependentReviewPassed, false);
  assert.equal(report.d034.benchmarkExternalMessageSent, false);
  assert.equal(report.d034.benchmarkProtocolOwnerReviewAuthorized, false);
  assert.equal(report.d034.benchmarkB05Closed, false);
  assert.equal(report.d034.benchmarkProtocolFormalImplementationAuthorized, false);
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
  assert.equal(report.d036.protocolEventId, "EVT-20260821-011");
  assert.equal(report.d036.protocolState, "PROTOCOL_READY");
  assert.equal(report.d036.protocolNext, "D036_OI07_SPIKE_AUTHORIZATION_AND_MAC_TOOLCHAIN_REQUIRED");
  assert.equal(report.d036.protocolSourcePacketVersion, "PACKET-001-R1");
  assert.equal(report.d036.protocolSourceCardInputFrozen, true);
  assert.equal(report.d036.protocolProviderTargetCount, 3);
  assert.equal(report.d036.protocolCandidateProfileCount, 3);
  assert.equal(report.d036.protocolRequiredCompatibilityCellCount, 36);
  assert.equal(report.d036.protocolNativeBoundarySurfaceCount, 13);
  assert.equal(report.d036.protocolOfflineRepetitionMinimum, 10);
  assert.equal(report.d036.protocolProviderPathRepetitionMinimum, 3);
  assert.equal(report.d036.protocolOi07Complete, false);
  assert.equal(report.d036.protocolProviderTargetsResolved, false);
  assert.equal(report.d036.protocolMacAvailable, false);
  assert.equal(report.d036.protocolHarnessAuthorized, false);
  assert.equal(report.d036.protocolNetworkSpikeAuthorized, false);
  assert.equal(report.d036.protocolExecutionStarted, false);
  assert.equal(report.d036.protocolCompatibilityPassed, false);
  assert.equal(report.d036.protocolNativeEvidencePassed, false);
  assert.equal(report.d036.protocolIndependentReviewPassed, false);
  assert.equal(report.d036.protocolOwnerReviewAuthorized, false);
  assert.equal(report.d036.protocolB05Closed, false);
  assert.equal(report.d036.protocolRealNetworkAuthorized, false);
  assert.equal(report.d036.protocolFormalImplementationAuthorized, false);
  assert.equal(report.d036.reportContractEventId, "EVT-20260827-001");
  assert.equal(
    report.d036.reportContractStatus,
    "CONTRACT_READY / OI07_REQUIRED / NO_RUNS / NO_REPORT / EXECUTION_NOT_AUTHORIZED",
  );
  assert.equal(
    report.d036.reportContractArtifactCommit,
    "458d81e5feec32fee9ebc887dc3f4d65e5724f40",
  );
  assert.equal(report.d036.reportContractRequiredCompatibilityCellCount, 36);
  assert.equal(report.d036.reportContractRequiredFormalAttemptMinimum, 324);
  assert.equal(report.d036.reportContractRequiredFormalOfflineResultCount, 108);
  assert.equal(report.d036.reportContractRequiredFormalNativeBoundaryResultCount, 39);
  assert.equal(report.d036.reportContractValidatorImplemented, false);
  assert.equal(report.d036.reportContractAttemptRecordCount, 0);
  assert.equal(report.d036.reportContractCompatibilityReportRecorded, false);
  assert.equal(report.d036.reportContractNativeBoundaryEvidenceRecorded, false);
  assert.equal(report.d036.reportHarnessEventId, "EVT-20260827-002");
  assert.equal(report.d036.reportHarnessStatus, "SPIKE / LOCAL_ONLY / NON_PRODUCTION");
  assert.equal(report.d036.reportHarnessArtifactState, "WORKTREE_UNCOMMITTED");
  assert.equal(report.d036.reportHarnessArtifactCommitRecorded, false);
  assert.equal(report.d036.reportHarnessTopLevelTests, 20);
  assert.equal(report.d036.reportHarnessToolSuitePassed, 909);
  assert.equal(report.d036.reportHarnessRequiredCompatibilityCellCount, 36);
  assert.equal(report.d036.reportHarnessRequiredFormalAttemptMinimum, 324);
  assert.equal(report.d036.reportHarnessRequiredFormalOfflineResultCount, 108);
  assert.equal(report.d036.reportHarnessRequiredFormalNativeBoundaryResultCount, 39);
  assert.equal(report.d036.reportHarnessContractValidatorImplemented, true);
  assert.equal(report.d036.reportHarnessOi07Reads, 0);
  assert.equal(report.d036.reportHarnessProviderDocumentReads, 0);
  assert.equal(report.d036.reportHarnessAttemptRecordReads, 0);
  assert.equal(report.d036.reportHarnessAttemptRecordWrites, 0);
  assert.equal(report.d036.reportHarnessNetworkRequests, 0);
  assert.equal(report.d036.reportHarnessProviderRequests, 0);
  assert.equal(report.d036.reportHarnessAttemptRecordCount, 0);
  assert.equal(report.d036.reportHarnessCompatibilityReportRecorded, false);
  assert.equal(report.d036.reportHarnessNativeBoundaryEvidenceRecorded, false);
  assert.equal(report.d036.reportHarnessExecutionStarted, false);
  assert.equal(report.d036.reportHarnessCompatibilityPassed, false);
  assert.equal(report.d036.reportHarnessNativeEvidencePassed, false);
  assert.equal(report.d036.reportHarnessIndependentReviewPassed, false);
  assert.equal(report.d036.reportHarnessOwnerReviewAuthorized, false);
  assert.equal(report.d036.reportHarnessB05Closed, false);
  assert.equal(report.d036.reportHarnessFormalImplementationAuthorized, false);
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
  assert.equal(report.d053.protocolEventId, "EVT-20260821-012");
  assert.equal(report.d053.protocolState, "PROTOCOL_READY");
  assert.equal(
    report.d053.protocolNext,
    "D053_OI07_PROVIDER_EVIDENCE_AND_APP_PRIVACY_MAPPING_REQUIRED",
  );
  assert.equal(report.d053.protocolSourcePacketVersion, "PACKET-001-R1");
  assert.equal(report.d053.protocolSourceCardInputFrozen, true);
  assert.equal(report.d053.protocolProviderTargetCount, 3);
  assert.equal(report.d053.protocolPayloadClassCount, 5);
  assert.equal(report.d053.protocolMinimumAdmissionProfileCount, 15);
  assert.equal(report.d053.protocolEvidenceDimensionCount, 10);
  assert.equal(report.d053.protocolRequiredDimensionAssessmentCount, 150);
  assert.equal(report.d053.protocolAppPrivacyMappingRowMinimum, 5);
  assert.equal(report.d053.protocolApplePolicySourceCount, 3);
  assert.equal(report.d053.protocolOi07Complete, false);
  assert.equal(report.d053.protocolProviderTargetsResolved, false);
  assert.equal(report.d053.protocolEvidenceCollectionAuthorized, false);
  assert.equal(report.d053.protocolEvidenceCollectionStarted, false);
  assert.equal(report.d053.protocolSourceSnapshotsRecorded, false);
  assert.equal(report.d053.protocolAdmissionProfilesRecorded, 0);
  assert.equal(report.d053.protocolDimensionAssessmentsRecorded, 0);
  assert.equal(report.d053.protocolAppPrivacyMappingStarted, false);
  assert.equal(report.d053.protocolAppPrivacyMappingRowCount, 0);
  assert.equal(report.d053.protocolAppPrivacyMappingSigned, false);
  assert.equal(report.d053.protocolNamedSignersAssigned, false);
  assert.equal(report.d053.protocolIndependentReviewPassed, false);
  assert.equal(report.d053.protocolProviderEvidencePassed, false);
  assert.equal(report.d053.protocolProviderAdmissionRecords, 0);
  assert.equal(report.d053.protocolAllProviderPayloadProfiles, "UNKNOWN_BLOCKED");
  assert.equal(report.d053.protocolLedgerCandidatePreserved, true);
  assert.equal(report.d053.protocolOwnerReviewAuthorized, false);
  assert.equal(report.d053.protocolB05Closed, false);
  assert.equal(report.d053.protocolRealNetworkAuthorized, false);
  assert.equal(report.d053.protocolFormalImplementationAuthorized, false);
  assert.equal(report.d053.reportContractEventId, "EVT-20260827-003");
  assert.equal(
    report.d053.reportContractStatus,
    "CONTRACT_READY / OI07_REQUIRED / NO_PROVIDER_EVIDENCE / NO_MAPPING / NO_ADMISSION",
  );
  assert.equal(report.d053.reportContractArtifactState, "WORKTREE_UNCOMMITTED");
  assert.equal(report.d053.reportContractArtifactCommitRecorded, false);
  assert.equal(report.d053.reportContractProviderTargetCount, 3);
  assert.equal(report.d053.reportContractPayloadClassCount, 5);
  assert.equal(report.d053.reportContractAdmissionProfileCount, 15);
  assert.equal(report.d053.reportContractRequiredDimensionAssessmentCount, 150);
  assert.equal(report.d053.reportContractRequiredPolicyPackageComparisonCount, 45);
  assert.equal(report.d053.reportContractFormalCompleteStillRequiresEvidenceReview, true);
  assert.equal(report.d053.reportContractProviderEvidenceCollectionStarted, false);
  assert.equal(report.d053.reportContractAppPrivacyMappingSigned, false);
  assert.equal(report.d053.reportContractIndependentReviewPassed, false);
  assert.equal(report.d053.reportContractD053Accepted, false);
  assert.equal(report.d053.reportContractProviderAdmissionGranted, false);
  assert.equal(report.d053.reportContractSendAuthorization, "NOT_GRANTED");
  assert.equal(report.d053.reportContractB05Closed, false);
  assert.equal(report.d053.reportContractFormalImplementationAuthorized, false);
  assert.equal(report.d053.reportHarnessEventId, "EVT-20260827-004");
  assert.equal(report.d053.reportHarnessStatus, "SPIKE / LOCAL_ONLY / NON_PRODUCTION / NO_ADMISSION");
  assert.equal(report.d053.reportHarnessArtifactState, "WORKTREE_UNCOMMITTED");
  assert.equal(report.d053.reportHarnessArtifactCommitRecorded, false);
  assert.equal(report.d053.reportHarnessTopLevelTests, 19);
  assert.equal(report.d053.reportHarnessProviderTargetCount, 3);
  assert.equal(report.d053.reportHarnessPayloadClassCount, 5);
  assert.equal(report.d053.reportHarnessAdmissionProfileCount, 15);
  assert.equal(report.d053.reportHarnessRequiredDimensionAssessmentCount, 150);
  assert.equal(report.d053.reportHarnessRequiredPolicyPackageComparisonCount, 45);
  assert.equal(report.d053.reportHarnessSupportedIncompatibleDerivationEnforced, true);
  assert.equal(report.d053.reportHarnessOpenConflictKeepsUnknown, true);
  assert.equal(report.d053.reportHarnessAExpiryWindowDays, 90);
  assert.equal(report.d053.reportHarnessBExpiryWindowDays, 30);
  assert.equal(report.d053.reportHarnessCNotOwnerReadyAndNotAssessed, true);
  assert.equal(report.d053.reportHarnessProviderValuesReturned, false);
  assert.equal(report.d053.reportHarnessOi07Reads, 0);
  assert.equal(report.d053.reportHarnessProviderDocumentReads, 0);
  assert.equal(report.d053.reportHarnessSourceSnapshotReads, 0);
  assert.equal(report.d053.reportHarnessSignatureReads, 0);
  assert.equal(report.d053.reportHarnessIndependentReviewReads, 0);
  assert.equal(report.d053.reportHarnessReportWrites, 0);
  assert.equal(report.d053.reportHarnessNetworkRequests, 0);
  assert.equal(report.d053.reportHarnessProviderRequests, 0);
  assert.equal(report.d053.reportHarnessProviderEvidenceCollectionStarted, false);
  assert.equal(report.d053.reportHarnessAppPrivacyMappingSigned, false);
  assert.equal(report.d053.reportHarnessNamedSignersVerified, false);
  assert.equal(report.d053.reportHarnessIndependentReviewPassed, false);
  assert.equal(report.d053.reportHarnessD053Accepted, false);
  assert.equal(report.d053.reportHarnessD053PassCandidate, false);
  assert.equal(report.d053.reportHarnessProviderAdmissionGranted, false);
  assert.equal(report.d053.reportHarnessSendAuthorization, "NOT_GRANTED");
  assert.equal(report.d053.reportHarnessB05Closed, false);
  assert.equal(report.d053.reportHarnessFormalImplementationAuthorized, false);
  assert.equal(report.d053.registeredInDecisionLedger, true);
  assert.equal(report.d053.ownerResponseCount, 0);
  assert.equal(report.oi07.eventId, "EVT-20260821-013");
  assert.equal(report.oi07.state, "completed");
  assert.equal(report.oi07.templateState, "TEMPLATE_READY");
  assert.equal(report.oi07.next, "OI07_OWNER_OR_AUTHORIZED_CONTACT_INPUT_REQUIRED");
  assert.deepEqual(report.oi07.decisionIds, ["D-036", "D-053"]);
  assert.equal(
    report.oi07.templateArtifactCommit,
    "46e22ced7be0c5940fe5f5e4860f73817c6b0d52",
  );
  assert.equal(report.oi07.providerTargetCount, 3);
  assert.equal(report.oi07.perTargetFieldCount, 29);
  assert.equal(report.oi07.sharedPerTargetFieldCount, 12);
  assert.equal(report.oi07.d036OnlyPerTargetFieldCount, 8);
  assert.equal(report.oi07.d053OnlyPerTargetFieldCount, 9);
  assert.equal(report.oi07.unionInputFieldCount, 30);
  assert.equal(report.oi07.sameRevisionRequiredForD036AndD053, true);
  assert.equal(report.oi07.unknownAllowedButBlocks, true);
  assert.equal(report.oi07.naRequiresReasonAndSource, true);
  assert.equal(report.oi07.secretFreeInputRequired, true);
  assert.equal(report.oi07.ownerOrAuthorizedContactRequired, true);
  assert.equal(report.oi07.oi07RevisionAssigned, false);
  assert.equal(report.oi07.ownerInputReceived, false);
  assert.equal(report.oi07.inputAuthorityVerified, false);
  assert.equal(report.oi07.providerTargetsResolved, false);
  assert.equal(report.oi07.allProviderTargets, "UNKNOWN_BLOCKED");
  assert.equal(report.oi07.credentialsReceived, false);
  assert.equal(report.oi07.credentialInjectionAuthorized, false);
  assert.equal(report.oi07.testCostAuthorized, false);
  assert.equal(report.oi07.realNetworkAuthorized, false);
  assert.equal(report.oi07.providerEvidenceCollectionAuthorized, false);
  assert.equal(report.oi07.externalMessageSent, false);
  assert.equal(report.oi07.ownerIntakeChanged, false);
  assert.equal(report.oi07.d036ExecutionAuthorized, false);
  assert.equal(report.oi07.d053EvidenceCollectionStarted, false);
  assert.equal(report.oi07.d053AdmissionRecords, 0);
  assert.equal(report.oi07.ownerReviewAuthorized, false);
  assert.equal(report.oi07.b05Closed, false);
  assert.equal(report.oi07.formalImplementationAuthorized, false);
  assert.equal(report.oi07Harness.eventId, "EVT-20260821-014");
  assert.equal(report.oi07Harness.contractStatus, "SPIKE / LOCAL_ONLY / NON_PRODUCTION");
  assert.equal(report.oi07Harness.templateEventId, "EVT-20260821-013");
  assert.equal(
    report.oi07Harness.artifactCommit,
    "20f228586617d03449d840897cf223a9d87dfdc8",
  );
  assert.equal(report.oi07Harness.inputSchemaVersion, "OI07_PROVIDER_TARGET_INTAKE_INPUT_V1");
  assert.equal(report.oi07Harness.resultSchemaVersion, "OI07_PROVIDER_TARGET_INTAKE_RESULT_V1");
  assert.equal(report.oi07Harness.boundarySchemaVersion, "OI07_PROVIDER_TARGET_INTAKE_BOUNDARY_V1");
  assert.equal(report.oi07Harness.topLevelTests, 11);
  assert.equal(report.oi07Harness.fullSuitePassed, 930);
  assert.equal(report.oi07Harness.providerTargetCount, 3);
  assert.equal(report.oi07Harness.perTargetFieldCount, 29);
  assert.equal(report.oi07Harness.unionInputFieldCount, 30);
  assert.deepEqual(report.oi07Harness.dispositions, [
    "STRUCTURALLY_COMPLETE_INTAKE_ONLY",
    "PARTIAL_UNKNOWN_BLOCKED",
  ]);
  assert.equal(report.oi07Harness.d036AndD053CompletenessEvaluatedSeparately, true);
  assert.equal(report.oi07Harness.sharedUnknownBlocksBothConsumers, true);
  assert.equal(report.oi07Harness.sourcedNaRequired, true);
  assert.equal(report.oi07Harness.concreteTargetIdentityAllowsNa, false);
  assert.equal(report.oi07Harness.sensitiveLookingMaterialRejectedWithoutEcho, true);
  assert.equal(report.oi07Harness.onlyCountsStatesAndFingerprintsReturned, true);
  assert.equal(report.oi07Harness.providerInputValuesReturned, false);
  assert.equal(report.oi07Harness.syntheticFixtureOnly, true);
  assert.equal(report.oi07Harness.inputAuthorityCallerAssertedNotVerified, true);
  assert.equal(report.oi07Harness.providerFactsVerified, false);
  assert.equal(report.oi07Harness.sourceUrlsFetched, false);
  assert.equal(report.oi07Harness.oi07RevisionAssigned, false);
  assert.equal(report.oi07Harness.ownerInputReceived, false);
  assert.equal(report.oi07Harness.providerTargetsResolved, false);
  assert.equal(report.oi07Harness.allProviderTargets, "UNKNOWN_BLOCKED");
  assert.equal(report.oi07Harness.credentialMaterialReads, 0);
  assert.equal(report.oi07Harness.testCostAuthorized, false);
  assert.equal(report.oi07Harness.transportsCreated, 0);
  assert.equal(report.oi07Harness.realNetworkRequests, 0);
  assert.equal(report.oi07Harness.providerEvidenceCollectionAuthorized, false);
  assert.equal(report.oi07Harness.ownerIntakeChanged, false);
  assert.equal(report.oi07Harness.d036ExecutionAuthorized, false);
  assert.equal(report.oi07Harness.d053EvidenceCollectionStarted, false);
  assert.equal(report.oi07Harness.d053AdmissionRecords, 0);
  assert.equal(report.oi07Harness.ownerReviewAuthorized, false);
  assert.equal(report.oi07Harness.b05Closed, false);
  assert.equal(report.oi07Harness.formalImplementationAuthorized, false);
  assert.equal(report.oi07Harness.sendAuthorization, "NOT_GRANTED");
  assert.equal(report.d034CorpusManifestHarness.eventId, "EVT-20260821-015");
  assert.equal(report.d034CorpusManifestHarness.contractStatus, "SPIKE / LOCAL_ONLY / NON_PRODUCTION");
  assert.equal(report.d034CorpusManifestHarness.decisionId, "D-034");
  assert.equal(report.d034CorpusManifestHarness.protocolEventId, "EVT-20260821-010");
  assert.equal(
    report.d034CorpusManifestHarness.artifactCommit,
    "217a632236a12b885f2d6177f10f03f099c45e3c",
  );
  assert.equal(report.d034CorpusManifestHarness.inputSchemaVersion, "D034_BENCHMARK_CORPUS_MANIFEST_INPUT_V1");
  assert.equal(report.d034CorpusManifestHarness.resultSchemaVersion, "D034_BENCHMARK_CORPUS_MANIFEST_RESULT_V1");
  assert.equal(report.d034CorpusManifestHarness.boundarySchemaVersion, "D034_BENCHMARK_CORPUS_MANIFEST_BOUNDARY_V1");
  assert.equal(report.d034CorpusManifestHarness.topLevelTests, 13);
  assert.equal(report.d034CorpusManifestHarness.fullSuitePassed, 947);
  assert.equal(report.d034CorpusManifestHarness.profileCount, 3);
  assert.equal(report.d034CorpusManifestHarness.profileMatrixRowCount, 21);
  assert.equal(report.d034CorpusManifestHarness.directHardLimitCount, 19);
  assert.equal(report.d034CorpusManifestHarness.companionControlCount, 2);
  assert.equal(report.d034CorpusManifestHarness.requiredFixtureSlotCount, 85);
  assert.equal(report.d034CorpusManifestHarness.directLimitFixtureCount, 38);
  assert.equal(report.d034CorpusManifestHarness.structuralDisposition, "STRUCTURALLY_COMPLETE_MANIFEST_ONLY");
  assert.equal(report.d034CorpusManifestHarness.extensionCanReplaceRequired, false);
  assert.equal(report.d034CorpusManifestHarness.imageJpegQualityBoundForAllImageFixtures, true);
  assert.equal(report.d034CorpusManifestHarness.containsRealUserDataAllowed, false);
  assert.equal(report.d034CorpusManifestHarness.containsCredentialAllowed, false);
  assert.equal(report.d034CorpusManifestHarness.fixtureManifestValuesReturned, false);
  assert.equal(report.d034CorpusManifestHarness.fixtureArtifactsCallerAssertedNotVerified, true);
  assert.equal(report.d034CorpusManifestHarness.corpusRevisionAssigned, false);
  assert.equal(report.d034CorpusManifestHarness.corpusMaterialized, false);
  assert.equal(report.d034CorpusManifestHarness.fixtureArtifactReads, 0);
  assert.equal(report.d034CorpusManifestHarness.fixtureArtifactWrites, 0);
  assert.equal(report.d034CorpusManifestHarness.minimumPhysicalDeviceResolved, false);
  assert.equal(report.d034CorpusManifestHarness.macAndSupportedXcodeAvailable, false);
  assert.equal(report.d034CorpusManifestHarness.isolatedNativeHarnessAuthorized, false);
  assert.equal(report.d034CorpusManifestHarness.benchmarkExecutionAuthorized, false);
  assert.equal(report.d034CorpusManifestHarness.benchmarkExecutionStarted, false);
  assert.equal(report.d034CorpusManifestHarness.benchmarkResultRecorded, false);
  assert.equal(report.d034CorpusManifestHarness.deviceBenchmarkPassed, false);
  assert.equal(report.d034CorpusManifestHarness.independentReviewPassed, false);
  assert.equal(report.d034CorpusManifestHarness.ownerReviewAuthorized, false);
  assert.equal(report.d034CorpusManifestHarness.b05Closed, false);
  assert.equal(report.d034CorpusManifestHarness.formalImplementationAuthorized, false);
  assert.equal(report.d034RunReportContract.eventId, "EVT-20260821-016");
  assert.equal(
    report.d034RunReportContract.contractStatus,
    "CONTRACT_READY / NO_RUNS / NO_REPORT / EXECUTION_NOT_AUTHORIZED",
  );
  assert.equal(report.d034RunReportContract.corpusManifestHarnessEventId, "EVT-20260821-015");
  assert.equal(report.d034RunReportContract.profileCount, 3);
  assert.equal(report.d034RunReportContract.requiredFixtureSlotMinimum, 85);
  assert.equal(report.d034RunReportContract.fixedStageCount, 8);
  assert.equal(report.d034RunReportContract.metricCount, 14);
  assert.equal(report.d034RunReportContract.minimumCountedWarmupRunCount, 765);
  assert.equal(report.d034RunReportContract.minimumCountedMeasuredRunCount, 2550);
  assert.equal(report.d034RunReportContract.profileOrderRotationCount, 3);
  assert.equal(report.d034RunReportContract.wholeGroupThermalDiscardRequired, true);
  assert.equal(report.d034RunReportContract.discardedRecordsRetained, true);
  assert.equal(report.d034RunReportContract.retryUsesNewRunId, true);
  assert.equal(report.d034RunReportContract.rawRunValuesRequired, true);
  assert.equal(report.d034RunReportContract.aggregatesRecomputedFromCountedMeasuredRuns, true);
  assert.equal(report.d034RunReportContract.p95Algorithm, "NEAREST_RANK_CEIL_0_95_N_MINUS_1");
  assert.equal(report.d034RunReportContract.benchmarkPassDispositionAllowed, false);
  assert.equal(report.d034RunReportContract.contractValidatorImplemented, false);
  assert.equal(report.d034RunReportContract.rawRunRecordCount, 0);
  assert.equal(report.d034RunReportContract.benchmarkReportRecorded, false);
  assert.equal(report.d034RunReportContract.corpusMaterialized, false);
  assert.equal(report.d034RunReportContract.benchmarkExecutionAuthorized, false);
  assert.equal(report.d034RunReportContract.deviceBenchmarkPassed, false);
  assert.equal(report.d034RunReportContract.independentReviewPassed, false);
  assert.equal(report.d034RunReportContract.ownerReviewAuthorized, false);
  assert.equal(report.d034RunReportContract.b05Closed, false);
  assert.equal(report.d034RunReportContract.formalImplementationAuthorized, false);
  assert.equal(report.d034RunReportHarness.eventId, "EVT-20260821-017");
  assert.equal(report.d034RunReportHarness.contractEventId, "EVT-20260821-016");
  assert.equal(report.d034RunReportHarness.topLevelTests, 17);
  assert.equal(report.d034RunReportHarness.profileCount, 3);
  assert.equal(report.d034RunReportHarness.fixedStageCount, 8);
  assert.equal(report.d034RunReportHarness.metricCount, 14);
  assert.equal(report.d034RunReportHarness.minimumRequiredFixtureSlotCount, 85);
  assert.equal(report.d034RunReportHarness.minimumCountedWarmupRunCount, 765);
  assert.equal(report.d034RunReportHarness.minimumCountedMeasuredRunCount, 2550);
  assert.equal(report.d034RunReportHarness.profileOrderRotationCount, 3);
  assert.equal(report.d034RunReportHarness.syntheticRawRunRecordCount, 39);
  assert.equal(report.d034RunReportHarness.syntheticContractFixtureOnly, true);
  assert.equal(report.d034RunReportHarness.syntheticContractFixtureIsBenchmarkEvidence, false);
  assert.equal(report.d034RunReportHarness.wholeGroupThermalDiscardRequired, true);
  assert.equal(report.d034RunReportHarness.retryUsesNewRunAndGroupIds, true);
  assert.equal(report.d034RunReportHarness.aggregatesRecomputedFromCountedMeasuredRuns, true);
  assert.equal(report.d034RunReportHarness.p95Algorithm, "NEAREST_RANK_CEIL_0_95_N_MINUS_1");
  assert.equal(report.d034RunReportHarness.structuralDisposition, "STRUCTURALLY_COMPLETE_REPORT_ONLY");
  assert.equal(report.d034RunReportHarness.benchmarkPassReturned, false);
  assert.equal(report.d034RunReportHarness.contractValidatorImplemented, true);
  assert.equal(report.d034RunReportHarness.rawRunRecordCount, 0);
  assert.equal(report.d034RunReportHarness.benchmarkReportRecorded, false);
  assert.equal(report.d034RunReportHarness.corpusMaterialized, false);
  assert.equal(report.d034RunReportHarness.benchmarkExecutionAuthorized, false);
  assert.equal(report.d034RunReportHarness.deviceBenchmarkPassed, false);
  assert.equal(report.d034RunReportHarness.independentReviewPassed, false);
  assert.equal(report.d034RunReportHarness.ownerReviewAuthorized, false);
  assert.equal(report.d034RunReportHarness.b05Closed, false);
  assert.equal(report.d034RunReportHarness.formalImplementationAuthorized, false);
  assert.equal(
    report.d039IndependentReviewRecordHarness.eventId,
    "EVT-20260822-001",
  );
  assert.equal(
    report.d039IndependentReviewRecordHarness.packetVersion,
    "PACKET-001-R1",
  );
  assert.equal(report.d039IndependentReviewRecordHarness.topLevelTests, 20);
  assert.equal(report.d039IndependentReviewRecordHarness.requiredArtifactCount, 10);
  assert.equal(report.d039IndependentReviewRecordHarness.requiredReviewerDomainCount, 4);
  assert.equal(report.d039IndependentReviewRecordHarness.requiredCardCount, 6);
  assert.equal(
    report.d039IndependentReviewRecordHarness.requiredCrossCardInvariantCount,
    16,
  );
  assert.deepEqual(report.d039IndependentReviewRecordHarness.dispositionPriority, [
    "REJECTED",
    "CHANGES_REQUIRED",
    "INCOMPLETE",
    "INDEPENDENT_REVIEW_PASS_CANDIDATE",
  ]);
  assert.equal(
    report.d039IndependentReviewRecordHarness.syntheticIndependentReviewPassCandidateReturned,
    false,
  );
  assert.equal(
    report.d039IndependentReviewRecordHarness.formalIndependentReviewPassCandidateCanBeReturned,
    true,
  );
  assert.equal(
    report.d039IndependentReviewRecordHarness.independentReviewPassedReturned,
    false,
  );
  assert.equal(report.d039IndependentReviewRecordHarness.contractValidatorImplemented, true);
  assert.equal(report.d039IndependentReviewRecordHarness.formalReviewRecordCount, 0);
  assert.equal(report.d039IndependentReviewRecordHarness.reviewerAttestationRecordCount, 0);
  assert.equal(report.d039IndependentReviewRecordHarness.reviewersAssigned, false);
  assert.equal(report.d039IndependentReviewRecordHarness.reviewerSignatureVerified, false);
  assert.equal(report.d039IndependentReviewRecordHarness.independentReviewPassed, false);
  assert.equal(report.d039IndependentReviewRecordHarness.ownerReviewAuthorized, false);
  assert.equal(report.d039IndependentReviewRecordHarness.b03Closed, false);
  assert.equal(report.d039IndependentReviewRecordHarness.b04Closed, false);
  assert.equal(report.d039IndependentReviewRecordHarness.b05Closed, false);
  assert.equal(report.d039IndependentReviewRecordHarness.formalImplementationAuthorized, false);
  assert.equal(
    report.d040ChinaHealthReviewRecordHarness.eventId,
    "EVT-20260822-002",
  );
  assert.equal(
    report.d040ChinaHealthReviewRecordHarness.packetVersion,
    "PACKET-001-R1",
  );
  assert.equal(report.d040ChinaHealthReviewRecordHarness.topLevelTests, 20);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.requiredArtifactCount, 9);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.requiredReviewItemCount, 13);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.copyReviewItemCount, 6);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.boundaryReviewItemCount, 7);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.maximumReviewIntervalDays, 90);
  assert.deepEqual(
    report.d040ChinaHealthReviewRecordHarness.dispositionPriority,
    [
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
      "HEALTH_REVIEW_APPROVAL_CANDIDATE",
    ],
  );
  assert.equal(
    report.d040ChinaHealthReviewRecordHarness.syntheticHealthReviewApprovalCandidateReturned,
    false,
  );
  assert.equal(
    report.d040ChinaHealthReviewRecordHarness.formalHealthReviewApprovalCandidateCanBeReturned,
    true,
  );
  assert.equal(
    report.d040ChinaHealthReviewRecordHarness.healthContentApprovedReturned,
    false,
  );
  assert.equal(
    report.d040ChinaHealthReviewRecordHarness.contentQaPassedReturned,
    false,
  );
  assert.equal(report.d040ChinaHealthReviewRecordHarness.contractValidatorImplemented, true);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.formalHealthReviewRecordCount, 0);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.reviewerAttestationRecordCount, 0);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.reviewerAssigned, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.reviewerQualificationVerified, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.reviewerSignatureVerified, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.healthReviewStarted, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.healthContentApproved, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.contentQaPassed, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.d068OwnerReady, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.d069OwnerReady, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.d063OwnerReady, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.ownerReviewAuthorized, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.px1Authorized, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.px2Authorized, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.healthCopyImplementationAuthorized, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.formulaImplementationAuthorized, false);
  assert.equal(report.d040ChinaHealthReviewRecordHarness.formalImplementationAuthorized, false);
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.eventId,
    "EVT-20260822-003",
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.packetVersion,
    "PACKET-001-R1",
  );
  assert.equal(report.d040FirstThreeBatchesIndependentReviewRecordHarness.topLevelTests, 20);
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.requiredArtifactCount,
    7,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.requiredReviewerDomainCount,
    4,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.requiredCardCount,
    13,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.requiredCrossBatchInvariantCount,
    12,
  );
  assert.deepEqual(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.dispositionPriority,
    [
      "REJECTED",
      "CHANGES_REQUIRED",
      "INCOMPLETE",
      "INDEPENDENT_REVIEW_PASS_CANDIDATE",
    ],
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness
      .syntheticIndependentReviewPassCandidateReturned,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness
      .formalIndependentReviewPassCandidateCanBeReturned,
    true,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness
      .firstThreeBatchesIndependentReviewPassedReturned,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.contractValidatorImplemented,
    true,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.formalReviewRecordCount,
    0,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.reviewerAttestationRecordCount,
    0,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.reviewersAssigned,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.reviewerIdentityVerified,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.reviewerIndependenceVerified,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.reviewerCompetenceVerified,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.reviewerSignatureVerified,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.independentReviewStarted,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness
      .firstThreeBatchesIndependentReviewPassed,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.dynamicModelOptionOwnerReady,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness
      .modelNativeNumericPalOptionOwnerReady,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.healthReviewStillRequired,
    true,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.healthContentApproved,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.contentQaPassed,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.ownerReviewAuthorized,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.px1Authorized,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.px2Authorized,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.formulaImplementationAuthorized,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness
      .persistenceImplementationAuthorized,
    false,
  );
  assert.equal(
    report.d040FirstThreeBatchesIndependentReviewRecordHarness.formalImplementationAuthorized,
    false,
  );
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.eventId, "EVT-20260822-004");
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.packetVersion, "PACKET-001-R1");
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.inputManifestEventId, "EVT-20260821-007");
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.topLevelTests, 20);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.combinedReviewValidatorTests, 80);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.requiredArtifactCount, 10);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.requiredReviewerDomainCount, 4);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.requiredCardCount, 4);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.requiredCrossAxisInvariantCount, 14);
  assert.deepEqual(report.d040MacroAxisIndependentReviewRecordHarness.dispositionPriority, [
    "REJECTED", "CHANGES_REQUIRED", "INCOMPLETE", "INDEPENDENT_REVIEW_PASS_CANDIDATE",
  ]);
  assert.equal(
    report.d040MacroAxisIndependentReviewRecordHarness.syntheticIndependentReviewPassCandidateReturned,
    false,
  );
  assert.equal(
    report.d040MacroAxisIndependentReviewRecordHarness.formalIndependentReviewPassCandidateCanBeReturned,
    true,
  );
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.macroAxisIndependentReviewPassedReturned, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.contractValidatorImplemented, true);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.formalReviewRecordCount, 0);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.reviewerAttestationRecordCount, 0);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.reviewersAssigned, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.reviewerIdentityVerified, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.reviewerIndependenceVerified, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.reviewerCompetenceVerified, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.reviewerSignatureVerified, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.independentReviewStarted, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.macroAxisIndependentReviewPassed, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.healthReviewStillRequired, true);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.healthReviewerAssigned, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.healthContentApproved, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.contentQaPassed, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.d063Accepted, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.d070Accepted, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.d063OwnerReady, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.d072OwnerReady, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.ownerReviewAuthorized, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.px1Authorized, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.px2Authorized, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.goalImplementationAuthorized, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.recordingImplementationAuthorized, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.persistenceImplementationAuthorized, false);
  assert.equal(report.d040MacroAxisIndependentReviewRecordHarness.formalImplementationAuthorized, false);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.eventId, "EVT-20260822-005");
  assert.equal(report.d040NiddkLicenseRoutingEvidence.technologyTransferId, "TAB-2436");
  assert.equal(report.d040NiddkLicenseRoutingEvidence.technologyEId, "E-160-2012-0");
  assert.equal(report.d040NiddkLicenseRoutingEvidence.developmentStatus, "PROTOTYPE");
  assert.equal(report.d040NiddkLicenseRoutingEvidence.collaborationRoute, "LICENSING");
  assert.equal(report.d040NiddkLicenseRoutingEvidence.currentSevenAssetCount, 7);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.technologyRecordMapsCurrentSevenAssets, false);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.currentSevenAssetsCoverageConfirmed, false);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.explicitPerFileSoftwareLicenseFound, false);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.licensingClarificationRequested, false);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.externalMessagesSent, 0);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.dynamicModelEvidencePassed, false);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.dynamicModelOptionOwnerReady, false);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.ownerReviewAuthorized, false);
  assert.equal(report.d040NiddkLicenseRoutingEvidence.formalImplementationAuthorized, false);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.eventId, "EVT-20260822-006");
  assert.equal(report.d040NiddkLicenseClarificationTemplate.targetAssetCount, 7);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.requiredQuestionSectionCount, 3);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.requiredActionCount, 6);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.authorizationFieldCount, 12);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.responseRecordRequiredFieldCount, 30);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.dispositionCount, 5);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.templateBindsObservedHashes, true);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.templateCanSend, false);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.licenseClarificationAuthorized, false);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.licensingClarificationRequested, false);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.responseReceived, false);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.externalMessagesSent, 0);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.fileDownloads, 0);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.dynamicModelEvidencePassed, false);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.ownerReviewAuthorized, false);
  assert.equal(report.d040NiddkLicenseClarificationTemplate.formalImplementationAuthorized, false);
  assert.equal(report.d040NiddkLegacyReferenceAudit.eventId, "EVT-20260822-007");
  assert.equal(report.d040NiddkLegacyReferenceAudit.officialSourceCount, 3);
  assert.equal(report.d040NiddkLegacyReferenceAudit.bodyWeightPlannerSupersedesLegacyTools, true);
  assert.equal(report.d040NiddkLegacyReferenceAudit.legacyToolGroupCount, 2);
  assert.equal(report.d040NiddkLegacyReferenceAudit.detailedComputationalModelCodeZipListed, true);
  assert.equal(report.d040NiddkLegacyReferenceAudit.weightMaintenanceSpreadsheetLogicalToolCount, 4);
  assert.equal(report.d040NiddkLegacyReferenceAudit.legacyArtifactsCurrentBwpSourceRelease, false);
  assert.equal(report.d040NiddkLegacyReferenceAudit.legacyArtifactsOfficialVersionedOracle, false);
  assert.equal(report.d040NiddkLegacyReferenceAudit.machineReadableVersionedValidationCorpusFound, false);
  assert.equal(report.d040NiddkLegacyReferenceAudit.legacyArtifactFilesDownloaded, 0);
  assert.equal(report.d040NiddkLegacyReferenceAudit.legacyArtifactsExecuted, false);
  assert.equal(report.d040NiddkLegacyReferenceAudit.legacyArtifactsVendored, false);
  assert.equal(report.d040NiddkLegacyReferenceAudit.dynamicModelEvidencePassed, false);
  assert.equal(report.d040NiddkLegacyReferenceAudit.ownerReviewAuthorized, false);
  assert.equal(report.d040NiddkLegacyReferenceAudit.formalImplementationAuthorized, false);
  assert.equal(report.mvpIncrementScope.eventId, "EVT-20260822-008");
  assert.equal(report.mvpIncrementScope.gateId, "G2");
  assert.equal(report.mvpIncrementScope.gateState, "IN_PROGRESS");
  assert.equal(report.mvpIncrementScope.optionCount, 3);
  assert.deepEqual(report.mvpIncrementScope.optionIds, [
    "MVP-I1-LOCAL-MEAL",
    "MVP-I1-FULL-MANUAL",
    "MVP-I1-LOCAL-MEAL-BARCODE",
  ]);
  assert.equal(report.mvpIncrementScope.totalFeatureScopeRetained, true);
  assert.equal(report.mvpIncrementScope.recommendationIsSelection, false);
  assert.equal(report.mvpIncrementScope.ownerChoiceRecorded, false);
  assert.equal(report.mvpIncrementScope.mvpIncrementScopeFrozen, false);
  assert.equal(report.mvpIncrementScope.g2Passed, false);
  assert.equal(report.mvpIncrementScope.formalImplementationAuthorized, false);
  assert.equal(report.mvpIncrementScopeReviewPacket.eventId, "EVT-20260822-009");
  assert.equal(report.mvpIncrementScopeReviewPacket.reviewPacketReady, true);
  assert.equal(report.mvpIncrementScopeReviewPacket.requiredArtifactCount, 11);
  assert.equal(report.mvpIncrementScopeReviewPacket.requiredOptionCount, 3);
  assert.deepEqual(report.mvpIncrementScopeReviewPacket.optionKeys, ["A", "B", "C"]);
  assert.equal(report.mvpIncrementScopeReviewPacket.requiredReviewerDomainCount, 5);
  assert.equal(report.mvpIncrementScopeReviewPacket.requiredCrossOptionInvariantCount, 12);
  assert.equal(report.mvpIncrementScopeReviewPacket.reviewersAssigned, false);
  assert.equal(report.mvpIncrementScopeReviewPacket.crossRoleReviewStarted, false);
  assert.equal(report.mvpIncrementScopeReviewPacket.crossRoleReviewPassed, false);
  assert.equal(report.mvpIncrementScopeReviewPacket.ownerChoiceRecorded, false);
  assert.equal(report.mvpIncrementScopeReviewPacket.mvpIncrementScopeFrozen, false);
  assert.equal(report.mvpIncrementScopeReviewPacket.g2Passed, false);
  assert.equal(report.mvpIncrementScopeReviewPacket.formalImplementationAuthorized, false);
  assert.equal(report.mvpIncrementScopeInputManifest.eventId, "EVT-20260822-010");
  assert.equal(report.mvpIncrementScopeInputManifest.inputManifestFrozen, true);
  assert.equal(report.mvpIncrementScopeInputManifest.manifestEntryCount, 11);
  assert.equal(
    report.mvpIncrementScopeInputManifest.manifestCommit,
    "9891e6ac75d02df3d85a6b13cb094cd80e7fe808",
  );
  assert.equal(
    report.mvpIncrementScopeInputManifest.manifestRecordCommit,
    "6be59e5df3c1d06416f87950308bcb9a5df2aab0",
  );
  assert.equal(report.mvpIncrementScopeInputManifest.gitBlobOidAlgorithm, "SHA-1");
  assert.equal(report.mvpIncrementScopeInputManifest.canonicalDigestAlgorithm, "SHA-256");
  assert.equal(report.mvpIncrementScopeInputManifest.rawGitBlobBytesUsed, true);
  assert.equal(report.mvpIncrementScopeInputManifest.frozenArtifactRefs.length, 11);
  assert.equal(report.mvpIncrementScopeInputManifest.sourcePacketCreationEventId, "EVT-20260822-009");
  assert.equal(report.mvpIncrementScopeInputManifest.reviewersAssigned, false);
  assert.equal(report.mvpIncrementScopeInputManifest.crossRoleReviewStarted, false);
  assert.equal(report.mvpIncrementScopeInputManifest.crossRoleReviewPassed, false);
  assert.equal(report.mvpIncrementScopeInputManifest.ownerChoiceRecorded, false);
  assert.equal(report.mvpIncrementScopeInputManifest.mvpIncrementScopeFrozen, false);
  assert.equal(report.mvpIncrementScopeInputManifest.g2Passed, false);
  assert.equal(report.mvpIncrementScopeInputManifest.formalImplementationAuthorized, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.eventId, "EVT-20260822-011");
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.packetVersion, "PACKET-001-R1");
  assert.equal(
    report.mvpIncrementScopeCrossRoleReviewRecordHarness.inputManifestEventId,
    "EVT-20260822-010",
  );
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.topLevelTests, 20);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.fullSuitePassed, 1109);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.isolatedSpikeTestsPassed, 10);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.requiredArtifactCount, 11);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.requiredReviewerDomainCount, 5);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.requiredOptionCount, 3);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.requiredCrossOptionInvariantCount, 12);
  assert.deepEqual(report.mvpIncrementScopeCrossRoleReviewRecordHarness.dispositionPriority, [
    "REJECTED", "CHANGES_REQUIRED", "INCOMPLETE", "CROSS_ROLE_REVIEW_PASS_CANDIDATE",
  ]);
  assert.equal(
    report.mvpIncrementScopeCrossRoleReviewRecordHarness.syntheticCrossRoleReviewPassCandidateReturned,
    false,
  );
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.crossRoleReviewPassedReturned, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.formalReviewRecordCount, 0);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.reviewerAttestationRecordCount, 0);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.reviewersAssigned, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.reviewerIdentityVerified, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.reviewerCompetenceVerified, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.reviewerIndependenceVerified, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.reviewerSignatureVerified, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.crossRoleReviewStarted, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.crossRoleReviewPassed, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.ownerChoiceRecorded, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.mvpIncrementScopeFrozen, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.g2Passed, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.formalRootProjectAuthorized, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.nativeIosWorkAuthorized, false);
  assert.equal(report.mvpIncrementScopeCrossRoleReviewRecordHarness.formalImplementationAuthorized, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.eventId, "EVT-20260822-012");
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewPacketVersion, "PACKET-001-R1");
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.inputManifestEventId, "EVT-20260822-010");
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.topLevelTests, 20);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.fullSuitePassed, 1135);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.isolatedSpikeTestsPassed, 10);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.requiredReviewerDomainCount, 5);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.maximumReviewerCount, 20);
  assert.deepEqual(report.mvpIncrementScopeReviewerAssignmentHarness.resultDispositions, [
    "STRUCTURALLY_COMPLETE_ASSIGNMENT_CANDIDATE",
    "SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY",
    "ASSIGNMENT_INCOMPLETE",
  ]);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewCanStartRecomputed, true);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.assignmentContentSha256Required, true);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.syntheticAssignmentReadyCandidateReturned, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewersAssignedReturned, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewCanStartReturned, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewerCandidateCount, 0);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewerAssignmentRecordCount, 0);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.controlledContactRecordCount, 0);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.externalContactAuthorized, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.externalMessagesSent, 0);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewersAssigned, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewerIdentityVerified, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewerCompetenceVerified, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewerIndependenceVerified, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.reviewerSignatureVerified, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.crossRoleReviewStarted, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.crossRoleReviewPassed, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.ownerChoiceRecorded, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.mvpIncrementScopeFrozen, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.g2Passed, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.formalRootProjectAuthorized, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.nativeIosWorkAuthorized, false);
  assert.equal(report.mvpIncrementScopeReviewerAssignmentHarness.formalImplementationAuthorized, false);
  assert.equal(report.d039ReviewerAssignmentHarness.eventId, "EVT-20260822-013");
  assert.equal(report.d039ReviewerAssignmentHarness.reviewPacketVersion, "PACKET-001-R1");
  assert.equal(report.d039ReviewerAssignmentHarness.inputManifestEventId, "EVT-20260821-009");
  assert.equal(report.d039ReviewerAssignmentHarness.topLevelTests, 21);
  assert.equal(report.d039ReviewerAssignmentHarness.fullSuitePassed, 1162);
  assert.equal(report.d039ReviewerAssignmentHarness.isolatedSpikeTestsPassed, 10);
  assert.equal(report.d039ReviewerAssignmentHarness.requiredReviewerDomainCount, 4);
  assert.equal(report.d039ReviewerAssignmentHarness.formalAssignmentReadyCandidateCovered, true);
  assert.equal(report.d039ReviewerAssignmentHarness.syntheticWouldBeAssignmentReadyCandidateCovered, true);
  assert.equal(report.d039ReviewerAssignmentHarness.syntheticAssignmentReadyCandidateReturned, false);
  assert.equal(report.d039ReviewerAssignmentHarness.reviewersAssignedReturned, false);
  assert.equal(report.d039ReviewerAssignmentHarness.reviewCanStartReturned, false);
  assert.equal(report.d039ReviewerAssignmentHarness.reviewerCandidateCount, 0);
  assert.equal(report.d039ReviewerAssignmentHarness.controlledContactRecordCount, 0);
  assert.equal(report.d039ReviewerAssignmentHarness.reviewerAssignmentRecordCount, 0);
  assert.equal(report.d039ReviewerAssignmentHarness.externalContactAuthorized, false);
  assert.equal(report.d039ReviewerAssignmentHarness.externalMessagesSent, 0);
  assert.equal(report.d039ReviewerAssignmentHarness.reviewersAssigned, false);
  assert.equal(report.d039ReviewerAssignmentHarness.independentReviewStarted, false);
  assert.equal(report.d039ReviewerAssignmentHarness.independentReviewPassed, false);
  assert.equal(report.d039ReviewerAssignmentHarness.b03Closed, false);
  assert.equal(report.d039ReviewerAssignmentHarness.b04Closed, false);
  assert.equal(report.d039ReviewerAssignmentHarness.b05Closed, false);
  assert.equal(report.d039ReviewerAssignmentHarness.ownerReviewAuthorized, false);
  assert.equal(report.d039ReviewerAssignmentHarness.px5ImplementationDorSatisfied, false);
  assert.equal(report.d039ReviewerAssignmentHarness.formalRootProjectAuthorized, false);
  assert.equal(report.d039ReviewerAssignmentHarness.nativeIosWorkAuthorized, false);
  assert.equal(report.d039ReviewerAssignmentHarness.formalImplementationAuthorized, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.eventId, "EVT-20260822-014");
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.reviewPacketVersion, "PACKET-001-R1");
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.packetEventId, "EVT-20260821-001");
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.topLevelTests, 21);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.fullSuitePassed, 1189);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.isolatedSpikeTestsPassed, 10);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.requiredReviewerDomainCount, 4);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.formalAssignmentReadyCandidateCovered, true);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.syntheticWouldBeAssignmentReadyCandidateCovered, true);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.syntheticAssignmentReadyCandidateReturned, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.reviewersAssignedReturned, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.reviewCanStartReturned, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.reviewerCandidateCount, 0);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.controlledContactRecordCount, 0);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.reviewerAssignmentRecordCount, 0);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.externalContactAuthorized, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.externalMessagesSent, 0);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.reviewersAssigned, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.independentReviewStarted, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.firstThreeBatchesIndependentReviewPassed, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.healthReviewStillRequired, true);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.healthReviewerAssigned, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.healthContentApproved, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.contentQaPassed, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.ownerReviewAuthorized, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.px1Authorized, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.px2Authorized, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.formalRootProjectAuthorized, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.nativeIosWorkAuthorized, false);
  assert.equal(report.d040FirstThreeBatchesReviewerAssignmentHarness.formalImplementationAuthorized, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.eventId, "EVT-20260822-015");
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.reviewPacketVersion, "PACKET-001-R1");
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.inputManifestEventId, "EVT-20260821-007");
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.topLevelTests, 21);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.fullSuitePassed, 1216);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.isolatedSpikeTestsPassed, 10);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.requiredReviewerDomainCount, 4);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.formalAssignmentReadyCandidateCovered, true);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.syntheticWouldBeAssignmentReadyCandidateCovered, true);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.syntheticAssignmentReadyCandidateReturned, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.reviewersAssignedReturned, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.reviewCanStartReturned, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.reviewerCandidateCount, 0);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.controlledContactRecordCount, 0);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.reviewerAssignmentRecordCount, 0);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.externalContactAuthorized, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.externalMessagesSent, 0);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.reviewersAssigned, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.independentReviewStarted, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.macroAxisIndependentReviewPassed, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.currentFindingCountsMeasured, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.healthReviewStillRequired, true);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.healthReviewerAssigned, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.healthContentApproved, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.contentQaPassed, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.d063Accepted, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.d070Accepted, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.d063OwnerReady, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.d070OwnerReady, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.d071OwnerReady, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.d072OwnerReady, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.ownerReviewAuthorized, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.px1Authorized, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.px2Authorized, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.formalRootProjectAuthorized, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.nativeIosWorkAuthorized, false);
  assert.equal(report.d040MacroAxisReviewerAssignmentHarness.formalImplementationAuthorized, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.eventId, "EVT-20260822-016");
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.reviewPacketVersion, "PACKET-001-R1");
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.packetEventId, "EVT-20260820-008");
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.topLevelTests, 23);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.fullSuitePassed, 1245);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.isolatedSpikeTestsPassed, 10);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.requiredCompetenceScopeCount, 5);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.maximumReviewWindowDays, 90);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.formalAssignmentReadyCandidateCovered, true);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.syntheticWouldBeAssignmentReadyCandidateCovered, true);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.syntheticAssignmentReadyCandidateReturned, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.reviewerAssignedReturned, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.reviewCanStartReturned, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.reviewerCandidateCount, 0);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.controlledContactRecordCount, 0);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.reviewerAssignmentRecordCount, 0);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.qualificationRegistryReads, 0);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.externalContactAuthorized, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.externalMessagesSent, 0);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.reviewerAssigned, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.healthReviewerAssigned, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.reviewerQualificationVerified, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.reviewerLocaleFitVerified, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.healthReviewStarted, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.healthReviewStillRequired, true);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.healthContentApproved, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.contentQaPassed, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.d068OwnerReady, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.d069OwnerReady, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.d063OwnerReady, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.firstThreeBatchesIndependentReviewPassed, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.ownerReviewAuthorized, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.px1Authorized, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.px2Authorized, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.formalRootProjectAuthorized, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.nativeIosWorkAuthorized, false);
  assert.equal(report.d040ChinaHealthReviewerAssignmentHarness.formalImplementationAuthorized, false);
  assert.equal(report.d040.authoritativeState, "PX-0_INPUT_GAP");
  assert.equal(report.d040.eventId, "EVT-20260827-005");
  assert.equal(report.d040.next, "D068_D069_HEALTH_REVIEW_CONTENT_QA_AND_INDEPENDENT_REVIEW_REQUIRED");
  assert.equal(report.d040.nonDiagnosticBoundaryEventId, "EVT-20260827-005");
  assert.equal(
    report.d040.nonDiagnosticBoundaryStatus,
    "DRAFT_COMPLETE / CROSS_DOMAIN_SELF_REVIEW_PASS / HEALTH_REVIEW_REQUIRED / INDEPENDENT_REVIEW_REQUIRED / NOT_OWNER_READY",
  );
  assert.deepEqual(report.d040.nonDiagnosticBoundaryCardDecisionIds, ["D-068", "D-069"]);
  assert.equal(report.d040.nonDiagnosticBoundaryCardCount, 2);
  assert.equal(report.d040.d068QuestionId, "d068_non_diagnostic_health_context");
  assert.equal(report.d040.d069QuestionId, "d069_estimate_uncertainty_copy");
  assert.equal(report.d040.d068OptionCount, 3);
  assert.equal(report.d040.d069OptionCount, 3);
  assert.equal(report.d040.d068RecommendedOptionId, "pause_automatic_estimates_on_yes_or_unsure");
  assert.equal(report.d040.d069RecommendedOptionId, "plain_language_no_numeric_error_bounds");
  assert.equal(report.d040.nonDiagnosticYesOrUnsurePausesAutomaticEstimates, true);
  assert.equal(report.d040.nonDiagnosticUnsureCannotBecomeNoRisk, true);
  assert.equal(report.d040.nonDiagnosticEatingDisorderRiskPausesTargets, true);
  assert.equal(report.d040.nonDiagnosticPlainLanguageUncertaintyRecommended, true);
  assert.equal(report.d040.nonDiagnosticNumericUncertaintyRequiresEvidence, true);
  assert.equal(report.d040.nonDiagnosticPopulationErrorNotPersonalBounds, true);
  assert.equal(report.d040.nonDiagnosticNoSideEffects, true);
  assert.equal(report.d040.nonDiagnosticReviewAndOwnerClosed, true);
  assert.equal(report.d040.nonDiagnosticPxAndImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticHarnessStatus, "SPIKE / LOCAL_ONLY / NON_PRODUCTION / NOT_OWNER_READY");
  assert.equal(report.d040.nonDiagnosticHarnessTopLevelTests, 17);
  assert.equal(report.d040.nonDiagnosticHarnessCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticHarnessRecommendationsNotOwnerChoices, true);
  assert.equal(report.d040.nonDiagnosticHarnessSyntheticIsNotEvidence, true);
  assert.equal(report.d040.nonDiagnosticHarnessCallerHealthContextIsNotDiagnosis, true);
  assert.equal(report.d040.nonDiagnosticHarnessNumericEvidenceCallerAsserted, true);
  assert.equal(report.d040.nonDiagnosticHarnessFailClosedSemantics, true);
  assert.equal(report.d040.nonDiagnosticHarnessNoSideEffects, true);
  assert.equal(report.d040.nonDiagnosticHarnessReviewOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewPacketEventId, "EVT-20260827-007");
  assert.equal(
    report.d040.nonDiagnosticReviewPacketStatus,
    "PACKET_READY / REVIEWER_ASSIGNMENT_REQUIRED / REVIEW_NOT_STARTED / NOT_OWNER_READY",
  );
  assert.equal(report.d040.nonDiagnosticReviewPacketVersion, "PACKET-001-R1");
  assert.equal(report.d040.nonDiagnosticReviewPacketCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticReviewPacketCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticReviewPacketRequiredInputCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewPacketRequiredDomainCount, 4);
  assert.equal(report.d040.nonDiagnosticReviewPacketRequiredCardDispositionCount, 2);
  assert.equal(report.d040.nonDiagnosticReviewPacketRequiredInvariantCount, 10);
  assert.equal(report.d040.nonDiagnosticReviewPacketNamedReviewerRequired, true);
  assert.equal(report.d040.nonDiagnosticReviewPacketCannotSelfApprove, true);
  assert.equal(report.d040.nonDiagnosticReviewPacketFailClosedSemantics, true);
  assert.equal(report.d040.nonDiagnosticReviewPacketNoSideEffects, true);
  assert.equal(report.d040.nonDiagnosticReviewPacketReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessEventId, "EVT-20260827-008");
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessStatus, "SPIKE / LOCAL_ONLY / NON_PRODUCTION");
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessReviewPacketEventId, "EVT-20260827-007");
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessTopLevelTests, 20);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessRequiredInputCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessRequiredDomainCount, 4);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessRequiredCardDispositionCount, 2);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessRequiredInvariantCount, 10);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessDoubleSha256, true);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessStrictAndFailClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessSyntheticIsNotEvidence, true);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessNoSideEffects, true);
  assert.equal(report.d040.nonDiagnosticReviewRecordHarnessReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessEventId, "EVT-20260827-009");
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessStatus, "SPIKE / LOCAL_ONLY / NON_PRODUCTION");
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessReviewPacketEventId, "EVT-20260827-007");
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessReviewRecordHarnessEventId, "EVT-20260827-008");
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessTopLevelTests, 21);
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessRequiredDomainCount, 4);
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessCandidateMinCount, 1);
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessCandidateMaxCount, 20);
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessStrictAndFailClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessSyntheticIsNotEvidence, true);
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessNoSideEffects, true);
  assert.equal(report.d040.nonDiagnosticReviewerAssignmentHarnessReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketEventId, "EVT-20260827-010");
  assert.equal(
    report.d040.nonDiagnosticReviewerIntakePacketStatus,
    "INTAKE_PACKET_READY / LOCAL_ONLY / NON_PRODUCTION",
  );
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketReviewPacketEventId, "EVT-20260827-007");
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketReviewRecordHarnessEventId, "EVT-20260827-008");
  assert.equal(
    report.d040.nonDiagnosticReviewerIntakePacketReviewerAssignmentHarnessEventId,
    "EVT-20260827-009",
  );
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketRequiredInputCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketRequiredDomainCount, 4);
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketCandidateMinCount, 1);
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketCandidateMaxCount, 20);
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketContractCorrected, true);
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketTemplateResidueRemoved, true);
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketHandoffReady, true);
  assert.equal(report.d040.nonDiagnosticReviewerIntakePacketReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistEventId, "EVT-20260827-011");
  assert.equal(
    report.d040.nonDiagnosticReviewHandoffChecklistStatus,
    "HANDOFF_CHECKLIST_READY / LOCAL_ONLY / NON_PRODUCTION",
  );
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistReviewPacketEventId, "EVT-20260827-007");
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistReviewRecordHarnessEventId, "EVT-20260827-008");
  assert.equal(
    report.d040.nonDiagnosticReviewHandoffChecklistReviewerAssignmentHarnessEventId,
    "EVT-20260827-009",
  );
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistReviewerIntakePacketEventId, "EVT-20260827-010");
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistRequiredInputCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistRequiredDomainCount, 4);
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistRequiredPrerequisiteCount, 6);
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistStartGateConditionCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistFailClosedConditionCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistSensitiveClassCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistBindingsReady, true);
  assert.equal(report.d040.nonDiagnosticReviewHandoffChecklistReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterEventId, "EVT-20260827-012");
  assert.equal(
    report.d040.nonDiagnosticReviewStartGapRegisterStatus,
    "GAP_REGISTER_READY / LOCAL_ONLY / NON_PRODUCTION / REVIEW_NOT_STARTED / NOT_OWNER_READY",
  );
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterReviewPacketEventId, "EVT-20260827-007");
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterReviewRecordHarnessEventId, "EVT-20260827-008");
  assert.equal(
    report.d040.nonDiagnosticReviewStartGapRegisterReviewerAssignmentHarnessEventId,
    "EVT-20260827-009",
  );
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterReviewerIntakePacketEventId, "EVT-20260827-010");
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterHandoffChecklistEventId, "EVT-20260827-011");
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterGapCount, 10);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterOpenGapCount, 10);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterClosedGapCount, 0);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterStartBlockerCount, 10);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterRequiredPrerequisiteCount, 7);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterRequiredDomainCount, 4);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterRequiredInputCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterFailClosedConditionCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterSensitiveClassCount, 8);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterBindingsReady, true);
  assert.equal(report.d040.nonDiagnosticReviewStartGapRegisterReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateEventId, "EVT-20260827-013");
  assert.equal(
    report.d040.nonDiagnosticFormalAssignmentTemplateStatus,
    "TEMPLATE_READY / LOCAL_ONLY / NON_PRODUCTION / EMPTY_RECORD_ONLY / REVIEW_NOT_STARTED / NOT_OWNER_READY",
  );
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateReviewPacketEventId, "EVT-20260827-007");
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateReviewRecordHarnessEventId, "EVT-20260827-008");
  assert.equal(
    report.d040.nonDiagnosticFormalAssignmentTemplateReviewerAssignmentHarnessEventId,
    "EVT-20260827-009",
  );
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateReviewerIntakePacketEventId, "EVT-20260827-010");
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateHandoffChecklistEventId, "EVT-20260827-011");
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateStartGapRegisterEventId, "EVT-20260827-012");
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateSectionCount, 10);
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateRequiredBindingCount, 8);
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateRequiredFutureRecordSectionCount, 10);
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateSensitiveClassCount, 9);
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateStartGateConditionCount, 8);
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateBindingsReady, true);
  assert.equal(report.d040.nonDiagnosticFormalAssignmentTemplateReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightEventId, "EVT-20260827-014");
  assert.equal(
    report.d040.nonDiagnosticAssignmentAuthorizationPreflightStatus,
    "PREFLIGHT_CHECKLIST_READY / LOCAL_ONLY / NON_PRODUCTION / AUTHORIZATION_NOT_GRANTED / REVIEW_NOT_STARTED / NOT_OWNER_READY",
  );
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightReviewPacketEventId, "EVT-20260827-007");
  assert.equal(
    report.d040.nonDiagnosticAssignmentAuthorizationPreflightReviewRecordHarnessEventId,
    "EVT-20260827-008",
  );
  assert.equal(
    report.d040.nonDiagnosticAssignmentAuthorizationPreflightReviewerAssignmentHarnessEventId,
    "EVT-20260827-009",
  );
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightReviewerIntakePacketEventId, "EVT-20260827-010");
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightHandoffChecklistEventId, "EVT-20260827-011");
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightStartGapRegisterEventId, "EVT-20260827-012");
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightFormalTemplateEventId, "EVT-20260827-013");
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightItemCount, 8);
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightMissingItemCount, 8);
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightClosedItemCount, 0);
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightScopeBindingCount, 9);
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightStartGateConditionCount, 8);
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightBindingsReady, true);
  assert.equal(report.d040.nonDiagnosticAssignmentAuthorizationPreflightReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractEventId, "EVT-20260827-015");
  assert.equal(
    report.d040.nonDiagnosticContactAuthorizationRecordContractStatus,
    "CONTRACT_READY / LOCAL_ONLY / NON_PRODUCTION / NO_AUTHORIZATION_RECORD / AUTHORIZATION_NOT_GRANTED / REVIEW_NOT_STARTED / NOT_OWNER_READY",
  );
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractReviewPacketEventId, "EVT-20260827-007");
  assert.equal(
    report.d040.nonDiagnosticContactAuthorizationRecordContractReviewRecordHarnessEventId,
    "EVT-20260827-008",
  );
  assert.equal(
    report.d040.nonDiagnosticContactAuthorizationRecordContractReviewerAssignmentHarnessEventId,
    "EVT-20260827-009",
  );
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractReviewerIntakePacketEventId, "EVT-20260827-010");
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractHandoffChecklistEventId, "EVT-20260827-011");
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractStartGapRegisterEventId, "EVT-20260827-012");
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractFormalTemplateEventId, "EVT-20260827-013");
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractPreflightChecklistEventId, "EVT-20260827-014");
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractSchemaFieldCount, 12);
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractRequiredBoundPriorEventCount, 10);
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractSensitiveClassCount, 8);
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractAcceptanceRuleCount, 8);
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractBindingsReady, true);
  assert.equal(report.d040.nonDiagnosticContactAuthorizationRecordContractReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractEventId, "EVT-20260827-016");
  assert.equal(
    report.d040.nonDiagnosticReviewerCandidateRosterContractStatus,
    "CONTRACT_READY / LOCAL_ONLY / NON_PRODUCTION / NO_REAL_CANDIDATES / NO_AUTHORIZATION_RECORD / AUTHORIZATION_NOT_GRANTED / REVIEW_NOT_STARTED / NOT_OWNER_READY",
  );
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractReviewPacketEventId, "EVT-20260827-007");
  assert.equal(
    report.d040.nonDiagnosticReviewerCandidateRosterContractReviewRecordHarnessEventId,
    "EVT-20260827-008",
  );
  assert.equal(
    report.d040.nonDiagnosticReviewerCandidateRosterContractReviewerAssignmentHarnessEventId,
    "EVT-20260827-009",
  );
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractReviewerIntakePacketEventId, "EVT-20260827-010");
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractHandoffChecklistEventId, "EVT-20260827-011");
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractStartGapRegisterEventId, "EVT-20260827-012");
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractFormalTemplateEventId, "EVT-20260827-013");
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractPreflightChecklistEventId, "EVT-20260827-014");
  assert.equal(
    report.d040.nonDiagnosticReviewerCandidateRosterContractContactAuthorizationRecordContractEventId,
    "EVT-20260827-015",
  );
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractSchemaFieldCount, 14);
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractRequiredBoundPriorEventCount, 11);
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractSensitiveClassCount, 9);
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractAcceptanceRuleCount, 9);
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractBindingsReady, true);
  assert.equal(report.d040.nonDiagnosticReviewerCandidateRosterContractReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractEventId, "EVT-20260827-017");
  assert.equal(
    report.d040.nonDiagnosticReviewMaterialPacketRecordContractStatus,
    "CONTRACT_READY / LOCAL_ONLY / NON_PRODUCTION / MATERIAL_NOT_SENT / NO_REAL_CANDIDATES / NO_AUTHORIZATION_RECORD / AUTHORIZATION_NOT_GRANTED / REVIEW_NOT_STARTED / NOT_OWNER_READY",
  );
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractReviewPacketEventId, "EVT-20260827-007");
  assert.equal(
    report.d040.nonDiagnosticReviewMaterialPacketRecordContractReviewRecordHarnessEventId,
    "EVT-20260827-008",
  );
  assert.equal(
    report.d040.nonDiagnosticReviewMaterialPacketRecordContractReviewerAssignmentHarnessEventId,
    "EVT-20260827-009",
  );
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractReviewerIntakePacketEventId, "EVT-20260827-010");
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractHandoffChecklistEventId, "EVT-20260827-011");
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractStartGapRegisterEventId, "EVT-20260827-012");
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractFormalTemplateEventId, "EVT-20260827-013");
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractPreflightChecklistEventId, "EVT-20260827-014");
  assert.equal(
    report.d040.nonDiagnosticReviewMaterialPacketRecordContractContactAuthorizationRecordContractEventId,
    "EVT-20260827-015",
  );
  assert.equal(
    report.d040.nonDiagnosticReviewMaterialPacketRecordContractReviewerCandidateRosterContractEventId,
    "EVT-20260827-016",
  );
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractCardSpecEventId, "EVT-20260827-005");
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractCardHarnessEventId, "EVT-20260827-006");
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractSchemaFieldCount, 13);
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractRequiredBoundPriorEventCount, 12);
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractSensitiveClassCount, 9);
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractAcceptanceRuleCount, 9);
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractBindingsReady, true);
  assert.equal(report.d040.nonDiagnosticReviewMaterialPacketRecordContractReviewHealthOwnerPxImplementationClosed, true);
  assert.equal(report.d040.resolvedDecisionAxisCount, 20);
  assert.equal(report.d040.firstBatchCardCount, 4);
  assert.equal(report.d040.energyBatchCardCount, 5);
  assert.equal(report.d040.dataLifecycleBatchCardCount, 4);
  assert.equal(report.d040.draftedCardCount, 17);
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
  assert.equal(report.d040.d072CardState, "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY");
  assert.equal(report.d040.d072DecisionId, "D-072");
  assert.equal(report.d040.d072QuestionId, "d072_hard_stop_record_availability");
  assert.equal(report.d040.d072CardCount, 1);
  assert.equal(report.d040.d072OptionCount, 2);
  assert.deepEqual(report.d040.d072OptionIds, [
    "allow_no_goal_fact_recording",
    "pause_new_fact_creation_keep_data_controls",
  ]);
  assert.equal(report.d040.d072RecommendedOptionId, "allow_no_goal_fact_recording");
  assert.equal(report.d040.d072HardStopCannotBeWaived, true);
  assert.equal(report.d040.d072NoGoalRecordingCannotCreateGoal, true);
  assert.equal(report.d040.d072AutomaticTargetOrFormulaShown, false);
  assert.equal(report.d040.d072TargetComparisonOrScoringShown, false);
  assert.equal(report.d040.d072ExistingHistoryRecalculated, false);
  assert.equal(report.d040.d072ExistingHistoryDeleted, false);
  assert.equal(report.d040.d072DataAccessAndDeletionRemainAvailable, true);
  assert.equal(report.d040.d072RecordingChoiceChangesHealthClassification, false);
  assert.equal(report.d040.d072ConditionInferredByApp, false);
  assert.equal(report.d040.d072UnknownEligibilityEnablesAutomaticTarget, false);
  assert.equal(report.d040.d072SupportCopyRequiresHealthApproval, true);
  assert.equal(report.d040.d072D068D069PrerequisitesPassed, false);
  assert.equal(report.d040.d072SelfReviewPassed, true);
  assert.equal(report.d040.d072HealthContentApproved, false);
  assert.equal(report.d040.d072ContentQaPassed, false);
  assert.equal(report.d040.d072IndependentReviewPassed, false);
  assert.equal(report.d040.d072CardRegisteredInDecisionLedger, false);
  assert.equal(report.d040.d072OwnerReady, false);
  assert.equal(report.d040.d072OwnerReviewAuthorized, false);
  assert.equal(report.d040.d072RecordingImplementationAuthorized, false);
  assert.equal(report.d040.d072PersistenceImplementationAuthorized, false);
  assert.equal(report.d040.macroAxisReviewPacketReady, true);
  assert.equal(report.d040.macroAxisReviewPacketVersion, "PACKET-001-R1");
  assert.equal(report.d040.macroAxisReviewRequiredArtifactCount, 10);
  assert.equal(report.d040.macroAxisReviewRequiredCardCount, 4);
  assert.equal(report.d040.macroAxisReviewCardDecisionCount, 4);
  assert.equal(report.d040.macroAxisReviewRequiredDomainCount, 4);
  assert.equal(report.d040.macroAxisReviewDomainCount, 4);
  assert.equal(report.d040.macroAxisReviewRequiredInvariantCount, 14);
  assert.equal(report.d040.macroAxisReviewDispositionCount, 4);
  assert.equal(report.d040.macroAxisReviewBlockingSeverityCount, 3);
  assert.equal(report.d040.macroAxisReviewNamedReviewerRequired, true);
  assert.equal(report.d040.macroAxisReviewAuthorOrPmCanSelfApprove, false);
  assert.equal(report.d040.macroAxisReviewAiOrAgentCanBeReviewer, false);
  assert.equal(report.d040.macroAxisReviewExternalMessageSent, false);
  assert.equal(report.d040.macroAxisReviewReviewersAssigned, false);
  assert.equal(report.d040.macroAxisReviewIdentityVerified, false);
  assert.equal(report.d040.macroAxisReviewIndependenceVerified, false);
  assert.equal(report.d040.macroAxisReviewConflictResolved, false);
  assert.equal(report.d040.macroAxisReviewStarted, false);
  assert.equal(report.d040.macroAxisReviewPassed, false);
  assert.equal(report.d040.macroAxisReviewFindingCountsMeasured, false);
  assert.equal(report.d040.macroAxisReviewHealthStillRequired, true);
  assert.equal(report.d040.macroAxisReviewHealthContentApproved, false);
  assert.equal(report.d040.macroAxisReviewContentQaPassed, false);
  assert.equal(report.d040.macroAxisReviewD063Accepted, false);
  assert.equal(report.d040.macroAxisReviewD070Accepted, false);
  assert.equal(report.d040.macroAxisReviewD063OwnerReady, false);
  assert.equal(report.d040.macroAxisReviewD070OwnerReady, false);
  assert.equal(report.d040.macroAxisReviewD071OwnerReady, false);
  assert.equal(report.d040.macroAxisReviewD072OwnerReady, false);
  assert.equal(report.d040.macroAxisIndependentReviewPassed, false);
  assert.equal(report.d040.macroAxisReviewOwnerIntakeChanged, false);
  assert.equal(report.d040.macroAxisReviewOwnerCardScheduled, false);
  assert.equal(report.d040.macroAxisReviewOwnerReviewAuthorized, false);
  assert.equal(report.d040.macroAxisReviewGoalImplementationAuthorized, false);
  assert.equal(report.d040.macroAxisReviewRecordingImplementationAuthorized, false);
  assert.equal(report.d040.macroAxisReviewPersistenceImplementationAuthorized, false);
  assert.equal(report.d040.macroAxisReviewFormalImplementationAuthorized, false);
  assert.equal(report.d040.macroAxisInputManifestFrozen, true);
  assert.equal(report.d040.macroAxisInputManifestEntryCount, 10);
  assert.equal(
    report.d040.macroAxisInputManifestCommit,
    "47ba4895dac2535682e8d1a8cb985176d6ad45f7",
  );
  assert.equal(
    report.d040.macroAxisInputManifestRecordCommit,
    "d8e812f1324590d735f809ea994e8aaa2f6805d8",
  );
  assert.equal(report.d040.macroAxisInputManifestGitBlobOidAlgorithm, "SHA-1");
  assert.equal(report.d040.macroAxisInputManifestCanonicalDigestAlgorithm, "SHA-256");
  assert.equal(report.d040.macroAxisInputManifestUsesRawGitBlobBytes, true);
  assert.equal(report.d040.macroAxisInputManifestFrozenArtifactCount, 10);
  assert.equal(report.d040.macroAxisInputManifestSourcePacketEventId, "EVT-20260821-006");
  assert.equal(
    report.d040.macroAxisInputManifestPacketNext,
    "MACRO_AXIS_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
  );
  assert.equal(report.d040.macroAxisInputManifestReviewersAssigned, false);
  assert.equal(report.d040.macroAxisInputManifestReviewStarted, false);
  assert.equal(report.d040.macroAxisInputManifestReviewPassed, false);
  assert.equal(report.d040.macroAxisInputManifestHealthContentApproved, false);
  assert.equal(report.d040.macroAxisInputManifestContentQaPassed, false);
  assert.equal(report.d040.macroAxisInputManifestOwnerReviewAuthorized, false);
  assert.equal(report.d040.macroAxisInputManifestFormalImplementationAuthorized, false);
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

  const d039B03B05ReviewPacketModel = validModel();
  d039B03B05ReviewPacketModel.events.find(
    (record) => record.value.eventId === "EVT-20260821-009",
  ).value.data.independentReviewPassed = true;
  const d039B03B05ReviewPacketReport = reconcileProjectOps(d039B03B05ReviewPacketModel);
  assert.equal(d039B03B05ReviewPacketReport.ok, false);
  assert.ok(
    d039B03B05ReviewPacketReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D039_GATE",
    ),
  );

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

  const d034BenchmarkModel = validModel();
  d034BenchmarkModel.events.find(
    (record) => record.value.eventId === "EVT-20260821-010",
  ).value.data.deviceBenchmarkPassed = true;
  const d034BenchmarkReport = reconcileProjectOps(d034BenchmarkModel);
  assert.equal(d034BenchmarkReport.ok, false);
  assert.ok(
    d034BenchmarkReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D034_GATE",
    ),
  );

  const d036Model = validModel();
  d036Model.events.find((record) => record.value.eventId === "EVT-20260820-001").value.data.ephemeralAloneConsideredSufficientIsolation = true;
  const d036Report = reconcileProjectOps(d036Model);
  assert.equal(d036Report.ok, false);
  assert.ok(d036Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D036_GATE"));

  const d036ProtocolModel = validModel();
  d036ProtocolModel.events.find(
    (record) => record.value.eventId === "EVT-20260821-011",
  ).value.data.realNetworkSpikeAuthorized = true;
  const d036ProtocolReport = reconcileProjectOps(d036ProtocolModel);
  assert.equal(d036ProtocolReport.ok, false);
  assert.ok(
    d036ProtocolReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D036_GATE",
    ),
  );

  const d053Model = validModel();
  d053Model.events.find((record) => record.value.eventId === "EVT-20260820-002").value.data.appleProhibitedUsesOwnerWaivable = true;
  const d053Report = reconcileProjectOps(d053Model);
  assert.equal(d053Report.ok, false);
  assert.ok(d053Report.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D053_GATE"));

  const d053ProtocolModel = validModel();
  d053ProtocolModel.events.find(
    (record) => record.value.eventId === "EVT-20260821-012",
  ).value.data.providerEvidenceCollectionAuthorized = true;
  const d053ProtocolReport = reconcileProjectOps(d053ProtocolModel);
  assert.equal(d053ProtocolReport.ok, false);
  assert.ok(
    d053ProtocolReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D053_GATE",
    ),
  );

  const oi07TemplateModel = validModel();
  oi07TemplateModel.events.find(
    (record) => record.value.eventId === "EVT-20260821-013",
  ).value.data.ownerInputReceived = true;
  const oi07TemplateReport = reconcileProjectOps(oi07TemplateModel);
  assert.equal(oi07TemplateReport.ok, false);
  assert.ok(
    oi07TemplateReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_OI07_TEMPLATE_GATE",
    ),
  );

  const oi07HarnessModel = validModel();
  oi07HarnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260821-014",
  ).value.data.realNetworkRequests = 1;
  const oi07HarnessReport = reconcileProjectOps(oi07HarnessModel);
  assert.equal(oi07HarnessReport.ok, false);
  assert.ok(
    oi07HarnessReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_OI07_HARNESS_GATE",
    ),
  );

  const d034CorpusManifestHarnessModel = validModel();
  d034CorpusManifestHarnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260821-015",
  ).value.data.corpusMaterialized = true;
  const d034CorpusManifestHarnessReport = reconcileProjectOps(d034CorpusManifestHarnessModel);
  assert.equal(d034CorpusManifestHarnessReport.ok, false);
  assert.ok(
    d034CorpusManifestHarnessReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D034_CORPUS_MANIFEST_GATE",
    ),
  );

  const d034RunReportContractModel = validModel();
  d034RunReportContractModel.events.find(
    (record) => record.value.eventId === "EVT-20260821-016",
  ).value.data.rawRunRecordCount = 2550;
  const d034RunReportContractReport = reconcileProjectOps(d034RunReportContractModel);
  assert.equal(d034RunReportContractReport.ok, false);
  assert.ok(
    d034RunReportContractReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D034_RUN_REPORT_CONTRACT_GATE",
    ),
  );

  const d034RunReportHarnessModel = validModel();
  d034RunReportHarnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260821-017",
  ).value.data.rawRunRecordCount = 39;
  const d034RunReportHarnessReport = reconcileProjectOps(d034RunReportHarnessModel);
  assert.equal(d034RunReportHarnessReport.ok, false);
  assert.ok(
    d034RunReportHarnessReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D034_RUN_REPORT_HARNESS_GATE",
    ),
  );

  const d039IndependentReviewRecordHarnessModel = validModel();
  d039IndependentReviewRecordHarnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-001",
  ).value.data.formalReviewRecordCount = 1;
  const d039IndependentReviewRecordHarnessReport = reconcileProjectOps(
    d039IndependentReviewRecordHarnessModel,
  );
  assert.equal(d039IndependentReviewRecordHarnessReport.ok, false);
  assert.ok(
    d039IndependentReviewRecordHarnessReport.diagnostics.some(
      (diagnostic) =>
        diagnostic.code ===
        "OPS_RECONCILE_D039_INDEPENDENT_REVIEW_RECORD_HARNESS_GATE",
    ),
  );

  const d040ChinaHealthReviewRecordHarnessModel = validModel();
  d040ChinaHealthReviewRecordHarnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-002",
  ).value.data.formalHealthReviewRecordCount = 1;
  const d040ChinaHealthReviewRecordHarnessReport = reconcileProjectOps(
    d040ChinaHealthReviewRecordHarnessModel,
  );
  assert.equal(d040ChinaHealthReviewRecordHarnessReport.ok, false);
  assert.ok(
    d040ChinaHealthReviewRecordHarnessReport.diagnostics.some(
      (diagnostic) =>
        diagnostic.code ===
        "OPS_RECONCILE_D040_CHINA_HEALTH_REVIEW_RECORD_HARNESS_GATE",
    ),
  );

  const d040FirstThreeBatchesIndependentReviewRecordHarnessModel = validModel();
  d040FirstThreeBatchesIndependentReviewRecordHarnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-003",
  ).value.data.formalReviewRecordCount = 1;
  const d040FirstThreeBatchesIndependentReviewRecordHarnessReport = reconcileProjectOps(
    d040FirstThreeBatchesIndependentReviewRecordHarnessModel,
  );
  assert.equal(d040FirstThreeBatchesIndependentReviewRecordHarnessReport.ok, false);
  assert.ok(
    d040FirstThreeBatchesIndependentReviewRecordHarnessReport.diagnostics.some(
      (diagnostic) =>
        diagnostic.code ===
        "OPS_RECONCILE_D040_FIRST_THREE_BATCHES_REVIEW_RECORD_HARNESS_GATE",
    ),
  );

  const d040MacroAxisIndependentReviewRecordHarnessModel = validModel();
  d040MacroAxisIndependentReviewRecordHarnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-004",
  ).value.data.formalReviewRecordCount = 1;
  const d040MacroAxisIndependentReviewRecordHarnessReport = reconcileProjectOps(
    d040MacroAxisIndependentReviewRecordHarnessModel,
  );
  assert.equal(d040MacroAxisIndependentReviewRecordHarnessReport.ok, false);
  assert.ok(
    d040MacroAxisIndependentReviewRecordHarnessReport.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_D040_MACRO_AXIS_REVIEW_RECORD_HARNESS_GATE",
    ),
  );

  const d040NiddkLicenseRoutingModel = validModel();
  d040NiddkLicenseRoutingModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-005",
  ).value.data.explicitPerFileSoftwareLicenseFound = true;
  const d040NiddkLicenseRoutingReport = reconcileProjectOps(d040NiddkLicenseRoutingModel);
  assert.equal(d040NiddkLicenseRoutingReport.ok, false);
  assert.ok(
    d040NiddkLicenseRoutingReport.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_D040_NIDDK_LICENSE_ROUTING_GATE",
    ),
  );

  const d040NiddkLicenseClarificationTemplateModel = validModel();
  d040NiddkLicenseClarificationTemplateModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-006",
  ).value.data.templateCanSend = true;
  const d040NiddkLicenseClarificationTemplateReport = reconcileProjectOps(
    d040NiddkLicenseClarificationTemplateModel,
  );
  assert.equal(d040NiddkLicenseClarificationTemplateReport.ok, false);
  assert.ok(
    d040NiddkLicenseClarificationTemplateReport.diagnostics.some(
      (diagnostic) =>
        diagnostic.code ===
        "OPS_RECONCILE_D040_NIDDK_LICENSE_CLARIFICATION_TEMPLATE_GATE",
    ),
  );

  const d040NiddkLegacyReferenceAuditModel = validModel();
  d040NiddkLegacyReferenceAuditModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-007",
  ).value.data.legacyArtifactsCurrentBwpSourceRelease = true;
  const d040NiddkLegacyReferenceAuditReport = reconcileProjectOps(
    d040NiddkLegacyReferenceAuditModel,
  );
  assert.equal(d040NiddkLegacyReferenceAuditReport.ok, false);
  assert.ok(
    d040NiddkLegacyReferenceAuditReport.diagnostics.some(
      (diagnostic) =>
        diagnostic.code ===
        "OPS_RECONCILE_D040_NIDDK_LEGACY_REFERENCE_AUDIT_GATE",
    ),
  );

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

  const d072CardModel = validModel();
  d072CardModel.events.find((record) => record.value.eventId === "EVT-20260821-005").value.data.hardStopCannotBeWaived = false;
  const d072CardReport = reconcileProjectOps(d072CardModel);
  assert.equal(d072CardReport.ok, false);
  assert.ok(d072CardReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const macroAxisReviewPacketModel = validModel();
  macroAxisReviewPacketModel.events.find((record) => record.value.eventId === "EVT-20260821-006").value.data.independentReviewPassed = true;
  const macroAxisReviewPacketReport = reconcileProjectOps(macroAxisReviewPacketModel);
  assert.equal(macroAxisReviewPacketReport.ok, false);
  assert.ok(macroAxisReviewPacketReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));

  const macroAxisInputManifestFreezeModel = validModel();
  macroAxisInputManifestFreezeModel.events.find((record) => record.value.eventId === "EVT-20260821-007").value.data.inputManifestFrozen = false;
  const macroAxisInputManifestFreezeReport = reconcileProjectOps(macroAxisInputManifestFreezeModel);
  assert.equal(macroAxisInputManifestFreezeReport.ok, false);
  assert.ok(macroAxisInputManifestFreezeReport.diagnostics.some((diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE"));
});

test("对账器拒绝把 G2 范围推荐冒充选择或实现授权", () => {
  const selectedModel = validModel();
  const selectedData = selectedModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-008",
  ).value.data;
  selectedData.recommendationIsSelection = true;
  selectedData.ownerChoiceRecorded = true;
  selectedData.selectedIncrementId = "MVP-I1-LOCAL-MEAL";
  selectedData.mvpIncrementScopeFrozen = true;
  const selectedReport = reconcileProjectOps(selectedModel);
  assert.ok(
    selectedReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_MVP_INCREMENT_SCOPE_GATE",
    ),
  );

  const authorizedModel = validModel();
  const authorizedData = authorizedModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-008",
  ).value.data;
  authorizedData.totalFeatureScopeRetained = false;
  authorizedData.g2Passed = true;
  authorizedData.formalRootProjectAuthorized = true;
  authorizedData.nativeIosWorkAuthorized = true;
  authorizedData.formalImplementationAuthorized = true;
  const authorizedReport = reconcileProjectOps(authorizedModel);
  assert.ok(
    authorizedReport.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_MVP_INCREMENT_SCOPE_GATE",
    ),
  );
});

test("对账器拒绝把 G2 范围复核包就绪冒充复核或授权", () => {
  const reviewModel = validModel();
  const reviewData = reviewModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-009",
  ).value.data;
  reviewData.requiredReviewerDomainCount = 4;
  reviewData.reviewersAssigned = true;
  reviewData.crossRoleReviewStarted = true;
  reviewData.crossRoleReviewPassed = true;
  reviewData.ownerChoiceRecorded = true;
  reviewData.selectedIncrementId = "MVP-I1-LOCAL-MEAL";
  reviewData.mvpIncrementScopeFrozen = true;
  reviewData.g2Passed = true;
  reviewData.formalImplementationAuthorized = true;
  const report = reconcileProjectOps(reviewModel);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_MVP_INCREMENT_SCOPE_REVIEW_PACKET_GATE",
    ),
  );
});

test("对账器拒绝把 G2 范围输入冻结冒充复核或授权", () => {
  const manifestModel = validModel();
  const manifestData = manifestModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-010",
  ).value.data;
  manifestData.manifestEntryCount = 10;
  manifestData.rawGitBlobBytesUsed = false;
  manifestData.reviewersAssigned = true;
  manifestData.crossRoleReviewStarted = true;
  manifestData.crossRoleReviewPassed = true;
  manifestData.ownerChoiceRecorded = true;
  manifestData.selectedIncrementId = "MVP-I1-LOCAL-MEAL";
  manifestData.mvpIncrementScopeFrozen = true;
  manifestData.g2Passed = true;
  manifestData.formalImplementationAuthorized = true;
  const report = reconcileProjectOps(manifestModel);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_MVP_INCREMENT_SCOPE_INPUT_MANIFEST_GATE",
    ),
  );
});

test("对账器拒绝把 G2 范围回执 validator 冒充正式复核或授权", () => {
  const harnessModel = validModel();
  const harnessData = harnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-011",
  ).value.data;
  harnessData.requiredArtifactCount = 10;
  harnessData.reviewerDomainCoverageRecomputed = false;
  harnessData.syntheticCrossRoleReviewPassCandidateReturned = true;
  harnessData.formalReviewRecordCount = 1;
  harnessData.reviewerAttestationRecordCount = 5;
  harnessData.reviewersAssigned = true;
  harnessData.crossRoleReviewStarted = true;
  harnessData.crossRoleReviewPassed = true;
  harnessData.ownerChoiceRecorded = true;
  harnessData.selectedIncrementId = "MVP-I1-LOCAL-MEAL";
  harnessData.mvpIncrementScopeFrozen = true;
  harnessData.g2Passed = true;
  harnessData.formalImplementationAuthorized = true;
  const report = reconcileProjectOps(harnessModel);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_MVP_INCREMENT_SCOPE_REVIEW_RECORD_HARNESS_GATE",
    ),
  );
});

test("对账器拒绝把 G2 复核人指派 validator 冒充联系人、正式指派或授权", () => {
  const harnessModel = validModel();
  const harnessData = harnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-012",
  ).value.data;
  harnessData.requiredReviewerDomainCount = 4;
  harnessData.domainCoverageBidirectional = false;
  harnessData.syntheticAssignmentReadyCandidateReturned = true;
  harnessData.reviewersAssignedReturned = true;
  harnessData.reviewCanStartReturned = true;
  harnessData.reviewerCandidateCount = 5;
  harnessData.controlledContactRecordCount = 5;
  harnessData.reviewerAssignmentRecordCount = 1;
  harnessData.externalContactAuthorized = true;
  harnessData.externalMessagesSent = 5;
  harnessData.reviewersAssigned = true;
  harnessData.crossRoleReviewStarted = true;
  harnessData.crossRoleReviewPassed = true;
  harnessData.ownerChoiceRecorded = true;
  harnessData.selectedIncrementId = "MVP-I1-LOCAL-MEAL";
  harnessData.mvpIncrementScopeFrozen = true;
  harnessData.g2Passed = true;
  harnessData.formalImplementationAuthorized = true;
  const report = reconcileProjectOps(harnessModel);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_MVP_INCREMENT_SCOPE_REVIEWER_ASSIGNMENT_HARNESS_GATE",
    ),
  );
});

test("对账器拒绝把 D-039 复核人指派 validator 冒充联系人、正式指派或关闭 B03~B05", () => {
  const harnessModel = validModel();
  const harnessData = harnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-013",
  ).value.data;
  harnessData.requiredReviewerDomainCount = 3;
  harnessData.domainCoverageBidirectional = false;
  harnessData.syntheticAssignmentReadyCandidateReturned = true;
  harnessData.reviewersAssignedReturned = true;
  harnessData.reviewCanStartReturned = true;
  harnessData.reviewerCandidateCount = 4;
  harnessData.controlledContactRecordCount = 4;
  harnessData.reviewerAssignmentRecordCount = 1;
  harnessData.externalContactAuthorized = true;
  harnessData.externalMessagesSent = 4;
  harnessData.reviewersAssigned = true;
  harnessData.independentReviewStarted = true;
  harnessData.independentReviewPassed = true;
  harnessData.d045Accepted = true;
  harnessData.d031Accepted = true;
  harnessData.d033Accepted = true;
  harnessData.d034Accepted = true;
  harnessData.d036Accepted = true;
  harnessData.d053Accepted = true;
  harnessData.b03Closed = true;
  harnessData.b04Closed = true;
  harnessData.b05Closed = true;
  harnessData.ownerReviewAuthorized = true;
  harnessData.px5ImplementationDorSatisfied = true;
  harnessData.formalRootProjectAuthorized = true;
  harnessData.nativeIosWorkAuthorized = true;
  harnessData.formalImplementationAuthorized = true;
  const report = reconcileProjectOps(harnessModel);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_D039_REVIEWER_ASSIGNMENT_HARNESS_GATE",
    ),
  );
});

test("对账器拒绝把 D-040 十三卡复核人指派 validator 冒充联系人、正式指派、复核或健康批准", () => {
  const harnessModel = validModel();
  const harnessData = harnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-014",
  ).value.data;
  harnessData.requiredReviewerDomainCount = 3;
  harnessData.domainCoverageBidirectional = false;
  harnessData.syntheticAssignmentReadyCandidateReturned = true;
  harnessData.reviewersAssignedReturned = true;
  harnessData.reviewCanStartReturned = true;
  harnessData.reviewerCandidateCount = 4;
  harnessData.controlledContactRecordCount = 4;
  harnessData.reviewerAssignmentRecordCount = 1;
  harnessData.externalContactAuthorized = true;
  harnessData.externalMessagesSent = 4;
  harnessData.reviewersAssigned = true;
  harnessData.independentReviewStarted = true;
  harnessData.firstThreeBatchesIndependentReviewPassed = true;
  harnessData.healthReviewStillRequired = false;
  harnessData.healthReviewerAssigned = true;
  harnessData.healthContentApproved = true;
  harnessData.contentQaPassed = true;
  harnessData.ownerIntakeChanged = true;
  harnessData.ownerCardsScheduled = true;
  harnessData.px1Authorized = true;
  harnessData.px2Authorized = true;
  harnessData.ownerReviewAuthorized = true;
  harnessData.ownerChoiceRecorded = true;
  harnessData.decisionAcceptedRecorded = true;
  harnessData.formulaImplementationAuthorized = true;
  harnessData.persistenceImplementationAuthorized = true;
  harnessData.formalRootProjectAuthorized = true;
  harnessData.nativeIosWorkAuthorized = true;
  harnessData.formalImplementationAuthorized = true;
  const report = reconcileProjectOps(harnessModel);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_D040_FIRST_THREE_BATCHES_REVIEWER_ASSIGNMENT_HARNESS_GATE",
    ),
  );
});

test("对账器拒绝把 D-040 宏量轴复核人指派 validator 冒充联系人、正式指派、复核、健康批准或四卡就绪", () => {
  const harnessModel = validModel();
  const harnessData = harnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-015",
  ).value.data;
  harnessData.requiredReviewerDomainCount = 3;
  harnessData.domainCoverageBidirectional = false;
  harnessData.formalAssignmentReadyCandidateCovered = false;
  harnessData.syntheticWouldBeAssignmentReadyCandidateCovered = false;
  harnessData.syntheticAssignmentReadyCandidateReturned = true;
  harnessData.reviewersAssignedReturned = true;
  harnessData.reviewCanStartReturned = true;
  harnessData.reviewerCandidateCount = 4;
  harnessData.controlledContactRecordCount = 4;
  harnessData.reviewerAssignmentRecordCount = 1;
  harnessData.externalContactAuthorized = true;
  harnessData.externalMessagesSent = 4;
  harnessData.reviewersAssigned = true;
  harnessData.independentReviewStarted = true;
  harnessData.macroAxisIndependentReviewPassed = true;
  harnessData.currentFindingCountsMeasured = true;
  harnessData.healthReviewStillRequired = false;
  harnessData.healthReviewerAssigned = true;
  harnessData.healthContentApproved = true;
  harnessData.contentQaPassed = true;
  harnessData.d063Accepted = true;
  harnessData.d070Accepted = true;
  harnessData.d063OwnerReady = true;
  harnessData.d070OwnerReady = true;
  harnessData.d071OwnerReady = true;
  harnessData.d072OwnerReady = true;
  harnessData.ownerIntakeChanged = true;
  harnessData.ownerCardsScheduled = true;
  harnessData.px1Authorized = true;
  harnessData.px2Authorized = true;
  harnessData.ownerReviewAuthorized = true;
  harnessData.ownerChoiceRecorded = true;
  harnessData.decisionAcceptedRecorded = true;
  harnessData.goalImplementationAuthorized = true;
  harnessData.recordingImplementationAuthorized = true;
  harnessData.persistenceImplementationAuthorized = true;
  harnessData.formalRootProjectAuthorized = true;
  harnessData.nativeIosWorkAuthorized = true;
  harnessData.formalImplementationAuthorized = true;
  const report = reconcileProjectOps(harnessModel);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_D040_MACRO_AXIS_REVIEWER_ASSIGNMENT_HARNESS_GATE",
    ),
  );
});

test("对账器拒绝把 D-040 中国健康评审人指派 validator 冒充资质、联系人、正式指派、评审或健康批准", () => {
  const harnessModel = validModel();
  const harnessData = harnessModel.events.find(
    (record) => record.value.eventId === "EVT-20260822-016",
  ).value.data;
  harnessData.requiredCompetenceScopeCount = 4;
  harnessData.maximumReviewWindowDays = 91;
  harnessData.singleSelectedReviewerRequired = false;
  harnessData.selectedReviewerMustCoverAllScopes = false;
  harnessData.qualificationObservationCallerAssertedNotVerified = false;
  harnessData.localeAndRegionFitRequired = false;
  harnessData.scopeCoverageBidirectional = false;
  harnessData.formalAssignmentReadyCandidateCovered = false;
  harnessData.syntheticWouldBeAssignmentReadyCandidateCovered = false;
  harnessData.syntheticAssignmentReadyCandidateReturned = true;
  harnessData.reviewerAssignedReturned = true;
  harnessData.reviewCanStartReturned = true;
  harnessData.reviewerCandidateCount = 1;
  harnessData.controlledContactRecordCount = 1;
  harnessData.reviewerAssignmentRecordCount = 1;
  harnessData.qualificationRegistryReads = 1;
  harnessData.externalContactAuthorized = true;
  harnessData.externalMessagesSent = 1;
  harnessData.reviewerAssigned = true;
  harnessData.healthReviewerAssigned = true;
  harnessData.reviewerQualificationVerified = true;
  harnessData.reviewerLocaleFitVerified = true;
  harnessData.healthReviewStarted = true;
  harnessData.healthReviewStillRequired = false;
  harnessData.healthContentApproved = true;
  harnessData.contentQaPassed = true;
  harnessData.d068OwnerReady = true;
  harnessData.d069OwnerReady = true;
  harnessData.d063OwnerReady = true;
  harnessData.firstThreeBatchesIndependentReviewPassed = true;
  harnessData.ownerIntakeChanged = true;
  harnessData.ownerCardsScheduled = true;
  harnessData.px1Authorized = true;
  harnessData.px2Authorized = true;
  harnessData.ownerReviewAuthorized = true;
  harnessData.ownerChoiceRecorded = true;
  harnessData.decisionAcceptedRecorded = true;
  harnessData.healthCopyImplementationAuthorized = true;
  harnessData.formulaImplementationAuthorized = true;
  harnessData.formalRootProjectAuthorized = true;
  harnessData.nativeIosWorkAuthorized = true;
  harnessData.formalImplementationAuthorized = true;
  const report = reconcileProjectOps(harnessModel);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "OPS_RECONCILE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_HARNESS_GATE",
    ),
  );
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

test("reconciler requires the D-036 Provider/native report contract event", () => {
  const model = validModel();
  model.events = model.events.filter(
    (record) => record.value.eventId !== "EVT-20260827-001",
  );

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D036_GATE",
    ),
  );
});

test("reconciler rejects D-036 harness claims of real execution evidence", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-002",
  ).value.data;
  data.attemptRecordCount = 324;
  data.compatibilityReportRecorded = true;
  data.nativeBoundaryEvidenceRecorded = true;
  data.spikeExecutionStarted = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D036_GATE",
    ),
  );
});

test("reconciler requires the D-053 Provider evidence report contract event", () => {
  const model = validModel();
  model.events = model.events.filter(
    (record) => record.value.eventId !== "EVT-20260827-003",
  );

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D053_GATE",
    ),
  );
});

test("reconciler rejects D-053 harness claims of evidence collection or admission", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-004",
  ).value.data;
  data.providerEvidenceCollectionStarted = true;
  data.namedSignersVerified = true;
  data.d053Accepted = true;
  data.providerAdmissionGranted = true;
  data.sendAuthorization = "GRANTED";

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D053_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic harness claims of side effects, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-006",
  ).value.data;
  data.syntheticFixtureIsNotEvidence = false;
  data.healthDataWrites = 1;
  data.ownerIntakeWrites = 1;
  data.networkRequests = 1;
  data.healthContentApproved = true;
  data.d068OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic review packet claims of review, health approval, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-007",
  ).value.data;
  data.reviewersAssigned = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic review record harness claims of review, health approval, Owner advancement, side effects, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-008",
  ).value.data;
  data.syntheticReviewPassCandidateReturned = true;
  data.formalCompleteStillRequiresAuthoritativeReviewEvent = false;
  data.fileWrites = 1;
  data.healthDataWrites = 1;
  data.ownerIntakeWrites = 1;
  data.networkRequests = 1;
  data.reviewersAssigned = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.px1Authorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic reviewer assignment harness claims of real candidates, contact, formal assignment, review, health approval, Owner advancement, side effects, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-009",
  ).value.data;
  data.reviewerAssignmentReadyCandidateReturned = true;
  data.syntheticAssignmentReadyCandidateReturned = true;
  data.reviewCanStartReturned = true;
  data.fileWrites = 1;
  data.healthDataWrites = 1;
  data.ownerIntakeWrites = 1;
  data.networkRequests = 1;
  data.contactsReads = 1;
  data.formalAssignmentRecords = 1;
  data.controlledContactRecords = 1;
  data.realReviewerCandidatesRecorded = 1;
  data.externalContactAuthorized = true;
  data.reviewersAssigned = true;
  data.reviewerIdentityVerified = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.px1Authorized = true;
  data.contactsReadAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic reviewer intake packet claims of real candidates, contact, assignment, review, health approval, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-010",
  ).value.data;
  data.contractPacketIdentityCorrected = false;
  data.contractMacroAxisTemplateResidueRemoved = false;
  data.unsentRequestTemplateIncluded = false;
  data.sensitiveStorageBoundaryDocumented = false;
  data.assignmentRecordMinimumFieldsDocumented = false;
  data.reviewHandoffRulesDocumented = false;
  data.formalAssignmentRecords = 1;
  data.controlledContactRecords = 1;
  data.realReviewerCandidatesRecorded = 1;
  data.externalContactAuthorized = true;
  data.externalMessagesSent = 1;
  data.reviewersAssigned = true;
  data.reviewerIdentityVerified = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.px1Authorized = true;
  data.contactsReadAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic review handoff checklist claims of candidates, contact, review start, health approval, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-011",
  ).value.data;
  data.startGateRulesDocumented = false;
  data.forbiddenHandoffCasesDocumented = false;
  data.minimumStateVectorDocumented = false;
  data.reviewerCandidateCount = 1;
  data.controlledContactRecordCount = 1;
  data.formalAssignmentRecordCount = 1;
  data.formalReviewRecordCount = 1;
  data.reviewerAttestationRecordCount = 1;
  data.externalContactAuthorized = true;
  data.externalMessagesSent = 1;
  data.reviewCanStart = true;
  data.reviewersAssigned = true;
  data.reviewerIdentityVerified = true;
  data.reviewerCompetenceVerified = true;
  data.reviewerIndependenceVerified = true;
  data.reviewerSignatureVerified = true;
  data.conflictOfInterestResolved = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.px1Authorized = true;
  data.contactsReadAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic review start gap register claims of closed gaps, review, health approval, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-012",
  ).value.data;
  data.gapRegisterReady = false;
  data.allGapsOpen = false;
  data.closureRequiresSeparateAuthorizedRecords = false;
  data.openGapCount = 9;
  data.closedGapCount = 1;
  data.reviewerCandidateCount = 1;
  data.controlledContactRecordCount = 1;
  data.formalAssignmentRecordCount = 1;
  data.formalReviewRecordCount = 1;
  data.reviewerAttestationRecordCount = 1;
  data.externalContactAuthorized = true;
  data.externalMessagesSent = 1;
  data.reviewCanStart = true;
  data.reviewersAssigned = true;
  data.reviewerIdentityVerified = true;
  data.reviewerCompetenceVerified = true;
  data.reviewerIndependenceVerified = true;
  data.reviewerSignatureVerified = true;
  data.conflictOfInterestResolved = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.px1Authorized = true;
  data.contactsReadAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic formal assignment template claims of assignment, contact, review, health approval, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-013",
  ).value.data;
  data.assignmentTemplateReady = false;
  data.emptyRecordOnly = false;
  data.closureRequiresSeparateAuthorizedRecords = false;
  data.formalAssignmentRecordCount = 1;
  data.reviewerCandidateCount = 1;
  data.controlledContactRecordCount = 1;
  data.formalReviewRecordCount = 1;
  data.reviewerAttestationRecordCount = 1;
  data.externalContactAuthorized = true;
  data.externalMessagesSent = 1;
  data.reviewCanStart = true;
  data.reviewersAssigned = true;
  data.reviewerIdentityVerified = true;
  data.reviewerCompetenceVerified = true;
  data.reviewerIndependenceVerified = true;
  data.reviewerSignatureVerified = true;
  data.conflictOfInterestResolved = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.px1Authorized = true;
  data.contactsReadAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic assignment authorization preflight claims of contact authorization, material send, assignment, review, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-014",
  ).value.data;
  data.authorizationPreflightChecklistReady = false;
  data.authorizationNotGranted = false;
  data.contactAuthorizationCanBeInferred = true;
  data.missingPreflightItemCount = 7;
  data.closedPreflightItemCount = 1;
  data.formalAssignmentRecordCount = 1;
  data.reviewerCandidateCount = 1;
  data.controlledContactRecordCount = 1;
  data.formalReviewRecordCount = 1;
  data.reviewerAttestationRecordCount = 1;
  data.externalContactAuthorized = true;
  data.externalMessagesSent = 1;
  data.materialPacketSent = true;
  data.reviewCanStart = true;
  data.reviewersAssigned = true;
  data.reviewerIdentityVerified = true;
  data.reviewerCompetenceVerified = true;
  data.reviewerIndependenceVerified = true;
  data.reviewerSignatureVerified = true;
  data.conflictOfInterestResolved = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthReviewerAssigned = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.ownerChoiceRecorded = true;
  data.decisionAcceptedRecorded = true;
  data.px1Authorized = true;
  data.px2Authorized = true;
  data.formulaImplementationAuthorized = true;
  data.healthCopyImplementationAuthorized = true;
  data.formalRootProjectAuthorized = true;
  data.nativeIosWorkAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic contact authorization record contract claims of authorization, contact, review, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-015",
  ).value.data;
  data.authorizationRecordContractReady = false;
  data.authorizationRecordCount = 1;
  data.authorizationRecordSchemaFieldCount = 11;
  data.requiredBoundPriorEventCount = 9;
  data.sensitiveStorageForbiddenClassCount = 7;
  data.acceptanceRuleCount = 7;
  data.authorizationNotGranted = false;
  data.contactAuthorizationCanBeInferred = true;
  data.authorizationRecordCanBeInferred = true;
  data.externalContactAuthorized = true;
  data.externalMessagesSent = 1;
  data.materialPacketSent = true;
  data.formalAssignmentRecordCount = 1;
  data.formalReviewRecordCount = 1;
  data.reviewerCandidateCount = 1;
  data.controlledContactRecordCount = 1;
  data.reviewerAttestationRecordCount = 1;
  data.reviewCanStart = true;
  data.reviewersAssigned = true;
  data.reviewerIdentityVerified = true;
  data.reviewerCompetenceVerified = true;
  data.reviewerIndependenceVerified = true;
  data.reviewerSignatureVerified = true;
  data.conflictOfInterestResolved = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthReviewerAssigned = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.ownerChoiceRecorded = true;
  data.decisionAcceptedRecorded = true;
  data.px1Authorized = true;
  data.px2Authorized = true;
  data.formulaImplementationAuthorized = true;
  data.healthCopyImplementationAuthorized = true;
  data.formalRootProjectAuthorized = true;
  data.nativeIosWorkAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic reviewer candidate roster contract claims of real candidates, authorization, contact, review, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-016",
  ).value.data;
  data.reviewerCandidateRosterContractReady = false;
  data.reviewerCandidateRosterCount = 1;
  data.reviewerCandidateRosterSchemaFieldCount = 13;
  data.requiredBoundPriorEventCount = 10;
  data.sensitiveStorageForbiddenClassCount = 8;
  data.acceptanceRuleCount = 8;
  data.authorizationRecordContractReady = false;
  data.authorizationRecordCount = 1;
  data.authorizationNotGranted = false;
  data.contactAuthorizationCanBeInferred = true;
  data.authorizationRecordCanBeInferred = true;
  data.reviewerCandidateCanBeInferred = true;
  data.externalContactAuthorized = true;
  data.externalMessagesSent = 1;
  data.materialPacketSent = true;
  data.formalAssignmentRecordCount = 1;
  data.formalReviewRecordCount = 1;
  data.reviewerCandidateCount = 1;
  data.controlledContactRecordCount = 1;
  data.reviewerAttestationRecordCount = 1;
  data.reviewCanStart = true;
  data.reviewersAssigned = true;
  data.reviewerIdentityVerified = true;
  data.reviewerCompetenceVerified = true;
  data.reviewerIndependenceVerified = true;
  data.reviewerSignatureVerified = true;
  data.conflictOfInterestResolved = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthReviewerAssigned = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerReviewAuthorized = true;
  data.ownerChoiceRecorded = true;
  data.decisionAcceptedRecorded = true;
  data.px1Authorized = true;
  data.px2Authorized = true;
  data.formulaImplementationAuthorized = true;
  data.healthCopyImplementationAuthorized = true;
  data.formalRootProjectAuthorized = true;
  data.nativeIosWorkAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});

test("reconciler rejects D-040 non-diagnostic review material packet record contract claims of material send, candidates, authorization, contact, review, Owner advancement, or implementation", () => {
  const model = validModel();
  const data = model.events.find(
    (record) => record.value.eventId === "EVT-20260827-017",
  ).value.data;
  data.reviewMaterialPacketRecordContractReady = false;
  data.reviewMaterialPacketRecordCount = 1;
  data.reviewMaterialPacketRecordSchemaFieldCount = 12;
  data.requiredBoundPriorEventCount = 11;
  data.sensitiveStorageForbiddenClassCount = 8;
  data.acceptanceRuleCount = 8;
  data.reviewerCandidateRosterContractReady = false;
  data.reviewerCandidateRosterCount = 1;
  data.authorizationRecordContractReady = false;
  data.authorizationRecordCount = 1;
  data.authorizationNotGranted = false;
  data.materialPacketSent = true;
  data.materialPacketRecordCanBeInferred = true;
  data.reviewerCandidateCanBeInferred = true;
  data.contactAuthorizationCanBeInferred = true;
  data.authorizationRecordCanBeInferred = true;
  data.externalContactAuthorized = true;
  data.externalMessagesSent = 1;
  data.formalAssignmentRecordCount = 1;
  data.formalReviewRecordCount = 1;
  data.reviewerCandidateCount = 1;
  data.controlledContactRecordCount = 1;
  data.reviewerAttestationRecordCount = 1;
  data.reviewCanStart = true;
  data.reviewersAssigned = true;
  data.reviewerIdentityVerified = true;
  data.reviewerCompetenceVerified = true;
  data.reviewerIndependenceVerified = true;
  data.reviewerSignatureVerified = true;
  data.conflictOfInterestResolved = true;
  data.independentReviewStarted = true;
  data.independentReviewPassed = true;
  data.healthReviewerAssigned = true;
  data.healthContentApproved = true;
  data.contentQaPassed = true;
  data.d068OwnerReady = true;
  data.d069OwnerReady = true;
  data.ownerCardScheduled = true;
  data.ownerReviewAuthorized = true;
  data.ownerChoiceRecorded = true;
  data.decisionAcceptedRecorded = true;
  data.px1Authorized = true;
  data.px2Authorized = true;
  data.formulaImplementationAuthorized = true;
  data.healthCopyImplementationAuthorized = true;
  data.formalRootProjectAuthorized = true;
  data.nativeIosWorkAuthorized = true;
  data.formalImplementationAuthorized = true;

  const report = reconcileProjectOps(model);
  assert.equal(report.ok, false);
  assert.ok(
    report.diagnostics.some(
      (diagnostic) => diagnostic.code === "OPS_RECONCILE_D040_GATE",
    ),
  );
});
