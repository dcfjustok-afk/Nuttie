import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import { evaluateOi07ProviderTargetIntake } from "./oi07-provider-target-intake-harness.mjs";
import {
  BOUNDARY,
  CHANGE_TRIGGER_IDS,
  CONTRACT_ID,
  DIMENSION_STATUSES,
  EVIDENCE_DIMENSION_IDS,
  INPUT_SCHEMA_VERSION,
  PAYLOAD_CLASSES,
  POLICY_PACKAGES,
  PROFILE_DISPOSITIONS,
  PROVIDER_SLOTS,
  RESULT_SCHEMA_VERSION,
  computeD053ProviderEvidenceReportSha256,
  computeD053ProviderTargetFingerprint,
  evaluateD053ProviderEvidenceAppPrivacyReport,
  normalizeD053ProviderEvidenceAppPrivacyReport,
  validateD053ProviderEvidenceAppPrivacyReportResult,
} from "./d053-provider-evidence-app-privacy-report-harness.mjs";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function digest(value) {
  const source = typeof value === "string" ? value : JSON.stringify(canonicalize(value));
  return createHash("sha256").update(source).digest("hex");
}

function clone(value) {
  return structuredClone(value);
}

function withFingerprint(value, field) {
  const copy = { ...value };
  delete copy[field];
  return { ...value, [field]: digest(copy) };
}

function oi07Input() {
  return {
    schemaVersion: "OI07_PROVIDER_TARGET_INTAKE_INPUT_V1",
    oi07Revision: "OI07-R001",
    providedBy: "OWNER",
    providedAt: "2026-08-26T09:00:00+08:00",
    ownerAuthorizationRef: "OWNER-REF-001",
    targets: PROVIDER_SLOTS.map((providerSlot, index) => {
      const number = index + 1;
      return {
        providerSlot,
        providerLegalEntity: `Synthetic Provider ${number} Ltd`,
        apiProductName: `Synthetic API ${number}`,
        apiProductPlan: "SYNTHETIC_TEST_PLAN",
        apiProductRevision: `R${number}`,
        accountType: "OWNER_CONTROLLED_TEST_ACCOUNT",
        accountRegion: "CN",
        intendedUserRegion: "CN",
        baseUrl: `https://provider${number}.example.test`,
        endpointPathShape: "/v1/synthetic",
        queryRequired: "FALSE",
        redirectDocumented: "NO_REDIRECT_DOCUMENTED",
        streamingMode: "NON_STREAMING",
        modelIdentifierForSyntheticTest: `synthetic-model-${number}`,
        modelFamily: "SYNTHETIC_MODEL_FAMILY",
        accountDataControlState: "SYNTHETIC_TEST_CONTROL",
        officialEndpointEvidenceUrl: `https://provider${number}.example.test/docs/endpoint`,
        officialTermsUrl: `https://provider${number}.example.test/legal/terms`,
        officialPrivacyUrl: `https://provider${number}.example.test/legal/privacy`,
        officialApiDataUseUrl: `https://provider${number}.example.test/legal/data-use`,
        officialRetentionUrl: `https://provider${number}.example.test/legal/retention`,
        officialSubprocessorUrl: `https://provider${number}.example.test/legal/subprocessors`,
        officialDeletionOrSupportUrl: `https://provider${number}.example.test/legal/deletion`,
        documentEffectiveDates: ["2026-08-01"],
        evidenceObservedAt: "2026-08-26T09:00:00+08:00",
        credentialOwner: "OWNER",
        credentialInjectionMethod: "RUNTIME_OPERATOR_INJECTION",
        maximumAuthorizedTestCost: "USD 1.00",
        notesWithoutSecretOrUserData: "Synthetic contract fixture metadata only",
      };
    }),
  };
}

function scopeFor(formal) {
  const providerSlots = formal ? [...PROVIDER_SLOTS] : [PROVIDER_SLOTS[0]];
  const payloadClasses = formal ? [...PAYLOAD_CLASSES] : [PAYLOAD_CLASSES[0]];
  const evidenceDimensionIds = formal ? [...EVIDENCE_DIMENSION_IDS] : [EVIDENCE_DIMENSION_IDS[0]];
  const profileCount = providerSlots.length * payloadClasses.length;
  return {
    providerSlots,
    payloadClasses,
    evidenceDimensionIds,
    policyPackages: [...POLICY_PACKAGES],
    requiredAdmissionProfileCount: profileCount,
    requiredDimensionAssessmentCount: profileCount * evidenceDimensionIds.length,
    requiredPolicyPackageComparisonCount: profileCount * 3,
    appPrivacyMappingRowMinimum: 5,
    applePolicySourceCount: 3,
  };
}

