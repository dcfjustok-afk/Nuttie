import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BOUNDARY,
  COMMAND_TYPES,
  INPUT_SOURCES,
  PHASES,
  createBarcodeLookupState,
  normalizeTaskDefinition,
  transitionBarcodeLookup,
  validateBarcodeLookupState,
} from "./barcode-lookup-orchestrator-harness.mjs";
import {
  NUTRIENT_UNITS,
  SOURCE_KINDS,
  createLocalFoodCatalog,
  createVerifiedPackCatalogSnapshot,
} from "./local-food-catalog-harness.mjs";

const GTIN = "00123456789012";
const UNKNOWN_GTIN = "99999999999999";
const nutrientValues = {
  energyKcal: 31,
  proteinG: 3,
  carbohydrateG: 2,
  fatG: 1.5,
  fiberG: 0.7,
  sugarG: 0,
  sodiumMg: 12,
};

function nutrients(status) {
  return Object.fromEntries(Object.entries(nutrientValues).map(([field, value]) => [field, {
    value,
    status,
    originalValue: value,
    originalUnit: NUTRIENT_UNITS[field],
  }]));
}

const basis = Object.freeze({ amount: 100, unit: "g", semantic: "EDIBLE_PORTION" });

function food({ id, name, barcodes = [GTIN], status = "SOURCE_REPORTED" }) {
  return {
    id,
    name,
    originalName: name,
    originalLanguage: "zh-Hans",
    aliases: [],
    barcodes,
    nutrients: nutrients(status),
    basis,
    originalBasis: basis,
    sourceRecordId: id,
  };
}

const packFood = food({ id: "pack-soy", name: "数据包豆浆" });
const verifiedPack = createVerifiedPackCatalogSnapshot({
  activeRef: "tw.active",
  contentSha256: "a".repeat(64),
  licenseId: "tw.license",
  noticeSha256: "b".repeat(64),
  packId: "tw.food",
  packVersion: "2026.08.0",
  records: [packFood],
  sourceId: "tw-fda",
  sourceKind: SOURCE_KINDS.TW_FDA,
  sourceVersion: "2026.08",
  transformVersion: "tw.transform.v1",
});
const userFood = {
  ...food({ id: "user-soy", name: "我的豆浆", status: "USER_ENTERED" }),
  revision: "rev-1",
};
const singleCatalog = createLocalFoodCatalog({ installedPacks: [verifiedPack] });
const multipleCatalog = createLocalFoodCatalog({ installedPacks: [verifiedPack], userFoods: [userFood] });
const emptyCatalog = createLocalFoodCatalog();

function startInput(overrides = {}) {
  return {
    schemaVersion: "BARCODE_LOOKUP_START_V1",
    operationId: "barcode-op-1",
    taskContext: { diaryDate: "2026-08-13", mealSlotId: "lunch", returnRoute: "meal-add" },
    taskDefinition: {
      schemaVersion: "BARCODE_LOOKUP_TASK_DEFINITION_V1",
      taskId: "add-meal",
      definitionVersion: "v1",
      foodReviewDefinition: { route: "food-review", requiresExplicitSave: true },
      manualCreationDefinition: { route: "user-food-create", prefill: ["gtin"] },
    },
    ...overrides,
  };
}

function command(state, type, details = {}) {
  return {
    schemaVersion: "BARCODE_LOOKUP_COMMAND_V1",
    commandId: `cmd-${state.revision + 1}`,
    type,
    operationId: state.operationId,
    expectedRevision: state.revision,
    ...details,
  };
}

function submit(state, catalog, gtin = GTIN, inputSource = INPUT_SOURCES.MANUAL_DIGITS) {
  return transitionBarcodeLookup(state, command(state, COMMAND_TYPES.SUBMIT_GTIN, {
    inputSource,
    gtin,
  }), { catalog });
}

