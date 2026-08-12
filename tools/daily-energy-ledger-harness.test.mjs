import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildDailyEnergyLedger,
  createInMemoryDailyEnergyLedgerRepository,
  normalizeEnergyTargetVersion,
  readDailyEnergyLedger,
  validateDailyEnergyLedger,
} from "./daily-energy-ledger-harness.mjs";
import { normalizeEnergyFact } from "./seven-day-energy-trend-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./daily-energy-ledger-harness.mjs", import.meta.url));

function fact({
  id = "meal-energy-1",
  localDate = "2026-08-12",
  stream = "INTAKE",
  inputValue = "100",
  inputUnit = "KCAL",
  kind = stream === "INTAKE" ? "MEAL_RECORD" : "MANUAL_BURN",
  recordId = `${id}-source`,
  revision = 1,
  quality = kind === "MANUAL_BURN" ? "USER_ENTERED" : kind === "LOCAL_ESTIMATE" ? "ESTIMATED" : "SOURCE_REPORTED",
} = {}) {
  return normalizeEnergyFact({
    schemaVersion: "ENERGY_FACT_V1",
    id,
    localDate,
    stream,
    energy: { inputValue, inputUnit },
    source: { kind, recordId, revision, quality },
  });
}

function targetVersion({
  versionId = "energy-goal-v1",
  effectiveFrom = "2026-08-01",
  generatedAt = "2026-07-31T21:00:00+08:00",
  status = "SET",
  inputValue = "2000",
  inputUnit = "KCAL",
  sourceKind = "CALLER_SUPPLIED",
  sourceId = "goal-source-1",
  sourceVersion = "source-v1",
  ruleId = null,
  ruleVersion = null,
  userEdited = false,
} = {}) {
  return {
    schemaVersion: "ENERGY_TARGET_VERSION_V1",
    versionId,
    effectiveFrom,
    generatedAt,
    source: { sourceKind, sourceId, sourceVersion, ruleId, ruleVersion, userEdited },
    target: status === "UNSET" ? { status: "UNSET" } : { status: "SET", inputValue, inputUnit },
  };
}

async function ledger({ facts = [], targetVersions = [], localDate = "2026-08-12", repositoryRevision = "daily-ledger-repository-1" } = {}) {
  return readDailyEnergyLedger(createInMemoryDailyEnergyLedgerRepository({ facts, targetVersions, repositoryRevision }), localDate);
}

test("preserves an explicit target value, unit conversion, source, user edit, and effective date", () => {
  const target = normalizeEnergyTargetVersion(targetVersion({
    inputValue: "8368.000",
    inputUnit: "KJ",
    sourceKind: "MANUAL_IMPORT",
    sourceId: "manual-goal-7",
    sourceVersion: "manual-v3",
    userEdited: true,
  }));
  assert.equal(target.target.inputValue, "8368.000");
  assert.equal(target.target.inputUnit, "KJ");
  assert.deepEqual(target.target.exactKcal, { numerator: "2000", denominator: "1" });
  assert.equal(target.source.userEdited, true);
  assert.equal(target.effectiveFrom, "2026-08-01");
});

test("keeps an explicit zero target distinct from an unset target", () => {
  const zero = normalizeEnergyTargetVersion(targetVersion({ inputValue: "0" }));
  const unset = normalizeEnergyTargetVersion(targetVersion({ status: "UNSET" }));
  assert.deepEqual(zero.target.exactKcal, { numerator: "0", denominator: "1" });
  assert.deepEqual(unset.target, { status: "UNSET" });
});

