import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

import { PROFILE_IDS } from "./d034-benchmark-corpus-manifest-harness.mjs";
import {
  BOUNDARY,
  CONTRACT_ID,
  INPUT_SCHEMA_VERSION,
  METRIC_IDS,
  RESULT_SCHEMA_VERSION,
  ROTATIONS,
  RUN_RECORD_SCHEMA_VERSION,
  STAGE_IDS,
  computeD034BenchmarkReportSha256,
  computeD034BenchmarkRunDiagnosticFingerprint,
  computeD034BenchmarkRunIdentityFingerprint,
  evaluateD034BenchmarkRunReport,
  normalizeD034BenchmarkRunReport,
  validateD034BenchmarkRunReportResult,
} from "./d034-benchmark-run-report-harness.mjs";

const FIXTURE_ID = "synthetic.allowed.01";
const FIXTURE_DIGEST = digest("synthetic fixture bytes");

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function clone(value) {
  return structuredClone(value);
}

function distribution(values) {
  if (values.length === 0) return { sampleCount: 0, minimum: null, median: null, p95: null, maximum: null };
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return {
    sampleCount: sorted.length,
    minimum: sorted[0],
    median: sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    p95: sorted[Math.ceil(0.95 * sorted.length) - 1],
    maximum: sorted.at(-1),
  };
}

function stageRecords(startedMonotonicNs) {
  return STAGE_IDS.map((stageId, index) => ({
    stageId,
    entered: true,
    startedMonotonicNs: startedMonotonicNs + index * 20,
    endedMonotonicNs: startedMonotonicNs + index * 20 + 10,
    inputBytes: index,
    outputBytes: index + 1,
    structureCount: index + 2,
    terminalState: "SUCCEEDED",
    reasonCode: "STAGE_SUCCEEDED",
  }));
}

function metricsFor(profileId, unsafe = false) {
  const profileOffset = PROFILE_IDS.indexOf(profileId);
  return {
    cpuTimeNs: 100 + profileOffset,
    controlledWorkingBytesPeak: 1_000 + profileOffset,
    processHighWaterMarkBytes: 2_000 + profileOffset,
    idleBaselineDeltaBytes: 300 + profileOffset,
    temporaryDiskPeakBytes: 400 + profileOffset,
    foregroundRequestCountPeak: 1,
    databaseWriteCount: unsafe ? 1 : 0,
    residualObjectCount: 0,
    crashCount: 0,
    jetsamCount: 0,
    watchdogCount: 0,
    hangCount: 0,
    unexplainedMemoryPeakCount: 0,
    secretOrBodyLogFindingCount: 0,
  };
}

