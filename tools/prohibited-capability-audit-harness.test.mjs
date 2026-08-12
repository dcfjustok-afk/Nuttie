import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CAPABILITIES,
  CLAIM_BOUNDARY,
  INSPECTION_STATES,
  INSPECTOR_KINDS,
  REQUIRED_SURFACES,
  TARGET_KINDS,
  auditProhibitedCapabilities,
  normalizeAuditInput,
  validateProhibitedCapabilityAuditReport,
} from "./prohibited-capability-audit-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./prohibited-capability-audit-harness.mjs", import.meta.url));
const DIGEST_A = "a".repeat(64);
const DIGEST_B = "b".repeat(64);

function target({ targetKind = TARGET_KINDS.WORKING_TREE, formalTargetPresent = false, buildIdentity = null, artifactDigest = null } = {}) {
  return {
    schemaVersion: "PROHIBITED_CAPABILITY_AUDIT_TARGET_V1",
    targetId: "nuttie-ios",
    targetKind,
    formalTargetPresent,
    buildIdentity,
    artifactDigest,
  };
}

function signedTarget(overrides = {}) {
  return target({
    targetKind: TARGET_KINDS.SIGNED_RELEASE_ARCHIVE,
    formalTargetPresent: true,
    buildIdentity: "nuttie-ios-release-1",
    artifactDigest: DIGEST_A,
    ...overrides,
  });
}

function inspectorKind(surfaceId) {
  if (surfaceId === "PRODUCT_UI") return INSPECTOR_KINDS.UI_ARTIFACT_SCAN_REPORT;
  if (surfaceId === "STORE_PRODUCT_CATALOG") return INSPECTOR_KINDS.EXTERNAL_PRODUCT_CATALOG_REPORT;
  if (surfaceId === "RELEASE_NETWORK_CAPTURE") return INSPECTOR_KINDS.RUNTIME_NETWORK_CAPTURE_REPORT;
  if (surfaceId === "RUNTIME_PERMISSION_CAPTURE") return INSPECTOR_KINDS.RUNTIME_PERMISSION_CAPTURE_REPORT;
  return INSPECTOR_KINDS.STATIC_ARTIFACT_SCAN_REPORT;
}

function evidence(capabilityId, surfaceId, auditTarget, overrides = {}) {
  return {
    schemaVersion: "PROHIBITED_CAPABILITY_EVIDENCE_V1",
    evidenceId: `e-${capabilityId}-${surfaceId}`,
    evidenceVersion: "v1",
    capabilityId,
    surfaceId,
    targetRef: {
      targetId: auditTarget.targetId,
      buildIdentity: auditTarget.buildIdentity,
      artifactDigest: auditTarget.artifactDigest,
    },
    inspectionState: INSPECTION_STATES.EXECUTED,
    inspectorKind: inspectorKind(surfaceId),
    reportDigest: DIGEST_B,
    findingCount: 0,
    ...overrides,
  };
}

function completeEvidence(auditTarget) {
  return Object.values(CAPABILITIES).flatMap((capabilityId) => REQUIRED_SURFACES[capabilityId].map((surfaceId) => evidence(capabilityId, surfaceId, auditTarget)));
}

function audit(auditTarget = target(), auditEvidence = []) {
  return {
    schemaVersion: "PROHIBITED_CAPABILITY_AUDIT_V1",
    auditId: "audit-1",
    target: auditTarget,
    evidence: auditEvidence,
  };
}

test("defines the complete F20, F23, and F24 required inspection surfaces", () => {
  assert.deepEqual(REQUIRED_SURFACES[CAPABILITIES.F20_IAP_MEMBERSHIP], ["SOURCE_IMPORTS", "DEPENDENCY_GRAPH", "NATIVE_CONFIGURATION", "INFO_PLIST", "ENTITLEMENTS", "PRODUCT_UI", "BINARY_SYMBOLS", "STORE_PRODUCT_CATALOG", "RELEASE_NETWORK_CAPTURE"]);
  assert.deepEqual(REQUIRED_SURFACES[CAPABILITIES.F23_ADS_TELEMETRY], ["SOURCE_IMPORTS", "DEPENDENCY_GRAPH", "NATIVE_CONFIGURATION", "INFO_PLIST", "ENTITLEMENTS", "PRIVACY_MANIFEST", "EMBEDDED_FRAMEWORKS", "BINARY_SYMBOLS", "RELEASE_NETWORK_CAPTURE"]);
  assert.deepEqual(REQUIRED_SURFACES[CAPABILITIES.F24_LOCATION], ["SOURCE_IMPORTS", "DEPENDENCY_GRAPH", "NATIVE_CONFIGURATION", "INFO_PLIST", "ENTITLEMENTS", "PRIVACY_MANIFEST", "BINARY_SYMBOLS", "RUNTIME_PERMISSION_CAPTURE", "RELEASE_NETWORK_CAPTURE"]);
  assert.equal(new Set(Object.values(CAPABILITIES)).size, 3);
  for (const surfaces of Object.values(REQUIRED_SURFACES)) assert.equal(new Set(surfaces).size, 9);
});

