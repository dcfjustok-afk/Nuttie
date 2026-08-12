import test from "node:test";
import assert from "node:assert/strict";

import * as reminderContract from "./local-reminder-reconcile-harness.mjs";

const {
  FAILURE_POINTS,
  PERMISSIONS,
  RULE_FAILURE_POINTS,
  RULE_MUTATIONS,
  createInMemoryReminderPlatform,
  createInMemoryReminderRuleRepository,
  createReminderReconciliationEffect,
  createReminderRuleMutationEffect,
  fingerprintReminderRuleDefinition,
  normalizeReminderRule,
  normalizePlatformSnapshot,
  observeReminderScheduling,
  retryReminderRuleMutation,
  validateReminderReconciliationReceipt,
  validateReminderRuleMutationReceipt,
} = reminderContract;

function definition(payload = { opaqueKind: "OWNER_UNDECIDED", opaqueRule: "fixture-only" }, overrides = {}) {
  return {
    schemaVersion: "REMINDER_RULE_DEFINITION_V1",
    definitionSchemaId: overrides.definitionSchemaId ?? "REMINDER_RULE_INPUT_CANDIDATE",
    definitionSchemaVersion: overrides.definitionSchemaVersion ?? "v1",
    payload,
  };
}

function occurrence(id = "occurrence-1", overrides = {}) {
  return {
    occurrenceId: id,
    requestedLocalDateTime: overrides.requestedLocalDateTime ?? "2026-11-01T01:30:00",
    resolvedLocalDateTime: overrides.resolvedLocalDateTime ?? "2026-11-01T01:30:00",
    timeZoneId: overrides.timeZoneId ?? "America/New_York",
    timeZoneRulesVersion: overrides.timeZoneRulesVersion ?? "tzdb-2026a",
    resolutionPolicyId: overrides.resolutionPolicyId ?? "OWNER_UNDECIDED_DST_POLICY_FIXTURE",
    resolvedAt: overrides.resolvedAt ?? "2026-11-01T01:30:00-04:00",
  };
}

function ruleDraft(id = "rule-1", options = {}) {
  const storedDefinition = options.definition ?? definition();
  return {
    id,
    definition: storedDefinition,
    plan: {
      schemaVersion: "REMINDER_OCCURRENCE_PLAN_V1",
      plannerProfileId: options.plannerProfileId ?? "TEST_PLANNER",
      plannerProfileVersion: options.plannerProfileVersion ?? "v1",
      ruleDefinitionFingerprint: fingerprintReminderRuleDefinition(storedDefinition),
      occurrences: options.occurrences ?? [occurrence()],
    },
  };
}

function persistedRule(id = "rule-1", options = {}) {
  return normalizeReminderRule({
    schemaVersion: "REMINDER_RULE_SCHEDULE_V1",
    ...ruleDraft(id, options),
    revision: options.revision ?? 1,
  });
}

function emptyPlatform() {
  return { schemaVersion: "REMINDER_PLATFORM_SNAPSHOT_V1", scope: "NUTTIE_REMINDERS_ONLY", appliedDesiredStateGeneration: null, appliedDesiredStateFingerprint: null, appliedRulesGeneration: null, appliedRulesFingerprint: null, pending: [], delivered: [] };
}

function upsertRuleEffect(commandId, draft, expectedRevision = null) {
  return createReminderRuleMutationEffect({ commandId, mutation: { kind: RULE_MUTATIONS.UPSERT, expectedRevision, rule: draft } });
}

function reconcileEffect(commandId, permission, rules, platformSnapshot, rulesGeneration = 1, desiredStateGeneration = rulesGeneration, attempt = 1) {
  return createReminderReconciliationEffect({ commandId, permission, rules, rulesGeneration, desiredStateGeneration, platformSnapshot, attempt });
}

