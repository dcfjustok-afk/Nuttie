import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const INPUT_SCHEMA_VERSION = "D040_NON_DIAGNOSTIC_BOUNDARY_INDEPENDENT_REVIEW_BUNDLE_INPUT_V1";
const RESULT_SCHEMA_VERSION = "D040_NON_DIAGNOSTIC_BOUNDARY_INDEPENDENT_REVIEW_RESULT_V1";
const BOUNDARY_SCHEMA_VERSION = "D040_NON_DIAGNOSTIC_BOUNDARY_INDEPENDENT_REVIEW_BOUNDARY_V1";
const CONTRACT_ID = "D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-RECORD-CONTRACT-001";

const RECORD_KINDS = Object.freeze(["FORMAL_REVIEW_RECORD", "SYNTHETIC_CONTRACT_FIXTURE"]);
const REVIEW_DOMAINS = Object.freeze([
  "PRODUCT_DECISION_QUALITY",
  "HEALTH_SAFETY",
  "PRIVACY_DATA_INTEGRITY",
  "QA_ACCESSIBILITY",
]);
const CARD_DISPOSITION_IDS = Object.freeze([
  "APPROVE_SPEC_CANDIDATE",
  "CHANGES_REQUIRED",
  "REJECT_SPEC",
  "NOT_REVIEWED",
]);
const INVARIANT_RESULT_IDS = Object.freeze(["PASS", "FAIL", "NOT_VERIFIED"]);
const SEVERITY_IDS = Object.freeze(["P0", "P1", "P2", "P3"]);
const OVERALL_DISPOSITION_IDS = Object.freeze([
  "INDEPENDENT_REVIEW_PASS_CANDIDATE",
  "REJECTED",
  "CHANGES_REQUIRED",
  "INCOMPLETE",
]);
const SIGNATURE_METHOD_IDS = Object.freeze([
  "SIGNED_DOCUMENT_REFERENCE",
  "VERIFIED_WORKFLOW_REFERENCE",
  "WET_SIGNATURE_REFERENCE",
  "NOT_SIGNED",
]);
const IDENTITY_STATE_IDS = Object.freeze([
  "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF",
  "NOT_VERIFIED",
]);
const CONFLICT_STATE_IDS = Object.freeze([
  "NONE_DECLARED",
  "RESOLVED",
  "DISCLOSED_UNRESOLVED",
  "NOT_DISCLOSED",
]);

const PACKET_IDENTITY = Object.freeze({
  packetId: "D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001",
  packetVersion: "PACKET-001-R1",
  packetEventId: "EVT-20260827-007",
  cardSpecEventId: "EVT-20260827-005",
  cardHarnessEventId: "EVT-20260827-006",
  packetArtifactBlobOid: "a9538a5caebe205a30be970ea0818bb536a0c3fd",
  packetArtifactSha256: "b5a271797575b72c0e14208394145ea5e16527e9c0eeec7724ae8f20776c7c69",
});

const REVIEWED_ARTIFACTS = Object.freeze([
  Object.freeze({ order: 1, path: "docs/03-design/d040-non-diagnostic-boundary-card-spec.md", gitBlobOid: "f217f13f37715a7f37178e0bb295e19c8f2332d9", sha256: "cb7334f47ccd11cf14639f2addc33cf9d19cbdaff36227e6d738ba88e4189a2d" }),
  Object.freeze({ order: 2, path: "docs/03-design/d040-china-support-health-review-input.md", gitBlobOid: "5e6a1484a214e336ba91416015c7daece765dc24", sha256: "c20b58b7af4ffdc08e05c306b122d17b51429e2e879b8bf5e96dd22b43e753af" }),
  Object.freeze({ order: 3, path: "docs/03-design/d040-china-health-reviewer-intake-packet.md", gitBlobOid: "89f66cb38da0cd2865a343ac471e1cbe63de92c8", sha256: "ab466430768643052553fa1bf4b001503c618c5a1362f185b7f3146942606d38" }),
  Object.freeze({ order: 4, path: "docs/03-design/d040-question-allocation.md", gitBlobOid: "c412d5f4168ae9828870fc6b79372541aa2f0840", sha256: "299cd01148cf4372e88bb55efe47d12b93419d192f5be1c7f8c487190d2295e7" }),
  Object.freeze({ order: 5, path: "docs/03-design/d040-energy-model-batch-card-spec.md", gitBlobOid: "46f3a6b353ebfa9c2ab73f76b291873dbd9f6569", sha256: "6cdbf2db6219804d004d4b65ea1c09c093150d6fe8eb22027245de97501b569d" }),
  Object.freeze({ order: 6, path: "docs/03-design/d040-macro-target-source-card-spec.md", gitBlobOid: "0de4da351719d51fdeb1756564652835672a6966", sha256: "2dc30267c77a27e80003e661906c0ee1e166d4fad24d4201ade55a92d2156e47" }),
  Object.freeze({ order: 7, path: "docs/03-design/d040-custom-macro-input-shape-card-spec.md", gitBlobOid: "80536636d14494d54bfb199464d4b3ab03518a8e", sha256: "db34dfb40b27856692aca666be2efd3fa47625135c2958b055cb92810279a8c9" }),
  Object.freeze({ order: 8, path: "docs/04-engineering/testing/d040-non-diagnostic-boundary-card-harness.md", gitBlobOid: "7263d2f151ce9e7ddc5aedce3127153264866b06", sha256: "0a9e0ddda5f05b1f5d1a3f6184ce121f92c7b88617867ef01e718259f5bead7f" }),
]);

const CARD_IDENTITIES = Object.freeze([
  Object.freeze({ decisionId: "D-068", questionId: "d068_non_diagnostic_health_context" }),
  Object.freeze({ decisionId: "D-069", questionId: "d069_estimate_uncertainty_copy" }),
]);
const INVARIANT_IDS = Object.freeze(Array.from({ length: 10 }, (_, index) => `D040-NDB-XCI-${String(index + 1).padStart(3, "0")}`));

