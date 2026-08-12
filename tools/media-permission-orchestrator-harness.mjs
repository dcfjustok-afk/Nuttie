import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_DEFINITION_BYTES = 65536;
const MAX_JSON_NODES = 2048;
const MAX_JSON_DEPTH = 20;
const MAX_OBJECT_KEYS = 256;
const MAX_ARRAY_ITEMS = 1024;
const MAX_STRING_LENGTH = 8192;

const INPUT_MODES = Object.freeze({
  CAMERA_CAPTURE: "CAMERA_CAPTURE",
  USER_SELECTED_MEDIA: "USER_SELECTED_MEDIA",
  MANUAL_ENTRY: "MANUAL_ENTRY",
});

const CAMERA_PERMISSION_STATES = Object.freeze({
  NOT_DETERMINED: "NOT_DETERMINED",
  AUTHORIZED: "AUTHORIZED",
  DENIED: "DENIED",
  RESTRICTED: "RESTRICTED",
});

const PHASES = Object.freeze({
  AWAITING_TASK_EXPLANATION: "AWAITING_TASK_EXPLANATION",
  AWAITING_CAMERA_PERMISSION_OUTCOME: "AWAITING_CAMERA_PERMISSION_OUTCOME",
  READY_FOR_CAMERA_TASK: "READY_FOR_CAMERA_TASK",
  READY_FOR_USER_SELECTED_MEDIA: "READY_FOR_USER_SELECTED_MEDIA",
  MANUAL_FALLBACK_READY: "MANUAL_FALLBACK_READY",
});

const COMMAND_TYPES = Object.freeze({
  ACKNOWLEDGE_TASK_EXPLANATION: "ACKNOWLEDGE_TASK_EXPLANATION",
  APPLY_CAMERA_PERMISSION_OUTCOME: "APPLY_CAMERA_PERMISSION_OUTCOME",
  REFRESH_CAMERA_PERMISSION: "REFRESH_CAMERA_PERMISSION",
  CHOOSE_MANUAL_FALLBACK: "CHOOSE_MANUAL_FALLBACK",
});

const BOUNDARY = Object.freeze({
  cameraPermissionScope: "CURRENT_USER_TRIGGERED_TASK_ONLY",
  photoLibraryPermission: "NOT_REQUESTED_USE_SYSTEM_USER_SELECTION",
  videoCapture: "NOT_AUTHORIZED",
  locationPermission: "NOT_AUTHORIZED",
  mediaRetention: "D031_NOT_AUTHORIZED",
  mediaPersistence: "NOT_AUTHORIZED",
  nativeApiCalls: 0,
  networkRequests: 0,
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
  return value;
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  }
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

function identifier(value, field, code = "INVALID_MEDIA_PERMISSION_VALUE") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function validateBoundedJson(value, field, depth = 0, budget = { nodes: 0 }, ancestors = new Set()) {
  budget.nodes += 1;
  if (budget.nodes > MAX_JSON_NODES || depth > MAX_JSON_DEPTH) fail(`${field} exceeds the JSON resource budget`, "MEDIA_PERMISSION_DEFINITION_TOO_LARGE", { field });
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) fail(`${field} exceeds the string budget`, "MEDIA_PERMISSION_DEFINITION_TOO_LARGE", { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_MEDIA_PERMISSION_DEFINITION", { field });
    return;
  }
  if (!value || typeof value !== "object") fail(`${field} contains an unsupported JSON value`, "INVALID_MEDIA_PERMISSION_DEFINITION", { field });
  if (ancestors.has(value)) fail(`${field} contains a cycle`, "INVALID_MEDIA_PERMISSION_DEFINITION", { field });
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) fail(`${field} exceeds the array budget`, "MEDIA_PERMISSION_DEFINITION_TOO_LARGE", { field });
    value.forEach((child, index) => validateBoundedJson(child, `${field}[${index}]`, depth + 1, budget, ancestors));
  } else {
    assertPlainRecord(value, field, "INVALID_MEDIA_PERMISSION_DEFINITION");
    if (Object.keys(value).length > MAX_OBJECT_KEYS) fail(`${field} exceeds the object key budget`, "MEDIA_PERMISSION_DEFINITION_TOO_LARGE", { field });
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_MEDIA_PERMISSION_DEFINITION", { field: `${field}.${key}` });
      validateBoundedJson(child, `${field}.${key}`, depth + 1, budget, ancestors);
    }
  }
  ancestors.delete(value);
}