test("stores an opaque versioned rule definition and binds every planned occurrence to its fingerprint", () => {
  const inputDefinition = definition({ categoryCandidate: "not-interpreted", recurrenceCandidate: { raw: [1, 3, 5] } });
  const normalized = persistedRule("opaque", { definition: inputDefinition });

  assert.deepEqual(normalized.definition, inputDefinition);
  assert.equal(normalized.plan.ruleDefinitionFingerprint, fingerprintReminderRuleDefinition(inputDefinition));
  assert.equal(Object.isFrozen(normalized.definition.payload), true);

  const forged = structuredClone(normalized);
  forged.definition.payload.recurrenceCandidate.raw[0] = 9;
  assert.throws(() => normalizeReminderRule(forged), { code: "REMINDER_PLAN_DEFINITION_MISMATCH" });
});

test("preserves requested and resolved DST evidence without selecting a default resolution policy", () => {
  const shifted = persistedRule("dst-gap", {
    occurrences: [occurrence("gap", {
      requestedLocalDateTime: "2026-03-08T02:30:00",
      resolvedLocalDateTime: "2026-03-08T03:30:00",
      resolutionPolicyId: "FIXTURE_SHIFT_FORWARD_NOT_PRODUCT_DEFAULT",
      resolvedAt: "2026-03-08T03:30:00-04:00",
    })],
  });
  const occurrenceEvidence = shifted.plan.occurrences[0];

  assert.equal(occurrenceEvidence.requestedLocalDateTime, "2026-03-08T02:30:00");
  assert.equal(occurrenceEvidence.resolvedLocalDateTime, "2026-03-08T03:30:00");
  assert.equal(occurrenceEvidence.timeZoneRulesVersion, "tzdb-2026a");
  assert.equal(occurrenceEvidence.resolutionPolicyId, "FIXTURE_SHIFT_FORWARD_NOT_PRODUCT_DEFAULT");
  assert.equal(occurrenceEvidence.resolvedAt, "2026-03-08T03:30:00-04:00");
});

test("rejects malformed instants, mismatched resolved wall time, duplicate occurrences, unknown fields, and oversized definitions", () => {
  assert.throws(() => persistedRule("no-offset", { occurrences: [occurrence("x", { resolvedAt: "2026-11-01T01:30:00" })] }), { code: "INVALID_REMINDER_OCCURRENCE" });
  assert.throws(() => persistedRule("mismatch", { occurrences: [occurrence("x", { resolvedLocalDateTime: "2026-11-01T02:30:00" })] }), { code: "INVALID_REMINDER_OCCURRENCE" });
  assert.throws(() => persistedRule("duplicate", { occurrences: [occurrence("same"), occurrence("same")] }), { code: "DUPLICATE_REMINDER_OCCURRENCE" });
  assert.throws(() => normalizeReminderRule({ ...persistedRule("known"), notificationTitle: "guess" }), { code: "INVALID_REMINDER_RULE" });
  assert.throws(() => persistedRule("oversized", { definition: definition({ huge: "x".repeat(4097) }) }), { code: "INVALID_REMINDER_RULE_DEFINITION" });
});

test("accepts an empty finite planning window without treating the local rule as deleted", async () => {
  const localRule = persistedRule("no-near-occurrence", { occurrences: [] });
  const effect = reconcileEffect("empty-window", PERMISSIONS.AUTHORIZED, [localRule], emptyPlatform());
  const platform = createInMemoryReminderPlatform();
  const outcome = await platform.execute(effect);
  const observation = observeReminderScheduling({ permission: PERMISSIONS.AUTHORIZED, rules: [localRule], rulesGeneration: 1, desiredStateGeneration: 1, platformSnapshot: outcome.receipt.platformSnapshot });

  assert.equal(observation.localRuleCount, 1);
  assert.equal(observation.plannedOccurrenceCount, 0);
  assert.equal(observation.status, "NO_OCCURRENCES_IN_WINDOW");
  assert.equal(observation.reconciliationRequired, false);
});

