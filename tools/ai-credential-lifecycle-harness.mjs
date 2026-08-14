import { isDeepStrictEqual } from "node:util";

import { createHash } from "node:crypto";

const PROTOCOL_VERSION = "ai-credential-intent-v1";
const OPERATION_KINDS = Object.freeze(["SAVE", "REMOVE"]);
const STATUSES = Object.freeze({
  UNCONFIGURED: "UNCONFIGURED",
  CONFIGURED: "CONFIGURED",
  RUNNING: "RUNNING",
  WAITING_RETRY: "WAITING_RETRY",
  RECONCILING: "RECONCILING",
  KEY_REENTRY_REQUIRED: "KEY_REENTRY_REQUIRED",
  SAFE_RECOVERY_REQUIRED: "SAFE_RECOVERY_REQUIRED",
});
const EFFECTS = Object.freeze({
  PERSIST_INTENT: "PERSIST_INTENT",
  WRITE_NEW_SECRET: "WRITE_NEW_SECRET",
  QUIESCE_AI: "QUIESCE_AI",
  ACTIVATE_CONFIG: "ACTIVATE_CONFIG",
  DELETE_OLD_SECRET: "DELETE_OLD_SECRET",
  DELETE_ALL_SECRETS: "DELETE_ALL_SECRETS",
  DELETE_CONFIG: "DELETE_CONFIG",
  VERIFY_AND_CLEAR_INTENT: "VERIFY_AND_CLEAR_INTENT",
  RECONCILE_EFFECT: "RECONCILE_EFFECT",
});
const FAILURE_POINTS = new Set(["BEFORE_APPLY", "AFTER_APPLY"]);
const FAILURE_CODES = new Set([
  "ABSENCE_NOT_VERIFIED",
  "ACTIVE_PAIR_NOT_VERIFIED",
  "AI_NOT_QUIESCED",
  "CREDENTIAL_ADAPTER_FAILURE",
  "CREDENTIAL_REF_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "INJECTED_AFTER_APPLY",
  "INJECTED_BEFORE_APPLY",
  "INSTALLATION_MISMATCH",
  "INTENT_MISMATCH",
  "INVALID_EFFECT_PORT",
  "INVALID_RECONCILIATION_EFFECT",
  "OPERATION_IN_PROGRESS",
  "ORPHAN_SECRET_SLOTS",
  "RECONCILIATION_INDETERMINATE",
  "RECONCILED_NOT_APPLIED",
  "REMOVE_PRECONDITION_FAILED",
  "REVISION_CONFLICT",
  "SECRET_REENTRY_REQUIRED",
  "TARGET_SECRET_MISSING",
  "UNEXPECTED_SECRET_SLOTS",
  "UNSUPPORTED_EFFECT",
  "VAULT_UNAVAILABLE",
]);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const OPERATION_ID = /^aiop_[a-f0-9]{32}$/;
const CREDENTIAL_REF = /^aicred_[a-f0-9]{32}$/;
const INSTALLATION_GENERATION = /^install_[a-f0-9]{32}$/;
const TRANSIENT_SECRETS = new Map();

const STATE_KEYS = Object.freeze([
  "activeConfig",
  "activeTasks",
  "attempts",
  "connectionStatePresent",
  "failure",
  "gateClosed",
  "installationGeneration",
  "intent",
  "intentDurable",
  "networkBlocked",
  "pendingEffect",
  "revision",
  "secretSlots",
  "status",
  "unresolvedEffect",
]);

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code = "INVALID_RECORD") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be a plain record`, code, { field });
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${field} must be a plain record`, code, { field });
  }
  return value;
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !Object.hasOwn(value, key))
    || Object.keys(value).some((key) => !allowed.has(key))) {
    fail(`${field} has an unexpected shape`, code, { field });
  }
}

function assertSafeSerializable(value, field, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_STATE_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object") {
    fail(`${field} is not serializable`, "INVALID_STATE_VALUE", { field });
  }
  if (seen.has(value)) fail(`${field} contains a cycle`, "INVALID_STATE_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertSafeSerializable(child, `${field}[${index}]`, seen));
  } else {
    assertPlainRecord(value, field, "INVALID_STATE_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (new Set(["__proto__", "prototype", "constructor"]).has(key)) {
        fail(`${field} contains an unsafe key`, "INVALID_STATE_VALUE", { field, key });
      }
      assertSafeSerializable(child, `${field}.${key}`, seen);
    }
  }
  seen.delete(value);
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
}

function immutable(value) {
  assertSafeSerializable(value, "value");
  return deepFreeze(structuredClone(value));
}

function assertIdentifier(value, field, pattern = IDENTIFIER, code = "INVALID_IDENTIFIER") {
  if (typeof value !== "string" || !pattern.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function assertRevision(value, field = "revision") {
  if (!Number.isInteger(value) || value < 0) fail(`${field} is invalid`, "INVALID_REVISION", { field });
  return value;
}

function assertSecret(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 8192) {
    fail("AI credential is invalid", "INVALID_TRANSIENT_SECRET");
  }
  return value;
}

function canonicalStringify(value) {
  assertSafeSerializable(value, "canonicalValue");
  if (typeof value === "number" && Object.is(value, -0)) return "-0";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalStringify(value[key])}`
  )).join(",")}}`;
}

function sha256Fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function normalizeModel(value) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 256) {
    fail("model is invalid", "INVALID_MODEL", { field: "model" });
  }
  return value.trim();
}

function normalizeCredentialBaseUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 2048) {
    fail("baseURL is invalid", "INVALID_BASE_URL", { field: "baseURL" });
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    fail("baseURL is invalid", "INVALID_BASE_URL", { field: "baseURL" });
  }
  if (url.protocol !== "https:") fail("baseURL must use HTTPS", "HTTPS_REQUIRED", { field: "baseURL" });
  if (!url.hostname) fail("baseURL hostname is required", "MISSING_HOSTNAME", { field: "baseURL" });
  if (url.username || url.password || url.search || url.hash) {
    fail(
      "baseURL requires the pending URL compatibility decision",
      "URL_PROFILE_DECISION_REQUIRED",
      { field: "baseURL" },
    );
  }
  return immutable({
    baseURL: url.toString(),
    origin: url.origin,
    host: url.host,
  });
}

function normalizeConfig(input, field = "config") {
  assertExactKeys(
    input,
    ["baseURL", "credentialRef", "host", "model", "origin", "revision"],
    [],
    field,
    "INVALID_AI_CONFIG",
  );
  const normalizedUrl = normalizeCredentialBaseUrl(input.baseURL);
  if (input.origin !== normalizedUrl.origin || input.host !== normalizedUrl.host) {
    fail(`${field} URL derivations are inconsistent`, "INVALID_AI_CONFIG", { field });
  }
  return immutable({
    ...normalizedUrl,
    model: normalizeModel(input.model),
    credentialRef: assertIdentifier(
      input.credentialRef,
      `${field}.credentialRef`,
      CREDENTIAL_REF,
      "INVALID_CREDENTIAL_REF",
    ),
    revision: assertRevision(input.revision, `${field}.revision`),
  });
}

function normalizeSecretSlot(input, field = "secretSlot") {
  assertExactKeys(
    input,
    ["credentialRef", "installationGeneration", "operationId"],
    [],
    field,
    "INVALID_SECRET_SLOT_METADATA",
  );
  return immutable({
    credentialRef: assertIdentifier(
      input.credentialRef,
      `${field}.credentialRef`,
      CREDENTIAL_REF,
      "INVALID_CREDENTIAL_REF",
    ),
    installationGeneration: assertIdentifier(
      input.installationGeneration,
      `${field}.installationGeneration`,
      INSTALLATION_GENERATION,
      "INVALID_INSTALLATION_GENERATION",
    ),
    operationId: assertIdentifier(
      input.operationId,
      `${field}.operationId`,
      OPERATION_ID,
      "INVALID_OPERATION_ID",
    ),
  });
}