test("publishes a fail-closed claim boundary and does not claim evidence truth or gate closure", () => {
  assert.deepEqual(CLAIM_BOUNDARY, {
    currentWorkingTreeAbsenceIsPass: false,
    formalSignedReleaseTargetRequired: true,
    everyRequiredSurfaceMustExecute: true,
    findingsMustBeZero: true,
    evidenceTruthVerifiedByThisHarness: false,
    releaseGateClosedByThisHarness: false,
  });
});

test("an absent formal target with no evidence is blocked instead of treating an uninitialized project as clean", () => {
  const report = auditProhibitedCapabilities(audit());
  assert.equal(report.overallDisposition, "BLOCKED");
  assert.deepEqual(report.blockers, ["FORMAL_TARGET_ABSENT", "REQUIRED_SURFACE_MISSING"]);
  for (const result of report.capabilityResults) {
    assert.equal(result.disposition, "BLOCKED");
    assert.equal(result.missingSurfaces.length, 9);
    assert.equal(result.evidenceSurfaceCount, 0);
  }
});

test("complete zero-finding reports bound only to a working tree remain blocked", () => {
  const workingTree = target();
  const report = auditProhibitedCapabilities(audit(workingTree, completeEvidence(workingTree)));
  assert.equal(report.overallDisposition, "BLOCKED");
  assert.deepEqual(report.blockers, ["FORMAL_TARGET_ABSENT"]);
  assert.equal(report.capabilityResults.every(({ disposition }) => disposition === "BLOCKED"), true);
});

test("debug and unsigned release artifacts cannot substitute for a signed Release archive", () => {
  for (const targetKind of [TARGET_KINDS.DEBUG_BUILD, TARGET_KINDS.UNSIGNED_RELEASE_BUILD]) {
    const nonRelease = target({ targetKind, formalTargetPresent: true, buildIdentity: `build-${targetKind}`, artifactDigest: DIGEST_A });
    const report = auditProhibitedCapabilities(audit(nonRelease, completeEvidence(nonRelease)));
    assert.equal(report.overallDisposition, "BLOCKED");
    assert.deepEqual(report.blockers, ["SIGNED_RELEASE_ARCHIVE_REQUIRED"]);
  }
});

