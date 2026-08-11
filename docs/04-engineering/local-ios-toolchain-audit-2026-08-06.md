# Local iOS Toolchain Audit

Audit date: 2026-08-06 (Asia/Shanghai)
Audit type: read-only environment fact check

## Observed on the current Windows host

| Tool | Result |
| --- | --- |
| Node.js | available, `v24.18.0` |
| pnpm | available, `11.15.1` |
| npm | available, `11.16.0` |
| npx | available, `11.16.0` |
| Expo CLI | not available on PATH |
| `xcodebuild` | not available on PATH |
| CocoaPods (`pod`) | not available on PATH |

## Interpretation boundary

This is an environment observation only. Owner input `OI-03` was subsequently
recorded on 2026-08-11 as `iPhone 16 Pro Max / iOS 26.5 / no available Mac`.
Neither that fact nor this Windows audit authorizes a React Native scaffold,
dependency installation, `ios/` generation, Apple signing, or distribution.

The PM must re-run this audit on an actual Mac before any native iOS Spike.
Until then, `xcodebuild`, CocoaPods, Prebuild, signing, Archive, and native
device evidence remain unavailable; pure JavaScript work is tracked separately.
