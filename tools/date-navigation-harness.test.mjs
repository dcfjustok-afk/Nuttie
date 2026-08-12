import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DISPOSITIONS,
  RELATIONS,
  applyDateNavigationDecision,
  createDateNavigationPolicyDecision,
  createDateNavigationRequest,
  createDateNavigationState,
  fingerprintDateObservation,
  normalizeDateObservation,
  refreshDateObservation,
  shiftLocalDate,
} from "./date-navigation-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./date-navigation-harness.mjs", import.meta.url));

function observation({
  generation = 1,
  observedAt = "2026-08-12T21:40:00+08:00",
  timeZoneId = "Asia/Shanghai",
  timeZoneRulesVersion = "tzdb-2026a",
  todayLocalDate = "2026-08-12",
} = {}) {
  return {
    schemaVersion: "DATE_OBSERVATION_V1",
    generation,
    observedAt,
    timeZoneId,
    timeZoneRulesVersion,
    calendarId: "gregory",
    todayLocalDate,
  };
}

function requestFor(state, targetLocalDate, requestId = "nav-1") {
  return createDateNavigationRequest({ requestId, state, targetLocalDate });
}

function decisionFor(request, disposition, reasonCode = "CALLER_POLICY_RESULT") {
  return createDateNavigationPolicyDecision({
    request,
    policyId: "owner-approved-policy",
    policyVersion: "policy-v1",
    disposition,
    reasonCode,
  });
}

test("normalizes an explicit date observation and fingerprints all context", () => {
  const normalized = normalizeDateObservation(observation());
  assert.deepEqual(normalized, observation());
  assert.match(fingerprintDateObservation(normalized), /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: normalized })), true);
});

test("rejects mismatched wall time, offset, local date, calendar, and unsupported zones", () => {
  assert.throws(() => normalizeDateObservation(observation({ observedAt: "2026-08-12T13:40:00Z" })), { code: "DATE_OBSERVATION_ZONE_MISMATCH" });
  assert.throws(() => normalizeDateObservation(observation({ observedAt: "2026-08-12T21:40:00+09:00" })), { code: "DATE_OBSERVATION_ZONE_MISMATCH" });
  assert.throws(() => normalizeDateObservation(observation({ todayLocalDate: "2026-08-11" })), { code: "DATE_OBSERVATION_DATE_MISMATCH" });
  assert.throws(() => normalizeDateObservation({ ...observation(), calendarId: "buddhist" }), { code: "INVALID_DATE_OBSERVATION" });
  assert.throws(() => normalizeDateObservation(observation({ timeZoneId: "Mars/Olympus" })), { code: "INVALID_DATE_OBSERVATION" });
  assert.throws(() => normalizeDateObservation(observation({ observedAt: "2026-02-30T21:40:00+08:00" })), { code: "INVALID_LOCAL_DATE" });
});

test("accepts both sides of DST gaps and overlaps only with matching explicit offsets", () => {
  const beforeGap = normalizeDateObservation(observation({
    observedAt: "2026-03-08T01:59:59-08:00",
    timeZoneId: "America/Los_Angeles",
    todayLocalDate: "2026-03-08",
  }));
  const afterGap = normalizeDateObservation(observation({
    generation: 2,
    observedAt: "2026-03-08T03:00:00-07:00",
    timeZoneId: "America/Los_Angeles",
    todayLocalDate: "2026-03-08",
  }));
  const firstOverlap = normalizeDateObservation(observation({
    generation: 3,
    observedAt: "2026-11-01T01:30:00-07:00",
    timeZoneId: "America/Los_Angeles",
    todayLocalDate: "2026-11-01",
  }));
  const secondOverlap = normalizeDateObservation(observation({
    generation: 4,
    observedAt: "2026-11-01T01:30:00-08:00",
    timeZoneId: "America/Los_Angeles",
    todayLocalDate: "2026-11-01",
  }));
  assert.equal(beforeGap.todayLocalDate, afterGap.todayLocalDate);
  assert.notEqual(firstOverlap.observedAt, secondOverlap.observedAt);
  assert.throws(() => normalizeDateObservation(observation({
    observedAt: "2026-03-08T02:30:00-08:00",
    timeZoneId: "America/Los_Angeles",
    todayLocalDate: "2026-03-08",
  })), { code: "DATE_OBSERVATION_ZONE_MISMATCH" });
});

