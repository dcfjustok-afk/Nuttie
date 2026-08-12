import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSevenDayEnergyTrend,
  createInMemoryEnergyFactRepository,
  normalizeEnergyFact,
  readSevenDayEnergyTrend,
  sevenDayWindow,
} from "./seven-day-energy-trend-harness.mjs";

function fact({
  id = "energy-1",
  localDate = "2026-08-12",
  stream = "INTAKE",
  inputValue = "100",
  inputUnit = "KCAL",
  kind = stream === "INTAKE" ? "MEAL_RECORD" : "MANUAL_BURN",
  recordId = `${id}-source`,
  revision = 1,
  quality = kind === "MANUAL_BURN" ? "USER_ENTERED" : kind === "LOCAL_ESTIMATE" ? "ESTIMATED" : "SOURCE_REPORTED",
} = {}) {
  return normalizeEnergyFact({
    schemaVersion: "ENERGY_FACT_V1",
    id,
    localDate,
    stream,
    energy: { inputValue, inputUnit },
    source: { kind, recordId, revision, quality },
  });
}

async function trend(facts = [], endLocalDate = "2026-08-12", repositoryRevision = "energy-repository-1") {
  return readSevenDayEnergyTrend(createInMemoryEnergyFactRepository({ facts, repositoryRevision }), endLocalDate);
}

test("builds exactly seven stable local dates across month, year, and leap-day boundaries", () => {
  assert.deepEqual(sevenDayWindow("2026-01-02").dates, ["2025-12-27", "2025-12-28", "2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"]);
  assert.deepEqual(sevenDayWindow("2028-03-02").dates, ["2028-02-25", "2028-02-26", "2028-02-27", "2028-02-28", "2028-02-29", "2028-03-01", "2028-03-02"]);
  assert.throws(() => sevenDayWindow("2026-02-30"), { code: "INVALID_LOCAL_DATE" });
});

test("empty days remain missing instead of becoming measured zero", async () => {
  const result = await trend();
  assert.equal(result.days.length, 7);
  assert.ok(result.days.every((day) => day.intake.status === "MISSING" && day.burned.status === "MISSING"));
  assert.equal(result.semanticSummary.intake.completeness, "MISSING");
  assert.equal(result.semanticSummary.intake.knownTotalExactKcal, null);
  assert.deepEqual(result.semanticSummary.burned.missingDates, result.query.dates);
});

test("explicit zero is known and distinct from a missing day", async () => {
  const result = await trend([fact({ inputValue: "0" }), fact({ id: "burn-zero", stream: "BURNED", inputValue: "0" })]);
  const day = result.days.at(-1);
  assert.equal(day.intake.status, "KNOWN");
  assert.deepEqual(day.intake.exactKcal, { numerator: "0", denominator: "1" });
  assert.equal(day.burned.status, "KNOWN");
  assert.equal(result.semanticSummary.intake.completeness, "PARTIAL");
});

test("preserves original kcal and kJ inputs while aggregating exact rational kcal", async () => {
  const result = await trend([
    fact({ id: "kcal", inputValue: "0.1" }),
    fact({ id: "kj", inputValue: "4.184", inputUnit: "KJ" }),
  ]);
  const intake = result.days.at(-1).intake;
  assert.deepEqual(intake.exactKcal, { numerator: "11", denominator: "10" });
  assert.equal(intake.facts[0].energy.inputValue, "0.1");
  assert.equal(intake.facts[0].energy.inputUnit, "KCAL");
  assert.equal(intake.facts[1].energy.inputValue, "4.184");
  assert.equal(intake.facts[1].energy.inputUnit, "KJ");
});

test("keeps intake and burned streams separate and never computes target or left", async () => {
  const result = await trend([
    fact({ id: "meal", inputValue: "500" }),
    fact({ id: "burn", stream: "BURNED", inputValue: "120" }),
  ]);
  const day = result.days.at(-1);
  assert.deepEqual(day.intake.exactKcal, { numerator: "500", denominator: "1" });
  assert.deepEqual(day.burned.exactKcal, { numerator: "120", denominator: "1" });
  for (const key of ["targetKcal", "leftKcal", "netKcal", "averageKcal"]) assert.equal(key in day, false);
});

