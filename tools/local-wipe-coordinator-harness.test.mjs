import assert from "node:assert/strict";
import test from "node:test";

import {
  EFFECTS,
  EXTERNAL_FILES_SCOPE,
  HARNESS_INVENTORY_CONTRACT,
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
  recoverWipeFromIntent,
  reconcileWipeStartup,
  requestNextWipeEffect,
  requestWipeReconciliation,
  settleWipeEffect,
  wipeEffectFingerprint,
} from "./local-wipe-coordinator-harness.mjs";

const INTENT = Object.freeze({
  operationId: "wipe_0123456789abcdef0123456789abcdef",
  protocolVersion: WIPE_PROTOCOL_VERSION,
  installationGeneration: "install_fedcba9876543210fedcba9876543210",
  inventoryRevision: HARNESS_INVENTORY_CONTRACT.revision,
  inventoryFingerprint: HARNESS_INVENTORY_CONTRACT.fingerprint,
  writerRegistryRevision: HARNESS_WRITER_REGISTRY.revision,
  writerRegistryFingerprint: HARNESS_WRITER_REGISTRY.fingerprint,
});

async function applyPending(state, effect, adapter) {
  const outcome = await executeWipeEffect(adapter, effect);
  return settleWipeEffect(state, outcome);
}

async function driveToCompletion(adapter, input = INTENT) {
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), input);
  while (state.status !== WIPE_STATUSES.READY_FOR_FRESH_START) {
    const outcome = await executeWipeEffect(adapter, effect);
    state = settleWipeEffect(state, outcome);
    if (state.status === WIPE_STATUSES.RECONCILING) {
      ({ state, effect } = requestWipeReconciliation(state));
      continue;
    }
    if (state.status === WIPE_STATUSES.WAITING_RETRY) {
      ({ state, effect } = requestNextWipeEffect(state));
      continue;
    }
    if (state.status !== WIPE_STATUSES.READY_FOR_FRESH_START) {
      ({ state, effect } = requestNextWipeEffect(state));
    }
  }
  return state;
}

async function driveRecoveredToCompletion(adapter, intent) {
  let state = recoverWipeFromIntent(intent);
  let effect;
  ({ state, effect } = requestNextWipeEffect(state));
  while (state.status !== WIPE_STATUSES.READY_FOR_FRESH_START) {
    state = await applyPending(state, effect, adapter);
    if (state.status === WIPE_STATUSES.RECONCILING) {
      ({ state, effect } = requestWipeReconciliation(state));
    } else if (state.status === WIPE_STATUSES.WAITING_RETRY) {
      ({ state, effect } = requestNextWipeEffect(state));
    } else if (state.status !== WIPE_STATUSES.READY_FOR_FRESH_START) {
      ({ state, effect } = requestNextWipeEffect(state));
    }
  }
  return state;
}

test("confirmed wipe emits only a durable-intent effect first", () => {
  const before = createWipeCoordinatorState();
  const { state, effect } = beginConfirmedWipe(before, INTENT);

  assert.equal(before.status, WIPE_STATUSES.IDLE);
  assert.equal(state.phase, WIPE_PHASES.IDLE);
  assert.equal(state.writesBlocked, false);
  assert.equal(effect.type, EFFECTS.PERSIST_INTENT);
  assert.equal(effect.phase, WIPE_PHASES.INTENT_DURABLE);
  assert.equal(effect.idempotencyKey, `${INTENT.operationId}:INTENT_DURABLE`);
  assert.deepEqual(effect.intent, INTENT);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(effect.intent), true);
});

test("intent write failure performs no deletion and can retry", async () => {
  const adapter = createInMemoryWipeAdapter({
    failurePlan: { [EFFECTS.PERSIST_INTENT]: "BEFORE_APPLY" },
  });
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  const firstIdempotencyKey = effect.idempotencyKey;
  state = await applyPending(state, effect, adapter);

  assert.equal(state.status, WIPE_STATUSES.WAITING_RETRY);
  assert.equal(state.phase, WIPE_PHASES.IDLE);
  assert.equal(state.writesBlocked, false);
  assert.equal(adapter.snapshot().intent, null);
  assert.equal(adapter.snapshot().databaseKeyPresent, true);
  assert.equal(adapter.snapshot().knownArtifacts.length > 0, true);

  ({ state, effect } = requestNextWipeEffect(state));
  assert.equal(effect.idempotencyKey, firstIdempotencyKey);
  assert.equal(effect.attempt, 2);
  state = await applyPending(state, effect, adapter);
  assert.equal(state.phase, WIPE_PHASES.INTENT_DURABLE);
  assert.equal(state.writesBlocked, true);
});

