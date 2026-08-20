import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const INPUT_SCHEMA_VERSION = "D034_BENCHMARK_CORPUS_MANIFEST_INPUT_V1";
const RESULT_SCHEMA_VERSION = "D034_BENCHMARK_CORPUS_MANIFEST_RESULT_V1";
const BOUNDARY_SCHEMA_VERSION = "D034_BENCHMARK_CORPUS_MANIFEST_BOUNDARY_V1";
const CONTRACT_ID = "D034-BENCHMARK-CORPUS-MANIFEST-CONTRACT-001";
const PROTOCOL_ID = "D034-MINIMUM-IPHONE-BENCHMARK-PROTOCOL-001";
const SOURCE_PACKET_VERSION = "PACKET-001-R1";
const SOURCE_CARD_COMMIT = "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117";
const SOURCE_CARD_BLOB_OID = "3d1d7681b0285d65ea5d64a2176bfab4c5d28c5c";
const SOURCE_CARD_SHA256 = "a8e6b5a992854efb92bd30fe477b7deee090ab152976bdb6cf293179c0ac7bf6";

const PROFILE_IDS = Object.freeze([
  "conservative_fixed_limits",
  "balanced_fixed_limits",
  "provider_profile_with_global_ceiling",
]);

const MATRIX_ROWS = deepFreeze([
  row("input.imageBytes", "DIRECT_HARD_LIMIT", "BYTE", 16_777_216, 26_214_400, 33_554_432),
  row("input.imagePixels", "DIRECT_HARD_LIMIT", "PIXEL", 40_000_000, 60_000_000, 80_000_000),
  row("input.textUtf8Bytes", "DIRECT_HARD_LIMIT", "BYTE", 32_768, 65_536, 131_072),
  row("input.trendEntryCount", "DIRECT_HARD_LIMIT", "COUNT", 128, 256, 512),
  row("image.longestEdgePx", "DIRECT_HARD_LIMIT", "PIXEL", 1_536, 2_048, 2_560),
  row("image.jpegQuality", "EXACT_CONTROL", "NORMALIZED_RATIO", 0.78, 0.82, 0.84),
  row("image.encodedBytes", "DIRECT_HARD_LIMIT", "BYTE", 2_097_152, 4_194_304, 6_291_456),
  row("request.logicalBytes", "DIRECT_HARD_LIMIT", "BYTE", 3_145_728, 6_291_456, 8_388_608),
  row("response.headerBytes", "DIRECT_HARD_LIMIT", "BYTE", 16_384, 32_768, 65_536),
  row("response.decodedBodyBytes", "DIRECT_HARD_LIMIT", "BYTE", 1_048_576, 2_097_152, 4_194_304),
  row("time.totalSeconds", "DIRECT_HARD_LIMIT", "SECOND", 60, 90, 120),
  row("time.idleSeconds", "DIRECT_HARD_LIMIT", "SECOND", 10, 15, 20),
  row("stream.nonEmptyChunkCount", "DIRECT_HARD_LIMIT", "COUNT", 1_024, 2_048, 4_096),
  row("json.depth", "DIRECT_HARD_LIMIT", "COUNT", 24, 32, 32),
  row("json.objectKeyCount", "DIRECT_HARD_LIMIT", "COUNT", 4_096, 10_000, 20_000),
  row("json.arrayElementCount", "DIRECT_HARD_LIMIT", "COUNT", 4_096, 10_000, 20_000),
  row("json.stringUtf8Bytes", "DIRECT_HARD_LIMIT", "BYTE", 65_536, 262_144, 524_288),
  row("json.nodeCount", "DIRECT_HARD_LIMIT", "COUNT", 16_384, 32_768, 65_536),
  row("concurrency.foregroundRequestCount", "DIRECT_HARD_LIMIT", "COUNT", 1, 1, 1),
  row("temp.taskBytes", "DIRECT_HARD_LIMIT", "BYTE", 33_554_432, 67_108_864, 100_663_296),
  row("memory.controlledWorkingBytes", "COMPANION_CONTROL", "BYTE", 100_663_296, 167_772_160, 234_881_024),
]);

const DIRECT_LIMIT_ROWS = Object.freeze(MATRIX_ROWS.filter(({ classification }) => classification === "DIRECT_HARD_LIMIT"));
const MATRIX_ROW_BY_KEY = new Map(MATRIX_ROWS.map((matrixRow) => [matrixRow.key, matrixRow]));

