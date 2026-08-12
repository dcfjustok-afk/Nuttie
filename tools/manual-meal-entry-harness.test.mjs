import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { nutritionSnapshot } from "./domain-contract-harness.mjs";
import {
  NUTRIENT_UNITS,
  createNutritionFactSnapshot,
} from "./nutrition-fact-snapshot-harness.mjs";
import {
  createInMemoryManualMealRepository,
  createManualMealEntryState,
  editManualMealDraft,
  executeManualMealSave,
  requestManualMealSave,
  retryManualMealSave,
  reviewManualMeal,
  settleManualMealSave,
} from "./manual-meal-entry-harness.mjs";

function meal(id = "meal-1", localDate = "2026-08-11", nutrients = {}) {
  return {
    id,
    localDate,
    nutrition: nutritionSnapshot({
      sourceId: "user-food",
      sourceVersion: "local-1",
      nutrients: { energyKcal: 320, proteinG: 12, ...nutrients },
    }),
  };
}

function savingState(draft = meal(), commandId = "cmd-1") {
  const editing = createManualMealEntryState({ draft });
  const reviewed = reviewManualMeal(editing);
  return requestManualMealSave(reviewed, { commandId });
}

function userFactSnapshot({ sourceRecordId = "user-food-1", proteinStatus = "USER_ENTERED" } = {}) {
  const values = {
    energyKcal: 320,
    proteinG: 12,
    carbohydrateG: 20,
    fatG: 8,
    fiberG: 2,
    sugarG: 0,
    sodiumMg: 100,
  };
  const facts = Object.fromEntries(Object.entries(values).map(([field, value]) => [field, {
    value,
    status: field === "proteinG" ? proteinStatus : "USER_ENTERED",
    originalValue: value,
    originalUnit: NUTRIENT_UNITS[field],
  }]));
  return createNutritionFactSnapshot({
    sourceId: `USER.local-user.${sourceRecordId}`,
    sourceVersion: "rev-1",
    sourceKind: "USER",
    basis: { amount: 1, unit: "serving", semantic: "DECLARED_SERVING" },
    originalBasis: { amount: 1, unit: "serving", semantic: "DECLARED_SERVING" },
    provenance: {
      sourceRecordId,
      transformVersion: "USER_INPUT_V1",
      activeRef: null,
      contentSha256: null,
      licenseId: null,
      noticeSha256: null,
      packId: null,
      packVersion: null,
    },
    facts,
  });
}

function factMeal(id = "fact-meal", nutrition = userFactSnapshot()) {
  return { id, localDate: "2026-08-11", nutrition };
}

test("starts in editing without inventing a date, meal type, or nutrition target", () => {
  const state = createManualMealEntryState();
  assert.equal(state.status, "EDITING");
  assert.equal(state.draft, null);
  assert.equal(state.previewSummary, null);
  assert.equal(state.pendingCommand, null);
  assert.equal("mealType" in state, false);
  assert.equal("targetKcal" in state, false);
  assert.ok(Object.isFrozen(state));
});

test("reviews a valid seven-field snapshot through dailyNutritionSummary", () => {
  const reviewed = reviewManualMeal(createManualMealEntryState({
    draft: meal("meal-review", "2026-08-11", { sodiumMg: 0 }),
  }));
  assert.equal(reviewed.status, "REVIEW_READY");
  assert.equal(reviewed.previewSummary.mealCount, 1);
  assert.equal(reviewed.previewSummary.values.energyKcal, 320);
  assert.equal(reviewed.previewSummary.values.sodiumMg, 0);
  assert.equal(reviewed.previewSummary.values.sugarG, null);
  assert.equal(reviewed.previewSummary.completeness.sugarG, "MISSING");
});

test("keeps an invalid draft editable and never creates a save effect", () => {
  const invalid = createManualMealEntryState({ draft: { id: "", localDate: "today" } });
  const reviewed = reviewManualMeal(invalid);
  assert.equal(reviewed.status, "EDITING");
  assert.equal(reviewed.validationError.code, "MISSING_MEAL_ID");
  assert.throws(() => requestManualMealSave(reviewed, { commandId: "cmd-invalid" }), {
    code: "INVALID_TRANSITION",
  });
});

