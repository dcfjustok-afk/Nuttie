import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const NUTRIENTS = Object.freeze([
  "energy",
  "protein",
  "carbohydrate",
  "fat",
  "fiber",
  "sugar",
  "sodium",
]);

const REQUIRED_FILES = Object.freeze([
  "payload/catalog.sqlite",
  "metadata/provenance.ndjson",
  "metadata/transforms.json",
  "license/NOTICE.txt",
]);

const OPTIONAL_FILES = Object.freeze([
  "license/LICENSE.txt",
  "payload/aliases.ndjson",
]);

const DEFAULT_LIMITS = Object.freeze({
  maxManifestBytes: 64 * 1024,
  maxJsonDepth: 12,
  maxObjectKeys: 128,
  maxArrayItems: 2_048,
  maxStringBytes: 64 * 1024,
  maxPathBytes: 1_024,
  maxEntries: 128,
  maxEntryBytes: 200 * 1024 * 1024,
  maxTotalBytes: 400 * 1024 * 1024,
  maxNoticeBytes: 100_000,
  maxProvenanceRecords: 100_000,
  maxTransformSteps: 256,
});

const PARSER_HARD_LIMITS = Object.freeze({
  maxManifestBytes: DEFAULT_LIMITS.maxManifestBytes,
  maxJsonDepth: 32,
  maxObjectKeys: 10_000,
  maxArrayItems: 10_000,
  maxStringBytes: DEFAULT_LIMITS.maxStringBytes,
});

