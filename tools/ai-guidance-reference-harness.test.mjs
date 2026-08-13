import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import * as guidanceContract from "./ai-guidance-reference-harness.mjs";
import {
  createD053AuthorizationEvidence,
  createPolicyCheckSubject,
  createProviderPolicyProfile,
} from "./ai-policy-harness.mjs";
import { createAiRequestEvidenceContext } from "./ai-request-evidence-context-harness.mjs";

const {
  BOUNDARY,
  createAiGuidanceReferenceDraft,
  discardAiGuidanceReferenceDraft,
  editAiGuidanceReferenceDraft,
  fingerprintAiGuidanceDefinition,
} = guidanceContract;

const policyHash = "a".repeat(64);

function context({ requestId = "guidance-request-1", transportProfileVersion = "transport-v1", subject: subjectOverrides = {}, profile: profileOverrides = {}, authorization: authorizationOverrides = {} } = {}) {
  const subject = createPolicyCheckSubject({
    schemaVersion: "POLICY_CHECK_SUBJECT_INPUT_V1",
    providerId: "provider-local",
    baseURL: "https://ai.example.test/v1",
    model: "model-1",
    payloadClass: "selected-seven-day-summary",
    profileVersion: "policy-v1",
    region: "CN",
    observedAt: "2026-08-13T12:00:00Z",
    ...subjectOverrides,
  });
  const profile = createProviderPolicyProfile({
    schemaVersion: "PROVIDER_POLICY_PROFILE_INPUT_V1",
    providerId: "provider-local",
    origin: "https://ai.example.test",
    models: ["model-1"],
    payloadClasses: ["selected-seven-day-summary"],
    profileVersion: "policy-v1",
    termsEvidence: { kind: "HTTPS_URL", value: "https://ai.example.test/terms" },
    privacyEvidence: { kind: "SNAPSHOT_SHA256", value: policyHash },
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
    ...profileOverrides,
  });
  const authorizationEvidence = createD053AuthorizationEvidence({
    schemaVersion: "D053_AUTHORIZATION_INPUT_V1",
    evidenceId: "d053-current-governance",
    recordedAt: "2026-08-13T12:00:00Z",
    ...authorizationOverrides,
  });
  return createAiRequestEvidenceContext({
    schemaVersion: "AI_REQUEST_EVIDENCE_CONTEXT_INPUT_V2",
    requestId,
    transportProfileVersion,
    subject,
    profile,
    authorizationEvidence,
  });
}

function definition(schemaVersion, definitionId, payload) {
  const core = { schemaVersion, definitionId, definitionVersion: "v1", payload };
  return { ...core, definitionFingerprint: fingerprintAiGuidanceDefinition(core) };
}

function contentDefinition(payload = { contentKind: "CALLER_DEFINED_GUIDANCE" }) {
  return definition("AI_GUIDANCE_CONTENT_DEFINITION_V1", "guidance-content", payload);
}

function disclaimerDefinition(payload = { contentId: "caller-non-medical-boundary" }) {
  return definition("AI_GUIDANCE_DISCLAIMER_DEFINITION_V1", "guidance-disclaimer", payload);
}

function response(content = { sections: [{ kind: "reference", text: "合成参考草稿" }] }) {
  return JSON.stringify({ schemaVersion: 1, content });
}

function draft(overrides = {}) {
  return createAiGuidanceReferenceDraft({
    responseText: response(),
    context: context(),
    generatedAt: "2026-08-13T20:30:00+08:00",
    contentDefinition: contentDefinition(),
    disclaimerDefinition: disclaimerDefinition(),
    ...overrides,
  });
}

