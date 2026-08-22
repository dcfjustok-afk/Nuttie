import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const CONTRACT_ID = "MVP-INCREMENT-SCOPE-REVIEWER-ASSIGNMENT-CONTRACT-001";
const INPUT_SCHEMA_VERSION = "MVP_INCREMENT_SCOPE_REVIEWER_ASSIGNMENT_INPUT_V1";
const RESULT_SCHEMA_VERSION = "MVP_INCREMENT_SCOPE_REVIEWER_ASSIGNMENT_RESULT_V1";
const BOUNDARY_SCHEMA_VERSION = "MVP_INCREMENT_SCOPE_REVIEWER_ASSIGNMENT_BOUNDARY_V1";
const INTAKE_PACKET_ID = "MVP-INCREMENT-SCOPE-REVIEWER-INTAKE-PACKET-001";
const FORMAL_RECORD_KIND = "FORMAL_ASSIGNMENT_RECORD";
const SYNTHETIC_RECORD_KIND = "SYNTHETIC_CONTRACT_FIXTURE";

const REVIEW_DOMAINS = Object.freeze([
  "PRODUCT_SCOPE",
  "DESIGN_EXPERIENCE",
  "ARCHITECTURE_DATA",
  "SECURITY_PRIVACY",
  "QA_TRACEABILITY",
]);

const SIGNATURE_METHODS = Object.freeze([
  "SIGNED_DOCUMENT_REFERENCE",
  "VERIFIED_WORKFLOW_REFERENCE",
  "WET_SIGNATURE_REFERENCE",
]);

const VERIFICATION_STATES = Object.freeze(["VERIFIED", "REJECTED", "PENDING"]);
const CONFLICT_STATES = Object.freeze(["NONE_DECLARED", "RESOLVED", "OPEN"]);

const REVIEW_PACKET_IDENTITY = Object.freeze({
  packetId: "MVP-INCREMENT-SCOPE-REVIEW-PACKET-001",
  packetVersion: "PACKET-001-R1",
  inputManifestEventId: "EVT-20260822-010",
  packetArtifactCommit: "6be59e5df3c1d06416f87950308bcb9a5df2aab0",
  packetArtifactBlobOid: "3b232045cdf791454ef269d0f7a1e632e72ef1c0",
  packetArtifactSha256: "d17ae5fa7567486e14741a3fecf252abf0b13414bb50c935403cc206b5b59a0e",
});

const BOUNDARY = immutable({
  schemaVersion: BOUNDARY_SCHEMA_VERSION,
  contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
  harnessReadsCallerSuppliedDataOnly: true,
  inputAuthorityVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  identityVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  competenceVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  independenceVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  contactAuthorizationVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  formalAssignmentCandidateCanBeReturned: true,
  formalAssignmentRecordCount: 0,
  controlledContactRecordCount: 0,
  identityDocumentReads: 0,
  competenceEvidenceReads: 0,
  contactRecordReads: 0,
  signatureArtifactReads: 0,
  gitReads: 0,
  fileReads: 0,
  fileWrites: 0,
  networkRequests: 0,
  providerRequests: 0,
  externalMessagesSent: 0,
  businessWrites: 0,
  reviewersAssigned: false,
  reviewerIdentityVerified: false,
  reviewerCompetenceVerified: false,
  reviewerIndependenceVerified: false,
  conflictOfInterestResolved: false,
  crossRoleReviewStarted: false,
  crossRoleReviewPassed: false,
  ownerIntakeChanged: false,
  ownerCardScheduled: false,
  ownerReviewAuthorized: false,
  ownerChoiceRecorded: false,
  selectedIncrementId: null,
  decisionIdAllocated: false,
  decisionRegistered: false,
  mvpIncrementScopeFrozen: false,
  g2Passed: false,
  formalRootProjectAuthorized: false,
  nativeIosWorkAuthorized: false,
  formalImplementationAuthorized: false,
  gateStatesChanged: false,
});

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "recordKind",
  "assignmentId",
  "intakePacketId",
  "reviewPacketIdentity",
  "reviewers",
  "domainCoverage",
  "externalContactAuthorized",
  "externalContactAuthorizationRef",
  "assignedByName",
  "assignedAt",
  "assignmentEvidenceRefs",
  "reviewCanStart",
  "containsCredential",
  "containsIdentityDocument",
  "containsPrivateContact",
  "containsSignatureMaterial",
  "assignmentContentSha256",
]);

