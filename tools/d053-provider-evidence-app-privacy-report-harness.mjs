import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import {
  normalizeOi07ProviderTargetIntake,
  validateOi07ProviderTargetIntakeResult,
} from "./oi07-provider-target-intake-harness.mjs";

const INPUT_SCHEMA_VERSION = "D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT_INPUT_V1";
const RESULT_SCHEMA_VERSION = "D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT_RESULT_V1";
const BOUNDARY_SCHEMA_VERSION = "D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT_BOUNDARY_V1";
const CONTRACT_ID = "D053-PROVIDER-EVIDENCE-APP-PRIVACY-REPORT-CONTRACT-001";
const PROTOCOL_ID = "D053-PROVIDER-EVIDENCE-APP-PRIVACY-PROTOCOL-001";
const PROTOCOL_REVISION = "D053-PROTOCOL-R001";
const PROTOCOL_ARTIFACT_COMMIT = "d6e72dd449c8de8b385b6f9e6427cb0fd99f7ce7";
const PROTOCOL_ARTIFACT_BLOB_OID = "d422ad302e8d2c32fc9184557bf5f458693ceaad";
const PROTOCOL_ARTIFACT_SHA256 = "30ca6cb9e4c4878f1fb761fdd571f29a449d582a058dd9142200da0e60e3fe84";
const SOURCE_PACKET_VERSION = "PACKET-001-R1";
const SOURCE_CARD_COMMIT = "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117";
const SOURCE_CARD_BLOB_OID = "d406e17c8e7b0e11218a8907e757a603df01e465";
const SOURCE_CARD_SHA256 = "9c1cc88d34ec116f2825d6a71dd580ac8c625d99b30c87a8a06cf7086b894caf";

const PROVIDER_SLOTS = Object.freeze(["P1", "P2", "P3"]);
const PAYLOAD_CLASSES = Object.freeze([
  "nutrition_label_photo",
  "meal_photo",
  "meal_text",
  "trend_summary",
  "guidance_context",
]);
const EVIDENCE_DIMENSION_IDS = Object.freeze([
  "legal_entity_and_api_product",
  "terms_privacy_effective_version",
  "retention_and_backup",
  "training_and_model_improvement",
  "human_access",
  "deletion_revocation_and_sla",
  "advertising_marketing_tracking_broker",
  "health_data_use_and_repurpose",
  "subprocessors_regions_and_transfers",
  "app_privacy_and_policy_mapping",
]);
const POLICY_PACKAGES = Object.freeze(["A", "B", "C"]);
const DIMENSION_STATUSES = Object.freeze([
  "SUPPORTED_COMPATIBLE",
  "SUPPORTED_INCOMPATIBLE",
  "UNKNOWN",
  "EXPIRED",
]);
const PROFILE_DISPOSITIONS = Object.freeze([
  "A_COMPATIBLE_CANDIDATE",
  "B_REVIEWABLE_CANDIDATE",
  "DENY_BY_DOCUMENTED_FACT",
  "UNKNOWN_EVIDENCE_GAP_OR_CONFLICT",
  "EXPIRED_REASSESSMENT_REQUIRED",
  "NOT_ASSESSED",
]);
const COMPARISON_DISPOSITIONS = Object.freeze([
  ...PROFILE_DISPOSITIONS.filter((value) => value !== "NOT_ASSESSED"),
  "C_NOT_OWNER_READY",
]);
const MAPPING_DECISIONS = Object.freeze(["YES", "NO", "UNKNOWN", "EXPIRED"]);
const CONSISTENCY_STATES = Object.freeze(["CONSISTENT", "CONFLICT", "UNKNOWN", "EXPIRED"]);
const CHANGE_TRIGGER_IDS = Object.freeze([
  "TERMS_OR_PRIVACY_CHANGED",
  "DPA_OR_RETENTION_CHANGED",
  "SUBPROCESSOR_OR_DELETION_CHANGED",
  "OI07_OR_PROVIDER_TARGET_CHANGED",
  "ACCOUNT_CONTROL_OR_CREDENTIAL_OWNER_CHANGED",
  "PAYLOAD_SCHEMA_CHANGED",
  "D033_DISCLOSURE_CHANGED",
  "D034_BUDGET_CHANGED",
  "D036_TRANSPORT_PROFILE_CHANGED",
  "APP_PRIVACY_CLASSIFICATION_CHANGED",
  "PRIVACY_POLICY_OR_ASC_CHANGED",
  "RELEASE_REGION_OR_APP_VERSION_CHANGED",
]);

const BOUNDARY = deepFreeze({
  schemaVersion: BOUNDARY_SCHEMA_VERSION,
  contractStatus: "LOCAL_ONLY / NON_PRODUCTION / NO_ADMISSION",
  oi07Reads: 0,
  providerDocumentReads: 0,
  sourceSnapshotReads: 0,
  restrictedContractReads: 0,
  appStoreConnectReads: 0,
  privacyPolicyReads: 0,
  signatureReads: 0,
  independentReviewReads: 0,
  reportWrites: 0,
  networkRequests: 0,
  providerRequests: 0,
  credentialReads: 0,
  credentialWrites: 0,
  businessWrites: 0,
  externalMessagesSent: 0,
  oi07Complete: false,
  providerTargetsResolved: false,
  providerFactsVerified: false,
  providerEvidenceCollectionAuthorized: false,
  providerEvidenceCollectionStarted: false,
  sourceSnapshotsRecorded: false,
  sourceSnapshotsVerified: false,
  appPrivacyMappingStarted: false,
  appPrivacyMappingSigned: false,
  privacyPolicyPublicUrlAvailable: false,
  privacyChoicesUrlAvailable: false,
  appStoreConnectRecordAvailable: false,
  namedSignersVerified: false,
  independentReviewPassed: false,
  ownerReviewAuthorized: false,
  ownerChoiceRecorded: false,
  decisionAcceptedRecorded: false,
  d053Accepted: false,
  providerAdmissionGranted: false,
  sendAuthorization: "NOT_GRANTED",
  b05Closed: false,
  realNetworkAuthorized: false,
  formalImplementationAuthorized: false,
  px5ImplementationDorSatisfied: false,
});

function fail(message, code = "INVALID_D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT", details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function deepFreeze(value, seen = new Set()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(value);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function withoutField(value, field) {
  const copy = { ...value };
  delete copy[field];
  return copy;
}

function assertDataTree(value, field = "input", depth = 0, ancestors = new Set(), budget = { nodes: 0 }) {
  budget.nodes += 1;
  if (budget.nodes > 250_000 || depth > 18) fail("input resource boundary exceeded", undefined, { field });
  if (typeof value === "string") {
    if (value.length > 4_096) fail("string resource boundary exceeded", undefined, { field });
    if (
      /\b(?:sk|rk|pk)-[a-z0-9_-]{8,}\b/i.test(value) ||
      /\bbearer\s+\S+/i.test(value) ||
      /(?:api[_-]?key|access[_-]?token|authorization|password|secret|cookie|contract[_-]?account)\s*[:=]\s*\S+/i.test(value) ||
      /https?:\/\/[^\s?#]+[?&](?:key|token|signature|authorization|password|secret|cookie)=/i.test(value) ||
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(value)
    ) {
      fail("sensitive-looking material is forbidden", "UNSAFE_D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT", { field });
    }
    return;
  }
  if (value === null || ["boolean", "number"].includes(typeof value)) return;
  if (["undefined", "bigint", "function", "symbol"].includes(typeof value)) fail("unsupported input value", undefined, { field });
  if (ancestors.has(value)) fail("cyclic input is forbidden", undefined, { field });
  if (Array.isArray(value)) {
    if (value.length > 10_000) fail("array resource boundary exceeded", undefined, { field });
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (key === "length") continue;
      if (!descriptor.enumerable || descriptor.get || descriptor.set) fail("array contains non-data properties", undefined, { field });
    }
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) fail("special objects are forbidden", undefined, { field });
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
      if (!descriptor.enumerable || descriptor.get || descriptor.set) fail("object contains non-data properties", undefined, { field });
    }
  }
  if (Object.getOwnPropertySymbols(value).length > 0) fail("symbol keys are forbidden", undefined, { field });
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) assertDataTree(child, `${field}.${key}`, depth + 1, ancestors, budget);
  ancestors.delete(value);
}

function assertExactKeys(value, expectedKeys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("plain object required", undefined, { field });
  if (!isDeepStrictEqual(Object.keys(value).sort(), [...expectedKeys].sort())) {
    fail("object fields do not match the contract", undefined, { field });
  }
}

function normalizeString(value, field, maxLength = 256) {
  if (typeof value !== "string") fail("string required", undefined, { field });
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) fail("invalid string length", undefined, { field });
  return normalized;
}

function normalizePattern(value, field, pattern, maxLength = 256, allowUnknown = false) {
  const normalized = normalizeString(value, field, maxLength);
  if (allowUnknown && normalized === "UNKNOWN") return normalized;
  if (!pattern.test(normalized)) fail("string does not match the contract", undefined, { field });
  return normalized;
}

function normalizeEnum(value, allowed, field) {
  const normalized = normalizeString(value, field);
  if (!allowed.includes(normalized)) fail("unsupported enum value", undefined, { field });
  return normalized;
}

function normalizeSha256(value, field) {
  return normalizePattern(value, field, /^[a-f0-9]{64}$/, 64);
}

function normalizeSafeInteger(value, field, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) fail("safe integer outside allowed range", undefined, { field });
  return value;
}

function isValidTimestamp(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function normalizeTimestamp(value, field, { nullable = false, allowUnknown = false } = {}) {
  if (nullable && value === null) return null;
  const normalized = normalizeString(value, field, 64);
  if (allowUnknown && normalized === "UNKNOWN") return normalized;
  if (!isValidTimestamp(normalized)) fail("RFC 3339 timestamp required", undefined, { field });
  return normalized;
}

function normalizeNullableString(value, field, pattern = /^[A-Z0-9][A-Z0-9._:-]*$/, maxLength = 160) {
  if (value === null) return null;
  return normalizePattern(value, field, pattern, maxLength);
}

function normalizeIdArray(value, field, pattern = /^[A-Z0-9][A-Z0-9._:-]*$/, maximum = 512, minimum = 0) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) fail("bounded array required", undefined, { field });
  const normalized = value.map((item, index) => normalizePattern(item, `${field}[${index}]`, pattern, 160));
  if (new Set(normalized).size !== normalized.length) fail("duplicate array value", undefined, { field });
  return normalized;
}

