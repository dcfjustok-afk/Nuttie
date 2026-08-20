import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import {
  BOUNDARY,
  CONTRACT_ID,
  INPUT_SCHEMA_VERSION,
  MATRIX_ROWS,
  PROFILE_IDS,
  PROTOCOL_ID,
  REQUIRED_FIXTURE_SPECS,
  SOURCE_CARD_BLOB_OID,
  SOURCE_CARD_COMMIT,
  SOURCE_CARD_SHA256,
  SOURCE_PACKET_VERSION,
  evaluateD034BenchmarkCorpusManifest,
  normalizeD034BenchmarkCorpusManifest,
  validateD034BenchmarkCorpusManifestResult,
} from "./d034-benchmark-corpus-manifest-harness.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function logicalCountsFor(spec) {
  const counts = [];
  if (spec.directKey) {
    const matrixRow = MATRIX_ROWS.find(({ key }) => key === spec.directKey);
    counts.push({
      key: spec.directKey,
      unit: matrixRow.unit,
      valuesByProfile: matrixRow.values.map((value) => value + spec.offset),
    });
  } else {
    counts.push({ key: "scenario.syntheticUnitCount", unit: "COUNT", valuesByProfile: [1, 1, 1] });
  }
  if (spec.payloadClass === "IMAGE") {
    const jpegRow = MATRIX_ROWS.find(({ key }) => key === "image.jpegQuality");
    counts.push({ key: jpegRow.key, unit: jpegRow.unit, valuesByProfile: [...jpegRow.values] });
  }
  return counts;
}

function fixtureFor(spec) {
  return {
    fixtureId: spec.fixtureId,
    family: spec.family,
    generatorVersion: "GEN-SYNTHETIC-1.0.0",
    profileParameterization: [...PROFILE_IDS],
    payloadClass: spec.payloadClass,
    expectedStage: spec.expectedStage,
    expectedDisposition: spec.expectedDisposition,
    expectedReasonCode: spec.expectedReasonCode,
    exactLogicalCounts: logicalCountsFor(spec),
    artifactSha256: [digest(spec.fixtureId)],
    containsRealUserData: false,
    containsCredential: false,
  };
}

function profileMatrix() {
  return PROFILE_IDS.map((profileId, profileIndex) => ({
    profileId,
    rows: MATRIX_ROWS.map((matrixRow) => ({
      key: matrixRow.key,
      classification: matrixRow.classification,
      unit: matrixRow.unit,
      value: matrixRow.values[profileIndex],
    })),
  }));
}

function completeInput(overrides = {}) {
  return {
    schemaVersion: INPUT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    protocolId: PROTOCOL_ID,
    protocolRevision: "D034-PROTOCOL-R001",
    sourcePacketVersion: SOURCE_PACKET_VERSION,
    sourceCardCommit: SOURCE_CARD_COMMIT,
    sourceCardBlobOid: SOURCE_CARD_BLOB_OID,
    sourceCardSha256: SOURCE_CARD_SHA256,
    corpusRevision: "D034-CORPUS-R001",
    generatedBy: "SYNTHETIC_CONTRACT_FIXTURE",
    generatedAt: "2026-08-21T04:00:00+08:00",
    profileMatrix: profileMatrix(),
    fixtures: REQUIRED_FIXTURE_SPECS.map(fixtureFor),
    containsRealUserData: false,
    containsCredential: false,
    ...overrides,
  };
}

function clone(value) {
  return structuredClone(value);
}