function opaqueDefinition(value, field) {
  assertPlainRecord(value, field, "INVALID_MEDIA_PERMISSION_DEFINITION");
  validateBoundedJson(value, field);
  if (Buffer.byteLength(canonicalStringify(value), "utf8") > MAX_DEFINITION_BYTES) fail(`${field} exceeds the byte budget`, "MEDIA_PERMISSION_DEFINITION_TOO_LARGE", { field });
  return immutable(value);
}

function normalizeTaskDefinition(input, field = "taskDefinition") {
  assertExactKeys(input, ["schemaVersion", "taskId", "definitionVersion", "allowedInputModes", "taskExplanationDefinition", "manualFallbackDefinition"], [], field, "INVALID_MEDIA_TASK_DEFINITION");
  if (input.schemaVersion !== "MEDIA_TASK_DEFINITION_V1" || !Array.isArray(input.allowedInputModes) || input.allowedInputModes.length < 1 || input.allowedInputModes.length > Object.keys(INPUT_MODES).length) fail(`${field} version or input modes are invalid`, "INVALID_MEDIA_TASK_DEFINITION", { field });
  const allowedInputModes = [...input.allowedInputModes];
  if (new Set(allowedInputModes).size !== allowedInputModes.length || allowedInputModes.some((mode) => !Object.values(INPUT_MODES).includes(mode))) fail(`${field}.allowedInputModes is invalid`, "INVALID_MEDIA_TASK_DEFINITION", { field: `${field}.allowedInputModes` });
  if (allowedInputModes.includes(INPUT_MODES.CAMERA_CAPTURE) && !allowedInputModes.includes(INPUT_MODES.MANUAL_ENTRY)) fail("camera tasks must retain a manual fallback", "MEDIA_TASK_MANUAL_FALLBACK_REQUIRED", { field: `${field}.allowedInputModes` });
  return immutable({
    schemaVersion: "MEDIA_TASK_DEFINITION_V1",
    taskId: identifier(input.taskId, `${field}.taskId`, "INVALID_MEDIA_TASK_DEFINITION"),
    definitionVersion: identifier(input.definitionVersion, `${field}.definitionVersion`, "INVALID_MEDIA_TASK_DEFINITION"),
    allowedInputModes,
    taskExplanationDefinition: opaqueDefinition(input.taskExplanationDefinition, `${field}.taskExplanationDefinition`),
    manualFallbackDefinition: opaqueDefinition(input.manualFallbackDefinition, `${field}.manualFallbackDefinition`),
  });
}

function normalizePermissionEvidence(input, field = "permissionEvidence") {
  assertExactKeys(input, ["schemaVersion", "permission", "state", "revision"], [], field, "INVALID_CAMERA_PERMISSION_EVIDENCE");
  if (input.schemaVersion !== "CAMERA_PERMISSION_EVIDENCE_V1" || input.permission !== "CAMERA" || !Object.values(CAMERA_PERMISSION_STATES).includes(input.state) || !Number.isSafeInteger(input.revision) || input.revision < 0) fail(`${field} is invalid`, "INVALID_CAMERA_PERMISSION_EVIDENCE", { field });
  return immutable(input);
}

function buildState(core) {
  const normalizedCore = immutable({ ...core, boundary: BOUNDARY });
  return immutable({ ...normalizedCore, stateFingerprint: fingerprint(normalizedCore) });
}

