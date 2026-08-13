import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BOUNDARY,
  DEFAULT_LIMITS,
  NUTRIENTS,
  createPackSubject,
  createPackVerificationEvidence,
  normalizePackPath,
  parseManifestPreAuth,
  validateBarcodeMapping,
  validatePackContract,
  validatePackManifest,
  validateProvenanceRecords,
  validateTransforms,
} from "./data-pack-contract-harness.mjs";

const manifest = {
  formatVersion: 1,
  packId: "synthetic.tw.food",
  packVersion: "2026.08.0",
  createdAt: "2026-08-07T00:00:00Z",
  minimumAppVersion: "0.1.0",
  schemaVersion: 1,
  source: {
    datasetId: "synthetic.tw",
    name: "Synthetic Taiwan food fixture",
    version: "fixture-1",
    url: "https://official.example.test/food",
    retrievedAt: "2026-08-07T00:00:00Z",
    rawArtifactSha256: "a".repeat(64),
    licenseId: "synthetic-license",
    attribution: "Synthetic fixture only",
  },
  transformVersion: "fixture-transform-1",
  recordProvenanceVersion: 1,
  nutrients: [...NUTRIENTS],
  files: [
    { path: "payload/catalog.sqlite", size: 100, sha256: "b".repeat(64) },
    { path: "metadata/provenance.ndjson", size: 200, sha256: "c".repeat(64) },
    { path: "metadata/transforms.json", size: 300, sha256: "d".repeat(64) },
    { path: "license/NOTICE.txt", size: 400, sha256: "e".repeat(64) },
  ],
  signature: { algorithm: "pending-D-026", keyId: "fixture-key-1" },
};

const entries = manifest.files.map((entry) => ({ ...entry, type: "file" }));
const provenance = [{
  sourceId: "synthetic.tw",
  sourceVersion: "fixture-1",
  sourceRecordId: "source-1",
  catalogRecordId: "food-1",
  licenseId: "synthetic-license",
  missingFields: ["sugar", "sodium"],
  originalValues: {
    energy: { value: 0, unit: "kcal" },
    protein: { value: 4, unit: "g" },
    carbohydrate: { value: 8, unit: "g" },
    fat: { value: 2, unit: "g" },
    fiber: { value: 1, unit: "g" },
    sugar: null,
    sodium: null,
  },
}];
const transforms = {
  transformVersion: "fixture-transform-1",
  steps: [{ id: "noop", operation: "no-op", toolVersion: "fixture-tool-1" }],
};

function subject(overrides = {}) {
  return createPackSubject({
    schemaVersion: "DATA_PACK_SUBJECT_INPUT_V1",
    manifest,
    entries,
    provenanceRecords: provenance,
    transforms,
    notice: "Synthetic attribution",
    ...overrides,
  });
}

function verification(packSubject, overrides = {}) {
  return createPackVerificationEvidence({
    schemaVersion: "DATA_PACK_VERIFICATION_INPUT_V1",
    evidenceId: "fixture-verification-1",
    subjectFingerprint: packSubject.subjectFingerprint,
    signature: { status: "VERIFIED", verifierId: "fixture-signature-port", profileId: "pending-D-026" },
    integrity: { status: "VERIFIED", verifierId: "fixture-integrity-port", profileId: "fixture-sha256-v1" },
    ...overrides,
  });
}

function ready(packSubject = subject(), evidence = null) {
  return validatePackContract({ subject: packSubject, verificationEvidence: evidence ?? verification(packSubject) });
}

test("creates a deeply immutable pack subject bound to normalized evidence", () => {
  const inputManifest = structuredClone(manifest);
  const inputEntries = structuredClone(entries);
  const value = subject({ manifest: inputManifest, entries: inputEntries });
  inputManifest.packVersion = "mutated";
  inputEntries[0].size = 999;
  assert.equal(value.schemaVersion, "DATA_PACK_SUBJECT_V1");
  assert.equal(value.manifest.packVersion, "2026.08.0");
  assert.equal(value.entries[0].size, 100);
  assert.match(value.subjectFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(value.provenanceRecords[0].originalValues.energy), true);
});