function normalizeIntent(input, field = "intent") {
  assertExactKeys(
    input,
    [
      "commandFingerprint",
      "expectedRevision",
      "installationGeneration",
      "kind",
      "operationId",
      "previousCredentialRef",
      "protocolVersion",
      "targetConfig",
      "targetCredentialRef",
    ],
    [],
    field,
    "INVALID_CREDENTIAL_INTENT",
  );
  if (!OPERATION_KINDS.includes(input.kind) || input.protocolVersion !== PROTOCOL_VERSION) {
    fail(`${field} protocol is unsupported`, "INVALID_CREDENTIAL_INTENT", { field });
  }
  const operationId = assertIdentifier(
    input.operationId,
    `${field}.operationId`,
    OPERATION_ID,
    "INVALID_OPERATION_ID",
  );
  const installationGeneration = assertIdentifier(
    input.installationGeneration,
    `${field}.installationGeneration`,
    INSTALLATION_GENERATION,
    "INVALID_INSTALLATION_GENERATION",
  );
  const expectedRevision = assertRevision(input.expectedRevision, `${field}.expectedRevision`);
  const previousCredentialRef = input.previousCredentialRef === null
    ? null
    : assertIdentifier(
      input.previousCredentialRef,
      `${field}.previousCredentialRef`,
      CREDENTIAL_REF,
      "INVALID_CREDENTIAL_REF",
    );
  const targetCredentialRef = input.targetCredentialRef === null
    ? null
    : assertIdentifier(
      input.targetCredentialRef,
      `${field}.targetCredentialRef`,
      CREDENTIAL_REF,
      "INVALID_CREDENTIAL_REF",
    );
  const targetConfig = input.targetConfig === null ? null : normalizeConfig(input.targetConfig, `${field}.targetConfig`);
  if ((input.kind === "SAVE" && (!targetConfig || !targetCredentialRef
      || targetConfig.credentialRef !== targetCredentialRef
      || targetConfig.revision !== expectedRevision + 1))
    || (input.kind === "REMOVE" && (targetConfig !== null || targetCredentialRef !== null))) {
    fail(`${field} kind and target disagree`, "INVALID_CREDENTIAL_INTENT", { field });
  }
  const unsigned = {
    protocolVersion: PROTOCOL_VERSION,
    operationId,
    kind: input.kind,
    installationGeneration,
    expectedRevision,
    previousCredentialRef,
    targetCredentialRef,
    targetConfig,
  };
  const commandFingerprint = canonicalStringify(unsigned);
  if (input.commandFingerprint !== commandFingerprint) {
    fail(`${field} fingerprint is invalid`, "INVALID_CREDENTIAL_INTENT", { field });
  }
  return immutable({ ...unsigned, commandFingerprint });
}

function createIntent({
  operationId,
  kind,
  installationGeneration,
  expectedRevision,
  previousCredentialRef,
  targetCredentialRef,
  targetConfig,
}) {
  const unsigned = {
    protocolVersion: PROTOCOL_VERSION,
    operationId,
    kind,
    installationGeneration,
    expectedRevision,
    previousCredentialRef,
    targetCredentialRef,
    targetConfig,
  };
  return normalizeIntent({ ...unsigned, commandFingerprint: canonicalStringify(unsigned) });
}

function normalizeInspection(input, field = "inspection") {
  assertExactKeys(
    input,
    [
      "activeConfig",
      "activeTasks",
      "completedOperationIds",
      "connectionStatePresent",
      "gateClosed",
      "installationGeneration",
      "intent",
      "revision",
      "secretSlots",
      "vaultState",
    ],
    [],
    field,
    "INVALID_CREDENTIAL_INSPECTION",
  );
  const installationGeneration = assertIdentifier(
    input.installationGeneration,
    `${field}.installationGeneration`,
    INSTALLATION_GENERATION,
    "INVALID_INSTALLATION_GENERATION",
  );
  if (!new Set(["AVAILABLE", "UNAVAILABLE"]).has(input.vaultState)) {
    fail(`${field}.vaultState is invalid`, "INVALID_CREDENTIAL_INSPECTION", { field });
  }
  if (typeof input.gateClosed !== "boolean"
    || typeof input.connectionStatePresent !== "boolean"
    || !Number.isInteger(input.activeTasks)
    || input.activeTasks < 0) {
    fail(`${field} process state is invalid`, "INVALID_CREDENTIAL_INSPECTION", { field });
  }
  if (!Array.isArray(input.secretSlots) || !Array.isArray(input.completedOperationIds)) {
    fail(`${field} collections are invalid`, "INVALID_CREDENTIAL_INSPECTION", { field });
  }
  const secretSlots = input.secretSlots.map((slot, index) => normalizeSecretSlot(
    slot,
    `${field}.secretSlots[${index}]`,
  )).sort((left, right) => left.credentialRef.localeCompare(right.credentialRef, "en"));
  if (new Set(secretSlots.map(({ credentialRef }) => credentialRef)).size !== secretSlots.length) {
    fail(`${field} contains duplicate credential refs`, "INVALID_CREDENTIAL_INSPECTION", { field });
  }
  const completedOperationIds = input.completedOperationIds.map((id, index) => assertIdentifier(
    id,
    `${field}.completedOperationIds[${index}]`,
    OPERATION_ID,
    "INVALID_OPERATION_ID",
  )).sort();
  if (new Set(completedOperationIds).size !== completedOperationIds.length) {
    fail(`${field} contains duplicate operation ids`, "INVALID_CREDENTIAL_INSPECTION", { field });
  }
  const activeConfig = input.activeConfig === null ? null : normalizeConfig(input.activeConfig, `${field}.activeConfig`);
  const intent = input.intent === null ? null : normalizeIntent(input.intent, `${field}.intent`);
  const revision = assertRevision(input.revision, `${field}.revision`);
  if (intent?.installationGeneration !== undefined
    && intent.installationGeneration !== installationGeneration) {
    fail(
      `${field} intent belongs to another installation`,
      "INSPECTION_INSTALLATION_MISMATCH",
      { field },
    );
  }
  if (secretSlots.some((slot) => slot.installationGeneration !== installationGeneration)) {
    fail(
      `${field} contains a secret slot from another installation`,
      "INSPECTION_INSTALLATION_MISMATCH",
      { field },
    );
  }
  if (activeConfig !== null && activeConfig.revision !== revision) {
    fail(`${field} active revision is inconsistent`, "INVALID_CREDENTIAL_INSPECTION", { field });
  }
  return immutable({
    installationGeneration,
    revision,
    activeConfig,
    intent,
    secretSlots,
    vaultState: input.vaultState,
    gateClosed: input.gateClosed,
    activeTasks: input.activeTasks,
    connectionStatePresent: input.connectionStatePresent,
    completedOperationIds,
  });
}

function stateFromInspection(inspection, overrides = {}) {
  const normalized = normalizeInspection(inspection);
  const state = {
    status: normalized.activeConfig === null ? STATUSES.UNCONFIGURED : STATUSES.CONFIGURED,
    installationGeneration: normalized.installationGeneration,
    revision: normalized.revision,
    activeConfig: normalized.activeConfig,
    intent: normalized.intent,
    intentDurable: normalized.intent !== null,
    secretSlots: normalized.secretSlots,
    gateClosed: normalized.gateClosed,
    activeTasks: normalized.activeTasks,
    connectionStatePresent: normalized.connectionStatePresent,
    attempts: {},
    pendingEffect: null,
    unresolvedEffect: null,
    failure: null,
    networkBlocked: normalized.intent !== null,
    ...overrides,
  };
  return immutable(state);
}

function snapshotFromState(state) {
  return {
    installationGeneration: state.installationGeneration,
    revision: state.revision,
    activeConfig: state.activeConfig,
    intent: state.intentDurable ? state.intent : null,
    secretSlots: state.secretSlots,
    vaultState: "AVAILABLE",
    gateClosed: state.gateClosed,
    activeTasks: state.activeTasks,
    connectionStatePresent: state.connectionStatePresent,
    completedOperationIds: [],
  };
}

function hasSecretRef(state, credentialRef) {
  return credentialRef !== null
    && state.secretSlots.some((slot) => slot.credentialRef === credentialRef);
}

function isTargetActive(state) {
  return state.intent?.kind === "SAVE"
    && isDeepStrictEqual(state.activeConfig, state.intent.targetConfig);
}

function deriveNextEffectType(state) {
  const intent = state.intent;
  if (!intent) return null;
  if (!state.intentDurable) return EFFECTS.PERSIST_INTENT;
  if (intent.kind === "SAVE") {
    if (!hasSecretRef(state, intent.targetCredentialRef)) return EFFECTS.WRITE_NEW_SECRET;
    if (!state.gateClosed || state.activeTasks !== 0) return EFFECTS.QUIESCE_AI;
    if (!isTargetActive(state)) return EFFECTS.ACTIVATE_CONFIG;
    if (intent.previousCredentialRef !== null
      && intent.previousCredentialRef !== intent.targetCredentialRef
      && hasSecretRef(state, intent.previousCredentialRef)) {
      return EFFECTS.DELETE_OLD_SECRET;
    }
    return EFFECTS.VERIFY_AND_CLEAR_INTENT;
  }
  if (!state.gateClosed || state.activeTasks !== 0) return EFFECTS.QUIESCE_AI;
  if (state.secretSlots.length !== 0) return EFFECTS.DELETE_ALL_SECRETS;
  if (state.activeConfig !== null || state.connectionStatePresent) return EFFECTS.DELETE_CONFIG;
  return EFFECTS.VERIFY_AND_CLEAR_INTENT;
}

function effectFingerprint(effect) {
  const copy = structuredClone(effect);
  delete copy.attempt;
  return canonicalStringify(copy);
}

function createEffect(state, type, attempt, originalEffect = null) {
  const intent = normalizeIntent(state.intent);
  const base = {
    type,
    operationId: intent.operationId,
    operationKind: intent.kind,
    phase: type === EFFECTS.RECONCILE_EFFECT ? originalEffect.phase : type,
    attempt,
    idempotencyKey: `${intent.operationId}:${type === EFFECTS.RECONCILE_EFFECT ? originalEffect.phase : type}`,
    commandFingerprint: intent.commandFingerprint,
    installationGeneration: intent.installationGeneration,
    expectedRevision: intent.expectedRevision,
    intent,
    originalEffect: type === EFFECTS.RECONCILE_EFFECT ? originalEffect : null,
  };
  return immutable({ ...base, fingerprint: effectFingerprint(base) });
}

