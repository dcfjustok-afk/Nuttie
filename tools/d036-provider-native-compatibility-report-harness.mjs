import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import {
  evaluateOi07ProviderTargetIntake,
  normalizeOi07ProviderTargetIntake,
  validateOi07ProviderTargetIntakeResult,
} from "./oi07-provider-target-intake-harness.mjs";

const INPUT_SCHEMA_VERSION = "D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_INPUT_V1";
const ATTEMPT_SCHEMA_VERSION = "D036_PROVIDER_NATIVE_COMPATIBILITY_ATTEMPT_V1";
const RESULT_SCHEMA_VERSION = "D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_RESULT_V1";
const BOUNDARY_SCHEMA_VERSION = "D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT_BOUNDARY_V1";
const CONTRACT_ID = "D036-PROVIDER-NATIVE-COMPATIBILITY-REPORT-CONTRACT-001";

const PROTOCOL_ID = "D036-PROVIDER-NATIVE-COMPATIBILITY-SPIKE-PROTOCOL-001";
const PROTOCOL_REVISION = "D036-PROTOCOL-R001";
const PROTOCOL_ARTIFACT_COMMIT = "a21110dc651cad83b0c77e4fee5f2e96ac51ef88";
const PROTOCOL_ARTIFACT_BLOB_OID = "c72ae3f053f7beaa5ab2cea8fa730ab2b18c82c1";
const PROTOCOL_ARTIFACT_SHA256 = "381059a017ec9284b56c49c92e9fcd6f0e36959996deb1897a788275af47f2dd";
const SOURCE_PACKET_VERSION = "PACKET-001-R1";
const SOURCE_CARD_COMMIT = "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117";
const SOURCE_CARD_BLOB_OID = "3bc58cebfb45e2046891fb774bc242fe69ee5b30";
const SOURCE_CARD_SHA256 = "fdfe2fdebce62e4bc7e31e4ba8b358d9780e4b93377907ecd780bcd4dfcdb7ab";

const PROVIDER_SLOTS = Object.freeze(["P1", "P2", "P3"]);
const PROFILE_IDS = Object.freeze([
  "strict_ephemeral_no_redirect",
  "confirmed_query_same_origin_redirect",
  "rn_fetch_after_native_boundary_proof",
]);
const BUILD_CONFIGURATIONS = Object.freeze(["DEBUG", "RELEASE"]);
const RUNTIME_TARGETS = Object.freeze(["IOS_SIMULATOR", "PHYSICAL_IPHONE"]);
const PATH_KINDS = Object.freeze(["NORMAL", "CANCEL", "EXPECTED_ERROR"]);
const OFFLINE_SCENARIO_FAMILY_IDS = Object.freeze([
  "URL_PARSE",
  "QUERY",
  "REDIRECT_STATUS",
  "REDIRECT_ORIGIN",
  "METHOD_BODY",
  "AUTH_TLS",
  "COOKIE_CACHE_CREDENTIAL",
  "LIFECYCLE",
  "OBSERVABILITY",
]);
const NATIVE_BOUNDARY_SURFACE_IDS = Object.freeze([
  "NB-01_URL_CANONICALIZATION",
  "NB-02_REDIRECT_INTERCEPTION",
  "NB-03_METHOD_BODY_PRESERVATION",
  "NB-04_ORIGIN_AUTHORIZATION",
  "NB-05_COOKIE_ISOLATION",
  "NB-06_CACHE_ISOLATION",
  "NB-07_CREDENTIAL_ISOLATION",
  "NB-08_TLS_TRUST",
  "NB-09_CANCEL_TIMEOUT_INVALIDATE",
  "NB-10_STREAM_AND_BUDGET",
  "NB-11_BACKGROUND_KILL_RESTART",
  "NB-12_LOG_CAPTURE_PRIVACY",
  "NB-13_RN_FETCH_CAPABILITY",
]);

const CELL_DISPOSITIONS = Object.freeze([
  "COMPATIBLE_WITH_CANDIDATE_PROFILE",
  "INCOMPATIBLE_BY_DOCUMENTED_REQUIREMENT",
  "INCOMPATIBLE_BY_OBSERVATION",
  "INCONCLUSIVE_EVIDENCE_GAP",
  "NOT_EXECUTED",
]);
const ATTEMPT_DISPOSITIONS = Object.freeze([
  "SUCCEEDED",
  "CANCELLED",
  "EXPECTED_ERROR",
  "DOCUMENTED_INCOMPATIBILITY",
  "BOUNDARY_VIOLATION",
  "FAILED",
  "TIMED_OUT",
  "UNKNOWN_RESULT",
]);
const NATIVE_STATES = Object.freeze(["PROVEN", "NOT_PROVEN", "NOT_APPLICABLE_WITH_REASON"]);
const OVERALL_DISPOSITIONS = Object.freeze(["MEASURED_REVIEW_REQUIRED", "FAIL", "INCONCLUSIVE"]);

const STATE_ISOLATION_FIELDS = Object.freeze([
  "automaticCookieSendCount",
  "sharedCacheReadCount",
  "sharedCredentialReadCount",
  "persistentCookieWriteCount",
  "persistentCacheWriteCount",
  "persistentCredentialWriteCount",
  "crossAttemptStateReuseCount",
]);
const LIFECYCLE_FIELDS = Object.freeze([
  "automaticRetryCount",
  "businessWriteCount",
  "terminalTemporaryObjectCount",
  "terminalTemporaryFileCount",
  "lateCallbackMutationCount",
]);

const BOUNDARY = deepFreeze({
  schemaVersion: BOUNDARY_SCHEMA_VERSION,
  contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
  oi07Reads: 0,
  providerDocumentReads: 0,
  attemptRecordReads: 0,
  attemptRecordWrites: 0,
  captureArtifactReads: 0,
  nativeArtifactReads: 0,
  networkRequests: 0,
  providerRequests: 0,
  credentialReads: 0,
  credentialWrites: 0,
  businessWrites: 0,
  externalMessagesSent: 0,
  oi07Complete: false,
  providerTargetsResolved: false,
  macAndSupportedXcodeAvailable: false,
  physicalIphoneAvailableForHarness: false,
  isolatedNativeHarnessAuthorized: false,
  syntheticCorpusMaterialized: false,
  realNetworkSpikeAuthorized: false,
  credentialInjectionAuthorized: false,
  spikeExecutionStarted: false,
  providerCompatibilityReportRecorded: false,
  providerCompatibilitySpikePassed: false,
  nativeBoundaryEvidenceRecorded: false,
  nativeBoundaryEvidencePassed: false,
  independentReviewPassed: false,
  ownerReviewAuthorized: false,
  ownerChoiceRecorded: false,
  decisionAcceptedRecorded: false,
  b05Closed: false,
  d032SecondOwnerActionSatisfied: false,
  formalRootProjectAuthorized: false,
  nativeIosWorkAuthorized: false,
  realNetworkAuthorized: false,
  formalImplementationAuthorized: false,
  px5ImplementationDorSatisfied: false,
});

function fail(message, code = "INVALID_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT", details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function deepFreeze(value, seen = new Set()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(value);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function withoutField(value, field) {
  const copy = { ...value };
  delete copy[field];
  return copy;
}

function assertDataTree(value, field = "input", depth = 0, ancestors = new Set(), budget = { nodes: 0 }) {
  budget.nodes += 1;
  if (budget.nodes > 1_000_000 || depth > 18) fail("input resource boundary exceeded", undefined, { field });
  if (typeof value === "string") {
    if (value.length > 4_096) fail("string resource boundary exceeded", undefined, { field });
    if (
      /sk-[a-z0-9_-]{8,}/i.test(value) ||
      /bearer\s+\S+/i.test(value) ||
      /(?:api[_-]?key|authorization|password|secret)\s*[:=]/i.test(value) ||
      /https?:\/\/[^\s?#]+[?&](?:key|token|signature|authorization|password|secret)=/i.test(value) ||
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(value)
    ) {
      fail("sensitive-looking material is forbidden", "UNSAFE_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT", { field });
    }
    return;
  }
  if (value === null || ["boolean", "number"].includes(typeof value)) return;
  if (["undefined", "bigint", "function", "symbol"].includes(typeof value)) {
    fail("unsupported input value", undefined, { field });
  }
  if (ancestors.has(value)) fail("cyclic input is forbidden", undefined, { field });
  if (Array.isArray(value)) {
    if (value.length > 50_000) fail("array resource boundary exceeded", undefined, { field });
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (key === "length") continue;
      if (!descriptor.enumerable || descriptor.get || descriptor.set) {
        fail("array contains non-data properties", undefined, { field });
      }
    }
    if (Object.getOwnPropertySymbols(value).length > 0) fail("symbol keys are forbidden", undefined, { field });
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) fail("special objects are forbidden", undefined, { field });
    if (Object.getOwnPropertySymbols(value).length > 0) fail("symbol keys are forbidden", undefined, { field });
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
      if (!descriptor.enumerable || descriptor.get || descriptor.set) {
        fail("object contains non-data properties", undefined, { field });
      }
    }
  }
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) {
    assertDataTree(child, `${field}.${key}`, depth + 1, ancestors, budget);
  }
  ancestors.delete(value);
}

function assertExactKeys(value, expectedKeys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("plain object required", undefined, { field });
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (!isDeepStrictEqual(actual, expected)) fail("object fields do not match the contract", undefined, { field });
}

