import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const INPUT_SCHEMA_VERSION = "D040_NON_DIAGNOSTIC_BOUNDARY_CARD_INPUT_V1";
const RESULT_SCHEMA_VERSION = "D040_NON_DIAGNOSTIC_BOUNDARY_CARD_RESULT_V1";
const BOUNDARY_SCHEMA_VERSION = "D040_NON_DIAGNOSTIC_BOUNDARY_CARD_BOUNDARY_V1";
const CONTRACT_ID = "D040-NON-DIAGNOSTIC-BOUNDARY-CARD-CONTRACT-001";

const CARD_SPEC_IDENTITY = immutable({
  artifactId: "D040-NON-DIAGNOSTIC-BOUNDARY-CARD-SPEC-001",
  eventId: "EVT-20260827-005",
  decisionId: "D-040",
  authoritativeState: "PX-0_INPUT_GAP",
  artifactWorkingTreeBlobOid: "f217f13f37715a7f37178e0bb295e19c8f2332d9",
  artifactSha256: "cb7334f47ccd11cf14639f2addc33cf9d19cbdaff36227e6d738ba88e4189a2d",
});

const D068_OPTIONS = immutable([
  "pause_automatic_estimates_on_yes_or_unsure",
  "pause_only_on_yes_unsure_requires_manual_review",
  "manual_only_for_health_context",
]);

const D069_OPTIONS = immutable([
  "plain_language_no_numeric_error_bounds",
  "model_named_general_uncertainty",
  "validated_numeric_uncertainty_when_available",
]);

const HEALTH_CONTEXT_ANSWERS = immutable(["YES", "NO", "UNSURE", "NOT_APPLICABLE"]);
const RECORD_KINDS = immutable(["SYNTHETIC_CONTRACT_FIXTURE", "FORMAL_CARD_EVALUATION_INPUT"]);
const RESULT_DISPOSITIONS = immutable([
  "FAIL_CLOSED_NOT_OWNER_READY",
  "STRUCTURALLY_VALIDATED_BOUNDARY_ONLY",
]);

const BLOCKER_IDS = immutable([
  "HEALTH_REVIEW_REQUIRED",
  "CONTENT_QA_REQUIRED",
  "INDEPENDENT_REVIEW_REQUIRED",
  "OWNER_REVIEW_NOT_AUTHORIZED",
  "FORMAL_IMPLEMENTATION_NOT_AUTHORIZED",
]);

const BOUNDARY = immutable({
  schemaVersion: BOUNDARY_SCHEMA_VERSION,
  contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION / NOT_OWNER_READY",
  harnessReadsCallerSuppliedDataOnly: true,
  optionRecommendationsAreNotOwnerChoices: true,
  syntheticFixtureIsNotEvidence: true,
  callerHealthContextIsNotDiagnosis: true,
  numericUncertaintyEvidenceCallerAssertedNotVerified: true,
  gitReads: 0,
  fileReads: 0,
  fileWrites: 0,
  networkRequests: 0,
  providerRequests: 0,
  credentialReads: 0,
  businessWrites: 0,
  healthDataWrites: 0,
  ownerIntakeWrites: 0,
  automaticDialEffects: 0,
  locationReads: 0,
  contactsReads: 0,
  healthKitWrites: 0,
  diagnosisOrTreatmentAuthorized: false,
  medicationDetailCollectionAuthorized: false,
  healthFreeTextCollectionAuthorized: false,
  healthDataPersistenceAuthorized: false,
  automaticDialAuthorized: false,
  networkResourceRefreshAuthorized: false,
  locationReadAuthorized: false,
  contactsReadAuthorized: false,
  healthKitWriteAuthorized: false,
  healthReviewerAssigned: false,
  healthContentApproved: false,
  contentQaPassed: false,
  independentReviewPassed: false,
  d068OwnerReady: false,
  d069OwnerReady: false,
  ownerIntakeChanged: false,
  ownerCardScheduled: false,
  ownerReviewAuthorized: false,
  ownerChoiceRecorded: false,
  decisionAcceptedRecorded: false,
  px1Authorized: false,
  px2Authorized: false,
  formulaImplementationAuthorized: false,
  healthCopyImplementationAuthorized: false,
  formalRootProjectAuthorized: false,
  nativeIosWorkAuthorized: false,
  formalImplementationAuthorized: false,
  gateStatesChanged: false,
});

