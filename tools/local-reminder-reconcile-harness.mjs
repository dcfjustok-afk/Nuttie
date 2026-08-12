import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const PERMISSIONS = Object.freeze({
  NOT_DETERMINED: "NOT_DETERMINED",
  DENIED: "DENIED",
  RESTRICTED: "RESTRICTED",
  AUTHORIZED: "AUTHORIZED",
  LIMITED: "LIMITED",
});
const FAILURE_POINTS = Object.freeze({
  BEFORE_OPERATIONS: "BEFORE_OPERATIONS",
  AFTER_FIRST_OPERATION: "AFTER_FIRST_OPERATION",
  AFTER_ALL_OPERATIONS: "AFTER_ALL_OPERATIONS",
});
const RULE_MUTATIONS = Object.freeze({ UPSERT: "UPSERT", DELETE: "DELETE" });
const RULE_FAILURE_POINTS = Object.freeze({ BEFORE_COMMIT: "BEFORE_COMMIT", AFTER_COMMIT: "AFTER_COMMIT" });
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const TIME_ZONE_ID = /^[A-Za-z0-9][A-Za-z0-9._+\/-]{0,127}$/;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|([+-])(\d{2}):(\d{2}))$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_RULES = 4096;
const MAX_OCCURRENCES = 4096;
const MAX_DEFINITION_BYTES = 32768;
const MAX_DEFINITION_NODES = 1024;
const MAX_DEFINITION_DEPTH = 16;

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${field} must be a plain record`, code, { field });
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail(`${field} must be a plain record`, code, { field });
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
  }
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${field}.${key} is required`, code, { field: `${field}.${key}` });
}

function serializable(value, field, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_REMINDER_VALUE", { field });
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) fail(`${field} is not safely serializable`, "INVALID_REMINDER_VALUE", { field });
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item, index) => serializable(item, `${field}[${index}]`, seen));
  else {
    assertPlainRecord(value, field, "INVALID_REMINDER_VALUE");
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_REMINDER_VALUE", { field: `${field}.${key}` });
      serializable(child, `${field}.${key}`, seen);
    }
  }
  seen.delete(value);
}

function clone(value, seen = new Map()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const result = Array.isArray(value) ? [] : {};
  seen.set(value, result);
  for (const [key, child] of Object.entries(value)) result[key] = clone(child, seen);
  return result;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
}

function immutable(value) {
  serializable(value, "value");
  return deepFreeze(clone(value));
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function identifier(value, field, code = "INVALID_REMINDER_RULE") {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) fail(`${field} is invalid`, code, { field });
  return value;
}

function sha256(value, field, code) {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${field} must be a lowercase SHA-256`, code, { field });
  return value;
}

function validateDefinitionPayload(value, field, depth = 0, budget = { nodes: 0 }) {
  budget.nodes += 1;
  if (budget.nodes > MAX_DEFINITION_NODES || depth > MAX_DEFINITION_DEPTH) fail(`${field} exceeds the rule definition resource budget`, "INVALID_REMINDER_RULE_DEFINITION", { field });
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > 4096) fail(`${field} string is too long`, "INVALID_REMINDER_RULE_DEFINITION", { field });
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${field} must be finite`, "INVALID_REMINDER_RULE_DEFINITION", { field });
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 256) fail(`${field} array is too large`, "INVALID_REMINDER_RULE_DEFINITION", { field });
    value.forEach((child, index) => validateDefinitionPayload(child, `${field}[${index}]`, depth + 1, budget));
    return;
  }
  assertPlainRecord(value, field, "INVALID_REMINDER_RULE_DEFINITION");
  const keys = Object.keys(value);
  if (keys.length > 128) fail(`${field} has too many fields`, "INVALID_REMINDER_RULE_DEFINITION", { field });
  for (const [key, child] of Object.entries(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) fail(`${field} contains an unsafe key`, "INVALID_REMINDER_RULE_DEFINITION", { field: `${field}.${key}` });
    validateDefinitionPayload(child, `${field}.${key}`, depth + 1, budget);
  }
}

function normalizeRuleDefinition(input, field = "definition") {
  assertExactKeys(input, ["schemaVersion", "definitionSchemaId", "definitionSchemaVersion", "payload"], [], field, "INVALID_REMINDER_RULE_DEFINITION");
  if (input.schemaVersion !== "REMINDER_RULE_DEFINITION_V1") fail(`${field}.schemaVersion is invalid`, "INVALID_REMINDER_RULE_DEFINITION", { field: `${field}.schemaVersion` });
  assertPlainRecord(input.payload, `${field}.payload`, "INVALID_REMINDER_RULE_DEFINITION");
  validateDefinitionPayload(input.payload, `${field}.payload`);
  if (Buffer.byteLength(canonicalStringify(input.payload), "utf8") > MAX_DEFINITION_BYTES) fail(`${field}.payload is too large`, "INVALID_REMINDER_RULE_DEFINITION", { field: `${field}.payload` });
  return immutable({
    schemaVersion: "REMINDER_RULE_DEFINITION_V1",
    definitionSchemaId: identifier(input.definitionSchemaId, `${field}.definitionSchemaId`, "INVALID_REMINDER_RULE_DEFINITION"),
    definitionSchemaVersion: identifier(input.definitionSchemaVersion, `${field}.definitionSchemaVersion`, "INVALID_REMINDER_RULE_DEFINITION"),
    payload: input.payload,
  });
}

function fingerprintReminderRuleDefinition(input) {
  return fingerprint(normalizeRuleDefinition(input));
}