function identityInput({ identityUnknown = false } = {}) {
  return {
    schemaVersion: INPUT_SCHEMA_VERSION,
    reportId: "D034-REPORT-R001",
    protocolIdentity: {
      protocolId: "D034-MINIMUM-IPHONE-BENCHMARK-PROTOCOL-001",
      protocolRevision: "D034-PROTOCOL-R001",
      sourcePacketVersion: "PACKET-001-R1",
      sourceCardCommit: "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117",
      sourceCardBlobOid: "3d1d7681b0285d65ea5d64a2176bfab4c5d28c5c",
      sourceCardSha256: "a8e6b5a992854efb92bd30fe477b7deee090ab152976bdb6cf293179c0ac7bf6",
    },
    manifestIdentity: {
      contractId: "D034-BENCHMARK-CORPUS-MANIFEST-CONTRACT-001",
      corpusRevision: "D034-CORPUS-R001",
      manifestSha256: digest("manifest"),
      manifestInputFingerprint: digest("manifest input"),
      manifestResultFingerprint: digest("manifest result"),
      fixtureCount: 1,
      requiredFixtureSlotCountCovered: 1,
      requiredFixtureSlotsComplete: false,
      sourceKind: "SYNTHETIC_CONTRACT_FIXTURE",
      fixtures: [{
        fixtureId: FIXTURE_ID,
        artifactSha256: [FIXTURE_DIGEST],
        expectedOutcome: "ALLOW",
        expectedReasonCode: "WITHIN_BUDGET_EXPECTED",
        qualityAccessibilityRequired: true,
      }],
    },
    deviceIdentity: {
      modelIdentifier: identityUnknown ? "UNKNOWN" : "iPhone15,4",
      capacityBytes: identityUnknown ? "UNKNOWN" : 128_000_000_000,
      iosVersion: identityUnknown ? "UNKNOWN" : "26.5",
      iosBuild: identityUnknown ? "UNKNOWN" : "23F79",
      availableStorageBytes: identityUnknown ? "UNKNOWN" : 64_000_000_000,
      maximumBatteryCapacityPercent: identityUnknown ? "UNKNOWN" : 95,
      powerState: identityUnknown ? "UNKNOWN" : "EXTERNAL_POWER",
      repairState: identityUnknown ? "UNKNOWN" : "NO_KNOWN_REPAIR",
      minimumDeviceResolutionRef: identityUnknown ? "UNKNOWN" : "OI03-MINIMUM-DEVICE-R001",
    },
    environmentIdentity: {
      macModelIdentifier: identityUnknown ? "UNKNOWN" : "Mac15,6",
      macosVersion: identityUnknown ? "UNKNOWN" : "26.0",
      xcodeVersion: identityUnknown ? "UNKNOWN" : "18.0",
      iosSdkVersion: identityUnknown ? "UNKNOWN" : "26.0",
      measurementToolVersion: identityUnknown ? "UNKNOWN" : "XCTMETRIC-1.0.0",
      networkMode: identityUnknown ? "UNKNOWN" : "OFFLINE",
      locale: identityUnknown ? "UNKNOWN" : "zh_CN",
      language: identityUnknown ? "UNKNOWN" : "zh-Hans",
      lowPowerModeEnabled: identityUnknown ? "UNKNOWN" : false,
      initialThermalState: identityUnknown ? "UNKNOWN" : "NOMINAL",
      bootSessionId: identityUnknown ? "UNKNOWN" : "BOOT-SYNTHETIC-001",
    },
    harnessIdentity: {
      harnessCommit: identityUnknown ? "UNKNOWN" : "1".repeat(40),
      buildConfiguration: identityUnknown ? "UNKNOWN" : "RELEASE",
      signingClass: identityUnknown ? "UNKNOWN" : "DEVELOPMENT",
      bundleIdentifier: identityUnknown ? "UNKNOWN" : "app.nuttie.benchmark.synthetic",
      dependencyLockSha256: identityUnknown ? "UNKNOWN" : digest("lock"),
      compilerSettingsSha256: identityUnknown ? "UNKNOWN" : digest("compiler"),
      artifactSha256: identityUnknown ? "UNKNOWN" : digest("harness"),
      harnessType: identityUnknown ? "UNKNOWN" : "ISOLATED_BENCHMARK_HARNESS",
    },
    executionAuthorizationRef: identityUnknown ? "UNKNOWN" : "SYNTHETIC-CONTRACT-ONLY",
    profileReports: [],
    runRecords: [],
    findings: [],
    independentReviewRefs: [],
    generatedAt: "2026-08-21T05:00:00+08:00",
    reportSha256: "0".repeat(64),
    containsRealUserData: false,
    containsCredential: false,
  };
}

function makeRun(input, groupIndex, profileId, profileOrderInGroup, options) {
  const warmup = groupIndex < options.warmupCount;
  const repetitionIndex = warmup ? groupIndex + 1 : groupIndex - options.warmupCount + 1;
  const repetitionKind = warmup ? "WARMUP" : "MEASURED";
  const startedMonotonicNs = 100_000 + groupIndex * 10_000 + profileOrderInGroup * 1_000;
  const unsafe = options.unsafe && !warmup && repetitionIndex === 1;
  const run = {
    schemaVersion: RUN_RECORD_SCHEMA_VERSION,
    runId: `D034-RUN-${repetitionKind}-${repetitionIndex}-${profileId}`.toUpperCase(),
    runGroupId: `D034-GROUP-${repetitionKind}-${repetitionIndex}`,
    profileId,
    fixtureId: FIXTURE_ID,
    fixtureArtifactSha256: [FIXTURE_DIGEST],
    repetitionKind,
    repetitionIndex,
    profileOrderInGroup,
    identityFingerprint: computeD034BenchmarkRunIdentityFingerprint(input, profileId, FIXTURE_ID, [FIXTURE_DIGEST]),
    startedMonotonicNs,
    endedMonotonicNs: startedMonotonicNs + 200,
    stageRecords: stageRecords(startedMonotonicNs),
    metrics: metricsFor(profileId, unsafe),
    observedDisposition: "EXPECTED_ALLOW",
    observedReasonCode: "WITHIN_BUDGET_EXPECTED",
    discardState: "COUNTED",
    discardReasonCode: null,
    cleanupEvidence: {
      attempted: true,
      completed: true,
      residualObjects: 0,
      temporaryBytesRemaining: 0,
    },
    diagnosticFingerprint: "0".repeat(64),
    containsRealUserData: false,
    containsCredential: false,
  };
  run.diagnosticFingerprint = computeD034BenchmarkRunDiagnosticFingerprint(run);
  return run;
}

