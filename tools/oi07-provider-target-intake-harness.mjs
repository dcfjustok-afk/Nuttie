import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const INPUT_SCHEMA_VERSION = "OI07_PROVIDER_TARGET_INTAKE_INPUT_V1";
const RESULT_SCHEMA_VERSION = "OI07_PROVIDER_TARGET_INTAKE_RESULT_V1";
const TEMPLATE_ID = "OI07-PROVIDER-TARGET-INTAKE-TEMPLATE-001";
const UNKNOWN = "UNKNOWN";

const TARGET_FIELDS = Object.freeze([
  "providerSlot",
  "providerLegalEntity",
  "apiProductName",
  "apiProductPlan",
  "apiProductRevision",
  "accountType",
  "accountRegion",
  "intendedUserRegion",
  "baseUrl",
  "endpointPathShape",
  "queryRequired",
  "redirectDocumented",
  "streamingMode",
  "modelIdentifierForSyntheticTest",
  "modelFamily",
  "accountDataControlState",
  "officialEndpointEvidenceUrl",
  "officialTermsUrl",
  "officialPrivacyUrl",
  "officialApiDataUseUrl",
  "officialRetentionUrl",
  "officialSubprocessorUrl",
  "officialDeletionOrSupportUrl",
  "documentEffectiveDates",
  "evidenceObservedAt",
  "credentialOwner",
  "credentialInjectionMethod",
  "maximumAuthorizedTestCost",
  "notesWithoutSecretOrUserData",
]);

const SHARED_TARGET_FIELDS = Object.freeze([
  "providerSlot",
  "providerLegalEntity",
  "apiProductName",
  "apiProductRevision",
  "accountRegion",
  "intendedUserRegion",
  "baseUrl",
  "officialTermsUrl",
  "officialPrivacyUrl",
  "evidenceObservedAt",
  "credentialOwner",
  "notesWithoutSecretOrUserData",
]);

const D036_ONLY_TARGET_FIELDS = Object.freeze([
  "endpointPathShape",
  "queryRequired",
  "redirectDocumented",
  "streamingMode",
  "modelIdentifierForSyntheticTest",
  "officialEndpointEvidenceUrl",
  "credentialInjectionMethod",
  "maximumAuthorizedTestCost",
]);

const D053_ONLY_TARGET_FIELDS = Object.freeze([
  "apiProductPlan",
  "accountType",
  "modelFamily",
  "accountDataControlState",
  "officialApiDataUseUrl",
  "officialRetentionUrl",
  "officialSubprocessorUrl",
  "officialDeletionOrSupportUrl",
  "documentEffectiveDates",
]);

const HTTPS_URL_FIELDS = new Set([
  "officialEndpointEvidenceUrl",
  "officialTermsUrl",
  "officialPrivacyUrl",
  "officialApiDataUseUrl",
  "officialRetentionUrl",
  "officialSubprocessorUrl",
  "officialDeletionOrSupportUrl",
]);

const NON_APPLICABLE_FORBIDDEN_FIELDS = new Set([
  "providerSlot",
  "providerLegalEntity",
  "apiProductName",
  "apiProductRevision",
  "accountType",
  "accountRegion",
  "intendedUserRegion",
  "baseUrl",
  "modelFamily",
  "accountDataControlState",
  "evidenceObservedAt",
  "credentialOwner",
]);

const BOUNDARY = Object.freeze({
  schemaVersion: "OI07_PROVIDER_TARGET_INTAKE_BOUNDARY_V1",
  contractStatus: "SPIKE_LOCAL_ONLY_NON_PRODUCTION",
  inputAuthorityVerification: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
  sourceUrlsFetched: false,
  providerFactsVerified: false,
  credentialMaterialRead: false,
  credentialMaterialStored: false,
  testCostAuthorized: false,
  transportCreated: false,
  networkRequests: 0,
  providerEvidenceCollectionAuthorized: false,
  ownerIntakeChanged: false,
  ownerReviewAuthorized: false,
  b05Closed: false,
  formalImplementationAuthorized: false,
  sendAuthorization: "NOT_GRANTED",
});

