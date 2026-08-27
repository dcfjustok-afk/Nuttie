# D-040 D-068/D-069 non-diagnostic boundary card harness

Status: `SPIKE / LOCAL_ONLY / NON_PRODUCTION / NOT_OWNER_READY`

This harness converts the local D-040 D-068/D-069 non-diagnostic boundary card specification into a repeatable fail-closed contract. It evaluates caller-supplied card inputs only; it does not read health records, Provider documents, App Store Connect, source files, clocks, contacts, location, HealthKit, credentials, or network resources.

## Scope

- Decision family: `D-040`
- Card decisions: `D-068`, `D-069`
- Source card spec event: `EVT-20260827-005`
- Source card spec artifact: `docs/03-design/d040-non-diagnostic-boundary-card-spec.md`
- Contract implementation: `tools/d040-non-diagnostic-boundary-card-harness.mjs`
- Targeted test file: `tools/d040-non-diagnostic-boundary-card-harness.test.mjs`

The harness fixes two stable option sets:

- `D-068` non-diagnostic health context:
  - `pause_automatic_estimates_on_yes_or_unsure`
  - `pause_only_on_yes_unsure_requires_manual_review`
  - `manual_only_for_health_context`
- `D-069` estimate uncertainty copy:
  - `plain_language_no_numeric_error_bounds`
  - `model_named_general_uncertainty`
  - `validated_numeric_uncertainty_when_available`

The recommended options remain recommendations only. They are not Owner selections, defaults, decision acceptance, PX-1/PX-2 authorization, or implementation authorization.

## Evaluated boundaries

The harness checks that:

- chronic condition, medication, or `UNSURE` answers pause or fail-close automatic estimates according to the selected D-068 package;
- `UNSURE` cannot be normalized to `NO_RISK`;
- eating-disorder risk disclosure pauses weight-loss and macro-target automation;
- plain-language uncertainty never becomes personal numeric bounds;
- numeric uncertainty is unavailable unless caller-supplied evidence is explicitly marked validated and has at least one evidence reference;
- even validated numeric uncertainty is only structurally evaluated by this harness because the evidence remains caller-asserted and not independently verified;
- `NOT_APPLICABLE` is a conditional skip, not an Owner choice.

The following inputs are rejected as unsafe claims or side-effect requests:

- diagnosis or treatment authorization;
- diagnosis names, medication details, or health free text;
- health-data persistence;
- automatic dialing;
- network resource refresh;
- location, contacts, or HealthKit access;
- health review approval, Content QA, independent review, Owner-ready, Owner choice, or formal implementation claims.

## Fixed no-effect boundary

The exported `BOUNDARY` keeps all of the following at zero or false:

- `fileReads`, `fileWrites`, `networkRequests`, `providerRequests`, `credentialReads`, `businessWrites`, `healthDataWrites`, `ownerIntakeWrites`;
- `automaticDialEffects`, `locationReads`, `contactsReads`, `healthKitWrites`;
- `diagnosisOrTreatmentAuthorized`, `healthDataPersistenceAuthorized`, `healthReviewerAssigned`, `healthContentApproved`, `contentQaPassed`, `independentReviewPassed`;
- `d068OwnerReady`, `d069OwnerReady`, `ownerIntakeChanged`, `ownerReviewAuthorized`, `ownerChoiceRecorded`, `decisionAcceptedRecorded`;
- `px1Authorized`, `px2Authorized`, `formulaImplementationAuthorized`, `healthCopyImplementationAuthorized`, `nativeIosWorkAuthorized`, `formalImplementationAuthorized`, `gateStatesChanged`.

## Validation command

```powershell
node --test tools/d040-non-diagnostic-boundary-card-harness.test.mjs
```

Current targeted result:

```text
17/17 passing
```

This result validates only the local contract and synthetic/structural fixtures. It is not a health approval, Content QA pass, independent review, Owner selection, Owner intake update, implementation authorization, or release evidence.
