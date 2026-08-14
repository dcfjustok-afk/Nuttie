# React Native Initialization Preflight

`tools/rn-init-preflight.mjs` is a read-only gate check for the transition from
Phase 0 planning into an isolated React Native/iOS Spike.

## What it checks

- ProjectOps reconcile status and current source counts.
- The confirmed `OI-02` identifier status and `OI-03` device fact, the D-032
  isolated SDK 57 JS Spike authorization, and the next native D-039 Owner gate:
  `CODEX_REQUEST_USER_INPUT` + `request_user_input`.
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

The current Owner facts are `Bundle ID not created / SKU N/A` and
`iPhone 16 Pro Max / iOS 26.5 / no available Mac`. The confirmed Owner batch
allows only the D-032 isolated SDK 57 JS Spike, so `readyForJsSpike` may be
true while `readyForNativeIosSpike` remains false because Mac, `xcodebuild`,
and CocoaPods are unavailable. Recording an iPhone never implies signing,
Archive, Prebuild, or native iOS authorization.
