import { dailyNutritionSummary } from "./domain-contract-harness.mjs";
import { normalizeNutritionFactSnapshot } from "./nutrition-fact-snapshot-harness.mjs";

const STATUSES = Object.freeze({
  EDITING: "EDITING",
  REVIEW_READY: "REVIEW_READY",
  SAVING: "SAVING",
  SAVE_FAILED: "SAVE_FAILED",
  SAVED: "SAVED",
});

const NUTRIENT_FIELDS = Object.freeze([
  "energyKcal",
  "proteinG",
  "carbohydrateG",
  "fatG",
  "fiberG",
  "sugarG",
  "sodiumMg",
]);

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function assertSerializableValue(value, field, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_STATE_VALUE", { field });
    return value;
  }
  if (!value || typeof value !== "object") {
    fail(`${field} must be serializable`, "INVALID_STATE_VALUE", { field });
  }
  if (seen.has(value)) fail(`${field} must not contain cycles`, "INVALID_STATE_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertSerializableValue(child, `${field}[${index}]`, seen));
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      fail(`${field} must contain only plain records`, "INVALID_STATE_VALUE", { field });
    }
    for (const [key, child] of Object.entries(value)) {
      if (new Set(["__proto__", "prototype", "constructor"]).has(key)) {
        fail(`${field} contains an unsafe key`, "INVALID_STATE_VALUE", { field });
      }
      assertSerializableValue(child, `${field}.${key}`, seen);
    }
  }
  seen.delete(value);
  return value;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(clone(value));
}

function assertRecord(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be an object`, "INVALID_RECORD", { field });
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${field} must be a plain object`, "INVALID_RECORD", { field });
  }
  return value;
}

