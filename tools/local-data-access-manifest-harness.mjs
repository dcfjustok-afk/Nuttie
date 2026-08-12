import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_DOMAINS = 256;
const MAX_RECORDS = 65536;
const MAX_PAGE_SIZE = 256;
const MAX_DOCUMENT_BYTES = 131072;
const MAX_JSON_NODES = 4096;
const MAX_JSON_DEPTH = 24;
const MAX_OBJECT_KEYS = 512;
const MAX_ARRAY_ITEMS = 2048;
const MAX_STRING_LENGTH = 16384;

const CONTROL_BOUNDARY = Object.freeze({
  businessData: "IN_APP_READ_ONLY_PAGED",
  keychainSecretValues: "EXCLUDED_NEVER_RETURNED",
  nativeContainerInventory: "REQUIRES_NATIVE_ADAPTER",
  externalFilesCopies: "OUT_OF_SCOPE_USER_CONTROLLED",
  artifactCreation: "NOT_AUTHORIZED",
  mutation: "NOT_AUTHORIZED",
});

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
    if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
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

function identifier(value, field, code = "INVALID_LOCAL_DATA_ACCESS_VALUE") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function unsignedInteger(value, field, { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) fail(`${field} is invalid`, "INVALID_LOCAL_DATA_ACCESS_VALUE", { field });
  return value;
}

function validateBoundedJson(value, field, depth = 0, budget = { nodes: 0 }, ancestors = new Set()) {
  budget.nodes += 1;
  if (budget.nodes > MAX_JSON_NODES || depth > MAX_JSON_DEPTH) fail(`${field} exceeds the JSON resource budget`, "LOCAL_DATA_ACCESS_DOCUMENT_TOO_LARGE", { field });
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) fail(`${field} exceeds the string budget`, "LOCAL_DATA_ACCESS_DOCUMENT_TOO_LARGE", { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_LOCAL_DATA_ACCESS_DOCUMENT", { field });
    return;
  }
  if (!value || typeof value !== "object") fail(`${field} contains an unsupported JSON value`, "INVALID_LOCAL_DATA_ACCESS_DOCUMENT", { field });
  if (ancestors.has(value)) fail(`${field} contains a cycle`, "INVALID_LOCAL_DATA_ACCESS_DOCUMENT", { field });
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) fail(`${field} exceeds the array budget`, "LOCAL_DATA_ACCESS_DOCUMENT_TOO_LARGE", { field });
    value.forEach((child, index) => validateBoundedJson(child, `${field}[${index}]`, depth + 1, budget, ancestors));
    ancestors.delete(value);
    return;
  }
  assertPlainRecord(value, field, "INVALID_LOCAL_DATA_ACCESS_DOCUMENT");
  const keys = Object.keys(value);
  if (keys.length > MAX_OBJECT_KEYS) fail(`${field} exceeds the object key budget`, "LOCAL_DATA_ACCESS_DOCUMENT_TOO_LARGE", { field });
  for (const [key, child] of Object.entries(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_LOCAL_DATA_ACCESS_DOCUMENT", { field: `${field}.${key}` });
    validateBoundedJson(child, `${field}.${key}`, depth + 1, budget, ancestors);
  }
  ancestors.delete(value);
}

function boundedDocument(value, field) {
  assertPlainRecord(value, field, "INVALID_LOCAL_DATA_ACCESS_DOCUMENT");
  validateBoundedJson(value, field);
  if (Buffer.byteLength(canonicalStringify(value), "utf8") > MAX_DOCUMENT_BYTES) fail(`${field} exceeds the byte budget`, "LOCAL_DATA_ACCESS_DOCUMENT_TOO_LARGE", { field });
  return immutable(value);
}

