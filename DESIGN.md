---
name: Nuttie Living Growth Mark
description: Calm, explainable daily records that become a visible picture of growth.
priority: P0
authority: Cross-platform implementation contract for Android, iOS, React Native Web, and mobile H5
colors:
  canvas: "#F4F0E8"
  surface: "#FFFDF8"
  surface-muted: "#F5EFE6"
  surface-raised: "#FFFFFF"
  border: "#E3DBCE"
  ink: "#252A26"
  ink-muted: "#5F6860"
  ink-subtle: "#7B837B"
  inverse: "#FFFFFF"
  chestnut: "#A85D3F"
  chestnut-dark: "#783F30"
  sprout: "#3F7C59"
  sprout-soft: "#E5F0E7"
  amber: "#E2A34A"
  amber-soft: "#FFF2D8"
  sky: "#4E88A5"
  sky-dark: "#28546B"
  sky-soft: "#E6F1F5"
  danger: "#B9574C"
  danger-soft: "#F8E6E2"
  scrim: "#14181575"
  dark-canvas: "#181D1A"
  dark-surface: "#222823"
  dark-surface-muted: "#2B332D"
  dark-surface-raised: "#303A32"
  dark-border: "#3B443D"
  dark-ink: "#F3F5F1"
  dark-ink-muted: "#B5C0B8"
  dark-ink-subtle: "#94A198"
  dark-chestnut: "#D58A68"
  dark-chestnut-dark: "#F0B49A"
  dark-sprout: "#80B58B"
  dark-sprout-soft: "#294532"
  dark-amber: "#F0C16B"
  dark-amber-soft: "#4A3920"
  dark-sky: "#7CB2C8"
  dark-sky-dark: "#B4D9E7"
  dark-sky-soft: "#203B45"
  dark-danger: "#E17B72"
  dark-danger-soft: "#4B2927"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "38px"
    letterSpacing: "normal"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "30px"
    letterSpacing: "normal"
  heading:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: "24px"
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
    letterSpacing: "normal"
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "normal"
rounded:
  compact: "10px"
  card: "16px"
  feature: "24px"
  round: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  section: "32px"
  page: "40px"
components:
  button-primary:
    backgroundColor: "{colors.chestnut}"
    textColor: "{colors.inverse}"
    typography: "{typography.body}"
    rounded: "{rounded.compact}"
    padding: "12px 16px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.chestnut}"
    typography: "{typography.label}"
    rounded: "{rounded.compact}"
    padding: "12px 16px"
    height: "44px"
  input-default:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.compact}"
    padding: "12px"
    height: "48px"
  navigation-active:
    backgroundColor: "{colors.sprout-soft}"
    textColor: "{colors.sprout}"
    typography: "{typography.label}"
    rounded: "{rounded.compact}"
    padding: "8px 12px"
    height: "44px"
  metric-band:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "16px"
  growth-mark:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.feature}"
    size: "178px"
    padding: "16px"
---

# Design System: Nuttie

## Overview

**Creative North Star: "Living Growth Mark"**

Nuttie treats a day as a living record rather than a score. The central mark is a bounded growth ring: the same geometry appears on sign-in, the diary, and trend review, while a small set of named states (`quiet`, `growing`, `complete`, `syncing`) explains what changed. A saved value remains a fact with its source and missingness visible; the mark gives that fact a gentle sense of continuity without judging the person behind it.

The visual world is warm, legible, and instrument-like. Chestnut carries the product action, sprout confirms progress, sky explains observation or sync, and amber calls attention without becoming an alarm. Paper-toned surfaces and hairline borders create depth through layering. The system is deliberately free of gradients, glow effects, decorative blobs, gamified streak pressure, and medical-looking status colors. It must feel at home in bright outdoor phone use and in a quiet, information-dense desktop review.

**Key Characteristics:**

- One deterministic growth mark, reused across routes and states.
- Semantic color pairs with a complete dark scheme; color never carries meaning alone.
- Native, system-first type with a compact Chinese-friendly scale and no non-zero tracking.
- Responsive structure: bottom navigation on phones, a rail and wider composition at 768px and above.
- Every record and sync state has a readable text explanation.

## Colors

The palette is a five-role field rather than a single brand wash: chestnut invites an action, sprout confirms forward motion, sky explains a connection or observation, amber requests attention, and neutrals hold facts still. Light and dark schemes preserve these roles while changing contrast and surface order.

### Primary

- **Chestnut action** (`{colors.chestnut}`): primary buttons, brand mark, and the default growth-ring progress.
- **Deep chestnut** (`{colors.chestnut-dark}`): high-contrast chestnut text or a pressed/active treatment when the surface permits it.

### Secondary

