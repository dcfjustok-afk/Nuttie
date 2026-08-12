import assert from "node:assert/strict";
import test from "node:test";

import {
  createInMemoryManualBurnRepository,
  createManualBurnMutationEffect,
  normalizeManualBurnRecord,
  projectManualBurnEnergyFacts,
  retryManualBurnMutation,
  validateManualBurnReceipt,
} from "./manual-burn-record-harness.mjs";
import { createInMemoryEnergyFactRepository, readSevenDayEnergyTrend } from "./seven-day-energy-trend-harness.mjs";

function draft(id = "burn-1", inputValue = "120", inputUnit = "KCAL", recordedAt = "2026-08-12T18:00:00+08:00", localDate = "2026-08-12") {
  return { id, localDate, recordedAt, energy: { inputValue, inputUnit } };
}

function record(id = "burn-1", revision = 1, inputValue = "120", inputUnit = "KCAL", recordedAt = "2026-08-12T18:00:00+08:00", localDate = "2026-08-12") {
  return normalizeManualBurnRecord({ schemaVersion: "MANUAL_BURN_RECORD_V1", ...draft(id, inputValue, inputUnit, recordedAt, localDate), revision });
}

function effect({ commandId = "burn-command-1", mutation = { kind: "UPSERT", expectedRevision: null, record: draft() }, attempt = 1 } = {}) {
  return createManualBurnMutationEffect({ commandId, mutation, attempt });
}

test("preserves original kcal and kJ input with exact energy evidence", () => {
  assert.deepEqual(record().energy.exactKcal, { numerator: "120", denominator: "1" });
  const kj = record("kj", 1, "4.184", "KJ");
  assert.equal(kj.energy.inputValue, "4.184");
  assert.equal(kj.energy.inputUnit, "KJ");
  assert.deepEqual(kj.energy.exactKcal, { numerator: "1", denominator: "1" });
});

test("rejects invalid dates, offsets, units, revisions, and unapproved exercise fields", () => {
  assert.throws(() => record("bad", 1, "1", "CAL"), { code: "UNSUPPORTED_ENERGY_UNIT" });
  assert.throws(() => record("bad", 0), { code: "INVALID_MANUAL_BURN_RECORD" });
  assert.throws(() => record("bad", 1, "1", "KCAL", "2026-02-30T18:00:00+08:00", "2026-02-28"), { code: "INVALID_RECORDED_AT" });
  assert.throws(() => record("bad", 1, "1", "KCAL", "2026-08-12T18:00:00", "2026-08-12"), { code: "INVALID_RECORDED_AT" });
  assert.throws(() => record("bad", 1, "1", "KCAL", "2026-08-12T23:00:00-02:00", "2026-08-13"), { code: "MANUAL_BURN_LOCAL_DATE_MISMATCH" });
  assert.throws(() => normalizeManualBurnRecord({ ...record(), durationMinutes: 30 }), { code: "INVALID_MANUAL_BURN_RECORD" });
});

test("projects only explicit USER_ENTERED MANUAL_BURN facts for the F11 read model", () => {
  const facts = projectManualBurnEnergyFacts([record("a", 3)]);
  assert.equal(facts[0].stream, "BURNED");
  assert.deepEqual(facts[0].source, { kind: "MANUAL_BURN", recordId: "a", revision: 3, quality: "USER_ENTERED" });
  assert.equal("exerciseType" in facts[0], false);
  assert.equal("formula" in facts[0], false);
});

test("creates a manual burn once and validates complete transaction evidence", async () => {
  const repository = createInMemoryManualBurnRepository();
  const command = effect();
  const outcome = await repository.execute(command);
  const receipt = validateManualBurnReceipt({ baselineRecords: [], effect: command, outcome });
  assert.equal(receipt.disposition, "COMMITTED");
  assert.equal(receipt.records[0].revision, 1);
  assert.deepEqual(receipt.energyFacts, repository.snapshot().energyFacts);
});

test("updates through revision CAS and refreshes the projected source revision", async () => {
  const existing = record("burn-1", 2, "100");
  const repository = createInMemoryManualBurnRepository({ records: [existing] });
  const command = effect({ mutation: { kind: "UPSERT", expectedRevision: 2, record: draft("burn-1", "150") } });
  const outcome = await repository.execute(command);
  validateManualBurnReceipt({ baselineRecords: [existing], effect: command, outcome });
  assert.equal(repository.snapshot().records[0].revision, 3);
  assert.equal(repository.snapshot().energyFacts[0].source.revision, 3);
});

test("deletes through revision CAS and removes the projected F11 fact", async () => {
  const existing = record();
  const repository = createInMemoryManualBurnRepository({ records: [existing] });
  const command = effect({ mutation: { kind: "DELETE", expectedRevision: 1, recordId: "burn-1" } });
  const outcome = await repository.execute(command);
  validateManualBurnReceipt({ baselineRecords: [existing], effect: command, outcome });
  assert.deepEqual(repository.snapshot().records, []);
  assert.deepEqual(repository.snapshot().energyFacts, []);
});

