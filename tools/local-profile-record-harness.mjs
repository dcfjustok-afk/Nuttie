import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/;
const SHA256 = /^[a-f0-9]{64}$/;
const COMMAND_TYPES = Object.freeze({ CREATE: "CREATE", UPDATE: "UPDATE", DELETE: "DELETE" });
const MAX_PROFILES = 1024;
const MAX_RELATED_DOMAINS = 128;
const MAX_RELATED_REFERENCES = 8192;
const MAX_DOCUMENT_BYTES = 131072;
const MAX_JSON_NODES = 4096;
const MAX_JSON_DEPTH = 24;
const MAX_OBJECT_KEYS = 512;
const MAX_ARRAY_ITEMS = 2048;
const MAX_STRING_LENGTH = 16384;

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${field} must be a plain record`, code, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail(`${field} must be a plain record`, code, { field });
  return value;
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) {
      fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
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

function identifier(value, field, code = "INVALID_LOCAL_PROFILE_VALUE") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function instant(value, field) {
  const match = typeof value === "string" ? INSTANT.exec(value) : null;
  if (!match || !Number.isFinite(Date.parse(value))) fail(`${field} must be an ISO instant with explicit offset`, "INVALID_LOCAL_PROFILE_INSTANT", { field });
  const [, year, month, day, hour, minute, second, , zone, , offsetHour, offsetMinute] = match;
  const candidate = new Date(0);
  candidate.setUTCHours(0, 0, 0, 0);
  candidate.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  if (
    Number(year) < 1 ||
    Number(month) < 1 || Number(month) > 12 ||
    Number(day) < 1 || Number(day) > 31 ||
    candidate.getUTCFullYear() !== Number(year) ||
    candidate.getUTCMonth() !== Number(month) - 1 ||
    candidate.getUTCDate() !== Number(day) ||
    Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 ||
    (zone !== "Z" && (Number(offsetHour) > 23 || Number(offsetMinute) > 59))
  ) fail(`${field} is not a real instant`, "INVALID_LOCAL_PROFILE_INSTANT", { field });
  return value;
}

function validateBoundedJson(value, field, depth = 0, budget = { nodes: 0 }, ancestors = new Set()) {
  budget.nodes += 1;
  if (budget.nodes > MAX_JSON_NODES || depth > MAX_JSON_DEPTH) fail(`${field} exceeds the JSON resource budget`, "LOCAL_PROFILE_DOCUMENT_TOO_LARGE", { field });
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) fail(`${field} exceeds the string budget`, "LOCAL_PROFILE_DOCUMENT_TOO_LARGE", { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_LOCAL_PROFILE_DOCUMENT", { field });
    return;
  }
  if (!value || typeof value !== "object") fail(`${field} contains an unsupported JSON value`, "INVALID_LOCAL_PROFILE_DOCUMENT", { field });
  if (ancestors.has(value)) fail(`${field} contains a cycle`, "INVALID_LOCAL_PROFILE_DOCUMENT", { field });
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) fail(`${field} exceeds the array budget`, "LOCAL_PROFILE_DOCUMENT_TOO_LARGE", { field });
    value.forEach((child, index) => validateBoundedJson(child, `${field}[${index}]`, depth + 1, budget, ancestors));
    ancestors.delete(value);
    return;
  }
  assertPlainRecord(value, field, "INVALID_LOCAL_PROFILE_DOCUMENT");
  const keys = Object.keys(value);
  if (keys.length > MAX_OBJECT_KEYS) fail(`${field} exceeds the object key budget`, "LOCAL_PROFILE_DOCUMENT_TOO_LARGE", { field });
  for (const [key, child] of Object.entries(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_LOCAL_PROFILE_DOCUMENT", { field: `${field}.${key}` });
    validateBoundedJson(child, `${field}.${key}`, depth + 1, budget, ancestors);
  }
  ancestors.delete(value);
}

function normalizeSchemaDefinition(input, field = "schemaDefinition") {
  assertExactKeys(input, ["schemaVersion", "definitionId", "definitionVersion", "payload"], [], field, "INVALID_LOCAL_PROFILE_SCHEMA");
  if (input.schemaVersion !== "LOCAL_PROFILE_SCHEMA_DEFINITION_V1") fail(`${field}.schemaVersion is unsupported`, "INVALID_LOCAL_PROFILE_SCHEMA", { field: `${field}.schemaVersion` });
  assertPlainRecord(input.payload, `${field}.payload`, "INVALID_LOCAL_PROFILE_SCHEMA");
  validateBoundedJson(input.payload, `${field}.payload`);
  if (Buffer.byteLength(canonicalStringify(input.payload), "utf8") > MAX_DOCUMENT_BYTES) fail(`${field}.payload exceeds the byte budget`, "LOCAL_PROFILE_DOCUMENT_TOO_LARGE", { field: `${field}.payload` });
  return immutable({
    schemaVersion: "LOCAL_PROFILE_SCHEMA_DEFINITION_V1",
    definitionId: identifier(input.definitionId, `${field}.definitionId`, "INVALID_LOCAL_PROFILE_SCHEMA"),
    definitionVersion: identifier(input.definitionVersion, `${field}.definitionVersion`, "INVALID_LOCAL_PROFILE_SCHEMA"),
    payload: input.payload,
  });
}

function normalizeDocument(input, field = "document") {
  assertExactKeys(input, ["schemaVersion", "schemaDefinition", "values"], [], field, "INVALID_LOCAL_PROFILE_DOCUMENT");
  if (input.schemaVersion !== "LOCAL_PROFILE_DOCUMENT_V1") fail(`${field}.schemaVersion is unsupported`, "INVALID_LOCAL_PROFILE_DOCUMENT", { field: `${field}.schemaVersion` });
  assertPlainRecord(input.values, `${field}.values`, "INVALID_LOCAL_PROFILE_DOCUMENT");
  validateBoundedJson(input.values, `${field}.values`);
  if (Buffer.byteLength(canonicalStringify(input.values), "utf8") > MAX_DOCUMENT_BYTES) fail(`${field}.values exceeds the byte budget`, "LOCAL_PROFILE_DOCUMENT_TOO_LARGE", { field: `${field}.values` });
  return immutable({
    schemaVersion: "LOCAL_PROFILE_DOCUMENT_V1",
    schemaDefinition: normalizeSchemaDefinition(input.schemaDefinition, `${field}.schemaDefinition`),
    values: input.values,
  });
}

function normalizeLocalProfileRecord(input, field = "profile") {
  assertExactKeys(input, ["schemaVersion", "profileId", "revision", "createdAt", "updatedAt", "document"], [], field, "INVALID_LOCAL_PROFILE_RECORD");
  if (input.schemaVersion !== "LOCAL_PROFILE_RECORD_V1") fail(`${field}.schemaVersion is unsupported`, "INVALID_LOCAL_PROFILE_RECORD", { field: `${field}.schemaVersion` });
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) fail(`${field}.revision is invalid`, "INVALID_LOCAL_PROFILE_RECORD", { field: `${field}.revision` });
  const createdAt = instant(input.createdAt, `${field}.createdAt`);
  const updatedAt = instant(input.updatedAt, `${field}.updatedAt`);
  if (Date.parse(updatedAt) < Date.parse(createdAt)) fail(`${field}.updatedAt precedes createdAt`, "INVALID_LOCAL_PROFILE_RECORD", { field });
  return immutable({
    schemaVersion: "LOCAL_PROFILE_RECORD_V1",
    profileId: identifier(input.profileId, `${field}.profileId`, "INVALID_LOCAL_PROFILE_RECORD"),
    revision: input.revision,
    createdAt,
    updatedAt,
    document: normalizeDocument(input.document, `${field}.document`),
  });
}

function normalizeProfiles(input, field = "profiles") {
  if (!Array.isArray(input) || input.length > MAX_PROFILES) fail(`${field} must be a bounded array`, "INVALID_LOCAL_PROFILE_SET", { field });
  const profiles = input.map((profile, index) => normalizeLocalProfileRecord(profile, `${field}[${index}]`));
  const ids = new Set();
  const definitions = new Map();
  for (const profile of profiles) {
    if (ids.has(profile.profileId)) fail("profile IDs must be unique", "DUPLICATE_LOCAL_PROFILE", { profileId: profile.profileId });
    ids.add(profile.profileId);
    const definition = profile.document.schemaDefinition;
    const identity = `${definition.definitionId}\u0000${definition.definitionVersion}`;
    const evidence = fingerprint(definition);
    if (definitions.has(identity) && definitions.get(identity) !== evidence) fail("one profile schema identity cannot have conflicting definitions", "LOCAL_PROFILE_SCHEMA_CONFLICT", { definitionId: definition.definitionId, definitionVersion: definition.definitionVersion });
    definitions.set(identity, evidence);
  }
  return profiles.sort((left, right) => left.profileId < right.profileId ? -1 : left.profileId > right.profileId ? 1 : 0);
}

function normalizeRelatedEvidence(input, field = "relatedEvidence") {
  assertExactKeys(input, ["schemaVersion", "domains"], [], field, "INVALID_RELATED_DATA_EVIDENCE");
  if (input.schemaVersion !== "RELATED_LOCAL_DATA_EVIDENCE_V1" || !Array.isArray(input.domains) || input.domains.length > MAX_RELATED_DOMAINS) fail(`${field} is unsupported or too large`, "INVALID_RELATED_DATA_EVIDENCE", { field });
  let referenceCount = 0;
  const domains = input.domains.map((domain, domainIndex) => {
    const domainField = `${field}.domains[${domainIndex}]`;
    assertExactKeys(domain, ["domainId", "references"], [], domainField, "INVALID_RELATED_DATA_EVIDENCE");
    if (!Array.isArray(domain.references)) fail(`${domainField}.references must be an array`, "INVALID_RELATED_DATA_EVIDENCE", { field: `${domainField}.references` });
    referenceCount += domain.references.length;
    if (referenceCount > MAX_RELATED_REFERENCES) fail(`${field} exceeds the reference budget`, "INVALID_RELATED_DATA_EVIDENCE", { field });
    const references = domain.references.map((reference, referenceIndex) => {
      const referenceField = `${domainField}.references[${referenceIndex}]`;
      assertExactKeys(reference, ["recordId", "revision"], [], referenceField, "INVALID_RELATED_DATA_EVIDENCE");
      if (!Number.isSafeInteger(reference.revision) || reference.revision < 1) fail(`${referenceField}.revision is invalid`, "INVALID_RELATED_DATA_EVIDENCE", { field: `${referenceField}.revision` });
      return immutable({ recordId: identifier(reference.recordId, `${referenceField}.recordId`, "INVALID_RELATED_DATA_EVIDENCE"), revision: reference.revision });
    }).sort((left, right) => left.recordId < right.recordId ? -1 : left.recordId > right.recordId ? 1 : left.revision - right.revision);
    const keys = new Set();
    for (const reference of references) {
      const key = `${reference.recordId}\u0000${reference.revision}`;
      if (keys.has(key)) fail("related references must be unique within a domain", "DUPLICATE_RELATED_DATA_REFERENCE", { domainId: domain.domainId, recordId: reference.recordId, revision: reference.revision });
      keys.add(key);
    }
    return immutable({ domainId: identifier(domain.domainId, `${domainField}.domainId`, "INVALID_RELATED_DATA_EVIDENCE"), references });
  }).sort((left, right) => left.domainId < right.domainId ? -1 : left.domainId > right.domainId ? 1 : 0);
  const domainIds = new Set();
  for (const domain of domains) {
    if (domainIds.has(domain.domainId)) fail("related domain IDs must be unique", "DUPLICATE_RELATED_DATA_DOMAIN", { domainId: domain.domainId });
    domainIds.add(domain.domainId);
  }
  return immutable({ schemaVersion: "RELATED_LOCAL_DATA_EVIDENCE_V1", domains });
}

function emptyRelatedEvidence() {
  return immutable({ schemaVersion: "RELATED_LOCAL_DATA_EVIDENCE_V1", domains: [] });
}

function buildState({ repositoryGeneration, profiles, relatedEvidence }) {
  if (!Number.isSafeInteger(repositoryGeneration) || repositoryGeneration < 0) fail("repositoryGeneration is invalid", "INVALID_LOCAL_PROFILE_STATE", { field: "repositoryGeneration" });
  const normalizedProfiles = normalizeProfiles(profiles);
  const normalizedRelated = normalizeRelatedEvidence(relatedEvidence);
  return immutable({
    schemaVersion: "LOCAL_PROFILE_STATE_V1",
    repositoryGeneration,
    profiles: normalizedProfiles,
    profilesFingerprint: fingerprint(normalizedProfiles),
    relatedEvidence: normalizedRelated,
    relatedEvidenceFingerprint: fingerprint(normalizedRelated),
  });
}

function normalizeState(input, field = "state") {
  assertExactKeys(input, ["schemaVersion", "repositoryGeneration", "profiles", "profilesFingerprint", "relatedEvidence", "relatedEvidenceFingerprint"], [], field, "INVALID_LOCAL_PROFILE_STATE");
  if (input.schemaVersion !== "LOCAL_PROFILE_STATE_V1" || !SHA256.test(input.profilesFingerprint) || !SHA256.test(input.relatedEvidenceFingerprint)) fail(`${field} version or fingerprints are invalid`, "INVALID_LOCAL_PROFILE_STATE", { field });
  const expected = buildState({ repositoryGeneration: input.repositoryGeneration, profiles: input.profiles, relatedEvidence: input.relatedEvidence });
  if (!isDeepStrictEqual(input, expected)) fail(`${field} contains invalid derived state evidence`, "INVALID_LOCAL_PROFILE_STATE", { field });
  return expected;
}

function normalizeCommand(input, field = "command") {
  assertPlainRecord(input, field, "INVALID_LOCAL_PROFILE_COMMAND");
  if (input.schemaVersion !== "LOCAL_PROFILE_COMMAND_V1" || !Object.values(COMMAND_TYPES).includes(input.type)) fail(`${field} version or type is unsupported`, "INVALID_LOCAL_PROFILE_COMMAND", { field });
  const commandId = identifier(input.commandId, `${field}.commandId`, "INVALID_LOCAL_PROFILE_COMMAND");
  if (input.type === COMMAND_TYPES.CREATE) {
    assertExactKeys(input, ["schemaVersion", "commandId", "type", "profileId", "createdAt", "document"], [], field, "INVALID_LOCAL_PROFILE_COMMAND");
    return immutable({ schemaVersion: "LOCAL_PROFILE_COMMAND_V1", commandId, type: input.type, profileId: identifier(input.profileId, `${field}.profileId`, "INVALID_LOCAL_PROFILE_COMMAND"), createdAt: instant(input.createdAt, `${field}.createdAt`), document: normalizeDocument(input.document, `${field}.document`) });
  }
  if (input.type === COMMAND_TYPES.UPDATE) {
    assertExactKeys(input, ["schemaVersion", "commandId", "type", "profileId", "expectedRevision", "updatedAt", "document"], [], field, "INVALID_LOCAL_PROFILE_COMMAND");
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) fail(`${field}.expectedRevision is invalid`, "INVALID_LOCAL_PROFILE_COMMAND", { field: `${field}.expectedRevision` });
    return immutable({ schemaVersion: "LOCAL_PROFILE_COMMAND_V1", commandId, type: input.type, profileId: identifier(input.profileId, `${field}.profileId`, "INVALID_LOCAL_PROFILE_COMMAND"), expectedRevision: input.expectedRevision, updatedAt: instant(input.updatedAt, `${field}.updatedAt`), document: normalizeDocument(input.document, `${field}.document`) });
  }
  assertExactKeys(input, ["schemaVersion", "commandId", "type", "profileId", "expectedRevision", "deletedAt"], [], field, "INVALID_LOCAL_PROFILE_COMMAND");
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) fail(`${field}.expectedRevision is invalid`, "INVALID_LOCAL_PROFILE_COMMAND", { field: `${field}.expectedRevision` });
  return immutable({ schemaVersion: "LOCAL_PROFILE_COMMAND_V1", commandId, type: input.type, profileId: identifier(input.profileId, `${field}.profileId`, "INVALID_LOCAL_PROFILE_COMMAND"), expectedRevision: input.expectedRevision, deletedAt: instant(input.deletedAt, `${field}.deletedAt`) });
}

function findProfile(state, profileId) {
  return state.profiles.find((profile) => profile.profileId === profileId) ?? null;
}

function applyCommand(stateInput, commandInput) {
  const state = normalizeState(stateInput);
  const command = normalizeCommand(commandInput);
  const existing = findProfile(state, command.profileId);
  let nextProfiles;
  if (command.type === COMMAND_TYPES.CREATE) {
    if (existing !== null) fail("profile already exists", "LOCAL_PROFILE_ALREADY_EXISTS", { profileId: command.profileId });
    const created = normalizeLocalProfileRecord({ schemaVersion: "LOCAL_PROFILE_RECORD_V1", profileId: command.profileId, revision: 1, createdAt: command.createdAt, updatedAt: command.createdAt, document: command.document });
    nextProfiles = [...state.profiles, created];
  } else if (command.type === COMMAND_TYPES.UPDATE) {
    if (existing === null) fail("profile does not exist", "LOCAL_PROFILE_NOT_FOUND", { profileId: command.profileId });
    if (existing.revision !== command.expectedRevision) fail("profile revision is stale", "STALE_LOCAL_PROFILE_REVISION", { profileId: command.profileId, expectedRevision: command.expectedRevision, actualRevision: existing.revision });
    if (Date.parse(command.updatedAt) < Date.parse(existing.updatedAt)) fail("profile update instant moves backwards", "STALE_LOCAL_PROFILE_INSTANT", { profileId: command.profileId });
    const previousDefinition = existing.document.schemaDefinition;
    const nextDefinition = command.document.schemaDefinition;
    if (
      previousDefinition.definitionId === nextDefinition.definitionId &&
      previousDefinition.definitionVersion === nextDefinition.definitionVersion &&
      !isDeepStrictEqual(previousDefinition, nextDefinition)
    ) fail("one profile schema identity cannot change its definition payload", "LOCAL_PROFILE_SCHEMA_CONFLICT", { definitionId: nextDefinition.definitionId, definitionVersion: nextDefinition.definitionVersion });
    const updated = normalizeLocalProfileRecord({ ...existing, revision: existing.revision + 1, updatedAt: command.updatedAt, document: command.document });
    nextProfiles = state.profiles.map((profile) => profile.profileId === command.profileId ? updated : profile);
  } else {
    if (existing === null) fail("profile does not exist", "LOCAL_PROFILE_NOT_FOUND", { profileId: command.profileId });
    if (existing.revision !== command.expectedRevision) fail("profile revision is stale", "STALE_LOCAL_PROFILE_REVISION", { profileId: command.profileId, expectedRevision: command.expectedRevision, actualRevision: existing.revision });
    if (Date.parse(command.deletedAt) < Date.parse(existing.updatedAt)) fail("profile deletion instant precedes its latest update", "STALE_LOCAL_PROFILE_INSTANT", { profileId: command.profileId });
    nextProfiles = state.profiles.filter((profile) => profile.profileId !== command.profileId);
  }
  return buildState({ repositoryGeneration: state.repositoryGeneration + 1, profiles: nextProfiles, relatedEvidence: state.relatedEvidence });
}

function buildReceipt(commandInput, beforeInput, afterInput) {
  const command = normalizeCommand(commandInput);
  const before = normalizeState(beforeInput, "before");
  const after = normalizeState(afterInput, "after");
  const expectedAfter = applyCommand(before, command);
  if (!isDeepStrictEqual(after, expectedAfter)) fail("after state does not match the command", "INVALID_LOCAL_PROFILE_TRANSACTION", { field: "after" });
  return immutable({
    schemaVersion: "LOCAL_PROFILE_TRANSACTION_RECEIPT_V1",
    command,
    commandFingerprint: fingerprint(command),
    before,
    after,
    affectedProfile: {
      before: findProfile(before, command.profileId),
      after: findProfile(after, command.profileId),
    },
    boundary: {
      profileRecordMutation: command.type,
      relatedDataMutation: "NOT_AUTHORIZED",
      relatedEvidenceFingerprintBefore: before.relatedEvidenceFingerprint,
      relatedEvidenceFingerprintAfter: after.relatedEvidenceFingerprint,
      relatedEvidenceUnchanged: before.relatedEvidenceFingerprint === after.relatedEvidenceFingerprint,
    },
  });
}

function validateLocalProfileTransactionReceipt(input, field = "receipt") {
  assertExactKeys(input, ["schemaVersion", "command", "commandFingerprint", "before", "after", "affectedProfile", "boundary"], [], field, "INVALID_LOCAL_PROFILE_TRANSACTION");
  if (input.schemaVersion !== "LOCAL_PROFILE_TRANSACTION_RECEIPT_V1" || !SHA256.test(input.commandFingerprint)) fail(`${field} version or command fingerprint is invalid`, "INVALID_LOCAL_PROFILE_TRANSACTION", { field });
  let expected;
  try {
    expected = buildReceipt(input.command, input.before, input.after);
  } catch (error) {
    fail(`${field} cannot be rebuilt from valid transaction evidence`, "INVALID_LOCAL_PROFILE_TRANSACTION", { field, causeCode: error?.code ?? "UNKNOWN" });
  }
  if (!isDeepStrictEqual(input, expected)) fail(`${field} contains invalid derived transaction evidence`, "INVALID_LOCAL_PROFILE_TRANSACTION", { field });
  return expected;
}

function createInMemoryLocalProfileRepository({ profiles = [], relatedEvidence = emptyRelatedEvidence(), repositoryGeneration = 0 } = {}) {
  let state = buildState({ repositoryGeneration, profiles, relatedEvidence });
  const operations = new Map();
  let tail = Promise.resolve();

  async function execute(commandInput, { fault = "NONE" } = {}) {
    if (!["NONE", "PRE_COMMIT", "POST_COMMIT_UNKNOWN"].includes(fault)) fail("fault plan is unsupported", "INVALID_LOCAL_PROFILE_FAULT_PLAN");
    const command = normalizeCommand(commandInput);
    const commandFingerprint = fingerprint(command);
    const run = async () => {
      const prior = operations.get(command.commandId);
      if (prior) {
        if (prior.commandFingerprint !== commandFingerprint) fail("command ID is bound to another payload", "LOCAL_PROFILE_IDEMPOTENCY_CONFLICT", { commandId: command.commandId });
        return immutable({ status: "REPLAYED", receipt: prior.receipt });
      }
      if (fault === "PRE_COMMIT") fail("profile transaction failed before commit", "LOCAL_PROFILE_PRE_COMMIT_FAILURE", { retryable: true });
      const before = state;
      const after = applyCommand(before, command);
      const receipt = buildReceipt(command, before, after);
      state = after;
      operations.set(command.commandId, { commandFingerprint, receipt });
      if (fault === "POST_COMMIT_UNKNOWN") fail("profile transaction result is unknown after commit", "LOCAL_PROFILE_POST_COMMIT_UNKNOWN", { retryableWithSameCommand: true, commandId: command.commandId });
      return immutable({ status: "COMMITTED", receipt });
    };
    const pending = tail.then(run, run);
    tail = pending.then(() => undefined, () => undefined);
    return pending;
  }

  return Object.freeze({
    execute,
    async snapshot() {
      await tail;
      return state;
    },
  });
}

export {
  COMMAND_TYPES,
  applyCommand,
  buildReceipt,
  createInMemoryLocalProfileRepository,
  emptyRelatedEvidence,
  normalizeDocument,
  normalizeLocalProfileRecord,
  normalizeState,
  validateLocalProfileTransactionReceipt,
};