const REVIEWER_KEYS = Object.freeze([
  "candidateId",
  "reviewerName",
  "controlledContactRef",
  "proposedReviewDomains",
  "competenceEvidenceByDomain",
  "participatedInDrafting",
  "draftingArtifactRefs",
  "identityVerification",
  "conflictOfInterest",
  "packetAccepted",
  "expectedReviewDueAt",
  "signatureMethod",
  "signatureReferencePlanned",
  "externalContactAuthorizationRef",
  "assignmentAcceptedAt",
]);

const SENSITIVE_FIELD_NAMES = new Set([
  "email",
  "emailaddress",
  "phone",
  "phonenumber",
  "address",
  "homeaddress",
  "identitydocument",
  "identitydocumentnumber",
  "identitydocumentscan",
  "signatureimage",
  "privatekey",
  "certificate",
  "certificatebody",
  "password",
  "secret",
  "token",
  "accesstoken",
  "apikey",
  "authorizationheader",
]);

function fail(message, code = "INVALID_MVP_SCOPE_REVIEWER_ASSIGNMENT", details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
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
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(clone(value));
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map(
    (key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`,
  ).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function containsSensitiveLookingValue(value) {
  return [
    /\b(?:sk|rk|pk)-[A-Za-z0-9_-]{8,}\b/i,
    /\bBearer\s+[A-Za-z0-9._~+\/-]{8,}/i,
    /\b(?:api[_-]?key|access[_-]?token|password|cookie|secret)\s*[:=]\s*\S+/i,
    /\bauthorization\s*[:=]\s*(?:bearer|basic)\s+\S+/i,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /^(?:tel:)?(?:\+86[- ]?)?1[3-9]\d{9}$/i,
    /^(?:tel:)?\+\d{1,3}[ -](?:\d[ -]?){7,12}\d$/i,
    /\b\d{17}[\dXx]\b/,
    /data:image\//i,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
    /-----BEGIN CERTIFICATE-----/i,
  ].some((pattern) => pattern.test(value));
}

function assertSafeFieldName(key, field) {
  const normalized = key.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
  if (SENSITIVE_FIELD_NAMES.has(normalized)) {
    fail("input contains a prohibited sensitive field", "UNSAFE_MVP_SCOPE_REVIEWER_ASSIGNMENT", { field });
  }
}

function assertSafeString(value, field) {
  if (containsSensitiveLookingValue(value)) {
    fail("input contains prohibited sensitive-looking material", "UNSAFE_MVP_SCOPE_REVIEWER_ASSIGNMENT", { field });
  }
}

function assertDataTree(value, field, state = { nodes: 0, seen: new Set() }, depth = 0) {
  state.nodes += 1;
  if (state.nodes > 12_000 || depth > 16) fail("input exceeds resource limits", undefined, { field });
  if (typeof value === "string") {
    if (value.length > 512) fail("input exceeds resource limits", undefined, { field });
    assertSafeString(value, field);
    return;
  }
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("input contains a non-finite number", undefined, { field });
    return;
  }
  if (typeof value !== "object") fail("input contains unsupported values", undefined, { field });
  if (state.seen.has(value)) fail("input contains a cycle", undefined, { field });
  state.seen.add(value);
  if (Object.getOwnPropertySymbols(value).length > 0) {
    fail("input contains symbol properties", undefined, { field });
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (Array.isArray(value) && key === "length") continue;
    assertSafeFieldName(key, `${field}.${key}`);
    if (!descriptor.enumerable || descriptor.get || descriptor.set) {
      fail("input contains non-data properties", undefined, { field: `${field}.${key}` });
    }
  }
  if (Array.isArray(value)) {
    if (value.length > 128) fail("input exceeds resource limits", undefined, { field });
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) fail("input contains a sparse array", undefined, { field });
    }
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      fail("input must use plain records", undefined, { field });
    }
  }
  for (const [key, child] of Object.entries(value)) {
    assertDataTree(child, `${field}.${key}`, state, depth + 1);
  }
  state.seen.delete(value);
}

function assertExactKeys(value, keys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be a plain record`, undefined, { field });
  }
  const expected = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) fail(`${field}.${key} is unsupported`, undefined, { field: `${field}.${key}` });
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, undefined, { field: `${field}.${key}` });
  }
}

