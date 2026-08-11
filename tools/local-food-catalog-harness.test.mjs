import assert from "node:assert/strict";
import test from "node:test";
import {
  createManualMealEntryState,
  requestManualMealSave,
  reviewManualMeal,
} from "./manual-meal-entry-harness.mjs";

import {
  NUTRIENT_UNITS,
  SOURCE_KINDS,
  createVerifiedPackCatalogSnapshot,
  createLocalFoodCatalog,
  lookupLocalFoodByGtin,
  makeQualifiedFoodId,
  searchLocalFoods,
} from "./local-food-catalog-harness.mjs";

const baseNutrientValues = {
  energyKcal: 40,
  proteinG: 3,
  carbohydrateG: 5,
  fatG: 1,
  fiberG: 0,
  sugarG: 2,
  sodiumMg: 20,
};

function nutrientFact(field, input, status = "SOURCE_REPORTED") {
  if (input === null) {
    return {
      value: null,
      status: "MISSING",
      originalValue: null,
      originalUnit: null,
    };
  }
  if (typeof input === "number") {
    return {
      value: input,
      status,
      originalValue: input,
      originalUnit: NUTRIENT_UNITS[field],
    };
  }
  return input;
}

const sevenNutrients = (overrides = {}, status = "SOURCE_REPORTED") => Object.fromEntries(
  Object.entries({ ...baseNutrientValues, ...overrides })
    .map(([field, value]) => [field, nutrientFact(field, value, status)]),
);

const sevenUserNutrients = (overrides = {}) => sevenNutrients(overrides, "USER_ENTERED");

const grams100Basis = Object.freeze({ amount: 100, unit: "g", semantic: "EDIBLE_PORTION" });
const servingBasis = Object.freeze({ amount: 1, unit: "serving", semantic: "DECLARED_SERVING" });

const food = ({
  id,
  name,
  originalName = name,
  originalLanguage = "zh-Hant",
  aliases = [],
  barcodes = [],
  nutrients = sevenNutrients(),
  basis = grams100Basis,
  originalBasis = basis,
  sourceRecordId = id,
}) => ({
  id,
  name,
  originalName,
  originalLanguage,
  aliases,
  barcodes,
  nutrients,
  basis,
  originalBasis,
  sourceRecordId,
});

const verifiedPack = (input) => createVerifiedPackCatalogSnapshot({
  activeRef: `${input.packId}.active`,
  contentSha256: "a".repeat(64),
  licenseId: `${input.sourceId}.license`,
  noticeSha256: "b".repeat(64),
  transformVersion: `${input.sourceId}.transform.v1`,
  ...input,
});

const twPackInput = {
  packId: "tw.food.nutrition",
  packVersion: "2026.08.0",
  sourceKind: SOURCE_KINDS.TW_FDA,
  sourceId: "tw-fda-food-nutrition",
  sourceVersion: "2026.08",
  records: [
    food({
      id: "soy-milk",
      name: "无糖豆浆",
      originalName: "無糖豆漿",
      aliases: [{ value: "unsweetened soy milk", language: "en" }],
      barcodes: ["00123456789012"],
      nutrients: sevenNutrients({
        energyKcal: 31,
        sugarG: null,
        sodiumMg: {
          value: 12,
          status: "SOURCE_REPORTED",
          originalValue: 0.012,
          originalUnit: "g",
        },
      }),
    }),
    food({
      id: "apple-juice",
      name: "苹果汁",
      originalName: "蘋果汁",
      aliases: [{ value: "apple juice", language: "en" }],
      nutrients: sevenNutrients({
        energyKcal: 0,
        fiberG: {
          value: null,
          status: "TRACE",
          originalValue: null,
          originalUnit: "g",
          originalText: "Tr",
        },
      }),
    }),
  ],
};
const twPack = verifiedPack(twPackInput);

const foundationPackInput = {
  packId: "usda.foundation",
  packVersion: "2026.04.0",
  sourceKind: SOURCE_KINDS.USDA_FOUNDATION,
  sourceId: "usda-foundation",
  sourceVersion: "2026.04",
  records: [
    food({
      id: "apple",
      name: "苹果",
      originalName: "Ａpple, raw",
      originalLanguage: "en",
      aliases: [{ value: "raw apple", language: "en" }],
      nutrients: sevenNutrients({ energyKcal: 52, sodiumMg: 1 }),
    }),
    food({
      id: "banana",
      name: "香蕉",
      originalName: "Banana, raw",
      originalLanguage: "en",
      nutrients: sevenNutrients({
        energyKcal: 89,
        fatG: {
          value: 0.3,
          status: "ESTIMATED",
          originalValue: 0.3,
          originalUnit: "g",
        },
      }),
    }),
  ],
};
const foundationPack = verifiedPack(foundationPackInput);