function normalizeOrderedSubset(value, allowed, field, requireExact) {
  if (!Array.isArray(value) || value.length < 1 || value.length > allowed.length) fail("ordered non-empty subset required", undefined, { field });
  const normalized = value.map((item, index) => normalizeEnum(item, allowed, `${field}[${index}]`));
  if (new Set(normalized).size !== normalized.length) fail("duplicate ordered subset value", undefined, { field });
  const expected = allowed.filter((item) => normalized.includes(item));
  if (!isDeepStrictEqual(normalized, expected) || (requireExact && !isDeepStrictEqual(normalized, allowed))) {
    fail("ordered subset changed", undefined, { field });
  }
  return normalized;
}

function normalizePublicHttpsUrl(value, field, { allowUnknown = false } = {}) {
  const normalized = normalizeString(value, field, 1_024);
  if (allowUnknown && normalized === "UNKNOWN") return normalized;
  let url;
  try { url = new URL(normalized); } catch { fail("public HTTPS URL required", undefined, { field }); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || !url.hostname) {
    fail("public query-free HTTPS URL required", undefined, { field });
  }
  return normalized;
}

function computeD053ProviderEvidenceReportSha256(input) {
  return fingerprint(withoutField(input, "reportSha256"));
}

function normalizeProtocolIdentity(value) {
  assertExactKeys(value, [
    "protocolId", "protocolRevision", "protocolArtifactCommit", "protocolArtifactBlobOid", "protocolArtifactSha256",
    "sourcePacketVersion", "sourceCardCommit", "sourceCardBlobOid", "sourceCardSha256",
  ], "protocolIdentity");
  const normalized = {
    protocolId: normalizeString(value.protocolId, "protocolIdentity.protocolId"),
    protocolRevision: normalizeString(value.protocolRevision, "protocolIdentity.protocolRevision"),
    protocolArtifactCommit: normalizePattern(value.protocolArtifactCommit, "protocolIdentity.protocolArtifactCommit", /^[a-f0-9]{40}$/, 40),
    protocolArtifactBlobOid: normalizePattern(value.protocolArtifactBlobOid, "protocolIdentity.protocolArtifactBlobOid", /^[a-f0-9]{40}$/, 40),
    protocolArtifactSha256: normalizeSha256(value.protocolArtifactSha256, "protocolIdentity.protocolArtifactSha256"),
    sourcePacketVersion: normalizeString(value.sourcePacketVersion, "protocolIdentity.sourcePacketVersion"),
    sourceCardCommit: normalizePattern(value.sourceCardCommit, "protocolIdentity.sourceCardCommit", /^[a-f0-9]{40}$/, 40),
    sourceCardBlobOid: normalizePattern(value.sourceCardBlobOid, "protocolIdentity.sourceCardBlobOid", /^[a-f0-9]{40}$/, 40),
    sourceCardSha256: normalizeSha256(value.sourceCardSha256, "protocolIdentity.sourceCardSha256"),
  };
  const expected = {
    protocolId: PROTOCOL_ID,
    protocolRevision: PROTOCOL_REVISION,
    protocolArtifactCommit: PROTOCOL_ARTIFACT_COMMIT,
    protocolArtifactBlobOid: PROTOCOL_ARTIFACT_BLOB_OID,
    protocolArtifactSha256: PROTOCOL_ARTIFACT_SHA256,
    sourcePacketVersion: SOURCE_PACKET_VERSION,
    sourceCardCommit: SOURCE_CARD_COMMIT,
    sourceCardBlobOid: SOURCE_CARD_BLOB_OID,
    sourceCardSha256: SOURCE_CARD_SHA256,
  };
  if (!isDeepStrictEqual(normalized, expected)) fail("protocol identity changed", undefined, { field: "protocolIdentity" });
  return normalized;
}

function normalizeMatrixScope(value, recordKind) {
  assertExactKeys(value, [
    "providerSlots", "payloadClasses", "evidenceDimensionIds", "policyPackages", "requiredAdmissionProfileCount",
    "requiredDimensionAssessmentCount", "requiredPolicyPackageComparisonCount", "appPrivacyMappingRowMinimum", "applePolicySourceCount",
  ], "matrixScope");
  const formal = recordKind === "FORMAL_EVIDENCE_REPORT";
  const normalized = {
    providerSlots: normalizeOrderedSubset(value.providerSlots, PROVIDER_SLOTS, "matrixScope.providerSlots", formal),
    payloadClasses: normalizeOrderedSubset(value.payloadClasses, PAYLOAD_CLASSES, "matrixScope.payloadClasses", formal),
    evidenceDimensionIds: normalizeOrderedSubset(value.evidenceDimensionIds, EVIDENCE_DIMENSION_IDS, "matrixScope.evidenceDimensionIds", formal),
    policyPackages: normalizeOrderedSubset(value.policyPackages, POLICY_PACKAGES, "matrixScope.policyPackages", true),
    requiredAdmissionProfileCount: normalizeSafeInteger(value.requiredAdmissionProfileCount, "matrixScope.requiredAdmissionProfileCount", 1),
    requiredDimensionAssessmentCount: normalizeSafeInteger(value.requiredDimensionAssessmentCount, "matrixScope.requiredDimensionAssessmentCount", 1),
    requiredPolicyPackageComparisonCount: normalizeSafeInteger(value.requiredPolicyPackageComparisonCount, "matrixScope.requiredPolicyPackageComparisonCount", 1),
    appPrivacyMappingRowMinimum: normalizeSafeInteger(value.appPrivacyMappingRowMinimum, "matrixScope.appPrivacyMappingRowMinimum", 1),
    applePolicySourceCount: normalizeSafeInteger(value.applePolicySourceCount, "matrixScope.applePolicySourceCount", 1),
  };
  const profileCount = normalized.providerSlots.length * normalized.payloadClasses.length;
  if (
    normalized.requiredAdmissionProfileCount !== profileCount ||
    normalized.requiredDimensionAssessmentCount !== profileCount * normalized.evidenceDimensionIds.length ||
    normalized.requiredPolicyPackageComparisonCount !== profileCount * POLICY_PACKAGES.length
  ) fail("matrix counts do not match the Cartesian products", undefined, { field: "matrixScope" });
  if (formal && (profileCount !== 15 || normalized.requiredDimensionAssessmentCount !== 150 || normalized.requiredPolicyPackageComparisonCount !== 45 || normalized.appPrivacyMappingRowMinimum !== 5 || normalized.applePolicySourceCount !== 3)) {
    fail("formal D-053 matrix constants changed", undefined, { field: "matrixScope" });
  }
  if (!formal && normalized.providerSlots.length === 3 && normalized.payloadClasses.length === 5 && normalized.evidenceDimensionIds.length === 10) {
    fail("synthetic fixture must use a proper subset of the formal matrix", undefined, { field: "matrixScope" });
  }
  return normalized;
}

const TARGET_IDENTITY_FIELDS = Object.freeze([
  "providerSlot", "providerLegalEntity", "apiProductName", "apiProductPlan", "apiProductRevision", "accountType",
  "accountRegion", "intendedUserRegion", "baseUrl", "modelFamily", "accountDataControlState", "credentialOwner",
]);

function providerTargetCore(target, oi07Revision, oi07InputFingerprint, oi07ResultFingerprint) {
  return {
    oi07Revision,
    oi07InputFingerprint,
    oi07ResultFingerprint,
    ...Object.fromEntries(TARGET_IDENTITY_FIELDS.map((field) => [field, target[field]])),
  };
}

function computeD053ProviderTargetFingerprint(target, oi07Revision, oi07InputFingerprint, oi07ResultFingerprint) {
  return fingerprint(providerTargetCore(target, oi07Revision, oi07InputFingerprint, oi07ResultFingerprint));
}

function normalizeProviderTargets(value, matrixScope, oi07Intake, oi07IntakeResult) {
  if (!Array.isArray(value) || value.length !== matrixScope.providerSlots.length) fail("provider target count changed", undefined, { field: "providerTargets" });
  return value.map((target, index) => {
    const field = `providerTargets[${index}]`;
    assertExactKeys(target, [...TARGET_IDENTITY_FIELDS, "oi07Revision", "targetFingerprint"], field);
    const intakeTarget = oi07Intake.targets.find(({ providerSlot }) => providerSlot === matrixScope.providerSlots[index]);
    if (!intakeTarget) fail("provider target is absent from OI-07", undefined, { field });
    const normalized = {
      providerSlot: normalizeEnum(target.providerSlot, matrixScope.providerSlots, `${field}.providerSlot`),
      providerLegalEntity: normalizeString(target.providerLegalEntity, `${field}.providerLegalEntity`, 256),
      apiProductName: normalizeString(target.apiProductName, `${field}.apiProductName`, 256),
      apiProductPlan: normalizeString(target.apiProductPlan, `${field}.apiProductPlan`, 256),
      apiProductRevision: normalizeString(target.apiProductRevision, `${field}.apiProductRevision`, 256),
      accountType: normalizeString(target.accountType, `${field}.accountType`, 256),
      accountRegion: normalizeString(target.accountRegion, `${field}.accountRegion`, 256),
      intendedUserRegion: normalizeString(target.intendedUserRegion, `${field}.intendedUserRegion`, 256),
      baseUrl: normalizePublicHttpsUrl(target.baseUrl, `${field}.baseUrl`),
      modelFamily: normalizeString(target.modelFamily, `${field}.modelFamily`, 256),
      accountDataControlState: normalizeString(target.accountDataControlState, `${field}.accountDataControlState`, 512),
      credentialOwner: normalizeString(target.credentialOwner, `${field}.credentialOwner`, 256),
      oi07Revision: normalizePattern(target.oi07Revision, `${field}.oi07Revision`, /^OI07-R\d{3}$/, 16),
      targetFingerprint: normalizeSha256(target.targetFingerprint, `${field}.targetFingerprint`),
    };
    if (normalized.providerSlot !== matrixScope.providerSlots[index] || normalized.oi07Revision !== oi07Intake.oi07Revision) {
      fail("provider target order or OI-07 revision changed", undefined, { field });
    }
    for (const targetField of TARGET_IDENTITY_FIELDS) {
      if (normalized[targetField] !== intakeTarget[targetField]) fail("provider target differs from OI-07", undefined, { field: `${field}.${targetField}` });
    }
    const expectedFingerprint = computeD053ProviderTargetFingerprint(
      normalized,
      normalized.oi07Revision,
      oi07IntakeResult.inputFingerprint,
      oi07IntakeResult.resultFingerprint,
    );
    if (normalized.targetFingerprint !== expectedFingerprint) fail("provider target fingerprint changed", undefined, { field: `${field}.targetFingerprint` });
    return normalized;
  });
}