function select(state, catalog, candidateId = state.lookupEvidence.candidates[0].id) {
  return transitionBarcodeLookup(state, command(state, COMMAND_TYPES.SELECT_CANDIDATE, {
    lookupFingerprint: state.lookupEvidence.lookupFingerprint,
    candidateId,
  }), { catalog });
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function refingerprintState(state) {
  const copy = structuredClone(state);
  const { stateFingerprint: ignored, ...core } = copy;
  copy.stateFingerprint = fingerprint(core);
  return copy;
}

test("creates an immutable waiting state with explicit local-only boundaries", () => {
  const state = createBarcodeLookupState(startInput());

  assert.equal(state.phase, PHASES.AWAITING_GTIN);
  assert.equal(state.nextAction, "ACCEPT_CAMERA_RESULT_OR_MANUAL_DIGITS");
  assert.deepEqual(state.boundary, BOUNDARY);
  assert.equal(state.boundary.realNetworkRequests, 0);
  assert.equal(state.boundary.nativeApiCalls, 0);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.taskDefinition), true);
});

test("preserves caller-owned task context and versioned handoff definitions opaquely", () => {
  const input = startInput();
  const state = createBarcodeLookupState(input);

  input.taskContext.mealSlotId = "mutated";
  input.taskDefinition.foodReviewDefinition.route = "mutated";
  assert.equal(state.taskContext.mealSlotId, "lunch");
  assert.equal(state.taskDefinition.foodReviewDefinition.route, "food-review");
  assert.match(state.taskContextFingerprint, /^[a-f0-9]{64}$/);
  assert.match(state.taskDefinitionFingerprint, /^[a-f0-9]{64}$/);
});

test("validates task definitions without approving caller-owned product fields", () => {
  const definition = normalizeTaskDefinition(startInput().taskDefinition);
  assert.equal(definition.definitionVersion, "v1");
  assert.deepEqual(Object.keys(definition), [
    "schemaVersion",
    "taskId",
    "definitionVersion",
    "foodReviewDefinition",
    "manualCreationDefinition",
  ]);
  assert.throws(() => normalizeTaskDefinition({ ...definition, approvedFields: ["brand"] }), {
    code: "INVALID_BARCODE_TASK_DEFINITION",
  });
});

test("rejects unsafe, cyclic, non-finite, and oversized opaque definitions", () => {
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => createBarcodeLookupState(startInput({ taskContext: cyclic })), {
    code: "INVALID_BARCODE_DEFINITION",
  });
  assert.throws(() => createBarcodeLookupState(startInput({ taskContext: { value: Number.NaN } })), {
    code: "INVALID_BARCODE_DEFINITION",
  });
  assert.throws(() => createBarcodeLookupState(startInput({ taskContext: { value: "x".repeat(8193) } })), {
    code: "BARCODE_DEFINITION_TOO_LARGE",
  });
  const getterContext = {};
  let getterCalls = 0;
  Object.defineProperty(getterContext, "hidden", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "secret";
    },
  });
  assert.throws(() => createBarcodeLookupState(startInput({ taskContext: getterContext })), {
    code: "INVALID_BARCODE_DEFINITION",
  });
  assert.equal(getterCalls, 0);
  assert.throws(() => createBarcodeLookupState(startInput({ taskContext: { items: Array(1) } })), {
    code: "INVALID_BARCODE_DEFINITION",
  });
  const symbolContext = { safe: true };
  symbolContext[Symbol("hidden")] = "not-fingerprinted";
  assert.throws(() => createBarcodeLookupState(startInput({ taskContext: symbolContext })), {
    code: "INVALID_BARCODE_DEFINITION",
  });
});

test("manual digits perform only an exact local lookup and preserve leading zeroes", () => {
  const state = submit(createBarcodeLookupState(startInput()), singleCatalog);

  assert.equal(state.phase, PHASES.CANDIDATE_SELECTION_REQUIRED);
  assert.equal(state.lookupEvidence.gtin, GTIN);
  assert.equal(state.lookupEvidence.inputSource, INPUT_SOURCES.MANUAL_DIGITS);
  assert.equal(state.lookupEvidence.status, "MATCHED");
  assert.equal(state.lookupEvidence.candidates.length, 1);
  assert.equal(state.selectedCandidateId, null);
});

