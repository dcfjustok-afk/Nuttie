import test from "node:test";
import assert from "node:assert/strict";

import * as waterContract from "./water-record-harness.mjs";

const {
  MUTATIONS,
  createInMemoryWaterRepository,
  createWaterMutationEffect,
  normalizeWaterRecord,
  retryWaterMutation,
  summarizeWaterRecordsForLocalDate,
  validateWaterReceipt,
} = waterContract;

function unit({ definitionId = "METRIC_VOLUME_V1", unitId = "ML", baseUnitId = "ML", numerator = "1", denominator = "1" } = {}) {
  return { definitionId, unitId, baseUnitId, toBaseNumerator: numerator, toBaseDenominator: denominator };
}

function draft(id, value = "250", options = {}) {
  return {
    id,
    localDate: options.localDate ?? "2026-08-12",
    recordedAt: options.recordedAt ?? "2026-08-12T08:30:00+08:00",
    volume: { value, unit: options.unit ?? unit() },
  };
}

function record(id, value = "250", options = {}) {
  const input = draft(id, value, options);
  return normalizeWaterRecord({ schemaVersion: "WATER_RECORD_V1", ...input, revision: options.revision ?? 1 });
}

function upsertEffect(commandId, waterDraft, expectedRevision = null) {
  return createWaterMutationEffect({
    commandId,
    mutation: { kind: MUTATIONS.UPSERT, expectedRevision, record: waterDraft },
  });
}

test("preserves the original decimal and caller-supplied unit definition as an exact conversion snapshot", () => {
  const normalized = record("water-1", "1.250", {
    unit: unit({ unitId: "L", numerator: "1000" }),
  });

  assert.deepEqual(normalized.volume, {
    schemaVersion: "WATER_VOLUME_V1",
    originalValue: "1.250",
    definitionId: "METRIC_VOLUME_V1",
    unitId: "L",
    baseUnitId: "ML",
    toBase: { numerator: "1000", denominator: "1" },
    exactBase: { numerator: "1250", denominator: "1" },
  });
  assert.equal(Object.isFrozen(normalized.volume), true);
});

test("rejects zero, signed/exponent values, invalid base conversion, forged derived values, and unknown fields", () => {
  for (const value of ["0", "-1", "+1", "1e3", "01", "NaN"]) {
    assert.throws(() => record(`bad-${value.replace(/\W/g, "x")}`, value), { code: "INVALID_WATER_VOLUME" });
  }
  assert.throws(() => record("bad-base", "1", { unit: unit({ numerator: "2" }) }), { code: "INVALID_WATER_VOLUME" });
  assert.throws(() => normalizeWaterRecord({
    schemaVersion: "WATER_RECORD_V1",
    id: "forged",
    localDate: "2026-08-12",
    recordedAt: "2026-08-12T09:00:00+08:00",
    revision: 1,
    volume: {
      schemaVersion: "WATER_VOLUME_V1",
      originalValue: "250",
      definitionId: "METRIC_VOLUME_V1",
      unitId: "ML",
      baseUnitId: "ML",
      toBase: { numerator: "1", denominator: "1" },
      exactBase: { numerator: "251", denominator: "1" },
    },
  }), { code: "INVALID_WATER_VOLUME" });
  assert.throws(() => normalizeWaterRecord({ ...record("known"), goal: "2000" }), { code: "INVALID_WATER_RECORD" });
});

test("requires a real local calendar date and a matching ISO instant with explicit offset", () => {
  assert.throws(() => record("bad-date", "250", { localDate: "2026-02-30", recordedAt: "2026-02-30T08:00:00+08:00" }), { code: "INVALID_LOCAL_DATE" });
  assert.throws(() => record("no-offset", "250", { recordedAt: "2026-08-12T08:00:00" }), { code: "INVALID_RECORDED_AT" });
  assert.throws(() => record("wrong-day", "250", { localDate: "2026-08-11" }), { code: "WATER_LOCAL_DATE_MISMATCH" });
});

test("summarizes only the requested local date and adds compatible units exactly", () => {
  const records = [
    record("ml", "250"),
    record("litre", "1.25", { recordedAt: "2026-08-12T09:30:00+08:00", unit: unit({ unitId: "L", numerator: "1000" }) }),
    record("other-day", "999", { localDate: "2026-08-11", recordedAt: "2026-08-11T23:00:00+08:00" }),
  ];
  const summary = summarizeWaterRecordsForLocalDate(records, "2026-08-12");

  assert.equal(summary.status, "RECORDED");
  assert.equal(summary.recordCount, 2);
  assert.deepEqual(summary.totals[0].exactBaseTotal, { numerator: "1500", denominator: "1" });
  assert.deepEqual(summary.totals[0].sources.map((source) => source.recordId), ["ml", "litre"]);
  assert.equal(Object.hasOwn(summary, "goal"), false);
});