test("rejects implicit numbers, signed/exponent values, unknown units, invalid instants, incomplete rule identity, extras, and forged conversions", () => {
  assert.throws(() => normalizeEnergyTargetVersion(targetVersion({ inputValue: 2000 })), { code: "INVALID_ENERGY_TARGET_VALUE" });
  assert.throws(() => normalizeEnergyTargetVersion(targetVersion({ inputValue: "-1" })), { code: "INVALID_ENERGY_TARGET_VALUE" });
  assert.throws(() => normalizeEnergyTargetVersion(targetVersion({ inputValue: "2e3" })), { code: "INVALID_ENERGY_TARGET_VALUE" });
  assert.throws(() => normalizeEnergyTargetVersion(targetVersion({ inputUnit: "CAL" })), { code: "INVALID_ENERGY_TARGET_VALUE" });
  assert.throws(() => normalizeEnergyTargetVersion(targetVersion({ generatedAt: "2026-08-01" })), { code: "INVALID_ENERGY_TARGET_VERSION" });
  assert.throws(() => normalizeEnergyTargetVersion(targetVersion({ ruleId: "rule-1" })), { code: "INVALID_ENERGY_TARGET_SOURCE" });
  assert.throws(() => normalizeEnergyTargetVersion({ ...targetVersion(), recommendation: true }), { code: "INVALID_ENERGY_TARGET_VERSION" });
  const forged = normalizeEnergyTargetVersion(targetVersion());
  assert.throws(() => normalizeEnergyTargetVersion({ ...forged, target: { ...forged.target, exactKcal: { numerator: "1", denominator: "1" } } }), { code: "INVALID_ENERGY_TARGET_VALUE" });
});

test("aggregates intake and burned facts exactly while keeping both streams separate", async () => {
  const result = await ledger({
    facts: [
      fact({ id: "meal-kcal", inputValue: "0.1" }),
      fact({ id: "meal-kj", inputValue: "4.184", inputUnit: "KJ" }),
      fact({ id: "burn", stream: "BURNED", inputValue: "120" }),
    ],
    targetVersions: [targetVersion()],
  });
  assert.deepEqual(result.facts.intake.exactKcal, { numerator: "11", denominator: "10" });
  assert.deepEqual(result.facts.burned.exactKcal, { numerator: "120", denominator: "1" });
  assert.equal(result.facts.intake.factCount, 2);
  assert.equal(result.facts.burned.factCount, 1);
  assert.deepEqual(result.facts.target.exactKcal, { numerator: "2000", denominator: "1" });
});

test("an empty day exposes missing intake, missing burned, no target, and no manufactured zero", async () => {
  const result = await ledger();
  assert.deepEqual(result.facts.intake, { status: "MISSING", factCount: 0, exactKcal: null, facts: [] });
  assert.deepEqual(result.facts.burned, { status: "MISSING", factCount: 0, exactKcal: null, facts: [] });
  assert.deepEqual(result.facts.target, { status: "NO_EFFECTIVE_VERSION", effectiveVersion: null, exactKcal: null });
});

test("explicit zero intake and burn remain known instead of becoming missing", async () => {
  const result = await ledger({ facts: [fact({ inputValue: "0" }), fact({ id: "burn-zero", stream: "BURNED", inputValue: "0" })] });
  assert.equal(result.facts.intake.status, "KNOWN");
  assert.equal(result.facts.burned.status, "KNOWN");
  assert.deepEqual(result.facts.intake.exactKcal, { numerator: "0", denominator: "1" });
  assert.deepEqual(result.facts.burned.exactKcal, { numerator: "0", denominator: "1" });
});

test("selects the exact target version effective on the requested historical date", async () => {
  const versions = [
    targetVersion({ versionId: "goal-v1", effectiveFrom: "2026-08-01", inputValue: "1800" }),
    targetVersion({ versionId: "goal-v2", effectiveFrom: "2026-08-10", generatedAt: "2026-08-09T21:00:00+08:00", inputValue: "2000" }),
  ];
  const oldLedger = await ledger({ localDate: "2026-08-09", targetVersions: versions });
  const newLedger = await ledger({ localDate: "2026-08-10", targetVersions: versions });
  assert.equal(oldLedger.facts.target.effectiveVersion.versionId, "goal-v1");
  assert.deepEqual(oldLedger.facts.target.exactKcal, { numerator: "1800", denominator: "1" });
  assert.equal(newLedger.facts.target.effectiveVersion.versionId, "goal-v2");
});

test("distinguishes no effective version from an effective version whose target is unset", async () => {
  const before = await ledger({ localDate: "2026-08-01", targetVersions: [targetVersion({ effectiveFrom: "2026-08-02", status: "UNSET" })] });
  const after = await ledger({ localDate: "2026-08-02", targetVersions: [targetVersion({ effectiveFrom: "2026-08-02", status: "UNSET" })] });
  assert.equal(before.facts.target.status, "NO_EFFECTIVE_VERSION");
  assert.equal(after.facts.target.status, "UNSET");
  assert.equal(after.facts.target.exactKcal, null);
});

