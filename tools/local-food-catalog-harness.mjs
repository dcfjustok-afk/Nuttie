import { validateBarcodeMapping } from "./data-pack-contract-harness.mjs";
import {
  NUTRIENT_UNITS,
  PACK_NUTRIENT_STATUSES,
  PACK_SOURCE_KINDS,
  USER_NUTRIENT_STATUSES,
  createNutritionFactSnapshot,
  normalizeNutritionFactSnapshotStructure,
  validateNutritionFactSnapshotInput,
} from "./nutrition-fact-snapshot-harness.mjs";

const SOURCE_KINDS = Object.freeze({
  USER: "USER",
  TW_FDA: "TW_FDA",
  USDA_FOUNDATION: "USDA_FOUNDATION",
  USDA_SR_LEGACY: "USDA_SR_LEGACY",
});

const SOURCE_PRIORITY = Object.freeze({
  [SOURCE_KINDS.USER]: 0,
  [SOURCE_KINDS.TW_FDA]: 1,
  [SOURCE_KINDS.USDA_FOUNDATION]: 2,
  [SOURCE_KINDS.USDA_SR_LEGACY]: 3,
});

const CATALOG_DATA = new WeakMap();
const VERIFIED_PACK_DATA = new WeakMap();
const TRUSTED_PACK_SNAPSHOTS = new WeakSet();
const TRUST_CONTEXTS = new WeakMap();
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function packTrustFingerprint(snapshot) {
  return JSON.stringify({
    sourceId: snapshot.sourceId,
    sourceVersion: snapshot.sourceVersion,
    sourceKind: snapshot.sourceKind,
    basis: snapshot.basis,
    originalBasis: snapshot.originalBasis,
    provenance: snapshot.provenance,
    values: snapshot.values,
    facts: snapshot.facts,
  });
}

function issueVerifiedPackNutritionFactSnapshot(input) {
  if (!PACK_SOURCE_KINDS.includes(input?.sourceKind)) {
    fail("verified pack sourceKind is unsupported", "INVALID_SOURCE_KIND");
  }
  const snapshot = validateNutritionFactSnapshotInput(input);
  TRUSTED_PACK_SNAPSHOTS.add(snapshot);
  return snapshot;
}

function createNutritionSnapshotTrustContext(trustedSnapshots) {
  if (!Array.isArray(trustedSnapshots) || trustedSnapshots.length === 0) {
    fail("trustedSnapshots must be a non-empty array", "INVALID_TRUST_CONTEXT_INPUT");
  }
  const fingerprints = new Set(trustedSnapshots.map((snapshot, index) => {
    if (!TRUSTED_PACK_SNAPSHOTS.has(snapshot)) {
      fail(`trustedSnapshots[${index}] is not catalog-bound`, "UNTRUSTED_PACK_NUTRITION_SNAPSHOT");
    }
    return packTrustFingerprint(snapshot);
  }));
  const context = Object.freeze({ kind: "NUTRITION_SNAPSHOT_TRUST_CONTEXT" });
  TRUST_CONTEXTS.set(context, fingerprints);
  return context;
}

function normalizeNutritionFactSnapshot(input, { trustContext = null } = {}) {
  const normalized = normalizeNutritionFactSnapshotStructure(input);
  if (normalized.sourceKind !== SOURCE_KINDS.USER) {
    const trustedFingerprints = TRUST_CONTEXTS.get(trustContext);
    const trustedByContext = trustedFingerprints?.has(packTrustFingerprint(normalized)) === true;
    if (!TRUSTED_PACK_SNAPSHOTS.has(input) && !trustedByContext) {
      fail(
        "pack nutrition snapshot is not bound to the verified catalog or trust context",
        "UNTRUSTED_PACK_NUTRITION_SNAPSHOT",
      );
    }
    TRUSTED_PACK_SNAPSHOTS.add(normalized);
  }
  return normalized;
}

