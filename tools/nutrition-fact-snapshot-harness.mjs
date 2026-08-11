import { isDeepStrictEqual } from "node:util";

import { NUTRIENT_FIELDS } from "./domain-contract-harness.mjs";

const NUTRIENT_UNITS = Object.freeze({
  energyKcal: "kcal",
  proteinG: "g",
  carbohydrateG: "g",
  fatG: "g",
  fiberG: "g",
  sugarG: "g",
  sodiumMg: "mg",
});

const PACK_SOURCE_KINDS = Object.freeze([
  "TW_FDA",
  "USDA_FOUNDATION",
  "USDA_SR_LEGACY",
]);

const PACK_NUTRIENT_STATUSES = Object.freeze([
  "SOURCE_REPORTED",
  "MEASURED",
  "ESTIMATED",
  "TRACE",
  "MISSING",
]);

const USER_NUTRIENT_STATUSES = Object.freeze([
  "USER_ENTERED",
  "USER_CONFIRMED",
  "USER_ENTERED_TRACE",
  "MISSING",
]);

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SAFE_SOURCE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,511}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const TRACE_TEXT = /^(?:tr(?:ace)?|trace amount|微量|痕量|<\s*\d+(?:[.,]\d+)?\s*(?:kcal|kj|g|mg))$/iu;
const BASIS_SEMANTICS = Object.freeze({
  g: "EDIBLE_PORTION",
  ml: "VOLUME",
  serving: "DECLARED_SERVING",
  package: "DECLARED_PACKAGE",
});

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(clone(value));
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be an object`, code, { field });
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${field} must be a plain object`, code, { field });
  }
  return value;
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !Object.hasOwn(value, key))
    || Object.keys(value).some((key) => !allowed.has(key))) {
    fail(`${field} has an unexpected shape`, code, { field });
  }
}

function assertSafeId(value, field, code) {
  if (typeof value !== "string" || !SAFE_ID.test(value)) {
    fail(`${field} is invalid`, code, { field });
  }
  return value;
}

function assertSourceId(value) {
  if (typeof value !== "string" || !SAFE_SOURCE_ID.test(value)) {
    fail("sourceId is invalid", "INVALID_NUTRITION_FACT_SNAPSHOT", { field: "sourceId" });
  }
  return value;
}

function assertHash(value, field) {
  if (typeof value !== "string" || !SHA256.test(value)) {
    fail(`${field} must be a lowercase SHA-256`, "INVALID_PROVENANCE", { field });
  }
  return value;
}

function assertRawText(value, field, { maxLength = 80 } = {}) {
  if (typeof value !== "string"
    || value.length === 0
    || value.length > maxLength
    || value.trim().length === 0
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    fail(`${field} is invalid`, "INVALID_SOURCE_TEXT", { field });
  }
  return value;
}

function normalizeUnitToken(value, field) {
  const raw = assertRawText(value, field, { maxLength: 16 });
  const token = raw.normalize("NFKC").trim().toLocaleLowerCase("en-US");
  if (!new Set(["kcal", "kj", "g", "mg"]).has(token)) {
    fail(`${field} is unsupported`, "UNSUPPORTED_NUTRIENT_UNIT", { field });
  }
  return token;
}

function unitFactor(field, originalUnit) {
  const token = normalizeUnitToken(originalUnit, `${field}.originalUnit`);
  if (field === "energyKcal") {
    if (token === "kcal") return 1;
    if (token === "kj") return 1 / 4.184;
  } else if (field === "sodiumMg") {
    if (token === "mg") return 1;
    if (token === "g") return 1000;
  } else {
    if (token === "g") return 1;
    if (token === "mg") return 0.001;
  }
  fail(`${field}.originalUnit has the wrong dimension`, "NUTRIENT_UNIT_DIMENSION_MISMATCH", {
    field: `${field}.originalUnit`,
  });
}

function assertNumber(value, field, { positive = false } = {}) {
  if (typeof value !== "number"
    || !Number.isFinite(value)
    || (positive ? value <= 0 : value < 0)) {
    fail(`${field} is invalid`, "INVALID_NUMBER", { field });
  }
  return value;
}

function normalizeBasis(input, field) {
  assertExactKeys(input, ["amount", "semantic", "unit"], [], field, "INVALID_NUTRITION_BASIS");
  const amount = assertNumber(input.amount, `${field}.amount`, { positive: true });
  if (!Object.hasOwn(BASIS_SEMANTICS, input.unit)
    || BASIS_SEMANTICS[input.unit] !== input.semantic) {
    fail(`${field} unit and semantic are inconsistent`, "INVALID_NUTRITION_BASIS", { field });
  }
  return { amount, unit: input.unit, semantic: input.semantic };
}