function reportFor(input, profileId, disposition) {
  const runs = input.runRecords.filter((run) => run.profileId === profileId);
  const warmups = runs.filter((run) => run.discardState === "COUNTED" && run.repetitionKind === "WARMUP");
  const measured = runs.filter((run) => run.discardState === "COUNTED" && run.repetitionKind === "MEASURED");
  const stageLatencyDistributions = Object.fromEntries(STAGE_IDS.map((stageId, stageIndex) => [
    stageId,
    distribution(measured.map((run) => run.stageRecords[stageIndex].endedMonotonicNs - run.stageRecords[stageIndex].startedMonotonicNs)),
  ]));
  const fieldMetrics = {
    cpuDistribution: "cpuTimeNs",
    controlledWorkingMemoryDistribution: "controlledWorkingBytesPeak",
    processHighWaterMarkDistribution: "processHighWaterMarkBytes",
    idleBaselineDeltaDistribution: "idleBaselineDeltaBytes",
    temporaryDiskPeakDistribution: "temporaryDiskPeakBytes",
    requestCountDistribution: "foregroundRequestCountPeak",
    databaseWriteCountDistribution: "databaseWriteCount",
    residualObjectCountDistribution: "residualObjectCount",
  };
  const metricDistributions = Object.fromEntries(Object.entries(fieldMetrics).map(([field, metric]) => [
    field,
    distribution(measured.map((run) => run.metrics[metric])),
  ]));
  return {
    profileId,
    scenarioCount: 1,
    countedWarmupRunCount: warmups.length,
    countedMeasuredRunCount: measured.length,
    discardedRunCount: runs.filter((run) => run.discardState !== "COUNTED").length,
    allowedExpectedAndObserved: {
      expectedScenarioCount: 1,
      countedMeasuredRunCount: measured.length,
      matchedRunCount: measured.filter((run) => run.observedDisposition === "EXPECTED_ALLOW").length,
    },
    rejectedExpectedAndObserved: {
      expectedScenarioCount: 0,
      countedMeasuredRunCount: 0,
      matchedRunCount: 0,
    },
    stageLatencyDistributions,
    ...metricDistributions,
    crashJetsamWatchdogHangCounts: Object.fromEntries(
      ["crashCount", "jetsamCount", "watchdogCount", "hangCount"].map((metric) => [
        metric,
        measured.reduce((sum, run) => sum + run.metrics[metric], 0),
      ]),
    ),
    qualityAccessibilityEvidenceRefs: [{
      fixtureId: FIXTURE_ID,
      evidenceRef: `D034-QA-${PROFILE_IDS.indexOf(profileId) + 1}`,
      evidenceSha256: digest(`quality ${profileId}`),
    }],
    disposition,
  };
}

function refreshReportsAndHash(input, disposition) {
  const dispositions = Array.isArray(disposition) ? disposition : PROFILE_IDS.map(() => disposition);
  input.profileReports = PROFILE_IDS.map((profileId, index) => reportFor(input, profileId, dispositions[index]));
  input.reportSha256 = computeD034BenchmarkReportSha256(input);
  return input;
}

function completeInput(options = {}) {
  const settings = {
    warmupCount: 3,
    measuredCount: 10,
    rotationCount: 3,
    identityUnknown: false,
    unsafe: false,
    ...options,
  };
  const input = identityInput(settings);
  const groupCount = settings.warmupCount + settings.measuredCount;
  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const rotation = ROTATIONS[groupIndex % settings.rotationCount];
    rotation.forEach((profileId, orderIndex) => {
      input.runRecords.push(makeRun(input, groupIndex, profileId, orderIndex + 1, settings));
    });
  }
  const disposition = settings.unsafe
    ? "FAIL"
    : settings.identityUnknown || settings.warmupCount < 3 || settings.measuredCount < 10 || settings.rotationCount < 3
      ? "INCONCLUSIVE"
      : "MEASURED_PROFILE_PASS_CANDIDATE";
  return refreshReportsAndHash(input, disposition);
}

