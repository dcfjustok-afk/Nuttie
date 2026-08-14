import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createActiveAIConfigurationEvidence,
  createInMemoryAICredentialAdapter,
  createInitialCredentialState,
  loadAndReconcileCredentialState,
  normalizeActiveAIConfigurationEvidence,
} from "./ai-credential-lifecycle-harness.mjs";
import {
  BOUNDARY,
  evaluateAIConfigurationPolicyPreflight,
  validateAIConfigurationPolicyPreflightResult,
} from "./ai-configuration-policy-preflight-harness.mjs";
import {
  createD053AuthorizationEvidence,
  createPolicyCheckSubject,
  createProviderPolicyProfile,
} from "./ai-policy-harness.mjs";
import { createAiRequestEvidenceContext } from "./ai-request-evidence-context-harness.mjs";

const installationGeneration = "install_11111111111111111111111111111111";
const operationId = "aiop_11111111111111111111111111111111";
const credentialRef = "aicred_11111111111111111111111111111111";
const canary = "sk-CANARY-never-observed";
const snapshotHash = "a".repeat(64);

function activeConfig(overrides = {}) {
  const baseURL = overrides.baseURL ?? "https://api.example.test/v1/";
  const url = new URL(baseURL);
  return {
    baseURL: url.toString(),
    origin: url.origin,
    host: url.host,
    model: "model-1",
    credentialRef,
    revision: 1,
    ...overrides,
  };
}

async function configuredFixture() {
  const adapter = createInMemoryAICredentialAdapter({
    installationGeneration,
    activePair: { apiKey: canary, config: activeConfig(), operationId },
  });
  const state = await loadAndReconcileCredentialState(adapter, { installationGeneration });
  return { adapter, state, configurationEvidence: createActiveAIConfigurationEvidence(state) };
}

function requestContext(subjectOverrides = {}) {
  const subject = createPolicyCheckSubject({
    schemaVersion: "POLICY_CHECK_SUBJECT_INPUT_V1",
    providerId: "provider-local",
    baseURL: "https://api.example.test/v1/",
    model: "model-1",
    payloadClass: "meal-text",
    profileVersion: "policy-v1",
    region: "CN",
    observedAt: "2026-08-14T00:40:00Z",
    ...subjectOverrides,
  });
  const profile = createProviderPolicyProfile({
    schemaVersion: "PROVIDER_POLICY_PROFILE_INPUT_V1",
    providerId: "provider-local",
    origin: subject.origin,
    models: [subject.model],
    payloadClasses: [subject.payloadClass],
    profileVersion: subject.profileVersion,
    termsEvidence: { kind: "HTTPS_URL", value: "https://api.example.test/terms" },
    privacyEvidence: { kind: "SNAPSHOT_SHA256", value: snapshotHash },
    reviewedAt: "2026-08-01T00:00:00Z",
    expiresAt: "2026-09-01T00:00:00Z",
    riskProfile: {
      retention: "BOUNDED",
      training: "PROHIBITED",
      humanAccess: "UNKNOWN",
      deletionMechanism: "AVAILABLE",
      advertisingMarketing: "PROHIBITED",
      healthDataUse: "REQUESTED_SERVICE_ONLY",
    },
    state: "ALLOW",
    reviewBasis: "Local fixture; not provider truth or send authorization.",
    region: "CN",
  });
  const authorizationEvidence = createD053AuthorizationEvidence({
    schemaVersion: "D053_AUTHORIZATION_INPUT_V1",
    evidenceId: "d053-current-governance",
    recordedAt: "2026-08-14T00:40:00Z",
  });
  return createAiRequestEvidenceContext({
    schemaVersion: "AI_REQUEST_EVIDENCE_CONTEXT_INPUT_V2",
    requestId: "request-1",
    transportProfileVersion: "transport-pending-d036",
    subject,
    profile,
    authorizationEvidence,
  });
}

