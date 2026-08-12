import assert from "node:assert/strict";
import test from "node:test";

import {
  EFFECTS,
  beginRemoveAIProviderCredentials,
  beginSaveAIProviderConfiguration,
  createInMemoryAICredentialAdapter,
  createInitialCredentialState,
  discardTransientCredentialSecrets,
  executeCredentialEffect,
  loadAndReconcileCredentialState,
  normalizeCredentialBaseUrl,
  providePendingCredentialSecret,
  requestCredentialReconciliation,
  requestNextCredentialEffect,
  retryCredentialEffect,
  settleCredentialEffect,
} from "./ai-credential-lifecycle-harness.mjs";

const installationGeneration = "install_11111111111111111111111111111111";
const operation1 = "aiop_11111111111111111111111111111111";
const operation2 = "aiop_22222222222222222222222222222222";
const credential1 = "aicred_11111111111111111111111111111111";
const credential2 = "aicred_22222222222222222222222222222222";
const canary1 = "sk-CANARY-ONE-never-persist";
const canary2 = "sk-CANARY-TWO-never-persist";

function config({
  baseURL = "https://api.example.com/v1/",
  model = "nuttie-model",
  credentialRef = credential1,
  revision = 1,
} = {}) {
  const url = new URL(baseURL);
  return {
    baseURL: url.toString(),
    origin: url.origin,
    host: url.host,
    model,
    credentialRef,
    revision,
  };
}

function adapterWithActive(options = {}) {
  return createInMemoryAICredentialAdapter({
    installationGeneration,
    activePair: {
      apiKey: canary1,
      config: config(),
      operationId: operation1,
    },
    ...options,
  });
}

async function drive(state, adapter) {
  let current = state;
  for (let steps = 0; steps < 20; steps += 1) {
    if (new Set(["CONFIGURED", "UNCONFIGURED"]).has(current.status)) return current;
    if (current.status === "RUNNING" && current.pendingEffect === null) {
      const requested = requestNextCredentialEffect(current);
      current = requested.state;
      if (!requested.effect) return current;
    }
    if (current.status !== "RUNNING" || current.pendingEffect === null) return current;
    current = settleCredentialEffect(
      current,
      await executeCredentialEffect(adapter, current.pendingEffect),
    );
  }
  throw new Error("credential lifecycle did not converge");
}

async function driveWithReconciliation(state, adapter) {
  let current = state;
  for (let steps = 0; steps < 40; steps += 1) {
    if (new Set(["CONFIGURED", "UNCONFIGURED"]).has(current.status)) return current;
    if (current.status === "RECONCILING" && current.pendingEffect === null) {
      current = requestCredentialReconciliation(current).state;
    } else if (current.status === "WAITING_RETRY" && current.pendingEffect === null) {
      current = retryCredentialEffect(current).state;
    } else if (current.status === "RUNNING" && current.pendingEffect === null) {
      current = requestNextCredentialEffect(current).state;
    }
    if (current.pendingEffect === null) return current;
    current = settleCredentialEffect(
      current,
      await executeCredentialEffect(adapter, current.pendingEffect),
    );
  }
  throw new Error("credential lifecycle did not recover and converge");
}

function assertNoSecret(...values) {
  const text = values.map((value) => JSON.stringify(value)).join("\n");
  assert.equal(text.includes(canary1), false);
  assert.equal(text.includes(canary2), false);
  assert.equal(/Authorization|Bearer/i.test(text), false);
}

test.afterEach(() => discardTransientCredentialSecrets());

test("validates only accepted HTTPS semantics and blocks URL-carried secrets pending D-036", () => {
  assert.deepEqual(normalizeCredentialBaseUrl("https://api.example.com:443/v1"), {
    baseURL: "https://api.example.com/v1",
    origin: "https://api.example.com",
    host: "api.example.com",
  });
  assert.throws(() => normalizeCredentialBaseUrl("http://api.example.com"), { code: "HTTPS_REQUIRED" });
  for (const value of [
    `https://user:${canary1}@api.example.com/v1`,
    `https://api.example.com/v1?api_key=${canary1}`,
    `https://api.example.com/v1#${canary1}`,
  ]) {
    assert.throws(() => normalizeCredentialBaseUrl(value), (error) => {
      assert.equal(error.code, "URL_PROFILE_DECISION_REQUIRED");
      assert.equal(error.message.includes(canary1), false);
      return true;
    });
  }
});