function makeSignature(role) {
  return withFingerprint({
    signatureId: `D053-SIG-${role}`,
    role,
    signerRef: `CONTROLLED-SIGNER-${role}`,
    signedArtifactSha256: digest(`signed-artifact-${role}`),
    signatureMethod: "SIGNED_DOCUMENT_REFERENCE",
    signedAt: "2026-08-27T09:30:00+08:00",
    callerAsserted: true,
    signatureFingerprint: "",
  }, "signatureFingerprint");
}

function mappingSignatureFields(formal) {
  return formal ? {
    productSignatureRef: "D053-SIG-PRODUCT",
    privacySecuritySignatureRef: "D053-SIG-PRIVACY_SECURITY",
    releaseSignatureRef: "D053-SIG-RELEASE",
    signedAt: "2026-08-27T09:30:00+08:00",
  } : {
    productSignatureRef: null,
    privacySecuritySignatureRef: null,
    releaseSignatureRef: null,
    signedAt: null,
  };
}

function profileId(providerSlot, payloadClass) {
  return `D053-PROFILE-${providerSlot}-${payloadClass.toUpperCase()}`;
}

function makeInput({ formal = false } = {}) {
  const oi07Intake = oi07Input();
  const oi07IntakeResult = evaluateOi07ProviderTargetIntake(oi07Intake);
  const matrixScope = scopeFor(formal);
  const providerTargets = matrixScope.providerSlots.map((providerSlot) => {
    const target = oi07Intake.targets.find((item) => item.providerSlot === providerSlot);
    const record = {
      providerSlot,
      providerLegalEntity: target.providerLegalEntity,
      apiProductName: target.apiProductName,
      apiProductPlan: target.apiProductPlan,
      apiProductRevision: target.apiProductRevision,
      accountType: target.accountType,
      accountRegion: target.accountRegion,
      intendedUserRegion: target.intendedUserRegion,
      baseUrl: target.baseUrl,
      modelFamily: target.modelFamily,
      accountDataControlState: target.accountDataControlState,
      credentialOwner: target.credentialOwner,
      oi07Revision: oi07Intake.oi07Revision,
      targetFingerprint: "",
    };
    record.targetFingerprint = computeD053ProviderTargetFingerprint(
      record,
      record.oi07Revision,
      oi07IntakeResult.inputFingerprint,
      oi07IntakeResult.resultFingerprint,
    );
    return record;
  });
  const sourceSnapshots = providerTargets.map((target, index) => withFingerprint({
    evidenceId: `D053-EV-${target.providerSlot}-OFFICIAL`,
    providerTargetFingerprint: target.targetFingerprint,
    sourceKind: formal ? "OFFICIAL_PUBLIC_HTTPS" : "SYNTHETIC_CONTRACT_SOURCE",
    sourceUrlOrSecureReference: `https://provider${index + 1}.example.test/legal/evidence`,
    finalUrl: `https://provider${index + 1}.example.test/legal/evidence`,
    httpStatus: 200,
    observedAt: "2026-08-27T08:00:00+08:00",
    documentTitle: "Synthetic official evidence fixture",
    effectiveAt: formal ? "2026-08-01T00:00:00+08:00" : "UNKNOWN",
    expiresAt: formal ? "2026-11-01T00:00:00+08:00" : "UNKNOWN",
    applicableProductPlan: target.apiProductPlan,
    applicableRegions: [target.intendedUserRegion],
    canonicalSnapshotSha256: digest(`snapshot-${target.providerSlot}`),
    claimIds: [`D053-CLAIM-${target.providerSlot}-ALL-DIMENSIONS`],
    supersedesEvidenceId: null,
    replayState: formal ? "CALLER_ASSERTED_REPLAYABLE" : "SYNTHETIC_ONLY",
    snapshotFingerprint: "",
  }, "snapshotFingerprint"));
  const signatures = formal ? [
    makeSignature("PRODUCT"),
    makeSignature("PRIVACY_SECURITY"),
    makeSignature("RELEASE"),
  ] : [];
  const descriptors = matrixScope.providerSlots.flatMap((providerSlot) => matrixScope.payloadClasses.map((payloadClass) => ({ providerSlot, payloadClass })));
  const admissionProfiles = descriptors.map(({ providerSlot, payloadClass }) => {
    const target = providerTargets.find((item) => item.providerSlot === providerSlot);
    const id = profileId(providerSlot, payloadClass);
    return withFingerprint({
      profileId: id,
      oi07Revision: oi07Intake.oi07Revision,
      providerSlot,
      providerTargetFingerprint: target.targetFingerprint,
      payloadClass,
      intendedUserRegion: target.intendedUserRegion,
      candidatePolicyPackage: "A",
      appPrivacyMappingRef: `D053-AP-${providerSlot}-${payloadClass.toUpperCase()}`,
      privacyPolicyMappingRef: `D053-PP-${providerSlot}-${payloadClass.toUpperCase()}`,
      d033DisclosureMappingRef: `D053-D033-${providerSlot}-${payloadClass.toUpperCase()}`,
      sourceSnapshotRefs: [`D053-EV-${providerSlot}-OFFICIAL`],
      conflictIds: [],
      expiryAt: "2026-10-01T00:00:00+08:00",
      profileDisposition: formal ? "A_COMPATIBLE_CANDIDATE" : "UNKNOWN_EVIDENCE_GAP_OR_CONFLICT",
      reviewRefs: [],
      profileFingerprint: "",
    }, "profileFingerprint");
  });
  const dimensionAssessments = admissionProfiles.flatMap((profile) => matrixScope.evidenceDimensionIds.map((evidenceDimensionId) => withFingerprint({
    assessmentId: `D053-ASSESS-${profile.providerSlot}-${profile.payloadClass.toUpperCase()}-${evidenceDimensionId.toUpperCase()}`,
    profileId: profile.profileId,
    evidenceDimensionId,
    status: formal ? "SUPPORTED_COMPATIBLE" : "UNKNOWN",
    riskTreatment: "NONE",
    rationaleSha256: digest(`rationale-${profile.profileId}-${evidenceDimensionId}`),
    evidenceRefs: formal ? [`D053-EV-${profile.providerSlot}-OFFICIAL`] : [],
    conflictRefs: [],
    assessedAt: "2026-08-27T09:00:00+08:00",
    expiresAt: "2026-10-01T00:00:00+08:00",
    assessmentFingerprint: "",
  }, "assessmentFingerprint")));
  const appPrivacyMappingRows = admissionProfiles.map((profile) => withFingerprint({
    mappingRowId: profile.appPrivacyMappingRef,
    payloadClass: profile.payloadClass,
    transmittedElementSha256: digest(`transmitted-element-${profile.payloadClass}`),
    sourceDataOrigin: ["trend_summary", "guidance_context"].includes(profile.payloadClass) ? "LOCAL_DERIVED_SUMMARY" : "LOCAL_USER_INPUT",
    appleDataTypeCandidates: profile.payloadClass.includes("photo") ? ["Photos or Videos"] : ["Other User Content"],
    finalAppleDataTypes: formal ? (profile.payloadClass.includes("photo") ? ["Photos or Videos"] : ["Other User Content"]) : [],
    thirdPartyRecipient: `PROVIDER-TARGET-${profile.providerSlot}`,
    providerTargetFingerprint: profile.providerTargetFingerprint,
    collectionDecision: formal ? "YES" : "UNKNOWN",
    collectionRationaleEvidenceRefs: formal ? [`D053-EV-${profile.providerSlot}-OFFICIAL`] : [],
    linkedDecision: formal ? "NO" : "UNKNOWN",
    linkedRationaleEvidenceRefs: formal ? [`D053-EV-${profile.providerSlot}-OFFICIAL`] : [],
    trackingDecision: formal ? "NO" : "UNKNOWN",
    trackingRationaleEvidenceRefs: formal ? [`D053-EV-${profile.providerSlot}-OFFICIAL`] : [],
    purposes: ["APP_FUNCTIONALITY"],
    retentionAndDeletionSummarySha256: digest(`retention-${profile.profileId}`),
    privacyPolicyClauseRefs: formal ? ["PRIVACY-CLAUSE-AI"] : [],
    privacyChoicesOrDeletionRefs: formal ? ["PRIVACY-CHOICE-DELETE"] : [],
    d033DisclosureFieldRefs: formal ? ["D033-DISCLOSURE-PROVIDER"] : [],
    providerProfileRefs: [profile.profileId],
    ...mappingSignatureFields(formal),
    mappingFingerprint: "",
  }, "mappingFingerprint"));
  const privacyPolicyMappings = admissionProfiles.map((profile) => withFingerprint({
    privacyPolicyMappingId: profile.privacyPolicyMappingRef,
    profileId: profile.profileId,
    publicPrivacyPolicyUrl: formal ? "https://nuttie.example.test/privacy" : "UNKNOWN",
    privacyChoicesUrl: formal ? "https://nuttie.example.test/privacy/choices" : "UNKNOWN",
    clauseRefs: formal ? ["PRIVACY-CLAUSE-AI"] : [],
    appPrivacyMappingRefs: [profile.appPrivacyMappingRef],
    consistencyState: formal ? "CONSISTENT" : "UNKNOWN",
    evidenceRefs: formal ? [`D053-EV-${profile.providerSlot}-OFFICIAL`] : [],
    ...mappingSignatureFields(formal),
    mappingFingerprint: "",
  }, "mappingFingerprint"));
  const d033DisclosureMappings = admissionProfiles.map((profile) => withFingerprint({
    d033DisclosureMappingId: profile.d033DisclosureMappingRef,
    profileId: profile.profileId,
    disclosureFieldRefs: formal ? ["D033-DISCLOSURE-PROVIDER"] : [],
    appPrivacyMappingRefs: [profile.appPrivacyMappingRef],
    consistencyState: formal ? "CONSISTENT" : "UNKNOWN",
    evidenceRefs: formal ? [`D053-EV-${profile.providerSlot}-OFFICIAL`] : [],
    ...mappingSignatureFields(formal),
    mappingFingerprint: "",
  }, "mappingFingerprint"));
  const policyPackageComparisons = admissionProfiles.flatMap((profile) => POLICY_PACKAGES.map((policyPackage) => withFingerprint({
    profileId: profile.profileId,
    policyPackage,
    disposition: policyPackage === "C"
      ? "C_NOT_OWNER_READY"
      : formal
        ? policyPackage === "A" ? "A_COMPATIBLE_CANDIDATE" : "B_REVIEWABLE_CANDIDATE"
        : "UNKNOWN_EVIDENCE_GAP_OR_CONFLICT",
    blockingAssessmentIds: formal || policyPackage === "C" ? [] : dimensionAssessments.filter((item) => item.profileId === profile.profileId).map(({ assessmentId }) => assessmentId),
    residualRiskAssessmentIds: [],
    findingIds: [],
    comparisonFingerprint: "",
  }, "comparisonFingerprint")));
  const expiryAndChangeMonitoring = withFingerprint({
    changeTriggerIds: [...CHANGE_TRIGGER_IDS],
    monitorEvidenceRefs: formal ? sourceSnapshots.map(({ evidenceId }) => evidenceId) : [],
    monitoringDisposition: formal ? "ACTIVE_CALLER_ASSERTED" : "NOT_ESTABLISHED",
    failBeforeCredentialRead: true,
    gracePeriodAllowed: false,
    monitorFingerprint: "",
  }, "monitorFingerprint");
  const input = {
    schemaVersion: INPUT_SCHEMA_VERSION,
    reportId: "D053-REPORT-R001",
    recordKind: formal ? "FORMAL_EVIDENCE_REPORT" : "SYNTHETIC_CONTRACT_FIXTURE",
    protocolIdentity: {
      protocolId: "D053-PROVIDER-EVIDENCE-APP-PRIVACY-PROTOCOL-001",
      protocolRevision: "D053-PROTOCOL-R001",
      protocolArtifactCommit: "d6e72dd449c8de8b385b6f9e6427cb0fd99f7ce7",
      protocolArtifactBlobOid: "d422ad302e8d2c32fc9184557bf5f458693ceaad",
      protocolArtifactSha256: "30ca6cb9e4c4878f1fb761fdd571f29a449d582a058dd9142200da0e60e3fe84",
      sourcePacketVersion: "PACKET-001-R1",
      sourceCardCommit: "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117",
      sourceCardBlobOid: "d406e17c8e7b0e11218a8907e757a603df01e465",
      sourceCardSha256: "9c1cc88d34ec116f2825d6a71dd580ac8c625d99b30c87a8a06cf7086b894caf",
    },
    oi07Intake,
    oi07IntakeResult,
    matrixScope,
    providerTargets,
    sourceSnapshots,
    conflicts: [],
    admissionProfiles,
    dimensionAssessments,
    appPrivacyMappingRows,
    privacyPolicyMappings,
    d033DisclosureMappings,
    policyPackageComparisons,
    signatures,
    independentReviewRefs: [],
    findings: [],
    expiryAndChangeMonitoring,
    overallDisposition: formal ? "EVIDENCE_REVIEW_REQUIRED" : "INCONCLUSIVE",
    generatedAt: "2026-08-27T10:00:00+08:00",
    reportSha256: "",
    containsRealUserData: false,
    containsCredential: false,
    containsProviderBody: false,
    containsRestrictedContract: false,
  };
  input.reportSha256 = computeD053ProviderEvidenceReportSha256(input);
  return input;
}