test("locks three profiles, 21 rows, 19 direct limits, two companion controls, and 85 required fixtures", () => {
  assert.equal(PROFILE_IDS.length, 3);
  assert.equal(MATRIX_ROWS.length, 21);
  assert.equal(MATRIX_ROWS.filter(({ classification }) => classification === "DIRECT_HARD_LIMIT").length, 19);
  assert.equal(MATRIX_ROWS.filter(({ classification }) => classification !== "DIRECT_HARD_LIMIT").length, 2);
  assert.equal(REQUIRED_FIXTURE_SPECS.length, 85);
  assert.equal(new Set(REQUIRED_FIXTURE_SPECS.map(({ fixtureId }) => fixtureId)).size, 85);

  const result = evaluateD034BenchmarkCorpusManifest(completeInput());
  assert.equal(result.disposition, "STRUCTURALLY_COMPLETE_MANIFEST_ONLY");
  assert.equal(result.profileCount, 3);
  assert.equal(result.profileMatrixRowCount, 21);
  assert.equal(result.directHardLimitCount, 19);
  assert.equal(result.companionControlCount, 2);
  assert.equal(result.requiredFixtureSlotCount, 85);
  assert.equal(result.fixtureCount, 85);
  assert.equal(result.directLimitFixtureCount, 38);
  assert.deepEqual(result.familyCounts, {
    NORMAL: 8,
    DIRECT_LIMIT: 38,
    IMAGE_ADVERSARIAL: 7,
    STREAM_ADVERSARIAL: 6,
    JSON_ADVERSARIAL: 9,
    LIFECYCLE: 11,
    QUALITY_ACCESSIBILITY: 6,
  });
  assert.deepEqual(result.boundary, BOUNDARY);
  assert.equal(result.blockers.includes("CORPUS_NOT_MATERIALIZED"), true);
  assert.equal(result.blockers.includes("BENCHMARK_EXECUTION_NOT_AUTHORIZED"), true);
  assert.match(result.inputFingerprint, /^[a-f0-9]{64}$/);
  assert.match(result.resultFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.familyCounts), true);
  assert.equal(Object.isFrozen(result.boundary), true);

  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("GEN-SYNTHETIC"), false);
  assert.equal(serialized.includes(digest("normal.meal-image.01")), false);
});

test("rejects profile identity, order, row, classification, unit, value, and field drift", () => {
  const mutations = [
    (input) => { input.profileMatrix.reverse(); },
    (input) => { input.profileMatrix[0].profileId = "balanced_fixed_limits"; },
    (input) => { input.profileMatrix[0].rows.pop(); },
    (input) => { input.profileMatrix[0].rows.reverse(); },
    (input) => { input.profileMatrix[0].rows[0].key = "input.otherBytes"; },
    (input) => { input.profileMatrix[0].rows[0].classification = "COMPANION_CONTROL"; },
    (input) => { input.profileMatrix[0].rows[0].unit = "MB"; },
    (input) => { input.profileMatrix[0].rows[0].value += 1; },
    (input) => { input.profileMatrix[0].rows[0].note = "approximate"; },
  ];
  for (const mutate of mutations) {
    const input = completeInput();
    mutate(input);
    assert.throws(() => evaluateD034BenchmarkCorpusManifest(input), {
      code: "INVALID_D034_BENCHMARK_CORPUS_MANIFEST",
    });
  }
});

test("rejects source identity, revision, generator, timestamp, and top-level field drift", () => {
  const mutations = [
    (input) => { input.schemaVersion = "V2"; },
    (input) => { input.contractId = "OTHER"; },
    (input) => { input.protocolId = "OTHER"; },
    (input) => { input.sourcePacketVersion = "PACKET-002"; },
    (input) => { input.sourceCardCommit = "a".repeat(40); },
    (input) => { input.sourceCardBlobOid = "b".repeat(40); },
    (input) => { input.sourceCardSha256 = "c".repeat(64); },
    (input) => { input.protocolRevision = "R001"; },
    (input) => { input.corpusRevision = "D034-CORPUS-R01"; },
    (input) => { input.generatedBy = "PM"; },
    (input) => { input.generatedAt = "2026-02-30T04:00:00+08:00"; },
    (input) => { input.unapproved = true; },
  ];
  for (const mutate of mutations) {
    const input = completeInput();
    mutate(input);
    assert.throws(() => evaluateD034BenchmarkCorpusManifest(input), {
      code: "INVALID_D034_BENCHMARK_CORPUS_MANIFEST",
    });
  }
});