test("classifies selected dates as past, today, or future without deciding whether navigation is allowed", () => {
  assert.equal(createDateNavigationState({ selectedLocalDate: "2026-08-11", observation: observation() }).selectedRelation, RELATIONS.PAST);
  assert.equal(createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() }).selectedRelation, RELATIONS.TODAY);
  assert.equal(createDateNavigationState({ selectedLocalDate: "2026-08-13", observation: observation() }).selectedRelation, RELATIONS.FUTURE);
});

test("shifts explicit Gregorian date keys across month, year, and leap boundaries", () => {
  assert.equal(shiftLocalDate("2024-02-28", 1), "2024-02-29");
  assert.equal(shiftLocalDate("2024-02-29", 1), "2024-03-01");
  assert.equal(shiftLocalDate("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftLocalDate("2026-03-08", 1), "2026-03-09");
  assert.throws(() => shiftLocalDate("2026-02-29", 1), { code: "INVALID_LOCAL_DATE" });
  assert.throws(() => shiftLocalDate("2026-08-12", 0.5), { code: "INVALID_DATE_DELTA" });
});

test("does not read the system clock when deriving state, requests, decisions, or refreshes", () => {
  const originalNow = Date.now;
  Date.now = () => { throw new Error("system clock must not be read"); };
  try {
    const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
    const request = requestFor(state, "2026-08-11");
    const decision = decisionFor(request, DISPOSITIONS.ALLOW);
    assert.equal(applyDateNavigationDecision(state, request, decision).afterState.selectedLocalDate, "2026-08-11");
    assert.equal(refreshDateObservation(state, observation({ generation: 2, observedAt: "2026-08-13T00:00:00+08:00", todayLocalDate: "2026-08-13" })).afterState.selectedRelation, RELATIONS.PAST);
  } finally {
    Date.now = originalNow;
  }
});

test("refreshes midnight observation while preserving the user's selected date", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const result = refreshDateObservation(state, observation({
    generation: 2,
    observedAt: "2026-08-13T00:00:00+08:00",
    todayLocalDate: "2026-08-13",
  }));
  assert.equal(result.disposition, "REFRESHED");
  assert.equal(result.selectionPreserved, true);
  assert.equal(result.afterState.selectedLocalDate, "2026-08-12");
  assert.equal(result.afterState.selectedRelation, RELATIONS.PAST);
});

test("refreshes a changed time-zone context without silently rebasing the selected date", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const result = refreshDateObservation(state, observation({
    generation: 2,
    observedAt: "2026-08-11T13:40:00-07:00",
    timeZoneId: "America/Los_Angeles",
    todayLocalDate: "2026-08-11",
  }));
  assert.equal(result.afterState.selectedLocalDate, "2026-08-12");
  assert.equal(result.afterState.selectedRelation, RELATIONS.FUTURE);
  assert.equal(result.afterState.observation.timeZoneId, "America/Los_Angeles");
});

test("accepts an identical same-generation observation as an unchanged replay", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const result = refreshDateObservation(state, structuredClone(observation()));
  assert.equal(result.disposition, "UNCHANGED");
  assert.deepEqual(result.afterState, state);
  assert.equal(result.observationContextChanged, false);
});

test("rejects stale observations and same-generation conflicts", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation({ generation: 3 }) });
  assert.throws(() => refreshDateObservation(state, observation({ generation: 2 })), { code: "STALE_DATE_OBSERVATION" });
  assert.throws(() => refreshDateObservation(state, observation({ generation: 3, timeZoneRulesVersion: "tzdb-2026b" })), { code: "DATE_OBSERVATION_GENERATION_CONFLICT" });
});

test("binds every navigation request to the exact selection and observation fingerprint", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const request = requestFor(state, "2026-08-11");
  assert.equal(request.fromLocalDate, "2026-08-12");
  assert.equal(request.targetLocalDate, "2026-08-11");
  assert.equal(request.observationGeneration, 1);
  assert.equal(request.observationFingerprint, state.observationFingerprint);
  assert.match(request.requestFingerprint, /^[a-f0-9]{64}$/);
});

test("applies an externally authorized past-date navigation with policy evidence", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const request = requestFor(state, "2026-08-11");
  const result = applyDateNavigationDecision(state, request, decisionFor(request, DISPOSITIONS.ALLOW, "HISTORY_ALLOWED"));
  assert.equal(result.disposition, "APPLIED");
  assert.equal(result.afterState.selectedLocalDate, "2026-08-11");
  assert.equal(result.afterState.selectedRelation, RELATIONS.PAST);
  assert.equal(result.policy.reasonCode, "HISTORY_ALLOWED");
  assert.equal(result.observationChanged, false);
});