function rehashRunAndBundle(input, run) {
  run.diagnosticFingerprint = computeD034BenchmarkRunDiagnosticFingerprint(run);
  input.reportSha256 = computeD034BenchmarkReportSha256(input);
}

test("locks the V1 bundle, run record, eight stages, fourteen metrics, and three rotations", () => {
  assert.equal(INPUT_SCHEMA_VERSION, "D034_BENCHMARK_RUN_REPORT_BUNDLE_INPUT_V1");
  assert.equal(RUN_RECORD_SCHEMA_VERSION, "D034_BENCHMARK_RUN_RECORD_V1");
  assert.equal(RESULT_SCHEMA_VERSION, "D034_BENCHMARK_RUN_REPORT_RESULT_V1");
  assert.equal(CONTRACT_ID, "D034-BENCHMARK-RUN-REPORT-CONTRACT-001");
  assert.deepEqual(STAGE_IDS, ["PREFLIGHT", "METADATA", "DOWNSAMPLE", "ENCODE", "REQUEST_ASSEMBLY", "RESPONSE_COUNT", "PARSE", "CLEANUP"]);
  assert.equal(METRIC_IDS.length, 14);
  assert.deepEqual(ROTATIONS, [
    PROFILE_IDS,
    [PROFILE_IDS[1], PROFILE_IDS[2], PROFILE_IDS[0]],
    [PROFILE_IDS[2], PROFILE_IDS[0], PROFILE_IDS[1]],
  ]);
});

test("accepts a reduced synthetic algorithm fixture only as a structural report with review required", () => {
  const input = completeInput();
  const result = evaluateD034BenchmarkRunReport(input);
  assert.equal(result.disposition, "STRUCTURALLY_COMPLETE_REPORT_ONLY");
  assert.equal(result.overallDisposition, "MEASURED_REVIEW_REQUIRED");
  assert.equal(result.syntheticContractFixtureOnly, true);
  assert.equal(result.profileCount, 3);
  assert.equal(result.fixtureCount, 1);
  assert.equal(result.rawRunRecordCount, 39);
  assert.equal(result.countedWarmupRunCount, 9);
  assert.equal(result.countedMeasuredRunCount, 30);
  assert.equal(result.discardedRunCount, 0);
  assert.equal(result.benchmarkPass, false);
  assert.equal(result.blockers.includes("SYNTHETIC_CONTRACT_FIXTURE_ONLY"), true);
  assert.equal(result.blockers.includes("INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED"), true);
  assert.deepEqual(result.boundary, BOUNDARY);
  assert.equal(result.boundary.benchmarkExecutionAuthorized, false);
  assert.equal(result.boundary.deviceBenchmarkPassed, false);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.boundary), true);
  assert.match(result.inputFingerprint, /^[a-f0-9]{64}$/);
  assert.match(result.resultFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(result).includes(FIXTURE_DIGEST), false);
});

test("recomputes minimum, exact median, nearest-rank p95, and maximum from counted measured raw values", () => {
  const input = completeInput();
  const profile = input.profileReports[0];
  assert.deepEqual(profile.cpuDistribution, {
    sampleCount: 10,
    minimum: 100,
    median: 100,
    p95: 100,
    maximum: 100,
  });
  profile.cpuDistribution.p95 = 101;
  input.reportSha256 = computeD034BenchmarkReportSha256(input);
  assert.throws(() => evaluateD034BenchmarkRunReport(input), {
    code: "INVALID_D034_BENCHMARK_RUN_REPORT",
  });
});

test("coverage below three warm-ups or ten measured runs stays INCONCLUSIVE instead of extrapolating", () => {
  for (const options of [{ warmupCount: 2 }, { measuredCount: 9 }]) {
    const result = evaluateD034BenchmarkRunReport(completeInput(options));
    assert.equal(result.overallDisposition, "INCONCLUSIVE");
    assert.deepEqual(result.profileDispositions.map(({ disposition }) => disposition), [
      "INCONCLUSIVE", "INCONCLUSIVE", "INCONCLUSIVE",
    ]);
    assert.equal(result.benchmarkPass, false);
  }
});

