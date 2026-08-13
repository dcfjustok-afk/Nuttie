import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { lookupLocalFoodByGtin } from "./local-food-catalog-harness.mjs";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const QUALIFIED_FOOD_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,386}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const GTIN = /^(?:[0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$/;
const MAX_DEPTH = 16;
const MAX_ARRAY_ITEMS = 128;
const MAX_OBJECT_KEYS = 128;
const MAX_STRING_LENGTH = 8192;
const MAX_DEFINITION_BYTES = 65_536;

const INPUT_SOURCES = Object.freeze({ CAMERA_RESULT: "CAMERA_RESULT", MANUAL_DIGITS: "MANUAL_DIGITS" });
const PHASES = Object.freeze({
  AWAITING_GTIN: "AWAITING_GTIN",
  CANDIDATE_SELECTION_REQUIRED: "CANDIDATE_SELECTION_REQUIRED",
  FOOD_REVIEW_READY: "FOOD_REVIEW_READY",
  MANUAL_CREATION_READY: "MANUAL_CREATION_READY",
});
const COMMAND_TYPES = Object.freeze({
  SUBMIT_GTIN: "SUBMIT_GTIN",
  SELECT_CANDIDATE: "SELECT_CANDIDATE",
  RETRY_INPUT: "RETRY_INPUT",
});

const BOUNDARY = Object.freeze({
  lookupMode: "LOCAL_EXACT_GTIN_ONLY",
  networkFallback: "FORBIDDEN",
  fuzzyBarcodeRecognition: "NOT_AUTHORIZED",
  coveragePromise: "NOT_AUTHORIZED",
  autoCandidateSelection: "FORBIDDEN",
  sourceMerge: "FORBIDDEN",
  catalogMutation: "NOT_AUTHORIZED",
  diaryMutation: "NOT_AUTHORIZED",
  portionRule: "CALLER_OWNED_REVIEW",
  cameraPermissionHandling: "EXTERNAL_F21_ORCHESTRATOR",
  aiFallback: "SEPARATE_USER_INITIATED_FLOW_NOT_AUTHORIZED_HERE",
  realNetworkRequests: 0,
  nativeApiCalls: 0,
});

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${field} must be a plain record`, code, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail(`${field} must be a plain record`, code, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) fail(`${field} contains symbol properties`, code, { field });
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!descriptor.enumerable || descriptor.get || descriptor.set) fail(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
  }
}

function assertExactKeys(value, required, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set(required);
  for (const key of Object.keys(value)) if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, code, { field: `${field}.${key}` });
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

function identifier(value, field, code) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function qualifiedFoodId(value, field, code) {
  if (typeof value !== "string" || !QUALIFIED_FOOD_ID.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function validateBoundedJson(
  value,
  field,
  codes = { invalid: "INVALID_BARCODE_DEFINITION", tooLarge: "BARCODE_DEFINITION_TOO_LARGE" },
  depth = 0,
  budget = { items: 0 },
  ancestors = new Set(),
) {
  if (depth > MAX_DEPTH || ++budget.items > 10_000) fail(`${field} exceeds its resource budget`, codes.tooLarge, { field });
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) fail(`${field} string is too long`, codes.tooLarge, { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} number is invalid`, codes.invalid, { field });
    return;
  }
  if (typeof value !== "object" || ancestors.has(value)) fail(`${field} is invalid`, codes.invalid, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null && !Array.isArray(value)) fail(`${field} is invalid`, codes.invalid, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) fail(`${field} contains symbol properties`, codes.invalid, { field });
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (key !== "length" && (!descriptor.enumerable || descriptor.get || descriptor.set)) fail(`${field} contains an unsupported property`, codes.invalid, { field: `${field}.${key}` });
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) fail(`${field} has too many items`, codes.tooLarge, { field });
    if (Object.keys(value).length !== value.length || Object.keys(value).some((key, index) => key !== String(index))) fail(`${field} must be a dense array without extra properties`, codes.invalid, { field });
    value.forEach((child, index) => validateBoundedJson(child, `${field}[${index}]`, codes, depth + 1, budget, ancestors));
  } else {
    if (Object.keys(value).length > MAX_OBJECT_KEYS) fail(`${field} has too many keys`, codes.tooLarge, { field });
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, codes.invalid, { field: `${field}.${key}` });
      validateBoundedJson(child, `${field}.${key}`, codes, depth + 1, budget, ancestors);
    }
  }
  ancestors.delete(value);
}