test("a future target version changes collection evidence but never rewrites the earlier effective target", async () => {
  const first = targetVersion();
  const before = await ledger({ targetVersions: [first] });
  const after = await ledger({ targetVersions: [first, targetVersion({ versionId: "goal-v2", effectiveFrom: "2026-09-01", generatedAt: "2026-08-31T21:00:00+08:00" })] });
  assert.deepEqual(after.facts.target, before.facts.target);
  assert.notEqual(after.evidence.targetVersionsFingerprint, before.evidence.targetVersionsFingerprint);
});

test("rejects duplicate target version IDs, ambiguous effective dates, and duplicate energy fact IDs", () => {
  assert.throws(() => createInMemoryDailyEnergyLedgerRepository({ targetVersions: [targetVersion(), targetVersion({ effectiveFrom: "2026-08-02" })] }), { code: "DUPLICATE_ENERGY_TARGET_VERSION" });
  assert.throws(() => createInMemoryDailyEnergyLedgerRepository({ targetVersions: [targetVersion(), targetVersion({ versionId: "goal-v2" })] }), { code: "AMBIGUOUS_ENERGY_TARGET_EFFECTIVE_DATE" });
  assert.throws(() => createInMemoryDailyEnergyLedgerRepository({ facts: [fact(), fact()] }), { code: "DUPLICATE_ENERGY_FACT" });
});

test("filters the selected local date and preserves every source record and revision", async () => {
  const result = await ledger({ facts: [
    fact({ id: "selected", recordId: "meal-42", revision: 3 }),
    fact({ id: "other-day", localDate: "2026-08-11", recordId: "meal-41" }),
  ] });
  assert.equal(result.facts.intake.factCount, 1);
  assert.deepEqual(result.facts.intake.facts[0].source, { kind: "MEAL_RECORD", recordId: "meal-42", revision: 3, quality: "SOURCE_REPORTED" });
});

test("input order does not change canonical evidence or the ledger", async () => {
  const facts = [fact({ id: "z" }), fact({ id: "a" }), fact({ id: "burn", stream: "BURNED" })];
  const versions = [targetVersion({ versionId: "goal-v1" }), targetVersion({ versionId: "goal-v2", effectiveFrom: "2026-08-10", generatedAt: "2026-08-09T21:00:00+08:00" })];
  const forward = await ledger({ facts, targetVersions: versions });
  const reverse = await ledger({ facts: [...facts].reverse(), targetVersions: [...versions].reverse() });
  assert.deepEqual(forward, reverse);
});

test("rejects incomplete, out-of-date, fingerprint-forged, and structurally extended snapshots", async () => {
  const repository = createInMemoryDailyEnergyLedgerRepository({ facts: [fact()], targetVersions: [targetVersion()] });
  const snapshot = await repository.queryDailyEnergyLedger("2026-08-12");
  assert.throws(() => buildDailyEnergyLedger({ ...snapshot, complete: false }), { code: "INVALID_DAILY_LEDGER_SNAPSHOT" });
  const outside = structuredClone(snapshot);
  outside.facts[0].localDate = "2026-08-11";
  assert.throws(() => buildDailyEnergyLedger(outside), { code: "DAILY_LEDGER_FACT_OUTSIDE_DATE" });
  assert.throws(() => buildDailyEnergyLedger({ ...snapshot, factsFingerprint: "a".repeat(64) }), { code: "INVALID_DAILY_LEDGER_SNAPSHOT" });
  assert.throws(() => buildDailyEnergyLedger({ ...snapshot, targetVersionsFingerprint: "b".repeat(64) }), { code: "INVALID_DAILY_LEDGER_SNAPSHOT" });
  assert.throws(() => buildDailyEnergyLedger({ ...snapshot, accountId: "cloud-user" }), { code: "INVALID_DAILY_LEDGER_SNAPSHOT" });
});