function normalizeSourceSnapshot(value, index, targetByFingerprint, recordKind) {
  const field = `sourceSnapshots[${index}]`;
  assertExactKeys(value, [
    "evidenceId", "providerTargetFingerprint", "sourceKind", "sourceUrlOrSecureReference", "finalUrl", "httpStatus",
    "observedAt", "documentTitle", "effectiveAt", "expiresAt", "applicableProductPlan", "applicableRegions",
    "canonicalSnapshotSha256", "claimIds", "supersedesEvidenceId", "replayState", "snapshotFingerprint",
  ], field);
  const sourceKinds = ["OFFICIAL_PUBLIC_HTTPS", "SECURE_SIGNED_REFERENCE", "OFFLINE_CANONICAL_SNAPSHOT", "SYNTHETIC_CONTRACT_SOURCE"];
  const sourceKind = normalizeEnum(value.sourceKind, sourceKinds, `${field}.sourceKind`);
  if ((recordKind === "SYNTHETIC_CONTRACT_FIXTURE") !== (sourceKind === "SYNTHETIC_CONTRACT_SOURCE")) {
    fail("synthetic and formal source kinds cannot be mixed", undefined, { field: `${field}.sourceKind` });
  }
  const sourceUrlOrSecureReference = sourceKind === "SECURE_SIGNED_REFERENCE"
    ? normalizePattern(value.sourceUrlOrSecureReference, `${field}.sourceUrlOrSecureReference`, /^SECURE-REF:[A-Z0-9._:-]+$/, 256)
    : normalizePublicHttpsUrl(value.sourceUrlOrSecureReference, `${field}.sourceUrlOrSecureReference`);
  const finalUrl = sourceKind === "SECURE_SIGNED_REFERENCE"
    ? normalizePattern(value.finalUrl, `${field}.finalUrl`, /^SECURE-REF:[A-Z0-9._:-]+$/, 256)
    : normalizePublicHttpsUrl(value.finalUrl, `${field}.finalUrl`);
  const normalized = {
    evidenceId: normalizePattern(value.evidenceId, `${field}.evidenceId`, /^D053-EV-[A-Z0-9._-]+$/, 96),
    providerTargetFingerprint: normalizeSha256(value.providerTargetFingerprint, `${field}.providerTargetFingerprint`),
    sourceKind,
    sourceUrlOrSecureReference,
    finalUrl,
    httpStatus: normalizeSafeInteger(value.httpStatus, `${field}.httpStatus`, 0, 599),
    observedAt: normalizeTimestamp(value.observedAt, `${field}.observedAt`),
    documentTitle: normalizeString(value.documentTitle, `${field}.documentTitle`, 512),
    effectiveAt: normalizeTimestamp(value.effectiveAt, `${field}.effectiveAt`, { allowUnknown: true }),
    expiresAt: normalizeTimestamp(value.expiresAt, `${field}.expiresAt`, { allowUnknown: true }),
    applicableProductPlan: normalizeString(value.applicableProductPlan, `${field}.applicableProductPlan`, 256),
    applicableRegions: normalizeIdArray(value.applicableRegions, `${field}.applicableRegions`, /^[A-Z0-9][A-Z0-9._-]*$/, 32, 1),
    canonicalSnapshotSha256: normalizeSha256(value.canonicalSnapshotSha256, `${field}.canonicalSnapshotSha256`),
    claimIds: normalizeIdArray(value.claimIds, `${field}.claimIds`, /^D053-CLAIM-[A-Z0-9._-]+$/, 256, 1),
    supersedesEvidenceId: normalizeNullableString(value.supersedesEvidenceId, `${field}.supersedesEvidenceId`, /^D053-EV-[A-Z0-9._-]+$/, 96),
    replayState: normalizeEnum(value.replayState, ["CALLER_ASSERTED_REPLAYABLE", "NOT_REPLAYABLE", "SYNTHETIC_ONLY"], `${field}.replayState`),
    snapshotFingerprint: normalizeSha256(value.snapshotFingerprint, `${field}.snapshotFingerprint`),
  };
  const target = targetByFingerprint.get(normalized.providerTargetFingerprint);
  if (!target) fail("source snapshot references an unknown Provider target", undefined, { field: `${field}.providerTargetFingerprint` });
  if (normalized.applicableProductPlan !== target.apiProductPlan || !normalized.applicableRegions.includes(target.intendedUserRegion)) {
    fail("source snapshot product plan or region does not cover its target", undefined, { field });
  }
  if (sourceKind === "SECURE_SIGNED_REFERENCE" ? normalized.httpStatus !== 0 : normalized.httpStatus < 200 || normalized.httpStatus > 399) {
    fail("source snapshot HTTP status is inconsistent with source kind", undefined, { field: `${field}.httpStatus` });
  }
  if (recordKind === "SYNTHETIC_CONTRACT_FIXTURE" && normalized.replayState !== "SYNTHETIC_ONLY") fail("synthetic source replay state changed", undefined, { field });
  if (recordKind === "FORMAL_EVIDENCE_REPORT" && normalized.replayState === "SYNTHETIC_ONLY") fail("formal source cannot use synthetic replay state", undefined, { field });
  if (normalized.snapshotFingerprint !== fingerprint(withoutField(normalized, "snapshotFingerprint"))) fail("source snapshot fingerprint changed", undefined, { field: `${field}.snapshotFingerprint` });
  return normalized;
}

function normalizeConflict(value, index, targetByFingerprint) {
  const field = `conflicts[${index}]`;
  assertExactKeys(value, [
    "conflictId", "providerTargetFingerprint", "evidenceIds", "claimIds", "status", "resolutionDisposition",
    "resolverRef", "resolvedAt", "summarySha256", "conflictFingerprint",
  ], field);
  const normalized = {
    conflictId: normalizePattern(value.conflictId, `${field}.conflictId`, /^D053-CONFLICT-[A-Z0-9._-]+$/, 96),
    providerTargetFingerprint: normalizeSha256(value.providerTargetFingerprint, `${field}.providerTargetFingerprint`),
    evidenceIds: normalizeIdArray(value.evidenceIds, `${field}.evidenceIds`, /^D053-EV-[A-Z0-9._-]+$/, 32, 2),
    claimIds: normalizeIdArray(value.claimIds, `${field}.claimIds`, /^D053-CLAIM-[A-Z0-9._-]+$/, 64, 1),
    status: normalizeEnum(value.status, ["OPEN", "RESOLVED"], `${field}.status`),
    resolutionDisposition: normalizeNullableString(value.resolutionDisposition, `${field}.resolutionDisposition`, /^[A-Z][A-Z0-9_]*$/, 96),
    resolverRef: normalizeNullableString(value.resolverRef, `${field}.resolverRef`),
    resolvedAt: normalizeTimestamp(value.resolvedAt, `${field}.resolvedAt`, { nullable: true }),
    summarySha256: normalizeSha256(value.summarySha256, `${field}.summarySha256`),
    conflictFingerprint: normalizeSha256(value.conflictFingerprint, `${field}.conflictFingerprint`),
  };
  if (!targetByFingerprint.has(normalized.providerTargetFingerprint)) fail("conflict references unknown target", undefined, { field });
  const resolutionFields = [normalized.resolutionDisposition, normalized.resolverRef, normalized.resolvedAt];
  if (normalized.status === "RESOLVED" ? resolutionFields.some((item) => item === null) : resolutionFields.some((item) => item !== null)) {
    fail("conflict resolution fields do not match status", undefined, { field });
  }
  if (normalized.conflictFingerprint !== fingerprint(withoutField(normalized, "conflictFingerprint"))) fail("conflict fingerprint changed", undefined, { field });
  return normalized;
}

function expectedProfileDescriptors(matrixScope) {
  return matrixScope.providerSlots.flatMap((providerSlot) => matrixScope.payloadClasses.map((payloadClass) => ({
    profileId: `D053-PROFILE-${providerSlot}-${payloadClass.toUpperCase()}`,
    providerSlot,
    payloadClass,
  })));
}

function normalizeAdmissionProfile(value, index, expected, targetBySlot) {
  const field = `admissionProfiles[${index}]`;
  assertExactKeys(value, [
    "profileId", "oi07Revision", "providerSlot", "providerTargetFingerprint", "payloadClass", "intendedUserRegion",
    "candidatePolicyPackage", "appPrivacyMappingRef", "privacyPolicyMappingRef", "d033DisclosureMappingRef",
    "sourceSnapshotRefs", "conflictIds", "expiryAt", "profileDisposition", "reviewRefs", "profileFingerprint",
  ], field);
  const normalized = {
    profileId: normalizePattern(value.profileId, `${field}.profileId`, /^D053-PROFILE-P[123]-[A-Z0-9_]+$/, 96),
    oi07Revision: normalizePattern(value.oi07Revision, `${field}.oi07Revision`, /^OI07-R\d{3}$/, 16),
    providerSlot: normalizeEnum(value.providerSlot, PROVIDER_SLOTS, `${field}.providerSlot`),
    providerTargetFingerprint: normalizeSha256(value.providerTargetFingerprint, `${field}.providerTargetFingerprint`),
    payloadClass: normalizeEnum(value.payloadClass, PAYLOAD_CLASSES, `${field}.payloadClass`),
    intendedUserRegion: normalizePattern(value.intendedUserRegion, `${field}.intendedUserRegion`, /^[A-Z0-9][A-Z0-9._-]*$/, 64),
    candidatePolicyPackage: normalizeEnum(value.candidatePolicyPackage, POLICY_PACKAGES, `${field}.candidatePolicyPackage`),
    appPrivacyMappingRef: normalizePattern(value.appPrivacyMappingRef, `${field}.appPrivacyMappingRef`, /^D053-AP-[A-Z0-9._-]+$/, 96),
    privacyPolicyMappingRef: normalizePattern(value.privacyPolicyMappingRef, `${field}.privacyPolicyMappingRef`, /^D053-PP-[A-Z0-9._-]+$/, 96),
    d033DisclosureMappingRef: normalizePattern(value.d033DisclosureMappingRef, `${field}.d033DisclosureMappingRef`, /^D053-D033-[A-Z0-9._-]+$/, 96),
    sourceSnapshotRefs: normalizeIdArray(value.sourceSnapshotRefs, `${field}.sourceSnapshotRefs`, /^D053-EV-[A-Z0-9._-]+$/, 256),
    conflictIds: normalizeIdArray(value.conflictIds, `${field}.conflictIds`, /^D053-CONFLICT-[A-Z0-9._-]+$/, 128),
    expiryAt: normalizeTimestamp(value.expiryAt, `${field}.expiryAt`),
    profileDisposition: normalizeEnum(value.profileDisposition, PROFILE_DISPOSITIONS, `${field}.profileDisposition`),
    reviewRefs: normalizeIdArray(value.reviewRefs, `${field}.reviewRefs`, /^[A-Z0-9][A-Z0-9._:-]*$/, 64),
    profileFingerprint: normalizeSha256(value.profileFingerprint, `${field}.profileFingerprint`),
  };
  if (!isDeepStrictEqual(
    { profileId: normalized.profileId, providerSlot: normalized.providerSlot, payloadClass: normalized.payloadClass },
    expected,
  )) fail("profile Cartesian order or identity changed", undefined, { field });
  const target = targetBySlot.get(normalized.providerSlot);
  if (!target || normalized.providerTargetFingerprint !== target.targetFingerprint || normalized.oi07Revision !== target.oi07Revision || normalized.intendedUserRegion !== target.intendedUserRegion) {
    fail("profile target binding changed", undefined, { field });
  }
  if (normalized.profileFingerprint !== fingerprint(withoutField(normalized, "profileFingerprint"))) fail("profile fingerprint changed", undefined, { field });
  return normalized;
}

