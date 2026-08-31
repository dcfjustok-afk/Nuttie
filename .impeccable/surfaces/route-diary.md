---
version: 1
slug: "route-diary"
primary_target: "route:/diary"
related_targets:
  ["route:/trends", "route:/food", "route:/settings", "route:/sign-in"]
---

# Nuttie Web Surface Brief

## Scope and mode

This brief covers the shared Expo Web surface for the diary route and its sibling routes. The mode is **Operate**: a person is here to record a fact in seconds, understand the current day, and continue on another device when signed in. The phone-sized H5 is the primary scene; tablet, split-screen, landscape, and desktop are the same information architecture opened for review.

## Audience, job, and proof

The visitor is a daily record keeper on a narrow or interrupted connection, often using one hand. Their job is to see what is known today and add one meal, water, or weight record without waiting for a perfect plan. The first screen proves the product-specific promise by showing the deterministic growth mark beside today's factual ledger, a reachable `新增` action, and an honest sync/local status. Demo values remain labeled as sample data; missing nutrition remains `未提供`.

## Direction contract

The following comment is the source contract for the emitted Web document. It must be the first child of `<body>` in the root HTML layout, before the Expo mount node or any slotted content.

```html
<!--
THESIS: Living Growth Mark makes small daily records visible as explainable continuity; it refuses health-dashboard hero and score-first card grid.
OWN-WORLD: Chestnut action, sprout confirmation, sky observation, amber attention, paper surfaces, hairlines, native system type, and deterministic calibrated growth ring with a leaf.
STORY: The visitor sees facts without judgment, chooses one useful next action, and knows whether changes are local, pending, or synced.
FIRST VIEWPORT: On phones, date and sync sit above the growth mark, today's ledger, and `新增`; metrics and recent records follow vertically. At 768px+, a 232px rail and centered column place the mark beside the ledger.
FORM: Code-led Living Growth Mark, first in the direction roll; seed c041ebe0. The bounded ring changes state deterministically; width changes topology, never a stretched phone.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->
```

The contract is intentionally short enough to survive a production build. Keep the labels and the seed unchanged when the Web entry point is moved or regenerated.

## First-viewport composition

At 320-599px, the composition reads top to bottom: current date and sync badge; the growth mark and its one-sentence invitation; `今日账本` with the primary `新增` action; four fact bands; the macro snapshot; then recent records. Nothing essential depends on horizontal scrolling or hover. At 600-767px, related form fields may share a row while the diary remains a single reading column. At 768px and above, the rail becomes persistent, the hero is a mark-plus-copy row, and metric bands wrap with a stable minimum width. At 1024px and wider, the column is centered and capped so the ledger remains scannable rather than becoming a stretched dashboard.

## Signature interaction and states

`GrowthMark` changes only through bounded progress and named states: `quiet`, `growing`, `complete`, and `syncing`. A state transition may animate the arc or tint within the documented motion budget, but it never randomizes the mark or changes a saved record's identity. The add-record sheet is keyboard-safe and scrollable; it is bottom anchored on phones and centered at large widths. Offline writes stay visible in the local list, queue status is explicit, and a revision conflict is a repair task rather than a silent overwrite.

## Cross-route reach

The same semantic palette, type scale, state copy, and icon grammar continue through `/trends`, `/food`, `/settings`, and `/sign-in`. Navigation changes shape by width: a labeled bottom bar on phones and a labeled rail on expanded windows. Trends pair every chart with a text summary; food rows show source and version; settings keeps sync and data boundaries visible; sign-in makes local demo and authenticated sync distinct.

## Constraints and open decisions

- Preserve Simplified Chinese copy, non-medical language, and the distinction between `0`, `未提供`, and `未记录`.
- Keep touch targets at least 44px and expose equivalent keyboard and screen-reader paths on Web.
- Do not add gradients, decorative blobs, gamified scores, remote image dependencies, or AI claims to this surface.
- Do not put access/refresh tokens, AI keys, or raw AI payloads in Web storage or visual state.
- This brief does not settle future health integrations, analytics, reminders, or AI proxy behavior; those remain outside the first cross-platform slice.

## Web build check

After `expo export --platform web --output-dir dist`, inspect every generated HTML entry and assert that the first element child of `<body>` is the contract comment (the Expo mount node must come after it). Then grep the output for `c041ebe0`. A build that omits the comment or seed is not reviewable and must be fixed before screenshots or a finish review.

Suggested local checks:

```powershell
rg -l "c041ebe0" apps\app\dist
rg -n "THESIS:|OWN-WORLD:|STORY:|FIRST VIEWPORT:|FORM:|FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance" apps\app\dist
```
