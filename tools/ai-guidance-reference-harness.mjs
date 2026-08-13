import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { normalizeAiRequestEvidenceContext } from "./ai-request-evidence-context-harness.mjs";
import { parseManifestPreAuth } from "./data-pack-contract-harness.mjs";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;
const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_JSON_DEPTH = 8;
const MAX_JSON_ITEMS = 256;
const MAX_JSON_STRING = 4096;

const STATUSES = Object.freeze({
  REVIEWING: "REVIEWING",
  EDITING: "EDITING",
  DISCARDED: "DISCARDED",
});

const BOUNDARY = Object.freeze({
  schemaVersion: "AI_GUIDANCE_REFERENCE_BOUNDARY_V1",
  contentUse: "REFERENCE_ONLY",
  medicalStatus: "NOT_MEDICAL_ADVICE",
  medicalSafetyEvaluation: "NOT_PERFORMED",
  highRiskUse: "NOT_AUTHORIZED",
  businessMutation: "NOT_AUTHORIZED",
  persistence: "UXD_11_NOT_DECIDED",
});

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code = "INVALID_AI_GUIDANCE_VALUE") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be a plain record`, code, { field });
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${field} must be a plain record`, code, { field });
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of Reflect.ownKeys(descriptors)) {
    const childField = `${field}.${String(key)}`;
    const descriptor = descriptors[key];
    if (typeof key !== "string" || !("value" in descriptor) || !descriptor.enumerable) {
      fail(`${childField} must be an enumerable data property`, code, { field: childField });
    }
  }
  return value;
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) {
      fail(`${field} contains an unsupported field`, code, { field: `${field}.${String(key)}` });
    }
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, code, { field: `${field}.${key}` });
  }
}

