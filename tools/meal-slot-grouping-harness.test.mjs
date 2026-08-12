import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildMealSlotGrouping,
  fingerprintMealSlotDefinition,
  normalizeMealSlotAssignmentFact,
  normalizeMealSlotDefinition,
  validateMealSlotGrouping,
} from "./meal-slot-grouping-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./meal-slot-grouping-harness.mjs", import.meta.url));

function definition({
  definitionId = "owner-supplied-slots",
  definitionVersion = "v1",
  slots = [
    { slotId: "slot-a", position: 0 },
    { slotId: "slot-b", position: 1 },
  ],
} = {}) {
  return {
    schemaVersion: "MEAL_SLOT_DEFINITION_SET_V1",
    definitionId,
    definitionVersion,
    slots,
  };
}

function fact({
  recordId,
  revision = 1,
  localDate = "2026-08-12",
  definitionFingerprint = fingerprintMealSlotDefinition(definition()),
  slotId = "slot-a",
  unassigned = false,
} = {}) {
  return {
    schemaVersion: "MEAL_SLOT_ASSIGNMENT_FACT_V1",
    recordId,
    revision,
    localDate,
    slotRef: unassigned ? null : { definitionFingerprint, slotId },
  };
}

test("normalizes a caller-supplied versioned definition in explicit position order", () => {
  const normalized = normalizeMealSlotDefinition(definition({
    slots: [
      { slotId: "slot-b", position: 1 },
      { slotId: "slot-a", position: 0 },
    ],
  }));
  assert.deepEqual(normalized.slots, [
    { slotId: "slot-a", position: 0 },
    { slotId: "slot-b", position: 1 },
  ]);
  assert.match(fingerprintMealSlotDefinition(normalized), /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(normalized), true);
});

test("does not create a built-in definition when the caller explicitly supplies no slots", () => {
  const result = buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: definition({ slots: [] }),
    facts: [],
  });
  assert.deepEqual(result.groups, []);
  assert.deepEqual(result.counts, { total: 0, assigned: 0, unassigned: 0, unresolved: 0 });
});

test("rejects duplicate IDs, duplicate positions, gaps, unknown fields, and excessive definitions", () => {
  assert.throws(() => normalizeMealSlotDefinition(definition({
    slots: [{ slotId: "same", position: 0 }, { slotId: "same", position: 1 }],
  })), { code: "DUPLICATE_MEAL_SLOT" });
  assert.throws(() => normalizeMealSlotDefinition(definition({
    slots: [{ slotId: "a", position: 0 }, { slotId: "b", position: 0 }],
  })), { code: "DUPLICATE_MEAL_SLOT_POSITION" });
  assert.throws(() => normalizeMealSlotDefinition(definition({
    slots: [{ slotId: "a", position: 0 }, { slotId: "b", position: 2 }],
  })), { code: "INVALID_MEAL_SLOT_POSITION_SEQUENCE" });
  assert.throws(() => normalizeMealSlotDefinition({ ...definition(), defaultSlotId: "slot-a" }), { code: "INVALID_MEAL_SLOT_DEFINITION" });
  assert.throws(() => normalizeMealSlotDefinition(definition({
    slots: Array.from({ length: 129 }, (_, position) => ({ slotId: `slot-${position}`, position })),
  })), { code: "INVALID_MEAL_SLOT_DEFINITION" });
});

test("normalizes only explicit assignment facts and rejects invalid revisions or placement extras", () => {
  const normalized = normalizeMealSlotAssignmentFact(fact({ recordId: "meal-1", revision: 4 }));
  assert.equal(normalized.revision, 4);
  assert.equal(normalized.slotRef.slotId, "slot-a");
  assert.throws(() => normalizeMealSlotAssignmentFact(fact({ recordId: "meal-2", revision: 0 })), { code: "INVALID_MEAL_SLOT_ASSIGNMENT" });
  assert.throws(() => normalizeMealSlotAssignmentFact({ ...fact({ recordId: "meal-3" }), copiedFrom: "meal-0" }), { code: "INVALID_MEAL_SLOT_ASSIGNMENT" });
  assert.throws(() => normalizeMealSlotAssignmentFact({ ...fact({ recordId: "meal-4" }), localDate: "2026-02-29" }), { code: "INVALID_LOCAL_DATE" });
});

