import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_SLOTS = 128;
const MAX_FACTS = 4096;

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

function serializable(value, field, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_MEAL_GROUPING_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) fail(`${field} is not safely serializable`, "INVALID_MEAL_GROUPING_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) value.forEach((child, index) => serializable(child, `${field}[${index}]`, seen));
  else {
    assertPlainRecord(value, field, "INVALID_MEAL_GROUPING_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_MEAL_GROUPING_VALUE", { field: `${field}.${key}` });
      serializable(child, `${field}.${key}`, seen);
    }
  }
  seen.delete(value);
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
  serializable(value, "value");
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

function identifier(value, field, code = "INVALID_MEAL_SLOT_DEFINITION") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function sha256(value, field, code) {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${field} must be a lowercase SHA-256`, code, { field });
  return value;
}

function localDate(value, field = "localDate") {
  const match = typeof value === "string" ? LOCAL_DATE.exec(value) : null;
  if (!match) fail(`${field} must be YYYY-MM-DD`, "INVALID_LOCAL_DATE", { field });
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (year === 0 || month < 1 || month > 12 || day < 1 || day > 31) fail(`${field} is not a Gregorian calendar date`, "INVALID_LOCAL_DATE", { field });
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) fail(`${field} is not a Gregorian calendar date`, "INVALID_LOCAL_DATE", { field });
  return value;
}

function normalizeSlot(input, field) {
  assertExactKeys(input, ["slotId", "position"], [], field, "INVALID_MEAL_SLOT_DEFINITION");
  if (!Number.isSafeInteger(input.position) || input.position < 0) fail(`${field}.position must be a non-negative safe integer`, "INVALID_MEAL_SLOT_DEFINITION", { field: `${field}.position` });
  return immutable({ slotId: identifier(input.slotId, `${field}.slotId`), position: input.position });
}

function normalizeMealSlotDefinition(input, field = "definition") {
  assertExactKeys(input, ["schemaVersion", "definitionId", "definitionVersion", "slots"], [], field, "INVALID_MEAL_SLOT_DEFINITION");
  if (input.schemaVersion !== "MEAL_SLOT_DEFINITION_SET_V1" || !Array.isArray(input.slots) || input.slots.length > MAX_SLOTS) {
    fail(`${field} version or slot collection is invalid`, "INVALID_MEAL_SLOT_DEFINITION", { field });
  }
  const slots = input.slots.map((slot, index) => normalizeSlot(slot, `${field}.slots[${index}]`));
  const slotIds = new Set();
  const positions = new Set();
  for (const slot of slots) {
    if (slotIds.has(slot.slotId)) fail("meal slot IDs must be unique", "DUPLICATE_MEAL_SLOT", { slotId: slot.slotId });
    if (positions.has(slot.position)) fail("meal slot positions must be unique", "DUPLICATE_MEAL_SLOT_POSITION", { position: slot.position });
    slotIds.add(slot.slotId);
    positions.add(slot.position);
  }
  slots.sort((left, right) => left.position - right.position || (left.slotId < right.slotId ? -1 : left.slotId > right.slotId ? 1 : 0));
  slots.forEach((slot, index) => {
    if (slot.position !== index) fail("meal slot positions must form an explicit contiguous sequence", "INVALID_MEAL_SLOT_POSITION_SEQUENCE", { position: slot.position });
  });
  return immutable({
    schemaVersion: "MEAL_SLOT_DEFINITION_SET_V1",
    definitionId: identifier(input.definitionId, `${field}.definitionId`),
    definitionVersion: identifier(input.definitionVersion, `${field}.definitionVersion`),
    slots,
  });
}

function fingerprintMealSlotDefinition(input) {
  return fingerprint(normalizeMealSlotDefinition(input));
}

function normalizeSlotRef(input, field) {
  if (input === null) return null;
  assertExactKeys(input, ["definitionFingerprint", "slotId"], [], field, "INVALID_MEAL_SLOT_REFERENCE");
  return immutable({
    definitionFingerprint: sha256(input.definitionFingerprint, `${field}.definitionFingerprint`, "INVALID_MEAL_SLOT_REFERENCE"),
    slotId: identifier(input.slotId, `${field}.slotId`, "INVALID_MEAL_SLOT_REFERENCE"),
  });
}

function normalizeMealSlotAssignmentFact(input, field = "fact") {
  assertExactKeys(input, ["schemaVersion", "recordId", "revision", "localDate", "slotRef"], [], field, "INVALID_MEAL_SLOT_ASSIGNMENT");
  if (input.schemaVersion !== "MEAL_SLOT_ASSIGNMENT_FACT_V1" || !Number.isSafeInteger(input.revision) || input.revision < 1) {
    fail(`${field} version or revision is invalid`, "INVALID_MEAL_SLOT_ASSIGNMENT", { field });
  }
  return immutable({
    schemaVersion: "MEAL_SLOT_ASSIGNMENT_FACT_V1",
    recordId: identifier(input.recordId, `${field}.recordId`, "INVALID_MEAL_SLOT_ASSIGNMENT"),
    revision: input.revision,
    localDate: localDate(input.localDate, `${field}.localDate`),
    slotRef: normalizeSlotRef(input.slotRef, `${field}.slotRef`),
  });
}

function normalizeFacts(input, field = "facts") {
  if (!Array.isArray(input) || input.length > MAX_FACTS) fail(`${field} must be a bounded array`, "INVALID_MEAL_SLOT_FACT_COLLECTION", { field });
  const facts = input.map((fact, index) => normalizeMealSlotAssignmentFact(fact, `${field}[${index}]`));
  const ids = new Set();
  for (const fact of facts) {
    if (ids.has(fact.recordId)) fail("meal assignment record IDs must be unique", "DUPLICATE_MEAL_SLOT_ASSIGNMENT", { recordId: fact.recordId });
    ids.add(fact.recordId);
  }
  return facts.sort((left, right) => (
    left.localDate < right.localDate ? -1 : left.localDate > right.localDate ? 1
      : left.recordId < right.recordId ? -1 : left.recordId > right.recordId ? 1 : 0
  ));
}

function recordEvidence(fact) {
  return immutable({ recordId: fact.recordId, revision: fact.revision });
}

function statusFor(records) {
  return records.length === 0 ? "EMPTY" : "NON_EMPTY";
}

function buildMealSlotGrouping({ localDate: requestedDate, definition: definitionInput, facts: factsInput }) {
  const selectedLocalDate = localDate(requestedDate);
  const definition = normalizeMealSlotDefinition(definitionInput);
  const definitionFingerprint = fingerprint(definition);
  const facts = normalizeFacts(factsInput);
  const selectedFacts = facts.filter((fact) => fact.localDate === selectedLocalDate);
  const groups = definition.slots.map((slot) => {
    const records = selectedFacts
      .filter((fact) => fact.slotRef?.definitionFingerprint === definitionFingerprint && fact.slotRef.slotId === slot.slotId)
      .map(recordEvidence);
    return immutable({ slotId: slot.slotId, position: slot.position, status: statusFor(records), recordCount: records.length, records });
  });
  const unassignedRecords = selectedFacts.filter((fact) => fact.slotRef === null).map(recordEvidence);
  const unresolvedRecords = selectedFacts
    .filter((fact) => fact.slotRef !== null && !groups.some((group) => (
      fact.slotRef.definitionFingerprint === definitionFingerprint && fact.slotRef.slotId === group.slotId
    )))
    .map((fact) => immutable({
      ...recordEvidence(fact),
      slotRef: fact.slotRef,
      reason: fact.slotRef.definitionFingerprint === definitionFingerprint ? "SLOT_NOT_IN_DEFINITION" : "DEFINITION_NOT_AVAILABLE",
    }));
  return immutable({
    schemaVersion: "MEAL_SLOT_GROUPING_V1",
    localDate: selectedLocalDate,
    definition,
    definitionFingerprint,
    selectedFactsFingerprint: fingerprint(selectedFacts),
    groups,
    unassigned: {
      status: statusFor(unassignedRecords),
      recordCount: unassignedRecords.length,
      records: unassignedRecords,
    },
    unresolved: {
      status: statusFor(unresolvedRecords),
      recordCount: unresolvedRecords.length,
      records: unresolvedRecords,
    },
    counts: {
      total: selectedFacts.length,
      assigned: groups.reduce((total, group) => total + group.recordCount, 0),
      unassigned: unassignedRecords.length,
      unresolved: unresolvedRecords.length,
    },
  });
}

function validateMealSlotGrouping(input, field = "grouping") {
  assertExactKeys(input, [
    "schemaVersion",
    "localDate",
    "definition",
    "definitionFingerprint",
    "selectedFactsFingerprint",
    "groups",
    "unassigned",
    "unresolved",
    "counts",
  ], [], field, "INVALID_MEAL_SLOT_GROUPING");
  if (input.schemaVersion !== "MEAL_SLOT_GROUPING_V1" || !SHA256.test(input.definitionFingerprint) || !SHA256.test(input.selectedFactsFingerprint)) {
    fail(`${field} version or fingerprint is invalid`, "INVALID_MEAL_SLOT_GROUPING", { field });
  }
  const reconstructedFacts = [];
  for (const group of input.groups ?? []) {
    for (const record of group.records ?? []) reconstructedFacts.push({
      schemaVersion: "MEAL_SLOT_ASSIGNMENT_FACT_V1",
      recordId: record.recordId,
      revision: record.revision,
      localDate: input.localDate,
      slotRef: { definitionFingerprint: input.definitionFingerprint, slotId: group.slotId },
    });
  }
  for (const record of input.unassigned?.records ?? []) reconstructedFacts.push({
    schemaVersion: "MEAL_SLOT_ASSIGNMENT_FACT_V1",
    recordId: record.recordId,
    revision: record.revision,
    localDate: input.localDate,
    slotRef: null,
  });
  for (const record of input.unresolved?.records ?? []) reconstructedFacts.push({
    schemaVersion: "MEAL_SLOT_ASSIGNMENT_FACT_V1",
    recordId: record.recordId,
    revision: record.revision,
    localDate: input.localDate,
    slotRef: record.slotRef,
  });
  const expected = buildMealSlotGrouping({ localDate: input.localDate, definition: input.definition, facts: reconstructedFacts });
  if (!isDeepStrictEqual(input, expected)) fail(`${field} contains invalid derived evidence`, "INVALID_MEAL_SLOT_GROUPING", { field });
  return expected;
}

export {
  buildMealSlotGrouping,
  fingerprintMealSlotDefinition,
  normalizeMealSlotAssignmentFact,
  normalizeMealSlotDefinition,
  validateMealSlotGrouping,
};