test("happy path completes every phase and preserves the external Files boundary", async () => {
  const adapter = createInMemoryWipeAdapter({ externalFilesCopies: 3 });
  const state = await driveToCompletion(adapter);
  const runtime = adapter.snapshot();

  assert.equal(state.status, WIPE_STATUSES.READY_FOR_FRESH_START);
  assert.equal(state.phase, WIPE_PHASES.READY_FOR_FRESH_START);
  assert.equal(state.intent, null);
  assert.equal(state.writesBlocked, false);
  assert.equal(state.externalFilesScope, EXTERNAL_FILES_SCOPE);
  assert.equal(runtime.intent, null);
  assert.equal(runtime.databaseKeyPresent, false);
  assert.equal(runtime.aiKeyCount, 0);
  assert.deepEqual(runtime.knownArtifacts, []);
  assert.equal(runtime.externalFilesCopies, 3);
});

test("response loss after intent persistence is reconciled before deletion continues", async () => {
  const adapter = createInMemoryWipeAdapter({
    failurePlan: { [EFFECTS.PERSIST_INTENT]: "AFTER_APPLY" },
  });
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  state = await applyPending(state, effect, adapter);

  assert.equal(state.status, WIPE_STATUSES.RECONCILING);
  assert.equal(state.phase, WIPE_PHASES.IDLE);
  assert.equal(state.writesBlocked, true);
  assert.equal(adapter.snapshot().intent.operationId, INTENT.operationId);
  assert.throws(() => requestNextWipeEffect({ ...state, status: WIPE_STATUSES.RUNNING }), {
    code: "INVALID_WIPE_STATE",
  });

  ({ state, effect } = requestWipeReconciliation(state));
  assert.equal(effect.type, EFFECTS.RECONCILE_PHASE);
  assert.equal(effect.phaseIdempotencyKey, `${INTENT.operationId}:INTENT_DURABLE`);
  state = await applyPending(state, effect, adapter);
  assert.equal(state.phase, WIPE_PHASES.INTENT_DURABLE);
});

for (const effectType of [
  EFFECTS.QUIESCE_WRITERS_AND_TASKS,
  EFFECTS.CLOSE_CONNECTIONS,
  EFFECTS.INVALIDATE_SECRETS,
  EFFECTS.REMOVE_LOCAL_ARTIFACTS,
  EFFECTS.VERIFY_EMPTY,
  EFFECTS.CLEAR_INTENT,
]) {
  test(`kill-point after ${effectType} converges after process state is discarded`, async () => {
    let adapter = createInMemoryWipeAdapter({
      failurePlan: { [effectType]: "AFTER_APPLY" },
    });
    let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
    while (effect.type !== effectType) {
      state = await applyPending(state, effect, adapter);
      ({ state, effect } = requestNextWipeEffect(state));
    }
    state = await applyPending(state, effect, adapter);
    assert.equal(state.status, WIPE_STATUSES.RECONCILING);

    const persistedRuntime = adapter.snapshot();
    adapter = createInMemoryWipeAdapter({ runtimeSnapshot: persistedRuntime });
    if (persistedRuntime.intent === null) {
      assert.equal(effectType, EFFECTS.CLEAR_INTENT);
      const startup = reconcileWipeStartup(persistedRuntime, {
        expectedInstallationGeneration: INTENT.installationGeneration,
      });
      assert.equal(startup.status, "FRESH_START_ALLOWED");
      assert.equal(startup.writesBlocked, false);
    } else {
      state = await driveRecoveredToCompletion(adapter, persistedRuntime.intent);
      assert.equal(state.status, WIPE_STATUSES.READY_FOR_FRESH_START);
    }
  });
}

