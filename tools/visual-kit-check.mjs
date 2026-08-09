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
const expectedPatternIdentities = ["empty", "loading", "offline", "recovery", "consent", "destructive", "feedback", "permission", "celebration"];

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function classTokens(value = "") {
  return new Set(value.trim().split(/\s+/).filter(Boolean));
}

function parseAttributes(source) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function extractStartTags(html) {
  return [...html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)].map((match) => ({
    name: match[1].toLowerCase(),
    attributes: parseAttributes(match[2]),
    source: match[0],
    index: match.index
  }));
}

function extractPatternArticles(html) {
  return [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)]
    .map((match) => ({
      attributes: parseAttributes(match[1]),
      body: match[2],
      source: match[0]
    }))
    .filter((article) => classTokens(article.attributes.get("class")).has("pattern"));
}

function cssDeclarations(html, selector) {
  const escapedSelector = selector.replace(/[.*+?^()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "i"));
  if (!match) {
    return null;
  }
  const declarations = new Map();
  for (const item of match[1].split(";").map((value) => value.trim()).filter(Boolean)) {
    const separator = item.indexOf(":");
    if (separator > 0) {
      declarations.set(item.slice(0, separator).trim().toLowerCase(), item.slice(separator + 1).trim().toLowerCase());
    }
  }
  return declarations;
}

