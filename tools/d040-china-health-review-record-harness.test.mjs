import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  BOUNDARY,
  D040HealthReviewRecordError,
  INPUT_SCHEMA_VERSION,
  ITEM_IDENTITIES,
  PACKET_IDENTITY,
  REVIEWED_ARTIFACTS,
  computeD040HealthReviewBundleSha256,
  computeD040HealthReviewContentSha256,
  evaluateD040HealthReviewRecord,
  normalizeD040HealthReviewRecord,
  validateD040HealthReviewRecordResult,
} from "./d040-china-health-review-record-harness.mjs";

const TEST_PATH = fileURLToPath(import.meta.url);

function clone(value) {
  return structuredClone(value);
}

function makeRawBundle(recordKind = "SYNTHETIC_CONTRACT_FIXTURE") {
  const synthetic = recordKind === "SYNTHETIC_CONTRACT_FIXTURE";
  const competenceScope = [
    "SCOPE-ADULT-WEIGHT",
    "SCOPE-CLINICAL-NUTRITION",
    "SCOPE-CHRONIC-RISK",
    "SCOPE-ZH-HANS-CN-COPY",
  ];
  return {
    schemaVersion: INPUT_SCHEMA_VERSION,
    recordKind,
    reviewId: synthetic
      ? "D040-CHINA-HEALTH-SYNTHETIC-R001"
      : "D040-CHINA-HEALTH-REVIEW-R001",
    packetIdentity: clone(PACKET_IDENTITY),
    reviewedArtifacts: clone(REVIEWED_ARTIFACTS),
    reviewerAttestation: {
      attestationId: synthetic ? "D040-CHR-SYNTHETIC-ATT-R001" : "D040-CHR-ATT-R001",
      reviewerName: "Example Reviewer",
      reviewerReferenceId: "reviewer/example-001",
      qualificationType: "Example clinical nutrition qualification",
      qualificationIssuer: "Example regulated issuer",
      qualificationReference: "qualification/example-001",
      qualificationVerifiedAt: "2026-08-22T09:00:00+08:00",
      qualificationValidAt: "2026-08-22T09:05:00+08:00",
      competenceScope,
      localeAndRegionFit: {
        state: "PASS",
        rationaleRef: "locale/example-zh-hans-cn",
      },
      participatedInDrafting: false,
      qualificationVerification: {
        state: "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF",
        verifiedByName: "Example Verifier",
        verificationRef: "verification/example-001",
        verifiedAt: "2026-08-22T09:00:00+08:00",
      },
      conflictOfInterest: {
        state: "NONE_DECLARED",
        disclosureRef: "conflict/example-none-001",
        resolutionRef: null,
      },
      reviewerContactRef: "contact/example-controlled-001",
      reviewContentSha256: "0".repeat(64),
      signedAt: "2026-08-22T11:00:00+08:00",
      signatureMethod: "SIGNED_DOCUMENT_REFERENCE",
      signatureReference: {
        referenceId: "signature/example-001",
        sha256: "a".repeat(64),
      },
      supersedesAttestationId: null,
    },
    itemDispositions: ITEM_IDENTITIES.map(({ itemId, itemKind }) => ({
      itemId,
      itemKind,
      disposition: "APPROVE",
      competenceScopeRefs: [itemKind === "COPY" ? "SCOPE-ZH-HANS-CN-COPY" : "SCOPE-CLINICAL-NUTRITION"],
      evidenceRefs: [`evidence/${itemId.toLowerCase()}`],
      findingIds: [],
      requiredChange: null,
    })),
    findings: [],
    overallDisposition: "HEALTH_REVIEW_APPROVAL_CANDIDATE",
    reviewedAt: "2026-08-22T10:00:00+08:00",
    reviewDueAt: "2026-11-19T10:00:00+08:00",
    supersedesReviewId: null,
    containsCredential: false,
    containsIdentityDocument: false,
    containsSignatureMaterial: false,
    reviewContentSha256: "0".repeat(64),
    bundleSha256: "0".repeat(64),
  };
}

