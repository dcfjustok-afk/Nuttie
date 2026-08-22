import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const INPUT_SCHEMA_VERSION = "D040_CHINA_HEALTH_REVIEW_BUNDLE_INPUT_V1";
const RESULT_SCHEMA_VERSION = "D040_CHINA_HEALTH_REVIEW_RESULT_V1";
const BOUNDARY_SCHEMA_VERSION = "D040_CHINA_HEALTH_REVIEW_BOUNDARY_V1";
const CONTRACT_ID = "D040-CHINA-HEALTH-REVIEW-RECORD-CONTRACT-001";

const RECORD_KINDS = Object.freeze([
  "FORMAL_HEALTH_REVIEW_RECORD",
  "SYNTHETIC_CONTRACT_FIXTURE",
]);
const ITEM_DISPOSITION_IDS = Object.freeze([
  "APPROVE",
  "APPROVE_WITH_REQUIRED_CHANGE",
  "REJECT",
  "OUT_OF_SCOPE",
]);
const OVERALL_DISPOSITION_IDS = Object.freeze([
  "HEALTH_REVIEW_APPROVAL_CANDIDATE",
  "REJECTED",
  "CHANGES_REQUIRED",
  "INCOMPLETE",
]);
const SEVERITY_IDS = Object.freeze(["P0", "P1", "P2", "P3"]);
const QUALIFICATION_VERIFICATION_STATE_IDS = Object.freeze([
  "NOT_VERIFIED",
  "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF",
]);
const LOCALE_FIT_STATE_IDS = Object.freeze(["PASS", "FAIL", "NOT_VERIFIED"]);
const CONFLICT_STATE_IDS = Object.freeze([
  "UNDISCLOSED",
  "NONE_DECLARED",
  "RESOLVED",
  "UNRESOLVED",
]);
const SIGNATURE_METHOD_IDS = Object.freeze([
  "NOT_SIGNED",
  "SIGNED_DOCUMENT_REFERENCE",
  "VERIFIED_WORKFLOW_REFERENCE",
  "WET_SIGNATURE_REFERENCE",
]);

const PACKET_IDENTITY = immutable({
  packetId: "D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001",
  packetVersion: "PACKET-001-R1",
  packetEventId: "EVT-20260820-008",
  inputCommit: "5c32cfb2083bbe904c458b68d92a97e1f8479ce5",
  packetArtifactCommit: "0fd261ebf886a6d4c71042655ec1e28c9ba85bb0",
  packetArtifactBlobOid: "89f66cb38da0cd2865a343ac471e1cbe63de92c8",
  packetArtifactSha256: "7e48fa29be626429b63c31492d37b710f8f873d5f079aeb5c70dee918bf5f110",
});

const REVIEWED_ARTIFACTS = immutable([
  {
    path: "docs/03-design/d040-china-support-health-review-input.md",
    gitBlobOid: "5e6a1484a214e336ba91416015c7daece765dc24",
    sha256: "791d5c94fe70ac36c2bc9c2c20e1d2891d0c6b0e5f3820f11d78f8328ddcf0cb",
  },
  {
    path: "docs/03-design/d040-px0-input-research.md",
    gitBlobOid: "f3b9e68d4b181b761e21a57ba476291d7410cf36",
    sha256: "bf7b4c6e74307b93a15c38c47cf3c81a3c5b45e651fcb4b1b3a02ef9b2a51381",
  },
  {
    path: "docs/03-design/d040-first-batch-card-spec.md",
    gitBlobOid: "c55e5d73a8cffc31ee81fb9d72dd2c252ea08282",
    sha256: "8489e99efbdb2f2f410eb1005909dd2b1732d8a8ce69616aca6eec51f8d86ef9",
  },
  {
    path: "docs/03-design/d040-energy-model-batch-card-spec.md",
    gitBlobOid: "46f3a6b353ebfa9c2ab73f76b291873dbd9f6569",
    sha256: "e776e8f7ca9aa9649849ef2b6cc814e6e0c461c8b55e7f0f0f6ae4e517373835",
  },
  {
    path: "docs/03-design/d040-niddk-dynamic-model-feasibility-input.md",
    gitBlobOid: "409119ac4af1691791794a733364d50f847653b2",
    sha256: "6feeba9bf07991c66254cf42250eefdf5d082de155417d2c7490a59a679b00b0",
  },
  {
    path: "docs/03-design/d040-macronutrient-evidence.md",
    gitBlobOid: "5aa823ba05f77c5d4188521a08603cbf10730afd",
    sha256: "31755c1ae43edeec4a5a5fbb922679fa29f17eba2b44b70cc534638f1497b93a",
  },
  {
    path: "docs/03-design/d040-china-macronutrient-standard-input.md",
    gitBlobOid: "3988aee30da7968f5a6b588ad81cd96714cdbe44",
    sha256: "0ad612e7b899cce0d9de5c8ca3f07c490d8e4fcab92e4deaa9b4404a9147616d",
  },
  {
    path: "docs/03-design/d040-data-lifecycle-batch-card-spec.md",
    gitBlobOid: "cbf152542e9c5d6020e311dd2e859e89a7aa3881",
    sha256: "55cd099d3dad3ddd8244a46e1c78d0d4d31f5426af9b53af73b1f9bf3378a567",
  },
  {
    path: "docs/03-design/d040-question-allocation.md",
    gitBlobOid: "300504fb4a37fd36b32ee80d08df66da71e1af6d",
    sha256: "55ccd4d3b895f7d73fd387ee0acedd773e2ba5c84a674aba955b4479fe6faecb",
  },
]);

