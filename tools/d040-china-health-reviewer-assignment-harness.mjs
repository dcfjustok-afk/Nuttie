import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const CONTRACT_ID = "D040-CHINA-HEALTH-REVIEWER-ASSIGNMENT-CONTRACT-001";
const INPUT_SCHEMA_VERSION = "D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_INPUT_V1";
const RESULT_SCHEMA_VERSION = "D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_RESULT_V1";
const BOUNDARY_SCHEMA_VERSION = "D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT_BOUNDARY_V1";
const INTAKE_PACKET_ID = "D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001";
const FORMAL_RECORD_KIND = "FORMAL_ASSIGNMENT_RECORD";
const SYNTHETIC_RECORD_KIND = "SYNTHETIC_CONTRACT_FIXTURE";

const COMPETENCE_SCOPES = Object.freeze([
  "ADULT_WEIGHT_ENERGY_AND_STOP_RULES",
  "CHRONIC_MEDICATION_AND_EATING_DISORDER_BOUNDARIES",
  "MODEL_NUMERIC_HEALTH_SEMANTICS",
  "CHINA_MACRONUTRIENT_REFERENCE_AND_NON_PRESCRIPTION",
  "ZH_HANS_CN_SUPPORT_COPY_AND_EMERGENCY_RESOURCE_CONTEXT",
]);

const SIGNATURE_METHODS = Object.freeze([
  "SIGNED_DOCUMENT_REFERENCE",
  "VERIFIED_WORKFLOW_REFERENCE",
  "WET_SIGNATURE_REFERENCE",
]);

const VERIFICATION_STATES = Object.freeze(["VERIFIED", "REJECTED", "PENDING"]);
const QUALIFICATION_VERIFICATION_STATES = Object.freeze([
  "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF",
  "REJECTED",
  "NOT_VERIFIED",
]);
const LOCALE_FIT_STATES = Object.freeze(["PASS", "FAIL", "NOT_VERIFIED"]);
const CONFLICT_STATES = Object.freeze(["NONE_DECLARED", "RESOLVED", "OPEN"]);

const REVIEW_PACKET_IDENTITY = Object.freeze({
  packetId: "D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001",
  packetVersion: "PACKET-001-R1",
  packetEventId: "EVT-20260820-008",
  inputCommit: "5c32cfb2083bbe904c458b68d92a97e1f8479ce5",
  packetArtifactCommit: "0fd261ebf886a6d4c71042655ec1e28c9ba85bb0",
  packetArtifactBlobOid: "89f66cb38da0cd2865a343ac471e1cbe63de92c8",
  packetArtifactSha256: "7e48fa29be626429b63c31492d37b710f8f873d5f079aeb5c70dee918bf5f110",
});

