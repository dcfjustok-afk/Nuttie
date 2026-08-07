import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(toolsDir, "..");
export const visualKitDir = path.join(workspaceDir, "prototypes", "nuttie-visual-kit");

const requiredMascots = ["mascot-home", "mascot-meal", "mascot-growth", "mascot-streak"];
const referencedMascots = ["mascot-home", "mascot-meal", "mascot-growth"];
const requiredSpots = ["spot-meal", "spot-water", "spot-weight", "spot-movement", "spot-barcode", "spot-ai-lens", "spot-trend-sprout", "spot-backup-lock", "spot-reminder"];
const referencedSpots = ["spot-meal", "spot-water", "spot-weight", "spot-movement", "spot-barcode", "spot-ai-lens", "spot-trend-sprout"];

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function assertCheck(condition, code, message, details = undefined) {
  if (!condition) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    throw error;
  }
}

export async function checkVisualKit(rootDir = visualKitDir) {
  const indexPath = path.join(rootDir, "index.html");
  const mascotPath = path.join(rootDir, "mascot-sheet.svg");
  const spotPath = path.join(rootDir, "spot-illustrations.svg");
  const tokenPath = path.join(rootDir, "design-tokens.json");
  const componentPath = path.join(rootDir, "components.html");
  const serverPath = path.join(rootDir, "server.mjs");
  const [html, svg, spots, tokensText, components, server] = await Promise.all([
    readFile(indexPath, "utf8"),
    readFile(mascotPath, "utf8"),
    readFile(spotPath, "utf8"),
    readFile(tokenPath, "utf8"),
    readFile(componentPath, "utf8"),
    readFile(serverPath, "utf8")
  ]);
  let tokens;
  try {
    tokens = JSON.parse(tokensText);
  } catch (error) {
    assertCheck(false, "TOKEN_JSON_INVALID", `design token JSON is invalid: ${error.message}`);
  }

  assertCheck(/<html\s+lang="zh-CN">/i.test(html), "HTML_LANGUAGE_MISSING", "visual kit must declare zh-CN");
  assertCheck(/<meta\s+charset="utf-8">/i.test(html), "HTML_CHARSET_MISSING", "visual kit must declare UTF-8");
  assertCheck(/<title>Nuttie visual concept<\/title>/i.test(html), "HTML_TITLE_MISSING", "visual kit title is missing");
  assertCheck(/<html lang="zh-CN">/.test(components), "COMPONENT_CATALOG_LANGUAGE_MISSING", "component catalog must declare zh-CN");
  assertCheck(/class="button primary"/.test(components), "COMPONENT_BUTTON_MISSING", "component catalog must include primary button");
  assertCheck(/class="alert info"/.test(components) && /class="alert warning"/.test(components) && /class="alert success"/.test(components), "COMPONENT_ALERT_STATES_MISSING", "component catalog must include alert states");
  assertCheck(/class="roles"/.test(components) && countMatches(components, /mascot-sheet\.svg#/g) >= 4, "COMPONENT_MASCOT_ROLES_MISSING", "component catalog must include four mascot roles");
  assertCheck(/--chestnut:#A85D3F|--chestnut:#a85d3f/.test(html), "TOKEN_CHESTNUT_MISSING", "brand chestnut token is missing");
  assertCheck(/--sprout:#3F7C59|--sprout:#3f7c59/.test(html), "TOKEN_SPROUT_MISSING", "sprout semantic token is missing");
  assertCheck(/--amber:#E2A34A|--amber:#e2a34a/.test(html), "TOKEN_AMBER_MISSING", "amber semantic token is missing");
  assertCheck(/--sky:#4E88A5|--sky:#4e88a5/.test(html), "TOKEN_SKY_MISSING", "sky semantic token is missing");
  assertCheck(/--radius-sm:10px/.test(html) && /--radius-md:16px/.test(html) && /--radius-lg:24px/.test(html), "RADIUS_SCALE_MISSING", "design system radius scale is missing");
  assertCheck(/button:disabled/.test(html) && /button:focus-visible/.test(html), "CONTROL_STATE_CONTRACT_MISSING", "interactive control states are missing");
  assertCheck(/data-active=\"true\"/.test(html) && /aria-pressed','true'/.test(html), "QUICK_ACTION_STATE_MISSING", "quick action completion state is missing");
  assertCheck(tokens.meta?.name === "Nuttie Design System", "TOKEN_META_MISSING", "design token metadata is missing");
  assertCheck(tokens.size?.controlMinimum >= 44, "CONTROL_SIZE_TOKEN_INVALID", "minimum control size must be at least 44px");
  assertCheck(tokens.component?.button?.height >= tokens.size.controlMinimum, "BUTTON_SIZE_TOKEN_INVALID", "button height must honor minimum control size");
  assertCheck(tokens.mascot?.home && tokens.mascot?.meal && tokens.mascot?.growth && tokens.mascot?.streak, "MASCOT_TOKEN_MAPPING_MISSING", "mascot semantic mapping is incomplete");
  assertCheck(countMatches(html, /class="frame"/g) === 3, "FRAME_COUNT_INVALID", "visual kit must contain three core screens");
  assertCheck(countMatches(html, /390 × 844/g) === 3, "PHONE_SIZE_LABEL_INVALID", "each core screen must declare 390 × 844");
  assertCheck(countMatches(html, /<svg\s+class="mascot"/g) === 3, "MASCOT_INSTANCE_COUNT_INVALID", "three core screens must render a mascot");
  assertCheck(countMatches(html, /aria-label="[^"]+卡通栗子"/g) === 3, "MASCOT_A11Y_LABEL_INVALID", "each mascot must have a Chinese accessible label");
  assertCheck(/min-height:44px/.test(html), "TOUCH_TARGET_CONTRACT_MISSING", "interactive controls must declare a 44px minimum height");
  assertCheck(countMatches(html, /<nav\s+class="bottom-nav"[^>]+aria-label="主要导航"/g) === 3, "NAV_A11Y_LABEL_INVALID", "each bottom navigation must have an accessible label");
  assertCheck(/role="progressbar"[^>]+aria-valuenow="68"/.test(html), "PROGRESS_A11Y_MISSING", "progress meter must expose its value");
  assertCheck(/class="bars"\s+role="img"\s+aria-label="[^"]+周一55%/.test(html), "CHART_A11Y_MISSING", "trend chart must expose a text summary");
  assertCheck(!/https?:\/\//i.test(html), "REMOTE_HTML_REFERENCE", "visual kit HTML must not load remote resources");

  for (const mascotId of requiredMascots) {
    assertCheck(new RegExp(`id="${mascotId}"`).test(svg), "MASCOT_VARIANT_MISSING", `SVG is missing ${mascotId}`);
  }
  for (const mascotId of referencedMascots) {
    assertCheck(new RegExp(`mascot-sheet\\.svg#${mascotId}`).test(html), "MASCOT_REFERENCE_MISSING", `HTML is missing ${mascotId} reference`);
  }
  for (const spotId of requiredSpots) {
    assertCheck(new RegExp(`id="${spotId}"`).test(spots), "SPOT_VARIANT_MISSING", `spot illustration sheet is missing ${spotId}`);
  }
  for (const spotId of referencedSpots) {
    assertCheck(new RegExp(`spot-illustrations\\.svg#${spotId}`).test(html), "SPOT_REFERENCE_MISSING", `HTML is missing ${spotId} reference`);
  }
  assertCheck(/role="img"/g.test(html), "MASCOT_ROLE_MISSING", "mascot SVG instances must expose an image role");
  assertCheck(/\.listen\(port,\s*["']127\.0\.0\.1["']/.test(server), "SERVER_NOT_LOOPBACK", "visual server must bind to loopback only");
  assertCheck(/startsWith\(`\$\{root\}\$\{path\.sep\}`\)/.test(server), "SERVER_PATH_GUARD_MISSING", "visual server must guard resolved paths");

  return {
    ok: true,
    rootDir,
    screens: 3,
    mascotVariants: requiredMascots,
    referencedMascots,
    spotIllustrations: requiredSpots,
    referencedSpots,
    remoteHtmlReferences: 0,
    accessibleMascots: 3,
    accessibleNavigations: 3,
    minimumTouchTarget: 44,
    tokenVersion: tokens.meta.version,
    tokenCategories: ["color", "space", "radius", "size", "type", "shadow", "motion", "component", "mascot"],
    componentCatalog: true,
    loopbackServer: true
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    console.log(JSON.stringify(await checkVisualKit(process.argv[2] || visualKitDir), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, code: error.code || "VISUAL_KIT_CHECK_FAILED", message: error.message, details: error.details }, null, 2));
    process.exitCode = 1;
  }
}
