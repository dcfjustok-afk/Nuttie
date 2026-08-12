import assert from "node:assert/strict";
import test from "node:test";

import { nutritionSnapshot } from "./domain-contract-harness.mjs";
import { NUTRIENT_FIELDS } from "./nutrition-fields.mjs";
import {
  NUTRIENT_UNITS,
  createNutritionFactSnapshot,
} from "./nutrition-fact-snapshot-harness.mjs";
import {
  createLocalFoodCatalog,
  createNutritionSnapshotTrustContext,
  createVerifiedPackCatalogSnapshot,
  searchLocalFoods,
} from "./local-food-catalog-harness.mjs";
import {
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
} from "./meal-correction-harness.mjs";

function meal({
  id = "meal-1",
  revision = 1,
  localDate = "2026-08-12",
  mealSlotId = "breakfast",
  energyKcal = 320,
  proteinG = 12,
} = {}) {
  return {
    id,
    revision,
    localDate,
    mealSlotId,
    nutrition: nutritionSnapshot({
      sourceId: `USER.${id}`,
      sourceVersion: `rev-${revision}`,
      nutrients: { energyKcal, proteinG, sodiumMg: 0 },
    }),
  };
}

function day(localDate, meals = []) {
  return { localDate, meals };
}

function context(entry = meal(), days = [day(entry.localDate, [entry])]) {
  return { entry, days };
}

function reviewed(change, correctionContext = context()) {
  const editing = createMealCorrectionState({ context: correctionContext });
  const drafted = setMealCorrectionDraft(editing, change);
  return reviewMealCorrection(drafted);
}

function saving(change, commandId = "correction-1", correctionContext = context()) {
  return requestMealCorrectionSave(reviewed(change, correctionContext), { commandId });
}

function editedNutrition(entry = meal(), overrides = {}) {
  return nutritionSnapshot({
    sourceId: `USER.${entry.id}.edited`,
    sourceVersion: `rev-${entry.revision + 1}`,
    nutrients: { energyKcal: 410, proteinG: 18, sodiumMg: 0, ...overrides },
  });
}

const factValues = Object.freeze({
  energyKcal: 120,
  proteinG: 6,
  carbohydrateG: 20,
  fatG: 2,
  fiberG: 1,
  sugarG: 4,
  sodiumMg: 80,
});

function facts({ sourceKind = "USER", overrides = {}, userStatus = "USER_CONFIRMED" } = {}) {
  return Object.fromEntries(NUTRIENT_FIELDS.map((field) => {
    const override = overrides[field];
    if (override !== undefined) return [field, override];
    const value = factValues[field];
    return [field, {
      value,
      status: sourceKind === "USER" ? userStatus : "SOURCE_REPORTED",
      originalValue: value,
      originalUnit: NUTRIENT_UNITS[field],
    }];
  }));
}

function userV2(sourceRecordId = "corrected-food", overrides = {}, userStatus = "USER_CONFIRMED") {
  return createNutritionFactSnapshot({
    sourceId: `USER.local.${sourceRecordId}`,
    sourceVersion: "rev-1",
    sourceKind: "USER",
    basis: { amount: 1, unit: "serving", semantic: "DECLARED_SERVING" },
    originalBasis: { amount: 1, unit: "serving", semantic: "DECLARED_SERVING" },
    provenance: {
      sourceRecordId,
      transformVersion: "USER_CORRECTION_V1",
      activeRef: null,
      contentSha256: null,
      licenseId: null,
      noticeSha256: null,
      packId: null,
      packVersion: null,
    },
    facts: facts({ sourceKind: "USER", overrides, userStatus }),
  });
}

function packV2(sourceKind = "TW_FDA", overrides = {}) {
  const sourceId = sourceKind.toLocaleLowerCase("en-US").replaceAll("_", "-");
  const pack = createVerifiedPackCatalogSnapshot({
    activeRef: `${sourceId}.active.v1`,
    contentSha256: "a".repeat(64),
    licenseId: `${sourceId}.license`,
    noticeSha256: "b".repeat(64),
    packId: `${sourceId}.pack`,
    packVersion: "2026.08.0",
    sourceId,
    sourceKind,
    sourceVersion: "2026.08",
    transformVersion: `${sourceId}.transform.v1`,
    records: [{
      id: "j05-food",
      sourceRecordId: "j05-source-food",
      name: `${sourceKind} J05 fixture`,
      originalName: `${sourceKind} J05 fixture`,
      originalLanguage: "en",
      basis: { amount: 100, unit: "g", semantic: "EDIBLE_PORTION" },
      originalBasis: { amount: 100, unit: "g", semantic: "EDIBLE_PORTION" },
      nutrients: facts({ sourceKind, overrides }),
    }],
  });
  const catalog = createLocalFoodCatalog({ installedPacks: [pack] });
  const nutrition = searchLocalFoods(catalog, { query: "J05 fixture" }).results[0].nutrition;
  return { nutrition, trustContext: createNutritionSnapshotTrustContext([nutrition]) };
}

