import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import {
  createInMemoryLocalDataAccessRepository,
  domainDefinitionFingerprint,
  normalizeDomainDefinition,
} from "./local-data-access-manifest-harness.mjs";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_REGISTRY_ENTRIES = 256;

function fail(message, code, details = {}) {
  const error = new Error(message);
  Object.assign(error, { code, ...details });
  throw error;
}

function assertPlainRecord(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${field} must be a plain record`, code, { field });
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${field} must be a plain record`, code, { field });
  }
  return value;
}

function assertExactKeys(value, required, optional, field, code) {
  assertPlainRecord(value, field, code);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || ["__proto__", "prototype", "constructor"].includes(key)) {
      fail(`${field} contains an unsupported field`, code, { field: `${field}.${key}` });
    }
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) {
      fail(`${field}.${key} is required`, code, { field: `${field}.${key}` });
    }
  }
}

function clone(value, seen = new Map()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const result = Array.isArray(value) ? [] : {};
  seen.set(value, result);
  for (const [key, child] of Object.entries(value)) result[key] = clone(child, seen);
  return result;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  Object.values(value).forEach((child) => deepFreeze(child, seen));
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(clone(value));
}

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function identifier(value, field, code) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    fail(`${field} is invalid`, code, { field });
  }
  return value;
}

function unsignedInteger(value, field, code) {
  if (!Number.isSafeInteger(value) || value < 0) fail(`${field} is invalid`, code, { field });
  return value;
}

function sameArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizeLocalDataDomainRegistry(input, field = "registry") {
  assertExactKeys(
    input,
    ["schemaVersion", "registryId", "registryVersion", "entries"],
    [],
    field,
    "INVALID_LOCAL_DATA_DOMAIN_REGISTRY",
  );
  if (input.schemaVersion !== "LOCAL_DATA_DOMAIN_REGISTRY_V1") {
    fail(`${field}.schemaVersion is unsupported`, "INVALID_LOCAL_DATA_DOMAIN_REGISTRY", {
      field: `${field}.schemaVersion`,
    });
  }
  if (!Array.isArray(input.entries) || input.entries.length === 0 || input.entries.length > MAX_REGISTRY_ENTRIES) {
    fail(`${field}.entries must be a non-empty bounded array`, "INVALID_LOCAL_DATA_DOMAIN_REGISTRY", {
      field: `${field}.entries`,
    });
  }

  const entries = input.entries.map((entry, index) => {
    const entryField = `${field}.entries[${index}]`;
    assertExactKeys(
      entry,
      ["schemaVersion", "adapterId", "domainDefinition"],
      [],
      entryField,
      "INVALID_LOCAL_DATA_DOMAIN_REGISTRY_ENTRY",
    );
    if (entry.schemaVersion !== "LOCAL_DATA_DOMAIN_REGISTRY_ENTRY_V1") {
      fail(`${entryField}.schemaVersion is unsupported`, "INVALID_LOCAL_DATA_DOMAIN_REGISTRY_ENTRY", {
        field: `${entryField}.schemaVersion`,
      });
    }
    return immutable({
      schemaVersion: "LOCAL_DATA_DOMAIN_REGISTRY_ENTRY_V1",
      adapterId: identifier(
        entry.adapterId,
        `${entryField}.adapterId`,
        "INVALID_LOCAL_DATA_DOMAIN_REGISTRY_ENTRY",
      ),
      domainDefinition: normalizeDomainDefinition(entry.domainDefinition, `${entryField}.domainDefinition`),
    });
  });

  const domainIds = new Set();
  const positions = new Set();
  const adapterIds = new Set();
  for (const entry of entries) {
    const { domainId, position } = entry.domainDefinition;
    if (domainIds.has(domainId)) {
      fail("registry domain IDs must be unique", "DUPLICATE_LOCAL_DATA_REGISTRY_DOMAIN", { domainId });
    }
    if (positions.has(position)) {
      fail("registry domain positions must be unique", "DUPLICATE_LOCAL_DATA_REGISTRY_POSITION", { position });
    }
    if (adapterIds.has(entry.adapterId)) {
      fail("registry adapter IDs must be unique", "DUPLICATE_LOCAL_DATA_REGISTRY_ADAPTER", {
        adapterId: entry.adapterId,
      });
    }
    domainIds.add(domainId);
    positions.add(position);
    adapterIds.add(entry.adapterId);
  }

  return immutable({
    schemaVersion: "LOCAL_DATA_DOMAIN_REGISTRY_V1",
    registryId: identifier(input.registryId, `${field}.registryId`, "INVALID_LOCAL_DATA_DOMAIN_REGISTRY"),
    registryVersion: identifier(
      input.registryVersion,
      `${field}.registryVersion`,
      "INVALID_LOCAL_DATA_DOMAIN_REGISTRY",
    ),
    entries: entries.sort(
      (left, right) => left.domainDefinition.position - right.domainDefinition.position,
    ),
  });
}

