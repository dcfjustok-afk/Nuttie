import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  BOUNDARY,
  D036_ONLY_TARGET_FIELDS,
  D053_ONLY_TARGET_FIELDS,
  INPUT_SCHEMA_VERSION,
  SHARED_TARGET_FIELDS,
  TARGET_FIELDS,
  TEMPLATE_ID,
  evaluateOi07ProviderTargetIntake,
  normalizeOi07ProviderTargetIntake,
  validateOi07ProviderTargetIntakeResult,
} from "./oi07-provider-target-intake-harness.mjs";

function target(slot, overrides = {}) {
  const lower = slot.toLowerCase();
  return {
    providerSlot: slot,
    providerLegalEntity: `Example Provider ${slot} Ltd`,
    apiProductName: `Example API ${slot}`,
    apiProductPlan: "OWNER_SELECTED_TEST_PLAN",
    apiProductRevision: "2026-08",
    accountType: "OWNER_CONTROLLED_API_ACCOUNT",
    accountRegion: "CN",
    intendedUserRegion: "CN",
    baseUrl: `https://${lower}.example.test`,
    endpointPathShape: "/v1/{model}/responses",
    queryRequired: "FALSE",
    redirectDocumented: "NO_REDIRECT_DOCUMENTED",
    streamingMode: "SERVER_SENT_EVENTS_OPTIONAL",
    modelIdentifierForSyntheticTest: `synthetic-model-${lower}`,
    modelFamily: `example-family-${lower}`,
    accountDataControlState: "TRAINING_DISABLED_BY_ACCOUNT_SETTING",
    officialEndpointEvidenceUrl: `https://${lower}.example.test/docs/endpoint`,
    officialTermsUrl: `https://${lower}.example.test/legal/terms`,
    officialPrivacyUrl: `https://${lower}.example.test/legal/privacy`,
    officialApiDataUseUrl: `https://${lower}.example.test/docs/data-use`,
    officialRetentionUrl: `https://${lower}.example.test/docs/retention`,
    officialSubprocessorUrl: `https://${lower}.example.test/legal/subprocessors`,
    officialDeletionOrSupportUrl: `https://${lower}.example.test/support/deletion`,
    documentEffectiveDates: ["2026-08-01"],
    evidenceObservedAt: "2026-08-21T03:30:00+08:00",
    credentialOwner: "OWNER",
    credentialInjectionMethod: "HUMAN_RUNTIME_ENTRY",
    maximumAuthorizedTestCost: "ZERO",
    notesWithoutSecretOrUserData: "Synthetic intake fixture only.",
    ...overrides,
  };
}

function completeInput(overrides = {}) {
  return {
    schemaVersion: INPUT_SCHEMA_VERSION,
    oi07Revision: "OI07-R001",
    providedBy: "OWNER",
    providedAt: "2026-08-21T03:30:00+08:00",
    ownerAuthorizationRef: "OWNER_DIRECT_INPUT",
    targets: [target("P1"), target("P2"), target("P3")],
    ...overrides,
  };
}

test("locks the 30-field union and accepts a complete secret-free intake only as structural input", () => {
  assert.equal(TARGET_FIELDS.length, 29);
  assert.equal(SHARED_TARGET_FIELDS.length, 12);
  assert.equal(D036_ONLY_TARGET_FIELDS.length, 8);
  assert.equal(D053_ONLY_TARGET_FIELDS.length, 9);
  assert.equal(new Set(TARGET_FIELDS).size, 29);
  assert.equal(
    new Set([...SHARED_TARGET_FIELDS, ...D036_ONLY_TARGET_FIELDS, ...D053_ONLY_TARGET_FIELDS]).size,
    29,
  );

  const input = completeInput();
  const result = evaluateOi07ProviderTargetIntake(input);
  assert.equal(result.templateId, TEMPLATE_ID);
  assert.equal(result.disposition, "STRUCTURALLY_COMPLETE_INTAKE_ONLY");
  assert.equal(result.providerTargetCount, 3);
  assert.equal(result.perTargetFieldCount, 29);
  assert.equal(result.unionInputFieldCount, 30);
  assert.equal(result.auditUnknownCount, 0);
  assert.equal(result.targetUnknownFieldCount, 0);
  assert.equal(result.d036IntakeContractComplete, true);
  assert.equal(result.d053IntakeContractComplete, true);
  assert.equal(result.allIntakeFieldsComplete, true);
  assert.equal(result.blockers.includes("D036_EXECUTION_NOT_AUTHORIZED"), true);
  assert.equal(result.blockers.includes("D053_NOT_AUTHORIZED"), true);
  assert.deepEqual(result.boundary, BOUNDARY);
  assert.match(result.inputFingerprint, /^[a-f0-9]{64}$/);
  assert.match(result.resultFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.providerSlots), true);

  const serialized = JSON.stringify(result);
  for (const absent of [
    "Example Provider",
    "Example API",
    "example.test",
    "Synthetic intake fixture only",
  ]) {
    assert.equal(serialized.includes(absent), false, absent);
  }
});

