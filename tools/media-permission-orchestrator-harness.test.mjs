import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  BOUNDARY,
  CAMERA_PERMISSION_STATES,
  COMMAND_TYPES,
  INPUT_MODES,
  PHASES,
  createMediaTaskState,
  normalizeTaskDefinition,
  transitionMediaTask,
  validateMediaPermissionState,
} from "./media-permission-orchestrator-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./media-permission-orchestrator-harness.mjs", import.meta.url));

function task({ taskId = "scan-barcode", definitionVersion = "v1", allowedInputModes = [INPUT_MODES.CAMERA_CAPTURE, INPUT_MODES.MANUAL_ENTRY], taskExplanationDefinition = { contentId: "caller-explanation-v1" }, manualFallbackDefinition = { routeId: "caller-manual-v1" } } = {}) {
  return { schemaVersion: "MEDIA_TASK_DEFINITION_V1", taskId, definitionVersion, allowedInputModes, taskExplanationDefinition, manualFallbackDefinition };
}

function permission(state = CAMERA_PERMISSION_STATES.NOT_DETERMINED, revision = 0) {
  return { schemaVersion: "CAMERA_PERMISSION_EVIDENCE_V1", permission: "CAMERA", state, revision };
}

function start({ operationId = "media-operation-1", taskDefinition = task(), requestedInputMode = INPUT_MODES.CAMERA_CAPTURE, cameraPermissionEvidence = permission() } = {}) {
  return { schemaVersion: "MEDIA_TASK_START_V1", operationId, taskDefinition, requestedInputMode, cameraPermissionEvidence };
}

function command(type, state, extra = {}) {
  return { schemaVersion: "MEDIA_PERMISSION_COMMAND_V1", commandId: `command-${state.revision + 1}`, type, operationId: state.operationId, expectedRevision: state.revision, ...extra };
}

function acknowledge(state, effectId = "camera-effect-1") {
  return transitionMediaTask(state, command(COMMAND_TYPES.ACKNOWLEDGE_TASK_EXPLANATION, state, { effectId }));
}

function outcome(state, permissionState, revision = 1) {
  return transitionMediaTask(state, command(COMMAND_TYPES.APPLY_CAMERA_PERMISSION_OUTCOME, state, { effectFingerprint: state.pendingEffect.effectFingerprint, permissionEvidence: permission(permissionState, revision) }));
}

test("preserves caller-owned versioned task explanation and fallback definitions without inventing copy or routes", () => {
  const source = task({ taskExplanationDefinition: { arbitrary: { purpose: ["opaque"] } }, manualFallbackDefinition: { arbitrary: "fallback" } });
  const normalized = normalizeTaskDefinition(source);
  assert.deepEqual(normalized, source);
  assert.equal(Object.isFrozen(normalized.taskExplanationDefinition.arbitrary), true);
  for (const key of ["title", "message", "settingsLabel", "route", "retentionDays"]) assert.equal(key in normalized.taskExplanationDefinition, false);
});

test("camera-capable tasks must explicitly retain a manual entry fallback", () => {
  assert.throws(() => normalizeTaskDefinition(task({ allowedInputModes: [INPUT_MODES.CAMERA_CAPTURE] })), { code: "MEDIA_TASK_MANUAL_FALLBACK_REQUIRED" });
  assert.throws(() => normalizeTaskDefinition(task({ allowedInputModes: [INPUT_MODES.CAMERA_CAPTURE, INPUT_MODES.CAMERA_CAPTURE, INPUT_MODES.MANUAL_ENTRY] })), { code: "INVALID_MEDIA_TASK_DEFINITION" });
});

test("rejects unsafe opaque definitions, cycles, special objects, unknown modes, and oversized strings", () => {
  const unsafe = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => normalizeTaskDefinition(task({ taskExplanationDefinition: unsafe })), { code: "INVALID_MEDIA_PERMISSION_DEFINITION" });
  const cycle = {};
  cycle.self = cycle;
  assert.throws(() => normalizeTaskDefinition(task({ taskExplanationDefinition: cycle })), { code: "INVALID_MEDIA_PERMISSION_DEFINITION" });
  assert.throws(() => normalizeTaskDefinition(task({ taskExplanationDefinition: { value: new Date() } })), { code: "INVALID_MEDIA_PERMISSION_DEFINITION" });
  assert.throws(() => normalizeTaskDefinition(task({ taskExplanationDefinition: { value: Number.NaN } })), { code: "INVALID_MEDIA_PERMISSION_DEFINITION" });
  assert.throws(() => normalizeTaskDefinition(task({ taskExplanationDefinition: { value: "x".repeat(8193) } })), { code: "MEDIA_PERMISSION_DEFINITION_TOO_LARGE" });
  assert.throws(() => normalizeTaskDefinition(task({ allowedInputModes: ["VIDEO_CAPTURE", INPUT_MODES.MANUAL_ENTRY] })), { code: "INVALID_MEDIA_TASK_DEFINITION" });
});