test("rejects an unknown nutrition snapshot version instead of treating it as legacy", () => {
  const unknown = structuredClone(factMeal());
  unknown.nutrition.schemaVersion = "NUTRITION_FACT_SNAPSHOT_V3";
  const reviewed = reviewManualMeal(createManualMealEntryState({ draft: unknown }));
  assert.equal(reviewed.status, "EDITING");
  assert.equal(reviewed.validationError.code, "UNSUPPORTED_NUTRITION_SNAPSHOT");
});

test("V2 fact-only changes participate in the idempotency fingerprint", async () => {
  const repository = createInMemoryManualMealRepository();
  const first = savingState(factMeal(), "v2-command");
  const committed = await executeManualMealSave(repository, first.effect);
  assert.equal(committed.status, "SUCCESS");

  const changed = factMeal(
    "fact-meal-2",
    userFactSnapshot({ sourceRecordId: "user-food-2", proteinStatus: "USER_CONFIRMED" }),
  );
  const second = savingState(changed, "v2-command");
  const conflict = await executeManualMealSave(repository, second.effect);
  assert.equal(conflict.status, "FAILURE");
  assert.equal(conflict.error.code, "IDEMPOTENCY_CONFLICT");
  assert.equal(repository.snapshot().meals.length, 1);
});

test("editing a reviewed draft invalidates its preview and command context", () => {
  const reviewed = reviewManualMeal(createManualMealEntryState({ draft: meal() }));
  const edited = editManualMealDraft(reviewed, meal("meal-2"));
  assert.equal(edited.status, "EDITING");
  assert.equal(edited.draft.id, "meal-2");
  assert.equal(edited.previewSummary, null);
  assert.equal(edited.pendingCommand, null);
});

test("creates an observable saving state before calling the repository", async () => {
  const repository = createInMemoryManualMealRepository();
  const requested = savingState();
  assert.equal(requested.state.status, "SAVING");
  assert.equal(requested.effect.type, "SAVE_MANUAL_MEAL");
  assert.equal(repository.snapshot().calls.save, 0);
  const duplicateTap = requestManualMealSave(requested.state, { commandId: "cmd-2" });
  assert.equal(duplicateTap.effect, null);
  assert.equal(repository.snapshot().calls.save, 0);
  const outcome = await executeManualMealSave(repository, requested.effect);
  assert.equal(outcome.status, "SUCCESS");
  assert.equal(repository.snapshot().calls.save, 1);
});

test("commits once and summarizes existing and new meals for the explicit date", async () => {
  const repository = createInMemoryManualMealRepository({
    meals: [meal("existing", "2026-08-11", { energyKcal: 80, proteinG: 3, sugarG: 0 })],
  });
  const requested = savingState(meal("new", "2026-08-11", { energyKcal: 320, proteinG: 12 }));
  const outcome = await executeManualMealSave(repository, requested.effect);
  const saved = settleManualMealSave(requested.state, outcome);
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.receipt.disposition, "COMMITTED");
  assert.equal(saved.committedSummary.mealCount, 2);
  assert.equal(saved.committedSummary.values.energyKcal, 400);
  assert.equal(saved.committedSummary.values.proteinG, 15);
  assert.equal(saved.committedSummary.values.sugarG, 0);
  assert.equal(saved.committedSummary.completeness.sugarG, "PARTIAL");
  assert.equal(repository.snapshot().meals.length, 2);
});

test("a pre-commit failure leaves both repository collections unchanged", async () => {
  const repository = createInMemoryManualMealRepository({ failurePlan: ["BEFORE_COMMIT"] });
  const before = repository.snapshot();
  const requested = savingState();
  const outcome = await executeManualMealSave(repository, requested.effect);
  const failed = settleManualMealSave(requested.state, outcome);
  assert.equal(failed.status, "SAVE_FAILED");
  assert.equal(failed.saveError.outcome, "NOT_COMMITTED");
  assert.deepEqual(repository.snapshot().meals, before.meals);
  assert.deepEqual(repository.snapshot().commandIds, before.commandIds);
  const edited = editManualMealDraft(failed, meal("replacement"));
  assert.equal(edited.status, "EDITING");
  assert.equal(edited.pendingCommand, null);
});

