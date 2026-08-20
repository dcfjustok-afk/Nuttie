import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import {
  PROFILE_IDS,
  PROTOCOL_ID,
  SOURCE_CARD_BLOB_OID,
  SOURCE_CARD_COMMIT,
  SOURCE_CARD_SHA256,
  SOURCE_PACKET_VERSION,
} from "./d034-benchmark-corpus-manifest-harness.mjs";

const INPUT_SCHEMA_VERSION = "D034_BENCHMARK_RUN_REPORT_BUNDLE_INPUT_V1";
const RUN_RECORD_SCHEMA_VERSION = "D034_BENCHMARK_RUN_RECORD_V1";
const RESULT_SCHEMA_VERSION = "D034_BENCHMARK_RUN_REPORT_RESULT_V1";
const BOUNDARY_SCHEMA_VERSION = "D034_BENCHMARK_RUN_REPORT_BOUNDARY_V1";
const CONTRACT_ID = "D034-BENCHMARK-RUN-REPORT-CONTRACT-001";
const MANIFEST_CONTRACT_ID = "D034-BENCHMARK-CORPUS-MANIFEST-CONTRACT-001";

const STAGE_IDS = Object.freeze([
  "PREFLIGHT",
  "METADATA",
  "DOWNSAMPLE",
  "ENCODE",
  "REQUEST_ASSEMBLY",
  "RESPONSE_COUNT",
  "PARSE",
  "CLEANUP",
]);

const METRIC_IDS = Object.freeze([
  "cpuTimeNs",
  "controlledWorkingBytesPeak",
  "processHighWaterMarkBytes",
  "idleBaselineDeltaBytes",
  "temporaryDiskPeakBytes",
  "foregroundRequestCountPeak",
  "databaseWriteCount",
  "residualObjectCount",
  "crashCount",
  "jetsamCount",
  "watchdogCount",
  "hangCount",
  "unexplainedMemoryPeakCount",
  "secretOrBodyLogFindingCount",
]);

const DISTRIBUTION_FIELDS = Object.freeze([
  "cpuDistribution",
  "controlledWorkingMemoryDistribution",
  "processHighWaterMarkDistribution",
  "idleBaselineDeltaDistribution",
  "temporaryDiskPeakDistribution",
  "requestCountDistribution",
  "databaseWriteCountDistribution",
  "residualObjectCountDistribution",
]);

const DISTRIBUTION_METRICS = Object.freeze({
  cpuDistribution: "cpuTimeNs",
  controlledWorkingMemoryDistribution: "controlledWorkingBytesPeak",
  processHighWaterMarkDistribution: "processHighWaterMarkBytes",
  idleBaselineDeltaDistribution: "idleBaselineDeltaBytes",
  temporaryDiskPeakDistribution: "temporaryDiskPeakBytes",
  requestCountDistribution: "foregroundRequestCountPeak",
  databaseWriteCountDistribution: "databaseWriteCount",
  residualObjectCountDistribution: "residualObjectCount",
});

const ROTATIONS = Object.freeze([
  Object.freeze(PROFILE_IDS.map((_, index) => PROFILE_IDS[index])),
  Object.freeze(PROFILE_IDS.map((_, index) => PROFILE_IDS[(index + 1) % PROFILE_IDS.length])),
  Object.freeze(PROFILE_IDS.map((_, index) => PROFILE_IDS[(index + 2) % PROFILE_IDS.length])),
]);

const BOUNDARY = deepFreeze({
  schemaVersion: BOUNDARY_SCHEMA_VERSION,
  contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
  syntheticContractFixtureIsBenchmarkEvidence: false,
  identityClaimsCallerAssertedNotVerified: true,
  fixtureArtifactsCallerAssertedNotVerified: true,
  independentReviewCallerAssertedNotVerified: true,
  rawRunRecordReads: 0,
  rawRunRecordWrites: 0,
  fixtureArtifactReads: 0,
  fixtureArtifactWrites: 0,
  minimumPhysicalDeviceResolved: false,
  macAndSupportedXcodeAvailable: false,
  isolatedNativeHarnessAuthorized: false,
  corpusMaterialized: false,
  benchmarkExecutionAuthorized: false,
  benchmarkExecutionStarted: false,
  benchmarkResultRecorded: false,
  deviceBenchmarkPassed: false,
  independentReviewPassed: false,
  ownerReviewAuthorized: false,
  ownerChoiceRecorded: false,
  b05Closed: false,
  networkRequests: 0,
  providerRequests: 0,
  businessWrites: 0,
  formalImplementationAuthorized: false,
});

function fail(message, code = "INVALID_D034_BENCHMARK_RUN_REPORT", details = {}) {
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

function assertDataTree(value, field = "input", depth = 0, ancestors = new Set(), budget = { nodes: 0 }) {
  budget.nodes += 1;
  if (budget.nodes > 1_500_000 || depth > 14) fail("input resource boundary exceeded", undefined, { field });
  if (typeof value === "string") {
    if (value.length > 4_096) fail("string resource boundary exceeded", undefined, { field });
    if (
      /sk-[a-z0-9_-]{8,}/i.test(value) ||
      /bearer\s+\S+/i.test(value) ||
      /(?:api[_-]?key|authorization|password|secret)\s*[:=]/i.test(value) ||
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(value)
    ) {
      fail("sensitive-looking material is forbidden", "UNSAFE_D034_BENCHMARK_RUN_REPORT", { field });
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
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) fail("special objects are forbidden", undefined, { field });
    if (Object.getOwnPropertySymbols(value).length > 0) fail("symbol keys are forbidden", undefined, { field });
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
      if (!descriptor.enumerable) fail("non-enumerable properties are forbidden", undefined, { field });
      if (descriptor.get || descriptor.set) fail("accessor properties are forbidden", undefined, { field });
    }
  }
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) {
    assertDataTree(child, `${field}.${key}`, depth + 1, ancestors, budget);
  }
  ancestors.delete(value);
}

function assertExactKeys(value, expectedKeys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("object required", undefined, { field });
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

function normalizeSha256(value, field) {
  return normalizePattern(value, field, /^[a-f0-9]{64}$/, 64);
}

function normalizeSafeInteger(value, field, { minimum = 0, nullable = false } = {}) {
  if (nullable && value === null) return null;
  if (!Number.isSafeInteger(value) || value < minimum) fail("safe integer required", undefined, { field });
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

function normalizeTimestamp(value, field, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || !isValidTimestamp(value)) fail("RFC 3339 timestamp required", undefined, { field });
  return value;
}

function computeD034BenchmarkReportSha256(bundle) {
  assertDataTree(bundle, "bundle");
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) fail("bundle object required");
  const payload = Object.fromEntries(Object.entries(bundle).filter(([key]) => key !== "reportSha256"));
  return fingerprint(payload);
}

function runIdentityCore(bundle, profileId, fixtureId, fixtureArtifactSha256) {
  return {
    protocolIdentity: bundle.protocolIdentity,
    manifestIdentity: {
      contractId: bundle.manifestIdentity.contractId,
      corpusRevision: bundle.manifestIdentity.corpusRevision,
      manifestSha256: bundle.manifestIdentity.manifestSha256,
      manifestInputFingerprint: bundle.manifestIdentity.manifestInputFingerprint,
      manifestResultFingerprint: bundle.manifestIdentity.manifestResultFingerprint,
    },
    deviceIdentity: bundle.deviceIdentity,
    environmentIdentity: bundle.environmentIdentity,
    harnessIdentity: bundle.harnessIdentity,
    profileId,
    fixtureId,
    fixtureArtifactSha256,
  };
}