test("starts from an explicit context without inventing a draft or default target", () => {
  const state = createMealCorrectionState({ context: context() });
  assert.equal(state.status, "EDITING");
  assert.equal(state.draft, null);
  assert.equal(state.preview, null);
  assert.equal("targetKcal" in state, false);
  assert.equal("defaultMealSlot" in state, false);
  assert.ok(Object.isFrozen(state.baseline.nutrition.values));
});

test("rejects a context whose source day does not contain the exact baseline", () => {
  assert.throws(() => createMealCorrectionState({
    context: context(meal(), [day("2026-08-12", [])]),
  }), { code: "CONTEXT_ENTRY_MISMATCH" });
  assert.throws(() => createMealCorrectionState({
    context: context(meal(), [day("2026-08-12", [meal({ revision: 2 })])]),
  }), { code: "CONTEXT_ENTRY_MISMATCH" });
});

test("reviews an edit with before and after summaries", () => {
  const entry = meal();
  const state = reviewed({ kind: "EDIT", nutrition: editedNutrition(entry) }, context(entry));
  assert.equal(state.status, "REVIEW_READY");
  assert.equal(state.preview.kind, "EDIT");
  assert.equal(state.preview.afterEntry.revision, 2);
  assert.equal(state.preview.afterEntry.localDate, entry.localDate);
  assert.equal(state.preview.affectedDays.length, 1);
  assert.equal(state.preview.affectedDays[0].beforeSummary.values.energyKcal, 320);
  assert.equal(state.preview.affectedDays[0].afterSummary.values.energyKcal, 410);
});

test("keeps no-op edits and moves editable without an effect", () => {
  const entry = meal();
  for (const change of [
    { kind: "EDIT", nutrition: entry.nutrition },
    { kind: "MOVE", targetLocalDate: entry.localDate, targetMealSlotId: entry.mealSlotId },
  ]) {
    const state = reviewed(change, context(entry));
    assert.equal(state.status, "EDITING");
    assert.equal(state.validationError.code, "NO_CHANGES");
    assert.throws(() => requestMealCorrectionSave(state, { commandId: "noop" }), {
      code: "INVALID_TRANSITION",
    });
  }
});

test("reviews a same-day slot move without changing nutrition", () => {
  const entry = meal();
  const state = reviewed({
    kind: "MOVE",
    targetLocalDate: entry.localDate,
    targetMealSlotId: "lunch",
  }, context(entry));
  assert.equal(state.preview.affectedDays.length, 1);
  assert.equal(state.preview.afterEntry.mealSlotId, "lunch");
  assert.deepEqual(state.preview.afterEntry.nutrition, entry.nutrition);
  assert.deepEqual(
    state.preview.affectedDays[0].beforeSummary.values,
    state.preview.affectedDays[0].afterSummary.values,
  );
});

test("reviews a cross-day move with both summaries in stable date order", () => {
  const entry = meal({ localDate: "2026-08-12" });
  const target = meal({
    id: "target-meal",
    localDate: "2026-08-13",
    mealSlotId: "lunch",
    energyKcal: 200,
  });
  const correctionContext = context(entry, [
    day("2026-08-13", [target]),
    day("2026-08-12", [entry]),
  ]);
  const state = reviewed({
    kind: "MOVE",
    targetLocalDate: "2026-08-13",
    targetMealSlotId: "dinner",
  }, correctionContext);
  assert.deepEqual(state.preview.affectedDays.map(({ localDate }) => localDate), [
    "2026-08-12",
    "2026-08-13",
  ]);
  assert.equal(state.preview.affectedDays[0].afterSummary.mealCount, 0);
  assert.equal(state.preview.affectedDays[1].afterSummary.mealCount, 2);
  assert.equal(state.preview.affectedDays[1].afterSummary.values.energyKcal, 520);
});

test("rejects a target day view that already contains the source meal id", () => {
  const entry = meal();
  const state = reviewMealCorrection(setMealCorrectionDraft(
    createMealCorrectionState({ context: context(entry) }),
    { kind: "MOVE", targetLocalDate: "2026-08-13", targetMealSlotId: "dinner" },
  ), {
    dayViews: [day("2026-08-13", [{ ...entry, localDate: "2026-08-13" }])],
  });
  assert.equal(state.status, "EDITING");
  assert.equal(state.validationError.code, "DUPLICATE_MEAL_ID");
});

