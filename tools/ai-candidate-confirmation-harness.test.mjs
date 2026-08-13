import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createAiCandidateConfirmationState,
  createInMemoryAiConfirmedRecordRepository,
  editAiCandidate,
  executeAiCandidateSave,
  receiveAiCandidateResponse,
  recordAiTransportFailure,
  requestAiCandidateSave,
  retryAiCandidateSave,
  returnToManualDraft,
  reviewAiCandidate,
  settleAiCandidateSave,
} from "./ai-candidate-confirmation-harness.mjs";

const hash = "a".repeat(64);
const definitionHash = "b".repeat(64);

function context(overrides = {}) {
  return {
    schemaVersion: "AI_REQUEST_CONTEXT_V1",
    requestId: "request-1",
    origin: "https://ai.example.test",
    model: "model-1",
    payloadClass: "meal-text",
    transportProfileVersion: "transport-1",
    policyProfileVersion: "policy-1",
    policyEvidenceFingerprint: hash,
    ...overrides,
  };
}

function localInput(overrides = {}) {
  return {
    schemaVersion: "LOCAL_AI_INPUT_V1",
    inputKind: "TEXT",
    draft: "燕麦和牛奶",
    ...overrides,
  };
}

function response(overrides = {}) {
  return JSON.stringify({
    schemaVersion: 1,
    candidates: [
      {
        label: "燕麦牛奶",
        nutrients: {
          energyKcal: 280,
          proteinG: 11,
          carbohydrateG: 43,
          fatG: 8,
          fiberG: 5,
          sugarG: null,
          sodiumMg: 150,
        },
        confidence: 0.82,
      },
    ],
    ...overrides,
  });
}

function confirmedValue(overrides = {}) {
  return {
    schemaVersion: "AI_CONFIRMED_VALUE_V1",
    definitionId: "meal-draft",
    definitionVersion: "v1",
    definitionFingerprint: definitionHash,
    payload: { label: "燕麦牛奶（已确认）", servingText: "1 碗" },
    ...overrides,
  };
}

function reviewedState() {
  const initial = createAiCandidateConfirmationState({ localInput: localInput(), context: context() });
  const editing = receiveAiCandidateResponse(initial, response());
  return reviewAiCandidate(editAiCandidate(editing, { candidateIndex: 0, confirmedValue: confirmedValue() }));
}

function savingState(options = {}) {
  return requestAiCandidateSave(reviewedState(), {
    commandId: options.commandId ?? "command-1",
    recordId: options.recordId ?? "record-1",
  });
}

test("starts with one volatile local draft and no persistence effect", () => {
  const input = localInput();
  const state = createAiCandidateConfirmationState({ localInput: input, context: context() });
  input.draft = "changed";
  assert.equal(state.status, "AWAITING_RESPONSE");
  assert.equal(state.retention, "VOLATILE_APPLICATION_STATE_ONLY");
  assert.equal(state.localInput.draft, "燕麦和牛奶");
  assert.equal(state.pendingCommand, null);
  assert.equal(state.committedRecord, null);
  assert.equal(Object.isFrozen(state.localInput), true);
});

test("rejects unsafe request contexts, secrets, special objects, cycles, and resource abuse", () => {
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: null, context: context() }),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE" },
  );
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: localInput(), context: context({ origin: "http://ai.example.test" }) }),
    { code: "INVALID_AI_REQUEST_CONTEXT" },
  );
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: localInput({ apiKey: "secret" }), context: context() }),
    { code: "AI_DRAFT_SECRET_FIELD" },
  );
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: localInput({ clientSecret: "secret" }), context: context() }),
    { code: "AI_DRAFT_SECRET_FIELD" },
  );
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: new Date(), context: context() }),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE" },
  );
  const accessorInput = localInput();
  Object.defineProperty(accessorInput, "computed", { enumerable: true, get: () => "value" });
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: accessorInput, context: context() }),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE" },
  );
  const cyclic = localInput();
  cyclic.self = cyclic;
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: cyclic, context: context() }),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE" },
  );
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: localInput({ draft: "x".repeat(5000) }), context: context() }),
    { code: "AI_DRAFT_RESOURCE_LIMIT" },
  );
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: { values: Array(257).fill(null) }, context: context() }),
    { code: "AI_DRAFT_RESOURCE_LIMIT" },
  );
  const arrayWithProperty = ["draft"];
  arrayWithProperty.authorization = "secret";
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: { values: arrayWithProperty }, context: context() }),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE" },
  );
  const arrayWithAccessor = ["draft"];
  Object.defineProperty(arrayWithAccessor, "0", { enumerable: true, get: () => "value" });
  assert.throws(
    () => createAiCandidateConfirmationState({ localInput: { values: arrayWithAccessor }, context: context() }),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE" },
  );
});

