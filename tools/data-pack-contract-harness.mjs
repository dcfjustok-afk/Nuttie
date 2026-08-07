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
  maxArrayItems: 2048,
  maxEntries: 128,
  maxEntryBytes: 200 * 1024 * 1024,
  maxTotalBytes: 400 * 1024 * 1024,
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
  Object.assign(error, { code }, details);
  throw error;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertPlainObject(value, code, message) {
  if (!isPlainObject(value)) reject(message, code);
}

function assertNonEmptyString(value, code, message, max = 256) {
  if (typeof value !== "string" || value.length === 0 || value.length > max) reject(message, code);
}

function assertSafeId(value, code, message) {
  if (typeof value !== "string" || !SAFE_ID_RE.test(value)) reject(message, code);
}

function validateIsoInstant(value, code = "INVALID_TIMESTAMP") {
  assertNonEmptyString(value, code, "timestamp is required", 64);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(value) || Number.isNaN(Date.parse(value))) {
    reject("timestamp must be a UTC ISO instant", code);
  }
}

export function normalizePackPath(value) {
  if (typeof value !== "string") reject("pack entry path is required", "INVALID_PACK_PATH");
  const normalized = value.normalize("NFC");
  if (normalized.length === 0 || /[\u0000-\u001f\u007f]/.test(normalized)) reject("pack entry path is unsafe", "UNSAFE_PACK_PATH");
  if (normalized.includes("\\") || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) reject("pack entry path must be relative POSIX", "UNSAFE_PACK_PATH");
  const segments = normalized.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) reject("pack entry path contains unsafe segments", "UNSAFE_PACK_PATH");
  return segments.join("/");
}

function readJsonString(text, state) {
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
        return JSON.parse(text.slice(start, state.index));
      } catch {
        reject("invalid JSON string", "INVALID_JSON");
      }
    }
    state.index += 1;
  }
  reject("unterminated JSON string", "INVALID_JSON");
}

function skipWhitespace(text, state) {
  while (/\s/.test(text[state.index] || "")) state.index += 1;
}