test("requires the target day view before reviewing a cross-day move", () => {
  const state = reviewed({
    kind: "MOVE",
    targetLocalDate: "2026-08-13",
    targetMealSlotId: "dinner",
  });
  assert.equal(state.status, "EDITING");
  assert.equal(state.validationError.code, "MISSING_DAY_VIEW");
});

test("reviews deletion without mutating the source context", () => {
  const entry = meal();
  const sourceContext = context(entry);
  const state = reviewed({ kind: "DELETE" }, sourceContext);
  assert.equal(state.preview.afterEntry, null);
  assert.equal(state.preview.affectedDays[0].afterSummary.mealCount, 0);
  assert.equal(sourceContext.days[0].meals.length, 1);
});

test("strict change variants reject placement edits and extra delete fields", () => {
  for (const change of [
    { kind: "EDIT", nutrition: editedNutrition(), targetLocalDate: "2026-08-13" },
    { kind: "DELETE", reason: "cleanup" },
    { kind: "MOVE", targetLocalDate: "2026-08-13", targetMealSlotId: null, nutrition: editedNutrition() },
  ]) {
    const state = reviewed(change);
    assert.equal(state.validationError.code, "INVALID_CORRECTION_CHANGE");
  }
});

test("editing after review invalidates preview and command state", () => {
  const first = reviewed({ kind: "DELETE" });
  const edited = setMealCorrectionDraft(first, {
    kind: "MOVE",
    targetLocalDate: "2026-08-12",
    targetMealSlotId: "dinner",
  });
  assert.equal(edited.status, "EDITING");
  assert.equal(edited.preview, null);
  assert.equal(edited.pendingCommand, null);
});

test("creates an observable saving state and suppresses duplicate save taps", () => {
  const requested = saving({ kind: "DELETE" });
  assert.equal(requested.state.status, "SAVING");
  assert.equal(requested.effect.type, "APPLY_MEAL_CORRECTION");
  const duplicate = requestMealCorrectionSave(requested.state, { commandId: "ignored" });
  assert.equal(duplicate.effect, null);
  assert.deepEqual(duplicate.state, requested.state);
});

test("canonical fingerprint does not depend on object insertion order", () => {
  const first = { b: 2, a: { d: 4, c: 3 } };
  const second = { a: { c: 3, d: 4 }, b: 2 };
  assert.equal(canonicalStringify(first), canonicalStringify(second));
  assert.notEqual(canonicalStringify(-0), canonicalStringify(0));
});

test("commits an edit with revision CAS and transaction-bound day evidence", async () => {
  const entry = meal();
  const repository = createInMemoryMealCorrectionRepository({ meals: [entry] });
  const requested = saving({ kind: "EDIT", nutrition: editedNutrition(entry) }, "edit-1", context(entry));
  const outcome = await executeMealCorrection(repository, requested.effect);
  const saved = settleMealCorrection(requested.state, outcome);
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.receipt.resultingRevision, 2);
  assert.equal(saved.committedDays[0].summary.values.energyKcal, 410);
  assert.equal(repository.snapshot().meals[0].revision, 2);
  assert.equal(repository.snapshot().commandIds.length, 1);
});

test("commits a cross-day move atomically", async () => {
  const entry = meal();
  const other = meal({ id: "other", localDate: "2026-08-13", energyKcal: 100 });
  const repository = createInMemoryMealCorrectionRepository({ meals: [entry, other] });
  const loaded = await loadMealCorrectionContext(repository, {
    entryId: entry.id,
    targetLocalDate: "2026-08-13",
  });
  const requested = saving({
    kind: "MOVE",
    targetLocalDate: "2026-08-13",
    targetMealSlotId: "dinner",
  }, "move-1", loaded);
  const outcome = await executeMealCorrection(repository, requested.effect);
  const saved = settleMealCorrection(requested.state, outcome);
  assert.deepEqual(saved.committedDays.map(({ localDate }) => localDate), [
    "2026-08-12",
    "2026-08-13",
  ]);
  assert.equal(saved.committedDays[0].summary.mealCount, 0);
  assert.equal(saved.committedDays[1].summary.mealCount, 2);
  assert.equal(repository.snapshot().meals.find(({ id }) => id === entry.id).localDate, "2026-08-13");
});