test("groups selected-date facts by the exact definition fingerprint and preserves empty slots", () => {
  const result = buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: definition(),
    facts: [fact({ recordId: "meal-2", revision: 2 }), fact({ recordId: "meal-1", revision: 3 })],
  });
  assert.equal(result.groups[0].status, "NON_EMPTY");
  assert.deepEqual(result.groups[0].records, [
    { recordId: "meal-1", revision: 3 },
    { recordId: "meal-2", revision: 2 },
  ]);
  assert.deepEqual(result.groups[1], {
    slotId: "slot-b",
    position: 1,
    status: "EMPTY",
    recordCount: 0,
    records: [],
  });
  assert.deepEqual(result.counts, { total: 2, assigned: 2, unassigned: 0, unresolved: 0 });
});

test("keeps explicit null assignment separate from unresolved references", () => {
  const current = definition();
  const result = buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: current,
    facts: [
      fact({ recordId: "unassigned", unassigned: true }),
      fact({ recordId: "missing-slot", slotId: "slot-z" }),
      fact({ recordId: "old-definition", definitionFingerprint: "a".repeat(64) }),
    ],
  });
  assert.deepEqual(result.unassigned.records, [{ recordId: "unassigned", revision: 1 }]);
  assert.equal(result.unresolved.recordCount, 2);
  assert.deepEqual(result.unresolved.records.map(({ recordId, reason }) => ({ recordId, reason })), [
    { recordId: "missing-slot", reason: "SLOT_NOT_IN_DEFINITION" },
    { recordId: "old-definition", reason: "DEFINITION_NOT_AVAILABLE" },
  ]);
  assert.deepEqual(result.counts, { total: 3, assigned: 0, unassigned: 1, unresolved: 2 });
});

test("filters by the requested local date without reassigning facts from another date", () => {
  const result = buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: definition(),
    facts: [
      fact({ recordId: "selected" }),
      fact({ recordId: "other-day", localDate: "2026-08-13" }),
    ],
  });
  assert.equal(result.counts.total, 1);
  assert.deepEqual(result.groups[0].records, [{ recordId: "selected", revision: 1 }]);
});

test("rejects duplicate record IDs even when they appear on different dates", () => {
  assert.throws(() => buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: definition(),
    facts: [
      fact({ recordId: "duplicate" }),
      fact({ recordId: "duplicate", localDate: "2026-08-13" }),
    ],
  }), { code: "DUPLICATE_MEAL_SLOT_ASSIGNMENT" });
});

test("a definition version or ordering change produces a new fingerprint and leaves old assignments unresolved", () => {
  const oldDefinition = definition();
  const oldFingerprint = fingerprintMealSlotDefinition(oldDefinition);
  const newDefinition = definition({
    definitionVersion: "v2",
    slots: [
      { slotId: "slot-b", position: 0 },
      { slotId: "slot-a", position: 1 },
    ],
  });
  assert.notEqual(fingerprintMealSlotDefinition(newDefinition), oldFingerprint);
  const result = buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: newDefinition,
    facts: [fact({ recordId: "old-meal", definitionFingerprint: oldFingerprint })],
  });
  assert.equal(result.counts.assigned, 0);
  assert.equal(result.unresolved.records[0].reason, "DEFINITION_NOT_AVAILABLE");
});

test("definition input order does not change the fingerprint when explicit positions agree", () => {
  const first = definition();
  const second = definition({ slots: [...definition().slots].reverse() });
  assert.equal(fingerprintMealSlotDefinition(first), fingerprintMealSlotDefinition(second));
});

