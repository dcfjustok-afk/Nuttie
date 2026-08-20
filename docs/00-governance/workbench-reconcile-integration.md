# Discovery Workbench Reconcile Integration

Status: verified handoff record
Historical integration date: 2026-08-06 (Asia/Shanghai)
Current verification date: 2026-08-21 (Asia/Shanghai)
Current ProjectOps snapshot date: 2026-08-21 (Asia/Shanghai)

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
Merged repository source baseline: 32 decisions (29 accepted / 3 candidate), 190 events, 116 messages, 25 agents and 309 controlled ProjectOps instances. D-039=A remains `PX-4_BASELINE_FROZEN`; B01/B02 are closed and B03 through B07 remain open. B03 has a D-045 internal card, B04 has a D-031 internal card and B05 has D-033, D-034, D-036 and D-053 internal cards; each contains three complete policy packages and cross-domain self-review. Their unified independent-review packet binds 10 inputs, six per-card dispositions, three blocker IDs, four reviewer domains, 16 cross-card invariants and P0-P3 closure rules; the 10-entry input manifest is frozen to raw Git blobs at commit `6f7980caa79faa9ce0c1c3cfdb69c16f5ced0117` with canonical SHA-256, no reviewer is assigned, and no independent or Owner review has occurred. The D-034 minimum-supported-iPhone benchmark protocol is ready with a shared three-profile corpus, all 21 matrix rows, 19 direct hard limits and two companion controls, while the minimum device, Mac/Xcode, harness, fixtures, execution, result and independent review remain missing; the D-036 Provider/native compatibility protocol is ready with no-key OI-07 inputs, 36 Provider/profile/build/runtime cells, 13 native boundary surfaces, and 10 offline/3 Provider-path minimum repetitions; OI-07, Provider targets, Mac/Xcode, the native harness, synthetic corpus, credential injection, real-network authorization, execution/results and independent review remain missing; Their shared OI-07 template now fixes one revision, three slots, 29 fields per target and 30 union fields; no Owner input, credential, cost, network or evidence authorization exists. The D-053 Provider evidence/App Privacy protocol is ready with three Providers, five payload classes, 15 minimum admission profiles, 150 ten-dimension assessments and at least five mapping rows; OI-07, Provider targets, evidence collection/snapshots, mapping, named signatures, independent review, Owner action and admission remain missing. D-040 remains `PX-0_INPUT_GAP`; its 20 decision axes and D-054 through D-072 reserved candidate IDs are unchanged, while the first three batches contain 13 self-reviewed internal cards. Their independent-review packet binds four reviewer domains, 13 per-card dispositions, 12 cross-batch invariants and P0-P3 closure rules, but no review has started. D-063 fixes three target sources, D-070 fixes three input shapes, D-071 fixes three display policies with source-unit preservation, explicit derivation, raw/display separation, decimal rounding and residual disclosure, and D-072 fixes two post-hard-stop fact-recording choices while keeping the hard stop non-waivable, preventing goal creation or scoring, preserving existing history and retaining data controls. Their four-card independent-review packet binds 10 inputs, four reviewer domains, four per-card dispositions, 14 cross-axis invariants and P0-P3 closure rules; its 10-entry input manifest is frozen to raw Git blobs at commit `47ba4895dac2535682e8d1a8cb985176d6ad45f7` with canonical SHA-256, while no reviewer is assigned and no review has started. D-063/D-070 acceptance, D-068/D-069, health numeric bounds and copy, Content QA and independent review remain open. The NIDDK dynamic-model feasibility input locates the paper, equations and seven current web code assets with hashes, while keeping adoption blocked on per-file licence, stable release, official oracle corpus, tolerance, guardrails and health review; no source was vendored or executed. The China health-review intake packet binds nine immutable artifact inputs, 13 per-item dispositions, named qualification/conflict fields, a 90-day limit and a separate Content QA gate. It is also only `PACKET_READY`: no reviewer is assigned, no qualification is verified, no review or approval has occurred and none of the four review/intake packets sent an external message. No card is scheduled for Owner review and all authorization bits remain false. D-032 is `CANDIDATE + SPIKE_AUTHORIZED`, and D-052/D-053 remain fail closed.
Repository validation: ProjectOps schema subset 14/14, ProjectOps validation 248/248, read-only reconcile 5/5, tool contract harnesses 642/642, full repository suite 930/930; isolated SDK 57 frozen install, six-package JS/type surface, static contract, Expo config, Doctor 20/20, verified 1,652-module Android and 1,565-module iOS-platform Metro/Hermes exports PASS with zero native calls. The shared export core enforces platform-only metadata, exact declared file sets, explicit asset policies, path containment and absent native directories while excluding byte size and SHA-256 from reproducibility gates. Windows exports remain JavaScript evidence only, not emulator/simulator, device, native module, signing, Archive or native-runtime evidence.
Remote-machine historical workbench rebuild: PASS at 31 decisions, 142 events, 116 messages, 25 agents and 94 documents; live/static state and the 12/12 Owner archive rows matched at that source revision.
Current merged workbench parity: NOT RUN for the 186-event source; the historical 142-event PASS cannot prove current live/static equality.
Historical responsive check (2026-08-06): desktop and 375px mobile viewports had no horizontal overflow
```

The repository snapshot matches the latest local source time. The external
workbench was restored and rerun on the remote-machine Owner-batch revision, but
has not been rerun against the current 186-event repository source.
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
