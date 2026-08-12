import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  COMMAND_TYPES,
  applyCommand,
  buildReceipt,
  createInMemoryLocalProfileRepository,
  emptyRelatedEvidence,
  normalizeDocument,
  normalizeLocalProfileRecord,
  normalizeState,
  validateLocalProfileTransactionReceipt,
} from "./local-profile-record-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./local-profile-record-harness.mjs", import.meta.url));

function schemaDefinition({ id = "caller-profile-schema", version = "v1", payload = { fields: ["opaque-a", "opaque-b"] } } = {}) {
  return { schemaVersion: "LOCAL_PROFILE_SCHEMA_DEFINITION_V1", definitionId: id, definitionVersion: version, payload };
}

function document(values = { "opaque-a": "value-a" }, definition = schemaDefinition()) {
  return { schemaVersion: "LOCAL_PROFILE_DOCUMENT_V1", schemaDefinition: definition, values };
}

function profile({ profileId = "profile-1", revision = 1, createdAt = "2026-08-01T10:00:00+08:00", updatedAt = createdAt, profileDocument = document() } = {}) {
  return { schemaVersion: "LOCAL_PROFILE_RECORD_V1", profileId, revision, createdAt, updatedAt, document: profileDocument };
}

function relatedEvidence() {
  return {
    schemaVersion: "RELATED_LOCAL_DATA_EVIDENCE_V1",
    domains: [
      { domainId: "body-records", references: [{ recordId: "weight-1", revision: 2 }] },
      { domainId: "diary", references: [{ recordId: "meal-1", revision: 3 }] },
      { domainId: "goal-versions", references: [{ recordId: "goal-v1", revision: 1 }] },
      { domainId: "water-records", references: [{ recordId: "water-1", revision: 4 }] },
    ],
  };
}

async function state({ profiles = [], generation = 0, related = relatedEvidence() } = {}) {
  const repository = createInMemoryLocalProfileRepository({ profiles, repositoryGeneration: generation, relatedEvidence: related });
  return repository.snapshot();
}

function createCommand({ commandId = "command-create-1", profileId = "profile-1", createdAt = "2026-08-01T10:00:00+08:00", profileDocument = document() } = {}) {
  return { schemaVersion: "LOCAL_PROFILE_COMMAND_V1", commandId, type: COMMAND_TYPES.CREATE, profileId, createdAt, document: profileDocument };
}

function updateCommand({ commandId = "command-update-1", profileId = "profile-1", expectedRevision = 1, updatedAt = "2026-08-02T10:00:00+08:00", profileDocument = document({ "opaque-a": "changed" }) } = {}) {
  return { schemaVersion: "LOCAL_PROFILE_COMMAND_V1", commandId, type: COMMAND_TYPES.UPDATE, profileId, expectedRevision, updatedAt, document: profileDocument };
}

function deleteCommand({ commandId = "command-delete-1", profileId = "profile-1", expectedRevision = 1, deletedAt = "2026-08-02T10:00:00+08:00" } = {}) {
  return { schemaVersion: "LOCAL_PROFILE_COMMAND_V1", commandId, type: COMMAND_TYPES.DELETE, profileId, expectedRevision, deletedAt };
}

test("preserves a caller-supplied versioned schema and opaque JSON values without interpreting fields", () => {
  const source = document({
    "opaque-a": "value-a",
    "opaque-b": 12.5,
    nested: { flag: true, list: [null, "x", 7] },
  }, schemaDefinition({ payload: { vocabulary: "caller-owned", required: ["opaque-a"] } }));
  const normalized = normalizeDocument(source);
  assert.deepEqual(normalized, source);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(normalized.schemaDefinition.payload.vocabulary, "caller-owned");
});

test("allows an explicitly empty document without manufacturing profile fields or a default schema", () => {
  const normalized = normalizeDocument(document({}, schemaDefinition({ payload: {} })));
  assert.deepEqual(normalized.values, {});
  assert.deepEqual(normalized.schemaDefinition.payload, {});
  for (const key of ["name", "birthDate", "age", "sex", "gender", "height", "weight", "activity", "goal"]) assert.equal(key in normalized.values, false);
});