function refreshReport(input) {
  input.reportSha256 = computeD053ProviderEvidenceReportSha256(input);
  return input;
}

test("locks D-053 matrix, report, result, disposition, and zero-authorization boundaries", () => {
  assert.equal(INPUT_SCHEMA_VERSION, "D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT_INPUT_V1");
  assert.equal(RESULT_SCHEMA_VERSION, "D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT_RESULT_V1");
  assert.equal(CONTRACT_ID, "D053-PROVIDER-EVIDENCE-APP-PRIVACY-REPORT-CONTRACT-001");
  assert.deepEqual(PROVIDER_SLOTS, ["P1", "P2", "P3"]);
  assert.equal(PAYLOAD_CLASSES.length, 5);
  assert.equal(EVIDENCE_DIMENSION_IDS.length, 10);
  assert.deepEqual(POLICY_PACKAGES, ["A", "B", "C"]);
  assert.equal(DIMENSION_STATUSES.length, 4);
  assert.equal(PROFILE_DISPOSITIONS.length, 6);
  assert.equal(CHANGE_TRIGGER_IDS.length, 12);
  assert.equal(BOUNDARY.providerAdmissionGranted, false);
  assert.equal(BOUNDARY.sendAuthorization, "NOT_GRANTED");
  assert.equal(BOUNDARY.networkRequests, 0);
  assert.equal(BOUNDARY.formalImplementationAuthorized, false);
});