test("camera output is treated only as an external complete GTIN string", () => {
  const state = submit(
    createBarcodeLookupState(startInput()),
    singleCatalog,
    GTIN,
    INPUT_SOURCES.CAMERA_RESULT,
  );

  assert.equal(state.lookupEvidence.inputSource, INPUT_SOURCES.CAMERA_RESULT);
  assert.equal(state.boundary.cameraPermissionHandling, "EXTERNAL_F21_ORCHESTRATOR");
  assert.equal(state.boundary.fuzzyBarcodeRecognition, "NOT_AUTHORIZED");
});

test("even one exact candidate requires explicit selection before review", () => {
  const lookup = submit(createBarcodeLookupState(startInput()), singleCatalog);
  assert.equal(lookup.phase, PHASES.CANDIDATE_SELECTION_REQUIRED);
  assert.equal(lookup.selectedCandidateId, null);

  const review = select(lookup, singleCatalog);
  assert.equal(review.phase, PHASES.FOOD_REVIEW_READY);
  assert.equal(review.selectedCandidateId, lookup.lookupEvidence.candidates[0].id);
  assert.equal(review.nextAction, "OPEN_CALLER_DEFINED_FOOD_REVIEW_WITHOUT_SAVING");
});

test("multiple isolated-source candidates remain ordered and unmerged", () => {
  const state = submit(createBarcodeLookupState(startInput()), multipleCatalog);

  assert.deepEqual(state.lookupEvidence.candidates.map(({ source }) => source.kind), [
    SOURCE_KINDS.USER,
    SOURCE_KINDS.TW_FDA,
  ]);
  assert.equal(state.selectedCandidateId, null);
  assert.equal(state.boundary.sourceMerge, "FORBIDDEN");
  assert.equal(state.boundary.autoCandidateSelection, "FORBIDDEN");
});

test("selection binds the active lookup fingerprint and an included candidate", () => {
  const state = submit(createBarcodeLookupState(startInput()), multipleCatalog);

  assert.throws(() => select(state, multipleCatalog, "USER:local-user:not-present"), {
    code: "UNKNOWN_BARCODE_CANDIDATE",
  });
  assert.throws(() => transitionBarcodeLookup(state, command(state, COMMAND_TYPES.SELECT_CANDIDATE, {
    lookupFingerprint: "f".repeat(64),
    candidateId: state.lookupEvidence.candidates[0].id,
  }), { catalog: multipleCatalog }), { code: "BARCODE_LOOKUP_EVIDENCE_MISMATCH" });
});

test("a local miss hands the exact GTIN to caller-owned manual creation", () => {
  const state = submit(createBarcodeLookupState(startInput()), singleCatalog, UNKNOWN_GTIN);

  assert.equal(state.phase, PHASES.MANUAL_CREATION_READY);
  assert.equal(state.lookupEvidence.status, "NOT_FOUND");
  assert.equal(state.lookupEvidence.gtin, UNKNOWN_GTIN);
  assert.equal(state.lookupEvidence.catalogEmpty, false);
  assert.deepEqual(state.lookupEvidence.candidates, []);
  assert.equal(state.nextAction, "OPEN_CALLER_DEFINED_MANUAL_CREATION_WITH_GTIN");
  assert.equal(state.boundary.catalogMutation, "NOT_AUTHORIZED");
});

test("an empty catalog remains distinguishable from an ordinary local miss", () => {
  const state = submit(createBarcodeLookupState(startInput()), emptyCatalog, UNKNOWN_GTIN);
  assert.equal(state.lookupEvidence.status, "NOT_FOUND");
  assert.equal(state.lookupEvidence.catalogEmpty, true);
});

test("retry clears lookup evidence without losing the caller task", () => {
  const miss = submit(createBarcodeLookupState(startInput()), singleCatalog, UNKNOWN_GTIN);
  const retried = transitionBarcodeLookup(miss, command(miss, COMMAND_TYPES.RETRY_INPUT), {
    catalog: singleCatalog,
  });

  assert.equal(retried.phase, PHASES.AWAITING_GTIN);
  assert.equal(retried.lookupEvidence, null);
  assert.equal(retried.selectedCandidateId, null);
  assert.deepEqual(retried.taskContext, miss.taskContext);
  assert.deepEqual(retried.taskDefinition, miss.taskDefinition);
});

