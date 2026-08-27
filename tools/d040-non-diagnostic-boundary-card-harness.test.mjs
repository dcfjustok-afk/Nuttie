import assert from "node:assert/strict";
import test from "node:test";

import {
  BLOCKER_IDS,
  BOUNDARY,
  CARD_SPEC_IDENTITY,
  CONTRACT_ID,
  D068_OPTIONS,
  D069_OPTIONS,
  D040NonDiagnosticBoundaryCardError,
  INPUT_SCHEMA_VERSION,
  evaluateD040NonDiagnosticBoundaryCard,
  normalizeD040NonDiagnosticBoundaryCardInput,
  validateD040NonDiagnosticBoundaryCardResult,
} from "./d040-non-diagnostic-boundary-card-harness.mjs";

function baseInput(overrides = {}) {
  return {
    schemaVersion: INPUT_SCHEMA_VERSION,
    recordKind: "SYNTHETIC_CONTRACT_FIXTURE",
    cardSpecIdentity: structuredClone(CARD_SPEC_IDENTITY),
    selectedD068OptionId: "pause_automatic_estimates_on_yes_or_unsure",
    selectedD069OptionId: "plain_language_no_numeric_error_bounds",
    healthContextAnswer: "YES",
    automaticEstimateCandidatePresent: true,
    eatingDisorderRiskDisclosed: false,
    numericUncertaintyEvidence: {
      validated: false,
      evidenceRefCount: 0,
    },
    containsDiagnosisName: false,
    containsMedicationDetail: false,
    containsHealthFreeText: false,
    requestsHealthDataPersistence: false,
    requestsAutomaticDial: false,
    requestsNetworkResourceRefresh: false,
    requestsLocationRead: false,
    requestsContactsRead: false,
    requestsHealthKitWrite: false,
    callerClaimsHealthReviewPassed: false,
    callerClaimsContentQaPassed: false,
    callerClaimsIndependentReviewPassed: false,
    callerClaimsOwnerReady: false,
    callerClaimsOwnerChoice: false,
    callerClaimsFormalImplementationAuthorized: false,
    ...overrides,
  };
}

function expectInvalid(action, code = "INVALID_D040_NON_DIAGNOSTIC_BOUNDARY_CARD") {
  assert.throws(action, (error) => {
    assert.ok(error instanceof D040NonDiagnosticBoundaryCardError);
    assert.equal(error.code, code);
    return true;
  });
}

test("contract constants lock the D-040 D-068/D-069 card identity and options", () => {
  assert.equal(CONTRACT_ID, "D040-NON-DIAGNOSTIC-BOUNDARY-CARD-CONTRACT-001");
  assert.equal(CARD_SPEC_IDENTITY.eventId, "EVT-20260827-005");
  assert.deepEqual(D068_OPTIONS, [
    "pause_automatic_estimates_on_yes_or_unsure",
    "pause_only_on_yes_unsure_requires_manual_review",
    "manual_only_for_health_context",
  ]);
  assert.deepEqual(D069_OPTIONS, [
    "plain_language_no_numeric_error_bounds",
    "model_named_general_uncertainty",
    "validated_numeric_uncertainty_when_available",
  ]);
});

test("yes health context fails closed and pauses automatic estimates", () => {
  const result = evaluateD040NonDiagnosticBoundaryCard(baseInput());
  assert.equal(result.disposition, "FAIL_CLOSED_NOT_OWNER_READY");
  assert.equal(result.d068.state, "FAIL_CLOSED");
  assert.equal(result.d068.automaticEstimatesAllowed, false);
  assert.equal(result.d068.reason, "YES_OR_UNSURE_PAUSES_AUTOMATIC_ESTIMATES");
  assert.deepEqual(result.blockers, BLOCKER_IDS);
  assert.equal(result.boundary.healthContentApproved, false);
  assert.equal(result.boundary.d068OwnerReady, false);
  assert.equal(result.boundary.formalImplementationAuthorized, false);
});

