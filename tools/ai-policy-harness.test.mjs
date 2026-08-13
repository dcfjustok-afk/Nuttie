import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  BOUNDARY,
  D053_AUTHORIZATION_BOUNDARY,
  POLICY_ASSERTION_BOUNDARY,
  commitCandidate,
  createD053AuthorizationEvidence,
  createPolicyCheckSubject,
  createProviderPolicyProfile,
  emptyBusinessState,
  normalizeHttpsBaseUrl,
  policyCheck,
  requestCandidate,
} from "./ai-policy-harness.mjs";

const HARNESS_PATH = fileURLToPath(new URL("./ai-policy-harness.mjs", import.meta.url));
const SNAPSHOT_HASH = "a".repeat(64);

function subject(overrides = {}) {
  return createPolicyCheckSubject({
    schemaVersion: "POLICY_CHECK_SUBJECT_INPUT_V1",
    providerId: "provider-local",
    baseURL: "https://ai.example.test/v1/",
    model: "local-model",
    payloadClass: "nutrition-label-photo",
    profileVersion: "profile-1",
    region: "CN",
    observedAt: "2026-08-13T12:00:00Z",
    ...overrides,
  });
}

function profile(overrides = {}) {
  return createProviderPolicyProfile({
    schemaVersion: "PROVIDER_POLICY_PROFILE_INPUT_V1",
    providerId: "provider-local",
    origin: "https://ai.example.test",
    models: ["local-model"],
    payloadClasses: ["nutrition-label-photo"],
    profileVersion: "profile-1",
    termsEvidence: { kind: "HTTPS_URL", value: "https://ai.example.test/terms" },
    privacyEvidence: { kind: "SNAPSHOT_SHA256", value: SNAPSHOT_HASH },
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
    reviewBasis: "Local policy review fixture; not provider truth or Owner authorization.",
    region: "CN",
    ...overrides,
  });
}

function authorization() {
  return createD053AuthorizationEvidence({
    schemaVersion: "D053_AUTHORIZATION_INPUT_V1",
    evidenceId: "d053-current-governance",
    recordedAt: "2026-08-13T12:00:00Z",
  });
}

test("normalizes HTTPS base URLs while rejecting insecure or ambiguous components", () => {
  assert.equal(normalizeHttpsBaseUrl("https://ai.example.test/v1"), "https://ai.example.test/v1");
  for (const value of ["http://ai.example.test", "not a URL", "https://user@ai.example.test", "https://ai.example.test?v=1", "https://ai.example.test/#x"]) {
    assert.throws(() => normalizeHttpsBaseUrl(value));
  }
});

test("creates an immutable exact request subject bound to provider, URL, scope, region, and observed time", () => {
  const value = subject();
  assert.equal(value.origin, "https://ai.example.test");
  assert.match(value.subjectFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(value), true);
  assert.throws(() => createPolicyCheckSubject({ ...value, schemaVersion: "POLICY_CHECK_SUBJECT_INPUT_V1", extra: true }), { code: "INVALID_POLICY_CHECK_SUBJECT" });
});

test("request subject rejects invalid IDs, regions, timestamps, and non-plain shapes", () => {
  assert.throws(() => subject({ providerId: "../provider" }), { code: "INVALID_POLICY_CHECK_SUBJECT" });
  assert.throws(() => subject({ region: "MARS" }), { code: "INVALID_POLICY_CHECK_SUBJECT" });
  assert.throws(() => subject({ observedAt: "2026-02-30T00:00:00Z" }), { code: "INVALID_POLICY_CHECK_SUBJECT" });
  const input = Object.assign(Object.create({ inherited: true }), {
    schemaVersion: "POLICY_CHECK_SUBJECT_INPUT_V1", providerId: "p", baseURL: "https://a.test", model: "m", payloadClass: "c", profileVersion: "v", region: "CN", observedAt: "2026-08-13T00:00:00Z",
  });
  assert.throws(() => createPolicyCheckSubject(input), { code: "INVALID_POLICY_CHECK_SUBJECT" });
});

test("creates a complete immutable policy profile with evidence and risk semantics", () => {
  const value = profile();
  assert.equal(value.assertionBoundary, POLICY_ASSERTION_BOUNDARY);
  assert.equal(value.termsEvidence.kind, "HTTPS_URL");
  assert.equal(value.privacyEvidence.kind, "SNAPSHOT_SHA256");
  assert.match(value.profileFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(value.riskProfile), true);
});

test("policy evidence references accept only safe HTTPS URLs or lowercase snapshot hashes", () => {
  assert.throws(() => profile({ termsEvidence: { kind: "HTTPS_URL", value: "http://ai.example.test/terms" } }), { code: "INVALID_POLICY_EVIDENCE_REFERENCE" });
  assert.throws(() => profile({ privacyEvidence: { kind: "SNAPSHOT_SHA256", value: "bad" } }), { code: "INVALID_POLICY_EVIDENCE_REFERENCE" });
  assert.throws(() => profile({ termsEvidence: { kind: "INLINE_TEXT", value: "trust me" } }), { code: "INVALID_POLICY_EVIDENCE_REFERENCE" });
});