function normalizeString(value, field, maxLength = 512) {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength || value !== value.trim()) {
    fail(`${field} must be a trimmed non-empty string`, undefined, { field });
  }
  assertSafeString(value, field);
  return value;
}

function isTimestamp(value) {
  if (typeof value !== "string") return false;
  const match = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const calendarDate = new Date(`${match[1]}T00:00:00Z`);
  return Number.isFinite(calendarDate.valueOf()) && calendarDate.toISOString().slice(0, 10) === match[1];
}

function normalizeTimestamp(value, field, { nullable = false } = {}) {
  if (nullable && value === null) return null;
  if (!isTimestamp(value)) fail(`${field} must be an RFC 3339 timestamp`, undefined, { field });
  return value;
}

function assertPersonName(value, field, recordKind) {
  const name = normalizeString(value, field, 100);
  if (!/[\p{L}]/u.test(name)) fail(`${field} must contain a person name`, undefined, { field });
  const lower = name.toLowerCase().replace(/[._/-]+/g, " ").replace(/\s+/g, " ").trim();
  const roleOnly = new Set([
    "pm", "qa", "owner", "codex", "ai", "agent", "project manager", "product manager",
    "product scope", "design experience", "architecture data", "security privacy", "qa traceability",
  ]);
  if (roleOnly.has(lower)) fail(`${field} cannot be a role or agent name`, undefined, { field });
  if (recordKind === SYNTHETIC_RECORD_KIND) {
    if (!/^Example\s/u.test(name)) fail(`${field} must be visibly synthetic`, undefined, { field });
  } else if (/\b(?:example|test|synthetic)\b/iu.test(name)) {
    fail(`${field} cannot use a synthetic identity in a formal record`, undefined, { field });
  }
  return name;
}

function normalizeReference(value, field, recordKind, { nullable = false } = {}) {
  if (nullable && value === null) return null;
  const reference = normalizeString(value, field, 512);
  if (/\s/u.test(reference)) fail(`${field} must be an opaque non-sensitive reference`, undefined, { field });
  if (recordKind === SYNTHETIC_RECORD_KIND) {
    if (!reference.includes(".example.test")) fail(`${field} must use an example.test reference`, undefined, { field });
  } else if (reference.includes(".example.test")) {
    fail(`${field} cannot use a synthetic reference in a formal record`, undefined, { field });
  }
  return reference;
}

function normalizeReferences(value, field, recordKind, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || value.length > 32 || (!allowEmpty && value.length === 0)) {
    fail(`${field} must be ${allowEmpty ? "an" : "a non-empty"} reference array`, undefined, { field });
  }
  const normalized = value.map((item, index) => normalizeReference(item, `${field}[${index}]`, recordKind));
  if (new Set(normalized).size !== normalized.length) fail(`${field} contains duplicate references`, undefined, { field });
  return normalized;
}

function normalizeVerification(value, field, reviewerName, recordKind) {
  assertExactKeys(value, ["state", "verifiedByName", "verificationRef", "verifiedAt"], field);
  if (!VERIFICATION_STATES.includes(value.state)) fail(`${field}.state is unsupported`, undefined, { field: `${field}.state` });
  if (value.state === "PENDING") {
    if (value.verifiedByName !== null || value.verificationRef !== null || value.verifiedAt !== null) {
      fail(`${field} PENDING metadata must be null`, undefined, { field });
    }
    return immutable({ state: value.state, verifiedByName: null, verificationRef: null, verifiedAt: null });
  }
  const verifiedByName = assertPersonName(value.verifiedByName, `${field}.verifiedByName`, recordKind);
  if (verifiedByName === reviewerName) fail(`${field} cannot be self-verified`, undefined, { field });
  return immutable({
    state: value.state,
    verifiedByName,
    verificationRef: normalizeReference(value.verificationRef, `${field}.verificationRef`, recordKind),
    verifiedAt: normalizeTimestamp(value.verifiedAt, `${field}.verifiedAt`),
  });
}