test("a verified caller assertion makes the exact subject ready without activating it", () => {
  const value = ready();
  assert.equal(value.status, "READY_FOR_ACTIVATION");
  assert.equal(value.activation, "PENDING_APPROVED_STRATEGY");
  assert.equal(value.committed, false);
  assert.equal(value.verificationEvidence.assertionBoundary, "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS");
  assert.deepEqual(value.boundary, BOUNDARY);
});

test("custom pack limits can only tighten approved defaults", () => {
  assert.equal(subject({ limits: { maxEntries: 4 } }).limits.maxEntries, 4);
  assert.throws(() => subject({ limits: { maxEntries: DEFAULT_LIMITS.maxEntries + 1 } }), { code: "INVALID_PACK_LIMITS" });
  assert.throws(() => subject({ limits: { maxEntries: 0 } }), { code: "INVALID_PACK_LIMITS" });
  assert.throws(() => subject({ limits: { maxEntryBytes: 11, maxTotalBytes: 10 } }), { code: "INVALID_PACK_LIMITS" });
  assert.throws(() => subject({ limits: { surprise: 1 } }), { code: "INVALID_PACK_LIMITS" });
});

test("pre-auth parser rejects duplicate keys, invalid budgets, excess keys, arrays, strings, and depth", () => {
  assert.throws(() => parseManifestPreAuth('{"packId":"x","packId":"y"}'), { code: "DUPLICATE_JSON_KEY" });
  assert.throws(() => parseManifestPreAuth('{"a":1,"b":2}', { maxObjectKeys: 1 }), { code: "JSON_OBJECT_KEY_LIMIT" });
  assert.throws(() => parseManifestPreAuth('[1,2]', { maxArrayItems: 1 }), { code: "JSON_ARRAY_ITEM_LIMIT" });
  assert.throws(() => parseManifestPreAuth('{"a":"long"}', { maxStringBytes: 3 }), { code: "JSON_STRING_LIMIT" });
  assert.throws(() => parseManifestPreAuth('{"a":{"b":1}}', { maxJsonDepth: 1 }), { code: "JSON_DEPTH_LIMIT" });
  assert.throws(() => parseManifestPreAuth("{}", { maxObjectKeys: 0 }), { code: "INVALID_JSON_LIMITS" });
  assert.throws(() => parseManifestPreAuth("{}", { maxObjectKeys: 100_000 }), { code: "INVALID_JSON_LIMITS" });
  assert.throws(() => parseManifestPreAuth("{}", { surprise: 1 }), { code: "INVALID_JSON_LIMITS" });
});

test("pre-auth parser rejects oversized, malformed, trailing, non-finite, and non-object JSON", () => {
  assert.throws(() => parseManifestPreAuth(JSON.stringify({ padding: "x".repeat(100) }), { maxManifestBytes: 20 }), { code: "MANIFEST_SIZE_LIMIT" });
  assert.throws(() => parseManifestPreAuth('{"a":1} trailing'), { code: "INVALID_JSON" });
  assert.throws(() => parseManifestPreAuth('{"a":1e999}'), { code: "NON_FINITE_JSON_NUMBER" });
  assert.throws(() => parseManifestPreAuth("[]"), { code: "INVALID_MANIFEST" });
  assert.deepEqual(parseManifestPreAuth('{"a":1}'), { a: 1 });
});

test("normalizes safe NFC paths and rejects traversal, absolute, control, and long paths", () => {
  assert.equal(normalizePackPath("payload/cafe\u0301.json"), "payload/café.json");
  for (const path of ["../secret", "/absolute", "C:/secret", "a\\b", "a/../b", "a//b", "a/\u0000b", ""]) {
    assert.throws(() => normalizePackPath(path), { code: "UNSAFE_PACK_PATH" });
  }
  assert.throws(() => normalizePackPath("x".repeat(20), { maxPathBytes: 10 }), { code: "PACK_PATH_LIMIT" });
});