- **Sprout confirmation** (`{colors.sprout}`): completed growth, selected navigation, and positive confirmation.
- **Sky observation** (`{colors.sky}` / `{colors.sky-dark}`): trend context, sync affordances, and explanatory accents.
- **Amber attention** (`{colors.amber}`): pending work, incomplete information, and gentle reminders; never a warning by color alone.

### Tertiary

- **Danger correction** (`{colors.danger}`): destructive or recoverable errors, always paired with explicit text and an action.

### Neutral

- **Paper canvas** (`{colors.canvas}`): the page field on light surfaces.
- **Quiet surface** (`{colors.surface}`) and **muted surface** (`{colors.surface-muted}`): content planes and secondary bands.
- **Raised surface** (`{colors.surface-raised}`): transient or especially important content that needs one step above the page.
- **Hairline border** (`{colors.border}`): structure and separation without a heavy grid.
- **Ink** (`{colors.ink}`), **muted ink** (`{colors.ink-muted}`), and **subtle ink** (`{colors.ink-subtle}`): primary facts, supporting explanations, and metadata.

### Named Rules

**The Meaning-Before-Color Rule.** Every state that matters must be named in text or structure; an accent is a reinforcement, never the only signal.

**The Rare-Chestnut Rule.** Chestnut is reserved for the next useful action and the identity mark. It does not flood a screen or become a decorative background.

## Typography

