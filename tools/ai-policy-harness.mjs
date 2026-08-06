const POLICY_STATES = Object.freeze(["ALLOW", "DENY", "UNKNOWN", "EXPIRED"]);

function reject(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code }, details);
  throw error;
}

function normalizeHttpsBaseUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    reject("baseURL is required", "MISSING_BASE_URL");
  }
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    reject("baseURL is not a valid URL", "INVALID_BASE_URL", { cause: error });
  }
  if (url.protocol !== "https:") {
    reject("baseURL must use HTTPS", "HTTPS_REQUIRED");
  }
  if (!url.hostname) {
    reject("baseURL hostname is required", "MISSING_HOSTNAME");
  }
  url.hash = "";
  return url.toString();
}

function assertPolicyState(state) {
  if (!POLICY_STATES.includes(state)) {
    reject(`unsupported policy state: ${state}`, "INVALID_POLICY_STATE");
  }
  return state;
}

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    reject(`${field} must be a non-empty string`, "INVALID_POLICY_SCOPE", { field });
  }
  return value;
}

function normalizeHttpsOrigin(value, field = "origin") {
  nonEmptyString(value, field);
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    reject(`${field} is not a valid URL`, "INVALID_HTTPS_ORIGIN", { field, cause: error });
  }
  if (url.protocol !== "https:") {
    reject(`${field} must use HTTPS`, "HTTPS_REQUIRED", { field });
  }
  if (!url.hostname || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    reject(`${field} must be an HTTPS origin`, "INVALID_HTTPS_ORIGIN", { field });
  }
  return url.origin;
}

function matchesPolicy(policy, request) {
  if (!policy || typeof policy !== "object") return false;
  if (assertPolicyState(policy.state) !== "ALLOW") return false;
  const policyOrigin = normalizeHttpsOrigin(policy.origin, "policy.origin");
  const policyModel = nonEmptyString(policy.model, "policy.model");
  const policyProfileVersion = nonEmptyString(policy.profileVersion, "policy.profileVersion");
  if (!Array.isArray(policy.payloadClasses) || policy.payloadClasses.length === 0) {
    reject("policy.payloadClasses must be a non-empty array", "INVALID_POLICY_SCOPE", { field: "policy.payloadClasses" });
  }
  if (policy.payloadClasses.some((payloadClass) => typeof payloadClass !== "string" || payloadClass.trim().length === 0)) {
    reject("policy.payloadClasses must contain non-empty strings", "INVALID_POLICY_SCOPE", { field: "policy.payloadClasses" });
  }
  return policyOrigin === request.origin
    && policyModel === request.model
    && policy.payloadClasses.includes(request.payloadClass)
    && policyProfileVersion === request.profileVersion;
}

function emptyBusinessState() {
  return Object.freeze({ records: [] });
}

function cloneBusinessState(state) {
  if (!state || typeof state !== "object" || !Array.isArray(state.records)) {
    reject("business state must contain records", "INVALID_BUSINESS_STATE");
  }
  return { records: state.records.map((record) => ({ ...record })) };
}

function policyCheck({ baseURL, model, payloadClass, profileVersion, policy }) {
  const origin = new URL(normalizeHttpsBaseUrl(baseURL)).origin;
  const request = Object.freeze({
    origin: normalizeHttpsOrigin(origin, "request.origin"),
    model: nonEmptyString(model, "request.model"),
    payloadClass: nonEmptyString(payloadClass, "request.payloadClass"),
    profileVersion: nonEmptyString(profileVersion, "request.profileVersion"),
  });
  if (assertPolicyState(policy?.state ?? "UNKNOWN") !== "ALLOW") {
    return Object.freeze({ eligible: false, reason: policy?.state ?? "UNKNOWN", request });
  }
  if (!matchesPolicy(policy, request)) {
    return Object.freeze({ eligible: false, reason: "SCOPE_MISMATCH", request });
  }
  return Object.freeze({ eligible: true, reason: "PROVIDER_ELIGIBLE", request });
}

function requestCandidate({ state = emptyBusinessState(), baseURL, model, payloadClass, profileVersion, policy, userInitiated = false, previewConfirmed = false, labelPhoto = false }) {
  const before = cloneBusinessState(state);
  try {
    const check = policyCheck({ baseURL, model, payloadClass, profileVersion, policy });
    if (!check.eligible) {
      reject(`provider blocked: ${check.reason}`, "PROVIDER_BLOCKED", { reason: check.reason });
    }
    if (!userInitiated) {
      reject("request must be initiated by the user", "USER_ACTION_REQUIRED");
    }
    if (labelPhoto && !previewConfirmed) {
      reject("label photo requires preview confirmation", "PREVIEW_CONFIRMATION_REQUIRED");
    }
    return Object.freeze({
      status: "CANDIDATE",
      request: check.request,
      transport: "NOT_SENT",
      state: before,
      persisted: false,
      error: null,
    });
  } catch (error) {
    return Object.freeze({
      status: "BLOCKED",
      request: null,
      transport: "NOT_SENT",
      state: before,
      persisted: false,
      error: { code: error.code ?? "PROVIDER_BLOCKED", message: error.message },
    });
  }
}

function commitCandidate(candidate, state = emptyBusinessState()) {
  const before = cloneBusinessState(state);
  if (!candidate || candidate.status !== "CANDIDATE" || candidate.transport !== "NOT_SENT") {
    return Object.freeze({ committed: false, state: before, error: { code: "INVALID_CANDIDATE" } });
  }
  return Object.freeze({
    committed: false,
    state: before,
    error: { code: "USER_ACCEPTANCE_REQUIRED", message: "candidate must be edited and explicitly accepted before persistence" },
  });
}

export {
  POLICY_STATES,
  commitCandidate,
  emptyBusinessState,
  normalizeHttpsBaseUrl,
  policyCheck,
  requestCandidate,
};