test("starts unconfigured with no network, key read, transport or body side effects", () => {
  const state = createInitialCredentialState({ installationGeneration });
  assert.equal(state.status, "UNCONFIGURED");
  assert.equal(state.networkBlocked, false);
  assert.equal(state.activeConfig, null);
  assertNoSecret(state);
});

test("saves a new provider through durable intent, versioned secret and revision CAS", async () => {
  const adapter = createInMemoryAICredentialAdapter({ installationGeneration });
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/v1/",
      model: "nuttie-model",
      apiKey: canary1,
    },
  );
  assert.equal(begun.effect.type, EFFECTS.PERSIST_INTENT);
  assert.equal(begun.state.networkBlocked, true);
  assertNoSecret(begun.state, begun.effect, adapter.snapshot());

  const saved = await drive(begun.state, adapter);
  assert.equal(saved.status, "CONFIGURED");
  assert.equal(saved.revision, 1);
  assert.equal(saved.activeConfig.credentialRef, credential1);
  assert.deepEqual(saved.secretSlots.map(({ credentialRef }) => credentialRef), [credential1]);
  assert.equal(adapter.snapshot().counters.puts, 1);
  assert.equal(adapter.snapshot().counters.secretReadCount, 0);
  assert.equal(adapter.snapshot().counters.transportCallCount, 0);
  assert.equal(adapter.snapshot().counters.bodyAssemblyCount, 0);
  assertNoSecret(saved, adapter.snapshot());
});

test("replaces an active provider without overwriting or falling back to the old secret", async () => {
  const adapter = adapterWithActive();
  const loaded = await loadAndReconcileCredentialState(adapter, { installationGeneration });
  const begun = beginSaveAIProviderConfiguration(loaded, {
    operationId: operation2,
    expectedRevision: 1,
    credentialRef: credential2,
    baseURL: "https://new.example.com/openai/",
    model: "new-model",
    apiKey: canary2,
  });
  const saved = await drive(begun.state, adapter);
  assert.equal(saved.status, "CONFIGURED");
  assert.equal(saved.revision, 2);
  assert.equal(saved.activeConfig.credentialRef, credential2);
  assert.deepEqual(saved.secretSlots.map(({ credentialRef }) => credentialRef), [credential2]);
  assert.equal(adapter.snapshot().counters.puts, 1);
  assert.equal(adapter.snapshot().counters.deletes, 1);
  assertNoSecret(saved, adapter.snapshot());
});

test("removes every app-owned AI secret only after the activity gate is quiesced", async () => {
  const adapter = adapterWithActive({ activeTasks: 2 });
  const loaded = await loadAndReconcileCredentialState(adapter, { installationGeneration });
  const begun = beginRemoveAIProviderCredentials(loaded, {
    operationId: operation2,
    expectedRevision: 1,
  });
  const removed = await drive(begun.state, adapter);
  assert.equal(removed.status, "UNCONFIGURED");
  assert.equal(removed.activeConfig, null);
  assert.equal(removed.secretSlots.length, 0);
  assert.equal(removed.connectionStatePresent, false);
  assert.equal(adapter.snapshot().counters.deletes, 1);
  assert.equal(adapter.snapshot().counters.secretReadCount, 0);
  assert.equal(adapter.snapshot().counters.transportCallCount, 0);
  assertNoSecret(removed, adapter.snapshot());
});