test("manifest requires every signed role and rejects unknown, duplicate, NFC, and case-colliding paths", () => {
  assert.throws(() => validatePackManifest({ ...manifest, files: manifest.files.slice(1) }), { code: "REQUIRED_PACK_ENTRY_MISSING" });
  assert.throws(() => validatePackManifest({ ...manifest, files: [...manifest.files, { path: "payload/unknown.bin", size: 1, sha256: "f".repeat(64) }] }), { code: "UNKNOWN_PACK_ENTRY" });
  assert.throws(() => validatePackManifest({ ...manifest, files: [...manifest.files, { ...manifest.files[1] }] }), { code: "DUPLICATE_MANIFEST_PATH" });
  assert.throws(() => validatePackManifest({ ...manifest, files: [...manifest.files, { ...manifest.files[1], path: "METADATA/PROVENANCE.NDJSON" }] }), { code: "MANIFEST_PATH_COLLISION" });
  const normalizedDuplicate = { ...manifest, files: [...manifest.files, { ...manifest.files[1], path: "license/cafe\u0301.txt" }] };
  normalizedDuplicate.files[0] = { ...normalizedDuplicate.files[0], path: "license/café.txt" };
  assert.throws(() => validatePackManifest(normalizedDuplicate), { code: "DUPLICATE_MANIFEST_PATH" });
});

test("manifest rejects invalid hashes, unsafe sizes, total bytes, wrong signature marker, and critical fields", () => {
  assert.throws(() => validatePackManifest({ ...manifest, "!algorithm": "none" }), { code: "UNKNOWN_CRITICAL_KEY" });
  assert.throws(() => validatePackManifest({ ...manifest, files: [{ ...manifest.files[0], sha256: "bad" }, ...manifest.files.slice(1)] }), { code: "INVALID_FILE_HASH" });
  assert.throws(() => validatePackManifest({ ...manifest, files: [{ ...manifest.files[0], size: -1 }, ...manifest.files.slice(1)] }), { code: "INVALID_FILE_SIZE" });
  assert.throws(() => validatePackManifest(manifest, { maxEntryBytes: 900, maxTotalBytes: 999 }), { code: "TOTAL_SIZE_LIMIT" });
  assert.throws(() => validatePackManifest(manifest, { maxManifestBytes: 1_000 }), { code: "MANIFEST_SIZE_LIMIT" });
  assert.throws(() => validatePackManifest({ ...manifest, signature: { ...manifest.signature, algorithm: "ed25519" } }), { code: "INVALID_SIGNATURE_METADATA" });
  assert.throws(() => validatePackManifest({ ...manifest, signature: { ...manifest.signature, extra: true } }), { code: "INVALID_SIGNATURE_METADATA" });
});

test("plain object, exact shape, dense array, accessor, symbol, cycle, and metadata budgets fail closed", () => {
  let getterCalls = 0;
  const getterManifest = { ...manifest };
  Object.defineProperty(getterManifest, "packId", { enumerable: true, get() { getterCalls += 1; return "evil"; } });
  assert.throws(() => validatePackManifest(getterManifest), { code: "INVALID_MANIFEST" });
  assert.equal(getterCalls, 0);

  const symbolManifest = { ...manifest, [Symbol("hidden")]: 1 };
  assert.throws(() => validatePackManifest(symbolManifest), { code: "INVALID_MANIFEST" });
  const cyclicManifest = { ...manifest };
  cyclicManifest.extra = cyclicManifest;
  assert.throws(() => validatePackManifest(cyclicManifest), { code: "INVALID_PACK_METADATA" });
  const sparseManifest = { ...manifest, files: Array(manifest.files.length) };
  assert.throws(() => validatePackManifest(sparseManifest), { code: "INVALID_PACK_METADATA" });
  assert.throws(() => validatePackManifest({ ...manifest, source: { ...manifest.source, extra: true } }), { code: "INVALID_SOURCE" });
  assert.throws(() => validatePackManifest(manifest, { maxObjectKeys: 10 }), { code: "PACK_METADATA_RESOURCE_LIMIT" });
});

test("actual entries must be exact regular files and match manifest metadata regardless of order", () => {
  assert.equal(subject({ entries: [...entries].reverse() }).entries.length, entries.length);
  assert.throws(() => subject({ entries: entries.map((entry, index) => index === 0 ? { ...entry, type: "symlink" } : entry) }), { code: "UNSAFE_ENTRY_TYPE" });
  assert.throws(() => subject({ entries: entries.map((entry, index) => index === 0 ? { ...entry, mode: 0o644 } : entry) }), { code: "INVALID_ACTUAL_ENTRY" });
  assert.throws(() => subject({ entries: entries.map((entry, index) => index === 0 ? { ...entry, size: 101 } : entry) }), { code: "MANIFEST_ENTRIES_MISMATCH" });
  assert.throws(() => subject({ entries: [...entries, { ...entries[0] }] }), { code: "DUPLICATE_ENTRY_PATH" });
});

