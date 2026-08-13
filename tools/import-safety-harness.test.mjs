import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BOUNDARY,
  DEFAULT_LIMITS,
  activateImport,
  assertManifestEntriesMatch,
  createImportSubject,
  createImportVerificationEvidence,
  normalizeEntryPath,
  prepareImport,
  validateEntries,
  validateManifest,
} from "./import-safety-harness.mjs";

const manifest = {
  schemaVersion: 1,
  packVersion: "food-1",
  files: ["catalog.json"],
  source: { kind: "synthetic" },
};
const entries = [{ path: "catalog.json", size: 10, type: "file" }];
const currentState = { activeEntries: [{ path: "old/catalog.json", size: 10, type: "file" }] };

function subject(overrides = {}) {
  return createImportSubject({
    schemaVersion: "IMPORT_SUBJECT_INPUT_V1",
    manifest,
    entries,
    ...overrides,
  });
}

function verification(importSubject, overrides = {}) {
  return createImportVerificationEvidence({
    schemaVersion: "IMPORT_VERIFICATION_INPUT_V1",
    evidenceId: "verification-1",
    subjectFingerprint: importSubject.subjectFingerprint,
    signature: { status: "VERIFIED", verifierId: "fixture-signature-port", profileId: "pending-D-026" },
    integrity: { status: "VERIFIED", verifierId: "fixture-integrity-port", profileId: "fixture-sha256-v1" },
    ...overrides,
  });
}

function prepared(importSubject = subject(), evidence = null, state = currentState) {
  return prepareImport({
    currentState: state,
    subject: importSubject,
    verificationEvidence: evidence ?? verification(importSubject),
  });
}

test("normalizes safe relative NFC paths and rejects traversal, absolute, control, and long paths", () => {
  assert.equal(normalizeEntryPath("catalog/cafe\u0301.json"), "catalog/café.json");
  for (const path of ["../secret", "/absolute", "C:/secret", "catalog\\data", "catalog/../secret", "catalog/\u0000data", "catalog/\u0001data", "", "a//b", "./a"]) {
    assert.throws(() => normalizeEntryPath(path), { code: "UNSAFE_ENTRY_PATH" });
  }
  assert.throws(() => normalizeEntryPath("x".repeat(20), { maxPathBytes: 10 }), { code: "ENTRY_PATH_LIMIT" });
});

test("custom import limits can only tighten approved defaults", () => {
  assert.equal(validateEntries(entries, { maxEntries: 1 }).entries.length, 1);
  assert.throws(() => validateEntries(entries, { maxEntries: DEFAULT_LIMITS.maxEntries + 1 }), { code: "INVALID_IMPORT_LIMITS" });
  assert.throws(() => validateEntries(entries, { maxEntries: 0 }), { code: "INVALID_IMPORT_LIMITS" });
  assert.throws(() => validateEntries(entries, { maxEntries: 1.5 }), { code: "INVALID_IMPORT_LIMITS" });
  assert.throws(() => validateEntries(entries, { maxEntryBytes: 11, maxTotalBytes: 10 }), { code: "INVALID_IMPORT_LIMITS" });
  assert.throws(() => validateEntries(entries, { surprise: 1 }), { code: "INVALID_IMPORT_LIMITS" });
});

test("entry sets reject exact, NFC-equivalent, and case-insensitive path collisions", () => {
  assert.throws(() => validateEntries([...entries, ...entries]), { code: "DUPLICATE_ENTRY_PATH" });
  assert.throws(() => validateEntries([
    { path: "café.json", size: 1, type: "file" },
    { path: "cafe\u0301.json", size: 1, type: "file" },
  ]), { code: "DUPLICATE_ENTRY_PATH" });
  assert.throws(() => validateEntries([
    { path: "Catalog.json", size: 1, type: "file" },
    { path: "catalog.json", size: 1, type: "file" },
  ]), { code: "ENTRY_PATH_COLLISION" });
});

