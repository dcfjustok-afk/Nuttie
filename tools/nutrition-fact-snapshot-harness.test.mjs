import assert from "node:assert/strict";
import test from "node:test";

import { NUTRIENT_FIELDS } from "./domain-contract-harness.mjs";
import {
  NUTRIENT_UNITS,
  createNutritionFactSnapshot,
  normalizeNutritionFactSnapshot,
} from "./nutrition-fact-snapshot-harness.mjs";

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

test("creates a versioned fact snapshot with auditable conversions and raw trace text", () => {
  const snapshot = createNutritionFactSnapshot(packSnapshotInput());

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

test("normalization accepts a persisted V2 snapshot and rejects changed derived fields", () => {
  const snapshot = createNutritionFactSnapshot(packSnapshotInput());
  const persisted = structuredClone(snapshot);
  assert.deepEqual(normalizeNutritionFactSnapshot(persisted), snapshot);

  persisted.values.energyKcal = 101;
  assert.throws(() => normalizeNutritionFactSnapshot(persisted), {
    code: "NUTRITION_SNAPSHOT_INTEGRITY_MISMATCH",
  });
});

test("unit dimensions and numeric conversions fail closed", () => {
  const wrongDimension = packSnapshotInput();
  wrongDimension.facts.proteinG.originalUnit = "kcal";
  assert.throws(() => createNutritionFactSnapshot(wrongDimension), {
    code: "NUTRIENT_UNIT_DIMENSION_MISMATCH",
  });

  const wrongConversion = packSnapshotInput();
  wrongConversion.facts.sodiumMg.originalUnit = "g";
  assert.throws(() => createNutritionFactSnapshot(wrongConversion), {
    code: "NUTRIENT_CONVERSION_MISMATCH",
  });
});

test("unapproved basis transforms and source status elevation fail closed", () => {
  assert.throws(() => createNutritionFactSnapshot(packSnapshotInput({
    originalBasis: { amount: 1, unit: "serving", semantic: "DECLARED_SERVING" },
  })), { code: "UNSUPPORTED_BASIS_TRANSFORM" });

  const userFacts = facts();
  for (const fact of Object.values(userFacts)) {
    if (fact.status === "SOURCE_REPORTED" || fact.status === "ESTIMATED") {
      fact.status = "USER_ENTERED";
    } else if (fact.status === "TRACE") {
      fact.status = "USER_ENTERED_TRACE";
    }
  }
  userFacts.proteinG.status = "MEASURED";
  assert.throws(() => createNutritionFactSnapshot({
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
    facts: userFacts,
  }), { code: "INVALID_NUTRIENT_STATUS" });
});
