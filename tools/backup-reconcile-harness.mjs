import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const PENDING_PROFILE = "PENDING_D-027_D-030_D-035";
const ASSERTION_BOUNDARY = "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS";
const GENERATION_STATUSES = Object.freeze([
  "COMPLETE_OPENABLE",
  "INCOMPLETE",
  "HASH_MISMATCH",
  "KEY_UNAVAILABLE",
  "UNKNOWN",
]);
const MAX_GENERATIONS = 64;
const SAFE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SHA256_RE = /^[a-f0-9]{64}$/;

const BOUNDARY = Object.freeze({
  contractStatus: "SPIKE_FRAMEWORK_AGNOSTIC_NON_PRODUCTION",
  assertionTruth: ASSERTION_BOUNDARY,
  cryptoProfile: "PENDING_D027",
  restoreMode: "PENDING_D030",
  plaintextExport: "PENDING_D035",
  effectsCommitted: false,
  cleanupAuthorized: false,
  filesystemReads: 0,
  filesystemWrites: 0,
  keychainReads: 0,
  keychainWrites: 0,
  realNetworkRequests: 0,
  nativeApiCalls: 0,
  systemClockRead: false,
  cryptographicVerificationPerformed: false,
});

function reject(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) reject(`${field} must be a plain record`, code, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) reject(`${field} must be a plain record`, code, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) reject(`${field} contains symbol properties`, code, { field });
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!descriptor.enumerable || descriptor.get || descriptor.set) reject(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
  }
}

function assertDenseArray(value, field, code) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length > 0) reject(`${field} must be a plain array`, code, { field });
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (key !== "length" && (!descriptor.enumerable || descriptor.get || descriptor.set)) reject(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
  }
  const keys = Object.keys(value);
  if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) reject(`${field} must be dense and contain no extra properties`, code, { field });
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) reject(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  for (const key of required) if (!Object.hasOwn(value, key)) reject(`${field}.${key} is required`, code, { field: `${field}.${key}` });
}

function assertSafeId(value, field, code) {
  if (typeof value !== "string" || !SAFE_ID_RE.test(value)) reject(`${field} is invalid`, code, { field });
  return value;
}

function assertSha256(value, field, code) {
  if (typeof value !== "string" || !SHA256_RE.test(value)) reject(`${field} must be a lowercase SHA-256`, code, { field });
  return value;
}

