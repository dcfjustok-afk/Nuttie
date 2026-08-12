import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const DECISION_ID = /^D-[0-9]{3}$/;
const SHA256 = /^[a-f0-9]{64}$/;

const TARGET_KINDS = Object.freeze({
  WORKING_TREE: "WORKING_TREE",
  DEBUG_BUILD: "DEBUG_BUILD",
  UNSIGNED_RELEASE_BUILD: "UNSIGNED_RELEASE_BUILD",
  SIGNED_RELEASE_ARCHIVE: "SIGNED_RELEASE_ARCHIVE",
});

const DECISION_STATES = Object.freeze({ NOT_DECIDED: "NOT_DECIDED", ACCEPTED: "ACCEPTED" });
const INSPECTION_STATES = Object.freeze({ EXECUTED: "EXECUTED", NOT_EXECUTED: "NOT_EXECUTED" });
const CONFORMANCE = Object.freeze({ CONFORMANT: "CONFORMANT", NONCONFORMANT: "NONCONFORMANT" });

const INSPECTOR_KINDS = Object.freeze({
  STATIC_CONFIGURATION_REPORT: "STATIC_CONFIGURATION_REPORT",
  ARCHIVE_BINARY_REPORT: "ARCHIVE_BINARY_REPORT",
  STORE_METADATA_REPORT: "STORE_METADATA_REPORT",
  SIMULATOR_TEST_REPORT: "SIMULATOR_TEST_REPORT",
  DEVICE_TEST_REPORT: "DEVICE_TEST_REPORT",
  UI_LAYOUT_REPORT: "UI_LAYOUT_REPORT",
  ACCESSIBILITY_TEST_REPORT: "ACCESSIBILITY_TEST_REPORT",
});

const ACCEPTED_RELEASE_BASELINE = Object.freeze({
  platform: "IOS",
  minimumOsVersion: "17.0",
  primaryReleaseLanguage: "zh-Hans",
  appAuthoredUiLanguageScope: "ZH_HANS_ONLY",
  d011Status: "ACCEPTED",
  d016Status: "ACCEPTED",
  englishBrandAssetsAuthorizeBilingualUi: false,
  sourceDataLanguagesMayBePreserved: true,
});

const PLATFORM_DIMENSIONS = Object.freeze({
  DEVICE_FAMILIES: "DEVICE_FAMILIES",
  ORIENTATIONS: "ORIENTATIONS",
  MAC_APP_AVAILABILITY: "MAC_APP_AVAILABILITY",
  VISION_PRO_APP_AVAILABILITY: "VISION_PRO_APP_AVAILABILITY",
});

const ALLOWED_SELECTIONS = Object.freeze({
  [PLATFORM_DIMENSIONS.DEVICE_FAMILIES]: Object.freeze(["IPHONE", "IPAD"]),
  [PLATFORM_DIMENSIONS.ORIENTATIONS]: Object.freeze(["PORTRAIT", "PORTRAIT_UPSIDE_DOWN", "LANDSCAPE_LEFT", "LANDSCAPE_RIGHT"]),
  [PLATFORM_DIMENSIONS.MAC_APP_AVAILABILITY]: Object.freeze(["AVAILABLE", "NOT_AVAILABLE"]),
  [PLATFORM_DIMENSIONS.VISION_PRO_APP_AVAILABILITY]: Object.freeze(["AVAILABLE", "NOT_AVAILABLE"]),
});

const SURFACE_GROUPS = Object.freeze({
  IOS_17_BASELINE: Object.freeze([
    "APP_TARGET_DEPLOYMENT",
    "EXTENSION_TARGET_DEPLOYMENT",
    "PODS_DEPLOYMENT",
    "EMBEDDED_FRAMEWORK_MIN_OS",
    "ARCHIVE_MINIMUM_OS",
    "STORE_MINIMUM_OS",
    "IOS17_SIMULATOR",
    "LATEST_IOS_SIMULATOR",
    "IOS17_DEVICE",
    "LATEST_IOS_DEVICE",
  ]),
  ZH_HANS_RELEASE: Object.freeze([
    "APP_AUTHORED_UI_ZH_HANS",
    "PERMISSION_COPY_ZH_HANS",
    "ERROR_COPY_ZH_HANS",
    "ACCESSIBILITY_COPY_ZH_HANS",
    "TESTFLIGHT_METADATA_ZH_HANS",
    "APP_STORE_METADATA_ZH_HANS",
    "LONG_COPY_320PT",
    "LONG_COPY_375PT",
    "LONG_COPY_430PT",
    "DYNAMIC_TYPE_MAX_ACCESSIBILITY",
    "VOICEOVER_ORDER_AND_VALUES",
  ]),
  PLATFORM_SHAPE: Object.freeze([
    "XCODE_DEVICE_FAMILY_CONFIG",
    "XCODE_ORIENTATION_CONFIG",
    "APP_STORE_MAC_AVAILABILITY",
    "APP_STORE_VISION_AVAILABILITY",
  ]),
});