test("provenance keeps missing distinct from zero and uses exact bounded records", () => {
  const fakeZero = structuredClone(provenance);
  fakeZero[0].originalValues.sugar = { value: 0, unit: "g" };
  assert.throws(() => validateProvenanceRecords(fakeZero), { code: "MISSING_NUTRIENT_NOT_NULL" });
  const missingKey = structuredClone(provenance);
  delete missingKey[0].originalValues.fiber;
  assert.throws(() => validateProvenanceRecords(missingKey), { code: "INVALID_ORIGINAL_VALUES" });
  assert.throws(() => validateProvenanceRecords([{ ...provenance[0], extra: true }]), { code: "INVALID_PROVENANCE_RECORD" });
  assert.throws(() => validateProvenanceRecords(Array(1)), { code: "INVALID_PROVENANCE_RECORDS" });
  assert.throws(() => validateProvenanceRecords(provenance, { maxProvenanceRecords: 0 }), { code: "INVALID_PACK_LIMITS" });
  assert.throws(() => validateProvenanceRecords([...provenance, { ...provenance[0] }]), { code: "DUPLICATE_PROVENANCE_RECORD" });
  assert.throws(() => validateProvenanceRecords([...provenance, { ...provenance[0], sourceRecordId: "source-2" }]), { code: "DUPLICATE_PROVENANCE_RECORD" });
});

test("manifest source, provenance source, license, and transform versions must agree", () => {
  assert.throws(() => subject({ provenanceRecords: [{ ...provenance[0], sourceVersion: "other" }] }), { code: "PROVENANCE_SOURCE_MISMATCH" });
  assert.throws(() => subject({ provenanceRecords: [{ ...provenance[0], licenseId: "other" }] }), { code: "PROVENANCE_SOURCE_MISMATCH" });
  assert.throws(() => subject({ transforms: { ...transforms, transformVersion: "other" } }), { code: "TRANSFORM_VERSION_MISMATCH" });
});

test("transforms are exact, bounded, immutable records", () => {
  const normalized = validateTransforms(transforms);
  assert.equal(Object.isFrozen(normalized.steps[0]), true);
  assert.throws(() => validateTransforms({ ...transforms, extra: true }), { code: "INVALID_TRANSFORMS" });
  assert.throws(() => validateTransforms({ ...transforms, steps: [{ ...transforms.steps[0], extra: true }] }), { code: "INVALID_TRANSFORM_STEP" });
  assert.throws(() => validateTransforms({ ...transforms, steps: Array(1) }), { code: "INVALID_TRANSFORMS" });
  assert.throws(() => validateTransforms(transforms, { maxTransformSteps: 0 }), { code: "INVALID_PACK_LIMITS" });
  assert.throws(() => validateTransforms({ ...transforms, steps: [...transforms.steps, { ...transforms.steps[0] }] }), { code: "DUPLICATE_TRANSFORM_STEP" });
});

test("NOTICE is required and bounded as part of the exact subject fingerprint", () => {
  assert.throws(() => subject({ notice: "" }), { code: "NOTICE_REQUIRED" });
  assert.throws(() => subject({ notice: "x".repeat(11), limits: { maxNoticeBytes: 10 } }), { code: "NOTICE_REQUIRED" });
  assert.notEqual(subject().subjectFingerprint, subject({ notice: "Changed attribution" }).subjectFingerprint);
});

test("subject fingerprints change with manifest, entry, provenance, transform, or limits evidence", () => {
  const first = subject();
  assert.notEqual(first.subjectFingerprint, subject({ manifest: { ...manifest, packVersion: "2026.08.1" } }).subjectFingerprint);
  assert.notEqual(first.subjectFingerprint, subject({ provenanceRecords: [{ ...provenance[0], catalogRecordId: "food-2" }] }).subjectFingerprint);
  assert.notEqual(first.subjectFingerprint, subject({ transforms: { ...transforms, steps: [{ ...transforms.steps[0], toolVersion: "fixture-tool-2" }] } }).subjectFingerprint);
  assert.notEqual(first.subjectFingerprint, subject({ limits: { maxEntries: 4 } }).subjectFingerprint);
});

