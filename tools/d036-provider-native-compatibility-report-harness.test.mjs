import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import { evaluateOi07ProviderTargetIntake } from "./oi07-provider-target-intake-harness.mjs";
import {
  ATTEMPT_SCHEMA_VERSION,
  BOUNDARY,
  BUILD_CONFIGURATIONS,
  CONTRACT_ID,
  INPUT_SCHEMA_VERSION,
  LIFECYCLE_FIELDS,
  NATIVE_BOUNDARY_SURFACE_IDS,
  OFFLINE_SCENARIO_FAMILY_IDS,
  PATH_KINDS,
  PROFILE_IDS,
  PROVIDER_SLOTS,
  RESULT_SCHEMA_VERSION,
  RUNTIME_TARGETS,
  STATE_ISOLATION_FIELDS,
  computeD036ProviderNativeAttemptDiagnosticFingerprint,
  computeD036ProviderNativeAttemptIdentityFingerprint,
  computeD036ProviderNativeReportSha256,
  evaluateD036ProviderNativeCompatibilityReport,
  normalizeD036ProviderNativeCompatibilityReport,
  validateD036ProviderNativeCompatibilityReportResult,
} from "./d036-provider-native-compatibility-report-harness.mjs";

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
  const targets = PROVIDER_SLOTS.map((providerSlot, index) => {
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
      baseUrl: `https://provider${number}.example`,
      endpointPathShape: "/v1/synthetic",
      queryRequired: "FALSE",
      redirectDocumented: "NO_REDIRECT_DOCUMENTED",
      streamingMode: "NON_STREAMING",
      modelIdentifierForSyntheticTest: `synthetic-model-${number}`,
      modelFamily: "SYNTHETIC_MODEL_FAMILY",
      accountDataControlState: "TEST_ONLY",
      officialEndpointEvidenceUrl: `https://provider${number}.example/docs/endpoint`,
      officialTermsUrl: `https://provider${number}.example/legal/terms`,
      officialPrivacyUrl: `https://provider${number}.example/legal/privacy`,
      officialApiDataUseUrl: `https://provider${number}.example/legal/data-use`,
      officialRetentionUrl: `https://provider${number}.example/legal/retention`,
      officialSubprocessorUrl: `https://provider${number}.example/legal/subprocessors`,
      officialDeletionOrSupportUrl: `https://provider${number}.example/legal/deletion`,
      documentEffectiveDates: ["2026-08-01"],
      evidenceObservedAt: "2026-08-22T10:00:00+08:00",
      credentialOwner: "OWNER",
      credentialInjectionMethod: "RUNTIME_OPERATOR_INJECTION",
      maximumAuthorizedTestCost: "USD 1.00",
      notesWithoutSecretOrUserData: "Synthetic contract fixture metadata only",
    };
  });
  return {
    schemaVersion: "OI07_PROVIDER_TARGET_INTAKE_INPUT_V1",
    oi07Revision: "OI07-R001",
    providedBy: "OWNER",
    providedAt: "2026-08-22T10:00:00+08:00",
    ownerAuthorizationRef: "OWNER-REF-001",
    targets,
  };
}

function environmentArtifacts(scope) {
  return scope.buildConfigurations.flatMap((buildConfiguration) => scope.runtimeTargets.map((runtimeTarget, index) => {
    const core = {
      environmentArtifactId: `D036-ENV-${buildConfiguration}-${runtimeTarget}`,
      buildConfiguration,
      runtimeTarget,
      macModelIdentifier: "Mac15,7",
      macosVersion: "26.0",
      xcodeVersion: "26.4",
      iosSdkVersion: "26.4",
      runtimeModelIdentifier: runtimeTarget === "PHYSICAL_IPHONE" ? "iPhone17,2" : "iPhone17,2 Simulator",
      runtimeOsVersion: "26.5",
      runtimeOsBuild: "23F79",
      harnessCommit: digest(`commit-${buildConfiguration}-${runtimeTarget}`).slice(0, 40),
      dependencyLockSha256: digest("dependency lock"),
      compilerSettingsSha256: digest(`compiler-${buildConfiguration}`),
      harnessArtifactSha256: digest(`artifact-${buildConfiguration}-${runtimeTarget}`),
      bundleIdentifier: `com.example.nuttie.d036.${buildConfiguration.toLowerCase()}.${index}`,
      signingClass: runtimeTarget === "PHYSICAL_IPHONE" ? "DEVELOPMENT" : "UNSIGNED_SIMULATOR",
      networkCaptureToolAndVersion: "SYNTHETIC_CAPTURE_TOOL_1",
      bootSessionId: `BOOT-${buildConfiguration}-${index}`,
    };
    return withFingerprint({ ...core, identityFingerprint: "" }, "identityFingerprint");
  }));
}