function localDateTime(value, field) {
  const match = typeof value === "string" ? LOCAL_DATE_TIME.exec(value) : null;
  if (!match) fail(`${field} must be a local ISO date-time with whole seconds`, "INVALID_REMINDER_OCCURRENCE", { field });
  const [, year, month, day, hour, minute, second] = match;
  const datePart = `${year}-${month}-${day}`;
  const validDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString().slice(0, 10) === datePart;
  if (!validDate || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) fail(`${field} is not a real local date-time`, "INVALID_REMINDER_OCCURRENCE", { field });
  return value;
}

function instant(value, field) {
  const match = typeof value === "string" ? INSTANT.exec(value) : null;
  if (!match || !Number.isFinite(Date.parse(value))) fail(`${field} must be an ISO instant with explicit offset`, "INVALID_REMINDER_OCCURRENCE", { field });
  const [, year, month, day, hour, minute, second, zone, , offsetHour, offsetMinute] = match;
  const datePart = `${year}-${month}-${day}`;
  const validDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString().slice(0, 10) === datePart;
  if (!validDate || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 || (zone !== "Z" && (Number(offsetHour) > 23 || Number(offsetMinute) > 59))) {
    fail(`${field} is not a real instant`, "INVALID_REMINDER_OCCURRENCE", { field });
  }
  return value;
}

function normalizeOccurrence(input, field = "occurrence") {
  assertExactKeys(input, [
    "occurrenceId",
    "requestedLocalDateTime",
    "resolvedLocalDateTime",
    "timeZoneId",
    "timeZoneRulesVersion",
    "resolutionPolicyId",
    "resolvedAt",
  ], [], field, "INVALID_REMINDER_OCCURRENCE");
  const requested = localDateTime(input.requestedLocalDateTime, `${field}.requestedLocalDateTime`);
  const resolved = localDateTime(input.resolvedLocalDateTime, `${field}.resolvedLocalDateTime`);
  const resolvedAt = instant(input.resolvedAt, `${field}.resolvedAt`);
  if (resolvedAt.slice(0, 19) !== resolved) fail("resolved local date-time must match the explicit-offset instant", "INVALID_REMINDER_OCCURRENCE", { field: `${field}.resolvedLocalDateTime` });
  if (typeof input.timeZoneId !== "string" || !TIME_ZONE_ID.test(input.timeZoneId)) fail(`${field}.timeZoneId is invalid`, "INVALID_REMINDER_OCCURRENCE", { field: `${field}.timeZoneId` });
  return immutable({
    occurrenceId: identifier(input.occurrenceId, `${field}.occurrenceId`, "INVALID_REMINDER_OCCURRENCE"),
    requestedLocalDateTime: requested,
    resolvedLocalDateTime: resolved,
    timeZoneId: input.timeZoneId,
    timeZoneRulesVersion: identifier(input.timeZoneRulesVersion, `${field}.timeZoneRulesVersion`, "INVALID_REMINDER_OCCURRENCE"),
    resolutionPolicyId: identifier(input.resolutionPolicyId, `${field}.resolutionPolicyId`, "INVALID_REMINDER_OCCURRENCE"),
    resolvedAt,
  });
}

function normalizePlan(input, field = "plan") {
  assertExactKeys(input, ["schemaVersion", "plannerProfileId", "plannerProfileVersion", "ruleDefinitionFingerprint", "occurrences"], [], field, "INVALID_REMINDER_PLAN");
  if (input.schemaVersion !== "REMINDER_OCCURRENCE_PLAN_V1" || !Array.isArray(input.occurrences) || input.occurrences.length > MAX_OCCURRENCES) {
    fail(`${field} is invalid or exceeds the contract resource budget`, "INVALID_REMINDER_PLAN", { field });
  }
  const occurrences = input.occurrences.map((occurrence, index) => normalizeOccurrence(occurrence, `${field}.occurrences[${index}]`));
  const ids = new Set();
  for (const occurrence of occurrences) {
    if (ids.has(occurrence.occurrenceId)) fail("occurrence IDs must be unique within a rule", "DUPLICATE_REMINDER_OCCURRENCE", { occurrenceId: occurrence.occurrenceId });
    ids.add(occurrence.occurrenceId);
  }
  occurrences.sort((left, right) => Date.parse(left.resolvedAt) - Date.parse(right.resolvedAt) || (left.occurrenceId < right.occurrenceId ? -1 : left.occurrenceId > right.occurrenceId ? 1 : 0));
  return immutable({
    schemaVersion: "REMINDER_OCCURRENCE_PLAN_V1",
    plannerProfileId: identifier(input.plannerProfileId, `${field}.plannerProfileId`, "INVALID_REMINDER_PLAN"),
    plannerProfileVersion: identifier(input.plannerProfileVersion, `${field}.plannerProfileVersion`, "INVALID_REMINDER_PLAN"),
    ruleDefinitionFingerprint: sha256(input.ruleDefinitionFingerprint, `${field}.ruleDefinitionFingerprint`, "INVALID_REMINDER_PLAN"),
    occurrences,
  });
}

