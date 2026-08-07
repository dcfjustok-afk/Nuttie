const RESPONSE_LIMITS = Object.freeze({ maxBytes: 16 * 1024, maxDepth: 6, maxItems: 32, maxStringLength: 512 });
const NUTRIENT_FIELDS = Object.freeze(["energyKcal", "proteinG", "carbohydrateG", "fatG", "fiberG", "sugarG", "sodiumMg"]);

function reject(message, code, details = {}) { const error = new Error(message); Object.assign(error, { code }, details); throw error; }

function assertBudget(value, depth = 0, seen = new Set()) {
  if (depth > RESPONSE_LIMITS.maxDepth) reject("response exceeds JSON depth budget", "RESPONSE_DEPTH_LIMIT");
  if (typeof value === "string") { if (value.length > RESPONSE_LIMITS.maxStringLength) reject("response string exceeds budget", "RESPONSE_STRING_LIMIT"); return; }
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) reject("response contains a cycle", "RESPONSE_CYCLE");
  seen.add(value);
  const items = Array.isArray(value) ? value : Object.entries(value);
  if (items.length > RESPONSE_LIMITS.maxItems) reject("response item count exceeds budget", "RESPONSE_ITEM_LIMIT");
  for (const item of items) assertBudget(Array.isArray(value) ? item : item[1], depth + 1, seen);
  seen.delete(value);
}

function parseAiResponse(input) {
  if (typeof input !== "string") reject("response must be UTF-8 JSON text", "RESPONSE_NOT_TEXT");
  if (Buffer.byteLength(input, "utf8") > RESPONSE_LIMITS.maxBytes) reject("response exceeds byte budget", "RESPONSE_BYTE_LIMIT");
  let value;
  try { value = JSON.parse(input); } catch (error) { reject("response is malformed JSON", "RESPONSE_INVALID_JSON", { cause: error }); }
  assertBudget(value);
  if (!value || typeof value !== "object" || Array.isArray(value)) reject("response root must be an object", "RESPONSE_ROOT_INVALID");
  for (const key of Object.keys(value)) if (!["schemaVersion", "candidates"].includes(key)) reject("response has an unknown root field", "RESPONSE_UNKNOWN_FIELD", { key });
  if (value.schemaVersion !== 1 || !Array.isArray(value.candidates)) reject("response schema is unsupported", "RESPONSE_SCHEMA_INVALID");
  if (value.candidates.length > RESPONSE_LIMITS.maxItems) reject("candidate count exceeds budget", "RESPONSE_ITEM_LIMIT");
  const candidates = value.candidates.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) reject("candidate must be an object", "CANDIDATE_INVALID", { index });
    for (const key of Object.keys(candidate)) if (!["label", "nutrients", "confidence"].includes(key)) reject("candidate has an unknown field", "CANDIDATE_UNKNOWN_FIELD", { index, key });
    if (typeof candidate.label !== "string" || candidate.label.trim().length === 0) reject("candidate label is required", "CANDIDATE_LABEL_INVALID", { index });
    if (!candidate.nutrients || typeof candidate.nutrients !== "object" || Array.isArray(candidate.nutrients)) reject("candidate nutrients are invalid", "CANDIDATE_NUTRIENTS_INVALID", { index });
    const nutrients = {};
    for (const field of NUTRIENT_FIELDS) {
      const nutrient = candidate.nutrients[field];
      if (nutrient !== undefined && nutrient !== null && (typeof nutrient !== "number" || !Number.isFinite(nutrient) || nutrient < 0)) reject("candidate nutrient must be finite and non-negative", "CANDIDATE_NUTRIENT_INVALID", { index, field });
      nutrients[field] = nutrient ?? null;
    }
    if (candidate.confidence !== undefined && (typeof candidate.confidence !== "number" || !Number.isFinite(candidate.confidence) || candidate.confidence < 0 || candidate.confidence > 1)) reject("candidate confidence is invalid", "CANDIDATE_CONFIDENCE_INVALID", { index });
    return Object.freeze({ label: candidate.label, nutrients: Object.freeze(nutrients), confidence: candidate.confidence ?? null });
  });
  return Object.freeze({ schemaVersion: 1, candidates: Object.freeze(candidates) });
}

function validateResponseCandidate({ responseText, state = { records: [] } }) {
  const before = structuredClone(state);
  try { return Object.freeze({ status: "CANDIDATE", response: parseAiResponse(responseText), state: before, persisted: false, error: null }); }
  catch (error) { return Object.freeze({ status: "BLOCKED", response: null, state: before, persisted: false, error: { code: error.code ?? "RESPONSE_INVALID", message: error.message } }); }
}

export { NUTRIENT_FIELDS, RESPONSE_LIMITS, parseAiResponse, validateResponseCandidate };