**Display Font:** platform system sans (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI` fallback)

**Body Font:** the same platform system sans stack, allowing iOS, Android, and React Native Web to use their native shaping and Chinese fallback.

**Character:** sturdy, friendly, and quiet. Weight and line height provide hierarchy; letter spacing stays normal so Simplified Chinese and Latin labels retain their natural rhythm.

### Hierarchy

- **Display** (700, 32px, 38px): the strongest page statement or the central diary invitation; use sparingly.
- **Title** (700, 24px, 30px): screen titles, dates, and the main value in an important summary.
- **Heading** (700, 18px, 24px): section names, metric labels with emphasis, and panel headings.
- **Body** (400, 15px, 22px): instructions, explanatory copy, and record detail. Keep paragraphs short enough to scan on a 320px viewport.
- **Label** (600, 13px, 18px): buttons, tabs, field labels, and navigation names.
- **Caption** (500, 12px, 16px): provenance, units, sync state, and supporting metadata.

### Named Rules

**The Native-Scale Rule.** Do not substitute a web-only type scale for the native client. Respect platform text enlargement and allow long Chinese labels to wrap rather than clipping or shrinking into illegibility.

## Layout

Nuttie uses a single information architecture with size-class-driven composition. The reference phone is 390x844, but the narrow contract starts at 320px. At widths below 600px, forms and metric groups use one column with vertical scrolling; at 600px and above, related fields may share a two-column row when each field retains a usable minimum width. At 768px and above, navigation becomes a 232px rail, the content receives 24px side breathing room, and the hero can place the growth mark beside its copy. The content column remains capped at 1200px and centers on 1024px+ windows instead of stretching every line. The add-record sheet is bottom anchored on phones and centered with a maximum width of 600px on larger windows. Landscape and split-screen are treated as width changes, not special device models.

Use the spacing rhythm `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40px`. Keep stable dimensions for controls, marks, navigation items, metric cells, and chart tracks so labels and state changes do not move the surrounding layout. Reserve bottom space for the phone navigation bar and safe-area insets.

## Elevation & Depth

The system is flat by default. Tonal layering (`canvas` -> `surface-muted` -> `surface` -> `surface-raised`) and hairline borders do most of the structural work; shadows are quiet and reserved for a feature surface or a transient sheet. The growth mark is ink and calibrated arcs, never a glowing badge. A modal scrim communicates focus through contrast and containment, not a stack of floating cards.

### Shadow Vocabulary

- **Ambient small:** `0 3px 10px rgba(64,48,33,0.08)` in light mode (darkened appropriately in dark mode), for a raised feature surface only.
- **Feature lift:** `0 12px 22px rgba(64,48,33,0.12)` in light mode, for a centered sheet or clearly elevated focal surface; avoid applying it to every list row.

### Named Rules

**The Flat-By-Default Rule.** If a border, tonal surface, or spacing change communicates the relationship, do not add a shadow. Elevation must explain a state or a layer, never decorate an otherwise empty panel.

## Shapes

The silhouette is soft but measured: 10px for controls and compact rows, 16px for content cards and metric bands, 24px for the growth hero and large sheets, and a full pill only for a compact status badge. Borders are hairline wherever platform rendering supports them. Icons sit in stable 40-44px containers, while all interactive targets are at least 44px high. Corners do not become a substitute for hierarchy; avoid nesting rounded cards inside rounded cards unless the inner element is an actionable repeated item.

## Components

### Buttons

- **Shape:** 10px compact radius; minimum height 44px, default control height 48px.
- **Primary:** chestnut fill with inverse text, a clear verb, and an icon when the icon adds recognition. Use for one next action such as `新增` or `保存记录`.
- **Hover / Focus / Pressed:** lower opacity or adjust tonal emphasis without changing layout; web focus must remain visibly outlined and native keyboard activation must work.
- **Secondary / Ghost:** surface or transparent background with chestnut text or a hairline border. Text-only actions are reserved for low-risk alternatives and links.

### Chips

- **Style:** full-pill radius, muted surface at rest, semantic tint when selected, and a text label that remains readable without the tint.
- **State:** use `aria-pressed`/selected semantics on web and equivalent accessibility state on native. Chips filter or choose; they do not masquerade as navigation cards.

### Cards / Containers

- **Corner style:** 16px for metric and insight panels; 10px for rows and compact notices; 24px for the diary hero and large sheet.
- **Background:** surface for records and primary content, muted surface for summaries and context bands.
- **Shadow strategy:** flat at rest; use the documented feature lift only for a focal sheet or transient layer.
- **Border:** hairline border in the semantic border color; do not build a dense one-pixel grid over the whole page.
- **Internal padding:** 12px for rows, 16px for cards, and 20-24px for a focal surface.

### Inputs / Fields

- **Style:** 48px control height, 10px radius, muted surface fill, hairline border, 12px horizontal padding, and body text.
- **Focus:** a platform-visible focus ring or border contrast change that does not rely on color alone; keep the label and error relationship intact.
- **Error / Disabled:** show an adjacent readable message and preserve entered values; use danger tint only as reinforcement.

### Navigation

- **Phone:** a 64px bottom bar with four stable destinations: 日记, 趋势, 食品资料, 设置. Each item has an icon and label, a 44px minimum target, and a selected state.
- **Expanded:** a 232px left rail with the Nuttie mark, the same destinations, and a small brand line. The content topology changes to support review; it does not become a stretched phone screen.
- **State:** selected navigation uses sprout plus a tinted surface; inactive destinations use muted ink. The route remains understandable from text and accessibility state.

### GrowthMark

The signature component is a deterministic circular progress ring with a leaf-shaped inner mark, percentage text, and a state label. Progress is clamped to 0-100%; `quiet`, `growing`, `complete`, and `syncing` map to different semantic accents without changing the component's identity. The same seed and geometry should survive route changes and refreshes; status changes may alter the arc and copy, never the user's saved records.

### MetricBand

Metric bands pair a short color marker with a label, value, unit, and provenance hint. Missing nutrition remains `未提供` rather than becoming zero. Four bands can wrap on expanded windows while retaining a minimum width; on phones they stack for reliable scanning.

### RecordRow

Rows keep the record icon, title, source/time subtitle, amount, unit, and sync state in one readable line or controlled wrap. Pending and conflict states have explicit text (`待同步`, `需处理`) and never rely on a color dot alone.

### AddRecordSheet

The sheet is a task surface, not a decorative dialog. It exposes meal, water, and weight as a segmented choice, keeps the form scrollable above the keyboard, validates non-negative numbers, and retains the draft on failure. On large screens it centers within 600px; on narrow screens it uses a full-width bottom sheet with safe-area padding.

## Do's and Don'ts

### Do:

- **Do** make the first viewport prove the record-to-growth relationship: the mark, today's facts, and one reachable add action appear before secondary history.
- **Do** keep the same semantic colors and state vocabulary across native and Web, then adapt navigation and density by size class.
- **Do** label synthetic/demo values, provenance, missing fields, pending sync, and revision conflicts in plain text.
- **Do** test 320px, 390px, 430px, 768px, 1024px, and 1440px widths, including landscape, long Chinese labels, keyboard focus, and dark mode.
- **Do** keep every control keyboard- and screen-reader-usable on Web and at least 44px on touch surfaces.
- **Do** use Lucide icons consistently inside controls and pair unfamiliar icons with accessible labels or visible text.

### Don't:

- **Don't** use gradients, glow, bokeh, decorative blobs, or a one-hue dashboard treatment as a substitute for authored hierarchy.
- **Don't** turn the growth mark into a score, streak punishment, medical conclusion, or random animation; its states must be bounded and explainable.
- **Don't** hide a primary action in a hover-only affordance, a gesture-only expansion, or a control smaller than 44px.
- **Don't** let a card's color be the only indicator of error, missingness, sync, or completion.
- **Don't** stretch the phone layout across a tablet or desktop; switch to the rail, wider hero, and two-pane review composition at the size-class threshold.
- **Don't** replace `未提供` with `0`, silently overwrite a revision conflict, or show AI output as a confirmed record.
- **Don't** place access tokens, refresh tokens, AI keys, or raw AI payloads in visual state, ordinary Web storage, or synchronized records.