const REQUIRED_FIXTURE_SPECS = deepFreeze([
  ...requiredNormalFixtures(),
  ...requiredDirectLimitFixtures(),
  ...requiredImageFixtures(),
  ...namedFixtureSpecs("STREAM_ADVERSARIAL", "stream", [
    "duplicate-header",
    "compression-expansion",
    "slow-drip",
    "empty-heartbeat",
    "chunk-overflow",
    "declared-length-mismatch",
  ], "STREAM", "RESPONSE_STREAM", "REJECT_AT_EXPECTED_STAGE", "AI_BUDGET_RESPONSE_ABORTED"),
  ...namedFixtureSpecs("JSON_ADVERSARIAL", "json", [
    "invalid-utf8",
    "duplicate-key",
    "dangerous-key",
    "depth-overflow",
    "string-overflow",
    "array-overflow",
    "node-overflow",
    "trailing-data",
    "non-finite-number",
  ], "JSON", "RESPONSE_PARSE", "REJECT_AT_EXPECTED_STAGE", "AI_BUDGET_PARSE_REJECTED"),
  ...namedFixtureSpecs("LIFECYCLE", "lifecycle", [
    "cancel-before-preprocess",
    "cancel-after-preprocess",
    "cancel-before-connect",
    "cancel-during-upload",
    "cancel-during-response",
    "cancel-during-parse",
    "foreground-background",
    "memory-warning",
    "low-disk",
    "repeated-tap",
    "kill-restart",
  ], "LIFECYCLE", "LIFECYCLE_CONTROL", "OBSERVE_WITHOUT_PASS_CLAIM", "LIFECYCLE_OBSERVATION_REQUIRED"),
  ...requiredQualityFixtures(),
]);

const REQUIRED_FIXTURE_BY_ID = new Map(REQUIRED_FIXTURE_SPECS.map((spec) => [spec.fixtureId, spec]));
const FAMILY_IDS = Object.freeze([
  "NORMAL",
  "DIRECT_LIMIT",
  "IMAGE_ADVERSARIAL",
  "STREAM_ADVERSARIAL",
  "JSON_ADVERSARIAL",
  "LIFECYCLE",
  "QUALITY_ACCESSIBILITY",
]);
const PAYLOAD_CLASSES = new Set(["IMAGE", "TEXT", "TREND", "STREAM", "JSON", "LIFECYCLE", "QUALITY_ACCESSIBILITY", "MIXED"]);
const EXPECTED_STAGES = new Set(["INPUT_PREFLIGHT", "IMAGE_PREPROCESS", "IMAGE_ENCODE", "REQUEST_PREFLIGHT", "RESPONSE_STREAM", "RESPONSE_PARSE", "CANDIDATE_BOUNDARY", "LIFECYCLE_CONTROL", "QUALITY_ACCESSIBILITY_REVIEW"]);
const DISPOSITIONS = new Set(["ALLOW_TO_NEXT_CONTROL_ONLY", "REJECT_AT_EXPECTED_STAGE", "OBSERVE_WITHOUT_PASS_CLAIM"]);
const UNITS = new Set(["BYTE", "PIXEL", "COUNT", "SECOND", "NORMALIZED_RATIO"]);

const BOUNDARY = deepFreeze({
  schemaVersion: BOUNDARY_SCHEMA_VERSION,
  contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
  requiredFixtureSlotCount: 85,
  profileCount: 3,
  profileMatrixRowCount: 21,
  directHardLimitCount: 19,
  companionControlCount: 2,
  directLimitFixtureCount: 38,
  fixtureArtifactsCallerAssertedNotVerified: true,
  corpusMaterialized: false,
  fixtureArtifactReads: 0,
  fixtureArtifactWrites: 0,
  containsRealUserDataAllowed: false,
  containsCredentialAllowed: false,
  minimumPhysicalDeviceResolved: false,
  macAndSupportedXcodeAvailable: false,
  isolatedNativeHarnessAuthorized: false,
  benchmarkExecutionAuthorized: false,
  benchmarkExecutionStarted: false,
  deviceBenchmarkPassed: false,
  independentReviewPassed: false,
  ownerReviewAuthorized: false,
  ownerChoiceRecorded: false,
  b05Closed: false,
  networkRequests: 0,
  providerRequests: 0,
  businessWrites: 0,
  formalImplementationAuthorized: false,
});

