import assert from "node:assert/strict";
import test from "node:test";
import { parseAiResponse, validateResponseCandidate } from "./ai-response-contract-harness.mjs";

const valid = JSON.stringify({ schemaVersion: 1, candidates: [{ label: "燕麦粥", nutrients: { energyKcal: 250, proteinG: 8, carbohydrateG: 40, fatG: 6, fiberG: 5, sugarG: null, sodiumMg: 120 }, confidence: 0.82 }] });

test("accepts a bounded versioned response without persistence", () => {
  const result = validateResponseCandidate({ responseText: valid, state: { records: [{ id: "r1" }] } });
  assert.equal(result.status, "CANDIDATE"); assert.equal(result.persisted, false); assert.deepEqual(result.state, { records: [{ id: "r1" }] }); assert.equal(result.response.candidates[0].nutrients.sugarG, null);
});

test("rejects malformed JSON, unknown fields, unsupported schema, and invalid nutrient values", () => {
  for (const [responseText, code] of [["{", "RESPONSE_INVALID_JSON"], [JSON.stringify({ schemaVersion: 1, candidates: [], extra: true }), "RESPONSE_UNKNOWN_FIELD"], [JSON.stringify({ schemaVersion: 1, candidates: [{ label: "x", nutrients: { calciumMg: 20 } }] }), "CANDIDATE_NUTRIENTS_UNKNOWN_FIELD"], [JSON.stringify({ schemaVersion: 2, candidates: [] }), "RESPONSE_SCHEMA_INVALID"], [JSON.stringify({ schemaVersion: 1, candidates: [{ label: "x", nutrients: { energyKcal: -1 } }] }), "CANDIDATE_NUTRIENT_INVALID"]]) {
    const result = validateResponseCandidate({ responseText, state: { records: [{ id: "r1" }] } });
    assert.equal(result.status, "BLOCKED"); assert.equal(result.error.code, code); assert.equal(result.persisted, false); assert.deepEqual(result.state, { records: [{ id: "r1" }] });
  }
});

test("rejects depth, string, item and byte budget violations", () => {
  const deep = { schemaVersion: 1, candidates: [] }; let current = deep; for (let i = 0; i < 8; i += 1) { current.child = {}; current = current.child; }
  assert.throws(() => parseAiResponse(JSON.stringify(deep)), { code: "RESPONSE_DEPTH_LIMIT" });
  assert.throws(() => parseAiResponse(JSON.stringify({ schemaVersion: 1, candidates: [{ label: "x".repeat(600), nutrients: {} }] })), { code: "RESPONSE_STRING_LIMIT" });
  assert.throws(() => parseAiResponse(JSON.stringify({ schemaVersion: 1, candidates: Array.from({ length: 33 }, () => ({ label: "x", nutrients: {} })) })), { code: "RESPONSE_ITEM_LIMIT" });
  assert.throws(() => parseAiResponse(JSON.stringify({ schemaVersion: 1, candidates: [{ label: "x", nutrients: {}, note: "x".repeat(20000) }] })), { code: "RESPONSE_BYTE_LIMIT" });
});

test("does not mutate caller state while validating a response", () => { const state = { records: [{ id: "r1", value: 1 }] }; const before = structuredClone(state); validateResponseCandidate({ responseText: "not-json", state }); assert.deepEqual(state, before); });
