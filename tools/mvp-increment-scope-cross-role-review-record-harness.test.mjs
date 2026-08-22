import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BOUNDARY,
  OPTION_DISPOSITION_IDS,
  OPTION_IDENTITIES,
  CONTRACT_ID,
  INPUT_SCHEMA_VERSION,
  INVARIANT_IDS,
  PACKET_IDENTITY,
  RESULT_SCHEMA_VERSION,
  REVIEWED_ARTIFACTS,
  REVIEW_DOMAINS,
  computeMvpIncrementScopeCrossRoleReviewBundleSha256,
  computeMvpIncrementScopeCrossRoleReviewContentSha256,
  evaluateMvpIncrementScopeCrossRoleReviewRecord,
  normalizeMvpIncrementScopeCrossRoleReviewRecord,
  validateMvpIncrementScopeCrossRoleReviewRecordResult,
} from "./mvp-increment-scope-cross-role-review-record-harness.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function clone(value) {
  return structuredClone(value);
}

const REVIEWER_NAMES = [
  "Example Reviewer Alpha",
  "Example Reviewer Beta",
  "Example Reviewer Gamma",
  "Example Reviewer Delta",
  "Example Reviewer Epsilon",
];

function attestation(index, reviewDomain) {
  const number = String(index + 1).padStart(3, "0");
  return {
    attestationId: `MVP-SCOPE-IR-ATTEST-R${number}`,
    reviewerName: REVIEWER_NAMES[index],
    reviewerReferenceId: `REVIEWER-REF-${number}`,
    reviewDomains: [reviewDomain],
    competenceEvidenceByDomain: [{
      reviewDomain,
      evidenceRefs: [`COMPETENCE:${reviewDomain}:${number}`],
    }],
    participatedInDrafting: false,
    identityVerification: {
      state: "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF",
      verifiedByName: `Example Verifier ${number}`,
      verificationRef: `IDENTITY-VERIFY-${number}`,
      verifiedAt: "2026-08-21T23:30:00+08:00",
    },
    conflictOfInterest: {
      state: "NONE_DECLARED",
      disclosureRef: `COI-DISCLOSURE-${number}`,
      resolutionRef: null,
    },
    reviewContentSha256: digest("placeholder review content"),
    signedAt: "2026-08-22T00:05:00+08:00",
    signatureMethod: "SIGNED_DOCUMENT_REFERENCE",
    signatureReference: {
      referenceId: `SIGNATURE-REF-${number}`,
      sha256: digest(`synthetic signature reference ${number}`),
    },
    supersedesAttestationId: null,
  };
}

function baseInput(recordKind = "SYNTHETIC_CONTRACT_FIXTURE") {
  return {
    schemaVersion: INPUT_SCHEMA_VERSION,
    recordKind,
    reviewId: recordKind === "SYNTHETIC_CONTRACT_FIXTURE"
      ? "MVP-SCOPE-SYNTHETIC-R001"
      : "MVP-SCOPE-REVIEW-R001",
    packetIdentity: clone(PACKET_IDENTITY),
    reviewedArtifacts: clone(REVIEWED_ARTIFACTS),
    optionDispositions: OPTION_IDENTITIES.map((identity) => ({
      ...clone(identity),
      disposition: "APPROVE_SCOPE_OPTION",
      requiredReviewDomain: null,
      evidenceRefs: [`OPTION-EVIDENCE:${identity.optionKey}`],
      findingIds: [],
    })),
    crossOptionInvariantResults: INVARIANT_IDS.map((invariantId) => ({
      invariantId,
      result: "PASS",
      evidenceRefs: [`INVARIANT-EVIDENCE:${invariantId}`],
      findingIds: [],
    })),
    findings: [],
    overallDisposition: "CROSS_ROLE_REVIEW_PASS_CANDIDATE",
    reviewedAt: "2026-08-22T00:00:00+08:00",
    supersedesReviewId: null,
    containsCredential: false,
    containsIdentityDocument: false,
    containsSignatureMaterial: false,
    reviewContentSha256: digest("placeholder review content"),
    reviewerAttestations: REVIEW_DOMAINS.map((domain, index) => attestation(index, domain)),
    bundleSha256: digest("placeholder bundle"),
  };
}