function seal(bundle) {
  bundle.reviewContentSha256 = computeD040HealthReviewContentSha256(bundle);
  bundle.reviewerAttestation.reviewContentSha256 = bundle.reviewContentSha256;
  bundle.bundleSha256 = computeD040HealthReviewBundleSha256(bundle);
  return bundle;
}

function makeBundle(recordKind = "SYNTHETIC_CONTRACT_FIXTURE") {
  return seal(makeRawBundle(recordKind));
}

function addFinding(bundle, {
  itemIndex = 0,
  findingId = "D040-CHR-F001",
  severity = "P2",
  state = "OPEN",
  disposition = "APPROVE_WITH_REQUIRED_CHANGE",
} = {}) {
  const item = bundle.itemDispositions[itemIndex];
  item.disposition = disposition;
  item.findingIds = [findingId];
  item.requiredChange = ["APPROVE_WITH_REQUIRED_CHANGE", "REJECT"].includes(disposition)
    ? "Revise the reviewed item before approval"
    : null;
  bundle.findings.push({
    findingId,
    severity,
    itemIds: [item.itemId],
    summary: "Example synthetic contract finding",
    evidenceRefs: ["evidence/finding-001"],
    requiredChange: "Resolve the synthetic contract finding",
    state,
    closureEvidenceRefs: state === "CLOSED" ? ["closure/example-001"] : [],
    accountableOwnerRef: state === "OPEN" && severity === "P3" ? "owner/example-001" : null,
    dueAt: state === "OPEN" && severity === "P3" ? "2026-09-01T10:00:00+08:00" : null,
    nonBlockingRationale: state === "OPEN" && severity === "P3"
      ? "Does not change the reviewed safety meaning"
      : null,
  });
  return bundle;
}

function expectInvalid(action, code = "INVALID_D040_CHINA_HEALTH_REVIEW_RECORD") {
  assert.throws(action, (error) => {
    assert.ok(error instanceof D040HealthReviewRecordError);
    assert.equal(error.code, code);
    return true;
  });
}

test("synthetic complete fixture validates the full contract without returning approval candidate", () => {
  const bundle = makeBundle();
  const normalized = normalizeD040HealthReviewRecord(bundle);
  const result = evaluateD040HealthReviewRecord(bundle);
  assert.equal(result.disposition, "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY");
  assert.equal(result.reviewedArtifactCount, 9);
  assert.equal(result.reviewedItemCount, 13);
  assert.equal(result.structurallyCompleteAttestation, true);
  assert.equal(result.wouldBeHealthReviewApprovalCandidate, true);
  assert.equal(result.healthReviewApprovalCandidate, false);
  assert.equal(result.healthContentApproved, false);
  assert.equal(result.contentQaPassed, false);
  assert.deepEqual(result.boundary, BOUNDARY);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.boundary));
  assert.ok(Object.isFrozen(normalized));
  assert.ok(Object.isFrozen(normalized.reviewerAttestation));
  bundle.reviewerAttestation.qualificationIssuer = "Changed after validation";
  assert.equal(normalized.reviewerAttestation.qualificationIssuer, "Example regulated issuer");
});

test("formal structurally complete record remains caller-asserted and not authoritative approval", () => {
  const bundle = makeBundle("FORMAL_HEALTH_REVIEW_RECORD");
  const result = evaluateD040HealthReviewRecord(bundle);
  assert.equal(result.disposition, "STRUCTURALLY_COMPLETE_HEALTH_REVIEW_ONLY");
  assert.equal(result.healthReviewApprovalCandidate, true);
  assert.equal(result.healthContentApproved, false);
  assert.ok(result.blockers.includes("AUTHORITATIVE_HEALTH_REVIEW_EVENT_REQUIRED"));
  assert.ok(result.blockers.includes("CONTENT_QA_REQUIRED"));
});

test("unverified qualification can be retained only as an incomplete partial record", () => {
  const bundle = makeRawBundle();
  bundle.reviewerAttestation.qualificationVerifiedAt = null;
  bundle.reviewerAttestation.qualificationValidAt = null;
  bundle.reviewerAttestation.qualificationVerification = {
    state: "NOT_VERIFIED",
    verifiedByName: null,
    verificationRef: null,
    verifiedAt: null,
  };
  bundle.overallDisposition = "INCOMPLETE";
  const result = evaluateD040HealthReviewRecord(seal(bundle));
  assert.equal(result.structurallyCompleteAttestation, false);
  assert.equal(result.overallDisposition, "INCOMPLETE");
});