test("accepts a reduced synthetic fixture only as inconclusive non-evidence", () => {
  const result = evaluateD053ProviderEvidenceAppPrivacyReport(makeInput());
  assert.equal(result.recordKind, "SYNTHETIC_CONTRACT_FIXTURE");
  assert.equal(result.syntheticContractFixtureOnly, true);
  assert.equal(result.overallDisposition, "INCONCLUSIVE");
  assert.equal(result.admissionProfileCount, 1);
  assert.equal(result.dimensionAssessmentCount, 1);
  assert.equal(result.policyPackageComparisonCount, 3);
  assert.equal(result.unknownDimensionCount, 1);
  assert.equal(result.d053PassCandidate, false);
  assert.equal(result.providerAdmissionGranted, false);
  assert.equal(result.blockers.includes("SYNTHETIC_CONTRACT_FIXTURE_ONLY"), true);
});

test("recomputes a complete formal 15-profile, 150-assessment, 45-comparison report without granting PASS", () => {
  const result = evaluateD053ProviderEvidenceAppPrivacyReport(makeInput({ formal: true }));
  assert.equal(result.overallDisposition, "EVIDENCE_REVIEW_REQUIRED");
  assert.equal(result.providerTargetCount, 3);
  assert.equal(result.payloadClassCount, 5);
  assert.equal(result.admissionProfileCount, 15);
  assert.equal(result.dimensionAssessmentCount, 150);
  assert.equal(result.appPrivacyMappingRowCount, 15);
  assert.equal(result.policyPackageComparisonCount, 45);
  assert.equal(result.compatibleDimensionCount, 150);
  assert.equal(result.aCompatibleCandidateCount, 15);
  assert.equal(result.d053PassCandidate, false);
  assert.equal(result.blockers.includes("SIGNATURES_CALLER_ASSERTED_NOT_VERIFIED"), true);
});