class D040NonDiagnosticBoundaryCardError extends Error {
  constructor(message, code = "INVALID_D040_NON_DIAGNOSTIC_BOUNDARY_CARD", details = {}) {
    super(message);
    this.name = "D040NonDiagnosticBoundaryCardError";
    this.code = code;
    this.details = immutable(details);
  }
}

function fail(message, code, details) {
  throw new D040NonDiagnosticBoundaryCardError(message, code, details);
}

function clone(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(clone);
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function deepFreeze(value, seen = new Set()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(clone(value));
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function sha256(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function assertPlainDataTree(value, field = "input", depth = 0, ancestors = new Set(), budget = { nodes: 0 }) {
  budget.nodes += 1;
  if (budget.nodes > 12_000) fail("input exceeds node budget", undefined, { field });
  if (typeof value === "string") {
    if (value.length > 4_096) fail("input exceeds string budget", undefined, { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("input contains a non-finite number", undefined, { field });
    return;
  }
  if (value === null || typeof value === "boolean") return;
  if (typeof value !== "object") fail("input contains an unsupported value", undefined, { field });
  if (ancestors.has(value)) fail("input contains a cycle", undefined, { field });
  if (depth > 12) fail("input exceeds depth budget", undefined, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) fail("input contains symbol properties", undefined, { field });
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    fail("input must contain only plain records", undefined, { field });
  }
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if ("get" in descriptor || "set" in descriptor) fail("input contains non-data properties", undefined, { field: `${field}.${key}` });
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) fail("input contains sparse arrays", undefined, { field: `${field}[${index}]` });
      assertPlainDataTree(value[index], `${field}[${index}]`, depth + 1, ancestors, budget);
    }
  } else {
    for (const [key, child] of Object.entries(value)) {
      assertPlainDataTree(child, `${field}.${key}`, depth + 1, ancestors, budget);
    }
  }
  ancestors.delete(value);
}

function assertExactKeys(value, keys, field) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (!isDeepStrictEqual(actual, expected)) fail(`${field} keys must be exact`, undefined, { field, expected, actual });
}

function assertEnum(value, values, field) {
  if (!values.includes(value)) fail(`${field} is not an accepted value`, undefined, { field, value });
}

function assertBoolean(value, field) {
  if (typeof value !== "boolean") fail(`${field} must be boolean`, undefined, { field });
}

function assertFalse(value, field) {
  if (value !== false) fail(`${field} must be false`, "UNSAFE_D040_NON_DIAGNOSTIC_BOUNDARY_CARD", { field });
}