function normalizeDomainDefinition(input, field = "domainDefinition") {
  assertExactKeys(input, ["schemaVersion", "domainId", "definitionVersion", "position", "dataClass", "payloadDefinition"], [], field, "INVALID_LOCAL_DATA_DOMAIN_DEFINITION");
  if (input.schemaVersion !== "LOCAL_DATA_DOMAIN_DEFINITION_V1" || input.dataClass !== "USER_BUSINESS_DATA") fail(`${field} version or data class is unsupported`, "INVALID_LOCAL_DATA_DOMAIN_DEFINITION", { field });
  return immutable({
    schemaVersion: "LOCAL_DATA_DOMAIN_DEFINITION_V1",
    domainId: identifier(input.domainId, `${field}.domainId`, "INVALID_LOCAL_DATA_DOMAIN_DEFINITION"),
    definitionVersion: identifier(input.definitionVersion, `${field}.definitionVersion`, "INVALID_LOCAL_DATA_DOMAIN_DEFINITION"),
    position: unsignedInteger(input.position, `${field}.position`, { maximum: MAX_DOMAINS - 1 }),
    dataClass: "USER_BUSINESS_DATA",
    payloadDefinition: boundedDocument(input.payloadDefinition, `${field}.payloadDefinition`),
  });
}

function domainDefinitionFingerprint(input) {
  return fingerprint(normalizeDomainDefinition(input));
}

function normalizeDomainDefinitions(input, field = "domainDefinitions") {
  if (!Array.isArray(input) || input.length > MAX_DOMAINS) fail(`${field} must be a bounded array`, "INVALID_LOCAL_DATA_DOMAIN_SET", { field });
  const definitions = input.map((definition, index) => normalizeDomainDefinition(definition, `${field}[${index}]`));
  const domainIds = new Set();
  const positions = new Set();
  for (const definition of definitions) {
    if (domainIds.has(definition.domainId)) fail("domain IDs must be unique", "DUPLICATE_LOCAL_DATA_DOMAIN", { domainId: definition.domainId });
    if (positions.has(definition.position)) fail("domain positions must be unique", "DUPLICATE_LOCAL_DATA_DOMAIN_POSITION", { position: definition.position });
    domainIds.add(definition.domainId);
    positions.add(definition.position);
  }
  return definitions.sort((left, right) => left.position - right.position);
}

function normalizeRecord(input, definitions, field = "record") {
  assertExactKeys(input, ["schemaVersion", "domainRef", "recordId", "revision", "payload"], [], field, "INVALID_LOCAL_DATA_ACCESS_RECORD");
  if (input.schemaVersion !== "LOCAL_DATA_ACCESS_RECORD_V1") fail(`${field}.schemaVersion is unsupported`, "INVALID_LOCAL_DATA_ACCESS_RECORD", { field: `${field}.schemaVersion` });
  assertExactKeys(input.domainRef, ["domainId", "definitionVersion", "definitionFingerprint"], [], `${field}.domainRef`, "INVALID_LOCAL_DATA_ACCESS_RECORD");
  const domainId = identifier(input.domainRef.domainId, `${field}.domainRef.domainId`, "INVALID_LOCAL_DATA_ACCESS_RECORD");
  const definition = definitions.find((candidate) => candidate.domainId === domainId);
  if (!definition) fail("record refers to an unknown domain", "UNKNOWN_LOCAL_DATA_DOMAIN", { domainId });
  const expectedFingerprint = fingerprint(definition);
  if (input.domainRef.definitionVersion !== definition.definitionVersion || input.domainRef.definitionFingerprint !== expectedFingerprint) fail("record domain definition binding is stale or invalid", "LOCAL_DATA_DOMAIN_BINDING_MISMATCH", { domainId });
  return immutable({
    schemaVersion: "LOCAL_DATA_ACCESS_RECORD_V1",
    domainRef: {
      domainId,
      definitionVersion: definition.definitionVersion,
      definitionFingerprint: expectedFingerprint,
    },
    recordId: identifier(input.recordId, `${field}.recordId`, "INVALID_LOCAL_DATA_ACCESS_RECORD"),
    revision: unsignedInteger(input.revision, `${field}.revision`, { minimum: 1 }),
    payload: boundedDocument(input.payload, `${field}.payload`),
  });
}