test("policy validity requires real ordered UTC instants without reading the system clock", () => {
  assert.throws(() => profile({ reviewedAt: "2026-02-30T00:00:00Z" }), { code: "INVALID_POLICY_TIMESTAMP" });
  assert.throws(() => profile({ expiresAt: "2026-07-01T00:00:00Z" }), { code: "INVALID_POLICY_VALIDITY_WINDOW" });
  assert.throws(() => profile({ expiresAt: "2026-08-01T00:00:00Z" }), { code: "INVALID_POLICY_VALIDITY_WINDOW" });
});

test("scope arrays are dense, unique, bounded, canonical, and non-empty", () => {
  assert.deepEqual(profile({ models: ["z-model", "a-model"] }).models, ["a-model", "z-model"]);
  assert.throws(() => profile({ models: [] }), { code: "INVALID_POLICY_SCOPE" });
  assert.throws(() => profile({ models: ["local-model", "local-model"] }), { code: "INVALID_POLICY_SCOPE" });
  const sparse = [];
  sparse.length = 1;
  assert.throws(() => profile({ models: sparse }), { code: "INVALID_POLICY_SCOPE" });
});

test("risk fields and policy state are exact enumerations", () => {
  assert.throws(() => profile({ riskProfile: { ...profile().riskProfile, training: "MAYBE" } }), { code: "INVALID_POLICY_RISK_PROFILE" });
  assert.throws(() => profile({ riskProfile: { ...profile().riskProfile, extra: true } }), { code: "INVALID_POLICY_RISK_PROFILE" });
  assert.throws(() => profile({ state: "APPROVED" }), { code: "INVALID_PROVIDER_POLICY_PROFILE" });
});

test("profile tampering is rejected even when the caller keeps the old fingerprint", () => {
  const changed = structuredClone(profile());
  changed.models = ["other-model"];
  const result = policyCheck({ subject: subject(), profile: changed, authorizationEvidence: authorization() });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "INVALID_POLICY_EVIDENCE");
  assert.equal(result.error.code, "INVALID_PROVIDER_POLICY_PROFILE");
});

test("D-053 evidence explicitly records candidate and not-authorized governance truth", () => {
  const value = authorization();
  assert.equal(value.decisionId, "D-053");
  assert.equal(value.decisionState, "CANDIDATE");
  assert.equal(value.authorization, "NOT_AUTHORIZED");
  assert.equal(value.authorizationBoundary, D053_AUTHORIZATION_BOUNDARY);
  assert.match(value.authorizationFingerprint, /^[a-f0-9]{64}$/);
});

test("forged accepted D-053 evidence and changed fingerprints fail closed", () => {
  const forged = structuredClone(authorization());
  forged.decisionState = "ACCEPTED";
  forged.authorization = "AUTHORIZED";
  const result = policyCheck({ subject: subject(), profile: profile(), authorizationEvidence: forged });
  assert.equal(result.reason, "INVALID_POLICY_EVIDENCE");
  assert.equal(result.error.code, "INVALID_D053_AUTHORIZATION_EVIDENCE");
  const changed = structuredClone(authorization());
  changed.evidenceId = "other-evidence";
  assert.equal(policyCheck({ subject: subject(), profile: profile(), authorizationEvidence: changed }).eligible, false);
});

test("a fully matching local ALLOW profile remains blocked while D-053 is not authorized", () => {
  const result = policyCheck({ subject: subject(), profile: profile(), authorizationEvidence: authorization() });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "D053_NOT_AUTHORIZED");
  assert.equal(result.scopeMatched, true);
  assert.equal(result.appleProhibitedUseAbsent, true);
  assert.equal(result.profileStateAllows, true);
  assert.equal(result.authorizationGranted, false);
  assert.match(result.resultFingerprint, /^[a-f0-9]{64}$/);
});

test("provider, origin, model, payload, profile version, and region are all exact scope inputs", () => {
  const variants = [
    subject({ providerId: "provider-other" }),
    subject({ baseURL: "https://other.example.test/v1" }),
    subject({ model: "other-model" }),
    subject({ payloadClass: "meal-text" }),
    subject({ profileVersion: "profile-2" }),
    subject({ region: "US" }),
  ];
  for (const value of variants) {
    const result = policyCheck({ subject: value, profile: profile(), authorizationEvidence: authorization() });
    assert.equal(result.eligible, false);
    assert.equal(result.scopeMatched, false);
  }
});

test("GLOBAL profiles match regions but still do not bypass D-053", () => {
  const result = policyCheck({ subject: subject({ region: "EU_EEA" }), profile: profile({ region: "GLOBAL" }), authorizationEvidence: authorization() });
  assert.equal(result.scopeMatched, true);
  assert.equal(result.reason, "D053_NOT_AUTHORIZED");
});

test("Apple-prohibited training, advertising, or unrelated health-data use can never allow a profile", () => {
  for (const riskProfile of [
    { ...profile().riskProfile, training: "ALLOWED" },
    { ...profile().riskProfile, advertisingMarketing: "ALLOWED" },
    { ...profile().riskProfile, healthDataUse: "OTHER_USE" },
  ]) {
    const result = policyCheck({ subject: subject(), profile: profile({ riskProfile }), authorizationEvidence: authorization() });
    assert.equal(result.eligible, false);
    assert.equal(result.appleProhibitedUseAbsent, false);
    assert.equal(result.profileStateAllows, false);
  }
});