test("a signed Release archive passes only when all 27 supplied reports executed with zero findings", () => {
  const release = signedTarget();
  const report = auditProhibitedCapabilities(audit(release, completeEvidence(release)));
  assert.equal(report.overallDisposition, "PASS");
  assert.deepEqual(report.blockers, []);
  assert.equal(report.capabilityResults.every(({ disposition, evidenceSurfaceCount }) => disposition === "PASS" && evidenceSurfaceCount === 9), true);
  assert.match(report.evidenceManifestFingerprint, /^[a-f0-9]{64}$/);
  assert.match(report.reportFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(report.claimBoundary.evidenceTruthVerifiedByThisHarness, false);
  assert.equal(report.claimBoundary.releaseGateClosedByThisHarness, false);
});

test("one missing required surface blocks only its capability and the overall audit", () => {
  const release = signedTarget();
  for (const capabilityId of Object.values(CAPABILITIES)) {
    const removedSurface = REQUIRED_SURFACES[capabilityId][0];
    const supplied = completeEvidence(release).filter((item) => item.capabilityId !== capabilityId || item.surfaceId !== removedSurface);
    const report = auditProhibitedCapabilities(audit(release, supplied));
    assert.equal(report.overallDisposition, "BLOCKED");
    assert.deepEqual(report.blockers, ["REQUIRED_SURFACE_MISSING"]);
    assert.deepEqual(report.capabilityResults.find((item) => item.capabilityId === capabilityId).missingSurfaces, [removedSurface]);
    assert.equal(report.capabilityResults.filter(({ disposition }) => disposition === "PASS").length, 2);
  }
});

test("a declared but unexecuted inspection never counts as negative evidence", () => {
  const release = signedTarget();
  const supplied = completeEvidence(release);
  supplied[0] = evidence(supplied[0].capabilityId, supplied[0].surfaceId, release, { inspectionState: INSPECTION_STATES.NOT_EXECUTED, reportDigest: null, findingCount: null });
  const report = auditProhibitedCapabilities(audit(release, supplied));
  assert.equal(report.overallDisposition, "BLOCKED");
  assert.deepEqual(report.blockers, ["REQUIRED_INSPECTION_NOT_EXECUTED"]);
  assert.deepEqual(report.capabilityResults[0].notExecutedSurfaces, ["SOURCE_IMPORTS"]);
});

test("any prohibited capability finding blocks the corresponding capability and overall audit", () => {
  const release = signedTarget();
  const supplied = completeEvidence(release);
  const index = supplied.findIndex((item) => item.capabilityId === CAPABILITIES.F24_LOCATION && item.surfaceId === "INFO_PLIST");
  supplied[index] = evidence(CAPABILITIES.F24_LOCATION, "INFO_PLIST", release, { findingCount: 1 });
  const report = auditProhibitedCapabilities(audit(release, supplied));
  assert.deepEqual(report.blockers, ["PROHIBITED_CAPABILITY_FINDING_PRESENT"]);
  assert.deepEqual(report.capabilityResults[2].findingSurfaces, ["INFO_PLIST"]);
  assert.equal(report.capabilityResults[2].disposition, "BLOCKED");
});

test("special surfaces require UI, external catalog, network, or permission capture reports", () => {
  const release = signedTarget();
  const cases = [
    [CAPABILITIES.F20_IAP_MEMBERSHIP, "PRODUCT_UI", INSPECTOR_KINDS.UI_ARTIFACT_SCAN_REPORT],
    [CAPABILITIES.F20_IAP_MEMBERSHIP, "STORE_PRODUCT_CATALOG", INSPECTOR_KINDS.EXTERNAL_PRODUCT_CATALOG_REPORT],
    [CAPABILITIES.F23_ADS_TELEMETRY, "RELEASE_NETWORK_CAPTURE", INSPECTOR_KINDS.RUNTIME_NETWORK_CAPTURE_REPORT],
    [CAPABILITIES.F24_LOCATION, "RUNTIME_PERMISSION_CAPTURE", INSPECTOR_KINDS.RUNTIME_PERMISSION_CAPTURE_REPORT],
  ];
  for (const [capabilityId, surfaceId, expected] of cases) {
    assert.equal(evidence(capabilityId, surfaceId, release).inspectorKind, expected);
    assert.throws(() => normalizeAuditInput(audit(release, [evidence(capabilityId, surfaceId, release, { inspectorKind: INSPECTOR_KINDS.STATIC_ARTIFACT_SCAN_REPORT })])), { code: "INVALID_PROHIBITED_CAPABILITY_EVIDENCE" });
  }
});

test("every evidence report is cryptographically bound to one exact target identity and artifact digest", () => {
  const release = signedTarget();
  const item = evidence(CAPABILITIES.F20_IAP_MEMBERSHIP, "SOURCE_IMPORTS", release);
  assert.throws(() => normalizeAuditInput(audit(release, [{ ...item, targetRef: { ...item.targetRef, artifactDigest: DIGEST_B } }])), { code: "AUDIT_EVIDENCE_TARGET_MISMATCH" });
  assert.throws(() => normalizeAuditInput(audit(release, [{ ...item, targetRef: { ...item.targetRef, buildIdentity: "another-build" } }])), { code: "AUDIT_EVIDENCE_TARGET_MISMATCH" });
});

test("rejects duplicate capability surfaces and duplicate evidence IDs", () => {
  const release = signedTarget();
  const first = evidence(CAPABILITIES.F20_IAP_MEMBERSHIP, "SOURCE_IMPORTS", release);
  assert.throws(() => normalizeAuditInput(audit(release, [first, { ...first, evidenceId: "second-id" }])), { code: "DUPLICATE_PROHIBITED_CAPABILITY_SURFACE" });
  const second = evidence(CAPABILITIES.F20_IAP_MEMBERSHIP, "DEPENDENCY_GRAPH", release, { evidenceId: first.evidenceId });
  assert.throws(() => normalizeAuditInput(audit(release, [first, second])), { code: "DUPLICATE_PROHIBITED_CAPABILITY_EVIDENCE_ID" });
});

test("executed and unexecuted evidence have mutually exclusive result fields", () => {
  const release = signedTarget();
  assert.throws(() => normalizeAuditInput(audit(release, [evidence(CAPABILITIES.F23_ADS_TELEMETRY, "SOURCE_IMPORTS", release, { reportDigest: null })])), { code: "INVALID_PROHIBITED_CAPABILITY_EVIDENCE" });
  assert.throws(() => normalizeAuditInput(audit(release, [evidence(CAPABILITIES.F23_ADS_TELEMETRY, "SOURCE_IMPORTS", release, { findingCount: -1 })])), { code: "INVALID_PROHIBITED_CAPABILITY_EVIDENCE" });
  assert.throws(() => normalizeAuditInput(audit(release, [evidence(CAPABILITIES.F23_ADS_TELEMETRY, "SOURCE_IMPORTS", release, { inspectionState: INSPECTION_STATES.NOT_EXECUTED })])), { code: "INVALID_PROHIBITED_CAPABILITY_EVIDENCE" });
});

test("strict schemas reject unknown target kinds, unknown surfaces, extra fields, and inconsistent target presence", () => {
  assert.throws(() => normalizeAuditInput({ ...audit(), surprise: true }), { code: "INVALID_PROHIBITED_CAPABILITY_AUDIT" });
  assert.throws(() => normalizeAuditInput(audit(target({ targetKind: "SIMULATOR" }))), { code: "INVALID_AUDIT_TARGET" });
  assert.throws(() => normalizeAuditInput(audit(target({ formalTargetPresent: true }))), { code: "INVALID_AUDIT_TARGET" });
  const release = signedTarget();
  assert.throws(() => normalizeAuditInput(audit(release, [evidence(CAPABILITIES.F24_LOCATION, "GPS_DATABASE", release)])), { code: "INVALID_PROHIBITED_CAPABILITY_EVIDENCE" });
});

test("normalization produces stable evidence ordering and fingerprints independent of caller order", () => {
  const release = signedTarget();
  const ordered = completeEvidence(release);
  const reversed = [...ordered].reverse();
  const left = auditProhibitedCapabilities(audit(release, ordered));
  const right = auditProhibitedCapabilities(audit(release, reversed));
  assert.equal(left.evidenceManifestFingerprint, right.evidenceManifestFingerprint);
  assert.equal(left.reportFingerprint, right.reportFingerprint);
  assert.deepEqual(normalizeAuditInput(audit(release, ordered)), normalizeAuditInput(audit(release, reversed)));
});

test("normalized inputs and reports are detached and deeply immutable", () => {
  const release = signedTarget();
  const input = audit(release, completeEvidence(release));
  const normalized = normalizeAuditInput(input);
  const report = auditProhibitedCapabilities(input);
  input.target.buildIdentity = "mutated-build";
  input.evidence[0].targetRef.buildIdentity = "mutated-build";
  assert.equal(normalized.target.buildIdentity, "nuttie-ios-release-1");
  assert.equal(Object.isFrozen(normalized.evidence[0].targetRef), true);
  assert.equal(Object.isFrozen(report.capabilityResults[0].missingSurfaces), true);
  assert.throws(() => { report.blockers.push("tamper"); }, TypeError);
});

test("report validation detects disposition, blocker, result, boundary, and fingerprint tampering", () => {
  const release = signedTarget();
  const input = audit(release, completeEvidence(release));
  const report = auditProhibitedCapabilities(input);
  assert.deepEqual(validateProhibitedCapabilityAuditReport(input, structuredClone(report)), report);
  for (const mutate of [
    (copy) => { copy.overallDisposition = "BLOCKED"; },
    (copy) => { copy.blockers.push("FORMAL_TARGET_ABSENT"); },
    (copy) => { copy.capabilityResults[0].disposition = "BLOCKED"; },
    (copy) => { copy.claimBoundary.releaseGateClosedByThisHarness = true; },
    (copy) => { copy.reportFingerprint = DIGEST_A; },
  ]) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateProhibitedCapabilityAuditReport(input, copy), { code: "PROHIBITED_CAPABILITY_AUDIT_REPORT_MISMATCH" });
  }
});

test("the harness evaluates caller-supplied reports without scanning files, binaries, clocks, networks, or native APIs", () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  assert.doesNotMatch(source, /\b(?:readFile|writeFile|fetch|XMLHttpRequest|Date\.now|new Date|child_process|StoreKit|CLLocationManager)\b/);
  assert.match(source, /evidenceTruthVerifiedByThisHarness: false/);
  assert.match(source, /releaseGateClosedByThisHarness: false/);
});