test("a not-determined camera task first waits for task explanation and emits no native effect", () => {
  const state = createMediaTaskState(start());
  assert.equal(state.phase, PHASES.AWAITING_TASK_EXPLANATION);
  assert.equal(state.nextAction, "SHOW_CALLER_DEFINED_TASK_EXPLANATION");
  assert.equal(state.pendingEffect, null);
  assert.equal(state.boundary.nativeApiCalls, 0);
  assert.deepEqual(validateMediaPermissionState(structuredClone(state)), state);
});

test("acknowledging the current task explanation creates one narrow camera effect bound to task and revision", () => {
  const initial = createMediaTaskState(start());
  const state = acknowledge(initial);
  assert.equal(state.phase, PHASES.AWAITING_CAMERA_PERMISSION_OUTCOME);
  assert.equal(state.pendingEffect.kind, "REQUEST_CAMERA_FOR_CURRENT_TASK");
  assert.equal(state.pendingEffect.permission, "CAMERA");
  assert.equal(state.pendingEffect.stateRevision, state.revision);
  assert.equal(state.pendingEffect.taskDefinitionFingerprint, state.taskDefinitionFingerprint);
  assert.deepEqual(validateMediaPermissionState(structuredClone(state)), state);
});

test("authorized camera outcomes return to the exact task without choosing media retention", () => {
  const requested = acknowledge(createMediaTaskState(start()));
  const state = outcome(requested, CAMERA_PERMISSION_STATES.AUTHORIZED);
  assert.equal(state.phase, PHASES.READY_FOR_CAMERA_TASK);
  assert.equal(state.nextAction, "OPEN_CAMERA_FOR_CURRENT_TASK");
  assert.equal(state.pendingEffect, null);
  assert.equal(state.boundary.mediaRetention, "D031_NOT_AUTHORIZED");
  assert.equal(state.boundary.mediaPersistence, "NOT_AUTHORIZED");
});

test("denied and restricted outcomes converge to the caller-defined manual path", () => {
  for (const permissionState of [CAMERA_PERMISSION_STATES.DENIED, CAMERA_PERMISSION_STATES.RESTRICTED]) {
    const requested = acknowledge(createMediaTaskState(start({ operationId: `operation-${permissionState.toLowerCase()}` })));
    const state = outcome(requested, permissionState);
    assert.equal(state.phase, PHASES.MANUAL_FALLBACK_READY);
    assert.equal(state.nextAction, "OPEN_CALLER_DEFINED_MANUAL_FALLBACK");
    assert.equal(state.manualFallbackAvailable, true);
  }
});

test("already-authorized camera evidence opens the task without another request or explanation", () => {
  const state = createMediaTaskState(start({ cameraPermissionEvidence: permission(CAMERA_PERMISSION_STATES.AUTHORIZED, 4) }));
  assert.equal(state.phase, PHASES.READY_FOR_CAMERA_TASK);
  assert.equal(state.pendingEffect, null);
  assert.equal(state.revision, 0);
});

test("already-denied or restricted camera evidence never emits a request and preserves manual fallback", () => {
  for (const permissionState of [CAMERA_PERMISSION_STATES.DENIED, CAMERA_PERMISSION_STATES.RESTRICTED]) {
    const state = createMediaTaskState(start({ operationId: `initial-${permissionState.toLowerCase()}`, cameraPermissionEvidence: permission(permissionState, 3) }));
    assert.equal(state.phase, PHASES.MANUAL_FALLBACK_READY);
    assert.equal(state.pendingEffect, null);
  }
});

