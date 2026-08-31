# Nuttie Cross-Platform Design System Implementation

Status: `P0 / IMPLEMENTATION_AUTHORITY`

This document turns the Nuttie visual contract into an executable ownership map. Android, iOS, React Native Web, and mobile H5 share one system. A platform may change navigation hosting, input affordances, safe-area handling, and density by size class; it may not create a new visual language or state vocabulary.

## Authority chain

1. `DESIGN.md` defines the brand character, Living Growth Mark, color roles, typography, shape, motion, and content meaning.
2. `packages/design-tokens/src/index.ts` is the only source of executable values. Its build output is consumed by every client package.
3. `packages/ui/src` owns visual primitives such as `GrowthMark`; app routes only compose primitives and provide product data.
4. `apps/app` owns routing, data state, platform adapters, and screen composition. It must not define page-local colors, type sizes, spacing, radii, breakpoints, or component geometry.
5. `tools/verify-design-system.mjs` is a release gate and scans the app and shared UI sources for token bypasses.

## Brand and meaning

The four shared roles are `home`, `meal`, `growth`, and `streak`. The signature visual is the deterministic Living Growth Mark: a bounded ring, leaf geometry, percentage, and named state. `quiet`, `growing`, `complete`, `syncing`, `pending`, and `conflict` keep the same meaning on every platform. Color reinforces a state; text or structure always explains it.

The semantic color field is deliberately multi-role:

- `chestnut`: identity and the next useful action.
- `sprout`: confirmation and selected navigation.
- `sky`: observation and synchronization context.
- `amber`: incomplete or waiting information.
- `danger`: correction, deletion, and recoverable errors.
- `canvas`, `surface`, `surfaceMuted`, `surfaceRaised`, `border`, `ink`, and `track`: neutral information structure.
- `scrim`: focus containment for modal and sheet layers; it is theme-aware and never written inline.

## Executable token groups

| Token group                    | Owns                                                                                                            | Cross-platform rule                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `colors` / `getSemanticColors` | Light/dark semantic roles, including scrim and chart track                                                      | Routes select a scheme; they never copy a hex value                    |
| `typeScale` / `fontFamilies`   | Display, title, heading, body, label, caption and system font fallback                                          | Native text enlargement and Chinese wrapping remain possible           |
| `spacing` / `radii`            | The `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40` rhythm and measured silhouettes                                       | No page-level numeric spacing or radius                                |
| `dimensions` / `breakpoints`   | Touch targets, controls, rail, content caps and size classes                                                    | Branch by `compact`, `regular`, `expanded`, `wide`, never device model |
| `componentTokens`              | Brand mark, navigation, record row, metric band, sheet, modal, chart, food row, sign-in and GrowthMark geometry | Add a token before adding a new visual constant                        |
| `motion` / `layers`            | Duration/easing intent and base/navigation/scrim/sheet/toast order                                              | Reduced motion removes travel, never state or feedback                 |

## Size-class contract

| Size class | Width        | Required structure                                                                   |
| ---------- | ------------ | ------------------------------------------------------------------------------------ |
| `compact`  | `< 600px`    | One column, bottom navigation, bottom-anchored sheet, safe-area padding              |
| `regular`  | `600-767px`  | One column by default; related fields may become two columns when readable           |
| `expanded` | `768-1023px` | 232px rail, wider hero with mark beside copy, review-oriented spacing                |
| `wide`     | `>= 1024px`  | Centered content capped at 1200px; denser review without stretched phone composition |

Web static rendering and hydration use a deterministic `compact`/light first frame. The mounted client then reads viewport and color scheme. Native clients can read platform dimensions immediately but still consume the same tokens and size-class function.

## Component acceptance

Every shared component must expose default, pressed/focus, disabled, error, empty, loading/syncing, and long-copy states. Interactive targets are at least 44px. Web controls expose keyboard focus and semantic roles; native controls expose equivalent accessibility labels and state. Charts provide a text summary, and pending/conflict/missing values are written in text instead of implied by color.

The minimum visual matrix is 320, 390, 430, 600, 768, 1024, and 1440px; dark mode; landscape; 200% text size where supported; reduced motion; keyboard focus; and long Simplified Chinese labels. A screenshot or automated assertion is required for any visual system change.

## Change protocol

1. Write the intended semantic role or component geometry into `DESIGN.md` or this contract.
2. Add or adjust the token in `packages/design-tokens/src/index.ts`.
3. Update the shared primitive or platform adapter; do not create a second token or visual constant in a route.
4. Extend `tools/verify-design-system.mjs` and the relevant cross-platform test/screenshot.
5. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` before an atomic commit.

No design change is complete until all four client targets can consume the same token source and the release gate passes.