test("unsure remains protected and can never become no risk", () => {
  const result = evaluateD040NonDiagnosticBoundaryCard(baseInput({
    healthContextAnswer: "UNSURE",
  }));
  assert.equal(result.d068.protectedUncertainty, true);
  assert.equal(result.unsureCannotBecomeNoRisk, true);
  assert.equal(result.d068.automaticEstimatesAllowed, false);
});

test("manual-only D-068 option blocks automatic estimates for any health context path", () => {
  const noContext = evaluateD040NonDiagnosticBoundaryCard(baseInput({
    recordKind: "FORMAL_CARD_EVALUATION_INPUT",
    selectedD068OptionId: "manual_only_for_health_context",
    healthContextAnswer: "NO",
  }));
  assert.equal(noContext.d068.state, "FAIL_CLOSED");
  assert.equal(noContext.d068.reason, "HEALTH_CONTEXT_MANUAL_ONLY");
  assert.equal(noContext.d069.state, "NOT_APPLICABLE");
});

test("plain-language D-069 option never exposes personal numeric bounds", () => {
  const result = evaluateD040NonDiagnosticBoundaryCard(baseInput({
    recordKind: "FORMAL_CARD_EVALUATION_INPUT",
    healthContextAnswer: "NO",
  }));
  assert.equal(result.disposition, "STRUCTURALLY_VALIDATED_BOUNDARY_ONLY");
  assert.equal(result.d068.automaticEstimatesAllowed, true);
  assert.equal(result.d069.numericBoundsAllowed, false);
  assert.equal(result.d069.copyMode, "plain_language_no_numeric_error_bounds");
  assert.equal(result.populationErrorCannotBecomePersonalBounds, true);
});

test("numeric uncertainty option fails closed without validated evidence references", () => {
  const result = evaluateD040NonDiagnosticBoundaryCard(baseInput({
    recordKind: "FORMAL_CARD_EVALUATION_INPUT",
    selectedD069OptionId: "validated_numeric_uncertainty_when_available",
    healthContextAnswer: "NO",
  }));
  assert.equal(result.disposition, "FAIL_CLOSED_NOT_OWNER_READY");
  assert.equal(result.d069.state, "FAIL_CLOSED");
  assert.equal(result.d069.copyMode, "PLAIN_LANGUAGE_FALLBACK_REQUIRED");
  assert.equal(result.d069.numericBoundsAllowed, false);
});

test("validated numeric uncertainty remains structural only and does not approve health content", () => {
  const result = evaluateD040NonDiagnosticBoundaryCard(baseInput({
    recordKind: "FORMAL_CARD_EVALUATION_INPUT",
    selectedD069OptionId: "validated_numeric_uncertainty_when_available",
    healthContextAnswer: "NO",
    numericUncertaintyEvidence: {
      validated: true,
      evidenceRefCount: 1,
    },
  }));
  assert.equal(result.disposition, "STRUCTURALLY_VALIDATED_BOUNDARY_ONLY");
  assert.equal(result.d069.numericBoundsAllowed, true);
  assert.equal(result.d069.copyMode, "VALIDATED_NUMERIC_UNCERTAINTY_STRUCTURAL_ONLY");
  assert.equal(result.boundary.numericUncertaintyEvidenceCallerAssertedNotVerified, true);
  assert.equal(result.boundary.healthContentApproved, false);
  assert.equal(result.boundary.ownerReviewAuthorized, false);
});

test("eating disorder risk pauses weight-loss and macro target paths", () => {
  const result = evaluateD040NonDiagnosticBoundaryCard(baseInput({
    recordKind: "FORMAL_CARD_EVALUATION_INPUT",
    healthContextAnswer: "NO",
    eatingDisorderRiskDisclosed: true,
  }));
  assert.equal(result.disposition, "FAIL_CLOSED_NOT_OWNER_READY");
  assert.equal(result.eatingDisorderRiskPausesWeightLossAndMacroTargets, true);
  assert.equal(result.d068.reason, "EATING_DISORDER_RISK_PAUSES_WEIGHT_LOSS_AND_MACRO_TARGETS");
  assert.equal(result.d068.automaticEstimatesAllowed, false);
});