test("pre-apply failure retries the same immutable effect", async () => {
  const adapter = createInMemoryAICredentialAdapter({
    installationGeneration,
    failurePlan: [{ effectType: EFFECTS.PERSIST_INTENT, point: "BEFORE_APPLY" }],
  });
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/v1/",
      model: "model",
      apiKey: canary1,
    },
  );
  const failed = settleCredentialEffect(
    begun.state,
    await executeCredentialEffect(adapter, begun.effect),
  );
  assert.equal(failed.status, "WAITING_RETRY");
  assert.equal(failed.failure.outcome, "NOT_APPLIED");
  const retry = retryCredentialEffect(failed);
  assert.equal(retry.effect.operationId, begun.effect.operationId);
  assert.equal(retry.effect.phase, begun.effect.phase);
  assert.equal(retry.effect.commandFingerprint, begun.effect.commandFingerprint);
  assert.equal((await drive(retry.state, adapter)).status, "CONFIGURED");
});

test("unknown post-apply result reconciles before replay and never creates another operation", async () => {
  const adapter = createInMemoryAICredentialAdapter({
    installationGeneration,
    failurePlan: [{ effectType: EFFECTS.WRITE_NEW_SECRET, point: "AFTER_APPLY" }],
  });
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/v1/",
      model: "model",
      apiKey: canary1,
    },
  );
  let state = settleCredentialEffect(
    begun.state,
    await executeCredentialEffect(adapter, begun.effect),
  );
  ({ state } = requestNextCredentialEffect(state));
  const unknown = settleCredentialEffect(
    state,
    await executeCredentialEffect(adapter, state.pendingEffect),
  );
  assert.equal(unknown.status, "RECONCILING");
  assert.throws(() => beginRemoveAIProviderCredentials(unknown, {
    operationId: operation2,
    expectedRevision: 0,
  }), { code: "OPERATION_IN_PROGRESS" });
  const reconciling = requestCredentialReconciliation(unknown);
  const reconciled = settleCredentialEffect(
    reconciling.state,
    await executeCredentialEffect(adapter, reconciling.effect),
  );
  assert.equal(reconciled.status, "RUNNING");
  assert.equal(reconciled.secretSlots.length, 1);
  const saved = await drive(reconciled, adapter);
  assert.equal(saved.status, "CONFIGURED");
  assert.equal(adapter.snapshot().counters.puts, 1);
});

test("process loss after durable save intent requires secret reentry without persisting the key", async () => {
  const adapter = createInMemoryAICredentialAdapter({ installationGeneration });
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/v1/",
      model: "model",
      apiKey: canary1,
    },
  );
  settleCredentialEffect(begun.state, await executeCredentialEffect(adapter, begun.effect));
  discardTransientCredentialSecrets();
  const restored = await loadAndReconcileCredentialState(adapter, { installationGeneration });
  assert.equal(restored.status, "KEY_REENTRY_REQUIRED");
  assertNoSecret(restored, adapter.snapshot());
  const resumed = providePendingCredentialSecret(restored, { apiKey: canary1 });
  const saved = await drive(resumed, adapter);
  assert.equal(saved.status, "CONFIGURED");
});

test("process loss after writing the new secret resumes without key reentry", async () => {
  const adapter = createInMemoryAICredentialAdapter({ installationGeneration });
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/v1/",
      model: "model",
      apiKey: canary1,
    },
  );
  let state = settleCredentialEffect(begun.state, await executeCredentialEffect(adapter, begun.effect));
  ({ state } = requestNextCredentialEffect(state));
  settleCredentialEffect(state, await executeCredentialEffect(adapter, state.pendingEffect));
  discardTransientCredentialSecrets();
  const restored = await loadAndReconcileCredentialState(adapter, { installationGeneration });
  assert.equal(restored.status, "RUNNING");
  const saved = await drive(restored, adapter);
  assert.equal(saved.status, "CONFIGURED");
});

