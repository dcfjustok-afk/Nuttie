import { createHash } from "node:crypto";

import { parseManifestPreAuth } from "./data-pack-contract-harness.mjs";
import { NUTRIENT_FIELDS } from "./nutrition-fields.mjs";

const RESPONSE_LIMITS = Object.freeze({
  maxBytes: 16 * 1024,
  maxDepth: 6,
  maxItems: 32,
  maxObjectKeys: 384,
  maxStringLength: 512,
  maxLabelBytes: 128,
  maxNutrientValue: Number.MAX_SAFE_INTEGER,
});

const STATE_LIMITS = Object.freeze({
  maxBytes: 64 * 1024,
  maxDepth: 8,
  maxItems: 256,
  maxStringBytes: 4 * 1024,
});

const BOUNDARY = Object.freeze({
  contractStatus: "SPIKE_FRAMEWORK_AGNOSTIC_NON_PRODUCTION",
  responseTruth: "UNTRUSTED_PROVIDER_OUTPUT",
  schemaAuthority: "TEST_CONTRACT_NOT_FORMAL_PROVIDER_API",
  candidateAuthority: "UNCONFIRMED_EDITABLE_REFERENCE_ONLY",
  persistenceAuthorized: false,
  policyAuthorizationGranted: false,
  keychainReads: 0,
  sensitiveBodySerializations: 0,
  realNetworkRequests: 0,
  filesystemWrites: 0,
  businessWrites: 0,
  systemClockRead: false,
  nativeImplementationAuthorized: false,
  formalImplementationAuthorized: false,
});

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const SAFE_ERROR_CODE = /^[A-Z][A-Z0-9_]{0,127}$/;

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
    if (!descriptor.enumerable || !("value" in descriptor)) reject(`${field}.${key} must be an enumerable data property`, code, { field: `${field}.${key}` });
  }
}

function assertDenseArray(value, field, code) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) reject(`${field} must be a plain array`, code, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) reject(`${field} contains symbol properties`, code, { field });
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (key !== "length" && (!descriptor.enumerable || !("value" in descriptor))) reject(`${field}.${key} must be an enumerable data property`, code, { field: `${field}.${key}` });
  }
  const keys = Object.keys(value);
  if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) reject(`${field} must be dense and contain no extra properties`, code, { field });
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || FORBIDDEN_KEYS.has(key)) reject(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  }
  for (const key of required) if (!Object.hasOwn(value, key)) reject(`${field}.${key} is required`, code, { field: `${field}.${key}` });
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(value);
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function normalizePassiveState(input) {
  let items = 0;
  const ancestors = new Set();

  function visit(value, field, depth) {
    if (depth > STATE_LIMITS.maxDepth) reject(`${field} exceeds the state depth budget`, "RESPONSE_STATE_RESOURCE_LIMIT", { field });
    if (value === null || typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (Buffer.byteLength(value, "utf8") > STATE_LIMITS.maxStringBytes) reject(`${field} exceeds the state string budget`, "RESPONSE_STATE_RESOURCE_LIMIT", { field });
      return value;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value) || Object.is(value, -0)) reject(`${field} contains an unsafe number`, "INVALID_RESPONSE_STATE", { field });
      return value;
    }
    if (!value || typeof value !== "object" || ancestors.has(value)) reject(`${field} is not passive JSON`, "INVALID_RESPONSE_STATE", { field });
    ancestors.add(value);
    let output;
    if (Array.isArray(value)) {
      assertDenseArray(value, field, "INVALID_RESPONSE_STATE");
      items += value.length;
      if (items > STATE_LIMITS.maxItems) reject("state exceeds its item budget", "RESPONSE_STATE_RESOURCE_LIMIT");
      const descriptors = Object.getOwnPropertyDescriptors(value);
      output = value.map((_, index) => visit(descriptors[String(index)].value, `${field}[${index}]`, depth + 1));
    } else {
      assertPlainRecord(value, field, "INVALID_RESPONSE_STATE");
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const keys = Object.keys(descriptors);
      items += keys.length;
      if (items > STATE_LIMITS.maxItems) reject("state exceeds its item budget", "RESPONSE_STATE_RESOURCE_LIMIT");
      output = {};
      for (const key of keys) {
        if (FORBIDDEN_KEYS.has(key)) reject(`${field}.${key} is not permitted`, "INVALID_RESPONSE_STATE", { field: `${field}.${key}` });
        output[key] = visit(descriptors[key].value, `${field}.${key}`, depth + 1);
      }
    }
    ancestors.delete(value);
    return output;
  }

  const normalized = visit(input, "state", 0);
  if (Buffer.byteLength(canonicalStringify(normalized), "utf8") > STATE_LIMITS.maxBytes) reject("state exceeds its byte budget", "RESPONSE_STATE_RESOURCE_LIMIT");
  return immutable(normalized);
}

function normalizeLabel(value, index) {
  const field = `response.candidates[${index}].label`;
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.normalize("NFC") ||
    value !== value.trim() ||
    /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/u.test(value) ||
    Buffer.byteLength(value, "utf8") > RESPONSE_LIMITS.maxLabelBytes
  ) reject("candidate label is invalid", "CANDIDATE_LABEL_INVALID", { index, field });
  return value;
}