function normalizeString(value, field, maxLength = 256) {
  if (typeof value !== "string") fail("string required", undefined, { field });
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) fail("invalid string length", undefined, { field });
  return normalized;
}

function normalizePattern(value, field, pattern, maxLength = 256, allowUnknown = false) {
  const normalized = normalizeString(value, field, maxLength);
  if (allowUnknown && normalized === "UNKNOWN") return normalized;
  if (!pattern.test(normalized)) fail("string does not match the contract", undefined, { field });
  return normalized;
}

function normalizeEnum(value, allowed, field) {
  const normalized = normalizeString(value, field);
  if (!allowed.includes(normalized)) fail("unsupported enum value", undefined, { field });
  return normalized;
}

function normalizeSha256(value, field, allowUnknown = false) {
  return normalizePattern(value, field, /^[a-f0-9]{64}$/, 64, allowUnknown);
}

function normalizeSafeInteger(value, field, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) fail("non-negative safe integer required", undefined, { field });
  return value;
}

function normalizeFiniteNumber(value, field, minimum = 0) {
  if (!Number.isFinite(value) || value < minimum) fail("finite number required", undefined, { field });
  return value;
}

function isValidTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  return calendarDate.getUTCFullYear() === year &&
    calendarDate.getUTCMonth() === month - 1 &&
    calendarDate.getUTCDate() === day &&
    Number(hourText) <= 23 &&
    Number(minuteText) <= 59 &&
    Number(secondText) <= 59 &&
    (offsetHourText === undefined || (Number(offsetHourText) <= 23 && Number(offsetMinuteText) <= 59)) &&
    Number.isFinite(Date.parse(value));
}

function normalizeTimestamp(value, field, allowUnknown = false) {
  const normalized = normalizeString(value, field, 64);
  if (allowUnknown && normalized === "UNKNOWN") return normalized;
  if (!isValidTimestamp(normalized)) fail("RFC 3339 timestamp required", undefined, { field });
  return normalized;
}

function normalizeOrderedSubset(value, allowed, field, { requireExact = false } = {}) {
  if (!Array.isArray(value) || value.length < 1 || value.length > allowed.length) {
    fail("ordered non-empty subset required", undefined, { field });
  }
  const normalized = value.map((item, index) => normalizeEnum(item, allowed, `${field}[${index}]`));
  if (new Set(normalized).size !== normalized.length) fail("duplicate ordered subset value", undefined, { field });
  const expected = allowed.filter((item) => normalized.includes(item));
  if (!isDeepStrictEqual(normalized, expected) || (requireExact && !isDeepStrictEqual(normalized, allowed))) {
    fail("ordered subset changed", undefined, { field });
  }
  return normalized;
}

function normalizeIdArray(value, field, pattern, maximum = 10_000) {
  if (!Array.isArray(value) || value.length > maximum) fail("bounded array required", undefined, { field });
  const normalized = value.map((item, index) => normalizePattern(item, `${field}[${index}]`, pattern, 128));
  if (new Set(normalized).size !== normalized.length) fail("duplicate array value", undefined, { field });
  return normalized;
}

function normalizeProtocolIdentity(value) {
  assertExactKeys(value, [
    "protocolId", "protocolRevision", "protocolArtifactCommit", "protocolArtifactBlobOid", "protocolArtifactSha256",
    "sourcePacketVersion", "sourceCardCommit", "sourceCardBlobOid", "sourceCardSha256",
  ], "protocolIdentity");
  const normalized = {
    protocolId: normalizeString(value.protocolId, "protocolIdentity.protocolId"),
    protocolRevision: normalizeString(value.protocolRevision, "protocolIdentity.protocolRevision"),
    protocolArtifactCommit: normalizePattern(value.protocolArtifactCommit, "protocolIdentity.protocolArtifactCommit", /^[a-f0-9]{40}$/, 40),
    protocolArtifactBlobOid: normalizePattern(value.protocolArtifactBlobOid, "protocolIdentity.protocolArtifactBlobOid", /^[a-f0-9]{40}$/, 40),
    protocolArtifactSha256: normalizeSha256(value.protocolArtifactSha256, "protocolIdentity.protocolArtifactSha256"),
    sourcePacketVersion: normalizeString(value.sourcePacketVersion, "protocolIdentity.sourcePacketVersion"),
    sourceCardCommit: normalizePattern(value.sourceCardCommit, "protocolIdentity.sourceCardCommit", /^[a-f0-9]{40}$/, 40),
    sourceCardBlobOid: normalizePattern(value.sourceCardBlobOid, "protocolIdentity.sourceCardBlobOid", /^[a-f0-9]{40}$/, 40),
    sourceCardSha256: normalizeSha256(value.sourceCardSha256, "protocolIdentity.sourceCardSha256"),
  };
  const expected = {
    protocolId: PROTOCOL_ID,
    protocolRevision: PROTOCOL_REVISION,
    protocolArtifactCommit: PROTOCOL_ARTIFACT_COMMIT,
    protocolArtifactBlobOid: PROTOCOL_ARTIFACT_BLOB_OID,
    protocolArtifactSha256: PROTOCOL_ARTIFACT_SHA256,
    sourcePacketVersion: SOURCE_PACKET_VERSION,
    sourceCardCommit: SOURCE_CARD_COMMIT,
    sourceCardBlobOid: SOURCE_CARD_BLOB_OID,
    sourceCardSha256: SOURCE_CARD_SHA256,
  };
  if (!isDeepStrictEqual(normalized, expected)) fail("protocol identity changed", undefined, { field: "protocolIdentity" });
  return normalized;
}

function normalizeMatrixScope(value, recordKind) {
  assertExactKeys(value, [
    "providerSlots", "candidateProfileIds", "buildConfigurations", "runtimeTargets",
    "requiredCompatibilityCellCount", "offlineScenarioFamilyIds", "nativeBoundarySurfaceIds",
  ], "matrixScope");
  const exact = recordKind === "FORMAL_SPIKE_REPORT";
  const normalized = {
    providerSlots: normalizeOrderedSubset(value.providerSlots, PROVIDER_SLOTS, "matrixScope.providerSlots", { requireExact: exact }),
    candidateProfileIds: normalizeOrderedSubset(value.candidateProfileIds, PROFILE_IDS, "matrixScope.candidateProfileIds", { requireExact: exact }),
    buildConfigurations: normalizeOrderedSubset(value.buildConfigurations, BUILD_CONFIGURATIONS, "matrixScope.buildConfigurations", { requireExact: exact }),
    runtimeTargets: normalizeOrderedSubset(value.runtimeTargets, RUNTIME_TARGETS, "matrixScope.runtimeTargets", { requireExact: exact }),
    requiredCompatibilityCellCount: normalizeSafeInteger(value.requiredCompatibilityCellCount, "matrixScope.requiredCompatibilityCellCount", 1),
    offlineScenarioFamilyIds: normalizeOrderedSubset(value.offlineScenarioFamilyIds, OFFLINE_SCENARIO_FAMILY_IDS, "matrixScope.offlineScenarioFamilyIds", { requireExact: exact }),
    nativeBoundarySurfaceIds: normalizeOrderedSubset(value.nativeBoundarySurfaceIds, NATIVE_BOUNDARY_SURFACE_IDS, "matrixScope.nativeBoundarySurfaceIds", { requireExact: exact }),
  };
  const product = normalized.providerSlots.length * normalized.candidateProfileIds.length *
    normalized.buildConfigurations.length * normalized.runtimeTargets.length;
  if (normalized.requiredCompatibilityCellCount !== product || (exact && product !== 36)) {
    fail("required compatibility cell count changed", undefined, { field: "matrixScope.requiredCompatibilityCellCount" });
  }
  if (!exact && [
    normalized.providerSlots.length === PROVIDER_SLOTS.length,
    normalized.candidateProfileIds.length === PROFILE_IDS.length,
    normalized.buildConfigurations.length === BUILD_CONFIGURATIONS.length,
    normalized.runtimeTargets.length === RUNTIME_TARGETS.length,
    normalized.offlineScenarioFamilyIds.length === OFFLINE_SCENARIO_FAMILY_IDS.length,
    normalized.nativeBoundarySurfaceIds.length === NATIVE_BOUNDARY_SURFACE_IDS.length,
  ].every(Boolean)) {
    fail("synthetic fixture must use a proper subset of the formal matrix", undefined, { field: "matrixScope" });
  }
  return normalized;
}