test("active config without its key requires reentry and never invents a shared key", async () => {
  const adapter = createInMemoryAICredentialAdapter({
    installationGeneration,
    orphanSecrets: [],
  });
  const forgedInspectionAdapter = {
    async inspectCredentialLifecycle() {
      return {
        installationGeneration,
        revision: 1,
        activeConfig: config(),
        intent: null,
        secretSlots: [],
        vaultState: "AVAILABLE",
        gateClosed: false,
        activeTasks: 0,
        connectionStatePresent: true,
        completedOperationIds: [],
      };
    },
  };
  const restored = await loadAndReconcileCredentialState(forgedInspectionAdapter, { installationGeneration });
  assert.equal(restored.status, "KEY_REENTRY_REQUIRED");
  assert.equal(restored.networkBlocked, true);
  assertNoSecret(restored, adapter.snapshot());
});

test("orphan, extra, unavailable or installation-mismatched secret state fails closed", async () => {
  const orphan = createInMemoryAICredentialAdapter({
    installationGeneration,
    orphanSecrets: [{
      credentialRef: credential1,
      operationId: operation1,
      installationGeneration,
      apiKey: canary1,
    }],
  });
  assert.equal((await loadAndReconcileCredentialState(orphan, { installationGeneration })).status, "SAFE_RECOVERY_REQUIRED");

  const unavailable = adapterWithActive({ vaultState: "UNAVAILABLE" });
  assert.equal((await loadAndReconcileCredentialState(unavailable, { installationGeneration })).status, "SAFE_RECOVERY_REQUIRED");
  const mismatchedAdapter = adapterWithActive();
  const mismatched = await loadAndReconcileCredentialState(mismatchedAdapter, {
    installationGeneration: "install_99999999999999999999999999999999",
  });
  assert.equal(mismatched.status, "SAFE_RECOVERY_REQUIRED");
  const before = mismatchedAdapter.snapshot();
  assert.throws(() => beginRemoveAIProviderCredentials(mismatched, {
    operationId: operation2,
    expectedRevision: 1,
  }), { code: "INSTALLATION_RECOVERY_REQUIRED" });
  assert.deepEqual(mismatchedAdapter.snapshot(), before);

  const activeWithUnrelatedSecret = {
    async inspectCredentialLifecycle() {
      return {
        installationGeneration,
        revision: 1,
        activeConfig: config(),
        intent: null,
        secretSlots: [{
          credentialRef: credential2,
          operationId: operation2,
          installationGeneration,
        }],
        vaultState: "AVAILABLE",
        gateClosed: false,
        activeTasks: 0,
        connectionStatePresent: true,
        completedOperationIds: [],
      };
    },
  };
  assert.equal((await loadAndReconcileCredentialState(
    activeWithUnrelatedSecret,
    { installationGeneration },
  )).status, "SAFE_RECOVERY_REQUIRED");

  const oldGeneration = "install_99999999999999999999999999999999";
  const oldBegun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration: oldGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://old.example.com/",
      model: "old-model",
      apiKey: canary1,
    },
  );
  for (const secretSlots of [[], [{
    credentialRef: credential1,
    operationId: operation1,
    installationGeneration: oldGeneration,
  }]]) {
    const mixedGenerationAdapter = {
      async inspectCredentialLifecycle() {
        return {
          installationGeneration,
          revision: 0,
          activeConfig: null,
          intent: oldBegun.state.intent,
          secretSlots,
          vaultState: "AVAILABLE",
          gateClosed: false,
          activeTasks: 0,
          connectionStatePresent: false,
          completedOperationIds: [],
        };
      },
    };
    const mixed = await loadAndReconcileCredentialState(
      mixedGenerationAdapter,
      { installationGeneration },
    );
    assert.equal(mixed.status, "SAFE_RECOVERY_REQUIRED");
    assert.equal(mixed.installationGeneration, installationGeneration);
    assert.equal(mixed.networkBlocked, true);
    assert.equal(mixed.intent, null);
    assert.throws(() => beginRemoveAIProviderCredentials(mixed, {
      operationId: operation2,
      expectedRevision: 0,
    }), { code: "INSTALLATION_RECOVERY_REQUIRED" });
  }
});