test("creates, updates, and deletes local rules with revision CAS and complete receipts", async () => {
  const repository = createInMemoryReminderRuleRepository();
  const createEffect = upsertRuleEffect("rule-create", ruleDraft("crud"));
  const created = await repository.execute(createEffect);
  const createReceipt = validateReminderRuleMutationReceipt({ baselineRules: [], effect: createEffect, outcome: created });
  assert.equal(createReceipt.afterRule.revision, 1);
  assert.equal(createReceipt.afterGeneration, 1);

  const updatedDraft = ruleDraft("crud", { occurrences: [occurrence("updated", { resolvedAt: "2026-11-01T02:30:00-05:00", requestedLocalDateTime: "2026-11-01T02:30:00", resolvedLocalDateTime: "2026-11-01T02:30:00" })] });
  const updateEffect = upsertRuleEffect("rule-update", updatedDraft, 1);
  const updated = await repository.execute(updateEffect);
  const updateReceipt = validateReminderRuleMutationReceipt({ baselineRules: createReceipt.rules, baselineGeneration: 1, effect: updateEffect, outcome: updated });
  assert.equal(updateReceipt.afterRule.revision, 2);
  assert.equal(updateReceipt.afterGeneration, 2);
  assert.equal(updateReceipt.afterRule.plan.occurrences[0].occurrenceId, "updated");

  const deleteEffect = createReminderRuleMutationEffect({ commandId: "rule-delete", mutation: { kind: RULE_MUTATIONS.DELETE, ruleId: "crud", expectedRevision: 2 } });
  const deleted = await repository.execute(deleteEffect);
  const deleteReceipt = validateReminderRuleMutationReceipt({ baselineRules: updateReceipt.rules, baselineGeneration: 2, effect: deleteEffect, outcome: deleted });
  assert.equal(deleteReceipt.afterRule, null);
  assert.equal(deleteReceipt.afterGeneration, 3);
  assert.deepEqual(deleteReceipt.rules, []);
});

test("local rule persistence is independent from notification permission and platform scheduling", async () => {
  const repository = createInMemoryReminderRuleRepository();
  const effect = upsertRuleEffect("save-while-denied", ruleDraft("kept-local"));
  const outcome = await repository.execute(effect);
  const receipt = validateReminderRuleMutationReceipt({ baselineRules: [], effect, outcome });
  const observation = observeReminderScheduling({ permission: PERMISSIONS.DENIED, rules: receipt.rules, rulesGeneration: receipt.afterGeneration, desiredStateGeneration: receipt.afterGeneration, platformSnapshot: emptyPlatform() });

  assert.equal(receipt.rules.length, 1);
  assert.equal(observation.status, "UNSCHEDULED_PERMISSION");
  assert.equal(observation.permissionActionRequired, true);
  assert.equal(observation.localRuleCount, 1);
  assert.equal(observation.pendingCount, 0);
  const notDetermined = observeReminderScheduling({ permission: PERMISSIONS.NOT_DETERMINED, rules: receipt.rules, rulesGeneration: receipt.afterGeneration, desiredStateGeneration: receipt.afterGeneration, platformSnapshot: emptyPlatform() });
  assert.equal(notDetermined.status, "UNSCHEDULED_PERMISSION");
  assert.equal(notDetermined.localRuleCount, 1);
});

test("stale rule updates fail without mutating the local repository", async () => {
  const baseline = [persistedRule("stale", { revision: 2 })];
  const repository = createInMemoryReminderRuleRepository({ rules: baseline });
  const outcome = await repository.execute(upsertRuleEffect("stale-update", ruleDraft("stale"), 1));

  assert.equal(outcome.status, "FAILURE");
  assert.equal(outcome.commitState, "NOT_COMMITTED");
  assert.equal(outcome.error.code, "STALE_REMINDER_RULE_REVISION");
  assert.deepEqual(repository.snapshot().rules, baseline);
});