function localDataDomainRegistryFingerprint(input) {
  return fingerprint(normalizeLocalDataDomainRegistry(input));
}

function normalizeAccessRequest(input, field = "request") {
  assertExactKeys(
    input,
    ["schemaVersion", "requestId", "expectedRepositoryGeneration", "pageSize", "deliveryMode"],
    [],
    field,
    "INVALID_LOCAL_DATA_ACCESS_REQUEST",
  );
  if (input.schemaVersion !== "LOCAL_DATA_ACCESS_REQUEST_V1" || input.deliveryMode !== "IN_APP_READ_ONLY") {
    fail(`${field} version or delivery mode is unsupported`, "INVALID_LOCAL_DATA_ACCESS_REQUEST", { field });
  }
  const pageSize = unsignedInteger(input.pageSize, `${field}.pageSize`, "INVALID_LOCAL_DATA_ACCESS_REQUEST");
  if (pageSize < 1 || pageSize > 256) {
    fail(`${field}.pageSize is invalid`, "INVALID_LOCAL_DATA_ACCESS_REQUEST", {
      field: `${field}.pageSize`,
    });
  }
  return immutable({
    schemaVersion: "LOCAL_DATA_ACCESS_REQUEST_V1",
    requestId: identifier(input.requestId, `${field}.requestId`, "INVALID_LOCAL_DATA_ACCESS_REQUEST"),
    expectedRepositoryGeneration: unsignedInteger(
      input.expectedRepositoryGeneration,
      `${field}.expectedRepositoryGeneration`,
      "INVALID_LOCAL_DATA_ACCESS_REQUEST",
    ),
    pageSize,
    deliveryMode: "IN_APP_READ_ONLY",
  });
}

function validateTransactionEvidence(input, expected, field = "transaction.evidence") {
  assertExactKeys(
    input,
    [
      "schemaVersion",
      "transactionId",
      "repositoryId",
      "repositoryGeneration",
      "registryFingerprint",
      "isolation",
      "readOnly",
    ],
    [],
    field,
    "INVALID_LOCAL_DATA_READ_TRANSACTION",
  );
  const evidence = immutable({
    schemaVersion: input.schemaVersion,
    transactionId: identifier(
      input.transactionId,
      `${field}.transactionId`,
      "INVALID_LOCAL_DATA_READ_TRANSACTION",
    ),
    repositoryId: identifier(
      input.repositoryId,
      `${field}.repositoryId`,
      "INVALID_LOCAL_DATA_READ_TRANSACTION",
    ),
    repositoryGeneration: unsignedInteger(
      input.repositoryGeneration,
      `${field}.repositoryGeneration`,
      "INVALID_LOCAL_DATA_READ_TRANSACTION",
    ),
    registryFingerprint: input.registryFingerprint,
    isolation: input.isolation,
    readOnly: input.readOnly,
  });
  if (
    evidence.schemaVersion !== "LOCAL_DATA_READ_TRANSACTION_V1" ||
    evidence.repositoryGeneration !== expected.repositoryGeneration ||
    evidence.registryFingerprint !== expected.registryFingerprint ||
    evidence.isolation !== "CONSISTENT_READ_SNAPSHOT" ||
    evidence.readOnly !== true ||
    !SHA256.test(evidence.registryFingerprint)
  ) {
    fail("read transaction is not bound to the requested generation and registry", "LOCAL_DATA_READ_TRANSACTION_MISMATCH", {
      expected,
      actual: evidence,
    });
  }
  return evidence;
}