test("rejects missing Provider, payload, dimension, and A/B/C Cartesian rows", () => {
  const cases = [];
  const provider = makeInput({ formal: true });
  provider.providerTargets.pop();
  cases.push(refreshReport(provider));
  const profile = makeInput({ formal: true });
  profile.admissionProfiles.pop();
  cases.push(refreshReport(profile));
  const dimension = makeInput({ formal: true });
  dimension.dimensionAssessments.pop();
  cases.push(refreshReport(dimension));
  const comparison = makeInput({ formal: true });
  comparison.policyPackageComparisons.pop();
  cases.push(refreshReport(comparison));
  cases.forEach((input) => assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(input)));
});

test("rejects OI-07 input/result, target revision, and target fingerprint drift", () => {
  const cases = [];
  const result = makeInput();
  result.oi07IntakeResult = { ...result.oi07IntakeResult, resultFingerprint: digest("forged-result") };
  cases.push(refreshReport(result));
  const revision = makeInput();
  revision.providerTargets[0].oi07Revision = "OI07-R002";
  cases.push(refreshReport(revision));
  const target = makeInput();
  target.providerTargets[0].targetFingerprint = digest("forged-target");
  cases.push(refreshReport(target));
  cases.forEach((input) => assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(input)));
});

test("rejects cross-Provider source, conflict, assessment, and mapping reuse", () => {
  const cases = [];
  const source = makeInput({ formal: true });
  source.sourceSnapshots[0].providerTargetFingerprint = source.providerTargets[1].targetFingerprint;
  cases.push(refreshReport(source));
  const assessment = makeInput({ formal: true });
  assessment.dimensionAssessments[0].evidenceRefs = ["D053-EV-P2-OFFICIAL"];
  cases.push(refreshReport(assessment));
  const mapping = makeInput({ formal: true });
  mapping.appPrivacyMappingRows[0].providerTargetFingerprint = mapping.providerTargets[1].targetFingerprint;
  cases.push(refreshReport(mapping));
  cases.forEach((input) => assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(input)));
});

