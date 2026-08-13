import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const POLICY_STATES = Object.freeze(["ALLOW", "DENY", "UNKNOWN", "EXPIRED"]);
const POLICY_ASSERTION_BOUNDARY = "CALLER_POLICY_ASSERTION_NOT_PROVIDER_TRUTH";
const D053_AUTHORIZATION_BOUNDARY = "CANDIDATE_NOT_OWNER_ACCEPTED";
const IDENTIFIER_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SHA256_RE = /^[a-f0-9]{64}$/;
const REGIONS = Object.freeze(["CN", "EU_EEA", "US", "GLOBAL", "OTHER"]);
const RISK_FIELDS = Object.freeze({
  retention: Object.freeze(["NONE", "BOUNDED", "UNBOUNDED", "UNKNOWN"]),
  training: Object.freeze(["PROHIBITED", "ALLOWED", "UNKNOWN"]),
  humanAccess: Object.freeze(["PROHIBITED", "ALLOWED", "UNKNOWN"]),
  deletionMechanism: Object.freeze(["AVAILABLE", "UNAVAILABLE", "UNKNOWN"]),
  advertisingMarketing: Object.freeze(["PROHIBITED", "ALLOWED", "UNKNOWN"]),
  healthDataUse: Object.freeze(["REQUESTED_SERVICE_ONLY", "OTHER_USE", "UNKNOWN"]),
});
const MAX_SCOPE_ITEMS = 64;

const BOUNDARY = Object.freeze({
  contractStatus: "SPIKE_LOCAL_ONLY_NON_PRODUCTION",
  d053DecisionState: "CANDIDATE",
  d053Authorization: "NOT_AUTHORIZED",
  policyTruth: POLICY_ASSERTION_BOUNDARY,
  networkRequests: 0,
  authorizationReads: 0,
  sensitiveBodySerializations: 0,
  keychainReads: 0,
  businessWrites: 0,
  systemClockRead: false,
  formalImplementationAuthorized: false,
});

function reject(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) reject(`${field} must be a plain record`, code, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) reject(`${field} must be a plain record`, code, { field });
  if (Object.getOwnPropertySymbols(value).length > 0) reject(`${field} contains symbol properties`, code, { field });
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (!descriptor.enumerable || descriptor.get || descriptor.set) reject(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
  }
}

function assertDenseArray(value, field, code) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length > 0) reject(`${field} must be a plain array`, code, { field });
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (key !== "length" && (!descriptor.enumerable || descriptor.get || descriptor.set)) reject(`${field} contains an unsupported property`, code, { field: `${field}.${key}` });
  }
  const keys = Object.keys(value);
  if (keys.length !== value.length || keys.some((key, index) => key !== String(index))) reject(`${field} must be dense and contain no extra properties`, code, { field });
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) reject(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  for (const key of required) if (!Object.hasOwn(value, key)) reject(`${field}.${key} is required`, code, { field: `${field}.${key}` });
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

function identifier(value, field, code = "INVALID_POLICY_VALUE") {
  if (typeof value !== "string" || !IDENTIFIER_RE.test(value)) reject(`${field} is invalid`, code, { field });
  return value;
}

function boundedString(value, field, code = "INVALID_POLICY_VALUE", maxBytes = 512) {
  if (typeof value !== "string" || value.trim().length === 0 || /[\u0000-\u001f\u007f]/u.test(value) || Buffer.byteLength(value, "utf8") > maxBytes) reject(`${field} is invalid`, code, { field });
  return value;
}

function sha256(value, field, code = "INVALID_POLICY_VALUE") {
  if (typeof value !== "string" || !SHA256_RE.test(value)) reject(`${field} must be a lowercase SHA-256`, code, { field });
  return value;
}

function validateIsoInstant(value, field, code = "INVALID_POLICY_TIMESTAMP") {
  boundedString(value, field, code, 64);
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/);
  const epoch = match ? Date.parse(value) : Number.NaN;
  if (!match || Number.isNaN(epoch)) reject(`${field} must be a UTC ISO instant`, code, { field });
  const instant = new Date(epoch);
  const parts = [instant.getUTCFullYear(), instant.getUTCMonth() + 1, instant.getUTCDate(), instant.getUTCHours(), instant.getUTCMinutes(), instant.getUTCSeconds()];
  const expected = match.slice(1, 7).map(Number);
  if (parts.some((part, index) => part !== expected[index])) reject(`${field} must be a real UTC ISO instant`, code, { field });
  return value;
}