test("validates complete ledger evidence and rejects tampered facts, targets, Left, or dates", async () => {
  const result = await ledger({ facts: [fact()], targetVersions: [targetVersion()] });
  assert.deepEqual(validateDailyEnergyLedger(structuredClone(result)), result);
  for (const mutate of [
    (value) => { value.localDate = "2026-08-11"; },
    (value) => { value.facts.intake.factCount += 1; },
    (value) => { value.facts.target.exactKcal.numerator = "999"; },
    (value) => { value.left.status = "CALCULATED"; },
    (value) => { value.left.exactKcal = { numerator: "1900", denominator: "1" }; },
  ]) {
    const forged = structuredClone(result);
    mutate(forged);
    assert.throws(() => validateDailyEnergyLedger(forged), { code: "INVALID_DAILY_ENERGY_LEDGER" });
  }
});

test("repository revisions recompute changed and deleted facts without cache leakage", async () => {
  const before = await ledger({ facts: [fact({ inputValue: "100" }), fact({ id: "burn", stream: "BURNED", inputValue: "20" })], repositoryRevision: "ledger-repository-1" });
  const after = await ledger({ facts: [fact({ inputValue: "150", revision: 2 })], repositoryRevision: "ledger-repository-2" });
  assert.deepEqual(before.facts.intake.exactKcal, { numerator: "100", denominator: "1" });
  assert.equal(before.facts.burned.status, "KNOWN");
  assert.deepEqual(after.facts.intake.exactKcal, { numerator: "150", denominator: "1" });
  assert.equal(after.facts.burned.status, "MISSING");
  assert.equal(after.evidence.repositoryRevision, "ledger-repository-2");
});

test("the daily query budget does not become a full-history record limit", async () => {
  const history = Array.from({ length: 4097 }, (_, index) => fact({ id: `history-${index}`, localDate: "2020-01-01", recordId: `history-source-${index}` }));
  const result = await ledger({ facts: [...history, fact()] });
  assert.equal(result.facts.intake.factCount, 1);
});

test("never calculates Left even when target, intake, and burned facts are all known", async () => {
  const result = await ledger({ facts: [fact({ inputValue: "500" }), fact({ id: "burn", stream: "BURNED", inputValue: "120" })], targetVersions: [targetVersion()] });
  assert.deepEqual(result.left, {
    status: "POLICY_NOT_AUTHORIZED",
    exactKcal: null,
    policyId: null,
    policyVersion: null,
    roundingPolicy: "UNSPECIFIED",
  });
});

test("does not read the system clock and returns immutable copies", async () => {
  const originalNow = Date.now;
  Date.now = () => { throw new Error("system clock must not be read"); };
  try {
    const sourceFact = structuredClone(fact());
    const sourceTarget = targetVersion();
    const result = await ledger({ facts: [sourceFact], targetVersions: [sourceTarget] });
    sourceFact.energy.inputValue = "999";
    sourceTarget.target.inputValue = "999";
    assert.equal(result.facts.intake.facts[0].energy.inputValue, "100");
    assert.equal(result.facts.target.effectiveVersion.target.inputValue, "2000");
    assert.equal(Object.isFrozen(result), true);
    assert.throws(() => { result.left.status = "ALTERED"; }, TypeError);
  } finally {
    Date.now = originalNow;
  }
});

test("exposes no Left formula, target generator, AI, network, HealthKit, native, storage, mutation, or rounding capability", async () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  for (const pattern of [
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /HealthKit|UserNotifications/,
    /AsyncStorage|SQLite|SQLCipher/,
    /["']react-native(?:\/[^"']*)?["']/,
    /["']expo(?:\/[^"']*)?["']/,
    /Mifflin|NASEM|NIDDK|Atwater|4\/4\/9/,
    /target.*-.*intake|target.*-.*eaten|intake.*-.*burned/i,
    /(?:\bMath\.(?:round|floor|ceil)|\.toFixed)\s*\(/,
    /CREATE|UPDATE|DELETE|UPSERT|SAVE_TARGET/,
  ]) assert.doesNotMatch(source, pattern);
  const module = await import("./daily-energy-ledger-harness.mjs");
  for (const name of ["calculateLeft", "calculateTarget", "saveTarget", "updateTarget", "deleteTarget", "roundLedger"]) assert.equal(name in module, false);
});