function buildDomainReadRequest(evidence, registryFingerprint, entry) {
  const definition = entry.domainDefinition;
  return immutable({
    schemaVersion: "LOCAL_DATA_DOMAIN_READ_REQUEST_V1",
    transactionId: evidence.transactionId,
    repositoryId: evidence.repositoryId,
    repositoryGeneration: evidence.repositoryGeneration,
    registryFingerprint,
    adapterId: entry.adapterId,
    domainId: definition.domainId,
    definitionVersion: definition.definitionVersion,
    definitionFingerprint: domainDefinitionFingerprint(definition),
  });
}

function validateDomainReadResult(input, request, field = "domainReadResult") {
  assertExactKeys(
    input,
    [
      "schemaVersion",
      "transactionId",
      "repositoryId",
      "repositoryGeneration",
      "registryFingerprint",
      "adapterId",
      "domainId",
      "definitionVersion",
      "definitionFingerprint",
      "records",
    ],
    [],
    field,
    "INVALID_LOCAL_DATA_DOMAIN_READ_RESULT",
  );
  if (!Array.isArray(input.records)) {
    fail(`${field}.records must be an array`, "INVALID_LOCAL_DATA_DOMAIN_READ_RESULT", {
      field: `${field}.records`,
    });
  }
  for (const key of [
    "transactionId",
    "repositoryId",
    "repositoryGeneration",
    "registryFingerprint",
    "adapterId",
    "domainId",
    "definitionVersion",
    "definitionFingerprint",
  ]) {
    if (input[key] !== request[key]) {
      fail(`${field}.${key} is not bound to its request`, "LOCAL_DATA_DOMAIN_READ_BINDING_MISMATCH", {
        field: `${field}.${key}`,
        expected: request[key],
        actual: input[key],
      });
    }
  }
  if (input.schemaVersion !== "LOCAL_DATA_DOMAIN_READ_RESULT_V1") {
    fail(`${field}.schemaVersion is unsupported`, "INVALID_LOCAL_DATA_DOMAIN_READ_RESULT", {
      field: `${field}.schemaVersion`,
    });
  }
  return immutable(input);
}

function validateCloseReceipt(input, request, evidence, field = "closeReceipt") {
  assertExactKeys(
    input,
    [
      "schemaVersion",
      "transactionId",
      "repositoryId",
      "repositoryGeneration",
      "registryFingerprint",
      "outcome",
      "readDomainIds",
      "readSetFingerprint",
      "closed",
    ],
    [],
    field,
    "INVALID_LOCAL_DATA_READ_TRANSACTION_CLOSE_RECEIPT",
  );
  if (
    input.schemaVersion !== "LOCAL_DATA_READ_TRANSACTION_CLOSE_RECEIPT_V1" ||
    input.transactionId !== evidence.transactionId ||
    input.repositoryId !== evidence.repositoryId ||
    input.repositoryGeneration !== evidence.repositoryGeneration ||
    input.registryFingerprint !== evidence.registryFingerprint ||
    input.outcome !== request.outcome ||
    !isDeepStrictEqual(input.readDomainIds, request.readDomainIds) ||
    input.readSetFingerprint !== request.readSetFingerprint ||
    input.closed !== true
  ) {
    fail("read transaction close receipt is invalid", "INVALID_LOCAL_DATA_READ_TRANSACTION_CLOSE_RECEIPT", {
      expected: request,
      actual: input,
    });
  }
  return immutable(input);
}

