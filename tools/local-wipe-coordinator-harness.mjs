import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const WIPE_PROTOCOL_VERSION = "wipe-intent-v1";
const EXTERNAL_FILES_SCOPE = "OUT_OF_SCOPE";
const OUTCOME_ASSERTION_BOUNDARY = "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS";
const OUTCOME_SCHEMA_VERSION = "WIPE_EFFECT_OUTCOME_V1";

const HARNESS_WRITER_REGISTRY = Object.freeze({
  revision: "writer-registry-harness-v1",
  fingerprint: "writer-registry-contract-7f3d0c1a",
  writerIds: Object.freeze(["ai-jobs", "backup-jobs", "business-db", "import-jobs"]),
});

const HARNESS_INVENTORY_CONTRACT = Object.freeze({
  revision: "inventory-harness-v1",
  fingerprint: "inventory-contract-43b8a71e",
  roots: Object.freeze(["app-group", "app-sandbox"]),
  allowedPlaceholders: Object.freeze(["wipe-intent-v1"]),
});

const HARNESS_SAFETY_CONTRACT = Object.freeze({
  writerRegistry: HARNESS_WRITER_REGISTRY,
  inventory: HARNESS_INVENTORY_CONTRACT,
});

const WIPE_PHASES = Object.freeze({
  IDLE: "IDLE",
  INTENT_DURABLE: "INTENT_DURABLE",
  WRITES_BLOCKED_AND_QUIESCED: "WRITES_BLOCKED_AND_QUIESCED",
  CONNECTIONS_CLOSED: "CONNECTIONS_CLOSED",
  SECRETS_INVALIDATED: "SECRETS_INVALIDATED",
  LOCAL_ARTIFACTS_REMOVED: "LOCAL_ARTIFACTS_REMOVED",
  VERIFIED_EMPTY: "VERIFIED_EMPTY",
  READY_FOR_FRESH_START: "READY_FOR_FRESH_START",
});

const WIPE_STATUSES = Object.freeze({
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  WAITING_RETRY: "WAITING_RETRY",
  RECONCILING: "RECONCILING",
  SAFE_RECOVERY_REQUIRED: "SAFE_RECOVERY_REQUIRED",
  READY_FOR_FRESH_START: "READY_FOR_FRESH_START",
});

const EFFECTS = Object.freeze({
  PERSIST_INTENT: "PERSIST_INTENT",
  QUIESCE_WRITERS_AND_TASKS: "QUIESCE_WRITERS_AND_TASKS",
  CLOSE_CONNECTIONS: "CLOSE_CONNECTIONS",
  INVALIDATE_SECRETS: "INVALIDATE_SECRETS",
  REMOVE_LOCAL_ARTIFACTS: "REMOVE_LOCAL_ARTIFACTS",
  VERIFY_EMPTY: "VERIFY_EMPTY",
  CLEAR_INTENT: "CLEAR_INTENT",
  RECONCILE_PHASE: "RECONCILE_PHASE",
});

const NEXT_EFFECT = Object.freeze({
  [WIPE_PHASES.INTENT_DURABLE]: Object.freeze({
    type: EFFECTS.QUIESCE_WRITERS_AND_TASKS,
    phase: WIPE_PHASES.WRITES_BLOCKED_AND_QUIESCED,
  }),
  [WIPE_PHASES.WRITES_BLOCKED_AND_QUIESCED]: Object.freeze({
    type: EFFECTS.CLOSE_CONNECTIONS,
    phase: WIPE_PHASES.CONNECTIONS_CLOSED,
  }),
  [WIPE_PHASES.CONNECTIONS_CLOSED]: Object.freeze({
    type: EFFECTS.INVALIDATE_SECRETS,
    phase: WIPE_PHASES.SECRETS_INVALIDATED,
  }),
  [WIPE_PHASES.SECRETS_INVALIDATED]: Object.freeze({
    type: EFFECTS.REMOVE_LOCAL_ARTIFACTS,
    phase: WIPE_PHASES.LOCAL_ARTIFACTS_REMOVED,
  }),
  [WIPE_PHASES.LOCAL_ARTIFACTS_REMOVED]: Object.freeze({
    type: EFFECTS.VERIFY_EMPTY,
    phase: WIPE_PHASES.VERIFIED_EMPTY,
  }),
  [WIPE_PHASES.VERIFIED_EMPTY]: Object.freeze({
    type: EFFECTS.CLEAR_INTENT,
    phase: WIPE_PHASES.READY_FOR_FRESH_START,
  }),
});

const TARGET_PHASE_BY_EFFECT = Object.freeze(Object.fromEntries([
  [EFFECTS.PERSIST_INTENT, WIPE_PHASES.INTENT_DURABLE],
  ...Object.values(NEXT_EFFECT).map(({ type, phase }) => [type, phase]),
]));

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const OPAQUE_OPERATION_PATTERN = /^wipe_[a-f0-9]{32}$/;
const OPAQUE_INSTALLATION_PATTERN = /^install_[a-f0-9]{32}$/;
const INTENT_KEYS = Object.freeze([
  "installationGeneration",
  "inventoryFingerprint",
  "inventoryRevision",
  "operationId",
  "protocolVersion",
  "writerRegistryFingerprint",
  "writerRegistryRevision",
]);
const VERIFY_OBSERVATION_KEYS = Object.freeze([
  "activeTasks",
  "aiKeyCount",
  "businessGenerations",
  "databaseKeyPresent",
  "deliveredNotifications",
  "enumeratedRoots",
  "externalFilesScope",
  "gateClosed",
  "intentPresent",
  "inventoryFingerprint",
  "inventoryRevision",
  "openTransactions",
  "openWritableHandles",
  "pendingNotifications",
  "remainingKnownArtifacts",
  "unexpectedEntries",
  "writerRegistryFingerprint",
  "writerRegistryRevision",
  "writersAcknowledged",
  "writersExpected",
]);
const ISSUED_STATES = new WeakSet();

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(clone(value));
}

function assertPlainRecord(value, field, code = "INVALID_RECORD") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be an object`, code, { field });
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${field} must be a plain object`, code, { field });
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    fail(`${field} contains symbol properties`, code, { field });
  }
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!descriptor.enumerable || descriptor.get || descriptor.set) {
      fail(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
    }
  }
  return value;
}

function assertDenseArray(value, field, code = "INVALID_RECORD") {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || Object.getOwnPropertySymbols(value).length > 0) {
    fail(`${field} must be a plain array`, code, { field });
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (key !== "length" && (!descriptor.enumerable || descriptor.get || descriptor.set)) {
      fail(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
    }
  }
  const keys = Object.keys(value);
  if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) {
    fail(`${field} must be dense and contain no extra properties`, code, { field });
  }
  return value;
}

function assertExactKeys(value, keys, field, code) {
  assertPlainRecord(value, field, code);
  const expected = [...keys].sort();
  const actual = Object.keys(value).sort();
  if (expected.length !== actual.length || expected.some((key, index) => key !== actual[index])) {
    fail(`${field} has an unexpected shape`, code, { field });
  }
}

function assertIdentifier(value, field, code = "INVALID_IDENTIFIER") {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    fail(`${field} is invalid`, code, { field });
  }
  return value;
}

function assertNonNegativeInteger(value, field, code = "INVALID_COUNT") {
  if (!Number.isInteger(value) || value < 0) fail(`${field} is invalid`, code, { field });
  return value;
}

