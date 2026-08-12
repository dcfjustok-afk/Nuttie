import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { nutritionSnapshot } from "./domain-contract-harness.mjs";
import {
  MACROS,
  TARGET_STATUSES,
  buildMacroActualTargetView,
  buildMacroTargetHistory,
  normalizeMacroTargetVersion,
  validateMacroTargetHistory,
} from "./macro-target-history-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./macro-target-history-harness.mjs", import.meta.url));

function unitDefinition({ id = "caller-gram-definition", version = "v1", payload = { dimension: "caller-supplied-mass" } } = {}) {
  return {
    schemaVersion: "MACRO_TARGET_UNIT_DEFINITION_V1",
    unitDefinitionId: id,
    unitDefinitionVersion: version,
    payload,
  };
}

function setTarget(inputValue, definition = unitDefinition()) {
  return { status: TARGET_STATUSES.SET, inputValue, unitDefinition: definition };
}

function unsetTarget() {
  return { status: TARGET_STATUSES.UNSET };
}

function targets({ protein = setTarget("100"), carbohydrate = setTarget("250"), fat = setTarget("66.67") } = {}) {
  return { protein, carbohydrate, fat };
}

function version({
  versionId = "goal-v1",
  effectiveFrom = "2026-08-01",
  generatedAt = "2026-07-31T21:00:00+08:00",
  sourceKind = "CALLER_SUPPLIED",
  sourceId = "source-1",
  sourceVersion = "source-v1",
  ruleId = null,
  ruleVersion = null,
  userEdited = false,
  targetValues = targets(),
} = {}) {
  return {
    schemaVersion: "MACRO_TARGET_VERSION_V1",
    versionId,
    effectiveFrom,
    generatedAt,
    source: { sourceKind, sourceId, sourceVersion, ruleId, ruleVersion, userEdited },
    targets: targetValues,
  };
}

function meal(id, localDate, nutrients) {
  return {
    id,
    localDate,
    nutrition: nutritionSnapshot({ sourceId: "user-food", sourceVersion: "local-v1", nutrients }),
  };
}

test("preserves caller-supplied decimal targets, opaque unit definitions, source, and exact values", () => {
  const normalized = normalizeMacroTargetVersion(version({
    sourceKind: "MANUAL_IMPORT",
    sourceId: "manual-record-7",
    sourceVersion: "manual-v3",
    userEdited: true,
    targetValues: targets({ fat: setTarget("66.670") }),
  }));
  assert.equal(normalized.targets.fat.inputValue, "66.670");
  assert.deepEqual(normalized.targets.fat.exactValue, { numerator: "6667", denominator: "100" });
  assert.equal(normalized.targets.fat.unitDefinition.payload.dimension, "caller-supplied-mass");
  assert.equal(normalized.source.userEdited, true);
  assert.equal(Object.isFrozen(normalized), true);
});

test("keeps numeric zero distinct from an unset target", () => {
  const normalized = normalizeMacroTargetVersion(version({
    targetValues: targets({ protein: setTarget("0"), carbohydrate: unsetTarget() }),
  }));
  assert.deepEqual(normalized.targets.protein.exactValue, { numerator: "0", denominator: "1" });
  assert.deepEqual(normalized.targets.carbohydrate, { status: TARGET_STATUSES.UNSET });
});

test("allows all-unset and partially-set versions without inventing missing values", () => {
  const allUnset = buildMacroTargetHistory({
    versions: [version({ targetValues: targets({ protein: unsetTarget(), carbohydrate: unsetTarget(), fat: unsetTarget() }) })],
    startLocalDate: "2026-08-01",
    endLocalDate: "2026-08-01",
  });
  assert.equal(allUnset.segments[0].status, "NO_TARGETS_SET");
  const partial = buildMacroTargetHistory({
    versions: [version({ targetValues: targets({ carbohydrate: unsetTarget() }) })],
    startLocalDate: "2026-08-01",
    endLocalDate: "2026-08-01",
  });
  assert.equal(partial.segments[0].status, "PARTIALLY_SET");
  assert.deepEqual(partial.segments[0].effectiveVersion.targets.carbohydrate, { status: "UNSET" });
});