const srPackInput = {
  packId: "usda.sr-legacy",
  packVersion: "2018.0",
  sourceKind: SOURCE_KINDS.USDA_SR_LEGACY,
  sourceId: "usda-sr-legacy",
  sourceVersion: "2018",
  records: [food({
    id: "dried-apple",
    name: "苹果干",
    originalName: "Apples, dried",
    originalLanguage: "en",
    aliases: [{ value: "dried apple", language: "en" }],
    nutrients: sevenNutrients({ energyKcal: 243 }),
  })],
};
const srPack = verifiedPack(srPackInput);

const userSoy = {
  ...food({
    id: "my-soy-milk",
    name: "我的豆浆",
    originalName: "我的豆浆",
    originalLanguage: "zh-Hans",
    barcodes: ["00123456789012"],
    nutrients: sevenUserNutrients({ energyKcal: 28, sugarG: 0 }),
    basis: servingBasis,
  }),
  revision: "rev-3",
};

test("catalog records only active local partitions and forbids network fallback", () => {
  const catalog = createLocalFoodCatalog({
    installedPacks: [srPack, twPack, foundationPack],
    userFoods: [userSoy],
  });

  assert.equal(catalog.recordCount, 6);
  assert.equal(catalog.networkPolicy, "FORBIDDEN");
  assert.equal(catalog.queryMode, "LOCAL_ONLY");
  assert.deepEqual(catalog.sourceSummaries.map(({ kind }) => kind), [
    SOURCE_KINDS.USER,
    SOURCE_KINDS.TW_FDA,
    SOURCE_KINDS.USDA_FOUNDATION,
    SOURCE_KINDS.USDA_SR_LEGACY,
  ]);
  assert.equal(Object.isFrozen(catalog), true);
});

test("exact GTIN lookup preserves leading zeroes", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [twPack] });
  const result = lookupLocalFoodByGtin(catalog, "00123456789012");

  assert.equal(result.status, "MATCHED");
  assert.equal(result.mode, "LOCAL_EXACT_GTIN");
  assert.equal(result.gtin, "00123456789012");
  assert.equal(result.candidates[0].displayName, "无糖豆浆");
  assert.equal(result.networkFallback, "FORBIDDEN");
});

test("same GTIN across isolated sources returns ordered candidates", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [twPack], userFoods: [userSoy] });
  const result = lookupLocalFoodByGtin(catalog, "00123456789012");

  assert.deepEqual(result.candidates.map(({ source }) => source.kind), [
    SOURCE_KINDS.USER,
    SOURCE_KINDS.TW_FDA,
  ]);
  assert.notEqual(result.candidates[0].id, result.candidates[1].id);
});

test("GTIN miss returns only the local manual creation path", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [twPack] });
  const result = lookupLocalFoodByGtin(catalog, "99999999999999");

  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.nextAction, { type: "CREATE_USER_FOOD", gtin: "99999999999999" });
  assert.equal(result.networkFallback, "FORBIDDEN");
  assert.equal(Object.hasOwn(result, "url"), false);
});

test("empty catalog still offers manual creation without inventing a match", () => {
  const result = lookupLocalFoodByGtin(createLocalFoodCatalog(), "99999999");
  assert.equal(result.status, "NOT_FOUND");
  assert.equal(result.catalogEmpty, true);
  assert.equal(result.nextAction.type, "CREATE_USER_FOOD");
});

test("GTIN accepts only supported digit-string lengths", () => {
  const catalog = createLocalFoodCatalog();
  assert.throws(() => lookupLocalFoodByGtin(catalog, 12345678), { code: "INVALID_GTIN" });
  assert.throws(() => lookupLocalFoodByGtin(catalog, "123456789"), { code: "INVALID_GTIN" });
  assert.throws(() => lookupLocalFoodByGtin(catalog, "1234-5678"), { code: "INVALID_GTIN" });
});