function normalizeEffect(input, field = "effect") {
  assertExactKeys(
    input,
    [
      "attempt",
      "commandFingerprint",
      "expectedRevision",
      "fingerprint",
      "idempotencyKey",
      "installationGeneration",
      "intent",
      "operationId",
      "operationKind",
      "originalEffect",
      "phase",
      "type",
    ],
    [],
    field,
    "INVALID_CREDENTIAL_EFFECT",
  );
  if (!Object.values(EFFECTS).includes(input.type)
    || !Number.isInteger(input.attempt)
    || input.attempt < 1) {
    fail(`${field} identity is invalid`, "INVALID_CREDENTIAL_EFFECT", { field });
  }
  const intent = normalizeIntent(input.intent, `${field}.intent`);
  const operationId = assertIdentifier(input.operationId, `${field}.operationId`, OPERATION_ID, "INVALID_OPERATION_ID");
  const expectedPhase = input.type === EFFECTS.RECONCILE_EFFECT ? input.originalEffect?.phase : input.type;
  if (operationId !== intent.operationId
    || input.operationKind !== intent.kind
    || input.installationGeneration !== intent.installationGeneration
    || input.expectedRevision !== intent.expectedRevision
    || input.commandFingerprint !== intent.commandFingerprint
    || input.phase !== expectedPhase
    || input.idempotencyKey !== `${operationId}:${expectedPhase}`) {
    fail(`${field} is not bound to its intent`, "INVALID_CREDENTIAL_EFFECT", { field });
  }
  if (input.type === EFFECTS.RECONCILE_EFFECT) {
    const original = normalizeEffect(input.originalEffect, `${field}.originalEffect`);
    if (original.type === EFFECTS.RECONCILE_EFFECT
      || original.operationId !== operationId
      || original.phase !== input.phase) {
      fail(`${field} original effect is invalid`, "INVALID_CREDENTIAL_EFFECT", { field });
    }
  } else if (input.originalEffect !== null) {
    fail(`${field}.originalEffect must be null`, "INVALID_CREDENTIAL_EFFECT", { field });
  }
  const base = {
    type: input.type,
    operationId,
    operationKind: intent.kind,
    phase: input.phase,
    attempt: input.attempt,
    idempotencyKey: input.idempotencyKey,
    commandFingerprint: intent.commandFingerprint,
    installationGeneration: intent.installationGeneration,
    expectedRevision: intent.expectedRevision,
    intent,
    originalEffect: input.type === EFFECTS.RECONCILE_EFFECT
      ? normalizeEffect(input.originalEffect, `${field}.originalEffect`)
      : null,
  };
  if (input.fingerprint !== effectFingerprint(base)) {
    fail(`${field} fingerprint is invalid`, "INVALID_CREDENTIAL_EFFECT", { field });
  }
  return immutable({ ...base, fingerprint: input.fingerprint });
}

function normalizeFailure(input, field = "failure") {
  assertExactKeys(input, ["code", "outcome", "retryable"], [], field, "INVALID_CREDENTIAL_FAILURE");
  if (typeof input.code !== "string" || !FAILURE_CODES.has(input.code)
    || !new Set(["NOT_APPLIED", "UNKNOWN"]).has(input.outcome)
    || typeof input.retryable !== "boolean"
    || (input.outcome === "UNKNOWN" && input.retryable !== true)) {
    fail(`${field} is invalid`, "INVALID_CREDENTIAL_FAILURE", { field });
  }
  return immutable(input);
}

function assertState(state) {
  assertExactKeys(state, STATE_KEYS, [], "state", "INVALID_CREDENTIAL_STATE");
  assertSafeSerializable(state, "state");
  if (!Object.values(STATUSES).includes(state.status)) {
    fail("state status is invalid", "INVALID_CREDENTIAL_STATE");
  }
  assertIdentifier(
    state.installationGeneration,
    "state.installationGeneration",
    INSTALLATION_GENERATION,
    "INVALID_INSTALLATION_GENERATION",
  );
  assertRevision(state.revision, "state.revision");
  if (state.activeConfig !== null) {
    const config = normalizeConfig(state.activeConfig, "state.activeConfig");
    if (config.revision < 1 || config.revision !== state.revision) {
      fail("state revision is inconsistent", "INVALID_CREDENTIAL_STATE");
    }
  }
  if (state.intent !== null) {
    const intent = normalizeIntent(state.intent, "state.intent");
    if (intent.installationGeneration !== state.installationGeneration) {
      fail("state intent belongs to another installation", "INVALID_CREDENTIAL_STATE");
    }
  }
  if (typeof state.intentDurable !== "boolean"
    || typeof state.networkBlocked !== "boolean"
    || typeof state.gateClosed !== "boolean"
    || typeof state.connectionStatePresent !== "boolean"
    || !Number.isInteger(state.activeTasks)
    || state.activeTasks < 0
    || !Array.isArray(state.secretSlots)) {
    fail("state flags are invalid", "INVALID_CREDENTIAL_STATE");
  }
  state.secretSlots.forEach((slot, index) => {
    const normalized = normalizeSecretSlot(slot, `state.secretSlots[${index}]`);
    if (normalized.installationGeneration !== state.installationGeneration) {
      fail("state secret slot belongs to another installation", "INVALID_CREDENTIAL_STATE");
    }
  });
  if (new Set(state.secretSlots.map(({ credentialRef }) => credentialRef)).size !== state.secretSlots.length) {
    fail("state contains duplicate credential refs", "INVALID_CREDENTIAL_STATE");
  }
  assertPlainRecord(state.attempts, "state.attempts", "INVALID_CREDENTIAL_STATE");
  for (const [phase, attempt] of Object.entries(state.attempts)) {
    if (!Object.values(EFFECTS).includes(phase) || !Number.isInteger(attempt) || attempt < 1) {
      fail("state attempts are invalid", "INVALID_CREDENTIAL_STATE");
    }
  }
  if (state.pendingEffect !== null) {
    const effect = normalizeEffect(state.pendingEffect, "state.pendingEffect");
    if (effect.installationGeneration !== state.installationGeneration) {
      fail("pending effect belongs to another installation", "INVALID_CREDENTIAL_STATE");
    }
  }
  if (state.unresolvedEffect !== null) {
    const effect = normalizeEffect(state.unresolvedEffect, "state.unresolvedEffect");
    if (effect.installationGeneration !== state.installationGeneration) {
      fail("unresolved effect belongs to another installation", "INVALID_CREDENTIAL_STATE");
    }
  }
  if (state.failure !== null) normalizeFailure(state.failure, "state.failure");
  const terminal = state.status === STATUSES.CONFIGURED || state.status === STATUSES.UNCONFIGURED;
  if (terminal) {
    const expectsConfigured = state.status === STATUSES.CONFIGURED;
    if (state.intent !== null || state.intentDurable || state.pendingEffect !== null
      || state.unresolvedEffect !== null || state.failure !== null || state.networkBlocked
      || (state.activeConfig !== null) !== expectsConfigured) {
      fail("terminal credential state is inconsistent", "INVALID_CREDENTIAL_STATE");
    }
    if (expectsConfigured && !hasSecretRef(state, state.activeConfig.credentialRef)) {
      fail("configured state has no bound secret", "INVALID_CREDENTIAL_STATE");
    }
    if ((expectsConfigured && (state.secretSlots.length !== 1
        || state.secretSlots[0].credentialRef !== state.activeConfig.credentialRef))
      || (!expectsConfigured && state.secretSlots.length !== 0)) {
      fail("terminal credential state contains unexpected secret slots", "INVALID_CREDENTIAL_STATE");
    }
  } else if (!state.networkBlocked) {
    fail("non-terminal credential state must block AI network", "INVALID_CREDENTIAL_STATE");
  }
  if (state.status === STATUSES.RUNNING && (state.intent === null || state.failure !== null
      || state.unresolvedEffect !== null)) {
    fail("running credential state is inconsistent", "INVALID_CREDENTIAL_STATE");
  }
  if (state.status === STATUSES.WAITING_RETRY && (state.unresolvedEffect === null
      || state.failure?.outcome !== "NOT_APPLIED" || state.pendingEffect !== null)) {
    fail("retry credential state is inconsistent", "INVALID_CREDENTIAL_STATE");
  }
  if (state.status === STATUSES.RECONCILING && (state.unresolvedEffect === null
      || state.failure?.outcome !== "UNKNOWN")) {
    fail("reconciling credential state is inconsistent", "INVALID_CREDENTIAL_STATE");
  }
  if (state.status === STATUSES.KEY_REENTRY_REQUIRED) {
    const pendingSaveNeedsSecret = state.intent?.kind === "SAVE"
      && !hasSecretRef(state, state.intent.targetCredentialRef);
    const activeConfigNeedsSecret = state.intent === null
      && state.activeConfig !== null
      && state.secretSlots.length === 0
      && !hasSecretRef(state, state.activeConfig.credentialRef);
    if (!pendingSaveNeedsSecret && !activeConfigNeedsSecret) {
      fail("key reentry state is inconsistent", "INVALID_CREDENTIAL_STATE");
    }
  }
  return state;
}

