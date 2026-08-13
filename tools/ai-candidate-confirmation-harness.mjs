import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { parseAiResponse } from "./ai-response-contract-harness.mjs";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_JSON_DEPTH = 8;
const MAX_JSON_ITEMS = 256;
const MAX_JSON_STRING = 4096;
const MAX_JSON_BYTES = 64 * 1024;

const STATUSES = Object.freeze({
  AWAITING_RESPONSE: "AWAITING_RESPONSE",
  EDITING: "EDITING",
  REVIEW_READY: "REVIEW_READY",
  SAVING: "SAVING",
  SAVE_FAILED: "SAVE_FAILED",
  SAVED: "SAVED",
  MANUAL_DRAFT: "MANUAL_DRAFT",
});

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code = "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be a plain record`, code, { field });
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${field} must be a plain record`, code, { field });
  }
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!("value" in descriptor)) {
      fail(`${field}.${key} must not be an accessor`, code, { field: `${field}.${key}` });
    }
  }
  return value;
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) {
      fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
    }
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, code, { field: `${field}.${key}` });
  }
}

function identifier(value, field, code = "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function boundedString(value, field, code = "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE") {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > 512 ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) fail(`${field} is invalid`, code, { field });
  return value;
}

function sha256(value, field, code = "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE") {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function normalizeOrigin(value, field = "context.origin") {
  if (typeof value !== "string") fail(`${field} is invalid`, "INVALID_AI_REQUEST_CONTEXT", { field });
  let url;
  try {
    url = new URL(value);
  } catch (cause) {
    fail(`${field} is invalid`, "INVALID_AI_REQUEST_CONTEXT", { field, cause });
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    fail(`${field} must be an HTTPS origin`, "INVALID_AI_REQUEST_CONTEXT", { field });
  }
  return url.origin;
}

function clone(value, seen = new Map()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const result = Array.isArray(value) ? [] : {};
  seen.set(value, result);
  for (const [key, child] of Object.entries(value)) result[key] = clone(child, seen);
  return result;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(clone(value));
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function isSecretField(key) {
  const normalized = key.replace(/[-_]/g, "").toLowerCase();
  return normalized === "authorization" ||
    normalized.endsWith("apikey") ||
    normalized.endsWith("accesstoken") ||
    normalized.endsWith("refreshtoken") ||
    normalized.endsWith("password") ||
    normalized.endsWith("secret");
}

function validateSafeJson(value, field, { rejectSecretFields = true } = {}) {
  let items = 0;
  const seen = new Set();
  function visit(current, currentField, depth) {
    if (depth > MAX_JSON_DEPTH) fail(`${currentField} exceeds the depth budget`, "AI_DRAFT_RESOURCE_LIMIT", { field: currentField });
    if (current === null || typeof current === "boolean") return;
    if (typeof current === "string") {
      if (current.length > MAX_JSON_STRING) fail(`${currentField} exceeds the string budget`, "AI_DRAFT_RESOURCE_LIMIT", { field: currentField });
      return;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) fail(`${currentField} contains an invalid number`, "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE", { field: currentField });
      return;
    }
    if (!current || typeof current !== "object") {
      fail(`${currentField} is not JSON-safe`, "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE", { field: currentField });
    }
    if (seen.has(current)) fail(`${currentField} contains a cycle`, "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE", { field: currentField });
    seen.add(current);
    const descriptors = Object.getOwnPropertyDescriptors(current);
    for (const key of Object.keys(descriptors)) {
      if (!("value" in descriptors[key])) {
        fail(`${currentField}.${key} must not be an accessor`, "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE", {
          field: `${currentField}.${key}`,
        });
      }
    }
    if (Array.isArray(current)) {
      const ownKeys = Object.keys(current);
      if (
        ownKeys.length !== current.length ||
        ownKeys.some((key, index) => key !== String(index))
      ) {
        fail(`${currentField} contains non-JSON array properties`, "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE", {
          field: currentField,
        });
      }
      items += current.length;
      if (items > MAX_JSON_ITEMS) fail(`${field} exceeds the item budget`, "AI_DRAFT_RESOURCE_LIMIT", { field });
      for (const [index, child] of current.entries()) visit(child, `${currentField}[${index}]`, depth + 1);
    } else {
      assertPlainRecord(current, currentField);
      const entries = Object.entries(current);
      items += entries.length;
      if (items > MAX_JSON_ITEMS) fail(`${field} exceeds the item budget`, "AI_DRAFT_RESOURCE_LIMIT", { field });
      for (const [key, child] of entries) {
        if (["__proto__", "prototype", "constructor"].includes(key) || (rejectSecretFields && isSecretField(key))) {
          fail(`${currentField}.${key} is not permitted`, "AI_DRAFT_SECRET_FIELD", { field: `${currentField}.${key}` });
        }
        visit(child, `${currentField}.${key}`, depth + 1);
      }
    }
    seen.delete(current);
  }
  visit(value, field, 0);
  const normalized = clone(value);
  if (Buffer.byteLength(canonicalStringify(normalized), "utf8") > MAX_JSON_BYTES) {
    fail(`${field} exceeds the byte budget`, "AI_DRAFT_RESOURCE_LIMIT", { field });
  }
  return immutable(normalized);
}

function normalizeRequestContext(input, field = "context") {
  assertExactKeys(
    input,
    [
      "schemaVersion",
      "requestId",
      "origin",
      "model",
      "payloadClass",
      "transportProfileVersion",
      "policyProfileVersion",
      "policyEvidenceFingerprint",
    ],
    [],
    field,
    "INVALID_AI_REQUEST_CONTEXT",
  );
  if (input.schemaVersion !== "AI_REQUEST_CONTEXT_V1") {
    fail(`${field}.schemaVersion is unsupported`, "INVALID_AI_REQUEST_CONTEXT", { field: `${field}.schemaVersion` });
  }
  return immutable({
    schemaVersion: "AI_REQUEST_CONTEXT_V1",
    requestId: identifier(input.requestId, `${field}.requestId`, "INVALID_AI_REQUEST_CONTEXT"),
    origin: normalizeOrigin(input.origin, `${field}.origin`),
    model: boundedString(input.model, `${field}.model`, "INVALID_AI_REQUEST_CONTEXT"),
    payloadClass: boundedString(input.payloadClass, `${field}.payloadClass`, "INVALID_AI_REQUEST_CONTEXT"),
    transportProfileVersion: boundedString(
      input.transportProfileVersion,
      `${field}.transportProfileVersion`,
      "INVALID_AI_REQUEST_CONTEXT",
    ),
    policyProfileVersion: boundedString(
      input.policyProfileVersion,
      `${field}.policyProfileVersion`,
      "INVALID_AI_REQUEST_CONTEXT",
    ),
    policyEvidenceFingerprint: sha256(
      input.policyEvidenceFingerprint,
      `${field}.policyEvidenceFingerprint`,
      "INVALID_AI_REQUEST_CONTEXT",
    ),
  });
}

function normalizeConfirmedValue(input, field = "confirmedValue") {
  assertExactKeys(
    input,
    ["schemaVersion", "definitionId", "definitionVersion", "definitionFingerprint", "payload"],
    [],
    field,
    "INVALID_AI_CONFIRMED_VALUE",
  );
  if (input.schemaVersion !== "AI_CONFIRMED_VALUE_V1") {
    fail(`${field}.schemaVersion is unsupported`, "INVALID_AI_CONFIRMED_VALUE", { field: `${field}.schemaVersion` });
  }
  return immutable({
    schemaVersion: "AI_CONFIRMED_VALUE_V1",
    definitionId: identifier(input.definitionId, `${field}.definitionId`, "INVALID_AI_CONFIRMED_VALUE"),
    definitionVersion: identifier(input.definitionVersion, `${field}.definitionVersion`, "INVALID_AI_CONFIRMED_VALUE"),
    definitionFingerprint: sha256(
      input.definitionFingerprint,
      `${field}.definitionFingerprint`,
      "INVALID_AI_CONFIRMED_VALUE",
    ),
    payload: validateSafeJson(input.payload, `${field}.payload`),
  });
}

function baseState({ status, localInput, context }) {
  return immutable({
    schemaVersion: "AI_CANDIDATE_CONFIRMATION_STATE_V1",
    status,
    retention: "VOLATILE_APPLICATION_STATE_ONLY",
    localInput,
    context,
    candidates: null,
    responseError: null,
    selectedCandidateIndex: null,
    confirmedValue: null,
    reviewEvidence: null,
    pendingCommand: null,
    pendingAttempt: null,
    pendingFingerprint: null,
    saveError: null,
    receipt: null,
    committedRecord: null,
  });
}

function invalidState(message = "AI candidate confirmation state is invalid") {
  fail(message, "INVALID_AI_CANDIDATE_CONFIRMATION_STATE");
}

function normalizeCandidates(candidates, field = "state.candidates") {
  if (!Array.isArray(candidates)) invalidState(`${field} must be an array`);
  try {
    const safeCandidates = validateSafeJson(candidates, field, { rejectSecretFields: false });
    return parseAiResponse(JSON.stringify({ schemaVersion: 1, candidates: safeCandidates })).candidates;
  } catch (cause) {
    fail(`${field} is invalid`, "INVALID_AI_CANDIDATE_CONFIRMATION_STATE", { field, cause });
  }
}

function validateReviewEvidence(reviewEvidence, { context, candidates, selectedCandidateIndex, confirmedValue }) {
  assertExactKeys(
    reviewEvidence,
    [
      "schemaVersion",
      "requestId",
      "requestContextFingerprint",
      "candidateFingerprint",
      "confirmedValueFingerprint",
      "reviewFingerprint",
    ],
    [],
    "state.reviewEvidence",
    "INVALID_AI_CANDIDATE_CONFIRMATION_STATE",
  );
  if (!Number.isInteger(selectedCandidateIndex) || selectedCandidateIndex < 0 || selectedCandidateIndex >= candidates.length) {
    invalidState("state selected candidate is invalid");
  }
  const expectedCore = immutable({
    schemaVersion: "AI_CANDIDATE_REVIEW_EVIDENCE_V1",
    requestId: context.requestId,
    requestContextFingerprint: fingerprint(context),
    candidateFingerprint: fingerprint(candidates[selectedCandidateIndex]),
    confirmedValueFingerprint: fingerprint(confirmedValue),
  });
  const expected = immutable({ ...expectedCore, reviewFingerprint: fingerprint(expectedCore) });
  if (!isDeepStrictEqual(reviewEvidence, expected)) invalidState("state review evidence is invalid");
  return expected;
}

function assertState(state) {
  assertExactKeys(
    state,
    [
      "schemaVersion", "status", "retention", "localInput", "context", "candidates", "responseError",
      "selectedCandidateIndex", "confirmedValue", "reviewEvidence", "pendingCommand", "pendingAttempt",
      "pendingFingerprint", "saveError", "receipt", "committedRecord",
    ],
    [],
    "state",
    "INVALID_AI_CANDIDATE_CONFIRMATION_STATE",
  );
  if (state.schemaVersion !== "AI_CANDIDATE_CONFIRMATION_STATE_V1" || !Object.values(STATUSES).includes(state.status)) {
    invalidState();
  }
  const expectedRetention = state.status === STATUSES.SAVED
    ? "VOLATILE_INPUT_PURGED_AFTER_COMMIT"
    : "VOLATILE_APPLICATION_STATE_ONLY";
  if (state.retention !== expectedRetention) invalidState("state retention is invalid");
  const normalizedContext = normalizeRequestContext(state.context);
  if (!isDeepStrictEqual(state.context, normalizedContext)) invalidState("state request context is not normalized");
  const normalizedLocalInput = validateSafeJson(state.localInput, "state.localInput");
  if (!isDeepStrictEqual(state.localInput, normalizedLocalInput)) invalidState("state local input is invalid");

  if (state.responseError !== null) {
    assertExactKeys(
      state.responseError,
      ["code"],
      [],
      "state.responseError",
      "INVALID_AI_CANDIDATE_CONFIRMATION_STATE",
    );
    identifier(state.responseError.code, "state.responseError.code", "INVALID_AI_CANDIDATE_CONFIRMATION_STATE");
  }
  if (state.saveError !== null) {
    assertExactKeys(
      state.saveError,
      ["outcome", "code", "retryable"],
      [],
      "state.saveError",
      "INVALID_AI_CANDIDATE_CONFIRMATION_STATE",
    );
    if (
      !["NOT_COMMITTED", "UNKNOWN"].includes(state.saveError.outcome) ||
      typeof state.saveError.retryable !== "boolean" ||
      (state.saveError.outcome === "UNKNOWN" && state.saveError.retryable !== true)
    ) invalidState("state save error is invalid");
    identifier(state.saveError.code, "state.saveError.code", "INVALID_AI_CANDIDATE_CONFIRMATION_STATE");
  }

  const statusesWithCandidates = new Set([STATUSES.EDITING, STATUSES.REVIEW_READY, STATUSES.SAVING, STATUSES.SAVE_FAILED]);
  const statusesWithReview = new Set([STATUSES.REVIEW_READY, STATUSES.SAVING, STATUSES.SAVE_FAILED]);
  const statusesWithPending = new Set([STATUSES.SAVING, STATUSES.SAVE_FAILED, STATUSES.SAVED]);
  let normalizedCandidates = null;
  let normalizedConfirmedValue = null;
  let normalizedReviewEvidence = null;
  if (statusesWithCandidates.has(state.status)) {
    normalizedCandidates = normalizeCandidates(state.candidates);
    if (!isDeepStrictEqual(state.candidates, normalizedCandidates)) invalidState("state candidates are not normalized");
  } else if (state.candidates !== null) invalidState("state candidates must be absent");

  if (state.status === STATUSES.EDITING) {
    if ((state.selectedCandidateIndex === null) !== (state.confirmedValue === null)) {
      invalidState("editing state selection is incomplete");
    }
    if (state.confirmedValue !== null) {
      if (
        !Number.isInteger(state.selectedCandidateIndex) ||
        state.selectedCandidateIndex < 0 ||
        state.selectedCandidateIndex >= normalizedCandidates.length
      ) invalidState("editing state selected candidate is invalid");
      normalizedConfirmedValue = normalizeConfirmedValue(state.confirmedValue, "state.confirmedValue");
      if (!isDeepStrictEqual(state.confirmedValue, normalizedConfirmedValue)) invalidState("state confirmed value is invalid");
    }
  } else if (statusesWithReview.has(state.status)) {
    normalizedConfirmedValue = normalizeConfirmedValue(state.confirmedValue, "state.confirmedValue");
    if (!isDeepStrictEqual(state.confirmedValue, normalizedConfirmedValue)) invalidState("state confirmed value is invalid");
    normalizedReviewEvidence = validateReviewEvidence(state.reviewEvidence, {
      context: normalizedContext,
      candidates: normalizedCandidates,
      selectedCandidateIndex: state.selectedCandidateIndex,
      confirmedValue: normalizedConfirmedValue,
    });
  } else if (state.selectedCandidateIndex !== null || state.confirmedValue !== null || state.reviewEvidence !== null) {
    invalidState("state review fields must be absent");
  }
  if (!statusesWithReview.has(state.status) && state.reviewEvidence !== null) invalidState("state review evidence must be absent");

  if (statusesWithPending.has(state.status)) {
    let command;
    try {
      command = validateCommand(state.pendingCommand);
    } catch (cause) {
      fail("state pending command is invalid", "INVALID_AI_CANDIDATE_CONFIRMATION_STATE", {
        field: "state.pendingCommand",
        cause,
      });
    }
    if (!Number.isInteger(state.pendingAttempt) || state.pendingAttempt < 1) invalidState("state pending attempt is invalid");
    if (state.pendingFingerprint !== fingerprint(command)) invalidState("state pending fingerprint is invalid");
    if (state.status === STATUSES.SAVED) {
      const sourceEvidence = command.record.sourceEvidence;
      if (
        sourceEvidence.requestId !== normalizedContext.requestId ||
        sourceEvidence.origin !== normalizedContext.origin ||
        sourceEvidence.model !== normalizedContext.model ||
        sourceEvidence.payloadClass !== normalizedContext.payloadClass ||
        sourceEvidence.transportProfileVersion !== normalizedContext.transportProfileVersion ||
        sourceEvidence.policyProfileVersion !== normalizedContext.policyProfileVersion ||
        sourceEvidence.policyEvidenceFingerprint !== normalizedContext.policyEvidenceFingerprint ||
        sourceEvidence.requestContextFingerprint !== fingerprint(normalizedContext)
      ) invalidState("saved state request context is not bound to the committed record");
    } else {
      const expectedRecord = buildConfirmedRecord(
        {
          context: normalizedContext,
          confirmedValue: normalizedConfirmedValue,
          reviewEvidence: normalizedReviewEvidence,
        },
        command.record.recordId,
      );
      if (!isDeepStrictEqual(command.record, expectedRecord)) invalidState("state pending command is not bound to review");
    }
  } else if (state.pendingCommand !== null || state.pendingAttempt !== null || state.pendingFingerprint !== null) {
    invalidState("state pending fields must be absent");
  }

  if (state.status === STATUSES.AWAITING_RESPONSE) {
    if (state.localInput === null || state.candidates !== null || state.saveError !== null || state.receipt !== null || state.committedRecord !== null) invalidState();
  } else if (state.status === STATUSES.EDITING || state.status === STATUSES.REVIEW_READY) {
    if (state.localInput === null || state.responseError !== null || state.saveError !== null || state.receipt !== null || state.committedRecord !== null) invalidState();
  } else if (state.status === STATUSES.SAVING) {
    if (state.localInput === null || state.responseError !== null || state.saveError !== null || state.receipt !== null || state.committedRecord !== null) invalidState();
  } else if (state.status === STATUSES.SAVE_FAILED) {
    if (state.localInput === null || state.responseError !== null || state.saveError === null || state.receipt !== null || state.committedRecord !== null) invalidState();
  } else if (state.status === STATUSES.MANUAL_DRAFT) {
    if (state.localInput === null || state.responseError !== null || state.saveError !== null || state.receipt !== null || state.committedRecord !== null) invalidState();
  } else if (state.status === STATUSES.SAVED) {
    if (state.localInput !== null || state.responseError !== null || state.saveError !== null) invalidState("saved state retains volatile input");
    const receipt = validateReceipt(state.receipt, state.pendingCommand);
    const committedRecord = validateConfirmedRecord(state.committedRecord, "state.committedRecord");
    if (!isDeepStrictEqual(committedRecord, state.pendingCommand.record) || !isDeepStrictEqual(receipt, state.receipt)) {
      invalidState("saved state evidence is invalid");
    }
  }
  return state;
}

function createAiCandidateConfirmationState({ localInput, context } = {}) {
  const normalizedLocalInput = validateSafeJson(localInput, "localInput");
  if (normalizedLocalInput === null) {
    fail("localInput is required", "INVALID_AI_CANDIDATE_CONFIRMATION_VALUE", { field: "localInput" });
  }
  return baseState({
    status: STATUSES.AWAITING_RESPONSE,
    localInput: normalizedLocalInput,
    context: normalizeRequestContext(context),
  });
}

function recordAiTransportFailure(state, errorCode) {
  assertState(state);
  if (state.status !== STATUSES.AWAITING_RESPONSE) fail("transport failure is stale", "INVALID_AI_CANDIDATE_TRANSITION");
  return immutable({
    ...baseState({ status: STATUSES.AWAITING_RESPONSE, localInput: state.localInput, context: state.context }),
    responseError: { code: identifier(errorCode, "errorCode", "INVALID_AI_TRANSPORT_ERROR") },
  });
}

function receiveAiCandidateResponse(state, responseText) {
  assertState(state);
  if (state.status !== STATUSES.AWAITING_RESPONSE) fail("response is stale", "INVALID_AI_CANDIDATE_TRANSITION");
  try {
    const response = parseAiResponse(responseText);
    return immutable({
      ...baseState({ status: STATUSES.EDITING, localInput: state.localInput, context: state.context }),
      candidates: response.candidates,
    });
  } catch (error) {
    return immutable({
      ...baseState({ status: STATUSES.AWAITING_RESPONSE, localInput: state.localInput, context: state.context }),
      responseError: { code: identifier(error.code ?? "RESPONSE_INVALID", "responseError.code") },
    });
  }
}

function editAiCandidate(state, { candidateIndex, confirmedValue } = {}) {
  assertState(state);
  if (![STATUSES.EDITING, STATUSES.REVIEW_READY].includes(state.status)) {
    fail("candidate cannot be edited in the current state", "INVALID_AI_CANDIDATE_TRANSITION");
  }
  if (!Array.isArray(state.candidates) || !Number.isInteger(candidateIndex) || candidateIndex < 0 || candidateIndex >= state.candidates.length) {
    fail("candidate index is invalid", "INVALID_AI_CANDIDATE_INDEX");
  }
  return immutable({
    ...baseState({ status: STATUSES.EDITING, localInput: state.localInput, context: state.context }),
    candidates: state.candidates,
    selectedCandidateIndex: candidateIndex,
    confirmedValue: normalizeConfirmedValue(confirmedValue),
  });
}

function reviewAiCandidate(state) {
  assertState(state);
  if (
    state.status !== STATUSES.EDITING ||
    !Array.isArray(state.candidates) ||
    !Number.isInteger(state.selectedCandidateIndex) ||
    state.confirmedValue === null
  ) {
    fail("an edited candidate is required before review", "AI_CANDIDATE_REVIEW_REQUIRED");
  }
  const candidateFingerprint = fingerprint(state.candidates[state.selectedCandidateIndex]);
  const confirmedValueFingerprint = fingerprint(state.confirmedValue);
  const reviewCore = immutable({
    schemaVersion: "AI_CANDIDATE_REVIEW_EVIDENCE_V1",
    requestId: state.context.requestId,
    requestContextFingerprint: fingerprint(state.context),
    candidateFingerprint,
    confirmedValueFingerprint,
  });
  const reviewEvidence = immutable({ ...reviewCore, reviewFingerprint: fingerprint(reviewCore) });
  return immutable({ ...state, status: STATUSES.REVIEW_READY, reviewEvidence });
}

function buildConfirmedRecord(state, recordId) {
  return immutable({
    schemaVersion: "AI_CONFIRMED_RECORD_V1",
    recordId: identifier(recordId, "recordId", "INVALID_AI_CONFIRMED_RECORD"),
    confirmedValue: normalizeConfirmedValue(state.confirmedValue),
    sourceEvidence: {
      schemaVersion: "AI_CONFIRMED_SOURCE_EVIDENCE_V1",
      sourceKind: "AI_ASSISTED_USER_CONFIRMED",
      requestId: state.context.requestId,
      origin: state.context.origin,
      model: state.context.model,
      payloadClass: state.context.payloadClass,
      transportProfileVersion: state.context.transportProfileVersion,
      policyProfileVersion: state.context.policyProfileVersion,
      policyEvidenceFingerprint: state.context.policyEvidenceFingerprint,
      requestContextFingerprint: state.reviewEvidence.requestContextFingerprint,
      candidateFingerprint: state.reviewEvidence.candidateFingerprint,
      reviewFingerprint: state.reviewEvidence.reviewFingerprint,
    },
  });
}

function requestAiCandidateSave(state, { commandId, recordId } = {}) {
  assertState(state);
  if (state.status === STATUSES.SAVING) return immutable({ state, effect: null });
  if (state.status !== STATUSES.REVIEW_READY || state.reviewEvidence === null) {
    fail("review is required before save", "AI_CANDIDATE_REVIEW_REQUIRED");
  }
  const command = immutable({
    schemaVersion: "AI_CONFIRMED_RECORD_COMMAND_V1",
    commandId: identifier(commandId, "commandId", "INVALID_AI_CONFIRMED_RECORD_COMMAND"),
    record: buildConfirmedRecord(state, recordId),
  });
  const pendingAttempt = 1;
  const pendingFingerprint = fingerprint(command);
  const savingState = immutable({
    ...state,
    status: STATUSES.SAVING,
    pendingCommand: command,
    pendingAttempt,
    pendingFingerprint,
    saveError: null,
  });
  return immutable({
    state: savingState,
    effect: {
      type: "SAVE_AI_CONFIRMED_RECORD",
      command,
      attempt: pendingAttempt,
      fingerprint: pendingFingerprint,
    },
  });
}

function retryAiCandidateSave(state) {
  assertState(state);
  if (state.status !== STATUSES.SAVE_FAILED || state.saveError?.retryable !== true || state.pendingCommand === null) {
    fail("save cannot be retried", "AI_CANDIDATE_SAVE_NOT_RETRYABLE");
  }
  const pendingAttempt = state.pendingAttempt + 1;
  const savingState = immutable({
    ...state,
    status: STATUSES.SAVING,
    pendingAttempt,
    saveError: null,
  });
  return immutable({
    state: savingState,
    effect: {
      type: "SAVE_AI_CONFIRMED_RECORD",
      command: state.pendingCommand,
      attempt: pendingAttempt,
      fingerprint: state.pendingFingerprint,
    },
  });
}

function validateCommand(command) {
  assertExactKeys(
    command,
    ["schemaVersion", "commandId", "record"],
    [],
    "command",
    "INVALID_AI_CONFIRMED_RECORD_COMMAND",
  );
  if (command.schemaVersion !== "AI_CONFIRMED_RECORD_COMMAND_V1") {
    fail("command version is invalid", "INVALID_AI_CONFIRMED_RECORD_COMMAND");
  }
  const normalized = immutable({
    schemaVersion: "AI_CONFIRMED_RECORD_COMMAND_V1",
    commandId: identifier(command.commandId, "command.commandId", "INVALID_AI_CONFIRMED_RECORD_COMMAND"),
    record: validateConfirmedRecord(command.record),
  });
  if (!isDeepStrictEqual(command, normalized)) {
    fail("command is not normalized", "INVALID_AI_CONFIRMED_RECORD_COMMAND");
  }
  return normalized;
}

function validateConfirmedRecord(record, field = "record") {
  assertExactKeys(
    record,
    ["schemaVersion", "recordId", "confirmedValue", "sourceEvidence"],
    [],
    field,
    "INVALID_AI_CONFIRMED_RECORD",
  );
  if (record.schemaVersion !== "AI_CONFIRMED_RECORD_V1") fail("record version is invalid", "INVALID_AI_CONFIRMED_RECORD");
  const normalizedRecordId = identifier(record.recordId, `${field}.recordId`, "INVALID_AI_CONFIRMED_RECORD");
  const normalizedConfirmedValue = normalizeConfirmedValue(record.confirmedValue, `${field}.confirmedValue`);
  assertExactKeys(
    record.sourceEvidence,
    [
      "schemaVersion", "sourceKind", "requestId", "origin", "model", "payloadClass",
      "transportProfileVersion", "policyProfileVersion", "policyEvidenceFingerprint",
      "requestContextFingerprint", "candidateFingerprint", "reviewFingerprint",
    ],
    [],
    `${field}.sourceEvidence`,
    "INVALID_AI_CONFIRMED_RECORD",
  );
  if (
    record.sourceEvidence.schemaVersion !== "AI_CONFIRMED_SOURCE_EVIDENCE_V1" ||
    record.sourceEvidence.sourceKind !== "AI_ASSISTED_USER_CONFIRMED"
  ) fail("record source evidence is invalid", "INVALID_AI_CONFIRMED_RECORD");
  identifier(record.sourceEvidence.requestId, `${field}.sourceEvidence.requestId`, "INVALID_AI_CONFIRMED_RECORD");
  const normalizedOrigin = normalizeOrigin(record.sourceEvidence.origin, `${field}.sourceEvidence.origin`);
  for (const key of ["model", "payloadClass", "transportProfileVersion", "policyProfileVersion"]) {
    boundedString(record.sourceEvidence[key], `${field}.sourceEvidence.${key}`, "INVALID_AI_CONFIRMED_RECORD");
  }
  for (const key of ["policyEvidenceFingerprint", "requestContextFingerprint", "candidateFingerprint", "reviewFingerprint"]) {
    sha256(record.sourceEvidence[key], `${field}.sourceEvidence.${key}`, "INVALID_AI_CONFIRMED_RECORD");
  }
  const reconstructedContext = immutable({
    schemaVersion: "AI_REQUEST_CONTEXT_V1",
    requestId: record.sourceEvidence.requestId,
    origin: normalizedOrigin,
    model: record.sourceEvidence.model,
    payloadClass: record.sourceEvidence.payloadClass,
    transportProfileVersion: record.sourceEvidence.transportProfileVersion,
    policyProfileVersion: record.sourceEvidence.policyProfileVersion,
    policyEvidenceFingerprint: record.sourceEvidence.policyEvidenceFingerprint,
  });
  if (record.sourceEvidence.requestContextFingerprint !== fingerprint(normalizeRequestContext(reconstructedContext))) {
    fail("record request context evidence is invalid", "INVALID_AI_CONFIRMED_RECORD");
  }
  const reviewCore = immutable({
    schemaVersion: "AI_CANDIDATE_REVIEW_EVIDENCE_V1",
    requestId: record.sourceEvidence.requestId,
    requestContextFingerprint: record.sourceEvidence.requestContextFingerprint,
    candidateFingerprint: record.sourceEvidence.candidateFingerprint,
    confirmedValueFingerprint: fingerprint(normalizedConfirmedValue),
  });
  if (record.sourceEvidence.reviewFingerprint !== fingerprint(reviewCore)) {
    fail("record review evidence is invalid", "INVALID_AI_CONFIRMED_RECORD");
  }
  const normalized = immutable({
    schemaVersion: "AI_CONFIRMED_RECORD_V1",
    recordId: normalizedRecordId,
    confirmedValue: normalizedConfirmedValue,
    sourceEvidence: {
      ...record.sourceEvidence,
      origin: normalizedOrigin,
    },
  });
  if (!isDeepStrictEqual(record, normalized)) {
    fail("record is not normalized", "INVALID_AI_CONFIRMED_RECORD");
  }
  return normalized;
}

function validateReceipt(receipt, command) {
  assertExactKeys(
    receipt,
    ["schemaVersion", "commandId", "disposition", "recordId", "recordFingerprint"],
    [],
    "receipt",
    "INVALID_AI_CONFIRMED_RECORD_RECEIPT",
  );
  if (
    receipt.schemaVersion !== "AI_CONFIRMED_RECORD_RECEIPT_V1" ||
    receipt.commandId !== command.commandId ||
    !["COMMITTED", "REPLAYED"].includes(receipt.disposition) ||
    receipt.recordId !== command.record.recordId ||
    receipt.recordFingerprint !== fingerprint(command.record)
  ) fail("repository receipt is invalid", "INVALID_AI_CONFIRMED_RECORD_RECEIPT");
  return immutable(receipt);
}

function normalizeFailure(error, { receiptAccepted = false } = {}) {
  const outcome = !receiptAccepted && error?.outcome === "NOT_COMMITTED" ? "NOT_COMMITTED" : "UNKNOWN";
  return immutable({
    outcome,
    code: typeof error?.code === "string" && IDENTIFIER.test(error.code) ? error.code : "AI_CONFIRMED_RECORD_REPOSITORY_FAILURE",
    retryable: outcome === "UNKNOWN" || error?.retryable !== false,
  });
}

async function executeAiCandidateSave(repository, effect) {
  if (!repository || typeof repository.saveConfirmedRecord !== "function" || typeof repository.readConfirmedRecord !== "function") {
    fail("repository port is invalid", "INVALID_AI_CONFIRMED_RECORD_REPOSITORY");
  }
  assertExactKeys(effect, ["type", "command", "attempt", "fingerprint"], [], "effect", "INVALID_AI_CANDIDATE_SAVE_EFFECT");
  if (
    effect.type !== "SAVE_AI_CONFIRMED_RECORD" ||
    !Number.isInteger(effect.attempt) ||
    effect.attempt < 1
  ) fail("save effect is invalid", "INVALID_AI_CANDIDATE_SAVE_EFFECT");
  const command = validateCommand(effect.command);
  if (effect.fingerprint !== fingerprint(command)) {
    fail("save effect is invalid", "INVALID_AI_CANDIDATE_SAVE_EFFECT");
  }
  try {
    const receipt = validateReceipt(await repository.saveConfirmedRecord(command), command);
    try {
      const committedRecord = validateConfirmedRecord(
        await repository.readConfirmedRecord(command.record.recordId),
        "committedRecord",
      );
      if (!isDeepStrictEqual(committedRecord, command.record)) {
        fail("repository record does not match the command", "AI_CONFIRMED_RECORD_READBACK_MISMATCH");
      }
      return immutable({
        status: "SUCCEEDED",
        attempt: effect.attempt,
        fingerprint: effect.fingerprint,
        receipt,
        committedRecord,
        error: null,
      });
    } catch (error) {
      return immutable({
        status: "FAILED",
        attempt: effect.attempt,
        fingerprint: effect.fingerprint,
        receipt: null,
        committedRecord: null,
        error: normalizeFailure(error, { receiptAccepted: true }),
      });
    }
  } catch (error) {
    return immutable({
      status: "FAILED",
      attempt: effect.attempt,
      fingerprint: effect.fingerprint,
      receipt: null,
      committedRecord: null,
      error: normalizeFailure(error),
    });
  }
}

function settleAiCandidateSave(state, outcome) {
  assertState(state);
  if (state.status !== STATUSES.SAVING) fail("save outcome is stale", "INVALID_AI_CANDIDATE_TRANSITION");
  assertExactKeys(
    outcome,
    ["status", "attempt", "fingerprint", "receipt", "committedRecord", "error"],
    [],
    "outcome",
    "INVALID_AI_CANDIDATE_SAVE_OUTCOME",
  );
  if (outcome.attempt !== state.pendingAttempt || outcome.fingerprint !== state.pendingFingerprint) {
    fail("save outcome is stale", "STALE_AI_CANDIDATE_SAVE_OUTCOME");
  }
  if (outcome.status === "SUCCEEDED" && outcome.error === null) {
    const receipt = validateReceipt(outcome.receipt, state.pendingCommand);
    const committedRecord = validateConfirmedRecord(outcome.committedRecord, "outcome.committedRecord");
    if (!isDeepStrictEqual(committedRecord, state.pendingCommand.record)) {
      fail("save outcome record is invalid", "INVALID_AI_CANDIDATE_SAVE_OUTCOME");
    }
    return immutable({
      schemaVersion: "AI_CANDIDATE_CONFIRMATION_STATE_V1",
      status: STATUSES.SAVED,
      retention: "VOLATILE_INPUT_PURGED_AFTER_COMMIT",
      localInput: null,
      context: state.context,
      candidates: null,
      responseError: null,
      selectedCandidateIndex: null,
      confirmedValue: null,
      reviewEvidence: null,
      pendingCommand: state.pendingCommand,
      pendingAttempt: state.pendingAttempt,
      pendingFingerprint: state.pendingFingerprint,
      saveError: null,
      receipt,
      committedRecord,
    });
  }
  if (outcome.status !== "FAILED" || outcome.receipt !== null || outcome.committedRecord !== null) {
    fail("save outcome is invalid", "INVALID_AI_CANDIDATE_SAVE_OUTCOME");
  }
  assertExactKeys(outcome.error, ["outcome", "code", "retryable"], [], "outcome.error", "INVALID_AI_CANDIDATE_SAVE_OUTCOME");
  if (
    !["NOT_COMMITTED", "UNKNOWN"].includes(outcome.error.outcome) ||
    typeof outcome.error.retryable !== "boolean" ||
    (outcome.error.outcome === "UNKNOWN" && outcome.error.retryable !== true)
  ) fail("save failure is invalid", "INVALID_AI_CANDIDATE_SAVE_OUTCOME");
  identifier(outcome.error.code, "outcome.error.code", "INVALID_AI_CANDIDATE_SAVE_OUTCOME");
  return immutable({ ...state, status: STATUSES.SAVE_FAILED, saveError: outcome.error });
}

function returnToManualDraft(state) {
  assertState(state);
  if ([STATUSES.SAVING, STATUSES.SAVED].includes(state.status)) {
    fail("manual fallback is unavailable in the current state", "INVALID_AI_CANDIDATE_TRANSITION");
  }
  if (state.status === STATUSES.SAVE_FAILED && state.saveError?.outcome === "UNKNOWN") {
    fail("unknown commit must be reconciled before fallback", "AI_CANDIDATE_COMMIT_OUTCOME_UNKNOWN");
  }
  return baseState({ status: STATUSES.MANUAL_DRAFT, localInput: state.localInput, context: state.context });
}

function repositoryError(code, outcome, retryable = true) {
  const error = new Error(code);
  Object.assign(error, { code, outcome, retryable });
  return error;
}

function createInMemoryAiConfirmedRecordRepository({ records = [], faultPlan = [] } = {}) {
  if (!Array.isArray(records) || !Array.isArray(faultPlan)) fail("repository fixtures are invalid", "INVALID_AI_CONFIRMED_RECORD_REPOSITORY");
  let storedRecords = new Map();
  let idempotency = new Map();
  let faultIndex = 0;
  for (const [index, recordInput] of records.entries()) {
    const record = validateConfirmedRecord(recordInput, `records[${index}]`);
    if (storedRecords.has(record.recordId)) fail("record IDs must be unique", "DUPLICATE_AI_CONFIRMED_RECORD_ID");
    storedRecords.set(record.recordId, record);
  }
  for (const fault of faultPlan) {
    if (fault !== null && !["BEFORE_COMMIT", "AFTER_COMMIT", "READBACK"].includes(fault)) {
      fail("repository fault is invalid", "INVALID_AI_CONFIRMED_RECORD_REPOSITORY");
    }
  }

  let queue = Promise.resolve();
  function serialized(operation) {
    const current = queue.then(operation, operation);
    queue = current.catch(() => undefined);
    return current;
  }

  return Object.freeze({
    async saveConfirmedRecord(commandInput) {
      return serialized(async () => {
        const command = validateCommand(commandInput);
        const commandFingerprint = fingerprint(command);
        const prior = idempotency.get(command.commandId);
        if (prior !== undefined) {
          if (prior.commandFingerprint !== commandFingerprint) throw repositoryError("AI_CONFIRMED_RECORD_IDEMPOTENCY_CONFLICT", "NOT_COMMITTED", false);
          return immutable({ ...prior.receipt, disposition: "REPLAYED" });
        }
        if (storedRecords.has(command.record.recordId)) throw repositoryError("DUPLICATE_AI_CONFIRMED_RECORD_ID", "NOT_COMMITTED", false);
        const fault = faultPlan[faultIndex] ?? null;
        faultIndex += 1;
        if (fault === "BEFORE_COMMIT") throw repositoryError("INJECTED_BEFORE_COMMIT", "NOT_COMMITTED");
        const receipt = immutable({
          schemaVersion: "AI_CONFIRMED_RECORD_RECEIPT_V1",
          commandId: command.commandId,
          disposition: "COMMITTED",
          recordId: command.record.recordId,
          recordFingerprint: fingerprint(command.record),
        });
        const nextRecords = new Map(storedRecords);
        nextRecords.set(command.record.recordId, command.record);
        const nextIdempotency = new Map(idempotency);
        nextIdempotency.set(command.commandId, { commandFingerprint, receipt });
        storedRecords = nextRecords;
        idempotency = nextIdempotency;
        if (fault === "AFTER_COMMIT") throw repositoryError("INJECTED_AFTER_COMMIT", "UNKNOWN");
        return receipt;
      });
    },
    async readConfirmedRecord(recordId) {
      identifier(recordId, "recordId", "INVALID_AI_CONFIRMED_RECORD");
      const fault = faultPlan[faultIndex] ?? null;
      if (fault === "READBACK") {
        faultIndex += 1;
        throw repositoryError("INJECTED_READBACK_FAILURE", "NOT_COMMITTED");
      }
      const record = storedRecords.get(recordId);
      if (record === undefined) fail("record was not found", "AI_CONFIRMED_RECORD_NOT_FOUND");
      return immutable(record);
    },
    inspect() {
      return immutable({
        records: [...storedRecords.values()],
        commandIds: [...idempotency.keys()],
      });
    },
  });
}

export {
  STATUSES,
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
};