test("retry is also available after review without mutating the selected food", () => {
  const review = select(submit(createBarcodeLookupState(startInput()), singleCatalog), singleCatalog);
  const retried = transitionBarcodeLookup(review, command(review, COMMAND_TYPES.RETRY_INPUT), {
    catalog: singleCatalog,
  });

  assert.equal(retried.phase, PHASES.AWAITING_GTIN);
  assert.equal(retried.lookupEvidence, null);
  assert.equal(retried.boundary.diaryMutation, "NOT_AUTHORIZED");
});

test("rejects partial, numeric, malformed, and unsupported barcode input", () => {
  const state = createBarcodeLookupState(startInput());
  for (const gtin of ["1234567", "12345678901", "123456789012345", 12345678, "1234 5678"]) {
    assert.throws(() => transitionBarcodeLookup(state, command(state, COMMAND_TYPES.SUBMIT_GTIN, {
      inputSource: INPUT_SOURCES.MANUAL_DIGITS,
      gtin,
    }), { catalog: singleCatalog }), { code: "INVALID_BARCODE_LOOKUP_COMMAND" });
  }
  assert.throws(() => transitionBarcodeLookup(state, command(state, COMMAND_TYPES.SUBMIT_GTIN, {
    inputSource: "OCR_GUESS",
    gtin: GTIN,
  }), { catalog: singleCatalog }), { code: "INVALID_BARCODE_LOOKUP_COMMAND" });
});

test("requires the authentic local catalog port for submission and evidence validation", () => {
  const initial = createBarcodeLookupState(startInput());
  assert.throws(() => transitionBarcodeLookup(initial, command(initial, COMMAND_TYPES.SUBMIT_GTIN, {
    inputSource: INPUT_SOURCES.MANUAL_DIGITS,
    gtin: GTIN,
  })), { code: "LOCAL_CATALOG_PORT_REQUIRED" });
  assert.throws(() => transitionBarcodeLookup(initial, command(initial, COMMAND_TYPES.SUBMIT_GTIN, {
    inputSource: INPUT_SOURCES.MANUAL_DIGITS,
    gtin: GTIN,
  }), { catalog: {} }), { code: "INVALID_LOCAL_CATALOG" });

  const lookup = submit(initial, singleCatalog);
  assert.throws(() => validateBarcodeLookupState(lookup), { code: "LOCAL_CATALOG_PORT_REQUIRED" });
});

test("rejects catalog replacement and lookup evidence tampering", () => {
  const state = submit(createBarcodeLookupState(startInput()), singleCatalog);
  assert.throws(() => validateBarcodeLookupState(state, multipleCatalog), {
    code: "BARCODE_LOOKUP_CATALOG_EVIDENCE_MISMATCH",
  });

  const tampered = structuredClone(state);
  tampered.lookupEvidence.candidates[0].displayName = "篡改名称";
  const { lookupFingerprint: ignored, ...lookupCore } = tampered.lookupEvidence;
  tampered.lookupEvidence.lookupFingerprint = fingerprint(lookupCore);
  const selfConsistent = refingerprintState(tampered);
  assert.throws(() => validateBarcodeLookupState(selfConsistent, singleCatalog), {
    code: "BARCODE_LOOKUP_CATALOG_EVIDENCE_MISMATCH",
  });
});

test("bounds untrusted candidate evidence before catalog comparison", () => {
  const state = submit(createBarcodeLookupState(startInput()), singleCatalog);
  const tampered = structuredClone(state);
  tampered.lookupEvidence.candidates[0].displayName = "x".repeat(8193);
  assert.throws(() => validateBarcodeLookupState(tampered, singleCatalog), {
    code: "BARCODE_LOOKUP_EVIDENCE_TOO_LARGE",
  });
});