test("entries must be dense exact plain records without accessors, symbols, or special types", () => {
  assert.throws(() => validateEntries([{ ...entries[0], sha256: "a".repeat(64) }]), { code: "INVALID_ENTRY" });
  assert.throws(() => validateEntries([{ path: "link", size: 1, type: "symlink" }]), { code: "UNSAFE_ENTRY_TYPE" });
  assert.throws(() => validateEntries(Array(1)), { code: "INVALID_ENTRIES" });
  const getter = { size: 1, type: "file" };
  let getterCalls = 0;
  Object.defineProperty(getter, "path", { enumerable: true, get() { getterCalls += 1; return "hidden"; } });
  assert.throws(() => validateEntries([getter]), { code: "INVALID_ENTRY" });
  assert.equal(getterCalls, 0);
  const symbolEntry = { ...entries[0] };
  symbolEntry[Symbol("hidden")] = true;
  assert.throws(() => validateEntries([symbolEntry]), { code: "INVALID_ENTRY" });
});

test("entry count, per-entry bytes, total bytes, and safe integers fail closed", () => {
  assert.throws(() => validateEntries(entries, { maxEntries: 1, maxEntryBytes: 9, maxTotalBytes: 10 }), { code: "ENTRY_SIZE_LIMIT" });
  assert.throws(() => validateEntries([...entries, { path: "b", size: 1, type: "file" }], { maxEntries: 1 }), { code: "ENTRY_COUNT_LIMIT" });
  assert.throws(() => validateEntries([{ path: "a", size: 8, type: "file" }, { path: "b", size: 8, type: "file" }], { maxEntryBytes: 10, maxTotalBytes: 15 }), { code: "TOTAL_SIZE_LIMIT" });
  assert.throws(() => validateEntries([{ path: "a", size: Number.MAX_VALUE, type: "file" }]), { code: "INVALID_ENTRY_SIZE" });
});

test("manifest requires a positive schema, pack version, non-empty dense files, and rejects critical extensions", () => {
  assert.throws(() => validateManifest({ ...manifest, schemaVersion: 0 }), { code: "INVALID_MANIFEST_VERSION" });
  assert.throws(() => validateManifest({ ...manifest, packVersion: "" }), { code: "MISSING_PACK_VERSION" });
  assert.throws(() => validateManifest({ ...manifest, files: [] }), { code: "INVALID_MANIFEST_FILES" });
  assert.throws(() => validateManifest({ ...manifest, files: Array(1) }), { code: "INVALID_IMPORT_METADATA" });
  assert.throws(() => validateManifest({ ...manifest, "!algorithm": "none" }), { code: "UNKNOWN_CRITICAL_KEY" });
  assert.equal(validateManifest({ ...manifest, displayHint: "allowed noncritical metadata" }).displayHint, "allowed noncritical metadata");
});

test("manifest metadata rejects accessors, symbols, cycles, unsafe numbers, and resource abuse", () => {
  const getterManifest = { ...manifest };
  let getterCalls = 0;
  Object.defineProperty(getterManifest, "source", { enumerable: true, get() { getterCalls += 1; return {}; } });
  assert.throws(() => validateManifest(getterManifest), { code: "INVALID_MANIFEST" });
  assert.equal(getterCalls, 0);
  const symbolManifest = { ...manifest };
  symbolManifest[Symbol("hidden")] = true;
  assert.throws(() => validateManifest(symbolManifest), { code: "INVALID_MANIFEST" });
  const cyclic = { ...manifest };
  cyclic.source = cyclic;
  assert.throws(() => validateManifest(cyclic), { code: "INVALID_IMPORT_METADATA" });
  assert.throws(() => validateManifest({ ...manifest, source: { value: Number.NaN } }), { code: "INVALID_IMPORT_METADATA" });
  assert.throws(() => validateManifest({ ...manifest, source: { note: "x".repeat(11) } }, { maxStringBytes: 10 }), { code: "IMPORT_METADATA_RESOURCE_LIMIT" });
  assert.throws(() => validateManifest({ ...manifest, source: { note: "x".repeat(200) } }, { maxManifestBytes: 100 }), { code: "MANIFEST_SIZE_LIMIT" });
});

