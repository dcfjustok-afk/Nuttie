import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ASSERTION_BOUNDARY,
  BOUNDARY,
  MAX_GENERATIONS,
  PENDING_PROFILE,
  createGenerationObservation,
  createHypotheticalRestoreIntent,
  createRestoreFixture,
  createRestoreObservation,
  normalizeRestoreState,
  reconcileRestoreState,
} from "./backup-reconcile-harness.mjs";

const TEST_PATH = fileURLToPath(import.meta.url);
const HARNESS_PATH = fileURLToPath(new URL("./backup-reconcile-harness.mjs", import.meta.url));
const HASHES = Object.freeze({
  old: "1".repeat(64),
  next: "2".repeat(64),
  bad: "3".repeat(64),
});

function generation(generationId, status = "COMPLETE_OPENABLE", artifactFingerprint = HASHES.next) {
  return createGenerationObservation({
    schemaVersion: "RESTORE_GENERATION_OBSERVATION_INPUT_V1",
    generationId,
    status,
    artifactFingerprint,
    evidenceId: `evidence-${generationId}`,
    verifierId: "caller-generation-observer",
    profileId: "pending-native-verifier",
  });
}

function intent(oldGeneration, newGeneration) {
  return createHypotheticalRestoreIntent({
    schemaVersion: "RESTORE_INTENT_INPUT_V1",
    operationId: "restore-op-1",
    oldRef: oldGeneration.generationId,
    newRef: newGeneration.generationId,
    expectedGenerationFingerprint: newGeneration.observationFingerprint,
    protocol: PENDING_PROFILE,
    selectedModeId: null,
    modeAuthorization: "NOT_AUTHORIZED_PENDING_D030",
  });
}

function observation({ activeRef = "gen-old", previousRef = null, restoreIntent = null, generations = [generation("gen-old", "COMPLETE_OPENABLE", HASHES.old)] } = {}) {
  return createRestoreObservation({
    schemaVersion: "RESTORE_OBSERVATION_INPUT_V1",
    activeRef,
    previousRef,
    intent: restoreIntent,
    generations,
  });
}

test("a complete caller-observed active generation is the only stable write-open state", () => {
  const fixture = createRestoreFixture();
  const result = reconcileRestoreState(fixture);
  assert.equal(result.status, "STABLE");
  assert.equal(result.writesOpen, true);
  assert.equal(result.plan, null);
  assert.equal(result.observation.activeRef, "gen-old");
  assert.equal(result.boundary.effectsCommitted, false);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.observation.generations[0]), true);
});

test("missing, incomplete, mismatched, unavailable-key, and unknown active generations fail closed", () => {
  for (const status of ["INCOMPLETE", "HASH_MISMATCH", "KEY_UNAVAILABLE", "UNKNOWN"]) {
    const result = reconcileRestoreState(observation({ generations: [generation("gen-old", status, HASHES.old)] }));
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.writesOpen, false);
    assert.equal(result.reason, "ACTIVE_GENERATION_NOT_COMPLETE_OPENABLE");
  }
  const missing = reconcileRestoreState(observation({ generations: [] }));
  assert.equal(missing.status, "BLOCKED");
  assert.equal(missing.writesOpen, false);
});

test("a previous reference must identify a different complete openable generation", () => {
  const current = generation("gen-current");
  const previous = generation("gen-previous", "INCOMPLETE", HASHES.old);
  const result = reconcileRestoreState(observation({ activeRef: current.generationId, previousRef: previous.generationId, generations: [current, previous] }));
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.reason, "PREVIOUS_GENERATION_REFERENCE_INVALID");
  const missing = reconcileRestoreState(observation({ activeRef: current.generationId, previousRef: "gen-missing", generations: [current] }));
  assert.equal(missing.reason, "PREVIOUS_GENERATION_REFERENCE_INVALID");
});

