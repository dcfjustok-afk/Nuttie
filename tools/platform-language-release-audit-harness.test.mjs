import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
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
} from "./platform-language-release-audit-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./platform-language-release-audit-harness.mjs", import.meta.url));
const DIGEST_A = "a".repeat(64);
const DIGEST_B = "b".repeat(64);

function target({ targetKind = TARGET_KINDS.WORKING_TREE, formalTargetPresent = false, buildIdentity = null, artifactDigest = null } = {}) {
  return { schemaVersion: "PLATFORM_RELEASE_AUDIT_TARGET_V1", targetId: "nuttie-ios", targetKind, formalTargetPresent, buildIdentity, artifactDigest };
}

function signedTarget(overrides = {}) {
  return target({ targetKind: TARGET_KINDS.SIGNED_RELEASE_ARCHIVE, formalTargetPresent: true, buildIdentity: "nuttie-ios-release-1", artifactDigest: DIGEST_A, ...overrides });
}

function undecidedDecisions() {
  return Object.values(PLATFORM_DIMENSIONS).map((dimensionId) => ({ schemaVersion: "PLATFORM_SHAPE_DECISION_V1", dimensionId, state: DECISION_STATES.NOT_DECIDED, decisionId: null, selectedValues: null }));
}

function acceptedDecisions() {
  const selections = {
    [PLATFORM_DIMENSIONS.DEVICE_FAMILIES]: ["IPHONE"],
    [PLATFORM_DIMENSIONS.ORIENTATIONS]: ["PORTRAIT"],
    [PLATFORM_DIMENSIONS.MAC_APP_AVAILABILITY]: ["NOT_AVAILABLE"],
    [PLATFORM_DIMENSIONS.VISION_PRO_APP_AVAILABILITY]: ["NOT_AVAILABLE"],
  };
  return Object.values(PLATFORM_DIMENSIONS).map((dimensionId, index) => ({ schemaVersion: "PLATFORM_SHAPE_DECISION_V1", dimensionId, state: DECISION_STATES.ACCEPTED, decisionId: `D-${String(101 + index).padStart(3, "0")}`, selectedValues: selections[dimensionId] }));
}

function inspectorKind(surfaceId) {
  if (["EMBEDDED_FRAMEWORK_MIN_OS", "ARCHIVE_MINIMUM_OS"].includes(surfaceId)) return INSPECTOR_KINDS.ARCHIVE_BINARY_REPORT;
  if (["STORE_MINIMUM_OS", "TESTFLIGHT_METADATA_ZH_HANS", "APP_STORE_METADATA_ZH_HANS", "APP_STORE_MAC_AVAILABILITY", "APP_STORE_VISION_AVAILABILITY"].includes(surfaceId)) return INSPECTOR_KINDS.STORE_METADATA_REPORT;
  if (["IOS17_SIMULATOR", "LATEST_IOS_SIMULATOR"].includes(surfaceId)) return INSPECTOR_KINDS.SIMULATOR_TEST_REPORT;
  if (["IOS17_DEVICE", "LATEST_IOS_DEVICE"].includes(surfaceId)) return INSPECTOR_KINDS.DEVICE_TEST_REPORT;
  if (["LONG_COPY_320PT", "LONG_COPY_375PT", "LONG_COPY_430PT"].includes(surfaceId)) return INSPECTOR_KINDS.UI_LAYOUT_REPORT;
  if (["DYNAMIC_TYPE_MAX_ACCESSIBILITY", "VOICEOVER_ORDER_AND_VALUES"].includes(surfaceId)) return INSPECTOR_KINDS.ACCESSIBILITY_TEST_REPORT;
  return INSPECTOR_KINDS.STATIC_CONFIGURATION_REPORT;
}

