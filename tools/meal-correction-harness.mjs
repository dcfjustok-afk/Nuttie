import { isDeepStrictEqual } from "node:util";

import { dailyNutritionSummary } from "./domain-contract-harness.mjs";
import { normalizeNutritionFactSnapshot } from "./local-food-catalog-harness.mjs";
import { NUTRIENT_FIELDS } from "./nutrition-fields.mjs";

const STATUSES = Object.freeze({
  EDITING: "EDITING",
  REVIEW_READY: "REVIEW_READY",
  SAVING: "SAVING",
  SAVE_FAILED: "SAVE_FAILED",
  SAVED: "SAVED",
});

const CHANGE_KINDS = Object.freeze(["EDIT", "MOVE", "DELETE"]);
const FAILURE_POINTS = new Set(["BEFORE_COMMIT", "AFTER_COMMIT"]);
const STATE_KEYS = Object.freeze([
  "baseline",
  "committedBeforeDays",
  "committedDays",
  "context",
  "draft",
  "pendingAttempt",
  "pendingCommand",
  "pendingFingerprint",
  "preview",
  "receipt",
  "saveError",
  "status",
  "validationError",
]);

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

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !Object.hasOwn(value, key))
    || Object.keys(value).some((key) => !allowed.has(key))) {
    fail(`${field} has an unexpected shape`, code, { field });
  }
}

function assertSafeSerializable(value, field, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_STATE_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object") {
    fail(`${field} is not serializable`, "INVALID_STATE_VALUE", { field });
  }
  if (seen.has(value)) fail(`${field} contains a cycle`, "INVALID_STATE_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertSafeSerializable(child, `${field}[${index}]`, seen));
  } else {
    assertPlainRecord(value, field, "INVALID_STATE_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (new Set(["__proto__", "prototype", "constructor"]).has(key)) {
        fail(`${field} contains an unsafe key`, "INVALID_STATE_VALUE", { field, key });
      }
      assertSafeSerializable(child, `${field}.${key}`, seen);
    }
  }
  seen.delete(value);
}

function assertText(value, field, code = "INVALID_IDENTIFIER") {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 256) {
    fail(`${field} is invalid`, code, { field });
  }
  return value;
}

function assertDate(value, field = "localDate") {
  try {
    dailyNutritionSummary({ localDate: value, meals: [] });
  } catch (error) {
    fail(`${field} is invalid`, "INVALID_DATE_KEY", { field, cause: error });
  }
  return value;
}

function assertRevision(value, field = "revision") {
  if (!Number.isInteger(value) || value < 1) {
    fail(`${field} must be a positive integer`, "INVALID_REVISION", { field });
  }
  return value;
}

function canonicalStringify(value) {
  assertSafeSerializable(value, "canonicalValue");
  if (typeof value === "number" && Object.is(value, -0)) return "-0";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalStringify(value[key])}`
  )).join(",")}}`;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function clone(value, seen = new Map(), nutritionTrustContext = null) {
  if (value === null || typeof value !== "object") return value;
  if (value.schemaVersion === "NUTRITION_FACT_SNAPSHOT_V2") {
    return normalizeNutritionFactSnapshot(value, { trustContext: nutritionTrustContext });
  }
  if (seen.has(value)) return seen.get(value);
  const output = Array.isArray(value) ? [] : {};
  seen.set(value, output);
  for (const [key, child] of Object.entries(value)) {
    output[key] = clone(child, seen, nutritionTrustContext);
  }
  return output;
}

function immutable(value, nutritionTrustContext = null) {
  assertSafeSerializable(value, "value");
  return deepFreeze(clone(value, new Map(), nutritionTrustContext));
}

function normalizeBasicNutrition(input, field) {
  assertExactKeys(input, ["missingFields", "sourceId", "sourceVersion", "values"], [], field, "INVALID_NUTRITION_SNAPSHOT");
  assertText(input.sourceId, `${field}.sourceId`, "MISSING_SOURCE_ID");
  assertText(input.sourceVersion, `${field}.sourceVersion`, "MISSING_SOURCE_VERSION");
  assertExactKeys(input.values, NUTRIENT_FIELDS, [], `${field}.values`, "INVALID_NUTRITION_SNAPSHOT");
  const values = Object.fromEntries(NUTRIENT_FIELDS.map((nutrient) => {
    const value = input.values[nutrient];
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
      fail(`${field}.values.${nutrient} is invalid`, "INVALID_NUTRITION_SNAPSHOT", {
        field: `${field}.values.${nutrient}`,
      });
    }
    return [nutrient, value];
  }));
  const missingFields = NUTRIENT_FIELDS.filter((nutrient) => values[nutrient] === null);
  if (!isDeepStrictEqual(input.missingFields, missingFields)) {
    fail(`${field}.missingFields is inconsistent`, "INVALID_NUTRITION_SNAPSHOT", { field });
  }
  return { sourceId: input.sourceId, sourceVersion: input.sourceVersion, values, missingFields };
}

function normalizeNutrition(input, field, nutritionTrustContext) {
  assertPlainRecord(input, field, "INVALID_NUTRITION_SNAPSHOT");
  if (input.schemaVersion !== undefined && input.schemaVersion !== "NUTRITION_FACT_SNAPSHOT_V2") {
    fail(`${field}.schemaVersion is unsupported`, "UNSUPPORTED_NUTRITION_SNAPSHOT", { field });
  }
  return input.schemaVersion === "NUTRITION_FACT_SNAPSHOT_V2"
    ? normalizeNutritionFactSnapshot(input, { trustContext: nutritionTrustContext })
    : normalizeBasicNutrition(input, field);
}