test("generation observations are exact immutable caller assertions bound by fingerprints", () => {
  const value = generation("gen-next");
  assert.equal(value.assertionBoundary, ASSERTION_BOUNDARY);
  assert.match(value.observationFingerprint, /^[a-f0-9]{64}$/);
  const changed = structuredClone(value);
  changed.status = "INCOMPLETE";
  assert.throws(() => normalizeRestoreState(observation({ activeRef: "gen-next", generations: [changed] })), { code: "INVALID_GENERATION_OBSERVATION" });
  assert.throws(() => createGenerationObservation({ ...structuredClone({
    schemaVersion: "RESTORE_GENERATION_OBSERVATION_INPUT_V1",
    generationId: "gen-next",
    status: "COMPLETE_OPENABLE",
    artifactFingerprint: HASHES.next,
    evidenceId: "evidence-gen-next",
    verifierId: "observer",
    profileId: "profile",
  }), extra: true }), { code: "INVALID_GENERATION_OBSERVATION" });
});

test("invalid identifiers, hashes, statuses, accessors, symbols, and special prototypes are rejected", () => {
  const base = {
    schemaVersion: "RESTORE_GENERATION_OBSERVATION_INPUT_V1",
    generationId: "gen-next",
    status: "COMPLETE_OPENABLE",
    artifactFingerprint: HASHES.next,
    evidenceId: "evidence-gen-next",
    verifierId: "observer",
    profileId: "profile",
  };
  assert.throws(() => createGenerationObservation({ ...base, generationId: "../gen" }), { code: "INVALID_GENERATION_OBSERVATION" });
  assert.throws(() => createGenerationObservation({ ...base, artifactFingerprint: "not-a-hash" }), { code: "INVALID_GENERATION_OBSERVATION" });
  assert.throws(() => createGenerationObservation({ ...base, status: "VERIFIED" }), { code: "INVALID_GENERATION_OBSERVATION" });
  const accessor = { ...base };
  Object.defineProperty(accessor, "status", { enumerable: true, get: () => "COMPLETE_OPENABLE" });
  assert.throws(() => createGenerationObservation(accessor), { code: "INVALID_GENERATION_OBSERVATION" });
  const symbol = { ...base, [Symbol("hidden")]: true };
  assert.throws(() => createGenerationObservation(symbol), { code: "INVALID_GENERATION_OBSERVATION" });
  assert.throws(() => createGenerationObservation(Object.assign(Object.create({ inherited: true }), base)), { code: "INVALID_GENERATION_OBSERVATION" });
});

test("hypothetical intents preserve every pending decision and bind the exact new observation", () => {
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const newGeneration = generation("gen-new");
  const value = intent(oldGeneration, newGeneration);
  assert.equal(value.protocol, PENDING_PROFILE);
  assert.equal(value.selectedModeId, null);
  assert.equal(value.modeAuthorization, "NOT_AUTHORIZED_PENDING_D030");
  assert.equal(value.expectedGenerationFingerprint, newGeneration.observationFingerprint);
  assert.equal(value.intentBoundary, "HYPOTHETICAL_RECONCILE_FIXTURE_NOT_PERSISTENCE_AUTHORIZATION");
  assert.equal(Object.isFrozen(value), true);
});

test("approved-looking protocols, selected modes, equal refs, bad hashes, and extra intent fields fail closed", () => {
  const base = {
    schemaVersion: "RESTORE_INTENT_INPUT_V1",
    operationId: "restore-op-1",
    oldRef: "gen-old",
    newRef: "gen-new",
    expectedGenerationFingerprint: HASHES.next,
    protocol: PENDING_PROFILE,
    selectedModeId: null,
    modeAuthorization: "NOT_AUTHORIZED_PENDING_D030",
  };
  assert.throws(() => createHypotheticalRestoreIntent({ ...base, protocol: "ARGON2_AES_GCM_APPROVED" }), { code: "RESTORE_POLICY_NOT_AUTHORIZED" });
  assert.throws(() => createHypotheticalRestoreIntent({ ...base, selectedModeId: "REPLACE" }), { code: "RESTORE_POLICY_NOT_AUTHORIZED" });
  assert.throws(() => createHypotheticalRestoreIntent({ ...base, modeAuthorization: "APPROVED" }), { code: "RESTORE_POLICY_NOT_AUTHORIZED" });
  assert.throws(() => createHypotheticalRestoreIntent({ ...base, newRef: "gen-old" }), { code: "INVALID_RESTORE_INTENT" });
  assert.throws(() => createHypotheticalRestoreIntent({ ...base, expectedGenerationFingerprint: "x" }), { code: "INVALID_RESTORE_INTENT" });
  assert.throws(() => createHypotheticalRestoreIntent({ ...base, extra: true }), { code: "INVALID_RESTORE_INTENT" });
});

