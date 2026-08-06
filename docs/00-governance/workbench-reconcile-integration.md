# Discovery Workbench Reconcile Integration

Status: verified handoff record
Snapshot date: 2026-08-06 (Asia/Shanghai)

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

The integration was checked against the current Nuttie workspace and passed:

```text
ProjectOps validation: 69/69 PASS
ProjectOps reconcile tests: 5/5 PASS
Contract harnesses: 18/18 PASS
Workbench smoke: 106 events, 110 messages, 23 agents, 59 documents
Responsive check: 375px viewport has no horizontal overflow
```

The report currently contains a deliberate `STALE` snapshot warning because
the manually generated snapshot predates the newest source event. This warning
is surfaced but does not trigger automatic snapshot replacement.

## Continuation boundary

The next Owner input remains `OI-03` and must be collected with the native
`request_user_input` selection card in Plan mode. Until the Owner batch is
normalized and confirmed, D-039 remains `CANDIDATE / PX-2_PASS /
READY_FOR_OWNER_REVIEW`, D-040 remains `CANDIDATE / PX-0_INPUT_GAP /
FORMULA_REVIEW_REQUIRED`, and no formal React Native scaffold or implementation
authorization is implied by this workbench integration.

