import assert from "node:assert/strict";
import test from "node:test";

import { NUTRIENT_FIELDS } from "./domain-contract-harness.mjs";
import {
  createNutritionSnapshotTrustContext,
  createLocalFoodCatalog,
  createVerifiedPackCatalogSnapshot,
  searchLocalFoods,
} from "./local-food-catalog-harness.mjs";
import {
  NUTRIENT_UNITS,
  createNutritionFactSnapshot,
  normalizeNutritionFactSnapshot,
  validateNutritionFactSnapshotInput,
} from "./nutrition-fact-snapshot-harness.mjs";
import { normalizeNutritionFactSnapshot as normalizeCatalogNutritionFactSnapshot } from "./local-food-catalog-harness.mjs";

const basis = Object.freeze({ amount: 100, unit: "g", semantic: "EDIBLE_PORTION" });

function numericFact(field, value, status = "SOURCE_REPORTED") {
  return {
    value,
    status,
    originalValue: value,
    originalUnit: NUTRIENT_UNITS[field],
  };
}

function facts() {
  const result = Object.fromEntries(NUTRIENT_FIELDS.map((field) => [
    field,
    numericFact(field, 1),
  ]));
  result.energyKcal = {
    value: 100,
    status: "SOURCE_REPORTED",
    originalValue: 418.4,
    originalUnit: "kJ",
  };
  result.fatG.status = "ESTIMATED";
  result.fiberG = {
    value: null,
    status: "TRACE",
    originalValue: null,
    originalUnit: "g",
    originalText: " Tr ",
  };
  result.sugarG = {
    value: null,
    status: "MISSING",
    originalValue: null,
    originalUnit: null,
  };
  return result;
}

function packSnapshotInput(overrides = {}) {
  return {
    sourceId: "TW_FDA.tw-food.food-1",
    sourceVersion: "2026.08",
    sourceKind: "TW_FDA",
    basis,
    originalBasis: basis,
    provenance: {
      sourceRecordId: "source-food-1",
      transformVersion: "tw-transform-v1",
      activeRef: "tw-active-v1",
      contentSha256: "a".repeat(64),
      licenseId: "tw-license",
      noticeSha256: "b".repeat(64),
      packId: "tw-pack",
      packVersion: "2026.08.0",
    },
    facts: facts(),
    ...overrides,
  };
}

function issuePackSnapshot(input = packSnapshotInput()) {
  const [, sourceId = "tw-food", recordId = "food-1"] = input.sourceId.split(".");
  const pack = createVerifiedPackCatalogSnapshot({
    activeRef: input.provenance.activeRef,
    contentSha256: input.provenance.contentSha256,
    licenseId: input.provenance.licenseId,
    noticeSha256: input.provenance.noticeSha256,
    packId: input.provenance.packId,
    packVersion: input.provenance.packVersion,
    sourceId,
    sourceKind: input.sourceKind,
    sourceVersion: input.sourceVersion,
    transformVersion: input.provenance.transformVersion,
    records: [{
      id: recordId,
      sourceRecordId: input.provenance.sourceRecordId,
      name: "Fixture food",
      originalName: "Fixture food",
      originalLanguage: "en",
      basis: input.basis,
      originalBasis: input.originalBasis,
      nutrients: input.facts,
    }],
  });
  const catalog = createLocalFoodCatalog({ installedPacks: [pack] });
  return searchLocalFoods(catalog, { query: "Fixture food" }).results[0].nutrition;
}

test("creates a versioned fact snapshot with auditable conversions and raw trace text", () => {
  const snapshot = issuePackSnapshot();

  assert.equal(snapshot.schemaVersion, "NUTRITION_FACT_SNAPSHOT_V2");
  assert.equal(snapshot.values.energyKcal, 100);
  assert.equal(snapshot.facts.energyKcal.originalUnit, "kJ");
  assert.equal(snapshot.facts.energyKcal.transformVersion, "tw-transform-v1");
  assert.equal(snapshot.facts.fiberG.originalText, " Tr ");
  assert.deepEqual(snapshot.traceFields, ["fiberG"]);
  assert.deepEqual(snapshot.estimatedFields, ["fatG"]);
  assert.deepEqual(snapshot.missingFields, ["sugarG"]);
  assert.equal(Object.isFrozen(snapshot.facts.energyKcal), true);
});

test("pack normalization requires issuer binding and user derived fields are rechecked", () => {
  const snapshot = issuePackSnapshot();
  assert.deepEqual(normalizeCatalogNutritionFactSnapshot(snapshot), snapshot);
  const persisted = structuredClone(snapshot);
  assert.throws(() => normalizeCatalogNutritionFactSnapshot(persisted), {
    code: "UNTRUSTED_PACK_NUTRITION_SNAPSHOT",
  });
  const trustContext = createNutritionSnapshotTrustContext([snapshot]);
  assert.deepEqual(normalizeCatalogNutritionFactSnapshot(persisted, { trustContext }), snapshot);

  const userInput = userSnapshotInput();
  const persistedUser = structuredClone(createNutritionFactSnapshot(userInput));
  persistedUser.values.energyKcal = 101;
  assert.throws(() => normalizeNutritionFactSnapshot(persistedUser), {
    code: "NUTRITION_SNAPSHOT_INTEGRITY_MISMATCH",
  });
});