test("restore observations are canonical, bounded, exact, immutable, and tamper evident", () => {
  const z = generation("gen-z");
  const a = generation("gen-a", "COMPLETE_OPENABLE", HASHES.old);
  const value = observation({ activeRef: "gen-a", generations: [z, a] });
  assert.deepEqual(value.generations.map(({ generationId }) => generationId), ["gen-a", "gen-z"]);
  assert.equal(Object.isFrozen(value.generations), true);
  assert.throws(() => observation({ generations: [a, a] }), { code: "DUPLICATE_GENERATION_OBSERVATION" });
  assert.throws(() => observation({ generations: Array.from({ length: MAX_GENERATIONS + 1 }, (_, index) => generation(`gen-${index}`)) }), { code: "RESTORE_OBSERVATION_LIMIT" });
  const tampered = structuredClone(value);
  tampered.activeRef = "gen-z";
  const rejected = reconcileRestoreState(tampered);
  assert.equal(rejected.status, "REJECTED");
  assert.equal(rejected.writesOpen, false);
});

test("sparse arrays, extra array properties, legacy maps, naked booleans, and loose top-level shapes are rejected", () => {
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const sparse = [];
  sparse.length = 1;
  assert.throws(() => observation({ generations: sparse }), { code: "INVALID_RESTORE_OBSERVATION" });
  const extra = [oldGeneration];
  extra.note = "hidden";
  assert.throws(() => observation({ generations: extra }), { code: "INVALID_RESTORE_OBSERVATION" });
  for (const legacy of [
    { activeRef: "gen-old", previousRef: null, intent: null, generations: { "gen-old": { complete: true, hashMatched: true } } },
    { schemaVersion: "RESTORE_OBSERVATION_V1", activeRef: "gen-old", previousRef: null, intent: null, generations: [oldGeneration], assertionBoundary: ASSERTION_BOUNDARY, observationFingerprint: HASHES.old, writesOpen: true },
  ]) {
    const result = reconcileRestoreState(legacy);
    assert.equal(result.status, "REJECTED");
    assert.equal(result.writesOpen, false);
  }
});

test("a final generation without an intent keeps the trusted active generation and authorizes no cleanup", () => {
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const orphan = generation("gen-orphan");
  const result = reconcileRestoreState(observation({ generations: [orphan, oldGeneration] }));
  assert.equal(result.status, "STABLE");
  assert.equal(result.writesOpen, true);
  assert.deepEqual(result.unreferencedGenerationRefs, ["gen-orphan"]);
  assert.equal(result.cleanupAuthorized, false);
  assert.equal(result.boundary.cleanupAuthorized, false);
});

test("intent-before-pointer returns an observation-bound abort plan and keeps writes closed", () => {
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const newGeneration = generation("gen-new");
  const restoreIntent = intent(oldGeneration, newGeneration);
  const state = observation({ restoreIntent, generations: [oldGeneration, newGeneration] });
  const result = reconcileRestoreState(state);
  assert.equal(result.status, "ACTION_REQUIRED");
  assert.equal(result.writesOpen, false);
  assert.equal(result.plan.action, "ABORT_NEW_KEEP_OLD");
  assert.equal(result.plan.observationFingerprint, state.observationFingerprint);
  assert.deepEqual(result.plan.quarantineGenerationRefs, ["gen-new"]);
  assert.equal(result.plan.cleanupAuthorized, false);
  assert.equal(result.plan.effectsCommitted, false);
});