test("pre-commit failure and stale CAS leave records and idempotency unchanged", async () => {
  const existing = record("burn-1", 2);
  const repository = createInMemoryManualBurnRepository({ records: [existing], failurePlan: ["BEFORE_COMMIT"] });
  const failed = await repository.execute(effect());
  assert.equal(failed.commitState, "NOT_COMMITTED");
  assert.equal(repository.snapshot().idempotencyCount, 0);
  const stale = await repository.execute(effect({ commandId: "stale", mutation: { kind: "UPSERT", expectedRevision: 1, record: draft() } }));
  assert.equal(stale.error.code, "STALE_MANUAL_BURN_REVISION");
  assert.equal(repository.snapshot().records[0].revision, 2);
});

test("post-commit response loss converges by replaying the same immutable command", async () => {
  const repository = createInMemoryManualBurnRepository({ failurePlan: ["AFTER_COMMIT"] });
  const first = effect();
  const unknown = await repository.execute(first);
  assert.equal(unknown.commitState, "UNKNOWN");
  const retry = retryManualBurnMutation(first);
  const replay = await repository.execute(retry);
  assert.equal(replay.receipt.disposition, "REPLAYED");
  validateManualBurnReceipt({ baselineRecords: [], effect: retry, outcome: replay });
  assert.equal(repository.snapshot().records.length, 1);
});

test("rejects idempotency-key reuse with another payload without mutation", async () => {
  const repository = createInMemoryManualBurnRepository();
  await repository.execute(effect());
  const conflict = await repository.execute(effect({ mutation: { kind: "UPSERT", expectedRevision: null, record: draft("other") } }));
  assert.equal(conflict.error.code, "IDEMPOTENCY_CONFLICT");
  assert.equal(repository.snapshot().records.length, 1);
});

test("serializes duplicate and competing concurrent commands", async () => {
  const repository = createInMemoryManualBurnRepository();
  const same = effect();
  const [committed, replayed] = await Promise.all([repository.execute(same), repository.execute(same)]);
  assert.equal(committed.receipt.disposition, "COMMITTED");
  assert.equal(replayed.receipt.disposition, "REPLAYED");
  const a = effect({ commandId: "update-a", mutation: { kind: "UPSERT", expectedRevision: 1, record: draft("burn-1", "140") } });
  const b = effect({ commandId: "update-b", mutation: { kind: "UPSERT", expectedRevision: 1, record: draft("burn-1", "160") } });
  const outcomes = await Promise.all([repository.execute(a), repository.execute(b)]);
  assert.equal(outcomes.filter(({ status }) => status === "SUCCESS").length, 1);
  assert.equal(repository.snapshot().records[0].revision, 2);
});

test("rejects forged effects and transaction receipts", async () => {
  const repository = createInMemoryManualBurnRepository();
  const command = effect();
  const outcome = await repository.execute(command);
  const forgedEffect = structuredClone(command);
  forgedEffect.command.mutation.record.energy.inputValue = "999";
  await assert.rejects(repository.execute(forgedEffect));
  const forgedOutcome = structuredClone(outcome);
  forgedOutcome.receipt.records = [];
  assert.throws(() => validateManualBurnReceipt({ baselineRecords: [], effect: command, outcome: forgedOutcome }), { code: "INVALID_MANUAL_BURN_OUTCOME" });
});

test("copies and freezes record, repository, receipt, and projected fact data", async () => {
  const mutable = structuredClone(record());
  const repository = createInMemoryManualBurnRepository({ records: [mutable] });
  mutable.energy.inputValue = "999";
  const command = effect({ commandId: "delete", mutation: { kind: "DELETE", expectedRevision: 1, recordId: "burn-1" } });
  const outcome = await repository.execute(command);
  assert.equal(outcome.receipt.beforeRecord.energy.inputValue, "120");
  assert.ok(Object.isFrozen(outcome.receipt));
  assert.throws(() => { outcome.receipt.beforeRecord.id = "other"; }, TypeError);
});

test("feeds the F11 seven-day burned stream without AI, network, HealthKit, steps, or a burn formula", async () => {
  const manualFacts = projectManualBurnEnergyFacts([record("one", 1, "120"), record("two", 1, "30")]);
  const trend = await readSevenDayEnergyTrend(createInMemoryEnergyFactRepository({ facts: manualFacts }), "2026-08-12");
  assert.deepEqual(trend.days.at(-1).burned.exactKcal, { numerator: "150", denominator: "1" });
  const module = await import("./manual-burn-record-harness.mjs");
  for (const key of ["calculateBurn", "estimateBurn", "healthKit", "steps", "networkRequest", "sendToAI", "exerciseTypeDefaults"]) assert.equal(key in module, false);
});