test("expired, not-yet-valid, DENY, UNKNOWN, and EXPIRED profiles never become eligible", () => {
  for (const value of [
    profile({ expiresAt: "2026-08-10T00:00:00Z" }),
    profile({ reviewedAt: "2026-08-14T00:00:00Z", expiresAt: "2026-09-01T00:00:00Z" }),
    profile({ state: "DENY" }), profile({ state: "UNKNOWN" }), profile({ state: "EXPIRED" }),
  ]) {
    assert.equal(policyCheck({ subject: subject(), profile: value, authorizationEvidence: authorization() }).eligible, false);
  }
});

test("legacy plain ALLOW objects and loose check requests are rejected", () => {
  const legacy = { state: "ALLOW", origin: "https://ai.example.test", model: "local-model", payloadClasses: ["nutrition-label-photo"], profileVersion: "profile-1" };
  assert.equal(policyCheck({ subject: subject(), profile: legacy, authorizationEvidence: authorization() }).reason, "INVALID_POLICY_EVIDENCE");
  assert.equal(policyCheck({ subject: subject(), profile: profile(), authorizationEvidence: authorization(), allow: true }).reason, "INVALID_POLICY_EVIDENCE");
});

test("user action and subject-bound label preview remain necessary but cannot override D-053", () => {
  const input = { subject: subject(), profile: profile(), authorizationEvidence: authorization() };
  assert.equal(requestCandidate(input).error.code, "USER_ACTION_REQUIRED");
  assert.equal(requestCandidate({ ...input, userInitiated: true }).error.code, "PREVIEW_CONFIRMATION_REQUIRED");
  const blocked = requestCandidate({ ...input, userInitiated: true, previewConfirmed: true });
  assert.equal(blocked.error.code, "PROVIDER_BLOCKED");
  assert.equal(blocked.error.reason, "D053_NOT_AUTHORIZED");
  assert.throws(() => requestCandidate({ ...input, userInitiated: true, previewConfirmed: true, allow: true }), { code: "INVALID_REQUEST_CANDIDATE_INPUT" });
});

test("blocked requests preserve business state and expose no transport, key, body, or persistence effect", () => {
  const state = { records: [{ id: "r1", value: 1 }] };
  const result = requestCandidate({ state, subject: subject(), profile: profile(), authorizationEvidence: authorization(), userInitiated: true, previewConfirmed: true });
  assert.equal(result.transport, "NOT_SENT");
  assert.equal(result.authorizationRead, false);
  assert.equal(result.sensitiveBodySerialized, false);
  assert.equal(result.persisted, false);
  assert.deepEqual(result.state, state);
  assert.equal(Object.isFrozen(result.state.records[0]), true);
});

test("candidate commit always fails without mutating strict business state", () => {
  const state = { records: [{ id: "r1" }] };
  const result = commitCandidate({ status: "CANDIDATE" }, state);
  assert.equal(result.committed, false);
  assert.equal(result.error.code, "USER_ACCEPTANCE_REQUIRED");
  assert.deepEqual(result.state, state);
  assert.throws(() => commitCandidate(null, { records: [], extra: true }), { code: "INVALID_BUSINESS_STATE" });
});

test("request subject replay against changed profile or authorization evidence fails closed", () => {
  const originalSubject = subject();
  const changedProfile = profile({ profileVersion: "profile-2" });
  const mismatch = policyCheck({ subject: originalSubject, profile: changedProfile, authorizationEvidence: authorization() });
  assert.equal(mismatch.eligible, false);
  assert.equal(mismatch.scopeMatched, false);
  const changedSubject = structuredClone(originalSubject);
  changedSubject.model = "other-model";
  assert.equal(policyCheck({ subject: changedSubject, profile: profile(), authorizationEvidence: authorization() }).reason, "INVALID_POLICY_EVIDENCE");
});

test("boundary and source audit preserve zero network, Keychain, body, clock, and business writes", () => {
  assert.deepEqual(BOUNDARY, {
    contractStatus: "SPIKE_LOCAL_ONLY_NON_PRODUCTION",
    d053DecisionState: "CANDIDATE",
    d053Authorization: "NOT_AUTHORIZED",
    policyTruth: POLICY_ASSERTION_BOUNDARY,
    networkRequests: 0,
    authorizationReads: 0,
    sensitiveBodySerializations: 0,
    keychainReads: 0,
    businessWrites: 0,
    systemClockRead: false,
    formalImplementationAuthorized: false,
  });
  const source = fs.readFileSync(HARNESS_PATH, "utf8");
  for (const forbidden of [/node:http/, /node:https/, /fetch\s*\(/, /XMLHttpRequest/, /Keychain/, /SecureStore/, /Date\.now/, /new Date\s*\(\s*\)/, /writeFile/, /["']Authorization["']\s*:/]) assert.doesNotMatch(source, forbidden);
});

void emptyBusinessState;
