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
ProjectOps schema subset: 14/14 PASS; 5 schemas and 254 controlled instances
ProjectOps validation: 109/109 PASS
ProjectOps reconcile tests: 5/5 PASS
Tool contract harnesses: 625/625 PASS
Full repository suite: 753/753 PASS
Repository source baseline: 137 events, 114 messages, 25 agents; the 2026-08-14 F01/F02 untrusted AI-response contract is the latest registered artifact. It rejects decoded duplicate keys, trailing data, empty candidate sets, unsafe labels/numbers, and resource abuse; normalized candidates are bound by a semantic fingerprint, validation accepts only passive state snapshots, and failures do not reflect response content. This does not prove Provider/schema/nutrition truth or authorize policy, credentials, body construction, network, persistence, native, or formal implementation. The earlier AI Provider-policy contract still blocks even exact local ALLOW profiles because D-053 is CANDIDATE/NOT_AUTHORIZED. F18 wipe, F19 restore/import, F03 data-pack/lookup, F09, F16, F18 access, prohibited-capability, and platform/language contracts retain their recorded boundaries.
External workbench static rebuild: NOT RUN; neither documented external workbench path exists on this machine for this verification
External workbench live/static smoke: NOT RUN; the prior 129-event/93-document result is historical and no longer proves parity with the 137-event repository source
Historical responsive check (2026-08-06): desktop and 375px mobile viewports had no horizontal overflow
```

The repository snapshot matches the latest local source time. The external
workbench was not present for the AI response verification, so no current static copy
or live/static parity result is claimed. The following supporting-script digest
belongs to the prior historical run and cannot substitute for a current run:

```text
qa/smoke-test.mjs: 3E6EFD070556C3E8FC9B42A8A766F0AB7F722E7620D942392FB7F647F3D235B4
```

The generated snapshot is intentionally verified by source counts, reconcile
freshness, required documents, and full live/static deep equality instead of a
self-referential hash stored in a document that the snapshot itself contains.

The responsive check remains historical because this continuation phase changed
only recovery commands and smoke invariants, not the workbench UI or CSS.

## Continuation boundary

`OI-03` is recorded as `iPhone 16 Pro Max / iOS 26.5 / no available Mac`. The
next Owner input is `OI-02` and must be collected with the native `choice-ui`
control. Until the Owner batch is
normalized and confirmed, D-039 remains `CANDIDATE / PX-2_PASS /
READY_FOR_OWNER_REVIEW`, D-040 remains `CANDIDATE / PX-0_INPUT_GAP /
FORMULA_REVIEW_REQUIRED`, and no formal React Native scaffold or implementation
authorization is implied by this workbench integration.
