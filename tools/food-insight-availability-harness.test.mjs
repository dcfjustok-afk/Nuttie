import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createLocalFoodCatalog,
  createNutritionSnapshotTrustContext,
  createVerifiedPackCatalogSnapshot,
  searchLocalFoods,
} from "./local-food-catalog-harness.mjs";
import { createNutritionFactSnapshot } from "./nutrition-fact-snapshot-harness.mjs";
import { NUTRIENT_FIELDS } from "./nutrition-fields.mjs";
import {
  ADVANCED_CAPABILITIES,
  BOUNDARY,
  createFoodInsightAvailability,
  normalizeFoodInsightAvailability,
} from "./food-insight-availability-harness.mjs";

const basis = Object.freeze({ amount: 100, unit: "g", semantic: "EDIBLE_PORTION" });

function userSnapshot(overrides = {}) {
  const facts = Object.fromEntries(NUTRIENT_FIELDS.map((field) => [field, {
    value: field === "energyKcal" ? 100 : 1,
    status: "USER_ENTERED",
    originalValue: field === "energyKcal" ? 100 : 1,
    originalUnit: field === "energyKcal" ? "kcal" : field === "sodiumMg" ? "mg" : "g",
  }]));
  facts.fiberG = { value: null, status: "USER_ENTERED_TRACE", originalValue: null, originalUnit: "g", originalText: "微量" };
  facts.sugarG = { value: null, status: "MISSING", originalValue: null, originalUnit: null };
  return createNutritionFactSnapshot({
    sourceId: "USER.local.food-1",
    sourceVersion: "rev-1",
    sourceKind: "USER",
    basis,
    originalBasis: basis,
    provenance: {
      sourceRecordId: "food-1",
      transformVersion: "USER_INPUT_V1",
      activeRef: null,
      contentSha256: null,
      licenseId: null,
      noticeSha256: null,
      packId: null,
      packVersion: null,
    },
    facts,
    ...overrides,
  });
}

function packSnapshot() {
  const nutrients = Object.fromEntries(NUTRIENT_FIELDS.map((field) => [field, {
    value: field === "energyKcal" ? 80 : 2,
    status: field === "fatG" ? "ESTIMATED" : "SOURCE_REPORTED",
    originalValue: field === "energyKcal" ? 80 : 2,
    originalUnit: field === "energyKcal" ? "kcal" : field === "sodiumMg" ? "mg" : "g",
  }]));
  const pack = createVerifiedPackCatalogSnapshot({
    activeRef: "tw-active-v1",
    contentSha256: "a".repeat(64),
    licenseId: "tw-license",
    noticeSha256: "b".repeat(64),
    packId: "tw-pack",
    packVersion: "2026.08.0",
    sourceId: "tw-food",
    sourceKind: "TW_FDA",
    sourceVersion: "2026.08",
    transformVersion: "tw-transform-v1",
    records: [{
      id: "food-1",
      sourceRecordId: "source-food-1",
      name: "Fixture food",
      originalName: "Fixture food",
      originalLanguage: "en",
      basis,
      originalBasis: basis,
      nutrients,
    }],
  });
  return searchLocalFoods(createLocalFoodCatalog({ installedPacks: [pack] }), { query: "Fixture food" }).results[0].nutrition;
}

function availability(snapshot = userSnapshot(), options = {}) {
  return createFoodInsightAvailability({
    schemaVersion: "FOOD_INSIGHT_REQUEST_V1",
    nutritionSnapshot: snapshot,
  }, options);
}

test("trusted local nutrition facts are available with all seven source statuses and units", () => {
  const value = availability();
  assert.equal(value.nutritionFacts.state, "AVAILABLE_FROM_TRUSTED_LOCAL_SNAPSHOT");
  assert.deepEqual(value.nutritionFacts.evidenceIds, ["FOOD-01", "FOOD-02", "FOOD-03", "FOOD-08"]);
  assert.deepEqual(value.nutritionFacts.fieldPresentation.map(({ field }) => field), NUTRIENT_FIELDS);
  assert.equal(value.nutritionFacts.fieldPresentation[0].unit, "kcal");
  assert.equal(value.nutritionFacts.snapshot.sourceKind, "USER");
  assert.match(value.availabilityFingerprint, /^[a-f0-9]{64}$/);
});

