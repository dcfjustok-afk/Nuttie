import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  createBodyWeightEntryState,
  createInMemoryBodyWeightRepository,
  editBodyWeightDraft,
  executeBodyWeightMutation,
  normalizeBodyWeightRecord,
  requestBodyWeightMutation,
  retryBodyWeightMutation,
  reviewBodyWeightMutation,
  settleBodyWeightMutation,
  summarizeBodyWeightRecords,
} from "./body-weight-record-harness.mjs";

function draftRecord(id = "weight-1", inputValue = "63.4", inputUnit = "KG", recordedAt = "2026-08-12T08:30:00+08:00", localDate = "2026-08-12") {
  return { id, localDate, recordedAt, mass: { inputValue, inputUnit } };
}

function record(id = "weight-1", revision = 1, inputValue = "63.4", inputUnit = "KG", recordedAt = "2026-08-12T08:30:00+08:00", localDate = "2026-08-12") {
  const normalized = normalizeBodyWeightRecord({ schemaVersion: "BODY_WEIGHT_RECORD_V1", ...draftRecord(id, inputValue, inputUnit, recordedAt, localDate), revision });
  return normalized;
}

function requested({ records = [], draft = { kind: "UPSERT", expectedRevision: null, record: draftRecord() }, commandId = "weight-command-1" } = {}) {
  const reviewed = reviewBodyWeightMutation(createBodyWeightEntryState({ records, draft }));
  return requestBodyWeightMutation(reviewed, { commandId });
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function testFingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

test("starts empty without inventing a target, BMI, health judgment, daily merge, or network effect", () => {
  const state = createBodyWeightEntryState();
  assert.equal(state.status, "EDITING");
  assert.equal(state.baselineSummary.recordCount, 0);
  assert.equal(state.baselineSummary.currentRecord, null);
  for (const key of ["targetWeight", "bmi", "healthStatus", "dailyAverage", "healthKit", "networkEffect"]) {
    assert.equal(key in state, false);
  }
  assert.ok(Object.isFrozen(state));
});

test("preserves the entered decimal and derives exact kg and lb grams without display rounding", () => {
  const kg = record("kg", 1, "63.40", "KG");
  assert.equal(kg.mass.inputValue, "63.40");
  assert.deepEqual(kg.mass.exactGrams, { numerator: "63400", denominator: "1" });
  const lb = record("lb", 1, "1", "LB");
  assert.deepEqual(lb.mass.exactGrams, { numerator: "45359237", denominator: "100000" });
  assert.equal(lb.mass.conversion, "LB_EXACT_45359237_OVER_100000_GRAMS");
});

test("rejects numbers, zero, unsupported units, invalid dates, unknown versions and extra fields", () => {
  assert.throws(() => record("number", 1, 63.4), { code: "INVALID_WEIGHT_VALUE" });
  assert.throws(() => record("zero", 1, "0"), { code: "INVALID_WEIGHT_VALUE" });
  assert.throws(() => record("stone", 1, "10", "STONE"), { code: "UNSUPPORTED_WEIGHT_UNIT" });
  assert.throws(() => record("date", 1, "63", "KG", "2026-08-12T08:30:00", "2026-02-30"), { code: "INVALID_LOCAL_DATE" });
  assert.throws(() => record("instant", 1, "63", "KG", "2026-02-30T08:30:00+08:00", "2026-02-28"), { code: "INVALID_RECORDED_AT" });
  assert.throws(() => record("offset", 1, "63", "KG", "2026-08-12T08:30:00+24:00", "2026-08-12"), { code: "INVALID_RECORDED_AT" });
  assert.throws(() => record("mismatch", 1, "63", "KG", "2026-08-12T23:30:00-02:00", "2026-08-13"), { code: "WEIGHT_LOCAL_DATE_MISMATCH" });
  const future = { ...record(), schemaVersion: "BODY_WEIGHT_RECORD_V2" };
  assert.throws(() => normalizeBodyWeightRecord(future), { code: "UNSUPPORTED_WEIGHT_RECORD_VERSION" });
  const extra = { ...record(), bmi: 22 };
  assert.throws(() => normalizeBodyWeightRecord(extra), { code: "INVALID_WEIGHT_RECORD" });
});

test("keeps multiple same-day records and orders the current record by explicit instant then ID", () => {
  const summary = summarizeBodyWeightRecords([
    record("b", 1, "63.1", "KG", "2026-08-12T09:00:00+08:00"),
    record("a", 1, "63.4", "KG", "2026-08-12T09:00:00+08:00"),
    record("older", 1, "64", "KG", "2026-08-11T22:00:00+08:00", "2026-08-11"),
  ]);
  assert.equal(summary.recordCount, 3);
  assert.deepEqual(summary.points.map((point) => point.id), ["older", "a", "b"]);
  assert.equal(summary.currentRecord.id, "b");
  assert.equal("dailyAverage" in summary, false);
  assert.equal("deduplicatedPoints" in summary, false);
});

test("reviews a create with before and after current/trend evidence", () => {
  const reviewed = reviewBodyWeightMutation(createBodyWeightEntryState({
    records: [record("old", 1, "64", "KG", "2026-08-11T08:00:00+08:00", "2026-08-11")],
    draft: { kind: "UPSERT", expectedRevision: null, record: draftRecord() },
  }));
  assert.equal(reviewed.status, "REVIEW_READY");
  assert.equal(reviewed.preview.beforeSummary.currentRecord.id, "old");
  assert.equal(reviewed.preview.afterSummary.currentRecord.id, "weight-1");
  assert.equal(reviewed.preview.afterSummary.recordCount, 2);
});

test("keeps an invalid draft editable and creates no repository effect", () => {
  const reviewed = reviewBodyWeightMutation(createBodyWeightEntryState({
    draft: { kind: "UPSERT", expectedRevision: null, record: draftRecord("bad", "-1") },
  }));
  assert.equal(reviewed.status, "EDITING");
  assert.equal(reviewed.validationError.code, "INVALID_WEIGHT_VALUE");
  assert.throws(() => requestBodyWeightMutation(reviewed, { commandId: "bad-save" }), { code: "INVALID_TRANSITION" });
});

test("enters an observable saving state and suppresses duplicate taps", () => {
  const first = requested();
  assert.equal(first.state.status, "SAVING");
  assert.equal(first.effect.type, "APPLY_BODY_WEIGHT_MUTATION");
  const duplicate = requestBodyWeightMutation(first.state, { commandId: "other" });
  assert.equal(duplicate.effect, null);
  assert.deepEqual(duplicate.state, first.state);
});

test("commits a new record once and exposes an exact committed trend", async () => {
  const old = record("old", 1, "64", "KG", "2026-08-11T08:00:00+08:00", "2026-08-11");
  const repository = createInMemoryBodyWeightRepository({ records: [old] });
  const pending = requested({ records: [old] });
  const outcome = await executeBodyWeightMutation(repository, pending.effect);
  const saved = settleBodyWeightMutation(pending.state, outcome);
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.receipt.disposition, "COMMITTED");
  assert.equal(saved.committedSummary.recordCount, 2);
  assert.equal(saved.committedSummary.currentRecord.id, "weight-1");
  assert.equal(repository.snapshot().records.length, 2);
});

