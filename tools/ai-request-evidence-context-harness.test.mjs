import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createD053AuthorizationEvidence,
  createPolicyCheckSubject,
  createProviderPolicyProfile,
} from "./ai-policy-harness.mjs";
import {
  BOUNDARY,
  createAiRequestEvidenceContext,
  normalizeAiRequestEvidenceContext,
} from "./ai-request-evidence-context-harness.mjs";

const snapshotHash = "a".repeat(64);

function evidence(overrides = {}) {
  const subject = createPolicyCheckSubject({
    schemaVersion: "POLICY_CHECK_SUBJECT_INPUT_V1",
    providerId: "provider-local",
    baseURL: "https://ai.example.test/v1",
    model: "model-1",
    payloadClass: "meal-text",
    profileVersion: "policy-v1",
    region: "CN",
    observedAt: "2026-08-13T12:00:00Z",
  });
  const profile = createProviderPolicyProfile({
    schemaVersion: "PROVIDER_POLICY_PROFILE_INPUT_V1",
    providerId: "provider-local",
    origin: "https://ai.example.test",
    models: ["model-1"],
    payloadClasses: ["meal-text"],
    profileVersion: "policy-v1",
    termsEvidence: { kind: "HTTPS_URL", value: "https://ai.example.test/terms" },
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
    reviewBasis: "Local test fixture; not provider truth or send authorization.",
    region: "CN",
  });
  const authorizationEvidence = createD053AuthorizationEvidence({
    schemaVersion: "D053_AUTHORIZATION_INPUT_V1",
    evidenceId: "d053-current-governance",
    recordedAt: "2026-08-13T12:00:00Z",
  });
  return { subject, profile, authorizationEvidence, ...overrides };
}

function context(overrides = {}) {
  return createAiRequestEvidenceContext({
    schemaVersion: "AI_REQUEST_EVIDENCE_CONTEXT_INPUT_V2",
    requestId: "request-1",
    transportProfileVersion: "transport-v1",
    ...evidence(),
    ...overrides,
  });
}

test("binds one immutable request to exact subject, profile, authorization, and policy-check evidence", () => {
  const value = context();
  assert.equal(value.schemaVersion, "AI_REQUEST_EVIDENCE_CONTEXT_V2");
  assert.equal(value.policyCheck.subjectFingerprint, value.policySubject.subjectFingerprint);
  assert.equal(value.policyCheck.profileFingerprint, value.policyProfile.profileFingerprint);
  assert.equal(value.policyCheck.authorizationFingerprint, value.authorizationEvidence.authorizationFingerprint);
  assert.equal(value.policyCheck.reason, "D053_NOT_AUTHORIZED");
  assert.equal(value.policyCheck.eligible, false);
  assert.match(value.contextFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(value.policyProfile.riskProfile), true);
  assert.deepEqual(normalizeAiRequestEvidenceContext(value), value);
});

test("states that caller-supplied response fixtures prove neither transport nor send authorization", () => {
  const value = context();
  assert.deepEqual(value.boundary, BOUNDARY);
  assert.equal(value.authorizationEvidence.decisionState, "CANDIDATE");
  assert.equal(value.authorizationEvidence.authorization, "NOT_AUTHORIZED");
  assert.equal(value.boundary.transportOccurrence, "NOT_ESTABLISHED");
  assert.equal(value.boundary.sendAuthorization, "NOT_GRANTED");
  assert.equal(value.boundary.networkRequests, 0);
});

test("rejects legacy, extra, malformed, and accessor-bearing context inputs", () => {
  assert.throws(() => normalizeAiRequestEvidenceContext({ ...context(), schemaVersion: "AI_REQUEST_CONTEXT_V1" }), {
    code: "INVALID_AI_REQUEST_EVIDENCE_CONTEXT",
  });
  assert.throws(() => normalizeAiRequestEvidenceContext({ ...context(), extra: true }), {
    code: "INVALID_AI_REQUEST_EVIDENCE_CONTEXT",
  });
  assert.throws(() => context({ requestId: "../unsafe" }), { code: "INVALID_AI_REQUEST_EVIDENCE_CONTEXT" });
  const accessor = { ...context() };
  Object.defineProperty(accessor, "requestId", { enumerable: true, get: () => "request-1" });
  assert.throws(() => normalizeAiRequestEvidenceContext(accessor), { code: "INVALID_AI_REQUEST_EVIDENCE_CONTEXT" });
});

