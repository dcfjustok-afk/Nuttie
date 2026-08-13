import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  BOUNDARY,
  NUTRIENT_FIELDS,
  RESPONSE_LIMITS,
  STATE_LIMITS,
  parseAiResponse,
  validateResponseCandidate,
} from "./ai-response-contract-harness.mjs";

function response(overrides = {}) {
  return JSON.stringify({
    schemaVersion: 1,
    candidates: [{
      label: "燕麦粥",
      nutrients: {
        energyKcal: 250,
        proteinG: 8,
        carbohydrateG: 40,
        fatG: 6,
        fiberG: 5,
        sugarG: null,
        sodiumMg: 120,
      },
      confidence: 0.82,
    }],
    ...overrides,
  });
}

test("accepts one exact bounded response and returns an immutable canonical candidate set", () => {
  const parsed = parseAiResponse(response());
  assert.equal(parsed.schemaVersion, 1);
  assert.deepEqual(Object.keys(parsed.candidates[0].nutrients), NUTRIENT_FIELDS);
  assert.equal(parsed.candidates[0].nutrients.sugarG, null);
  assert.match(parsed.responseFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.candidates), true);
  assert.equal(Object.isFrozen(parsed.candidates[0].nutrients), true);
});

test("canonical fingerprint is semantic and independent of JSON whitespace or object-key order", () => {
  const left = parseAiResponse(response());
  const right = parseAiResponse('{ "candidates" : [{"confidence":0.82,"nutrients":{"sodiumMg":120,"sugarG":null,"fiberG":5,"fatG":6,"carbohydrateG":40,"proteinG":8,"energyKcal":250},"label":"燕麦粥"}], "schemaVersion":1 }');
  assert.equal(left.responseFingerprint, right.responseFingerprint);
  assert.deepEqual(left, right);
});

test("rejects decoded duplicate JSON keys at every object level", () => {
  for (const text of [
    '{"schemaVersion":1,"schemaVersion":1,"candidates":[]}',
    '{"schemaVersion":1,"candidates":[{"label":"x","\\u006cabel":"y","nutrients":{}}]}',
    '{"schemaVersion":1,"candidates":[{"label":"x","nutrients":{"energyKcal":1,"energyKcal":2}}]}',
  ]) assert.throws(() => parseAiResponse(text), { code: "RESPONSE_DUPLICATE_JSON_KEY" });
});

test("rejects malformed, trailing, non-object, unknown, and unsupported response envelopes", () => {
  for (const [text, code] of [
    ["{", "RESPONSE_INVALID_JSON"],
    ['{"schemaVersion":1,"candidates":[]} trailing', "RESPONSE_INVALID_JSON"],
    ["[]", "RESPONSE_ROOT_INVALID"],
    [JSON.stringify({ schemaVersion: 1, candidates: [{}], extra: true }), "RESPONSE_UNKNOWN_FIELD"],
    [JSON.stringify({ schemaVersion: 2, candidates: [{}] }), "RESPONSE_SCHEMA_INVALID"],
    [JSON.stringify({ schemaVersion: 1, candidates: {} }), "RESPONSE_SCHEMA_INVALID"],
  ]) assert.throws(() => parseAiResponse(text), { code });
});

test("requires a non-empty bounded candidate set", () => {
  assert.throws(() => parseAiResponse(response({ candidates: [] })), { code: "RESPONSE_CANDIDATE_COUNT_INVALID" });
  assert.throws(
    () => parseAiResponse(response({ candidates: Array.from({ length: RESPONSE_LIMITS.maxItems + 1 }, () => ({ label: "x", nutrients: {} })) })),
    { code: "RESPONSE_ITEM_LIMIT" },
  );
});

test("requires exact candidate fields and an exact plain nutrient record", () => {
  for (const [candidate, code] of [
    [{ nutrients: {} }, "CANDIDATE_INVALID"],
    [{ label: "x" }, "CANDIDATE_INVALID"],
    [{ label: "x", nutrients: {}, note: "secret" }, "CANDIDATE_INVALID"],
    [{ label: "x", nutrients: [] }, "CANDIDATE_NUTRIENTS_INVALID"],
    [{ label: "x", nutrients: { calciumMg: 20 } }, "CANDIDATE_NUTRIENTS_UNKNOWN_FIELD"],
  ]) assert.throws(() => parseAiResponse(response({ candidates: [candidate] })), { code });
});