function corpusIdentity() {
  return withFingerprint({
    corpusRevision: "D036-CORPUS-R001",
    fixtureCount: 3,
    manifestSha256: digest("D036 synthetic corpus manifest"),
    canonicalByteCount: 1024,
    corpusFingerprint: "",
    containsRealUserData: false,
    containsCredential: false,
    containsProviderBody: false,
  }, "corpusFingerprint");
}

function executionAuthorization(formal, scope) {
  return withFingerprint({
    authorizationId: formal ? "D036-SPIKE-AUTH-001" : "SYNTHETIC_CONTRACT_ONLY",
    authorizerRef: formal ? "OWNER-AUTHORITY-001" : "SYNTHETIC_CALLER",
    authorizedAt: formal ? "2026-08-22T11:00:00+08:00" : "UNKNOWN",
    expiresAt: formal ? "2026-08-24T11:00:00+08:00" : "UNKNOWN",
    allowedProviderSlots: [...scope.providerSlots],
    allowedAttemptPaths: [...PATH_KINDS],
    maximumTotalCost: formal ? 3 : 0,
    currency: formal ? "USD" : "NONE",
    credentialInjectionMethodRef: formal ? "RUNTIME-INJECTION-001" : "SYNTHETIC_CONTRACT_ONLY",
    callerAssertedAuthorized: formal,
    realNetworkAuthorized: formal,
    credentialInjectionAuthorized: formal,
    authorizationFingerprint: "",
  }, "authorizationFingerprint");
}

function scopeFor(formal) {
  const scope = {
    providerSlots: formal ? [...PROVIDER_SLOTS] : [PROVIDER_SLOTS[0]],
    candidateProfileIds: formal ? [...PROFILE_IDS] : [PROFILE_IDS[0]],
    buildConfigurations: formal ? [...BUILD_CONFIGURATIONS] : [BUILD_CONFIGURATIONS[0]],
    runtimeTargets: formal ? [...RUNTIME_TARGETS] : [RUNTIME_TARGETS[0]],
    requiredCompatibilityCellCount: formal ? 36 : 1,
    offlineScenarioFamilyIds: formal ? [...OFFLINE_SCENARIO_FAMILY_IDS] : [OFFLINE_SCENARIO_FAMILY_IDS[0]],
    nativeBoundarySurfaceIds: formal ? [...NATIVE_BOUNDARY_SURFACE_IDS] : [NATIVE_BOUNDARY_SURFACE_IDS[0]],
  };
  return scope;
}

function zeroRecord(fields) {
  return Object.fromEntries(fields.map((field) => [field, 0]));
}

function makeAttempt(input, descriptor, cellId, pathKind, repetitionIndex, serial, unsafe) {
  const approved = !(unsafe && serial === 0 && pathKind === "NORMAL" && repetitionIndex === 1);
  const observedDisposition = approved
    ? pathKind === "NORMAL"
      ? "SUCCEEDED"
      : pathKind === "CANCEL"
        ? "CANCELLED"
        : "EXPECTED_ERROR"
    : "BOUNDARY_VIOLATION";
  const attempt = {
    schemaVersion: ATTEMPT_SCHEMA_VERSION,
    attemptId: `D036-ATTEMPT-${String(serial).padStart(4, "0")}-${pathKind}-${repetitionIndex}`,
    cellId,
    pathKind,
    repetitionIndex,
    identityFingerprint: computeD036ProviderNativeAttemptIdentityFingerprint(input, descriptor),
    startedMonotonicNs: 100_000 + serial * 1_000 + repetitionIndex * 100,
    endedMonotonicNs: 100_000 + serial * 1_000 + repetitionIndex * 100 + 50,
    hopRecords: [{
      hopIndex: 0,
      originFingerprint: digest(`origin-${descriptor.providerSlot}`),
      originApprovalState: approved ? "APPROVED" : "UNAPPROVED",
      requestCount: 1,
      authorizationByteCount: approved ? 32 : 4,
      payloadByteCount: approved ? 128 : 8,
      responseStatusCode: pathKind === "NORMAL" ? 200 : pathKind === "CANCEL" ? null : 400,
      redirectDisposition: "NO_REDIRECT",
      captureFingerprint: digest(`capture-${serial}-${pathKind}-${repetitionIndex}`),
    }],
    stateIsolationObservation: zeroRecord(STATE_ISOLATION_FIELDS),
    lifecycleObservation: zeroRecord(LIFECYCLE_FIELDS),
    observedDisposition,
    reasonCode: approved ? `${pathKind}_EXPECTED_OUTCOME` : "UNAPPROVED_ORIGIN_BYTES_OBSERVED",
    captureEvidenceFingerprint: digest(`capture-evidence-${serial}-${pathKind}-${repetitionIndex}`),
    diagnosticFingerprint: "",
    containsRealUserData: false,
    containsCredential: false,
    containsProviderBody: false,
  };
  attempt.diagnosticFingerprint = computeD036ProviderNativeAttemptDiagnosticFingerprint(attempt);
  return attempt;
}