const BOUNDARY = immutable({
  schemaVersion: BOUNDARY_SCHEMA_VERSION,
  contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
  harnessReadsCallerSuppliedDataOnly: true,
  inputAuthorityVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  identityVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  qualificationVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  competenceVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  localeAndRegionFitVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  independenceVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  contactAuthorizationVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  formalAssignmentCandidateCanBeReturned: true,
  reviewerCandidateCount: 0,
  reviewerAssignmentRecordCount: 0,
  controlledContactRecordCount: 0,
  formalHealthReviewRecordCount: 0,
  reviewerAttestationRecordCount: 0,
  syntheticFixturePersistedCount: 0,
  identityDocumentReads: 0,
  qualificationRegistryReads: 0,
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
  externalContactAuthorized: false,
  reviewerAssigned: false,
  reviewerIdentityVerified: false,
  reviewerQualificationVerified: false,
  reviewerCompetenceVerified: false,
  reviewerLocaleFitVerified: false,
  reviewerIndependenceVerified: false,
  reviewerSignatureVerified: false,
  conflictOfInterestResolved: false,
  healthReviewStarted: false,
  healthReviewStillRequired: true,
  healthContentApproved: false,
  contentQaPassed: false,
  d068OwnerReady: false,
  d069OwnerReady: false,
  d063OwnerReady: false,
  firstThreeBatchesIndependentReviewPassed: false,
  ownerIntakeChanged: false,
  ownerCardsScheduled: false,
  px1Authorized: false,
  px2Authorized: false,
  ownerReviewAuthorized: false,
  ownerChoiceRecorded: false,
  decisionAcceptedRecorded: false,
  healthCopyImplementationAuthorized: false,
  formulaImplementationAuthorized: false,
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
  "reviewerCandidates",
  "selectedCandidateId",
  "requiredScopeCoverage",
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

const CANDIDATE_KEYS = Object.freeze([
  "candidateId",
  "reviewerName",
  "controlledContactRef",
  "qualificationType",
  "qualificationIssuer",
  "qualificationReference",
  "competenceScopeIds",
  "competenceVerificationByScope",
  "participatedInDrafting",
  "draftingArtifactRefs",
  "identityVerification",
  "qualificationVerification",
  "localeAndRegionFit",
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

function fail(message, code = "INVALID_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT", details = {}) {
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
    fail("input contains a prohibited sensitive field", "UNSAFE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT", { field });
  }
}

function assertSafeString(value, field) {
  if (containsSensitiveLookingValue(value)) {
    fail("input contains prohibited sensitive-looking material", "UNSAFE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT", { field });
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

function canonicalPersonName(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[._/-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function isSamePersonName(left, right) {
  return canonicalPersonName(left) === canonicalPersonName(right);
}

function assertPersonName(value, field, recordKind) {
  const name = normalizeString(value, field, 100);
  if (!/[\p{L}]/u.test(name)) fail(`${field} must contain a person name`, undefined, { field });
  const lower = canonicalPersonName(name);
  const roleOnly = new Set([
    "pm", "qa", "owner", "codex", "ai", "agent", "project manager", "product manager",
    "project content owner", "health reviewer", "doctor", "physician", "nutritionist",
    "医生", "医师", "营养师", "健康评审人", "项目经理", "产品经理", "内容负责人",
    ...COMPETENCE_SCOPES.map((scope) => scope.toLowerCase().replaceAll("_", " ")),
  ]);
  const compact = lower.replace(/[^\p{L}\p{N}]+/gu, "");
  const compactRoles = new Set([...roleOnly].map((role) => role.replace(/[^\p{L}\p{N}]+/gu, "")));
  if (roleOnly.has(lower) || compactRoles.has(compact)) {
    fail(`${field} cannot be a role or agent name`, undefined, { field });
  }
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
  if (isSamePersonName(verifiedByName, reviewerName)) fail(`${field} cannot be self-verified`, undefined, { field });
  return immutable({
    state: value.state,
    verifiedByName,
    verificationRef: normalizeReference(value.verificationRef, `${field}.verificationRef`, recordKind),
    verifiedAt: normalizeTimestamp(value.verifiedAt, `${field}.verifiedAt`),
  });
}

function normalizeQualificationVerification(value, field, reviewerName, recordKind) {
  assertExactKeys(
    value,
    ["state", "verifiedByName", "verificationRef", "verifiedAt", "qualificationObservedValidAt"],
    field,
  );
  if (!QUALIFICATION_VERIFICATION_STATES.includes(value.state)) {
    fail(`${field}.state is unsupported`, undefined, { field: `${field}.state` });
  }
  if (value.state === "NOT_VERIFIED") {
    if (
      value.verifiedByName !== null ||
      value.verificationRef !== null ||
      value.verifiedAt !== null ||
      value.qualificationObservedValidAt !== null
    ) {
      fail(`${field} NOT_VERIFIED metadata must be null`, undefined, { field });
    }
    return immutable({
      state: value.state,
      verifiedByName: null,
      verificationRef: null,
      verifiedAt: null,
      qualificationObservedValidAt: null,
    });
  }
  const verifiedByName = assertPersonName(value.verifiedByName, `${field}.verifiedByName`, recordKind);
  if (isSamePersonName(verifiedByName, reviewerName)) fail(`${field} cannot be self-verified`, undefined, { field });
  const qualificationObservedValidAt = value.state === "REJECTED"
    ? normalizeTimestamp(value.qualificationObservedValidAt, `${field}.qualificationObservedValidAt`, { nullable: true })
    : normalizeTimestamp(value.qualificationObservedValidAt, `${field}.qualificationObservedValidAt`);
  if (value.state === "REJECTED" && qualificationObservedValidAt !== null) {
    fail(`${field} REJECTED observation must be null`, undefined, { field });
  }
  return immutable({
    state: value.state,
    verifiedByName,
    verificationRef: normalizeReference(value.verificationRef, `${field}.verificationRef`, recordKind),
    verifiedAt: normalizeTimestamp(value.verifiedAt, `${field}.verifiedAt`),
    qualificationObservedValidAt,
  });
}

function normalizeLocaleAndRegionFit(value, field, reviewerName, recordKind) {
  assertExactKeys(value, ["state", "rationaleRef", "verifiedByName", "verificationRef", "verifiedAt"], field);
  if (!LOCALE_FIT_STATES.includes(value.state)) {
    fail(`${field}.state is unsupported`, undefined, { field: `${field}.state` });
  }
  const rationaleRef = normalizeReference(value.rationaleRef, `${field}.rationaleRef`, recordKind);
  if (value.state === "NOT_VERIFIED") {
    if (value.verifiedByName !== null || value.verificationRef !== null || value.verifiedAt !== null) {
      fail(`${field} NOT_VERIFIED metadata must be null`, undefined, { field });
    }
    return immutable({
      state: value.state,
      rationaleRef,
      verifiedByName: null,
      verificationRef: null,
      verifiedAt: null,
    });
  }
  const verifiedByName = assertPersonName(value.verifiedByName, `${field}.verifiedByName`, recordKind);
  if (isSamePersonName(verifiedByName, reviewerName)) fail(`${field} cannot be self-verified`, undefined, { field });
  return immutable({
    state: value.state,
    rationaleRef,
    verifiedByName,
    verificationRef: normalizeReference(value.verificationRef, `${field}.verificationRef`, recordKind),
    verifiedAt: normalizeTimestamp(value.verifiedAt, `${field}.verifiedAt`),
  });
}

function normalizeCandidate(value, index, recordKind) {
  const field = `reviewerCandidates[${index}]`;
  assertExactKeys(value, CANDIDATE_KEYS, field);
  const candidatePattern = recordKind === SYNTHETIC_RECORD_KIND
    ? /^D040-CHINA-HEALTH-SYNTHETIC-C\d{3}$/
    : /^D040-CHINA-HEALTH-REVIEWER-C\d{3}$/;
  const candidateId = normalizeString(value.candidateId, `${field}.candidateId`, 64);
  if (!candidatePattern.test(candidateId)) fail(`${field}.candidateId has the wrong record-kind prefix`, undefined, { field: `${field}.candidateId` });
  const reviewerName = assertPersonName(value.reviewerName, `${field}.reviewerName`, recordKind);
  const controlledContactRef = normalizeReference(
    value.controlledContactRef,
    `${field}.controlledContactRef`,
    recordKind,
    { nullable: true },
  );
  const qualificationType = normalizeString(value.qualificationType, `${field}.qualificationType`, 256);
  const qualificationIssuer = normalizeString(value.qualificationIssuer, `${field}.qualificationIssuer`, 256);
  const qualificationReference = normalizeReference(
    value.qualificationReference,
    `${field}.qualificationReference`,
    recordKind,
  );

  if (
    !Array.isArray(value.competenceScopeIds) ||
    value.competenceScopeIds.length === 0 ||
    value.competenceScopeIds.length > COMPETENCE_SCOPES.length
  ) {
    fail(`${field}.competenceScopeIds must contain one to five scopes`, undefined, { field: `${field}.competenceScopeIds` });
  }
  const competenceScopeIds = value.competenceScopeIds.map((scope, scopeIndex) => {
    if (!COMPETENCE_SCOPES.includes(scope)) fail(`${field}.competenceScopeIds[${scopeIndex}] is unsupported`, undefined, { field: `${field}.competenceScopeIds[${scopeIndex}]` });
    return scope;
  });
  if (new Set(competenceScopeIds).size !== competenceScopeIds.length) {
    fail(`${field}.competenceScopeIds contains duplicates`, undefined, { field: `${field}.competenceScopeIds` });
  }
  const sortedScopes = [...competenceScopeIds].sort((left, right) => COMPETENCE_SCOPES.indexOf(left) - COMPETENCE_SCOPES.indexOf(right));
  if (!isDeepStrictEqual(competenceScopeIds, sortedScopes)) {
    fail(`${field}.competenceScopeIds must use fixed scope order`, undefined, { field: `${field}.competenceScopeIds` });
  }

  if (!Array.isArray(value.competenceVerificationByScope) || value.competenceVerificationByScope.length !== competenceScopeIds.length) {
    fail(`${field}.competenceVerificationByScope must match declared scopes`, undefined, { field: `${field}.competenceVerificationByScope` });
  }
  const competenceVerificationByScope = value.competenceVerificationByScope.map((entry, domainIndex) => {
    const entryField = `${field}.competenceVerificationByScope[${domainIndex}]`;
    assertExactKeys(
      entry,
      ["competenceScopeId", "evidenceRefs", "state", "verifiedByName", "verificationRef", "verifiedAt"],
      entryField,
    );
    if (entry.competenceScopeId !== competenceScopeIds[domainIndex]) {
      fail(`${entryField}.competenceScopeId must match declared scope order`, undefined, { field: `${entryField}.competenceScopeId` });
    }
    if (!VERIFICATION_STATES.includes(entry.state)) {
      fail(`${entryField}.state is unsupported`, undefined, { field: `${entryField}.state` });
    }
    if (entry.state === "PENDING") {
      const evidenceRefs = normalizeReferences(entry.evidenceRefs, `${entryField}.evidenceRefs`, recordKind, { allowEmpty: true });
      if (evidenceRefs.length !== 0 || entry.verifiedByName !== null || entry.verificationRef !== null || entry.verifiedAt !== null) {
        fail(`${entryField} PENDING metadata must be empty or null`, undefined, { field: entryField });
      }
      return immutable({
        competenceScopeId: entry.competenceScopeId,
        evidenceRefs,
        state: entry.state,
        verifiedByName: null,
        verificationRef: null,
        verifiedAt: null,
      });
    }
    const verifiedByName = assertPersonName(entry.verifiedByName, `${entryField}.verifiedByName`, recordKind);
    if (isSamePersonName(verifiedByName, reviewerName)) fail(`${entryField} cannot be self-verified`, undefined, { field: entryField });
    return immutable({
      competenceScopeId: entry.competenceScopeId,
      evidenceRefs: normalizeReferences(entry.evidenceRefs, `${entryField}.evidenceRefs`, recordKind),
      state: entry.state,
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
  const qualificationVerification = normalizeQualificationVerification(
    value.qualificationVerification,
    `${field}.qualificationVerification`,
    reviewerName,
    recordKind,
  );
  const localeAndRegionFit = normalizeLocaleAndRegionFit(
    value.localeAndRegionFit,
    `${field}.localeAndRegionFit`,
    reviewerName,
    recordKind,
  );
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
    qualificationType,
    qualificationIssuer,
    qualificationReference,
    competenceScopeIds,
    competenceVerificationByScope,
    participatedInDrafting: value.participatedInDrafting,
    draftingArtifactRefs,
    identityVerification,
    qualificationVerification,
    localeAndRegionFit,
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
  if (candidate.qualificationVerification.state !== "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF") return false;
  if (candidate.localeAndRegionFit.state !== "PASS") return false;
  if (!isDeepStrictEqual(candidate.competenceScopeIds, COMPETENCE_SCOPES)) return false;
  if (!candidate.competenceVerificationByScope.every((entry) => entry.state === "VERIFIED")) return false;
  if (!new Set(["NONE_DECLARED", "RESOLVED"]).has(candidate.conflictOfInterest.state)) return false;
  if (
    candidate.controlledContactRef === null ||
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
  const verificationTimes = [
    candidate.identityVerification.verifiedAt,
    candidate.qualificationVerification.verifiedAt,
    candidate.qualificationVerification.qualificationObservedValidAt,
    candidate.localeAndRegionFit.verifiedAt,
    ...candidate.competenceVerificationByScope.map((entry) => entry.verifiedAt),
  ].map((value) => Date.parse(value));
  return (
    packetAcceptedAt <= assignmentAcceptedAt &&
    assignmentAcceptedAt <= assignedAtValue &&
    verificationTimes.every((value) => value <= assignedAtValue) &&
    assignedAtValue < dueAt &&
    dueAt - assignedAtValue <= 90 * 24 * 60 * 60 * 1_000
  );
}

function normalizeD040ChinaHealthReviewerAssignment(input) {
  assertDataTree(input, "input");
  assertExactKeys(input, TOP_LEVEL_KEYS, "input");
  if (input.schemaVersion !== INPUT_SCHEMA_VERSION) fail("unsupported schemaVersion", undefined, { field: "schemaVersion" });
  if (![FORMAL_RECORD_KIND, SYNTHETIC_RECORD_KIND].includes(input.recordKind)) fail("unsupported recordKind", undefined, { field: "recordKind" });
  const assignmentPattern = input.recordKind === SYNTHETIC_RECORD_KIND
    ? /^D040-CHINA-HEALTH-SYNTHETIC-A\d{3}$/
    : /^D040-CHINA-HEALTH-ASSIGNMENT-A\d{3}$/;
  const assignmentId = normalizeString(input.assignmentId, "assignmentId", 64);
  if (!assignmentPattern.test(assignmentId)) fail("assignmentId has the wrong record-kind prefix", undefined, { field: "assignmentId" });
  if (input.intakePacketId !== INTAKE_PACKET_ID) fail("intakePacketId is unsupported", undefined, { field: "intakePacketId" });
  assertExactKeys(input.reviewPacketIdentity, Object.keys(REVIEW_PACKET_IDENTITY), "reviewPacketIdentity");
  if (!isDeepStrictEqual(input.reviewPacketIdentity, REVIEW_PACKET_IDENTITY)) {
    fail("reviewPacketIdentity does not match the frozen packet", undefined, { field: "reviewPacketIdentity" });
  }
  if (!Array.isArray(input.reviewerCandidates) || input.reviewerCandidates.length === 0 || input.reviewerCandidates.length > 20) {
    fail("reviewerCandidates must contain one to twenty candidates", undefined, { field: "reviewerCandidates" });
  }
  const reviewerCandidates = input.reviewerCandidates.map((reviewer, index) => normalizeCandidate(reviewer, index, input.recordKind));
  if (new Set(reviewerCandidates.map((reviewer) => reviewer.candidateId)).size !== reviewerCandidates.length) {
    fail("reviewerCandidates contain duplicate candidate IDs", undefined, { field: "reviewerCandidates" });
  }
  if (new Set(reviewerCandidates.map((reviewer) => canonicalPersonName(reviewer.reviewerName))).size !== reviewerCandidates.length) {
    fail("reviewerCandidates contain duplicate names", undefined, { field: "reviewerCandidates" });
  }
  const contactRefs = reviewerCandidates
    .map((reviewer) => reviewer.controlledContactRef)
    .filter((reference) => reference !== null);
  if (new Set(contactRefs).size !== contactRefs.length) {
    fail("reviewerCandidates contain duplicate contact references", undefined, { field: "reviewerCandidates" });
  }

  const selectedCandidateId = input.selectedCandidateId === null
    ? null
    : normalizeString(input.selectedCandidateId, "selectedCandidateId", 64);
  if (selectedCandidateId !== null && !reviewerCandidates.some((candidate) => candidate.candidateId === selectedCandidateId)) {
    fail("selectedCandidateId must reference an existing candidate", undefined, { field: "selectedCandidateId" });
  }

  if (!Array.isArray(input.requiredScopeCoverage) || input.requiredScopeCoverage.length !== COMPETENCE_SCOPES.length) {
    fail("requiredScopeCoverage must contain exactly five scopes", undefined, { field: "requiredScopeCoverage" });
  }
  const requiredScopeCoverage = input.requiredScopeCoverage.map((entry, index) => {
    const field = `requiredScopeCoverage[${index}]`;
    assertExactKeys(entry, ["competenceScopeId", "candidateIds"], field);
    if (entry.competenceScopeId !== COMPETENCE_SCOPES[index]) fail(`${field}.competenceScopeId must use fixed order`, undefined, { field: `${field}.competenceScopeId` });
    if (!Array.isArray(entry.candidateIds) || entry.candidateIds.length > 20) {
      fail(`${field}.candidateIds must be an array`, undefined, { field: `${field}.candidateIds` });
    }
    const expectedIds = reviewerCandidates
      .filter((reviewer) => reviewer.competenceVerificationByScope.some(
        (verification) => verification.competenceScopeId === entry.competenceScopeId && verification.state === "VERIFIED",
      ))
      .map((reviewer) => reviewer.candidateId);
    if (!isDeepStrictEqual(entry.candidateIds, expectedIds)) {
      fail(`${field}.candidateIds must exactly match verified candidate scopes`, undefined, { field: `${field}.candidateIds` });
    }
    return immutable({ competenceScopeId: entry.competenceScopeId, candidateIds: [...entry.candidateIds] });
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
  const selectedCandidate = reviewerCandidates.find(
    (candidate) => candidate.candidateId === selectedCandidateId,
  ) ?? null;
  if (
    selectedCandidate !== null &&
    isSamePersonName(selectedCandidate.reviewerName, assignedByName)
  ) {
    fail("selected health reviewer cannot self-assign", undefined, { field: "assignedByName" });
  }
  const assignedAt = normalizeTimestamp(input.assignedAt, "assignedAt");
  const assignmentEvidenceRefs = normalizeReferences(
    input.assignmentEvidenceRefs,
    "assignmentEvidenceRefs",
    input.recordKind,
    { allowEmpty: true },
  );
  if (typeof input.reviewCanStart !== "boolean") fail("reviewCanStart must be boolean", undefined, { field: "reviewCanStart" });
  for (const flag of ["containsCredential", "containsIdentityDocument", "containsPrivateContact", "containsSignatureMaterial"]) {
    if (input[flag] !== false) fail(`${flag} must be false`, "UNSAFE_D040_CHINA_HEALTH_REVIEWER_ASSIGNMENT", { field: flag });
  }
  if (!/^[a-f0-9]{64}$/.test(input.assignmentContentSha256)) {
    fail("assignmentContentSha256 must be lowercase SHA-256", undefined, { field: "assignmentContentSha256" });
  }
  if (input.assignmentContentSha256 !== computeAssignmentContentSha256(input)) {
    fail("assignmentContentSha256 does not match the canonical bundle", undefined, { field: "assignmentContentSha256" });
  }

  const completeCandidateIds = new Set(
    reviewerCandidates.filter((reviewer) => isCompleteCandidate(reviewer, assignedAt)).map((reviewer) => reviewer.candidateId),
  );
  const selectedCandidateStructurallyReady =
    selectedCandidateId !== null && completeCandidateIds.has(selectedCandidateId);
  const coveredRequiredScopeCount = requiredScopeCoverage.filter(
    (entry) => selectedCandidateStructurallyReady && entry.candidateIds.includes(selectedCandidateId),
  ).length;
  const structurallyReady =
    selectedCandidateStructurallyReady &&
    coveredRequiredScopeCount === COMPETENCE_SCOPES.length &&
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
    reviewerCandidates,
    selectedCandidateId,
    requiredScopeCoverage,
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

function evaluateD040ChinaHealthReviewerAssignment(input) {
  const normalized = normalizeD040ChinaHealthReviewerAssignment(input);
  const completeCandidateIds = new Set(
    normalized.reviewerCandidates
      .filter((reviewer) => isCompleteCandidate(reviewer, normalized.assignedAt))
      .map((reviewer) => reviewer.candidateId),
  );
  const selectedCandidateStructurallyReady =
    normalized.selectedCandidateId !== null && completeCandidateIds.has(normalized.selectedCandidateId);
  const coveredRequiredScopeCount = normalized.requiredScopeCoverage.filter(
    (entry) => selectedCandidateStructurallyReady && entry.candidateIds.includes(normalized.selectedCandidateId),
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
        : "STRUCTURALLY_COMPLETE_HEALTH_REVIEWER_ASSIGNMENT_CANDIDATE")
      : "ASSIGNMENT_INCOMPLETE",
    reviewerCandidateCount: normalized.reviewerCandidates.length,
    selectedCandidateId: normalized.selectedCandidateId,
    requiredCompetenceScopeCount: COMPETENCE_SCOPES.length,
    coveredRequiredScopeCount,
    completeReviewerCount: completeCandidateIds.size,
    incompleteReviewerCount: normalized.reviewerCandidates.length - completeCandidateIds.size,
    selectedCandidateStructurallyReady,
    structurallyReady,
    healthReviewerAssignmentReadyCandidate: structurallyReady && !isSynthetic,
    syntheticWouldBeAssignmentReadyCandidate: structurallyReady && isSynthetic,
    reviewerAssignedReturned: false,
    reviewCanStartReturned: false,
    blockers: [
      ...(structurallyReady ? [] : ["ASSIGNMENT_STRUCTURE_INCOMPLETE"]),
      ...(isSynthetic ? ["SYNTHETIC_FIXTURE_NOT_REAL_WORLD_EVIDENCE"] : []),
      "INPUT_AUTHORITY_CALLER_ASSERTED_NOT_VERIFIED",
      "IDENTITY_QUALIFICATION_COMPETENCE_LOCALE_INDEPENDENCE_CALLER_ASSERTED_NOT_VERIFIED",
      "CONTACT_AUTHORIZATION_CALLER_ASSERTED_NOT_VERIFIED",
      "FORMAL_ASSIGNMENT_NOT_CREATED",
      "HEALTH_REVIEW_NOT_STARTED",
      "D040_CHINA_HEALTH_OWNER_PX_AND_IMPLEMENTATION_GATES_UNCHANGED",
    ],
    inputFingerprint: fingerprint(normalized),
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateD040ChinaHealthReviewerAssignmentResult(result, input) {
  assertDataTree(result, "result");
  const expected = evaluateD040ChinaHealthReviewerAssignment(input);
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
  LOCALE_FIT_STATES,
  QUALIFICATION_VERIFICATION_STATES,
  RESULT_SCHEMA_VERSION,
  COMPETENCE_SCOPES,
  REVIEW_PACKET_IDENTITY,
  SIGNATURE_METHODS,
  SYNTHETIC_RECORD_KIND,
  VERIFICATION_STATES,
  computeAssignmentContentSha256,
  evaluateD040ChinaHealthReviewerAssignment,
  normalizeD040ChinaHealthReviewerAssignment,
  validateD040ChinaHealthReviewerAssignmentResult,
};