test("creates only a volatile non-medical reference draft with source and generation time", () => {
  const state = draft();
  assert.equal(state.status, "REVIEWING");
  assert.equal(state.retention, "VOLATILE_APPLICATION_STATE_ONLY");
  assert.deepEqual(state.boundary, BOUNDARY);
  assert.equal(state.generatedAt, "2026-08-13T20:30:00+08:00");
  assert.equal(state.sourceEvidence.sourceKind, "AI_GENERATED_REFERENCE_DRAFT");
  assert.equal(state.sourceEvidence.providerId, "provider-local");
  assert.equal(state.sourceEvidence.origin, "https://ai.example.test");
  assert.equal(state.sourceEvidence.model, "model-1");
  assert.equal(state.sourceEvidence.authorizationFingerprint, state.context.authorizationEvidence.authorizationFingerprint);
  assert.equal(state.effect, null);
});

test("keeps content and disclaimer semantics caller-owned, fingerprinted, detached, and frozen", () => {
  const contentPayload = { fields: ["opaque-a", "opaque-b"] };
  const disclaimerPayload = { contentId: "synthetic-copy-id" };
  const contentDef = contentDefinition(contentPayload);
  const disclaimerDef = disclaimerDefinition(disclaimerPayload);
  const state = draft({ contentDefinition: contentDef, disclaimerDefinition: disclaimerDef });
  contentPayload.fields[0] = "changed";
  disclaimerPayload.contentId = "changed";
  assert.deepEqual(state.contentDefinition.payload.fields, ["opaque-a", "opaque-b"]);
  assert.equal(state.disclaimerDefinition.payload.contentId, "synthetic-copy-id");
  assert.equal(Object.isFrozen(state.contentDefinition.payload), true);
  assert.equal(Object.isFrozen(state.disclaimerDefinition.payload), true);
  assert.throws(
    () => draft({ contentDefinition: { ...contentDef, definitionFingerprint: "b".repeat(64) } }),
    { code: "INVALID_AI_GUIDANCE_DEFINITION" },
  );
  for (const payload of [null, "   ", [], {}]) {
    assert.throws(
      () => fingerprintAiGuidanceDefinition({
        schemaVersion: "AI_GUIDANCE_DISCLAIMER_DEFINITION_V1",
        definitionId: "empty-disclaimer",
        definitionVersion: "v1",
        payload,
      }),
      { code: "INVALID_AI_GUIDANCE_DEFINITION" },
    );
  }
});

test("strict response parsing rejects malformed JSON, unknown fields, versions, and empty content", () => {
  for (const responseText of [
    "{",
    JSON.stringify({ schemaVersion: 2, content: {} }),
    JSON.stringify({ schemaVersion: 1, content: {}, extra: true }),
    JSON.stringify({ schemaVersion: 1, content: null }),
  ]) {
    assert.throws(() => draft({ responseText }), { code: "INVALID_AI_GUIDANCE_RESPONSE" });
  }
  assert.throws(
    () => draft({ responseText: '{"schemaVersion":1,"content":{"text":"a","text":"b"}}' }),
    { code: "AI_GUIDANCE_DUPLICATE_JSON_KEY" },
  );
});

test("rejects secrets, special objects, accessors, cycles, sparse arrays, and resource abuse", () => {
  assert.throws(() => draft({ responseText: response({ clientSecret: "hidden" }) }), { code: "AI_GUIDANCE_SECRET_FIELD" });
  assert.throws(
    () => createAiGuidanceReferenceDraft({
      responseText: response(), context: context(), generatedAt: "2026-08-13T20:30:00+08:00",
      contentDefinition: contentDefinition({ value: new Date() }), disclaimerDefinition: disclaimerDefinition(),
    }),
    { code: "INVALID_AI_GUIDANCE_VALUE" },
  );
  const accessor = {};
  Object.defineProperty(accessor, "text", { enumerable: true, get: () => "unsafe" });
  assert.throws(() => contentDefinition(accessor), { code: "INVALID_AI_GUIDANCE_VALUE" });
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => contentDefinition(cyclic), { code: "INVALID_AI_GUIDANCE_VALUE" });
  const sparse = [];
  sparse.length = 1;
  assert.throws(() => contentDefinition({ values: sparse }), { code: "INVALID_AI_GUIDANCE_VALUE" });
  const extended = ["value"];
  Object.defineProperty(extended, "hidden", { value: "not-json" });
  assert.throws(() => contentDefinition({ values: extended }), { code: "INVALID_AI_GUIDANCE_VALUE" });
  const hiddenIndex = [];
  Object.defineProperty(hiddenIndex, "0", { value: "not-json" });
  assert.throws(() => contentDefinition({ values: hiddenIndex }), { code: "INVALID_AI_GUIDANCE_VALUE" });
  assert.throws(() => contentDefinition({ [Symbol("hidden")]: "not-json", value: true }), { code: "INVALID_AI_GUIDANCE_VALUE" });
  assert.throws(() => draft({ responseText: response({ text: "x".repeat(5000) }) }), { code: "AI_GUIDANCE_RESOURCE_LIMIT" });
  assert.throws(() => draft({ responseText: response({ values: Array(257).fill(null) }) }), { code: "AI_GUIDANCE_RESOURCE_LIMIT" });
});