function createRegisteredLocalDataAccessRepository({ registry: registryInput, transactionFactory } = {}) {
  const registry = normalizeLocalDataDomainRegistry(registryInput);
  const registryFingerprint = fingerprint(registry);
  if (!transactionFactory || typeof transactionFactory.openReadTransaction !== "function") {
    fail("transactionFactory.openReadTransaction is required", "INVALID_LOCAL_DATA_READ_TRANSACTION_FACTORY");
  }
  const snapshots = new Map();

  return Object.freeze({
    async openSnapshot(requestInput) {
      const request = normalizeAccessRequest(requestInput);
      const openRequest = immutable({
        schemaVersion: "LOCAL_DATA_READ_TRANSACTION_OPEN_V1",
        expectedRepositoryGeneration: request.expectedRepositoryGeneration,
        registryFingerprint,
      });
      const transaction = await transactionFactory.openReadTransaction(openRequest);
      if (
        !transaction ||
        typeof transaction !== "object" ||
        typeof transaction.readDomain !== "function" ||
        typeof transaction.close !== "function"
      ) {
        fail("transaction factory returned an invalid port", "INVALID_LOCAL_DATA_READ_TRANSACTION");
      }
      const evidence = validateTransactionEvidence(transaction.evidence, {
        repositoryGeneration: request.expectedRepositoryGeneration,
        registryFingerprint,
      });
      const readDomainIds = [];
      const records = [];
      let primaryError = null;
      let completed = false;

      try {
        for (const [index, entry] of registry.entries.entries()) {
          const domainRequest = buildDomainReadRequest(evidence, registryFingerprint, entry);
          readDomainIds.push(entry.domainDefinition.domainId);
          const result = validateDomainReadResult(
            await transaction.readDomain(domainRequest),
            domainRequest,
            `domainReadResults[${index}]`,
          );
          createInMemoryLocalDataAccessRepository({
            repositoryId: evidence.repositoryId,
            repositoryGeneration: evidence.repositoryGeneration,
            domainDefinitions: [entry.domainDefinition],
            records: result.records,
          });
          records.push(...result.records);
        }
        completed = true;
      } catch (error) {
        primaryError = error;
      }

      const closeCore = immutable({
        schemaVersion: "LOCAL_DATA_READ_TRANSACTION_CLOSE_V1",
        transactionId: evidence.transactionId,
        outcome: completed ? "COMPLETED" : "ABORTED",
        registryFingerprint,
        readDomainIds,
      });
      const closeRequest = immutable({ ...closeCore, readSetFingerprint: fingerprint(closeCore.readDomainIds) });
      try {
        validateCloseReceipt(await transaction.close(closeRequest), closeRequest, evidence);
      } catch (error) {
        if (primaryError !== null && error.cause === undefined) error.cause = primaryError;
        if (error.code === undefined) error.code = "LOCAL_DATA_READ_TRANSACTION_CLOSE_FAILED";
        throw error;
      }
      if (primaryError !== null) throw primaryError;

      const backingRepository = createInMemoryLocalDataAccessRepository({
        repositoryId: evidence.repositoryId,
        repositoryGeneration: evidence.repositoryGeneration,
        domainDefinitions: registry.entries.map((entry) => entry.domainDefinition),
        records,
      });
      const descriptor = await backingRepository.openSnapshot(request);
      snapshots.set(descriptor.snapshotId, backingRepository);
      return descriptor;
    },

    async readPage(requestInput) {
      assertExactKeys(
        requestInput,
        ["schemaVersion", "snapshotId", "cursor"],
        [],
        "pageRequest",
        "INVALID_LOCAL_DATA_ACCESS_PAGE_REQUEST",
      );
      const snapshotId = requestInput.snapshotId;
      if (requestInput.schemaVersion !== "LOCAL_DATA_ACCESS_PAGE_REQUEST_V1" || typeof snapshotId !== "string" || !SHA256.test(snapshotId)) {
        fail("page request is invalid", "INVALID_LOCAL_DATA_ACCESS_PAGE_REQUEST");
      }
      const backingRepository = snapshots.get(snapshotId);
      if (!backingRepository) {
        fail("snapshot is unknown to this registered repository", "UNKNOWN_LOCAL_DATA_ACCESS_SNAPSHOT", {
          snapshotId,
        });
      }
      return backingRepository.readPage(requestInput);
    },
  });
}