function makeCell(input, descriptor, serial, options) {
  const cellId = `D036-CELL-${descriptor.providerSlot}-PROFILE${PROFILE_IDS.indexOf(descriptor.candidateProfileId) + 1}-${descriptor.buildConfiguration}-${descriptor.runtimeTarget}`;
  const environmentArtifact = input.environmentArtifacts.find((artifact) =>
    artifact.buildConfiguration === descriptor.buildConfiguration && artifact.runtimeTarget === descriptor.runtimeTarget);
  const repetitions = options.formal ? options.repetitions : 1;
  const attempts = PATH_KINDS.flatMap((pathKind) => Array.from({ length: repetitions }, (_, index) =>
    makeAttempt(input, descriptor, cellId, pathKind, index + 1, serial, options.unsafe)));
  const hops = attempts.flatMap(({ hopRecords }) => hopRecords);
  const unapproved = hops.filter(({ originApprovalState }) => originApprovalState === "UNAPPROVED");
  const sum = (records, field) => records.reduce((total, record) => total + record[field], 0);
  const stateIsolationViolationCount = attempts.reduce((total, attempt) =>
    total + Object.values(attempt.stateIsolationObservation).reduce((subtotal, value) => subtotal + value, 0), 0);
  const lifecycleViolationCount = attempts.reduce((total, attempt) =>
    total + Object.values(attempt.lifecycleObservation).reduce((subtotal, value) => subtotal + value, 0), 0);
  const unsafe = unapproved.length > 0 || stateIsolationViolationCount > 0 || lifecycleViolationCount > 0;
  const incomplete = repetitions < (options.formal ? 3 : 1);
  const cell = {
    cellId,
    providerSlot: descriptor.providerSlot,
    candidateProfileId: descriptor.candidateProfileId,
    buildConfiguration: descriptor.buildConfiguration,
    runtimeTarget: descriptor.runtimeTarget,
    environmentArtifactId: environmentArtifact.environmentArtifactId,
    attemptIds: attempts.map(({ attemptId }) => attemptId),
    normalAttemptCount: attempts.filter(({ pathKind }) => pathKind === "NORMAL").length,
    cancelAttemptCount: attempts.filter(({ pathKind }) => pathKind === "CANCEL").length,
    expectedErrorAttemptCount: attempts.filter(({ pathKind }) => pathKind === "EXPECTED_ERROR").length,
    observedOriginCount: new Set(hops.map(({ originFingerprint }) => originFingerprint)).size,
    unapprovedRequestCount: sum(unapproved, "requestCount"),
    unapprovedAuthorizationByteCount: sum(unapproved, "authorizationByteCount"),
    unapprovedPayloadByteCount: sum(unapproved, "payloadByteCount"),
    stateIsolationViolationCount,
    lifecycleViolationCount,
    disposition: unsafe
      ? "INCOMPATIBLE_BY_OBSERVATION"
      : incomplete
        ? "INCONCLUSIVE_EVIDENCE_GAP"
        : "COMPATIBLE_WITH_CANDIDATE_PROFILE",
    findingIds: [],
    cellFingerprint: "",
  };
  cell.cellFingerprint = digest(Object.fromEntries(Object.entries(cell).filter(([key]) => key !== "cellFingerprint")));
  return { cell, attempts };
}

function offlineIdentity(input, result, environmentArtifact) {
  return digest({
    protocolIdentity: input.protocolIdentity,
    oi07Revision: input.oi07Intake.oi07Revision,
    oi07InputFingerprint: input.oi07IntakeResult.inputFingerprint,
    oi07ResultFingerprint: input.oi07IntakeResult.resultFingerprint,
    environmentArtifactId: environmentArtifact.environmentArtifactId,
    environmentIdentityFingerprint: environmentArtifact.identityFingerprint,
    corpusFingerprint: input.corpusIdentity.corpusFingerprint,
    candidateProfileId: result.candidateProfileId,
    buildConfiguration: result.buildConfiguration,
    runtimeTarget: result.runtimeTarget,
    scenarioFamilyId: result.scenarioFamilyId,
  });
}

