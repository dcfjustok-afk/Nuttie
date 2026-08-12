import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CONTROL_BOUNDARY,
  createInMemoryLocalDataAccessRepository,
  domainDefinitionFingerprint,
  normalizeDomainDefinition,
  validateLocalDataAccessDescriptor,
  validateLocalDataAccessPage,
  verifyCompleteLocalDataAccessRead,
} from "./local-data-access-manifest-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./local-data-access-manifest-harness.mjs", import.meta.url));

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function domain({ domainId = "diary", definitionVersion = "v1", position = 0, payloadDefinition = { vocabulary: "caller-owned", fields: ["opaque-value"] } } = {}) {
  return {
    schemaVersion: "LOCAL_DATA_DOMAIN_DEFINITION_V1",
    domainId,
    definitionVersion,
    position,
    dataClass: "USER_BUSINESS_DATA",
    payloadDefinition,
  };
}

function record(definition, { recordId = "record-1", revision = 1, payload = { "opaque-value": "value" } } = {}) {
  return {
    schemaVersion: "LOCAL_DATA_ACCESS_RECORD_V1",
    domainRef: {
      domainId: definition.domainId,
      definitionVersion: definition.definitionVersion,
      definitionFingerprint: domainDefinitionFingerprint(definition),
    },
    recordId,
    revision,
    payload,
  };
}

function request({ requestId = "access-request-1", expectedRepositoryGeneration = 7, pageSize = 2, deliveryMode = "IN_APP_READ_ONLY" } = {}) {
  return {
    schemaVersion: "LOCAL_DATA_ACCESS_REQUEST_V1",
    requestId,
    expectedRepositoryGeneration,
    pageSize,
    deliveryMode,
  };
}

async function fixture({ definitions, records, repositoryId = "local-repository-1", repositoryGeneration = 7, pageSize = 2, requestId = "access-request-1" } = {}) {
  const diary = domain();
  const water = domain({ domainId: "water", position: 1, payloadDefinition: { fields: ["opaque-volume"] } });
  const domainDefinitions = definitions ?? [diary, water];
  const localRecords = records ?? [
    record(diary, { recordId: "meal-b", revision: 3, payload: { food: "opaque-b" } }),
    record(water, { recordId: "water-a", payload: { amount: "opaque-a" } }),
    record(diary, { recordId: "meal-a", revision: 2, payload: { food: "opaque-a" } }),
  ];
  const repository = createInMemoryLocalDataAccessRepository({ repositoryId, repositoryGeneration, domainDefinitions, records: localRecords });
  const descriptor = await repository.openSnapshot(request({ requestId, expectedRepositoryGeneration: repositoryGeneration, pageSize }));
  return { repository, descriptor, diary, water };
}

async function readAll(repository, descriptor) {
  const pages = [];
  let cursor = null;
  do {
    const page = await repository.readPage({ schemaVersion: "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1", snapshotId: descriptor.snapshotId, cursor });
    pages.push(page);
    cursor = page.nextCursor;
  } while (cursor !== null);
  return pages;
}

test("preserves caller-supplied versioned domain definitions without inventing product fields", () => {
  const source = domain({ payloadDefinition: { nested: { arbitrary: [true, null, 3] } } });
  const normalized = normalizeDomainDefinition(source);
  assert.deepEqual(normalized, source);
  assert.equal(Object.isFrozen(normalized), true);
  for (const field of ["name", "calories", "weight", "water", "timestamp"]) assert.equal(field in normalized.payloadDefinition, false);
});

test("rejects secret data classes, unsafe JSON, cycles, special objects, and resource abuse", () => {
  assert.throws(() => normalizeDomainDefinition({ ...domain(), dataClass: "KEYCHAIN_SECRET" }), { code: "INVALID_LOCAL_DATA_DOMAIN_DEFINITION" });
  const unsafe = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => normalizeDomainDefinition(domain({ payloadDefinition: unsafe })), { code: "INVALID_LOCAL_DATA_ACCESS_DOCUMENT" });
  const cycle = {};
  cycle.self = cycle;
  assert.throws(() => normalizeDomainDefinition(domain({ payloadDefinition: cycle })), { code: "INVALID_LOCAL_DATA_ACCESS_DOCUMENT" });
  assert.throws(() => normalizeDomainDefinition(domain({ payloadDefinition: { date: new Date() } })), { code: "INVALID_LOCAL_DATA_ACCESS_DOCUMENT" });
  assert.throws(() => normalizeDomainDefinition(domain({ payloadDefinition: { number: Number.NaN } })), { code: "INVALID_LOCAL_DATA_ACCESS_DOCUMENT" });
  assert.throws(() => normalizeDomainDefinition(domain({ payloadDefinition: { text: "x".repeat(16385) } })), { code: "LOCAL_DATA_ACCESS_DOCUMENT_TOO_LARGE" });
});