function validateFactorySource(source, registry) {
  assertExactKeys(
    source,
    ["repositoryGeneration", "domainRecords"],
    [],
    "source",
    "INVALID_IN_MEMORY_LOCAL_DATA_SOURCE",
  );
  const repositoryGeneration = unsignedInteger(
    source.repositoryGeneration,
    "source.repositoryGeneration",
    "INVALID_IN_MEMORY_LOCAL_DATA_SOURCE",
  );
  assertPlainRecord(source.domainRecords, "source.domainRecords", "INVALID_IN_MEMORY_LOCAL_DATA_SOURCE");
  const expectedDomainIds = registry.entries.map((entry) => entry.domainDefinition.domainId).sort();
  const actualDomainIds = Object.keys(source.domainRecords).sort();
  if (!sameArray(actualDomainIds, expectedDomainIds)) {
    fail("source must provide exactly one record collection for every registry domain", "LOCAL_DATA_SOURCE_DOMAIN_SET_MISMATCH", {
      expected: expectedDomainIds,
      actual: actualDomainIds,
    });
  }
  for (const domainId of expectedDomainIds) {
    if (!Array.isArray(source.domainRecords[domainId])) {
      fail("each source domain must provide a record array", "INVALID_IN_MEMORY_LOCAL_DATA_SOURCE", {
        field: `source.domainRecords.${domainId}`,
      });
    }
  }
  return { repositoryGeneration, domainRecords: clone(source.domainRecords) };
}

