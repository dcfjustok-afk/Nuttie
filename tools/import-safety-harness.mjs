import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;

const DEFAULT_LIMITS = Object.freeze({
  maxEntries: 1_000,
  maxEntryBytes: 20 * 1024 * 1024,
  maxTotalBytes: 200 * 1024 * 1024,
  maxManifestBytes: 512 * 1024,
  maxPathBytes: 1_024,
  maxStringBytes: 64 * 1024,
  maxDepth: 16,
  maxJsonItems: 10_000,
  maxObjectKeys: 256,
});

const BOUNDARY = Object.freeze({
  contractStatus: "SPIKE_FRAMEWORK_AGNOSTIC_NON_PRODUCTION",
  verificationTruth: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  activationStrategy: "PENDING_D026_D027_D030",
  filesystemReads: 0,
  filesystemWrites: 0,
  realNetworkRequests: 0,
  nativeApiCalls: 0,
  committed: false,
});

function reject(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) reject(`${field} must be a plain record`, code, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) reject(`${field} must be a plain record`, code, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) reject(`${field} contains symbol properties`, code, { field });
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!descriptor.enumerable || descriptor.get || descriptor.set) reject(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
  }
}

function assertDenseArray(value, field, code) {
  if (!Array.isArray(value)) reject(`${field} must be an array`, code, { field });
  if (Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length > 0) reject(`${field} is not a plain array`, code, { field });
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (key !== "length" && (!descriptor.enumerable || descriptor.get || descriptor.set)) reject(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
  }
  const keys = Object.keys(value);
  if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) reject(`${field} must be dense and contain no extra properties`, code, { field });
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) reject(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  }
  for (const key of required) if (!Object.hasOwn(value, key)) reject(`${field}.${key} is required`, code, { field: `${field}.${key}` });
}

function clone(value, seen = new Map()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const result = Array.isArray(value) ? [] : {};
  seen.set(value, result);
  for (const [key, child] of Object.entries(value)) result[key] = clone(child, seen);
  return result;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(clone(value));
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function identifier(value, field, code) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) reject(`${field} is invalid`, code, { field });
  return value;
}

function normalizeLimits(input = {}) {
  assertPlainRecord(input, "limits", "INVALID_IMPORT_LIMITS");
  const keys = Object.keys(DEFAULT_LIMITS);
  for (const key of Object.keys(input)) if (!keys.includes(key)) reject("limits contain an unsupported field", "INVALID_IMPORT_LIMITS", { field: `limits.${key}` });
  const result = { ...DEFAULT_LIMITS };
  for (const key of keys) {
    if (!Object.hasOwn(input, key)) continue;
    const value = input[key];
    if (!Number.isSafeInteger(value) || value < 1 || value > DEFAULT_LIMITS[key]) reject("import limits may only tighten the approved defaults", "INVALID_IMPORT_LIMITS", { field: `limits.${key}` });
    result[key] = value;
  }
  if (result.maxEntryBytes > result.maxTotalBytes) reject("maxEntryBytes cannot exceed maxTotalBytes", "INVALID_IMPORT_LIMITS", { field: "limits.maxEntryBytes" });
  return immutable(result);
}

function validateBoundedJson(value, limits, field, depth = 0, budget = { items: 0 }, ancestors = new Set()) {
  if (depth > limits.maxDepth || ++budget.items > limits.maxJsonItems) reject(`${field} exceeds its resource budget`, "IMPORT_METADATA_RESOURCE_LIMIT", { field });
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (Buffer.byteLength(value, "utf8") > limits.maxStringBytes) reject(`${field} exceeds its string budget`, "IMPORT_METADATA_RESOURCE_LIMIT", { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) reject(`${field} contains a non-finite number`, "INVALID_IMPORT_METADATA", { field });
    return;
  }
  if (typeof value !== "object" || ancestors.has(value)) reject(`${field} is not safe JSON`, "INVALID_IMPORT_METADATA", { field });
  ancestors.add(value);
  if (Array.isArray(value)) {
    assertDenseArray(value, field, "INVALID_IMPORT_METADATA");
    value.forEach((child, index) => validateBoundedJson(child, limits, `${field}[${index}]`, depth + 1, budget, ancestors));
  } else {
    assertPlainRecord(value, field, "INVALID_IMPORT_METADATA");
    if (Object.keys(value).length > limits.maxObjectKeys) reject(`${field} has too many keys`, "IMPORT_METADATA_RESOURCE_LIMIT", { field });
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) reject(`${field} contains an unsafe key`, "INVALID_IMPORT_METADATA", { field: `${field}.${key}` });
      validateBoundedJson(child, limits, `${field}.${key}`, depth + 1, budget, ancestors);
    }
  }
  ancestors.delete(value);
}

