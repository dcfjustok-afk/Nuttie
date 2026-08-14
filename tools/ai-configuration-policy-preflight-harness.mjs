import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { normalizeActiveAIConfigurationEvidence } from "./ai-credential-lifecycle-harness.mjs";
import { normalizeAiRequestEvidenceContext } from "./ai-request-evidence-context-harness.mjs";

const BOUNDARY = Object.freeze({
  schemaVersion: "AI_CONFIGURATION_POLICY_PREFLIGHT_BOUNDARY_V1",
  contractStatus: "SPIKE_LOCAL_ONLY_NON_PRODUCTION",
  credentialMaterialRead: false,
  authorizationHeaderBuilt: false,
  sensitiveBodySerialized: false,
  transportCreated: false,
  networkRequests: 0,
  businessWrites: 0,
  providerIdentityFromConfiguration: "NOT_AVAILABLE_USE_POLICY_SUBJECT_PROFILE_BINDING",
  d036TransportProfileAuthorized: false,
  sendAuthorization: "NOT_GRANTED",
});

function fail(message, code = "INVALID_AI_CONFIGURATION_POLICY_PREFLIGHT", details = {}) {
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
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${field}.${key} is unsupported`, undefined, { field: `${field}.${key}` });
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

function evaluateAIConfigurationPolicyPreflight(input) {
  assertExactKeys(input, ["configurationEvidence", "requestContext"], "preflightInput");
  let configurationEvidence;
  let requestContext;
  try {
    configurationEvidence = normalizeActiveAIConfigurationEvidence(input.configurationEvidence);
    requestContext = normalizeAiRequestEvidenceContext(input.requestContext);
  } catch (cause) {
    fail("preflight evidence is invalid", undefined, { cause });
  }
  const config = configurationEvidence.activeConfig;
  const subject = requestContext.policySubject;
  const comparisons = immutable({
    baseURLMatched: config.baseURL === subject.baseURL,
    originMatched: config.origin === subject.origin,
    modelMatched: config.model === subject.model,
  });
  const endpointConfigurationMatched = Object.values(comparisons).every(Boolean);
  const blockers = immutable([
    ...(endpointConfigurationMatched ? [] : ["CONFIGURATION_SUBJECT_MISMATCH"]),
    "PROVIDER_IDENTITY_NOT_BOUND_TO_CONFIGURATION",
    "D033_CONFIRMATION_SCOPE_NOT_EVALUATED",
    "D034_RESOURCE_PROFILE_NOT_AUTHORIZED",
    "D036_TRANSPORT_PROFILE_NOT_AUTHORIZED",
    "D053_NOT_AUTHORIZED",
  ]);
  const core = immutable({
    schemaVersion: "AI_CONFIGURATION_POLICY_PREFLIGHT_RESULT_V1",
    disposition: "BLOCKED",
    reason: blockers[0],
    blockers,
    endpointConfigurationMatched,
    providerIdentityBoundToConfiguration: false,
    comparisons,
    configurationEvidenceFingerprint: configurationEvidence.evidenceFingerprint,
    requestContextFingerprint: requestContext.contextFingerprint,
    policySubjectFingerprint: subject.subjectFingerprint,
    policyProfileFingerprint: requestContext.policyProfile.profileFingerprint,
    authorizationFingerprint: requestContext.authorizationEvidence.authorizationFingerprint,
    policyCheckFingerprint: requestContext.policyCheck.resultFingerprint,
    installationGeneration: configurationEvidence.installationGeneration,
    configurationRevision: configurationEvidence.configurationRevision,
    credentialRef: config.credentialRef,
    providerId: subject.providerId,
    payloadClass: subject.payloadClass,
    region: subject.region,
    sendAuthorized: false,
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateAIConfigurationPolicyPreflightResult(result, input) {
  assertExactKeys(
    result,
    [
      "schemaVersion",
      "disposition",
      "reason",
      "blockers",
      "endpointConfigurationMatched",
      "providerIdentityBoundToConfiguration",
      "comparisons",
      "configurationEvidenceFingerprint",
      "requestContextFingerprint",
      "policySubjectFingerprint",
      "policyProfileFingerprint",
      "authorizationFingerprint",
      "policyCheckFingerprint",
      "installationGeneration",
      "configurationRevision",
      "credentialRef",
      "providerId",
      "payloadClass",
      "region",
      "sendAuthorized",
      "boundary",
      "resultFingerprint",
    ],
    "result",
  );
  const expected = evaluateAIConfigurationPolicyPreflight(input);
  if (!isDeepStrictEqual(result, expected)) fail("preflight result or fingerprint was changed");
  return expected;
}

export {
  BOUNDARY,
  evaluateAIConfigurationPolicyPreflight,
  validateAIConfigurationPolicyPreflightResult,
};