function assertBoolean(value, field, code = "INVALID_OBSERVATION") {
  if (typeof value !== "boolean") fail(`${field} must be boolean`, code, { field });
  return value;
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function wipeEffectFingerprint(effect) {
  return fingerprint(effect);
}

function validatePassiveJson(
  value,
  field,
  depth = 0,
  budget = { keys: 0, items: 0 },
  ancestors = new Set(),
) {
  if (depth > 8) fail(`${field} exceeds its depth budget`, "WIPE_OUTCOME_RESOURCE_LIMIT", { field });
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} contains a non-finite number`, "INVALID_WIPE_OUTCOME", { field });
    return;
  }
  if (typeof value === "string") {
    if (Buffer.byteLength(value, "utf8") > 1024) fail(`${field} exceeds its string budget`, "WIPE_OUTCOME_RESOURCE_LIMIT", { field });
    return;
  }
  if (!value || typeof value !== "object" || ancestors.has(value)) {
    fail(`${field} is not passive JSON`, "INVALID_WIPE_OUTCOME", { field });
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    assertDenseArray(value, field, "INVALID_WIPE_OUTCOME");
    budget.items += value.length;
    if (budget.items > 128) fail(`${field} exceeds its array budget`, "WIPE_OUTCOME_RESOURCE_LIMIT", { field });
    value.forEach((child, index) => validatePassiveJson(
      child,
      `${field}[${index}]`,
      depth + 1,
      budget,
      ancestors,
    ));
    ancestors.delete(value);
    return;
  }
  assertPlainRecord(value, field, "INVALID_WIPE_OUTCOME");
  budget.keys += Object.keys(value).length;
  if (budget.keys > 128) fail(`${field} exceeds its object-key budget`, "WIPE_OUTCOME_RESOURCE_LIMIT", { field });
  for (const [key, child] of Object.entries(value)) {
    validatePassiveJson(child, `${field}.${key}`, depth + 1, budget, ancestors);
  }
  ancestors.delete(value);
}

function normalizeIntent(input) {
  assertExactKeys(input, INTENT_KEYS, "intent", "INVALID_WIPE_INTENT");
  const intent = {
    operationId: assertIdentifier(input.operationId, "intent.operationId", "INVALID_WIPE_INTENT"),
    protocolVersion: assertIdentifier(
      input.protocolVersion,
      "intent.protocolVersion",
      "INVALID_WIPE_INTENT",
    ),
    installationGeneration: assertIdentifier(
      input.installationGeneration,
      "intent.installationGeneration",
      "INVALID_WIPE_INTENT",
    ),
    inventoryRevision: assertIdentifier(
      input.inventoryRevision,
      "intent.inventoryRevision",
      "INVALID_WIPE_INTENT",
    ),
    inventoryFingerprint: assertIdentifier(
      input.inventoryFingerprint,
      "intent.inventoryFingerprint",
      "INVALID_WIPE_INTENT",
    ),
    writerRegistryRevision: assertIdentifier(
      input.writerRegistryRevision,
      "intent.writerRegistryRevision",
      "INVALID_WIPE_INTENT",
    ),
    writerRegistryFingerprint: assertIdentifier(
      input.writerRegistryFingerprint,
      "intent.writerRegistryFingerprint",
      "INVALID_WIPE_INTENT",
    ),
  };
  if (!OPAQUE_OPERATION_PATTERN.test(intent.operationId)
    || !OPAQUE_INSTALLATION_PATTERN.test(intent.installationGeneration)) {
    fail("wipe operation and installation ids must be opaque generated values", "INVALID_WIPE_INTENT");
  }
  return immutable(intent);
}

function intentUsesSupportedContracts(intent) {
  return intent.protocolVersion === WIPE_PROTOCOL_VERSION
    && intent.inventoryRevision === HARNESS_INVENTORY_CONTRACT.revision
    && intent.inventoryFingerprint === HARNESS_INVENTORY_CONTRACT.fingerprint
    && intent.writerRegistryRevision === HARNESS_WRITER_REGISTRY.revision
    && intent.writerRegistryFingerprint === HARNESS_WRITER_REGISTRY.fingerprint;
}

function intentFingerprint(intent) {
  const normalized = normalizeIntent(intent);
  return JSON.stringify(Object.fromEntries(INTENT_KEYS.map((key) => [key, normalized[key]])));
}

function baseState({
  status = WIPE_STATUSES.IDLE,
  phase = WIPE_PHASES.IDLE,
  intent = null,
  attempts = {},
  pendingEffect = null,
  unresolvedEffect = null,
  failure = null,
  writesBlocked = false,
} = {}) {
  const state = immutable({
    status,
    phase,
    intent,
    attempts,
    pendingEffect,
    unresolvedEffect,
    failure,
    writesBlocked,
    externalFilesScope: EXTERNAL_FILES_SCOPE,
  });
  ISSUED_STATES.add(state);
  return state;
}

function createWipeCoordinatorState() {
  return baseState();
}

function assertEffect(effect, intent, field = "effect") {
  const commonKeys = [
    "attempt",
    "idempotencyKey",
    "intentFingerprint",
    "operationId",
    "phase",
    "protocolVersion",
    "type",
  ];
  const extraKeys = effect?.type === EFFECTS.PERSIST_INTENT
    ? ["intent"]
    : effect?.type === EFFECTS.RECONCILE_PHASE
      ? ["originalAttempt", "originalEffect", "originalEffectType", "phaseIdempotencyKey"]
      : ["safetyContract"];
  assertExactKeys(effect, [...commonKeys, ...extraKeys], field, "INVALID_WIPE_STATE");
  if (!Object.values(EFFECTS).includes(effect.type)
    || effect.operationId !== intent.operationId
    || effect.protocolVersion !== intent.protocolVersion
    || !Object.values(WIPE_PHASES).includes(effect.phase)
    || !Number.isInteger(effect.attempt)
    || effect.attempt < 1
    || effect.intentFingerprint !== intentFingerprint(intent)
    || effect.idempotencyKey !== `${intent.operationId}:${effect.phase}`) {
    fail(`${field} identity is invalid`, "INVALID_WIPE_STATE", { field });
  }
  if (effect.type === EFFECTS.RECONCILE_PHASE) {
    if (!Object.hasOwn(TARGET_PHASE_BY_EFFECT, effect.originalEffectType)
      || TARGET_PHASE_BY_EFFECT[effect.originalEffectType] !== effect.phase
      || !Number.isInteger(effect.originalAttempt)
      || effect.originalAttempt < 1
      || effect.phaseIdempotencyKey !== effect.idempotencyKey) {
      fail(`${field} reconciliation identity is invalid`, "INVALID_WIPE_STATE", { field });
    }
    assertEffect(effect.originalEffect, intent, `${field}.originalEffect`);
    if (effect.originalEffect.type !== effect.originalEffectType
      || effect.originalEffect.phase !== effect.phase
      || effect.originalEffect.attempt !== effect.originalAttempt) {
      fail(`${field} original effect is invalid`, "INVALID_WIPE_STATE", { field });
    }
  } else if (TARGET_PHASE_BY_EFFECT[effect.type] !== effect.phase) {
    fail(`${field} target phase is invalid`, "INVALID_WIPE_STATE", { field });
  }
  if (effect.type === EFFECTS.PERSIST_INTENT) {
    const effectIntent = normalizeIntent(effect.intent);
    if (intentFingerprint(effectIntent) !== intentFingerprint(intent)
      || effect.intentFingerprint !== intentFingerprint(intent)) {
      fail(`${field} intent is invalid`, "INVALID_WIPE_STATE", { field });
    }
  } else if (effect.type !== EFFECTS.RECONCILE_PHASE
    && JSON.stringify(effect.safetyContract) !== JSON.stringify(HARNESS_SAFETY_CONTRACT)) {
    fail(`${field} safety contract is invalid`, "INVALID_WIPE_STATE", { field });
  }
  return effect;
}

function assertState(state) {
  assertPlainRecord(state, "state", "INVALID_WIPE_STATE");
  if (!ISSUED_STATES.has(state)) {
    fail("state was not issued by the wipe coordinator", "INVALID_WIPE_STATE");
  }
  if (!Object.values(WIPE_STATUSES).includes(state.status)) {
    fail("state status is invalid", "INVALID_WIPE_STATE");
  }
  if (!Object.values(WIPE_PHASES).includes(state.phase)) {
    fail("state phase is invalid", "INVALID_WIPE_STATE");
  }
  if (state.intent !== null) normalizeIntent(state.intent);
  assertPlainRecord(state.attempts, "state.attempts", "INVALID_WIPE_STATE");
  for (const [phase, attempt] of Object.entries(state.attempts)) {
    const trackedPhase = phase.startsWith("reconcile:") ? phase.slice("reconcile:".length) : phase;
    if (!Object.values(WIPE_PHASES).includes(trackedPhase)
      || !Number.isInteger(attempt)
      || attempt < 1) {
      fail("state attempts are invalid", "INVALID_WIPE_STATE");
    }
  }
  if (typeof state.writesBlocked !== "boolean" || state.externalFilesScope !== EXTERNAL_FILES_SCOPE) {
    fail("state safety flags are invalid", "INVALID_WIPE_STATE");
  }
  if (state.pendingEffect !== null) {
    if (!state.intent) fail("pending effect requires an intent", "INVALID_WIPE_STATE");
    assertEffect(state.pendingEffect, state.intent, "state.pendingEffect");
  }
  if (state.unresolvedEffect !== null) {
    if (!state.intent) fail("unresolved effect requires an intent", "INVALID_WIPE_STATE");
    assertEffect(state.unresolvedEffect, state.intent, "state.unresolvedEffect");
    if (state.unresolvedEffect.type === EFFECTS.RECONCILE_PHASE) {
      fail("a reconciliation effect cannot itself be unresolved", "INVALID_WIPE_STATE");
    }
  }

  const isIdle = state.status === WIPE_STATUSES.IDLE;
  const isReady = state.status === WIPE_STATUSES.READY_FOR_FRESH_START;
  if (isIdle && (state.phase !== WIPE_PHASES.IDLE
    || state.intent !== null
    || state.pendingEffect !== null
    || state.unresolvedEffect !== null
    || state.failure !== null
    || state.writesBlocked)) {
    fail("idle wipe state is inconsistent", "INVALID_WIPE_STATE");
  }
  if (isReady && (state.phase !== WIPE_PHASES.READY_FOR_FRESH_START
    || state.intent !== null
    || state.pendingEffect !== null
    || state.unresolvedEffect !== null
    || state.failure !== null
    || state.writesBlocked)) {
    fail("completed wipe state is inconsistent", "INVALID_WIPE_STATE");
  }
  if (state.status === WIPE_STATUSES.SAFE_RECOVERY_REQUIRED && (
    !state.intent
    || state.phase === WIPE_PHASES.READY_FOR_FRESH_START
    || state.pendingEffect !== null
    || state.unresolvedEffect !== null
    || !state.failure
    || !state.writesBlocked
  )) {
    fail("safe recovery wipe state is inconsistent", "INVALID_WIPE_STATE");
  }
  if (state.status === WIPE_STATUSES.RUNNING) {
    if (!state.intent || state.unresolvedEffect !== null || state.failure !== null) {
      fail("running wipe state is inconsistent", "INVALID_WIPE_STATE");
    }
    const expectedDescriptor = state.phase === WIPE_PHASES.IDLE
      ? { type: EFFECTS.PERSIST_INTENT, phase: WIPE_PHASES.INTENT_DURABLE }
      : NEXT_EFFECT[state.phase];
    if (state.phase === WIPE_PHASES.IDLE && !state.pendingEffect) {
      fail("intent persistence must be pending from idle", "INVALID_WIPE_STATE");
    }
    if (state.pendingEffect && (state.pendingEffect.type !== expectedDescriptor?.type
      || state.pendingEffect.phase !== expectedDescriptor?.phase
      || state.attempts[state.pendingEffect.phase] !== state.pendingEffect.attempt)) {
      fail("running wipe effect does not follow the completed phase", "INVALID_WIPE_STATE");
    }
    if (state.writesBlocked !== (state.phase !== WIPE_PHASES.IDLE)) {
      fail("running wipe gate is inconsistent", "INVALID_WIPE_STATE");
    }
  }
  if (state.status === WIPE_STATUSES.WAITING_RETRY && (
    !state.intent
    || state.pendingEffect !== null
    || !state.unresolvedEffect
    || !state.failure
    || state.writesBlocked !== (state.phase !== WIPE_PHASES.IDLE)
  )) {
    fail("retrying wipe state is inconsistent", "INVALID_WIPE_STATE");
  }
  if (state.status === WIPE_STATUSES.RECONCILING) {
    if (!state.intent || !state.unresolvedEffect || !state.failure || !state.writesBlocked) {
      fail("reconciling wipe state is inconsistent", "INVALID_WIPE_STATE");
    }
    if (state.pendingEffect && (state.pendingEffect.type !== EFFECTS.RECONCILE_PHASE
      || state.pendingEffect.phase !== state.unresolvedEffect.phase
      || state.pendingEffect.originalEffectType !== state.unresolvedEffect.type
      || state.pendingEffect.originalAttempt !== state.unresolvedEffect.attempt
      || state.attempts[`reconcile:${state.pendingEffect.phase}`] !== state.pendingEffect.attempt)) {
      fail("pending reconciliation does not match the unresolved phase", "INVALID_WIPE_STATE");
    }
  }
  return state;
}

function makeEffect(intent, descriptor, attempt, extra = {}) {
  return immutable({
    type: descriptor.type,
    operationId: intent.operationId,
    phase: descriptor.phase,
    attempt,
    protocolVersion: intent.protocolVersion,
    idempotencyKey: `${intent.operationId}:${descriptor.phase}`,
    intentFingerprint: intentFingerprint(intent),
    ...extra,
  });
}

function beginConfirmedWipe(state, input) {
  assertState(state);
  if (state.status !== WIPE_STATUSES.IDLE || state.intent !== null) {
    fail("another wipe operation is already present", "WIPE_OPERATION_CONFLICT");
  }
  const intent = normalizeIntent(input);
  if (!intentUsesSupportedContracts(intent)) {
    fail("wipe protocol or safety contract is not supported", "UNSUPPORTED_WIPE_CONTRACT");
  }
  const attempts = { [WIPE_PHASES.INTENT_DURABLE]: 1 };
  const effect = makeEffect(
    intent,
    { type: EFFECTS.PERSIST_INTENT, phase: WIPE_PHASES.INTENT_DURABLE },
    1,
    { intent },
  );
  return Object.freeze({
    state: baseState({
      status: WIPE_STATUSES.RUNNING,
      intent,
      attempts,
      pendingEffect: effect,
    }),
    effect,
  });
}

function recoverWipeFromIntent(input) {
  const intent = normalizeIntent(input);
  if (!intentUsesSupportedContracts(intent)) {
    return baseState({
      status: WIPE_STATUSES.SAFE_RECOVERY_REQUIRED,
      phase: WIPE_PHASES.INTENT_DURABLE,
      intent,
      writesBlocked: true,
      failure: { code: "UNSUPPORTED_WIPE_CONTRACT" },
    });
  }
  return baseState({
    status: WIPE_STATUSES.RUNNING,
    phase: WIPE_PHASES.INTENT_DURABLE,
    intent,
    writesBlocked: true,
  });
}

function requestNextWipeEffect(state) {
  assertState(state);
  if (state.pendingEffect) fail("a wipe effect is already pending", "WIPE_EFFECT_ALREADY_PENDING");
  if (state.status === WIPE_STATUSES.RECONCILING) {
    return requestWipeReconciliation(state);
  }
  if (![WIPE_STATUSES.RUNNING, WIPE_STATUSES.WAITING_RETRY].includes(state.status)) {
    fail("wipe cannot advance in the current state", "INVALID_WIPE_TRANSITION");
  }
  const retrying = state.status === WIPE_STATUSES.WAITING_RETRY && state.unresolvedEffect;
  const restartSafetySequence = retrying
    && [EFFECTS.VERIFY_EMPTY, EFFECTS.CLEAR_INTENT].includes(state.unresolvedEffect.type)
    && state.failure?.code === "EMPTY_VERIFICATION_FAILED";
  const descriptor = restartSafetySequence
    ? NEXT_EFFECT[state.phase]
    : retrying
      ? { type: state.unresolvedEffect.type, phase: state.unresolvedEffect.phase }
    : NEXT_EFFECT[state.phase];
  if (!descriptor || !state.intent) fail("wipe phase has no next effect", "INVALID_WIPE_TRANSITION");
  const attempt = (state.attempts[descriptor.phase] ?? 0) + 1;
  const attempts = { ...state.attempts, [descriptor.phase]: attempt };
  const effect = makeEffect(
    state.intent,
    descriptor,
    attempt,
    descriptor.type === EFFECTS.PERSIST_INTENT
      ? { intent: state.intent }
      : { safetyContract: HARNESS_SAFETY_CONTRACT },
  );
  return Object.freeze({
    state: baseState({
      ...state,
      status: WIPE_STATUSES.RUNNING,
      attempts,
      pendingEffect: effect,
      unresolvedEffect: null,
      failure: null,
    }),
    effect,
  });
}

function requestWipeReconciliation(state) {
  assertState(state);
  if (state.status !== WIPE_STATUSES.RECONCILING || !state.unresolvedEffect || state.pendingEffect) {
    fail("wipe phase does not require reconciliation", "INVALID_WIPE_TRANSITION");
  }
  const unresolved = state.unresolvedEffect;
  const attemptKey = `reconcile:${unresolved.phase}`;
  const attempt = (state.attempts[attemptKey] ?? 0) + 1;
  const attempts = { ...state.attempts, [attemptKey]: attempt };
  const effect = makeEffect(
    state.intent,
    { type: EFFECTS.RECONCILE_PHASE, phase: unresolved.phase },
    attempt,
    {
      originalEffectType: unresolved.type,
      originalAttempt: unresolved.attempt,
      originalEffect: unresolved,
      phaseIdempotencyKey: unresolved.idempotencyKey,
    },
  );
  return Object.freeze({
    state: baseState({ ...state, attempts, pendingEffect: effect }),
    effect,
  });
}

function normalizeStringSet(values, field) {
  assertDenseArray(values, field, "INVALID_WIPE_OBSERVATION");
  const normalized = values.map((value, index) => (
    assertIdentifier(value, `${field}[${index}]`, "INVALID_WIPE_OBSERVATION")
  ));
  if (new Set(normalized).size !== normalized.length) {
    fail(`${field} must not contain duplicates`, "INVALID_WIPE_OBSERVATION", { field });
  }
  return [...normalized].sort();
}

function validateAppliedObservation(effect, observation, expectedIntentFingerprint) {
  validatePassiveJson(observation, "outcome.observation");
  const effectType = effect.type;
  switch (effectType) {
    case EFFECTS.PERSIST_INTENT:
      assertExactKeys(
        observation,
        ["durable", "intentFingerprint"],
        "outcome.observation",
        "INVALID_WIPE_OBSERVATION",
      );
      if (assertBoolean(observation.durable, "observation.durable") !== true
        || observation.intentFingerprint !== expectedIntentFingerprint) {
        fail("wipe intent was not proven durable", "INTENT_NOT_DURABLE");
      }
      break;
    case EFFECTS.QUIESCE_WRITERS_AND_TASKS: {
      assertExactKeys(
        observation,
        [
          "activeTasks",
          "deliveredNotifications",
          "gateClosed",
          "pendingNotifications",
          "writerRegistryFingerprint",
          "writerRegistryRevision",
          "writersAcknowledged",
          "writersExpected",
        ],
        "outcome.observation",
        "INVALID_WIPE_OBSERVATION",
      );
      const expected = normalizeStringSet(observation.writersExpected, "observation.writersExpected");
      const acknowledged = normalizeStringSet(
        observation.writersAcknowledged,
        "observation.writersAcknowledged",
      );
      const registry = effect.safetyContract.writerRegistry;
      if (observation.writerRegistryRevision !== registry.revision
        || observation.writerRegistryFingerprint !== registry.fingerprint
        || JSON.stringify(expected) !== JSON.stringify(registry.writerIds)
        || JSON.stringify(expected) !== JSON.stringify(acknowledged)
        || assertBoolean(observation.gateClosed, "observation.gateClosed") !== true
        || assertNonNegativeInteger(observation.activeTasks, "observation.activeTasks") !== 0
        || assertNonNegativeInteger(
          observation.pendingNotifications,
          "observation.pendingNotifications",
        ) !== 0
        || assertNonNegativeInteger(
          observation.deliveredNotifications,
          "observation.deliveredNotifications",
        ) !== 0) {
        fail("writers, tasks, or notifications are not quiesced", "QUIESCE_NOT_PROVEN");
      }
      break;
    }
    case EFFECTS.CLOSE_CONNECTIONS:
      assertExactKeys(
        observation,
        ["openTransactions", "openWritableHandles"],
        "outcome.observation",
        "INVALID_WIPE_OBSERVATION",
      );
      if (assertNonNegativeInteger(
        observation.openWritableHandles,
        "observation.openWritableHandles",
      ) !== 0 || assertNonNegativeInteger(
        observation.openTransactions,
        "observation.openTransactions",
      ) !== 0) {
        fail("writable connections are still open", "CONNECTIONS_NOT_CLOSED");
      }
      break;
    case EFFECTS.INVALIDATE_SECRETS:
      assertExactKeys(
        observation,
        ["aiKeyCount", "databaseKeyPresent"],
        "outcome.observation",
        "INVALID_WIPE_OBSERVATION",
      );
      if (assertBoolean(observation.databaseKeyPresent, "observation.databaseKeyPresent") !== false
        || assertNonNegativeInteger(observation.aiKeyCount, "observation.aiKeyCount") !== 0) {
        fail("local secrets are still available", "SECRETS_NOT_INVALIDATED");
      }
      break;
    case EFFECTS.REMOVE_LOCAL_ARTIFACTS:
      assertExactKeys(
        observation,
        ["inventoryFingerprint", "inventoryRevision", "remainingKnownArtifacts"],
        "outcome.observation",
        "INVALID_WIPE_OBSERVATION",
      );
      if (observation.inventoryRevision !== effect.safetyContract.inventory.revision
        || observation.inventoryFingerprint !== effect.safetyContract.inventory.fingerprint
        || assertNonNegativeInteger(
        observation.remainingKnownArtifacts,
        "observation.remainingKnownArtifacts",
      ) !== 0) {
        fail("known local artifacts remain", "ARTIFACTS_NOT_REMOVED");
      }
      break;
    case EFFECTS.VERIFY_EMPTY:
      assertExactKeys(
        observation,
        VERIFY_OBSERVATION_KEYS,
        "outcome.observation",
        "INVALID_WIPE_OBSERVATION",
      );
      assertDenseArray(
        observation.unexpectedEntries,
        "observation.unexpectedEntries",
        "INVALID_WIPE_OBSERVATION",
      );
      if (observation.unexpectedEntries.some((entry) => typeof entry !== "string")) {
        fail("unexpectedEntries is invalid", "INVALID_WIPE_OBSERVATION");
      }
      const registry = effect.safetyContract.writerRegistry;
      const inventory = effect.safetyContract.inventory;
      const roots = normalizeStringSet(observation.enumeratedRoots, "observation.enumeratedRoots");
      const expectedWriters = normalizeStringSet(
        observation.writersExpected,
        "observation.writersExpected",
      );
      const acknowledgedWriters = normalizeStringSet(
        observation.writersAcknowledged,
        "observation.writersAcknowledged",
      );
      if (observation.inventoryRevision !== inventory.revision
        || observation.inventoryFingerprint !== inventory.fingerprint
        || JSON.stringify(roots) !== JSON.stringify([...inventory.roots].sort())
        || observation.writerRegistryRevision !== registry.revision
        || observation.writerRegistryFingerprint !== registry.fingerprint
        || JSON.stringify(expectedWriters) !== JSON.stringify(registry.writerIds)
        || JSON.stringify(acknowledgedWriters) !== JSON.stringify(registry.writerIds)
        || observation.unexpectedEntries.length !== 0
        || assertBoolean(observation.gateClosed, "observation.gateClosed") !== true
        || assertNonNegativeInteger(observation.activeTasks, "observation.activeTasks") !== 0
        || assertNonNegativeInteger(
          observation.openWritableHandles,
          "observation.openWritableHandles",
        ) !== 0
        || assertNonNegativeInteger(
          observation.openTransactions,
          "observation.openTransactions",
        ) !== 0
        || assertBoolean(observation.databaseKeyPresent, "observation.databaseKeyPresent") !== false
        || assertNonNegativeInteger(observation.aiKeyCount, "observation.aiKeyCount") !== 0
        || assertNonNegativeInteger(
          observation.remainingKnownArtifacts,
          "observation.remainingKnownArtifacts",
        ) !== 0
        || assertNonNegativeInteger(
          observation.businessGenerations,
          "observation.businessGenerations",
        ) !== 0
        || assertNonNegativeInteger(
          observation.pendingNotifications,
          "observation.pendingNotifications",
        ) !== 0
        || assertNonNegativeInteger(
          observation.deliveredNotifications,
          "observation.deliveredNotifications",
        ) !== 0
        || assertBoolean(observation.intentPresent, "observation.intentPresent") !== true
        || observation.externalFilesScope !== EXTERNAL_FILES_SCOPE) {
        fail("negative empty verification did not pass", "EMPTY_VERIFICATION_FAILED");
      }
      break;
    case EFFECTS.CLEAR_INTENT:
      assertExactKeys(
        observation,
        [
          ...VERIFY_OBSERVATION_KEYS,
          "businessViewRendered",
          "freshDatabaseCreated",
          "secretVaultOpened",
        ],
        "outcome.observation",
        "INVALID_WIPE_OBSERVATION",
      );
      if (assertBoolean(observation.intentPresent, "observation.intentPresent") !== false) {
        fail("wipe intent is still present", "INTENT_CLEAR_NOT_PROVEN");
      }
      validateAppliedObservation(
        { ...effect, type: EFFECTS.VERIFY_EMPTY },
        {
          ...Object.fromEntries(VERIFY_OBSERVATION_KEYS.map((key) => [key, observation[key]])),
          intentPresent: true,
        },
        expectedIntentFingerprint,
      );
      if (assertBoolean(observation.freshDatabaseCreated, "observation.freshDatabaseCreated") !== false
        || assertBoolean(observation.secretVaultOpened, "observation.secretVaultOpened") !== false
        || assertBoolean(observation.businessViewRendered, "observation.businessViewRendered") !== false) {
        fail("wipe intent was cleared after an unsafe restart action", "INTENT_CLEAR_NOT_PROVEN");
      }
      break;
    default:
      fail("wipe effect observation type is invalid", "INVALID_WIPE_EFFECT");
  }
  return immutable(observation);
}

function createWipeEffectOutcome(input) {
  assertExactKeys(
    input,
    [
      "attempt",
      "evidenceId",
      "effectFingerprint",
      "errorCode",
      "observation",
      "operationId",
      "phase",
      "profileId",
      "protocolVersion",
      "schemaVersion",
      "status",
      "verifierId",
    ],
    "outcomeInput",
    "INVALID_WIPE_OUTCOME",
  );
  if (input.schemaVersion !== "WIPE_EFFECT_OUTCOME_INPUT_V1"
    || !["APPLIED", "NOT_APPLIED", "UNKNOWN"].includes(input.status)) {
    fail("wipe outcome input is invalid", "INVALID_WIPE_OUTCOME");
  }
  assertIdentifier(input.operationId, "outcomeInput.operationId", "INVALID_WIPE_OUTCOME");
  assertIdentifier(input.phase, "outcomeInput.phase", "INVALID_WIPE_OUTCOME");
  assertIdentifier(input.protocolVersion, "outcomeInput.protocolVersion", "INVALID_WIPE_OUTCOME");
  assertIdentifier(input.evidenceId, "outcomeInput.evidenceId", "INVALID_WIPE_OUTCOME");
  assertIdentifier(input.verifierId, "outcomeInput.verifierId", "INVALID_WIPE_OUTCOME");
  assertIdentifier(input.profileId, "outcomeInput.profileId", "INVALID_WIPE_OUTCOME");
  if (!Number.isInteger(input.attempt) || input.attempt < 1
    || typeof input.effectFingerprint !== "string"
    || !/^[a-f0-9]{64}$/.test(input.effectFingerprint)) {
    fail("wipe outcome identity is invalid", "INVALID_WIPE_OUTCOME");
  }
  if (input.observation !== null) validatePassiveJson(input.observation, "outcomeInput.observation");
  const observation = input.observation === null ? null : clone(input.observation);
  const errorCode = input.errorCode === null
    ? null
    : assertIdentifier(input.errorCode, "outcomeInput.errorCode", "INVALID_WIPE_OUTCOME");
  if (input.status === "APPLIED" && observation === null) {
    fail("applied wipe outcome requires an observation", "INVALID_WIPE_OUTCOME");
  }
  if ((input.status === "APPLIED") !== (errorCode === null)) {
    fail("wipe outcome status and errorCode are inconsistent", "INVALID_WIPE_OUTCOME");
  }
  if (input.status === "UNKNOWN" && observation !== null) {
    fail("unknown wipe outcome must not carry a trusted observation", "INVALID_WIPE_OUTCOME");
  }
  const observationFingerprint = observation === null ? null : fingerprint(observation);
  const core = immutable({
    schemaVersion: OUTCOME_SCHEMA_VERSION,
    operationId: input.operationId,
    phase: input.phase,
    attempt: input.attempt,
    protocolVersion: input.protocolVersion,
    status: input.status,
    evidenceId: input.evidenceId,
    verifierId: input.verifierId,
    profileId: input.profileId,
    effectFingerprint: input.effectFingerprint,
    observation,
    observationFingerprint,
    errorCode,
    assertionBoundary: OUTCOME_ASSERTION_BOUNDARY,
  });
  return immutable({ ...core, outcomeFingerprint: fingerprint(core) });
}

function normalizeOutcome(outcome, pendingEffect) {
  assertExactKeys(
    outcome,
    [
      "assertionBoundary",
      "attempt",
      "evidenceId",
      "effectFingerprint",
      "errorCode",
      "observation",
      "observationFingerprint",
      "operationId",
      "outcomeFingerprint",
      "phase",
      "profileId",
      "protocolVersion",
      "schemaVersion",
      "status",
      "verifierId",
    ],
    "outcome",
    "INVALID_WIPE_OUTCOME",
  );
  const pendingFingerprint = wipeEffectFingerprint(pendingEffect);
  if (outcome.operationId !== pendingEffect.operationId
    || outcome.phase !== pendingEffect.phase
    || outcome.attempt !== pendingEffect.attempt
    || outcome.protocolVersion !== pendingEffect.protocolVersion
    || outcome.effectFingerprint !== pendingFingerprint) {
    fail("wipe outcome is stale or belongs to another operation", "STALE_WIPE_OUTCOME");
  }
  if (outcome.schemaVersion !== OUTCOME_SCHEMA_VERSION
    || outcome.assertionBoundary !== OUTCOME_ASSERTION_BOUNDARY
    || typeof outcome.outcomeFingerprint !== "string"
    || !/^[a-f0-9]{64}$/.test(outcome.outcomeFingerprint)) {
    fail("wipe outcome boundary is invalid", "INVALID_WIPE_OUTCOME");
  }
  const expected = createWipeEffectOutcome({
    schemaVersion: "WIPE_EFFECT_OUTCOME_INPUT_V1",
    operationId: outcome.operationId,
    phase: outcome.phase,
    attempt: outcome.attempt,
    protocolVersion: outcome.protocolVersion,
    status: outcome.status,
    evidenceId: outcome.evidenceId,
    verifierId: outcome.verifierId,
    profileId: outcome.profileId,
    effectFingerprint: outcome.effectFingerprint,
    observation: outcome.observation,
    errorCode: outcome.errorCode,
  });
  if (!isDeepStrictEqual(outcome, expected)) {
    fail("wipe outcome, observation, or fingerprint was changed", "INVALID_WIPE_OUTCOME");
  }
  return expected;
}

function settleWipeEffect(state, rawOutcome) {
  assertState(state);
  if (!state.pendingEffect || !state.intent) {
    fail("no wipe effect is awaiting an outcome", "INVALID_WIPE_TRANSITION");
  }
  const pending = state.pendingEffect;
  const outcome = normalizeOutcome(rawOutcome, pending);
  const originalEffect = pending.type === EFFECTS.RECONCILE_PHASE
    ? state.unresolvedEffect
    : pending;
  if (!originalEffect) fail("reconciliation has no unresolved phase", "INVALID_WIPE_STATE");

  if (outcome.status === "UNKNOWN") {
    return baseState({
      ...state,
      status: WIPE_STATUSES.RECONCILING,
      pendingEffect: null,
      unresolvedEffect: originalEffect,
      failure: { code: outcome.errorCode ?? "WIPE_OUTCOME_UNKNOWN" },
      writesBlocked: true,
    });
  }

  if (outcome.status === "NOT_APPLIED") {
    if (["WIPE_INTENT_MISSING", "WIPE_INTENT_CONFLICT"].includes(outcome.errorCode)) {
      return baseState({
        ...state,
        status: WIPE_STATUSES.SAFE_RECOVERY_REQUIRED,
        pendingEffect: null,
        unresolvedEffect: null,
        failure: { code: outcome.errorCode },
        writesBlocked: true,
      });
    }
    const retryPhase = [EFFECTS.VERIFY_EMPTY, EFFECTS.CLEAR_INTENT].includes(originalEffect.type)
      && outcome.errorCode === "EMPTY_VERIFICATION_FAILED"
      ? WIPE_PHASES.INTENT_DURABLE
      : state.phase;
    return baseState({
      ...state,
      status: WIPE_STATUSES.WAITING_RETRY,
      phase: retryPhase,
      pendingEffect: null,
      unresolvedEffect: originalEffect,
      failure: { code: outcome.errorCode ?? "WIPE_PHASE_NOT_APPLIED" },
      writesBlocked: state.phase !== WIPE_PHASES.IDLE,
    });
  }

  try {
    validateAppliedObservation(
      originalEffect,
      outcome.observation,
      intentFingerprint(state.intent),
    );
  } catch (error) {
    return baseState({
      ...state,
      status: WIPE_STATUSES.RECONCILING,
      pendingEffect: null,
      unresolvedEffect: originalEffect,
      failure: { code: error.code ?? "WIPE_POSTCONDITION_NOT_PROVEN" },
      writesBlocked: true,
    });
  }
  const ready = originalEffect.phase === WIPE_PHASES.READY_FOR_FRESH_START;
  return baseState({
    status: ready ? WIPE_STATUSES.READY_FOR_FRESH_START : WIPE_STATUSES.RUNNING,
    phase: originalEffect.phase,
    intent: ready ? null : state.intent,
    attempts: state.attempts,
    pendingEffect: null,
    unresolvedEffect: null,
    failure: null,
    writesBlocked: !ready,
  });
}

async function executeWipeEffect(adapter, effect) {
  if (!adapter || typeof adapter.executeWipeEffect !== "function") {
    fail("adapter does not implement executeWipeEffect", "INVALID_WIPE_ADAPTER");
  }
  return adapter.executeWipeEffect(immutable(effect));
}

function createInMemoryWipeAdapter({
  runtimeSnapshot = null,
  writerIds = HARNESS_WRITER_REGISTRY.writerIds,
  unacknowledgedWriterIds = [],
  writerRegistryRevision = HARNESS_WRITER_REGISTRY.revision,
  writerRegistryFingerprint = HARNESS_WRITER_REGISTRY.fingerprint,
  pendingNotifications = 2,
  deliveredNotifications = 1,
  openWritableHandles = 3,
  openTransactions = 1,
  databaseKeyPresent = true,
  aiKeyCount = 1,
  knownArtifacts = ["database", "media", "app-group", "user-defaults", "logs"],
  unexpectedEntries = [],
  inventoryRevision = HARNESS_INVENTORY_CONTRACT.revision,
  inventoryFingerprint = HARNESS_INVENTORY_CONTRACT.fingerprint,
  enumeratedRoots = HARNESS_INVENTORY_CONTRACT.roots,
  businessGenerations = 1,
  externalFilesCopies = 0,
  failurePlan = {},
  driftPlan = {},
} = {}) {
  const defaultRuntime = {
    intent: null,
    installationGeneration: null,
    gateClosed: false,
    writerIds: normalizeStringSet(writerIds, "writerIds"),
    unacknowledgedWriterIds: normalizeStringSet(
      unacknowledgedWriterIds,
      "unacknowledgedWriterIds",
    ),
    writerRegistryRevision,
    writerRegistryFingerprint,
    activeTasks: writerIds.length,
    pendingNotifications: assertNonNegativeInteger(pendingNotifications, "pendingNotifications"),
    deliveredNotifications: assertNonNegativeInteger(deliveredNotifications, "deliveredNotifications"),
    openWritableHandles: assertNonNegativeInteger(openWritableHandles, "openWritableHandles"),
    openTransactions: assertNonNegativeInteger(openTransactions, "openTransactions"),
    databaseKeyPresent: Boolean(databaseKeyPresent),
    aiKeyCount: assertNonNegativeInteger(aiKeyCount, "aiKeyCount"),
    knownArtifacts: [...knownArtifacts],
    unexpectedEntries: [...unexpectedEntries],
    inventoryRevision,
    inventoryFingerprint,
    enumeratedRoots: normalizeStringSet(enumeratedRoots, "enumeratedRoots"),
    businessGenerations: assertNonNegativeInteger(businessGenerations, "businessGenerations"),
    externalFilesCopies: assertNonNegativeInteger(externalFilesCopies, "externalFilesCopies"),
    freshDatabaseCreated: false,
    secretVaultOpened: false,
    businessViewRendered: false,
  };
  const runtime = runtimeSnapshot === null ? defaultRuntime : clone(runtimeSnapshot);
  if (runtime.intent !== null) runtime.intent = normalizeIntent(runtime.intent);
  const arrayFields = [
    "writerIds",
    "unacknowledgedWriterIds",
    "knownArtifacts",
    "unexpectedEntries",
    "enumeratedRoots",
  ];
  for (const field of arrayFields) {
    if (!Array.isArray(runtime[field])) fail(`${field} is invalid`, "INVALID_ADAPTER_SNAPSHOT");
    runtime[field] = [...runtime[field]];
  }
  runtime.writerIds = normalizeStringSet(runtime.writerIds, "runtime.writerIds");
  runtime.unacknowledgedWriterIds = normalizeStringSet(
    runtime.unacknowledgedWriterIds,
    "runtime.unacknowledgedWriterIds",
  );
  runtime.enumeratedRoots = normalizeStringSet(runtime.enumeratedRoots, "runtime.enumeratedRoots");
  if (runtime.unacknowledgedWriterIds.some((id) => !runtime.writerIds.includes(id))
    || [...runtime.knownArtifacts, ...runtime.unexpectedEntries].some(
      (entry) => typeof entry !== "string" || entry.length === 0 || entry.length > 512,
    )) {
    fail("adapter snapshot lists are invalid", "INVALID_ADAPTER_SNAPSHOT");
  }
  for (const field of [
    "activeTasks",
    "pendingNotifications",
    "deliveredNotifications",
    "openWritableHandles",
    "openTransactions",
    "aiKeyCount",
    "businessGenerations",
    "externalFilesCopies",
  ]) {
    assertNonNegativeInteger(runtime[field], `runtime.${field}`, "INVALID_ADAPTER_SNAPSHOT");
  }
  for (const field of [
    "gateClosed",
    "databaseKeyPresent",
    "freshDatabaseCreated",
    "secretVaultOpened",
    "businessViewRendered",
  ]) {
    assertBoolean(runtime[field], `runtime.${field}`, "INVALID_ADAPTER_SNAPSHOT");
  }
  for (const field of [
    "writerRegistryRevision",
    "writerRegistryFingerprint",
    "inventoryRevision",
    "inventoryFingerprint",
  ]) {
    assertIdentifier(runtime[field], `runtime.${field}`, "INVALID_ADAPTER_SNAPSHOT");
  }
  if (runtime.installationGeneration !== null
    && !OPAQUE_INSTALLATION_PATTERN.test(runtime.installationGeneration)) {
    fail("adapter installation generation is invalid", "INVALID_ADAPTER_SNAPSHOT");
  }
  const idempotency = new Map();
  const validFaults = new Set(["BEFORE_APPLY", "AFTER_APPLY"]);
  const plans = new Map(Object.entries(failurePlan).map(([type, failures]) => {
    const normalized = Array.isArray(failures) ? [...failures] : [failures];
    if (!Object.values(EFFECTS).includes(type) || normalized.some((fault) => !validFaults.has(fault))) {
      fail("failurePlan contains an unsupported fault", "INVALID_FAILURE_PLAN");
    }
    return [type, normalized];
  }));
  const drifts = new Map(Object.entries(driftPlan).map(([type, patches]) => [
    type,
    Array.isArray(patches) ? [...patches] : [patches],
  ]));

  function applyRuntimePatch(patch) {
    assertPlainRecord(patch, "driftPatch", "INVALID_DRIFT_PLAN");
    for (const [key, value] of Object.entries(patch)) {
      if (!Object.hasOwn(runtime, key) || key === "intent") {
        fail("drift patch contains an unsupported field", "INVALID_DRIFT_PLAN", { key });
      }
      runtime[key] = clone(value);
    }
  }

  function observe(effect) {
    switch (effect.type) {
      case EFFECTS.PERSIST_INTENT:
        return {
          durable: runtime.intent !== null,
          intentFingerprint: runtime.intent === null ? "missing" : intentFingerprint(runtime.intent),
        };
      case EFFECTS.QUIESCE_WRITERS_AND_TASKS: {
        const unacknowledged = new Set(runtime.unacknowledgedWriterIds);
        return {
          gateClosed: runtime.gateClosed,
          writerRegistryRevision: runtime.writerRegistryRevision,
          writerRegistryFingerprint: runtime.writerRegistryFingerprint,
          writersExpected: [...runtime.writerIds].sort(),
          writersAcknowledged: runtime.writerIds.filter((id) => !unacknowledged.has(id)).sort(),
          activeTasks: runtime.activeTasks,
          pendingNotifications: runtime.pendingNotifications,
          deliveredNotifications: runtime.deliveredNotifications,
        };
      }
      case EFFECTS.CLOSE_CONNECTIONS:
        return {
          openWritableHandles: runtime.openWritableHandles,
          openTransactions: runtime.openTransactions,
        };
      case EFFECTS.INVALIDATE_SECRETS:
        return {
          databaseKeyPresent: runtime.databaseKeyPresent,
          aiKeyCount: runtime.aiKeyCount,
        };
      case EFFECTS.REMOVE_LOCAL_ARTIFACTS:
        return {
          inventoryRevision: runtime.inventoryRevision,
          inventoryFingerprint: runtime.inventoryFingerprint,
          remainingKnownArtifacts: runtime.knownArtifacts.length,
        };
      case EFFECTS.VERIFY_EMPTY: {
        const quiesce = observe({ type: EFFECTS.QUIESCE_WRITERS_AND_TASKS });
        return {
          inventoryRevision: runtime.inventoryRevision,
          inventoryFingerprint: runtime.inventoryFingerprint,
          enumeratedRoots: [...runtime.enumeratedRoots].sort(),
          writerRegistryRevision: quiesce.writerRegistryRevision,
          writerRegistryFingerprint: quiesce.writerRegistryFingerprint,
          writersExpected: quiesce.writersExpected,
          writersAcknowledged: quiesce.writersAcknowledged,
          gateClosed: quiesce.gateClosed,
          activeTasks: quiesce.activeTasks,
          openWritableHandles: runtime.openWritableHandles,
          openTransactions: runtime.openTransactions,
          databaseKeyPresent: runtime.databaseKeyPresent,
          aiKeyCount: runtime.aiKeyCount,
          remainingKnownArtifacts: runtime.knownArtifacts.length,
          businessGenerations: runtime.businessGenerations,
          unexpectedEntries: [...runtime.unexpectedEntries],
          pendingNotifications: runtime.pendingNotifications,
          deliveredNotifications: runtime.deliveredNotifications,
          intentPresent: runtime.intent !== null,
          externalFilesScope: EXTERNAL_FILES_SCOPE,
        };
      }
      case EFFECTS.CLEAR_INTENT:
        return {
          ...observe({ type: EFFECTS.VERIFY_EMPTY }),
          intentPresent: runtime.intent !== null,
          freshDatabaseCreated: runtime.freshDatabaseCreated,
          secretVaultOpened: runtime.secretVaultOpened,
          businessViewRendered: runtime.businessViewRendered,
        };
      default:
        fail("adapter received an unsupported effect", "INVALID_WIPE_EFFECT");
    }
  }

  function assertReadyToClear(effect) {
    const verificationEffect = {
      ...effect,
      type: EFFECTS.VERIFY_EMPTY,
      phase: WIPE_PHASES.VERIFIED_EMPTY,
    };
    const observation = observe(verificationEffect);
    validateAppliedObservation(
      verificationEffect,
      observation,
      runtime.intent === null ? null : intentFingerprint(runtime.intent),
    );
  }

  function applyEffect(effect) {
    switch (effect.type) {
      case EFFECTS.PERSIST_INTENT:
        if (runtime.intent !== null
          && intentFingerprint(runtime.intent) !== effect.intentFingerprint) {
          fail("another durable wipe intent already exists", "WIPE_INTENT_CONFLICT");
        }
        runtime.intent = clone(effect.intent);
        runtime.installationGeneration = effect.intent.installationGeneration;
        break;
      case EFFECTS.QUIESCE_WRITERS_AND_TASKS: {
        runtime.gateClosed = true;
        const unacknowledged = new Set(runtime.unacknowledgedWriterIds);
        runtime.activeTasks = runtime.writerIds.filter((id) => unacknowledged.has(id)).length;
        runtime.pendingNotifications = 0;
        runtime.deliveredNotifications = 0;
        break;
      }
      case EFFECTS.CLOSE_CONNECTIONS:
        if (!runtime.gateClosed || runtime.activeTasks !== 0) {
          fail("writers are not quiesced", "ADAPTER_ORDER_VIOLATION");
        }
        runtime.openWritableHandles = 0;
        runtime.openTransactions = 0;
        break;
      case EFFECTS.INVALIDATE_SECRETS:
        if (runtime.openWritableHandles !== 0 || runtime.openTransactions !== 0) {
          fail("connections are still open", "ADAPTER_ORDER_VIOLATION");
        }
        runtime.databaseKeyPresent = false;
        runtime.aiKeyCount = 0;
        break;
      case EFFECTS.REMOVE_LOCAL_ARTIFACTS:
        if (runtime.databaseKeyPresent || runtime.aiKeyCount !== 0) {
          fail("secrets are still available", "ADAPTER_ORDER_VIOLATION");
        }
        runtime.knownArtifacts = [];
        runtime.unexpectedEntries = [];
        runtime.businessGenerations = 0;
        break;
      case EFFECTS.VERIFY_EMPTY:
        break;
      case EFFECTS.CLEAR_INTENT:
        assertReadyToClear(effect);
        runtime.intent = null;
        break;
      default:
        fail("adapter received an unsupported effect", "INVALID_WIPE_EFFECT");
    }
    return immutable(observe(effect));
  }

  function phaseFingerprint(effect) {
    return JSON.stringify({
      type: effect.type,
      operationId: effect.operationId,
      phase: effect.phase,
      protocolVersion: effect.protocolVersion,
      intentFingerprint: effect.intentFingerprint ?? null,
      safetyContract: effect.safetyContract ?? null,
    });
  }

  function result(effect, status, observation = null, errorCode = null) {
    return createWipeEffectOutcome({
      schemaVersion: "WIPE_EFFECT_OUTCOME_INPUT_V1",
      operationId: effect.operationId,
      phase: effect.phase,
      attempt: effect.attempt,
      protocolVersion: effect.protocolVersion,
      status,
      evidenceId: `${effect.operationId}.${effect.phase}.${effect.attempt}`,
      verifierId: "in-memory-wipe-adapter",
      profileId: "harness-observation-v1",
      effectFingerprint: wipeEffectFingerprint(effect),
      observation,
      errorCode,
    });
  }

  function intentRelationshipError(effect, { reconciling = false } = {}) {
    if (effect.type === EFFECTS.PERSIST_INTENT) {
      if (runtime.intent === null) return null;
      return intentFingerprint(runtime.intent) === effect.intentFingerprint
        ? null
        : "WIPE_INTENT_CONFLICT";
    }
    if (runtime.intent === null) {
      return reconciling && effect.type === EFFECTS.CLEAR_INTENT
        ? null
        : "WIPE_INTENT_MISSING";
    }
    return intentFingerprint(runtime.intent) === effect.intentFingerprint
      ? null
      : "WIPE_INTENT_CONFLICT";
  }

  async function executeAdapterEffect(effect) {
    if (effect.type === EFFECTS.RECONCILE_PHASE) {
      const original = effect.originalEffect;
      const relationshipError = intentRelationshipError(original, { reconciling: true });
      if (relationshipError) return result(effect, "NOT_APPLIED", null, relationshipError);
      const observation = immutable(observe(original));
      try {
        validateAppliedObservation(
          original,
          observation,
          original.type === EFFECTS.PERSIST_INTENT ? original.intentFingerprint : null,
        );
        return result(effect, "APPLIED", observation);
      } catch (error) {
        return result(effect, "NOT_APPLIED", observation, error.code ?? "PHASE_NOT_OBSERVED");
      }
    }

    const relationshipError = intentRelationshipError(effect);
    if (relationshipError) return result(effect, "NOT_APPLIED", null, relationshipError);
    const fingerprint = phaseFingerprint(effect);
    const prior = idempotency.get(effect.idempotencyKey);
    if (prior && prior !== fingerprint) {
      return result(effect, "NOT_APPLIED", null, "IDEMPOTENCY_CONFLICT");
    }
    const failures = plans.get(effect.type) ?? [];
    const failure = failures.shift() ?? null;
    if (failure === "BEFORE_APPLY") {
      return result(effect, "NOT_APPLIED", null, "PLANNED_BEFORE_APPLY_FAILURE");
    }
    const queuedDrifts = drifts.get(effect.type) ?? [];
    const drift = queuedDrifts.shift() ?? null;
    if (effect.type === EFFECTS.CLEAR_INTENT && drift) applyRuntimePatch(drift);
    let observation;
    try {
      observation = applyEffect(effect);
      if (effect.type !== EFFECTS.CLEAR_INTENT && drift) {
        applyRuntimePatch(drift);
        observation = immutable(observe(effect));
      }
    } catch (error) {
      return result(effect, "NOT_APPLIED", null, error.code ?? "WIPE_ADAPTER_FAILURE");
    }
    idempotency.set(effect.idempotencyKey, fingerprint);
    if (failure === "AFTER_APPLY") {
      return result(effect, "UNKNOWN", null, "PLANNED_RESPONSE_LOSS");
    }
    return result(effect, "APPLIED", observation);
  }

  return Object.freeze({
    executeWipeEffect: executeAdapterEffect,
    snapshot: () => immutable(runtime),
  });
}

function reconcileWipeStartup(runtimeSnapshot, { expectedInstallationGeneration } = {}) {
  if (typeof expectedInstallationGeneration !== "string"
    || !OPAQUE_INSTALLATION_PATTERN.test(expectedInstallationGeneration)) {
    fail("expected installation generation is invalid", "INVALID_INSTALLATION_GENERATION");
  }
  let runtime;
  try {
    runtime = createInMemoryWipeAdapter({ runtimeSnapshot }).snapshot();
  } catch (error) {
    return immutable({
      status: WIPE_STATUSES.SAFE_RECOVERY_REQUIRED,
      writesBlocked: true,
      reason: error.code ?? "INVALID_ADAPTER_SNAPSHOT",
      state: null,
    });
  }
  if (runtime.intent !== null) {
    const state = recoverWipeFromIntent(runtime.intent);
    const resumable = state.status !== WIPE_STATUSES.SAFE_RECOVERY_REQUIRED;
    return Object.freeze({
      status: resumable ? "RESUME_WIPE" : WIPE_STATUSES.SAFE_RECOVERY_REQUIRED,
      writesBlocked: true,
      reason: resumable ? null : state.failure.code,
      state,
    });
  }

  const writerIds = normalizeStringSet(runtime.writerIds, "runtime.writerIds");
  const unacknowledged = new Set(runtime.unacknowledgedWriterIds);
  const acknowledged = runtime.writerIds.filter((id) => !unacknowledged.has(id)).sort();
  const empty = runtime.installationGeneration === expectedInstallationGeneration
    && runtime.writerRegistryRevision === HARNESS_WRITER_REGISTRY.revision
    && runtime.writerRegistryFingerprint === HARNESS_WRITER_REGISTRY.fingerprint
    && JSON.stringify(writerIds) === JSON.stringify(HARNESS_WRITER_REGISTRY.writerIds)
    && JSON.stringify(acknowledged) === JSON.stringify(HARNESS_WRITER_REGISTRY.writerIds)
    && runtime.inventoryRevision === HARNESS_INVENTORY_CONTRACT.revision
    && runtime.inventoryFingerprint === HARNESS_INVENTORY_CONTRACT.fingerprint
    && JSON.stringify([...runtime.enumeratedRoots].sort())
      === JSON.stringify([...HARNESS_INVENTORY_CONTRACT.roots].sort())
    && runtime.gateClosed === true
    && runtime.activeTasks === 0
    && runtime.pendingNotifications === 0
    && runtime.deliveredNotifications === 0
    && runtime.openWritableHandles === 0
    && runtime.openTransactions === 0
    && runtime.databaseKeyPresent === false
    && runtime.aiKeyCount === 0
    && runtime.businessGenerations === 0
    && runtime.knownArtifacts.length === 0
    && runtime.unexpectedEntries.length === 0
    && runtime.freshDatabaseCreated === false
    && runtime.secretVaultOpened === false
    && runtime.businessViewRendered === false;

  return immutable({
    status: empty ? "FRESH_START_ALLOWED" : WIPE_STATUSES.SAFE_RECOVERY_REQUIRED,
    writesBlocked: !empty,
    reason: empty ? null : "STARTUP_EMPTY_STATE_NOT_PROVEN",
    state: null,
  });
}

export {
  EFFECTS,
  EXTERNAL_FILES_SCOPE,
  HARNESS_INVENTORY_CONTRACT,
  HARNESS_SAFETY_CONTRACT,
  HARNESS_WRITER_REGISTRY,
  WIPE_PHASES,
  WIPE_PROTOCOL_VERSION,
  WIPE_STATUSES,
  OUTCOME_ASSERTION_BOUNDARY,
  beginConfirmedWipe,
  createInMemoryWipeAdapter,
  createWipeEffectOutcome,
  createWipeCoordinatorState,
  executeWipeEffect,
  intentFingerprint,
  recoverWipeFromIntent,
  reconcileWipeStartup,
  requestNextWipeEffect,
  requestWipeReconciliation,
  settleWipeEffect,
  wipeEffectFingerprint,
};