function normalizeHttpsOrigin(value, field = "origin") {
  boundedString(value, field, "INVALID_HTTPS_ORIGIN", 2048);
  let url;
  try {
    url = new URL(value);
  } catch (cause) {
    reject(`${field} is not a valid URL`, "INVALID_HTTPS_ORIGIN", { field, cause });
  }
  if (url.protocol !== "https:") reject(`${field} must use HTTPS`, "HTTPS_REQUIRED", { field });
  if (!url.hostname || url.username || url.password || url.pathname !== "/" || url.search || url.hash) reject(`${field} must be an HTTPS origin`, "INVALID_HTTPS_ORIGIN", { field });
  return url.origin;
}

function normalizeHttpsBaseUrl(value) {
  boundedString(value, "baseURL", "INVALID_BASE_URL", 2048);
  let url;
  try {
    url = new URL(value);
  } catch (cause) {
    reject("baseURL is not a valid URL", "INVALID_BASE_URL", { cause });
  }
  if (url.protocol !== "https:") reject("baseURL must use HTTPS", "HTTPS_REQUIRED");
  if (!url.hostname || url.username || url.password || url.search || url.hash) reject("baseURL contains unsupported URL components", "INVALID_BASE_URL");
  return url.toString();
}

function normalizeStringSet(values, field) {
  assertDenseArray(values, field, "INVALID_POLICY_SCOPE");
  if (values.length === 0 || values.length > MAX_SCOPE_ITEMS) reject(`${field} is outside its item budget`, "INVALID_POLICY_SCOPE", { field });
  const normalized = values.map((value, index) => identifier(value, `${field}[${index}]`, "INVALID_POLICY_SCOPE"));
  if (new Set(normalized).size !== normalized.length) reject(`${field} must not contain duplicates`, "INVALID_POLICY_SCOPE", { field });
  return normalized.sort((left, right) => left.localeCompare(right, "en-US"));
}

function validateEvidenceReference(value, field) {
  assertExactKeys(value, ["kind", "value"], [], field, "INVALID_POLICY_EVIDENCE_REFERENCE");
  if (value.kind === "HTTPS_URL") {
    let url;
    try {
      url = new URL(boundedString(value.value, `${field}.value`, "INVALID_POLICY_EVIDENCE_REFERENCE", 2048));
    } catch (cause) {
      reject(`${field}.value is invalid`, "INVALID_POLICY_EVIDENCE_REFERENCE", { field, cause });
    }
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.hash) reject(`${field}.value must be a safe HTTPS URL`, "INVALID_POLICY_EVIDENCE_REFERENCE", { field });
    return immutable({ kind: "HTTPS_URL", value: url.toString() });
  }
  if (value.kind === "SNAPSHOT_SHA256") return immutable({ kind: "SNAPSHOT_SHA256", value: sha256(value.value, `${field}.value`, "INVALID_POLICY_EVIDENCE_REFERENCE") });
  reject(`${field}.kind is unsupported`, "INVALID_POLICY_EVIDENCE_REFERENCE", { field: `${field}.kind` });
}

function normalizeRiskProfile(value) {
  assertExactKeys(value, Object.keys(RISK_FIELDS), [], "riskProfile", "INVALID_POLICY_RISK_PROFILE");
  const normalized = {};
  for (const [field, allowed] of Object.entries(RISK_FIELDS)) {
    if (!allowed.includes(value[field])) reject(`riskProfile.${field} is unsupported`, "INVALID_POLICY_RISK_PROFILE", { field: `riskProfile.${field}` });
    normalized[field] = value[field];
  }
  return immutable(normalized);
}