test("opens an immutable app-only snapshot with fixed non-export and non-mutation boundaries", async () => {
  const { descriptor } = await fixture();
  assert.deepEqual(descriptor.controlBoundary, CONTROL_BOUNDARY);
  assert.equal(descriptor.deliveryMode, "IN_APP_READ_ONLY");
  assert.equal(descriptor.controlBoundary.keychainSecretValues, "EXCLUDED_NEVER_RETURNED");
  assert.equal(descriptor.controlBoundary.nativeContainerInventory, "REQUIRES_NATIVE_ADAPTER");
  assert.equal(descriptor.controlBoundary.externalFilesCopies, "OUT_OF_SCOPE_USER_CONTROLLED");
  assert.equal(descriptor.controlBoundary.artifactCreation, "NOT_AUTHORIZED");
  assert.equal(descriptor.controlBoundary.mutation, "NOT_AUTHORIZED");
  assert.equal(Object.isFrozen(descriptor), true);
  assert.deepEqual(validateLocalDataAccessDescriptor(structuredClone(descriptor)), descriptor);
});

test("retains empty domains in the manifest instead of hiding zero-record scope", async () => {
  const { descriptor } = await fixture({ records: [] });
  assert.equal(descriptor.recordCount, 0);
  assert.equal(descriptor.pageCount, 1);
  assert.deepEqual(descriptor.domainSummaries.map(({ domainId, recordCount }) => ({ domainId, recordCount })), [
    { domainId: "diary", recordCount: 0 },
    { domainId: "water", recordCount: 0 },
  ]);
});

test("canonicalizes domains by explicit position and records by domain then record ID", async () => {
  const first = await fixture();
  const second = await fixture({
    definitions: [first.water, first.diary],
    records: [
      record(first.diary, { recordId: "meal-a", revision: 2, payload: { food: "opaque-a" } }),
      record(first.diary, { recordId: "meal-b", revision: 3, payload: { food: "opaque-b" } }),
      record(first.water, { recordId: "water-a", payload: { amount: "opaque-a" } }),
    ],
  });
  assert.equal(first.descriptor.definitionsFingerprint, second.descriptor.definitionsFingerprint);
  assert.equal(first.descriptor.recordsFingerprint, second.descriptor.recordsFingerprint);
  assert.deepEqual(second.descriptor.domainDefinitions.map(({ domainId }) => domainId), ["diary", "water"]);
  const pages = await readAll(second.repository, second.descriptor);
  assert.deepEqual(pages.flatMap(({ records }) => records.map((item) => `${item.domainRef.domainId}/${item.recordId}`)), ["diary/meal-a", "diary/meal-b", "water/water-a"]);
});

test("rejects duplicate domains, positions, record identities, and unknown domains", () => {
  const diary = domain();
  const conflicting = domain({ domainId: "water", position: 0 });
  assert.throws(() => createInMemoryLocalDataAccessRepository({ repositoryId: "repo", domainDefinitions: [diary, diary] }), { code: "DUPLICATE_LOCAL_DATA_DOMAIN" });
  assert.throws(() => createInMemoryLocalDataAccessRepository({ repositoryId: "repo", domainDefinitions: [diary, conflicting] }), { code: "DUPLICATE_LOCAL_DATA_DOMAIN_POSITION" });
  assert.throws(() => createInMemoryLocalDataAccessRepository({ repositoryId: "repo", domainDefinitions: [diary], records: [record(diary), record(diary)] }), { code: "DUPLICATE_LOCAL_DATA_ACCESS_RECORD" });
  const missing = domain({ domainId: "missing" });
  assert.throws(() => createInMemoryLocalDataAccessRepository({ repositoryId: "repo", domainDefinitions: [diary], records: [record(missing)] }), { code: "UNKNOWN_LOCAL_DATA_DOMAIN" });
});

test("rejects a record whose version or fingerprint does not bind the exact domain definition", () => {
  const diary = domain();
  const staleVersion = record(diary);
  staleVersion.domainRef.definitionVersion = "v0";
  const staleFingerprint = record(diary);
  staleFingerprint.domainRef.definitionFingerprint = "0".repeat(64);
  assert.throws(() => createInMemoryLocalDataAccessRepository({ repositoryId: "repo", domainDefinitions: [diary], records: [staleVersion] }), { code: "LOCAL_DATA_DOMAIN_BINDING_MISMATCH" });
  assert.throws(() => createInMemoryLocalDataAccessRepository({ repositoryId: "repo", domainDefinitions: [diary], records: [staleFingerprint] }), { code: "LOCAL_DATA_DOMAIN_BINDING_MISMATCH" });
});