test("rejects numeric inputs, signed or exponent strings, unsupported status, and forged exact evidence", () => {
  assert.throws(() => normalizeMacroTargetVersion(version({ targetValues: targets({ protein: setTarget(100) }) })), { code: "INVALID_MACRO_TARGET_VALUE" });
  assert.throws(() => normalizeMacroTargetVersion(version({ targetValues: targets({ protein: setTarget("-1") }) })), { code: "INVALID_MACRO_TARGET_VALUE" });
  assert.throws(() => normalizeMacroTargetVersion(version({ targetValues: targets({ protein: setTarget("1e2") }) })), { code: "INVALID_MACRO_TARGET_VALUE" });
  assert.throws(() => normalizeMacroTargetVersion(version({ targetValues: targets({ protein: { status: "DEFAULTED" } }) })), { code: "INVALID_MACRO_TARGET_FACT" });
  const forged = version();
  forged.targets.protein.exactValue = { numerator: "999", denominator: "1" };
  assert.throws(() => normalizeMacroTargetVersion(forged), { code: "INVALID_MACRO_TARGET_FACT" });
});

test("rejects unknown target fields, unsafe unit payloads, oversized payloads, and resource abuse", () => {
  assert.throws(() => normalizeMacroTargetVersion(version({
    targetValues: { ...targets(), fiber: setTarget("20") },
  })), { code: "INVALID_MACRO_TARGET_SET" });
  const unsafePayload = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => normalizeMacroTargetVersion(version({
    targetValues: targets({ protein: setTarget("100", unitDefinition({ payload: unsafePayload })) }),
  })), { code: "INVALID_MACRO_TARGET_UNIT" });
  assert.throws(() => normalizeMacroTargetVersion(version({
    targetValues: targets({ protein: setTarget("100", unitDefinition({ payload: { note: "x".repeat(5000) } })) }),
  })), { code: "INVALID_MACRO_TARGET_UNIT" });
  assert.throws(() => buildMacroTargetHistory({
    versions: Array.from({ length: 4097 }, (_, index) => version({ versionId: `v-${index}`, effectiveFrom: `2026-08-01` })),
    startLocalDate: "2026-08-01",
    endLocalDate: "2026-08-01",
  }), { code: "INVALID_MACRO_TARGET_HISTORY" });
});

test("requires explicit source and paired optional rule identity without interpreting either", () => {
  const withRule = normalizeMacroTargetVersion(version({ ruleId: "opaque-rule", ruleVersion: "opaque-v4" }));
  assert.equal(withRule.source.ruleId, "opaque-rule");
  assert.equal(withRule.source.ruleVersion, "opaque-v4");
  assert.throws(() => normalizeMacroTargetVersion(version({ ruleId: "opaque-rule", ruleVersion: null })), { code: "INVALID_MACRO_TARGET_SOURCE" });
  assert.throws(() => normalizeMacroTargetVersion(version({ sourceKind: "" })), { code: "INVALID_MACRO_TARGET_SOURCE" });
});

test("builds an explicit no-effective-version segment before the first target version", () => {
  const history = buildMacroTargetHistory({
    versions: [version({ effectiveFrom: "2026-08-10" })],
    startLocalDate: "2026-08-01",
    endLocalDate: "2026-08-09",
  });
  assert.deepEqual(history.segments, [{
    startLocalDate: "2026-08-01",
    endLocalDate: "2026-08-09",
    status: "NO_EFFECTIVE_VERSION",
    effectiveVersion: null,
  }]);
});

test("segments history exactly at effective dates and keeps the prior version on earlier days", () => {
  const first = version({ versionId: "goal-v1", effectiveFrom: "2026-08-01" });
  const second = version({
    versionId: "goal-v2",
    effectiveFrom: "2026-08-10",
    generatedAt: "2026-08-09T21:00:00+08:00",
    targetValues: targets({ protein: setTarget("110") }),
  });
  const history = buildMacroTargetHistory({ versions: [second, first], startLocalDate: "2026-08-05", endLocalDate: "2026-08-12" });
  assert.deepEqual(history.segments.map((segment) => ({ start: segment.startLocalDate, end: segment.endLocalDate, id: segment.effectiveVersion.versionId })), [
    { start: "2026-08-05", end: "2026-08-09", id: "goal-v1" },
    { start: "2026-08-10", end: "2026-08-12", id: "goal-v2" },
  ]);
});