function evidence(surfaceId, auditTarget, decisions, overrides = {}) {
  return {
    schemaVersion: "PLATFORM_RELEASE_EVIDENCE_V1",
    evidenceId: `e-${surfaceId}`,
    evidenceVersion: "v1",
    surfaceId,
    targetRef: { targetId: auditTarget.targetId, buildIdentity: auditTarget.buildIdentity, artifactDigest: auditTarget.artifactDigest },
    policyFingerprint: platformReleasePolicyFingerprint(decisions),
    inspectionState: INSPECTION_STATES.EXECUTED,
    inspectorKind: inspectorKind(surfaceId),
    conformance: CONFORMANCE.CONFORMANT,
    reportDigest: DIGEST_B,
    findingCount: 0,
    ...overrides,
  };
}

function completeEvidence(auditTarget, decisions) {
  return REQUIRED_SURFACES.map((surfaceId) => evidence(surfaceId, auditTarget, decisions));
}

function audit(auditTarget = target(), decisions = undecidedDecisions(), auditEvidence = []) {
  return { schemaVersion: "PLATFORM_LANGUAGE_RELEASE_AUDIT_V1", auditId: "audit-f22-1", target: auditTarget, platformDecisions: decisions, evidence: auditEvidence };
}

test("freezes the accepted D-011 and D-016 release baseline without authorizing bilingual UI", () => {
  assert.deepEqual(ACCEPTED_RELEASE_BASELINE, {
    platform: "IOS",
    minimumOsVersion: "17.0",
    primaryReleaseLanguage: "zh-Hans",
    appAuthoredUiLanguageScope: "ZH_HANS_ONLY",
    d011Status: "ACCEPTED",
    d016Status: "ACCEPTED",
    englishBrandAssetsAuthorizeBilingualUi: false,
    sourceDataLanguagesMayBePreserved: true,
  });
});

test("defines 10 iOS baseline, 11 zh-Hans release, and 4 platform-shape evidence surfaces", () => {
  assert.equal(SURFACE_GROUPS.IOS_17_BASELINE.length, 10);
  assert.equal(SURFACE_GROUPS.ZH_HANS_RELEASE.length, 11);
  assert.equal(SURFACE_GROUPS.PLATFORM_SHAPE.length, 4);
  assert.equal(REQUIRED_SURFACES.length, 25);
  assert.equal(new Set(REQUIRED_SURFACES).size, 25);
});

test("keeps device family, orientation, Mac, and Vision availability as four separate decisions", () => {
  assert.deepEqual(Object.values(PLATFORM_DIMENSIONS), ["DEVICE_FAMILIES", "ORIENTATIONS", "MAC_APP_AVAILABILITY", "VISION_PRO_APP_AVAILABILITY"]);
  assert.deepEqual(ALLOWED_SELECTIONS[PLATFORM_DIMENSIONS.DEVICE_FAMILIES], ["IPHONE", "IPAD"]);
  assert.deepEqual(ALLOWED_SELECTIONS[PLATFORM_DIMENSIONS.ORIENTATIONS], ["PORTRAIT", "PORTRAIT_UPSIDE_DOWN", "LANDSCAPE_LEFT", "LANDSCAPE_RIGHT"]);
});

test("publishes a fail-closed boundary that infers no platform shape and claims no truth or gate closure", () => {
  assert.equal(CLAIM_BOUNDARY.d011AndD016AreAcceptedInputs, true);
  assert.equal(CLAIM_BOUNDARY.platformShapeInferredFromD011D016D038OrCurrentDevice, false);
  assert.equal(CLAIM_BOUNDARY.formalSignedReleaseTargetRequired, true);
  assert.equal(CLAIM_BOUNDARY.everyPlatformDimensionMustHaveAcceptedDecision, true);
  assert.equal(CLAIM_BOUNDARY.decisionTruthVerifiedByThisHarness, false);
  assert.equal(CLAIM_BOUNDARY.evidenceTruthVerifiedByThisHarness, false);
  assert.equal(CLAIM_BOUNDARY.releaseGateClosedByThisHarness, false);
});

test("the current absent target, four undecided dimensions, and no reports remain blocked", () => {
  const report = auditPlatformLanguageRelease(audit());
  assert.equal(report.overallDisposition, "BLOCKED");
  assert.deepEqual(report.blockers, ["FORMAL_TARGET_ABSENT", "PLATFORM_SHAPE_DECISION_REQUIRED", "REQUIRED_SURFACE_MISSING"]);
  assert.deepEqual(report.undecidedDimensions, Object.values(PLATFORM_DIMENSIONS));
  assert.equal(report.groupResults.reduce((sum, group) => sum + group.missingSurfaces.length, 0), 25);
});