test("search ranks exact, prefix, token-prefix and substring deterministically", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [srPack, twPack, foundationPack] });
  const result = searchLocalFoods(catalog, { query: "苹果" });

  assert.equal(result.status, "MATCHED");
  assert.deepEqual(result.results.map(({ displayName, match }) => [displayName, match.type]), [
    ["苹果", "EXACT"],
    ["苹果汁", "PREFIX"],
    ["苹果干", "PREFIX"],
  ]);
  assert.equal(result.totalMatches, 3);
});

test("search matches preserved original text and aliases", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [twPack, foundationPack] });
  const traditional = searchLocalFoods(catalog, { query: "無糖豆漿" });
  const alias = searchLocalFoods(catalog, { query: "raw apple" });
  const normalizedOriginal = searchLocalFoods(catalog, { query: "Apple, raw" });

  assert.equal(traditional.results[0].displayName, "无糖豆浆");
  assert.equal(traditional.results[0].match.field, "originalName");
  assert.equal(alias.results[0].displayName, "苹果");
  assert.equal(alias.results[0].match.field, "alias");
  assert.equal(normalizedOriginal.results[0].originalName, "Ａpple, raw");
  assert.equal(normalizedOriginal.results[0].match.field, "originalName");
});

test("search order is stable when pack and record input order changes", () => {
  const reversedTw = verifiedPack({
    ...twPackInput,
    activeRef: "tw.food.nutrition.reversed",
    records: [...twPackInput.records].reverse(),
  });
  const first = createLocalFoodCatalog({ installedPacks: [twPack, foundationPack, srPack] });
  const second = createLocalFoodCatalog({ installedPacks: [srPack, foundationPack, reversedTw] });

  assert.deepEqual(
    searchLocalFoods(first, { query: "apple" }).results.map(({ id }) => id),
    searchLocalFoods(second, { query: "apple" }).results.map(({ id }) => id),
  );
});

test("source filter and limit are explicit", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [twPack, foundationPack, srPack] });
  const result = searchLocalFoods(catalog, {
    query: "apple",
    limit: 1,
    sourceKinds: [SOURCE_KINDS.USDA_SR_LEGACY],
  });

  assert.equal(result.totalMatches, 1);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].source.kind, SOURCE_KINDS.USDA_SR_LEGACY);
  assert.throws(() => searchLocalFoods(catalog, { query: "apple", limit: 0 }), {
    code: "INVALID_SEARCH_LIMIT",
  });
  assert.throws(() => searchLocalFoods(catalog, { query: "apple", sourceKinds: [] }), {
    code: "INVALID_SOURCE_FILTER",
  });
});

test("empty and unmatched searches never substitute recent or online results", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [foundationPack] });
  const empty = searchLocalFoods(catalog, { query: "   " });
  const fuzzy = searchLocalFoods(catalog, { query: "xiangjiao" });

  assert.equal(empty.status, "EMPTY_QUERY");
  assert.deepEqual(empty.results, []);
  assert.equal(fuzzy.status, "NOT_FOUND");
  assert.deepEqual(fuzzy.results, []);
  assert.equal(fuzzy.networkFallback, "FORBIDDEN");
});

test("missing, trace, estimated and numeric zero nutrition remain distinct", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [twPack, foundationPack] });
  const soy = lookupLocalFoodByGtin(catalog, "00123456789012").candidates[0];
  const juice = searchLocalFoods(catalog, { query: "苹果汁" }).results[0];
  const banana = searchLocalFoods(catalog, { query: "香蕉" }).results[0];

  assert.equal(soy.nutrition.values.sugarG, null);
  assert.equal(soy.nutrition.missingFields.includes("sugarG"), true);
  assert.equal(juice.nutrition.values.energyKcal, 0);
  assert.equal(juice.nutrition.values.fiberG, null);
  assert.equal(juice.nutrition.traceFields.includes("fiberG"), true);
  assert.equal(juice.nutrition.facts.fiberG.originalText, "Tr");
  assert.equal(juice.nutrition.facts.fiberG.standardUnit, "g");
  assert.equal(banana.nutrition.estimatedFields.includes("fatG"), true);
  assert.equal(banana.nutrition.facts.fatG.status, "ESTIMATED");
});