test("fact order does not change grouping or selected-fact fingerprint", () => {
  const facts = [
    fact({ recordId: "meal-b", slotId: "slot-b" }),
    fact({ recordId: "meal-a", slotId: "slot-a" }),
    fact({ recordId: "meal-u", unassigned: true }),
  ];
  const forward = buildMealSlotGrouping({ localDate: "2026-08-12", definition: definition(), facts });
  const reversed = buildMealSlotGrouping({ localDate: "2026-08-12", definition: definition(), facts: [...facts].reverse() });
  assert.deepEqual(forward, reversed);
});

test("a revision change is visible in both record evidence and selected-fact fingerprint", () => {
  const before = buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: definition(),
    facts: [fact({ recordId: "meal-1", revision: 1 })],
  });
  const after = buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: definition(),
    facts: [fact({ recordId: "meal-1", revision: 2 })],
  });
  assert.equal(after.groups[0].records[0].revision, 2);
  assert.notEqual(before.selectedFactsFingerprint, after.selectedFactsFingerprint);
});

test("validates a complete grouping by reconstructing its assignment evidence", () => {
  const grouping = buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: definition(),
    facts: [
      fact({ recordId: "meal-a" }),
      fact({ recordId: "meal-b", slotId: "slot-b" }),
      fact({ recordId: "meal-u", unassigned: true }),
      fact({ recordId: "meal-old", definitionFingerprint: "b".repeat(64) }),
    ],
  });
  assert.deepEqual(validateMealSlotGrouping(structuredClone(grouping)), grouping);
});

test("rejects tampered counts, status, order, definition binding, and derived fingerprints", () => {
  const grouping = buildMealSlotGrouping({
    localDate: "2026-08-12",
    definition: definition(),
    facts: [fact({ recordId: "meal-a" })],
  });
  for (const mutate of [
    (value) => { value.counts.assigned = 2; },
    (value) => { value.groups[0].status = "EMPTY"; },
    (value) => { value.groups.reverse(); },
    (value) => { value.definitionFingerprint = "c".repeat(64); },
    (value) => { value.selectedFactsFingerprint = "d".repeat(64); },
  ]) {
    const forged = structuredClone(grouping);
    mutate(forged);
    assert.throws(() => validateMealSlotGrouping(forged), { code: "INVALID_MEAL_SLOT_GROUPING" });
  }
});

test("copies and deeply freezes definitions, facts, and grouping results", () => {
  const sourceDefinition = definition();
  const sourceFacts = [fact({ recordId: "meal-a" })];
  const result = buildMealSlotGrouping({ localDate: "2026-08-12", definition: sourceDefinition, facts: sourceFacts });
  sourceDefinition.slots[0].slotId = "rewritten";
  sourceFacts[0].recordId = "rewritten";
  assert.equal(result.groups[0].slotId, "slot-a");
  assert.equal(result.groups[0].records[0].recordId, "meal-a");
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.groups[0].records), true);
  assert.throws(() => { result.groups[0].records[0].revision = 99; }, TypeError);
});

test("does not read the system clock while grouping explicit local-date facts", () => {
  const originalNow = Date.now;
  Date.now = () => { throw new Error("system clock must not be read"); };
  try {
    assert.equal(buildMealSlotGrouping({
      localDate: "2026-08-12",
      definition: definition(),
      facts: [fact({ recordId: "meal-a" })],
    }).counts.assigned, 1);
  } finally {
    Date.now = originalNow;
  }
});

test("exposes no default meal names, mutation, network, native, storage, nutrition, or target capability", () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  for (const pattern of [
    /早餐|午餐|晚餐|零食/,
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /UserNotifications|HealthKit/,
    /AsyncStorage|SQLite|SQLCipher/,
    /["']react-native(?:\/[^"']*)?["']/,
    /["']expo(?:\/[^"']*)?["']/,
    /MOVE|COPY|DELETE|UPSERT/,
    /nutrition|calorie|macro|target/i,
  ]) assert.doesNotMatch(source, pattern);
});