function opaqueDefinition(value, field) {
  assertPlainRecord(value, field, "INVALID_BARCODE_DEFINITION");
  validateBoundedJson(value, field);
  if (Buffer.byteLength(canonicalStringify(value), "utf8") > MAX_DEFINITION_BYTES) fail(`${field} exceeds the byte budget`, "BARCODE_DEFINITION_TOO_LARGE", { field });
  return immutable(value);
}

function normalizeTaskDefinition(input, field = "taskDefinition") {
  assertExactKeys(input, ["schemaVersion", "taskId", "definitionVersion", "foodReviewDefinition", "manualCreationDefinition"], field, "INVALID_BARCODE_TASK_DEFINITION");
  if (input.schemaVersion !== "BARCODE_LOOKUP_TASK_DEFINITION_V1") fail(`${field}.schemaVersion is unsupported`, "INVALID_BARCODE_TASK_DEFINITION", { field: `${field}.schemaVersion` });
  return immutable({
    schemaVersion: input.schemaVersion,
    taskId: identifier(input.taskId, `${field}.taskId`, "INVALID_BARCODE_TASK_DEFINITION"),
    definitionVersion: identifier(input.definitionVersion, `${field}.definitionVersion`, "INVALID_BARCODE_TASK_DEFINITION"),
    foodReviewDefinition: opaqueDefinition(input.foodReviewDefinition, `${field}.foodReviewDefinition`),
    manualCreationDefinition: opaqueDefinition(input.manualCreationDefinition, `${field}.manualCreationDefinition`),
  });
}

function buildState(core) {
  const normalizedCore = immutable({ ...core, boundary: BOUNDARY });
  return immutable({ ...normalizedCore, stateFingerprint: fingerprint(normalizedCore) });
}

function expectedNextAction(phase) {
  return {
    [PHASES.AWAITING_GTIN]: "ACCEPT_CAMERA_RESULT_OR_MANUAL_DIGITS",
    [PHASES.CANDIDATE_SELECTION_REQUIRED]: "SHOW_LOCAL_CANDIDATES_AND_REQUIRE_EXPLICIT_SELECTION",
    [PHASES.FOOD_REVIEW_READY]: "OPEN_CALLER_DEFINED_FOOD_REVIEW_WITHOUT_SAVING",
    [PHASES.MANUAL_CREATION_READY]: "OPEN_CALLER_DEFINED_MANUAL_CREATION_WITH_GTIN",
  }[phase];
}

function lookupEvidenceFromResult(result, inputSource) {
  if (result.mode !== "LOCAL_EXACT_GTIN" || result.networkFallback !== "FORBIDDEN" || !["MATCHED", "NOT_FOUND"].includes(result.status)) fail("catalog returned an invalid lookup result", "INVALID_LOCAL_CATALOG_RESULT");
  const core = immutable({ schemaVersion: "BARCODE_LOOKUP_EVIDENCE_V1", gtin: result.gtin, inputSource, status: result.status, catalogEmpty: result.catalogEmpty, candidates: result.candidates });
  return immutable({ ...core, lookupFingerprint: fingerprint(core) });
}