test("requires an explicit current generation and fails closed on stale access requests", async () => {
  const { repository } = await fixture();
  await assert.rejects(() => repository.openSnapshot(request({ expectedRepositoryGeneration: 6 })), { code: "STALE_LOCAL_DATA_ACCESS_GENERATION" });
});

test("permits only explicit in-app read-only delivery and bounded non-default pagination", async () => {
  const { repository } = await fixture();
  await assert.rejects(() => repository.openSnapshot(request({ deliveryMode: "JSON_FILE" })), { code: "INVALID_LOCAL_DATA_ACCESS_REQUEST" });
  await assert.rejects(() => repository.openSnapshot(request({ pageSize: 0 })), { code: "INVALID_LOCAL_DATA_ACCESS_VALUE" });
  await assert.rejects(() => repository.openSnapshot(request({ pageSize: 257 })), { code: "INVALID_LOCAL_DATA_ACCESS_VALUE" });
  await assert.rejects(() => repository.openSnapshot({ ...request(), outputPath: "external.json" }), { code: "INVALID_LOCAL_DATA_ACCESS_REQUEST" });
});

test("reads every record once through stable cursor-bound pages", async () => {
  const { repository, descriptor } = await fixture({ pageSize: 2 });
  const pages = await readAll(repository, descriptor);
  assert.equal(pages.length, 2);
  assert.deepEqual(pages.map(({ startOffset, endOffsetExclusive }) => [startOffset, endOffsetExclusive]), [[0, 2], [2, 3]]);
  assert.equal(pages[0].cursorUsed, null);
  assert.deepEqual(pages[1].cursorUsed, pages[0].nextCursor);
  assert.equal(pages[1].nextCursor, null);
  pages.forEach((page) => assert.deepEqual(validateLocalDataAccessPage(structuredClone(page), descriptor), page));
  const completion = verifyCompleteLocalDataAccessRead(descriptor, pages);
  assert.equal(completion.complete, true);
  assert.equal(completion.recordCount, 3);
  assert.equal(completion.recordsFingerprint, descriptor.recordsFingerprint);
});

test("returns one verifiable empty page for an empty snapshot", async () => {
  const { repository, descriptor } = await fixture({ records: [], pageSize: 7 });
  const pages = await readAll(repository, descriptor);
  assert.equal(pages.length, 1);
  assert.deepEqual(pages[0].records, []);
  assert.equal(pages[0].startOffset, 0);
  assert.equal(pages[0].endOffsetExclusive, 0);
  assert.equal(verifyCompleteLocalDataAccessRead(descriptor, pages).complete, true);
});

test("page cursors bind snapshot, descriptor, offset, and page size", async () => {
  const first = await fixture({ requestId: "first", pageSize: 2 });
  const second = await fixture({ requestId: "second", pageSize: 1 });
  const firstPage = (await readAll(first.repository, first.descriptor))[0];
  await assert.rejects(() => second.repository.readPage({ schemaVersion: "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1", snapshotId: second.descriptor.snapshotId, cursor: firstPage.nextCursor }), { code: "INVALID_LOCAL_DATA_ACCESS_CURSOR" });
  const forged = structuredClone(firstPage.nextCursor);
  forged.offset = 1;
  await assert.rejects(() => first.repository.readPage({ schemaVersion: "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1", snapshotId: first.descriptor.snapshotId, cursor: forged }), { code: "INVALID_LOCAL_DATA_ACCESS_CURSOR" });
});

test("rejects unknown snapshots and extra page-request capability fields", async () => {
  const { repository, descriptor } = await fixture();
  await assert.rejects(() => repository.readPage({ schemaVersion: "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1", snapshotId: "0".repeat(64), cursor: null }), { code: "UNKNOWN_LOCAL_DATA_ACCESS_SNAPSHOT" });
  await assert.rejects(() => repository.readPage({ schemaVersion: "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1", snapshotId: descriptor.snapshotId, cursor: null, deleteAfterRead: true }), { code: "INVALID_LOCAL_DATA_ACCESS_PAGE_REQUEST" });
});

test("detects descriptor counts, domain summaries, definitions, boundaries, and snapshot ID tampering", async () => {
  const { descriptor } = await fixture();
  const mutations = [
    (value) => { value.recordCount += 1; },
    (value) => { value.domainSummaries[0].recordCount += 1; },
    (value) => { value.domainDefinitions[0].payloadDefinition.changed = true; },
    (value) => { value.controlBoundary.externalFilesCopies = "INCLUDED"; },
    (value) => { value.snapshotId = "0".repeat(64); },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(descriptor);
    mutate(changed);
    assert.throws(() => validateLocalDataAccessDescriptor(changed), { code: "INVALID_LOCAL_DATA_ACCESS_SNAPSHOT" });
  }
});