test("rejects unsafe JSON, cycles, special objects, non-finite values, unknown fields, and resource abuse", () => {
  const unsafe = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => normalizeDocument(document(unsafe)), { code: "INVALID_LOCAL_PROFILE_DOCUMENT" });
  const cycle = {};
  cycle.self = cycle;
  assert.throws(() => normalizeDocument(document(cycle)), { code: "INVALID_LOCAL_PROFILE_DOCUMENT" });
  assert.throws(() => normalizeDocument(document({ value: new Date() })), { code: "INVALID_LOCAL_PROFILE_DOCUMENT" });
  assert.throws(() => normalizeDocument(document({ value: Number.NaN })), { code: "INVALID_LOCAL_PROFILE_DOCUMENT" });
  assert.throws(() => normalizeDocument({ ...document(), accountId: "server-user" }), { code: "INVALID_LOCAL_PROFILE_DOCUMENT" });
  assert.throws(() => normalizeDocument(document({ text: "x".repeat(16385) })), { code: "LOCAL_PROFILE_DOCUMENT_TOO_LARGE" });
  assert.throws(() => normalizeDocument(document({ list: new Array(2049).fill(null) })), { code: "LOCAL_PROFILE_DOCUMENT_TOO_LARGE" });
});

test("normalizes records with explicit revision and offset instants and rejects impossible chronology", () => {
  const normalized = normalizeLocalProfileRecord(profile({ revision: 3, updatedAt: "2026-08-02T10:00:00+08:00" }));
  assert.equal(normalized.revision, 3);
  assert.throws(() => normalizeLocalProfileRecord(profile({ createdAt: "2026-08-01", updatedAt: "2026-08-01" })), { code: "INVALID_LOCAL_PROFILE_INSTANT" });
  assert.throws(() => normalizeLocalProfileRecord(profile({ createdAt: "2026-02-30T10:00:00+08:00" })), { code: "INVALID_LOCAL_PROFILE_INSTANT" });
  assert.throws(() => normalizeLocalProfileRecord(profile({ createdAt: "2026-08-02T10:00:00+08:00", updatedAt: "2026-08-01T10:00:00+08:00" })), { code: "INVALID_LOCAL_PROFILE_RECORD" });
});

test("creates one local profile with complete before/after evidence and no account or network identity", async () => {
  const repository = createInMemoryLocalProfileRepository({ relatedEvidence: relatedEvidence() });
  const result = await repository.execute(createCommand());
  assert.equal(result.status, "COMMITTED");
  assert.equal(result.receipt.affectedProfile.before, null);
  assert.equal(result.receipt.affectedProfile.after.profileId, "profile-1");
  assert.equal(result.receipt.affectedProfile.after.revision, 1);
  assert.equal(result.receipt.after.repositoryGeneration, 1);
  assert.equal("accountId" in result.receipt.affectedProfile.after, false);
  assert.deepEqual(validateLocalProfileTransactionReceipt(structuredClone(result.receipt)), result.receipt);
});

test("updates through revision CAS, increments once, and allows an explicitly new schema version", async () => {
  const repository = createInMemoryLocalProfileRepository({ profiles: [profile()], relatedEvidence: relatedEvidence(), repositoryGeneration: 5 });
  const nextDocument = document({ "opaque-new": "value" }, schemaDefinition({ version: "v2", payload: { fields: ["opaque-new"] } }));
  const result = await repository.execute(updateCommand({ profileDocument: nextDocument }));
  assert.equal(result.receipt.affectedProfile.before.revision, 1);
  assert.equal(result.receipt.affectedProfile.after.revision, 2);
  assert.equal(result.receipt.affectedProfile.after.document.schemaDefinition.definitionVersion, "v2");
  assert.equal(result.receipt.after.repositoryGeneration, 6);
});