function normalizeRecords(input, definitions, field = "records") {
  if (!Array.isArray(input) || input.length > MAX_RECORDS) fail(`${field} must be a bounded array`, "INVALID_LOCAL_DATA_ACCESS_RECORD_SET", { field });
  const position = new Map(definitions.map((definition) => [definition.domainId, definition.position]));
  const records = input.map((record, index) => normalizeRecord(record, definitions, `${field}[${index}]`));
  const identities = new Set();
  for (const record of records) {
    const identity = `${record.domainRef.domainId}\u0000${record.recordId}`;
    if (identities.has(identity)) fail("record IDs must be unique inside a domain", "DUPLICATE_LOCAL_DATA_ACCESS_RECORD", { domainId: record.domainRef.domainId, recordId: record.recordId });
    identities.add(identity);
  }
  return records.sort((left, right) => {
    const domainOrder = position.get(left.domainRef.domainId) - position.get(right.domainRef.domainId);
    if (domainOrder !== 0) return domainOrder;
    return left.recordId < right.recordId ? -1 : left.recordId > right.recordId ? 1 : 0;
  });
}

function buildDomainSummaries(definitions, records) {
  return definitions.map((definition) => {
    const domainRecords = records.filter((record) => record.domainRef.domainId === definition.domainId);
    return immutable({
      domainId: definition.domainId,
      definitionVersion: definition.definitionVersion,
      definitionFingerprint: fingerprint(definition),
      position: definition.position,
      recordCount: domainRecords.length,
      recordsFingerprint: fingerprint(domainRecords),
    });
  });
}

function normalizeRequest(input, field = "request") {
  assertExactKeys(input, ["schemaVersion", "requestId", "expectedRepositoryGeneration", "pageSize", "deliveryMode"], [], field, "INVALID_LOCAL_DATA_ACCESS_REQUEST");
  if (input.schemaVersion !== "LOCAL_DATA_ACCESS_REQUEST_V1" || input.deliveryMode !== "IN_APP_READ_ONLY") fail(`${field} version or delivery mode is unsupported`, "INVALID_LOCAL_DATA_ACCESS_REQUEST", { field });
  return immutable({
    schemaVersion: "LOCAL_DATA_ACCESS_REQUEST_V1",
    requestId: identifier(input.requestId, `${field}.requestId`, "INVALID_LOCAL_DATA_ACCESS_REQUEST"),
    expectedRepositoryGeneration: unsignedInteger(input.expectedRepositoryGeneration, `${field}.expectedRepositoryGeneration`),
    pageSize: unsignedInteger(input.pageSize, `${field}.pageSize`, { minimum: 1, maximum: MAX_PAGE_SIZE }),
    deliveryMode: "IN_APP_READ_ONLY",
  });
}

function buildDescriptor({ request, repositoryId, repositoryGeneration, definitions, records }) {
  const domainSummaries = buildDomainSummaries(definitions, records);
  const core = immutable({
    schemaVersion: "LOCAL_DATA_ACCESS_SNAPSHOT_V1",
    requestId: request.requestId,
    repositoryId,
    repositoryGeneration,
    deliveryMode: "IN_APP_READ_ONLY",
    pageSize: request.pageSize,
    recordCount: records.length,
    pageCount: Math.max(1, Math.ceil(records.length / request.pageSize)),
    domainDefinitions: definitions,
    definitionsFingerprint: fingerprint(definitions),
    domainSummaries,
    recordsFingerprint: fingerprint(records),
    controlBoundary: CONTROL_BOUNDARY,
  });
  return immutable({ ...core, snapshotId: fingerprint(core) });
}