function normalizeState(input, field = "state") {
  assertExactKeys(input, ["schemaVersion", "operationId", "revision", "taskDefinition", "taskDefinitionFingerprint", "requestedInputMode", "phase", "cameraPermissionEvidence", "pendingEffect", "manualFallbackAvailable", "nextAction", "boundary", "stateFingerprint"], [], field, "INVALID_MEDIA_PERMISSION_STATE");
  if (input.schemaVersion !== "MEDIA_PERMISSION_STATE_V1" || !Number.isSafeInteger(input.revision) || input.revision < 0 || !Object.values(PHASES).includes(input.phase) || !SHA256.test(input.stateFingerprint)) fail(`${field} is invalid`, "INVALID_MEDIA_PERMISSION_STATE", { field });
  const taskDefinition = normalizeTaskDefinition(input.taskDefinition, `${field}.taskDefinition`);
  identifier(input.operationId, `${field}.operationId`, "INVALID_MEDIA_PERMISSION_STATE");
  if (!taskDefinition.allowedInputModes.includes(input.requestedInputMode) || input.taskDefinitionFingerprint !== fingerprint(taskDefinition) || typeof input.manualFallbackAvailable !== "boolean" || !isDeepStrictEqual(input.boundary, BOUNDARY)) fail(`${field} contains invalid derived evidence`, "INVALID_MEDIA_PERMISSION_STATE", { field });
  const permissionEvidence = input.cameraPermissionEvidence === null ? null : normalizePermissionEvidence(input.cameraPermissionEvidence, `${field}.cameraPermissionEvidence`);
  if (input.requestedInputMode === INPUT_MODES.CAMERA_CAPTURE && permissionEvidence === null) fail(`${field} lacks camera permission evidence`, "INVALID_MEDIA_PERMISSION_STATE", { field });
  if (input.requestedInputMode !== INPUT_MODES.CAMERA_CAPTURE && permissionEvidence !== null) fail(`${field} contains unrelated camera permission evidence`, "INVALID_MEDIA_PERMISSION_STATE", { field });
  const pendingEffect = input.pendingEffect === null ? null : normalizeEffect(input.pendingEffect, taskDefinition, input.operationId, `${field}.pendingEffect`);
  const expectedManualFallback = taskDefinition.allowedInputModes.includes(INPUT_MODES.MANUAL_ENTRY);
  if (input.manualFallbackAvailable !== expectedManualFallback) fail(`${field}.manualFallbackAvailable is invalid`, "INVALID_MEDIA_PERMISSION_STATE", { field: `${field}.manualFallbackAvailable` });
  const expectedNextAction = {
    [PHASES.AWAITING_TASK_EXPLANATION]: "SHOW_CALLER_DEFINED_TASK_EXPLANATION",
    [PHASES.AWAITING_CAMERA_PERMISSION_OUTCOME]: "EXECUTE_PENDING_CAMERA_PERMISSION_EFFECT",
    [PHASES.READY_FOR_CAMERA_TASK]: "OPEN_CAMERA_FOR_CURRENT_TASK",
    [PHASES.READY_FOR_USER_SELECTED_MEDIA]: "OPEN_SYSTEM_USER_SELECTION_WITHOUT_LIBRARY_PERMISSION",
    [PHASES.MANUAL_FALLBACK_READY]: "OPEN_CALLER_DEFINED_MANUAL_FALLBACK",
  }[input.phase];
  if (input.nextAction !== expectedNextAction) fail(`${field}.nextAction is invalid`, "INVALID_MEDIA_PERMISSION_STATE", { field: `${field}.nextAction` });
  if (input.phase === PHASES.AWAITING_CAMERA_PERMISSION_OUTCOME) {
    if (input.requestedInputMode !== INPUT_MODES.CAMERA_CAPTURE || permissionEvidence?.state !== CAMERA_PERMISSION_STATES.NOT_DETERMINED || pendingEffect === null || pendingEffect.stateRevision !== input.revision) fail(`${field} permission request phase is invalid`, "INVALID_MEDIA_PERMISSION_STATE", { field });
  } else if (pendingEffect !== null) fail(`${field} has an effect outside the permission request phase`, "INVALID_MEDIA_PERMISSION_STATE", { field: `${field}.pendingEffect` });
  if (input.phase === PHASES.AWAITING_TASK_EXPLANATION && (input.requestedInputMode !== INPUT_MODES.CAMERA_CAPTURE || permissionEvidence?.state !== CAMERA_PERMISSION_STATES.NOT_DETERMINED)) fail(`${field} explanation phase is invalid`, "INVALID_MEDIA_PERMISSION_STATE", { field });
  if (input.phase === PHASES.READY_FOR_CAMERA_TASK && (input.requestedInputMode !== INPUT_MODES.CAMERA_CAPTURE || permissionEvidence?.state !== CAMERA_PERMISSION_STATES.AUTHORIZED)) fail(`${field} camera-ready phase is invalid`, "INVALID_MEDIA_PERMISSION_STATE", { field });
  if (input.phase === PHASES.READY_FOR_USER_SELECTED_MEDIA && input.requestedInputMode !== INPUT_MODES.USER_SELECTED_MEDIA) fail(`${field} selected-media phase is invalid`, "INVALID_MEDIA_PERMISSION_STATE", { field });
  if (input.phase === PHASES.MANUAL_FALLBACK_READY && !expectedManualFallback) fail(`${field} manual fallback phase is invalid`, "INVALID_MEDIA_PERMISSION_STATE", { field });
  const { stateFingerprint: ignored, ...core } = input;
  if (input.stateFingerprint !== fingerprint(core)) fail(`${field}.stateFingerprint is invalid`, "INVALID_MEDIA_PERMISSION_STATE", { field: `${field}.stateFingerprint` });
  return immutable(input);
}

