import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { normalizeEnergyFact } from "./seven-day-energy-trend-harness.mjs";

const TARGET_STATUSES = Object.freeze({ UNSET: "UNSET", SET: "SET" });
const ENERGY_UNITS = Object.freeze({ KCAL: "KCAL", KJ: "KJ" });
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/;
const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_FACTS = 4096;
const MAX_REPOSITORY_FACTS = 65536;
const MAX_TARGET_VERSIONS = 4096;

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
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_DAILY_LEDGER_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) fail(`${field} is not safely serializable`, "INVALID_DAILY_LEDGER_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) value.forEach((child, index) => serializable(child, `${field}[${index}]`, seen));
  else {
    assertPlainRecord(value, field, "INVALID_DAILY_LEDGER_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_DAILY_LEDGER_VALUE", { field: `${field}.${key}` });
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

function identifier(value, field, code = "INVALID_DAILY_LEDGER_VALUE") {
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

function instant(value, field) {
  const match = typeof value === "string" ? INSTANT.exec(value) : null;
  if (!match || !Number.isFinite(Date.parse(value))) fail(`${field} must be an ISO instant with explicit offset`, "INVALID_ENERGY_TARGET_VERSION", { field });
  const [, year, month, day, hour, minute, second, , zone, , offsetHour, offsetMinute] = match;
  localDate(`${year}-${month}-${day}`, field);
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 || (zone !== "Z" && (Number(offsetHour) > 23 || Number(offsetMinute) > 59))) {
    fail(`${field} is not a real instant`, "INVALID_ENERGY_TARGET_VERSION", { field });
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

function decimalFraction(value, field) {
  if (typeof value !== "string" || value !== value.trim() || !DECIMAL.test(value)) fail(`${field} must be an unsigned decimal string`, "INVALID_ENERGY_TARGET_VALUE", { field });
  if (value.replace(".", "").length > 24) fail(`${field} exceeds the contract resource budget`, "ENERGY_TARGET_VALUE_TOO_LARGE", { field });
  const [whole, decimals = ""] = value.split(".");
  return fraction(BigInt(`${whole}${decimals}`), 10n ** BigInt(decimals.length));
}

function normalizeTargetEnergy(input, field = "target") {
  assertPlainRecord(input, field, "INVALID_ENERGY_TARGET_VALUE");
  if (input.status === TARGET_STATUSES.UNSET) {
    assertExactKeys(input, ["status"], [], field, "INVALID_ENERGY_TARGET_VALUE");
    return immutable({ status: TARGET_STATUSES.UNSET });
  }
  if (input.status !== TARGET_STATUSES.SET) fail(`${field}.status is unsupported`, "INVALID_ENERGY_TARGET_VALUE", { field: `${field}.status` });
  assertExactKeys(input, ["status", "inputValue", "inputUnit"], ["exactKcal", "conversion"], field, "INVALID_ENERGY_TARGET_VALUE");
  if (!Object.values(ENERGY_UNITS).includes(input.inputUnit)) fail(`${field}.inputUnit is unsupported`, "INVALID_ENERGY_TARGET_VALUE", { field: `${field}.inputUnit` });
  const decimal = decimalFraction(input.inputValue, `${field}.inputValue`);
  const numerator = BigInt(decimal.numerator);
  const denominator = BigInt(decimal.denominator);
  const exactKcal = input.inputUnit === ENERGY_UNITS.KCAL
    ? fraction(numerator, denominator)
    : fraction(numerator * 125n, denominator * 523n);
  const normalized = immutable({
    status: TARGET_STATUSES.SET,
    inputValue: input.inputValue,
    inputUnit: input.inputUnit,
    exactKcal,
    conversion: input.inputUnit === ENERGY_UNITS.KCAL ? "KCAL_EXACT" : "KJ_EXACT_125_OVER_523_KCAL",
  });
  const hasExact = Object.hasOwn(input, "exactKcal");
  const hasConversion = Object.hasOwn(input, "conversion");
  if (hasExact !== hasConversion || (hasExact && !isDeepStrictEqual(input, normalized))) fail(`${field} derived evidence is invalid`, "INVALID_ENERGY_TARGET_VALUE", { field });
  return normalized;
}

function normalizeTargetSource(input, field = "source") {
  assertExactKeys(input, ["sourceKind", "sourceId", "sourceVersion", "ruleId", "ruleVersion", "userEdited"], [], field, "INVALID_ENERGY_TARGET_SOURCE");
  if (typeof input.userEdited !== "boolean") fail(`${field}.userEdited must be boolean`, "INVALID_ENERGY_TARGET_SOURCE", { field: `${field}.userEdited` });
  const ruleIsNull = input.ruleId === null && input.ruleVersion === null;
  const ruleIsPresent = input.ruleId !== null && input.ruleVersion !== null;
  if (!ruleIsNull && !ruleIsPresent) fail("rule ID and version must both be present or both be null", "INVALID_ENERGY_TARGET_SOURCE", { field });
  return immutable({
    sourceKind: identifier(input.sourceKind, `${field}.sourceKind`, "INVALID_ENERGY_TARGET_SOURCE"),
    sourceId: identifier(input.sourceId, `${field}.sourceId`, "INVALID_ENERGY_TARGET_SOURCE"),
    sourceVersion: identifier(input.sourceVersion, `${field}.sourceVersion`, "INVALID_ENERGY_TARGET_SOURCE"),
    ruleId: ruleIsNull ? null : identifier(input.ruleId, `${field}.ruleId`, "INVALID_ENERGY_TARGET_SOURCE"),
    ruleVersion: ruleIsNull ? null : identifier(input.ruleVersion, `${field}.ruleVersion`, "INVALID_ENERGY_TARGET_SOURCE"),
    userEdited: input.userEdited,
  });
}

function normalizeEnergyTargetVersion(input, field = "version") {
  assertExactKeys(input, ["schemaVersion", "versionId", "effectiveFrom", "generatedAt", "source", "target"], [], field, "INVALID_ENERGY_TARGET_VERSION");
  if (input.schemaVersion !== "ENERGY_TARGET_VERSION_V1") fail(`${field}.schemaVersion is unsupported`, "INVALID_ENERGY_TARGET_VERSION", { field: `${field}.schemaVersion` });
  return immutable({
    schemaVersion: "ENERGY_TARGET_VERSION_V1",
    versionId: identifier(input.versionId, `${field}.versionId`, "INVALID_ENERGY_TARGET_VERSION"),
    effectiveFrom: localDate(input.effectiveFrom, `${field}.effectiveFrom`),
    generatedAt: instant(input.generatedAt, `${field}.generatedAt`),
    source: normalizeTargetSource(input.source, `${field}.source`),
    target: normalizeTargetEnergy(input.target, `${field}.target`),
  });
}

function normalizeTargetVersions(input, field = "targetVersions") {
  if (!Array.isArray(input) || input.length > MAX_TARGET_VERSIONS) fail(`${field} must be a bounded array`, "INVALID_ENERGY_TARGET_HISTORY", { field });
  const versions = input.map((version, index) => normalizeEnergyTargetVersion(version, `${field}[${index}]`));
  const ids = new Set();
  const effectiveDates = new Set();
  for (const version of versions) {
    if (ids.has(version.versionId)) fail("energy target version IDs must be unique", "DUPLICATE_ENERGY_TARGET_VERSION", { versionId: version.versionId });
    if (effectiveDates.has(version.effectiveFrom)) fail("energy target effective dates must be unique", "AMBIGUOUS_ENERGY_TARGET_EFFECTIVE_DATE", { effectiveFrom: version.effectiveFrom });
    ids.add(version.versionId);
    effectiveDates.add(version.effectiveFrom);
  }
  return versions.sort((left, right) => left.effectiveFrom < right.effectiveFrom ? -1 : left.effectiveFrom > right.effectiveFrom ? 1 : 0);
}

function normalizeFacts(input, field = "facts", maximum = MAX_FACTS) {
  if (!Array.isArray(input) || input.length > maximum) fail(`${field} must be a bounded array`, "INVALID_DAILY_LEDGER_FACTS", { field });
  const facts = input.map((fact, index) => normalizeEnergyFact(fact, `${field}[${index}]`));
  const ids = new Set();
  for (const fact of facts) {
    if (ids.has(fact.id)) fail("daily ledger fact IDs must be unique", "DUPLICATE_ENERGY_FACT", { factId: fact.id });
    ids.add(fact.id);
  }
  return facts.sort((left, right) => left.localDate < right.localDate ? -1 : left.localDate > right.localDate ? 1 : left.stream < right.stream ? -1 : left.stream > right.stream ? 1 : left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
}

function normalizeSnapshot(input, field = "snapshot") {
  assertExactKeys(input, ["schemaVersion", "localDate", "repositoryRevision", "complete", "facts", "factsFingerprint", "targetVersions", "targetVersionsFingerprint"], [], field, "INVALID_DAILY_LEDGER_SNAPSHOT");
  if (input.schemaVersion !== "DAILY_ENERGY_LEDGER_SNAPSHOT_V1" || input.complete !== true) fail(`${field} must be a complete supported snapshot`, "INVALID_DAILY_LEDGER_SNAPSHOT", { field });
  const date = localDate(input.localDate, `${field}.localDate`);
  const facts = normalizeFacts(input.facts, `${field}.facts`);
  if (facts.some((fact) => fact.localDate !== date)) fail(`${field} contains a fact outside the selected local date`, "DAILY_LEDGER_FACT_OUTSIDE_DATE", { field: `${field}.facts` });
  const targetVersions = normalizeTargetVersions(input.targetVersions, `${field}.targetVersions`);
  if (!SHA256.test(input.factsFingerprint) || input.factsFingerprint !== fingerprint(facts)) fail(`${field}.factsFingerprint is invalid`, "INVALID_DAILY_LEDGER_SNAPSHOT", { field: `${field}.factsFingerprint` });
  if (!SHA256.test(input.targetVersionsFingerprint) || input.targetVersionsFingerprint !== fingerprint(targetVersions)) fail(`${field}.targetVersionsFingerprint is invalid`, "INVALID_DAILY_LEDGER_SNAPSHOT", { field: `${field}.targetVersionsFingerprint` });
  return immutable({
    schemaVersion: "DAILY_ENERGY_LEDGER_SNAPSHOT_V1",
    localDate: date,
    repositoryRevision: identifier(input.repositoryRevision, `${field}.repositoryRevision`, "INVALID_DAILY_LEDGER_SNAPSHOT"),
    complete: true,
    facts,
    factsFingerprint: input.factsFingerprint,
    targetVersions,
    targetVersionsFingerprint: input.targetVersionsFingerprint,
  });
}

function createInMemoryDailyEnergyLedgerRepository({ facts = [], targetVersions = [], repositoryRevision = "daily-ledger-repository-1" } = {}) {
  const storedFacts = normalizeFacts(facts, "facts", MAX_REPOSITORY_FACTS);
  const storedTargetVersions = normalizeTargetVersions(targetVersions);
  const revision = identifier(repositoryRevision, "repositoryRevision", "INVALID_DAILY_LEDGER_REPOSITORY");
  return Object.freeze({
    async queryDailyEnergyLedger(dateInput) {
      const date = localDate(dateInput);
      const selectedFacts = storedFacts.filter((fact) => fact.localDate === date);
      if (selectedFacts.length > MAX_FACTS) fail("daily ledger query exceeds the fact budget", "DAILY_LEDGER_FACT_SET_TOO_LARGE");
      return immutable({
        schemaVersion: "DAILY_ENERGY_LEDGER_SNAPSHOT_V1",
        localDate: date,
        repositoryRevision: revision,
        complete: true,
        facts: selectedFacts,
        factsFingerprint: fingerprint(selectedFacts),
        targetVersions: storedTargetVersions,
        targetVersionsFingerprint: fingerprint(storedTargetVersions),
      });
    },
  });
}

function addFractions(values) {
  let numerator = 0n;
  let denominator = 1n;
  for (const value of values) {
    const nextNumerator = BigInt(value.numerator);
    const nextDenominator = BigInt(value.denominator);
    numerator = numerator * nextDenominator + nextNumerator * denominator;
    denominator *= nextDenominator;
    const divisor = gcd(numerator, denominator);
    numerator /= divisor;
    denominator /= divisor;
  }
  return fraction(numerator, denominator);
}

function summarizeFacts(facts) {
  if (facts.length === 0) return immutable({ status: "MISSING", factCount: 0, exactKcal: null, facts: [] });
  return immutable({ status: "KNOWN", factCount: facts.length, exactKcal: addFractions(facts.map((fact) => fact.energy.exactKcal)), facts });
}

function effectiveTargetVersion(versions, date) {
  let selected = null;
  for (const version of versions) {
    if (version.effectiveFrom > date) break;
    selected = version;
  }
  return selected;
}

function targetSummary(version) {
  if (version === null) return immutable({ status: "NO_EFFECTIVE_VERSION", effectiveVersion: null, exactKcal: null });
  if (version.target.status === TARGET_STATUSES.UNSET) return immutable({ status: "UNSET", effectiveVersion: version, exactKcal: null });
  return immutable({ status: "SET", effectiveVersion: version, exactKcal: version.target.exactKcal });
}

function buildDailyEnergyLedger(snapshotInput) {
  const snapshot = normalizeSnapshot(snapshotInput);
  const intake = summarizeFacts(snapshot.facts.filter((fact) => fact.stream === "INTAKE"));
  const burned = summarizeFacts(snapshot.facts.filter((fact) => fact.stream === "BURNED"));
  const target = targetSummary(effectiveTargetVersion(snapshot.targetVersions, snapshot.localDate));
  return immutable({
    schemaVersion: "DAILY_ENERGY_LEDGER_V1",
    localDate: snapshot.localDate,
    evidence: snapshot,
    facts: { intake, burned, target },
    left: {
      status: "POLICY_NOT_AUTHORIZED",
      exactKcal: null,
      policyId: null,
      policyVersion: null,
      roundingPolicy: "UNSPECIFIED",
    },
  });
}

function validateDailyEnergyLedger(input, field = "ledger") {
  assertExactKeys(input, ["schemaVersion", "localDate", "evidence", "facts", "left"], [], field, "INVALID_DAILY_ENERGY_LEDGER");
  if (input.schemaVersion !== "DAILY_ENERGY_LEDGER_V1") fail(`${field}.schemaVersion is unsupported`, "INVALID_DAILY_ENERGY_LEDGER", { field: `${field}.schemaVersion` });
  let expected;
  try {
    expected = buildDailyEnergyLedger(input.evidence);
  } catch (error) {
    fail(`${field} cannot be rebuilt from valid source evidence`, "INVALID_DAILY_ENERGY_LEDGER", { field, causeCode: error?.code ?? "UNKNOWN" });
  }
  if (!isDeepStrictEqual(input, expected)) fail(`${field} contains invalid derived evidence`, "INVALID_DAILY_ENERGY_LEDGER", { field });
  return expected;
}

async function readDailyEnergyLedger(repository, localDateInput) {
  if (!repository || typeof repository.queryDailyEnergyLedger !== "function") fail("daily ledger repository is invalid", "INVALID_DAILY_LEDGER_REPOSITORY");
  const date = localDate(localDateInput);
  return buildDailyEnergyLedger(await repository.queryDailyEnergyLedger(date));
}

export {
  ENERGY_UNITS,
  TARGET_STATUSES,
  buildDailyEnergyLedger,
  createInMemoryDailyEnergyLedgerRepository,
  normalizeEnergyTargetVersion,
  readDailyEnergyLedger,
  validateDailyEnergyLedger,
};
