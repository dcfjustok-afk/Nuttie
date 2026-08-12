import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const STATUSES = Object.freeze({
  EDITING: "EDITING",
  REVIEW_READY: "REVIEW_READY",
  SAVING: "SAVING",
  SAVE_FAILED: "SAVE_FAILED",
  SAVED: "SAVED",
});

const MUTATIONS = Object.freeze({ UPSERT: "UPSERT", DELETE: "DELETE" });
const UNITS = Object.freeze({ KG: "KG", LB: "LB" });
const STATE_KEYS = Object.freeze([
  "status",
  "baselineRecords",
  "baselineSummary",
  "draft",
  "validationError",
  "preview",
  "pendingCommand",
  "pendingAttempt",
  "pendingFingerprint",
  "saveError",
  "receipt",
  "committedSummary",
]);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ERROR_CODE = /^[A-Z][A-Z0-9_]{0,63}$/;
const FIELD_PATH = /^[A-Za-z0-9.[\]_-]{1,256}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|([+-])(\d{2}):(\d{2}))$/;
const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code = "INVALID_RECORD") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be a plain record`, code, { field });
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${field} must be a plain record`, code, { field });
  }
  return value;
}

function assertExactKeys(value, required, optional, field, code = "INVALID_RECORD") {
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
  return value;
}

function assertSafeSerializable(value, field, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_STATE_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object") fail(`${field} is not serializable`, "INVALID_STATE_VALUE", { field });
  if (seen.has(value)) fail(`${field} must not contain cycles`, "INVALID_STATE_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertSafeSerializable(child, `${field}[${index}]`, seen));
  } else {
    assertPlainRecord(value, field, "INVALID_STATE_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) {
        fail(`${field} contains an unsafe key`, "INVALID_STATE_VALUE", { field: `${field}.${key}` });
      }
      assertSafeSerializable(child, `${field}.${key}`, seen);
    }
  }
  seen.delete(value);
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
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function immutable(value) {
  assertSafeSerializable(value, "value");
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

function normalizeIdentifier(value, field) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    fail(`${field} is invalid`, "INVALID_IDENTIFIER", { field });
  }
  return value;
}

function normalizeErrorCode(value, field) {
  if (typeof value !== "string" || !ERROR_CODE.test(value)) {
    fail(`${field} is invalid`, "INVALID_WEIGHT_OUTCOME", { field });
  }
  return value;
}

function normalizeLocalDate(value, field = "localDate") {
  const match = typeof value === "string" ? LOCAL_DATE.exec(value) : null;
  if (!match) fail(`${field} must be YYYY-MM-DD`, "INVALID_LOCAL_DATE", { field });
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.toISOString().slice(0, 10) !== value) {
    fail(`${field} is not a calendar date`, "INVALID_LOCAL_DATE", { field });
  }
  return value;
}

