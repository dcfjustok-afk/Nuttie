import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  domainDefinitionFingerprint,
  verifyCompleteLocalDataAccessRead,
} from "./local-data-access-manifest-harness.mjs";
import {
  createInMemoryLocalDataReadTransactionFactory,
  createRegisteredLocalDataAccessRepository,
  localDataDomainRegistryFingerprint,
  normalizeLocalDataDomainRegistry,
} from "./local-data-access-registry-harness.mjs";

const SOURCE_PATH = fileURLToPath(new URL("./local-data-access-registry-harness.mjs", import.meta.url));

function domainDefinition({
  domainId = "diary",
  definitionVersion = "v1",
  position = 0,
  payloadDefinition = { vocabulary: "caller-owned", fields: ["opaque-value"] },
} = {}) {
  return {
    schemaVersion: "LOCAL_DATA_DOMAIN_DEFINITION_V1",
    domainId,
    definitionVersion,
    position,
    dataClass: "USER_BUSINESS_DATA",
    payloadDefinition,
  };
}

function registryEntry(definition, { adapterId = `${definition.domainId}-adapter` } = {}) {
  return {
    schemaVersion: "LOCAL_DATA_DOMAIN_REGISTRY_ENTRY_V1",
    adapterId,
    domainDefinition: definition,
  };
}

function registry(entries = undefined) {
  const diary = domainDefinition();
  const water = domainDefinition({
    domainId: "water",
    position: 1,
    payloadDefinition: { fields: ["opaque-volume"] },
  });
  return {
    schemaVersion: "LOCAL_DATA_DOMAIN_REGISTRY_V1",
    registryId: "nuttie-local-data",
    registryVersion: "registry-v1",
    entries: entries ?? [registryEntry(diary), registryEntry(water)],
  };
}