function clone(value, seen = new Map()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const result = Array.isArray(value) ? [] : {};
  seen.set(value, result);
  for (const [key, child] of Object.entries(value)) result[key] = clone(child, seen);
  return result;
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

function identifier(value, field, code = "INVALID_AI_GUIDANCE_VALUE") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function sha256(value, field, code = "INVALID_AI_GUIDANCE_VALUE") {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function isSecretField(key) {
  const normalized = key.replace(/[-_]/g, "").toLowerCase();
  return normalized === "authorization" ||
    normalized.endsWith("apikey") ||
    normalized.endsWith("accesstoken") ||
    normalized.endsWith("refreshtoken") ||
    normalized.endsWith("password") ||
    normalized.endsWith("secret");
}

function safeJson(value, field) {
  let items = 0;
  const seen = new Set();

  function visit(current, currentField, depth) {
    if (depth > MAX_JSON_DEPTH) fail(`${currentField} exceeds the depth budget`, "AI_GUIDANCE_RESOURCE_LIMIT", { field: currentField });
    if (current === null || typeof current === "boolean") return;
    if (typeof current === "string") {
      if (current.length > MAX_JSON_STRING) fail(`${currentField} exceeds the string budget`, "AI_GUIDANCE_RESOURCE_LIMIT", { field: currentField });
      return;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) fail(`${currentField} contains an invalid number`, "INVALID_AI_GUIDANCE_VALUE", { field: currentField });
      return;
    }
    if (!current || typeof current !== "object") {
      fail(`${currentField} is not JSON-safe`, "INVALID_AI_GUIDANCE_VALUE", { field: currentField });
    }
    if (seen.has(current)) fail(`${currentField} contains a cycle`, "INVALID_AI_GUIDANCE_VALUE", { field: currentField });
    seen.add(current);

    const descriptors = Object.getOwnPropertyDescriptors(current);
    for (const key of Reflect.ownKeys(descriptors)) {
      const childField = `${currentField}.${String(key)}`;
      if (typeof key !== "string" || !("value" in descriptors[key])) {
        fail(`${childField} must be a data property`, "INVALID_AI_GUIDANCE_VALUE", { field: childField });
      }
    }

    if (Array.isArray(current)) {
      const keys = Reflect.ownKeys(current).filter((key) => key !== "length");
      if (
        keys.length !== current.length ||
        keys.some((key) =>
          typeof key !== "string" ||
          !("value" in descriptors[key]) ||
          !descriptors[key].enumerable
        ) ||
        Array.from({ length: current.length }, (_, index) => String(index)).some((key) => !Object.hasOwn(current, key))
      ) {
        fail(`${currentField} contains non-JSON array properties`, "INVALID_AI_GUIDANCE_VALUE", { field: currentField });
      }
      items += current.length;
      if (items > MAX_JSON_ITEMS) fail(`${field} exceeds the item budget`, "AI_GUIDANCE_RESOURCE_LIMIT", { field });
      for (const [index, child] of current.entries()) visit(child, `${currentField}[${index}]`, depth + 1);
    } else {
      assertPlainRecord(current, currentField);
      const entries = Object.entries(current);
      items += entries.length;
      if (items > MAX_JSON_ITEMS) fail(`${field} exceeds the item budget`, "AI_GUIDANCE_RESOURCE_LIMIT", { field });
      for (const [key, child] of entries) {
        if (["__proto__", "prototype", "constructor"].includes(key) || isSecretField(key)) {
          fail(`${currentField}.${key} is not permitted`, "AI_GUIDANCE_SECRET_FIELD", { field: `${currentField}.${key}` });
        }
        visit(child, `${currentField}.${key}`, depth + 1);
      }
    }
    seen.delete(current);
  }

  visit(value, field, 0);
  const normalized = clone(value);
  if (Buffer.byteLength(canonicalStringify(normalized), "utf8") > MAX_RESPONSE_BYTES) {
    fail(`${field} exceeds the byte budget`, "AI_GUIDANCE_RESOURCE_LIMIT", { field });
  }
  return immutable(normalized);
}

function nonEmptyDefinitionPayload(value, field) {
  const normalized = safeJson(value, field);
  if (
    normalized === null ||
    (typeof normalized === "string" && normalized.trim().length === 0) ||
    (Array.isArray(normalized) && normalized.length === 0) ||
    (typeof normalized === "object" && !Array.isArray(normalized) && Object.keys(normalized).length === 0)
  ) {
    fail(`${field} must be non-empty`, "INVALID_AI_GUIDANCE_DEFINITION", { field });
  }
  return normalized;
}

function instant(value, field) {
  const match = typeof value === "string" ? INSTANT.exec(value) : null;
  if (!match || !Number.isFinite(Date.parse(value))) {
    fail(`${field} must be an ISO instant with explicit offset`, "INVALID_AI_GUIDANCE_INSTANT", { field });
  }
  const [, year, month, day, hour, minute, second, zone] = match;
  const offset = zone === "Z" ? null : zone.slice(1).split(":").map(Number);
  if (
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59 ||
    (offset && (offset[0] > 23 || offset[1] > 59)) ||
    new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString().slice(0, 10) !== `${year}-${month}-${day}`
  ) fail(`${field} is not a real instant`, "INVALID_AI_GUIDANCE_INSTANT", { field });
  return value;
}

function normalizeContext(input, field = "context") {
  try {
    return normalizeAiRequestEvidenceContext(input, field);
  } catch (cause) {
    fail(`${field} is invalid`, "INVALID_AI_GUIDANCE_CONTEXT", { field, cause });
  }
}

function normalizeDefinition(input, expectedVersion, field) {
  assertExactKeys(
    input,
    ["schemaVersion", "definitionId", "definitionVersion", "definitionFingerprint", "payload"],
    [],
    field,
    "INVALID_AI_GUIDANCE_DEFINITION",
  );
  if (input.schemaVersion !== expectedVersion) {
    fail(`${field}.schemaVersion is unsupported`, "INVALID_AI_GUIDANCE_DEFINITION", { field: `${field}.schemaVersion` });
  }
  const normalizedPayload = nonEmptyDefinitionPayload(input.payload, `${field}.payload`);
  const core = immutable({
    schemaVersion: expectedVersion,
    definitionId: identifier(input.definitionId, `${field}.definitionId`, "INVALID_AI_GUIDANCE_DEFINITION"),
    definitionVersion: identifier(input.definitionVersion, `${field}.definitionVersion`, "INVALID_AI_GUIDANCE_DEFINITION"),
    payload: normalizedPayload,
  });
  const expectedFingerprint = fingerprint(core);
  if (input.definitionFingerprint !== expectedFingerprint) {
    fail(`${field}.definitionFingerprint is invalid`, "INVALID_AI_GUIDANCE_DEFINITION", { field: `${field}.definitionFingerprint` });
  }
  return immutable({ ...core, definitionFingerprint: expectedFingerprint });
}

function parseGuidanceResponse(responseText) {
  if (typeof responseText !== "string") fail("response must be text", "INVALID_AI_GUIDANCE_RESPONSE");
  if (Buffer.byteLength(responseText, "utf8") > MAX_RESPONSE_BYTES) {
    fail("response exceeds the byte budget", "AI_GUIDANCE_RESOURCE_LIMIT");
  }
  let parsed;
  try {
    parsed = parseManifestPreAuth(responseText, {
      maxManifestBytes: MAX_RESPONSE_BYTES,
      maxJsonDepth: MAX_JSON_DEPTH,
      maxObjectKeys: MAX_JSON_ITEMS,
      maxArrayItems: MAX_JSON_ITEMS,
    });
  } catch (cause) {
    if (["JSON_DEPTH_LIMIT", "JSON_OBJECT_KEY_LIMIT", "JSON_ARRAY_ITEM_LIMIT"].includes(cause?.code)) {
      fail("response exceeds the structural budget", "AI_GUIDANCE_RESOURCE_LIMIT", { cause });
    }
    if (cause?.code === "DUPLICATE_JSON_KEY") {
      fail("response contains a duplicate JSON key", "AI_GUIDANCE_DUPLICATE_JSON_KEY", { cause });
    }
    fail("response is not valid JSON", "INVALID_AI_GUIDANCE_RESPONSE", { cause });
  }
  assertExactKeys(parsed, ["schemaVersion", "content"], [], "response", "INVALID_AI_GUIDANCE_RESPONSE");
  if (parsed.schemaVersion !== 1 || parsed.content === null) {
    fail("response version or content is invalid", "INVALID_AI_GUIDANCE_RESPONSE");
  }
  return immutable({ schemaVersion: 1, content: safeJson(parsed.content, "response.content") });
}

function sourceEvidence({ context, generatedAt, response, content }) {
  return immutable({
    schemaVersion: "AI_GUIDANCE_SOURCE_EVIDENCE_V2",
    sourceKind: "AI_GENERATED_REFERENCE_DRAFT",
    requestId: context.requestId,
    providerId: context.policySubject.providerId,
    origin: context.policySubject.origin,
    model: context.policySubject.model,
    payloadClass: context.policySubject.payloadClass,
    transportProfileVersion: context.transportProfileVersion,
    policyProfileVersion: context.policySubject.profileVersion,
    policySubjectFingerprint: context.policySubject.subjectFingerprint,
    policyProfileFingerprint: context.policyProfile.profileFingerprint,
    authorizationFingerprint: context.authorizationEvidence.authorizationFingerprint,
    policyCheckFingerprint: context.policyCheck.resultFingerprint,
    requestContextFingerprint: context.contextFingerprint,
    responseFingerprint: fingerprint(response),
    originalContentFingerprint: fingerprint(content),
    generatedAt,
  });
}

function activeDraftEvidence(state) {
  const core = immutable({
    schemaVersion: "AI_GUIDANCE_DRAFT_EVIDENCE_V2",
    requestContextFingerprint: state.sourceEvidence.requestContextFingerprint,
    sourceEvidenceFingerprint: fingerprint(state.sourceEvidence),
    contentDefinitionFingerprint: state.contentDefinition.definitionFingerprint,
    disclaimerDefinitionFingerprint: state.disclaimerDefinition.definitionFingerprint,
    currentContentFingerprint: state.currentContentFingerprint,
    revision: state.revision,
    userEdited: state.userEdited,
  });
  return immutable({ ...core, draftFingerprint: fingerprint(core) });
}

function normalizeSourceEvidence(input, context, generatedAt, field = "state.sourceEvidence") {
  assertExactKeys(
    input,
    [
      "schemaVersion", "sourceKind", "requestId", "providerId", "origin", "model", "payloadClass", "transportProfileVersion",
      "policyProfileVersion", "policySubjectFingerprint", "policyProfileFingerprint", "authorizationFingerprint",
      "policyCheckFingerprint", "requestContextFingerprint", "responseFingerprint",
      "originalContentFingerprint", "generatedAt",
    ],
    [],
    field,
    "INVALID_AI_GUIDANCE_STATE",
  );
  const expectedContextFields = {
    requestId: context.requestId,
    providerId: context.policySubject.providerId,
    origin: context.policySubject.origin,
    model: context.policySubject.model,
    payloadClass: context.policySubject.payloadClass,
    transportProfileVersion: context.transportProfileVersion,
    policyProfileVersion: context.policySubject.profileVersion,
    policySubjectFingerprint: context.policySubject.subjectFingerprint,
    policyProfileFingerprint: context.policyProfile.profileFingerprint,
    authorizationFingerprint: context.authorizationEvidence.authorizationFingerprint,
    policyCheckFingerprint: context.policyCheck.resultFingerprint,
  };
  if (
    input.schemaVersion !== "AI_GUIDANCE_SOURCE_EVIDENCE_V2" ||
    input.sourceKind !== "AI_GENERATED_REFERENCE_DRAFT" ||
    input.generatedAt !== generatedAt ||
    input.requestContextFingerprint !== context.contextFingerprint ||
    Object.entries(expectedContextFields).some(([key, value]) => input[key] !== value)
  ) fail("guidance source evidence is invalid", "INVALID_AI_GUIDANCE_STATE", { field });
  sha256(input.responseFingerprint, `${field}.responseFingerprint`, "INVALID_AI_GUIDANCE_STATE");
  sha256(input.originalContentFingerprint, `${field}.originalContentFingerprint`, "INVALID_AI_GUIDANCE_STATE");
  for (const key of ["policySubjectFingerprint", "policyProfileFingerprint", "authorizationFingerprint", "policyCheckFingerprint", "requestContextFingerprint"]) {
    sha256(input[key], `${field}.${key}`, "INVALID_AI_GUIDANCE_STATE");
  }
  return immutable(input);
}

function assertState(state) {
  assertExactKeys(
    state,
    [
      "schemaVersion", "status", "retention", "boundary", "context", "generatedAt", "contentDefinition",
      "disclaimerDefinition", "originalContent", "content", "sourceEvidence", "revision", "userEdited",
      "currentContentFingerprint", "draftEvidence", "discardEvidence", "effect",
    ],
    [],
    "state",
    "INVALID_AI_GUIDANCE_STATE",
  );
  if (state.schemaVersion !== "AI_GUIDANCE_REFERENCE_STATE_V2" || !Object.values(STATUSES).includes(state.status)) {
    fail("guidance state is invalid", "INVALID_AI_GUIDANCE_STATE");
  }
  const context = normalizeContext(state.context, "state.context");
  if (!isDeepStrictEqual(state.context, context)) fail("guidance context is not normalized", "INVALID_AI_GUIDANCE_STATE");
  const generatedAt = instant(state.generatedAt, "state.generatedAt");
  const contentDefinition = normalizeDefinition(
    state.contentDefinition,
    "AI_GUIDANCE_CONTENT_DEFINITION_V1",
    "state.contentDefinition",
  );
  const disclaimerDefinition = normalizeDefinition(
    state.disclaimerDefinition,
    "AI_GUIDANCE_DISCLAIMER_DEFINITION_V1",
    "state.disclaimerDefinition",
  );
  const source = normalizeSourceEvidence(state.sourceEvidence, context, generatedAt);
  if (
    !isDeepStrictEqual(state.boundary, BOUNDARY) ||
    !isDeepStrictEqual(state.contentDefinition, contentDefinition) ||
    !isDeepStrictEqual(state.disclaimerDefinition, disclaimerDefinition) ||
    !isDeepStrictEqual(state.sourceEvidence, source) ||
    !Number.isInteger(state.revision) ||
    state.revision < 1 ||
    typeof state.userEdited !== "boolean" ||
    state.effect !== null
  ) fail("guidance state evidence is invalid", "INVALID_AI_GUIDANCE_STATE");

  if (state.status === STATUSES.DISCARDED) {
    if (
      state.retention !== "VOLATILE_CONTENT_PURGED" ||
      state.originalContent !== null ||
      state.content !== null ||
      state.draftEvidence !== null ||
      state.userEdited !== (state.revision > 1)
    ) fail("discarded guidance state is invalid", "INVALID_AI_GUIDANCE_STATE");
    sha256(state.currentContentFingerprint, "state.currentContentFingerprint", "INVALID_AI_GUIDANCE_STATE");
    assertExactKeys(
      state.discardEvidence,
      [
        "schemaVersion", "revision", "currentContentFingerprint", "sourceEvidenceFingerprint",
        "contentDefinitionFingerprint", "disclaimerDefinitionFingerprint", "discardFingerprint",
      ],
      [],
      "state.discardEvidence",
      "INVALID_AI_GUIDANCE_STATE",
    );
    const discardCore = immutable({
      schemaVersion: "AI_GUIDANCE_DISCARD_EVIDENCE_V2",
      revision: state.revision,
      currentContentFingerprint: state.currentContentFingerprint,
      sourceEvidenceFingerprint: fingerprint(source),
      contentDefinitionFingerprint: contentDefinition.definitionFingerprint,
      disclaimerDefinitionFingerprint: disclaimerDefinition.definitionFingerprint,
    });
    const expectedDiscard = immutable({ ...discardCore, discardFingerprint: fingerprint(discardCore) });
    if (!isDeepStrictEqual(state.discardEvidence, expectedDiscard)) {
      fail("guidance discard evidence is invalid", "INVALID_AI_GUIDANCE_STATE");
    }
  } else {
    if (
      state.retention !== "VOLATILE_APPLICATION_STATE_ONLY" ||
      state.originalContent === null ||
      state.content === null ||
      state.discardEvidence !== null ||
      state.userEdited !== (state.status === STATUSES.EDITING) ||
      (state.status === STATUSES.REVIEWING && state.revision !== 1) ||
      (state.status === STATUSES.EDITING && state.revision < 2)
    ) fail("active guidance state is invalid", "INVALID_AI_GUIDANCE_STATE");
    const originalContent = safeJson(state.originalContent, "state.originalContent");
    const content = safeJson(state.content, "state.content");
    const expectedResponse = immutable({ schemaVersion: 1, content: originalContent });
    const expectedSource = sourceEvidence({ context, generatedAt, response: expectedResponse, content: originalContent });
    if (
      !isDeepStrictEqual(state.originalContent, originalContent) ||
      !isDeepStrictEqual(state.content, content) ||
      !isDeepStrictEqual(source, expectedSource) ||
      state.currentContentFingerprint !== fingerprint(content)
    ) {
      fail("guidance content evidence is invalid", "INVALID_AI_GUIDANCE_STATE");
    }
    if (state.status === STATUSES.REVIEWING && source.originalContentFingerprint !== state.currentContentFingerprint) {
      fail("original guidance content is invalid", "INVALID_AI_GUIDANCE_STATE");
    }
    const expectedDraftEvidence = activeDraftEvidence({ ...state, contentDefinition, disclaimerDefinition, sourceEvidence: source });
    if (!isDeepStrictEqual(state.draftEvidence, expectedDraftEvidence)) {
      fail("guidance draft evidence is invalid", "INVALID_AI_GUIDANCE_STATE");
    }
  }
  return state;
}

function createAiGuidanceReferenceDraft({
  responseText,
  context,
  generatedAt,
  contentDefinition,
  disclaimerDefinition,
} = {}) {
  const normalizedContext = normalizeContext(context);
  const normalizedGeneratedAt = instant(generatedAt, "generatedAt");
  const normalizedContentDefinition = normalizeDefinition(
    contentDefinition,
    "AI_GUIDANCE_CONTENT_DEFINITION_V1",
    "contentDefinition",
  );
  const normalizedDisclaimerDefinition = normalizeDefinition(
    disclaimerDefinition,
    "AI_GUIDANCE_DISCLAIMER_DEFINITION_V1",
    "disclaimerDefinition",
  );
  const response = parseGuidanceResponse(responseText);
  const content = response.content;
  const currentContentFingerprint = fingerprint(content);
  const source = sourceEvidence({
    context: normalizedContext,
    generatedAt: normalizedGeneratedAt,
    response,
    content,
  });
  const base = {
    schemaVersion: "AI_GUIDANCE_REFERENCE_STATE_V2",
    status: STATUSES.REVIEWING,
    retention: "VOLATILE_APPLICATION_STATE_ONLY",
    boundary: BOUNDARY,
    context: normalizedContext,
    generatedAt: normalizedGeneratedAt,
    contentDefinition: normalizedContentDefinition,
    disclaimerDefinition: normalizedDisclaimerDefinition,
    originalContent: content,
    content,
    sourceEvidence: source,
    revision: 1,
    userEdited: false,
    currentContentFingerprint,
    draftEvidence: null,
    discardEvidence: null,
    effect: null,
  };
  return immutable({ ...base, draftEvidence: activeDraftEvidence(base) });
}

function editAiGuidanceReferenceDraft(state, { expectedRevision, content } = {}) {
  assertState(state);
  if (![STATUSES.REVIEWING, STATUSES.EDITING].includes(state.status)) {
    fail("discarded guidance cannot be edited", "INVALID_AI_GUIDANCE_TRANSITION");
  }
  if (!Number.isInteger(expectedRevision) || expectedRevision !== state.revision) {
    fail("guidance edit is stale", "STALE_AI_GUIDANCE_EDIT");
  }
  const normalizedContent = safeJson(content, "content");
  if (normalizedContent === null) fail("guidance content is required", "INVALID_AI_GUIDANCE_VALUE", { field: "content" });
  const base = {
    ...state,
    status: STATUSES.EDITING,
    content: normalizedContent,
    revision: state.revision + 1,
    userEdited: true,
    currentContentFingerprint: fingerprint(normalizedContent),
    draftEvidence: null,
  };
  return immutable({ ...base, draftEvidence: activeDraftEvidence(base) });
}

function discardAiGuidanceReferenceDraft(state) {
  assertState(state);
  if (state.status === STATUSES.DISCARDED) return state;
  const discardCore = immutable({
    schemaVersion: "AI_GUIDANCE_DISCARD_EVIDENCE_V2",
    revision: state.revision,
    currentContentFingerprint: state.currentContentFingerprint,
    sourceEvidenceFingerprint: fingerprint(state.sourceEvidence),
    contentDefinitionFingerprint: state.contentDefinition.definitionFingerprint,
    disclaimerDefinitionFingerprint: state.disclaimerDefinition.definitionFingerprint,
  });
  return immutable({
    ...state,
    status: STATUSES.DISCARDED,
    retention: "VOLATILE_CONTENT_PURGED",
    originalContent: null,
    content: null,
    draftEvidence: null,
    discardEvidence: { ...discardCore, discardFingerprint: fingerprint(discardCore) },
  });
}

function fingerprintAiGuidanceDefinition({ schemaVersion, definitionId, definitionVersion, payload } = {}) {
  const expectedVersion = schemaVersion;
  if (!["AI_GUIDANCE_CONTENT_DEFINITION_V1", "AI_GUIDANCE_DISCLAIMER_DEFINITION_V1"].includes(expectedVersion)) {
    fail("definition version is unsupported", "INVALID_AI_GUIDANCE_DEFINITION");
  }
  const normalizedPayload = nonEmptyDefinitionPayload(payload, "payload");
  const core = immutable({
    schemaVersion: expectedVersion,
    definitionId: identifier(definitionId, "definitionId", "INVALID_AI_GUIDANCE_DEFINITION"),
    definitionVersion: identifier(definitionVersion, "definitionVersion", "INVALID_AI_GUIDANCE_DEFINITION"),
    payload: normalizedPayload,
  });
  return fingerprint(core);
}

export {
  BOUNDARY,
  STATUSES,
  createAiGuidanceReferenceDraft,
  discardAiGuidanceReferenceDraft,
  editAiGuidanceReferenceDraft,
  fingerprintAiGuidanceDefinition,
};