test("user-selected media uses system selection without camera or photo-library permission evidence", () => {
  const definition = task({ allowedInputModes: [INPUT_MODES.USER_SELECTED_MEDIA, INPUT_MODES.MANUAL_ENTRY] });
  const state = createMediaTaskState(start({ taskDefinition: definition, requestedInputMode: INPUT_MODES.USER_SELECTED_MEDIA, cameraPermissionEvidence: null }));
  assert.equal(state.phase, PHASES.READY_FOR_USER_SELECTED_MEDIA);
  assert.equal(state.nextAction, "OPEN_SYSTEM_USER_SELECTION_WITHOUT_LIBRARY_PERMISSION");
  assert.equal(state.cameraPermissionEvidence, null);
  assert.equal(state.boundary.photoLibraryPermission, "NOT_REQUESTED_USE_SYSTEM_USER_SELECTION");
});

test("manual entry starts ready and inspects no unrelated permission", () => {
  const definition = task({ allowedInputModes: [INPUT_MODES.MANUAL_ENTRY] });
  const state = createMediaTaskState(start({ taskDefinition: definition, requestedInputMode: INPUT_MODES.MANUAL_ENTRY, cameraPermissionEvidence: null }));
  assert.equal(state.phase, PHASES.MANUAL_FALLBACK_READY);
  assert.equal(state.cameraPermissionEvidence, null);
  assert.throws(() => createMediaTaskState(start({ taskDefinition: definition, requestedInputMode: INPUT_MODES.MANUAL_ENTRY, cameraPermissionEvidence: permission() })), { code: "UNRELATED_MEDIA_PERMISSION_EVIDENCE" });
});

test("runtime camera revocation and later authorization refresh deterministically", () => {
  const ready = createMediaTaskState(start({ cameraPermissionEvidence: permission(CAMERA_PERMISSION_STATES.AUTHORIZED, 1) }));
  const denied = transitionMediaTask(ready, command(COMMAND_TYPES.REFRESH_CAMERA_PERMISSION, ready, { permissionEvidence: permission(CAMERA_PERMISSION_STATES.DENIED, 2) }));
  assert.equal(denied.phase, PHASES.MANUAL_FALLBACK_READY);
  const authorized = transitionMediaTask(denied, command(COMMAND_TYPES.REFRESH_CAMERA_PERMISSION, denied, { permissionEvidence: permission(CAMERA_PERMISSION_STATES.AUTHORIZED, 3) }));
  assert.equal(authorized.phase, PHASES.READY_FOR_CAMERA_TASK);
});

test("users can choose manual fallback before permission or while a request result is unknown", () => {
  const initial = createMediaTaskState(start());
  const manualBefore = transitionMediaTask(initial, command(COMMAND_TYPES.CHOOSE_MANUAL_FALLBACK, initial));
  assert.equal(manualBefore.phase, PHASES.MANUAL_FALLBACK_READY);
  const requested = acknowledge(createMediaTaskState(start({ operationId: "pending-operation" })));
  const lateEffectFingerprint = requested.pendingEffect.effectFingerprint;
  const manualPending = transitionMediaTask(requested, command(COMMAND_TYPES.CHOOSE_MANUAL_FALLBACK, requested));
  assert.equal(manualPending.phase, PHASES.MANUAL_FALLBACK_READY);
  assert.equal(manualPending.pendingEffect, null);
  assert.throws(() => transitionMediaTask(manualPending, command(COMMAND_TYPES.APPLY_CAMERA_PERMISSION_OUTCOME, manualPending, { effectFingerprint: lateEffectFingerprint, permissionEvidence: permission(CAMERA_PERMISSION_STATES.AUTHORIZED, 1) })), { code: "MEDIA_PERMISSION_EFFECT_MISMATCH" });
});