test("does not contain a built-in future-date policy: an external ALLOW can apply it", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const request = requestFor(state, "2026-08-13");
  const result = applyDateNavigationDecision(state, request, decisionFor(request, DISPOSITIONS.ALLOW, "EXTERNAL_FUTURE_POLICY"));
  assert.equal(result.disposition, "APPLIED");
  assert.equal(result.afterState.selectedRelation, RELATIONS.FUTURE);
});

test("preserves state when an external policy denies navigation", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const request = requestFor(state, "2026-08-13");
  const result = applyDateNavigationDecision(state, request, decisionFor(request, DISPOSITIONS.DENY, "OWNER_RULE_NOT_APPROVED"));
  assert.equal(result.disposition, "REJECTED_BY_POLICY");
  assert.equal(result.selectedDateChanged, false);
  assert.deepEqual(result.afterState, state);
  assert.equal(result.policy.reasonCode, "OWNER_RULE_NOT_APPROVED");
});

test("rejects a decision bound to another request", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const request = requestFor(state, "2026-08-11", "nav-one");
  const otherRequest = requestFor(state, "2026-08-13", "nav-two");
  assert.throws(() => applyDateNavigationDecision(state, request, decisionFor(otherRequest, DISPOSITIONS.ALLOW)), { code: "DATE_NAVIGATION_DECISION_MISMATCH" });
});

test("rejects an old navigation request after the date observation advances", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const request = requestFor(state, "2026-08-11");
  const refreshed = refreshDateObservation(state, observation({
    generation: 2,
    observedAt: "2026-08-13T00:00:00+08:00",
    todayLocalDate: "2026-08-13",
  })).afterState;
  assert.throws(() => applyDateNavigationDecision(refreshed, request, decisionFor(request, DISPOSITIONS.ALLOW)), { code: "STALE_DATE_NAVIGATION_REQUEST" });
});

test("rejects an old navigation request after another navigation changes selection", () => {
  const initial = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const oldRequest = requestFor(initial, "2026-08-10", "old-nav");
  const firstRequest = requestFor(initial, "2026-08-11", "first-nav");
  const changed = applyDateNavigationDecision(initial, firstRequest, decisionFor(firstRequest, DISPOSITIONS.ALLOW)).afterState;
  assert.throws(() => applyDateNavigationDecision(changed, oldRequest, decisionFor(oldRequest, DISPOSITIONS.ALLOW)), { code: "STALE_DATE_NAVIGATION_REQUEST" });
});

test("rejects tampered state, request, and unsupported decision fields", () => {
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const request = requestFor(state, "2026-08-11");
  const forgedState = structuredClone(state);
  forgedState.selectedRelation = RELATIONS.FUTURE;
  assert.throws(() => createDateNavigationRequest({ requestId: "nav-forged", state: forgedState, targetLocalDate: "2026-08-11" }), { code: "INVALID_DATE_NAVIGATION_STATE" });
  const forgedRequest = structuredClone(request);
  forgedRequest.targetLocalDate = "2026-08-10";
  assert.throws(() => createDateNavigationPolicyDecision({ request: forgedRequest, policyId: "p", policyVersion: "v1", disposition: DISPOSITIONS.ALLOW, reasonCode: "ALLOW" }), { code: "INVALID_DATE_NAVIGATION_REQUEST" });
  const decision = decisionFor(request, DISPOSITIONS.ALLOW);
  assert.throws(() => applyDateNavigationDecision(state, request, { ...decision, UIdefault: "today" }), { code: "INVALID_DATE_NAVIGATION_DECISION" });
});

test("freezes returned evidence and does not perform network, native, or storage work", () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  const forbidden = [
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /https?:\/\//,
    /UserNotifications/,
    /HealthKit/,
    /AsyncStorage/,
    /SQLite|SQLCipher/,
    /["']react-native(?:\/[^"']*)?["']/,
    /["']expo(?:\/[^"']*)?["']/,
  ];
  for (const pattern of forbidden) assert.doesNotMatch(source, pattern);
  const state = createDateNavigationState({ selectedLocalDate: "2026-08-12", observation: observation() });
  const request = requestFor(state, "2026-08-11");
  const result = applyDateNavigationDecision(state, request, decisionFor(request, DISPOSITIONS.ALLOW));
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.afterState.observation), true);
  assert.throws(() => { result.afterState.selectedLocalDate = "2026-01-01"; }, TypeError);
});