test("commits deletion and removes only the selected entry", async () => {
  const entry = meal();
  const other = meal({ id: "other", energyKcal: 50 });
  const repository = createInMemoryMealCorrectionRepository({ meals: [entry, other] });
  const loaded = await loadMealCorrectionContext(repository, { entryId: entry.id });
  const requested = saving({ kind: "DELETE" }, "delete-1", loaded);
  const saved = settleMealCorrection(
    requested.state,
    await executeMealCorrection(repository, requested.effect),
  );
  assert.equal(saved.receipt.resultingRevision, null);
  assert.deepEqual(repository.snapshot().meals.map(({ id }) => id), ["other"]);
  assert.equal(saved.committedDays[0].summary.values.energyKcal, 50);
});

test("replays the same command before checking the now-stale revision", async () => {
  const entry = meal();
  const repository = createInMemoryMealCorrectionRepository({ meals: [entry] });
  const requested = saving({ kind: "DELETE" }, "replay-first", context(entry));
  const committed = await executeMealCorrection(repository, requested.effect);
  const replay = await executeMealCorrection(repository, requested.effect);
  assert.equal(committed.receipt.disposition, "COMMITTED");
  assert.equal(replay.receipt.disposition, "REPLAYED");
  assert.equal(repository.snapshot().meals.length, 0);
});

test("rejects command-id reuse with another payload without mutation", async () => {
  const entry = meal();
  const repository = createInMemoryMealCorrectionRepository({ meals: [entry] });
  const first = saving({ kind: "DELETE" }, "same-id", context(entry));
  await executeMealCorrection(repository, first.effect);
  const conflictingContext = context(entry);
  const second = saving({
    kind: "MOVE",
    targetLocalDate: entry.localDate,
    targetMealSlotId: "lunch",
  }, "same-id", conflictingContext);
  const conflict = await executeMealCorrection(repository, second.effect);
  assert.equal(conflict.status, "FAILURE");
  assert.equal(conflict.error.code, "IDEMPOTENCY_CONFLICT");
  assert.equal(repository.snapshot().meals.length, 0);
  assert.equal(repository.snapshot().commandIds.length, 1);
});

test("rejects stale revision and same-revision integrity drift", async () => {
  const actual = meal({ revision: 2 });
  const repository = createInMemoryMealCorrectionRepository({ meals: [actual] });
  const stale = saving({ kind: "DELETE" }, "stale", context(meal({ revision: 1 })));
  const staleOutcome = await executeMealCorrection(repository, stale.effect);
  assert.equal(staleOutcome.error.code, "REVISION_CONFLICT");

  const drifted = meal({ revision: 2, energyKcal: 999 });
  const driftContext = context(meal({ revision: 2 }));
  const driftRepository = createInMemoryMealCorrectionRepository({ meals: [drifted] });
  const drift = saving({ kind: "DELETE" }, "drift", driftContext);
  const driftOutcome = await executeMealCorrection(driftRepository, drift.effect);
  assert.equal(driftOutcome.error.code, "REVISION_INTEGRITY_CONFLICT");
  assert.equal(driftRepository.snapshot().commandIds.length, 0);
});

test("pre-commit failure leaves records and idempotency unchanged", async () => {
  const entry = meal();
  const repository = createInMemoryMealCorrectionRepository({
    meals: [entry],
    failurePlan: ["BEFORE_COMMIT"],
  });
  const requested = saving({ kind: "DELETE" }, "before-fail", context(entry));
  const outcome = await executeMealCorrection(repository, requested.effect);
  assert.equal(outcome.error.outcome, "NOT_COMMITTED");
  assert.deepEqual(repository.snapshot().meals, [entry]);
  assert.deepEqual(repository.snapshot().commandIds, []);
});

test("post-commit response loss converges by replaying the frozen command", async () => {
  const entry = meal();
  const repository = createInMemoryMealCorrectionRepository({
    meals: [entry],
    failurePlan: ["AFTER_COMMIT"],
  });
  const requested = saving({ kind: "DELETE" }, "after-fail", context(entry));
  const unknownOutcome = await executeMealCorrection(repository, requested.effect);
  const failed = settleMealCorrection(requested.state, unknownOutcome);
  assert.equal(failed.saveError.outcome, "UNKNOWN");
  assert.throws(() => setMealCorrectionDraft(failed, { kind: "DELETE" }), {
    code: "COMMIT_OUTCOME_UNKNOWN",
  });
  const retry = retryMealCorrectionSave(failed);
  assert.deepEqual(retry.effect.command, retry.state.pendingCommand);
  assert.equal(retry.effect.fingerprint, requested.effect.fingerprint);
  const replay = await executeMealCorrection(repository, retry.effect);
  const saved = settleMealCorrection(retry.state, replay);
  assert.equal(saved.status, "SAVED");
  assert.equal(saved.receipt.disposition, "REPLAYED");
  assert.equal(repository.snapshot().meals.length, 0);
});

