import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;

const CAPABILITIES = Object.freeze({
  F20_IAP_MEMBERSHIP: "F20_IAP_MEMBERSHIP",
  F23_ADS_TELEMETRY: "F23_ADS_TELEMETRY",
  F24_LOCATION: "F24_LOCATION",
});

const TARGET_KINDS = Object.freeze({
  WORKING_TREE: "WORKING_TREE",
  DEBUG_BUILD: "DEBUG_BUILD",
  UNSIGNED_RELEASE_BUILD: "UNSIGNED_RELEASE_BUILD",
  SIGNED_RELEASE_ARCHIVE: "SIGNED_RELEASE_ARCHIVE",
});

const INSPECTION_STATES = Object.freeze({
  EXECUTED: "EXECUTED",
  NOT_EXECUTED: "NOT_EXECUTED",
});

const INSPECTOR_KINDS = Object.freeze({
  STATIC_ARTIFACT_SCAN_REPORT: "STATIC_ARTIFACT_SCAN_REPORT",
  UI_ARTIFACT_SCAN_REPORT: "UI_ARTIFACT_SCAN_REPORT",
  RUNTIME_NETWORK_CAPTURE_REPORT: "RUNTIME_NETWORK_CAPTURE_REPORT",
  RUNTIME_PERMISSION_CAPTURE_REPORT: "RUNTIME_PERMISSION_CAPTURE_REPORT",
  EXTERNAL_PRODUCT_CATALOG_REPORT: "EXTERNAL_PRODUCT_CATALOG_REPORT",
});

const REQUIRED_SURFACES = Object.freeze({
  [CAPABILITIES.F20_IAP_MEMBERSHIP]: Object.freeze([
    "SOURCE_IMPORTS",
    "DEPENDENCY_GRAPH",
    "NATIVE_CONFIGURATION",
    "INFO_PLIST",
    "ENTITLEMENTS",
    "PRODUCT_UI",
    "BINARY_SYMBOLS",
    "STORE_PRODUCT_CATALOG",
    "RELEASE_NETWORK_CAPTURE",
  ]),
  [CAPABILITIES.F23_ADS_TELEMETRY]: Object.freeze([
    "SOURCE_IMPORTS",
    "DEPENDENCY_GRAPH",
    "NATIVE_CONFIGURATION",
    "INFO_PLIST",
    "ENTITLEMENTS",
    "PRIVACY_MANIFEST",
    "EMBEDDED_FRAMEWORKS",
    "BINARY_SYMBOLS",
    "RELEASE_NETWORK_CAPTURE",
  ]),
  [CAPABILITIES.F24_LOCATION]: Object.freeze([
    "SOURCE_IMPORTS",
    "DEPENDENCY_GRAPH",
    "NATIVE_CONFIGURATION",
    "INFO_PLIST",
    "ENTITLEMENTS",
    "PRIVACY_MANIFEST",
    "BINARY_SYMBOLS",
    "RUNTIME_PERMISSION_CAPTURE",
    "RELEASE_NETWORK_CAPTURE",
  ]),
});

const EXPECTED_INSPECTOR_KIND = Object.freeze({
  PRODUCT_UI: INSPECTOR_KINDS.UI_ARTIFACT_SCAN_REPORT,
  STORE_PRODUCT_CATALOG: INSPECTOR_KINDS.EXTERNAL_PRODUCT_CATALOG_REPORT,
  RELEASE_NETWORK_CAPTURE: INSPECTOR_KINDS.RUNTIME_NETWORK_CAPTURE_REPORT,
  RUNTIME_PERMISSION_CAPTURE: INSPECTOR_KINDS.RUNTIME_PERMISSION_CAPTURE_REPORT,
});

