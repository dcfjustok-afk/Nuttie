import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { normalizeEnergyFact } from "./seven-day-energy-trend-harness.mjs";

const MUTATIONS = Object.freeze({ UPSERT: "UPSERT", DELETE: "DELETE" });
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|([+-])(\d{2}):(\d{2}))$/;
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
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_MANUAL_BURN_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) fail(`${field} is not safely serializable`, "INVALID_MANUAL_BURN_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item, index) => serializable(item, `${field}[${index}]`, seen));
  else {
    assertPlainRecord(value, field, "INVALID_MANUAL_BURN_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_MANUAL_BURN_VALUE", { field: `${field}.${key}` });
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

function identifier(value, field, code = "INVALID_MANUAL_BURN_RECORD") {
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

function normalizeDraft(input, field = "record") {
  assertExactKeys(input, ["id", "localDate", "recordedAt", "energy"], [], field, "INVALID_MANUAL_BURN_RECORD");
  const normalizedDate = dateKey(input.localDate, `${field}.localDate`);
  const normalizedInstant = instant(input.recordedAt, `${field}.recordedAt`);
  if (normalizedInstant.slice(0, 10) !== normalizedDate) fail("manual burn localDate does not match recordedAt", "MANUAL_BURN_LOCAL_DATE_MISMATCH", { field: `${field}.localDate` });
  const normalizedFact = normalizeEnergyFact({
    schemaVersion: "ENERGY_FACT_V1",
    id: identifier(input.id, `${field}.id`),
    localDate: normalizedDate,
    stream: "BURNED",
    energy: input.energy,
    source: { kind: "MANUAL_BURN", recordId: input.id, revision: 1, quality: "USER_ENTERED" },
  });
  return immutable({ id: normalizedFact.id, localDate: normalizedDate, recordedAt: normalizedInstant, energy: normalizedFact.energy });
}

function normalizeManualBurnRecord(input, field = "record") {
  assertExactKeys(input, ["schemaVersion", "id", "localDate", "recordedAt", "energy", "revision"], [], field, "INVALID_MANUAL_BURN_RECORD");
  if (input.schemaVersion !== "MANUAL_BURN_RECORD_V1" || !Number.isSafeInteger(input.revision) || input.revision < 1) fail(`${field} version or revision is invalid`, "INVALID_MANUAL_BURN_RECORD", { field });
  return immutable({
    schemaVersion: "MANUAL_BURN_RECORD_V1",
    ...normalizeDraft({ id: input.id, localDate: input.localDate, recordedAt: input.recordedAt, energy: input.energy }, field),
    revision: input.revision,
  });
}

function normalizeRecords(records, field = "records") {
  if (!Array.isArray(records)) fail(`${field} must be an array`, "INVALID_MANUAL_BURN_COLLECTION", { field });
  const normalized = records.map((record, index) => normalizeManualBurnRecord(record, `${field}[${index}]`));
  const ids = new Set();
  for (const record of normalized) {
    if (ids.has(record.id)) fail("manual burn IDs must be unique", "DUPLICATE_MANUAL_BURN_RECORD", { recordId: record.id });
    ids.add(record.id);
  }
  return normalized.sort((left, right) => Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
}

function projectManualBurnEnergyFacts(records) {
  return immutable(normalizeRecords(records).map((record) => normalizeEnergyFact({
    schemaVersion: "ENERGY_FACT_V1",
    id: `burn:${record.id}`,
    localDate: record.localDate,
    stream: "BURNED",
    energy: record.energy,
    source: { kind: "MANUAL_BURN", recordId: record.id, revision: record.revision, quality: "USER_ENTERED" },
  })));
}

function normalizeMutation(input, field = "mutation") {
  assertPlainRecord(input, field, "INVALID_MANUAL_BURN_MUTATION");
  if (input.kind === MUTATIONS.UPSERT) {
    assertExactKeys(input, ["kind", "expectedRevision", "record"], [], field, "INVALID_MANUAL_BURN_MUTATION");
    if (input.expectedRevision !== null && (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1)) fail("expected revision is invalid", "INVALID_MANUAL_BURN_MUTATION");
    return immutable({ kind: MUTATIONS.UPSERT, expectedRevision: input.expectedRevision, record: normalizeDraft(input.record, `${field}.record`) });
  }
  if (input.kind === MUTATIONS.DELETE) {
    assertExactKeys(input, ["kind", "expectedRevision", "recordId"], [], field, "INVALID_MANUAL_BURN_MUTATION");
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) fail("expected revision is invalid", "INVALID_MANUAL_BURN_MUTATION");
    return immutable({ kind: MUTATIONS.DELETE, expectedRevision: input.expectedRevision, recordId: identifier(input.recordId, `${field}.recordId`) });
  }
  fail("manual burn mutation kind is unsupported", "INVALID_MANUAL_BURN_MUTATION");
}

function applyMutation(records, mutationInput) {
  const normalized = normalizeRecords(records);
  const mutation = normalizeMutation(mutationInput);
  const id = mutation.kind === MUTATIONS.UPSERT ? mutation.record.id : mutation.recordId;
  const index = normalized.findIndex((record) => record.id === id);
  const existing = index < 0 ? null : normalized[index];
  if (mutation.kind === MUTATIONS.UPSERT) {
    if (mutation.expectedRevision === null && existing !== null) fail("manual burn already exists", "MANUAL_BURN_ALREADY_EXISTS");
    if (mutation.expectedRevision !== null && existing?.revision !== mutation.expectedRevision) fail("manual burn revision is stale", "STALE_MANUAL_BURN_REVISION");
    const committed = normalizeManualBurnRecord({ schemaVersion: "MANUAL_BURN_RECORD_V1", ...mutation.record, revision: existing === null ? 1 : existing.revision + 1 });
    const next = [...normalized];
    if (index < 0) next.push(committed); else next[index] = committed;
    return immutable({ beforeRecord: existing, afterRecord: committed, records: normalizeRecords(next) });
  }
  if (existing?.revision !== mutation.expectedRevision) fail("manual burn revision is stale", "STALE_MANUAL_BURN_REVISION");
  return immutable({ beforeRecord: existing, afterRecord: null, records: normalized.filter((record) => record.id !== id) });
}

function createManualBurnMutationEffect({ commandId, mutation, attempt = 1 }) {
  const command = immutable({ commandId: identifier(commandId, "commandId", "INVALID_MANUAL_BURN_COMMAND"), mutation: normalizeMutation(mutation) });
  if (!Number.isSafeInteger(attempt) || attempt < 1) fail("manual burn attempt is invalid", "INVALID_MANUAL_BURN_COMMAND");
  return immutable({ type: "APPLY_MANUAL_BURN_MUTATION", command, attempt, fingerprint: fingerprint(command) });
}

function normalizeEffect(input) {
  assertExactKeys(input, ["type", "command", "attempt", "fingerprint"], [], "effect", "INVALID_MANUAL_BURN_COMMAND");
  if (input.type !== "APPLY_MANUAL_BURN_MUTATION" || !SHA256.test(input.fingerprint)) fail("manual burn effect is invalid", "INVALID_MANUAL_BURN_COMMAND");
  const effect = createManualBurnMutationEffect({ commandId: input.command?.commandId, mutation: input.command?.mutation, attempt: input.attempt });
  if (!isDeepStrictEqual(input, effect)) fail("manual burn effect fingerprint is invalid", "INVALID_MANUAL_BURN_COMMAND");
  return effect;
}

function retryManualBurnMutation(effect) {
  const normalized = normalizeEffect(effect);
  return createManualBurnMutationEffect({ commandId: normalized.command.commandId, mutation: normalized.command.mutation, attempt: normalized.attempt + 1 });
}

function receipt(effect, disposition, applied) {
  const facts = projectManualBurnEnergyFacts(applied.records);
  return immutable({
    schemaVersion: "MANUAL_BURN_RECEIPT_V1",
    commandId: effect.command.commandId,
    fingerprint: effect.fingerprint,
    disposition,
    beforeRecord: applied.beforeRecord,
    afterRecord: applied.afterRecord,
    records: applied.records,
    recordsFingerprint: fingerprint(applied.records),
    energyFacts: facts,
    energyFactsFingerprint: fingerprint(facts),
  });
}

function createInMemoryManualBurnRepository({ records = [], failurePlan = [] } = {}) {
  let stored = normalizeRecords(records);
  if (!Array.isArray(failurePlan) || failurePlan.some((failure) => !["BEFORE_COMMIT", "AFTER_COMMIT"].includes(failure))) fail("manual burn failure plan is invalid", "INVALID_MANUAL_BURN_REPOSITORY");
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
    snapshot() { return immutable({ records: stored, energyFacts: projectManualBurnEnergyFacts(stored), idempotencyCount: idempotency.size, calls }); },
  });
}

function validateManualBurnReceipt({ baselineRecords, effect: effectInput, outcome }) {
  const effect = normalizeEffect(effectInput);
  assertExactKeys(outcome, ["status", "commandId", "fingerprint", "attempt", "receipt"], [], "outcome", "INVALID_MANUAL_BURN_OUTCOME");
  if (outcome.status !== "SUCCESS" || outcome.commandId !== effect.command.commandId || outcome.fingerprint !== effect.fingerprint || outcome.attempt !== effect.attempt) fail("manual burn outcome is not bound to the effect", "INVALID_MANUAL_BURN_OUTCOME");
  const expected = applyMutation(baselineRecords, effect.command.mutation);
  const expectedReceipt = receipt(effect, outcome.receipt?.disposition, expected);
  if (!isDeepStrictEqual(outcome.receipt, expectedReceipt) || !["COMMITTED", "REPLAYED"].includes(outcome.receipt?.disposition)) fail("manual burn receipt is invalid", "INVALID_MANUAL_BURN_OUTCOME");
  return expectedReceipt;
}

export {
  MUTATIONS,
  createInMemoryManualBurnRepository,
  createManualBurnMutationEffect,
  normalizeManualBurnRecord,
  projectManualBurnEnergyFacts,
  retryManualBurnMutation,
  validateManualBurnReceipt,
};
