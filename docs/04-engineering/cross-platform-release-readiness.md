# Nuttie Cross-Platform Release Readiness

Status: `CODE_AND_WEB_VERIFIED / EXTERNAL_TARGETS_PENDING`

This is the release evidence boundary for the shared Android, iOS, React
Native Web, and mobile H5 product. A green local check proves only the scope
named by that check. It must not be reported as a native device, container, or
production deployment result.

## Evidence Matrix

| Surface              | Required evidence                                                                                                   | Current state on Windows                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared design system | `pnpm test`, `pnpm typecheck`, `pnpm build`, design gate                                                            | Passed                                                                                                                                                   |
| Static Web/H5        | 13-route export contract and Playwright at 320/390/430/600/768/1024/1440px, light/dark                              | Export passed; 35 route/width combinations plus a fresh 5-route representative pass have zero hydration/page errors                                      |
| Web authentication   | Browser refresh cookie, same-origin `/api`, login, sign-out, export, delete                                         | API contract tests passed; local API preflight returns 204 and unauthenticated refresh returns expected 401                                              |
| Android              | Expo/React Native bundle, emulator/device install, system Back, insets, dark mode, font scale, offline queue        | Windows SDK/API 35/ADB/emulator/WHPX ready at `D:\android-sdk`; local native build still fails in third-party CMake regeneration; Linux CI debug APK gate is configured but has not completed on the remote runner |
| iOS                  | Development build, simulator/device install, Keychain/secure storage, safe area, Dynamic Type, VoiceOver, dark mode | Not run: macOS/Xcode unavailable                                                                                                                         |
| Docker/Compose       | `docker compose config`, API/Web image builds, `/ready` and `/healthz` probes                                       | Static Dockerfile/Compose path audit passed; API production deploy layout contains `dist/main.js`, migrations, and `migrate.mjs`; local Docker CLI unavailable, but remote CI/Zeabur builds are the executable release path and this is not a release blocker |
| Zeabur               | Private API/PostgreSQL network, public Web gateway, HTTPS cookie flow, migration and rollback check                 | Project `untitled-1` (`6a8bfcecb1c569569969b2b7`) confirmed; managed PostgreSQL `postgresql` (`6a98045b21fc3e07432ecb4b`) is Running and private; API/Web integration and production evidence remain pending |

## Verification Snapshot: 2026-08-31

The following checks were run against the current branch after the navigation
landmark contract was added:

- `pnpm test`, `pnpm typecheck`, `pnpm build`, and `git diff --check` passed.
- The real static export was served by `.tmp/acceptance-server.mjs` on
  `127.0.0.1:4188`; `/healthz` returned `200` and `/sign-in` returned the
  matching pre-rendered HTML entry.
- A local development API ran in explicit in-memory mode on `127.0.0.1:8787`
  with the acceptance origin allowlisted. The browser refresh preflight
  returned `204`; the expected anonymous refresh response was `401`.
- Fresh Playwright coverage requested `/sign-in` at 320px, `/diary` at 390px,
  `/food` at 430px, `/trends` at 768px, and `/settings` at 1440px. Every case
  reported `document.documentElement.scrollWidth === innerWidth`, complete
  document readiness, no page errors, and no React hydration error. Phone
  routes exposed the labeled bottom navigation; 768px and 1440px exposed the
  232px rail. Dark-mode checks at 390px and 768px used the dark token surfaces
  without overflow or hydration errors.
- The 320px add-record flow kept the `保存记录` button visible at the bottom
  of the viewport with a 48px control height.
- The Zeabur UI was inspected without opening the service creation flow. The
  candidate project has no services, so API/Web/PostgreSQL names, public HTTPS
  origin, secrets, and billing authorization remain unresolved.

## Verification Snapshot: 2026-09-01

The Android build boundary was rechecked after restoring the repository's
standard pnpm install:

- `D:\android-sdk` still contains Android Platform 35, Build Tools 35,
  NDK 27.1.12297006, CMake 3.22.1, ADB and the emulator binary. No system
  image or AVD exists, so no emulator/device behavior was exercised.