function createProviderPolicyProfile(input) {
  assertExactKeys(
    input,
    ["schemaVersion", "providerId", "origin", "models", "payloadClasses", "profileVersion", "termsEvidence", "privacyEvidence", "reviewedAt", "expiresAt", "riskProfile", "state", "reviewBasis", "region"],
    [],
    "profileInput",
    "INVALID_PROVIDER_POLICY_PROFILE",
  );
  if (input.schemaVersion !== "PROVIDER_POLICY_PROFILE_INPUT_V1" || !POLICY_STATES.includes(input.state) || !REGIONS.includes(input.region)) reject("provider policy profile input is unsupported", "INVALID_PROVIDER_POLICY_PROFILE");
  const reviewedAt = validateIsoInstant(input.reviewedAt, "profileInput.reviewedAt");
  const expiresAt = validateIsoInstant(input.expiresAt, "profileInput.expiresAt");
  if (Date.parse(expiresAt) <= Date.parse(reviewedAt)) reject("profile expiry must follow review", "INVALID_POLICY_VALIDITY_WINDOW");
  const core = immutable({
    schemaVersion: "PROVIDER_POLICY_PROFILE_V1",
    providerId: identifier(input.providerId, "profileInput.providerId", "INVALID_PROVIDER_POLICY_PROFILE"),
    origin: normalizeHttpsOrigin(input.origin, "profileInput.origin"),
    models: normalizeStringSet(input.models, "profileInput.models"),
    payloadClasses: normalizeStringSet(input.payloadClasses, "profileInput.payloadClasses"),
    profileVersion: identifier(input.profileVersion, "profileInput.profileVersion", "INVALID_PROVIDER_POLICY_PROFILE"),
    termsEvidence: validateEvidenceReference(input.termsEvidence, "profileInput.termsEvidence"),
    privacyEvidence: validateEvidenceReference(input.privacyEvidence, "profileInput.privacyEvidence"),
    reviewedAt,
    expiresAt,
    riskProfile: normalizeRiskProfile(input.riskProfile),
    state: input.state,
    reviewBasis: boundedString(input.reviewBasis, "profileInput.reviewBasis", "INVALID_PROVIDER_POLICY_PROFILE", 1024),
    region: input.region,
    assertionBoundary: POLICY_ASSERTION_BOUNDARY,
  });
  return immutable({ ...core, profileFingerprint: fingerprint(core) });
}

function normalizeProviderPolicyProfile(input) {
  assertExactKeys(
    input,
    ["schemaVersion", "providerId", "origin", "models", "payloadClasses", "profileVersion", "termsEvidence", "privacyEvidence", "reviewedAt", "expiresAt", "riskProfile", "state", "reviewBasis", "region", "assertionBoundary", "profileFingerprint"],
    [],
    "profile",
    "INVALID_PROVIDER_POLICY_PROFILE",
  );
  if (input.schemaVersion !== "PROVIDER_POLICY_PROFILE_V1" || input.assertionBoundary !== POLICY_ASSERTION_BOUNDARY) reject("provider policy profile boundary is invalid", "INVALID_PROVIDER_POLICY_PROFILE");
  sha256(input.profileFingerprint, "profile.profileFingerprint", "INVALID_PROVIDER_POLICY_PROFILE");
  const expected = createProviderPolicyProfile({ schemaVersion: "PROVIDER_POLICY_PROFILE_INPUT_V1", ...Object.fromEntries([
    "providerId", "origin", "models", "payloadClasses", "profileVersion", "termsEvidence", "privacyEvidence", "reviewedAt", "expiresAt", "riskProfile", "state", "reviewBasis", "region",
  ].map((field) => [field, input[field]])) });
  if (!isDeepStrictEqual(input, expected)) reject("provider policy profile or fingerprint was changed", "INVALID_PROVIDER_POLICY_PROFILE");
  return expected;
}

function createD053AuthorizationEvidence(input) {
  assertExactKeys(input, ["schemaVersion", "evidenceId", "recordedAt"], [], "authorizationInput", "INVALID_D053_AUTHORIZATION_EVIDENCE");
  if (input.schemaVersion !== "D053_AUTHORIZATION_INPUT_V1") reject("D-053 authorization input is unsupported", "INVALID_D053_AUTHORIZATION_EVIDENCE");
  const core = immutable({
    schemaVersion: "D053_AUTHORIZATION_EVIDENCE_V1",
    evidenceId: identifier(input.evidenceId, "authorizationInput.evidenceId", "INVALID_D053_AUTHORIZATION_EVIDENCE"),
    decisionId: "D-053",
    decisionState: "CANDIDATE",
    authorization: "NOT_AUTHORIZED",
    recordedAt: validateIsoInstant(input.recordedAt, "authorizationInput.recordedAt", "INVALID_D053_AUTHORIZATION_EVIDENCE"),
    authorizationBoundary: D053_AUTHORIZATION_BOUNDARY,
  });
  return immutable({ ...core, authorizationFingerprint: fingerprint(core) });
}