const ITEM_IDENTITIES = immutable([
  { itemId: "COPY-D040-ND-01", itemKind: "COPY" },
  { itemId: "COPY-D040-ND-02", itemKind: "COPY" },
  { itemId: "COPY-D040-ND-03", itemKind: "COPY" },
  { itemId: "COPY-D040-ND-04", itemKind: "COPY" },
  { itemId: "COPY-D040-ND-05", itemKind: "COPY" },
  { itemId: "COPY-D040-ND-06", itemKind: "COPY" },
  { itemId: "BOUNDARY-D040-AGE", itemKind: "BOUNDARY" },
  { itemId: "BOUNDARY-D040-PREGNANCY-LACTATION", itemKind: "BOUNDARY" },
  { itemId: "BOUNDARY-D040-EATING-DISORDER-RISK", itemKind: "BOUNDARY" },
  { itemId: "BOUNDARY-D040-CHRONIC-MEDICATION", itemKind: "BOUNDARY" },
  { itemId: "BOUNDARY-D040-EER-REE", itemKind: "BOUNDARY" },
  { itemId: "BOUNDARY-D040-DYNAMIC-MODEL", itemKind: "BOUNDARY" },
  { itemId: "BOUNDARY-D040-CHINA-MACRO", itemKind: "BOUNDARY" },
]);

const BOUNDARY = immutable({
  schemaVersion: BOUNDARY_SCHEMA_VERSION,
  contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
  harnessReadsCallerSuppliedDataOnly: true,
  reviewerIdentityClaimsCallerAssertedNotVerified: true,
  reviewerQualificationClaimsCallerAssertedNotVerified: true,
  reviewerCompetenceClaimsCallerAssertedNotVerified: true,
  reviewerLocaleFitClaimsCallerAssertedNotVerified: true,
  signatureReferencesCallerAssertedNotVerified: true,
  gitReads: 0,
  fileReads: 0,
  fileWrites: 0,
  identityDocumentReads: 0,
  qualificationRegistryReads: 0,
  signatureArtifactReads: 0,
  networkRequests: 0,
  providerRequests: 0,
  externalMessagesSent: 0,
  businessWrites: 0,
  formalHealthReviewRecordCount: 0,
  syntheticFixturePersistedCount: 0,
  reviewerAssigned: false,
  reviewerIdentityVerified: false,
  reviewerQualificationVerified: false,
  reviewerCompetenceVerified: false,
  reviewerLocaleFitVerified: false,
  reviewerSignatureVerified: false,
  healthReviewStarted: false,
  healthContentApproved: false,
  contentQaPassed: false,
  d068OwnerReady: false,
  d069OwnerReady: false,
  d063OwnerReady: false,
  firstThreeBatchesIndependentReviewPassed: false,
  ownerIntakeChanged: false,
  ownerCardScheduled: false,
  px1Authorized: false,
  px2Authorized: false,
  ownerReviewAuthorized: false,
  ownerChoiceRecorded: false,
  decisionAcceptedRecorded: false,
  healthCopyImplementationAuthorized: false,
  formulaImplementationAuthorized: false,
  formalImplementationAuthorized: false,
  gateStatesChanged: false,
});

class D040HealthReviewRecordError extends Error {
  constructor(message, code = "INVALID_D040_CHINA_HEALTH_REVIEW_RECORD", details = {}) {
    super(message);
    this.name = "D040HealthReviewRecordError";
    this.code = code;
    this.details = immutable(details);
  }
}

function fail(message, code, details) {
  throw new D040HealthReviewRecordError(message, code, details);
}

function clone(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(clone);
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function deepFreeze(value, seen = new Set()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
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
  if (budget.nodes > 25_000) fail("input exceeds node budget", undefined, { field });
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
      fail("input contains non-data properties", undefined, { field });
    }
  }
  if (Array.isArray(value)) {
    if (value.length > 256) fail("input exceeds array budget", undefined, { field });
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) fail("input contains a sparse array", undefined, { field });
    }
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      fail("input must use plain records", undefined, { field });
    }
  }
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) {
    assertDataTree(child, Array.isArray(value) ? `${field}[${key}]` : `${field}.${key}`, depth + 1, ancestors, budget);
  }
  ancestors.delete(value);
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

function assertNoSensitiveMaterial(value, field = "input", seen = new Set()) {
  if (typeof value === "string") {
    if (containsSensitiveLookingMaterial(value)) {
      fail("input contains prohibited sensitive-looking material", "UNSAFE_D040_CHINA_HEALTH_REVIEW_RECORD", { field });
    }
    return;
  }
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (containsSensitiveLookingMaterial(key)) {
      fail("input contains a prohibited sensitive-looking field", "UNSAFE_D040_CHINA_HEALTH_REVIEW_RECORD", { field });
    }
    assertNoSensitiveMaterial(child, Array.isArray(value) ? `${field}[${key}]` : `${field}.${key}`, seen);
  }
}