const BOUNDARY = deepFreeze({
  schemaVersion: BOUNDARY_SCHEMA_VERSION,
  contractStatus: "SPIKE_LOCAL_ONLY_NON_PRODUCTION",
  gitReads: 0,
  fileReads: 0,
  fileWrites: 0,
  signatureArtifactReads: 0,
  identityDocumentReads: 0,
  competenceEvidenceReads: 0,
  networkRequests: 0,
  providerRequests: 0,
  externalMessagesSent: 0,
  businessWrites: 0,
  formalReviewRecordsCreated: 0,
  reviewerAttestationRecordsCreated: 0,
  reviewersAssigned: false,
  reviewerIdentityVerified: false,
  reviewerIndependenceVerified: false,
  reviewerCompetenceVerified: false,
  reviewerSignatureVerified: false,
  independentReviewStarted: false,
  nonDiagnosticBoundaryIndependentReviewPassed: false,
  healthReviewStillRequired: true,
  healthReviewerAssigned: false,
  healthContentApproved: false,
  contentQaPassed: false,
  d063Accepted: false,
  d070Accepted: false,
  d068OwnerReady: false,
  d069OwnerReady: false,
  diagnosisOrTreatmentAuthorized: false,
  medicationDetailCollectionAuthorized: false,
  healthFreeTextCollectionAuthorized: false,
  healthDataPersistenceAuthorized: false,
  automaticDialAuthorized: false,
  networkResourceRefreshAuthorized: false,
  locationReadAuthorized: false,
  contactsReadAuthorized: false,
  healthKitWriteAuthorized: false,
  ownerIntakeChanged: false,
  ownerCardScheduled: false,
  px1Authorized: false,
  px2Authorized: false,
  ownerReviewAuthorized: false,
  ownerChoiceRecorded: false,
  decisionAcceptedRecorded: false,
  goalImplementationAuthorized: false,
  recordingImplementationAuthorized: false,
  persistenceImplementationAuthorized: false,
  formalRootProjectAuthorized: false,
  nativeIosWorkAuthorized: false,
  formalImplementationAuthorized: false,
  gateStatesChanged: false,
});

function fail(message, code = "INVALID_D040_NON_DIAGNOSTIC_BOUNDARY_INDEPENDENT_REVIEW_RECORD", details = {}) {
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
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function assertDataTree(value, field = "input", depth = 0, ancestors = new Set(), budget = { nodes: 0 }) {
  budget.nodes += 1;
  if (budget.nodes > 32_000) fail("input exceeds node budget", undefined, { field });
  if (typeof value === "string") {
    if (value.length > 4_096) fail("input exceeds string budget", undefined, { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("input contains a non-finite number", undefined, { field });
    return;
  }
  if (value === null || typeof value === "boolean") return;
  if (typeof value !== "object") fail("input contains an unsupported value", undefined, { field });
  if (ancestors.has(value)) fail("input contains a cycle", undefined, { field });
  if (depth >= 18) fail("input exceeds depth budget", undefined, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) fail("input contains symbol properties", undefined, { field });
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (Array.isArray(value) && key === "length") continue;
    if (!descriptor.enumerable || descriptor.get || descriptor.set) {
      fail("input contains non-data properties", undefined, { field: `${field}.${key}` });
    }
  }
  if (Array.isArray(value)) {
    if (value.length > 256) fail("input exceeds array budget", undefined, { field });
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) fail("input contains a sparse array", undefined, { field: `${field}[${index}]` });
    }
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) fail("input must use plain records", undefined, { field });
  }
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) {
    assertDataTree(child, Array.isArray(value) ? `${field}[${key}]` : `${field}.${key}`, depth + 1, ancestors, budget);
  }
  ancestors.delete(value);
}

