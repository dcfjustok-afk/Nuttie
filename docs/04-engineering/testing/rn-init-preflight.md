# React Native Initialization Preflight

`tools/rn-init-preflight.mjs` is a read-only gate check for the transition from
Phase 0 planning into an isolated React Native/iOS Spike.

## What it checks

- ProjectOps reconcile status and current source counts.
- The recorded `OI-03` device fact and the next native Owner gate for `OI-02`:
  `CODEX_CHOICE_UI` + `mcp__choice_ui__ask_choice`.
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

The current Owner fact is `iPhone 16 Pro Max / iOS 26.5 / no available Mac`.
The report distinguishes `readyForJsSpike` from `readyForNativeIosSpike`.
Both remain false until the Owner batch is confirmed; the native path also
remains blocked by the missing Mac, `xcodebuild`, and CocoaPods. Recording an
iPhone never implies signing, Archive, Prebuild, or native iOS authorization.