test("restores a plain saving state after process loss and replays the same command", async () => {
  const { nutrition, trustContext } = packV2("USDA_SR_LEGACY");
  const entry = { ...meal(), nutrition: structuredClone(nutrition) };
  const repository = createInMemoryMealCorrectionRepository({
    meals: [entry],
    nutritionTrustContext: trustContext,
  });
  const editing = createMealCorrectionState({
    context: context(entry),
    nutritionTrustContext: trustContext,
  });
  const review = reviewMealCorrection(setMealCorrectionDraft(editing, {
    kind: "DELETE",
  }, { nutritionTrustContext: trustContext }), { nutritionTrustContext: trustContext });
  const requested = requestMealCorrectionSave(review, {
    commandId: "sr-restart-delete",
    nutritionTrustContext: trustContext,
  });
  const committed = await executeMealCorrection(repository, requested.effect, { nutritionTrustContext: trustContext });
  const restored = restoreMealCorrectionState(
    structuredClone(requested.state),
    { nutritionTrustContext: trustContext },
  );
  const replayed = await executeMealCorrection(repository, {
    type: "APPLY_MEAL_CORRECTION",
    command: restored.pendingCommand,
    attempt: restored.pendingAttempt,
    fingerprint: restored.pendingFingerprint,
  }, { nutritionTrustContext: trustContext });
  const saved = settleMealCorrection(restored, replayed, { nutritionTrustContext: trustContext });
  assert.equal(committed.receipt.disposition, "COMMITTED");
  assert.equal(saved.receipt.disposition, "REPLAYED");
  assert.equal(saved.committedDays[0].meals.length, 0);
});

test("rejects stale attempt outcomes", () => {
  const requested = saving({ kind: "DELETE" });
  const failure = {
    status: "FAILURE",
    commandId: requested.effect.command.commandId,
    fingerprint: requested.effect.fingerprint,
    attempt: 1,
    receipt: null,
    committedBeforeDays: null,
    committedDays: null,
    error: { outcome: "NOT_COMMITTED", code: "TEMPORARY", retryable: true },
  };
  const failed = settleMealCorrection(requested.state, failure);
  const retry = retryMealCorrectionSave(failed);
  const stale = { ...failure, committedBeforeDays: null };
  assert.throws(() => settleMealCorrection(retry.state, stale), {
    code: "STALE_CORRECTION_OUTCOME",
  });
});

test("invalid committed evidence after a valid receipt becomes UNKNOWN", async () => {
  const requested = saving({ kind: "DELETE" });
  const repository = {
    async applyMealCorrection(command) {
      return {
        receipt: {
          commandId: command.commandId,
          fingerprint: requested.effect.fingerprint,
          disposition: "COMMITTED",
          kind: "DELETE",
          entryId: command.entryId,
          previousRevision: command.expectedRevision,
          resultingRevision: null,
        },
        committed: { beforeDays: [], affectedDays: [] },
      };
    },
  };
  const outcome = await executeMealCorrection(repository, requested.effect);
  assert.equal(outcome.status, "FAILURE");
  assert.equal(outcome.error.outcome, "UNKNOWN");
  assert.equal(outcome.error.retryable, true);
});

test("rejects transaction evidence that deletes another meal or reverses affected days", async () => {
  const entry = meal();
  const other = meal({ id: "other", energyKcal: 40 });
  const requested = saving(
    { kind: "DELETE" },
    "malicious-delete",
    context(entry, [day(entry.localDate, [entry, other])]),
  );
  const fingerprint = requested.effect.fingerprint;
  const receipt = {
    commandId: "malicious-delete",
    fingerprint,
    disposition: "COMMITTED",
    kind: "DELETE",
    entryId: entry.id,
    previousRevision: 1,
    resultingRevision: null,
  };
  const maliciousRepository = {
    async applyMealCorrection() {
      return {
        receipt,
        committed: {
          beforeDays: [day(entry.localDate, [entry, other])],
          affectedDays: [day(entry.localDate, [])],
        },
      };
    },
  };
  const rejected = await executeMealCorrection(maliciousRepository, requested.effect);
  assert.equal(rejected.status, "FAILURE");
  assert.equal(rejected.error.outcome, "UNKNOWN");

  const target = meal({ id: "target", localDate: "2026-08-13" });
  const moveContext = context(entry, [day(entry.localDate, [entry]), day(target.localDate, [target])]);
  const move = saving({
    kind: "MOVE",
    targetLocalDate: target.localDate,
    targetMealSlotId: "dinner",
  }, "reverse-days", moveContext);
  const legitimate = createInMemoryMealCorrectionRepository({ meals: [entry, target] });
  const outcome = await executeMealCorrection(legitimate, move.effect);
  const reversed = {
    ...outcome,
    committedBeforeDays: [...outcome.committedBeforeDays].reverse(),
    committedDays: [...outcome.committedDays].reverse(),
  };
  assert.throws(() => settleMealCorrection(move.state, reversed), {
    code: "INVALID_COMMITTED_DAYS",
  });
});