function normalizeMealRecord(input, field = "meal", { nutritionTrustContext = null } = {}) {
  assertExactKeys(
    input,
    ["id", "localDate", "mealSlotId", "nutrition", "revision"],
    [],
    field,
    "INVALID_MEAL_RECORD",
  );
  const id = assertText(input.id, `${field}.id`, "INVALID_MEAL_ID");
  const localDate = assertDate(input.localDate, `${field}.localDate`);
  const mealSlotId = input.mealSlotId === null
    ? null
    : assertText(input.mealSlotId, `${field}.mealSlotId`, "INVALID_MEAL_SLOT_ID");
  const nutrition = normalizeNutrition(input.nutrition, `${field}.nutrition`, nutritionTrustContext);
  const normalized = {
    id,
    revision: assertRevision(input.revision, `${field}.revision`),
    localDate,
    mealSlotId,
    nutrition,
  };
  const summary = dailyNutritionSummary({ localDate, meals: [normalized] });
  if (summary.mealCount !== 1) fail(`${field} cannot be summarized`, "INVALID_MEAL_RECORD", { field });
  return immutable(normalized, nutritionTrustContext);
}

function normalizeDayView(input, field, options) {
  assertExactKeys(input, ["localDate", "meals"], [], field, "INVALID_DAY_VIEW");
  const localDate = assertDate(input.localDate, `${field}.localDate`);
  if (!Array.isArray(input.meals)) fail(`${field}.meals must be an array`, "INVALID_DAY_VIEW", { field });
  const meals = input.meals.map((meal, index) => normalizeMealRecord(
    meal,
    `${field}.meals[${index}]`,
    options,
  ));
  const ids = new Set();
  for (const meal of meals) {
    if (meal.localDate !== localDate) fail(`${field} contains another date`, "DAY_VIEW_DATE_MISMATCH", { field });
    if (ids.has(meal.id)) fail(`${field} contains duplicate ids`, "DUPLICATE_MEAL_ID", { field });
    ids.add(meal.id);
  }
  meals.sort((left, right) => left.id.localeCompare(right.id, "en"));
  return immutable({ localDate, meals }, options.nutritionTrustContext);
}

function assertGloballyUniqueMealIds(days, field, code = "DUPLICATE_MEAL_ID") {
  const ids = days.flatMap(({ meals }) => meals.map(({ id }) => id));
  if (new Set(ids).size !== ids.length) fail(`${field} contains duplicate meal ids`, code, { field });
}

function normalizeContext(input, options = {}) {
  assertExactKeys(input, ["days", "entry"], [], "context", "INVALID_CORRECTION_CONTEXT");
  if (!Array.isArray(input.days) || input.days.length === 0) {
    fail("context.days must be non-empty", "INVALID_CORRECTION_CONTEXT");
  }
  const entry = normalizeMealRecord(input.entry, "context.entry", options);
  const days = input.days.map((day, index) => normalizeDayView(day, `context.days[${index}]`, options));
  if (new Set(days.map(({ localDate }) => localDate)).size !== days.length) {
    fail("context contains duplicate day views", "DUPLICATE_DAY_VIEW");
  }
  assertGloballyUniqueMealIds(days, "context");
  const allMeals = days.flatMap(({ meals }) => meals);
  const matching = allMeals.filter(({ id }) => id === entry.id);
  if (matching.length !== 1 || !isDeepStrictEqual(matching[0], entry)) {
    fail("context entry is not the unique source-day record", "CONTEXT_ENTRY_MISMATCH");
  }
  return immutable({ entry, days }, options.nutritionTrustContext);
}

function normalizeChange(input, baseline, { nutritionTrustContext = null } = {}) {
  assertPlainRecord(input, "change", "INVALID_CORRECTION_CHANGE");
  if (!CHANGE_KINDS.includes(input.kind)) fail("change.kind is unsupported", "INVALID_CORRECTION_CHANGE");
  if (input.kind === "EDIT") {
    assertExactKeys(input, ["kind", "nutrition"], [], "change", "INVALID_CORRECTION_CHANGE");
    const nutrition = normalizeNutrition(input.nutrition, "change.nutrition", nutritionTrustContext);
    if (isDeepStrictEqual(nutrition, baseline.nutrition)) fail("edit has no changes", "NO_CHANGES");
    if (baseline.nutrition.schemaVersion === "NUTRITION_FACT_SNAPSHOT_V2"
      && nutrition.schemaVersion !== "NUTRITION_FACT_SNAPSHOT_V2") {
      fail("V2 nutrition cannot be downgraded", "V2_DOWNGRADE_FORBIDDEN");
    }
    if (baseline.nutrition.sourceKind !== undefined
      && baseline.nutrition.sourceKind !== "USER"
      && nutrition.sourceKind !== "USER") {
      fail("pack nutrition edits must become user-confirmed facts", "PACK_EDIT_MUST_BECOME_USER");
    }
    if (baseline.nutrition.sourceKind !== undefined
      && baseline.nutrition.sourceKind !== "USER"
      && NUTRIENT_FIELDS.some((field) => (
        !new Set(["USER_CONFIRMED", "MISSING"]).has(nutrition.facts[field].status)
      ))) {
      fail(
        "pack nutrition edits must contain only user-confirmed or missing facts",
        "PACK_EDIT_MUST_BE_USER_CONFIRMED",
      );
    }
    return immutable({ kind: "EDIT", nutrition }, nutritionTrustContext);
  }
  if (input.kind === "MOVE") {
    assertExactKeys(
      input,
      ["kind", "targetLocalDate", "targetMealSlotId"],
      [],
      "change",
      "INVALID_CORRECTION_CHANGE",
    );
    const targetLocalDate = assertDate(input.targetLocalDate, "change.targetLocalDate");
    const targetMealSlotId = input.targetMealSlotId === null
      ? null
      : assertText(input.targetMealSlotId, "change.targetMealSlotId", "INVALID_MEAL_SLOT_ID");
    if (targetLocalDate === baseline.localDate && targetMealSlotId === baseline.mealSlotId) {
      fail("move has no changes", "NO_CHANGES");
    }
    return immutable({ kind: "MOVE", targetLocalDate, targetMealSlotId });
  }
  assertExactKeys(input, ["kind"], [], "change", "INVALID_CORRECTION_CHANGE");
  return immutable({ kind: "DELETE" });
}