test("safe removal cleans the active credential and every orphan without reading either secret", async () => {
  const adapter = adapterWithActive({
    orphanSecrets: [{
      credentialRef: credential2,
      operationId: operation2,
      installationGeneration,
      apiKey: canary2,
    }],
  });
  const loaded = await loadAndReconcileCredentialState(adapter, { installationGeneration });
  assert.equal(loaded.status, "SAFE_RECOVERY_REQUIRED");
  const begun = beginRemoveAIProviderCredentials(loaded, {
    operationId: "aiop_33333333333333333333333333333333",
    expectedRevision: 1,
  });
  const removed = await drive(begun.state, adapter);
  assert.equal(removed.status, "UNCONFIGURED");
  assert.equal(adapter.snapshot().secretCount, 0);
  assert.equal(adapter.snapshot().counters.deletes, 2);
  assert.equal(adapter.snapshot().counters.secretReadCount, 0);
});

test("every save phase reconciles an applied-but-unacknowledged mutation", async (t) => {
  const phases = [
    EFFECTS.PERSIST_INTENT,
    EFFECTS.WRITE_NEW_SECRET,
    EFFECTS.QUIESCE_AI,
    EFFECTS.ACTIVATE_CONFIG,
    EFFECTS.DELETE_OLD_SECRET,
    EFFECTS.VERIFY_AND_CLEAR_INTENT,
  ];
  for (const phase of phases) {
    await t.test(phase, async () => {
      const adapter = adapterWithActive({
        failurePlan: [{ effectType: phase, point: "AFTER_APPLY" }],
      });
      const loaded = await loadAndReconcileCredentialState(adapter, { installationGeneration });
      const begun = beginSaveAIProviderConfiguration(loaded, {
        operationId: operation2,
        expectedRevision: 1,
        credentialRef: credential2,
        baseURL: "https://new.example.com/v1/",
        model: "new-model",
        apiKey: canary2,
      });
      const saved = await driveWithReconciliation(begun.state, adapter);
      assert.equal(saved.status, "CONFIGURED");
      assert.equal(saved.activeConfig.credentialRef, credential2);
      assert.deepEqual(saved.secretSlots.map(({ credentialRef }) => credentialRef), [credential2]);
      assert.equal(adapter.snapshot().counters.reconcileCalls, 1);
      assertNoSecret(saved, adapter.snapshot());
    });
  }
});

test("every removal phase reconciles an applied-but-unacknowledged mutation", async (t) => {
  const phases = [
    EFFECTS.PERSIST_INTENT,
    EFFECTS.QUIESCE_AI,
    EFFECTS.DELETE_ALL_SECRETS,
    EFFECTS.DELETE_CONFIG,
    EFFECTS.VERIFY_AND_CLEAR_INTENT,
  ];
  for (const phase of phases) {
    await t.test(phase, async () => {
      const adapter = adapterWithActive({
        failurePlan: [{ effectType: phase, point: "AFTER_APPLY" }],
      });
      const loaded = await loadAndReconcileCredentialState(adapter, { installationGeneration });
      const begun = beginRemoveAIProviderCredentials(loaded, {
        operationId: operation2,
        expectedRevision: 1,
      });
      const removed = await driveWithReconciliation(begun.state, adapter);
      assert.equal(removed.status, "UNCONFIGURED");
      assert.equal(removed.secretSlots.length, 0);
      assert.equal(adapter.snapshot().counters.reconcileCalls, 1);
      assertNoSecret(removed, adapter.snapshot());
    });
  }
});

test("vault loss blocks the lifecycle until the same immutable write can be retried", async () => {
  const adapter = createInMemoryAICredentialAdapter({ installationGeneration });
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/",
      model: "model",
      apiKey: canary1,
    },
  );
  let state = settleCredentialEffect(begun.state, await executeCredentialEffect(adapter, begun.effect));
  ({ state } = requestNextCredentialEffect(state));
  adapter.setVaultState("UNAVAILABLE");
  state = settleCredentialEffect(state, await executeCredentialEffect(adapter, state.pendingEffect));
  assert.equal(state.status, "WAITING_RETRY");
  assert.equal(state.networkBlocked, true);
  adapter.setVaultState("AVAILABLE");
  state = retryCredentialEffect(state).state;
  assert.equal((await drive(state, adapter)).status, "CONFIGURED");
});