function makeOfflineResults(input, options) {
  return input.matrixScope.candidateProfileIds.flatMap((candidateProfileId) => input.matrixScope.buildConfigurations.flatMap((buildConfiguration) =>
    input.matrixScope.runtimeTargets.flatMap((runtimeTarget) => input.matrixScope.offlineScenarioFamilyIds.map((scenarioFamilyId, index) => {
      const environmentArtifact = input.environmentArtifacts.find((artifact) =>
        artifact.buildConfiguration === buildConfiguration && artifact.runtimeTarget === runtimeTarget);
      const failedCount = options.offlineFailure && index === 0 ? 1 : 0;
      const measuredCount = options.formal ? 10 : 1;
      const core = {
        candidateProfileId,
        buildConfiguration,
        runtimeTarget,
        scenarioFamilyId,
        environmentArtifactId: environmentArtifact.environmentArtifactId,
        identityFingerprint: "",
        measuredCount,
        passedCount: measuredCount - failedCount,
        failedCount,
        findingIds: [],
        evidenceFingerprint: digest(`offline-${candidateProfileId}-${buildConfiguration}-${runtimeTarget}-${scenarioFamilyId}`),
        resultFingerprint: "",
      };
      core.identityFingerprint = offlineIdentity(input, core, environmentArtifact);
      core.resultFingerprint = digest(Object.fromEntries(Object.entries(core).filter(([key]) => key !== "resultFingerprint")));
      return core;
    }))));
}

function makeNativeResults(input, options) {
  return input.matrixScope.candidateProfileIds.flatMap((candidateProfileId) =>
    input.matrixScope.nativeBoundarySurfaceIds.map((surfaceId, index) => {
      const notProven = options.nativeNotProven && candidateProfileId === "rn_fetch_after_native_boundary_proof" && index === 0;
      const environmentArtifactIds = input.environmentArtifacts.map(({ environmentArtifactId }) => environmentArtifactId);
      const core = {
        candidateProfileId,
        surfaceId,
        state: notProven ? "NOT_PROVEN" : "PROVEN",
        rationaleCode: notProven ? "PLATFORM_CONTROL_NOT_OBSERVED" : "PROVEN_BY_REFERENCED_EVIDENCE",
        evidenceRefs: [{
          evidenceId: `D036-EVIDENCE-PROFILE${PROFILE_IDS.indexOf(candidateProfileId) + 1}-${String(index + 1).padStart(2, "0")}`,
          evidenceKind: "SYNTHETIC_NATIVE_OBSERVATION",
          summarySha256: digest(`summary-${candidateProfileId}-${surfaceId}`),
          artifactSha256: digest(`artifact-${candidateProfileId}-${surfaceId}`),
          environmentArtifactIds,
        }],
        environmentArtifactIds,
        findingIds: [],
        resultFingerprint: "",
      };
      core.resultFingerprint = digest(Object.fromEntries(Object.entries(core).filter(([key]) => key !== "resultFingerprint")));
      return core;
    }));
}

function makeInput({
  formal = false,
  unsafe = false,
  repetitions = formal ? 3 : 1,
  offlineFailure = false,
  nativeNotProven = false,
} = {}) {
  const matrixScope = scopeFor(formal);
  const intake = oi07Input();
  const input = {
    schemaVersion: INPUT_SCHEMA_VERSION,
    reportId: "D036-REPORT-R001",
    recordKind: formal ? "FORMAL_SPIKE_REPORT" : "SYNTHETIC_CONTRACT_FIXTURE",
    protocolIdentity: {
      protocolId: "D036-PROVIDER-NATIVE-COMPATIBILITY-SPIKE-PROTOCOL-001",
      protocolRevision: "D036-PROTOCOL-R001",
      protocolArtifactCommit: "a21110dc651cad83b0c77e4fee5f2e96ac51ef88",
      protocolArtifactBlobOid: "c72ae3f053f7beaa5ab2cea8fa730ab2b18c82c1",
      protocolArtifactSha256: "381059a017ec9284b56c49c92e9fcd6f0e36959996deb1897a788275af47f2dd",
      sourcePacketVersion: "PACKET-001-R1",
      sourceCardCommit: "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117",
      sourceCardBlobOid: "3bc58cebfb45e2046891fb774bc242fe69ee5b30",
      sourceCardSha256: "fdfe2fdebce62e4bc7e31e4ba8b358d9780e4b93377907ecd780bcd4dfcdb7ab",
    },
    oi07Intake: intake,
    oi07IntakeResult: evaluateOi07ProviderTargetIntake(intake),
    matrixScope,
    environmentArtifacts: environmentArtifacts(matrixScope),
    corpusIdentity: corpusIdentity(),
    executionAuthorization: executionAuthorization(formal, matrixScope),
    offlineHarnessResults: [],
    compatibilityCells: [],
    attemptRecords: [],
    nativeBoundaryResults: [],
    findings: [],
    independentReviewRefs: [],
    overallDisposition: "INCONCLUSIVE",
    generatedAt: "2026-08-23T11:00:00+08:00",
    reportSha256: "",
    containsRealUserData: false,
    containsCredential: false,
    containsProviderBody: false,
  };
  const descriptors = matrixScope.providerSlots.flatMap((providerSlot) => matrixScope.candidateProfileIds.flatMap((candidateProfileId) =>
    matrixScope.buildConfigurations.flatMap((buildConfiguration) => matrixScope.runtimeTargets.map((runtimeTarget) => ({
      providerSlot,
      candidateProfileId,
      buildConfiguration,
      runtimeTarget,
    })))));
  descriptors.forEach((descriptor, serial) => {
    const { cell, attempts } = makeCell(input, descriptor, serial, { formal, unsafe, repetitions });
    input.compatibilityCells.push(cell);
    input.attemptRecords.push(...attempts);
  });
  input.offlineHarnessResults = makeOfflineResults(input, { formal, offlineFailure });
  input.nativeBoundaryResults = makeNativeResults(input, { nativeNotProven });
  input.overallDisposition = unsafe || offlineFailure
    ? "FAIL"
    : formal && repetitions >= 3
      ? "MEASURED_REVIEW_REQUIRED"
      : "INCONCLUSIVE";
  input.reportSha256 = computeD036ProviderNativeReportSha256(input);
  return input;
}