function assertExactKeys(value, expectedKeys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${field} must be a plain record`, undefined, { field });
  const expected = new Set(expectedKeys);
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) fail(`${field}.${key} is unsupported`, undefined, { field: `${field}.${key}` });
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, undefined, { field: `${field}.${key}` });
  }
}

function containsSensitiveLookingMaterial(value) {
  if (typeof value !== "string") return false;
  return [
    /\b(?:sk|rk|pk)-[A-Za-z0-9_-]{8,}\b/i,
    /\bBearer\s+[A-Za-z0-9._~+\/-]{8,}/i,
    /\b(?:api[_-]?key|access[_-]?token|password|authorization|cookie|secret)\s*[:=]\s*\S+/i,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /(?:^|\D)1[3-9]\d{9}(?:\D|$)/,
    /(?:^|\D)\d{17}[\dXx](?:\D|$)/,
    /-----BEGIN [A-Z ]+(?:PRIVATE KEY|CERTIFICATE)-----/i,
    /data:image\//i,
  ].some((pattern) => pattern.test(value));
}

function normalizeString(value, field, { maximum = 512, minimum = 1 } = {}) {
  if (typeof value !== "string") fail(`${field} must be a string`, undefined, { field });
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized)) {
    fail(`${field} has an invalid length or control character`, undefined, { field });
  }
  if (containsSensitiveLookingMaterial(normalized)) {
    fail("input contains prohibited sensitive-looking material", "UNSAFE_D040_NON_DIAGNOSTIC_BOUNDARY_INDEPENDENT_REVIEW_RECORD", { field });
  }
  return normalized;
}

function normalizeNullableString(value, field, maximum = 512) {
  return value === null ? null : normalizeString(value, field, { maximum });
}

function normalizeSha256(value, field) {
  if (typeof value !== "string") fail(`${field} must be a string`, undefined, { field });
  const normalized = value.trim();
  if (!/^[a-f0-9]{64}$/.test(normalized)) fail(`${field} must be a lowercase SHA-256`, undefined, { field });
  return normalized;
}

function normalizeOid(value, field) {
  if (typeof value !== "string") fail(`${field} must be a string`, undefined, { field });
  const normalized = value.trim();
  if (!/^[a-f0-9]{40}$/.test(normalized)) fail(`${field} must be a lowercase Git object ID`, undefined, { field });
  return normalized;
}

function normalizeReference(value, field) {
  const normalized = normalizeString(value, field, { maximum: 256 });
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{2,255}$/.test(normalized)) fail(`${field} must be a stable opaque reference`, undefined, { field });
  return normalized;
}

function isValidTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  return calendarDate.getUTCFullYear() === year && calendarDate.getUTCMonth() === month - 1 && calendarDate.getUTCDate() === day;
}

function normalizeTimestamp(value, field, nullable = false) {
  if (nullable && value === null) return null;
  const normalized = normalizeString(value, field, { maximum: 64 });
  if (!isValidTimestamp(normalized)) fail(`${field} must be an RFC 3339 timestamp with timezone`, undefined, { field });
  return normalized;
}

function normalizeBoolean(value, field) {
  if (typeof value !== "boolean") fail(`${field} must be a boolean`, undefined, { field });
  return value;
}

function normalizeEnum(value, allowed, field) {
  const normalized = normalizeString(value, field, { maximum: 128 });
  if (!allowed.includes(normalized)) fail(`${field} has an unsupported value`, undefined, { field });
  return normalized;
}

function normalizeUniqueReferences(value, field, { minimum = 0, maximum = 32 } = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) fail(`${field} has an invalid reference count`, undefined, { field });
  const normalized = value.map((item, index) => normalizeReference(item, `${field}[${index}]`));
  if (new Set(normalized).size !== normalized.length) fail(`${field} contains duplicate references`, undefined, { field });
  return normalized;
}

function normalizeUniqueEnums(value, allowed, field, { minimum = 0 } = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.length > allowed.length) fail(`${field} has an invalid item count`, undefined, { field });
  const normalized = value.map((item, index) => normalizeEnum(item, allowed, `${field}[${index}]`));
  if (new Set(normalized).size !== normalized.length) fail(`${field} contains duplicate values`, undefined, { field });
  const canonical = allowed.filter((item) => normalized.includes(item));
  if (!isDeepStrictEqual(normalized, canonical)) fail(`${field} must use canonical order`, undefined, { field });
  return normalized;
}

function normalizePacketIdentity(value) {
  assertExactKeys(value, Object.keys(PACKET_IDENTITY), "packetIdentity");
  const normalized = {
    packetId: normalizeString(value.packetId, "packetIdentity.packetId"),
    packetVersion: normalizeString(value.packetVersion, "packetIdentity.packetVersion"),
    packetEventId: normalizeString(value.packetEventId, "packetIdentity.packetEventId"),
    cardSpecEventId: normalizeString(value.cardSpecEventId, "packetIdentity.cardSpecEventId"),
    cardHarnessEventId: normalizeString(value.cardHarnessEventId, "packetIdentity.cardHarnessEventId"),
    packetArtifactBlobOid: normalizeOid(value.packetArtifactBlobOid, "packetIdentity.packetArtifactBlobOid"),
    packetArtifactSha256: normalizeSha256(value.packetArtifactSha256, "packetIdentity.packetArtifactSha256"),
  };
  if (!isDeepStrictEqual(normalized, PACKET_IDENTITY)) fail("packet identity does not match PACKET-001-R1", undefined, { field: "packetIdentity" });
  return normalized;
}

function normalizeReviewedArtifacts(value) {
  if (!Array.isArray(value) || value.length !== REVIEWED_ARTIFACTS.length) fail("reviewedArtifacts must contain exactly eight entries", undefined, { field: "reviewedArtifacts" });
  const normalized = value.map((artifact, index) => {
    const field = `reviewedArtifacts[${index}]`;
    assertExactKeys(artifact, ["order", "path", "gitBlobOid", "sha256"], field);
    if (!Number.isSafeInteger(artifact.order)) fail(`${field}.order must be an integer`, undefined, { field: `${field}.order` });
    return {
      order: artifact.order,
      path: normalizeString(artifact.path, `${field}.path`),
      gitBlobOid: normalizeOid(artifact.gitBlobOid, `${field}.gitBlobOid`),
      sha256: normalizeSha256(artifact.sha256, `${field}.sha256`),
    };
  });
  if (!isDeepStrictEqual(normalized, REVIEWED_ARTIFACTS)) fail("reviewed artifact manifest does not match PACKET-001-R1", undefined, { field: "reviewedArtifacts" });
  return normalized;
}

function normalizeFindingIds(value, field, minimum = 0) {
  if (!Array.isArray(value) || value.length < minimum || value.length > 32) fail(`${field} has an invalid finding count`, undefined, { field });
  const normalized = value.map((item, index) => {
    const findingId = normalizeString(item, `${field}[${index}]`, { maximum: 24 });
    if (!/^D040-NDB-IR-F\d{3}$/.test(findingId)) fail(`${field}[${index}] must be D040-NDB-IR-FNNN`, undefined, { field: `${field}[${index}]` });
    return findingId;
  });
  if (new Set(normalized).size !== normalized.length) fail(`${field} contains duplicate finding IDs`, undefined, { field });
  return normalized;
}

function normalizeCardDispositions(value) {
  if (!Array.isArray(value) || value.length !== CARD_IDENTITIES.length) fail("cardDispositions must contain exactly two cards", undefined, { field: "cardDispositions" });
  return value.map((card, index) => {
    const field = `cardDispositions[${index}]`;
    assertExactKeys(card, ["decisionId", "questionId", "disposition", "requiredReviewDomain", "evidenceRefs", "findingIds"], field);
    const identity = {
      decisionId: normalizeString(card.decisionId, `${field}.decisionId`),
      questionId: normalizeString(card.questionId, `${field}.questionId`),
    };
    if (!isDeepStrictEqual(identity, CARD_IDENTITIES[index])) fail(`${field} does not match the required card order`, undefined, { field });
    const disposition = normalizeEnum(card.disposition, CARD_DISPOSITION_IDS, `${field}.disposition`);
    const requiredReviewDomain = card.requiredReviewDomain === null
      ? null
      : normalizeEnum(card.requiredReviewDomain, REVIEW_DOMAINS, `${field}.requiredReviewDomain`);
    if (disposition === "NOT_REVIEWED" ? requiredReviewDomain === null : requiredReviewDomain !== null) {
      fail(`${field}.requiredReviewDomain does not match disposition`, undefined, { field: `${field}.requiredReviewDomain` });
    }
    const evidenceRefs = normalizeUniqueReferences(card.evidenceRefs, `${field}.evidenceRefs`, { minimum: 1 });
    const findingIds = normalizeFindingIds(card.findingIds, `${field}.findingIds`, disposition === "APPROVE_SPEC_CANDIDATE" ? 0 : 1);
    return { ...identity, disposition, requiredReviewDomain, evidenceRefs, findingIds };
  });
}

function normalizeInvariantResults(value) {
  if (!Array.isArray(value) || value.length !== INVARIANT_IDS.length) fail("crossAxisInvariantResults must contain exactly ten results", undefined, { field: "crossAxisInvariantResults" });
  return value.map((invariant, index) => {
    const field = `crossAxisInvariantResults[${index}]`;
    assertExactKeys(invariant, ["invariantId", "result", "evidenceRefs", "findingIds"], field);
    const invariantId = normalizeString(invariant.invariantId, `${field}.invariantId`);
    if (invariantId !== INVARIANT_IDS[index]) fail(`${field}.invariantId is out of canonical order`, undefined, { field: `${field}.invariantId` });
    const result = normalizeEnum(invariant.result, INVARIANT_RESULT_IDS, `${field}.result`);
    const evidenceRefs = normalizeUniqueReferences(invariant.evidenceRefs, `${field}.evidenceRefs`, { minimum: result === "PASS" ? 1 : 0 });
    const findingIds = normalizeFindingIds(invariant.findingIds, `${field}.findingIds`, result === "FAIL" ? 1 : 0);
    return { invariantId, result, evidenceRefs, findingIds };
  });
}

function normalizeFindings(value, reviewedAt) {
  if (!Array.isArray(value) || value.length > 256) fail("findings exceeds the finding budget", undefined, { field: "findings" });
  const normalized = value.map((finding, index) => {
    const field = `findings[${index}]`;
    assertExactKeys(finding, [
      "findingId", "severity", "reviewDomain", "decisionIds", "summary", "evidenceRefs",
      "requiredChange", "state", "closureEvidenceRefs", "accountableOwnerRef", "dueAt", "nonBlockingRationale",
    ], field);
    const findingId = normalizeFindingIds([finding.findingId], `${field}.findingId`, 1)[0];
    const severity = normalizeEnum(finding.severity, SEVERITY_IDS, `${field}.severity`);
    const reviewDomain = normalizeEnum(finding.reviewDomain, REVIEW_DOMAINS, `${field}.reviewDomain`);
    const decisionIds = normalizeUniqueEnums(finding.decisionIds, CARD_IDENTITIES.map(({ decisionId }) => decisionId), `${field}.decisionIds`, { minimum: 1 });
    const summary = normalizeString(finding.summary, `${field}.summary`, { maximum: 2_048 });
    const evidenceRefs = normalizeUniqueReferences(finding.evidenceRefs, `${field}.evidenceRefs`, { minimum: 1 });
    const requiredChange = normalizeString(finding.requiredChange, `${field}.requiredChange`, { maximum: 2_048 });
    const state = normalizeEnum(finding.state, ["OPEN", "CLOSED"], `${field}.state`);
    const closureEvidenceRefs = normalizeUniqueReferences(finding.closureEvidenceRefs, `${field}.closureEvidenceRefs`, { minimum: state === "CLOSED" ? 1 : 0 });
    if (state === "OPEN" && closureEvidenceRefs.length !== 0) fail(`${field}.closureEvidenceRefs must be empty for an open finding`, undefined, { field: `${field}.closureEvidenceRefs` });
    const accountableOwnerRef = finding.accountableOwnerRef === null ? null : normalizeReference(finding.accountableOwnerRef, `${field}.accountableOwnerRef`);
    const dueAt = normalizeTimestamp(finding.dueAt, `${field}.dueAt`, true);
    const nonBlockingRationale = normalizeNullableString(finding.nonBlockingRationale, `${field}.nonBlockingRationale`, 2_048);
    if (severity === "P3" && state === "OPEN") {
      if (accountableOwnerRef === null || dueAt === null || nonBlockingRationale === null || Date.parse(dueAt) <= Date.parse(reviewedAt)) {
        fail(`${field} open P3 requires an owner, future dueAt, and non-blocking rationale`, undefined, { field });
      }
    } else if (accountableOwnerRef !== null || dueAt !== null || nonBlockingRationale !== null) {
      fail(`${field} P3 disposition fields are only allowed for open P3`, undefined, { field });
    }
    return {
      findingId, severity, reviewDomain, decisionIds, summary, evidenceRefs, requiredChange,
      state, closureEvidenceRefs, accountableOwnerRef, dueAt, nonBlockingRationale,
    };
  });
  const ids = normalized.map(({ findingId }) => findingId);
  if (new Set(ids).size !== ids.length) fail("findings contains duplicate IDs", undefined, { field: "findings" });
  return normalized;
}

function normalizeReviewerName(value, field) {
  const normalized = normalizeString(value, field, { maximum: 80, minimum: 2 });
  const generic = new Set([
    "pm", "project manager", "owner", "reviewer", "product reviewer", "health reviewer", "qa reviewer",
    "privacy reviewer", "codex", "ai", "agent", "product decision quality", "privacy data integrity",
    "health formula evidence", "qa accessibility",
  ]);
  if (generic.has(normalized.toLowerCase())) fail(`${field} must be a named person rather than a role or agent`, undefined, { field });
  return normalized;
}

function normalizeAttestations(value, expectedContentSha256) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16) fail("reviewerAttestations must contain 1 to 16 entries", undefined, { field: "reviewerAttestations" });
  const normalized = value.map((attestation, index) => {
    const field = `reviewerAttestations[${index}]`;
    assertExactKeys(attestation, [
      "attestationId", "reviewerName", "reviewerReferenceId", "reviewDomains", "competenceEvidenceByDomain",
      "participatedInDrafting", "identityVerification", "conflictOfInterest", "reviewContentSha256", "signedAt",
      "signatureMethod", "signatureReference", "supersedesAttestationId",
    ], field);
    const attestationId = normalizeString(attestation.attestationId, `${field}.attestationId`, { maximum: 24 });
    if (!/^D040-NDB-IR-ATTEST-R\d{3}$/.test(attestationId)) fail(`${field}.attestationId must be D040-NDB-IR-ATTEST-RNNN`, undefined, { field: `${field}.attestationId` });
    const reviewerName = normalizeReviewerName(attestation.reviewerName, `${field}.reviewerName`);
    const reviewerReferenceId = normalizeReference(attestation.reviewerReferenceId, `${field}.reviewerReferenceId`);
    const reviewDomains = normalizeUniqueEnums(attestation.reviewDomains, REVIEW_DOMAINS, `${field}.reviewDomains`, { minimum: 1 });
    if (!Array.isArray(attestation.competenceEvidenceByDomain) || attestation.competenceEvidenceByDomain.length !== reviewDomains.length) {
      fail(`${field}.competenceEvidenceByDomain must exactly cover claimed domains`, undefined, { field: `${field}.competenceEvidenceByDomain` });
    }
    const competenceEvidenceByDomain = attestation.competenceEvidenceByDomain.map((entry, competenceIndex) => {
      const competenceField = `${field}.competenceEvidenceByDomain[${competenceIndex}]`;
      assertExactKeys(entry, ["reviewDomain", "evidenceRefs"], competenceField);
      const reviewDomain = normalizeEnum(entry.reviewDomain, REVIEW_DOMAINS, `${competenceField}.reviewDomain`);
      if (reviewDomain !== reviewDomains[competenceIndex]) fail(`${competenceField}.reviewDomain must match claimed domain order`, undefined, { field: `${competenceField}.reviewDomain` });
      return { reviewDomain, evidenceRefs: normalizeUniqueReferences(entry.evidenceRefs, `${competenceField}.evidenceRefs`, { minimum: 1 }) };
    });
    const participatedInDrafting = normalizeBoolean(attestation.participatedInDrafting, `${field}.participatedInDrafting`);

    assertExactKeys(attestation.identityVerification, ["state", "verifiedByName", "verificationRef", "verifiedAt"], `${field}.identityVerification`);
    const identityState = normalizeEnum(attestation.identityVerification.state, IDENTITY_STATE_IDS, `${field}.identityVerification.state`);
    const verifiedByName = attestation.identityVerification.verifiedByName === null ? null : normalizeReviewerName(attestation.identityVerification.verifiedByName, `${field}.identityVerification.verifiedByName`);
    const verificationRef = attestation.identityVerification.verificationRef === null ? null : normalizeReference(attestation.identityVerification.verificationRef, `${field}.identityVerification.verificationRef`);
    const verifiedAt = normalizeTimestamp(attestation.identityVerification.verifiedAt, `${field}.identityVerification.verifiedAt`, true);
    if (identityState === "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF") {
      if (verifiedByName === null || verificationRef === null || verifiedAt === null || verifiedByName.toLowerCase() === reviewerName.toLowerCase()) {
        fail(`${field}.identityVerification requires a named non-self verifier and reference`, undefined, { field: `${field}.identityVerification` });
      }
    } else if (verifiedByName !== null || verificationRef !== null || verifiedAt !== null) {
      fail(`${field}.identityVerification must use null details when not verified`, undefined, { field: `${field}.identityVerification` });
    }

    assertExactKeys(attestation.conflictOfInterest, ["state", "disclosureRef", "resolutionRef"], `${field}.conflictOfInterest`);
    const conflictState = normalizeEnum(attestation.conflictOfInterest.state, CONFLICT_STATE_IDS, `${field}.conflictOfInterest.state`);
    const disclosureRef = attestation.conflictOfInterest.disclosureRef === null ? null : normalizeReference(attestation.conflictOfInterest.disclosureRef, `${field}.conflictOfInterest.disclosureRef`);
    const resolutionRef = attestation.conflictOfInterest.resolutionRef === null ? null : normalizeReference(attestation.conflictOfInterest.resolutionRef, `${field}.conflictOfInterest.resolutionRef`);
    if (conflictState === "NONE_DECLARED" && (disclosureRef === null || resolutionRef !== null)) fail(`${field}.conflictOfInterest NONE_DECLARED requires only disclosureRef`, undefined, { field: `${field}.conflictOfInterest` });
    if (conflictState === "RESOLVED" && (disclosureRef === null || resolutionRef === null)) fail(`${field}.conflictOfInterest RESOLVED requires disclosure and resolution refs`, undefined, { field: `${field}.conflictOfInterest` });
    if (conflictState === "DISCLOSED_UNRESOLVED" && (disclosureRef === null || resolutionRef !== null)) fail(`${field}.conflictOfInterest unresolved state requires only disclosureRef`, undefined, { field: `${field}.conflictOfInterest` });
    if (conflictState === "NOT_DISCLOSED" && (disclosureRef !== null || resolutionRef !== null)) fail(`${field}.conflictOfInterest NOT_DISCLOSED requires null refs`, undefined, { field: `${field}.conflictOfInterest` });

    const reviewContentSha256 = normalizeSha256(attestation.reviewContentSha256, `${field}.reviewContentSha256`);
    if (reviewContentSha256 !== expectedContentSha256) fail(`${field}.reviewContentSha256 does not bind this review`, undefined, { field: `${field}.reviewContentSha256` });
    const signatureMethod = normalizeEnum(attestation.signatureMethod, SIGNATURE_METHOD_IDS, `${field}.signatureMethod`);
    const signedAt = normalizeTimestamp(attestation.signedAt, `${field}.signedAt`, true);
    let signatureReference = null;
    if (attestation.signatureReference !== null) {
      assertExactKeys(attestation.signatureReference, ["referenceId", "sha256"], `${field}.signatureReference`);
      signatureReference = {
        referenceId: normalizeReference(attestation.signatureReference.referenceId, `${field}.signatureReference.referenceId`),
        sha256: normalizeSha256(attestation.signatureReference.sha256, `${field}.signatureReference.sha256`),
      };
    }
    if (signatureMethod === "NOT_SIGNED" ? (signedAt !== null || signatureReference !== null) : (signedAt === null || signatureReference === null)) {
      fail(`${field} signature fields do not match signatureMethod`, undefined, { field });
    }
    const supersedesAttestationId = attestation.supersedesAttestationId === null
      ? null
      : normalizeString(attestation.supersedesAttestationId, `${field}.supersedesAttestationId`, { maximum: 24 });
    if (supersedesAttestationId !== null && (!/^D040-NDB-IR-ATTEST-R\d{3}$/.test(supersedesAttestationId) || supersedesAttestationId === attestationId)) {
      fail(`${field}.supersedesAttestationId is invalid`, undefined, { field: `${field}.supersedesAttestationId` });
    }
    return {
      attestationId, reviewerName, reviewerReferenceId, reviewDomains, competenceEvidenceByDomain, participatedInDrafting,
      identityVerification: { state: identityState, verifiedByName, verificationRef, verifiedAt },
      conflictOfInterest: { state: conflictState, disclosureRef, resolutionRef },
      reviewContentSha256, signedAt, signatureMethod, signatureReference, supersedesAttestationId,
    };
  });
  for (const [label, values] of [
    ["attestation IDs", normalized.map(({ attestationId }) => attestationId)],
    ["reviewer references", normalized.map(({ reviewerReferenceId }) => reviewerReferenceId)],
    ["signature references", normalized.flatMap(({ signatureReference }) => signatureReference ? [signatureReference.referenceId] : [])],
  ]) {
    if (new Set(values).size !== values.length) fail(`reviewerAttestations contains duplicate ${label}`, undefined, { field: "reviewerAttestations" });
  }
  return normalized;
}

function reviewContentProjection(input) {
  return {
    schemaVersion: input.schemaVersion,
    recordKind: input.recordKind,
    reviewId: input.reviewId,
    packetIdentity: input.packetIdentity,
    reviewedArtifacts: input.reviewedArtifacts,
    cardDispositions: input.cardDispositions,
    crossAxisInvariantResults: input.crossAxisInvariantResults,
    findings: input.findings,
    overallDisposition: input.overallDisposition,
    reviewedAt: input.reviewedAt,
    supersedesReviewId: input.supersedesReviewId,
    containsCredential: input.containsCredential,
    containsIdentityDocument: input.containsIdentityDocument,
    containsSignatureMaterial: input.containsSignatureMaterial,
  };
}

function computeD040NonDiagnosticBoundaryReviewContentSha256(input) {
  assertDataTree(input, "input");
  return fingerprint(reviewContentProjection(input));
}

function computeD040NonDiagnosticBoundaryReviewBundleSha256(input) {
  assertDataTree(input, "input");
  const { bundleSha256: _excluded, ...withoutSelf } = input;
  return fingerprint(withoutSelf);
}

function isCountableAttestation(attestation) {
  return !attestation.participatedInDrafting &&
    attestation.identityVerification.state === "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF" &&
    ["NONE_DECLARED", "RESOLVED"].includes(attestation.conflictOfInterest.state) &&
    attestation.signatureMethod !== "NOT_SIGNED";
}

function validateFindingLinks(cards, invariants, findings) {
  const findingById = new Map(findings.map((finding) => [finding.findingId, finding]));
  const referencedIds = new Set();
  for (const card of cards) {
    for (const findingId of card.findingIds) {
      const finding = findingById.get(findingId);
      if (!finding) fail("card references an unknown finding", undefined, { field: "cardDispositions.findingIds" });
      if (!finding.decisionIds.includes(card.decisionId)) {
        fail("card and finding references are not bidirectional", undefined, { field: "cardDispositions.findingIds" });
      }
      referencedIds.add(findingId);
    }
  }
  for (const invariant of invariants) {
    for (const findingId of invariant.findingIds) {
      if (!findingById.has(findingId)) fail("invariant references an unknown finding", undefined, { field: "crossAxisInvariantResults.findingIds" });
      referencedIds.add(findingId);
    }
  }
  for (const finding of findings) {
    if (!referencedIds.has(finding.findingId)) fail("finding must be referenced by a card or invariant", undefined, { field: "findings" });
  }
  for (const invariant of invariants.filter(({ result }) => result === "PASS")) {
    if (invariant.findingIds.some((id) => {
      const finding = findingById.get(id);
      return finding.state === "OPEN" && ["P0", "P1", "P2"].includes(finding.severity);
    })) fail("a passing invariant cannot cite an open blocking finding", undefined, { field: "crossAxisInvariantResults" });
  }
}

function deriveOverallDisposition(cards, invariants, findings, attestations) {
  const open = findings.filter(({ state }) => state === "OPEN");
  if (
    cards.some(({ disposition }) => disposition === "REJECT_SPEC") ||
    invariants.some(({ result }) => result === "FAIL") ||
    open.some(({ severity }) => severity === "P0")
  ) return "REJECTED";
  if (
    cards.some(({ disposition }) => disposition === "CHANGES_REQUIRED") ||
    open.some(({ severity }) => ["P1", "P2"].includes(severity))
  ) return "CHANGES_REQUIRED";
  const coveredDomains = new Set(attestations.filter(isCountableAttestation).flatMap(({ reviewDomains }) => reviewDomains));
  if (
    cards.some(({ disposition }) => disposition === "NOT_REVIEWED") ||
    invariants.some(({ result }) => result === "NOT_VERIFIED") ||
    REVIEW_DOMAINS.some((domain) => !coveredDomains.has(domain))
  ) return "INCOMPLETE";
  return "INDEPENDENT_REVIEW_PASS_CANDIDATE";
}

function normalizeD040NonDiagnosticBoundaryIndependentReviewRecord(input) {
  assertDataTree(input, "input");
  assertExactKeys(input, [
    "schemaVersion", "recordKind", "reviewId", "packetIdentity", "reviewedArtifacts", "cardDispositions",
    "crossAxisInvariantResults", "findings", "overallDisposition", "reviewedAt", "supersedesReviewId",
    "containsCredential", "containsIdentityDocument", "containsSignatureMaterial", "reviewContentSha256",
    "reviewerAttestations", "bundleSha256",
  ], "input");
  if (input.schemaVersion !== INPUT_SCHEMA_VERSION) fail("unsupported input schemaVersion", undefined, { field: "schemaVersion" });
  const recordKind = normalizeEnum(input.recordKind, RECORD_KINDS, "recordKind");
  const reviewId = normalizeString(input.reviewId, "reviewId", { maximum: 40 });
  const expectedReviewPattern = recordKind === "FORMAL_REVIEW_RECORD"
    ? /^D040-NDB-REVIEW-R\d{3}$/
    : /^D040-NDB-SYNTHETIC-R\d{3}$/;
  if (!expectedReviewPattern.test(reviewId)) fail("reviewId does not match recordKind", undefined, { field: "reviewId" });
  const packetIdentity = normalizePacketIdentity(input.packetIdentity);
  const reviewedArtifacts = normalizeReviewedArtifacts(input.reviewedArtifacts);
  const cardDispositions = normalizeCardDispositions(input.cardDispositions);
  const crossAxisInvariantResults = normalizeInvariantResults(input.crossAxisInvariantResults);
  const reviewedAt = normalizeTimestamp(input.reviewedAt, "reviewedAt");
  const findings = normalizeFindings(input.findings, reviewedAt);
  const overallDisposition = normalizeEnum(input.overallDisposition, OVERALL_DISPOSITION_IDS, "overallDisposition");
  const supersedesReviewId = input.supersedesReviewId === null
    ? null
    : normalizeString(input.supersedesReviewId, "supersedesReviewId", { maximum: 40 });
  if (supersedesReviewId !== null && (supersedesReviewId === reviewId || !expectedReviewPattern.test(supersedesReviewId))) {
    fail("supersedesReviewId is invalid for this recordKind", undefined, { field: "supersedesReviewId" });
  }
  const containsCredential = normalizeBoolean(input.containsCredential, "containsCredential");
  const containsIdentityDocument = normalizeBoolean(input.containsIdentityDocument, "containsIdentityDocument");
  const containsSignatureMaterial = normalizeBoolean(input.containsSignatureMaterial, "containsSignatureMaterial");
  if (containsCredential || containsIdentityDocument || containsSignatureMaterial) {
    fail("review bundles cannot contain credentials, identity documents, or signature material", "UNSAFE_D040_NON_DIAGNOSTIC_BOUNDARY_INDEPENDENT_REVIEW_RECORD", { field: "containsProhibitedMaterial" });
  }
  const contentCore = {
    schemaVersion: INPUT_SCHEMA_VERSION,
    recordKind,
    reviewId,
    packetIdentity,
    reviewedArtifacts,
    cardDispositions,
    crossAxisInvariantResults,
    findings,
    overallDisposition,
    reviewedAt,
    supersedesReviewId,
    containsCredential,
    containsIdentityDocument,
    containsSignatureMaterial,
  };
  const expectedContentSha256 = fingerprint(contentCore);
  const reviewContentSha256 = normalizeSha256(input.reviewContentSha256, "reviewContentSha256");
  if (reviewContentSha256 !== expectedContentSha256) fail("reviewContentSha256 does not bind normalized review content", undefined, { field: "reviewContentSha256" });
  const reviewerAttestations = normalizeAttestations(input.reviewerAttestations, reviewContentSha256);
  validateFindingLinks(cardDispositions, crossAxisInvariantResults, findings);
  const derivedDisposition = deriveOverallDisposition(cardDispositions, crossAxisInvariantResults, findings, reviewerAttestations);
  if (overallDisposition !== derivedDisposition) fail("overallDisposition does not match recomputed review state", undefined, { field: "overallDisposition" });
  const normalizedWithoutBundleHash = {
    ...contentCore,
    reviewContentSha256,
    reviewerAttestations,
  };
  const bundleSha256 = normalizeSha256(input.bundleSha256, "bundleSha256");
  if (bundleSha256 !== fingerprint(normalizedWithoutBundleHash)) fail("bundleSha256 does not bind the complete review bundle", undefined, { field: "bundleSha256" });
  return immutable({ ...normalizedWithoutBundleHash, bundleSha256 });
}

function evaluateD040NonDiagnosticBoundaryIndependentReviewRecord(input) {
  const normalized = normalizeD040NonDiagnosticBoundaryIndependentReviewRecord(input);
  const countableAttestations = normalized.reviewerAttestations.filter(isCountableAttestation);
  const reviewerDomainCoverage = REVIEW_DOMAINS.map((reviewDomain) => ({
    reviewDomain,
    attestationCount: countableAttestations.filter(({ reviewDomains }) => reviewDomains.includes(reviewDomain)).length,
  }));
  const cardDispositionCounts = Object.fromEntries(CARD_DISPOSITION_IDS.map((id) => [id, normalized.cardDispositions.filter(({ disposition }) => disposition === id).length]));
  const invariantResultCounts = Object.fromEntries(INVARIANT_RESULT_IDS.map((id) => [id, normalized.crossAxisInvariantResults.filter(({ result }) => result === id).length]));
  const findingCounts = Object.fromEntries(SEVERITY_IDS.map((severity) => [severity, {
    open: normalized.findings.filter((finding) => finding.severity === severity && finding.state === "OPEN").length,
    closed: normalized.findings.filter((finding) => finding.severity === severity && finding.state === "CLOSED").length,
  }]));
  const wouldBeNonDiagnosticBoundaryIndependentReviewPassCandidate = normalized.overallDisposition === "INDEPENDENT_REVIEW_PASS_CANDIDATE";
  const nonDiagnosticBoundaryIndependentReviewPassCandidate = normalized.recordKind === "FORMAL_REVIEW_RECORD" && wouldBeNonDiagnosticBoundaryIndependentReviewPassCandidate;
  const blockers = immutable([
    ...(normalized.recordKind === "SYNTHETIC_CONTRACT_FIXTURE" ? ["SYNTHETIC_CONTRACT_FIXTURE_ONLY"] : []),
    ...(normalized.overallDisposition === "REJECTED" ? ["REVIEW_REJECTED"] : []),
    ...(normalized.overallDisposition === "CHANGES_REQUIRED" ? ["REVIEW_CHANGES_REQUIRED"] : []),
    ...(normalized.overallDisposition === "INCOMPLETE" ? ["REVIEW_COVERAGE_INCOMPLETE"] : []),
    "REVIEWER_IDENTITY_INDEPENDENCE_COMPETENCE_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED",
    "AUTHORITATIVE_REVIEW_EVENT_REQUIRED",
    "D068_D069_HEALTH_REVIEW_CONTENT_QA_AND_OWNER_READY_STILL_REQUIRED",
    "CHINA_HEALTH_REVIEW_AND_CONTENT_QA_STILL_REQUIRED",
    "OWNER_REVIEW_NOT_AUTHORIZED",
    "FORMAL_IMPLEMENTATION_NOT_AUTHORIZED",
  ]);
  const core = immutable({
    schemaVersion: RESULT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    disposition: normalized.recordKind === "SYNTHETIC_CONTRACT_FIXTURE"
      ? "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY"
      : nonDiagnosticBoundaryIndependentReviewPassCandidate
        ? "STRUCTURALLY_COMPLETE_REVIEW_ONLY"
        : "REVIEW_RECORD_BLOCKED",
    recordKind: normalized.recordKind,
    reviewId: normalized.reviewId,
    packetId: normalized.packetIdentity.packetId,
    packetVersion: normalized.packetIdentity.packetVersion,
    reviewedArtifactCount: normalized.reviewedArtifacts.length,
    reviewerAttestationCount: normalized.reviewerAttestations.length,
    countableAttestationCount: countableAttestations.length,
    reviewerDomainCoverage,
    cardDispositionCounts,
    invariantResultCounts,
    findingCounts,
    overallDisposition: normalized.overallDisposition,
    wouldBeNonDiagnosticBoundaryIndependentReviewPassCandidate,
    nonDiagnosticBoundaryIndependentReviewPassCandidate,
    nonDiagnosticBoundaryIndependentReviewPassed: false,
    reviewContentSha256: normalized.reviewContentSha256,
    bundleSha256: normalized.bundleSha256,
    blockers,
    inputFingerprint: fingerprint(normalized),
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateD040NonDiagnosticBoundaryIndependentReviewRecordResult(result, input) {
  assertDataTree(result, "result");
  const expected = evaluateD040NonDiagnosticBoundaryIndependentReviewRecord(input);
  if (!isDeepStrictEqual(result, expected)) fail("D-040 non-diagnostic-boundary independent review result or fingerprint was changed");
  return expected;
}

export {
  BOUNDARY,
  CARD_DISPOSITION_IDS,
  CARD_IDENTITIES,
  CONFLICT_STATE_IDS,
  CONTRACT_ID,
  IDENTITY_STATE_IDS,
  INPUT_SCHEMA_VERSION,
  INVARIANT_IDS,
  INVARIANT_RESULT_IDS,
  OVERALL_DISPOSITION_IDS,
  PACKET_IDENTITY,
  RECORD_KINDS,
  RESULT_SCHEMA_VERSION,
  REVIEWED_ARTIFACTS,
  REVIEW_DOMAINS,
  SEVERITY_IDS,
  SIGNATURE_METHOD_IDS,
  computeD040NonDiagnosticBoundaryReviewBundleSha256,
  computeD040NonDiagnosticBoundaryReviewContentSha256,
  evaluateD040NonDiagnosticBoundaryIndependentReviewRecord,
  normalizeD040NonDiagnosticBoundaryIndependentReviewRecord,
  validateD040NonDiagnosticBoundaryIndependentReviewRecordResult,
};