function normalizeDimensionAssessment(value, index, expected, profileById) {
  const field = `dimensionAssessments[${index}]`;
  assertExactKeys(value, [
    "assessmentId", "profileId", "evidenceDimensionId", "status", "riskTreatment", "rationaleSha256", "evidenceRefs",
    "conflictRefs", "assessedAt", "expiresAt", "assessmentFingerprint",
  ], field);
  const normalized = {
    assessmentId: normalizePattern(value.assessmentId, `${field}.assessmentId`, /^D053-ASSESS-[A-Z0-9._-]+$/, 128),
    profileId: normalizePattern(value.profileId, `${field}.profileId`, /^D053-PROFILE-P[123]-[A-Z0-9_]+$/, 96),
    evidenceDimensionId: normalizeEnum(value.evidenceDimensionId, EVIDENCE_DIMENSION_IDS, `${field}.evidenceDimensionId`),
    status: normalizeEnum(value.status, DIMENSION_STATUSES, `${field}.status`),
    riskTreatment: normalizeEnum(value.riskTreatment, ["NONE", "NON_WAIVABLE", "BOUNDED_RESIDUAL"], `${field}.riskTreatment`),
    rationaleSha256: normalizeSha256(value.rationaleSha256, `${field}.rationaleSha256`),
    evidenceRefs: normalizeIdArray(value.evidenceRefs, `${field}.evidenceRefs`, /^D053-EV-[A-Z0-9._-]+$/, 128),
    conflictRefs: normalizeIdArray(value.conflictRefs, `${field}.conflictRefs`, /^D053-CONFLICT-[A-Z0-9._-]+$/, 128),
    assessedAt: normalizeTimestamp(value.assessedAt, `${field}.assessedAt`),
    expiresAt: normalizeTimestamp(value.expiresAt, `${field}.expiresAt`),
    assessmentFingerprint: normalizeSha256(value.assessmentFingerprint, `${field}.assessmentFingerprint`),
  };
  if (normalized.profileId !== expected.profileId || normalized.evidenceDimensionId !== expected.evidenceDimensionId || !profileById.has(normalized.profileId)) {
    fail("dimension assessment order or identity changed", undefined, { field });
  }
  if (normalized.status === "SUPPORTED_INCOMPATIBLE" ? normalized.riskTreatment === "NONE" : normalized.riskTreatment !== "NONE") {
    fail("dimension risk treatment does not match status", undefined, { field });
  }
  if (["SUPPORTED_COMPATIBLE", "SUPPORTED_INCOMPATIBLE", "EXPIRED"].includes(normalized.status) && normalized.evidenceRefs.length === 0) {
    fail("dimension conclusion requires source evidence", undefined, { field: `${field}.evidenceRefs` });
  }
  if (normalized.assessmentFingerprint !== fingerprint(withoutField(normalized, "assessmentFingerprint"))) fail("assessment fingerprint changed", undefined, { field });
  return normalized;
}

function normalizeSignature(value, index) {
  const field = `signatures[${index}]`;
  assertExactKeys(value, [
    "signatureId", "role", "signerRef", "signedArtifactSha256", "signatureMethod", "signedAt", "callerAsserted", "signatureFingerprint",
  ], field);
  const normalized = {
    signatureId: normalizePattern(value.signatureId, `${field}.signatureId`, /^D053-SIG-[A-Z0-9._-]+$/, 96),
    role: normalizeEnum(value.role, ["PRODUCT", "PRIVACY_SECURITY", "RELEASE"], `${field}.role`),
    signerRef: normalizePattern(value.signerRef, `${field}.signerRef`, /^[A-Z0-9][A-Z0-9._:-]*$/, 160),
    signedArtifactSha256: normalizeSha256(value.signedArtifactSha256, `${field}.signedArtifactSha256`),
    signatureMethod: normalizeEnum(value.signatureMethod, ["SIGNED_DOCUMENT_REFERENCE", "APPROVED_WORKFLOW_RECORD"], `${field}.signatureMethod`),
    signedAt: normalizeTimestamp(value.signedAt, `${field}.signedAt`),
    callerAsserted: value.callerAsserted,
    signatureFingerprint: normalizeSha256(value.signatureFingerprint, `${field}.signatureFingerprint`),
  };
  if (normalized.callerAsserted !== true) fail("signature must remain explicitly caller asserted", undefined, { field });
  if (normalized.signatureFingerprint !== fingerprint(withoutField(normalized, "signatureFingerprint"))) fail("signature fingerprint changed", undefined, { field });
  return normalized;
}

function normalizeSignatureRef(value, field) {
  if (value === null) return null;
  return normalizePattern(value, field, /^D053-SIG-[A-Z0-9._-]+$/, 96);
}

function normalizeStringArray(value, field, maximum = 64, minimum = 0) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) fail("bounded string array required", undefined, { field });
  const normalized = value.map((item, index) => normalizeString(item, `${field}[${index}]`, 160));
  if (new Set(normalized).size !== normalized.length) fail("duplicate string array value", undefined, { field });
  return normalized;
}

function normalizeAppPrivacyMapping(value, index, profileById, targetByFingerprint) {
  const field = `appPrivacyMappingRows[${index}]`;
  assertExactKeys(value, [
    "mappingRowId", "payloadClass", "transmittedElementSha256", "sourceDataOrigin", "appleDataTypeCandidates",
    "finalAppleDataTypes", "thirdPartyRecipient", "providerTargetFingerprint", "collectionDecision", "collectionRationaleEvidenceRefs",
    "linkedDecision", "linkedRationaleEvidenceRefs", "trackingDecision", "trackingRationaleEvidenceRefs", "purposes",
    "retentionAndDeletionSummarySha256", "privacyPolicyClauseRefs", "privacyChoicesOrDeletionRefs", "d033DisclosureFieldRefs",
    "providerProfileRefs", "productSignatureRef", "privacySecuritySignatureRef", "releaseSignatureRef", "signedAt", "mappingFingerprint",
  ], field);
  const normalized = {
    mappingRowId: normalizePattern(value.mappingRowId, `${field}.mappingRowId`, /^D053-AP-[A-Z0-9._-]+$/, 96),
    payloadClass: normalizeEnum(value.payloadClass, PAYLOAD_CLASSES, `${field}.payloadClass`),
    transmittedElementSha256: normalizeSha256(value.transmittedElementSha256, `${field}.transmittedElementSha256`),
    sourceDataOrigin: normalizeEnum(value.sourceDataOrigin, ["LOCAL_USER_INPUT", "LOCAL_DERIVED_SUMMARY"], `${field}.sourceDataOrigin`),
    appleDataTypeCandidates: normalizeStringArray(value.appleDataTypeCandidates, `${field}.appleDataTypeCandidates`, 32, 1),
    finalAppleDataTypes: normalizeStringArray(value.finalAppleDataTypes, `${field}.finalAppleDataTypes`, 32),
    thirdPartyRecipient: normalizeString(value.thirdPartyRecipient, `${field}.thirdPartyRecipient`, 256),
    providerTargetFingerprint: normalizeSha256(value.providerTargetFingerprint, `${field}.providerTargetFingerprint`),
    collectionDecision: normalizeEnum(value.collectionDecision, MAPPING_DECISIONS, `${field}.collectionDecision`),
    collectionRationaleEvidenceRefs: normalizeIdArray(value.collectionRationaleEvidenceRefs, `${field}.collectionRationaleEvidenceRefs`, /^D053-EV-[A-Z0-9._-]+$/, 128),
    linkedDecision: normalizeEnum(value.linkedDecision, MAPPING_DECISIONS, `${field}.linkedDecision`),
    linkedRationaleEvidenceRefs: normalizeIdArray(value.linkedRationaleEvidenceRefs, `${field}.linkedRationaleEvidenceRefs`, /^D053-EV-[A-Z0-9._-]+$/, 128),
    trackingDecision: normalizeEnum(value.trackingDecision, MAPPING_DECISIONS, `${field}.trackingDecision`),
    trackingRationaleEvidenceRefs: normalizeIdArray(value.trackingRationaleEvidenceRefs, `${field}.trackingRationaleEvidenceRefs`, /^D053-EV-[A-Z0-9._-]+$/, 128),
    purposes: normalizeStringArray(value.purposes, `${field}.purposes`, 32, 1),
    retentionAndDeletionSummarySha256: normalizeSha256(value.retentionAndDeletionSummarySha256, `${field}.retentionAndDeletionSummarySha256`),
    privacyPolicyClauseRefs: normalizeIdArray(value.privacyPolicyClauseRefs, `${field}.privacyPolicyClauseRefs`, /^[A-Z0-9][A-Z0-9._:-]*$/, 64),
    privacyChoicesOrDeletionRefs: normalizeIdArray(value.privacyChoicesOrDeletionRefs, `${field}.privacyChoicesOrDeletionRefs`, /^[A-Z0-9][A-Z0-9._:-]*$/, 64),
    d033DisclosureFieldRefs: normalizeIdArray(value.d033DisclosureFieldRefs, `${field}.d033DisclosureFieldRefs`, /^[A-Z0-9][A-Z0-9._:-]*$/, 64),
    providerProfileRefs: normalizeIdArray(value.providerProfileRefs, `${field}.providerProfileRefs`, /^D053-PROFILE-P[123]-[A-Z0-9_]+$/, 16, 1),
    productSignatureRef: normalizeSignatureRef(value.productSignatureRef, `${field}.productSignatureRef`),
    privacySecuritySignatureRef: normalizeSignatureRef(value.privacySecuritySignatureRef, `${field}.privacySecuritySignatureRef`),
    releaseSignatureRef: normalizeSignatureRef(value.releaseSignatureRef, `${field}.releaseSignatureRef`),
    signedAt: normalizeTimestamp(value.signedAt, `${field}.signedAt`, { nullable: true }),
    mappingFingerprint: normalizeSha256(value.mappingFingerprint, `${field}.mappingFingerprint`),
  };
  const target = targetByFingerprint.get(normalized.providerTargetFingerprint);
  if (!target) fail("App Privacy mapping references unknown target", undefined, { field });
  for (const profileId of normalized.providerProfileRefs) {
    const profile = profileById.get(profileId);
    if (!profile || profile.providerTargetFingerprint !== normalized.providerTargetFingerprint || profile.payloadClass !== normalized.payloadClass) {
      fail("App Privacy mapping profile scope changed", undefined, { field });
    }
  }
  const decisionRefs = [
    [normalized.collectionDecision, normalized.collectionRationaleEvidenceRefs],
    [normalized.linkedDecision, normalized.linkedRationaleEvidenceRefs],
    [normalized.trackingDecision, normalized.trackingRationaleEvidenceRefs],
  ];
  for (const [decision, refs] of decisionRefs) {
    if (["YES", "NO", "EXPIRED"].includes(decision) && refs.length === 0) fail("mapping decision requires evidence", undefined, { field });
  }
  const signatureRefs = [normalized.productSignatureRef, normalized.privacySecuritySignatureRef, normalized.releaseSignatureRef];
  if (signatureRefs.every((item) => item !== null) !== (normalized.signedAt !== null)) fail("mapping signature refs and signedAt are inconsistent", undefined, { field });
  if (normalized.mappingFingerprint !== fingerprint(withoutField(normalized, "mappingFingerprint"))) fail("App Privacy mapping fingerprint changed", undefined, { field });
  return normalized;
}