function normalizeEffect(input, taskDefinition, operationId, field = "effect") {
  assertExactKeys(input, ["schemaVersion", "effectId", "operationId", "stateRevision", "kind", "permission", "taskDefinitionFingerprint", "effectFingerprint"], [], field, "INVALID_MEDIA_PERMISSION_EFFECT");
  if (input.schemaVersion !== "MEDIA_PERMISSION_EFFECT_V1" || input.kind !== "REQUEST_CAMERA_FOR_CURRENT_TASK" || input.permission !== "CAMERA" || input.operationId !== operationId || input.taskDefinitionFingerprint !== fingerprint(taskDefinition) || !Number.isSafeInteger(input.stateRevision) || input.stateRevision < 1 || !SHA256.test(input.effectFingerprint)) fail(`${field} is invalid`, "INVALID_MEDIA_PERMISSION_EFFECT", { field });
  identifier(input.effectId, `${field}.effectId`, "INVALID_MEDIA_PERMISSION_EFFECT");
  const { effectFingerprint: ignored, ...core } = input;
  if (input.effectFingerprint !== fingerprint(core)) fail(`${field}.effectFingerprint is invalid`, "INVALID_MEDIA_PERMISSION_EFFECT", { field: `${field}.effectFingerprint` });
  return immutable(input);
}