function registerTransientSecret(operationId, secret) {
  assertSecret(secret);
  const prior = TRANSIENT_SECRETS.get(operationId);
  if (prior !== undefined && prior !== secret) {
    fail("another transient credential is already bound to this operation", "TRANSIENT_SECRET_CONFLICT");
  }
  TRANSIENT_SECRETS.set(operationId, secret);
}

function createInitialCredentialState({ installationGeneration }) {
  const generation = assertIdentifier(
    installationGeneration,
    "installationGeneration",
    INSTALLATION_GENERATION,
    "INVALID_INSTALLATION_GENERATION",
  );
  return stateFromInspection({
    installationGeneration: generation,
    revision: 0,
    activeConfig: null,
    intent: null,
    secretSlots: [],
    vaultState: "AVAILABLE",
    gateClosed: false,
    activeTasks: 0,
    connectionStatePresent: false,
    completedOperationIds: [],
  });
}

function createActiveAIConfigurationEvidence(state) {
  assertState(state);
  if (state.status !== STATUSES.CONFIGURED || state.activeConfig === null) {
    fail("active AI configuration evidence requires a stable configured state", "AI_CONFIGURATION_NOT_STABLE");
  }
  const activeConfig = normalizeConfig(state.activeConfig, "state.activeConfig");
  const secretSlot = normalizeSecretSlot(state.secretSlots[0], "state.secretSlots[0]");
  const core = immutable({
    schemaVersion: "AI_ACTIVE_CONFIGURATION_EVIDENCE_V1",
    lifecycleStatus: STATUSES.CONFIGURED,
    installationGeneration: state.installationGeneration,
    configurationRevision: state.revision,
    activeConfig,
    secretSlot,
    boundary: "NON_SENSITIVE_METADATA_ONLY_NOT_SEND_AUTHORIZATION",
  });
  return immutable({ ...core, evidenceFingerprint: sha256Fingerprint(core) });
}

function normalizeActiveAIConfigurationEvidence(input, field = "configurationEvidence") {
  const containsUnsupportedProperties = (value) => !value || typeof value !== "object" || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
    || Object.getOwnPropertySymbols(value).length > 0
    || Object.values(Object.getOwnPropertyDescriptors(value)).some(
      (descriptor) => !descriptor.enumerable || descriptor.get || descriptor.set,
    );
  if (
    containsUnsupportedProperties(input) ||
    containsUnsupportedProperties(input.activeConfig) ||
    containsUnsupportedProperties(input.secretSlot)
  ) {
    fail("active AI configuration evidence must contain only enumerable data properties", "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE", { field });
  }
  assertExactKeys(
    input,
    [
      "schemaVersion",
      "lifecycleStatus",
      "installationGeneration",
      "configurationRevision",
      "activeConfig",
      "secretSlot",
      "boundary",
      "evidenceFingerprint",
    ],
    [],
    field,
    "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE",
  );
  if (
    input.schemaVersion !== "AI_ACTIVE_CONFIGURATION_EVIDENCE_V1" ||
    input.lifecycleStatus !== STATUSES.CONFIGURED ||
    input.boundary !== "NON_SENSITIVE_METADATA_ONLY_NOT_SEND_AUTHORIZATION" ||
    typeof input.evidenceFingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(input.evidenceFingerprint)
  ) fail("active AI configuration evidence boundary is invalid", "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE", { field });
  const activeConfig = normalizeConfig(input.activeConfig, `${field}.activeConfig`);
  const secretSlot = normalizeSecretSlot(input.secretSlot, `${field}.secretSlot`);
  const installationGeneration = assertIdentifier(
    input.installationGeneration,
    `${field}.installationGeneration`,
    INSTALLATION_GENERATION,
    "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE",
  );
  const configurationRevision = assertRevision(input.configurationRevision, `${field}.configurationRevision`);
  const core = immutable({
    schemaVersion: "AI_ACTIVE_CONFIGURATION_EVIDENCE_V1",
    lifecycleStatus: STATUSES.CONFIGURED,
    installationGeneration,
    configurationRevision,
    activeConfig,
    secretSlot,
    boundary: "NON_SENSITIVE_METADATA_ONLY_NOT_SEND_AUTHORIZATION",
  });
  if (
    configurationRevision < 1 ||
    activeConfig.revision !== configurationRevision ||
    secretSlot.installationGeneration !== installationGeneration ||
    secretSlot.credentialRef !== activeConfig.credentialRef ||
    input.evidenceFingerprint !== sha256Fingerprint(core)
  ) fail("active AI configuration evidence is inconsistent", "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE", { field });
  return immutable({ ...core, evidenceFingerprint: input.evidenceFingerprint });
}

function beginSaveAIProviderConfiguration(state, input) {
  assertState(state);
  assertExactKeys(
    input,
    ["apiKey", "baseURL", "credentialRef", "expectedRevision", "model", "operationId"],
    [],
    "saveInput",
    "INVALID_SAVE_INPUT",
  );
  if (![STATUSES.UNCONFIGURED, STATUSES.CONFIGURED, STATUSES.KEY_REENTRY_REQUIRED].includes(state.status)
    || state.intent !== null) {
    fail("credential lifecycle is busy", "OPERATION_IN_PROGRESS");
  }
  if (input.expectedRevision !== state.revision) fail("configuration revision is stale", "REVISION_CONFLICT");
  const operationId = assertIdentifier(input.operationId, "saveInput.operationId", OPERATION_ID, "INVALID_OPERATION_ID");
  const credentialRef = assertIdentifier(
    input.credentialRef,
    "saveInput.credentialRef",
    CREDENTIAL_REF,
    "INVALID_CREDENTIAL_REF",
  );
  if (state.secretSlots.some(({ credentialRef: existing }) => existing === credentialRef)) {
    fail("credential ref is already present", "CREDENTIAL_REF_CONFLICT");
  }
  const url = normalizeCredentialBaseUrl(input.baseURL);
  const targetConfig = normalizeConfig({
    ...url,
    model: normalizeModel(input.model),
    credentialRef,
    revision: state.revision + 1,
  });
  registerTransientSecret(operationId, input.apiKey);
  const intent = createIntent({
    operationId,
    kind: "SAVE",
    installationGeneration: state.installationGeneration,
    expectedRevision: state.revision,
    previousCredentialRef: state.activeConfig?.credentialRef ?? null,
    targetCredentialRef: credentialRef,
    targetConfig,
  });
  const attempt = 1;
  const provisional = immutable({
    ...state,
    status: STATUSES.RUNNING,
    intent,
    intentDurable: false,
    networkBlocked: true,
    attempts: { [EFFECTS.PERSIST_INTENT]: attempt },
    pendingEffect: null,
    unresolvedEffect: null,
    failure: null,
  });
  const effect = createEffect(provisional, EFFECTS.PERSIST_INTENT, attempt);
  const next = immutable({ ...provisional, pendingEffect: effect });
  assertState(next);
  return Object.freeze({ state: next, effect });
}

function beginRemoveAIProviderCredentials(state, input) {
  assertState(state);
  assertExactKeys(input, ["expectedRevision", "operationId"], [], "removeInput", "INVALID_REMOVE_INPUT");
  if (state.failure?.code === "INSTALLATION_MISMATCH") {
    fail(
      "credentials from another installation require a dedicated recovery protocol",
      "INSTALLATION_RECOVERY_REQUIRED",
    );
  }
  if (![STATUSES.UNCONFIGURED, STATUSES.CONFIGURED, STATUSES.SAFE_RECOVERY_REQUIRED].includes(state.status)
    || state.intent !== null) {
    fail("credential lifecycle is busy", "OPERATION_IN_PROGRESS");
  }
  if (input.expectedRevision !== state.revision) fail("configuration revision is stale", "REVISION_CONFLICT");
  const intent = createIntent({
    operationId: assertIdentifier(input.operationId, "removeInput.operationId", OPERATION_ID, "INVALID_OPERATION_ID"),
    kind: "REMOVE",
    installationGeneration: state.installationGeneration,
    expectedRevision: state.revision,
    previousCredentialRef: state.activeConfig?.credentialRef ?? null,
    targetCredentialRef: null,
    targetConfig: null,
  });
  const attempt = 1;
  const provisional = immutable({
    ...state,
    status: STATUSES.RUNNING,
    intent,
    intentDurable: false,
    networkBlocked: true,
    attempts: { [EFFECTS.PERSIST_INTENT]: attempt },
    pendingEffect: null,
    unresolvedEffect: null,
    failure: null,
  });
  const effect = createEffect(provisional, EFFECTS.PERSIST_INTENT, attempt);
  const next = immutable({ ...provisional, pendingEffect: effect });
  assertState(next);
  return Object.freeze({ state: next, effect });
}