test("rejects missing, duplicate, renamed, or semantically changed required fixture slots", () => {
  const mutations = [
    (input) => { input.fixtures.pop(); },
    (input) => { input.fixtures[1] = clone(input.fixtures[0]); },
    (input) => { input.fixtures[0].fixtureId = "normal.meal-image.03"; },
    (input) => { input.fixtures[0].family = "LIFECYCLE"; },
    (input) => { input.fixtures[0].payloadClass = "TEXT"; },
    (input) => { input.fixtures[0].expectedStage = "INPUT_PREFLIGHT"; },
    (input) => { input.fixtures[0].expectedDisposition = "OBSERVE_WITHOUT_PASS_CLAIM"; },
    (input) => { input.fixtures[0].expectedReasonCode = "OTHER"; },
    (input) => { input.fixtures[0].profileParameterization.reverse(); },
  ];
  for (const mutate of mutations) {
    const input = completeInput();
    mutate(input);
    assert.throws(() => evaluateD034BenchmarkCorpusManifest(input), {
      code: "INVALID_D034_BENCHMARK_CORPUS_MANIFEST",
    });
  }
});

test("requires all 38 direct-limit boundary and plus-one bindings to match the exact profile values", () => {
  const input = completeInput();
  const boundary = input.fixtures.find(({ fixtureId }) => fixtureId === "direct.input.imageBytes.at-limit");
  const plusOne = input.fixtures.find(({ fixtureId }) => fixtureId === "direct.json.nodeCount.plus-one");
  assert.deepEqual(boundary.exactLogicalCounts[0].valuesByProfile, [16_777_216, 26_214_400, 33_554_432]);
  assert.deepEqual(plusOne.exactLogicalCounts[0].valuesByProfile, [16_385, 32_769, 65_537]);
  assert.equal(evaluateD034BenchmarkCorpusManifest(input).directLimitFixtureCount, 38);

  for (const mutate of [
    (changed) => { changed.fixtures.find(({ fixtureId }) => fixtureId === boundary.fixtureId).exactLogicalCounts[0].valuesByProfile[0] += 1; },
    (changed) => { changed.fixtures.find(({ fixtureId }) => fixtureId === plusOne.fixtureId).exactLogicalCounts[0].unit = "BYTE"; },
    (changed) => { changed.fixtures.find(({ fixtureId }) => fixtureId === plusOne.fixtureId).exactLogicalCounts[0].key = "json.depth"; },
  ]) {
    const changed = completeInput();
    mutate(changed);
    assert.throws(() => evaluateD034BenchmarkCorpusManifest(changed), {
      code: "INVALID_D034_BENCHMARK_CORPUS_MANIFEST",
    });
  }
});

test("requires every image fixture, including extensions, to bind the exact JPEG quality values", () => {
  const input = completeInput();
  const image = input.fixtures.find(({ fixtureId }) => fixtureId === "image.corrupted");
  image.exactLogicalCounts = image.exactLogicalCounts.filter(({ key }) => key !== "image.jpegQuality");
  assert.throws(() => evaluateD034BenchmarkCorpusManifest(input), {
    code: "INVALID_D034_BENCHMARK_CORPUS_MANIFEST",
  });

  const withExtension = completeInput();
  withExtension.fixtures.push({
    fixtureId: "extension.extra-image-boundary",
    family: "IMAGE_ADVERSARIAL",
    generatorVersion: "GEN-SYNTHETIC-1.0.0",
    profileParameterization: [...PROFILE_IDS],
    payloadClass: "IMAGE",
    expectedStage: "IMAGE_ENCODE",
    expectedDisposition: "REJECT_AT_EXPECTED_STAGE",
    expectedReasonCode: "AI_BUDGET_REQUEST_REJECTED",
    exactLogicalCounts: [{ key: "scenario.syntheticUnitCount", unit: "COUNT", valuesByProfile: [1, 1, 1] }],
    artifactSha256: [digest("extension.extra-image-boundary")],
    containsRealUserData: false,
    containsCredential: false,
  });
  assert.throws(() => evaluateD034BenchmarkCorpusManifest(withExtension), {
    code: "INVALID_D034_BENCHMARK_CORPUS_MANIFEST",
  });
});