function affectedDates(baseline, change) {
  return [...new Set([
    baseline.localDate,
    ...(change.kind === "MOVE" ? [change.targetLocalDate] : []),
  ])].sort();
}

function expectedAfterEntry(baseline, change, nutritionTrustContext = null) {
  if (change.kind === "DELETE") return null;
  return immutable({
    ...baseline,
    revision: baseline.revision + 1,
    localDate: change.kind === "MOVE" ? change.targetLocalDate : baseline.localDate,
    mealSlotId: change.kind === "MOVE" ? change.targetMealSlotId : baseline.mealSlotId,
    nutrition: change.kind === "EDIT" ? change.nutrition : baseline.nutrition,
  }, nutritionTrustContext);
}

function mergeDayViews(contextDays, additions, options) {
  const map = new Map(contextDays.map((day) => [day.localDate, day]));
  if (additions !== undefined) {
    if (!Array.isArray(additions)) fail("dayViews must be an array", "INVALID_DAY_VIEW");
    additions.forEach((day, index) => {
      const normalized = normalizeDayView(day, `dayViews[${index}]`, options);
      const current = map.get(normalized.localDate);
      if (current && !isDeepStrictEqual(current, normalized)) {
        fail("day view contradicts correction context", "DAY_VIEW_CONFLICT", {
          localDate: normalized.localDate,
        });
      }
      map.set(normalized.localDate, normalized);
    });
  }
  assertGloballyUniqueMealIds([...map.values()], "dayViews");
  return map;
}

function contextWithDayViews(context, additions, options) {
  const days = [...mergeDayViews(context.days, additions, options).values()]
    .sort((left, right) => left.localDate.localeCompare(right.localDate, "en"));
  return normalizeContext({ entry: context.entry, days }, options);
}

function summarizeDay(day) {
  return dailyNutritionSummary({ localDate: day.localDate, meals: day.meals });
}

function buildPreview(context, change, dayViews, options) {
  const map = mergeDayViews(context.days, dayViews, options);
  const dates = affectedDates(context.entry, change);
  for (const date of dates) {
    if (!map.has(date)) fail(`day view ${date} is missing`, "MISSING_DAY_VIEW", { localDate: date });
  }
  const afterEntry = expectedAfterEntry(context.entry, change, options.nutritionTrustContext);
  const affected = dates.map((localDate) => {
    const before = map.get(localDate);
    let afterMeals = before.meals.filter(({ id }) => id !== context.entry.id);
    if (afterEntry && afterEntry.localDate === localDate) {
      afterMeals = [...afterMeals, afterEntry];
    }
    const after = normalizeDayView(
      { localDate, meals: afterMeals },
      `preview.afterDays.${localDate}`,
      options,
    );
    return {
      localDate,
      beforeSummary: summarizeDay(before),
      afterSummary: summarizeDay(after),
    };
  });
  return immutable({ kind: change.kind, afterEntry, affectedDays: affected }, options.nutritionTrustContext);
}

function baseState({ status = STATUSES.EDITING, context, draft = null } = {}, nutritionTrustContext = null) {
  return immutable({
    status,
    context,
    baseline: context.entry,
    draft,
    validationError: null,
    preview: null,
    pendingCommand: null,
    pendingAttempt: null,
    pendingFingerprint: null,
    saveError: null,
    receipt: null,
    committedBeforeDays: null,
    committedDays: null,
  }, nutritionTrustContext);
}

function assertErrorRecord(input, field, { save = false } = {}) {
  assertExactKeys(
    input,
    save ? ["code", "outcome", "retryable"] : ["code", "field"],
    [],
    field,
    "INVALID_CORRECTION_STATE",
  );
  assertText(input.code, `${field}.code`, "INVALID_CORRECTION_STATE");
  if (save) {
    if (!new Set(["NOT_COMMITTED", "UNKNOWN"]).has(input.outcome)
      || typeof input.retryable !== "boolean"
      || (input.outcome === "UNKNOWN" && input.retryable !== true)) {
      fail(`${field} is invalid`, "INVALID_CORRECTION_STATE", { field });
    }
  } else if (input.field !== null && typeof input.field !== "string") {
    fail(`${field}.field is invalid`, "INVALID_CORRECTION_STATE", { field: `${field}.field` });
  }
}