test("rejects empty, padded, non-NFC, control, bidi-control, and oversized labels", () => {
  for (const label of ["", " x", "x ", "e\u0301", "x\n", "safe\u202eevil", "中".repeat(RESPONSE_LIMITS.maxLabelBytes)]) {
    assert.throws(() => parseAiResponse(response({ candidates: [{ label, nutrients: {} }] })), { code: "CANDIDATE_LABEL_INVALID" });
  }
});

test("normalizes missing nutrients to null without inventing values", () => {
  const parsed = parseAiResponse(response({ candidates: [{ label: "未完整识别", nutrients: {} }] }));
  assert.deepEqual(parsed.candidates[0].nutrients, Object.fromEntries(NUTRIENT_FIELDS.map((field) => [field, null])));
  assert.equal(parsed.candidates[0].confidence, null);
});

test("rejects unsafe nutrient numbers without imposing a product nutrition-validity rule", () => {
  for (const value of [-1, RESPONSE_LIMITS.maxNutrientValue + 1]) {
    assert.throws(
      () => parseAiResponse(response({ candidates: [{ label: "x", nutrients: { energyKcal: value } }] })),
      { code: "CANDIDATE_NUTRIENT_INVALID" },
    );
  }
  assert.throws(
    () => parseAiResponse('{"schemaVersion":1,"candidates":[{"label":"x","nutrients":{"energyKcal":-0}}]}'),
    { code: "CANDIDATE_NUTRIENT_INVALID" },
  );
  assert.throws(
    () => parseAiResponse('{"schemaVersion":1,"candidates":[{"label":"x","nutrients":{"energyKcal":1e309}}]}'),
    { code: "RESPONSE_NUMBER_INVALID" },
  );
  assert.equal(parseAiResponse(response({ candidates: [{ label: "x", nutrients: { energyKcal: 0.125 } }] })).candidates[0].nutrients.energyKcal, 0.125);
});

test("requires confidence to be finite, non-negative, and within one", () => {
  for (const confidence of [-1, 1.01, null]) {
    assert.throws(() => parseAiResponse(response({ candidates: [{ label: "x", nutrients: {}, confidence }] })), { code: "CANDIDATE_CONFIDENCE_INVALID" });
  }
  assert.throws(
    () => parseAiResponse('{"schemaVersion":1,"candidates":[{"label":"x","nutrients":{},"confidence":-0}]}'),
    { code: "CANDIDATE_CONFIDENCE_INVALID" },
  );
  assert.equal(parseAiResponse(response({ candidates: [{ label: "x", nutrients: {}, confidence: 0 }] })).candidates[0].confidence, 0);
  assert.equal(parseAiResponse(response({ candidates: [{ label: "x", nutrients: {}, confidence: 1 }] })).candidates[0].confidence, 1);
});

test("rejects depth, string, aggregate-key, item, and byte budget violations before use", () => {
  const deep = '{"schemaVersion":1,"candidates":[{"label":"x","nutrients":{"energyKcal":{"a":{"b":{"c":1}}}}}]}';
  assert.throws(() => parseAiResponse(deep), { code: "RESPONSE_DEPTH_LIMIT" });
  assert.throws(() => parseAiResponse(response({ candidates: [{ label: "x".repeat(RESPONSE_LIMITS.maxStringLength + 1), nutrients: {} }] })), { code: "RESPONSE_STRING_LIMIT" });
  const manyKeys = Object.fromEntries(Array.from({ length: RESPONSE_LIMITS.maxObjectKeys }, (_, index) => [`k${index}`, index]));
  assert.throws(() => parseAiResponse(JSON.stringify({ schemaVersion: 1, candidates: [{ label: "x", nutrients: manyKeys }] })), { code: "RESPONSE_ITEM_LIMIT" });
  assert.throws(() => parseAiResponse(response({ candidates: Array.from({ length: RESPONSE_LIMITS.maxItems + 1 }, () => ({ label: "x", nutrients: {} })) })), { code: "RESPONSE_ITEM_LIMIT" });
  assert.throws(() => parseAiResponse(`${response()}${" ".repeat(RESPONSE_LIMITS.maxBytes)}`), { code: "RESPONSE_BYTE_LIMIT" });
});