test("fails closed when any nested policy evidence, boundary, check, or context fingerprint changes", () => {
  const value = context();
  for (const changed of [
    { ...value, policySubject: { ...value.policySubject, model: "other-model" } },
    { ...value, policyProfile: { ...value.policyProfile, state: "DENY" } },
    { ...value, authorizationEvidence: { ...value.authorizationEvidence, decisionState: "ACCEPTED" } },
    { ...value, policyCheck: { ...value.policyCheck, eligible: true } },
    { ...value, boundary: { ...value.boundary, sendAuthorization: "GRANTED" } },
    { ...value, contextFingerprint: "b".repeat(64) },
  ]) {
    assert.throws(() => normalizeAiRequestEvidenceContext(changed), { code: "INVALID_AI_REQUEST_EVIDENCE_CONTEXT" });
  }
});

test("accepts only an exact, current ALLOW profile whose sole remaining gate is D-053", () => {
  const base = evidence();
  const mismatchedSubject = createPolicyCheckSubject({
    schemaVersion: "POLICY_CHECK_SUBJECT_INPUT_V1",
    providerId: "provider-local",
    baseURL: "https://ai.example.test/v1",
    model: "other-model",
    payloadClass: "meal-text",
    profileVersion: "policy-v1",
    region: "CN",
    observedAt: "2026-08-13T12:00:00Z",
  });
  assert.throws(() => context({ subject: mismatchedSubject }), { code: "INVALID_AI_REQUEST_EVIDENCE_CONTEXT" });
  const deniedProfile = createProviderPolicyProfile({
    schemaVersion: "PROVIDER_POLICY_PROFILE_INPUT_V1",
    providerId: "provider-local",
    origin: "https://ai.example.test",
    models: ["model-1"],
    payloadClasses: ["meal-text"],
    profileVersion: "policy-v1",
    termsEvidence: { kind: "HTTPS_URL", value: "https://ai.example.test/terms" },
    privacyEvidence: { kind: "SNAPSHOT_SHA256", value: snapshotHash },
    reviewedAt: "2026-08-01T00:00:00Z",
    expiresAt: "2026-09-01T00:00:00Z",
    riskProfile: base.profile.riskProfile,
    state: "DENY",
    reviewBasis: "Denied test fixture.",
    region: "CN",
  });
  assert.throws(() => context({ profile: deniedProfile }), { code: "INVALID_AI_REQUEST_EVIDENCE_CONTEXT" });
});

test("changes the context fingerprint when request identity or exact subject changes", () => {
  const first = context();
  const otherRequest = context({ requestId: "request-2" });
  const changedSubject = createPolicyCheckSubject({
    schemaVersion: "POLICY_CHECK_SUBJECT_INPUT_V1",
    providerId: "provider-local",
    baseURL: "https://ai.example.test/v1/alternate",
    model: "model-1",
    payloadClass: "meal-text",
    profileVersion: "policy-v1",
    region: "CN",
    observedAt: "2026-08-13T12:00:00Z",
  });
  const otherSubject = context({ subject: changedSubject });
  assert.notEqual(first.contextFingerprint, otherRequest.contextFingerprint);
  assert.notEqual(first.contextFingerprint, otherSubject.contextFingerprint);
});

test("shared context source adds no transport, persistence, credential, or system-clock side effect", () => {
  const source = fs.readFileSync(new URL("./ai-request-evidence-context-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    "fetch(", "XMLHttpRequest", "node:http", "node:https", "readFile", "writeFile", "Date.now", "new Date",
    "sqlite", "sqlcipher", "keychain", "bearer ", "headers.set", "SAVE_DIARY", "UPDATE_TARGET", "AITransport(",
  ]) {
    assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
});