function normalizeInstant(value, field = "recordedAt") {
  const match = typeof value === "string" ? INSTANT.exec(value) : null;
  if (!match || !Number.isFinite(Date.parse(value))) {
    fail(`${field} must be an ISO timestamp with an explicit offset`, "INVALID_RECORDED_AT", { field });
  }
  const [, year, month, day, hour, minute, second, zone, , offsetHour, offsetMinute] = match;
  const localDate = `${year}-${month}-${day}`;
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const validCalendar = calendar.toISOString().slice(0, 10) === localDate;
  const validClock = Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59;
  const validOffset = zone === "Z" || (Number(offsetHour) <= 23 && Number(offsetMinute) <= 59);
  if (!validCalendar || !validClock || !validOffset) {
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

function decimalFraction(value, field) {
  if (typeof value !== "string" || value !== value.trim() || !DECIMAL.test(value)) {
    fail(`${field} must be an unsigned decimal string`, "INVALID_WEIGHT_VALUE", { field });
  }
  const digitCount = value.replace(".", "").length;
  if (digitCount > 24) fail(`${field} exceeds the contract resource budget`, "WEIGHT_VALUE_TOO_LARGE", { field });
  const [whole, fraction = ""] = value.split(".");
  const denominator = 10n ** BigInt(fraction.length);
  const numerator = BigInt(`${whole}${fraction}`);
  if (numerator === 0n) fail(`${field} must be greater than zero`, "INVALID_WEIGHT_VALUE", { field });
  const divisor = gcd(numerator, denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}

function reduceFraction(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  return {
    numerator: String(numerator / divisor),
    denominator: String(denominator / divisor),
  };
}

function normalizeMass(input, field = "mass") {
  assertExactKeys(input, ["inputValue", "inputUnit"], ["exactGrams", "conversion"], field, "INVALID_MASS");
  if (!Object.values(UNITS).includes(input.inputUnit)) {
    fail(`${field}.inputUnit is unsupported`, "UNSUPPORTED_WEIGHT_UNIT", { field: `${field}.inputUnit` });
  }
  const decimal = decimalFraction(input.inputValue, `${field}.inputValue`);
  const exactGrams = input.inputUnit === UNITS.KG
    ? reduceFraction(decimal.numerator * 1000n, decimal.denominator)
    : reduceFraction(decimal.numerator * 45359237n, decimal.denominator * 100000n);
  const normalized = immutable({
    inputValue: input.inputValue,
    inputUnit: input.inputUnit,
    exactGrams,
    conversion: input.inputUnit === UNITS.KG
      ? "KG_EXACT_DECIMAL_TO_GRAMS"
      : "LB_EXACT_45359237_OVER_100000_GRAMS",
  });
  const hasExactGrams = Object.hasOwn(input, "exactGrams");
  const hasConversion = Object.hasOwn(input, "conversion");
  if (hasExactGrams !== hasConversion || (hasExactGrams && !isDeepStrictEqual(input, normalized))) {
    fail(`${field} derived evidence is invalid`, "INVALID_MASS", { field });
  }
  return normalized;
}

function normalizeBodyWeightDraft(input, field = "record") {
  assertExactKeys(input, ["id", "localDate", "recordedAt", "mass"], [], field, "INVALID_WEIGHT_RECORD");
  const localDate = normalizeLocalDate(input.localDate, `${field}.localDate`);
  const recordedAt = normalizeInstant(input.recordedAt, `${field}.recordedAt`);
  if (recordedAt.slice(0, 10) !== localDate) {
    fail(`${field}.localDate must match the recordedAt local calendar date`, "WEIGHT_LOCAL_DATE_MISMATCH", { field: `${field}.localDate` });
  }
  return immutable({
    id: normalizeIdentifier(input.id, `${field}.id`),
    localDate,
    recordedAt,
    mass: normalizeMass(input.mass, `${field}.mass`),
  });
}

function normalizeBodyWeightRecord(input, field = "record") {
  assertExactKeys(input, ["schemaVersion", "id", "localDate", "recordedAt", "mass", "revision"], [], field, "INVALID_WEIGHT_RECORD");
  if (input.schemaVersion !== "BODY_WEIGHT_RECORD_V1") {
    fail("body weight record version is unsupported", "UNSUPPORTED_WEIGHT_RECORD_VERSION", { field: `${field}.schemaVersion` });
  }
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) {
    fail(`${field}.revision is invalid`, "INVALID_REVISION", { field: `${field}.revision` });
  }
  assertExactKeys(input.mass, ["inputValue", "inputUnit"], ["exactGrams", "conversion"], `${field}.mass`, "INVALID_MASS");
  const normalizedMass = normalizeMass(
    { inputValue: input.mass.inputValue, inputUnit: input.mass.inputUnit },
    `${field}.mass`,
  );
  const hasExactGrams = Object.hasOwn(input.mass, "exactGrams");
  const hasConversion = Object.hasOwn(input.mass, "conversion");
  if (hasExactGrams !== hasConversion || (hasExactGrams && !isDeepStrictEqual(input.mass, normalizedMass))) {
    fail(`${field}.mass derived evidence is invalid`, "INVALID_MASS", { field: `${field}.mass` });
  }
  const draft = normalizeBodyWeightDraft(
    {
      id: input.id,
      localDate: input.localDate,
      recordedAt: input.recordedAt,
      mass: { inputValue: input.mass.inputValue, inputUnit: input.mass.inputUnit },
    },
    field,
  );
  return immutable({ schemaVersion: "BODY_WEIGHT_RECORD_V1", ...draft, revision: input.revision });
}

function compareRecords(left, right) {
  const instant = Date.parse(left.recordedAt) - Date.parse(right.recordedAt);
  if (instant !== 0) return instant;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function normalizeRecordCollection(records, field = "records") {
  if (!Array.isArray(records)) fail(`${field} must be an array`, "INVALID_WEIGHT_COLLECTION", { field });
  const normalized = records.map((record, index) => normalizeBodyWeightRecord(record, `${field}[${index}]`));
  const ids = new Set();
  for (const record of normalized) {
    if (ids.has(record.id)) fail("body weight record IDs must be unique", "DUPLICATE_WEIGHT_RECORD", { recordId: record.id });
    ids.add(record.id);
  }
  return normalized.sort(compareRecords);
}

function summarizeBodyWeightRecords(records) {
  const points = normalizeRecordCollection(records);
  return immutable({
    schemaVersion: "BODY_WEIGHT_TREND_V1",
    recordCount: points.length,
    currentRecord: points.length === 0 ? null : points.at(-1),
    points,
  });
}

function normalizeMutationDraft(input, field = "draft") {
  assertPlainRecord(input, field, "INVALID_WEIGHT_MUTATION");
  if (input.kind === MUTATIONS.UPSERT) {
    assertExactKeys(input, ["kind", "expectedRevision", "record"], [], field, "INVALID_WEIGHT_MUTATION");
    if (input.expectedRevision !== null && (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1)) {
      fail(`${field}.expectedRevision is invalid`, "INVALID_REVISION", { field: `${field}.expectedRevision` });
    }
    return immutable({ kind: MUTATIONS.UPSERT, expectedRevision: input.expectedRevision, record: normalizeBodyWeightDraft(input.record, `${field}.record`) });
  }
  if (input.kind === MUTATIONS.DELETE) {
    assertExactKeys(input, ["kind", "expectedRevision", "recordId"], [], field, "INVALID_WEIGHT_MUTATION");
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) {
      fail(`${field}.expectedRevision is invalid`, "INVALID_REVISION", { field: `${field}.expectedRevision` });
    }
    return immutable({ kind: MUTATIONS.DELETE, expectedRevision: input.expectedRevision, recordId: normalizeIdentifier(input.recordId, `${field}.recordId`) });
  }
  fail(`${field}.kind is unsupported`, "INVALID_WEIGHT_MUTATION", { field: `${field}.kind` });
}

function applyMutation(records, mutation) {
  const normalized = normalizeRecordCollection(records);
  const index = normalized.findIndex((record) => record.id === (mutation.kind === MUTATIONS.UPSERT ? mutation.record.id : mutation.recordId));
  const existing = index < 0 ? null : normalized[index];
  if (mutation.kind === MUTATIONS.UPSERT) {
    if (mutation.expectedRevision === null && existing !== null) fail("record already exists", "WEIGHT_RECORD_ALREADY_EXISTS", { recordId: mutation.record.id });
    if (mutation.expectedRevision !== null && existing?.revision !== mutation.expectedRevision) {
      fail("record revision is stale", "STALE_WEIGHT_REVISION", { recordId: mutation.record.id });
    }
    const committed = normalizeBodyWeightRecord({
      schemaVersion: "BODY_WEIGHT_RECORD_V1",
      ...mutation.record,
      revision: existing === null ? 1 : existing.revision + 1,
    });
    const next = [...normalized];
    if (index < 0) next.push(committed); else next[index] = committed;
    return immutable({ records: normalizeRecordCollection(next), beforeRecord: existing, afterRecord: committed });
  }
  if (existing?.revision !== mutation.expectedRevision) {
    fail("record revision is stale", "STALE_WEIGHT_REVISION", { recordId: mutation.recordId });
  }
  return immutable({ records: normalized.filter((record) => record.id !== mutation.recordId), beforeRecord: existing, afterRecord: null });
}

function emptyState({ status = STATUSES.EDITING, records = [], draft = null } = {}) {
  const baselineRecords = normalizeRecordCollection(records);
  return immutable({
    status,
    baselineRecords,
    baselineSummary: summarizeBodyWeightRecords(baselineRecords),
    draft,
    validationError: null,
    preview: null,
    pendingCommand: null,
    pendingAttempt: null,
    pendingFingerprint: null,
    saveError: null,
    receipt: null,
    committedSummary: null,
  });
}

function assertState(state) {
  assertExactKeys(state, STATE_KEYS, [], "state", "INVALID_WEIGHT_STATE");
  assertSafeSerializable(state, "state");
  if (!Object.values(STATUSES).includes(state.status)) fail("weight state status is invalid", "INVALID_WEIGHT_STATE");
  const baselineRecords = normalizeRecordCollection(state.baselineRecords, "state.baselineRecords");
  const baselineSummary = summarizeBodyWeightRecords(baselineRecords);
  if (!isDeepStrictEqual(state.baselineRecords, baselineRecords) || !isDeepStrictEqual(state.baselineSummary, baselineSummary)) {
    fail("weight state baseline evidence is invalid", "INVALID_WEIGHT_STATE");
  }

  const requireNull = (keys) => {
    if (keys.some((key) => state[key] !== null)) fail("weight state contains stale phase evidence", "INVALID_WEIGHT_STATE");
  };
  const expectedReview = () => {
    const draft = normalizeMutationDraft(state.draft, "state.draft");
    const applied = applyMutation(baselineRecords, draft);
    return immutable({
      draft,
      preview: {
        beforeRecord: applied.beforeRecord,
        afterRecord: applied.afterRecord,
        beforeSummary: baselineSummary,
        afterSummary: summarizeBodyWeightRecords(applied.records),
      },
    });
  };

  if (state.status === STATUSES.EDITING) {
    requireNull(["preview", "pendingCommand", "pendingAttempt", "pendingFingerprint", "saveError", "receipt", "committedSummary"]);
    if (state.validationError !== null) {
      assertExactKeys(state.validationError, ["code", "field"], [], "state.validationError", "INVALID_WEIGHT_STATE");
      if (!ERROR_CODE.test(state.validationError.code) || (state.validationError.field !== null && !FIELD_PATH.test(state.validationError.field))) {
        fail("weight validation error is invalid", "INVALID_WEIGHT_STATE");
      }
    }
    return state;
  }

  if ([STATUSES.REVIEW_READY, STATUSES.SAVING, STATUSES.SAVE_FAILED].includes(state.status)) {
    if (state.validationError !== null || state.receipt !== null || state.committedSummary !== null) {
      fail("unfinished weight state contains contradictory evidence", "INVALID_WEIGHT_STATE");
    }
    const expected = expectedReview();
    if (!isDeepStrictEqual(state.draft, expected.draft) || !isDeepStrictEqual(state.preview, expected.preview)) {
      fail("weight review evidence is not derived from its baseline and draft", "INVALID_WEIGHT_STATE");
    }
    if (state.status === STATUSES.REVIEW_READY) {
      requireNull(["pendingCommand", "pendingAttempt", "pendingFingerprint", "saveError"]);
      return state;
    }
    assertExactKeys(state.pendingCommand, ["commandId", "mutation"], [], "state.pendingCommand", "INVALID_WEIGHT_STATE");
    const normalizedCommand = immutable({
      commandId: normalizeIdentifier(state.pendingCommand.commandId, "state.pendingCommand.commandId"),
      mutation: normalizeMutationDraft(state.pendingCommand.mutation, "state.pendingCommand.mutation"),
    });
    if (
      !isDeepStrictEqual(state.pendingCommand, normalizedCommand) ||
      !isDeepStrictEqual(state.pendingCommand.mutation, expected.draft) ||
      state.pendingFingerprint !== fingerprint(normalizedCommand) ||
      !Number.isSafeInteger(state.pendingAttempt) ||
      state.pendingAttempt < 1
    ) {
      fail("pending weight command is not bound to its reviewed state", "INVALID_WEIGHT_STATE");
    }
    if (state.status === STATUSES.SAVING && state.saveError !== null) {
      fail("saving weight state contains a stale error", "INVALID_WEIGHT_STATE");
    }
    if (state.status === STATUSES.SAVE_FAILED) {
      assertExactKeys(state.saveError, ["outcome", "code"], [], "state.saveError", "INVALID_WEIGHT_STATE");
      if (!["NOT_COMMITTED", "UNKNOWN"].includes(state.saveError.outcome) || !ERROR_CODE.test(state.saveError.code)) {
        fail("weight save error is invalid", "INVALID_WEIGHT_STATE");
      }
    }
    return state;
  }

  requireNull(["validationError", "pendingCommand", "pendingAttempt", "pendingFingerprint", "saveError"]);
  if (state.draft === null || state.preview === null || state.receipt === null || state.committedSummary === null) {
    fail("saved weight state is incomplete", "INVALID_WEIGHT_STATE");
  }
  const savedDraft = normalizeMutationDraft(state.draft, "state.draft");
  assertExactKeys(state.receipt, ["schemaVersion", "commandId", "fingerprint", "disposition", "mutationKind", "beforeRecord", "afterRecord", "records", "recordsFingerprint"], [], "state.receipt", "INVALID_WEIGHT_STATE");
  const savedBeforeSummary = summarizeBodyWeightRecords(state.preview?.beforeSummary?.points);
  const savedApplied = applyMutation(savedBeforeSummary.points, savedDraft);
  if (
    state.receipt.schemaVersion !== "BODY_WEIGHT_MUTATION_RECEIPT_V1" ||
    !["COMMITTED", "REPLAYED"].includes(state.receipt.disposition) ||
    !Object.values(MUTATIONS).includes(state.receipt.mutationKind) ||
    state.receipt.mutationKind !== savedDraft.kind ||
    state.receipt.commandId !== normalizeIdentifier(state.receipt.commandId, "state.receipt.commandId") ||
    state.receipt.fingerprint !== fingerprint({ commandId: state.receipt.commandId, mutation: savedDraft }) ||
    state.receipt.recordsFingerprint !== fingerprint(baselineRecords) ||
    !isDeepStrictEqual(state.receipt.records, baselineRecords) ||
    !isDeepStrictEqual(state.committedSummary, baselineSummary) ||
    !isDeepStrictEqual(state.preview?.beforeSummary, savedBeforeSummary) ||
    !isDeepStrictEqual(state.preview?.afterSummary, baselineSummary) ||
    !isDeepStrictEqual(savedApplied.records, baselineRecords) ||
    !isDeepStrictEqual(savedApplied.beforeRecord, state.receipt.beforeRecord) ||
    !isDeepStrictEqual(savedApplied.afterRecord, state.receipt.afterRecord) ||
    !isDeepStrictEqual(state.preview?.beforeRecord, savedApplied.beforeRecord) ||
    !isDeepStrictEqual(state.preview?.afterRecord, savedApplied.afterRecord)
  ) {
    fail("saved weight evidence is invalid", "INVALID_WEIGHT_STATE");
  }
  return state;
}

function createBodyWeightEntryState({ records = [], draft = null } = {}) {
  if (draft !== null) assertSafeSerializable(draft, "draft");
  return emptyState({ records, draft: draft === null ? null : clone(draft) });
}

function editBodyWeightDraft(state, draft) {
  assertState(state);
  if (state.status === STATUSES.SAVING || state.status === STATUSES.SAVED) fail("draft cannot be edited now", "INVALID_TRANSITION");
  if (state.status === STATUSES.SAVE_FAILED && state.saveError?.outcome === "UNKNOWN") {
    fail("unknown commit must be reconciled before editing", "COMMIT_OUTCOME_UNKNOWN");
  }
  assertSafeSerializable(draft, "draft");
  return emptyState({ records: state.baselineRecords, draft: clone(draft) });
}

function reviewBodyWeightMutation(state) {
  assertState(state);
  if (state.status !== STATUSES.EDITING) fail("only an editing draft can be reviewed", "INVALID_TRANSITION");
  try {
    const draft = normalizeMutationDraft(state.draft);
    const applied = applyMutation(state.baselineRecords, draft);
    const preview = immutable({
      beforeRecord: applied.beforeRecord,
      afterRecord: applied.afterRecord,
      beforeSummary: summarizeBodyWeightRecords(state.baselineRecords),
      afterSummary: summarizeBodyWeightRecords(applied.records),
    });
    return immutable({ ...emptyState({ status: STATUSES.REVIEW_READY, records: state.baselineRecords, draft }), preview });
  } catch (error) {
    return immutable({
      ...emptyState({ records: state.baselineRecords, draft: state.draft }),
      validationError: { code: error.code ?? "INVALID_WEIGHT_MUTATION", field: error.field ?? null },
    });
  }
}

function requestBodyWeightMutation(state, { commandId } = {}) {
  assertState(state);
  if (state.status === STATUSES.SAVING) return immutable({ state, effect: null });
  if (state.status !== STATUSES.REVIEW_READY) fail("only a reviewed mutation can be saved", "INVALID_TRANSITION");
  const command = immutable({
    commandId: normalizeIdentifier(commandId, "commandId"),
    mutation: normalizeMutationDraft(state.draft),
  });
  const commandFingerprint = fingerprint(command);
  const saving = immutable({
    ...emptyState({ status: STATUSES.SAVING, records: state.baselineRecords, draft: state.draft }),
    preview: state.preview,
    pendingCommand: command,
    pendingAttempt: 1,
    pendingFingerprint: commandFingerprint,
  });
  return immutable({
    state: saving,
    effect: { type: "APPLY_BODY_WEIGHT_MUTATION", command, attempt: 1, fingerprint: commandFingerprint },
  });
}

function retryBodyWeightMutation(state) {
  assertState(state);
  if (state.status !== STATUSES.SAVE_FAILED || state.pendingCommand === null) fail("no failed mutation can be retried", "INVALID_TRANSITION");
  const attempt = state.pendingAttempt + 1;
  const saving = immutable({ ...state, status: STATUSES.SAVING, pendingAttempt: attempt, saveError: null });
  return immutable({
    state: saving,
    effect: { type: "APPLY_BODY_WEIGHT_MUTATION", command: state.pendingCommand, attempt, fingerprint: state.pendingFingerprint },
  });
}

function normalizeEffect(effect) {
  assertExactKeys(effect, ["type", "command", "attempt", "fingerprint"], [], "effect", "INVALID_WEIGHT_EFFECT");
  if (effect.type !== "APPLY_BODY_WEIGHT_MUTATION" || !Number.isSafeInteger(effect.attempt) || effect.attempt < 1) {
    fail("body weight effect is invalid", "INVALID_WEIGHT_EFFECT");
  }
  const command = immutable({
    commandId: normalizeIdentifier(effect.command?.commandId, "effect.command.commandId"),
    mutation: normalizeMutationDraft(effect.command?.mutation, "effect.command.mutation"),
  });
  if (fingerprint(command) !== effect.fingerprint) fail("effect fingerprint is invalid", "INVALID_WEIGHT_EFFECT");
  return immutable({ type: effect.type, command, attempt: effect.attempt, fingerprint: effect.fingerprint });
}

function createReceipt(effect, disposition, applied) {
  return immutable({
    schemaVersion: "BODY_WEIGHT_MUTATION_RECEIPT_V1",
    commandId: effect.command.commandId,
    fingerprint: effect.fingerprint,
    disposition,
    mutationKind: effect.command.mutation.kind,
    beforeRecord: applied.beforeRecord,
    afterRecord: applied.afterRecord,
    records: applied.records,
    recordsFingerprint: fingerprint(applied.records),
  });
}

function createInMemoryBodyWeightRepository({ records = [], failurePlan = [] } = {}) {
  if (!Array.isArray(failurePlan) || failurePlan.some((failure) => !["BEFORE_COMMIT", "AFTER_COMMIT"].includes(failure))) {
    fail("repository failure plan is invalid", "INVALID_REPOSITORY");
  }
  let stored = normalizeRecordCollection(records);
  const idempotency = new Map();
  const failures = [...failurePlan];
  let calls = 0;
  let chain = Promise.resolve();

  async function apply(effectInput) {
    const effect = normalizeEffect(effectInput);
    calls += 1;
    const prior = idempotency.get(effect.command.commandId);
    if (prior) {
      if (prior.fingerprint !== effect.fingerprint) {
        return immutable({ status: "FAILURE", outcome: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "IDEMPOTENCY_CONFLICT" } });
      }
      const applied = immutable({ beforeRecord: prior.beforeRecord, afterRecord: prior.afterRecord, records: prior.records });
      return immutable({ status: "SUCCESS", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, receipt: createReceipt(effect, "REPLAYED", applied) });
    }
    const failure = failures.shift() ?? null;
    if (failure === "BEFORE_COMMIT") {
      return immutable({ status: "FAILURE", outcome: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "REPOSITORY_UNAVAILABLE" } });
    }
    let applied;
    try {
      applied = applyMutation(stored, effect.command.mutation);
    } catch (error) {
      return immutable({ status: "FAILURE", outcome: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: error.code ?? "MUTATION_REJECTED" } });
    }
    stored = applied.records;
    idempotency.set(effect.command.commandId, immutable({
      fingerprint: effect.fingerprint,
      beforeRecord: applied.beforeRecord,
      afterRecord: applied.afterRecord,
      records: applied.records,
    }));
    if (failure === "AFTER_COMMIT") {
      return immutable({ status: "FAILURE", outcome: "UNKNOWN", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "RESPONSE_LOST" } });
    }
    return immutable({ status: "SUCCESS", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, receipt: createReceipt(effect, "COMMITTED", applied) });
  }

  return Object.freeze({
    execute(effect) {
      const run = chain.then(() => apply(effect));
      chain = run.catch(() => undefined);
      return run;
    },
    snapshot() {
      return immutable({ records: stored, idempotency: [...idempotency.entries()].map(([commandId, value]) => ({ commandId, ...value })), calls });
    },
  });
}

