const NUTRIENT_FIELDS = Object.freeze([
  "energyKcal",
  "proteinG",
  "carbohydrateG",
  "fatG",
  "fiberG",
  "sugarG",
  "sodiumMg",
]);

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

function dailyLedger({ targetKcal, eatenKcal = 0, burnedKcal = 0 }) {
  if (targetKcal === undefined || targetKcal === null) {
    return Object.freeze({
      status: "UNSPECIFIED",
      targetKcal: null,
      eatenKcal: 0,
      burnedKcal: 0,
      leftKcal: null,
      leftPolicy: "PENDING",
    });
  }
  const target = nonNegativeNumber(targetKcal, "targetKcal");
  const eaten = nonNegativeNumber(eatenKcal, "eatenKcal");
  const burned = nonNegativeNumber(burnedKcal, "burnedKcal");
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
  return { meals: state.meals.map((meal) => ({ ...meal })) };
}

function validateMeal(meal) {
  if (!meal || typeof meal !== "object" || typeof meal.id !== "string" || meal.id.length === 0) {
    fail("meal.id is required", { code: "INVALID_MEAL" });
  }
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
  dailyLedger,
  normalizeEnergy,
  normalizeMass,
  nutritionSnapshot,
  transactionalMealMutation,
  unspecifiedTargetFixture,
};