function normalizeEnvironmentArtifact(value, index) {
  const field = `environmentArtifacts[${index}]`;
  assertExactKeys(value, [
    "environmentArtifactId", "buildConfiguration", "runtimeTarget", "macModelIdentifier", "macosVersion",
    "xcodeVersion", "iosSdkVersion", "runtimeModelIdentifier", "runtimeOsVersion", "runtimeOsBuild", "harnessCommit",
    "dependencyLockSha256", "compilerSettingsSha256", "harnessArtifactSha256", "bundleIdentifier", "signingClass",
    "networkCaptureToolAndVersion", "bootSessionId", "identityFingerprint",
  ], field);
  const normalized = {
    environmentArtifactId: normalizePattern(value.environmentArtifactId, `${field}.environmentArtifactId`, /^D036-ENV-[A-Z0-9._-]+$/, 96),
    buildConfiguration: normalizeEnum(value.buildConfiguration, BUILD_CONFIGURATIONS, `${field}.buildConfiguration`),
    runtimeTarget: normalizeEnum(value.runtimeTarget, RUNTIME_TARGETS, `${field}.runtimeTarget`),
    macModelIdentifier: normalizePattern(value.macModelIdentifier, `${field}.macModelIdentifier`, /^[A-Za-z0-9,._-]+$/, 64, true),
    macosVersion: normalizePattern(value.macosVersion, `${field}.macosVersion`, /^[A-Za-z0-9.() _-]+$/, 64, true),
    xcodeVersion: normalizePattern(value.xcodeVersion, `${field}.xcodeVersion`, /^[A-Za-z0-9.() _-]+$/, 64, true),
    iosSdkVersion: normalizePattern(value.iosSdkVersion, `${field}.iosSdkVersion`, /^[A-Za-z0-9.() _-]+$/, 64, true),
    runtimeModelIdentifier: normalizePattern(value.runtimeModelIdentifier, `${field}.runtimeModelIdentifier`, /^[A-Za-z0-9,._ -]+$/, 96, true),
    runtimeOsVersion: normalizePattern(value.runtimeOsVersion, `${field}.runtimeOsVersion`, /^[A-Za-z0-9.() _-]+$/, 64, true),
    runtimeOsBuild: normalizePattern(value.runtimeOsBuild, `${field}.runtimeOsBuild`, /^[A-Za-z0-9.() _-]+$/, 64, true),
    harnessCommit: normalizePattern(value.harnessCommit, `${field}.harnessCommit`, /^[a-f0-9]{40}$/, 40, true),
    dependencyLockSha256: normalizeSha256(value.dependencyLockSha256, `${field}.dependencyLockSha256`, true),
    compilerSettingsSha256: normalizeSha256(value.compilerSettingsSha256, `${field}.compilerSettingsSha256`, true),
    harnessArtifactSha256: normalizeSha256(value.harnessArtifactSha256, `${field}.harnessArtifactSha256`, true),
    bundleIdentifier: normalizePattern(value.bundleIdentifier, `${field}.bundleIdentifier`, /^[A-Za-z0-9.-]+$/, 128, true),
    signingClass: normalizePattern(value.signingClass, `${field}.signingClass`, /^[A-Z][A-Z0-9_ -]+$/, 64, true),
    networkCaptureToolAndVersion: normalizeString(value.networkCaptureToolAndVersion, `${field}.networkCaptureToolAndVersion`, 128),
    bootSessionId: normalizePattern(value.bootSessionId, `${field}.bootSessionId`, /^[A-Z0-9][A-Z0-9._-]+$/, 128, true),
    identityFingerprint: normalizeSha256(value.identityFingerprint, `${field}.identityFingerprint`),
  };
  const expectedFingerprint = fingerprint(withoutField(normalized, "identityFingerprint"));
  if (normalized.identityFingerprint !== expectedFingerprint) fail("environment identity fingerprint changed", undefined, { field });
  return normalized;
}

function normalizeEnvironmentArtifacts(value, matrixScope) {
  if (!Array.isArray(value)) fail("environmentArtifacts array required", undefined, { field: "environmentArtifacts" });
  const expectedPairs = matrixScope.buildConfigurations.flatMap((buildConfiguration) =>
    matrixScope.runtimeTargets.map((runtimeTarget) => ({ buildConfiguration, runtimeTarget })));
  if (value.length !== expectedPairs.length) fail("environment artifact matrix is incomplete", undefined, { field: "environmentArtifacts" });
  const normalized = value.map(normalizeEnvironmentArtifact);
  normalized.forEach((artifact, index) => {
    if (artifact.buildConfiguration !== expectedPairs[index].buildConfiguration || artifact.runtimeTarget !== expectedPairs[index].runtimeTarget) {
      fail("environment artifacts are out of protocol order", undefined, { field: `environmentArtifacts[${index}]` });
    }
  });
  const ids = normalized.map(({ environmentArtifactId }) => environmentArtifactId);
  if (new Set(ids).size !== ids.length) fail("environment artifact IDs must be unique", undefined, { field: "environmentArtifacts" });
  return normalized;
}

function normalizeCorpusIdentity(value) {
  assertExactKeys(value, [
    "corpusRevision", "fixtureCount", "manifestSha256", "canonicalByteCount", "corpusFingerprint",
    "containsRealUserData", "containsCredential", "containsProviderBody",
  ], "corpusIdentity");
  const normalized = {
    corpusRevision: normalizePattern(value.corpusRevision, "corpusIdentity.corpusRevision", /^D036-CORPUS-R\d{3}$/, 32),
    fixtureCount: normalizeSafeInteger(value.fixtureCount, "corpusIdentity.fixtureCount", 1),
    manifestSha256: normalizeSha256(value.manifestSha256, "corpusIdentity.manifestSha256"),
    canonicalByteCount: normalizeSafeInteger(value.canonicalByteCount, "corpusIdentity.canonicalByteCount", 1),
    corpusFingerprint: normalizeSha256(value.corpusFingerprint, "corpusIdentity.corpusFingerprint"),
    containsRealUserData: value.containsRealUserData,
    containsCredential: value.containsCredential,
    containsProviderBody: value.containsProviderBody,
  };
  if (normalized.containsRealUserData !== false || normalized.containsCredential !== false || normalized.containsProviderBody !== false) {
    fail("corpus contains forbidden material", "UNSAFE_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT", { field: "corpusIdentity" });
  }
  if (normalized.corpusFingerprint !== fingerprint(withoutField(normalized, "corpusFingerprint"))) {
    fail("corpus fingerprint changed", undefined, { field: "corpusIdentity.corpusFingerprint" });
  }
  return normalized;
}

function normalizeExecutionAuthorization(value, recordKind, matrixScope) {
  assertExactKeys(value, [
    "authorizationId", "authorizerRef", "authorizedAt", "expiresAt", "allowedProviderSlots", "allowedAttemptPaths",
    "maximumTotalCost", "currency", "credentialInjectionMethodRef", "callerAssertedAuthorized",
    "realNetworkAuthorized", "credentialInjectionAuthorized", "authorizationFingerprint",
  ], "executionAuthorization");
  const normalized = {
    authorizationId: normalizePattern(value.authorizationId, "executionAuthorization.authorizationId", /^[A-Z0-9][A-Z0-9._-]+$/, 128),
    authorizerRef: normalizePattern(value.authorizerRef, "executionAuthorization.authorizerRef", /^[A-Z0-9][A-Z0-9._-]+$/, 128, true),
    authorizedAt: normalizeTimestamp(value.authorizedAt, "executionAuthorization.authorizedAt", true),
    expiresAt: normalizeTimestamp(value.expiresAt, "executionAuthorization.expiresAt", true),
    allowedProviderSlots: normalizeOrderedSubset(value.allowedProviderSlots, PROVIDER_SLOTS, "executionAuthorization.allowedProviderSlots"),
    allowedAttemptPaths: normalizeOrderedSubset(value.allowedAttemptPaths, PATH_KINDS, "executionAuthorization.allowedAttemptPaths", { requireExact: true }),
    maximumTotalCost: normalizeFiniteNumber(value.maximumTotalCost, "executionAuthorization.maximumTotalCost"),
    currency: normalizePattern(value.currency, "executionAuthorization.currency", /^(?:[A-Z]{3}|NONE)$/, 4),
    credentialInjectionMethodRef: normalizePattern(value.credentialInjectionMethodRef, "executionAuthorization.credentialInjectionMethodRef", /^[A-Z0-9][A-Z0-9._-]+$/, 128, true),
    callerAssertedAuthorized: value.callerAssertedAuthorized,
    realNetworkAuthorized: value.realNetworkAuthorized,
    credentialInjectionAuthorized: value.credentialInjectionAuthorized,
    authorizationFingerprint: normalizeSha256(value.authorizationFingerprint, "executionAuthorization.authorizationFingerprint"),
  };
  for (const booleanField of ["callerAssertedAuthorized", "realNetworkAuthorized", "credentialInjectionAuthorized"]) {
    if (typeof normalized[booleanField] !== "boolean") fail("boolean required", undefined, { field: `executionAuthorization.${booleanField}` });
  }
  if (!isDeepStrictEqual(normalized.allowedProviderSlots, matrixScope.providerSlots)) {
    fail("authorization Provider slots do not match the matrix", undefined, { field: "executionAuthorization.allowedProviderSlots" });
  }
  if (normalized.currency === "NONE" && normalized.maximumTotalCost !== 0) {
    fail("NONE currency requires zero cost", undefined, { field: "executionAuthorization.maximumTotalCost" });
  }
  if (recordKind === "SYNTHETIC_CONTRACT_FIXTURE") {
    if (
      normalized.authorizationId !== "SYNTHETIC_CONTRACT_ONLY" ||
      normalized.maximumTotalCost !== 0 ||
      normalized.currency !== "NONE" ||
      normalized.callerAssertedAuthorized ||
      normalized.realNetworkAuthorized ||
      normalized.credentialInjectionAuthorized
    ) {
      fail("synthetic fixture cannot contain execution authorization", undefined, { field: "executionAuthorization" });
    }
  }
  if (normalized.authorizationFingerprint !== fingerprint(withoutField(normalized, "authorizationFingerprint"))) {
    fail("execution authorization fingerprint changed", undefined, { field: "executionAuthorization.authorizationFingerprint" });
  }
  return normalized;
}