function finalize(input) {
  input.reviewContentSha256 = computeMvpIncrementScopeCrossRoleReviewContentSha256(input);
  for (const reviewer of input.reviewerAttestations) reviewer.reviewContentSha256 = input.reviewContentSha256;
  input.bundleSha256 = computeMvpIncrementScopeCrossRoleReviewBundleSha256(input);
  return input;
}

function finding({
  findingId = "MVP-SCOPE-CR-F001",
  severity = "P3",
  reviewDomain = REVIEW_DOMAINS[0],
  optionKeys = ["A"],
  state = "OPEN",
} = {}) {
  const isOpenP3 = severity === "P3" && state === "OPEN";
  return {
    findingId,
    severity,
    reviewDomain,
    optionKeys,
    summary: "Synthetic contract finding summary",
    evidenceRefs: [`FINDING-EVIDENCE:${findingId}`],
    requiredChange: "Synthetic required change for contract evaluation",
    state,
    closureEvidenceRefs: state === "CLOSED" ? [`FINDING-CLOSURE:${findingId}`] : [],
    accountableOwnerRef: isOpenP3 ? `FINDING-OWNER:${findingId}` : null,
    dueAt: isOpenP3 ? "2026-09-22T00:00:00+08:00" : null,
    nonBlockingRationale: isOpenP3 ? "Synthetic P3 does not change the reviewed safety semantics." : null,
  };
}

test("locks the V1 review bundle, frozen packet, five domains, three options, and twelve invariants", () => {
  assert.equal(INPUT_SCHEMA_VERSION, "MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_BUNDLE_INPUT_V1");
  assert.equal(RESULT_SCHEMA_VERSION, "MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RESULT_V1");
  assert.equal(CONTRACT_ID, "MVP-INCREMENT-SCOPE-CROSS-ROLE-REVIEW-RECORD-CONTRACT-001");
  assert.equal(PACKET_IDENTITY.packetVersion, "PACKET-001-R1");
  assert.equal(PACKET_IDENTITY.inputManifestEventId, "EVT-20260822-010");
  assert.equal(PACKET_IDENTITY.manifestCommit, "9891e6ac75d02df3d85a6b13cb094cd80e7fe808");
  assert.equal(PACKET_IDENTITY.manifestRecordCommit, "6be59e5df3c1d06416f87950308bcb9a5df2aab0");
  assert.equal(REVIEWED_ARTIFACTS.length, 11);
  assert.equal(REVIEW_DOMAINS.length, 5);
  assert.equal(OPTION_IDENTITIES.length, 3);
  assert.equal(INVARIANT_IDS.length, 12);
  assert.equal(OPTION_DISPOSITION_IDS.length, 4);
});

test("accepts a complete synthetic fixture only as non-evidence structural coverage", () => {
  const result = evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(baseInput()));
  assert.equal(result.disposition, "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY");
  assert.equal(result.overallDisposition, "CROSS_ROLE_REVIEW_PASS_CANDIDATE");
  assert.equal(result.wouldBeCrossRoleReviewPassCandidate, true);
  assert.equal(result.crossRoleReviewPassCandidate, false);
  assert.equal(result.crossRoleReviewPassed, false);
  assert.equal(result.reviewedArtifactCount, 11);
  assert.equal(result.reviewerAttestationCount, 5);
  assert.equal(result.countableAttestationCount, 5);
  assert.deepEqual(result.reviewerDomainCoverage.map(({ attestationCount }) => attestationCount), [1, 1, 1, 1, 1]);
  assert.equal(result.blockers.includes("SYNTHETIC_CONTRACT_FIXTURE_ONLY"), true);
  assert.equal(result.blockers.includes("MVP_INCREMENT_SCOPE_NOT_FROZEN"), true);
  assert.equal(result.blockers.includes("G2_NOT_PASSED"), true);
  assert.deepEqual(result.boundary, BOUNDARY);
});

