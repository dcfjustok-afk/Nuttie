import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { normalizeNutritionFactSnapshot } from "./local-food-catalog-harness.mjs";
import { NUTRIENT_FIELDS } from "./nutrition-fields.mjs";

const SHA256 = /^[a-f0-9]{64}$/;

const ADVANCED_CAPABILITIES = Object.freeze([
  Object.freeze({
    capabilityId: "HEALTH_SCORE",
    evidenceIds: Object.freeze(["FOOD-04"]),
    scopeState: "PRESERVED_FOR_PHASED_DELIVERY",
    contentState: "NOT_AUTHORIZED",
    contentExposure: "NONE",
    blockers: Object.freeze(["ALGORITHM", "THRESHOLDS", "INPUT_SCOPE", "APPLICABILITY", "OWNER_DECISION"]),
  }),
  Object.freeze({
    capabilityId: "MICRONUTRIENT_LABELS",
    evidenceIds: Object.freeze(["FOOD-05"]),
    scopeState: "PRESERVED_FOR_PHASED_DELIVERY",
    contentState: "NOT_AUTHORIZED",
    contentExposure: "NONE",
    blockers: Object.freeze(["FIELD_SET", "VALUE_SOURCE", "THRESHOLDS", "OWNER_DECISION"]),
  }),
  Object.freeze({
    capabilityId: "HEALTH_RISKS",
    evidenceIds: Object.freeze(["FOOD-06"]),
    scopeState: "PRESERVED_FOR_PHASED_DELIVERY",
    contentState: "NOT_AUTHORIZED",
    contentExposure: "NONE",
    blockers: Object.freeze(["GENERATION_SOURCE", "MEDICAL_BASIS", "APPLICABILITY", "DISCLAIMER", "OWNER_DECISION"]),
  }),
  Object.freeze({
    capabilityId: "HEALTH_BENEFITS",
    evidenceIds: Object.freeze(["FOOD-07"]),
    scopeState: "PRESERVED_FOR_PHASED_DELIVERY",
    contentState: "NOT_AUTHORIZED",
    contentExposure: "NONE",
    blockers: Object.freeze(["GENERATION_SOURCE", "MEDICAL_BASIS", "APPLICABILITY", "DISCLAIMER", "OWNER_DECISION"]),
  }),
]);

const BOUNDARY = Object.freeze({
  contractStatus: "SPIKE_FRAMEWORK_AGNOSTIC_NON_PRODUCTION",
  factSource: "TRUSTED_LOCAL_NUTRITION_SNAPSHOT_ONLY",
  advancedCapabilityScopePreserved: true,
  advancedContentAuthorized: false,
  medicalConclusionAuthorized: false,
  personalizedClaimAuthorized: false,
  healthScoreAlgorithmAuthorized: false,
  micronutrientFieldSetAuthorized: false,
  riskBenefitGenerationAuthorized: false,
  aiGenerationAuthorized: false,
  automaticProfileUseAuthorized: false,
  observableEffects: 0,
  filesystemReads: 0,
  filesystemWrites: 0,
  realNetworkRequests: 0,
  nativeApiCalls: 0,
  systemClockRead: false,
});

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${field} must be a plain record`, code, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail(`${field} must be a plain record`, code, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) fail(`${field} contains symbol properties`, code, { field });
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!descriptor.enumerable || descriptor.get || descriptor.set) fail(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
  }
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, code, { field: `${field}.${key}` });
}

function assertPassiveData(value, field, depth = 0, budget = { items: 0 }, ancestors = new Set()) {
  if (depth > 24 || ++budget.items > 1_000) fail(`${field} exceeds its structural budget`, "INVALID_FOOD_INSIGHT_NUTRITION", { field });
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} contains a non-finite number`, "INVALID_FOOD_INSIGHT_NUTRITION", { field });
    return;
  }
  if (typeof value !== "object" || ancestors.has(value)) fail(`${field} is not passive data`, "INVALID_FOOD_INSIGHT_NUTRITION", { field });
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length > 0) fail(`${field} is not a plain array`, "INVALID_FOOD_INSIGHT_NUTRITION", { field });
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (key !== "length" && (!descriptor.enumerable || descriptor.get || descriptor.set)) fail(`${field} contains an unsupported property`, "INVALID_FOOD_INSIGHT_NUTRITION", { field: `${field}.${key}` });
    }
    const keys = Object.keys(value);
    if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) fail(`${field} must be dense`, "INVALID_FOOD_INSIGHT_NUTRITION", { field });
    value.forEach((child, index) => assertPassiveData(child, `${field}[${index}]`, depth + 1, budget, ancestors));
  } else {
    assertPlainRecord(value, field, "INVALID_FOOD_INSIGHT_NUTRITION");
    for (const [key, child] of Object.entries(value)) assertPassiveData(child, `${field}.${key}`, depth + 1, budget, ancestors);
  }
  ancestors.delete(value);
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function displaySemantics(fact) {
  if (fact.status === "MISSING") return "MISSING_NOT_ZERO";
  if (fact.status === "TRACE" || fact.status === "USER_ENTERED_TRACE") return "TRACE_WITHOUT_NUMERIC_VALUE";
  if (fact.status === "ESTIMATED") return "ESTIMATED_SOURCE_VALUE";
  return "SOURCE_VALUE";
}