const BOUNDARY = Object.freeze({
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

const SHA256_RE = /^[a-f0-9]{64}$/;
const SAFE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const UNIT_BY_NUTRIENT = Object.freeze({
  energy: new Set(["kcal", "kJ"]),
  protein: new Set(["g"]),
  carbohydrate: new Set(["g"]),
  fat: new Set(["g"]),
  fiber: new Set(["g"]),
  sugar: new Set(["g"]),
  sodium: new Set(["mg"]),
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
  if (Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length > 0) reject(`${field} must be a plain array`, code, { field });
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
  for (const key of Object.keys(value)) if (!allowed.has(key)) reject(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  for (const key of required) if (!Object.hasOwn(value, key)) reject(`${field}.${key} is required`, code, { field: `${field}.${key}` });
}

function clone(value, seen = new Map()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const output = Array.isArray(value) ? [] : {};
  seen.set(value, output);
  for (const [key, child] of Object.entries(value)) output[key] = clone(child, seen);
  return output;
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

function assertNonEmptyString(value, field, code, maxBytes = 256) {
  if (typeof value !== "string" || value.trim().length === 0 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value) || Buffer.byteLength(value, "utf8") > maxBytes) {
    reject(`${field} is invalid`, code, { field });
  }
  return value;
}

function assertSafeId(value, field, code) {
  if (typeof value !== "string" || !SAFE_ID_RE.test(value)) reject(`${field} is invalid`, code, { field });
  return value;
}

function normalizeLimits(input = {}) {
  assertPlainRecord(input, "limits", "INVALID_PACK_LIMITS");
  const keys = Object.keys(DEFAULT_LIMITS);
  for (const key of Object.keys(input)) if (!keys.includes(key)) reject("limits contain an unsupported field", "INVALID_PACK_LIMITS", { field: `limits.${key}` });
  const limits = { ...DEFAULT_LIMITS };
  for (const key of keys) {
    if (!Object.hasOwn(input, key)) continue;
    if (!Number.isSafeInteger(input[key]) || input[key] < 1 || input[key] > DEFAULT_LIMITS[key]) reject("pack limits may only tighten approved harness defaults", "INVALID_PACK_LIMITS", { field: `limits.${key}` });
    limits[key] = input[key];
  }
  if (limits.maxEntryBytes > limits.maxTotalBytes) reject("maxEntryBytes cannot exceed maxTotalBytes", "INVALID_PACK_LIMITS", { field: "limits.maxEntryBytes" });
  return immutable(limits);
}

function normalizeParserLimits(input = {}) {
  assertPlainRecord(input, "parserLimits", "INVALID_JSON_LIMITS");
  const defaults = {
    maxManifestBytes: DEFAULT_LIMITS.maxManifestBytes,
    maxJsonDepth: DEFAULT_LIMITS.maxJsonDepth,
    maxObjectKeys: DEFAULT_LIMITS.maxObjectKeys,
    maxArrayItems: DEFAULT_LIMITS.maxArrayItems,
    maxStringBytes: DEFAULT_LIMITS.maxStringBytes,
  };
  for (const key of Object.keys(input)) if (!Object.hasOwn(defaults, key)) reject("parser limits contain an unsupported field", "INVALID_JSON_LIMITS", { field: `parserLimits.${key}` });
  for (const [key, value] of Object.entries(input)) {
    if (!Number.isSafeInteger(value) || value < 1 || value > PARSER_HARD_LIMITS[key]) reject("parser limit is invalid", "INVALID_JSON_LIMITS", { field: `parserLimits.${key}` });
    defaults[key] = value;
  }
  return immutable(defaults);
}

function validatePassiveJson(value, limits, field, depth = 0, budget = { objectKeys: 0, arrayItems: 0 }, ancestors = new Set()) {
  if (depth > limits.maxJsonDepth) reject(`${field} exceeds its depth budget`, "PACK_METADATA_RESOURCE_LIMIT", { field });
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (Buffer.byteLength(value, "utf8") > limits.maxStringBytes) reject(`${field} exceeds its string budget`, "PACK_METADATA_RESOURCE_LIMIT", { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) reject(`${field} contains a non-finite number`, "INVALID_PACK_METADATA", { field });
    return;
  }
  if (typeof value !== "object" || ancestors.has(value)) reject(`${field} is not passive JSON`, "INVALID_PACK_METADATA", { field });
  ancestors.add(value);
  if (Array.isArray(value)) {
    assertDenseArray(value, field, "INVALID_PACK_METADATA");
    budget.arrayItems += value.length;
    if (budget.arrayItems > limits.maxArrayItems) reject(`${field} exceeds its array budget`, "PACK_METADATA_RESOURCE_LIMIT", { field });
    value.forEach((child, index) => validatePassiveJson(child, limits, `${field}[${index}]`, depth + 1, budget, ancestors));
  } else {
    assertPlainRecord(value, field, "INVALID_PACK_METADATA");
    budget.objectKeys += Object.keys(value).length;
    if (budget.objectKeys > limits.maxObjectKeys) reject(`${field} exceeds its object-key budget`, "PACK_METADATA_RESOURCE_LIMIT", { field });
    for (const [key, child] of Object.entries(value)) validatePassiveJson(child, limits, `${field}.${key}`, depth + 1, budget, ancestors);
  }
  ancestors.delete(value);
}

function validateIsoInstant(value, field, code = "INVALID_TIMESTAMP") {
  assertNonEmptyString(value, field, code, 64);
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/);
  const epoch = match ? Date.parse(value) : Number.NaN;
  if (!match || Number.isNaN(epoch)) reject(`${field} must be a UTC ISO instant`, code, { field });
  const instant = new Date(epoch);
  const parts = [instant.getUTCFullYear(), instant.getUTCMonth() + 1, instant.getUTCDate(), instant.getUTCHours(), instant.getUTCMinutes(), instant.getUTCSeconds()];
  const expected = match.slice(1, 7).map(Number);
  if (parts.some((part, index) => part !== expected[index])) reject(`${field} must be a real UTC ISO instant`, code, { field });
  return value;
}

function normalizePackPathWithLimits(value, limits) {
  if (typeof value !== "string") reject("pack entry path is required", "INVALID_PACK_PATH");
  const normalized = value.normalize("NFC");
  if (Buffer.byteLength(normalized, "utf8") > limits.maxPathBytes) reject("pack entry path exceeds its byte budget", "PACK_PATH_LIMIT");
  if (normalized.length === 0 || /[\u0000-\u001f\u007f]/u.test(normalized)) reject("pack entry path is unsafe", "UNSAFE_PACK_PATH");
  if (normalized.includes("\\") || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) reject("pack entry path must be relative POSIX", "UNSAFE_PACK_PATH");
  const segments = normalized.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) reject("pack entry path contains unsafe segments", "UNSAFE_PACK_PATH");
  return segments.join("/");
}

function normalizePackPath(value, limits = {}) {
  return normalizePackPathWithLimits(value, normalizeLimits(limits));
}

function readJsonString(text, state, limits) {
  const start = state.index;
  state.index += 1;
  while (state.index < text.length) {
    const char = text[state.index];
    if (char === "\\") {
      state.index += 2;
      continue;
    }
    if (char === '"') {
      state.index += 1;
      try {
        const value = JSON.parse(text.slice(start, state.index));
        if (Buffer.byteLength(value, "utf8") > limits.maxStringBytes) reject("JSON string exceeds pre-auth limit", "JSON_STRING_LIMIT");
        return value;
      } catch (error) {
        if (error?.code === "JSON_STRING_LIMIT") throw error;
        reject("invalid JSON string", "INVALID_JSON");
      }
    }
    state.index += 1;
  }
  reject("unterminated JSON string", "INVALID_JSON");
}

function skipWhitespace(text, state) {
  while ([" ", "\t", "\r", "\n"].includes(text[state.index])) state.index += 1;
}

function scanJsonValue(text, state, depth, limits) {
  if (depth > limits.maxJsonDepth) reject("JSON depth exceeds pre-auth limit", "JSON_DEPTH_LIMIT");
  skipWhitespace(text, state);
  const char = text[state.index];
  if (char === "{") {
    state.index += 1;
    const keys = new Set();
    skipWhitespace(text, state);
    if (text[state.index] === "}") {
      state.index += 1;
      return;
    }
    while (state.index < text.length) {
      skipWhitespace(text, state);
      if (text[state.index] !== '"') reject("JSON object key must be a string", "INVALID_JSON");
      const key = readJsonString(text, state, limits);
      if (keys.has(key)) reject("duplicate JSON object key", "DUPLICATE_JSON_KEY", { key });
      keys.add(key);
      state.objectKeys += 1;
      if (state.objectKeys > limits.maxObjectKeys) reject("JSON object key budget exceeded", "JSON_OBJECT_KEY_LIMIT");
      skipWhitespace(text, state);
      if (text[state.index] !== ":") reject("JSON object key must be followed by colon", "INVALID_JSON");
      state.index += 1;
      scanJsonValue(text, state, depth + 1, limits);
      skipWhitespace(text, state);
      if (text[state.index] === "}") {
        state.index += 1;
        return;
      }
      if (text[state.index] !== ",") reject("JSON object requires comma", "INVALID_JSON");
      state.index += 1;
    }
    reject("unterminated JSON object", "INVALID_JSON");
  }
  if (char === "[") {
    state.index += 1;
    skipWhitespace(text, state);
    if (text[state.index] === "]") {
      state.index += 1;
      return;
    }
    while (state.index < text.length) {
      state.arrayItems += 1;
      if (state.arrayItems > limits.maxArrayItems) reject("JSON array budget exceeded", "JSON_ARRAY_ITEM_LIMIT");
      scanJsonValue(text, state, depth + 1, limits);
      skipWhitespace(text, state);
      if (text[state.index] === "]") {
        state.index += 1;
        return;
      }
      if (text[state.index] !== ",") reject("JSON array requires comma", "INVALID_JSON");
      state.index += 1;
    }
    reject("unterminated JSON array", "INVALID_JSON");
  }
  if (char === '"') {
    readJsonString(text, state, limits);
    return;
  }
  for (const [literal, length] of [["true", 4], ["false", 5], ["null", 4]]) {
    if (text.startsWith(literal, state.index)) {
      state.index += length;
      return;
    }
  }
  const number = text.slice(state.index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
  if (number) {
    if (!Number.isFinite(Number(number[0]))) reject("JSON number must be finite", "NON_FINITE_JSON_NUMBER");
    state.index += number[0].length;
    return;
  }
  reject("invalid JSON value", "INVALID_JSON");
}

function parseManifestPreAuth(text, limitsInput = {}) {
  const limits = normalizeParserLimits(limitsInput);
  if (typeof text !== "string") reject("manifest bytes must be text", "INVALID_MANIFEST_BYTES");
  if (Buffer.byteLength(text, "utf8") > limits.maxManifestBytes) reject("manifest exceeds pre-auth byte limit", "MANIFEST_SIZE_LIMIT");
  const state = { index: 0, objectKeys: 0, arrayItems: 0 };
  scanJsonValue(text, state, 0, limits);
  skipWhitespace(text, state);
  if (state.index !== text.length) reject("trailing JSON data", "INVALID_JSON");
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    reject("manifest JSON is invalid", "INVALID_JSON");
  }
  assertPlainRecord(value, "manifest", "INVALID_MANIFEST");
  return immutable(value);
}

function validateSource(source) {
  assertExactKeys(source, ["datasetId", "name", "version", "url", "retrievedAt", "rawArtifactSha256", "licenseId", "attribution"], [], "source", "INVALID_SOURCE");
  for (const field of ["datasetId", "name", "version", "licenseId", "attribution"]) assertNonEmptyString(source[field], `source.${field}`, "INVALID_SOURCE");
  let url;
  try {
    url = new URL(source.url);
  } catch {
    reject("source.url must be a URL", "INVALID_SOURCE_URL");
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) reject("source.url must be an official HTTPS URL", "INVALID_SOURCE_URL");
  validateIsoInstant(source.retrievedAt, "source.retrievedAt", "INVALID_SOURCE_TIMESTAMP");
  if (typeof source.rawArtifactSha256 !== "string" || !SHA256_RE.test(source.rawArtifactSha256)) reject("source raw artifact hash is invalid", "INVALID_SOURCE_HASH");
  return immutable(source);
}

function validateManifestFile(entry, limits, index) {
  const field = `manifest.files[${index}]`;
  assertExactKeys(entry, ["path", "size", "sha256"], [], field, "INVALID_FILE_ENTRY");
  const path = normalizePackPathWithLimits(entry.path, limits);
  if (!Number.isSafeInteger(entry.size) || entry.size < 0) reject("file entry size is invalid", "INVALID_FILE_SIZE", { path });
  if (entry.size > limits.maxEntryBytes) reject("file entry exceeds size budget", "FILE_SIZE_LIMIT", { path });
  if (typeof entry.sha256 !== "string" || !SHA256_RE.test(entry.sha256)) reject("file entry SHA-256 is invalid", "INVALID_FILE_HASH", { path });
  return { path, size: entry.size, sha256: entry.sha256 };
}

function assertUniquePaths(entries, duplicateCode, collisionCode) {
  const exact = new Set();
  const folded = new Set();
  for (const entry of entries) {
    const collisionKey = entry.path.toLocaleLowerCase("en-US");
    if (exact.has(entry.path)) reject("duplicate normalized pack path", duplicateCode, { path: entry.path });
    if (folded.has(collisionKey)) reject("case-insensitive pack path collision", collisionCode, { path: entry.path });
    exact.add(entry.path);
    folded.add(collisionKey);
  }
}

function validatePackManifest(manifest, limitsInput = {}) {
  const limits = normalizeLimits(limitsInput);
  assertPlainRecord(manifest, "manifest", "INVALID_MANIFEST");
  validatePassiveJson(manifest, limits, "manifest");
  for (const key of Object.keys(manifest)) if (key.startsWith("!")) reject(`unknown critical manifest key: ${key}`, "UNKNOWN_CRITICAL_KEY", { key });
  const required = ["formatVersion", "packId", "packVersion", "createdAt", "minimumAppVersion", "schemaVersion", "source", "transformVersion", "recordProvenanceVersion", "nutrients", "files", "signature"];
  for (const field of required) if (!Object.hasOwn(manifest, field)) reject(`manifest.${field} is required`, "INVALID_MANIFEST_FIELD", { field: `manifest.${field}` });
  if (manifest.formatVersion !== 1 || manifest.schemaVersion !== 1) reject("unsupported pack format or schema", "INVALID_PACK_VERSION");
  for (const field of ["packId", "packVersion", "minimumAppVersion", "transformVersion"]) assertSafeId(manifest[field], `manifest.${field}`, "INVALID_MANIFEST_FIELD");
  validateIsoInstant(manifest.createdAt, "manifest.createdAt", "INVALID_MANIFEST_TIMESTAMP");
  if (manifest.recordProvenanceVersion !== 1) reject("unsupported provenance version", "INVALID_PROVENANCE_VERSION");
  const source = validateSource(manifest.source);
  assertDenseArray(manifest.nutrients, "manifest.nutrients", "INVALID_NUTRIENT_SET");
  if (manifest.nutrients.length !== NUTRIENTS.length || manifest.nutrients.some((value, index) => value !== NUTRIENTS[index])) reject("manifest nutrient list must match the seven accepted fields", "INVALID_NUTRIENT_SET");
  assertDenseArray(manifest.files, "manifest.files", "INVALID_MANIFEST_FILES");
  if (manifest.files.length === 0 || manifest.files.length > limits.maxEntries) reject("manifest files are invalid", "INVALID_MANIFEST_FILES");
  const files = manifest.files.map((entry, index) => validateManifestFile(entry, limits, index));
  assertUniquePaths(files, "DUPLICATE_MANIFEST_PATH", "MANIFEST_PATH_COLLISION");
  let totalBytes = 0;
  const knownPaths = new Set([...REQUIRED_FILES, ...OPTIONAL_FILES]);
  for (const entry of files) {
    totalBytes += entry.size;
    if (!Number.isSafeInteger(totalBytes) || totalBytes > limits.maxTotalBytes) reject("manifest total size exceeds budget", "TOTAL_SIZE_LIMIT");
    if (!knownPaths.has(entry.path)) reject("unknown pack entry path", "UNKNOWN_PACK_ENTRY", { path: entry.path });
  }
  const paths = new Set(files.map(({ path }) => path));
  for (const requiredPath of REQUIRED_FILES) if (!paths.has(requiredPath)) reject(`required pack entry missing: ${requiredPath}`, "REQUIRED_PACK_ENTRY_MISSING", { path: requiredPath });
  assertExactKeys(manifest.signature, ["algorithm", "keyId"], [], "manifest.signature", "INVALID_SIGNATURE_METADATA");
  if (manifest.signature.algorithm !== "pending-D-026") reject("signature algorithm remains pending D-026", "INVALID_SIGNATURE_METADATA");
  assertSafeId(manifest.signature.keyId, "manifest.signature.keyId", "INVALID_SIGNATURE_METADATA");
  const normalized = immutable({ ...manifest, source, nutrients: [...manifest.nutrients], files, signature: { ...manifest.signature } });
  if (Buffer.byteLength(canonicalStringify(normalized), "utf8") > limits.maxManifestBytes) reject("manifest exceeds its byte budget", "MANIFEST_SIZE_LIMIT");
  return normalized;
}

function validateActualEntries(entries, limits) {
  assertDenseArray(entries, "entries", "INVALID_ENTRIES");
  if (entries.length === 0 || entries.length > limits.maxEntries) reject("actual entries are invalid", "INVALID_ENTRIES");
  let totalBytes = 0;
  const normalized = entries.map((entry, index) => {
    const field = `entries[${index}]`;
    assertExactKeys(entry, ["path", "size", "sha256", "type"], [], field, "INVALID_ACTUAL_ENTRY");
    if (entry.type !== "file") reject("actual entry type must be file", "UNSAFE_ENTRY_TYPE", { field: `${field}.type` });
    const file = validateManifestFile({ path: entry.path, size: entry.size, sha256: entry.sha256 }, limits, index);
    totalBytes += file.size;
    if (!Number.isSafeInteger(totalBytes) || totalBytes > limits.maxTotalBytes) reject("actual entry total size exceeds budget", "TOTAL_SIZE_LIMIT");
    return { ...file, type: "file" };
  });
  assertUniquePaths(normalized, "DUPLICATE_ENTRY_PATH", "ENTRY_PATH_COLLISION");
  return immutable(normalized);
}

function validateRecordValue(nutrient, value, missingFields, field) {
  if (missingFields.has(nutrient)) {
    if (value !== null) reject("missing nutrient must remain null", "MISSING_NUTRIENT_NOT_NULL", { nutrient });
    return null;
  }
  assertExactKeys(value, ["value", "unit"], [], field, "INVALID_ORIGINAL_NUTRIENT");
  if (typeof value.value !== "number" || !Number.isFinite(value.value) || value.value < 0) reject("original nutrient value is invalid", "INVALID_ORIGINAL_NUTRIENT", { nutrient });
  if (!UNIT_BY_NUTRIENT[nutrient].has(value.unit)) reject("original nutrient unit is invalid", "INVALID_ORIGINAL_UNIT", { nutrient, unit: value.unit });
  return { value: value.value, unit: value.unit };
}

function validateProvenanceRecords(records, limitsInput = {}) {
  const limits = normalizeLimits(limitsInput);
  assertDenseArray(records, "provenanceRecords", "INVALID_PROVENANCE_RECORDS");
  if (records.length === 0 || records.length > limits.maxProvenanceRecords) reject("provenance records are invalid", "INVALID_PROVENANCE_RECORDS");
  const sourceRecordIds = new Set();
  const catalogRecordIds = new Set();
  return immutable(records.map((record, index) => {
    const field = `provenanceRecords[${index}]`;
    assertExactKeys(record, ["sourceId", "sourceVersion", "sourceRecordId", "catalogRecordId", "licenseId", "missingFields", "originalValues"], [], field, "INVALID_PROVENANCE_RECORD");
    for (const key of ["sourceId", "sourceVersion", "sourceRecordId", "catalogRecordId", "licenseId"]) assertSafeId(record[key], `${field}.${key}`, "INVALID_PROVENANCE_RECORD");
    if (sourceRecordIds.has(record.sourceRecordId) || catalogRecordIds.has(record.catalogRecordId)) reject("provenance record identities must be unique", "DUPLICATE_PROVENANCE_RECORD", { field });
    sourceRecordIds.add(record.sourceRecordId);
    catalogRecordIds.add(record.catalogRecordId);
    assertDenseArray(record.missingFields, `${field}.missingFields`, "INVALID_MISSING_FIELDS");
    if (new Set(record.missingFields).size !== record.missingFields.length || record.missingFields.some((nutrient) => !NUTRIENTS.includes(nutrient))) reject("missingFields must be a unique subset of accepted nutrients", "INVALID_MISSING_FIELDS");
    assertExactKeys(record.originalValues, NUTRIENTS, [], `${field}.originalValues`, "INVALID_ORIGINAL_VALUES");
    const missingFields = new Set(record.missingFields);
    const originalValues = Object.fromEntries(NUTRIENTS.map((nutrient) => [nutrient, validateRecordValue(nutrient, record.originalValues[nutrient], missingFields, `${field}.originalValues.${nutrient}`)]));
    return { ...record, missingFields: [...record.missingFields], originalValues };
  }));
}

function validateTransforms(transforms, limitsInput = {}) {
  const limits = normalizeLimits(limitsInput);
  assertExactKeys(transforms, ["transformVersion", "steps"], [], "transforms", "INVALID_TRANSFORMS");
  assertSafeId(transforms.transformVersion, "transforms.transformVersion", "INVALID_TRANSFORMS");
  assertDenseArray(transforms.steps, "transforms.steps", "INVALID_TRANSFORMS");
  if (transforms.steps.length === 0 || transforms.steps.length > limits.maxTransformSteps) reject("transform steps are invalid", "INVALID_TRANSFORMS");
  const stepIds = new Set();
  const steps = transforms.steps.map((step, index) => {
    const field = `transforms.steps[${index}]`;
    assertExactKeys(step, ["id", "operation", "toolVersion"], [], field, "INVALID_TRANSFORM_STEP");
    for (const key of ["id", "operation", "toolVersion"]) assertSafeId(step[key], `${field}.${key}`, "INVALID_TRANSFORM_STEP");
    if (stepIds.has(step.id)) reject("transform step IDs must be unique", "DUPLICATE_TRANSFORM_STEP", { field: `${field}.id` });
    stepIds.add(step.id);
    return { ...step };
  });
  return immutable({ transformVersion: transforms.transformVersion, steps });
}

function validateBarcodeMapping(mapping) {
  assertPlainRecord(mapping, "barcodeMapping", "INVALID_BARCODE_MAPPING");
  if (Object.hasOwn(mapping, "country") || Object.hasOwn(mapping, "nutrients")) reject("barcode mapping must not infer country or nutrition", "BARCODE_INFERENCE_FORBIDDEN");
  assertExactKeys(mapping, ["gtin", "catalogRecordId"], [], "barcodeMapping", "INVALID_BARCODE_MAPPING");
  if (typeof mapping.gtin !== "string" || !/^(?:[0-9]{8}|[0-9]{12,14})$/.test(mapping.gtin)) reject("GTIN must remain a digit string", "INVALID_GTIN");
  assertSafeId(mapping.catalogRecordId, "barcodeMapping.catalogRecordId", "INVALID_BARCODE_MAPPING");
  return immutable({ gtin: mapping.gtin, catalogRecordId: mapping.catalogRecordId });
}

function normalizeNotice(notice, limits) {
  return assertNonEmptyString(notice, "notice", "NOTICE_REQUIRED", limits.maxNoticeBytes);
}

function createPackSubject(input) {
  assertExactKeys(input, ["schemaVersion", "manifest", "entries", "provenanceRecords", "transforms", "notice"], ["limits"], "subjectInput", "INVALID_PACK_SUBJECT_INPUT");
  if (input.schemaVersion !== "DATA_PACK_SUBJECT_INPUT_V1") reject("pack subject input schema is unsupported", "INVALID_PACK_SUBJECT_INPUT");
  const limits = normalizeLimits(input.limits ?? {});
  const manifest = validatePackManifest(input.manifest, limits);
  const entries = validateActualEntries(input.entries, limits);
  if (entries.length !== manifest.files.length) reject("manifest and actual entries must have equal cardinality", "MANIFEST_ENTRIES_MISMATCH");
  const entriesByPath = new Map(entries.map((entry) => [entry.path, entry]));
  for (const file of manifest.files) {
    const actual = entriesByPath.get(file.path);
    if (!actual || actual.size !== file.size || actual.sha256 !== file.sha256) reject("manifest file metadata does not match actual entries", "MANIFEST_ENTRIES_MISMATCH", { path: file.path });
  }
  const provenanceRecords = validateProvenanceRecords(input.provenanceRecords, limits);
  const transforms = validateTransforms(input.transforms, limits);
  if (transforms.transformVersion !== manifest.transformVersion) reject("transform version does not match manifest", "TRANSFORM_VERSION_MISMATCH");
  for (const record of provenanceRecords) {
    if (record.sourceId !== manifest.source.datasetId || record.sourceVersion !== manifest.source.version || record.licenseId !== manifest.source.licenseId) reject("provenance source identity does not match manifest", "PROVENANCE_SOURCE_MISMATCH", { catalogRecordId: record.catalogRecordId });
  }
  const notice = normalizeNotice(input.notice, limits);
  const core = immutable({ schemaVersion: "DATA_PACK_SUBJECT_V1", limits, manifest, entries, provenanceRecords, transforms, notice });
  return immutable({ ...core, subjectFingerprint: fingerprint(core) });
}

function normalizePackSubject(input) {
  assertExactKeys(input, ["schemaVersion", "limits", "manifest", "entries", "provenanceRecords", "transforms", "notice", "subjectFingerprint"], [], "subject", "INVALID_PACK_SUBJECT");
  if (input.schemaVersion !== "DATA_PACK_SUBJECT_V1" || !SHA256_RE.test(input.subjectFingerprint)) reject("pack subject is invalid", "INVALID_PACK_SUBJECT");
  const expected = createPackSubject({
    schemaVersion: "DATA_PACK_SUBJECT_INPUT_V1",
    limits: input.limits,
    manifest: input.manifest,
    entries: input.entries,
    provenanceRecords: input.provenanceRecords,
    transforms: input.transforms,
    notice: input.notice,
  });
  if (!isDeepStrictEqual(input, expected)) reject("pack subject or fingerprint was changed", "INVALID_PACK_SUBJECT");
  return expected;
}

function createPackVerificationEvidence(input) {
  assertExactKeys(input, ["schemaVersion", "evidenceId", "subjectFingerprint", "signature", "integrity"], [], "verificationInput", "INVALID_PACK_VERIFICATION_EVIDENCE");
  if (input.schemaVersion !== "DATA_PACK_VERIFICATION_INPUT_V1" || !SHA256_RE.test(input.subjectFingerprint)) reject("pack verification input is invalid", "INVALID_PACK_VERIFICATION_EVIDENCE");
  const normalizeResult = (result, field) => {
    assertExactKeys(result, ["status", "verifierId", "profileId"], [], field, "INVALID_PACK_VERIFICATION_EVIDENCE");
    if (result.status !== "VERIFIED") reject(`${field} must be VERIFIED`, "INVALID_PACK_VERIFICATION_EVIDENCE", { field: `${field}.status` });
    return {
      status: "VERIFIED",
      verifierId: assertSafeId(result.verifierId, `${field}.verifierId`, "INVALID_PACK_VERIFICATION_EVIDENCE"),
      profileId: assertSafeId(result.profileId, `${field}.profileId`, "INVALID_PACK_VERIFICATION_EVIDENCE"),
    };
  };
  const core = immutable({
    schemaVersion: "DATA_PACK_VERIFICATION_EVIDENCE_V1",
    evidenceId: assertSafeId(input.evidenceId, "verificationInput.evidenceId", "INVALID_PACK_VERIFICATION_EVIDENCE"),
    subjectFingerprint: input.subjectFingerprint,
    signature: normalizeResult(input.signature, "verificationInput.signature"),
    integrity: normalizeResult(input.integrity, "verificationInput.integrity"),
    assertionBoundary: BOUNDARY.verificationTruth,
  });
  return immutable({ ...core, verificationFingerprint: fingerprint(core) });
}

function normalizeVerificationEvidence(input, expectedSubjectFingerprint) {
  assertExactKeys(input, ["schemaVersion", "evidenceId", "subjectFingerprint", "signature", "integrity", "assertionBoundary", "verificationFingerprint"], [], "verificationEvidence", "INVALID_PACK_VERIFICATION_EVIDENCE");
  if (input.schemaVersion !== "DATA_PACK_VERIFICATION_EVIDENCE_V1" || input.assertionBoundary !== BOUNDARY.verificationTruth || !SHA256_RE.test(input.verificationFingerprint)) reject("pack verification evidence is invalid", "INVALID_PACK_VERIFICATION_EVIDENCE");
  if (input.subjectFingerprint !== expectedSubjectFingerprint) reject("pack verification evidence belongs to another subject", "PACK_VERIFICATION_SUBJECT_MISMATCH");
  const expected = createPackVerificationEvidence({
    schemaVersion: "DATA_PACK_VERIFICATION_INPUT_V1",
    evidenceId: input.evidenceId,
    subjectFingerprint: input.subjectFingerprint,
    signature: input.signature,
    integrity: input.integrity,
  });
  if (!isDeepStrictEqual(input, expected)) reject("pack verification evidence was changed", "INVALID_PACK_VERIFICATION_EVIDENCE");
  return expected;
}

function validatePackContract(input) {
  try {
    assertExactKeys(input, ["subject", "verificationEvidence"], [], "request", "INVALID_PACK_CONTRACT_REQUEST");
    const subject = normalizePackSubject(input.subject);
    const verificationEvidence = normalizeVerificationEvidence(input.verificationEvidence, subject.subjectFingerprint);
    return immutable({
      status: "READY_FOR_ACTIVATION",
      activation: BOUNDARY.activationStrategy,
      committed: false,
      subject,
      verificationEvidence,
      boundary: BOUNDARY,
    });
  } catch (error) {
    return immutable({
      status: "REJECTED",
      activation: BOUNDARY.activationStrategy,
      committed: false,
      error: { code: error.code || "PACK_CONTRACT_REJECTED", message: error.message },
      boundary: BOUNDARY,
    });
  }
}

export {
  BOUNDARY,
  DEFAULT_LIMITS,
  NUTRIENTS,
  OPTIONAL_FILES,
  REQUIRED_FILES,
  createPackSubject,
  createPackVerificationEvidence,
  normalizePackPath,
  parseManifestPreAuth,
  validateBarcodeMapping,
  validatePackContract,
  validatePackManifest,
  validateProvenanceRecords,
  validateTransforms,
};