test("startup recovery replays from the durable intent without opening writes", () => {
  const state = recoverWipeFromIntent(INTENT);
  assert.equal(state.status, WIPE_STATUSES.RUNNING);
  assert.equal(state.phase, WIPE_PHASES.INTENT_DURABLE);
  assert.equal(state.writesBlocked, true);

  const requested = requestNextWipeEffect(state);
  assert.equal(requested.effect.type, EFFECTS.QUIESCE_WRITERS_AND_TASKS);
  assert.equal(requested.effect.attempt, 1);
});

test("an unknown future protocol remains fail-closed", () => {
  const state = recoverWipeFromIntent({ ...INTENT, protocolVersion: "wipe-intent-v99" });
  assert.equal(state.status, WIPE_STATUSES.SAFE_RECOVERY_REQUIRED);
  assert.equal(state.writesBlocked, true);
  assert.equal(state.failure.code, "UNSUPPORTED_WIPE_CONTRACT");
  assert.throws(() => requestNextWipeEffect(state), { code: "INVALID_WIPE_TRANSITION" });
});

test("a second wipe operation cannot replace an active intent", () => {
  const { state } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  assert.throws(() => beginConfirmedWipe(state, {
    ...INTENT,
    operationId: "wipe_11111111111111111111111111111111",
  }), {
    code: "WIPE_OPERATION_CONFLICT",
  });
});

test("a cloned or forged state cannot skip directly to secret invalidation", () => {
  const recovered = recoverWipeFromIntent(INTENT);
  const forged = {
    ...recovered,
    status: WIPE_STATUSES.RUNNING,
    phase: WIPE_PHASES.CONNECTIONS_CLOSED,
    attempts: {},
    pendingEffect: null,
    unresolvedEffect: null,
    failure: null,
    writesBlocked: true,
  };
  assert.throws(() => requestNextWipeEffect(forged), { code: "INVALID_WIPE_STATE" });
});

test("wipe intent rejects extra or sensitive fields", () => {
  assert.throws(() => beginConfirmedWipe(createWipeCoordinatorState(), {
    ...INTENT,
    apiKey: "must-not-be-persisted",
  }), { code: "INVALID_WIPE_INTENT" });
  assert.throws(() => recoverWipeFromIntent({
    ...INTENT,
    databasePath: "private/database.sqlite",
  }), { code: "INVALID_WIPE_INTENT" });
  assert.throws(() => beginConfirmedWipe(createWipeCoordinatorState(), {
    ...INTENT,
    operationId: "wipe_diabetes_private_note_123456",
  }), { code: "INVALID_WIPE_INTENT" });
});

test("stale inventory or writer registry contracts remain fail-closed", () => {
  const staleInventory = recoverWipeFromIntent({
    ...INTENT,
    inventoryRevision: "inventory-harness-v0",
  });
  const staleRegistry = recoverWipeFromIntent({
    ...INTENT,
    writerRegistryFingerprint: "writer-registry-contract-stale",
  });
  assert.equal(staleInventory.status, WIPE_STATUSES.SAFE_RECOVERY_REQUIRED);
  assert.equal(staleRegistry.status, WIPE_STATUSES.SAFE_RECOVERY_REQUIRED);
  assert.equal(staleInventory.writesBlocked, true);
  assert.equal(staleRegistry.writesBlocked, true);
});