async function executeBodyWeightMutation(repository, effect) {
  if (!repository || typeof repository.execute !== "function") fail("repository is invalid", "INVALID_REPOSITORY");
  try {
    return await repository.execute(normalizeEffect(effect));
  } catch {
    const normalized = normalizeEffect(effect);
    return immutable({ status: "FAILURE", outcome: "UNKNOWN", commandId: normalized.command.commandId, fingerprint: normalized.fingerprint, attempt: normalized.attempt, error: { code: "UNEXPECTED_REPOSITORY_ERROR" } });
  }
}

function validateOutcomeBinding(state, outcome) {
  assertPlainRecord(outcome, "outcome", "INVALID_WEIGHT_OUTCOME");
  if (outcome.status === "SUCCESS") {
    assertExactKeys(outcome, ["status", "commandId", "fingerprint", "attempt", "receipt"], [], "outcome", "INVALID_WEIGHT_OUTCOME");
  } else if (outcome.status === "FAILURE") {
    assertExactKeys(outcome, ["status", "outcome", "commandId", "fingerprint", "attempt", "error"], [], "outcome", "INVALID_WEIGHT_OUTCOME");
    if (!["NOT_COMMITTED", "UNKNOWN"].includes(outcome.outcome)) fail("weight failure outcome is invalid", "INVALID_WEIGHT_OUTCOME");
    assertExactKeys(outcome.error, ["code"], [], "outcome.error", "INVALID_WEIGHT_OUTCOME");
    normalizeErrorCode(outcome.error.code, "outcome.error.code");
  } else {
    fail("weight outcome status is invalid", "INVALID_WEIGHT_OUTCOME");
  }
  if (outcome.commandId !== state.pendingCommand.commandId || outcome.fingerprint !== state.pendingFingerprint || outcome.attempt !== state.pendingAttempt) {
    fail("weight outcome is stale or unrelated", "STALE_WEIGHT_OUTCOME");
  }
}