function createMediaTaskState(input) {
  assertExactKeys(input, ["schemaVersion", "operationId", "taskDefinition", "requestedInputMode", "cameraPermissionEvidence"], [], "start", "INVALID_MEDIA_TASK_START");
  if (input.schemaVersion !== "MEDIA_TASK_START_V1") fail("start.schemaVersion is unsupported", "INVALID_MEDIA_TASK_START", { field: "start.schemaVersion" });
  const taskDefinition = normalizeTaskDefinition(input.taskDefinition);
  const requestedInputMode = input.requestedInputMode;
  if (!taskDefinition.allowedInputModes.includes(requestedInputMode)) fail("requested input mode is not allowed by the task", "MEDIA_TASK_INPUT_MODE_NOT_ALLOWED", { requestedInputMode });
  const operationId = identifier(input.operationId, "start.operationId", "INVALID_MEDIA_TASK_START");
  const taskDefinitionFingerprint = fingerprint(taskDefinition);
  const base = {
    schemaVersion: "MEDIA_PERMISSION_STATE_V1",
    operationId,
    revision: 0,
    taskDefinition,
    taskDefinitionFingerprint,
    requestedInputMode,
    pendingEffect: null,
    manualFallbackAvailable: taskDefinition.allowedInputModes.includes(INPUT_MODES.MANUAL_ENTRY),
  };
  if (requestedInputMode === INPUT_MODES.USER_SELECTED_MEDIA) {
    if (input.cameraPermissionEvidence !== null) fail("user-selected media must not inspect camera permission", "UNRELATED_MEDIA_PERMISSION_EVIDENCE", { field: "start.cameraPermissionEvidence" });
    return buildState({ ...base, phase: PHASES.READY_FOR_USER_SELECTED_MEDIA, cameraPermissionEvidence: null, nextAction: "OPEN_SYSTEM_USER_SELECTION_WITHOUT_LIBRARY_PERMISSION" });
  }
  if (requestedInputMode === INPUT_MODES.MANUAL_ENTRY) {
    if (input.cameraPermissionEvidence !== null) fail("manual entry must not inspect camera permission", "UNRELATED_MEDIA_PERMISSION_EVIDENCE", { field: "start.cameraPermissionEvidence" });
    return buildState({ ...base, phase: PHASES.MANUAL_FALLBACK_READY, cameraPermissionEvidence: null, nextAction: "OPEN_CALLER_DEFINED_MANUAL_FALLBACK" });
  }
  const permissionEvidence = normalizePermissionEvidence(input.cameraPermissionEvidence);
  if (permissionEvidence.state === CAMERA_PERMISSION_STATES.NOT_DETERMINED) return buildState({ ...base, phase: PHASES.AWAITING_TASK_EXPLANATION, cameraPermissionEvidence: permissionEvidence, nextAction: "SHOW_CALLER_DEFINED_TASK_EXPLANATION" });
  if (permissionEvidence.state === CAMERA_PERMISSION_STATES.AUTHORIZED) return buildState({ ...base, phase: PHASES.READY_FOR_CAMERA_TASK, cameraPermissionEvidence: permissionEvidence, nextAction: "OPEN_CAMERA_FOR_CURRENT_TASK" });
  return buildState({ ...base, phase: PHASES.MANUAL_FALLBACK_READY, cameraPermissionEvidence: permissionEvidence, nextAction: "OPEN_CALLER_DEFINED_MANUAL_FALLBACK" });
}