function record(definition, {
  recordId = "record-1",
  revision = 1,
  payload = { "opaque-value": "value" },
} = {}) {
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

function accessRequest({
  requestId = "access-request-1",
  expectedRepositoryGeneration = 7,
  pageSize = 2,
} = {}) {
  return {
    schemaVersion: "LOCAL_DATA_ACCESS_REQUEST_V1",
    requestId,
    expectedRepositoryGeneration,
    pageSize,
    deliveryMode: "IN_APP_READ_ONLY",
  };
}

function sourceFor(registryInput, { repositoryGeneration = 7 } = {}) {
  const normalized = normalizeLocalDataDomainRegistry(registryInput);
  const definitions = Object.fromEntries(
    normalized.entries.map((entry) => [entry.domainDefinition.domainId, entry.domainDefinition]),
  );
  return {
    repositoryGeneration,
    domainRecords: {
      diary: [record(definitions.diary, { recordId: "meal-1", revision: 3, payload: { food: "opaque" } })],
      water: [record(definitions.water, { recordId: "water-1", payload: { amount: "opaque" } })],
    },
  };
}

function repositoryFixture({ registryInput = registry(), source = undefined, onDomainRead = undefined } = {}) {
  const localSource = source ?? sourceFor(registryInput);
  const transactionFactory = createInMemoryLocalDataReadTransactionFactory({
    repositoryId: "local-repository-1",
    registry: registryInput,
    source: localSource,
    onDomainRead,
  });
  return {
    source: localSource,
    repository: createRegisteredLocalDataAccessRepository({ registry: registryInput, transactionFactory }),
  };
}

async function readAll(repository, descriptor) {
  const pages = [];
  let cursor = null;
  do {
    const page = await repository.readPage({
      schemaVersion: "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1",
      snapshotId: descriptor.snapshotId,
      cursor,
    });
    pages.push(page);
    cursor = page.nextCursor;
  } while (cursor !== null);
  return pages;
}

test("normalizes one caller-owned registry in explicit domain position order", () => {
  const input = registry();
  input.entries.reverse();
  const normalized = normalizeLocalDataDomainRegistry(input);
  assert.deepEqual(normalized.entries.map((entry) => entry.domainDefinition.domainId), ["diary", "water"]);
  assert.deepEqual(normalized.entries.map((entry) => entry.adapterId), ["diary-adapter", "water-adapter"]);
  assert.equal(Object.isFrozen(normalized.entries[0].domainDefinition.payloadDefinition), true);
  for (const field of ["calories", "weight", "target", "timestamp"]) {
    assert.equal(field in normalized.entries[0].domainDefinition.payloadDefinition, false);
  }
  assert.equal(localDataDomainRegistryFingerprint(input), localDataDomainRegistryFingerprint(normalized));
});

test("rejects empty, extended, duplicate, secret, and ambiguous registry entries", () => {
  assert.throws(() => normalizeLocalDataDomainRegistry({ ...registry(), entries: [] }), {
    code: "INVALID_LOCAL_DATA_DOMAIN_REGISTRY",
  });
  assert.throws(() => normalizeLocalDataDomainRegistry({ ...registry(), unapproved: true }), {
    code: "INVALID_LOCAL_DATA_DOMAIN_REGISTRY",
  });
  const base = domainDefinition();
  assert.throws(
    () => normalizeLocalDataDomainRegistry(registry([registryEntry(base), registryEntry({ ...base, position: 1 }, { adapterId: "other" })])),
    { code: "DUPLICATE_LOCAL_DATA_REGISTRY_DOMAIN" },
  );
  assert.throws(
    () => normalizeLocalDataDomainRegistry(registry([registryEntry(base), registryEntry(domainDefinition({ domainId: "water", position: 0 }))])),
    { code: "DUPLICATE_LOCAL_DATA_REGISTRY_POSITION" },
  );
  assert.throws(
    () => normalizeLocalDataDomainRegistry(registry([registryEntry(base), registryEntry(domainDefinition({ domainId: "water", position: 1 }), { adapterId: "diary-adapter" })])),
    { code: "DUPLICATE_LOCAL_DATA_REGISTRY_ADAPTER" },
  );
  assert.throws(
    () => normalizeLocalDataDomainRegistry(registry([registryEntry({ ...base, dataClass: "KEYCHAIN_SECRET" })])),
    { code: "INVALID_LOCAL_DATA_DOMAIN_DEFINITION" },
  );
});

test("requires exactly one source collection for every registered domain", () => {
  const registryInput = registry();
  const source = sourceFor(registryInput);
  delete source.domainRecords.water;
  assert.throws(
    () => createInMemoryLocalDataReadTransactionFactory({
      repositoryId: "repo",
      registry: registryInput,
      source,
    }),
    { code: "LOCAL_DATA_SOURCE_DOMAIN_SET_MISMATCH" },
  );

  const withUnknown = sourceFor(registryInput);
  withUnknown.domainRecords.unknown = [];
  assert.throws(
    () => createInMemoryLocalDataReadTransactionFactory({
      repositoryId: "repo",
      registry: registryInput,
      source: withUnknown,
    }),
    { code: "LOCAL_DATA_SOURCE_DOMAIN_SET_MISMATCH" },
  );
});

test("composes every registry domain into one verifiable read-only snapshot", async () => {
  const { repository } = repositoryFixture();
  const descriptor = await repository.openSnapshot(accessRequest({ pageSize: 1 }));
  const pages = await readAll(repository, descriptor);
  const completion = verifyCompleteLocalDataAccessRead(descriptor, pages);

  assert.equal(descriptor.repositoryGeneration, 7);
  assert.equal(descriptor.deliveryMode, "IN_APP_READ_ONLY");
  assert.deepEqual(descriptor.domainDefinitions.map((definition) => definition.domainId), ["diary", "water"]);
  assert.deepEqual(pages.flatMap((page) => page.records).map((item) => item.domainRef.domainId), ["diary", "water"]);
  assert.equal(completion.complete, true);
  assert.equal(completion.recordCount, 2);
  assert.equal(descriptor.controlBoundary.mutation, "NOT_AUTHORIZED");
  assert.equal(descriptor.controlBoundary.artifactCreation, "NOT_AUTHORIZED");
});

test("preserves registered empty domains in the composed descriptor", async () => {
  const registryInput = registry();
  const source = sourceFor(registryInput);
  source.domainRecords.water = [];
  const { repository } = repositoryFixture({ registryInput, source });
  const descriptor = await repository.openSnapshot(accessRequest());
  assert.deepEqual(
    descriptor.domainSummaries.map(({ domainId, recordCount }) => ({ domainId, recordCount })),
    [
      { domainId: "diary", recordCount: 1 },
      { domainId: "water", recordCount: 0 },
    ],
  );
});

test("a write between adapter reads cannot mix repository generations", async () => {
  const registryInput = registry();
  const source = sourceFor(registryInput);
  const { repository } = repositoryFixture({
    registryInput,
    source,
    onDomainRead({ domainId }) {
      if (domainId === "diary") {
        source.repositoryGeneration = 8;
        source.domainRecords.water.push(
          record(normalizeLocalDataDomainRegistry(registryInput).entries[1].domainDefinition, {
            recordId: "water-after-open",
          }),
        );
      }
    },
  });

  const descriptor = await repository.openSnapshot(accessRequest());
  const pages = await readAll(repository, descriptor);
  assert.equal(descriptor.repositoryGeneration, 7);
  assert.equal(descriptor.recordCount, 2);
  assert.equal(pages.flatMap((page) => page.records).some((item) => item.recordId === "water-after-open"), false);
});

test("rejects a stale expected generation before reading any adapter", async () => {
  let reads = 0;
  const { repository } = repositoryFixture({ onDomainRead() { reads += 1; } });
  await assert.rejects(
    repository.openSnapshot(accessRequest({ expectedRepositoryGeneration: 6 })),
    { code: "STALE_LOCAL_DATA_READ_TRANSACTION_OPEN" },
  );
  assert.equal(reads, 0);
});

test("rejects transaction evidence bound to another registry", async () => {
  const registryInput = registry();
  const transactionFactory = {
    async openReadTransaction(request) {
      return {
        evidence: {
          schemaVersion: "LOCAL_DATA_READ_TRANSACTION_V1",
          transactionId: "tx-1",
          repositoryId: "repo",
          repositoryGeneration: request.expectedRepositoryGeneration,
          registryFingerprint: "0".repeat(64),
          isolation: "CONSISTENT_READ_SNAPSHOT",
          readOnly: true,
        },
        async readDomain() { throw new Error("must not read"); },
        async close() { throw new Error("must not close"); },
      };
    },
  };
  const repository = createRegisteredLocalDataAccessRepository({ registry: registryInput, transactionFactory });
  await assert.rejects(repository.openSnapshot(accessRequest()), {
    code: "LOCAL_DATA_READ_TRANSACTION_MISMATCH",
  });
});

test("rejects an adapter result rebound to another domain", async () => {
  const registryInput = registry();
  const baseFactory = createInMemoryLocalDataReadTransactionFactory({
    repositoryId: "repo",
    registry: registryInput,
    source: sourceFor(registryInput),
  });
  const transactionFactory = {
    async openReadTransaction(request) {
      const transaction = await baseFactory.openReadTransaction(request);
      return {
        evidence: transaction.evidence,
        async readDomain(domainRequest) {
          const result = await transaction.readDomain(domainRequest);
          return domainRequest.domainId === "water" ? { ...result, domainId: "diary" } : result;
        },
        close: transaction.close,
      };
    },
  };
  const repository = createRegisteredLocalDataAccessRepository({ registry: registryInput, transactionFactory });
  await assert.rejects(repository.openSnapshot(accessRequest()), {
    code: "LOCAL_DATA_DOMAIN_READ_BINDING_MISMATCH",
  });
});

test("adapter failure aborts and closes the same transaction", async () => {
  const registryInput = registry();
  let closeRequest = null;
  const normalized = normalizeLocalDataDomainRegistry(registryInput);
  const registryFingerprint = localDataDomainRegistryFingerprint(normalized);
  const transactionFactory = {
    async openReadTransaction() {
      const evidence = {
        schemaVersion: "LOCAL_DATA_READ_TRANSACTION_V1",
        transactionId: "tx-abort",
        repositoryId: "repo",
        repositoryGeneration: 7,
        registryFingerprint,
        isolation: "CONSISTENT_READ_SNAPSHOT",
        readOnly: true,
      };
      return {
        evidence,
        async readDomain(request) {
          if (request.domainId === "water") {
            const error = new Error("adapter read failed");
            error.code = "ADAPTER_READ_FAILED";
            throw error;
          }
          return {
            schemaVersion: "LOCAL_DATA_DOMAIN_READ_RESULT_V1",
            transactionId: evidence.transactionId,
            repositoryId: evidence.repositoryId,
            repositoryGeneration: evidence.repositoryGeneration,
            registryFingerprint,
            adapterId: request.adapterId,
            domainId: request.domainId,
            definitionVersion: request.definitionVersion,
            definitionFingerprint: request.definitionFingerprint,
            records: [],
          };
        },
        async close(request) {
          closeRequest = request;
          return {
            schemaVersion: "LOCAL_DATA_READ_TRANSACTION_CLOSE_RECEIPT_V1",
            transactionId: evidence.transactionId,
            repositoryId: evidence.repositoryId,
            repositoryGeneration: evidence.repositoryGeneration,
            registryFingerprint,
            outcome: request.outcome,
            readDomainIds: request.readDomainIds,
            readSetFingerprint: request.readSetFingerprint,
            closed: true,
          };
        },
      };
    },
  };
  const repository = createRegisteredLocalDataAccessRepository({ registry: registryInput, transactionFactory });
  await assert.rejects(repository.openSnapshot(accessRequest()), { code: "ADAPTER_READ_FAILED" });
  assert.equal(closeRequest.outcome, "ABORTED");
  assert.deepEqual(closeRequest.readDomainIds, ["diary", "water"]);
});

test("malformed adapter records abort before publishing a descriptor", async () => {
  const registryInput = registry();
  const baseFactory = createInMemoryLocalDataReadTransactionFactory({
    repositoryId: "repo",
    registry: registryInput,
    source: sourceFor(registryInput),
  });
  let closeRequest = null;
  const transactionFactory = {
    async openReadTransaction(request) {
      const transaction = await baseFactory.openReadTransaction(request);
      return {
        evidence: transaction.evidence,
        async readDomain(domainRequest) {
          const result = await transaction.readDomain(domainRequest);
          return domainRequest.domainId === "water"
            ? { ...result, records: [{ untrusted: true }] }
            : result;
        },
        async close(requestInput) {
          closeRequest = requestInput;
          return transaction.close(requestInput);
        },
      };
    },
  };
  const repository = createRegisteredLocalDataAccessRepository({ registry: registryInput, transactionFactory });
  await assert.rejects(repository.openSnapshot(accessRequest()), {
    code: "INVALID_LOCAL_DATA_ACCESS_RECORD",
  });
  assert.equal(closeRequest.outcome, "ABORTED");
  assert.deepEqual(closeRequest.readDomainIds, ["diary", "water"]);
});

test("does not publish a descriptor when transaction close evidence is invalid", async () => {
  const registryInput = registry();
  const baseFactory = createInMemoryLocalDataReadTransactionFactory({
    repositoryId: "repo",
    registry: registryInput,
    source: sourceFor(registryInput),
  });
  const transactionFactory = {
    async openReadTransaction(request) {
      const transaction = await baseFactory.openReadTransaction(request);
      return {
        evidence: transaction.evidence,
        readDomain: transaction.readDomain,
        async close(closeRequest) {
          const receipt = await transaction.close(closeRequest);
          return { ...receipt, closed: false };
        },
      };
    },
  };
  const repository = createRegisteredLocalDataAccessRepository({ registry: registryInput, transactionFactory });
  await assert.rejects(repository.openSnapshot(accessRequest()), {
    code: "INVALID_LOCAL_DATA_READ_TRANSACTION_CLOSE_RECEIPT",
  });
  await assert.rejects(
    repository.readPage({
      schemaVersion: "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1",
      snapshotId: "0".repeat(64),
      cursor: null,
    }),
    { code: "UNKNOWN_LOCAL_DATA_ACCESS_SNAPSHOT" },
  );
});

test("opened pages remain bound to immutable transaction content after later source changes", async () => {
  const registryInput = registry();
  const source = sourceFor(registryInput);
  const { repository } = repositoryFixture({ registryInput, source });
  const descriptor = await repository.openSnapshot(accessRequest({ pageSize: 1 }));
  source.repositoryGeneration = 8;
  source.domainRecords.diary[0].payload.food = "changed";
  source.domainRecords.water.length = 0;
  const pages = await readAll(repository, descriptor);
  assert.equal(pages[0].records[0].payload.food, "opaque");
  assert.equal(pages[1].records[0].recordId, "water-1");
  assert.equal(verifyCompleteLocalDataAccessRead(descriptor, pages).complete, true);
});

test("registered repository exposes only the existing read-only manifest API", () => {
  const { repository } = repositoryFixture();
  assert.deepEqual(Object.keys(repository).sort(), ["openSnapshot", "readPage"]);
  for (const method of ["create", "update", "delete", "export", "backup", "share", "beginWrite"]) {
    assert.equal(method in repository, false);
  }
});

test("contract source adds no SQL, filesystem, network, clock, native, or mutation implementation", () => {
  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  for (const forbidden of [
    /node:fs/,
    /node:https/,
    /node:http/,
    /fetch\s*\(/,
    /Date\.now\s*\(/,
    /new Date\s*\(/,
    /sqlite/i,
    /sqlcipher/i,
    /react-native/i,
    /writeFile/,
    /appendFile/,
    /unlink\s*\(/,
    /deleteRecord/,
    /updateRecord/,
  ]) assert.doesNotMatch(source, forbidden);
});