function validateLocalDataAccessDescriptor(input, field = "descriptor") {
  assertExactKeys(input, ["schemaVersion", "requestId", "repositoryId", "repositoryGeneration", "deliveryMode", "pageSize", "recordCount", "pageCount", "domainDefinitions", "definitionsFingerprint", "domainSummaries", "recordsFingerprint", "controlBoundary", "snapshotId"], [], field, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT");
  const definitions = normalizeDomainDefinitions(input.domainDefinitions, `${field}.domainDefinitions`);
  if (input.schemaVersion !== "LOCAL_DATA_ACCESS_SNAPSHOT_V1" || input.deliveryMode !== "IN_APP_READ_ONLY" || !SHA256.test(input.definitionsFingerprint) || !SHA256.test(input.recordsFingerprint) || !SHA256.test(input.snapshotId)) fail(`${field} contains unsupported snapshot evidence`, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT", { field });
  identifier(input.requestId, `${field}.requestId`, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT");
  identifier(input.repositoryId, `${field}.repositoryId`, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT");
  unsignedInteger(input.repositoryGeneration, `${field}.repositoryGeneration`);
  unsignedInteger(input.pageSize, `${field}.pageSize`, { minimum: 1, maximum: MAX_PAGE_SIZE });
  unsignedInteger(input.recordCount, `${field}.recordCount`, { maximum: MAX_RECORDS });
  const expectedPageCount = Math.max(1, Math.ceil(input.recordCount / input.pageSize));
  if (input.pageCount !== expectedPageCount || input.definitionsFingerprint !== fingerprint(definitions) || !isDeepStrictEqual(input.controlBoundary, CONTROL_BOUNDARY)) fail(`${field} contains invalid derived evidence`, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT", { field });
  if (!Array.isArray(input.domainSummaries) || input.domainSummaries.length !== definitions.length) fail(`${field}.domainSummaries is invalid`, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT", { field: `${field}.domainSummaries` });
  let count = 0;
  const summaries = input.domainSummaries.map((summary, index) => {
    const summaryField = `${field}.domainSummaries[${index}]`;
    assertExactKeys(summary, ["domainId", "definitionVersion", "definitionFingerprint", "position", "recordCount", "recordsFingerprint"], [], summaryField, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT");
    const definition = definitions[index];
    if (summary.domainId !== definition.domainId || summary.definitionVersion !== definition.definitionVersion || summary.definitionFingerprint !== fingerprint(definition) || summary.position !== definition.position || !SHA256.test(summary.recordsFingerprint)) fail(`${summaryField} does not bind its domain definition`, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT", { field: summaryField });
    count += unsignedInteger(summary.recordCount, `${summaryField}.recordCount`, { maximum: MAX_RECORDS });
    return immutable(summary);
  });
  if (count !== input.recordCount) fail(`${field} domain counts do not equal recordCount`, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT", { field });
  const { snapshotId: ignoredSnapshotId, ...core } = input;
  const expected = immutable({ ...core, domainDefinitions: definitions, domainSummaries: summaries });
  if (input.snapshotId !== fingerprint(expected)) fail(`${field}.snapshotId is invalid`, "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT", { field: `${field}.snapshotId` });
  return immutable(input);
}

function buildCursor(descriptor, offset) {
  const core = immutable({
    schemaVersion: "LOCAL_DATA_ACCESS_CURSOR_V1",
    snapshotId: descriptor.snapshotId,
    descriptorFingerprint: fingerprint(descriptor),
    offset,
    pageSize: descriptor.pageSize,
  });
  return immutable({ ...core, cursorFingerprint: fingerprint(core) });
}

function validateCursor(input, descriptor, field = "cursor") {
  assertExactKeys(input, ["schemaVersion", "snapshotId", "descriptorFingerprint", "offset", "pageSize", "cursorFingerprint"], [], field, "INVALID_LOCAL_DATA_ACCESS_CURSOR");
  const core = immutable({
    schemaVersion: input.schemaVersion,
    snapshotId: input.snapshotId,
    descriptorFingerprint: input.descriptorFingerprint,
    offset: input.offset,
    pageSize: input.pageSize,
  });
  const offset = unsignedInteger(input.offset, `${field}.offset`, { maximum: descriptor.recordCount });
  if (input.schemaVersion !== "LOCAL_DATA_ACCESS_CURSOR_V1" || input.snapshotId !== descriptor.snapshotId || input.descriptorFingerprint !== fingerprint(descriptor) || input.pageSize !== descriptor.pageSize || offset === 0 || offset % descriptor.pageSize !== 0 || offset >= descriptor.recordCount || !SHA256.test(input.cursorFingerprint) || input.cursorFingerprint !== fingerprint(core)) fail(`${field} is invalid or belongs to another snapshot`, "INVALID_LOCAL_DATA_ACCESS_CURSOR", { field });
  return immutable(input);
}

function buildPage(descriptor, records, cursorUsed) {
  const startOffset = cursorUsed === null ? 0 : cursorUsed.offset;
  const endOffsetExclusive = Math.min(startOffset + descriptor.pageSize, records.length);
  const pageRecords = records.slice(startOffset, endOffsetExclusive);
  const nextCursor = endOffsetExclusive < records.length ? buildCursor(descriptor, endOffsetExclusive) : null;
  const core = immutable({
    schemaVersion: "LOCAL_DATA_ACCESS_PAGE_V1",
    snapshotId: descriptor.snapshotId,
    descriptorFingerprint: fingerprint(descriptor),
    pageIndex: Math.floor(startOffset / descriptor.pageSize),
    startOffset,
    endOffsetExclusive,
    cursorUsed,
    records: pageRecords,
    recordsFingerprint: fingerprint(pageRecords),
    nextCursor,
  });
  return immutable({ ...core, pageFingerprint: fingerprint(core) });
}

function validateLocalDataAccessPage(input, descriptorInput, field = "page") {
  const descriptor = validateLocalDataAccessDescriptor(descriptorInput);
  assertExactKeys(input, ["schemaVersion", "snapshotId", "descriptorFingerprint", "pageIndex", "startOffset", "endOffsetExclusive", "cursorUsed", "records", "recordsFingerprint", "nextCursor", "pageFingerprint"], [], field, "INVALID_LOCAL_DATA_ACCESS_PAGE");
  if (input.schemaVersion !== "LOCAL_DATA_ACCESS_PAGE_V1" || input.snapshotId !== descriptor.snapshotId || input.descriptorFingerprint !== fingerprint(descriptor) || !SHA256.test(input.recordsFingerprint) || !SHA256.test(input.pageFingerprint) || !Array.isArray(input.records)) fail(`${field} contains invalid page evidence`, "INVALID_LOCAL_DATA_ACCESS_PAGE", { field });
  const definitions = descriptor.domainDefinitions;
  const records = input.records.map((record, index) => normalizeRecord(record, definitions, `${field}.records[${index}]`));
  const startOffset = unsignedInteger(input.startOffset, `${field}.startOffset`, { maximum: descriptor.recordCount });
  const endOffsetExclusive = unsignedInteger(input.endOffsetExclusive, `${field}.endOffsetExclusive`, { maximum: descriptor.recordCount });
  const expectedIndex = Math.floor(startOffset / descriptor.pageSize);
  const expectedRecordCount = Math.min(descriptor.pageSize, descriptor.recordCount - startOffset);
  if (
    input.pageIndex !== expectedIndex ||
    input.pageIndex >= descriptor.pageCount ||
    startOffset !== input.pageIndex * descriptor.pageSize ||
    endOffsetExclusive !== startOffset + records.length ||
    records.length !== expectedRecordCount ||
    input.recordsFingerprint !== fingerprint(records)
  ) fail(`${field} pagination evidence is invalid`, "INVALID_LOCAL_DATA_ACCESS_PAGE", { field });
  if (startOffset === 0) {
    if (input.cursorUsed !== null) fail(`${field}.cursorUsed must be null on the first page`, "INVALID_LOCAL_DATA_ACCESS_PAGE", { field: `${field}.cursorUsed` });
  } else if (!isDeepStrictEqual(validateCursor(input.cursorUsed, descriptor, `${field}.cursorUsed`), buildCursor(descriptor, startOffset))) fail(`${field}.cursorUsed is not canonical`, "INVALID_LOCAL_DATA_ACCESS_PAGE", { field: `${field}.cursorUsed` });
  const expectedNext = endOffsetExclusive < descriptor.recordCount ? buildCursor(descriptor, endOffsetExclusive) : null;
  if (!isDeepStrictEqual(input.nextCursor, expectedNext)) fail(`${field}.nextCursor is invalid`, "INVALID_LOCAL_DATA_ACCESS_PAGE", { field: `${field}.nextCursor` });
  const { pageFingerprint: ignoredPageFingerprint, ...core } = input;
  if (input.pageFingerprint !== fingerprint(core)) fail(`${field}.pageFingerprint is invalid`, "INVALID_LOCAL_DATA_ACCESS_PAGE", { field: `${field}.pageFingerprint` });
  return immutable(input);
}

function verifyCompleteLocalDataAccessRead(descriptorInput, pageInputs) {
  const descriptor = validateLocalDataAccessDescriptor(descriptorInput);
  if (!Array.isArray(pageInputs) || pageInputs.length !== descriptor.pageCount) fail("pages do not cover the declared snapshot", "INCOMPLETE_LOCAL_DATA_ACCESS_READ", { field: "pages" });
  const pages = pageInputs.map((page, index) => validateLocalDataAccessPage(page, descriptor, `pages[${index}]`));
  const records = [];
  let expectedOffset = 0;
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    if (page.pageIndex !== index || page.startOffset !== expectedOffset || (index > 0 && !isDeepStrictEqual(pages[index - 1].nextCursor, page.cursorUsed))) fail("pages are missing, duplicated, or out of order", "INCOMPLETE_LOCAL_DATA_ACCESS_READ", { pageIndex: index });
    records.push(...page.records);
    expectedOffset = page.endOffsetExclusive;
  }
  if (expectedOffset !== descriptor.recordCount || pages.at(-1).nextCursor !== null || fingerprint(records) !== descriptor.recordsFingerprint) fail("pages do not reproduce the declared record set", "INCOMPLETE_LOCAL_DATA_ACCESS_READ");
  const expectedSummaries = buildDomainSummaries(descriptor.domainDefinitions, records);
  if (!isDeepStrictEqual(expectedSummaries, descriptor.domainSummaries)) fail("pages do not reproduce every declared domain", "INCOMPLETE_LOCAL_DATA_ACCESS_READ");
  return immutable({
    schemaVersion: "LOCAL_DATA_ACCESS_COMPLETION_V1",
    snapshotId: descriptor.snapshotId,
    complete: true,
    pageCount: pages.length,
    recordCount: records.length,
    recordsFingerprint: descriptor.recordsFingerprint,
    domainSummaries: descriptor.domainSummaries,
    controlBoundary: CONTROL_BOUNDARY,
  });
}

function createInMemoryLocalDataAccessRepository({ repositoryId, repositoryGeneration = 0, domainDefinitions = [], records = [] } = {}) {
  const normalizedRepositoryId = identifier(repositoryId, "repositoryId", "INVALID_LOCAL_DATA_ACCESS_REPOSITORY");
  const generation = unsignedInteger(repositoryGeneration, "repositoryGeneration");
  const definitions = immutable(normalizeDomainDefinitions(domainDefinitions));
  const normalizedRecords = immutable(normalizeRecords(records, definitions));
  const descriptors = new Map();

  return Object.freeze({
    async openSnapshot(requestInput) {
      const request = normalizeRequest(requestInput);
      if (request.expectedRepositoryGeneration !== generation) fail("repository generation changed before snapshot creation", "STALE_LOCAL_DATA_ACCESS_GENERATION", { expected: request.expectedRepositoryGeneration, actual: generation });
      const descriptor = buildDescriptor({ request, repositoryId: normalizedRepositoryId, repositoryGeneration: generation, definitions, records: normalizedRecords });
      descriptors.set(descriptor.snapshotId, descriptor);
      return descriptor;
    },
    async readPage(requestInput) {
      assertExactKeys(requestInput, ["schemaVersion", "snapshotId", "cursor"], [], "pageRequest", "INVALID_LOCAL_DATA_ACCESS_PAGE_REQUEST");
      if (requestInput.schemaVersion !== "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1") fail("page request version is unsupported", "INVALID_LOCAL_DATA_ACCESS_PAGE_REQUEST", { field: "schemaVersion" });
      const snapshotId = typeof requestInput.snapshotId === "string" && SHA256.test(requestInput.snapshotId) ? requestInput.snapshotId : fail("snapshotId is invalid", "INVALID_LOCAL_DATA_ACCESS_PAGE_REQUEST", { field: "snapshotId" });
      const descriptor = descriptors.get(snapshotId);
      if (!descriptor) fail("snapshot is unknown to this repository", "UNKNOWN_LOCAL_DATA_ACCESS_SNAPSHOT", { snapshotId });
      if (requestInput.cursor !== null) validateCursor(requestInput.cursor, descriptor);
      return buildPage(descriptor, normalizedRecords, requestInput.cursor);
    },
  });
}

export {
  CONTROL_BOUNDARY,
  createInMemoryLocalDataAccessRepository,
  domainDefinitionFingerprint,
  normalizeDomainDefinition,
  validateLocalDataAccessDescriptor,
  validateLocalDataAccessPage,
  verifyCompleteLocalDataAccessRead,
};