test("unknown local commit replays idempotently and rejects command ID payload conflicts", async () => {
  const repository = createInMemoryReminderRuleRepository({ failurePlan: [RULE_FAILURE_POINTS.AFTER_COMMIT] });
  const effect = upsertRuleEffect("unknown-rule", ruleDraft("unknown-rule-record"));
  const failed = await repository.execute(effect);
  const recoveredEffect = retryReminderRuleMutation(effect);
  const recovered = await repository.execute(recoveredEffect);

  assert.equal(failed.commitState, "UNKNOWN");
  assert.equal(recovered.receipt.disposition, "REPLAYED");
  assert.equal(repository.snapshot().rules.length, 1);

  const conflicting = upsertRuleEffect("unknown-rule", ruleDraft("different-rule"));
  const conflict = await repository.execute(conflicting);
  assert.equal(conflict.status, "FAILURE");
  assert.equal(conflict.error.code, "IDEMPOTENCY_CONFLICT");
});

test("pre-commit local failure is retryable and does not reserve the command", async () => {
  const repository = createInMemoryReminderRuleRepository({ failurePlan: [RULE_FAILURE_POINTS.BEFORE_COMMIT] });
  const effect = upsertRuleEffect("precommit-rule", ruleDraft("precommit-rule-record"));
  const failed = await repository.execute(effect);
  const recovered = await repository.execute(retryReminderRuleMutation(effect));

  assert.equal(failed.commitState, "NOT_COMMITTED");
  assert.equal(recovered.status, "SUCCESS");
  assert.equal(recovered.receipt.disposition, "COMMITTED");
});

test("authorized and limited permissions schedule exact finite occurrences using stable Nuttie-owned IDs", async () => {
  const localRule = persistedRule("schedule", { occurrences: [occurrence("morning"), occurrence("evening", { requestedLocalDateTime: "2026-11-01T20:00:00", resolvedLocalDateTime: "2026-11-01T20:00:00", resolvedAt: "2026-11-01T20:00:00-05:00" })] });
  const effect = reconcileEffect("schedule-command", PERMISSIONS.AUTHORIZED, [localRule], emptyPlatform());
  const platform = createInMemoryReminderPlatform();
  const outcome = await platform.execute(effect);
  const receipt = validateReminderReconciliationReceipt({ effect, outcome });

  assert.equal(receipt.targetConverged, true);
  assert.equal(receipt.platformSnapshot.pending.length, 2);
  assert.ok(receipt.platformSnapshot.pending.every((request) => request.requestId.startsWith("nuttie.")));
  assert.ok(receipt.platformSnapshot.pending.every((request) => request.ruleDefinitionFingerprint === fingerprintReminderRuleDefinition(localRule.definition)));
  assert.ok(receipt.platformSnapshot.pending.every((request) => request.definition.definitionSchemaId === "REMINDER_RULE_INPUT_CANDIDATE"));
  assert.deepEqual(receipt.platformSnapshot.delivered, []);

  const limitedEffect = reconcileEffect("limited-permission", PERMISSIONS.LIMITED, [localRule], receipt.platformSnapshot, 1, 2);
  const limitedOutcome = await platform.execute(limitedEffect);
  const limitedReceipt = validateReminderReconciliationReceipt({ effect: limitedEffect, outcome: limitedOutcome });
  const limitedObservation = observeReminderScheduling({ permission: PERMISSIONS.LIMITED, rules: [localRule], rulesGeneration: 1, desiredStateGeneration: 2, platformSnapshot: limitedReceipt.platformSnapshot });
  assert.equal(limitedObservation.status, "SCHEDULED");
  assert.equal(limitedObservation.permissionActionRequired, false);
  assert.equal(limitedObservation.systemPresentationGuaranteed, false);
});