- A clean single-ABI build with
  `:app:assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon`
  reproduces `ninja: error: manifest 'build.ninja' still dirty after 100
  tries`. The failing native libraries vary between
  `react-native-screens`, `expo-modules-core`, `react-native-worklets`, and
  `react-native-reanimated`; the common signal is repeated CMake regeneration
  plus CMake object-path warnings from pnpm's virtual store.
- Running from a `subst` drive is not a fix: Kotlin incremental compilation
  then sees source files under both `D:` and the mapped drive. A temporary
  `CMAKE_SUPPRESS_REGENERATION` dependency edit was also not accepted as
  evidence because it was not applied to a clean, consistently installed
  workspace. The repository therefore keeps the native build as an external
  blocker and does not claim an APK or emulator result.
- The only reproducible next paths are a clean Linux/WSL or CI native build, or
  a reviewed dependency/toolchain patch tested from one consistent install.
  Neither path has been promoted to the product branch yet.

## Verification Snapshot: 2026-09-02

- The workstation still has no Docker CLI or local Compose engine. This only
  removes optional local container verification; it does not block the release
  path because `.github/workflows/ci.yml` builds both images on a hosted Linux
  runner and Zeabur builds the selected Dockerfile from the connected commit.
- Zeabur authentication is available and project `untitled-1` is selected. A
  managed private PostgreSQL service named `postgresql` is Running. API/Web
  services, private-network variables, public HTTPS domain, migration logs,
  readiness, and rollback evidence are still open items.

## CI Android Gate: 2026-09-01

`.github/workflows/ci.yml` now includes an `android` job after the shared
verification job. The job runs on `ubuntu-latest` with Temurin Java 17 and
installs Android Platform 35, Build Tools 35.0.0, NDK 27.1.12297006, and CMake
3.22.1 before running `:app:assembleDebug` for the `arm64-v8a` ABI. A successful
run uploads the generated `app-debug.apk` for 14 days. The deployment gate now
requires this Android job in addition to typecheck/test/build and both Docker
image jobs.

This is intentionally a reproducible Linux build artifact, not native runtime
acceptance. It does not close the emulator/device, system Back, inset, font
scale, offline replay, signing, or Google Play evidence items. The first
remote run must be recorded here with its workflow URL, commit SHA, APK size,
and SHA-256 before Android can move beyond the current external-targets-pending
state.

## Required Local Gates

Run from the repository root:

```powershell
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

The build must produce all six canonical routes (`/`, `/diary`, `/trends`,
`/food`, `/settings`, `/sign-in`) and the route-group copies. The static
verifier checks the direction contract comment, local favicon, and every HTML
entry. The design verifier rejects page-local color, typography, geometry, and
border-width literals.

## Web/H5 Browser Pass

Use the checked-in Web export behind a local server that preserves the exported
HTML entry for each deep link. The production Nginx contract is
`try_files $uri $uri.html $uri/ $uri/index.html /index.html`; a local server
that rewrites every unknown path to `index.html` (for example `serve -s`) is
not valid for hydration testing because it pairs the wrong server HTML with the
client route and produces a false React `#418` blocker. At every required width:

1. Set light mode and confirm the first frame contains the same deterministic
   content before responsive and theme effects mount.
2. Check `document.documentElement.scrollWidth === innerWidth`.
3. Confirm phone widths use the labeled bottom navigation and widths at or
   above 768px use the 232px rail.
4. Open the add-record sheet at 320px and confirm the save action remains
   reachable above the safe-area/keyboard region.
5. Switch to dark mode and repeat the overflow and first-frame checks.
6. Capture console errors. Expected API `401` responses from an intentionally
   unavailable session are not hydration failures; React hydration errors are
   release blockers.

The browser pass does not prove a native secure-store, SQLCipher, Keychain,
system-back, or platform permission behavior.

## Android Pass

The Windows command-line toolchain is installed outside the repository at
`D:\android-sdk`:

- Android SDK Command-line Tools `23.0.0` (downloaded archive SHA-1
  `57d04f2d75eb8e8fffc5000a987e5de4b5a63e9d`).
- Platform Tools `37.0.1` (`adb.exe`).
- Android Platform `35` and Build Tools `35.0.0`.
- Android Emulator `37.1.11`.
- Windows Hypervisor Platform (WHPX) acceleration check passed.

Use a shell with these variables before invoking Expo or the emulator:

```powershell
$env:ANDROID_HOME = 'D:\android-sdk'
$env:ANDROID_SDK_ROOT = 'D:\android-sdk'
$env:Path = "D:\android-sdk\platform-tools;D:\android-sdk\emulator;D:\android-sdk\cmdline-tools\latest\bin;$env:Path"
```

The Google APIs x86_64 system image is still pending because the current
Android CLI mirror connection created a zero-byte temporary archive and then
lost its network connection. Do not treat the installed emulator binary as a
booted device. Once the image is available, install it with the current CLI
package syntax and create a named AVD before running the pass below.

Run on at least one compact phone and one expanded/tablet target after the
system image and AVD are available:

```powershell
pnpm --filter @nuttie/app android
adb devices
adb exec-out screencap -p > output/playwright/android-phone.png
adb shell cmd uimode night yes
adb shell settings put system font_scale 1.3
```

Restore the emulator appearance and font scale after the pass. Verify system
Back/predictive Back, edge-to-edge insets, keyboard avoidance, 48dp targets,
offline record creation, queue replay, account switching, and conflict text.
The screenshot must show the shared Living Growth Mark and semantic states,
not a platform-specific replacement.

## iOS Pass

Run on an iOS 17+ simulator and one real iPhone from macOS/Xcode. Capture with
the simulator UDID rather than a display name:

```bash
npx expo run:ios
xcrun simctl list devices booted
xcrun simctl io <UDID> screenshot output/playwright/ios-phone.png
xcrun simctl ui <UDID> appearance dark
```

Also run a large Dynamic Type size, VoiceOver focus order, lock/unlock, device
restart, rejected permissions, secure-store restoration, and local cache
deletion. A simulator result cannot replace the real-device evidence for
Keychain/secure storage, SQLCipher, camera, notifications, or release signing.

## Container and Zeabur Pass

Docker Desktop is not currently installed on this Windows host, so the optional
local Compose commands below cannot be executed here. No production container
was changed. The GitHub CI Docker jobs and Zeabur's remote build are the
executable image-build evidence for this environment; installing Docker later
can add local parity evidence but is not required to continue deployment.

With Docker installed, run:

```powershell
docker compose config --quiet
docker build --file Dockerfile.api --tag nuttie-api:check .
docker build --file Dockerfile.web --tag nuttie-web:check .
docker compose up --build -d
Invoke-WebRequest http://127.0.0.1:4187/healthz
Invoke-WebRequest http://127.0.0.1:8787/ready
docker compose down
```

The API must refuse production startup without a persistent `DATABASE_URL`, a
non-placeholder `ACCESS_TOKEN_SECRET` of at least 32 characters, and a valid
HTTPS `ALLOWED_ORIGINS` entry. The web service is the only public service;
PostgreSQL and API remain private. In Zeabur, apply the matching watch paths,
check migration logs, verify the public HTTPS cookie flow, and perform a
reviewed rollback before treating a deployment as accepted.

The checked-in `production-smoke.yml` workflow is a read-only post-deployment
gate. After the public Web origin is known, set the GitHub repository variable
`NUTTIE_WEB_URL` or supply the `web_url` input for a manual run. The check
requires `/healthz`, same-origin `/api/v1/ready`, `/sign-in`, and the expected
security headers; it does not create users or mutate production records.

## Release Stop Conditions

Do not call the release complete when any of the following is true:

- a design-system gate or canonical Web route fails;
- a hydration error, horizontal overflow, or inaccessible primary action is
  found at a required width or theme;
- an account switch, sign-out, deletion, or queued sync can display or persist
  another account's records;
- a native build has not exercised secure storage, system navigation, insets,
  Dynamic Type/font scale, and offline replay on the target platform;
- the remote CI/Zeabur image build, API/Web readiness, or the Zeabur
  private-network topology has not been verified (local Docker/Compose is
  optional and is not itself a stop condition);
- production secrets, origins, migrations, or rollback evidence are missing.

The current Windows result is therefore a code, contract, static export, and
representative browser result. It is not an Android/iOS store release, a
completed remote container deployment, or a Zeabur production acceptance. The
absence of a local Docker CLI is recorded as an external verification note,
not as a release blocker.