const REQUIRED_SURFACES = Object.freeze(Object.values(SURFACE_GROUPS).flat());
const EXPECTED_INSPECTOR_KIND = Object.freeze({
  EMBEDDED_FRAMEWORK_MIN_OS: INSPECTOR_KINDS.ARCHIVE_BINARY_REPORT,
  ARCHIVE_MINIMUM_OS: INSPECTOR_KINDS.ARCHIVE_BINARY_REPORT,
  STORE_MINIMUM_OS: INSPECTOR_KINDS.STORE_METADATA_REPORT,
  IOS17_SIMULATOR: INSPECTOR_KINDS.SIMULATOR_TEST_REPORT,
  LATEST_IOS_SIMULATOR: INSPECTOR_KINDS.SIMULATOR_TEST_REPORT,
  IOS17_DEVICE: INSPECTOR_KINDS.DEVICE_TEST_REPORT,
  LATEST_IOS_DEVICE: INSPECTOR_KINDS.DEVICE_TEST_REPORT,
  TESTFLIGHT_METADATA_ZH_HANS: INSPECTOR_KINDS.STORE_METADATA_REPORT,
  APP_STORE_METADATA_ZH_HANS: INSPECTOR_KINDS.STORE_METADATA_REPORT,
  LONG_COPY_320PT: INSPECTOR_KINDS.UI_LAYOUT_REPORT,
  LONG_COPY_375PT: INSPECTOR_KINDS.UI_LAYOUT_REPORT,
  LONG_COPY_430PT: INSPECTOR_KINDS.UI_LAYOUT_REPORT,
  DYNAMIC_TYPE_MAX_ACCESSIBILITY: INSPECTOR_KINDS.ACCESSIBILITY_TEST_REPORT,
  VOICEOVER_ORDER_AND_VALUES: INSPECTOR_KINDS.ACCESSIBILITY_TEST_REPORT,
  APP_STORE_MAC_AVAILABILITY: INSPECTOR_KINDS.STORE_METADATA_REPORT,
  APP_STORE_VISION_AVAILABILITY: INSPECTOR_KINDS.STORE_METADATA_REPORT,
});