test("locks the report, attempt, matrix, scenario, surface, and zero-authorization boundaries", () => {
  assert.equal(INPUT_SCHEMA_VERSION, "D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_INPUT_V1");
  assert.equal(ATTEMPT_SCHEMA_VERSION, "D036_PROVIDER_NATIVE_COMPATIBILITY_ATTEMPT_V1");
  assert.equal(RESULT_SCHEMA_VERSION, "D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_RESULT_V1");
  assert.equal(CONTRACT_ID, "D036-PROVIDER-NATIVE-COMPATIBILITY-REPORT-CONTRACT-001");
  assert.deepEqual([PROVIDER_SLOTS.length, PROFILE_IDS.length, BUILD_CONFIGURATIONS.length, RUNTIME_TARGETS.length], [3, 3, 2, 2]);
  assert.equal(OFFLINE_SCENARIO_FAMILY_IDS.length, 9);
  assert.equal(NATIVE_BOUNDARY_SURFACE_IDS.length, 13);
  assert.equal(STATE_ISOLATION_FIELDS.length, 7);
  assert.equal(LIFECYCLE_FIELDS.length, 5);
  assert.equal(BOUNDARY.networkRequests, 0);
  assert.equal(BOUNDARY.credentialReads, 0);
  assert.equal(BOUNDARY.providerCompatibilitySpikePassed, false);
  assert.equal(BOUNDARY.nativeBoundaryEvidencePassed, false);
  assert.equal(BOUNDARY.formalImplementationAuthorized, false);
});

test("accepts a reduced synthetic fixture only as inconclusive non-evidence", () => {
  const result = evaluateD036ProviderNativeCompatibilityReport(makeInput());
  assert.equal(result.syntheticContractFixtureOnly, true);
  assert.equal(result.overallDisposition, "INCONCLUSIVE");
  assert.equal(result.requiredCompatibilityCellCount, 1);
  assert.equal(result.attemptRecordCount, 3);
  assert.equal(result.offlineHarnessResultCount, 1);
  assert.equal(result.nativeBoundaryResultCount, 1);
  assert.equal(result.providerCompatibilityPass, false);
  assert.equal(result.nativeBoundaryPass, false);
  assert.equal(result.blockers.includes("SYNTHETIC_CONTRACT_FIXTURE_ONLY"), true);
});

test("recomputes a complete formal 36-cell report as measured review required without granting PASS", () => {
  const result = evaluateD036ProviderNativeCompatibilityReport(makeInput({ formal: true }));
  assert.equal(result.overallDisposition, "MEASURED_REVIEW_REQUIRED");
  assert.equal(result.requiredCompatibilityCellCount, 36);
  assert.equal(result.compatibilityCellCount, 36);
  assert.equal(result.attemptRecordCount, 324);
  assert.equal(result.offlineHarnessResultCount, 108);
  assert.equal(result.nativeBoundaryResultCount, 39);
  assert.equal(result.compatibleCellCount, 36);
  assert.equal(result.rnFetchProfileViable, true);
  assert.equal(result.providerCompatibilityPass, false);
  assert.equal(result.nativeBoundaryPass, false);
});

test("coverage below three attempts per path stays inconclusive", () => {
  const result = evaluateD036ProviderNativeCompatibilityReport(makeInput({ formal: true, repetitions: 2 }));
  assert.equal(result.overallDisposition, "INCONCLUSIVE");
  assert.equal(result.inconclusiveCellCount, 36);
  assert.equal(result.blockers.includes("REPORT_EVIDENCE_INCONCLUSIVE"), true);
});