function normalizeReminderRule(input, field = "rule") {
  assertExactKeys(input, ["schemaVersion", "id", "revision", "definition", "plan"], [], field, "INVALID_REMINDER_RULE");
  if (input.schemaVersion !== "REMINDER_RULE_SCHEDULE_V1" || !Number.isSafeInteger(input.revision) || input.revision < 1) fail(`${field} version or revision is invalid`, "INVALID_REMINDER_RULE", { field });
  const definition = normalizeRuleDefinition(input.definition, `${field}.definition`);
  const plan = normalizePlan(input.plan, `${field}.plan`);
  if (plan.ruleDefinitionFingerprint !== fingerprint(definition)) fail("occurrence plan is not bound to the stored rule definition", "REMINDER_PLAN_DEFINITION_MISMATCH", { field: `${field}.plan.ruleDefinitionFingerprint` });
  return immutable({
    schemaVersion: "REMINDER_RULE_SCHEDULE_V1",
    id: identifier(input.id, `${field}.id`),
    revision: input.revision,
    definition,
    plan,
  });
}

function normalizeRules(rules, field = "rules") {
  if (!Array.isArray(rules) || rules.length > MAX_RULES) fail(`${field} must be a bounded array`, "INVALID_REMINDER_RULE_COLLECTION", { field });
  const normalized = rules.map((rule, index) => normalizeReminderRule(rule, `${field}[${index}]`));
  let occurrenceCount = 0;
  const ids = new Set();
  for (const rule of normalized) {
    if (ids.has(rule.id)) fail("reminder rule IDs must be unique", "DUPLICATE_REMINDER_RULE", { ruleId: rule.id });
    ids.add(rule.id);
    occurrenceCount += rule.plan.occurrences.length;
    if (occurrenceCount > MAX_OCCURRENCES) fail("reminder occurrences exceed the contract resource budget", "REMINDER_OCCURRENCE_SET_TOO_LARGE");
  }
  return normalized.sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
}

function normalizeRuleDraft(input, field = "rule") {
  assertExactKeys(input, ["id", "definition", "plan"], [], field, "INVALID_REMINDER_RULE");
  const normalized = normalizeReminderRule({ schemaVersion: "REMINDER_RULE_SCHEDULE_V1", ...input, revision: 1 }, field);
  return immutable({ id: normalized.id, definition: normalized.definition, plan: normalized.plan });
}

function normalizeRuleMutation(input, field = "mutation") {
  assertPlainRecord(input, field, "INVALID_REMINDER_RULE_MUTATION");
  if (input.kind === RULE_MUTATIONS.UPSERT) {
    assertExactKeys(input, ["kind", "expectedRevision", "rule"], [], field, "INVALID_REMINDER_RULE_MUTATION");
    if (input.expectedRevision !== null && (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1)) fail("expected revision is invalid", "INVALID_REMINDER_RULE_MUTATION");
    return immutable({ kind: RULE_MUTATIONS.UPSERT, expectedRevision: input.expectedRevision, rule: normalizeRuleDraft(input.rule, `${field}.rule`) });
  }
  if (input.kind === RULE_MUTATIONS.DELETE) {
    assertExactKeys(input, ["kind", "expectedRevision", "ruleId"], [], field, "INVALID_REMINDER_RULE_MUTATION");
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) fail("expected revision is invalid", "INVALID_REMINDER_RULE_MUTATION");
    return immutable({ kind: RULE_MUTATIONS.DELETE, expectedRevision: input.expectedRevision, ruleId: identifier(input.ruleId, `${field}.ruleId`, "INVALID_REMINDER_RULE_MUTATION") });
  }
  fail("reminder rule mutation kind is unsupported", "INVALID_REMINDER_RULE_MUTATION");
}

function nonNegativeGeneration(value, field, code) {
  if (!Number.isSafeInteger(value) || value < 0) fail(`${field} must be a non-negative safe integer`, code, { field });
  return value;
}

function applyRuleMutation(rulesInput, mutationInput) {
  const rules = normalizeRules(rulesInput);
  const mutation = normalizeRuleMutation(mutationInput);
  const ruleId = mutation.kind === RULE_MUTATIONS.UPSERT ? mutation.rule.id : mutation.ruleId;
  const index = rules.findIndex((rule) => rule.id === ruleId);
  const existing = index < 0 ? null : rules[index];
  let afterRule;
  let next;
  if (mutation.kind === RULE_MUTATIONS.UPSERT) {
    if (mutation.expectedRevision === null && existing !== null) fail("reminder rule already exists", "REMINDER_RULE_ALREADY_EXISTS");
    if (mutation.expectedRevision !== null && existing?.revision !== mutation.expectedRevision) fail("reminder rule revision is stale", "STALE_REMINDER_RULE_REVISION");
    afterRule = normalizeReminderRule({ schemaVersion: "REMINDER_RULE_SCHEDULE_V1", ...mutation.rule, revision: existing === null ? 1 : existing.revision + 1 });
    next = [...rules];
    if (index < 0) next.push(afterRule); else next[index] = afterRule;
  } else {
    if (existing?.revision !== mutation.expectedRevision) fail("reminder rule revision is stale", "STALE_REMINDER_RULE_REVISION");
    afterRule = null;
    next = rules.filter((rule) => rule.id !== ruleId);
  }
  return immutable({ beforeRule: existing, afterRule, rules: normalizeRules(next) });
}

function createReminderRuleMutationEffect({ commandId, mutation, attempt = 1 }) {
  const command = immutable({ commandId: identifier(commandId, "commandId", "INVALID_REMINDER_RULE_COMMAND"), mutation: normalizeRuleMutation(mutation) });
  if (!Number.isSafeInteger(attempt) || attempt < 1) fail("reminder rule attempt is invalid", "INVALID_REMINDER_RULE_COMMAND");
  return immutable({ type: "APPLY_REMINDER_RULE_MUTATION", command, attempt, fingerprint: fingerprint(command) });
}