function scanJsonValue(text, state, depth, limits) {
  if (depth > limits.maxJsonDepth) reject("JSON depth exceeds pre-auth limit", "JSON_DEPTH_LIMIT");
  skipWhitespace(text, state);
  const char = text[state.index];
  if (char === "{") {
    state.index += 1;
    state.objectKeys += 1;
    if (state.objectKeys > limits.maxObjectKeys) reject("JSON object key budget exceeded", "JSON_OBJECT_KEY_LIMIT");
    const keys = new Set();
    skipWhitespace(text, state);
    if (text[state.index] === "}") {
      state.index += 1;
      return;
    }
    while (state.index < text.length) {
      skipWhitespace(text, state);
      if (text[state.index] !== '"') reject("JSON object key must be a string", "INVALID_JSON");
      const key = readJsonString(text, state);
      if (keys.has(key)) reject("duplicate JSON object key", "DUPLICATE_JSON_KEY", { key });
      keys.add(key);
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
    state.arrayItems += 1;
    if (state.arrayItems > limits.maxArrayItems) reject("JSON array budget exceeded", "JSON_ARRAY_ITEM_LIMIT");
    skipWhitespace(text, state);
    if (text[state.index] === "]") {
      state.index += 1;
      return;
    }
    while (state.index < text.length) {
      scanJsonValue(text, state, depth + 1, limits);
      skipWhitespace(text, state);
      if (text[state.index] === "]") {
        state.index += 1;
        return;
      }
      if (text[state.index] !== ",") reject("JSON array requires comma", "INVALID_JSON");
      state.index += 1;
      state.arrayItems += 1;
      if (state.arrayItems > limits.maxArrayItems) reject("JSON array budget exceeded", "JSON_ARRAY_ITEM_LIMIT");
    }
    reject("unterminated JSON array", "INVALID_JSON");
  }
  if (char === '"') {
    readJsonString(text, state);
    return;
  }
  if (text.startsWith("true", state.index)) {
    state.index += 4;
    return;
  }
  if (text.startsWith("false", state.index)) {
    state.index += 5;
    return;
  }
  if (text.startsWith("null", state.index)) {
    state.index += 4;
    return;
  }
  const number = text.slice(state.index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
  if (number) {
    const numeric = Number(number[0]);
    if (!Number.isFinite(numeric)) reject("JSON number must be finite", "NON_FINITE_JSON_NUMBER");
    state.index += number[0].length;
    return;
  }
  reject("invalid JSON value", "INVALID_JSON");
}

export function parseManifestPreAuth(text, limits = DEFAULT_LIMITS) {
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
  assertPlainObject(value, "INVALID_MANIFEST", "manifest must be an object");
  return value;
}

function validateSource(source) {
  assertPlainObject(source, "INVALID_SOURCE", "source must be an object");
  for (const field of ["datasetId", "name", "version", "licenseId", "attribution"]) assertNonEmptyString(source[field], "INVALID_SOURCE", `source.${field} is required`);
  let url;
  try {
    url = new URL(source.url);
  } catch {
    reject("source.url must be a URL", "INVALID_SOURCE_URL");
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) reject("source.url must be an official HTTPS URL", "INVALID_SOURCE_URL");
  validateIsoInstant(source.retrievedAt, "INVALID_SOURCE_TIMESTAMP");
  if (typeof source.rawArtifactSha256 !== "string" || !SHA256_RE.test(source.rawArtifactSha256)) reject("source raw artifact hash is invalid", "INVALID_SOURCE_HASH");
  return true;
}

function validateFileMetadata(entry, limits) {
  assertPlainObject(entry, "INVALID_FILE_ENTRY", "file entry must be an object");
  const path = normalizePackPath(entry.path);
  if (!Number.isSafeInteger(entry.size) || entry.size < 0) reject("file entry size is invalid", "INVALID_FILE_SIZE", { path });
  if (entry.size > limits.maxEntryBytes) reject("file entry exceeds size budget", "FILE_SIZE_LIMIT", { path });
  if (typeof entry.sha256 !== "string" || !SHA256_RE.test(entry.sha256)) reject("file entry SHA-256 is invalid", "INVALID_FILE_HASH", { path });
  return Object.freeze({ path, size: entry.size, sha256: entry.sha256 });
}

export function validatePackManifest(manifest, limits = DEFAULT_LIMITS) {
  assertPlainObject(manifest, "INVALID_MANIFEST", "manifest must be an object");
  for (const key of Object.keys(manifest)) {
    if (key.startsWith("!")) reject(`unknown critical manifest key: ${key}`, "UNKNOWN_CRITICAL_KEY", { key });
  }
  if (manifest.formatVersion !== 1 || manifest.schemaVersion !== 1) reject("unsupported pack format or schema", "INVALID_PACK_VERSION");
  for (const field of ["packId", "packVersion", "minimumAppVersion", "transformVersion"]) assertSafeId(manifest[field], "INVALID_MANIFEST_FIELD", `${field} is invalid`);
  validateIsoInstant(manifest.createdAt, "INVALID_MANIFEST_TIMESTAMP");
  if (manifest.recordProvenanceVersion !== 1) reject("unsupported provenance version", "INVALID_PROVENANCE_VERSION");
  validateSource(manifest.source);
  if (!Array.isArray(manifest.nutrients) || manifest.nutrients.length !== NUTRIENTS.length || manifest.nutrients.some((value, index) => value !== NUTRIENTS[index])) reject("manifest nutrient list must match the seven accepted fields", "INVALID_NUTRIENT_SET");
  if (!Array.isArray(manifest.files) || manifest.files.length === 0 || manifest.files.length > limits.maxEntries) reject("manifest files are invalid", "INVALID_MANIFEST_FILES");
  const files = manifest.files.map((entry) => validateFileMetadata(entry, limits));
  const normalizedPaths = new Set();
  const caseFoldedPaths = new Set();
  for (const entry of files) {
    const normalized = entry.path.normalize("NFC");
    const folded = normalized.toLocaleLowerCase("en-US");
    if (normalizedPaths.has(normalized)) reject("duplicate manifest path", "DUPLICATE_MANIFEST_PATH", { path: entry.path });
    if (caseFoldedPaths.has(folded)) reject("case-insensitive manifest path collision", "MANIFEST_PATH_COLLISION", { path: entry.path });
    normalizedPaths.add(normalized);
    caseFoldedPaths.add(folded);
    if (![...REQUIRED_FILES, ...OPTIONAL_FILES].includes(entry.path)) reject("unknown pack entry path", "UNKNOWN_PACK_ENTRY", { path: entry.path });
  }
  for (const required of REQUIRED_FILES) if (!normalizedPaths.has(required)) reject(`required pack entry missing: ${required}`, "REQUIRED_PACK_ENTRY_MISSING", { path: required });
  assertPlainObject(manifest.signature, "INVALID_SIGNATURE_METADATA", "signature metadata is required");
  assertNonEmptyString(manifest.signature.algorithm, "INVALID_SIGNATURE_METADATA", "signature algorithm marker is required");
  assertNonEmptyString(manifest.signature.keyId, "INVALID_SIGNATURE_METADATA", "signature keyId marker is required");
  return Object.freeze({ ...manifest, files: Object.freeze(files) });
}

function validateRecordValue(nutrient, value, missingFields) {
  if (missingFields.has(nutrient)) {
    if (value !== null) reject("missing nutrient must remain null", "MISSING_NUTRIENT_NOT_NULL", { nutrient });
    return;
  }
  assertPlainObject(value, "INVALID_ORIGINAL_NUTRIENT", `original ${nutrient} must include value and unit`);
  if (typeof value.value !== "number" || !Number.isFinite(value.value) || value.value < 0) reject("original nutrient value is invalid", "INVALID_ORIGINAL_NUTRIENT", { nutrient });
  if (!UNIT_BY_NUTRIENT[nutrient].has(value.unit)) reject("original nutrient unit is invalid", "INVALID_ORIGINAL_UNIT", { nutrient, unit: value.unit });
}

export function validateProvenanceRecords(records) {
  if (!Array.isArray(records) || records.length === 0) reject("provenance records are required", "INVALID_PROVENANCE_RECORDS");
  return Object.freeze(records.map((record) => {
    assertPlainObject(record, "INVALID_PROVENANCE_RECORD", "provenance record must be an object");
    for (const field of ["sourceId", "sourceVersion", "sourceRecordId", "catalogRecordId", "licenseId"]) assertSafeId(record[field], "INVALID_PROVENANCE_RECORD", `provenance ${field} is invalid`);
    if (!Array.isArray(record.missingFields) || new Set(record.missingFields).size !== record.missingFields.length || record.missingFields.some((field) => !NUTRIENTS.includes(field))) reject("missingFields must be a unique subset of accepted nutrients", "INVALID_MISSING_FIELDS");
    assertPlainObject(record.originalValues, "INVALID_ORIGINAL_VALUES", "originalValues are required");
    const missingFields = new Set(record.missingFields);
    for (const nutrient of NUTRIENTS) {
      if (!Object.prototype.hasOwnProperty.call(record.originalValues, nutrient)) reject("originalValues must contain every accepted nutrient", "ORIGINAL_NUTRIENT_MISSING", { nutrient });
      validateRecordValue(nutrient, record.originalValues[nutrient], missingFields);
    }
    return Object.freeze({ ...record, missingFields: Object.freeze([...record.missingFields]) });
  }));
}

export function validateTransforms(transforms) {
  assertPlainObject(transforms, "INVALID_TRANSFORMS", "transforms metadata is required");
  assertSafeId(transforms.transformVersion, "INVALID_TRANSFORMS", "transformVersion is invalid");
  if (!Array.isArray(transforms.steps) || transforms.steps.length === 0) reject("transform steps are required", "INVALID_TRANSFORMS");
  return Object.freeze({ ...transforms, steps: Object.freeze(transforms.steps.map((step) => {
    assertPlainObject(step, "INVALID_TRANSFORM_STEP", "transform step must be an object");
    for (const field of ["id", "operation", "toolVersion"]) assertSafeId(step[field], "INVALID_TRANSFORM_STEP", `transform ${field} is invalid`);
    return Object.freeze({ ...step });
  })) });
}

export function validateBarcodeMapping(mapping) {
  assertPlainObject(mapping, "INVALID_BARCODE_MAPPING", "barcode mapping must be an object");
  if (typeof mapping.gtin !== "string" || !/^(?:[0-9]{8}|[0-9]{12,14})$/.test(mapping.gtin)) reject("GTIN must remain a digit string", "INVALID_GTIN");
  assertSafeId(mapping.catalogRecordId, "INVALID_BARCODE_MAPPING", "catalogRecordId is invalid");
  if (Object.prototype.hasOwnProperty.call(mapping, "country") || Object.prototype.hasOwnProperty.call(mapping, "nutrients")) reject("barcode mapping must not infer country or nutrition", "BARCODE_INFERENCE_FORBIDDEN");
  return Object.freeze({ gtin: mapping.gtin, catalogRecordId: mapping.catalogRecordId });
}

export function validatePackContract({ manifest, entries, provenanceRecords, transforms, notice, signatureVerified = false, integrityVerified = false, limits = DEFAULT_LIMITS }) {
  try {
    const validatedManifest = validatePackManifest(manifest, limits);
    if (!Array.isArray(entries) || entries.length !== validatedManifest.files.length) reject("manifest and actual entries must have equal cardinality", "MANIFEST_ENTRIES_MISMATCH");
    const entryMap = new Map();
    for (const entry of entries) {
      const validated = validateFileMetadata(entry, limits);
      if (entryMap.has(validated.path)) reject("duplicate actual entry path", "DUPLICATE_ENTRY_PATH");
      entryMap.set(validated.path, validated);
    }
    for (const file of validatedManifest.files) {
      const actual = entryMap.get(file.path);
      if (!actual || actual.size !== file.size || actual.sha256 !== file.sha256) reject("manifest file metadata does not match actual entries", "MANIFEST_ENTRIES_MISMATCH", { path: file.path });
    }
    validateProvenanceRecords(provenanceRecords);
    validateTransforms(transforms);
    assertNonEmptyString(notice, "NOTICE_REQUIRED", "NOTICE text is required", 100_000);
    if (!signatureVerified) reject("signature verification is pending D-026", "SIGNATURE_REQUIRED");
    if (!integrityVerified) reject("integrity verification is required", "INTEGRITY_REQUIRED");
    return Object.freeze({ status: "READY_FOR_ACTIVATION", activation: "PENDING_APPROVED_STRATEGY", manifest: validatedManifest, committed: false });
  } catch (error) {
    return Object.freeze({ status: "REJECTED", activation: "PENDING_APPROVED_STRATEGY", committed: false, error: { code: error.code || "PACK_CONTRACT_REJECTED", message: error.message } });
  }
}

export { DEFAULT_LIMITS, NUTRIENTS, OPTIONAL_FILES, REQUIRED_FILES };
