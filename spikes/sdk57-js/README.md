# Nuttie SDK 57 JS Spike

Status: `CANDIDATE / SPIKE_AUTHORIZED / JS_ONLY`

This disposable workspace verifies the D-032 SDK 57 JavaScript dependency,
configuration, type-check, and Metro export path on Windows. It is not the
formal Nuttie application root and does not prove native iOS compatibility.

## Candidate matrix

| Layer | Candidate |
| --- | --- |
| Node | `22.13.0` |
| Package manager | `pnpm 11.18.0`, hoisted linker, one `pnpm-lock.yaml` |
| Expo | `~57.0.9` |
| React Native | `0.86.2` |
| React | `19.2.3` |
| New Architecture | required by the SDK 57 line; no legacy fallback |

The dependency graph includes the accepted Expo Router direction and the
candidate Expo SQLite/SQLCipher, SecureStore, Camera, Notifications, and
Reanimated packages. Their presence and JS bundling do not prove native build,
runtime, entitlement, migration, permission, or release behavior.

## Hard boundary

- Do not generate `ios/` or `android/` and do not run Prebuild.
- Do not register a Bundle ID, sign, upload, deploy, or call production APIs.
- Do not move this package or lockfile to the repository root.
- A passing JS Spike keeps D-032 at `CANDIDATE`; Owner must perform the second
  D-032 action after native evidence exists.

## Verification

Run all commands with Node `22.13.0` and pnpm `11.18.0`:

```powershell
pnpm run verify:contract
pnpm run check
pnpm run config
pnpm run doctor
pnpm run export:android
pnpm install --frozen-lockfile
```

The evidence section is updated only with commands actually run in this
workspace.

## Evidence

Pending installation and verification.