test("keeps D-053 blocked independently when only a D-053 field is UNKNOWN", () => {
  const input = completeInput();
  input.targets[1].officialRetentionUrl = "UNKNOWN";
  const result = evaluateOi07ProviderTargetIntake(input);
  assert.equal(result.disposition, "PARTIAL_UNKNOWN_BLOCKED");
  assert.equal(result.targetUnknownFieldCount, 1);
  assert.equal(result.sharedUnknownCount, 0);
  assert.equal(result.d036OnlyUnknownCount, 0);
  assert.equal(result.d053OnlyUnknownCount, 1);
  assert.equal(result.d036IntakeContractComplete, true);
  assert.equal(result.d053IntakeContractComplete, false);
  assert.equal(result.allIntakeFieldsComplete, false);
  assert.equal(result.blockers.includes("D053_TARGET_FIELDS_UNKNOWN"), true);
});

test("a shared UNKNOWN or incomplete authority metadata blocks both protocol consumers", () => {
  const input = completeInput({ oi07Revision: "UNKNOWN", ownerAuthorizationRef: "UNKNOWN" });
  input.targets[0].baseUrl = "UNKNOWN";
  const result = evaluateOi07ProviderTargetIntake(input);
  assert.equal(result.auditUnknownCount, 2);
  assert.equal(result.sharedUnknownCount, 1);
  assert.equal(result.authorityMetadataComplete, false);
  assert.equal(result.d036IntakeContractComplete, false);
  assert.equal(result.d053IntakeContractComplete, false);
  assert.deepEqual(result.blockers.slice(0, 2), [
    "INPUT_AUTHORITY_METADATA_INCOMPLETE",
    "SHARED_TARGET_FIELDS_UNKNOWN",
  ]);
});

test("accepts only a sourced N/A and forbids N/A for concrete target identity", () => {
  const input = completeInput();
  input.targets[0].officialSubprocessorUrl =
    "N/A(no separate list is published, https://p1.example.test/legal/terms)";
  const result = evaluateOi07ProviderTargetIntake(input);
  assert.equal(result.notApplicableFieldCount, 1);
  assert.equal(result.allIntakeFieldsComplete, true);

  for (const changed of [
    "N/A",
    "N/A(no list)",
    "N/A(no list, http://p1.example.test/terms)",
    "N/A(no list, https://p1.example.test/terms?signature=unsafe)",
  ]) {
    const malformed = completeInput();
    malformed.targets[0].officialSubprocessorUrl = changed;
    assert.throws(() => evaluateOi07ProviderTargetIntake(malformed), {
      code: "INVALID_OI07_PROVIDER_TARGET_INTAKE",
    });
  }
  const identity = completeInput();
  identity.targets[0].providerLegalEntity =
    "N/A(no legal entity, https://p1.example.test/legal/terms)";
  assert.throws(() => evaluateOi07ProviderTargetIntake(identity), {
    code: "INVALID_OI07_PROVIDER_TARGET_INTAKE",
  });
});

test("rejects missing, extra, duplicate, reordered, or additional Provider targets", () => {
  const missingField = completeInput();
  delete missingField.targets[0].modelFamily;
  const extraField = completeInput();
  extraField.targets[0].apiKey = "not-a-real-key";
  const duplicateSlot = completeInput();
  duplicateSlot.targets[1].providerSlot = "P1";
  const reordered = completeInput();
  reordered.targets.reverse();
  const extraTarget = completeInput();
  extraTarget.targets.push(target("P4"));
  for (const input of [missingField, extraField, duplicateSlot, reordered, extraTarget]) {
    assert.throws(() => evaluateOi07ProviderTargetIntake(input), {
      code: "INVALID_OI07_PROVIDER_TARGET_INTAKE",
    });
  }
});

test("rejects malformed revision, authority metadata, timestamps, dates, query and cost values", () => {
  const mutations = [
    (input) => { input.oi07Revision = "OI07-R01"; },
    (input) => { input.providedBy = "RESEARCHER"; },
    (input) => { input.providedAt = "2026-08-21"; },
    (input) => { input.targets[0].evidenceObservedAt = "2026-08-21"; },
    (input) => { input.targets[0].documentEffectiveDates = []; },
    (input) => { input.targets[0].documentEffectiveDates = ["2026-13-01"]; },
    (input) => { input.targets[0].documentEffectiveDates = ["2026-02-30"]; },
    (input) => { input.targets[0].documentEffectiveDates = ["2026-08-01", "2026-08-01"]; },
    (input) => { input.targets[0].queryRequired = "MAYBE"; },
    (input) => { input.targets[0].maximumAuthorizedTestCost = "5 USD"; },
    (input) => { input.targets[0].maximumAuthorizedTestCost = "USD 5"; },
  ];
  for (const mutate of mutations) {
    const input = completeInput();
    mutate(input);
    assert.throws(
      () => evaluateOi07ProviderTargetIntake(input),
      (error) => [
        "INVALID_OI07_PROVIDER_TARGET_INTAKE",
        "UNSAFE_OI07_PROVIDER_TARGET_INTAKE",
      ].includes(error.code),
    );
  }
});