function normalizePolicyOrDisclosureMapping(value, index, kind, profileById) {
  const prefix = kind === "PRIVACY" ? "privacyPolicyMappings" : "d033DisclosureMappings";
  const field = `${prefix}[${index}]`;
  const idField = kind === "PRIVACY" ? "privacyPolicyMappingId" : "d033DisclosureMappingId";
  const idPattern = kind === "PRIVACY" ? /^D053-PP-[A-Z0-9._-]+$/ : /^D053-D033-[A-Z0-9._-]+$/;
  const extraFields = kind === "PRIVACY"
    ? ["publicPrivacyPolicyUrl", "privacyChoicesUrl", "clauseRefs"]
    : ["disclosureFieldRefs"];
  assertExactKeys(value, [
    idField, "profileId", ...extraFields, "appPrivacyMappingRefs", "consistencyState", "evidenceRefs", "productSignatureRef",
    "privacySecuritySignatureRef", "releaseSignatureRef", "signedAt", "mappingFingerprint",
  ], field);
  const normalized = {
    [idField]: normalizePattern(value[idField], `${field}.${idField}`, idPattern, 96),
    profileId: normalizePattern(value.profileId, `${field}.profileId`, /^D053-PROFILE-P[123]-[A-Z0-9_]+$/, 96),
    ...(kind === "PRIVACY" ? {
      publicPrivacyPolicyUrl: normalizePublicHttpsUrl(value.publicPrivacyPolicyUrl, `${field}.publicPrivacyPolicyUrl`, { allowUnknown: true }),
      privacyChoicesUrl: normalizePublicHttpsUrl(value.privacyChoicesUrl, `${field}.privacyChoicesUrl`, { allowUnknown: true }),
      clauseRefs: normalizeIdArray(value.clauseRefs, `${field}.clauseRefs`, /^[A-Z0-9][A-Z0-9._:-]*$/, 64),
    } : {
      disclosureFieldRefs: normalizeIdArray(value.disclosureFieldRefs, `${field}.disclosureFieldRefs`, /^[A-Z0-9][A-Z0-9._:-]*$/, 64),
    }),
    appPrivacyMappingRefs: normalizeIdArray(value.appPrivacyMappingRefs, `${field}.appPrivacyMappingRefs`, /^D053-AP-[A-Z0-9._-]+$/, 64, 1),
    consistencyState: normalizeEnum(value.consistencyState, CONSISTENCY_STATES, `${field}.consistencyState`),
    evidenceRefs: normalizeIdArray(value.evidenceRefs, `${field}.evidenceRefs`, /^D053-EV-[A-Z0-9._-]+$/, 128),
    productSignatureRef: normalizeSignatureRef(value.productSignatureRef, `${field}.productSignatureRef`),
    privacySecuritySignatureRef: normalizeSignatureRef(value.privacySecuritySignatureRef, `${field}.privacySecuritySignatureRef`),
    releaseSignatureRef: normalizeSignatureRef(value.releaseSignatureRef, `${field}.releaseSignatureRef`),
    signedAt: normalizeTimestamp(value.signedAt, `${field}.signedAt`, { nullable: true }),
    mappingFingerprint: normalizeSha256(value.mappingFingerprint, `${field}.mappingFingerprint`),
  };
  if (!profileById.has(normalized.profileId)) fail("mapping references unknown profile", undefined, { field });
  if (normalized.consistencyState === "CONSISTENT" && normalized.evidenceRefs.length === 0) fail("consistent mapping requires evidence", undefined, { field });
  const signatureRefs = [normalized.productSignatureRef, normalized.privacySecuritySignatureRef, normalized.releaseSignatureRef];
  if (signatureRefs.every((item) => item !== null) !== (normalized.signedAt !== null)) fail("mapping signature refs and signedAt are inconsistent", undefined, { field });
  if (normalized.mappingFingerprint !== fingerprint(withoutField(normalized, "mappingFingerprint"))) fail("mapping fingerprint changed", undefined, { field });
  return normalized;
}

function normalizeFinding(value, index) {
  const field = `findings[${index}]`;
  assertExactKeys(value, [
    "findingId", "severity", "status", "profileIds", "assessmentIds", "mappingRowIds", "conflictIds", "ownerRef", "dueAt",
    "nonBlockingRationaleSha256", "summarySha256", "findingFingerprint",
  ], field);
  const normalized = {
    findingId: normalizePattern(value.findingId, `${field}.findingId`, /^D053-FINDING-[A-Z0-9._-]+$/, 96),
    severity: normalizeEnum(value.severity, ["P0", "P1", "P2", "P3"], `${field}.severity`),
    status: normalizeEnum(value.status, ["OPEN", "CLOSED"], `${field}.status`),
    profileIds: normalizeIdArray(value.profileIds, `${field}.profileIds`, /^D053-PROFILE-P[123]-[A-Z0-9_]+$/, 64),
    assessmentIds: normalizeIdArray(value.assessmentIds, `${field}.assessmentIds`, /^D053-ASSESS-[A-Z0-9._-]+$/, 256),
    mappingRowIds: normalizeIdArray(value.mappingRowIds, `${field}.mappingRowIds`, /^D053-AP-[A-Z0-9._-]+$/, 128),
    conflictIds: normalizeIdArray(value.conflictIds, `${field}.conflictIds`, /^D053-CONFLICT-[A-Z0-9._-]+$/, 128),
    ownerRef: normalizeNullableString(value.ownerRef, `${field}.ownerRef`),
    dueAt: normalizeTimestamp(value.dueAt, `${field}.dueAt`, { nullable: true }),
    nonBlockingRationaleSha256: value.nonBlockingRationaleSha256 === null ? null : normalizeSha256(value.nonBlockingRationaleSha256, `${field}.nonBlockingRationaleSha256`),
    summarySha256: normalizeSha256(value.summarySha256, `${field}.summarySha256`),
    findingFingerprint: normalizeSha256(value.findingFingerprint, `${field}.findingFingerprint`),
  };
  if (normalized.status === "OPEN" && (normalized.ownerRef === null || normalized.dueAt === null)) fail("open finding requires owner and due time", undefined, { field });
  if (normalized.status === "OPEN" && normalized.severity === "P3" && normalized.nonBlockingRationaleSha256 === null) fail("open P3 requires a non-blocking rationale", undefined, { field });
  if (normalized.severity !== "P3" && normalized.nonBlockingRationaleSha256 !== null) fail("only P3 may carry a non-blocking rationale", undefined, { field });
  if (normalized.findingFingerprint !== fingerprint(withoutField(normalized, "findingFingerprint"))) fail("finding fingerprint changed", undefined, { field });
  return normalized;
}

function normalizeIndependentReviewRef(value, index) {
  const field = `independentReviewRefs[${index}]`;
  assertExactKeys(value, ["reviewId", "reviewerRole", "reviewedArtifactSha256", "disposition", "signedAt", "summarySha256"], field);
  return {
    reviewId: normalizePattern(value.reviewId, `${field}.reviewId`, /^D053-REVIEW-[A-Z0-9._-]+$/, 96),
    reviewerRole: normalizeEnum(value.reviewerRole, ["PRIVACY_SECURITY", "RELEASE", "CROSS_CARD_INDEPENDENT_REVIEWER"], `${field}.reviewerRole`),
    reviewedArtifactSha256: normalizeSha256(value.reviewedArtifactSha256, `${field}.reviewedArtifactSha256`),
    disposition: normalizeEnum(value.disposition, ["APPROVE_EVIDENCE", "REJECT", "INCONCLUSIVE"], `${field}.disposition`),
    signedAt: normalizeTimestamp(value.signedAt, `${field}.signedAt`),
    summarySha256: normalizeSha256(value.summarySha256, `${field}.summarySha256`),
  };
}

function mappingSignedAndConsistent(profile, appMapping, privacyMapping, d033Mapping, signatureById) {
  if (!appMapping || !privacyMapping || !d033Mapping) return false;
  if (privacyMapping.consistencyState !== "CONSISTENT" || d033Mapping.consistencyState !== "CONSISTENT") return false;
  if ([appMapping.collectionDecision, appMapping.linkedDecision, appMapping.trackingDecision].some((value) => ["UNKNOWN", "EXPIRED"].includes(value))) return false;
  if (appMapping.finalAppleDataTypes.length === 0) return false;
  const records = [appMapping, privacyMapping, d033Mapping];
  return records.every((record) => {
    const refs = [record.productSignatureRef, record.privacySecuritySignatureRef, record.releaseSignatureRef];
    if (refs.some((ref) => ref === null) || record.signedAt === null) return false;
    return signatureById.get(refs[0])?.role === "PRODUCT" &&
      signatureById.get(refs[1])?.role === "PRIVACY_SECURITY" &&
      signatureById.get(refs[2])?.role === "RELEASE";
  }) && appMapping.providerProfileRefs.includes(profile.profileId) &&
    privacyMapping.appPrivacyMappingRefs.includes(appMapping.mappingRowId) &&
    d033Mapping.appPrivacyMappingRefs.includes(appMapping.mappingRowId);
}