function normalizeCandidate(value, index, recordKind) {
  const field = `reviewers[${index}]`;
  assertExactKeys(value, REVIEWER_KEYS, field);
  const candidatePattern = recordKind === SYNTHETIC_RECORD_KIND
    ? /^MVP-SCOPE-SYNTHETIC-C\d{3}$/
    : /^MVP-SCOPE-REVIEWER-C\d{3}$/;
  const candidateId = normalizeString(value.candidateId, `${field}.candidateId`, 64);
  if (!candidatePattern.test(candidateId)) fail(`${field}.candidateId has the wrong record-kind prefix`, undefined, { field: `${field}.candidateId` });
  const reviewerName = assertPersonName(value.reviewerName, `${field}.reviewerName`, recordKind);
  const controlledContactRef = normalizeReference(value.controlledContactRef, `${field}.controlledContactRef`, recordKind);

  if (!Array.isArray(value.proposedReviewDomains) || value.proposedReviewDomains.length === 0 || value.proposedReviewDomains.length > 5) {
    fail(`${field}.proposedReviewDomains must contain one to five domains`, undefined, { field: `${field}.proposedReviewDomains` });
  }
  const proposedReviewDomains = value.proposedReviewDomains.map((domain, domainIndex) => {
    if (!REVIEW_DOMAINS.includes(domain)) fail(`${field}.proposedReviewDomains[${domainIndex}] is unsupported`, undefined, { field: `${field}.proposedReviewDomains[${domainIndex}]` });
    return domain;
  });
  if (new Set(proposedReviewDomains).size !== proposedReviewDomains.length) {
    fail(`${field}.proposedReviewDomains contains duplicates`, undefined, { field: `${field}.proposedReviewDomains` });
  }
  const sortedDomains = [...proposedReviewDomains].sort((left, right) => REVIEW_DOMAINS.indexOf(left) - REVIEW_DOMAINS.indexOf(right));
  if (!isDeepStrictEqual(proposedReviewDomains, sortedDomains)) {
    fail(`${field}.proposedReviewDomains must use fixed domain order`, undefined, { field: `${field}.proposedReviewDomains` });
  }

  if (!Array.isArray(value.competenceEvidenceByDomain) || value.competenceEvidenceByDomain.length !== proposedReviewDomains.length) {
    fail(`${field}.competenceEvidenceByDomain must match proposed domains`, undefined, { field: `${field}.competenceEvidenceByDomain` });
  }
  const competenceEvidenceByDomain = value.competenceEvidenceByDomain.map((entry, domainIndex) => {
    const entryField = `${field}.competenceEvidenceByDomain[${domainIndex}]`;
    assertExactKeys(
      entry,
      ["reviewDomain", "evidenceRefs", "verificationState", "verifiedByName", "verificationRef", "verifiedAt"],
      entryField,
    );
    if (entry.reviewDomain !== proposedReviewDomains[domainIndex]) {
      fail(`${entryField}.reviewDomain must match proposed domain order`, undefined, { field: `${entryField}.reviewDomain` });
    }
    if (!VERIFICATION_STATES.includes(entry.verificationState)) {
      fail(`${entryField}.verificationState is unsupported`, undefined, { field: `${entryField}.verificationState` });
    }
    if (entry.verificationState === "PENDING") {
      const evidenceRefs = normalizeReferences(entry.evidenceRefs, `${entryField}.evidenceRefs`, recordKind, { allowEmpty: true });
      if (evidenceRefs.length !== 0 || entry.verifiedByName !== null || entry.verificationRef !== null || entry.verifiedAt !== null) {
        fail(`${entryField} PENDING metadata must be empty or null`, undefined, { field: entryField });
      }
      return immutable({
        reviewDomain: entry.reviewDomain,
        evidenceRefs,
        verificationState: entry.verificationState,
        verifiedByName: null,
        verificationRef: null,
        verifiedAt: null,
      });
    }
    const verifiedByName = assertPersonName(entry.verifiedByName, `${entryField}.verifiedByName`, recordKind);
    if (verifiedByName === reviewerName) fail(`${entryField} cannot be self-verified`, undefined, { field: entryField });
    return immutable({
      reviewDomain: entry.reviewDomain,
      evidenceRefs: normalizeReferences(entry.evidenceRefs, `${entryField}.evidenceRefs`, recordKind),
      verificationState: entry.verificationState,
      verifiedByName,
      verificationRef: normalizeReference(entry.verificationRef, `${entryField}.verificationRef`, recordKind),
      verifiedAt: normalizeTimestamp(entry.verifiedAt, `${entryField}.verifiedAt`),
    });
  });

  if (typeof value.participatedInDrafting !== "boolean") fail(`${field}.participatedInDrafting must be boolean`, undefined, { field: `${field}.participatedInDrafting` });
  const draftingArtifactRefs = normalizeReferences(value.draftingArtifactRefs, `${field}.draftingArtifactRefs`, recordKind, { allowEmpty: true });
  if (value.participatedInDrafting !== (draftingArtifactRefs.length > 0)) {
    fail(`${field}.draftingArtifactRefs must match drafting participation`, undefined, { field: `${field}.draftingArtifactRefs` });
  }

  const identityVerification = normalizeVerification(value.identityVerification, `${field}.identityVerification`, reviewerName, recordKind);
  assertExactKeys(value.conflictOfInterest, ["state", "disclosureRef", "resolutionRef"], `${field}.conflictOfInterest`);
  if (!CONFLICT_STATES.includes(value.conflictOfInterest.state)) {
    fail(`${field}.conflictOfInterest.state is unsupported`, undefined, { field: `${field}.conflictOfInterest.state` });
  }
  const conflictOfInterest = immutable({
    state: value.conflictOfInterest.state,
    disclosureRef: normalizeReference(value.conflictOfInterest.disclosureRef, `${field}.conflictOfInterest.disclosureRef`, recordKind),
    resolutionRef: normalizeReference(value.conflictOfInterest.resolutionRef, `${field}.conflictOfInterest.resolutionRef`, recordKind, { nullable: true }),
  });
  if ((conflictOfInterest.state === "RESOLVED") !== (conflictOfInterest.resolutionRef !== null)) {
    fail(`${field}.conflictOfInterest.resolutionRef must exist only for RESOLVED`, undefined, { field: `${field}.conflictOfInterest.resolutionRef` });
  }

  assertExactKeys(value.packetAccepted, ["packetId", "packetVersion", "acceptedAt"], `${field}.packetAccepted`);
  if (value.packetAccepted.packetId !== REVIEW_PACKET_IDENTITY.packetId || value.packetAccepted.packetVersion !== REVIEW_PACKET_IDENTITY.packetVersion) {
    fail(`${field}.packetAccepted must bind the frozen packet`, undefined, { field: `${field}.packetAccepted` });
  }
  const packetAccepted = immutable({
    packetId: value.packetAccepted.packetId,
    packetVersion: value.packetAccepted.packetVersion,
    acceptedAt: normalizeTimestamp(value.packetAccepted.acceptedAt, `${field}.packetAccepted.acceptedAt`, { nullable: true }),
  });
  const expectedReviewDueAt = normalizeTimestamp(value.expectedReviewDueAt, `${field}.expectedReviewDueAt`, { nullable: true });
  if ((value.signatureMethod === null) !== (value.signatureReferencePlanned === null)) {
    fail(`${field} signature method and planned reference must be both null or both present`, undefined, { field });
  }
  let signatureMethod = null;
  let signatureReferencePlanned = null;
  if (value.signatureMethod !== null) {
    if (!SIGNATURE_METHODS.includes(value.signatureMethod)) fail(`${field}.signatureMethod is unsupported`, undefined, { field: `${field}.signatureMethod` });
    signatureMethod = value.signatureMethod;
    signatureReferencePlanned = normalizeReference(value.signatureReferencePlanned, `${field}.signatureReferencePlanned`, recordKind);
  }

  return immutable({
    candidateId,
    reviewerName,
    controlledContactRef,
    proposedReviewDomains,
    competenceEvidenceByDomain,
    participatedInDrafting: value.participatedInDrafting,
    draftingArtifactRefs,
    identityVerification,
    conflictOfInterest,
    packetAccepted,
    expectedReviewDueAt,
    signatureMethod,
    signatureReferencePlanned,
    externalContactAuthorizationRef: normalizeReference(
      value.externalContactAuthorizationRef,
      `${field}.externalContactAuthorizationRef`,
      recordKind,
      { nullable: true },
    ),
    assignmentAcceptedAt: normalizeTimestamp(value.assignmentAcceptedAt, `${field}.assignmentAcceptedAt`, { nullable: true }),
  });
}

