# Nuttie Cross-Platform Release Readiness

Status: `CODE_AND_WEB_VERIFIED / EXTERNAL_TARGETS_PENDING`

This is the release evidence boundary for the shared Android, iOS, React
Native Web, and mobile H5 product. A green local check proves only the scope
named by that check. It must not be reported as a native device, container, or
production deployment result.

## Evidence Matrix

| Surface              | Required evidence                                                                                                   | Current state on Windows                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Shared design system | `pnpm test`, `pnpm typecheck`, `pnpm build`, design gate                                                            | Passed                                                                |
| Static Web/H5        | 13-route export contract and Playwright at 320/390/430/600/768/1024/1440px, light/dark                              | Export passed; representative 320/390/430/768/1024/1440 browser pass  |
| Web authentication   | Browser refresh cookie, same-origin `/api`, login, sign-out, export, delete                                         | API contract tests passed; live browser used mocked 401 API responses |
| Android              | Expo/React Native bundle, emulator/device install, system Back, insets, dark mode, font scale, offline queue        | SDK/API 35/ADB/emulator/WHPX ready at `D:\android-sdk`; system image and emulator run pending |
| iOS                  | Development build, simulator/device install, Keychain/secure storage, safe area, Dynamic Type, VoiceOver, dark mode | Not run: macOS/Xcode unavailable                                      |
| Docker/Compose       | `docker compose config`, API/Web image builds, `/ready` and `/healthz` probes                                       | Not run: Docker CLI unavailable; Docker Desktop install attempt blocked in `winget` |
| Zeabur               | Private API/PostgreSQL network, public Web gateway, HTTPS cookie flow, migration and rollback check                 | Not deployed; production mutation is intentionally out of scope       |

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

Use the checked-in Web export behind a local server. At every required width:

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

Docker Desktop is not currently installed on this Windows host. A silent
`winget install Docker.DockerDesktop` attempt remained in the package manager
without creating Docker files and was terminated after the bounded wait; no
Docker service or production container was changed. The GitHub CI Docker job
remains the executable image-build evidence until Docker Desktop or another
local engine is available.

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

## Release Stop Conditions

Do not call the release complete when any of the following is true:

- a design-system gate or canonical Web route fails;
- a hydration error, horizontal overflow, or inaccessible primary action is
  found at a required width or theme;
- an account switch, sign-out, deletion, or queued sync can display or persist
  another account's records;
- a native build has not exercised secure storage, system navigation, insets,
  Dynamic Type/font scale, and offline replay on the target platform;
- Docker/Compose readiness or the Zeabur private-network topology has not been
  verified;
- production secrets, origins, migrations, or rollback evidence are missing.

The current Windows result is therefore a code, contract, static export, and
representative browser result. It is not an Android/iOS store release, a
Docker deployment, or a Zeabur production acceptance.