function deriveComparison(profile, policyPackage, assessments, mappingComplete, findings) {
  const expired = assessments.filter(({ status }) => status === "EXPIRED").map(({ assessmentId }) => assessmentId);
  const unknown = assessments.filter(({ status, conflictRefs }) => status === "UNKNOWN" || conflictRefs.length > 0).map(({ assessmentId }) => assessmentId);
  const incompatible = assessments.filter(({ status }) => status === "SUPPORTED_INCOMPATIBLE");
  const nonWaivable = incompatible.filter(({ riskTreatment }) => riskTreatment === "NON_WAIVABLE").map(({ assessmentId }) => assessmentId);
  const residual = incompatible.filter(({ riskTreatment }) => riskTreatment === "BOUNDED_RESIDUAL").map(({ assessmentId }) => assessmentId);
  let disposition;
  let blockingAssessmentIds = [];
  let residualRiskAssessmentIds = [];
  let findingIds = [];
  if (policyPackage === "C") {
    disposition = "C_NOT_OWNER_READY";
  } else if (expired.length > 0) {
    disposition = "EXPIRED_REASSESSMENT_REQUIRED";
    blockingAssessmentIds = expired;
  } else if (unknown.length > 0 || !mappingComplete) {
    disposition = "UNKNOWN_EVIDENCE_GAP_OR_CONFLICT";
    blockingAssessmentIds = unknown;
  } else if (policyPackage === "A" && incompatible.length > 0) {
    disposition = "DENY_BY_DOCUMENTED_FACT";
    blockingAssessmentIds = incompatible.map(({ assessmentId }) => assessmentId);
  } else if (policyPackage === "B" && nonWaivable.length > 0) {
    disposition = "DENY_BY_DOCUMENTED_FACT";
    blockingAssessmentIds = nonWaivable;
  } else if (policyPackage === "B" && residual.length > 0) {
    const covering = findings.filter(({ severity, assessmentIds, ownerRef, dueAt, nonBlockingRationaleSha256 }) =>
      severity === "P3" && ownerRef !== null && dueAt !== null && nonBlockingRationaleSha256 !== null &&
      assessmentIds.some((id) => residual.includes(id)));
    const covered = new Set(covering.flatMap(({ assessmentIds }) => assessmentIds));
    residualRiskAssessmentIds = residual;
    findingIds = covering.map(({ findingId }) => findingId);
    disposition = residual.every((id) => covered.has(id)) ? "B_REVIEWABLE_CANDIDATE" : "UNKNOWN_EVIDENCE_GAP_OR_CONFLICT";
    if (disposition !== "B_REVIEWABLE_CANDIDATE") blockingAssessmentIds = residual.filter((id) => !covered.has(id));
  } else {
    disposition = policyPackage === "A" ? "A_COMPATIBLE_CANDIDATE" : "B_REVIEWABLE_CANDIDATE";
  }
  return { disposition, blockingAssessmentIds, residualRiskAssessmentIds, findingIds };
}

function normalizePolicyComparison(value, index, expected, context) {
  const field = `policyPackageComparisons[${index}]`;
  assertExactKeys(value, [
    "profileId", "policyPackage", "disposition", "blockingAssessmentIds", "residualRiskAssessmentIds", "findingIds", "comparisonFingerprint",
  ], field);
  const normalized = {
    profileId: normalizePattern(value.profileId, `${field}.profileId`, /^D053-PROFILE-P[123]-[A-Z0-9_]+$/, 96),
    policyPackage: normalizeEnum(value.policyPackage, POLICY_PACKAGES, `${field}.policyPackage`),
    disposition: normalizeEnum(value.disposition, COMPARISON_DISPOSITIONS, `${field}.disposition`),
    blockingAssessmentIds: normalizeIdArray(value.blockingAssessmentIds, `${field}.blockingAssessmentIds`, /^D053-ASSESS-[A-Z0-9._-]+$/, 32),
    residualRiskAssessmentIds: normalizeIdArray(value.residualRiskAssessmentIds, `${field}.residualRiskAssessmentIds`, /^D053-ASSESS-[A-Z0-9._-]+$/, 32),
    findingIds: normalizeIdArray(value.findingIds, `${field}.findingIds`, /^D053-FINDING-[A-Z0-9._-]+$/, 64),
    comparisonFingerprint: normalizeSha256(value.comparisonFingerprint, `${field}.comparisonFingerprint`),
  };
  if (normalized.profileId !== expected.profileId || normalized.policyPackage !== expected.policyPackage) fail("policy comparison order changed", undefined, { field });
  const profile = context.profileById.get(normalized.profileId);
  const derived = deriveComparison(
    profile,
    normalized.policyPackage,
    context.assessmentsByProfile.get(normalized.profileId),
    context.mappingCompleteByProfile.get(normalized.profileId),
    context.findings,
  );
  if (!isDeepStrictEqual(
    { disposition: normalized.disposition, blockingAssessmentIds: normalized.blockingAssessmentIds, residualRiskAssessmentIds: normalized.residualRiskAssessmentIds, findingIds: normalized.findingIds },
    derived,
  )) fail("policy comparison does not match evidence", undefined, { field });
  if (normalized.comparisonFingerprint !== fingerprint(withoutField(normalized, "comparisonFingerprint"))) fail("comparison fingerprint changed", undefined, { field });
  return normalized;
}

function normalizeExpiryAndChangeMonitoring(value, evidenceIdSet) {
  const field = "expiryAndChangeMonitoring";
  assertExactKeys(value, ["changeTriggerIds", "monitorEvidenceRefs", "monitoringDisposition", "failBeforeCredentialRead", "gracePeriodAllowed", "monitorFingerprint"], field);
  const normalized = {
    changeTriggerIds: normalizeOrderedSubset(value.changeTriggerIds, CHANGE_TRIGGER_IDS, `${field}.changeTriggerIds`, true),
    monitorEvidenceRefs: normalizeIdArray(value.monitorEvidenceRefs, `${field}.monitorEvidenceRefs`, /^D053-EV-[A-Z0-9._-]+$/, 128),
    monitoringDisposition: normalizeEnum(value.monitoringDisposition, ["ACTIVE_CALLER_ASSERTED", "NOT_ESTABLISHED"], `${field}.monitoringDisposition`),
    failBeforeCredentialRead: value.failBeforeCredentialRead,
    gracePeriodAllowed: value.gracePeriodAllowed,
    monitorFingerprint: normalizeSha256(value.monitorFingerprint, `${field}.monitorFingerprint`),
  };
  if (normalized.failBeforeCredentialRead !== true || normalized.gracePeriodAllowed !== false) fail("expiry fail-closed boundary changed", undefined, { field });
  if (normalized.monitorEvidenceRefs.some((id) => !evidenceIdSet.has(id))) fail("monitor references unknown evidence", undefined, { field });
  if (normalized.monitoringDisposition === "ACTIVE_CALLER_ASSERTED" && normalized.monitorEvidenceRefs.length === 0) fail("active monitoring requires evidence", undefined, { field });
  if (normalized.monitorFingerprint !== fingerprint(withoutField(normalized, "monitorFingerprint"))) fail("monitor fingerprint changed", undefined, { field });
  return normalized;
}

function deriveOverallDisposition(normalized, completeness) {
  const openBlockingFinding = normalized.findings.some(({ severity, status }) => status === "OPEN" && severity !== "P3");
  const mappingConflict = [...normalized.privacyPolicyMappings, ...normalized.d033DisclosureMappings].some(({ consistencyState }) => consistencyState === "CONFLICT");
  if (openBlockingFinding || mappingConflict) return "FAIL";
  if (normalized.recordKind !== "FORMAL_EVIDENCE_REPORT" || !completeness) return "INCONCLUSIVE";
  return "EVIDENCE_REVIEW_REQUIRED";
}