test("requires official conclusions to cite evidence and open conflicts to remain UNKNOWN", () => {
  const noEvidence = makeInput({ formal: true });
  noEvidence.dimensionAssessments[0].evidenceRefs = [];
  noEvidence.dimensionAssessments[0] = withFingerprint(noEvidence.dimensionAssessments[0], "assessmentFingerprint");
  assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(noEvidence)));

  const conflict = makeInput();
  const target = conflict.providerTargets[0];
  conflict.sourceSnapshots.push(withFingerprint({
    ...conflict.sourceSnapshots[0],
    evidenceId: "D053-EV-P1-CONFLICTING",
    canonicalSnapshotSha256: digest("conflicting-snapshot"),
    claimIds: ["D053-CLAIM-P1-CONFLICTING"],
    snapshotFingerprint: "",
  }, "snapshotFingerprint"));
  conflict.conflicts = [withFingerprint({
    conflictId: "D053-CONFLICT-P1-001",
    providerTargetFingerprint: target.targetFingerprint,
    evidenceIds: ["D053-EV-P1-OFFICIAL", "D053-EV-P1-CONFLICTING"],
    claimIds: ["D053-CLAIM-P1-CONFLICTING"],
    status: "OPEN",
    resolutionDisposition: null,
    resolverRef: null,
    resolvedAt: null,
    summarySha256: digest("conflict-summary"),
    conflictFingerprint: "",
  }, "conflictFingerprint")];
  conflict.admissionProfiles[0].conflictIds = ["D053-CONFLICT-P1-001"];
  conflict.admissionProfiles[0] = withFingerprint(conflict.admissionProfiles[0], "profileFingerprint");
  conflict.dimensionAssessments[0].conflictRefs = ["D053-CONFLICT-P1-001"];
  conflict.dimensionAssessments[0] = withFingerprint(conflict.dimensionAssessments[0], "assessmentFingerprint");
  conflict.policyPackageComparisons[0].blockingAssessmentIds = [conflict.dimensionAssessments[0].assessmentId];
  conflict.policyPackageComparisons[0] = withFingerprint(conflict.policyPackageComparisons[0], "comparisonFingerprint");
  conflict.policyPackageComparisons[1].blockingAssessmentIds = [conflict.dimensionAssessments[0].assessmentId];
  conflict.policyPackageComparisons[1] = withFingerprint(conflict.policyPackageComparisons[1], "comparisonFingerprint");
  assert.equal(evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(conflict)).overallDisposition, "INCONCLUSIVE");
});

test("derives A denial from documented incompatibility and requires B bounded-residual coverage", () => {
  const input = makeInput({ formal: true });
  const assessment = input.dimensionAssessments[0];
  assessment.status = "SUPPORTED_INCOMPATIBLE";
  assessment.riskTreatment = "NON_WAIVABLE";
  input.dimensionAssessments[0] = withFingerprint(assessment, "assessmentFingerprint");
  for (const comparison of input.policyPackageComparisons.slice(0, 2)) {
    comparison.disposition = "DENY_BY_DOCUMENTED_FACT";
    comparison.blockingAssessmentIds = [assessment.assessmentId];
    Object.assign(comparison, withFingerprint(comparison, "comparisonFingerprint"));
  }
  input.admissionProfiles[0].profileDisposition = "DENY_BY_DOCUMENTED_FACT";
  input.admissionProfiles[0] = withFingerprint(input.admissionProfiles[0], "profileFingerprint");
  assert.equal(evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(input)).deniedProfileCount, 1);

  const residual = makeInput({ formal: true });
  residual.dimensionAssessments[0].status = "SUPPORTED_INCOMPATIBLE";
  residual.dimensionAssessments[0].riskTreatment = "BOUNDED_RESIDUAL";
  residual.dimensionAssessments[0] = withFingerprint(residual.dimensionAssessments[0], "assessmentFingerprint");
  residual.policyPackageComparisons[0].disposition = "DENY_BY_DOCUMENTED_FACT";
  residual.policyPackageComparisons[0].blockingAssessmentIds = [residual.dimensionAssessments[0].assessmentId];
  residual.policyPackageComparisons[0] = withFingerprint(residual.policyPackageComparisons[0], "comparisonFingerprint");
  residual.policyPackageComparisons[1].disposition = "B_REVIEWABLE_CANDIDATE";
  residual.policyPackageComparisons[1].residualRiskAssessmentIds = [residual.dimensionAssessments[0].assessmentId];
  residual.policyPackageComparisons[1] = withFingerprint(residual.policyPackageComparisons[1], "comparisonFingerprint");
  assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(residual)));
});

test("C remains not Owner-ready and cannot be promoted to an admission candidate", () => {
  const input = makeInput({ formal: true });
  input.policyPackageComparisons[2].disposition = "A_COMPATIBLE_CANDIDATE";
  input.policyPackageComparisons[2] = withFingerprint(input.policyPackageComparisons[2], "comparisonFingerprint");
  assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(input)));
});

