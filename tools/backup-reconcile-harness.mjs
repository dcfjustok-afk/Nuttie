const PENDING_PROFILE = "PENDING_D-027_D-030_D-035";

function reject(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code }, details);
  throw error;
}

function clone(value) {
  return structuredClone(value);
}

function validRef(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);
}

function validateGeneration(id, generation) {
  if (!validRef(id) || !generation || typeof generation !== "object") reject("generation is invalid", "INVALID_GENERATION");
  if (typeof generation.complete !== "boolean" || typeof generation.hashMatched !== "boolean") reject("generation completeness flags are required", "INVALID_GENERATION_FLAGS", { id });
  return { complete: generation.complete, hashMatched: generation.hashMatched };
}

export function normalizeRestoreState(input) {
  if (!input || typeof input !== "object" || !input.generations || typeof input.generations !== "object" || Array.isArray(input.generations)) reject("restore state is invalid", "INVALID_RESTORE_STATE");
  const generations = Object.fromEntries(Object.entries(input.generations).map(([id, generation]) => [id, validateGeneration(id, generation)]));
  if (input.activeRef !== null && !validRef(input.activeRef)) reject("activeRef is invalid", "INVALID_ACTIVE_REF");
  if (input.previousRef !== null && input.previousRef !== undefined && !validRef(input.previousRef)) reject("previousRef is invalid", "INVALID_PREVIOUS_REF");
  const intent = input.intent == null ? null : {
    operationId: String(input.intent.operationId || ""),
    oldRef: input.intent.oldRef ?? null,
    newRef: input.intent.newRef ?? null,
    expectedHash: String(input.intent.expectedHash || ""),
    protocol: String(input.intent.protocol || PENDING_PROFILE),
  };
  if (intent && (!intent.operationId || !validRef(intent.oldRef) || !validRef(intent.newRef) || !intent.expectedHash)) reject("restore intent is invalid", "INVALID_RESTORE_INTENT");
  return { activeRef: input.activeRef ?? null, previousRef: input.previousRef ?? null, intent, generations };
}

export function createRestoreFixture() {
  return normalizeRestoreState({
    activeRef: "gen-old",
    previousRef: null,
    intent: null,
    generations: { "gen-old": { complete: true, hashMatched: true } },
  });
}

export function stageGeneration(state, id, { complete = false, hashMatched = false } = {}) {
  const normalized = normalizeRestoreState(state);
  if (!validRef(id) || normalized.generations[id]) reject("generation already exists or is invalid", "GENERATION_CONFLICT", { id });
  normalized.generations[id] = { complete, hashMatched };
  return normalized;
}

export function writeRestoreIntent(state, { operationId = "op-1", oldRef, newRef, expectedHash = "hash-new", protocol = PENDING_PROFILE } = {}) {
  const normalized = normalizeRestoreState(state);
  const old = oldRef ?? normalized.activeRef;
  if (!validRef(old) || !validRef(newRef) || !normalized.generations[newRef]) reject("restore intent references missing generation", "INVALID_RESTORE_INTENT");
  normalized.intent = { operationId, oldRef: old, newRef, expectedHash, protocol };
  return normalized;
}

export function switchActivePointer(state, newRef) {
  const normalized = normalizeRestoreState(state);
  if (!validRef(newRef)) reject("new activeRef is invalid", "INVALID_ACTIVE_REF");
  normalized.activeRef = newRef;
  return normalized;
}

function isComplete(generation) {
  return Boolean(generation?.complete && generation?.hashMatched);
}

export function reconcileRestoreState(input) {
  const state = normalizeRestoreState(input);
  const active = state.generations[state.activeRef];
  const intent = state.intent;
  if (!intent) {
    if (isComplete(active)) return { status: "STABLE", writesOpen: true, state, cleanup: [] };
    return { status: "BLOCKED", writesOpen: false, state, cleanup: [], reason: "ACTIVE_GENERATION_NOT_COMPLETE" };
  }

  const oldGeneration = state.generations[intent.oldRef];
  const newGeneration = state.generations[intent.newRef];
  const oldComplete = isComplete(oldGeneration);
  const newComplete = isComplete(newGeneration);

  if (state.activeRef === intent.newRef && newComplete) {
    const committed = { ...state, previousRef: intent.oldRef, intent: null };
    return { status: "COMMITTED_NEW", writesOpen: true, state: committed, cleanup: oldComplete ? [] : [intent.oldRef] };
  }

  if (state.activeRef === intent.newRef && !newComplete) {
    if (oldComplete) {
      const rolledBack = { ...state, activeRef: intent.oldRef, previousRef: null, intent: null };
      return { status: "ROLLED_BACK_OLD", writesOpen: true, state: rolledBack, cleanup: [intent.newRef] };
    }
    return { status: "BLOCKED", writesOpen: false, state, cleanup: [], reason: "NEW_AND_OLD_GENERATIONS_NOT_COMPLETE" };
  }

  if (state.activeRef === intent.oldRef && oldComplete) {
    const cleanup = newGeneration ? [intent.newRef] : [];
    return { status: "KEPT_OLD_ORPHAN_CLEANUP", writesOpen: true, state: { ...state, intent: null }, cleanup };
  }

  return { status: "BLOCKED", writesOpen: false, state, cleanup: [], reason: "UNKNOWN_RESTORE_COMBINATION" };
}

export function simulateCrashBoundary(boundary = "before-final") {
  let state = createRestoreFixture();
  if (boundary === "before-final") return reconcileRestoreState(state);
  state = stageGeneration(state, "gen-new", { complete: boundary === "after-final" || boundary === "after-intent" || boundary === "after-pointer", hashMatched: boundary === "after-final" || boundary === "after-intent" || boundary === "after-pointer" });
  if (boundary === "after-final") return reconcileRestoreState(state);
  state = writeRestoreIntent(state, { newRef: "gen-new" });
  if (boundary === "after-intent") return reconcileRestoreState(state);
  state = switchActivePointer(state, "gen-new");
  return reconcileRestoreState(state);
}

export { PENDING_PROFILE };