test("a future version changes collection evidence but never rewrites an earlier effective segment", () => {
  const first = version({ versionId: "goal-v1", effectiveFrom: "2026-08-01" });
  const before = buildMacroTargetHistory({ versions: [first], startLocalDate: "2026-08-05", endLocalDate: "2026-08-05" });
  const after = buildMacroTargetHistory({
    versions: [first, version({ versionId: "goal-v2", effectiveFrom: "2026-09-01", generatedAt: "2026-08-31T21:00:00+08:00" })],
    startLocalDate: "2026-08-05",
    endLocalDate: "2026-08-05",
  });
  assert.deepEqual(after.segments, before.segments);
  assert.notEqual(after.versionsFingerprint, before.versionsFingerprint);
});

test("rejects duplicate version IDs, ambiguous effective dates, and conflicting versioned unit definitions", () => {
  assert.throws(() => buildMacroTargetHistory({
    versions: [version(), version({ effectiveFrom: "2026-08-02" })],
    startLocalDate: "2026-08-01",
    endLocalDate: "2026-08-02",
  }), { code: "DUPLICATE_MACRO_TARGET_VERSION" });
  assert.throws(() => buildMacroTargetHistory({
    versions: [version(), version({ versionId: "goal-v2" })],
    startLocalDate: "2026-08-01",
    endLocalDate: "2026-08-02",
  }), { code: "AMBIGUOUS_MACRO_TARGET_EFFECTIVE_DATE" });
  assert.throws(() => buildMacroTargetHistory({
    versions: [
      version(),
      version({
        versionId: "goal-v2",
        effectiveFrom: "2026-08-02",
        targetValues: targets({
          protein: setTarget("100", unitDefinition({ payload: { dimension: "conflicting-definition" } })),
        }),
      }),
    ],
    startLocalDate: "2026-08-01",
    endLocalDate: "2026-08-02",
  }), { code: "MACRO_TARGET_UNIT_DEFINITION_CONFLICT" });
});

test("validates dates, explicit-offset instants, query direction, and bounded history windows", () => {
  assert.throws(() => normalizeMacroTargetVersion(version({ effectiveFrom: "2026-02-29" })), { code: "INVALID_LOCAL_DATE" });
  assert.throws(() => normalizeMacroTargetVersion(version({ generatedAt: "2026-08-01" })), { code: "INVALID_MACRO_TARGET_VERSION" });
  assert.throws(() => normalizeMacroTargetVersion(version({ generatedAt: "2026-02-30T12:00:00Z" })), { code: "INVALID_LOCAL_DATE" });
  assert.throws(() => buildMacroTargetHistory({ versions: [], startLocalDate: "2026-08-02", endLocalDate: "2026-08-01" }), { code: "INVALID_MACRO_TARGET_QUERY" });
  assert.throws(() => buildMacroTargetHistory({ versions: [], startLocalDate: "1900-01-01", endLocalDate: "2100-01-01" }), { code: "MACRO_TARGET_QUERY_TOO_LARGE" });
});

test("history normalization is stable regardless of input version order", () => {
  const versions = [
    version({ versionId: "goal-v1", effectiveFrom: "2026-08-01" }),
    version({ versionId: "goal-v2", effectiveFrom: "2026-08-10", generatedAt: "2026-08-09T21:00:00+08:00" }),
  ];
  const forward = buildMacroTargetHistory({ versions, startLocalDate: "2026-08-01", endLocalDate: "2026-08-12" });
  const reversed = buildMacroTargetHistory({ versions: [...versions].reverse(), startLocalDate: "2026-08-01", endLocalDate: "2026-08-12" });
  assert.deepEqual(forward, reversed);
});

test("validates complete history evidence and rejects tampered segments, versions, counts, or fingerprints", () => {
  const history = buildMacroTargetHistory({ versions: [version()], startLocalDate: "2026-08-01", endLocalDate: "2026-08-12" });
  assert.deepEqual(validateMacroTargetHistory(structuredClone(history)), history);
  for (const mutate of [
    (value) => { value.query.dayCount += 1; },
    (value) => { value.segments[0].endLocalDate = "2026-08-11"; },
    (value) => { value.segments[0].status = "PARTIALLY_SET"; },
    (value) => { value.versions[0].targets.protein.inputValue = "999"; },
    (value) => { value.versionsFingerprint = "a".repeat(64); },
  ]) {
    const forged = structuredClone(history);
    mutate(forged);
    assert.throws(() => validateMacroTargetHistory(forged), { code: "INVALID_MACRO_TARGET_HISTORY" });
  }
});