function requestNextCredentialEffect(state) {
  assertState(state);
  if (state.status !== STATUSES.RUNNING || state.pendingEffect !== null) {
    fail("credential lifecycle cannot advance", "INVALID_CREDENTIAL_TRANSITION");
  }
  const type = deriveNextEffectType(state);
  if (!type) fail("credential lifecycle has no next effect", "INVALID_CREDENTIAL_TRANSITION");
  if (type === EFFECTS.WRITE_NEW_SECRET && !TRANSIENT_SECRETS.has(state.intent.operationId)) {
    const next = immutable({ ...state, status: STATUSES.KEY_REENTRY_REQUIRED });
    assertState(next);
    return Object.freeze({ state: next, effect: null });
  }
  const attempt = (state.attempts[type] ?? 0) + 1;
  const effect = createEffect(state, type, attempt);
  const next = immutable({
    ...state,
    attempts: { ...state.attempts, [type]: attempt },
    pendingEffect: effect,
  });
  assertState(next);
  return Object.freeze({ state: next, effect });
}

function retryCredentialEffect(state) {
  assertState(state);
  if (state.status !== STATUSES.WAITING_RETRY || !state.unresolvedEffect || !state.failure?.retryable) {
    fail("credential effect is not retryable", "INVALID_CREDENTIAL_TRANSITION");
  }
  const original = state.unresolvedEffect;
  if (original.phase === EFFECTS.WRITE_NEW_SECRET && !TRANSIENT_SECRETS.has(original.operationId)) {
    const next = immutable({ ...state, status: STATUSES.KEY_REENTRY_REQUIRED });
    assertState(next);
    return Object.freeze({ state: next, effect: null });
  }
  const attempt = (state.attempts[original.phase] ?? original.attempt) + 1;
  const effect = createEffect(state, original.phase, attempt);
  const next = immutable({
    ...state,
    status: STATUSES.RUNNING,
    attempts: { ...state.attempts, [original.phase]: attempt },
    pendingEffect: effect,
    unresolvedEffect: null,
    failure: null,
  });
  assertState(next);
  return Object.freeze({ state: next, effect });
}

function requestCredentialReconciliation(state) {
  assertState(state);
  if (state.status !== STATUSES.RECONCILING || !state.unresolvedEffect || state.pendingEffect !== null) {
    fail("credential effect does not require reconciliation", "INVALID_CREDENTIAL_TRANSITION");
  }
  const attempt = (state.attempts[EFFECTS.RECONCILE_EFFECT] ?? 0) + 1;
  const effect = createEffect(state, EFFECTS.RECONCILE_EFFECT, attempt, state.unresolvedEffect);
  const next = immutable({
    ...state,
    attempts: { ...state.attempts, [EFFECTS.RECONCILE_EFFECT]: attempt },
    pendingEffect: effect,
  });
  assertState(next);
  return Object.freeze({ state: next, effect });
}

function providePendingCredentialSecret(state, { apiKey } = {}) {
  assertState(state);
  if (state.status !== STATUSES.KEY_REENTRY_REQUIRED || state.intent?.kind !== "SAVE") {
    fail("credential reentry is not expected", "INVALID_CREDENTIAL_TRANSITION");
  }
  registerTransientSecret(state.intent.operationId, apiKey);
  const next = immutable({
    ...state,
    status: STATUSES.RUNNING,
    failure: null,
    unresolvedEffect: null,
  });
  assertState(next);
  return next;
}

function discardTransientCredentialSecrets() {
  TRANSIENT_SECRETS.clear();
}

function validateReceipt(input, effect) {
  assertExactKeys(
    input,
    ["commandFingerprint", "disposition", "effectType", "operationId", "phase"],
    [],
    "receipt",
    "INVALID_CREDENTIAL_RECEIPT",
  );
  if (!new Set(["APPLIED", "REPLAYED"]).has(input.disposition)
    || input.operationId !== effect.operationId
    || input.commandFingerprint !== effect.commandFingerprint
    || input.effectType !== effect.type
    || input.phase !== effect.phase) {
    fail("credential receipt does not match its effect", "INVALID_CREDENTIAL_RECEIPT");
  }
  return immutable(input);
}

function assertInspectionFieldsEqual(inspection, state, fields, code = "INVALID_CREDENTIAL_EVIDENCE") {
  for (const field of fields) {
    if (!isDeepStrictEqual(inspection[field], state[field])) {
      fail(`credential evidence changed ${field} unexpectedly`, code, { field });
    }
  }
}

function validateAppliedInspection(state, effect, inspection) {
  if (inspection.installationGeneration !== state.installationGeneration) {
    fail("credential inspection belongs to another installation", "INSTALLATION_MISMATCH");
  }
  const commonUnchanged = [
    "activeConfig",
    "activeTasks",
    "connectionStatePresent",
    "gateClosed",
    "revision",
    "secretSlots",
  ];
  switch (effect.phase) {
    case EFFECTS.PERSIST_INTENT:
      assertInspectionFieldsEqual(inspection, state, commonUnchanged);
      if (!isDeepStrictEqual(inspection.intent, effect.intent)) {
        fail("intent persistence was not proven", "INVALID_CREDENTIAL_EVIDENCE");
      }
      break;
    case EFFECTS.WRITE_NEW_SECRET: {
      assertInspectionFieldsEqual(
        inspection,
        state,
        commonUnchanged.filter((field) => field !== "secretSlots"),
      );
      const expectedSlots = [...state.secretSlots, {
        credentialRef: effect.intent.targetCredentialRef,
        installationGeneration: state.installationGeneration,
        operationId: effect.operationId,
      }].sort((left, right) => left.credentialRef.localeCompare(right.credentialRef, "en"));
      if (inspection.vaultState !== "AVAILABLE"
        || !isDeepStrictEqual(inspection.intent, effect.intent)
        || !isDeepStrictEqual(inspection.secretSlots, expectedSlots)) {
        fail("new secret write was not proven", "INVALID_CREDENTIAL_EVIDENCE");
      }
      break;
    }
    case EFFECTS.QUIESCE_AI:
      assertInspectionFieldsEqual(
        inspection,
        state,
        ["activeConfig", "connectionStatePresent", "revision", "secretSlots"],
      );
      if (!isDeepStrictEqual(inspection.intent, effect.intent)
        || !inspection.gateClosed
        || inspection.activeTasks !== 0) {
        fail("AI activity quiescence was not proven", "INVALID_CREDENTIAL_EVIDENCE");
      }
      break;
    case EFFECTS.ACTIVATE_CONFIG:
      assertInspectionFieldsEqual(inspection, state, ["gateClosed", "activeTasks", "secretSlots"]);
      if (inspection.vaultState !== "AVAILABLE"
        || !isDeepStrictEqual(inspection.intent, effect.intent)
        || !isDeepStrictEqual(inspection.activeConfig, effect.intent.targetConfig)
        || inspection.revision !== effect.intent.expectedRevision + 1
        || !inspection.connectionStatePresent) {
        fail("active configuration commit was not proven", "INVALID_CREDENTIAL_EVIDENCE");
      }
      break;
    case EFFECTS.DELETE_OLD_SECRET: {
      assertInspectionFieldsEqual(
        inspection,
        state,
        ["activeConfig", "activeTasks", "connectionStatePresent", "gateClosed", "revision"],
      );
      const expectedSlots = state.secretSlots.filter(
        ({ credentialRef }) => credentialRef !== effect.intent.previousCredentialRef,
      );
      if (inspection.vaultState !== "AVAILABLE"
        || !isDeepStrictEqual(inspection.intent, effect.intent)
        || !isDeepStrictEqual(inspection.secretSlots, expectedSlots)) {
        fail("old secret deletion was not proven", "INVALID_CREDENTIAL_EVIDENCE");
      }
      break;
    }
    case EFFECTS.DELETE_ALL_SECRETS:
      assertInspectionFieldsEqual(
        inspection,
        state,
        ["activeConfig", "activeTasks", "connectionStatePresent", "gateClosed", "revision"],
      );
      if (inspection.vaultState !== "AVAILABLE"
        || !isDeepStrictEqual(inspection.intent, effect.intent)
        || inspection.secretSlots.length !== 0) {
        fail("secret absence was not proven", "INVALID_CREDENTIAL_EVIDENCE");
      }
      break;
    case EFFECTS.DELETE_CONFIG: {
      assertInspectionFieldsEqual(inspection, state, ["activeTasks", "gateClosed", "secretSlots"]);
      const expectedRevision = effect.intent.expectedRevision
        + (effect.intent.previousCredentialRef === null ? 0 : 1);
      if (!isDeepStrictEqual(inspection.intent, effect.intent)
        || inspection.activeConfig !== null
        || inspection.connectionStatePresent
        || inspection.revision !== expectedRevision) {
        fail("configuration deletion was not proven", "INVALID_CREDENTIAL_EVIDENCE");
      }
      break;
    }
    case EFFECTS.VERIFY_AND_CLEAR_INTENT: {
      const saving = effect.intent.kind === "SAVE";
      const expectedRevision = effect.intent.expectedRevision
        + (saving || effect.intent.previousCredentialRef !== null ? 1 : 0);
      const expectedSlots = saving ? [state.secretSlots.find(
        ({ credentialRef }) => credentialRef === effect.intent.targetCredentialRef,
      )].filter(Boolean) : [];
      if (inspection.vaultState !== "AVAILABLE"
        || inspection.intent !== null
        || inspection.gateClosed
        || inspection.activeTasks !== 0
        || inspection.revision !== expectedRevision
        || !isDeepStrictEqual(inspection.activeConfig, saving ? effect.intent.targetConfig : null)
        || !isDeepStrictEqual(inspection.secretSlots, expectedSlots)
        || inspection.connectionStatePresent !== saving
        || !inspection.completedOperationIds.includes(effect.operationId)) {
        fail("final credential state was not proven", "INVALID_CREDENTIAL_EVIDENCE");
      }
      break;
    }
    default:
      fail("credential effect phase is unsupported", "INVALID_CREDENTIAL_EVIDENCE");
  }
  return inspection;
}