function normalizeRuleMutationEffect(input) {
  assertExactKeys(input, ["type", "command", "attempt", "fingerprint"], [], "effect", "INVALID_REMINDER_RULE_COMMAND");
  if (input.type !== "APPLY_REMINDER_RULE_MUTATION" || !SHA256.test(input.fingerprint)) fail("reminder rule effect is invalid", "INVALID_REMINDER_RULE_COMMAND");
  const effect = createReminderRuleMutationEffect({ commandId: input.command?.commandId, mutation: input.command?.mutation, attempt: input.attempt });
  if (!isDeepStrictEqual(input, effect)) fail("reminder rule effect fingerprint is invalid", "INVALID_REMINDER_RULE_COMMAND");
  return effect;
}

function retryReminderRuleMutation(effect) {
  const normalized = normalizeRuleMutationEffect(effect);
  return createReminderRuleMutationEffect({ commandId: normalized.command.commandId, mutation: normalized.command.mutation, attempt: normalized.attempt + 1 });
}

function createRuleMutationReceipt(effect, disposition, applied, beforeGeneration, afterGeneration) {
  return immutable({
    schemaVersion: "REMINDER_RULE_MUTATION_RECEIPT_V1",
    commandId: effect.command.commandId,
    fingerprint: effect.fingerprint,
    disposition,
    beforeGeneration,
    afterGeneration,
    beforeRule: applied.beforeRule,
    afterRule: applied.afterRule,
    rules: applied.rules,
    rulesFingerprint: fingerprint(applied.rules),
  });
}

function createInMemoryReminderRuleRepository({ rules = [], generation = 0, failurePlan = [] } = {}) {
  let stored = normalizeRules(rules);
  let storedGeneration = nonNegativeGeneration(generation, "generation", "INVALID_REMINDER_RULE_REPOSITORY");
  if (!Array.isArray(failurePlan) || failurePlan.some((failure) => !Object.values(RULE_FAILURE_POINTS).includes(failure))) fail("reminder rule failure plan is invalid", "INVALID_REMINDER_RULE_REPOSITORY");
  const failures = [...failurePlan];
  const idempotency = new Map();
  let chain = Promise.resolve();
  let calls = 0;

  async function apply(effectInput) {
    const effect = normalizeRuleMutationEffect(effectInput);
    calls += 1;
    const prior = idempotency.get(effect.command.commandId);
    if (prior) {
      if (prior.fingerprint !== effect.fingerprint) return immutable({ status: "FAILURE", commitState: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "IDEMPOTENCY_CONFLICT" } });
      return immutable({ status: "SUCCESS", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, receipt: createRuleMutationReceipt(effect, "REPLAYED", prior.applied, prior.beforeGeneration, prior.afterGeneration) });
    }
    const failure = failures.shift() ?? null;
    if (failure === RULE_FAILURE_POINTS.BEFORE_COMMIT) return immutable({ status: "FAILURE", commitState: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "REMINDER_RULE_REPOSITORY_UNAVAILABLE" } });
    let applied;
    try {
      applied = applyRuleMutation(stored, effect.command.mutation);
    } catch (error) {
      return immutable({ status: "FAILURE", commitState: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: error.code ?? "REMINDER_RULE_MUTATION_REJECTED" } });
    }
    const beforeGeneration = storedGeneration;
    const afterGeneration = beforeGeneration + 1;
    if (!Number.isSafeInteger(afterGeneration)) fail("reminder rule generation is exhausted", "REMINDER_RULE_GENERATION_EXHAUSTED");
    stored = applied.rules;
    storedGeneration = afterGeneration;
    idempotency.set(effect.command.commandId, immutable({ fingerprint: effect.fingerprint, applied, beforeGeneration, afterGeneration }));
    if (failure === RULE_FAILURE_POINTS.AFTER_COMMIT) return immutable({ status: "FAILURE", commitState: "UNKNOWN", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "REMINDER_RULE_RESPONSE_LOST" } });
    return immutable({ status: "SUCCESS", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, receipt: createRuleMutationReceipt(effect, "COMMITTED", applied, beforeGeneration, afterGeneration) });
  }

  return Object.freeze({
    execute(effect) {
      const run = chain.then(() => apply(effect));
      chain = run.catch(() => undefined);
      return run;
    },
    snapshot() { return immutable({ rules: stored, generation: storedGeneration, idempotencyCount: idempotency.size, calls }); },
  });
}

function validateReminderRuleMutationReceipt({ baselineRules, baselineGeneration = 0, effect: effectInput, outcome }) {
  const effect = normalizeRuleMutationEffect(effectInput);
  const beforeGeneration = nonNegativeGeneration(baselineGeneration, "baselineGeneration", "INVALID_REMINDER_RULE_OUTCOME");
  const afterGeneration = beforeGeneration + 1;
  if (!Number.isSafeInteger(afterGeneration)) fail("reminder rule generation is exhausted", "INVALID_REMINDER_RULE_OUTCOME");
  assertExactKeys(outcome, ["status", "commandId", "fingerprint", "attempt", "receipt"], [], "outcome", "INVALID_REMINDER_RULE_OUTCOME");
  if (outcome.status !== "SUCCESS" || outcome.commandId !== effect.command.commandId || outcome.fingerprint !== effect.fingerprint || outcome.attempt !== effect.attempt) fail("reminder rule outcome is not bound to the effect", "INVALID_REMINDER_RULE_OUTCOME");
  const expected = applyRuleMutation(baselineRules, effect.command.mutation);
  const expectedReceipt = createRuleMutationReceipt(effect, outcome.receipt?.disposition, expected, beforeGeneration, afterGeneration);
  if (!isDeepStrictEqual(outcome.receipt, expectedReceipt) || !["COMMITTED", "REPLAYED"].includes(outcome.receipt?.disposition)) fail("reminder rule receipt is invalid", "INVALID_REMINDER_RULE_OUTCOME");
  return expectedReceipt;
}

