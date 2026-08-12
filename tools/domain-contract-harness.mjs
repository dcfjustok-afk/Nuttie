import { normalizeNutritionFactSnapshot } from "./local-food-catalog-harness.mjs";
import { NUTRIENT_FIELDS } from "./nutrition-fields.mjs";

const MASS_TO_GRAMS = Object.freeze({
  mg: 0.001,
  g: 1,
  kg: 1000,
});

const ENERGY_TO_KCAL = Object.freeze({
  kcal: 1,
  kj: 1 / 4.184,
});

function fail(message, details = {}) {
  const error = new Error(message);
  Object.assign(error, details);
  throw error;
}

function finiteNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${field} must be a finite number`, { code: "INVALID_NUMBER", field });
  }
  return value;
}

function nonNegativeNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number < 0) {
    fail(`${field} must be non-negative`, { code: "NEGATIVE_NUMBER", field });
  }
  return number;
}

function positiveNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number <= 0) {
    fail(`${field} must be greater than zero`, { code: "NON_POSITIVE_NUMBER", field });
  }
  return number;
}

function assertSafeObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const key of Object.keys(value)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      fail(`${field} contains an unsafe key`, { code: "UNSAFE_OBJECT_KEY", field, key });
    }
  }
}

function normalizeMass(value, unit) {
  const factor = MASS_TO_GRAMS[unit];
  if (!factor) {
    fail(`unsupported mass unit: ${unit}`, { code: "UNSUPPORTED_UNIT", unit });
  }
  return positiveNumber(value, "mass") * factor;
}

function normalizeEnergy(value, unit) {
  const factor = ENERGY_TO_KCAL[unit];
  if (!factor) {
    fail(`unsupported energy unit: ${unit}`, { code: "UNSUPPORTED_UNIT", unit });
  }
  return nonNegativeNumber(value, "energy") * factor;
}

function assertDateKey(dateKey) {
  if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    fail("localDate must use YYYY-MM-DD", { code: "INVALID_DATE_KEY" });
  }
  const parsed = new Date(`${dateKey}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== dateKey) {
    fail("localDate is not a calendar date", { code: "INVALID_DATE_KEY" });
  }
  return dateKey;
}

function dateContext({ instant, timeZone, localDate }) {
  if (typeof timeZone !== "string" || timeZone.length === 0) {
    fail("timeZone is required", { code: "MISSING_TIME_ZONE" });
  }
  if (typeof instant !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(instant)) {
    fail("instant must be a strict ISO timestamp", { code: "INVALID_INSTANT" });
  }
  const [, year, month, day] = instant.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  const calendarDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (calendarDate.getUTCFullYear() !== Number(year) || calendarDate.getUTCMonth() !== Number(month) - 1 || calendarDate.getUTCDate() !== Number(day)) {
    fail("instant is not a calendar timestamp", { code: "INVALID_INSTANT" });
  }
  const instantDate = new Date(instant);
  if (Number.isNaN(instantDate.valueOf())) {
    fail("instant must be a valid ISO timestamp", { code: "INVALID_INSTANT" });
  }
  let derivedDate;
  try {
    derivedDate = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(instantDate);
  } catch (error) {
    fail("timeZone is not supported", { code: "INVALID_TIME_ZONE", cause: error });
  }
  derivedDate = derivedDate.replace(/\//g, "-");
  assertDateKey(derivedDate);
  if (localDate !== undefined && assertDateKey(localDate) !== derivedDate) {
    fail("localDate does not match instant in timeZone", { code: "DATE_CONTEXT_MISMATCH" });
  }
  return Object.freeze({ instant: instantDate.toISOString(), timeZone, localDate: derivedDate });
}

function nutritionSnapshot({ sourceId, sourceVersion, nutrients = {} }) {
  if (typeof sourceId !== "string" || sourceId.length === 0) {
    fail("sourceId is required", { code: "MISSING_SOURCE_ID" });
  }
  if (typeof sourceVersion !== "string" || sourceVersion.length === 0) {
    fail("sourceVersion is required", { code: "MISSING_SOURCE_VERSION" });
  }
  if (!nutrients || typeof nutrients !== "object" || Array.isArray(nutrients)) {
    fail("nutrients must be an object", { code: "INVALID_NUTRIENTS" });
  }
  assertSafeObject(nutrients, "nutrients");
  const values = {};
  const missingFields = [];
  for (const field of NUTRIENT_FIELDS) {
    if (nutrients[field] === undefined || nutrients[field] === null) {
      values[field] = null;
      missingFields.push(field);
    } else {
      values[field] = nonNegativeNumber(nutrients[field], field);
    }
  }
  return Object.freeze({
    sourceId,
    sourceVersion,
    values: Object.freeze(values),
    missingFields: Object.freeze(missingFields),
  });
}

function assertNutritionSnapshot(snapshot, field = "nutritionSnapshot") {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    fail(`${field} must be an object`, { code: "INVALID_NUTRITION_SNAPSHOT", field });
  }
  assertSafeObject(snapshot, field);
  if (typeof snapshot.sourceId !== "string" || snapshot.sourceId.length === 0) {
    fail(`${field}.sourceId is required`, { code: "MISSING_SOURCE_ID", field });
  }
  if (typeof snapshot.sourceVersion !== "string" || snapshot.sourceVersion.length === 0) {
    fail(`${field}.sourceVersion is required`, { code: "MISSING_SOURCE_VERSION", field });
  }
  if (!snapshot.values || typeof snapshot.values !== "object" || Array.isArray(snapshot.values)) {
    fail(`${field}.values must be an object`, { code: "INVALID_NUTRIENTS", field });
  }
  assertSafeObject(snapshot.values, `${field}.values`);
  const schemaVersion = snapshot.schemaVersion ?? null;
  if (schemaVersion !== null && schemaVersion !== "NUTRITION_FACT_SNAPSHOT_V2") {
    fail(`${field}.schemaVersion is unsupported`, {
      code: "UNSUPPORTED_NUTRITION_SNAPSHOT",
      field,
    });
  }
  if (schemaVersion === null && Object.hasOwn(snapshot, "facts")) {
    fail(`${field}.facts require a versioned snapshot`, {
      code: "UNVERIFIED_NUTRITION_FACTS",
      field,
    });
  }
  if (schemaVersion === "NUTRITION_FACT_SNAPSHOT_V2") {
    normalizeNutritionFactSnapshot(snapshot);
  }
  for (const nutrientField of NUTRIENT_FIELDS) {
    const value = snapshot.values[nutrientField];
    if (value !== null) nonNegativeNumber(value, `${field}.values.${nutrientField}`);
  }
  return snapshot;
}