function inspectionProvesNotApplied(state, effect, inspection) {
  const expectedIntent = state.intentDurable ? state.intent : null;
  return inspection.installationGeneration === state.installationGeneration
    && inspection.revision === state.revision
    && isDeepStrictEqual(inspection.activeConfig, state.activeConfig)
    && isDeepStrictEqual(inspection.intent, expectedIntent)
    && isDeepStrictEqual(inspection.secretSlots, state.secretSlots)
    && inspection.gateClosed === state.gateClosed
    && inspection.activeTasks === state.activeTasks
    && inspection.connectionStatePresent === state.connectionStatePresent;
}

function failureFromError(error, { allowNotApplied = true } = {}) {
  const outcome = allowNotApplied && error?.outcome === "NOT_APPLIED" ? "NOT_APPLIED" : "UNKNOWN";
  return immutable({
    outcome,
    code: typeof error?.code === "string" && FAILURE_CODES.has(error.code)
      ? error.code
      : "CREDENTIAL_ADAPTER_FAILURE",
    retryable: outcome === "UNKNOWN" || error?.retryable !== false,
  });
}

async function executeCredentialEffect(adapter, rawEffect) {
  if (!adapter || typeof adapter.applyCredentialEffect !== "function"
    || typeof adapter.reconcileCredentialEffect !== "function") {
    fail("credential adapter port is invalid", "INVALID_CREDENTIAL_ADAPTER");
  }
  const effect = normalizeEffect(rawEffect);
  let raw;
  try {
    if (effect.type === EFFECTS.RECONCILE_EFFECT) {
      raw = await adapter.reconcileCredentialEffect(effect);
    } else {
      const secret = effect.type === EFFECTS.WRITE_NEW_SECRET
        ? TRANSIENT_SECRETS.get(effect.operationId)
        : undefined;
      if (effect.type === EFFECTS.WRITE_NEW_SECRET && secret === undefined) {
        const error = new Error("credential must be entered again");
        Object.assign(error, { code: "SECRET_REENTRY_REQUIRED", outcome: "NOT_APPLIED", retryable: true });
        throw error;
      }
      raw = await adapter.applyCredentialEffect(effect, secret);
    }
  } catch (error) {
    return immutable({
      status: "FAILURE",
      operationId: effect.operationId,
      phase: effect.phase,
      attempt: effect.attempt,
      effectFingerprint: effect.fingerprint,
      receipt: null,
      inspection: null,
      resolution: null,
      error: failureFromError(error),
    });
  }
  try {
    assertExactKeys(
      raw,
      effect.type === EFFECTS.RECONCILE_EFFECT
        ? ["inspection", "receipt", "resolution"]
        : ["inspection", "receipt"],
      [],
      "adapterResult",
      "INVALID_CREDENTIAL_ADAPTER_RESULT",
    );
    const receipt = validateReceipt(raw.receipt, effect);
    const inspection = normalizeInspection(raw.inspection);
    const resolution = effect.type === EFFECTS.RECONCILE_EFFECT ? raw.resolution : "APPLIED";
    if (!new Set(["APPLIED", "NOT_APPLIED", "INDETERMINATE"]).has(resolution)) {
      fail("credential reconciliation resolution is invalid", "INVALID_RECONCILIATION_RESULT");
    }
    if ((effect.type === EFFECTS.WRITE_NEW_SECRET
        || (effect.type === EFFECTS.RECONCILE_EFFECT
          && effect.originalEffect.phase === EFFECTS.WRITE_NEW_SECRET))
      && resolution === "APPLIED") {
      TRANSIENT_SECRETS.delete(effect.operationId);
    }
    return immutable({
      status: "SUCCESS",
      operationId: effect.operationId,
      phase: effect.phase,
      attempt: effect.attempt,
      effectFingerprint: effect.fingerprint,
      receipt,
      inspection,
      resolution,
      error: null,
    });
  } catch (error) {
    return immutable({
      status: "FAILURE",
      operationId: effect.operationId,
      phase: effect.phase,
      attempt: effect.attempt,
      effectFingerprint: effect.fingerprint,
      receipt: null,
      inspection: null,
      resolution: null,
      error: failureFromError(error, { allowNotApplied: false }),
    });
  }
}

function settleCredentialEffect(state, outcome) {
  assertState(state);
  assertExactKeys(
    outcome,
    [
      "attempt",
      "effectFingerprint",
      "error",
      "inspection",
      "operationId",
      "phase",
      "receipt",
      "resolution",
      "status",
    ],
    [],
    "outcome",
    "INVALID_CREDENTIAL_OUTCOME",
  );
  if (![STATUSES.RUNNING, STATUSES.RECONCILING].includes(state.status) || !state.pendingEffect) {
    fail("credential outcome is not expected", "INVALID_CREDENTIAL_TRANSITION");
  }
  const effect = normalizeEffect(state.pendingEffect);
  if (outcome.operationId !== effect.operationId
    || outcome.phase !== effect.phase
    || outcome.attempt !== effect.attempt
    || outcome.effectFingerprint !== effect.fingerprint) {
    fail("credential outcome is stale", "STALE_CREDENTIAL_OUTCOME");
  }
  if (outcome.status === "FAILURE") {
    if (outcome.receipt !== null || outcome.inspection !== null || outcome.resolution !== null) {
      fail("failure outcome contains contradictory evidence", "INVALID_CREDENTIAL_OUTCOME");
    }
    const failure = normalizeFailure(outcome.error, "outcome.error");
    const status = failure.code === "SECRET_REENTRY_REQUIRED"
      ? STATUSES.KEY_REENTRY_REQUIRED
      : failure.outcome === "UNKNOWN"
        ? STATUSES.RECONCILING
        : STATUSES.WAITING_RETRY;
    const next = immutable({
      ...state,
      status,
      pendingEffect: null,
      unresolvedEffect: effect,
      failure,
      networkBlocked: true,
    });
    assertState(next);
    return next;
  }
  if (outcome.status !== "SUCCESS" || outcome.error !== null) {
    fail("credential outcome status is invalid", "INVALID_CREDENTIAL_OUTCOME");
  }
  validateReceipt(outcome.receipt, effect);
  const inspection = normalizeInspection(outcome.inspection);
  if (inspection.installationGeneration !== state.installationGeneration) {
    fail("credential inspection belongs to another installation", "INSTALLATION_MISMATCH");
  }
  if (effect.type === EFFECTS.RECONCILE_EFFECT) {
    if (outcome.resolution === "NOT_APPLIED") {
      if (!inspectionProvesNotApplied(state, effect.originalEffect, inspection)) {
        fail("credential non-application was not proven", "INVALID_CREDENTIAL_EVIDENCE");
      }
      const failure = immutable({ outcome: "NOT_APPLIED", code: "RECONCILED_NOT_APPLIED", retryable: true });
      const next = stateFromInspection(inspection, {
        status: STATUSES.WAITING_RETRY,
        attempts: state.attempts,
        unresolvedEffect: effect.originalEffect,
        failure,
        networkBlocked: true,
      });
      assertState(next);
      return next;
    }
    if (outcome.resolution === "INDETERMINATE") {
      const next = stateFromInspection(inspection, {
        status: STATUSES.SAFE_RECOVERY_REQUIRED,
        attempts: state.attempts,
        failure: { outcome: "UNKNOWN", code: "RECONCILIATION_INDETERMINATE", retryable: true },
        networkBlocked: true,
      });
      assertState(next);
      return next;
    }
    if (outcome.resolution !== "APPLIED") {
      fail("credential reconciliation resolution is invalid", "INVALID_RECONCILIATION_RESULT");
    }
    validateAppliedInspection(state, effect.originalEffect, inspection);
  } else if (outcome.resolution !== "APPLIED") {
    fail("ordinary credential success must be applied", "INVALID_CREDENTIAL_OUTCOME");
  } else {
    validateAppliedInspection(state, effect, inspection);
  }
  const terminal = inspection.intent === null;
  const next = stateFromInspection(inspection, {
    status: terminal
      ? inspection.activeConfig === null ? STATUSES.UNCONFIGURED : STATUSES.CONFIGURED
      : STATUSES.RUNNING,
    attempts: terminal ? {} : state.attempts,
    networkBlocked: !terminal,
  });
  assertState(next);
  return next;
}