test("matching receipts cannot authorize success without matching storage evidence", async () => {
  const adapter = createInMemoryAICredentialAdapter({ installationGeneration });
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/",
      model: "model",
      apiKey: canary1,
    },
  );
  const outcome = await executeCredentialEffect(adapter, begun.effect);
  const forged = {
    ...outcome,
    inspection: { ...outcome.inspection, activeTasks: 1 },
  };
  assert.throws(() => settleCredentialEffect(begun.state, forged), {
    code: "INVALID_CREDENTIAL_EVIDENCE",
  });

  const unknownAdapter = {
    async applyCredentialEffect() {
      const error = new Error("ambiguous adapter failure");
      Object.assign(error, { code: "AMBIGUOUS_WRITE", outcome: "UNKNOWN", retryable: true });
      throw error;
    },
    async reconcileCredentialEffect(effect) {
      return {
        receipt: {
          operationId: effect.operationId,
          commandFingerprint: effect.commandFingerprint,
          effectType: effect.type,
          phase: effect.phase,
          disposition: "APPLIED",
        },
        inspection: {
          installationGeneration,
          revision: 0,
          activeConfig: null,
          intent: null,
          secretSlots: [],
          vaultState: "AVAILABLE",
          gateClosed: false,
          activeTasks: 1,
          connectionStatePresent: false,
          completedOperationIds: [],
        },
        resolution: "NOT_APPLIED",
      };
    },
  };
  const ambiguous = settleCredentialEffect(
    begun.state,
    await executeCredentialEffect(unknownAdapter, begun.effect),
  );
  const reconciling = requestCredentialReconciliation(ambiguous);
  const contradicted = await executeCredentialEffect(unknownAdapter, reconciling.effect);
  assert.throws(() => settleCredentialEffect(reconciling.state, contradicted), {
    code: "INVALID_CREDENTIAL_EVIDENCE",
  });
});

test("idempotent replay reports current evidence and cannot resurrect a stale closed gate", async () => {
  const adapter = createInMemoryAICredentialAdapter({ installationGeneration });
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/",
      model: "model",
      apiKey: canary1,
    },
  );
  let state = settleCredentialEffect(begun.state, await executeCredentialEffect(adapter, begun.effect));
  ({ state } = requestNextCredentialEffect(state));
  state = settleCredentialEffect(state, await executeCredentialEffect(adapter, state.pendingEffect));
  ({ state } = requestNextCredentialEffect(state));
  const beforeQuiesce = state;
  const first = await executeCredentialEffect(adapter, state.pendingEffect);
  state = settleCredentialEffect(state, first);
  assert.equal(state.gateClosed, true);

  adapter.resetProcessState();
  assert.equal(adapter.snapshot().gateClosed, false);
  const replay = await executeCredentialEffect(adapter, beforeQuiesce.pendingEffect);
  assert.equal(replay.receipt.disposition, "REPLAYED");
  assert.equal(replay.inspection.gateClosed, false);
  assert.throws(() => settleCredentialEffect(beforeQuiesce, replay), {
    code: "INVALID_CREDENTIAL_EVIDENCE",
  });
  assert.equal(adapter.snapshot().gateClosed, false);
});

test("concurrent save and remove commands are blocked while an intent is pending", async () => {
  const adapter = adapterWithActive();
  const loaded = await loadAndReconcileCredentialState(adapter, { installationGeneration });
  const begun = beginSaveAIProviderConfiguration(loaded, {
    operationId: operation2,
    expectedRevision: 1,
    credentialRef: credential2,
    baseURL: "https://new.example.com/",
    model: "new",
    apiKey: canary2,
  });
  assert.throws(() => beginRemoveAIProviderCredentials(begun.state, {
    operationId: "aiop_33333333333333333333333333333333",
    expectedRevision: 1,
  }), { code: "OPERATION_IN_PROGRESS" });
  assert.throws(() => beginSaveAIProviderConfiguration(begun.state, {
    operationId: "aiop_33333333333333333333333333333333",
    expectedRevision: 1,
    credentialRef: "aicred_33333333333333333333333333333333",
    baseURL: "https://third.example.com/",
    model: "third",
    apiKey: "third-secret",
  }), { code: "OPERATION_IN_PROGRESS" });
});