test("returns an explicit empty daily summary without inventing a goal, progress, or zero-valued record", () => {
  assert.deepEqual(summarizeWaterRecordsForLocalDate([], "2026-08-12"), {
    schemaVersion: "WATER_DAILY_SUMMARY_V1",
    localDate: "2026-08-12",
    status: "EMPTY",
    recordCount: 0,
    totals: [],
  });
});

test("keeps incompatible measurement definitions in separate totals instead of silently converting them", () => {
  const summary = summarizeWaterRecordsForLocalDate([
    record("metric", "250"),
    record("custom", "2", { recordedAt: "2026-08-12T09:00:00+08:00", unit: unit({ definitionId: "OWNER_DEFINED_CUP_V1", unitId: "CUP", baseUnitId: "CUP" }) }),
  ], "2026-08-12");

  assert.equal(summary.totals.length, 2);
  assert.deepEqual(summary.totals.map(({ definitionId, exactBaseTotal }) => ({ definitionId, exactBaseTotal })), [
    { definitionId: "METRIC_VOLUME_V1", exactBaseTotal: { numerator: "250", denominator: "1" } },
    { definitionId: "OWNER_DEFINED_CUP_V1", exactBaseTotal: { numerator: "2", denominator: "1" } },
  ]);
});

test("rejects conflicting conversion factors for the same versioned unit definition", () => {
  const records = [
    record("litre-a", "1", { unit: unit({ unitId: "L", numerator: "1000" }) }),
    record("litre-b", "1", { recordedAt: "2026-08-12T09:00:00+08:00", unit: unit({ unitId: "L", numerator: "999" }) }),
  ];
  assert.throws(() => summarizeWaterRecordsForLocalDate(records, "2026-08-12"), { code: "INCONSISTENT_VOLUME_DEFINITION" });
});

test("create commits a complete immutable record set and bound daily summary receipt", async () => {
  const baseline = [record("existing", "100", { recordedAt: "2026-08-12T07:00:00+08:00" })];
  const effect = upsertEffect("water-create", draft("new", "250"));
  const repository = createInMemoryWaterRepository({ records: baseline });
  const outcome = await repository.execute(effect);
  const receipt = validateWaterReceipt({ baselineRecords: baseline, effect, outcome });

  assert.equal(receipt.disposition, "COMMITTED");
  assert.equal(receipt.records.length, 2);
  assert.equal(receipt.dailySummaries[0].recordCount, 2);
  assert.deepEqual(receipt.dailySummaries[0].totals[0].exactBaseTotal, { numerator: "350", denominator: "1" });
  assert.equal(Object.isFrozen(outcome), true);
});

test("moving a record to another local date returns recomputed summaries for both dates", async () => {
  const baseline = [record("move", "300")];
  const effect = upsertEffect("water-move", draft("move", "500", {
    localDate: "2026-08-13",
    recordedAt: "2026-08-13T08:30:00+08:00",
  }), 1);
  const repository = createInMemoryWaterRepository({ records: baseline });
  const outcome = await repository.execute(effect);
  const receipt = validateWaterReceipt({ baselineRecords: baseline, effect, outcome });

  assert.equal(receipt.afterRecord.revision, 2);
  assert.deepEqual(receipt.affectedLocalDates, ["2026-08-12", "2026-08-13"]);
  assert.deepEqual(receipt.dailySummaries.map(({ localDate, status, recordCount }) => ({ localDate, status, recordCount })), [
    { localDate: "2026-08-12", status: "EMPTY", recordCount: 0 },
    { localDate: "2026-08-13", status: "RECORDED", recordCount: 1 },
  ]);
});

test("delete uses revision CAS and returns an explicit empty summary", async () => {
  const baseline = [record("delete-me", "300", { revision: 3 })];
  const effect = createWaterMutationEffect({ commandId: "water-delete", mutation: { kind: MUTATIONS.DELETE, recordId: "delete-me", expectedRevision: 3 } });
  const repository = createInMemoryWaterRepository({ records: baseline });
  const outcome = await repository.execute(effect);
  const receipt = validateWaterReceipt({ baselineRecords: baseline, effect, outcome });

  assert.equal(receipt.afterRecord, null);
  assert.deepEqual(receipt.records, []);
  assert.equal(receipt.dailySummaries[0].status, "EMPTY");
  assert.equal(receipt.dailySummaries[0].recordCount, 0);
});