function sameBasis(left, right) {
  return left.amount === right.amount
    && left.unit === right.unit
    && left.semantic === right.semantic;
}

function normalizeProvenance(input, sourceKind) {
  assertExactKeys(
    input,
    [
      "activeRef",
      "contentSha256",
      "licenseId",
      "noticeSha256",
      "packId",
      "packVersion",
      "sourceRecordId",
      "transformVersion",
    ],
    [],
    "provenance",
    "INVALID_PROVENANCE",
  );
  const sourceRecordId = assertSafeId(input.sourceRecordId, "provenance.sourceRecordId", "INVALID_PROVENANCE");
  const transformVersion = assertSafeId(
    input.transformVersion,
    "provenance.transformVersion",
    "INVALID_PROVENANCE",
  );
  if (sourceKind === "USER") {
    for (const field of ["activeRef", "contentSha256", "licenseId", "noticeSha256", "packId", "packVersion"]) {
      if (input[field] !== null) {
        fail(`provenance.${field} must be null for user food`, "INVALID_USER_PROVENANCE", {
          field: `provenance.${field}`,
        });
      }
    }
    if (!transformVersion.startsWith("USER_")) {
      fail("user transformVersion must use the USER_ namespace", "INVALID_USER_PROVENANCE");
    }
    return {
      sourceRecordId,
      transformVersion,
      activeRef: null,
      contentSha256: null,
      licenseId: null,
      noticeSha256: null,
      packId: null,
      packVersion: null,
    };
  }
  return {
    sourceRecordId,
    transformVersion,
    activeRef: assertSafeId(input.activeRef, "provenance.activeRef", "INVALID_PROVENANCE"),
    contentSha256: assertHash(input.contentSha256, "provenance.contentSha256"),
    licenseId: assertSafeId(input.licenseId, "provenance.licenseId", "INVALID_PROVENANCE"),
    noticeSha256: assertHash(input.noticeSha256, "provenance.noticeSha256"),
    packId: assertSafeId(input.packId, "provenance.packId", "INVALID_PROVENANCE"),
    packVersion: assertSafeId(input.packVersion, "provenance.packVersion", "INVALID_PROVENANCE"),
  };
}

function allowedStatuses(sourceKind) {
  return sourceKind === "USER" ? USER_NUTRIENT_STATUSES : PACK_NUTRIENT_STATUSES;
}

function isTraceStatus(status) {
  return status === "TRACE" || status === "USER_ENTERED_TRACE";
}

function normalizeFact(input, field, sourceKind, transformVersion) {
  assertExactKeys(
    input,
    ["originalUnit", "originalValue", "status", "value"],
    ["originalText"],
    field,
    "INVALID_NUTRIENT_FACT",
  );
  if (!allowedStatuses(sourceKind).includes(input.status)) {
    fail(`${field}.status is not allowed for ${sourceKind}`, "INVALID_NUTRIENT_STATUS", { field });
  }
  const originalText = input.originalText === undefined
    ? null
    : assertRawText(input.originalText, `${field}.originalText`);
  if (input.status === "MISSING") {
    if (input.value !== null
      || input.originalValue !== null
      || input.originalUnit !== null
      || originalText !== null) {
      fail(`${field} missing state is inconsistent`, "INVALID_NUTRIENT_FACT", { field });
    }
  } else if (isTraceStatus(input.status)) {
    if (input.value !== null
      || input.originalValue !== null
      || typeof input.originalUnit !== "string"
      || originalText === null
      || !TRACE_TEXT.test(originalText.normalize("NFKC").trim())) {
      fail(`${field} trace state is inconsistent`, "INVALID_NUTRIENT_FACT", { field });
    }
    unitFactor(field.split(".").at(-1), input.originalUnit);
  } else {
    const nutrient = field.split(".").at(-1);
    const value = assertNumber(input.value, `${field}.value`);
    const originalValue = assertNumber(input.originalValue, `${field}.originalValue`);
    if (originalText !== null) {
      fail(`${field}.originalText is only valid for trace facts`, "INVALID_NUTRIENT_FACT", { field });
    }
    const expected = originalValue * unitFactor(nutrient, input.originalUnit);
    const tolerance = 1e-9 * Math.max(1, Math.abs(expected), Math.abs(value));
    if (Math.abs(value - expected) > tolerance) {
      fail(`${field} standard and original values disagree`, "NUTRIENT_CONVERSION_MISMATCH", { field });
    }
  }
  const nutrient = field.split(".").at(-1);
  return {
    value: input.value,
    standardUnit: NUTRIENT_UNITS[nutrient],
    status: input.status,
    originalValue: input.originalValue,
    originalUnit: input.originalUnit,
    originalText,
    transformVersion,
  };
}