test("strict state and outcome unions reject forged review or contradictory failure evidence", () => {
  const editing = createMealCorrectionState({ context: context() });
  const forgedReview = {
    ...editing,
    status: "REVIEW_READY",
    draft: { kind: "DELETE" },
    preview: {},
  };
  assert.throws(() => requestMealCorrectionSave(forgedReview, { commandId: "forged" }), {
    code: "INVALID_CORRECTION_STATE",
  });

  const requested = saving({ kind: "DELETE" }, "contradictory-failure");
  assert.throws(() => settleMealCorrection(requested.state, {
    status: "FAILURE",
    commandId: requested.effect.command.commandId,
    fingerprint: requested.effect.fingerprint,
    attempt: 1,
    receipt: {},
    committedBeforeDays: null,
    committedDays: null,
    error: { outcome: "NOT_COMMITTED", code: "TEMPORARY", retryable: true },
  }), { code: "INVALID_CORRECTION_OUTCOME" });

  assert.throws(() => settleMealCorrection(requested.state, {
    status: "FAILURE",
    commandId: requested.effect.command.commandId,
    fingerprint: requested.effect.fingerprint,
    attempt: 1,
    receipt: null,
    committedBeforeDays: null,
    committedDays: null,
    error: { outcome: "UNKNOWN", code: "LOST", retryable: false },
  }), { code: "INVALID_CORRECTION_OUTCOME" });
});

test("serializes concurrent same-command and competing-command corrections", async () => {
  const entry = meal();
  const sameRepository = createInMemoryMealCorrectionRepository({ meals: [entry] });
  const same = saving({ kind: "DELETE" }, "parallel", context(entry));
  const sameOutcomes = await Promise.all([
    executeMealCorrection(sameRepository, same.effect),
    executeMealCorrection(sameRepository, same.effect),
  ]);
  assert.deepEqual(sameOutcomes.map(({ receipt }) => receipt.disposition).sort(), ["COMMITTED", "REPLAYED"]);

  const competingRepository = createInMemoryMealCorrectionRepository({ meals: [entry] });
  const first = saving({ kind: "DELETE" }, "parallel-a", context(entry));
  const second = saving({
    kind: "MOVE",
    targetLocalDate: entry.localDate,
    targetMealSlotId: "lunch",
  }, "parallel-b", context(entry));
  const outcomes = await Promise.all([
    executeMealCorrection(competingRepository, first.effect),
    executeMealCorrection(competingRepository, second.effect),
  ]);
  assert.equal(outcomes.filter(({ status }) => status === "SUCCESS").length, 1);
  assert.equal(outcomes.find(({ status }) => status === "FAILURE").error.code, "MEAL_NOT_FOUND");
  assert.equal(competingRepository.snapshot().commandIds.length, 1);
});

test("freezes inputs and excludes hidden placement or nutrition patches", () => {
  const entry = meal();
  const correctionContext = context(entry);
  const state = createMealCorrectionState({ context: correctionContext });
  correctionContext.entry.id = "mutated";
  assert.throws(() => { entry.nutrition.values.energyKcal = 999; }, TypeError);
  assert.equal(state.baseline.id, "meal-1");
  assert.equal(state.baseline.nutrition.values.energyKcal, 320);
  assert.throws(() => { state.baseline.revision = 99; }, TypeError);
});

test("rejects special objects and cycles at the boundary", () => {
  const cyclic = { kind: "DELETE" };
  cyclic.self = cyclic;
  const state = createMealCorrectionState({ context: context() });
  assert.throws(() => setMealCorrectionDraft(state, cyclic), { code: "INVALID_STATE_VALUE" });
  assert.throws(() => setMealCorrectionDraft(state, { kind: "DELETE", when: new Date() }), {
    code: "INVALID_STATE_VALUE",
  });
});