test("mapping unknowns and missing or wrong-role signatures cannot produce A/B candidates", () => {
  const cases = [];
  const unknown = makeInput({ formal: true });
  unknown.appPrivacyMappingRows[0].trackingDecision = "UNKNOWN";
  unknown.appPrivacyMappingRows[0].trackingRationaleEvidenceRefs = [];
  unknown.appPrivacyMappingRows[0] = withFingerprint(unknown.appPrivacyMappingRows[0], "mappingFingerprint");
  cases.push(refreshReport(unknown));
  const missing = makeInput({ formal: true });
  missing.appPrivacyMappingRows[0].releaseSignatureRef = null;
  missing.appPrivacyMappingRows[0] = withFingerprint(missing.appPrivacyMappingRows[0], "mappingFingerprint");
  cases.push(refreshReport(missing));
  const role = makeInput({ formal: true });
  role.signatures.find(({ role: itemRole }) => itemRole === "RELEASE").role = "PRODUCT";
  role.signatures[2] = withFingerprint(role.signatures[2], "signatureFingerprint");
  cases.push(refreshReport(role));
  cases.forEach((item) => assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(item)));
});

test("enforces A 90-day, B 30-day, generated-time expiry, and keeps C unassessed", () => {
  const tooLong = makeInput({ formal: true });
  tooLong.admissionProfiles[0].expiryAt = "2026-12-31T00:00:00+08:00";
  tooLong.admissionProfiles[0] = withFingerprint(tooLong.admissionProfiles[0], "profileFingerprint");
  assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(tooLong)));

  const expired = makeInput({ formal: true });
  expired.generatedAt = "2026-10-02T00:00:00+08:00";
  assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(expired)));

  const bTooLong = makeInput({ formal: true });
  bTooLong.admissionProfiles[0].candidatePolicyPackage = "B";
  bTooLong.admissionProfiles[0].profileDisposition = "B_REVIEWABLE_CANDIDATE";
  bTooLong.admissionProfiles[0] = withFingerprint(bTooLong.admissionProfiles[0], "profileFingerprint");
  assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(bTooLong)));

  const c = makeInput();
  c.admissionProfiles[0].candidatePolicyPackage = "C";
  c.admissionProfiles[0].profileDisposition = "NOT_ASSESSED";
  c.admissionProfiles[0].expiryAt = "2026-08-27T09:00:00+08:00";
  c.admissionProfiles[0] = withFingerprint(c.admissionProfiles[0], "profileFingerprint");
  const cResult = evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(c));
  assert.equal(cResult.notAssessedProfileCount, 1);
  assert.equal(cResult.d053PassCandidate, false);
});

test("requires all five payload classes in formal App Privacy mapping coverage", () => {
  const input = makeInput({ formal: true });
  input.appPrivacyMappingRows = input.appPrivacyMappingRows.filter(({ payloadClass }) => payloadClass !== "guidance_context");
  assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(input)));
});

test("open P0/P1/P2 findings have FAIL priority while owned P3 remains reviewable", () => {
  const high = makeInput({ formal: true });
  high.findings = [withFingerprint({
    findingId: "D053-FINDING-BLOCKING-001",
    severity: "P1",
    status: "OPEN",
    profileIds: [high.admissionProfiles[0].profileId],
    assessmentIds: [],
    mappingRowIds: [],
    conflictIds: [],
    ownerRef: "OWNER-REF-P1",
    dueAt: "2026-09-15T00:00:00+08:00",
    nonBlockingRationaleSha256: null,
    summarySha256: digest("blocking finding"),
    findingFingerprint: "",
  }, "findingFingerprint")];
  high.overallDisposition = "FAIL";
  assert.equal(evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(high)).openP1FindingCount, 1);

  const p3 = makeInput({ formal: true });
  p3.findings = [withFingerprint({
    findingId: "D053-FINDING-P3-001",
    severity: "P3",
    status: "OPEN",
    profileIds: [p3.admissionProfiles[0].profileId],
    assessmentIds: [],
    mappingRowIds: [],
    conflictIds: [],
    ownerRef: "OWNER-REF-P3",
    dueAt: "2026-09-15T00:00:00+08:00",
    nonBlockingRationaleSha256: digest("non-blocking rationale"),
    summarySha256: digest("p3 finding"),
    findingFingerprint: "",
  }, "findingFingerprint")];
  assert.equal(evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(p3)).overallDisposition, "EVIDENCE_REVIEW_REQUIRED");
});

test("rejects snapshot, conflict, profile, assessment, mapping, signature, finding, comparison, monitor, and report fingerprint drift", () => {
  const mutations = [
    (input) => { input.sourceSnapshots[0].snapshotFingerprint = digest("snapshot"); },
    (input) => { input.admissionProfiles[0].profileFingerprint = digest("profile"); },
    (input) => { input.dimensionAssessments[0].assessmentFingerprint = digest("assessment"); },
    (input) => { input.appPrivacyMappingRows[0].mappingFingerprint = digest("app"); },
    (input) => { input.privacyPolicyMappings[0].mappingFingerprint = digest("privacy"); },
    (input) => { input.d033DisclosureMappings[0].mappingFingerprint = digest("d033"); },
    (input) => { input.signatures[0].signatureFingerprint = digest("signature"); },
    (input) => { input.policyPackageComparisons[0].comparisonFingerprint = digest("comparison"); },
    (input) => { input.expiryAndChangeMonitoring.monitorFingerprint = digest("monitor"); },
  ];
  mutations.forEach((mutate) => {
    const input = makeInput({ formal: true });
    mutate(input);
    assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(input)));
  });
  const report = makeInput();
  report.reportSha256 = digest("report");
  assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(report));
});