test("permission denial or restriction removes pending Nuttie requests but preserves local rules and delivered history", async () => {
  const localRule = persistedRule("revoke");
  const authorizedEffect = reconcileEffect("initial-schedule", PERMISSIONS.AUTHORIZED, [localRule], emptyPlatform());
  const initialPlatform = createInMemoryReminderPlatform();
  const scheduled = await initialPlatform.execute(authorizedEffect);
  const pending = scheduled.receipt.platformSnapshot.pending;
  const delivered = [{
    schemaVersion: "DELIVERED_REMINDER_V1",
    requestId: pending[0].requestId,
    ruleId: "revoke",
    occurrenceId: "occurrence-1",
    deliveredAt: "2026-11-01T06:35:00Z",
  }];
  const revokedSnapshot = normalizePlatformSnapshot({ ...scheduled.receipt.platformSnapshot, delivered });
  const revokedEffect = reconcileEffect("revoke-schedule", PERMISSIONS.RESTRICTED, [localRule], revokedSnapshot, 1, 2);
  const revokedPlatform = createInMemoryReminderPlatform({ platformSnapshot: revokedSnapshot });
  const outcome = await revokedPlatform.execute(revokedEffect);
  const receipt = validateReminderReconciliationReceipt({ effect: revokedEffect, outcome });

  assert.deepEqual(receipt.platformSnapshot.pending, []);
  assert.equal(receipt.platformSnapshot.delivered.length, 1);
  const observation = observeReminderScheduling({ permission: PERMISSIONS.RESTRICTED, rules: [localRule], rulesGeneration: 1, desiredStateGeneration: 2, platformSnapshot: receipt.platformSnapshot });
  assert.equal(observation.status, "UNSCHEDULED_PERMISSION");
  assert.equal(observation.localRuleCount, 1);
  assert.equal(observation.deliveredCount, 1);
});

test("rule revisions replace stale pending requests and deleting all rules removes pending requests", async () => {
  const oldRule = persistedRule("replace", { revision: 1 });
  const firstEffect = reconcileEffect("replace-v1", PERMISSIONS.AUTHORIZED, [oldRule], emptyPlatform());
  const platform = createInMemoryReminderPlatform();
  const first = await platform.execute(firstEffect);
  const newRule = persistedRule("replace", { revision: 2 });
  const secondEffect = reconcileEffect("replace-v2", PERMISSIONS.AUTHORIZED, [newRule], first.receipt.platformSnapshot, 2);
  const second = await platform.execute(secondEffect);
  const secondReceipt = validateReminderReconciliationReceipt({ effect: secondEffect, outcome: second });

  assert.equal(secondReceipt.platformSnapshot.pending.length, 1);
  assert.equal(secondReceipt.platformSnapshot.pending[0].ruleRevision, 2);

  const deleteEffect = reconcileEffect("replace-delete", PERMISSIONS.AUTHORIZED, [], secondReceipt.platformSnapshot, 3);
  const deleted = await platform.execute(deleteEffect);
  const deleteReceipt = validateReminderReconciliationReceipt({ effect: deleteEffect, outcome: deleted });
  assert.deepEqual(deleteReceipt.platformSnapshot.pending, []);
  assert.equal(observeReminderScheduling({ permission: PERMISSIONS.AUTHORIZED, rules: [], rulesGeneration: 3, desiredStateGeneration: 3, platformSnapshot: deleteReceipt.platformSnapshot }).status, "EMPTY");
});

test("an unknown partial platform result is repaired by re-enumeration and a fresh idempotent reconciliation", async () => {
  const localRule = persistedRule("partial", { occurrences: [occurrence("one"), occurrence("two", { requestedLocalDateTime: "2026-11-02T08:00:00", resolvedLocalDateTime: "2026-11-02T08:00:00", resolvedAt: "2026-11-02T08:00:00-05:00" })] });
  const effect = reconcileEffect("partial-command", PERMISSIONS.AUTHORIZED, [localRule], emptyPlatform());
  const platform = createInMemoryReminderPlatform({ failurePlan: [FAILURE_POINTS.AFTER_FIRST_OPERATION] });
  const failed = await platform.execute(effect);

  assert.equal(failed.commitState, "UNKNOWN");
  assert.equal(platform.snapshot().platformSnapshot.pending.length, 1);
  const observed = platform.snapshot().platformSnapshot;
  const repairEffect = reconcileEffect("partial-command-retry", PERMISSIONS.AUTHORIZED, [localRule], observed);
  const repaired = await platform.execute(repairEffect);
  const receipt = validateReminderReconciliationReceipt({ effect: repairEffect, outcome: repaired });
  assert.equal(receipt.targetConverged, true);
  assert.equal(receipt.platformSnapshot.pending.length, 2);
});