test("rejects attempt deletion, reordered repetition, and forged cell aggregates", () => {
  const deleted = makeInput();
  deleted.attemptRecords.pop();
  deleted.reportSha256 = computeD036ProviderNativeReportSha256(deleted);
  assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(deleted), {
    code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
  });

  const reordered = makeInput({ formal: true });
  [reordered.attemptRecords[0], reordered.attemptRecords[1]] = [reordered.attemptRecords[1], reordered.attemptRecords[0]];
  reordered.reportSha256 = computeD036ProviderNativeReportSha256(reordered);
  assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(reordered), {
    code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
  });

  const forged = makeInput();
  forged.compatibilityCells[0].normalAttemptCount = 99;
  forged.compatibilityCells[0].cellFingerprint = digest(Object.fromEntries(
    Object.entries(forged.compatibilityCells[0]).filter(([key]) => key !== "cellFingerprint"),
  ));
  forged.reportSha256 = computeD036ProviderNativeReportSha256(forged);
  assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(forged), {
    code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
  });
});

test("unapproved origin bytes derive FAIL and remain visible only as counts", () => {
  const result = evaluateD036ProviderNativeCompatibilityReport(makeInput({ unsafe: true }));
  assert.equal(result.overallDisposition, "FAIL");
  assert.equal(result.observedIncompatibleCellCount, 1);
  assert.equal(result.unapprovedRequestCount, 1);
  assert.equal(result.unapprovedAuthorizationByteCount, 4);
  assert.equal(result.unapprovedPayloadByteCount, 8);
  assert.equal(result.providerCompatibilityPass, false);
});

test("cookie, cache, credential, retry, write, residual, and late-callback counters cannot be hidden", () => {
  for (const [group, field] of [
    ["stateIsolationObservation", "automaticCookieSendCount"],
    ["stateIsolationObservation", "sharedCacheReadCount"],
    ["stateIsolationObservation", "sharedCredentialReadCount"],
    ["lifecycleObservation", "automaticRetryCount"],
    ["lifecycleObservation", "businessWriteCount"],
    ["lifecycleObservation", "terminalTemporaryFileCount"],
    ["lifecycleObservation", "lateCallbackMutationCount"],
  ]) {
    const input = makeInput();
    input.attemptRecords[0][group][field] = 1;
    input.attemptRecords[0].diagnosticFingerprint = computeD036ProviderNativeAttemptDiagnosticFingerprint(input.attemptRecords[0]);
    input.reportSha256 = computeD036ProviderNativeReportSha256(input);
    assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(input), {
      code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
    });
  }
});

test("offline harness failures have FAIL priority", () => {
  const result = evaluateD036ProviderNativeCompatibilityReport(makeInput({ offlineFailure: true }));
  assert.equal(result.overallDisposition, "FAIL");
  assert.equal(result.blockers.includes("REPORT_CONTAINS_FAILING_EVIDENCE"), true);
});

test("all 13 RN fetch surfaces must be PROVEN for the profile to remain viable", () => {
  const result = evaluateD036ProviderNativeCompatibilityReport(makeInput({ formal: true, nativeNotProven: true }));
  assert.equal(result.overallDisposition, "MEASURED_REVIEW_REQUIRED");
  assert.equal(result.rnFetchProfileViable, false);
  assert.equal(result.blockers.includes("RN_FETCH_PROFILE_NOT_VIABLE_AT_TESTED_VERSION"), true);
  assert.equal(result.nativeBoundaryPass, false);
});

test("rejects OI-07 input/result revision or fingerprint drift", () => {
  const changedInput = makeInput();
  changedInput.oi07Intake.oi07Revision = "OI07-R002";
  changedInput.reportSha256 = computeD036ProviderNativeReportSha256(changedInput);
  assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(changedInput), {
    code: "INVALID_OI07_PROVIDER_TARGET_INTAKE",
  });

  const changedResult = makeInput();
  changedResult.oi07IntakeResult = clone(changedResult.oi07IntakeResult);
  changedResult.oi07IntakeResult.d036IntakeContractComplete = false;
  changedResult.reportSha256 = computeD036ProviderNativeReportSha256(changedResult);
  assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(changedResult), {
    code: "INVALID_OI07_PROVIDER_TARGET_INTAKE",
  });
});

test("rejects environment, corpus, authorization, attempt, offline, native, and report fingerprint drift", () => {
  const mutations = [
    (input) => { input.environmentArtifacts[0].xcodeVersion = "26.5"; },
    (input) => { input.corpusIdentity.fixtureCount = 4; },
    (input) => { input.executionAuthorization.maximumTotalCost = 1; },
    (input) => { input.attemptRecords[0].endedMonotonicNs += 1; },
    (input) => { input.offlineHarnessResults[0].evidenceFingerprint = digest("changed offline evidence"); },
    (input) => { input.nativeBoundaryResults[0].state = "NOT_PROVEN"; },
  ];
  for (const mutate of mutations) {
    const input = makeInput();
    mutate(input);
    input.reportSha256 = computeD036ProviderNativeReportSha256(input);
    assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(input), {
      code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
    });
  }
  const report = makeInput();
  report.generatedAt = "2026-08-23T11:00:01+08:00";
  assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(report), {
    code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
  });
});