test("a catalog fact snapshot survives manual meal review without semantic loss", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [twPack] });
  const juice = searchLocalFoods(catalog, { query: "苹果汁" }).results[0];
  const reviewed = reviewManualMeal(createManualMealEntryState({
    draft: {
      id: "meal-from-catalog",
      localDate: "2026-08-11",
      nutrition: juice.nutrition,
    },
  }));
  const saving = requestManualMealSave(reviewed, { commandId: "save-catalog-meal" });

  assert.equal(reviewed.status, "REVIEW_READY");
  assert.equal(reviewed.draft.nutrition.schemaVersion, "NUTRITION_FACT_SNAPSHOT_V2");
  assert.equal(reviewed.draft.nutrition.facts.fiberG.status, "TRACE");
  assert.equal(reviewed.draft.nutrition.facts.fiberG.originalText, "Tr");
  assert.deepEqual(reviewed.draft.nutrition.basis, grams100Basis);
  assert.equal(reviewed.previewSummary.completeness.fiberG, "MISSING");
  assert.equal(saving.state.pendingCommand.meal.nutrition.facts.fiberG.status, "TRACE");
  assert.equal(saving.state.pendingCommand.meal.nutrition.provenance.sourceRecordId, "apple-juice");
});

test("unit conversion, basis transformation and trace semantics fail closed", () => {
  const unitMismatch = structuredClone(twPackInput);
  unitMismatch.records[0].nutrients.proteinG.originalUnit = "mg";
  assert.throws(() => verifiedPack(unitMismatch), { code: "NUTRIENT_CONVERSION_MISMATCH" });

  const basisMismatch = structuredClone(twPackInput);
  basisMismatch.records[0].originalBasis = servingBasis;
  assert.throws(() => verifiedPack(basisMismatch), { code: "UNSUPPORTED_BASIS_TRANSFORM" });

  const fakeTrace = structuredClone(twPackInput);
  fakeTrace.records[1].nutrients.fiberG.originalText = "10 g";
  assert.throws(() => verifiedPack(fakeTrace), { code: "INVALID_NUTRIENT_FACT" });
});

test("user foods cannot claim upstream measurement status", () => {
  const elevatedUser = structuredClone(userSoy);
  elevatedUser.nutrients.energyKcal.status = "MEASURED";
  assert.throws(() => createLocalFoodCatalog({ userFoods: [elevatedUser] }), {
    code: "INVALID_NUTRIENT_STATUS",
  });
});

test("source provenance and storage partitions stay isolated", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [twPack, foundationPack], userFoods: [userSoy] });
  const matches = searchLocalFoods(catalog, { query: "豆浆" }).results;
  const user = matches.find(({ source }) => source.kind === SOURCE_KINDS.USER);
  const upstream = matches.find(({ source }) => source.kind === SOURCE_KINDS.TW_FDA);

  assert.equal(user.source.storagePartition, "SQLCIPHER_USER_FOOD");
  assert.equal(user.source.packId, null);
  assert.equal(upstream.source.storagePartition.startsWith("TW_FDA:"), true);
  assert.equal(upstream.nutrition.sourceVersion, twPackInput.sourceVersion);
  assert.equal(upstream.source.contentSha256, "a".repeat(64));
  assert.equal(upstream.nutrition.provenance.noticeSha256, "b".repeat(64));
  assert.equal(user.basis.unit, "serving");
  assert.equal(user.originalBasis.semantic, "DECLARED_SERVING");
});

test("display override changes presentation without rewriting upstream facts", () => {
  const targetQualifiedId = makeQualifiedFoodId(
    SOURCE_KINDS.TW_FDA,
    twPackInput.sourceId,
    "soy-milk",
  );
  const originalInput = structuredClone(twPack);
  const catalog = createLocalFoodCatalog({
    installedPacks: [twPack],
    displayOverrides: [{
      id: "override-soy-name",
      targetQualifiedId,
      displayName: "早餐豆浆",
      aliases: [{ value: "自定义豆浆", language: "zh-Hans" }],
    }],
  });
  const result = searchLocalFoods(catalog, { query: "早餐豆浆" }).results[0];

  assert.equal(result.displayName, "早餐豆浆");
  assert.equal(result.originalName, "無糖豆漿");
  assert.equal(result.nutrition.values.energyKcal, 31);
  assert.equal(result.source.kind, SOURCE_KINDS.TW_FDA);
  assert.equal(result.displayOverride.provenance, "SQLCIPHER_USER_OVERRIDE");
  assert.deepEqual(twPack, originalInput);
});