function normalizeLookupEvidence(input, field = "lookupEvidence") {
  if (input === null) return null;
  assertExactKeys(input, ["schemaVersion", "gtin", "inputSource", "status", "catalogEmpty", "candidates", "lookupFingerprint"], field, "INVALID_BARCODE_LOOKUP_EVIDENCE");
  if (input.schemaVersion !== "BARCODE_LOOKUP_EVIDENCE_V1" || typeof input.gtin !== "string" || !GTIN.test(input.gtin) || !Object.values(INPUT_SOURCES).includes(input.inputSource) || !["MATCHED", "NOT_FOUND"].includes(input.status) || typeof input.catalogEmpty !== "boolean" || !Array.isArray(input.candidates) || !SHA256.test(input.lookupFingerprint)) fail(`${field} is invalid`, "INVALID_BARCODE_LOOKUP_EVIDENCE", { field });
  validateBoundedJson(input.candidates, `${field}.candidates`, {
    invalid: "INVALID_BARCODE_LOOKUP_EVIDENCE",
    tooLarge: "BARCODE_LOOKUP_EVIDENCE_TOO_LARGE",
  });
  if ((input.status === "MATCHED" && (input.candidates.length === 0 || input.catalogEmpty)) || (input.status === "NOT_FOUND" && input.candidates.length !== 0)) fail(`${field} result semantics are invalid`, "INVALID_BARCODE_LOOKUP_EVIDENCE", { field });
  const candidateIds = input.candidates.map((candidate, index) => {
    assertPlainRecord(candidate, `${field}.candidates[${index}]`, "INVALID_BARCODE_LOOKUP_EVIDENCE");
    return qualifiedFoodId(candidate.id, `${field}.candidates[${index}].id`, "INVALID_BARCODE_LOOKUP_EVIDENCE");
  });
  if (new Set(candidateIds).size !== candidateIds.length) fail(`${field} contains duplicate candidates`, "INVALID_BARCODE_LOOKUP_EVIDENCE", { field });
  const { lookupFingerprint: ignored, ...core } = input;
  if (input.lookupFingerprint !== fingerprint(core)) fail(`${field}.lookupFingerprint is invalid`, "INVALID_BARCODE_LOOKUP_EVIDENCE", { field: `${field}.lookupFingerprint` });
  return immutable(input);
}

function normalizeState(input, field = "state", catalog = null) {
  assertExactKeys(input, ["schemaVersion", "operationId", "revision", "taskContext", "taskContextFingerprint", "taskDefinition", "taskDefinitionFingerprint", "phase", "lookupEvidence", "selectedCandidateId", "nextAction", "boundary", "stateFingerprint"], field, "INVALID_BARCODE_LOOKUP_STATE");
  if (input.schemaVersion !== "BARCODE_LOOKUP_STATE_V1" || !Number.isSafeInteger(input.revision) || input.revision < 0 || !Object.values(PHASES).includes(input.phase) || !SHA256.test(input.taskContextFingerprint) || !SHA256.test(input.taskDefinitionFingerprint) || !SHA256.test(input.stateFingerprint) || !isDeepStrictEqual(input.boundary, BOUNDARY)) fail(`${field} is invalid`, "INVALID_BARCODE_LOOKUP_STATE", { field });
  identifier(input.operationId, `${field}.operationId`, "INVALID_BARCODE_LOOKUP_STATE");
  const taskContext = opaqueDefinition(input.taskContext, `${field}.taskContext`);
  const taskDefinition = normalizeTaskDefinition(input.taskDefinition, `${field}.taskDefinition`);
  if (input.taskContextFingerprint !== fingerprint(taskContext) || input.taskDefinitionFingerprint !== fingerprint(taskDefinition) || input.nextAction !== expectedNextAction(input.phase)) fail(`${field} contains invalid derived evidence`, "INVALID_BARCODE_LOOKUP_STATE", { field });
  const lookupEvidence = normalizeLookupEvidence(input.lookupEvidence, `${field}.lookupEvidence`);
  if (input.phase === PHASES.AWAITING_GTIN && (lookupEvidence !== null || input.selectedCandidateId !== null)) fail(`${field} awaiting state is invalid`, "INVALID_BARCODE_LOOKUP_STATE", { field });
  if (input.phase === PHASES.CANDIDATE_SELECTION_REQUIRED && (lookupEvidence?.status !== "MATCHED" || input.selectedCandidateId !== null)) fail(`${field} candidate state is invalid`, "INVALID_BARCODE_LOOKUP_STATE", { field });
  if (input.phase === PHASES.FOOD_REVIEW_READY) {
    if (lookupEvidence?.status !== "MATCHED" || !lookupEvidence.candidates.some(({ id }) => id === input.selectedCandidateId)) fail(`${field} review state is invalid`, "INVALID_BARCODE_LOOKUP_STATE", { field });
  }
  if (input.phase === PHASES.MANUAL_CREATION_READY && (lookupEvidence?.status !== "NOT_FOUND" || input.selectedCandidateId !== null)) fail(`${field} manual state is invalid`, "INVALID_BARCODE_LOOKUP_STATE", { field });
  if (lookupEvidence !== null) {
    if (catalog === null) fail("local catalog port is required to validate lookup evidence", "LOCAL_CATALOG_PORT_REQUIRED");
    const expectedEvidence = lookupEvidenceFromResult(lookupLocalFoodByGtin(catalog, lookupEvidence.gtin), lookupEvidence.inputSource);
    if (!isDeepStrictEqual(lookupEvidence, expectedEvidence)) fail(`${field}.lookupEvidence does not match the local catalog`, "BARCODE_LOOKUP_CATALOG_EVIDENCE_MISMATCH", { field: `${field}.lookupEvidence` });
  }
  const { stateFingerprint: ignored, ...core } = input;
  if (input.stateFingerprint !== fingerprint(core)) fail(`${field}.stateFingerprint is invalid`, "INVALID_BARCODE_LOOKUP_STATE", { field: `${field}.stateFingerprint` });
  return immutable(input);
}

