# Discovery Workbench Reconcile Integration

Status: verified handoff record
Historical integration date: 2026-08-06 (Asia/Shanghai)
Current verification date: 2026-08-14 (Asia/Shanghai)
Current ProjectOps snapshot date: 2026-08-14 (Asia/Shanghai)

## Scope

The local workbench at `D:\study\Nuttie-Discovery-Workbench` now consumes the
read-only ProjectOps reconcile report in both runtime modes:

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
ProjectOps schema subset: 14/14 PASS; 5 schemas and 248 controlled instances
ProjectOps validation: 104/104 PASS
ProjectOps reconcile tests: 5/5 PASS
Tool contract harnesses: 521/521 PASS
Full repository suite: 644/644 PASS
Workbench source baseline: 130 events, 115 messages, 25 agents; the 2026-08-14 OI-02 native request_user_input event is the latest registered artifact. It records Bundle ID NOT_CREATED and SKU=N/A without changing the 17 accepted / 14 candidate decisions or authorizing implementation. The earlier F16 AI guidance-reference, F01/F02 AI candidate-confirmation, F18 local-data registry/consistent-read, AI credential lifecycle, F04/F05/F06/F08/F10/F11/F12/F13/F14/F15/F17/F18/F21, F20/F23/F24 and F22 contracts retain their existing non-production boundaries. Both Release audit contracts remain BLOCKED because signed Archive, platform-shape decisions, and production evidence do not exist.
Workbench static rebuild: PASS; 31 decisions, 130 events, 115 messages, 25 agents, 94 documents; ProjectOps reconcile CURRENT
Workbench live/static smoke: PASS; live and generated state are deeply equal; OI-02/OI-03, batch readback, D-039 and D-040 gates match the authoritative sources
Historical responsive check (2026-08-06): desktop and 375px mobile viewports had no horizontal overflow
```

The repository snapshot matches the latest local source time. The external
workbench was restored and rerun after the 2026-08-14 OI-02 event. Its smoke no
longer hard-codes historical event or document totals: events and messages are
cross-checked against the read-only ProjectOps reconcile report, documents must
be non-empty and path-unique, required governance documents must exist, and the
generated static state must remain deeply equal to the live state. The local
supporting smoke script is not part of the Nuttie Git repository; its verified
SHA-256 value is:

```text
qa/smoke-test.mjs: 633E47BC8E37DB61AF090542713ACD0A9ACF56F6A830F8D1A8C52B94BE1FF34C
```

The generated snapshot is intentionally verified by source counts, reconcile
freshness, required documents, and full live/static deep equality instead of a
self-referential hash stored in a document that the snapshot itself contains.

The responsive check remains historical because this continuation phase changed
only recovery commands and smoke invariants, not the workbench UI or CSS.

## Continuation boundary

`OI-02` is recorded as `Bundle ID NOT_CREATED / SKU N/A`; `OI-03` remains
`iPhone 16 Pro Max / iOS 26.5 / no available Mac`. The next Owner input is the
normalized batch readback and must use host-native `request_user_input`. Until
the Owner batch is confirmed, D-039 remains `CANDIDATE / PX-2_PASS /
READY_FOR_OWNER_REVIEW`, D-040 remains `CANDIDATE / PX-0_INPUT_GAP /
FORMULA_REVIEW_REQUIRED`, and no formal React Native scaffold or implementation
authorization is implied by this workbench integration.