function row(key, classification, unit, ...values) {
  return { key, classification, unit, values: Object.freeze(values) };
}

function requiredNormalFixtures() {
  const classes = [
    ["meal-image", "IMAGE"],
    ["nutrition-label", "IMAGE"],
    ["plain-text", "TEXT"],
    ["trend-summary", "TREND"],
  ];
  return classes.flatMap(([name, payloadClass]) => ["01", "02"].map((suffix) => ({
    fixtureId: `normal.${name}.${suffix}`,
    family: "NORMAL",
    payloadClass,
    expectedStage: "CANDIDATE_BOUNDARY",
    expectedDisposition: "ALLOW_TO_NEXT_CONTROL_ONLY",
    expectedReasonCode: "WITHIN_BUDGET_EXPECTED",
  })));
}

function directStageAndReason(key) {
  if (key.startsWith("input.") || key === "image.longestEdgePx") {
    return ["INPUT_PREFLIGHT", "AI_BUDGET_INPUT_REJECTED"];
  }
  if (key.startsWith("json.")) return ["RESPONSE_PARSE", "AI_BUDGET_PARSE_REJECTED"];
  if (key.startsWith("response.") || key.startsWith("time.") || key.startsWith("stream.")) {
    return ["RESPONSE_STREAM", "AI_BUDGET_RESPONSE_ABORTED"];
  }
  return ["REQUEST_PREFLIGHT", "AI_BUDGET_REQUEST_REJECTED"];
}

function directPayloadClass(key) {
  if (key.startsWith("image.") || key === "input.imageBytes" || key === "input.imagePixels") return "IMAGE";
  if (key === "input.textUtf8Bytes") return "TEXT";
  if (key === "input.trendEntryCount") return "TREND";
  if (key.startsWith("json.")) return "JSON";
  if (key.startsWith("response.") || key.startsWith("time.") || key.startsWith("stream.")) return "STREAM";
  return "MIXED";
}

function requiredDirectLimitFixtures() {
  return DIRECT_LIMIT_ROWS.flatMap((matrixRow) => {
    const [expectedStage, rejectionReason] = directStageAndReason(matrixRow.key);
    return [
      {
        fixtureId: `direct.${matrixRow.key}.at-limit`,
        family: "DIRECT_LIMIT",
        payloadClass: directPayloadClass(matrixRow.key),
        expectedStage,
        expectedDisposition: "ALLOW_TO_NEXT_CONTROL_ONLY",
        expectedReasonCode: "WITHIN_BUDGET_EXPECTED",
        directKey: matrixRow.key,
        offset: 0,
      },
      {
        fixtureId: `direct.${matrixRow.key}.plus-one`,
        family: "DIRECT_LIMIT",
        payloadClass: directPayloadClass(matrixRow.key),
        expectedStage,
        expectedDisposition: "REJECT_AT_EXPECTED_STAGE",
        expectedReasonCode: rejectionReason,
        directKey: matrixRow.key,
        offset: 1,
      },
    ];
  });
}

function requiredImageFixtures() {
  const preprocessCases = ["corrupted", "animated", "transparent", "pixel-bomb", "invalid-orientation", "frame-overflow"];
  return [
    ...namedFixtureSpecs(
      "IMAGE_ADVERSARIAL",
      "image",
      preprocessCases,
      "IMAGE",
      "IMAGE_PREPROCESS",
      "REJECT_AT_EXPECTED_STAGE",
      "AI_BUDGET_INPUT_REJECTED",
    ),
    {
      fixtureId: "image.encoding-expansion",
      family: "IMAGE_ADVERSARIAL",
      payloadClass: "IMAGE",
      expectedStage: "IMAGE_ENCODE",
      expectedDisposition: "REJECT_AT_EXPECTED_STAGE",
      expectedReasonCode: "AI_BUDGET_REQUEST_REJECTED",
    },
  ];
}

function namedFixtureSpecs(family, prefix, names, payloadClass, expectedStage, expectedDisposition, expectedReasonCode) {
  return names.map((name) => ({
    fixtureId: `${prefix}.${name}`,
    family,
    payloadClass,
    expectedStage,
    expectedDisposition,
    expectedReasonCode,
  }));
}