const CLAIM_BOUNDARY = Object.freeze({
  currentWorkingTreeAbsenceIsPass: false,
  formalSignedReleaseTargetRequired: true,
  everyRequiredSurfaceMustExecute: true,
  findingsMustBeZero: true,
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
  return value;
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
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

function identifier(value, field, code = "INVALID_PROHIBITED_CAPABILITY_AUDIT") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function normalizeTarget(input, field = "target") {
  assertExactKeys(input, ["schemaVersion", "targetId", "targetKind", "formalTargetPresent", "buildIdentity", "artifactDigest"], [], field, "INVALID_AUDIT_TARGET");
  if (input.schemaVersion !== "PROHIBITED_CAPABILITY_AUDIT_TARGET_V1" || !Object.values(TARGET_KINDS).includes(input.targetKind) || typeof input.formalTargetPresent !== "boolean") fail(`${field} is invalid`, "INVALID_AUDIT_TARGET", { field });
  const targetId = identifier(input.targetId, `${field}.targetId`, "INVALID_AUDIT_TARGET");
  const presentFieldsAreNull = input.buildIdentity === null && input.artifactDigest === null;
  const presentFieldsAreBound = typeof input.buildIdentity === "string" && IDENTIFIER.test(input.buildIdentity) && typeof input.artifactDigest === "string" && SHA256.test(input.artifactDigest);
  if ((input.formalTargetPresent && !presentFieldsAreBound) || (!input.formalTargetPresent && !presentFieldsAreNull)) fail(`${field} presence evidence is inconsistent`, "INVALID_AUDIT_TARGET", { field });
  return immutable({ ...input, targetId });
}

function expectedInspectorKind(surfaceId) {
  return EXPECTED_INSPECTOR_KIND[surfaceId] ?? INSPECTOR_KINDS.STATIC_ARTIFACT_SCAN_REPORT;
}

function normalizeEvidence(input, target, field = "evidence") {
  assertExactKeys(input, ["schemaVersion", "evidenceId", "evidenceVersion", "capabilityId", "surfaceId", "targetRef", "inspectionState", "inspectorKind", "reportDigest", "findingCount"], [], field, "INVALID_PROHIBITED_CAPABILITY_EVIDENCE");
  if (input.schemaVersion !== "PROHIBITED_CAPABILITY_EVIDENCE_V1" || !Object.values(CAPABILITIES).includes(input.capabilityId) || !REQUIRED_SURFACES[input.capabilityId].includes(input.surfaceId) || !Object.values(INSPECTION_STATES).includes(input.inspectionState) || input.inspectorKind !== expectedInspectorKind(input.surfaceId)) fail(`${field} is invalid`, "INVALID_PROHIBITED_CAPABILITY_EVIDENCE", { field });
  assertExactKeys(input.targetRef, ["targetId", "buildIdentity", "artifactDigest"], [], `${field}.targetRef`, "INVALID_PROHIBITED_CAPABILITY_EVIDENCE");
  if (input.targetRef.targetId !== target.targetId || input.targetRef.buildIdentity !== target.buildIdentity || input.targetRef.artifactDigest !== target.artifactDigest) fail(`${field} does not bind the audit target`, "AUDIT_EVIDENCE_TARGET_MISMATCH", { field });
  const normalized = {
    ...input,
    evidenceId: identifier(input.evidenceId, `${field}.evidenceId`, "INVALID_PROHIBITED_CAPABILITY_EVIDENCE"),
    evidenceVersion: identifier(input.evidenceVersion, `${field}.evidenceVersion`, "INVALID_PROHIBITED_CAPABILITY_EVIDENCE"),
  };
  if (input.inspectionState === INSPECTION_STATES.EXECUTED) {
    if (!SHA256.test(input.reportDigest) || !Number.isSafeInteger(input.findingCount) || input.findingCount < 0) fail(`${field} executed result is incomplete`, "INVALID_PROHIBITED_CAPABILITY_EVIDENCE", { field });
  } else if (input.reportDigest !== null || input.findingCount !== null) fail(`${field} unexecuted result cannot claim a report or findings`, "INVALID_PROHIBITED_CAPABILITY_EVIDENCE", { field });
  return immutable(normalized);
}

function normalizeAuditInput(input, field = "audit") {
  assertExactKeys(input, ["schemaVersion", "auditId", "target", "evidence"], [], field, "INVALID_PROHIBITED_CAPABILITY_AUDIT");
  if (input.schemaVersion !== "PROHIBITED_CAPABILITY_AUDIT_V1" || !Array.isArray(input.evidence)) fail(`${field} is invalid`, "INVALID_PROHIBITED_CAPABILITY_AUDIT", { field });
  const target = normalizeTarget(input.target, `${field}.target`);
  const evidence = input.evidence.map((item, index) => normalizeEvidence(item, target, `${field}.evidence[${index}]`));
  const identities = new Set();
  const evidenceIds = new Set();
  for (const item of evidence) {
    const identity = `${item.capabilityId}\u0000${item.surfaceId}`;
    if (identities.has(identity)) fail("capability surfaces must be unique", "DUPLICATE_PROHIBITED_CAPABILITY_SURFACE", { capabilityId: item.capabilityId, surfaceId: item.surfaceId });
    if (evidenceIds.has(item.evidenceId)) fail("evidence IDs must be unique", "DUPLICATE_PROHIBITED_CAPABILITY_EVIDENCE_ID", { evidenceId: item.evidenceId });
    identities.add(identity);
    evidenceIds.add(item.evidenceId);
  }
  evidence.sort((left, right) => {
    const capabilityOrder = Object.values(CAPABILITIES).indexOf(left.capabilityId) - Object.values(CAPABILITIES).indexOf(right.capabilityId);
    if (capabilityOrder !== 0) return capabilityOrder;
    return REQUIRED_SURFACES[left.capabilityId].indexOf(left.surfaceId) - REQUIRED_SURFACES[right.capabilityId].indexOf(right.surfaceId);
  });
  return immutable({ schemaVersion: input.schemaVersion, auditId: identifier(input.auditId, `${field}.auditId`), target, evidence });
}

function auditProhibitedCapabilities(input) {
  const audit = normalizeAuditInput(input);
  const targetEligible = audit.target.formalTargetPresent && audit.target.targetKind === TARGET_KINDS.SIGNED_RELEASE_ARCHIVE;
  const capabilityResults = Object.values(CAPABILITIES).map((capabilityId) => {
    const evidenceBySurface = new Map(audit.evidence.filter((item) => item.capabilityId === capabilityId).map((item) => [item.surfaceId, item]));
    const missingSurfaces = REQUIRED_SURFACES[capabilityId].filter((surfaceId) => !evidenceBySurface.has(surfaceId));
    const notExecutedSurfaces = REQUIRED_SURFACES[capabilityId].filter((surfaceId) => evidenceBySurface.get(surfaceId)?.inspectionState === INSPECTION_STATES.NOT_EXECUTED);
    const findingSurfaces = REQUIRED_SURFACES[capabilityId].filter((surfaceId) => {
      const item = evidenceBySurface.get(surfaceId);
      return item?.inspectionState === INSPECTION_STATES.EXECUTED && item.findingCount > 0;
    });
    const disposition = targetEligible && missingSurfaces.length === 0 && notExecutedSurfaces.length === 0 && findingSurfaces.length === 0 ? "PASS" : "BLOCKED";
    return immutable({ capabilityId, disposition, requiredSurfaceCount: REQUIRED_SURFACES[capabilityId].length, evidenceSurfaceCount: evidenceBySurface.size, missingSurfaces, notExecutedSurfaces, findingSurfaces });
  });
  const overallDisposition = capabilityResults.every(({ disposition }) => disposition === "PASS") ? "PASS" : "BLOCKED";
  const blockers = [];
  if (!audit.target.formalTargetPresent) blockers.push("FORMAL_TARGET_ABSENT");
  else if (audit.target.targetKind !== TARGET_KINDS.SIGNED_RELEASE_ARCHIVE) blockers.push("SIGNED_RELEASE_ARCHIVE_REQUIRED");
  if (capabilityResults.some(({ missingSurfaces }) => missingSurfaces.length > 0)) blockers.push("REQUIRED_SURFACE_MISSING");
  if (capabilityResults.some(({ notExecutedSurfaces }) => notExecutedSurfaces.length > 0)) blockers.push("REQUIRED_INSPECTION_NOT_EXECUTED");
  if (capabilityResults.some(({ findingSurfaces }) => findingSurfaces.length > 0)) blockers.push("PROHIBITED_CAPABILITY_FINDING_PRESENT");
  const core = immutable({
    schemaVersion: "PROHIBITED_CAPABILITY_AUDIT_REPORT_V1",
    auditId: audit.auditId,
    target: audit.target,
    overallDisposition,
    blockers,
    capabilityResults,
    claimBoundary: CLAIM_BOUNDARY,
    evidenceManifestFingerprint: fingerprint(audit.evidence),
  });
  return immutable({ ...core, reportFingerprint: fingerprint(core) });
}

function validateProhibitedCapabilityAuditReport(input, report) {
  assertPlainRecord(report, "report", "INVALID_PROHIBITED_CAPABILITY_AUDIT_REPORT");
  const expected = auditProhibitedCapabilities(input);
  if (!isDeepStrictEqual(report, expected)) fail("report does not match the normalized audit evidence", "PROHIBITED_CAPABILITY_AUDIT_REPORT_MISMATCH");
  return immutable(report);
}

export {
  CAPABILITIES,
  CLAIM_BOUNDARY,
  INSPECTION_STATES,
  INSPECTOR_KINDS,
  REQUIRED_SURFACES,
  TARGET_KINDS,
  auditProhibitedCapabilities,
  normalizeAuditInput,
  validateProhibitedCapabilityAuditReport,
};