function computeD034BenchmarkRunIdentityFingerprint(bundle, profileId, fixtureId, fixtureArtifactSha256) {
  return fingerprint(runIdentityCore(bundle, profileId, fixtureId, fixtureArtifactSha256));
}

function computeD034BenchmarkRunDiagnosticFingerprint(runRecord) {
  assertDataTree(runRecord, "runRecord");
  if (!runRecord || typeof runRecord !== "object" || Array.isArray(runRecord)) fail("runRecord object required");
  const payload = Object.fromEntries(Object.entries(runRecord).filter(([key]) => key !== "diagnosticFingerprint"));
  return fingerprint(payload);
}

function normalizeProtocolIdentity(value) {
  const field = "protocolIdentity";
  assertExactKeys(value, [
    "protocolId", "protocolRevision", "sourcePacketVersion", "sourceCardCommit", "sourceCardBlobOid", "sourceCardSha256",
  ], field);
  const exact = {
    protocolId: PROTOCOL_ID,
    sourcePacketVersion: SOURCE_PACKET_VERSION,
    sourceCardCommit: SOURCE_CARD_COMMIT,
    sourceCardBlobOid: SOURCE_CARD_BLOB_OID,
    sourceCardSha256: SOURCE_CARD_SHA256,
  };
  for (const [key, expected] of Object.entries(exact)) {
    if (value[key] !== expected) fail("protocol source identity changed", undefined, { field: `${field}.${key}` });
  }
  return {
    protocolId: PROTOCOL_ID,
    protocolRevision: normalizePattern(value.protocolRevision, `${field}.protocolRevision`, /^D034-PROTOCOL-R\d{3}$/, 32),
    sourcePacketVersion: SOURCE_PACKET_VERSION,
    sourceCardCommit: SOURCE_CARD_COMMIT,
    sourceCardBlobOid: SOURCE_CARD_BLOB_OID,
    sourceCardSha256: SOURCE_CARD_SHA256,
  };
}

function normalizeManifestIdentity(value) {
  const field = "manifestIdentity";
  assertExactKeys(value, [
    "contractId", "corpusRevision", "manifestSha256", "manifestInputFingerprint", "manifestResultFingerprint",
    "fixtureCount", "requiredFixtureSlotCountCovered", "requiredFixtureSlotsComplete", "sourceKind", "fixtures",
  ], field);
  if (value.contractId !== MANIFEST_CONTRACT_ID) fail("manifest contract identity changed", undefined, { field: `${field}.contractId` });
  const sourceKinds = new Set(["AUTHORIZED_CORPUS_MANIFEST", "SYNTHETIC_CONTRACT_FIXTURE"]);
  if (!sourceKinds.has(value.sourceKind)) fail("manifest sourceKind is unsupported", undefined, { field: `${field}.sourceKind` });
  if (!Array.isArray(value.fixtures) || value.fixtures.length < 1 || value.fixtures.length > 256) {
    fail("manifest fixtures must contain 1..256 identities", undefined, { field: `${field}.fixtures` });
  }
  const fixtures = value.fixtures.map((fixture, index) => {
    const fixtureField = `${field}.fixtures[${index}]`;
    assertExactKeys(fixture, [
      "fixtureId", "artifactSha256", "expectedOutcome", "expectedReasonCode", "qualityAccessibilityRequired",
    ], fixtureField);
    const fixtureId = normalizePattern(fixture.fixtureId, `${fixtureField}.fixtureId`, /^[a-z0-9][a-zA-Z0-9.-]{0,159}$/, 160);
    if (!Array.isArray(fixture.artifactSha256) || fixture.artifactSha256.length < 1 || fixture.artifactSha256.length > 16) {
      fail("fixture artifactSha256 must contain 1..16 digests", undefined, { field: `${fixtureField}.artifactSha256` });
    }
    const artifactSha256 = fixture.artifactSha256.map((digest, digestIndex) =>
      normalizeSha256(digest, `${fixtureField}.artifactSha256[${digestIndex}]`));
    if (new Set(artifactSha256).size !== artifactSha256.length) fail("fixture artifact digests must be unique", undefined, { field: fixtureField });
    if (!new Set(["ALLOW", "REJECT"]).has(fixture.expectedOutcome)) fail("fixture expectedOutcome is unsupported", undefined, { field: `${fixtureField}.expectedOutcome` });
    if (typeof fixture.qualityAccessibilityRequired !== "boolean") {
      fail("qualityAccessibilityRequired must be boolean", undefined, { field: `${fixtureField}.qualityAccessibilityRequired` });
    }
    return {
      fixtureId,
      artifactSha256,
      expectedOutcome: fixture.expectedOutcome,
      expectedReasonCode: normalizePattern(fixture.expectedReasonCode, `${fixtureField}.expectedReasonCode`, /^[A-Z][A-Z0-9_]*$/, 96),
      qualityAccessibilityRequired: fixture.qualityAccessibilityRequired === true,
    };
  });
  const fixtureIds = fixtures.map(({ fixtureId }) => fixtureId);
  if (new Set(fixtureIds).size !== fixtureIds.length) fail("fixture identities must be unique", undefined, { field: `${field}.fixtures` });
  if (!isDeepStrictEqual(fixtureIds, [...fixtureIds].sort())) fail("fixture identities must use canonical fixtureId order", undefined, { field: `${field}.fixtures` });
  const fixtureCount = normalizeSafeInteger(value.fixtureCount, `${field}.fixtureCount`, { minimum: 1 });
  if (fixtureCount !== fixtures.length) fail("fixtureCount does not match fixtures", undefined, { field: `${field}.fixtureCount` });
  const requiredFixtureSlotCountCovered = normalizeSafeInteger(
    value.requiredFixtureSlotCountCovered,
    `${field}.requiredFixtureSlotCountCovered`,
  );
  if (requiredFixtureSlotCountCovered > 85 || requiredFixtureSlotCountCovered > fixtureCount) {
    fail("required fixture coverage exceeds the manifest identity", undefined, { field: `${field}.requiredFixtureSlotCountCovered` });
  }
  if (value.requiredFixtureSlotsComplete !== (requiredFixtureSlotCountCovered >= 85)) {
    fail("required fixture completeness declaration is inconsistent", undefined, { field });
  }
  if (value.sourceKind === "AUTHORIZED_CORPUS_MANIFEST" && (fixtureCount < 85 || requiredFixtureSlotCountCovered < 85)) {
    fail("authorized corpus manifest must cover all 85 required slots", undefined, { field });
  }
  if (value.sourceKind === "SYNTHETIC_CONTRACT_FIXTURE" && (fixtureCount > 16 || value.requiredFixtureSlotsComplete !== false)) {
    fail("synthetic contract fixture must remain a reduced non-corpus input", undefined, { field });
  }
  return {
    contractId: MANIFEST_CONTRACT_ID,
    corpusRevision: normalizePattern(value.corpusRevision, `${field}.corpusRevision`, /^D034-CORPUS-R\d{3}$/, 32),
    manifestSha256: normalizeSha256(value.manifestSha256, `${field}.manifestSha256`),
    manifestInputFingerprint: normalizeSha256(value.manifestInputFingerprint, `${field}.manifestInputFingerprint`),
    manifestResultFingerprint: normalizeSha256(value.manifestResultFingerprint, `${field}.manifestResultFingerprint`),
    fixtureCount,
    requiredFixtureSlotCountCovered,
    requiredFixtureSlotsComplete: value.requiredFixtureSlotsComplete,
    sourceKind: value.sourceKind,
    fixtures,
  };
}