function environmentFor(environmentArtifacts, buildConfiguration, runtimeTarget, environmentArtifactId, field) {
  const artifact = environmentArtifacts.find((candidate) => candidate.environmentArtifactId === environmentArtifactId);
  if (!artifact || artifact.buildConfiguration !== buildConfiguration || artifact.runtimeTarget !== runtimeTarget) {
    fail("environment artifact does not match build/runtime", undefined, { field });
  }
  return artifact;
}

function cellDescriptors(matrixScope, cells) {
  const expected = matrixScope.providerSlots.flatMap((providerSlot) => matrixScope.candidateProfileIds.flatMap((candidateProfileId) =>
    matrixScope.buildConfigurations.flatMap((buildConfiguration) => matrixScope.runtimeTargets.map((runtimeTarget) => ({
      providerSlot,
      candidateProfileId,
      buildConfiguration,
      runtimeTarget,
    })))));
  if (!Array.isArray(cells) || cells.length !== expected.length) {
    fail("compatibility cell matrix is incomplete", undefined, { field: "compatibilityCells" });
  }
  return expected;
}

function attemptIdentityCore(bundle, descriptor, environmentArtifact) {
  return {
    protocolIdentity: bundle.protocolIdentity,
    oi07Revision: bundle.oi07Intake.oi07Revision,
    oi07InputFingerprint: bundle.oi07IntakeResult.inputFingerprint,
    oi07ResultFingerprint: bundle.oi07IntakeResult.resultFingerprint,
    environmentArtifactId: environmentArtifact.environmentArtifactId,
    environmentIdentityFingerprint: environmentArtifact.identityFingerprint,
    corpusFingerprint: bundle.corpusIdentity.corpusFingerprint,
    authorizationFingerprint: bundle.executionAuthorization.authorizationFingerprint,
    providerSlot: descriptor.providerSlot,
    candidateProfileId: descriptor.candidateProfileId,
    buildConfiguration: descriptor.buildConfiguration,
    runtimeTarget: descriptor.runtimeTarget,
  };
}

function computeD036ProviderNativeAttemptIdentityFingerprint(bundle, descriptor) {
  const environmentArtifact = bundle.environmentArtifacts.find((artifact) =>
    artifact.buildConfiguration === descriptor.buildConfiguration && artifact.runtimeTarget === descriptor.runtimeTarget);
  if (!environmentArtifact) fail("attempt identity environment is missing", undefined, { field: "environmentArtifacts" });
  return fingerprint(attemptIdentityCore(bundle, descriptor, environmentArtifact));
}

function computeD036ProviderNativeAttemptDiagnosticFingerprint(attempt) {
  return fingerprint(withoutField(attempt, "diagnosticFingerprint"));
}

function computeD036ProviderNativeReportSha256(input) {
  return fingerprint(withoutField(input, "reportSha256"));
}

function normalizeCounterRecord(value, fields, field) {
  assertExactKeys(value, fields, field);
  return Object.fromEntries(fields.map((name) => [name, normalizeSafeInteger(value[name], `${field}.${name}`)]));
}

function normalizeHopRecord(value, field, expectedIndex) {
  assertExactKeys(value, [
    "hopIndex", "originFingerprint", "originApprovalState", "requestCount", "authorizationByteCount", "payloadByteCount",
    "responseStatusCode", "redirectDisposition", "captureFingerprint",
  ], field);
  const responseStatusCode = value.responseStatusCode === null
    ? null
    : normalizeSafeInteger(value.responseStatusCode, `${field}.responseStatusCode`, 100);
  if (responseStatusCode !== null && responseStatusCode > 599) fail("invalid response status code", undefined, { field: `${field}.responseStatusCode` });
  const normalized = {
    hopIndex: normalizeSafeInteger(value.hopIndex, `${field}.hopIndex`),
    originFingerprint: normalizeSha256(value.originFingerprint, `${field}.originFingerprint`),
    originApprovalState: normalizeEnum(value.originApprovalState, ["APPROVED", "UNAPPROVED"], `${field}.originApprovalState`),
    requestCount: normalizeSafeInteger(value.requestCount, `${field}.requestCount`),
    authorizationByteCount: normalizeSafeInteger(value.authorizationByteCount, `${field}.authorizationByteCount`),
    payloadByteCount: normalizeSafeInteger(value.payloadByteCount, `${field}.payloadByteCount`),
    responseStatusCode,
    redirectDisposition: normalizePattern(value.redirectDisposition, `${field}.redirectDisposition`, /^[A-Z][A-Z0-9_]+$/, 96),
    captureFingerprint: normalizeSha256(value.captureFingerprint, `${field}.captureFingerprint`),
  };
  if (normalized.hopIndex !== expectedIndex) fail("hop indexes must be continuous", undefined, { field: `${field}.hopIndex` });
  return normalized;
}

function normalizeAttemptRecord(value, index, bundle, descriptorByCellId) {
  const field = `attemptRecords[${index}]`;
  assertExactKeys(value, [
    "schemaVersion", "attemptId", "cellId", "pathKind", "repetitionIndex", "identityFingerprint", "startedMonotonicNs",
    "endedMonotonicNs", "hopRecords", "stateIsolationObservation", "lifecycleObservation", "observedDisposition",
    "reasonCode", "captureEvidenceFingerprint", "diagnosticFingerprint", "containsRealUserData", "containsCredential",
    "containsProviderBody",
  ], field);
  if (value.schemaVersion !== ATTEMPT_SCHEMA_VERSION) fail("attempt schemaVersion changed", undefined, { field: `${field}.schemaVersion` });
  const cellId = normalizePattern(value.cellId, `${field}.cellId`, /^D036-CELL-[A-Z0-9._-]+$/, 128);
  const descriptor = descriptorByCellId.get(cellId);
  if (!descriptor) fail("attempt references an unknown cell", undefined, { field: `${field}.cellId` });
  if (!Array.isArray(value.hopRecords) || value.hopRecords.length > 16) fail("hop records exceed the resource boundary", undefined, { field: `${field}.hopRecords` });
  const normalized = {
    schemaVersion: ATTEMPT_SCHEMA_VERSION,
    attemptId: normalizePattern(value.attemptId, `${field}.attemptId`, /^D036-ATTEMPT-[A-Z0-9._-]+$/, 128),
    cellId,
    pathKind: normalizeEnum(value.pathKind, PATH_KINDS, `${field}.pathKind`),
    repetitionIndex: normalizeSafeInteger(value.repetitionIndex, `${field}.repetitionIndex`, 1),
    identityFingerprint: normalizeSha256(value.identityFingerprint, `${field}.identityFingerprint`),
    startedMonotonicNs: normalizeSafeInteger(value.startedMonotonicNs, `${field}.startedMonotonicNs`),
    endedMonotonicNs: normalizeSafeInteger(value.endedMonotonicNs, `${field}.endedMonotonicNs`),
    hopRecords: value.hopRecords.map((hop, hopIndex) => normalizeHopRecord(hop, `${field}.hopRecords[${hopIndex}]`, hopIndex)),
    stateIsolationObservation: normalizeCounterRecord(value.stateIsolationObservation, STATE_ISOLATION_FIELDS, `${field}.stateIsolationObservation`),
    lifecycleObservation: normalizeCounterRecord(value.lifecycleObservation, LIFECYCLE_FIELDS, `${field}.lifecycleObservation`),
    observedDisposition: normalizeEnum(value.observedDisposition, ATTEMPT_DISPOSITIONS, `${field}.observedDisposition`),
    reasonCode: normalizePattern(value.reasonCode, `${field}.reasonCode`, /^[A-Z][A-Z0-9_]+$/, 96),
    captureEvidenceFingerprint: normalizeSha256(value.captureEvidenceFingerprint, `${field}.captureEvidenceFingerprint`),
    diagnosticFingerprint: normalizeSha256(value.diagnosticFingerprint, `${field}.diagnosticFingerprint`),
    containsRealUserData: value.containsRealUserData,
    containsCredential: value.containsCredential,
    containsProviderBody: value.containsProviderBody,
  };
  if (normalized.containsRealUserData !== false || normalized.containsCredential !== false || normalized.containsProviderBody !== false) {
    fail("attempt contains forbidden material", "UNSAFE_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT", { field });
  }
  if (normalized.endedMonotonicNs < normalized.startedMonotonicNs) fail("attempt monotonic interval is reversed", undefined, { field });
  const expectedIdentity = computeD036ProviderNativeAttemptIdentityFingerprint(bundle, descriptor);
  if (normalized.identityFingerprint !== expectedIdentity) fail("attempt identity fingerprint changed", undefined, { field: `${field}.identityFingerprint` });
  if (normalized.diagnosticFingerprint !== computeD036ProviderNativeAttemptDiagnosticFingerprint(normalized)) {
    fail("attempt diagnostic fingerprint changed", undefined, { field: `${field}.diagnosticFingerprint` });
  }
  return normalized;
}

function sumCounters(records, field) {
  return records.reduce((total, record) => total + record[field], 0);
}

