import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const STREAMS = Object.freeze({ INTAKE: "INTAKE", BURNED: "BURNED" });
const UNITS = Object.freeze({ KCAL: "KCAL", KJ: "KJ" });
const SOURCE_KINDS = Object.freeze({
  MEAL_RECORD: "MEAL_RECORD",
  MANUAL_BURN: "MANUAL_BURN",
  LOCAL_ESTIMATE: "LOCAL_ESTIMATE",
});
const QUALITIES = Object.freeze({
  USER_ENTERED: "USER_ENTERED",
  SOURCE_REPORTED: "SOURCE_REPORTED",
  ESTIMATED: "ESTIMATED",
});
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
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

function assertSerializable(value, field, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_ENERGY_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) fail(`${field} is not safely serializable`, "INVALID_ENERGY_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item, index) => assertSerializable(item, `${field}[${index}]`, seen));
  else {
    assertPlainRecord(value, field, "INVALID_ENERGY_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_ENERGY_VALUE", { field: `${field}.${key}` });
      assertSerializable(child, `${field}.${key}`, seen);
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

function freeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => freeze(child, seen));
  return Object.freeze(value);
}

function immutable(value) {
  assertSerializable(value, "value");
  return freeze(clone(value));
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function identifier(value, field, code = "INVALID_ENERGY_FACT") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function localDate(value, field = "localDate") {
  const match = typeof value === "string" ? LOCAL_DATE.exec(value) : null;
  if (!match) fail(`${field} must be YYYY-MM-DD`, "INVALID_LOCAL_DATE", { field });
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.toISOString().slice(0, 10) !== value) fail(`${field} is not a calendar date`, "INVALID_LOCAL_DATE", { field });
  return value;
}