function createNutritionFactSnapshot(input) {
  assertExactKeys(
    input,
    [
      "basis",
      "facts",
      "originalBasis",
      "provenance",
      "sourceId",
      "sourceKind",
      "sourceVersion",
    ],
    [],
    "nutritionSnapshot",
    "INVALID_NUTRITION_FACT_SNAPSHOT",
  );
  if (input.sourceKind !== "USER" && !PACK_SOURCE_KINDS.includes(input.sourceKind)) {
    fail("sourceKind is unsupported", "INVALID_SOURCE_KIND");
  }
  const sourceId = assertSourceId(input.sourceId);
  const sourceVersion = assertSafeId(
    input.sourceVersion,
    "sourceVersion",
    "INVALID_NUTRITION_FACT_SNAPSHOT",
  );
  const provenance = normalizeProvenance(input.provenance, input.sourceKind);
  const basis = normalizeBasis(input.basis, "basis");
  const originalBasis = normalizeBasis(input.originalBasis, "originalBasis");
  if (!sameBasis(basis, originalBasis)) {
    fail("basis conversion is not approved by this contract", "UNSUPPORTED_BASIS_TRANSFORM");
  }
  assertPlainRecord(input.facts, "facts", "INVALID_NUTRIENT_FACTS");
  if (Object.keys(input.facts).some((key) => !NUTRIENT_FIELDS.includes(key))
    || NUTRIENT_FIELDS.some((key) => !Object.hasOwn(input.facts, key))) {
    fail("facts must contain exactly the seven approved nutrients", "UNKNOWN_NUTRIENT_FIELD");
  }
  const facts = Object.fromEntries(NUTRIENT_FIELDS.map((nutrient) => [
    nutrient,
    normalizeFact(
      input.facts[nutrient],
      `facts.${nutrient}`,
      input.sourceKind,
      provenance.transformVersion,
    ),
  ]));
  const values = Object.fromEntries(NUTRIENT_FIELDS.map((nutrient) => [
    nutrient,
    facts[nutrient].value,
  ]));
  return immutable({
    schemaVersion: "NUTRITION_FACT_SNAPSHOT_V2",
    sourceId,
    sourceVersion,
    sourceKind: input.sourceKind,
    basis,
    originalBasis,
    provenance,
    values,
    facts,
    missingFields: NUTRIENT_FIELDS.filter((nutrient) => facts[nutrient].status === "MISSING"),
    traceFields: NUTRIENT_FIELDS.filter((nutrient) => isTraceStatus(facts[nutrient].status)),
    estimatedFields: NUTRIENT_FIELDS.filter((nutrient) => facts[nutrient].status === "ESTIMATED"),
  });
}

function normalizeNutritionFactSnapshot(input) {
  assertExactKeys(
    input,
    [
      "basis",
      "estimatedFields",
      "facts",
      "missingFields",
      "originalBasis",
      "provenance",
      "schemaVersion",
      "sourceId",
      "sourceKind",
      "sourceVersion",
      "traceFields",
      "values",
    ],
    [],
    "nutritionSnapshot",
    "INVALID_NUTRITION_FACT_SNAPSHOT",
  );
  if (input.schemaVersion !== "NUTRITION_FACT_SNAPSHOT_V2") {
    fail("nutrition snapshot schemaVersion is unsupported", "UNSUPPORTED_NUTRITION_SNAPSHOT");
  }
  const sourceFacts = Object.fromEntries(NUTRIENT_FIELDS.map((nutrient) => {
    const fact = input.facts?.[nutrient];
    assertExactKeys(
      fact,
      [
        "originalText",
        "originalUnit",
        "originalValue",
        "standardUnit",
        "status",
        "transformVersion",
        "value",
      ],
      [],
      `facts.${nutrient}`,
      "INVALID_NUTRIENT_FACT",
    );
    return [nutrient, {
      value: fact.value,
      status: fact.status,
      originalValue: fact.originalValue,
      originalUnit: fact.originalUnit,
      ...(fact.originalText === null ? {} : { originalText: fact.originalText }),
    }];
  }));
  const normalized = createNutritionFactSnapshot({
    sourceId: input.sourceId,
    sourceVersion: input.sourceVersion,
    sourceKind: input.sourceKind,
    basis: input.basis,
    originalBasis: input.originalBasis,
    provenance: input.provenance,
    facts: sourceFacts,
  });
  if (!isDeepStrictEqual(normalized, input)) {
    fail("nutrition snapshot derived fields were changed", "NUTRITION_SNAPSHOT_INTEGRITY_MISMATCH");
  }
  return normalized;
}

export {
  NUTRIENT_UNITS,
  PACK_NUTRIENT_STATUSES,
  PACK_SOURCE_KINDS,
  USER_NUTRIENT_STATUSES,
  createNutritionFactSnapshot,
  normalizeNutritionFactSnapshot,
};