test("an unknown post-commit result converges through replay of the same command", async () => {
  const repository = createInMemoryManualMealRepository({ failurePlan: ["AFTER_COMMIT"] });
  const firstRequest = savingState();
  const firstOutcome = await executeManualMealSave(repository, firstRequest.effect);
  const failed = settleManualMealSave(firstRequest.state, firstOutcome);
  assert.equal(failed.status, "SAVE_FAILED");
  assert.equal(failed.saveError.outcome, "UNKNOWN");
  assert.equal(repository.snapshot().meals.length, 1);
  assert.equal(repository.snapshot().commandIds.length, 1);
  assert.throws(() => editManualMealDraft(failed, meal("replacement")), {
    code: "COMMIT_OUTCOME_UNKNOWN",
  });

  const retry = retryManualMealSave(failed);
  assert.equal(retry.effect.command.commandId, firstRequest.effect.command.commandId);
  assert.deepEqual(retry.effect.command.meal, firstRequest.effect.command.meal);
  assert.equal(retry.effect.attempt, firstRequest.effect.attempt + 1);
  const retryOutcome = await executeManualMealSave(repository, retry.effect);
  const saved = settleManualMealSave(retry.state, retryOutcome);
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.receipt.disposition, "REPLAYED");
  assert.equal(repository.snapshot().meals.length, 1);
  assert.equal(repository.snapshot().commandIds.length, 1);
});

test("rejects an idempotency key reused with another payload without mutation", async () => {
  const repository = createInMemoryManualMealRepository();
  const first = savingState(meal("meal-a"), "same-command");
  assert.equal((await executeManualMealSave(repository, first.effect)).status, "SUCCESS");
  const before = repository.snapshot();
  const conflicting = savingState(meal("meal-b"), "same-command");
  const outcome = await executeManualMealSave(repository, conflicting.effect);
  assert.equal(outcome.status, "FAILURE");
  assert.equal(outcome.error.code, "IDEMPOTENCY_CONFLICT");
  assert.equal(outcome.error.outcome, "NOT_COMMITTED");
  const failed = settleManualMealSave(conflicting.state, outcome);
  assert.throws(() => retryManualMealSave(failed), { code: "SAVE_NOT_RETRYABLE" });
  assert.deepEqual(repository.snapshot().meals, before.meals);
  assert.deepEqual(repository.snapshot().commandIds, before.commandIds);
});

test("rejects a duplicate meal id under a new command without partial writes", async () => {
  const repository = createInMemoryManualMealRepository({ meals: [meal("duplicate")] });
  const before = repository.snapshot();
  const requested = savingState(meal("duplicate"), "new-command");
  const outcome = await executeManualMealSave(repository, requested.effect);
  assert.equal(outcome.status, "FAILURE");
  assert.equal(outcome.error.code, "DUPLICATE_MEAL_ID");
  assert.deepEqual(repository.snapshot().meals, before.meals);
  assert.deepEqual(repository.snapshot().commandIds, before.commandIds);
});

test("rejects stale callbacks without changing the saving state", () => {
  const requested = savingState();
  const before = structuredClone(requested.state);
  assert.throws(() => settleManualMealSave(requested.state, {
    status: "FAILURE",
    commandId: "another-command",
    error: { outcome: "NOT_COMMITTED", code: "LATE", retryable: true },
  }), { code: "STALE_SAVE_OUTCOME" });
  assert.deepEqual(requested.state, before);
});

test("rejects a previous attempt outcome after a retry starts", async () => {
  const repository = createInMemoryManualMealRepository({ failurePlan: ["BEFORE_COMMIT"] });
  const first = savingState();
  const firstOutcome = await executeManualMealSave(repository, first.effect);
  const failed = settleManualMealSave(first.state, firstOutcome);
  const retry = retryManualMealSave(failed);
  assert.throws(() => settleManualMealSave(retry.state, firstOutcome), {
    code: "STALE_SAVE_OUTCOME",
  });
  assert.equal(retry.state.status, "SAVING");
});

test("forces post-receipt query failures to unknown even when mislabeled", async () => {
  const requested = savingState();
  const repository = {
    async saveManualMeal() {
      return {
        commandId: requested.effect.command.commandId,
        disposition: "COMMITTED",
        entryId: requested.effect.command.meal.id,
        localDate: requested.effect.command.meal.localDate,
      };
    },
    async listMealsByLocalDate() {
      const error = new Error("query unavailable");
      Object.assign(error, {
        code: "POST_RECEIPT_QUERY_FAILED",
        outcome: "NOT_COMMITTED",
        retryable: false,
      });
      throw error;
    },
  };
  const outcome = await executeManualMealSave(repository, requested.effect);
  assert.equal(outcome.status, "FAILURE");
  assert.equal(outcome.error.outcome, "UNKNOWN");
  assert.equal(outcome.error.retryable, true);
  const failed = settleManualMealSave(requested.state, outcome);
  assert.throws(() => editManualMealDraft(failed, meal("replacement")), {
    code: "COMMIT_OUTCOME_UNKNOWN",
  });
  assert.equal(retryManualMealSave(failed).state.status, "SAVING");
});