test("caller verification assertions bind the exact subject without claiming verifier truth", () => {
  const packSubject = subject();
  const evidence = verification(packSubject);
  assert.equal(evidence.subjectFingerprint, packSubject.subjectFingerprint);
  assert.equal(evidence.assertionBoundary, "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS");
  assert.equal(evidence.signature.profileId, "pending-D-026");
  assert.match(evidence.verificationFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(evidence.signature), true);
});

test("booleans, incomplete verification, forged evidence, and cross-subject replay fail closed", () => {
  const packSubject = subject();
  assert.equal(validatePackContract({ subject: packSubject, verificationEvidence: verification(packSubject), signatureVerified: true }).error.code, "INVALID_PACK_CONTRACT_REQUEST");
  assert.throws(() => createPackVerificationEvidence({
    schemaVersion: "DATA_PACK_VERIFICATION_INPUT_V1",
    evidenceId: "fixture-verification-1",
    subjectFingerprint: packSubject.subjectFingerprint,
    signature: { status: "FAILED", verifierId: "fixture", profileId: "pending-D-026" },
    integrity: { status: "VERIFIED", verifierId: "fixture", profileId: "sha256" },
  }), { code: "INVALID_PACK_VERIFICATION_EVIDENCE" });
  const evidence = verification(packSubject);
  assert.equal(validatePackContract({ subject: packSubject, verificationEvidence: { ...evidence, verificationFingerprint: "0".repeat(64) } }).error.code, "INVALID_PACK_VERIFICATION_EVIDENCE");
  const other = subject({ manifest: { ...manifest, packVersion: "2026.08.1" } });
  assert.equal(validatePackContract({ subject: other, verificationEvidence: evidence }).error.code, "PACK_VERIFICATION_SUBJECT_MISMATCH");
});

test("tampered normalized subjects and unsupported requests fail closed", () => {
  const packSubject = subject();
  assert.equal(validatePackContract({ subject: { ...packSubject, subjectFingerprint: "0".repeat(64) }, verificationEvidence: verification(packSubject) }).error.code, "INVALID_PACK_SUBJECT");
  assert.equal(validatePackContract({ subject: packSubject }).error.code, "INVALID_PACK_CONTRACT_REQUEST");
  assert.equal(validatePackContract(null).error.code, "INVALID_PACK_CONTRACT_REQUEST");
});

test("GTIN remains an exact string mapping without inferred country, nutrition, or extra fields", () => {
  assert.deepEqual(validateBarcodeMapping({ gtin: "00123456789012", catalogRecordId: "food-1" }), { gtin: "00123456789012", catalogRecordId: "food-1" });
  assert.throws(() => validateBarcodeMapping({ gtin: 123456789012, catalogRecordId: "food-1" }), { code: "INVALID_GTIN" });
  assert.throws(() => validateBarcodeMapping({ gtin: "00123456789012", catalogRecordId: "food-1", country: "TW" }), { code: "BARCODE_INFERENCE_FORBIDDEN" });
  assert.throws(() => validateBarcodeMapping({ gtin: "00123456789012", catalogRecordId: "food-1", brand: "fixture" }), { code: "INVALID_BARCODE_MAPPING" });
});

test("the harness performs no filesystem, network, native, clock, cryptographic verification, or activation writes", async () => {
  const source = await readFile(new URL("./data-pack-contract-harness.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /node:fs|\b(?:fetch|XMLHttpRequest|WebSocket)\b|node:https|node:http/);
  assert.doesNotMatch(source, /\b(?:Date\.now|new Date\(\)|performance\.now|setTimeout|setInterval)\b/);
  assert.doesNotMatch(source, /\b(?:writeFile|appendFile|rename|unlink|rm|SQLite|Keychain|DocumentPicker)\b/);
  assert.deepEqual(BOUNDARY, {
    contractStatus: "SPIKE_FRAMEWORK_AGNOSTIC_NON_PRODUCTION",
    verificationTruth: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
    signatureProfile: "PENDING_D026",
    activationStrategy: "PENDING_APPROVED_STRATEGY",
    committed: false,
    filesystemReads: 0,
    filesystemWrites: 0,
    realNetworkRequests: 0,
    nativeApiCalls: 0,
    systemClockRead: false,
  });
});