test("rejects changing a schema definition payload without changing its ID or version", async () => {
  const repository = createInMemoryLocalProfileRepository({ profiles: [profile()] });
  await assert.rejects(() => repository.execute(updateCommand({
    profileDocument: document({ "opaque-a": "changed" }, schemaDefinition({ payload: { fields: ["silently-changed"] } })),
  })), { code: "LOCAL_PROFILE_SCHEMA_CONFLICT" });
  assert.equal((await repository.snapshot()).profiles[0].revision, 1);
});

test("preserves multiple explicit records without choosing an active profile or authorizing multi-profile UX", async () => {
  const profiles = [profile({ profileId: "profile-b" }), profile({ profileId: "profile-a" })];
  const snapshot = await state({ profiles });
  assert.deepEqual(snapshot.profiles.map(({ profileId }) => profileId), ["profile-a", "profile-b"]);
  for (const key of ["activeProfileId", "currentProfileId", "defaultProfileId", "selectedProfileId"]) assert.equal(key in snapshot, false);
});

test("delete removes only the selected profile record and proves all related domain evidence unchanged", async () => {
  const repository = createInMemoryLocalProfileRepository({ profiles: [profile()], relatedEvidence: relatedEvidence() });
  const result = await repository.execute(deleteCommand());
  assert.equal(result.receipt.affectedProfile.after, null);
  assert.deepEqual(result.receipt.after.profiles, []);
  assert.deepEqual(result.receipt.before.relatedEvidence, result.receipt.after.relatedEvidence);
  assert.equal(result.receipt.boundary.relatedDataMutation, "NOT_AUTHORIZED");
  assert.equal(result.receipt.boundary.relatedEvidenceUnchanged, true);
  assert.equal(result.receipt.boundary.relatedEvidenceFingerprintBefore, result.receipt.boundary.relatedEvidenceFingerprintAfter);
  assert.deepEqual(result.receipt.after.relatedEvidence.domains.map(({ domainId }) => domainId), ["body-records", "diary", "goal-versions", "water-records"]);
});

test("create and update also cannot mutate related domain evidence", async () => {
  const repository = createInMemoryLocalProfileRepository({ relatedEvidence: relatedEvidence() });
  const created = await repository.execute(createCommand());
  const updated = await repository.execute(updateCommand());
  for (const result of [created, updated]) {
    assert.equal(result.receipt.boundary.relatedDataMutation, "NOT_AUTHORIZED");
    assert.equal(result.receipt.boundary.relatedEvidenceUnchanged, true);
    assert.deepEqual(result.receipt.before.relatedEvidence, result.receipt.after.relatedEvidence);
  }
});

test("stale revisions, missing profiles, duplicates, and backwards instants fail without mutation", async () => {
  const repository = createInMemoryLocalProfileRepository({ profiles: [profile()] });
  const before = await repository.snapshot();
  await assert.rejects(() => repository.execute(updateCommand({ expectedRevision: 2 })), { code: "STALE_LOCAL_PROFILE_REVISION" });
  await assert.rejects(() => repository.execute(deleteCommand({ expectedRevision: 2 })), { code: "STALE_LOCAL_PROFILE_REVISION" });
  await assert.rejects(() => repository.execute(updateCommand({ profileId: "missing" })), { code: "LOCAL_PROFILE_NOT_FOUND" });
  await assert.rejects(() => repository.execute(createCommand()), { code: "LOCAL_PROFILE_ALREADY_EXISTS" });
  await assert.rejects(() => repository.execute(updateCommand({ updatedAt: "2026-07-31T10:00:00+08:00" })), { code: "STALE_LOCAL_PROFILE_INSTANT" });
  assert.deepEqual(await repository.snapshot(), before);
});