test("preserves a persisted TW FDA V2 through move, commit and replay", async () => {
  const { nutrition, trustContext } = packV2("TW_FDA", {
    fiberG: {
      value: null,
      status: "TRACE",
      originalValue: null,
      originalUnit: "g",
      originalText: "Tr",
    },
    sugarG: {
      value: null,
      status: "MISSING",
      originalValue: null,
      originalUnit: null,
    },
  });
  const entry = {
    ...meal(),
    nutrition: structuredClone(nutrition),
  };
  const repository = createInMemoryMealCorrectionRepository({
    meals: [entry],
    nutritionTrustContext: trustContext,
  });
  const loaded = await loadMealCorrectionContext(repository, {
    entryId: entry.id,
    targetLocalDate: "2026-08-13",
  }, { nutritionTrustContext: trustContext });
  const editing = createMealCorrectionState({ context: loaded, nutritionTrustContext: trustContext });
  const drafted = setMealCorrectionDraft(editing, {
    kind: "MOVE",
    targetLocalDate: "2026-08-13",
    targetMealSlotId: "lunch",
  }, { nutritionTrustContext: trustContext });
  const reviewedState = reviewMealCorrection(drafted, { nutritionTrustContext: trustContext });
  const requested = requestMealCorrectionSave(reviewedState, {
    commandId: "tw-v2-move",
    nutritionTrustContext: trustContext,
  });
  const committed = await executeMealCorrection(
    repository,
    requested.effect,
    { nutritionTrustContext: trustContext },
  );
  const replayed = await executeMealCorrection(
    repository,
    requested.effect,
    { nutritionTrustContext: trustContext },
  );
  const saved = settleMealCorrection(requested.state, committed, { nutritionTrustContext: trustContext });
  assert.equal(replayed.receipt.disposition, "REPLAYED");
  assert.deepEqual(saved.committedDays[1].meals[0].nutrition, nutrition);
  assert.equal(saved.committedDays[1].summary.factQuality.fiberG.trace, 1);
  assert.equal(saved.committedDays[1].summary.factQuality.sugarG.missing, 1);
  assert.equal(saved.committedDays[1].meals[0].nutrition.values.energyKcal, 120);
});

test("preserves USDA estimated facts while moving", async () => {
  const { nutrition, trustContext } = packV2("USDA_FOUNDATION", {
    fatG: {
      value: 2,
      status: "ESTIMATED",
      originalValue: 2,
      originalUnit: "g",
    },
  });
  const entry = { ...meal(), nutrition: structuredClone(nutrition) };
  const correctionContext = context(entry);
  const editing = createMealCorrectionState({
    context: correctionContext,
    nutritionTrustContext: trustContext,
  });
  const reviewedState = reviewMealCorrection(setMealCorrectionDraft(editing, {
    kind: "MOVE",
    targetLocalDate: entry.localDate,
    targetMealSlotId: "dinner",
  }, { nutritionTrustContext: trustContext }), { nutritionTrustContext: trustContext });
  assert.equal(reviewedState.preview.afterEntry.nutrition.facts.fatG.status, "ESTIMATED");
  assert.equal(reviewedState.preview.affectedDays[0].afterSummary.factQuality.fatG.estimated, 1);
  const repository = createInMemoryMealCorrectionRepository({
    meals: [entry],
    nutritionTrustContext: trustContext,
  });
  const requested = requestMealCorrectionSave(reviewedState, {
    commandId: "usda-estimated-move",
    nutritionTrustContext: trustContext,
  });
  const committed = await executeMealCorrection(repository, requested.effect, { nutritionTrustContext: trustContext });
  const replayed = await executeMealCorrection(repository, requested.effect, { nutritionTrustContext: trustContext });
  const saved = settleMealCorrection(requested.state, committed, { nutritionTrustContext: trustContext });
  assert.equal(replayed.receipt.disposition, "REPLAYED");
  assert.equal(saved.committedDays[0].meals[0].nutrition.facts.fatG.status, "ESTIMATED");
  assert.equal(saved.committedDays[0].summary.factQuality.fatG.estimated, 1);
});