function fail(message, code = "INVALID_OI07_PROVIDER_TARGET_INTAKE", details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertDataTree(value, field, state = { depth: 0, nodes: 0, seen: new Set() }) {
  state.nodes += 1;
  if (state.nodes > 500) fail("input exceeds resource limits", undefined, { field });
  if (typeof value === "string") {
    if (value.length > 4096) fail("input exceeds resource limits", undefined, { field });
    return;
  }
  if (value === null || ["boolean", "number"].includes(typeof value)) return;
  if (typeof value !== "object") fail("input contains unsupported value", undefined, { field });
  if (state.seen.has(value)) fail("input contains a cycle", undefined, { field });
  if (state.depth >= 6) fail("input exceeds resource limits", undefined, { field });
  state.seen.add(value);
  if (Object.getOwnPropertySymbols(value).length > 0) fail("input contains symbol properties", undefined, { field });
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (Array.isArray(value) && key === "length") continue;
    if (!descriptor.enumerable || descriptor.get || descriptor.set) {
      fail("input contains non-data properties", undefined, { field: `${field}.${key}` });
    }
  }
  if (Array.isArray(value)) {
    if (value.length > 32) fail("input exceeds resource limits", undefined, { field });
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      fail("input must use plain records", undefined, { field });
    }
  }
  const childState = { ...state, depth: state.depth + 1 };
  Object.entries(value).forEach(([key, child]) => assertDataTree(child, `${field}.${key}`, childState));
  state.nodes = childState.nodes;
  state.seen.delete(value);
}

function assertExactKeys(value, required, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be a plain record`, undefined, { field });
  }
  const allowed = new Set(required);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${field}.${key} is unsupported`, undefined, { field: `${field}.${key}` });
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, undefined, { field: `${field}.${key}` });
  }
}

function clone(value, seen = new Map()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const output = Array.isArray(value) ? [] : {};
  seen.set(value, output);
  Object.entries(value).forEach(([key, child]) => { output[key] = clone(child, seen); });
  return output;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
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

function isUnknown(value) {
  return value === UNKNOWN;
}

function containsSensitiveLookingMaterial(value) {
  if (typeof value !== "string") return false;
  return [
    /\b(?:sk|rk|pk)-[A-Za-z0-9_-]{8,}\b/i,
    /\bBearer\s+[A-Za-z0-9._~+\/-]{8,}/i,
    /\b(?:api[_-]?key|access[_-]?token|password|authorization|cookie)\s*[:=]\s*\S+/i,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  ].some((pattern) => pattern.test(value));
}

function assertNoSensitiveLookingMaterial(value, field) {
  if (containsSensitiveLookingMaterial(value)) {
    fail("input contains prohibited sensitive-looking material", "UNSAFE_OI07_PROVIDER_TARGET_INTAKE", { field });
  }
}

function parsePublicHttpsUrl(value, field, { originOnly = false } = {}) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`${field} must be a public HTTPS URL`, undefined, { field });
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.hostname ||
    (originOnly && (url.pathname !== "/" || value.endsWith("/")))
  ) {
    fail(`${field} must be a stable public HTTPS ${originOnly ? "origin" : "URL"}`, undefined, { field });
  }
  return value;
}

function isValidDate(value) {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isValidTimestamp(value) {
  return isValidDate(value.slice(0, 10)) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value));
}

function parseNotApplicable(value, field) {
  if (typeof value !== "string" || !value.startsWith("N/A(")) return null;
  if (NON_APPLICABLE_FORBIDDEN_FIELDS.has(field)) {
    fail(`${field} cannot be N/A for a concrete Provider target`, undefined, { field });
  }
  const match = /^N\/A\(([^,]{3,200}),\s*(https:\/\/[^)]+)\)$/.exec(value);
  if (!match) fail(`${field} N/A requires a reason and public source URL`, undefined, { field });
  parsePublicHttpsUrl(match[2], field);
  return value;
}

function normalizeString(value, field, maxLength = 512) {
  if (typeof value !== "string") fail(`${field} must be a string`, undefined, { field });
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) fail(`${field} has invalid length`, undefined, { field });
  assertNoSensitiveLookingMaterial(normalized, field);
  return normalized;
}