test("exports immutable non-sensitive evidence only from a stable configured lifecycle", async () => {
  const { adapter, configurationEvidence } = await configuredFixture();
  assert.equal(configurationEvidence.schemaVersion, "AI_ACTIVE_CONFIGURATION_EVIDENCE_V1");
  assert.equal(configurationEvidence.lifecycleStatus, "CONFIGURED");
  assert.equal(configurationEvidence.activeConfig.credentialRef, credentialRef);
  assert.equal(configurationEvidence.secretSlot.credentialRef, credentialRef);
  assert.match(configurationEvidence.evidenceFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(configurationEvidence.activeConfig), true);
  assert.deepEqual(normalizeActiveAIConfigurationEvidence(configurationEvidence), configurationEvidence);
  const serialized = JSON.stringify({ configurationEvidence, adapter: adapter.snapshot() });
  assert.equal(serialized.includes(canary), false);
  assert.equal(adapter.snapshot().counters.secretReadCount, 0);
});

test("refuses configuration evidence for unconfigured, running, recovery, and forged stable states", async () => {
  const unconfigured = createInitialCredentialState({ installationGeneration });
  assert.throws(() => createActiveAIConfigurationEvidence(unconfigured), { code: "AI_CONFIGURATION_NOT_STABLE" });
  const { state } = await configuredFixture();
  assert.throws(
    () => createActiveAIConfigurationEvidence({ ...state, status: "SAFE_RECOVERY_REQUIRED", networkBlocked: true }),
    { code: "AI_CONFIGURATION_NOT_STABLE" },
  );
  for (const forged of [
    { ...state, status: "RUNNING", networkBlocked: true },
    { ...state, secretSlots: [] },
    { ...state, activeConfig: { ...state.activeConfig, revision: 2 } },
  ]) {
    assert.throws(() => createActiveAIConfigurationEvidence(forged), { code: "INVALID_CREDENTIAL_STATE" });
  }
});

test("rejects changed configuration identity, installation, slot, boundary, and evidence fingerprint", async () => {
  const { configurationEvidence } = await configuredFixture();
  for (const changed of [
    { ...configurationEvidence, configurationRevision: 2 },
    { ...configurationEvidence, installationGeneration: "install_22222222222222222222222222222222" },
    { ...configurationEvidence, activeConfig: { ...configurationEvidence.activeConfig, model: "other-model" } },
    { ...configurationEvidence, secretSlot: { ...configurationEvidence.secretSlot, credentialRef: "aicred_22222222222222222222222222222222" } },
    { ...configurationEvidence, boundary: "SEND_AUTHORIZED" },
    { ...configurationEvidence, evidenceFingerprint: "b".repeat(64) },
  ]) {
    assert.throws(() => normalizeActiveAIConfigurationEvidence(changed), { code: "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE" });
  }
  const accessor = { ...configurationEvidence };
  Object.defineProperty(accessor, "lifecycleStatus", { enumerable: true, get: () => "CONFIGURED" });
  assert.throws(() => normalizeActiveAIConfigurationEvidence(accessor), { code: "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE" });
  const symbol = { ...configurationEvidence, [Symbol("hidden")]: true };
  assert.throws(() => normalizeActiveAIConfigurationEvidence(symbol), { code: "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE" });
  const hidden = { ...configurationEvidence };
  Object.defineProperty(hidden, "hidden", { value: true });
  assert.throws(() => normalizeActiveAIConfigurationEvidence(hidden), { code: "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE" });
  const nestedAccessor = { ...configurationEvidence, activeConfig: { ...configurationEvidence.activeConfig } };
  Object.defineProperty(nestedAccessor.activeConfig, "model", { enumerable: true, get: () => "model-1" });
  assert.throws(() => normalizeActiveAIConfigurationEvidence(nestedAccessor), { code: "INVALID_AI_ACTIVE_CONFIGURATION_EVIDENCE" });
});

