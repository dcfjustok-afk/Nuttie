import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  EXPECTED_PRERENDERED_ROUTES,
  WEB_DIRECTION_CONTRACT_COMMENT,
  WEB_DIRECTION_SEED,
  WEB_FAVICON_FILE,
} from "./web-export-contract.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_EXPORT_ROOT = path.resolve(
  path.dirname(SCRIPT_PATH),
  "../apps/app/dist",
);

export class WebExportVerificationError extends Error {
  constructor(code, message, failures = []) {
    super(message);
    this.name = "WebExportVerificationError";
    this.code = code;
    this.failures = failures;
  }
}

function normalizeNewlines(value) {
  return String(value).replace(/\r\n?/g, "\n");
}

function relativePortable(root, target) {
  return path.relative(root, target).split(path.sep).join("/");
}

async function listHtmlFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listHtmlFiles(root, absolute)));
      continue;
    }
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".html") {
      files.push(absolute);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

async function isRegularFile(target) {
  try {
    return (await stat(target)).isFile();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function bodyContents(source, file) {
  const match = normalizeNewlines(source).match(
    /<body\b[^>]*>([\s\S]*?)<\/body\s*>/i,
  );
  if (!match) {
    return {
      value: null,
      failure: {
        code: "BODY_MISSING",
        file,
        message: "HTML document has no body element",
      },
    };
  }
  return { value: match[1] };
}

function verifyContractFirstChild(source, file) {
  const body = bodyContents(source, file);
  if (body.value === null) return body.failure;
  const firstChild = body.value.replace(/^\s+/, "");
  if (!firstChild.startsWith(WEB_DIRECTION_CONTRACT_COMMENT)) {
    return {
      code: "BODY_CONTRACT_NOT_FIRST",
      file,
      message: "direction contract must be the first non-whitespace body child",
    };
  }
  return null;
}

function verifyFaviconLink(source, file) {
  const normalized = normalizeNewlines(source);
  const headMatch = normalized.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i);
  if (!headMatch) {
    return {
      code: "HEAD_MISSING",
      file,
      message: "HTML document has no head element",
    };
  }
  const hasLocalFavicon =
    /<link\b[^>]*\brel\s*=\s*["']icon["'][^>]*\bhref\s*=\s*["']\/favicon\.svg(?:["'#?])/i.test(
      headMatch[1],
    ) ||
    /<link\b[^>]*\bhref\s*=\s*["']\/favicon\.svg(?:["'#?])[^>]*\brel\s*=\s*["']icon["']/i.test(
      headMatch[1],
    );
  if (!hasLocalFavicon) {
    return {
      code: "FAVICON_LINK_MISSING",
      file,
      message: "head must link the same-origin /favicon.svg asset",
    };
  }
  return null;
}

function verifySeed(source, file) {
  if (!normalizeNewlines(source).includes(WEB_DIRECTION_SEED)) {
    return {
      code: "DIRECTION_SEED_MISSING",
      file,
      message: `built HTML must contain direction seed ${WEB_DIRECTION_SEED}`,
    };
  }
  return null;
}

async function routeFailures(exportRoot, expectedRoutes) {
  const checks = await Promise.all(
    Object.entries(expectedRoutes).map(async ([route, relativePath]) => ({
      route,
      relativePath,
      exists: await isRegularFile(path.join(exportRoot, relativePath)),
    })),
  );
  return checks
    .filter(({ exists }) => !exists)
    .map(({ route, relativePath }) => ({
      code: "PRERENDERED_ROUTE_MISSING",
      file: relativePath,
      message: `route ${route} must be pre-rendered at ${relativePath}`,
    }));
}

/**
 * Verify a static Expo Web export without starting a browser or server.
 *
 * Every generated HTML entry is checked because route-group copies, the
 * sitemap, and the not-found page are all shipped artifacts too. Canonical
 * route files are checked separately so a partial export cannot pass merely
 * because one duplicate happened to contain the right markup.
 */
export async function verifyWebExport({
  exportRoot = DEFAULT_EXPORT_ROOT,
  expectedRoutes = EXPECTED_PRERENDERED_ROUTES,
} = {}) {
  const root = path.resolve(exportRoot);
  const failures = [];
  if (!(await isRegularFile(path.join(root, WEB_FAVICON_FILE)))) {
    failures.push({
      code: "FAVICON_FILE_MISSING",
      file: WEB_FAVICON_FILE,
      message: "export root must contain a regular favicon.svg file",
    });
  } else {
    const favicon = await readFile(path.join(root, WEB_FAVICON_FILE), "utf8");
    if (
      !/<svg\b/i.test(favicon) ||
      !/<title\b[^>]*>Nuttie<\/title>/i.test(favicon)
    ) {
      failures.push({
        code: "FAVICON_INVALID",
        file: WEB_FAVICON_FILE,
        message: "favicon.svg must be an SVG with an accessible Nuttie title",
      });
    }
  }

  let htmlFiles;
  try {
    htmlFiles = await listHtmlFiles(root);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new WebExportVerificationError(
        "WEB_EXPORT_MISSING",
        `web export directory does not exist: ${root}`,
      );
    }
    throw error;
  }
  if (htmlFiles.length === 0) {
    failures.push({
      code: "HTML_MISSING",
      file: ".",
      message: "export root must contain at least one .html file",
    });
  }

  for (const absoluteFile of htmlFiles) {
    const file = relativePortable(root, absoluteFile);
    const source = await readFile(absoluteFile, "utf8");
    for (const failure of [
      verifyContractFirstChild(source, file),
      verifySeed(source, file),
      verifyFaviconLink(source, file),
    ]) {
      if (failure) failures.push(failure);
    }
  }
  failures.push(...(await routeFailures(root, expectedRoutes)));

  if (failures.length > 0) {
    throw new WebExportVerificationError(
      "WEB_EXPORT_VERIFICATION_FAILED",
      `${failures.length} static web export contract check(s) failed`,
      failures,
    );
  }

  return Object.freeze({
    ok: true,
    exportRoot: root,
    htmlFiles: htmlFiles.map((file) => relativePortable(root, file)),
    htmlFileCount: htmlFiles.length,
    prerenderedRoutes: Object.keys(expectedRoutes),
    favicon: WEB_FAVICON_FILE,
    directionSeed: WEB_DIRECTION_SEED,
    checks: Object.freeze({
      bodyContractFirstChild: true,
      seed: true,
      favicon: true,
      prerenderedRoutes: true,
    }),
  });
}

function parseArgs(argv) {
  const positional = argv.filter((argument) => !argument.startsWith("-"));
  return {
    exportRoot: positional[0] ?? DEFAULT_EXPORT_ROOT,
    json: argv.includes("--json"),
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(SCRIPT_PATH)
) {
  const { exportRoot, json } = parseArgs(process.argv.slice(2));
  try {
    const report = await verifyWebExport({ exportRoot });
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    const report = {
      ok: false,
      code: error?.code ?? "WEB_EXPORT_VERIFICATION_FAILED",
      message: error instanceof Error ? error.message : String(error),
      failures: error?.failures ?? [],
    };
    if (json || error?.failures) console.error(JSON.stringify(report, null, 2));
    else console.error(report.message);
    process.exitCode = 1;
  }
}