test("requires a normalized HTTPS request context and an explicit real generation instant", () => {
  const forged = { ...context(), policySubject: { ...context().policySubject, baseURL: "http://ai.example.test" } };
  assert.throws(() => draft({ context: forged }), { code: "INVALID_AI_GUIDANCE_CONTEXT" });
  assert.throws(() => draft({ context: { ...context(), schemaVersion: "AI_REQUEST_CONTEXT_V1" } }), { code: "INVALID_AI_GUIDANCE_CONTEXT" });
  assert.throws(() => draft({ generatedAt: "2026-08-13" }), { code: "INVALID_AI_GUIDANCE_INSTANT" });
  assert.throws(() => draft({ generatedAt: "2026-02-30T20:30:00+08:00" }), { code: "INVALID_AI_GUIDANCE_INSTANT" });
  const normalized = draft({ context: context({ subject: { baseURL: "https://AI.EXAMPLE.TEST:443/v1" } }) });
  assert.equal(normalized.context.policySubject.origin, "https://ai.example.test");
});

test("edits locally while preserving AI source, boundary, definitions, and original fingerprint", () => {
  const initial = draft();
  const edited = editAiGuidanceReferenceDraft(initial, {
    expectedRevision: 1,
    content: { sections: [{ kind: "reference", text: "用户修改后的参考" }] },
  });
  assert.equal(edited.status, "EDITING");
  assert.equal(edited.revision, 2);
  assert.equal(edited.userEdited, true);
  assert.deepEqual(edited.sourceEvidence, initial.sourceEvidence);
  assert.deepEqual(edited.boundary, initial.boundary);
  assert.deepEqual(edited.contentDefinition, initial.contentDefinition);
  assert.deepEqual(edited.disclaimerDefinition, initial.disclaimerDefinition);
  assert.deepEqual(edited.originalContent, initial.originalContent);
  assert.notEqual(edited.currentContentFingerprint, initial.currentContentFingerprint);
  assert.equal(edited.effect, null);
});

test("rejects stale edits and invalid edited content without changing the prior state", () => {
  const initial = draft();
  assert.throws(
    () => editAiGuidanceReferenceDraft(initial, { expectedRevision: 2, content: { text: "stale" } }),
    { code: "STALE_AI_GUIDANCE_EDIT" },
  );
  assert.throws(
    () => editAiGuidanceReferenceDraft(initial, { expectedRevision: 1, content: null }),
    { code: "INVALID_AI_GUIDANCE_VALUE" },
  );
  assert.equal(initial.revision, 1);
  assert.equal(initial.content.sections[0].text, "合成参考草稿");
});