function requiredQualityFixtures() {
  return ["meal-image", "nutrition-label"].flatMap((subject) => ["normal", "large-text", "voiceover"].map((mode) => ({
    fixtureId: `quality.${subject}.${mode}`,
    family: "QUALITY_ACCESSIBILITY",
    payloadClass: "IMAGE",
    expectedStage: "QUALITY_ACCESSIBILITY_REVIEW",
    expectedDisposition: "OBSERVE_WITHOUT_PASS_CLAIM",
    expectedReasonCode: "QUALITY_ACCESSIBILITY_OBSERVATION_REQUIRED",
  })));
}

function fail(message, code = "INVALID_D034_BENCHMARK_CORPUS_MANIFEST", details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function deepFreeze(value, seen = new Set()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function immutable(value) {
  return deepFreeze(value);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function assertDataTree(value, field = "input", depth = 0, ancestors = new Set(), budget = { nodes: 0 }) {
  budget.nodes += 1;
  if (budget.nodes > 50_000 || depth > 10) fail("input resource boundary exceeded", undefined, { field });
  if (typeof value === "string") {
    if (value.length > 4_096) fail("string resource boundary exceeded", undefined, { field });
    if (
      /sk-[a-z0-9_-]{8,}/i.test(value) ||
      /bearer\s+\S+/i.test(value) ||
      /(?:api[_-]?key|authorization|password|secret)\s*[:=]/i.test(value) ||
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(value)
    ) {
      fail("sensitive-looking material is forbidden", "UNSAFE_D034_BENCHMARK_CORPUS_MANIFEST", { field });
    }
    return;
  }
  if (value === null || ["boolean", "number"].includes(typeof value)) return;
  if (["undefined", "bigint", "function", "symbol"].includes(typeof value)) {
    fail("unsupported input value", undefined, { field });
  }
  if (ancestors.has(value)) fail("cyclic input is forbidden", undefined, { field });
  if (Array.isArray(value)) {
    if (value.length > 512) fail("array resource boundary exceeded", undefined, { field });
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) fail("special objects are forbidden", undefined, { field });
    if (Object.getOwnPropertySymbols(value).length > 0) fail("symbol keys are forbidden", undefined, { field });
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
      if (!descriptor.enumerable) fail("non-enumerable properties are forbidden", undefined, { field });
      if (descriptor.get || descriptor.set) fail("accessor properties are forbidden", undefined, { field });
    }
  }
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) assertDataTree(child, `${field}.${key}`, depth + 1, ancestors, budget);
  ancestors.delete(value);
}

function assertExactKeys(value, expectedKeys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("object required", undefined, { field });
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (!isDeepStrictEqual(actual, expected)) fail("object fields do not match the contract", undefined, { field });
}

function normalizeString(value, field, maxLength = 256) {
  if (typeof value !== "string") fail("string required", undefined, { field });
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) fail("invalid string length", undefined, { field });
  return normalized;
}

function isValidTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    Number(hourText) > 23 ||
    Number(minuteText) > 59 ||
    Number(secondText) > 59 ||
    (offsetHourText !== undefined && (Number(offsetHourText) > 23 || Number(offsetMinuteText) > 59))
  ) return false;
  return Number.isFinite(Date.parse(value));
}

function normalizeProfileMatrix(profileMatrix) {
  if (!Array.isArray(profileMatrix) || profileMatrix.length !== PROFILE_IDS.length) {
    fail("profileMatrix must contain exactly three profiles", undefined, { field: "profileMatrix" });
  }
  return profileMatrix.map((profile, profileIndex) => {
    const field = `profileMatrix[${profileIndex}]`;
    assertExactKeys(profile, ["profileId", "rows"], field);
    if (profile.profileId !== PROFILE_IDS[profileIndex]) fail("profile order or identity changed", undefined, { field: `${field}.profileId` });
    if (!Array.isArray(profile.rows) || profile.rows.length !== MATRIX_ROWS.length) {
      fail("profile rows must contain the complete 21-row matrix", undefined, { field: `${field}.rows` });
    }
    const rows = profile.rows.map((inputRow, rowIndex) => {
      const rowField = `${field}.rows[${rowIndex}]`;
      const expected = MATRIX_ROWS[rowIndex];
      assertExactKeys(inputRow, ["key", "classification", "unit", "value"], rowField);
      if (
        inputRow.key !== expected.key ||
        inputRow.classification !== expected.classification ||
        inputRow.unit !== expected.unit ||
        !Object.is(inputRow.value, expected.values[profileIndex])
      ) {
        fail("profile matrix row changed", undefined, { field: rowField });
      }
      return { key: expected.key, classification: expected.classification, unit: expected.unit, value: expected.values[profileIndex] };
    });
    return { profileId: PROFILE_IDS[profileIndex], rows };
  });
}

