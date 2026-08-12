import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const RELATIONS = Object.freeze({ PAST: "PAST", TODAY: "TODAY", FUTURE: "FUTURE" });
const DISPOSITIONS = Object.freeze({ ALLOW: "ALLOW", DENY: "DENY" });
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const TIME_ZONE_ID = /^[A-Za-z0-9][A-Za-z0-9._+\/-]{0,127}$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/;
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
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_DATE_NAVIGATION_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) fail(`${field} is not safely serializable`, "INVALID_DATE_NAVIGATION_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) value.forEach((child, index) => serializable(child, `${field}[${index}]`, seen));
  else {
    assertPlainRecord(value, field, "INVALID_DATE_NAVIGATION_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_DATE_NAVIGATION_VALUE", { field: `${field}.${key}` });
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

function identifier(value, field, code = "INVALID_DATE_NAVIGATION_VALUE") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
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
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    fail(`${field} is not a Gregorian calendar date`, "INVALID_LOCAL_DATE", { field });
  }
  return value;
}

function shiftLocalDate(value, deltaDays) {
  const normalized = localDate(value);
  if (!Number.isSafeInteger(deltaDays) || Math.abs(deltaDays) > 3_000_000) fail("deltaDays must be an explicit bounded safe integer", "INVALID_DATE_DELTA", { field: "deltaDays" });
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day + deltaDays);
  const shiftedYear = date.getUTCFullYear();
  if (shiftedYear < 1 || shiftedYear > 9999) fail("shifted date is outside the contract calendar range", "DATE_DELTA_OUT_OF_RANGE");
  return `${String(shiftedYear).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function relationToToday(selectedLocalDate, todayLocalDate) {
  const selected = localDate(selectedLocalDate, "selectedLocalDate");
  const today = localDate(todayLocalDate, "todayLocalDate");
  return selected < today ? RELATIONS.PAST : selected > today ? RELATIONS.FUTURE : RELATIONS.TODAY;
}

function normalizeOffset(zone, sign, hourText, minuteText, field) {
  if (zone === "Z") return "+00:00";
  const hours = Number(hourText);
  const minutes = Number(minuteText);
  if (hours > 23 || minutes > 59) fail(`${field} has an invalid UTC offset`, "INVALID_DATE_OBSERVATION", { field });
  return `${sign}${hourText}:${minuteText}`;
}

function normalizeInstant(value, field) {
  const match = typeof value === "string" ? INSTANT.exec(value) : null;
  if (!match || !Number.isFinite(Date.parse(value))) fail(`${field} must be a valid ISO instant with an explicit offset`, "INVALID_DATE_OBSERVATION", { field });
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone, sign, offsetHour, offsetMinute] = match;
  localDate(`${yearText}-${monthText}-${dayText}`, field);
  if (Number(hourText) > 23 || Number(minuteText) > 59 || Number(secondText) > 59) fail(`${field} is not a real wall-clock timestamp`, "INVALID_DATE_OBSERVATION", { field });
  return immutable({
    value,
    wallDateTime: `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}`,
    offset: normalizeOffset(zone, sign, offsetHour, offsetMinute, field),
    epochMilliseconds: Date.parse(value),
  });
}

function resolveZonedInstant(epochMilliseconds, timeZoneId, field) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      calendar: "gregory",
      numberingSystem: "latn",
      timeZone: timeZoneId,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "longOffset",
    }).formatToParts(new Date(epochMilliseconds));
  } catch (error) {
    fail(`${field} is not a supported IANA time-zone identifier`, "INVALID_DATE_OBSERVATION", { field, cause: error });
  }
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zoneName = values.timeZoneName;
  const offset = zoneName === "GMT" ? "+00:00" : /^GMT([+-]\d{2}:\d{2})$/.exec(zoneName)?.[1];
  if (!offset) fail("runtime could not expose an explicit time-zone offset", "INVALID_DATE_OBSERVATION", { field });
  return immutable({
    wallDateTime: `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`,
    localDate: `${values.year}-${values.month}-${values.day}`,
    offset,
  });
}

function normalizeDateObservation(input, field = "observation") {
  assertExactKeys(input, [
    "schemaVersion",
    "generation",
    "observedAt",
    "timeZoneId",
    "timeZoneRulesVersion",
    "calendarId",
    "todayLocalDate",
  ], [], field, "INVALID_DATE_OBSERVATION");
  if (input.schemaVersion !== "DATE_OBSERVATION_V1" || !Number.isSafeInteger(input.generation) || input.generation < 0) {
    fail(`${field} version or generation is invalid`, "INVALID_DATE_OBSERVATION", { field });
  }
  if (input.calendarId !== "gregory") fail(`${field}.calendarId must be explicit Gregorian`, "INVALID_DATE_OBSERVATION", { field: `${field}.calendarId` });
  if (typeof input.timeZoneId !== "string" || !TIME_ZONE_ID.test(input.timeZoneId)) fail(`${field}.timeZoneId is invalid`, "INVALID_DATE_OBSERVATION", { field: `${field}.timeZoneId` });
  const observedAt = normalizeInstant(input.observedAt, `${field}.observedAt`);
  const resolved = resolveZonedInstant(observedAt.epochMilliseconds, input.timeZoneId, `${field}.timeZoneId`);
  if (observedAt.wallDateTime !== resolved.wallDateTime || observedAt.offset !== resolved.offset) {
    fail(`${field}.observedAt does not match the supplied IANA time-zone context`, "DATE_OBSERVATION_ZONE_MISMATCH", { field: `${field}.observedAt` });
  }
  const todayLocalDate = localDate(input.todayLocalDate, `${field}.todayLocalDate`);
  if (todayLocalDate !== resolved.localDate) fail(`${field}.todayLocalDate does not match observedAt`, "DATE_OBSERVATION_DATE_MISMATCH", { field: `${field}.todayLocalDate` });
  return immutable({
    schemaVersion: "DATE_OBSERVATION_V1",
    generation: input.generation,
    observedAt: input.observedAt,
    timeZoneId: input.timeZoneId,
    timeZoneRulesVersion: identifier(input.timeZoneRulesVersion, `${field}.timeZoneRulesVersion`, "INVALID_DATE_OBSERVATION"),
    calendarId: "gregory",
    todayLocalDate,
  });
}

function fingerprintDateObservation(input) {
  return fingerprint(normalizeDateObservation(input));
}

function createDateNavigationState({ selectedLocalDate, observation }) {
  const normalizedObservation = normalizeDateObservation(observation);
  const selected = localDate(selectedLocalDate, "selectedLocalDate");
  return immutable({
    schemaVersion: "DATE_NAVIGATION_STATE_V1",
    selectedLocalDate: selected,
    selectedRelation: relationToToday(selected, normalizedObservation.todayLocalDate),
    observation: normalizedObservation,
    observationFingerprint: fingerprint(normalizedObservation),
  });
}

function normalizeDateNavigationState(input, field = "state") {
  assertExactKeys(input, ["schemaVersion", "selectedLocalDate", "selectedRelation", "observation", "observationFingerprint"], [], field, "INVALID_DATE_NAVIGATION_STATE");
  if (input.schemaVersion !== "DATE_NAVIGATION_STATE_V1" || typeof input.observationFingerprint !== "string" || !SHA256.test(input.observationFingerprint)) {
    fail(`${field} version or fingerprint is invalid`, "INVALID_DATE_NAVIGATION_STATE", { field });
  }
  const expected = createDateNavigationState({ selectedLocalDate: input.selectedLocalDate, observation: input.observation });
  if (!isDeepStrictEqual(input, expected)) fail(`${field} contains invalid derived date evidence`, "INVALID_DATE_NAVIGATION_STATE", { field });
  return expected;
}

function refreshDateObservation(stateInput, observationInput) {
  const beforeState = normalizeDateNavigationState(stateInput);
  const observation = normalizeDateObservation(observationInput);
  const beforeObservation = beforeState.observation;
  if (observation.generation < beforeObservation.generation) fail("date observation generation is stale", "STALE_DATE_OBSERVATION");
  if (observation.generation === beforeObservation.generation) {
    if (!isDeepStrictEqual(observation, beforeObservation)) fail("same date observation generation has conflicting content", "DATE_OBSERVATION_GENERATION_CONFLICT");
    return immutable({
      schemaVersion: "DATE_OBSERVATION_REFRESH_RESULT_V1",
      disposition: "UNCHANGED",
      beforeState,
      afterState: beforeState,
      selectionPreserved: true,
      observationContextChanged: false,
    });
  }
  const afterState = createDateNavigationState({ selectedLocalDate: beforeState.selectedLocalDate, observation });
  return immutable({
    schemaVersion: "DATE_OBSERVATION_REFRESH_RESULT_V1",
    disposition: "REFRESHED",
    beforeState,
    afterState,
    selectionPreserved: true,
    observationContextChanged: true,
  });
}

function createDateNavigationRequest({ requestId, state, targetLocalDate }) {
  const normalizedState = normalizeDateNavigationState(state);
  const core = immutable({
    schemaVersion: "DATE_NAVIGATION_REQUEST_V1",
    requestId: identifier(requestId, "requestId", "INVALID_DATE_NAVIGATION_REQUEST"),
    fromLocalDate: normalizedState.selectedLocalDate,
    targetLocalDate: localDate(targetLocalDate, "targetLocalDate"),
    observationGeneration: normalizedState.observation.generation,
    observationFingerprint: normalizedState.observationFingerprint,
  });
  return immutable({ ...core, requestFingerprint: fingerprint(core) });
}

function normalizeDateNavigationRequest(input, field = "request") {
  assertExactKeys(input, [
    "schemaVersion",
    "requestId",
    "fromLocalDate",
    "targetLocalDate",
    "observationGeneration",
    "observationFingerprint",
    "requestFingerprint",
  ], [], field, "INVALID_DATE_NAVIGATION_REQUEST");
  if (input.schemaVersion !== "DATE_NAVIGATION_REQUEST_V1" || !Number.isSafeInteger(input.observationGeneration) || input.observationGeneration < 0 || !SHA256.test(input.observationFingerprint) || !SHA256.test(input.requestFingerprint)) {
    fail(`${field} version, generation, or fingerprint is invalid`, "INVALID_DATE_NAVIGATION_REQUEST", { field });
  }
  const core = immutable({
    schemaVersion: "DATE_NAVIGATION_REQUEST_V1",
    requestId: identifier(input.requestId, `${field}.requestId`, "INVALID_DATE_NAVIGATION_REQUEST"),
    fromLocalDate: localDate(input.fromLocalDate, `${field}.fromLocalDate`),
    targetLocalDate: localDate(input.targetLocalDate, `${field}.targetLocalDate`),
    observationGeneration: input.observationGeneration,
    observationFingerprint: input.observationFingerprint,
  });
  const expected = immutable({ ...core, requestFingerprint: fingerprint(core) });
  if (!isDeepStrictEqual(input, expected)) fail(`${field} fingerprint is invalid`, "INVALID_DATE_NAVIGATION_REQUEST", { field });
  return expected;
}

function createDateNavigationPolicyDecision({ request, policyId, policyVersion, disposition, reasonCode }) {
  const normalizedRequest = normalizeDateNavigationRequest(request);
  if (!Object.values(DISPOSITIONS).includes(disposition)) fail("date navigation disposition is invalid", "INVALID_DATE_NAVIGATION_DECISION", { field: "disposition" });
  return immutable({
    schemaVersion: "DATE_NAVIGATION_POLICY_DECISION_V1",
    requestFingerprint: normalizedRequest.requestFingerprint,
    policyId: identifier(policyId, "policyId", "INVALID_DATE_NAVIGATION_DECISION"),
    policyVersion: identifier(policyVersion, "policyVersion", "INVALID_DATE_NAVIGATION_DECISION"),
    disposition,
    reasonCode: identifier(reasonCode, "reasonCode", "INVALID_DATE_NAVIGATION_DECISION"),
  });
}

function normalizeDateNavigationPolicyDecision(input, field = "decision") {
  assertExactKeys(input, ["schemaVersion", "requestFingerprint", "policyId", "policyVersion", "disposition", "reasonCode"], [], field, "INVALID_DATE_NAVIGATION_DECISION");
  if (input.schemaVersion !== "DATE_NAVIGATION_POLICY_DECISION_V1" || !SHA256.test(input.requestFingerprint) || !Object.values(DISPOSITIONS).includes(input.disposition)) {
    fail(`${field} version, fingerprint, or disposition is invalid`, "INVALID_DATE_NAVIGATION_DECISION", { field });
  }
  return immutable({
    schemaVersion: "DATE_NAVIGATION_POLICY_DECISION_V1",
    requestFingerprint: input.requestFingerprint,
    policyId: identifier(input.policyId, `${field}.policyId`, "INVALID_DATE_NAVIGATION_DECISION"),
    policyVersion: identifier(input.policyVersion, `${field}.policyVersion`, "INVALID_DATE_NAVIGATION_DECISION"),
    disposition: input.disposition,
    reasonCode: identifier(input.reasonCode, `${field}.reasonCode`, "INVALID_DATE_NAVIGATION_DECISION"),
  });
}

function applyDateNavigationDecision(stateInput, requestInput, decisionInput) {
  const beforeState = normalizeDateNavigationState(stateInput);
  const request = normalizeDateNavigationRequest(requestInput);
  const decision = normalizeDateNavigationPolicyDecision(decisionInput);
  if (request.requestFingerprint !== decision.requestFingerprint) fail("date navigation decision is bound to another request", "DATE_NAVIGATION_DECISION_MISMATCH");
  if (request.fromLocalDate !== beforeState.selectedLocalDate) fail("date navigation request starts from a stale selection", "STALE_DATE_NAVIGATION_REQUEST");
  if (request.observationGeneration !== beforeState.observation.generation || request.observationFingerprint !== beforeState.observationFingerprint) {
    fail("date navigation request uses a stale observation", "STALE_DATE_NAVIGATION_REQUEST");
  }
  const selectedLocalDate = decision.disposition === DISPOSITIONS.ALLOW ? request.targetLocalDate : beforeState.selectedLocalDate;
  const afterState = createDateNavigationState({ selectedLocalDate, observation: beforeState.observation });
  return immutable({
    schemaVersion: "DATE_NAVIGATION_RESULT_V1",
    disposition: decision.disposition === DISPOSITIONS.ALLOW ? "APPLIED" : "REJECTED_BY_POLICY",
    requestId: request.requestId,
    requestFingerprint: request.requestFingerprint,
    policy: {
      policyId: decision.policyId,
      policyVersion: decision.policyVersion,
      reasonCode: decision.reasonCode,
    },
    beforeState,
    afterState,
    selectedDateChanged: beforeState.selectedLocalDate !== afterState.selectedLocalDate,
    observationChanged: false,
  });
}

export {
  DISPOSITIONS,
  RELATIONS,
  applyDateNavigationDecision,
  createDateNavigationPolicyDecision,
  createDateNavigationRequest,
  createDateNavigationState,
  fingerprintDateObservation,
  normalizeDateObservation,
  refreshDateObservation,
  shiftLocalDate,
};