function computeAssignmentContentSha256(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("assignment bundle must be a plain record", undefined, { field: "input" });
  }
  return fingerprint(Object.fromEntries(
    Object.entries(input).filter(([key]) => key !== "assignmentContentSha256"),
  ));
}

function isCompleteCandidate(candidate, assignedAt) {
  if (candidate.participatedInDrafting || candidate.identityVerification.state !== "VERIFIED") return false;
  if (!candidate.competenceEvidenceByDomain.every((entry) => entry.verificationState === "VERIFIED")) return false;
  if (!new Set(["NONE_DECLARED", "RESOLVED"]).has(candidate.conflictOfInterest.state)) return false;
  if (
    candidate.packetAccepted.acceptedAt === null ||
    candidate.assignmentAcceptedAt === null ||
    candidate.expectedReviewDueAt === null ||
    candidate.signatureMethod === null ||
    candidate.signatureReferencePlanned === null ||
    candidate.externalContactAuthorizationRef === null
  ) return false;
  const packetAcceptedAt = Date.parse(candidate.packetAccepted.acceptedAt);
  const assignmentAcceptedAt = Date.parse(candidate.assignmentAcceptedAt);
  const assignedAtValue = Date.parse(assignedAt);
  const dueAt = Date.parse(candidate.expectedReviewDueAt);
  return packetAcceptedAt <= assignmentAcceptedAt && assignmentAcceptedAt <= assignedAtValue && assignedAtValue < dueAt;
}

