import assert from "node:assert/strict";
import test from "node:test";
import {
  NUTRIENTS,
  normalizePackPath,
  parseManifestPreAuth,
  validateBarcodeMapping,
  validatePackContract,
  validatePackManifest,
  validateProvenanceRecords,
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
    rawArtifactSha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    licenseId: "synthetic-license",
    attribution: "Synthetic fixture only",
  },
  transformVersion: "fixture-transform-1",
  recordProvenanceVersion: 1,
  nutrients: [...NUTRIENTS],
  files: [
    { path: "payload/catalog.sqlite", size: 100, sha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    { path: "metadata/provenance.ndjson", size: 200, sha256: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" },
    { path: "metadata/transforms.json", size: 300, sha256: "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd" },
    { path: "license/NOTICE.txt", size: 400, sha256: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" },
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

test("accepts the synthetic pack contract without activating it", () => {
  const result = validatePackContract({ manifest, entries, provenanceRecords: provenance, transforms, notice: "Synthetic attribution", signatureVerified: true, integrityVerified: true });
  assert.equal(result.status, "READY_FOR_ACTIVATION");
  assert.equal(result.activation, "PENDING_APPROVED_STRATEGY");
  assert.equal(result.committed, false);
});

test("requires all signed entry roles and rejects extra or missing entries", () => {
  assert.throws(() => validatePackManifest({ ...manifest, files: manifest.files.slice(1) }), { code: "REQUIRED_PACK_ENTRY_MISSING" });
  assert.throws(() => validatePackManifest({ ...manifest, files: [...manifest.files, { path: "payload/unknown.bin", size: 1, sha256: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" }] }), { code: "UNKNOWN_PACK_ENTRY" });
  const extra = validatePackContract({ manifest, entries: [...entries, { path: "payload/extra.bin", size: 1, sha256: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", type: "file" }], provenanceRecords: provenance, transforms, notice: "Synthetic", signatureVerified: true, integrityVerified: true });
  assert.equal(extra.error.code, "MANIFEST_ENTRIES_MISMATCH");
});

test("rejects critical keys, duplicate keys, path collisions and invalid hashes", () => {
  assert.throws(() => validatePackManifest({ ...manifest, "!algorithm": "none" }), { code: "UNKNOWN_CRITICAL_KEY" });
  assert.throws(() => parseManifestPreAuth('{"packId":"x","packId":"y"}'), { code: "DUPLICATE_JSON_KEY" });
  assert.equal(normalizePackPath("payload/cafe\u0301.json"), "payload/café.json");
  assert.throws(() => validatePackManifest({ ...manifest, files: [...manifest.files, { ...manifest.files[1], path: "METADATA/PROVENANCE.NDJSON" }] }), { code: "MANIFEST_PATH_COLLISION" });
  assert.throws(() => validatePackManifest({ ...manifest, files: [{ ...manifest.files[0], sha256: "bad" }, ...manifest.files.slice(1)] }), { code: "INVALID_FILE_HASH" });
  assert.throws(() => validatePackManifest({ ...manifest, files: [{ ...manifest.files[0], size: -1 }, ...manifest.files.slice(1)] }), { code: "INVALID_FILE_SIZE" });
  const deep = [...Array(20)].reduceRight((value) => ({ a: value }), 0);
  assert.throws(() => parseManifestPreAuth(JSON.stringify(deep), { maxJsonDepth: 5 }), { code: "JSON_DEPTH_LIMIT" });
});

test("keeps provenance missing distinct from numeric zero", () => {
  const fakeZero = structuredClone(provenance);
  fakeZero[0].originalValues.sugar = { value: 0, unit: "g" };
  assert.throws(() => validateProvenanceRecords(fakeZero), { code: "MISSING_NUTRIENT_NOT_NULL" });
  const missingKey = structuredClone(provenance);
  delete missingKey[0].originalValues.fiber;
  assert.throws(() => validateProvenanceRecords(missingKey), { code: "ORIGINAL_NUTRIENT_MISSING" });
});

test("keeps GTIN as a string mapping without inferring country or nutrition", () => {
  assert.deepEqual(validateBarcodeMapping({ gtin: "00123456789012", catalogRecordId: "food-1" }), { gtin: "00123456789012", catalogRecordId: "food-1" });
  assert.throws(() => validateBarcodeMapping({ gtin: 123456789012, catalogRecordId: "food-1" }), { code: "INVALID_GTIN" });
  assert.throws(() => validateBarcodeMapping({ gtin: "00123456789012", catalogRecordId: "food-1", country: "TW" }), { code: "BARCODE_INFERENCE_FORBIDDEN" });
});

test("fails closed for missing NOTICE, provenance, signature and integrity", () => {
  const noNotice = validatePackContract({ manifest, entries, provenanceRecords: provenance, transforms, notice: "", signatureVerified: true, integrityVerified: true });
  assert.equal(noNotice.error.code, "NOTICE_REQUIRED");
  const noProvenance = validatePackContract({ manifest, entries, provenanceRecords: [], transforms, notice: "Synthetic", signatureVerified: true, integrityVerified: true });
  assert.equal(noProvenance.error.code, "INVALID_PROVENANCE_RECORDS");
  const noSignature = validatePackContract({ manifest, entries, provenanceRecords: provenance, transforms, notice: "Synthetic", integrityVerified: true });
  assert.equal(noSignature.error.code, "SIGNATURE_REQUIRED");
  const noIntegrity = validatePackContract({ manifest, entries, provenanceRecords: provenance, transforms, notice: "Synthetic", signatureVerified: true });
  assert.equal(noIntegrity.error.code, "INTEGRITY_REQUIRED");
});

test("pre-auth parser rejects oversized manifests before full validation", () => {
  assert.throws(() => parseManifestPreAuth(JSON.stringify({ padding: "x".repeat(100) }), { maxManifestBytes: 20 }), { code: "MANIFEST_SIZE_LIMIT" });
});