test("pre-commit failure changes neither state nor idempotency and can retry the same command", async () => {
  const repository = createInMemoryLocalProfileRepository({ relatedEvidence: relatedEvidence() });
  const command = createCommand();
  await assert.rejects(() => repository.execute(command, { fault: "PRE_COMMIT" }), { code: "LOCAL_PROFILE_PRE_COMMIT_FAILURE" });
  assert.deepEqual((await repository.snapshot()).profiles, []);
  const retry = await repository.execute(command);
  assert.equal(retry.status, "COMMITTED");
});

test("unknown post-commit result converges by replaying the same immutable command", async () => {
  const repository = createInMemoryLocalProfileRepository();
  const command = createCommand();
  await assert.rejects(() => repository.execute(command, { fault: "POST_COMMIT_UNKNOWN" }), { code: "LOCAL_PROFILE_POST_COMMIT_UNKNOWN" });
  assert.equal((await repository.snapshot()).profiles.length, 1);
  const replay = await repository.execute(command);
  assert.equal(replay.status, "REPLAYED");
  assert.equal(replay.receipt.after.profiles.length, 1);
});

test("command IDs bind immutable payloads and cannot be reused for another mutation", async () => {
  const repository = createInMemoryLocalProfileRepository();
  await repository.execute(createCommand());
  await assert.rejects(() => repository.execute(createCommand({ profileId: "profile-2" })), { code: "LOCAL_PROFILE_IDEMPOTENCY_CONFLICT" });
  assert.deepEqual((await repository.snapshot()).profiles.map(({ profileId }) => profileId), ["profile-1"]);
});