function normalizeMvpIncrementScopeReviewerAssignment(input) {
  assertDataTree(input, "input");
  assertExactKeys(input, TOP_LEVEL_KEYS, "input");
  if (input.schemaVersion !== INPUT_SCHEMA_VERSION) fail("unsupported schemaVersion", undefined, { field: "schemaVersion" });
  if (![FORMAL_RECORD_KIND, SYNTHETIC_RECORD_KIND].includes(input.recordKind)) fail("unsupported recordKind", undefined, { field: "recordKind" });
  const assignmentPattern = input.recordKind === SYNTHETIC_RECORD_KIND
    ? /^MVP-SCOPE-SYNTHETIC-A\d{3}$/
    : /^MVP-SCOPE-ASSIGNMENT-A\d{3}$/;
  const assignmentId = normalizeString(input.assignmentId, "assignmentId", 64);
  if (!assignmentPattern.test(assignmentId)) fail("assignmentId has the wrong record-kind prefix", undefined, { field: "assignmentId" });
  if (input.intakePacketId !== INTAKE_PACKET_ID) fail("intakePacketId is unsupported", undefined, { field: "intakePacketId" });
  assertExactKeys(input.reviewPacketIdentity, Object.keys(REVIEW_PACKET_IDENTITY), "reviewPacketIdentity");
  if (!isDeepStrictEqual(input.reviewPacketIdentity, REVIEW_PACKET_IDENTITY)) {
    fail("reviewPacketIdentity does not match the frozen packet", undefined, { field: "reviewPacketIdentity" });
  }
  if (!Array.isArray(input.reviewers) || input.reviewers.length === 0 || input.reviewers.length > 20) {
    fail("reviewers must contain one to twenty candidates", undefined, { field: "reviewers" });
  }
  const reviewers = input.reviewers.map((reviewer, index) => normalizeCandidate(reviewer, index, input.recordKind));
  if (new Set(reviewers.map((reviewer) => reviewer.candidateId)).size !== reviewers.length) {
    fail("reviewers contain duplicate candidate IDs", undefined, { field: "reviewers" });
  }
  if (new Set(reviewers.map((reviewer) => reviewer.reviewerName.toLocaleLowerCase("en-US"))).size !== reviewers.length) {
    fail("reviewers contain duplicate names", undefined, { field: "reviewers" });
  }
  if (new Set(reviewers.map((reviewer) => reviewer.controlledContactRef)).size !== reviewers.length) {
    fail("reviewers contain duplicate contact references", undefined, { field: "reviewers" });
  }

  if (!Array.isArray(input.domainCoverage) || input.domainCoverage.length !== REVIEW_DOMAINS.length) {
    fail("domainCoverage must contain exactly five domains", undefined, { field: "domainCoverage" });
  }
  const domainCoverage = input.domainCoverage.map((entry, index) => {
    const field = `domainCoverage[${index}]`;
    assertExactKeys(entry, ["reviewDomain", "candidateIds"], field);
    if (entry.reviewDomain !== REVIEW_DOMAINS[index]) fail(`${field}.reviewDomain must use fixed order`, undefined, { field: `${field}.reviewDomain` });
    if (!Array.isArray(entry.candidateIds) || entry.candidateIds.length === 0 || entry.candidateIds.length > 20) {
      fail(`${field}.candidateIds must be non-empty`, undefined, { field: `${field}.candidateIds` });
    }
    const expectedIds = reviewers
      .filter((reviewer) => reviewer.proposedReviewDomains.includes(entry.reviewDomain))
      .map((reviewer) => reviewer.candidateId);
    if (!isDeepStrictEqual(entry.candidateIds, expectedIds)) {
      fail(`${field}.candidateIds must exactly match candidate declarations`, undefined, { field: `${field}.candidateIds` });
    }
    return immutable({ reviewDomain: entry.reviewDomain, candidateIds: [...entry.candidateIds] });
  });

  if (typeof input.externalContactAuthorized !== "boolean") fail("externalContactAuthorized must be boolean", undefined, { field: "externalContactAuthorized" });
  const externalContactAuthorizationRef = normalizeReference(
    input.externalContactAuthorizationRef,
    "externalContactAuthorizationRef",
    input.recordKind,
    { nullable: true },
  );
  if (input.externalContactAuthorized !== (externalContactAuthorizationRef !== null)) {
    fail("external contact authorization flag and reference must match", undefined, { field: "externalContactAuthorizationRef" });
  }
  const assignedByName = assertPersonName(input.assignedByName, "assignedByName", input.recordKind);
  const assignedAt = normalizeTimestamp(input.assignedAt, "assignedAt");
  const assignmentEvidenceRefs = normalizeReferences(
    input.assignmentEvidenceRefs,
    "assignmentEvidenceRefs",
    input.recordKind,
    { allowEmpty: true },
  );
  if (typeof input.reviewCanStart !== "boolean") fail("reviewCanStart must be boolean", undefined, { field: "reviewCanStart" });
  for (const flag of ["containsCredential", "containsIdentityDocument", "containsPrivateContact", "containsSignatureMaterial"]) {
    if (input[flag] !== false) fail(`${flag} must be false`, "UNSAFE_MVP_SCOPE_REVIEWER_ASSIGNMENT", { field: flag });
  }
  if (!/^[a-f0-9]{64}$/.test(input.assignmentContentSha256)) {
    fail("assignmentContentSha256 must be lowercase SHA-256", undefined, { field: "assignmentContentSha256" });
  }
  if (input.assignmentContentSha256 !== computeAssignmentContentSha256(input)) {
    fail("assignmentContentSha256 does not match the canonical bundle", undefined, { field: "assignmentContentSha256" });
  }

  const completeCandidateIds = new Set(
    reviewers.filter((reviewer) => isCompleteCandidate(reviewer, assignedAt)).map((reviewer) => reviewer.candidateId),
  );
  const coveredReviewerDomainCount = domainCoverage.filter(
    (entry) => entry.candidateIds.some((candidateId) => completeCandidateIds.has(candidateId)),
  ).length;
  const structurallyReady =
    completeCandidateIds.size === reviewers.length &&
    coveredReviewerDomainCount === REVIEW_DOMAINS.length &&
    input.externalContactAuthorized &&
    assignmentEvidenceRefs.length > 0;
  if (input.reviewCanStart !== structurallyReady) {
    fail("reviewCanStart does not match recomputed assignment readiness", undefined, { field: "reviewCanStart" });
  }

  return immutable({
    schemaVersion: INPUT_SCHEMA_VERSION,
    recordKind: input.recordKind,
    assignmentId,
    intakePacketId: input.intakePacketId,
    reviewPacketIdentity: REVIEW_PACKET_IDENTITY,
    reviewers,
    domainCoverage,
    externalContactAuthorized: input.externalContactAuthorized,
    externalContactAuthorizationRef,
    assignedByName,
    assignedAt,
    assignmentEvidenceRefs,
    reviewCanStart: input.reviewCanStart,
    containsCredential: false,
    containsIdentityDocument: false,
    containsPrivateContact: false,
    containsSignatureMaterial: false,
    assignmentContentSha256: input.assignmentContentSha256,
  });
}

