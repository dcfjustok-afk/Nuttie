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

export const PHASE0_2026_08_13_LOCAL_DATA_REGISTRY_CONTRACT = Object.freeze({
  id: "PHASE0_2026_08_13_LOCAL_DATA_REGISTRY_CONTRACT",
  counts: Object.freeze({
    schemas: 5,
    decisions: 31,
    acceptedDecisions: 17,
    candidateDecisions: 14,
    events: 127,
    messages: 114,
    resolvedResponses: 71,
    agents: 25,
    activeAgents: 1,
    evidenceItems: 66,
    confirmedEvidence: 37,
    crossSourceEvidence: 24,
    pendingEvidence: 5,
    gapThemes: 9,
    ownerResponses: 13,
    ownerDecisionIds: 12,
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
    "2026-08-13": 1,
  }),
  pendingEvidenceIds: Object.freeze([
    "LOG-08",
    "LOG-09",
    "AI-06",
    "DATA-07",
    "DATA-08",
  ]),
  ownerIntake: Object.freeze({
    channel: "CODEX_CHOICE_UI",
    status: "IN_PROGRESS",
    acceptanceStateChanged: false,
    responseState: "PENDING_BATCH_READBACK",
    nextQuestionId: "oi02_identifier_status",
    nextQuestionTool: "mcp__choice_ui__ask_choice",
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
      state: "PENDING_BATCH_READBACK",
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
    findingsClosed: Object.freeze(
      Array.from(
        { length: 10 },
        (_, index) => `D039-QA-${String(index + 1).padStart(3, "0")}`,
      ),
    ),
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

export function validateOperationalInvariants(model, baseline = PHASE0_2026_08_13_LOCAL_DATA_REGISTRY_CONTRACT) {
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
      "Owner 当前批次必须保持精确的 12 项候选集合",
      { expected: baseline.ownerIntake.decisionIds, actual: [...ownerDecisionIds].sort() },
    );
  }
  const decisionStatusById = new Map(
    decisions.map((decision) => [decision?.id, decision?.status]),
  );
  const nonCandidateOwnerDecisionIds = [...ownerDecisionIds].filter(
    (decisionId) => decisionStatusById.get(decisionId) !== "CANDIDATE",
  );
  if (nonCandidateOwnerDecisionIds.length > 0) {
    add(
      "OPS_OWNER_DECISION_NOT_CANDIDATE",
      "project-ops/owner-intake.json.responses.decisionId",
      "Owner 当前批次的每个决定都必须仍在权威台账中保持 CANDIDATE",
      { nonCandidateOwnerDecisionIds },
    );
  }
  if (ownerIntake.channel !== baseline.ownerIntake.channel) {
    add(
      "OPS_OWNER_CHANNEL_CHANGED",
      "project-ops/owner-intake.json.channel",
      "Owner 决策渠道必须保持聊天内原生 choice-ui",
      { expected: baseline.ownerIntake.channel, actual: ownerIntake.channel },
    );
  }
  if (ownerIntake.status !== baseline.ownerIntake.status) {
    add(
      "OPS_OWNER_BATCH_PREMATURELY_CLOSED",
      "project-ops/owner-intake.json.status",
      "Owner 批次尚未完成最终回读",
      { expected: baseline.ownerIntake.status, actual: ownerIntake.status },
    );
  }
  if (ownerIntake.acceptanceStateChanged !== baseline.ownerIntake.acceptanceStateChanged) {
    add(
      "OPS_OWNER_ACCEPTANCE_STATE_CHANGED",
      "project-ops/owner-intake.json.acceptanceStateChanged",
      "Owner 尚未授权改变 accepted 状态",
    );
  }
  ownerResponses.forEach((response, index) => {
    if (response?.state !== baseline.ownerIntake.responseState) {
      add(
        "OPS_OWNER_RESPONSE_FINALIZED",
        `project-ops/owner-intake.json.responses[${index}].state`,
        "Owner response 在整批回读前必须保持待确认",
        { questionId: response?.questionId, actual: response?.state },
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
      "OI-03 完成后下一题必须保持 OI-02",
      { expected: baseline.ownerIntake.nextQuestionId, actual: ownerIntake.nextQuestion?.id },
    );
  }
  if (ownerIntake.nextQuestion?.tool !== baseline.ownerIntake.nextQuestionTool) {
    add(
      "OPS_OWNER_NEXT_QUESTION_CHANNEL_CHANGED",
      "project-ops/owner-intake.json.nextQuestion",
      "OI-02 必须通过聊天内原生 choice-ui 选择卡",
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
        "D-039 必须保持 PX-2 PASS、等待 Owner 评审的候选状态",
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
        "D-039 尚未记录 Owner A/B/C 选择",
      );
    }
    if (data.formalImplementationAuthorized !== baseline.d039.formalImplementationAuthorized) {
      add(
        "OPS_D039_IMPLEMENTATION_PREMATURE",
        `${recordPath}.data.formalImplementationAuthorized`,
        "D-039 尚未授权正式实现",
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

  if (decisions.some((decision) => decision?.id === "D-039")) {
    add(
      "OPS_D039_DECISION_REGISTERED_PREMATURELY",
      "project-ops/decisions.json.decisions",
      "D-039 在 PX-3 Owner 选择前不得进入决定台账",
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