function normalizeNutrient(value, index, field) {
  if (value === undefined || value === null) return null;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Object.is(value, -0) ||
    value < 0 ||
    value > RESPONSE_LIMITS.maxNutrientValue
  ) reject("candidate nutrient must be finite, non-negative, and within the technical range", "CANDIDATE_NUTRIENT_INVALID", { index, field });
  return value;
}

function normalizeCandidate(candidate, index) {
  assertExactKeys(candidate, ["label", "nutrients"], ["confidence"], `response.candidates[${index}]`, "CANDIDATE_INVALID");
  assertPlainRecord(candidate.nutrients, `response.candidates[${index}].nutrients`, "CANDIDATE_NUTRIENTS_INVALID");
  for (const field of Object.keys(candidate.nutrients)) {
    if (!NUTRIENT_FIELDS.includes(field) || FORBIDDEN_KEYS.has(field)) reject("candidate nutrients have an unknown field", "CANDIDATE_NUTRIENTS_UNKNOWN_FIELD", { index, field });
  }
  const nutrients = Object.fromEntries(NUTRIENT_FIELDS.map((field) => [field, normalizeNutrient(candidate.nutrients[field], index, field)]));
  if (
    candidate.confidence !== undefined &&
    (typeof candidate.confidence !== "number" || !Number.isFinite(candidate.confidence) || Object.is(candidate.confidence, -0) || candidate.confidence < 0 || candidate.confidence > 1)
  ) reject("candidate confidence is invalid", "CANDIDATE_CONFIDENCE_INVALID", { index });
  return immutable({
    label: normalizeLabel(candidate.label, index),
    nutrients: immutable(nutrients),
    confidence: candidate.confidence ?? null,
  });
}

function parseAiResponse(input) {
  if (typeof input !== "string") reject("response must be UTF-8 JSON text", "RESPONSE_NOT_TEXT");
  if (Buffer.byteLength(input, "utf8") > RESPONSE_LIMITS.maxBytes) reject("response exceeds byte budget", "RESPONSE_BYTE_LIMIT");
  let value;
  try {
    value = parseManifestPreAuth(input, {
      maxManifestBytes: RESPONSE_LIMITS.maxBytes,
      maxJsonDepth: RESPONSE_LIMITS.maxDepth,
      maxObjectKeys: RESPONSE_LIMITS.maxObjectKeys,
      maxArrayItems: RESPONSE_LIMITS.maxItems,
      maxStringBytes: RESPONSE_LIMITS.maxStringLength,
    });
  } catch (cause) {
    if (cause?.code === "DUPLICATE_JSON_KEY") reject("response contains a duplicate JSON key", "RESPONSE_DUPLICATE_JSON_KEY");
    if (cause?.code === "JSON_DEPTH_LIMIT") reject("response exceeds JSON depth budget", "RESPONSE_DEPTH_LIMIT");
    if (["JSON_OBJECT_KEY_LIMIT", "JSON_ARRAY_ITEM_LIMIT"].includes(cause?.code)) reject("response exceeds item budget", "RESPONSE_ITEM_LIMIT");
    if (cause?.code === "JSON_STRING_LIMIT") reject("response string exceeds budget", "RESPONSE_STRING_LIMIT");
    if (cause?.code === "NON_FINITE_JSON_NUMBER") reject("response contains a non-finite number", "RESPONSE_NUMBER_INVALID");
    if (cause?.code === "INVALID_MANIFEST") reject("response root must be an object", "RESPONSE_ROOT_INVALID");
    reject("response is malformed JSON", "RESPONSE_INVALID_JSON");
  }
  assertExactKeys(value, ["schemaVersion", "candidates"], [], "response", "RESPONSE_UNKNOWN_FIELD");
  if (value.schemaVersion !== 1) reject("response schema is unsupported", "RESPONSE_SCHEMA_INVALID");
  if (!Array.isArray(value.candidates)) reject("response candidates must be an array", "RESPONSE_SCHEMA_INVALID");
  if (value.candidates.length < 1 || value.candidates.length > RESPONSE_LIMITS.maxItems) reject("response must contain a bounded non-empty candidate set", "RESPONSE_CANDIDATE_COUNT_INVALID");
  const candidates = immutable(value.candidates.map(normalizeCandidate));
  const core = immutable({ schemaVersion: 1, candidates });
  return immutable({ ...core, responseFingerprint: fingerprint(core) });
}

function normalizeValidationInput(input) {
  assertExactKeys(input, ["responseText"], ["state"], "request", "INVALID_RESPONSE_VALIDATION_REQUEST");
  return {
    responseText: input.responseText,
    state: normalizePassiveState(Object.hasOwn(input, "state") ? input.state : { records: [] }),
  };
}

function validateResponseCandidate(input) {
  const { responseText, state } = normalizeValidationInput(input);
  try {
    return immutable({
      status: "CANDIDATE",
      response: parseAiResponse(responseText),
      state,
      persisted: false,
      error: null,
      boundary: BOUNDARY,
    });
  } catch (error) {
    const code = typeof error?.code === "string" && SAFE_ERROR_CODE.test(error.code) ? error.code : "RESPONSE_INVALID";
    return immutable({
      status: "BLOCKED",
      response: null,
      state,
      persisted: false,
      error: { code },
      boundary: BOUNDARY,
    });
  }
}

export { BOUNDARY, NUTRIENT_FIELDS, RESPONSE_LIMITS, STATE_LIMITS, parseAiResponse, validateResponseCandidate };
