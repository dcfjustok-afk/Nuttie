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
ProjectOps validation: 71/71 PASS
ProjectOps reconcile tests: 5/5 PASS
Tool contract harnesses: 85/85 PASS
Workbench smoke: 111 events, 114 messages, 25 agents, 70 documents
Responsive check: desktop and 375px mobile viewports have no horizontal overflow
```

The manually generated repository snapshot matches the latest source time. The
external static workbench copy was rebuilt from it and live/static parity passed
with `CURRENT` freshness, the exact OI-03 device fact, and OI-02 as the next
native input.

## Continuation boundary

`OI-03` is recorded as `iPhone 16 Pro Max / iOS 26.5 / no available Mac`. The
next Owner input is `OI-02` and must be collected with the native `choice-ui`
control. Until the Owner batch is
normalized and confirmed, D-039 remains `CANDIDATE / PX-2_PASS /
READY_FOR_OWNER_REVIEW`, D-040 remains `CANDIDATE / PX-0_INPUT_GAP /
FORMULA_REVIEW_REQUIRED`, and no formal React Native scaffold or implementation
authorization is implied by this workbench integration.