function requestId(ruleId, occurrenceId) {
  return `nuttie.${createHash("sha256").update(`REMINDER_REQUEST_V1\0${ruleId}\0${occurrenceId}`).digest("hex").slice(0, 48)}`;
}

function desiredRequest(rule, occurrence) {
  return immutable({
    schemaVersion: "REMINDER_PENDING_REQUEST_V1",
    requestId: requestId(rule.id, occurrence.occurrenceId),
    ruleId: rule.id,
    ruleRevision: rule.revision,
    definition: rule.definition,
    ruleDefinitionFingerprint: rule.plan.ruleDefinitionFingerprint,
    planFingerprint: fingerprint(rule.plan),
    occurrence,
  });
}

function normalizePendingRequest(input, field = "request") {
  assertExactKeys(input, ["schemaVersion", "requestId", "ruleId", "ruleRevision", "definition", "ruleDefinitionFingerprint", "planFingerprint", "occurrence"], [], field, "INVALID_REMINDER_PENDING_REQUEST");
  const occurrence = normalizeOccurrence(input.occurrence, `${field}.occurrence`);
  const ruleId = identifier(input.ruleId, `${field}.ruleId`, "INVALID_REMINDER_PENDING_REQUEST");
  const definition = normalizeRuleDefinition(input.definition, `${field}.definition`);
  if (input.schemaVersion !== "REMINDER_PENDING_REQUEST_V1" || !Number.isSafeInteger(input.ruleRevision) || input.ruleRevision < 1 || input.requestId !== requestId(ruleId, occurrence.occurrenceId)) {
    fail(`${field} identity or revision is invalid`, "INVALID_REMINDER_PENDING_REQUEST", { field });
  }
  const definitionFingerprint = sha256(input.ruleDefinitionFingerprint, `${field}.ruleDefinitionFingerprint`, "INVALID_REMINDER_PENDING_REQUEST");
  if (definitionFingerprint !== fingerprint(definition)) fail(`${field} definition fingerprint is invalid`, "INVALID_REMINDER_PENDING_REQUEST", { field: `${field}.ruleDefinitionFingerprint` });
  return immutable({
    schemaVersion: "REMINDER_PENDING_REQUEST_V1",
    requestId: input.requestId,
    ruleId,
    ruleRevision: input.ruleRevision,
    definition,
    ruleDefinitionFingerprint: definitionFingerprint,
    planFingerprint: sha256(input.planFingerprint, `${field}.planFingerprint`, "INVALID_REMINDER_PENDING_REQUEST"),
    occurrence,
  });
}

function normalizeDelivered(input, field = "delivered") {
  assertExactKeys(input, ["schemaVersion", "requestId", "ruleId", "occurrenceId", "deliveredAt"], [], field, "INVALID_DELIVERED_REMINDER");
  const ruleId = identifier(input.ruleId, `${field}.ruleId`, "INVALID_DELIVERED_REMINDER");
  const occurrenceId = identifier(input.occurrenceId, `${field}.occurrenceId`, "INVALID_DELIVERED_REMINDER");
  if (input.schemaVersion !== "DELIVERED_REMINDER_V1" || input.requestId !== requestId(ruleId, occurrenceId)) fail(`${field} identity is invalid`, "INVALID_DELIVERED_REMINDER", { field });
  return immutable({
    schemaVersion: "DELIVERED_REMINDER_V1",
    requestId: input.requestId,
    ruleId,
    occurrenceId,
    deliveredAt: instant(input.deliveredAt, `${field}.deliveredAt`),
  });
}

function uniqueBy(items, key, code, field) {
  const values = new Set();
  for (const item of items) {
    if (values.has(item[key])) fail(`${field} contains duplicate ${key}`, code, { [key]: item[key] });
    values.add(item[key]);
  }
}