function assertExactKeys(value, expectedKeys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be a plain record`, undefined, { field });
  }
  const expected = new Set(expectedKeys);
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) fail(`${field} contains an unsupported field`, undefined, { field });
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(value, key)) fail(`${field} is missing a required field`, undefined, { field });
  }
}

function normalizeString(value, field, { maximum = 512, minimum = 1 } = {}) {
  if (typeof value !== "string") fail(`${field} must be a string`, undefined, { field });
  const normalized = value.trim();
  if (normalized.length < minimum || normalized.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized)) {
    fail(`${field} has an invalid length or control character`, undefined, { field });
  }
  if (containsSensitiveLookingMaterial(normalized)) {
    fail("input contains prohibited sensitive-looking material", "UNSAFE_D040_CHINA_HEALTH_REVIEW_RECORD", { field });
  }
  return normalized;
}

function normalizeNullableString(value, field, maximum = 512) {
  return value === null ? null : normalizeString(value, field, { maximum });
}

function normalizeBoolean(value, field) {
  if (typeof value !== "boolean") fail(`${field} must be a boolean`, undefined, { field });
  return value;
}

function normalizeEnum(value, allowed, field) {
  const normalized = normalizeString(value, field);
  if (!allowed.includes(normalized)) fail(`${field} is unsupported`, undefined, { field });
  return normalized;
}

function normalizeSha256(value, field) {
  const normalized = normalizeString(value, field, { maximum: 64 });
  if (!/^[a-f0-9]{64}$/.test(normalized)) fail(`${field} must be a lowercase SHA-256`, undefined, { field });
  return normalized;
}

function normalizeOid(value, field) {
  const normalized = normalizeString(value, field, { maximum: 40 });
  if (!/^[a-f0-9]{40}$/.test(normalized)) fail(`${field} must be a lowercase Git object ID`, undefined, { field });
  return normalized;
}

function normalizeReference(value, field) {
  const normalized = normalizeString(value, field, { maximum: 256 });
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{2,255}$/.test(normalized)) {
    fail(`${field} must be a stable opaque reference`, undefined, { field });
  }
  return normalized;
}

function normalizeName(value, field) {
  const normalized = normalizeString(value, field, { maximum: 128, minimum: 2 });
  const roleOnly = normalized.toLowerCase().replace(/[\s_-]+/g, " ");
  if ([
    "pm", "owner", "projectcontentowner", "project content owner", "codex", "ai",
    "agent", "root", "reviewer", "health reviewer", "chinaqualifiedhealthreviewer",
  ].includes(roleOnly)) {
    fail(`${field} must identify a named person rather than a role or agent`, undefined, { field });
  }
  return normalized;
}

function isValidTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  return calendarDate.getUTCFullYear() === year &&
    calendarDate.getUTCMonth() === month - 1 && calendarDate.getUTCDate() === day;
}

function normalizeTimestamp(value, field, nullable = false) {
  if (nullable && value === null) return null;
  const normalized = normalizeString(value, field, { maximum: 64 });
  if (!isValidTimestamp(normalized)) fail(`${field} must be an RFC 3339 timestamp with an explicit offset`, undefined, { field });
  return normalized;
}

function normalizeReferenceArray(value, field, { minimum = 1, maximum = 32 } = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    fail(`${field} has an invalid reference count`, undefined, { field });
  }
  const normalized = value.map((item, index) => normalizeReference(item, `${field}[${index}]`));
  if (new Set(normalized).size !== normalized.length) fail(`${field} contains duplicates`, undefined, { field });
  return normalized;
}

function normalizeFindingIdArray(value, field, minimum = 0) {
  const normalized = normalizeReferenceArray(value, field, { minimum, maximum: 32 });
  for (const findingId of normalized) {
    if (!/^D040-CHR-F\d{3}$/.test(findingId)) fail(`${field} contains an invalid finding ID`, undefined, { field });
  }
  return normalized;
}

function normalizePacketIdentity(value) {
  assertExactKeys(value, Object.keys(PACKET_IDENTITY), "packetIdentity");
  const normalized = {
    packetId: normalizeReference(value.packetId, "packetIdentity.packetId"),
    packetVersion: normalizeReference(value.packetVersion, "packetIdentity.packetVersion"),
    packetEventId: normalizeReference(value.packetEventId, "packetIdentity.packetEventId"),
    inputCommit: normalizeOid(value.inputCommit, "packetIdentity.inputCommit"),
    packetArtifactCommit: normalizeOid(value.packetArtifactCommit, "packetIdentity.packetArtifactCommit"),
    packetArtifactBlobOid: normalizeOid(value.packetArtifactBlobOid, "packetIdentity.packetArtifactBlobOid"),
    packetArtifactSha256: normalizeSha256(value.packetArtifactSha256, "packetIdentity.packetArtifactSha256"),
  };
  if (!isDeepStrictEqual(normalized, PACKET_IDENTITY)) fail("packetIdentity does not match PACKET-001-R1", undefined, { field: "packetIdentity" });
  return normalized;
}

function normalizeReviewedArtifacts(value) {
  if (!Array.isArray(value) || value.length !== REVIEWED_ARTIFACTS.length) {
    fail("reviewedArtifacts must contain exactly nine entries", undefined, { field: "reviewedArtifacts" });
  }
  const normalized = value.map((artifact, index) => {
    const field = `reviewedArtifacts[${index}]`;
    assertExactKeys(artifact, ["path", "gitBlobOid", "sha256"], field);
    return {
      path: normalizeString(artifact.path, `${field}.path`, { maximum: 256 }),
      gitBlobOid: normalizeOid(artifact.gitBlobOid, `${field}.gitBlobOid`),
      sha256: normalizeSha256(artifact.sha256, `${field}.sha256`),
    };
  });
  if (!isDeepStrictEqual(normalized, REVIEWED_ARTIFACTS)) fail("reviewedArtifacts do not match the frozen packet", undefined, { field: "reviewedArtifacts" });
  return normalized;
}

function normalizeItemDispositions(value) {
  if (!Array.isArray(value) || value.length !== ITEM_IDENTITIES.length) {
    fail("itemDispositions must contain exactly thirteen entries", undefined, { field: "itemDispositions" });
  }
  return value.map((item, index) => {
    const field = `itemDispositions[${index}]`;
    assertExactKeys(item, [
      "itemId", "itemKind", "disposition", "competenceScopeRefs", "evidenceRefs",
      "findingIds", "requiredChange",
    ], field);
    const identity = ITEM_IDENTITIES[index];
    const normalized = {
      itemId: normalizeReference(item.itemId, `${field}.itemId`),
      itemKind: normalizeEnum(item.itemKind, ["COPY", "BOUNDARY"], `${field}.itemKind`),
      disposition: normalizeEnum(item.disposition, ITEM_DISPOSITION_IDS, `${field}.disposition`),
      competenceScopeRefs: normalizeReferenceArray(item.competenceScopeRefs, `${field}.competenceScopeRefs`),
      evidenceRefs: normalizeReferenceArray(item.evidenceRefs, `${field}.evidenceRefs`),
      findingIds: normalizeFindingIdArray(item.findingIds, `${field}.findingIds`, 0),
      requiredChange: normalizeNullableString(item.requiredChange, `${field}.requiredChange`, 2_048),
    };
    if (normalized.itemId !== identity.itemId || normalized.itemKind !== identity.itemKind) {
      fail("itemDispositions are not in the required identity order", undefined, { field });
    }
    if (normalized.disposition === "APPROVE") {
      if (normalized.requiredChange !== null) fail("APPROVE cannot carry requiredChange", undefined, { field });
    } else {
      if (normalized.findingIds.length === 0) fail("non-approve disposition must reference a finding", undefined, { field });
      if (["APPROVE_WITH_REQUIRED_CHANGE", "REJECT"].includes(normalized.disposition) && normalized.requiredChange === null) {
        fail("change or reject disposition must describe requiredChange", undefined, { field });
      }
      if (normalized.disposition === "OUT_OF_SCOPE" && normalized.requiredChange !== null) {
        fail("OUT_OF_SCOPE must keep requiredChange null", undefined, { field });
      }
    }
    return normalized;
  });
}

function normalizeFindings(value, reviewedAt) {
  if (!Array.isArray(value) || value.length > 128) fail("findings has an invalid item count", undefined, { field: "findings" });
  const normalized = value.map((finding, index) => {
    const field = `findings[${index}]`;
    assertExactKeys(finding, [
      "findingId", "severity", "itemIds", "summary", "evidenceRefs", "requiredChange",
      "state", "closureEvidenceRefs", "accountableOwnerRef", "dueAt", "nonBlockingRationale",
    ], field);
    const findingId = normalizeReference(finding.findingId, `${field}.findingId`);
    if (!/^D040-CHR-F\d{3}$/.test(findingId)) fail("findingId is invalid", undefined, { field: `${field}.findingId` });
    const itemIds = normalizeReferenceArray(finding.itemIds, `${field}.itemIds`);
    if (itemIds.some((itemId) => !ITEM_IDENTITIES.some((identity) => identity.itemId === itemId))) {
      fail("finding references an item outside this packet", undefined, { field: `${field}.itemIds` });
    }
    const state = normalizeEnum(finding.state, ["OPEN", "CLOSED"], `${field}.state`);
    const severity = normalizeEnum(finding.severity, SEVERITY_IDS, `${field}.severity`);
    const closureEvidenceRefs = normalizeReferenceArray(
      finding.closureEvidenceRefs,
      `${field}.closureEvidenceRefs`,
      { minimum: state === "CLOSED" ? 1 : 0, maximum: 32 },
    );
    const accountableOwnerRef = finding.accountableOwnerRef === null
      ? null : normalizeReference(finding.accountableOwnerRef, `${field}.accountableOwnerRef`);
    const dueAt = normalizeTimestamp(finding.dueAt, `${field}.dueAt`, true);
    const nonBlockingRationale = normalizeNullableString(
      finding.nonBlockingRationale,
      `${field}.nonBlockingRationale`,
      2_048,
    );
    if (state === "OPEN" && closureEvidenceRefs.length > 0) fail("open finding cannot carry closure evidence", undefined, { field });
    if (state === "OPEN" && severity === "P3") {
      if (accountableOwnerRef === null || dueAt === null || nonBlockingRationale === null || Date.parse(dueAt) <= Date.parse(reviewedAt)) {
        fail("open P3 requires owner, future dueAt, and non-blocking rationale", undefined, { field });
      }
    } else if (accountableOwnerRef !== null || dueAt !== null || nonBlockingRationale !== null) {
      fail("only open P3 can carry non-blocking disposition fields", undefined, { field });
    }
    return {
      findingId,
      severity,
      itemIds,
      summary: normalizeString(finding.summary, `${field}.summary`, { maximum: 2_048 }),
      evidenceRefs: normalizeReferenceArray(finding.evidenceRefs, `${field}.evidenceRefs`),
      requiredChange: normalizeString(finding.requiredChange, `${field}.requiredChange`, { maximum: 2_048 }),
      state,
      closureEvidenceRefs,
      accountableOwnerRef,
      dueAt,
      nonBlockingRationale,
    };
  });
  if (new Set(normalized.map(({ findingId }) => findingId)).size !== normalized.length) {
    fail("findings contains duplicate IDs", undefined, { field: "findings" });
  }
  return normalized;
}

function normalizeReviewerAttestation(value, { reviewContentSha256, reviewedAt }) {
  const field = "reviewerAttestation";
  assertExactKeys(value, [
    "attestationId", "reviewerName", "reviewerReferenceId", "qualificationType",
    "qualificationIssuer", "qualificationReference", "qualificationVerifiedAt",
    "qualificationValidAt", "competenceScope", "localeAndRegionFit", "participatedInDrafting",
    "qualificationVerification", "conflictOfInterest", "reviewerContactRef", "reviewContentSha256",
    "signedAt", "signatureMethod", "signatureReference", "supersedesAttestationId",
  ], field);
  const reviewerName = normalizeName(value.reviewerName, `${field}.reviewerName`);
  const qualificationVerificationField = `${field}.qualificationVerification`;
  assertExactKeys(value.qualificationVerification, ["state", "verifiedByName", "verificationRef", "verifiedAt"], qualificationVerificationField);
  const verificationState = normalizeEnum(
    value.qualificationVerification.state,
    QUALIFICATION_VERIFICATION_STATE_IDS,
    `${qualificationVerificationField}.state`,
  );
  let verifiedByName = null;
  let verificationRef = null;
  let verifiedAt = null;
  let qualificationVerifiedAt = null;
  let qualificationValidAt = null;
  if (verificationState === "NOT_VERIFIED") {
    if (value.qualificationVerification.verifiedByName !== null || value.qualificationVerification.verificationRef !== null ||
      value.qualificationVerification.verifiedAt !== null || value.qualificationVerifiedAt !== null || value.qualificationValidAt !== null) {
      fail("NOT_VERIFIED must keep verification fields null", undefined, { field: qualificationVerificationField });
    }
  } else {
    verifiedByName = normalizeName(value.qualificationVerification.verifiedByName, `${qualificationVerificationField}.verifiedByName`);
    if (verifiedByName.toLocaleLowerCase() === reviewerName.toLocaleLowerCase()) {
      fail("reviewer cannot self-verify qualification", undefined, { field: qualificationVerificationField });
    }
    verificationRef = normalizeReference(value.qualificationVerification.verificationRef, `${qualificationVerificationField}.verificationRef`);
    verifiedAt = normalizeTimestamp(value.qualificationVerification.verifiedAt, `${qualificationVerificationField}.verifiedAt`);
    qualificationVerifiedAt = normalizeTimestamp(value.qualificationVerifiedAt, `${field}.qualificationVerifiedAt`);
    qualificationValidAt = normalizeTimestamp(value.qualificationValidAt, `${field}.qualificationValidAt`);
    if (qualificationVerifiedAt !== verifiedAt || [verifiedAt, qualificationValidAt].some((time) => Date.parse(time) > Date.parse(reviewedAt))) {
      fail("qualification observation timestamps are inconsistent or after reviewedAt", undefined, { field: qualificationVerificationField });
    }
  }

  const localeField = `${field}.localeAndRegionFit`;
  assertExactKeys(value.localeAndRegionFit, ["state", "rationaleRef"], localeField);
  const localeAndRegionFit = {
    state: normalizeEnum(value.localeAndRegionFit.state, LOCALE_FIT_STATE_IDS, `${localeField}.state`),
    rationaleRef: normalizeReference(value.localeAndRegionFit.rationaleRef, `${localeField}.rationaleRef`),
  };

  const conflictField = `${field}.conflictOfInterest`;
  assertExactKeys(value.conflictOfInterest, ["state", "disclosureRef", "resolutionRef"], conflictField);
  const conflictState = normalizeEnum(value.conflictOfInterest.state, CONFLICT_STATE_IDS, `${conflictField}.state`);
  const disclosureRef = value.conflictOfInterest.disclosureRef === null
    ? null : normalizeReference(value.conflictOfInterest.disclosureRef, `${conflictField}.disclosureRef`);
  const resolutionRef = value.conflictOfInterest.resolutionRef === null
    ? null : normalizeReference(value.conflictOfInterest.resolutionRef, `${conflictField}.resolutionRef`);
  if (conflictState === "UNDISCLOSED" && (disclosureRef !== null || resolutionRef !== null)) {
    fail("UNDISCLOSED must keep conflict references null", undefined, { field: conflictField });
  }
  if (["NONE_DECLARED", "UNRESOLVED"].includes(conflictState) && (disclosureRef === null || resolutionRef !== null)) {
    fail("conflict state requires disclosure without resolution", undefined, { field: conflictField });
  }
  if (conflictState === "RESOLVED" && (disclosureRef === null || resolutionRef === null)) {
    fail("RESOLVED requires disclosure and resolution references", undefined, { field: conflictField });
  }

  const signatureMethod = normalizeEnum(value.signatureMethod, SIGNATURE_METHOD_IDS, `${field}.signatureMethod`);
  let signedAt = null;
  let signatureReference = null;
  if (signatureMethod === "NOT_SIGNED") {
    if (value.signedAt !== null || value.signatureReference !== null) {
      fail("NOT_SIGNED must keep signedAt and signatureReference null", undefined, { field });
    }
  } else {
    signedAt = normalizeTimestamp(value.signedAt, `${field}.signedAt`);
    if (Date.parse(signedAt) < Date.parse(reviewedAt)) fail("signedAt cannot be before reviewedAt", undefined, { field: `${field}.signedAt` });
    const signatureField = `${field}.signatureReference`;
    assertExactKeys(value.signatureReference, ["referenceId", "sha256"], signatureField);
    signatureReference = {
      referenceId: normalizeReference(value.signatureReference.referenceId, `${signatureField}.referenceId`),
      sha256: normalizeSha256(value.signatureReference.sha256, `${signatureField}.sha256`),
    };
  }

  const attestationId = normalizeReference(value.attestationId, `${field}.attestationId`);
  const supersedesAttestationId = value.supersedesAttestationId === null
    ? null : normalizeReference(value.supersedesAttestationId, `${field}.supersedesAttestationId`);
  if (supersedesAttestationId === attestationId) fail("attestation cannot supersede itself", undefined, { field: `${field}.supersedesAttestationId` });
  const competenceScope = normalizeReferenceArray(value.competenceScope, `${field}.competenceScope`, { minimum: 1, maximum: 8 });
  const boundContentHash = normalizeSha256(value.reviewContentSha256, `${field}.reviewContentSha256`);
  if (boundContentHash !== reviewContentSha256) fail("reviewerAttestation does not bind review content", undefined, { field: `${field}.reviewContentSha256` });

  return {
    attestationId,
    reviewerName,
    reviewerReferenceId: normalizeReference(value.reviewerReferenceId, `${field}.reviewerReferenceId`),
    qualificationType: normalizeString(value.qualificationType, `${field}.qualificationType`, { maximum: 256 }),
    qualificationIssuer: normalizeString(value.qualificationIssuer, `${field}.qualificationIssuer`, { maximum: 256 }),
    qualificationReference: normalizeReference(value.qualificationReference, `${field}.qualificationReference`),
    qualificationVerifiedAt,
    qualificationValidAt,
    competenceScope,
    localeAndRegionFit,
    participatedInDrafting: normalizeBoolean(value.participatedInDrafting, `${field}.participatedInDrafting`),
    qualificationVerification: { state: verificationState, verifiedByName, verificationRef, verifiedAt },
    conflictOfInterest: { state: conflictState, disclosureRef, resolutionRef },
    reviewerContactRef: normalizeReference(value.reviewerContactRef, `${field}.reviewerContactRef`),
    reviewContentSha256: boundContentHash,
    signedAt,
    signatureMethod,
    signatureReference,
    supersedesAttestationId,
  };
}

function isStructurallyCompleteAttestation(attestation) {
  return attestation.participatedInDrafting === false &&
    attestation.qualificationVerification.state === "CALLER_ASSERTED_VERIFIED_BY_NAMED_NON_SELF" &&
    attestation.qualificationVerifiedAt !== null && attestation.qualificationValidAt !== null &&
    attestation.localeAndRegionFit.state === "PASS" &&
    ["NONE_DECLARED", "RESOLVED"].includes(attestation.conflictOfInterest.state) &&
    attestation.signatureMethod !== "NOT_SIGNED";
}

function validateScopeAndFindingLinks(items, findings, attestation) {
  const declaredScopes = new Set(attestation.competenceScope);
  for (const item of items) {
    const missingScopes = item.competenceScopeRefs.filter((scope) => !declaredScopes.has(scope));
    if (item.disposition === "OUT_OF_SCOPE") {
      if (missingScopes.length === 0) fail("OUT_OF_SCOPE must identify a scope outside reviewer competence", undefined, { field: `itemDispositions.${item.itemId}.competenceScopeRefs` });
    } else if (missingScopes.length > 0) {
      fail("reviewed item scope is outside reviewer competence", undefined, { field: `itemDispositions.${item.itemId}.competenceScopeRefs` });
    }
  }
  const findingById = new Map(findings.map((finding) => [finding.findingId, finding]));
  for (const item of items) {
    for (const findingId of item.findingIds) {
      const finding = findingById.get(findingId);
      if (!finding) fail("item references an unknown finding", undefined, { field: `itemDispositions.${item.itemId}.findingIds` });
      if (!finding.itemIds.includes(item.itemId)) fail("item/finding references are not bidirectional", undefined, { field: `itemDispositions.${item.itemId}.findingIds` });
    }
  }
  for (const finding of findings) {
    const referringItemIds = items.filter((item) => item.findingIds.includes(finding.findingId)).map((item) => item.itemId);
    if (!isDeepStrictEqual(referringItemIds, finding.itemIds)) {
      fail("finding/item references are not exact and bidirectional", undefined, { field: `findings.${finding.findingId}.itemIds` });
    }
  }
}

function deriveOverallDisposition(items, findings, attestation) {
  if (items.some(({ disposition }) => disposition === "REJECT") ||
    findings.some(({ severity, state }) => severity === "P0" && state === "OPEN")) return "REJECTED";
  if (items.some(({ disposition }) => disposition === "APPROVE_WITH_REQUIRED_CHANGE") ||
    findings.some(({ severity, state }) => ["P1", "P2"].includes(severity) && state === "OPEN")) return "CHANGES_REQUIRED";
  if (items.some(({ disposition }) => disposition === "OUT_OF_SCOPE") || !isStructurallyCompleteAttestation(attestation)) return "INCOMPLETE";
  return "HEALTH_REVIEW_APPROVAL_CANDIDATE";
}

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion", "recordKind", "reviewId", "packetIdentity", "reviewedArtifacts",
  "reviewerAttestation", "itemDispositions", "findings", "overallDisposition", "reviewedAt",
  "reviewDueAt", "supersedesReviewId", "containsCredential", "containsIdentityDocument",
  "containsSignatureMaterial", "reviewContentSha256", "bundleSha256",
]);

function normalizeContentCore(input) {
  const schemaVersion = normalizeString(input.schemaVersion, "schemaVersion");
  if (schemaVersion !== INPUT_SCHEMA_VERSION) fail("schemaVersion is unsupported", undefined, { field: "schemaVersion" });
  const recordKind = normalizeEnum(input.recordKind, RECORD_KINDS, "recordKind");
  const reviewId = normalizeReference(input.reviewId, "reviewId");
  const pattern = recordKind === "FORMAL_HEALTH_REVIEW_RECORD"
    ? /^D040-CHINA-HEALTH-REVIEW-R\d{3}$/ : /^D040-CHINA-HEALTH-SYNTHETIC-R\d{3}$/;
  if (!pattern.test(reviewId)) fail("reviewId does not match recordKind", undefined, { field: "reviewId" });
  const reviewedAt = normalizeTimestamp(input.reviewedAt, "reviewedAt");
  const reviewDueAt = normalizeTimestamp(input.reviewDueAt, "reviewDueAt");
  const reviewInterval = Date.parse(reviewDueAt) - Date.parse(reviewedAt);
  if (reviewInterval <= 0 || reviewInterval > 90 * 24 * 60 * 60 * 1_000) {
    fail("reviewDueAt must be after reviewedAt and within 90 days", undefined, { field: "reviewDueAt" });
  }
  const supersedesReviewId = input.supersedesReviewId === null
    ? null : normalizeReference(input.supersedesReviewId, "supersedesReviewId");
  if (supersedesReviewId !== null && (supersedesReviewId === reviewId || !pattern.test(supersedesReviewId))) {
    fail("supersedesReviewId is invalid for recordKind", undefined, { field: "supersedesReviewId" });
  }
  const containsCredential = normalizeBoolean(input.containsCredential, "containsCredential");
  const containsIdentityDocument = normalizeBoolean(input.containsIdentityDocument, "containsIdentityDocument");
  const containsSignatureMaterial = normalizeBoolean(input.containsSignatureMaterial, "containsSignatureMaterial");
  if (containsCredential || containsIdentityDocument || containsSignatureMaterial) {
    fail("review bundle cannot contain prohibited material", "UNSAFE_D040_CHINA_HEALTH_REVIEW_RECORD", { field: "containsProhibitedMaterial" });
  }
  return {
    schemaVersion,
    recordKind,
    reviewId,
    packetIdentity: normalizePacketIdentity(input.packetIdentity),
    reviewedArtifacts: normalizeReviewedArtifacts(input.reviewedArtifacts),
    itemDispositions: normalizeItemDispositions(input.itemDispositions),
    findings: normalizeFindings(input.findings, reviewedAt),
    overallDisposition: normalizeEnum(input.overallDisposition, OVERALL_DISPOSITION_IDS, "overallDisposition"),
    reviewedAt,
    reviewDueAt,
    supersedesReviewId,
    containsCredential,
    containsIdentityDocument,
    containsSignatureMaterial,
  };
}

function prepareInput(input) {
  assertDataTree(input);
  assertNoSensitiveMaterial(input);
  assertExactKeys(input, TOP_LEVEL_KEYS, "input");
}

function computeD040HealthReviewContentSha256(input) {
  prepareInput(input);
  return fingerprint(normalizeContentCore(input));
}

function normalizeWithoutBundleHash(input) {
  prepareInput(input);
  const contentCore = normalizeContentCore(input);
  const expectedContentSha256 = fingerprint(contentCore);
  const reviewContentSha256 = normalizeSha256(input.reviewContentSha256, "reviewContentSha256");
  if (reviewContentSha256 !== expectedContentSha256) fail("reviewContentSha256 does not bind normalized review content", undefined, { field: "reviewContentSha256" });
  const reviewerAttestation = normalizeReviewerAttestation(input.reviewerAttestation, {
    reviewContentSha256,
    reviewedAt: contentCore.reviewedAt,
  });
  validateScopeAndFindingLinks(contentCore.itemDispositions, contentCore.findings, reviewerAttestation);
  const derivedDisposition = deriveOverallDisposition(contentCore.itemDispositions, contentCore.findings, reviewerAttestation);
  if (contentCore.overallDisposition !== derivedDisposition) {
    fail("overallDisposition does not match recomputed review state", undefined, { field: "overallDisposition" });
  }
  return { ...contentCore, reviewContentSha256, reviewerAttestation };
}

function computeD040HealthReviewBundleSha256(input) {
  return fingerprint(normalizeWithoutBundleHash(input));
}

function normalizeD040HealthReviewRecord(input) {
  const normalizedWithoutBundleHash = normalizeWithoutBundleHash(input);
  const bundleSha256 = normalizeSha256(input.bundleSha256, "bundleSha256");
  if (bundleSha256 !== fingerprint(normalizedWithoutBundleHash)) {
    fail("bundleSha256 does not bind the complete review bundle", undefined, { field: "bundleSha256" });
  }
  return immutable({ ...normalizedWithoutBundleHash, bundleSha256 });
}

function evaluateD040HealthReviewRecord(input) {
  const normalized = normalizeD040HealthReviewRecord(input);
  const structurallyCompleteAttestation = isStructurallyCompleteAttestation(normalized.reviewerAttestation);
  const itemDispositionCounts = Object.fromEntries(ITEM_DISPOSITION_IDS.map((id) => [
    id,
    normalized.itemDispositions.filter(({ disposition }) => disposition === id).length,
  ]));
  const findingCounts = Object.fromEntries(SEVERITY_IDS.map((severity) => [severity, {
    open: normalized.findings.filter((finding) => finding.severity === severity && finding.state === "OPEN").length,
    closed: normalized.findings.filter((finding) => finding.severity === severity && finding.state === "CLOSED").length,
  }]));
  const wouldBeHealthReviewApprovalCandidate = normalized.overallDisposition === "HEALTH_REVIEW_APPROVAL_CANDIDATE";
  const healthReviewApprovalCandidate = normalized.recordKind === "FORMAL_HEALTH_REVIEW_RECORD" && wouldBeHealthReviewApprovalCandidate;
  const blockers = immutable([
    ...(normalized.recordKind === "SYNTHETIC_CONTRACT_FIXTURE" ? ["SYNTHETIC_CONTRACT_FIXTURE_ONLY"] : []),
    ...(normalized.overallDisposition === "REJECTED" ? ["HEALTH_REVIEW_REJECTED"] : []),
    ...(normalized.overallDisposition === "CHANGES_REQUIRED" ? ["HEALTH_REVIEW_CHANGES_REQUIRED"] : []),
    ...(normalized.overallDisposition === "INCOMPLETE" ? ["HEALTH_REVIEW_INCOMPLETE"] : []),
    "REVIEWER_IDENTITY_QUALIFICATION_COMPETENCE_LOCALE_AND_SIGNATURE_CALLER_ASSERTED_NOT_VERIFIED",
    "AUTHORITATIVE_HEALTH_REVIEW_EVENT_REQUIRED",
    "CONTENT_QA_REQUIRED",
    "D068_D069_D063_REMAIN_NOT_OWNER_READY",
    "OWNER_REVIEW_NOT_AUTHORIZED",
    "FORMAL_IMPLEMENTATION_NOT_AUTHORIZED",
  ]);
  const core = immutable({
    schemaVersion: RESULT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    disposition: normalized.recordKind === "SYNTHETIC_CONTRACT_FIXTURE"
      ? "SYNTHETIC_STRUCTURALLY_COMPLETE_FIXTURE_ONLY"
      : healthReviewApprovalCandidate
        ? "STRUCTURALLY_COMPLETE_HEALTH_REVIEW_ONLY"
        : "HEALTH_REVIEW_RECORD_BLOCKED",
    recordKind: normalized.recordKind,
    reviewId: normalized.reviewId,
    packetId: normalized.packetIdentity.packetId,
    packetVersion: normalized.packetIdentity.packetVersion,
    reviewedArtifactCount: normalized.reviewedArtifacts.length,
    reviewedItemCount: normalized.itemDispositions.length,
    competenceScopeCount: normalized.reviewerAttestation.competenceScope.length,
    structurallyCompleteAttestation,
    itemDispositionCounts,
    findingCounts,
    overallDisposition: normalized.overallDisposition,
    wouldBeHealthReviewApprovalCandidate,
    healthReviewApprovalCandidate,
    healthContentApproved: false,
    contentQaPassed: false,
    reviewContentSha256: normalized.reviewContentSha256,
    bundleSha256: normalized.bundleSha256,
    blockers,
    inputFingerprint: fingerprint(normalized),
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateD040HealthReviewRecordResult(result, input) {
  assertDataTree(result, "result");
  const expected = evaluateD040HealthReviewRecord(input);
  if (!isDeepStrictEqual(result, expected)) fail("D-040 health review result or fingerprint was changed");
  return expected;
}

export {
  BOUNDARY,
  CONFLICT_STATE_IDS,
  CONTRACT_ID,
  D040HealthReviewRecordError,
  INPUT_SCHEMA_VERSION,
  ITEM_DISPOSITION_IDS,
  ITEM_IDENTITIES,
  LOCALE_FIT_STATE_IDS,
  OVERALL_DISPOSITION_IDS,
  PACKET_IDENTITY,
  QUALIFICATION_VERIFICATION_STATE_IDS,
  RECORD_KINDS,
  RESULT_SCHEMA_VERSION,
  REVIEWED_ARTIFACTS,
  SEVERITY_IDS,
  SIGNATURE_METHOD_IDS,
  computeD040HealthReviewBundleSha256,
  computeD040HealthReviewContentSha256,
  evaluateD040HealthReviewRecord,
  normalizeD040HealthReviewRecord,
  validateD040HealthReviewRecordResult,
};
