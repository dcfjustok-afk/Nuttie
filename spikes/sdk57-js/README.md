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
pnpm install --frozen-lockfile
pnpm run verify:contract
pnpm run check
pnpm run config
pnpm run doctor
pnpm run export:android
```

The evidence section is updated only with commands actually run in this
workspace.

## Evidence

Verified on Windows on 2026-08-14 with an exact temporary toolchain resolved as
Node `v22.13.0` and pnpm `11.18.0`; the machine's default Node/pnpm versions
were not used as evidence.

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS; lockfile unchanged |
| `pnpm run verify:contract` | PASS; isolated JS scope, no native directories, no Bundle ID |
| `pnpm run check` | PASS; TypeScript `--noEmit` |
| `pnpm run config` | PASS; public Expo configuration resolved |
| `pnpm run doctor` | PASS; 20/20 checks after directly locking required Router/Reanimated peers and `expo-doctor` |
| `pnpm run export:android` | PASS; Metro bundled 1,232 modules into one Android Hermes bundle |

Resolved headline versions were Expo `57.0.12`, Expo Router `57.0.12`, React
Native `0.86.2`, and React `19.2.3`. The ignored export contained 29 files /
3,632,083 bytes. Its Hermes bundle SHA-256 was
`98c8ec5c1c22e747f903010ea97bd889015eb8c4477e56ef85603593cd193fb2`; the
verified lockfile SHA-256 was
`97fadee6f3f7d67c295f3fdab2319c67c7a98390a4e4f041ce0b4afc837798d3`.

No `ios/` or `android/` directory was generated and Prebuild was not run. This
closes only the authorized Windows JavaScript dependency/config/type-check/
Metro-export Spike. D-032 remains `CANDIDATE`; SQLCipher, Keychain, permissions,
native linking, CocoaPods, Xcode, signed Archive, iPhone runtime, and Release
evidence remain pending and require the second Owner action.