function normalizeEntryPathWithLimits(value, limits) {
  if (typeof value !== "string") reject("entry path is required", "INVALID_ENTRY_PATH");
  const normalized = value.normalize("NFC");
  if (Buffer.byteLength(normalized, "utf8") > limits.maxPathBytes) reject("entry path exceeds its byte budget", "ENTRY_PATH_LIMIT");
  if (normalized.length === 0 || /[\u0000-\u001f\u007f]/.test(normalized)) reject("entry path must not be empty or contain control characters", "UNSAFE_ENTRY_PATH");
  if (normalized.includes("\\") || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) reject("entry path must be a relative POSIX path", "UNSAFE_ENTRY_PATH");
  const segments = normalized.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) reject("entry path contains unsafe segments", "UNSAFE_ENTRY_PATH");
  return segments.join("/");
}

function normalizeEntryPath(value, limits = {}) {
  return normalizeEntryPathWithLimits(value, normalizeLimits(limits));
}

function assertUniquePaths(paths, duplicateCode, collisionCode) {
  const exact = new Set();
  const folded = new Set();
  for (const path of paths) {
    const collisionKey = path.toLocaleLowerCase("en-US");
    if (exact.has(path)) reject("duplicate normalized import path", duplicateCode, { path });
    if (folded.has(collisionKey)) reject("case-insensitive import path collision", collisionCode, { path });
    exact.add(path);
    folded.add(collisionKey);
  }
}

function validateManifest(manifest, limitsInput = {}) {
  const limits = normalizeLimits(limitsInput);
  assertPlainRecord(manifest, "manifest", "INVALID_MANIFEST");
  validateBoundedJson(manifest, limits, "manifest");
  for (const key of Object.keys(manifest)) if (key.startsWith("!")) reject(`unknown critical manifest key: ${key}`, "UNKNOWN_CRITICAL_KEY", { key });
  if (!Number.isSafeInteger(manifest.schemaVersion) || manifest.schemaVersion < 1) reject("manifest schemaVersion is invalid", "INVALID_MANIFEST_VERSION");
  if (typeof manifest.packVersion !== "string" || manifest.packVersion.length === 0) reject("manifest packVersion is required", "MISSING_PACK_VERSION");
  assertDenseArray(manifest.files, "manifest.files", "INVALID_MANIFEST_FILES");
  if (manifest.files.length === 0 || manifest.files.length > limits.maxEntries) reject("manifest files are invalid", "INVALID_MANIFEST_FILES");
  const files = manifest.files.map((path) => normalizeEntryPathWithLimits(path, limits));
  assertUniquePaths(files, "DUPLICATE_MANIFEST_FILE", "MANIFEST_PATH_COLLISION");
  const normalized = immutable({ ...manifest, files });
  if (Buffer.byteLength(canonicalStringify(normalized), "utf8") > limits.maxManifestBytes) reject("manifest exceeds its byte budget", "MANIFEST_SIZE_LIMIT");
  return normalized;
}

function validateEntries(entries, limitsInput = {}) {
  const limits = normalizeLimits(limitsInput);
  assertDenseArray(entries, "entries", "INVALID_ENTRIES");
  if (entries.length > limits.maxEntries) reject("entry count exceeds limit", "ENTRY_COUNT_LIMIT");
  let totalBytes = 0;
  const validated = entries.map((entry, index) => {
    const field = `entries[${index}]`;
    assertExactKeys(entry, ["path", "size", "type"], [], field, "INVALID_ENTRY");
    const path = normalizeEntryPathWithLimits(entry.path, limits);
    if (!Number.isSafeInteger(entry.size) || entry.size < 0) reject("entry size is invalid", "INVALID_ENTRY_SIZE", { path });
    if (entry.size > limits.maxEntryBytes) reject("entry exceeds size limit", "ENTRY_SIZE_LIMIT", { path });
    if (entry.type !== "file") reject("entry type is not allowed", "UNSAFE_ENTRY_TYPE", { path });
    totalBytes += entry.size;
    if (!Number.isSafeInteger(totalBytes) || totalBytes > limits.maxTotalBytes) reject("total entry size exceeds limit", "TOTAL_SIZE_LIMIT");
    return { path, size: entry.size, type: entry.type };
  });
  assertUniquePaths(validated.map(({ path }) => path), "DUPLICATE_ENTRY_PATH", "ENTRY_PATH_COLLISION");
  return immutable({ schemaVersion: "IMPORT_ENTRY_SET_V1", entries: validated, totalBytes });
}