test("retains traceable source record, revision, and quality for every fact", async () => {
  const result = await trend([
    fact({ id: "meal", recordId: "meal-42", revision: 3, quality: "USER_ENTERED" }),
    fact({ id: "estimate", stream: "BURNED", kind: "LOCAL_ESTIMATE", recordId: "exercise-7", revision: 2, quality: "ESTIMATED" }),
  ]);
  assert.deepEqual(result.days.at(-1).intake.facts[0].source, { kind: "MEAL_RECORD", recordId: "meal-42", revision: 3, quality: "USER_ENTERED" });
  assert.deepEqual(result.days.at(-1).burned.facts[0].source, { kind: "LOCAL_ESTIMATE", recordId: "exercise-7", revision: 2, quality: "ESTIMATED" });
});

test("orders same-day facts deterministically without merging their provenance", async () => {
  const input = [fact({ id: "z", inputValue: "30" }), fact({ id: "a", inputValue: "20" })];
  const forward = await trend(input);
  const reverse = await trend([...input].reverse());
  assert.deepEqual(forward, reverse);
  assert.deepEqual(forward.days.at(-1).intake.facts.map(({ id }) => id), ["a", "z"]);
  assert.equal(forward.days.at(-1).intake.factCount, 2);
});

test("reports complete, partial, and missing coverage without inventing averages", async () => {
  const dates = sevenDayWindow("2026-08-12").dates;
  const intake = dates.map((date, index) => fact({ id: `meal-${index}`, localDate: date, inputValue: String(index) }));
  const result = await trend([...intake, fact({ id: "burn-one", stream: "BURNED", localDate: dates[0] })]);
  assert.equal(result.semanticSummary.intake.completeness, "COMPLETE");
  assert.equal(result.semanticSummary.intake.knownDays, 7);
  assert.deepEqual(result.semanticSummary.intake.knownTotalExactKcal, { numerator: "21", denominator: "1" });
  assert.equal(result.semanticSummary.burned.completeness, "PARTIAL");
  assert.equal("average" in result.semanticSummary.intake, false);
});

test("rejects invalid values, units, dates, schemas, extras, and duplicate fact IDs", () => {
  assert.throws(() => fact({ inputValue: -1 }), { code: "INVALID_ENERGY_VALUE" });
  assert.throws(() => fact({ inputUnit: "CAL" }), { code: "UNSUPPORTED_ENERGY_UNIT" });
  assert.throws(() => fact({ localDate: "2026-02-30" }), { code: "INVALID_LOCAL_DATE" });
  assert.throws(() => normalizeEnergyFact({ ...fact(), schemaVersion: "ENERGY_FACT_V2" }), { code: "INVALID_ENERGY_FACT" });
  assert.throws(() => normalizeEnergyFact({ ...fact(), goal: 2000 }), { code: "INVALID_ENERGY_FACT" });
  assert.throws(() => createInMemoryEnergyFactRepository({ facts: [fact(), fact()] }), { code: "DUPLICATE_ENERGY_FACT" });
});

test("rejects source kinds that conflate intake, burn, manual input, and estimates", () => {
  assert.throws(() => fact({ stream: "INTAKE", kind: "MANUAL_BURN", quality: "USER_ENTERED" }), { code: "ENERGY_SOURCE_STREAM_MISMATCH" });
  assert.throws(() => fact({ stream: "BURNED", kind: "MEAL_RECORD" }), { code: "ENERGY_SOURCE_STREAM_MISMATCH" });
  assert.throws(() => fact({ stream: "BURNED", kind: "LOCAL_ESTIMATE", quality: "USER_ENTERED" }), { code: "ENERGY_SOURCE_QUALITY_MISMATCH" });
  assert.throws(() => fact({ stream: "BURNED", kind: "MANUAL_BURN", quality: "ESTIMATED" }), { code: "ENERGY_SOURCE_QUALITY_MISMATCH" });
});