function normalizeLogicalCounts(input, field) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 32) {
    fail("exactLogicalCounts must contain 1..32 entries", undefined, { field });
  }
  const seen = new Set();
  return input.map((entry, index) => {
    const entryField = `${field}[${index}]`;
    assertExactKeys(entry, ["key", "unit", "valuesByProfile"], entryField);
    const key = normalizeString(entry.key, `${entryField}.key`, 96);
    if (!/^[a-z][a-zA-Z0-9.-]*$/.test(key) || seen.has(key)) fail("logical count key is invalid or duplicated", undefined, { field: `${entryField}.key` });
    seen.add(key);
    if (!UNITS.has(entry.unit)) fail("logical count unit is unsupported", undefined, { field: `${entryField}.unit` });
    if (!Array.isArray(entry.valuesByProfile) || entry.valuesByProfile.length !== 3) {
      fail("valuesByProfile must contain A/B/C values", undefined, { field: `${entryField}.valuesByProfile` });
    }
    const valuesByProfile = entry.valuesByProfile.map((value, valueIndex) => {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        fail("logical count values must be finite non-negative numbers", undefined, { field: `${entryField}.valuesByProfile[${valueIndex}]` });
      }
      return value;
    });
    return { key, unit: entry.unit, valuesByProfile };
  }).sort((left, right) => left.key.localeCompare(right.key));
}

function assertRequiredLogicalBindings(spec, exactLogicalCounts, field) {
  const byKey = new Map(exactLogicalCounts.map((entry) => [entry.key, entry]));
  if (spec.directKey) {
    const expected = MATRIX_ROW_BY_KEY.get(spec.directKey);
    const actual = byKey.get(spec.directKey);
    const expectedValues = expected.values.map((value) => value + spec.offset);
    if (!actual || actual.unit !== expected.unit || !isDeepStrictEqual(actual.valuesByProfile, expectedValues)) {
      fail("direct-limit logical count does not match the matrix boundary", undefined, { field });
    }
  }
  if (spec.payloadClass === "IMAGE") {
    const expected = MATRIX_ROW_BY_KEY.get("image.jpegQuality");
    const actual = byKey.get("image.jpegQuality");
    if (!actual || actual.unit !== expected.unit || !isDeepStrictEqual(actual.valuesByProfile, expected.values)) {
      fail("image fixture must bind the exact JPEG quality values", undefined, { field });
    }
  }
}