function scaleNutritionSnapshot(snapshot, {
  servingMass,
  servingUnit = "g",
  basisMass = 100,
  basisUnit = "g",
}) {
  assertNutritionSnapshot(snapshot);
  const servingGrams = normalizeMass(servingMass, servingUnit);
  const basisGrams = normalizeMass(basisMass, basisUnit);
  const factor = servingGrams / basisGrams;
  const values = Object.fromEntries(NUTRIENT_FIELDS.map((field) => [
    field,
    snapshot.values[field] === null ? null : snapshot.values[field] * factor,
  ]));
  return Object.freeze({
    sourceId: snapshot.sourceId,
    sourceVersion: snapshot.sourceVersion,
    values: Object.freeze(values),
    missingFields: Object.freeze(NUTRIENT_FIELDS.filter((field) => values[field] === null)),
    servingGrams,
    basisGrams,
    factor,
  });
}

function aggregateNutritionSnapshots(snapshots) {
  if (!Array.isArray(snapshots)) {
    fail("snapshots must be an array", { code: "INVALID_NUTRITION_SNAPSHOTS" });
  }
  snapshots.forEach((snapshot, index) => assertNutritionSnapshot(snapshot, `snapshots[${index}]`));
  const values = {};
  const completeness = {};
  const factQuality = {};
  for (const field of NUTRIENT_FIELDS) {
    const knownValues = snapshots
      .map((snapshot) => snapshot.values[field])
      .filter((value) => value !== null);
    values[field] = knownValues.length === 0
      ? null
      : knownValues.reduce((total, value) => total + value, 0);
    completeness[field] = knownValues.length === 0
      ? "MISSING"
      : knownValues.length === snapshots.length
        ? "COMPLETE"
        : "PARTIAL";
    const counts = {
      sourceReported: 0,
      measured: 0,
      estimated: 0,
      userEntered: 0,
      userConfirmed: 0,
      trace: 0,
      missing: 0,
      legacyKnown: 0,
      legacyMissing: 0,
    };
    for (const snapshot of snapshots) {
      const status = snapshot.schemaVersion === "NUTRITION_FACT_SNAPSHOT_V2"
        ? snapshot.facts[field].status
        : null;
      if (status === "SOURCE_REPORTED") counts.sourceReported += 1;
      else if (status === "MEASURED") counts.measured += 1;
      else if (status === "ESTIMATED") counts.estimated += 1;
      else if (status === "USER_ENTERED") counts.userEntered += 1;
      else if (status === "USER_CONFIRMED") counts.userConfirmed += 1;
      else if (status === "TRACE" || status === "USER_ENTERED_TRACE") counts.trace += 1;
      else if (status === "MISSING") counts.missing += 1;
      else if (snapshot.values[field] === null) counts.legacyMissing += 1;
      else counts.legacyKnown += 1;
    }
    factQuality[field] = Object.freeze(counts);
  }
  return Object.freeze({
    snapshotCount: snapshots.length,
    values: Object.freeze(values),
    completeness: Object.freeze(completeness),
    factQuality: Object.freeze(factQuality),
  });
}

