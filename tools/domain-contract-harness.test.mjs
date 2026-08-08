import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateNutritionSnapshots,
  dateContext,
  dailyNutritionSummary,
  dailyLedger,
  normalizeEnergy,
  normalizeMass,
  nutritionSnapshot,
  scaleNutritionSnapshot,
  transactionalMealMutation,
  unspecifiedTargetFixture,
} from "./domain-contract-harness.mjs";

test("scales all known nutrients to the confirmed serving and preserves missing fields", () => {
  const source = nutritionSnapshot({
    sourceId: "taiwan-food",
    sourceVersion: "2026-08",
    nutrients: { energyKcal: 200, proteinG: 10, carbohydrateG: 30 },
  });
  const scaled = scaleNutritionSnapshot(source, { servingMass: 150 });
  assert.equal(scaled.servingGrams, 150);
  assert.equal(scaled.factor, 1.5);
  assert.equal(scaled.values.energyKcal, 300);
  assert.equal(scaled.values.proteinG, 15);
  assert.equal(scaled.values.carbohydrateG, 45);
  assert.equal(scaled.values.fatG, null);
  assert.ok(scaled.missingFields.includes("fatG"));
  assert.throws(() => scaleNutritionSnapshot(source, { servingMass: 0 }), { code: "NON_POSITIVE_NUMBER" });
});

test("aggregates known nutrients without converting missing values to zero", () => {
  const complete = nutritionSnapshot({
    sourceId: "taiwan-food",
    sourceVersion: "2026-08",
    nutrients: { energyKcal: 200, proteinG: 10, sodiumMg: 0 },
  });
  const partial = nutritionSnapshot({
    sourceId: "user-food",
    sourceVersion: "local-1",
    nutrients: { energyKcal: 80 },
  });
  const aggregate = aggregateNutritionSnapshots([complete, partial]);
  assert.equal(aggregate.values.energyKcal, 280);
  assert.equal(aggregate.completeness.energyKcal, "COMPLETE");
  assert.equal(aggregate.values.proteinG, 10);
  assert.equal(aggregate.completeness.proteinG, "PARTIAL");
  assert.equal(aggregate.values.fatG, null);
  assert.equal(aggregate.completeness.fatG, "MISSING");
  assert.equal(aggregate.values.sodiumMg, 0);
  assert.equal(aggregate.completeness.sodiumMg, "PARTIAL");
});

test("summarizes only the selected local date and retains source versions", () => {
  const breakfast = scaleNutritionSnapshot(nutritionSnapshot({
    sourceId: "taiwan-food",
    sourceVersion: "2026-08",
    nutrients: { energyKcal: 200, proteinG: 10 },
  }), { servingMass: 150 });
  const snack = nutritionSnapshot({
    sourceId: "user-food",
    sourceVersion: "local-1",
    nutrients: { energyKcal: 80, proteinG: 3 },
  });
  const summary = dailyNutritionSummary({
    localDate: "2026-08-08",
    meals: [
      { id: "m1", localDate: "2026-08-08", nutrition: breakfast },
      { id: "m2", localDate: "2026-08-08", nutrition: snack },
      { id: "m3", localDate: "2026-08-07", nutrition: snack },
    ],
  });
  assert.equal(summary.mealCount, 2);
  assert.equal(summary.values.energyKcal, 380);
  assert.equal(summary.values.proteinG, 18);
  assert.deepEqual(summary.sources, [
    { sourceId: "taiwan-food", sourceVersion: "2026-08" },
    { sourceId: "user-food", sourceVersion: "local-1" },
  ]);
  const empty = dailyNutritionSummary({ localDate: "2026-08-06", meals: [] });
  assert.equal(empty.mealCount, 0);
  assert.equal(empty.values.energyKcal, null);
  assert.equal(empty.completeness.energyKcal, "MISSING");
});

test("normalizes only explicit supported units", () => {
  assert.equal(normalizeMass(1.5, "kg"), 1500);
  assert.ok(Math.abs(normalizeEnergy(418.4, "kj") - 100) < 1e-12);
  assert.throws(() => normalizeMass(1, "lb"), { code: "UNSUPPORTED_UNIT" });
  assert.throws(() => normalizeEnergy(Number.NaN, "kcal"), { code: "INVALID_NUMBER" });
});