test("updates through revision CAS and recomputes current evidence", async () => {
  const existing = record("weight-1", 3, "63.4");
  const pending = requested({
    records: [existing],
    draft: { kind: "UPSERT", expectedRevision: 3, record: draftRecord("weight-1", "62.9") },
    commandId: "update-weight",
  });
  const repository = createInMemoryBodyWeightRepository({ records: [existing] });
  const saved = settleBodyWeightMutation(pending.state, await executeBodyWeightMutation(repository, pending.effect));
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.committedSummary.currentRecord.revision, 4);
  assert.equal(saved.committedSummary.currentRecord.mass.inputValue, "62.9");
});

test("deletes through revision CAS and recomputes the previous record as current", async () => {
  const older = record("older", 1, "64", "KG", "2026-08-11T08:00:00+08:00", "2026-08-11");
  const current = record("current", 2, "63.4");
  const pending = requested({ records: [older, current], draft: { kind: "DELETE", expectedRevision: 2, recordId: "current" }, commandId: "delete-current" });
  const repository = createInMemoryBodyWeightRepository({ records: [older, current] });
  const saved = settleBodyWeightMutation(pending.state, await executeBodyWeightMutation(repository, pending.effect));
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.committedSummary.recordCount, 1);
  assert.equal(saved.committedSummary.currentRecord.id, "older");
});