function normalizeD053AuthorizationEvidence(input) {
  assertExactKeys(input, ["schemaVersion", "evidenceId", "decisionId", "decisionState", "authorization", "recordedAt", "authorizationBoundary", "authorizationFingerprint"], [], "authorizationEvidence", "INVALID_D053_AUTHORIZATION_EVIDENCE");
  if (input.schemaVersion !== "D053_AUTHORIZATION_EVIDENCE_V1" || input.decisionId !== "D-053" || input.decisionState !== "CANDIDATE" || input.authorization !== "NOT_AUTHORIZED" || input.authorizationBoundary !== D053_AUTHORIZATION_BOUNDARY) reject("D-053 remains candidate and unauthorized", "INVALID_D053_AUTHORIZATION_EVIDENCE");
  sha256(input.authorizationFingerprint, "authorizationEvidence.authorizationFingerprint", "INVALID_D053_AUTHORIZATION_EVIDENCE");
  const expected = createD053AuthorizationEvidence({ schemaVersion: "D053_AUTHORIZATION_INPUT_V1", evidenceId: input.evidenceId, recordedAt: input.recordedAt });
  if (!isDeepStrictEqual(input, expected)) reject("D-053 authorization evidence was changed", "INVALID_D053_AUTHORIZATION_EVIDENCE");
  return expected;
}

function createPolicyCheckSubject(input) {
  assertExactKeys(input, ["schemaVersion", "providerId", "baseURL", "model", "payloadClass", "profileVersion", "region", "observedAt"], [], "subjectInput", "INVALID_POLICY_CHECK_SUBJECT");
  if (input.schemaVersion !== "POLICY_CHECK_SUBJECT_INPUT_V1" || !REGIONS.includes(input.region)) reject("policy check subject input is unsupported", "INVALID_POLICY_CHECK_SUBJECT");
  const baseURL = normalizeHttpsBaseUrl(input.baseURL);
  const core = immutable({
    schemaVersion: "POLICY_CHECK_SUBJECT_V1",
    providerId: identifier(input.providerId, "subjectInput.providerId", "INVALID_POLICY_CHECK_SUBJECT"),
    baseURL,
    origin: new URL(baseURL).origin,
    model: identifier(input.model, "subjectInput.model", "INVALID_POLICY_CHECK_SUBJECT"),
    payloadClass: identifier(input.payloadClass, "subjectInput.payloadClass", "INVALID_POLICY_CHECK_SUBJECT"),
    profileVersion: identifier(input.profileVersion, "subjectInput.profileVersion", "INVALID_POLICY_CHECK_SUBJECT"),
    region: input.region,
    observedAt: validateIsoInstant(input.observedAt, "subjectInput.observedAt", "INVALID_POLICY_CHECK_SUBJECT"),
  });
  return immutable({ ...core, subjectFingerprint: fingerprint(core) });
}

function normalizePolicyCheckSubject(input) {
  assertExactKeys(input, ["schemaVersion", "providerId", "baseURL", "origin", "model", "payloadClass", "profileVersion", "region", "observedAt", "subjectFingerprint"], [], "subject", "INVALID_POLICY_CHECK_SUBJECT");
  if (input.schemaVersion !== "POLICY_CHECK_SUBJECT_V1") reject("policy check subject is unsupported", "INVALID_POLICY_CHECK_SUBJECT");
  sha256(input.subjectFingerprint, "subject.subjectFingerprint", "INVALID_POLICY_CHECK_SUBJECT");
  const expected = createPolicyCheckSubject({ schemaVersion: "POLICY_CHECK_SUBJECT_INPUT_V1", ...Object.fromEntries(["providerId", "baseURL", "model", "payloadClass", "profileVersion", "region", "observedAt"].map((field) => [field, input[field]])) });
  if (!isDeepStrictEqual(input, expected)) reject("policy check subject or fingerprint was changed", "INVALID_POLICY_CHECK_SUBJECT");
  return expected;
}