test("transport failure preserves the exact local input and creates no candidate", () => {
  const initial = createAiCandidateConfirmationState({ localInput: localInput(), context: context() });
  const failed = recordAiTransportFailure(initial, "TRANSPORT_TIMEOUT");
  assert.equal(failed.status, "AWAITING_RESPONSE");
  assert.deepEqual(failed.localInput, initial.localInput);
  assert.deepEqual(failed.responseError, { code: "TRANSPORT_TIMEOUT" });
  assert.equal(failed.candidates, null);
  assert.equal(failed.pendingCommand, null);
});

test("validates a response into editable candidates while malformed responses preserve the draft", () => {
  const initial = createAiCandidateConfirmationState({ localInput: localInput(), context: context() });
  const invalid = receiveAiCandidateResponse(initial, JSON.stringify({ schemaVersion: 1, candidates: [], extra: true }));
  assert.equal(invalid.status, "AWAITING_RESPONSE");
  assert.equal(invalid.responseError.code, "RESPONSE_UNKNOWN_FIELD");
  assert.deepEqual(invalid.localInput, initial.localInput);
  const editing = receiveAiCandidateResponse(invalid, response());
  assert.equal(editing.status, "EDITING");
  assert.equal(editing.candidates[0].label, "燕麦牛奶");
  assert.equal(editing.pendingCommand, null);
});

test("binds one selected candidate to a caller-owned confirmed value and explicit review", () => {
  const initial = createAiCandidateConfirmationState({ localInput: localInput(), context: context() });
  const editing = receiveAiCandidateResponse(initial, response());
  const selected = editAiCandidate(editing, { candidateIndex: 0, confirmedValue: confirmedValue() });
  assert.equal(selected.status, "EDITING");
  assert.equal(selected.confirmedValue.payload.label, "燕麦牛奶（已确认）");
  const reviewed = reviewAiCandidate(selected);
  assert.equal(reviewed.status, "REVIEW_READY");
  assert.match(reviewed.reviewEvidence.candidateFingerprint, /^[a-f0-9]{64}$/);
  assert.match(reviewed.reviewEvidence.requestContextFingerprint, /^[a-f0-9]{64}$/);
  assert.match(reviewed.reviewEvidence.reviewFingerprint, /^[a-f0-9]{64}$/);
});

test("rejects missing candidates and unsafe caller-owned confirmed values", () => {
  const initial = createAiCandidateConfirmationState({ localInput: localInput(), context: context() });
  const empty = receiveAiCandidateResponse(initial, response({ candidates: [] }));
  assert.equal(empty.status, "AWAITING_RESPONSE");
  assert.deepEqual(empty.responseError, { code: "RESPONSE_CANDIDATE_COUNT_INVALID" });
  assert.throws(() => editAiCandidate(empty, { candidateIndex: 0, confirmedValue: confirmedValue() }), { code: "INVALID_AI_CANDIDATE_TRANSITION" });
  const editing = receiveAiCandidateResponse(initial, response());
  assert.throws(
    () => editAiCandidate(editing, {
      candidateIndex: 0,
      confirmedValue: confirmedValue({ payload: { authorization: "secret" } }),
    }),
    { code: "AI_DRAFT_SECRET_FIELD" },
  );
  assert.throws(() => reviewAiCandidate(editing), { code: "AI_CANDIDATE_REVIEW_REQUIRED" });
});

test("editing after review invalidates old review and save context", () => {
  const reviewed = reviewedState();
  const edited = editAiCandidate(reviewed, {
    candidateIndex: 0,
    confirmedValue: confirmedValue({ payload: { label: "再次编辑" } }),
  });
  assert.equal(edited.status, "EDITING");
  assert.equal(edited.reviewEvidence, null);
  assert.equal(edited.pendingCommand, null);
  assert.throws(() => requestAiCandidateSave(edited, { commandId: "command-1", recordId: "record-1" }), {
    code: "AI_CANDIDATE_REVIEW_REQUIRED",
  });
});

