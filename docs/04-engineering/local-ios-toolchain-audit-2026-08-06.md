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

This is an environment observation only. It does not answer Owner input
`OI-03`, does not prove that an iPhone or Mac is available, and does not
authorize a React Native scaffold, dependency installation, `ios/` generation,
Apple signing, or any distribution action.

After the Owner selects OI-03 through the native chat selection card in Plan
mode, the PM should re-run this audit on the actual development machine before
starting the isolated technical Spike allowed by the accepted decisions.