function deriveCell(inputCell, attempts, minimumPerPath) {
  const normalAttemptCount = attempts.filter(({ pathKind }) => pathKind === "NORMAL").length;
  const cancelAttemptCount = attempts.filter(({ pathKind }) => pathKind === "CANCEL").length;
  const expectedErrorAttemptCount = attempts.filter(({ pathKind }) => pathKind === "EXPECTED_ERROR").length;
  const hops = attempts.flatMap(({ hopRecords }) => hopRecords);
  const unapproved = hops.filter(({ originApprovalState }) => originApprovalState === "UNAPPROVED");
  const unapprovedRequestCount = sumCounters(unapproved, "requestCount");
  const unapprovedAuthorizationByteCount = sumCounters(unapproved, "authorizationByteCount");
  const unapprovedPayloadByteCount = sumCounters(unapproved, "payloadByteCount");
  const stateIsolationViolationCount = attempts.reduce((count, attempt) =>
    count + Object.values(attempt.stateIsolationObservation).reduce((total, value) => total + value, 0), 0);
  const lifecycleViolationCount = attempts.reduce((count, attempt) =>
    count + Object.values(attempt.lifecycleObservation).reduce((total, value) => total + value, 0), 0);
  const observedOriginCount = new Set(hops.map(({ originFingerprint }) => originFingerprint)).size;
  let disposition;
  if (attempts.length === 0) {
    disposition = "NOT_EXECUTED";
  } else if (
    unapprovedRequestCount > 0 || unapprovedAuthorizationByteCount > 0 || unapprovedPayloadByteCount > 0 ||
    stateIsolationViolationCount > 0 || lifecycleViolationCount > 0 ||
    attempts.some(({ observedDisposition }) => observedDisposition === "BOUNDARY_VIOLATION")
  ) {
    disposition = "INCOMPATIBLE_BY_OBSERVATION";
  } else if (attempts.some(({ observedDisposition }) => observedDisposition === "DOCUMENTED_INCOMPATIBILITY")) {
    disposition = "INCOMPATIBLE_BY_DOCUMENTED_REQUIREMENT";
  } else if (
    [normalAttemptCount, cancelAttemptCount, expectedErrorAttemptCount].some((count) => count < minimumPerPath) ||
    attempts.some(({ observedDisposition }) => ["FAILED", "TIMED_OUT", "UNKNOWN_RESULT"].includes(observedDisposition))
  ) {
    disposition = "INCONCLUSIVE_EVIDENCE_GAP";
  } else {
    disposition = "COMPATIBLE_WITH_CANDIDATE_PROFILE";
  }
  const derived = {
    cellId: inputCell.cellId,
    providerSlot: inputCell.providerSlot,
    candidateProfileId: inputCell.candidateProfileId,
    buildConfiguration: inputCell.buildConfiguration,
    runtimeTarget: inputCell.runtimeTarget,
    environmentArtifactId: inputCell.environmentArtifactId,
    attemptIds: attempts.map(({ attemptId }) => attemptId),
    normalAttemptCount,
    cancelAttemptCount,
    expectedErrorAttemptCount,
    observedOriginCount,
    unapprovedRequestCount,
    unapprovedAuthorizationByteCount,
    unapprovedPayloadByteCount,
    stateIsolationViolationCount,
    lifecycleViolationCount,
    disposition,
    findingIds: inputCell.findingIds,
    cellFingerprint: "",
  };
  derived.cellFingerprint = fingerprint(withoutField(derived, "cellFingerprint"));
  return derived;
}

function normalizeCompatibilityCell(value, index, expectedDescriptor, environmentArtifacts) {
  const field = `compatibilityCells[${index}]`;
  assertExactKeys(value, [
    "cellId", "providerSlot", "candidateProfileId", "buildConfiguration", "runtimeTarget", "environmentArtifactId",
    "attemptIds", "normalAttemptCount", "cancelAttemptCount", "expectedErrorAttemptCount", "observedOriginCount",
    "unapprovedRequestCount", "unapprovedAuthorizationByteCount", "unapprovedPayloadByteCount", "stateIsolationViolationCount",
    "lifecycleViolationCount", "disposition", "findingIds", "cellFingerprint",
  ], field);
  const normalized = {
    cellId: normalizePattern(value.cellId, `${field}.cellId`, /^D036-CELL-[A-Z0-9._-]+$/, 128),
    providerSlot: normalizeEnum(value.providerSlot, PROVIDER_SLOTS, `${field}.providerSlot`),
    candidateProfileId: normalizeEnum(value.candidateProfileId, PROFILE_IDS, `${field}.candidateProfileId`),
    buildConfiguration: normalizeEnum(value.buildConfiguration, BUILD_CONFIGURATIONS, `${field}.buildConfiguration`),
    runtimeTarget: normalizeEnum(value.runtimeTarget, RUNTIME_TARGETS, `${field}.runtimeTarget`),
    environmentArtifactId: normalizePattern(value.environmentArtifactId, `${field}.environmentArtifactId`, /^D036-ENV-[A-Z0-9._-]+$/, 96),
    attemptIds: normalizeIdArray(value.attemptIds, `${field}.attemptIds`, /^D036-ATTEMPT-[A-Z0-9._-]+$/, 10_000),
    normalAttemptCount: normalizeSafeInteger(value.normalAttemptCount, `${field}.normalAttemptCount`),
    cancelAttemptCount: normalizeSafeInteger(value.cancelAttemptCount, `${field}.cancelAttemptCount`),
    expectedErrorAttemptCount: normalizeSafeInteger(value.expectedErrorAttemptCount, `${field}.expectedErrorAttemptCount`),
    observedOriginCount: normalizeSafeInteger(value.observedOriginCount, `${field}.observedOriginCount`),
    unapprovedRequestCount: normalizeSafeInteger(value.unapprovedRequestCount, `${field}.unapprovedRequestCount`),
    unapprovedAuthorizationByteCount: normalizeSafeInteger(value.unapprovedAuthorizationByteCount, `${field}.unapprovedAuthorizationByteCount`),
    unapprovedPayloadByteCount: normalizeSafeInteger(value.unapprovedPayloadByteCount, `${field}.unapprovedPayloadByteCount`),
    stateIsolationViolationCount: normalizeSafeInteger(value.stateIsolationViolationCount, `${field}.stateIsolationViolationCount`),
    lifecycleViolationCount: normalizeSafeInteger(value.lifecycleViolationCount, `${field}.lifecycleViolationCount`),
    disposition: normalizeEnum(value.disposition, CELL_DISPOSITIONS, `${field}.disposition`),
    findingIds: normalizeIdArray(value.findingIds, `${field}.findingIds`, /^D036-FINDING-[A-Z0-9._-]+$/, 512),
    cellFingerprint: normalizeSha256(value.cellFingerprint, `${field}.cellFingerprint`),
  };
  for (const dimension of ["providerSlot", "candidateProfileId", "buildConfiguration", "runtimeTarget"]) {
    if (normalized[dimension] !== expectedDescriptor[dimension]) fail("cell matrix order or dimension changed", undefined, { field: `${field}.${dimension}` });
  }
  environmentFor(environmentArtifacts, normalized.buildConfiguration, normalized.runtimeTarget, normalized.environmentArtifactId, `${field}.environmentArtifactId`);
  return normalized;
}

function offlineIdentityCore(bundle, result, environmentArtifact) {
  return {
    protocolIdentity: bundle.protocolIdentity,
    oi07Revision: bundle.oi07Intake.oi07Revision,
    oi07InputFingerprint: bundle.oi07IntakeResult.inputFingerprint,
    oi07ResultFingerprint: bundle.oi07IntakeResult.resultFingerprint,
    environmentArtifactId: environmentArtifact.environmentArtifactId,
    environmentIdentityFingerprint: environmentArtifact.identityFingerprint,
    corpusFingerprint: bundle.corpusIdentity.corpusFingerprint,
    candidateProfileId: result.candidateProfileId,
    buildConfiguration: result.buildConfiguration,
    runtimeTarget: result.runtimeTarget,
    scenarioFamilyId: result.scenarioFamilyId,
  };
}

function normalizeOfflineHarnessResult(value, index, expected, bundle, minimumCount) {
  const field = `offlineHarnessResults[${index}]`;
  assertExactKeys(value, [
    "candidateProfileId", "buildConfiguration", "runtimeTarget", "scenarioFamilyId", "environmentArtifactId",
    "identityFingerprint", "measuredCount", "passedCount", "failedCount", "findingIds", "evidenceFingerprint", "resultFingerprint",
  ], field);
  const normalized = {
    candidateProfileId: normalizeEnum(value.candidateProfileId, PROFILE_IDS, `${field}.candidateProfileId`),
    buildConfiguration: normalizeEnum(value.buildConfiguration, BUILD_CONFIGURATIONS, `${field}.buildConfiguration`),
    runtimeTarget: normalizeEnum(value.runtimeTarget, RUNTIME_TARGETS, `${field}.runtimeTarget`),
    scenarioFamilyId: normalizeEnum(value.scenarioFamilyId, OFFLINE_SCENARIO_FAMILY_IDS, `${field}.scenarioFamilyId`),
    environmentArtifactId: normalizePattern(value.environmentArtifactId, `${field}.environmentArtifactId`, /^D036-ENV-[A-Z0-9._-]+$/, 96),
    identityFingerprint: normalizeSha256(value.identityFingerprint, `${field}.identityFingerprint`),
    measuredCount: normalizeSafeInteger(value.measuredCount, `${field}.measuredCount`),
    passedCount: normalizeSafeInteger(value.passedCount, `${field}.passedCount`),
    failedCount: normalizeSafeInteger(value.failedCount, `${field}.failedCount`),
    findingIds: normalizeIdArray(value.findingIds, `${field}.findingIds`, /^D036-FINDING-[A-Z0-9._-]+$/, 512),
    evidenceFingerprint: normalizeSha256(value.evidenceFingerprint, `${field}.evidenceFingerprint`),
    resultFingerprint: normalizeSha256(value.resultFingerprint, `${field}.resultFingerprint`),
  };
  for (const dimension of ["candidateProfileId", "buildConfiguration", "runtimeTarget", "scenarioFamilyId"]) {
    if (normalized[dimension] !== expected[dimension]) fail("offline result order or dimension changed", undefined, { field: `${field}.${dimension}` });
  }
  const environmentArtifact = environmentFor(bundle.environmentArtifacts, normalized.buildConfiguration, normalized.runtimeTarget, normalized.environmentArtifactId, `${field}.environmentArtifactId`);
  if (normalized.measuredCount !== normalized.passedCount + normalized.failedCount || normalized.measuredCount < minimumCount) {
    fail("offline result count is incomplete", undefined, { field });
  }
  if (normalized.identityFingerprint !== fingerprint(offlineIdentityCore(bundle, normalized, environmentArtifact))) {
    fail("offline result identity fingerprint changed", undefined, { field: `${field}.identityFingerprint` });
  }
  if (normalized.resultFingerprint !== fingerprint(withoutField(normalized, "resultFingerprint"))) {
    fail("offline result fingerprint changed", undefined, { field: `${field}.resultFingerprint` });
  }
  return normalized;
}