function policyCheck(input) {
  try {
    assertExactKeys(input, ["subject", "profile", "authorizationEvidence"], [], "policyCheckInput", "INVALID_POLICY_CHECK_REQUEST");
    const subject = normalizePolicyCheckSubject(input.subject);
    const profile = normalizeProviderPolicyProfile(input.profile);
    const authorizationEvidence = normalizeD053AuthorizationEvidence(input.authorizationEvidence);
    const scoped = profile.providerId === subject.providerId
      && profile.origin === subject.origin
      && profile.models.includes(subject.model)
      && profile.payloadClasses.includes(subject.payloadClass)
      && profile.profileVersion === subject.profileVersion
      && (profile.region === "GLOBAL" || profile.region === subject.region);
    const withinWindow = Date.parse(subject.observedAt) >= Date.parse(profile.reviewedAt)
      && Date.parse(subject.observedAt) < Date.parse(profile.expiresAt);
    const appleProhibitedUseAbsent = profile.riskProfile.training === "PROHIBITED"
      && profile.riskProfile.advertisingMarketing === "PROHIBITED"
      && profile.riskProfile.healthDataUse === "REQUESTED_SERVICE_ONLY";
    const profileStateAllows = profile.state === "ALLOW" && withinWindow && appleProhibitedUseAbsent;
    const core = immutable({
      schemaVersion: "POLICY_CHECK_RESULT_V1",
      eligible: false,
      reason: authorizationEvidence.authorization !== "AUTHORIZED"
        ? "D053_NOT_AUTHORIZED"
        : !scoped
          ? "SCOPE_MISMATCH"
          : !withinWindow
            ? "PROFILE_EXPIRED_OR_NOT_YET_VALID"
            : profile.state !== "ALLOW"
              ? profile.state
              : "PROVIDER_ELIGIBLE",
      subjectFingerprint: subject.subjectFingerprint,
      profileFingerprint: profile.profileFingerprint,
      authorizationFingerprint: authorizationEvidence.authorizationFingerprint,
      scopeMatched: scoped,
      appleProhibitedUseAbsent,
      profileStateAllows,
      authorizationGranted: false,
      boundary: BOUNDARY,
    });
    return immutable({ ...core, resultFingerprint: fingerprint(core) });
  } catch (error) {
    return immutable({
      schemaVersion: "POLICY_CHECK_RESULT_V1",
      eligible: false,
      reason: "INVALID_POLICY_EVIDENCE",
      error: { code: error.code || "INVALID_POLICY_EVIDENCE", message: error.message },
      boundary: BOUNDARY,
    });
  }
}

function emptyBusinessState() {
  return immutable({ records: [] });
}

function cloneBusinessState(state) {
  assertExactKeys(state, ["records"], [], "businessState", "INVALID_BUSINESS_STATE");
  assertDenseArray(state.records, "businessState.records", "INVALID_BUSINESS_STATE");
  return immutable({ records: state.records.map((record, index) => {
    assertPlainRecord(record, `businessState.records[${index}]`, "INVALID_BUSINESS_STATE");
    return clone(record);
  }) });
}

function requestCandidate(input) {
  assertExactKeys(
    input,
    ["subject", "profile", "authorizationEvidence"],
    ["state", "userInitiated", "previewConfirmed"],
    "requestCandidateInput",
    "INVALID_REQUEST_CANDIDATE_INPUT",
  );
  const {
    subject,
    profile,
    authorizationEvidence,
    state = emptyBusinessState(),
    userInitiated = false,
    previewConfirmed = false,
  } = input;
  const before = cloneBusinessState(state);
  try {
    if (typeof userInitiated !== "boolean" || typeof previewConfirmed !== "boolean") reject("request gate flags must be boolean", "INVALID_REQUEST_GATE");
    if (!userInitiated) reject("request must be initiated by the user", "USER_ACTION_REQUIRED");
    const normalizedSubject = normalizePolicyCheckSubject(subject);
    if (normalizedSubject.payloadClass === "nutrition-label-photo" && !previewConfirmed) reject("label photo requires preview confirmation", "PREVIEW_CONFIRMATION_REQUIRED");
    const check = policyCheck({ subject, profile, authorizationEvidence });
    if (!check.eligible) reject(`provider blocked: ${check.reason}`, "PROVIDER_BLOCKED", { reason: check.reason });
    reject("real transport remains unavailable in this harness", "TRANSPORT_NOT_IMPLEMENTED");
  } catch (error) {
    return immutable({
      status: "BLOCKED",
      subjectFingerprint: subject?.subjectFingerprint ?? null,
      transport: "NOT_SENT",
      authorizationRead: false,
      sensitiveBodySerialized: false,
      state: before,
      persisted: false,
      error: { code: error.code ?? "PROVIDER_BLOCKED", reason: error.reason ?? null, message: error.message },
      boundary: BOUNDARY,
    });
  }
}

function commitCandidate(candidate, state = emptyBusinessState()) {
  const before = cloneBusinessState(state);
  return immutable({ committed: false, state: before, error: { code: candidate?.status === "CANDIDATE" ? "USER_ACCEPTANCE_REQUIRED" : "INVALID_CANDIDATE" }, boundary: BOUNDARY });
}

export {
  BOUNDARY,
  D053_AUTHORIZATION_BOUNDARY,
  POLICY_ASSERTION_BOUNDARY,
  POLICY_STATES,
  REGIONS,
  RISK_FIELDS,
  commitCandidate,
  createD053AuthorizationEvidence,
  createPolicyCheckSubject,
  createProviderPolicyProfile,
  emptyBusinessState,
  normalizeHttpsBaseUrl,
  normalizeD053AuthorizationEvidence,
  normalizePolicyCheckSubject,
  normalizeProviderPolicyProfile,
  policyCheck,
  requestCandidate,
};