function normalizeD040NonDiagnosticBoundaryCardInput(input) {
  assertPlainDataTree(input);
  assertExactKeys(input, [
    "schemaVersion",
    "recordKind",
    "cardSpecIdentity",
    "selectedD068OptionId",
    "selectedD069OptionId",
    "healthContextAnswer",
    "automaticEstimateCandidatePresent",
    "eatingDisorderRiskDisclosed",
    "numericUncertaintyEvidence",
    "containsDiagnosisName",
    "containsMedicationDetail",
    "containsHealthFreeText",
    "requestsHealthDataPersistence",
    "requestsAutomaticDial",
    "requestsNetworkResourceRefresh",
    "requestsLocationRead",
    "requestsContactsRead",
    "requestsHealthKitWrite",
    "callerClaimsHealthReviewPassed",
    "callerClaimsContentQaPassed",
    "callerClaimsIndependentReviewPassed",
    "callerClaimsOwnerReady",
    "callerClaimsOwnerChoice",
    "callerClaimsFormalImplementationAuthorized",
  ], "input");
  if (input.schemaVersion !== INPUT_SCHEMA_VERSION) fail("schemaVersion mismatch");
  assertEnum(input.recordKind, RECORD_KINDS, "recordKind");
  if (!isDeepStrictEqual(input.cardSpecIdentity, CARD_SPEC_IDENTITY)) {
    fail("cardSpecIdentity must match the frozen D-040 D-068/D-069 specification");
  }
  assertEnum(input.selectedD068OptionId, D068_OPTIONS, "selectedD068OptionId");
  assertEnum(input.selectedD069OptionId, D069_OPTIONS, "selectedD069OptionId");
  assertEnum(input.healthContextAnswer, HEALTH_CONTEXT_ANSWERS, "healthContextAnswer");
  assertBoolean(input.automaticEstimateCandidatePresent, "automaticEstimateCandidatePresent");
  assertBoolean(input.eatingDisorderRiskDisclosed, "eatingDisorderRiskDisclosed");
  assertExactKeys(input.numericUncertaintyEvidence, ["validated", "evidenceRefCount"], "numericUncertaintyEvidence");
  assertBoolean(input.numericUncertaintyEvidence.validated, "numericUncertaintyEvidence.validated");
  if (!Number.isInteger(input.numericUncertaintyEvidence.evidenceRefCount) || input.numericUncertaintyEvidence.evidenceRefCount < 0 || input.numericUncertaintyEvidence.evidenceRefCount > 20) {
    fail("numericUncertaintyEvidence.evidenceRefCount must be an integer from 0 to 20");
  }
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
    "callerClaimsHealthReviewPassed",
    "callerClaimsContentQaPassed",
    "callerClaimsIndependentReviewPassed",
    "callerClaimsOwnerReady",
    "callerClaimsOwnerChoice",
    "callerClaimsFormalImplementationAuthorized",
  ]) {
    assertFalse(input[field], field);
  }
  return immutable({
    ...clone(input),
    optionSetFingerprint: sha256({ d068: D068_OPTIONS, d069: D069_OPTIONS }),
    inputFingerprint: sha256(input),
  });
}

function deriveD068(normalized) {
  if (normalized.healthContextAnswer === "NOT_APPLICABLE") {
    return {
      state: "NOT_APPLICABLE",
      automaticEstimatesAllowed: false,
      protectedUncertainty: false,
      reason: "UPSTREAM_MANUAL_OR_NO_AUTOMATIC_TARGET_PATH",
    };
  }
  if (normalized.selectedD068OptionId === "manual_only_for_health_context") {
    return {
      state: "FAIL_CLOSED",
      automaticEstimatesAllowed: false,
      protectedUncertainty: normalized.healthContextAnswer === "UNSURE",
      reason: "HEALTH_CONTEXT_MANUAL_ONLY",
    };
  }
  if (normalized.healthContextAnswer === "YES" || normalized.healthContextAnswer === "UNSURE") {
    return {
      state: "FAIL_CLOSED",
      automaticEstimatesAllowed: false,
      protectedUncertainty: normalized.healthContextAnswer === "UNSURE",
      reason: normalized.selectedD068OptionId === "pause_automatic_estimates_on_yes_or_unsure"
        ? "YES_OR_UNSURE_PAUSES_AUTOMATIC_ESTIMATES"
        : "YES_PAUSES_AND_UNSURE_REQUIRES_MANUAL_REVIEW",
    };
  }
  return {
    state: "STRUCTURAL_ONLY",
    automaticEstimatesAllowed: normalized.automaticEstimateCandidatePresent,
    protectedUncertainty: false,
    reason: "NO_HEALTH_CONTEXT_DECLARED_BY_CALLER",
  };
}