function normalizeCommand(input, field = "command") {
  assertPlainRecord(input, field, "INVALID_MEDIA_PERMISSION_COMMAND");
  if (input.schemaVersion !== "MEDIA_PERMISSION_COMMAND_V1" || !Object.values(COMMAND_TYPES).includes(input.type)) fail(`${field} version or type is unsupported`, "INVALID_MEDIA_PERMISSION_COMMAND", { field });
  if (input.type === COMMAND_TYPES.ACKNOWLEDGE_TASK_EXPLANATION) {
    assertExactKeys(input, ["schemaVersion", "commandId", "type", "operationId", "expectedRevision", "effectId"], [], field, "INVALID_MEDIA_PERMISSION_COMMAND");
    return immutable({ ...input, commandId: identifier(input.commandId, `${field}.commandId`, "INVALID_MEDIA_PERMISSION_COMMAND"), operationId: identifier(input.operationId, `${field}.operationId`, "INVALID_MEDIA_PERMISSION_COMMAND"), effectId: identifier(input.effectId, `${field}.effectId`, "INVALID_MEDIA_PERMISSION_COMMAND") });
  }
  if (input.type === COMMAND_TYPES.APPLY_CAMERA_PERMISSION_OUTCOME) {
    assertExactKeys(input, ["schemaVersion", "commandId", "type", "operationId", "expectedRevision", "effectFingerprint", "permissionEvidence"], [], field, "INVALID_MEDIA_PERMISSION_COMMAND");
    if (!SHA256.test(input.effectFingerprint)) fail(`${field}.effectFingerprint is invalid`, "INVALID_MEDIA_PERMISSION_COMMAND", { field: `${field}.effectFingerprint` });
    const permissionEvidence = normalizePermissionEvidence(input.permissionEvidence, `${field}.permissionEvidence`);
    if (![CAMERA_PERMISSION_STATES.AUTHORIZED, CAMERA_PERMISSION_STATES.DENIED, CAMERA_PERMISSION_STATES.RESTRICTED].includes(permissionEvidence.state)) fail("permission outcome must be terminal", "INVALID_MEDIA_PERMISSION_COMMAND", { field: `${field}.permissionEvidence.state` });
    return immutable({ ...input, commandId: identifier(input.commandId, `${field}.commandId`, "INVALID_MEDIA_PERMISSION_COMMAND"), operationId: identifier(input.operationId, `${field}.operationId`, "INVALID_MEDIA_PERMISSION_COMMAND"), permissionEvidence });
  }
  if (input.type === COMMAND_TYPES.REFRESH_CAMERA_PERMISSION) {
    assertExactKeys(input, ["schemaVersion", "commandId", "type", "operationId", "expectedRevision", "permissionEvidence"], [], field, "INVALID_MEDIA_PERMISSION_COMMAND");
    return immutable({ ...input, commandId: identifier(input.commandId, `${field}.commandId`, "INVALID_MEDIA_PERMISSION_COMMAND"), operationId: identifier(input.operationId, `${field}.operationId`, "INVALID_MEDIA_PERMISSION_COMMAND"), permissionEvidence: normalizePermissionEvidence(input.permissionEvidence, `${field}.permissionEvidence`) });
  }
  assertExactKeys(input, ["schemaVersion", "commandId", "type", "operationId", "expectedRevision"], [], field, "INVALID_MEDIA_PERMISSION_COMMAND");
  return immutable({ ...input, commandId: identifier(input.commandId, `${field}.commandId`, "INVALID_MEDIA_PERMISSION_COMMAND"), operationId: identifier(input.operationId, `${field}.operationId`, "INVALID_MEDIA_PERMISSION_COMMAND") });
}