test("a drafting participant cannot produce a structurally complete attestation", () => {
  const bundle = makeRawBundle();
  bundle.reviewerAttestation.participatedInDrafting = true;
  bundle.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateD040HealthReviewRecord(seal(bundle)).structurallyCompleteAttestation, false);
});

test("failed or unverified locale fit keeps the review incomplete", () => {
  for (const state of ["FAIL", "NOT_VERIFIED"]) {
    const bundle = makeRawBundle();
    bundle.reviewerAttestation.localeAndRegionFit.state = state;
    bundle.overallDisposition = "INCOMPLETE";
    assert.equal(evaluateD040HealthReviewRecord(seal(bundle)).overallDisposition, "INCOMPLETE");
  }
});

test("unresolved conflict or missing signature keeps the review incomplete", () => {
  const conflictBundle = makeRawBundle();
  conflictBundle.reviewerAttestation.conflictOfInterest = {
    state: "UNRESOLVED",
    disclosureRef: "conflict/example-open-001",
    resolutionRef: null,
  };
  conflictBundle.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateD040HealthReviewRecord(seal(conflictBundle)).overallDisposition, "INCOMPLETE");

  const unsignedBundle = makeRawBundle();
  unsignedBundle.reviewerAttestation.signatureMethod = "NOT_SIGNED";
  unsignedBundle.reviewerAttestation.signedAt = null;
  unsignedBundle.reviewerAttestation.signatureReference = null;
  unsignedBundle.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateD040HealthReviewRecord(seal(unsignedBundle)).overallDisposition, "INCOMPLETE");
});

test("reject disposition or open P0 derives REJECTED", () => {
  const bundle = addFinding(makeRawBundle(), { severity: "P0", disposition: "REJECT" });
  bundle.overallDisposition = "REJECTED";
  const result = evaluateD040HealthReviewRecord(seal(bundle));
  assert.equal(result.overallDisposition, "REJECTED");
  assert.equal(result.itemDispositionCounts.REJECT, 1);
  assert.equal(result.findingCounts.P0.open, 1);
});

test("required change or open P1/P2 derives CHANGES_REQUIRED", () => {
  for (const severity of ["P1", "P2"]) {
    const bundle = addFinding(makeRawBundle(), { severity });
    bundle.overallDisposition = "CHANGES_REQUIRED";
    assert.equal(evaluateD040HealthReviewRecord(seal(bundle)).overallDisposition, "CHANGES_REQUIRED");
  }
});

test("out-of-scope requires a missing reviewer scope and derives INCOMPLETE", () => {
  const bundle = addFinding(makeRawBundle(), { severity: "P2", state: "CLOSED", disposition: "OUT_OF_SCOPE" });
  bundle.itemDispositions[0].competenceScopeRefs = ["SCOPE-ADDITIONAL-SPECIALIST"];
  bundle.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateD040HealthReviewRecord(seal(bundle)).overallDisposition, "INCOMPLETE");

  const invalid = addFinding(makeRawBundle(), { severity: "P2", state: "CLOSED", disposition: "OUT_OF_SCOPE" });
  invalid.overallDisposition = "INCOMPLETE";
  expectInvalid(() => seal(invalid));
});

test("disposition priority is rejected before changes and incomplete", () => {
  const bundle = addFinding(makeRawBundle(), { severity: "P0", disposition: "REJECT" });
  bundle.itemDispositions[1].disposition = "OUT_OF_SCOPE";
  bundle.itemDispositions[1].competenceScopeRefs = ["SCOPE-ADDITIONAL-SPECIALIST"];
  bundle.itemDispositions[1].findingIds = ["D040-CHR-F002"];
  bundle.findings.push({
    findingId: "D040-CHR-F002",
    severity: "P2",
    itemIds: [bundle.itemDispositions[1].itemId],
    summary: "Example out-of-scope finding",
    evidenceRefs: ["evidence/finding-002"],
    requiredChange: "Obtain another specialist scope",
    state: "CLOSED",
    closureEvidenceRefs: ["closure/example-002"],
    accountableOwnerRef: null,
    dueAt: null,
    nonBlockingRationale: null,
  });
  bundle.overallDisposition = "REJECTED";
  assert.equal(evaluateD040HealthReviewRecord(seal(bundle)).overallDisposition, "REJECTED");
});