test("not applicable is a conditional skip and still not an Owner choice", () => {
  const result = evaluateD040NonDiagnosticBoundaryCard(baseInput({
    recordKind: "FORMAL_CARD_EVALUATION_INPUT",
    healthContextAnswer: "NOT_APPLICABLE",
    automaticEstimateCandidatePresent: false,
  }));
  assert.equal(result.d068.state, "NOT_APPLICABLE");
  assert.equal(result.d069.state, "NOT_APPLICABLE");
  assert.equal(result.boundary.optionRecommendationsAreNotOwnerChoices, true);
  assert.equal(result.boundary.ownerChoiceRecorded, false);
});

test("diagnosis, medication details, health free text, persistence, automatic dial, network, location, contacts, and HealthKit are rejected", () => {
  for (const field of [
    "containsDiagnosisName",
    "containsMedicationDetail",
    "containsHealthFreeText",
    "requestsHealthDataPersistence",
    "requestsAutomaticDial",
    "requestsNetworkResourceRefresh",
    "requestsLocationRead",
    "requestsContactsRead",
    "requestsHealthKitWrite",
  ]) {
    expectInvalid(
      () => evaluateD040NonDiagnosticBoundaryCard(baseInput({ [field]: true })),
      "UNSAFE_D040_NON_DIAGNOSTIC_BOUNDARY_CARD",
    );
  }
});

test("health approval, Content QA, independent review, Owner readiness, Owner choice, and implementation claims are rejected", () => {
  for (const field of [
    "callerClaimsHealthReviewPassed",
    "callerClaimsContentQaPassed",
    "callerClaimsIndependentReviewPassed",
    "callerClaimsOwnerReady",
    "callerClaimsOwnerChoice",
    "callerClaimsFormalImplementationAuthorized",
  ]) {
    expectInvalid(
      () => evaluateD040NonDiagnosticBoundaryCard(baseInput({ [field]: true })),
      "UNSAFE_D040_NON_DIAGNOSTIC_BOUNDARY_CARD",
    );
  }
});

test("invalid schema, record kind, options, health answer, and numeric evidence shape fail closed", () => {
  expectInvalid(() => evaluateD040NonDiagnosticBoundaryCard(baseInput({ schemaVersion: "V0" })));
  expectInvalid(() => evaluateD040NonDiagnosticBoundaryCard(baseInput({ recordKind: "REAL_REVIEW" })));
  expectInvalid(() => evaluateD040NonDiagnosticBoundaryCard(baseInput({ selectedD068OptionId: "auto_allow" })));
  expectInvalid(() => evaluateD040NonDiagnosticBoundaryCard(baseInput({ selectedD069OptionId: "exact_personal_range" })));
  expectInvalid(() => evaluateD040NonDiagnosticBoundaryCard(baseInput({ healthContextAnswer: "UNKNOWN" })));
  expectInvalid(() => evaluateD040NonDiagnosticBoundaryCard(baseInput({
    numericUncertaintyEvidence: { validated: true, evidenceRefCount: -1 },
  })));
});

test("card spec identity and option set fingerprints are immutable and tamper-evident", () => {
  expectInvalid(() => evaluateD040NonDiagnosticBoundaryCard(baseInput({
    cardSpecIdentity: { ...structuredClone(CARD_SPEC_IDENTITY), eventId: "EVT-20260827-004" },
  })));
  const left = evaluateD040NonDiagnosticBoundaryCard(baseInput());
  const right = evaluateD040NonDiagnosticBoundaryCard(baseInput({
    selectedD069OptionId: "model_named_general_uncertainty",
  }));
  assert.notEqual(left.inputFingerprint, right.inputFingerprint);
  assert.equal(left.optionSetFingerprint, right.optionSetFingerprint);
});

