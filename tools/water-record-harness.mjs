import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const MUTATIONS = Object.freeze({ UPSERT: "UPSERT", DELETE: "DELETE" });
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|([+-])(\d{2}):(\d{2}))$/;
const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const POSITIVE_INTEGER = /^[1-9]\d*$/;
const SHA256 = /^[a-f0-9]{64}$/;

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${field} must be a plain record`, code, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail(`${field} must be a plain record`, code, { field });
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  }
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, code, { field: `${field}.${key}` });
}

function serializable(value, field, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_WATER_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) fail(`${field} is not safely serializable`, "INVALID_WATER_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item, index) => serializable(item, `${field}[${index}]`, seen));
  else {
    assertPlainRecord(value, field, "INVALID_WATER_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_WATER_VALUE", { field: `${field}.${key}` });
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

function identifier(value, field, code = "INVALID_WATER_RECORD") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function dateKey(value, field) {
  const match = typeof value === "string" ? LOCAL_DATE.exec(value) : null;
  if (!match) fail(`${field} must be YYYY-MM-DD`, "INVALID_LOCAL_DATE", { field });
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.toISOString().slice(0, 10) !== value) fail(`${field} is not a calendar date`, "INVALID_LOCAL_DATE", { field });
  return value;
}

function instant(value, field) {
  const match = typeof value === "string" ? INSTANT.exec(value) : null;
  if (!match || !Number.isFinite(Date.parse(value))) fail(`${field} must be an ISO timestamp with explicit offset`, "INVALID_RECORDED_AT", { field });
  const [, year, month, day, hour, minute, second, zone, , offsetHour, offsetMinute] = match;
  const calendar = `${year}-${month}-${day}`;
  const validCalendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString().slice(0, 10) === calendar;
  if (!validCalendar || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 || (zone !== "Z" && (Number(offsetHour) > 23 || Number(offsetMinute) > 59))) {
    fail(`${field} is not a valid calendar instant`, "INVALID_RECORDED_AT", { field });
  }
  return value;
}

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function reduced(numerator, denominator) {
  if (denominator <= 0n || numerator < 0n) fail("volume fraction is invalid", "INVALID_WATER_VOLUME");
  if (numerator === 0n) return { numerator: "0", denominator: "1" };
  const divisor = gcd(numerator, denominator);
  return { numerator: String(numerator / divisor), denominator: String(denominator / divisor) };
}

function positiveInteger(value, field) {
  if (typeof value !== "string" || !POSITIVE_INTEGER.test(value) || value.length > 128) fail(`${field} must be a bounded positive integer string`, "INVALID_WATER_VOLUME", { field });
  return BigInt(value);
}

function decimalFraction(value, field) {
  if (typeof value !== "string" || !DECIMAL.test(value) || value.replace(".", "").length > 64) fail(`${field} must be a bounded unsigned decimal string`, "INVALID_WATER_VOLUME", { field });
  const [whole, fraction = ""] = value.split(".");
  const result = reduced(BigInt(`${whole}${fraction}`), 10n ** BigInt(fraction.length));
  if (result.numerator === "0") fail(`${field} must be greater than zero`, "INVALID_WATER_VOLUME", { field });
  return result;
}

function exactVolumeFromRaw(input, field) {
  assertExactKeys(input, ["value", "unit"], [], field, "INVALID_WATER_VOLUME");
  assertExactKeys(input.unit, ["definitionId", "unitId", "baseUnitId", "toBaseNumerator", "toBaseDenominator"], [], `${field}.unit`, "INVALID_WATER_VOLUME");
  const original = decimalFraction(input.value, `${field}.value`);
  const definitionId = identifier(input.unit.definitionId, `${field}.unit.definitionId`, "INVALID_WATER_VOLUME");
  const unitId = identifier(input.unit.unitId, `${field}.unit.unitId`, "INVALID_WATER_VOLUME");
  const baseUnitId = identifier(input.unit.baseUnitId, `${field}.unit.baseUnitId`, "INVALID_WATER_VOLUME");
  const conversion = reduced(
    positiveInteger(input.unit.toBaseNumerator, `${field}.unit.toBaseNumerator`),
    positiveInteger(input.unit.toBaseDenominator, `${field}.unit.toBaseDenominator`),
  );
  if (unitId === baseUnitId && (conversion.numerator !== "1" || conversion.denominator !== "1")) fail("a base unit must convert to itself as 1/1", "INVALID_WATER_VOLUME", { field: `${field}.unit` });
  const exactBase = reduced(
    BigInt(original.numerator) * BigInt(conversion.numerator),
    BigInt(original.denominator) * BigInt(conversion.denominator),
  );
  return immutable({
    schemaVersion: "WATER_VOLUME_V1",
    originalValue: input.value,
    definitionId,
    unitId,
    baseUnitId,
    toBase: conversion,
    exactBase,
  });
}

function normalizeVolume(input, field) {
  assertPlainRecord(input, field, "INVALID_WATER_VOLUME");
  if (!Object.hasOwn(input, "schemaVersion")) return exactVolumeFromRaw(input, field);
  assertExactKeys(input, ["schemaVersion", "originalValue", "definitionId", "unitId", "baseUnitId", "toBase", "exactBase"], [], field, "INVALID_WATER_VOLUME");
  if (input.schemaVersion !== "WATER_VOLUME_V1") fail(`${field}.schemaVersion is invalid`, "INVALID_WATER_VOLUME", { field: `${field}.schemaVersion` });
  assertExactKeys(input.toBase, ["numerator", "denominator"], [], `${field}.toBase`, "INVALID_WATER_VOLUME");
  assertExactKeys(input.exactBase, ["numerator", "denominator"], [], `${field}.exactBase`, "INVALID_WATER_VOLUME");
  const expected = exactVolumeFromRaw({
    value: input.originalValue,
    unit: {
      definitionId: input.definitionId,
      unitId: input.unitId,
      baseUnitId: input.baseUnitId,
      toBaseNumerator: input.toBase.numerator,
      toBaseDenominator: input.toBase.denominator,
    },
  }, field);
  if (!isDeepStrictEqual(input, expected)) fail(`${field} derived volume is inconsistent`, "INVALID_WATER_VOLUME", { field });
  return expected;
}

function normalizeDraft(input, field = "record") {
  assertExactKeys(input, ["id", "localDate", "recordedAt", "volume"], [], field, "INVALID_WATER_RECORD");
  const normalizedDate = dateKey(input.localDate, `${field}.localDate`);
  const normalizedInstant = instant(input.recordedAt, `${field}.recordedAt`);
  if (normalizedInstant.slice(0, 10) !== normalizedDate) fail("water localDate does not match recordedAt", "WATER_LOCAL_DATE_MISMATCH", { field: `${field}.localDate` });
  return immutable({
    id: identifier(input.id, `${field}.id`),
    localDate: normalizedDate,
    recordedAt: normalizedInstant,
    volume: normalizeVolume(input.volume, `${field}.volume`),
  });
}

function normalizeWaterRecord(input, field = "record") {
  assertExactKeys(input, ["schemaVersion", "id", "localDate", "recordedAt", "volume", "revision"], [], field, "INVALID_WATER_RECORD");
  if (input.schemaVersion !== "WATER_RECORD_V1" || !Number.isSafeInteger(input.revision) || input.revision < 1) fail(`${field} version or revision is invalid`, "INVALID_WATER_RECORD", { field });
  return immutable({
    schemaVersion: "WATER_RECORD_V1",
    ...normalizeDraft({ id: input.id, localDate: input.localDate, recordedAt: input.recordedAt, volume: input.volume }, field),
    revision: input.revision,
  });
}

function normalizeRecords(records, field = "records") {
  if (!Array.isArray(records)) fail(`${field} must be an array`, "INVALID_WATER_COLLECTION", { field });
  const normalized = records.map((record, index) => normalizeWaterRecord(record, `${field}[${index}]`));
  const ids = new Set();
  const definitionBases = new Map();
  const unitDefinitions = new Map();
  for (const record of normalized) {
    if (ids.has(record.id)) fail("water record IDs must be unique", "DUPLICATE_WATER_RECORD", { recordId: record.id });
    ids.add(record.id);
    const { definitionId, unitId, baseUnitId, toBase } = record.volume;
    const knownBase = definitionBases.get(definitionId);
    if (knownBase !== undefined && knownBase !== baseUnitId) fail("one volume definition cannot name multiple base units", "INCONSISTENT_VOLUME_DEFINITION", { definitionId });
    definitionBases.set(definitionId, baseUnitId);
    const unitKey = `${definitionId}\u0000${unitId}`;
    const signature = `${baseUnitId}:${toBase.numerator}/${toBase.denominator}`;
    const knownUnit = unitDefinitions.get(unitKey);
    if (knownUnit !== undefined && knownUnit !== signature) fail("one unit definition cannot have conflicting conversion factors", "INCONSISTENT_VOLUME_DEFINITION", { definitionId, unitId });
    unitDefinitions.set(unitKey, signature);
  }
  return normalized.sort((left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
}

function addFractions(left, right) {
  return reduced(
    BigInt(left.numerator) * BigInt(right.denominator) + BigInt(right.numerator) * BigInt(left.denominator),
    BigInt(left.denominator) * BigInt(right.denominator),
  );
}

function summarizeWaterRecordsForLocalDate(records, localDateInput) {
  const localDate = dateKey(localDateInput, "localDate");
  const selected = normalizeRecords(records).filter((record) => record.localDate === localDate);
  const groups = new Map();
  for (const record of selected) {
    const key = `${record.volume.definitionId}\u0000${record.volume.baseUnitId}`;
    const group = groups.get(key) ?? {
      definitionId: record.volume.definitionId,
      baseUnitId: record.volume.baseUnitId,
      exactBaseTotal: { numerator: "0", denominator: "1" },
      sources: [],
    };
    group.exactBaseTotal = addFractions(group.exactBaseTotal, record.volume.exactBase);
    group.sources.push({
      recordId: record.id,
      revision: record.revision,
      recordedAt: record.recordedAt,
      originalValue: record.volume.originalValue,
      unitId: record.volume.unitId,
      exactBase: record.volume.exactBase,
    });
    groups.set(key, group);
  }
  const totals = [...groups.values()]
    .sort((left, right) => left.definitionId < right.definitionId ? -1 : left.definitionId > right.definitionId ? 1 : left.baseUnitId < right.baseUnitId ? -1 : left.baseUnitId > right.baseUnitId ? 1 : 0)
    .map((group) => immutable(group));
  return immutable({
    schemaVersion: "WATER_DAILY_SUMMARY_V1",
    localDate,
    status: selected.length === 0 ? "EMPTY" : "RECORDED",
    recordCount: selected.length,
    totals,
  });
}

function normalizeMutation(input, field = "mutation") {
  assertPlainRecord(input, field, "INVALID_WATER_MUTATION");
  if (input.kind === MUTATIONS.UPSERT) {
    assertExactKeys(input, ["kind", "expectedRevision", "record"], [], field, "INVALID_WATER_MUTATION");
    if (input.expectedRevision !== null && (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1)) fail("expected revision is invalid", "INVALID_WATER_MUTATION");
    return immutable({ kind: MUTATIONS.UPSERT, expectedRevision: input.expectedRevision, record: normalizeDraft(input.record, `${field}.record`) });
  }
  if (input.kind === MUTATIONS.DELETE) {
    assertExactKeys(input, ["kind", "expectedRevision", "recordId"], [], field, "INVALID_WATER_MUTATION");
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) fail("expected revision is invalid", "INVALID_WATER_MUTATION");
    return immutable({ kind: MUTATIONS.DELETE, expectedRevision: input.expectedRevision, recordId: identifier(input.recordId, `${field}.recordId`) });
  }
  fail("water mutation kind is unsupported", "INVALID_WATER_MUTATION");
}

function applyMutation(records, mutationInput) {
  const normalized = normalizeRecords(records);
  const mutation = normalizeMutation(mutationInput);
  const id = mutation.kind === MUTATIONS.UPSERT ? mutation.record.id : mutation.recordId;
  const index = normalized.findIndex((record) => record.id === id);
  const existing = index < 0 ? null : normalized[index];
  let afterRecord;
  let next;
  if (mutation.kind === MUTATIONS.UPSERT) {
    if (mutation.expectedRevision === null && existing !== null) fail("water record already exists", "WATER_RECORD_ALREADY_EXISTS");
    if (mutation.expectedRevision !== null && existing?.revision !== mutation.expectedRevision) fail("water record revision is stale", "STALE_WATER_REVISION");
    afterRecord = normalizeWaterRecord({ schemaVersion: "WATER_RECORD_V1", ...mutation.record, revision: existing === null ? 1 : existing.revision + 1 });
    next = [...normalized];
    if (index < 0) next.push(afterRecord); else next[index] = afterRecord;
  } else {
    if (existing?.revision !== mutation.expectedRevision) fail("water record revision is stale", "STALE_WATER_REVISION");
    afterRecord = null;
    next = normalized.filter((record) => record.id !== id);
  }
  const committedRecords = normalizeRecords(next);
  const affectedLocalDates = [...new Set([existing?.localDate, afterRecord?.localDate].filter(Boolean))].sort();
  return immutable({
    beforeRecord: existing,
    afterRecord,
    records: committedRecords,
    affectedLocalDates,
    dailySummaries: affectedLocalDates.map((localDate) => summarizeWaterRecordsForLocalDate(committedRecords, localDate)),
  });
}

function createWaterMutationEffect({ commandId, mutation, attempt = 1 }) {
  const command = immutable({ commandId: identifier(commandId, "commandId", "INVALID_WATER_COMMAND"), mutation: normalizeMutation(mutation) });
  if (!Number.isSafeInteger(attempt) || attempt < 1) fail("water attempt is invalid", "INVALID_WATER_COMMAND");
  return immutable({ type: "APPLY_WATER_MUTATION", command, attempt, fingerprint: fingerprint(command) });
}

function normalizeEffect(input) {
  assertExactKeys(input, ["type", "command", "attempt", "fingerprint"], [], "effect", "INVALID_WATER_COMMAND");
  if (input.type !== "APPLY_WATER_MUTATION" || !SHA256.test(input.fingerprint)) fail("water effect is invalid", "INVALID_WATER_COMMAND");
  const effect = createWaterMutationEffect({ commandId: input.command?.commandId, mutation: input.command?.mutation, attempt: input.attempt });
  if (!isDeepStrictEqual(input, effect)) fail("water effect fingerprint is invalid", "INVALID_WATER_COMMAND");
  return effect;
}

function retryWaterMutation(effect) {
  const normalized = normalizeEffect(effect);
  return createWaterMutationEffect({ commandId: normalized.command.commandId, mutation: normalized.command.mutation, attempt: normalized.attempt + 1 });
}

function receipt(effect, disposition, applied) {
  return immutable({
    schemaVersion: "WATER_RECEIPT_V1",
    commandId: effect.command.commandId,
    fingerprint: effect.fingerprint,
    disposition,
    beforeRecord: applied.beforeRecord,
    afterRecord: applied.afterRecord,
    records: applied.records,
    recordsFingerprint: fingerprint(applied.records),
    affectedLocalDates: applied.affectedLocalDates,
    dailySummaries: applied.dailySummaries,
    dailySummariesFingerprint: fingerprint(applied.dailySummaries),
  });
}

function createInMemoryWaterRepository({ records = [], failurePlan = [] } = {}) {
  let stored = normalizeRecords(records);
  if (!Array.isArray(failurePlan) || failurePlan.some((failure) => !["BEFORE_COMMIT", "AFTER_COMMIT"].includes(failure))) fail("water failure plan is invalid", "INVALID_WATER_REPOSITORY");
  const failures = [...failurePlan];
  const idempotency = new Map();
  let chain = Promise.resolve();
  let calls = 0;

  async function apply(effectInput) {
    const effect = normalizeEffect(effectInput);
    calls += 1;
    const prior = idempotency.get(effect.command.commandId);
    if (prior) {
      if (prior.fingerprint !== effect.fingerprint) return immutable({ status: "FAILURE", commitState: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "IDEMPOTENCY_CONFLICT" } });
      return immutable({ status: "SUCCESS", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, receipt: receipt(effect, "REPLAYED", prior.applied) });
    }
    const failure = failures.shift() ?? null;
    if (failure === "BEFORE_COMMIT") return immutable({ status: "FAILURE", commitState: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "REPOSITORY_UNAVAILABLE" } });
    let applied;
    try {
      applied = applyMutation(stored, effect.command.mutation);
    } catch (error) {
      return immutable({ status: "FAILURE", commitState: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: error.code ?? "MUTATION_REJECTED" } });
    }
    stored = applied.records;
    idempotency.set(effect.command.commandId, immutable({ fingerprint: effect.fingerprint, applied }));
    if (failure === "AFTER_COMMIT") return immutable({ status: "FAILURE", commitState: "UNKNOWN", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "RESPONSE_LOST" } });
    return immutable({ status: "SUCCESS", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, receipt: receipt(effect, "COMMITTED", applied) });
  }

  return Object.freeze({
    execute(effect) {
      const run = chain.then(() => apply(effect));
      chain = run.catch(() => undefined);
      return run;
    },
    snapshot() {
      return immutable({ records: stored, idempotencyCount: idempotency.size, calls });
    },
  });
}

function validateWaterReceipt({ baselineRecords, effect: effectInput, outcome }) {
  const effect = normalizeEffect(effectInput);
  assertExactKeys(outcome, ["status", "commandId", "fingerprint", "attempt", "receipt"], [], "outcome", "INVALID_WATER_OUTCOME");
  if (outcome.status !== "SUCCESS" || outcome.commandId !== effect.command.commandId || outcome.fingerprint !== effect.fingerprint || outcome.attempt !== effect.attempt) fail("water outcome is not bound to the effect", "INVALID_WATER_OUTCOME");
  const expected = applyMutation(baselineRecords, effect.command.mutation);
  const expectedReceipt = receipt(effect, outcome.receipt?.disposition, expected);
  if (!isDeepStrictEqual(outcome.receipt, expectedReceipt) || !["COMMITTED", "REPLAYED"].includes(outcome.receipt?.disposition)) fail("water receipt is invalid", "INVALID_WATER_OUTCOME");
  return expectedReceipt;
}

export {
  MUTATIONS,
  createInMemoryWaterRepository,
  createWaterMutationEffect,
  normalizeWaterRecord,
  retryWaterMutation,
  summarizeWaterRecordsForLocalDate,
  validateWaterReceipt,
};