test("validates success and failure outcomes again during settlement", () => {
  const requested = savingState();
  const context = {
    commandId: requested.effect.command.commandId,
    attempt: requested.effect.attempt,
    fingerprint: requested.effect.fingerprint,
  };
  assert.throws(() => settleManualMealSave(requested.state, {
    status: "SUCCESS",
    ...context,
    receipt: null,
    committedSummary: null,
  }), { code: "INVALID_RECORD" });
  const failed = settleManualMealSave(requested.state, {
    status: "FAILURE",
    ...context,
    error: null,
  });
  assert.equal(failed.saveError.outcome, "UNKNOWN");
  assert.throws(() => editManualMealDraft(failed, meal("replacement")), {
    code: "COMMIT_OUTCOME_UNKNOWN",
  });

  const semanticallyFalseSummary = {
    localDate: requested.effect.command.meal.localDate,
    mealCount: 1,
    values: {
      energyKcal: null,
      proteinG: null,
      carbohydrateG: null,
      fatG: null,
      fiberG: null,
      sugarG: null,
      sodiumMg: null,
    },
    completeness: {
      energyKcal: "MISSING",
      proteinG: "MISSING",
      carbohydrateG: "MISSING",
      fatG: "MISSING",
      fiberG: "MISSING",
      sugarG: "MISSING",
      sodiumMg: "MISSING",
    },
    sources: [],
  };
  assert.throws(() => settleManualMealSave(requested.state, {
    status: "SUCCESS",
    ...context,
    receipt: {
      commandId: context.commandId,
      disposition: "COMMITTED",
      entryId: requested.effect.command.meal.id,
      localDate: requested.effect.command.meal.localDate,
    },
    committedSummary: semanticallyFalseSummary,
  }), { code: "INVALID_COMMITTED_SUMMARY" });
});

test("fails closed when repository query returns a wrong date, duplicate, or changed snapshot", async () => {
  const requested = savingState();
  const receipt = {
    commandId: requested.effect.command.commandId,
    disposition: "COMMITTED",
    entryId: requested.effect.command.meal.id,
    localDate: requested.effect.command.meal.localDate,
  };
  const wrongDateRepository = {
    async saveManualMeal() { return receipt; },
    async listMealsByLocalDate() { return [meal("wrong", "2026-08-10")]; },
  };
  const wrongDate = await executeManualMealSave(wrongDateRepository, requested.effect);
  assert.equal(wrongDate.status, "FAILURE");
  assert.equal(wrongDate.error.code, "INVALID_REPOSITORY_RESULT");
  assert.equal(wrongDate.error.outcome, "UNKNOWN");

  const duplicateRepository = {
    async saveManualMeal() { return receipt; },
    async listMealsByLocalDate() {
      return [requested.effect.command.meal, requested.effect.command.meal];
    },
  };
  const duplicated = await executeManualMealSave(duplicateRepository, requested.effect);
  assert.equal(duplicated.status, "FAILURE");
  assert.equal(duplicated.error.code, "INVALID_REPOSITORY_RESULT");

  const changedNutritionRepository = {
    async saveManualMeal() { return receipt; },
    async listMealsByLocalDate() {
      return [meal(requested.effect.command.meal.id, "2026-08-11", { energyKcal: 999 })];
    },
  };
  const changed = await executeManualMealSave(changedNutritionRepository, requested.effect);
  assert.equal(changed.status, "FAILURE");
  assert.equal(changed.error.code, "INVALID_REPOSITORY_RESULT");
  assert.equal(changed.error.outcome, "UNKNOWN");
});

test("rejects unsupported repository fault plans before creating the fake", () => {
  assert.throws(
    () => createInMemoryManualMealRepository({ failurePlan: ["PARTIAL_WRITE"] }),
    { code: "INVALID_FAILURE_PLAN" },
  );
});

test("serializes concurrent same-command saves into commit and replay", async () => {
  const repository = createInMemoryManualMealRepository();
  const first = savingState(meal("concurrent"), "concurrent-command");
  const second = savingState(meal("concurrent"), "concurrent-command");
  const outcomes = await Promise.all([
    executeManualMealSave(repository, first.effect),
    executeManualMealSave(repository, second.effect),
  ]);
  assert.deepEqual(outcomes.map(({ receipt }) => receipt.disposition).sort(), ["COMMITTED", "REPLAYED"]);
  assert.equal(repository.snapshot().meals.length, 1);
  assert.equal(repository.snapshot().commandIds.length, 1);
});