test("stale updates fail without changing the repository", async () => {
  const baseline = [record("stale", "200", { revision: 2 })];
  const repository = createInMemoryWaterRepository({ records: baseline });
  const outcome = await repository.execute(upsertEffect("stale-command", draft("stale", "300"), 1));

  assert.equal(outcome.status, "FAILURE");
  assert.equal(outcome.commitState, "NOT_COMMITTED");
  assert.equal(outcome.error.code, "STALE_WATER_REVISION");
  assert.deepEqual(repository.snapshot().records, baseline);
});

test("a pre-commit failure is retryable and does not reserve the command", async () => {
  const repository = createInMemoryWaterRepository({ failurePlan: ["BEFORE_COMMIT"] });
  const effect = upsertEffect("precommit", draft("precommit-record", "250"));
  const failed = await repository.execute(effect);
  const retriedEffect = retryWaterMutation(effect);
  const recovered = await repository.execute(retriedEffect);

  assert.equal(failed.commitState, "NOT_COMMITTED");
  assert.equal(recovered.status, "SUCCESS");
  assert.equal(recovered.receipt.disposition, "COMMITTED");
  assert.equal(repository.snapshot().records.length, 1);
});

test("an unknown post-commit result replays the same mutation without double-counting", async () => {
  const repository = createInMemoryWaterRepository({ failurePlan: ["AFTER_COMMIT"] });
  const effect = upsertEffect("unknown", draft("unknown-record", "250"));
  const failed = await repository.execute(effect);
  const retriedEffect = retryWaterMutation(effect);
  const recovered = await repository.execute(retriedEffect);

  assert.equal(failed.commitState, "UNKNOWN");
  assert.equal(recovered.receipt.disposition, "REPLAYED");
  assert.equal(recovered.receipt.records.length, 1);
  assert.deepEqual(recovered.receipt.dailySummaries[0].totals[0].exactBaseTotal, { numerator: "250", denominator: "1" });
  assert.equal(repository.snapshot().idempotencyCount, 1);
});

test("command IDs bind immutable payloads and concurrent updates serialize to one winner", async () => {
  const baseline = [record("race", "200")];
  const repository = createInMemoryWaterRepository({ records: baseline });
  const first = upsertEffect("shared-command", draft("race", "300"), 1);
  const conflicting = upsertEffect("shared-command", draft("race", "400"), 1);
  const [firstOutcome, conflictOutcome] = await Promise.all([repository.execute(first), repository.execute(conflicting)]);

  assert.equal(firstOutcome.status, "SUCCESS");
  assert.equal(conflictOutcome.status, "FAILURE");
  assert.equal(conflictOutcome.error.code, "IDEMPOTENCY_CONFLICT");

  const raceRepository = createInMemoryWaterRepository({ records: baseline });
  const [left, right] = await Promise.all([
    raceRepository.execute(upsertEffect("race-left", draft("race", "500"), 1)),
    raceRepository.execute(upsertEffect("race-right", draft("race", "600"), 1)),
  ]);
  assert.deepEqual([left.status, right.status].sort(), ["FAILURE", "SUCCESS"]);
  assert.equal([left, right].find((outcome) => outcome.status === "FAILURE").error.code, "STALE_WATER_REVISION");
});

test("rejects forged effects and incomplete or forged transaction receipts", async () => {
  const effect = upsertEffect("forgery", draft("forgery-record", "250"));
  assert.throws(() => retryWaterMutation({ ...effect, fingerprint: "0".repeat(64) }), { code: "INVALID_WATER_COMMAND" });

  const repository = createInMemoryWaterRepository();
  const outcome = await repository.execute(effect);
  const incomplete = structuredClone(outcome);
  incomplete.receipt.records = [];
  assert.throws(() => validateWaterReceipt({ baselineRecords: [], effect, outcome: incomplete }), { code: "INVALID_WATER_OUTCOME" });
  const forgedSummary = structuredClone(outcome);
  forgedSummary.receipt.dailySummaries[0].recordCount = 99;
  assert.throws(() => validateWaterReceipt({ baselineRecords: [], effect, outcome: forgedSummary }), { code: "INVALID_WATER_OUTCOME" });
});

test("snapshots inputs and exposes no target, quick-add, undo, trend, network, AI, or HealthKit API", async () => {
  const mutable = draft("immutable", "250");
  const effect = upsertEffect("immutable-command", mutable);
  mutable.volume.value = "999";
  mutable.volume.unit.toBaseNumerator = "999";
  const repository = createInMemoryWaterRepository();
  await repository.execute(effect);
  assert.equal(repository.snapshot().records[0].volume.originalValue, "250");

  const exported = Object.keys(waterContract).join(" ").toLowerCase();
  for (const forbidden of ["goal", "target", "quick", "preset", "undo", "trend", "network", "healthkit", "ai"]) {
    assert.equal(exported.includes(forbidden), false, `unexpected public API: ${forbidden}`);
  }
});