function normalizePlatformSnapshot(input, field = "platformSnapshot") {
  assertExactKeys(input, ["schemaVersion", "scope", "appliedDesiredStateGeneration", "appliedDesiredStateFingerprint", "appliedRulesGeneration", "appliedRulesFingerprint", "pending", "delivered"], [], field, "INVALID_REMINDER_PLATFORM_SNAPSHOT");
  if (input.schemaVersion !== "REMINDER_PLATFORM_SNAPSHOT_V1" || input.scope !== "NUTTIE_REMINDERS_ONLY" || !Array.isArray(input.pending) || !Array.isArray(input.delivered) || input.pending.length > MAX_OCCURRENCES || input.delivered.length > MAX_OCCURRENCES) {
    fail(`${field} is invalid or exceeds the contract resource budget`, "INVALID_REMINDER_PLATFORM_SNAPSHOT", { field });
  }
  const pending = input.pending.map((request, index) => normalizePendingRequest(request, `${field}.pending[${index}]`));
  const delivered = input.delivered.map((item, index) => normalizeDelivered(item, `${field}.delivered[${index}]`));
  const appliedDesiredStateGeneration = input.appliedDesiredStateGeneration === null ? null : nonNegativeGeneration(input.appliedDesiredStateGeneration, `${field}.appliedDesiredStateGeneration`, "INVALID_REMINDER_PLATFORM_SNAPSHOT");
  const appliedDesiredStateFingerprint = input.appliedDesiredStateFingerprint === null ? null : sha256(input.appliedDesiredStateFingerprint, `${field}.appliedDesiredStateFingerprint`, "INVALID_REMINDER_PLATFORM_SNAPSHOT");
  const appliedRulesGeneration = input.appliedRulesGeneration === null ? null : nonNegativeGeneration(input.appliedRulesGeneration, `${field}.appliedRulesGeneration`, "INVALID_REMINDER_PLATFORM_SNAPSHOT");
  const appliedRulesFingerprint = input.appliedRulesFingerprint === null ? null : sha256(input.appliedRulesFingerprint, `${field}.appliedRulesFingerprint`, "INVALID_REMINDER_PLATFORM_SNAPSHOT");
  const watermarkParts = [appliedDesiredStateGeneration, appliedDesiredStateFingerprint, appliedRulesGeneration, appliedRulesFingerprint];
  if (!watermarkParts.every((value) => value === null) && !watermarkParts.every((value) => value !== null)) fail("all applied desired-state watermark fields must be null or present together", "INVALID_REMINDER_PLATFORM_SNAPSHOT", { field });
  if (appliedDesiredStateGeneration !== null && appliedDesiredStateGeneration < appliedRulesGeneration) fail("applied desired-state generation cannot precede the applied rules generation", "INVALID_REMINDER_PLATFORM_SNAPSHOT", { field });
  uniqueBy(pending, "requestId", "DUPLICATE_PENDING_REMINDER", `${field}.pending`);
  uniqueBy(delivered, "requestId", "DUPLICATE_DELIVERED_REMINDER", `${field}.delivered`);
  pending.sort((left, right) => left.requestId < right.requestId ? -1 : left.requestId > right.requestId ? 1 : 0);
  delivered.sort((left, right) => Date.parse(left.deliveredAt) - Date.parse(right.deliveredAt) || (left.requestId < right.requestId ? -1 : left.requestId > right.requestId ? 1 : 0));
  return immutable({ schemaVersion: "REMINDER_PLATFORM_SNAPSHOT_V1", scope: "NUTTIE_REMINDERS_ONLY", appliedDesiredStateGeneration, appliedDesiredStateFingerprint, appliedRulesGeneration, appliedRulesFingerprint, pending, delivered });
}

function normalizePermission(value) {
  if (!Object.values(PERMISSIONS).includes(value)) fail("notification permission is invalid", "INVALID_NOTIFICATION_PERMISSION");
  return value;
}

function deriveDesiredRequests(rulesInput, permissionInput) {
  const rules = normalizeRules(rulesInput);
  const permission = normalizePermission(permissionInput);
  if (![PERMISSIONS.AUTHORIZED, PERMISSIONS.LIMITED].includes(permission)) return immutable([]);
  const desired = rules.flatMap((rule) => rule.plan.occurrences.map((occurrence) => desiredRequest(rule, occurrence)));
  uniqueBy(desired, "requestId", "DUPLICATE_PENDING_REMINDER", "desiredRequests");
  return immutable(desired.sort((left, right) => left.requestId < right.requestId ? -1 : left.requestId > right.requestId ? 1 : 0));
}

function deriveOperations(observed, desired) {
  const desiredById = new Map(desired.map((request) => [request.requestId, request]));
  const observedById = new Map(observed.map((request) => [request.requestId, request]));
  const removals = observed
    .filter((request) => !desiredById.has(request.requestId))
    .map((request) => immutable({ kind: "REMOVE_PENDING", requestId: request.requestId }));
  const upserts = desired
    .filter((request) => !isDeepStrictEqual(observedById.get(request.requestId), request))
    .map((request) => immutable({ kind: "UPSERT_PENDING", request }));
  return immutable([...removals, ...upserts]);
}

function createReminderReconciliationEffect({ commandId, permission, rules, rulesGeneration, desiredStateGeneration, platformSnapshot, attempt = 1 }) {
  const normalizedRules = normalizeRules(rules);
  const normalizedRulesGeneration = nonNegativeGeneration(rulesGeneration, "rulesGeneration", "INVALID_REMINDER_RECONCILIATION");
  const normalizedDesiredStateGeneration = nonNegativeGeneration(desiredStateGeneration, "desiredStateGeneration", "INVALID_REMINDER_RECONCILIATION");
  if (normalizedDesiredStateGeneration < normalizedRulesGeneration) fail("desired-state generation cannot precede the local rules generation", "INVALID_REMINDER_RECONCILIATION");
  const normalizedPermission = normalizePermission(permission);
  const snapshot = normalizePlatformSnapshot(platformSnapshot);
  const rulesFingerprint = fingerprint(normalizedRules);
  const desiredStateFingerprint = fingerprint({ permission: normalizedPermission, rulesGeneration: normalizedRulesGeneration, rulesFingerprint });
  const command = immutable({
    commandId: identifier(commandId, "commandId", "INVALID_REMINDER_RECONCILIATION"),
    permission: normalizedPermission,
    rules: normalizedRules,
    rulesGeneration: normalizedRulesGeneration,
    rulesFingerprint,
    desiredStateGeneration: normalizedDesiredStateGeneration,
    desiredStateFingerprint,
    platformSnapshot: snapshot,
  });
  if (!Number.isSafeInteger(attempt) || attempt < 1) fail("reconciliation attempt is invalid", "INVALID_REMINDER_RECONCILIATION");
  const targetPending = deriveDesiredRequests(normalizedRules, normalizedPermission);
  const operations = deriveOperations(snapshot.pending, targetPending);
  return immutable({
    type: "RECONCILE_LOCAL_REMINDERS",
    command,
    attempt,
    fingerprint: fingerprint(command),
    operations,
    targetPending,
  });
}

