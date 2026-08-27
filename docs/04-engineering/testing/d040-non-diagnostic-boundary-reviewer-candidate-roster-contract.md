# D-040 D-068/D-069 non-diagnostic boundary reviewer candidate roster contract

| Field | Value |
| --- | --- |
| Artifact ID | `D040-NON-DIAGNOSTIC-BOUNDARY-REVIEWER-CANDIDATE-ROSTER-CONTRACT-001` |
| Status | `CONTRACT_READY / NO_REAL_CANDIDATES / NO_CONTACT / REVIEW_NOT_STARTED / NOT_OWNER_READY` |
| Prior contact authorization record contract | `D040-NON-DIAGNOSTIC-BOUNDARY-CONTACT-AUTHORIZATION-RECORD-CONTRACT-001` |
| Prior event | `EVT-20260827-015` |
| Decision | `D-040 = CANDIDATE / PX-0_INPUT_GAP` |
| Current next | `REAL_REVIEWER_CANDIDATES_AND_CONTACT_AUTHORIZATION_REQUIRED` |

## 1. Purpose

This contract defines the shape of a future non-sensitive reviewer candidate roster for the D-040 D-068/D-069 non-diagnostic boundary review. It does not create a roster, name a real reviewer, read contacts, store contact details, contact anyone, send a material packet, create a formal assignment, start independent review, approve health content, pass Content QA, schedule Owner intake, advance PX state, or authorize implementation.

The prior contact authorization record contract defines how a future contact authorization record must be represented. This roster contract defines how future candidate metadata must remain non-sensitive and separately authorized before it can be used.

## 2. Bound prior artifacts

| Source | Required identity | Current state |
| --- | --- | --- |
| Card specification | `EVT-20260827-005` | `READY / NOT_OWNER_READY` |
| Card validator | `EVT-20260827-006` | `READY / SYNTHETIC_ONLY` |
| Independent review packet | `EVT-20260827-007` | `PACKET_READY / REVIEW_NOT_STARTED` |
| Review-record contract and validator | `EVT-20260827-008` | `READY / SYNTHETIC_ONLY` |
| Reviewer-assignment contract and validator | `EVT-20260827-009` | `READY / SYNTHETIC_ONLY` |
| Reviewer intake packet | `EVT-20260827-010` | `READY / NO_REAL_CANDIDATE` |
| Review handoff checklist | `EVT-20260827-011` | `HANDOFF_CHECKLIST_READY` |
| Review start gap register | `EVT-20260827-012` | `10 OPEN GAPS` |
| Formal assignment record template | `EVT-20260827-013` | `EMPTY_RECORD_ONLY` |
| Assignment authorization preflight checklist | `EVT-20260827-014` | `AUTHORIZATION_NOT_GRANTED` |
| Contact authorization record contract | `EVT-20260827-015` | `NO_AUTHORIZATION_RECORD` |

## 3. Future reviewer candidate roster schema

A future roster record must be separate from this contract and must include only non-sensitive references:

| Field | Required future meaning | Current state |
| --- | --- | --- |
| `candidateRosterId` | Stable non-sensitive ID for the roster record | `MISSING` |
| `rosterVersion` | Version for the candidate roster shape | `MISSING` |
| `boundPacketVersion` | Exact packet version, currently `PACKET-001-R1` | `MISSING` |
| `boundEventIds` | Exact event set `EVT-20260827-005` through `EVT-20260827-015` | `MISSING` |
| `candidateRefs` | Non-sensitive candidate references, not names or contact data | `MISSING` |
| `domainCoverageClaims` | Claimed review domains for each candidate reference | `MISSING` |
| `competenceEvidenceRefs` | Non-sensitive references to future competence evidence | `MISSING` |
| `independenceEvidenceRefs` | Non-sensitive references to future independence evidence | `MISSING` |
| `conflictStatusRefs` | Non-sensitive conflict-of-interest status references | `MISSING` |
| `contactAuthorizationRecordRef` | Non-sensitive reference to a future valid contact authorization record | `MISSING` |
| `materialPacketRef` | Non-sensitive reference to the exact material packet allowed for contact | `MISSING` |
| `candidateOrderingRule` | Deterministic ordering rule without ranking by private attributes | `MISSING` |
| `expiresAt` | RFC 3339 instant after which the roster fails closed | `MISSING` |
| `auditDigest` | SHA-256 digest over the non-sensitive roster content | `MISSING` |

## 4. Sensitive storage boundary

The repository must not store the following values in the roster record:

- personal email addresses, phone numbers, IM handles, postal addresses, or raw contact book data;
- government identity document numbers or images;
- professional license screenshots, credential secrets, or full license registry responses;
- handwritten or cryptographic signature artifacts;
- private employer, patient, client, or appointment information;
- private health records, medication names, free-text conditions, or patient narratives;
- full external message bodies or private replies;
- AI prompts, model responses, API keys, tokens, or credentials;
- any private identifying material that would convert a candidate reference into a directly contactable person.

## 5. Acceptance and expiry rules

A future roster record is invalid unless all of these conditions are true:

1. Every candidate reference is non-sensitive and supplied by a separate authorized human process.
2. The roster binds exactly to `PACKET-001-R1` and events `EVT-20260827-005` through `EVT-20260827-015`.
3. The roster has at least one candidate and no more than twenty candidates when a real roster is later supplied.
4. Every claimed review domain is one of the four D-068/D-069 non-diagnostic boundary review domains.
5. Competence, independence, conflict, and contact authorization are references only and do not embed private evidence.
6. Missing, expired, revoked, mismatched, or broader-than-scope contact authorization fails closed.
7. Candidate roster readiness does not create a formal assignment or start review.
8. Candidate roster readiness does not approve health content or Content QA.
9. Candidate roster readiness does not schedule Owner intake, advance PX, accept D-068/D-069, or authorize implementation.

## 6. Machine-readable state vector

```text
reviewerCandidateRosterContractReady: true
reviewerCandidateRosterCount: 0
reviewerCandidateRosterSchemaFieldCount: 14
requiredBoundPriorEventCount: 11
sensitiveStorageForbiddenClassCount: 9
acceptanceRuleCount: 9
authorizationRecordContractReady: true
authorizationRecordCount: 0
authorizationNotGranted: true
contactAuthorizationCanBeInferred: false
authorizationRecordCanBeInferred: false
reviewerCandidateCanBeInferred: false
materialPacketSent: false
reviewerCandidateCount: 0
controlledContactRecordCount: 0
formalAssignmentRecordCount: 0
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

## 7. Current closure

This artifact is complete only as a local contract. The next real closure still requires a separate authorized human process to provide non-sensitive candidate references, a valid contact authorization record, controlled contact records, and formal assignment records. Until then, `reviewerCandidateCount=0`, `authorizationRecordCount=0`, `externalContactAuthorized=false`, `materialPacketSent=false`, `reviewCanStart=false`, and every health, Content QA, Owner, PX, and implementation gate remains closed.