test("display overrides cannot inject nutrition or target user records", () => {
  const upstreamId = makeQualifiedFoodId(SOURCE_KINDS.TW_FDA, twPackInput.sourceId, "soy-milk");
  const userId = makeQualifiedFoodId(SOURCE_KINDS.USER, "local-user", userSoy.id);
  assert.throws(() => createLocalFoodCatalog({
    installedPacks: [twPack],
    displayOverrides: [{
      id: "bad-override",
      targetQualifiedId: upstreamId,
      displayName: "bad",
      nutrients: sevenNutrients(),
    }],
  }), { code: "INVALID_DISPLAY_OVERRIDE" });
  assert.throws(() => createLocalFoodCatalog({
    userFoods: [userSoy],
    displayOverrides: [{ id: "bad-user-target", targetQualifiedId: userId, displayName: "bad" }],
  }), { code: "INVALID_DISPLAY_OVERRIDE_TARGET" });
});

test("only opaque verified snapshots can enter the catalog", () => {
  assert.throws(() => createLocalFoodCatalog({
    installedPacks: [{ ...twPackInput, status: "ACTIVE_VERIFIED_BY_IMPORT_PORT" }],
  }), { code: "UNTRUSTED_PACK_SNAPSHOT" });
  assert.throws(() => createLocalFoodCatalog({ installedPacks: [structuredClone(twPack)] }), {
    code: "UNTRUSTED_PACK_SNAPSHOT",
  });
  assert.throws(() => verifiedPack({ ...twPackInput, sourceKind: "OPEN_FOOD_FACTS" }), {
    code: "INVALID_PACK_SOURCE_KIND",
  });
});

test("duplicate active source identities and storage partitions are rejected", () => {
  const replacement = verifiedPack({
    ...twPackInput,
    activeRef: "tw.food.nutrition.replacement",
    packVersion: "2026.09.0",
  });
  assert.throws(() => createLocalFoodCatalog({
    installedPacks: [twPack, replacement],
  }), { code: "DUPLICATE_ACTIVE_SOURCE" });
});

test("one source cannot map a GTIN to multiple records", () => {
  const ambiguous = {
    ...twPackInput,
    records: [
      ...twPackInput.records,
      food({ id: "other-soy", name: "另一豆浆", barcodes: ["00123456789012"] }),
    ],
  };
  assert.throws(() => verifiedPack(ambiguous), {
    code: "AMBIGUOUS_SOURCE_GTIN",
  });
});

test("records reject unknown nutrient fields and unsafe values", () => {
  const unknownNutrient = {
    ...twPackInput,
    records: [{
      ...twPackInput.records[0],
      nutrients: { ...twPackInput.records[0].nutrients, vitaminCG: 3 },
    }],
  };
  const negative = {
    ...twPackInput,
    records: [{
      ...twPackInput.records[0],
      nutrients: {
        ...twPackInput.records[0].nutrients,
        proteinG: { ...twPackInput.records[0].nutrients.proteinG, value: -1 },
      },
    }],
  };
  assert.throws(() => verifiedPack(unknownNutrient), {
    code: "UNKNOWN_NUTRIENT_FIELD",
  });
  assert.throws(() => verifiedPack(negative), {
    code: "INVALID_NUMBER",
  });
});

test("catalog queries return frozen copies isolated from caller mutation", () => {
  const mutablePackInput = structuredClone(twPackInput);
  const issuedSnapshot = verifiedPack(mutablePackInput);
  const catalog = createLocalFoodCatalog({ installedPacks: [issuedSnapshot] });
  mutablePackInput.records[0].name = "被外部改写";
  mutablePackInput.records[0].nutrients.energyKcal.value = 999;

  const result = lookupLocalFoodByGtin(catalog, "00123456789012");
  assert.equal(result.candidates[0].displayName, "无糖豆浆");
  assert.equal(result.candidates[0].nutrition.values.energyKcal, 31);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.candidates[0].nutrition.values), true);
});

test("catalog capability surface excludes favorites, recents, ratings and online search", () => {
  const catalog = createLocalFoodCatalog({ installedPacks: [twPack] });
  const result = searchLocalFoods(catalog, { query: "豆浆" });
  const serialized = JSON.stringify({ catalog, result });

  for (const forbidden of ["favorite", "recent", "rating", "http://", "https://"]) {
    assert.equal(serialized.toLowerCase().includes(forbidden), false);
  }
});