test("UNKNOWN device, environment, harness, or authorization identity stays INCONCLUSIVE", () => {
  const result = evaluateD034BenchmarkRunReport(completeInput({ identityUnknown: true }));
  assert.equal(result.overallDisposition, "INCONCLUSIVE");
  assert.equal(result.boundary.minimumPhysicalDeviceResolved, false);
  assert.equal(result.boundary.isolatedNativeHarnessAuthorized, false);
});

test("unsafe writes produce FAIL and can never become BENCHMARK_PASS", () => {
  const result = evaluateD034BenchmarkRunReport(completeInput({ unsafe: true }));
  assert.equal(result.overallDisposition, "FAIL");
  assert.deepEqual(result.profileDispositions.map(({ disposition }) => disposition), ["FAIL", "FAIL", "FAIL"]);
  assert.equal(result.benchmarkPass, false);
  assert.equal(result.boundary.businessWrites, 0);
});

test("requires globally unique run IDs and exact per-run identity and diagnostic fingerprints", () => {
  const duplicate = completeInput();
  duplicate.runRecords[1].runId = duplicate.runRecords[0].runId;
  duplicate.runRecords[1].diagnosticFingerprint = computeD034BenchmarkRunDiagnosticFingerprint(duplicate.runRecords[1]);
  duplicate.reportSha256 = computeD034BenchmarkReportSha256(duplicate);
  assert.throws(() => evaluateD034BenchmarkRunReport(duplicate), { code: "INVALID_D034_BENCHMARK_RUN_REPORT" });

  const identityDrift = completeInput();
  identityDrift.runRecords[0].identityFingerprint = digest("wrong identity");
  rehashRunAndBundle(identityDrift, identityDrift.runRecords[0]);
  assert.throws(() => evaluateD034BenchmarkRunReport(identityDrift), { code: "INVALID_D034_BENCHMARK_RUN_REPORT" });

  const diagnosticDrift = completeInput();
  diagnosticDrift.runRecords[0].diagnosticFingerprint = digest("wrong diagnostic");
  diagnosticDrift.reportSha256 = computeD034BenchmarkReportSha256(diagnosticDrift);
  assert.throws(() => evaluateD034BenchmarkRunReport(diagnosticDrift), { code: "INVALID_D034_BENCHMARK_RUN_REPORT" });
});

test("requires exact stage order, explicit NOT_REACHED shape, and run-bounded monotonic timestamps", () => {
  const mutations = [
    (run) => { run.stageRecords.reverse(); },
    (run) => { run.stageRecords[2].stageId = "NETWORK"; },
    (run) => { run.stageRecords[2].endedMonotonicNs = run.stageRecords[2].startedMonotonicNs - 1; },
    (run) => {
      run.stageRecords[2] = {
        ...run.stageRecords[2],
        entered: false,
        terminalState: "NOT_REACHED",
        reasonCode: "NOT_REACHED",
      };
    },
  ];
  for (const mutate of mutations) {
    const input = completeInput();
    mutate(input.runRecords[0]);
    rehashRunAndBundle(input, input.runRecords[0]);
    assert.throws(() => evaluateD034BenchmarkRunReport(input), { code: "INVALID_D034_BENCHMARK_RUN_REPORT" });
  }
});

test("requires whole-group discard and preserves all three rotation shapes", () => {
  const partialDiscard = completeInput();
  const run = partialDiscard.runRecords[0];
  run.discardState = "DISCARDED_UNCONTROLLED_THERMAL";
  run.discardReasonCode = "THERMAL_ESCALATION";
  rehashRunAndBundle(partialDiscard, run);
  assert.throws(() => evaluateD034BenchmarkRunReport(partialDiscard), { code: "INVALID_D034_BENCHMARK_RUN_REPORT" });

  const oneRotation = evaluateD034BenchmarkRunReport(completeInput({ rotationCount: 1 }));
  assert.equal(oneRotation.overallDisposition, "INCONCLUSIVE");
});

