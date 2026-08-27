# D-040 D-068/D-069 non-diagnostic boundary formal assignment record template

| Field | Value |
| --- | --- |
| Artifact ID | `D040-NON-DIAGNOSTIC-BOUNDARY-FORMAL-ASSIGNMENT-RECORD-TEMPLATE-001` |
| Status | `TEMPLATE_READY / EMPTY_RECORD_ONLY / REVIEW_NOT_STARTED / NOT_OWNER_READY` |
| Prior gap register | `D040-NON-DIAGNOSTIC-BOUNDARY-REVIEW-START-GAP-REGISTER-001` |
| Prior event | `EVT-20260827-012` |
| Decision | `D-040 = CANDIDATE / PX-0_INPUT_GAP` |
| Current next | `REAL_NAMED_REVIEWER_CANDIDATES_CONTACT_AUTHORIZATION_AND_FORMAL_ASSIGNMENT_RECORD_REQUIRED` |

## 1. Purpose

This template defines the minimum non-sensitive shape for a future formal reviewer assignment record for the D-068/D-069 non-diagnostic boundary review. It is intentionally empty: it does not identify reviewer candidates, store contact details, authorize contact, create an assignment, start review, approve health content, pass Content QA, schedule Owner intake, advance PX state, or authorize implementation.

The template exists to keep a future assignment record from being invented ad hoc after reviewer candidates are found. It gives the future record a fixed structure, while preserving the current fact that no formal assignment record exists.

## 2. Required future record identity

A future formal record must use:

```text
recordKind: FORMAL_ASSIGNMENT_RECORD
assignmentId: D040-NDB-ASSIGNMENT-ANNN
templateId: D040-NON-DIAGNOSTIC-BOUNDARY-FORMAL-ASSIGNMENT-RECORD-TEMPLATE-001
packetId: D040-NON-DIAGNOSTIC-BOUNDARY-INDEPENDENT-REVIEW-PACKET-001
packetVersion: PACKET-001-R1
reviewPacketEventId: EVT-20260827-007
reviewRecordHarnessEventId: EVT-20260827-008
reviewerAssignmentHarnessEventId: EVT-20260827-009
reviewerIntakePacketEventId: EVT-20260827-010
reviewHandoffChecklistEventId: EVT-20260827-011
reviewStartGapRegisterEventId: EVT-20260827-012
cardSpecEventId: EVT-20260827-005
cardHarnessEventId: EVT-20260827-006
```

All identities above are exact. A future assignment record that points to a different packet revision, card revision, handoff checklist, or gap register must be treated as a new review-start path and cannot reuse this template unchanged.

## 3. Required sections

A future formal record must contain all sections below. Missing sections fail closed:

| Section | Minimum content | Current state |
| --- | --- | --- |
| `assignmentHeader` | assignment ID, assigner name, assigned-at timestamp, assignment evidence refs | `EMPTY` |
| `reviewPacketBinding` | exact packet/checklist/register identities and SHA-256 bindings | `TEMPLATE_ONLY` |
| `reviewerRoster` | real named candidates, candidate IDs, domains, controlled contact refs | `EMPTY` |
| `identityAndCompetence` | identity, competence, independence and domain coverage references | `EMPTY` |
| `conflictDisposition` | conflict disclosure and resolution references | `EMPTY` |
| `contactAuthorization` | explicit authorization and send-scope references | `NOT_AUTHORIZED` |
| `signaturePlan` | signature method and expected attestation reference shape | `EMPTY` |
| `reviewSchedule` | accepted-at and due-at timestamps, with due after assignment | `EMPTY` |
| `sensitiveStorageAttestation` | statement that no private contact, identity document, token, signature image or health record正文 is stored | `TEMPLATE_ONLY` |
| `startGateVector` | recomputed `reviewCanStart` and all dependent gate booleans | `CLOSED` |

## 4. Empty-record invariant

This template may be committed or referenced as a local governance artifact only with the following machine-readable state:

```text
assignmentTemplateReady: true
templateSectionCount: 10
requiredBindingCount: 8
requiredFutureRecordSectionCount: 10
emptyRecordOnly: true
formalAssignmentRecordCount: 0
reviewerCandidateCount: 0
controlledContactRecordCount: 0
formalReviewRecordCount: 0
reviewerAttestationRecordCount: 0
externalContactAuthorized: false
externalMessagesSent: 0
reviewCanStart: false
reviewersAssigned: false
reviewerIdentityVerified: false
reviewerCompetenceVerified: false
reviewerIndependenceVerified: false
reviewerSignatureVerified: false
conflictOfInterestResolved: false
independentReviewStarted: false
independentReviewPassed: false
healthReviewerAssigned: false
healthContentApproved: false
contentQaPassed: false
d068OwnerReady: false
d069OwnerReady: false
ownerIntakeChanged: false
ownerCardScheduled: false
ownerReviewAuthorized: false
ownerChoiceRecorded: false
decisionAcceptedRecorded: false
px1Authorized: false
px2Authorized: false
diagnosisOrTreatmentAuthorized: false
medicationDetailCollectionAuthorized: false
healthFreeTextCollectionAuthorized: false
healthDataPersistenceAuthorized: false
automaticDialAuthorized: false
networkResourceRefreshAuthorized: false
locationReadAuthorized: false
contactsReadAuthorized: false
healthKitWriteAuthorized: false
formulaImplementationAuthorized: false
healthCopyImplementationAuthorized: false
formalRootProjectAuthorized: false
nativeIosWorkAuthorized: false
formalImplementationAuthorized: false
gateStatesChanged: false
```

## 5. Sensitive storage boundary

The future formal record may store only non-sensitive references. It must not store:

- email addresses, phone numbers, IM handles, addresses, private calendar URLs or direct contact正文;
- identity documents, license images, credential documents, signature images, private keys, tokens, passwords or bearer strings;
- health records, medication detail, diagnosis/treatment detail, free-text health narratives or HealthKit payloads;
- data URLs, full paid-resource captures, non-redacted reviewer CVs, private messages or copies of external authorization systems.

If a future process needs one of these materials, the repository may store only a stable redacted reference and a non-sensitive summary sufficient for audit routing.

## 6. Start gate rule

Creating this template is not assignment. A future assignment record may make `reviewCanStart` structurally eligible only after separate authorized records prove all of the following:

1. at least one real named reviewer candidate is recorded;
2. all four required domains are covered by qualified candidates;
3. identity, competence, independence, conflict disposition and signature plan are referenced;
4. contact authorization is explicit and scoped to this packet;
5. all reviewer contact references are controlled and non-sensitive;
6. assignment evidence is bound by `assignmentContentSha256`;
7. health review and Content QA prerequisites are not bypassed;
8. Owner/PX/implementation gates remain closed until review evidence is separately accepted.

Until those records exist, this template must continue to report `formalAssignmentRecordCount=0` and `reviewCanStart=false`.