test("requires exact formal and proper-subset synthetic matrix order", () => {
  const missingFormal = makeInput({ formal: true });
  missingFormal.matrixScope.providerSlots = ["P1", "P2"];
  missingFormal.reportSha256 = computeD036ProviderNativeReportSha256(missingFormal);
  assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(missingFormal), {
    code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
  });

  const fullSynthetic = makeInput();
  fullSynthetic.matrixScope = scopeFor(true);
  fullSynthetic.reportSha256 = computeD036ProviderNativeReportSha256(fullSynthetic);
  assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(fullSynthetic), {
    code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
  });

  const reordered = makeInput();
  reordered.matrixScope.offlineScenarioFamilyIds = ["QUERY", "URL_PARSE"];
  reordered.reportSha256 = computeD036ProviderNativeReportSha256(reordered);
  assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(reordered), {
    code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
  });
});

test("formal execution authorization remains caller asserted and expires structurally", () => {
  const expired = makeInput({ formal: true });
  expired.executionAuthorization.expiresAt = "2026-08-22T12:00:00+08:00";
  expired.executionAuthorization = withFingerprint(expired.executionAuthorization, "authorizationFingerprint");
  for (const attempt of expired.attemptRecords) {
    const descriptor = expired.compatibilityCells.find(({ cellId }) => cellId === attempt.cellId);
    attempt.identityFingerprint = computeD036ProviderNativeAttemptIdentityFingerprint(expired, descriptor);
    attempt.diagnosticFingerprint = computeD036ProviderNativeAttemptDiagnosticFingerprint(attempt);
  }
  for (const cell of expired.compatibilityCells) {
    cell.cellFingerprint = digest(Object.fromEntries(Object.entries(cell).filter(([key]) => key !== "cellFingerprint")));
  }
  expired.overallDisposition = "INCONCLUSIVE";
  expired.reportSha256 = computeD036ProviderNativeReportSha256(expired);
  const result = evaluateD036ProviderNativeCompatibilityReport(expired);
  assert.equal(result.overallDisposition, "INCONCLUSIVE");
  assert.equal(result.blockers.includes("EXECUTION_AUTHORIZATION_CALLER_ASSERTED_NOT_VERIFIED"), true);
  assert.equal(result.boundary.realNetworkAuthorized, false);
});

test("open P0/P1/P2 findings cannot be reported as measured review required", () => {
  const input = makeInput({ formal: true });
  const finding = withFingerprint({
    findingId: "D036-FINDING-BLOCKING-001",
    severity: "P1",
    status: "OPEN",
    relatedCellIds: [input.compatibilityCells[0].cellId],
    relatedAttemptIds: [],
    relatedSurfaceIds: [],
    ownerRef: "SECURITY-OWNER-001",
    dueAt: "2026-08-24T10:00:00+08:00",
    dispositionSummarySha256: digest("blocking finding summary"),
    nonBlockingRationaleSha256: "UNKNOWN",
    findingFingerprint: "",
  }, "findingFingerprint");
  input.findings = [finding];
  input.overallDisposition = "FAIL";
  input.reportSha256 = computeD036ProviderNativeReportSha256(input);
  const result = evaluateD036ProviderNativeCompatibilityReport(input);
  assert.equal(result.overallDisposition, "FAIL");
  assert.equal(result.findingCount, 1);
  assert.equal(result.providerCompatibilityPass, false);
});

test("independent review references remain unverified and cannot grant PASS", () => {
  const input = makeInput({ formal: true });
  input.independentReviewRefs = [
    {
      reviewId: "D036-REVIEW-SECURITY-001",
      reviewerRole: "SECURITY",
      reviewedArtifactSha256: digest("formal report artifact"),
      disposition: "APPROVED",
      signatureMethod: "VERIFIED_WORKFLOW_REFERENCE",
      signedAt: "2026-08-23T12:00:00+08:00",
      summarySha256: digest("security review summary"),
    },
    {
      reviewId: "D036-REVIEW-QA-001",
      reviewerRole: "QA",
      reviewedArtifactSha256: digest("formal report artifact"),
      disposition: "APPROVED",
      signatureMethod: "SIGNED_DOCUMENT_REFERENCE",
      signedAt: "2026-08-23T12:01:00+08:00",
      summarySha256: digest("qa review summary"),
    },
  ];
  input.reportSha256 = computeD036ProviderNativeReportSha256(input);
  const result = evaluateD036ProviderNativeCompatibilityReport(input);
  assert.equal(result.independentReviewRefCount, 2);
  assert.equal(result.providerCompatibilityPass, false);
  assert.equal(result.nativeBoundaryPass, false);
  assert.equal(result.blockers.includes("INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED"), true);
});