function evaluateMvpIncrementScopeReviewerAssignment(input) {
  const normalized = normalizeMvpIncrementScopeReviewerAssignment(input);
  const completeCandidateIds = new Set(
    normalized.reviewers
      .filter((reviewer) => isCompleteCandidate(reviewer, normalized.assignedAt))
      .map((reviewer) => reviewer.candidateId),
  );
  const coveredReviewerDomainCount = normalized.domainCoverage.filter(
    (entry) => entry.candidateIds.some((candidateId) => completeCandidateIds.has(candidateId)),
  ).length;
  const structurallyReady = normalized.reviewCanStart;
  const isSynthetic = normalized.recordKind === SYNTHETIC_RECORD_KIND;
  const core = immutable({
    schemaVersion: RESULT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    assignmentId: normalized.assignmentId,
    recordKind: normalized.recordKind,
    disposition: structurallyReady
      ? (isSynthetic
        ? "SYNTHETIC_STRUCTURALLY_COMPLETE_ASSIGNMENT_FIXTURE_ONLY"
        : "STRUCTURALLY_COMPLETE_ASSIGNMENT_CANDIDATE")
      : "ASSIGNMENT_INCOMPLETE",
    reviewerCount: normalized.reviewers.length,
    requiredReviewerDomainCount: REVIEW_DOMAINS.length,
    coveredReviewerDomainCount,
    completeReviewerCount: completeCandidateIds.size,
    incompleteReviewerCount: normalized.reviewers.length - completeCandidateIds.size,
    structurallyReady,
    reviewerAssignmentReadyCandidate: structurallyReady && !isSynthetic,
    syntheticWouldBeAssignmentReadyCandidate: structurallyReady && isSynthetic,
    reviewersAssignedReturned: false,
    reviewCanStartReturned: false,
    blockers: [
      ...(structurallyReady ? [] : ["ASSIGNMENT_STRUCTURE_INCOMPLETE"]),
      ...(isSynthetic ? ["SYNTHETIC_FIXTURE_NOT_REAL_WORLD_EVIDENCE"] : []),
      "INPUT_AUTHORITY_CALLER_ASSERTED_NOT_VERIFIED",
      "IDENTITY_COMPETENCE_INDEPENDENCE_CALLER_ASSERTED_NOT_VERIFIED",
      "CONTACT_AUTHORIZATION_CALLER_ASSERTED_NOT_VERIFIED",
      "FORMAL_ASSIGNMENT_NOT_CREATED",
      "CROSS_ROLE_REVIEW_NOT_STARTED",
      "OWNER_SCOPE_AND_IMPLEMENTATION_GATES_UNCHANGED",
    ],
    inputFingerprint: fingerprint(normalized),
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateMvpIncrementScopeReviewerAssignmentResult(result, input) {
  assertDataTree(result, "result");
  const expected = evaluateMvpIncrementScopeReviewerAssignment(input);
  if (!isDeepStrictEqual(result, expected)) fail("assignment result or fingerprint was changed");
  return expected;
}

export {
  BOUNDARY,
  BOUNDARY_SCHEMA_VERSION,
  CONFLICT_STATES,
  CONTRACT_ID,
  FORMAL_RECORD_KIND,
  INPUT_SCHEMA_VERSION,
  INTAKE_PACKET_ID,
  RESULT_SCHEMA_VERSION,
  REVIEW_DOMAINS,
  REVIEW_PACKET_IDENTITY,
  SIGNATURE_METHODS,
  SYNTHETIC_RECORD_KIND,
  VERIFICATION_STATES,
  computeAssignmentContentSha256,
  evaluateMvpIncrementScopeReviewerAssignment,
  normalizeMvpIncrementScopeReviewerAssignment,
  validateMvpIncrementScopeReviewerAssignmentResult,
};