test("accepts schema-conformant non-image extensions without treating them as required evidence", () => {
  const input = completeInput();
  input.fixtures.push({
    fixtureId: "extension.additional-stream-case",
    family: "STREAM_ADVERSARIAL",
    generatorVersion: "GEN-SYNTHETIC-1.0.0",
    profileParameterization: [...PROFILE_IDS],
    payloadClass: "STREAM",
    expectedStage: "RESPONSE_STREAM",
    expectedDisposition: "REJECT_AT_EXPECTED_STAGE",
    expectedReasonCode: "AI_BUDGET_RESPONSE_ABORTED",
    exactLogicalCounts: [{ key: "scenario.syntheticUnitCount", unit: "COUNT", valuesByProfile: [1, 1, 1] }],
    artifactSha256: [digest("extension.additional-stream-case")],
    containsRealUserData: false,
    containsCredential: false,
  });
  const result = evaluateD034BenchmarkCorpusManifest(input);
  assert.equal(result.fixtureCount, 86);
  assert.equal(result.requiredFixtureSlotCount, 85);
  assert.equal(result.extensionFixtureCount, 1);
  assert.equal(result.familyCounts.STREAM_ADVERSARIAL, 7);
  assert.equal(result.boundary.corpusMaterialized, false);
});

test("rejects invalid logical counts, digests, real user data, and credentials", () => {
  const mutations = [
    (input) => { input.fixtures[0].exactLogicalCounts = []; },
    (input) => { input.fixtures[0].exactLogicalCounts[0].unit = "MB"; },
    (input) => { input.fixtures[0].exactLogicalCounts[0].valuesByProfile = [1, 1]; },
    (input) => { input.fixtures[0].exactLogicalCounts[0].valuesByProfile[0] = -1; },
    (input) => { input.fixtures[0].exactLogicalCounts.push(clone(input.fixtures[0].exactLogicalCounts[0])); },
    (input) => { input.fixtures[0].artifactSha256 = []; },
    (input) => { input.fixtures[0].artifactSha256[0] = "A".repeat(64); },
    (input) => { input.fixtures[0].artifactSha256.push(input.fixtures[0].artifactSha256[0]); },
    (input) => { input.containsRealUserData = true; },
    (input) => { input.fixtures[0].containsCredential = true; },
  ];
  for (const mutate of mutations) {
    const input = completeInput();
    mutate(input);
    assert.throws(
      () => evaluateD034BenchmarkCorpusManifest(input),
      (error) => ["INVALID_D034_BENCHMARK_CORPUS_MANIFEST", "UNSAFE_D034_BENCHMARK_CORPUS_MANIFEST"].includes(error.code),
    );
  }
});

test("rejects sensitive-looking material without echoing it", () => {
  const canaries = [
    "sk-CANARY1234567890",
    "Bearer CANARY1234567890",
    "api_key=CANARY1234567890",
    "person@example.test",
  ];
  for (const canary of canaries) {
    const input = completeInput();
    input.fixtures[0].generatorVersion = canary;
    assert.throws(
      () => evaluateD034BenchmarkCorpusManifest(input),
      (error) => {
        assert.equal(error.code, "UNSAFE_D034_BENCHMARK_CORPUS_MANIFEST");
        assert.equal(error.message.includes(canary), false);
        assert.equal(JSON.stringify(error.details).includes(canary), false);
        return true;
      },
    );
  }
});