function normalizeValidatedEntries(input, limits) {
  assertExactKeys(input, ["schemaVersion", "entries", "totalBytes"], [], "validatedEntries", "INVALID_VALIDATED_ENTRIES");
  if (input.schemaVersion !== "IMPORT_ENTRY_SET_V1") reject("validatedEntries schema is unsupported", "INVALID_VALIDATED_ENTRIES");
  const expected = validateEntries(input.entries, limits);
  if (!isDeepStrictEqual(input, expected)) reject("validatedEntries derived evidence is invalid", "INVALID_VALIDATED_ENTRIES");
  return expected;
}

function assertManifestEntriesMatch(manifestInput, validatedInput, limitsInput = {}) {
  const limits = normalizeLimits(limitsInput);
  const manifest = validateManifest(manifestInput, limits);
  const validated = normalizeValidatedEntries(validatedInput, limits);
  const expected = [...manifest.files].sort();
  const actual = validated.entries.map(({ path }) => path).sort();
  if (expected.length !== actual.length || expected.some((path, index) => path !== actual[index])) reject("manifest files must exactly match entry paths", "MANIFEST_ENTRIES_MISMATCH");
  return true;
}

function createImportSubject(input) {
  assertExactKeys(input, ["schemaVersion", "manifest", "entries"], ["limits"], "subjectInput", "INVALID_IMPORT_SUBJECT_INPUT");
  if (input.schemaVersion !== "IMPORT_SUBJECT_INPUT_V1") reject("subject input schema is unsupported", "INVALID_IMPORT_SUBJECT_INPUT");
  const limits = normalizeLimits(input.limits ?? {});
  const manifest = validateManifest(input.manifest, limits);
  const validatedEntries = validateEntries(input.entries, limits);
  assertManifestEntriesMatch(manifest, validatedEntries, limits);
  const core = immutable({ schemaVersion: "IMPORT_SUBJECT_V1", limits, manifest, validatedEntries });
  return immutable({ ...core, subjectFingerprint: fingerprint(core) });
}

function normalizeImportSubject(input) {
  assertExactKeys(input, ["schemaVersion", "limits", "manifest", "validatedEntries", "subjectFingerprint"], [], "subject", "INVALID_IMPORT_SUBJECT");
  if (input.schemaVersion !== "IMPORT_SUBJECT_V1" || !SHA256.test(input.subjectFingerprint)) reject("subject is invalid", "INVALID_IMPORT_SUBJECT");
  const expected = createImportSubject({
    schemaVersion: "IMPORT_SUBJECT_INPUT_V1",
    limits: input.limits,
    manifest: input.manifest,
    entries: input.validatedEntries.entries,
  });
  if (!isDeepStrictEqual(input, expected)) reject("subject fingerprint or derived evidence is invalid", "INVALID_IMPORT_SUBJECT");
  return expected;
}

function createImportVerificationEvidence(input) {
  assertExactKeys(input, ["schemaVersion", "evidenceId", "subjectFingerprint", "signature", "integrity"], [], "verificationInput", "INVALID_IMPORT_VERIFICATION_EVIDENCE");
  if (input.schemaVersion !== "IMPORT_VERIFICATION_INPUT_V1" || !SHA256.test(input.subjectFingerprint)) reject("verification input is invalid", "INVALID_IMPORT_VERIFICATION_EVIDENCE");
  const normalizeResult = (result, field) => {
    assertExactKeys(result, ["status", "verifierId", "profileId"], [], field, "INVALID_IMPORT_VERIFICATION_EVIDENCE");
    if (result.status !== "VERIFIED") reject(`${field} must be VERIFIED`, "INVALID_IMPORT_VERIFICATION_EVIDENCE", { field: `${field}.status` });
    return {
      status: result.status,
      verifierId: identifier(result.verifierId, `${field}.verifierId`, "INVALID_IMPORT_VERIFICATION_EVIDENCE"),
      profileId: identifier(result.profileId, `${field}.profileId`, "INVALID_IMPORT_VERIFICATION_EVIDENCE"),
    };
  };
  const core = immutable({
    schemaVersion: "IMPORT_VERIFICATION_EVIDENCE_V1",
    evidenceId: identifier(input.evidenceId, "verificationInput.evidenceId", "INVALID_IMPORT_VERIFICATION_EVIDENCE"),
    subjectFingerprint: input.subjectFingerprint,
    signature: normalizeResult(input.signature, "verificationInput.signature"),
    integrity: normalizeResult(input.integrity, "verificationInput.integrity"),
    assertionBoundary: BOUNDARY.verificationTruth,
  });
  return immutable({ ...core, verificationFingerprint: fingerprint(core) });
}

