/**
 * Shared, build-visible contract for the Expo Web export.
 *
 * Keep this module free of filesystem or browser dependencies so both the
 * export patcher and the static verifier can use exactly the same bytes.
 */

export const WEB_DIRECTION_SEED = "c041ebe0";

export const WEB_DIRECTION_CONTRACT_LINES = Object.freeze([
  "THESIS: Living Growth Mark makes small daily records visible as explainable continuity; it refuses health-dashboard hero and score-first card grid.",
  "OWN-WORLD: Chestnut action, sprout confirmation, sky observation, amber attention, paper surfaces, hairlines, native system type, and deterministic calibrated growth ring with a leaf.",
  "STORY: The visitor sees facts without judgment, chooses one useful next action, and knows whether changes are local, pending, or synced.",
  "FIRST VIEWPORT: On phones, date and sync sit above the growth mark, today's ledger, and `新增`; metrics and recent records follow vertically. At 768px+, a 232px rail and centered column place the mark beside the ledger.",
  `FORM: Code-led Living Growth Mark, first in the direction roll; seed ${WEB_DIRECTION_SEED}. The bounded ring changes state deterministically; width changes topology, never a stretched phone.`,
  "FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance",
]);

export const WEB_DIRECTION_CONTRACT_COMMENT = `<!--\n${WEB_DIRECTION_CONTRACT_LINES.join("\n")}\n-->`;

/** Canonical routes that must have a static HTML entry after Expo export. */
export const EXPECTED_PRERENDERED_ROUTES = Object.freeze({
  "/": "index.html",
  "/diary": "diary.html",
  "/trends": "trends.html",
  "/food": "food.html",
  "/settings": "settings.html",
  "/sign-in": "sign-in.html",
});

export const WEB_FAVICON_FILE = "favicon.svg";