function normalizeOfflineHarnessResults(value, bundle, minimumCount) {
  const scope = bundle.matrixScope;
  const expected = scope.candidateProfileIds.flatMap((candidateProfileId) => scope.buildConfigurations.flatMap((buildConfiguration) =>
    scope.runtimeTargets.flatMap((runtimeTarget) => scope.offlineScenarioFamilyIds.map((scenarioFamilyId) => ({
      candidateProfileId,
      buildConfiguration,
      runtimeTarget,
      scenarioFamilyId,
    })))));
  if (!Array.isArray(value) || value.length !== expected.length) fail("offline harness matrix is incomplete", undefined, { field: "offlineHarnessResults" });
  return value.map((result, index) => normalizeOfflineHarnessResult(result, index, expected[index], bundle, minimumCount));
}

function normalizeEvidenceRef(value, field, environmentIds) {
  assertExactKeys(value, ["evidenceId", "evidenceKind", "summarySha256", "artifactSha256", "environmentArtifactIds"], field);
  const normalized = {
    evidenceId: normalizePattern(value.evidenceId, `${field}.evidenceId`, /^D036-EVIDENCE-[A-Z0-9._-]+$/, 128),
    evidenceKind: normalizePattern(value.evidenceKind, `${field}.evidenceKind`, /^[A-Z][A-Z0-9_]+$/, 96),
    summarySha256: normalizeSha256(value.summarySha256, `${field}.summarySha256`),
    artifactSha256: normalizeSha256(value.artifactSha256, `${field}.artifactSha256`),
    environmentArtifactIds: normalizeIdArray(value.environmentArtifactIds, `${field}.environmentArtifactIds`, /^D036-ENV-[A-Z0-9._-]+$/, 16),
  };
  if (normalized.environmentArtifactIds.length < 1 || normalized.environmentArtifactIds.some((id) => !environmentIds.has(id))) {
    fail("native evidence environment reference is invalid", undefined, { field: `${field}.environmentArtifactIds` });
  }
  return normalized;
}

function normalizeNativeBoundaryResult(value, index, expected, bundle) {
  const field = `nativeBoundaryResults[${index}]`;
  assertExactKeys(value, [
    "candidateProfileId", "surfaceId", "state", "rationaleCode", "evidenceRefs", "environmentArtifactIds", "findingIds", "resultFingerprint",
  ], field);
  const environmentIds = new Set(bundle.environmentArtifacts.map(({ environmentArtifactId }) => environmentArtifactId));
  if (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.length > 32) fail("native evidence refs exceed the resource boundary", undefined, { field: `${field}.evidenceRefs` });
  const normalized = {
    candidateProfileId: normalizeEnum(value.candidateProfileId, PROFILE_IDS, `${field}.candidateProfileId`),
    surfaceId: normalizeEnum(value.surfaceId, NATIVE_BOUNDARY_SURFACE_IDS, `${field}.surfaceId`),
    state: normalizeEnum(value.state, NATIVE_STATES, `${field}.state`),
    rationaleCode: normalizePattern(value.rationaleCode, `${field}.rationaleCode`, /^[A-Z][A-Z0-9_]+$/, 128),
    evidenceRefs: value.evidenceRefs.map((item, evidenceIndex) => normalizeEvidenceRef(item, `${field}.evidenceRefs[${evidenceIndex}]`, environmentIds)),
    environmentArtifactIds: normalizeIdArray(value.environmentArtifactIds, `${field}.environmentArtifactIds`, /^D036-ENV-[A-Z0-9._-]+$/, 16),
    findingIds: normalizeIdArray(value.findingIds, `${field}.findingIds`, /^D036-FINDING-[A-Z0-9._-]+$/, 512),
    resultFingerprint: normalizeSha256(value.resultFingerprint, `${field}.resultFingerprint`),
  };
  if (normalized.candidateProfileId !== expected.candidateProfileId || normalized.surfaceId !== expected.surfaceId) {
    fail("native boundary result order or dimension changed", undefined, { field });
  }
  if (normalized.environmentArtifactIds.length < 1 || normalized.environmentArtifactIds.some((id) => !environmentIds.has(id))) {
    fail("native result environment reference is invalid", undefined, { field: `${field}.environmentArtifactIds` });
  }
  if (normalized.evidenceRefs.length < 1) fail("native result requires evidence references", undefined, { field: `${field}.evidenceRefs` });
  if (normalized.state === "PROVEN" && normalized.rationaleCode !== "PROVEN_BY_REFERENCED_EVIDENCE") {
    fail("PROVEN requires the fixed rationale", undefined, { field: `${field}.rationaleCode` });
  }
  if (normalized.state === "NOT_PROVEN" && normalized.rationaleCode === "PROVEN_BY_REFERENCED_EVIDENCE") {
    fail("NOT_PROVEN requires a failure rationale", undefined, { field: `${field}.rationaleCode` });
  }
  if (normalized.resultFingerprint !== fingerprint(withoutField(normalized, "resultFingerprint"))) {
    fail("native boundary result fingerprint changed", undefined, { field: `${field}.resultFingerprint` });
  }
  return normalized;
}

function normalizeNativeBoundaryResults(value, bundle) {
  const expected = bundle.matrixScope.candidateProfileIds.flatMap((candidateProfileId) =>
    bundle.matrixScope.nativeBoundarySurfaceIds.map((surfaceId) => ({ candidateProfileId, surfaceId })));
  if (!Array.isArray(value) || value.length !== expected.length) fail("native boundary matrix is incomplete", undefined, { field: "nativeBoundaryResults" });
  return value.map((result, index) => normalizeNativeBoundaryResult(result, index, expected[index], bundle));
}

function normalizeFinding(value, index, referenceSets) {
  const field = `findings[${index}]`;
  assertExactKeys(value, [
    "findingId", "severity", "status", "relatedCellIds", "relatedAttemptIds", "relatedSurfaceIds", "ownerRef", "dueAt",
    "dispositionSummarySha256", "nonBlockingRationaleSha256", "findingFingerprint",
  ], field);
  const normalized = {
    findingId: normalizePattern(value.findingId, `${field}.findingId`, /^D036-FINDING-[A-Z0-9._-]+$/, 128),
    severity: normalizeEnum(value.severity, ["P0", "P1", "P2", "P3"], `${field}.severity`),
    status: normalizeEnum(value.status, ["OPEN", "CLOSED"], `${field}.status`),
    relatedCellIds: normalizeIdArray(value.relatedCellIds, `${field}.relatedCellIds`, /^D036-CELL-[A-Z0-9._-]+$/, 128),
    relatedAttemptIds: normalizeIdArray(value.relatedAttemptIds, `${field}.relatedAttemptIds`, /^D036-ATTEMPT-[A-Z0-9._-]+$/, 1024),
    relatedSurfaceIds: normalizeIdArray(value.relatedSurfaceIds, `${field}.relatedSurfaceIds`, /^NB-\d{2}_[A-Z0-9_]+$/, 32),
    ownerRef: normalizePattern(value.ownerRef, `${field}.ownerRef`, /^[A-Z0-9][A-Z0-9._-]+$/, 128, true),
    dueAt: normalizeTimestamp(value.dueAt, `${field}.dueAt`, true),
    dispositionSummarySha256: normalizeSha256(value.dispositionSummarySha256, `${field}.dispositionSummarySha256`),
    nonBlockingRationaleSha256: normalizeSha256(value.nonBlockingRationaleSha256, `${field}.nonBlockingRationaleSha256`, true),
    findingFingerprint: normalizeSha256(value.findingFingerprint, `${field}.findingFingerprint`),
  };
  for (const [ids, allowed, name] of [
    [normalized.relatedCellIds, referenceSets.cellIds, "relatedCellIds"],
    [normalized.relatedAttemptIds, referenceSets.attemptIds, "relatedAttemptIds"],
    [normalized.relatedSurfaceIds, referenceSets.surfaceIds, "relatedSurfaceIds"],
  ]) {
    if (ids.some((id) => !allowed.has(id))) fail("finding reference is unknown", undefined, { field: `${field}.${name}` });
  }
  if (normalized.relatedCellIds.length + normalized.relatedAttemptIds.length + normalized.relatedSurfaceIds.length < 1) {
    fail("finding must reference report evidence", undefined, { field });
  }
  if (normalized.status === "OPEN" && (normalized.ownerRef === "UNKNOWN" || normalized.dueAt === "UNKNOWN")) {
    fail("open finding requires owner and due time", undefined, { field });
  }
  if (normalized.severity === "P3" && normalized.status === "OPEN" && normalized.nonBlockingRationaleSha256 === "UNKNOWN") {
    fail("open P3 requires a non-blocking rationale", undefined, { field });
  }
  if (normalized.findingFingerprint !== fingerprint(withoutField(normalized, "findingFingerprint"))) {
    fail("finding fingerprint changed", undefined, { field: `${field}.findingFingerprint` });
  }
  return normalized;
}