test("serializes concurrent commands for one entry without partial idempotency", async () => {
  const repository = createInMemoryManualMealRepository();
  const first = savingState(meal("one-entry"), "command-a");
  const second = savingState(meal("one-entry"), "command-b");
  const outcomes = await Promise.all([
    executeManualMealSave(repository, first.effect),
    executeManualMealSave(repository, second.effect),
  ]);
  assert.equal(outcomes.filter(({ status }) => status === "SUCCESS").length, 1);
  const failure = outcomes.find(({ status }) => status === "FAILURE");
  assert.equal(failure.error.code, "DUPLICATE_MEAL_ID");
  assert.equal(repository.snapshot().meals.length, 1);
  assert.equal(repository.snapshot().commandIds.length, 1);
});

test("freezes copies so caller and repository mutations cannot rewrite state", async () => {
  const original = meal("immutable");
  const editing = createManualMealEntryState({ draft: original });
  original.id = "changed-outside";
  original.nutrition = null;
  assert.equal(editing.draft.id, "immutable");
  assert.notEqual(editing.draft.nutrition, null);

  const requested = requestManualMealSave(reviewManualMeal(editing), { commandId: "immutable-command" });
  assert.ok(Object.isFrozen(requested.state.pendingCommand.meal.nutrition.values));
  const repository = createInMemoryManualMealRepository();
  const outcome = await executeManualMealSave(repository, requested.effect);
  const listed = await repository.listMealsByLocalDate("2026-08-11");
  assert.throws(() => { listed[0].id = "mutated"; }, TypeError);
  assert.equal(outcome.committedSummary.mealCount, 1);
  assert.equal(repository.snapshot().meals[0].id, "immutable");
});

test("treats saved as terminal and ignores no late outcome by mutation", async () => {
  const repository = createInMemoryManualMealRepository();
  const requested = savingState();
  const saved = settleManualMealSave(
    requested.state,
    await executeManualMealSave(repository, requested.effect),
  );
  const before = structuredClone(saved);
  assert.throws(() => editManualMealDraft(saved, meal("late-edit")), { code: "INVALID_TRANSITION" });
  assert.throws(() => settleManualMealSave(saved, {
    status: "FAILURE",
    commandId: "cmd-1",
    error: { outcome: "NOT_COMMITTED", code: "LATE", retryable: true },
  }), { code: "INVALID_TRANSITION" });
  assert.deepEqual(saved, before);
});

test("canonicalizes state and commands to the approved meal field allowlist", async () => {
  const draft = structuredClone(meal("allowlist"));
  draft.mealType = "unapproved-default";
  draft.targetKcal = 2000;
  draft.nutrition.servingGrams = 100;
  draft.nutrition.missingFields = ["energyKcal"];
  const reviewed = reviewManualMeal(createManualMealEntryState({ draft }));
  assert.deepEqual(Object.keys(reviewed.draft), ["id", "localDate", "nutrition"]);
  assert.deepEqual(Object.keys(reviewed.draft.nutrition), [
    "sourceId",
    "sourceVersion",
    "values",
    "missingFields",
  ]);
  assert.equal(reviewed.draft.nutrition.missingFields.includes("energyKcal"), false);
  const requested = requestManualMealSave(reviewed, { commandId: "allowlist-command" });
  assert.equal("mealType" in requested.effect.command.meal, false);
  assert.equal("servingGrams" in requested.effect.command.meal.nutrition, false);

  const repository = createInMemoryManualMealRepository();
  await executeManualMealSave(repository, requested.effect);
  assert.deepEqual(Object.keys(repository.snapshot().meals[0]), ["id", "localDate", "nutrition"]);

  const source = await readFile(new URL("./manual-meal-entry-harness.mjs", import.meta.url), "utf8");
  assert.equal(source.includes("dailyLedger"), false);
});

test("rejects non-plain draft values before they enter frozen state", () => {
  assert.throws(
    () => createManualMealEntryState({ draft: { id: "special", metadata: new Map() } }),
    { code: "INVALID_STATE_VALUE" },
  );
  assert.throws(
    () => editManualMealDraft(createManualMealEntryState(), { capturedAt: new Date() }),
    { code: "INVALID_STATE_VALUE" },
  );
});