function normalizeD053ProviderEvidenceAppPrivacyReport(input) {
  assertDataTree(input, "input");
  assertExactKeys(input, [
    "schemaVersion", "reportId", "recordKind", "protocolIdentity", "oi07Intake", "oi07IntakeResult", "matrixScope",
    "providerTargets", "sourceSnapshots", "conflicts", "admissionProfiles", "dimensionAssessments", "appPrivacyMappingRows",
    "privacyPolicyMappings", "d033DisclosureMappings", "policyPackageComparisons", "signatures", "independentReviewRefs",
    "findings", "expiryAndChangeMonitoring", "overallDisposition", "generatedAt", "reportSha256", "containsRealUserData",
    "containsCredential", "containsProviderBody", "containsRestrictedContract",
  ], "input");
  if (input.schemaVersion !== INPUT_SCHEMA_VERSION) fail("report schemaVersion changed", undefined, { field: "schemaVersion" });
  if (input.reportSha256 !== computeD053ProviderEvidenceReportSha256(input)) fail("reportSha256 does not bind the complete bundle", undefined, { field: "reportSha256" });
  if ([input.containsRealUserData, input.containsCredential, input.containsProviderBody, input.containsRestrictedContract].some((value) => value !== false)) {
    fail("report contains forbidden material", "UNSAFE_D053_PROVIDER_EVIDENCE_APP_PRIVACY_REPORT", { field: "input" });
  }
  const reportId = normalizePattern(input.reportId, "reportId", /^D053-REPORT-R\d{3}$/, 32);
  const recordKind = normalizeEnum(input.recordKind, ["FORMAL_EVIDENCE_REPORT", "SYNTHETIC_CONTRACT_FIXTURE"], "recordKind");
  const protocolIdentity = normalizeProtocolIdentity(input.protocolIdentity);
  const oi07Intake = normalizeOi07ProviderTargetIntake(input.oi07Intake);
  const oi07IntakeResult = validateOi07ProviderTargetIntakeResult(input.oi07IntakeResult, oi07Intake);
  const matrixScope = normalizeMatrixScope(input.matrixScope, recordKind);
  const providerTargets = normalizeProviderTargets(input.providerTargets, matrixScope, oi07Intake, oi07IntakeResult);
  const targetByFingerprint = new Map(providerTargets.map((target) => [target.targetFingerprint, target]));
  const targetBySlot = new Map(providerTargets.map((target) => [target.providerSlot, target]));
  if (!Array.isArray(input.sourceSnapshots) || input.sourceSnapshots.length > 2_048) fail("source snapshots exceed resource boundary", undefined, { field: "sourceSnapshots" });
  const sourceSnapshots = input.sourceSnapshots.map((value, index) => normalizeSourceSnapshot(value, index, targetByFingerprint, recordKind));
  const evidenceIds = sourceSnapshots.map(({ evidenceId }) => evidenceId);
  if (new Set(evidenceIds).size !== evidenceIds.length) fail("source evidence IDs must be unique", undefined, { field: "sourceSnapshots" });
  const evidenceById = new Map(sourceSnapshots.map((item) => [item.evidenceId, item]));
  for (const [index, snapshot] of sourceSnapshots.entries()) {
    if (snapshot.supersedesEvidenceId !== null) {
      const previous = evidenceById.get(snapshot.supersedesEvidenceId);
      if (!previous || previous.providerTargetFingerprint !== snapshot.providerTargetFingerprint || previous.evidenceId === snapshot.evidenceId) {
        fail("superseded evidence reference is invalid", undefined, { field: `sourceSnapshots[${index}].supersedesEvidenceId` });
      }
    }
  }
  if (!Array.isArray(input.conflicts) || input.conflicts.length > 512) fail("conflicts exceed resource boundary", undefined, { field: "conflicts" });
  const conflicts = input.conflicts.map((value, index) => normalizeConflict(value, index, targetByFingerprint));
  const conflictIds = conflicts.map(({ conflictId }) => conflictId);
  if (new Set(conflictIds).size !== conflictIds.length) fail("conflict IDs must be unique", undefined, { field: "conflicts" });
  const conflictById = new Map(conflicts.map((item) => [item.conflictId, item]));
  conflicts.forEach((conflict, index) => conflict.evidenceIds.forEach((id) => {
    const evidence = evidenceById.get(id);
    if (!evidence || evidence.providerTargetFingerprint !== conflict.providerTargetFingerprint) fail("conflict evidence scope changed", undefined, { field: `conflicts[${index}].evidenceIds` });
  }));
  const profileDescriptors = expectedProfileDescriptors(matrixScope);
  if (!Array.isArray(input.admissionProfiles) || input.admissionProfiles.length !== profileDescriptors.length) fail("admission profile count changed", undefined, { field: "admissionProfiles" });
  const admissionProfiles = input.admissionProfiles.map((value, index) => normalizeAdmissionProfile(value, index, profileDescriptors[index], targetBySlot));
  const profileById = new Map(admissionProfiles.map((profile) => [profile.profileId, profile]));
  if (profileById.size !== admissionProfiles.length) fail("profile IDs must be unique", undefined, { field: "admissionProfiles" });
  admissionProfiles.forEach((profile, index) => {
    for (const id of profile.sourceSnapshotRefs) {
      if (evidenceById.get(id)?.providerTargetFingerprint !== profile.providerTargetFingerprint) fail("profile evidence target changed", undefined, { field: `admissionProfiles[${index}].sourceSnapshotRefs` });
    }
    for (const id of profile.conflictIds) {
      if (conflictById.get(id)?.providerTargetFingerprint !== profile.providerTargetFingerprint) fail("profile conflict target changed", undefined, { field: `admissionProfiles[${index}].conflictIds` });
    }
  });
  const assessmentDescriptors = admissionProfiles.flatMap((profile) => matrixScope.evidenceDimensionIds.map((evidenceDimensionId) => ({ profileId: profile.profileId, evidenceDimensionId })));
  if (!Array.isArray(input.dimensionAssessments) || input.dimensionAssessments.length !== assessmentDescriptors.length) fail("dimension assessment count changed", undefined, { field: "dimensionAssessments" });
  const dimensionAssessments = input.dimensionAssessments.map((value, index) => normalizeDimensionAssessment(value, index, assessmentDescriptors[index], profileById));
  const assessmentById = new Map(dimensionAssessments.map((assessment) => [assessment.assessmentId, assessment]));
  if (assessmentById.size !== dimensionAssessments.length) fail("assessment IDs must be unique", undefined, { field: "dimensionAssessments" });
  dimensionAssessments.forEach((assessment, index) => {
    const profile = profileById.get(assessment.profileId);
    for (const id of assessment.evidenceRefs) {
      if (evidenceById.get(id)?.providerTargetFingerprint !== profile.providerTargetFingerprint) fail("assessment evidence target changed", undefined, { field: `dimensionAssessments[${index}].evidenceRefs` });
    }
    for (const id of assessment.conflictRefs) {
      const conflict = conflictById.get(id);
      if (!conflict || conflict.providerTargetFingerprint !== profile.providerTargetFingerprint) fail("assessment conflict target changed", undefined, { field: `dimensionAssessments[${index}].conflictRefs` });
      if (conflict.status === "OPEN" && assessment.status !== "UNKNOWN") fail("open conflict must keep assessment UNKNOWN", undefined, { field: `dimensionAssessments[${index}].status` });
    }
  });
  if (!Array.isArray(input.signatures) || input.signatures.length > 512) fail("signatures exceed resource boundary", undefined, { field: "signatures" });
  const signatures = input.signatures.map(normalizeSignature);
  const signatureById = new Map(signatures.map((signature) => [signature.signatureId, signature]));
  if (signatureById.size !== signatures.length) fail("signature IDs must be unique", undefined, { field: "signatures" });
  if (!Array.isArray(input.appPrivacyMappingRows) || input.appPrivacyMappingRows.length > 1_024) fail("App Privacy mappings exceed resource boundary", undefined, { field: "appPrivacyMappingRows" });
  const appPrivacyMappingRows = input.appPrivacyMappingRows.map((value, index) => normalizeAppPrivacyMapping(value, index, profileById, targetByFingerprint));
  const appById = new Map(appPrivacyMappingRows.map((mapping) => [mapping.mappingRowId, mapping]));
  if (appById.size !== appPrivacyMappingRows.length) fail("App Privacy mapping IDs must be unique", undefined, { field: "appPrivacyMappingRows" });
  if (!Array.isArray(input.privacyPolicyMappings) || input.privacyPolicyMappings.length !== admissionProfiles.length) fail("privacy policy mapping count changed", undefined, { field: "privacyPolicyMappings" });
  const privacyPolicyMappings = input.privacyPolicyMappings.map((value, index) => normalizePolicyOrDisclosureMapping(value, index, "PRIVACY", profileById));
  if (!Array.isArray(input.d033DisclosureMappings) || input.d033DisclosureMappings.length !== admissionProfiles.length) fail("D-033 mapping count changed", undefined, { field: "d033DisclosureMappings" });
  const d033DisclosureMappings = input.d033DisclosureMappings.map((value, index) => normalizePolicyOrDisclosureMapping(value, index, "D033", profileById));
  const privacyById = new Map(privacyPolicyMappings.map((mapping) => [mapping.privacyPolicyMappingId, mapping]));
  const d033ById = new Map(d033DisclosureMappings.map((mapping) => [mapping.d033DisclosureMappingId, mapping]));
  if (privacyById.size !== privacyPolicyMappings.length || d033ById.size !== d033DisclosureMappings.length) fail("policy mapping IDs must be unique", undefined, { field: "mappings" });
  const validateSignatureRoles = (record, field) => {
    const refs = [record.productSignatureRef, record.privacySecuritySignatureRef, record.releaseSignatureRef];
    if (refs.every((ref) => ref === null)) return;
    if (signatureById.get(refs[0])?.role !== "PRODUCT" || signatureById.get(refs[1])?.role !== "PRIVACY_SECURITY" || signatureById.get(refs[2])?.role !== "RELEASE") {
      fail("mapping signature role or reference changed", undefined, { field });
    }
  };
  appPrivacyMappingRows.forEach((record, index) => validateSignatureRoles(record, `appPrivacyMappingRows[${index}]`));
  privacyPolicyMappings.forEach((record, index) => validateSignatureRoles(record, `privacyPolicyMappings[${index}]`));
  d033DisclosureMappings.forEach((record, index) => validateSignatureRoles(record, `d033DisclosureMappings[${index}]`));
  const evidenceIdSet = new Set(evidenceIds);
  for (const [collectionName, mappings] of [["appPrivacyMappingRows", appPrivacyMappingRows], ["privacyPolicyMappings", privacyPolicyMappings], ["d033DisclosureMappings", d033DisclosureMappings]]) {
    mappings.forEach((mapping, index) => {
      for (const key of Object.keys(mapping).filter((key) => key.endsWith("EvidenceRefs") || key === "evidenceRefs")) {
        if (mapping[key].some((id) => !evidenceIdSet.has(id))) fail("mapping references unknown evidence", undefined, { field: `${collectionName}[${index}].${key}` });
      }
      if (mapping.appPrivacyMappingRefs?.some((id) => !appById.has(id))) fail("mapping references unknown App Privacy row", undefined, { field: `${collectionName}[${index}].appPrivacyMappingRefs` });
    });
  }
  const appRowsByProfile = new Map(admissionProfiles.map((profile) => [profile.profileId, appPrivacyMappingRows.filter((row) => row.providerProfileRefs.includes(profile.profileId))]));
  admissionProfiles.forEach((profile, index) => {
    const appMapping = appById.get(profile.appPrivacyMappingRef);
    const privacyMapping = privacyById.get(profile.privacyPolicyMappingRef);
    const d033Mapping = d033ById.get(profile.d033DisclosureMappingRef);
    if (!appMapping?.providerProfileRefs.includes(profile.profileId) || privacyMapping?.profileId !== profile.profileId || d033Mapping?.profileId !== profile.profileId) {
      fail("profile mapping references changed", undefined, { field: `admissionProfiles[${index}]` });
    }
    if (appRowsByProfile.get(profile.profileId).length < 1) fail("profile lacks an App Privacy mapping row", undefined, { field: `admissionProfiles[${index}]` });
  });
  if (!Array.isArray(input.findings) || input.findings.length > 512) fail("findings exceed resource boundary", undefined, { field: "findings" });
  const findings = input.findings.map(normalizeFinding);
  const findingById = new Map(findings.map((finding) => [finding.findingId, finding]));
  if (findingById.size !== findings.length) fail("finding IDs must be unique", undefined, { field: "findings" });
  const validRefs = { profileIds: profileById, assessmentIds: assessmentById, mappingRowIds: appById, conflictIds: conflictById };
  findings.forEach((finding, index) => Object.entries(validRefs).forEach(([key, map]) => {
    if (finding[key].some((id) => !map.has(id))) fail("finding contains unknown reference", undefined, { field: `findings[${index}].${key}` });
  }));
  if (!Array.isArray(input.independentReviewRefs) || input.independentReviewRefs.length > 64) fail("review refs exceed resource boundary", undefined, { field: "independentReviewRefs" });
  const independentReviewRefs = input.independentReviewRefs.map(normalizeIndependentReviewRef);
  if (new Set(independentReviewRefs.map(({ reviewId }) => reviewId)).size !== independentReviewRefs.length) fail("review IDs must be unique", undefined, { field: "independentReviewRefs" });
  const mappingCompleteByProfile = new Map(admissionProfiles.map((profile) => [profile.profileId, mappingSignedAndConsistent(
    profile,
    appById.get(profile.appPrivacyMappingRef),
    privacyById.get(profile.privacyPolicyMappingRef),
    d033ById.get(profile.d033DisclosureMappingRef),
    signatureById,
  )]));
  const assessmentsByProfile = new Map(admissionProfiles.map((profile) => [profile.profileId, dimensionAssessments.filter(({ profileId }) => profileId === profile.profileId)]));
  const comparisonDescriptors = admissionProfiles.flatMap((profile) => POLICY_PACKAGES.map((policyPackage) => ({ profileId: profile.profileId, policyPackage })));
  if (!Array.isArray(input.policyPackageComparisons) || input.policyPackageComparisons.length !== comparisonDescriptors.length) fail("policy comparison count changed", undefined, { field: "policyPackageComparisons" });
  const comparisonContext = { profileById, assessmentsByProfile, mappingCompleteByProfile, findings };
  const policyPackageComparisons = input.policyPackageComparisons.map((value, index) => normalizePolicyComparison(value, index, comparisonDescriptors[index], comparisonContext));
  const comparisonByProfilePackage = new Map(policyPackageComparisons.map((comparison) => [`${comparison.profileId}:${comparison.policyPackage}`, comparison]));
  admissionProfiles.forEach((profile, index) => {
    const comparison = comparisonByProfilePackage.get(`${profile.profileId}:${profile.candidatePolicyPackage}`);
    const expectedDisposition = profile.candidatePolicyPackage === "C" ? "NOT_ASSESSED" : comparison.disposition;
    if (profile.profileDisposition !== expectedDisposition) fail("profile disposition does not match selected package comparison", undefined, { field: `admissionProfiles[${index}].profileDisposition` });
  });
  const expiryAndChangeMonitoring = normalizeExpiryAndChangeMonitoring(input.expiryAndChangeMonitoring, evidenceIdSet);
  const generatedAt = normalizeTimestamp(input.generatedAt, "generatedAt");
  admissionProfiles.forEach((profile, index) => {
    const windowDays = profile.candidatePolicyPackage === "A" ? 90 : profile.candidatePolicyPackage === "B" ? 30 : 0;
    const assessments = assessmentsByProfile.get(profile.profileId);
    const latestAssessmentAt = Math.max(...assessments.map(({ assessedAt }) => Date.parse(assessedAt)));
    if (Date.parse(profile.expiryAt) - latestAssessmentAt > windowDays * 86_400_000) fail("profile expiry exceeds policy window", undefined, { field: `admissionProfiles[${index}].expiryAt` });
    const expiredNow = Date.parse(profile.expiryAt) <= Date.parse(generatedAt);
    if (expiredNow && profile.profileDisposition !== "EXPIRED_REASSESSMENT_REQUIRED" && profile.candidatePolicyPackage !== "C") {
      fail("expired profile disposition changed", undefined, { field: `admissionProfiles[${index}].profileDisposition` });
    }
  });
  const sourceComplete = sourceSnapshots.length > 0 && sourceSnapshots.every(({ replayState, effectiveAt, expiresAt }) => replayState === "CALLER_ASSERTED_REPLAYABLE" && effectiveAt !== "UNKNOWN" && expiresAt !== "UNKNOWN");
  const mappingsCoverPayloads = matrixScope.payloadClasses.every((payloadClass) => appPrivacyMappingRows.some((row) => row.payloadClass === payloadClass));
  const dimensionsComplete = dimensionAssessments.every(({ status }) => !["UNKNOWN", "EXPIRED"].includes(status));
  const conflictsComplete = conflicts.every(({ status }) => status === "RESOLVED");
  const mappingsComplete = admissionProfiles.every((profile) => mappingCompleteByProfile.get(profile.profileId));
  const monitoringComplete = expiryAndChangeMonitoring.monitoringDisposition === "ACTIVE_CALLER_ASSERTED";
  const completeness = oi07IntakeResult.d053IntakeContractComplete && oi07IntakeResult.authorityMetadataComplete &&
    sourceComplete && dimensionsComplete && conflictsComplete && mappingsCoverPayloads && mappingsComplete && monitoringComplete;
  const overallDisposition = normalizeEnum(input.overallDisposition, ["EVIDENCE_REVIEW_REQUIRED", "FAIL", "INCONCLUSIVE"], "overallDisposition");
  const normalized = immutable({
    schemaVersion: INPUT_SCHEMA_VERSION,
    reportId,
    recordKind,
    protocolIdentity,
    oi07Intake,
    oi07IntakeResult,
    matrixScope,
    providerTargets,
    sourceSnapshots,
    conflicts,
    admissionProfiles,
    dimensionAssessments,
    appPrivacyMappingRows,
    privacyPolicyMappings,
    d033DisclosureMappings,
    policyPackageComparisons,
    signatures,
    independentReviewRefs,
    findings,
    expiryAndChangeMonitoring,
    overallDisposition,
    generatedAt,
    reportSha256: input.reportSha256,
    containsRealUserData: false,
    containsCredential: false,
    containsProviderBody: false,
    containsRestrictedContract: false,
  });
  if (overallDisposition !== deriveOverallDisposition(normalized, completeness)) fail("overall disposition does not match report evidence", undefined, { field: "overallDisposition" });
  return normalized;
}