test("unit dimensions and numeric conversions fail closed", () => {
  const wrongDimension = packSnapshotInput();
  wrongDimension.facts.proteinG.originalUnit = "kcal";
  assert.throws(() => issuePackSnapshot(wrongDimension), {
    code: "NUTRIENT_UNIT_DIMENSION_MISMATCH",
  });

  const wrongConversion = packSnapshotInput();
  wrongConversion.facts.sodiumMg.originalUnit = "g";
  assert.throws(() => issuePackSnapshot(wrongConversion), {
    code: "NUTRIENT_CONVERSION_MISMATCH",
  });
});

test("unapproved basis transforms and source status elevation fail closed", () => {
  assert.throws(() => issuePackSnapshot(packSnapshotInput({
    originalBasis: { amount: 1, unit: "serving", semantic: "DECLARED_SERVING" },
  })), { code: "UNSUPPORTED_BASIS_TRANSFORM" });

  const userFacts = userFactsFixture();
  userFacts.proteinG.status = "MEASURED";
  assert.throws(() => createNutritionFactSnapshot(userSnapshotInput({ facts: userFacts })), {
    code: "INVALID_NUTRIENT_STATUS",
  });
});

function userFactsFixture() {
  const userFacts = facts();
  for (const fact of Object.values(userFacts)) {
    if (fact.status === "SOURCE_REPORTED" || fact.status === "ESTIMATED") {
      fact.status = "USER_ENTERED";
    } else if (fact.status === "TRACE") {
      fact.status = "USER_ENTERED_TRACE";
    }
  }
  return userFacts;
}

function userSnapshotInput(overrides = {}) {
  return {
    sourceId: "USER.local-user.food-1",
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
    facts: userFactsFixture(),
    ...overrides,
  };
}

test("pack JSON cannot self-assert trust and trace text must agree with its unit", async () => {
  assert.equal("issueVerifiedPackNutritionFactSnapshot" in await import("./nutrition-fact-snapshot-harness.mjs"), false);
  assert.equal("issueVerifiedPackNutritionFactSnapshot" in await import("./local-food-catalog-harness.mjs"), false);
  assert.throws(() => createNutritionFactSnapshot(packSnapshotInput()), {
    code: "VERIFIED_PACK_ISSUER_REQUIRED",
  });
  const structurallyValid = validateNutritionFactSnapshotInput(packSnapshotInput());
  assert.throws(() => createNutritionSnapshotTrustContext([structurallyValid]), {
    code: "UNTRUSTED_PACK_NUTRITION_SNAPSHOT",
  });

  const mismatchedTrace = packSnapshotInput();
  mismatchedTrace.facts.fiberG.originalText = "< 5 mg";
  assert.throws(() => issuePackSnapshot(mismatchedTrace), {
    code: "TRACE_UNIT_MISMATCH",
  });
});

test("trust context is opaque and binds the complete pack snapshot", () => {
  const snapshot = issuePackSnapshot();
  const trustContext = createNutritionSnapshotTrustContext([snapshot]);
  assert.throws(() => createNutritionSnapshotTrustContext([structuredClone(snapshot)]), {
    code: "UNTRUSTED_PACK_NUTRITION_SNAPSHOT",
  });
  const changed = structuredClone(snapshot);
  changed.provenance.packVersion = "2026.09.0";
  assert.throws(() => normalizeCatalogNutritionFactSnapshot(changed, { trustContext }), {
    code: "UNTRUSTED_PACK_NUTRITION_SNAPSHOT",
  });
  assert.throws(() => normalizeCatalogNutritionFactSnapshot(structuredClone(snapshot), {
    trustContext: { kind: "NUTRITION_SNAPSHOT_TRUST_CONTEXT" },
  }), { code: "UNTRUSTED_PACK_NUTRITION_SNAPSHOT" });
});

test("serving, volume and package bases are explicit without silent conversion", () => {
  for (const currentBasis of [
    { amount: 1, unit: "serving", semantic: "DECLARED_SERVING" },
    { amount: 250, unit: "ml", semantic: "VOLUME" },
    { amount: 1, unit: "package", semantic: "DECLARED_PACKAGE" },
  ]) {
    const snapshot = createNutritionFactSnapshot(userSnapshotInput({
      basis: currentBasis,
      originalBasis: currentBasis,
    }));
    assert.deepEqual(snapshot.basis, currentBasis);
  }
});

test("persisted user V2 rejects provenance and derived-field tampering", () => {
  const snapshot = createNutritionFactSnapshot(userSnapshotInput());
  for (const [label, mutate] of [
    ["standard unit", (copy) => { copy.facts.energyKcal.standardUnit = "g"; }],
    ["fact transform", (copy) => { copy.facts.energyKcal.transformVersion = "USER_OTHER"; }],
    ["missing fields", (copy) => { copy.missingFields = []; }],
    ["trace fields", (copy) => { copy.traceFields = []; }],
    ["derived values", (copy) => { copy.values.energyKcal = 101; }],
  ]) {
    const copy = structuredClone(snapshot);
    mutate(copy);
    assert.throws(() => normalizeNutritionFactSnapshot(copy), undefined, label);
  }
});