test("a pointer on the exact complete new generation requires finalization before writes open", () => {
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const newGeneration = generation("gen-new");
  const restoreIntent = intent(oldGeneration, newGeneration);
  const result = reconcileRestoreState(observation({ activeRef: "gen-new", restoreIntent, generations: [oldGeneration, newGeneration] }));
  assert.equal(result.status, "ACTION_REQUIRED");
  assert.equal(result.writesOpen, false);
  assert.equal(result.plan.action, "FINALIZE_NEW");
  assert.equal(result.plan.targetActiveRef, "gen-new");
  assert.equal(result.plan.targetPreviousRef, "gen-old");
  assert.equal(result.plan.clearIntent, true);
});

test("finalization never preserves an unusable old generation as previous", () => {
  const expectedOld = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const unavailableOld = generation("gen-old", "KEY_UNAVAILABLE", HASHES.old);
  const newGeneration = generation("gen-new");
  const result = reconcileRestoreState(observation({ activeRef: "gen-new", restoreIntent: intent(expectedOld, newGeneration), generations: [unavailableOld, newGeneration] }));
  assert.equal(result.status, "ACTION_REQUIRED");
  assert.equal(result.writesOpen, false);
  assert.equal(result.plan.action, "FINALIZE_NEW");
  assert.equal(result.plan.targetPreviousRef, null);
  assert.deepEqual(result.plan.quarantineGenerationRefs, ["gen-old"]);
  assert.equal(result.plan.cleanupAuthorized, false);
});

test("incomplete, hash-mismatched, unavailable-key, or missing new generations roll back to a complete old generation", () => {
  for (const status of ["INCOMPLETE", "HASH_MISMATCH", "KEY_UNAVAILABLE", "UNKNOWN"]) {
    const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
    const expectedNew = generation("gen-new");
    const observedNew = generation("gen-new", status, HASHES.bad);
    const result = reconcileRestoreState(observation({ activeRef: "gen-new", restoreIntent: intent(oldGeneration, expectedNew), generations: [oldGeneration, observedNew] }));
    assert.equal(result.plan.action, "ROLLBACK_TO_OLD");
    assert.equal(result.writesOpen, false);
  }
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const expectedNew = generation("gen-new");
  const missing = reconcileRestoreState(observation({ activeRef: "gen-new", restoreIntent: intent(oldGeneration, expectedNew), generations: [oldGeneration] }));
  assert.equal(missing.plan.action, "ROLLBACK_TO_OLD");
  assert.deepEqual(missing.plan.quarantineGenerationRefs, []);
});

test("a complete but different new observation cannot satisfy the intent fingerprint", () => {
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const expectedNew = generation("gen-new", "COMPLETE_OPENABLE", HASHES.next);
  const replacedNew = generation("gen-new", "COMPLETE_OPENABLE", HASHES.bad);
  const result = reconcileRestoreState(observation({ activeRef: "gen-new", restoreIntent: intent(oldGeneration, expectedNew), generations: [oldGeneration, replacedNew] }));
  assert.equal(result.plan.action, "ROLLBACK_TO_OLD");
  assert.equal(result.writesOpen, false);
});

test("unusable old and new generations remain blocked without a cleanup or pointer plan", () => {
  const expectedOld = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const observedOld = generation("gen-old", "KEY_UNAVAILABLE", HASHES.old);
  const expectedNew = generation("gen-new");
  const observedNew = generation("gen-new", "INCOMPLETE", HASHES.bad);
  const result = reconcileRestoreState(observation({ activeRef: "gen-new", restoreIntent: intent(expectedOld, expectedNew), generations: [observedOld, observedNew] }));
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.writesOpen, false);
  assert.equal(result.plan, null);
  assert.equal(result.reason, "NEW_AND_OLD_GENERATIONS_NOT_COMPLETE_OPENABLE");
});