function normalizeOptions(options) {
  assertExactKeys(options, [], ["trustContext"], "options", "INVALID_FOOD_INSIGHT_OPTIONS");
  return { trustContext: options.trustContext ?? null };
}

function createFoodInsightAvailability(input, options = {}) {
  assertExactKeys(input, ["schemaVersion", "nutritionSnapshot"], [], "request", "INVALID_FOOD_INSIGHT_REQUEST");
  if (input.schemaVersion !== "FOOD_INSIGHT_REQUEST_V1") fail("food insight request schema is unsupported", "INVALID_FOOD_INSIGHT_REQUEST");
  const { trustContext } = normalizeOptions(options);
  assertPassiveData(input.nutritionSnapshot, "request.nutritionSnapshot");
  const nutritionSnapshot = normalizeNutritionFactSnapshot(input.nutritionSnapshot, { trustContext });
  const nutritionFacts = {
    state: "AVAILABLE_FROM_TRUSTED_LOCAL_SNAPSHOT",
    evidenceIds: ["FOOD-01", "FOOD-02", "FOOD-03", "FOOD-08"],
    snapshot: nutritionSnapshot,
    fieldPresentation: NUTRIENT_FIELDS.map((field) => ({
      field,
      value: nutritionSnapshot.facts[field].value,
      unit: nutritionSnapshot.facts[field].standardUnit,
      sourceStatus: nutritionSnapshot.facts[field].status,
      displaySemantics: displaySemantics(nutritionSnapshot.facts[field]),
    })),
  };
  const core = deepFreeze({
    schemaVersion: "FOOD_INSIGHT_AVAILABILITY_V1",
    nutritionFacts,
    advancedCapabilities: ADVANCED_CAPABILITIES,
    boundary: BOUNDARY,
  });
  return deepFreeze({ ...core, availabilityFingerprint: fingerprint(core) });
}

function normalizeFoodInsightAvailability(input, options = {}) {
  assertExactKeys(
    input,
    ["schemaVersion", "nutritionFacts", "advancedCapabilities", "boundary", "availabilityFingerprint"],
    [],
    "availability",
    "INVALID_FOOD_INSIGHT_AVAILABILITY",
  );
  if (input.schemaVersion !== "FOOD_INSIGHT_AVAILABILITY_V1" || !SHA256.test(input.availabilityFingerprint)) {
    fail("food insight availability is invalid", "INVALID_FOOD_INSIGHT_AVAILABILITY");
  }
  assertPlainRecord(input.nutritionFacts, "availability.nutritionFacts", "INVALID_FOOD_INSIGHT_AVAILABILITY");
  const expected = createFoodInsightAvailability({
    schemaVersion: "FOOD_INSIGHT_REQUEST_V1",
    nutritionSnapshot: input.nutritionFacts.snapshot,
  }, options);
  if (!isDeepStrictEqual(input, expected)) fail("food insight availability evidence was changed", "FOOD_INSIGHT_AVAILABILITY_MISMATCH");
  return expected;
}

export {
  ADVANCED_CAPABILITIES,
  BOUNDARY,
  createFoodInsightAvailability,
  normalizeFoodInsightAvailability,
};