function normalizeDeviceIdentity(value) {
  const field = "deviceIdentity";
  assertExactKeys(value, [
    "modelIdentifier", "capacityBytes", "iosVersion", "iosBuild", "availableStorageBytes",
    "maximumBatteryCapacityPercent", "powerState", "repairState", "minimumDeviceResolutionRef",
  ], field);
  const powerStates = new Set(["BATTERY", "EXTERNAL_POWER", "UNKNOWN"]);
  const repairStates = new Set(["NO_KNOWN_REPAIR", "REPAIR_DISCLOSED", "UNKNOWN"]);
  if (!powerStates.has(value.powerState)) fail("device powerState is unsupported", undefined, { field: `${field}.powerState` });
  if (!repairStates.has(value.repairState)) fail("device repairState is unsupported", undefined, { field: `${field}.repairState` });
  const capacityBytes = value.capacityBytes === "UNKNOWN" ? "UNKNOWN" : normalizeSafeInteger(value.capacityBytes, `${field}.capacityBytes`, { minimum: 1 });
  const availableStorageBytes = value.availableStorageBytes === "UNKNOWN" ? "UNKNOWN" : normalizeSafeInteger(value.availableStorageBytes, `${field}.availableStorageBytes`);
  const battery = value.maximumBatteryCapacityPercent === "UNKNOWN"
    ? "UNKNOWN"
    : normalizeSafeInteger(value.maximumBatteryCapacityPercent, `${field}.maximumBatteryCapacityPercent`);
  if (battery !== "UNKNOWN" && battery > 100) fail("battery capacity percent is out of range", undefined, { field: `${field}.maximumBatteryCapacityPercent` });
  return {
    modelIdentifier: normalizePattern(value.modelIdentifier, `${field}.modelIdentifier`, /^[A-Za-z0-9,._-]+$/, 96, true),
    capacityBytes,
    iosVersion: normalizePattern(value.iosVersion, `${field}.iosVersion`, /^\d+(?:\.\d+){1,3}$/, 32, true),
    iosBuild: normalizePattern(value.iosBuild, `${field}.iosBuild`, /^[A-Za-z0-9._-]+$/, 64, true),
    availableStorageBytes,
    maximumBatteryCapacityPercent: battery,
    powerState: value.powerState,
    repairState: value.repairState,
    minimumDeviceResolutionRef: normalizePattern(value.minimumDeviceResolutionRef, `${field}.minimumDeviceResolutionRef`, /^[A-Z0-9][A-Z0-9._-]+$/, 128, true),
  };
}