test("creates one observable save effect without raw local input or candidate content", () => {
  const { state, effect } = savingState();
  assert.equal(state.status, "SAVING");
  assert.equal(effect.type, "SAVE_AI_CONFIRMED_RECORD");
  assert.equal(effect.command.record.sourceEvidence.sourceKind, "AI_ASSISTED_USER_CONFIRMED");
  assert.equal(effect.command.record.sourceEvidence.origin, "https://ai.example.test");
  const serialized = JSON.stringify(effect);
  assert.equal(serialized.includes("燕麦和牛奶"), false);
  assert.equal(serialized.includes("燕麦牛奶\""), false);
  assert.equal(serialized.includes("confidence"), false);
  assert.equal(serialized.includes("AI_CONFIRMED_VALUE_V1"), true);
  const duplicate = requestAiCandidateSave(state, { commandId: "other", recordId: "other" });
  assert.equal(duplicate.effect, null);
  assert.deepEqual(duplicate.state, state);
});

test("commits a user-confirmed value once with request and policy traceability", async () => {
  const { state, effect } = savingState();
  const repository = createInMemoryAiConfirmedRecordRepository();
  const outcome = await executeAiCandidateSave(repository, effect);
  const saved = settleAiCandidateSave(state, outcome);
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.receipt.disposition, "COMMITTED");
  assert.equal(saved.committedRecord.recordId, "record-1");
  assert.equal(saved.committedRecord.sourceEvidence.policyEvidenceFingerprint, hash);
  assert.equal(
    saved.committedRecord.sourceEvidence.requestContextFingerprint,
    reviewedState().reviewEvidence.requestContextFingerprint,
  );
  assert.equal(saved.committedRecord.confirmedValue.payload.label, "燕麦牛奶（已确认）");
  assert.deepEqual(repository.inspect().commandIds, ["command-1"]);
});

test("pre-commit failure leaves both repository collections empty", async () => {
  const { state, effect } = savingState();
  const repository = createInMemoryAiConfirmedRecordRepository({ faultPlan: ["BEFORE_COMMIT"] });
  const failed = settleAiCandidateSave(state, await executeAiCandidateSave(repository, effect));
  assert.equal(failed.status, "SAVE_FAILED");
  assert.equal(failed.saveError.outcome, "NOT_COMMITTED");
  assert.deepEqual(repository.inspect(), { records: [], commandIds: [] });
  const manual = returnToManualDraft(failed);
  assert.equal(manual.status, "MANUAL_DRAFT");
  assert.deepEqual(manual.localInput, state.localInput);
});

test("unknown post-commit result converges only by replaying the same immutable command", async () => {
  const { state, effect } = savingState();
  const repository = createInMemoryAiConfirmedRecordRepository({ faultPlan: ["AFTER_COMMIT"] });
  const failed = settleAiCandidateSave(state, await executeAiCandidateSave(repository, effect));
  assert.equal(failed.saveError.outcome, "UNKNOWN");
  assert.throws(() => returnToManualDraft(failed), { code: "AI_CANDIDATE_COMMIT_OUTCOME_UNKNOWN" });
  const retry = retryAiCandidateSave(failed);
  assert.deepEqual(retry.effect.command, effect.command);
  assert.equal(retry.effect.attempt, 2);
  const saved = settleAiCandidateSave(retry.state, await executeAiCandidateSave(repository, retry.effect));
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.receipt.disposition, "REPLAYED");
  assert.equal(repository.inspect().records.length, 1);
});

test("post-receipt readback failure is unknown even if the adapter claims not committed", async () => {
  const { state, effect } = savingState();
  const repository = createInMemoryAiConfirmedRecordRepository({ faultPlan: [null, "READBACK"] });
  const failed = settleAiCandidateSave(state, await executeAiCandidateSave(repository, effect));
  assert.equal(failed.status, "SAVE_FAILED");
  assert.equal(failed.saveError.outcome, "UNKNOWN");
  assert.equal(repository.inspect().records.length, 1);
});