test("fails closed for incomplete, mismatched, forged, or out-of-range repository snapshots", async () => {
  const repository = createInMemoryEnergyFactRepository({ facts: [fact()] });
  const snapshot = await repository.querySevenDayWindow(sevenDayWindow("2026-08-12"));
  assert.throws(() => buildSevenDayEnergyTrend({ ...snapshot, complete: false }), { code: "INCOMPLETE_ENERGY_WINDOW_SNAPSHOT" });
  const wrongQuery = structuredClone(snapshot);
  wrongQuery.query.startLocalDate = "2026-08-01";
  assert.throws(() => buildSevenDayEnergyTrend(wrongQuery), { code: "INVALID_ENERGY_WINDOW" });
  const forged = structuredClone(snapshot);
  forged.facts[0].energy.inputValue = "999";
  assert.throws(() => buildSevenDayEnergyTrend(forged), { code: "INVALID_ENERGY_VALUE" });
  const outside = structuredClone(snapshot);
  outside.facts.push(fact({ id: "outside", localDate: "2026-08-05" }));
  assert.throws(() => buildSevenDayEnergyTrend(outside), { code: "ENERGY_FACT_OUTSIDE_WINDOW" });
  assert.throws(() => buildSevenDayEnergyTrend({ ...snapshot, facts: new Array(4097).fill(fact()) }), { code: "ENERGY_FACT_SET_TOO_LARGE" });
});

test("a revised repository snapshot recomputes changed and deleted facts without cache leakage", async () => {
  const before = await trend([fact({ inputValue: "100" }), fact({ id: "old-burn", stream: "BURNED", inputValue: "20" })], "2026-08-12", "energy-repository-1");
  const after = await trend([fact({ inputValue: "150", revision: 2 })], "2026-08-12", "energy-repository-2");
  assert.deepEqual(before.days.at(-1).intake.exactKcal, { numerator: "100", denominator: "1" });
  assert.equal(before.days.at(-1).burned.status, "KNOWN");
  assert.deepEqual(after.days.at(-1).intake.exactKcal, { numerator: "150", denominator: "1" });
  assert.equal(after.days.at(-1).burned.status, "MISSING");
  assert.equal(after.repositoryRevision, "energy-repository-2");
});

test("the seven-day resource budget does not become a full-history record limit", async () => {
  const history = Array.from({ length: 4097 }, (_, index) => fact({
    id: `history-${index}`,
    localDate: "2020-01-01",
    recordId: `history-source-${index}`,
  }));
  const result = await trend([...history, fact()], "2026-08-12");
  assert.equal(result.days.at(-1).intake.factCount, 1);
  assert.equal(result.semanticSummary.intake.knownDays, 1);
});

test("copies and freezes caller, repository, trend, semantic, and provenance data", async () => {
  const mutable = { ...fact(), source: { ...fact().source }, energy: { ...fact().energy, exactKcal: { ...fact().energy.exactKcal } } };
  const repository = createInMemoryEnergyFactRepository({ facts: [mutable] });
  mutable.energy.inputValue = "999";
  mutable.source.revision = 99;
  const result = await readSevenDayEnergyTrend(repository, "2026-08-12");
  assert.equal(result.days.at(-1).intake.facts[0].energy.inputValue, "100");
  assert.equal(result.days.at(-1).intake.facts[0].source.revision, 1);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.semanticSummary.intake.missingDates));
  assert.throws(() => { result.days.at(-1).intake.facts[0].id = "changed"; }, TypeError);
});

test("exposes no AI, network, HealthKit, target, average, export, or longer-window capability", async () => {
  const module = await import("./seven-day-energy-trend-harness.mjs");
  for (const key of ["sendToAI", "networkRequest", "healthKit", "calculateTarget", "calculateAverage", "exportTrend", "thirtyDayWindow"]) assert.equal(key in module, false);
  assert.equal(sevenDayWindow("2026-08-12").dayCount, 7);
});