async function loadAndReconcileCredentialState(adapter, { installationGeneration }) {
  if (!adapter || typeof adapter.inspectCredentialLifecycle !== "function") {
    fail("credential adapter port is invalid", "INVALID_CREDENTIAL_ADAPTER");
  }
  const expectedGeneration = assertIdentifier(
    installationGeneration,
    "installationGeneration",
    INSTALLATION_GENERATION,
    "INVALID_INSTALLATION_GENERATION",
  );
  let inspection;
  try {
    inspection = normalizeInspection(await adapter.inspectCredentialLifecycle());
  } catch (error) {
    if (error?.code !== "INSPECTION_INSTALLATION_MISMATCH") throw error;
    const initial = createInitialCredentialState({ installationGeneration: expectedGeneration });
    const next = immutable({
      ...initial,
      status: STATUSES.SAFE_RECOVERY_REQUIRED,
      failure: { outcome: "UNKNOWN", code: "INSTALLATION_MISMATCH", retryable: true },
      networkBlocked: true,
    });
    assertState(next);
    return next;
  }
  if (inspection.installationGeneration !== expectedGeneration || inspection.vaultState === "UNAVAILABLE") {
    const next = stateFromInspection(inspection, {
      status: STATUSES.SAFE_RECOVERY_REQUIRED,
      failure: { outcome: "UNKNOWN", code: inspection.vaultState === "UNAVAILABLE"
        ? "VAULT_UNAVAILABLE"
        : "INSTALLATION_MISMATCH", retryable: true },
      networkBlocked: true,
    });
    assertState(next);
    return next;
  }
  if (inspection.intent !== null) {
    let status = STATUSES.RUNNING;
    if (inspection.intent.kind === "SAVE"
      && !inspection.secretSlots.some(({ credentialRef }) => credentialRef === inspection.intent.targetCredentialRef)
      && !TRANSIENT_SECRETS.has(inspection.intent.operationId)) {
      status = STATUSES.KEY_REENTRY_REQUIRED;
    }
    const next = stateFromInspection(inspection, { status, networkBlocked: true });
    assertState(next);
    return next;
  }
  if (inspection.activeConfig !== null) {
    const activeSlot = inspection.secretSlots.find(
      ({ credentialRef }) => credentialRef === inspection.activeConfig.credentialRef,
    );
    if (!activeSlot || activeSlot.installationGeneration !== expectedGeneration
      || inspection.secretSlots.length !== 1) {
      const onlyActiveSecretIsMissing = !activeSlot && inspection.secretSlots.length === 0;
      const next = stateFromInspection(inspection, {
        status: onlyActiveSecretIsMissing
          ? STATUSES.KEY_REENTRY_REQUIRED
          : STATUSES.SAFE_RECOVERY_REQUIRED,
        failure: onlyActiveSecretIsMissing
          ? null
          : { outcome: "UNKNOWN", code: "UNEXPECTED_SECRET_SLOTS", retryable: true },
        networkBlocked: true,
      });
      assertState(next);
      return next;
    }
    const next = stateFromInspection(inspection, { status: STATUSES.CONFIGURED, networkBlocked: false });
    assertState(next);
    return next;
  }
  if (inspection.secretSlots.length !== 0) {
    const next = stateFromInspection(inspection, {
      status: STATUSES.SAFE_RECOVERY_REQUIRED,
      failure: { outcome: "UNKNOWN", code: "ORPHAN_SECRET_SLOTS", retryable: true },
      networkBlocked: true,
    });
    assertState(next);
    return next;
  }
  const next = stateFromInspection(inspection, { status: STATUSES.UNCONFIGURED, networkBlocked: false });
  assertState(next);
  return next;
}