test("manifest files reject exact, NFC-equivalent, and case-insensitive collisions", () => {
  assert.throws(() => validateManifest({ ...manifest, files: ["a", "a"] }), { code: "DUPLICATE_MANIFEST_FILE" });
  assert.throws(() => validateManifest({ ...manifest, files: ["café", "cafe\u0301"] }), { code: "DUPLICATE_MANIFEST_FILE" });
  assert.throws(() => validateManifest({ ...manifest, files: ["DATA/a", "data/a"] }), { code: "MANIFEST_PATH_COLLISION" });
});

test("manifest paths must match actual entries exactly regardless of archive order", () => {
  const multiManifest = { ...manifest, files: ["b", "a"] };
  const validated = validateEntries([{ path: "a", size: 1, type: "file" }, { path: "b", size: 1, type: "file" }]);
  assert.equal(assertManifestEntriesMatch(multiManifest, validated), true);
  assert.throws(() => assertManifestEntriesMatch(manifest, validateEntries([{ path: "other", size: 1, type: "file" }])), { code: "MANIFEST_ENTRIES_MISMATCH" });
});

test("import subjects normalize inputs, bind limits and derived entries, and are deeply immutable", () => {
  const input = { schemaVersion: "IMPORT_SUBJECT_INPUT_V1", manifest: { ...manifest }, entries: [{ ...entries[0] }], limits: { maxEntries: 5 } };
  const value = createImportSubject(input);
  input.manifest.packVersion = "mutated";
  input.entries[0].size = 99;
  assert.equal(value.manifest.packVersion, "food-1");
  assert.equal(value.validatedEntries.entries[0].size, 10);
  assert.equal(value.limits.maxEntries, 5);
  assert.match(value.subjectFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.manifest.source), true);
});

test("subject fingerprints are canonical for object key order and change with exact import metadata", () => {
  const first = subject();
  const reordered = createImportSubject({
    entries,
    manifest: { files: ["catalog.json"], source: { kind: "synthetic" }, packVersion: "food-1", schemaVersion: 1 },
    schemaVersion: "IMPORT_SUBJECT_INPUT_V1",
  });
  assert.equal(first.subjectFingerprint, reordered.subjectFingerprint);
  assert.notEqual(first.subjectFingerprint, subject({ entries: [{ ...entries[0], size: 11 }] }).subjectFingerprint);
  assert.notEqual(first.subjectFingerprint, subject({ manifest: { ...manifest, packVersion: "food-2" } }).subjectFingerprint);
});

test("caller verification assertions bind the exact subject without claiming verifier truth", () => {
  const importSubject = subject();
  const evidence = verification(importSubject);
  assert.equal(evidence.subjectFingerprint, importSubject.subjectFingerprint);
  assert.equal(evidence.assertionBoundary, "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS");
  assert.equal(evidence.signature.profileId, "pending-D-026");
  assert.match(evidence.verificationFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(evidence.signature), true);
});

test("boolean verification flags and malformed or incomplete assertions are rejected", () => {
  const importSubject = subject();
  assert.throws(() => prepareImport({ currentState, subject: importSubject, verificationEvidence: verification(importSubject), signatureVerified: true }), { code: "INVALID_IMPORT_PREPARE_REQUEST" });
  assert.throws(() => createImportVerificationEvidence({
    schemaVersion: "IMPORT_VERIFICATION_INPUT_V1",
    evidenceId: "verification-1",
    subjectFingerprint: importSubject.subjectFingerprint,
    signature: { status: "FAILED", verifierId: "fixture-signature-port", profileId: "pending-D-026" },
    integrity: { status: "VERIFIED", verifierId: "fixture-integrity-port", profileId: "fixture-sha256-v1" },
  }), { code: "INVALID_IMPORT_VERIFICATION_EVIDENCE" });
  assert.throws(() => createImportVerificationEvidence({
    schemaVersion: "IMPORT_VERIFICATION_INPUT_V1",
    evidenceId: "verification-1",
    subjectFingerprint: importSubject.subjectFingerprint,
    signature: { status: "VERIFIED", verifierId: "fixture-signature-port", profileId: "pending-D-026" },
  }), { code: "INVALID_IMPORT_VERIFICATION_EVIDENCE" });
});