test("review interval, calendar timestamps, and supersession fail closed", () => {
  const exact = makeRawBundle();
  exact.reviewDueAt = "2026-11-20T10:00:00+08:00";
  assert.equal(normalizeD040HealthReviewRecord(seal(exact)).reviewDueAt, exact.reviewDueAt);

  const tooLate = makeRawBundle();
  tooLate.reviewDueAt = "2026-11-20T10:00:01+08:00";
  expectInvalid(() => seal(tooLate));

  const impossibleDate = makeRawBundle();
  impossibleDate.reviewedAt = "2026-02-30T10:00:00+08:00";
  expectInvalid(() => seal(impossibleDate));

  const selfSupersession = makeRawBundle();
  selfSupersession.supersedesReviewId = selfSupersession.reviewId;
  expectInvalid(() => seal(selfSupersession));
});

test("packet identity and every frozen artifact are exact", () => {
  const packetDrift = makeRawBundle();
  packetDrift.packetIdentity.packetVersion = "PACKET-001-R2";
  expectInvalid(() => seal(packetDrift));

  const artifactDrift = makeRawBundle();
  artifactDrift.reviewedArtifacts[4].sha256 = "b".repeat(64);
  expectInvalid(() => seal(artifactDrift));

  const reordered = makeRawBundle();
  [reordered.reviewedArtifacts[0], reordered.reviewedArtifacts[1]] = [reordered.reviewedArtifacts[1], reordered.reviewedArtifacts[0]];
  expectInvalid(() => seal(reordered));
});

test("thirteen item identities, kinds, counts, and competence scopes are exact", () => {
  const order = makeRawBundle();
  [order.itemDispositions[0], order.itemDispositions[1]] = [order.itemDispositions[1], order.itemDispositions[0]];
  expectInvalid(() => seal(order));

  const kind = makeRawBundle();
  kind.itemDispositions[6].itemKind = "COPY";
  expectInvalid(() => seal(kind));

  const missing = makeRawBundle();
  missing.itemDispositions.pop();
  expectInvalid(() => seal(missing));

  const scope = makeRawBundle();
  scope.itemDispositions[0].competenceScopeRefs = ["SCOPE-UNDECLARED"];
  expectInvalid(() => seal(scope));
});

test("finding references are bidirectional and open P3 requires full non-blocking disposition", () => {
  const oneWay = addFinding(makeRawBundle());
  oneWay.findings[0].itemIds = [oneWay.itemDispositions[1].itemId];
  oneWay.overallDisposition = "CHANGES_REQUIRED";
  expectInvalid(() => seal(oneWay));

  const openP3 = addFinding(makeRawBundle(), { severity: "P3", disposition: "APPROVE" });
  openP3.itemDispositions[0].requiredChange = null;
  openP3.overallDisposition = "HEALTH_REVIEW_APPROVAL_CANDIDATE";
  assert.equal(evaluateD040HealthReviewRecord(seal(openP3)).findingCounts.P3.open, 1);

  const incompleteP3 = addFinding(makeRawBundle(), { severity: "P3", disposition: "APPROVE" });
  incompleteP3.itemDispositions[0].requiredChange = null;
  incompleteP3.findings[0].dueAt = null;
  expectInvalid(() => seal(incompleteP3));
});

test("content, attestation, and bundle hashes bind normalized review data", () => {
  const content = makeBundle();
  content.itemDispositions[0].evidenceRefs = ["evidence/changed"];
  expectInvalid(() => normalizeD040HealthReviewRecord(content));

  const attestation = makeBundle();
  attestation.reviewerAttestation.reviewContentSha256 = "b".repeat(64);
  expectInvalid(() => normalizeD040HealthReviewRecord(attestation));

  const bundle = makeBundle();
  bundle.reviewerAttestation.qualificationIssuer = "Changed issuer";
  expectInvalid(() => normalizeD040HealthReviewRecord(bundle));
});