test("retains a discarded thermal group and requires a new run and group identity for its counted retry", () => {
  const input = completeInput();
  const discardedGroup = input.runRecords.slice(0, 3);
  for (const run of discardedGroup) {
    run.discardState = "DISCARDED_UNCONTROLLED_THERMAL";
    run.discardReasonCode = "THERMAL_ESCALATION";
    run.diagnosticFingerprint = computeD034BenchmarkRunDiagnosticFingerprint(run);
  }
  const retryGroup = discardedGroup.map((original) => {
    const retry = clone(original);
    retry.runId = `${original.runId}-RETRY-1`;
    retry.runGroupId = `${original.runGroupId}-RETRY-1`;
    retry.discardState = "COUNTED";
    retry.discardReasonCode = null;
    retry.diagnosticFingerprint = computeD034BenchmarkRunDiagnosticFingerprint(retry);
    return retry;
  });
  input.runRecords.push(...retryGroup);
  refreshReportsAndHash(input, "MEASURED_PROFILE_PASS_CANDIDATE");
  const result = evaluateD034BenchmarkRunReport(input);
  assert.equal(result.rawRunRecordCount, 42);
  assert.equal(result.discardedRunCount, 3);
  assert.equal(result.countedWarmupRunCount, 9);
  assert.equal(result.overallDisposition, "MEASURED_REVIEW_REQUIRED");
});

test("open P0/P1/P2 findings fail while an owned and dated P3 remains review material", () => {
  const critical = completeInput();
  critical.findings.push({
    findingId: "D034-FINDING-001",
    severity: "P1",
    profileId: null,
    fixtureId: FIXTURE_ID,
    runId: null,
    status: "OPEN",
    ownerRef: "OWNER-SECURITY",
    dueAt: "2026-09-01T00:00:00+08:00",
    summarySha256: digest("critical finding summary"),
  });
  refreshReportsAndHash(critical, "FAIL");
  assert.equal(evaluateD034BenchmarkRunReport(critical).overallDisposition, "FAIL");

  const p3 = completeInput();
  p3.findings.push({
    findingId: "D034-FINDING-002",
    severity: "P3",
    profileId: null,
    fixtureId: null,
    runId: null,
    status: "OPEN",
    ownerRef: "OWNER-QA",
    dueAt: "2026-09-02T00:00:00+08:00",
    summarySha256: digest("P3 finding summary"),
  });
  refreshReportsAndHash(p3, "MEASURED_PROFILE_PASS_CANDIDATE");
  assert.equal(evaluateD034BenchmarkRunReport(p3).overallDisposition, "MEASURED_REVIEW_REQUIRED");

  const missingP3Owner = clone(p3);
  missingP3Owner.findings[0].ownerRef = null;
  missingP3Owner.reportSha256 = computeD034BenchmarkReportSha256(missingP3Owner);
  assert.throws(() => evaluateD034BenchmarkRunReport(missingP3Owner), { code: "INVALID_D034_BENCHMARK_RUN_REPORT" });
});

test("review references remain caller-asserted and cannot grant a benchmark pass", () => {
  const input = completeInput();
  input.independentReviewRefs = [
    {
      reviewId: "D034-REVIEW-QA-001",
      reviewerRole: "QA",
      reviewedArtifactSha256: input.reportSha256,
      disposition: "APPROVED",
      summarySha256: digest("qa summary"),
      signedAt: "2026-08-21T05:30:00+08:00",
    },
    {
      reviewId: "D034-REVIEW-SECURITY-001",
      reviewerRole: "SECURITY",
      reviewedArtifactSha256: input.reportSha256,
      disposition: "APPROVED",
      summarySha256: digest("security summary"),
      signedAt: "2026-08-21T05:31:00+08:00",
    },
  ];
  input.reportSha256 = computeD034BenchmarkReportSha256(input);
  const result = evaluateD034BenchmarkRunReport(input);
  assert.equal(result.independentReviewRefCount, 2);
  assert.equal(result.benchmarkPass, false);
  assert.equal(result.blockers.includes("INDEPENDENT_REVIEW_CALLER_ASSERTED_NOT_VERIFIED"), true);
});

test("binds reportSha256 to the whole ordered bundle and rejects forged result fields or fingerprints", () => {
  const input = completeInput();
  const changed = clone(input);
  changed.generatedAt = "2026-08-21T05:00:01+08:00";
  assert.throws(() => evaluateD034BenchmarkRunReport(changed), { code: "INVALID_D034_BENCHMARK_RUN_REPORT" });

  const result = evaluateD034BenchmarkRunReport(input);
  for (const mutate of [
    (copy) => { copy.benchmarkPass = true; },
    (copy) => { copy.blockers = []; },
    (copy) => { copy.boundary.benchmarkExecutionAuthorized = true; },
    (copy) => { copy.resultFingerprint = digest("forged result"); },
  ]) {
    const forged = clone(result);
    mutate(forged);
    assert.throws(() => validateD034BenchmarkRunReportResult(forged, input), {
      code: "INVALID_D034_BENCHMARK_RUN_REPORT",
    });
  }
});