test("combines effective targets with actual P/C/F facts while preserving partial and missing actuals", () => {
  const view = buildMacroActualTargetView({
    localDate: "2026-08-12",
    targetVersions: [version()],
    meals: [
      meal("meal-1", "2026-08-12", { proteinG: 10, carbohydrateG: 20, fatG: 0 }),
      meal("meal-2", "2026-08-12", { proteinG: 5 }),
    ],
  });
  assert.equal(view.actual.mealCount, 2);
  assert.deepEqual(view.actual.macros.protein, {
    status: "COMPLETE",
    valueGrams: 15,
    factQuality: {
      sourceReported: 0,
      measured: 0,
      estimated: 0,
      userEntered: 0,
      userConfirmed: 0,
      trace: 0,
      missing: 0,
      legacyKnown: 2,
      legacyMissing: 0,
    },
  });
  assert.equal(view.actual.macros.carbohydrate.status, "PARTIAL");
  assert.equal(view.actual.macros.carbohydrate.valueGrams, 20);
  assert.equal(view.actual.macros.fat.status, "PARTIAL");
  assert.equal(view.actual.macros.fat.valueGrams, 0);
  assert.equal(view.target.effectiveVersion.versionId, "goal-v1");
  assert.equal(view.comparisonPolicy, "UNSPECIFIED");
  assert.equal(view.roundingPolicy, "UNSPECIFIED");
});

test("returns missing actuals and no target without manufacturing zeros or a default goal", () => {
  const view = buildMacroActualTargetView({ localDate: "2026-08-12", meals: [], targetVersions: [] });
  assert.deepEqual(MACROS, ["protein", "carbohydrate", "fat"]);
  for (const macro of MACROS) {
    assert.equal(view.actual.macros[macro].status, "MISSING");
    assert.equal(view.actual.macros[macro].valueGrams, null);
  }
  assert.equal(view.target.status, "NO_EFFECTIVE_VERSION");
  assert.equal(view.target.effectiveVersion, null);
});

test("historical actual/target view selects the version effective on that exact local date", () => {
  const versions = [
    version({ versionId: "goal-v1", effectiveFrom: "2026-08-01" }),
    version({ versionId: "goal-v2", effectiveFrom: "2026-08-10", generatedAt: "2026-08-09T21:00:00+08:00", targetValues: targets({ protein: setTarget("120") }) }),
  ];
  const oldView = buildMacroActualTargetView({ localDate: "2026-08-09", meals: [], targetVersions: versions });
  const newView = buildMacroActualTargetView({ localDate: "2026-08-10", meals: [], targetVersions: versions });
  assert.equal(oldView.target.effectiveVersion.versionId, "goal-v1");
  assert.equal(newView.target.effectiveVersion.versionId, "goal-v2");
});

test("does not read the system clock and returns immutable copies", () => {
  const originalNow = Date.now;
  Date.now = () => { throw new Error("system clock must not be read"); };
  try {
    const sourceVersion = version();
    const history = buildMacroTargetHistory({ versions: [sourceVersion], startLocalDate: "2026-08-01", endLocalDate: "2026-08-12" });
    sourceVersion.targets.protein.inputValue = "999";
    assert.equal(history.versions[0].targets.protein.inputValue, "100");
    assert.equal(Object.isFrozen(history), true);
    assert.equal(Object.isFrozen(history.segments[0].effectiveVersion.targets), true);
    assert.throws(() => { history.segments[0].status = "ALTERED"; }, TypeError);
  } finally {
    Date.now = originalNow;
  }
});

test("exposes no target algorithm, percent conversion, comparison, rounding, mutation, network, native, or storage capability", async () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  for (const pattern of [
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /UserNotifications|HealthKit/,
    /AsyncStorage|SQLite|SQLCipher/,
    /["']react-native(?:\/[^"']*)?["']/,
    /["']expo(?:\/[^"']*)?["']/,
    /Mifflin|NASEM|NIDDK|AMDR|Atwater|4\/4\/9/,
    /percent|percentage|ratio/i,
    /(?:\bMath\.(?:round|floor|ceil)|\.toFixed)\s*\(/,
    /CREATE|UPDATE|DELETE|UPSERT|SAVE_TARGET/,
    /remaining|achievement|overTarget|underTarget/i,
  ]) assert.doesNotMatch(source, pattern);
  const module = await import("./macro-target-history-harness.mjs");
  for (const name of ["calculateTarget", "convertPercentToGrams", "saveTarget", "updateTarget", "deleteTarget", "compareTarget", "roundTarget"]) {
    assert.equal(name in module, false);
  }
});