function normalizeIndependentReviewRef(value, index) {
  const field = `independentReviewRefs[${index}]`;
  assertExactKeys(value, [
    "reviewId", "reviewerRole", "reviewedArtifactSha256", "disposition", "signatureMethod", "signedAt", "summarySha256",
  ], field);
  return {
    reviewId: normalizePattern(value.reviewId, `${field}.reviewId`, /^D036-REVIEW-[A-Z0-9._-]+$/, 128),
    reviewerRole: normalizeEnum(value.reviewerRole, ["SECURITY", "QA"], `${field}.reviewerRole`),
    reviewedArtifactSha256: normalizeSha256(value.reviewedArtifactSha256, `${field}.reviewedArtifactSha256`),
    disposition: normalizeEnum(value.disposition, ["APPROVED", "REJECTED", "INCONCLUSIVE"], `${field}.disposition`),
    signatureMethod: normalizeEnum(value.signatureMethod, ["SIGNED_DOCUMENT_REFERENCE", "VERIFIED_WORKFLOW_REFERENCE", "WET_SIGNATURE_REFERENCE"], `${field}.signatureMethod`),
    signedAt: normalizeTimestamp(value.signedAt, `${field}.signedAt`),
    summarySha256: normalizeSha256(value.summarySha256, `${field}.summarySha256`),
  };
}

function hasUnknown(value) {
  if (value === "UNKNOWN") return true;
  if (Array.isArray(value)) return value.some(hasUnknown);
  if (value && typeof value === "object") return Object.values(value).some(hasUnknown);
  return false;
}

function authorizationComplete(authorization, generatedAt) {
  return authorization.callerAssertedAuthorized === true &&
    authorization.realNetworkAuthorized === true &&
    authorization.credentialInjectionAuthorized === true &&
    authorization.authorizedAt !== "UNKNOWN" &&
    authorization.expiresAt !== "UNKNOWN" &&
    authorization.credentialInjectionMethodRef !== "UNKNOWN" &&
    Date.parse(authorization.authorizedAt) <= Date.parse(generatedAt) &&
    Date.parse(generatedAt) <= Date.parse(authorization.expiresAt);
}

function deriveOverallDisposition(normalized) {
  const failObserved = normalized.compatibilityCells.some(({ disposition }) => disposition === "INCOMPATIBLE_BY_OBSERVATION");
  const failOffline = normalized.offlineHarnessResults.some(({ failedCount }) => failedCount > 0);
  const failFinding = normalized.findings.some(({ severity, status }) => status === "OPEN" && ["P0", "P1", "P2"].includes(severity));
  if (failObserved || failOffline || failFinding) return "FAIL";
  const formal = normalized.recordKind === "FORMAL_SPIKE_REPORT";
  const environmentComplete = !hasUnknown(normalized.environmentArtifacts);
  const cellsComplete = normalized.compatibilityCells.every(({ disposition }) =>
    !["NOT_EXECUTED", "INCONCLUSIVE_EVIDENCE_GAP"].includes(disposition));
  const offlineComplete = normalized.offlineHarnessResults.every(({ measuredCount, passedCount, failedCount }) =>
    measuredCount >= 10 && measuredCount === passedCount && failedCount === 0);
  const nativeComplete = normalized.nativeBoundaryResults.every(({ state }) => NATIVE_STATES.includes(state));
  if (
    !formal || !normalized.oi07IntakeResult.d036IntakeContractComplete ||
    !normalized.oi07IntakeResult.authorityMetadataComplete || !environmentComplete ||
    !authorizationComplete(normalized.executionAuthorization, normalized.generatedAt) ||
    !cellsComplete || !offlineComplete || !nativeComplete
  ) return "INCONCLUSIVE";
  return "MEASURED_REVIEW_REQUIRED";
}

function normalizeD036ProviderNativeCompatibilityReport(input) {
  assertDataTree(input, "input");
  assertExactKeys(input, [
    "schemaVersion", "reportId", "recordKind", "protocolIdentity", "oi07Intake", "oi07IntakeResult", "matrixScope",
    "environmentArtifacts", "corpusIdentity", "executionAuthorization", "offlineHarnessResults", "compatibilityCells",
    "attemptRecords", "nativeBoundaryResults", "findings", "independentReviewRefs", "overallDisposition", "generatedAt",
    "reportSha256", "containsRealUserData", "containsCredential", "containsProviderBody",
  ], "input");
  if (input.schemaVersion !== INPUT_SCHEMA_VERSION) fail("report schemaVersion changed", undefined, { field: "schemaVersion" });
  if (input.reportSha256 !== computeD036ProviderNativeReportSha256(input)) fail("reportSha256 does not bind the complete bundle", undefined, { field: "reportSha256" });
  if (input.containsRealUserData !== false || input.containsCredential !== false || input.containsProviderBody !== false) {
    fail("report contains forbidden material", "UNSAFE_D036_PROVIDER_NATIVE_COMPATIBILITY_REPORT", { field: "input" });
  }
  const recordKind = normalizeEnum(input.recordKind, ["FORMAL_SPIKE_REPORT", "SYNTHETIC_CONTRACT_FIXTURE"], "recordKind");
  const protocolIdentity = normalizeProtocolIdentity(input.protocolIdentity);
  const oi07Intake = normalizeOi07ProviderTargetIntake(input.oi07Intake);
  const oi07IntakeResult = validateOi07ProviderTargetIntakeResult(input.oi07IntakeResult, oi07Intake);
  const matrixScope = normalizeMatrixScope(input.matrixScope, recordKind);
  const environmentArtifacts = normalizeEnvironmentArtifacts(input.environmentArtifacts, matrixScope);
  const corpusIdentity = normalizeCorpusIdentity(input.corpusIdentity);
  const executionAuthorization = normalizeExecutionAuthorization(input.executionAuthorization, recordKind, matrixScope);
  const reportId = normalizePattern(input.reportId, "reportId", /^D036-REPORT-R\d{3}$/, 32);
  const generatedAt = normalizeTimestamp(input.generatedAt, "generatedAt");
  const bundleBase = {
    protocolIdentity,
    oi07Intake,
    oi07IntakeResult,
    matrixScope,
    environmentArtifacts,
    corpusIdentity,
    executionAuthorization,
  };
  const expectedDescriptors = cellDescriptors(matrixScope, input.compatibilityCells);
  const compatibilityCells = input.compatibilityCells.map((cell, index) =>
    normalizeCompatibilityCell(cell, index, expectedDescriptors[index], environmentArtifacts));
  const cellIds = compatibilityCells.map(({ cellId }) => cellId);
  if (new Set(cellIds).size !== cellIds.length) fail("cell IDs must be unique", undefined, { field: "compatibilityCells" });
  const descriptorByCellId = new Map(compatibilityCells.map((cell) => [cell.cellId, {
    cellId: cell.cellId,
    providerSlot: cell.providerSlot,
    candidateProfileId: cell.candidateProfileId,
    buildConfiguration: cell.buildConfiguration,
    runtimeTarget: cell.runtimeTarget,
  }]));
  if (!Array.isArray(input.attemptRecords) || input.attemptRecords.length > 50_000) {
    fail("attempt records exceed the resource boundary", undefined, { field: "attemptRecords" });
  }
  const attemptRecords = input.attemptRecords.map((attempt, index) =>
    normalizeAttemptRecord(attempt, index, bundleBase, descriptorByCellId));
  const attemptIds = attemptRecords.map(({ attemptId }) => attemptId);
  if (new Set(attemptIds).size !== attemptIds.length) fail("attempt IDs must be globally unique", undefined, { field: "attemptRecords" });
  for (const cell of compatibilityCells) {
    for (const pathKind of PATH_KINDS) {
      const repetitions = attemptRecords.filter((attempt) => attempt.cellId === cell.cellId && attempt.pathKind === pathKind)
        .map(({ repetitionIndex }) => repetitionIndex);
      const expected = Array.from({ length: repetitions.length }, (_, index) => index + 1);
      if (!isDeepStrictEqual(repetitions, expected)) fail("attempt repetitions must be continuous in bundle order", undefined, { field: `compatibilityCells.${cell.cellId}.${pathKind}` });
    }
  }
  const minimumPerPath = recordKind === "FORMAL_SPIKE_REPORT" ? 3 : 1;
  const derivedCells = compatibilityCells.map((cell) => deriveCell(
    cell,
    attemptRecords.filter((attempt) => attempt.cellId === cell.cellId),
    minimumPerPath,
  ));
  if (!isDeepStrictEqual(compatibilityCells, derivedCells)) {
    fail("cell aggregates, attempt order, disposition, or fingerprint do not match raw attempts", undefined, { field: "compatibilityCells" });
  }
  const bundleWithCells = { ...bundleBase, compatibilityCells, attemptRecords };
  const offlineHarnessResults = normalizeOfflineHarnessResults(input.offlineHarnessResults, bundleWithCells, recordKind === "FORMAL_SPIKE_REPORT" ? 10 : 1);
  const nativeBoundaryResults = normalizeNativeBoundaryResults(input.nativeBoundaryResults, bundleWithCells);
  if (!Array.isArray(input.findings) || input.findings.length > 512) fail("findings exceed the resource boundary", undefined, { field: "findings" });
  const referenceSets = {
    cellIds: new Set(cellIds),
    attemptIds: new Set(attemptIds),
    surfaceIds: new Set(matrixScope.nativeBoundarySurfaceIds),
  };
  const findings = input.findings.map((finding, index) => normalizeFinding(finding, index, referenceSets));
  const findingIds = findings.map(({ findingId }) => findingId);
  if (new Set(findingIds).size !== findingIds.length) fail("finding IDs must be unique", undefined, { field: "findings" });
  const findingIdSet = new Set(findingIds);
  for (const [field, records] of [
    ["compatibilityCells", compatibilityCells],
    ["offlineHarnessResults", offlineHarnessResults],
    ["nativeBoundaryResults", nativeBoundaryResults],
  ]) {
    records.forEach((record, index) => {
      if (record.findingIds.some((id) => !findingIdSet.has(id))) fail("unknown finding reference", undefined, { field: `${field}[${index}].findingIds` });
    });
  }
  if (!Array.isArray(input.independentReviewRefs) || input.independentReviewRefs.length > 32) {
    fail("independent review refs exceed the resource boundary", undefined, { field: "independentReviewRefs" });
  }
  const independentReviewRefs = input.independentReviewRefs.map(normalizeIndependentReviewRef);
  const reviewIds = independentReviewRefs.map(({ reviewId }) => reviewId);
  if (new Set(reviewIds).size !== reviewIds.length) fail("independent review IDs must be unique", undefined, { field: "independentReviewRefs" });
  const normalized = immutable({
    schemaVersion: INPUT_SCHEMA_VERSION,
    reportId,
    recordKind,
    protocolIdentity,
    oi07Intake,
    oi07IntakeResult,
    matrixScope,
    environmentArtifacts,
    corpusIdentity,
    executionAuthorization,
    offlineHarnessResults,
    compatibilityCells,
    attemptRecords,
    nativeBoundaryResults,
    findings,
    independentReviewRefs,
    overallDisposition: normalizeEnum(input.overallDisposition, OVERALL_DISPOSITIONS, "overallDisposition"),
    generatedAt,
    reportSha256: input.reportSha256,
    containsRealUserData: false,
    containsCredential: false,
    containsProviderBody: false,
  });
  const expectedOverall = deriveOverallDisposition(normalized);
  if (normalized.overallDisposition !== expectedOverall) fail("overall disposition does not match report evidence", undefined, { field: "overallDisposition" });
  return normalized;
}