function referencesResolveWithin(article, value) {
  const references = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  const tags = extractStartTags(article.body);
  return references.length > 0 && references.every((reference) => tags.filter((tag) => tag.attributes.get("id") === reference).length === 1);
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
  const patternPath = path.join(rootDir, "patterns.html");
  const featurePath = path.join(rootDir, "feature-flows.html");
  const serverPath = path.join(rootDir, "server.mjs");
  const [html, svg, spots, tokensText, components, patterns, features, server] = await Promise.all([
    readFile(indexPath, "utf8"),
    readFile(mascotPath, "utf8"),
    readFile(spotPath, "utf8"),
    readFile(tokenPath, "utf8"),
    readFile(componentPath, "utf8"),
    readFile(patternPath, "utf8"),
    readFile(featurePath, "utf8"),
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
  assertCheck(/<button type="button" class="button primary">/.test(components), "COMPONENT_BUTTON_SEMANTICS_MISSING", "component catalog must include a native non-submitting primary button");
  assertCheck(/class="alert info"/.test(components) && /class="alert warning"/.test(components) && /class="alert success"/.test(components), "COMPONENT_ALERT_STATES_MISSING", "component catalog must include alert states");
  assertCheck(/class="roles"/.test(components) && countMatches(components, /mascot-sheet\.svg#/g) >= 4, "COMPONENT_MASCOT_ROLES_MISSING", "component catalog must include four mascot roles");
  assertCheck(/<input[^>]+name="foodName"[^>]*\stype="text"/.test(components) && /<input[^>]+name="servingAmount"[^>]*\stype="number"/.test(components) && !/class="field"[^>]+tabindex=/.test(components), "COMPONENT_NATIVE_INPUT_MISSING", "component fields must use named native inputs instead of focusable wrappers");
  assertCheck(/aria-invalid="true" aria-describedby="component-serving-error"/.test(components) && /id="component-serving-error"/.test(components), "COMPONENT_ERROR_ASSOCIATION_MISSING", "component field errors must be visibly and programmatically associated");
  assertCheck(countMatches(components, /<button type="button" aria-pressed=/g) === 3 && countMatches(components, /<button type="button" class="chip" aria-pressed=/g) === 3, "COMPONENT_SELECTION_SEMANTICS_MISSING", "segmented choices and chips must use stateful native buttons");
  assertCheck(/\.segment button\{min-height:44px/.test(components) && /\.chip\{min-height:44px/.test(components), "COMPONENT_TOUCH_TARGET_INVALID", "component selection controls must honor the 44px touch target");
  assertCheck(/data-component="progress" data-example-status="synthetic"/.test(components) && /食品数据包导入/.test(components) && !/今日进度/.test(components), "COMPONENT_PROGRESS_CONTRACT_INVALID", "component progress must be marked synthetic and must not imply an unapproved nutrition target");
  assertCheck(/CANDIDATE \/ CONCEPT/.test(components) && /不代表默认餐次、营养目标、公式结果、健康评分或健康建议/.test(components), "COMPONENT_CANDIDATE_NOTICE_MISSING", "component catalog must expose its candidate and synthetic-data boundary");
  assertCheck(/data-segment/.test(components) && /button\.chip/.test(components) && /setAttribute\("aria-pressed"/.test(components), "COMPONENT_INTERACTION_STATE_MISSING", "component selection examples must update their local pressed state");
  assertCheck(/<html lang="zh-CN">/.test(patterns), "PATTERN_CATALOG_LANGUAGE_MISSING", "system pattern catalog must declare zh-CN");
  const patternArticles = extractPatternArticles(patterns);
  const patternIdentities = patternArticles.map((article) => article.attributes.get("data-pattern"));
  assertCheck(
    patternArticles.length === expectedPatternIdentities.length
      && expectedPatternIdentities.every((identity) => patternIdentities.filter((value) => value === identity).length === 1)
      && patternIdentities.every((identity) => expectedPatternIdentities.includes(identity)),
    "PATTERN_IDENTITY_SET_INVALID",
    "system pattern catalog must expose each stable pattern identity exactly once",
    patternIdentities
  );
  const patternByIdentity = new Map(patternArticles.map((article) => [article.attributes.get("data-pattern"), article]));
  for (const article of patternArticles) {
    const headingId = article.attributes.get("aria-labelledby");
    const heading = extractStartTags(article.body).find((tag) => tag.attributes.get("id") === headingId);
    assertCheck(
      referencesResolveWithin(article, headingId) && /^h[1-6]$/.test(heading?.name ?? ""),
      "PATTERN_HEADING_SEMANTICS_MISSING",
      `pattern ${article.attributes.get("data-pattern")} must reference its own heading`
    );
  }

  const screenDeclarations = cssDeclarations(patterns, ".screen");
  const scrimDeclarations = cssDeclarations(patterns, ".scrim");
  const sheetDeclarations = cssDeclarations(patterns, ".sheet");
  const sheetMaxHeight = sheetDeclarations?.get("max-height");
  assertCheck(
    screenDeclarations?.get("min-height") === "0"
      && screenDeclarations?.get("overflow-y") === "auto"
      && scrimDeclarations?.get("overflow-y") === "auto"
      && sheetDeclarations?.get("overflow-y") === "auto"
      && Boolean(sheetMaxHeight)
      && sheetMaxHeight !== "none",
    "PATTERN_SCROLL_CONTRACT_MISSING",
    "pattern screens and sheets must preserve internal vertical scrolling"
  );

  const patternTags = extractStartTags(patterns);
  const patternIds = patternTags.map((tag) => tag.attributes.get("id")).filter(Boolean);
  assertCheck(new Set(patternIds).size === patternIds.length, "DIALOG_ASSOCIATION_INVALID", "pattern element IDs must be globally unique");
  const dialogContracts = [
    { identity: "consent", role: "dialog" },
    { identity: "destructive", role: "alertdialog" }
  ];
  for (const contract of dialogContracts) {
    const article = patternByIdentity.get(contract.identity);
    const articleTags = extractStartTags(article.body);
    const dialogs = articleTags.filter((tag) => tag.attributes.get("role") === contract.role);
    assertCheck(dialogs.length === 1, "DIALOG_SEMANTICS_MISSING", `${contract.identity} must expose one ${contract.role}`);
    const dialog = dialogs[0];
    assertCheck(!dialog.attributes.has("aria-modal"), "STATIC_MODAL_SEMANTICS_INVALID", "always-visible catalog sheets must not claim modal behavior");
    assertCheck(
      referencesResolveWithin(article, dialog.attributes.get("aria-labelledby"))
        && referencesResolveWithin(article, dialog.attributes.get("aria-describedby")),
      "DIALOG_ASSOCIATION_INVALID",
      `${contract.identity} dialog must reference labels and descriptions inside its own pattern`
    );
    const labelId = dialog.attributes.get("aria-labelledby").trim().split(/\s+/)[0];
    const labelTarget = articleTags.find((tag) => tag.attributes.get("id") === labelId);
    assertCheck(/^h[1-6]$/.test(labelTarget?.name ?? ""), "DIALOG_ASSOCIATION_INVALID", `${contract.identity} dialog label must be a heading`);

    const initialFocusId = dialog.attributes.get("data-initial-focus");
    const initialFocusTarget = articleTags.find((tag) => tag.attributes.get("id") === initialFocusId);
    assertCheck(
      initialFocusTarget?.name === "button"
        && initialFocusTarget.attributes.get("type") === "button"
        && initialFocusTarget.attributes.has("data-safe-default")
        && !initialFocusTarget.attributes.has("disabled"),
      contract.identity === "destructive" ? "DESTRUCTIVE_DEFAULT_FOCUS_UNSAFE" : "DIALOG_ASSOCIATION_INVALID",
      `${contract.identity} initial focus must reference an enabled safe button`
    );
    if (contract.identity === "destructive") {
      const initialClasses = classTokens(initialFocusTarget.attributes.get("class"));
      assertCheck(
        !initialClasses.has("danger") && initialFocusTarget.attributes.get("data-action") !== "confirm-destructive",
        "DESTRUCTIVE_DEFAULT_FOCUS_UNSAFE",
        "destructive confirmation must not receive initial focus"
      );
      const dangerousButtons = articleTags.filter((tag) => tag.name === "button" && classTokens(tag.attributes.get("class")).has("danger"));
      assertCheck(
        dangerousButtons.every((tag) => !tag.attributes.has("autofocus") && !tag.attributes.has("data-safe-default") && tag.attributes.get("id") !== initialFocusId),
        "DESTRUCTIVE_DEFAULT_FOCUS_UNSAFE",
        "dangerous buttons must never be marked as the safe default"
      );
    }
  }

  const buttonClassElements = patternTags.filter((tag) => classTokens(tag.attributes.get("class")).has("button"));
  const nativeButtons = patternTags.filter((tag) => tag.name === "button");
  assertCheck(
    buttonClassElements.every((tag) => tag.name === "button" && tag.attributes.get("type") === "button")
      && nativeButtons.every((tag) => tag.attributes.get("type") === "button")
      && patternTags.every((tag) => tag.attributes.get("role") !== "button"),
    "PATTERN_BUTTON_SEMANTICS_INVALID",
    "pattern actions must use native non-submitting buttons"
  );

  const undoLabel = "撤销";
  const interactiveUndo = [...patterns.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)].some((match) => {
    const attributes = parseAttributes(match[2]);
    const label = match[3].replace(/<[^>]*>/g, "").trim();
    return label === undoLabel || attributes.get("data-action") === "undo" || classTokens(attributes.get("class")).has("undo");
  });
  const feedbackPattern = patternByIdentity.get("feedback");
  const fakeUndo = new RegExp(`<(?:strong|span)\\b[^>]*>\\s*${undoLabel}\\s*<\\/(?:strong|span)>`, "i").test(feedbackPattern.body);
  assertCheck(!interactiveUndo && !fakeUndo, "PATTERN_UNAPPROVED_UNDO", "patterns must not promise an unapproved undo action");

  const consentPattern = patternByIdentity.get("consent");
  const consentSendButtons = extractStartTags(consentPattern.body)
    .filter((tag) => tag.name === "button" && classTokens(tag.attributes.get("class")).has("primary"));
  assertCheck(
    consentSendButtons.length === 1
      && consentSendButtons[0].attributes.has("disabled")
      && /UNKNOWN \/ BLOCKED/.test(consentPattern.body)
      && /Provider policy/.test(consentPattern.body),
    "PATTERN_AI_POLICY_NOT_FAIL_CLOSED",
    "AI send must remain disabled while provider policy is not approved"
  );

  const prohibitedPatternPhrases = ["写下一句日记", "记录第一步", "连续记录 7 天", "本周完成", "当前没有网络"];
  const offlinePattern = patternByIdentity.get("offline");
  assertCheck(
    prohibitedPatternPhrases.every((phrase) => !patterns.includes(phrase))
      && !/步骤\s*2\s*\/\s*3/.test(patterns)
      && offlinePattern.body.includes("营养标签识别")
      && !offlinePattern.body.includes("最近记录"),
    "PATTERN_UNAPPROVED_CONTENT",
    "patterns must stay within accepted product and AI-task boundaries"
  );
  assertCheck(
    /CANDIDATE \/ NON_PRODUCTION/.test(patterns) && /静态 sheet 只验证结构/.test(patterns),
    "PATTERN_CANDIDATE_NOTICE_MISSING",
    "pattern catalog must expose its candidate and static-interaction boundary"
  );
  assertCheck(!/https?:\/\//i.test(patterns), "REMOTE_PATTERN_REFERENCE", "system patterns must not load remote resources");
  assertCheck(/<html lang="zh-CN">/.test(features), "FEATURE_CATALOG_LANGUAGE_MISSING", "feature flow catalog must declare zh-CN");
  assertCheck(countMatches(features, /class="flow"/g) === 5, "FEATURE_FLOW_COUNT_INVALID", "feature catalog must include five flows");
  assertCheck(/FOOD SEARCH/.test(features) && /NUTRITION/.test(features) && /LOCAL DATA/.test(features) && /BACKUP/.test(features) && /BYOK/.test(features), "FEATURE_FLOW_COVERAGE_MISSING", "feature flow coverage is incomplete");
  assertCheck(/未提供/.test(features) && /sourceVersion|2026\.07/.test(features), "FEATURE_PROVENANCE_MISSING", "food flows must expose missing values and source version");
  assertCheck(countMatches(features, /<article class="flow" aria-labelledby=/g) === 5, "FEATURE_HEADING_SEMANTICS_MISSING", "each feature flow must reference its accessible heading");
  assertCheck(/type="search"/.test(features) && /type="url"/.test(features) && countMatches(features, /type="password"/g) === 3, "FEATURE_FORM_SEMANTICS_MISSING", "feature flows must expose native search, URL, and secure input controls");
  assertCheck(/<dl class="nutrition">/.test(features) && /<dt>能量<\/dt><dd>71 千卡<\/dd>/.test(features), "FEATURE_NUTRITION_SEMANTICS_MISSING", "nutrition facts must expose term-before-definition semantics");
  assertCheck(countMatches(features, /<button class="chip/g) === 4 && countMatches(features, /<button type="button" class="row"/g) === 3 && countMatches(features, /class="setting action"/g) === 3, "FEATURE_ACTION_SEMANTICS_MISSING", "feature choices, results, and management actions must use native buttons");
  assertCheck(/Provider policy：未准入/.test(features) && /<button type="button" class="button" disabled[^>]*>测试连接<\/button>/.test(features), "FEATURE_AI_POLICY_NOT_FAIL_CLOSED", "AI connection testing must remain disabled while provider policy is not approved");
  assertCheck(!/至少\s*12\s*个字符/.test(features), "FEATURE_UNAPPROVED_PASSWORD_RULE", "feature flows must not freeze an unapproved backup password threshold");
  assertCheck(/\.screen\{[^}]*overflow-y:auto/.test(features) && /\.chips\{[^}]*overflow-x:auto/.test(features), "FEATURE_SCROLL_CONTRACT_MISSING", "narrow feature flows must preserve access to vertically and horizontally overflowing content");
  assertCheck(/\.nav button\{[^}]*min-height:44px/.test(features) && /\.links a\{[^}]*min-width:44px;min-height:44px/.test(features) && /\.search input\{[^}]*min-height:44px/.test(features), "FEATURE_TOUCH_TARGET_MISSING", "feature flow navigation and form controls must preserve a 44px minimum touch target");
  assertCheck(!/(?:src|href)=["']https?:\/\//i.test(features), "REMOTE_FEATURE_REFERENCE", "feature flows must not load remote resources");
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
    accessibleComponentControls: true,
    systemPatterns: 9,
    featureFlows: 5,
    accessibleFeatureControls: true,
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
