const DEFAULT_LIMITS = Object.freeze({
  maxEntries: 1000,
  maxEntryBytes: 20 * 1024 * 1024,
  maxTotalBytes: 200 * 1024 * 1024,
});

function reject(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code }, details);
  throw error;
}

function cloneState(state) {
  if (!state || typeof state !== "object" || !Array.isArray(state.activeEntries)) {
    reject("state must contain activeEntries", "INVALID_STATE");
  }
  return { activeEntries: state.activeEntries.map((entry) => ({ ...entry })) };
}

function normalizeEntryPath(value) {
  if (typeof value !== "string" || value.length === 0) reject("entry path is required", "INVALID_ENTRY_PATH");
  if (value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value) || value.includes("\0")) {
    reject("entry path must be a relative POSIX path", "UNSAFE_ENTRY_PATH");
  }
  const segments = value.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    reject("entry path contains unsafe segments", "UNSAFE_ENTRY_PATH");
  }
  return segments.join("/");
}

function validateManifest(manifest, allowedKeys = ["schemaVersion", "packVersion", "files", "source", "license"]) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) reject("manifest must be an object", "INVALID_MANIFEST");
  for (const key of Object.keys(manifest)) {
    if (!allowedKeys.includes(key) && key.startsWith("!")) reject(`unknown critical manifest key: ${key}`, "UNKNOWN_CRITICAL_KEY", { key });
  }
  if (typeof manifest.schemaVersion !== "number" || !Number.isInteger(manifest.schemaVersion) || manifest.schemaVersion < 1) {
    reject("manifest schemaVersion is invalid", "INVALID_MANIFEST_VERSION");
  }
  if (typeof manifest.packVersion !== "string" || manifest.packVersion.length === 0) reject("manifest packVersion is required", "MISSING_PACK_VERSION");
  if (!Array.isArray(manifest.files)) reject("manifest files must be an array", "INVALID_MANIFEST_FILES");
  return true;
}

function validateEntries(entries, limits = DEFAULT_LIMITS) {
  if (!Array.isArray(entries)) reject("entries must be an array", "INVALID_ENTRIES");
  if (entries.length > limits.maxEntries) reject("entry count exceeds limit", "ENTRY_COUNT_LIMIT");
  const seen = new Set();
  let totalBytes = 0;
  const validated = entries.map((entry) => {
    if (!entry || typeof entry !== "object") reject("entry must be an object", "INVALID_ENTRY");
    const path = normalizeEntryPath(entry.path);
    if (seen.has(path)) reject("duplicate normalized entry path", "DUPLICATE_ENTRY_PATH", { path });
    seen.add(path);
    if (!Number.isInteger(entry.size) || entry.size < 0) reject("entry size is invalid", "INVALID_ENTRY_SIZE", { path });
    if (entry.size > limits.maxEntryBytes) reject("entry exceeds size limit", "ENTRY_SIZE_LIMIT", { path });
    if (!["file"].includes(entry.type)) reject("entry type is not allowed", "UNSAFE_ENTRY_TYPE", { path });
    totalBytes += entry.size;
    if (totalBytes > limits.maxTotalBytes) reject("total entry size exceeds limit", "TOTAL_SIZE_LIMIT");
    return Object.freeze({ path, size: entry.size, type: entry.type });
  });
  return Object.freeze({ entries: Object.freeze(validated), totalBytes });
}

function prepareImport({ currentState, manifest, entries, signatureVerified = false, integrityVerified = false, limits }) {
  const before = cloneState(currentState);
  try {
    validateManifest(manifest);
    const validated = validateEntries(entries, limits);
    if (!signatureVerified) reject("signature verification is required", "SIGNATURE_REQUIRED");
    if (!integrityVerified) reject("integrity verification is required", "INTEGRITY_REQUIRED");
    return Object.freeze({ status: "READY_FOR_ACTIVATION", committed: false, state: before, validated, error: null });
  } catch (error) {
    return Object.freeze({ status: "REJECTED", committed: false, state: before, validated: null, error: { code: error.code ?? "IMPORT_REJECTED", message: error.message } });
  }
}

function activateImport(prepared, currentState) {
  const before = cloneState(currentState);
  if (!prepared || prepared.status !== "READY_FOR_ACTIVATION") {
    return Object.freeze({ committed: false, state: before, error: { code: "IMPORT_NOT_READY" } });
  }
  return Object.freeze({ committed: false, state: before, error: { code: "ACTIVATION_STRATEGY_PENDING", message: "activation strategy is pending approved data-pack/backup decisions" } });
}

export { DEFAULT_LIMITS, activateImport, normalizeEntryPath, prepareImport, validateEntries, validateManifest };