test("missing, trace, and estimated facts remain explicit instead of becoming zero or measured", () => {
  const user = availability();
  const fiber = user.nutritionFacts.fieldPresentation.find(({ field }) => field === "fiberG");
  const sugar = user.nutritionFacts.fieldPresentation.find(({ field }) => field === "sugarG");
  assert.deepEqual(fiber, { field: "fiberG", value: null, unit: "g", sourceStatus: "USER_ENTERED_TRACE", displaySemantics: "TRACE_WITHOUT_NUMERIC_VALUE" });
  assert.deepEqual(sugar, { field: "sugarG", value: null, unit: "g", sourceStatus: "MISSING", displaySemantics: "MISSING_NOT_ZERO" });

  const pack = availability(packSnapshot());
  const fat = pack.nutritionFacts.fieldPresentation.find(({ field }) => field === "fatG");
  assert.equal(fat.sourceStatus, "ESTIMATED");
  assert.equal(fat.displaySemantics, "ESTIMATED_SOURCE_VALUE");
});

test("pack nutrition must retain verified catalog trust across serialization", () => {
  const snapshot = packSnapshot();
  const original = availability(snapshot);
  const serializedSnapshot = structuredClone(snapshot);
  assert.throws(() => availability(serializedSnapshot), { code: "UNTRUSTED_PACK_NUTRITION_SNAPSHOT" });
  const trustContext = createNutritionSnapshotTrustContext([snapshot]);
  const restored = availability(serializedSnapshot, { trustContext });
  assert.deepEqual(restored, original);
});

test("health score, micronutrients, risks, and benefits stay in scope with zero content exposure", () => {
  const value = availability();
  assert.deepEqual(value.advancedCapabilities, ADVANCED_CAPABILITIES);
  assert.deepEqual(value.advancedCapabilities.map(({ capabilityId }) => capabilityId), [
    "HEALTH_SCORE",
    "MICRONUTRIENT_LABELS",
    "HEALTH_RISKS",
    "HEALTH_BENEFITS",
  ]);
  for (const capability of value.advancedCapabilities) {
    assert.equal(capability.scopeState, "PRESERVED_FOR_PHASED_DELIVERY");
    assert.equal(capability.contentState, "NOT_AUTHORIZED");
    assert.equal(capability.contentExposure, "NONE");
    assert.equal("value" in capability, false);
    assert.equal("content" in capability, false);
  }
});

test("each withheld capability is bound to the public evidence and its exact unresolved authorities", () => {
  const [score, micronutrients, risks, benefits] = availability().advancedCapabilities;
  assert.deepEqual(score.evidenceIds, ["FOOD-04"]);
  assert.deepEqual(score.blockers, ["ALGORITHM", "THRESHOLDS", "INPUT_SCOPE", "APPLICABILITY", "OWNER_DECISION"]);
  assert.deepEqual(micronutrients.evidenceIds, ["FOOD-05"]);
  assert.deepEqual(micronutrients.blockers, ["FIELD_SET", "VALUE_SOURCE", "THRESHOLDS", "OWNER_DECISION"]);
  assert.deepEqual(risks.evidenceIds, ["FOOD-06"]);
  assert.deepEqual(benefits.evidenceIds, ["FOOD-07"]);
  assert.ok(risks.blockers.includes("MEDICAL_BASIS"));
  assert.ok(benefits.blockers.includes("DISCLAIMER"));
});

test("the request cannot inject score, micronutrient, risk, benefit, or authorization content", () => {
  for (const extra of [
    { healthScore: 9 },
    { micronutrients: [{ id: "vitamin-c", value: 10 }] },
    { risks: ["bad"] },
    { benefits: ["good"] },
    { ownerAuthorized: true },
  ]) {
    assert.throws(() => createFoodInsightAvailability({
      schemaVersion: "FOOD_INSIGHT_REQUEST_V1",
      nutritionSnapshot: userSnapshot(),
      ...extra,
    }), { code: "INVALID_FOOD_INSIGHT_REQUEST" });
  }
});