function normalizeFixture(fixture, index) {
  const field = `fixtures[${index}]`;
  assertExactKeys(fixture, [
    "fixtureId",
    "family",
    "generatorVersion",
    "profileParameterization",
    "payloadClass",
    "expectedStage",
    "expectedDisposition",
    "expectedReasonCode",
    "exactLogicalCounts",
    "artifactSha256",
    "containsRealUserData",
    "containsCredential",
  ], field);
  const fixtureId = normalizeString(fixture.fixtureId, `${field}.fixtureId`, 160);
  const requiredSpec = REQUIRED_FIXTURE_BY_ID.get(fixtureId);
  if (!requiredSpec && !/^extension\.[a-z0-9][a-z0-9.-]{0,140}$/.test(fixtureId)) {
    fail("fixtureId is not a required slot or a valid extension", undefined, { field: `${field}.fixtureId` });
  }
  if (!FAMILY_IDS.includes(fixture.family)) fail("fixture family is unsupported", undefined, { field: `${field}.family` });
  const generatorVersion = normalizeString(fixture.generatorVersion, `${field}.generatorVersion`, 64);
  if (!/^GEN-[A-Z0-9.-]+$/.test(generatorVersion)) fail("generatorVersion is malformed", undefined, { field: `${field}.generatorVersion` });
  if (!isDeepStrictEqual(fixture.profileParameterization, PROFILE_IDS)) {
    fail("fixture profileParameterization must bind A/B/C in order", undefined, { field: `${field}.profileParameterization` });
  }
  if (!PAYLOAD_CLASSES.has(fixture.payloadClass)) fail("payloadClass is unsupported", undefined, { field: `${field}.payloadClass` });
  if (!EXPECTED_STAGES.has(fixture.expectedStage)) fail("expectedStage is unsupported", undefined, { field: `${field}.expectedStage` });
  if (!DISPOSITIONS.has(fixture.expectedDisposition)) fail("expectedDisposition is unsupported", undefined, { field: `${field}.expectedDisposition` });
  const expectedReasonCode = normalizeString(fixture.expectedReasonCode, `${field}.expectedReasonCode`, 96);
  if (!/^[A-Z][A-Z0-9_]*$/.test(expectedReasonCode)) fail("expectedReasonCode is malformed", undefined, { field: `${field}.expectedReasonCode` });
  if (requiredSpec) {
    for (const key of ["family", "payloadClass", "expectedStage", "expectedDisposition", "expectedReasonCode"]) {
      if (fixture[key] !== requiredSpec[key]) fail("required fixture semantics changed", undefined, { field: `${field}.${key}` });
    }
  }
  const exactLogicalCounts = normalizeLogicalCounts(fixture.exactLogicalCounts, `${field}.exactLogicalCounts`);
  assertRequiredLogicalBindings(requiredSpec ?? { payloadClass: fixture.payloadClass }, exactLogicalCounts, `${field}.exactLogicalCounts`);
  if (!Array.isArray(fixture.artifactSha256) || fixture.artifactSha256.length < 1 || fixture.artifactSha256.length > 16) {
    fail("artifactSha256 must contain 1..16 digests", undefined, { field: `${field}.artifactSha256` });
  }
  const artifactSha256 = fixture.artifactSha256.map((digest, digestIndex) => {
    if (typeof digest !== "string" || !/^[a-f0-9]{64}$/.test(digest)) fail("artifact digest is malformed", undefined, { field: `${field}.artifactSha256[${digestIndex}]` });
    return digest;
  });
  if (new Set(artifactSha256).size !== artifactSha256.length) fail("artifact digests must be unique per fixture", undefined, { field: `${field}.artifactSha256` });
  if (fixture.containsRealUserData !== false || fixture.containsCredential !== false) {
    fail("real user data and credentials are forbidden", "UNSAFE_D034_BENCHMARK_CORPUS_MANIFEST", { field });
  }
  return {
    fixtureId,
    family: fixture.family,
    generatorVersion,
    profileParameterization: [...PROFILE_IDS],
    payloadClass: fixture.payloadClass,
    expectedStage: fixture.expectedStage,
    expectedDisposition: fixture.expectedDisposition,
    expectedReasonCode,
    exactLogicalCounts,
    artifactSha256,
    containsRealUserData: false,
    containsCredential: false,
  };
}