test("complete zero-finding working-tree reports cannot replace a formal target or Owner decisions", () => {
  const workingTree = target();
  const decisions = undecidedDecisions();
  const report = auditPlatformLanguageRelease(audit(workingTree, decisions, completeEvidence(workingTree, decisions)));
  assert.deepEqual(report.blockers, ["FORMAL_TARGET_ABSENT", "PLATFORM_SHAPE_DECISION_REQUIRED"]);
  assert.equal(report.overallDisposition, "BLOCKED");
});

test("debug and unsigned Release builds cannot substitute for a signed Release archive", () => {
  const decisions = acceptedDecisions();
  for (const targetKind of [TARGET_KINDS.DEBUG_BUILD, TARGET_KINDS.UNSIGNED_RELEASE_BUILD]) {
    const build = target({ targetKind, formalTargetPresent: true, buildIdentity: `build-${targetKind}`, artifactDigest: DIGEST_A });
    const report = auditPlatformLanguageRelease(audit(build, decisions, completeEvidence(build, decisions)));
    assert.deepEqual(report.blockers, ["SIGNED_RELEASE_ARCHIVE_REQUIRED"]);
    assert.equal(report.overallDisposition, "BLOCKED");
  }
});

test("a signed Release passes only for four supplied accepted decisions and all 25 conformant reports", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  const report = auditPlatformLanguageRelease(audit(release, decisions, completeEvidence(release, decisions)));
  assert.equal(report.overallDisposition, "PASS");
  assert.deepEqual(report.blockers, []);
  assert.deepEqual(report.undecidedDimensions, []);
  assert.equal(report.groupResults.every(({ disposition }) => disposition === "PASS"), true);
  assert.match(report.reportFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(report.claimBoundary.decisionTruthVerifiedByThisHarness, false);
});

test("platform decisions require all dimensions exactly once and do not accept inferred or partial state", () => {
  const missing = undecidedDecisions().slice(1);
  assert.throws(() => normalizePlatformDecisions(missing), { code: "PLATFORM_SHAPE_DIMENSIONS_INCOMPLETE" });
  const duplicate = undecidedDecisions();
  duplicate[1] = { ...duplicate[0] };
  assert.throws(() => normalizePlatformDecisions(duplicate), { code: "DUPLICATE_PLATFORM_SHAPE_DIMENSION" });
  const partial = undecidedDecisions();
  partial[0] = { ...partial[0], decisionId: "D-101", selectedValues: ["IPHONE"] };
  assert.throws(() => normalizePlatformDecisions(partial), { code: "INVALID_PLATFORM_SHAPE_DECISION" });
});

test("accepted platform decisions require a D-number and allowed non-duplicate selections", () => {
  const cases = [
    { decisionId: "OWNER-SAYS", selectedValues: ["IPHONE"] },
    { decisionId: "D-101", selectedValues: [] },
    { decisionId: "D-101", selectedValues: ["ANDROID"] },
    { decisionId: "D-101", selectedValues: ["IPHONE", "IPHONE"] },
  ];
  for (const mutation of cases) {
    const decisions = acceptedDecisions();
    decisions[0] = { ...decisions[0], ...mutation };
    assert.throws(() => normalizePlatformDecisions(decisions), { code: "INVALID_PLATFORM_SHAPE_DECISION" });
  }
  const availability = acceptedDecisions();
  availability[2] = { ...availability[2], selectedValues: ["AVAILABLE", "NOT_AVAILABLE"] };
  assert.throws(() => normalizePlatformDecisions(availability), { code: "INVALID_PLATFORM_SHAPE_DECISION" });
});