function normalizeTargetField(value, field, expectedSlot) {
  if (field === "documentEffectiveDates") {
    if (typeof value === "string") {
      const normalized = normalizeString(value, field);
      if (isUnknown(normalized)) return normalized;
      return parseNotApplicable(normalized, field);
    }
    if (!Array.isArray(value) || value.length === 0 || value.length > 16) {
      fail(`${field} must be UNKNOWN, a sourced N/A, or a non-empty date array`, undefined, { field });
    }
    const dates = value.map((item) => normalizeString(item, field, 10));
    if (!dates.every(isValidDate) || new Set(dates).size !== dates.length) {
      fail(`${field} contains invalid or duplicate dates`, undefined, { field });
    }
    return dates;
  }

  const normalized = normalizeString(value, field, field === "notesWithoutSecretOrUserData" ? 1000 : 512);
  if (field === "providerSlot") {
    if (normalized !== expectedSlot) fail("provider slots must be exactly P1, P2, and P3", undefined, { field });
    return normalized;
  }
  if (isUnknown(normalized)) return normalized;
  const notApplicable = parseNotApplicable(normalized, field);
  if (notApplicable !== null) return notApplicable;

  if (field === "baseUrl") return parsePublicHttpsUrl(normalized, field, { originOnly: true });
  if (HTTPS_URL_FIELDS.has(field)) return parsePublicHttpsUrl(normalized, field);
  if (field === "queryRequired" && !["TRUE", "FALSE"].includes(normalized)) {
    fail("queryRequired must be TRUE, FALSE, UNKNOWN, or sourced N/A", undefined, { field });
  }
  if (field === "endpointPathShape" && (!normalized.startsWith("/") || /[?#]/.test(normalized))) {
    fail("endpointPathShape must be a query-free absolute path shape", undefined, { field });
  }
  if (field === "evidenceObservedAt" && !isValidTimestamp(normalized)) {
    fail("evidenceObservedAt must be an RFC 3339 timestamp", undefined, { field });
  }
  if (
    field === "maximumAuthorizedTestCost" &&
    normalized !== "ZERO" &&
    !/^[A-Z]{3} (?:0|[1-9]\d{0,6})\.\d{2}$/.test(normalized)
  ) {
    fail("maximumAuthorizedTestCost must be ZERO, UNKNOWN, sourced N/A, or CURRENCY amount", undefined, { field });
  }
  return normalized;
}

function normalizeOi07ProviderTargetIntake(input) {
  assertDataTree(input, "input");
  assertExactKeys(
    input,
    ["schemaVersion", "oi07Revision", "providedBy", "providedAt", "ownerAuthorizationRef", "targets"],
    "input",
  );
  if (input.schemaVersion !== INPUT_SCHEMA_VERSION) fail("unsupported input schemaVersion", undefined, { field: "schemaVersion" });
  const oi07Revision = normalizeString(input.oi07Revision, "oi07Revision", 16);
  if (!isUnknown(oi07Revision) && !/^OI07-R\d{3}$/.test(oi07Revision)) {
    fail("oi07Revision must be UNKNOWN or OI07-RNNN", undefined, { field: "oi07Revision" });
  }
  const providedBy = normalizeString(input.providedBy, "providedBy", 32);
  if (![UNKNOWN, "OWNER", "AUTHORIZED_CONTACT"].includes(providedBy)) {
    fail("providedBy must be OWNER, AUTHORIZED_CONTACT, or UNKNOWN", undefined, { field: "providedBy" });
  }
  const providedAt = normalizeString(input.providedAt, "providedAt", 64);
  if (!isUnknown(providedAt) && !isValidTimestamp(providedAt)) {
    fail("providedAt must be UNKNOWN or an RFC 3339 timestamp", undefined, { field: "providedAt" });
  }
  const ownerAuthorizationRef = normalizeString(input.ownerAuthorizationRef, "ownerAuthorizationRef", 256);
  if (!Array.isArray(input.targets) || input.targets.length !== 3) {
    fail("targets must contain exactly three Provider targets", undefined, { field: "targets" });
  }
  const targets = input.targets.map((target, index) => {
    const field = `targets[${index}]`;
    assertExactKeys(target, TARGET_FIELDS, field);
    const expectedSlot = `P${index + 1}`;
    return Object.fromEntries(
      TARGET_FIELDS.map((targetField) => [
        targetField,
        normalizeTargetField(target[targetField], targetField, expectedSlot),
      ]),
    );
  });
  return immutable({
    schemaVersion: INPUT_SCHEMA_VERSION,
    oi07Revision,
    providedBy,
    providedAt,
    ownerAuthorizationRef,
    targets,
  });
}

function countUnknownForFields(targets, fields) {
  return targets.reduce(
    (count, target) => count + fields.filter((field) => isUnknown(target[field])).length,
    0,
  );
}

function countNotApplicable(targets) {
  return targets.reduce(
    (count, target) => count + TARGET_FIELDS.filter(
      (field) => typeof target[field] === "string" && target[field].startsWith("N/A("),
    ).length,
    0,
  );
}

function evaluateOi07ProviderTargetIntake(input) {
  const normalized = normalizeOi07ProviderTargetIntake(input);
  const auditUnknownCount = [
    normalized.oi07Revision,
    normalized.providedBy,
    normalized.providedAt,
    normalized.ownerAuthorizationRef,
  ].filter(isUnknown).length;
  const sharedUnknownCount = countUnknownForFields(normalized.targets, SHARED_TARGET_FIELDS);
  const d036OnlyUnknownCount = countUnknownForFields(normalized.targets, D036_ONLY_TARGET_FIELDS);
  const d053OnlyUnknownCount = countUnknownForFields(normalized.targets, D053_ONLY_TARGET_FIELDS);
  const targetUnknownFieldCount = countUnknownForFields(normalized.targets, TARGET_FIELDS);
  const notApplicableFieldCount = countNotApplicable(normalized.targets);
  const authorityMetadataComplete = auditUnknownCount === 0;
  const d036IntakeContractComplete = authorityMetadataComplete && sharedUnknownCount === 0 && d036OnlyUnknownCount === 0;
  const d053IntakeContractComplete = authorityMetadataComplete && sharedUnknownCount === 0 && d053OnlyUnknownCount === 0;
  const allIntakeFieldsComplete = d036IntakeContractComplete && d053IntakeContractComplete;
  const blockers = immutable([
    ...(authorityMetadataComplete ? [] : ["INPUT_AUTHORITY_METADATA_INCOMPLETE"]),
    ...(sharedUnknownCount === 0 ? [] : ["SHARED_TARGET_FIELDS_UNKNOWN"]),
    ...(d036OnlyUnknownCount === 0 ? [] : ["D036_TARGET_FIELDS_UNKNOWN"]),
    ...(d053OnlyUnknownCount === 0 ? [] : ["D053_TARGET_FIELDS_UNKNOWN"]),
    "INPUT_AUTHORITY_CALLER_ASSERTED_NOT_VERIFIED",
    "PROVIDER_FACTS_NOT_VERIFIED",
    "D036_EXECUTION_NOT_AUTHORIZED",
    "D053_EVIDENCE_COLLECTION_NOT_AUTHORIZED",
    "D053_NOT_AUTHORIZED",
  ]);
  const core = immutable({
    schemaVersion: RESULT_SCHEMA_VERSION,
    templateId: TEMPLATE_ID,
    disposition: allIntakeFieldsComplete
      ? "STRUCTURALLY_COMPLETE_INTAKE_ONLY"
      : "PARTIAL_UNKNOWN_BLOCKED",
    oi07Revision: normalized.oi07Revision,
    providerSlots: ["P1", "P2", "P3"],
    providerTargetCount: 3,
    perTargetFieldCount: TARGET_FIELDS.length,
    sharedPerTargetFieldCount: SHARED_TARGET_FIELDS.length,
    d036OnlyPerTargetFieldCount: D036_ONLY_TARGET_FIELDS.length,
    d053OnlyPerTargetFieldCount: D053_ONLY_TARGET_FIELDS.length,
    unionInputFieldCount: 30,
    auditUnknownCount,
    targetUnknownFieldCount,
    notApplicableFieldCount,
    sharedUnknownCount,
    d036OnlyUnknownCount,
    d053OnlyUnknownCount,
    authorityMetadataComplete,
    d036IntakeContractComplete,
    d053IntakeContractComplete,
    allIntakeFieldsComplete,
    blockers,
    inputFingerprint: fingerprint(normalized),
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateOi07ProviderTargetIntakeResult(result, input) {
  assertDataTree(result, "result");
  const expected = evaluateOi07ProviderTargetIntake(input);
  if (!isDeepStrictEqual(result, expected)) fail("OI-07 intake result or fingerprint was changed");
  return expected;
}

export {
  BOUNDARY,
  D036_ONLY_TARGET_FIELDS,
  D053_ONLY_TARGET_FIELDS,
  INPUT_SCHEMA_VERSION,
  SHARED_TARGET_FIELDS,
  TARGET_FIELDS,
  TEMPLATE_ID,
  evaluateOi07ProviderTargetIntake,
  normalizeOi07ProviderTargetIntake,
  validateOi07ProviderTargetIntakeResult,
};