test("a structurally complete formal record is still only a caller-asserted pass candidate", () => {
  const result = evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(baseInput("FORMAL_REVIEW_RECORD")));
  assert.equal(result.disposition, "STRUCTURALLY_COMPLETE_REVIEW_ONLY");
  assert.equal(result.crossRoleReviewPassCandidate, true);
  assert.equal(result.crossRoleReviewPassed, false);
  assert.equal(result.boundary.reviewerIdentityVerified, false);
  assert.equal(result.boundary.reviewerCompetenceVerified, false);
  assert.equal(result.boundary.reviewerIndependenceVerified, false);
  assert.equal(result.boundary.reviewerSignatureVerified, false);
  assert.equal(result.boundary.crossRoleReviewStarted, false);
  assert.equal(result.boundary.mvpIncrementScopeFrozen, false);
  assert.equal(result.boundary.g2Passed, false);
  assert.equal(result.blockers.includes("REVIEWER_IDENTITY_COMPETENCE_INDEPENDENCE_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED"), true);
  assert.equal(result.blockers.includes("AUTHORITATIVE_REVIEW_EVENT_REQUIRED"), true);
});

test("rejects packet identity, packet artifact, or any frozen reviewed artifact drift", () => {
  const mutations = [
    (input) => { input.packetIdentity.packetVersion = "PACKET-001-R2"; },
    (input) => { input.packetIdentity.inputManifestEventId = "EVT-20260822-999"; },
    (input) => { input.packetIdentity.packetArtifactBlobOid = "0".repeat(40); },
    (input) => { input.reviewedArtifacts[0].gitBlobOid = "0".repeat(40); },
    (input) => { input.reviewedArtifacts[6].sha256 = "0".repeat(64); },
    (input) => { [input.reviewedArtifacts[0], input.reviewedArtifacts[1]] = [input.reviewedArtifacts[1], input.reviewedArtifacts[0]]; },
  ];
  for (const mutate of mutations) {
    const input = baseInput();
    mutate(input);
    assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(input), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
  }
});

test("uncountable drafting, identity, conflict, or signature attestations derive INCOMPLETE", () => {
  const mutations = [
    (reviewer) => { reviewer.participatedInDrafting = true; },
    (reviewer) => {
      reviewer.identityVerification = { state: "NOT_VERIFIED", verifiedByName: null, verificationRef: null, verifiedAt: null };
    },
    (reviewer) => {
      reviewer.conflictOfInterest = { state: "DISCLOSED_UNRESOLVED", disclosureRef: "COI-OPEN-004", resolutionRef: null };
    },
    (reviewer) => {
      reviewer.signatureMethod = "NOT_SIGNED";
      reviewer.signedAt = null;
      reviewer.signatureReference = null;
    },
  ];
  for (const mutate of mutations) {
    const input = baseInput();
    mutate(input.reviewerAttestations[3]);
    input.overallDisposition = "INCOMPLETE";
    const result = evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(input));
    assert.equal(result.overallDisposition, "INCOMPLETE");
    assert.equal(result.countableAttestationCount, 4);
    assert.equal(result.reviewerDomainCoverage[3].attestationCount, 0);
    assert.equal(result.crossRoleReviewPassCandidate, false);
  }
});

test("REJECT_SCOPE_OPTION, failed invariants, or open P0 derive REJECTED with highest priority", () => {
  const rejectedCard = baseInput();
  rejectedCard.optionDispositions[0].disposition = "REJECT_SCOPE_OPTION";
  rejectedCard.optionDispositions[0].findingIds = ["MVP-SCOPE-CR-F001"];
  rejectedCard.findings = [finding({ severity: "P0" })];
  rejectedCard.overallDisposition = "REJECTED";
  assert.equal(evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(rejectedCard)).overallDisposition, "REJECTED");

  const failedInvariant = baseInput();
  failedInvariant.crossOptionInvariantResults[0].result = "FAIL";
  failedInvariant.crossOptionInvariantResults[0].findingIds = ["MVP-SCOPE-CR-F001"];
  failedInvariant.findings = [finding()];
  failedInvariant.overallDisposition = "REJECTED";
  assert.equal(evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(failedInvariant)).overallDisposition, "REJECTED");

  const forged = clone(rejectedCard);
  forged.overallDisposition = "CHANGES_REQUIRED";
  finalize(forged);
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(forged), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
});

