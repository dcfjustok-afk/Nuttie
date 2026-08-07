import assert from "node:assert/strict";
import test from "node:test";
import {
  PENDING_PROFILE,
  createRestoreFixture,
  normalizeRestoreState,
  reconcileRestoreState,
  simulateCrashBoundary,
  stageGeneration,
  switchActivePointer,
  writeRestoreIntent,
} from "./backup-reconcile-harness.mjs";

test("keeps a complete old generation stable without an intent", () => {
  const result = reconcileRestoreState(createRestoreFixture());
  assert.equal(result.status, "STABLE");
  assert.equal(result.writesOpen, true);
  assert.equal(result.state.activeRef, "gen-old");
});

test("rename before intent keeps old and cleans the orphan new generation", () => {
  const result = simulateCrashBoundary("after-final");
  assert.equal(result.status, "STABLE");
  assert.equal(result.state.activeRef, "gen-old");
  assert.deepEqual(result.cleanup, []);
});

test("intent written before pointer switch keeps old and schedules orphan cleanup", () => {
  const result = simulateCrashBoundary("after-intent");
  assert.equal(result.status, "KEPT_OLD_ORPHAN_CLEANUP");
  assert.equal(result.state.activeRef, "gen-old");
  assert.deepEqual(result.cleanup, ["gen-new"]);
  assert.equal(result.state.intent, null);
});

test("complete new pointer commits new and preserves the previous reference", () => {
  const state = switchActivePointer(writeRestoreIntent(stageGeneration(createRestoreFixture(), "gen-new", { complete: true, hashMatched: true }), { newRef: "gen-new" }), "gen-new");
  const result = reconcileRestoreState(state);
  assert.equal(result.status, "COMMITTED_NEW");
  assert.equal(result.state.activeRef, "gen-new");
  assert.equal(result.state.previousRef, "gen-old");
  assert.equal(result.state.intent, null);
});

test("incomplete or hash-mismatched new pointer rolls back to complete old", () => {
  const state = switchActivePointer(writeRestoreIntent(stageGeneration(createRestoreFixture(), "gen-new", { complete: true, hashMatched: false }), { newRef: "gen-new" }), "gen-new");
  const result = reconcileRestoreState(state);
  assert.equal(result.status, "ROLLED_BACK_OLD");
  assert.equal(result.state.activeRef, "gen-old");
  assert.deepEqual(result.cleanup, ["gen-new"]);
});

test("missing or incomplete old and new generations fail closed", () => {
  const state = switchActivePointer(writeRestoreIntent(stageGeneration(createRestoreFixture(), "gen-new", { complete: false }), { newRef: "gen-new" }), "gen-new");
  delete state.generations["gen-old"];
  const result = reconcileRestoreState(state);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.writesOpen, false);
  assert.equal(result.state.activeRef, "gen-new");
});

test("unknown pointer and intent combinations fail closed", () => {
  const state = normalizeRestoreState({
    activeRef: "gen-unknown",
    previousRef: null,
    intent: { operationId: "op-1", oldRef: "gen-old", newRef: "gen-new", expectedHash: "hash-new", protocol: PENDING_PROFILE },
    generations: { "gen-old": { complete: true, hashMatched: true }, "gen-new": { complete: true, hashMatched: true } },
  });
  const result = reconcileRestoreState(state);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.writesOpen, false);
});

test("algorithm and restore mode remain opaque pending decisions", () => {
  const state = writeRestoreIntent(stageGeneration(createRestoreFixture(), "gen-new", { complete: true, hashMatched: true }), { newRef: "gen-new", protocol: PENDING_PROFILE });
  assert.equal(state.intent.protocol, PENDING_PROFILE);
  assert.equal(reconcileRestoreState(switchActivePointer(state, "gen-new")).status, "COMMITTED_NEW");
});
