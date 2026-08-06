# React Native Initialization Preflight

`tools/rn-init-preflight.mjs` is a read-only gate check for the transition from
Phase 0 planning into an isolated React Native/iOS Spike.

## What it checks

- ProjectOps reconcile status and current source counts.
- The required Owner native-selection gate for `OI-03`:
  `CODEX_REQUEST_USER_INPUT` + Plan mode + `request_user_input`.
- Presence of formal artifacts that must not exist before authorization:
  `package.json`, `pnpm-lock.yaml`, and `ios/`.
- Visibility of `node`, `pnpm`, `expo`, `xcodebuild`, and CocoaPods on `PATH`.

The command never creates, deletes, installs, prebuilds, signs, or uploads
anything. A non-zero exit code means the report contains a blocking diagnostic;
it is not an authorization to choose a fallback or to start the formal project.

## Usage

```powershell
node tools/rn-init-preflight.mjs
node tools/rn-init-preflight.mjs --workspace D:\github\Nuttie
```

The current Windows audit reports ProjectOps as healthy and the formal RN
artifacts as absent, while `xcodebuild` is unavailable. That result is an
environment fact only; it does not answer `OI-03` or replace Mac/iPhone
confirmation through the native Owner selection card.