test("discard purges volatile content, is terminal, and remains idempotent", () => {
  const edited = editAiGuidanceReferenceDraft(draft(), { expectedRevision: 1, content: { text: "temporary" } });
  const discarded = discardAiGuidanceReferenceDraft(edited);
  assert.equal(discarded.status, "DISCARDED");
  assert.equal(discarded.retention, "VOLATILE_CONTENT_PURGED");
  assert.equal(discarded.originalContent, null);
  assert.equal(discarded.content, null);
  assert.equal(discarded.draftEvidence, null);
  assert.match(discarded.discardEvidence.discardFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(discardAiGuidanceReferenceDraft(discarded), discarded);
  assert.throws(
    () => editAiGuidanceReferenceDraft(discarded, { expectedRevision: 2, content: { text: "restore" } }),
    { code: "INVALID_AI_GUIDANCE_TRANSITION" },
  );
});

test("rejects forged boundary, provenance, content fingerprints, and discard evidence", () => {
  const state = draft();
  for (const forged of [
    { ...state, schemaVersion: "AI_GUIDANCE_REFERENCE_STATE_V1" },
    { ...state, boundary: { ...state.boundary, businessMutation: "AUTHORIZED" } },
    { ...state, sourceEvidence: { ...state.sourceEvidence, schemaVersion: "AI_GUIDANCE_SOURCE_EVIDENCE_V1" } },
    { ...state, sourceEvidence: { ...state.sourceEvidence, model: "forged-model" } },
    { ...state, sourceEvidence: { ...state.sourceEvidence, responseFingerprint: "b".repeat(64) } },
    { ...state, originalContent: { text: "forged-original" } },
    { ...state, currentContentFingerprint: "b".repeat(64) },
    { ...state, draftEvidence: { ...state.draftEvidence, revision: 99 } },
  ]) {
    assert.throws(() => discardAiGuidanceReferenceDraft(forged), { code: "INVALID_AI_GUIDANCE_STATE" });
  }
  const discarded = discardAiGuidanceReferenceDraft(state);
  assert.throws(
    () => discardAiGuidanceReferenceDraft({
      ...discarded,
      discardEvidence: { ...discarded.discardEvidence, discardFingerprint: "b".repeat(64) },
    }),
    { code: "INVALID_AI_GUIDANCE_STATE" },
  );
  const currentContent = { text: "same-user-edit" };
  const edited = editAiGuidanceReferenceDraft(state, { expectedRevision: 1, content: currentContent });
  const alternate = editAiGuidanceReferenceDraft(
    draft({ responseText: response({ text: "alternate-source" }) }),
    { expectedRevision: 1, content: currentContent },
  );
  assert.notEqual(edited.draftEvidence.sourceEvidenceFingerprint, alternate.draftEvidence.sourceEvidenceFingerprint);
  assert.throws(
    () => discardAiGuidanceReferenceDraft({ ...alternate, draftEvidence: edited.draftEvidence }),
    { code: "INVALID_AI_GUIDANCE_STATE" },
  );
});

test("does not retain raw response text outside the normalized opaque content", () => {
  const state = draft({ responseText: '{\n  "schemaVersion": 1,\n  "content": { "text": "normalized" }\n}\n' });
  assert.deepEqual(state.content, { text: "normalized" });
  assert.deepEqual(state.originalContent, { text: "normalized" });
  assert.equal("responseText" in state, false);
  assert.equal("rawResponse" in state, false);
});

test("exports no save, repository, diary, target, transport, or automatic mutation API", () => {
  assert.deepEqual(Object.keys(guidanceContract).sort(), [
    "BOUNDARY",
    "STATUSES",
    "createAiGuidanceReferenceDraft",
    "discardAiGuidanceReferenceDraft",
    "editAiGuidanceReferenceDraft",
    "fingerprintAiGuidanceDefinition",
  ]);
});

test("contract source adds no network, filesystem, clock, native, persistence, diary, target, or health classifier", () => {
  const source = fs.readFileSync(new URL("./ai-guidance-reference-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    "fetch(", "XMLHttpRequest", "node:http", "node:https", "readFile", "writeFile", "Date.now", "new Date()",
    "sqlite", "sqlcipher", "keychain", "healthkit", "react-native", "SAVE_DIARY", "UPDATE_TARGET",
    "saveGuidance", "Repository(", "AITransport(", "classifyMedical",
  ]) {
    assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
});