test("detects record payload, range, cursor, next-cursor, and page fingerprint tampering", async () => {
  const { repository, descriptor } = await fixture();
  const firstPage = (await readAll(repository, descriptor))[0];
  const mutations = [
    (value) => { value.records[0].payload.changed = true; },
    (value) => { value.endOffsetExclusive += 1; },
    (value) => { value.cursorUsed = value.nextCursor; },
    (value) => { value.nextCursor.offset = 1; },
    (value) => { value.pageFingerprint = "0".repeat(64); },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(firstPage);
    mutate(changed);
    assert.throws(() => validateLocalDataAccessPage(changed, descriptor), { code: "INVALID_LOCAL_DATA_ACCESS_PAGE" });
  }

  const shortPage = structuredClone(firstPage);
  shortPage.records = shortPage.records.slice(0, 1);
  shortPage.endOffsetExclusive = 1;
  shortPage.recordsFingerprint = fingerprint(shortPage.records);
  const cursorCore = {
    schemaVersion: "LOCAL_DATA_ACCESS_CURSOR_V1",
    snapshotId: descriptor.snapshotId,
    descriptorFingerprint: fingerprint(descriptor),
    offset: 1,
    pageSize: descriptor.pageSize,
  };
  shortPage.nextCursor = { ...cursorCore, cursorFingerprint: fingerprint(cursorCore) };
  const { pageFingerprint: ignored, ...pageCore } = shortPage;
  shortPage.pageFingerprint = fingerprint(pageCore);
  assert.throws(() => validateLocalDataAccessPage(shortPage, descriptor), { code: "INVALID_LOCAL_DATA_ACCESS_PAGE" });
});

test("completion rejects missing, duplicated, reversed, and mixed pages", async () => {
  const first = await fixture({ requestId: "first", pageSize: 1 });
  const second = await fixture({ requestId: "second", pageSize: 1 });
  const pages = await readAll(first.repository, first.descriptor);
  const otherPages = await readAll(second.repository, second.descriptor);
  assert.throws(() => verifyCompleteLocalDataAccessRead(first.descriptor, pages.slice(0, -1)), { code: "INCOMPLETE_LOCAL_DATA_ACCESS_READ" });
  assert.throws(() => verifyCompleteLocalDataAccessRead(first.descriptor, [pages[0], pages[0], pages[2]]), { code: "INCOMPLETE_LOCAL_DATA_ACCESS_READ" });
  assert.throws(() => verifyCompleteLocalDataAccessRead(first.descriptor, [...pages].reverse()), { code: "INCOMPLETE_LOCAL_DATA_ACCESS_READ" });
  assert.throws(() => verifyCompleteLocalDataAccessRead(first.descriptor, [pages[0], otherPages[1], pages[2]]), { code: "INVALID_LOCAL_DATA_ACCESS_PAGE" });
});

test("returned values are deep copies and cannot mutate repository snapshot content", async () => {
  const diary = domain();
  const inputPayload = { nested: { value: "original" } };
  const repository = createInMemoryLocalDataAccessRepository({ repositoryId: "repo", repositoryGeneration: 1, domainDefinitions: [diary], records: [record(diary, { payload: inputPayload })] });
  inputPayload.nested.value = "changed-after-construction";
  const descriptor = await repository.openSnapshot(request({ expectedRepositoryGeneration: 1, pageSize: 1 }));
  const page = await repository.readPage({ schemaVersion: "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1", snapshotId: descriptor.snapshotId, cursor: null });
  assert.equal(page.records[0].payload.nested.value, "original");
  assert.equal(Object.isFrozen(page.records[0].payload.nested), true);
});

test("contract source exposes no filesystem, network, clock, account, export, or mutation implementation", () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  for (const forbidden of [
    /node:fs/,
    /node:https/,
    /node:http/,
    /fetch\s*\(/,
    /Date\.now\s*\(/,
    /writeFile/,
    /appendFile/,
    /unlink\s*\(/,
    /rm\s*\(/,
    /JSON_FILE/,
    /CSV_FILE/,
    /accountId/,
    /authToken/,
    /deleteRecord/,
    /updateRecord/,
  ]) assert.doesNotMatch(source, forbidden);
});

test("the public API contains read and validation capabilities only", async () => {
  const { repository } = await fixture();
  assert.deepEqual(Object.keys(repository).sort(), ["openSnapshot", "readPage"]);
  for (const method of ["create", "update", "delete", "export", "writeFile", "share"]) assert.equal(method in repository, false);
});