test("rejects accessors, hidden fields, symbols, special objects, cycles, deep trees, and oversized resources", () => {
  const accessor = completeInput();
  Object.defineProperty(accessor.fixtures[0], "generatorVersion", { enumerable: true, get: () => "GEN-ACCESSOR" });
  const hidden = completeInput();
  Object.defineProperty(hidden.fixtures[0], "hidden", { enumerable: false, value: "not allowed" });
  const symbol = completeInput();
  symbol.fixtures[0][Symbol("hidden")] = true;
  const special = completeInput();
  special.fixtures[0].artifactSha256 = new Set([digest("special")]);
  const cycle = completeInput();
  cycle.fixtures[0].exactLogicalCounts[0].valuesByProfile[0] = cycle;
  const deep = completeInput();
  deep.extra = { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: true } } } } } } } } } };
  const oversized = completeInput();
  oversized.fixtures[0].generatorVersion = "x".repeat(4_097);
  for (const input of [accessor, hidden, symbol, special, cycle, deep, oversized]) {
    assert.throws(() => evaluateD034BenchmarkCorpusManifest(input), {
      code: "INVALID_D034_BENCHMARK_CORPUS_MANIFEST",
    });
  }
});

test("normalization copies, freezes, and canonicalizes fixture order", () => {
  const first = completeInput();
  const normalized = normalizeD034BenchmarkCorpusManifest(first);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.profileMatrix), true);
  assert.equal(Object.isFrozen(normalized.profileMatrix[0].rows), true);
  assert.equal(Object.isFrozen(normalized.fixtures), true);
  assert.equal(Object.isFrozen(normalized.fixtures[0]), true);
  first.fixtures[0].generatorVersion = "GEN-CHANGED";
  assert.notEqual(normalized.fixtures[0].generatorVersion, "GEN-CHANGED");

  const ordered = completeInput();
  const reversed = completeInput();
  reversed.fixtures.reverse();
  assert.equal(
    evaluateD034BenchmarkCorpusManifest(ordered).inputFingerprint,
    evaluateD034BenchmarkCorpusManifest(reversed).inputFingerprint,
  );
});

test("result validation rejects forged pass, authorization, blockers, counts, and fingerprints", () => {
  const input = completeInput();
  const result = evaluateD034BenchmarkCorpusManifest(input);
  assert.deepEqual(validateD034BenchmarkCorpusManifestResult(result, input), result);
  for (const changed of [
    { ...result, disposition: "BENCHMARK_PASS" },
    { ...result, blockers: [] },
    { ...result, fixtureCount: 86 },
    { ...result, resultFingerprint: "b".repeat(64) },
    { ...result, boundary: { ...result.boundary, corpusMaterialized: true } },
    { ...result, boundary: { ...result.boundary, benchmarkExecutionAuthorized: true } },
    { ...result, boundary: { ...result.boundary, deviceBenchmarkPassed: true } },
  ]) {
    assert.throws(() => validateD034BenchmarkCorpusManifestResult(changed, input), {
      code: "INVALID_D034_BENCHMARK_CORPUS_MANIFEST",
    });
  }
});

test("source performs no filesystem, clock, transport, credential, corpus, device, or business effect", () => {
  const source = fs.readFileSync(new URL("./d034-benchmark-corpus-manifest-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    "node:fs",
    "readFile",
    "writeFile",
    "fetch(",
    "XMLHttpRequest",
    "node:http",
    "node:https",
    "Date.now",
    "child_process",
    "SAVE_DIARY",
    "headers.set",
    "sqlite",
    "sqlcipher",
    "keychain",
  ]) {
    assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
  assert.equal(BOUNDARY.fixtureArtifactReads, 0);
  assert.equal(BOUNDARY.fixtureArtifactWrites, 0);
  assert.equal(BOUNDARY.networkRequests, 0);
  assert.equal(BOUNDARY.providerRequests, 0);
  assert.equal(BOUNDARY.businessWrites, 0);
  assert.equal(BOUNDARY.corpusMaterialized, false);
  assert.equal(BOUNDARY.benchmarkExecutionAuthorized, false);
  assert.equal(BOUNDARY.deviceBenchmarkPassed, false);
  assert.equal(BOUNDARY.formalImplementationAuthorized, false);
});
