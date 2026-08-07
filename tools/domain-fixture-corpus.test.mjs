import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  NUTRIENT_FIELDS,
  dateContext,
  nutritionSnapshot,
  transactionalMealMutation,
} from "./domain-contract-harness.mjs";

const fixturePath = join(import.meta.dirname, "fixtures", "domain-contract-v1", "contract-fixtures.json");
const fixtures = JSON.parse(readFileSync(fixturePath, "utf8"));

test("fixture corpus preserves all seven D-013 nutrition fields and provenance", () => {
  const snapshot = nutritionSnapshot(fixtures.nutrition.complete);
  assert.deepEqual(Object.keys(snapshot.values), NUTRIENT_FIELDS);
  assert.equal(snapshot.sourceId, "taiwan-food");
  assert.equal(snapshot.sourceVersion, "fixture-2026-08");
  assert.deepEqual(snapshot.missingFields, []);
});

test("fixture corpus keeps null nutrition distinct from numeric zero", () => {
  const snapshot = nutritionSnapshot(fixtures.nutrition.missing);
  assert.equal(snapshot.values.energyKcal, 180);
  assert.equal(snapshot.values.fatG, null);
  assert.equal(snapshot.values.sodiumMg, null);
  assert.notEqual(snapshot.values.fatG, 0);
  assert.ok(snapshot.missingFields.includes("sodiumMg"));
});

test("fixture corpus derives stable local dates across DST contexts", () => {
  for (const fixture of fixtures.dateContexts) {
    const context = dateContext(fixture);
    assert.equal(context.localDate, fixture.localDate, fixture.label);
    assert.equal(context.timeZone, fixture.timeZone, fixture.label);
  }
});

test("fixture corpus supports deterministic CRUD replay without hidden writes", () => {
  const added = transactionalMealMutation(fixtures.crud.initialState, fixtures.crud.add);
  assert.equal(added.committed, true);
  const updated = transactionalMealMutation(added.state, fixtures.crud.update);
  assert.equal(updated.committed, true);
  const replayed = transactionalMealMutation(updated.state, fixtures.crud.update);
  assert.deepEqual(replayed.state, updated.state);
  const deleted = transactionalMealMutation(replayed.state, {
    type: "delete",
    id: fixtures.crud.deleteId,
  });
  assert.equal(deleted.committed, true);
  assert.deepEqual(deleted.state.meals, [fixtures.crud.update.meal]);
});
