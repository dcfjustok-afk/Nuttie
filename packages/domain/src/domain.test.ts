import assert from "node:assert/strict";
import test from "node:test";
import { dateContext, dailyNutritionSummary, normalizeNutritionSnapshot } from "./index.js";
import { applyMutation, checkRevision, enqueueMutation, mutationFingerprint } from "./index.js";

const nutrition = (energyKcal: number | null, sourceId = "manual") => ({
  sourceId,
  sourceVersion: "v1",
  values: {
    energyKcal,
    proteinG: 20,
    carbohydrateG: 30,
    fatG: 10,
    fiberG: null,
    sugarG: 4,
    sodiumMg: 100,
  },
  provenance: { enteredBy: "test" },
});

test("normalizes all seven nutrition fields and preserves provenance", () => {
  const result = normalizeNutritionSnapshot(nutrition(420));
  assert.deepEqual(result.missingFields, ["fiberG"]);
  assert.equal(result.provenance?.enteredBy, "test");
  assert.equal(Object.isFrozen(result), true);
});

test("summarizes only the requested date and distinguishes partial values", () => {
  const result = dailyNutritionSummary({
    localDate: "2026-08-08",
    meals: [
      { id: "a", kind: "meal", localDate: "2026-08-08", recordedAt: "2026-08-08T01:00:00Z", revision: 1, nutrition: nutrition(400) },
      { id: "b", kind: "meal", localDate: "2026-08-08", recordedAt: "2026-08-08T02:00:00Z", revision: 1, nutrition: nutrition(null, "pack") },
      { id: "c", kind: "meal", localDate: "2026-08-07", recordedAt: "2026-08-07T02:00:00Z", revision: 1, nutrition: nutrition(99) },
    ],
  });
  assert.equal(result.mealCount, 2);
  assert.equal(result.values.energyKcal, 400);
  assert.equal(result.completeness.energyKcal, "PARTIAL");
  assert.equal(result.completeness.fiberG, "MISSING");
  assert.equal(result.sources.length, 2);
});

test("summarizes legacy flat nutrition fields without discarding the seven-field shape", () => {
  const result = dailyNutritionSummary({
    localDate: "2026-08-08",
    meals: [{
      id: "legacy",
      kind: "meal",
      localDate: "2026-08-08",
      recordedAt: "2026-08-08T01:00:00Z",
      revision: 1,
      energyKcal: 250,
      proteinG: 12,
      carbsG: 32,
      fatG: 7,
    }],
  });
  assert.equal(result.values.carbohydrateG, 32);
  assert.equal(result.completeness.sodiumMg, "MISSING");
  assert.deepEqual(result.sources, [{ sourceId: "legacy", sourceVersion: "flat-v1" }]);
});

test("date context derives local date from an explicit timezone", () => {
  assert.equal(dateContext({ instant: "2026-03-08T07:30:00Z", timeZone: "America/Los_Angeles" }).localDate, "2026-03-07");
  assert.throws(() => dateContext({ instant: "2026-03-08", timeZone: "America/Los_Angeles" }), { code: "INVALID_INSTANT" });
});

test("revision check is compare-and-swap", () => {
  assert.deepEqual(checkRevision(2, 2), { ok: true, nextRevision: 3 });
  assert.deepEqual(checkRevision(1, 2), { ok: false, code: "REVISION_CONFLICT", expected: 1, actual: 2 });
});

test("mutation queue rejects duplicate client ids and fingerprints are order stable", () => {
  const mutation = { clientMutationId: "m1", entityType: "meal" as const, operation: "create" as const, baseRevision: 0, payload: { b: 2, a: 1 } };
  const queue = enqueueMutation([], mutation);
  assert.throws(() => enqueueMutation(queue, mutation), { code: "IDEMPOTENCY_CONFLICT" });
  assert.equal(mutationFingerprint(mutation), mutationFingerprint({ ...mutation, payload: { a: 1, b: 2 } }));
});

test("applyMutation leaves records unchanged on stale revision", () => {
  const initial = [{ id: "meal-1", kind: "meal" as const, localDate: "2026-08-08", recordedAt: "2026-08-08T00:00:00Z", revision: 2, nutrition: nutrition(100) }];
  const result = applyMutation(initial, { clientMutationId: "m2", entityType: "meal", operation: "update", baseRevision: 1, payload: { id: "meal-1", localDate: "2026-08-08", recordedAt: "2026-08-08T00:00:00Z" } });
  assert.equal(result.ok, false);
  assert.deepEqual(initial, result.records);
});

test("applyMutation creates and then advances record/server revisions", () => {
  const result = applyMutation([], { clientMutationId: "m3", entityType: "water", operation: "create", baseRevision: 0, payload: { amount: 350, unit: "ml", localDate: "2026-08-08", recordedAt: "2026-08-08T01:00:00Z" } });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.record.revision, 1);
    assert.equal(result.record.serverRevision, 1);
  }
});

test("entityId is authoritative when a mutation payload omits its id", () => {
  const result = applyMutation([], {
    clientMutationId: "client-entity",
    entityId: "meal-authoritative",
    deviceId: "device-1",
    clientCreatedAt: "2026-08-29T01:00:00Z",
    entityType: "meal",
    operation: "create",
    baseRevision: 0,
    payload: { localDate: "2026-08-29", recordedAt: "2026-08-29T01:00:00Z" },
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.record.id, "meal-authoritative");
});