test("one missing surface blocks only its evidence group and the overall audit", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  for (const [groupId, surfaces] of Object.entries(SURFACE_GROUPS)) {
    const removed = surfaces[0];
    const report = auditPlatformLanguageRelease(audit(release, decisions, completeEvidence(release, decisions).filter(({ surfaceId }) => surfaceId !== removed)));
    assert.deepEqual(report.blockers, ["REQUIRED_SURFACE_MISSING"]);
    assert.deepEqual(report.groupResults.find((group) => group.groupId === groupId).missingSurfaces, [removed]);
    assert.equal(report.groupResults.filter(({ disposition }) => disposition === "PASS").length, 2);
  }
});

test("unexecuted, nonconformant, and nonzero-finding reports each fail closed", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  const cases = [
    [{ inspectionState: INSPECTION_STATES.NOT_EXECUTED, conformance: null, reportDigest: null, findingCount: null }, "REQUIRED_INSPECTION_NOT_EXECUTED"],
    [{ conformance: CONFORMANCE.NONCONFORMANT }, "RELEASE_NONCONFORMANCE_PRESENT"],
    [{ findingCount: 1 }, "RELEASE_FINDING_PRESENT"],
  ];
  for (const [mutation, blocker] of cases) {
    const supplied = completeEvidence(release, decisions);
    supplied[0] = evidence(supplied[0].surfaceId, release, decisions, mutation);
    const report = auditPlatformLanguageRelease(audit(release, decisions, supplied));
    assert.deepEqual(report.blockers, [blocker]);
    assert.equal(report.overallDisposition, "BLOCKED");
  }
});

test("Archive, Store, simulator, device, layout, and accessibility surfaces require matching report kinds", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  const cases = [
    ["ARCHIVE_MINIMUM_OS", INSPECTOR_KINDS.ARCHIVE_BINARY_REPORT],
    ["APP_STORE_METADATA_ZH_HANS", INSPECTOR_KINDS.STORE_METADATA_REPORT],
    ["IOS17_SIMULATOR", INSPECTOR_KINDS.SIMULATOR_TEST_REPORT],
    ["IOS17_DEVICE", INSPECTOR_KINDS.DEVICE_TEST_REPORT],
    ["LONG_COPY_320PT", INSPECTOR_KINDS.UI_LAYOUT_REPORT],
    ["VOICEOVER_ORDER_AND_VALUES", INSPECTOR_KINDS.ACCESSIBILITY_TEST_REPORT],
  ];
  for (const [surfaceId, expected] of cases) {
    assert.equal(evidence(surfaceId, release, decisions).inspectorKind, expected);
    assert.throws(() => normalizeAuditInput(audit(release, decisions, [evidence(surfaceId, release, decisions, { inspectorKind: INSPECTOR_KINDS.STATIC_CONFIGURATION_REPORT })])), { code: "INVALID_PLATFORM_RELEASE_EVIDENCE" });
  }
});

test("evidence binds both the exact artifact and the exact accepted/undecided policy fingerprint", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  const item = evidence("APP_TARGET_DEPLOYMENT", release, decisions);
  assert.throws(() => normalizeAuditInput(audit(release, decisions, [{ ...item, targetRef: { ...item.targetRef, artifactDigest: DIGEST_B } }])), { code: "PLATFORM_RELEASE_EVIDENCE_TARGET_MISMATCH" });
  assert.throws(() => normalizeAuditInput(audit(release, decisions, [{ ...item, policyFingerprint: DIGEST_A }])), { code: "INVALID_PLATFORM_RELEASE_EVIDENCE" });
});

test("executed and unexecuted results are exclusive and strict schemas reject unknown capabilities", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  assert.throws(() => normalizeAuditInput({ ...audit(release, decisions), extra: true }), { code: "INVALID_PLATFORM_RELEASE_AUDIT" });
  assert.throws(() => normalizeAuditInput(audit(release, decisions, [evidence("APP_TARGET_DEPLOYMENT", release, decisions, { reportDigest: null })])), { code: "INVALID_PLATFORM_RELEASE_EVIDENCE" });
  assert.throws(() => normalizeAuditInput(audit(release, decisions, [evidence("APP_TARGET_DEPLOYMENT", release, decisions, { inspectionState: INSPECTION_STATES.NOT_EXECUTED })])), { code: "INVALID_PLATFORM_RELEASE_EVIDENCE" });
  assert.throws(() => normalizeAuditInput(audit(release, decisions, [evidence("ANDROID_API_LEVEL", release, decisions)])), { code: "INVALID_PLATFORM_RELEASE_EVIDENCE" });
});