const CLAIM_BOUNDARY = Object.freeze({
  d011AndD016AreAcceptedInputs: true,
  platformShapeInferredFromD011D016D038OrCurrentDevice: false,
  formalSignedReleaseTargetRequired: true,
  everyPlatformDimensionMustHaveAcceptedDecision: true,
  everyRequiredSurfaceMustExecute: true,
  decisionTruthVerifiedByThisHarness: false,
  evidenceTruthVerifiedByThisHarness: false,
  releaseGateClosedByThisHarness: false,
});

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${field} must be a plain record`, code, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail(`${field} must be a plain record`, code, { field });
}

function assertExactKeys(value, required, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set(required);
  for (const key of Object.keys(value)) if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, code, { field: `${field}.${key}` });
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
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function normalizeTarget(input, field = "target") {
  const code = "INVALID_PLATFORM_RELEASE_TARGET";
  assertExactKeys(input, ["schemaVersion", "targetId", "targetKind", "formalTargetPresent", "buildIdentity", "artifactDigest"], field, code);
  if (input.schemaVersion !== "PLATFORM_RELEASE_AUDIT_TARGET_V1" || !Object.values(TARGET_KINDS).includes(input.targetKind) || typeof input.formalTargetPresent !== "boolean") fail(`${field} is invalid`, code, { field });
  const presentFieldsAreNull = input.buildIdentity === null && input.artifactDigest === null;
  const presentFieldsAreBound = typeof input.buildIdentity === "string" && IDENTIFIER.test(input.buildIdentity) && typeof input.artifactDigest === "string" && SHA256.test(input.artifactDigest);
  if ((input.formalTargetPresent && !presentFieldsAreBound) || (!input.formalTargetPresent && !presentFieldsAreNull)) fail(`${field} presence evidence is inconsistent`, code, { field });
  return immutable({ ...input, targetId: identifier(input.targetId, `${field}.targetId`, code) });
}

function normalizePlatformDecisions(input, field = "platformDecisions") {
  if (!Array.isArray(input)) fail(`${field} must be an array`, "INVALID_PLATFORM_SHAPE_DECISIONS", { field });
  const seen = new Set();
  const normalized = input.map((item, index) => {
    const itemField = `${field}[${index}]`;
    assertExactKeys(item, ["schemaVersion", "dimensionId", "state", "decisionId", "selectedValues"], itemField, "INVALID_PLATFORM_SHAPE_DECISION");
    if (item.schemaVersion !== "PLATFORM_SHAPE_DECISION_V1" || !Object.values(PLATFORM_DIMENSIONS).includes(item.dimensionId) || !Object.values(DECISION_STATES).includes(item.state)) fail(`${itemField} is invalid`, "INVALID_PLATFORM_SHAPE_DECISION", { field: itemField });
    if (seen.has(item.dimensionId)) fail("platform dimensions must be unique", "DUPLICATE_PLATFORM_SHAPE_DIMENSION", { dimensionId: item.dimensionId });
    seen.add(item.dimensionId);
    if (item.state === DECISION_STATES.NOT_DECIDED) {
      if (item.decisionId !== null || item.selectedValues !== null) fail(`${itemField} undecided state cannot claim a selection`, "INVALID_PLATFORM_SHAPE_DECISION", { field: itemField });
    } else {
      if (typeof item.decisionId !== "string" || !DECISION_ID.test(item.decisionId) || !Array.isArray(item.selectedValues) || item.selectedValues.length === 0) fail(`${itemField} accepted state is incomplete`, "INVALID_PLATFORM_SHAPE_DECISION", { field: itemField });
      const allowed = ALLOWED_SELECTIONS[item.dimensionId];
      if (new Set(item.selectedValues).size !== item.selectedValues.length || item.selectedValues.some((value) => !allowed.includes(value))) fail(`${itemField}.selectedValues is invalid`, "INVALID_PLATFORM_SHAPE_DECISION", { field: `${itemField}.selectedValues` });
      if ([PLATFORM_DIMENSIONS.MAC_APP_AVAILABILITY, PLATFORM_DIMENSIONS.VISION_PRO_APP_AVAILABILITY].includes(item.dimensionId) && item.selectedValues.length !== 1) fail(`${itemField} availability must select one value`, "INVALID_PLATFORM_SHAPE_DECISION", { field: itemField });
    }
    const selectedValues = item.selectedValues === null ? null : [...item.selectedValues].sort((left, right) => ALLOWED_SELECTIONS[item.dimensionId].indexOf(left) - ALLOWED_SELECTIONS[item.dimensionId].indexOf(right));
    return immutable({ ...item, selectedValues });
  });
  if (seen.size !== Object.values(PLATFORM_DIMENSIONS).length || Object.values(PLATFORM_DIMENSIONS).some((dimensionId) => !seen.has(dimensionId))) fail("all platform dimensions must be declared", "PLATFORM_SHAPE_DIMENSIONS_INCOMPLETE");
  normalized.sort((left, right) => Object.values(PLATFORM_DIMENSIONS).indexOf(left.dimensionId) - Object.values(PLATFORM_DIMENSIONS).indexOf(right.dimensionId));
  return immutable(normalized);
}

function platformReleasePolicyFingerprint(platformDecisions) {
  return fingerprint({ acceptedReleaseBaseline: ACCEPTED_RELEASE_BASELINE, platformDecisions: normalizePlatformDecisions(platformDecisions) });
}

function expectedInspectorKind(surfaceId) {
  return EXPECTED_INSPECTOR_KIND[surfaceId] ?? INSPECTOR_KINDS.STATIC_CONFIGURATION_REPORT;
}

function normalizeEvidence(input, target, policyFingerprint, field) {
  const code = "INVALID_PLATFORM_RELEASE_EVIDENCE";
  assertExactKeys(input, ["schemaVersion", "evidenceId", "evidenceVersion", "surfaceId", "targetRef", "policyFingerprint", "inspectionState", "inspectorKind", "conformance", "reportDigest", "findingCount"], field, code);
  if (input.schemaVersion !== "PLATFORM_RELEASE_EVIDENCE_V1" || !REQUIRED_SURFACES.includes(input.surfaceId) || input.policyFingerprint !== policyFingerprint || !Object.values(INSPECTION_STATES).includes(input.inspectionState) || input.inspectorKind !== expectedInspectorKind(input.surfaceId)) fail(`${field} is invalid`, code, { field });
  assertExactKeys(input.targetRef, ["targetId", "buildIdentity", "artifactDigest"], `${field}.targetRef`, code);
  if (input.targetRef.targetId !== target.targetId || input.targetRef.buildIdentity !== target.buildIdentity || input.targetRef.artifactDigest !== target.artifactDigest) fail(`${field} does not bind the audit target`, "PLATFORM_RELEASE_EVIDENCE_TARGET_MISMATCH", { field });
  if (input.inspectionState === INSPECTION_STATES.EXECUTED) {
    if (!Object.values(CONFORMANCE).includes(input.conformance) || typeof input.reportDigest !== "string" || !SHA256.test(input.reportDigest) || !Number.isSafeInteger(input.findingCount) || input.findingCount < 0) fail(`${field} executed result is incomplete`, code, { field });
  } else if (input.conformance !== null || input.reportDigest !== null || input.findingCount !== null) fail(`${field} unexecuted result cannot claim conformance`, code, { field });
  return immutable({ ...input, evidenceId: identifier(input.evidenceId, `${field}.evidenceId`, code), evidenceVersion: identifier(input.evidenceVersion, `${field}.evidenceVersion`, code) });
}

function normalizeAuditInput(input, field = "audit") {
  assertExactKeys(input, ["schemaVersion", "auditId", "target", "platformDecisions", "evidence"], field, "INVALID_PLATFORM_RELEASE_AUDIT");
  if (input.schemaVersion !== "PLATFORM_LANGUAGE_RELEASE_AUDIT_V1" || !Array.isArray(input.evidence)) fail(`${field} is invalid`, "INVALID_PLATFORM_RELEASE_AUDIT", { field });
  const target = normalizeTarget(input.target, `${field}.target`);
  const platformDecisions = normalizePlatformDecisions(input.platformDecisions, `${field}.platformDecisions`);
  const policyFingerprint = fingerprint({ acceptedReleaseBaseline: ACCEPTED_RELEASE_BASELINE, platformDecisions });
  const evidence = input.evidence.map((item, index) => normalizeEvidence(item, target, policyFingerprint, `${field}.evidence[${index}]`));
  const surfaceIds = new Set();
  const evidenceIds = new Set();
  for (const item of evidence) {
    if (surfaceIds.has(item.surfaceId)) fail("release evidence surfaces must be unique", "DUPLICATE_PLATFORM_RELEASE_SURFACE", { surfaceId: item.surfaceId });
    if (evidenceIds.has(item.evidenceId)) fail("release evidence IDs must be unique", "DUPLICATE_PLATFORM_RELEASE_EVIDENCE_ID", { evidenceId: item.evidenceId });
    surfaceIds.add(item.surfaceId);
    evidenceIds.add(item.evidenceId);
  }
  evidence.sort((left, right) => REQUIRED_SURFACES.indexOf(left.surfaceId) - REQUIRED_SURFACES.indexOf(right.surfaceId));
  return immutable({ schemaVersion: input.schemaVersion, auditId: identifier(input.auditId, `${field}.auditId`, "INVALID_PLATFORM_RELEASE_AUDIT"), target, platformDecisions, policyFingerprint, evidence });
}

function auditPlatformLanguageRelease(input) {
  const audit = normalizeAuditInput(input);
  const targetEligible = audit.target.formalTargetPresent && audit.target.targetKind === TARGET_KINDS.SIGNED_RELEASE_ARCHIVE;
  const undecidedDimensions = audit.platformDecisions.filter(({ state }) => state !== DECISION_STATES.ACCEPTED).map(({ dimensionId }) => dimensionId);
  const evidenceBySurface = new Map(audit.evidence.map((item) => [item.surfaceId, item]));
  const groupResults = Object.entries(SURFACE_GROUPS).map(([groupId, surfaces]) => {
    const missingSurfaces = surfaces.filter((surfaceId) => !evidenceBySurface.has(surfaceId));
    const notExecutedSurfaces = surfaces.filter((surfaceId) => evidenceBySurface.get(surfaceId)?.inspectionState === INSPECTION_STATES.NOT_EXECUTED);
    const nonConformantSurfaces = surfaces.filter((surfaceId) => evidenceBySurface.get(surfaceId)?.conformance === CONFORMANCE.NONCONFORMANT);
    const findingSurfaces = surfaces.filter((surfaceId) => {
      const item = evidenceBySurface.get(surfaceId);
      return item?.inspectionState === INSPECTION_STATES.EXECUTED && item.findingCount > 0;
    });
    const disposition = targetEligible && undecidedDimensions.length === 0 && missingSurfaces.length === 0 && notExecutedSurfaces.length === 0 && nonConformantSurfaces.length === 0 && findingSurfaces.length === 0 ? "PASS" : "BLOCKED";
    return immutable({ groupId, disposition, requiredSurfaceCount: surfaces.length, evidenceSurfaceCount: surfaces.filter((surfaceId) => evidenceBySurface.has(surfaceId)).length, missingSurfaces, notExecutedSurfaces, nonConformantSurfaces, findingSurfaces });
  });
  const blockers = [];
  if (!audit.target.formalTargetPresent) blockers.push("FORMAL_TARGET_ABSENT");
  else if (audit.target.targetKind !== TARGET_KINDS.SIGNED_RELEASE_ARCHIVE) blockers.push("SIGNED_RELEASE_ARCHIVE_REQUIRED");
  if (undecidedDimensions.length > 0) blockers.push("PLATFORM_SHAPE_DECISION_REQUIRED");
  if (groupResults.some(({ missingSurfaces }) => missingSurfaces.length > 0)) blockers.push("REQUIRED_SURFACE_MISSING");
  if (groupResults.some(({ notExecutedSurfaces }) => notExecutedSurfaces.length > 0)) blockers.push("REQUIRED_INSPECTION_NOT_EXECUTED");
  if (groupResults.some(({ nonConformantSurfaces }) => nonConformantSurfaces.length > 0)) blockers.push("RELEASE_NONCONFORMANCE_PRESENT");
  if (groupResults.some(({ findingSurfaces }) => findingSurfaces.length > 0)) blockers.push("RELEASE_FINDING_PRESENT");
  const core = immutable({
    schemaVersion: "PLATFORM_LANGUAGE_RELEASE_AUDIT_REPORT_V1",
    auditId: audit.auditId,
    target: audit.target,
    overallDisposition: blockers.length === 0 ? "PASS" : "BLOCKED",
    blockers,
    acceptedReleaseBaseline: ACCEPTED_RELEASE_BASELINE,
    platformDecisions: audit.platformDecisions,
    undecidedDimensions,
    policyFingerprint: audit.policyFingerprint,
    groupResults,
    evidenceManifestFingerprint: fingerprint(audit.evidence),
    claimBoundary: CLAIM_BOUNDARY,
  });
  return immutable({ ...core, reportFingerprint: fingerprint(core) });
}

function validatePlatformLanguageReleaseAuditReport(input, report) {
  assertPlainRecord(report, "report", "INVALID_PLATFORM_RELEASE_AUDIT_REPORT");
  const expected = auditPlatformLanguageRelease(input);
  if (!isDeepStrictEqual(report, expected)) fail("report does not match the normalized release evidence", "PLATFORM_RELEASE_AUDIT_REPORT_MISMATCH");
  return immutable(report);
}

export {
  ACCEPTED_RELEASE_BASELINE,
  ALLOWED_SELECTIONS,
  CLAIM_BOUNDARY,
  CONFORMANCE,
  DECISION_STATES,
  INSPECTION_STATES,
  INSPECTOR_KINDS,
  PLATFORM_DIMENSIONS,
  REQUIRED_SURFACES,
  SURFACE_GROUPS,
  TARGET_KINDS,
  auditPlatformLanguageRelease,
  normalizeAuditInput,
  normalizePlatformDecisions,
  platformReleasePolicyFingerprint,
  validatePlatformLanguageReleaseAuditReport,
};