function createBarcodeLookupState(input) {
  assertExactKeys(input, ["schemaVersion", "operationId", "taskContext", "taskDefinition"], "start", "INVALID_BARCODE_LOOKUP_START");
  if (input.schemaVersion !== "BARCODE_LOOKUP_START_V1") fail("start.schemaVersion is unsupported", "INVALID_BARCODE_LOOKUP_START");
  const taskContext = opaqueDefinition(input.taskContext, "start.taskContext");
  const taskDefinition = normalizeTaskDefinition(input.taskDefinition, "start.taskDefinition");
  return buildState({
    schemaVersion: "BARCODE_LOOKUP_STATE_V1",
    operationId: identifier(input.operationId, "start.operationId", "INVALID_BARCODE_LOOKUP_START"),
    revision: 0,
    taskContext,
    taskContextFingerprint: fingerprint(taskContext),
    taskDefinition,
    taskDefinitionFingerprint: fingerprint(taskDefinition),
    phase: PHASES.AWAITING_GTIN,
    lookupEvidence: null,
    selectedCandidateId: null,
    nextAction: expectedNextAction(PHASES.AWAITING_GTIN),
  });
}

function normalizeCommand(input, field = "command") {
  assertPlainRecord(input, field, "INVALID_BARCODE_LOOKUP_COMMAND");
  if (input.schemaVersion !== "BARCODE_LOOKUP_COMMAND_V1" || !Object.values(COMMAND_TYPES).includes(input.type)) fail(`${field} is unsupported`, "INVALID_BARCODE_LOOKUP_COMMAND", { field });
  const common = ["schemaVersion", "commandId", "type", "operationId", "expectedRevision"];
  const required = input.type === COMMAND_TYPES.SUBMIT_GTIN ? [...common, "inputSource", "gtin"] : input.type === COMMAND_TYPES.SELECT_CANDIDATE ? [...common, "lookupFingerprint", "candidateId"] : common;
  assertExactKeys(input, required, field, "INVALID_BARCODE_LOOKUP_COMMAND");
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) fail(`${field}.expectedRevision is invalid`, "INVALID_BARCODE_LOOKUP_COMMAND", { field: `${field}.expectedRevision` });
  const normalized = { ...input, commandId: identifier(input.commandId, `${field}.commandId`, "INVALID_BARCODE_LOOKUP_COMMAND"), operationId: identifier(input.operationId, `${field}.operationId`, "INVALID_BARCODE_LOOKUP_COMMAND") };
  if (input.type === COMMAND_TYPES.SUBMIT_GTIN && (!Object.values(INPUT_SOURCES).includes(input.inputSource) || typeof input.gtin !== "string" || !GTIN.test(input.gtin))) fail(`${field} GTIN or input source is invalid`, "INVALID_BARCODE_LOOKUP_COMMAND", { field });
  if (input.type === COMMAND_TYPES.SELECT_CANDIDATE && (!SHA256.test(input.lookupFingerprint) || typeof input.candidateId !== "string" || !QUALIFIED_FOOD_ID.test(input.candidateId))) fail(`${field} selection is invalid`, "INVALID_BARCODE_LOOKUP_COMMAND", { field });
  return immutable(normalized);
}

