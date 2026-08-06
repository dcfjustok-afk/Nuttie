import assert from "node:assert/strict";
import test from "node:test";
import {
  commitCandidate,
  emptyBusinessState,
  normalizeHttpsBaseUrl,
  policyCheck,
  requestCandidate,
} from "./ai-policy-harness.mjs";

const policy = {
  state: "ALLOW",
  origin: "https://ai.example.test",
  model: "local-model",
  payloadClasses: ["nutrition-label-photo"],
  profileVersion: "profile-1",
};

test("accepts HTTPS and rejects non-HTTPS base URLs", () => {
  assert.equal(normalizeHttpsBaseUrl("https://ai.example.test/path#fragment"), "https://ai.example.test/path");
  assert.throws(() => normalizeHttpsBaseUrl("http://ai.example.test"), { code: "HTTPS_REQUIRED" });
  assert.throws(() => normalizeHttpsBaseUrl("not a URL"), { code: "INVALID_BASE_URL" });
});

test("policy eligibility is local and scope-bound", () => {
  const eligible = policyCheck({
    baseURL: "https://ai.example.test",
    model: "local-model",
    payloadClass: "nutrition-label-photo",
    profileVersion: "profile-1",
    policy,
  });
  assert.equal(eligible.eligible, true);
  const mismatch = policyCheck({
    baseURL: "https://ai.example.test",
    model: "other-model",
    payloadClass: "nutrition-label-photo",
    profileVersion: "profile-1",
    policy,
  });
  assert.deepEqual(mismatch, {
    eligible: false,
    reason: "SCOPE_MISMATCH",
    request: {
      origin: "https://ai.example.test",
      model: "other-model",
      payloadClass: "nutrition-label-photo",
      profileVersion: "profile-1",
    },
  });
});

test("UNKNOWN, DENY and EXPIRED policies fail closed", () => {
  for (const state of ["UNKNOWN", "DENY", "EXPIRED"]) {
    const result = requestCandidate({
      state: emptyBusinessState(),
      baseURL: "https://ai.example.test",
      model: "local-model",
      payloadClass: "nutrition-label-photo",
      profileVersion: "profile-1",
      policy: { ...policy, state },
      userInitiated: true,
      previewConfirmed: true,
      labelPhoto: true,
    });
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.transport, "NOT_SENT");
    assert.equal(result.persisted, false);
    assert.equal(result.error.code, "PROVIDER_BLOCKED");
    assert.deepEqual(result.state, { records: [] });
  }
});

test("user action and label-photo preview are separate gates", () => {
  const noAction = requestCandidate({
    baseURL: "https://ai.example.test",
    model: "local-model",
    payloadClass: "nutrition-label-photo",
    profileVersion: "profile-1",
    policy,
    previewConfirmed: true,
    labelPhoto: true,
  });
  assert.equal(noAction.error.code, "USER_ACTION_REQUIRED");

  const noPreview = requestCandidate({
    baseURL: "https://ai.example.test",
    model: "local-model",
    payloadClass: "nutrition-label-photo",
    profileVersion: "profile-1",
    policy,
    userInitiated: true,
    labelPhoto: true,
  });
  assert.equal(noPreview.error.code, "PREVIEW_CONFIRMATION_REQUIRED");
});

test("eligible requests remain unpersisted candidates and commit is blocked without acceptance", () => {
  const candidate = requestCandidate({
    state: { records: [{ id: "r1" }] },
    baseURL: "https://ai.example.test",
    model: "local-model",
    payloadClass: "nutrition-label-photo",
    profileVersion: "profile-1",
    policy,
    userInitiated: true,
    previewConfirmed: true,
    labelPhoto: true,
  });
  assert.equal(candidate.status, "CANDIDATE");
  assert.equal(candidate.transport, "NOT_SENT");
  assert.equal(candidate.persisted, false);
  const commit = commitCandidate(candidate, { records: [{ id: "r1" }] });
  assert.equal(commit.committed, false);
  assert.equal(commit.error.code, "USER_ACCEPTANCE_REQUIRED");
  assert.deepEqual(commit.state, { records: [{ id: "r1" }] });
});