test("stale revisions, wrong operations, stale permission evidence, and forged effects fail closed", () => {
  const requested = acknowledge(createMediaTaskState(start()));
  assert.throws(() => transitionMediaTask(requested, command(COMMAND_TYPES.CHOOSE_MANUAL_FALLBACK, requested, { expectedRevision: requested.revision - 1 })), { code: "STALE_MEDIA_PERMISSION_REVISION" });
  assert.throws(() => transitionMediaTask(requested, command(COMMAND_TYPES.CHOOSE_MANUAL_FALLBACK, requested, { operationId: "other-operation" })), { code: "MEDIA_PERMISSION_OPERATION_MISMATCH" });
  assert.throws(() => transitionMediaTask(requested, command(COMMAND_TYPES.APPLY_CAMERA_PERMISSION_OUTCOME, requested, { effectFingerprint: "0".repeat(64), permissionEvidence: permission(CAMERA_PERMISSION_STATES.AUTHORIZED, 1) })), { code: "MEDIA_PERMISSION_EFFECT_MISMATCH" });
  assert.throws(() => transitionMediaTask(requested, command(COMMAND_TYPES.APPLY_CAMERA_PERMISSION_OUTCOME, requested, { effectFingerprint: requested.pendingEffect.effectFingerprint, permissionEvidence: permission(CAMERA_PERMISSION_STATES.AUTHORIZED, 0) })), { code: "STALE_CAMERA_PERMISSION_EVIDENCE" });
});

test("permission outcomes cannot stay not-determined or switch to unrelated permission types", () => {
  const requested = acknowledge(createMediaTaskState(start()));
  assert.throws(() => transitionMediaTask(requested, command(COMMAND_TYPES.APPLY_CAMERA_PERMISSION_OUTCOME, requested, { effectFingerprint: requested.pendingEffect.effectFingerprint, permissionEvidence: permission(CAMERA_PERMISSION_STATES.NOT_DETERMINED, 1) })), { code: "INVALID_MEDIA_PERMISSION_COMMAND" });
  const unrelated = { ...permission(CAMERA_PERMISSION_STATES.AUTHORIZED, 1), permission: "PHOTO_LIBRARY" };
  assert.throws(() => transitionMediaTask(requested, command(COMMAND_TYPES.APPLY_CAMERA_PERMISSION_OUTCOME, requested, { effectFingerprint: requested.pendingEffect.effectFingerprint, permissionEvidence: unrelated })), { code: "INVALID_CAMERA_PERMISSION_EVIDENCE" });
});

test("state validation detects phase, next action, boundary, definition, effect, and fingerprint tampering", () => {
  const state = acknowledge(createMediaTaskState(start()));
  const mutations = [
    (value) => { value.phase = PHASES.READY_FOR_CAMERA_TASK; },
    (value) => { value.nextAction = "OPEN_VIDEO"; },
    (value) => { value.boundary.photoLibraryPermission = "FULL_LIBRARY"; },
    (value) => { value.taskDefinition.taskExplanationDefinition.changed = true; },
    (value) => { value.pendingEffect.permission = "PHOTO_LIBRARY"; },
    (value) => { value.stateFingerprint = "0".repeat(64); },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(state);
    mutate(changed);
    assert.throws(() => validateMediaPermissionState(changed));
  }
});

test("input mutation after start cannot alter the frozen state", () => {
  const definition = task({ taskExplanationDefinition: { nested: { value: "original" } } });
  const state = createMediaTaskState(start({ taskDefinition: definition }));
  definition.taskExplanationDefinition.nested.value = "changed";
  assert.equal(state.taskDefinition.taskExplanationDefinition.nested.value, "original");
  assert.equal(Object.isFrozen(state.taskDefinition.taskExplanationDefinition.nested), true);
});

test("fixed boundaries reject video, location, persistence, native calls, and network expansion", () => {
  assert.deepEqual(BOUNDARY, {
    cameraPermissionScope: "CURRENT_USER_TRIGGERED_TASK_ONLY",
    photoLibraryPermission: "NOT_REQUESTED_USE_SYSTEM_USER_SELECTION",
    videoCapture: "NOT_AUTHORIZED",
    locationPermission: "NOT_AUTHORIZED",
    mediaRetention: "D031_NOT_AUTHORIZED",
    mediaPersistence: "NOT_AUTHORIZED",
    nativeApiCalls: 0,
    networkRequests: 0,
  });
});

test("source has no native media, filesystem, network, clock, retention, or permission-string implementation", () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  for (const forbidden of [
    /expo-camera/,
    /expo-image-picker/,
    /PHPhotoLibrary/,
    /AVCaptureSession/,
    /CLLocationManager/,
    /node:fs/,
    /node:https/,
    /fetch\s*\(/,
    /Date\.now\s*\(/,
    /writeFile/,
    /retentionDays/,
    /NSCameraUsageDescription/,
    /NSPhotoLibraryUsageDescription/,
  ]) assert.doesNotMatch(source, forbidden);
});