test("requires a clean HTTPS origin and stable public evidence URLs", () => {
  const mutations = [
    (input) => { input.targets[0].baseUrl = "http://p1.example.test"; },
    (input) => { input.targets[0].baseUrl = "https://user:p@p1.example.test"; },
    (input) => { input.targets[0].baseUrl = "https://p1.example.test/v1"; },
    (input) => { input.targets[0].baseUrl = "https://p1.example.test?region=cn"; },
    (input) => { input.targets[0].officialTermsUrl = "https://p1.example.test/terms?tracking=1"; },
    (input) => { input.targets[0].officialPrivacyUrl = "https://p1.example.test/privacy#section"; },
    (input) => { input.targets[0].endpointPathShape = "v1/responses"; },
    (input) => { input.targets[0].endpointPathShape = "/v1/responses?key={key}"; },
  ];
  for (const mutate of mutations) {
    const input = completeInput();
    mutate(input);
    assert.throws(
      () => evaluateOi07ProviderTargetIntake(input),
      (error) => [
        "INVALID_OI07_PROVIDER_TARGET_INTAKE",
        "UNSAFE_OI07_PROVIDER_TARGET_INTAKE",
      ].includes(error.code),
    );
  }
});

test("rejects sensitive-looking material without echoing it in the error or result", () => {
  const canaries = [
    "sk-CANARY1234567890",
    "Bearer CANARY1234567890",
    "api_key=CANARY1234567890",
    "person@example.test",
  ];
  for (const canary of canaries) {
    const input = completeInput();
    input.targets[0].notesWithoutSecretOrUserData = canary;
    assert.throws(
      () => evaluateOi07ProviderTargetIntake(input),
      (error) => {
        assert.equal(error.code, "UNSAFE_OI07_PROVIDER_TARGET_INTAKE");
        assert.equal(error.message.includes(canary), false);
        return true;
      },
    );
  }
});

test("rejects special objects, accessors, symbols, cycles, deep trees and oversized strings", () => {
  const accessor = completeInput();
  Object.defineProperty(accessor.targets[0], "modelFamily", {
    enumerable: true,
    get: () => "example-family",
  });
  const symbol = completeInput();
  symbol.targets[0][Symbol("hidden")] = true;
  const special = completeInput();
  special.targets[0].documentEffectiveDates = new Set(["2026-08-01"]);
  const cycle = completeInput();
  cycle.targets[0].notesWithoutSecretOrUserData = cycle;
  const oversized = completeInput();
  oversized.targets[0].notesWithoutSecretOrUserData = "x".repeat(4097);
  const deep = completeInput();
  deep.extra = { a: { b: { c: { d: { e: { f: true } } } } } };
  for (const input of [accessor, symbol, special, cycle, oversized, deep]) {
    assert.throws(() => evaluateOi07ProviderTargetIntake(input), {
      code: "INVALID_OI07_PROVIDER_TARGET_INTAKE",
    });
  }
});

test("normalization copies and freezes input while result validation rejects forged authorization", () => {
  const input = completeInput();
  const normalized = normalizeOi07ProviderTargetIntake(input);
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.targets), true);
  assert.equal(Object.isFrozen(normalized.targets[0]), true);
  input.targets[0].providerLegalEntity = "Changed after normalization";
  assert.notEqual(normalized.targets[0].providerLegalEntity, input.targets[0].providerLegalEntity);

  const cleanInput = completeInput();
  const result = evaluateOi07ProviderTargetIntake(cleanInput);
  assert.deepEqual(validateOi07ProviderTargetIntakeResult(result, cleanInput), result);
  for (const changed of [
    { ...result, disposition: "AUTHORIZED" },
    { ...result, blockers: [] },
    { ...result, d036IntakeContractComplete: false },
    { ...result, resultFingerprint: "b".repeat(64) },
    { ...result, boundary: { ...result.boundary, sendAuthorization: "GRANTED" } },
  ]) {
    assert.throws(() => validateOi07ProviderTargetIntakeResult(changed, cleanInput), {
      code: "INVALID_OI07_PROVIDER_TARGET_INTAKE",
    });
  }
});

test("source creates no filesystem write, clock, transport, network, credential or business effect", () => {
  const source = fs.readFileSync(new URL("./oi07-provider-target-intake-harness.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    "fetch(",
    "XMLHttpRequest",
    "node:http",
    "node:https",
    "readFile",
    "writeFile",
    "Date.now",
    "SAVE_DIARY",
    "UPDATE_TARGET",
    "headers.set",
    "sqlite",
    "sqlcipher",
    "keychain",
  ]) {
    assert.equal(source.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
  }
  assert.equal(BOUNDARY.networkRequests, 0);
  assert.equal(BOUNDARY.credentialMaterialRead, false);
  assert.equal(BOUNDARY.providerFactsVerified, false);
  assert.equal(BOUNDARY.sendAuthorization, "NOT_GRANTED");
  assert.equal(BOUNDARY.formalImplementationAuthorized, false);
});
