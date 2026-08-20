import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROJECT_OPS_SCHEMA_PROFILE,
  inspectSchemaDefinition,
  validateSchemaInstance,
} from "./json-schema-subset.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_WORKSPACE_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const EVENT_FILE_PATTERN = /^([0-9]{4}-[0-9]{2}-[0-9]{2})\.jsonl$/;
const EVENT_ID_PATTERN = /^EVT-([0-9]{8})-([0-9]{3})$/;
const MESSAGE_ID_PATTERN = /^MSG-[0-9]{8}-[0-9]{3,}$/;
const DECISION_ID_PATTERN = /^D-[0-9]{3}$/;
const EVIDENCE_ID_PATTERN = /^(ACC|DAY|LOG|FOOD|BODY|AI|SYS|DATA)-[0-9]{2}$/;
const GAP_THEME_ID_PATTERN = /^EG-[0-9]{2}$/;

const PROJECT_OPS_SCHEMA_TARGETS = Object.freeze([
  Object.freeze({
    schemaId: "https://nuttie.local/schemas/decision-register.schema.json",
    instances: (model) => [
      Object.freeze({ sourcePath: "project-ops/decisions.json", value: model.decisionRegister }),
    ],
  }),
  Object.freeze({
    schemaId: "https://nuttie.local/schemas/owner-intake.schema.json",
    instances: (model) => [
      Object.freeze({ sourcePath: "project-ops/owner-intake.json", value: model.ownerIntake }),
    ],
  }),
  Object.freeze({
    schemaId: "https://nuttie.local/schemas/snapshot.schema.json",
    instances: (model) => [
      Object.freeze({ sourcePath: "project-ops/snapshots/current.json", value: model.snapshot }),
    ],
  }),
  Object.freeze({
    schemaId: "https://nuttie.local/schemas/project-event.schema.json",
    instances: (model) =>
      model.events.map((record) =>
        Object.freeze({
          sourcePath: `${record.sourceFile}:${record.lineNumber}`,
          value: record.value,
        }),
      ),
  }),
  Object.freeze({
    schemaId: "https://nuttie.local/schemas/project-message.schema.json",
    instances: (model) =>
      model.messages.map((record) =>
        Object.freeze({
          sourcePath: `${record.sourceFile}:${record.lineNumber}`,
          value: record.value,
        }),
      ),
  }),
]);

export const PHASE0_2026_08_21_D034_BENCHMARK_PROTOCOL_READY = Object.freeze({
  id: "PHASE0_2026_08_21_D034_BENCHMARK_PROTOCOL_READY",
  counts: Object.freeze({
    schemas: 5,
    decisions: 32,
    acceptedDecisions: 29,
    candidateDecisions: 3,
    events: 187,
    messages: 116,
    resolvedResponses: 72,
    agents: 25,
    activeAgents: 1,
    evidenceItems: 66,
    confirmedEvidence: 37,
    crossSourceEvidence: 24,
    pendingEvidence: 5,
    gapThemes: 9,
    ownerResponses: 14,
    ownerDecisionIds: 13,
  }),
  gateStates: Object.freeze({
    G0: "PASS",
    G1: "PASS",
    G2: "IN_PROGRESS",
    G3: "IN_PROGRESS",
    G4: "IN_PROGRESS",
    G5: "FAIL",
    G6: "FAIL",
    G7: "FAIL",
    G8: "FAIL",
  }),
  activeAgentIds: Object.freeze(["root"]),
  eventCountsByDate: Object.freeze({
    "2026-07-31": 59,
    "2026-08-03": 13,
    "2026-08-05": 5,
    "2026-08-06": 29,
    "2026-08-11": 5,
    "2026-08-12": 15,
    "2026-08-13": 10,
    "2026-08-14": 22,
    "2026-08-15": 8,
    "2026-08-17": 3,
    "2026-08-20": 8,
    "2026-08-21": 10,
  }),
  pendingEvidenceIds: Object.freeze([
    "LOG-08",
    "LOG-09",
    "AI-06",
    "DATA-07",
    "DATA-08",
  ]),
  ownerIntake: Object.freeze({
    channel: "CODEX_REQUEST_USER_INPUT",
    status: "CONFIRMED",
    acceptanceStateChanged: true,
    nextQuestionId: "d040_onboarding_goals",
    nextQuestionTool: "request_user_input",
    batchNextQuestionId: "d039_add_meal_entry",
    batchConfirmationEventId: "EVT-20260814-013",
    batchConfirmationQuestionId: "phase0_owner_batch_readback_confirmation",
    acceptedDecisionIds: Object.freeze([
      "D-018",
      "D-019",
      "D-020",
      "D-021",
      "D-023",
      "D-024",
      "D-025",
      "D-037",
      "D-038",
      "D-047",
      "D-048",
    ]),
    acceptedChoiceKeys: Object.freeze({
      "D-018": "expo-router",
      "D-019": "zustand-ui-only",
      "D-020": "drizzle-controlled-sql",
      "D-021": "react-hook-form-zod",
      "D-023": "jest-single-runner",
      "D-024": "local-maestro-xctest",
      "D-025": "stylesheet-semantic-tokens",
      "D-037": "pnpm-11-hoisted",
      "D-038": "four-destinations-contextual-add",
      "D-047": "no-developer-program-self-use",
      "D-048": "iphone-portrait",
    }),
    responseStates: Object.freeze({
      d038_navigation_shell: "CONFIRMED_ACCEPTED",
      d032_spike_baseline: "CONFIRMED_SPIKE_AUTHORIZED",
      d037_package_manager: "CONFIRMED_ACCEPTED",
      d048_device_profile: "CONFIRMED_ACCEPTED",
      d018_navigation_implementation: "CONFIRMED_ACCEPTED",
      d020_sqlite_access: "CONFIRMED_ACCEPTED",
      d019_ui_state: "CONFIRMED_ACCEPTED",
      d021_forms_validation: "CONFIRMED_ACCEPTED",
      d025_styling_tokens: "CONFIRMED_ACCEPTED",
      d023_unit_component_tests: "CONFIRMED_ACCEPTED",
      d024_e2e_native_tests: "CONFIRMED_ACCEPTED",
      d047_apple_identity: "SUPERSEDED_BY_OWNER_CLARIFICATION",
      d047_scope_clarification: "CONFIRMED_ACCEPTED",
      d039_add_meal_entry: "CONFIRMED_ACCEPTED",
    }),
    d032ChoiceKey: "sdk-57-spike-authorized",
    oi02EventId: "EVT-20260814-001",
    oi02Fact: Object.freeze({
      inputId: "OI-02",
      questionId: "oi02_identifier_status",
      captureChannel: "CODEX_REQUEST_USER_INPUT",
      captureTool: "request_user_input",
      rawOwnerAnswer: "尚未创建 (Recommended)",
      selectedOptionId: "not_created",
      selectedOptionLabel: "尚未创建",
      normalizedValue: "NOT_CREATED",
      bundleId: null,
      sku: "N/A",
      appIdStatus: "NOT_CREATED",
      appStoreConnectRecordStatus: "NOT_CREATED",
      specificBundleIdRequiredBy: "FIRST_SELF_USE_DEVICE_SIGNING_CONFIGURATION",
      state: "CONFIRMED",
    }),
    oi03EventId: "EVT-20260811-001",
    oi03Fact: Object.freeze({
      inputId: "OI-03",
      questionId: "oi03_device_availability",
      captureChannel: "CODEX_CHOICE_UI",
      captureTool: "mcp__choice_ui__ask_choice",
      selectedOptionId: "iphone_only",
      normalizedValue: "IPHONE_ONLY",
      macAvailability: "NONE_CURRENTLY_AVAILABLE",
      iphoneAvailability: "AVAILABLE",
      iphoneModel: "iPhone 16 Pro Max",
      iosVersion: "26.5",
      canConnectToMac: "N/A_NO_MAC",
      profileCompleteness: "COMPLETE_FOR_CURRENT_AVAILABILITY",
      nativeIosWorkAuthorized: false,
      state: "CONFIRMED",
    }),
    d047InitialOption: "A",
    d047LatestQuestionId: "d047_scope_clarification",
    d047LatestOption: "C",
    decisionIds: Object.freeze([
      "D-018",
      "D-019",
      "D-020",
      "D-021",
      "D-023",
      "D-024",
      "D-025",
      "D-032",
      "D-037",
      "D-038",
      "D-039",
      "D-047",
      "D-048",
    ]),
  }),
  aiCredentialContract: Object.freeze({
    eventId: "EVT-20260812-001",
    subjectId: "ai-credential-lifecycle-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    topLevelTests: 21,
    fullSuitePassed: 302,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  bodyWeightContract: Object.freeze({
    eventId: "EVT-20260812-002",
    subjectId: "body-weight-record-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F10",
    requirementId: "REQ-F10",
    acceptanceId: "AT-F10",
    topLevelTests: 18,
    fullSuitePassed: 321,
    originalUnitPreserved: true,
    exactConversionPreserved: true,
    sameDayRecordsPreserved: true,
    realNetworkRequests: 0,
    healthKitUsed: false,
    bmiOrTargetRulesAuthorized: false,
    dailyMergeAuthorized: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  sevenDayEnergyContract: Object.freeze({
    eventId: "EVT-20260812-003",
    subjectId: "seven-day-energy-trend-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F11",
    requirementId: "REQ-F11",
    acceptanceId: "AT-F11",
    topLevelTests: 15,
    fullSuitePassed: 337,
    windowDays: 7,
    missingDistinctFromZero: true,
    sourceTraceabilityPreserved: true,
    exactEnergyAggregation: true,
    burnFormulaAuthorized: false,
    targetOrNetAuthorized: false,
    averageOrLongerWindowAuthorized: false,
    realNetworkRequests: 0,
    healthKitUsed: false,
    aiUsed: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  manualBurnContract: Object.freeze({
    eventId: "EVT-20260812-004",
    subjectId: "manual-burn-record-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F13",
    requirementId: "REQ-F13",
    acceptanceId: "AT-F13",
    topLevelTests: 13,
    fullSuitePassed: 351,
    projectedStream: "BURNED",
    projectedSourceKind: "MANUAL_BURN",
    projectedQuality: "USER_ENTERED",
    exactEnergyPreserved: true,
    burnFormulaAuthorized: false,
    exerciseFieldsAuthorized: false,
    stepsUsed: false,
    healthKitUsed: false,
    realNetworkRequests: 0,
    aiUsed: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  waterRecordContract: Object.freeze({
    eventId: "EVT-20260812-005",
    subjectId: "water-record-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F14",
    requirementId: "REQ-F14",
    acceptanceId: "AT-F14",
    topLevelTests: 16,
    fullSuitePassed: 368,
    originalValuePreserved: true,
    explicitVersionedUnitDefinition: true,
    exactDailyAggregation: true,
    emptyDistinctFromZero: true,
    goalAuthorized: false,
    quickAmountAuthorized: false,
    defaultOrDisplayUnitAuthorized: false,
    undoAuthorized: false,
    trendAuthorized: false,
    reminderAuthorized: false,
    healthKitUsed: false,
    realNetworkRequests: 0,
    aiUsed: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  localReminderContract: Object.freeze({
    eventId: "EVT-20260812-006",
    subjectId: "local-reminder-reconcile-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F15",
    requirementId: "REQ-F15",
    acceptanceId: "AT-F15",
    topLevelTests: 18,
    fullSuitePassed: 387,
    localRuleCrudPreserved: true,
    permissionIndependentPersistence: true,
    rulesGenerationProtected: true,
    desiredStateGenerationProtected: true,
    pendingDeliveredSeparated: true,
    unknownResultRequiresReenumeration: true,
    systemPresentationGuaranteed: false,
    reminderTypeAuthorized: false,
    recurrenceRulesAuthorized: false,
    notificationContentAuthorized: false,
    pushOrApnsUsed: false,
    backgroundTimerUsed: false,
    realNotificationApiCalls: 0,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  dateNavigationContract: Object.freeze({
    eventId: "EVT-20260812-007",
    subjectId: "date-navigation-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F08",
    requirementId: "REQ-F08",
    acceptanceId: "AT-F08",
    topLevelTests: 19,
    fullSuitePassed: 407,
    explicitDateObservation: true,
    ianaTimeZoneValidated: true,
    dstAndMidnightCovered: true,
    observationGenerationProtected: true,
    staleNavigationRejected: true,
    externalPolicyEvidenceRequired: true,
    selectionPreservedOnObservationRefresh: true,
    futureDateRuleAuthorized: false,
    backfillRuleAuthorized: false,
    crossTimeZoneRebaseAuthorized: false,
    defaultTodayBehaviorAuthorized: false,
    uiBehaviorAuthorized: false,
    persistenceUsed: false,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  mealSlotGroupingContract: Object.freeze({
    eventId: "EVT-20260812-008",
    subjectId: "meal-slot-grouping-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F06",
    requirementId: "REQ-F06",
    acceptanceId: "AT-F06",
    topLevelTests: 17,
    fullSuitePassed: 425,
    explicitVersionedDefinition: true,
    explicitOrderingPreserved: true,
    emptySlotsPreserved: true,
    unassignedDistinctFromUnresolved: true,
    historicalDefinitionPreserved: true,
    revisionTraceabilityPreserved: true,
    builtInDefaultSlots: false,
    defaultOrCustomRulesAuthorized: false,
    moveOrCopyAuthorized: false,
    targetRulesAuthorized: false,
    uiBehaviorAuthorized: false,
    persistenceUsed: false,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  macroTargetHistoryContract: Object.freeze({
    eventId: "EVT-20260812-009",
    subjectId: "macro-target-history-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F05",
    requirementId: "REQ-F05",
    acceptanceId: "AT-F05",
    topLevelTests: 18,
    fullSuitePassed: 444,
    originalTargetValuePreserved: true,
    explicitVersionedUnitDefinition: true,
    zeroDistinctFromUnset: true,
    historicalEffectiveDatePreserved: true,
    futureVersionDoesNotRewritePast: true,
    sourceAndUserEditTraceability: true,
    actualMissingSemanticsPreserved: true,
    actualTargetCompatibilityInferred: false,
    targetAlgorithmAuthorized: false,
    percentConversionAuthorized: false,
    comparisonPolicyAuthorized: false,
    roundingPolicyAuthorized: false,
    mutationAuthorized: false,
    persistenceUsed: false,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  dailyEnergyLedgerContract: Object.freeze({
    eventId: "EVT-20260812-010",
    subjectId: "daily-energy-ledger-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F04",
    requirementId: "REQ-F04",
    acceptanceId: "AT-F04",
    topLevelTests: 19,
    fullSuitePassed: 464,
    exactIntakeAndBurnAggregation: true,
    missingDistinctFromZero: true,
    sourceRevisionTraceability: true,
    historicalTargetEffectiveDatePreserved: true,
    futureTargetDoesNotRewritePast: true,
    targetSourceAndUserEditTraceability: true,
    leftStatus: "POLICY_NOT_AUTHORIZED",
    leftFormulaAuthorized: false,
    targetAlgorithmAuthorized: false,
    missingBurnDefaultAuthorized: false,
    negativeLeftPolicyAuthorized: false,
    roundingPolicyAuthorized: false,
    mutationAuthorized: false,
    persistenceUsed: false,
    systemClockRead: false,
    aiUsed: false,
    healthKitUsed: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  localProfileRecordContract: Object.freeze({
    eventId: "EVT-20260812-011",
    subjectId: "local-profile-record-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureIds: Object.freeze(["F12", "F17"]),
    requirementIds: Object.freeze(["REQ-F12", "REQ-F17"]),
    acceptanceIds: Object.freeze(["AT-F12", "AT-F17"]),
    topLevelTests: 20,
    fullSuitePassed: 485,
    explicitVersionedOpaqueSchema: true,
    emptyDocumentPreserved: true,
    revisionCasAndIdempotency: true,
    unknownResultReplay: true,
    relatedDataEvidenceUnchanged: true,
    relatedDataMutation: "NOT_AUTHORIZED",
    approvedProfileFields: false,
    activeProfilePolicyAuthorized: false,
    multiProfileUxAuthorized: false,
    cascadeDeleteAuthorized: false,
    formulaAuthorized: false,
    accountOrServerUsed: false,
    persistenceUsed: false,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  localDataAccessManifestContract: Object.freeze({
    eventId: "EVT-20260812-012",
    subjectId: "local-data-access-manifest-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F18",
    requirementId: "REQ-F18",
    acceptanceId: "AT-F18",
    topLevelTests: 19,
    fullSuitePassed: 505,
    explicitVersionedDomainDefinitions: true,
    emptyDomainsPreserved: true,
    stableSnapshotAndCursorBinding: true,
    completeReadVerification: true,
    deliveryMode: "IN_APP_READ_ONLY",
    businessDataBoundary: "IN_APP_READ_ONLY_PAGED",
    keychainSecretValues: "EXCLUDED_NEVER_RETURNED",
    nativeContainerInventory: "REQUIRES_NATIVE_ADAPTER",
    externalFilesCopies: "OUT_OF_SCOPE_USER_CONTROLLED",
    artifactCreation: "NOT_AUTHORIZED",
    mutation: "NOT_AUTHORIZED",
    plaintextExportAuthorized: false,
    backupOrRestoreAuthorized: false,
    persistenceUsed: false,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  localDataAccessRegistryContract: Object.freeze({
    eventId: "EVT-20260813-001",
    subjectId: "local-data-access-registry-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F18",
    requirementId: "REQ-F18",
    acceptanceId: "AT-F18",
    topLevelTests: 15,
    fullSuitePassed: 607,
    singleVersionedDomainRegistry: true,
    uniqueDomainPositionAndAdapter: true,
    completeRegisteredDomainSetRequired: true,
    consistentReadSnapshotPort: true,
    repositoryGenerationBound: true,
    registryFingerprintBound: true,
    everyRegisteredDomainReadExactlyOnce: true,
    emptyDomainsPreserved: true,
    abortedTransactionClosed: true,
    closeReceiptRequiredBeforePublish: true,
    mixedGenerationPrevented: true,
    deliveryMode: "IN_APP_READ_ONLY",
    sqliteAccessLayerAuthorized: false,
    sqlCipherSnapshotImplemented: false,
    businessDomainFieldsApproved: false,
    plaintextExportAuthorized: false,
    backupOrRestoreAuthorized: false,
    persistenceUsed: false,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  aiCandidateConfirmationContract: Object.freeze({
    eventId: "EVT-20260813-002",
    subjectId: "ai-candidate-confirmation-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureIds: Object.freeze(["F01", "F02"]),
    requirementIds: Object.freeze(["REQ-F01", "REQ-F02"]),
    acceptanceIds: Object.freeze(["AT-F01", "AT-F02"]),
    topLevelTests: 20,
    fullSuitePassed: 628,
    volatileLocalInputPreserved: true,
    strictResponseContractReused: true,
    explicitCandidateReviewRequired: true,
    requestContextFingerprintBound: true,
    policyEvidenceFingerprintBound: true,
    candidateFingerprintBound: true,
    confirmedValueCallerOwned: true,
    saveEffectExcludesRawInputAndCandidate: true,
    idempotentConfirmedValueSave: true,
    unknownCommitReplayRequired: true,
    volatileInputPurgedAfterCommit: true,
    manualFallbackBeforeCommit: true,
    mediaRetentionAuthorized: false,
    nonLabelConfirmationPolicyAuthorized: false,
    productionResourceBudgetAuthorized: false,
    transportProfileAuthorized: false,
    providerUsePolicyAuthorized: false,
    businessFieldMappingApproved: false,
    automaticDiaryOrTargetMutation: false,
    persistentRepositoryImplemented: false,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  aiGuidanceReferenceContract: Object.freeze({
    eventId: "EVT-20260813-003",
    subjectId: "ai-guidance-reference-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F16",
    requirementId: "REQ-F16",
    acceptanceId: "AT-F16",
    topLevelTests: 12,
    fullSuitePassed: 641,
    strictOpaqueResponseContract: true,
    duplicateJsonKeysRejected: true,
    referenceOnlyBoundary: true,
    nonMedicalBoundary: true,
    medicalSafetyEvaluation: "NOT_PERFORMED",
    highRiskUseAuthorized: false,
    callerOwnedContentDefinition: true,
    callerOwnedDisclaimerDefinition: true,
    generatedAtCallerSupplied: true,
    requestAndPolicyEvidenceBound: true,
    sourceAndEditFingerprintsBound: true,
    revisionCasEditing: true,
    discardPurgesVolatileContent: true,
    observableEffects: 0,
    automaticDiaryOrTargetMutation: false,
    persistenceStrategyAuthorized: false,
    iaPlacementAuthorized: false,
    nonLabelConfirmationPolicyAuthorized: false,
    providerUsePolicyAuthorized: false,
    businessPayloadApproved: false,
    persistentRepositoryImplemented: false,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  barcodeLookupOrchestratorContract: Object.freeze({
    eventId: "EVT-20260813-004",
    subjectId: "barcode-lookup-orchestrator-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F03",
    requirementId: "REQ-F03",
    acceptanceId: "AT-F03",
    topLevelTests: 20,
    fullSuitePassed: 662,
    exactGtinLengths: Object.freeze([8, 12, 13, 14]),
    leadingZeroPreserved: true,
    localExactLookupOnly: true,
    trustedCatalogEvidenceBound: true,
    singleCandidateRequiresExplicitSelection: true,
    multipleSourceCandidatesRemainSeparate: true,
    callerOwnedFoodReview: true,
    callerOwnedManualCreation: true,
    cameraPermissionHandling: "EXTERNAL_F21_ORCHESTRATOR",
    fuzzyBarcodeRecognitionAuthorized: false,
    coveragePromiseAuthorized: false,
    catalogMutationAuthorized: false,
    diaryMutationAuthorized: false,
    aiFallbackAuthorized: false,
    persistentRepositoryImplemented: false,
    systemClockRead: false,
    nativeApiCalls: 0,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  importSafetyPreflightContract: Object.freeze({
    eventId: "EVT-20260813-005",
    subjectId: "import-safety-preflight-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F19",
    requirementId: "REQ-F19",
    acceptanceId: "AT-F19",
    topLevelTests: 19,
    fullSuitePassed: 676,
    approvedDefaultLimitsBound: true,
    customLimitsCanOnlyTighten: true,
    strictPlainJsonBoundary: true,
    nfcAndCaseCollisionRejected: true,
    manifestEntrySetExact: true,
    importSubjectFingerprintBound: true,
    verificationEvidenceSubjectBound: true,
    verificationTruth: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
    activeStateFingerprintBound: true,
    activationStrategy: "PENDING_D026_D027_D030",
    activationCommitted: false,
    signatureAlgorithmSelected: false,
    backupCryptoProfileSelected: false,
    restoreModeSelected: false,
    filesystemReads: 0,
    filesystemWrites: 0,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeApiCalls: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  foodInsightAvailabilityContract: Object.freeze({
    eventId: "EVT-20260813-006",
    subjectId: "food-insight-availability-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F09",
    requirementId: "REQ-F09",
    acceptanceId: "AT-F09",
    topLevelTests: 14,
    fullSuitePassed: 691,
    trustedLocalNutritionSnapshotOnly: true,
    approvedNutrientFieldCount: 7,
    nutritionFactsAvailable: true,
    missingNotZero: true,
    traceWithoutNumericValue: true,
    estimatedSourceVisible: true,
    packCatalogTrustRequired: true,
    advancedCapabilityIds: Object.freeze([
      "HEALTH_SCORE",
      "MICRONUTRIENT_LABELS",
      "HEALTH_RISKS",
      "HEALTH_BENEFITS",
    ]),
    publicEvidenceIds: Object.freeze(["FOOD-04", "FOOD-05", "FOOD-06", "FOOD-07"]),
    advancedCapabilityScopePreserved: true,
    advancedContentExposure: "NONE",
    healthScoreAlgorithmAuthorized: false,
    micronutrientFieldSetAuthorized: false,
    riskBenefitGenerationAuthorized: false,
    medicalConclusionAuthorized: false,
    personalizedClaimAuthorized: false,
    aiGenerationAuthorized: false,
    automaticProfileUseAuthorized: false,
    observableEffects: 0,
    filesystemReads: 0,
    filesystemWrites: 0,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeApiCalls: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  dataPackPreauthContract: Object.freeze({
    eventId: "EVT-20260813-007",
    subjectId: "data-pack-preauth-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F03",
    requirementId: "REQ-F03",
    acceptanceId: "AT-F03",
    topLevelTests: 20,
    fullSuitePassed: 704,
    approvedDefaultLimitsBound: true,
    customLimitsCanOnlyTighten: true,
    preAuthObjectKeysCounted: true,
    preAuthStringBudgetBound: true,
    strictPassiveJsonBoundary: true,
    regularFileOnly: true,
    nfcAndCaseCollisionRejected: true,
    manifestEntrySetExact: true,
    manifestBytesBound: true,
    totalBytesBound: true,
    provenanceManifestIdentityBound: true,
    provenanceIdentitiesUnique: true,
    transformVersionBound: true,
    transformStepIdsUnique: true,
    packSubjectFingerprintBound: true,
    verificationEvidenceSubjectBound: true,
    verificationTruth: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
    signatureProfile: "PENDING_D026",
    activationStrategy: "PENDING_APPROVED_STRATEGY",
    activationCommitted: false,
    signatureAlgorithmSelected: false,
    trustRootSelected: false,
    licenseDistributionAuthorized: false,
    filesystemReads: 0,
    filesystemWrites: 0,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeApiCalls: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  restoreReconcileObservationContract: Object.freeze({
    eventId: "EVT-20260813-008",
    subjectId: "restore-reconcile-observation-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F19",
    requirementId: "REQ-F19",
    acceptanceId: "AT-F19",
    topLevelTests: 21,
    fullSuitePassed: 718,
    structuredGenerationObservations: true,
    generationObservationFingerprintBound: true,
    restoreObservationFingerprintBound: true,
    restoreIntentFingerprintBound: true,
    strictPlainBoundary: true,
    generationObservationBudgetBound: true,
    keyUnavailableFailsClosed: true,
    intentKeepsWritesClosed: true,
    actionPlanObservationBound: true,
    actionPlanEffectsCommitted: false,
    reobservationRequiredBeforeWrites: true,
    cleanupAuthorized: false,
    assertionTruth: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
    cryptoProfile: "PENDING_D027",
    restoreMode: "PENDING_D030",
    plaintextExport: "PENDING_D035",
    cryptographicVerificationPerformed: false,
    filesystemReads: 0,
    filesystemWrites: 0,
    keychainReads: 0,
    keychainWrites: 0,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeApiCalls: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  wipeOutcomeEvidenceContract: Object.freeze({
    eventId: "EVT-20260813-009",
    subjectId: "wipe-outcome-evidence-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F18",
    requirementId: "REQ-F18",
    acceptanceId: "AT-F18",
    topLevelTests: 41,
    fullSuitePassed: 722,
    strictPassiveOutcomeBoundary: true,
    outcomeResourceBudgetBound: true,
    evidenceIdentityRequired: true,
    effectFingerprintBound: true,
    observationFingerprintBound: true,
    outcomeFingerprintBound: true,
    crossEffectReplayRejected: true,
    legacyNakedOutcomeRejected: true,
    statusErrorSemanticsBound: true,
    assertionTruth: "CALLER_ASSERTED_NOT_VERIFIED_BY_HARNESS",
    externalFilesScope: "OUT_OF_SCOPE",
    realContainerEmptinessVerified: false,
    realSecretInvalidationVerified: false,
    realNotificationRemovalVerified: false,
    filesystemReads: 0,
    filesystemWrites: 0,
    keychainReads: 0,
    keychainWrites: 0,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeApiCalls: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  aiProviderPolicyAuthorizationContract: Object.freeze({
    eventId: "EVT-20260813-010",
    subjectId: "ai-provider-policy-authorization-contract",
    contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureIds: Object.freeze(["F01", "F02"]),
    requirementIds: Object.freeze(["REQ-F01", "REQ-F02"]),
    acceptanceIds: Object.freeze(["AT-F01", "AT-F02"]),
    topLevelTests: 22,
    fullSuitePassed: 739,
    strictProviderPolicyProfile: true,
    policyEvidenceReferencesBound: true,
    riskSemanticsBound: true,
    policyValidityWindowBound: true,
    exactRequestSubjectBound: true,
    providerOriginModelPayloadProfileRegionBound: true,
    subjectFingerprintBound: true,
    profileFingerprintBound: true,
    authorizationFingerprintBound: true,
    appleProhibitedUseBlocked: true,
    labelPreviewSubjectBound: true,
    legacyPlainAllowRejected: true,
    d053DecisionState: "CANDIDATE",
    d053Authorization: "NOT_AUTHORIZED",
    matchingAllowStillBlocked: true,
    policyTruth: "CALLER_POLICY_ASSERTION_NOT_PROVIDER_TRUTH",
    networkRequests: 0,
    authorizationReads: 0,
    sensitiveBodySerializations: 0,
    keychainReads: 0,
    businessWrites: 0,
    systemClockRead: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  aiResponseContract: Object.freeze({
    eventId: "EVT-20260814-014",
    subjectId: "ai-response-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureIds: Object.freeze(["F01", "F02"]),
    requirementIds: Object.freeze(["REQ-F01", "REQ-F02"]),
    acceptanceIds: Object.freeze(["AT-F01", "AT-F02"]),
    topLevelTests: 16,
    fullSuitePassed: 752,
    untrustedResponseBoundary: true,
    duplicateJsonKeysRejected: true,
    trailingDataRejected: true,
    nonEmptyCandidateSetRequired: true,
    exactCandidateSchema: true,
    normalizedSafeLabels: true,
    resourceBudgetsBound: true,
    unsafeNumbersRejected: true,
    semanticResponseFingerprintBound: true,
    passiveStateSnapshotBound: true,
    errorContentNotReflected: true,
    candidateAuthority: "UNCONFIRMED_EDITABLE_REFERENCE_ONLY",
    schemaAuthority: "TEST_CONTRACT_NOT_FORMAL_PROVIDER_API",
    persistenceAuthorized: false,
    policyAuthorizationGranted: false,
    keychainReads: 0,
    sensitiveBodySerializations: 0,
    realNetworkRequests: 0,
    filesystemWrites: 0,
    businessWrites: 0,
    systemClockRead: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  aiCandidateResponseEvidenceV2Contract: Object.freeze({
    eventId: "EVT-20260814-015",
    subjectId: "ai-candidate-response-evidence-v2-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureIds: Object.freeze(["F01", "F02"]),
    requirementIds: Object.freeze(["REQ-F01", "REQ-F02"]),
    acceptanceIds: Object.freeze(["AT-F01", "AT-F02"]),
    topLevelTests: 22,
    fullSuitePassed: 755,
    stateSchemaVersion: "AI_CANDIDATE_CONFIRMATION_STATE_V2",
    reviewEvidenceSchemaVersion: "AI_CANDIDATE_REVIEW_EVIDENCE_V2",
    confirmedRecordSchemaVersion: "AI_CONFIRMED_RECORD_V2",
    sourceEvidenceSchemaVersion: "AI_CONFIRMED_SOURCE_EVIDENCE_V2",
    commandSchemaVersion: "AI_CONFIRMED_RECORD_COMMAND_V2",
    receiptSchemaVersion: "AI_CONFIRMED_RECORD_RECEIPT_V2",
    completeResponseFingerprintBound: true,
    unselectedCandidateChangeDetected: true,
    responseFingerprintBoundToReview: true,
    responseFingerprintPersistedAsEvidence: true,
    candidateFingerprintStillBound: true,
    confirmedValueFingerprintStillBound: true,
    legacyV1EvidenceRejected: true,
    rawResponsePersisted: false,
    candidateContentPersisted: false,
    automaticDiaryOrTargetMutation: false,
    persistentRepositoryImplemented: false,
    systemClockRead: false,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  aiRequestEvidenceContextV2Contract: Object.freeze({
    eventId: "EVT-20260814-016",
    subjectId: "ai-request-evidence-context-v2-contract",
    contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureIds: Object.freeze(["F01", "F02", "F16"]),
    requirementIds: Object.freeze(["REQ-F01", "REQ-F02", "REQ-F16"]),
    acceptanceIds: Object.freeze(["AT-F01", "AT-F02", "AT-F16"]),
    sharedContextTopLevelTests: 7,
    candidateTopLevelTests: 22,
    guidanceTopLevelTests: 12,
    fullSuitePassed: 763,
    contextInputSchemaVersion: "AI_REQUEST_EVIDENCE_CONTEXT_INPUT_V2",
    contextSchemaVersion: "AI_REQUEST_EVIDENCE_CONTEXT_V2",
    contextBoundarySchemaVersion: "AI_REQUEST_EVIDENCE_BOUNDARY_V1",
    candidateStateSchemaVersion: "AI_CANDIDATE_CONFIRMATION_STATE_V3",
    candidateReviewSchemaVersion: "AI_CANDIDATE_REVIEW_EVIDENCE_V3",
    confirmedRecordSchemaVersion: "AI_CONFIRMED_RECORD_V3",
    confirmedSourceSchemaVersion: "AI_CONFIRMED_SOURCE_EVIDENCE_V3",
    confirmedCommandSchemaVersion: "AI_CONFIRMED_RECORD_COMMAND_V3",
    confirmedReceiptSchemaVersion: "AI_CONFIRMED_RECORD_RECEIPT_V3",
    guidanceStateSchemaVersion: "AI_GUIDANCE_REFERENCE_STATE_V2",
    guidanceSourceSchemaVersion: "AI_GUIDANCE_SOURCE_EVIDENCE_V2",
    exactPolicySubjectBound: true,
    completePolicyProfileBound: true,
    d053AuthorizationEvidenceBound: true,
    policyCheckEvidenceBound: true,
    scopeMatchedRequired: true,
    profileStateAllowsRequired: true,
    appleProhibitedUseAbsentRequired: true,
    onlyRemainingPolicyGate: "D053_NOT_AUTHORIZED",
    evidenceKind: "CALLER_SUPPLIED_UNTRUSTED_RESPONSE_FIXTURE",
    transportOccurrence: "NOT_ESTABLISHED",
    sendAuthorization: "NOT_GRANTED",
    downstreamUse: "PROVENANCE_ONLY",
    legacyRequestContextV1Rejected: true,
    legacyCandidateV1V2Rejected: true,
    legacyGuidanceV1Rejected: true,
    rawResponsePersisted: false,
    candidateContentPersisted: false,
    keychainReads: 0,
    sensitiveBodySerializations: 0,
    realNetworkRequests: 0,
    businessWritesBeforeUserConfirmation: 0,
    systemClockRead: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  aiConfigurationPolicyPreflightContract: Object.freeze({
    eventId: "EVT-20260814-017",
    subjectId: "ai-configuration-policy-preflight-contract",
    contractStatus: "SPIKE / LOCAL_ONLY / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureIds: Object.freeze(["F01", "F02"]),
    requirementIds: Object.freeze(["REQ-F01", "REQ-F02"]),
    acceptanceIds: Object.freeze(["AT-F01", "AT-F02"]),
    topLevelTests: 8,
    fullSuitePassed: 777,
    configurationEvidenceSchemaVersion: "AI_ACTIVE_CONFIGURATION_EVIDENCE_V1",
    preflightResultSchemaVersion: "AI_CONFIGURATION_POLICY_PREFLIGHT_RESULT_V1",
    preflightBoundarySchemaVersion: "AI_CONFIGURATION_POLICY_PREFLIGHT_BOUNDARY_V1",
    stableConfiguredStateRequired: true,
    nonSensitiveConfigurationEvidenceOnly: true,
    configurationEvidenceFingerprintBound: true,
    requestContextFingerprintBound: true,
    policyEvidenceFingerprintsBound: true,
    baseUrlOriginModelCompared: true,
    exactConfigurationMatchAuthorizesSend: false,
    providerIdentityBoundToConfiguration: false,
    disposition: "BLOCKED",
    requiredBlockers: Object.freeze([
      "PROVIDER_IDENTITY_NOT_BOUND_TO_CONFIGURATION",
      "D033_CONFIRMATION_SCOPE_NOT_EVALUATED",
      "D034_RESOURCE_PROFILE_NOT_AUTHORIZED",
      "D036_TRANSPORT_PROFILE_NOT_AUTHORIZED",
      "D053_NOT_AUTHORIZED",
    ]),
    sendAuthorization: "NOT_GRANTED",
    credentialMaterialReads: 0,
    authorizationHeadersBuilt: 0,
    sensitiveBodySerializations: 0,
    transportsCreated: 0,
    realNetworkRequests: 0,
    businessWrites: 0,
    systemClockRead: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  sdk57JsSpikeVerification: Object.freeze({
    eventId: "EVT-20260814-018",
    subjectId: "sdk57-js-spike-verification",
    state: "completed",
    workingTreeBase: "8c49cf9a3318ca46ae6b731e9e64f9e24c18b557",
    decisionId: "D-032",
    decisionStatus: "CANDIDATE",
    authorization: "SPIKE_AUTHORIZED",
    scope: "ISOLATED_JS_SPIKE",
    hostOs: "WINDOWS",
    nodeVersion: "22.13.0",
    pnpmVersion: "11.18.0",
    lockfileFrozen: true,
    lockfileSha256: "97fadee6f3f7d67c295f3fdab2319c67c7a98390a4e4f041ce0b4afc837798d3",
    contractCheckPassed: true,
    typecheckPassed: true,
    expoConfigPassed: true,
    expoDoctorChecksPassed: 20,
    expoDoctorChecksTotal: 20,
    androidExportPassed: true,
    androidBundleModules: 1232,
    androidBundleFiles: 29,
    androidBundleBytes: 3632083,
    androidBundleSha256: "98c8ec5c1c22e747f903010ea97bd889015eb8c4477e56ef85603593cd193fb2",
    resolvedExpoVersion: "57.0.12",
    resolvedExpoRouterVersion: "57.0.12",
    resolvedReactNativeVersion: "0.86.2",
    resolvedReactVersion: "19.2.3",
    repositoryFullSuitePassed: 778,
    projectOpsValidationTestsPassed: 117,
    nativeDirectoriesGenerated: false,
    prebuildRun: false,
    nativeIosEvidence: false,
    formalRootProjectAuthorized: false,
    decisionAccepted: false,
    ownerSecondActionStillRequired: true,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  sdk57JsDependencySurface: Object.freeze({
    eventId: "EVT-20260814-019",
    subjectId: "sdk57-js-dependency-surface-verification",
    state: "completed",
    workingTreeBase: "0669509959eeeba458080f658f80ca0f14f1339e",
    decisionId: "D-032",
    decisionStatus: "CANDIDATE",
    authorization: "SPIKE_AUTHORIZED",
    scope: "SDK57_JS_DEPENDENCY_SURFACE",
    requiredPackages: Object.freeze([
      "expo-sqlite",
      "expo-secure-store",
      "expo-camera",
      "expo-notifications",
      "react-native-reanimated",
      "react-native-worklets",
    ]),
    requiredPlugins: Object.freeze([
      "expo-sqlite",
      "expo-secure-store",
      "expo-camera",
      "expo-notifications",
    ]),
    runtimeSymbols: Object.freeze([
      "expo-sqlite:openDatabaseAsync",
      "expo-secure-store:getItemAsync",
      "expo-camera:CameraView",
      "expo-notifications:getPermissionsAsync",
      "react-native-reanimated:Animated.View",
      "react-native-worklets:isWorkletFunction",
    ]),
    typescriptResolutionPassed: true,
    metroResolutionPassed: true,
    expoDoctorChecksPassed: 20,
    expoDoctorChecksTotal: 20,
    androidBundleModules: 1652,
    androidBundleFiles: 29,
    androidBundleBytes: 4758497,
    androidBundleSha256: "a48e69f982a0b2800a42c8feae765e6455a4d0eb94d11114995b01fe1c3863c0",
    lockfileSha256: "97fadee6f3f7d67c295f3fdab2319c67c7a98390a4e4f041ce0b4afc837798d3",
    repositoryFullSuitePassed: 779,
    projectOpsValidationTestsPassed: 118,
    nativeApiCalls: 0,
    permissionRequests: 0,
    databaseOpens: 0,
    keychainReads: 0,
    notificationCalls: 0,
    workletExecutions: 0,
    networkRequests: 0,
    nativeRuntimeEvidence: false,
    nativeDirectoriesGenerated: false,
    prebuildRun: false,
    formalRootProjectAuthorized: false,
    decisionAccepted: false,
    ownerSecondActionStillRequired: true,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  sdk57IosJavaScriptExport: Object.freeze({
    eventId: "EVT-20260814-020",
    subjectId: "sdk57-ios-javascript-export-verification",
    state: "completed",
    workingTreeBase: "ad7b425bc745278f00b22e429597965421b3f7d9",
    decisionId: "D-032",
    decisionStatus: "CANDIDATE",
    authorization: "SPIKE_AUTHORIZED",
    scope: "SDK57_IOS_JAVASCRIPT_EXPORT",
    hostOs: "WINDOWS",
    nodeVersion: "22.13.0",
    pnpmVersion: "11.18.0",
    dependencySurfaceEventId: "EVT-20260814-019",
    requiredPackageCount: 6,
    iosPlatformConditionResolutionPassed: true,
    iosJavaScriptBundleEvidence: true,
    iosBundleModules: 1565,
    iosBundleFiles: 25,
    iosBundleBytes: 3597734,
    iosHermesBundleBytes: 3572985,
    iosBundleSha256: "c19e98e3a8701f43efbe7b437b555873ae04e81be0d04f8982f7a14fde89f1f7",
    iosBundleSha256Scope: "RECORDED_EXPORT_RUN_ONLY",
    repeatedExportRuns: 3,
    repeatedExportShapeStable: true,
    repeatedExportByteIdentical: false,
    observedIosBundleSha256Count: 3,
    lockfileSha256: "97fadee6f3f7d67c295f3fdab2319c67c7a98390a4e4f041ce0b4afc837798d3",
    expoDoctorChecksPassed: 20,
    expoDoctorChecksTotal: 20,
    repositoryFullSuitePassed: 780,
    projectOpsValidationTestsPassed: 119,
    nativeDirectoriesGenerated: false,
    prebuildRun: false,
    xcodeUsed: false,
    cocoaPodsUsed: false,
    podInstallRun: false,
    nativeCompilationRun: false,
    iosSimulatorRun: false,
    iosDeviceRun: false,
    signedArchiveProduced: false,
    nativeRuntimeEvidence: false,
    nativeIosEvidence: false,
    formalRootProjectAuthorized: false,
    decisionAccepted: false,
    ownerSecondActionStillRequired: true,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  sdk57IosExportStructureVerifier: Object.freeze({
    eventId: "EVT-20260814-021",
    subjectId: "sdk57-ios-javascript-export-structure-verifier",
    state: "completed",
    workingTreeBase: "772033473f28e8ac449952825a0280d0c0ed87d2",
    decisionId: "D-032",
    decisionStatus: "CANDIDATE",
    authorization: "SPIKE_AUTHORIZED",
    scope: "SDK57_IOS_JAVASCRIPT_EXPORT_STRUCTURE_VERIFIER",
    hostOs: "WINDOWS",
    nodeVersion: "22.13.0",
    pnpmVersion: "11.18.0",
    previousExportEventId: "EVT-20260814-020",
    exportCommandIntegrated: true,
    exportCommandPassed: true,
    verifierRanPostExport: true,
    verifierUnitTestsPassed: 5,
    iosOnlyMetadataRequired: true,
    metroBundlerRequired: true,
    metadataVersion: 0,
    hermesBundleFiles: 1,
    declaredAssetFiles: 23,
    totalFiles: 25,
    recordedRunBundleBytes: 3572986,
    recordedRunTotalBytes: 3597735,
    bundleBytesUsedAsGate: false,
    bundleSha256UsedAsGate: false,
    fingerprintPolicy: "RUN_SPECIFIC_NOT_REPRODUCIBILITY_GATE",
    exactMetadataFileSetRequired: true,
    additionalPlatformsRejected: true,
    pathTraversalRejected: true,
    undeclaredFilesRejected: true,
    nativeDirectoriesRejected: true,
    subsequentRunShapeMatchedPrevious: false,
    subsequentRunTotalBytesDelta: 1,
    repositoryFullSuitePassed: 786,
    projectOpsValidationTestsPassed: 120,
    nativeDirectoriesGenerated: false,
    prebuildRun: false,
    xcodeUsed: false,
    cocoaPodsUsed: false,
    nativeCompilationRun: false,
    iosSimulatorRun: false,
    iosDeviceRun: false,
    signedArchiveProduced: false,
    nativeRuntimeEvidence: false,
    nativeIosEvidence: false,
    reproducibleBuildEvidence: false,
    formalRootProjectAuthorized: false,
    decisionAccepted: false,
    ownerSecondActionStillRequired: true,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  sdk57AndroidExportStructureVerifier: Object.freeze({
    eventId: "EVT-20260814-022",
    subjectId: "sdk57-android-javascript-export-structure-verifier",
    state: "completed",
    workingTreeBase: "890db04594603a4e174ef6fba8fa6106f9bd8cdc",
    decisionId: "D-032",
    decisionStatus: "CANDIDATE",
    authorization: "SPIKE_AUTHORIZED",
    scope: "SDK57_ANDROID_JAVASCRIPT_EXPORT_STRUCTURE_VERIFIER",
    hostOs: "WINDOWS",
    nodeVersion: "22.13.0",
    pnpmVersion: "11.18.0",
    previousIosVerifierEventId: "EVT-20260814-021",
    previousAndroidExportEventId: "EVT-20260814-019",
    sharedPlatformVerifierCore: true,
    androidExportCommandIntegrated: true,
    androidExportCommandPassed: true,
    verifierRanPostExport: true,
    platformVerifierUnitTestsPassed: 10,
    androidVerifierUnitTestsPassed: 5,
    iosVerifierRegressionTestsPassed: 5,
    androidOnlyMetadataRequired: true,
    metroBundlerRequired: true,
    metadataVersion: 0,
    allowedAssetExtensions: "png,ttf,xml",
    hermesBundleFiles: 1,
    declaredAssetFiles: 27,
    totalFiles: 29,
    recordedRunBundleBytes: 3771576,
    recordedRunTotalBytes: 4758495,
    bundleBytesUsedAsGate: false,
    bundleSha256UsedAsGate: false,
    fingerprintPolicy: "RUN_SPECIFIC_NOT_REPRODUCIBILITY_GATE",
    exactMetadataFileSetRequired: true,
    additionalPlatformsRejected: true,
    assetPolicyViolationsRejected: true,
    pathTraversalSharedCore: true,
    undeclaredFilesRejected: true,
    nativeDirectoriesRejected: true,
    previousRecordedTotalBytes: 4758497,
    recordedRunTotalBytesDelta: -2,
    repositoryFullSuitePassed: 792,
    projectOpsValidationTestsPassed: 121,
    nativeDirectoriesGenerated: false,
    prebuildRun: false,
    nativeCompilationRun: false,
    androidEmulatorRun: false,
    androidDeviceRun: false,
    signedArtifactProduced: false,
    nativeRuntimeEvidence: false,
    nativeAndroidEvidence: false,
    reproducibleBuildEvidence: false,
    formalRootProjectAuthorized: false,
    decisionAccepted: false,
    ownerSecondActionStillRequired: true,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  mediaPermissionOrchestratorContract: Object.freeze({
    eventId: "EVT-20260812-013",
    subjectId: "media-permission-orchestrator-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F21",
    requirementId: "REQ-F21",
    acceptanceId: "AT-F21",
    topLevelTests: 19,
    fullSuitePassed: 525,
    callerOwnedVersionedTaskDefinition: true,
    manualFallbackRequiredForCamera: true,
    taskExplanationBeforeCameraEffect: true,
    lateOutcomeRejected: true,
    cameraPermissionScope: "CURRENT_USER_TRIGGERED_TASK_ONLY",
    photoLibraryPermission: "NOT_REQUESTED_USE_SYSTEM_USER_SELECTION",
    videoCapture: "NOT_AUTHORIZED",
    locationPermission: "NOT_AUTHORIZED",
    mediaRetention: "D031_NOT_AUTHORIZED",
    mediaPersistence: "NOT_AUTHORIZED",
    permissionCopyAuthorized: false,
    nativeApiCalls: 0,
    realNetworkRequests: 0,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  prohibitedCapabilityAuditContract: Object.freeze({
    eventId: "EVT-20260812-014",
    subjectId: "prohibited-capability-audit-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureIds: Object.freeze(["F20", "F23", "F24"]),
    requirementIds: Object.freeze(["REQ-F20", "REQ-F23", "REQ-F24"]),
    acceptanceIds: Object.freeze(["AT-F20", "AT-F23", "AT-F24"]),
    topLevelTests: 18,
    fullSuitePassed: 544,
    capabilityCount: 3,
    requiredEvidenceSurfaces: 27,
    formalSignedReleaseTargetRequired: true,
    formalSignedReleaseTargetPresent: false,
    currentAuditDisposition: "BLOCKED",
    currentBlockers: Object.freeze(["FORMAL_TARGET_ABSENT", "REQUIRED_SURFACE_MISSING"]),
    workingTreeAbsenceIsPass: false,
    everyRequiredSurfaceExecuted: false,
    productionArtifactScansExecuted: 0,
    releaseNetworkCapturesExecuted: 0,
    runtimePermissionCapturesExecuted: 0,
    prohibitedCapabilityFindings: "NOT_EVALUATED_NO_FORMAL_TARGET",
    evidenceTruthVerified: false,
    releaseGateClosed: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  platformLanguageReleaseAuditContract: Object.freeze({
    eventId: "EVT-20260812-015",
    subjectId: "platform-language-release-audit-contract",
    contractStatus: "SPIKE / FRAMEWORK_AGNOSTIC / NON_PRODUCTION",
    artifactState: "WORKING_TREE_UNCOMMITTED",
    featureId: "F22",
    requirementId: "REQ-F22",
    acceptanceId: "AT-F22",
    topLevelTests: 20,
    fullSuitePassed: 565,
    acceptedMinimumOsVersion: "17.0",
    acceptedPrimaryReleaseLanguage: "zh-Hans",
    appAuthoredUiLanguageScope: "ZH_HANS_ONLY",
    acceptedBaselineDecisionIds: Object.freeze(["D-011", "D-016"]),
    platformShapeDimensions: Object.freeze(["DEVICE_FAMILIES", "ORIENTATIONS", "MAC_APP_AVAILABILITY", "VISION_PRO_APP_AVAILABILITY"]),
    acceptedPlatformShapeDecisions: 0,
    platformShapeDecisionIds: Object.freeze([]),
    platformShapeInferredFromD038OrCurrentDevice: false,
    requiredEvidenceSurfaces: 25,
    formalSignedReleaseTargetRequired: true,
    formalSignedReleaseTargetPresent: false,
    releaseEvidenceExecuted: 0,
    currentAuditDisposition: "BLOCKED",
    currentBlockers: Object.freeze(["FORMAL_TARGET_ABSENT", "PLATFORM_SHAPE_DECISION_REQUIRED", "REQUIRED_SURFACE_MISSING"]),
    decisionTruthVerified: false,
    evidenceTruthVerified: false,
    releaseGateClosed: false,
    nativeImplementationAuthorized: false,
    formalImplementationAuthorized: false,
    gateStatesChanged: false,
    ownerIntakeChanged: false,
  }),
  d039: Object.freeze({
    eventId: "EVT-20260805-005",
    subjectId: "D-039-PX-2",
    from: "PX-2_INDEPENDENT_RETEST_PENDING",
    to: "PX-2_PASS",
    next: "READY_FOR_OWNER_REVIEW",
    decisionState: "CANDIDATE",
    ownerChoiceRecorded: false,
    formalImplementationAuthorized: false,
    accepted: Object.freeze({
      eventId: "EVT-20260815-001",
      subjectId: "D-039",
      correlationId: "d039-owner-choice",
      decisionId: "D-039",
      questionId: "d039_add_meal_entry",
      optionKey: "A",
      choiceKey: "local-search-recent-first",
      acceptedOn: "2026-08-15",
      status: "ACCEPTED",
      captureChannel: "CODEX_TEXT_REPLY",
      prototypeState: "PX-2_PASS",
      px3OwnerGatePassed: true,
      ownerChoiceRecorded: true,
      next: "PX-4_BASELINE_REQUIRED",
      formalImplementationAuthorized: false,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      px5ImplementationDorSatisfied: false,
      d032SecondOwnerActionSatisfied: false,
      d053AuthorizationChanged: false,
    }),
    px4: Object.freeze({
      eventId: "EVT-20260815-002",
      subjectId: "D-039-PX-4",
      correlationId: "d039-design-baseline",
      from: "PX-4_BASELINE_REQUIRED",
      to: "PX-4_BASELINE_FROZEN",
      next: "PX-5_DOR_REQUIRED",
      decisionId: "D-039",
      choiceKey: "local-search-recent-first",
      selectedOption: "A",
      ownerChoiceEventId: "EVT-20260815-001",
      px2EventId: "EVT-20260805-005",
      designBaselineRef: "docs/03-design/d039-px4-design-baseline.md",
      firstLayerPrimary: Object.freeze(["LOCAL_SEARCH", "RECENT"]),
      firstLayerAuxiliary: Object.freeze(["BARCODE_SCAN", "AI_ASSISTED"]),
      explicitFallback: "CREATE_USER_FOOD",
      productReviewPassed: true,
      architectureReviewPassed: true,
      securityReviewPassed: true,
      qaReviewPassed: true,
      designBaselineFrozen: true,
      px5ImplementationDorSatisfied: false,
      formalImplementationAuthorized: false,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      d032SecondOwnerActionSatisfied: false,
      d053AuthorizationChanged: false,
    }),
    px5Assessment: Object.freeze({
      eventId: "EVT-20260815-005",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D-039-PX-5",
      subjectRole: "PrototypeGate",
      correlationId: "d039-px5-dor-assessment",
      state: "completed",
      disposition: "NOT_READY",
      decisionId: "D-039",
      selectedOption: "A",
      choiceKey: "local-search-recent-first",
      designBaselineState: "PX-4_BASELINE_FROZEN",
      from: "PX-5_DOR_REQUIRED",
      to: "PX-5_DOR_NOT_READY",
      next: "PX-5_BLOCKER_CLOSURE_REQUIRED",
      requirementsCount: 7,
      passedCount: 1,
      partialCount: 3,
      failedCount: 3,
      openBlockerIds: Object.freeze([
        "D039-PX5-B01", "D039-PX5-B02", "D039-PX5-B03", "D039-PX5-B04",
        "D039-PX5-B05", "D039-PX5-B06", "D039-PX5-B07",
      ]),
      openBlockerCount: 7,
      locallyCloseableBlockerIds: Object.freeze(["D039-PX5-B01", "D039-PX5-B02"]),
      ownerDependentBlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05", "D039-PX5-B06",
      ]),
      environmentDependentBlockerIds: Object.freeze(["D039-PX5-B07"]),
      acceptedPrerequisiteDecisionIds: Object.freeze([
        "D-018", "D-019", "D-020", "D-021", "D-023",
        "D-024", "D-025", "D-037", "D-038", "D-039",
      ]),
      unresolvedDependencyDecisionIds: Object.freeze([
        "D-031", "D-032", "D-033", "D-034", "D-036", "D-045", "D-053",
      ]),
      formalAcceptanceMatrixComplete: false,
      stableRouteAndTestIdsMapped: false,
      returnDeepLinkContractComplete: false,
      recentRetentionPolicyResolved: false,
      mediaRetentionPolicyResolved: false,
      aiPayloadConfirmationResolved: false,
      aiResourceBudgetResolved: false,
      aiTransportProfileResolved: false,
      providerAdmissionResolved: false,
      macAvailable: false,
      nativeIntegrationEvidenceComplete: false,
      d032SecondOwnerActionSatisfied: false,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
      ownerIntakeChanged: false,
      decisionStateChanged: false,
    }),
    px5AcceptanceMatrix: Object.freeze({
      eventId: "EVT-20260815-006",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D039-FORMAL-ACCEPTANCE-MATRIX-001",
      subjectRole: "QualityArtifact",
      correlationId: "d039-px5-b01-acceptance-matrix",
      state: "completed",
      decisionId: "D-039",
      decisionState: "ACCEPTED",
      selectedOption: "A",
      designBaselineState: "PX-4_BASELINE_FROZEN",
      px5Disposition: "NOT_READY",
      from: "D039-PX5-B01_OPEN",
      to: "D039-PX5-B01_CLOSED",
      next: "D039-PX5-B02_REQUIRED",
      acceptanceCaseCount: 24,
      acceptanceCaseIds: Object.freeze(
        Array.from({ length: 24 }, (_, index) => `D039-AC-${String(index + 1).padStart(3, "0")}`),
      ),
      prototypeFlowCount: 19,
      selectedVariantOnly: true,
      nonSelectedVariantsExcluded: true,
      conditionalCasesMarked: true,
      businessWriteAssertionsExplicit: true,
      networkAssertionsExplicit: true,
      accessibilityAssertionsExplicit: true,
      formalAcceptanceMatrixComplete: true,
      closedBlockerIds: Object.freeze(["D039-PX5-B01"]),
      remainingOpenBlockerIds: Object.freeze([
        "D039-PX5-B02", "D039-PX5-B03", "D039-PX5-B04",
        "D039-PX5-B05", "D039-PX5-B06", "D039-PX5-B07",
      ]),
      remainingOpenBlockerCount: 6,
      locallyCloseableBlockerIds: Object.freeze(["D039-PX5-B02"]),
      ownerDependentBlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05", "D039-PX5-B06",
      ]),
      environmentDependentBlockerIds: Object.freeze(["D039-PX5-B07"]),
      stableRouteAndTestIdsMapped: false,
      returnDeepLinkContractComplete: false,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
      ownerIntakeChanged: false,
      decisionStateChanged: false,
    }),
    px5RouteContract: Object.freeze({
      eventId: "EVT-20260815-007",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D039-ROUTE-OBSERVABILITY-CONTRACT-001",
      subjectRole: "QualityArtifact",
      correlationId: "d039-px5-b02-route-observability-contract",
      state: "completed",
      decisionId: "D-039",
      decisionState: "ACCEPTED",
      selectedOption: "A",
      designBaselineState: "PX-4_BASELINE_FROZEN",
      px5Disposition: "NOT_READY",
      from: "D039-PX5-B02_OPEN",
      to: "D039-PX5-B02_CLOSED",
      next: "D039-PX5-OWNER_DEPENDENCIES_REQUIRED",
      routeContractId: "D039-ROUTE-OBSERVABILITY-CONTRACT-001",
      routeParamSchema: "D039RouteParamsV1",
      returnDescriptorSchema: "D039ReturnDescriptorV1",
      routeIds: Object.freeze([
        "D039-RTE-ENTRY", "D039-RTE-SCAN", "D039-RTE-AI",
        "D039-RTE-CREATE-FOOD", "D039-RTE-REVIEW-SAVE",
      ]),
      routePaths: Object.freeze([
        "/journal/add-meal", "/journal/add-meal/scan", "/journal/add-meal/ai",
        "/journal/add-meal/create-food", "/journal/add-meal/review-save",
      ]),
      routeCount: 5,
      routeParamNames: Object.freeze(["ctx", "candidate"]),
      routeParamsStrictUnknownRejection: true,
      sensitiveBusinessDataInUrl: false,
      externalDeepLinksSupported: false,
      staticTestIdCount: 43,
      dynamicTestIdPatterns: Object.freeze([
        "d039.entry.localSearch.result.item-{n}",
        "d039.entry.recent.item-{n}",
      ]),
      dynamicTestIdPatternCount: 2,
      returnRecoveryCaseIds: Object.freeze([
        "D039-RC-001", "D039-RC-002", "D039-RC-003",
        "D039-RC-004", "D039-RC-005", "D039-RC-006",
      ]),
      returnRecoveryCaseCount: 6,
      testProbeIds: Object.freeze([
        "d039.probe.routeVisible", "d039.probe.focusRestored",
        "d039.probe.businessWriteAttempt", "d039.probe.networkAttempt",
        "d039.probe.permissionAttempt",
      ]),
      releaseProbeNoOpRequired: true,
      formalAcceptanceMatrixComplete: true,
      stableRouteAndTestIdsMapped: true,
      returnDeepLinkContractComplete: true,
      closedBlockerIds: Object.freeze(["D039-PX5-B01", "D039-PX5-B02"]),
      remainingOpenBlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05",
        "D039-PX5-B06", "D039-PX5-B07",
      ]),
      remainingOpenBlockerCount: 5,
      locallyCloseableBlockerIds: Object.freeze([]),
      ownerDependentBlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05", "D039-PX5-B06",
      ]),
      environmentDependentBlockerIds: Object.freeze(["D039-PX5-B07"]),
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
      ownerIntakeChanged: false,
      decisionStateChanged: false,
    }),
    b03B05IndependentReviewPacket: Object.freeze({
      eventId: "EVT-20260821-008",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D039-B03-B05-INDEPENDENT-REVIEW-PACKET-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d039-b03-b05-independent-review-packet",
      state: "completed",
      decisionId: "D-039",
      decisionState: "ACCEPTED",
      selectedOption: "A",
      designBaselineState: "PX-4_BASELINE_FROZEN",
      px5Disposition: "NOT_READY",
      from: "D039_B03_B04_B05_SIX_CARD_SELF_REVIEW_COMPLETE_PACKET_GAP",
      next: "D039-PX5-OWNER_DEPENDENCIES_REQUIRED",
      packetNext: "B03_B05_INPUT_FREEZE_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      inputState: "PACKET_READY_REVIEWERS_UNASSIGNED",
      reviewPacketReady: true,
      reviewPacketVersion: "PACKET-001-R1",
      inputManifestFrozen: false,
      requiredArtifactCount: 10,
      requiredCardCount: 6,
      requiredBlockerCount: 3,
      blockerIds: Object.freeze(["D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05"]),
      cardDecisionIds: Object.freeze(["D-045", "D-031", "D-033", "D-034", "D-036", "D-053"]),
      requiredReviewerDomainCount: 4,
      reviewerDomainIds: Object.freeze([
        "PRODUCT_DECISION_QUALITY",
        "PRIVACY_DATA_INTEGRITY",
        "SECURITY_TRANSPORT_RESOURCE_EVIDENCE",
        "QA_ACCESSIBILITY",
      ]),
      requiredCrossCardInvariantCount: 16,
      allowedCardDispositionCount: 4,
      blockingSeverityIds: Object.freeze(["P0", "P1", "P2"]),
      nonBlockingSeverityId: "P3",
      namedReviewerRequired: true,
      authorOrPmCanSelfApprove: false,
      aiOrAgentCanBeIndependentReviewer: false,
      externalMessageSent: false,
      reviewersAssigned: false,
      reviewerIdentityVerified: false,
      reviewerIndependenceVerified: false,
      conflictOfInterestResolved: false,
      independentReviewStarted: false,
      independentReviewPassed: false,
      currentFindingCountsMeasured: false,
      d034DeviceBenchmarkPassed: false,
      d036Oi07InputComplete: false,
      d036ProviderCompatibilitySpikePassed: false,
      d036NativeBoundaryEvidencePassed: false,
      d053Oi07EvidenceComplete: false,
      d053ProviderEvidenceReady: false,
      d053AppPrivacyMappingApproved: false,
      d045Accepted: false,
      d031Accepted: false,
      d033Accepted: false,
      d034Accepted: false,
      d036Accepted: false,
      d053Accepted: false,
      b03Closed: false,
      b04Closed: false,
      b05Closed: false,
      ownerIntakeChanged: false,
      ownerCardsScheduled: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      d032SecondOwnerActionSatisfied: false,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
    }),
    b03B05InputManifestFreeze: Object.freeze({
      eventId: "EVT-20260821-009",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D039-B03-B05-INPUT-MANIFEST-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d039-b03-b05-independent-review-input-freeze",
      state: "completed",
      decisionId: "D-039",
      decisionState: "ACCEPTED",
      selectedOption: "A",
      designBaselineState: "PX-4_BASELINE_FROZEN",
      px5Disposition: "NOT_READY",
      from: "B03_B05_INPUT_FREEZE_REQUIRED",
      to: "B03_B05_INPUT_MANIFEST_FROZEN",
      next: "D039-PX5-OWNER_DEPENDENCIES_REQUIRED",
      packetNext: "B03_B05_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      reviewPacketReady: true,
      reviewPacketVersion: "PACKET-001-R1",
      inputManifestFrozen: true,
      manifestEntryCount: 10,
      manifestCommit: "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117",
      manifestRecordCommit: "19f2119abcd8ca25bf59b177910a5af1f34e9abb",
      gitBlobOidAlgorithm: "SHA-1",
      canonicalDigestAlgorithm: "SHA-256",
      rawGitBlobBytesUsed: true,
      frozenArtifactRefs: Object.freeze([
        "docs/03-design/d039-px4-design-baseline.md",
        "docs/05-quality/d039-px5-dor-assessment.md",
        "docs/05-quality/d039-formal-acceptance-matrix.md",
        "docs/03-design/d039-route-observability-contract.md",
        "docs/03-design/d045-recent-favorites-card-spec.md",
        "docs/03-design/d031-media-ai-retention-card-spec.md",
        "docs/03-design/d033-nonlabel-ai-confirmation-card-spec.md",
        "docs/03-design/d034-ai-resource-budget-card-spec.md",
        "docs/03-design/d036-ai-transport-profile-card-spec.md",
        "docs/03-design/d053-ai-provider-use-admission-card-spec.md",
      ]),
      sourcePacketCreationEventId: "EVT-20260821-008",
      requiredArtifactCount: 10,
      requiredCardCount: 6,
      requiredBlockerCount: 3,
      blockerIds: Object.freeze(["D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05"]),
      cardDecisionIds: Object.freeze(["D-045", "D-031", "D-033", "D-034", "D-036", "D-053"]),
      requiredReviewerDomainCount: 4,
      reviewerDomainIds: Object.freeze([
        "PRODUCT_DECISION_QUALITY",
        "PRIVACY_DATA_INTEGRITY",
        "SECURITY_TRANSPORT_RESOURCE_EVIDENCE",
        "QA_ACCESSIBILITY",
      ]),
      requiredCrossCardInvariantCount: 16,
      allowedCardDispositionCount: 4,
      blockingSeverityIds: Object.freeze(["P0", "P1", "P2"]),
      nonBlockingSeverityId: "P3",
      namedReviewerRequired: true,
      authorOrPmCanSelfApprove: false,
      aiOrAgentCanBeIndependentReviewer: false,
      externalMessageSent: false,
      reviewersAssigned: false,
      reviewerIdentityVerified: false,
      reviewerIndependenceVerified: false,
      conflictOfInterestResolved: false,
      independentReviewStarted: false,
      independentReviewPassed: false,
      currentFindingCountsMeasured: false,
      d034DeviceBenchmarkPassed: false,
      d036Oi07InputComplete: false,
      d036ProviderCompatibilitySpikePassed: false,
      d036NativeBoundaryEvidencePassed: false,
      d053Oi07EvidenceComplete: false,
      d053ProviderEvidenceReady: false,
      d053AppPrivacyMappingApproved: false,
      d045Accepted: false,
      d031Accepted: false,
      d033Accepted: false,
      d034Accepted: false,
      d036Accepted: false,
      d053Accepted: false,
      b03Closed: false,
      b04Closed: false,
      b05Closed: false,
      ownerIntakeChanged: false,
      ownerCardsScheduled: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      d032SecondOwnerActionSatisfied: false,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
    }),
    findingsClosed: Object.freeze(
      Array.from(
        { length: 10 },
        (_, index) => `D039-QA-${String(index + 1).padStart(3, "0")}`,
      ),
    ),
  }),
  d045: Object.freeze({
    cardSpec: Object.freeze({
      eventId: "EVT-20260815-008",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D045-RECENT-FAVORITES-CARD-001",
      subjectRole: "CandidateProductArtifact",
      correlationId: "d045-recent-favorites-card-spec",
      state: "completed",
      decisionId: "D-045",
      decisionState: "CANDIDATE",
      d039BlockerId: "D039-PX5-B03",
      d039BlockerState: "OPEN",
      from: "D045_CARD_SPEC_REQUIRED",
      next: "D045_INDEPENDENT_REVIEW_REQUIRED",
      cardState: "DRAFT_COMPLETE",
      questionId: "d045_recent_favorites_scope",
      optionIds: Object.freeze([
        "recent_only_derived",
        "recent_and_favorites_separate",
        "defer_both_reopen_d039",
      ]),
      optionCount: 3,
      recommendedOptionId: "recent_only_derived",
      allOptionsMutuallyExclusive: true,
      completePolicyPackages: true,
      recentCandidateLimit: 20,
      recentDerivedFromCommittedMeals: true,
      recentCopiesFoodOrNutritionPayload: false,
      clearWatermarkUsesJournalRevision: true,
      clearRecentDeletesDiary: false,
      recentAndFavoritesSeparated: true,
      fullDataDeletionCoversAuxiliaryState: true,
      deletedObjectsCannotBeResurrected: true,
      d039ReopenImpactExplicit: true,
      otherRequiresNormalization: true,
      productSelfReviewPassed: true,
      privacySelfReviewPassed: true,
      dataIntegritySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      ownerCardScheduled: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      d045RegisteredInDecisionLedger: false,
      d045RecordedInOwnerIntake: false,
      closedD039BlockerIds: Object.freeze(["D039-PX5-B01", "D039-PX5-B02"]),
      remainingOpenD039BlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05",
        "D039-PX5-B06", "D039-PX5-B07",
      ]),
      remainingOpenD039BlockerCount: 5,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
      ownerIntakeChanged: false,
      d039DecisionStateChanged: false,
    }),
  }),
  d031: Object.freeze({
    cardSpec: Object.freeze({
      eventId: "EVT-20260817-001",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D031-MEDIA-AI-RETENTION-CARD-001",
      subjectRole: "CandidateProductArtifact",
      correlationId: "d031-media-ai-retention-card-spec",
      state: "completed",
      decisionId: "D-031",
      decisionState: "CANDIDATE",
      d039BlockerId: "D039-PX5-B04",
      d039BlockerState: "OPEN",
      from: "D031_CARD_SPEC_REQUIRED",
      next: "D031_INDEPENDENT_REVIEW_REQUIRED",
      cardState: "DRAFT_COMPLETE",
      questionId: "d031_media_ai_retention",
      optionIds: Object.freeze([
        "compressed_attachment_ephemeral_ai",
        "no_persistent_media_ephemeral_ai",
        "per_item_original_and_validated_history",
      ]),
      optionCount: 3,
      recommendedOptionId: "compressed_attachment_ephemeral_ai",
      allOptionsMutuallyExclusive: true,
      completePolicyPackages: true,
      acquisitionDoesNotAuthorizeRetention: true,
      sourceLibraryAssetNeverDeleted: true,
      workingCopiesSanitized: true,
      workingCopiesVolatileUntilExplicitCommit: true,
      rawProviderResponsePersisted: false,
      structuredConfirmedBusinessValueAllowed: true,
      optionAPersistentMedia: "USER_EXPLICIT_SANITIZED_COMPRESSED_ATTACHMENT_ONLY",
      optionBPersistentMedia: "NONE",
      optionCPerItemRetentionRequired: true,
      persistentMediaIncludedInEncryptedBackup: true,
      backupSizeDisclosureRequired: true,
      fullDataDeletionCoversRetainedMediaAndAiHistory: true,
      externalFilesAndPhotoLibraryCopiesOutOfScope: true,
      unknownCommitRequiresSameCommandReconciliation: true,
      startupStagingReconciliationRequired: true,
      otherRequiresNormalization: true,
      productSelfReviewPassed: true,
      privacySecuritySelfReviewPassed: true,
      dataIntegritySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      ownerCardScheduled: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      d031RegisteredInDecisionLedger: false,
      d031RecordedInOwnerIntake: false,
      closedD039BlockerIds: Object.freeze(["D039-PX5-B01", "D039-PX5-B02"]),
      remainingOpenD039BlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05",
        "D039-PX5-B06", "D039-PX5-B07",
      ]),
      remainingOpenD039BlockerCount: 5,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
      ownerIntakeChanged: false,
      d039DecisionStateChanged: false,
    }),
  }),
  d033: Object.freeze({
    cardSpec: Object.freeze({
      eventId: "EVT-20260817-002",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D033-NONLABEL-AI-CONFIRMATION-CARD-001",
      subjectRole: "CandidateProductArtifact",
      correlationId: "d033-nonlabel-ai-confirmation-card-spec",
      state: "completed",
      decisionId: "D-033",
      decisionState: "CANDIDATE",
      d039BlockerId: "D039-PX5-B05",
      d039BlockerState: "OPEN",
      from: "D033_CARD_SPEC_REQUIRED",
      next: "D033_INDEPENDENT_REVIEW_REQUIRED",
      cardState: "DRAFT_COMPLETE",
      questionId: "d033_nonlabel_ai_confirmation_scope",
      optionIds: Object.freeze([
        "per_request_preview_all_nonlabel_payloads",
        "per_request_preview_images_explicit_text_send",
        "d014_label_only_explicit_send_others",
      ]),
      optionCount: 3,
      recommendedOptionId: "per_request_preview_all_nonlabel_payloads",
      allOptionsMutuallyExclusive: true,
      completePolicyPackages: true,
      d014LabelPhotoPreviewScopePreserved: true,
      nonLabelPayloadKinds: Object.freeze(["meal_photo", "meal_text", "trend_summary"]),
      userInitiatedRequestRequired: true,
      reviewSubjectBindsTaskPayloadOriginModelAndRevisions: true,
      payloadOrConfigurationChangeInvalidatesConfirmation: true,
      confirmationAuthorizesSingleAttemptOnly: true,
      confirmationTokenReusable: false,
      backgroundSendAuthorized: false,
      automaticRetryAuthorized: false,
      blockedWhenD034D036OrD053Unresolved: true,
      rawPayloadOrProviderResponsePersisted: false,
      uploadConfirmationSeparateFromCandidateConfirmation: true,
      unknownResultRequiresSameAttemptReconciliation: true,
      startupInvalidatesPriorConfirmation: true,
      otherRequiresNormalization: true,
      productSelfReviewPassed: true,
      privacySecuritySelfReviewPassed: true,
      dataIntegritySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      ownerCardScheduled: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      d033RegisteredInDecisionLedger: false,
      d033RecordedInOwnerIntake: false,
      closedD039BlockerIds: Object.freeze(["D039-PX5-B01", "D039-PX5-B02"]),
      remainingOpenD039BlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05",
        "D039-PX5-B06", "D039-PX5-B07",
      ]),
      remainingOpenD039BlockerCount: 5,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
      ownerIntakeChanged: false,
      d039DecisionStateChanged: false,
    }),
  }),
  d034: Object.freeze({
    cardSpec: Object.freeze({
      eventId: "EVT-20260817-003",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D034-AI-RESOURCE-BUDGET-CARD-001",
      subjectRole: "CandidateProductArtifact",
      correlationId: "d034-ai-resource-budget-card-spec",
      state: "completed",
      decisionId: "D-034",
      decisionState: "CANDIDATE",
      d039BlockerId: "D039-PX5-B05",
      d039BlockerState: "OPEN",
      from: "D034_CARD_SPEC_REQUIRED",
      next: "D034_DEVICE_BENCHMARK_AND_INDEPENDENT_REVIEW_REQUIRED",
      cardState: "DRAFT_COMPLETE",
      questionId: "d034_ai_resource_budget_profile",
      optionIds: Object.freeze([
        "conservative_fixed_limits",
        "balanced_fixed_limits",
        "provider_profile_with_global_ceiling",
      ]),
      optionCount: 3,
      recommendedOptionId: "balanced_fixed_limits",
      allOptionsMutuallyExclusive: true,
      completePolicyPackages: true,
      budgetDimensionCount: 19,
      allProfilesHaveFixedGlobalCeilings: true,
      providerCanOnlyTighten: true,
      provisionalBalancedProfileRetained: true,
      inputBudgetCheckedBeforeDecode: true,
      downsampleBeforeFullDecodeRequired: true,
      decompressedResponseCounted: true,
      jsonBudgetEnforcedDuringParse: true,
      singleForegroundRequest: true,
      temporaryDiskBudgetBounded: true,
      controlledWorkingMemorySeparatedFromProcessPeak: true,
      overLimitAbortsAndCleans: true,
      automaticRaiseOrDowngradeRetryAuthorized: false,
      blockedWhenD033D036OrD053Unresolved: true,
      minimumSupportedIphoneBenchmarkRequired: true,
      currentOi03DeviceIsNotMinimumEvidence: true,
      deviceBenchmarkPassed: false,
      benchmarkCorpusIncludesNormalBoundaryAndMaliciousFixtures: true,
      productSelfReviewPassed: true,
      privacySecuritySelfReviewPassed: true,
      dataIntegritySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      ownerCardScheduled: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      d034RegisteredInDecisionLedger: false,
      d034RecordedInOwnerIntake: false,
      closedD039BlockerIds: Object.freeze(["D039-PX5-B01", "D039-PX5-B02"]),
      remainingOpenD039BlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05",
        "D039-PX5-B06", "D039-PX5-B07",
      ]),
      remainingOpenD039BlockerCount: 5,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
      ownerIntakeChanged: false,
      d039DecisionStateChanged: false,
    }),
    benchmarkProtocol: Object.freeze({
      eventId: "EVT-20260821-010",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D034-MINIMUM-IPHONE-BENCHMARK-PROTOCOL-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d034-minimum-iphone-benchmark-protocol",
      state: "completed",
      decisionId: "D-034",
      decisionState: "CANDIDATE",
      d039BlockerId: "D039-PX5-B05",
      d039BlockerState: "OPEN",
      from: "D034_DEVICE_BENCHMARK_PROTOCOL_REQUIRED",
      to: "D034_DEVICE_BENCHMARK_PROTOCOL_READY",
      next: "D034_BENCHMARK_AUTHORIZATION_DEVICE_AND_TOOLCHAIN_REQUIRED",
      protocolState: "PROTOCOL_READY",
      sourcePacketVersion: "PACKET-001-R1",
      sourceCardInputFrozen: true,
      sourceCardCommit: "6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117",
      sourceCardBlobOid: "3d1d7681b0285d65ea5d64a2176bfab4c5d28c5c",
      sourceCardSha256: "a8e6b5a992854efb92bd30fe477b7deee090ab152976bdb6cf293179c0ac7bf6",
      sourcePacketManifestEventId: "EVT-20260821-009",
      protocolArtifactCommit: "f2084a106d7a8e4c4a612278fb13372c747fa622",
      protocolArtifactBlobOid: "217d89535998b546f702206c166d4b3c5775b7c8",
      profileCount: 3,
      profileMatrixRowCount: 21,
      directHardLimitCount: 19,
      companionControlCount: 2,
      directLimitScenarioMinimum: 38,
      warmupRepetitionCount: 3,
      measuredRepetitionMinimum: 10,
      fixtureManifestRequired: true,
      sameCorpusAcrossProfilesRequired: true,
      profileOrderRotationRequired: true,
      rawRunValuesRequired: true,
      summaryStatisticsRequired: Object.freeze(["minimum", "median", "p95", "maximum"]),
      minimumPhysicalDeviceResolved: false,
      currentOi03DeviceIsNotMinimumEvidence: true,
      macAndSupportedXcodeAvailable: false,
      isolatedNativeHarnessAuthorized: false,
      corpusMaterialized: false,
      benchmarkExecutionStarted: false,
      benchmarkResultRecorded: false,
      deviceBenchmarkPassed: false,
      namedSecurityReviewerAssigned: false,
      namedQaReviewerAssigned: false,
      independentReviewPassed: false,
      externalMessageSent: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      d034RegisteredInDecisionLedger: false,
      d034RecordedInOwnerIntake: false,
      b05Closed: false,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
    }),
  }),
  d036: Object.freeze({
    cardSpec: Object.freeze({
      eventId: "EVT-20260820-001",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D036-AI-TRANSPORT-PROFILE-CARD-001",
      subjectRole: "CandidateProductArtifact",
      correlationId: "d036-ai-transport-profile-card-spec",
      state: "completed",
      decisionId: "D-036",
      decisionState: "CANDIDATE",
      d039BlockerId: "D039-PX5-B05",
      d039BlockerState: "OPEN",
      from: "D036_CARD_SPEC_REQUIRED",
      next: "D036_PROVIDER_SPIKE_NATIVE_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED",
      cardState: "DRAFT_COMPLETE",
      questionId: "d036_ai_transport_profile",
      optionIds: Object.freeze([
        "strict_ephemeral_no_redirect",
        "confirmed_query_same_origin_redirect",
        "rn_fetch_after_native_boundary_proof",
      ]),
      optionCount: 3,
      recommendedOptionId: "strict_ephemeral_no_redirect",
      allOptionsMutuallyExclusive: true,
      completePolicyPackages: true,
      httpsOnlyBaselinePreserved: true,
      onlyAiTransportMayNetwork: true,
      userinfoRejectedAllProfiles: true,
      fragmentRejectedAllProfiles: true,
      authorizationNeverSentToUnconfirmedOrigin: true,
      strictProfileRejectsQuery: true,
      strictProfileRejectsAllRedirects: true,
      compatibleProfileAllowsConfirmedNonsecretQuery: true,
      compatibleProfileRedirectStatuses: Object.freeze([307, 308]),
      compatibleProfileRedirectSameOriginOnly: true,
      compatibleProfileMaximumRedirects: 3,
      ephemeralAloneConsideredSufficientIsolation: false,
      explicitUrlCacheDisabled: true,
      explicitCookieStorageDisabled: true,
      explicitCredentialStorageDisabled: true,
      backgroundTransportAuthorized: false,
      webViewOrRemoteImageTransportAuthorized: false,
      rnFetchRequiresNativeBoundaryProof: true,
      d053ProviderUseGatePreserved: true,
      blockedWhenD033D034OrD053Unresolved: true,
      providerCompatibilityTargetCount: 3,
      providerCompatibilitySpikePassed: false,
      nativeBoundaryEvidencePassed: false,
      currentWindowsJsExportCountsAsNativeTransportEvidence: false,
      redirectHarnessDefined: true,
      debugAndReleaseNetworkCaptureRequired: true,
      realNetworkRequests: 0,
      productSelfReviewPassed: true,
      privacySecuritySelfReviewPassed: true,
      dataIntegritySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      ownerCardScheduled: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      d036RegisteredInDecisionLedger: false,
      d036RecordedInOwnerIntake: false,
      closedD039BlockerIds: Object.freeze(["D039-PX5-B01", "D039-PX5-B02"]),
      remainingOpenD039BlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05",
        "D039-PX5-B06", "D039-PX5-B07",
      ]),
      remainingOpenD039BlockerCount: 5,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
      ownerIntakeChanged: false,
      d039DecisionStateChanged: false,
    }),
  }),
  d053: Object.freeze({
    cardSpec: Object.freeze({
      eventId: "EVT-20260820-002",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D053-AI-PROVIDER-USE-ADMISSION-CARD-001",
      subjectRole: "CandidateProductArtifact",
      correlationId: "d053-ai-provider-use-admission-card-spec",
      state: "completed",
      decisionId: "D-053",
      decisionState: "CANDIDATE",
      d039BlockerId: "D039-PX5-B05",
      d039BlockerState: "OPEN",
      from: "D053_CARD_SPEC_REQUIRED",
      next: "D053_OI07_POLICY_EVIDENCE_AND_INDEPENDENT_REVIEW_REQUIRED",
      cardState: "DRAFT_COMPLETE",
      questionId: "d053_ai_provider_use_admission",
      optionIds: Object.freeze([
        "documented_compatible_use_only",
        "provider_specific_residual_risk_review",
        "user_consent_broad_admission",
      ]),
      optionCount: 3,
      recommendedOptionId: "documented_compatible_use_only",
      allOptionsMutuallyExclusive: true,
      completePolicyPackages: true,
      evidenceDimensionIds: Object.freeze([
        "legal_entity_and_api_product",
        "terms_privacy_effective_version",
        "retention_and_backup",
        "training_and_model_improvement",
        "human_access",
        "deletion_revocation_and_sla",
        "advertising_marketing_tracking_broker",
        "health_data_use_and_repurpose",
        "subprocessors_regions_and_transfers",
        "app_privacy_and_policy_mapping",
      ]),
      evidenceDimensionCount: 10,
      payloadClasses: Object.freeze([
        "nutrition_label_photo",
        "meal_photo",
        "meal_text",
        "trend_summary",
        "guidance_context",
      ]),
      payloadClassCount: 5,
      providerPayloadRegionScopedDecisionRequired: true,
      profileExpiryRequired: true,
      policyChangeInvalidatesAdmission: true,
      explicitThirdPartyAiPermissionRequired: true,
      appleProhibitedUsesOwnerWaivable: false,
      unknownEvidenceCanAuthorize: false,
      apiKeyHttpsConnectivityCountsAsPolicyEvidence: false,
      localProfileAssertionCountsAsProviderTruth: false,
      generalModelTrainingAllowed: false,
      advertisingMarketingTrackingDataBrokerUseAllowed: false,
      unrelatedHealthDataUseAllowed: false,
      privacyPolicyEqualProtectionEvidenceRequired: true,
      appPrivacyMappingRequired: true,
      appPrivacyMappingSigned: false,
      oi07Complete: false,
      providerEvidencePassed: false,
      providerAdmissionRecords: 0,
      allProviderPayloadProfiles: "UNKNOWN_BLOCKED",
      broadConsentOptionCurrentlyOwnerReady: false,
      existingHarnessReusableAsAcceptedAuthorizationEvidence: false,
      blockedWhenD033D034OrD036Unresolved: true,
      realNetworkRequests: 0,
      productSelfReviewPassed: true,
      privacySecuritySelfReviewPassed: true,
      dataIntegritySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      ownerCardScheduled: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      d053RegisteredInDecisionLedger: true,
      d053RecordedInOwnerIntake: false,
      d053CandidateStatusPreserved: true,
      closedD039BlockerIds: Object.freeze(["D039-PX5-B01", "D039-PX5-B02"]),
      remainingOpenD039BlockerIds: Object.freeze([
        "D039-PX5-B03", "D039-PX5-B04", "D039-PX5-B05",
        "D039-PX5-B06", "D039-PX5-B07",
      ]),
      remainingOpenD039BlockerCount: 5,
      formalRootProjectAuthorized: false,
      nativeIosWorkAuthorized: false,
      formalImplementationAuthorized: false,
      px5ImplementationDorSatisfied: false,
      ownerIntakeChanged: false,
      d039DecisionStateChanged: false,
    }),
  }),
  d040: Object.freeze({
    initialFeedbackEventId: "EVT-20260806-002",
    finalFeedbackEventId: "EVT-20260806-005",
    initialCorrelationId: "d040-independent-prototype-review",
    finalCorrelationId: "d040-independent-prototype-delta-retest",
    reviewerId: "owner_gate_readback_audit",
    reviewerScopedProvisionalState: "PX-1_COMPLETE",
    authoritativeState: "PX-0_INPUT_GAP",
    provisionalStateAcceptedByPm: false,
    decisionState: "CANDIDATE",
    recommendedState: "PX-0_INPUT_GAP",
    next: "FORMULA_REVIEW_REQUIRED",
    originalFindings: Object.freeze({ P1: 2, P2: 4, P3: 1 }),
    closedFindings: Object.freeze({ P1: 2, P2: 4, P3: 1 }),
    newFindings: 0,
    automatedFlowsPassed: 9,
    px1Authorized: false,
    px2Authorized: false,
    ownerReviewAuthorized: false,
    ownerChoiceRecorded: false,
    decisionAcceptedRecorded: false,
    formalImplementationAuthorized: false,
    oi03RemainsNext: true,
  }),
  d040Research: Object.freeze({
    formula: Object.freeze({
      reviewerId: "d040_formula_evidence_audit",
      reviewerRole: "IndependentFormulaEvidenceReviewer",
      subjectId: "project-manager",
      subjectRole: "PM",
      initial: Object.freeze({
        eventId: "EVT-20260806-015",
        correlationId: "d040-px0-formula-evidence-audit",
        state: "changes_required",
        findings: Object.freeze({ P1: 0, P2: 2, P3: 1 }),
        formulaErrors: 0,
        conceptMixups: 0,
        decisionState: "CANDIDATE",
        authoritativeState: "PX-0_INPUT_GAP",
      }),
      final: Object.freeze({
        eventId: "EVT-20260806-019",
        correlationId: "d040-px0-formula-evidence-delta",
        state: "completed",
        closedFindings: Object.freeze({ P1: 0, P2: 2, P3: 1 }),
        remainingFindings: Object.freeze({ P1: 0, P2: 0, P3: 0 }),
        formulaErrors: 0,
        conceptMixups: 0,
      }),
    }),
    governance: Object.freeze({
      reviewerId: "d040_governance_safety_audit",
      reviewerRole: "IndependentGovernanceSafetyReviewer",
      subjectId: "project-manager",
      subjectRole: "PM",
      initial: Object.freeze({
        eventId: "EVT-20260806-017",
        correlationId: "d040-px0-governance-safety-audit",
        state: "changes_required",
        findings: Object.freeze({ P1: 0, P2: 4, P3: 1 }),
      }),
      interim: Object.freeze({
        eventId: "EVT-20260806-021",
        correlationId: "d040-px0-governance-safety-delta-1",
        state: "changes_required",
        remainingFindings: Object.freeze({ P1: 0, P2: 4, P3: 0 }),
      }),
      final: Object.freeze({
        eventId: "EVT-20260806-023",
        correlationId: "d040-px0-governance-safety-delta-2",
        state: "completed",
        closedFindings: Object.freeze({ P1: 0, P2: 4, P3: 0 }),
        remainingFindings: Object.freeze({ P1: 0, P2: 0, P3: 0 }),
      }),
    }),
    artifact: Object.freeze({
      eventId: "EVT-20260806-024",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-RESEARCH-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-px0-input-research",
      state: "completed",
      commit: "952bd1e",
      sha256: "4DAADE1E22CA76B41C22624D4832FD38F986FEF14DC3C3CB8C3E950AA97F7BA9",
      lineCount: 391,
      formulaAuditRemaining: Object.freeze({ P1: 0, P2: 0, P3: 0 }),
      governanceAuditRemaining: Object.freeze({ P1: 0, P2: 0, P3: 0 }),
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      next: "FORMULA_REVIEW_REQUIRED",
      draftQuestionCount: 17,
      draftQuestionIdsAllocated: false,
      oi03RemainsNext: true,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      formalImplementationAuthorized: false,
    }),
    macro: Object.freeze({
      formula: Object.freeze({
        reviewerId: "macro_formula_audit",
        reviewerRole: "IndependentFormulaEvidenceReviewer",
        requestMessageId: "MSG-20260806-107",
        feedbackMessageId: "MSG-20260806-108",
        requestEventId: "EVT-20260806-025",
        feedbackEventId: "EVT-20260806-026",
        correlationId: "d040-macronutrient-formula-audit",
        remainingFindings: Object.freeze({ P1: 0, P2: 0, P3: 0 }),
      }),
      governance: Object.freeze({
        reviewerId: "macro_governance_audit",
        reviewerRole: "IndependentGovernanceSafetyReviewer",
        requestMessageId: "MSG-20260806-109",
        feedbackMessageId: "MSG-20260806-110",
        requestEventId: "EVT-20260806-027",
        feedbackEventId: "EVT-20260806-028",
        correlationId: "d040-macronutrient-governance-audit",
        remainingFindings: Object.freeze({ P1: 0, P2: 0, P3: 0 }),
      }),
      artifact: Object.freeze({
        eventId: "EVT-20260806-029",
        actorId: "project-manager",
        actorRole: "PM",
        subjectId: "D040-RESEARCH-002",
        subjectRole: "CandidateResearchArtifact",
        correlationId: "d040-macronutrient-evidence",
        state: "completed",
        commit: "13efbc8",
        sha256: "9EAD8F5E85F0D22AFD509B4DE93BDE26DF78AC8EB43E8E104FF20932601C57E5",
        lineCount: 171,
        formulaAuditRemaining: Object.freeze({ P1: 0, P2: 0, P3: 0 }),
        governanceAuditRemaining: Object.freeze({ P1: 0, P2: 0, P3: 0 }),
        decisionState: "CANDIDATE",
        authoritativeState: "PX-0_INPUT_GAP",
        next: "FORMULA_REVIEW_REQUIRED",
        draftQuestionIdsAllocated: false,
        oi03RemainsNext: true,
        px1Authorized: false,
        px2Authorized: false,
        ownerReviewAuthorized: false,
        ownerChoiceRecorded: false,
        decisionAcceptedRecorded: false,
        formalImplementationAuthorized: false,
      }),
    }),
    allocation: Object.freeze({
      eventId: "EVT-20260815-003",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-QUESTION-ALLOCATION-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-question-allocation",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "FORMULA_REVIEW_REQUIRED",
      next: "DECISION_CARD_SPEC_REVIEW_REQUIRED",
      sourceDraftQuestionCount: 17,
      resolvedDecisionAxisCount: 20,
      newlyReservedIdCount: 19,
      newlyReservedDecisionIds: Object.freeze([
        "D-054", "D-055", "D-056", "D-057", "D-058", "D-059", "D-060",
        "D-061", "D-062", "D-063", "D-064", "D-065", "D-066", "D-067",
        "D-068", "D-069", "D-070", "D-071", "D-072",
      ]),
      finalStructureDecisionId: "D-040",
      sourceToDecisionMap: Object.freeze({
        "01": "D-054",
        "02": "D-055",
        "03": "D-056",
        "04": "D-057",
        "05": "D-058",
        "06": "D-059",
        "07": "D-060",
        "08": "D-061",
        "09": "D-062",
        "10": "D-063",
        "11": "D-064",
        "12": "D-065",
        "13": "D-066",
        "14": "D-067",
        "15": "D-068",
        "16": "D-069",
        "17": "D-040",
        "MACRO-02": "D-070",
        "MACRO-03": "D-071",
        "MACRO-04": "D-072",
      }),
      macroQuestion10ExpandedTo: Object.freeze(["D-063", "D-070", "D-071", "D-072"]),
      parentChildSchemaRequired: false,
      formulaEvidenceReviewComplete: true,
      formulaChoiceResolved: false,
      chinaMacroStandardStillGap: true,
      chinaSupportCopyReviewStillRequired: true,
      healthReviewGovernanceStillRequired: true,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      formalImplementationAuthorized: false,
    }),
    firstBatchCards: Object.freeze({
      eventId: "EVT-20260815-004",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-FIRST-BATCH-CARD-SPEC-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-first-batch-card-spec",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "DECISION_CARD_SPEC_REVIEW_REQUIRED",
      next: "FIRST_BATCH_INDEPENDENT_REVIEW_REQUIRED",
      cardDecisionIds: Object.freeze(["D-054", "D-055", "D-056", "D-058"]),
      cardQuestionIds: Object.freeze([
        "d054_formula_age_scope",
        "d055_age_source_retention",
        "d056_formula_age_representation",
        "d058_formula_branch_policy",
      ]),
      cardCount: 4,
      optionsPerCard: Object.freeze({ "D-054": 2, "D-055": 3, "D-056": 2, "D-058": 2 }),
      stableOptionIds: Object.freeze({
        "D-054": Object.freeze(["adult_19_plus", "manual_only_all_ages"]),
        "D-055": Object.freeze([
          "ephemeral_age_per_calculation",
          "stored_age_with_recorded_date",
          "stored_date_of_birth",
        ]),
        "D-056": Object.freeze(["completed_years_integer", "decimal_year_one_place"]),
        "D-058": Object.freeze(["explicit_branch_with_skip", "disable_branch_dependent_formulas"]),
      }),
      allOptionsMutuallyExclusive: true,
      allCardsHostNativeOnly: true,
      otherRequiresNormalization: true,
      conditionalNotApplicableDefined: true,
      undefinedEighteenYearModelRemoved: true,
      productSelfReviewPassed: true,
      healthEvidenceSelfReviewPassed: true,
      privacySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      formulaEvidenceReviewComplete: true,
      formulaChoiceResolved: false,
      chinaMacroStandardStillGap: true,
      chinaSupportCopyReviewStillRequired: true,
      healthReviewGovernanceStillRequired: true,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      formalImplementationAuthorized: false,
    }),
    energyBatchCards: Object.freeze({
      eventId: "EVT-20260820-003",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-ENERGY-MODEL-BATCH-CARD-SPEC-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-energy-model-batch-card-spec",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "FIRST_BATCH_SPEC_COMPLETE",
      next: "FIRST_TWO_BATCHES_INDEPENDENT_REVIEW_REQUIRED",
      cardDecisionIds: Object.freeze(["D-057", "D-059", "D-060", "D-061", "D-062"]),
      cardQuestionIds: Object.freeze([
        "d057_base_energy_path",
        "d059_activity_input_representation",
        "d060_missing_activity_behavior",
        "d061_mifflin_ree_use",
        "d062_weight_change_goal_path",
      ]),
      cardCount: 5,
      draftedCardCount: 9,
      optionsPerCard: Object.freeze({ "D-057": 3, "D-059": 3, "D-060": 2, "D-061": 2, "D-062": 2 }),
      stableOptionIds: Object.freeze({
        "D-057": Object.freeze(["nasem_2023_maintenance_eer", "mifflin_ree_only", "manual_or_no_goal"]),
        "D-059": Object.freeze([
          "nasem_four_category_self_report",
          "model_native_numeric_pal",
          "no_activity_disable_automatic_daily_energy",
        ]),
        "D-060": Object.freeze(["no_automatic_result_or_target", "mifflin_ree_information_only"]),
        "D-061": Object.freeze(["show_ree_information_only", "do_not_calculate_or_display_mifflin"]),
        "D-062": Object.freeze([
          "maintenance_only_manual_or_no_goal_for_change",
          "validated_dynamic_change_model",
        ]),
      }),
      recommendedOptionIds: Object.freeze({
        "D-057": "nasem_2023_maintenance_eer",
        "D-059": "nasem_four_category_self_report",
        "D-060": "no_automatic_result_or_target",
        "D-061": "show_ree_information_only",
        "D-062": "maintenance_only_manual_or_no_goal_for_change",
      }),
      allOptionsMutuallyExclusive: true,
      allCardsHostNativeOnly: true,
      otherRequiresNormalization: true,
      conditionalNotApplicableDefined: true,
      modelOutputNamesPreserved: true,
      nasemMaintenanceOnly: true,
      mifflinReeOnly: true,
      reeToDailyTargetStrategyAuthorized: false,
      silentDefaultPalAllowed: false,
      healthKitOrStepsPalInferenceAllowed: false,
      dynamicModelEvidenceRequired: true,
      dynamicModelEvidencePassed: false,
      dynamicModelOptionCurrentlyOwnerReady: false,
      niddkDefaultsAdopted: false,
      manualAndNoGoalFallbackPreserved: true,
      zeroWriteFailureBoundary: true,
      firstBatchIndependentReviewPassed: false,
      productSelfReviewPassed: true,
      healthEvidenceSelfReviewPassed: true,
      privacySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      reservedIdsOnly: true,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      formulaImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    dataLifecycleBatchCards: Object.freeze({
      eventId: "EVT-20260820-004",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-DATA-LIFECYCLE-BATCH-CARD-SPEC-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-data-lifecycle-batch-card-spec",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "SECOND_BATCH_SPEC_COMPLETE",
      next: "FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_REQUIRED",
      cardDecisionIds: Object.freeze(["D-064", "D-065", "D-066", "D-067"]),
      cardQuestionIds: Object.freeze([
        "d064_profile_goal_storage",
        "d065_profile_deletion_semantics",
        "d066_energy_display_rounding",
        "d067_recalculation_policy",
      ]),
      cardCount: 4,
      draftedCardCount: 13,
      optionsPerCard: Object.freeze({ "D-064": 3, "D-065": 3, "D-066": 3, "D-067": 3 }),
      stableOptionIds: Object.freeze({
        "D-064": Object.freeze([
          "goal_output_with_provenance_only",
          "complete_reproducible_input_snapshot",
          "current_profile_plus_goal_output",
        ]),
        "D-065": Object.freeze([
          "clear_profile_and_goal_input_copies",
          "profile_only_keep_goal_snapshots",
          "cascade_profile_and_goal_versions",
        ]),
        "D-066": Object.freeze([
          "nearest_10_kcal_half_up",
          "whole_kcal_half_up",
          "nearest_50_kcal_half_up",
        ]),
        "D-067": Object.freeze([
          "user_initiated_difference_candidate",
          "mark_stale_without_candidate",
          "automatic_pending_candidate",
        ]),
      }),
      recommendedOptionIds: Object.freeze({
        "D-064": "goal_output_with_provenance_only",
        "D-065": "clear_profile_and_goal_input_copies",
        "D-066": "nearest_10_kcal_half_up",
        "D-067": "user_initiated_difference_candidate",
      }),
      allOptionsMutuallyExclusive: true,
      allCardsHostNativeOnly: true,
      otherRequiresNormalization: true,
      conditionalNotApplicableDefined: true,
      dataLayerIds: Object.freeze(["CalculationDraft", "CurrentProfile", "GoalVersion", "IndependentHistory"]),
      dataLayerCount: 4,
      formulaInputDoesNotImplyPersistence: true,
      goalOutputProvenanceRequired: true,
      rawAndDisplaySeparated: true,
      chainedRoundingAllowed: false,
      displayValueCanReplaceAuditRaw: false,
      currentProfileDeletionCanSilentlyDeleteIndependentHistory: false,
      externalFilesCopiesAppControlled: false,
      automaticCandidateCanBecomeEffectiveWithoutConfirmation: false,
      historicalDiaryRecalculationAllowed: false,
      manualGoalCanBeSilentlyOverwritten: false,
      zeroWriteFailureBoundary: true,
      firstTwoBatchesIndependentReviewPassed: false,
      productSelfReviewPassed: true,
      privacySecuritySelfReviewPassed: true,
      dataIntegritySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      reservedIdsOnly: true,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      persistenceImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    chinaSupportHealthReviewInput: Object.freeze({
      eventId: "EVT-20260820-005",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-CHINA-SUPPORT-HEALTH-REVIEW-INPUT-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-china-support-health-review-input",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_REQUIRED",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      inputState: "DRAFT_COMPLETE",
      locale: "zh-Hans-CN",
      officialSourceCheckComplete: true,
      officialSourceCount: 4,
      supportTermIds: Object.freeze([
        "medical_health_professional",
        "health_weight_management_clinic_or_related_department",
        "psychological_assistance_hotline_12356",
        "medical_emergency_120",
      ]),
      supportTermCount: 4,
      copyContextIds: Object.freeze([
        "general_non_diagnostic_boundary",
        "chronic_condition_or_medication_yes",
        "chronic_condition_or_medication_unsure",
        "eating_disorder_risk_support",
        "urgent_medical_risk",
        "estimate_uncertainty",
      ]),
      copyContextCount: 6,
      psychologicalSupportNumber: "12356",
      medicalEmergencyNumber: "120",
      psychologicalHotlinePresentedAsMedicalEmergencyReplacement: false,
      appClaimsDiagnosisOrTreatment: false,
      appClaimsReferralCompleted: false,
      appClaimsEmergencyService: false,
      ambiguousUnqualifiedProfessionalTitleAllowed: false,
      manualAndNoGoalFallbackPreserved: true,
      offlineBundledCopyRequired: true,
      runtimeNetworkRequired: false,
      locationAccessAuthorized: false,
      analyticsAuthorized: false,
      automaticDialAuthorized: false,
      releaseTimeSourceReverificationRequired: true,
      maximumRoutineReviewIntervalDays: 90,
      immediateReviewTriggerIds: Object.freeze([
        "official_source_change",
        "resource_availability_change",
        "health_review_finding",
        "user_safety_incident_or_complaint",
        "formula_trigger_or_copy_semantics_change",
      ]),
      immediateReviewTriggerCount: 5,
      namedHealthReviewerRequired: true,
      healthReviewerQualificationEvidenceRequired: true,
      healthReviewerAssigned: false,
      healthContentApproved: false,
      contentQaPassed: false,
      d068OwnerReady: false,
      d069OwnerReady: false,
      firstThreeBatchesIndependentReviewPassed: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      healthCopyImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    chinaMacronutrientStandardInput: Object.freeze({
      eventId: "EVT-20260820-006",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-CHINA-MACRONUTRIENT-STANDARD-INPUT-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-china-macronutrient-standard-input",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "CHINA_MACRO_STANDARD_EVIDENCE_GAP",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      inputState: "EVIDENCE_COMPLETE",
      standardId: "WS/T 578.1-2017",
      standardStatus: "CURRENT_RECOMMENDED_INDUSTRY_STANDARD",
      standardPublishedAt: "2017-09-14",
      standardEffectiveAt: "2018-04-01",
      officialPageAndPdfVerified: true,
      officialRegistryCurrentStatusVerified: true,
      officialSourceCount: 4,
      applicablePopulation: "healthy_chinese_population_or_individual",
      adultCarbohydrateEnergyPercentRange: Object.freeze([50, 65]),
      adultFatEnergyPercentRange: Object.freeze([20, 30]),
      adultProteinEnergyPercentRange: Object.freeze([10, 15]),
      energyConversionKcalPerGram: Object.freeze({
        protein: 4,
        carbohydrate: 4,
        fat: 9,
        dietaryFiber: 2,
      }),
      rangeEndpointsCanGenerateDefaultTriplet: false,
      referenceBandCanBeIndividualPrescription: false,
      referenceBandCanBeWeightLossPrescription: false,
      outOfRangeCanTriggerDiagnosisScoringOrAutomaticCorrection: false,
      referenceBandCanSilentlyBecomeGoalVersion: false,
      standardIdAndSourceLabelRequired: true,
      stricterProductEligibilityCanBePreserved: true,
      broaderEligibilityThanSelectedModelAllowed: false,
      replacementConsultationDraftExists: true,
      consultationDraftTreatedAsCurrentStandard: false,
      formalReplacementPublishedEvidenceFound: false,
      releaseTimeStatusReverificationRequired: true,
      maximumStatusReviewIntervalDays: 90,
      runtimeNetworkRequired: false,
      newStandardCanRecalculateHistory: false,
      chinaMacroStandardEvidenceGapClosed: true,
      d063ChinaReferenceBandEvidenceReady: true,
      healthReviewerAssigned: false,
      healthContentApproved: false,
      d063OwnerReady: false,
      macroCardIndependentReviewPassed: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      macroImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    niddkDynamicModelFeasibilityInput: Object.freeze({
      eventId: "EVT-20260820-007",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-NIDDK-DYNAMIC-MODEL-FEASIBILITY-INPUT-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-niddk-dynamic-model-feasibility-input",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "DYNAMIC_MODEL_SOURCE_AND_LICENSE_EVIDENCE_GAP",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      inputState: "RESEARCH_COMPLETE_ADOPTION_NOT_PASSED",
      modelFamily: "NIDDK_BODY_WEIGHT_PLANNER_ADULT_DYNAMIC_MODEL",
      modelPaperDoi: "10.1016/S0140-6736(11)60812-X",
      officialDocumentSourceCount: 6,
      observedPublicCodeAssetCount: 7,
      publicCodeAssetHashesRecorded: true,
      codeAssetLastModifiedObserved: "2026-08-07T15:09:31Z",
      dynamicModelSourceAssessmentComplete: true,
      modelIdentityAndEquationSourceLocated: true,
      explicitPerFileSoftwareLicenseFound: false,
      niddkGeneralCopyrightReviewed: true,
      niddkCopyrightExceptionsAcknowledged: true,
      niddkContactRequiredIfReuseDoubt: true,
      stableSemanticReleaseFound: false,
      officialVersionedOracleCorpusFound: false,
      regressionToleranceDefined: false,
      niddkUiDefaultsAdopted: false,
      niddk1000KcalGuardrailAdopted: false,
      niddkAdultMinimumAgeAdopted: false,
      stricterExistingEligibilityPreserved: true,
      productGuardrailsApproved: false,
      healthReviewerAssigned: false,
      dynamicModelEvidencePassed: false,
      dynamicModelOptionOwnerReady: false,
      modelNativeNumericPalOptionOwnerReady: false,
      niddkSourceCodeVendored: false,
      niddkRemoteCodeExecuted: false,
      runtimeNetworkRequired: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      formulaImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    chinaHealthReviewerIntakePacket: Object.freeze({
      eventId: "EVT-20260820-008",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-CHINA-HEALTH-REVIEWER-INTAKE-PACKET-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-china-health-reviewer-intake-packet",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_GAP",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      packetNext: "NAMED_QUALIFIED_HEALTH_REVIEWER_REQUIRED",
      inputState: "PACKET_READY_REVIEWER_UNASSIGNED",
      locale: "zh-Hans-CN",
      reviewPacketReady: true,
      requiredArtifactCount: 9,
      requiredReviewItemCount: 13,
      copyReviewItemCount: 6,
      boundaryReviewItemCount: 7,
      itemDispositionIds: Object.freeze([
        "APPROVE",
        "APPROVE_WITH_REQUIRED_CHANGE",
        "REJECT",
        "OUT_OF_SCOPE",
      ]),
      qualificationFieldCount: 9,
      formalReviewFieldCount: 21,
      maximumReviewIntervalDays: 90,
      immutableArtifactRefsRequired: true,
      contentQaIndependentGateRequired: true,
      sensitiveCredentialDocumentsStored: false,
      aiOrAgentCanBeHealthReviewer: false,
      externalMessageSent: false,
      reviewerNameRecorded: false,
      reviewerQualificationVerified: false,
      conflictOfInterestResolved: false,
      healthReviewStarted: false,
      healthContentApproved: false,
      contentQaPassed: false,
      d068OwnerReady: false,
      d069OwnerReady: false,
      d063OwnerReady: false,
      firstThreeBatchesIndependentReviewPassed: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      healthCopyImplementationAuthorized: false,
      formulaImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    firstThreeBatchesIndependentReviewPacket: Object.freeze({
      eventId: "EVT-20260821-001",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-FIRST-THREE-BATCHES-INDEPENDENT-REVIEW-PACKET-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-first-three-batches-independent-review-packet",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "FIRST_THREE_BATCHES_INDEPENDENT_REVIEW_PACKET_GAP",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      packetNext: "REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_EXECUTION_REQUIRED",
      inputState: "PACKET_READY_REVIEWERS_UNASSIGNED",
      reviewPacketReady: true,
      reviewPacketVersion: "PACKET-001-R1",
      requiredArtifactCount: 7,
      requiredCardCount: 13,
      cardDecisionIds: Object.freeze([
        "D-054",
        "D-055",
        "D-056",
        "D-058",
        "D-057",
        "D-059",
        "D-060",
        "D-061",
        "D-062",
        "D-064",
        "D-065",
        "D-066",
        "D-067",
      ]),
      requiredReviewerDomainCount: 4,
      reviewerDomainIds: Object.freeze([
        "PRODUCT_DECISION_QUALITY",
        "HEALTH_FORMULA_EVIDENCE",
        "PRIVACY_DATA_INTEGRITY",
        "QA_ACCESSIBILITY",
      ]),
      requiredCrossBatchInvariantCount: 12,
      allowedCardDispositionIds: Object.freeze([
        "APPROVE_SPEC",
        "APPROVE_WITH_REQUIRED_CHANGE",
        "REJECT_SPEC",
        "OUT_OF_SCOPE",
      ]),
      blockingSeverityIds: Object.freeze(["P0", "P1", "P2"]),
      nonBlockingSeverityId: "P3",
      namedReviewerRequired: true,
      authorOrPmCanSelfApprove: false,
      aiOrAgentCanBeIndependentReviewer: false,
      externalMessageSent: false,
      reviewersAssigned: false,
      reviewerIdentityVerified: false,
      reviewerIndependenceVerified: false,
      conflictOfInterestResolved: false,
      independentReviewStarted: false,
      independentReviewPassed: false,
      currentFindingCountsMeasured: false,
      dynamicModelOptionOwnerReady: false,
      modelNativeNumericPalOptionOwnerReady: false,
      healthReviewStillRequired: true,
      healthReviewerAssigned: false,
      healthContentApproved: false,
      contentQaPassed: false,
      firstThreeBatchesIndependentReviewPassed: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      formulaImplementationAuthorized: false,
      persistenceImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    d063MacroTargetSourceCardSpec: Object.freeze({
      eventId: "EVT-20260821-002",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-MACRO-TARGET-SOURCE-CARD-SPEC-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-macro-target-source-card-spec",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "CHINA_MACRO_STANDARD_EVIDENCE_READY_CARD_SPEC_GAP",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      cardNext: "NAMED_HEALTH_REVIEW_AND_MACRO_CARD_INDEPENDENT_REVIEW_REQUIRED",
      inputState: "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY",
      decisionId: "D-063",
      questionId: "d063_macro_target_source",
      cardCount: 1,
      optionCount: 3,
      optionIds: Object.freeze([
        "no_macro_target",
        "china_adult_reference_band_information_only",
        "user_defined_macro_target",
      ]),
      recommendedOptionId: "no_macro_target",
      draftedCardCount: 14,
      referenceBandStandardId: "WS/T 578.1-2017",
      referenceBandCarbohydrateEnergyPercentRange: Object.freeze([50, 65]),
      referenceBandFatEnergyPercentRange: Object.freeze([20, 30]),
      referenceBandProteinEnergyPercentRange: Object.freeze([10, 15]),
      chinaReferenceBandEvidenceReady: true,
      referenceBandInformationOnly: true,
      rangeEndpointsCanGenerateDefaultTriplet: false,
      referenceBandCreatesGoalVersion: false,
      referenceBandCanTriggerScoringDiagnosisOrCorrection: false,
      userDefinedRequiresD070: true,
      displayAndRoundingRequiresD071: true,
      hardStopRecordAvailabilityRequiresD072: true,
      d068D069PrerequisitesPassed: false,
      healthReviewPacketReady: true,
      healthReviewerAssigned: false,
      healthContentApproved: false,
      contentQaPassed: false,
      productSelfReviewPassed: true,
      healthEvidenceSelfReviewPassed: true,
      privacySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      firstThreeBatchesIndependentReviewPassed: false,
      independentReviewPassed: false,
      externalMessageSent: false,
      cardRegisteredInDecisionLedger: false,
      d063OwnerReady: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      macroImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    d070CustomMacroInputShapeCardSpec: Object.freeze({
      eventId: "EVT-20260821-003",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-CUSTOM-MACRO-INPUT-SHAPE-CARD-SPEC-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-custom-macro-input-shape-card-spec",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "D063_CARD_SPEC_COMPLETE_D070_SPEC_GAP",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      cardNext: "D063_ACCEPTANCE_HEALTH_AND_D070_INDEPENDENT_REVIEW_REQUIRED",
      inputState: "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY",
      decisionId: "D-070",
      questionId: "d070_custom_macro_input_shape",
      applicableWhen: "D-063 = user_defined_macro_target",
      cardCount: 1,
      optionCount: 3,
      optionIds: Object.freeze([
        "complete_macro_grams",
        "fixed_100_percent_triplet",
        "partial_macro_grams_explicit_missing",
      ]),
      recommendedOptionId: "complete_macro_grams",
      draftedCardCount: 15,
      inputShapesMutuallyExclusive: true,
      percentAllThreeRequired: true,
      percentSumRequired: 100,
      completeGramsAllThreeRequired: true,
      partialGramsSetCountRange: Object.freeze([1, 2]),
      missingMacroTreatedAsZero: false,
      residualAutoFilled: false,
      mixedInputShapesAllowed: false,
      percentToGramConversionRequiresExplicitEnergyTarget: true,
      conversionSelectsEnergyOrMacroTarget: false,
      actualEnergyMismatchIsDataError: false,
      numericHealthBoundsApproved: false,
      d063Accepted: false,
      d068D069PrerequisitesPassed: false,
      healthReviewerAssigned: false,
      healthContentApproved: false,
      contentQaPassed: false,
      productSelfReviewPassed: true,
      healthEvidenceSelfReviewPassed: true,
      privacySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      externalMessageSent: false,
      cardRegisteredInDecisionLedger: false,
      d070OwnerReady: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      macroConversionImplementationAuthorized: false,
      persistenceImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    d071MacroDisplayRoundingCardSpec: Object.freeze({
      eventId: "EVT-20260821-004",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-MACRO-DISPLAY-ROUNDING-CARD-SPEC-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-macro-display-rounding-card-spec",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "D070_CARD_SPEC_COMPLETE_D071_SPEC_GAP",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      cardNext: "D063_D070_ACCEPTANCE_HEALTH_AND_D071_INDEPENDENT_REVIEW_REQUIRED",
      inputState: "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY",
      decisionId: "D-071",
      questionId: "d071_macro_display_rounding",
      applicableWhen: "D-063 = user_defined_macro_target; reference-band branch uses fixed information-only display",
      cardCount: 1,
      optionCount: 3,
      optionIds: Object.freeze([
        "source_primary_optional_derived_one_decimal",
        "source_unit_only_one_decimal",
        "source_primary_optional_derived_two_decimals",
      ]),
      recommendedOptionId: "source_primary_optional_derived_one_decimal",
      draftedCardCount: 16,
      referenceBandInformationOnly: true,
      referenceBandDerivedGramsAllowed: false,
      sourceUnitAlwaysPreserved: true,
      derivedUnitRequiresExplicitConversionInputs: true,
      displayDecimalRoundingMode: "ROUND_HALF_UP",
      recommendedDecimalPlaces: 1,
      highPrecisionOptionDecimalPlaces: 2,
      rawValuesAuthoritative: true,
      displayValuesPersistedAsGoal: false,
      conversionsUseDisplayRoundedValues: false,
      residualAllocatedToMacro: false,
      displayedPercentTripletForcedTo100: false,
      roundingDisclosureRequired: true,
      actualEnergyMismatchTreatedAsRoundingResidual: false,
      energyRoundingPolicyReused: false,
      numericHealthBoundsApproved: false,
      d063Accepted: false,
      d070Accepted: false,
      d068D069PrerequisitesPassed: false,
      healthReviewerAssigned: false,
      healthContentApproved: false,
      contentQaPassed: false,
      productSelfReviewPassed: true,
      healthEvidenceSelfReviewPassed: true,
      privacySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      externalMessageSent: false,
      cardRegisteredInDecisionLedger: false,
      d071OwnerReady: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      macroDisplayImplementationAuthorized: false,
      persistenceImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    d072HardStopRecordAvailabilityCardSpec: Object.freeze({
      eventId: "EVT-20260821-005",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-HARD-STOP-RECORD-AVAILABILITY-CARD-SPEC-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-hard-stop-record-availability-card-spec",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "D071_CARD_SPEC_COMPLETE_D072_SPEC_GAP",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      cardNext: "HEALTH_AND_D072_INDEPENDENT_REVIEW_REQUIRED",
      inputState: "DRAFT_COMPLETE_SELF_REVIEW_PASS_NOT_OWNER_READY",
      decisionId: "D-072",
      questionId: "d072_hard_stop_record_availability",
      applicableWhen: "automatic energy/weight-loss/macro target hard stop or conditional stop is active",
      cardCount: 1,
      optionCount: 2,
      optionIds: Object.freeze([
        "allow_no_goal_fact_recording",
        "pause_new_fact_creation_keep_data_controls",
      ]),
      recommendedOptionId: "allow_no_goal_fact_recording",
      draftedCardCount: 17,
      hardStopCannotBeWaived: true,
      noGoalRecordingCannotCreateGoal: true,
      automaticTargetOrFormulaShown: false,
      targetComparisonOrScoringShown: false,
      existingHistoryRecalculated: false,
      existingHistoryDeleted: false,
      dataAccessAndDeletionRemainAvailable: true,
      recordingChoiceChangesHealthClassification: false,
      conditionInferredByApp: false,
      unknownEligibilityEnablesAutomaticTarget: false,
      supportCopyRequiresHealthApproval: true,
      d068D069PrerequisitesPassed: false,
      healthReviewerAssigned: false,
      healthContentApproved: false,
      contentQaPassed: false,
      productSelfReviewPassed: true,
      healthEvidenceSelfReviewPassed: true,
      privacySelfReviewPassed: true,
      qaSelfReviewPassed: true,
      independentReviewPassed: false,
      externalMessageSent: false,
      cardRegisteredInDecisionLedger: false,
      d072OwnerReady: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      recordingImplementationAuthorized: false,
      persistenceImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    macroAxisIndependentReviewPacket: Object.freeze({
      eventId: "EVT-20260821-006",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-MACRO-AXIS-INDEPENDENT-REVIEW-PACKET-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-macro-axis-independent-review-packet",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "D063_D070_D071_D072_CARD_SPEC_COMPLETE_MACRO_AXIS_REVIEW_PACKET_GAP",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      packetNext: "MACRO_AXIS_INPUT_FREEZE_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      inputState: "PACKET_READY_REVIEWERS_UNASSIGNED",
      reviewPacketReady: true,
      reviewPacketVersion: "PACKET-001-R1",
      requiredArtifactCount: 10,
      requiredCardCount: 4,
      cardDecisionIds: Object.freeze(["D-063", "D-070", "D-071", "D-072"]),
      requiredReviewerDomainCount: 4,
      reviewerDomainIds: Object.freeze([
        "PRODUCT_DECISION_QUALITY",
        "HEALTH_FORMULA_EVIDENCE",
        "PRIVACY_DATA_INTEGRITY",
        "QA_ACCESSIBILITY",
      ]),
      requiredCrossAxisInvariantCount: 14,
      allowedCardDispositionIds: Object.freeze([
        "APPROVE_SPEC",
        "APPROVE_WITH_REQUIRED_CHANGE",
        "REJECT_SPEC",
        "OUT_OF_SCOPE",
      ]),
      blockingSeverityIds: Object.freeze(["P0", "P1", "P2"]),
      nonBlockingSeverityId: "P3",
      namedReviewerRequired: true,
      authorOrPmCanSelfApprove: false,
      aiOrAgentCanBeIndependentReviewer: false,
      externalMessageSent: false,
      reviewersAssigned: false,
      reviewerIdentityVerified: false,
      reviewerIndependenceVerified: false,
      conflictOfInterestResolved: false,
      independentReviewStarted: false,
      independentReviewPassed: false,
      currentFindingCountsMeasured: false,
      healthReviewStillRequired: true,
      healthReviewerAssigned: false,
      healthContentApproved: false,
      contentQaPassed: false,
      d063Accepted: false,
      d070Accepted: false,
      d063OwnerReady: false,
      d070OwnerReady: false,
      d071OwnerReady: false,
      d072OwnerReady: false,
      macroAxisIndependentReviewPassed: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      goalImplementationAuthorized: false,
      recordingImplementationAuthorized: false,
      persistenceImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
    macroAxisInputManifestFreeze: Object.freeze({
      eventId: "EVT-20260821-007",
      actorId: "project-manager",
      actorRole: "PM",
      subjectId: "D040-MACRO-AXIS-INPUT-MANIFEST-001",
      subjectRole: "CandidateResearchArtifact",
      correlationId: "d040-macro-axis-independent-review-input-freeze",
      state: "completed",
      decisionState: "CANDIDATE",
      authoritativeState: "PX-0_INPUT_GAP",
      from: "MACRO_AXIS_INPUT_FREEZE_REQUIRED",
      to: "MACRO_AXIS_INPUT_MANIFEST_FROZEN",
      next: "CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      packetNext: "MACRO_AXIS_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED",
      reviewPacketReady: true,
      reviewPacketVersion: "PACKET-001-R1",
      inputManifestFrozen: true,
      manifestEntryCount: 10,
      manifestCommit: "47ba4895dac2535682e8d1a8cb985176d6ad45f7",
      manifestRecordCommit: "d8e812f1324590d735f809ea994e8aaa2f6805d8",
      gitBlobOidAlgorithm: "SHA-1",
      canonicalDigestAlgorithm: "SHA-256",
      rawGitBlobBytesUsed: true,
      frozenArtifactRefs: Object.freeze([
        "docs/03-design/d040-question-allocation.md",
        "docs/03-design/d040-macronutrient-evidence.md",
        "docs/03-design/d040-china-macronutrient-standard-input.md",
        "docs/03-design/d040-macro-target-source-card-spec.md",
        "docs/03-design/d040-custom-macro-input-shape-card-spec.md",
        "docs/03-design/d040-macro-display-rounding-card-spec.md",
        "docs/03-design/d040-hard-stop-record-availability-card-spec.md",
        "docs/03-design/d040-data-lifecycle-batch-card-spec.md",
        "docs/03-design/d040-china-support-health-review-input.md",
        "docs/03-design/d040-china-health-reviewer-intake-packet.md",
      ]),
      sourcePacketCreationEventId: "EVT-20260821-006",
      externalMessageSent: false,
      reviewersAssigned: false,
      reviewerIdentityVerified: false,
      reviewerIndependenceVerified: false,
      conflictOfInterestResolved: false,
      independentReviewStarted: false,
      independentReviewPassed: false,
      healthReviewStillRequired: true,
      healthReviewerAssigned: false,
      healthContentApproved: false,
      contentQaPassed: false,
      d063Accepted: false,
      d070Accepted: false,
      d063OwnerReady: false,
      d070OwnerReady: false,
      d071OwnerReady: false,
      d072OwnerReady: false,
      ownerIntakeChanged: false,
      ownerCardScheduled: false,
      px1Authorized: false,
      px2Authorized: false,
      ownerReviewAuthorized: false,
      ownerChoiceRecorded: false,
      decisionAcceptedRecorded: false,
      goalImplementationAuthorized: false,
      recordingImplementationAuthorized: false,
      persistenceImplementationAuthorized: false,
      formalImplementationAuthorized: false,
    }),
  }),
});

export class ProjectOpsLoadError extends Error {
  constructor(code, sourcePath, message) {
    super(message);
    this.name = "ProjectOpsLoadError";
    this.code = code;
    this.sourcePath = sourcePath;
  }
}

function readJson(workspaceRoot, relativePath) {
  const absolutePath = path.join(workspaceRoot, relativePath);
  let text;

  try {
    text = fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_READ_ERROR",
      relativePath,
      `无法读取 ${relativePath}: ${error.message}`,
    );
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_JSON_PARSE_ERROR",
      relativePath,
      `${relativePath} 不是有效 JSON: ${error.message}`,
    );
  }
}

function readJsonlDirectory(workspaceRoot, relativeDirectory) {
  const absoluteDirectory = path.join(workspaceRoot, relativeDirectory);
  let entries;

  try {
    entries = fs
      .readdirSync(absoluteDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_READ_ERROR",
      relativeDirectory,
      `无法读取 ${relativeDirectory}: ${error.message}`,
    );
  }

  return entries.flatMap((entry) => {
    const relativePath = path.posix.join(relativeDirectory.replaceAll("\\", "/"), entry.name);
    const absolutePath = path.join(absoluteDirectory, entry.name);
    let text;

    try {
      text = fs.readFileSync(absolutePath, "utf8");
    } catch (error) {
      throw new ProjectOpsLoadError(
        "OPS_READ_ERROR",
        relativePath,
        `无法读取 ${relativePath}: ${error.message}`,
      );
    }

    const lines = text.split(/\r?\n/);
    if (lines.at(-1) === "") {
      lines.pop();
    }

    return lines.map((line, index) => {
        const lineNumber = index + 1;
        if (line.trim().length === 0) {
          throw new ProjectOpsLoadError(
            "OPS_JSONL_EMPTY_LINE",
            `${relativePath}:${lineNumber}`,
            `${relativePath}:${lineNumber} 存在中间空行`,
          );
        }
        try {
          return {
            sourceFile: relativePath,
            fileName: entry.name,
            lineNumber,
            value: JSON.parse(line),
          };
        } catch (error) {
          throw new ProjectOpsLoadError(
            "OPS_JSONL_PARSE_ERROR",
            `${relativePath}:${lineNumber}`,
            `${relativePath}:${lineNumber} 不是有效 JSON: ${error.message}`,
          );
        }
      });
  });
}

function readJsonDirectory(workspaceRoot, relativeDirectory, suffix) {
  const absoluteDirectory = path.join(workspaceRoot, relativeDirectory);
  let entries;

  try {
    entries = fs
      .readdirSync(absoluteDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_READ_ERROR",
      relativeDirectory,
      `无法读取 ${relativeDirectory}: ${error.message}`,
    );
  }

  return entries.map((entry) => {
    const relativePath = path.posix.join(relativeDirectory.replaceAll("\\", "/"), entry.name);
    return {
      sourceFile: relativePath,
      value: readJson(workspaceRoot, relativePath),
    };
  });
}

function readText(workspaceRoot, relativePath) {
  try {
    return fs.readFileSync(path.join(workspaceRoot, relativePath), "utf8");
  } catch (error) {
    throw new ProjectOpsLoadError(
      "OPS_READ_ERROR",
      relativePath,
      `无法读取 ${relativePath}: ${error.message}`,
    );
  }
}

function parseMarkdownTableIds(text, idPattern, statusColumn = null) {
  const rows = [];

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.startsWith("|")) {
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replaceAll("`", ""));
    const id = cells[0];

    if (!idPattern.test(id)) {
      continue;
    }

    rows.push({
      id,
      lineNumber: index + 1,
      ...(statusColumn === null ? {} : { status: cells[statusColumn] }),
    });
  }

  return rows;
}

export function loadProjectOps(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  const resolvedRoot = path.resolve(workspaceRoot);
  const evidenceText = readText(resolvedRoot, "docs/01-research/competitor-evidence-matrix.md");
  const gapThemeText = readText(resolvedRoot, "docs/01-research/public-evidence-gaps.md");

  return {
    workspaceRoot: resolvedRoot,
    schemas: readJsonDirectory(resolvedRoot, "project-ops/schemas", ".schema.json"),
    decisionRegister: readJson(resolvedRoot, "project-ops/decisions.json"),
    ownerIntake: readJson(resolvedRoot, "project-ops/owner-intake.json"),
    snapshot: readJson(resolvedRoot, "project-ops/snapshots/current.json"),
    events: readJsonlDirectory(resolvedRoot, "project-ops/events"),
    messages: readJsonlDirectory(resolvedRoot, "project-ops/messages"),
    evidenceRows: parseMarkdownTableIds(evidenceText, EVIDENCE_ID_PATTERN, 4),
    gapThemeRows: parseMarkdownTableIds(gapThemeText, GAP_THEME_ID_PATTERN),
  };
}

function arraysEqualAsSets(left, right) {
  const normalizedLeft = [...left].sort();
  const normalizedRight = [...right].sort();
  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates].sort();
}

function validateProjectOpsSchemas(model, add) {
  const schemasById = new Map();
  const schemaIds = [];
  let instancesValidated = 0;

  for (const record of model.schemas) {
    const schemaId = record.value?.$id;
    if (typeof schemaId !== "string" || schemaId.length === 0) {
      add(
        "OPS_SCHEMA_ID_INVALID",
        `${record.sourceFile}.$id`,
        "ProjectOps Schema 必须声明非空 $id",
      );
      continue;
    }
    if (schemasById.has(schemaId)) {
      add(
        "OPS_SCHEMA_ID_DUPLICATE",
        `${record.sourceFile}.$id`,
        `ProjectOps Schema $id 重复: ${schemaId}`,
      );
      continue;
    }
    schemasById.set(schemaId, record);
    schemaIds.push(schemaId);

    for (const error of inspectSchemaDefinition(record.value)) {
      add(
        "OPS_SCHEMA_DEFINITION_INVALID",
        `${record.sourceFile}${error.schemaPath}`,
        error.message,
        { keyword: error.keyword, profile: PROJECT_OPS_SCHEMA_PROFILE.id },
      );
    }
  }

  const expectedSchemaIds = PROJECT_OPS_SCHEMA_TARGETS.map((target) => target.schemaId);
  for (const schemaId of expectedSchemaIds) {
    if (!schemasById.has(schemaId)) {
      add(
        "OPS_SCHEMA_REQUIRED_MISSING",
        "project-ops/schemas",
        `缺少必需 ProjectOps Schema: ${schemaId}`,
      );
    }
  }
  for (const schemaId of schemaIds) {
    if (!expectedSchemaIds.includes(schemaId)) {
      add(
        "OPS_SCHEMA_UNMAPPED",
        `${schemasById.get(schemaId).sourceFile}.$id`,
        `ProjectOps Schema 没有受控实例映射: ${schemaId}`,
      );
    }
  }

  for (const target of PROJECT_OPS_SCHEMA_TARGETS) {
    const record = schemasById.get(target.schemaId);
    if (!record || inspectSchemaDefinition(record.value).length > 0) {
      continue;
    }
    for (const instance of target.instances(model)) {
      instancesValidated += 1;
      for (const error of validateSchemaInstance(record.value, instance.value)) {
        add(
          "OPS_SCHEMA_INSTANCE_INVALID",
          error.instancePath
            ? `${instance.sourcePath}.${error.instancePath}`
            : instance.sourcePath,
          error.message,
          {
            keyword: error.keyword,
            schemaId: target.schemaId,
            schemaPath: error.schemaPath,
          },
        );
      }
    }
  }

  return Object.freeze({
    profile: PROJECT_OPS_SCHEMA_PROFILE.id,
    schemasChecked: model.schemas.length,
    instancesValidated,
  });
}

export function validateOperationalInvariants(model, baseline = PHASE0_2026_08_21_D034_BENCHMARK_PROTOCOL_READY) {
  const diagnostics = [];
  const add = (code, diagnosticPath, message, details = undefined) => {
    diagnostics.push({
      code,
      path: diagnosticPath,
      message,
      ...(details === undefined ? {} : { details }),
    });
  };
  const expectEqual = (actual, expected, code, diagnosticPath) => {
    if (actual !== expected) {
      add(code, diagnosticPath, `期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`, {
        expected,
        actual,
      });
    }
  };

  const schemaValidation = validateProjectOpsSchemas(model, add);

  const versionedDocuments = [
    ["project-ops/decisions.json", model.decisionRegister],
    ["project-ops/owner-intake.json", model.ownerIntake],
    ["project-ops/snapshots/current.json", model.snapshot],
  ];
  for (const [documentPath, value] of versionedDocuments) {
    if (!isPlainObject(value)) {
      add("OPS_INVALID_SHAPE", documentPath, "顶层 JSON 必须是对象");
    } else if (value.schemaVersion !== 1) {
      add("OPS_SCHEMA_VERSION_MISMATCH", `${documentPath}.schemaVersion`, "schemaVersion 必须为 1");
    }
  }
  model.schemas.forEach((record) => {
    if (!isPlainObject(record.value)) {
      add("OPS_INVALID_SHAPE", record.sourceFile, "Schema JSON 顶层必须是对象");
    }
  });

  const snapshotGates = Array.isArray(model.snapshot?.gates) ? model.snapshot.gates : [];
  if (!Array.isArray(model.snapshot?.gates)) {
    add("OPS_INVALID_SHAPE", "project-ops/snapshots/current.json.gates", "gates 必须是数组");
  }

  const snapshotGateIds = snapshotGates.map((gate) => gate?.id);
  const duplicateSnapshotGateIds = duplicateValues(
    snapshotGateIds.filter((id) => typeof id === "string"),
  );
  if (duplicateSnapshotGateIds.length > 0) {
    add(
      "OPS_DUP_SNAPSHOT_GATE_ID",
      "project-ops/snapshots/current.json.gates",
      "快照 Gate ID 不唯一",
      { duplicateSnapshotGateIds },
    );
  }

  const expectedSnapshotGateIds = Object.keys(baseline.gateStates).sort();
  const actualSnapshotGateIds = snapshotGateIds
    .filter((id) => typeof id === "string")
    .sort();
  if (!arraysEqualAsSets(actualSnapshotGateIds, expectedSnapshotGateIds)) {
    add(
      "OPS_SNAPSHOT_GATE_SET_MISMATCH",
      "project-ops/snapshots/current.json.gates",
      "快照必须精确包含版本化基线中的 Gate 集合",
      { expected: expectedSnapshotGateIds, actual: actualSnapshotGateIds },
    );
  }

  snapshotGates.forEach((gate, index) => {
    const expectedState = baseline.gateStates[gate?.id];
    if (expectedState !== undefined && gate?.state !== expectedState) {
      add(
        "OPS_SNAPSHOT_GATE_STATE_MISMATCH",
        `project-ops/snapshots/current.json.gates[${index}].state`,
        `Gate ${gate.id} 状态与版本化基线不一致`,
        { gateId: gate.id, expected: expectedState, actual: gate?.state },
      );
    }
  });

  const decisions = Array.isArray(model.decisionRegister?.decisions)
    ? model.decisionRegister.decisions
    : [];
  if (!Array.isArray(model.decisionRegister?.decisions)) {
    add("OPS_INVALID_SHAPE", "project-ops/decisions.json.decisions", "decisions 必须是数组");
  }

  const decisionIds = decisions.map((decision) => decision?.id);
  const duplicateDecisionIds = duplicateValues(decisionIds.filter((id) => typeof id === "string"));
  if (duplicateDecisionIds.length > 0) {
    add("OPS_DUP_DECISION_ID", "project-ops/decisions.json.decisions", "决定 ID 不唯一", {
      duplicateDecisionIds,
    });
  }
  decisions.forEach((decision, index) => {
    if (!DECISION_ID_PATTERN.test(decision?.id ?? "")) {
      add(
        "OPS_INVALID_DECISION_ID",
        `project-ops/decisions.json.decisions[${index}].id`,
        "决定 ID 必须匹配 D-NNN",
      );
    }
  });

  const acceptedDecisions = decisions.filter((decision) => decision?.status === "ACCEPTED").length;
  const candidateDecisions = decisions.filter((decision) => decision?.status === "CANDIDATE").length;
  const unsupportedDecisionStatuses = decisions
    .filter((decision) => !["ACCEPTED", "CANDIDATE"].includes(decision?.status))
    .map((decision) => ({ id: decision?.id, status: decision?.status }));
  if (unsupportedDecisionStatuses.length > 0) {
    add(
      "OPS_UNSUPPORTED_DECISION_STATUS",
      "project-ops/decisions.json.decisions",
      "当前基线只允许 ACCEPTED 或 CANDIDATE",
      { unsupportedDecisionStatuses },
    );
  }

  const eventIds = model.events.map((record) => record.value?.eventId);
  const duplicateEventIds = duplicateValues(eventIds.filter((id) => typeof id === "string"));
  if (duplicateEventIds.length > 0) {
    add("OPS_DUP_EVENT_ID", "project-ops/events", "事件 ID 不唯一", { duplicateEventIds });
  }
  model.events.forEach((record) => {
    if (!isPlainObject(record.value)) {
      add("OPS_INVALID_SHAPE", `${record.sourceFile}:${record.lineNumber}`, "事件必须是 JSON 对象");
    } else if (record.value.schemaVersion !== 1) {
      add(
        "OPS_SCHEMA_VERSION_MISMATCH",
        `${record.sourceFile}:${record.lineNumber}.schemaVersion`,
        "事件 schemaVersion 必须为 1",
      );
    }
  });

  const eventsByFile = new Map();
  for (const record of model.events) {
    const records = eventsByFile.get(record.fileName) ?? [];
    records.push(record);
    eventsByFile.set(record.fileName, records);
  }

  for (const [fileName, records] of eventsByFile) {
    const fileMatch = EVENT_FILE_PATTERN.exec(fileName);
    if (!fileMatch) {
      add("OPS_INVALID_EVENT_FILE", `project-ops/events/${fileName}`, "事件文件名必须是 YYYY-MM-DD.jsonl");
      continue;
    }

    const fileDate = fileMatch[1];
    const compactDate = fileDate.replaceAll("-", "");
    records.forEach((record, index) => {
      const eventId = record.value?.eventId;
      const idMatch = EVENT_ID_PATTERN.exec(eventId ?? "");
      const recordPath = `${record.sourceFile}:${record.lineNumber}`;
      const expectedEventId = `EVT-${compactDate}-${String(index + 1).padStart(3, "0")}`;

      if (!idMatch) {
        add("OPS_INVALID_EVENT_ID", `${recordPath}.eventId`, "事件 ID 格式无效");
      } else {
        if (idMatch[1] !== compactDate) {
          add(
            "OPS_EVENT_FILE_PREFIX_MISMATCH",
            `${recordPath}.eventId`,
            `事件 ID 日期必须匹配 ${fileName}`,
            { expectedDate: compactDate, actualDate: idMatch[1] },
          );
        }
        if (eventId !== expectedEventId) {
          add(
            "OPS_EVENT_SEQUENCE_GAP",
            `${recordPath}.eventId`,
            "事件必须按文件行顺序从 001 连续递增",
            { expected: expectedEventId, actual: eventId },
          );
        }
      }

      const recordedAt = record.value?.recordedAt;
      const timestamp = Date.parse(recordedAt);
      if (typeof recordedAt !== "string" || Number.isNaN(timestamp)) {
        add("OPS_INVALID_EVENT_TIME", `${recordPath}.recordedAt`, "recordedAt 必须是可解析的时间");
      } else {
        if (recordedAt.slice(0, 10) !== fileDate) {
          add(
            "OPS_EVENT_RECORDED_DATE_MISMATCH",
            `${recordPath}.recordedAt`,
            `recordedAt 日期必须匹配 ${fileName}`,
            { expectedDate: fileDate, actualDate: recordedAt.slice(0, 10) },
          );
        }
      }
    });
  }

  const eventCountsByDate = Object.fromEntries(
    [...eventsByFile.entries()]
      .filter(([fileName]) => EVENT_FILE_PATTERN.test(fileName))
      .map(([fileName, records]) => [fileName.slice(0, 10), records.length]),
  );
  const actualEventDates = Object.keys(eventCountsByDate).sort();
  const expectedEventDates = Object.keys(baseline.eventCountsByDate).sort();
  if (!arraysEqualAsSets(actualEventDates, expectedEventDates)) {
    add(
      "OPS_EVENT_DAY_SET_MISMATCH",
      "project-ops/events",
      "事件日期文件集合偏离 Phase 0 基线",
      { expected: expectedEventDates, actual: actualEventDates },
    );
  }
  for (const [eventDate, expectedCount] of Object.entries(baseline.eventCountsByDate)) {
    expectEqual(
      eventCountsByDate[eventDate],
      expectedCount,
      "OPS_EVENT_DAY_COUNT_MISMATCH",
      `project-ops/events/${eventDate}.jsonl`,
    );
  }

  const messageIds = model.messages.map((record) => record.value?.messageId);
  const duplicateMessageIds = duplicateValues(messageIds.filter((id) => typeof id === "string"));
  if (duplicateMessageIds.length > 0) {
    add("OPS_DUP_MESSAGE_ID", "project-ops/messages", "消息 ID 不唯一", { duplicateMessageIds });
  }
  model.messages.forEach((record) => {
    if (!isPlainObject(record.value)) {
      add("OPS_INVALID_SHAPE", `${record.sourceFile}:${record.lineNumber}`, "消息必须是 JSON 对象");
      return;
    }
    if (record.value.schemaVersion !== 1) {
      add(
        "OPS_SCHEMA_VERSION_MISMATCH",
        `${record.sourceFile}:${record.lineNumber}.schemaVersion`,
        "消息 schemaVersion 必须为 1",
      );
    }
    if (!MESSAGE_ID_PATTERN.test(record.value?.messageId ?? "")) {
      add(
        "OPS_INVALID_MESSAGE_ID",
        `${record.sourceFile}:${record.lineNumber}.messageId`,
        "消息 ID 格式无效",
      );
    }
  });

  const responseTargets = new Set([...eventIds, ...messageIds].filter((id) => typeof id === "string"));
  const messagesById = new Map(
    model.messages.map((record) => [record.value?.messageId, record]),
  );
  let resolvedResponses = 0;
  model.messages.forEach((record) => {
    const responseTo = record.value?.responseTo;
    if (typeof responseTo === "string" && !responseTargets.has(responseTo)) {
      add(
        "OPS_DANGLING_RESPONSE_TO",
        `${record.sourceFile}:${record.lineNumber}.responseTo`,
        `responseTo 无法解析到既有事件或消息: ${responseTo}`,
      );
      return;
    }
    if (typeof responseTo === "string") {
      resolvedResponses += 1;
      if (responseTo === record.value?.messageId) {
        add(
          "OPS_SELF_RESPONSE",
          `${record.sourceFile}:${record.lineNumber}.responseTo`,
          "消息不能回复自身",
        );
      }
      const parent = messagesById.get(responseTo);
      if (parent) {
        const parentTime = Date.parse(parent.value?.sentAt);
        const responseTime = Date.parse(record.value?.sentAt);
        if (!Number.isNaN(parentTime) && !Number.isNaN(responseTime) && parentTime > responseTime) {
          add(
            "OPS_RESPONSE_TO_FUTURE",
            `${record.sourceFile}:${record.lineNumber}.responseTo`,
            "消息不能回复未来发送的消息",
            { responseTo },
          );
        }
      }
    }
  });

  const evidenceIds = model.evidenceRows.map((row) => row.id);
  const duplicateEvidenceIds = duplicateValues(evidenceIds);
  if (duplicateEvidenceIds.length > 0) {
    add("OPS_DUP_EVIDENCE_ID", "docs/01-research/competitor-evidence-matrix.md", "证据 ID 不唯一", {
      duplicateEvidenceIds,
    });
  }
  const evidenceCounts = {
    confirmed: model.evidenceRows.filter((row) => row.status === "confirmed").length,
    crossSource: model.evidenceRows.filter((row) => row.status === "cross-source").length,
    pending: model.evidenceRows.filter((row) => row.status === "pending").length,
  };
  const unsupportedEvidenceRows = model.evidenceRows.filter(
    (row) => !["confirmed", "cross-source", "pending"].includes(row.status),
  );
  if (unsupportedEvidenceRows.length > 0) {
    add(
      "OPS_UNSUPPORTED_EVIDENCE_STATUS",
      "docs/01-research/competitor-evidence-matrix.md",
      "证据状态必须是 confirmed、cross-source 或 pending",
      { rows: unsupportedEvidenceRows },
    );
  }

  const gapThemeIds = model.gapThemeRows.map((row) => row.id);
  const duplicateGapThemeIds = duplicateValues(gapThemeIds);
  if (duplicateGapThemeIds.length > 0) {
    add("OPS_DUP_GAP_THEME_ID", "docs/01-research/public-evidence-gaps.md", "Gap theme ID 不唯一", {
      duplicateGapThemeIds,
    });
  }

  const agents = Array.isArray(model.snapshot?.agents) ? model.snapshot.agents : [];
  if (!Array.isArray(model.snapshot?.agents)) {
    add("OPS_INVALID_SHAPE", "project-ops/snapshots/current.json.agents", "agents 必须是数组");
  }
  agents.forEach((agent, index) => {
    if (!isPlainObject(agent)) {
      add(
        "OPS_INVALID_SHAPE",
        `project-ops/snapshots/current.json.agents[${index}]`,
        "Agent roster 条目必须是对象",
      );
    } else if (typeof agent.id !== "string" || agent.id.trim().length === 0) {
      add(
        "OPS_INVALID_AGENT_ID",
        `project-ops/snapshots/current.json.agents[${index}].id`,
        "Agent ID 必须是非空字符串",
      );
    }
  });
  const agentIds = agents.map((agent) => agent?.id).filter((id) => typeof id === "string");
  const duplicateAgentIds = duplicateValues(agentIds);
  if (duplicateAgentIds.length > 0) {
    add(
      "OPS_DUP_AGENT_ID",
      "project-ops/snapshots/current.json.agents",
      "Agent roster ID 不唯一",
      { duplicateAgentIds },
    );
  }
  const activeAgentIds = agents
    .filter((agent) => agent?.state === "active")
    .map((agent) => agent.id)
    .sort();
  if (!arraysEqualAsSets(activeAgentIds, baseline.activeAgentIds)) {
    add(
      "OPS_ACTIVE_AGENT_SET_MISMATCH",
      "project-ops/snapshots/current.json.agents",
      "当前活跃角色集合必须与 Phase 0 基线一致",
      { expected: baseline.activeAgentIds, actual: activeAgentIds },
    );
  }

  const sourceCounts = {
    schemas: model.schemas.length,
    decisions: decisions.length,
    acceptedDecisions,
    candidateDecisions,
    events: model.events.length,
    messages: model.messages.length,
    resolvedResponses,
    agents: agents.length,
    activeAgents: activeAgentIds.length,
    evidenceItems: model.evidenceRows.length,
    confirmedEvidence: evidenceCounts.confirmed,
    crossSourceEvidence: evidenceCounts.crossSource,
    pendingEvidence: evidenceCounts.pending,
    gapThemes: gapThemeIds.length,
  };
  for (const [metric, expected] of Object.entries(baseline.counts)) {
    if (metric === "ownerResponses" || metric === "ownerDecisionIds") {
      continue;
    }
    expectEqual(sourceCounts[metric], expected, "OPS_BASELINE_METRIC_MISMATCH", `baseline.counts.${metric}`);
  }

  const snapshotMetrics = model.snapshot?.metrics ?? {};
  const snapshotExpectations = {
    acceptedDecisions,
    candidateDecisions,
    projectEvents: model.events.length,
    agentMessages: model.messages.length,
    agentRosterSize: agents.length,
    activeAgents: activeAgentIds.length,
    evidenceItems: model.evidenceRows.length,
    confirmedIosItems: evidenceCounts.confirmed,
    crossSourceItems: evidenceCounts.crossSource,
    evidenceGaps: evidenceCounts.pending,
    gapThemeCount: gapThemeIds.length,
  };
  for (const [metric, expected] of Object.entries(snapshotExpectations)) {
    expectEqual(
      snapshotMetrics[metric],
      expected,
      "OPS_SNAPSHOT_METRIC_MISMATCH",
      `project-ops/snapshots/current.json.metrics.${metric}`,
    );
  }

  const pendingEvidenceIds = model.evidenceRows
    .filter((row) => row.status === "pending")
    .map((row) => row.id)
    .sort();
  if (!arraysEqualAsSets(pendingEvidenceIds, baseline.pendingEvidenceIds)) {
    add(
      "OPS_PENDING_EVIDENCE_SET_MISMATCH",
      "docs/01-research/competitor-evidence-matrix.md",
      "pending evidence 集合偏离 Phase 0 基线",
      { expected: baseline.pendingEvidenceIds, actual: pendingEvidenceIds },
    );
  }
  const snapshotPendingEvidenceIds = Array.isArray(model.snapshot?.pendingEvidenceIds)
    ? model.snapshot.pendingEvidenceIds
    : [];
  if (!arraysEqualAsSets(snapshotPendingEvidenceIds, pendingEvidenceIds)) {
    add(
      "OPS_SNAPSHOT_PENDING_EVIDENCE_MISMATCH",
      "project-ops/snapshots/current.json.pendingEvidenceIds",
      "快照 pendingEvidenceIds 必须与证据矩阵一致",
      { expected: pendingEvidenceIds, actual: snapshotPendingEvidenceIds },
    );
  }

  const ownerIntake = model.ownerIntake ?? {};
  const ownerResponses = Array.isArray(ownerIntake.responses) ? ownerIntake.responses : [];
  const ownerDecisionIds = new Set(
    ownerResponses.map((response) => response?.decisionId).filter((id) => typeof id === "string"),
  );
  expectEqual(
    ownerResponses.length,
    baseline.counts.ownerResponses,
    "OPS_BASELINE_METRIC_MISMATCH",
    "project-ops/owner-intake.json.responses",
  );
  expectEqual(
    ownerDecisionIds.size,
    baseline.counts.ownerDecisionIds,
    "OPS_BASELINE_METRIC_MISMATCH",
    "project-ops/owner-intake.json.responses.decisionId",
  );
  if (!arraysEqualAsSets([...ownerDecisionIds], baseline.ownerIntake.decisionIds)) {
    add(
      "OPS_OWNER_DECISION_SET_MISMATCH",
      "project-ops/owner-intake.json.responses.decisionId",
      "Owner response 集合必须保留首批 12 项决定与后续 D-039 单独选择",
      { expected: baseline.ownerIntake.decisionIds, actual: [...ownerDecisionIds].sort() },
    );
  }
  const decisionById = new Map(decisions.map((decision) => [decision?.id, decision]));
  const acceptedDecisionMismatches = baseline.ownerIntake.acceptedDecisionIds
    .map((decisionId) => {
      const decision = decisionById.get(decisionId);
      const expectedChoiceKey = baseline.ownerIntake.acceptedChoiceKeys[decisionId];
      return decision?.status === "ACCEPTED" &&
        decision?.acceptedOn === "2026-08-14" &&
        decision?.choiceKey === expectedChoiceKey
        ? null
        : {
            decisionId,
            expectedStatus: "ACCEPTED",
            expectedAcceptedOn: "2026-08-14",
            expectedChoiceKey,
            actual: decision ?? null,
          };
    })
    .filter(Boolean);
  if (acceptedDecisionMismatches.length > 0) {
    add(
      "OPS_OWNER_ACCEPTED_DECISION_MISMATCH",
      "project-ops/decisions.json.decisions",
      "整批回读确认的 11 项决定必须保持精确的 ACCEPTED 状态和 choiceKey",
      { mismatches: acceptedDecisionMismatches },
    );
  }
  const d032Decision = decisionById.get("D-032");
  if (
    d032Decision?.status !== "CANDIDATE" ||
    d032Decision?.acceptedOn !== null ||
    d032Decision?.choiceKey !== baseline.ownerIntake.d032ChoiceKey
  ) {
    add(
      "OPS_OWNER_D032_SPIKE_AUTHORIZATION_MISMATCH",
      "project-ops/decisions.json.decisions",
      "D-032 必须保持 CANDIDATE + SDK 57 SPIKE_AUTHORIZED，不能提前转为 ACCEPTED",
      { actual: d032Decision ?? null },
    );
  }
  if (ownerIntake.channel !== baseline.ownerIntake.channel) {
    add(
      "OPS_OWNER_CHANNEL_CHANGED",
      "project-ops/owner-intake.json.channel",
      "Owner 决策渠道必须保持 Codex 宿主原生 request_user_input",
      { expected: baseline.ownerIntake.channel, actual: ownerIntake.channel },
    );
  }
  if (ownerIntake.status !== baseline.ownerIntake.status) {
    add(
      "OPS_OWNER_BATCH_STATUS_CHANGED",
      "project-ops/owner-intake.json.status",
      "Owner 首批整批回读必须保持 CONFIRMED",
      { expected: baseline.ownerIntake.status, actual: ownerIntake.status },
    );
  }
  if (ownerIntake.acceptanceStateChanged !== baseline.ownerIntake.acceptanceStateChanged) {
    add(
      "OPS_OWNER_ACCEPTANCE_STATE_CHANGED",
      "project-ops/owner-intake.json.acceptanceStateChanged",
      "Owner 整批确认已改变 accepted 状态，标记不得回退",
    );
  }
  ownerResponses.forEach((response, index) => {
    const expectedState = baseline.ownerIntake.responseStates[response?.questionId];
    if (response?.state !== expectedState) {
      add(
        "OPS_OWNER_RESPONSE_STATE_MISMATCH",
        `project-ops/owner-intake.json.responses[${index}].state`,
        "Owner response 必须保持整批确认后的精确终态",
        { questionId: response?.questionId, expected: expectedState, actual: response?.state },
      );
    }
  });
  const d047Responses = ownerResponses.filter((response) => response?.decisionId === "D-047");
  const d047AuditTrailValid =
    d047Responses.length === 2 &&
    d047Responses[0]?.optionKey === baseline.ownerIntake.d047InitialOption &&
    d047Responses[1]?.questionId === baseline.ownerIntake.d047LatestQuestionId &&
    d047Responses[1]?.optionKey === baseline.ownerIntake.d047LatestOption;
  if (!d047AuditTrailValid) {
    add(
      "OPS_OWNER_D047_AUDIT_TRAIL_CHANGED",
      "project-ops/owner-intake.json.responses",
      "D-047 必须保留原始 A 和后续 Owner 回正为 C 的审计顺序",
    );
  }
  if (ownerIntake.nextQuestion?.id !== baseline.ownerIntake.nextQuestionId) {
    add(
      "OPS_OWNER_NEXT_QUESTION_CHANGED",
      "project-ops/owner-intake.json.nextQuestion.id",
      "D-039 PX-3 通过后，下一张计划中的 Owner 卡必须转为 D-040",
      { expected: baseline.ownerIntake.nextQuestionId, actual: ownerIntake.nextQuestion?.id },
    );
  }
  if (ownerIntake.nextQuestion?.tool !== baseline.ownerIntake.nextQuestionTool) {
    add(
      "OPS_OWNER_NEXT_QUESTION_CHANNEL_CHANGED",
      "project-ops/owner-intake.json.nextQuestion",
      "计划中的 D-040 Owner 卡必须继续使用 Codex 宿主原生 request_user_input",
      {
        expectedTool: baseline.ownerIntake.nextQuestionTool,
        actualTool: ownerIntake.nextQuestion?.tool,
      },
    );
  }
  const ownerFacts = Array.isArray(ownerIntake.facts) ? ownerIntake.facts : [];
  const oi03Facts = ownerFacts.filter(
    (fact) => fact?.inputId === "OI-03" || fact?.questionId === "oi03_device_availability",
  );
  if (oi03Facts.length === 0) {
    add(
      "OPS_OWNER_OI03_FACT_MISSING",
      "project-ops/owner-intake.json.facts",
      "必须保留 Owner 通过原生 choice-ui 回答的唯一 OI-03 事实",
    );
  } else if (oi03Facts.length > 1) {
    add(
      "OPS_OWNER_OI03_FACT_DUPLICATE",
      "project-ops/owner-intake.json.facts",
      "OI-03 事实只能存在一条",
      { count: oi03Facts.length },
    );
  }
  const oi03Fact = oi03Facts[0];
  const oi03Mismatch = Object.entries(baseline.ownerIntake.oi03Fact)
    .filter(([key, expected]) => oi03Fact?.[key] !== expected)
    .map(([key, expected]) => ({ key, expected, actual: oi03Fact?.[key] }));
  if (oi03Fact && oi03Mismatch.length > 0) {
    add(
      "OPS_OWNER_OI03_FACT_MISMATCH",
      "project-ops/owner-intake.json.facts",
      "OI-03 必须精确保持只有 iPhone、无 Mac 且不授权原生 iOS 工作的事实",
      { mismatches: oi03Mismatch },
    );
  }
  if (ownerResponses.some((response) => response?.questionId === "oi03_device_availability")) {
    add(
      "OPS_OWNER_OI03_RECORDED_AS_DECISION",
      "project-ops/owner-intake.json.responses",
      "OI-03 是事实输入，不能进入决定 response 集合",
    );
  }
  const oi03Events = model.events.filter(
    (record) => record.value?.eventId === baseline.ownerIntake.oi03EventId,
  );
  const oi03Event = oi03Events[0]?.value;
  if (
    oi03Events.length !== 1 ||
    oi03Event?.type !== "GATE_CHANGED" ||
    oi03Event?.actor?.id !== "owner" ||
    oi03Event?.data?.inputId !== "OI-03" ||
    oi03Event?.data?.selectedOptionId !== baseline.ownerIntake.oi03Fact.selectedOptionId ||
    oi03Event?.data?.iphoneModel !== baseline.ownerIntake.oi03Fact.iphoneModel ||
    oi03Event?.data?.iosVersion !== baseline.ownerIntake.oi03Fact.iosVersion ||
    oi03Event?.data?.nativeIosWorkAuthorized !== false
  ) {
    add(
      "OPS_OWNER_OI03_EVENT_MISMATCH",
      "project-ops/events/2026-08-11.jsonl",
      "OI-03 权威事件必须与 Owner 事实一致且保持原生 iOS 未授权",
    );
  }

  const oi02Facts = ownerFacts.filter(
    (fact) => fact?.inputId === "OI-02" || fact?.questionId === "oi02_identifier_status",
  );
  if (oi02Facts.length === 0) {
    add(
      "OPS_OWNER_OI02_FACT_MISSING",
      "project-ops/owner-intake.json.facts",
      "必须保留 Owner 通过原生 request_user_input 回答的唯一 OI-02 事实",
    );
  } else if (oi02Facts.length > 1) {
    add(
      "OPS_OWNER_OI02_FACT_DUPLICATE",
      "project-ops/owner-intake.json.facts",
      "OI-02 事实只能存在一条",
      { count: oi02Facts.length },
    );
  }
  const oi02Fact = oi02Facts[0];
  const oi02Mismatch = Object.entries(baseline.ownerIntake.oi02Fact)
    .filter(([key, expected]) => oi02Fact?.[key] !== expected)
    .map(([key, expected]) => ({ key, expected, actual: oi02Fact?.[key] }));
  if (oi02Fact && oi02Mismatch.length > 0) {
    add(
      "OPS_OWNER_OI02_FACT_MISMATCH",
      "project-ops/owner-intake.json.facts",
      "OI-02 必须精确保持 Bundle ID 尚未创建、SKU=N/A 且仍未授权实现的事实",
      { mismatches: oi02Mismatch },
    );
  }
  if (ownerResponses.some((response) => response?.questionId === "oi02_identifier_status")) {
    add(
      "OPS_OWNER_OI02_RECORDED_AS_DECISION",
      "project-ops/owner-intake.json.responses",
      "OI-02 是事实输入，不能进入决定 response 集合",
    );
  }
  const oi02Events = model.events.filter(
    (record) => record.value?.eventId === baseline.ownerIntake.oi02EventId,
  );
  const oi02Event = oi02Events[0]?.value;
  if (
    oi02Events.length !== 1 ||
    oi02Event?.type !== "GATE_CHANGED" ||
    oi02Event?.actor?.id !== "owner" ||
    oi02Event?.data?.inputId !== "OI-02" ||
    oi02Event?.data?.captureTool !== baseline.ownerIntake.oi02Fact.captureTool ||
    oi02Event?.data?.selectedOptionId !== baseline.ownerIntake.oi02Fact.selectedOptionId ||
    oi02Event?.data?.normalizedValue !== baseline.ownerIntake.oi02Fact.normalizedValue ||
    oi02Event?.data?.bundleId !== null ||
    oi02Event?.data?.sku !== baseline.ownerIntake.oi02Fact.sku ||
    oi02Event?.data?.acceptanceStateChanged !== false ||
    oi02Event?.data?.nativeIosWorkAuthorized !== false ||
    oi02Event?.data?.formalImplementationAuthorized !== false
  ) {
    add(
      "OPS_OWNER_OI02_EVENT_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "OI-02 权威事件必须与原生 Owner 事实一致且保持决定、正式工程和原生 iOS 未授权",
    );
  }

  const batchConfirmationRecords = model.events.filter(
    (record) => record.value?.eventId === baseline.ownerIntake.batchConfirmationEventId,
  );
  const batchConfirmationEvent = batchConfirmationRecords[0]?.value;
  const batchAcceptedIds = batchConfirmationEvent?.data?.acceptedDecisionIds ?? [];
  const batchRemainingCandidateIds = batchConfirmationEvent?.data?.remainingCandidateDecisionIds ?? [];
  if (
    batchConfirmationRecords.length !== 1 ||
    batchConfirmationEvent?.type !== "GATE_CHANGED" ||
    batchConfirmationEvent?.actor?.id !== "owner" ||
    batchConfirmationEvent?.data?.from !== "AWAITING_BATCH_READBACK" ||
    batchConfirmationEvent?.data?.to !== "CONFIRMED" ||
    batchConfirmationEvent?.data?.questionId !== baseline.ownerIntake.batchConfirmationQuestionId ||
    batchConfirmationEvent?.data?.captureTool !== "request_user_input" ||
    !arraysEqualAsSets(batchAcceptedIds, baseline.ownerIntake.acceptedDecisionIds) ||
    !arraysEqualAsSets(batchConfirmationEvent?.data?.spikeAuthorizedDecisionIds ?? [], ["D-032"]) ||
    !arraysEqualAsSets(batchRemainingCandidateIds, ["D-032", "D-052", "D-053"]) ||
    batchConfirmationEvent?.data?.nextQuestionId !== baseline.ownerIntake.batchNextQuestionId ||
    batchConfirmationEvent?.data?.acceptanceStateChanged !== true ||
    batchConfirmationEvent?.data?.d008Superseded !== false ||
    batchConfirmationEvent?.data?.readyForJsSpike !== true ||
    batchConfirmationEvent?.data?.nativeIosWorkAuthorized !== false ||
    batchConfirmationEvent?.data?.formalRootProjectAuthorized !== false
  ) {
    add(
      "OPS_OWNER_BATCH_CONFIRMATION_EVENT_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "整批确认事件必须精确记录 11 项 ACCEPTED、D-032 隔离 JS Spike 与剩余安全门禁",
    );
  }

  const acceptedEvents = model.events
    .map((record) => record.value)
    .filter((event) => event?.type === "DECISION_ACCEPTED" && event?.correlationId === "phase0-owner-batch-readback");
  const acceptedEventIds = acceptedEvents.map((event) => event?.data?.decisionId);
  const acceptedEventChoiceMismatch = acceptedEvents.some(
    (event) => baseline.ownerIntake.acceptedChoiceKeys[event?.data?.decisionId] !== event?.data?.choiceKey,
  );
  if (
    acceptedEvents.length !== baseline.ownerIntake.acceptedDecisionIds.length ||
    !arraysEqualAsSets(acceptedEventIds, baseline.ownerIntake.acceptedDecisionIds) ||
    acceptedEventChoiceMismatch
  ) {
    add(
      "OPS_OWNER_ACCEPTED_EVENTS_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "每项整批接受决定必须恰好对应一条 choiceKey 一致的 DECISION_ACCEPTED 事件",
    );
  }

  const bodyWeightEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.bodyWeightContract.subjectId,
  );
  const bodyWeightEvent = bodyWeightEvents[0]?.value;
  const bodyWeightData = bodyWeightEvent?.data ?? {};
  if (
    bodyWeightEvents.length !== 1 ||
    bodyWeightEvent?.eventId !== baseline.bodyWeightContract.eventId ||
    bodyWeightEvent?.type !== "ARTIFACT_CREATED" ||
    bodyWeightEvent?.actor?.id !== "project-manager" ||
    bodyWeightData.contractStatus !== baseline.bodyWeightContract.contractStatus ||
    bodyWeightData.artifactState !== baseline.bodyWeightContract.artifactState ||
    bodyWeightData.featureId !== baseline.bodyWeightContract.featureId ||
    bodyWeightData.requirementId !== baseline.bodyWeightContract.requirementId ||
    bodyWeightData.acceptanceId !== baseline.bodyWeightContract.acceptanceId ||
    bodyWeightData.topLevelTests !== baseline.bodyWeightContract.topLevelTests ||
    bodyWeightData.fullSuitePassed !== baseline.bodyWeightContract.fullSuitePassed ||
    bodyWeightData.originalUnitPreserved !== baseline.bodyWeightContract.originalUnitPreserved ||
    bodyWeightData.exactConversionPreserved !== baseline.bodyWeightContract.exactConversionPreserved ||
    bodyWeightData.sameDayRecordsPreserved !== baseline.bodyWeightContract.sameDayRecordsPreserved ||
    bodyWeightData.realNetworkRequests !== baseline.bodyWeightContract.realNetworkRequests ||
    bodyWeightData.healthKitUsed !== baseline.bodyWeightContract.healthKitUsed ||
    bodyWeightData.bmiOrTargetRulesAuthorized !== baseline.bodyWeightContract.bmiOrTargetRulesAuthorized ||
    bodyWeightData.dailyMergeAuthorized !== baseline.bodyWeightContract.dailyMergeAuthorized ||
    bodyWeightData.nativeImplementationAuthorized !== baseline.bodyWeightContract.nativeImplementationAuthorized ||
    bodyWeightData.formalImplementationAuthorized !== baseline.bodyWeightContract.formalImplementationAuthorized ||
    bodyWeightData.gateStatesChanged !== baseline.bodyWeightContract.gateStatesChanged ||
    bodyWeightData.ownerIntakeChanged !== baseline.bodyWeightContract.ownerIntakeChanged
  ) {
    add(
      "OPS_BODY_WEIGHT_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "体重记录合同必须保留原始单位、精确换算和同日多记录，同时保持框架无关、非生产且不越过未决规则",
    );
  }

  const sevenDayEnergyEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.sevenDayEnergyContract.subjectId,
  );
  const sevenDayEnergyEvent = sevenDayEnergyEvents[0]?.value;
  const sevenDayEnergyData = sevenDayEnergyEvent?.data ?? {};
  if (
    sevenDayEnergyEvents.length !== 1 ||
    sevenDayEnergyEvent?.eventId !== baseline.sevenDayEnergyContract.eventId ||
    sevenDayEnergyEvent?.type !== "ARTIFACT_CREATED" ||
    sevenDayEnergyEvent?.actor?.id !== "project-manager" ||
    sevenDayEnergyData.contractStatus !== baseline.sevenDayEnergyContract.contractStatus ||
    sevenDayEnergyData.artifactState !== baseline.sevenDayEnergyContract.artifactState ||
    sevenDayEnergyData.featureId !== baseline.sevenDayEnergyContract.featureId ||
    sevenDayEnergyData.requirementId !== baseline.sevenDayEnergyContract.requirementId ||
    sevenDayEnergyData.acceptanceId !== baseline.sevenDayEnergyContract.acceptanceId ||
    sevenDayEnergyData.topLevelTests !== baseline.sevenDayEnergyContract.topLevelTests ||
    sevenDayEnergyData.fullSuitePassed !== baseline.sevenDayEnergyContract.fullSuitePassed ||
    sevenDayEnergyData.windowDays !== baseline.sevenDayEnergyContract.windowDays ||
    sevenDayEnergyData.missingDistinctFromZero !== baseline.sevenDayEnergyContract.missingDistinctFromZero ||
    sevenDayEnergyData.sourceTraceabilityPreserved !== baseline.sevenDayEnergyContract.sourceTraceabilityPreserved ||
    sevenDayEnergyData.exactEnergyAggregation !== baseline.sevenDayEnergyContract.exactEnergyAggregation ||
    sevenDayEnergyData.burnFormulaAuthorized !== baseline.sevenDayEnergyContract.burnFormulaAuthorized ||
    sevenDayEnergyData.targetOrNetAuthorized !== baseline.sevenDayEnergyContract.targetOrNetAuthorized ||
    sevenDayEnergyData.averageOrLongerWindowAuthorized !== baseline.sevenDayEnergyContract.averageOrLongerWindowAuthorized ||
    sevenDayEnergyData.realNetworkRequests !== baseline.sevenDayEnergyContract.realNetworkRequests ||
    sevenDayEnergyData.healthKitUsed !== baseline.sevenDayEnergyContract.healthKitUsed ||
    sevenDayEnergyData.aiUsed !== baseline.sevenDayEnergyContract.aiUsed ||
    sevenDayEnergyData.nativeImplementationAuthorized !== baseline.sevenDayEnergyContract.nativeImplementationAuthorized ||
    sevenDayEnergyData.formalImplementationAuthorized !== baseline.sevenDayEnergyContract.formalImplementationAuthorized ||
    sevenDayEnergyData.gateStatesChanged !== baseline.sevenDayEnergyContract.gateStatesChanged ||
    sevenDayEnergyData.ownerIntakeChanged !== baseline.sevenDayEnergyContract.ownerIntakeChanged
  ) {
    add(
      "OPS_SEVEN_DAY_ENERGY_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "七日能量读模型必须保留缺失/零与来源语义，并保持无公式、目标、平均、AI、HealthKit 或正式实现授权",
    );
  }

  const manualBurnEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.manualBurnContract.subjectId,
  );
  const manualBurnEvent = manualBurnEvents[0]?.value;
  const manualBurnData = manualBurnEvent?.data ?? {};
  if (
    manualBurnEvents.length !== 1 ||
    manualBurnEvent?.eventId !== baseline.manualBurnContract.eventId ||
    manualBurnEvent?.type !== "ARTIFACT_CREATED" ||
    manualBurnEvent?.actor?.id !== "project-manager" ||
    manualBurnData.contractStatus !== baseline.manualBurnContract.contractStatus ||
    manualBurnData.artifactState !== baseline.manualBurnContract.artifactState ||
    manualBurnData.featureId !== baseline.manualBurnContract.featureId ||
    manualBurnData.requirementId !== baseline.manualBurnContract.requirementId ||
    manualBurnData.acceptanceId !== baseline.manualBurnContract.acceptanceId ||
    manualBurnData.topLevelTests !== baseline.manualBurnContract.topLevelTests ||
    manualBurnData.fullSuitePassed !== baseline.manualBurnContract.fullSuitePassed ||
    manualBurnData.projectedStream !== baseline.manualBurnContract.projectedStream ||
    manualBurnData.projectedSourceKind !== baseline.manualBurnContract.projectedSourceKind ||
    manualBurnData.projectedQuality !== baseline.manualBurnContract.projectedQuality ||
    manualBurnData.exactEnergyPreserved !== baseline.manualBurnContract.exactEnergyPreserved ||
    manualBurnData.burnFormulaAuthorized !== baseline.manualBurnContract.burnFormulaAuthorized ||
    manualBurnData.exerciseFieldsAuthorized !== baseline.manualBurnContract.exerciseFieldsAuthorized ||
    manualBurnData.stepsUsed !== baseline.manualBurnContract.stepsUsed ||
    manualBurnData.healthKitUsed !== baseline.manualBurnContract.healthKitUsed ||
    manualBurnData.realNetworkRequests !== baseline.manualBurnContract.realNetworkRequests ||
    manualBurnData.aiUsed !== baseline.manualBurnContract.aiUsed ||
    manualBurnData.nativeImplementationAuthorized !== baseline.manualBurnContract.nativeImplementationAuthorized ||
    manualBurnData.formalImplementationAuthorized !== baseline.manualBurnContract.formalImplementationAuthorized ||
    manualBurnData.gateStatesChanged !== baseline.manualBurnContract.gateStatesChanged ||
    manualBurnData.ownerIntakeChanged !== baseline.manualBurnContract.ownerIntakeChanged
  ) {
    add(
      "OPS_MANUAL_BURN_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "手工消耗合同必须投影为 USER_ENTERED/MANUAL_BURN，并保持无公式、运动字段、步数、HealthKit、AI 或正式实现授权",
    );
  }

  const waterRecordEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.waterRecordContract.subjectId,
  );
  const waterRecordEvent = waterRecordEvents[0]?.value;
  const waterRecordData = waterRecordEvent?.data ?? {};
  if (
    waterRecordEvents.length !== 1 ||
    waterRecordEvent?.eventId !== baseline.waterRecordContract.eventId ||
    waterRecordEvent?.type !== "ARTIFACT_CREATED" ||
    waterRecordEvent?.actor?.id !== "project-manager" ||
    waterRecordData.contractStatus !== baseline.waterRecordContract.contractStatus ||
    waterRecordData.artifactState !== baseline.waterRecordContract.artifactState ||
    waterRecordData.featureId !== baseline.waterRecordContract.featureId ||
    waterRecordData.requirementId !== baseline.waterRecordContract.requirementId ||
    waterRecordData.acceptanceId !== baseline.waterRecordContract.acceptanceId ||
    waterRecordData.topLevelTests !== baseline.waterRecordContract.topLevelTests ||
    waterRecordData.fullSuitePassed !== baseline.waterRecordContract.fullSuitePassed ||
    waterRecordData.originalValuePreserved !== baseline.waterRecordContract.originalValuePreserved ||
    waterRecordData.explicitVersionedUnitDefinition !== baseline.waterRecordContract.explicitVersionedUnitDefinition ||
    waterRecordData.exactDailyAggregation !== baseline.waterRecordContract.exactDailyAggregation ||
    waterRecordData.emptyDistinctFromZero !== baseline.waterRecordContract.emptyDistinctFromZero ||
    waterRecordData.goalAuthorized !== baseline.waterRecordContract.goalAuthorized ||
    waterRecordData.quickAmountAuthorized !== baseline.waterRecordContract.quickAmountAuthorized ||
    waterRecordData.defaultOrDisplayUnitAuthorized !== baseline.waterRecordContract.defaultOrDisplayUnitAuthorized ||
    waterRecordData.undoAuthorized !== baseline.waterRecordContract.undoAuthorized ||
    waterRecordData.trendAuthorized !== baseline.waterRecordContract.trendAuthorized ||
    waterRecordData.reminderAuthorized !== baseline.waterRecordContract.reminderAuthorized ||
    waterRecordData.healthKitUsed !== baseline.waterRecordContract.healthKitUsed ||
    waterRecordData.realNetworkRequests !== baseline.waterRecordContract.realNetworkRequests ||
    waterRecordData.aiUsed !== baseline.waterRecordContract.aiUsed ||
    waterRecordData.nativeImplementationAuthorized !== baseline.waterRecordContract.nativeImplementationAuthorized ||
    waterRecordData.formalImplementationAuthorized !== baseline.waterRecordContract.formalImplementationAuthorized ||
    waterRecordData.gateStatesChanged !== baseline.waterRecordContract.gateStatesChanged ||
    waterRecordData.ownerIntakeChanged !== baseline.waterRecordContract.ownerIntakeChanged
  ) {
    add(
      "OPS_WATER_RECORD_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "饮水合同只登记原始容量、显式版本化单位定义、事务与精确当日汇总；不得授权目标、快捷量、默认/展示单位、撤销、趋势、提醒、HealthKit、AI 或正式实现",
    );
  }

  const localReminderEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.localReminderContract.subjectId,
  );
  const localReminderEvent = localReminderEvents[0]?.value;
  const localReminderData = localReminderEvent?.data ?? {};
  if (
    localReminderEvents.length !== 1 ||
    localReminderEvent?.eventId !== baseline.localReminderContract.eventId ||
    localReminderEvent?.type !== "ARTIFACT_CREATED" ||
    localReminderEvent?.actor?.id !== "project-manager" ||
    localReminderData.contractStatus !== baseline.localReminderContract.contractStatus ||
    localReminderData.artifactState !== baseline.localReminderContract.artifactState ||
    localReminderData.featureId !== baseline.localReminderContract.featureId ||
    localReminderData.requirementId !== baseline.localReminderContract.requirementId ||
    localReminderData.acceptanceId !== baseline.localReminderContract.acceptanceId ||
    localReminderData.topLevelTests !== baseline.localReminderContract.topLevelTests ||
    localReminderData.fullSuitePassed !== baseline.localReminderContract.fullSuitePassed ||
    localReminderData.localRuleCrudPreserved !== baseline.localReminderContract.localRuleCrudPreserved ||
    localReminderData.permissionIndependentPersistence !== baseline.localReminderContract.permissionIndependentPersistence ||
    localReminderData.rulesGenerationProtected !== baseline.localReminderContract.rulesGenerationProtected ||
    localReminderData.desiredStateGenerationProtected !== baseline.localReminderContract.desiredStateGenerationProtected ||
    localReminderData.pendingDeliveredSeparated !== baseline.localReminderContract.pendingDeliveredSeparated ||
    localReminderData.unknownResultRequiresReenumeration !== baseline.localReminderContract.unknownResultRequiresReenumeration ||
    localReminderData.systemPresentationGuaranteed !== baseline.localReminderContract.systemPresentationGuaranteed ||
    localReminderData.reminderTypeAuthorized !== baseline.localReminderContract.reminderTypeAuthorized ||
    localReminderData.recurrenceRulesAuthorized !== baseline.localReminderContract.recurrenceRulesAuthorized ||
    localReminderData.notificationContentAuthorized !== baseline.localReminderContract.notificationContentAuthorized ||
    localReminderData.pushOrApnsUsed !== baseline.localReminderContract.pushOrApnsUsed ||
    localReminderData.backgroundTimerUsed !== baseline.localReminderContract.backgroundTimerUsed ||
    localReminderData.realNotificationApiCalls !== baseline.localReminderContract.realNotificationApiCalls ||
    localReminderData.realNetworkRequests !== baseline.localReminderContract.realNetworkRequests ||
    localReminderData.nativeImplementationAuthorized !== baseline.localReminderContract.nativeImplementationAuthorized ||
    localReminderData.formalImplementationAuthorized !== baseline.localReminderContract.formalImplementationAuthorized ||
    localReminderData.gateStatesChanged !== baseline.localReminderContract.gateStatesChanged ||
    localReminderData.ownerIntakeChanged !== baseline.localReminderContract.ownerIntakeChanged
  ) {
    add(
      "OPS_LOCAL_REMINDER_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "提醒合同只登记本地规则 CRUD、权限独立保存、generation 防回滚和 pending/delivered 对账；不得授权提醒类型、重复规则、通知内容、Push/APNs、后台定时器、真实通知 API 或正式实现",
    );
  }

  const dateNavigationEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.dateNavigationContract.subjectId,
  );
  const dateNavigationEvent = dateNavigationEvents[0]?.value;
  const dateNavigationData = dateNavigationEvent?.data ?? {};
  if (
    dateNavigationEvents.length !== 1 ||
    dateNavigationEvent?.eventId !== baseline.dateNavigationContract.eventId ||
    dateNavigationEvent?.type !== "ARTIFACT_CREATED" ||
    dateNavigationEvent?.actor?.id !== "project-manager" ||
    dateNavigationData.contractStatus !== baseline.dateNavigationContract.contractStatus ||
    dateNavigationData.artifactState !== baseline.dateNavigationContract.artifactState ||
    dateNavigationData.featureId !== baseline.dateNavigationContract.featureId ||
    dateNavigationData.requirementId !== baseline.dateNavigationContract.requirementId ||
    dateNavigationData.acceptanceId !== baseline.dateNavigationContract.acceptanceId ||
    dateNavigationData.topLevelTests !== baseline.dateNavigationContract.topLevelTests ||
    dateNavigationData.fullSuitePassed !== baseline.dateNavigationContract.fullSuitePassed ||
    dateNavigationData.explicitDateObservation !== baseline.dateNavigationContract.explicitDateObservation ||
    dateNavigationData.ianaTimeZoneValidated !== baseline.dateNavigationContract.ianaTimeZoneValidated ||
    dateNavigationData.dstAndMidnightCovered !== baseline.dateNavigationContract.dstAndMidnightCovered ||
    dateNavigationData.observationGenerationProtected !== baseline.dateNavigationContract.observationGenerationProtected ||
    dateNavigationData.staleNavigationRejected !== baseline.dateNavigationContract.staleNavigationRejected ||
    dateNavigationData.externalPolicyEvidenceRequired !== baseline.dateNavigationContract.externalPolicyEvidenceRequired ||
    dateNavigationData.selectionPreservedOnObservationRefresh !== baseline.dateNavigationContract.selectionPreservedOnObservationRefresh ||
    dateNavigationData.futureDateRuleAuthorized !== baseline.dateNavigationContract.futureDateRuleAuthorized ||
    dateNavigationData.backfillRuleAuthorized !== baseline.dateNavigationContract.backfillRuleAuthorized ||
    dateNavigationData.crossTimeZoneRebaseAuthorized !== baseline.dateNavigationContract.crossTimeZoneRebaseAuthorized ||
    dateNavigationData.defaultTodayBehaviorAuthorized !== baseline.dateNavigationContract.defaultTodayBehaviorAuthorized ||
    dateNavigationData.uiBehaviorAuthorized !== baseline.dateNavigationContract.uiBehaviorAuthorized ||
    dateNavigationData.persistenceUsed !== baseline.dateNavigationContract.persistenceUsed ||
    dateNavigationData.systemClockRead !== baseline.dateNavigationContract.systemClockRead ||
    dateNavigationData.realNetworkRequests !== baseline.dateNavigationContract.realNetworkRequests ||
    dateNavigationData.nativeImplementationAuthorized !== baseline.dateNavigationContract.nativeImplementationAuthorized ||
    dateNavigationData.formalImplementationAuthorized !== baseline.dateNavigationContract.formalImplementationAuthorized ||
    dateNavigationData.gateStatesChanged !== baseline.dateNavigationContract.gateStatesChanged ||
    dateNavigationData.ownerIntakeChanged !== baseline.dateNavigationContract.ownerIntakeChanged
  ) {
    add(
      "OPS_DATE_NAVIGATION_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "日期导航合同只登记显式日期观察、DST/午夜滚日、generation 防回滚和外部策略绑定；不得授权未来日、补记、跨时区重基、默认今天、UI、持久化、系统时钟、网络、原生或正式实现",
    );
  }

  const mealSlotGroupingEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.mealSlotGroupingContract.subjectId,
  );
  const mealSlotGroupingEvent = mealSlotGroupingEvents[0]?.value;
  const mealSlotGroupingData = mealSlotGroupingEvent?.data ?? {};
  if (
    mealSlotGroupingEvents.length !== 1 ||
    mealSlotGroupingEvent?.eventId !== baseline.mealSlotGroupingContract.eventId ||
    mealSlotGroupingEvent?.type !== "ARTIFACT_CREATED" ||
    mealSlotGroupingEvent?.actor?.id !== "project-manager" ||
    mealSlotGroupingData.contractStatus !== baseline.mealSlotGroupingContract.contractStatus ||
    mealSlotGroupingData.artifactState !== baseline.mealSlotGroupingContract.artifactState ||
    mealSlotGroupingData.featureId !== baseline.mealSlotGroupingContract.featureId ||
    mealSlotGroupingData.requirementId !== baseline.mealSlotGroupingContract.requirementId ||
    mealSlotGroupingData.acceptanceId !== baseline.mealSlotGroupingContract.acceptanceId ||
    mealSlotGroupingData.topLevelTests !== baseline.mealSlotGroupingContract.topLevelTests ||
    mealSlotGroupingData.fullSuitePassed !== baseline.mealSlotGroupingContract.fullSuitePassed ||
    mealSlotGroupingData.explicitVersionedDefinition !== baseline.mealSlotGroupingContract.explicitVersionedDefinition ||
    mealSlotGroupingData.explicitOrderingPreserved !== baseline.mealSlotGroupingContract.explicitOrderingPreserved ||
    mealSlotGroupingData.emptySlotsPreserved !== baseline.mealSlotGroupingContract.emptySlotsPreserved ||
    mealSlotGroupingData.unassignedDistinctFromUnresolved !== baseline.mealSlotGroupingContract.unassignedDistinctFromUnresolved ||
    mealSlotGroupingData.historicalDefinitionPreserved !== baseline.mealSlotGroupingContract.historicalDefinitionPreserved ||
    mealSlotGroupingData.revisionTraceabilityPreserved !== baseline.mealSlotGroupingContract.revisionTraceabilityPreserved ||
    mealSlotGroupingData.builtInDefaultSlots !== baseline.mealSlotGroupingContract.builtInDefaultSlots ||
    mealSlotGroupingData.defaultOrCustomRulesAuthorized !== baseline.mealSlotGroupingContract.defaultOrCustomRulesAuthorized ||
    mealSlotGroupingData.moveOrCopyAuthorized !== baseline.mealSlotGroupingContract.moveOrCopyAuthorized ||
    mealSlotGroupingData.targetRulesAuthorized !== baseline.mealSlotGroupingContract.targetRulesAuthorized ||
    mealSlotGroupingData.uiBehaviorAuthorized !== baseline.mealSlotGroupingContract.uiBehaviorAuthorized ||
    mealSlotGroupingData.persistenceUsed !== baseline.mealSlotGroupingContract.persistenceUsed ||
    mealSlotGroupingData.systemClockRead !== baseline.mealSlotGroupingContract.systemClockRead ||
    mealSlotGroupingData.realNetworkRequests !== baseline.mealSlotGroupingContract.realNetworkRequests ||
    mealSlotGroupingData.nativeImplementationAuthorized !== baseline.mealSlotGroupingContract.nativeImplementationAuthorized ||
    mealSlotGroupingData.formalImplementationAuthorized !== baseline.mealSlotGroupingContract.formalImplementationAuthorized ||
    mealSlotGroupingData.gateStatesChanged !== baseline.mealSlotGroupingContract.gateStatesChanged ||
    mealSlotGroupingData.ownerIntakeChanged !== baseline.mealSlotGroupingContract.ownerIntakeChanged
  ) {
    add(
      "OPS_MEAL_SLOT_GROUPING_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "餐次分组合同只登记调用方版本化定义、显式顺序、空餐次、未分配/旧定义分离和 revision 反查；不得授权内建默认、默认/自定义规则、移动/复制、目标、UI、持久化、系统时钟、网络、原生或正式实现",
    );
  }

  const macroTargetHistoryEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.macroTargetHistoryContract.subjectId,
  );
  const macroTargetHistoryEvent = macroTargetHistoryEvents[0]?.value;
  const macroTargetHistoryData = macroTargetHistoryEvent?.data ?? {};
  if (
    macroTargetHistoryEvents.length !== 1 ||
    macroTargetHistoryEvent?.eventId !== baseline.macroTargetHistoryContract.eventId ||
    macroTargetHistoryEvent?.type !== "ARTIFACT_CREATED" ||
    macroTargetHistoryEvent?.actor?.id !== "project-manager" ||
    macroTargetHistoryData.contractStatus !== baseline.macroTargetHistoryContract.contractStatus ||
    macroTargetHistoryData.artifactState !== baseline.macroTargetHistoryContract.artifactState ||
    macroTargetHistoryData.featureId !== baseline.macroTargetHistoryContract.featureId ||
    macroTargetHistoryData.requirementId !== baseline.macroTargetHistoryContract.requirementId ||
    macroTargetHistoryData.acceptanceId !== baseline.macroTargetHistoryContract.acceptanceId ||
    macroTargetHistoryData.topLevelTests !== baseline.macroTargetHistoryContract.topLevelTests ||
    macroTargetHistoryData.fullSuitePassed !== baseline.macroTargetHistoryContract.fullSuitePassed ||
    macroTargetHistoryData.originalTargetValuePreserved !== baseline.macroTargetHistoryContract.originalTargetValuePreserved ||
    macroTargetHistoryData.explicitVersionedUnitDefinition !== baseline.macroTargetHistoryContract.explicitVersionedUnitDefinition ||
    macroTargetHistoryData.zeroDistinctFromUnset !== baseline.macroTargetHistoryContract.zeroDistinctFromUnset ||
    macroTargetHistoryData.historicalEffectiveDatePreserved !== baseline.macroTargetHistoryContract.historicalEffectiveDatePreserved ||
    macroTargetHistoryData.futureVersionDoesNotRewritePast !== baseline.macroTargetHistoryContract.futureVersionDoesNotRewritePast ||
    macroTargetHistoryData.sourceAndUserEditTraceability !== baseline.macroTargetHistoryContract.sourceAndUserEditTraceability ||
    macroTargetHistoryData.actualMissingSemanticsPreserved !== baseline.macroTargetHistoryContract.actualMissingSemanticsPreserved ||
    macroTargetHistoryData.actualTargetCompatibilityInferred !== baseline.macroTargetHistoryContract.actualTargetCompatibilityInferred ||
    macroTargetHistoryData.targetAlgorithmAuthorized !== baseline.macroTargetHistoryContract.targetAlgorithmAuthorized ||
    macroTargetHistoryData.percentConversionAuthorized !== baseline.macroTargetHistoryContract.percentConversionAuthorized ||
    macroTargetHistoryData.comparisonPolicyAuthorized !== baseline.macroTargetHistoryContract.comparisonPolicyAuthorized ||
    macroTargetHistoryData.roundingPolicyAuthorized !== baseline.macroTargetHistoryContract.roundingPolicyAuthorized ||
    macroTargetHistoryData.mutationAuthorized !== baseline.macroTargetHistoryContract.mutationAuthorized ||
    macroTargetHistoryData.persistenceUsed !== baseline.macroTargetHistoryContract.persistenceUsed ||
    macroTargetHistoryData.systemClockRead !== baseline.macroTargetHistoryContract.systemClockRead ||
    macroTargetHistoryData.realNetworkRequests !== baseline.macroTargetHistoryContract.realNetworkRequests ||
    macroTargetHistoryData.nativeImplementationAuthorized !== baseline.macroTargetHistoryContract.nativeImplementationAuthorized ||
    macroTargetHistoryData.formalImplementationAuthorized !== baseline.macroTargetHistoryContract.formalImplementationAuthorized ||
    macroTargetHistoryData.gateStatesChanged !== baseline.macroTargetHistoryContract.gateStatesChanged ||
    macroTargetHistoryData.ownerIntakeChanged !== baseline.macroTargetHistoryContract.ownerIntakeChanged
  ) {
    add(
      "OPS_MACRO_TARGET_HISTORY_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "宏量目标历史合同只登记既有目标事实的原值、单位定义、来源、用户编辑状态和生效历史；不得推断实际/目标兼容性或授权算法、百分比换算、比较、舍入、写入、持久化、系统时钟、网络、原生或正式实现",
    );
  }

  const dailyEnergyLedgerEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.dailyEnergyLedgerContract.subjectId,
  );
  const dailyEnergyLedgerEvent = dailyEnergyLedgerEvents[0]?.value;
  const dailyEnergyLedgerData = dailyEnergyLedgerEvent?.data ?? {};
  if (
    dailyEnergyLedgerEvents.length !== 1 ||
    dailyEnergyLedgerEvent?.eventId !== baseline.dailyEnergyLedgerContract.eventId ||
    dailyEnergyLedgerEvent?.type !== "ARTIFACT_CREATED" ||
    dailyEnergyLedgerEvent?.actor?.id !== "project-manager" ||
    dailyEnergyLedgerData.contractStatus !== baseline.dailyEnergyLedgerContract.contractStatus ||
    dailyEnergyLedgerData.artifactState !== baseline.dailyEnergyLedgerContract.artifactState ||
    dailyEnergyLedgerData.featureId !== baseline.dailyEnergyLedgerContract.featureId ||
    dailyEnergyLedgerData.requirementId !== baseline.dailyEnergyLedgerContract.requirementId ||
    dailyEnergyLedgerData.acceptanceId !== baseline.dailyEnergyLedgerContract.acceptanceId ||
    dailyEnergyLedgerData.topLevelTests !== baseline.dailyEnergyLedgerContract.topLevelTests ||
    dailyEnergyLedgerData.fullSuitePassed !== baseline.dailyEnergyLedgerContract.fullSuitePassed ||
    dailyEnergyLedgerData.exactIntakeAndBurnAggregation !== baseline.dailyEnergyLedgerContract.exactIntakeAndBurnAggregation ||
    dailyEnergyLedgerData.missingDistinctFromZero !== baseline.dailyEnergyLedgerContract.missingDistinctFromZero ||
    dailyEnergyLedgerData.sourceRevisionTraceability !== baseline.dailyEnergyLedgerContract.sourceRevisionTraceability ||
    dailyEnergyLedgerData.historicalTargetEffectiveDatePreserved !== baseline.dailyEnergyLedgerContract.historicalTargetEffectiveDatePreserved ||
    dailyEnergyLedgerData.futureTargetDoesNotRewritePast !== baseline.dailyEnergyLedgerContract.futureTargetDoesNotRewritePast ||
    dailyEnergyLedgerData.targetSourceAndUserEditTraceability !== baseline.dailyEnergyLedgerContract.targetSourceAndUserEditTraceability ||
    dailyEnergyLedgerData.leftStatus !== baseline.dailyEnergyLedgerContract.leftStatus ||
    dailyEnergyLedgerData.leftFormulaAuthorized !== baseline.dailyEnergyLedgerContract.leftFormulaAuthorized ||
    dailyEnergyLedgerData.targetAlgorithmAuthorized !== baseline.dailyEnergyLedgerContract.targetAlgorithmAuthorized ||
    dailyEnergyLedgerData.missingBurnDefaultAuthorized !== baseline.dailyEnergyLedgerContract.missingBurnDefaultAuthorized ||
    dailyEnergyLedgerData.negativeLeftPolicyAuthorized !== baseline.dailyEnergyLedgerContract.negativeLeftPolicyAuthorized ||
    dailyEnergyLedgerData.roundingPolicyAuthorized !== baseline.dailyEnergyLedgerContract.roundingPolicyAuthorized ||
    dailyEnergyLedgerData.mutationAuthorized !== baseline.dailyEnergyLedgerContract.mutationAuthorized ||
    dailyEnergyLedgerData.persistenceUsed !== baseline.dailyEnergyLedgerContract.persistenceUsed ||
    dailyEnergyLedgerData.systemClockRead !== baseline.dailyEnergyLedgerContract.systemClockRead ||
    dailyEnergyLedgerData.aiUsed !== baseline.dailyEnergyLedgerContract.aiUsed ||
    dailyEnergyLedgerData.healthKitUsed !== baseline.dailyEnergyLedgerContract.healthKitUsed ||
    dailyEnergyLedgerData.realNetworkRequests !== baseline.dailyEnergyLedgerContract.realNetworkRequests ||
    dailyEnergyLedgerData.nativeImplementationAuthorized !== baseline.dailyEnergyLedgerContract.nativeImplementationAuthorized ||
    dailyEnergyLedgerData.formalImplementationAuthorized !== baseline.dailyEnergyLedgerContract.formalImplementationAuthorized ||
    dailyEnergyLedgerData.gateStatesChanged !== baseline.dailyEnergyLedgerContract.gateStatesChanged ||
    dailyEnergyLedgerData.ownerIntakeChanged !== baseline.dailyEnergyLedgerContract.ownerIntakeChanged
  ) {
    add(
      "OPS_DAILY_ENERGY_LEDGER_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "日能量账本合同只登记指定日期的摄入/消耗/有效目标事实与来源；Left 必须保持 POLICY_NOT_AUTHORIZED，不得授权公式、目标生成、缺失消耗默认值、负值、舍入、写入、持久化、系统时钟、AI、HealthKit、网络、原生或正式实现",
    );
  }

  const localProfileRecordEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.localProfileRecordContract.subjectId,
  );
  const localProfileRecordEvent = localProfileRecordEvents[0]?.value;
  const localProfileRecordData = localProfileRecordEvent?.data ?? {};
  if (
    localProfileRecordEvents.length !== 1 ||
    localProfileRecordEvent?.eventId !== baseline.localProfileRecordContract.eventId ||
    localProfileRecordEvent?.type !== "ARTIFACT_CREATED" ||
    localProfileRecordEvent?.actor?.id !== "project-manager" ||
    localProfileRecordData.contractStatus !== baseline.localProfileRecordContract.contractStatus ||
    localProfileRecordData.artifactState !== baseline.localProfileRecordContract.artifactState ||
    !arraysEqualAsSets(localProfileRecordData.featureIds ?? [], baseline.localProfileRecordContract.featureIds) ||
    !arraysEqualAsSets(localProfileRecordData.requirementIds ?? [], baseline.localProfileRecordContract.requirementIds) ||
    !arraysEqualAsSets(localProfileRecordData.acceptanceIds ?? [], baseline.localProfileRecordContract.acceptanceIds) ||
    localProfileRecordData.topLevelTests !== baseline.localProfileRecordContract.topLevelTests ||
    localProfileRecordData.fullSuitePassed !== baseline.localProfileRecordContract.fullSuitePassed ||
    localProfileRecordData.explicitVersionedOpaqueSchema !== baseline.localProfileRecordContract.explicitVersionedOpaqueSchema ||
    localProfileRecordData.emptyDocumentPreserved !== baseline.localProfileRecordContract.emptyDocumentPreserved ||
    localProfileRecordData.revisionCasAndIdempotency !== baseline.localProfileRecordContract.revisionCasAndIdempotency ||
    localProfileRecordData.unknownResultReplay !== baseline.localProfileRecordContract.unknownResultReplay ||
    localProfileRecordData.relatedDataEvidenceUnchanged !== baseline.localProfileRecordContract.relatedDataEvidenceUnchanged ||
    localProfileRecordData.relatedDataMutation !== baseline.localProfileRecordContract.relatedDataMutation ||
    localProfileRecordData.approvedProfileFields !== baseline.localProfileRecordContract.approvedProfileFields ||
    localProfileRecordData.activeProfilePolicyAuthorized !== baseline.localProfileRecordContract.activeProfilePolicyAuthorized ||
    localProfileRecordData.multiProfileUxAuthorized !== baseline.localProfileRecordContract.multiProfileUxAuthorized ||
    localProfileRecordData.cascadeDeleteAuthorized !== baseline.localProfileRecordContract.cascadeDeleteAuthorized ||
    localProfileRecordData.formulaAuthorized !== baseline.localProfileRecordContract.formulaAuthorized ||
    localProfileRecordData.accountOrServerUsed !== baseline.localProfileRecordContract.accountOrServerUsed ||
    localProfileRecordData.persistenceUsed !== baseline.localProfileRecordContract.persistenceUsed ||
    localProfileRecordData.systemClockRead !== baseline.localProfileRecordContract.systemClockRead ||
    localProfileRecordData.realNetworkRequests !== baseline.localProfileRecordContract.realNetworkRequests ||
    localProfileRecordData.nativeImplementationAuthorized !== baseline.localProfileRecordContract.nativeImplementationAuthorized ||
    localProfileRecordData.formalImplementationAuthorized !== baseline.localProfileRecordContract.formalImplementationAuthorized ||
    localProfileRecordData.gateStatesChanged !== baseline.localProfileRecordContract.gateStatesChanged ||
    localProfileRecordData.ownerIntakeChanged !== baseline.localProfileRecordContract.ownerIntakeChanged
  ) {
    add(
      "OPS_LOCAL_PROFILE_RECORD_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "F12/F17 本地档案合同只登记调用方版本化 opaque schema、CRUD CAS、幂等和非级联删除证据；不得授权资料字段、当前/多档案策略、级联目标/体重/日记/饮水删除、公式、账号/服务器、持久化、系统时钟、网络、原生或正式实现",
    );
  }

  const localDataAccessEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.localDataAccessManifestContract.subjectId,
  );
  const localDataAccessEvent = localDataAccessEvents[0]?.value;
  const localDataAccessData = localDataAccessEvent?.data ?? {};
  if (
    localDataAccessEvents.length !== 1 ||
    localDataAccessEvent?.eventId !== baseline.localDataAccessManifestContract.eventId ||
    localDataAccessEvent?.type !== "ARTIFACT_CREATED" ||
    localDataAccessEvent?.actor?.id !== "project-manager" ||
    localDataAccessData.contractStatus !== baseline.localDataAccessManifestContract.contractStatus ||
    localDataAccessData.artifactState !== baseline.localDataAccessManifestContract.artifactState ||
    localDataAccessData.featureId !== baseline.localDataAccessManifestContract.featureId ||
    localDataAccessData.requirementId !== baseline.localDataAccessManifestContract.requirementId ||
    localDataAccessData.acceptanceId !== baseline.localDataAccessManifestContract.acceptanceId ||
    localDataAccessData.topLevelTests !== baseline.localDataAccessManifestContract.topLevelTests ||
    localDataAccessData.fullSuitePassed !== baseline.localDataAccessManifestContract.fullSuitePassed ||
    localDataAccessData.explicitVersionedDomainDefinitions !== baseline.localDataAccessManifestContract.explicitVersionedDomainDefinitions ||
    localDataAccessData.emptyDomainsPreserved !== baseline.localDataAccessManifestContract.emptyDomainsPreserved ||
    localDataAccessData.stableSnapshotAndCursorBinding !== baseline.localDataAccessManifestContract.stableSnapshotAndCursorBinding ||
    localDataAccessData.completeReadVerification !== baseline.localDataAccessManifestContract.completeReadVerification ||
    localDataAccessData.deliveryMode !== baseline.localDataAccessManifestContract.deliveryMode ||
    localDataAccessData.businessDataBoundary !== baseline.localDataAccessManifestContract.businessDataBoundary ||
    localDataAccessData.keychainSecretValues !== baseline.localDataAccessManifestContract.keychainSecretValues ||
    localDataAccessData.nativeContainerInventory !== baseline.localDataAccessManifestContract.nativeContainerInventory ||
    localDataAccessData.externalFilesCopies !== baseline.localDataAccessManifestContract.externalFilesCopies ||
    localDataAccessData.artifactCreation !== baseline.localDataAccessManifestContract.artifactCreation ||
    localDataAccessData.mutation !== baseline.localDataAccessManifestContract.mutation ||
    localDataAccessData.plaintextExportAuthorized !== baseline.localDataAccessManifestContract.plaintextExportAuthorized ||
    localDataAccessData.backupOrRestoreAuthorized !== baseline.localDataAccessManifestContract.backupOrRestoreAuthorized ||
    localDataAccessData.persistenceUsed !== baseline.localDataAccessManifestContract.persistenceUsed ||
    localDataAccessData.systemClockRead !== baseline.localDataAccessManifestContract.systemClockRead ||
    localDataAccessData.realNetworkRequests !== baseline.localDataAccessManifestContract.realNetworkRequests ||
    localDataAccessData.nativeImplementationAuthorized !== baseline.localDataAccessManifestContract.nativeImplementationAuthorized ||
    localDataAccessData.formalImplementationAuthorized !== baseline.localDataAccessManifestContract.formalImplementationAuthorized ||
    localDataAccessData.gateStatesChanged !== baseline.localDataAccessManifestContract.gateStatesChanged ||
    localDataAccessData.ownerIntakeChanged !== baseline.localDataAccessManifestContract.ownerIntakeChanged
  ) {
    add(
      "OPS_LOCAL_DATA_ACCESS_MANIFEST_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "F18 本地数据访问合同只登记应用内只读分页、空领域、快照/游标/页面绑定和全量完成证明；不得授权明文导出、备份/恢复、秘密值返回、原生容器枚举、Files 副本控制、写入、持久化、系统时钟、网络、原生或正式实现",
    );
  }

  const localDataRegistryEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.localDataAccessRegistryContract.subjectId,
  );
  const localDataRegistryEvent = localDataRegistryEvents[0]?.value;
  const localDataRegistryData = localDataRegistryEvent?.data ?? {};
  if (
    localDataRegistryEvents.length !== 1 ||
    localDataRegistryEvent?.eventId !== baseline.localDataAccessRegistryContract.eventId ||
    localDataRegistryEvent?.type !== "ARTIFACT_CREATED" ||
    localDataRegistryEvent?.actor?.id !== "project-manager" ||
    localDataRegistryData.contractStatus !== baseline.localDataAccessRegistryContract.contractStatus ||
    localDataRegistryData.artifactState !== baseline.localDataAccessRegistryContract.artifactState ||
    localDataRegistryData.featureId !== baseline.localDataAccessRegistryContract.featureId ||
    localDataRegistryData.requirementId !== baseline.localDataAccessRegistryContract.requirementId ||
    localDataRegistryData.acceptanceId !== baseline.localDataAccessRegistryContract.acceptanceId ||
    localDataRegistryData.topLevelTests !== baseline.localDataAccessRegistryContract.topLevelTests ||
    localDataRegistryData.fullSuitePassed !== baseline.localDataAccessRegistryContract.fullSuitePassed ||
    localDataRegistryData.singleVersionedDomainRegistry !== baseline.localDataAccessRegistryContract.singleVersionedDomainRegistry ||
    localDataRegistryData.uniqueDomainPositionAndAdapter !== baseline.localDataAccessRegistryContract.uniqueDomainPositionAndAdapter ||
    localDataRegistryData.completeRegisteredDomainSetRequired !== baseline.localDataAccessRegistryContract.completeRegisteredDomainSetRequired ||
    localDataRegistryData.consistentReadSnapshotPort !== baseline.localDataAccessRegistryContract.consistentReadSnapshotPort ||
    localDataRegistryData.repositoryGenerationBound !== baseline.localDataAccessRegistryContract.repositoryGenerationBound ||
    localDataRegistryData.registryFingerprintBound !== baseline.localDataAccessRegistryContract.registryFingerprintBound ||
    localDataRegistryData.everyRegisteredDomainReadExactlyOnce !== baseline.localDataAccessRegistryContract.everyRegisteredDomainReadExactlyOnce ||
    localDataRegistryData.emptyDomainsPreserved !== baseline.localDataAccessRegistryContract.emptyDomainsPreserved ||
    localDataRegistryData.abortedTransactionClosed !== baseline.localDataAccessRegistryContract.abortedTransactionClosed ||
    localDataRegistryData.closeReceiptRequiredBeforePublish !== baseline.localDataAccessRegistryContract.closeReceiptRequiredBeforePublish ||
    localDataRegistryData.mixedGenerationPrevented !== baseline.localDataAccessRegistryContract.mixedGenerationPrevented ||
    localDataRegistryData.deliveryMode !== baseline.localDataAccessRegistryContract.deliveryMode ||
    localDataRegistryData.sqliteAccessLayerAuthorized !== baseline.localDataAccessRegistryContract.sqliteAccessLayerAuthorized ||
    localDataRegistryData.sqlCipherSnapshotImplemented !== baseline.localDataAccessRegistryContract.sqlCipherSnapshotImplemented ||
    localDataRegistryData.businessDomainFieldsApproved !== baseline.localDataAccessRegistryContract.businessDomainFieldsApproved ||
    localDataRegistryData.plaintextExportAuthorized !== baseline.localDataAccessRegistryContract.plaintextExportAuthorized ||
    localDataRegistryData.backupOrRestoreAuthorized !== baseline.localDataAccessRegistryContract.backupOrRestoreAuthorized ||
    localDataRegistryData.persistenceUsed !== baseline.localDataAccessRegistryContract.persistenceUsed ||
    localDataRegistryData.systemClockRead !== baseline.localDataAccessRegistryContract.systemClockRead ||
    localDataRegistryData.realNetworkRequests !== baseline.localDataAccessRegistryContract.realNetworkRequests ||
    localDataRegistryData.nativeImplementationAuthorized !== baseline.localDataAccessRegistryContract.nativeImplementationAuthorized ||
    localDataRegistryData.formalImplementationAuthorized !== baseline.localDataAccessRegistryContract.formalImplementationAuthorized ||
    localDataRegistryData.gateStatesChanged !== baseline.localDataAccessRegistryContract.gateStatesChanged ||
    localDataRegistryData.ownerIntakeChanged !== baseline.localDataAccessRegistryContract.ownerIntakeChanged
  ) {
    add(
      "OPS_LOCAL_DATA_ACCESS_REGISTRY_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F18 注册表合同只登记唯一领域集合、generation/registry 绑定和一致性只读事务端口；不得授权 D-020、SQLCipher 实现、业务字段、导出/备份、持久化、系统时钟、网络、原生或正式实现",
    );
  }

  const aiCandidateConfirmationEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.aiCandidateConfirmationContract.subjectId,
  );
  const aiCandidateConfirmationEvent = aiCandidateConfirmationEvents[0]?.value;
  const aiCandidateConfirmationData = aiCandidateConfirmationEvent?.data ?? {};
  const aiCandidateBaseline = baseline.aiCandidateConfirmationContract;
  if (
    aiCandidateConfirmationEvents.length !== 1 ||
    aiCandidateConfirmationEvent?.eventId !== aiCandidateBaseline.eventId ||
    aiCandidateConfirmationEvent?.type !== "ARTIFACT_CREATED" ||
    aiCandidateConfirmationEvent?.actor?.id !== "project-manager" ||
    aiCandidateConfirmationData.contractStatus !== aiCandidateBaseline.contractStatus ||
    aiCandidateConfirmationData.artifactState !== aiCandidateBaseline.artifactState ||
    !arraysEqualAsSets(aiCandidateConfirmationData.featureIds ?? [], aiCandidateBaseline.featureIds) ||
    !arraysEqualAsSets(aiCandidateConfirmationData.requirementIds ?? [], aiCandidateBaseline.requirementIds) ||
    !arraysEqualAsSets(aiCandidateConfirmationData.acceptanceIds ?? [], aiCandidateBaseline.acceptanceIds) ||
    aiCandidateConfirmationData.topLevelTests !== aiCandidateBaseline.topLevelTests ||
    aiCandidateConfirmationData.fullSuitePassed !== aiCandidateBaseline.fullSuitePassed ||
    aiCandidateConfirmationData.volatileLocalInputPreserved !== aiCandidateBaseline.volatileLocalInputPreserved ||
    aiCandidateConfirmationData.strictResponseContractReused !== aiCandidateBaseline.strictResponseContractReused ||
    aiCandidateConfirmationData.explicitCandidateReviewRequired !== aiCandidateBaseline.explicitCandidateReviewRequired ||
    aiCandidateConfirmationData.requestContextFingerprintBound !== aiCandidateBaseline.requestContextFingerprintBound ||
    aiCandidateConfirmationData.policyEvidenceFingerprintBound !== aiCandidateBaseline.policyEvidenceFingerprintBound ||
    aiCandidateConfirmationData.candidateFingerprintBound !== aiCandidateBaseline.candidateFingerprintBound ||
    aiCandidateConfirmationData.confirmedValueCallerOwned !== aiCandidateBaseline.confirmedValueCallerOwned ||
    aiCandidateConfirmationData.saveEffectExcludesRawInputAndCandidate !== aiCandidateBaseline.saveEffectExcludesRawInputAndCandidate ||
    aiCandidateConfirmationData.idempotentConfirmedValueSave !== aiCandidateBaseline.idempotentConfirmedValueSave ||
    aiCandidateConfirmationData.unknownCommitReplayRequired !== aiCandidateBaseline.unknownCommitReplayRequired ||
    aiCandidateConfirmationData.volatileInputPurgedAfterCommit !== aiCandidateBaseline.volatileInputPurgedAfterCommit ||
    aiCandidateConfirmationData.manualFallbackBeforeCommit !== aiCandidateBaseline.manualFallbackBeforeCommit ||
    aiCandidateConfirmationData.mediaRetentionAuthorized !== aiCandidateBaseline.mediaRetentionAuthorized ||
    aiCandidateConfirmationData.nonLabelConfirmationPolicyAuthorized !== aiCandidateBaseline.nonLabelConfirmationPolicyAuthorized ||
    aiCandidateConfirmationData.productionResourceBudgetAuthorized !== aiCandidateBaseline.productionResourceBudgetAuthorized ||
    aiCandidateConfirmationData.transportProfileAuthorized !== aiCandidateBaseline.transportProfileAuthorized ||
    aiCandidateConfirmationData.providerUsePolicyAuthorized !== aiCandidateBaseline.providerUsePolicyAuthorized ||
    aiCandidateConfirmationData.businessFieldMappingApproved !== aiCandidateBaseline.businessFieldMappingApproved ||
    aiCandidateConfirmationData.automaticDiaryOrTargetMutation !== aiCandidateBaseline.automaticDiaryOrTargetMutation ||
    aiCandidateConfirmationData.persistentRepositoryImplemented !== aiCandidateBaseline.persistentRepositoryImplemented ||
    aiCandidateConfirmationData.systemClockRead !== aiCandidateBaseline.systemClockRead ||
    aiCandidateConfirmationData.realNetworkRequests !== aiCandidateBaseline.realNetworkRequests ||
    aiCandidateConfirmationData.nativeImplementationAuthorized !== aiCandidateBaseline.nativeImplementationAuthorized ||
    aiCandidateConfirmationData.formalImplementationAuthorized !== aiCandidateBaseline.formalImplementationAuthorized ||
    aiCandidateConfirmationData.gateStatesChanged !== aiCandidateBaseline.gateStatesChanged ||
    aiCandidateConfirmationData.ownerIntakeChanged !== aiCandidateBaseline.ownerIntakeChanged
  ) {
    add(
      "OPS_AI_CANDIDATE_CONFIRMATION_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F01/F02 AI 候选确认合同只登记易失输入、严格候选、显式 review、审计指纹和用户确认值幂等保存端口；不得授权 D-031/D-033/D-034/D-036/D-053、真实 transport、正式字段/映射、自动改日记/目标、持久化 Repository、系统时钟、原生或正式实现",
    );
  }

  const aiGuidanceReferenceEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.aiGuidanceReferenceContract.subjectId,
  );
  const aiGuidanceReferenceEvent = aiGuidanceReferenceEvents[0]?.value;
  const aiGuidanceReferenceData = aiGuidanceReferenceEvent?.data ?? {};
  const aiGuidanceBaseline = baseline.aiGuidanceReferenceContract;
  if (
    aiGuidanceReferenceEvents.length !== 1 ||
    aiGuidanceReferenceEvent?.eventId !== aiGuidanceBaseline.eventId ||
    aiGuidanceReferenceEvent?.type !== "ARTIFACT_CREATED" ||
    aiGuidanceReferenceEvent?.actor?.id !== "project-manager" ||
    aiGuidanceReferenceData.contractStatus !== aiGuidanceBaseline.contractStatus ||
    aiGuidanceReferenceData.artifactState !== aiGuidanceBaseline.artifactState ||
    aiGuidanceReferenceData.featureId !== aiGuidanceBaseline.featureId ||
    aiGuidanceReferenceData.requirementId !== aiGuidanceBaseline.requirementId ||
    aiGuidanceReferenceData.acceptanceId !== aiGuidanceBaseline.acceptanceId ||
    aiGuidanceReferenceData.topLevelTests !== aiGuidanceBaseline.topLevelTests ||
    aiGuidanceReferenceData.fullSuitePassed !== aiGuidanceBaseline.fullSuitePassed ||
    aiGuidanceReferenceData.strictOpaqueResponseContract !== aiGuidanceBaseline.strictOpaqueResponseContract ||
    aiGuidanceReferenceData.duplicateJsonKeysRejected !== aiGuidanceBaseline.duplicateJsonKeysRejected ||
    aiGuidanceReferenceData.referenceOnlyBoundary !== aiGuidanceBaseline.referenceOnlyBoundary ||
    aiGuidanceReferenceData.nonMedicalBoundary !== aiGuidanceBaseline.nonMedicalBoundary ||
    aiGuidanceReferenceData.medicalSafetyEvaluation !== aiGuidanceBaseline.medicalSafetyEvaluation ||
    aiGuidanceReferenceData.highRiskUseAuthorized !== aiGuidanceBaseline.highRiskUseAuthorized ||
    aiGuidanceReferenceData.callerOwnedContentDefinition !== aiGuidanceBaseline.callerOwnedContentDefinition ||
    aiGuidanceReferenceData.callerOwnedDisclaimerDefinition !== aiGuidanceBaseline.callerOwnedDisclaimerDefinition ||
    aiGuidanceReferenceData.generatedAtCallerSupplied !== aiGuidanceBaseline.generatedAtCallerSupplied ||
    aiGuidanceReferenceData.requestAndPolicyEvidenceBound !== aiGuidanceBaseline.requestAndPolicyEvidenceBound ||
    aiGuidanceReferenceData.sourceAndEditFingerprintsBound !== aiGuidanceBaseline.sourceAndEditFingerprintsBound ||
    aiGuidanceReferenceData.revisionCasEditing !== aiGuidanceBaseline.revisionCasEditing ||
    aiGuidanceReferenceData.discardPurgesVolatileContent !== aiGuidanceBaseline.discardPurgesVolatileContent ||
    aiGuidanceReferenceData.observableEffects !== aiGuidanceBaseline.observableEffects ||
    aiGuidanceReferenceData.automaticDiaryOrTargetMutation !== aiGuidanceBaseline.automaticDiaryOrTargetMutation ||
    aiGuidanceReferenceData.persistenceStrategyAuthorized !== aiGuidanceBaseline.persistenceStrategyAuthorized ||
    aiGuidanceReferenceData.iaPlacementAuthorized !== aiGuidanceBaseline.iaPlacementAuthorized ||
    aiGuidanceReferenceData.nonLabelConfirmationPolicyAuthorized !== aiGuidanceBaseline.nonLabelConfirmationPolicyAuthorized ||
    aiGuidanceReferenceData.providerUsePolicyAuthorized !== aiGuidanceBaseline.providerUsePolicyAuthorized ||
    aiGuidanceReferenceData.businessPayloadApproved !== aiGuidanceBaseline.businessPayloadApproved ||
    aiGuidanceReferenceData.persistentRepositoryImplemented !== aiGuidanceBaseline.persistentRepositoryImplemented ||
    aiGuidanceReferenceData.systemClockRead !== aiGuidanceBaseline.systemClockRead ||
    aiGuidanceReferenceData.realNetworkRequests !== aiGuidanceBaseline.realNetworkRequests ||
    aiGuidanceReferenceData.nativeImplementationAuthorized !== aiGuidanceBaseline.nativeImplementationAuthorized ||
    aiGuidanceReferenceData.formalImplementationAuthorized !== aiGuidanceBaseline.formalImplementationAuthorized ||
    aiGuidanceReferenceData.gateStatesChanged !== aiGuidanceBaseline.gateStatesChanged ||
    aiGuidanceReferenceData.ownerIntakeChanged !== aiGuidanceBaseline.ownerIntakeChanged
  ) {
    add(
      "OPS_AI_GUIDANCE_REFERENCE_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F16 合同只登记严格 opaque response、参考草稿边界、调用方定义、来源/edit 指纹、本地编辑和放弃清理；不得授权 UXD-04/UXD-11、D-033/D-053、医疗安全、高风险用途、业务字段、自动改日记/目标、持久化、系统时钟、网络、原生或正式实现",
    );
  }

  const barcodeLookupEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.barcodeLookupOrchestratorContract.subjectId,
  );
  const barcodeLookupEvent = barcodeLookupEvents[0]?.value;
  const barcodeLookupData = barcodeLookupEvent?.data ?? {};
  const barcodeLookupBaseline = baseline.barcodeLookupOrchestratorContract;
  const barcodeLookupScalarFields = [
    "contractStatus",
    "artifactState",
    "featureId",
    "requirementId",
    "acceptanceId",
    "topLevelTests",
    "fullSuitePassed",
    "leadingZeroPreserved",
    "localExactLookupOnly",
    "trustedCatalogEvidenceBound",
    "singleCandidateRequiresExplicitSelection",
    "multipleSourceCandidatesRemainSeparate",
    "callerOwnedFoodReview",
    "callerOwnedManualCreation",
    "cameraPermissionHandling",
    "fuzzyBarcodeRecognitionAuthorized",
    "coveragePromiseAuthorized",
    "catalogMutationAuthorized",
    "diaryMutationAuthorized",
    "aiFallbackAuthorized",
    "persistentRepositoryImplemented",
    "systemClockRead",
    "nativeApiCalls",
    "realNetworkRequests",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    barcodeLookupEvents.length !== 1 ||
    barcodeLookupEvent?.eventId !== barcodeLookupBaseline.eventId ||
    barcodeLookupEvent?.type !== "ARTIFACT_CREATED" ||
    barcodeLookupEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(barcodeLookupData.exactGtinLengths) !== JSON.stringify(barcodeLookupBaseline.exactGtinLengths) ||
    barcodeLookupScalarFields.some((field) => barcodeLookupData[field] !== barcodeLookupBaseline[field])
  ) {
    add(
      "OPS_BARCODE_LOOKUP_ORCHESTRATOR_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F03 合同只登记完整 GTIN 本地精确查询、目录证据绑定、候选显式选择和调用方复核/建档交接；不得授权模糊识别、覆盖率承诺、相机权限、食品或日记写入、AI/网络回退、持久化 Repository、原生或正式实现",
    );
  }

  const importSafetyEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.importSafetyPreflightContract.subjectId,
  );
  const importSafetyEvent = importSafetyEvents[0]?.value;
  const importSafetyData = importSafetyEvent?.data ?? {};
  const importSafetyBaseline = baseline.importSafetyPreflightContract;
  const importSafetyFields = [
    "contractStatus",
    "artifactState",
    "featureId",
    "requirementId",
    "acceptanceId",
    "topLevelTests",
    "fullSuitePassed",
    "approvedDefaultLimitsBound",
    "customLimitsCanOnlyTighten",
    "strictPlainJsonBoundary",
    "nfcAndCaseCollisionRejected",
    "manifestEntrySetExact",
    "importSubjectFingerprintBound",
    "verificationEvidenceSubjectBound",
    "verificationTruth",
    "activeStateFingerprintBound",
    "activationStrategy",
    "activationCommitted",
    "signatureAlgorithmSelected",
    "backupCryptoProfileSelected",
    "restoreModeSelected",
    "filesystemReads",
    "filesystemWrites",
    "systemClockRead",
    "realNetworkRequests",
    "nativeApiCalls",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    importSafetyEvents.length !== 1 ||
    importSafetyEvent?.eventId !== importSafetyBaseline.eventId ||
    importSafetyEvent?.type !== "ARTIFACT_CREATED" ||
    importSafetyEvent?.actor?.id !== "project-manager" ||
    importSafetyFields.some((field) => importSafetyData[field] !== importSafetyBaseline[field])
  ) {
    add(
      "OPS_IMPORT_SAFETY_PREFLIGHT_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F19 合同只登记严格资源预算、路径冲突拒绝、导入对象/验证声明/活动状态指纹绑定和失败保持旧状态；不得冒充真实验签、备份密码学、恢复/激活策略、文件系统、原生或正式实现已获授权",
    );
  }

  const foodInsightEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.foodInsightAvailabilityContract.subjectId,
  );
  const foodInsightEvent = foodInsightEvents[0]?.value;
  const foodInsightData = foodInsightEvent?.data ?? {};
  const foodInsightBaseline = baseline.foodInsightAvailabilityContract;
  const foodInsightScalarFields = [
    "contractStatus",
    "artifactState",
    "featureId",
    "requirementId",
    "acceptanceId",
    "topLevelTests",
    "fullSuitePassed",
    "trustedLocalNutritionSnapshotOnly",
    "approvedNutrientFieldCount",
    "nutritionFactsAvailable",
    "missingNotZero",
    "traceWithoutNumericValue",
    "estimatedSourceVisible",
    "packCatalogTrustRequired",
    "advancedCapabilityScopePreserved",
    "advancedContentExposure",
    "healthScoreAlgorithmAuthorized",
    "micronutrientFieldSetAuthorized",
    "riskBenefitGenerationAuthorized",
    "medicalConclusionAuthorized",
    "personalizedClaimAuthorized",
    "aiGenerationAuthorized",
    "automaticProfileUseAuthorized",
    "observableEffects",
    "filesystemReads",
    "filesystemWrites",
    "systemClockRead",
    "realNetworkRequests",
    "nativeApiCalls",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    foodInsightEvents.length !== 1 ||
    foodInsightEvent?.eventId !== foodInsightBaseline.eventId ||
    foodInsightEvent?.type !== "ARTIFACT_CREATED" ||
    foodInsightEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(foodInsightData.advancedCapabilityIds) !== JSON.stringify(foodInsightBaseline.advancedCapabilityIds) ||
    JSON.stringify(foodInsightData.publicEvidenceIds) !== JSON.stringify(foodInsightBaseline.publicEvidenceIds) ||
    foodInsightScalarFields.some((field) => foodInsightData[field] !== foodInsightBaseline[field])
  ) {
    add(
      "OPS_FOOD_INSIGHT_AVAILABILITY_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F09 合同只登记可信本地七项营养事实可用，并保留评分、微量、风险和益处能力范围但保持内容零暴露；不得授权算法、字段集、医学/个体化结论、AI、自动资料使用、原生或正式实现",
    );
  }

  const dataPackPreauthEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.dataPackPreauthContract.subjectId,
  );
  const dataPackPreauthEvent = dataPackPreauthEvents[0]?.value;
  const dataPackPreauthData = dataPackPreauthEvent?.data ?? {};
  const dataPackPreauthBaseline = baseline.dataPackPreauthContract;
  const dataPackPreauthFields = [
    "contractStatus",
    "artifactState",
    "featureId",
    "requirementId",
    "acceptanceId",
    "topLevelTests",
    "fullSuitePassed",
    "approvedDefaultLimitsBound",
    "customLimitsCanOnlyTighten",
    "preAuthObjectKeysCounted",
    "preAuthStringBudgetBound",
    "strictPassiveJsonBoundary",
    "regularFileOnly",
    "nfcAndCaseCollisionRejected",
    "manifestEntrySetExact",
    "manifestBytesBound",
    "totalBytesBound",
    "provenanceManifestIdentityBound",
    "provenanceIdentitiesUnique",
    "transformVersionBound",
    "transformStepIdsUnique",
    "packSubjectFingerprintBound",
    "verificationEvidenceSubjectBound",
    "verificationTruth",
    "signatureProfile",
    "activationStrategy",
    "activationCommitted",
    "signatureAlgorithmSelected",
    "trustRootSelected",
    "licenseDistributionAuthorized",
    "filesystemReads",
    "filesystemWrites",
    "systemClockRead",
    "realNetworkRequests",
    "nativeApiCalls",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    dataPackPreauthEvents.length !== 1 ||
    dataPackPreauthEvent?.eventId !== dataPackPreauthBaseline.eventId ||
    dataPackPreauthEvent?.type !== "ARTIFACT_CREATED" ||
    dataPackPreauthEvent?.actor?.id !== "project-manager" ||
    dataPackPreauthFields.some((field) => dataPackPreauthData[field] !== dataPackPreauthBaseline[field])
  ) {
    add(
      "OPS_DATA_PACK_PREAUTH_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F03 数据包预授权合同只登记收紧型资源预算、严格被动 JSON/普通文件、精确 entry 集合、来源/转换一致性和 subject 绑定调用方声明；不得冒充真实验签、许可分发、激活、原生或正式实现已获授权",
    );
  }

  const restoreReconcileEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.restoreReconcileObservationContract.subjectId,
  );
  const restoreReconcileEvent = restoreReconcileEvents[0]?.value;
  const restoreReconcileData = restoreReconcileEvent?.data ?? {};
  const restoreReconcileBaseline = baseline.restoreReconcileObservationContract;
  const restoreReconcileFields = [
    "contractStatus",
    "artifactState",
    "featureId",
    "requirementId",
    "acceptanceId",
    "topLevelTests",
    "fullSuitePassed",
    "structuredGenerationObservations",
    "generationObservationFingerprintBound",
    "restoreObservationFingerprintBound",
    "restoreIntentFingerprintBound",
    "strictPlainBoundary",
    "generationObservationBudgetBound",
    "keyUnavailableFailsClosed",
    "intentKeepsWritesClosed",
    "actionPlanObservationBound",
    "actionPlanEffectsCommitted",
    "reobservationRequiredBeforeWrites",
    "cleanupAuthorized",
    "assertionTruth",
    "cryptoProfile",
    "restoreMode",
    "plaintextExport",
    "cryptographicVerificationPerformed",
    "filesystemReads",
    "filesystemWrites",
    "keychainReads",
    "keychainWrites",
    "systemClockRead",
    "realNetworkRequests",
    "nativeApiCalls",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    restoreReconcileEvents.length !== 1 ||
    restoreReconcileEvent?.eventId !== restoreReconcileBaseline.eventId ||
    restoreReconcileEvent?.type !== "ARTIFACT_CREATED" ||
    restoreReconcileEvent?.actor?.id !== "project-manager" ||
    restoreReconcileFields.some((field) => restoreReconcileData[field] !== restoreReconcileBaseline[field])
  ) {
    add(
      "OPS_RESTORE_RECONCILE_OBSERVATION_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F19 恢复对账合同只登记结构化 generation 观察、intent/观察指纹绑定、intent 存在时写入关闭、未提交行动计划和执行后重新观察；不得授权密码学、恢复模式、清理、文件系统、Keychain、原生或正式实现",
    );
  }

  const wipeOutcomeEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.wipeOutcomeEvidenceContract.subjectId,
  );
  const wipeOutcomeEvent = wipeOutcomeEvents[0]?.value;
  const wipeOutcomeData = wipeOutcomeEvent?.data ?? {};
  const wipeOutcomeBaseline = baseline.wipeOutcomeEvidenceContract;
  const wipeOutcomeFields = [
    "contractStatus",
    "artifactState",
    "featureId",
    "requirementId",
    "acceptanceId",
    "topLevelTests",
    "fullSuitePassed",
    "strictPassiveOutcomeBoundary",
    "outcomeResourceBudgetBound",
    "evidenceIdentityRequired",
    "effectFingerprintBound",
    "observationFingerprintBound",
    "outcomeFingerprintBound",
    "crossEffectReplayRejected",
    "legacyNakedOutcomeRejected",
    "statusErrorSemanticsBound",
    "assertionTruth",
    "externalFilesScope",
    "realContainerEmptinessVerified",
    "realSecretInvalidationVerified",
    "realNotificationRemovalVerified",
    "filesystemReads",
    "filesystemWrites",
    "keychainReads",
    "keychainWrites",
    "systemClockRead",
    "realNetworkRequests",
    "nativeApiCalls",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    wipeOutcomeEvents.length !== 1 ||
    wipeOutcomeEvent?.eventId !== wipeOutcomeBaseline.eventId ||
    wipeOutcomeEvent?.type !== "ARTIFACT_CREATED" ||
    wipeOutcomeEvent?.actor?.id !== "project-manager" ||
    wipeOutcomeFields.some((field) => wipeOutcomeData[field] !== wipeOutcomeBaseline[field])
  ) {
    add(
      "OPS_WIPE_OUTCOME_EVIDENCE_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F18 删除回执合同只登记严格被动 JSON、资源预算、证据身份、effect/observation/outcome 指纹和重放拒绝；调用方声明不得冒充真实容器、密钥、通知、文件系统、Keychain、原生或正式实现证据",
    );
  }

  const aiPolicyEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.aiProviderPolicyAuthorizationContract.subjectId,
  );
  const aiPolicyEvent = aiPolicyEvents[0]?.value;
  const aiPolicyData = aiPolicyEvent?.data ?? {};
  const aiPolicyBaseline = baseline.aiProviderPolicyAuthorizationContract;
  const aiPolicyFields = [
    "contractStatus",
    "artifactState",
    "topLevelTests",
    "fullSuitePassed",
    "strictProviderPolicyProfile",
    "policyEvidenceReferencesBound",
    "riskSemanticsBound",
    "policyValidityWindowBound",
    "exactRequestSubjectBound",
    "providerOriginModelPayloadProfileRegionBound",
    "subjectFingerprintBound",
    "profileFingerprintBound",
    "authorizationFingerprintBound",
    "appleProhibitedUseBlocked",
    "labelPreviewSubjectBound",
    "legacyPlainAllowRejected",
    "d053DecisionState",
    "d053Authorization",
    "matchingAllowStillBlocked",
    "policyTruth",
    "networkRequests",
    "authorizationReads",
    "sensitiveBodySerializations",
    "keychainReads",
    "businessWrites",
    "systemClockRead",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    aiPolicyEvents.length !== 1 ||
    aiPolicyEvent?.eventId !== aiPolicyBaseline.eventId ||
    aiPolicyEvent?.type !== "ARTIFACT_CREATED" ||
    aiPolicyEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(aiPolicyData.featureIds) !== JSON.stringify(aiPolicyBaseline.featureIds) ||
    JSON.stringify(aiPolicyData.requirementIds) !== JSON.stringify(aiPolicyBaseline.requirementIds) ||
    JSON.stringify(aiPolicyData.acceptanceIds) !== JSON.stringify(aiPolicyBaseline.acceptanceIds) ||
    aiPolicyFields.some((field) => aiPolicyData[field] !== aiPolicyBaseline[field])
  ) {
    add(
      "OPS_AI_PROVIDER_POLICY_AUTHORIZATION_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-13.jsonl",
      "F01/F02 AI policy 合同只登记完整本地 profile、证据/风险/时间/地区、精确 request subject、指纹和 D-053 candidate/not-authorized 门禁；不得授权读 key、序列化敏感 body、联网、业务写入、原生或正式实现",
    );
  }

  const aiResponseEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.aiResponseContract.subjectId,
  );
  const aiResponseEvent = aiResponseEvents[0]?.value;
  const aiResponseData = aiResponseEvent?.data ?? {};
  const aiResponseBaseline = baseline.aiResponseContract;
  const aiResponseFields = [
    "contractStatus",
    "artifactState",
    "topLevelTests",
    "fullSuitePassed",
    "untrustedResponseBoundary",
    "duplicateJsonKeysRejected",
    "trailingDataRejected",
    "nonEmptyCandidateSetRequired",
    "exactCandidateSchema",
    "normalizedSafeLabels",
    "resourceBudgetsBound",
    "unsafeNumbersRejected",
    "semanticResponseFingerprintBound",
    "passiveStateSnapshotBound",
    "errorContentNotReflected",
    "candidateAuthority",
    "schemaAuthority",
    "persistenceAuthorized",
    "policyAuthorizationGranted",
    "keychainReads",
    "sensitiveBodySerializations",
    "realNetworkRequests",
    "filesystemWrites",
    "businessWrites",
    "systemClockRead",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    aiResponseEvents.length !== 1 ||
    aiResponseEvent?.eventId !== aiResponseBaseline.eventId ||
    aiResponseEvent?.type !== "ARTIFACT_CREATED" ||
    aiResponseEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(aiResponseData.featureIds) !== JSON.stringify(aiResponseBaseline.featureIds) ||
    JSON.stringify(aiResponseData.requirementIds) !== JSON.stringify(aiResponseBaseline.requirementIds) ||
    JSON.stringify(aiResponseData.acceptanceIds) !== JSON.stringify(aiResponseBaseline.acceptanceIds) ||
    aiResponseFields.some((field) => aiResponseData[field] !== aiResponseBaseline[field])
  ) {
    add(
      "OPS_AI_RESPONSE_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "F01/F02 AI 响应合同只登记不可信输出的严格解析、资源预算、规范化候选、语义指纹和被动状态快照；不得授权 Provider schema、policy、凭据、正文、网络、持久化、原生或正式实现",
    );
  }

  const aiCandidateResponseV2Events = model.events.filter(
    (record) => record.value?.subject?.id === baseline.aiCandidateResponseEvidenceV2Contract.subjectId,
  );
  const aiCandidateResponseV2Event = aiCandidateResponseV2Events[0]?.value;
  const aiCandidateResponseV2Data = aiCandidateResponseV2Event?.data ?? {};
  const aiCandidateResponseV2Baseline = baseline.aiCandidateResponseEvidenceV2Contract;
  const aiCandidateResponseV2Fields = [
    "contractStatus",
    "artifactState",
    "topLevelTests",
    "fullSuitePassed",
    "stateSchemaVersion",
    "reviewEvidenceSchemaVersion",
    "confirmedRecordSchemaVersion",
    "sourceEvidenceSchemaVersion",
    "commandSchemaVersion",
    "receiptSchemaVersion",
    "completeResponseFingerprintBound",
    "unselectedCandidateChangeDetected",
    "responseFingerprintBoundToReview",
    "responseFingerprintPersistedAsEvidence",
    "candidateFingerprintStillBound",
    "confirmedValueFingerprintStillBound",
    "legacyV1EvidenceRejected",
    "rawResponsePersisted",
    "candidateContentPersisted",
    "automaticDiaryOrTargetMutation",
    "persistentRepositoryImplemented",
    "systemClockRead",
    "realNetworkRequests",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    aiCandidateResponseV2Events.length !== 1 ||
    aiCandidateResponseV2Event?.eventId !== aiCandidateResponseV2Baseline.eventId ||
    aiCandidateResponseV2Event?.type !== "ARTIFACT_CREATED" ||
    aiCandidateResponseV2Event?.actor?.id !== "project-manager" ||
    JSON.stringify(aiCandidateResponseV2Data.featureIds) !== JSON.stringify(aiCandidateResponseV2Baseline.featureIds) ||
    JSON.stringify(aiCandidateResponseV2Data.requirementIds) !== JSON.stringify(aiCandidateResponseV2Baseline.requirementIds) ||
    JSON.stringify(aiCandidateResponseV2Data.acceptanceIds) !== JSON.stringify(aiCandidateResponseV2Baseline.acceptanceIds) ||
    aiCandidateResponseV2Fields.some((field) => aiCandidateResponseV2Data[field] !== aiCandidateResponseV2Baseline[field])
  ) {
    add(
      "OPS_AI_CANDIDATE_RESPONSE_EVIDENCE_V2_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "F01/F02 候选确认 V2 只登记完整响应指纹贯穿状态/review/确认记录/命令/回执和旧 V1 失败关闭；不得持久化原始响应/候选正文或授权自动写库、网络、原生及正式实现",
    );
  }

  const aiRequestEvidenceContextV2Events = model.events.filter(
    (record) => record.value?.subject?.id === baseline.aiRequestEvidenceContextV2Contract.subjectId,
  );
  const aiRequestEvidenceContextV2Event = aiRequestEvidenceContextV2Events[0]?.value;
  const aiRequestEvidenceContextV2Data = aiRequestEvidenceContextV2Event?.data ?? {};
  const aiRequestEvidenceContextV2Baseline = baseline.aiRequestEvidenceContextV2Contract;
  const aiRequestEvidenceContextV2Fields = [
    "contractStatus",
    "artifactState",
    "sharedContextTopLevelTests",
    "candidateTopLevelTests",
    "guidanceTopLevelTests",
    "fullSuitePassed",
    "contextInputSchemaVersion",
    "contextSchemaVersion",
    "contextBoundarySchemaVersion",
    "candidateStateSchemaVersion",
    "candidateReviewSchemaVersion",
    "confirmedRecordSchemaVersion",
    "confirmedSourceSchemaVersion",
    "confirmedCommandSchemaVersion",
    "confirmedReceiptSchemaVersion",
    "guidanceStateSchemaVersion",
    "guidanceSourceSchemaVersion",
    "exactPolicySubjectBound",
    "completePolicyProfileBound",
    "d053AuthorizationEvidenceBound",
    "policyCheckEvidenceBound",
    "scopeMatchedRequired",
    "profileStateAllowsRequired",
    "appleProhibitedUseAbsentRequired",
    "onlyRemainingPolicyGate",
    "evidenceKind",
    "transportOccurrence",
    "sendAuthorization",
    "downstreamUse",
    "legacyRequestContextV1Rejected",
    "legacyCandidateV1V2Rejected",
    "legacyGuidanceV1Rejected",
    "rawResponsePersisted",
    "candidateContentPersisted",
    "keychainReads",
    "sensitiveBodySerializations",
    "realNetworkRequests",
    "businessWritesBeforeUserConfirmation",
    "systemClockRead",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    aiRequestEvidenceContextV2Events.length !== 1 ||
    aiRequestEvidenceContextV2Event?.eventId !== aiRequestEvidenceContextV2Baseline.eventId ||
    aiRequestEvidenceContextV2Event?.type !== "ARTIFACT_CREATED" ||
    aiRequestEvidenceContextV2Event?.actor?.id !== "project-manager" ||
    JSON.stringify(aiRequestEvidenceContextV2Data.featureIds) !== JSON.stringify(aiRequestEvidenceContextV2Baseline.featureIds) ||
    JSON.stringify(aiRequestEvidenceContextV2Data.requirementIds) !== JSON.stringify(aiRequestEvidenceContextV2Baseline.requirementIds) ||
    JSON.stringify(aiRequestEvidenceContextV2Data.acceptanceIds) !== JSON.stringify(aiRequestEvidenceContextV2Baseline.acceptanceIds) ||
    aiRequestEvidenceContextV2Fields.some(
      (field) => aiRequestEvidenceContextV2Data[field] !== aiRequestEvidenceContextV2Baseline[field],
    )
  ) {
    add(
      "OPS_AI_REQUEST_EVIDENCE_CONTEXT_V2_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "F01/F02/F16 AI request evidence context must retain exact subject/profile/D-053/check evidence, D053_NOT_AUTHORIZED, no transport claim, no send authorization, and no native or formal implementation authorization",
    );
  }

  const aiConfigurationPolicyPreflightEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.aiConfigurationPolicyPreflightContract.subjectId,
  );
  const aiConfigurationPolicyPreflightEvent = aiConfigurationPolicyPreflightEvents[0]?.value;
  const aiConfigurationPolicyPreflightData = aiConfigurationPolicyPreflightEvent?.data ?? {};
  const aiConfigurationPolicyPreflightBaseline = baseline.aiConfigurationPolicyPreflightContract;
  const aiConfigurationPolicyPreflightFields = [
    "contractStatus",
    "artifactState",
    "topLevelTests",
    "fullSuitePassed",
    "configurationEvidenceSchemaVersion",
    "preflightResultSchemaVersion",
    "preflightBoundarySchemaVersion",
    "stableConfiguredStateRequired",
    "nonSensitiveConfigurationEvidenceOnly",
    "configurationEvidenceFingerprintBound",
    "requestContextFingerprintBound",
    "policyEvidenceFingerprintsBound",
    "baseUrlOriginModelCompared",
    "exactConfigurationMatchAuthorizesSend",
    "providerIdentityBoundToConfiguration",
    "disposition",
    "sendAuthorization",
    "credentialMaterialReads",
    "authorizationHeadersBuilt",
    "sensitiveBodySerializations",
    "transportsCreated",
    "realNetworkRequests",
    "businessWrites",
    "systemClockRead",
    "nativeImplementationAuthorized",
    "formalImplementationAuthorized",
    "gateStatesChanged",
    "ownerIntakeChanged",
  ];
  if (
    aiConfigurationPolicyPreflightEvents.length !== 1 ||
    aiConfigurationPolicyPreflightEvent?.eventId !== aiConfigurationPolicyPreflightBaseline.eventId ||
    aiConfigurationPolicyPreflightEvent?.type !== "ARTIFACT_CREATED" ||
    aiConfigurationPolicyPreflightEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(aiConfigurationPolicyPreflightData.featureIds) !== JSON.stringify(aiConfigurationPolicyPreflightBaseline.featureIds) ||
    JSON.stringify(aiConfigurationPolicyPreflightData.requirementIds) !== JSON.stringify(aiConfigurationPolicyPreflightBaseline.requirementIds) ||
    JSON.stringify(aiConfigurationPolicyPreflightData.acceptanceIds) !== JSON.stringify(aiConfigurationPolicyPreflightBaseline.acceptanceIds) ||
    JSON.stringify(aiConfigurationPolicyPreflightData.requiredBlockers) !== JSON.stringify(aiConfigurationPolicyPreflightBaseline.requiredBlockers) ||
    aiConfigurationPolicyPreflightFields.some(
      (field) => aiConfigurationPolicyPreflightData[field] !== aiConfigurationPolicyPreflightBaseline[field],
    )
  ) {
    add(
      "OPS_AI_CONFIGURATION_POLICY_PREFLIGHT_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "F01/F02 AI configuration-policy preflight must retain stable non-sensitive configuration evidence, exact baseURL/origin/model comparison, absent provider identity binding, all D-033/D-034/D-036/D-053 blockers, and zero send side effects",
    );
  }

  const sdk57JsSpikeVerificationEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.sdk57JsSpikeVerification.subjectId,
  );
  const sdk57JsSpikeVerificationEvent = sdk57JsSpikeVerificationEvents[0]?.value;
  const sdk57JsSpikeVerificationData = sdk57JsSpikeVerificationEvent?.data ?? {};
  const sdk57JsSpikeVerificationBaseline = baseline.sdk57JsSpikeVerification;
  const sdk57JsSpikeVerificationFields = Object.keys(sdk57JsSpikeVerificationBaseline)
    .filter((field) => field !== "eventId" && field !== "subjectId")
    .sort();
  if (
    sdk57JsSpikeVerificationEvents.length !== 1 ||
    sdk57JsSpikeVerificationEvent?.eventId !== sdk57JsSpikeVerificationBaseline.eventId ||
    sdk57JsSpikeVerificationEvent?.type !== "TASK_COMPLETED" ||
    sdk57JsSpikeVerificationEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(Object.keys(sdk57JsSpikeVerificationData).sort()) !== JSON.stringify(sdk57JsSpikeVerificationFields) ||
    sdk57JsSpikeVerificationFields.some(
      (field) => sdk57JsSpikeVerificationData[field] !== sdk57JsSpikeVerificationBaseline[field],
    )
  ) {
    add(
      "OPS_SDK57_JS_SPIKE_VERIFICATION_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "D-032 verification must retain the exact Node/pnpm/lockfile and Windows JS check evidence while keeping native directories, Prebuild, iOS evidence, formal root authorization, decision acceptance and gate changes false",
    );
  }

  const sdk57JsDependencySurfaceEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.sdk57JsDependencySurface.subjectId,
  );
  const sdk57JsDependencySurfaceEvent = sdk57JsDependencySurfaceEvents[0]?.value;
  const sdk57JsDependencySurfaceData = sdk57JsDependencySurfaceEvent?.data ?? {};
  const sdk57JsDependencySurfaceBaseline = baseline.sdk57JsDependencySurface;
  const sdk57JsDependencySurfaceFields = Object.keys(sdk57JsDependencySurfaceBaseline)
    .filter((field) => field !== "eventId" && field !== "subjectId")
    .sort();
  if (
    sdk57JsDependencySurfaceEvents.length !== 1 ||
    sdk57JsDependencySurfaceEvent?.eventId !== sdk57JsDependencySurfaceBaseline.eventId ||
    sdk57JsDependencySurfaceEvent?.type !== "TASK_COMPLETED" ||
    sdk57JsDependencySurfaceEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(Object.keys(sdk57JsDependencySurfaceData).sort()) !== JSON.stringify(sdk57JsDependencySurfaceFields) ||
    sdk57JsDependencySurfaceFields.some(
      (field) => JSON.stringify(sdk57JsDependencySurfaceData[field]) !== JSON.stringify(sdk57JsDependencySurfaceBaseline[field]),
    )
  ) {
    add(
      "OPS_SDK57_JS_DEPENDENCY_SURFACE_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "D-032 JS dependency surface must retain all six package symbols, four config plugins, exact type/Metro evidence and bundle fingerprint while keeping native calls, runtime evidence, Prebuild, formal root authorization, decision acceptance and gate changes false",
    );
  }

  const sdk57IosJavaScriptExportEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.sdk57IosJavaScriptExport.subjectId,
  );
  const sdk57IosJavaScriptExportEvent = sdk57IosJavaScriptExportEvents[0]?.value;
  const sdk57IosJavaScriptExportData = sdk57IosJavaScriptExportEvent?.data ?? {};
  const sdk57IosJavaScriptExportBaseline = baseline.sdk57IosJavaScriptExport;
  const sdk57IosJavaScriptExportFields = Object.keys(sdk57IosJavaScriptExportBaseline)
    .filter((field) => field !== "eventId" && field !== "subjectId")
    .sort();
  if (
    sdk57IosJavaScriptExportEvents.length !== 1 ||
    sdk57IosJavaScriptExportEvent?.eventId !== sdk57IosJavaScriptExportBaseline.eventId ||
    sdk57IosJavaScriptExportEvent?.type !== "TASK_COMPLETED" ||
    sdk57IosJavaScriptExportEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(Object.keys(sdk57IosJavaScriptExportData).sort()) !== JSON.stringify(sdk57IosJavaScriptExportFields) ||
    sdk57IosJavaScriptExportFields.some(
      (field) => sdk57IosJavaScriptExportData[field] !== sdk57IosJavaScriptExportBaseline[field],
    )
  ) {
    add(
      "OPS_SDK57_IOS_JAVASCRIPT_EXPORT_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "D-032 iOS JavaScript export must retain exact Windows Metro/bundle evidence while keeping native directories, Prebuild, Xcode, CocoaPods, compilation, simulator/device, signing, native evidence, formal root authorization, decision acceptance and gate changes false",
    );
  }

  const sdk57IosExportStructureVerifierEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.sdk57IosExportStructureVerifier.subjectId,
  );
  const sdk57IosExportStructureVerifierEvent = sdk57IosExportStructureVerifierEvents[0]?.value;
  const sdk57IosExportStructureVerifierData = sdk57IosExportStructureVerifierEvent?.data ?? {};
  const sdk57IosExportStructureVerifierBaseline = baseline.sdk57IosExportStructureVerifier;
  const sdk57IosExportStructureVerifierFields = Object.keys(sdk57IosExportStructureVerifierBaseline)
    .filter((field) => field !== "eventId" && field !== "subjectId")
    .sort();
  if (
    sdk57IosExportStructureVerifierEvents.length !== 1 ||
    sdk57IosExportStructureVerifierEvent?.eventId !== sdk57IosExportStructureVerifierBaseline.eventId ||
    sdk57IosExportStructureVerifierEvent?.type !== "TASK_COMPLETED" ||
    sdk57IosExportStructureVerifierEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(Object.keys(sdk57IosExportStructureVerifierData).sort()) !== JSON.stringify(sdk57IosExportStructureVerifierFields) ||
    sdk57IosExportStructureVerifierFields.some(
      (field) => sdk57IosExportStructureVerifierData[field] !== sdk57IosExportStructureVerifierBaseline[field],
    )
  ) {
    add(
      "OPS_SDK57_IOS_EXPORT_STRUCTURE_VERIFIER_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "D-032 iOS JavaScript export verifier must retain exact iOS-only metadata/file-set/path/native-directory checks, keep byte size and SHA outside reproducibility gates, and keep all native, formal-root, decision and Owner state claims false",
    );
  }

  const sdk57AndroidExportStructureVerifierEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.sdk57AndroidExportStructureVerifier.subjectId,
  );
  const sdk57AndroidExportStructureVerifierEvent = sdk57AndroidExportStructureVerifierEvents[0]?.value;
  const sdk57AndroidExportStructureVerifierData = sdk57AndroidExportStructureVerifierEvent?.data ?? {};
  const sdk57AndroidExportStructureVerifierBaseline = baseline.sdk57AndroidExportStructureVerifier;
  const sdk57AndroidExportStructureVerifierFields = Object.keys(sdk57AndroidExportStructureVerifierBaseline)
    .filter((field) => field !== "eventId" && field !== "subjectId")
    .sort();
  if (
    sdk57AndroidExportStructureVerifierEvents.length !== 1 ||
    sdk57AndroidExportStructureVerifierEvent?.eventId !== sdk57AndroidExportStructureVerifierBaseline.eventId ||
    sdk57AndroidExportStructureVerifierEvent?.type !== "TASK_COMPLETED" ||
    sdk57AndroidExportStructureVerifierEvent?.actor?.id !== "project-manager" ||
    JSON.stringify(Object.keys(sdk57AndroidExportStructureVerifierData).sort()) !== JSON.stringify(sdk57AndroidExportStructureVerifierFields) ||
    sdk57AndroidExportStructureVerifierFields.some(
      (field) => sdk57AndroidExportStructureVerifierData[field] !== sdk57AndroidExportStructureVerifierBaseline[field],
    )
  ) {
    add(
      "OPS_SDK57_ANDROID_EXPORT_STRUCTURE_VERIFIER_MISMATCH",
      "project-ops/events/2026-08-14.jsonl",
      "D-032 Android JavaScript export verifier must retain the shared platform core, Android-only metadata/asset/file/path/native-directory checks, keep byte size and SHA outside reproducibility gates, and keep native, formal-root, decision and Owner state claims false",
    );
  }

  const mediaPermissionEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.mediaPermissionOrchestratorContract.subjectId,
  );
  const mediaPermissionEvent = mediaPermissionEvents[0]?.value;
  const mediaPermissionData = mediaPermissionEvent?.data ?? {};
  if (
    mediaPermissionEvents.length !== 1 ||
    mediaPermissionEvent?.eventId !== baseline.mediaPermissionOrchestratorContract.eventId ||
    mediaPermissionEvent?.type !== "ARTIFACT_CREATED" ||
    mediaPermissionEvent?.actor?.id !== "project-manager" ||
    mediaPermissionData.contractStatus !== baseline.mediaPermissionOrchestratorContract.contractStatus ||
    mediaPermissionData.artifactState !== baseline.mediaPermissionOrchestratorContract.artifactState ||
    mediaPermissionData.featureId !== baseline.mediaPermissionOrchestratorContract.featureId ||
    mediaPermissionData.requirementId !== baseline.mediaPermissionOrchestratorContract.requirementId ||
    mediaPermissionData.acceptanceId !== baseline.mediaPermissionOrchestratorContract.acceptanceId ||
    mediaPermissionData.topLevelTests !== baseline.mediaPermissionOrchestratorContract.topLevelTests ||
    mediaPermissionData.fullSuitePassed !== baseline.mediaPermissionOrchestratorContract.fullSuitePassed ||
    mediaPermissionData.callerOwnedVersionedTaskDefinition !== baseline.mediaPermissionOrchestratorContract.callerOwnedVersionedTaskDefinition ||
    mediaPermissionData.manualFallbackRequiredForCamera !== baseline.mediaPermissionOrchestratorContract.manualFallbackRequiredForCamera ||
    mediaPermissionData.taskExplanationBeforeCameraEffect !== baseline.mediaPermissionOrchestratorContract.taskExplanationBeforeCameraEffect ||
    mediaPermissionData.lateOutcomeRejected !== baseline.mediaPermissionOrchestratorContract.lateOutcomeRejected ||
    mediaPermissionData.cameraPermissionScope !== baseline.mediaPermissionOrchestratorContract.cameraPermissionScope ||
    mediaPermissionData.photoLibraryPermission !== baseline.mediaPermissionOrchestratorContract.photoLibraryPermission ||
    mediaPermissionData.videoCapture !== baseline.mediaPermissionOrchestratorContract.videoCapture ||
    mediaPermissionData.locationPermission !== baseline.mediaPermissionOrchestratorContract.locationPermission ||
    mediaPermissionData.mediaRetention !== baseline.mediaPermissionOrchestratorContract.mediaRetention ||
    mediaPermissionData.mediaPersistence !== baseline.mediaPermissionOrchestratorContract.mediaPersistence ||
    mediaPermissionData.permissionCopyAuthorized !== baseline.mediaPermissionOrchestratorContract.permissionCopyAuthorized ||
    mediaPermissionData.nativeApiCalls !== baseline.mediaPermissionOrchestratorContract.nativeApiCalls ||
    mediaPermissionData.realNetworkRequests !== baseline.mediaPermissionOrchestratorContract.realNetworkRequests ||
    mediaPermissionData.nativeImplementationAuthorized !== baseline.mediaPermissionOrchestratorContract.nativeImplementationAuthorized ||
    mediaPermissionData.formalImplementationAuthorized !== baseline.mediaPermissionOrchestratorContract.formalImplementationAuthorized ||
    mediaPermissionData.gateStatesChanged !== baseline.mediaPermissionOrchestratorContract.gateStatesChanged ||
    mediaPermissionData.ownerIntakeChanged !== baseline.mediaPermissionOrchestratorContract.ownerIntakeChanged
  ) {
    add(
      "OPS_MEDIA_PERMISSION_ORCHESTRATOR_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "F21 媒体权限合同只登记当前任务触发的窄相机 effect、系统用户媒体选择零全库权限和拒绝/受限/撤权手工降级；不得授权权限文案、D-031 媒体保留、视频、定位、照片全库、持久化、真实原生调用、网络或正式实现",
    );
  }

  const prohibitedCapabilityAuditEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.prohibitedCapabilityAuditContract.subjectId,
  );
  const prohibitedCapabilityAuditEvent = prohibitedCapabilityAuditEvents[0]?.value;
  const prohibitedCapabilityAuditData = prohibitedCapabilityAuditEvent?.data ?? {};
  if (
    prohibitedCapabilityAuditEvents.length !== 1 ||
    prohibitedCapabilityAuditEvent?.eventId !== baseline.prohibitedCapabilityAuditContract.eventId ||
    prohibitedCapabilityAuditEvent?.type !== "ARTIFACT_CREATED" ||
    prohibitedCapabilityAuditEvent?.actor?.id !== "project-manager" ||
    prohibitedCapabilityAuditData.contractStatus !== baseline.prohibitedCapabilityAuditContract.contractStatus ||
    prohibitedCapabilityAuditData.artifactState !== baseline.prohibitedCapabilityAuditContract.artifactState ||
    JSON.stringify(prohibitedCapabilityAuditData.featureIds) !== JSON.stringify(baseline.prohibitedCapabilityAuditContract.featureIds) ||
    JSON.stringify(prohibitedCapabilityAuditData.requirementIds) !== JSON.stringify(baseline.prohibitedCapabilityAuditContract.requirementIds) ||
    JSON.stringify(prohibitedCapabilityAuditData.acceptanceIds) !== JSON.stringify(baseline.prohibitedCapabilityAuditContract.acceptanceIds) ||
    prohibitedCapabilityAuditData.topLevelTests !== baseline.prohibitedCapabilityAuditContract.topLevelTests ||
    prohibitedCapabilityAuditData.fullSuitePassed !== baseline.prohibitedCapabilityAuditContract.fullSuitePassed ||
    prohibitedCapabilityAuditData.capabilityCount !== baseline.prohibitedCapabilityAuditContract.capabilityCount ||
    prohibitedCapabilityAuditData.requiredEvidenceSurfaces !== baseline.prohibitedCapabilityAuditContract.requiredEvidenceSurfaces ||
    prohibitedCapabilityAuditData.formalSignedReleaseTargetRequired !== baseline.prohibitedCapabilityAuditContract.formalSignedReleaseTargetRequired ||
    prohibitedCapabilityAuditData.formalSignedReleaseTargetPresent !== baseline.prohibitedCapabilityAuditContract.formalSignedReleaseTargetPresent ||
    prohibitedCapabilityAuditData.currentAuditDisposition !== baseline.prohibitedCapabilityAuditContract.currentAuditDisposition ||
    JSON.stringify(prohibitedCapabilityAuditData.currentBlockers) !== JSON.stringify(baseline.prohibitedCapabilityAuditContract.currentBlockers) ||
    prohibitedCapabilityAuditData.workingTreeAbsenceIsPass !== baseline.prohibitedCapabilityAuditContract.workingTreeAbsenceIsPass ||
    prohibitedCapabilityAuditData.everyRequiredSurfaceExecuted !== baseline.prohibitedCapabilityAuditContract.everyRequiredSurfaceExecuted ||
    prohibitedCapabilityAuditData.productionArtifactScansExecuted !== baseline.prohibitedCapabilityAuditContract.productionArtifactScansExecuted ||
    prohibitedCapabilityAuditData.releaseNetworkCapturesExecuted !== baseline.prohibitedCapabilityAuditContract.releaseNetworkCapturesExecuted ||
    prohibitedCapabilityAuditData.runtimePermissionCapturesExecuted !== baseline.prohibitedCapabilityAuditContract.runtimePermissionCapturesExecuted ||
    prohibitedCapabilityAuditData.prohibitedCapabilityFindings !== baseline.prohibitedCapabilityAuditContract.prohibitedCapabilityFindings ||
    prohibitedCapabilityAuditData.evidenceTruthVerified !== baseline.prohibitedCapabilityAuditContract.evidenceTruthVerified ||
    prohibitedCapabilityAuditData.releaseGateClosed !== baseline.prohibitedCapabilityAuditContract.releaseGateClosed ||
    prohibitedCapabilityAuditData.nativeImplementationAuthorized !== baseline.prohibitedCapabilityAuditContract.nativeImplementationAuthorized ||
    prohibitedCapabilityAuditData.formalImplementationAuthorized !== baseline.prohibitedCapabilityAuditContract.formalImplementationAuthorized ||
    prohibitedCapabilityAuditData.gateStatesChanged !== baseline.prohibitedCapabilityAuditContract.gateStatesChanged ||
    prohibitedCapabilityAuditData.ownerIntakeChanged !== baseline.prohibitedCapabilityAuditContract.ownerIntakeChanged
  ) {
    add(
      "OPS_PROHIBITED_CAPABILITY_AUDIT_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "F20/F23/F24 禁止能力审计必须保持当前 BLOCKED：无正式签名 Release Archive、无 27 面生产证据且未执行工件扫描/Release 网络/定位权限捕获；不得把工作区零发现冒充 PASS、验证证据真实性或关闭发布门禁",
    );
  }

  const platformLanguageReleaseAuditEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.platformLanguageReleaseAuditContract.subjectId,
  );
  const platformLanguageReleaseAuditEvent = platformLanguageReleaseAuditEvents[0]?.value;
  const platformLanguageReleaseAuditData = platformLanguageReleaseAuditEvent?.data ?? {};
  if (
    platformLanguageReleaseAuditEvents.length !== 1 ||
    platformLanguageReleaseAuditEvent?.eventId !== baseline.platformLanguageReleaseAuditContract.eventId ||
    platformLanguageReleaseAuditEvent?.type !== "ARTIFACT_CREATED" ||
    platformLanguageReleaseAuditEvent?.actor?.id !== "project-manager" ||
    platformLanguageReleaseAuditData.contractStatus !== baseline.platformLanguageReleaseAuditContract.contractStatus ||
    platformLanguageReleaseAuditData.artifactState !== baseline.platformLanguageReleaseAuditContract.artifactState ||
    platformLanguageReleaseAuditData.featureId !== baseline.platformLanguageReleaseAuditContract.featureId ||
    platformLanguageReleaseAuditData.requirementId !== baseline.platformLanguageReleaseAuditContract.requirementId ||
    platformLanguageReleaseAuditData.acceptanceId !== baseline.platformLanguageReleaseAuditContract.acceptanceId ||
    platformLanguageReleaseAuditData.topLevelTests !== baseline.platformLanguageReleaseAuditContract.topLevelTests ||
    platformLanguageReleaseAuditData.fullSuitePassed !== baseline.platformLanguageReleaseAuditContract.fullSuitePassed ||
    platformLanguageReleaseAuditData.acceptedMinimumOsVersion !== baseline.platformLanguageReleaseAuditContract.acceptedMinimumOsVersion ||
    platformLanguageReleaseAuditData.acceptedPrimaryReleaseLanguage !== baseline.platformLanguageReleaseAuditContract.acceptedPrimaryReleaseLanguage ||
    platformLanguageReleaseAuditData.appAuthoredUiLanguageScope !== baseline.platformLanguageReleaseAuditContract.appAuthoredUiLanguageScope ||
    JSON.stringify(platformLanguageReleaseAuditData.acceptedBaselineDecisionIds) !== JSON.stringify(baseline.platformLanguageReleaseAuditContract.acceptedBaselineDecisionIds) ||
    JSON.stringify(platformLanguageReleaseAuditData.platformShapeDimensions) !== JSON.stringify(baseline.platformLanguageReleaseAuditContract.platformShapeDimensions) ||
    platformLanguageReleaseAuditData.acceptedPlatformShapeDecisions !== baseline.platformLanguageReleaseAuditContract.acceptedPlatformShapeDecisions ||
    JSON.stringify(platformLanguageReleaseAuditData.platformShapeDecisionIds) !== JSON.stringify(baseline.platformLanguageReleaseAuditContract.platformShapeDecisionIds) ||
    platformLanguageReleaseAuditData.platformShapeInferredFromD038OrCurrentDevice !== baseline.platformLanguageReleaseAuditContract.platformShapeInferredFromD038OrCurrentDevice ||
    platformLanguageReleaseAuditData.requiredEvidenceSurfaces !== baseline.platformLanguageReleaseAuditContract.requiredEvidenceSurfaces ||
    platformLanguageReleaseAuditData.formalSignedReleaseTargetRequired !== baseline.platformLanguageReleaseAuditContract.formalSignedReleaseTargetRequired ||
    platformLanguageReleaseAuditData.formalSignedReleaseTargetPresent !== baseline.platformLanguageReleaseAuditContract.formalSignedReleaseTargetPresent ||
    platformLanguageReleaseAuditData.releaseEvidenceExecuted !== baseline.platformLanguageReleaseAuditContract.releaseEvidenceExecuted ||
    platformLanguageReleaseAuditData.currentAuditDisposition !== baseline.platformLanguageReleaseAuditContract.currentAuditDisposition ||
    JSON.stringify(platformLanguageReleaseAuditData.currentBlockers) !== JSON.stringify(baseline.platformLanguageReleaseAuditContract.currentBlockers) ||
    platformLanguageReleaseAuditData.decisionTruthVerified !== baseline.platformLanguageReleaseAuditContract.decisionTruthVerified ||
    platformLanguageReleaseAuditData.evidenceTruthVerified !== baseline.platformLanguageReleaseAuditContract.evidenceTruthVerified ||
    platformLanguageReleaseAuditData.releaseGateClosed !== baseline.platformLanguageReleaseAuditContract.releaseGateClosed ||
    platformLanguageReleaseAuditData.nativeImplementationAuthorized !== baseline.platformLanguageReleaseAuditContract.nativeImplementationAuthorized ||
    platformLanguageReleaseAuditData.formalImplementationAuthorized !== baseline.platformLanguageReleaseAuditContract.formalImplementationAuthorized ||
    platformLanguageReleaseAuditData.gateStatesChanged !== baseline.platformLanguageReleaseAuditContract.gateStatesChanged ||
    platformLanguageReleaseAuditData.ownerIntakeChanged !== baseline.platformLanguageReleaseAuditContract.ownerIntakeChanged
  ) {
    add(
      "OPS_PLATFORM_LANGUAGE_RELEASE_AUDIT_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "F22 审计只固定 D-011 iOS 17.0 与 D-016 首发简中；设备族、方向、Mac 和 Vision availability 均未决定，当前无签名 Archive 或 25 面报告，必须保持 BLOCKED，不得从 D-038/当前设备推导或声称决定/证据真实和门禁关闭",
    );
  }

  const aiCredentialEvents = model.events.filter(
    (record) => record.value?.subject?.id === baseline.aiCredentialContract.subjectId,
  );
  const aiCredentialEvent = aiCredentialEvents[0]?.value;
  const aiCredentialData = aiCredentialEvent?.data ?? {};
  if (
    aiCredentialEvents.length !== 1 ||
    aiCredentialEvent?.eventId !== baseline.aiCredentialContract.eventId ||
    aiCredentialEvent?.type !== "ARTIFACT_CREATED" ||
    aiCredentialEvent?.actor?.id !== "project-manager" ||
    aiCredentialData.contractStatus !== baseline.aiCredentialContract.contractStatus ||
    aiCredentialData.topLevelTests !== baseline.aiCredentialContract.topLevelTests ||
    aiCredentialData.fullSuitePassed !== baseline.aiCredentialContract.fullSuitePassed ||
    aiCredentialData.realNetworkRequests !== baseline.aiCredentialContract.realNetworkRequests ||
    aiCredentialData.nativeImplementationAuthorized !== baseline.aiCredentialContract.nativeImplementationAuthorized ||
    aiCredentialData.formalImplementationAuthorized !== baseline.aiCredentialContract.formalImplementationAuthorized ||
    aiCredentialData.gateStatesChanged !== baseline.aiCredentialContract.gateStatesChanged ||
    aiCredentialData.ownerIntakeChanged !== baseline.aiCredentialContract.ownerIntakeChanged
  ) {
    add(
      "OPS_AI_CREDENTIAL_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-12.jsonl",
      "AI 凭据生命周期合同必须保持框架无关、非生产且不改变 Gate/Owner intake 的登记语义",
    );
  }

  const d039Events = model.events.filter(
    (record) =>
      record.value?.type === "GATE_CHANGED" &&
      record.value?.subject?.id === baseline.d039.subjectId,
  );
  if (d039Events.length === 0) {
    add(
      "OPS_D039_GATE_SENTINEL_MISSING",
      "project-ops/events",
      "缺少 D-039 PX-2 权威门禁事件",
    );
  } else if (d039Events.length > 1) {
    add(
      "OPS_D039_GATE_SENTINEL_DUPLICATE",
      "project-ops/events",
      "D-039 PX-2 权威门禁事件必须唯一",
      { eventIds: d039Events.map((record) => record.value?.eventId) },
    );
  }

  if (d039Events.length > 0) {
    const record = d039Events[0];
    const data = record.value?.data ?? {};
    const recordPath = `${record.sourceFile}:${record.lineNumber}`;
    const gateEscalated =
      record.value?.eventId !== baseline.d039.eventId ||
      data.from !== baseline.d039.from ||
      data.to !== baseline.d039.to ||
      data.next !== baseline.d039.next ||
      data.decisionState !== baseline.d039.decisionState;
    if (gateEscalated) {
      add(
        "OPS_D039_GATE_ESCALATED",
        recordPath,
        "D-039 的历史 PX-2 事件必须保持当时通过、等待 Owner 评审的候选状态",
        {
          expected: baseline.d039,
          actual: {
            eventId: record.value?.eventId,
            from: data.from,
            to: data.to,
            next: data.next,
            decisionState: data.decisionState,
          },
        },
      );
    }
    if (data.ownerChoiceRecorded !== baseline.d039.ownerChoiceRecorded) {
      add(
        "OPS_D039_OWNER_CHOICE_PREMATURE",
        `${recordPath}.data.ownerChoiceRecorded`,
        "D-039 历史 PX-2 事件不得被事后改写为已记录 Owner 选择",
      );
    }
    if (data.formalImplementationAuthorized !== baseline.d039.formalImplementationAuthorized) {
      add(
        "OPS_D039_IMPLEMENTATION_PREMATURE",
        `${recordPath}.data.formalImplementationAuthorized`,
        "D-039 历史 PX-2 事件不得被事后改写为正式实现授权",
      );
    }
    const actualFindings = Array.isArray(data.findingsClosed) ? data.findingsClosed : [];
    if (!arraysEqualAsSets(actualFindings, baseline.d039.findingsClosed)) {
      add(
        "OPS_D039_FINDINGS_SET_MISMATCH",
        `${recordPath}.data.findingsClosed`,
        "D-039 PX-2 必须关闭 D039-QA-001 至 D039-QA-010",
        { expected: baseline.d039.findingsClosed, actual: actualFindings },
      );
    }
  }

  const d039Accepted = baseline.d039.accepted;
  const d039Decision = decisionById.get(d039Accepted.decisionId);
  if (
    d039Decision?.status !== "ACCEPTED" ||
    d039Decision?.acceptedOn !== d039Accepted.acceptedOn ||
    d039Decision?.choiceKey !== d039Accepted.choiceKey
  ) {
    add(
      "OPS_D039_ACCEPTED_DECISION_MISMATCH",
      "project-ops/decisions.json.decisions",
      "D-039 必须精确保留 Owner 选择 A 后的 ACCEPTED 日期与 choiceKey",
      { expected: d039Accepted, actual: d039Decision ?? null },
    );
  }

  const d039OwnerResponses = ownerResponses.filter(
    (response) => response?.questionId === d039Accepted.questionId || response?.decisionId === d039Accepted.decisionId,
  );
  if (
    d039OwnerResponses.length !== 1 ||
    d039OwnerResponses[0]?.decisionId !== d039Accepted.decisionId ||
    d039OwnerResponses[0]?.optionKey !== d039Accepted.optionKey ||
    d039OwnerResponses[0]?.state !== "CONFIRMED_ACCEPTED"
  ) {
    add(
      "OPS_D039_OWNER_RESPONSE_MISMATCH",
      "project-ops/owner-intake.json.responses",
      "D-039 必须保留唯一且明确的 Owner A 选择响应",
      { expected: d039Accepted, actual: d039OwnerResponses },
    );
  }

  const d039AcceptanceRecords = model.events.filter(
    (record) => record.value?.eventId === d039Accepted.eventId ||
      (record.value?.type === "DECISION_ACCEPTED" && record.value?.subject?.id === d039Accepted.subjectId),
  );
  const d039AcceptanceEvent = d039AcceptanceRecords[0]?.value;
  const d039AcceptanceData = d039AcceptanceEvent?.data ?? {};
  const d039AcceptanceDataFields = Object.keys(d039Accepted)
    .filter((field) => !["eventId", "subjectId", "correlationId", "acceptedOn"].includes(field))
    .sort();
  if (
    d039AcceptanceRecords.length !== 1 ||
    d039AcceptanceEvent?.eventId !== d039Accepted.eventId ||
    d039AcceptanceEvent?.type !== "DECISION_ACCEPTED" ||
    d039AcceptanceEvent?.actor?.id !== "owner" ||
    d039AcceptanceEvent?.subject?.id !== d039Accepted.subjectId ||
    d039AcceptanceEvent?.correlationId !== d039Accepted.correlationId ||
    JSON.stringify(Object.keys(d039AcceptanceData).sort()) !== JSON.stringify(d039AcceptanceDataFields) ||
    d039AcceptanceDataFields.some((field) => d039AcceptanceData[field] !== d039Accepted[field])
  ) {
    add(
      "OPS_D039_ACCEPTANCE_EVENT_MISMATCH",
      "project-ops/events/2026-08-15.jsonl",
      "D-039 接受事件必须精确记录 Owner A、PX-3 通过、PX-4 待办，并保持正式工程、原生、PX-5、D-032 与 D-053 授权关闭",
    );
  }

  const d039Px4 = baseline.d039.px4;
  const d039Px4Records = model.events.filter(
    (record) => record.value?.eventId === d039Px4.eventId ||
      (record.value?.type === "GATE_CHANGED" && record.value?.subject?.id === d039Px4.subjectId),
  );
  const d039Px4Event = d039Px4Records[0]?.value;
  const d039Px4Data = d039Px4Event?.data ?? {};
  const d039Px4DataFields = Object.keys(d039Px4)
    .filter((field) => !["eventId", "subjectId", "correlationId"].includes(field))
    .sort();
  if (
    d039Px4Records.length !== 1 ||
    d039Px4Event?.eventId !== d039Px4.eventId ||
    d039Px4Event?.type !== "GATE_CHANGED" ||
    d039Px4Event?.actor?.id !== "project-manager" ||
    d039Px4Event?.subject?.id !== d039Px4.subjectId ||
    d039Px4Event?.correlationId !== d039Px4.correlationId ||
    JSON.stringify(Object.keys(d039Px4Data).sort()) !== JSON.stringify(d039Px4DataFields) ||
    d039Px4DataFields.some(
      (field) => JSON.stringify(d039Px4Data[field]) !== JSON.stringify(d039Px4[field]),
    )
  ) {
    add(
      "OPS_D039_PX4_BASELINE_MISMATCH",
      "project-ops/events/2026-08-15.jsonl",
      "D-039 PX-4 事件必须精确冻结方案 A、首层层级、四域复核和 PX-5/正式实现未授权边界",
    );
  }

  const d040InitialFeedback = model.events.find(
    (record) => record.value?.eventId === baseline.d040.initialFeedbackEventId,
  );
  if (!d040InitialFeedback) {
    add(
      "OPS_D040_INITIAL_FEEDBACK_MISSING",
      "project-ops/events",
      "缺少 D-040 首轮独立审查回执",
    );
  } else {
    const data = d040InitialFeedback.value?.data ?? {};
    const recordPath = `${d040InitialFeedback.sourceFile}:${d040InitialFeedback.lineNumber}`;
    if (
      d040InitialFeedback.value?.type !== "REVIEW_FEEDBACK" ||
      d040InitialFeedback.value?.correlationId !== baseline.d040.initialCorrelationId ||
      data.reviewerScopedProvisionalState !== baseline.d040.reviewerScopedProvisionalState ||
      data.authoritativeState !== baseline.d040.authoritativeState ||
      data.provisionalStateAcceptedByPm !== baseline.d040.provisionalStateAcceptedByPm
    ) {
      add(
        "OPS_D040_PROVISIONAL_STATE_NOT_NORMALIZED",
        recordPath,
        "D-040 reviewer 的临时 PX-1 表述必须保留为未被 PM 接受，并规范到 PX-0 输入缺口",
      );
    }
  }

  const d040FinalFeedbackEvents = model.events.filter(
    (record) =>
      record.value?.type === "REVIEW_FEEDBACK" &&
      record.value?.correlationId === baseline.d040.finalCorrelationId &&
      record.value?.actor?.id === baseline.d040.reviewerId,
  );
  if (d040FinalFeedbackEvents.length === 0) {
    add(
      "OPS_D040_FINAL_SENTINEL_MISSING",
      "project-ops/events",
      "缺少 D-040 delta 独立复测最终回执",
    );
  } else if (d040FinalFeedbackEvents.length > 1) {
    add(
      "OPS_D040_FINAL_SENTINEL_DUPLICATE",
      "project-ops/events",
      "D-040 delta 独立复测最终回执必须唯一",
      { eventIds: d040FinalFeedbackEvents.map((record) => record.value?.eventId) },
    );
  }

  if (d040FinalFeedbackEvents.length > 0) {
    const record = d040FinalFeedbackEvents[0];
    const data = record.value?.data ?? {};
    const recordPath = `${record.sourceFile}:${record.lineNumber}`;
    if (
      record.value?.eventId !== baseline.d040.finalFeedbackEventId ||
      data.decisionState !== baseline.d040.decisionState ||
      data.recommendedState !== baseline.d040.recommendedState ||
      data.next !== baseline.d040.next
    ) {
      add(
        "OPS_D040_STATE_ESCALATED",
        recordPath,
        "D-040 必须保持 PX-0 输入缺口并等待公式与特殊人群规则评审",
        {
          expected: {
            eventId: baseline.d040.finalFeedbackEventId,
            decisionState: baseline.d040.decisionState,
            recommendedState: baseline.d040.recommendedState,
            next: baseline.d040.next,
          },
          actual: {
            eventId: record.value?.eventId,
            decisionState: data.decisionState,
            recommendedState: data.recommendedState,
            next: data.next,
          },
        },
      );
    }
    for (const field of [
      "px1Authorized",
      "px2Authorized",
      "ownerReviewAuthorized",
      "ownerChoiceRecorded",
      "decisionAcceptedRecorded",
      "formalImplementationAuthorized",
    ]) {
      if (data[field] !== baseline.d040[field]) {
        add(
          "OPS_D040_AUTHORIZATION_PREMATURE",
          `${recordPath}.data.${field}`,
          `D-040 ${field} 必须保持 false`,
        );
      }
    }
    if (data.oi03RemainsNext !== baseline.d040.oi03RemainsNext) {
      add(
        "OPS_D040_OI03_ORDER_CHANGED",
        `${recordPath}.data.oi03RemainsNext`,
        "D-040 不得抢占 OI-03 的下一题顺序",
      );
    }
    for (const [group, expected] of [
      ["originalFindings", baseline.d040.originalFindings],
      ["closedFindings", baseline.d040.closedFindings],
    ]) {
      const actual = data[group] ?? {};
      if (actual.P1 !== expected.P1 || actual.P2 !== expected.P2 || actual.P3 !== expected.P3) {
        add(
          "OPS_D040_FINDINGS_MISMATCH",
          `${recordPath}.data.${group}`,
          "D-040 首轮 2/4/1 问题必须完整关闭",
          { expected, actual },
        );
      }
    }
    if (
      data.newFindings !== baseline.d040.newFindings ||
      data.automatedFlowsPassed !== baseline.d040.automatedFlowsPassed
    ) {
      add(
        "OPS_D040_RETEST_EVIDENCE_MISMATCH",
        `${recordPath}.data`,
        "D-040 delta 回执必须保持 0 个新问题和 9 组自动流程",
      );
    }
  }

  const validateD040ResearchReview = (spec, envelope, diagnosticPrefix) => {
    const records = model.events.filter(
      (record) =>
        record.value?.type === "REVIEW_FEEDBACK" &&
        record.value?.correlationId === spec.correlationId,
    );
    if (records.length === 0) {
      add(
        `${diagnosticPrefix}_MISSING`,
        "project-ops/events",
        `缺少 D-040 研究独立审查回执 ${spec.eventId}`,
      );
      return null;
    }
    if (records.length > 1) {
      add(
        `${diagnosticPrefix}_DUPLICATE`,
        "project-ops/events",
        `D-040 研究独立审查回执 ${spec.eventId} 必须唯一`,
        { eventIds: records.map((record) => record.value?.eventId) },
      );
    }

    const record = records[0];
    const data = record.value?.data ?? {};
    const expectedData = Object.fromEntries(
      Object.entries(spec).filter(([field]) => !["eventId", "correlationId"].includes(field)),
    );
    const changedFields = Object.entries(expectedData)
      .filter(([field, expected]) => JSON.stringify(data[field]) !== JSON.stringify(expected))
      .map(([field]) => field);
    const envelopeChanged =
      record.value?.actor?.id !== envelope.actorId ||
      record.value?.actor?.role !== envelope.actorRole ||
      record.value?.subject?.id !== envelope.subjectId ||
      record.value?.subject?.role !== envelope.subjectRole;
    if (record.value?.eventId !== spec.eventId || envelopeChanged || changedFields.length > 0) {
      add(
        `${diagnosticPrefix}_MISMATCH`,
        `${record.sourceFile}:${record.lineNumber}`,
        `D-040 研究独立审查回执 ${spec.eventId} 与版本化事实不一致`,
        {
          expectedEventId: spec.eventId,
          actualEventId: record.value?.eventId,
          envelopeChanged,
          changedFields,
        },
      );
    }
    return record;
  };

  const formulaResearch = baseline.d040Research.formula;
  validateD040ResearchReview(
    formulaResearch.initial,
    {
      actorId: formulaResearch.reviewerId,
      actorRole: formulaResearch.reviewerRole,
      subjectId: formulaResearch.subjectId,
      subjectRole: formulaResearch.subjectRole,
    },
    "OPS_D040_RESEARCH_FORMULA_AUDIT",
  );
  validateD040ResearchReview(
    formulaResearch.final,
    {
      actorId: formulaResearch.reviewerId,
      actorRole: formulaResearch.reviewerRole,
      subjectId: formulaResearch.subjectId,
      subjectRole: formulaResearch.subjectRole,
    },
    "OPS_D040_RESEARCH_FORMULA_AUDIT",
  );

  const governanceResearch = baseline.d040Research.governance;
  const governanceReviewRecords = [
    governanceResearch.initial,
    governanceResearch.interim,
    governanceResearch.final,
  ].map((spec) =>
    validateD040ResearchReview(
      spec,
      {
        actorId: governanceResearch.reviewerId,
        actorRole: governanceResearch.reviewerRole,
        subjectId: governanceResearch.subjectId,
        subjectRole: governanceResearch.subjectRole,
      },
      "OPS_D040_RESEARCH_GOVERNANCE_AUDIT",
    ),
  );
  for (const record of governanceReviewRecords.filter(Boolean)) {
    const data = record.value?.data ?? {};
    const recordPath = `${record.sourceFile}:${record.lineNumber}`;
    for (const field of [
      "ownerChoiceRecorded",
      "decisionAcceptedRecorded",
      "formalImplementationAuthorized",
    ]) {
      if (data[field] !== false) {
        add(
          "OPS_D040_RESEARCH_AUTHORIZATION_PREMATURE",
          `${recordPath}.data.${field}`,
          `D-040 治理审查中的 ${field} 必须保持 false`,
        );
      }
    }
    if (data.oi03RemainsNext !== true) {
      add(
        "OPS_D040_RESEARCH_OI03_ORDER_CHANGED",
        `${recordPath}.data.oi03RemainsNext`,
        "D-040 治理审查不得抢占 OI-03",
      );
    }
  }

  const artifactSpec = baseline.d040Research.artifact;
  const artifactEvents = model.events.filter(
    (record) =>
      record.value?.type === "ARTIFACT_CREATED" &&
      record.value?.correlationId === artifactSpec.correlationId,
  );
  if (artifactEvents.length === 0) {
    add(
      "OPS_D040_RESEARCH_ARTIFACT_MISSING",
      "project-ops/events",
      "缺少 D-040 PX-0 输入研究工件事件",
    );
  } else if (artifactEvents.length > 1) {
    add(
      "OPS_D040_RESEARCH_ARTIFACT_DUPLICATE",
      "project-ops/events",
      "D-040 PX-0 输入研究工件事件必须唯一",
      { eventIds: artifactEvents.map((record) => record.value?.eventId) },
    );
  }

  if (artifactEvents.length > 0) {
    const record = artifactEvents[0];
    const data = record.value?.data ?? {};
    const recordPath = `${record.sourceFile}:${record.lineNumber}`;
    if (
      record.value?.eventId !== artifactSpec.eventId ||
      record.value?.actor?.id !== artifactSpec.actorId ||
      record.value?.actor?.role !== artifactSpec.actorRole ||
      record.value?.subject?.id !== artifactSpec.subjectId ||
      record.value?.subject?.role !== artifactSpec.subjectRole
    ) {
      add(
        "OPS_D040_RESEARCH_ARTIFACT_ENVELOPE_MISMATCH",
        recordPath,
        "D-040 研究工件事件的 ID、创建者或工件归属发生漂移",
      );
    }
    if (
      data.state !== artifactSpec.state ||
      data.decisionState !== artifactSpec.decisionState ||
      data.authoritativeState !== artifactSpec.authoritativeState ||
      data.next !== artifactSpec.next
    ) {
      add(
        "OPS_D040_RESEARCH_STATE_ESCALATED",
        recordPath,
        "D-040 研究工件必须保持候选、PX-0 输入缺口和公式评审待办状态",
      );
    }
    if (
      data.commit !== artifactSpec.commit ||
      data.sha256 !== artifactSpec.sha256 ||
      data.lineCount !== artifactSpec.lineCount ||
      JSON.stringify(data.formulaAuditRemaining) !==
        JSON.stringify(artifactSpec.formulaAuditRemaining) ||
      JSON.stringify(data.governanceAuditRemaining) !==
        JSON.stringify(artifactSpec.governanceAuditRemaining)
    ) {
      add(
        "OPS_D040_RESEARCH_ARTIFACT_EVIDENCE_MISMATCH",
        `${recordPath}.data`,
        "D-040 研究工件提交、摘要、行数或独立复审归零证据发生漂移",
      );
    }
    if (
      data.draftQuestionCount !== artifactSpec.draftQuestionCount ||
      data.draftQuestionIdsAllocated !== artifactSpec.draftQuestionIdsAllocated
    ) {
      add(
        "OPS_D040_RESEARCH_DRAFT_QUESTIONS_CHANGED",
        `${recordPath}.data`,
        "17 个未来选择卡草案必须保持未分配权威 D-### 的状态",
      );
    }
    for (const field of [
      "px1Authorized",
      "px2Authorized",
      "ownerReviewAuthorized",
      "ownerChoiceRecorded",
      "decisionAcceptedRecorded",
      "formalImplementationAuthorized",
    ]) {
      if (data[field] !== artifactSpec[field]) {
        add(
          "OPS_D040_RESEARCH_AUTHORIZATION_PREMATURE",
          `${recordPath}.data.${field}`,
          `D-040 研究工件中的 ${field} 必须保持 false`,
        );
      }
    }
    if (data.oi03RemainsNext !== artifactSpec.oi03RemainsNext) {
      add(
        "OPS_D040_RESEARCH_OI03_ORDER_CHANGED",
        `${recordPath}.data.oi03RemainsNext`,
        "D-040 研究工件不得抢占 OI-03 的下一题顺序",
      );
    }
  }

  const macroResearch = baseline.d040Research.macro;
  for (const review of [macroResearch.formula, macroResearch.governance]) {
    const requestEvent = model.events.find((record) => record.value?.eventId === review.requestEventId);
    const feedbackEvent = model.events.find((record) => record.value?.eventId === review.feedbackEventId);
    if (!requestEvent || !feedbackEvent) {
      add(
        "OPS_D040_MACRO_REVIEW_MISSING",
        "project-ops/events",
        `缺少 D-040 宏量审查事件: ${review.correlationId}`,
      );
      continue;
    }
    if (
      requestEvent.value?.actor?.id !== "project-manager" ||
      requestEvent.value?.subject?.id !== review.reviewerId ||
      requestEvent.value?.correlationId !== review.correlationId ||
      feedbackEvent.value?.actor?.id !== review.reviewerId ||
      feedbackEvent.value?.subject?.id !== "project-manager" ||
      feedbackEvent.value?.correlationId !== review.correlationId ||
      feedbackEvent.value?.data?.state !== "completed" ||
      JSON.stringify(feedbackEvent.value?.data?.remainingFindings) !== JSON.stringify(review.remainingFindings)
    ) {
      add(
        "OPS_D040_MACRO_REVIEW_MISMATCH",
        `project-ops/events/${review.correlationId}`,
        `D-040 宏量审查回执发生漂移: ${review.correlationId}`,
      );
    }
    for (const field of [
      "px1Authorized",
      "px2Authorized",
      "ownerReviewAuthorized",
      "ownerChoiceRecorded",
      "decisionAcceptedRecorded",
      "formalImplementationAuthorized",
    ]) {
      if (feedbackEvent.value?.data?.[field] !== false || feedbackEvent.value?.data?.oi03RemainsNext !== true) {
        add(
          "OPS_D040_MACRO_AUTHORIZATION_PREMATURE",
          `project-ops/events/${review.feedbackEventId}.data`,
          `D-040 宏量审查 ${field} 或 OI-03 顺序发生越级`,
        );
        break;
      }
    }
  }

  const macroArtifactSpec = macroResearch.artifact;
  const macroArtifactEvents = model.events.filter(
    (record) => record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === macroArtifactSpec.correlationId,
  );
  if (macroArtifactEvents.length !== 1) {
    add(
      macroArtifactEvents.length === 0 ? "OPS_D040_MACRO_ARTIFACT_MISSING" : "OPS_D040_MACRO_ARTIFACT_DUPLICATE",
      "project-ops/events",
      "D-040 宏量证据工件事件必须唯一",
      { count: macroArtifactEvents.length },
    );
  } else {
    const record = macroArtifactEvents[0];
    const data = record.value?.data ?? {};
    if (
      record.value?.eventId !== macroArtifactSpec.eventId ||
      record.value?.actor?.id !== macroArtifactSpec.actorId ||
      record.value?.subject?.id !== macroArtifactSpec.subjectId ||
      data.state !== macroArtifactSpec.state ||
      data.commit !== macroArtifactSpec.commit ||
      data.sha256 !== macroArtifactSpec.sha256 ||
      data.lineCount !== macroArtifactSpec.lineCount ||
      JSON.stringify(data.formulaAuditRemaining) !== JSON.stringify(macroArtifactSpec.formulaAuditRemaining) ||
      JSON.stringify(data.governanceAuditRemaining) !== JSON.stringify(macroArtifactSpec.governanceAuditRemaining) ||
      data.decisionState !== macroArtifactSpec.decisionState ||
      data.authoritativeState !== macroArtifactSpec.authoritativeState ||
      data.next !== macroArtifactSpec.next ||
      data.draftQuestionIdsAllocated !== false ||
      data.oi03RemainsNext !== true
    ) {
      add(
        "OPS_D040_MACRO_ARTIFACT_MISMATCH",
        "project-ops/events/2026-08-06.jsonl",
        "D-040 宏量证据工件提交或候选状态发生漂移",
      );
    }
    for (const field of [
      "px1Authorized",
      "px2Authorized",
      "ownerReviewAuthorized",
      "ownerChoiceRecorded",
      "decisionAcceptedRecorded",
      "formalImplementationAuthorized",
    ]) {
      if (data[field] !== false) {
        add("OPS_D040_MACRO_AUTHORIZATION_PREMATURE", "project-ops/events/2026-08-06.jsonl", `宏量证据工件 ${field} 必须保持 false`);
      }
    }
  }

  const allocationSpec = baseline.d040Research.allocation;
  const allocationEvents = model.events.filter(
    (record) => record.value?.eventId === allocationSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === allocationSpec.correlationId),
  );
  const allocationEvent = allocationEvents[0]?.value;
  const allocationData = allocationEvent?.data ?? {};
  const allocationDataFields = Object.keys(allocationSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    allocationEvents.length !== 1 ||
    allocationEvent?.eventId !== allocationSpec.eventId ||
    allocationEvent?.type !== "ARTIFACT_CREATED" ||
    allocationEvent?.actor?.id !== allocationSpec.actorId ||
    allocationEvent?.actor?.role !== allocationSpec.actorRole ||
    allocationEvent?.subject?.id !== allocationSpec.subjectId ||
    allocationEvent?.subject?.role !== allocationSpec.subjectRole ||
    allocationEvent?.correlationId !== allocationSpec.correlationId ||
    JSON.stringify(Object.keys(allocationData).sort()) !== JSON.stringify(allocationDataFields) ||
    allocationDataFields.some(
      (field) => JSON.stringify(allocationData[field]) !== JSON.stringify(allocationSpec[field]),
    )
  ) {
    add(
      "OPS_D040_QUESTION_ALLOCATION_MISMATCH",
      "project-ops/events/2026-08-15.jsonl",
      "D-040 问题分解必须精确保留 20 个决定轴、D-054 至 D-072 预留、PX-0 输入缺口和全部授权关闭",
    );
  }

  const prematurelyRegisteredAllocationIds = decisions
    .filter((decision) => allocationSpec.newlyReservedDecisionIds.includes(decision?.id))
    .map((decision) => decision.id);
  if (prematurelyRegisteredAllocationIds.length > 0) {
    add(
      "OPS_D040_ALLOCATED_DECISION_REGISTERED_PREMATURELY",
      "project-ops/decisions.json.decisions",
      "D-054 至 D-072 当前只是预留候选 ID，选择卡规格与 Owner 选择前不得进入决定台账",
      { decisionIds: prematurelyRegisteredAllocationIds },
    );
  }

  const prematurelyRecordedAllocationResponses = ownerResponses
    .filter((response) => allocationSpec.newlyReservedDecisionIds.includes(response?.decisionId))
    .map((response) => response.decisionId);
  if (prematurelyRecordedAllocationResponses.length > 0) {
    add(
      "OPS_D040_ALLOCATED_OWNER_RESPONSE_PREMATURELY_RECORDED",
      "project-ops/owner-intake.json.responses",
      "D-054 至 D-072 尚未排入 Owner 评审，不得伪造或提前记录响应",
      { decisionIds: prematurelyRecordedAllocationResponses },
    );
  }

  if (decisions.some((decision) => decision?.id === "D-040")) {
    add(
      "OPS_D040_DECISION_REGISTERED_PREMATURELY",
      "project-ops/decisions.json.decisions",
      "D-040 在 PX-0 输入关闭和 Owner 选择前不得进入决定台账",
    );
  }
  if (ownerResponses.some((response) => response?.decisionId === "D-040")) {
    add(
      "OPS_D040_OWNER_RESPONSE_PREMATURELY_RECORDED",
      "project-ops/owner-intake.json.responses",
      "D-040 不得抢占当前 Owner intake 或伪造 Owner 响应",
    );
  }

  const firstBatchSpec = baseline.d040Research.firstBatchCards;
  const firstBatchEvents = model.events.filter(
    (record) => record.value?.eventId === firstBatchSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === firstBatchSpec.correlationId),
  );
  const firstBatchEvent = firstBatchEvents[0]?.value;
  const firstBatchData = firstBatchEvent?.data ?? {};
  const firstBatchDataFields = Object.keys(firstBatchSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    firstBatchEvents.length !== 1 ||
    firstBatchEvent?.eventId !== firstBatchSpec.eventId ||
    firstBatchEvent?.type !== "ARTIFACT_CREATED" ||
    firstBatchEvent?.actor?.id !== firstBatchSpec.actorId ||
    firstBatchEvent?.actor?.role !== firstBatchSpec.actorRole ||
    firstBatchEvent?.subject?.id !== firstBatchSpec.subjectId ||
    firstBatchEvent?.subject?.role !== firstBatchSpec.subjectRole ||
    firstBatchEvent?.correlationId !== firstBatchSpec.correlationId ||
    JSON.stringify(Object.keys(firstBatchData).sort()) !== JSON.stringify(firstBatchDataFields) ||
    firstBatchDataFields.some(
      (field) => JSON.stringify(firstBatchData[field]) !== JSON.stringify(firstBatchSpec[field]),
    )
  ) {
    add(
      "OPS_D040_FIRST_BATCH_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-15.jsonl",
      "D-040 第一批四张选择卡必须精确保留稳定 ID、互斥选项、失败关闭依赖、自审结果和 Owner 未授权边界",
    );
  }

  const energyBatchSpec = baseline.d040Research.energyBatchCards;
  const energyBatchEvents = model.events.filter(
    (record) => record.value?.eventId === energyBatchSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === energyBatchSpec.correlationId),
  );
  const energyBatchEvent = energyBatchEvents[0]?.value;
  const energyBatchData = energyBatchEvent?.data ?? {};
  const energyBatchDataFields = Object.keys(energyBatchSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    energyBatchEvents.length !== 1 ||
    energyBatchEvent?.eventId !== energyBatchSpec.eventId ||
    energyBatchEvent?.type !== "ARTIFACT_CREATED" ||
    energyBatchEvent?.actor?.id !== energyBatchSpec.actorId ||
    energyBatchEvent?.actor?.role !== energyBatchSpec.actorRole ||
    energyBatchEvent?.subject?.id !== energyBatchSpec.subjectId ||
    energyBatchEvent?.subject?.role !== energyBatchSpec.subjectRole ||
    energyBatchEvent?.correlationId !== energyBatchSpec.correlationId ||
    JSON.stringify(Object.keys(energyBatchData).sort()) !== JSON.stringify(energyBatchDataFields) ||
    energyBatchDataFields.some(
      (field) => JSON.stringify(energyBatchData[field]) !== JSON.stringify(energyBatchSpec[field]),
    )
  ) {
    add(
      "OPS_D040_ENERGY_BATCH_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-20.jsonl",
      "D-040 第二批五张能量模型卡必须精确保留 EER/REE 名称、活动输入与缺失、动态模型证据门禁、零写入、自审和 Owner/实现未授权边界",
    );
  }

  const dataLifecycleBatchSpec = baseline.d040Research.dataLifecycleBatchCards;
  const dataLifecycleBatchEvents = model.events.filter(
    (record) => record.value?.eventId === dataLifecycleBatchSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === dataLifecycleBatchSpec.correlationId),
  );
  const dataLifecycleBatchEvent = dataLifecycleBatchEvents[0]?.value;
  const dataLifecycleBatchData = dataLifecycleBatchEvent?.data ?? {};
  const dataLifecycleBatchFields = Object.keys(dataLifecycleBatchSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    dataLifecycleBatchEvents.length !== 1 ||
    dataLifecycleBatchEvent?.eventId !== dataLifecycleBatchSpec.eventId ||
    dataLifecycleBatchEvent?.type !== "ARTIFACT_CREATED" ||
    dataLifecycleBatchEvent?.actor?.id !== dataLifecycleBatchSpec.actorId ||
    dataLifecycleBatchEvent?.actor?.role !== dataLifecycleBatchSpec.actorRole ||
    dataLifecycleBatchEvent?.subject?.id !== dataLifecycleBatchSpec.subjectId ||
    dataLifecycleBatchEvent?.subject?.role !== dataLifecycleBatchSpec.subjectRole ||
    dataLifecycleBatchEvent?.correlationId !== dataLifecycleBatchSpec.correlationId ||
    JSON.stringify(Object.keys(dataLifecycleBatchData).sort()) !== JSON.stringify(dataLifecycleBatchFields) ||
    dataLifecycleBatchFields.some(
      (field) => JSON.stringify(dataLifecycleBatchData[field]) !== JSON.stringify(dataLifecycleBatchSpec[field]),
    )
  ) {
    add(
      "OPS_D040_DATA_LIFECYCLE_BATCH_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-20.jsonl",
      "D-040 第三批四张资料与目标生命周期卡必须精确保留四层分离、保存/删除组合、raw/display、历史不回算、零写入、自审和 Owner/持久化/实现未授权边界",
    );
  }

  const chinaHealthInputSpec = baseline.d040Research.chinaSupportHealthReviewInput;
  const chinaHealthInputEvents = model.events.filter(
    (record) => record.value?.eventId === chinaHealthInputSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === chinaHealthInputSpec.correlationId),
  );
  const chinaHealthInputEvent = chinaHealthInputEvents[0]?.value;
  const chinaHealthInputData = chinaHealthInputEvent?.data ?? {};
  const chinaHealthInputFields = Object.keys(chinaHealthInputSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    chinaHealthInputEvents.length !== 1 ||
    chinaHealthInputEvent?.eventId !== chinaHealthInputSpec.eventId ||
    chinaHealthInputEvent?.type !== "ARTIFACT_CREATED" ||
    chinaHealthInputEvent?.actor?.id !== chinaHealthInputSpec.actorId ||
    chinaHealthInputEvent?.actor?.role !== chinaHealthInputSpec.actorRole ||
    chinaHealthInputEvent?.subject?.id !== chinaHealthInputSpec.subjectId ||
    chinaHealthInputEvent?.subject?.role !== chinaHealthInputSpec.subjectRole ||
    chinaHealthInputEvent?.correlationId !== chinaHealthInputSpec.correlationId ||
    JSON.stringify(Object.keys(chinaHealthInputData).sort()) !== JSON.stringify(chinaHealthInputFields) ||
    chinaHealthInputFields.some(
      (field) => JSON.stringify(chinaHealthInputData[field]) !== JSON.stringify(chinaHealthInputSpec[field]),
    )
  ) {
    add(
      "OPS_D040_CHINA_HEALTH_INPUT_MISMATCH",
      "project-ops/events/2026-08-20.jsonl",
      "D-040 中国大陆支持与健康治理输入必须精确保留 12356/120 用途分离、候选称谓/文案、90 天及即时复核、具名评审缺口和 Owner/实现未授权边界",
    );
  }

  const chinaMacroInputSpec = baseline.d040Research.chinaMacronutrientStandardInput;
  const chinaMacroInputEvents = model.events.filter(
    (record) => record.value?.eventId === chinaMacroInputSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === chinaMacroInputSpec.correlationId),
  );
  const chinaMacroInputEvent = chinaMacroInputEvents[0]?.value;
  const chinaMacroInputData = chinaMacroInputEvent?.data ?? {};
  const chinaMacroInputFields = Object.keys(chinaMacroInputSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    chinaMacroInputEvents.length !== 1 ||
    chinaMacroInputEvent?.eventId !== chinaMacroInputSpec.eventId ||
    chinaMacroInputEvent?.type !== "ARTIFACT_CREATED" ||
    chinaMacroInputEvent?.actor?.id !== chinaMacroInputSpec.actorId ||
    chinaMacroInputEvent?.actor?.role !== chinaMacroInputSpec.actorRole ||
    chinaMacroInputEvent?.subject?.id !== chinaMacroInputSpec.subjectId ||
    chinaMacroInputEvent?.subject?.role !== chinaMacroInputSpec.subjectRole ||
    chinaMacroInputEvent?.correlationId !== chinaMacroInputSpec.correlationId ||
    JSON.stringify(Object.keys(chinaMacroInputData).sort()) !== JSON.stringify(chinaMacroInputFields) ||
    chinaMacroInputFields.some(
      (field) => JSON.stringify(chinaMacroInputData[field]) !== JSON.stringify(chinaMacroInputSpec[field]),
    )
  ) {
    add(
      "OPS_D040_CHINA_MACRO_STANDARD_INPUT_MISMATCH",
      "project-ops/events/2026-08-20.jsonl",
      "D-040 中国宏量标准输入必须精确保留 WS/T 578.1-2017 现行状态、成人范围、4/4/9、修订监视、禁止默认/处方/评分/历史回算和 Owner/实现未授权边界",
    );
  }

  const niddkDynamicModelInputSpec = baseline.d040Research.niddkDynamicModelFeasibilityInput;
  const niddkDynamicModelInputEvents = model.events.filter(
    (record) => record.value?.eventId === niddkDynamicModelInputSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === niddkDynamicModelInputSpec.correlationId),
  );
  const niddkDynamicModelInputEvent = niddkDynamicModelInputEvents[0]?.value;
  const niddkDynamicModelInputData = niddkDynamicModelInputEvent?.data ?? {};
  const niddkDynamicModelInputFields = Object.keys(niddkDynamicModelInputSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    niddkDynamicModelInputEvents.length !== 1 ||
    niddkDynamicModelInputEvent?.eventId !== niddkDynamicModelInputSpec.eventId ||
    niddkDynamicModelInputEvent?.type !== "ARTIFACT_CREATED" ||
    niddkDynamicModelInputEvent?.actor?.id !== niddkDynamicModelInputSpec.actorId ||
    niddkDynamicModelInputEvent?.actor?.role !== niddkDynamicModelInputSpec.actorRole ||
    niddkDynamicModelInputEvent?.subject?.id !== niddkDynamicModelInputSpec.subjectId ||
    niddkDynamicModelInputEvent?.subject?.role !== niddkDynamicModelInputSpec.subjectRole ||
    niddkDynamicModelInputEvent?.correlationId !== niddkDynamicModelInputSpec.correlationId ||
    JSON.stringify(Object.keys(niddkDynamicModelInputData).sort()) !== JSON.stringify(niddkDynamicModelInputFields) ||
    niddkDynamicModelInputFields.some(
      (field) => JSON.stringify(niddkDynamicModelInputData[field]) !== JSON.stringify(niddkDynamicModelInputSpec[field]),
    )
  ) {
    add(
      "OPS_D040_NIDDK_DYNAMIC_MODEL_FEASIBILITY_MISMATCH",
      "project-ops/events/2026-08-20.jsonl",
      "D-040 NIDDK 动态模型可行性输入必须精确保留来源/hash 已核验，但逐文件许可、稳定版本、官方 oracle corpus、回归容差、产品保护线、健康评审、Owner 和实现门禁均未通过的状态",
    );
  }

  const chinaHealthReviewerPacketSpec = baseline.d040Research.chinaHealthReviewerIntakePacket;
  const chinaHealthReviewerPacketEvents = model.events.filter(
    (record) => record.value?.eventId === chinaHealthReviewerPacketSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === chinaHealthReviewerPacketSpec.correlationId),
  );
  const chinaHealthReviewerPacketEvent = chinaHealthReviewerPacketEvents[0]?.value;
  const chinaHealthReviewerPacketData = chinaHealthReviewerPacketEvent?.data ?? {};
  const chinaHealthReviewerPacketFields = Object.keys(chinaHealthReviewerPacketSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    chinaHealthReviewerPacketEvents.length !== 1 ||
    chinaHealthReviewerPacketEvent?.eventId !== chinaHealthReviewerPacketSpec.eventId ||
    chinaHealthReviewerPacketEvent?.type !== "ARTIFACT_CREATED" ||
    chinaHealthReviewerPacketEvent?.actor?.id !== chinaHealthReviewerPacketSpec.actorId ||
    chinaHealthReviewerPacketEvent?.actor?.role !== chinaHealthReviewerPacketSpec.actorRole ||
    chinaHealthReviewerPacketEvent?.subject?.id !== chinaHealthReviewerPacketSpec.subjectId ||
    chinaHealthReviewerPacketEvent?.subject?.role !== chinaHealthReviewerPacketSpec.subjectRole ||
    chinaHealthReviewerPacketEvent?.correlationId !== chinaHealthReviewerPacketSpec.correlationId ||
    JSON.stringify(Object.keys(chinaHealthReviewerPacketData).sort()) !== JSON.stringify(chinaHealthReviewerPacketFields) ||
    chinaHealthReviewerPacketFields.some(
      (field) => JSON.stringify(chinaHealthReviewerPacketData[field]) !== JSON.stringify(chinaHealthReviewerPacketSpec[field]),
    )
  ) {
    add(
      "OPS_D040_HEALTH_REVIEWER_INTAKE_PACKET_MISMATCH",
      "project-ops/events/2026-08-20.jsonl",
      "D-040 中国健康评审人交接包必须精确保留九份输入、十三项逐条签署、具名资质/利益冲突/90 天/独立 Content QA 门禁，以及评审未开始、未批准、未外联和 Owner/实现未授权状态",
    );
  }

  const independentReviewPacketSpec = baseline.d040Research.firstThreeBatchesIndependentReviewPacket;
  const independentReviewPacketEvents = model.events.filter(
    (record) => record.value?.eventId === independentReviewPacketSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === independentReviewPacketSpec.correlationId),
  );
  const independentReviewPacketEvent = independentReviewPacketEvents[0]?.value;
  const independentReviewPacketData = independentReviewPacketEvent?.data ?? {};
  const independentReviewPacketFields = Object.keys(independentReviewPacketSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    independentReviewPacketEvents.length !== 1 ||
    independentReviewPacketEvent?.eventId !== independentReviewPacketSpec.eventId ||
    independentReviewPacketEvent?.type !== "ARTIFACT_CREATED" ||
    independentReviewPacketEvent?.actor?.id !== independentReviewPacketSpec.actorId ||
    independentReviewPacketEvent?.actor?.role !== independentReviewPacketSpec.actorRole ||
    independentReviewPacketEvent?.subject?.id !== independentReviewPacketSpec.subjectId ||
    independentReviewPacketEvent?.subject?.role !== independentReviewPacketSpec.subjectRole ||
    independentReviewPacketEvent?.correlationId !== independentReviewPacketSpec.correlationId ||
    JSON.stringify(Object.keys(independentReviewPacketData).sort()) !== JSON.stringify(independentReviewPacketFields) ||
    independentReviewPacketFields.some(
      (field) => JSON.stringify(independentReviewPacketData[field]) !== JSON.stringify(independentReviewPacketSpec[field]),
    )
  ) {
    add(
      "OPS_D040_INDEPENDENT_REVIEW_PACKET_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-040 前三批独立复核包必须精确保留十三卡、四域、十二条跨批不变量、P0~P3 标准、动态模型/健康门禁，以及复核人未指派、复核未开始、未外联和 Owner/实现未授权状态",
    );
  }

  const d063CardSpec = baseline.d040Research.d063MacroTargetSourceCardSpec;
  const d063CardEvents = model.events.filter(
    (record) => record.value?.eventId === d063CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d063CardSpec.correlationId),
  );
  const d063CardEvent = d063CardEvents[0]?.value;
  const d063CardData = d063CardEvent?.data ?? {};
  const d063CardFields = Object.keys(d063CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    d063CardEvents.length !== 1 ||
    d063CardEvent?.eventId !== d063CardSpec.eventId ||
    d063CardEvent?.type !== "ARTIFACT_CREATED" ||
    d063CardEvent?.actor?.id !== d063CardSpec.actorId ||
    d063CardEvent?.actor?.role !== d063CardSpec.actorRole ||
    d063CardEvent?.subject?.id !== d063CardSpec.subjectId ||
    d063CardEvent?.subject?.role !== d063CardSpec.subjectRole ||
    d063CardEvent?.correlationId !== d063CardSpec.correlationId ||
    JSON.stringify(Object.keys(d063CardData).sort()) !== JSON.stringify(d063CardFields) ||
    d063CardFields.some(
      (field) => JSON.stringify(d063CardData[field]) !== JSON.stringify(d063CardSpec[field]),
    )
  ) {
    add(
      "OPS_D040_D063_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-063 卡片必须精确保留三项互斥目标来源、中国健康成人参考带只读边界、D-070~D-072 依赖、四域自审，以及健康/独立复核/Owner/实现均未授权状态",
    );
  }

  const d070CardSpec = baseline.d040Research.d070CustomMacroInputShapeCardSpec;
  const d070CardEvents = model.events.filter(
    (record) => record.value?.eventId === d070CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d070CardSpec.correlationId),
  );
  const d070CardEvent = d070CardEvents[0]?.value;
  const d070CardData = d070CardEvent?.data ?? {};
  const d070CardFields = Object.keys(d070CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    d070CardEvents.length !== 1 ||
    d070CardEvent?.eventId !== d070CardSpec.eventId ||
    d070CardEvent?.type !== "ARTIFACT_CREATED" ||
    d070CardEvent?.actor?.id !== d070CardSpec.actorId ||
    d070CardEvent?.actor?.role !== d070CardSpec.actorRole ||
    d070CardEvent?.subject?.id !== d070CardSpec.subjectId ||
    d070CardEvent?.subject?.role !== d070CardSpec.subjectRole ||
    d070CardEvent?.correlationId !== d070CardSpec.correlationId ||
    JSON.stringify(Object.keys(d070CardData).sort()) !== JSON.stringify(d070CardFields) ||
    d070CardFields.some(
      (field) => JSON.stringify(d070CardData[field]) !== JSON.stringify(d070CardSpec[field]),
    )
  ) {
    add(
      "OPS_D040_D070_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-070 卡片必须精确保留完整克数/完整 100% 比例/显式部分克数三项互斥合同、缺失与换算失败关闭，以及 D-063/健康/独立复核/Owner/实现均未授权状态",
    );
  }

  const d071CardSpec = baseline.d040Research.d071MacroDisplayRoundingCardSpec;
  const d071CardEvents = model.events.filter(
    (record) => record.value?.eventId === d071CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d071CardSpec.correlationId),
  );
  const d071CardEvent = d071CardEvents[0]?.value;
  const d071CardData = d071CardEvent?.data ?? {};
  const d071CardFields = Object.keys(d071CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    d071CardEvents.length !== 1 ||
    d071CardEvent?.eventId !== d071CardSpec.eventId ||
    d071CardEvent?.type !== "ARTIFACT_CREATED" ||
    d071CardEvent?.actor?.id !== d071CardSpec.actorId ||
    d071CardEvent?.actor?.role !== d071CardSpec.actorRole ||
    d071CardEvent?.subject?.id !== d071CardSpec.subjectId ||
    d071CardEvent?.subject?.role !== d071CardSpec.subjectRole ||
    d071CardEvent?.correlationId !== d071CardSpec.correlationId ||
    JSON.stringify(Object.keys(d071CardData).sort()) !== JSON.stringify(d071CardFields) ||
    d071CardFields.some(
      (field) => JSON.stringify(d071CardData[field]) !== JSON.stringify(d071CardSpec[field]),
    )
  ) {
    add(
      "OPS_D040_D071_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-071 卡片必须精确保留三项互斥显示策略、来源与派生单位、raw/display、十进制舍入、残差披露，以及 D-063/D-070/健康/独立复核/Owner/实现均未授权状态",
    );
  }

  const d072CardSpec = baseline.d040Research.d072HardStopRecordAvailabilityCardSpec;
  const d072CardEvents = model.events.filter(
    (record) => record.value?.eventId === d072CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d072CardSpec.correlationId),
  );
  const d072CardEvent = d072CardEvents[0]?.value;
  const d072CardData = d072CardEvent?.data ?? {};
  const d072CardFields = Object.keys(d072CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    d072CardEvents.length !== 1 ||
    d072CardEvent?.eventId !== d072CardSpec.eventId ||
    d072CardEvent?.type !== "ARTIFACT_CREATED" ||
    d072CardEvent?.actor?.id !== d072CardSpec.actorId ||
    d072CardEvent?.actor?.role !== d072CardSpec.actorRole ||
    d072CardEvent?.subject?.id !== d072CardSpec.subjectId ||
    d072CardEvent?.subject?.role !== d072CardSpec.subjectRole ||
    d072CardEvent?.correlationId !== d072CardSpec.correlationId ||
    JSON.stringify(Object.keys(d072CardData).sort()) !== JSON.stringify(d072CardFields) ||
    d072CardFields.some(
      (field) => JSON.stringify(d072CardData[field]) !== JSON.stringify(d072CardSpec[field]),
    )
  ) {
    add(
      "OPS_D040_D072_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-072 卡片必须精确保留两项互斥事实记录策略、硬停止不可豁免、不诊断、不删历史、保留数据控制，以及健康/独立复核/Owner/实现均未授权状态",
    );
  }

  const macroAxisReviewPacketSpec = baseline.d040Research.macroAxisIndependentReviewPacket;
  const macroAxisReviewPacketEvents = model.events.filter(
    (record) => record.value?.eventId === macroAxisReviewPacketSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === macroAxisReviewPacketSpec.correlationId),
  );
  const macroAxisReviewPacketEvent = macroAxisReviewPacketEvents[0]?.value;
  const macroAxisReviewPacketData = macroAxisReviewPacketEvent?.data ?? {};
  const macroAxisReviewPacketFields = Object.keys(macroAxisReviewPacketSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    macroAxisReviewPacketEvents.length !== 1 ||
    macroAxisReviewPacketEvent?.eventId !== macroAxisReviewPacketSpec.eventId ||
    macroAxisReviewPacketEvent?.type !== "ARTIFACT_CREATED" ||
    macroAxisReviewPacketEvent?.actor?.id !== macroAxisReviewPacketSpec.actorId ||
    macroAxisReviewPacketEvent?.actor?.role !== macroAxisReviewPacketSpec.actorRole ||
    macroAxisReviewPacketEvent?.subject?.id !== macroAxisReviewPacketSpec.subjectId ||
    macroAxisReviewPacketEvent?.subject?.role !== macroAxisReviewPacketSpec.subjectRole ||
    macroAxisReviewPacketEvent?.correlationId !== macroAxisReviewPacketSpec.correlationId ||
    JSON.stringify(Object.keys(macroAxisReviewPacketData).sort()) !== JSON.stringify(macroAxisReviewPacketFields) ||
    macroAxisReviewPacketFields.some(
      (field) => JSON.stringify(macroAxisReviewPacketData[field]) !== JSON.stringify(macroAxisReviewPacketSpec[field]),
    )
  ) {
    add(
      "OPS_D040_MACRO_AXIS_REVIEW_PACKET_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-040 四张宏量轴卡复核包必须精确保留 10 份输入、4 张卡、4 个复核域、14 条跨轴不变量、独立性要求，以及健康/Owner/实现均未授权状态",
    );
  }

  const macroAxisInputManifestFreezeSpec = baseline.d040Research.macroAxisInputManifestFreeze;
  const macroAxisInputManifestFreezeEvents = model.events.filter(
    (record) => record.value?.eventId === macroAxisInputManifestFreezeSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === macroAxisInputManifestFreezeSpec.correlationId),
  );
  const macroAxisInputManifestFreezeEvent = macroAxisInputManifestFreezeEvents[0]?.value;
  const macroAxisInputManifestFreezeData = macroAxisInputManifestFreezeEvent?.data ?? {};
  const macroAxisInputManifestFreezeFields = Object.keys(macroAxisInputManifestFreezeSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    macroAxisInputManifestFreezeEvents.length !== 1 ||
    macroAxisInputManifestFreezeEvent?.eventId !== macroAxisInputManifestFreezeSpec.eventId ||
    macroAxisInputManifestFreezeEvent?.type !== "ARTIFACT_CREATED" ||
    macroAxisInputManifestFreezeEvent?.actor?.id !== macroAxisInputManifestFreezeSpec.actorId ||
    macroAxisInputManifestFreezeEvent?.actor?.role !== macroAxisInputManifestFreezeSpec.actorRole ||
    macroAxisInputManifestFreezeEvent?.subject?.id !== macroAxisInputManifestFreezeSpec.subjectId ||
    macroAxisInputManifestFreezeEvent?.subject?.role !== macroAxisInputManifestFreezeSpec.subjectRole ||
    macroAxisInputManifestFreezeEvent?.correlationId !== macroAxisInputManifestFreezeSpec.correlationId ||
    JSON.stringify(Object.keys(macroAxisInputManifestFreezeData).sort()) !== JSON.stringify(macroAxisInputManifestFreezeFields) ||
    macroAxisInputManifestFreezeFields.some(
      (field) => JSON.stringify(macroAxisInputManifestFreezeData[field]) !== JSON.stringify(macroAxisInputManifestFreezeSpec[field]),
    )
  ) {
    add(
      "OPS_D040_MACRO_AXIS_INPUT_MANIFEST_FREEZE_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-040 四张宏量轴卡复核输入必须精确绑定 10 项同提交原始 Git blob、SHA-256 清单，并保持复核/健康/Owner/实现门禁关闭",
    );
  }

  const px5Spec = baseline.d039.px5Assessment;
  const px5Events = model.events.filter(
    (record) => record.value?.eventId === px5Spec.eventId ||
      (record.value?.type === "REVIEW_FEEDBACK" && record.value?.correlationId === px5Spec.correlationId),
  );
  const px5Event = px5Events[0]?.value;
  const px5Data = px5Event?.data ?? {};
  const px5DataFields = Object.keys(px5Spec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    px5Events.length !== 1 ||
    px5Event?.eventId !== px5Spec.eventId ||
    px5Event?.type !== "REVIEW_FEEDBACK" ||
    px5Event?.actor?.id !== px5Spec.actorId ||
    px5Event?.actor?.role !== px5Spec.actorRole ||
    px5Event?.subject?.id !== px5Spec.subjectId ||
    px5Event?.subject?.role !== px5Spec.subjectRole ||
    px5Event?.correlationId !== px5Spec.correlationId ||
    JSON.stringify(Object.keys(px5Data).sort()) !== JSON.stringify(px5DataFields) ||
    px5DataFields.some((field) => JSON.stringify(px5Data[field]) !== JSON.stringify(px5Spec[field]))
  ) {
    add(
      "OPS_D039_PX5_DOR_ASSESSMENT_MISMATCH",
      "project-ops/events/2026-08-15.jsonl",
      "D-039 PX-5 评估必须精确保留 1/3/3 要求结论、7 个阻断项和正式工程/原生/实现未授权边界",
    );
  }

  const acceptanceMatrixSpec = baseline.d039.px5AcceptanceMatrix;
  const acceptanceMatrixEvents = model.events.filter(
    (record) => record.value?.eventId === acceptanceMatrixSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === acceptanceMatrixSpec.correlationId),
  );
  const acceptanceMatrixEvent = acceptanceMatrixEvents[0]?.value;
  const acceptanceMatrixData = acceptanceMatrixEvent?.data ?? {};
  const acceptanceMatrixFields = Object.keys(acceptanceMatrixSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    acceptanceMatrixEvents.length !== 1 ||
    acceptanceMatrixEvent?.eventId !== acceptanceMatrixSpec.eventId ||
    acceptanceMatrixEvent?.type !== "ARTIFACT_CREATED" ||
    acceptanceMatrixEvent?.actor?.id !== acceptanceMatrixSpec.actorId ||
    acceptanceMatrixEvent?.actor?.role !== acceptanceMatrixSpec.actorRole ||
    acceptanceMatrixEvent?.subject?.id !== acceptanceMatrixSpec.subjectId ||
    acceptanceMatrixEvent?.subject?.role !== acceptanceMatrixSpec.subjectRole ||
    acceptanceMatrixEvent?.correlationId !== acceptanceMatrixSpec.correlationId ||
    JSON.stringify(Object.keys(acceptanceMatrixData).sort()) !== JSON.stringify(acceptanceMatrixFields) ||
    acceptanceMatrixFields.some(
      (field) => JSON.stringify(acceptanceMatrixData[field]) !== JSON.stringify(acceptanceMatrixSpec[field]),
    )
  ) {
    add(
      "OPS_D039_PX5_B01_ACCEPTANCE_MATRIX_MISMATCH",
      "project-ops/events/2026-08-15.jsonl",
      "D-039 PX-5 B01 必须精确保留 24 条正式验收用例、B01 单独关闭、B02 至 B07 开放和全部实现授权位关闭",
    );
  }

  const routeContractSpec = baseline.d039.px5RouteContract;
  const routeContractEvents = model.events.filter(
    (record) => record.value?.eventId === routeContractSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === routeContractSpec.correlationId),
  );
  const routeContractEvent = routeContractEvents[0]?.value;
  const routeContractData = routeContractEvent?.data ?? {};
  const routeContractFields = Object.keys(routeContractSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  if (
    routeContractEvents.length !== 1 ||
    routeContractEvent?.eventId !== routeContractSpec.eventId ||
    routeContractEvent?.type !== "ARTIFACT_CREATED" ||
    routeContractEvent?.actor?.id !== routeContractSpec.actorId ||
    routeContractEvent?.actor?.role !== routeContractSpec.actorRole ||
    routeContractEvent?.subject?.id !== routeContractSpec.subjectId ||
    routeContractEvent?.subject?.role !== routeContractSpec.subjectRole ||
    routeContractEvent?.correlationId !== routeContractSpec.correlationId ||
    JSON.stringify(Object.keys(routeContractData).sort()) !== JSON.stringify(routeContractFields) ||
    routeContractFields.some(
      (field) => JSON.stringify(routeContractData[field]) !== JSON.stringify(routeContractSpec[field]),
    )
  ) {
    add(
      "OPS_D039_PX5_B02_ROUTE_CONTRACT_MISMATCH",
      "project-ops/events/2026-08-15.jsonl",
      "D-039 PX-5 B02 必须精确保留 5 个 route、严格参数、43 个静态 testID、失败关闭 deep link、B01/B02 关闭和全部实现授权位关闭",
    );
  }

  const d039B03B05ReviewPacketSpec = baseline.d039.b03B05IndependentReviewPacket;
  const d039B03B05ReviewPacketEvents = model.events.filter(
    (record) => record.value?.eventId === d039B03B05ReviewPacketSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" &&
        record.value?.correlationId === d039B03B05ReviewPacketSpec.correlationId),
  );
  const d039B03B05ReviewPacketEvent = d039B03B05ReviewPacketEvents[0]?.value;
  const d039B03B05ReviewPacketData = d039B03B05ReviewPacketEvent?.data ?? {};
  const d039B03B05ReviewPacketFields = Object.keys(d039B03B05ReviewPacketSpec)
    .filter((field) => ![
      "eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId",
    ].includes(field))
    .sort();
  if (
    d039B03B05ReviewPacketEvents.length !== 1 ||
    d039B03B05ReviewPacketEvent?.eventId !== d039B03B05ReviewPacketSpec.eventId ||
    d039B03B05ReviewPacketEvent?.type !== "ARTIFACT_CREATED" ||
    d039B03B05ReviewPacketEvent?.actor?.id !== d039B03B05ReviewPacketSpec.actorId ||
    d039B03B05ReviewPacketEvent?.actor?.role !== d039B03B05ReviewPacketSpec.actorRole ||
    d039B03B05ReviewPacketEvent?.subject?.id !== d039B03B05ReviewPacketSpec.subjectId ||
    d039B03B05ReviewPacketEvent?.subject?.role !== d039B03B05ReviewPacketSpec.subjectRole ||
    d039B03B05ReviewPacketEvent?.correlationId !== d039B03B05ReviewPacketSpec.correlationId ||
    JSON.stringify(Object.keys(d039B03B05ReviewPacketData).sort()) !==
      JSON.stringify(d039B03B05ReviewPacketFields) ||
    d039B03B05ReviewPacketFields.some(
      (field) => JSON.stringify(d039B03B05ReviewPacketData[field]) !==
        JSON.stringify(d039B03B05ReviewPacketSpec[field]),
    )
  ) {
    add(
      "OPS_D039_B03_B05_REVIEW_PACKET_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-039 B03~B05 六卡复核包必须精确保留 10 项输入、6 卡、3 阻断项、4 复核域、16 条跨卡不变量、P0~P3 标准，以及输入未冻结、复核/证据/Owner/实现门禁关闭状态",
    );
  }

  const d039B03B05InputManifestFreezeSpec = baseline.d039.b03B05InputManifestFreeze;
  const d039B03B05InputManifestFreezeEvents = model.events.filter(
    (record) => record.value?.eventId === d039B03B05InputManifestFreezeSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" &&
        record.value?.correlationId === d039B03B05InputManifestFreezeSpec.correlationId),
  );
  const d039B03B05InputManifestFreezeEvent = d039B03B05InputManifestFreezeEvents[0]?.value;
  const d039B03B05InputManifestFreezeData = d039B03B05InputManifestFreezeEvent?.data ?? {};
  const d039B03B05InputManifestFreezeFields = Object.keys(d039B03B05InputManifestFreezeSpec)
    .filter((field) => ![
      "eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId",
    ].includes(field))
    .sort();
  if (
    d039B03B05InputManifestFreezeEvents.length !== 1 ||
    d039B03B05InputManifestFreezeEvent?.eventId !== d039B03B05InputManifestFreezeSpec.eventId ||
    d039B03B05InputManifestFreezeEvent?.type !== "ARTIFACT_CREATED" ||
    d039B03B05InputManifestFreezeEvent?.actor?.id !== d039B03B05InputManifestFreezeSpec.actorId ||
    d039B03B05InputManifestFreezeEvent?.actor?.role !== d039B03B05InputManifestFreezeSpec.actorRole ||
    d039B03B05InputManifestFreezeEvent?.subject?.id !== d039B03B05InputManifestFreezeSpec.subjectId ||
    d039B03B05InputManifestFreezeEvent?.subject?.role !== d039B03B05InputManifestFreezeSpec.subjectRole ||
    d039B03B05InputManifestFreezeEvent?.correlationId !==
      d039B03B05InputManifestFreezeSpec.correlationId ||
    JSON.stringify(Object.keys(d039B03B05InputManifestFreezeData).sort()) !==
      JSON.stringify(d039B03B05InputManifestFreezeFields) ||
    d039B03B05InputManifestFreezeFields.some(
      (field) => JSON.stringify(d039B03B05InputManifestFreezeData[field]) !==
        JSON.stringify(d039B03B05InputManifestFreezeSpec[field]),
    )
  ) {
    add(
      "OPS_D039_B03_B05_INPUT_MANIFEST_FREEZE_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-039 B03~B05 六卡复核输入必须精确绑定 10 项同提交原始 Git blob、SHA-256 清单，并保持复核/证据/Owner/实现门禁关闭",
    );
  }

  const d045CardSpec = baseline.d045.cardSpec;
  const d045CardEvents = model.events.filter(
    (record) => record.value?.eventId === d045CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d045CardSpec.correlationId),
  );
  const d045CardEvent = d045CardEvents[0]?.value;
  const d045CardData = d045CardEvent?.data ?? {};
  const d045CardFields = Object.keys(d045CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  const d045Registered = model.decisionRegister.decisions.some((decision) => decision.id === "D-045");
  const d045OwnerResponses = model.ownerIntake.responses.filter((response) => response.decisionId === "D-045");
  if (
    d045CardEvents.length !== 1 ||
    d045CardEvent?.eventId !== d045CardSpec.eventId ||
    d045CardEvent?.type !== "ARTIFACT_CREATED" ||
    d045CardEvent?.actor?.id !== d045CardSpec.actorId ||
    d045CardEvent?.actor?.role !== d045CardSpec.actorRole ||
    d045CardEvent?.subject?.id !== d045CardSpec.subjectId ||
    d045CardEvent?.subject?.role !== d045CardSpec.subjectRole ||
    d045CardEvent?.correlationId !== d045CardSpec.correlationId ||
    JSON.stringify(Object.keys(d045CardData).sort()) !== JSON.stringify(d045CardFields) ||
    d045CardFields.some(
      (field) => JSON.stringify(d045CardData[field]) !== JSON.stringify(d045CardSpec[field]),
    ) ||
    d045Registered ||
    d045OwnerResponses.length !== 0
  ) {
    add(
      "OPS_D045_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-15.jsonl",
      "D-045 必须精确保留三套完整政策包、四域自审、独立复核/Owner/B03/实现未授权，并且不得提前进入决定台账或 Owner intake",
    );
  }

  const d031CardSpec = baseline.d031.cardSpec;
  const d031CardEvents = model.events.filter(
    (record) => record.value?.eventId === d031CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d031CardSpec.correlationId),
  );
  const d031CardEvent = d031CardEvents[0]?.value;
  const d031CardData = d031CardEvent?.data ?? {};
  const d031CardFields = Object.keys(d031CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  const d031Registered = model.decisionRegister.decisions.some((decision) => decision.id === "D-031");
  const d031OwnerResponses = model.ownerIntake.responses.filter((response) => response.decisionId === "D-031");
  if (
    d031CardEvents.length !== 1 ||
    d031CardEvent?.eventId !== d031CardSpec.eventId ||
    d031CardEvent?.type !== "ARTIFACT_CREATED" ||
    d031CardEvent?.actor?.id !== d031CardSpec.actorId ||
    d031CardEvent?.actor?.role !== d031CardSpec.actorRole ||
    d031CardEvent?.subject?.id !== d031CardSpec.subjectId ||
    d031CardEvent?.subject?.role !== d031CardSpec.subjectRole ||
    d031CardEvent?.correlationId !== d031CardSpec.correlationId ||
    JSON.stringify(Object.keys(d031CardData).sort()) !== JSON.stringify(d031CardFields) ||
    d031CardFields.some(
      (field) => JSON.stringify(d031CardData[field]) !== JSON.stringify(d031CardSpec[field]),
    ) ||
    d031Registered ||
    d031OwnerResponses.length !== 0
  ) {
    add(
      "OPS_D031_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-17.jsonl",
      "D-031 必须精确保留三套媒体/AI 保留政策包、临时内容清理、备份/删除边界、四域自审和独立复核/Owner/B04/实现未授权状态，并且不得提前进入决定台账或 Owner intake",
    );
  }

  const d033CardSpec = baseline.d033.cardSpec;
  const d033CardEvents = model.events.filter(
    (record) => record.value?.eventId === d033CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d033CardSpec.correlationId),
  );
  const d033CardEvent = d033CardEvents[0]?.value;
  const d033CardData = d033CardEvent?.data ?? {};
  const d033CardFields = Object.keys(d033CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  const d033Registered = model.decisionRegister.decisions.some((decision) => decision.id === "D-033");
  const d033OwnerResponses = model.ownerIntake.responses.filter((response) => response.decisionId === "D-033");
  if (
    d033CardEvents.length !== 1 ||
    d033CardEvent?.eventId !== d033CardSpec.eventId ||
    d033CardEvent?.type !== "ARTIFACT_CREATED" ||
    d033CardEvent?.actor?.id !== d033CardSpec.actorId ||
    d033CardEvent?.actor?.role !== d033CardSpec.actorRole ||
    d033CardEvent?.subject?.id !== d033CardSpec.subjectId ||
    d033CardEvent?.subject?.role !== d033CardSpec.subjectRole ||
    d033CardEvent?.correlationId !== d033CardSpec.correlationId ||
    JSON.stringify(Object.keys(d033CardData).sort()) !== JSON.stringify(d033CardFields) ||
    d033CardFields.some(
      (field) => JSON.stringify(d033CardData[field]) !== JSON.stringify(d033CardSpec[field]),
    ) ||
    d033Registered ||
    d033OwnerResponses.length !== 0
  ) {
    add(
      "OPS_D033_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-17.jsonl",
      "D-033 必须精确保留三套非标签 AI 上传确认政策包、D-014 范围、单次绑定/失效、四域自审和独立复核/Owner/B05/实现未授权状态，并且不得提前进入决定台账或 Owner intake",
    );
  }

  const d034CardSpec = baseline.d034.cardSpec;
  const d034CardEvents = model.events.filter(
    (record) => record.value?.eventId === d034CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d034CardSpec.correlationId),
  );
  const d034CardEvent = d034CardEvents[0]?.value;
  const d034CardData = d034CardEvent?.data ?? {};
  const d034CardFields = Object.keys(d034CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  const d034Registered = model.decisionRegister.decisions.some((decision) => decision.id === "D-034");
  const d034OwnerResponses = model.ownerIntake.responses.filter((response) => response.decisionId === "D-034");
  if (
    d034CardEvents.length !== 1 ||
    d034CardEvent?.eventId !== d034CardSpec.eventId ||
    d034CardEvent?.type !== "ARTIFACT_CREATED" ||
    d034CardEvent?.actor?.id !== d034CardSpec.actorId ||
    d034CardEvent?.actor?.role !== d034CardSpec.actorRole ||
    d034CardEvent?.subject?.id !== d034CardSpec.subjectId ||
    d034CardEvent?.subject?.role !== d034CardSpec.subjectRole ||
    d034CardEvent?.correlationId !== d034CardSpec.correlationId ||
    JSON.stringify(Object.keys(d034CardData).sort()) !== JSON.stringify(d034CardFields) ||
    d034CardFields.some(
      (field) => JSON.stringify(d034CardData[field]) !== JSON.stringify(d034CardSpec[field]),
    ) ||
    d034Registered ||
    d034OwnerResponses.length !== 0
  ) {
    add(
      "OPS_D034_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-17.jsonl",
      "D-034 必须精确保留三套 AI 资源预算政策包、19 维硬上限、真机 benchmark 门禁、四域自审和独立复核/Owner/B05/实现未授权状态，并且不得提前进入决定台账或 Owner intake",
    );
  }

  const d034BenchmarkProtocolSpec = baseline.d034.benchmarkProtocol;
  const d034BenchmarkProtocolEvents = model.events.filter(
    (record) => record.value?.eventId === d034BenchmarkProtocolSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" &&
        record.value?.correlationId === d034BenchmarkProtocolSpec.correlationId),
  );
  const d034BenchmarkProtocolEvent = d034BenchmarkProtocolEvents[0]?.value;
  const d034BenchmarkProtocolData = d034BenchmarkProtocolEvent?.data ?? {};
  const d034BenchmarkProtocolFields = Object.keys(d034BenchmarkProtocolSpec)
    .filter((field) => ![
      "eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId",
    ].includes(field))
    .sort();
  if (
    d034BenchmarkProtocolEvents.length !== 1 ||
    d034BenchmarkProtocolEvent?.eventId !== d034BenchmarkProtocolSpec.eventId ||
    d034BenchmarkProtocolEvent?.type !== "ARTIFACT_CREATED" ||
    d034BenchmarkProtocolEvent?.actor?.id !== d034BenchmarkProtocolSpec.actorId ||
    d034BenchmarkProtocolEvent?.actor?.role !== d034BenchmarkProtocolSpec.actorRole ||
    d034BenchmarkProtocolEvent?.subject?.id !== d034BenchmarkProtocolSpec.subjectId ||
    d034BenchmarkProtocolEvent?.subject?.role !== d034BenchmarkProtocolSpec.subjectRole ||
    d034BenchmarkProtocolEvent?.correlationId !== d034BenchmarkProtocolSpec.correlationId ||
    JSON.stringify(Object.keys(d034BenchmarkProtocolData).sort()) !==
      JSON.stringify(d034BenchmarkProtocolFields) ||
    d034BenchmarkProtocolFields.some(
      (field) => JSON.stringify(d034BenchmarkProtocolData[field]) !==
        JSON.stringify(d034BenchmarkProtocolSpec[field]),
    )
  ) {
    add(
      "OPS_D034_BENCHMARK_PROTOCOL_MISMATCH",
      "project-ops/events/2026-08-21.jsonl",
      "D-034 benchmark 协议必须绑定冻结卡输入，覆盖三档、21 行矩阵、19 项直接硬上限、两项伴随控制和同 corpus 实测标准，同时保持设备、工具链、harness、执行、复核、Owner、B05 与实现门禁关闭",
    );
  }

  const d036CardSpec = baseline.d036.cardSpec;
  const d036CardEvents = model.events.filter(
    (record) => record.value?.eventId === d036CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d036CardSpec.correlationId),
  );
  const d036CardEvent = d036CardEvents[0]?.value;
  const d036CardData = d036CardEvent?.data ?? {};
  const d036CardFields = Object.keys(d036CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  const d036Registered = model.decisionRegister.decisions.some((decision) => decision.id === "D-036");
  const d036OwnerResponses = model.ownerIntake.responses.filter((response) => response.decisionId === "D-036");
  if (
    d036CardEvents.length !== 1 ||
    d036CardEvent?.eventId !== d036CardSpec.eventId ||
    d036CardEvent?.type !== "ARTIFACT_CREATED" ||
    d036CardEvent?.actor?.id !== d036CardSpec.actorId ||
    d036CardEvent?.actor?.role !== d036CardSpec.actorRole ||
    d036CardEvent?.subject?.id !== d036CardSpec.subjectId ||
    d036CardEvent?.subject?.role !== d036CardSpec.subjectRole ||
    d036CardEvent?.correlationId !== d036CardSpec.correlationId ||
    JSON.stringify(Object.keys(d036CardData).sort()) !== JSON.stringify(d036CardFields) ||
    d036CardFields.some(
      (field) => JSON.stringify(d036CardData[field]) !== JSON.stringify(d036CardSpec[field]),
    ) ||
    d036Registered ||
    d036OwnerResponses.length !== 0
  ) {
    add(
      "OPS_D036_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-20.jsonl",
      "D-036 必须精确保留三套 AITransport 隔离政策包、origin/redirect/session/cache/cookie/credential 边界、三 Provider/原生证据门禁、四域自审和独立复核/Owner/B05/实现未授权状态，并且不得提前进入决定台账或 Owner intake",
    );
  }

  const d053CardSpec = baseline.d053.cardSpec;
  const d053CardEvents = model.events.filter(
    (record) => record.value?.eventId === d053CardSpec.eventId ||
      (record.value?.type === "ARTIFACT_CREATED" && record.value?.correlationId === d053CardSpec.correlationId),
  );
  const d053CardEvent = d053CardEvents[0]?.value;
  const d053CardData = d053CardEvent?.data ?? {};
  const d053CardFields = Object.keys(d053CardSpec)
    .filter((field) => !["eventId", "actorId", "actorRole", "subjectId", "subjectRole", "correlationId"].includes(field))
    .sort();
  const d053Decision = model.decisionRegister.decisions.find((decision) => decision.id === "D-053");
  const d053OwnerResponses = model.ownerIntake.responses.filter((response) => response.decisionId === "D-053");
  if (
    d053CardEvents.length !== 1 ||
    d053CardEvent?.eventId !== d053CardSpec.eventId ||
    d053CardEvent?.type !== "ARTIFACT_CREATED" ||
    d053CardEvent?.actor?.id !== d053CardSpec.actorId ||
    d053CardEvent?.actor?.role !== d053CardSpec.actorRole ||
    d053CardEvent?.subject?.id !== d053CardSpec.subjectId ||
    d053CardEvent?.subject?.role !== d053CardSpec.subjectRole ||
    d053CardEvent?.correlationId !== d053CardSpec.correlationId ||
    JSON.stringify(Object.keys(d053CardData).sort()) !== JSON.stringify(d053CardFields) ||
    d053CardFields.some(
      (field) => JSON.stringify(d053CardData[field]) !== JSON.stringify(d053CardSpec[field]),
    ) ||
    d053Decision?.status !== "CANDIDATE" ||
    d053Decision?.acceptedOn !== null ||
    d053Decision?.choiceKey !== "pending-owner-choice" ||
    d053OwnerResponses.length !== 0
  ) {
    add(
      "OPS_D053_CARD_SPEC_MISMATCH",
      "project-ops/events/2026-08-20.jsonl",
      "D-053 必须精确保留三套 Provider 用途准入政策包、十维证据、五类 payload、Apple 不可豁免/App Privacy/旧 harness 边界、四域自审和 OI-07/独立复核/Owner/B05/实现未授权状态，同时保持权威台账 CANDIDATE 且 Owner intake 无响应",
    );
  }

  return {
    ok: diagnostics.length === 0,
    baseline: baseline.id,
    scope: "Project Ops parsing and cross-source operational invariants",
    schemaValidation,
    counts: {
      schemas: model.schemas.length,
      decisions: decisions.length,
      acceptedDecisions,
      candidateDecisions,
      events: model.events.length,
      messages: model.messages.length,
      resolvedResponses,
      eventCountsByDate,
      agents: agents.length,
      activeAgentIds,
      evidenceItems: model.evidenceRows.length,
      confirmedEvidence: evidenceCounts.confirmed,
      crossSourceEvidence: evidenceCounts.crossSource,
      pendingEvidence: evidenceCounts.pending,
      gapThemes: gapThemeIds.length,
      ownerResponses: ownerResponses.length,
      ownerDecisionIds: ownerDecisionIds.size,
    },
    diagnostics,
  };
}

export function validateProjectOps(workspaceRoot = DEFAULT_WORKSPACE_ROOT) {
  return validateOperationalInvariants(loadProjectOps(workspaceRoot));
}

function parseArguments(argv) {
  if (argv.length === 0) {
    return { workspaceRoot: DEFAULT_WORKSPACE_ROOT, help: false };
  }
  if (argv.length === 1 && ["-h", "--help"].includes(argv[0])) {
    return { workspaceRoot: DEFAULT_WORKSPACE_ROOT, help: true };
  }
  if (argv.length === 2 && argv[0] === "--workspace") {
    return { workspaceRoot: path.resolve(argv[1]), help: false };
  }
  throw new ProjectOpsLoadError(
    "OPS_USAGE_ERROR",
    "command-line",
    "用法: node project-ops/validate.mjs [--workspace <repo-root>]",
  );
}

function printJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function runCli() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write("用法: node project-ops/validate.mjs [--workspace <repo-root>]\n");
      return 0;
    }

    const report = validateProjectOps(options.workspaceRoot);
    printJson(report, report.ok ? process.stdout : process.stderr);
    return report.ok ? 0 : 1;
  } catch (error) {
    if (error instanceof ProjectOpsLoadError) {
      printJson(
        {
          ok: false,
          error: {
            code: error.code,
            path: error.sourcePath,
            message: error.message,
          },
        },
        process.stderr,
      );
      return 2;
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  process.exitCode = runCli();
}