function normalizeEffect(input) {
  assertExactKeys(input, ["type", "command", "attempt", "fingerprint", "operations", "targetPending"], [], "effect", "INVALID_REMINDER_RECONCILIATION");
  if (input.type !== "RECONCILE_LOCAL_REMINDERS" || !SHA256.test(input.fingerprint)) fail("reminder reconciliation effect is invalid", "INVALID_REMINDER_RECONCILIATION");
  const effect = createReminderReconciliationEffect({
    commandId: input.command?.commandId,
    permission: input.command?.permission,
    rules: input.command?.rules,
    rulesGeneration: input.command?.rulesGeneration,
    desiredStateGeneration: input.command?.desiredStateGeneration,
    platformSnapshot: input.command?.platformSnapshot,
    attempt: input.attempt,
  });
  if (!isDeepStrictEqual(input, effect)) fail("reminder reconciliation effect is forged or inconsistent", "INVALID_REMINDER_RECONCILIATION");
  return effect;
}

function observeReminderScheduling({ permission, rules, rulesGeneration, desiredStateGeneration, platformSnapshot }) {
  const normalizedRules = normalizeRules(rules);
  const normalizedRulesGeneration = nonNegativeGeneration(rulesGeneration, "rulesGeneration", "INVALID_REMINDER_RECONCILIATION");
  const normalizedDesiredStateGeneration = nonNegativeGeneration(desiredStateGeneration, "desiredStateGeneration", "INVALID_REMINDER_RECONCILIATION");
  const normalizedPermission = normalizePermission(permission);
  const snapshot = normalizePlatformSnapshot(platformSnapshot);
  const desired = deriveDesiredRequests(normalizedRules, normalizedPermission);
  const operations = deriveOperations(snapshot.pending, desired);
  const rulesFingerprint = fingerprint(normalizedRules);
  const desiredStateFingerprint = fingerprint({ permission: normalizedPermission, rulesGeneration: normalizedRulesGeneration, rulesFingerprint });
  const generationMismatch = snapshot.appliedDesiredStateGeneration !== normalizedDesiredStateGeneration ||
    snapshot.appliedDesiredStateFingerprint !== desiredStateFingerprint ||
    snapshot.appliedRulesGeneration !== normalizedRulesGeneration ||
    snapshot.appliedRulesFingerprint !== rulesFingerprint;
  let status;
  if (normalizedRules.length === 0) status = snapshot.pending.length === 0 && !generationMismatch ? "EMPTY" : "RECONCILIATION_REQUIRED";
  else if (![PERMISSIONS.AUTHORIZED, PERMISSIONS.LIMITED].includes(normalizedPermission)) status = "UNSCHEDULED_PERMISSION";
  else if (normalizedRules.every((rule) => rule.plan.occurrences.length === 0) && snapshot.pending.length === 0 && !generationMismatch) status = "NO_OCCURRENCES_IN_WINDOW";
  else status = operations.length === 0 && !generationMismatch ? "SCHEDULED" : "RECONCILIATION_REQUIRED";
  return immutable({
    schemaVersion: "REMINDER_RECONCILIATION_OBSERVATION_V1",
    status,
    permission: normalizedPermission,
    localRuleCount: normalizedRules.length,
    plannedOccurrenceCount: normalizedRules.reduce((count, rule) => count + rule.plan.occurrences.length, 0),
    pendingCount: snapshot.pending.length,
    deliveredCount: snapshot.delivered.length,
    reconciliationRequired: operations.length > 0 || generationMismatch,
    permissionActionRequired: normalizedRules.length > 0 && ![PERMISSIONS.AUTHORIZED, PERMISSIONS.LIMITED].includes(normalizedPermission),
    systemPresentationGuaranteed: false,
  });
}

function applyOperation(pending, operation) {
  if (operation.kind === "REMOVE_PENDING") return pending.filter((request) => request.requestId !== operation.requestId);
  const next = pending.filter((request) => request.requestId !== operation.request.requestId);
  next.push(operation.request);
  return next.sort((left, right) => left.requestId < right.requestId ? -1 : left.requestId > right.requestId ? 1 : 0);
}

function createReceipt(effect, disposition, snapshot) {
  const priorDeliveredPreserved = effect.command.platformSnapshot.delivered.every((prior) =>
    snapshot.delivered.some((current) => isDeepStrictEqual(current, prior))
  );
  return immutable({
    schemaVersion: "REMINDER_RECONCILIATION_RECEIPT_V1",
    commandId: effect.command.commandId,
    fingerprint: effect.fingerprint,
    disposition,
    platformSnapshot: snapshot,
    platformSnapshotFingerprint: fingerprint(snapshot),
    pendingFingerprint: fingerprint(snapshot.pending),
    targetConverged: isDeepStrictEqual(snapshot.pending, effect.targetPending) &&
      snapshot.appliedDesiredStateGeneration === effect.command.desiredStateGeneration &&
      snapshot.appliedDesiredStateFingerprint === effect.command.desiredStateFingerprint &&
      snapshot.appliedRulesGeneration === effect.command.rulesGeneration &&
      snapshot.appliedRulesFingerprint === effect.command.rulesFingerprint,
    priorDeliveredPreserved,
  });
}