test("rejects non-text response bodies", () => {
  for (const value of [null, undefined, Buffer.from("{}"), {}, []]) assert.throws(() => parseAiResponse(value), { code: "RESPONSE_NOT_TEXT" });
});

test("validation preserves a detached immutable state snapshot and creates no persistence", () => {
  const state = { records: [{ id: "r1", value: 1 }] };
  const result = validateResponseCandidate({ responseText: response(), state });
  state.records[0].value = 2;
  assert.equal(result.status, "CANDIDATE");
  assert.equal(result.persisted, false);
  assert.deepEqual(result.state, { records: [{ id: "r1", value: 1 }] });
  assert.equal(Object.isFrozen(result.state.records[0]), true);
  assert.equal(result.boundary, BOUNDARY);
});

test("validation blocks parser failures without reflecting response content or changing state", () => {
  const secret = "do-not-reflect-this-response";
  const state = { records: [{ id: "r1" }] };
  const before = structuredClone(state);
  const result = validateResponseCandidate({ responseText: `{${secret}`, state });
  assert.deepEqual(state, before);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.response, null);
  assert.deepEqual(result.error, { code: "RESPONSE_INVALID_JSON" });
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(result.persisted, false);
  assert.equal(Object.isFrozen(result.error), true);
});

test("validation request and caller state reject extra fields, accessors, special objects, cycles, and budgets", () => {
  assert.throws(() => validateResponseCandidate({ responseText: response(), state: {}, allow: true }), { code: "INVALID_RESPONSE_VALIDATION_REQUEST" });
  let reads = 0;
  const accessorState = {};
  Object.defineProperty(accessorState, "records", { enumerable: true, get() { reads += 1; return []; } });
  assert.throws(() => validateResponseCandidate({ responseText: response(), state: accessorState }), { code: "INVALID_RESPONSE_STATE" });
  assert.equal(reads, 0);
  assert.throws(() => validateResponseCandidate({ responseText: response(), state: { date: new Date(0) } }), { code: "INVALID_RESPONSE_STATE" });
  const cyclic = {}; cyclic.self = cyclic;
  assert.throws(() => validateResponseCandidate({ responseText: response(), state: cyclic }), { code: "INVALID_RESPONSE_STATE" });
  assert.throws(
    () => validateResponseCandidate({ responseText: response(), state: { values: Array.from({ length: STATE_LIMITS.maxItems + 1 }, () => 0) } }),
    { code: "RESPONSE_STATE_RESOURCE_LIMIT" },
  );
});

test("contract boundary and source authorize no key, body, network, write, clock, native, or formal effect", () => {
  assert.deepEqual(BOUNDARY, {
    contractStatus: "SPIKE_FRAMEWORK_AGNOSTIC_NON_PRODUCTION",
    responseTruth: "UNTRUSTED_PROVIDER_OUTPUT",
    schemaAuthority: "TEST_CONTRACT_NOT_FORMAL_PROVIDER_API",
    candidateAuthority: "UNCONFIRMED_EDITABLE_REFERENCE_ONLY",
    persistenceAuthorized: false,
    policyAuthorizationGranted: false,
    keychainReads: 0,
    sensitiveBodySerializations: 0,
    realNetworkRequests: 0,
    filesystemWrites: 0,
    businessWrites: 0,
    systemClockRead: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
  });
  const source = fs.readFileSync(new URL("./ai-response-contract-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    /\bfetch\s*\(/u,
    /\bKeychain(?:\.|\s)/u,
    /\bAuthorization\s*:/u,
    /\b(?:writeFile|appendFile|unlink)\s*\(/u,
    /\bnew\s+Date\s*\(/u,
    /\bDate\.now\s*\(/u,
  ]) assert.equal(forbidden.test(source), false);
});