test("stale attempts and forged operation outcomes cannot advance", async () => {
  const adapter = createInMemoryWipeAdapter();
  const { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  const outcome = await executeWipeEffect(adapter, effect);

  assert.throws(() => settleWipeEffect(state, { ...outcome, attempt: 99 }), {
    code: "STALE_WIPE_OUTCOME",
  });
  assert.throws(() => settleWipeEffect(state, { ...outcome, operationId: "wipe-op-forged" }), {
    code: "STALE_WIPE_OUTCOME",
  });
  assert.equal(state.phase, WIPE_PHASES.IDLE);
});

test("adapter outcomes are immutable caller assertions bound to the exact effect and observation", async () => {
  const adapter = createInMemoryWipeAdapter();
  const { effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  const outcome = await executeWipeEffect(adapter, effect);

  assert.equal(outcome.schemaVersion, "WIPE_EFFECT_OUTCOME_V1");
  assert.equal(outcome.assertionBoundary, OUTCOME_ASSERTION_BOUNDARY);
  assert.equal(outcome.verifierId, "in-memory-wipe-adapter");
  assert.equal(outcome.profileId, "harness-observation-v1");
  assert.match(outcome.evidenceId, /^wipe_[a-f0-9]{32}\./);
  assert.equal(outcome.effectFingerprint, wipeEffectFingerprint(effect));
  assert.match(outcome.observationFingerprint, /^[a-f0-9]{64}$/);
  assert.match(outcome.outcomeFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(outcome), true);
  assert.equal(Object.isFrozen(outcome.observation), true);
});

test("legacy naked outcomes, extra fields, tampering, and cross-effect replay are rejected", async () => {
  const adapter = createInMemoryWipeAdapter();
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  const outcome = await executeWipeEffect(adapter, effect);

  const legacy = {
    operationId: outcome.operationId,
    phase: outcome.phase,
    attempt: outcome.attempt,
    protocolVersion: outcome.protocolVersion,
    status: outcome.status,
    observation: outcome.observation,
    errorCode: outcome.errorCode,
  };
  assert.throws(() => settleWipeEffect(state, legacy), { code: "INVALID_WIPE_OUTCOME" });
  assert.throws(() => settleWipeEffect(state, { ...outcome, extra: true }), { code: "INVALID_WIPE_OUTCOME" });
  const changedObservation = structuredClone(outcome);
  changedObservation.observation.durable = false;
  assert.throws(() => settleWipeEffect(state, changedObservation), { code: "INVALID_WIPE_OUTCOME" });

  state = settleWipeEffect(state, outcome);
  ({ state, effect } = requestNextWipeEffect(state));
  assert.throws(() => settleWipeEffect(state, outcome), { code: "STALE_WIPE_OUTCOME" });
  assert.notEqual(outcome.effectFingerprint, wipeEffectFingerprint(effect));
});

test("outcome input rejects sparse arrays, accessors, symbols, non-finite values, and oversized strings", () => {
  const { effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  const base = {
    schemaVersion: "WIPE_EFFECT_OUTCOME_INPUT_V1",
    operationId: effect.operationId,
    phase: effect.phase,
    attempt: effect.attempt,
    protocolVersion: effect.protocolVersion,
    status: "APPLIED",
    evidenceId: "test-outcome-evidence",
    verifierId: "test-caller-observer",
    profileId: "test-observation-profile",
    effectFingerprint: wipeEffectFingerprint(effect),
    observation: { durable: true, intentFingerprint: effect.intentFingerprint },
    errorCode: null,
  };
  const sparse = [];
  sparse.length = 1;
  assert.throws(() => createWipeEffectOutcome({ ...base, observation: { list: sparse } }), { code: "INVALID_WIPE_OUTCOME" });
  const accessor = { durable: true };
  Object.defineProperty(accessor, "intentFingerprint", { enumerable: true, get: () => effect.intentFingerprint });
  assert.throws(() => createWipeEffectOutcome({ ...base, observation: accessor }), { code: "INVALID_WIPE_OUTCOME" });
  assert.throws(() => createWipeEffectOutcome({ ...base, observation: { value: Number.NaN } }), { code: "INVALID_WIPE_OUTCOME" });
  assert.throws(() => createWipeEffectOutcome({ ...base, observation: { value: "x".repeat(1025) } }), { code: "WIPE_OUTCOME_RESOURCE_LIMIT" });
  assert.throws(() => createWipeEffectOutcome({ ...base, [Symbol("hidden")]: true }), { code: "INVALID_WIPE_OUTCOME" });
  assert.throws(() => createWipeEffectOutcome({ ...base, errorCode: "SHOULD_NOT_EXIST" }), { code: "INVALID_WIPE_OUTCOME" });
  assert.throws(() => createWipeEffectOutcome({ ...base, status: "UNKNOWN", observation: null, errorCode: null }), { code: "INVALID_WIPE_OUTCOME" });
  assert.throws(() => createWipeEffectOutcome({ ...base, verifierId: "" }), { code: "INVALID_WIPE_OUTCOME" });
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => createWipeEffectOutcome({ ...base, observation: cyclic }), { code: "INVALID_WIPE_OUTCOME" });
});

test("missing writer acknowledgements cannot close connections", async () => {
  const adapter = createInMemoryWipeAdapter();
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  state = await applyPending(state, effect, adapter);
  ({ state, effect } = requestNextWipeEffect(state));

  const incompleteOutcome = createWipeEffectOutcome({
    schemaVersion: "WIPE_EFFECT_OUTCOME_INPUT_V1",
    operationId: effect.operationId,
    phase: effect.phase,
    attempt: effect.attempt,
    protocolVersion: effect.protocolVersion,
    status: "APPLIED",
    evidenceId: "incomplete-writer-evidence",
    verifierId: "test-caller-observer",
    profileId: "test-observation-profile",
    effectFingerprint: wipeEffectFingerprint(effect),
    observation: {
      gateClosed: true,
      writerRegistryRevision: HARNESS_WRITER_REGISTRY.revision,
      writerRegistryFingerprint: HARNESS_WRITER_REGISTRY.fingerprint,
      writersExpected: HARNESS_WRITER_REGISTRY.writerIds,
      writersAcknowledged: HARNESS_WRITER_REGISTRY.writerIds.slice(0, -1),
      activeTasks: 0,
      pendingNotifications: 0,
      deliveredNotifications: 0,
    },
    errorCode: null,
  });
  const reconciling = settleWipeEffect(state, incompleteOutcome);
  assert.equal(reconciling.status, WIPE_STATUSES.RECONCILING);
  assert.equal(reconciling.failure.code, "QUIESCE_NOT_PROVEN");
  assert.equal(reconciling.phase, WIPE_PHASES.INTENT_DURABLE);
});

test("an unregistered writer prevents quiescence even when every listed writer replies", async () => {
  const adapter = createInMemoryWipeAdapter({
    writerIds: [...HARNESS_WRITER_REGISTRY.writerIds, "rogue-writer"],
  });
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  state = await applyPending(state, effect, adapter);
  ({ state, effect } = requestNextWipeEffect(state));
  state = await applyPending(state, effect, adapter);

  assert.equal(state.status, WIPE_STATUSES.RECONCILING);
  assert.equal(state.failure.code, "QUIESCE_NOT_PROVEN");
  assert.equal(state.phase, WIPE_PHASES.INTENT_DURABLE);
});

test("pending or delivered notifications fail negative verification", async () => {
  const adapter = createInMemoryWipeAdapter();
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  state = await applyPending(state, effect, adapter);
  ({ state, effect } = requestNextWipeEffect(state));
  const outcome = createWipeEffectOutcome({
    schemaVersion: "WIPE_EFFECT_OUTCOME_INPUT_V1",
    operationId: effect.operationId,
    phase: effect.phase,
    attempt: effect.attempt,
    protocolVersion: effect.protocolVersion,
    status: "APPLIED",
    evidenceId: "notification-evidence",
    verifierId: "test-caller-observer",
    profileId: "test-observation-profile",
    effectFingerprint: wipeEffectFingerprint(effect),
    observation: {
      gateClosed: true,
      writerRegistryRevision: HARNESS_WRITER_REGISTRY.revision,
      writerRegistryFingerprint: HARNESS_WRITER_REGISTRY.fingerprint,
      writersExpected: HARNESS_WRITER_REGISTRY.writerIds,
      writersAcknowledged: HARNESS_WRITER_REGISTRY.writerIds,
      activeTasks: 0,
      pendingNotifications: 1,
      deliveredNotifications: 0,
    },
    errorCode: null,
  });
  const reconciling = settleWipeEffect(state, outcome);
  assert.equal(reconciling.status, WIPE_STATUSES.RECONCILING);
  assert.equal(reconciling.failure.code, "QUIESCE_NOT_PROVEN");
});

test("unknown container entries trigger recursive remediation and then converge", async () => {
  const adapter = createInMemoryWipeAdapter({
    driftPlan: {
      [EFFECTS.REMOVE_LOCAL_ARTIFACTS]: {
        unexpectedEntries: ["future-cache/opaque.bin"],
      },
    },
  });
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  while (effect.type !== EFFECTS.VERIFY_EMPTY) {
    state = await applyPending(state, effect, adapter);
    ({ state, effect } = requestNextWipeEffect(state));
  }
  const outcome = await executeWipeEffect(adapter, effect);
  state = settleWipeEffect(state, outcome);
  assert.equal(state.status, WIPE_STATUSES.RECONCILING);
  assert.equal(state.failure.code, "EMPTY_VERIFICATION_FAILED");

  ({ state, effect } = requestWipeReconciliation(state));
  state = await applyPending(state, effect, adapter);
  assert.equal(state.status, WIPE_STATUSES.WAITING_RETRY);
  assert.equal(state.phase, WIPE_PHASES.INTENT_DURABLE);

  ({ state, effect } = requestNextWipeEffect(state));
  assert.equal(effect.type, EFFECTS.QUIESCE_WRITERS_AND_TASKS);
  while (state.phase !== WIPE_PHASES.VERIFIED_EMPTY) {
    state = await applyPending(state, effect, adapter);
    if (state.phase !== WIPE_PHASES.VERIFIED_EMPTY) {
      ({ state, effect } = requestNextWipeEffect(state));
    }
  }
  assert.equal(state.phase, WIPE_PHASES.VERIFIED_EMPTY);
  assert.deepEqual(adapter.snapshot().unexpectedEntries, []);
});

test("reconciliation observes current state instead of replaying a cached receipt", async () => {
  let adapter = createInMemoryWipeAdapter({
    failurePlan: { [EFFECTS.CLOSE_CONNECTIONS]: "AFTER_APPLY" },
  });
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  while (effect.type !== EFFECTS.CLOSE_CONNECTIONS) {
    state = await applyPending(state, effect, adapter);
    ({ state, effect } = requestNextWipeEffect(state));
  }
  state = await applyPending(state, effect, adapter);
  assert.equal(state.status, WIPE_STATUSES.RECONCILING);

  const driftedRuntime = { ...adapter.snapshot(), openWritableHandles: 1 };
  adapter = createInMemoryWipeAdapter({ runtimeSnapshot: driftedRuntime });
  ({ state, effect } = requestWipeReconciliation(state));
  state = await applyPending(state, effect, adapter);
  assert.equal(state.status, WIPE_STATUSES.WAITING_RETRY);
  assert.equal(state.failure.code, "CONNECTIONS_NOT_CLOSED");

  ({ state, effect } = requestNextWipeEffect(state));
  assert.equal(effect.type, EFFECTS.CLOSE_CONNECTIONS);
  state = await applyPending(state, effect, adapter);
  assert.equal(state.phase, WIPE_PHASES.CONNECTIONS_CLOSED);
});

test("UNKNOWN can reconcile to NOT_APPLIED and retry the same intent phase", async () => {
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  state = settleWipeEffect(state, createWipeEffectOutcome({
    schemaVersion: "WIPE_EFFECT_OUTCOME_INPUT_V1",
    operationId: effect.operationId,
    phase: effect.phase,
    attempt: effect.attempt,
    protocolVersion: effect.protocolVersion,
    status: "UNKNOWN",
    evidenceId: "lost-process-evidence",
    verifierId: "test-caller-observer",
    profileId: "test-observation-profile",
    effectFingerprint: wipeEffectFingerprint(effect),
    observation: null,
    errorCode: "SIMULATED_LOST_PROCESS",
  }));
  const adapter = createInMemoryWipeAdapter();
  ({ state, effect } = requestWipeReconciliation(state));
  state = await applyPending(state, effect, adapter);
  assert.equal(state.status, WIPE_STATUSES.WAITING_RETRY);
  assert.equal(state.phase, WIPE_PHASES.IDLE);

  ({ state, effect } = requestNextWipeEffect(state));
  assert.equal(effect.type, EFFECTS.PERSIST_INTENT);
  assert.equal(effect.attempt, 2);
  state = await applyPending(state, effect, adapter);
  assert.equal(state.phase, WIPE_PHASES.INTENT_DURABLE);
});

for (const effectType of [
  EFFECTS.QUIESCE_WRITERS_AND_TASKS,
  EFFECTS.CLOSE_CONNECTIONS,
  EFFECTS.INVALIDATE_SECRETS,
  EFFECTS.REMOVE_LOCAL_ARTIFACTS,
  EFFECTS.VERIFY_EMPTY,
  EFFECTS.CLEAR_INTENT,
]) {
  test(`${effectType} NOT_APPLIED retries without changing operation identity`, async () => {
    const adapter = createInMemoryWipeAdapter({
      failurePlan: { [effectType]: "BEFORE_APPLY" },
    });
    const state = await driveToCompletion(adapter);
    assert.equal(state.status, WIPE_STATUSES.READY_FOR_FRESH_START);
    assert.equal(state.phase, WIPE_PHASES.READY_FOR_FRESH_START);
  });
}

test("secrets cannot be invalidated before connections are proven closed", async () => {
  const adapter = createInMemoryWipeAdapter({ openWritableHandles: 1, openTransactions: 1 });
  const unsafeEffect = {
    type: EFFECTS.INVALIDATE_SECRETS,
    operationId: INTENT.operationId,
    phase: WIPE_PHASES.SECRETS_INVALIDATED,
    attempt: 1,
    protocolVersion: INTENT.protocolVersion,
    idempotencyKey: `${INTENT.operationId}:${WIPE_PHASES.SECRETS_INVALIDATED}`,
  };
  const outcome = await executeWipeEffect(adapter, unsafeEffect);
  assert.equal(outcome.status, "NOT_APPLIED");
  assert.equal(outcome.errorCode, "WIPE_INTENT_MISSING");
  assert.equal(adapter.snapshot().databaseKeyPresent, true);
});

test("same phase retry keeps the idempotency key while changing the attempt", async () => {
  const adapter = createInMemoryWipeAdapter({
    failurePlan: { [EFFECTS.PERSIST_INTENT]: "BEFORE_APPLY" },
  });
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  const first = effect;
  state = await applyPending(state, effect, adapter);
  ({ state, effect } = requestNextWipeEffect(state));

  assert.equal(effect.attempt, first.attempt + 1);
  assert.equal(effect.idempotencyKey, first.idempotencyKey);
});

test("idempotency conflicts are rejected without applying a new payload", async () => {
  const adapter = createInMemoryWipeAdapter();
  const { effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  await executeWipeEffect(adapter, effect);
  const conflict = await executeWipeEffect(adapter, {
    ...effect,
    protocolVersion: "wipe-intent-v2",
  });
  assert.equal(conflict.status, "NOT_APPLIED");
  assert.equal(conflict.errorCode, "IDEMPOTENCY_CONFLICT");
  assert.equal(adapter.snapshot().intent.operationId, INTENT.operationId);
});

test("a different operation cannot overwrite or act under the durable intent", async () => {
  const adapter = createInMemoryWipeAdapter();
  let first = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  let firstState = await applyPending(first.state, first.effect, adapter);

  const secondIntent = {
    ...INTENT,
    operationId: "wipe_11111111111111111111111111111111",
  };
  const second = beginConfirmedWipe(createWipeCoordinatorState(), secondIntent);
  const overwrite = await executeWipeEffect(adapter, second.effect);
  assert.equal(overwrite.status, "NOT_APPLIED");
  assert.equal(overwrite.errorCode, "WIPE_INTENT_CONFLICT");
  assert.equal(adapter.snapshot().intent.operationId, INTENT.operationId);

  const secondAdapter = createInMemoryWipeAdapter();
  let secondState = await applyPending(second.state, second.effect, secondAdapter);
  const secondQuiesce = requestNextWipeEffect(secondState);
  const crossOperation = await executeWipeEffect(adapter, secondQuiesce.effect);
  assert.equal(crossOperation.status, "NOT_APPLIED");
  assert.equal(crossOperation.errorCode, "WIPE_INTENT_CONFLICT");

  const firstQuiesce = requestNextWipeEffect(firstState);
  firstState = await applyPending(firstQuiesce.state, firstQuiesce.effect, adapter);
  assert.equal(firstState.phase, WIPE_PHASES.WRITES_BLOCKED_AND_QUIESCED);
});

test("a missing durable intent before a destructive phase enters safe recovery", async () => {
  let adapter = createInMemoryWipeAdapter();
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  state = await applyPending(state, effect, adapter);
  ({ state, effect } = requestNextWipeEffect(state));

  adapter = createInMemoryWipeAdapter({
    runtimeSnapshot: { ...adapter.snapshot(), intent: null },
  });
  const outcome = await executeWipeEffect(adapter, effect);
  assert.equal(outcome.status, "NOT_APPLIED");
  assert.equal(outcome.errorCode, "WIPE_INTENT_MISSING");
  state = settleWipeEffect(state, outcome);
  assert.equal(state.status, WIPE_STATUSES.SAFE_RECOVERY_REQUIRED);
  assert.equal(state.writesBlocked, true);
  assert.throws(() => requestNextWipeEffect(state), { code: "INVALID_WIPE_TRANSITION" });
});

test("coordinator state and adapter snapshots are isolated immutable data", () => {
  const { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  const adapter = createInMemoryWipeAdapter();
  const snapshot = adapter.snapshot();

  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(effect), true);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.throws(() => snapshot.knownArtifacts.push("injected"), TypeError);
  assert.equal(adapter.snapshot().knownArtifacts.includes("injected"), false);
});

test("clearing the intent never claims a fresh database or business view was initialized", async () => {
  const adapter = createInMemoryWipeAdapter({
    knownArtifacts: [],
    pendingNotifications: 0,
    deliveredNotifications: 0,
    openWritableHandles: 0,
    openTransactions: 0,
    databaseKeyPresent: false,
    aiKeyCount: 0,
  });
  await driveToCompletion(adapter);
  const runtime = adapter.snapshot();
  assert.equal(runtime.freshDatabaseCreated, false);
  assert.equal(runtime.secretVaultOpened, false);
  assert.equal(runtime.businessViewRendered, false);
});

test("final clear retains the intent, remediates drift, and then converges", async () => {
  let adapter = createInMemoryWipeAdapter({
    driftPlan: {
      [EFFECTS.CLEAR_INTENT]: {
        pendingNotifications: 1,
        knownArtifacts: ["late-cache"],
      },
    },
  });
  let { state, effect } = beginConfirmedWipe(createWipeCoordinatorState(), INTENT);
  while (effect.type !== EFFECTS.CLEAR_INTENT) {
    state = await applyPending(state, effect, adapter);
    ({ state, effect } = requestNextWipeEffect(state));
  }
  let outcome = await executeWipeEffect(adapter, effect);
  assert.equal(outcome.status, "NOT_APPLIED");
  assert.equal(outcome.errorCode, "EMPTY_VERIFICATION_FAILED");
  assert.equal(adapter.snapshot().intent.operationId, INTENT.operationId);

  state = settleWipeEffect(state, outcome);
  assert.equal(state.status, WIPE_STATUSES.WAITING_RETRY);
  assert.equal(state.phase, WIPE_PHASES.INTENT_DURABLE);
  ({ state, effect } = requestNextWipeEffect(state));
  assert.equal(effect.type, EFFECTS.QUIESCE_WRITERS_AND_TASKS);
  while (state.status !== WIPE_STATUSES.READY_FOR_FRESH_START) {
    state = await applyPending(state, effect, adapter);
    if (state.status !== WIPE_STATUSES.READY_FOR_FRESH_START) {
      ({ state, effect } = requestNextWipeEffect(state));
    }
  }
  assert.equal(state.status, WIPE_STATUSES.READY_FOR_FRESH_START);
});

test("startup without an intent fails closed when any local residue remains", async () => {
  const cleanAdapter = createInMemoryWipeAdapter();
  await driveToCompletion(cleanAdapter);
  const dirtySnapshot = {
    ...cleanAdapter.snapshot(),
    deliveredNotifications: 1,
    businessGenerations: 1,
  };
  const startup = reconcileWipeStartup(dirtySnapshot, {
    expectedInstallationGeneration: INTENT.installationGeneration,
  });
  assert.equal(startup.status, WIPE_STATUSES.SAFE_RECOVERY_REQUIRED);
  assert.equal(startup.writesBlocked, true);
  assert.equal(startup.reason, "STARTUP_EMPTY_STATE_NOT_PROVEN");
});