function createInMemoryLocalDataReadTransactionFactory({
  repositoryId,
  registry: registryInput,
  source,
  onDomainRead = undefined,
} = {}) {
  const normalizedRepositoryId = identifier(
    repositoryId,
    "repositoryId",
    "INVALID_IN_MEMORY_LOCAL_DATA_SOURCE",
  );
  const registry = normalizeLocalDataDomainRegistry(registryInput);
  const registryFingerprint = fingerprint(registry);
  if (onDomainRead !== undefined && typeof onDomainRead !== "function") {
    fail("onDomainRead must be a function", "INVALID_IN_MEMORY_LOCAL_DATA_SOURCE", {
      field: "onDomainRead",
    });
  }
  validateFactorySource(source, registry);
  let nextTransactionId = 1;

  return Object.freeze({
    async openReadTransaction(request) {
      assertExactKeys(
        request,
        ["schemaVersion", "expectedRepositoryGeneration", "registryFingerprint"],
        [],
        "openRequest",
        "INVALID_LOCAL_DATA_READ_TRANSACTION_OPEN_REQUEST",
      );
      const snapshot = validateFactorySource(source, registry);
      if (
        request.schemaVersion !== "LOCAL_DATA_READ_TRANSACTION_OPEN_V1" ||
        request.registryFingerprint !== registryFingerprint ||
        request.expectedRepositoryGeneration !== snapshot.repositoryGeneration
      ) {
        fail("transaction open request is stale or bound to another registry", "STALE_LOCAL_DATA_READ_TRANSACTION_OPEN", {
          expectedGeneration: snapshot.repositoryGeneration,
          actualGeneration: request.expectedRepositoryGeneration,
        });
      }
      const evidence = immutable({
        schemaVersion: "LOCAL_DATA_READ_TRANSACTION_V1",
        transactionId: `read-tx-${nextTransactionId}`,
        repositoryId: normalizedRepositoryId,
        repositoryGeneration: snapshot.repositoryGeneration,
        registryFingerprint,
        isolation: "CONSISTENT_READ_SNAPSHOT",
        readOnly: true,
      });
      nextTransactionId += 1;
      const readDomainIds = [];
      let closed = false;

      return Object.freeze({
        evidence,
        async readDomain(requestInput) {
          if (closed) fail("read transaction is closed", "LOCAL_DATA_READ_TRANSACTION_CLOSED");
          assertExactKeys(
            requestInput,
            [
              "schemaVersion",
              "transactionId",
              "repositoryId",
              "repositoryGeneration",
              "registryFingerprint",
              "adapterId",
              "domainId",
              "definitionVersion",
              "definitionFingerprint",
            ],
            [],
            "domainReadRequest",
            "INVALID_LOCAL_DATA_DOMAIN_READ_REQUEST",
          );
          const entry = registry.entries.find(
            (candidate) => candidate.domainDefinition.domainId === requestInput.domainId,
          );
          const expected = entry === undefined
            ? null
            : buildDomainReadRequest(evidence, registryFingerprint, entry);
          if (
            requestInput.schemaVersion !== "LOCAL_DATA_DOMAIN_READ_REQUEST_V1" ||
            expected === null ||
            !isDeepStrictEqual(requestInput, expected)
          ) {
            fail("domain read request is not bound to this transaction and registry", "LOCAL_DATA_DOMAIN_READ_REQUEST_MISMATCH");
          }
          if (readDomainIds.includes(requestInput.domainId)) {
            fail("a registry domain may be read only once per transaction", "DUPLICATE_LOCAL_DATA_DOMAIN_READ", {
              domainId: requestInput.domainId,
            });
          }
          readDomainIds.push(requestInput.domainId);
          if (onDomainRead !== undefined) {
            await onDomainRead({ domainId: requestInput.domainId, readIndex: readDomainIds.length - 1, source });
          }
          return immutable({
            schemaVersion: "LOCAL_DATA_DOMAIN_READ_RESULT_V1",
            transactionId: evidence.transactionId,
            repositoryId: evidence.repositoryId,
            repositoryGeneration: evidence.repositoryGeneration,
            registryFingerprint,
            adapterId: entry.adapterId,
            domainId: entry.domainDefinition.domainId,
            definitionVersion: entry.domainDefinition.definitionVersion,
            definitionFingerprint: domainDefinitionFingerprint(entry.domainDefinition),
            records: snapshot.domainRecords[requestInput.domainId],
          });
        },
        async close(requestInput) {
          if (closed) fail("read transaction is already closed", "LOCAL_DATA_READ_TRANSACTION_CLOSED");
          assertExactKeys(
            requestInput,
            [
              "schemaVersion",
              "transactionId",
              "outcome",
              "registryFingerprint",
              "readDomainIds",
              "readSetFingerprint",
            ],
            [],
            "closeRequest",
            "INVALID_LOCAL_DATA_READ_TRANSACTION_CLOSE_REQUEST",
          );
          const expectedReadDomainIds = requestInput.outcome === "COMPLETED"
            ? registry.entries.map((entry) => entry.domainDefinition.domainId)
            : readDomainIds;
          if (
            requestInput.schemaVersion !== "LOCAL_DATA_READ_TRANSACTION_CLOSE_V1" ||
            requestInput.transactionId !== evidence.transactionId ||
            !["COMPLETED", "ABORTED"].includes(requestInput.outcome) ||
            requestInput.registryFingerprint !== registryFingerprint ||
            !isDeepStrictEqual(requestInput.readDomainIds, expectedReadDomainIds) ||
            requestInput.readSetFingerprint !== fingerprint(requestInput.readDomainIds)
          ) {
            fail("read transaction close request is invalid", "INVALID_LOCAL_DATA_READ_TRANSACTION_CLOSE_REQUEST");
          }
          closed = true;
          return immutable({
            schemaVersion: "LOCAL_DATA_READ_TRANSACTION_CLOSE_RECEIPT_V1",
            transactionId: evidence.transactionId,
            repositoryId: evidence.repositoryId,
            repositoryGeneration: evidence.repositoryGeneration,
            registryFingerprint,
            outcome: requestInput.outcome,
            readDomainIds: requestInput.readDomainIds,
            readSetFingerprint: requestInput.readSetFingerprint,
            closed: true,
          });
        },
      });
    },
  });
}

export {
  createInMemoryLocalDataReadTransactionFactory,
  createRegisteredLocalDataAccessRepository,
  localDataDomainRegistryFingerprint,
  normalizeLocalDataDomainRegistry,
};
