# Nuttie Web Surface Direction Contract

状态：`CODE_LED / IMPLEMENTATION_BASELINE`

适用范围：Expo + React Native Web 的移动 H5 及其响应式扩展，包括 `/diary`、`/trends`、`/food`、`/settings` 和 `/sign-in`。本合同承接 [Living Growth Mark 方向轮](cross-platform-direction-round.json)，并与根目录 [DESIGN.md](../../DESIGN.md) 的语义 tokens 配套使用。

## Decision Record

| 字段               | 决定                                                                |
| ------------------ | ------------------------------------------------------------------- |
| 方向               | Living Growth Mark                                                  |
| direction seed     | `c041ebe0`                                                          |
| build path         | `code-led`                                                          |
| surface mode       | `Operate`                                                           |
| primary route      | `route:/diary`                                                      |
| related routes     | `route:/trends`, `route:/food`, `route:/settings`, `route:/sign-in` |
| reference viewport | 390 x 844；同时验收 320、430、768、1024、1440 及横屏                |

## Contract For The Emitted Document

这段 HTML 注释必须作为 Web 构建产物 `<body>` 的首个 child，位于 Expo mount node 之前。它是每次 finish review 的方向基线；不得只放在 TypeScript frontmatter、子组件或被编译器移除的 slot 内。

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

## What The Surface Owns

### Thesis

The first viewport makes continuity tangible: a deterministic growth ring turns today's small facts into a state the visitor can understand without being scored. The page refuses a generic “hero plus card dashboard” arrangement, decorative progress gamification, and any visual treatment that hides provenance or missingness.

### Own-world

The visual world is recognizable with its content removed: chestnut is reserved for the next useful action; sprout confirms completion; sky explains observation and sync; amber marks pending or incomplete work; paper-toned surfaces and hairlines establish a quiet field. The leaf mark and calibrated arcs are flat ink, not a glow, gradient, or stock illustration. System sans type preserves native shaping and Simplified Chinese wrapping. The same semantic grammar crosses native and Web while navigation changes vocabulary by size class.

### Story

The visitor arrives in a factual “today” context, sees what is known and what is still missing, takes one small recording action, and receives explicit local/pending/synced feedback. A demo session is visibly local; an authenticated session can continue on another device. Trends explain rather than diagnose, and food rows keep source/version next to the value.

### First viewport

At 320-599px: date and sync status occupy the top line; the growth mark and invitation follow; `今日账本` places `新增` beside the section heading; four metrics, the macro snapshot, and recent records continue in a single vertical scan. At 600-767px, only fields with a safe minimum width share a row. At 768px+, a 232px rail and centered max-1200 content region appear; the hero places the mark beside its copy and metric cells wrap. At 1024px+, the content remains bounded for reading instead of stretching into a dashboard wall. The primary action is always a reachable labeled button, never hover-only or gesture-only.

### Form

The chosen form is **Living Growth Mark**, position 1 in the direction roll, assigned by seed `c041ebe0`. Its signature interaction is a bounded progress arc whose state (`quiet`, `growing`, `complete`, `syncing`) changes deterministically; refresh cannot randomize identity. The supporting form language is a measured ledger: rows, metric bands, and one task sheet that folds by viewport rather than by hidden gesture. The phone bottom bar becomes a labeled rail at 768px+, preserving destinations and accessibility semantics.

### Finish

The emitted contract must survive `expo export --platform web --output-dir dist`; the built HTML must contain the seed and the comment as the first body child. Finish review requires screenshots for 320, 390, 430, 768, 1024, and 1440 widths plus a landscape case, console/network/overflow checks, dark-mode and long-Chinese checks, and a fresh reviewer verdict. Root `DESIGN.md` and every shipped raster's provenance must be present before the run is considered complete.

## Implementation Invariants

- Keep the growth mark geometry and state vocabulary stable across all routes and color schemes.
- Keep touch targets at least 44px and expose keyboard and screen-reader equivalents on Web.
- Keep `0`, `未提供`, `未记录`, `待同步`, and `需处理` semantically distinct and visible in text.
- Keep offline writes local and observable; never silently overwrite a revision conflict.
- Keep access/refresh tokens, AI keys, and raw AI payloads out of ordinary Web storage, visual state, and synchronized records.
- Prefer width/size classes over device-model checks; never ship a stretched phone layout on expanded screens.

## Build Verification

From the repository root, after a clean Web export:

```powershell
corepack pnpm@11.18.0 --filter @nuttie/app export:web
rg -l "c041ebe0" apps\app\dist
rg -n "THESIS:|OWN-WORLD:|STORY:|FIRST VIEWPORT:|FORM:|FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance" apps\app\dist
```

The first command must finish without an unresolved Metro process. The two `rg` checks must each return at least one generated HTML file. If either check fails, the build is not reviewable; fix the root layout or export injection before taking screenshots.

The ignored machine-local copy at `.impeccable/surfaces/route-diary.md` carries the same route mapping for Impeccable context loading. This tracked contract is authoritative for source review and handoff.