function dailyNutritionSummary({ meals, localDate }) {
  if (!Array.isArray(meals)) {
    fail("meals must be an array", { code: "INVALID_MEALS" });
  }
  const date = assertDateKey(localDate);
  const selectedMeals = meals.filter((meal, index) => {
    if (!meal || typeof meal !== "object" || Array.isArray(meal)) {
      fail(`meals[${index}] must be an object`, { code: "INVALID_MEAL" });
    }
    assertSafeObject(meal, `meals[${index}]`);
    assertDateKey(meal.localDate);
    if (meal.localDate !== date) return false;
    assertNutritionSnapshot(meal.nutrition, `meals[${index}].nutrition`);
    return true;
  });
  const aggregate = aggregateNutritionSnapshots(selectedMeals.map((meal) => meal.nutrition));
  const sourceKeys = new Set(selectedMeals.map(({ nutrition }) => `${nutrition.sourceId}\u0000${nutrition.sourceVersion}`));
  const sources = [...sourceKeys].map((key) => {
    const [sourceId, sourceVersion] = key.split("\u0000");
    return Object.freeze({ sourceId, sourceVersion });
  });
  return Object.freeze({
    localDate: date,
    mealCount: selectedMeals.length,
    values: aggregate.values,
    completeness: aggregate.completeness,
    factQuality: aggregate.factQuality,
    sources: Object.freeze(sources),
  });
}

function dailyLedger({ targetKcal, eatenKcal = 0, burnedKcal = 0 }) {
  const eaten = nonNegativeNumber(eatenKcal, "eatenKcal");
  const burned = nonNegativeNumber(burnedKcal, "burnedKcal");
  if (targetKcal === undefined || targetKcal === null) {
    return Object.freeze({
      status: "UNSPECIFIED",
      targetKcal: null,
      eatenKcal: eaten,
      burnedKcal: burned,
      leftKcal: null,
      leftPolicy: "PENDING",
    });
  }
  const target = nonNegativeNumber(targetKcal, "targetKcal");
  return Object.freeze({
    status: "EXPLICIT_TARGET",
    targetKcal: target,
    eatenKcal: eaten,
    burnedKcal: burned,
    leftKcal: null,
    leftPolicy: "PENDING",
  });
}

function cloneState(state) {
  if (!state || typeof state !== "object" || !Array.isArray(state.meals)) {
    fail("state must contain a meals array", { code: "INVALID_STATE" });
  }
  assertSafeObject(state, "state");
  return { meals: state.meals.map((meal) => {
    assertSafeObject(meal, "meal");
    return { ...meal };
  }) };
}

function validateMeal(meal) {
  if (!meal || typeof meal !== "object" || typeof meal.id !== "string" || meal.id.length === 0) {
    fail("meal.id is required", { code: "INVALID_MEAL" });
  }
  assertSafeObject(meal, "meal");
  assertDateKey(meal.localDate);
  nonNegativeNumber(meal.energyKcal, "meal.energyKcal");
  return meal;
}

function transactionalMealMutation(state, mutation) {
  const before = cloneState(state);
  const next = cloneState(state);
  try {
    if (!mutation || typeof mutation !== "object") {
      fail("mutation is required", { code: "INVALID_MUTATION" });
    }
    if (mutation.type === "add") {
      validateMeal(mutation.meal);
      if (next.meals.some((meal) => meal.id === mutation.meal.id)) {
        fail("meal id already exists", { code: "DUPLICATE_MEAL_ID" });
      }
      next.meals.push({ ...mutation.meal });
    } else if (mutation.type === "update") {
      validateMeal(mutation.meal);
      const index = next.meals.findIndex((meal) => meal.id === mutation.meal.id);
      if (index < 0) {
        fail("meal id does not exist", { code: "MISSING_MEAL_ID" });
      }
      next.meals[index] = { ...mutation.meal };
    } else if (mutation.type === "delete") {
      if (typeof mutation.id !== "string" || mutation.id.length === 0) {
        fail("mutation.id is required", { code: "INVALID_MEAL_ID" });
      }
      const index = next.meals.findIndex((meal) => meal.id === mutation.id);
      if (index < 0) {
        fail("meal id does not exist", { code: "MISSING_MEAL_ID" });
      }
      next.meals.splice(index, 1);
    } else {
      fail(`unsupported mutation: ${mutation.type}`, { code: "UNSUPPORTED_MUTATION" });
    }
    return Object.freeze({ committed: true, state: next, error: null });
  } catch (error) {
    return Object.freeze({ committed: false, state: before, error: { code: error.code ?? "INVALID_MUTATION", message: error.message } });
  }
}

function unspecifiedTargetFixture() {
  return Object.freeze({ targetSource: "UNSPECIFIED", macroPolicy: "PENDING", targetKcal: null, ratio: null });
}

export {
  ENERGY_TO_KCAL,
  MASS_TO_GRAMS,
  NUTRIENT_FIELDS,
  dateContext,
  dailyNutritionSummary,
  dailyLedger,
  aggregateNutritionSnapshots,
  normalizeEnergy,
  normalizeMass,
  nutritionSnapshot,
  scaleNutritionSnapshot,
  transactionalMealMutation,
  unspecifiedTargetFixture,
};