function clone(value, seen = new Map()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const output = Array.isArray(value) ? [] : {};
  seen.set(value, output);
  for (const [key, child] of Object.entries(value)) output[key] = clone(child, seen);
  return output;
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

function createGenerationObservation(input) {
  assertExactKeys(
    input,
    ["schemaVersion", "generationId", "status", "artifactFingerprint", "evidenceId", "verifierId", "profileId"],
    [],
    "generationObservationInput",
    "INVALID_GENERATION_OBSERVATION",
  );
  if (input.schemaVersion !== "RESTORE_GENERATION_OBSERVATION_INPUT_V1") reject("generation observation input schema is unsupported", "INVALID_GENERATION_OBSERVATION");
  if (!GENERATION_STATUSES.includes(input.status)) reject("generation status is unsupported", "INVALID_GENERATION_OBSERVATION", { field: "generationObservationInput.status" });
  const core = immutable({
    schemaVersion: "RESTORE_GENERATION_OBSERVATION_V1",
    generationId: assertSafeId(input.generationId, "generationObservationInput.generationId", "INVALID_GENERATION_OBSERVATION"),
    status: input.status,
    artifactFingerprint: assertSha256(input.artifactFingerprint, "generationObservationInput.artifactFingerprint", "INVALID_GENERATION_OBSERVATION"),
    evidenceId: assertSafeId(input.evidenceId, "generationObservationInput.evidenceId", "INVALID_GENERATION_OBSERVATION"),
    verifierId: assertSafeId(input.verifierId, "generationObservationInput.verifierId", "INVALID_GENERATION_OBSERVATION"),
    profileId: assertSafeId(input.profileId, "generationObservationInput.profileId", "INVALID_GENERATION_OBSERVATION"),
    assertionBoundary: ASSERTION_BOUNDARY,
  });
  return immutable({ ...core, observationFingerprint: fingerprint(core) });
}

function normalizeGenerationObservation(input, field = "generationObservation") {
  assertExactKeys(
    input,
    ["schemaVersion", "generationId", "status", "artifactFingerprint", "evidenceId", "verifierId", "profileId", "assertionBoundary", "observationFingerprint"],
    [],
    field,
    "INVALID_GENERATION_OBSERVATION",
  );
  if (input.schemaVersion !== "RESTORE_GENERATION_OBSERVATION_V1" || input.assertionBoundary !== ASSERTION_BOUNDARY) reject("generation observation boundary is invalid", "INVALID_GENERATION_OBSERVATION", { field });
  assertSha256(input.observationFingerprint, `${field}.observationFingerprint`, "INVALID_GENERATION_OBSERVATION");
  const expected = createGenerationObservation({
    schemaVersion: "RESTORE_GENERATION_OBSERVATION_INPUT_V1",
    generationId: input.generationId,
    status: input.status,
    artifactFingerprint: input.artifactFingerprint,
    evidenceId: input.evidenceId,
    verifierId: input.verifierId,
    profileId: input.profileId,
  });
  if (!isDeepStrictEqual(input, expected)) reject("generation observation or fingerprint was changed", "INVALID_GENERATION_OBSERVATION", { field });
  return expected;
}

function createHypotheticalRestoreIntent(input) {
  assertExactKeys(
    input,
    ["schemaVersion", "operationId", "oldRef", "newRef", "expectedGenerationFingerprint", "protocol", "selectedModeId", "modeAuthorization"],
    [],
    "restoreIntentInput",
    "INVALID_RESTORE_INTENT",
  );
  if (input.schemaVersion !== "RESTORE_INTENT_INPUT_V1") reject("restore intent input schema is unsupported", "INVALID_RESTORE_INTENT");
  const oldRef = assertSafeId(input.oldRef, "restoreIntentInput.oldRef", "INVALID_RESTORE_INTENT");
  const newRef = assertSafeId(input.newRef, "restoreIntentInput.newRef", "INVALID_RESTORE_INTENT");
  if (oldRef === newRef) reject("restore intent old and new refs must differ", "INVALID_RESTORE_INTENT");
  if (input.protocol !== PENDING_PROFILE || input.selectedModeId !== null || input.modeAuthorization !== "NOT_AUTHORIZED_PENDING_D030") {
    reject("restore intent must preserve pending D-027/D-030/D-035 boundaries", "RESTORE_POLICY_NOT_AUTHORIZED");
  }
  const core = immutable({
    schemaVersion: "RESTORE_INTENT_V1",
    operationId: assertSafeId(input.operationId, "restoreIntentInput.operationId", "INVALID_RESTORE_INTENT"),
    oldRef,
    newRef,
    expectedGenerationFingerprint: assertSha256(input.expectedGenerationFingerprint, "restoreIntentInput.expectedGenerationFingerprint", "INVALID_RESTORE_INTENT"),
    protocol: PENDING_PROFILE,
    selectedModeId: null,
    modeAuthorization: "NOT_AUTHORIZED_PENDING_D030",
    intentBoundary: "HYPOTHETICAL_RECONCILE_FIXTURE_NOT_PERSISTENCE_AUTHORIZATION",
  });
  return immutable({ ...core, intentFingerprint: fingerprint(core) });
}

function normalizeRestoreIntent(input) {
  assertExactKeys(
    input,
    ["schemaVersion", "operationId", "oldRef", "newRef", "expectedGenerationFingerprint", "protocol", "selectedModeId", "modeAuthorization", "intentBoundary", "intentFingerprint"],
    [],
    "restoreIntent",
    "INVALID_RESTORE_INTENT",
  );
  if (input.schemaVersion !== "RESTORE_INTENT_V1" || input.intentBoundary !== "HYPOTHETICAL_RECONCILE_FIXTURE_NOT_PERSISTENCE_AUTHORIZATION") reject("restore intent boundary is invalid", "INVALID_RESTORE_INTENT");
  assertSha256(input.intentFingerprint, "restoreIntent.intentFingerprint", "INVALID_RESTORE_INTENT");
  const expected = createHypotheticalRestoreIntent({
    schemaVersion: "RESTORE_INTENT_INPUT_V1",
    operationId: input.operationId,
    oldRef: input.oldRef,
    newRef: input.newRef,
    expectedGenerationFingerprint: input.expectedGenerationFingerprint,
    protocol: input.protocol,
    selectedModeId: input.selectedModeId,
    modeAuthorization: input.modeAuthorization,
  });
  if (!isDeepStrictEqual(input, expected)) reject("restore intent or fingerprint was changed", "INVALID_RESTORE_INTENT");
  return expected;
}

function normalizeRef(value, field) {
  if (value === null) return null;
  return assertSafeId(value, field, "INVALID_RESTORE_OBSERVATION");
}

function createRestoreObservation(input) {
  assertExactKeys(
    input,
    ["schemaVersion", "activeRef", "previousRef", "intent", "generations"],
    [],
    "restoreObservationInput",
    "INVALID_RESTORE_OBSERVATION",
  );
  if (input.schemaVersion !== "RESTORE_OBSERVATION_INPUT_V1") reject("restore observation input schema is unsupported", "INVALID_RESTORE_OBSERVATION");
  const activeRef = normalizeRef(input.activeRef, "restoreObservationInput.activeRef");
  const previousRef = normalizeRef(input.previousRef, "restoreObservationInput.previousRef");
  if (activeRef !== null && activeRef === previousRef) reject("active and previous refs must differ", "INVALID_RESTORE_OBSERVATION");
  assertDenseArray(input.generations, "restoreObservationInput.generations", "INVALID_RESTORE_OBSERVATION");
  if (input.generations.length > MAX_GENERATIONS) reject("generation observation budget exceeded", "RESTORE_OBSERVATION_LIMIT");
  const generations = input.generations.map((entry, index) => normalizeGenerationObservation(entry, `restoreObservationInput.generations[${index}]`));
  const ids = new Set();
  for (const generation of generations) {
    if (ids.has(generation.generationId)) reject("generation IDs must be unique", "DUPLICATE_GENERATION_OBSERVATION", { generationId: generation.generationId });
    ids.add(generation.generationId);
  }
  generations.sort((left, right) => left.generationId.localeCompare(right.generationId, "en-US"));
  const intent = input.intent === null ? null : normalizeRestoreIntent(input.intent);
  const core = immutable({
    schemaVersion: "RESTORE_OBSERVATION_V1",
    activeRef,
    previousRef,
    intent,
    generations,
    assertionBoundary: ASSERTION_BOUNDARY,
  });
  return immutable({ ...core, observationFingerprint: fingerprint(core) });
}

function normalizeRestoreState(input) {
  assertExactKeys(
    input,
    ["schemaVersion", "activeRef", "previousRef", "intent", "generations", "assertionBoundary", "observationFingerprint"],
    [],
    "restoreObservation",
    "INVALID_RESTORE_OBSERVATION",
  );
  if (input.schemaVersion !== "RESTORE_OBSERVATION_V1" || input.assertionBoundary !== ASSERTION_BOUNDARY) reject("restore observation boundary is invalid", "INVALID_RESTORE_OBSERVATION");
  assertSha256(input.observationFingerprint, "restoreObservation.observationFingerprint", "INVALID_RESTORE_OBSERVATION");
  const expected = createRestoreObservation({
    schemaVersion: "RESTORE_OBSERVATION_INPUT_V1",
    activeRef: input.activeRef,
    previousRef: input.previousRef,
    intent: input.intent,
    generations: input.generations,
  });
  if (!isDeepStrictEqual(input, expected)) reject("restore observation or fingerprint was changed", "INVALID_RESTORE_OBSERVATION");
  return expected;
}

function createRestoreFixture() {
  const oldGeneration = createGenerationObservation({
    schemaVersion: "RESTORE_GENERATION_OBSERVATION_INPUT_V1",
    generationId: "gen-old",
    status: "COMPLETE_OPENABLE",
    artifactFingerprint: "1".repeat(64),
    evidenceId: "evidence-gen-old",
    verifierId: "caller-generation-observer",
    profileId: "pending-native-verifier",
  });
  return createRestoreObservation({
    schemaVersion: "RESTORE_OBSERVATION_INPUT_V1",
    activeRef: "gen-old",
    previousRef: null,
    intent: null,
    generations: [oldGeneration],
  });
}

function createPlan(observation, intent, action, targetActiveRef, targetPreviousRef, quarantineGenerationRefs = []) {
  const core = immutable({
    schemaVersion: "RESTORE_RECONCILE_PLAN_V1",
    observationFingerprint: observation.observationFingerprint,
    intentFingerprint: intent.intentFingerprint,
    operationId: intent.operationId,
    action,
    expectedActiveRef: observation.activeRef,
    targetActiveRef,
    targetPreviousRef,
    clearIntent: true,
    quarantineGenerationRefs: [...quarantineGenerationRefs],
    cleanupAuthorized: false,
    effectsCommitted: false,
  });
  return immutable({ ...core, planFingerprint: fingerprint(core) });
}

function blocked(observation, reason) {
  return immutable({
    status: "BLOCKED",
    writesOpen: false,
    observation,
    plan: null,
    reason,
    boundary: BOUNDARY,
  });
}

function isCompleteOpenable(generation) {
  return generation?.status === "COMPLETE_OPENABLE";
}

function reconcileRestoreState(input) {
  let observation;
  try {
    observation = normalizeRestoreState(input);
  } catch (error) {
    return immutable({
      status: "REJECTED",
      writesOpen: false,
      plan: null,
      error: { code: error.code || "INVALID_RESTORE_OBSERVATION", message: error.message },
      boundary: BOUNDARY,
    });
  }

  const byId = new Map(observation.generations.map((generation) => [generation.generationId, generation]));
  const active = byId.get(observation.activeRef);
  const previous = byId.get(observation.previousRef);
  const intent = observation.intent;

  if (!intent) {
    if (!isCompleteOpenable(active)) return blocked(observation, "ACTIVE_GENERATION_NOT_COMPLETE_OPENABLE");
    if (observation.previousRef !== null && (!isCompleteOpenable(previous) || observation.previousRef === observation.activeRef)) return blocked(observation, "PREVIOUS_GENERATION_REFERENCE_INVALID");
    return immutable({
      status: "STABLE",
      writesOpen: true,
      observation,
      plan: null,
      unreferencedGenerationRefs: observation.generations
        .map((generation) => generation.generationId)
        .filter((generationId) => generationId !== observation.activeRef && generationId !== observation.previousRef),
      cleanupAuthorized: false,
      boundary: BOUNDARY,
    });
  }

  if (observation.previousRef !== null && observation.previousRef !== intent.oldRef) return blocked(observation, "PREVIOUS_REFERENCE_CONFLICTS_WITH_INTENT");
  const oldGeneration = byId.get(intent.oldRef);
  const newGeneration = byId.get(intent.newRef);
  const oldReady = isCompleteOpenable(oldGeneration);
  const newReadyAndBound = isCompleteOpenable(newGeneration) && newGeneration.observationFingerprint === intent.expectedGenerationFingerprint;

  if (observation.activeRef === intent.newRef) {
    if (newReadyAndBound) {
      return immutable({
        status: "ACTION_REQUIRED",
        writesOpen: false,
        observation,
        plan: createPlan(
          observation,
          intent,
          "FINALIZE_NEW",
          intent.newRef,
          oldReady ? intent.oldRef : null,
          oldGeneration && !oldReady ? [intent.oldRef] : [],
        ),
        boundary: BOUNDARY,
      });
    }
    if (oldReady) {
      return immutable({
        status: "ACTION_REQUIRED",
        writesOpen: false,
        observation,
        plan: createPlan(observation, intent, "ROLLBACK_TO_OLD", intent.oldRef, null, newGeneration ? [intent.newRef] : []),
        boundary: BOUNDARY,
      });
    }
    return blocked(observation, "NEW_AND_OLD_GENERATIONS_NOT_COMPLETE_OPENABLE");
  }

  if (observation.activeRef === intent.oldRef) {
    if (!oldReady || observation.previousRef !== null) return blocked(observation, "OLD_GENERATION_NOT_SAFE_FOR_ABORT");
    return immutable({
      status: "ACTION_REQUIRED",
      writesOpen: false,
      observation,
      plan: createPlan(observation, intent, "ABORT_NEW_KEEP_OLD", intent.oldRef, null, newGeneration ? [intent.newRef] : []),
      boundary: BOUNDARY,
    });
  }

  return blocked(observation, "UNKNOWN_RESTORE_COMBINATION");
}

export {
  ASSERTION_BOUNDARY,
  BOUNDARY,
  GENERATION_STATUSES,
  MAX_GENERATIONS,
  PENDING_PROFILE,
  createGenerationObservation,
  createHypotheticalRestoreIntent,
  createRestoreFixture,
  createRestoreObservation,
  normalizeRestoreState,
  reconcileRestoreState,
};