test("rejects command ID reuse and duplicate record IDs without partial writes", async () => {
  const first = savingState();
  const repository = createInMemoryAiConfirmedRecordRepository();
  settleAiCandidateSave(first.state, await executeAiCandidateSave(repository, first.effect));

  const reused = savingState({ commandId: "command-1", recordId: "record-2" });
  const reusedFailure = settleAiCandidateSave(reused.state, await executeAiCandidateSave(repository, reused.effect));
  assert.equal(reusedFailure.saveError.code, "AI_CONFIRMED_RECORD_IDEMPOTENCY_CONFLICT");

  const duplicate = savingState({ commandId: "command-2", recordId: "record-1" });
  const duplicateFailure = settleAiCandidateSave(duplicate.state, await executeAiCandidateSave(repository, duplicate.effect));
  assert.equal(duplicateFailure.saveError.code, "DUPLICATE_AI_CONFIRMED_RECORD_ID");
  assert.deepEqual(repository.inspect().commandIds, ["command-1"]);
  assert.equal(repository.inspect().records.length, 1);
});

test("rejects forged effects, receipts, committed records, and stale attempts", async () => {
  const { state, effect } = savingState();
  const repository = createInMemoryAiConfirmedRecordRepository();
  await assert.rejects(
    executeAiCandidateSave(repository, { ...effect, fingerprint: "c".repeat(64) }),
    { code: "INVALID_AI_CANDIDATE_SAVE_EFFECT" },
  );
  await assert.rejects(
    repository.saveConfirmedRecord({
      ...effect.command,
      record: {
        ...effect.command.record,
        sourceEvidence: {
          ...effect.command.record.sourceEvidence,
          origin: "https://AI.EXAMPLE.TEST:443",
        },
      },
    }),
    { code: "INVALID_AI_CONFIRMED_RECORD" },
  );
  const outcome = await executeAiCandidateSave(repository, effect);
  assert.throws(
    () => settleAiCandidateSave(state, { ...outcome, attempt: 2 }),
    { code: "STALE_AI_CANDIDATE_SAVE_OUTCOME" },
  );
  assert.throws(
    () => settleAiCandidateSave(state, { ...outcome, receipt: { ...outcome.receipt, recordId: "other" } }),
    { code: "INVALID_AI_CONFIRMED_RECORD_RECEIPT" },
  );
  assert.throws(
    () => settleAiCandidateSave(state, {
      ...outcome,
      committedRecord: { ...outcome.committedRecord, recordId: "other" },
    }),
    { code: "INVALID_AI_CANDIDATE_SAVE_OUTCOME" },
  );
  assert.throws(
    () => settleAiCandidateSave(state, {
      status: "FAILED",
      attempt: 1,
      fingerprint: state.pendingFingerprint,
      receipt: null,
      committedRecord: null,
      error: { outcome: "UNKNOWN", code: "invalid code", retryable: true },
    }),
    { code: "INVALID_AI_CANDIDATE_SAVE_OUTCOME" },
  );
});

test("rejects forged review-ready and saving states before they can create or settle effects", async () => {
  const reviewed = reviewedState();
  const candidateWithAccessor = { ...reviewed.candidates[0] };
  Object.defineProperty(candidateWithAccessor, "label", { enumerable: true, get: () => "forged" });
  assert.throws(
    () => requestAiCandidateSave({ ...reviewed, candidates: [candidateWithAccessor] }, {
      commandId: "command-1",
      recordId: "record-1",
    }),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_STATE" },
  );
  assert.throws(
    () => requestAiCandidateSave({
      ...reviewed,
      reviewEvidence: { ...reviewed.reviewEvidence, candidateFingerprint: "c".repeat(64) },
    }, { commandId: "command-1", recordId: "record-1" }),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_STATE" },
  );

  const { state, effect } = savingState();
  const repository = createInMemoryAiConfirmedRecordRepository();
  const outcome = await executeAiCandidateSave(repository, effect);
  assert.throws(
    () => settleAiCandidateSave({
      ...state,
      pendingCommand: {
        ...state.pendingCommand,
        record: {
          ...state.pendingCommand.record,
          sourceEvidence: {
            ...state.pendingCommand.record.sourceEvidence,
            policyProfileVersion: "forged-policy",
          },
        },
      },
    }, outcome),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_STATE" },
  );
});