test("normalization rejects special objects, accessors, symbols, cycles, sparse arrays, and oversized resources", () => {
  expectInvalid(() => normalizeD040NonDiagnosticBoundaryCardInput(new Map()));
  const accessorInput = baseInput();
  Object.defineProperty(accessorInput, "hidden", { get: () => true, enumerable: true });
  expectInvalid(() => normalizeD040NonDiagnosticBoundaryCardInput(accessorInput));
  const symbolInput = baseInput();
  symbolInput[Symbol("secret")] = true;
  expectInvalid(() => normalizeD040NonDiagnosticBoundaryCardInput(symbolInput));
  const cycleInput = baseInput();
  cycleInput.self = cycleInput;
  expectInvalid(() => normalizeD040NonDiagnosticBoundaryCardInput(cycleInput));
  const sparseInput = baseInput({ cardSpecIdentity: structuredClone(CARD_SPEC_IDENTITY) });
  sparseInput.cardSpecIdentity.extra = [];
  sparseInput.cardSpecIdentity.extra[1] = "hole";
  expectInvalid(() => normalizeD040NonDiagnosticBoundaryCardInput(sparseInput));
  expectInvalid(() => normalizeD040NonDiagnosticBoundaryCardInput(baseInput({
    selectedD068OptionId: "x".repeat(4_097),
  })));
});

test("normalization and evaluation return detached frozen values", () => {
  const input = baseInput();
  const normalized = normalizeD040NonDiagnosticBoundaryCardInput(input);
  const result = evaluateD040NonDiagnosticBoundaryCard(input);
  input.healthContextAnswer = "NO";
  assert.equal(normalized.healthContextAnswer, "YES");
  assert.equal(result.d068.automaticEstimatesAllowed, false);
  assert.ok(Object.isFrozen(normalized));
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.boundary));
});

test("result validation recomputes the exact output and rejects forged authorization", () => {
  const input = baseInput();
  const result = evaluateD040NonDiagnosticBoundaryCard(input);
  assert.deepEqual(validateD040NonDiagnosticBoundaryCardResult(result, input), result);
  const forged = structuredClone(result);
  forged.boundary.ownerReviewAuthorized = true;
  expectInvalid(() => validateD040NonDiagnosticBoundaryCardResult(forged, input));
});

test("source contract exports no filesystem, network, provider, credential, health-data, Owner, PX, native, or implementation effects", () => {
  assert.equal(BOUNDARY.fileReads, 0);
  assert.equal(BOUNDARY.fileWrites, 0);
  assert.equal(BOUNDARY.networkRequests, 0);
  assert.equal(BOUNDARY.providerRequests, 0);
  assert.equal(BOUNDARY.credentialReads, 0);
  assert.equal(BOUNDARY.healthDataWrites, 0);
  assert.equal(BOUNDARY.ownerIntakeWrites, 0);
  assert.equal(BOUNDARY.automaticDialEffects, 0);
  assert.equal(BOUNDARY.locationReads, 0);
  assert.equal(BOUNDARY.contactsReads, 0);
  assert.equal(BOUNDARY.healthKitWrites, 0);
  assert.equal(BOUNDARY.diagnosisOrTreatmentAuthorized, false);
  assert.equal(BOUNDARY.healthDataPersistenceAuthorized, false);
  assert.equal(BOUNDARY.ownerReviewAuthorized, false);
  assert.equal(BOUNDARY.px1Authorized, false);
  assert.equal(BOUNDARY.px2Authorized, false);
  assert.equal(BOUNDARY.nativeIosWorkAuthorized, false);
  assert.equal(BOUNDARY.formalImplementationAuthorized, false);
});