test("edits user V2 without dropping fact provenance", async () => {
  const baselineNutrition = userV2("baseline");
  const corrected = userV2("corrected", {
    sugarG: {
      value: 0,
      status: "USER_CONFIRMED",
      originalValue: 0,
      originalUnit: "g",
    },
  });
  const entry = { ...meal(), nutrition: baselineNutrition };
  const repository = createInMemoryMealCorrectionRepository({ meals: [entry] });
  const requested = saving({ kind: "EDIT", nutrition: corrected }, "user-v2-edit", context(entry));
  const saved = settleMealCorrection(
    requested.state,
    await executeMealCorrection(repository, requested.effect),
  );
  const result = saved.committedDays[0].meals[0].nutrition;
  assert.equal(result.schemaVersion, "NUTRITION_FACT_SNAPSHOT_V2");
  assert.equal(result.sourceKind, "USER");
  assert.equal(result.facts.sugarG.status, "USER_CONFIRMED");
  assert.equal(result.facts.sugarG.value, 0);
  assert.equal(result.provenance.sourceRecordId, "corrected");
});

test("pack edits must become a complete user-confirmed V2 snapshot", () => {
  const { nutrition, trustContext } = packV2("TW_FDA");
  const entry = { ...meal(), nutrition: structuredClone(nutrition) };
  const editing = createMealCorrectionState({
    context: context(entry),
    nutritionTrustContext: trustContext,
  });
  const changedPack = structuredClone(nutrition);
  changedPack.sourceVersion = "2026.09";
  assert.throws(() => setMealCorrectionDraft(editing, {
    kind: "EDIT",
    nutrition: changedPack,
  }, { nutritionTrustContext: trustContext }), {
    code: "UNTRUSTED_PACK_NUTRITION_SNAPSHOT",
  });

  const acceptedUser = reviewMealCorrection(setMealCorrectionDraft(editing, {
    kind: "EDIT",
    nutrition: userV2("pack-correction"),
  }, { nutritionTrustContext: trustContext }), { nutritionTrustContext: trustContext });
  assert.equal(acceptedUser.status, "REVIEW_READY");
  assert.equal(acceptedUser.preview.afterEntry.nutrition.sourceKind, "USER");

  const unconfirmed = reviewMealCorrection(setMealCorrectionDraft(editing, {
    kind: "EDIT",
    nutrition: userV2("unconfirmed-pack-correction", {}, "USER_ENTERED"),
  }, { nutritionTrustContext: trustContext }), { nutritionTrustContext: trustContext });
  assert.equal(unconfirmed.status, "EDITING");
  assert.equal(unconfirmed.validationError.code, "PACK_EDIT_MUST_BE_USER_CONFIRMED");
});

test("commits and replays a pack correction as a USER_CONFIRMED snapshot", async () => {
  const { nutrition, trustContext } = packV2("TW_FDA");
  const entry = { ...meal(), nutrition: structuredClone(nutrition) };
  const corrected = userV2("tw-user-correction");
  const repository = createInMemoryMealCorrectionRepository({
    meals: [entry],
    nutritionTrustContext: trustContext,
  });
  const editing = createMealCorrectionState({
    context: context(entry),
    nutritionTrustContext: trustContext,
  });
  const reviewedState = reviewMealCorrection(setMealCorrectionDraft(editing, {
    kind: "EDIT",
    nutrition: corrected,
  }, { nutritionTrustContext: trustContext }), { nutritionTrustContext: trustContext });
  const requested = requestMealCorrectionSave(reviewedState, {
    commandId: "tw-pack-user-edit",
    nutritionTrustContext: trustContext,
  });
  const committed = await executeMealCorrection(repository, requested.effect, { nutritionTrustContext: trustContext });
  const replayed = await executeMealCorrection(repository, requested.effect, { nutritionTrustContext: trustContext });
  const saved = settleMealCorrection(requested.state, committed, { nutritionTrustContext: trustContext });
  assert.equal(replayed.receipt.disposition, "REPLAYED");
  assert.deepEqual(saved.committedDays[0].meals[0].nutrition, corrected);
  assert.ok(Object.values(saved.committedDays[0].meals[0].nutrition.facts)
    .every(({ status }) => status === "USER_CONFIRMED"));
});

test("fails closed when persisted pack facts, provenance, basis or derived fields drift", () => {
  const { nutrition, trustContext } = packV2("USDA_SR_LEGACY");
  for (const mutate of [
    (copy) => { copy.provenance.packVersion = "2019"; },
    (copy) => { copy.facts.energyKcal.status = "MEASURED"; },
    (copy) => { copy.basis.amount = 50; },
    (copy) => { copy.originalBasis.amount = 50; },
    (copy) => { copy.values.energyKcal = 999; },
  ]) {
    const changed = structuredClone(nutrition);
    mutate(changed);
    assert.throws(() => createMealCorrectionState({
      context: context({ ...meal(), nutrition: changed }),
      nutritionTrustContext: trustContext,
    }));
  }
});
