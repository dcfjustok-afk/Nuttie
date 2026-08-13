import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import {
  normalizeD053AuthorizationEvidence,
  normalizePolicyCheckSubject,
  normalizeProviderPolicyProfile,
  policyCheck,
} from "./ai-policy-harness.mjs";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const BOUNDARY = Object.freeze({
  schemaVersion: "AI_REQUEST_EVIDENCE_BOUNDARY_V1",
  evidenceKind: "CALLER_SUPPLIED_UNTRUSTED_RESPONSE_FIXTURE",
  transportOccurrence: "NOT_ESTABLISHED",
  sendAuthorization: "NOT_GRANTED",
  downstreamUse: "PROVENANCE_ONLY",
  networkRequests: 0,
});

function fail(message, code = "INVALID_AI_REQUEST_EVIDENCE_CONTEXT", details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${field} must be a plain record`, undefined, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail(`${field} must be a plain record`, undefined, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) fail(`${field} contains symbol properties`, undefined, { field });
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!descriptor.enumerable || descriptor.get || descriptor.set) fail(`${field}.${key} is not a data property`, undefined, { field: `${field}.${key}` });
  }
}

function assertExactKeys(value, required, field) {
  assertPlainRecord(value, field);
  const allowed = new Set(required);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) {
      fail(`${field}.${key} is unsupported`, undefined, { field: `${field}.${key}` });
    }
  }
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, undefined, { field: `${field}.${key}` });
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

function identifier(value, field) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, undefined, { field });
  return value;
}

function normalizeTransportProfileVersion(value, field) {
  return identifier(value, field);
}

function normalizePolicyEvidence({ subject, profile, authorizationEvidence }, field) {
  try {
    const normalizedSubject = normalizePolicyCheckSubject(subject);
    const normalizedProfile = normalizeProviderPolicyProfile(profile);
    const normalizedAuthorization = normalizeD053AuthorizationEvidence(authorizationEvidence);
    const check = policyCheck({
      subject: normalizedSubject,
      profile: normalizedProfile,
      authorizationEvidence: normalizedAuthorization,
    });
    if (
      check.eligible !== false ||
      check.reason !== "D053_NOT_AUTHORIZED" ||
      check.authorizationGranted !== false ||
      check.scopeMatched !== true ||
      check.appleProhibitedUseAbsent !== true ||
      check.profileStateAllows !== true ||
      typeof check.resultFingerprint !== "string"
    ) fail(`${field} must preserve the current D-053 blocked truth`, undefined, { field });
    return immutable({
      subject: normalizedSubject,
      profile: normalizedProfile,
      authorizationEvidence: normalizedAuthorization,
      policyCheck: check,
    });
  } catch (cause) {
    if (cause?.code === "INVALID_AI_REQUEST_EVIDENCE_CONTEXT") throw cause;
    fail(`${field} is invalid`, undefined, { field, cause });
  }
}

function createAiRequestEvidenceContext(input) {
  assertExactKeys(
    input,
    ["schemaVersion", "requestId", "transportProfileVersion", "subject", "profile", "authorizationEvidence"],
    "contextInput",
  );
  if (input.schemaVersion !== "AI_REQUEST_EVIDENCE_CONTEXT_INPUT_V2") {
    fail("contextInput.schemaVersion is unsupported", undefined, { field: "contextInput.schemaVersion" });
  }
  const evidence = normalizePolicyEvidence(input, "contextInput.policyEvidence");
  const core = immutable({
    schemaVersion: "AI_REQUEST_EVIDENCE_CONTEXT_V2",
    requestId: identifier(input.requestId, "contextInput.requestId"),
    transportProfileVersion: normalizeTransportProfileVersion(input.transportProfileVersion, "contextInput.transportProfileVersion"),
    policySubject: evidence.subject,
    policyProfile: evidence.profile,
    authorizationEvidence: evidence.authorizationEvidence,
    policyCheck: evidence.policyCheck,
    boundary: BOUNDARY,
  });
  return immutable({ ...core, contextFingerprint: fingerprint(core) });
}

function normalizeAiRequestEvidenceContext(input, field = "context") {
  assertExactKeys(
    input,
    [
      "schemaVersion", "requestId", "transportProfileVersion", "policySubject", "policyProfile",
      "authorizationEvidence", "policyCheck", "boundary", "contextFingerprint",
    ],
    field,
  );
  if (input.schemaVersion !== "AI_REQUEST_EVIDENCE_CONTEXT_V2") {
    fail(`${field}.schemaVersion is unsupported`, undefined, { field: `${field}.schemaVersion` });
  }
  const expected = createAiRequestEvidenceContext({
    schemaVersion: "AI_REQUEST_EVIDENCE_CONTEXT_INPUT_V2",
    requestId: input.requestId,
    transportProfileVersion: input.transportProfileVersion,
    subject: input.policySubject,
    profile: input.policyProfile,
    authorizationEvidence: input.authorizationEvidence,
  });
  if (!isDeepStrictEqual(input, expected)) fail(`${field} or its fingerprints were changed`, undefined, { field });
  return expected;
}

export {
  BOUNDARY,
  createAiRequestEvidenceContext,
  normalizeAiRequestEvidenceContext,
};