test("accessors and symbol fields are rejected before request values are read", () => {
  let getterCalls = 0;
  const request = { schemaVersion: "FOOD_INSIGHT_REQUEST_V1" };
  Object.defineProperty(request, "nutritionSnapshot", { enumerable: true, get() { getterCalls += 1; return userSnapshot(); } });
  assert.throws(() => createFoodInsightAvailability(request), { code: "INVALID_FOOD_INSIGHT_REQUEST" });
  assert.equal(getterCalls, 0);
  const withSymbol = { schemaVersion: "FOOD_INSIGHT_REQUEST_V1", nutritionSnapshot: userSnapshot(), [Symbol("score")]: 9 };
  assert.throws(() => createFoodInsightAvailability(withSymbol), { code: "INVALID_FOOD_INSIGHT_REQUEST" });

  const nestedGetter = structuredClone(userSnapshot());
  Object.defineProperty(nestedGetter.facts.proteinG, "value", { enumerable: true, get() { getterCalls += 1; return 1; } });
  assert.throws(() => availability(nestedGetter), { code: "INVALID_FOOD_INSIGHT_NUTRITION" });
  assert.equal(getterCalls, 0);

  const nestedSymbol = structuredClone(userSnapshot());
  nestedSymbol.facts[Symbol("hidden-score")] = 9;
  assert.throws(() => availability(nestedSymbol), { code: "INVALID_FOOD_INSIGHT_NUTRITION" });
});

test("invalid schemas and untrusted nutrition snapshots fail closed", () => {
  assert.throws(() => createFoodInsightAvailability({ schemaVersion: "V2", nutritionSnapshot: userSnapshot() }), { code: "INVALID_FOOD_INSIGHT_REQUEST" });
  const changed = structuredClone(userSnapshot());
  changed.values.energyKcal = 999;
  assert.throws(() => availability(changed), { code: "NUTRITION_SNAPSHOT_INTEGRITY_MISMATCH" });
});

test("availability fingerprints bind exact fact content and provenance", () => {
  const first = availability();
  const changedFacts = structuredClone(userSnapshot());
  changedFacts.facts.proteinG.value = 2;
  changedFacts.facts.proteinG.originalValue = 2;
  changedFacts.values.proteinG = 2;
  const second = availability(changedFacts);
  assert.notEqual(first.availabilityFingerprint, second.availabilityFingerprint);

  const changedSource = userSnapshot({ sourceVersion: "rev-2" });
  assert.notEqual(first.availabilityFingerprint, availability(changedSource).availabilityFingerprint);
});

test("normalization detects forged capability, boundary, fact, and fingerprint evidence", () => {
  const value = availability();
  assert.deepEqual(normalizeFoodInsightAvailability(value), value);
  const mutations = [
    (copy) => { copy.advancedCapabilities[0].contentState = "AUTHORIZED"; },
    (copy) => { copy.boundary.healthScoreAlgorithmAuthorized = true; },
    (copy) => { copy.nutritionFacts.fieldPresentation[0].value = 999; },
    (copy) => { copy.availabilityFingerprint = "0".repeat(64); },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(value);
    mutate(copy);
    assert.throws(() => normalizeFoodInsightAvailability(copy), { code: "FOOD_INSIGHT_AVAILABILITY_MISMATCH" });
  }
});

test("serialized pack availability requires the original catalog trust context", () => {
  const snapshot = packSnapshot();
  const value = availability(snapshot);
  const serialized = structuredClone(value);
  assert.throws(() => normalizeFoodInsightAvailability(serialized), { code: "UNTRUSTED_PACK_NUTRITION_SNAPSHOT" });
  const trustContext = createNutritionSnapshotTrustContext([snapshot]);
  assert.deepEqual(normalizeFoodInsightAvailability(serialized, { trustContext }), value);
});

test("outputs are deeply frozen and detached from serialized user input", () => {
  const snapshot = structuredClone(userSnapshot());
  const value = availability(snapshot);
  snapshot.facts.proteinG.value = 99;
  assert.equal(value.nutritionFacts.snapshot.facts.proteinG.value, 1);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.nutritionFacts.fieldPresentation), true);
  assert.equal(Object.isFrozen(value.advancedCapabilities[0].blockers), true);
});

test("fixed boundaries authorize no advanced content, profile use, effects, I/O, native calls, or clock reads", () => {
  assert.deepEqual(BOUNDARY, {
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
});

test("the contract source performs no filesystem, network, native, clock, persistence, or scoring work", async () => {
  const source = await readFile(new URL("./food-insight-availability-harness.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /node:fs|\b(?:fetch|XMLHttpRequest|WebSocket)\b|node:https|node:http|https?:\/\//);
  assert.doesNotMatch(source, /\b(?:Date\.now|new Date|performance\.now|setTimeout|setInterval)\b/);
  assert.doesNotMatch(source, /\b(?:writeFile|appendFile|rename|unlink|rm|SQLite|Keychain|DocumentPicker)\b/);
  assert.doesNotMatch(source, /function\s+(?:calculate|score|classify|diagnose)|\b(?:riskScore|healthScoreValue|recommendedIntake)\b/);
});