test("required option changes or open P1/P2 findings derive CHANGES_REQUIRED", () => {
  for (const severity of ["P1", "P2"]) {
    const input = baseInput();
    input.optionDispositions[0].disposition = "APPROVE_WITH_REQUIRED_CHANGE";
    input.optionDispositions[0].findingIds = ["MVP-SCOPE-CR-F001"];
    input.findings = [finding({ severity })];
    input.overallDisposition = "CHANGES_REQUIRED";
    const result = evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(input));
    assert.equal(result.overallDisposition, "CHANGES_REQUIRED");
    assert.equal(result.optionDispositionCounts.APPROVE_WITH_REQUIRED_CHANGE, 1);
    assert.equal(result.findingCounts[severity].open, 1);
  }
});

test("OUT_OF_SCOPE, NOT_REVIEWED, or missing domain coverage derive INCOMPLETE", () => {
  const outOfScope = baseInput();
  outOfScope.optionDispositions[0].disposition = "OUT_OF_SCOPE";
  outOfScope.optionDispositions[0].requiredReviewDomain = REVIEW_DOMAINS[0];
  outOfScope.optionDispositions[0].findingIds = ["MVP-SCOPE-CR-F001"];
  outOfScope.findings = [finding()];
  outOfScope.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(outOfScope)).overallDisposition, "INCOMPLETE");

  const notVerified = baseInput();
  notVerified.crossOptionInvariantResults[11].result = "NOT_REVIEWED";
  notVerified.crossOptionInvariantResults[11].evidenceRefs = [];
  notVerified.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(notVerified)).invariantResultCounts.NOT_REVIEWED, 1);

  const missingDomain = baseInput();
  missingDomain.reviewerAttestations = missingDomain.reviewerAttestations.slice(0, 3);
  missingDomain.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(missingDomain)).countableAttestationCount, 3);
});

test("requires exact three-option and twelve-invariant identity, order, and coverage", () => {
  const mutations = [
    (input) => { input.optionDispositions.pop(); },
    (input) => { input.optionDispositions[0].incrementId = "MVP-I1-WRONG"; },
    (input) => { input.optionDispositions[0].requiredReviewDomain = REVIEW_DOMAINS[0]; },
    (input) => { input.crossOptionInvariantResults.pop(); },
    (input) => { input.crossOptionInvariantResults[0].invariantId = "MVP-SCOPE-XI-012"; },
    (input) => { input.crossOptionInvariantResults[0].evidenceRefs = []; },
  ];
  for (const mutate of mutations) {
    const input = baseInput();
    mutate(input);
    assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(input), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
  }
});

test("enforces bidirectional finding references and rejects unknown, orphan, or unsafe PASS links", () => {
  const unknown = baseInput();
  unknown.optionDispositions[0].findingIds = ["MVP-SCOPE-CR-F999"];
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(unknown)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const orphan = baseInput();
  orphan.findings = [finding()];
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(orphan)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const mismatch = baseInput();
  mismatch.optionDispositions[0].findingIds = ["MVP-SCOPE-CR-F001"];
  mismatch.findings = [finding({ optionKeys: ["C"] })];
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(mismatch)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const unsafePass = baseInput();
  unsafePass.crossOptionInvariantResults[0].findingIds = ["MVP-SCOPE-CR-F001"];
  unsafePass.findings = [finding({ severity: "P2" })];
  unsafePass.overallDisposition = "CHANGES_REQUIRED";
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(unsafePass)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
});

test("allows only fully owned future-dated open P3 findings as non-blocking review material", () => {
  const input = baseInput();
  input.optionDispositions[0].findingIds = ["MVP-SCOPE-CR-F001"];
  input.findings = [finding()];
  const result = evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(input));
  assert.equal(result.overallDisposition, "CROSS_ROLE_REVIEW_PASS_CANDIDATE");
  assert.equal(result.findingCounts.P3.open, 1);

  for (const mutate of [
    (item) => { item.accountableOwnerRef = null; },
    (item) => { item.dueAt = "2026-08-21T23:59:59+08:00"; },
    (item) => { item.nonBlockingRationale = null; },
  ]) {
    const invalid = baseInput();
    invalid.optionDispositions[0].findingIds = ["MVP-SCOPE-CR-F001"];
    invalid.findings = [finding()];
    mutate(invalid.findings[0]);
    assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(invalid)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
  }
});

