# Discovery Workbench Reconcile Integration

Status: verified handoff record
Historical integration date: 2026-08-06 (Asia/Shanghai)
Current ProjectOps snapshot date: 2026-08-13 (Asia/Shanghai)

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

The repository-side integration contract was checked against the current
Nuttie workspace and passed; the responsive result below remains historical
evidence from 2026-08-06 because the external workbench is not present now:

```text
ProjectOps schema subset: 14/14 PASS; 5 schemas and 246 controlled instances
ProjectOps validation: 101/101 PASS
ProjectOps reconcile tests: 5/5 PASS
Tool contract harnesses: 521/521 PASS
Full repository suite: 641/641 PASS
Workbench source baseline: 129 events, 114 messages, 25 agents; the 2026-08-13 F16 AI guidance-reference contract is the latest registered artifact, following the F01/F02 AI candidate-confirmation and F18 local-data registry/consistent-read port contracts and the 2026-08-12 AI credential lifecycle, F04 daily-energy ledger, F05 macro-target history, F06 meal-slot grouping, F08 date-navigation, F10 body-weight, F11 seven-day energy, F12/F17 local-profile record, F13 manual-burn, F14 water-record, F15 local-reminder reconciliation, F18 local-data-access manifest, F21 media-permission orchestrator, F20/F23/F24 prohibited-capability audit, and F22 platform/language Release audit contracts. The F16 contract only proves an editable/discardable reference draft with non-medical and zero-business-effect boundaries; it does not authorize IA, persistence, high-risk use, D-033/D-053, a formal payload, real transport, or a Repository. The F01/F02 contract does not authorize product field mapping or automatic diary/target mutation; the F18 port does not claim a SQLCipher snapshot implementation. Both Release audit contracts remain BLOCKED because signed Archive, platform-shape decisions, and production evidence do not exist.
Historical responsive check (2026-08-06): desktop and 375px mobile viewports had no horizontal overflow
```

The repository snapshot matches the latest local source time. The external
workbench integration and live/static parity passed on 2026-08-06; the external
`D:\study\Nuttie-Discovery-Workbench` directory is absent from the current
workspace, so its smoke was not rerun after the 2026-08-13 events. When restored,
it must rebuild from the current repository and recheck `CURRENT` freshness,
the exact OI-03 device fact, OI-02 as the next native input, and the 129/114/25
source counts.

## Continuation boundary

`OI-03` is recorded as `iPhone 16 Pro Max / iOS 26.5 / no available Mac`. The
next Owner input is `OI-02` and must be collected with the native `choice-ui`
control. Until the Owner batch is
normalized and confirmed, D-039 remains `CANDIDATE / PX-2_PASS /
READY_FOR_OWNER_REVIEW`, D-040 remains `CANDIDATE / PX-0_INPUT_GAP /
FORMULA_REVIEW_REQUIRED`, and no formal React Native scaffold or implementation
authorization is implied by this workbench integration.