function assertNonEmptyString(value, field, code) {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${field} is required`, code, { field });
  }
  return value;
}

function normalizeMeal(meal, field = "meal") {
  assertRecord(meal, field);
  assertNonEmptyString(meal.id, `${field}.id`, "MISSING_MEAL_ID");
  const nutrition = meal.nutrition?.schemaVersion === "NUTRITION_FACT_SNAPSHOT_V2"
    ? normalizeNutritionFactSnapshot(meal.nutrition)
    : (() => {
      const values = Object.fromEntries(NUTRIENT_FIELDS.map((nutrient) => [
        nutrient,
        meal.nutrition.values[nutrient],
      ]));
      return immutable({
        sourceId: meal.nutrition.sourceId,
        sourceVersion: meal.nutrition.sourceVersion,
        values,
        missingFields: NUTRIENT_FIELDS.filter((nutrient) => values[nutrient] === null),
      });
    })();
  const summary = dailyNutritionSummary({
    localDate: meal.localDate,
    meals: [{ id: meal.id, localDate: meal.localDate, nutrition }],
  });
  if (summary.mealCount !== 1) fail("meal date is invalid", "INVALID_MEAL_DATE");
  return immutable({
    id: meal.id,
    localDate: meal.localDate,
    nutrition,
  });
}

function baseState({ status = STATUSES.EDITING, draft = null } = {}) {
  return immutable({
    status,
    draft,
    validationError: null,
    previewSummary: null,
    pendingCommand: null,
    pendingAttempt: null,
    pendingFingerprint: null,
    saveError: null,
    receipt: null,
    committedSummary: null,
  });
}

function assertState(state) {
  assertRecord(state, "state");
  assertSerializableValue(state, "state");
  if (!Object.values(STATUSES).includes(state.status)) {
    fail("state status is invalid", "INVALID_STATE_STATUS");
  }
  return state;
}

function createManualMealEntryState({ draft = null } = {}) {
  if (draft !== null) assertSerializableValue(draft, "draft");
  return baseState({ draft: draft === null ? null : clone(draft) });
}

function editManualMealDraft(state, draft) {
  assertState(state);
  if (state.status === STATUSES.SAVED || state.status === STATUSES.SAVING) {
    fail("draft cannot be edited in the current state", "INVALID_TRANSITION");
  }
  if (state.status === STATUSES.SAVE_FAILED && state.saveError?.outcome === "UNKNOWN") {
    fail("commit outcome must be reconciled before editing", "COMMIT_OUTCOME_UNKNOWN");
  }
  assertSerializableValue(draft, "draft");
  return baseState({ draft: clone(draft) });
}

function reviewManualMeal(state) {
  assertState(state);
  if (state.status !== STATUSES.EDITING) {
    fail("only an editing draft can be reviewed", "INVALID_TRANSITION");
  }
  try {
    const draft = normalizeMeal(state.draft, "draft");
    const previewSummary = dailyNutritionSummary({
      localDate: draft.localDate,
      meals: [draft],
    });
    return immutable({
      ...baseState({ status: STATUSES.REVIEW_READY, draft }),
      previewSummary,
    });
  } catch (error) {
    return immutable({
      ...baseState({ draft: state.draft }),
      validationError: {
        code: error.code ?? "INVALID_DRAFT",
        field: error.field ?? null,
      },
    });
  }
}

function requestManualMealSave(state, { commandId } = {}) {
  assertState(state);
  if (state.status === STATUSES.SAVING) {
    return immutable({ state, effect: null });
  }
  if (state.status !== STATUSES.REVIEW_READY) {
    fail("only a reviewed draft can be saved", "INVALID_TRANSITION");
  }
  assertNonEmptyString(commandId, "commandId", "MISSING_COMMAND_ID");
  const command = immutable({ commandId, meal: normalizeMeal(state.draft) });
  const pendingAttempt = 1;
  const pendingFingerprint = commandFingerprint(command);
  const savingState = immutable({
    ...baseState({ status: STATUSES.SAVING, draft: state.draft }),
    previewSummary: state.previewSummary,
    pendingCommand: command,
    pendingAttempt,
    pendingFingerprint,
  });
  return immutable({
    state: savingState,
    effect: {
      type: "SAVE_MANUAL_MEAL",
      command,
      attempt: pendingAttempt,
      fingerprint: pendingFingerprint,
    },
  });
}

function retryManualMealSave(state) {
  assertState(state);
  if (state.status !== STATUSES.SAVE_FAILED || !state.pendingCommand) {
    fail("only a failed save can be retried", "INVALID_TRANSITION");
  }
  if (state.saveError?.retryable !== true) {
    fail("the failed save is not retryable", "SAVE_NOT_RETRYABLE");
  }
  const pendingAttempt = state.pendingAttempt + 1;
  const savingState = immutable({
    ...baseState({ status: STATUSES.SAVING, draft: state.draft }),
    previewSummary: state.previewSummary,
    pendingCommand: state.pendingCommand,
    pendingAttempt,
    pendingFingerprint: state.pendingFingerprint,
  });
  return immutable({
    state: savingState,
    effect: {
      type: "SAVE_MANUAL_MEAL",
      command: state.pendingCommand,
      attempt: pendingAttempt,
      fingerprint: state.pendingFingerprint,
    },
  });
}

function normalizeFailure(error, { allowNotCommitted = true } = {}) {
  const outcome = allowNotCommitted && error?.outcome === "NOT_COMMITTED"
    ? "NOT_COMMITTED"
    : "UNKNOWN";
  return immutable({
    outcome,
    code: typeof error?.code === "string" ? error.code : "REPOSITORY_FAILURE",
    retryable: outcome === "UNKNOWN" || error?.retryable !== false,
  });
}

function validateReceipt(receipt, command) {
  assertRecord(receipt, "receipt");
  if (receipt.commandId !== command.commandId) fail("receipt commandId mismatch", "INVALID_RECEIPT");
  if (!new Set(["COMMITTED", "REPLAYED"]).has(receipt.disposition)) {
    fail("receipt disposition is invalid", "INVALID_RECEIPT");
  }
  if (receipt.entryId !== command.meal.id || receipt.localDate !== command.meal.localDate) {
    fail("receipt meal identity mismatch", "INVALID_RECEIPT");
  }
  return immutable({
    commandId: receipt.commandId,
    disposition: receipt.disposition,
    entryId: receipt.entryId,
    localDate: receipt.localDate,
  });
}

function validateCommittedSummary(summary, command) {
  assertRecord(summary, "committedSummary");
  if (summary.localDate !== command.meal.localDate) {
    fail("committed summary date mismatch", "INVALID_COMMITTED_SUMMARY");
  }
  if (!Number.isInteger(summary.mealCount) || summary.mealCount < 1) {
    fail("committed summary meal count is invalid", "INVALID_COMMITTED_SUMMARY");
  }
  assertRecord(summary.values, "committedSummary.values");
  assertRecord(summary.completeness, "committedSummary.completeness");
  const values = {};
  const completeness = {};
  for (const field of NUTRIENT_FIELDS) {
    const value = summary.values[field];
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      fail("committed summary nutrient is invalid", "INVALID_COMMITTED_SUMMARY", { field });
    }
    if (!new Set(["MISSING", "PARTIAL", "COMPLETE"]).has(summary.completeness[field])) {
      fail("committed summary completeness is invalid", "INVALID_COMMITTED_SUMMARY", { field });
    }
    if (value === null && summary.completeness[field] !== "MISSING") {
      fail("missing summary value has inconsistent completeness", "INVALID_COMMITTED_SUMMARY", { field });
    }
    values[field] = value;
    completeness[field] = summary.completeness[field];
  }
  if (!Array.isArray(summary.sources)) {
    fail("committed summary sources are invalid", "INVALID_COMMITTED_SUMMARY");
  }
  const sources = summary.sources.map((source, index) => {
    assertRecord(source, `committedSummary.sources[${index}]`);
    return immutable({
      sourceId: assertNonEmptyString(
        source.sourceId,
        `sources[${index}].sourceId`,
        "INVALID_COMMITTED_SUMMARY",
      ),
      sourceVersion: assertNonEmptyString(
        source.sourceVersion,
        `sources[${index}].sourceVersion`,
        "INVALID_COMMITTED_SUMMARY",
      ),
    });
  });
  const hasCommandSource = sources.some((source) => (
    source.sourceId === command.meal.nutrition.sourceId
      && source.sourceVersion === command.meal.nutrition.sourceVersion
  ));
  if (!hasCommandSource) {
    fail("committed summary omits the saved meal source", "INVALID_COMMITTED_SUMMARY");
  }
  for (const field of NUTRIENT_FIELDS) {
    const commandValue = command.meal.nutrition.values[field];
    if (commandValue !== null && (values[field] === null || values[field] < commandValue)) {
      fail("committed summary omits saved meal nutrition", "INVALID_COMMITTED_SUMMARY", { field });
    }
  }
  if (summary.mealCount === 1) {
    const expected = dailyNutritionSummary({
      localDate: command.meal.localDate,
      meals: [command.meal],
    });
    if (JSON.stringify({ values, completeness, sources }) !== JSON.stringify({
      values: expected.values,
      completeness: expected.completeness,
      sources: expected.sources,
    })) {
      fail("single-meal summary differs from the saved meal", "INVALID_COMMITTED_SUMMARY");
    }
  }
  return immutable({
    localDate: summary.localDate,
    mealCount: summary.mealCount,
    values,
    completeness,
    sources,
  });
}

function validateListedMeals(meals, command) {
  if (!Array.isArray(meals)) fail("repository query must return an array", "INVALID_REPOSITORY_RESULT");
  const normalized = meals.map((meal, index) => normalizeMeal(meal, `meals[${index}]`));
  const ids = new Set();
  for (const meal of normalized) {
    if (meal.localDate !== command.meal.localDate) {
      fail("repository returned a meal for another date", "INVALID_REPOSITORY_RESULT");
    }
    if (ids.has(meal.id)) fail("repository returned duplicate meal ids", "INVALID_REPOSITORY_RESULT");
    ids.add(meal.id);
  }
  if (!ids.has(command.meal.id)) fail("saved meal is absent from repository query", "INVALID_REPOSITORY_RESULT");
  const savedMeal = normalized.find(({ id }) => id === command.meal.id);
  if (mealFingerprint(savedMeal) !== mealFingerprint(command.meal)) {
    fail("repository changed the saved nutrition snapshot", "INVALID_REPOSITORY_RESULT");
  }
  return immutable(normalized);
}

async function executeManualMealSave(repository, effect) {
  if (!repository || (typeof repository !== "object" && typeof repository !== "function")) {
    fail("repository must be an object", "INVALID_REPOSITORY_PORT");
  }
  assertRecord(effect, "effect");
  if (effect.type !== "SAVE_MANUAL_MEAL") fail("effect type is invalid", "INVALID_EFFECT");
  if (typeof repository.saveManualMeal !== "function" || typeof repository.listMealsByLocalDate !== "function") {
    fail("repository does not implement the manual meal port", "INVALID_REPOSITORY_PORT");
  }
  const command = immutable({
    commandId: assertNonEmptyString(effect.command?.commandId, "commandId", "MISSING_COMMAND_ID"),
    meal: normalizeMeal(effect.command?.meal),
  });
  if (!Number.isInteger(effect.attempt) || effect.attempt < 1) {
    fail("effect attempt is invalid", "INVALID_EFFECT");
  }
  const fingerprint = commandFingerprint(command);
  if (effect.fingerprint !== fingerprint) fail("effect fingerprint mismatch", "INVALID_EFFECT");
  const outcomeContext = immutable({
    commandId: command.commandId,
    attempt: effect.attempt,
    fingerprint,
  });
  let rawReceipt;
  try {
    rawReceipt = await repository.saveManualMeal(command);
  } catch (error) {
    return immutable({
      status: "FAILURE",
      ...outcomeContext,
      receipt: null,
      committedSummary: null,
      error: normalizeFailure(error),
    });
  }
  let receipt;
  try {
    receipt = validateReceipt(rawReceipt, command);
  } catch (error) {
    return immutable({
      status: "FAILURE",
      ...outcomeContext,
      receipt: null,
      committedSummary: null,
      error: normalizeFailure(error, { allowNotCommitted: false }),
    });
  }
  try {
    const meals = validateListedMeals(
      await repository.listMealsByLocalDate(command.meal.localDate),
      command,
    );
    const committedSummary = dailyNutritionSummary({
      localDate: command.meal.localDate,
      meals,
    });
    return immutable({
      status: "SUCCESS",
      ...outcomeContext,
      receipt,
      committedSummary,
      error: null,
    });
  } catch (error) {
    return immutable({
      status: "FAILURE",
      ...outcomeContext,
      receipt: null,
      committedSummary: null,
      error: normalizeFailure(error, { allowNotCommitted: false }),
    });
  }
}

function settleManualMealSave(state, outcome) {
  assertState(state);
  assertRecord(outcome, "outcome");
  if (state.status !== STATUSES.SAVING || !state.pendingCommand) {
    fail("save outcome is not expected in the current state", "INVALID_TRANSITION");
  }
  if (outcome.commandId !== state.pendingCommand.commandId) {
    fail("save outcome belongs to another command", "STALE_SAVE_OUTCOME");
  }
  if (outcome.attempt !== state.pendingAttempt || outcome.fingerprint !== state.pendingFingerprint) {
    fail("save outcome belongs to another attempt", "STALE_SAVE_OUTCOME");
  }
  if (outcome.status === "SUCCESS") {
    const receipt = validateReceipt(outcome.receipt, state.pendingCommand);
    const committedSummary = validateCommittedSummary(outcome.committedSummary, state.pendingCommand);
    return immutable({
      ...baseState({ status: STATUSES.SAVED, draft: state.draft }),
      previewSummary: state.previewSummary,
      receipt,
      committedSummary,
    });
  }
  if (outcome.status !== "FAILURE") fail("save outcome status is invalid", "INVALID_SAVE_OUTCOME");
  const saveError = normalizeFailure(outcome.error);
  return immutable({
    ...baseState({ status: STATUSES.SAVE_FAILED, draft: state.draft }),
    previewSummary: state.previewSummary,
    pendingCommand: state.pendingCommand,
    pendingAttempt: state.pendingAttempt,
    pendingFingerprint: state.pendingFingerprint,
    saveError,
  });
}

function mealFingerprint(meal) {
  return JSON.stringify({
    id: meal.id,
    localDate: meal.localDate,
    nutrition: meal.nutrition,
  });
}

function commandFingerprint(command) {
  return JSON.stringify({ commandId: command.commandId, meal: mealFingerprint(command.meal) });
}

function repositoryError(code, outcome, retryable = true) {
  const error = new Error(code);
  Object.assign(error, { code, outcome, retryable });
  return error;
}

function createInMemoryManualMealRepository({ meals = [], failurePlan = [] } = {}) {
  if (!Array.isArray(failurePlan) || failurePlan.some((failure) => !new Set([
    "BEFORE_COMMIT",
    "AFTER_COMMIT",
  ]).has(failure))) {
    fail("failurePlan contains an unsupported fault", "INVALID_FAILURE_PLAN");
  }
  let records = validateInitialMeals(meals);
  let idempotency = new Map();
  const plannedFailures = [...failurePlan];
  const calls = { save: 0, list: 0 };

  function validateInitialMeals(initialMeals) {
    if (!Array.isArray(initialMeals)) fail("initial meals must be an array", "INVALID_MEALS");
    const normalized = initialMeals.map((meal, index) => normalizeMeal(meal, `meals[${index}]`));
    if (new Set(normalized.map(({ id }) => id)).size !== normalized.length) {
      fail("initial meals contain duplicate ids", "DUPLICATE_MEAL_ID");
    }
    return normalized.map(clone);
  }

  async function saveManualMeal(input) {
    calls.save += 1;
    const command = immutable({
      commandId: assertNonEmptyString(input?.commandId, "commandId", "MISSING_COMMAND_ID"),
      meal: normalizeMeal(input?.meal),
    });
    const fingerprint = commandFingerprint(command);
    const prior = idempotency.get(command.commandId);
    if (prior) {
      if (prior.fingerprint !== fingerprint) {
        throw repositoryError("IDEMPOTENCY_CONFLICT", "NOT_COMMITTED", false);
      }
      return immutable({ ...prior.receipt, disposition: "REPLAYED" });
    }
    if (records.some(({ id }) => id === command.meal.id)) {
      throw repositoryError("DUPLICATE_MEAL_ID", "NOT_COMMITTED", false);
    }
    const failure = plannedFailures.shift() ?? null;
    if (failure === "BEFORE_COMMIT") {
      throw repositoryError("INJECTED_BEFORE_COMMIT", "NOT_COMMITTED");
    }
    const receipt = immutable({
      commandId: command.commandId,
      disposition: "COMMITTED",
      entryId: command.meal.id,
      localDate: command.meal.localDate,
    });
    const nextRecords = [...records.map(clone), clone(command.meal)];
    const nextIdempotency = new Map(idempotency);
    nextIdempotency.set(command.commandId, { fingerprint, receipt: clone(receipt) });
    records = nextRecords;
    idempotency = nextIdempotency;
    if (failure === "AFTER_COMMIT") {
      throw repositoryError("INJECTED_AFTER_COMMIT", "UNKNOWN");
    }
    return receipt;
  }

  async function listMealsByLocalDate(localDate) {
    calls.list += 1;
    dailyNutritionSummary({ localDate, meals: [] });
    return immutable(records.filter((meal) => meal.localDate === localDate));
  }

  function snapshot() {
    return immutable({
      meals: records,
      commandIds: [...idempotency.keys()],
      calls,
      pendingFailures: plannedFailures,
    });
  }

  return Object.freeze({ saveManualMeal, listMealsByLocalDate, snapshot });
}

export {
  STATUSES,
  createInMemoryManualMealRepository,
  createManualMealEntryState,
  editManualMealDraft,
  executeManualMealSave,
  requestManualMealSave,
  retryManualMealSave,
  reviewManualMeal,
  settleManualMealSave,
};