function transitionMediaTask(stateInput, commandInput) {
  const state = normalizeState(stateInput);
  const command = normalizeCommand(commandInput);
  if (command.operationId !== state.operationId) fail("command targets another operation", "MEDIA_PERMISSION_OPERATION_MISMATCH");
  if (!Number.isSafeInteger(command.expectedRevision) || command.expectedRevision !== state.revision) fail("command revision is stale", "STALE_MEDIA_PERMISSION_REVISION", { expected: command.expectedRevision, actual: state.revision });
  const nextRevision = state.revision + 1;
  const base = { ...state, revision: nextRevision };
  delete base.stateFingerprint;

  if (command.type === COMMAND_TYPES.ACKNOWLEDGE_TASK_EXPLANATION) {
    if (state.phase !== PHASES.AWAITING_TASK_EXPLANATION || state.requestedInputMode !== INPUT_MODES.CAMERA_CAPTURE || state.cameraPermissionEvidence.state !== CAMERA_PERMISSION_STATES.NOT_DETERMINED) fail("task explanation cannot be acknowledged in this state", "INVALID_MEDIA_PERMISSION_TRANSITION");
    const effectCore = immutable({ schemaVersion: "MEDIA_PERMISSION_EFFECT_V1", effectId: command.effectId, operationId: state.operationId, stateRevision: nextRevision, kind: "REQUEST_CAMERA_FOR_CURRENT_TASK", permission: "CAMERA", taskDefinitionFingerprint: state.taskDefinitionFingerprint });
    const pendingEffect = immutable({ ...effectCore, effectFingerprint: fingerprint(effectCore) });
    return buildState({ ...base, phase: PHASES.AWAITING_CAMERA_PERMISSION_OUTCOME, pendingEffect, nextAction: "EXECUTE_PENDING_CAMERA_PERMISSION_EFFECT" });
  }

  if (command.type === COMMAND_TYPES.APPLY_CAMERA_PERMISSION_OUTCOME) {
    if (state.phase !== PHASES.AWAITING_CAMERA_PERMISSION_OUTCOME || state.pendingEffect === null || command.effectFingerprint !== state.pendingEffect.effectFingerprint) fail("permission outcome does not bind the pending effect", "MEDIA_PERMISSION_EFFECT_MISMATCH");
    if (command.permissionEvidence.revision <= state.cameraPermissionEvidence.revision) fail("permission evidence revision did not advance", "STALE_CAMERA_PERMISSION_EVIDENCE");
    if (command.permissionEvidence.state === CAMERA_PERMISSION_STATES.AUTHORIZED) return buildState({ ...base, phase: PHASES.READY_FOR_CAMERA_TASK, cameraPermissionEvidence: command.permissionEvidence, pendingEffect: null, nextAction: "OPEN_CAMERA_FOR_CURRENT_TASK" });
    return buildState({ ...base, phase: PHASES.MANUAL_FALLBACK_READY, cameraPermissionEvidence: command.permissionEvidence, pendingEffect: null, nextAction: "OPEN_CALLER_DEFINED_MANUAL_FALLBACK" });
  }

  if (command.type === COMMAND_TYPES.REFRESH_CAMERA_PERMISSION) {
    if (state.requestedInputMode !== INPUT_MODES.CAMERA_CAPTURE || state.phase === PHASES.AWAITING_CAMERA_PERMISSION_OUTCOME || command.permissionEvidence.revision <= state.cameraPermissionEvidence.revision) fail("camera permission refresh is stale or invalid", "INVALID_MEDIA_PERMISSION_TRANSITION");
    if (command.permissionEvidence.state === CAMERA_PERMISSION_STATES.AUTHORIZED) return buildState({ ...base, phase: PHASES.READY_FOR_CAMERA_TASK, cameraPermissionEvidence: command.permissionEvidence, pendingEffect: null, nextAction: "OPEN_CAMERA_FOR_CURRENT_TASK" });
    if ([CAMERA_PERMISSION_STATES.DENIED, CAMERA_PERMISSION_STATES.RESTRICTED].includes(command.permissionEvidence.state)) return buildState({ ...base, phase: PHASES.MANUAL_FALLBACK_READY, cameraPermissionEvidence: command.permissionEvidence, pendingEffect: null, nextAction: "OPEN_CALLER_DEFINED_MANUAL_FALLBACK" });
    return buildState({ ...base, phase: PHASES.AWAITING_TASK_EXPLANATION, cameraPermissionEvidence: command.permissionEvidence, pendingEffect: null, nextAction: "SHOW_CALLER_DEFINED_TASK_EXPLANATION" });
  }

  if (!state.manualFallbackAvailable) fail("task has no manual fallback", "MEDIA_TASK_MANUAL_FALLBACK_REQUIRED");
  return buildState({ ...base, phase: PHASES.MANUAL_FALLBACK_READY, pendingEffect: null, nextAction: "OPEN_CALLER_DEFINED_MANUAL_FALLBACK" });
}

export {
  BOUNDARY,
  CAMERA_PERMISSION_STATES,
  COMMAND_TYPES,
  INPUT_MODES,
  PHASES,
  createMediaTaskState,
  normalizeTaskDefinition,
  transitionMediaTask,
  normalizeState as validateMediaPermissionState,
};