test("a pre-commit failure changes neither records nor idempotency", async () => {
  const repository = createInMemoryBodyWeightRepository({ failurePlan: ["BEFORE_COMMIT"] });
  const before = repository.snapshot();
  const pending = requested();
  const failed = settleBodyWeightMutation(pending.state, await executeBodyWeightMutation(repository, pending.effect));
  assert.equal(failed.status, "SAVE_FAILED");
  assert.equal(failed.saveError.outcome, "NOT_COMMITTED");
  assert.deepEqual(repository.snapshot().records, before.records);
  assert.deepEqual(repository.snapshot().idempotency, before.idempotency);
});

test("an unknown post-commit result converges by retrying the same immutable command", async () => {
  const repository = createInMemoryBodyWeightRepository({ failurePlan: ["AFTER_COMMIT"] });
  const pending = requested();
  const unknown = settleBodyWeightMutation(pending.state, await executeBodyWeightMutation(repository, pending.effect));
  assert.equal(unknown.saveError.outcome, "UNKNOWN");
  assert.throws(() => editBodyWeightDraft(unknown, { kind: "DELETE", expectedRevision: 1, recordId: "weight-1" }), { code: "COMMIT_OUTCOME_UNKNOWN" });
  const retry = retryBodyWeightMutation(unknown);
  assert.equal(retry.effect.fingerprint, pending.effect.fingerprint);
  assert.equal(retry.effect.attempt, 2);
  const saved = settleBodyWeightMutation(retry.state, await executeBodyWeightMutation(repository, retry.effect));
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.receipt.disposition, "REPLAYED");
  assert.equal(repository.snapshot().records.length, 1);
});

test("rejects command ID reuse with another payload without mutation", async () => {
  const repository = createInMemoryBodyWeightRepository();
  const first = requested({ commandId: "same-command" });
  await executeBodyWeightMutation(repository, first.effect);
  const second = requested({ draft: { kind: "UPSERT", expectedRevision: null, record: draftRecord("weight-2", "70") }, commandId: "same-command" });
  const conflict = await executeBodyWeightMutation(repository, second.effect);
  assert.equal(conflict.status, "FAILURE");
  assert.equal(conflict.error.code, "IDEMPOTENCY_CONFLICT");
  assert.deepEqual(repository.snapshot().records.map((item) => item.id), ["weight-1"]);
});

test("rejects stale revisions and duplicate create semantics without partial writes", async () => {
  const existing = record("weight-1", 2);
  const repository = createInMemoryBodyWeightRepository({ records: [existing] });
  const stale = requested({ records: [record("weight-1", 1)], draft: { kind: "UPSERT", expectedRevision: 1, record: draftRecord() }, commandId: "stale" });
  const staleOutcome = await executeBodyWeightMutation(repository, stale.effect);
  assert.equal(staleOutcome.error.code, "STALE_WEIGHT_REVISION");
  const duplicate = requested({ draft: { kind: "UPSERT", expectedRevision: null, record: draftRecord() }, commandId: "duplicate" });
  const duplicateOutcome = await executeBodyWeightMutation(repository, duplicate.effect);
  assert.equal(duplicateOutcome.error.code, "WEIGHT_RECORD_ALREADY_EXISTS");
  assert.equal(repository.snapshot().records[0].revision, 2);
});