function normalizeD034BenchmarkCorpusManifest(input) {
  assertDataTree(input);
  assertExactKeys(input, [
    "schemaVersion",
    "contractId",
    "protocolId",
    "protocolRevision",
    "sourcePacketVersion",
    "sourceCardCommit",
    "sourceCardBlobOid",
    "sourceCardSha256",
    "corpusRevision",
    "generatedBy",
    "generatedAt",
    "profileMatrix",
    "fixtures",
    "containsRealUserData",
    "containsCredential",
  ], "input");
  const exactIdentity = {
    schemaVersion: INPUT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    protocolId: PROTOCOL_ID,
    sourcePacketVersion: SOURCE_PACKET_VERSION,
    sourceCardCommit: SOURCE_CARD_COMMIT,
    sourceCardBlobOid: SOURCE_CARD_BLOB_OID,
    sourceCardSha256: SOURCE_CARD_SHA256,
  };
  for (const [key, expected] of Object.entries(exactIdentity)) {
    if (input[key] !== expected) fail("source identity changed", undefined, { field: key });
  }
  const protocolRevision = normalizeString(input.protocolRevision, "protocolRevision", 32);
  if (!/^D034-PROTOCOL-R\d{3}$/.test(protocolRevision)) fail("protocolRevision is malformed", undefined, { field: "protocolRevision" });
  const corpusRevision = normalizeString(input.corpusRevision, "corpusRevision", 32);
  if (!/^D034-CORPUS-R\d{3}$/.test(corpusRevision)) fail("corpusRevision is malformed", undefined, { field: "corpusRevision" });
  if (!["AUTHORIZED_CORPUS_BUILDER", "SYNTHETIC_CONTRACT_FIXTURE"].includes(input.generatedBy)) {
    fail("generatedBy is unsupported", undefined, { field: "generatedBy" });
  }
  if (typeof input.generatedAt !== "string" || !isValidTimestamp(input.generatedAt)) {
    fail("generatedAt must be an RFC 3339 timestamp", undefined, { field: "generatedAt" });
  }
  if (input.containsRealUserData !== false || input.containsCredential !== false) {
    fail("real user data and credentials are forbidden", "UNSAFE_D034_BENCHMARK_CORPUS_MANIFEST", { field: "input" });
  }
  const profileMatrix = normalizeProfileMatrix(input.profileMatrix);
  if (!Array.isArray(input.fixtures) || input.fixtures.length < REQUIRED_FIXTURE_SPECS.length || input.fixtures.length > 256) {
    fail("fixtures must include all required slots and stay within the resource limit", undefined, { field: "fixtures" });
  }
  const fixtures = input.fixtures.map(normalizeFixture);
  const fixtureIds = fixtures.map(({ fixtureId }) => fixtureId);
  if (new Set(fixtureIds).size !== fixtureIds.length) fail("fixtureId values must be unique", undefined, { field: "fixtures" });
  for (const required of REQUIRED_FIXTURE_SPECS) {
    if (!fixtureIds.includes(required.fixtureId)) fail("required fixture slot is missing", undefined, { field: "fixtures" });
  }
  fixtures.sort((left, right) => left.fixtureId.localeCompare(right.fixtureId));
  return immutable({
    ...exactIdentity,
    protocolRevision,
    corpusRevision,
    generatedBy: input.generatedBy,
    generatedAt: input.generatedAt,
    profileMatrix,
    fixtures,
    containsRealUserData: false,
    containsCredential: false,
  });
}

function evaluateD034BenchmarkCorpusManifest(input) {
  const normalized = normalizeD034BenchmarkCorpusManifest(input);
  const familyCounts = Object.fromEntries(FAMILY_IDS.map((family) => [
    family,
    normalized.fixtures.filter((fixture) => fixture.family === family).length,
  ]));
  const artifactDigestCount = normalized.fixtures.reduce((count, fixture) => count + fixture.artifactSha256.length, 0);
  const core = immutable({
    schemaVersion: RESULT_SCHEMA_VERSION,
    contractId: CONTRACT_ID,
    protocolId: PROTOCOL_ID,
    disposition: "STRUCTURALLY_COMPLETE_MANIFEST_ONLY",
    profileCount: PROFILE_IDS.length,
    profileMatrixRowCount: MATRIX_ROWS.length,
    directHardLimitCount: DIRECT_LIMIT_ROWS.length,
    companionControlCount: MATRIX_ROWS.length - DIRECT_LIMIT_ROWS.length,
    requiredFixtureSlotCount: REQUIRED_FIXTURE_SPECS.length,
    fixtureCount: normalized.fixtures.length,
    extensionFixtureCount: normalized.fixtures.length - REQUIRED_FIXTURE_SPECS.length,
    directLimitFixtureCount: familyCounts.DIRECT_LIMIT,
    artifactDigestCount,
    familyCounts: immutable(familyCounts),
    blockers: immutable([
      "FIXTURE_ARTIFACTS_CALLER_ASSERTED_NOT_VERIFIED",
      "CORPUS_NOT_MATERIALIZED",
      "BENCHMARK_EXECUTION_NOT_AUTHORIZED",
      "MINIMUM_DEVICE_UNRESOLVED",
      "MAC_XCODE_UNAVAILABLE",
      "INDEPENDENT_REVIEW_REQUIRED",
    ]),
    inputFingerprint: fingerprint(normalized),
    boundary: BOUNDARY,
  });
  return immutable({ ...core, resultFingerprint: fingerprint(core) });
}

function validateD034BenchmarkCorpusManifestResult(result, input) {
  assertDataTree(result, "result");
  const expected = evaluateD034BenchmarkCorpusManifest(input);
  if (!isDeepStrictEqual(result, expected)) fail("D-034 manifest result or fingerprint was changed");
  return expected;
}

export {
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
};