test("binds result fields, blockers, boundary, and result fingerprint", () => {
  const input = makeInput();
  const result = evaluateD036ProviderNativeCompatibilityReport(input);
  for (const mutate of [
    (copy) => { copy.providerCompatibilityPass = true; },
    (copy) => { copy.nativeBoundaryPass = true; },
    (copy) => { copy.blockers = []; },
    (copy) => { copy.boundary.networkRequests = 1; },
    (copy) => { copy.resultFingerprint = digest("forged result"); },
  ]) {
    const forged = clone(result);
    mutate(forged);
    assert.throws(() => validateD036ProviderNativeCompatibilityReportResult(forged, input), {
      code: "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT",
    });
  }
});

test("copies and deeply freezes normalized input and result", () => {
  const input = makeInput();
  const normalized = normalizeD036ProviderNativeCompatibilityReport(input);
  const result = evaluateD036ProviderNativeCompatibilityReport(input);
  const attemptId = normalized.attemptRecords[0].attemptId;
  input.attemptRecords[0].attemptId = "D036-ATTEMPT-MUTATED";
  assert.equal(normalized.attemptRecords[0].attemptId, attemptId);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.attemptRecords[0].hopRecords), true);
  assert.equal(Object.isFrozen(normalized.nativeBoundaryResults[0].evidenceRefs), true);
  assert.equal(Object.isFrozen(result.boundary), true);
});

test("rejects sensitive-looking material without echoing the canary", () => {
  const input = makeInput();
  const canary = "CANARY-DO-NOT-ECHO-9901";
  input.executionAuthorization.authorizerRef = `password=${canary}`;
  input.reportSha256 = computeD036ProviderNativeReportSha256(input);
  let error;
  try {
    evaluateD036ProviderNativeCompatibilityReport(input);
  } catch (caught) {
    error = caught;
  }
  assert.equal(error?.code, "UNSAFE_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT");
  assert.equal(`${error?.message}${JSON.stringify(error?.details)}`.includes(canary), false);
});

test("rejects accessors, symbols, special objects, cycles, extra fields, and resource overflow", () => {
  const cases = [];
  const accessor = makeInput();
  Object.defineProperty(accessor.environmentArtifacts[0], "xcodeVersion", { enumerable: true, get: () => "26.4" });
  cases.push(accessor);
  const symbol = makeInput();
  symbol[Symbol("hidden")] = true;
  cases.push(symbol);
  const special = makeInput();
  special.corpusIdentity = new Date();
  cases.push(special);
  const cyclic = makeInput();
  cyclic.self = cyclic;
  cases.push(cyclic);
  const extra = makeInput();
  extra.providerCompatibilityPass = true;
  extra.reportSha256 = computeD036ProviderNativeReportSha256(extra);
  cases.push(extra);
  const overflow = makeInput();
  overflow.independentReviewRefs = Array.from({ length: 33 }, (_, index) => ({
    reviewId: `D036-REVIEW-QA-${String(index).padStart(3, "0")}`,
    reviewerRole: "QA",
    reviewedArtifactSha256: digest(`artifact-${index}`),
    disposition: "INCONCLUSIVE",
    signatureMethod: "SIGNED_DOCUMENT_REFERENCE",
    signedAt: "2026-08-23T12:00:00+08:00",
    summarySha256: digest(`summary-${index}`),
  }));
  overflow.reportSha256 = computeD036ProviderNativeReportSha256(overflow);
  cases.push(overflow);
  for (const input of cases) {
    assert.throws(() => evaluateD036ProviderNativeCompatibilityReport(input));
  }
});

test("source performs no filesystem, network, clock, process, corpus, Provider, or native side effect", () => {
  const source = fs.readFileSync(new URL("./d036-provider-native-compatibility-report-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    /from\s+["']node:fs["']/,
    /from\s+["']node:net["']/,
    /from\s+["']node:http/,
    /\bfetch\s*\(/,
    /\bDate\.now\s*\(/,
    /\bprocess\.(?:env|cwd|chdir|exit)/,
    /\b(?:readFile|writeFile|mkdir|unlink|rm)\s*\(/,
    /\b(?:xcrun|xcodebuild|simctl|idevice)\b/i,
  ]) {
    assert.equal(forbidden.test(source), false, forbidden.toString());
  }
  const result = evaluateD036ProviderNativeCompatibilityReport(makeInput());
  assert.equal(result.boundary.attemptRecordReads, 0);
  assert.equal(result.boundary.captureArtifactReads, 0);
  assert.equal(result.boundary.networkRequests, 0);
  assert.equal(result.boundary.providerRequests, 0);
  assert.equal(result.boundary.businessWrites, 0);
});