function shiftDate(value, delta) {
  const date = new Date(`${localDate(value)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
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
  if (typeof value !== "string" || value !== value.trim() || !DECIMAL.test(value)) fail(`${field} must be an unsigned decimal string`, "INVALID_ENERGY_VALUE", { field });
  if (value.replace(".", "").length > 24) fail(`${field} exceeds the contract resource budget`, "ENERGY_VALUE_TOO_LARGE", { field });
  const [whole, decimals = ""] = value.split(".");
  return fraction(BigInt(`${whole}${decimals}`), 10n ** BigInt(decimals.length));
}

function normalizeEnergy(input, field = "energy") {
  assertExactKeys(input, ["inputValue", "inputUnit"], ["exactKcal", "conversion"], field, "INVALID_ENERGY_VALUE");
  if (!Object.values(UNITS).includes(input.inputUnit)) fail(`${field}.inputUnit is unsupported`, "UNSUPPORTED_ENERGY_UNIT", { field: `${field}.inputUnit` });
  const decimal = decimalFraction(input.inputValue, `${field}.inputValue`);
  const numerator = BigInt(decimal.numerator);
  const denominator = BigInt(decimal.denominator);
  const exactKcal = input.inputUnit === UNITS.KCAL
    ? fraction(numerator, denominator)
    : fraction(numerator * 125n, denominator * 523n);
  const normalized = immutable({
    inputValue: input.inputValue,
    inputUnit: input.inputUnit,
    exactKcal,
    conversion: input.inputUnit === UNITS.KCAL ? "KCAL_EXACT" : "KJ_EXACT_125_OVER_523_KCAL",
  });
  const hasExact = Object.hasOwn(input, "exactKcal");
  const hasConversion = Object.hasOwn(input, "conversion");
  if (hasExact !== hasConversion || (hasExact && !isDeepStrictEqual(input, normalized))) fail(`${field} derived evidence is invalid`, "INVALID_ENERGY_VALUE", { field });
  return normalized;
}

function normalizeSource(input, stream, field = "source") {
  assertExactKeys(input, ["kind", "recordId", "revision", "quality"], [], field, "INVALID_ENERGY_SOURCE");
  if (!Object.values(SOURCE_KINDS).includes(input.kind) || !Object.values(QUALITIES).includes(input.quality)) fail(`${field} taxonomy is unsupported`, "INVALID_ENERGY_SOURCE", { field });
  if (stream === STREAMS.INTAKE && input.kind !== SOURCE_KINDS.MEAL_RECORD) fail("intake must trace to a meal record", "ENERGY_SOURCE_STREAM_MISMATCH", { field });
  if (stream === STREAMS.BURNED && input.kind === SOURCE_KINDS.MEAL_RECORD) fail("burned energy cannot trace to a meal record", "ENERGY_SOURCE_STREAM_MISMATCH", { field });
  if (input.kind === SOURCE_KINDS.LOCAL_ESTIMATE && input.quality !== QUALITIES.ESTIMATED) fail("a local estimate must remain labeled estimated", "ENERGY_SOURCE_QUALITY_MISMATCH", { field });
  if (input.kind === SOURCE_KINDS.MANUAL_BURN && input.quality !== QUALITIES.USER_ENTERED) fail("manual burn must remain labeled user entered", "ENERGY_SOURCE_QUALITY_MISMATCH", { field });
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) fail(`${field}.revision is invalid`, "INVALID_ENERGY_SOURCE", { field: `${field}.revision` });
  return immutable({ kind: input.kind, recordId: identifier(input.recordId, `${field}.recordId`, "INVALID_ENERGY_SOURCE"), revision: input.revision, quality: input.quality });
}

function normalizeEnergyFact(input, field = "fact") {
  assertExactKeys(input, ["schemaVersion", "id", "localDate", "stream", "energy", "source"], [], field, "INVALID_ENERGY_FACT");
  if (input.schemaVersion !== "ENERGY_FACT_V1" || !Object.values(STREAMS).includes(input.stream)) fail(`${field} version or stream is unsupported`, "INVALID_ENERGY_FACT", { field });
  return immutable({
    schemaVersion: "ENERGY_FACT_V1",
    id: identifier(input.id, `${field}.id`),
    localDate: localDate(input.localDate, `${field}.localDate`),
    stream: input.stream,
    energy: normalizeEnergy(input.energy, `${field}.energy`),
    source: normalizeSource(input.source, input.stream, `${field}.source`),
  });
}

function normalizeFacts(facts, field = "facts") {
  if (!Array.isArray(facts)) fail(`${field} must be an array`, "INVALID_ENERGY_FACT_SET", { field });
  const normalized = facts.map((fact, index) => normalizeEnergyFact(fact, `${field}[${index}]`));
  const ids = new Set();
  for (const fact of normalized) {
    if (ids.has(fact.id)) fail("energy fact IDs must be unique", "DUPLICATE_ENERGY_FACT", { factId: fact.id });
    ids.add(fact.id);
  }
  return normalized.sort((left, right) => (
    left.localDate < right.localDate ? -1 : left.localDate > right.localDate ? 1
      : left.stream < right.stream ? -1 : left.stream > right.stream ? 1
        : left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  ));
}

function sevenDayWindow(endLocalDate) {
  const end = localDate(endLocalDate, "endLocalDate");
  const dates = Array.from({ length: 7 }, (_, index) => shiftDate(end, index - 6));
  return immutable({ schemaVersion: "ENERGY_WINDOW_QUERY_V1", startLocalDate: dates[0], endLocalDate: end, dayCount: 7, dates });
}

function normalizeQuery(input, field = "query") {
  assertExactKeys(input, ["schemaVersion", "startLocalDate", "endLocalDate", "dayCount", "dates"], [], field, "INVALID_ENERGY_WINDOW");
  const expected = sevenDayWindow(input.endLocalDate);
  if (!isDeepStrictEqual(input, expected)) fail("energy window must be the exact seven local calendar days", "INVALID_ENERGY_WINDOW", { field });
  return expected;
}

function createInMemoryEnergyFactRepository({ facts = [], repositoryRevision = "energy-repository-1" } = {}) {
  const stored = normalizeFacts(facts);
  const revision = identifier(repositoryRevision, "repositoryRevision", "INVALID_ENERGY_REPOSITORY");
  return Object.freeze({
    async querySevenDayWindow(queryInput) {
      const query = normalizeQuery(queryInput);
      const selected = stored.filter((fact) => fact.localDate >= query.startLocalDate && fact.localDate <= query.endLocalDate);
      if (selected.length > 4096) fail("seven-day query exceeds the contract resource budget", "ENERGY_FACT_SET_TOO_LARGE");
      return immutable({
        schemaVersion: "ENERGY_WINDOW_SNAPSHOT_V1",
        query,
        repositoryRevision: revision,
        complete: true,
        facts: selected,
        factsFingerprint: fingerprint(selected),
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

function summarizeStream(facts) {
  if (facts.length === 0) return immutable({ status: "MISSING", factCount: 0, exactKcal: null, facts: [] });
  return immutable({ status: "KNOWN", factCount: facts.length, exactKcal: addFractions(facts.map((fact) => fact.energy.exactKcal)), facts });
}

function summarizeCoverage(days, key) {
  const known = days.filter((day) => day[key].status === "KNOWN");
  const missingDates = days.filter((day) => day[key].status === "MISSING").map((day) => day.localDate);
  return immutable({
    completeness: known.length === 0 ? "MISSING" : known.length === 7 ? "COMPLETE" : "PARTIAL",
    knownDays: known.length,
    missingDays: missingDates.length,
    missingDates,
    knownTotalExactKcal: known.length === 0 ? null : addFractions(known.map((day) => day[key].exactKcal)),
  });
}

function buildSevenDayEnergyTrend(snapshotInput) {
  assertExactKeys(snapshotInput, ["schemaVersion", "query", "repositoryRevision", "complete", "facts", "factsFingerprint"], [], "snapshot", "INVALID_ENERGY_WINDOW_SNAPSHOT");
  if (snapshotInput.schemaVersion !== "ENERGY_WINDOW_SNAPSHOT_V1" || snapshotInput.complete !== true) fail("energy window snapshot must be complete", "INCOMPLETE_ENERGY_WINDOW_SNAPSHOT");
  if (!Array.isArray(snapshotInput.facts) || snapshotInput.facts.length > 4096) fail("seven-day snapshot exceeds the contract resource budget", "ENERGY_FACT_SET_TOO_LARGE");
  const query = normalizeQuery(snapshotInput.query, "snapshot.query");
  const repositoryRevision = identifier(snapshotInput.repositoryRevision, "snapshot.repositoryRevision", "INVALID_ENERGY_WINDOW_SNAPSHOT");
  const facts = normalizeFacts(snapshotInput.facts, "snapshot.facts");
  if (facts.some((fact) => fact.localDate < query.startLocalDate || fact.localDate > query.endLocalDate)) fail("energy window contains an out-of-range fact", "ENERGY_FACT_OUTSIDE_WINDOW");
  if (!SHA256.test(snapshotInput.factsFingerprint) || snapshotInput.factsFingerprint !== fingerprint(facts)) fail("energy window fingerprint is invalid", "INVALID_ENERGY_WINDOW_SNAPSHOT");
  const days = query.dates.map((date) => {
    const dayFacts = facts.filter((fact) => fact.localDate === date);
    return immutable({
      localDate: date,
      intake: summarizeStream(dayFacts.filter((fact) => fact.stream === STREAMS.INTAKE)),
      burned: summarizeStream(dayFacts.filter((fact) => fact.stream === STREAMS.BURNED)),
    });
  });
  return immutable({
    schemaVersion: "SEVEN_DAY_ENERGY_TREND_V1",
    query,
    repositoryRevision,
    factsFingerprint: snapshotInput.factsFingerprint,
    days,
    semanticSummary: {
      schemaVersion: "SEVEN_DAY_ENERGY_SEMANTICS_V1",
      range: { startLocalDate: query.startLocalDate, endLocalDate: query.endLocalDate, dayCount: 7 },
      intake: summarizeCoverage(days, "intake"),
      burned: summarizeCoverage(days, "burned"),
    },
  });
}

async function readSevenDayEnergyTrend(repository, endLocalDate) {
  if (!repository || typeof repository.querySevenDayWindow !== "function") fail("energy repository is invalid", "INVALID_ENERGY_REPOSITORY");
  const query = sevenDayWindow(endLocalDate);
  return buildSevenDayEnergyTrend(await repository.querySevenDayWindow(query));
}

export {
  QUALITIES,
  SOURCE_KINDS,
  STREAMS,
  UNITS,
  buildSevenDayEnergyTrend,
  createInMemoryEnergyFactRepository,
  normalizeEnergyFact,
  readSevenDayEnergyTrend,
  sevenDayWindow,
};