function transitionBarcodeLookup(stateInput, commandInput, ports = {}) {
  const state = normalizeState(stateInput, "state", ports.catalog ?? null);
  const command = normalizeCommand(commandInput);
  if (command.operationId !== state.operationId) fail("command targets another operation", "BARCODE_LOOKUP_OPERATION_MISMATCH");
  if (command.expectedRevision !== state.revision) fail("command revision is stale", "STALE_BARCODE_LOOKUP_REVISION", { expected: command.expectedRevision, actual: state.revision });
  const base = { ...state, revision: state.revision + 1 };
  delete base.stateFingerprint;

  if (command.type === COMMAND_TYPES.SUBMIT_GTIN) {
    if (state.phase !== PHASES.AWAITING_GTIN) fail("GTIN cannot be submitted in this phase", "INVALID_BARCODE_LOOKUP_TRANSITION");
    if (!ports.catalog) fail("local catalog port is required", "LOCAL_CATALOG_PORT_REQUIRED");
    const result = lookupLocalFoodByGtin(ports.catalog, command.gtin);
    if (result.gtin !== command.gtin) fail("catalog returned another GTIN", "INVALID_LOCAL_CATALOG_RESULT");
    const lookupEvidence = lookupEvidenceFromResult(result, command.inputSource);
    const phase = result.status === "MATCHED" ? PHASES.CANDIDATE_SELECTION_REQUIRED : PHASES.MANUAL_CREATION_READY;
    return buildState({ ...base, phase, lookupEvidence, selectedCandidateId: null, nextAction: expectedNextAction(phase) });
  }

  if (command.type === COMMAND_TYPES.SELECT_CANDIDATE) {
    if (state.phase !== PHASES.CANDIDATE_SELECTION_REQUIRED || command.lookupFingerprint !== state.lookupEvidence.lookupFingerprint) fail("candidate selection does not bind the active lookup", "BARCODE_LOOKUP_EVIDENCE_MISMATCH");
    if (!state.lookupEvidence.candidates.some(({ id }) => id === command.candidateId)) fail("selected candidate is not in the local lookup result", "UNKNOWN_BARCODE_CANDIDATE");
    return buildState({ ...base, phase: PHASES.FOOD_REVIEW_READY, selectedCandidateId: command.candidateId, nextAction: expectedNextAction(PHASES.FOOD_REVIEW_READY) });
  }

  if (state.phase === PHASES.AWAITING_GTIN) fail("there is no lookup to retry", "INVALID_BARCODE_LOOKUP_TRANSITION");
  return buildState({ ...base, phase: PHASES.AWAITING_GTIN, lookupEvidence: null, selectedCandidateId: null, nextAction: expectedNextAction(PHASES.AWAITING_GTIN) });
}

function validateBarcodeLookupState(input, catalog = null) {
  return normalizeState(input, "state", catalog);
}

export {
  BOUNDARY,
  COMMAND_TYPES,
  INPUT_SOURCES,
  PHASES,
  createBarcodeLookupState,
  normalizeTaskDefinition,
  transitionBarcodeLookup,
  validateBarcodeLookupState,
};