test("rejects duplicate surfaces and evidence IDs", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  const first = evidence("APP_TARGET_DEPLOYMENT", release, decisions);
  assert.throws(() => normalizeAuditInput(audit(release, decisions, [first, { ...first, evidenceId: "other-id" }])), { code: "DUPLICATE_PLATFORM_RELEASE_SURFACE" });
  const second = evidence("EXTENSION_TARGET_DEPLOYMENT", release, decisions, { evidenceId: first.evidenceId });
  assert.throws(() => normalizeAuditInput(audit(release, decisions, [first, second])), { code: "DUPLICATE_PLATFORM_RELEASE_EVIDENCE_ID" });
});

test("decision and evidence input ordering cannot change normalized fingerprints", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  const left = auditPlatformLanguageRelease(audit(release, decisions, completeEvidence(release, decisions)));
  const reversedDecisions = [...decisions].reverse();
  const reversedEvidence = [...completeEvidence(release, decisions)].reverse();
  const right = auditPlatformLanguageRelease(audit(release, reversedDecisions, reversedEvidence));
  assert.equal(left.policyFingerprint, right.policyFingerprint);
  assert.equal(left.evidenceManifestFingerprint, right.evidenceManifestFingerprint);
  assert.equal(left.reportFingerprint, right.reportFingerprint);
});

test("normalized audit and report values are detached and deeply immutable", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  const input = audit(release, decisions, completeEvidence(release, decisions));
  const normalized = normalizeAuditInput(input);
  const report = auditPlatformLanguageRelease(input);
  input.platformDecisions[0].selectedValues[0] = "IPAD";
  input.evidence[0].targetRef.artifactDigest = DIGEST_B;
  assert.deepEqual(normalized.platformDecisions[0].selectedValues, ["IPHONE"]);
  assert.equal(normalized.evidence[0].targetRef.artifactDigest, DIGEST_A);
  assert.equal(Object.isFrozen(report.groupResults[0].missingSurfaces), true);
  assert.throws(() => { report.blockers.push("tamper"); }, TypeError);
});

test("report validation detects disposition, decisions, baseline, boundary, result, and fingerprint tampering", () => {
  const release = signedTarget();
  const decisions = acceptedDecisions();
  const input = audit(release, decisions, completeEvidence(release, decisions));
  const report = auditPlatformLanguageRelease(input);
  assert.deepEqual(validatePlatformLanguageReleaseAuditReport(input, structuredClone(report)), report);
  for (const mutate of [
    (copy) => { copy.overallDisposition = "BLOCKED"; },
    (copy) => { copy.platformDecisions[0].selectedValues = ["IPAD"]; },
    (copy) => { copy.acceptedReleaseBaseline.minimumOsVersion = "16.0"; },
    (copy) => { copy.claimBoundary.releaseGateClosedByThisHarness = true; },
    (copy) => { copy.groupResults[0].disposition = "BLOCKED"; },
    (copy) => { copy.reportFingerprint = DIGEST_A; },
  ]) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validatePlatformLanguageReleaseAuditReport(input, copy), { code: "PLATFORM_RELEASE_AUDIT_REPORT_MISMATCH" });
  }
});

test("the harness evaluates supplied reports without scanning files, clocks, networks, stores, or native APIs", () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  assert.doesNotMatch(source, /\b(?:readFile|writeFile|fetch|XMLHttpRequest|Date\.now|new Date|child_process|xcodebuild|simctl)\b/);
  assert.match(source, /decisionTruthVerifiedByThisHarness: false/);
  assert.match(source, /evidenceTruthVerifiedByThisHarness: false/);
  assert.match(source, /releaseGateClosedByThisHarness: false/);
});