test("closed findings require closure evidence and cannot retain open-P3 disposition fields", () => {
  const closed = baseInput();
  closed.optionDispositions[0].findingIds = ["MVP-SCOPE-CR-F001"];
  closed.findings = [finding({ state: "CLOSED", severity: "P2" })];
  assert.equal(evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(closed)).overallDisposition, "CROSS_ROLE_REVIEW_PASS_CANDIDATE");

  const missingClosure = clone(closed);
  missingClosure.findings[0].closureEvidenceRefs = [];
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(missingClosure)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const staleP3Fields = baseInput();
  staleP3Fields.optionDispositions[0].findingIds = ["MVP-SCOPE-CR-F001"];
  staleP3Fields.findings = [finding({ state: "CLOSED" })];
  staleP3Fields.findings[0].accountableOwnerRef = "STALE-OWNER-REF";
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(staleP3Fields)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
});

test("binds review content, every attestation, and the complete bundle with two SHA-256 layers", () => {
  const contentDrift = finalize(baseInput());
  contentDrift.optionDispositions[0].evidenceRefs[0] = "CARD-EVIDENCE:CHANGED";
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(contentDrift), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const attestationContentDrift = finalize(baseInput());
  attestationContentDrift.reviewerAttestations[0].reviewContentSha256 = digest("wrong content");
  attestationContentDrift.bundleSha256 = computeMvpIncrementScopeCrossRoleReviewBundleSha256(attestationContentDrift);
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(attestationContentDrift), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const signatureDrift = finalize(baseInput());
  signatureDrift.reviewerAttestations[0].signatureReference.sha256 = digest("changed signature ref");
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(signatureDrift), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const bundleDrift = finalize(baseInput());
  bundleDrift.bundleSha256 = digest("forged bundle");
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(bundleDrift), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
});

test("rejects duplicate attestation, reviewer, signature, or competence identities", () => {
  const mutations = [
    (input) => { input.reviewerAttestations[1].attestationId = input.reviewerAttestations[0].attestationId; },
    (input) => { input.reviewerAttestations[1].reviewerReferenceId = input.reviewerAttestations[0].reviewerReferenceId; },
    (input) => { input.reviewerAttestations[1].signatureReference.referenceId = input.reviewerAttestations[0].signatureReference.referenceId; },
    (input) => { input.reviewerAttestations[0].competenceEvidenceByDomain[0].reviewDomain = REVIEW_DOMAINS[1]; },
    (input) => { input.reviewerAttestations[0].reviewerName = "Reviewer"; },
    (input) => { input.reviewerAttestations[0].identityVerification.verifiedByName = input.reviewerAttestations[0].reviewerName; },
  ];
  for (const mutate of mutations) {
    const input = baseInput();
    mutate(input);
    assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(input)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
  }
});

test("separates formal and synthetic review IDs and validates supersession identities", () => {
  const formalWithSyntheticId = baseInput("FORMAL_REVIEW_RECORD");
  formalWithSyntheticId.reviewId = "MVP-SCOPE-SYNTHETIC-R001";
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(formalWithSyntheticId)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const syntheticWithFormalId = baseInput();
  syntheticWithFormalId.reviewId = "MVP-SCOPE-REVIEW-R001";
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(syntheticWithFormalId)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const selfSupersession = baseInput();
  selfSupersession.supersedesReviewId = selfSupersession.reviewId;
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(selfSupersession)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });

  const invalidCalendarDate = baseInput();
  invalidCalendarDate.reviewedAt = "2026-02-31T00:00:00+08:00";
  assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(invalidCalendarDate)), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
});

test("copies and deeply freezes normalized input and evaluation result", () => {
  const input = finalize(baseInput());
  const normalized = normalizeMvpIncrementScopeCrossRoleReviewRecord(input);
  const originalRef = normalized.optionDispositions[0].evidenceRefs[0];
  input.optionDispositions[0].evidenceRefs[0] = "CARD-EVIDENCE:MUTATED-AFTER-NORMALIZE";
  assert.equal(normalized.optionDispositions[0].evidenceRefs[0], originalRef);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.reviewedArtifacts), true);
  assert.equal(Object.isFrozen(normalized.reviewerAttestations[0].identityVerification), true);
  const result = evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(baseInput()));
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.reviewerDomainCoverage), true);
  assert.equal(Object.isFrozen(result.boundary), true);
});