test("reviewer identity, self-verification, conflict, and signature structures fail closed", () => {
  const role = makeRawBundle();
  role.reviewerAttestation.reviewerName = "Codex";
  expectInvalid(() => seal(role));

  const self = makeRawBundle();
  self.reviewerAttestation.qualificationVerification.verifiedByName = "Example Reviewer";
  expectInvalid(() => seal(self));

  const mismatch = makeRawBundle();
  mismatch.reviewerAttestation.qualificationVerifiedAt = "2026-08-22T09:01:00+08:00";
  expectInvalid(() => seal(mismatch));

  const conflict = makeRawBundle();
  conflict.reviewerAttestation.conflictOfInterest.resolutionRef = "resolution/unexpected";
  expectInvalid(() => seal(conflict));

  const unsigned = makeRawBundle();
  unsigned.reviewerAttestation.signatureMethod = "NOT_SIGNED";
  expectInvalid(() => seal(unsigned));
});

test("sensitive-looking material is rejected without echoing the canary", () => {
  const canary = "person@example.com";
  const bundle = makeRawBundle();
  bundle.reviewerAttestation.qualificationIssuer = canary;
  assert.throws(() => seal(bundle), (error) => {
    assert.equal(error.code, "UNSAFE_D040_CHINA_HEALTH_REVIEW_RECORD");
    assert.equal(JSON.stringify(error).includes(canary), false);
    assert.equal(error.message.includes(canary), false);
    return true;
  });
});

test("accessors, symbols, special objects, cycles, sparse arrays, extra fields, and resources are rejected", () => {
  const accessor = makeRawBundle();
  Object.defineProperty(accessor, "unexpected", { enumerable: true, get() { return "x"; } });
  expectInvalid(() => computeD040HealthReviewContentSha256(accessor));

  const symbol = makeRawBundle();
  symbol[Symbol("secret")] = true;
  expectInvalid(() => computeD040HealthReviewContentSha256(symbol));

  const special = makeRawBundle();
  special.packetIdentity = new Map();
  expectInvalid(() => computeD040HealthReviewContentSha256(special));

  const cycle = makeRawBundle();
  cycle.loop = cycle;
  expectInvalid(() => computeD040HealthReviewContentSha256(cycle));

  const sparse = makeRawBundle();
  sparse.itemDispositions = new Array(13);
  expectInvalid(() => computeD040HealthReviewContentSha256(sparse));

  const extra = makeRawBundle();
  extra.unexpected = false;
  expectInvalid(() => computeD040HealthReviewContentSha256(extra));

  const resource = makeRawBundle();
  resource.reviewerAttestation.qualificationType = "x".repeat(4_097);
  expectInvalid(() => computeD040HealthReviewContentSha256(resource));
});

test("forged result fields or fingerprints are rejected", () => {
  const bundle = makeBundle();
  const result = evaluateD040HealthReviewRecord(bundle);
  assert.deepEqual(validateD040HealthReviewRecordResult(result, bundle), result);
  const forged = clone(result);
  forged.healthContentApproved = true;
  expectInvalid(() => validateD040HealthReviewRecordResult(forged, bundle));
});

test("source performs no filesystem, network, process, clock, message, Git, or qualification side effect", () => {
  const source = fs.readFileSync(new URL("./d040-china-health-review-record-harness.mjs", import.meta.url), "utf8");
  for (const prohibited of [
    /node:fs/, /node:net/, /node:http/, /node:https/, /child_process/, /spawn\s*\(/,
    /fetch\s*\(/, /Date\.now\s*\(/, /new\s+Date\s*\(\s*\)/,
    /git\s+/, /sendMessage/, /qualificationRegistry\s*\./, /writeFile/, /readFile/,
  ]) {
    assert.equal(prohibited.test(source), false, `prohibited source capability: ${prohibited}`);
  }
  assert.equal(source.includes("healthContentApproved: false"), true);
  assert.equal(source.includes("contentQaPassed: false"), true);
  assert.equal(source.includes("formalHealthReviewRecordCount: 0"), true);
  assert.equal(TEST_PATH.endsWith("d040-china-health-review-record-harness.test.mjs"), true);
});