test("serializes concurrent duplicate and competing saves", async () => {
  const repository = createInMemoryAiConfirmedRecordRepository();
  const same = savingState();
  const [first, replay] = await Promise.all([
    executeAiCandidateSave(repository, same.effect),
    executeAiCandidateSave(repository, same.effect),
  ]);
  assert.deepEqual([first.receipt.disposition, replay.receipt.disposition].sort(), ["COMMITTED", "REPLAYED"]);

  const competingRepository = createInMemoryAiConfirmedRecordRepository();
  const left = savingState({ commandId: "left", recordId: "shared" });
  const right = savingState({ commandId: "right", recordId: "shared" });
  const outcomes = await Promise.all([
    executeAiCandidateSave(competingRepository, left.effect),
    executeAiCandidateSave(competingRepository, right.effect),
  ]);
  assert.equal(outcomes.filter((outcome) => outcome.status === "SUCCEEDED").length, 1);
  assert.equal(outcomes.filter((outcome) => outcome.error?.code === "DUPLICATE_AI_CONFIRMED_RECORD_ID").length, 1);
});

test("manual fallback remains available before commit and never creates a repository effect", () => {
  const initial = createAiCandidateConfirmationState({ localInput: localInput(), context: context() });
  const editing = receiveAiCandidateResponse(initial, response());
  const manual = returnToManualDraft(editing);
  assert.equal(manual.status, "MANUAL_DRAFT");
  assert.deepEqual(manual.localInput, initial.localInput);
  assert.equal(manual.candidates, null);
  assert.equal(manual.pendingCommand, null);
});

test("copies and freezes state, effects, repository records, and readback values", async () => {
  const reviewed = reviewedState();
  assert.equal(Object.isFrozen(reviewed), true);
  assert.equal(Object.isFrozen(reviewed.confirmedValue.payload), true);
  const { state, effect } = requestAiCandidateSave(reviewed, { commandId: "command-1", recordId: "record-1" });
  assert.equal(Object.isFrozen(effect.command.record), true);
  const repository = createInMemoryAiConfirmedRecordRepository();
  const saved = settleAiCandidateSave(state, await executeAiCandidateSave(repository, effect));
  const inspection = repository.inspect();
  assert.equal(Object.isFrozen(saved.committedRecord), true);
  assert.equal(Object.isFrozen(inspection.records[0]), true);
  assert.notEqual(inspection.records[0], saved.committedRecord);
});

test("successful save purges volatile input and candidates while the repository keeps only confirmed data", async () => {
  const { state, effect } = savingState();
  const repository = createInMemoryAiConfirmedRecordRepository();
  const saved = settleAiCandidateSave(state, await executeAiCandidateSave(repository, effect));
  const persisted = JSON.stringify(repository.inspect());
  assert.equal(persisted.includes("燕麦和牛奶"), false);
  assert.equal(persisted.includes("confidence"), false);
  assert.equal(persisted.includes("280"), false);
  assert.equal(saved.retention, "VOLATILE_INPUT_PURGED_AFTER_COMMIT");
  assert.equal(saved.localInput, null);
  assert.equal(saved.candidates, null);
  assert.equal(saved.confirmedValue, null);
  assert.equal(saved.reviewEvidence, null);
  assert.equal(saved.committedRecord.confirmedValue.payload.label, "燕麦牛奶（已确认）");
  assert.throws(
    () => requestAiCandidateSave({
      ...saved,
      context: context({ requestId: "forged-request" }),
    }, { commandId: "ignored", recordId: "ignored" }),
    { code: "INVALID_AI_CANDIDATE_CONFIRMATION_STATE" },
  );
});

test("contract source adds no network, filesystem, clock, native, target, diary, or automatic AI transport", () => {
  const source = fs.readFileSync(new URL("./ai-candidate-confirmation-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    "fetch(", "XMLHttpRequest", "node:http", "node:https", "readFile", "writeFile", "Date.now", "new Date",
    "sqlite", "sqlcipher", "keychain", "healthkit", "react-native", "SAVE_DIARY", "UPDATE_TARGET", "AITransport(",
  ]) {
    assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
});