function expectedCommandForState(state, commandId, nutritionTrustContext) {
  return normalizeCommand({
    commandId,
    entryId: state.baseline.id,
    expectedRevision: state.baseline.revision,
    expected: {
      localDate: state.baseline.localDate,
      mealSlotId: state.baseline.mealSlotId,
      nutrition: state.baseline.nutrition,
    },
    change: state.draft,
  }, { nutritionTrustContext });
}

function assertState(state, { nutritionTrustContext = null } = {}) {
  assertExactKeys(state, STATE_KEYS, [], "state", "INVALID_CORRECTION_STATE");
  assertSafeSerializable(state, "state");
  if (!Object.values(STATUSES).includes(state.status)) {
    fail("state.status is invalid", "INVALID_CORRECTION_STATE");
  }
  const normalizedContext = normalizeContext(state.context, { nutritionTrustContext });
  if (!isDeepStrictEqual(state.baseline, normalizedContext.entry)) {
    fail("state baseline does not match its context", "INVALID_CORRECTION_STATE");
  }
  const alwaysNull = ["receipt", "committedBeforeDays", "committedDays"];
  if (state.status !== STATUSES.SAVED && alwaysNull.some((field) => state[field] !== null)) {
    fail("unfinished state contains committed evidence", "INVALID_CORRECTION_STATE");
  }
  if (state.status === STATUSES.EDITING) {
    if (state.preview !== null || state.pendingCommand !== null || state.pendingAttempt !== null
      || state.pendingFingerprint !== null || state.saveError !== null) {
      fail("editing state contains stale save artifacts", "INVALID_CORRECTION_STATE");
    }
    if (state.validationError !== null) assertErrorRecord(state.validationError, "state.validationError");
  }
  let normalizedDraft = null;
  let expectedPreview = null;
  if (state.status !== STATUSES.EDITING) {
    normalizedDraft = normalizeChange(state.draft, state.baseline, { nutritionTrustContext });
    expectedPreview = buildPreview(
      normalizedContext,
      normalizedDraft,
      undefined,
      { nutritionTrustContext },
    );
    if (!isDeepStrictEqual(state.draft, normalizedDraft)
      || !isDeepStrictEqual(state.preview, expectedPreview)) {
      fail("state draft or preview is not derived from its context", "INVALID_CORRECTION_STATE");
    }
  }
  if (state.status === STATUSES.REVIEW_READY) {
    if (state.draft === null || state.preview === null || state.validationError !== null
      || state.pendingCommand !== null || state.pendingAttempt !== null
      || state.pendingFingerprint !== null || state.saveError !== null) {
      fail("review-ready state is incomplete", "INVALID_CORRECTION_STATE");
    }
  }
  if (state.status === STATUSES.SAVING || state.status === STATUSES.SAVE_FAILED) {
    if (state.draft === null || state.preview === null || state.validationError !== null
      || state.pendingCommand === null || !Number.isInteger(state.pendingAttempt)
      || state.pendingAttempt < 1 || typeof state.pendingFingerprint !== "string"
      || (state.status === STATUSES.SAVING ? state.saveError !== null : state.saveError === null)) {
      fail("pending state is incomplete", "INVALID_CORRECTION_STATE");
    }
    const normalizedPending = normalizeCommand(state.pendingCommand, { nutritionTrustContext });
    const expectedPending = expectedCommandForState(
      state,
      normalizedPending.commandId,
      nutritionTrustContext,
    );
    const expectedFingerprint = commandFingerprint(expectedPending);
    if (!isDeepStrictEqual(normalizedPending, expectedPending)
      || state.pendingFingerprint !== expectedFingerprint) {
      fail("pending command is not bound to state", "INVALID_CORRECTION_STATE");
    }
    if (state.status === STATUSES.SAVE_FAILED) assertErrorRecord(state.saveError, "state.saveError", { save: true });
  }
  if (state.status === STATUSES.SAVED) {
    if (state.draft === null || state.preview === null || state.validationError !== null
      || state.pendingCommand !== null || state.pendingAttempt !== null
      || state.pendingFingerprint !== null || state.saveError !== null
      || state.receipt === null || !Array.isArray(state.committedBeforeDays)
      || !Array.isArray(state.committedDays)) {
      fail("saved state is incomplete", "INVALID_CORRECTION_STATE");
    }
    const expectedCommand = expectedCommandForState(state, state.receipt.commandId, nutritionTrustContext);
    validateReceipt(state.receipt, expectedCommand, commandFingerprint(expectedCommand));
    const savedEvidence = validateTransactionEvidence({
      beforeDays: state.committedBeforeDays,
      affectedDays: state.committedDays.map((day, index) => {
        assertExactKeys(
          day,
          ["localDate", "meals", "summary"],
          [],
          `state.committedDays[${index}]`,
          "INVALID_CORRECTION_STATE",
        );
        return { localDate: day.localDate, meals: day.meals };
      }),
    }, expectedCommand, { nutritionTrustContext });
    for (let index = 0; index < savedEvidence.committedDays.length; index += 1) {
      if (!isDeepStrictEqual(
        state.committedDays[index].summary,
        savedEvidence.committedDays[index].summary,
      )) {
        fail("saved summary does not match its meals", "INVALID_CORRECTION_STATE");
      }
    }
  }
  return state;
}

function createMealCorrectionState({ context, nutritionTrustContext = null } = {}) {
  const normalized = normalizeContext(context, { nutritionTrustContext });
  return baseState({ context: normalized }, nutritionTrustContext);
}

