# Discovery Workbench Reconcile Integration

Status: verified handoff record
Historical integration date: 2026-08-06 (Asia/Shanghai)
Current verification date: 2026-08-14 (Asia/Shanghai)
Current ProjectOps snapshot date: 2026-08-14 (Asia/Shanghai)

## Scope

The historical local workbench integration at `D:\study\Nuttie-Discovery-Workbench`
was designed to consume the read-only ProjectOps reconcile report in both runtime modes:

- `server.mjs` exposes `reconcile` from `/api/project-state` and the SSE state
  event.
- `qa/build-static-snapshot.mjs` embeds the same report in the generated static
  snapshot.
- `qa/smoke-test.mjs` checks live/static parity and the Owner/D-039/D-040 gates.
- `index.html` renders four read-only status cards for source reconciliation,
  snapshot freshness, Owner next input, and prototype gates.

The workbench remains a local visualization and replay surface. It does not
write `project-ops/snapshots/current.json`, accept Owner choices, generate
decision responses, or authorize implementation.

## Verified evidence

The repository-side integration contract and the restored external workbench
were checked against the current Nuttie workspace and passed. The current
live/static verification result is:

```text
Merged repository source baseline: 32 decisions (29 accepted / 3 candidate), 176 events, 116 messages, 25 agents and 295 controlled ProjectOps instances. D-039=A remains `PX-4_BASELINE_FROZEN`; B01/B02 are closed and B03 through B07 remain open. B03 has a D-045 internal card, B04 has a D-031 internal card and B05 has D-033, D-034, D-036 and D-053 internal cards; each contains three complete policy packages and cross-domain self-review, but independent review and Owner review have not occurred. D-034 still requires a minimum-supported-iPhone benchmark; D-036 still requires OI-07, a three-Provider compatibility Spike and native boundary evidence; D-053 still requires OI-07, per-Provider ten-dimension evidence and App Privacy mapping. D-040 remains `PX-0_INPUT_GAP`; its 20 decision axes and D-054 through D-072 reserved candidate IDs are unchanged, while the first three batches contain 13 self-reviewed internal cards. The NIDDK dynamic-model feasibility input locates the paper, equations and seven current web code assets with hashes, while keeping adoption blocked on per-file licence, stable release, official oracle corpus, tolerance, guardrails and health review; no source was vendored or executed. The lifecycle batch fixes four-layer separation, storage/deletion combinations, raw/display rounding and no historical recalculation without authorizing persistence. The China support/health-governance input separates 12356 psychological assistance from 120 medical emergency and defines four term classes, six copy contexts and a 90-day/release review contract; a named qualified health reviewer, approval and Content QA remain missing. The China macro input binds current WS/T 578.1-2017 status, adult P/C/F reference bands, 4/4/9 and revision watch while prohibiting default targets, prescriptions and scoring; D-063 remains not Owner-ready. No card is scheduled for Owner review and all authorization bits remain false. D-032 is `CANDIDATE + SPIKE_AUTHORIZED`, and D-052/D-053 remain fail closed.
Repository validation: ProjectOps schema subset 14/14, ProjectOps validation 192/192, read-only reconcile 5/5, tool contract harnesses 642/642, full repository suite 863/863; isolated SDK 57 frozen install, six-package JS/type surface, static contract, Expo config, Doctor 20/20, verified 1,652-module Android and 1,565-module iOS-platform Metro/Hermes exports PASS with zero native calls. The shared export core enforces platform-only metadata, exact declared file sets, explicit asset policies, path containment and absent native directories while excluding byte size and SHA-256 from reproducibility gates. Windows exports remain JavaScript evidence only, not emulator/simulator, device, native module, signing, Archive or native-runtime evidence.
Remote-machine historical workbench rebuild: PASS at 31 decisions, 142 events, 116 messages, 25 agents and 94 documents; live/static state and the 12/12 Owner archive rows matched at that source revision.
Current merged workbench parity: NOT RUN for the 176-event source; the historical 142-event PASS cannot prove current live/static equality.
Historical responsive check (2026-08-06): desktop and 375px mobile viewports had no horizontal overflow
```

The repository snapshot matches the latest local source time. The external
workbench was restored and rerun on the remote-machine Owner-batch revision, but
has not been rerun after integrating the eight additional local contract events.
Its smoke no longer hard-codes historical event or document totals: events and
messages are cross-checked against the read-only ProjectOps reconcile report,
documents must be non-empty and path-unique, required governance documents must
exist, and generated static state must remain deeply equal to live state. The
supporting script is outside this repository; its historical verified SHA-256 is:

```text
qa/smoke-test.mjs: 1EC08A690AE0E3CF71DE94CFB2942163C41338D1A2255CF137912CBAB6BBFA2B
```

The generated snapshot is intentionally verified by source counts, reconcile
freshness, required documents, and full live/static deep equality instead of a
self-referential hash stored in a document that the snapshot itself contains.

The mobile responsive check remains historical because this continuation phase
changed data-render timing and table wording but did not change layout or CSS.

## Continuation boundary

`OI-02` is recorded as `Bundle ID NOT_CREATED / SKU N/A`; `OI-03` remains
`iPhone 16 Pro Max / iOS 26.5 / no available Mac`. D-039=A has completed its
PX-4 design baseline; its first PX-5 DoR assessment is NOT_READY, B01/B02 are closed and five blockers remain. D-040 has 20 allocated decision axes
but remains `CANDIDATE / PX-0_INPUT_GAP / CHINA_HEALTH_REVIEWER_ASSIGNMENT_AND_INDEPENDENT_REVIEW_REQUIRED`;
no Owner card is scheduled. D-032 authorizes only the isolated
SDK 57 JS Spike; no formal React Native root scaffold, Apple resource, or native
iOS implementation authorization is implied by this workbench integration.