function validateReceipt(receipt, state) {
  assertExactKeys(receipt, ["schemaVersion", "commandId", "fingerprint", "disposition", "mutationKind", "beforeRecord", "afterRecord", "records", "recordsFingerprint"], [], "receipt", "INVALID_WEIGHT_RECEIPT");
  if (receipt.schemaVersion !== "BODY_WEIGHT_MUTATION_RECEIPT_V1" || !["COMMITTED", "REPLAYED"].includes(receipt.disposition)) {
    fail("weight receipt is invalid", "INVALID_WEIGHT_RECEIPT");
  }
  if (!SHA256.test(receipt.fingerprint) || !SHA256.test(receipt.recordsFingerprint)) fail("weight receipt fingerprint is invalid", "INVALID_WEIGHT_RECEIPT");
  if (receipt.commandId !== state.pendingCommand.commandId || receipt.fingerprint !== state.pendingFingerprint || receipt.mutationKind !== state.pendingCommand.mutation.kind) {
    fail("weight receipt binding is invalid", "INVALID_WEIGHT_RECEIPT");
  }
  const records = normalizeRecordCollection(receipt.records, "receipt.records");
  if (fingerprint(records) !== receipt.recordsFingerprint) fail("weight receipt evidence is invalid", "INVALID_WEIGHT_RECEIPT");
  const expected = applyMutation(state.baselineRecords, state.pendingCommand.mutation);
  if (
    !isDeepStrictEqual(records, expected.records) ||
    !isDeepStrictEqual(receipt.beforeRecord, expected.beforeRecord) ||
    !isDeepStrictEqual(receipt.afterRecord, expected.afterRecord)
  ) {
    fail("committed weight evidence does not match the complete transaction", "INVALID_WEIGHT_RECEIPT");
  }
  return immutable({ ...receipt, records });
}