function evaluateD036ProviderNativeCompatibilityReport(input) {
  const normalized = normalizeD036ProviderNativeCompatibilityReport(input);
  const counts = Object.fromEntries(CELL_DISPOSITIONS.map((disposition) => [
    disposition,
    normalized.compatibilityCells.filter((cell) => cell.disposition === disposition).length,
  ]));
  const unapprovedRequestCount = sumCounters(normalized.compatibilityCells, "unapprovedRequestCount");
  const unapprovedAuthorizationByteCount = sumCounters(normalized.compatibilityCells, "unapprovedAuthorizationByteCount");
  const unapprovedPayloadByteCount = sumCounters(normalized.compatibilityCells, "unapprovedPayloadByteCount");
  const stateIsolationViolationCount = sumCounters(normalized.compatibilityCells, "stateIsolationViolationCount");
  const lifecycleViolationCount = sumCounters(normalized.compatibilityCells, "lifecycleViolationCount");
  const rnFetchResults = normalized.nativeBoundaryResults.filter(({ candidateProfileId }) => candidateProfileId === "rn_fetch_after_native_boundary_proof");
  const rnFetchProfileViable = rnFetchResults.length === NATIVE_BOUNDARY_SURFACE_IDS.length &&
    rnFetchResults.every(({ state }) => state === "PROVEN");
  const blockers = [
    ...(normalized.recordKind === "SYNTHETIC_CONTRACT_FIXTURE" ? ["SYNTHETIC_CONTRACT_FIXTURE_ONLY"] : []),
    ...(!normalized.oi07IntakeResult.d036IntakeContractComplete ? ["OI07_D036_INTAKE_INCOMPLETE"] : []),
    ...(normalized.overallDisposition === "FAIL" ? ["REPORT_CONTAINS_FAILING_EVIDENCE"] : []),
    ...(normalized.overallDisposition === "INCONCLUSIVE" ? ["REPORT_EVIDENCE_INCONCLUSIVE"] : []),
    ...(!rnFetchProfileViable ? ["RN_FETCH_PROFILE_NOT_VIABLE_AT_TESTED_VERSION"] : []),
    "OI07_AUTHORITY_CALLER_ASSERTED_NOT_VERIFIED",
    "ENVIRONMENT_IDENTITY_CALLER_ASSERTED_NOT_VERIFIED",
    "EXECUTION_AUTHORIZATION_CALLER_ASSERTED_NOT_VERIFIED",
    "CAPTURE_AND_NATIVE_ARTIFACTS_CALLER_ASSERTED_NOT_VERIFIED",
    "NATIVE_EVIDENCE_CALLER_ASSERTED_NOT_VERIFIED",
    "INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED",
    "D036_EXECUTION_NOT_AUTHORIZED_BY_VALIDATOR",
    "PROVIDER_COMPATIBILITY_SPIKE_PASS_NOT_GRANTED",
    "NATIVE_BOUNDARY_PASS_NOT_GRANTED",
  ];
  const core = immutable({
    schemaVersion: RESULT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    reportId: normalized.reportId,
    disposition: "STRUCTURALLY_COMPLETE_REPORT_ONLY",
    overallDisposition: normalized.overallDisposition,
    recordKind: normalized.recordKind,
    syntheticContractFixtureOnly: normalized.recordKind === "SYNTHETIC_CONTRACT_FIXTURE",
    providerCount: normalized.matrixScope.providerSlots.length,
    profileCount: normalized.matrixScope.candidateProfileIds.length,
    buildConfigurationCount: normalized.matrixScope.buildConfigurations.length,
    runtimeTargetCount: normalized.matrixScope.runtimeTargets.length,
    requiredCompatibilityCellCount: normalized.matrixScope.requiredCompatibilityCellCount,
    compatibilityCellCount: normalized.compatibilityCells.length,
    attemptRecordCount: normalized.attemptRecords.length,
    offlineHarnessResultCount: normalized.offlineHarnessResults.length,
    nativeBoundaryResultCount: normalized.nativeBoundaryResults.length,
    findingCount: normalized.findings.length,
    independentReviewRefCount: normalized.independentReviewRefs.length,
    executedCellCount: normalized.compatibilityCells.length - counts.NOT_EXECUTED,
    compatibleCellCount: counts.COMPATIBLE_WITH_CANDIDATE_PROFILE,
    documentedIncompatibleCellCount: counts.INCOMPATIBLE_BY_DOCUMENTED_REQUIREMENT,
    observedIncompatibleCellCount: counts.INCOMPATIBLE_BY_OBSERVATION,
    inconclusiveCellCount: counts.INCONCLUSIVE_EVIDENCE_GAP,
    notExecutedCellCount: counts.NOT_EXECUTED,
    unapprovedRequestCount,
    unapprovedAuthorizationByteCount,
    unapprovedPayloadByteCount,
    stateIsolationViolationCount,
    lifecycleViolationCount,
    rnFetchProfileViable,
    providerCompatibilityPass: false,
    nativeBoundaryPass: false,
    blockers: immutable(blockers),
    inputFingerprint: fingerprint(normalized),
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateD036ProviderNativeCompatibilityReportResult(result, input) {
  assertDataTree(result, "result");
  const expected = evaluateD036ProviderNativeCompatibilityReport(input);
  if (!isDeepStrictEqual(result, expected)) fail("D-036 report result or fingerprint was changed");
  return expected;
}

export {
  ATTEMPT_SCHEMA_VERSION,
  BOUNDARY,
  BUILD_CONFIGURATIONS,
  CELL_DISPOSITIONS,
  CONTRACT_ID,
  INPUT_SCHEMA_VERSION,
  LIFECYCLE_FIELDS,
  NATIVE_BOUNDARY_SURFACE_IDS,
  OFFLINE_SCENARIO_FAMILY_IDS,
  PATH_KINDS,
  PROFILE_IDS,
  PROTOCOL_ID,
  PROVIDER_SLOTS,
  RESULT_SCHEMA_VERSION,
  RUNTIME_TARGETS,
  STATE_ISOLATION_FIELDS,
  computeD036ProviderNativeAttemptDiagnosticFingerprint,
  computeD036ProviderNativeAttemptIdentityFingerprint,
  computeD036ProviderNativeReportSha256,
  evaluateD036ProviderNativeCompatibilityReport,
  normalizeD036ProviderNativeCompatibilityReport,
  validateD036ProviderNativeCompatibilityReportResult,
};