function setMealCorrectionDraft(state, change, { nutritionTrustContext = null } = {}) {
  assertState(state, { nutritionTrustContext });
  if (state.status === STATUSES.SAVING || state.status === STATUSES.SAVED) {
    fail("correction cannot be edited now", "INVALID_TRANSITION");
  }
  if (state.status === STATUSES.SAVE_FAILED && state.saveError?.outcome === "UNKNOWN") {
    fail("unknown commit must be reconciled first", "COMMIT_OUTCOME_UNKNOWN");
  }
  assertSafeSerializable(change, "change");
  return baseState({
    context: state.context,
    draft: clone(change, new Map(), nutritionTrustContext),
  }, nutritionTrustContext);
}

function reviewMealCorrection(state, { dayViews, nutritionTrustContext = null } = {}) {
  assertState(state, { nutritionTrustContext });
  if (state.status !== STATUSES.EDITING) fail("only editing corrections can be reviewed", "INVALID_TRANSITION");
  try {
    const reviewContext = contextWithDayViews(
      state.context,
      dayViews,
      { nutritionTrustContext },
    );
    const change = normalizeChange(state.draft, state.baseline, { nutritionTrustContext });
    const preview = buildPreview(
      reviewContext,
      change,
      undefined,
      { nutritionTrustContext },
    );
    return immutable({
      ...baseState({
        status: STATUSES.REVIEW_READY,
        context: reviewContext,
        draft: change,
      }, nutritionTrustContext),
      preview,
    }, nutritionTrustContext);
  } catch (error) {
    return immutable({
      ...baseState({ context: state.context, draft: state.draft }, nutritionTrustContext),
      validationError: { code: error.code ?? "INVALID_CORRECTION", field: error.field ?? null },
    }, nutritionTrustContext);
  }
}

function commandFingerprint(command) {
  return canonicalStringify(command);
}

function normalizeExpected(input, field, options) {
  assertExactKeys(
    input,
    ["localDate", "mealSlotId", "nutrition"],
    [],
    field,
    "INVALID_CORRECTION_COMMAND",
  );
  return {
    localDate: assertDate(input.localDate, `${field}.localDate`),
    mealSlotId: input.mealSlotId === null
      ? null
      : assertText(input.mealSlotId, `${field}.mealSlotId`, "INVALID_MEAL_SLOT_ID"),
    nutrition: normalizeNutrition(input.nutrition, `${field}.nutrition`, options.nutritionTrustContext),
  };
}

function normalizeCommand(input, options = {}) {
  assertExactKeys(
    input,
    ["change", "commandId", "entryId", "expected", "expectedRevision"],
    [],
    "command",
    "INVALID_CORRECTION_COMMAND",
  );
  const baseline = normalizeMealRecord({
    id: input.entryId,
    revision: input.expectedRevision,
    ...normalizeExpected(input.expected, "command.expected", options),
  }, "command.baseline", options);
  const change = normalizeChange(input.change, baseline, options);
  return immutable({
    commandId: assertText(input.commandId, "command.commandId", "MISSING_COMMAND_ID"),
    entryId: baseline.id,
    expectedRevision: baseline.revision,
    expected: {
      localDate: baseline.localDate,
      mealSlotId: baseline.mealSlotId,
      nutrition: baseline.nutrition,
    },
    change,
  }, options.nutritionTrustContext);
}

function requestMealCorrectionSave(state, { commandId, nutritionTrustContext = null } = {}) {
  assertState(state, { nutritionTrustContext });
  if (state.status === STATUSES.SAVING) return immutable({ state, effect: null }, nutritionTrustContext);
  if (state.status !== STATUSES.REVIEW_READY) fail("correction must be reviewed first", "INVALID_TRANSITION");
  const command = normalizeCommand({
    commandId,
    entryId: state.baseline.id,
    expectedRevision: state.baseline.revision,
    expected: {
      localDate: state.baseline.localDate,
      mealSlotId: state.baseline.mealSlotId,
      nutrition: state.baseline.nutrition,
    },
    change: state.draft,
  }, { nutritionTrustContext });
  const fingerprint = commandFingerprint(command);
  const attempt = 1;
  const savingState = immutable({
    ...baseState({
      status: STATUSES.SAVING,
      context: state.context,
      draft: state.draft,
    }, nutritionTrustContext),
    preview: state.preview,
    pendingCommand: command,
    pendingAttempt: attempt,
    pendingFingerprint: fingerprint,
  }, nutritionTrustContext);
  return immutable({
    state: savingState,
    effect: { type: "APPLY_MEAL_CORRECTION", command, attempt, fingerprint },
  }, nutritionTrustContext);
}

function retryMealCorrectionSave(state, { nutritionTrustContext = null } = {}) {
  assertState(state, { nutritionTrustContext });
  if (state.status !== STATUSES.SAVE_FAILED || !state.pendingCommand) {
    fail("only a failed correction can be retried", "INVALID_TRANSITION");
  }
  if (state.saveError?.retryable !== true) fail("correction is not retryable", "SAVE_NOT_RETRYABLE");
  const attempt = state.pendingAttempt + 1;
  const savingState = immutable({
    ...baseState({
      status: STATUSES.SAVING,
      context: state.context,
      draft: state.draft,
    }, nutritionTrustContext),
    preview: state.preview,
    pendingCommand: state.pendingCommand,
    pendingAttempt: attempt,
    pendingFingerprint: state.pendingFingerprint,
  }, nutritionTrustContext);
  return immutable({
    state: savingState,
    effect: {
      type: "APPLY_MEAL_CORRECTION",
      command: state.pendingCommand,
      attempt,
      fingerprint: state.pendingFingerprint,
    },
  }, nutritionTrustContext);
}