test("binds result fields, blockers, boundary, and result fingerprint", () => {
  const input = makeInput();
  const result = evaluateD053ProviderEvidenceAppPrivacyReport(input);
  validateD053ProviderEvidenceAppPrivacyReportResult(result, input);
  for (const mutate of [
    (copy) => { copy.admissionProfileCount += 1; },
    (copy) => { copy.blockers = []; },
    (copy) => { copy.boundary.providerAdmissionGranted = true; },
    (copy) => { copy.resultFingerprint = digest("forged"); },
  ]) {
    const changed = clone(result);
    mutate(changed);
    assert.throws(() => validateD053ProviderEvidenceAppPrivacyReportResult(changed, input));
  }
});

test("copies and deeply freezes normalized input and result", () => {
  const input = makeInput();
  const normalized = normalizeD053ProviderEvidenceAppPrivacyReport(input);
  const result = evaluateD053ProviderEvidenceAppPrivacyReport(input);
  input.providerTargets[0].providerLegalEntity = "Changed outside";
  assert.notEqual(normalized.providerTargets[0].providerLegalEntity, input.providerTargets[0].providerLegalEntity);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.dimensionAssessments[0]), true);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.boundary), true);
});

test("rejects sensitive-looking material without echoing the canary", () => {
  const canary = "sk-sensitive-canary-123456789";
  const input = makeInput();
  input.sourceSnapshots[0].documentTitle = canary;
  input.sourceSnapshots[0] = withFingerprint(input.sourceSnapshots[0], "snapshotFingerprint");
  let error;
  try { evaluateD053ProviderEvidenceAppPrivacyReport(refreshReport(input)); } catch (caught) { error = caught; }
  assert.equal(error?.code, "UNSAFE_D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT");
  assert.equal(`${error?.message}${JSON.stringify(error?.details)}`.includes(canary), false);
});

test("rejects accessors, symbols, special objects, cycles, extra fields, and resource overflow", () => {
  const cases = [];
  const accessor = makeInput();
  Object.defineProperty(accessor.providerTargets[0], "modelFamily", { enumerable: true, get: () => "SYNTHETIC" });
  cases.push(accessor);
  const symbol = makeInput();
  symbol[Symbol("hidden")] = true;
  cases.push(symbol);
  const special = makeInput();
  special.expiryAndChangeMonitoring = new Date();
  cases.push(special);
  const cyclic = makeInput();
  cyclic.self = cyclic;
  cases.push(cyclic);
  const extra = makeInput();
  extra.providerAdmissionGranted = true;
  cases.push(refreshReport(extra));
  const overflow = makeInput();
  overflow.independentReviewRefs = Array.from({ length: 65 }, (_, index) => ({
    reviewId: `D053-REVIEW-${String(index).padStart(3, "0")}`,
    reviewerRole: "PRIVACY_SECURITY",
    reviewedArtifactSha256: digest(`artifact-${index}`),
    disposition: "INCONCLUSIVE",
    signedAt: "2026-08-27T09:00:00+08:00",
    summarySha256: digest(`summary-${index}`),
  }));
  cases.push(refreshReport(overflow));
  cases.forEach((input) => assert.throws(() => evaluateD053ProviderEvidenceAppPrivacyReport(input)));
});

test("source performs no filesystem, network, clock, process, Provider, Apple, or report side effect", () => {
  const source = fs.readFileSync(new URL("./d053-provider-evidence-app-privacy-report-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    /from\s+["']node:fs["']/,
    /from\s+["']node:net["']/,
    /from\s+["']node:http/,
    /\bfetch\s*\(/,
    /\bDate\.now\s*\(/,
    /\bprocess\.(?:env|cwd|chdir|exit)/,
    /\b(?:readFile|writeFile|mkdir|unlink|rm)\s*\(/,
    /\b(?:xcrun|xcodebuild|App Store Connect)\b/i,
  ]) assert.equal(forbidden.test(source), false, forbidden.toString());
  const result = evaluateD053ProviderEvidenceAppPrivacyReport(makeInput());
  assert.equal(result.boundary.sourceSnapshotReads, 0);
  assert.equal(result.boundary.providerDocumentReads, 0);
  assert.equal(result.boundary.networkRequests, 0);
  assert.equal(result.boundary.providerRequests, 0);
  assert.equal(result.boundary.businessWrites, 0);
});