test("copies and deeply freezes normalized input and result", () => {
  const input = completeInput();
  const normalized = normalizeD034BenchmarkRunReport(input);
  const result = evaluateD034BenchmarkRunReport(input);
  const originalRunId = normalized.runRecords[0].runId;
  input.runRecords[0].runId = "D034-RUN-MUTATED";
  assert.equal(normalized.runRecords[0].runId, originalRunId);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.runRecords), true);
  assert.equal(Object.isFrozen(normalized.runRecords[0].metrics), true);
  assert.equal(Object.isFrozen(result.profileDispositions), true);
});

test("rejects sensitive-looking material without echoing the canary", () => {
  const input = completeInput();
  const canary = "CANARY-DO-NOT-ECHO-7788";
  input.executionAuthorizationRef = `password=${canary}`;
  let error;
  try {
    evaluateD034BenchmarkRunReport(input);
  } catch (caught) {
    error = caught;
  }
  assert.equal(error?.code, "UNSAFE_D034_BENCHMARK_RUN_REPORT");
  assert.equal(`${error?.message}${JSON.stringify(error?.details)}`.includes(canary), false);
});

test("rejects accessors, symbols, special objects, cycles, extra fields, and resource overflow", () => {
  const cases = [];
  const accessor = completeInput();
  Object.defineProperty(accessor.deviceIdentity, "modelIdentifier", { enumerable: true, get: () => "iPhone15,4" });
  cases.push(accessor);
  const symbol = completeInput();
  symbol[Symbol("hidden")] = true;
  cases.push(symbol);
  const special = completeInput();
  special.deviceIdentity = new Date();
  cases.push(special);
  const cyclic = completeInput();
  cyclic.self = cyclic;
  cases.push(cyclic);
  const extra = completeInput();
  extra.benchmarkPass = true;
  extra.reportSha256 = computeD034BenchmarkReportSha256(extra);
  cases.push(extra);
  const overflow = completeInput();
  overflow.independentReviewRefs = Array.from({ length: 33 }, (_, index) => ({
    reviewId: `D034-REVIEW-QA-${String(index).padStart(3, "0")}`,
    reviewerRole: "QA",
    reviewedArtifactSha256: digest(`artifact ${index}`),
    disposition: "INCONCLUSIVE",
    summarySha256: digest(`summary ${index}`),
    signedAt: "2026-08-21T05:30:00+08:00",
  }));
  overflow.reportSha256 = computeD034BenchmarkReportSha256(overflow);
  cases.push(overflow);
  const impossibleCoverage = completeInput();
  impossibleCoverage.manifestIdentity.requiredFixtureSlotCountCovered = 2;
  impossibleCoverage.reportSha256 = computeD034BenchmarkReportSha256(impossibleCoverage);
  cases.push(impossibleCoverage);
  const nonBooleanQuality = completeInput();
  nonBooleanQuality.manifestIdentity.fixtures[0].qualityAccessibilityRequired = "false";
  nonBooleanQuality.reportSha256 = computeD034BenchmarkReportSha256(nonBooleanQuality);
  cases.push(nonBooleanQuality);
  for (const input of cases) {
    assert.throws(() => evaluateD034BenchmarkRunReport(input), {
      code: "INVALID_D034_BENCHMARK_RUN_REPORT",
    });
  }
});

test("source performs no filesystem, network, clock, process, corpus, device, or native side effect", () => {
  const source = fs.readFileSync(new URL("./d034-benchmark-run-report-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    /from\s+["']node:fs["']/,
    /from\s+["']node:net["']/,
    /from\s+["']node:http/,
    /\bfetch\s*\(/,
    /\bDate\.now\s*\(/,
    /\bprocess\.(?:env|cwd|chdir|exit)/,
    /\b(?:readFile|writeFile|mkdir|unlink|rm)\s*\(/,
    /\b(?:xcrun|xcodebuild|simctl|idevice)\b/i,
  ]) {
    assert.equal(forbidden.test(source), false, forbidden.toString());
  }
  const result = evaluateD034BenchmarkRunReport(completeInput());
  assert.equal(result.boundary.rawRunRecordReads, 0);
  assert.equal(result.boundary.fixtureArtifactReads, 0);
  assert.equal(result.boundary.networkRequests, 0);
  assert.equal(result.boundary.businessWrites, 0);
});