test("rejects stale revisions, operation mismatches, extra fields, and illegal phases", () => {
  const state = createBarcodeLookupState(startInput());
  const valid = command(state, COMMAND_TYPES.SUBMIT_GTIN, {
    inputSource: INPUT_SOURCES.MANUAL_DIGITS,
    gtin: GTIN,
  });
  assert.throws(() => transitionBarcodeLookup(state, { ...valid, expectedRevision: 1 }, {
    catalog: singleCatalog,
  }), { code: "STALE_BARCODE_LOOKUP_REVISION" });
  assert.throws(() => transitionBarcodeLookup(state, { ...valid, operationId: "another-op" }, {
    catalog: singleCatalog,
  }), { code: "BARCODE_LOOKUP_OPERATION_MISMATCH" });
  assert.throws(() => transitionBarcodeLookup(state, { ...valid, fuzzy: true }, {
    catalog: singleCatalog,
  }), { code: "INVALID_BARCODE_LOOKUP_COMMAND" });
  assert.throws(() => transitionBarcodeLookup(state, command(state, COMMAND_TYPES.RETRY_INPUT)), {
    code: "INVALID_BARCODE_LOOKUP_TRANSITION",
  });

  const lookup = submit(state, singleCatalog);
  assert.throws(() => transitionBarcodeLookup(lookup, {
    ...valid,
    commandId: "cmd-again",
    expectedRevision: lookup.revision,
  }, { catalog: singleCatalog }), { code: "INVALID_BARCODE_LOOKUP_TRANSITION" });
});

test("state validation rejects altered derived fields and fingerprints", () => {
  const state = createBarcodeLookupState(startInput());
  assert.throws(() => validateBarcodeLookupState({ ...state, nextAction: "AUTO_SAVE" }), {
    code: "INVALID_BARCODE_LOOKUP_STATE",
  });
  assert.throws(() => validateBarcodeLookupState({ ...state, stateFingerprint: "0".repeat(64) }), {
    code: "INVALID_BARCODE_LOOKUP_STATE",
  });
  assert.throws(() => validateBarcodeLookupState({ ...state, boundary: { ...state.boundary, networkFallback: "ALLOWED" } }), {
    code: "INVALID_BARCODE_LOOKUP_STATE",
  });

  const lookup = submit(state, singleCatalog);
  const numericGtin = structuredClone(lookup);
  numericGtin.lookupEvidence.gtin = 12345678;
  const { lookupFingerprint: ignored, ...lookupCore } = numericGtin.lookupEvidence;
  numericGtin.lookupEvidence.lookupFingerprint = fingerprint(lookupCore);
  assert.throws(() => validateBarcodeLookupState(refingerprintState(numericGtin), singleCatalog), {
    code: "INVALID_BARCODE_LOOKUP_EVIDENCE",
  });
});

test("implementation has no network, native, persistence, clock, or automatic-save path", async () => {
  const source = await readFile(new URL("./barcode-lookup-orchestrator-harness.mjs", import.meta.url), "utf8");

  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket)\b|node:https|node:http|https?:\/\//);
  assert.doesNotMatch(source, /\b(?:expo-camera|AVFoundation|VisionKit|AsyncStorage|SQLite|Keychain)\b/);
  assert.doesNotMatch(source, /\b(?:Date\.now|new Date|performance\.now|setTimeout|setInterval)\b/);
  assert.doesNotMatch(source, /\b(?:saveMeal|insertFood|updateFood|deleteFood|writeFile|appendFile)\b/);
  assert.equal(Object.hasOwn(COMMAND_TYPES, "CREATE_USER_FOOD"), false);
  assert.deepEqual({
    catalogMutation: BOUNDARY.catalogMutation,
    diaryMutation: BOUNDARY.diaryMutation,
    portionRule: BOUNDARY.portionRule,
    aiFallback: BOUNDARY.aiFallback,
  }, {
    catalogMutation: "NOT_AUTHORIZED",
    diaryMutation: "NOT_AUTHORIZED",
    portionRule: "CALLER_OWNED_REVIEW",
    aiFallback: "SEPARATE_USER_INITIATED_FLOW_NOT_AUTHORIZED_HERE",
  });
});