function restoreMealCorrectionState(input, { nutritionTrustContext = null } = {}) {
  assertState(input, { nutritionTrustContext });
  return immutable(input, nutritionTrustContext);
}

function repositoryError(code, outcome = "NOT_COMMITTED", retryable = false) {
  const error = new Error(code);
  Object.assign(error, { code, outcome, retryable });
  return error;
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

function validateFailureOutcomeError(input) {
  assertExactKeys(
    input,
    ["code", "outcome", "retryable"],
    [],
    "outcome.error",
    "INVALID_CORRECTION_OUTCOME",
  );
  assertText(input.code, "outcome.error.code", "INVALID_CORRECTION_OUTCOME");
  if (!new Set(["NOT_COMMITTED", "UNKNOWN"]).has(input.outcome)
    || typeof input.retryable !== "boolean"
    || (input.outcome === "UNKNOWN" && input.retryable !== true)) {
    fail("outcome.error is invalid", "INVALID_CORRECTION_OUTCOME");
  }
  return immutable(input);
}

function validateReceipt(input, command, fingerprint) {
  assertExactKeys(
    input,
    [
      "commandId",
      "disposition",
      "entryId",
      "fingerprint",
      "kind",
      "previousRevision",
      "resultingRevision",
    ],
    [],
    "receipt",
    "INVALID_RECEIPT",
  );
  const expectedRevision = command.change.kind === "DELETE" ? null : command.expectedRevision + 1;
  if (input.commandId !== command.commandId
    || input.fingerprint !== fingerprint
    || input.entryId !== command.entryId
    || input.kind !== command.change.kind
    || input.previousRevision !== command.expectedRevision
    || input.resultingRevision !== expectedRevision
    || !new Set(["COMMITTED", "REPLAYED"]).has(input.disposition)) {
    fail("receipt does not match the correction command", "INVALID_RECEIPT");
  }
  return immutable(input);
}

function validateTransactionEvidence(input, command, options) {
  assertPlainRecord(input, "committed", "INVALID_COMMITTED_DAYS");
  assertExactKeys(
    input,
    ["affectedDays", "beforeDays"],
    [],
    "committed",
    "INVALID_COMMITTED_DAYS",
  );
  if (!Array.isArray(input.affectedDays) || !Array.isArray(input.beforeDays)) {
    fail("transaction day evidence must be arrays", "INVALID_COMMITTED_DAYS");
  }
  const baseline = normalizeMealRecord({
    id: command.entryId,
    revision: command.expectedRevision,
    ...command.expected,
  }, "command.baseline", options);
  const dates = affectedDates(baseline, command.change);
  const beforeDays = input.beforeDays.map((day, index) => normalizeDayView(
    day,
    `committed.beforeDays[${index}]`,
    options,
  ));
  const afterDays = input.affectedDays.map((day, index) => normalizeDayView(
    day,
    `committed.affectedDays[${index}]`,
    options,
  ));
  if (!isDeepStrictEqual(beforeDays.map(({ localDate }) => localDate), dates)
    || !isDeepStrictEqual(afterDays.map(({ localDate }) => localDate), dates)) {
    fail("committed dates do not match the command", "INVALID_COMMITTED_DAYS");
  }
  assertGloballyUniqueMealIds(beforeDays, "committed.beforeDays", "INVALID_COMMITTED_DAYS");
  assertGloballyUniqueMealIds(afterDays, "committed.affectedDays", "INVALID_COMMITTED_DAYS");
  const beforeMatches = beforeDays.flatMap(({ meals }) => meals)
    .filter(({ id }) => id === command.entryId);
  if (beforeMatches.length !== 1 || !isDeepStrictEqual(beforeMatches[0], baseline)) {
    fail("transaction baseline does not match the command", "INVALID_COMMITTED_DAYS");
  }
  const expectedEntry = expectedAfterEntry(baseline, command.change, options.nutritionTrustContext);
  const expectedAfterDays = beforeDays.map((before) => normalizeDayView({
    localDate: before.localDate,
    meals: [
      ...before.meals.filter(({ id }) => id !== command.entryId),
      ...(expectedEntry?.localDate === before.localDate ? [expectedEntry] : []),
    ],
  }, `committed.expectedAfterDays.${before.localDate}`, options));
  if (!isDeepStrictEqual(afterDays, expectedAfterDays)) {
    fail("transaction changed records outside the command", "INVALID_COMMITTED_DAYS");
  }
  return immutable({
    beforeDays,
    committedDays: afterDays.map((day) => ({
    localDate: day.localDate,
    meals: day.meals,
    summary: summarizeDay(day),
    })),
  }, options.nutritionTrustContext);
}

async function executeMealCorrection(repository, effect, { nutritionTrustContext = null } = {}) {
  if (!repository || typeof repository.applyMealCorrection !== "function") {
    fail("repository does not implement applyMealCorrection", "INVALID_REPOSITORY_PORT");
  }
  assertExactKeys(effect, ["attempt", "command", "fingerprint", "type"], [], "effect", "INVALID_EFFECT");
  if (effect.type !== "APPLY_MEAL_CORRECTION" || !Number.isInteger(effect.attempt) || effect.attempt < 1) {
    fail("effect is invalid", "INVALID_EFFECT");
  }
  const command = normalizeCommand(effect.command, { nutritionTrustContext });
  const fingerprint = commandFingerprint(command);
  if (effect.fingerprint !== fingerprint) fail("effect fingerprint mismatch", "INVALID_EFFECT");
  const context = immutable({
    commandId: command.commandId,
    fingerprint,
    attempt: effect.attempt,
  });
  let raw;
  try {
    raw = await repository.applyMealCorrection(command);
  } catch (error) {
    return immutable({
      status: "FAILURE",
      ...context,
      receipt: null,
      committedBeforeDays: null,
      committedDays: null,
      error: normalizeFailure(error),
    });
  }
  let receipt;
  try {
    assertExactKeys(raw, ["committed", "receipt"], [], "repositoryResult", "INVALID_REPOSITORY_RESULT");
    receipt = validateReceipt(raw.receipt, command, fingerprint);
  } catch (error) {
    return immutable({
      status: "FAILURE",
      ...context,
      receipt: null,
      committedBeforeDays: null,
      committedDays: null,
      error: normalizeFailure(error, { allowNotCommitted: false }),
    });
  }
  try {
    const evidence = validateTransactionEvidence(
      raw.committed,
      command,
      { nutritionTrustContext },
    );
    return immutable({
      status: "SUCCESS",
      ...context,
      receipt,
      committedBeforeDays: evidence.beforeDays,
      committedDays: evidence.committedDays,
      error: null,
    }, nutritionTrustContext);
  } catch (error) {
    return immutable({
      status: "FAILURE",
      ...context,
      receipt: null,
      committedBeforeDays: null,
      committedDays: null,
      error: normalizeFailure(error, { allowNotCommitted: false }),
    });
  }
}

function settleMealCorrection(state, outcome, { nutritionTrustContext = null } = {}) {
  assertState(state, { nutritionTrustContext });
  assertPlainRecord(outcome, "outcome", "INVALID_CORRECTION_OUTCOME");
  if (state.status !== STATUSES.SAVING || !state.pendingCommand) {
    fail("correction outcome is not expected", "INVALID_TRANSITION");
  }
  if (outcome.status !== "SUCCESS" && outcome.status !== "FAILURE") {
    fail("outcome status is invalid", "INVALID_CORRECTION_OUTCOME");
  }
  const outcomeKeys = [
    "attempt",
    "commandId",
    "committedBeforeDays",
    "committedDays",
    "error",
    "fingerprint",
    "receipt",
    "status",
  ];
  assertExactKeys(outcome, outcomeKeys, [], "outcome", "INVALID_CORRECTION_OUTCOME");
  if (outcome.commandId !== state.pendingCommand.commandId
    || outcome.fingerprint !== state.pendingFingerprint
    || outcome.attempt !== state.pendingAttempt) {
    fail("correction outcome is stale", "STALE_CORRECTION_OUTCOME");
  }
  if (outcome.status === "SUCCESS") {
    if (outcome.error !== null) fail("success outcome contains an error", "INVALID_CORRECTION_OUTCOME");
    const receipt = validateReceipt(outcome.receipt, state.pendingCommand, state.pendingFingerprint);
    if (!Array.isArray(outcome.committedBeforeDays) || !Array.isArray(outcome.committedDays)) {
      fail("transaction day evidence must be arrays", "INVALID_COMMITTED_DAYS");
    }
    const evidence = validateTransactionEvidence(
      {
        beforeDays: outcome.committedBeforeDays,
        affectedDays: outcome.committedDays.map((day, index) => {
        assertExactKeys(
          day,
          ["localDate", "meals", "summary"],
          [],
          `committedDays[${index}]`,
          "INVALID_COMMITTED_DAYS",
        );
        return { localDate: day.localDate, meals: day.meals };
        }),
      },
      state.pendingCommand,
      { nutritionTrustContext },
    );
    for (let index = 0; index < evidence.committedDays.length; index += 1) {
      if (!isDeepStrictEqual(outcome.committedDays[index].summary, evidence.committedDays[index].summary)) {
        fail("committed summary does not match its meals", "INVALID_COMMITTED_DAYS");
      }
    }
    return immutable({
      ...baseState({
        status: STATUSES.SAVED,
        context: state.context,
        draft: state.draft,
      }, nutritionTrustContext),
      preview: state.preview,
      receipt,
      committedBeforeDays: evidence.beforeDays,
      committedDays: evidence.committedDays,
    }, nutritionTrustContext);
  }
  if (outcome.receipt !== null || outcome.committedBeforeDays !== null || outcome.committedDays !== null) {
    fail("failure outcome contains contradictory commit evidence", "INVALID_CORRECTION_OUTCOME");
  }
  const saveError = validateFailureOutcomeError(outcome.error);
  return immutable({
    ...baseState({
      status: STATUSES.SAVE_FAILED,
      context: state.context,
      draft: state.draft,
    }, nutritionTrustContext),
    preview: state.preview,
    pendingCommand: state.pendingCommand,
    pendingAttempt: state.pendingAttempt,
    pendingFingerprint: state.pendingFingerprint,
    saveError,
  }, nutritionTrustContext);
}

function createInMemoryMealCorrectionRepository({
  meals = [],
  failurePlan = [],
  nutritionTrustContext = null,
} = {}) {
  if (!Array.isArray(failurePlan) || failurePlan.some((point) => !FAILURE_POINTS.has(point))) {
    fail("failurePlan contains an unsupported point", "INVALID_FAILURE_PLAN");
  }
  if (!Array.isArray(meals)) fail("meals must be an array", "INVALID_MEALS");
  let records = meals.map((meal, index) => normalizeMealRecord(
    meal,
    `meals[${index}]`,
    { nutritionTrustContext },
  ));
  if (new Set(records.map(({ id }) => id)).size !== records.length) {
    fail("initial meals contain duplicate ids", "DUPLICATE_MEAL_ID");
  }
  let idempotency = new Map();
  const plannedFailures = [...failurePlan];
  const calls = { apply: 0, context: 0 };

  function committedView(dates) {
    return immutable({
      affectedDays: dates.map((localDate) => ({
        localDate,
        meals: records.filter((meal) => meal.localDate === localDate),
      })),
    }, nutritionTrustContext);
  }

  async function applyMealCorrection(rawCommand) {
    calls.apply += 1;
    const command = normalizeCommand(rawCommand, { nutritionTrustContext });
    const fingerprint = commandFingerprint(command);
    const prior = idempotency.get(command.commandId);
    if (prior) {
      if (prior.fingerprint !== fingerprint) {
        throw repositoryError("IDEMPOTENCY_CONFLICT", "NOT_COMMITTED", false);
      }
      return immutable({
        receipt: { ...prior.receipt, disposition: "REPLAYED" },
        committed: prior.committed,
      }, nutritionTrustContext);
    }
    const index = records.findIndex(({ id }) => id === command.entryId);
    if (index < 0) throw repositoryError("MEAL_NOT_FOUND", "NOT_COMMITTED", false);
    const actual = records[index];
    if (actual.revision !== command.expectedRevision) {
      throw repositoryError("REVISION_CONFLICT", "NOT_COMMITTED", false);
    }
    const expected = {
      localDate: command.expected.localDate,
      mealSlotId: command.expected.mealSlotId,
      nutrition: command.expected.nutrition,
    };
    const actualExpected = {
      localDate: actual.localDate,
      mealSlotId: actual.mealSlotId,
      nutrition: actual.nutrition,
    };
    if (!isDeepStrictEqual(actualExpected, expected)) {
      throw repositoryError("REVISION_INTEGRITY_CONFLICT", "NOT_COMMITTED", false);
    }
    const dates = affectedDates(actual, command.change);
    const nextEntry = expectedAfterEntry(actual, command.change, nutritionTrustContext);
    const failurePoint = plannedFailures.shift() ?? null;
    if (failurePoint === "BEFORE_COMMIT") {
      throw repositoryError("INJECTED_BEFORE_COMMIT", "NOT_COMMITTED", true);
    }
    const beforeDays = committedView(dates).affectedDays;
    const nextRecords = records.filter(({ id }) => id !== actual.id);
    if (nextEntry) nextRecords.push(nextEntry);
    const receipt = immutable({
      commandId: command.commandId,
      fingerprint,
      disposition: "COMMITTED",
      kind: command.change.kind,
      entryId: command.entryId,
      previousRevision: command.expectedRevision,
      resultingRevision: nextEntry?.revision ?? null,
    });
    records = nextRecords;
    const committed = immutable({
      beforeDays,
      affectedDays: committedView(dates).affectedDays,
    }, nutritionTrustContext);
    const nextIdempotency = new Map(idempotency);
    nextIdempotency.set(command.commandId, { fingerprint, receipt, committed });
    idempotency = nextIdempotency;
    if (failurePoint === "AFTER_COMMIT") {
      throw repositoryError("INJECTED_AFTER_COMMIT", "UNKNOWN", true);
    }
    return immutable({ receipt, committed }, nutritionTrustContext);
  }

  async function getMealCorrectionContext({ entryId, targetLocalDate } = {}) {
    calls.context += 1;
    assertText(entryId, "entryId", "INVALID_MEAL_ID");
    const entry = records.find(({ id }) => id === entryId);
    if (!entry) throw repositoryError("MEAL_NOT_FOUND", "NOT_COMMITTED", false);
    const dates = [...new Set([
      entry.localDate,
      ...(targetLocalDate === undefined ? [] : [assertDate(targetLocalDate, "targetLocalDate")]),
    ])].sort();
    return immutable({
      entry,
      days: dates.map((localDate) => ({
        localDate,
        meals: records.filter((meal) => meal.localDate === localDate),
      })),
    }, nutritionTrustContext);
  }

  function snapshot() {
    return immutable({
      meals: records,
      commandIds: [...idempotency.keys()],
      calls,
      pendingFailures: plannedFailures,
    }, nutritionTrustContext);
  }

  return Object.freeze({ applyMealCorrection, getMealCorrectionContext, snapshot });
}

async function loadMealCorrectionContext(repository, query, { nutritionTrustContext = null } = {}) {
  if (!repository || typeof repository.getMealCorrectionContext !== "function") {
    fail("repository does not implement getMealCorrectionContext", "INVALID_REPOSITORY_PORT");
  }
  return normalizeContext(
    await repository.getMealCorrectionContext(query),
    { nutritionTrustContext },
  );
}

export {
  CHANGE_KINDS,
  STATUSES,
  canonicalStringify,
  createInMemoryMealCorrectionRepository,
  createMealCorrectionState,
  executeMealCorrection,
  loadMealCorrectionContext,
  requestMealCorrectionSave,
  restoreMealCorrectionState,
  retryMealCorrectionSave,
  reviewMealCorrection,
  setMealCorrectionDraft,
  settleMealCorrection,
};