test("rejects stale callbacks and forged success evidence", async () => {
  const other = record("other", 1, "70", "KG", "2026-08-11T08:00:00+08:00", "2026-08-11");
  const pending = requested({ records: [other] });
  const repository = createInMemoryBodyWeightRepository({ records: [other] });
  const valid = await executeBodyWeightMutation(repository, pending.effect);
  assert.throws(() => settleBodyWeightMutation(pending.state, { ...valid, attempt: 2 }), { code: "STALE_WEIGHT_OUTCOME" });
  const forged = structuredClone(valid);
  forged.receipt.records = forged.receipt.records.filter((candidate) => candidate.id !== "other");
  forged.receipt.recordsFingerprint = testFingerprint(forged.receipt.records);
  const failed = settleBodyWeightMutation(pending.state, forged);
  assert.equal(failed.status, "SAVE_FAILED");
  assert.equal(failed.saveError.outcome, "UNKNOWN");
  const forgedReview = structuredClone(reviewBodyWeightMutation(createBodyWeightEntryState({ draft: { kind: "UPSERT", expectedRevision: null, record: draftRecord() } })));
  forgedReview.preview.afterSummary.recordCount = 99;
  assert.throws(() => requestBodyWeightMutation(forgedReview, { commandId: "forged-review" }), { code: "INVALID_WEIGHT_STATE" });
  const forgedSaving = structuredClone(pending.state);
  forgedSaving.pendingFingerprint = "0".repeat(64);
  assert.throws(() => requestBodyWeightMutation(forgedSaving, { commandId: "ignored" }), { code: "INVALID_WEIGHT_STATE" });
  const forgedFailure = {
    status: "FAILURE",
    outcome: "UNKNOWN",
    commandId: pending.effect.command.commandId,
    fingerprint: pending.effect.fingerprint,
    attempt: 1,
    error: { code: "secret-looking error text" },
  };
  assert.throws(() => settleBodyWeightMutation(pending.state, forgedFailure), { code: "INVALID_WEIGHT_OUTCOME" });
  assert.throws(() => settleBodyWeightMutation(pending.state, { ...valid, extra: "not allowed" }), { code: "INVALID_WEIGHT_OUTCOME" });
  const saved = settleBodyWeightMutation(pending.state, valid);
  const forgedSaved = structuredClone(saved);
  forgedSaved.preview.beforeSummary.recordCount = 99;
  assert.throws(() => editBodyWeightDraft(forgedSaved, { kind: "DELETE", expectedRevision: 1, recordId: "weight-1" }), { code: "INVALID_WEIGHT_STATE" });
});

test("serializes concurrent same-command and competing-command mutations", async () => {
  const repository = createInMemoryBodyWeightRepository();
  const same = requested({ commandId: "concurrent-same" });
  const [first, replay] = await Promise.all([
    executeBodyWeightMutation(repository, same.effect),
    executeBodyWeightMutation(repository, same.effect),
  ]);
  assert.equal(first.status, "SUCCESS");
  assert.equal(replay.receipt.disposition, "REPLAYED");
  const updateA = requested({ records: repository.snapshot().records, draft: { kind: "UPSERT", expectedRevision: 1, record: draftRecord("weight-1", "62") }, commandId: "update-a" });
  const updateB = requested({ records: repository.snapshot().records, draft: { kind: "UPSERT", expectedRevision: 1, record: draftRecord("weight-1", "61") }, commandId: "update-b" });
  const outcomes = await Promise.all([executeBodyWeightMutation(repository, updateA.effect), executeBodyWeightMutation(repository, updateB.effect)]);
  assert.equal(outcomes.filter((outcome) => outcome.status === "SUCCESS").length, 1);
  assert.equal(outcomes.filter((outcome) => outcome.error?.code === "STALE_WEIGHT_REVISION").length, 1);
  assert.equal(repository.snapshot().records[0].revision, 2);
});

test("freezes and copies caller, repository, state, and receipt data", async () => {
  const mutable = draftRecord();
  const pending = requested({ draft: { kind: "UPSERT", expectedRevision: null, record: mutable } });
  mutable.mass.inputValue = "999";
  assert.equal(pending.effect.command.mutation.record.mass.inputValue, "63.4");
  const repository = createInMemoryBodyWeightRepository();
  const outcome = await executeBodyWeightMutation(repository, pending.effect);
  assert.throws(() => {
    outcome.receipt.records[0].mass.inputValue = "1";
  }, TypeError);
  assert.equal(repository.snapshot().records[0].mass.inputValue, "63.4");
  assert.ok(Object.isFrozen(outcome));
  assert.ok(Object.isFrozen(outcome.receipt.records[0]));
});

test("does not expose a network, HealthKit, BMI, target, anomaly, rounding, or daily-deduplication API", async () => {
  const module = await import("./body-weight-record-harness.mjs");
  const forbidden = ["fetch", "syncHealthKit", "calculateBMI", "setTargetWeight", "classifyAnomaly", "roundWeight", "mergeDailyRecords"];
  for (const name of forbidden) assert.equal(name in module, false);
});