function normalizeVerificationEvidence(input, expectedSubjectFingerprint) {
  assertExactKeys(input, ["schemaVersion", "evidenceId", "subjectFingerprint", "signature", "integrity", "assertionBoundary", "verificationFingerprint"], [], "verificationEvidence", "INVALID_IMPORT_VERIFICATION_EVIDENCE");
  if (input.schemaVersion !== "IMPORT_VERIFICATION_EVIDENCE_V1" || !SHA256.test(input.verificationFingerprint) || input.assertionBoundary !== BOUNDARY.verificationTruth) reject("verification evidence is invalid", "INVALID_IMPORT_VERIFICATION_EVIDENCE");
  const expected = createImportVerificationEvidence({
    schemaVersion: "IMPORT_VERIFICATION_INPUT_V1",
    evidenceId: input.evidenceId,
    subjectFingerprint: input.subjectFingerprint,
    signature: input.signature,
    integrity: input.integrity,
  });
  if (!isDeepStrictEqual(input, expected)) reject("verification evidence fingerprint is invalid", "INVALID_IMPORT_VERIFICATION_EVIDENCE");
  if (input.subjectFingerprint !== expectedSubjectFingerprint) reject("verification evidence targets another import subject", "IMPORT_VERIFICATION_SUBJECT_MISMATCH");
  return expected;
}

function normalizeCurrentState(input) {
  assertExactKeys(input, ["activeEntries"], [], "currentState", "INVALID_STATE");
  const validated = validateEntries(input.activeEntries);
  return immutable({ activeEntries: validated.entries });
}

function prepareImport(input) {
  assertExactKeys(input, ["currentState", "subject", "verificationEvidence"], [], "prepare", "INVALID_IMPORT_PREPARE_REQUEST");
  const state = normalizeCurrentState(input.currentState);
  try {
    const subject = normalizeImportSubject(input.subject);
    const verificationEvidence = normalizeVerificationEvidence(input.verificationEvidence, subject.subjectFingerprint);
    const core = immutable({
      schemaVersion: "PREPARED_IMPORT_V1",
      status: "READY_FOR_ACTIVATION",
      committed: false,
      state,
      activeStateFingerprint: fingerprint(state),
      subject,
      verificationEvidence,
      boundary: BOUNDARY,
    });
    return immutable({ ...core, preparedFingerprint: fingerprint(core) });
  } catch (error) {
    return immutable({
      schemaVersion: "PREPARED_IMPORT_REJECTION_V1",
      status: "REJECTED",
      committed: false,
      state,
      subject: null,
      verificationEvidence: null,
      error: { code: error.code ?? "IMPORT_REJECTED", message: error.message },
      boundary: BOUNDARY,
    });
  }
}

function normalizePreparedImport(input) {
  assertExactKeys(input, ["schemaVersion", "status", "committed", "state", "activeStateFingerprint", "subject", "verificationEvidence", "boundary", "preparedFingerprint"], [], "prepared", "INVALID_PREPARED_IMPORT");
  if (input.schemaVersion !== "PREPARED_IMPORT_V1" || input.status !== "READY_FOR_ACTIVATION" || input.committed !== false || !SHA256.test(input.activeStateFingerprint) || !SHA256.test(input.preparedFingerprint) || !isDeepStrictEqual(input.boundary, BOUNDARY)) reject("prepared import is invalid", "INVALID_PREPARED_IMPORT");
  const state = normalizeCurrentState(input.state);
  const subject = normalizeImportSubject(input.subject);
  const verificationEvidence = normalizeVerificationEvidence(input.verificationEvidence, subject.subjectFingerprint);
  if (input.activeStateFingerprint !== fingerprint(state)) reject("prepared import targets another active state", "INVALID_PREPARED_IMPORT");
  const { preparedFingerprint: ignored, ...core } = input;
  if (input.preparedFingerprint !== fingerprint(core)) reject("prepared import fingerprint is invalid", "INVALID_PREPARED_IMPORT");
  return immutable({ ...input, state, subject, verificationEvidence });
}

function activateImport(preparedInput, currentStateInput) {
  const state = normalizeCurrentState(currentStateInput);
  let prepared;
  try {
    prepared = normalizePreparedImport(preparedInput);
  } catch {
    return immutable({ committed: false, state, error: { code: "IMPORT_NOT_READY" }, boundary: BOUNDARY });
  }
  if (prepared.activeStateFingerprint !== fingerprint(state)) return immutable({ committed: false, state, error: { code: "ACTIVE_IMPORT_STATE_CHANGED" }, boundary: BOUNDARY });
  return immutable({
    committed: false,
    state,
    error: {
      code: "ACTIVATION_STRATEGY_PENDING",
      message: "activation remains pending approved data-pack, backup, and restore decisions",
    },
    boundary: BOUNDARY,
  });
}

export {
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
};
