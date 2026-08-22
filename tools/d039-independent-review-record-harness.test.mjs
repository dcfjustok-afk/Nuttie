import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BOUNDARY,
  CARD_DISPOSITION_IDS,
  CARD_IDENTITIES,
  CONTRACT_ID,
  INPUT_SCHEMA_VERSION,
  INVARIANT_IDS,
  PACKET_IDENTITY,
  RESULT_SCHEMA_VERSION,
  REVIEWED_ARTIFACTS,
  REVIEW_DOMAINS,
  computeD039ReviewBundleSha256,
  computeD039ReviewContentSha256,
  evaluateD039IndependentReviewRecord,
  normalizeD039IndependentReviewRecord,
  validateD039IndependentReviewRecordResult,
} from "./d039-independent-review-record-harness.mjs";

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
];

function attestation(index, reviewDomain) {
  const number = String(index + 1).padStart(3, "0");
  return {
    attestationId: `D039-IR-ATTEST-R${number}`,
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
      ? "D039-B03-B05-SYNTHETIC-R001"
      : "D039-B03-B05-REVIEW-R001",
    packetIdentity: clone(PACKET_IDENTITY),
    reviewedArtifacts: clone(REVIEWED_ARTIFACTS),
    cardDispositions: CARD_IDENTITIES.map((identity) => ({
      ...clone(identity),
      disposition: "APPROVE_SPEC",
      requiredReviewDomain: null,
      evidenceRefs: [`CARD-EVIDENCE:${identity.decisionId}`],
      findingIds: [],
    })),
    crossCardInvariantResults: INVARIANT_IDS.map((invariantId) => ({
      invariantId,
      result: "PASS",
      evidenceRefs: [`INVARIANT-EVIDENCE:${invariantId}`],
      findingIds: [],
    })),
    findings: [],
    overallDisposition: "INDEPENDENT_REVIEW_PASS_CANDIDATE",
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
  input.reviewContentSha256 = computeD039ReviewContentSha256(input);
  for (const reviewer of input.reviewerAttestations) reviewer.reviewContentSha256 = input.reviewContentSha256;
  input.bundleSha256 = computeD039ReviewBundleSha256(input);
  return input;
}

function finding({
  findingId = "D039-IR-F001",
  severity = "P3",
  reviewDomain = REVIEW_DOMAINS[0],
  blockerIds = ["D039-PX5-B03"],
  decisionIds = ["D-045"],
  state = "OPEN",
} = {}) {
  const isOpenP3 = severity === "P3" && state === "OPEN";
  return {
    findingId,
    severity,
    reviewDomain,
    blockerIds,
    decisionIds,
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

test("locks the V1 review bundle, frozen packet, four domains, six cards, and sixteen invariants", () => {
  assert.equal(INPUT_SCHEMA_VERSION, "D039_B03_B05_INDEPENDENT_REVIEW_BUNDLE_INPUT_V1");
  assert.equal(RESULT_SCHEMA_VERSION, "D039_B03_B05_INDEPENDENT_REVIEW_RESULT_V1");
  assert.equal(CONTRACT_ID, "D039-B03-B05-INDEPENDENT-REVIEW-RECORD-CONTRACT-001");
  assert.equal(PACKET_IDENTITY.packetVersion, "PACKET-001-R1");
  assert.equal(PACKET_IDENTITY.inputManifestEventId, "EVT-20260821-009");
  assert.equal(REVIEWED_ARTIFACTS.length, 10);
  assert.equal(REVIEW_DOMAINS.length, 4);
  assert.equal(CARD_IDENTITIES.length, 6);
  assert.equal(INVARIANT_IDS.length, 16);
  assert.equal(CARD_DISPOSITION_IDS.length, 4);
});

test("accepts a complete synthetic fixture only as non-evidence structural coverage", () => {
  const result = evaluateD039IndependentReviewRecord(finalize(baseInput()));
  assert.equal(result.disposition, "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY");
  assert.equal(result.overallDisposition, "INDEPENDENT_REVIEW_PASS_CANDIDATE");
  assert.equal(result.wouldBeIndependentReviewPassCandidate, true);
  assert.equal(result.independentReviewPassCandidate, false);
  assert.equal(result.independentReviewPassed, false);
  assert.equal(result.reviewedArtifactCount, 10);
  assert.equal(result.reviewerAttestationCount, 4);
  assert.equal(result.countableAttestationCount, 4);
  assert.deepEqual(result.reviewerDomainCoverage.map(({ attestationCount }) => attestationCount), [1, 1, 1, 1]);
  assert.equal(result.blockers.includes("SYNTHETIC_CONTRACT_FIXTURE_ONLY"), true);
  assert.equal(result.blockers.includes("B03_B04_B05_REMAIN_OPEN"), true);
  assert.deepEqual(result.boundary, BOUNDARY);
});

test("a structurally complete formal record is still only a caller-asserted pass candidate", () => {
  const result = evaluateD039IndependentReviewRecord(finalize(baseInput("FORMAL_REVIEW_RECORD")));
  assert.equal(result.disposition, "STRUCTURALLY_COMPLETE_REVIEW_ONLY");
  assert.equal(result.independentReviewPassCandidate, true);
  assert.equal(result.independentReviewPassed, false);
  assert.equal(result.boundary.reviewerIdentityVerified, false);
  assert.equal(result.boundary.reviewerSignatureVerified, false);
  assert.equal(result.boundary.b03Closed, false);
  assert.equal(result.boundary.b04Closed, false);
  assert.equal(result.boundary.b05Closed, false);
  assert.equal(result.blockers.includes("REVIEWER_IDENTITY_INDEPENDENCE_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED"), true);
  assert.equal(result.blockers.includes("AUTHORITATIVE_REVIEW_EVENT_REQUIRED"), true);
});

test("rejects packet identity, packet artifact, or any frozen reviewed artifact drift", () => {
  const mutations = [
    (input) => { input.packetIdentity.packetVersion = "PACKET-001-R2"; },
    (input) => { input.packetIdentity.packetArtifactBlobOid = "0".repeat(40); },
    (input) => { input.reviewedArtifacts[0].gitBlobOid = "0".repeat(40); },
    (input) => { input.reviewedArtifacts[9].sha256 = "0".repeat(64); },
    (input) => { [input.reviewedArtifacts[0], input.reviewedArtifacts[1]] = [input.reviewedArtifacts[1], input.reviewedArtifacts[0]]; },
  ];
  for (const mutate of mutations) {
    const input = baseInput();
    mutate(input);
    assert.throws(() => evaluateD039IndependentReviewRecord(input), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
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
    const result = evaluateD039IndependentReviewRecord(finalize(input));
    assert.equal(result.overallDisposition, "INCOMPLETE");
    assert.equal(result.countableAttestationCount, 3);
    assert.equal(result.reviewerDomainCoverage[3].attestationCount, 0);
    assert.equal(result.independentReviewPassCandidate, false);
  }
});

test("REJECT_SPEC, failed invariants, or open P0 derive REJECTED with highest priority", () => {
  const rejectedCard = baseInput();
  rejectedCard.cardDispositions[0].disposition = "REJECT_SPEC";
  rejectedCard.cardDispositions[0].findingIds = ["D039-IR-F001"];
  rejectedCard.findings = [finding({ severity: "P0" })];
  rejectedCard.overallDisposition = "REJECTED";
  assert.equal(evaluateD039IndependentReviewRecord(finalize(rejectedCard)).overallDisposition, "REJECTED");

  const failedInvariant = baseInput();
  failedInvariant.crossCardInvariantResults[0].result = "FAIL";
  failedInvariant.crossCardInvariantResults[0].findingIds = ["D039-IR-F001"];
  failedInvariant.findings = [finding()];
  failedInvariant.overallDisposition = "REJECTED";
  assert.equal(evaluateD039IndependentReviewRecord(finalize(failedInvariant)).overallDisposition, "REJECTED");

  const forged = clone(rejectedCard);
  forged.overallDisposition = "CHANGES_REQUIRED";
  finalize(forged);
  assert.throws(() => evaluateD039IndependentReviewRecord(forged), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
});

test("required card changes or open P1/P2 findings derive CHANGES_REQUIRED", () => {
  for (const severity of ["P1", "P2"]) {
    const input = baseInput();
    input.cardDispositions[0].disposition = "APPROVE_WITH_REQUIRED_CHANGE";
    input.cardDispositions[0].findingIds = ["D039-IR-F001"];
    input.findings = [finding({ severity })];
    input.overallDisposition = "CHANGES_REQUIRED";
    const result = evaluateD039IndependentReviewRecord(finalize(input));
    assert.equal(result.overallDisposition, "CHANGES_REQUIRED");
    assert.equal(result.cardDispositionCounts.APPROVE_WITH_REQUIRED_CHANGE, 1);
    assert.equal(result.findingCounts[severity].open, 1);
  }
});

test("OUT_OF_SCOPE, NOT_VERIFIED, or missing domain coverage derive INCOMPLETE", () => {
  const outOfScope = baseInput();
  outOfScope.cardDispositions[0].disposition = "OUT_OF_SCOPE";
  outOfScope.cardDispositions[0].requiredReviewDomain = REVIEW_DOMAINS[0];
  outOfScope.cardDispositions[0].findingIds = ["D039-IR-F001"];
  outOfScope.findings = [finding()];
  outOfScope.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateD039IndependentReviewRecord(finalize(outOfScope)).overallDisposition, "INCOMPLETE");

  const notVerified = baseInput();
  notVerified.crossCardInvariantResults[15].result = "NOT_VERIFIED";
  notVerified.crossCardInvariantResults[15].evidenceRefs = [];
  notVerified.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateD039IndependentReviewRecord(finalize(notVerified)).invariantResultCounts.NOT_VERIFIED, 1);

  const missingDomain = baseInput();
  missingDomain.reviewerAttestations = missingDomain.reviewerAttestations.slice(0, 3);
  missingDomain.overallDisposition = "INCOMPLETE";
  assert.equal(evaluateD039IndependentReviewRecord(finalize(missingDomain)).countableAttestationCount, 3);
});

test("requires exact six-card and sixteen-invariant identity, order, and coverage", () => {
  const mutations = [
    (input) => { input.cardDispositions.pop(); },
    (input) => { input.cardDispositions[0].questionId = "wrong_question"; },
    (input) => { input.cardDispositions[0].requiredReviewDomain = REVIEW_DOMAINS[0]; },
    (input) => { input.crossCardInvariantResults.pop(); },
    (input) => { input.crossCardInvariantResults[0].invariantId = "D039-XCI-016"; },
    (input) => { input.crossCardInvariantResults[0].evidenceRefs = []; },
  ];
  for (const mutate of mutations) {
    const input = baseInput();
    mutate(input);
    assert.throws(() => evaluateD039IndependentReviewRecord(input), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
  }
});

test("enforces bidirectional finding references and rejects unknown, orphan, or unsafe PASS links", () => {
  const unknown = baseInput();
  unknown.cardDispositions[0].findingIds = ["D039-IR-F999"];
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(unknown)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const orphan = baseInput();
  orphan.findings = [finding()];
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(orphan)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const mismatch = baseInput();
  mismatch.cardDispositions[0].findingIds = ["D039-IR-F001"];
  mismatch.findings = [finding({ blockerIds: ["D039-PX5-B05"], decisionIds: ["D-053"] })];
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(mismatch)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const unsafePass = baseInput();
  unsafePass.crossCardInvariantResults[0].findingIds = ["D039-IR-F001"];
  unsafePass.findings = [finding({ severity: "P2" })];
  unsafePass.overallDisposition = "CHANGES_REQUIRED";
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(unsafePass)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
});

test("allows only fully owned future-dated open P3 findings as non-blocking review material", () => {
  const input = baseInput();
  input.cardDispositions[0].findingIds = ["D039-IR-F001"];
  input.findings = [finding()];
  const result = evaluateD039IndependentReviewRecord(finalize(input));
  assert.equal(result.overallDisposition, "INDEPENDENT_REVIEW_PASS_CANDIDATE");
  assert.equal(result.findingCounts.P3.open, 1);

  for (const mutate of [
    (item) => { item.accountableOwnerRef = null; },
    (item) => { item.dueAt = "2026-08-21T23:59:59+08:00"; },
    (item) => { item.nonBlockingRationale = null; },
  ]) {
    const invalid = baseInput();
    invalid.cardDispositions[0].findingIds = ["D039-IR-F001"];
    invalid.findings = [finding()];
    mutate(invalid.findings[0]);
    assert.throws(() => evaluateD039IndependentReviewRecord(finalize(invalid)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
  }
});

test("closed findings require closure evidence and cannot retain open-P3 disposition fields", () => {
  const closed = baseInput();
  closed.cardDispositions[0].findingIds = ["D039-IR-F001"];
  closed.findings = [finding({ state: "CLOSED", severity: "P2" })];
  assert.equal(evaluateD039IndependentReviewRecord(finalize(closed)).overallDisposition, "INDEPENDENT_REVIEW_PASS_CANDIDATE");

  const missingClosure = clone(closed);
  missingClosure.findings[0].closureEvidenceRefs = [];
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(missingClosure)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const staleP3Fields = baseInput();
  staleP3Fields.cardDispositions[0].findingIds = ["D039-IR-F001"];
  staleP3Fields.findings = [finding({ state: "CLOSED" })];
  staleP3Fields.findings[0].accountableOwnerRef = "STALE-OWNER-REF";
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(staleP3Fields)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
});

test("binds review content, every attestation, and the complete bundle with two SHA-256 layers", () => {
  const contentDrift = finalize(baseInput());
  contentDrift.cardDispositions[0].evidenceRefs[0] = "CARD-EVIDENCE:CHANGED";
  assert.throws(() => evaluateD039IndependentReviewRecord(contentDrift), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const attestationContentDrift = finalize(baseInput());
  attestationContentDrift.reviewerAttestations[0].reviewContentSha256 = digest("wrong content");
  attestationContentDrift.bundleSha256 = computeD039ReviewBundleSha256(attestationContentDrift);
  assert.throws(() => evaluateD039IndependentReviewRecord(attestationContentDrift), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const signatureDrift = finalize(baseInput());
  signatureDrift.reviewerAttestations[0].signatureReference.sha256 = digest("changed signature ref");
  assert.throws(() => evaluateD039IndependentReviewRecord(signatureDrift), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const bundleDrift = finalize(baseInput());
  bundleDrift.bundleSha256 = digest("forged bundle");
  assert.throws(() => evaluateD039IndependentReviewRecord(bundleDrift), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
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
    assert.throws(() => evaluateD039IndependentReviewRecord(finalize(input)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
  }
});

test("separates formal and synthetic review IDs and validates supersession identities", () => {
  const formalWithSyntheticId = baseInput("FORMAL_REVIEW_RECORD");
  formalWithSyntheticId.reviewId = "D039-B03-B05-SYNTHETIC-R001";
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(formalWithSyntheticId)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const syntheticWithFormalId = baseInput();
  syntheticWithFormalId.reviewId = "D039-B03-B05-REVIEW-R001";
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(syntheticWithFormalId)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const selfSupersession = baseInput();
  selfSupersession.supersedesReviewId = selfSupersession.reviewId;
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(selfSupersession)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });

  const invalidCalendarDate = baseInput();
  invalidCalendarDate.reviewedAt = "2026-02-31T00:00:00+08:00";
  assert.throws(() => evaluateD039IndependentReviewRecord(finalize(invalidCalendarDate)), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
});

test("copies and deeply freezes normalized input and evaluation result", () => {
  const input = finalize(baseInput());
  const normalized = normalizeD039IndependentReviewRecord(input);
  const originalRef = normalized.cardDispositions[0].evidenceRefs[0];
  input.cardDispositions[0].evidenceRefs[0] = "CARD-EVIDENCE:MUTATED-AFTER-NORMALIZE";
  assert.equal(normalized.cardDispositions[0].evidenceRefs[0], originalRef);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.reviewedArtifacts), true);
  assert.equal(Object.isFrozen(normalized.reviewerAttestations[0].identityVerification), true);
  const result = evaluateD039IndependentReviewRecord(finalize(baseInput()));
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.reviewerDomainCoverage), true);
  assert.equal(Object.isFrozen(result.boundary), true);
});

test("rejects sensitive-looking material without echoing the canary", () => {
  const canary = "api_key=sk-SUPERSECRET-CANARY-123456";
  const input = baseInput();
  input.cardDispositions[0].evidenceRefs[0] = canary;
  let error;
  try {
    evaluateD039IndependentReviewRecord(input);
  } catch (caught) {
    error = caught;
  }
  assert.equal(error?.code, "UNSAFE_D039_INDEPENDENT_REVIEW_RECORD");
  assert.equal(`${error?.message}${JSON.stringify(error)}`.includes("SUPERSECRET-CANARY"), false);
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
  sparse.crossCardInvariantResults = new Array(16);
  inputs.push(sparse);

  const extra = baseInput();
  extra.unexpected = true;
  inputs.push(extra);

  const overflow = baseInput();
  overflow.cardDispositions[0].evidenceRefs = Array.from({ length: 257 }, (_, index) => `OVERFLOW-${index}`);
  inputs.push(overflow);

  for (const input of inputs) {
    assert.throws(() => evaluateD039IndependentReviewRecord(input), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
  }
});

test("rejects forged result fields or fingerprints", () => {
  const input = finalize(baseInput());
  const result = evaluateD039IndependentReviewRecord(input);
  const mutations = [
    (value) => { value.independentReviewPassed = true; },
    (value) => { value.boundary.b03Closed = true; },
    (value) => { value.countableAttestationCount = 99; },
    (value) => { value.resultFingerprint = digest("forged result"); },
  ];
  for (const mutate of mutations) {
    const forged = clone(result);
    mutate(forged);
    assert.throws(() => validateD039IndependentReviewRecordResult(forged, input), { code: "INVALID_D039_INDEPENDENT_REVIEW_RECORD" });
  }
  assert.deepEqual(validateD039IndependentReviewRecordResult(result, input), result);
});

test("source performs no filesystem, network, process, clock, message, Git, or signature side effect", async () => {
  const source = await readFile(new URL("./d039-independent-review-record-harness.mjs", import.meta.url), "utf8");
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
  const result = evaluateD039IndependentReviewRecord(finalize(baseInput()));
  assert.equal(result.boundary.gitReads, 0);
  assert.equal(result.boundary.fileReads, 0);
  assert.equal(result.boundary.signatureArtifactReads, 0);
  assert.equal(result.boundary.identityDocumentReads, 0);
  assert.equal(result.boundary.networkRequests, 0);
  assert.equal(result.boundary.externalMessagesSent, 0);
  assert.equal(result.boundary.formalReviewRecordsCreated, 0);
  assert.equal(result.boundary.independentReviewPassed, false);
  assert.equal(result.boundary.formalImplementationAuthorized, false);
});