test("a structurally valid subject becomes ready only with its bound verification assertion", () => {
  const value = prepared();
  assert.equal(value.status, "READY_FOR_ACTIVATION");
  assert.equal(value.committed, false);
  assert.equal(value.boundary.activationStrategy, "PENDING_D026_D027_D030");
  assert.deepEqual(value.state, currentState);
  assert.match(value.activeStateFingerprint, /^[a-f0-9]{64}$/);
  assert.match(value.preparedFingerprint, /^[a-f0-9]{64}$/);
});

test("verification evidence cannot be replayed against another subject", () => {
  const first = subject();
  const second = subject({ manifest: { ...manifest, packVersion: "food-2" } });
  const result = prepared(second, verification(first));
  assert.equal(result.status, "REJECTED");
  assert.equal(result.error.code, "IMPORT_VERIFICATION_SUBJECT_MISMATCH");
  assert.deepEqual(result.state, currentState);
});

test("tampered subject or verification fingerprints fail without changing active state", () => {
  const importSubject = subject();
  const badSubject = { ...importSubject, subjectFingerprint: "0".repeat(64) };
  const rejectedSubject = prepared(badSubject, verification(importSubject));
  assert.equal(rejectedSubject.status, "REJECTED");
  assert.equal(rejectedSubject.error.code, "INVALID_IMPORT_SUBJECT");

  const evidence = verification(importSubject);
  const rejectedEvidence = prepared(importSubject, { ...evidence, verificationFingerprint: "0".repeat(64) });
  assert.equal(rejectedEvidence.status, "REJECTED");
  assert.equal(rejectedEvidence.error.code, "INVALID_IMPORT_VERIFICATION_EVIDENCE");
  assert.deepEqual(rejectedEvidence.state, currentState);
  assert.equal(Object.isFrozen(rejectedEvidence), true);
});

test("activation remains pending and is bound to the exact active-state snapshot", () => {
  const ready = prepared();
  const pending = activateImport(ready, currentState);
  assert.equal(pending.committed, false);
  assert.equal(pending.error.code, "ACTIVATION_STRATEGY_PENDING");
  assert.deepEqual(pending.state, currentState);

  const changedState = { activeEntries: [{ path: "old/catalog.json", size: 11, type: "file" }] };
  const changed = activateImport(ready, changedState);
  assert.equal(changed.error.code, "ACTIVE_IMPORT_STATE_CHANGED");
  assert.deepEqual(changed.state, changedState);
});

test("forged prepared values never activate or mutate the current state", () => {
  const ready = prepared();
  for (const forged of [null, { status: "READY_FOR_ACTIVATION" }, { ...ready, committed: true }, { ...ready, preparedFingerprint: "0".repeat(64) }]) {
    const result = activateImport(forged, currentState);
    assert.equal(result.committed, false);
    assert.equal(result.error.code, "IMPORT_NOT_READY");
    assert.deepEqual(result.state, currentState);
  }
});

test("the harness performs no filesystem, network, native, clock, cryptographic verification, or activation writes", async () => {
  const source = await readFile(new URL("./import-safety-harness.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /node:fs|\b(?:fetch|XMLHttpRequest|WebSocket)\b|node:https|node:http|https?:\/\//);
  assert.doesNotMatch(source, /\b(?:Date\.now|new Date|performance\.now|setTimeout|setInterval)\b/);
  assert.doesNotMatch(source, /\b(?:writeFile|appendFile|rename|unlink|rm|SQLite|Keychain|DocumentPicker)\b/);
  assert.deepEqual(BOUNDARY, {
    contractStatus: "SPIKE_FRAMEWORK_AGNOSTIC_NON_PRODUCTION",
    verificationTruth: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
    activationStrategy: "PENDING_D026_D027_D030",
    filesystemReads: 0,
    filesystemWrites: 0,
    realNetworkRequests: 0,
    nativeApiCalls: 0,
    committed: false,
  });
});