test("unknown active pointers and conflicting previous refs fail closed", () => {
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const newGeneration = generation("gen-new");
  const restoreIntent = intent(oldGeneration, newGeneration);
  const unknown = reconcileRestoreState(observation({ activeRef: "gen-unknown", restoreIntent, generations: [oldGeneration, newGeneration] }));
  assert.equal(unknown.status, "BLOCKED");
  assert.equal(unknown.reason, "UNKNOWN_RESTORE_COMBINATION");
  const conflicting = reconcileRestoreState(observation({ activeRef: "gen-new", previousRef: "gen-other", restoreIntent, generations: [oldGeneration, newGeneration, generation("gen-other")] }));
  assert.equal(conflicting.status, "BLOCKED");
  assert.equal(conflicting.reason, "PREVIOUS_REFERENCE_CONFLICTS_WITH_INTENT");
});

test("plans bind the exact observation and change after any re-observation", () => {
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const newGeneration = generation("gen-new");
  const restoreIntent = intent(oldGeneration, newGeneration);
  const first = reconcileRestoreState(observation({ activeRef: "gen-new", restoreIntent, generations: [oldGeneration, newGeneration] }));
  const changedNew = generation("gen-new", "COMPLETE_OPENABLE", HASHES.bad);
  const second = reconcileRestoreState(observation({ activeRef: "gen-new", restoreIntent, generations: [oldGeneration, changedNew] }));
  assert.notEqual(first.plan.observationFingerprint, second.plan.observationFingerprint);
  assert.notEqual(first.plan.planFingerprint, second.plan.planFingerprint);
  assert.equal(first.plan.action, "FINALIZE_NEW");
  assert.equal(second.plan.action, "ROLLBACK_TO_OLD");
});

test("writes open only after the planned state is externally applied and re-observed", () => {
  const oldGeneration = generation("gen-old", "COMPLETE_OPENABLE", HASHES.old);
  const newGeneration = generation("gen-new");
  const restoreIntent = intent(oldGeneration, newGeneration);
  const before = reconcileRestoreState(observation({ activeRef: "gen-new", restoreIntent, generations: [oldGeneration, newGeneration] }));
  assert.equal(before.writesOpen, false);
  assert.equal(before.plan.effectsCommitted, false);
  const after = reconcileRestoreState(observation({ activeRef: before.plan.targetActiveRef, previousRef: before.plan.targetPreviousRef, generations: [oldGeneration, newGeneration] }));
  assert.equal(after.status, "STABLE");
  assert.equal(after.writesOpen, true);
  assert.equal(after.observation.activeRef, "gen-new");
  assert.equal(after.observation.previousRef, "gen-old");
});

test("boundary makes cryptography, policy, persistence, cleanup, native, clock, and network non-authorization explicit", () => {
  assert.deepEqual(BOUNDARY, {
    contractStatus: "SPIKE_FRAMEWORK_AGNOSTIC_NON_PRODUCTION",
    assertionTruth: ASSERTION_BOUNDARY,
    cryptoProfile: "PENDING_D027",
    restoreMode: "PENDING_D030",
    plaintextExport: "PENDING_D035",
    effectsCommitted: false,
    cleanupAuthorized: false,
    filesystemReads: 0,
    filesystemWrites: 0,
    keychainReads: 0,
    keychainWrites: 0,
    realNetworkRequests: 0,
    nativeApiCalls: 0,
    systemClockRead: false,
    cryptographicVerificationPerformed: false,
  });
});

test("the harness source performs no filesystem, Keychain, network, native, clock, crypto verification, or reconciliation writes", () => {
  const source = fs.readFileSync(HARNESS_PATH, "utf8");
  for (const forbidden of [
    /node:fs/,
    /node:http/,
    /node:https/,
    /fetch\s*\(/,
    /XMLHttpRequest/,
    /Keychain/,
    /SecureStore/,
    /writeFile/,
    /rename\s*\(/,
    /unlink\s*\(/,
    /rmSync/,
    /Date\.now/,
    /new Date\s*\(/,
    /setTimeout/,
    /child_process/,
    /createDecipher/,
    /verify\s*\(/,
  ]) assert.doesNotMatch(source, forbidden);
  assert.match(source, /effectsCommitted: false/);
  assert.match(source, /cleanupAuthorized: false/);
});

void TEST_PATH;