test("rejects sensitive-looking field names or values without echoing the canary", () => {
  const canary = "api_key=sk-SUPERSECRET-CANARY-123456";
  const inputs = [baseInput(), baseInput()];
  inputs[0].optionDispositions[0].evidenceRefs[0] = canary;
  inputs[1].packetIdentity[canary] = true;
  for (const input of inputs) {
    let error;
    try {
      evaluateMvpIncrementScopeCrossRoleReviewRecord(input);
    } catch (caught) {
      error = caught;
    }
    assert.equal(error?.code, "UNSAFE_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD");
    assert.equal(`${error?.message}${JSON.stringify(error)}`.includes("SUPERSECRET-CANARY"), false);
  }
});

test("rejects accessors, symbols, special objects, cycles, sparse arrays, extra fields, and resource overflow", () => {
  const inputs = [];

  const accessor = baseInput();
  Object.defineProperty(accessor, "schemaVersion", { enumerable: true, get: () => INPUT_SCHEMA_VERSION });
  inputs.push(accessor);

  const symbol = baseInput();
  symbol[Symbol("hidden")] = true;
  inputs.push(symbol);

  const special = baseInput();
  special.packetIdentity = new Map();
  inputs.push(special);

  const cycle = baseInput();
  cycle.packetIdentity.loop = cycle;
  inputs.push(cycle);

  const sparse = baseInput();
  sparse.crossOptionInvariantResults = new Array(12);
  inputs.push(sparse);

  const extra = baseInput();
  extra.unexpected = true;
  inputs.push(extra);

  const overflow = baseInput();
  overflow.optionDispositions[0].evidenceRefs = Array.from({ length: 257 }, (_, index) => `OVERFLOW-${index}`);
  inputs.push(overflow);

  const findingOverflow = baseInput();
  findingOverflow.findings = Array.from({ length: 129 }, (_, index) => finding({
    findingId: `MVP-SCOPE-CR-F${String(index + 1).padStart(3, "0")}`,
  }));
  inputs.push(findingOverflow);

  for (const input of inputs) {
    assert.throws(() => evaluateMvpIncrementScopeCrossRoleReviewRecord(input), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
  }
});

test("rejects forged result fields or fingerprints", () => {
  const input = finalize(baseInput());
  const result = evaluateMvpIncrementScopeCrossRoleReviewRecord(input);
  const mutations = [
    (value) => { value.crossRoleReviewPassed = true; },
    (value) => { value.boundary.mvpIncrementScopeFrozen = true; },
    (value) => { value.countableAttestationCount = 99; },
    (value) => { value.resultFingerprint = digest("forged result"); },
  ];
  for (const mutate of mutations) {
    const forged = clone(result);
    mutate(forged);
    assert.throws(() => validateMvpIncrementScopeCrossRoleReviewRecordResult(forged, input), { code: "INVALID_MVP_INCREMENT_SCOPE_CROSS_ROLE_REVIEW_RECORD" });
  }
  assert.deepEqual(validateMvpIncrementScopeCrossRoleReviewRecordResult(result, input), result);
});

test("source performs no filesystem, network, process, clock, message, Git, or signature side effect", async () => {
  const source = await readFile(new URL("./mvp-increment-scope-cross-role-review-record-harness.mjs", import.meta.url), "utf8");
  const forbidden = [
    /node:fs/,
    /node:http/,
    /node:https/,
    /child_process/,
    /\bfetch\s*\(/,
    /\bprocess\./,
    /Date\.now\s*\(/,
    /performance\./,
  ];
  for (const pattern of forbidden) assert.equal(pattern.test(source), false, pattern.toString());
  const result = evaluateMvpIncrementScopeCrossRoleReviewRecord(finalize(baseInput()));
  assert.equal(result.boundary.gitReads, 0);
  assert.equal(result.boundary.fileReads, 0);
  assert.equal(result.boundary.signatureArtifactReads, 0);
  assert.equal(result.boundary.identityDocumentReads, 0);
  assert.equal(result.boundary.networkRequests, 0);
  assert.equal(result.boundary.externalMessagesSent, 0);
  assert.equal(result.boundary.formalReviewRecordsCreated, 0);
  assert.equal(result.boundary.crossRoleReviewPassed, false);
  assert.equal(result.boundary.formalImplementationAuthorized, false);
  assert.equal(result.boundary.gateStatesChanged, false);
});
