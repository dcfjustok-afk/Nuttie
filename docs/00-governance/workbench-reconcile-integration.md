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
Merged repository source baseline: 31 decisions (28 accepted / 3 candidate), 152 events, 116 messages, 25 agents and 271 controlled ProjectOps instances. Owner batch confirmation remains the latest source timestamp; D-032 is `CANDIDATE + SPIKE_AUTHORIZED`, D-039 is the next native Owner card, and D-052/D-053 remain fail closed. The merged branch also retains the later local contract sequence for F01/F02/F16 request evidence, untrusted response handling and complete candidate provenance plus all previously recorded non-production contracts.
Repository validation: ProjectOps schema subset 14/14, ProjectOps validation 116/116, read-only reconcile 5/5, tool contract harnesses 634/634, full repository suite 769/769, and isolated SDK 57 static contract PASS.
Remote-machine historical workbench rebuild: PASS at 31 decisions, 142 events, 116 messages, 25 agents and 94 documents; live/static state and the 12/12 Owner archive rows matched at that source revision.
Current merged workbench parity: NOT RUN for the 152-event source; the historical 142-event PASS cannot prove current live/static equality.
Historical responsive check (2026-08-06): desktop and 375px mobile viewports had no horizontal overflow
```

The repository snapshot matches the latest local source time. The external
workbench was restored and rerun on the remote-machine Owner-batch revision, but
has not been rerun after integrating the seven additional local contract events.
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
`iPhone 16 Pro Max / iOS 26.5 / no available Mac`. The next Owner input is the
host-native D-039 choice. The Owner batch is confirmed, D-039 remains
`CANDIDATE / PX-2_PASS / READY_FOR_OWNER_REVIEW`, and D-040 remains `CANDIDATE /
PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED`. D-032 authorizes only the isolated
SDK 57 JS Spike; no formal React Native root scaffold, Apple resource, or native
iOS implementation authorization is implied by this workbench integration.