function clone(value, seen = new Map()) {
  if (value === undefined || value === null || typeof value !== "object") return value;
  if (value.schemaVersion === "NUTRITION_FACT_SNAPSHOT_V2") {
    return normalizeNutritionFactSnapshot(value);
  }
  if (seen.has(value)) return seen.get(value);
  const output = Array.isArray(value) ? [] : {};
  seen.set(value, output);
  for (const [key, child] of Object.entries(value)) output[key] = clone(child, seen);
  return output;
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

function assertPlainRecord(value, field, code = "INVALID_RECORD") {
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

function assertSafeId(value, field, code = "INVALID_IDENTIFIER") {
  if (typeof value !== "string" || !SAFE_ID.test(value)) {
    fail(`${field} is invalid`, code, { field });
  }
  return value;
}

function assertText(value, field, { maxLength = 200 } = {}) {
  if (typeof value !== "string") fail(`${field} must be text`, "INVALID_TEXT", { field });
  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (normalized.length === 0 || normalized.length > maxLength || /[\u0000-\u001f\u007f]/.test(normalized)) {
    fail(`${field} is invalid`, "INVALID_TEXT", { field });
  }
  return normalized;
}

function assertRawText(value, field, { maxLength = 200 } = {}) {
  if (typeof value !== "string"
    || value.length === 0
    || value.length > maxLength
    || value.trim().length === 0
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    fail(`${field} is invalid`, "INVALID_SOURCE_TEXT", { field });
  }
  return value;
}

function assertHash(value, field) {
  if (typeof value !== "string" || !SHA256.test(value)) {
    fail(`${field} must be a lowercase SHA-256`, "INVALID_PACK_PROVENANCE", { field });
  }
  return value;
}

function searchKey(value) {
  return assertText(value, "searchText").toLocaleLowerCase("zh-CN");
}

function normalizeGtin(value) {
  return validateBarcodeMapping({ gtin: value, catalogRecordId: "catalog-lookup" }).gtin;
}

function makeQualifiedFoodId(sourceKind, sourceId, recordId) {
  if (!Object.values(SOURCE_KINDS).includes(sourceKind)) {
    fail("sourceKind is invalid", "INVALID_SOURCE_KIND");
  }
  return `${sourceKind}/${assertSafeId(sourceId, "sourceId")}/${assertSafeId(recordId, "recordId")}`;
}

function normalizeAliases(input, field) {
  if (input === undefined) return [];
  if (!Array.isArray(input)) fail(`${field} must be an array`, "INVALID_ALIASES", { field });
  const aliases = input.map((alias, index) => {
    assertExactKeys(
      alias,
      ["language", "value"],
      [],
      `${field}[${index}]`,
      "INVALID_ALIAS",
    );
    return {
      value: assertText(alias.value, `${field}[${index}].value`),
      language: assertSafeId(alias.language, `${field}[${index}].language`, "INVALID_ALIAS"),
    };
  });
  const keys = aliases.map(({ value, language }) => `${language}\u0000${searchKey(value)}`);
  if (new Set(keys).size !== keys.length) fail(`${field} contains duplicates`, "DUPLICATE_ALIAS");
  return aliases;
}

function normalizeBarcodes(input, field) {
  if (input === undefined) return [];
  if (!Array.isArray(input)) fail(`${field} must be an array`, "INVALID_BARCODES", { field });
  const barcodes = input.map((gtin) => normalizeGtin(gtin));
  if (new Set(barcodes).size !== barcodes.length) {
    fail(`${field} contains duplicate GTIN values`, "DUPLICATE_GTIN");
  }
  return barcodes;
}

function normalizeFoodRecord(input, source, field) {
  assertExactKeys(
    input,
    [
      "basis",
      "id",
      "name",
      "nutrients",
      "originalBasis",
      "originalLanguage",
      "originalName",
      "sourceRecordId",
    ],
    ["aliases", "barcodes"],
    field,
    "INVALID_FOOD_RECORD",
  );
  const id = assertSafeId(input.id, `${field}.id`, "INVALID_FOOD_RECORD");
  const sourceRecordId = assertSafeId(
    input.sourceRecordId,
    `${field}.sourceRecordId`,
    "INVALID_FOOD_RECORD",
  );
  const snapshotInput = {
    sourceId: `${source.kind}.${source.sourceId}.${id}`,
    sourceVersion: source.sourceVersion,
    sourceKind: source.kind,
    basis: input.basis,
    originalBasis: input.originalBasis,
    provenance: {
      sourceRecordId,
      transformVersion: source.transformVersion,
      activeRef: source.activeRef,
      contentSha256: source.contentSha256,
      licenseId: source.licenseId,
      noticeSha256: source.noticeSha256,
      packId: source.packId,
      packVersion: source.packVersion,
    },
    facts: input.nutrients,
  };
  const nutrition = source.kind === SOURCE_KINDS.USER
    ? createNutritionFactSnapshot(snapshotInput)
    : issueVerifiedPackNutritionFactSnapshot(snapshotInput);
  return {
    id: makeQualifiedFoodId(source.kind, source.sourceId, id),
    recordId: id,
    displayName: assertText(input.name, `${field}.name`),
    originalName: assertRawText(input.originalName, `${field}.originalName`),
    originalLanguage: assertSafeId(
      input.originalLanguage,
      `${field}.originalLanguage`,
      "INVALID_FOOD_RECORD",
    ),
    aliases: normalizeAliases(input.aliases, `${field}.aliases`),
    barcodes: normalizeBarcodes(input.barcodes, `${field}.barcodes`),
    basis: nutrition.basis,
    originalBasis: nutrition.originalBasis,
    nutrition,
    source,
    displayOverride: null,
  };
}

function createVerifiedPackCatalogSnapshot(input) {
  const field = "verifiedPack";
  assertExactKeys(
    input,
    [
      "activeRef",
      "contentSha256",
      "licenseId",
      "noticeSha256",
      "packId",
      "packVersion",
      "records",
      "sourceId",
      "sourceKind",
      "sourceVersion",
      "transformVersion",
    ],
    [],
    field,
    "INVALID_INSTALLED_PACK",
  );
  if (!PACK_SOURCE_KINDS.includes(input.sourceKind)) {
    fail(`${field}.sourceKind is unsupported`, "INVALID_PACK_SOURCE_KIND");
  }
  if (!Array.isArray(input.records)) fail(`${field}.records must be an array`, "INVALID_PACK_RECORDS");
  const source = {
    kind: input.sourceKind,
    sourceId: assertSafeId(input.sourceId, `${field}.sourceId`),
    sourceVersion: assertSafeId(input.sourceVersion, `${field}.sourceVersion`),
    packId: assertSafeId(input.packId, `${field}.packId`),
    packVersion: assertSafeId(input.packVersion, `${field}.packVersion`),
    activeRef: assertSafeId(input.activeRef, `${field}.activeRef`, "INVALID_PACK_PROVENANCE"),
    contentSha256: assertHash(input.contentSha256, `${field}.contentSha256`),
    licenseId: assertSafeId(input.licenseId, `${field}.licenseId`, "INVALID_PACK_PROVENANCE"),
    noticeSha256: assertHash(input.noticeSha256, `${field}.noticeSha256`),
    transformVersion: assertSafeId(
      input.transformVersion,
      `${field}.transformVersion`,
      "INVALID_PACK_PROVENANCE",
    ),
  };
  source.storagePartition = `${source.kind}:${source.sourceId}:${source.activeRef}`;
  const records = input.records.map((record, recordIndex) => (
    normalizeFoodRecord(record, source, `${field}.records[${recordIndex}]`)
  ));
  assertUniqueSourceRecords(records, field);
  const snapshot = immutable({
    sourceKind: source.kind,
    sourceId: source.sourceId,
    activeRef: source.activeRef,
    recordCount: records.length,
  });
  VERIFIED_PACK_DATA.set(snapshot, immutable({ source, records }));
  return snapshot;
}

function normalizePack(input, index) {
  const trusted = VERIFIED_PACK_DATA.get(input);
  if (!trusted) {
    fail(
      `installedPacks[${index}] was not issued by the verified pack catalog port`,
      "UNTRUSTED_PACK_SNAPSHOT",
    );
  }
  return trusted;
}

function assertUniqueSourceRecords(records, field) {
  if (new Set(records.map(({ id }) => id)).size !== records.length) {
    fail(`${field} contains duplicate record ids`, "DUPLICATE_FOOD_RECORD_ID");
  }
  const gtins = records.flatMap((record) => record.barcodes.map((gtin) => [gtin, record.id]));
  if (new Set(gtins.map(([gtin]) => gtin)).size !== gtins.length) {
    fail(`${field} maps one GTIN to multiple records`, "AMBIGUOUS_SOURCE_GTIN");
  }
}

function normalizeUserFoods(input) {
  if (!Array.isArray(input)) fail("userFoods must be an array", "INVALID_USER_FOODS");
  const records = input.map((food, index) => {
    const field = `userFoods[${index}]`;
    assertExactKeys(
      food,
      [
        "basis",
        "id",
        "name",
        "nutrients",
        "originalBasis",
        "originalLanguage",
        "originalName",
        "revision",
        "sourceRecordId",
      ],
      ["aliases", "barcodes"],
      field,
      "INVALID_USER_FOOD",
    );
    const source = {
      kind: SOURCE_KINDS.USER,
      sourceId: "local-user",
      sourceVersion: assertSafeId(food.revision, `${field}.revision`, "INVALID_USER_FOOD"),
      packId: null,
      packVersion: null,
      activeRef: null,
      contentSha256: null,
      licenseId: null,
      noticeSha256: null,
      transformVersion: "USER_INPUT_V1",
      storagePartition: "SQLCIPHER_USER_FOOD",
    };
    const { revision: _revision, ...record } = food;
    return normalizeFoodRecord(record, source, field);
  });
  assertUniqueSourceRecords(records, "userFoods");
  return records;
}

function applyDisplayOverrides(records, overrides) {
  if (!Array.isArray(overrides)) fail("displayOverrides must be an array", "INVALID_DISPLAY_OVERRIDES");
  const byId = new Map(records.map((record) => [record.id, record]));
  const seen = new Set();
  for (const [index, override] of overrides.entries()) {
    const field = `displayOverrides[${index}]`;
    assertExactKeys(
      override,
      ["displayName", "id", "targetQualifiedId"],
      ["aliases"],
      field,
      "INVALID_DISPLAY_OVERRIDE",
    );
    const id = assertSafeId(override.id, `${field}.id`, "INVALID_DISPLAY_OVERRIDE");
    if (seen.has(id)) fail("display override id is duplicated", "DUPLICATE_DISPLAY_OVERRIDE");
    seen.add(id);
    const target = byId.get(override.targetQualifiedId);
    if (!target || target.source.kind === SOURCE_KINDS.USER) {
      fail("display override target is missing or not upstream", "INVALID_DISPLAY_OVERRIDE_TARGET");
    }
    const replacement = {
      ...target,
      displayName: assertText(override.displayName, `${field}.displayName`),
      aliases: [...target.aliases, ...normalizeAliases(override.aliases, `${field}.aliases`)],
      displayOverride: {
        id,
        targetQualifiedId: target.id,
        provenance: "SQLCIPHER_USER_OVERRIDE",
      },
    };
    byId.set(target.id, replacement);
  }
  return records.map(({ id }) => byId.get(id));
}

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function publicRecord(record, match = null) {
  return immutable({
    id: record.id,
    recordId: record.recordId,
    displayName: record.displayName,
    originalName: record.originalName,
    originalLanguage: record.originalLanguage,
    aliases: record.aliases,
    barcodes: record.barcodes,
    basis: record.basis,
    originalBasis: record.originalBasis,
    nutrition: record.nutrition,
    source: record.source,
    displayOverride: record.displayOverride,
    match,
  });
}

function createLocalFoodCatalog({ installedPacks = [], userFoods = [], displayOverrides = [] } = {}) {
  if (!Array.isArray(installedPacks)) {
    fail("installedPacks must be an array", "INVALID_INSTALLED_PACKS");
  }
  const packs = installedPacks.map(normalizePack);
  const activeSourceKeys = packs.map(({ source }) => `${source.kind}\u0000${source.sourceId}`);
  const storagePartitions = packs.map(({ source }) => source.storagePartition);
  if (new Set(activeSourceKeys).size !== activeSourceKeys.length
    || new Set(storagePartitions).size !== storagePartitions.length) {
    fail("only one active pack is allowed per source partition", "DUPLICATE_ACTIVE_SOURCE");
  }
  const upstreamRecords = packs.flatMap(({ records }) => records);
  const records = applyDisplayOverrides(
    [...normalizeUserFoods(userFoods), ...upstreamRecords],
    displayOverrides,
  ).map((record) => {
    const fields = [
      ["displayName", searchKey(record.displayName)],
      ["originalName", searchKey(record.originalName)],
      ...record.aliases.map((alias) => ["alias", searchKey(alias.value)]),
    ];
    return immutable({ ...record, searchFields: fields });
  });
  if (new Set(records.map(({ id }) => id)).size !== records.length) {
    fail("catalog contains duplicate qualified ids", "DUPLICATE_QUALIFIED_FOOD_ID");
  }

  const gtinIndex = new Map();
  for (const record of records) {
    for (const gtin of record.barcodes) {
      const candidates = gtinIndex.get(gtin) ?? [];
      candidates.push(record);
      gtinIndex.set(gtin, candidates);
    }
  }
  const sourceSummaries = [
    ...packs.map(({ source, records: packRecords }) => ({ ...source, recordCount: packRecords.length })),
    ...(userFoods.length > 0 ? [{
      kind: SOURCE_KINDS.USER,
      sourceId: "local-user",
      sourceVersion: "PER_RECORD",
      packId: null,
      packVersion: null,
      activeRef: null,
      contentSha256: null,
      licenseId: null,
      noticeSha256: null,
      transformVersion: "USER_INPUT_V1",
      storagePartition: "SQLCIPHER_USER_FOOD",
      recordCount: userFoods.length,
    }] : []),
  ].sort((left, right) => (
    SOURCE_PRIORITY[left.kind] - SOURCE_PRIORITY[right.kind]
      || compareText(left.sourceId, right.sourceId)
  ));
  const catalog = immutable({
    recordCount: records.length,
    sourceSummaries,
    networkPolicy: "FORBIDDEN",
    queryMode: "LOCAL_ONLY",
  });
  CATALOG_DATA.set(catalog, { records, gtinIndex });
  return catalog;
}

function assertCatalog(catalog) {
  const data = CATALOG_DATA.get(catalog);
  if (!data) fail("catalog was not created by createLocalFoodCatalog", "INVALID_LOCAL_CATALOG");
  return data;
}

function sourceOrdered(records) {
  return [...records].sort((left, right) => (
    SOURCE_PRIORITY[left.source.kind] - SOURCE_PRIORITY[right.source.kind]
      || compareText(searchKey(left.displayName), searchKey(right.displayName))
      || compareText(left.id, right.id)
  ));
}

function lookupLocalFoodByGtin(catalog, gtinInput) {
  const { records, gtinIndex } = assertCatalog(catalog);
  const gtin = normalizeGtin(gtinInput);
  const candidates = sourceOrdered(gtinIndex.get(gtin) ?? []);
  if (candidates.length === 0) {
    return immutable({
      status: "NOT_FOUND",
      mode: "LOCAL_EXACT_GTIN",
      gtin,
      catalogEmpty: records.length === 0,
      candidates: [],
      nextAction: { type: "CREATE_USER_FOOD", gtin },
      networkFallback: "FORBIDDEN",
    });
  }
  return immutable({
    status: "MATCHED",
    mode: "LOCAL_EXACT_GTIN",
    gtin,
    catalogEmpty: false,
    candidates: candidates.map((record) => publicRecord(record)),
    nextAction: null,
    networkFallback: "FORBIDDEN",
  });
}

function fieldMatch(fieldValue, query) {
  if (fieldValue === query) return { rank: 0, type: "EXACT" };
  if (fieldValue.startsWith(query)) return { rank: 1, type: "PREFIX" };
  const tokens = fieldValue.split(/[\s/()（）,，·_-]+/).filter(Boolean);
  if (tokens.some((token) => token.startsWith(query))) return { rank: 2, type: "TOKEN_PREFIX" };
  if (fieldValue.includes(query)) return { rank: 3, type: "SUBSTRING" };
  return null;
}

function searchLocalFoods(catalog, { query, limit = 20, sourceKinds = null } = {}) {
  const { records } = assertCatalog(catalog);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    fail("search limit must be between 1 and 50", "INVALID_SEARCH_LIMIT");
  }
  if (typeof query !== "string" || query.trim().length === 0) {
    return immutable({
      status: "EMPTY_QUERY",
      mode: "LOCAL_DETERMINISTIC_SEARCH",
      query: "",
      results: [],
      totalMatches: 0,
      networkFallback: "FORBIDDEN",
    });
  }
  const normalizedQuery = searchKey(query);
  let sourceFilter = null;
  if (sourceKinds !== null) {
    if (!Array.isArray(sourceKinds)
      || sourceKinds.length === 0
      || sourceKinds.some((kind) => !Object.values(SOURCE_KINDS).includes(kind))
      || new Set(sourceKinds).size !== sourceKinds.length) {
      fail("sourceKinds filter is invalid", "INVALID_SOURCE_FILTER");
    }
    sourceFilter = new Set(sourceKinds);
  }
  const matches = records.flatMap((record) => {
    if (sourceFilter && !sourceFilter.has(record.source.kind)) return [];
    const fieldMatches = record.searchFields.flatMap(([field, value]) => {
      const match = fieldMatch(value, normalizedQuery);
      return match ? [{ ...match, field }] : [];
    });
    if (fieldMatches.length === 0) return [];
    fieldMatches.sort((left, right) => left.rank - right.rank || compareText(left.field, right.field));
    return [{ record, match: fieldMatches[0] }];
  });
  matches.sort((left, right) => (
    left.match.rank - right.match.rank
      || SOURCE_PRIORITY[left.record.source.kind] - SOURCE_PRIORITY[right.record.source.kind]
      || compareText(searchKey(left.record.displayName), searchKey(right.record.displayName))
      || compareText(left.record.id, right.record.id)
  ));
  return immutable({
    status: matches.length === 0 ? "NOT_FOUND" : "MATCHED",
    mode: "LOCAL_DETERMINISTIC_SEARCH",
    query: normalizedQuery,
    results: matches.slice(0, limit).map(({ record, match }) => publicRecord(record, match)),
    totalMatches: matches.length,
    networkFallback: "FORBIDDEN",
  });
}

export {
  NUTRIENT_UNITS,
  PACK_NUTRIENT_STATUSES,
  PACK_SOURCE_KINDS,
  SOURCE_KINDS,
  USER_NUTRIENT_STATUSES,
  createNutritionSnapshotTrustContext,
  createVerifiedPackCatalogSnapshot,
  createLocalFoodCatalog,
  lookupLocalFoodByGtin,
  makeQualifiedFoodId,
  normalizeNutritionFactSnapshot,
  searchLocalFoods,
};