test("binds exact endpoint and model metadata while keeping every remaining send gate blocked", async () => {
  const { configurationEvidence } = await configuredFixture();
  const context = requestContext();
  const result = evaluateAIConfigurationPolicyPreflight({ configurationEvidence, requestContext: context });
  assert.equal(result.disposition, "BLOCKED");
  assert.equal(result.endpointConfigurationMatched, true);
  assert.deepEqual(result.comparisons, { baseURLMatched: true, originMatched: true, modelMatched: true });
  assert.equal(result.providerIdentityBoundToConfiguration, false);
  assert.equal(result.reason, "PROVIDER_IDENTITY_NOT_BOUND_TO_CONFIGURATION");
  assert.deepEqual(result.blockers, [
    "PROVIDER_IDENTITY_NOT_BOUND_TO_CONFIGURATION",
    "D033_CONFIRMATION_SCOPE_NOT_EVALUATED",
    "D034_RESOURCE_PROFILE_NOT_AUTHORIZED",
    "D036_TRANSPORT_PROFILE_NOT_AUTHORIZED",
    "D053_NOT_AUTHORIZED",
  ]);
  assert.equal(result.sendAuthorized, false);
  assert.deepEqual(result.boundary, BOUNDARY);
  assert.equal(result.configurationEvidenceFingerprint, configurationEvidence.evidenceFingerprint);
  assert.equal(result.requestContextFingerprint, context.contextFingerprint);
  assert.match(result.resultFingerprint, /^[a-f0-9]{64}$/);
});

test("detects base URL, origin, and model mismatches before all governance blockers", async () => {
  const { configurationEvidence } = await configuredFixture();
  for (const [subjectOverrides, changedField] of [
    [{ baseURL: "https://api.example.test/v2/" }, "baseURLMatched"],
    [{ baseURL: "https://other.example.test/v1/" }, "originMatched"],
    [{ model: "model-2" }, "modelMatched"],
  ]) {
    const result = evaluateAIConfigurationPolicyPreflight({
      configurationEvidence,
      requestContext: requestContext(subjectOverrides),
    });
    assert.equal(result.endpointConfigurationMatched, false);
    assert.equal(result.comparisons[changedField], false);
    assert.equal(result.reason, "CONFIGURATION_SUBJECT_MISMATCH");
    assert.equal(result.blockers[0], "CONFIGURATION_SUBJECT_MISMATCH");
    assert.equal(result.blockers.includes("D053_NOT_AUTHORIZED"), true);
    assert.equal(result.sendAuthorized, false);
  }
});

test("rejects malformed and tampered configuration or request evidence", async () => {
  const { configurationEvidence } = await configuredFixture();
  const context = requestContext();
  for (const input of [
    { configurationEvidence: { ...configurationEvidence, evidenceFingerprint: "b".repeat(64) }, requestContext: context },
    { configurationEvidence, requestContext: { ...context, contextFingerprint: "b".repeat(64) } },
    { configurationEvidence, requestContext: context, extra: true },
  ]) {
    assert.throws(() => evaluateAIConfigurationPolicyPreflight(input), { code: "INVALID_AI_CONFIGURATION_POLICY_PREFLIGHT" });
  }
});

test("reconstructs the complete result and rejects any forged authorization or provenance field", async () => {
  const { configurationEvidence } = await configuredFixture();
  const context = requestContext();
  const input = { configurationEvidence, requestContext: context };
  const result = evaluateAIConfigurationPolicyPreflight(input);
  assert.deepEqual(validateAIConfigurationPolicyPreflightResult(result, input), result);
  for (const changed of [
    { ...result, disposition: "ALLOWED" },
    { ...result, sendAuthorized: true },
    { ...result, providerIdentityBoundToConfiguration: true },
    { ...result, blockers: ["D053_NOT_AUTHORIZED"] },
    { ...result, credentialRef: "aicred_22222222222222222222222222222222" },
    { ...result, resultFingerprint: "b".repeat(64) },
  ]) {
    assert.throws(() => validateAIConfigurationPolicyPreflightResult(changed, input), {
      code: "INVALID_AI_CONFIGURATION_POLICY_PREFLIGHT",
    });
  }
});

test("preflight source adds no secret read, header, body, transport, network, persistence, or clock effect", () => {
  const source = fs.readFileSync(new URL("./ai-configuration-policy-preflight-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    "apiKey", "fetch(", "XMLHttpRequest", "node:http", "node:https", "readFile", "writeFile", "Date.now", "new Date",
    "Bearer ", "headers.set", "sqlite", "sqlcipher", "keychain", "SAVE_DIARY", "UPDATE_TARGET", "AITransport(",
  ]) {
    assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
});
