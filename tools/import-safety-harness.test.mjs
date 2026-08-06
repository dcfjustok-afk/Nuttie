import assert from "node:assert/strict";
import test from "node:test";
import { activateImport, normalizeEntryPath, prepareImport, validateEntries, validateManifest } from "./import-safety-harness.mjs";

const manifest = { schemaVersion: 1, packVersion: "food-1", files: ["catalog.json"] };
const state = { activeEntries: [{ path: "old/catalog.json", size: 10, type: "file" }] };

test("normalizes safe relative paths and rejects traversal or absolute paths", () => {
  assert.equal(normalizeEntryPath("catalog/data.json"), "catalog/data.json");
  for (const path of ["../secret", "/absolute", "C:/secret", "catalog\\data", "catalog/../secret"]) {
    assert.throws(() => normalizeEntryPath(path), { code: "UNSAFE_ENTRY_PATH" });
  }
});

test("rejects duplicate paths, special entries, and resource limits", () => {
  assert.throws(() => validateEntries([
    { path: "a", size: 1, type: "file" },
    { path: "a", size: 1, type: "file" },
  ]), { code: "DUPLICATE_ENTRY_PATH" });
  assert.throws(() => validateEntries([{ path: "link", size: 1, type: "symlink" }]), { code: "UNSAFE_ENTRY_TYPE" });
  assert.throws(() => validateEntries([{ path: "large", size: 11, type: "file" }], { maxEntries: 2, maxEntryBytes: 10, maxTotalBytes: 20 }), { code: "ENTRY_SIZE_LIMIT" });
  assert.throws(() => validateEntries([{ path: "a", size: 8, type: "file" }, { path: "b", size: 8, type: "file" }], { maxEntries: 2, maxEntryBytes: 10, maxTotalBytes: 15 }), { code: "TOTAL_SIZE_LIMIT" });
});

test("rejects unknown critical manifest keys before activation", () => {
  assert.throws(() => validateManifest({ ...manifest, "!algorithm": "none" }), { code: "UNKNOWN_CRITICAL_KEY" });
});

test("authentication and integrity remain explicit gates", () => {
  const missingSignature = prepareImport({ currentState: state, manifest, entries: [{ path: "catalog.json", size: 10, type: "file" }], integrityVerified: true });
  assert.equal(missingSignature.status, "REJECTED");
  assert.equal(missingSignature.error.code, "SIGNATURE_REQUIRED");
  assert.deepEqual(missingSignature.state, state);
  const missingIntegrity = prepareImport({ currentState: state, manifest, entries: [{ path: "catalog.json", size: 10, type: "file" }], signatureVerified: true });
  assert.equal(missingIntegrity.error.code, "INTEGRITY_REQUIRED");
});

test("even fully checked imports do not activate before approved strategy", () => {
  const prepared = prepareImport({ currentState: state, manifest, entries: [{ path: "catalog.json", size: 10, type: "file" }], signatureVerified: true, integrityVerified: true });
  assert.equal(prepared.status, "READY_FOR_ACTIVATION");
  const result = activateImport(prepared, state);
  assert.equal(result.committed, false);
  assert.equal(result.error.code, "ACTIVATION_STRATEGY_PENDING");
  assert.deepEqual(result.state, state);
});