test("strict public records reject secret-shaped extras, special values and stale outcomes", async () => {
  const state = createInitialCredentialState({ installationGeneration });
  assert.throws(() => beginSaveAIProviderConfiguration(state, {
    operationId: operation1,
    expectedRevision: 0,
    credentialRef: credential1,
    baseURL: "https://api.example.com/",
    model: "model",
    apiKey: canary1,
    authorization: `Bearer ${canary1}`,
  }), { code: "INVALID_SAVE_INPUT" });
  assert.throws(() => beginSaveAIProviderConfiguration(state, {
    operationId: operation1,
    expectedRevision: 0,
    credentialRef: credential1,
    baseURL: "https://api.example.com/",
    model: new Date(),
    apiKey: canary1,
  }), { code: "INVALID_MODEL" });

  const adapter = createInMemoryAICredentialAdapter({ installationGeneration });
  const begun = beginSaveAIProviderConfiguration(state, {
    operationId: operation1,
    expectedRevision: 0,
    credentialRef: credential1,
    baseURL: "https://api.example.com/",
    model: "model",
    apiKey: canary1,
  });
  const outcome = await executeCredentialEffect(adapter, begun.effect);
  assert.throws(() => settleCredentialEffect(begun.state, { ...outcome, attempt: 99 }), {
    code: "STALE_CREDENTIAL_OUTCOME",
  });
  assert.throws(() => settleCredentialEffect(begun.state, { ...outcome, rawError: canary1 }), {
    code: "INVALID_CREDENTIAL_OUTCOME",
  });
});

test("adapter-controlled error codes cannot smuggle a secret into outcomes or state", async () => {
  const adapter = {
    async applyCredentialEffect() {
      const error = new Error("untrusted adapter error");
      Object.assign(error, { code: canary1, outcome: "NOT_APPLIED", retryable: false });
      throw error;
    },
    async reconcileCredentialEffect() {
      throw new Error("not reached");
    },
  };
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/",
      model: "model",
      apiKey: canary2,
    },
  );
  const outcome = await executeCredentialEffect(adapter, begun.effect);
  assert.equal(outcome.error.code, "CREDENTIAL_ADAPTER_FAILURE");
  const failed = settleCredentialEffect(begun.state, outcome);
  assert.equal(failed.failure.code, "CREDENTIAL_ADAPTER_FAILURE");
  assertNoSecret(outcome, failed);
});

test("every persisted public artifact remains secret-free across successful save and remove", async () => {
  const adapter = createInMemoryAICredentialAdapter({ installationGeneration });
  const begun = beginSaveAIProviderConfiguration(
    createInitialCredentialState({ installationGeneration }),
    {
      operationId: operation1,
      expectedRevision: 0,
      credentialRef: credential1,
      baseURL: "https://api.example.com/",
      model: "model",
      apiKey: canary1,
    },
  );
  const artifacts = [begun.state, begun.effect, adapter.snapshot()];
  let state = begun.state;
  for (let steps = 0; steps < 10 && state.status !== "CONFIGURED"; steps += 1) {
    const outcome = await executeCredentialEffect(adapter, state.pendingEffect);
    artifacts.push(outcome, adapter.snapshot());
    state = settleCredentialEffect(state, outcome);
    artifacts.push(state);
    if (state.status === "RUNNING" && state.pendingEffect === null) {
      const next = requestNextCredentialEffect(state);
      state = next.state;
      artifacts.push(next.state, next.effect);
    }
  }
  assert.equal(state.status, "CONFIGURED");
  assertNoSecret(...artifacts);
});