test("concurrent identical and competing commands serialize deterministically", async () => {
  const sameRepository = createInMemoryLocalProfileRepository();
  const command = createCommand();
  const sameResults = await Promise.all([sameRepository.execute(command), sameRepository.execute(command)]);
  assert.deepEqual(sameResults.map(({ status }) => status).sort(), ["COMMITTED", "REPLAYED"]);
  assert.equal((await sameRepository.snapshot()).profiles.length, 1);

  const competingRepository = createInMemoryLocalProfileRepository({ profiles: [profile()] });
  const competing = await Promise.allSettled([
    competingRepository.execute(updateCommand({ commandId: "update-a", profileDocument: document({ value: "a" }) })),
    competingRepository.execute(updateCommand({ commandId: "update-b", profileDocument: document({ value: "b" }) })),
  ]);
  assert.equal(competing.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(competing.filter((result) => result.status === "rejected" && result.reason.code === "STALE_LOCAL_PROFILE_REVISION").length, 1);
  assert.equal((await competingRepository.snapshot()).profiles[0].revision, 2);
});

test("canonical state is stable across profile, domain, reference, and JSON object input order", async () => {
  const firstRelated = relatedEvidence();
  const secondRelated = {
    schemaVersion: "RELATED_LOCAL_DATA_EVIDENCE_V1",
    domains: [...firstRelated.domains].reverse().map((domain) => ({ ...domain, references: [...domain.references].reverse() })),
  };
  const firstProfiles = [
    profile({ profileId: "profile-b", profileDocument: document({ b: 2, a: 1 }) }),
    profile({ profileId: "profile-a", profileDocument: document({ a: 1, b: 2 }) }),
  ];
  const secondProfiles = [...firstProfiles].reverse().map((item) => structuredClone(item));
  const first = await state({ profiles: firstProfiles, related: firstRelated });
  const second = await state({ profiles: secondProfiles, related: secondRelated });
  assert.deepEqual(first, second);
});

test("rejects conflicting schema identities, duplicate profiles, domains, references, and forged state fingerprints", async () => {
  await assert.rejects(() => state({ profiles: [profile(), profile()] }), { code: "DUPLICATE_LOCAL_PROFILE" });
  await assert.rejects(() => state({ profiles: [
    profile({ profileId: "profile-1" }),
    profile({ profileId: "profile-2", profileDocument: document({}, schemaDefinition({ payload: { changed: true } })) }),
  ] }), { code: "LOCAL_PROFILE_SCHEMA_CONFLICT" });
  const duplicateDomain = relatedEvidence();
  duplicateDomain.domains.push(structuredClone(duplicateDomain.domains[0]));
  await assert.rejects(() => state({ related: duplicateDomain }), { code: "DUPLICATE_RELATED_DATA_DOMAIN" });
  const duplicateReference = relatedEvidence();
  duplicateReference.domains[0].references.push(structuredClone(duplicateReference.domains[0].references[0]));
  await assert.rejects(() => state({ related: duplicateReference }), { code: "DUPLICATE_RELATED_DATA_REFERENCE" });
  const valid = await state();
  assert.throws(() => normalizeState({ ...valid, profilesFingerprint: "a".repeat(64) }), { code: "INVALID_LOCAL_PROFILE_STATE" });
});

test("validates complete transaction evidence and rejects command, profile, boundary, or related-data tampering", async () => {
  const repository = createInMemoryLocalProfileRepository({ profiles: [profile()], relatedEvidence: relatedEvidence() });
  const result = await repository.execute(deleteCommand());
  for (const mutate of [
    (receipt) => { receipt.commandFingerprint = "a".repeat(64); },
    (receipt) => { receipt.before.profiles[0].revision = 99; },
    (receipt) => { receipt.affectedProfile.after = receipt.affectedProfile.before; },
    (receipt) => { receipt.boundary.relatedDataMutation = "CASCADE_DELETE"; },
    (receipt) => { receipt.after.relatedEvidence.domains.pop(); },
  ]) {
    const forged = structuredClone(result.receipt);
    mutate(forged);
    assert.throws(() => validateLocalProfileTransactionReceipt(forged), { code: "INVALID_LOCAL_PROFILE_TRANSACTION" });
  }
});

test("copies and freezes caller inputs and does not read the system clock", async () => {
  const originalNow = Date.now;
  Date.now = () => { throw new Error("system clock must not be read"); };
  try {
    const mutableDocument = document({ value: "before" });
    const mutableRelated = relatedEvidence();
    const repository = createInMemoryLocalProfileRepository({ relatedEvidence: mutableRelated });
    const result = await repository.execute(createCommand({ profileDocument: mutableDocument }));
    mutableDocument.values.value = "after";
    mutableRelated.domains[0].references[0].revision = 99;
    assert.equal(result.receipt.after.profiles[0].document.values.value, "before");
    assert.equal(result.receipt.after.relatedEvidence.domains[0].references[0].revision, 2);
    assert.equal(Object.isFrozen(result), true);
    assert.throws(() => { result.receipt.boundary.relatedDataMutation = "ALTERED"; }, TypeError);
  } finally {
    Date.now = originalNow;
  }
});

test("exposes no account, approved profile fields, selection default, formula, cascade, network, native, storage, or secret capability", async () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  for (const pattern of [
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /HealthKit|UserNotifications|Keychain/,
    /AsyncStorage|SQLite|SQLCipher/,
    /["']react-native(?:\/[^"']*)?["']/,
    /["']expo(?:\/[^"']*)?["']/,
    /Mifflin|NASEM|NIDDK|BMI|body mass index/i,
    /password|email|phone|token|session/i,
    /CASCADE_DELETE|DELETE_GOALS|DELETE_DIARY|DELETE_BODY|DELETE_WATER/,
    /activeProfile|currentProfile|defaultProfile|selectedProfile/,
  ]) assert.doesNotMatch(source, pattern);
  const module = await import("./local-profile-record-harness.mjs");
  for (const name of ["signUp", "signIn", "selectProfile", "setActiveProfile", "calculateGoal", "deleteGoals", "cascadeDeleteProfile"]) assert.equal(name in module, false);
  assert.deepEqual(emptyRelatedEvidence(), { schemaVersion: "RELATED_LOCAL_DATA_EVIDENCE_V1", domains: [] });
  assert.equal("fieldDefinitions" in module, false);
});