function evaluateD053ProviderEvidenceAppPrivacyReport(input) {
  const normalized = normalizeD053ProviderEvidenceAppPrivacyReport(input);
  const statusCounts = Object.fromEntries(DIMENSION_STATUSES.map((status) => [status, normalized.dimensionAssessments.filter((item) => item.status === status).length]));
  const profileCounts = Object.fromEntries(PROFILE_DISPOSITIONS.map((disposition) => [disposition, normalized.admissionProfiles.filter((item) => item.profileDisposition === disposition).length]));
  const openFindingCounts = Object.fromEntries(["P0", "P1", "P2", "P3"].map((severity) => [severity, normalized.findings.filter((item) => item.status === "OPEN" && item.severity === severity).length]));
  const blockers = immutable([
    ...(normalized.recordKind === "SYNTHETIC_CONTRACT_FIXTURE" ? ["SYNTHETIC_CONTRACT_FIXTURE_ONLY"] : []),
    ...(!normalized.oi07IntakeResult.d053IntakeContractComplete ? ["OI07_D053_INTAKE_INCOMPLETE"] : []),
    ...(normalized.overallDisposition === "FAIL" ? ["REPORT_CONTAINS_FAILING_EVIDENCE"] : []),
    ...(normalized.overallDisposition === "INCONCLUSIVE" ? ["REPORT_EVIDENCE_INCONCLUSIVE"] : []),
    ...(statusCounts.UNKNOWN > 0 ? ["DIMENSION_EVIDENCE_UNKNOWN"] : []),
    ...(statusCounts.EXPIRED > 0 ? ["DIMENSION_EVIDENCE_EXPIRED"] : []),
    "OI07_AUTHORITY_CALLER_ASSERTED_NOT_VERIFIED",
    "PROVIDER_FACTS_CALLER_ASSERTED_NOT_VERIFIED",
    "SOURCE_SNAPSHOTS_CALLER_ASSERTED_NOT_VERIFIED",
    "APP_PRIVACY_AND_POLICY_MAPPINGS_CALLER_ASSERTED_NOT_VERIFIED",
    "SIGNATURES_CALLER_ASSERTED_NOT_VERIFIED",
    "INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED",
    "D053_NOT_AUTHORIZED",
    "PROVIDER_ADMISSION_NOT_GRANTED",
  ]);
  const core = immutable({
    schemaVersion: RESULT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    reportId: normalized.reportId,
    disposition: "STRUCTURALLY_VALIDATED_REPORT_ONLY",
    overallDisposition: normalized.overallDisposition,
    recordKind: normalized.recordKind,
    syntheticContractFixtureOnly: normalized.recordKind === "SYNTHETIC_CONTRACT_FIXTURE",
    providerTargetCount: normalized.providerTargets.length,
    payloadClassCount: normalized.matrixScope.payloadClasses.length,
    admissionProfileCount: normalized.admissionProfiles.length,
    dimensionAssessmentCount: normalized.dimensionAssessments.length,
    sourceSnapshotCount: normalized.sourceSnapshots.length,
    conflictCount: normalized.conflicts.length,
    appPrivacyMappingRowCount: normalized.appPrivacyMappingRows.length,
    privacyPolicyMappingCount: normalized.privacyPolicyMappings.length,
    d033DisclosureMappingCount: normalized.d033DisclosureMappings.length,
    policyPackageComparisonCount: normalized.policyPackageComparisons.length,
    signatureRefCount: normalized.signatures.length,
    independentReviewRefCount: normalized.independentReviewRefs.length,
    findingCount: normalized.findings.length,
    compatibleDimensionCount: statusCounts.SUPPORTED_COMPATIBLE,
    incompatibleDimensionCount: statusCounts.SUPPORTED_INCOMPATIBLE,
    unknownDimensionCount: statusCounts.UNKNOWN,
    expiredDimensionCount: statusCounts.EXPIRED,
    aCompatibleCandidateCount: profileCounts.A_COMPATIBLE_CANDIDATE,
    bReviewableCandidateCount: profileCounts.B_REVIEWABLE_CANDIDATE,
    deniedProfileCount: profileCounts.DENY_BY_DOCUMENTED_FACT,
    unknownProfileCount: profileCounts.UNKNOWN_EVIDENCE_GAP_OR_CONFLICT,
    expiredProfileCount: profileCounts.EXPIRED_REASSESSMENT_REQUIRED,
    notAssessedProfileCount: profileCounts.NOT_ASSESSED,
    openP0FindingCount: openFindingCounts.P0,
    openP1FindingCount: openFindingCounts.P1,
    openP2FindingCount: openFindingCounts.P2,
    openP3FindingCount: openFindingCounts.P3,
    d053PassCandidate: false,
    providerAdmissionGranted: false,
    blockers,
    inputFingerprint: fingerprint(normalized),
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateD053ProviderEvidenceAppPrivacyReportResult(result, input) {
  assertDataTree(result, "result");
  const expected = evaluateD053ProviderEvidenceAppPrivacyReport(input);
  if (!isDeepStrictEqual(result, expected)) fail("D-053 report result or fingerprint was changed");
  return expected;
}

export {
  BOUNDARY,
  CHANGE_TRIGGER_IDS,
  COMPARISON_DISPOSITIONS,
  CONTRACT_ID,
  DIMENSION_STATUSES,
  EVIDENCE_DIMENSION_IDS,
  INPUT_SCHEMA_VERSION,
  MAPPING_DECISIONS,
  PAYLOAD_CLASSES,
  POLICY_PACKAGES,
  PROFILE_DISPOSITIONS,
  PROTOCOL_ID,
  PROVIDER_SLOTS,
  RESULT_SCHEMA_VERSION,
  computeD053ProviderEvidenceReportSha256,
  computeD053ProviderTargetFingerprint,
  evaluateD053ProviderEvidenceAppPrivacyReport,
  normalizeD053ProviderEvidenceAppPrivacyReport,
  validateD053ProviderEvidenceAppPrivacyReportResult,
};
