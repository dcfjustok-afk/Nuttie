import assert from "node:assert/strict";
import test from "node:test";
import {
  dateContext,
  dailyLedger,
  normalizeEnergy,
  normalizeMass,
  nutritionSnapshot,
  transactionalMealMutation,
  unspecifiedTargetFixture,
} from "./domain-contract-harness.mjs";

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