test("a post-operation unknown result can be retried from a fresh snapshot as already converged", async () => {
  const localRule = persistedRule("unknown-after-all");
  const effect = reconcileEffect("after-all", PERMISSIONS.AUTHORIZED, [localRule], emptyPlatform());
  const platform = createInMemoryReminderPlatform({ failurePlan: [FAILURE_POINTS.AFTER_ALL_OPERATIONS] });
  const failed = await platform.execute(effect);
  assert.equal(failed.commitState, "UNKNOWN");

  const fresh = platform.snapshot().platformSnapshot;
  const retryEffect = reconcileEffect("after-all-retry", PERMISSIONS.AUTHORIZED, [localRule], fresh);
  const recovered = await platform.execute(retryEffect);
  const receipt = validateReminderReconciliationReceipt({ effect: retryEffect, outcome: recovered });
  assert.equal(receipt.disposition, "ALREADY_CONVERGED");
  assert.equal(receipt.targetConverged, true);
});

test("a pre-operation platform failure changes neither pending nor delivered state", async () => {
  const localRule = persistedRule("pre-op");
  const initial = emptyPlatform();
  const effect = reconcileEffect("pre-op-command", PERMISSIONS.AUTHORIZED, [localRule], initial);
  const platform = createInMemoryReminderPlatform({ failurePlan: [FAILURE_POINTS.BEFORE_OPERATIONS] });
  const failed = await platform.execute(effect);

  assert.equal(failed.commitState, "NOT_COMMITTED");
  assert.deepEqual(platform.snapshot().platformSnapshot, initial);
});

test("concurrent platform reconciliations reject a stale generation instead of allowing last-writer rollback", async () => {
  const leftRule = persistedRule("left", { occurrences: [occurrence("left-occurrence")] });
  const rightRule = persistedRule("right", { occurrences: [occurrence("right-occurrence")] });
  const platform = createInMemoryReminderPlatform();
  const rightEffect = reconcileEffect("right-command", PERMISSIONS.AUTHORIZED, [rightRule], emptyPlatform(), 2);
  const leftEffect = reconcileEffect("left-command", PERMISSIONS.AUTHORIZED, [leftRule], emptyPlatform(), 1);
  const [right, left] = await Promise.all([platform.execute(rightEffect), platform.execute(leftEffect)]);

  assert.equal(right.status, "SUCCESS");
  assert.equal(left.status, "FAILURE");
  assert.equal(left.error.code, "STALE_REMINDER_RECONCILIATION");
  assert.equal(platform.snapshot().platformSnapshot.pending.length, 1);
  assert.equal(platform.snapshot().platformSnapshot.pending[0].ruleId, "right");

  const permissionPlatform = createInMemoryReminderPlatform();
  const rule = persistedRule("permission-race");
  const denied = reconcileEffect("permission-denied-new", PERMISSIONS.DENIED, [rule], emptyPlatform(), 1, 2);
  const authorized = reconcileEffect("permission-authorized-old", PERMISSIONS.AUTHORIZED, [rule], emptyPlatform(), 1, 1);
  const [deniedOutcome, authorizedOutcome] = await Promise.all([permissionPlatform.execute(denied), permissionPlatform.execute(authorized)]);
  assert.equal(deniedOutcome.status, "SUCCESS");
  assert.equal(authorizedOutcome.status, "FAILURE");
  assert.equal(authorizedOutcome.error.code, "STALE_REMINDER_RECONCILIATION");
  assert.deepEqual(permissionPlatform.snapshot().platformSnapshot.pending, []);

  const conflictingSameGeneration = reconcileEffect("permission-conflict", PERMISSIONS.AUTHORIZED, [rule], permissionPlatform.snapshot().platformSnapshot, 1, 2);
  const conflictOutcome = await permissionPlatform.execute(conflictingSameGeneration);
  assert.equal(conflictOutcome.status, "FAILURE");
  assert.equal(conflictOutcome.error.code, "REMINDER_DESIRED_STATE_GENERATION_CONFLICT");
});