function settleBodyWeightMutation(state, outcome) {
  assertState(state);
  if (state.status !== STATUSES.SAVING || state.pendingCommand === null) fail("weight mutation is not saving", "INVALID_TRANSITION");
  validateOutcomeBinding(state, outcome);
  if (outcome.status === "SUCCESS") {
    try {
      const receipt = validateReceipt(outcome.receipt, state);
      return immutable({
        ...emptyState({ status: STATUSES.SAVED, records: receipt.records, draft: state.draft }),
        preview: state.preview,
        receipt,
        committedSummary: summarizeBodyWeightRecords(receipt.records),
      });
    } catch (error) {
      const code = typeof error?.code === "string" && ERROR_CODE.test(error.code) ? error.code : "INVALID_WEIGHT_RECEIPT";
      return immutable({ ...state, status: STATUSES.SAVE_FAILED, saveError: { outcome: "UNKNOWN", code } });
    }
  }
  return immutable({ ...state, status: STATUSES.SAVE_FAILED, saveError: { outcome: outcome.outcome, code: outcome.error.code } });
}

export {
  MUTATIONS,
  STATUSES,
  UNITS,
  createBodyWeightEntryState,
  createInMemoryBodyWeightRepository,
  editBodyWeightDraft,
  executeBodyWeightMutation,
  normalizeBodyWeightRecord,
  requestBodyWeightMutation,
  retryBodyWeightMutation,
  reviewBodyWeightMutation,
  settleBodyWeightMutation,
  summarizeBodyWeightRecords,
};
