import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(toolsDir, "..");
export const visualKitDir = path.join(workspaceDir, "prototypes", "nuttie-visual-kit");

const requiredMascots = ["mascot-home", "mascot-meal", "mascot-growth", "mascot-streak"];
const referencedMascots = ["mascot-home", "mascot-meal", "mascot-growth"];

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
  const serverPath = path.join(rootDir, "server.mjs");
  const [html, svg, server] = await Promise.all([
    readFile(indexPath, "utf8"),
    readFile(mascotPath, "utf8"),
    readFile(serverPath, "utf8")
  ]);

  assertCheck(/<html\s+lang="zh-CN">/i.test(html), "HTML_LANGUAGE_MISSING", "visual kit must declare zh-CN");
  assertCheck(/<meta\s+charset="utf-8">/i.test(html), "HTML_CHARSET_MISSING", "visual kit must declare UTF-8");
  assertCheck(/<title>Nuttie visual concept<\/title>/i.test(html), "HTML_TITLE_MISSING", "visual kit title is missing");
  assertCheck(countMatches(html, /class="frame"/g) === 3, "FRAME_COUNT_INVALID", "visual kit must contain three core screens");
  assertCheck(countMatches(html, /390 × 844/g) === 3, "PHONE_SIZE_LABEL_INVALID", "each core screen must declare 390 × 844");
  assertCheck(countMatches(html, /<svg\s+class="mascot"/g) === 3, "MASCOT_INSTANCE_COUNT_INVALID", "three core screens must render a mascot");
  assertCheck(countMatches(html, /aria-label="[^"]+卡通栗子"/g) === 3, "MASCOT_A11Y_LABEL_INVALID", "each mascot must have a Chinese accessible label");
  assertCheck(!/https?:\/\//i.test(html), "REMOTE_HTML_REFERENCE", "visual kit HTML must not load remote resources");

  for (const mascotId of requiredMascots) {
    assertCheck(new RegExp(`id="${mascotId}"`).test(svg), "MASCOT_VARIANT_MISSING", `SVG is missing ${mascotId}`);
  }
  for (const mascotId of referencedMascots) {
    assertCheck(new RegExp(`mascot-sheet\\.svg#${mascotId}`).test(html), "MASCOT_REFERENCE_MISSING", `HTML is missing ${mascotId} reference`);
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
    remoteHtmlReferences: 0,
    accessibleMascots: 3,
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