function deriveD069(normalized, d068) {
  if (!normalized.automaticEstimateCandidatePresent || d068.automaticEstimatesAllowed === false) {
    return {
      state: "NOT_APPLICABLE",
      numericBoundsAllowed: false,
      copyMode: "NO_AUTOMATIC_ESTIMATE_TO_EXPLAIN",
      reason: "AUTOMATIC_ESTIMATE_NOT_AVAILABLE",
    };
  }
  if (normalized.selectedD069OptionId === "validated_numeric_uncertainty_when_available") {
    const numericAllowed = normalized.numericUncertaintyEvidence.validated === true &&
      normalized.numericUncertaintyEvidence.evidenceRefCount > 0;
    return {
      state: numericAllowed ? "STRUCTURAL_ONLY" : "FAIL_CLOSED",
      numericBoundsAllowed: numericAllowed,
      copyMode: numericAllowed ? "VALIDATED_NUMERIC_UNCERTAINTY_STRUCTURAL_ONLY" : "PLAIN_LANGUAGE_FALLBACK_REQUIRED",
      reason: numericAllowed ? "CALLER_ASSERTED_VALIDATED_EVIDENCE_PRESENT" : "NUMERIC_UNCERTAINTY_EVIDENCE_MISSING",
    };
  }
  return {
    state: "STRUCTURAL_ONLY",
    numericBoundsAllowed: false,
    copyMode: normalized.selectedD069OptionId,
    reason: "PERSONAL_NUMERIC_BOUNDS_NOT_ALLOWED",
  };
}

function evaluateD040NonDiagnosticBoundaryCard(input) {
  const normalized = normalizeD040NonDiagnosticBoundaryCardInput(input);
  const d068 = deriveD068(normalized);
  const eatingDisorderPause = normalized.eatingDisorderRiskDisclosed === true;
  const d068WithEatingDisorder = eatingDisorderPause
    ? { ...d068, state: "FAIL_CLOSED", automaticEstimatesAllowed: false, reason: "EATING_DISORDER_RISK_PAUSES_WEIGHT_LOSS_AND_MACRO_TARGETS" }
    : d068;
  const d069 = deriveD069(normalized, d068WithEatingDisorder);
  const failClosed = normalized.recordKind === "SYNTHETIC_CONTRACT_FIXTURE" ||
    d068WithEatingDisorder.state === "FAIL_CLOSED" ||
    d069.state === "FAIL_CLOSED";
  const result = {
    schemaVersion: RESULT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    recordKind: normalized.recordKind,
    cardSpecIdentity: normalized.cardSpecIdentity,
    cardDecisionIds: ["D-068", "D-069"],
    optionSetFingerprint: normalized.optionSetFingerprint,
    inputFingerprint: normalized.inputFingerprint,
    d068: d068WithEatingDisorder,
    d069,
    eatingDisorderRiskPausesWeightLossAndMacroTargets: eatingDisorderPause,
    unsureCannotBecomeNoRisk: normalized.healthContextAnswer === "UNSURE",
    populationErrorCannotBecomePersonalBounds: d069.numericBoundsAllowed === false ||
      normalized.numericUncertaintyEvidence.validated === true,
    disposition: failClosed ? "FAIL_CLOSED_NOT_OWNER_READY" : "STRUCTURALLY_VALIDATED_BOUNDARY_ONLY",
    blockers: BLOCKER_IDS,
    boundary: BOUNDARY,
  };
  return immutable({ ...result, resultFingerprint: sha256(result) });
}

function validateD040NonDiagnosticBoundaryCardResult(result, input) {
  const expected = evaluateD040NonDiagnosticBoundaryCard(input);
  if (!isDeepStrictEqual(result, expected)) {
    fail("result changed or does not match recomputed D-040 non-diagnostic boundary evaluation");
  }
  return expected;
}

export {
  BLOCKER_IDS,
  BOUNDARY,
  CARD_SPEC_IDENTITY,
  CONTRACT_ID,
  D068_OPTIONS,
  D069_OPTIONS,
  D040NonDiagnosticBoundaryCardError,
  HEALTH_CONTEXT_ANSWERS,
  INPUT_SCHEMA_VERSION,
  RESULT_DISPOSITIONS,
  RESULT_SCHEMA_VERSION,
  evaluateD040NonDiagnosticBoundaryCard,
  normalizeD040NonDiagnosticBoundaryCardInput,
  validateD040NonDiagnosticBoundaryCardResult,
};