function createInMemoryReminderPlatform({ platformSnapshot = { schemaVersion: "REMINDER_PLATFORM_SNAPSHOT_V1", scope: "NUTTIE_REMINDERS_ONLY", appliedDesiredStateGeneration: null, appliedDesiredStateFingerprint: null, appliedRulesGeneration: null, appliedRulesFingerprint: null, pending: [], delivered: [] }, failurePlan = [] } = {}) {
  let stored = normalizePlatformSnapshot(platformSnapshot);
  if (!Array.isArray(failurePlan) || failurePlan.some((point) => !Object.values(FAILURE_POINTS).includes(point))) fail("reminder platform failure plan is invalid", "INVALID_REMINDER_PLATFORM");
  const failures = [...failurePlan];
  let chain = Promise.resolve();
  let calls = 0;

  async function apply(effectInput) {
    const effect = normalizeEffect(effectInput);
    calls += 1;
    if (stored.appliedDesiredStateGeneration !== null && effect.command.desiredStateGeneration < stored.appliedDesiredStateGeneration) {
      return immutable({ status: "FAILURE", commitState: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "STALE_REMINDER_RECONCILIATION" } });
    }
    if (stored.appliedDesiredStateGeneration === effect.command.desiredStateGeneration && stored.appliedDesiredStateFingerprint !== effect.command.desiredStateFingerprint) {
      return immutable({ status: "FAILURE", commitState: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "REMINDER_DESIRED_STATE_GENERATION_CONFLICT" } });
    }
    const failure = failures.shift() ?? null;
    if (failure === FAILURE_POINTS.BEFORE_OPERATIONS) return immutable({ status: "FAILURE", commitState: "NOT_COMMITTED", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "REMINDER_PLATFORM_UNAVAILABLE" } });
    const wasConverged = isDeepStrictEqual(stored.pending, effect.targetPending) &&
      stored.appliedDesiredStateGeneration === effect.command.desiredStateGeneration &&
      stored.appliedDesiredStateFingerprint === effect.command.desiredStateFingerprint &&
      stored.appliedRulesGeneration === effect.command.rulesGeneration &&
      stored.appliedRulesFingerprint === effect.command.rulesFingerprint;
    const liveOperations = deriveOperations(stored.pending, effect.targetPending);
    for (let index = 0; index < liveOperations.length; index += 1) {
      stored = normalizePlatformSnapshot({ ...stored, pending: applyOperation(stored.pending, liveOperations[index]) });
      if (failure === FAILURE_POINTS.AFTER_FIRST_OPERATION && index === 0) return immutable({ status: "FAILURE", commitState: "UNKNOWN", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "REMINDER_PLATFORM_RESULT_UNKNOWN" } });
    }
    stored = normalizePlatformSnapshot({
      ...stored,
      appliedDesiredStateGeneration: effect.command.desiredStateGeneration,
      appliedDesiredStateFingerprint: effect.command.desiredStateFingerprint,
      appliedRulesGeneration: effect.command.rulesGeneration,
      appliedRulesFingerprint: effect.command.rulesFingerprint,
    });
    if (failure === FAILURE_POINTS.AFTER_ALL_OPERATIONS || (failure === FAILURE_POINTS.AFTER_FIRST_OPERATION && liveOperations.length === 0)) {
      return immutable({ status: "FAILURE", commitState: "UNKNOWN", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, error: { code: "REMINDER_PLATFORM_RESULT_UNKNOWN" } });
    }
    const receipt = createReceipt(effect, wasConverged ? "ALREADY_CONVERGED" : "COMMITTED", stored);
    return immutable({ status: "SUCCESS", commandId: effect.command.commandId, fingerprint: effect.fingerprint, attempt: effect.attempt, receipt });
  }

  return Object.freeze({
    execute(effect) {
      const run = chain.then(() => apply(effect));
      chain = run.catch(() => undefined);
      return run;
    },
    snapshot() { return immutable({ platformSnapshot: stored, calls }); },
  });
}

function validateReminderReconciliationReceipt({ effect: effectInput, outcome }) {
  const effect = normalizeEffect(effectInput);
  assertExactKeys(outcome, ["status", "commandId", "fingerprint", "attempt", "receipt"], [], "outcome", "INVALID_REMINDER_RECONCILIATION_OUTCOME");
  if (outcome.status !== "SUCCESS" || outcome.commandId !== effect.command.commandId || outcome.fingerprint !== effect.fingerprint || outcome.attempt !== effect.attempt) fail("reminder outcome is not bound to the effect", "INVALID_REMINDER_RECONCILIATION_OUTCOME");
  const snapshot = normalizePlatformSnapshot(outcome.receipt?.platformSnapshot, "outcome.receipt.platformSnapshot");
  const expected = createReceipt(effect, outcome.receipt?.disposition, snapshot);
  if (!isDeepStrictEqual(outcome.receipt, expected) || !["COMMITTED", "ALREADY_CONVERGED"].includes(outcome.receipt?.disposition) || !expected.targetConverged || !expected.priorDeliveredPreserved) {
    fail("reminder reconciliation receipt does not prove target convergence", "INVALID_REMINDER_RECONCILIATION_OUTCOME");
  }
  return expected;
}

export {
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
};