function createInMemoryAICredentialAdapter({
  installationGeneration,
  activePair = null,
  orphanSecrets = [],
  failurePlan = [],
  activeTasks = 0,
  vaultState = "AVAILABLE",
} = {}) {
  const generation = assertIdentifier(
    installationGeneration,
    "installationGeneration",
    INSTALLATION_GENERATION,
    "INVALID_INSTALLATION_GENERATION",
  );
  if (!Number.isInteger(activeTasks) || activeTasks < 0) fail("activeTasks is invalid", "INVALID_ACTIVE_TASKS");
  if (!new Set(["AVAILABLE", "UNAVAILABLE"]).has(vaultState)) fail("vaultState is invalid", "INVALID_VAULT_STATE");
  if (!Array.isArray(failurePlan) || failurePlan.some((item) => {
    if (!item || typeof item !== "object") return true;
    return !Object.values(EFFECTS).includes(item.effectType) || !FAILURE_POINTS.has(item.point);
  })) fail("failurePlan is invalid", "INVALID_FAILURE_PLAN");
  let revision = 0;
  let activeConfig = null;
  let intent = null;
  let connectionStatePresent = false;
  let gateClosed = false;
  let runningTasks = activeTasks;
  let currentVaultState = vaultState;
  const slots = new Map();
  const completed = new Map();
  const phaseLedger = new Map();
  const plannedFailures = failurePlan.map((item) => ({ ...item }));
  const counters = {
    applyCalls: 0,
    reconcileCalls: 0,
    puts: 0,
    deletes: 0,
    secretReadCount: 0,
    transportCallCount: 0,
    bodyAssemblyCount: 0,
  };

  function seedSlot({ credentialRef, operationId, apiKey, installationGeneration: slotGeneration = generation }) {
    const metadata = normalizeSecretSlot({ credentialRef, operationId, installationGeneration: slotGeneration });
    assertSecret(apiKey);
    slots.set(metadata.credentialRef, { metadata, secret: apiKey });
  }

  if (activePair !== null) {
    assertExactKeys(activePair, ["apiKey", "config", "operationId"], [], "activePair", "INVALID_ACTIVE_PAIR");
    activeConfig = normalizeConfig(activePair.config, "activePair.config");
    revision = activeConfig.revision;
    seedSlot({
      credentialRef: activeConfig.credentialRef,
      operationId: activePair.operationId,
      apiKey: activePair.apiKey,
    });
    connectionStatePresent = true;
  }
  if (!Array.isArray(orphanSecrets)) fail("orphanSecrets must be an array", "INVALID_ORPHAN_SECRETS");
  orphanSecrets.forEach(seedSlot);

  function inspect() {
    return immutable({
      installationGeneration: generation,
      revision,
      activeConfig,
      intent,
      secretSlots: [...slots.values()].map(({ metadata }) => metadata),
      vaultState: currentVaultState,
      gateClosed,
      activeTasks: runningTasks,
      connectionStatePresent,
      completedOperationIds: [...completed.keys()],
    });
  }

  function adapterError(code, outcome, retryable = true) {
    const error = new Error("credential adapter operation failed");
    Object.assign(error, { code, outcome, retryable });
    return error;
  }

  function maybeFail(effectType, point) {
    const index = plannedFailures.findIndex((item) => item.effectType === effectType && item.point === point);
    if (index >= 0) {
      plannedFailures.splice(index, 1);
      throw adapterError(
        point === "BEFORE_APPLY" ? "INJECTED_BEFORE_APPLY" : "INJECTED_AFTER_APPLY",
        point === "BEFORE_APPLY" ? "NOT_APPLIED" : "UNKNOWN",
        true,
      );
    }
  }

  function assertAvailable() {
    if (currentVaultState !== "AVAILABLE") throw adapterError("VAULT_UNAVAILABLE", "NOT_APPLIED", true);
  }

  function phaseKey(effect) {
    return `${effect.operationId}:${effect.phase}`;
  }

  function receipt(effect, disposition = "APPLIED") {
    return immutable({
      operationId: effect.operationId,
      commandFingerprint: effect.commandFingerprint,
      effectType: effect.type,
      phase: effect.phase,
      disposition,
    });
  }

  function validateCurrentIntent(effect) {
    if (!intent || intent.commandFingerprint !== effect.commandFingerprint
      || intent.operationId !== effect.operationId) {
      throw adapterError("INTENT_MISMATCH", "NOT_APPLIED", false);
    }
  }

  function applyMutation(effect, secret) {
    switch (effect.type) {
      case EFFECTS.PERSIST_INTENT: {
        const completedOperation = completed.get(effect.operationId);
        if (completedOperation) {
          if (completedOperation.commandFingerprint !== effect.commandFingerprint) {
            throw adapterError("IDEMPOTENCY_CONFLICT", "NOT_APPLIED", false);
          }
          return;
        }
        if (intent) {
          if (intent.commandFingerprint !== effect.commandFingerprint) {
            throw adapterError("OPERATION_IN_PROGRESS", "NOT_APPLIED", false);
          }
          return;
        }
        if (revision !== effect.expectedRevision
          || (activeConfig?.credentialRef ?? null) !== effect.intent.previousCredentialRef) {
          throw adapterError("REVISION_CONFLICT", "NOT_APPLIED", false);
        }
        intent = effect.intent;
        return;
      }
      case EFFECTS.WRITE_NEW_SECRET:
        validateCurrentIntent(effect);
        assertAvailable();
        assertSecret(secret);
        if (slots.has(intent.targetCredentialRef)) {
          const existing = slots.get(intent.targetCredentialRef).metadata;
          if (existing.operationId !== effect.operationId
            || existing.installationGeneration !== generation) {
            throw adapterError("CREDENTIAL_REF_CONFLICT", "NOT_APPLIED", false);
          }
          return;
        }
        seedSlot({
          credentialRef: intent.targetCredentialRef,
          operationId: effect.operationId,
          apiKey: secret,
        });
        counters.puts += 1;
        return;
      case EFFECTS.QUIESCE_AI:
        validateCurrentIntent(effect);
        gateClosed = true;
        runningTasks = 0;
        return;
      case EFFECTS.ACTIVATE_CONFIG:
        validateCurrentIntent(effect);
        assertAvailable();
        if (!gateClosed || runningTasks !== 0) {
          throw adapterError("AI_NOT_QUIESCED", "NOT_APPLIED", false);
        }
        if (!slots.has(intent.targetCredentialRef)) {
          throw adapterError("TARGET_SECRET_MISSING", "NOT_APPLIED", false);
        }
        if (isDeepStrictEqual(activeConfig, intent.targetConfig)) return;
        if (revision !== intent.expectedRevision
          || (activeConfig?.credentialRef ?? null) !== intent.previousCredentialRef) {
          throw adapterError("REVISION_CONFLICT", "NOT_APPLIED", false);
        }
        activeConfig = intent.targetConfig;
        revision = activeConfig.revision;
        connectionStatePresent = true;
        return;
      case EFFECTS.DELETE_OLD_SECRET:
        validateCurrentIntent(effect);
        assertAvailable();
        if (!gateClosed || runningTasks !== 0 || !isDeepStrictEqual(activeConfig, intent.targetConfig)) {
          throw adapterError("AI_NOT_QUIESCED", "NOT_APPLIED", false);
        }
        if (intent.previousCredentialRef !== null && slots.delete(intent.previousCredentialRef)) {
          counters.deletes += 1;
        }
        return;
      case EFFECTS.DELETE_ALL_SECRETS:
        validateCurrentIntent(effect);
        assertAvailable();
        if (!gateClosed || runningTasks !== 0) throw adapterError("AI_NOT_QUIESCED", "NOT_APPLIED", false);
        counters.deletes += slots.size;
        slots.clear();
        return;
      case EFFECTS.DELETE_CONFIG:
        validateCurrentIntent(effect);
        if (intent.kind !== "REMOVE" || !gateClosed || runningTasks !== 0 || slots.size !== 0) {
          throw adapterError("REMOVE_PRECONDITION_FAILED", "NOT_APPLIED", false);
        }
        if (activeConfig !== null) revision += 1;
        activeConfig = null;
        connectionStatePresent = false;
        return;
      case EFFECTS.VERIFY_AND_CLEAR_INTENT:
        validateCurrentIntent(effect);
        assertAvailable();
        if (intent.kind === "SAVE") {
          const currentRefs = [...slots.keys()].sort();
          if (!isDeepStrictEqual(activeConfig, intent.targetConfig)
            || !isDeepStrictEqual(currentRefs, [intent.targetCredentialRef])
            || revision !== intent.expectedRevision + 1) {
            throw adapterError("ACTIVE_PAIR_NOT_VERIFIED", "NOT_APPLIED", false);
          }
        } else if (activeConfig !== null || slots.size !== 0 || connectionStatePresent) {
          throw adapterError("ABSENCE_NOT_VERIFIED", "NOT_APPLIED", false);
        }
        completed.set(effect.operationId, {
          commandFingerprint: effect.commandFingerprint,
          revision,
          mode: activeConfig === null ? "UNCONFIGURED" : "CONFIGURED",
        });
        intent = null;
        gateClosed = false;
        return;
      default:
        throw adapterError("UNSUPPORTED_EFFECT", "NOT_APPLIED", false);
    }
  }

  async function applyCredentialEffect(rawEffect, secret) {
    counters.applyCalls += 1;
    const effect = normalizeEffect(rawEffect);
    if (effect.type === EFFECTS.RECONCILE_EFFECT) {
      throw adapterError("INVALID_EFFECT_PORT", "NOT_APPLIED", false);
    }
    const key = phaseKey(effect);
    const prior = phaseLedger.get(key);
    if (prior) {
      if (prior.fingerprint !== effect.fingerprint) {
        throw adapterError("IDEMPOTENCY_CONFLICT", "NOT_APPLIED", false);
      }
      return immutable({ receipt: receipt(effect, "REPLAYED"), inspection: inspect() });
    }
    maybeFail(effect.type, "BEFORE_APPLY");
    applyMutation(effect, secret);
    const inspection = inspect();
    phaseLedger.set(key, { fingerprint: effect.fingerprint, inspection });
    maybeFail(effect.type, "AFTER_APPLY");
    return immutable({ receipt: receipt(effect), inspection });
  }

  function effectApplied(effect, inspection) {
    const expectedIntent = effect.intent;
    switch (effect.phase) {
      case EFFECTS.PERSIST_INTENT:
        return inspection.intent?.commandFingerprint === effect.commandFingerprint
          || inspection.completedOperationIds.includes(effect.operationId);
      case EFFECTS.WRITE_NEW_SECRET:
        return inspection.secretSlots.some(({ credentialRef, operationId }) => (
          credentialRef === expectedIntent.targetCredentialRef && operationId === effect.operationId
        ));
      case EFFECTS.QUIESCE_AI:
        return inspection.gateClosed && inspection.activeTasks === 0;
      case EFFECTS.ACTIVATE_CONFIG:
        return isDeepStrictEqual(inspection.activeConfig, expectedIntent.targetConfig);
      case EFFECTS.DELETE_OLD_SECRET:
        return !inspection.secretSlots.some(
          ({ credentialRef }) => credentialRef === expectedIntent.previousCredentialRef,
        );
      case EFFECTS.DELETE_ALL_SECRETS:
        return inspection.secretSlots.length === 0;
      case EFFECTS.DELETE_CONFIG:
        return inspection.activeConfig === null && !inspection.connectionStatePresent;
      case EFFECTS.VERIFY_AND_CLEAR_INTENT:
        return inspection.intent === null && inspection.completedOperationIds.includes(effect.operationId);
      default:
        return false;
    }
  }

  async function reconcileCredentialEffect(rawEffect) {
    counters.reconcileCalls += 1;
    const effect = normalizeEffect(rawEffect);
    if (effect.type !== EFFECTS.RECONCILE_EFFECT) {
      throw adapterError("INVALID_RECONCILIATION_EFFECT", "NOT_APPLIED", false);
    }
    const inspection = inspect();
    const original = effect.originalEffect;
    const applied = effectApplied(original, inspection);
    const impossible = inspection.vaultState === "UNAVAILABLE"
      || (inspection.intent !== null
        && inspection.intent.commandFingerprint !== original.commandFingerprint);
    return immutable({
      receipt: receipt(effect),
      inspection,
      resolution: impossible ? "INDETERMINATE" : applied ? "APPLIED" : "NOT_APPLIED",
    });
  }

  async function inspectCredentialLifecycle() {
    return inspect();
  }

  function snapshot() {
    return immutable({
      ...inspect(),
      counters,
      pendingFailures: plannedFailures,
      secretCount: slots.size,
    });
  }

  function resetProcessState() {
    gateClosed = false;
    runningTasks = 0;
  }

  function setVaultState(next) {
    if (!new Set(["AVAILABLE", "UNAVAILABLE"]).has(next)) fail("vaultState is invalid", "INVALID_VAULT_STATE");
    currentVaultState = next;
  }

  return Object.freeze({
    applyCredentialEffect,
    inspectCredentialLifecycle,
    reconcileCredentialEffect,
    resetProcessState,
    setVaultState,
    snapshot,
  });
}

export {
  EFFECTS,
  OPERATION_KINDS,
  PROTOCOL_VERSION,
  STATUSES,
  beginRemoveAIProviderCredentials,
  beginSaveAIProviderConfiguration,
  canonicalStringify,
  createActiveAIConfigurationEvidence,
  createInMemoryAICredentialAdapter,
  createInitialCredentialState,
  discardTransientCredentialSecrets,
  executeCredentialEffect,
  loadAndReconcileCredentialState,
  normalizeActiveAIConfigurationEvidence,
  normalizeCredentialBaseUrl,
  providePendingCredentialSecret,
  requestCredentialReconciliation,
  requestNextCredentialEffect,
  retryCredentialEffect,
  settleCredentialEffect,
};
