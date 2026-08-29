# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

delegated: Expo + React Native for iOS, Android, and React Native Web; a TypeScript API service with PostgreSQL; pnpm workspaces keep contracts and domain rules shared across clients.

## Users

Nuttie is for people who want a calm, non-judgmental way to record meals, nutrition, weight, hydration, movement, and personal goals across the devices they actually use. The primary scene is a short mobile check-in during the day; the secondary scene is a larger-screen review of patterns and history.

## Product Purpose

Nuttie (栗子自律) turns small, repeatable health-recording actions into a trustworthy daily picture. Users can record what happened, understand recent patterns, and continue on another device without rebuilding their history. Nuttie is not a medical device and does not provide diagnosis, treatment, or nutrition prescriptions.

## Positioning

Nuttie combines a low-friction, local-first capture flow with an explicit cloud sync model: recording remains usable during an outage, while the user can sign in and carry the same personal history between iOS, Android, and mobile web. Every synced change has an origin, revision, and conflict outcome that can be inspected rather than silently overwritten.

## Operating Context

- Phone-first capture on iOS, Android, and mobile H5, including narrow 320px screens, notched devices, landscape phones, tablets, and large desktop browser windows.
- A signed-in user may use multiple clients. A client keeps a local cache and an outbound mutation queue, then reconciles with the API when connectivity returns.
- Web uses same-origin `/api` requests behind the deployed web gateway. Native clients use an explicitly configured HTTPS API origin.
- Core records are entered manually in the first vertical slice. AI remains an optional, user-triggered draft workflow and never silently changes a saved record.

## Capabilities and Constraints

- Core domains: profile and goals, daily diary, meals and seven nutrition fields, weight, hydration, movement, reminders, seven-day trends, food catalog, and data export/delete controls.
- Authentication is required for cloud sync. Web sessions use secure, httpOnly refresh cookies; native sessions use platform secure storage. Access tokens are short-lived and never persisted in ordinary app data.
- PostgreSQL is the server source of truth for synced records. Each mutation carries an idempotency key, entity revision, device id, and client timestamp. Conflicts are returned explicitly; the client never hides a rejected write.
- The first release keeps a local cache and offline queue on every client. Queue replay is idempotent and can be retried without duplicating a meal or measurement.
- API keys, database keys, raw AI payloads, and other secrets are never synced. AI requests remain an explicit foreground action to the user-configured provider.
- HealthKit, Google Health Connect, remote push, ads, analytics, and paid membership are out of the first cross-platform slice. They require separate product and privacy decisions.
- Nutritional values are records with source, unit, and provenance. Missing or estimated values remain visible; the product must not present an invented medical certainty.

## Brand Commitments

- Product name: Nuttie / 栗子自律.
- Existing promise: “Small steps, solid growth.” / “积‘栗’前行，‘立’见更好的自己。”
- Preserve the existing chestnut, leaf, and growth vocabulary as source material while replacing the iOS-only visual treatment with a cross-platform system that works in bright outdoor mobile use and dense large-screen review.
- First shipping language is Simplified Chinese, with copy designed so later localization does not change information architecture.

## Evidence on Hand

- Product scope and safety evidence: `docs/02-product/scope-baseline.md`, `docs/03-design/experience-principles-and-jobs.md`, and the D-038/D-039/D-040 prototypes.
- Visual source material: `prototypes/nuttie-visual-kit/design-tokens.json`, `prototypes/nuttie-visual-kit/index.html`, and `nuttie-visual-system.png`.
- Deployment reference: `D:\github\Royal-Flush` (Docker multi-stage builds, Nginx same-origin API proxy, PostgreSQL, Zeabur service variables, and watch paths).
- No production user data, customer testimonials, or clinical efficacy evidence is available. UI must label demo values as sample data where appropriate.

## Product Principles

1. Capture should take seconds and never punish an incomplete day.
2. Offline work is durable; sync is observable and recoverable.
3. A saved value is user-owned and explainable, with provenance kept beside it.
4. Cross-platform means one information architecture with context-appropriate controls, not three divergent products.
5. AI can suggest; the user decides what becomes part of their history.

## Accessibility & Inclusion

- Touch targets are at least 44px on every platform, with keyboard equivalents on web.
- Layout and content remain usable at 320px width, 200% text zoom where the platform supports it, reduced motion, high contrast, and landscape orientation.
- Color never carries state alone. Form errors are announced in text, and every chart has a readable summary.
