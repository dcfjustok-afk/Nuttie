import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { dailyNutritionSummary } from "./domain-contract-harness.mjs";

const MACROS = Object.freeze(["protein", "carbohydrate", "fat"]);
const NUTRIENT_FIELDS = Object.freeze({
  protein: "proteinG",
  carbohydrate: "carbohydrateG",
  fat: "fatG",
});
const TARGET_STATUSES = Object.freeze({ UNSET: "UNSET", SET: "SET" });
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/;
const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_VERSIONS = 4096;
const MAX_RANGE_DAYS = 36600;
const MAX_DEFINITION_BYTES = 32768;
const MAX_DEFINITION_NODES = 1024;
const MAX_DEFINITION_DEPTH = 16;

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
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_MACRO_TARGET_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) fail(`${field} is not safely serializable`, "INVALID_MACRO_TARGET_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) value.forEach((child, index) => serializable(child, `${field}[${index}]`, seen));
  else {
    assertPlainRecord(value, field, "INVALID_MACRO_TARGET_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_MACRO_TARGET_VALUE", { field: `${field}.${key}` });
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

function identifier(value, field, code = "INVALID_MACRO_TARGET_VALUE") {
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
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) fail(`${field} is not a Gregorian calendar date`, "INVALID_LOCAL_DATE", { field });
  return value;
}

function shiftDate(value, deltaDays) {
  const normalized = localDate(value);
  if (!Number.isSafeInteger(deltaDays)) fail("date delta must be a safe integer", "INVALID_MACRO_TARGET_QUERY");
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day + deltaDays);
  const nextYear = date.getUTCFullYear();
  if (nextYear < 1 || nextYear > 9999) fail("date shift exceeds the contract calendar range", "INVALID_MACRO_TARGET_QUERY");
  return `${String(nextYear).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function epochDay(value) {
  const [year, month, day] = localDate(value).split("-").map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return Math.trunc(date.valueOf() / 86400000);
}

function instant(value, field) {
  const match = typeof value === "string" ? INSTANT.exec(value) : null;
  if (!match || !Number.isFinite(Date.parse(value))) fail(`${field} must be an ISO instant with explicit offset`, "INVALID_MACRO_TARGET_VERSION", { field });
  const [, year, month, day, hour, minute, second, , zone, , offsetHour, offsetMinute] = match;
  localDate(`${year}-${month}-${day}`, field);
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 || (zone !== "Z" && (Number(offsetHour) > 23 || Number(offsetMinute) > 59))) {
    fail(`${field} is not a real instant`, "INVALID_MACRO_TARGET_VERSION", { field });
  }
  return value;
}

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function fraction(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  return immutable({ numerator: String(numerator / divisor), denominator: String(denominator / divisor) });
}

function exactDecimal(value, field) {
  if (typeof value !== "string" || value !== value.trim() || !DECIMAL.test(value)) fail(`${field} must be an unsigned decimal string`, "INVALID_MACRO_TARGET_VALUE", { field });
  if (value.replace(".", "").length > 24) fail(`${field} exceeds the contract resource budget`, "MACRO_TARGET_VALUE_TOO_LARGE", { field });
  const [whole, decimals = ""] = value.split(".");
  return fraction(BigInt(`${whole}${decimals}`), 10n ** BigInt(decimals.length));
}

function validateDefinitionPayload(value, field, depth = 0, budget = { nodes: 0 }) {
  budget.nodes += 1;
  if (budget.nodes > MAX_DEFINITION_NODES || depth > MAX_DEFINITION_DEPTH) fail(`${field} exceeds the unit definition resource budget`, "INVALID_MACRO_TARGET_UNIT", { field });
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > 4096) fail(`${field} is too long`, "INVALID_MACRO_TARGET_UNIT", { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_MACRO_TARGET_UNIT", { field });
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 256) fail(`${field} is too large`, "INVALID_MACRO_TARGET_UNIT", { field });
    value.forEach((child, index) => validateDefinitionPayload(child, `${field}[${index}]`, depth + 1, budget));
    return;
  }
  assertPlainRecord(value, field, "INVALID_MACRO_TARGET_UNIT");
  if (Object.keys(value).length > 128) fail(`${field} has too many fields`, "INVALID_MACRO_TARGET_UNIT", { field });
  for (const [key, child] of Object.entries(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_MACRO_TARGET_UNIT", { field: `${field}.${key}` });
    validateDefinitionPayload(child, `${field}.${key}`, depth + 1, budget);
  }
}

function normalizeUnitDefinition(input, field) {
  assertExactKeys(input, ["schemaVersion", "unitDefinitionId", "unitDefinitionVersion", "payload"], [], field, "INVALID_MACRO_TARGET_UNIT");
  if (input.schemaVersion !== "MACRO_TARGET_UNIT_DEFINITION_V1") fail(`${field}.schemaVersion is invalid`, "INVALID_MACRO_TARGET_UNIT", { field: `${field}.schemaVersion` });
  assertPlainRecord(input.payload, `${field}.payload`, "INVALID_MACRO_TARGET_UNIT");
  validateDefinitionPayload(input.payload, `${field}.payload`);
  if (Buffer.byteLength(canonicalStringify(input.payload), "utf8") > MAX_DEFINITION_BYTES) fail(`${field}.payload is too large`, "INVALID_MACRO_TARGET_UNIT", { field: `${field}.payload` });
  return immutable({
    schemaVersion: "MACRO_TARGET_UNIT_DEFINITION_V1",
    unitDefinitionId: identifier(input.unitDefinitionId, `${field}.unitDefinitionId`, "INVALID_MACRO_TARGET_UNIT"),
    unitDefinitionVersion: identifier(input.unitDefinitionVersion, `${field}.unitDefinitionVersion`, "INVALID_MACRO_TARGET_UNIT"),
    payload: input.payload,
  });
}

function normalizeTargetFact(input, field) {
  assertPlainRecord(input, field, "INVALID_MACRO_TARGET_FACT");
  if (input.status === TARGET_STATUSES.UNSET) {
    assertExactKeys(input, ["status"], [], field, "INVALID_MACRO_TARGET_FACT");
    return immutable({ status: TARGET_STATUSES.UNSET });
  }
  if (input.status !== TARGET_STATUSES.SET) fail(`${field}.status is unsupported`, "INVALID_MACRO_TARGET_FACT", { field: `${field}.status` });
  assertExactKeys(input, ["status", "inputValue", "unitDefinition"], ["exactValue"], field, "INVALID_MACRO_TARGET_FACT");
  const normalized = immutable({
    status: TARGET_STATUSES.SET,
    inputValue: input.inputValue,
    unitDefinition: normalizeUnitDefinition(input.unitDefinition, `${field}.unitDefinition`),
    exactValue: exactDecimal(input.inputValue, `${field}.inputValue`),
  });
  if (Object.hasOwn(input, "exactValue") && !isDeepStrictEqual(input, normalized)) fail(`${field} derived exact value is invalid`, "INVALID_MACRO_TARGET_FACT", { field });
  return normalized;
}

function normalizeTargets(input, field = "targets") {
  assertExactKeys(input, MACROS, [], field, "INVALID_MACRO_TARGET_SET");
  return immutable(Object.fromEntries(MACROS.map((macro) => [macro, normalizeTargetFact(input[macro], `${field}.${macro}`)])));
}

function normalizeSource(input, field = "source") {
  assertExactKeys(input, ["sourceKind", "sourceId", "sourceVersion", "ruleId", "ruleVersion", "userEdited"], [], field, "INVALID_MACRO_TARGET_SOURCE");
  if (typeof input.userEdited !== "boolean") fail(`${field}.userEdited must be boolean`, "INVALID_MACRO_TARGET_SOURCE", { field: `${field}.userEdited` });
  const ruleIsNull = input.ruleId === null && input.ruleVersion === null;
  const ruleIsPresent = input.ruleId !== null && input.ruleVersion !== null;
  if (!ruleIsNull && !ruleIsPresent) fail("rule ID and version must both be present or both be null", "INVALID_MACRO_TARGET_SOURCE", { field });
  return immutable({
    sourceKind: identifier(input.sourceKind, `${field}.sourceKind`, "INVALID_MACRO_TARGET_SOURCE"),
    sourceId: identifier(input.sourceId, `${field}.sourceId`, "INVALID_MACRO_TARGET_SOURCE"),
    sourceVersion: identifier(input.sourceVersion, `${field}.sourceVersion`, "INVALID_MACRO_TARGET_SOURCE"),
    ruleId: ruleIsNull ? null : identifier(input.ruleId, `${field}.ruleId`, "INVALID_MACRO_TARGET_SOURCE"),
    ruleVersion: ruleIsNull ? null : identifier(input.ruleVersion, `${field}.ruleVersion`, "INVALID_MACRO_TARGET_SOURCE"),
    userEdited: input.userEdited,
  });
}

function normalizeMacroTargetVersion(input, field = "version") {
  assertExactKeys(input, ["schemaVersion", "versionId", "effectiveFrom", "generatedAt", "source", "targets"], [], field, "INVALID_MACRO_TARGET_VERSION");
  if (input.schemaVersion !== "MACRO_TARGET_VERSION_V1") fail(`${field}.schemaVersion is invalid`, "INVALID_MACRO_TARGET_VERSION", { field: `${field}.schemaVersion` });
  return immutable({
    schemaVersion: "MACRO_TARGET_VERSION_V1",
    versionId: identifier(input.versionId, `${field}.versionId`, "INVALID_MACRO_TARGET_VERSION"),
    effectiveFrom: localDate(input.effectiveFrom, `${field}.effectiveFrom`),
    generatedAt: instant(input.generatedAt, `${field}.generatedAt`),
    source: normalizeSource(input.source, `${field}.source`),
    targets: normalizeTargets(input.targets, `${field}.targets`),
  });
}

function normalizeVersions(input, field = "versions") {
  if (!Array.isArray(input) || input.length > MAX_VERSIONS) fail(`${field} must be a bounded array`, "INVALID_MACRO_TARGET_HISTORY", { field });
  const versions = input.map((version, index) => normalizeMacroTargetVersion(version, `${field}[${index}]`));
  const ids = new Set();
  const effectiveDates = new Set();
  const unitDefinitions = new Map();
  for (const version of versions) {
    if (ids.has(version.versionId)) fail("macro target version IDs must be unique", "DUPLICATE_MACRO_TARGET_VERSION", { versionId: version.versionId });
    if (effectiveDates.has(version.effectiveFrom)) fail("macro target effective dates must be unique", "AMBIGUOUS_MACRO_TARGET_EFFECTIVE_DATE", { effectiveFrom: version.effectiveFrom });
    ids.add(version.versionId);
    effectiveDates.add(version.effectiveFrom);
    for (const macro of MACROS) {
      const target = version.targets[macro];
      if (target.status !== TARGET_STATUSES.SET) continue;
      const definition = target.unitDefinition;
      const identity = `${definition.unitDefinitionId}\u0000${definition.unitDefinitionVersion}`;
      const evidence = fingerprint(definition);
      if (unitDefinitions.has(identity) && unitDefinitions.get(identity) !== evidence) {
        fail("one macro target unit definition identity cannot have conflicting payloads", "MACRO_TARGET_UNIT_DEFINITION_CONFLICT", {
          unitDefinitionId: definition.unitDefinitionId,
          unitDefinitionVersion: definition.unitDefinitionVersion,
        });
      }
      unitDefinitions.set(identity, evidence);
    }
  }
  return versions.sort((left, right) => left.effectiveFrom < right.effectiveFrom ? -1 : left.effectiveFrom > right.effectiveFrom ? 1 : 0);
}

function targetSetStatus(targets) {
  const setCount = MACROS.filter((macro) => targets[macro].status === TARGET_STATUSES.SET).length;
  return setCount === 0 ? "NO_TARGETS_SET" : setCount === MACROS.length ? "ALL_TARGETS_SET" : "PARTIALLY_SET";
}

function effectiveVersion(versions, date) {
  let selected = null;
  for (const version of versions) {
    if (version.effectiveFrom > date) break;
    selected = version;
  }
  return selected;
}

function segmentFor(version, startLocalDate, endLocalDate) {
  if (version === null) return immutable({
    startLocalDate,
    endLocalDate,
    status: "NO_EFFECTIVE_VERSION",
    effectiveVersion: null,
  });
  return immutable({
    startLocalDate,
    endLocalDate,
    status: targetSetStatus(version.targets),
    effectiveVersion: version,
  });
}

function buildMacroTargetHistory({ versions: versionsInput, startLocalDate: startInput, endLocalDate: endInput }) {
  const startLocalDate = localDate(startInput, "startLocalDate");
  const endLocalDate = localDate(endInput, "endLocalDate");
  if (endLocalDate < startLocalDate) fail("macro target query range is reversed", "INVALID_MACRO_TARGET_QUERY");
  const rangeDays = epochDay(endLocalDate) - epochDay(startLocalDate) + 1;
  if (!Number.isSafeInteger(rangeDays) || rangeDays < 1 || rangeDays > MAX_RANGE_DAYS) fail("macro target query exceeds the contract range budget", "MACRO_TARGET_QUERY_TOO_LARGE");
  const versions = normalizeVersions(versionsInput);
  const boundaryDates = [startLocalDate, ...versions
    .map((version) => version.effectiveFrom)
    .filter((date) => date > startLocalDate && date <= endLocalDate)];
  const segments = boundaryDates.map((segmentStart, index) => {
    const nextBoundary = boundaryDates[index + 1] ?? null;
    const segmentEnd = nextBoundary === null ? endLocalDate : shiftDate(nextBoundary, -1);
    return segmentFor(effectiveVersion(versions, segmentStart), segmentStart, segmentEnd);
  });
  return immutable({
    schemaVersion: "MACRO_TARGET_HISTORY_V1",
    query: { startLocalDate, endLocalDate, dayCount: rangeDays },
    versions,
    versionsFingerprint: fingerprint(versions),
    segments,
  });
}

function validateMacroTargetHistory(input, field = "history") {
  assertExactKeys(input, ["schemaVersion", "query", "versions", "versionsFingerprint", "segments"], [], field, "INVALID_MACRO_TARGET_HISTORY");
  if (input.schemaVersion !== "MACRO_TARGET_HISTORY_V1" || !SHA256.test(input.versionsFingerprint)) fail(`${field} version or fingerprint is invalid`, "INVALID_MACRO_TARGET_HISTORY", { field });
  assertExactKeys(input.query, ["startLocalDate", "endLocalDate", "dayCount"], [], `${field}.query`, "INVALID_MACRO_TARGET_HISTORY");
  let expected;
  try {
    expected = buildMacroTargetHistory({
      versions: input.versions,
      startLocalDate: input.query.startLocalDate,
      endLocalDate: input.query.endLocalDate,
    });
  } catch (error) {
    fail(`${field} cannot be rebuilt as valid history evidence`, "INVALID_MACRO_TARGET_HISTORY", {
      field,
      causeCode: error?.code ?? "UNKNOWN",
    });
  }
  if (!isDeepStrictEqual(input, expected)) fail(`${field} contains invalid derived history evidence`, "INVALID_MACRO_TARGET_HISTORY", { field });
  return expected;
}

function actualMacroFact(summary, macro) {
  const field = NUTRIENT_FIELDS[macro];
  return immutable({
    status: summary.completeness[field],
    valueGrams: summary.values[field],
    factQuality: summary.factQuality[field],
  });
}

function buildMacroActualTargetView({ localDate: dateInput, meals, targetVersions }) {
  const date = localDate(dateInput);
  const summary = dailyNutritionSummary({ localDate: date, meals });
  const history = buildMacroTargetHistory({ versions: targetVersions, startLocalDate: date, endLocalDate: date });
  return immutable({
    schemaVersion: "MACRO_ACTUAL_TARGET_VIEW_V1",
    localDate: date,
    actual: {
      mealCount: summary.mealCount,
      macros: Object.fromEntries(MACROS.map((macro) => [macro, actualMacroFact(summary, macro)])),
      sources: summary.sources,
    },
    target: history.segments[0],
    targetVersionsFingerprint: history.versionsFingerprint,
    comparisonPolicy: "UNSPECIFIED",
    roundingPolicy: "UNSPECIFIED",
  });
}

export {
  MACROS,
  TARGET_STATUSES,
  buildMacroActualTargetView,
  buildMacroTargetHistory,
  normalizeMacroTargetVersion,
  validateMacroTargetHistory,
};