test("derives a local date from explicit timezone context", () => {
  const context = dateContext({ instant: "2026-03-08T07:30:00Z", timeZone: "America/Los_Angeles" });
  assert.equal(context.localDate, "2026-03-07");
  assert.equal(context.timeZone, "America/Los_Angeles");
  assert.throws(
    () => dateContext({ instant: "2026-03-08T07:30:00Z", timeZone: "America/Los_Angeles", localDate: "2026-03-08" }),
    { code: "DATE_CONTEXT_MISMATCH" },
  );
  assert.throws(() => dateContext({ instant: "2026-03-08", timeZone: "America/Los_Angeles" }), { code: "INVALID_INSTANT" });
  assert.throws(() => dateContext({ instant: "2026-02-30T07:30:00Z", timeZone: "America/Los_Angeles" }), { code: "INVALID_INSTANT" });
});

test("retains missing nutrition fields as missing, never as zero", () => {
  const snapshot = nutritionSnapshot({
    sourceId: "user-food",
    sourceVersion: "local-1",
    nutrients: { energyKcal: 250, proteinG: 12 },
  });
  assert.equal(snapshot.values.energyKcal, 250);
  assert.equal(snapshot.values.fatG, null);
  assert.deepEqual(snapshot.missingFields, ["carbohydrateG", "fatG", "fiberG", "sugarG", "sodiumMg"]);
  assert.throws(() => nutritionSnapshot({ sourceId: "user-food", nutrients: {} }), { code: "MISSING_SOURCE_VERSION" });
  const polluted = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => nutritionSnapshot({ sourceId: "user-food", sourceVersion: "local-1", nutrients: polluted }), { code: "UNSAFE_OBJECT_KEY" });
});

test("ledger requires an explicit target and keeps unspecified formulas unresolved", () => {
  assert.deepEqual(dailyLedger({}), {
    status: "UNSPECIFIED",
    targetKcal: null,
    eatenKcal: 0,
    burnedKcal: 0,
    leftKcal: null,
    leftPolicy: "PENDING",
  });
  assert.deepEqual(dailyLedger({ targetKcal: 2000, eatenKcal: 750, burnedKcal: 100 }), {
    status: "EXPLICIT_TARGET",
    targetKcal: 2000,
    eatenKcal: 750,
    burnedKcal: 100,
    leftKcal: null,
    leftPolicy: "PENDING",
  });
  assert.deepEqual(unspecifiedTargetFixture(), {
    targetSource: "UNSPECIFIED",
    macroPolicy: "PENDING",
    targetKcal: null,
    ratio: null,
  });
  assert.deepEqual(dailyLedger({ eatenKcal: 750, burnedKcal: 100 }), {
    status: "UNSPECIFIED",
    targetKcal: null,
    eatenKcal: 750,
    burnedKcal: 100,
    leftKcal: null,
    leftPolicy: "PENDING",
  });
});

test("invalid meal mutations preserve the pre-transaction state", () => {
  const state = { meals: [{ id: "m1", localDate: "2026-08-06", energyKcal: 500 }] };
  const result = transactionalMealMutation(state, {
    type: "add",
    meal: { id: "m1", localDate: "2026-08-06", energyKcal: 300 },
  });
  assert.equal(result.committed, false);
  assert.equal(result.error.code, "DUPLICATE_MEAL_ID");
  assert.deepEqual(result.state, state);
  assert.deepEqual(state, { meals: [{ id: "m1", localDate: "2026-08-06", energyKcal: 500 }] });
});

test("valid meal mutations commit a complete cloned state", () => {
  const state = { meals: [] };
  const result = transactionalMealMutation(state, {
    type: "add",
    meal: { id: "m1", localDate: "2026-08-06", energyKcal: 500 },
  });
  assert.equal(result.committed, true);
  assert.deepEqual(result.state.meals, [{ id: "m1", localDate: "2026-08-06", energyKcal: 500 }]);
  assert.notEqual(result.state, state);
});