function normalizeEnvironmentIdentity(value) {
  const field = "environmentIdentity";
  assertExactKeys(value, [
    "macModelIdentifier", "macosVersion", "xcodeVersion", "iosSdkVersion", "measurementToolVersion",
    "networkMode", "locale", "language", "lowPowerModeEnabled", "initialThermalState", "bootSessionId",
  ], field);
  const networkModes = new Set(["OFFLINE", "PROVIDER_AUTHORIZED", "UNKNOWN"]);
  const thermalStates = new Set(["NOMINAL", "FAIR", "SERIOUS", "CRITICAL", "UNKNOWN"]);
  if (!networkModes.has(value.networkMode)) fail("networkMode is unsupported", undefined, { field: `${field}.networkMode` });
  if (!thermalStates.has(value.initialThermalState)) fail("initialThermalState is unsupported", undefined, { field: `${field}.initialThermalState` });
  if (![true, false, "UNKNOWN"].includes(value.lowPowerModeEnabled)) fail("lowPowerModeEnabled is unsupported", undefined, { field: `${field}.lowPowerModeEnabled` });
  return {
    macModelIdentifier: normalizePattern(value.macModelIdentifier, `${field}.macModelIdentifier`, /^[A-Za-z0-9,._-]+$/, 96, true),
    macosVersion: normalizePattern(value.macosVersion, `${field}.macosVersion`, /^\d+(?:\.\d+){1,3}$/, 32, true),
    xcodeVersion: normalizePattern(value.xcodeVersion, `${field}.xcodeVersion`, /^\d+(?:\.\d+){1,3}$/, 32, true),
    iosSdkVersion: normalizePattern(value.iosSdkVersion, `${field}.iosSdkVersion`, /^\d+(?:\.\d+){1,3}$/, 32, true),
    measurementToolVersion: normalizePattern(value.measurementToolVersion, `${field}.measurementToolVersion`, /^[A-Za-z0-9][A-Za-z0-9._-]+$/, 96, true),
    networkMode: value.networkMode,
    locale: normalizePattern(value.locale, `${field}.locale`, /^[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/, 32, true),
    language: normalizePattern(value.language, `${field}.language`, /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/, 32, true),
    lowPowerModeEnabled: value.lowPowerModeEnabled,
    initialThermalState: value.initialThermalState,
    bootSessionId: normalizePattern(value.bootSessionId, `${field}.bootSessionId`, /^[A-Z0-9][A-Z0-9._-]+$/, 128, true),
  };
}

function normalizeHarnessIdentity(value) {
  const field = "harnessIdentity";
  assertExactKeys(value, [
    "harnessCommit", "buildConfiguration", "signingClass", "bundleIdentifier", "dependencyLockSha256",
    "compilerSettingsSha256", "artifactSha256", "harnessType",
  ], field);
  const configurations = new Set(["RELEASE", "UNKNOWN"]);
  const signingClasses = new Set(["DEVELOPMENT", "AD_HOC", "APP_STORE", "UNKNOWN"]);
  if (!configurations.has(value.buildConfiguration)) fail("buildConfiguration is unsupported", undefined, { field: `${field}.buildConfiguration` });
  if (!signingClasses.has(value.signingClass)) fail("signingClass is unsupported", undefined, { field: `${field}.signingClass` });
  if (!["ISOLATED_BENCHMARK_HARNESS", "UNKNOWN"].includes(value.harnessType)) fail("harnessType is unsupported", undefined, { field: `${field}.harnessType` });
  return {
    harnessCommit: normalizePattern(value.harnessCommit, `${field}.harnessCommit`, /^[a-f0-9]{40}$/, 40, true),
    buildConfiguration: value.buildConfiguration,
    signingClass: value.signingClass,
    bundleIdentifier: normalizePattern(value.bundleIdentifier, `${field}.bundleIdentifier`, /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/, 255, true),
    dependencyLockSha256: value.dependencyLockSha256 === "UNKNOWN" ? "UNKNOWN" : normalizeSha256(value.dependencyLockSha256, `${field}.dependencyLockSha256`),
    compilerSettingsSha256: value.compilerSettingsSha256 === "UNKNOWN" ? "UNKNOWN" : normalizeSha256(value.compilerSettingsSha256, `${field}.compilerSettingsSha256`),
    artifactSha256: value.artifactSha256 === "UNKNOWN" ? "UNKNOWN" : normalizeSha256(value.artifactSha256, `${field}.artifactSha256`),
    harnessType: value.harnessType,
  };
}

function normalizeStageRecord(value, index, run, field) {
  const stageField = `${field}.stageRecords[${index}]`;
  assertExactKeys(value, [
    "stageId", "entered", "startedMonotonicNs", "endedMonotonicNs", "inputBytes", "outputBytes",
    "structureCount", "terminalState", "reasonCode",
  ], stageField);
  if (value.stageId !== STAGE_IDS[index]) fail("stage order or identity changed", undefined, { field: `${stageField}.stageId` });
  if (typeof value.entered !== "boolean") fail("stage entered must be boolean", undefined, { field: `${stageField}.entered` });
  const terminalStates = new Set(["SUCCEEDED", "REJECTED", "CANCELLED", "FAILED", "NOT_REACHED"]);
  if (!terminalStates.has(value.terminalState)) fail("stage terminalState is unsupported", undefined, { field: `${stageField}.terminalState` });
  const startedMonotonicNs = normalizeSafeInteger(value.startedMonotonicNs, `${stageField}.startedMonotonicNs`, { nullable: true });
  const endedMonotonicNs = normalizeSafeInteger(value.endedMonotonicNs, `${stageField}.endedMonotonicNs`, { nullable: true });
  const inputBytes = normalizeSafeInteger(value.inputBytes, `${stageField}.inputBytes`);
  const outputBytes = normalizeSafeInteger(value.outputBytes, `${stageField}.outputBytes`);
  const structureCount = normalizeSafeInteger(value.structureCount, `${stageField}.structureCount`);
  const reasonCode = normalizePattern(value.reasonCode, `${stageField}.reasonCode`, /^[A-Z][A-Z0-9_]*$/, 96);
  if (value.entered) {
    if (startedMonotonicNs === null || endedMonotonicNs === null || endedMonotonicNs < startedMonotonicNs) {
      fail("entered stage must have monotonic timestamps", undefined, { field: stageField });
    }
    if (startedMonotonicNs < run.startedMonotonicNs || endedMonotonicNs > run.endedMonotonicNs || value.terminalState === "NOT_REACHED") {
      fail("entered stage falls outside the run or claims NOT_REACHED", undefined, { field: stageField });
    }
  } else if (
    startedMonotonicNs !== null || endedMonotonicNs !== null || inputBytes !== 0 || outputBytes !== 0 ||
    structureCount !== 0 || value.terminalState !== "NOT_REACHED" || reasonCode !== "NOT_REACHED"
  ) {
    fail("unentered stage must be an explicit empty NOT_REACHED record", undefined, { field: stageField });
  }
  return {
    stageId: value.stageId,
    entered: value.entered,
    startedMonotonicNs,
    endedMonotonicNs,
    inputBytes,
    outputBytes,
    structureCount,
    terminalState: value.terminalState,
    reasonCode,
  };
}

function normalizeRunRecord(value, index, bundle, fixtureById) {
  const field = `runRecords[${index}]`;
  assertExactKeys(value, [
    "schemaVersion", "runId", "runGroupId", "profileId", "fixtureId", "fixtureArtifactSha256",
    "repetitionKind", "repetitionIndex", "profileOrderInGroup", "identityFingerprint", "startedMonotonicNs",
    "endedMonotonicNs", "stageRecords", "metrics", "observedDisposition", "observedReasonCode", "discardState",
    "discardReasonCode", "cleanupEvidence", "diagnosticFingerprint", "containsRealUserData", "containsCredential",
  ], field);
  if (value.schemaVersion !== RUN_RECORD_SCHEMA_VERSION) fail("run record schemaVersion changed", undefined, { field: `${field}.schemaVersion` });
  const runId = normalizePattern(value.runId, `${field}.runId`, /^D034-RUN-[A-Z0-9._-]+$/, 128);
  const runGroupId = normalizePattern(value.runGroupId, `${field}.runGroupId`, /^D034-GROUP-[A-Z0-9._-]+$/, 128);
  if (!PROFILE_IDS.includes(value.profileId)) fail("run profileId is unsupported", undefined, { field: `${field}.profileId` });
  const fixtureId = normalizePattern(value.fixtureId, `${field}.fixtureId`, /^[a-z0-9][a-zA-Z0-9.-]{0,159}$/, 160);
  const fixture = fixtureById.get(fixtureId);
  if (!fixture) fail("run fixtureId is not present in the manifest identity", undefined, { field: `${field}.fixtureId` });
  if (!isDeepStrictEqual(value.fixtureArtifactSha256, fixture.artifactSha256)) fail("run fixture artifact identity changed", undefined, { field: `${field}.fixtureArtifactSha256` });
  if (!["WARMUP", "MEASURED"].includes(value.repetitionKind)) fail("repetitionKind is unsupported", undefined, { field: `${field}.repetitionKind` });
  const repetitionIndex = normalizeSafeInteger(value.repetitionIndex, `${field}.repetitionIndex`, { minimum: 1 });
  const profileOrderInGroup = normalizeSafeInteger(value.profileOrderInGroup, `${field}.profileOrderInGroup`, { minimum: 1 });
  if (profileOrderInGroup > 3) fail("profileOrderInGroup must be 1..3", undefined, { field: `${field}.profileOrderInGroup` });
  const startedMonotonicNs = normalizeSafeInteger(value.startedMonotonicNs, `${field}.startedMonotonicNs`);
  const endedMonotonicNs = normalizeSafeInteger(value.endedMonotonicNs, `${field}.endedMonotonicNs`);
  if (endedMonotonicNs < startedMonotonicNs) fail("run monotonic timestamps are reversed", undefined, { field });
  const runShell = { startedMonotonicNs, endedMonotonicNs };
  if (!Array.isArray(value.stageRecords) || value.stageRecords.length !== STAGE_IDS.length) {
    fail("run must contain the exact eight stages", undefined, { field: `${field}.stageRecords` });
  }
  const stageRecords = value.stageRecords.map((stage, stageIndex) => normalizeStageRecord(stage, stageIndex, runShell, field));
  for (let stageIndex = 1; stageIndex < stageRecords.length; stageIndex += 1) {
    const previous = stageRecords[stageIndex - 1];
    const current = stageRecords[stageIndex];
    if (previous.entered && current.entered && current.startedMonotonicNs < previous.startedMonotonicNs) {
      fail("entered stage starts are not monotonic", undefined, { field: `${field}.stageRecords` });
    }
  }
  assertExactKeys(value.metrics, METRIC_IDS, `${field}.metrics`);
  const metrics = Object.fromEntries(METRIC_IDS.map((metricId) => [
    metricId,
    normalizeSafeInteger(value.metrics[metricId], `${field}.metrics.${metricId}`),
  ]));
  const observedDispositions = new Set([
    "EXPECTED_ALLOW", "EXPECTED_REJECT", "UNEXPECTED_ALLOW", "UNEXPECTED_REJECT", "EXECUTION_FAILURE",
  ]);
  if (!observedDispositions.has(value.observedDisposition)) fail("observedDisposition is unsupported", undefined, { field: `${field}.observedDisposition` });
  const observedReasonCode = normalizePattern(value.observedReasonCode, `${field}.observedReasonCode`, /^[A-Z][A-Z0-9_]*$/, 96);
  const discardStates = new Set(["COUNTED", "DISCARDED_UNCONTROLLED_THERMAL", "DISCARDED_IDENTITY_DRIFT", "DISCARDED_MEASUREMENT_INVALID"]);
  if (!discardStates.has(value.discardState)) fail("discardState is unsupported", undefined, { field: `${field}.discardState` });
  const discardReasonCode = value.discardReasonCode === null
    ? null
    : normalizePattern(value.discardReasonCode, `${field}.discardReasonCode`, /^[A-Z][A-Z0-9_]*$/, 96);
  if ((value.discardState === "COUNTED") !== (discardReasonCode === null)) {
    fail("discard reason must be null only for counted records", undefined, { field: `${field}.discardReasonCode` });
  }
  assertExactKeys(value.cleanupEvidence, ["attempted", "completed", "residualObjects", "temporaryBytesRemaining"], `${field}.cleanupEvidence`);
  if (typeof value.cleanupEvidence.attempted !== "boolean" || typeof value.cleanupEvidence.completed !== "boolean") {
    fail("cleanup evidence booleans are required", undefined, { field: `${field}.cleanupEvidence` });
  }
  const cleanupEvidence = {
    attempted: value.cleanupEvidence.attempted,
    completed: value.cleanupEvidence.completed,
    residualObjects: normalizeSafeInteger(value.cleanupEvidence.residualObjects, `${field}.cleanupEvidence.residualObjects`),
    temporaryBytesRemaining: normalizeSafeInteger(value.cleanupEvidence.temporaryBytesRemaining, `${field}.cleanupEvidence.temporaryBytesRemaining`),
  };
  if (cleanupEvidence.residualObjects !== metrics.residualObjectCount) {
    fail("cleanup residual count does not match metrics", undefined, { field: `${field}.cleanupEvidence` });
  }
  if (value.containsRealUserData !== false || value.containsCredential !== false) {
    fail("real user data and credentials are forbidden", "UNSAFE_D034_BENCHMARK_RUN_REPORT", { field });
  }
  const expectedIdentityFingerprint = computeD034BenchmarkRunIdentityFingerprint(
    bundle,
    value.profileId,
    fixtureId,
    fixture.artifactSha256,
  );
  if (value.identityFingerprint !== expectedIdentityFingerprint) fail("run identity fingerprint changed", undefined, { field: `${field}.identityFingerprint` });
  const normalized = {
    schemaVersion: RUN_RECORD_SCHEMA_VERSION,
    runId,
    runGroupId,
    profileId: value.profileId,
    fixtureId,
    fixtureArtifactSha256: [...fixture.artifactSha256],
    repetitionKind: value.repetitionKind,
    repetitionIndex,
    profileOrderInGroup,
    identityFingerprint: expectedIdentityFingerprint,
    startedMonotonicNs,
    endedMonotonicNs,
    stageRecords,
    metrics,
    observedDisposition: value.observedDisposition,
    observedReasonCode,
    discardState: value.discardState,
    discardReasonCode,
    cleanupEvidence,
    diagnosticFingerprint: value.diagnosticFingerprint,
    containsRealUserData: false,
    containsCredential: false,
  };
  if (value.diagnosticFingerprint !== computeD034BenchmarkRunDiagnosticFingerprint(normalized)) {
    fail("run diagnostic fingerprint changed", undefined, { field: `${field}.diagnosticFingerprint` });
  }
  return normalized;
}

function validateRunGroups(runRecords) {
  const groups = new Map();
  for (const run of runRecords) {
    const group = groups.get(run.runGroupId) ?? [];
    group.push(run);
    groups.set(run.runGroupId, group);
  }
  const countedRotations = new Set();
  for (const [runGroupId, group] of groups) {
    if (group.length !== 3 || new Set(group.map(({ profileId }) => profileId)).size !== 3) {
      fail("run group must retain exactly one A/B/C record", undefined, { field: `runGroup:${runGroupId}` });
    }
    for (const key of ["fixtureId", "repetitionKind", "repetitionIndex"]) {
      if (new Set(group.map((run) => run[key])).size !== 1) fail("run group identity drifted", undefined, { field: `runGroup:${runGroupId}.${key}` });
    }
    const ordered = [...group].sort((left, right) => left.profileOrderInGroup - right.profileOrderInGroup);
    if (!isDeepStrictEqual(ordered.map(({ profileOrderInGroup }) => profileOrderInGroup), [1, 2, 3])) {
      fail("run group profile order positions are incomplete", undefined, { field: `runGroup:${runGroupId}` });
    }
    const rotationIndex = ROTATIONS.findIndex((rotation) => isDeepStrictEqual(ordered.map(({ profileId }) => profileId), rotation));
    if (rotationIndex < 0) fail("run group profile rotation is unsupported", undefined, { field: `runGroup:${runGroupId}` });
    const discardStates = new Set(group.map(({ discardState }) => discardState));
    const discardReasons = new Set(group.map(({ discardReasonCode }) => discardReasonCode));
    if (discardStates.size !== 1 || discardReasons.size !== 1) {
      fail("discard must retain or count the whole A/B/C group", undefined, { field: `runGroup:${runGroupId}` });
    }
    if (group[0].discardState === "COUNTED") countedRotations.add(rotationIndex);
  }
  return { groupCount: groups.size, countedRotationCount: countedRotations.size };
}

function normalizeDistribution(value, field) {
  assertExactKeys(value, ["sampleCount", "minimum", "median", "p95", "maximum"], field);
  const sampleCount = normalizeSafeInteger(value.sampleCount, `${field}.sampleCount`);
  const numbers = [value.minimum, value.median, value.p95, value.maximum];
  if (sampleCount === 0) {
    if (!numbers.every((number) => number === null)) fail("empty distribution must use null statistics", undefined, { field });
  } else if (!numbers.every((number) => typeof number === "number" && Number.isFinite(number) && number >= 0)) {
    fail("distribution statistics must be finite non-negative numbers", undefined, { field });
  }
  return {
    sampleCount,
    minimum: value.minimum,
    median: value.median,
    p95: value.p95,
    maximum: value.maximum,
  };
}

function normalizeExpectedObserved(value, field) {
  assertExactKeys(value, ["expectedScenarioCount", "countedMeasuredRunCount", "matchedRunCount"], field);
  return {
    expectedScenarioCount: normalizeSafeInteger(value.expectedScenarioCount, `${field}.expectedScenarioCount`),
    countedMeasuredRunCount: normalizeSafeInteger(value.countedMeasuredRunCount, `${field}.countedMeasuredRunCount`),
    matchedRunCount: normalizeSafeInteger(value.matchedRunCount, `${field}.matchedRunCount`),
  };
}

function normalizeProfileReport(value, index, fixtureById) {
  const field = `profileReports[${index}]`;
  assertExactKeys(value, [
    "profileId", "scenarioCount", "countedWarmupRunCount", "countedMeasuredRunCount", "discardedRunCount",
    "allowedExpectedAndObserved", "rejectedExpectedAndObserved", "stageLatencyDistributions", ...DISTRIBUTION_FIELDS,
    "crashJetsamWatchdogHangCounts", "qualityAccessibilityEvidenceRefs", "disposition",
  ], field);
  if (value.profileId !== PROFILE_IDS[index]) fail("profile report order or identity changed", undefined, { field: `${field}.profileId` });
  assertExactKeys(value.stageLatencyDistributions, STAGE_IDS, `${field}.stageLatencyDistributions`);
  const stageLatencyDistributions = Object.fromEntries(STAGE_IDS.map((stageId) => [
    stageId,
    normalizeDistribution(value.stageLatencyDistributions[stageId], `${field}.stageLatencyDistributions.${stageId}`),
  ]));
  const distributions = Object.fromEntries(DISTRIBUTION_FIELDS.map((distributionField) => [
    distributionField,
    normalizeDistribution(value[distributionField], `${field}.${distributionField}`),
  ]));
  assertExactKeys(value.crashJetsamWatchdogHangCounts, ["crashCount", "jetsamCount", "watchdogCount", "hangCount"], `${field}.crashJetsamWatchdogHangCounts`);
  const crashJetsamWatchdogHangCounts = Object.fromEntries(
    ["crashCount", "jetsamCount", "watchdogCount", "hangCount"].map((metricId) => [
      metricId,
      normalizeSafeInteger(value.crashJetsamWatchdogHangCounts[metricId], `${field}.crashJetsamWatchdogHangCounts.${metricId}`),
    ]),
  );
  if (!Array.isArray(value.qualityAccessibilityEvidenceRefs) || value.qualityAccessibilityEvidenceRefs.length > 256) {
    fail("quality evidence refs exceed the resource boundary", undefined, { field: `${field}.qualityAccessibilityEvidenceRefs` });
  }
  const qualityAccessibilityEvidenceRefs = value.qualityAccessibilityEvidenceRefs.map((reference, referenceIndex) => {
    const referenceField = `${field}.qualityAccessibilityEvidenceRefs[${referenceIndex}]`;
    assertExactKeys(reference, ["fixtureId", "evidenceRef", "evidenceSha256"], referenceField);
    const fixtureId = normalizeString(reference.fixtureId, `${referenceField}.fixtureId`, 160);
    if (!fixtureById.get(fixtureId)?.qualityAccessibilityRequired) fail("quality evidence ref is not bound to a required fixture", undefined, { field: referenceField });
    return {
      fixtureId,
      evidenceRef: normalizePattern(reference.evidenceRef, `${referenceField}.evidenceRef`, /^[A-Z0-9][A-Z0-9._-]+$/, 128),
      evidenceSha256: normalizeSha256(reference.evidenceSha256, `${referenceField}.evidenceSha256`),
    };
  });
  const qualityFixtureIds = qualityAccessibilityEvidenceRefs.map(({ fixtureId }) => fixtureId);
  if (new Set(qualityFixtureIds).size !== qualityFixtureIds.length) fail("quality evidence fixture refs must be unique", undefined, { field });
  qualityAccessibilityEvidenceRefs.sort((left, right) => left.fixtureId.localeCompare(right.fixtureId));
  if (!["MEASURED_PROFILE_PASS_CANDIDATE", "FAIL", "INCONCLUSIVE"].includes(value.disposition)) {
    fail("profile disposition is unsupported", undefined, { field: `${field}.disposition` });
  }
  return {
    profileId: value.profileId,
    scenarioCount: normalizeSafeInteger(value.scenarioCount, `${field}.scenarioCount`),
    countedWarmupRunCount: normalizeSafeInteger(value.countedWarmupRunCount, `${field}.countedWarmupRunCount`),
    countedMeasuredRunCount: normalizeSafeInteger(value.countedMeasuredRunCount, `${field}.countedMeasuredRunCount`),
    discardedRunCount: normalizeSafeInteger(value.discardedRunCount, `${field}.discardedRunCount`),
    allowedExpectedAndObserved: normalizeExpectedObserved(value.allowedExpectedAndObserved, `${field}.allowedExpectedAndObserved`),
    rejectedExpectedAndObserved: normalizeExpectedObserved(value.rejectedExpectedAndObserved, `${field}.rejectedExpectedAndObserved`),
    stageLatencyDistributions,
    ...distributions,
    crashJetsamWatchdogHangCounts,
    qualityAccessibilityEvidenceRefs,
    disposition: value.disposition,
  };
}

function normalizeFinding(value, index, fixtureById, runById) {
  const field = `findings[${index}]`;
  assertExactKeys(value, [
    "findingId", "severity", "profileId", "fixtureId", "runId", "status", "ownerRef", "dueAt", "summarySha256",
  ], field);
  const findingId = normalizePattern(value.findingId, `${field}.findingId`, /^D034-FINDING-[A-Z0-9._-]+$/, 128);
  if (!["P0", "P1", "P2", "P3"].includes(value.severity)) fail("finding severity is unsupported", undefined, { field: `${field}.severity` });
  if (value.profileId !== null && !PROFILE_IDS.includes(value.profileId)) fail("finding profileId is unsupported", undefined, { field: `${field}.profileId` });
  if (value.fixtureId !== null && !fixtureById.has(value.fixtureId)) fail("finding fixtureId is unknown", undefined, { field: `${field}.fixtureId` });
  if (value.runId !== null && !runById.has(value.runId)) fail("finding runId is unknown", undefined, { field: `${field}.runId` });
  if (!["OPEN", "CLOSED"].includes(value.status)) fail("finding status is unsupported", undefined, { field: `${field}.status` });
  const ownerRef = value.ownerRef === null ? null : normalizePattern(value.ownerRef, `${field}.ownerRef`, /^[A-Z0-9][A-Z0-9._-]+$/, 128);
  const dueAt = normalizeTimestamp(value.dueAt, `${field}.dueAt`, true);
  if (value.severity === "P3" && value.status === "OPEN" && (ownerRef === null || dueAt === null)) {
    fail("open P3 finding requires owner and due date", undefined, { field });
  }
  return {
    findingId,
    severity: value.severity,
    profileId: value.profileId,
    fixtureId: value.fixtureId,
    runId: value.runId,
    status: value.status,
    ownerRef,
    dueAt,
    summarySha256: normalizeSha256(value.summarySha256, `${field}.summarySha256`),
  };
}

function normalizeIndependentReviewRef(value, index) {
  const field = `independentReviewRefs[${index}]`;
  assertExactKeys(value, ["reviewId", "reviewerRole", "reviewedArtifactSha256", "disposition", "summarySha256", "signedAt"], field);
  if (!["SECURITY", "QA"].includes(value.reviewerRole)) fail("reviewerRole is unsupported", undefined, { field: `${field}.reviewerRole` });
  if (!["APPROVED", "CHANGES_REQUIRED", "INCONCLUSIVE"].includes(value.disposition)) fail("review disposition is unsupported", undefined, { field: `${field}.disposition` });
  return {
    reviewId: normalizePattern(value.reviewId, `${field}.reviewId`, /^D034-REVIEW-[A-Z0-9._-]+$/, 128),
    reviewerRole: value.reviewerRole,
    reviewedArtifactSha256: normalizeSha256(value.reviewedArtifactSha256, `${field}.reviewedArtifactSha256`),
    disposition: value.disposition,
    summarySha256: normalizeSha256(value.summarySha256, `${field}.summarySha256`),
    signedAt: normalizeTimestamp(value.signedAt, `${field}.signedAt`),
  };
}

function hasUnknown(value) {
  if (value === "UNKNOWN") return true;
  if (Array.isArray(value)) return value.some(hasUnknown);
  if (value && typeof value === "object") return Object.values(value).some(hasUnknown);
  return false;
}

function distribution(values) {
  if (values.length === 0) return { sampleCount: 0, minimum: null, median: null, p95: null, maximum: null };
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return {
    sampleCount: sorted.length,
    minimum: sorted[0],
    median,
    p95: sorted[Math.ceil(0.95 * sorted.length) - 1],
    maximum: sorted.at(-1),
  };
}

function indicesAreContiguous(runs) {
  const indices = [...new Set(runs.map(({ repetitionIndex }) => repetitionIndex))].sort((left, right) => left - right);
  return indices.length === runs.length && indices.every((value, index) => value === index + 1);
}

function deriveProfileReport(profileId, runs, manifestIdentity, suppliedReport, countedRotationCount, identityComplete, findings) {
  const countedWarmup = runs.filter((run) => run.discardState === "COUNTED" && run.repetitionKind === "WARMUP");
  const countedMeasured = runs.filter((run) => run.discardState === "COUNTED" && run.repetitionKind === "MEASURED");
  const discarded = runs.filter((run) => run.discardState !== "COUNTED");
  const fixtureById = new Map(manifestIdentity.fixtures.map((fixture) => [fixture.fixtureId, fixture]));
  const expectedAllowFixtures = manifestIdentity.fixtures.filter(({ expectedOutcome }) => expectedOutcome === "ALLOW");
  const expectedRejectFixtures = manifestIdentity.fixtures.filter(({ expectedOutcome }) => expectedOutcome === "REJECT");
  const matchedAllow = countedMeasured.filter((run) => {
    const fixture = fixtureById.get(run.fixtureId);
    return fixture.expectedOutcome === "ALLOW" && run.observedDisposition === "EXPECTED_ALLOW" && run.observedReasonCode === fixture.expectedReasonCode;
  });
  const matchedReject = countedMeasured.filter((run) => {
    const fixture = fixtureById.get(run.fixtureId);
    return fixture.expectedOutcome === "REJECT" && run.observedDisposition === "EXPECTED_REJECT" && run.observedReasonCode === fixture.expectedReasonCode;
  });
  const stageLatencyDistributions = Object.fromEntries(STAGE_IDS.map((stageId, stageIndex) => [
    stageId,
    distribution(countedMeasured.flatMap((run) => {
      const stage = run.stageRecords[stageIndex];
      return stage.entered ? [stage.endedMonotonicNs - stage.startedMonotonicNs] : [];
    })),
  ]));
  const metricDistributions = Object.fromEntries(DISTRIBUTION_FIELDS.map((field) => [
    field,
    distribution(countedMeasured.map((run) => run.metrics[DISTRIBUTION_METRICS[field]])),
  ]));
  const crashJetsamWatchdogHangCounts = Object.fromEntries(
    ["crashCount", "jetsamCount", "watchdogCount", "hangCount"].map((metricId) => [
      metricId,
      countedMeasured.reduce((sum, run) => sum + run.metrics[metricId], 0),
    ]),
  );
  const coverageComplete = manifestIdentity.fixtures.every(({ fixtureId }) => {
    const warmups = countedWarmup.filter((run) => run.fixtureId === fixtureId);
    const measured = countedMeasured.filter((run) => run.fixtureId === fixtureId);
    return warmups.length >= 3 && measured.length >= 10 && indicesAreContiguous(warmups) && indicesAreContiguous(measured);
  });
  const qualityFixtureIds = manifestIdentity.fixtures.filter(({ qualityAccessibilityRequired }) => qualityAccessibilityRequired).map(({ fixtureId }) => fixtureId);
  const suppliedQualityFixtureIds = suppliedReport.qualityAccessibilityEvidenceRefs.map(({ fixtureId }) => fixtureId);
  const qualityComplete = qualityFixtureIds.every((fixtureId) => suppliedQualityFixtureIds.includes(fixtureId));
  const unsafeMeasured = countedMeasured.some((run) =>
    run.metrics.foregroundRequestCountPeak > 1 ||
    run.metrics.databaseWriteCount > 0 ||
    run.metrics.residualObjectCount > 0 ||
    run.metrics.crashCount > 0 ||
    run.metrics.jetsamCount > 0 ||
    run.metrics.watchdogCount > 0 ||
    run.metrics.hangCount > 0 ||
    run.metrics.unexplainedMemoryPeakCount > 0 ||
    run.metrics.secretOrBodyLogFindingCount > 0 ||
    !run.cleanupEvidence.attempted ||
    !run.cleanupEvidence.completed ||
    run.cleanupEvidence.residualObjects > 0 ||
    run.cleanupEvidence.temporaryBytesRemaining > 0 ||
    ["UNEXPECTED_ALLOW", "UNEXPECTED_REJECT", "EXECUTION_FAILURE"].includes(run.observedDisposition));
  const openCriticalFinding = findings.some((finding) =>
    finding.status === "OPEN" && ["P0", "P1", "P2"].includes(finding.severity) &&
    (finding.profileId === null || finding.profileId === profileId));
  let disposition = "MEASURED_PROFILE_PASS_CANDIDATE";
  if (unsafeMeasured || openCriticalFinding || matchedAllow.length + matchedReject.length !== countedMeasured.length) disposition = "FAIL";
  else if (!identityComplete || !coverageComplete || !qualityComplete || countedRotationCount < 3) disposition = "INCONCLUSIVE";
  return {
    profileId,
    scenarioCount: manifestIdentity.fixtures.length,
    countedWarmupRunCount: countedWarmup.length,
    countedMeasuredRunCount: countedMeasured.length,
    discardedRunCount: discarded.length,
    allowedExpectedAndObserved: {
      expectedScenarioCount: expectedAllowFixtures.length,
      countedMeasuredRunCount: countedMeasured.filter((run) => fixtureById.get(run.fixtureId).expectedOutcome === "ALLOW").length,
      matchedRunCount: matchedAllow.length,
    },
    rejectedExpectedAndObserved: {
      expectedScenarioCount: expectedRejectFixtures.length,
      countedMeasuredRunCount: countedMeasured.filter((run) => fixtureById.get(run.fixtureId).expectedOutcome === "REJECT").length,
      matchedRunCount: matchedReject.length,
    },
    stageLatencyDistributions,
    ...metricDistributions,
    crashJetsamWatchdogHangCounts,
    qualityAccessibilityEvidenceRefs: suppliedReport.qualityAccessibilityEvidenceRefs,
    disposition,
  };
}

function normalizeD034BenchmarkRunReport(input) {
  assertDataTree(input);
  assertExactKeys(input, [
    "schemaVersion", "reportId", "protocolIdentity", "manifestIdentity", "deviceIdentity", "environmentIdentity",
    "harnessIdentity", "executionAuthorizationRef", "profileReports", "runRecords", "findings", "independentReviewRefs",
    "generatedAt", "reportSha256", "containsRealUserData", "containsCredential",
  ], "input");
  if (input.schemaVersion !== INPUT_SCHEMA_VERSION) fail("bundle schemaVersion changed", undefined, { field: "schemaVersion" });
  if (input.reportSha256 !== computeD034BenchmarkReportSha256(input)) fail("reportSha256 does not bind the complete bundle", undefined, { field: "reportSha256" });
  if (input.containsRealUserData !== false || input.containsCredential !== false) {
    fail("real user data and credentials are forbidden", "UNSAFE_D034_BENCHMARK_RUN_REPORT", { field: "input" });
  }
  const reportId = normalizePattern(input.reportId, "reportId", /^D034-REPORT-R\d{3}$/, 32);
  const protocolIdentity = normalizeProtocolIdentity(input.protocolIdentity);
  const manifestIdentity = normalizeManifestIdentity(input.manifestIdentity);
  const deviceIdentity = normalizeDeviceIdentity(input.deviceIdentity);
  const environmentIdentity = normalizeEnvironmentIdentity(input.environmentIdentity);
  const harnessIdentity = normalizeHarnessIdentity(input.harnessIdentity);
  const executionAuthorizationRef = normalizePattern(input.executionAuthorizationRef, "executionAuthorizationRef", /^[A-Z0-9][A-Z0-9._-]+$/, 128, true);
  const identityBundle = { protocolIdentity, manifestIdentity, deviceIdentity, environmentIdentity, harnessIdentity };
  if (!Array.isArray(input.runRecords) || input.runRecords.length < 1 || input.runRecords.length > 50_000) {
    fail("runRecords must contain 1..50000 records", undefined, { field: "runRecords" });
  }
  const fixtureById = new Map(manifestIdentity.fixtures.map((fixture) => [fixture.fixtureId, fixture]));
  const runRecords = input.runRecords.map((run, index) => normalizeRunRecord(run, index, identityBundle, fixtureById));
  const runIds = runRecords.map(({ runId }) => runId);
  if (new Set(runIds).size !== runIds.length) fail("runId values must be globally unique", undefined, { field: "runRecords" });
  const groupSummary = validateRunGroups(runRecords);
  const runById = new Map(runRecords.map((run) => [run.runId, run]));
  if (!Array.isArray(input.findings) || input.findings.length > 512) fail("findings exceed the resource boundary", undefined, { field: "findings" });
  const findings = input.findings.map((finding, index) => normalizeFinding(finding, index, fixtureById, runById));
  const findingIds = findings.map(({ findingId }) => findingId);
  if (new Set(findingIds).size !== findingIds.length) fail("finding IDs must be unique", undefined, { field: "findings" });
  findings.sort((left, right) => left.findingId.localeCompare(right.findingId));
  if (!Array.isArray(input.independentReviewRefs) || input.independentReviewRefs.length > 32) {
    fail("independent review refs exceed the resource boundary", undefined, { field: "independentReviewRefs" });
  }
  const independentReviewRefs = input.independentReviewRefs.map(normalizeIndependentReviewRef);
  const reviewIds = independentReviewRefs.map(({ reviewId }) => reviewId);
  if (new Set(reviewIds).size !== reviewIds.length) fail("review IDs must be unique", undefined, { field: "independentReviewRefs" });
  independentReviewRefs.sort((left, right) => left.reviewId.localeCompare(right.reviewId));
  if (!Array.isArray(input.profileReports) || input.profileReports.length !== PROFILE_IDS.length) {
    fail("profileReports must contain A/B/C", undefined, { field: "profileReports" });
  }
  const profileReports = input.profileReports.map((report, index) => normalizeProfileReport(report, index, fixtureById));
  const identityComplete = !hasUnknown({ deviceIdentity, environmentIdentity, harnessIdentity, executionAuthorizationRef });
  const derivedProfileReports = PROFILE_IDS.map((profileId, index) => deriveProfileReport(
    profileId,
    runRecords.filter((run) => run.profileId === profileId),
    manifestIdentity,
    profileReports[index],
    groupSummary.countedRotationCount,
    identityComplete,
    findings,
  ));
  if (!isDeepStrictEqual(profileReports, derivedProfileReports)) {
    fail("profile report aggregates or disposition do not match raw counted measured records", undefined, { field: "profileReports" });
  }
  return immutable({
    schemaVersion: INPUT_SCHEMA_VERSION,
    reportId,
    protocolIdentity,
    manifestIdentity,
    deviceIdentity,
    environmentIdentity,
    harnessIdentity,
    executionAuthorizationRef,
    profileReports,
    runRecords,
    findings,
    independentReviewRefs,
    generatedAt: normalizeTimestamp(input.generatedAt, "generatedAt"),
    reportSha256: input.reportSha256,
    containsRealUserData: false,
    containsCredential: false,
  });
}

function evaluateD034BenchmarkRunReport(input) {
  const normalized = normalizeD034BenchmarkRunReport(input);
  const profileDispositions = normalized.profileReports.map(({ profileId, disposition }) => ({ profileId, disposition }));
  const overallDisposition = profileDispositions.some(({ disposition }) => disposition === "FAIL")
    ? "FAIL"
    : profileDispositions.some(({ disposition }) => disposition === "INCONCLUSIVE")
      ? "INCONCLUSIVE"
      : "MEASURED_REVIEW_REQUIRED";
  const countedWarmupRunCount = normalized.runRecords.filter((run) => run.discardState === "COUNTED" && run.repetitionKind === "WARMUP").length;
  const countedMeasuredRunCount = normalized.runRecords.filter((run) => run.discardState === "COUNTED" && run.repetitionKind === "MEASURED").length;
  const discardedRunCount = normalized.runRecords.filter((run) => run.discardState !== "COUNTED").length;
  const blockers = [
    "IDENTITY_CLAIMS_CALLER_ASSERTED_NOT_VERIFIED",
    "FIXTURE_ARTIFACTS_CALLER_ASSERTED_NOT_VERIFIED",
    "INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED",
    "BENCHMARK_EXECUTION_NOT_AUTHORIZED_BY_VALIDATOR",
    "DEVICE_BENCHMARK_PASS_NOT_GRANTED",
  ];
  if (normalized.manifestIdentity.sourceKind === "SYNTHETIC_CONTRACT_FIXTURE") blockers.unshift("SYNTHETIC_CONTRACT_FIXTURE_ONLY");
  const core = immutable({
    schemaVersion: RESULT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    reportId: normalized.reportId,
    disposition: "STRUCTURALLY_COMPLETE_REPORT_ONLY",
    overallDisposition,
    profileDispositions: immutable(profileDispositions),
    syntheticContractFixtureOnly: normalized.manifestIdentity.sourceKind === "SYNTHETIC_CONTRACT_FIXTURE",
    profileCount: PROFILE_IDS.length,
    fixtureCount: normalized.manifestIdentity.fixtureCount,
    rawRunRecordCount: normalized.runRecords.length,
    countedWarmupRunCount,
    countedMeasuredRunCount,
    discardedRunCount,
    findingCount: normalized.findings.length,
    independentReviewRefCount: normalized.independentReviewRefs.length,
    benchmarkPass: false,
    blockers: immutable(blockers),
    inputFingerprint: fingerprint(normalized),
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateD034BenchmarkRunReportResult(result, input) {
  assertDataTree(result, "result");
  const expected = evaluateD034BenchmarkRunReport(input);
  if (!isDeepStrictEqual(result, expected)) fail("D-034 run/report result or fingerprint was changed");
  return expected;
}

export {
  BOUNDARY,
  CONTRACT_ID,
  INPUT_SCHEMA_VERSION,
  METRIC_IDS,
  RESULT_SCHEMA_VERSION,
  ROTATIONS,
  RUN_RECORD_SCHEMA_VERSION,
  STAGE_IDS,
  computeD034BenchmarkReportSha256,
  computeD034BenchmarkRunDiagnosticFingerprint,
  computeD034BenchmarkRunIdentityFingerprint,
  evaluateD034BenchmarkRunReport,
  normalizeD034BenchmarkRunReport,
  validateD034BenchmarkRunReportResult,
};
