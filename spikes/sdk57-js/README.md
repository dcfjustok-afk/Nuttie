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
pnpm run export:ios-js
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
| `pnpm run verify:surface` | PASS; six high-risk packages and four config plugins bind exact JS symbols, with zero native calls |
| `pnpm run check` | PASS; TypeScript `--noEmit` |
| `pnpm run config` | PASS; public Expo configuration resolved |
| `pnpm run doctor` | PASS; 20/20 checks after directly locking required Router/Reanimated peers and `expo-doctor` |
| `pnpm run export:android` | PASS; Metro bundled 1,652 modules into one Android Hermes bundle after the high-risk dependency surface entered the route graph |
| `pnpm run export:ios-js` | PASS; Windows Metro bundled 1,565 modules under iOS platform conditions without generating a native project |

Resolved headline versions were Expo `57.0.12`, Expo Router `57.0.12`, React
Native `0.86.2`, and React `19.2.3`. The surface binds, without calling,
`expo-sqlite.openDatabaseAsync`, `expo-secure-store.getItemAsync`,
`expo-camera.CameraView`, `expo-notifications.getPermissionsAsync`,
`react-native-reanimated.Animated.View`, and
`react-native-worklets.isWorkletFunction`. The ignored export contained 29
files / 4,758,497 bytes. Its Hermes bundle SHA-256 was
`a48e69f982a0b2800a42c8feae765e6455a4d0eb94d11114995b01fe1c3863c0`; the
verified lockfile SHA-256 was
`97fadee6f3f7d67c295f3fdab2319c67c7a98390a4e4f041ce0b4afc837798d3`.
The ignored iOS-platform JavaScript export contained 25 files / 3,597,734
bytes in each of three consecutive exports. The first recorded Hermes bundle
SHA-256 was
`c19e98e3a8701f43efbe7b437b555873ae04e81be0d04f8982f7a14fde89f1f7`;
the two repeats produced
`0d7373e814569222518bb29c3a0af387f53d1069e7b42edc53e5c48b5826d0f7`
and `8cb658011877c2c4896cfc758724429cdcbe230b5fa1f420150f7a2cf4ea9cc7`.
The matching shape but differing bytes make these run-specific fingerprints,
not a reproducible-build claim.

No `ios/` or `android/` directory was generated and Prebuild was not run. This
closes only the authorized Windows JavaScript dependency/config/type-check and
Android/iOS-condition Metro-export Spike. The iOS bundle is not an Xcode,
simulator, device, native module, CocoaPods, signing, or runtime result. D-032
remains `CANDIDATE`; SQLCipher, Keychain, permissions,
native linking, CocoaPods, Xcode, signed Archive, iPhone runtime, and Release
evidence remain pending and require the second Owner action.