test("rejects forged effects, unscoped snapshots, duplicate pending IDs, and non-converged receipts", async () => {
  const localRule = persistedRule("forgery");
  const effect = reconcileEffect("forged-command", PERMISSIONS.AUTHORIZED, [localRule], emptyPlatform());
  const forgedEffect = { ...effect, fingerprint: "0".repeat(64) };
  await assert.rejects(() => createInMemoryReminderPlatform().execute(forgedEffect), { code: "INVALID_REMINDER_RECONCILIATION" });
  assert.throws(() => normalizePlatformSnapshot({ ...emptyPlatform(), scope: "ALL_APP_NOTIFICATIONS" }), { code: "INVALID_REMINDER_PLATFORM_SNAPSHOT" });
  assert.throws(() => reconcileEffect("bad-generation-order", PERMISSIONS.AUTHORIZED, [localRule], emptyPlatform(), 2, 1), { code: "INVALID_REMINDER_RECONCILIATION" });

  const platform = createInMemoryReminderPlatform();
  const outcome = await platform.execute(effect);
  const duplicate = structuredClone(outcome.receipt.platformSnapshot.pending[0]);
  assert.throws(() => normalizePlatformSnapshot({ ...outcome.receipt.platformSnapshot, pending: [duplicate, duplicate] }), { code: "DUPLICATE_PENDING_REMINDER" });

  const forgedOutcome = structuredClone(outcome);
  forgedOutcome.receipt.platformSnapshot.pending = [];
  assert.throws(() => validateReminderReconciliationReceipt({ effect, outcome: forgedOutcome }), { code: "INVALID_REMINDER_RECONCILIATION_OUTCOME" });

  const pending = outcome.receipt.platformSnapshot.pending[0];
  const delivered = [{ schemaVersion: "DELIVERED_REMINDER_V1", requestId: pending.requestId, ruleId: "forgery", occurrenceId: "occurrence-1", deliveredAt: "2026-11-01T06:35:00Z" }];
  const deniedInput = normalizePlatformSnapshot({ ...outcome.receipt.platformSnapshot, delivered });
  const deniedEffect = reconcileEffect("forged-delivered", PERMISSIONS.DENIED, [localRule], deniedInput, 1, 2);
  const deniedPlatform = createInMemoryReminderPlatform({ platformSnapshot: deniedInput });
  const deniedOutcome = await deniedPlatform.execute(deniedEffect);
  const lostDelivered = structuredClone(deniedOutcome);
  lostDelivered.receipt.platformSnapshot.delivered = [];
  assert.throws(() => validateReminderReconciliationReceipt({ effect: deniedEffect, outcome: lostDelivered }), { code: "INVALID_REMINDER_RECONCILIATION_OUTCOME" });
});

test("snapshots mutable inputs and exposes no notification type, recurrence default, content, push, network, or background timer API", async () => {
  const mutableDraft = ruleDraft("immutable");
  const effect = upsertRuleEffect("immutable-rule", mutableDraft);
  mutableDraft.definition.payload.opaqueKind = "changed";
  mutableDraft.plan.occurrences[0].resolvedAt = "2027-01-01T00:00:00Z";
  const repository = createInMemoryReminderRuleRepository();
  await repository.execute(effect);
  assert.equal(repository.snapshot().rules[0].definition.payload.opaqueKind, "OWNER_UNDECIDED");
  assert.equal(repository.snapshot().rules[0].plan.occurrences[0].resolvedAt, "2026-11-01T01:30:00-04:00");

  const exported = Object.keys(reminderContract).join(" ").toLowerCase();
  for (const forbidden of ["notificationtype", "recurrence", "weekday", "daily", "weekly", "content", "title", "body", "push", "apns", "network", "backgroundtimer"]) {
    assert.equal(exported.includes(forbidden), false, `unexpected public API: ${forbidden}`);
  }
});
